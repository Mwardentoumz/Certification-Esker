"use strict";
function setProcessInError(errorMessage) {
    Log.Error(errorMessage);
    Process.Exit(200);
}
const NOT_FINISHED = 0;
const actionName = Data.GetActionName();
if (actionName !== "ApproveAfterRecall") {
    Variable.SetValueAsString("FirstMsnEx", "");
}
function exportUnpaidInvoices(erpManager) {
    if (!erpManager) {
        setProcessInError("No associated ERP manager");
    }
    else {
        let exportResult;
        if (erpManager.Init("AP")) {
            exportResult = erpManager.GetDocument("INVOICE_PAYMENTS").ExportUnpaidInvoices();
        }
        erpManager.Finalize();
        if (exportResult === NOT_FINISHED) {
            Process.RecallScript("ApproveAfterRecall", true);
        }
    }
}
function run() {
    if (Attach.GetNbAttach() > 0) {
        let firstMsnEx = Variable.GetValueAsString("FirstMsnEx");
        if (!firstMsnEx) {
            firstMsnEx = Lib.AP.UnpaidInvoices.getFirstMsnEx();
            Variable.SetValueAsString("FirstMsnEx", firstMsnEx);
        }
        Lib.ERP.CreateManagerFromRecord("CDNAME#Vendor invoice", `(MsnEx=${firstMsnEx})`, exportUnpaidInvoices);
    }
    else {
        setProcessInError("Missing CSV file");
    }
}
run();
//# sourceMappingURL=finalizationscript.js.map