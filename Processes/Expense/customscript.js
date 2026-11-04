"use strict";
var CustomScript;
(function (CustomScript) {
    /* Expense HTML page script */
    /** **************** **/
    /** Global variables **/
    /** **************** **/
    let OriginalOwner;
    const MILES_TO_KILOMETERS = 1.609344;
    let layout = {
        panes: ["Banner", "ExpenseInformation", "DocumentsPanel", "PreviewPanel", "TopPaneWarning", "SubExpenses", "ItemizeButtons"].map((name) => { return Controls[name]; }),
        actionButtons: ["Save", "DeleteExpense", "Close", "SaveAndNew"].map((name) => { return Controls[name]; }),
        taxFields: [
            {
                taxCode: Controls.TaxCode1__,
                taxRate: Controls.TaxRate1__,
                taxAmount: Controls.TaxAmount1__
            },
            {
                taxCode: Controls.TaxCode2__,
                taxRate: Controls.TaxRate2__,
                taxAmount: Controls.TaxAmount2__
            },
            {
                taxCode: Controls.TaxCode3__,
                taxRate: Controls.TaxRate3__,
                taxAmount: Controls.TaxAmount3__
            },
            {
                taxCode: Controls.TaxCode4__,
                taxRate: Controls.TaxRate4__,
                taxAmount: Controls.TaxAmount4__
            },
            {
                taxCode: Controls.TaxCode5__,
                taxRate: Controls.TaxRate5__,
                taxAmount: Controls.TaxAmount5__
            }
        ],
        HideWaitScreen: function (hide) {
            // async call just after boot
            setTimeout(() => {
                Controls.Date__.Wait(!hide);
            });
        }
    };
    /** ********* **/
    /** FUNCTIONS **/
    /** ********* **/
    function DispayTaxes() {
        layout.taxFields.forEach((fields) => {
            if (Controls.InputTaxRate__.GetValue() && !Sys.Helpers.IsEmpty(fields.taxCode.GetValue()) && fields.taxRate.GetValue() != 0) {
                fields.taxAmount.Hide(false);
                fields.taxAmount.SetLabel(Language.Translate("_TaxAmount", false, fields.taxRate.GetValue()));
            }
            else {
                fields.taxAmount.Hide(true);
            }
        });
    }
    function UpdateDisplayFieldsForMileage() {
        if (Controls.ExpenseType__.GetValue() === "Mileage") {
            Controls.ExchangeRate__.SetValue(1);
            Controls.TotalAmountCurrency__.SetValue(Controls.LocalCurrency__.GetValue());
            Lib.Expense.UpdateControl(["ExchangeRate__"]);
        }
    }
    function InitLayoutBeforeStarting() {
        Log.Info("InitLayoutBeforeStarting");
        Process.ShowFirstErrorAfterBoot(false);
        layout.panes.forEach((pane) => {
            pane.Hide(true);
        });
        layout.actionButtons.forEach((button) => {
            button.Hide(true);
        });
        Controls.TechnicalFieldsPanel.Hide(true);
        layout.HideWaitScreen(false);
    }
    async function InitLayout() {
        Log.Info("InitLayout");
        layout.panes.forEach((pane) => {
            pane.Hide(false);
        });
        layout.actionButtons.forEach((button) => {
            button.Hide(false);
        });
        layout.HideWaitScreen(true);
        InitProcessDisplayName();
        InitSubExpensesPanel();
        InitBanner();
        await InitInformationPanel();
        InitButtonsBar();
        InitWarningBanner();
        await CustomScript.TemplateManager.OnInitLayout();
        CustomScript.MileageManager.OnInitLayout();
        CustomScript.GeocodingManager.OnInitLayout();
        CustomScript.FuelManager.OnInitLayout();
        Lib.Expense.LayoutManager.SetRequiredFields(true);
        /** 03/03/2023 MLimone
         * Move CustomizeLayout call after OnInitLayout & SetRequiredFields.
         * Because CustomizeLayout was useless because all custom behaviour was overwritten by OnInitLayout...
         */
        let func = Sys.Helpers.TryGetFunction("Lib.Expense.Customization.Client.CustomizeLayout");
        if (func) {
            func();
        }
        else {
            Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Client.CustomiseLayout");
        }
        Lib.Expense.ControlsWatcher.CheckAll();
        InitHelpId();
        Process.ShowFirstError();
        let initCheckValidityTotalAmount = !Sys.Helpers.IsEmpty(Controls.TotalAmount__.GetValue());
        for (let i = 1; i <= 5; i++) {
            initCheckValidityTotalAmount = !Sys.Helpers.IsEmpty(Data.GetValue("TaxAmount" + i + "__")) || initCheckValidityTotalAmount;
        }
        if (initCheckValidityTotalAmount) {
            Lib.Expense.Client.CheckValidityTotalAmount(null);
        }
        await CustomScript.InitAllowedExtensions();
    }
    CustomScript.InitLayout = InitLayout;
    async function InitAllowedExtensions() {
        const allowedExtensions = {
            "AllowedDocumentFileExtensions": "PDF,JPG,JPEG,PNG",
            "AllowedAttachmentFileExtensions": "PDF"
        };
        await Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Client.RestrictAllowedExtensions", allowedExtensions);
        ProcessInstance.RestrictAllowedDocumentExtensions(allowedExtensions.AllowedDocumentFileExtensions);
        ProcessInstance.RestrictAllowedAttachmentsExtensions(allowedExtensions.AllowedAttachmentFileExtensions);
    }
    CustomScript.InitAllowedExtensions = InitAllowedExtensions;
    function InitWarningBanner() {
        let topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
        Log.Info("InitWarningBanner");
        Lib.P2P.DisplayArchiveDurationWarning("Expense", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning), "ExpenseArchiveDurationInMonths");
        Lib.P2P.DisplayOnBehalfWarning(User.loginId, (nameToDisplay, isCreatedBy) => {
            topMessageWarning.Clear();
            // Special message for CreateFor in draft status
            if (Data.GetValue("ExpenseStatus__") === "Draft" && !isCreatedBy) {
                topMessageWarning.Add(Language.Translate("_ExpenseCreateFor", true, nameToDisplay));
            }
            else if (isCreatedBy) {
                topMessageWarning.Add(Language.Translate("_ExpenseCreatedBy", true, nameToDisplay));
            }
            else {
                topMessageWarning.Add(Language.Translate("_ExpenseCreatedFor", true, nameToDisplay));
            }
        });
        Lib.P2P.DisplayOnBehalfOfModificationWarning(User.loginId, (nameToDisplay, isCreator) => {
            topMessageWarning.Clear();
            if (isCreator) {
                topMessageWarning.Add(Language.Translate("_LastEditedBy", true));
            }
            else if (isCreator !== undefined) {
                topMessageWarning.Add(Language.Translate("_ExpenseEditingFor", true, nameToDisplay));
            }
        });
        Lib.P2P.DisplayAdminWarning("PAC", function (displayName) {
            topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
        });
    }
    CustomScript.InitWarningBanner = InitWarningBanner;
    function InitBanner() {
        Log.Info("InitBanner");
        Sys.Helpers.Banner.SetStatusCombo(Controls.ExpenseStatus__);
        Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
        let status = Data.GetValue("ExpenseStatus__");
        if (Lib.Expense.Itemization.IsSubExpense()) {
            Lib.Expense.Itemization.Client.UpdateTitle();
        }
        else {
            Sys.Helpers.Banner.SetMainTitle("_Expense");
        }
        Sys.Helpers.Banner.SetSubTitle("_Banner expense " + status.toLowerCase());
    }
    function InitHelpId() {
        Log.Info("InitHelpId");
        if (Lib.Expense.Itemization.IsSubExpense()) {
            Process.SetHelpId("5053");
        }
        else {
            Process.SetHelpId("5050");
        }
    }
    function InitInformationPanel() {
        Log.Info("InitInformationPanel");
        let status = Data.GetValue("ExpenseStatus__");
        if (Lib.Expense.IsReadOnly() || status === "To approve" || status === "Pending delete") {
            Controls.ExpenseInformation.SetReadOnly(true);
        }
        if (!(Process.GetURLParameter("parentMsnEx") && Lib.Expense.Itemization.Client.IsSubExpenseOpenedFromParent())) {
            CustomScript.CompanyCodeManager.UpdateFilter();
        }
        Controls.ExpenseNumber__.Hide(!Data.GetValue("ExpenseNumber__"));
        Controls.CompanyCode__.Hide(!Controls.CompanyCode__.GetError());
        Controls.ReimbursableLocalAmount__.Hide(true);
        Controls.ReimbursableLocalAmount__.SetReadOnly(true);
        Controls.NonReimbursableLocalAmount__.Hide(true);
        Controls.NonReimbursableLocalAmount__.SetReadOnly(true);
        InitTransactionFields();
        const setAmountCurrency = Lib.Expense.SetTotalAmountCurrency()
            .Catch((e) => {
            Log.Error(`Failed to SetTotalAmountCurrency: ${e}`);
        });
        Lib.Expense.SetErrorExchangeRate();
        if (!Data.GetValue("Date__")) {
            Data.SetValue("Date__", new Date());
        }
        if (!Data.GetValue("OwnerName__")) {
            Data.SetValue("OwnerName__", User.fullName);
            CustomScript.OriginalOwnerManager.SetPreviousOriginalOwner(User.fullName);
        }
        const initOnBehalfOf = Lib.Expense.WaitUntilAllowedToCreateExpenseOnBehalfOfIsReady().Then(() => {
            Controls.OwnerName__.Hide(!Lib.Expense.OwnerNameFieldIsVisible());
            if (!Lib.Expense.IsAllowedToCreateExpenseOnBehalfOf()) {
                CustomScript.OriginalOwnerManager.UpdateFilter();
            }
        });
        if (Data.GetValue("State")) {
            Controls.OwnerName__.SetReadOnly(true);
        }
        DispayTaxes();
        return Sys.Helpers.Promise.All([setAmountCurrency, initOnBehalfOf]);
    }
    function InitTransactionFields() {
        Controls.CreatedFromBankStatement__.Hide(true);
        Controls.TransactionId__.Hide(true);
        Controls.CreatedFromBankStatement__.SetReadOnly(true);
        Controls.TransactionId__.SetReadOnly(true);
    }
    function DisplayItemizationSnackbar(subExpenseAction) {
        const messages = {
            "create": "_Itemization added",
            "delete": "_Itemization deleted",
            "update": "_Itemization updated"
        };
        Popup.Snackbar({
            "message": Language.Translate(messages[subExpenseAction]),
            "status": "success"
        });
    }
    CustomScript.DisplayItemizationSnackbar = DisplayItemizationSnackbar;
    function HandleSubExpenseChangeAndUpdateTable(subExpense, displaySnackbar = true) {
        Lib.Expense.Itemization.Client.Parent.HandleSubExpenseChange(subExpense);
        // clear table
        Controls.SubExpenses__.SetItemCount(0);
        const subExpenses = Lib.Expense.Itemization.Client.GetSubExpenses();
        Lib.Expense.Itemization.Client.FillSubExpenseTable(subExpenses); // TODO: avoid rebuilding the whole table since we can change only one line
        Data.SetValue("Itemized__", Controls.SubExpenses__.GetItemCount() > 0);
        Sys.TechnicalData.SetValue("requiredReceiptBySubExpenses", Lib.Expense.Itemization.Client.IsRequiredReceiptBySubExpenses(subExpenses));
        if (displaySnackbar) {
            DisplayItemizationSnackbar(subExpense.action);
        }
        // Update layout and status
        Lib.Expense.Itemization.Client.SaveParent();
        Lib.Expense.Itemization.Client.FillParentExpenseInfos();
        Lib.Expense.ComputeStatus();
        InitLayout();
        return Sys.Helpers.Promise.Resolve();
    }
    function InitLocalStorage() {
        if (Lib.Expense.Itemization.IsSubExpense()) {
            return Sys.Helpers.Promise.Resolve();
        }
        // don't rebuild the table, just refresh rows so ExpenseNumber__ is a link
        Controls.SubExpenses__.RefreshRows();
        Lib.Expense.Itemization.Client.RestoreModificationsFromVar();
        // load all subexpenses
        let returnedValue = Lib.Expense.Itemization.Client.LoadSubExpenses();
        returnedValue.Then(() => {
            Lib.Expense.Itemization.Client.SaveParent();
            Lib.Expense.Itemization.Client.FillParentExpenseInfos();
        });
        return returnedValue;
    }
    function IsExpenseDeletable() {
        // TODO : child expense supprimable si persistée && état supprimable
        return (!!ProcessInstance.state && Data.GetValue("Deleted") != "1") ||
            (Lib.Expense.Itemization.IsSubExpense() && false === Lib.Expense.Itemization.Client.IsNewSubExpense());
    }
    /**
     * Checks if the current user is allowed to delete the expense.
     * The user is allowed to delete if:
     * - CreatedOnBehalf is true and the user is either the creator or the original owner
     * - CreatedOnBehalf is false and the user is the creator (OwnerID)
     * @returns {boolean} true if the current user is allowed to delete the expense
     */
    function IsAllowedToDeleteExpense() {
        if (Lib.P2P.IsAdmin()) {
            return true;
        }
        const createdOnBehalf = Sys.Helpers.String.ToBoolean(Data.GetValue("CreatedOnBehalf"));
        const creatorOwnerID = Data.GetValue("CreatorOwnerID");
        const originalOwnerID = Data.GetValue("OriginalOwnerID");
        if (Lib.Expense.Itemization.IsSubExpense() && false === Lib.Expense.Itemization.Client.IsNewSubExpense()) {
            return true;
        }
        if (createdOnBehalf) {
            // If created on behalf, the user is owner if they are either the creator or the original owner
            return User.loginId === creatorOwnerID || User.loginId === originalOwnerID;
        }
        else {
            // If not created on behalf, the user is owner if they are the owner (creator)
            return User.loginId === creatorOwnerID;
        }
    }
    function OnSaveAndNewClick() {
        if (Lib.Expense.Itemization.IsSubExpense()) {
            ProcessInstance.SetSilentChange(true);
            Lib.Expense.ComputeStatus();
            const currentSubExpense = Lib.Expense.Itemization.Client.SubExpense.Transfert.SendDataToExpenseParent(null, false);
            Lib.Expense.Itemization.Client.SubExpense.HandleSubExpenseChange(currentSubExpense);
            const timestamp = new Date().getTime();
            let subExpenseMsnEx = Lib.Expense.Itemization.Client.PREFIX_NEW + timestamp;
            Lib.Expense.Itemization.Client.ClearAllFieldsInForm();
            Lib.Expense.ComputeStatus();
            ProcessInstance.SetSilentChange(false);
            return InitForm(() => {
                Lib.Expense.Itemization.Client.InitFieldsFromParentExpense(subExpenseMsnEx, true);
                return InitLayout()
                    .Then(() => Lib.CommonDialog.NextAlert.Show({}));
            }).Then(() => {
                DisplayItemizationSnackbar(currentSubExpense.action);
            });
        }
        return Sys.Helpers.Promise.Resolve();
    }
    CustomScript.OnSaveAndNewClick = OnSaveAndNewClick;
    function SetIsOwnerSavingVariable() {
        const ownerDN = Data.GetValue("OwnerID");
        const ownerLogin = ownerDN ? Sys.Helpers.String.ExtractLoginFromDN(ownerDN) : User.loginId;
        const isOwner = (User.loginId === ownerLogin);
        Variable.SetValueAsString("IsOwnerSaving", isOwner ? "true" : "false");
    }
    function InitButtonsBar() {
        const g_SyncWithReportLocalStorageKey = Process.GetURLParameter("ls");
        function OnConfirmDelete() {
            Lib.Expense.LayoutManager.SetRequiredFields(false);
            if (Lib.Expense.Itemization.IsSubExpense()) {
                Lib.Expense.ComputeStatus();
                Lib.Expense.Itemization.Client.SubExpense.Transfert.SendDataToExpenseParent("delete");
                ProcessInstance.Quit("Quit", true);
                return false;
            }
            const onQuitParam = (Process.GetURLParameter("onquit") || "").toLowerCase();
            if (onQuitParam === "back" || onQuitParam === "cleanandclose") {
                if (g_SyncWithReportLocalStorageKey) {
                    ProcessInstance.SetUrlParametersForPreventApproval("syncWithExpenseReportOnExit=1");
                }
                ProcessInstance.Approve("DeleteExpenseAndPreventApproval");
                return false;
            }
            ProcessInstance.ApproveAsynchronous("DeleteExpense");
        }
        Log.Info("InitButtonsBar");
        if (!IsExpenseDeletable() || !IsAllowedToDeleteExpense()) {
            // Not yet saved or user is not the document owner, no need to show the delete button
            Controls.DeleteExpense.Hide(true);
        }
        Controls.SaveAndNew.Hide(!Lib.Expense.Itemization.Client.IsNewSubExpense());
        let status = Data.GetValue("ExpenseStatus__");
        if (Lib.Expense.IsReadOnly() ||
            (Lib.Expense.Itemization.IsSubExpense() && !Lib.Expense.Itemization.Client.IsSubExpenseOpenedFromParent())) {
            Controls.Save.Hide(true);
            Controls.SaveAndNew.Hide(true);
            Controls.DeleteExpense.Hide(true);
            Controls.ItemizeButtons.Hide(true);
        }
        else if (status === "Draft" || status === "To submit") {
            if (!Lib.Expense.Itemization.IsSubExpense()) {
                Data.OnStorageChange(Lib.Expense.Itemization.Client.LocalStorage.GetKey(Lib.Expense.Itemization.Client.STORAGE_CHILD_TO_PARENT), event => {
                    const subExpense = JSON.parse(event.newValue);
                    Log.Info(`ChildToParent MsnEx: ${subExpense === null || subExpense === void 0 ? void 0 : subExpense.msnex}`);
                    if (subExpense === null || subExpense === void 0 ? void 0 : subExpense.msnex) {
                        HandleSubExpenseChangeAndUpdateTable(subExpense);
                    }
                });
            }
            if (Lib.Expense.Itemization.IsSubExpense()) {
                if (Lib.Expense.Itemization.Client.IsNewSubExpense()) {
                    Controls.Save.SetLabel("_Add itemization and quit");
                    Controls.SaveAndNew.SetLabel("_Add itemization and create another");
                }
                else {
                    Controls.Save.SetLabel("_Update itemization and quit");
                    Controls.SaveAndNew.Hide(true);
                }
                Controls.DeleteExpense.SetLabel("_Delete itemization");
            }
            Controls.Itemize__.OnClick = function () {
                OpenSubExpense();
                return false;
            };
            Controls.Close.OnClick = function () {
                Lib.Expense.Itemization.Client.LocalStorage.Clean(Lib.Expense.Itemization.Client.STORAGE_PARENT_TO_CHILD);
                if (g_SyncWithReportLocalStorageKey) {
                    ProcessInstance.Quit("Quit");
                    return false;
                }
                return null;
            };
            Controls.SaveAndNew.OnClick = () => {
                OnSaveAndNewClick();
                return false;
            };
            //TODO : version common du code de save
            Controls.Save.OnClick = function () {
                SetIsOwnerSavingVariable();
                if (!Lib.Expense.Transaction.KeepAmountsFromTransactionData()) {
                    Lib.Expense.FillLocalAmount();
                }
                if (Lib.Expense.Itemization.IsSubExpense()) {
                    Lib.Expense.ComputeStatus();
                    Lib.Expense.Itemization.Client.SubExpense.Transfert.SendDataToExpenseParent();
                    ProcessInstance.Quit("Quit", true);
                    return false;
                }
                let hasSubExpensesChanges = Lib.Expense.Itemization.Client.UpdateSubExpenseModificationsVar();
                if (Data.GetValue("state") === 90) {
                    ProcessInstance.ResumeWithActionAsynchronous("Save");
                    return false;
                }
                if (!Data.GetValue("ExpenseNumber__")) {
                    Lib.Expense.LayoutManager.SetRequiredFields(false);
                    if (g_SyncWithReportLocalStorageKey) {
                        ProcessInstance.SetUrlParametersForPreventApproval("syncWithExpenseReportOnExit=1");
                        ProcessInstance.Approve("Save");
                    }
                    else {
                        ProcessInstance.ApproveAsynchronous("Save");
                    }
                    return false;
                }
                Lib.Expense.LayoutManager.CleanHiddenFields();
                Lib.Expense.LayoutManager.FillEmptyFields();
                Lib.Expense.SetErrorExchangeRate();
                Lib.Expense.ComputeStatus();
                if (g_SyncWithReportLocalStorageKey) {
                    ProcessInstance.SetUrlParametersForPreventApproval("syncWithExpenseReportOnExit=1");
                    ProcessInstance.Approve("Save");
                    return false;
                }
                if (hasSubExpensesChanges) {
                    // Process.LeaveForm() called server side
                    ProcessInstance.Approve("SaveAndQuit");
                    return false;
                }
                return null;
            };
            Controls.DeleteExpense.OnClick = function () {
                GetConfirmPopup(Lib.Expense.Itemization.IsSubExpense(), OnConfirmDelete);
                return false;
            };
            Controls.DocumentsPanel.OnDocumentDeleted = Sys.Helpers.Wrap(Controls.DocumentsPanel.OnDocumentDeleted, function (originalFn) {
                // eslint-disable-next-line prefer-rest-params,no-invalid-this
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                if (Data.GetValue("Deleted") == "1") {
                    // Not yet saved, no need to show the delete button
                    Controls.DeleteExpense.Hide(true);
                }
                Lib.Expense.AIForExpenses.ForgetAll();
                //Serialize Attachments
                ProcessInstance.Save("Save");
            });
            Controls.DocumentsPanel.OnAttachmentAdded = Sys.Helpers.Wrap(Controls.DocumentsPanel.OnAttachmentAdded, function (originalFn) {
                // eslint-disable-next-line prefer-rest-params,no-invalid-this
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                //Serialize Attachments
                ProcessInstance.Save("Save");
            });
            Controls.DocumentsPanel.OnAttachmentDeleted = Sys.Helpers.Wrap(Controls.DocumentsPanel.OnAttachmentDeleted, function (originalFn) {
                // eslint-disable-next-line prefer-rest-params,no-invalid-this
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                //Serialize Attachments
                ProcessInstance.Save("Save");
            });
        }
        else {
            Controls.Save.Hide(true);
            Controls.SaveAndNew.Hide(true);
            Controls.DeleteExpense.Hide(true);
            Controls.ItemizeButtons.Hide(true);
        }
    }
    CustomScript.InitButtonsBar = InitButtonsBar;
    function GetConfirmPopup(subExpensePopup = false, cbOk, cbCancel) {
        Popup.Confirm(subExpensePopup ? "_Delete_SubExpense_explanation" : "_Delete_Expense_explanation", false, cbOk, cbCancel, subExpensePopup ? "_Delete SubExpense confirmation" : "_Delete expense confirmation");
    }
    CustomScript.GetConfirmPopup = GetConfirmPopup;
    function OnSubExpenseDelete(item) {
        return HandleSubExpenseChangeAndUpdateTable({
            action: "delete",
            msnex: item.GetValue("MsnEx__"),
            data: {}
        }, false);
    }
    CustomScript.OnSubExpenseDelete = OnSubExpenseDelete;
    function InitProcessDisplayName() {
        if (Lib.Expense.Itemization.IsSubExpense()) {
            Controls.form_header.SetProcessDisplayName("");
        }
    }
    CustomScript.InitProcessDisplayName = InitProcessDisplayName;
    function InitSubExpensesPanel() {
        //retrocompat purpose
        Controls.SubExpenses__.ViewItem__.Hide(true);
        //
        const status = Data.GetValue("ExpenseStatus__");
        const expenseReadOnly = Lib.Expense.IsReadOnly() || (status !== "Draft" && status !== "To submit");
        if (!Lib.Expense.Itemization.IsItemized() && expenseReadOnly) {
            Controls.SubExpenses.Hide(true);
        }
        else {
            Controls.SubExpenses.Hide(false);
            Controls.SubExpenses__.HideTableRowDelete(false);
            Controls.SubExpenses__.SetWidth("100%");
            Controls.SubExpenses__.SetExtendableColumn("Description__");
            Controls.SubExpenses__.View__.OnClick = OpenSubExpenseFromRow;
            Controls.SubExpenses__.ImageStatus__.OnClick = OpenSubExpenseFromRow;
            Controls.SubExpenses__.OnRefreshRow = function (index) {
                const row = this.GetRow(index);
                let url = row.ExpenseStatus__.GetValue() == "Draft" ? "draft_expense.svg" : "";
                row.ImageStatus__.SetIconURL(url);
                row.View__.SetAwesomeClasses(Lib.Expense.IsReadOnly() ? "fa fa-eye" : "fa fa-pencil");
            };
            Controls.SubExpenses__.OnDeleteItem = OnSubExpenseDelete;
            if (expenseReadOnly) {
                Controls.SubExpenses__.RefreshRows();
            }
            InitImageStatusColumnVisbility();
        }
    }
    CustomScript.InitSubExpensesPanel = InitSubExpensesPanel;
    function InitImageStatusColumnVisbility() {
        let hasAnyItemDraft = false;
        Data.GetTable("SubExpenses__").ForEachItem((item) => {
            hasAnyItemDraft || (hasAnyItemDraft = item.GetValue("ExpenseStatus__") === "Draft");
            return hasAnyItemDraft;
        }, true);
        Controls.SubExpenses__.ImageStatus__.Hide(!hasAnyItemDraft);
    }
    CustomScript.InitImageStatusColumnVisbility = InitImageStatusColumnVisbility;
    function OpenSubExpenseFromRow() {
        OpenSubExpense(this.GetRow().MsnEx__.GetValue());
        return false;
    }
    CustomScript.OpenSubExpenseFromRow = OpenSubExpenseFromRow;
    function OpenSubExpense(msnex) {
        const timestamp = new Date().getTime();
        let subExpenseMsnEx = "";
        if (!msnex) {
            subExpenseMsnEx = Lib.Expense.Itemization.Client.PREFIX_NEW + timestamp;
        }
        else {
            subExpenseMsnEx = msnex;
        }
        const parentMsnEx = "parent" + timestamp;
        Lib.Expense.Itemization.Client.LocalStorage.Clean(Lib.Expense.Itemization.Client.STORAGE_PARENT_TO_CHILD);
        Lib.Expense.Itemization.Client.Parent.Transfert.StoreDataInLocalStorageForSubExpense(subExpenseMsnEx, !msnex);
        OpenSubExpenseLink(Lib.Expense.Itemization.Client.LocalStorage.GetPrefix(), parentMsnEx, subExpenseMsnEx);
    }
    CustomScript.OpenSubExpense = OpenSubExpense;
    function OpenSubExpenseLink(localStoragePrefix, parentMsnEx, subExpenseMsnEx) {
        let url = "FlexibleForm.aspx?action=run";
        url += "&layout=_flexibleform";
        url += "&OnQuit=Close";
        url += "&willBeChild=0";
        url += "&doNotCopyExternalVarsFromAncestor=1";
        // standard parameters
        url += "&pName=Expense";
        url += "&attachmentsMode=all";
        url += "&startWithoutProcessing=1";
        if (ProcessInstance.state) {
            url += "&srcruid=" + encodeURIComponent(Data.GetValue("ruidex"));
        }
        if (Lib.Expense.IsReadOnly()) {
            url += "&ReadOnly=1";
        }
        // custom parameters
        url += "&lsprefix=" + encodeURIComponent(localStoragePrefix);
        url += "&parentMsnEx=" + encodeURIComponent(parentMsnEx);
        url += "&subExpenseMsnEx=" + encodeURIComponent(subExpenseMsnEx);
        Process.OpenLink({
            url: url,
            ignoreModif: false,
            inCurrentTab: false
        });
    }
    CustomScript.OpenSubExpenseLink = OpenSubExpenseLink;
    CustomScript.TemplateManager = (function () {
        let currentLayout = null;
        let ignoredFields = {};
        let fieldHistoryState = {};
        function IgnoreField(fieldName) {
            ignoredFields[fieldName] = true;
        }
        function IsIgnoredField(fieldName) {
            return fieldName in ignoredFields;
        }
        function RefreshLayout() {
            let setDefaultValueNeeded = false;
            if (currentLayout) {
                currentLayout.fields.forEach(field => {
                    if (!CustomScript.TemplateManager.IsIgnoredField(field.name)) {
                        let ctrl = Controls[field.name];
                        if (field.documentsPanel) {
                            ctrl.Hide(true);
                            Lib.Expense.LayoutManager.SetProcessedDocumentRequired(field.name, false);
                            Controls.PreviewPanel.Hide(true);
                        }
                        else {
                            ctrl.SetRequired(false);
                            ctrl.SetReadOnly(false);
                            // store previous state
                            if (ctrl.IsVisible()) {
                                fieldHistoryState[field.name] = { value: ctrl.GetValue() };
                            }
                            ctrl.Hide(true);
                            ctrl.SetInfo("");
                            ctrl.SetWarning("");
                            ctrl.SetError("");
                        }
                    }
                });
                currentLayout = null;
                setDefaultValueNeeded = true;
            }
            currentLayout = Lib.Expense.LayoutManager.GetLayout();
            currentLayout.fields.forEach(field => {
                if (!CustomScript.TemplateManager.IsIgnoredField(field.name)) {
                    let ctrl = Controls[field.name];
                    let hide = field.hidden || (!!field.visibilityCondition && !field.visibilityCondition());
                    let IsSubExpenseWithoutAttachment = Lib.Expense.Itemization.IsSubExpense() && Attach.GetNbAttach() === 0;
                    ctrl.Hide(hide);
                    if (field.documentsPanel) {
                        Lib.Expense.LayoutManager.SetProcessedDocumentRequired(field.name, field.required);
                        Controls.PreviewPanel.Hide(hide || IsSubExpenseWithoutAttachment);
                        Controls.DocumentsPanel.Hide(IsSubExpenseWithoutAttachment);
                    }
                    else {
                        ctrl.SetRequired(field.required);
                        ctrl.SetReadOnly(field.readonly);
                        if (ctrl.IsVisible() && (field.name in fieldHistoryState)) {
                            // restore value before we hide this control
                            ctrl.SetValue(fieldHistoryState[field.name].value);
                            delete fieldHistoryState[field.name];
                        }
                        if (Sys.Helpers.IsDefined(field.defaultValue) && setDefaultValueNeeded) {
                            ctrl.SetValue(field.defaultValue);
                        }
                    }
                }
            });
            Controls.Itemize__.Hide((!Lib.Expense.Itemization.IsItemizable()) || (!Lib.Expense.Itemization.IsItemized() && Lib.Expense.IsReadOnly()));
            Controls.SubExpenses.Hide((!Lib.Expense.Itemization.IsItemizable()) || (!Lib.Expense.Itemization.IsItemized() && Lib.Expense.IsReadOnly()));
            Controls.CompanyCode__.Hide(((Lib.Expense.Itemization.IsSubExpense() && Lib.Expense.Itemization.Client.SubExpense.ShouldHideCompanyCode()) ||
                (!Lib.Expense.Itemization.IsSubExpense() && !Lib.Expense.HasMultiCompanyCodes(OriginalOwner || Data.GetValue("OwnerID") || User.loginId))) &&
                !Controls.CompanyCode__.GetError());
            Lib.Expense.Itemization.Client.ApplyLayout();
            //Show CostCenterId and CostCenterName only if the field is visible in header 
            //ie. only if the expense type want to show the cost center if not itemized
            Controls.SubExpenses__.CostCenterId__.Hide(!Controls.CostCenterId__.IsVisible());
            Controls.SubExpenses__.CostCenterName__.Hide(!Controls.CostCenterName__.IsVisible());
            //On parent expense, hide cost center because it is usefull only for sub expenses
            //Only sub expenses are sent to the invoice
            if (Lib.Expense.Itemization.IsItemized()) {
                Controls.CostCenterName__.Hide(true);
                Controls.CostCenterId__.Hide(true);
            }
            UpdateBannerStatus();
        }
        function UpdateBannerStatus() {
            Lib.Expense.ComputeStatus();
            let status = Data.GetValue("ExpenseStatus__");
            Sys.Helpers.Banner.SetSubTitle("_Banner expense " + status.toLowerCase());
        }
        async function OnInitLayout() {
            Log.Info("TemplateManager.OnInitLayout");
            await Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.OnLoadLayoutManagerTemplates");
            currentLayout = null;
            ignoredFields = {};
            fieldHistoryState = {};
            if (Controls.CompanyCode__.GetError()) {
                IgnoreField("CompanyCode__");
                // Show company code when this field is in error
                Controls.CompanyCode__.SetReadOnly(false);
                Controls.CompanyCode__.Hide(false);
            }
            Controls.ExpenseType__.OnChange = Sys.Helpers.Wrap(Controls.ExpenseType__.OnChange, function (originalFn) {
                Log.Info("Controls.ExpenseType__.OnChange");
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                Lib.Expense.OnChangeExpenseType();
                this.SetImageColumn("Name__");
                Lib.Expense.AIForExpenses.ForgetLastSuggestedExpenseTypes();
                Lib.Expense.AIForExpenses.NotifyFieldHasChanged("ExpenseType__");
                RefreshLayout();
                Lib.Expense.Client.CheckValidityTotalAmount(null);
                UpdateDisplayFieldsForMileage();
                Lib.Expense.UpdateControl(["ExpenseType__"]);
                CustomScript.MileageManager.UpdateDistanceConfiguration();
                CustomScript.FuelManager.OnInitLayout();
            });
            Controls.Itemized__.OnChange = function () {
                Lib.Expense.Itemization.Client.SetupItemizedExpenseFields();
            };
            // Hide all fields before except if error
            Lib.Expense.LayoutManager.GetFieldNames().forEach(fieldName => {
                let ctrl = Controls[fieldName];
                ctrl.Hide(!ctrl.GetError());
            });
            RefreshLayout();
        }
        return {
            OnInitLayout: OnInitLayout,
            IgnoreField: IgnoreField,
            IsIgnoredField: IsIgnoredField
        };
    })();
    /**
     * Reset all fields except those you define.
     * @param exceptions those fields will not be reseted
     */
    function resetAllFields(exceptions) {
        Object.keys(Controls).forEach(control => {
            var _a, _b, _c, _d;
            if (control.endsWith("__") && !exceptions.includes(control)) {
                (_b = (_a = Controls[control]).SetValue) === null || _b === void 0 ? void 0 : _b.call(_a, "");
                (_d = (_c = Controls[control]).SetError) === null || _d === void 0 ? void 0 : _d.call(_c, "");
                Lib.Expense.AIForExpenses.NotifyFieldHasChanged(control);
            }
        });
    }
    CustomScript.resetAllFields = resetAllFields;
    CustomScript.CompanyCodeManager = {
        previousCompanyCode: "",
        UpdateFilter: function () {
            const filter = Lib.Expense.GetAllowedCompanyCodesFilter(OriginalOwner || Data.GetValue("OwnerID"));
            if (filter !== "") {
                Controls.CompanyCode__.SetFilter(filter);
            }
        },
        UpdateCompanyCode: function () {
            let fieldsToKeep = ["ExpenseNumber__", "OwnerName__", "ExpenseStatus__", "CompanyCode__", "Date__", "Description__", "CreatedFromBankStatement__", "TransactionId__"];
            const extraFieldsToKeep = Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Client.GetFieldsToKeepOnCompanyCodeChange");
            if (Array.isArray(extraFieldsToKeep) && extraFieldsToKeep.length > 0) {
                Log.Info("[UpdateCompanyCode] Extra fields to keep on company code change: " + extraFieldsToKeep.join(", "));
                fieldsToKeep = fieldsToKeep.concat(extraFieldsToKeep);
            }
            resetAllFields(fieldsToKeep);
            const newCC = Controls.CompanyCode__.GetValue();
            Lib.Expense.SetCurrencyFields(newCC);
            CustomScript.CompanyCodeManager.SetPreviousCompanyCode(newCC);
            InitForm(Start);
        },
        RevertPreviousCompanyCode: function () {
            Controls.CompanyCode__.SetValue(CustomScript.CompanyCodeManager.previousCompanyCode);
        },
        SetPreviousCompanyCode: function (previousCompanyCode) {
            CustomScript.CompanyCodeManager.previousCompanyCode = previousCompanyCode;
        }
    };
    CustomScript.OriginalOwnerManager = {
        previousOriginalOwner: "",
        UpdateFilter: function () {
            if (Lib.Expense.currentUserProperties.onBehalfOfUsers.length) {
                let usersFilter = Sys.Helpers.LdapUtil.FilterIn("Login", [User.loginId].concat(Lib.Expense.currentUserProperties.onBehalfOfUsers));
                Controls.OwnerName__.SetFilter(usersFilter.toString());
            }
        },
        UpdateOriginalOwnerDependencies: function (userLogin) {
            ProcessInstance.CreateOnBehalfOf(userLogin);
            OriginalOwner = userLogin;
            resetAllFields(["OwnerName__", "ExpenseStatus__"]);
            Controls.CompanyCode__.SetFilter(null);
            InitForm(Start);
            CustomScript.OriginalOwnerManager.SetPreviousOriginalOwner(Controls.OwnerName__.GetValue());
            InitWarningBanner();
        },
        RevertOriginalOwner: function () {
            Controls.OwnerName__.SetValue(CustomScript.OriginalOwnerManager.previousOriginalOwner);
            InitWarningBanner();
        },
        SetPreviousOriginalOwner: function (OriginalOwnerId) {
            CustomScript.OriginalOwnerManager.previousOriginalOwner = OriginalOwnerId;
        }
    };
    CustomScript.MileageManager = (function () {
        function IsNewExpense() {
            return Lib.Expense.Itemization.IsSubExpense()
                ? Lib.Expense.Itemization.Client.IsNewSubExpense()
                : !ProcessInstance.state;
        }
        function HasNumericValue(value) {
            return !Sys.Helpers.IsEmpty(value) && !isNaN(Number(value));
        }
        function IsDistanceUnit(value) {
            return value === "km" || value === "mi";
        }
        function UpdateDistanceLabel() {
            const corporateDistanceUnit = Controls.CorporateDistanceUnit__.GetValue();
            Controls.Distance__.SetLabel(IsDistanceUnit(corporateDistanceUnit)
                ? Language.Translate("_DistanceWithUnit", false, Language.Translate("_" + corporateDistanceUnit))
                : Language.Translate("_Distance"));
        }
        function CalculateMileageAmount() {
            if (Controls.Template__.GetValue() === "Distance") {
                const distance = Controls.Distance__.GetValue();
                let rate = Controls.MileageRate1__.GetValue();
                if (HasNumericValue(distance) && HasNumericValue(rate)) {
                    let total = Sys.Helpers.Round(new Sys.Decimal(distance), 2).mul(rate);
                    total = Sys.Helpers.Round(total, 2);
                    Controls.TotalAmount__.SetValue(total.toNumber());
                }
                else {
                    Controls.TotalAmount__.SetValue(0);
                }
            }
            Lib.Expense.UpdateControl(["TotalAmount__"]);
        }
        function UpdateMileage() {
            UpdateDistanceLabel();
            CalculateMileageAmount();
        }
        function UpdateDistanceConfiguration() {
            if (Controls.Template__.GetValue() !== "Distance") {
                return;
            }
            const companyCode = Controls.CompanyCode__.GetValue();
            if (Sys.Helpers.IsEmpty(companyCode)) {
                Controls.CorporateDistanceUnit__.SetValue("EMPTY");
                UpdateMileage();
                return;
            }
            Lib.P2P.CompanyCodesValue.QueryValues(companyCode)
                .Then((companyCodeValues) => {
                const configuredDistanceUnit = (companyCodeValues === null || companyCodeValues === void 0 ? void 0 : companyCodeValues.CorporateDistanceUnit__) || "";
                const corporateDistanceUnit = IsDistanceUnit(configuredDistanceUnit) ? configuredDistanceUnit : "";
                if (configuredDistanceUnit && !corporateDistanceUnit) {
                    Log.Warn("Invalid corporate distance unit configured for company code " + companyCode + ": " + configuredDistanceUnit);
                }
                const previousDistanceUnit = Controls.CorporateDistanceUnit__.GetValue();
                const distance = Controls.Distance__.GetValue();
                if (Controls.Template__.GetValue() === "Distance" && HasNumericValue(distance) &&
                    IsDistanceUnit(previousDistanceUnit) && IsDistanceUnit(corporateDistanceUnit) &&
                    previousDistanceUnit !== corporateDistanceUnit) {
                    const convertedDistance = corporateDistanceUnit === "mi"
                        ? new Sys.Decimal(distance).div(MILES_TO_KILOMETERS)
                        : new Sys.Decimal(distance).mul(MILES_TO_KILOMETERS);
                    Controls.Distance__.SetValue(Sys.Helpers.Round(convertedDistance, 2).toNumber());
                }
                Controls.CorporateDistanceUnit__.SetValue(corporateDistanceUnit ? corporateDistanceUnit : "EMPTY");
                UpdateMileage();
            })
                .Catch((error) => {
                Log.Error("UpdateDistanceConfiguration failed: " + error);
                if (Controls.CompanyCode__.GetValue() === companyCode) {
                    Controls.CorporateDistanceUnit__.SetValue("EMPTY");
                    UpdateMileage();
                }
            })
                .Finally(() => {
                CustomScript.GeocodingManager.UpdateComputedDistanceLink();
            });
        }
        function UpdateMileageFields(noVehicleType) {
            if (Controls.Template__.GetValue() === "Distance") {
                let vehicleType = noVehicleType ? "" : Controls.VehicleTypeName__.GetValue();
                let companyCode = Controls.CompanyCode__.GetValue();
                let expenseDate = Controls.Date__.GetValue();
                // Reset depending fields when missing info
                if (expenseDate && vehicleType && companyCode) {
                    Lib.Expense.SaveButtonDisabler.SetDisabled(true);
                    Lib.Expense.GetMileageInfo(vehicleType, companyCode, expenseDate)
                        .Then(function (info) {
                        Controls.VehicleTypeName__.SetError("");
                        Lib.Expense.SaveButtonDisabler.SetDisabled(false);
                        Controls.VehicleTypeID__.SetValue(info.ID__);
                        Controls.MileageRate1__.SetValue(info.REIMBURSMENTRATE1__);
                        UpdateDistanceConfiguration();
                    })
                        .Catch(function (error) {
                        Log.Error("UpdateMileageFields failed: " + error);
                        Controls.VehicleTypeName__.SetError("_No Mileage record found");
                        Lib.Expense.SaveButtonDisabler.SetDisabled(false);
                        Controls.MileageRate1__.SetValue(0);
                        Controls.VehicleTypeID__.SetValue("");
                        UpdateDistanceConfiguration();
                    });
                }
                else {
                    Controls.MileageRate1__.SetValue(0);
                    Controls.VehicleTypeID__.SetValue("");
                    UpdateMileage();
                }
            }
        }
        function DoQuery(callback, Table, Attributes, LdapFilter, SortOrder, MaxRecords, option) {
            Query.DBQuery(function () {
                callback(this.GetQueryValue());
            }, Table, Attributes, LdapFilter, SortOrder, "NO_LIMIT", null, "distinct=1");
        }
        function OnInitLayout() {
            Log.Info("MileageManager.OnInitLayout");
            UpdateDistanceLabel();
            Controls.Date__.OnChange = Sys.Helpers.Wrap(Controls.Date__.OnChange, function (originalFn) {
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("Date");
                Lib.Expense.AIForExpenses.NotifyFieldHasChanged("Date__");
                UpdateMileageFields();
                // For date-dependent custom exchange rate
                if (Controls.Date__.GetValue() && Controls.LocalCurrency__.GetValue() !== Controls.TotalAmountCurrency__.GetValue()) {
                    Lib.Expense.CheckCustomExchangeRate();
                }
            });
            Controls.Distance__.OnChange = Sys.Helpers.Wrap(Controls.Distance__.OnChange, function (originalFn) {
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                UpdateMileage();
            });
            Controls.CompanyCode__.OnChange = Sys.Helpers.Wrap(Controls.CompanyCode__.OnChange, function (originalFn) {
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                // Reset vehicleType because is invalid for the new company code
                Controls.VehicleTypeName__.SetValue("");
                UpdateDistanceConfiguration();
                UpdateMileageFields();
            });
            Controls.VehicleTypeName__.SetCustomQuery(DoQuery, null, DoQuery, null);
            if (!Lib.Expense.IsReadOnly()) {
                Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.VehicleTypeName__, () => UpdateMileageFields(), () => UpdateMileageFields(true), () => UpdateMileageFields(true));
            }
            if (IsNewExpense()) {
                UpdateDistanceConfiguration();
            }
        }
        return {
            OnInitLayout: OnInitLayout,
            UpdateMileage: UpdateMileage,
            UpdateDistanceConfiguration: UpdateDistanceConfiguration
        };
    })();
    CustomScript.GeocodingManager = (function () {
        const geocodingWarningIcon = {
            font: "font-awesome",
            name: "info-circle",
            colorIndex: "Warning",
            size: "MS"
        };
        const geocodingSuccessIcon = {
            font: "font-awesome",
            name: "check-circle-o",
            colorIndex: "1",
            size: "MS"
        };
        function SetGeocodingStatus(control, icon, warningMessage) {
            control.SetInnerIcon(icon ? { ...icon, transformation: "left-2" } : "");
            control.SetWarning(warningMessage || "");
        }
        function IsEnabled() {
            return Sys.Parameters.GetInstance("Expense").GetParameterBool("EnableExpenseDistanceComputation", false);
        }
        function SetCalculatedDistance(distance) {
            Data.SetValue("CalculatedDistance__", distance);
        }
        function ConvertCalculatedDistance(distance, distanceUnit) {
            let convertedDistance = new Sys.Decimal(distance);
            if (distanceUnit === "mi") {
                convertedDistance = convertedDistance.div(MILES_TO_KILOMETERS);
            }
            return Sys.Helpers.Round(convertedDistance, 2).toNumber();
        }
        function UpdateComputedDistanceLink() {
            if (!IsEnabled()) {
                return;
            }
            const control = Controls.ComputedDistanceLink__;
            const calculatedDistance = Number(Data.GetValue("CalculatedDistance__")) || 0;
            const hasCalculatedDistance = calculatedDistance > 0;
            const corporateDistanceUnit = Data.GetValue("CorporateDistanceUnit__");
            const hasCorporateDistanceUnit = corporateDistanceUnit === "km" || corporateDistanceUnit === "mi";
            const displayedDistance = ConvertCalculatedDistance(calculatedDistance, corporateDistanceUnit);
            const displayedDistanceUnit = hasCorporateDistanceUnit
                ? ` ${Language.Translate("_" + corporateDistanceUnit)}`
                : "";
            control.SetValue(Language.Translate("_UseComputedDistance", false, Language.FormatNumber(displayedDistance, { precisionMin: 2, precisionMax: 2 }), displayedDistanceUnit));
            control.SetError(hasCorporateDistanceUnit
                ? ""
                : Language.Translate("_MissingCorporateDistanceUnit"));
            if (hasCalculatedDistance && hasCorporateDistanceUnit) {
                control.DisplayAs({ type: "Link" });
            }
            else {
                control.DisplayAs();
            }
        }
        function ParseCoordinates(value, fieldName) {
            if (!value) {
                return null;
            }
            try {
                const coordinates = JSON.parse(value);
                return Array.isArray(coordinates) && coordinates.length === 2
                    ? coordinates
                    : null;
            }
            catch (error) {
                Log.Error(`[Geocoding] Invalid coordinates stored in ${fieldName}: ${error}`);
                return null;
            }
        }
        function ComputeDistance() {
            const requestedFromCoordinates = Data.GetValue("FromCoordinates__");
            const requestedToCoordinates = Data.GetValue("ToCoordinates__");
            const fromCoordinates = ParseCoordinates(requestedFromCoordinates, "FromCoordinates__");
            const toCoordinates = ParseCoordinates(requestedToCoordinates, "ToCoordinates__");
            if (!fromCoordinates || !toCoordinates) {
                SetCalculatedDistance(0);
                return;
            }
            Sys.Helpers.Geocoding.PromisedDirections({ profile: "driving" }, { coordinates: [fromCoordinates, toCoordinates] })
                .Then((response) => {
                var _a, _b;
                if (Data.GetValue("FromCoordinates__") !== requestedFromCoordinates ||
                    Data.GetValue("ToCoordinates__") !== requestedToCoordinates) {
                    return;
                }
                const calculatedDistance = response.success ? (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.routes[0]) === null || _b === void 0 ? void 0 : _b.distanceKilometers : null;
                if (typeof calculatedDistance === "number") {
                    SetCalculatedDistance(calculatedDistance);
                }
            });
        }
        function Geocode(control, coordinatesFieldName, resetCoordinates = true) {
            const searchText = control.GetValue();
            if (resetCoordinates) {
                Data.SetValue(coordinatesFieldName, "");
                SetCalculatedDistance(0);
            }
            SetGeocodingStatus(control);
            if (!searchText) {
                return;
            }
            Sys.Helpers.Geocoding.PromisedSearch({ text: searchText })
                .Then((response) => {
                var _a, _b;
                if (control.GetValue() !== searchText) {
                    return;
                }
                if (!response.success) {
                    SetGeocodingStatus(control, geocodingWarningIcon, Language.Translate("_GeocodingServiceUnavailable"));
                    return;
                }
                const results = ((_a = response.data) === null || _a === void 0 ? void 0 : _a.results) || [];
                if (results.length === 0) {
                    SetGeocodingStatus(control, geocodingWarningIcon, Language.Translate("_NoGeocodingResults"));
                    return;
                }
                if (results.length > 1) {
                    SetGeocodingStatus(control, geocodingWarningIcon, Language.Translate("_TooManyGeocodingResults"));
                    return;
                }
                const coordinates = (_b = results[0]) === null || _b === void 0 ? void 0 : _b.coordinates;
                if (Array.isArray(coordinates) && coordinates.length === 2) {
                    if (resetCoordinates) {
                        Data.SetValue(coordinatesFieldName, JSON.stringify(coordinates));
                        ComputeDistance();
                    }
                    SetGeocodingStatus(control, geocodingSuccessIcon);
                }
                else {
                    SetGeocodingStatus(control, geocodingWarningIcon, Language.Translate("_NoGeocodingResults"));
                }
            });
        }
        function OnInitLayout() {
            const computedDistanceLink = Controls.ComputedDistanceLink__;
            if (!IsEnabled()) {
                computedDistanceLink.SetError("");
                return;
            }
            computedDistanceLink.SetReadOnly(true);
            UpdateComputedDistanceLink();
            computedDistanceLink.SetBrowsable(false);
            computedDistanceLink.OnClick = () => {
                const currentCalculatedDistance = Number(Data.GetValue("CalculatedDistance__")) || 0;
                const corporateDistanceUnit = Data.GetValue("CorporateDistanceUnit__");
                if (!Controls.Distance__.IsReadOnly() && currentCalculatedDistance > 0 && (corporateDistanceUnit === "km" || corporateDistanceUnit === "mi")) {
                    Controls.Distance__.SetValue(ConvertCalculatedDistance(currentCalculatedDistance, corporateDistanceUnit));
                    CustomScript.MileageManager.UpdateMileage();
                }
            };
            Controls.CalculatedDistance__.OnSetValue = UpdateComputedDistanceLink;
            const corporateDistanceUnitControl = Controls.CorporateDistanceUnit__;
            corporateDistanceUnitControl.OnSetValue = Sys.Helpers.Wrap(corporateDistanceUnitControl.OnSetValue, function (originalFn) {
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                UpdateComputedDistanceLink();
            });
            Controls.From__.SetAllowTableValuesOnly(false);
            Controls.From__.SetAutocompletable(false);
            Controls.To__.SetAllowTableValuesOnly(false);
            Controls.To__.SetAutocompletable(false);
            Geocode(Controls.From__, "FromCoordinates__", false);
            Geocode(Controls.To__, "ToCoordinates__", false);
            Controls.From__.OnChange = Sys.Helpers.Wrap(Controls.From__.OnChange, function (originalFn) {
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                Geocode(Controls.From__, "FromCoordinates__");
            });
            Controls.To__.OnChange = Sys.Helpers.Wrap(Controls.To__.OnChange, function (originalFn) {
                originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                Geocode(Controls.To__, "ToCoordinates__");
            });
        }
        return {
            OnInitLayout: OnInitLayout,
            UpdateComputedDistanceLink: UpdateComputedDistanceLink
        };
    })();
    function OriginalOwnerChange(userLogin) {
        setTimeout(() => {
            Popup.Confirm("_This action will delete completed fields", false, () => CustomScript.OriginalOwnerManager.UpdateOriginalOwnerDependencies(userLogin), CustomScript.OriginalOwnerManager.RevertOriginalOwner, "_Warning");
        });
    }
    function OriginalCompanyCodeChange() {
        setTimeout(() => {
            Popup.Confirm("_Changing company code will delete all fields", false, CustomScript.CompanyCodeManager.UpdateCompanyCode, CustomScript.CompanyCodeManager.RevertPreviousCompanyCode, "_Warning");
        });
    }
    CustomScript.OriginalCompanyCodeChange = OriginalCompanyCodeChange;
    function ApplyGUITotalAmountCurrency() {
        if (Controls.TotalAmountCurrency__.GetError()) {
            CustomScript.TemplateManager.IgnoreField("TotalAmountCurrency__");
            Controls.TotalAmountCurrency__.SetReadOnly(false);
            Controls.TotalAmountCurrency__.Hide(false);
        }
        if (Controls.LocalCurrency__.GetValue() !== Controls.TotalAmountCurrency__.GetValue()) {
            Controls.ExchangeRate__.Hide(false);
            Controls.LocalAmount__.Hide(false);
        }
        else {
            Controls.ExchangeRate__.Hide(true);
            Controls.LocalAmount__.Hide(true);
        }
        let CCCurrency = Controls.LocalCurrency__.GetValue();
        let localAmountLabel = Language.Translate("_ExpenseLocalAmount"), reimbursableLocalAmountLabel = Language.Translate("_ReimbursableLocalAmount"), nonReimbursableLocalAmountLabel = Language.Translate("_NonReimbursableLocalAmount");
        if (CCCurrency) {
            CCCurrency = " (" + CCCurrency + ")";
            localAmountLabel += CCCurrency;
            reimbursableLocalAmountLabel += CCCurrency;
            nonReimbursableLocalAmountLabel += CCCurrency;
        }
        Controls.LocalAmount__.SetLabel(localAmountLabel);
        Controls.ReimbursableLocalAmount__.SetLabel(reimbursableLocalAmountLabel);
        Controls.NonReimbursableLocalAmount__.SetLabel(nonReimbursableLocalAmountLabel);
    }
    CustomScript.FuelManager = (function () {
        let MappingVolumeUnitByFuel;
        let corporateVolumeConverters;
        function UpdateCorporateFuelVolumeField(corporateVolumeConverters) {
            let volumeInCorporateUnit;
            volumeInCorporateUnit = ApplyFuelConversion(corporateVolumeConverters);
            Controls.CorporateFuelVolume__.SetValue(volumeInCorporateUnit);
            SetCorporateFuelVolumeUnit(corporateVolumeConverters);
        }
        function ApplyFuelConversion(corporateVolumeConverters) {
            let fuelVolume = Controls.FuelVolume__.GetValue();
            let fuelUnit = Controls.FuelVolumeUnit__.GetValue();
            if (fuelUnit === undefined || fuelUnit === null || isNaN(Number(fuelVolume)) || Sys.Helpers.IsEmpty(fuelVolume)) {
                return null;
            }
            if (fuelUnit in corporateVolumeConverters) {
                const conversionFunction = corporateVolumeConverters[fuelUnit].conversionFunction;
                let conversionResult = conversionFunction(fuelVolume);
                return conversionResult.convertedVolume;
            }
            return fuelVolume;
        }
        function SetFuelType(MappingVolumeUnitByFuel) {
            let fuelTypes = Object.keys(MappingVolumeUnitByFuel);
            let fuelTypeLabels = fuelTypes.map(fuelType => fuelType + "=" + MappingVolumeUnitByFuel[fuelType].label);
            Controls.FuelType__.SetAvailableValues(fuelTypeLabels);
            if (fuelTypes.length === 1) {
                Controls.FuelType__.SetReadOnly(true);
            }
            else {
                Controls.FuelType__.SetReadOnly(false);
            }
        }
        function SetFuelUnit(MappingVolumeUnitByFuel) {
            let selectedFuelType = Controls.FuelType__.GetValue();
            if (selectedFuelType in MappingVolumeUnitByFuel) {
                let units = MappingVolumeUnitByFuel[selectedFuelType].units;
                let labelValues = units.map(unitObj => unitObj.unit + "=" + unitObj.label);
                Controls.FuelVolumeUnit__.SetAvailableValues(labelValues);
                if (labelValues.length === 1) {
                    Controls.FuelVolumeUnit__.SetReadOnly(true);
                }
                else {
                    Controls.FuelVolumeUnit__.SetReadOnly(false);
                }
            }
        }
        function SetCorporateFuelVolumeUnit(corporateVolumeConverters) {
            var _a;
            let volumeUnitSelected = Controls.FuelVolumeUnit__.GetValue();
            let overridedCorporateUnit = (_a = corporateVolumeConverters[volumeUnitSelected]) === null || _a === void 0 ? void 0 : _a.overloadCorporateVolumeUnit;
            let labelCorporateUnit = overridedCorporateUnit ? "_" + overridedCorporateUnit : "_" + CustomScript.corporateVolumeUnit;
            if (!Sys.Helpers.IsEmpty(overridedCorporateUnit)) {
                Controls.CorporateFuelVolumeUnit__.SetAvailableValues(overridedCorporateUnit + "=" + labelCorporateUnit);
                Controls.CorporateFuelVolumeUnit__.SetValue(overridedCorporateUnit);
            }
            else {
                Controls.CorporateFuelVolumeUnit__.SetAvailableValues(CustomScript.corporateVolumeUnit + "=" + labelCorporateUnit);
                Controls.CorporateFuelVolumeUnit__.SetValue(CustomScript.corporateVolumeUnit);
            }
        }
        function GetFuelConversionMappings(corporateVolumeUnit) {
            let conversionMappings = {};
            let CONVERSION_FACTOR_GAL_L = 3.78541;
            if (corporateVolumeUnit === "L") {
                conversionMappings = {
                    "Gal": {
                        conversionFunction: (fuelVolume) => ({
                            convertedVolume: Sys.Decimal.mul(fuelVolume, CONVERSION_FACTOR_GAL_L).toNumber(),
                        })
                    },
                    "kWh": {
                        conversionFunction: (fuelVolume) => ({
                            convertedVolume: fuelVolume,
                        }),
                        overloadCorporateVolumeUnit: "kWh"
                    },
                    "L": {
                        conversionFunction: (fuelVolume) => ({
                            convertedVolume: fuelVolume,
                        })
                    }
                };
            }
            else {
                conversionMappings = {
                    "Gal": {
                        conversionFunction: (fuelVolume) => ({
                            convertedVolume: fuelVolume,
                        })
                    },
                    "kWh": {
                        conversionFunction: (fuelVolume) => ({
                            convertedVolume: fuelVolume,
                        }),
                        overloadCorporateVolumeUnit: "kWh"
                    },
                    "L": {
                        conversionFunction: (fuelVolume) => ({
                            convertedVolume: Sys.Decimal.div(fuelVolume, CONVERSION_FACTOR_GAL_L).toNumber(),
                        })
                    }
                };
            }
            return conversionMappings;
        }
        async function OnInitLayout() {
            if (!Controls.FuelType__.IsVisible()) {
                Controls.FuelType__.SetAvailableValues(null);
                Controls.FuelVolume__.SetValue(null);
                Controls.FuelVolumeUnit__.SetAvailableValues(null);
                Controls.CorporateFuelVolume__.SetValue(null);
                Controls.CorporateFuelVolumeUnit__.SetAvailableValues(null);
                return;
            }
            Log.Info("FuelManager.OnInitLayout");
            MappingVolumeUnitByFuel = {
                "Electric": { units: [{ unit: "kWh", label: "_kWh" }], label: "_Electric" },
                "UnleadedGas": { units: [{ unit: "L", label: "_L" }, { unit: "Gal", label: "_Gal" }], label: "_UnleadedGas" },
                "Diesel": { units: [{ unit: "L", label: "_L" }, { unit: "Gal", label: "_Gal" }], label: "_Diesel" },
            };
            let func = Sys.Helpers.TryGetFunction("Lib.Expense.Customization.Client.MappingVolumeUnitByFuel");
            if (func) {
                let custoMappingVolumeUnitByFuel = await func(MappingVolumeUnitByFuel);
                if (!!custoMappingVolumeUnitByFuel) {
                    MappingVolumeUnitByFuel = custoMappingVolumeUnitByFuel;
                }
            }
            corporateVolumeConverters = GetFuelConversionMappings(CustomScript.corporateVolumeUnit);
            let customConversionFunction = Sys.Helpers.TryGetFunction("Lib.Expense.Customization.Client.GetFuelConversionMappings");
            if (customConversionFunction) {
                let custoCorporateVolumeUnit = await customConversionFunction(CustomScript.corporateVolumeUnit);
                if (!!custoCorporateVolumeUnit) {
                    corporateVolumeConverters = custoCorporateVolumeUnit;
                }
            }
            // We Apply fuelType and fuelUnit which are define in MappingVolumeUnitByFuel
            SetFuelType(MappingVolumeUnitByFuel);
            SetFuelUnit(MappingVolumeUnitByFuel);
            SetCorporateFuelVolumeUnit(corporateVolumeConverters);
            UpdateCorporateFuelVolumeField(corporateVolumeConverters);
            Controls.FuelVolume__.OnChange = function () {
                UpdateCorporateFuelVolumeField(corporateVolumeConverters);
            };
            Controls.FuelVolumeUnit__.OnChange = function () {
                UpdateCorporateFuelVolumeField(corporateVolumeConverters);
            };
            Controls.FuelType__.OnChange = function () {
                SetFuelUnit(MappingVolumeUnitByFuel);
                SetCorporateFuelVolumeUnit(corporateVolumeConverters);
                UpdateCorporateFuelVolumeField(corporateVolumeConverters);
            };
        }
        return {
            OnInitLayout: OnInitLayout
        };
    })();
    /** ***** **/
    /** EVENT **/
    /** ***** **/
    Lib.Expense.SetTotalAmountCurrency = Sys.Helpers.Wrap(Lib.Expense.SetTotalAmountCurrency, function (originalFn) {
        ProcessInstance.SetSilentChange(true);
        const ret = originalFn.apply(this, Array.prototype.slice.call(arguments, 1))
            .Finally(() => {
            ApplyGUITotalAmountCurrency();
            ProcessInstance.SetSilentChange(false);
        });
        Lib.Expense.UpdateControl(["TotalAmountCurrency__"]);
        return ret;
    });
    Controls.TotalAmountCurrency__.OnSelectItem = () => Lib.Expense.SetTotalAmountCurrency(true);
    Controls.ExpenseType__.SetAttributes(Object.keys(Lib.Expense.expenseTypeTableToProcessFieldMapping).join("|"));
    Lib.Expense.OnSelectExpenseTypeItem = Sys.Helpers.Wrap(Lib.Expense.OnSelectExpenseTypeItem, function (originalFn) {
        originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
        DispayTaxes();
        Lib.Expense.UpdateControl(["ExpenseType__"]);
    });
    Controls.ExpenseType__.OnSelectItem = (item) => Lib.Expense.OnSelectExpenseTypeItem(item);
    Controls.ExpenseType__.SetImageColumn("Name__", { "HIGHLIGHT_NAME____": [{ value: "1", imageUrl: Lib.Expense.GetExpenseHighlightingImage() }] }, 18);
    Controls.ExpenseType__.SetCustomQuery(ExpenseTypeCustomQueryCallback, null, ExpenseTypeCustomQueryCallback);
    function ExpenseTypeCustomQueryCallback(callback, table, attributes, filter, sortOrder, maxRecords, config, option) {
        if (Data.GetValue("Itemized__")) {
            filter = Sys.Helpers.LdapUtil.FilterAnd(filter, Sys.Helpers.LdapUtil.FilterEqual("Itemizable__", "Optional")).toString();
        }
        const options = {
            table: table,
            filter: filter,
            attributes: attributes.split("|"),
            sortOrder: sortOrder,
            maxRecords: maxRecords,
            additionalOptions: option
        };
        const promise = Sys.GenericAPI.PromisedQuery(options).Then(queryResult => {
            const types = Lib.Expense.AIForExpenses.GetLastSuggestedExpenseTypes();
            for (let i = types.length - 1; i >= 0; i--) {
                const type = types[i];
                const j = Sys.Helpers.Array.FindIndex(queryResult, r => r.Name__ === type);
                if (j >= 0) {
                    const record = queryResult[j];
                    record.HIGHLIGHT_NAME____ = "1";
                    queryResult.splice(j, 1);
                    queryResult.unshift(record);
                }
            }
            return queryResult;
        });
        callback(promise);
    }
    Controls.TotalAmount__.OnChange = function (item) {
        Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("TotalAmount");
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("TotalAmount__");
        Lib.Expense.UpdateControl(["TotalAmount__"]);
        if (Lib.Expense.Itemization.IsSubExpense()) {
            Lib.Expense.Itemization.Client.UpdateParentRemainingAmountFromData();
        }
        else {
            Lib.Expense.Itemization.Client.SaveParent();
            Lib.Expense.Itemization.Client.FillParentExpenseInfos();
        }
        Lib.Expense.Client.CheckValidityTotalAmount(this);
    };
    Controls.TotalAmountCurrency__.OnChange = function (item) {
        Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("TotalAmountCurrency");
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("TotalAmountCurrency__");
        Lib.Expense.UpdateControl(["TotalAmountCurrency__"]);
    };
    Controls.TaxAmount1__.OnChange = function (item) {
        if (Lib.Expense.AIForExpenses.HasBeenFilledWithLastPredictions("TaxAmount1__")) {
            Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("Taxes");
        }
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("TaxAmount1__");
        Lib.Expense.Client.CheckValidityTotalAmount(this);
    };
    Controls.TaxAmount2__.OnChange = function (item) {
        if (Lib.Expense.AIForExpenses.HasBeenFilledWithLastPredictions("TaxAmount2__")) {
            Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("Taxes");
        }
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("TaxAmount2__");
        Lib.Expense.Client.CheckValidityTotalAmount(this);
    };
    Controls.TaxAmount3__.OnChange = function (item) {
        if (Lib.Expense.AIForExpenses.HasBeenFilledWithLastPredictions("TaxAmount3__")) {
            Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("Taxes");
        }
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("TaxAmount3__");
        Lib.Expense.Client.CheckValidityTotalAmount(this);
    };
    Controls.TaxAmount4__.OnChange = function (item) {
        if (Lib.Expense.AIForExpenses.HasBeenFilledWithLastPredictions("TaxAmount4__")) {
            Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("Taxes");
        }
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("TaxAmount4__");
        Lib.Expense.Client.CheckValidityTotalAmount(this);
    };
    Controls.TaxAmount5__.OnChange = function (item) {
        if (Lib.Expense.AIForExpenses.HasBeenFilledWithLastPredictions("TaxAmount5__")) {
            Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("Taxes");
        }
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("TaxAmount5__");
        Lib.Expense.Client.CheckValidityTotalAmount(this);
    };
    Controls.ExchangeRate__.OnChange = function () {
        if (!Lib.Expense.SetErrorExchangeRate()) {
            Lib.Expense.UpdateControl(["ExchangeRate__"]);
            Lib.Expense.Itemization.Client.Parent.UpdateSubExpensesExchangeRateAndAmount();
        }
    };
    Controls.LocalAmount__.OnChange = function () {
        if (!Sys.Helpers.IsEmpty(Controls.TotalAmount__.GetValue())) {
            Controls.ExchangeRate__.SetValue(Lib.Expense.ComputeExchangeRate());
            Lib.Expense.UpdateControl(["LocalAmount__"]);
        }
    };
    Controls.Refundable__.OnChange = function () {
        Lib.Expense.UpdateControl(["Refundable__"]);
    };
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.CostCenterName__, (item) => Controls.CostCenterId__.SetValue(item.GetValue("CostCenter__")), () => Controls.CostCenterId__.SetValue(""), () => Controls.CostCenterId__.SetValue(""));
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.CostCenterId__, (item) => Controls.CostCenterName__.SetValue(item.GetValue("Description__")), () => Controls.CostCenterName__.SetValue(""), () => Controls.CostCenterName__.SetValue(""));
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ProjectCodeDescription__, (item) => Controls.ProjectCode__.SetValue(item.GetValue("ProjectCode__")), () => Controls.ProjectCode__.SetValue(""), () => Controls.ProjectCode__.SetValue(""));
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ProjectCode__, (item) => Controls.ProjectCodeDescription__.SetValue(item.GetValue("Description__")), () => Controls.ProjectCodeDescription__.SetValue(""), () => Controls.ProjectCodeDescription__.SetValue(""));
    Controls.OwnerName__.OnSelectItem = function (item) {
        if (CustomScript.OriginalOwnerManager.previousOriginalOwner != Controls.OwnerName__.GetValue()) {
            OriginalOwnerChange(item.GetValue("login"));
        }
    };
    Controls.OwnerName__.OnChange = function () {
        if (Sys.Helpers.IsEmpty(Controls.OwnerName__.GetValue())) {
            OriginalOwnerChange("");
        }
    };
    Controls.CompanyCode__.OnSelectItem = Sys.Helpers.Wrap(Controls.CompanyCode__.OnSelectItem, function (originalFn, ...args) {
        originalFn === null || originalFn === void 0 ? void 0 : originalFn.apply(this, args);
        // Reset all fields because some could be invalid with the new company code
        const item = args[0];
        if (item.GetValue("CompanyCode__") !== CustomScript.CompanyCodeManager.previousCompanyCode) {
            OriginalCompanyCodeChange();
        }
    });
    Controls.Vendor__.OnChange = function () {
        Lib.Expense.AIForExpenses.ForgetLastPredictionsForData("Vendor");
        Lib.Expense.AIForExpenses.NotifyFieldHasChanged("Vendor__");
    };
    const refreshExpenseTypeIcon = () => {
        const imageUrl = Lib.Expense.GetExpenseHighlightingImage();
        const suggestedTypes = Lib.Expense.AIForExpenses.GetLastSuggestedExpenseTypes();
        Controls.ExpenseType__.SetLabelImageURL(suggestedTypes.length > 0 ? imageUrl : null);
    };
    Lib.Expense.AIForExpenses.OnLastSuggestedExpenseTypesChanged = () => refreshExpenseTypeIcon();
    refreshExpenseTypeIcon();
    /** ******** **/
    /** RUN PART **/
    /** ******** **/
    function Start() {
        const g_SyncWithReportLocalStorageKey = Process.GetURLParameter("ls");
        if (g_SyncWithReportLocalStorageKey && ProcessInstance.state && Data.GetValue("Deleted") != "1") {
            if (Process.GetURLParameter("syncWithExpenseReportOnExit") == "1") {
                // We are coming back from New Expense (or Expense Report's expense modification) "Save and quit"
                let expenseItem = Lib.Expense.Itemization.Client.FillDataWithAllFieldsInForm();
                expenseItem.MSNEX = ProcessInstance.id.split(".")[1];
                expenseItem.OwnerId = Data.GetValue("OwnerID");
                expenseItem.OriginalOwnerId = Data.GetValue("OriginalOwnerId");
                Data.StorageSetValue(g_SyncWithReportLocalStorageKey, JSON.stringify(expenseItem));
                ProcessInstance.Quit("Quit");
            }
        }
        Lib.Expense.Itemization.Client.InitFieldsFromParentExpense();
        return InitLayout()
            .Then(InitLocalStorage)
            .Then(() => Lib.CommonDialog.NextAlert.Show({}));
    }
    function LoadParameters() {
        return Sys.Helpers.Promise.All([
            Sys.Parameters.GetInstance("P2P").PromisedIsReady(),
            Sys.Parameters.GetInstance("Expense").PromisedIsReady()
        ]).Then(() => Sys.Helpers.Promise.All([
            CustomScript.corporateVolumeUnit = Sys.Parameters.GetInstance("P2P").GetParameter("CorporateFuelVolumeUnit", "L"),
            Lib.Expense.LoadUserProperties(OriginalOwner || Data.GetValue("OwnerID") || User.loginId).Then(() => {
                CustomScript.CompanyCodeManager.SetPreviousCompanyCode(Data.GetValue("CompanyCode__"));
            }),
            Sys.Helpers.Promise.Resolve(Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Client.OnLoad"))
        ]));
    }
    CustomScript.LoadParameters = LoadParameters;
    function InitForm(specificBehaviour) {
        Log.Time("InitForm");
        ProcessInstance.SetSilentChange(true);
        const promise = LoadParameters()
            .Then(specificBehaviour)
            .Finally(() => {
            // END - reenable changes on form
            ProcessInstance.SetSilentChange(false);
            ProcessInstance.SetDataChanged(false);
            Log.TimeEnd("InitForm");
        });
        Sys.Helpers.Synchronizer.OnProgressFromPromise(promise, { progressDelay: 15000 });
        return promise;
    }
    // ignore all changes on form during the initialization processing
    Sys.Helpers.EnableSmartSilentChange();
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Sys.Helpers.Promise.Resolve(InitLayoutBeforeStarting())
            .Then(() => InitForm(Start));
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map