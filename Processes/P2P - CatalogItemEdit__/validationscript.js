"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    async function OnDelete() {
        if (Data.GetValue("ItemNumber__")) {
            const [catalogItem] = await Lib.Purchasing.CatalogHelper.GetItems([{ itemNumber: Data.GetValue("ItemNumber__") }]);
            Process.DisableChecks();
            if (catalogItem.IsStocked()) {
                Lib.CommonDialog.NextAlert.Define("_Catalog Item deletion error", "_Item is currently stocked, it can't be deleted", {
                    isError: true,
                    behaviorName: "onUnexpectedError"
                });
                Process.PreventApproval();
            }
            else {
                catalogItem.Delete();
            }
        }
    }
    async function OnSave() {
        if (Lib.P2P.FormHasError()) {
            Process.PreventApproval();
        }
        else if (Data.GetValue("ItemNumber__")) {
            const [catalogItem] = await Lib.Purchasing.CatalogHelper.GetItems([{ itemNumber: Data.GetValue("ItemNumber__") }]);
            catalogItem.UpdateFromFormData();
            catalogItem.SaveInDB();
        }
        else {
            let catalogItem = new Lib.Purchasing.CatalogHelper.CatalogItem();
            catalogItem.UpdateFromFormData();
            catalogItem.SaveInDB();
        }
    }
    async function Run() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- CatalogItemEdit Validation Script -- Name: '" + (currentName || "<empty>") + "', Action: '" + (currentAction || "<empty>") + "'");
        const actionHandlers = {
            "delete": OnDelete,
            "save": OnSave
        };
        const handler = actionHandlers[currentName];
        if (handler) {
            await handler();
        }
        else {
            Log.Warn("Action not handled");
            Process.PreventApproval();
        }
    }
    Lib.P2P.HandleScriptError(Run());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map