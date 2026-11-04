"use strict";
/* eslint-disable class-methods-use-this */
var CustomScript;
(function (CustomScript) {
    var CatalogManagement = Lib.Purchasing.CatalogManagement;
    let CompanyHelper;
    (function (CompanyHelper) {
        CompanyHelper.hasError = false;
        let VendorLinkInfo = {};
        function GetCompanyValues() {
            const comboValues = [];
            const companies = VendorLinkInfo;
            if (Object.keys(companies).length === 0) {
                return comboValues;
            }
            for (const companyCode in companies) {
                if (companies.hasOwnProperty(companyCode)) {
                    comboValues.push(companyCode + "=" + companies[companyCode].CompanyName__);
                }
            }
            return comboValues;
        }
        CompanyHelper.GetCompanyValues = GetCompanyValues;
        function GetVendorNumber() {
            return VendorLinkInfo[Data.GetValue("CompanyCode__")].VendorNumber__;
        }
        CompanyHelper.GetVendorNumber = GetVendorNumber;
        function GetVendorName() {
            return VendorLinkInfo[Data.GetValue("CompanyCode__")].VendorName__;
        }
        CompanyHelper.GetVendorName = GetVendorName;
        function InitCompanyBrowse() {
            if (Variable.GetValueAsString("vendorLinksInfos") !== "{}") {
                VendorLinkInfo = JSON.parse(Variable.GetValueAsString("vendorLinksInfos"));
                const comboValues = GetCompanyValues();
                const selectedCompanyCode = Data.GetValue("CompanyCode__");
                if (comboValues.length) {
                    Controls.CompanyCode__.SetText(comboValues.join("\n"));
                    Controls.CompanyCode__.SetRequired(true);
                }
                if (selectedCompanyCode && selectedCompanyCode !== "null") {
                    if (!comboValues.length) {
                        Controls.CompanyCode__.SetText(selectedCompanyCode);
                    }
                    Controls.CompanyCode__.SetValue(selectedCompanyCode);
                }
                Controls.CompanyCode__.Hide(comboValues.length <= 1);
            }
            else {
                CompanyHelper.hasError = true;
                Controls.CompanyCode__.Hide(true);
                Popup.Alert(["_PleaseContactYourBuyer:No Vendor link record"], true, null, "_Submission failed");
            }
        }
        CompanyHelper.InitCompanyBrowse = InitCompanyBrowse;
    })(CompanyHelper || (CompanyHelper = {}));
    class Main {
        constructor(catalogManagementClientVendor) {
            this.catalogManagementClientVendor = catalogManagementClientVendor;
            this.currentStatus = Data.GetValue("Status__");
        }
        InitImportStep() {
            Controls.HelpDescription__.SetWidth("495px");
            Controls.HelpDescription__.Hide(false);
            Controls.ImportStepButton__.SetTextColor("color8");
            Controls.WorkflowStepButton__.SetTextColor("color9");
            Controls.SummaryStepButton__.SetTextColor("color9");
            Controls.GeneralInformationsPane.Hide(false);
            Controls.Status__.Hide(true);
            Controls.Reason__.Hide(true);
            Controls.RequesterLogin__.Hide(true);
            Controls.RequesterName__.Hide(true);
            if (Sys.Helpers.IsEmpty(Data.GetValue("RequesterLogin__"))) {
                Data.SetValue("RequesterLogin__", User.loginId);
                Data.SetValue("RequesterName__", User.fullName);
                Controls.CompanyCode__.Hide(true);
            }
            else {
                CompanyHelper.InitCompanyBrowse();
            }
            Controls.SubmissionDateTime__.Hide(true);
            Controls.ValidationDateTime__.Hide(true);
            Controls.ImportDescription__.Hide(false);
            Controls.DownloadTemplate__.Hide(false);
            const lineDisplayed = this.catalogManagementClientVendor.DisplayPreviews(true);
            const CSVhasError = this.catalogManagementClientVendor.DisplayParsingError();
            const previousCompanyCode = Data.GetValue("CompanyCode__");
            Controls.CompanyCode__.OnChange = function () {
                function onConfirmOKClick() {
                    Data.SetValue("VendorNumber__", CompanyHelper.GetVendorNumber());
                    Data.SetValue("VendorName__", CompanyHelper.GetVendorName());
                    //DO NOT CHANGE ACTION NAME : Document action name is used with keepUserDataWhenChangingDocument to keep the user Data when reprocessing
                    ProcessInstance.Resubmit("Document");
                }
                function onConfirmCancelClick() {
                    Data.SetValue("CompanyCode__", previousCompanyCode);
                }
                Popup.Confirm(["_The document will be reprocessed: Do you want to continue ?"], false, onConfirmOKClick, onConfirmCancelClick, "_CompanyCode changed");
            };
            Controls.Submit.SetLabel("_Send to approval");
            if (Variable.GetValueAsString("IsCMSubmitable") === "false") {
                Popup.Alert(["_PleaseContactYourBuyer:CM already being validated"], true, null, "_Submission failed");
                Controls.Submit.SetDisabled(true);
            }
            else {
                Controls.Submit.SetDisabled(CompanyHelper.hasError || CSVhasError || Attach.GetNbAttach() === 0 || lineDisplayed === 0);
            }
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
            Controls.HelpDescription__.Hide();
            Controls.ImportStepButton__.SetTextColor("color9");
            Controls.WorkflowStepButton__.SetTextColor("color8");
            Controls.SummaryStepButton__.SetTextColor("color9");
            Controls.ParsingErrorsPane.Hide(true);
            Controls.GeneralInformationsPane.Hide(false);
            CompanyHelper.InitCompanyBrowse();
            Controls.Status__.Hide(false);
            Controls.Reason__.Hide(true);
            Controls.RequesterLogin__.Hide(true);
            Controls.RequesterName__.Hide(true);
            Controls.SubmissionDateTime__.Hide(false);
            Controls.ValidationDateTime__.Hide(true);
            Controls.ImportDescription__.Hide(false);
            Controls.DownloadTemplate__.Hide(true);
            this.catalogManagementClientVendor.DisplayPreviews(true);
            this.catalogManagementClientVendor.DisplayParsingError();
            Controls.Submit.Hide(true);
            if (Variable.GetValueAsString("MissingWorkflowRuleError") == "true") {
                Popup.Alert(["_Approval workflow not set correctly on buyer side"], true, null, "_Workflow approval error");
            }
        }
        InitResultStep() {
            Controls.HelpDescription__.Hide();
            Controls.ImportStepButton__.SetTextColor("color9");
            Controls.WorkflowStepButton__.SetTextColor("color9");
            Controls.SummaryStepButton__.SetTextColor("color8");
            Controls.GeneralInformationsPane.Hide(false);
            CompanyHelper.InitCompanyBrowse();
            Controls.Status__.Hide(false);
            Controls.Reason__.Hide(Sys.Helpers.IsEmpty(Data.GetValue("Reason__")));
            Controls.RequesterLogin__.Hide(true);
            Controls.RequesterName__.Hide(true);
            Controls.ParsingErrorsPane.Hide(true);
            Controls.SubmissionDateTime__.Hide(false);
            Controls.ValidationDateTime__.Hide(false);
            Controls.ImportDescription__.Hide(false);
            Controls.DownloadTemplate__.Hide(true);
            Controls.CompanyCode__.SetReadOnly(true);
            Controls.ImportDescription__.SetReadOnly(false);
            if (this.currentStatus !== "Rejected") {
                this.catalogManagementClientVendor.DisplayPreviews(true);
            }
            else {
                this.catalogManagementClientVendor.DisplayPreviews(false);
            }
            Controls.Submit.Hide(true);
        }
        HideTechnicalFields() {
            Controls.NextProcess.Hide(true);
            Controls.SystemData.Hide(true);
        }
        Start() {
            Variable.SetValueAsString("CatalogManagmentType", "external");
            Process.SetHelpId("5022");
            ProcessInstance.SetSilentChange(true);
            this.InitAttachmentsPane();
            switch (this.currentStatus) {
                case "ToApprove":
                case "Failed":
                    this.InitWorkflowStep();
                    break;
                case "Approved":
                case "Rejected":
                case "Reverted":
                    this.InitResultStep();
                    break;
                case "Draft":
                default:
                    this.InitImportStep();
                    break;
            }
            this.HideTechnicalFields();
            // Show next alert notifications
            Lib.CommonDialog.NextAlert.Show({
                "CMCreationInfo": {
                    IsShowable: function () {
                        return !!Data.GetActionName();
                    },
                    Popup: function (nextAlert) {
                        Popup.Alert([nextAlert.message], false, () => {
                            ProcessInstance.Quit("quit");
                        }, nextAlert.title, true);
                    }
                }
            });
        }
    }
    CustomScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const isInternalVendorUpdateRequest = CatalogManagement.IsInternalVendorUpdateRequest();
        const catalogManagementClientVendor = new CatalogManagement.ClientVendor(isInternalVendorUpdateRequest);
        const main = new Main(catalogManagementClientVendor);
        main.Start();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map