"use strict";
const options = {
    maxElements: 20,
    nbLoopsPerRecall: 50
};
Process.SetTimeOut(2 * 60 * 60);
const NOT_FINISHED = 0;
function run() {
    if (Lib.AP.SAP.UpdatePaymentDetails.UpdateInvoices(options) === NOT_FINISHED) {
        Process.RecallScript("payment_in_progress", true);
    }
}
run();
//# sourceMappingURL=finalizationscript.js.map