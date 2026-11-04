"use strict";
var extractionscript;
(function (extractionscript) {
    let currentName = Data.GetActionName();
    let currentAction = Data.GetActionType();
    Log.Info("-- BM Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
    if (currentAction !== "reprocess") {
        const user = Users.GetUser(Data.GetValue("OwnerId"));
        Data.SetValue("User__", user.GetValue("Login"));
        Data.SetValue("UserName__", user.GetValue("DisplayName"));
        Data.SetValue("Reason__", Language.Translate("_Import budget data from SFTP inbound channel"));
        Data.SetValue("Operation__", "Import");
        Variable.SetValueAsString("currentStep", "6"); // !!! 6 = result step, see customscript.ts
    }
    Sys.Helpers.TryCallFunction("Lib.Budget.Management.Customization.Server.OnExtractionScriptEnd", currentAction, currentName);
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map