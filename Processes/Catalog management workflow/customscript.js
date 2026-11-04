"use strict";
/* eslint-disable class-methods-use-this,no-empty-function */
var CustomScript;
(function (CustomScript) {
    var CatalogManagement = Lib.Purchasing.CatalogManagement;
    var Warehouse = Lib.P2P.Inventory.Warehouse;
    let ApprovalCommentCheck;
    (function (ApprovalCommentCheck) {
        function GetCommentField() {
            return Controls.Comments__;
        }
        // Fill dialog callback: Design and instantiation of the controls
        function fill_CB(dialogTexts) {
            return function (dialog /*, tabId, event, control*/) {
                const commentValue = GetCommentField().GetValue();
                const ctrl = dialog.AddDescription("ctrlDesc", null, 466);
                if (Sys.Helpers.IsEmpty(commentValue)) {
                    ctrl.SetText(Language.Translate(dialogTexts.descriptionRequired));
                }
                else {
                    ctrl.SetText(Language.Translate(dialogTexts.descriptionConfirmation));
                }
                let commentCtrl = dialog.AddMultilineText("ctrlComments", "_Comment", 400);
                dialog.RequireControl(commentCtrl);
                commentCtrl.SetValue(commentValue);
            };
        }
        // Validate dialog callback: checks if required fields are set
        function validate_CB(dialog /*, tabId, event, control*/) {
            if (!dialog.GetControl("ctrlComments").GetValue()) {
                dialog.GetControl("ctrlComments").SetError("This field is required!");
                return false;
            }
            return true;
        }
        // Commit dialog callback: updates the process form with dialog results
        function commit_CB(anAction, onCommitted) {
            let action = anAction;
            return function (dialog /*, tabId, event, control*/) {
                const newValue = dialog.GetControl("ctrlComments").GetValue();
                GetCommentField().SetValue(newValue);
                GetCommentField().SetError("");
                ProcessInstance.Approve(action);
                if (Sys.Helpers.IsFunction(onCommitted)) {
                    onCommitted();
                }
            };
        }
        function OnClick(action, dialogTexts, onCommitted) {
            const defaultDialogTexts = {
                titleConfirmation: "_Approval comments confirmation",
                titleRequired: "_Approval comments required",
                descriptionConfirmation: "_Please confirm your comment:",
                descriptionRequired: "_Please write your comment:"
            };
            if (!dialogTexts) {
                dialogTexts = defaultDialogTexts;
            }
            else {
                for (const att in defaultDialogTexts) {
                    if (!(att in dialogTexts)) {
                        dialogTexts[att] = defaultDialogTexts[att];
                    }
                }
            }
            const title = GetCommentField().GetValue() ? dialogTexts.titleConfirmation : dialogTexts.titleRequired;
            Popup.Dialog(title, null, fill_CB(dialogTexts), commit_CB(action, onCommitted), validate_CB);
            return false;
        }
        ApprovalCommentCheck.OnClick = OnClick;
    })(ApprovalCommentCheck || (ApprovalCommentCheck = {}));
    class Main {
        constructor(mapping, catalogManagementClient, catalogManagementWorkflowClient, isInternalUpdateRequest) {
            this.ctrlTables = [
                Controls.AddedItems__,
                Controls.ModifiedItems__,
                Controls.DeletedItems__
            ];
            this.ctrlTableAllNames = [
                "Number__",
                "CompanyCode__",
                "VendorNumber__",
                "Description__",
                "CurrentStock__",
                "ManufacturerName__",
                "UnitPrice__",
                "Currency__",
                "UnitOfMeasure__",
                "UNSPSC__",
                "CurrentStock__",
                "MinimumThreshold__",
                "ExpectedStockLevel__",
                "DefaultReplenishmentVendorName__",
                "LeadTime__"
            ];
            this.mapping = mapping;
            this.catalogManagementClient = catalogManagementClient;
            this.catalogManagementWorkflowClient = catalogManagementWorkflowClient;
            this.isInternalUpdateRequest = isInternalUpdateRequest;
            this.currentStatus = Data.GetValue("Status__");
        }
        SetWizardStep(step) {
            const STEPS = {
                "import": "color9",
                "workflow": "color9",
                "summary": "color9"
            };
            STEPS[step] = "color8";
            Controls.ImportStepButton__.SetTextColor(STEPS["import"]);
            Controls.WorkflowStepButton__.SetTextColor(STEPS.workflow);
            Controls.SummaryStepButton__.SetTextColor(STEPS.summary);
        }
        InitLayoutHeader() {
            // hide all, children class choose to show
            Controls.CompanyCode__.Hide(true);
            Controls.VendorNumber__.Hide(true);
            Controls.VendorName__.Hide(true);
            Controls.WarehouseNumber__.Hide(true);
            Controls.WarehouseName__.Hide(true);
        }
        InitLayoutTablesItemColumns() {
            var _a;
            // Hide all, children class choose to show
            for (const table of this.ctrlTables) {
                for (const key of this.ctrlTableAllNames) {
                    if ((_a = table[key]) === null || _a === void 0 ? void 0 : _a.Hide) {
                        table[key].Hide(true);
                    }
                }
            }
        }
        InitLayout() {
            Controls.Submit.SetLabel(this.GetSubmitLabelDefault());
            Controls.Comments__.SetPlaceholder(Language.Translate("_Enter a comment"));
            Controls.ImportDescription__.Hide(false);
            Controls.RequesterName__.Hide(false);
            Controls.RequesterLogin__.Hide(true);
            Controls.Status__.Hide(false);
            this.InitLayoutHeader();
            this.InitAttachmentsPane();
            Controls.GeneralInformationsPane.Hide(false);
            Controls.WorkflowPane.Hide(this.catalogManagementWorkflowClient.controller.GetNbContributors() < 2);
            Controls.WorkflowStepButton__.Hide(this.catalogManagementWorkflowClient.controller.GetNbContributors() < 2);
            Controls.Spacer3__.Hide(this.catalogManagementWorkflowClient.controller.GetNbContributors() < 2);
            this.InitLayoutTablesItemColumns();
        }
        InitImportStep() {
            this.SetWizardStep("import");
            Controls.Reason__.Hide(true);
            Controls.Reject.Hide(true);
            Controls.Revert.Hide(true);
            Controls.SubmissionDateTime__.Hide(true);
            Controls.ValidationDateTime__.Hide(true);
            Controls.ImportDescription__.SetReadOnly(false);
            if (Sys.Helpers.IsEmpty(Data.GetValue("RequesterLogin__"))) {
                Data.SetValue("RequesterLogin__", User.loginId);
                Data.SetValue("RequesterName__", User.fullName);
            }
            const lineDisplayed = this.catalogManagementClient.DisplayPreviews(true);
            const CSVhasError = this.catalogManagementClient.DisplayParsingError();
            Controls.Submit.SetLabel(this.GetSubmitLabelImportStep());
            Controls.Submit.SetDisabled(CSVhasError || Attach.GetNbAttach() === 0 || lineDisplayed === 0);
        }
        InitAttachmentsPane() {
            const hasAttachment = !!Attach.GetNbAttach();
            ProcessInstance.DisableAttachmentUpload(hasAttachment);
            Controls.AttachmentsPane.OnAttachmentAdded = function () {
                if (Data.GetValue("Status__") === "Draft") {
                    if (Attach.GetNbAttach() > 1) {
                        Attach.RemoveAttach(0);
                    }
                    ProcessInstance.Resubmit("Document");
                }
            };
        }
        InitWorkflowStep() {
            this.SetWizardStep("workflow");
            Controls.ValidationDateTime__.Hide(true);
            Controls.Reason__.Hide(true);
            Controls.SubmissionDateTime__.Hide(false);
            Controls.ParsingErrorsPane.Hide(true);
            this.catalogManagementClient.DisplayPreviews(true);
            const CSVhasError = this.catalogManagementClient.DisplayParsingError();
            Controls.Submit.SetLabel(this.GetSubmitLabelImportStep());
            Controls.Submit.SetDisabled(CSVhasError || Attach.GetNbAttach() === 0);
            Controls.Revert.Hide(true);
            if (Variable.GetValueAsString("CSVProcessingError") === "true") {
                Controls.Comments__.Hide(true);
                Controls.Submit.Hide(true);
                Controls.Reject.Hide(true);
                Lib.CommonDialog.PopupYesCancel((action) => {
                    if (action === "Yes") {
                        Variable.SetValueAsString("CSVProcessingError", "false");
                        ProcessInstance.ApproveAsynchronous("Submit");
                    }
                    else {
                        ProcessInstance.Quit("Quit");
                    }
                }, "_CSV Import Error", "_Some error occured, whould you like to retry ?", "_Retry", "_Quit");
            }
            else {
                Controls.Comments__.Hide(false);
                Controls.Submit.Hide(false);
                Controls.Reject.Hide(false);
            }
        }
        async InitResultStep(displayPreviews) {
            this.SetWizardStep("summary");
            Controls.ValidationDateTime__.Hide(false);
            Controls.Comments__.Hide(true);
            Controls.Reason__.Hide(Sys.Helpers.IsEmpty(Data.GetValue("Reason__")));
            Controls.SubmissionDateTime__.Hide(false);
            Controls.Submit.Hide(true);
            Controls.Reject.Hide(true);
            Controls.ParsingErrorsPane.Hide(true);
            this.catalogManagementClient.DisplayParsingError();
            this.catalogManagementClient.DisplayPreviews(displayPreviews);
            await this.InitControlsRevert();
        }
        HideTechnicalFields() {
            Controls.NextProcess.Hide(true);
            Controls.SystemData.Hide(true);
        }
        HandleEvents() {
            Controls.Submit.OnClick = function () {
                const isValid = Process.ShowFirstError() === null;
                if (isValid) {
                    ProcessInstance.ApproveAsynchronous("saveBeforeSubmit");
                }
                return false;
            };
            Controls.Reject.OnClick = function () {
                ApprovalCommentCheck.OnClick("Reject", {
                    titleConfirmation: "_Reject comments confirmation",
                    titleRequired: "_Reject comments required",
                    descriptionConfirmation: "_Please provide a reason for rejection:",
                    descriptionRequired: "_Rejection reason is required:"
                });
                return false;
            };
            Controls.Revert.OnClick = this.RevertOnClick.bind(this);
        }
        InitWorkflow() {
            Log.Info("Initializing workflow");
            this.catalogManagementWorkflowClient.UpdateControlerParamters();
            this.catalogManagementWorkflowClient.controller.AllowRebuild(false);
            Log.Info("Initialization of workflow done");
        }
        InitIsExternal() {
            const isExternal = Variable.GetValueAsString("CatalogManagmentType");
            if (!isExternal) {
                Variable.SetValueAsString("CatalogManagmentType", "internal");
            }
            Controls.IsInternalUpdateRequest__.Check(this.isInternalUpdateRequest);
        }
        async InitFeedLayout() {
        }
        async Start() {
            ProcessInstance.SetSilentChange(true);
            this.InitProcessDisplayName();
            this.InitIsExternal();
            this.InitWorkflow();
            this.InitLayout();
            this.catalogManagementWorkflowClient.InitWorkflowLayout();
            switch (this.currentStatus) {
                case "Approved":
                case "Reverted":
                    await this.InitResultStep(true);
                    break;
                case "Rejected":
                    await this.InitResultStep(false);
                    break;
                case "Failed":
                    await this.InitResultStep(false);
                    break;
                case "ToApprove":
                    this.InitWorkflowStep();
                    break;
                default:
                    this.InitImportStep();
                    break;
            }
            this.HideTechnicalFields();
            this.HandleEvents();
            Lib.CommonDialog.NextAlert.Show();
            return await this.InitFeedLayout();
        }
    }
    class MainVendor extends Main {
        constructor(mapping, catalogManagementClient, catalogManagementWorkflowClient, isInternalUpdateRequest) {
            super(mapping, catalogManagementClient, catalogManagementWorkflowClient, isInternalUpdateRequest);
            this.ctrlTablesNames = [
                "CompanyCode__",
                "VendorNumber__",
                "Number__",
                "Description__",
                "ManufacturerName__",
                "UnitPrice__",
                "Currency__",
                "UnitOfMeasure__",
                "UNSPSC__"
            ];
            this.ctrlTablesNamesExternal = [
                "CompanyCode__",
                "VendorNumber__"
            ];
            Process.SetHelpId(5024);
        }
        InitLayoutHeader() {
            super.InitLayoutHeader();
            Controls.CompanyCode__.Hide(this.isInternalUpdateRequest);
            Controls.VendorNumber__.Hide(this.isInternalUpdateRequest);
            Controls.VendorName__.Hide(this.isInternalUpdateRequest);
        }
        RevertOnClick() {
            this.catalogManagementWorkflowClient.RevertManager();
            return false;
        }
        async InitControlsRevert() {
            if (this.currentStatus === "Approved") {
                Controls.Revert.SetDisabled(true);
                const lastCMW = await this.catalogManagementWorkflowClient.GetLastApprovedUpdateRequest();
                const isLastApprovedCMW = Data.GetValue("RUIDEX") === lastCMW;
                Controls.Revert.SetDisabled(!isLastApprovedCMW);
            }
            else {
                Controls.Revert.Hide(true);
            }
        }
        InitLayoutTablesItemColumns() {
            var _a;
            super.InitLayoutTablesItemColumns();
            for (const table of this.ctrlTables) {
                for (const key of this.ctrlTablesNames) {
                    if ((_a = table[key]) === null || _a === void 0 ? void 0 : _a.Hide) {
                        table[key].Hide(!this.isInternalUpdateRequest &&
                            Sys.Helpers.Array.FindIndex(this.ctrlTablesNamesExternal, (k) => k === key) !== -1);
                    }
                }
            }
        }
        InitProcessDisplayName() {
        }
        GetSubmitLabelDefault() {
            return "_Submit";
        }
        GetSubmitLabelImportStep() {
            return "_Submit_catalog_update";
        }
    }
    class MainWarehouse extends Main {
        constructor(mapping, catalogManagementClient, catalogManagementWorkflowClient, warehouseid, companyCode) {
            super(mapping, catalogManagementClient, catalogManagementWorkflowClient, true);
            this.ctrlTablesNames = [
                "Number__",
                "CurrentStock__",
                "MinimumThreshold__",
                "ExpectedStockLevel__",
                "LeadTime__",
                "UnitPrice__"
            ];
            Process.SetHelpId(5048);
            this.warehouseid = warehouseid;
            this.companyCode = companyCode;
            Data.SetValue("WarehouseNumber__", this.warehouseid);
            Variable.SetValueAsString("warehouseid", this.warehouseid);
            Data.SetValue("CompanyCode__", this.companyCode);
            Variable.SetValueAsString("companyCode", this.companyCode);
        }
        InitLayoutHeader() {
            super.InitLayoutHeader();
            Controls.CompanyCode__.Hide(false);
            Controls.WarehouseNumber__.Hide(false);
            Controls.WarehouseName__.Hide(false);
        }
        async GetWarehouseName() {
            const warehouse = await Warehouse.GetWarehouse(this.companyCode, this.warehouseid);
            return warehouse.name;
        }
        async InitFeedLayout() {
            await super.InitFeedLayout();
            const warehouseName = await this.GetWarehouseName();
            Data.SetValue("WarehouseName__", warehouseName);
        }
        RevertOnClick() {
            // No revert for warehouse
            return false;
        }
        async InitControlsRevert() {
            Controls.Revert.Hide(true);
        }
        InitLayoutTablesItemColumns() {
            var _a;
            super.InitLayoutTablesItemColumns();
            for (const table of this.ctrlTables) {
                for (const key of this.ctrlTablesNames) {
                    if ((_a = table[key]) === null || _a === void 0 ? void 0 : _a.Hide) {
                        table[key].Hide(false);
                    }
                }
                table.Number__.SetLabel("_Preview_item_number_column");
            }
        }
        InitProcessDisplayName() {
            Controls.form_header.SetProcessDisplayName(Language.Translate("_Process_title_warehouse_import"));
        }
        GetSubmitLabelDefault() {
            return "_Submit_warehouse_update";
        }
        GetSubmitLabelImportStep() {
            return "_Submit_warehouse_update";
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const warehouseid = Process.GetURLParameter("warehouseid") || Variable.GetValueAsString("warehouseid");
        const companyCode = Process.GetURLParameter("companyCode") || Variable.GetValueAsString("companyCode");
        if (warehouseid) {
            const mappingWarehouseItem = new CatalogManagement.MappingWarehouse();
            const catalogManagementClientWarehouse = new CatalogManagement.ClientWarehouse();
            const catalogManagementWorkflowClientWarehouse = new CatalogManagement.WorkflowClientWarehouse();
            const main = new MainWarehouse(mappingWarehouseItem, catalogManagementClientWarehouse, catalogManagementWorkflowClientWarehouse, warehouseid, companyCode);
            main.Start();
        }
        else {
            const isInternalUpdateRequest = CatalogManagement.IsInternalVendorUpdateRequest();
            const isFromInboundChannel = CatalogManagement.IsFromInboundChannelVendorUpdateRequest();
            const mappingVendorItem = new CatalogManagement.MappingVendor();
            const clientHelperVendorItem = new CatalogManagement.ClientVendor(isInternalUpdateRequest);
            const clientHelperWkfVendorItem = new CatalogManagement.WorkflowClientVendor(isInternalUpdateRequest, isFromInboundChannel);
            const main = new MainVendor(mappingVendorItem, clientHelperVendorItem, clientHelperWkfVendorItem, isInternalUpdateRequest);
            main.Start();
        }
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map