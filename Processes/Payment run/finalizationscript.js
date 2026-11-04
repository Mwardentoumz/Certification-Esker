"use strict";
const instance = Sys.Parameters.GetInstance("PaymentRun");
const invoiceFieldsToUpdateUponApproval = {
    fields: {
        "PaymentScheduled__": "1",
        "InvoiceStatus__": Lib.AP.InvoiceStatus.Paid,
        "LastValidatorName__": Data.GetValue("WorkflowInitiatorName__"),
        "LastValidatorUserId__": Data.GetValue("WorkflowInitiatorID__")
    },
    tables: {}
};
const customerInvoiceFieldsToUpdateUponApproval = {
    fields: {
        "CustomerInvoiceStatus__": Lib.AP.CIStatus.Paid
    },
    tables: {}
};
const invoiceFieldsToUpdateUponReject = {
    fields: {
        "InvoiceStatus__": Lib.AP.InvoiceStatus.ToPay
    },
    tables: {}
};
function runFinalization() {
    const archiveDuration = instance.GetParameter("ArchiveDurationInMonths");
    if (archiveDuration) {
        Log.Info(`Set archive duration to '${archiveDuration}' months`);
        Data.SetValue("ArchiveDuration", archiveDuration);
    }
}
runFinalization();
//# sourceMappingURL=finalizationscript.js.map