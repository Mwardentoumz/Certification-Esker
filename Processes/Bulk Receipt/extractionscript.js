"use strict";
var ExtractionScript;
(function (ExtractionScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    class Main {
        constructor() {
            this.logger = new NamedLog({ namespace: "Bulk Receipt" });
        }
        async Start() {
            const actionName = Data.GetActionName();
            const actionType = Data.GetActionType();
            Log.Info(`-- BR Extraction Script -- Name: '${actionName || "<empty>"}', Action: '${actionType || "<empty>"}'`);
            const bulkReceiptDataStr = Variable.GetValueAsString("BulkReceiptData");
            if ((actionName === "" && actionType === "") && (bulkReceiptDataStr !== "")) {
                const bulkReceiptDataHandler = new BulkReceiptDataHandler();
                await bulkReceiptDataHandler.Load(bulkReceiptDataStr);
            }
        }
    }
    ExtractionScript.Main = Main;
    class BulkReceiptDataHandler {
        constructor() {
            this.logger = new NamedLog({ namespace: "BulkReceiptDataHandler" });
        }
        async Load(bulkReceiptDataStr) {
            const bulkReceiptData = this.ParseBulkReceiptData(bulkReceiptDataStr);
            if (bulkReceiptData) {
                await this.LoadBulkReceiptData(bulkReceiptData);
            }
        }
        ParseBulkReceiptData(bulkReceiptDataStr) {
            try {
                return JSON.parse(bulkReceiptDataStr);
            }
            catch (e) {
                this.logger.Error(`Error parsing BulkReceiptData: ${e}`);
            }
        }
        async LoadBulkReceiptData(bulkReceiptData) {
            const items = bulkReceiptData.Items;
            if (!items) {
                this.logger.Error("No items in BulkReceiptData");
                return false;
            }
            // delivery date
            if (bulkReceiptData.DeliveryDate) {
                Data.SetValue("DeliveryDate2__", Sys.Helpers.Date.ISOSTringToDate(bulkReceiptData.DeliveryDate));
            }
            const indexByCompositeKey = {};
            items.forEach(it => {
                if (it.lineItemNumber && it.orderNumber) {
                    indexByCompositeKey[`${it.lineItemNumber}###${it.orderNumber}`] = it;
                }
            });
            // fill items
            await Lib.Purchasing.BR.Items.bulkReceiptItemsManager.Init(items.map(i => i.itemRuid));
            // trigger updates
            Sys.Helpers.Data.ForEachTableItem("LineItems__", (formItem) => {
                // build composite key
                const compositeKey = `${formItem.GetValue("POLineNumber__")}###${formItem.GetValue("OrderNumber__")}`;
                let incoming = indexByCompositeKey[compositeKey];
                if (!incoming) {
                    throw new Error(`No matching incoming item for form item with composite key ${compositeKey}`);
                }
                // apply received quantity or amount
                const isAmountBased = Lib.Purchasing.Items.IsAmountBasedItem(formItem);
                if (isAmountBased) {
                    // quantity is an amount when amount-based
                    formItem.SetValue("NetAmount__", incoming.quantity);
                    Lib.Purchasing.Receiving.OnChangeNetAmount(formItem);
                }
                else {
                    formItem.SetValue("ReceivedQuantity__", incoming.quantity);
                    Lib.Purchasing.Receiving.OnChangeReceivedQuantity(formItem);
                }
                // last delivery flag
                if (incoming.lastDelivery === true) {
                    formItem.SetValue("DeliveryCompleted__", true);
                    Lib.Purchasing.Receiving.OnChangeDeliveryCompleted(formItem);
                }
            });
            // check residual errors
            Lib.Purchasing.Receiving.CheckErrorOnTable();
            Lib.Purchasing.Receiving.CheckConfirmDelivery();
            return true;
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        Lib.P2P.HandleScriptError(main.Start());
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map