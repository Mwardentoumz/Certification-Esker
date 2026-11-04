"use strict";
/* eslint-disable max-depth */
var ValidationScript;
(function (ValidationScript) {
    async function Run() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        const requestedAction = Data.GetValue("Action__");
        Log.Info(`-- Record Manager Validation Script -- Name: '${currentName || "<empty>"}', Action: '${currentAction || "<empty>"}', RequestedAction: '${requestedAction || "<empty>"}'`);
        // Prevent multiple validation : Come from 'SendCD' Action if state = 50;
        if (Data.GetValue("State") == 50 && (currentName === "" && currentAction === ""
            || currentName === "Approve" && currentAction === "approve")) {
            await Lib.P2P.RecordManager.Server.HandleAction(requestedAction);
        }
    }
    ValidationScript.Run = Run;
    Lib.P2P.HandleScriptError(Run());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map