"use strict";
async function Run() {
    var _a;
    if (Lib.Purchasing.IsAutoReceiveOrderEnabled()) {
        Lib.CommonDialog.NextAlert.Reset();
        const queryParams = {
            orderByClause: "LineNumber__ ASC",
            orderNumber: (_a = Lib.Purchasing.GetAutoReceiveOrderData()) === null || _a === void 0 ? void 0 : _a.SourcePONumber
        };
        const autoReceiveOrderData = Lib.Purchasing.GetAutoReceiveOrderData();
        try {
            Log.Info("Filling GR Form with items from PO");
            await Lib.Purchasing.ReceivingItems.FillGRForm(queryParams, null, autoReceiveOrderData);
            await Lib.Purchasing.InitTechnicalFields();
        }
        catch (e) {
            Lib.CommonDialog.NextAlert.Define("_Goods receipt creation error", e, {
                isError: true,
                behaviorName: "GRInitError"
            });
        }
    }
}
Lib.P2P.HandleScriptError(Run());
//# sourceMappingURL=extractionscript.js.map