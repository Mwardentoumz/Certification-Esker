"use strict";
var ValidationScript;
(function (ValidationScript) {
    const currentActionName = Data.GetActionName();
    const currentActionType = Data.GetActionType();
    function Run() {
        Log.Info(`-- CustomerContract Validation Script -- Name: '${currentActionName ? currentActionName : "<empty>"}', Action: '${currentActionType ? currentActionType : "<empty>"}'`);
        Lib.CommonDialog.NextAlert.Reset();
        switch (currentActionName) {
            case "Synchronize":
                Lib.CustomerContract.Publication.SynchronizeWithP2PContract();
                break;
            case "UploadContract":
            case "Document":
                Lib.CustomerContract.Publication.ReviseP2PContractDocument();
                break;
            case "Submit__":
                Lib.CustomerContract.Publication.PublishP2PContract();
                break;
            default:
                {
                    Log.Info(`Unhandled action: '${currentActionName}'`);
                    Process.PreventApproval();
                }
        }
        return;
    }
    ValidationScript.Run = Run;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Lib.P2P.HandleScriptError(Run());
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map