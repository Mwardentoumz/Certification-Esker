"use strict";
//#region Workflow
function rebuildWorkflow() {
    if (ProcessInstance.isReadOnly) {
        // Never rebuild in readonly
        return;
    }
    if (Lib.P2P.BillingSchedule.Workflow.Controller.GetCurrentStepRole() === Lib.P2P.BillingSchedule.Workflow.roleRequester) {
        Lib.P2P.BillingSchedule.Workflow.DelayRebuildWorkflow();
    }
}
//#endregion Workflow
function isAncestorIsNonPOVendorInvoice() {
    return !!Variable.GetValueAsString("AncestorsRuid") && Variable.GetValueAsString("InvoiceType__") === "Non-PO Invoice";
}
function initPreviewPanel() {
    Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
    if (Attach.GetNbAttach() > 0 && isAncestorIsNonPOVendorInvoice()) {
        Log.Info("Form has a document");
        Log.Info("Document shown");
        // Workaround boot/customscript race condition to display and hide panels
        Controls.PreviewPanel.Hide(true);
        Controls.form_content_right.Hide(true);
        // End of workaround
        ProcessInstance.SetFormWidth();
        // Workaround boot/customscript race condition to display and hide panels
        setTimeout(function () {
            Controls.PreviewPanel.Hide(false);
            Controls.form_content_right.Hide(false);
            Controls.form_content_right.SetSize(45);
            Controls.form_content_left.SetSize(65);
        }, 1000);
    }
    else {
        Log.Info("Form has NO document");
        Log.Info("Document hidden");
        // Workaround boot/customscript race condition to display and hide panels
        Controls.PreviewPanel.Hide(false);
        Controls.form_content_right.Hide(false);
        ProcessInstance.SetFormWidth("default");
        Controls.PreviewPanel.Hide(true);
        Controls.form_content_right.Hide(true);
    }
}
function initForm() {
    hideFields();
    initPreviewPanel();
    if (!Variable.GetValueAsString("RequesterLogin")) {
        Variable.SetValueAsString("RequesterLogin", User.loginId);
        Variable.SetValueAsString("RequesterFullName", User.fullName);
    }
    Controls.CostCenter__.SetAllowTableValuesOnly(true);
    const billingScheduleNS = Lib.P2P.BillingSchedule;
    const contractStartDate = billingScheduleNS.GetContractDate(billingScheduleNS.ContractDate.StartDate);
    const contractEndDate = billingScheduleNS.GetContractDate(billingScheduleNS.ContractDate.EndDate);
    if (contractStartDate && contractEndDate) {
        Controls.StartDate__.SetDateRange(contractStartDate, contractEndDate);
        Controls.EndDate__.SetDateRange(contractStartDate, contractEndDate);
    }
    if (Data.IsNullOrEmpty("VendorName__")) {
        Data.SetValue("VendorName__", Variable.GetValueAsString("VendorName__"));
    }
}
function hideFields() {
    Controls.BillingScheduleStatus__.Hide(true);
    Controls.TotalScheduledAmount__.Hide(true);
    Controls.MaximumScheduledAmount__.Hide(true);
    Controls.WorkflowBillingScheduleTable__.Action__.Hide(true);
    Controls.WorkflowBillingScheduleTable__.WorkflowIndex__.Hide(true);
    Controls.Reject.Hide(true);
    Controls.CancelBillingSchedule.Hide(true);
    Controls.Approve.Hide(ProcessInstance.isReadOnly);
}
function initEvents() {
    function validateNeededFieldToPopulateInstallments() {
        // Validate dates
        Lib.P2P.BillingSchedule.ValidateDateRanges();
    }
    function areInstallmentRequiredFieldsValidated() {
        let fieldsAreValid = true;
        fieldsAreValid = fieldsAreValid && !Data.GetError("RecurringAmount__");
        fieldsAreValid = fieldsAreValid && !Data.IsNullOrEmpty("RecurringAmount__");
        fieldsAreValid = fieldsAreValid && !Data.GetError("StartDate__");
        fieldsAreValid = fieldsAreValid && !Data.GetError("EndDate__");
        return fieldsAreValid;
    }
    function validateFieldsAndRecomputeInstallments() {
        validateNeededFieldToPopulateInstallments();
        if (areInstallmentRequiredFieldsValidated()) {
            Lib.P2P.BillingSchedule.PopulateBillingScheduleInstallmentTable();
            updateTotalAndMaxAmounts();
        }
    }
    function updateTotalAndMaxAmounts() {
        const table = Data.GetTable("BillingScheduleLineItems__");
        let total = 0;
        let max = 0;
        const tolerance = Math.abs(Data.GetValue("ToleranceAmount__"));
        for (let i = 0; i < table.GetItemCount(); i++) {
            const value = table.GetItem(i).GetValue("Amount__");
            total += value;
            max += value + tolerance;
        }
        Data.SetValue("TotalScheduledAmount__", total);
        Data.SetValue("MaximumScheduledAmount__", max);
        rebuildWorkflow();
    }
    Controls.EndDate__.OnChange = OnEndDateChange;
    function OnEndDateChange() {
        validateFieldsAndRecomputeInstallments();
    }
    Controls.StartDate__.OnChange = OnStartDateChange;
    function OnStartDateChange() {
        validateFieldsAndRecomputeInstallments();
    }
    Controls.Recurrence__.OnChange = OnRecurrenceChange;
    function OnRecurrenceChange() {
        validateFieldsAndRecomputeInstallments();
    }
    Controls.RecurringAmount__.OnChange = OnRecurringAmountChange;
    function OnRecurringAmountChange() {
        validateFieldsAndRecomputeInstallments();
    }
    Controls.ToleranceAmount__.OnChange = OnToleranceAmountChange;
    function OnToleranceAmountChange() {
        Controls.ToleranceAmount__.SetValue(Math.abs(Controls.ToleranceAmount__.GetValue()));
        updateTotalAndMaxAmounts();
    }
    Controls.MaximumScheduledAmount__.OnChange = OnMaximumScheduledAmountChange;
    function OnMaximumScheduledAmountChange() {
        rebuildWorkflow();
    }
    Controls.Approve.OnClick = function () {
        Lib.P2P.BillingSchedule.ValidateForm().Then(function (isValid) {
            if (isValid) {
                HandleApprove();
            }
            else {
                displayErrorPopupIfDefinedAndNoOtherErrors();
            }
        });
    };
    function HandleApprove() {
        ProcessInstance.Approve("Approve");
    }
    Controls.CostCenter__.OnChange = OnCostCenterChange;
    Controls.Reject.OnClick = function () {
        let popupConfig = {
            title: "_RejectPopup",
            commentRequired: true,
            currentComment: Data.GetValue("WorkflowComment__"),
            onClickOk: function (result) {
                if (result.comment) {
                    Data.SetValue("WorkflowComment__", result.comment);
                    ProcessInstance.Approve("Reject");
                }
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.BillingSchedule.CustomizePopupCommentConfig", popupConfig) || popupConfig;
        Lib.CommonDialog.PopupComment(popupConfig);
    };
    Controls.CancelBillingSchedule.OnClick = function () {
        let popupConfig = {
            title: "_CancelPopup",
            explanationLabel: "_CancelExplanation",
            allowComment: true,
            commentRequired: true,
            onClickOk: function (result) {
                ProcessInstance.ResumeWithActionAsynchronous("Cancel", {
                    "BillingScheduleStatus__": "Canceled",
                    "CurrentUserName__": User.fullName,
                    "CurrentUserLogin__": User.loginId,
                    "WorkflowComment__": result.comment
                });
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.BillingSchedule.CustomizePopupOkConfig", popupConfig) || popupConfig;
        Lib.CommonDialog.PopupOkExtended(popupConfig);
    };
    async function OpenContractInNewTab() {
        const OriginalContractRUIDEXFromInvoice = Variable.GetValueAsString("OriginalContractRUIDEX__");
        const contractToUse = await Lib.Contract.Amendment.GetToUseVersion(OriginalContractRUIDEXFromInvoice);
        const contractRUIDEX = (contractToUse === null || contractToUse === void 0 ? void 0 : contractToUse.RUIDEX) || Data.GetValue("SourceRUID");
        if (contractRUIDEX) {
            Process.OpenMessage(contractRUIDEX, true, true);
        }
    }
    Controls.ContractNumber__.DisplayAs({ type: "Link" });
    Controls.ContractReferenceNumber__.DisplayAs({ type: "Link" });
    Controls.ContractNumber__.OnClick = OpenContractInNewTab;
    Controls.ContractReferenceNumber__.OnClick = OpenContractInNewTab;
}
function OnCostCenterChange() {
    fetchCostCenterDescription(Controls.CostCenter__.GetValue());
    rebuildWorkflow();
}
function fetchCostCenterDescription(costCenterID) {
    const companyCode = Controls.CompanyCode__.GetValue();
    const callback = function (description) {
        if (!Sys.Helpers.IsEmpty(description)) {
            Controls.CostCenterDescription__.SetValue(description);
        }
        else {
            Log.Warn(`Failed to fetch the cost center description for Company: ${companyCode} and Cost center: ${costCenterID}`);
            Controls.CostCenterDescription__.SetValue("");
        }
    };
    if (!Sys.Helpers.IsEmpty(companyCode) && !Sys.Helpers.IsEmpty(costCenterID)) {
        Lib.P2P.Browse.GetCostCenterDescription(callback, companyCode, costCenterID, "PAC");
    }
    else {
        Controls.CostCenterDescription__.SetValue("");
    }
}
function UpdateLayout() {
    displayErrorPopupIfDefinedAndNoOtherErrors();
    const bsStatus = Data.GetValue("BillingScheduleStatus__");
    if (bsStatus && bsStatus.length !== 0) {
        Lib.P2P.BillingSchedule.PopulateBillingScheduleInstallmentTableFromCT();
    }
    if (Data.GetValue("BillingScheduleStatus__") === Lib.P2P.BillingSchedule.BillingScheduleState.Approved) {
        Controls.CancelBillingSchedule.Hide(false);
    }
    else {
        if (Lib.P2P.BillingSchedule.Workflow.Controller.GetCurrentStepRole() === Lib.P2P.BillingSchedule.Workflow.roleApprover) {
            setApproverLayout();
        }
        Lib.P2P.BillingSchedule.Workflow.SetApproveButtonLabel();
    }
}
function setApproverLayout() {
    Controls.DataPanel.SetReadOnly(true);
    Controls.WorkflowBillingSchedule.SetReadOnly(true);
    Controls.WorkflowComment__.SetReadOnly(false);
    Controls.Reject.Hide(ProcessInstance.isReadOnly);
    Controls.Banner.Hide(false);
    let htmlContent = Controls.HTMLBanner__.GetHTML().replace("_ApproversExplanation", Language.Translate("_ApproversExplanation"));
    Controls.HTMLBanner__.SetHTML(htmlContent);
}
function displayErrorPopupIfDefinedAndNoOtherErrors() {
    const messages = Lib.P2P.BillingSchedule.GetPopUpMessages();
    if (messages && !Process.ShowFirstError()) {
        Popup.Alert(messages, true, () => {
            Lib.P2P.BillingSchedule.ClearPopUpMessages();
        }, "_ErrorPopupTitle");
    }
}
function main() {
    initForm();
    initEvents();
    Lib.P2P.BillingSchedule.Workflow.Init();
    Lib.P2P.BillingSchedule.Workflow.InitWorkflowPanel();
    Lib.P2P.BillingSchedule.Workflow.UpdateRolesSequence();
    UpdateLayout();
    //If the Billing Schedule is created from invoice, perform validation check
    if (Variable.GetValueAsString("InvoiceType__")) {
        // Validate dates
        Lib.P2P.BillingSchedule.ValidateDateRanges();
    }
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.BillingSchedule.OnHTMLScriptEnd");
}
main();
//# sourceMappingURL=customscript.js.map