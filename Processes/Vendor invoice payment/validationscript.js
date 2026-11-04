"use strict";
/* Vendor Invoice Payment script */
function runValidation() {
    const actionType = Data.GetActionType().toLowerCase();
    const actionName = Data.GetActionName().toLowerCase();
    const vendorInvoiceProcessName = Variable.GetValueAsString("VendorInvoiceProcessName");
    if (actionType === "approve" && actionName === "update") {
        const mode = Lib.AP.UpdatePaymentDetails.GetMode();
        switch (mode) {
            case "SingleInvoice":
                {
                    // From single invoice: update the invoice
                    // Wait finalization script to be sure that the invoice will be filled before we reopen it
                    Data.SetValue("KeepOpenAfterApproval", "waitForFinalization");
                    const ruidex = Data.GetValue("SourceRUID");
                    const payments = Lib.AP.UpdatePaymentDetails.CreatePaymentsForUpdate(ruidex);
                    Lib.ERP.CreateManagerFromRecord("CDNAME#Vendor Invoice", "(ruidex=" + ruidex + ")", function (erpMgr) {
                        if (erpMgr) {
                            Lib.AP.UpdatePaymentDetails.erpMgr = erpMgr;
                        }
                        Lib.AP.UpdatePaymentDetails.JSONToUpdatePaymentDetails(payments, Lib.AP.UpdatePaymentDetails.GetCurrentUser(), vendorInvoiceProcessName, "ruidex");
                    });
                    break;
                }
            case "CSV":
                {
                    const csvCheckError = Lib.AP.UpdatePaymentDetails.CheckCSVHeaders();
                    if (csvCheckError) {
                        const messageTranslated = Language.Translate(csvCheckError);
                        Variable.SetValueAsString("errorMessage", messageTranslated);
                        Process.PreventApproval();
                    }
                    // Do nothing, job will be done in finalization script
                    break;
                }
            // case "AdminList":
            default:
                {
                    // From admin list: do nothing, job will be done in finalization script
                    break;
                }
        }
    }
}
runValidation();
//# sourceMappingURL=validationscript.js.map