"use strict";
var Validation;
(function (Validation) {
    var currentName = Data.GetActionName();
    var currentAction = Data.GetActionType();
    const budgetManagement = new Lib.Spending.Budget.Management.BudgetManagement(Lib.Spending.Budget.Management.mixin, "PurchasingBudget__");
    Log.Info("-- Budget Management Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
    /** ********* **/
    /** FUNCTIONS **/
    /** ********* **/
    function ExecuteAction(action, template) {
        Sys.Helpers.TryCallFunction("Lib.Budget.Management.Customization.Server.OnExecuteAction", currentName);
        let completedTime = "";
        let startTime = Data.GetValue("ValidationDateTime");
        Data.SetValue("StartedTime__", startTime);
        Process.EnableScriptMode(false);
        let msg;
        try {
            const actionResult = action();
            completedTime = new Date();
            Data.SetValue("CompletedTime__", completedTime);
            msg = actionResult.msg;
        }
        catch (errorResult) {
            msg = errorResult.msg || errorResult.message || errorResult.toString();
        }
        Data.SetValue("Output__", msg);
        if (template) {
            const user = Users.GetUser(Data.GetValue("User__"));
            const formatOptions = {
                dateFormat: "ShortDate",
                timeZone: "Local"
            };
            const customTags = {
                "Operation__": Language.Translate("_Operation" + Data.GetValue("Operation__") + "Step"),
                "ImportedFileName": Attach.GetName(0) + Attach.GetExtension(0),
                "StartedTime__": user.GetFormattedDate(startTime, formatOptions),
                "CompletedTime__": completedTime ? user.GetFormattedDate(completedTime, formatOptions) : "",
                "Output__": msg
            };
            SendNotificationEmail(customTags, template);
        }
        else {
            Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
        }
    }
    function SendNotificationEmail(customTags, template) {
        Lib.P2P.EmailNotification.SendEmailNotificationWithUser(Users.GetUser(Data.GetValue("User__")), {
            template: template,
            fromName: "",
            backupUserAsCC: false,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
            customTags: customTags
        });
    }
    if (Data.GetValue("State") >= 50) {
        if (currentAction === "approve_asynchronous" || currentAction === "approve" || currentAction === "ResumeWithAction") {
            switch (currentName) {
                case "ImportCSV":
                    if (currentAction === "approve_asynchronous") {
                        ExecuteAction(() => budgetManagement.ImportCSV(), "Budget_Management_Email_ImportSummary.htm");
                    }
                    else {
                        const maxLines = 500;
                        if (budgetManagement.GetImportCSVLineCount(maxLines + 1) <= maxLines) {
                            ExecuteAction(() => budgetManagement.ImportCSV());
                        }
                        else {
                            Lib.CommonDialog.NextAlert.Define("_Import large CSV", "_Confirm import of large CSV asynchronously", {
                                isError: false,
                                behaviorName: "LargeCSV"
                            }, maxLines);
                            Process.PreventApproval();
                        }
                    }
                    break;
                case "Delete":
                    ExecuteAction(() => budgetManagement.Delete());
                    break;
                case "Export":
                    ExecuteAction(() => budgetManagement.ExportCSV());
                    break;
                case "Revise":
                    ExecuteAction(() => budgetManagement.Revise());
                    break;
                case "Close":
                    ExecuteAction(() => budgetManagement.Close());
                    break;
                default:
                    break;
            }
        }
        else if (currentAction !== "reprocess") {
            ExecuteAction(() => budgetManagement.ImportCSV(), "Budget_Management_Email_OperationSummary.htm");
        }
    }
    Sys.Helpers.TryCallFunction("Lib.Budget.Management.Customization.Server.OnValidationScriptEnd", currentAction, currentName);
})(Validation || (Validation = {}));
//# sourceMappingURL=validationscript.js.map