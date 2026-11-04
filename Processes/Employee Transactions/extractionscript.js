"use strict";
var extractionscript;
(function (extractionscript) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // MAIN
    function Run() {
        const currentAction = Data.GetActionType();
        const currentName = Data.GetActionName();
        Log.Info(`-- Employee Transactions Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}'`);
        Lib.Expense.Transaction.Server.InitEmployeeTransaction();
    }
    extractionscript.Run = Run;
    Run();
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map