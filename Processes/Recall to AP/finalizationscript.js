"use strict";
function recallInvoice(trn) {
    const vars = trn.GetVars(false);
    const msnEx = vars.GetValue("MSNEX", 0);
    const invoiceNumber = vars.GetValue("InvoiceNumber__", 0);
    const invoiceStatus = vars.GetValue("InvoiceStatus__", 0);
    if (invoiceStatus === Lib.AP.InvoiceStatus.ToApprove || invoiceStatus === Lib.AP.InvoiceStatus.OnHold) {
        // Call the validate action "recalltoap" for the current transport
        vars.AddValue_String("RequestedActions", "approve|recalltoap", true);
        vars.AddValue_String("NeedValidation", "1", true);
        vars.AddValue_String("LastValidatorUserId__", Data.GetValue("OwnerID"), true);
        const validator = Users.GetUser(Data.GetValue("OwnerID"));
        const validatorVars = validator.GetVars();
        vars.AddValue_String("LastValidatorName__", validatorVars.GetValue_String("DisplayName", 0), true);
        vars.AddValue_String("Comment__", Data.GetValue("RecallToAPComment__"), true);
        trn.Validate("recalltoap");
        if (trn.GetLastError() !== 0) {
            Log.Error(`${msnEx} invoice ${invoiceNumber} recall failed :${trn.GetLastErrorMessage()}`);
        }
        else {
            Log.Info(`${msnEx} invoice ${invoiceNumber} recall ok`);
        }
    }
    else {
        Log.Warn(`${msnEx} invoice ${invoiceNumber} already in accounting (status = ${invoiceStatus})`);
    }
}
function queryFilter(ruids) {
    let filter = "|";
    const ruidexList = ruids.split("|");
    for (let i = 0; i < ruidexList.length; i++) {
        filter += `(Ruidex=${ruidexList[i]})`;
    }
    return filter;
}
function run() {
    const ruidexList = Variable.GetValueAsString("AncestorsRuid");
    if (ruidexList) {
        const query = Process.CreateQueryAsProcessAdmin();
        query.SetSpecificTable("CDNAME#Vendor invoice");
        // Must select all these attributes to be able to call custom action recalltoap
        query.AddAttribute("OwnerId");
        query.AddAttribute("OwnerPb");
        query.AddAttribute("MainAccountId");
        query.AddAttribute("ProcessId");
        query.AddAttribute("MsnEx");
        query.AddAttribute("RuidEx");
        query.AddAttribute("State");
        query.AddAttribute("Subject");
        query.AddAttribute("ValidatorOwnerID");
        query.AddAttribute("InvoiceNumber__");
        query.AddAttribute("InvoiceStatus__");
        query.SetOptionEx("FastSearch=1");
        query.SetFilter(queryFilter(ruidexList));
        if (query.MoveFirst()) {
            let trn = query.MoveNext();
            while (trn) {
                recallInvoice(trn);
                trn = query.MoveNext();
            }
        }
    }
}
run();
//# sourceMappingURL=finalizationscript.js.map