"use strict";
var validationscript;
(function (validationscript) {
    async function Run() {
        const currentAction = Data.GetActionType();
        const currentName = Data.GetActionName();
        Log.Info("-- Employee Transactions Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
        Lib.P2P.SetTablesToIndex(["TransactionItems__"]);
        Lib.Expense.InitTechnicalFields();
        Lib.Expense.SetRightForExpenseViewer();
        Lib.Expense.SetRightForDelegateUsers("AllowedOnBehalfUsers__", "write");
        // disable server side checks
        Sys.Helpers.Data.SetAllowTableValuesOnlyForColumns("TransactionItems__", ["ExpenseNumber__"], false);
        if (currentAction || currentName) {
            Lib.CommonDialog.NextAlert.Reset();
        }
        if (currentAction === "approve") {
            const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("ValidationOwnerID")));
            const createOnBehalf = !!UserPropertiesValues.AllowedOnBehalfUsers__.find((user) => user === Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OwnerID")));
            let bok = Lib.Expense.Transaction.Validation.CreateAllExpenses(createOnBehalf);
            bok = bok && Lib.Expense.Transaction.Validation.LinkAllExpenses();
            const customizeExpenseProcessing = Sys.Helpers.TryGetFunction("Lib.Expense.Transaction.Customization.Server.CustomizeExpenseProcessing");
            if (customizeExpenseProcessing) {
                bok = bok && customizeExpenseProcessing(createOnBehalf);
            }
            if (bok) {
                Data.SetValue("Status__", "Validated");
            }
            else {
                Lib.Expense.OnUnexpectedError("An unexpected error occurs when create or link expenses, see error log before");
            }
        }
    }
    validationscript.Run = Run;
    Run();
})(validationscript || (validationscript = {}));
//# sourceMappingURL=validationscript.js.map