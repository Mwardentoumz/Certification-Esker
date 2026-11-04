"use strict";
const numberOfCSVLinesPerLoop = 100;
Process.SetTimeOut(2 * 60 * 60);
function runFinalization() {
    // 3 modes: from single invoice, from csv or from admin list
    const mode = Lib.AP.UpdatePaymentDetails.GetMode();
    const vendorInvoiceProcessName = Variable.GetValueAsString("VendorInvoiceProcessName");
    switch (mode) {
        case "AdminList":
            {
                // From admin list: update the invoices
                const ruidexList = Variable.GetValueAsString("AncestorsRuid");
                const payments = Lib.AP.UpdatePaymentDetails.CreatePaymentsForUpdate(ruidexList);
                Lib.ERP.CreateManagerFromRecord("CDNAME#Vendor Invoice", `(ruidex=${ruidexList.split("|")[0]})`, function (erpMgr) {
                    if (erpMgr) {
                        Lib.AP.UpdatePaymentDetails.erpMgr = erpMgr;
                    }
                    Lib.AP.UpdatePaymentDetails.JSONToUpdatePaymentDetails(payments, Lib.AP.UpdatePaymentDetails.GetCurrentUser(), vendorInvoiceProcessName, "ruidex");
                });
                break;
            }
        case "CSV":
            {
                // From CSV file: update the invoices
                const user = Lib.AP.UpdatePaymentDetails.GetCurrentUser();
                // Get ERP manager from first CSV line
                let res = Lib.AP.UpdatePaymentDetails.GenerateCSVToJson(numberOfCSVLinesPerLoop, true);
                if (Object.keys(res).length > 0) {
                    const filter = `(${res[Object.keys(res)[0]].queryFilter})`;
                    Lib.ERP.CreateManagerFromRecord("CDNAME#Vendor Invoice", filter, function (erpMgr) {
                        if (erpMgr) {
                            Lib.AP.UpdatePaymentDetails.erpMgr = erpMgr;
                        }
                        while (Object.keys(res).length > 0) {
                            Lib.AP.UpdatePaymentDetails.JSONToUpdatePaymentDetails(res, user, vendorInvoiceProcessName, ["CompanyCode__", "VendorNumber__", "InvoiceNumber__"]);
                            res = Lib.AP.UpdatePaymentDetails.GenerateCSVToJson(numberOfCSVLinesPerLoop);
                        }
                    });
                }
                Log.Info("Update is complete!");
                break;
            }
        //case "SingleInvoice":
        default:
            {
                // From single invoice: nothing to do (done in validation script)
                break;
            }
    }
}
runFinalization();
Data.SetValue("KeepOpenAfterApproval", "ForceClose");
//# sourceMappingURL=finalizationscript.js.map