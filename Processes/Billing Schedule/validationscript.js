"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Validation;
(function (Validation) {
    function approveAction() {
        return Lib.P2P.BillingSchedule.Workflow.DoCurrentContributorAction();
    }
    function rejectAction() {
        return Lib.P2P.BillingSchedule.Workflow.DoAction("rejection");
    }
    function cancelAction() {
        Lib.P2P.BillingSchedule.Workflow.ReOpenWorkflow();
        return Lib.P2P.BillingSchedule.Workflow.DoAction("cancellation");
    }
    function Main() {
        Lib.P2P.BillingSchedule.Workflow.Init();
        const actionType = Data.GetActionType();
        const actionName = Data.GetActionName();
        Log.Info(`[${actionType}:${actionName}]`);
        let actionMapping = {
            "Approve": {
                handler: approveAction,
                leaveForm: true,
                validateForm: true
            },
            "Reject": {
                handler: rejectAction,
                leaveForm: true,
                validateForm: false
            },
            "Cancel": {
                handler: cancelAction,
                leaveForm: true,
                validateForm: false
            }
        };
        const executeWFAction = function () {
            const actionResult = actionMapping[actionName].handler();
            if (!actionResult) {
                Log.Error("Error during action, skip approval");
                Process.PreventApproval();
            }
            else {
                // empty line items from BillingScheduleInstallmentTableName table
                // -- they're stored in the CT and the table is only used to display them to the user
                const installmentsTable = Data.GetTable(Lib.P2P.BillingSchedule.BillingScheduleInstallmentTableName);
                installmentsTable.SetItemCount(0);
                if (actionMapping[actionName].leaveForm) {
                    Process.LeaveForm();
                }
            }
        };
        const newActionMap = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.BillingSchedule.ExtendActionMap", actionMapping);
        if (newActionMap) {
            actionMapping = newActionMap;
        }
        if (!actionMapping[actionName]) {
            Log.Error(`Invalid action name ${actionName}`);
            Process.PreventApproval();
        }
        else if (actionMapping[actionName].validateForm) {
            Lib.P2P.BillingSchedule.ValidateForm().Then(function (isValid) {
                Log.Info(`Lib.P2P.BillingSchedule.ValidateForm result ${isValid}`);
                if (isValid) {
                    executeWFAction();
                }
                else {
                    Log.Error("Form is in error, skip approval");
                    Process.PreventApproval();
                }
            });
        }
        else {
            executeWFAction();
        }
    }
    Validation.Main = Main;
    Main();
})(Validation || (Validation = {}));
//# sourceMappingURL=validationscript.js.map