"use strict";
var validationscript;
(function (validationscript) {
    function checkMandatoryFieldsForFillingForm() {
        if (!Lib.Expense.Transaction.Server.CheckMandatoryFieldsForFillingForm()) {
            if (!Lib.CommonDialog.NextAlert.GetNextAlert()) {
                Lib.CommonDialog.NextAlert.Define("_All employee name are not completed title", "_All employee name are not completed description", { isError: false });
            }
            return false;
        }
        return true;
    }
    function approve() {
        if (!checkMandatoryFieldsForFillingForm()) {
            Process.PreventApproval();
            return false;
        }
        else if (!Lib.Expense.Transaction.Validation.CreateAllEmployeeTransactionCD()) {
            Process.PreventApproval();
            Lib.CommonDialog.NextAlert.Define("_All employee transaction have not been created title", "_All employee transaction have not been created description", { isError: true });
            return false;
        }
        return true;
    }
    validationscript.approve = approve;
    function Run() {
        //Dont do anything more on this record if IgnoreValidationScriptAndPutInError is set
        if (Variable.GetValueAsString("IgnoreValidationScriptAndPutInError")) {
            Log.Info("Ignoring validationScript and put as failure");
            Data.SetValue("State", 200);
            return;
        }
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- Transaction Parser Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
        // Is resubmit or autocomplete
        if (currentAction === "reprocess" || currentAction === "autocomplete") {
            Lib.CommonDialog.NextAlert.Reset();
            checkMandatoryFieldsForFillingForm();
        }
        // Is coming from extraction script
        else if (!currentName && !currentAction) {
            if (approve()) {
                Data.SetValue("State", 100);
            }
            else {
                //Send email to owner
                const currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                Lib.Expense.Transaction.Validation.SendNotificationToReviewer(currentUser.GetValue("Login"));
            }
        }
        // Is manual approbation
        else {
            Lib.CommonDialog.NextAlert.Reset();
            switch (currentName) {
                case "Save":
                    Process.PreventApproval();
                    break;
                default:
                    approve();
                    break;
            }
        }
        // must be done after configuration has been loaded
        Lib.Expense.InitTechnicalFields();
        if (Variable.GetValueAsString("Configuration")) {
            Lib.Expense.SetRightForExpenseViewer();
        }
        else {
            Log.Info("Configuration is not set on this transaction.");
        }
    }
    validationscript.Run = Run;
    Run();
})(validationscript || (validationscript = {}));
//# sourceMappingURL=validationscript.js.map