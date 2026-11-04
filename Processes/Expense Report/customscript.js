"use strict";
var CustomScript;
(function (CustomScript) {
    CustomScript.topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
    let layout = {
        panes: ["Banner", "ExpenseReportInformation", "Expenses", "AddExpenseButtons", "ApprovalWorkflow"].map((name) => Controls[name]),
        actionButtons: ["Save", "SubmitExpenses", "BackToUser", "ModifyReport", "DeleteReport", "Retry", "Close", "DownloadCrystalReportsDataFile", "PreviewExpenseReport"].map((name) => Controls[name]),
        HideWaitScreen: function (hide) {
            // async call just after boot
            setTimeout(() => {
                Controls.TotalAmount__.Wait(!hide);
            });
        }
    };
    //Replacing variable controllerRemoveItem
    function isAllowedToRemoveItem() {
        const expenseReportStatus = Controls.ExpenseReportStatus__.GetValue();
        return (expenseReportStatus === "To control" || expenseReportStatus === "To approve") && (Lib.P2P.IsOwnerOrBackup() || Lib.P2P.IsAdmin());
    }
    CustomScript.isAllowedToRemoveItem = isAllowedToRemoveItem;
    function Init(status, isReadOnly) {
        switch (status.replace(/\s/g, "")) {
            case "Draft":
                if (!isReadOnly) {
                    // Buttons
                    Controls.SubmitExpenses.Hide(false);
                    Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(true);
                    Lib.Expense.Report.DeleteButtonDisabler.SetDisabled(Sys.Helpers.IsEmpty(Data.GetValue("RUIDEX")));
                    Controls.DeleteReport.Hide(Sys.Helpers.IsEmpty(Data.GetValue("RUIDEX")));
                    Controls.Save.Hide(false);
                    // Hide Requester name
                    Controls.UserName__.Hide(true);
                }
                else {
                    Controls.AddExpenseButtons.Hide(true);
                }
                break;
            case "Toapprove":
            case "Tocontrol":
                if (!isReadOnly) {
                    // Buttons
                    Controls.SubmitExpenses.Hide(false);
                    Controls.SubmitExpenses.SetText(Language.Translate(Lib.Expense.Report.Workflow.IsLastController() && Lib.Expense.Report.IsRefundable() ? "_Approve and create an invoice" : "_Approve"));
                    Controls.BackToUser.Hide(false);
                }
                else {
                    Controls.SubmitExpenses.SetDisabled(true);
                }
                Controls.ModifyReport.Hide(!IsCreator());
                // Fields
                Controls.UserName__.Hide(false);
                if (!CustomScript.isAllowedToRemoveItem()) {
                    // Prevent removing lines
                    Controls.ExpensesTable__.SetReadOnly(true);
                    Controls.ExpensesTable__.SetRowToolsHidden(true);
                }
                Controls.ExpenseReportInformation.SetReadOnly(true);
                Controls.ApprovalWorkflow.SetReadOnly(isReadOnly);
                if (!GetExpensesDeleted().length) {
                    Controls.AddExpenseButtons.Hide(true);
                }
                else {
                    Controls.NewExpense__.Hide(true);
                    Controls.BackToUser.SetDisabled(true);
                }
                break;
            default:
                Log.Error(`The Expense Report Status "${status}" is not recognize!`);
            // eslint-disable-next-line no-fallthrough
            case "Deleted":
                // Prevent adding/removing lines
                Controls.ExpensesTable__.SetReadOnly(true);
                Controls.ExpensesTable__.SetRowToolsHidden(true);
            // eslint-disable-next-line no-fallthrough
            case "Validated": // no break because Deleted has the next lines too
                Controls.AddExpenseButtons.Hide(true);
                Controls.SubmitExpenses.SetDisabled(true);
                Controls.ModifyReport.SetDisabled(true);
                break;
        }
    }
    Lib.Expense.ControlsWatcher.Register({
        name: "Label For Currency",
        controls: [{ name: "CC_Currency__" }],
        checkApplyingConditionFunc: function () {
            return true;
        },
        applyFunc: function () {
            let currency = Controls.CC_Currency__.GetValue();
            Controls.TotalAmount__.SetLabel(currency ? Language.Translate("_TotalAmount") + " (" + currency + ")" : Language.Translate("_TotalAmount"));
            Controls.RefundableAmount__.SetLabel(currency ? Language.Translate("_RefundableAmount") + " (" + currency + ")" : Language.Translate("_RefundableAmount"));
        }
    });
    function IsCreator() {
        return User.loginId === Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("CreatorOwnerID"))
            || User.loginId === Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OriginalOwnerID"));
    }
    function IsExpensesTableRefreshNeeded() {
        return (ProcessInstance.selectedRuidFromView || Controls.ExpensesTable__.GetItemCount() > 0) && Data.GetValue("ExpenseReportStatus__") === "Draft";
    }
    let gSaveOnQuit = false;
    function HighlightUpdatedLines(MsnEx) {
        Sys.Helpers.Controls.ForEachTableRow(Controls.ExpensesTable__, (row) => {
            if (row.ExpenseNumber__.GetError()) {
                row.AddRowStyle("grouped");
            }
            else if (row.ExpenseNumber__.GetWarning()) {
                if (row.ExpenseMSNEX__.GetValue() === MsnEx && row.ExpenseNumber__.GetWarning() != Language.Translate("_Warning tax amount expense report")) {
                    row.ExpenseNumber__.SetWarning(null);
                    // The line item has been updated, if user clicks on Quit, the updated line item will not be saved,
                    // as result, when reopen the expense report, the line item will have the warning "_Item has been updated".
                    // --> memorize this state and do Save on Quit
                    gSaveOnQuit = true;
                }
                else {
                    row.AddRowStyle("grouped");
                }
            }
        });
    }
    CustomScript.HighlightUpdatedLines = HighlightUpdatedLines;
    function SetExpensesFilter() {
        let UserFilter = Lib.Expense.currentUserProperties.usersAllowedToFinalizeOnBehalfOf;
        if (CustomScript.isAllowedToRemoveItem()) {
            Controls.BrowseExpense__.SetFilter("(MSNEX[=](" + GetExpensesDeletedMSNEX().join(",") + "))");
        }
        else {
            let argsfilterAnd = [];
            argsfilterAnd.push(Sys.Helpers.LdapUtil.FilterEqual("ExpenseStatus__", "To submit"));
            argsfilterAnd.push(Sys.Helpers.LdapUtil.FilterLesserOrEqual("state", "90"));
            // Build owner filters with base conditions
            let ownerFilters = [
                Sys.Helpers.LdapUtil.FilterEqual("OwnerID", "%[User:dn]"),
                Sys.Helpers.LdapUtil.FilterEqual("CreatorOwnerId", "%[User:dn]"),
            ];
            // Add filters for users in usersAllowedToFinalizeOnBehalfOf
            if (UserFilter && UserFilter.length > 0) {
                for (const userLogin of UserFilter) {
                    ownerFilters.push(Sys.Helpers.LdapUtil.FilterEqual("OwnerID", "cn=" + userLogin + "*"));
                }
            }
            argsfilterAnd.push(Sys.Helpers.LdapUtil.FilterOr(...ownerFilters));
            if (Controls.ExpensesTable__.GetItemCount() > 0) {
                // coherence with already selected items
                let msnexs = [];
                Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", (item) => {
                    // do not select items already selected
                    const parentMsnEx = item.GetValue("ParentMsnEx__");
                    if (msnexs.indexOf(parentMsnEx) == -1 && parentMsnEx) {
                        msnexs.push(parentMsnEx);
                    }
                    if (!parentMsnEx) {
                        msnexs.push(item.GetValue("ExpenseMSNEX__"));
                    }
                });
                argsfilterAnd.push(Sys.Helpers.LdapUtil.FilterNotIn("MSNEX", msnexs));
            }
            if (Data.GetValue("OriginalOwnerId") && Data.GetValue("User__")) {
                argsfilterAnd.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("OriginalOwnerId", "cn=" + Data.GetValue("User__") + "*"), Sys.Helpers.LdapUtil.FilterEqual("OriginalOwnerId", ""), Sys.Helpers.LdapUtil.FilterNotEqual("OriginalOwnerId", "*")));
            }
            else if (Data.GetValue("state")) {
                argsfilterAnd.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("OriginalOwnerId", "cn=" + Data.GetValue("OriginalOwnerId") + "*"), Sys.Helpers.LdapUtil.FilterEqual("OriginalOwnerId", ""), Sys.Helpers.LdapUtil.FilterNotEqual("OriginalOwnerId", "*")));
            }
            argsfilterAnd.push(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("ParentMsnEx__", ""), Sys.Helpers.LdapUtil.FilterNotEqual("ParentMsnEx__", "*")));
            Log.Info("SetExpensesFilter: " + Sys.Helpers.LdapUtil.FilterAnd(...argsfilterAnd).toString());
            Controls.BrowseExpense__.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(...argsfilterAnd).toString());
        }
    }
    CustomScript.SetExpensesFilter = SetExpensesFilter;
    function InitLayoutBeforeStarting() {
        Log.Info("InitLayoutBeforeStarting");
        // The process upgrading does not remove the removed spacer in the new process
        if (Controls["Spacer_line3__"]) {
            Controls["Spacer_line3__"].Hide();
        }
        //keepIt for backward compatibility
        if (Controls.Approve_Forward) {
            Controls.Approve_Forward.Hide(true);
        }
        Process.ShowFirstErrorAfterBoot(false);
        layout.panes.forEach((pane) => {
            pane.Hide(true);
        });
        layout.actionButtons.forEach((button) => {
            button.Hide(true);
        });
        layout.HideWaitScreen(false);
    }
    function InitPreviewPanel() {
        Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
        if (Attach.GetNbAttach() > 0 && Data.GetValue("ExpenseReportStatus__") != "Draft") {
            Log.Info("Form has a document");
            Log.Info("Document shown");
            // Workaround boot/customscript race condition to display and hide panels
            Controls.PreviewPanel.Hide(true);
            Controls.form_content_right.Hide(true);
            // End of workaround
            ProcessInstance.SetFormWidth();
            // Workaround boot/customscript race condition to display and hide panels
            setTimeout(() => {
                Controls.PreviewPanel.Hide(false);
                Controls.form_content_right.Hide(false);
                Controls.form_content_right.SetSize(45);
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
    function InitInformationPanel() {
        Controls.UserName__.Hide(false);
        Controls.ExpenseReportNumber__.Hide(Sys.Helpers.IsEmpty(Controls.ExpenseReportNumber__.GetValue()));
        Controls.SubmissionDate__.Hide(Sys.Helpers.IsEmpty(Controls.SubmissionDate__.GetValue()));
        Controls.CompanyCode__.Hide(!Lib.Expense.HasMultiCompanyCodes(Data.GetValue("User__")));
        Controls.ExpenseReportTypeName__.SetAttributes("ID__");
        let timeoutID = null;
        Controls.ExpenseReportTypeName__.OnSelectItem = function (item) {
            timeoutID && clearTimeout(timeoutID);
            timeoutID = setTimeout(() => {
                Controls.ExpenseReportTypeID__.SetValue(item.GetValue("ID__"));
                Lib.Expense.Report.Workflow.DelayRebuildWorkflow();
                timeoutID = null;
            });
        };
        Controls.ExpenseReportTypeName__.OnChange = function () {
            if (!timeoutID) {
                timeoutID = setTimeout(() => {
                    if (Sys.Helpers.IsEmpty(Controls.ExpenseReportTypeName__.GetValue())) {
                        Controls.ExpenseReportTypeID__.SetValue("");
                    }
                    Lib.Expense.Report.Workflow.DelayRebuildWorkflow();
                    timeoutID = null;
                });
            }
        };
    }
    async function InitInvoiceReference() {
        var viRuidEx = Controls.VIRuidEx__.GetValue();
        if (viRuidEx) {
            try {
                const queryResult = await Sys.GenericAPI.PromisedQuery({
                    table: "CDNAME#Vendor invoice",
                    filter: "(&(RuidEx=" + viRuidEx + ")(Deleted=0))",
                    attributes: ["InvoiceNumber__"],
                    sortOrder: null,
                    maxRecords: 1
                });
                if (queryResult.length) {
                    const invoiceNumber = queryResult[0].InvoiceNumber__ || "";
                    const invoiceLabel = Language.Translate("_View invoice", false);
                    if (invoiceNumber) {
                        Controls.VIRuidEx__.SetLabel(invoiceLabel);
                        Controls.VIRuidEx__.DisplayAs({ type: "Link", text: invoiceNumber });
                    }
                    else {
                        Controls.VIRuidEx__.SetLabel("");
                        Controls.VIRuidEx__.DisplayAs({ type: "Link", text: invoiceLabel });
                    }
                    Controls.VIRuidEx__.OnClick = function () {
                        Process.OpenMessage(viRuidEx, true, true);
                    };
                    Controls.VIRuidEx__.Hide(false);
                }
            }
            catch (error) {
                Log.Error("Error querying Vendor invoice '" + viRuidEx + "': " + error);
            }
        }
    }
    function InitExpensesTable() {
        Controls.ExpensesTable__.SetAtLeastOneLine(false);
        Controls.ExpensesTable__.SetWidth("100%");
        Controls.ExpensesTable__.SetExtendableColumn("ExpenseDescription__");
        Controls.BrowseExpense__.Hide(true);
        InitBankStatementColumns();
        Controls.ExpensesTable__.OnDeleteItem = async function (item) {
            const currentMsnex = item.GetValue("ExpenseMSNEX__");
            if (item.GetValue("Itemized__") == "1") {
                Sys.Helpers.Data.ForEachReverseTableItem("ExpensesTable__", it => {
                    if (it.GetValue("ParentMsnEx__") === currentMsnex) {
                        it.Remove();
                    }
                });
            }
            if (Data.GetTable("ExpensesTable__").GetItemCount() === 0) {
                Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(true);
            }
            await Lib.Expense.Report.SetHeaderFields();
            await Lib.Expense.Report.SetHeaderDependentTableLineFields();
            Lib.Expense.Report.UpdateAndCheckLines();
            if (CustomScript.isAllowedToRemoveItem()) {
                FillTechnicalDataWithExpenseDeleted(item);
                Controls.AddExpenseButtons.Hide(false);
                Controls.NewExpense__.Hide(true);
                Controls.BackToUser.SetDisabled(true);
            }
            RefreshWorkflow();
            await Lib.Expense.Report.DuplicateCheck.UpdateDuplicateWarning(CustomScript.topMessageWarning);
        };
        function InitBankStatementColumns() {
            Controls.ExpensesTable__.CreatedFromBankStatement__.Hide(true);
        }
        Controls.ExpensesTable__.OnRefreshRow = async function (index) {
            let row = Controls.ExpensesTable__.GetRow(index);
            row.ExpenseNumber__.DisplayAs({ type: "Link" });
            if (row.ExpenseNumber__.GetError() || row.ExpenseNumber__.GetWarning()) {
                row.AddRowStyle("grouped");
            }
            else {
                row.RemoveRowStyle("grouped");
            }
            let colorIdx = 0;
            // TODO: why looping *into* OnRefreshRow ?
            Controls.ExpensesTable__.ForEachItem((item, idx) => {
                const currentRow = Controls.ExpensesTable__.GetRow(idx);
                if (item.GetValue("ParentMsnEx__")) {
                    Controls.ExpensesTable__.HideTableRowDeleteForItem(idx, true);
                    currentRow.ExpenseNumber__.Hide(true);
                    currentRow.Billable__.Hide(false);
                    currentRow.Refundable__.Hide(false);
                    //currentRow.AddStyle("text-italic");
                    //currentRow.RemoveStyle("text-emphasis");
                }
                else if (item.GetValue("Itemized__") == true) { //Parent expense
                    Controls.ExpensesTable__.HideTableRowDeleteForItem(idx, false);
                    currentRow.ExpenseNumber__.Hide(false);
                    currentRow.Billable__.Hide(true);
                    currentRow.Refundable__.Hide(true);
                    //currentRow.AddStyle("text-emphasis");
                    //currentRow.RemoveStyle("text-italic");
                    colorIdx++;
                }
                else { //Standalone expense
                    Controls.ExpensesTable__.HideTableRowDeleteForItem(idx, false);
                    currentRow.ExpenseNumber__.Hide(false);
                    currentRow.Billable__.Hide(false);
                    currentRow.Refundable__.Hide(false);
                    //currentRow.RemoveStyle("text-emphasis");
                    //currentRow.RemoveStyle("text-italic");
                    colorIdx++;
                }
                if (colorIdx % 2 === 0) {
                    currentRow.AddRowStyle("whitened");
                    currentRow.RemoveRowStyle("greyed");
                }
                else {
                    currentRow.AddRowStyle("greyed");
                    currentRow.RemoveRowStyle("whitened");
                }
            });
            const status = Data.GetValue("ExpenseReportStatus__");
            if (status === "Draft" || status === "To approve" || status === "To control") {
                const results = await Lib.Expense.Report.DuplicateCheck.QueryDuplicate(row);
                Lib.Expense.Report.DuplicateCheck.DisplayDuplicateIndicator(row, results.length > 0);
            }
        };
        Controls.ExpensesTable__.Duplicate__.OnClick = async function () {
            const row = this.GetRow();
            const results = await Lib.Expense.Report.DuplicateCheck.QueryDuplicate(row);
            if (results.length > 0) {
                Lib.Expense.Report.DuplicateCheck.PopupDuplicate(row.ExpenseNumber__.GetValue(), results, null, null, {
                    requesterDisplayed: Data.GetValue("ExpenseReportStatus__") === "To control"
                        || Data.GetValue("ExpenseReportStatus__") === "To approve"
                });
            }
            else {
                Lib.Expense.Report.DuplicateCheck.DisplayDuplicateIndicator(row, false);
                Popup.Alert(["_Expense {0} is no longer duplicated", row.ExpenseNumber__.GetValue()], false, null, "_Duplicate check");
                await Lib.Expense.Report.DuplicateCheck.UpdateDuplicateWarning(CustomScript.topMessageWarning);
            }
        };
        Controls.ExpensesTable__.ExpenseNumber__.OnClick = function () {
            Controls.ExpensesTable__.ExpenseNumber__.Wait(true);
            let attributes = ["MsnEx", "ValidationURL", "ExpenseStatus__"];
            let filter = "ExpenseNumber__=" + this.GetValue();
            Sys.GenericAPI.Query("CDNAME#Expense", filter, attributes, (results, error) => {
                Controls.ExpensesTable__.ExpenseNumber__.Wait(false);
                if (!error && results && results.length > 0) {
                    let result = results[0];
                    if (!Lib.Expense.IsExpenseSubmittable(result.ExpenseStatus__) && !Lib.Expense.IsDraftExpense(result.ExpenseStatus__)) {
                        Process.OpenLink({ url: result.ValidationURL + "&OnQuit=Close" });
                    }
                    else {
                        const timestamp = new Date().getTime();
                        const localStorageName = "expense" + timestamp;
                        Data.OnStorageChange(localStorageName, (storageValue) => AddExpenseFromExpenseReport(storageValue, true));
                        Process.OpenLink({
                            url: result.ValidationURL + "&OnQuit=CleanAndClose&ls=" + localStorageName,
                            inCurrentTab: false,
                            returnUrlParams: "backmsnex=" + result.MsnEx
                        });
                    }
                }
                else {
                    Popup.Alert("_Expense not found or access denied", false, null, "_Expense not found title");
                }
            });
        };
        Controls.PreviewExpenseReport.OnClick = function () {
            let expenseReportTemplateInfos = Lib.Expense.Report.Export.GetExpenseReportTemplateInfos();
            Lib.P2P.Export.IsAvailableTemplate(Sys.Helpers.Globals.User, expenseReportTemplateInfos.template, expenseReportTemplateInfos.escapedCompanyCode)
                .Then((result) => {
                if (result.exist) {
                    let context = { expenseNumbers: Lib.Expense.Report.GetExpenseNumbersInForm() };
                    Lib.Expense.Report.QueryExpenses(context).Then((contextEx) => {
                        if (expenseReportTemplateInfos.fileFormat === "RPT") {
                            Process.OpenPreview({
                                "conversionType": Lib.P2P.GetCrystalConverterByParameter(),
                                "templateName": expenseReportTemplateInfos.template,
                                "language": expenseReportTemplateInfos.escapedCompanyCode,
                                "data": function (fnDataBuildDone) {
                                    Lib.Expense.Report.Export.CreateExpenseReportJsonString(contextEx, expenseReportTemplateInfos, (jsonString) => {
                                        fnDataBuildDone(jsonString);
                                    });
                                }
                            });
                        }
                        else {
                            throw "Unknown file extension: " + expenseReportTemplateInfos.fileFormat;
                        }
                    });
                }
                else {
                    throw "Template not found: " + expenseReportTemplateInfos.template;
                }
            })
                .Catch((e) => {
                Log.Error("Failed in IsAvailableTemplate: " + e);
                Popup.Alert("_An error occured when trying to open the preview", true, null, "_PreviewError");
            });
            return false;
        };
        Controls.DownloadCrystalReportsDataFile.OnClick = function () {
            let expenseReportTemplateInfos = Lib.Expense.Report.Export.GetExpenseReportTemplateInfos();
            if (expenseReportTemplateInfos.fileFormat === "RPT") {
                let context = { expenseNumbers: Lib.Expense.Report.GetExpenseNumbersInForm() };
                Lib.Expense.Report.QueryExpenses(context).Then((contextEx) => {
                    Process.OpenPreview({
                        "conversionType": Lib.P2P.GetCrystalConverterByParameter(),
                        "templateName": expenseReportTemplateInfos.template,
                        "language": expenseReportTemplateInfos.escapedCompanyCode,
                        "outputFormat": "mdb",
                        "data": function (fnDataBuildDone) {
                            Lib.Expense.Report.Export.CreateExpenseReportJsonString(contextEx, expenseReportTemplateInfos, (jsonString) => {
                                fnDataBuildDone(jsonString);
                            });
                        }
                    });
                });
            }
            return false;
        };
        Controls.ExpensesTable__.RefreshRows();
    }
    function InitBanner() {
        Log.Info("InitBanner");
        Sys.Helpers.Banner.SetStatusCombo(Controls.ExpenseReportStatus__);
        Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
        Sys.Helpers.Banner.SetMainTitle("Expense report");
        let status = Data.GetValue("ExpenseReportStatus__");
        Sys.Helpers.Banner.SetSubTitle("_Banner expense report " + status.toLowerCase());
    }
    CustomScript.InitBanner = InitBanner;
    function AddLineToExpenseTable(insertBeforeIndex) {
        if (Sys.Helpers.IsDefined(insertBeforeIndex)) {
            let itemAfter = Controls.ExpensesTable__.GetItem(insertBeforeIndex);
            if (itemAfter != null) {
                return itemAfter.AddItem(true);
            }
        }
        return Controls.ExpensesTable__.AddItem(false);
    }
    async function AddSingleExpenseToTable(item, insertionIndex) {
        let duplicate;
        try {
            duplicate = await Lib.Expense.Report.DuplicateCheck.CheckDuplicateBeforeAdd(item);
        }
        catch (e) {
            Log.Error("Error during loading duplicate");
            duplicate = false;
        }
        if (duplicate === null) {
            // The expense number are already currently queried,
            // or the user canceled the Popup
            // so skip it
            return;
        }
        let rowItem = AddLineToExpenseTable(insertionIndex);
        const row = Controls.ExpensesTable__.GetRow(Controls.ExpensesTable__.GetItemCount() - 1);
        Lib.Expense.Report.SetExpenseTableLine(rowItem, item);
        await Lib.Expense.Report.SetHeaderFields();
        await Lib.Expense.Report.SetHeaderDependentTableLineFields();
        if (CustomScript.isAllowedToRemoveItem()) {
            RemoveExpenseDeletedFromTechnicalData(item);
            if (GetExpensesDeleted().length === 0) {
                Controls.AddExpenseButtons.Hide(true);
                Controls.BackToUser.SetDisabled(false);
            }
        }
        Lib.Expense.Report.UpdateAndCheckLines();
        InitWarningBanner();
        if (Data.GetTable("ExpensesTable__").GetItemCount() > 0) {
            Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(false);
        }
        RefreshWorkflow();
        SetExpensesFilter();
        Lib.Expense.Report.DuplicateCheck.DisplayDuplicateIndicator(row, duplicate);
        if (duplicate) {
            await Lib.Expense.Report.DuplicateCheck.UpdateDuplicateWarning(CustomScript.topMessageWarning, true);
        }
    }
    CustomScript.AddSingleExpenseToTable = AddSingleExpenseToTable;
    async function AddSeveralQueryItemsToExpensesTable(queryResult, parentItem, insertionIndex) {
        await Promise.all(queryResult.map(async (result) => {
            result.GetValue = function (key) {
                return this[key];
            };
            let rowItem = AddLineToExpenseTable(insertionIndex);
            Lib.Expense.Report.SetExpenseTableLine(rowItem, result);
            await Lib.Expense.Report.SetHeaderFields();
            await Lib.Expense.Report.SetHeaderDependentTableLineFields();
            if (CustomScript.isAllowedToRemoveItem()) {
                RemoveExpenseDeletedFromTechnicalData(parentItem);
                InitWarningBanner();
                if (GetExpensesDeleted().length === 0) {
                    Controls.AddExpenseButtons.Hide(true);
                    Controls.BackToUser.SetDisabled(false);
                }
            }
        }));
        Lib.Expense.Report.UpdateAndCheckLines();
        if (Data.GetTable("ExpensesTable__").GetItemCount() > 0) {
            Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(false);
        }
        RefreshWorkflow();
        SetExpensesFilter();
        const duplicates = await Lib.Expense.Report.DuplicateCheck.CheckAllDuplicate();
        await Lib.Expense.Report.DuplicateCheck.UpdateDuplicateWarning(CustomScript.topMessageWarning, duplicates.length > 0);
    }
    CustomScript.AddSeveralQueryItemsToExpensesTable = AddSeveralQueryItemsToExpensesTable;
    async function AddItemToExpensesTable(item, insertionIndex) {
        if (!item.GetValue) {
            item.GetValue = function (key) {
                return this[key];
            };
        }
        if (Controls.ExpensesTable__.GetItemCount() === 0 && Sys.Helpers.IsEmpty(Data.GetValue("OriginalOwnerId"))) {
            //when creating an empty Expense report, the first line added should determine both OriginalOwnerId and User__
            Data.SetValue("User__", "");
            Data.SetValue("UserName__", "");
        }
        if (!item.GetValue("Itemized__") || item.GetValue("Itemized__") == "0") {
            return CustomScript.AddSingleExpenseToTable(item, insertionIndex);
        }
        //	ITEMIZED EXPENSE
        await CustomScript.AddSingleExpenseToTable(item, insertionIndex);
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ParentMsnEx__", item.GetValue("MSNEX")), Sys.Helpers.LdapUtil.FilterNotEqual("ExpenseStatus__", "Deleted")).toString();
        const results = await Sys.GenericAPI.PromisedQuery({
            attributes: Lib.Expense.Report.GetExpenseFieldsName(),
            table: "CDNAME#Expense",
            filter,
            maxRecords: 100
        });
        await CustomScript.AddSeveralQueryItemsToExpensesTable(results, item, Sys.Helpers.IsDefined(insertionIndex) ? insertionIndex + 1 : undefined);
    }
    CustomScript.AddItemToExpensesTable = AddItemToExpensesTable;
    /**
     * removes expense and its subexpenses from the expense table
     * @param parentItem main expense
     * @returns the initial index of the main expense
     */
    async function RemoveItemFromExpenseTable(parentItem) {
        if (!parentItem.GetValue) {
            parentItem.GetValue = function (key) {
                return this[key];
            };
        }
        // remove subexpenses
        if (parentItem.GetValue("Itemized__") == "1") {
            Sys.Helpers.Data.ForEachReverseTableItem("ExpensesTable__", (item) => {
                if (item.GetValue("ParentMsnEx__") == parentItem.GetValue("ExpenseMSNEX__")) {
                    item.Remove();
                }
            });
        }
        // get expense index
        let itemIndex = -1;
        Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", (item, i) => {
            if (item.GetValue("ExpenseMSNEX__") == parentItem.GetValue("ExpenseMSNEX__")) {
                itemIndex = i;
                return true;
            }
            return false;
        });
        // remove parent expense
        parentItem.Remove();
        // misc checks
        Lib.Expense.Report.UpdateAndCheckLines();
        if (Data.GetTable("ExpensesTable__").GetItemCount() === 0) {
            Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(true);
        }
        RefreshWorkflow();
        SetExpensesFilter();
        const duplicates = await Lib.Expense.Report.DuplicateCheck.CheckAllDuplicate();
        await Lib.Expense.Report.DuplicateCheck.UpdateDuplicateWarning(CustomScript.topMessageWarning, duplicates.length > 0);
        return itemIndex;
    }
    CustomScript.RemoveItemFromExpenseTable = RemoveItemFromExpenseTable;
    async function AddExpenseFromExpenseReport(storageValue, replace = false) {
        Log.Info("Storage changed: " + JSON.stringify({
            "type": storageValue.type,
            "key": storageValue.key,
            "oldValue": storageValue.oldValue,
            "newValue": storageValue.newValue
        }));
        if (Sys.Helpers.IsEmpty(storageValue.newValue)) {
            return;
        }
        if (storageValue.newValue) {
            try {
                let itemJson = JSON.parse(storageValue.newValue);
                itemJson.GetValue = function (fieldName) {
                    return itemJson[fieldName];
                };
                if (replace) {
                    let itemObject;
                    Controls.ExpensesTable__.ForEachItem((it) => {
                        if (it.GetValue("ExpenseMSNEX__") == itemJson.GetValue("MSNEX")) {
                            itemObject = it;
                        }
                    });
                    if (itemObject) {
                        const removedIndex = await RemoveItemFromExpenseTable(itemObject);
                        if (itemJson.GetValue("ExpenseStatus__") == "Deleted") {
                            Popup.Snackbar({
                                "message": Language.Translate("_Expense removed from the report"),
                                "status": "success"
                            });
                        }
                        else {
                            await AddItemToExpensesTable(itemJson, removedIndex);
                        }
                    }
                    else {
                        await AddItemToExpensesTable(itemJson);
                    }
                }
                else {
                    await AddItemToExpensesTable(itemJson);
                }
                localStorage.removeItem(storageValue.key);
            }
            catch (e) {
                Log.Error("INVALID NewValue : " + e.message);
            }
        }
    }
    function InitAddExpenseButton() {
        let attributesExpense = "OwnerId|ExpenseStatus__|InputTaxRate__|TaxAmount1__|TaxRate1__|TaxCode1__|TaxAmount2__|TaxRate2__|TaxCode2__|TaxAmount3__|TaxRate3__|TaxCode3__|TaxAmount4__"
            + "|TaxRate4__|TaxCode4__|TaxAmount5__|TaxRate5__|TaxCode5__|ExpenseNumber__|Itemized__|ParentMsnEx__|MSNEX";
        let additionalAttributesExpense = Lib.Expense.Report.GetExpenseFieldsName().join("|");
        attributesExpense = additionalAttributesExpense.concat("|" + attributesExpense);
        Controls.BrowseExpense__.SetAttributes(attributesExpense);
        Controls.BrowseExpense__.OnSelectItem = AddItemToExpensesTable;
        Controls.BrowseExpense__.OnColumnFormating = function (attributeName, value) {
            if (attributeName === "Date__") {
                value = Language.FormatDate(Sys.Helpers.Date.ISOSTringToDate(value));
            }
            return value;
        };
        Controls.AddExpense__.OnClick = function () {
            SetExpensesFilter();
            Controls.BrowseExpense__.DoBrowse();
        };
        Controls.NewExpense__.OnClick = function () {
            const timestamp = new Date().getTime();
            const localStorageName = "expense" + timestamp;
            Data.OnStorageChange(localStorageName, AddExpenseFromExpenseReport);
            let url = "FlexibleForm.aspx?action=run&layout=_flexibleform&pName=Expense&OnQuit=CleanAndClose&ls=" + localStorageName;
            Process.OpenLink({ url: url, inCurrentTab: false });
        };
    }
    function InitWorkflow() {
        let wkf = Lib.Expense.Report.Workflow;
        wkf.controller.Define(wkf.parameters);
        RefreshWorkflow();
    }
    function RefreshWorkflow() {
        let wkf = Lib.Expense.Report.Workflow;
        if (!wkf.IsReadOnly()) {
            // only once
            if (wkf.controller.GetTableIndex() === 0) {
                wkf.controller.SetRolesSequence([
                    wkf.enums.roles.user,
                    wkf.enums.roles.manager,
                    wkf.enums.roles.controller
                ]);
            }
            else if (wkf.controller.RebuildAllowed()) {
                // The workflow can be changed before BackToUser,
                wkf.controller.Rebuild();
            }
        }
    }
    function InitOnClickButton() {
        function OnConfirmDelete() {
            ProcessInstance.ApproveAsynchronous("DeleteReport");
        }
        function CheckExpenseReport() {
            // Check that the Expense Report Type is set
            const ok = !Sys.Helpers.IsEmpty(Controls.ExpenseReportTypeName__.GetValue());
            if (!ok) {
                Controls.ExpenseReportTypeName__.SetError("This field is required!");
                return false;
            }
            // Check that the currency is set
            if (Sys.Helpers.IsEmpty(Controls.CC_Currency__.GetValue())) {
                Controls.TotalAmount__.SetError("_No currency has been defined for this CompanyCode.");
                return false;
            }
            return true;
        }
        Controls.BackToUser.OnClick = function () {
            DialogComment("BackToUser");
        };
        Controls.ModifyReport.OnClick = function () {
            let dialogTexts = {
                titleRequired: "_Modify expense report title",
                descriptionRequired: "_Modify expense report warning message"
            };
            DialogComment("ModifyReport", dialogTexts);
            return false;
        };
        Controls.DeleteReport.OnClick = function () {
            Popup.Confirm("_Delete_ExpenseReport_explanation", false, OnConfirmDelete, null, "_Delete expense report confirmation");
            return false;
        };
        Controls.Retry.OnClick = function () {
            let lastActionName = Variable.GetValueAsString("LastActionName");
            if (lastActionName) {
                if (lastActionName === "SubmitExpenses") {
                    ProcessInstance.SetUrlParametersForPreventApproval("backmsnex=");
                }
                ProcessInstance.Approve(lastActionName);
            }
            else {
                Popup.Alert("_No action to retry");
            }
        };
        Controls.SubmitExpenses.OnClick = function () {
            var _a, _b;
            const submit = function (dialog) {
                if (dialog) {
                    Controls.Comments__.SetValue(dialog.GetControl("ctrlComments").GetValue());
                }
                if (Object.keys(Lib.Expense.Report.Workflow.additionalContributorsCache).length === 0 && !Variable.GetValueAsString("AdditionalContributors")) {
                    ProcessInstance.SetUrlParametersForPreventApproval("backmsnex=");
                    ProcessInstance.Approve("SubmitExpenses");
                }
                else {
                    Variable.SetValueAsString("AdditionalContributors", JSON.stringify(Lib.Expense.Report.Workflow.additionalContributorsCache));
                    if (Data.GetValue("ExpenseReportStatus__") == "To control") {
                        ProcessInstance.Approve("Approve_RequestFurtherApproval");
                    }
                    else {
                        ProcessInstance.Approve("Approve_Forward");
                    }
                }
            };
            if (Process.ShowFirstError() === null && ((_b = (_a = Controls.ExpenseReportTypeName__).IsRequired) === null || _b === void 0 ? void 0 : _b.call(_a)) && CheckExpenseReport()) {
                if (GetExpensesDeleted().length) {
                    const dialogTexts = {
                        titleConfirmation: "_Expense removed comments confirmation",
                        titleRequired: "_Expense removed comments required",
                        descriptionConfirmation: "_Expense removed confirm your comment",
                        descriptionRequired: "_Expense removed write your comment"
                    };
                    DialogComment("Submit", dialogTexts, submit);
                }
                else {
                    submit(null);
                }
            }
        };
        Controls.Close.OnClick = function () {
            if (gSaveOnQuit) {
                ProcessInstance.SaveAndQuit("Save");
                return false;
            }
            return null;
        };
    }
    function InitButtonBar() {
        InitOnClickButton();
        Controls.Close.Hide(false);
        Controls.Retry.Hide(true);
    }
    function InitConditionalLayout() {
        if (ProcessInstance.isDesignActive) {
            let expenseReportTemplateInfos = Lib.Expense.Report.Export.GetExpenseReportTemplateInfos();
            if (expenseReportTemplateInfos.fileFormat === "RPT") {
                Controls.DownloadCrystalReportsDataFile.Hide(false);
            }
        }
    }
    async function InitLayout() {
        const promises = [];
        Log.Info("InitLayout");
        layout.panes.forEach((pane) => {
            pane.Hide(false);
        });
        layout.HideWaitScreen(true);
        InitPreviewPanel();
        InitInformationPanel();
        promises.push(InitInvoiceReference());
        InitExpensesTable();
        InitBanner();
        InitWarningBanner();
        InitAddExpenseButton();
        InitButtonBar();
        InitConditionalLayout();
        Lib.Expense.Report.Workflow.InitPanel();
        var func = Sys.Helpers.TryGetFunction("Lib.Expense.Report.Customization.Client.CustomizeLayout");
        if (func) {
            func();
        }
        else {
            Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Client.CustomiseLayout");
        }
        Lib.P2P.DisplayArchiveDurationWarning("Expense", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(CustomScript.topMessageWarning), "ExpenseArchiveDurationInMonths");
        Lib.P2P.DisplayBackupUserWarning("Expense", (displayName) => {
            CustomScript.topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName), 0);
        }, () => {
            if ((Data.GetValue("State") == 70 || Data.GetValue("State") == 90) && User.IsBackupUserOf(Data.GetValue("OwnerId"))) {
                return Data.GetValue("OwnerID");
            }
        });
        let nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
        if (!nextAlert || nextAlert.behaviorName !== "onUnexpectedError") {
            /* Init depending expense report status
             * /!\ BECAREFUL IF THE STATUS NAME CHANGES THE FUNCTION POINTER WILL NOT WORK ANYMORE /!\
             */
            Init(Controls.ExpenseReportStatus__.GetValue(), Lib.Expense.Report.Workflow.IsReadOnly());
            Lib.Expense.ControlsWatcher.CheckAll();
        }
        await Promise.all(promises);
    }
    CustomScript.InitLayout = InitLayout;
    async function InitWarningBanner() {
        let onBehalfWarning = false;
        await Lib.P2P.DisplayOnBehalfWarning(User.loginId, (nameToDisplay, isCreatedBy) => {
            onBehalfWarning = true;
            if (isCreatedBy) {
                CustomScript.topMessageWarning.Add(Language.Translate("_ExpenseReportCreatedBy", true, nameToDisplay), 0);
            }
            else {
                CustomScript.topMessageWarning.Add(Language.Translate("_ExpenseReportCreatedFor", true, nameToDisplay), 0);
            }
        });
        if (!(onBehalfWarning && Controls.ExpenseReportStatus__.GetValue() === "Draft")) {
            await Lib.P2P.DisplayAdminWarning("PAC", function (displayName) {
                CustomScript.topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
            });
        }
    }
    CustomScript.InitWarningBanner = InitWarningBanner;
    function FillDialogCallback(dialogTexts) {
        return function (dialog /*, tabId, event, control*/) {
            let ctrl = dialog.AddDescription("ctrlDesc", null, 466);
            let commentValue = Controls.Comments__.GetValue();
            if (Sys.Helpers.IsEmpty(commentValue)) {
                ctrl.SetText(Language.Translate(dialogTexts.descriptionRequired));
            }
            else {
                ctrl.SetText(Language.Translate(dialogTexts.descriptionConfirmation));
            }
            let commentCtrl = dialog.AddMultilineText("ctrlComments", "_Comment - Comment Dialog", 400);
            dialog.RequireControl(commentCtrl);
            commentCtrl.SetValue(commentValue);
        };
    }
    function CommitDialogCallback(action) {
        return function (dialog) {
            Controls.Comments__.SetValue(dialog.GetControl("ctrlComments").GetValue());
            if (action === "ModifyReport") {
                ProcessInstance.Approve(action);
            }
            else {
                ProcessInstance.ApproveAsynchronous(action);
            }
        };
    }
    function DialogComment(action, dialogTexts, onCommitted) {
        let defaultDialogTexts = {
            titleConfirmation: "_Approval comments confirmation",
            titleRequired: "_Approval comments required",
            descriptionConfirmation: "_Please confirm your comment",
            descriptionRequired: "_Please write your comment"
        }, att;
        if (!dialogTexts) {
            dialogTexts = defaultDialogTexts;
        }
        else {
            for (att in defaultDialogTexts) {
                if (!(att in dialogTexts)) {
                    dialogTexts[att] = defaultDialogTexts[att];
                }
            }
        }
        let title = Controls.Comments__.GetValue() ? dialogTexts.titleConfirmation : dialogTexts.titleRequired;
        Popup.Dialog(title, null, FillDialogCallback(dialogTexts), onCommitted ? onCommitted : CommitDialogCallback(action), null);
        return false;
    }
    function FilledTechnicalDataWithExpenseDuplicate(result) {
        let allExpenseMSNex = result.map(expense => expense.GetValue("ExpenseMSNEX__"));
        Sys.Helpers.SilentChange(() => Sys.TechnicalData.SetValue("expenseAlreadyViewAsDuplicate", allExpenseMSNex));
    }
    function FillTechnicalDataWithExpenseDeleted(item) {
        let expensesDeleted = GetExpensesDeleted();
        expensesDeleted.push({
            ExpenseNumber: item.GetValue("ExpenseNumber__"),
            MSNEX: item.GetValue("ExpenseMSNEX__")
        });
        Sys.Helpers.SilentChange(() => Sys.TechnicalData.SetValue("expensesDeleted", expensesDeleted));
    }
    function RemoveExpenseDeletedFromTechnicalData(item) {
        let expensesDeleted = GetExpensesDeleted();
        const index = Sys.Helpers.Array.FindIndex(expensesDeleted, (exp) => exp.ExpenseNumber === item.GetValue("ExpenseNumber__"));
        if (index > -1) {
            expensesDeleted.splice(index, 1);
        }
        Sys.Helpers.SilentChange(() => Sys.TechnicalData.SetValue("expensesDeleted", expensesDeleted));
    }
    function GetExpensesDeleted() {
        return Sys.TechnicalData.GetValue("expensesDeleted") || [];
    }
    CustomScript.GetExpensesDeleted = GetExpensesDeleted;
    function GetExpensesDeletedMSNEX() {
        const expensesDeleted = GetExpensesDeleted();
        let expensesDeletedMSNEX = [];
        expensesDeleted.forEach(elem => {
            expensesDeletedMSNEX.push(elem.MSNEX);
        });
        return expensesDeletedMSNEX;
    }
    CustomScript.GetExpensesDeletedMSNEX = GetExpensesDeletedMSNEX;
    async function Start() {
        const promises = [];
        InitWorkflow();
        promises.push(InitLayout());
        if (!Process.GetURLParameter("backmsnex")) {
            Lib.CommonDialog.NextAlert.Show({
                // special behavior for Unexpected error
                "onUnexpectedError": {
                    IsShowable: function () {
                        Controls.Retry.Hide(false);
                        return true;
                    }
                },
                "MissingExpensesError": {
                    Popup: function (nextAlert) {
                        Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                            switch (action) {
                                case "Yes":
                                    ProcessInstance.Approve("PostValidation_Post");
                                    break;
                                case "Cancel":
                                    Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit();
                                    break;
                                default:
                                    break;
                            }
                        }, nextAlert, "_Retry now", "_Retry later");
                    }
                }
            });
        }
        if (!ProcessInstance.state) {
            ProcessInstance.DisableExtractionScript();
        }
        await Promise.all(promises);
    }
    /** BEFORE STARTING **/
    async function LoadUserProperties() {
        if (Sys.Helpers.IsEmpty(Data.GetValue("User__"))) {
            //FOR UPGDRADE : OwnerName__ can be null on Expenses, and therefor be empty here
            Data.SetValue("User__", User.loginId);
            Data.SetValue("UserName__", User.fullName);
            if (IsCreator()) {
                Sys.TechnicalData.SetValue("creatorMSN", User.id);
            }
        }
        const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(Data.GetValue("User__"));
        const companyCode = Data.GetValue("CompanyCode__");
        const ccCurrency = Data.GetValue("CC_Currency__");
        if (!ProcessInstance.state || ((Sys.Helpers.IsEmpty(companyCode) || Sys.Helpers.IsEmpty(ccCurrency)) && Data.GetValue("ExpenseReportStatus__") === "Draft") && !Lib.CommonDialog.NextAlert.GetNextAlert()) {
            Data.SetValue("UserNumber__", UserPropertiesValues.UserNumber__);
            Data.SetValue("CompanyCode__", companyCode || UserPropertiesValues.CompanyCode__);
        }
    }
    async function InitializeDelegationCache() {
        const UserPropertiesValues = await Lib.Expense.LoadCurrentUserProperties();
        Lib.Expense.InitializeCurrentUserProperties(UserPropertiesValues);
    }
    CustomScript.InitializeDelegationCache = InitializeDelegationCache;
    async function RefreshExpensesTable() {
        var _a;
        try {
            Lib.Expense.Report.DuplicateCheck.ResetDuplicateIndicators();
            if (IsExpensesTableRefreshNeeded()) {
                let MsnEx = Process.GetURLParameter("backmsnex");
                let table = Data.GetTable("ExpensesTable__");
                let nItems = table.GetItemCount();
                //If we already have some expenses (e.g. draft opening), we don't want to append the childs to the table since it will duplicate them
                if (nItems > 0 || ((_a = Sys.Helpers.Globals.ProcessInstance.selectedRuidFromView) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                    await Lib.Expense.Report.FillExpensesTable(undefined, true);
                    const duplicate = await Lib.Expense.Report.DuplicateCheck.CheckDuplicate();
                    Lib.Expense.Report.DuplicateCheck.DisplayDuplicateIndicators(duplicate);
                    await Lib.Expense.Report.DuplicateCheck.UpdateDuplicateWarning(CustomScript.topMessageWarning, duplicate.length > 0 || undefined);
                    HighlightUpdatedLines(MsnEx);
                }
            }
            else if (Data.GetValue("ExpenseReportStatus__") === "To approve" || Data.GetValue("ExpenseReportStatus__") === "To control") {
                const duplicate = await Lib.Expense.Report.DuplicateCheck.CheckAllDuplicate();
                Lib.Expense.Report.DuplicateCheck.DisplayDuplicateIndicators(duplicate);
                await Lib.Expense.Report.DuplicateCheck.UpdateDuplicateWarning(CustomScript.topMessageWarning, duplicate.length > 0);
                FilledTechnicalDataWithExpenseDuplicate(duplicate);
            }
        }
        catch (error) {
            Log.Error("Error during loading duplicate");
        }
    }
    CustomScript.RefreshExpensesTable = RefreshExpensesTable;
    async function LoadExpenseReportTypeTable() {
        if (Controls.ExpenseReportStatus__.GetValue() === "Draft") {
            const records = await Lib.Expense.Report.QueryExpenseReportType(Data.GetValue("CompanyCode__"));
            // When the expense report type is not found and submitted from mobile fill expenses table
            let expenseReportTypeExist = Controls.ExpenseReportTypeName__.GetValue() === (records[0] && records[0].ExpenseReportTypeName__);
            if (!expenseReportTypeExist && Variable.GetValueAsString("SubmittedFromMobileApp")) {
                let MsnEx = Process.GetURLParameter("backmsnex");
                await Lib.Expense.Report.FillExpensesTable(JSON.parse(Variable.GetValueAsString("SelectedExpenseIDs")));
                HighlightUpdatedLines(MsnEx);
                Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(false);
            }
            else if (records.length === 1) {
                Controls.ExpenseReportTypeName__.SetValue(records[0].ExpenseReportTypeName__);
                Controls.ExpenseReportTypeID__.SetValue(records[0].ID__);
            }
            else if (records.length > 1) {
                // > 1 in case no ERT is defined
                let defaultID = Controls.ExpenseReportTypeID__.GetValue();
                let defaultType = Sys.Helpers.Array.Find(records, (type) => {
                    return type.ID__ == defaultID;
                });
                if (defaultType !== undefined) {
                    Controls.ExpenseReportTypeName__.SetValue(defaultType.ExpenseReportTypeName__);
                }
                else {
                    // No need to clear the ExpenseReportTypeID__, since ExpenseReportTypeName__ required
                    Log.Warn("The default Expense Report type specified by the admin doesn't exist OR none is specified.");
                }
            }
        }
    }
    if (Controls.InternalConversation__) {
        Controls.InternalConversation__.OnOpened = async function () {
            var _a;
            Log.Info("[Internal Conversation] On Opened");
            // Get creator User msn
            let userMSN = Sys.TechnicalData.GetValue("creatorMSN");
            if (!userMSN) {
                const creatorLogin = Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("CreatorOwnerID"));
                const users = await Sys.OnDemand.Users.GetUsersFromLogins([creatorLogin], ["msn"], null);
                userMSN = (_a = users[0]) === null || _a === void 0 ? void 0 : _a.msn;
            }
            if (userMSN) {
                const participants = await Controls.InternalConversation__.GetParticipants();
                if (!Sys.Helpers.Array.Find(participants, (participant) => participant.msn == userMSN)) {
                    try {
                        await Controls.InternalConversation__.AddParticipant({ msn: userMSN }, {
                            noEmailNotification: true,
                            noPlatformNotification: true
                        });
                        Log.Info("[Internal Conversation] Add Creator to conversation has succeed");
                    }
                    catch (e) {
                        Log.Error("[Internal Conversation] Add Creator to conversation has failed");
                    }
                }
            }
            else {
                Log.Error("[Internal Conversation] Creator can't be added without his user msn.");
            }
        };
    }
    if (IsExpensesTableRefreshNeeded()) {
        Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(false);
    }
    async function asyncStartFunction() {
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        await Sys.Helpers.TryCallFunction("Lib.Expense.Report.Customization.Client.OnLoad");
        InitLayoutBeforeStarting();
        await RefreshExpensesTable();
        await LoadUserProperties();
        await InitializeDelegationCache();
        await Lib.Expense.Report.LoadCompanyCodesValue();
        if (Sys.Helpers.IsEmpty(Data.GetValue("CC_Currency__"))) {
            Lib.Expense.Report.SubmitButtonDisabler.SetDisabled(true);
        }
        await LoadExpenseReportTypeTable();
        await Start();
        // END - ignore all changes on form during the initialization processing
        ProcessInstance.SetSilentChange(false);
    }
    function Run() {
        const pStrart = asyncStartFunction();
        Sys.Helpers.Synchronizer.OnProgressFromPromise(pStrart, { progressDelay: 15000 });
    }
    CustomScript.Run = Run;
    //Add _ENV_TEST_ENABLED for unit tests
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Run();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map