"use strict";
/* eslint-disable class-methods-use-this */
var validationscript;
(function (validationscript) {
    var CatalogManagement = Lib.Purchasing.CatalogManagement;
    class Main {
        constructor(catalogManagementWorkflow, actionName, actionType) {
            this.catalogManagementWorkflow = catalogManagementWorkflow;
            this.actionName = actionName;
            this.actionType = actionType;
        }
        async Start() {
            Log.Info("-- Catalog Management Workflow Validation Script -- Name: '" + (this.actionName ? this.actionName : "<empty>") + "', Action: '" + (this.actionType ? this.actionType : "<empty>") + "' , Device: '" + Data.GetActionDevice());
            this.InitWorkflow();
            if (!this.actionName && !this.actionType) {
            }
            else if (this.actionType === "approve_asynchronous" || this.actionType === "approve" || this.actionType === "ResumeWithAction") {
                if (this.actionName == "save") {
                    // first call of the validation script when a user clicks an action button.
                    // nothing todo here because the XGF isn't saved after execution.
                }
                if (this.actionName == "Failed") {
                    CatalogManagement.WorkflowServer.SetImportFailedStatusAndNotify();
                }
                else if (this.actionName == "saveBeforeSubmit") {
                    Process.RecallScript("Submit", true);
                }
                else if (this.actionName == "Submit") {
                    const idx = this.catalogManagementWorkflow.controller.GetContributorIndex();
                    const currentContributor = this.catalogManagementWorkflow.controller.GetContributorAt(idx);
                    Log.Info("Do action " + currentContributor.action + " for " + currentContributor.name);
                    this.catalogManagementWorkflow.controller.DoAction(currentContributor.action);
                }
                else if (this.actionName == "Reject") {
                    this.catalogManagementWorkflow.controller.DoAction("reject");
                }
                else {
                    // The exception is caught by the flexible framework.
                    // The exception prevents the document from being approved.
                    throw "Unknown action '" + this.actionName + "'";
                }
            }
            const cc = Data.GetValue("CompanyCode__");
            if (cc) {
                await this.InitArchiveDurationForCompanyCode(cc);
            }
            else {
                const userLogin = Lib.P2P.GetValidatorOrOwner().GetValue("Login");
                const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(userLogin);
                if (UserPropertiesValues.CompanyCode__) {
                    await this.InitArchiveDurationForCompanyCode(UserPropertiesValues.CompanyCode__);
                }
            }
        }
        InitWorkflow() {
            Log.Info("Initializing workflow");
            this.catalogManagementWorkflow.UpdateControlerParamters();
            this.catalogManagementWorkflow.controller.AllowRebuild(false);
            Log.Info("Initialization of workflow done");
        }
        // Defines what must be done depending on requested action.
        async InitArchiveDurationForCompanyCode(companyCode) {
            const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(companyCode);
            Sys.Parameters.GetInstance("PAC").Reload(CCValues.DefaultConfiguration__);
            await Lib.P2P.InitValidityDateTime("PAC");
            await Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const warehouseid = Variable.GetValueAsString("warehouseid");
        let maxlines = parseInt(Variable.GetValueAsString("MAXLINES"));
        if (isNaN(maxlines)) {
            maxlines = CatalogManagement.maxCSVLinesSupported;
        }
        if (warehouseid) {
            const mappingWarehouseItem = new CatalogManagement.MappingWarehouse();
            const warehouseId = Data.GetValue("WarehouseNumber__");
            const companyCode = Data.GetValue("CompanyCode__");
            const catalogManagementServerWarehouse = new CatalogManagement.ServerWarehouse(mappingWarehouseItem, companyCode, warehouseId, maxlines);
            const catalogManagementWorkflowServerWarehouse = new CatalogManagement.WorkflowServer(catalogManagementServerWarehouse, true, false);
            const main = new Main(catalogManagementWorkflowServerWarehouse, Data.GetActionName(), Data.GetActionType());
            Lib.P2P.HandleScriptError(main.Start());
        }
        else {
            const isInternalUpdateRequest = CatalogManagement.IsInternalVendorUpdateRequest();
            const isFromInboundChannel = CatalogManagement.IsFromInboundChannelVendorUpdateRequest();
            const mappingVendorItem = new CatalogManagement.MappingVendor();
            const catalogManagementServerVendor = new CatalogManagement.ServerVendor(mappingVendorItem, isInternalUpdateRequest, maxlines);
            const catalogManagementWorkflowServerVendor = new CatalogManagement.WorkflowServer(catalogManagementServerVendor, isInternalUpdateRequest, isFromInboundChannel);
            let actionName = Data.GetActionName();
            let actionType = Data.GetActionType();
            if (!actionName && !actionType && isFromInboundChannel) {
                actionType = "approve_asynchronous";
                const isInError = CatalogManagement.IsInError();
                if (isInError) {
                    actionName = "Failed";
                }
                else {
                    actionName = "Submit";
                }
                if (isInternalUpdateRequest) {
                    const userLogin = Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OwnerID"));
                    Data.SetValue("RequesterLogin__", userLogin);
                    Data.SetValue("RequesterName__", Users.GetUserAsProcessAdmin(userLogin).GetValue("DisplayName"));
                }
                Data.SetValue("ImportDescription__", Language.Translate("_ProcessCreatedByInboundChannel"));
            }
            const main = new Main(catalogManagementWorkflowServerVendor, actionName, actionType);
            Lib.P2P.HandleScriptError(main.Start());
        }
    }
})(validationscript || (validationscript = {}));
//# sourceMappingURL=validationscript.js.map