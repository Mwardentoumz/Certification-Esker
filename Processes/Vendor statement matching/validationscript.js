"use strict";
/* Vendor statement matching validation server script */
const StatementStatus = {
    draft: "Draft",
    toVerify: "To verify",
    archived: "Archived",
    rejected: "Rejected"
};
var ActionHelpers;
(function (ActionHelpers) {
    function requiredFieldAreSettled() {
        return !Data.IsNullOrEmpty("CompanyCode__") && !Data.IsNullOrEmpty("StatementDate__") && !Data.IsNullOrEmpty("VendorNumber__");
    }
    /**
     * @returns a string describing the current action based on ActionName and ActionType
     */
    function GetCurrentAction() {
        const currentName = Data.GetActionName();
        const currentType = Data.GetActionType();
        if (currentName === "save" && currentType === "reprocess") {
            return "reprocess";
        }
        else if (currentName) {
            return currentName.toLowerCase();
        }
        return currentType;
    }
    ActionHelpers.GetCurrentAction = GetCurrentAction;
    function Archive() {
        if (requiredFieldAreSettled()) {
            Lib.AP.NotifySDA();
            Data.SetValue("StatementStatus__", StatementStatus.archived);
        }
    }
    ActionHelpers.Archive = Archive;
    function Reject() {
        Lib.AP.NotifySDA();
        Data.SetValue("State", 400);
        Data.SetValue("StatementStatus__", StatementStatus.rejected);
    }
    ActionHelpers.Reject = Reject;
    function RunStatementMatching() {
        if (requiredFieldAreSettled()) {
            Lib.AP.StatementMatching.Run()
                .Then((result) => {
                if (result.status === Lib.AP.StatementMatching.Returns.ok) {
                    Data.SetValue("StatementStatus__", StatementStatus.toVerify);
                    Lib.AP.StatementMatching.UpdateStatementMatchingStatus();
                }
            });
        }
        Process.PreventApproval();
    }
    ActionHelpers.RunStatementMatching = RunStatementMatching;
})(ActionHelpers || (ActionHelpers = {}));
function main() {
    Lib.AP.InitArchiveDuration();
    const currentAction = ActionHelpers.GetCurrentAction();
    const actionMap = {
        "approve": { execute: ActionHelpers.Archive },
        "autocomplete": { execute: ActionHelpers.RunStatementMatching },
        "reject": { execute: ActionHelpers.Reject },
        "reprocess": { execute: ActionHelpers.RunStatementMatching },
        "": { execute: ActionHelpers.RunStatementMatching }
    };
    // Add customized actions to actionMap if not using the same actionName
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.StatementMatching.Validation.ExtendActionMap", actionMap);
    if (actionMap[currentAction]) {
        actionMap[currentAction].execute();
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.StatementMatching.Validation.onActionEnd", currentAction);
    }
}
main();
//# sourceMappingURL=validationscript.js.map