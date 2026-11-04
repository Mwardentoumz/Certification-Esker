"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    function TransferItems() {
        let bok = true;
        const companyCode = Data.GetValue("CompanyCode__");
        const fromId = Data.GetValue("FromID__");
        const toId = Data.GetValue("ToID__");
        Sys.Helpers.Data.ForEachTableItem("ItemsTable__", function (line) {
            const qty = line.GetValue("TransfertQuantity__");
            if (qty) {
                const itemNumber = line.GetValue("ItemNumber__");
                const unitPrice = line.GetValue("UnitPrice__");
                const currency = line.GetValue("Currency__");
                const unitOfMeasure = line.GetValue("UnitOfMeasure__");
                const basedFilter = {
                    companyCode: companyCode,
                    itemNumber: itemNumber,
                    warehouseNumber: fromId
                };
                const removeMovement = new Lib.P2P.Inventory.InventoryMovement();
                removeMovement.movementType = "Transfert" /* Lib.P2P.Inventory.MovementType.Transfert */;
                removeMovement.movementOrigin = ruidex;
                removeMovement.companyCode = companyCode;
                removeMovement.itemNumber = itemNumber;
                removeMovement.movementUnitPrice = unitPrice;
                removeMovement.currency = currency;
                removeMovement.warehouseID = fromId;
                removeMovement.movementValue = -qty;
                removeMovement.unitOfMeasure = unitOfMeasure;
                impactedItemsFilter.push({
                    ...basedFilter,
                    warehouseNumber: fromId
                });
                const removed = Lib.P2P.Inventory.CreateOrUpdateInventoryMovement(removeMovement);
                const addMovement = new Lib.P2P.Inventory.InventoryMovement();
                addMovement.movementType = "Transfert" /* Lib.P2P.Inventory.MovementType.Transfert */;
                addMovement.movementOrigin = ruidex;
                addMovement.companyCode = companyCode;
                addMovement.itemNumber = itemNumber;
                addMovement.movementUnitPrice = unitPrice;
                addMovement.currency = currency;
                addMovement.warehouseID = toId;
                addMovement.movementValue = qty;
                addMovement.unitOfMeasure = unitOfMeasure;
                impactedItemsFilter.push({
                    ...basedFilter,
                    warehouseNumber: toId
                });
                const added = Lib.P2P.Inventory.CreateOrUpdateInventoryMovement(addMovement);
                const warehouseItem = new Lib.Purchasing.CatalogHelper.WarehouseItemProperties();
                warehouseItem.UpdateFromFormData(line, itemNumber);
                warehouseItem.warehouseNumber = toId;
                const key = Lib.P2P.Inventory.GetCriticalSection(itemNumber, toId);
                itemsToUpdate[key] = warehouseItem;
                bok = bok && removed && added;
            }
            return !bok;
        });
        return bok;
    }
    ValidationScript.TransferItems = TransferItems;
    /**
     * ENTRY POINT
     */
    const currentName = Data.GetActionName() || "<empty>";
    const currentAction = Data.GetActionType() || "<empty>";
    const ruidex = Data.GetValue("RuidEx");
    Log.Info("-- Transfert Validation Script -- Name: '" + currentName + "', Action: '" + currentAction + "'");
    const impactedItemsFilter = [];
    const itemsToUpdate = {};
    if (currentAction === "approve" && currentName === "transfer") {
        const bok = TransferItems() && Lib.P2P.Inventory.UpdateInventoryStock(impactedItemsFilter, false, itemsToUpdate);
        if (!bok) {
            Log.Warn("Revert impacted movements");
            Lib.P2P.Inventory.DeleteInventoryMovements(ruidex, null);
            Lib.P2P.Inventory.UpdateInventoryStock(impactedItemsFilter, false);
            Lib.CommonDialog.NextAlert.Define("_TransfertError", "_TransfertErrorMessage", { isError: true });
            Process.PreventApproval();
        }
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map