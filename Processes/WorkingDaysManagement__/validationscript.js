"use strict";
var Validation;
(function (Validation) {
    var currentName = Data.GetActionName();
    var currentAction = Data.GetActionType();
    Log.Info("-- Working Days Management Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
    function Save() {
        Log.Info("Save working days: " + Data.GetValue("ConfigName__"));
        const workingDaysMsn = Variable.GetValueAsString("WorkingDaysMsn");
        const filter = workingDaysMsn ? Sys.Helpers.LdapUtil.FilterEqual("MSN", workingDaysMsn) : Sys.Helpers.LdapUtil.FilterEqual("ConfigName__", Data.GetValue("ConfigName__"));
        let record = Sys.Helpers.Database.CD2CT("WorkingDays__", filter.toString());
        if (record.GetLastError() !== 0) {
            Log.Error("Error saving Working days table: " + record.GetLastErrorMessage());
            // TODO: NextAlert
        }
    }
    if (currentAction === "approve_asynchronous" || currentAction === "approve") {
        switch (currentName) {
            case "Save":
                Save();
                break;
            default:
                break;
        }
    }
})(Validation || (Validation = {}));
//# sourceMappingURL=validationscript.js.map