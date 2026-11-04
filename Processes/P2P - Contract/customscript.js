"use strict";
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    var CompanyCodesValue = Lib.P2P.CompanyCodesValue;
    const contractHandler = new Lib.Contract.Handler(new Lib.P2P.DataHandler());
    const workflow = Lib.Contract.Workflow.Controller;
    CustomScript.contractSpendingHandler = new Lib.Spending.Contract.Handler();
    CustomScript.formTemplateManager = Lib.Contract.FormTemplate.Get();
    class ContractConfiguration {
        static get isPurchasingEnable() {
            return Sys.Parameters.GetInstance("P2P").GetParameterBool("EnablePurchasingGlobalSetting", false) && Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableStandardPurchasingGlobalSetting", false);
        }
        static get isAPEnable() {
            return Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableAccountPayableGlobalSetting", false);
        }
        static get isVendorManagementEnable() {
            return Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableVendorManagementGlobalSetting", false);
        }
        static get isSourcingAvailable() {
            return Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableMarketDojoIntegration", false)
                && Sys.Helpers.TmpData.GetValue("hasMarketDojoCredentials");
        }
        static get isTacit() {
            return Controls.TacitRenewal__.IsChecked();
        }
        static get isContractSignatureEnabled() {
            return Controls.EnableContractSignature__.IsChecked();
        }
        static get isSpendingFilled() {
            const hasSpendingData = !!Data.GetValue("Currency__") && (!!Data.GetValue("MaxAmount__") || !!Data.GetValue("MinAmount__"));
            return !ContractConfiguration.isTacit && (!ContractViewProcessor.useNavigationDrawer || hasSpendingData);
        }
        static get hasSpendingData() {
            return !Sys.Helpers.IsEmpty(Data.GetValue("MaxAmount__")) || !Sys.Helpers.IsEmpty(Data.GetValue("MinAmount__"));
        }
        static get hasAttachment() {
            return Attach.GetNbAttach() > 0;
        }
    }
    function CheckRequiredFields() {
        let requireColumnInTable = [];
        const tablesToCheck = ["ItemsToCreate__"];
        for (const key in Controls) {
            if (Object.prototype.hasOwnProperty.call(Controls, key) && key.endsWith("__") && Controls[key].IsRequired && Controls[key].IsRequired()) {
                Controls[key].Focus();
            }
            if (tablesToCheck.includes(key)) {
                const table = Controls[key];
                for (const columnKey in table) {
                    if (Object.prototype.hasOwnProperty.call(table, columnKey) && columnKey.endsWith("__") && table[columnKey].IsRequired()) {
                        requireColumnInTable.push(columnKey);
                    }
                }
                for (let itemIndex = 0; itemIndex < table.GetItemCount(); itemIndex++) {
                    for (let columnIndex = 0; columnIndex < requireColumnInTable.length; columnIndex++) {
                        const requiredValue = table.GetItem(itemIndex).GetValue(requireColumnInTable[columnIndex]);
                        if (Sys.Helpers.IsEmpty(requiredValue)) {
                            table.GetItem(itemIndex).SetError(requireColumnInTable[columnIndex], "_This field is required");
                        }
                    }
                }
            }
        }
        Controls.Comments__.Focus();
        Lib.Contract.Docusign.CheckRequiredFields();
    }
    async function CanClickApproveButton() {
        OnEndDateChange();
        CheckRequiredFields();
        contractHandler.CheckCurrenciesCoherency();
        CustomScript.notificationTableHandler.SaveNotifications();
        Lib.Contract.ItemsToCreate.ResetSupplyTypeTooltip();
        const isValid = Process.ShowFirstError() === null;
        return await Lib.Contract.OnValidateForm(isValid);
    }
    function SetApproveButtonLabel() {
        let approveButtonLabel;
        if (Data.GetValue("ContractStatus__") === Lib.Contract.Status.Draft) {
            approveButtonLabel = "_SubmitForApproval";
        }
        else if (Lib.Contract.Workflow.HasAdditionalContributors()) {
            approveButtonLabel = "_ValidateAndForward";
        }
        else {
            approveButtonLabel = "_ValidateContract";
        }
        Controls.Approve.SetLabel(approveButtonLabel);
    }
    async function LoadUserProperties() {
        Log.Info("LoadUserProperties");
        const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(User.loginId);
        Sys.Helpers.TmpData.SetValue("hasMarketDojoCredentials", UserPropertiesValues.HasMarketDojoCredentials());
        let companyCode = Data.GetValue("CompanyCode__") || UserPropertiesValues.CompanyCode__;
        const filter = UserPropertiesValues.GetAllowedCompanyCodesFilter(companyCode);
        Controls.CompanyCode__.SetFilter(filter);
        Data.SetValue("CompanyCode__", companyCode);
        await Lib.Contract.ContractDetails.OnCompanyCodeChange();
    }
    CustomScript.LoadUserProperties = LoadUserProperties;
    // event handling
    Controls.contractStatusTag__.BindEvent("onLoadContractStatus", RenderContractStatus);
    Controls.VendorNumber__.DisplayAs({ type: "Link" });
    Controls.VendorNumber__.OnClick = OpenCompanyDashboard;
    Controls.VendorName__.SetAttributes("Email__|PhoneNumber__");
    Controls.VendorName__.SetDisplayedColumns("Name__|Number__|Sub__|Street__|PostOfficeBox__|City__|PostalCode__|Region__|Country__|Currency__");
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.VendorName__, Lib.Purchasing.Vendor.Client.Contract.OnVendorSelectItem, Lib.Purchasing.Vendor.Client.Contract.OnVendorSelectItem, Lib.Purchasing.Vendor.Client.Contract.OnVendorSelectItem);
    Controls.VendorEmail__.OnChange = () => {
        Lib.P2P.Email.TrimAndCheckEmailControl(Controls.VendorEmail__);
    };
    Lib.Contract.Workflow.DelayRebuildWorkflow();
    function SetTacitRenewalLayout() {
        const tacitRenewal = ContractConfiguration.isTacit;
        Controls.PriorNotice__.Hide(!tacitRenewal);
        Controls.ResiliationDate__.Hide(!tacitRenewal);
        Controls.RenewalTerms__.Hide(!tacitRenewal);
        Controls.PriorNotice__.SetRequired(tacitRenewal);
        Controls.RenewalTerms__.SetRequired(tacitRenewal);
        if (!Sys.Helpers.IsEmpty(Controls.EndDate__.GetValue())) {
            Controls.NextOccurrenceWarning__.Hide(!tacitRenewal || CustomScript.contract.isToBeTerminated);
        }
        Controls.Spending.Hide(tacitRenewal);
        contractHandler.SetNextOccuranceDesc();
    }
    CustomScript.SetTacitRenewalLayout = SetTacitRenewalLayout;
    function SetNotificationLayout() {
        const canEditData = CustomScript.contract.isDraft && !CustomScript.documentViewer.isAdvisor;
        Controls.Notification.SetReadOnly(!canEditData);
        Controls.DoNotNotifyOnNotificationDateReached__.SetReadOnly(!canEditData && !CustomScript.contract.isBeingEdited);
    }
    function HandleTacitRenewalChange(tacitRenewal) {
        contractHandler.Fields.TacitRenewal.HandleChange(tacitRenewal);
        SetTacitRenewalLayout();
        if (!tacitRenewal) {
            Controls.NextOccurrenceWarning__.Hide(true);
        }
        else if (!Sys.Helpers.IsEmpty(Controls.EndDate__.GetValue())) {
            Controls.NextOccurrenceWarning__.Hide(false);
        }
        CustomScript.notificationTableHandler.UpdateFromFormData();
    }
    function OnTacitRenewalChange() {
        const tacitRenewal = ContractConfiguration.isTacit;
        if (contractHandler.Fields.TacitRenewal.IsChangeImpactfull()) {
            let message = tacitRenewal
                ? "_Are you sure you want to change this contract into a tacit ? Your spending informations will be lost."
                : "_Are you sure you want to remove the tacit renewal from this contract ? Your period of notice, date of notice and renewal term will be lost.";
            let title = tacitRenewal
                ? "_Change to tacit renewal"
                : "_Remove tacit renewal";
            Popup.Confirm(message, false, () => {
                HandleTacitRenewalChange(tacitRenewal);
            }, () => {
                Controls.TacitRenewal__.SetValue(!tacitRenewal);
            }, title);
        }
        else {
            HandleTacitRenewalChange(tacitRenewal);
        }
    }
    Controls.TacitRenewal__.OnChange = OnTacitRenewalChange;
    function OnStartDateChange() {
        contractHandler.Fields.StartDate.OnChange();
        CustomScript.notificationTableHandler.UpdateFromFormData();
    }
    CustomScript.OnStartDateChange = OnStartDateChange;
    Controls.StartDate__.OnChange = function () {
        OnStartDateChange();
        Lib.Contract.ItemsToCreate.TriggerDateChangeWarning(["StartDate__", "EndDate__"]);
    };
    function OnDurationChange() {
        contractHandler.Fields.Duration.OnChange();
        ArchiveExpirationChange();
        CustomScript.notificationTableHandler.UpdateFromFormData();
        Lib.Contract.ItemsToCreate.TriggerDateChangeWarning(["EndDate__"]);
        Lib.Contract.Workflow.DelayRebuildWorkflow();
    }
    Controls.Duration__.OnChange = OnDurationChange;
    function OnEndDateChange() {
        contractHandler.Fields.EndDate.OnChange();
        ArchiveExpirationChange();
        CustomScript.notificationTableHandler.UpdateFromFormData();
        Lib.Contract.Workflow.DelayRebuildWorkflow();
    }
    CustomScript.OnEndDateChange = OnEndDateChange;
    Controls.EndDate__.OnChange = function () {
        OnEndDateChange();
        Lib.Contract.ItemsToCreate.TriggerDateChangeWarning(["EndDate__"]);
    };
    function OnEffectiveDateChange() {
        contractHandler.Fields.EffectiveDate.OnChange();
    }
    CustomScript.OnEffectiveDateChange = OnEffectiveDateChange;
    Controls.EffectiveDate__.OnChange = OnEffectiveDateChange;
    function OnMinMaxAmountChange() {
        contractHandler.Fields.Spendings.OnChange();
        const maxAmount = Controls.MaxAmount__.GetValue();
        const isOutOfAmountBehaviorEditable = (CustomScript.contract.isDraft || (CustomScript.contract.isBeingEdited && CustomScript.documentViewer.isAdmin)) && !Sys.Helpers.IsEmpty(maxAmount) && maxAmount > 0;
        Controls.OutOfAmountBehavior__.SetReadOnly(!isOutOfAmountBehaviorEditable);
        Controls.Currency__.SetRequired(Lib.Contract.IsCurrencyRequired());
        if (!Data.GetError("MinAmount__") && !Data.GetError("MaxAmount__")) {
            CustomScript.notificationTableHandler.UpdateFromFormData();
        }
        Lib.Contract.Workflow.DelayRebuildWorkflow();
    }
    CustomScript.OnMinMaxAmountChange = OnMinMaxAmountChange;
    function SetSpendingLayout() {
        const maxAmount = Controls.MaxAmount__.GetValue();
        const outOfAmountBehaviorOptions = {
            [Lib.Spending.Contract.OutOfAmountBehavior.Ignore]: "_OutOfAmountBehavior_Ignore",
            [Lib.Spending.Contract.OutOfAmountBehavior.Block]: "_OutOfAmountBehavior_Block"
        };
        const outOfAmountBehaviorAvailableValues = Sys.Helpers.Array.Map(Object.keys(outOfAmountBehaviorOptions), (v) => v + "=" + outOfAmountBehaviorOptions[v]).join("\n");
        const isOutOfAmountBehaviorEditable = (CustomScript.contract.isDraft || (CustomScript.contract.isBeingEdited && CustomScript.documentViewer.isAdmin)) && !Sys.Helpers.IsEmpty(maxAmount) && maxAmount > 0;
        Controls.OutOfAmountBehavior__.SetReadOnly(!isOutOfAmountBehaviorEditable);
        Controls.OutOfAmountBehavior__.SetAvailableValues(outOfAmountBehaviorAvailableValues);
        Controls.OutOfAmountBehavior__.SetWidth(230);
        const isCurrencyEditable = (CustomScript.contract.isDraft && !CustomScript.documentViewer.isAdvisor && (!contractHandler.IsAmendment() || !Controls.Currency__.GetValue())) || (CustomScript.contract.isBeingEdited && CustomScript.documentViewer.isAdmin && !Controls.Currency__.GetValue());
        Controls.Currency__.SetReadOnly(!isCurrencyEditable);
        OnMinMaxAmountChange();
    }
    CustomScript.SetSpendingLayout = SetSpendingLayout;
    Controls.MinAmount__.OnChange = OnMinMaxAmountChange;
    Controls.MaxAmount__.OnChange = OnMinMaxAmountChange;
    const onCurrencyChange = async () => {
        //waiting for the framework to complete its checks
        await Controls.Currency__.WaitForCheck();
        OnMinMaxAmountChange();
        await Lib.Contract.ItemsToCreate.ApplyHeaderValueToItemsToCreateAndRefreshWarning(["Currency__"]);
        contractHandler.CheckCurrenciesCoherency();
    };
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.Currency__, onCurrencyChange, onCurrencyChange, onCurrencyChange);
    Controls.PriorNotice__.OnChange = contractHandler.Fields.PriorNotice.OnChange;
    Controls.RenewalReminderDays__.OnChange = contractHandler.Fields.PeriodOfNotification.OnChange;
    Controls.RenewalTerms__.OnChange = contractHandler.Fields.RenewalTerm.OnChange;
    function ArchiveExpirationChange() {
        CustomScript.contractViewProcessor.DisplayWarnings();
        const endDate = Controls.EndDate__.GetValue();
        if (!Sys.Helpers.IsEmpty(endDate)) {
            Controls.ExpirationDate__.Hide(false);
            let expirationDate = Data.GetValue("ArchiveExpiration");
            if (!expirationDate || typeof expirationDate.getMonth !== "function" || Data.GetValue("State") < 100) {
                expirationDate = Lib.Contract.GetExpirationDateFromEndDate(endDate, Controls.ArchiveDurationInMonths__.GetValue());
            }
            Controls.ExpirationDate__.SetValue(expirationDate);
            if (ContractConfiguration.isTacit) {
                Controls.NextOccurrenceWarning__.Hide(false);
            }
        }
        else {
            Controls.ExpirationDate__.Hide(true);
            Controls.NextOccurrenceWarning__.Hide(true);
        }
    }
    Controls.ArchiveDurationInMonths__.OnChange = ArchiveExpirationChange;
    class ContractLayout extends Lib.P2P.Layout.Manager {
        UpgradeControls() {
            Controls.RelatedPurchaseOrders__.SetAtLeastOneLine(false);
            Controls.RelatedPurchaseOrders__.HideBottomNavigation(true);
            Controls.RelatedPurchaseOrders__.HideTableRowMenu("hideMenuAndCheckbox");
            Controls.RelatedPurchaseOrders__.SetAllowSortTable(true);
            Controls.RelatedPurchaseOrders__.SetAllowFilter(true);
        }
    }
    CustomScript.ContractLayout = ContractLayout;
    const panes = ["ApprovalWorkflow", "Archive_Details", "Banner", "ChartPane", "ContractDetails", "ContractInformationPane", "ContractTermination", "CreateSampleInvoiceBannerPane", "DashboardPane", "DocumentsPanel", "EventHistoryPane", "NewAmendmentPane", "Notification", "OperationDetails", "PreviewPanel", "ESignatureRecipientsPane", "RelatedBillingSchedulePanel", "RelatedCatalogItemsPanel", "RelatedInvoicesPanel", "RelatedPurchaseOrdersPanel", "Spending", "SpendingInformation", "SpendingIncoming", "SpendingSpent", "TopPaneWarning", "Validity", "VendorContact", "HistoryPanel"];
    const splitters = Object.values(Lib.P2P.Layout.Splitter);
    const deprecatedControls = ["ComputedRemaining__", "ButtonPane", "VerticalMenuPane", "Contract_Info__", "Spacer10__", "Vendor_Details_Name__", "NumberOfOrder__", "Ligne_d_espacement5__", "Spacer7__", "Spacer6__", "CustomNotification", "RelatedOrderedItemsPanel", "RelatedInvoicesView__", "Amendment__", "CreatePurchaseRequisition__", "CreateSourcingEvent__", "SpacerCreatePurchaseRequisition__", "RelatedCatalogItems__.ItemSelection__", "Spacer18__" /* invoicing schedules */, "Spacer14__", "Spacer15__" /* ordered items */, "Spacer11__" /* invoiced items */];
    CustomScript.layout = new ContractLayout(panes, [], splitters, deprecatedControls);
    function UpdateLayout() {
        Log.Info("Update layout");
        SetApproveButtonLabel();
        Sys.Helpers.TryCallFunction("Lib.Contract.Customization.Client.OnUpdateLayout");
    }
    function SetContractCreationLayout() {
        const isAmendment = contractHandler.IsAmendment();
        if (isAmendment) {
            Controls.VendorContact.SetReadOnly(true);
        }
    }
    function SetHelpID() {
        if (CustomScript.documentViewer.isContractRequesterBackup) {
            Process.SetHelpId(2700);
        }
        else if (CustomScript.documentViewer.isApprover) {
            Process.SetHelpId(2701);
        }
        else {
            Process.SetHelpId(2506);
        }
    }
    class CContract {
        constructor() {
            this.status = Data.GetValue("ContractStatus__");
            this.state = parseInt(Data.GetValue("State"), 10);
            this.ownerID = Data.GetValue("OwnerId");
            this.documentOwnerLogin = this.ownerID ? Sys.Helpers.String.ExtractLoginFromDN(this.ownerID) : null;
            this.contractOwnerLogin = Data.GetValue("OwnerLogin__");
            this.contractRequesterLogin = Data.GetValue("RequesterLogin__");
            this.initiallyExpectedEndDate = Data.GetValue("InitiallyExpectedEndDate__");
            this.hasDocusignIntegrationData = !Sys.Helpers.IsEmpty(Variable.GetValueAsString("signData"));
        }
        get isActive() {
            return this.status === Lib.Contract.Status.Active;
        }
        get isExpired() {
            return this.status === Lib.Contract.Status.Expired;
        }
        get isApprovedPendingActivation() {
            return this.status === Lib.Contract.Status.ApprovedPendingActivation;
        }
        get isApprovedPendingSignature() {
            return this.status === Lib.Contract.Status.ApprovedPendingSignature;
        }
        get isApprovedPendingEnvelopeDesign() {
            return this.status === Lib.Contract.Status.ApprovedPendingEnvelopeDesign;
        }
        get isSignatureRejected() {
            return this.status === Lib.Contract.Status.SignatureRejected;
        }
        get isWaitingForSignature() {
            return this.isApprovedPendingEnvelopeDesign || this.isApprovedPendingSignature;
        }
        get isTerminalStatus() {
            return [Lib.Contract.Status.Active, Lib.Contract.Status.Revoked, Lib.Contract.Status.Deleted, Lib.Contract.Status.Expired, Lib.Contract.Status.Deprecated].includes(Data.GetValue("ContractStatus__"));
        }
        get isDraft() {
            return this.status === Lib.Contract.Status.Draft;
        }
        get isToValidate() {
            return this.status === Lib.Contract.Status.ToValidate;
        }
        get isDeprecated() {
            return this.status === Lib.Contract.Status.Deprecated;
        }
        get canBeTerminated() {
            return this.isActive
                && !this.isToBeTerminated
                && !Sys.Helpers.Date.IsDateInPast(Controls.EndDate__.GetValue())
                && !ProcessInstance.isEditing;
        }
        get canBeEdited() {
            return (this.isActive || this.isApprovedPendingActivation) && !ProcessInstance.isEditing;
        }
        get canBeRejected() {
            return !this.isDraft && !ProcessInstance.isReadOnly && !ProcessInstance.isEditing;
        }
        get canBeSentBackToRequester() {
            return this.canBeRejected || this.isWaitingForSignature;
        }
        get canBeDeleted() {
            return (this.isDraft && !this.isNew) || this.isToValidate;
        }
        get isBeingEdited() {
            return (this.isActive || this.isApprovedPendingActivation) && ProcessInstance.isEditing;
        }
        get isInFinalState() {
            return this.state >= 100;
        }
        get isNew() {
            return !this.ownerID;
        }
        get isToBeTerminated() {
            return !Sys.Helpers.IsEmpty(this.initiallyExpectedEndDate);
        }
        get isVendorRegistrationVisible() {
            return ContractConfiguration.isVendorManagementEnable
                && !contractHandler.IsAmendment()
                && this.isDraft;
        }
    }
    CustomScript.CContract = CContract;
    class ContractViewProcessor {
        static get displayDocusignOptions() {
            return (CustomScript.contract.isApprovedPendingEnvelopeDesign
                && (CustomScript.documentViewer.isContractOwnerOrBackup || CustomScript.documentViewer.isContractRequesterOrBackup || CustomScript.documentViewer.isDocumentOwnerOrBackup))
                || CustomScript.contract.isApprovedPendingSignature
                || CustomScript.contract.isSignatureRejected;
        }
        static get useNavigationDrawer() {
            return ProcessInstance.isReadOnly && (CustomScript.contract.isTerminalStatus || CustomScript.contract.isApprovedPendingActivation);
        }
        constructor() {
        }
        GetOOTOLogin() {
            let ootoLogin = null;
            if (!CustomScript.documentViewer.isDocumentOwner) {
                if (CustomScript.contract.isInFinalState) {
                    if (CustomScript.contract.canBeTerminated && CustomScript.documentViewer.isContractOwnerBackup) {
                        ootoLogin = CustomScript.contract.contractOwnerLogin;
                    }
                }
                else if (CustomScript.documentViewer.isDocumentOwnerBackup) {
                    ootoLogin = CustomScript.contract.documentOwnerLogin;
                }
                else if (CustomScript.documentViewer.isContractRequesterBackup) {
                    ootoLogin = CustomScript.contract.contractRequesterLogin;
                }
            }
            return ootoLogin;
        }
        static DisplayBanner() {
            const banner = Sys.Helpers.Banner;
            banner.SetMainTitle("_Contract");
            banner.SetStatusCombo(Controls.ContractStatus__);
            banner.SetHTMLBanner(Controls.HTMLBanner__);
            banner.SetSubTitle();
        }
        static FillNewLayoutPanes() {
            let promises = [];
            if (ContractConfiguration.isPurchasingEnable) {
                if (CustomScript.contract.isApprovedPendingActivation
                    && Lib.Contract.HasItemsToCreate()
                    && !Sys.TechnicalData.GetValue("ItemsToCreateSavedInTable")) {
                    promises.push(Lib.Contract.FillItemsToCreateData(CustomScript.navigationDrawer));
                    Controls.RelatedCatalogItemsDescription__.Hide(false);
                }
                else {
                    promises.push(CustomScript.FillCatalogItemsData());
                }
                promises.push(FillBillingScheduleData());
                promises.push(Lib.Contract.ordersTableManager.Init());
                if (!CustomScript.contract.isDeprecated) {
                    const orderDashboardCounter = new Lib.Contract.OrdersDashboardCounter(Lib.Contract.ordersTableManager);
                    orderDashboardCounter.OnClick = () => {
                        CustomScript.navigationDrawer.SelectItem(Lib.Contract.MenuItem.Orders);
                    };
                    promises.push(orderDashboardCounter.Init());
                }
            }
            if (ContractConfiguration.isAPEnable) {
                promises.push(Lib.Contract.invoicesTableManager.Init());
                if (!CustomScript.contract.isDeprecated) {
                    const invoicesDashboardCounter = new Lib.Contract.InvoicesDashboardCounter(Lib.Contract.invoicesTableManager);
                    invoicesDashboardCounter.OnClick = () => {
                        CustomScript.navigationDrawer.SelectItem(Lib.Contract.MenuItem.Invoices);
                    };
                    promises.push(invoicesDashboardCounter.Init());
                }
            }
            return promises;
        }
        DisplayWarnings() {
            const topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
            Lib.P2P.DisplayArchiveDurationWarning("Contract", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning), "ContractArchiveDurationInMonths", () => Data.GetValue("ArchiveDurationInMonths__"));
            Lib.P2P.DisplayAdminWarning("PAC", function (displayName) {
                topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
            }, (Data.GetValue("State") != 100) || CustomScript.documentViewer.canTerminateContract, [70, 90, 100]);
            Lib.P2P.DisplayAdminAndOOTOWarning("PAC", function () {
                topMessageWarning.Add(Language.Translate("_Edit as admin"));
            }, CustomScript.documentViewer.canSaveContractChanges, [100]);
            Lib.P2P.DisplayBackupUserWarning("PAC", function (displayName) {
                topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName));
            }, this.GetOOTOLogin.bind(this));
            if (CustomScript.documentViewer.isAdvisor) {
                topMessageWarning.Add(Language.Translate("_You are viewing this contract as an advisor"));
            }
            if (CustomScript.contract.isDeprecated) {
                topMessageWarning.Add(Language.Translate("_This contract has been deprecated, you can find the last version here"));
            }
            if (CustomScript.contract.isDraft || CustomScript.contract.isToValidate) {
                try {
                    const extractionLimit = JSON.parse(Variable.GetValueAsString("Lib_Contract_Server_OCR_EXTRACTION_LIMIT"));
                    if (extractionLimit) {
                        const isOCRLimit = extractionLimit.documentPageCount > extractionLimit.realOCRPageCount;
                        const isGPTLimit = extractionLimit.realOCRPageCount > extractionLimit.realAIPageCount;
                        if (isGPTLimit) {
                            topMessageWarning.Add(Language.Translate("_notAllDocumentHasBeenUsedForExtractionGPTLimit", true, extractionLimit.realAIPageCount, extractionLimit.documentPageCount));
                        }
                        else if (isOCRLimit) {
                            topMessageWarning.Add(Language.Translate("_notAllDocumentHasBeenUsedForExtractionOCRLimit", true, extractionLimit.realOCRPageCount, extractionLimit.documentPageCount));
                        }
                    }
                    const policyLimitAnalysis = JSON.parse(Variable.GetValueAsString("FraudulentClauses_policyLimitAnalysis"));
                    if (policyLimitAnalysis && policyLimitAnalysis.limit) {
                        topMessageWarning.Add(Language.Translate("_FraudulentClausesPolicyLimitReached", true, policyLimitAnalysis.limit, policyLimitAnalysis.total));
                    }
                }
                //If JSON parse error
                catch (err) {
                    Log.Warn(`[DisplayWarnings] : ${err}`);
                }
            }
        }
    }
    CustomScript.ContractViewProcessor = ContractViewProcessor;
    function UpdateCarouselVisibility() {
        if (ContractConfiguration.hasAttachment) {
            Controls.DocumentsPanel.Hide(false);
        }
    }
    // main part
    async function Main() {
        // Pass the information wether the account is a demo account or not to the server
        Variable.SetValueAsString("InDemoAccount", User.isInDemoAccount ? "1" : "0");
        ContractViewProcessor.DisplayBanner();
        CustomScript.contractViewProcessor.DisplayWarnings();
        Lib.Contract.ContractDetails.InitTmpData();
        Controls.InitiallyExpectedEndDate__.SetReadOnly(true);
        Controls.TerminationComment__.SetReadOnly(true);
        ArchiveExpirationChange();
        Controls.Version__.Hide(false);
        Controls.VersionHeader__.Hide(false);
        Lib.Contract.Workflow.Init();
        Lib.Contract.Workflow.InitWorkflowPanel(UpdateLayout);
        Lib.Contract.Workflow.UpdateRolesSequence();
        if (!CustomScript.contract.isDraft || CustomScript.documentViewer.isAdvisor) {
            Controls.VendorContact.SetReadOnly(true);
            Controls.Archive_Details.SetReadOnly(true);
            Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
            Controls.NewAmendmentPane.SetReadOnly(true);
            Controls.Duration__.Hide(!CustomScript.documentViewer.canEditLegalInformationsAsAdmin);
            Lib.Contract.editableControlsAsAdmin.forEach((element) => {
                Controls[element].SetReadOnly(!CustomScript.documentViewer.canEditLegalInformationsAsAdmin);
            });
        }
        else {
            SetContractCreationLayout();
        }
        /**
         * DisplayAs link for combobox need to be in main to be taken into account
         * because the dom need to be created before
         */
        Controls.VendorName__.DisplayAs({ type: "Link" });
        Controls.VendorName__.OnClick = OpenCompanyDashboard;
        Lib.Purchasing.Vendor.Client.Contract.CheckAndDisplayScore();
        Controls.VendorNumber__.DisplayAs({ type: "Link" });
        Controls.VendorNumber__.OnClick = OpenCompanyDashboard;
        ManageInitialDatesVisibility();
        Controls.Version__.Hide(!CustomScript.contract.isDeprecated && Controls.Version__.GetValue() == 1);
        Controls.DocumentsPanel.OnAttachmentAdded = UpdateCarouselVisibility;
        Controls.DocumentsPanel.OnAttachmentDeleted = UpdateCarouselVisibility;
        Controls.DocumentsPanel.OnDocumentSelected = UpdateCarouselVisibility;
        Controls.DocumentsPanel.OnDocumentDeleted = () => {
            UpdateCarouselVisibility();
            CustomScript.formTemplateManager.Apply();
        };
        SetSpendingLayout();
        SetNotificationLayout();
        SetTacitRenewalLayout();
        SetApproveButtonLabel();
        Controls.RelatedCatalogItems__.SetWidth("100%");
        Controls.RelatedCatalogItems__.SetExtendableColumn("ItemDescription__");
        Controls.RelatedPurchaseOrders__.SetWidth("100%");
        Controls.RelatedPurchaseOrders__.SetExtendableColumn("ItemName__");
        if (CustomScript.documentViewer.isDocumentOwnerOrBackup) {
            workflow.AllowRebuild(true);
            if (CustomScript.contract.isDraft) {
                workflow.Rebuild();
            }
        }
        //Set up vendor registration custom query (no param check because field will be hidden if param is deactivated)
        Lib.Purchasing.Vendor.Client.Contract.InitCombinedVendorBrowsePropertiesAndEventCallbacks();
        Lib.Purchasing.Vendor.Client.InitCombinedVendorValue();
        if (!CustomScript.documentViewer.isAdvisor) {
            await Lib.Purchasing.Vendor.Contract.UpdateVendorFromVendorRegistration();
        }
        if (Sys.Helpers.IsEmpty(Controls.VendorNumber__.GetValue()) && !Sys.Helpers.IsEmpty(Controls.CombinedVendor__.GetValue())) {
            Controls.CombinedVendor__.SetError("Unknown vendor");
            Process.ShowFirstError();
        }
        Lib.Purchasing.Vendor.Client.DetermineCombinedVendorTooltip();
        Lib.Purchasing.Vendor.Client.Contract.SetOnClickAndLinkOnVendorRegistrationID();
        if (Lib.Contract.Sourcing.FromSourcingEventCreation()) {
            await Lib.Contract.Sourcing.FillContractFromData();
            Lib.Contract.UpdateHeaderCurrency();
            const vendorName = Controls.CombinedVendor__.GetValue();
            if (vendorName) {
                await Lib.Contract.Sourcing.CompleteVendorOrVendorRegistration(vendorName);
            }
        }
        else if (Lib.Contract.HasItemsToCreate()) {
            Lib.Contract.ItemsToCreate.RefreshHeaderValueInItemsAndWarnings();
            Controls.ItemsToCreate__.RefreshRows();
        }
        if (ContractConfiguration.isSourcingAvailable) {
            Lib.Contract.Sourcing.InitSourcingIDLink();
        }
        Controls.AllowItemsToCreate__.Check(Controls.ItemsToCreate__.GetItemCount() > 0);
        Controls.AllowItemsToCreate__.OnChange = function () {
            Lib.Contract.ItemsToCreate.UpdateTmpData();
        };
        let func = Sys.Helpers.TryGetFunction("Lib.Contract.Customization.Client.CustomizeLayout");
        if (func) {
            await func();
        }
        else {
            await Sys.Helpers.TryCallFunction("Lib.Contract.Customization.Client.CustomiseLayout");
        }
        SetHelpID();
        CustomScript.documentViewer.UpdateTmpData();
        Lib.Contract.ItemsToCreate.InitTmpData({ IsAmendment: contractHandler.IsAmendment() });
        Lib.Contract.ItemsToCreate.UpdateTmpData();
        if (CustomScript.contract.isDraft) {
            await Lib.Contract.SynergyAssistant.Init();
        }
    }
    CustomScript.Main = Main;
    function ManageInitialDatesVisibility() {
        const showInitialDate = !Sys.Helpers.IsEmpty(Controls.StartDate__.GetValue()) && Sys.Helpers.Date.CompareDate(Controls.StartDate__.GetValue(), Controls.InitialStartDate__.GetValue()) != 0;
        Controls.Spacer2__.Hide(!showInitialDate);
        Controls.InitialStartDate__.Hide(!showInitialDate);
        Controls.InitialEndDate__.Hide(!showInitialDate);
    }
    CustomScript.ManageInitialDatesVisibility = ManageInitialDatesVisibility;
    async function InitializeRelatedSpending() {
        InitOperationDetailsView();
        InitSpendingInformation();
        await UpdateSpendingInformation();
    }
    function InitSpendingInformation() {
        Sys.Helpers.SilentChange(() => {
            Controls.SpendingInformation.SetLabelLength("50%");
            Controls.SpendingSpent.SetLabelLength("50%");
            Controls.SpendingIncoming.SetLabelLength("50%");
        });
        Controls.TotalSpentCounter__.SetClickable(true);
        Controls.TotalSpentCounter__.OnClick = () => {
            CustomScript.navigationDrawer.SelectItem(Lib.Contract.MenuItem.Spending);
        };
    }
    async function UpdateSpendingInformation() {
        try {
            const filter = Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", Data.GetValue("ContractNumber__"));
            const includeIncoming = false;
            const records = await CustomScript.contractSpendingHandler.QuerySpendingTable(filter);
            if (records && records[0]) {
                const record = records[0];
                Controls.ToApprove__.SetValue(record.ToApprove__);
                Controls.Committed__.SetValue(record.Committed__);
                const totalIncoming = new Sys.Decimal(record.ToApprove__ || 0).add(record.Committed__ || 0);
                Controls.TotalSpendingIncoming__.SetValue(totalIncoming.toNumber());
                Controls.Ordered__.SetValue(record.Ordered__);
                Controls.InvoicedPO__.SetValue(record.InvoicedPO__);
                Controls.InvoicedNonPO__.SetValue(record.InvoicedNonPO__);
                const totalSpent = CustomScript.contractSpendingHandler.ComputeSpent(record);
                Controls.TotalSpendingSpent__.SetValue(totalSpent.toNumber());
                Controls.Total_Available__.SetValue(Data.GetValue("MaxAmount__"));
                Controls.Total_Incoming__.SetValue(totalIncoming.toNumber());
                Controls.Total_Incoming__.Hide(!includeIncoming);
                Controls.Total_Spent__.SetValue(totalSpent.toNumber());
                const totalConsumed = new Sys.Decimal(totalSpent);
                if (includeIncoming) {
                    totalConsumed.add(totalIncoming);
                }
                let totalRemaining = new Sys.Decimal(0);
                let percentSpent = new Sys.Decimal(0);
                if (Data.GetValue("MaxAmount__")) {
                    totalRemaining = new Sys.Decimal(Data.GetValue("MaxAmount__")).minus(totalConsumed);
                    const percentRemaining = totalRemaining.div(Data.GetValue("MaxAmount__")).mul(100).round();
                    Controls.SpendingInformation.SetProgressBar({
                        value: percentRemaining.toNumber(),
                        label: Language.Translate("_{0}% Remaining", false, percentRemaining.toString())
                    });
                    percentSpent = totalSpent.div(Data.GetValue("MaxAmount__")).mul(100).round();
                    Controls.SpendingSpent.SetProgressBar({
                        value: percentSpent.toNumber(),
                        label: Language.Translate("_{0}% Spent", false, percentSpent.toString())
                    });
                    const percentIncoming = totalIncoming.add(totalSpent).div(Data.GetValue("MaxAmount__")).mul(100).round();
                    Controls.SpendingIncoming.SetProgressBar({
                        value: percentIncoming.toNumber(),
                        label: Language.Translate("_{0}% Incoming", false, percentIncoming.toString())
                    });
                }
                Controls.Total_Remaining__.SetValue(totalRemaining.toNumber());
                UpdateTotalSpentCounter(totalSpent, percentSpent);
            }
        }
        catch (error) {
            throw "Query Spending failed. Details: " + error;
        }
    }
    CustomScript.UpdateSpendingInformation = UpdateSpendingInformation;
    function UpdateTotalSpentCounter(totalSpent, percentSpentToMax) {
        let totalSpentSubValue = "";
        if (Data.GetValue("MinAmount__") && totalSpent.lt(Data.GetValue("MinAmount__"))) {
            const percentSpentToMin = totalSpent.div(Data.GetValue("MinAmount__")).mul(100).round();
            totalSpentSubValue = Language.Translate("_{0}% of the minimum", false, percentSpentToMin.toString());
        }
        else if (Data.GetValue("MaxAmount__")) {
            totalSpentSubValue = Language.Translate("_{0}% of the maximum", false, percentSpentToMax.toString());
        }
        const ccValues = CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__"));
        const localCurrency = ccValues ? ccValues.Currency__ : "";
        Controls.TotalSpentCounter__.SetValue({
            value: Lib.P2P.CurrencyFormat(totalSpent.toNumber(), localCurrency),
            subValue: totalSpentSubValue
        });
        Controls.TotalSpentCounter__.Hide(!ContractConfiguration.isSpendingFilled);
    }
    function InitOperationDetailsView() {
        Controls.OperationDetailsView__.SetView({
            tabName: "",
            viewName: "_Contract Budget Operation Details view",
            processOrTableName: "ContractSpendingOperationDetails__",
            checkProfileTab: false,
            isSystem: true,
            filterParameters: { contractNumber: Controls.ContractNumber__.GetValue() }
        });
        Controls.OperationDetailsView__.Apply();
        Controls.OperationDetailsView__.OpenInNewTab(true);
        Controls.OperationDetailsView__.OnViewLoaded = function () {
            UpdateSpendingInformation();
        };
    }
    async function InitHistoryTimeline() {
        Controls.AmendmentsTimeline__.ShowLoadMore(false);
        const contracts = await Lib.Contract.Amendment.GetContractHistory({
            originalRUIDEX: Data.GetValue("OriginalContractRUIDEX__"),
            sortOrder: "EffectiveDate__ DESC, Version__ DESC, ContractSubmissionDateTime__ DESC",
            maxRecords: 20
        });
        Controls.AmendmentsTimeline__.ShowEmptyMessage(!contracts || contracts.length === 0);
        contracts.forEach((amendment) => {
            const effectiveDate = Sys.Helpers.Date.ToLocaleDateEx(amendment.EffectiveDate__, User.culture);
            let content = `${Language.Translate("_Author")}: ${amendment.RequesterNiceName__}`;
            if (!Sys.Helpers.IsEmpty(amendment.Reasons__)) {
                content += `\n${Language.Translate("_Termination comment")}: ${amendment.Reasons__}`;
            }
            Controls.AmendmentsTimeline__.AddEntry({
                label: effectiveDate,
                title: Language.Translate("_VersionHeader", false, amendment.Version__),
                badge: {
                    class: GetClassByStatus(amendment.ContractStatus__).badgeClass,
                    text: Language.Translate(Lib.Contract.StatusLabels[amendment.ContractStatus__])
                },
                subtitle: amendment.NAME__,
                content: content,
                onClickParams: amendment.RUIDEX === Data.GetValue("RuidEx") ? false : [amendment.RUIDEX],
                line: {
                    colorIndex: Sys.Helpers.Date.IsDateInFuture(new Date(amendment.EffectiveDate__)) ? 4 : 1,
                    style: Sys.Helpers.Date.IsDateInFuture(new Date(amendment.EffectiveDate__)) ? "dashed" : "solid"
                },
                highlight: amendment.RUIDEX === Data.GetValue("RuidEx")
            });
        });
        Controls.AmendmentsTimeline__.SetEnd(true, {
            label: Language.Translate("_TimelineEffectiveDate"),
            line: {
                colorIndex: 4,
                style: "dashed"
            }
        });
        Controls.AmendmentsTimeline__.Refresh();
        Controls.AmendmentsTimeline__.OnEntryClick = function (contractRuidex) {
            let params = `FlexibleForm.aspx?id=${encodeURIComponent(contractRuidex)}&readonly=1&OnQuit=Close`;
            Process.OpenLink(params);
        };
    }
    function CanCreateInvoiceSchedules() {
        const status = Data.GetValue("ContractStatus__");
        const allowStatusForCreateBllSch = [
            Lib.Contract.Status.Active,
            Lib.Contract.Status.ApprovedPendingActivation
        ];
        return allowStatusForCreateBllSch.includes(status);
    }
    function OpenCompanyDashboard() {
        if (!Sys.Helpers.IsEmpty(Controls.VendorName__.GetValue())) {
            const vendorNumber = Controls.VendorNumber__.GetValue(), companyCode = Controls.CompanyCode__.GetValue();
            if (vendorNumber && companyCode) {
                Lib.P2P.SIM.OpenCompanyDashboard(vendorNumber, companyCode);
            }
        }
        //it's a vendor registration so opened VR process instead of dash of company
        else if (!Sys.Helpers.IsEmpty(Controls.VendorRegistrationID__.GetValue())) {
            Controls.VendorRegistrationID__.OnClick();
        }
    }
    function OpenDetailsRuidex(ruidex, encode = true, fromContract = false) {
        let params = `FlexibleForm.aspx?id=${encode ? encodeURIComponent(ruidex) : ruidex}&readonly=1&OnQuit=Close`;
        if (fromContract) {
            params += `&fromContract=1&vendorNumber=${Controls.VendorNumber__.GetValue()}`;
        }
        Process.OpenLink(params);
    }
    CustomScript.OpenDetailsRuidex = OpenDetailsRuidex;
    function GetClassByStatus(status) {
        //same as P2P\Application builder\ViewTypes\P2P - Contract.xml
        switch (status) {
            case Lib.Contract.Status.Active:
                return { color: "color1", badgeClass: "success border" };
            case Lib.Contract.Status.ApprovedPendingActivation:
            case Lib.Contract.Status.ApprovedPendingEnvelopeDesign:
            case Lib.Contract.Status.ApprovedPendingSignature:
                return { color: "color1", badgeClass: "info border" };
            case Lib.Contract.Status.Revoked:
            case Lib.Contract.Status.Rejected:
            case Lib.Contract.Status.Expired:
            case Lib.Contract.Status.SignatureRejected:
                return { color: "color2", badgeClass: "urgent border" };
            case Lib.Contract.Status.ToValidate:
            case Lib.Contract.Status.Draft:
                return { color: "color3", badgeClass: "warning border" };
            case Lib.Contract.Status.Deprecated:
            case Lib.Contract.Status.Deleted:
            default:
                return { color: "color4", badgeClass: "grayed border" };
        }
    }
    function RenderContractStatus() {
        Controls.contractStatusTag__.FireEvent("onLoadContractStatus", {
            statusLabel: Language.Translate(Lib.Contract.StatusLabels[Data.GetValue("ContractStatus__")]),
            color: GetClassByStatus(Data.GetValue("ContractStatus__")).color,
            terminationStatus: Language.Translate(CustomScript.contract.isToBeTerminated ? "_ContractIsToBeTerminated" : "")
        });
        Controls.contractStatusTag__.BindEvent("onClick", function () {
            CustomScript.navigationDrawer.SelectItem(Lib.Contract.MenuItem.TermsAndNotifications);
        });
    }
    function InitAvailableMenuItems() {
        if (!CustomScript.contract.isDeprecated) {
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.Dashboard);
        }
        CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.ContractInformation);
        CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.History);
        CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.TermsAndNotifications);
        CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.Workflow);
        if (ContractConfiguration.isSpendingFilled) {
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.Spending);
        }
        if (ContractConfiguration.hasAttachment) {
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.Document);
        }
        if (ContractConfiguration.isPurchasingEnable) {
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.CatalogItems);
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.Orders);
        }
        if (ContractConfiguration.isAPEnable) {
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.Invoices);
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.BillingSchedule);
        }
        if (ContractConfiguration.isContractSignatureEnabled) {
            CustomScript.navigationDrawer.AddAvailableItem(Lib.Contract.MenuItem.ESignature);
        }
    }
    function InitConditionalPanesInMenuItems() {
        if (ContractConfiguration.hasAttachment) {
            CustomScript.navigationDrawer.AddPaneOnItem(Lib.Contract.MenuItem.ContractInformation, "DocumentsPanel");
        }
        if (Data.GetValue("ContractStatus__") === Lib.Contract.Status.Deleted) {
            CustomScript.navigationDrawer.RemovePaneOnItem(Lib.Contract.MenuItem.TermsAndNotifications, "Notification");
            CustomScript.navigationDrawer.RemovePaneOnItem(Lib.Contract.MenuItem.TermsAndNotifications, "Validity");
            CustomScript.navigationDrawer.RemovePaneOnItem(Lib.Contract.MenuItem.ContractInformation, "Archive_Details");
            CustomScript.navigationDrawer.RemovePaneOnItem(Lib.Contract.MenuItem.Workflow, "Archive_Details");
        }
        if (CustomScript.contract.isToBeTerminated) {
            CustomScript.navigationDrawer.AddPaneOnItem(Lib.Contract.MenuItem.ContractInformation, "ContractTermination");
            CustomScript.navigationDrawer.AddPaneOnItem(Lib.Contract.MenuItem.TermsAndNotifications, "ContractTermination");
        }
        if (ContractConfiguration.isTacit) {
            CustomScript.navigationDrawer.RemovePaneOnItem(Lib.Contract.MenuItem.TermsAndNotifications, "Spending");
        }
        if (!ContractConfiguration.isSpendingFilled) {
            CustomScript.navigationDrawer.RemovePaneOnItem(Lib.Contract.MenuItem.Spending, "SpendingInformation");
        }
        if (!ContractConfiguration.isPurchasingEnable) {
            CustomScript.navigationDrawer.RemovePaneOnItem(Lib.Contract.MenuItem.Dashboard, "ChartPane");
        }
    }
    function IsVendorRegistrationEntityReachable(VendorRegistrationID__) {
        let filter;
        if (VendorRegistrationID__) {
            filter = Sys.Helpers.LdapUtil.FilterEqual("RuidEx", VendorRegistrationID__);
        }
        const queryOptions = {
            table: "CDNAME#Vendor Registration",
            filter: filter.toString(),
            attributes: ["RuidEx"],
            maxRecords: 1
        };
        return Sys.GenericAPI.PromisedQuery(queryOptions).Then((res) => {
            return res.length > 0;
        });
    }
    CustomScript.IsVendorRegistrationEntityReachable = IsVendorRegistrationEntityReachable;
    async function InitContractAnalysis() {
        Controls.AiCompliancyPrompt__.SetPlaceholder(Language.Translate("_AiCompliancyPrompt_placeholder"));
        //setting up warning banner for policy changes
        const warningMessage = Data.GetValue("ContractStatus__") === Lib.Contract.Status.ToValidate
            ? Language.Translate("_CompliancyPoliciesUpdateWarningApprover")
            : Language.Translate("_CompliancyPoliciesUpdateWarning");
        const htmlContent = `<div class="bannerContent">${warningMessage}</div>`;
        Controls.CompliancyPoliciesUpdateWarning__.SetHTML(htmlContent);
        if (Sys.Helpers.IsEmpty(Controls.AiCompliancyPrompt__.GetValue())) {
            await Lib.Contract.Policies.LoadDefault();
        }
        else {
            await Lib.Contract.Policies.QueryPoliciesFromDBAndMerge();
            Lib.Contract.Compliancy.UpdateTmpData();
        }
        Controls.TestContractPrompt__.OnClick = function () {
            ProcessInstance.Approve("TestContractPrompt");
        };
        Controls.ShowPlaybook__.OnClick = () => Lib.Contract.Policies.OnClickShowPlaybook(!ProcessInstance.isReadOnly && CustomScript.documentViewer.isDocumentOwnerOrBackup && User.IsBusinessRoleEnabled("PlaybookManager") && CustomScript.contract.isDraft);
    }
    CustomScript.InitContractAnalysis = InitContractAnalysis;
    async function ConditionnalLayout() {
        const promises = [];
        Controls.CombinedVendor__.SetRequired(true);
        Controls.CombinedVendor__.Hide(false);
        Controls.VendorName__.Hide(true);
        Controls.CombinedVendor__.DisplayAs({ type: "Link" });
        Controls.CombinedVendor__.OnClick = OpenCompanyDashboard;
        await InitContractAnalysis();
        if (CustomScript.contract.isVendorRegistrationVisible) {
            const VendorRegistrationID__ = Data.GetValue("VendorRegistrationID__");
            if (!Sys.Helpers.IsEmpty(VendorRegistrationID__)) {
                promises.push(CustomScript.IsVendorRegistrationEntityReachable(Data.GetValue("VendorRegistrationID__")).Then((isVendorEntityReachable) => {
                    if (!isVendorEntityReachable) {
                        Controls.VendorNumber__.DisplayAs({ type: "" });
                        Controls.VendorName__.DisplayAs({ type: "" });
                    }
                }));
            }
        }
        if (contractHandler.IsAmendment() && !CustomScript.contract.isTerminalStatus /* in workflow || ApprovedPending */) {
            promises.push(CustomScript.notificationTableHandler.InitNotificationPane(false).Then(() => {
                CustomScript.notificationTableHandler.SaveNotifications();
                Lib.P2P.Notification.Client.TmpData.tableInitialized = false;
                Lib.P2P.Notification.Client.TmpData.displayTable = false;
            }));
        }
        else {
            promises.push(CustomScript.notificationTableHandler.InitNotificationPane());
        }
        if (ContractViewProcessor.useNavigationDrawer) {
            RenderContractStatus();
            promises.push(InitializeRelatedSpending());
            promises.push(...ContractViewProcessor.FillNewLayoutPanes());
            if (!ContractConfiguration.isPurchasingEnable) {
                Controls.RelatedCatalogItemsCounter__.Hide(true);
                Controls.TotalAmountOrdered__.Hide(true);
                Controls.ChartAmountOrderedByMonth__.Hide(true);
            }
            if (!ContractConfiguration.isAPEnable) {
                Controls.TotalAmountInvoice__.Hide(true);
                Controls.ChartAmountInvoicedByMonth__.Hide(true);
            }
            InitHistoryTimeline();
            Controls.CreateBillingSchedule__.Hide(!CanCreateInvoiceSchedules());
            InitAvailableMenuItems();
            InitConditionalPanesInMenuItems();
            CustomScript.navigationDrawer.UpdateMenu();
            const defaultPanel = CustomScript.contract.isDeprecated ? Lib.Contract.MenuItem.ContractInformation : Lib.Contract.MenuItem.Dashboard;
            const selectedPane = Process.GetURLParameter("backpanel") || defaultPanel;
            CustomScript.navigationDrawer.SelectItem(selectedPane);
            FillContractInfo();
            await SetVendorCountry();
            if (!CustomScript.contract.isDeprecated) {
                FillDashboardData();
            }
        }
        else {
            let availablePanes = [
                "ContractDetails",
                "VendorContact",
                "Archive_Details",
                "ApprovalWorkflow",
                "PreviewPanel",
                "Banner",
                "Validity",
                "Notification"
            ];
            if (ContractViewProcessor.displayDocusignOptions) {
                availablePanes.push("ESignatureRecipientsPane");
            }
            if (!ContractConfiguration.isTacit) {
                availablePanes.push("Spending");
            }
            if (ContractConfiguration.hasAttachment) {
                availablePanes.push("DocumentsPanel");
            }
            if (Lib.Contract.Docusign.IsIntegrationEnable()) {
                Controls.EnableContractSignature__.OnChange();
            }
            if (contractHandler.IsAmendment()) {
                availablePanes.push("NewAmendmentPane");
            }
            if (CustomScript.contract.isToBeTerminated) {
                availablePanes.push("ContractTermination");
            }
            if (Lib.Contract.Publication.IsContractPublicationEnabled() && Lib.Contract.Publication.IsContractPublished()) {
                availablePanes.push("EventHistoryPane");
            }
            CustomScript.layout.DisplaySplitters([Splitter.Middle, Splitter.Right]);
            CustomScript.layout.DisplayPanels(availablePanes);
        }
        Process.ShowFirstError();
        return Promise.all(promises);
    }
    CustomScript.ConditionnalLayout = ConditionnalLayout;
    function FillDashboardData() {
        Controls.ChartAmountOrderedByMonth__.SetAdditionalFilter("(LINE_CONTRACTRUIDEX__=" + Data.GetValue("RuidEx") + ")");
        Controls.ChartAmountOrderedByMonth__.Refresh();
        Controls.ChartAmountInvoicedByMonth__.SetAdditionalFilter(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("OriginalContractRUIDEX__", Data.GetValue("OriginalContractRUIDEX__")), Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("OriginalContractRUIDEX__"), Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", Data.GetValue("ContractNumber__")))).toString());
        Controls.ChartAmountInvoicedByMonth__.Refresh();
        let DaysToExpire = Sys.Helpers.Date.ComputeDeltaDays(new Date(), Data.GetValue("EndDate__"));
        Controls.DaysToExpireCounter__.SetValue(DaysToExpire.toString());
        if (DaysToExpire < 0) {
            if (Controls.ContractStatus__.GetValue() === "Active") {
                Controls.DaysToExpireCounter__.SetValue("0");
            }
            else {
                Controls.DaysToExpireCounter__.Hide(true);
            }
        }
    }
    async function FillCatalogItemsData() {
        try {
            Controls.RelatedCatalogItems__.ItemUnit__.Hide(!Sys.Parameters.GetInstance("Contract").GetParameter("DisplayUnitOfMeasure"));
            let relatedCatalogItems = await Lib.Contract.QueryRelatedCatalogItems();
            Log.Info(`Found ${relatedCatalogItems.length} Catalog items`);
            relatedCatalogItems = relatedCatalogItems.sort((a, b) => a.ITEMNUMBER__ > b.ITEMNUMBER__ ? 1 : -1);
            Controls.RelatedCatalogItems__.Hide(!relatedCatalogItems.length);
            Controls.RelatedCatalogItemsNoItem__.Hide(!!relatedCatalogItems.length);
            Controls.RelatedCatalogItems__.ItemNumber__.OnClick = function () {
                CustomScript.OpenDetailsRuidex(relatedCatalogItems[this.GetRow().GetLineNumber(true) - 1].RUIDEX, true, true);
            };
            Controls.RelatedCatalogItems__.OnRefreshRow = function (idx) {
                const row = this.GetRow(idx);
                row.ItemNumber__.DisplayAs({ type: "Link" });
            };
            Lib.Contract.FillRelatedCatalogItems(relatedCatalogItems);
            Lib.Contract.ConfigureCatalogCounter(CustomScript.navigationDrawer, relatedCatalogItems.length.toString());
            //Displaying bulk action buttons if table contains items and user has permission to create PR
            //We don't check sourcing permission yet as it includes PR creation permission
            if (relatedCatalogItems.length && CustomScript.documentViewer.canCreatePurchaseRequisition) {
                Lib.Contract.InitRelatedCatalogItemsBulkActions(relatedCatalogItems, CustomScript.documentViewer.canCreateSourcingEvent);
            }
        }
        catch (reason) {
            Controls.RelatedCatalogItems__.Hide(true);
            Controls.RelatedCatalogItemsNoItem__.Hide(false);
            Controls.RelatedCatalogItemsCounter__.SetValue(0);
            Log.Error("Catalog items filling error: " + reason);
            Popup.Snackbar({
                message: Language.Translate("_FillDataError"),
                status: "error"
            });
        }
    }
    CustomScript.FillCatalogItemsData = FillCatalogItemsData;
    async function FillBillingScheduleData() {
        try {
            Controls.BillingSchedulesTable__.SetExtendableColumn("InvoiceNetAmount__");
            const relatedBillingScheduleItems = await Lib.Contract.QueryRelatedBillingScheduleItems();
            Log.Info(`Found ${relatedBillingScheduleItems.length} BillingSchedule items`);
            Controls.BillingSchedulesTable__.Hide(!relatedBillingScheduleItems.length);
            Controls.RelatedBillingSchedulesNoItem__.Hide(!!relatedBillingScheduleItems.length);
            Controls.BillingSchedulesTable__.BillingScheduleID__.OnClick = function () {
                CustomScript.OpenDetailsRuidex(relatedBillingScheduleItems[this.GetRow().GetLineNumber(true) - 1].BILLINGSCHEDULERUIDEX__);
            };
            Controls.BillingSchedulesTable__.InvoiceLink__.OnClick = function () {
                CustomScript.OpenDetailsRuidex(relatedBillingScheduleItems[this.GetRow().GetLineNumber(true) - 1].VENDORINVOICERUIDEX__);
            };
            Controls.BillingSchedulesTable__.OnRefreshRow = function (idx) {
                const row = this.GetRow(idx);
                row.BillingScheduleID__.DisplayAs({
                    type: "Link",
                    text: relatedBillingScheduleItems[row.GetLineNumber(true) - 1].BILLINGSCHEDULE__
                });
                row.InvoiceLink__.DisplayAs({
                    type: "Link",
                    text: relatedBillingScheduleItems[row.GetLineNumber(true) - 1].INVOICENUMBER__
                });
                if (relatedBillingScheduleItems[row.GetLineNumber(true) - 1].VENDORINVOICERUIDEX__) {
                    row.CreateInvoice__.Hide(true);
                }
            };
            Controls.BillingSchedulesTable__.CreateInvoice__.OnClick = function () {
                function fill_CB(dialog /*, tabId, event, control*/) {
                    const createInvoiceDialogDescription = dialog.AddDescription("CreateInvoiceDialogDescription__", null, 466);
                    createInvoiceDialogDescription.SetText(Language.Translate("_CreateInvoiceDialogDescription"));
                    const invoiceOptionsCtrl = dialog.AddComboBox("billingScheduleScenarioOptions", "_BillingScheduleScenarioOptions");
                    const availableValues = Sys.Helpers.Array.Map(Object.keys(Lib.P2P.BillingSchedule.BillingScheduleScenarioLabels), (v) => v + "=" + Lib.P2P.BillingSchedule.BillingScheduleScenarioLabels[v]).join("\n");
                    invoiceOptionsCtrl.SetAvailableValues(availableValues);
                    dialog.RequireControl(invoiceOptionsCtrl);
                }
                function commit_CB(dialog /*, tabId, event, control*/) {
                    const billingScheduleScenarioOptions = dialog.GetControl("billingScheduleScenarioOptions").GetValue();
                    Sys.GenericAPI.PromisedQuery({
                        table: Lib.P2P.BillingSchedule.BillingScheduledFormName,
                        filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ContractReferenceNumber__", Data.GetValue("ReferenceNumber__")), Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", Data.GetValue("ContractNumber__")), Sys.Helpers.LdapUtil.FilterEqual("BillingScheduleID__", billingScheduleID)).toString(),
                        attributes: ["*"],
                        maxRecords: 1,
                        additionalOptions: {
                            useConstantQueryCache: true,
                            searchInArchive: true
                        }
                    }).Then((result) => {
                        if (result && result.length > 0) {
                            const billingSchedule = result[0];
                            const billingScheduleAmountTolerance = Sys.Helpers.String.ToFloat(billingSchedule.TOLERANCEAMOUNT__);
                            const billingScheduleDayTolerance = Sys.Helpers.String.ToInteger(billingSchedule.TOLERANCEDAYS__);
                            let billingScheduleParameters = {
                                companyCode: Controls.CompanyCode__.GetValue(),
                                vendorNumber: Controls.VendorNumber__.GetValue(),
                                contractReferenceNumber: Data.GetValue("ReferenceNumber__"),
                                contractNumber: Data.GetValue("ContractNumber__"),
                                billingScheduleID: billingScheduleID,
                                billingScheduleDescription: billingSchedule.Description__,
                                billingScheduleInstallmentNumber: billingScheduleInstallmentNumber,
                                billingScheduleInstallmentDate: billingScheduleInstallmentDate,
                                billingScheduleInstallmentLocalNetAmount: billingScheduleInstallmentLocalNetAmount,
                                isSelfBillingInvoice: true,
                                invoiceLocalNetAmount: 0,
                                invoiceDate: ""
                            };
                            switch (billingScheduleScenarioOptions) {
                                case Object.keys(Lib.P2P.BillingSchedule.BillingScheduleScenarioLabels)[0]:
                                    billingScheduleParameters.invoiceDate = billingScheduleParameters.billingScheduleInstallmentDate;
                                    billingScheduleParameters.invoiceLocalNetAmount = billingScheduleParameters.billingScheduleInstallmentLocalNetAmount;
                                    break;
                                case Object.keys(Lib.P2P.BillingSchedule.BillingScheduleScenarioLabels)[1]:
                                    // eslint-disable-next-line no-case-declarations
                                    const newDate = new Date(billingScheduleParameters.billingScheduleInstallmentDate);
                                    newDate.setDate(newDate.getDate() + billingScheduleDayTolerance + 1);
                                    billingScheduleParameters.invoiceDate = Sys.Helpers.Date.Date2DBDate(newDate);
                                    billingScheduleParameters.invoiceLocalNetAmount = billingScheduleParameters.billingScheduleInstallmentLocalNetAmount;
                                    break;
                                case Object.keys(Lib.P2P.BillingSchedule.BillingScheduleScenarioLabels)[2]:
                                    billingScheduleParameters.invoiceDate = billingScheduleParameters.billingScheduleInstallmentDate;
                                    billingScheduleParameters.invoiceLocalNetAmount = Sys.Decimal.add(billingScheduleParameters.billingScheduleInstallmentLocalNetAmount, billingScheduleAmountTolerance).add(100).toNumber();
                                    break;
                                default:
                                    break;
                            }
                            Process.CreateProcessInstance(Lib.AP.VendorInvoice.Generator.ProcessName, null, Lib.AP.VendorInvoice.Generator.GetBillingScheduleToPDFProcessVariables(billingScheduleParameters, "PDF"), {
                                callback: (data) => {
                                    Popup.Snackbar({
                                        status: data.error ? "error" : "success",
                                        timeout: 6000,
                                        message: data.error ? Language.Translate("_InvoiceGenerationError") : Language.Translate("_InvoiceWillBeGeneratedInBackground"),
                                        closable: true,
                                        icon: "esk-ifont-tooltip-circle"
                                    });
                                }
                            });
                        }
                    });
                }
                const billingScheduleID = relatedBillingScheduleItems[this.GetRow().GetLineNumber(true) - 1].BILLINGSCHEDULE__;
                const billingScheduleInstallmentNumber = relatedBillingScheduleItems[this.GetRow().GetLineNumber(true) - 1].INSTALLMENT__;
                const billingScheduleInstallmentDate = relatedBillingScheduleItems[this.GetRow().GetLineNumber(true) - 1].BILLINGDATE__;
                const billingScheduleInstallmentLocalNetAmount = Sys.Helpers.String.ToFloat(relatedBillingScheduleItems[this.GetRow().GetLineNumber(true) - 1].AMOUNT__);
                Popup.Dialog("_InvoiceGenerationDialogTitle", null, fill_CB, commit_CB);
            };
            DisplayCreateSampleInvoiceBannerPane(relatedBillingScheduleItems);
            Lib.Contract.FillBillingSchedulesTables(relatedBillingScheduleItems);
        }
        catch (reason) {
            Log.Error("Billing Schedule filling error: " + reason);
            Popup.Snackbar({
                message: Language.Translate("_FillDataError"),
                status: "error"
            });
        }
    }
    CustomScript.FillBillingScheduleData = FillBillingScheduleData;
    function DisplayCreateSampleInvoiceBannerPane(relatedBillingScheduleItems) {
        let isPaneHidden = true;
        if (User.isInDemoAccount) {
            const translatedLinkHtmlTag = `<div class='link' onclick='displayCreateSampleInvoiceButton()'>${Language.Translate("_ClickHereLink")}</div>`;
            Controls.CreateSampleInvoiceBannerContent__.FireEvent("displayDemoText", {
                bannerLabelWithLink: Language.Translate("_ForDemonstrationPurposesClickHereToDisplayTheCreateSampleInvoiceFeature", false, translatedLinkHtmlTag)
            });
            Controls.CreateSampleInvoiceBannerContent__.BindEvent("displayCreateSampleInvoiceButton", function () {
                Controls.BillingSchedulesTable__.CreateInvoice__.Hide(false);
                Controls.BillingSchedulesTable__.CreateInvoice__.SetReadOnly(false);
                isPaneHidden = true;
            });
            isPaneHidden = !relatedBillingScheduleItems || relatedBillingScheduleItems.length === 0;
        }
        if (isPaneHidden || !CanCreateInvoiceSchedules()) {
            Controls.CreateSampleInvoiceBannerPane.Hide(true);
            Controls.BillingSchedulesTable__.CreateInvoice__.Hide(true);
        }
        else {
            CustomScript.navigationDrawer.AddPaneOnItem(Lib.Contract.MenuItem.BillingSchedule, "CreateSampleInvoiceBannerPane");
        }
    }
    function FillContractInfo() {
        Controls.InfoContractName__.SetLabel(Data.GetValue("Name__"));
        Controls.InfoContractNumber__.SetLabel(Data.GetValue("ReferenceNumber__"));
        const endDate = Sys.Helpers.Date.ToLocaleDateEx(Data.GetValue("EndDate__"), User.culture);
        const startDate = Sys.Helpers.Date.ToLocaleDateEx(Data.GetValue("StartDate__"), User.culture);
        Controls.InfoContractDate__.SetLabel(Language.Translate("_infoContractDate", false, startDate, endDate));
        Controls.InfoVendorName__.SetText(Data.GetValue("CombinedVendor__") || Data.GetValue("VendorName__"));
        Controls.InfoVendorName__.DisplayAs({ type: "Link" });
        Controls.InfoVendorName__.OnClick = OpenCompanyDashboard;
        Controls.VersionHeader__.SetText(Language.Translate("_VersionHeader", false, Data.GetValue("Version__")));
        Controls.VersionHeader__.DisplayAs({ type: "Link" });
        Controls.VersionHeader__.OnClick = () => {
            CustomScript.navigationDrawer.SelectItem(Lib.Contract.MenuItem.History);
        };
        const vendorEmail = Data.GetValue("VendorEmail__");
        if (vendorEmail) {
            Controls.InfoVendorContact__.SetLabel(vendorEmail);
            Controls.InfoVendorContact__.Hide(false);
        }
    }
    async function SetVendorCountry() {
        if (!Data.GetValue("VendorCountry__") && Data.GetValue("ContractStatus__") === Lib.Contract.Status.Draft) {
            const vendorRegistrationID = Data.GetValue("VendorRegistrationID__");
            const vendorNumber = Data.GetValue("VendorNumber__");
            let filter;
            if (!Sys.Helpers.IsEmpty(vendorRegistrationID)) {
                filter = Sys.Helpers.LdapUtil.FilterEqual("RuidEx", vendorRegistrationID).toString();
            }
            else {
                filter = Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber).toString();
            }
            const result = await Lib.Purchasing.Vendor.Client.QueryVendorAndVendorRegistrations("AP - Vendors__", "Country__", filter, "Name__ ASC", 1);
            const desiredVendor = result.length > 0 ? result[0] : result;
            if (desiredVendor === null || desiredVendor === void 0 ? void 0 : desiredVendor.Country__) {
                Controls.VendorCountry__.SetValue(desiredVendor.Country__);
            }
        }
    }
    CustomScript.SetVendorCountry = SetVendorCountry;
    const Splitter = Lib.P2P.Layout.Splitter;
    //#region LEFT MENU
    const menuContent = {
        [Lib.Contract.MenuItem.Dashboard]: {
            splitters: [Splitter.Middle],
            panes: ["DashboardPane", "ChartPane"],
            item: {
                id: "DashboardMenu",
                label: "_MenuItem_Dashboard",
                icon: "",
                groupId: 0,
                selected: true
            }
        },
        [Lib.Contract.MenuItem.ContractInformation]: {
            splitters: [Splitter.Middle],
            panes: ["ContractDetails", "VendorContact", "Archive_Details", "PreviewPanel"],
            item: {
                id: "ContractInformation",
                label: "_MenuItem_Contract_Details",
                icon: "",
                groupId: 0
            }
        },
        [Lib.Contract.MenuItem.TermsAndNotifications]: {
            splitters: [Splitter.Middle],
            panes: ["Validity", "Spending", "Notification"],
            item: {
                groupId: 0,
                id: Lib.Contract.MenuItem.TermsAndNotifications,
                label: "_MenuItem_TermsAndNotifications",
                icon: ""
            }
        },
        [Lib.Contract.MenuItem.Workflow]: {
            splitters: [Splitter.Middle],
            panes: Lib.Contract.Publication.IsContractPublicationEnabled() && Lib.Contract.Publication.IsContractPublished() ?
                ["ApprovalWorkflow", "EventHistoryPane", "Archive_Details"] : ["ApprovalWorkflow", "Archive_Details"],
            item: {
                groupId: 0,
                id: Lib.Contract.MenuItem.Workflow,
                label: "_MenuItem_Workflow",
                icon: ""
            }
        },
        [Lib.Contract.MenuItem.ESignature]: {
            splitters: [Splitter.Middle],
            panes: ["ESignatureRecipientsPane"],
            item: {
                groupId: 0,
                id: Lib.Contract.MenuItem.ESignature,
                label: "_MenuItem_ESignature",
                icon: ""
            }
        },
        [Lib.Contract.MenuItem.Document]: {
            splitters: [Splitter.Right],
            panes: ["PreviewPanel"],
            item: {
                id: "Document",
                label: "_MenuItem_Document_Preview",
                icon: "",
                groupId: 0
            }
        },
        [Lib.Contract.MenuItem.CatalogItems]: {
            splitters: [Splitter.Middle],
            panes: ["RelatedCatalogItemsPanel"],
            item: {
                id: "RelatedItemList",
                label: "_MenuItem_Related_Items",
                icon: "",
                groupId: 0
            }
        },
        [Lib.Contract.MenuItem.BillingSchedule]: {
            splitters: [Splitter.Middle],
            panes: ["RelatedBillingSchedulePanel"],
            item: {
                id: "BillingScheduleMenu",
                label: "_MenuItem_Billing_Schedule",
                icon: "",
                groupId: 0
            }
        },
        [Lib.Contract.MenuItem.History]: {
            splitters: [Splitter.Middle],
            panes: ["HistoryPanel"],
            item: {
                id: Lib.Contract.MenuItem.History,
                label: "_MenuItem_History",
                icon: "",
                groupId: 0
            }
        },
        [Lib.Contract.MenuItem.Orders]: {
            splitters: [Splitter.Middle],
            panes: ["RelatedPurchaseOrdersPanel"],
            item: {
                id: "OrdersMenu",
                label: "_MenuItem_Orders",
                icon: "",
                groupId: 1
            }
        },
        [Lib.Contract.MenuItem.Invoices]: {
            splitters: [Splitter.Middle],
            panes: ["RelatedInvoicesPanel"],
            item: {
                id: "InvoicesMenu",
                label: "_MenuItem_Invoices",
                icon: "",
                groupId: 1
            }
        },
        [Lib.Contract.MenuItem.Spending]: {
            splitters: [Splitter.Middle],
            panes: ["Spending", "OperationDetails", "SpendingInformation", "SpendingSpent", "SpendingIncoming"],
            item: {
                groupId: 1,
                id: Lib.Contract.MenuItem.Spending,
                label: "_MenuItem_Spending",
                icon: ""
            }
        }
    };
    //#endregion LEFT MENU
    if (Controls.InternalConversation__) {
        Controls.InternalConversation__.OnOpened = function () {
            Log.Info("[Internal Conversation] On Opened");
            // Get requester User msn
            let requesterMSN = Sys.TechnicalData.GetValue("requesterMSN");
            let getUserMSNPromise;
            if (requesterMSN) {
                getUserMSNPromise = Sys.Helpers.Promise.Resolve(requesterMSN);
            }
            else {
                getUserMSNPromise = Sys.OnDemand.Users.GetUsersFromLogins([Controls.RequesterLogin__.GetValue()], ["msn"], null)
                    .Then((user) => user.length > 0 && user[0].msn);
            }
            getUserMSNPromise.Then((userMSN) => {
                if (userMSN) {
                    Controls.InternalConversation__.GetParticipants().Then(function (participants) {
                        if (!Sys.Helpers.Array.Find(participants, (participant) => participant.msn == userMSN)) {
                            Controls.InternalConversation__.AddParticipant({ msn: userMSN }, {
                                noEmailNotification: true,
                                noPlatformNotification: true
                            }).Then(() => {
                                // success
                                Log.Info("[Internal Conversation] Add Requester to conversation has succeed");
                            }).Catch(() => {
                                // error
                                Log.Error("[Internal Conversation] Add Requester to conversation has failed");
                            });
                        }
                    });
                }
                else {
                    Log.Error("[Internal Conversation] Requester can't be added without his user msn.");
                }
            });
        };
    }
    function InitChatGPTAnswerHandling() {
        if (Variable.GetValueAsString("ChatGPTAnswer")) {
            try {
                Variable.SetValueAsString("ChatGPTAnswer", "");
                CustomScript.$HandleFieldsChangesFromChatGPTData();
            }
            catch (error) {
                Log.Error("Error on chatGPT answer parsing");
            }
        }
    }
    CustomScript.InitChatGPTAnswerHandling = InitChatGPTAnswerHandling;
    function InitEventHistoryPane() {
        const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({
            Options: {
                allowAttachments: true,
                mergeAllOptions: true,
                emailTemplate: "Event_MissedContractItem.htm",
                emailCustomTags: {
                    ReferenceNumber__: Data.GetValue("ReferenceNumber__")
                }
            }
        }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
        Controls.ConversationUI__.Init(conversationInfo);
    }
    CustomScript.InitEventHistoryPane = InitEventHistoryPane;
    function ShowPopupContractBeingProcessed() {
        Popup.Alert("_ExitFormDocumentProcessingMessage", false, null, "_ExitFormDocumentProcessingTitle");
        Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit();
        Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
    }
    CustomScript.ShowPopupContractBeingProcessed = ShowPopupContractBeingProcessed;
    function $HandleFieldsChangesFromChatGPTData() {
        CustomScript.OnStartDateChange();
        CustomScript.OnEndDateChange();
        if (Data.GetValue("TacitRenewal__")) {
            contractHandler.Fields.PriorNotice.OnChange();
            contractHandler.Fields.RenewalTerm.OnChange();
        }
        CustomScript.$HandleSpendingsAndAutorenewalInconsistency();
        CustomScript.ManageInitialDatesVisibility();
    }
    CustomScript.$HandleFieldsChangesFromChatGPTData = $HandleFieldsChangesFromChatGPTData;
    function $HandleSpendingsAndAutorenewalInconsistency() {
        CustomScript.OnMinMaxAmountChange();
        if (ContractConfiguration.hasSpendingData && ContractConfiguration.isTacit) {
            Controls.Spending.Hide(false);
        }
    }
    CustomScript.$HandleSpendingsAndAutorenewalInconsistency = $HandleSpendingsAndAutorenewalInconsistency;
    async function Init() {
        CustomScript.contract = new CContract();
        CustomScript.documentViewer = new Lib.Contract.Viewer(CustomScript.contract, ContractConfiguration, workflow);
        CustomScript.notificationTableHandler = new Lib.Contract.Notification.TableHandler(workflow, CustomScript.documentViewer);
        CustomScript.contractViewProcessor = new ContractViewProcessor();
        Controls.PreviewPanel.ClearHighlights(); // initially, do not display highlights on the preview panel (let the user click on the fields to do so)
        CustomScript.formTemplateManager.RegisterTemplate(Lib.P2P.Notification.Client.formTemplates);
        Lib.Contract.Compliancy.Init(CustomScript.formTemplateManager);
        Lib.Contract.ItemsToCreate.Init(CustomScript.formTemplateManager);
        Lib.Contract.Publication.Init(CustomScript.formTemplateManager, CanClickApproveButton);
        Lib.Contract.ButtonsBar.Init(CustomScript.formTemplateManager, contractHandler, CustomScript.contract, workflow, CustomScript.notificationTableHandler, CustomScript.documentViewer, CanClickApproveButton);
        await Lib.Contract.ContractDetails.Init(CustomScript.formTemplateManager, contractHandler);
        await Lib.Contract.Docusign.Init(CustomScript.formTemplateManager, CustomScript.contract, CustomScript.documentViewer, CustomScript.layout);
        await CustomScript.formTemplateManager.Apply();
        if (Process.GetURLParameter("projectls") && ProcessInstance.state && Process.GetURLParameter("syncWithProjectOnExit") == "1") {
            let contractItem = {
                ContractNumber__: Data.GetValue("ContractNumber__"),
                ReferenceNumber__: Data.GetValue("ReferenceNumber__"),
                Name__: Data.GetValue("Name__"),
                Description__: Data.GetValue("Description__"),
                CombinedVendor__: Data.GetValue("CombinedVendor__"),
                StartDate__: Data.GetValue("StartDate__"),
                EndDate__: Data.GetValue("EndDate__"),
                ContractStatus__: Data.GetValue("ContractStatus__"),
                ValidationUrl: Data.GetValue("ValidationUrl")
            };
            Data.StorageSetValue(Process.GetURLParameter("projectls"), JSON.stringify(contractItem));
            ProcessInstance.Quit("Quit");
        }
        CustomScript.layout.SetDocumentSize();
        CustomScript.layout.Hide(false);
        CustomScript.navigationDrawer = new Lib.P2P.Navigation.NavigationDrawer(CustomScript.layout, Controls.NavigationDrawer__, menuContent, (id) => {
            if (id === Lib.Contract.MenuItem.TermsAndNotifications) {
                CustomScript.notificationTableHandler.LoadNotifications();
            }
            if (Controls.form_content_internalconversation.IsVisible()) {
                Controls.form_content_internalconversation.SetSize(25);
            }
        }, "ContractInformationPane");
        if (CustomScript.documentViewer.canEditLegalInformationsAsAdmin) {
            const ccValues = CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__"));
            Sys.Parameters.GetInstance("Contract").Reload({
                newConfName: ccValues.DefaultConfiguration__,
                forceReload: true
            });
            await Sys.Parameters.GetInstance("Contract").PromisedIsReady();
        }
    }
    CustomScript.Init = Init;
    async function Start() {
        Sys.Helpers.EnableSmartSilentChange();
        // START - ignore all changes on form during the initialization processing
        ProcessInstance.SetSilentChange(true);
        Process.ShowFirstErrorAfterBoot(false);
        CustomScript.layout.HideDeprecatedControls();
        CustomScript.layout.UpgradeControls();
        CustomScript.layout.ShowWaitScreen();
        CustomScript.layout.Hide(true);
        try {
            await Sys.Parameters.IsReady();
            const isSAP = Lib.ERP.GetBrowseERPName("PAC") === "SAP";
            if (isSAP) {
                Lib.P2P.Browse.InitSAPVariable();
            }
            await CustomScript.LoadUserProperties();
            await Sys.Helpers.TryCallFunction("Lib.Contract.Customization.Client.OnLoad");
            await CustomScript.Init();
            await CustomScript.Main();
            await CustomScript.ConditionnalLayout();
            CustomScript.InitChatGPTAnswerHandling();
            CustomScript.InitEventHistoryPane();
            if (Data.GetValue("RuidEx")) {
                let isBeingProcessed = (ProcessInstance.state < 70 && ProcessInstance.isReadOnly);
                isBeingProcessed || (isBeingProcessed = Lib.Contract.Publication.IsContractPublished() && (await ProcessInstance.CheckResumeWithActionPending()).hasResumeActionPending);
                isBeingProcessed || (isBeingProcessed = (await ProcessInstance.CheckResumeWithActionPending(["BackToRequester"])).hasResumeActionPending);
                if (isBeingProcessed) {
                    CustomScript.ShowPopupContractBeingProcessed();
                }
            }
        }
        catch (reason) {
            Log.Error("GlobalError : " + reason);
        }
        CustomScript.layout.HideWaitScreen();
        Lib.CommonDialog.NextAlert.Show({});
        ProcessInstance.SetSilentChange(false);
    }
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map