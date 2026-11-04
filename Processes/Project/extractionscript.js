"use strict";
var Extraction;
(function (Extraction) {
    Data.SetValue("ArchiveBehavior", "30"); // Do not archive Source Document.
    /* Expense extraction script */
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info("-- Project Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
})(Extraction || (Extraction = {}));
//# sourceMappingURL=extractionscript.js.map