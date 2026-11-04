"use strict";
function updatePaymentReferenceInVendorInvoice() {
    var _a;
    try {
        const extractedDataString = Variable.GetValueAsString("ExtractedData");
        const paymentData = Sys.Helpers.IsEmpty(extractedDataString) ? {} : JSON.parse(extractedDataString);
        const invoices = ((_a = paymentData.ExtractedData) === null || _a === void 0 ? void 0 : _a.Invoices) || [];
        for (const invoice of invoices) {
            let updatableInvoice = Process.GetUpdatableTransportAsProcessAdmin(invoice.InvRUIDEX);
            let updatableInvoiceVars = updatableInvoice.GetUninheritedVars();
            updatableInvoiceVars.AddValue_String("RemittanceAdviceReference__", Data.GetValue("ruidex"), true);
            updatableInvoice.Process();
        }
    }
    catch (error) {
        Log.Error(`Error updating payment reference in vendor invoice: ${error.message}`);
    }
}
function Run() {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info(`-- Validation Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}'`);
    if (!currentName && !currentAction) {
        const vendorContactLogin = Variable.GetValueAsString("VendorContactLogin");
        if (vendorContactLogin && vendorContactLogin.length > 0) {
            const vendorContact = vendorContactLogin.split(",");
            for (let i = 0; i < vendorContact.length; i++) {
                Process.AddRight(vendorContact[i], "read");
            }
        }
        let message;
        if (!Data.GetValue("PayerAddress__")) {
            message = Language.Translate("_No Payer address");
        }
        if (message) {
            Lib.CommonDialog.NextAlert.Define("_Error", message);
            Data.SetValue("State", 200);
            Data.SetValue("StatusCode", 1);
            Data.SetValue("ShortStatusTranslated", message);
            Data.SetValue("ShortStatus", message);
            Data.SetValue("LongStatus", message);
            Data.SetValue("CompletionDateTime", new Date());
        }
        updatePaymentReferenceInVendorInvoice();
    }
}
Run();
//# sourceMappingURL=validationscript.js.map