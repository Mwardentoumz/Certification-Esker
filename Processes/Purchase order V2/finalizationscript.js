"use strict";
const currentName = Data.GetActionName();
const currentAction = Data.GetActionType();
Log.Info("-- PO finalizationscript -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
if (currentName === "Finalize_PO") {
    Lib.Purchasing.POItems.UpdatePOFromGR();
    Data.SetValue("OpenOrderLocalCurrency__", 0);
}
//# sourceMappingURL=finalizationscript.js.map