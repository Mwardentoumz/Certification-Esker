"use strict";
/////////////////////////////////////////////////////////////
// Global variables
/////////////////////////////////////////////////////////////
/**
 * Returns all items in PO form by PR number.
 * @returns {object} items map by PR number
 */
function GetPRItemsInForm() {
    var allPRItems = {};
    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
        var prNumber = line.GetValue("PRNumber__");
        if (!(prNumber in allPRItems)) {
            allPRItems[prNumber] = [];
        }
        allPRItems[prNumber].push(line);
    });
    return allPRItems;
}
function CancelItems() {
    //Notify all PR
    var allPRItems = GetPRItemsInForm(), lockByPRNames = Object.keys(allPRItems), resumeWithActionData;
    // Protect concurrent access on PO items for each PR number
    Process.PreventConcurrentAccess(lockByPRNames, function () {
        Sys.Helpers.Object.ForEach(allPRItems, function (prItems, prNumber) {
            resumeWithActionData = {
                user: {
                    login: Lib.P2P.GetOwner().GetValue("login"),
                    name: Lib.P2P.GetOwner().GetValue("DisplayName"),
                    email: Lib.P2P.GetOwner().GetValue("EmailAddress")
                },
                date: new Date(),
                comment: Data.GetValue("Comment__"),
                lines: []
            };
            Sys.Helpers.Object.ForEach(prItems, function (item /*, i*/) {
                resumeWithActionData.lines.push(item.GetValue("PRLineNumber__"));
                Log.Info("Call Cancel Item for item : " + prNumber + "-" + item.GetValue("PRLineNumber__"));
            });
            Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("Purchase requisition", prItems[0].GetValue("PRRUIDEX__"), "Cancel_items", JSON.stringify(resumeWithActionData));
        });
    });
}
/////////////////////////////////////////////////////////////
// Main
/////////////////////////////////////////////////////////////
Lib.Purchasing.InitTechnicalFields(false, false);
var currentName = Data.GetActionName();
var currentAction = Data.GetActionType();
Log.Info("-- PRI Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
if (currentName !== "" && currentAction !== "") {
    if (currentAction === "approve_asynchronous" && currentName === "Cancel_PRItems") {
        CancelItems();
    }
}
//# sourceMappingURL=validationscript.js.map