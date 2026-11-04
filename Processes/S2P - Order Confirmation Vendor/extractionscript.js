"use strict";
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ExtractionScript;
(function (ExtractionScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    class Main {
        constructor() {
            this.logger = new NamedLog({ namespace: "Order Confirmation Vendor" });
        }
        async Start() {
            const currentName = Data.GetActionName();
            const currentAction = Data.GetActionType();
            this.logger.Info("-- Order Confirmation Vendor Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
            await Lib.Purchasing.OCVendor.InitConfirmedFieldsDefinition();
            Data.SetValue("PONumber__", Variable.GetValueAsString("OrderNumber__"));
            await Lib.Purchasing.OCVendor.FillLineItemsWithQuery();
            // Must be done when the configuration is loaded
            Lib.P2P.InitValidityDateTime("PAC");
            Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationPortalInMonths");
            const creationMode = Variable.GetValueAsString("OrderConfirmationCreationMode");
            Log.Info(`Creation mode: ${creationMode}`);
            let table = Data.GetTable("LineItems__");
            for (let index = 0; index < table.GetItemCount(); index++) {
                let item = table.GetItem(index);
                item.SetValue("ItemOCType__", creationMode);
            }
        }
    }
    ExtractionScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        Lib.P2P.HandleScriptError(main.Start());
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map