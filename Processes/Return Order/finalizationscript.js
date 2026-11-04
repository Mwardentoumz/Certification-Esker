"use strict";
async function Start() {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info("-- RO Finalization Script -- Name: '" + (currentName || "<empty>") + "', Action: '" + (currentAction || "<empty>") + "'");
    if (Sys.Parameters.GetInstance("PAC").GetParameterNumber("DemoEnableInvoiceCreation") === 3) {
        Log.Info("[SubmitReturnOrder] Generating Demo Credit Memo");
        //GenerateVendorInvoice with last parameter set to true allows to retrieve infos from RO
        await Lib.Purchasing.Demo.GenerateVendorInvoice(Data.GetValue("OrderNumber__"), true, false, true);
    }
}
Lib.P2P.HandleScriptError(Start());
//# sourceMappingURL=finalizationscript.js.map