"use strict";
/* Employee Transactions HTML page script */
const topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
let createdOnBehalf;
Log.Time("CustomScript");
function InitLayout() {
    Log.Info("[CustomScript.InitLayout]");
    RegisterHandlers();
    InitBanner();
    return InitCreatedOnBehalf().Then(() => {
        InitItemsTable();
        Sys.Helpers.TryCallFunction("Lib.Expense.EmployeeTransactions.Customization.Client.CustomizeLayout");
        InitOnBehalfWarning();
        const promiseInitArchiveDurationWarning = InitArchiveDurationWarning();
        Controls.TransactionItems__.RefreshRows();
        return promiseInitArchiveDurationWarning;
    });
}
function InitBanner() {
    Log.Info("[CustomScript.InitBanner]");
    var banner = Sys.Helpers.Banner;
    banner.SetHTMLBanner(Controls.HTMLBanner__);
    banner.SetMainTitle("_Employee transactions title");
    banner.SetStatusCombo(Controls.Status__);
    banner.SetSubTitle();
}
function InitArchiveDurationWarning() {
    return Lib.P2P.DisplayArchiveDurationWarning("Expense", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning), "ExpenseArchiveDurationInMonths");
}
function GetCreatedOnBehalfFilterForExpenseNumber() {
    return Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("OriginalOwnerId", `cn=${Data.GetValue("OriginalOwnerId")}*`), Sys.Helpers.LdapUtil.FilterEqual("OriginalOwnerId", ""), Sys.Helpers.LdapUtil.FilterNotEqual("OriginalOwnerId", "*")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("OwnerID", User.dn), Sys.Helpers.LdapUtil.FilterEqual("CreatorOwnerId", User.dn)), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("ParentMsnEx__", ""), Sys.Helpers.LdapUtil.FilterNotEqual("ParentMsnEx__", "*")));
}
function InitOnBehalfWarning() {
    const ownerLogin = Data.GetValue("OwnerId");
    if (ownerLogin && User.loginId !== ownerLogin) {
        return Sys.OnDemand.Users.CacheByLogin.Get(ownerLogin, Lib.P2P.attributesForUserCache)
            .Then((result) => {
            const user = result[ownerLogin];
            if (!user.$error) {
                if (createdOnBehalf) {
                    if (ProcessInstance.isReadOnly) {
                        topMessageWarning.Add(Language.Translate("_View on bealf of {0} readonly", false, user.displayname), 0);
                    }
                    else {
                        topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, user.displayname), 0);
                    }
                    Controls.TransactionItems__.ExpenseNumber__.SetFilter(GetCreatedOnBehalfFilterForExpenseNumber().toString());
                }
                else {
                    if (ProcessInstance.isReadOnly) {
                        topMessageWarning.Add(Language.Translate("_View as supervisor for {0} readonly", false, user.displayname), 0);
                    }
                    else {
                        topMessageWarning.Add(Language.Translate("_View as supervisor for {0}", false, user.displayname), 0);
                    }
                }
            }
        });
    }
    Lib.CommonDialog.NextAlert.Show({});
    return Sys.Helpers.Promise.Resolve();
}
function InitCreatedOnBehalf() {
    // ExpenseNumber__ and ExpenseCreationMode__ musn't be displayed before the result of the query
    Controls.TransactionItems__.ExpenseNumber__.Hide(true);
    Controls.TransactionItems__.ExpenseCreationMode__.Hide(true);
    return Lib.P2P.UserProperties.QueryValues(Sys.Helpers.String.ExtractLoginFromDN(User.loginId))
        .Then((result) => {
        createdOnBehalf = !!result.AllowedOnBehalfUsers__.find((i) => i === Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OriginalOwnerId")));
        Controls.TransactionItems__.ExpenseNumber__.Hide(false);
        Controls.TransactionItems__.ExpenseCreationMode__.Hide(false);
    });
}
function InitItemsTable() {
    Log.Info("[CustomScript.InitExpenseNumberDisplay]");
    if (!ProcessInstance.isReadOnly) {
        ProcessInstance.SetSilentChange(true);
        Controls.TransactionItems__.ExpenseNumber__.SetAllowTableValuesOnly(true);
        ProcessInstance.SetSilentChange(false);
    }
    Controls.TransactionItems__.ExpenseNumber__.Hide(ProcessInstance.isReadOnly == false);
    Controls.TransactionItems__.SetWidth("100%");
    Controls.TransactionItems__.SetExtendableColumn("TransactionDescription__");
    if (!createdOnBehalf && Lib.P2P.IsAdminNotOwner() && Data.GetValue("Status__") === "ToValidate") {
        Controls.TransactionItems__.ExpenseNumber__.Hide(true);
        Controls.TransactionItems__.ExpenseCreationMode__.Hide(true);
    }
}
function OpenExpense(expenseNumber) {
    Controls.TransactionItems__.ExpenseNumber__.Wait(true);
    let attributes = ["MsnEx", "ValidationURL"];
    let filter = "ExpenseNumber__=" + expenseNumber;
    Sys.GenericAPI.Query("CDNAME#Expense", filter, attributes, (results, error) => {
        Controls.TransactionItems__.ExpenseNumber__.Wait(false);
        if (!error && results && results.length > 0) {
            let result = results[0];
            Process.OpenLink({ url: result.ValidationURL + "&OnQuit=Close" });
        }
        else {
            Log.Error("[CustomScript.InitExpenseLinks] Error retrieving expense");
            Popup.Alert("_Expense not found or access denied", false, null, "_Expense not found title");
        }
    });
}
function CheckAlreadyExistingExpensesAreCorrectlyComplete() {
    Sys.Helpers.Data.ForEachTableItem("TransactionItems__", (line, index) => {
        if (line.GetValue("ExpenseCreationMode__") === Lib.Expense.Transaction.ExpenseCreationMode.Existing) {
            if (Sys.Helpers.IsEmpty(line.GetValue("ExpenseNumber__"))) {
                //"Field value does not belong to table!" is the key from the flexibleform => Allow value table only parameter on combobox
                line.SetError("ExpenseNumber__", "Field value does not belong to table!");
            }
        }
    });
}
function IsAnyInconsistencyWarning() {
    return !!Sys.Helpers.Data.FindTableItem("TransactionItems__", (transaction) => transaction.GetValue("ExpenseCreationMode__") === Lib.Expense.Transaction.ExpenseCreationMode.Existing &&
        !!transaction.GetWarning("ExpenseNumber__"));
}
function RegisterHandlers() {
    Log.Info("[CustomScript.RegisterHandlers]");
    Controls.TransactionItems__.ExpenseNumber__.OnChange = function () {
        const item = this.GetItem();
        if (Sys.Helpers.IsEmpty(item.GetValue("ExpenseNumber__"))) {
            item.SetValue("ExpenseCreationMode__", Lib.Expense.Transaction.ExpenseCreationMode.New);
            Controls.TransactionItems__.RefreshRows(item);
        }
    };
    Controls.TransactionItems__.ExpenseNumber__.OnClick = function () {
        const row = this.GetRow();
        if (Sys.Helpers.IsEmpty(this.GetValue()) || !row.ExpenseCreated__.GetValue()) {
            return;
        }
        OpenExpense(this.GetValue());
    };
    Controls.TransactionItems__.ExpenseCreationMode__.OnChange = function () {
        let item = this.GetItem();
        const expenseColumnWasVisible = Controls.TransactionItems__.ExpenseNumber__.IsVisible();
        if (!expenseColumnWasVisible && item.GetValue("ExpenseCreationMode__") === Lib.Expense.Transaction.ExpenseCreationMode.Existing) {
            Controls.TransactionItems__.ExpenseNumber__.Hide(false);
        }
        else if (item.GetValue("ExpenseCreationMode__") !== Lib.Expense.Transaction.ExpenseCreationMode.Existing) {
            // reset
            item.SetValue("ExpenseNumber__", "");
            item.SetError("ExpenseNumber__");
        }
        Controls.TransactionItems__.RefreshRows(item);
    };
    Controls.TransactionItems__.ExpenseNumber__.OnSelectItem = function (expenseItem) {
        let transactionItem = this.GetItem(); //item is the transaction associated to the selected expense
        Lib.Expense.Transaction.ShowConsistencyWarnings(transactionItem, {
            ExpenseNumber__: expenseItem.GetValue("ExpenseNumber__"),
            Template__: expenseItem.GetValue("Template__"),
            TotalAmount__: expenseItem.GetValue("TotalAmount__"),
            TotalAmountCurrency__: expenseItem.GetValue("TotalAmountCurrency__"),
            Date__: expenseItem.GetValue("Date__")
        });
    };
    let templateTranslations = null;
    function GetTemplateTranslations() {
        if (templateTranslations == null) {
            templateTranslations = Sys.Helpers.Array.Reduce(Controls.TransactionItems__.Template__.GetAvailableValues(), (previousValue, currentValue) => {
                const splitted = currentValue.split("=");
                previousValue[splitted[0]] = splitted[1];
                return previousValue;
            }, {});
        }
        return templateTranslations;
    }
    Controls.TransactionItems__.ExpenseNumber__.OnColumnFormating = (attributeName, value) => {
        if (attributeName == "Template__") {
            if (value == "") {
                return "_Standard";
            }
            return GetTemplateTranslations()[value] || "_Standard";
        }
        return value;
    };
    Controls.TransactionItems__.OnRefreshRow = (index) => {
        var row = Controls.TransactionItems__.GetRow(index);
        let expenseNumberIsEditable = row.ExpenseCreationMode__.GetValue() === Lib.Expense.Transaction.ExpenseCreationMode.Existing && !row.ExpenseCreated__.GetValue();
        row.ExpenseNumber__.Hide(row.ExpenseCreationMode__.GetValue() === Lib.Expense.Transaction.ExpenseCreationMode.Personal ||
            (row.ExpenseCreationMode__.GetValue() === Lib.Expense.Transaction.ExpenseCreationMode.New &&
                row.ExpenseNumber__.GetValue() == ""));
        row.ExpenseNumber__.SetReadOnly(!expenseNumberIsEditable);
        row.ExpenseCreationMode__.SetReadOnly(row.ExpenseCreated__.GetValue());
        // Display ExpenseNumber__ as link
        if (row.ExpenseCreated__.GetValue()) {
            row.ExpenseNumber__.DisplayAs({ type: "Link" });
        }
        // show the ExpenseNumber__ colum if needed
        const expenseColumnWasVisible = Controls.TransactionItems__.ExpenseNumber__.IsVisible();
        let shouldShowExpenseNumbers = row.ExpenseCreationMode__.GetValue() === Lib.Expense.Transaction.ExpenseCreationMode.Existing || row.ExpenseCreated__.GetValue();
        if (expenseColumnWasVisible == false && shouldShowExpenseNumbers) {
            Controls.TransactionItems__.ExpenseNumber__.Hide(false);
        }
    };
    Controls.Approve.OnClick = function () {
        CheckAlreadyExistingExpensesAreCorrectlyComplete();
        if (Process.ShowFirstError() === null) {
            if (IsAnyInconsistencyWarning()) {
                Popup.Confirm("_WarningInconsistencyWithExpensesMessage", false, () => {
                    ProcessInstance.Approve(Controls.Approve.GetAction());
                }, null, "_WarningInconsistencyWithExpensesTitle", {
                    autoApproveId: "AutoApprove_P2P_EmployeeTransactions_WarningInconsistency_" + Lib.Purchasing.HashLoginID(User.loginId)
                });
            }
            else {
                ProcessInstance.Approve(Controls.Approve.GetAction());
            }
        }
        return false;
    };
}
////////////////////////////////////////////////////
// START
////////////////////////////////////////////////////
InitLayout()
    .Finally(() => Log.TimeEnd("CustomScript"));
//# sourceMappingURL=customscript.js.map