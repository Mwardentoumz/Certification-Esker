"use strict";
var extractionscript;
(function (extractionscript) {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info(`-- ASN Extraction Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}'`);
    function FillFormFromOrderNumber(orderNumber) {
        Log.Info("Filling ASN Form with items from PO");
        const queryParams = {
            orderNumber,
            additionnalFilters: [Sys.Helpers.LdapUtil.FilterEqual("ItemType__", Lib.P2P.ItemType.QUANTITY_BASED)]
        };
        Lib.Purchasing.POItems.FillItems(queryParams, Lib.Purchasing.Items.POItemsToASN)
            .Then((dbItems) => {
            let atLeastOneItemIsNotFullyShip = false;
            Sys.Helpers.Data.ForEachReverseTableItem("LineItems__", function (line) {
                Lib.Shipping.GetRemainingQuantityToShip(line).Then(quantityToShip => {
                    if (quantityToShip <= 0) {
                        line.RemoveItem();
                    }
                    else {
                        atLeastOneItemIsNotFullyShip = true;
                        line.SetValue("ItemQuantityToShip__", quantityToShip);
                    }
                });
            });
            Variable.SetValueAsString("atLeastOneItemIsNotFullyShip", atLeastOneItemIsNotFullyShip.toString());
            Lib.Shipping.CompleteHeaderWithOrderData(dbItems);
        });
    }
    extractionscript.FillFormFromOrderNumber = FillFormFromOrderNumber;
    function Run() {
        Data.SetValue("ASNSourceType__", "Portal");
        const orderNumber = Variable.GetValueAsString("OrderNumber__");
        FillFormFromOrderNumber(orderNumber);
        Lib.Shipping.InitDefaultCompanyCode()
            .Then(() => {
            Lib.P2P.InitValidityDateTime("PAC");
            Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationPortalInMonths");
        });
    }
    extractionscript.Run = Run;
    Run();
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map