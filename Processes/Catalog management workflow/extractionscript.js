"use strict";
/* eslint-disable class-methods-use-this */
// noinspection JSMethodCanBeStatic
var ExtractionScript;
(function (ExtractionScript) {
    var CatalogManagement = Lib.Purchasing.CatalogManagement;
    class Main {
        constructor(catalogManagementServer, catalogManagementWorkflowServer, isInternalUpdateRequest, isFromInboundChannel) {
            this.catalogManagementServer = catalogManagementServer;
            this.catalogManagementWorkflowServer = catalogManagementWorkflowServer;
            this.isInternalUpdateRequest = isInternalUpdateRequest;
            this.isFromInboundChannel = isFromInboundChannel;
            this.currentName = Data.GetActionName();
            this.currentAction = Data.GetActionType();
            if (isFromInboundChannel && isInternalUpdateRequest) {
                this.currentName = "save";
                this.currentAction = "reprocess";
            }
            this.vendorLogin = Lib.P2P.GetValidatorOrOwner().GetValue("AccountId") + "$" + Data.GetValue("RequesterLogin__");
            Log.Info("-- Catalog Management Workflow Extraction Script -- Name: '" + (this.currentName ? this.currentName : "<empty>") + "', Action: '" + (this.currentAction ? this.currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
        }
        UpdateParentProcess(action, data) {
            const transport = Process.GetUpdatableTransportAsProcessAdmin(Variable.GetValueAsString("CMRUIDEX"));
            const externalVars = transport.GetExternalVars();
            if (data) {
                const resumeWithActionData = JSON.stringify(data);
                externalVars.AddValue_String("resumeWithActionData", resumeWithActionData, true);
            }
            if (!transport.ResumeWithAction(action, false)) {
                const transport2 = Process.GetUpdatableTransportAsProcessAdmin(Variable.GetValueAsString("CMRUIDEX"));
                transport2.ResumeWithActionAsync(action);
                Log.Info("ResumeWithAction " + action + " delayed " + Variable.GetValueAsString("CMRUIDEX"));
            }
        }
        InitWorkflow() {
            Log.Info("Initializing workflow");
            this.catalogManagementWorkflowServer.UpdateControlerParamters();
            this.catalogManagementWorkflowServer.controller.SetRolesSequence(["requester", "approver"]);
            this.catalogManagementWorkflowServer.controller.AllowRebuild(this.catalogManagementWorkflowServer.controller.GetContributorIndex() == 0);
            Log.Info("Initialization of workflow done");
            // Verify there are no workflow errors
            if (!this.isInternalUpdateRequest && Variable.GetValueAsString("MissingWorkflowRuleError") == "true") {
                // The following sends a notification to the admin, who is the same as the process owner
                CatalogManagement.Server.SendEmailNotification(Data.GetValue("OwnerID"), "CM-CatalogManager_MissingWorkflowRules.htm", true);
                CatalogManagement.Server.SendEmailNotification(this.vendorLogin, "CM-Vendor_ImportFail_MissingWorkflowRules.htm", true);
                this.UpdateParentProcess("MissingWorkflowRules", { errorMsg: Variable.GetValueAsString("WorkflowErrorMessage") });
                // Put the process in error state 200
                Data.SetValue("Status__", "Failed");
                Data.SetValue("State", 200);
            }
        }
        PerformFirstWorkflowStep() {
            const currentContributor = this.catalogManagementWorkflowServer.controller.GetContributorAt(0);
            Log.Info("Do action " + currentContributor.action + " for " + currentContributor.name);
            this.catalogManagementWorkflowServer.controller.DoAction(currentContributor.action);
        }
        async Start() {
            this.InitWorkflow();
            if (this.isInternalUpdateRequest || (!this.isInternalUpdateRequest && this.isFromInboundChannel)) {
                try {
                    await this.catalogManagementServer.ReadCSVAndSetExtractedDataToProcess();
                    if (!this.isInternalUpdateRequest && this.isFromInboundChannel) {
                        const submissionDate = new Date(parseInt(Variable.GetValueAsString("SubmissionTime"), 10));
                        Data.SetValue("SubmissionDateTime__", submissionDate);
                    }
                }
                catch (e) {
                    Log.Error("Error in CSV extraction : " + e);
                    if (e.stack) {
                        Log.Error("StackTrace : " + e.stack);
                    }
                    Data.SetValue("Status__", "Failed");
                    Data.SetValue("State", 100);
                }
                if (this.catalogManagementServer.IsCMSubmitable()) {
                    Variable.SetValueAsString("IsCMSubmitable", "true");
                }
                else {
                    Variable.SetValueAsString("IsCMSubmitable", "false");
                }
            }
            else {
                // Set submission date time from timestamp
                // AddValue_Date sends the date with the server timezone not UTC, but still puts utc=1 in the process CD
                // So the CM process adds an external variable to the CMW instance to pass through the submission date's timestamp
                const submissionDate = new Date(parseInt(Variable.GetValueAsString("SubmissionTime"), 10));
                Data.SetValue("SubmissionDateTime__", submissionDate);
                this.PerformFirstWorkflowStep();
            }
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const warehouseid = Variable.GetValueAsString("warehouseid");
        if (!Data.GetActionName() && !Data.GetActionType() && !!Data.GetValue("SourceRUID")) {
            Variable.SetValueAsString("CatalogManagmentType", "internal");
            Variable.SetValueAsString("CatalogManagmentSource", "inboundChannel");
        }
        let maxlines = parseInt(Variable.GetValueAsString("MAXLINES"));
        if (isNaN(maxlines)) {
            maxlines = CatalogManagement.maxCSVLinesSupported;
        }
        if (warehouseid) {
            const warehouseId = Data.GetValue("WarehouseNumber__");
            const companyCode = Data.GetValue("CompanyCode__");
            const mappingWarehouseItem = new CatalogManagement.MappingWarehouse();
            const catalogManagementServerWarehouse = new CatalogManagement.ServerWarehouse(mappingWarehouseItem, companyCode, warehouseId, maxlines);
            const catalogManagementWorkflowServerWarehouse = new CatalogManagement.WorkflowServer(catalogManagementServerWarehouse, true, false);
            const main = new Main(catalogManagementServerWarehouse, catalogManagementWorkflowServerWarehouse, true, false);
            Lib.P2P.HandleScriptError(main.Start());
        }
        else {
            const isInternalUpdateRequest = CatalogManagement.IsInternalVendorUpdateRequest();
            const isFromInboundChannel = CatalogManagement.IsFromInboundChannelVendorUpdateRequest();
            const mappingVendorItem = new CatalogManagement.MappingVendor();
            const catalogManagementServerVendor = new CatalogManagement.ServerVendor(mappingVendorItem, isInternalUpdateRequest, maxlines);
            const catalogManagementWorkflowServerVendor = new CatalogManagement.WorkflowServer(catalogManagementServerVendor, isInternalUpdateRequest, isFromInboundChannel);
            const main = new Main(catalogManagementServerVendor, catalogManagementWorkflowServerVendor, isInternalUpdateRequest, isFromInboundChannel);
            Lib.P2P.HandleScriptError(main.Start());
        }
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map