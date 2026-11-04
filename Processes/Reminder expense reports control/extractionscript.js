"use strict";
Lib.P2P.EmailNotification.SendReminders({
    template: "Expense_Email_ReminderForExpRepControl.htm",
    fromName: "_EskerExpenseReports",
    backupUserAsCC: true,
    GetCustomTags: function (user) {
        var vars = user.dbInfo.GetVars();
        var language = vars.GetValue_String("Language", 0);
        let baseUrl = Data.GetValue("ValidationUrl");
        baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/"));
        return {
            "ControlerDisplayName": vars.GetValue_String("DisplayName", 0),
            "ExpenseReportWithNumber": Language.TranslateInto(user.count > 1 ? "X Expense Reports" : "1 Expense Report", language, false, user.count),
            "ExpenseReport": Language.TranslateInto(user.count > 1 ? "Expense Reports" : "Expense Report", language, false),
            "ExpenseReportWithArticle": Language.TranslateInto(user.count > 1 ? "THE Expense Reports" : "THE Expense Report", language, false),
            "ValidationUrl": baseUrl + "/View.link?tabName=_Expense%20report&viewName=_Expense%20report%20-%20To%20control"
        };
    },
    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false)
});
//# sourceMappingURL=extractionscript.js.map