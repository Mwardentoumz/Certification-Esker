"use strict";
function createAndClearDocumentInSAP() {
    try {
        Sys.Helpers.SAP.SetLastError("");
        Lib.P2P.InitSAPConfiguration("AP");
        let documentIds = {
            FI: Data.GetValue("ERPInvoiceNumber__")
        };
        if (!Lib.AP.SAP.Invoice.Post.CheckDocumentId(documentIds)) {
            const customDates = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.CustomizeClearingHeaderDates");
            if (customDates && customDates.postingDate) {
                Data.SetValue("PostingDate__", customDates.postingDate);
            }
            else {
                Data.SetValue("PostingDate__", new Date());
            }
            if (customDates && customDates.invoiceDate) {
                Data.SetValue("InvoiceDate__", customDates.invoiceDate);
            }
            else {
                Data.SetValue("InvoiceDate__", new Date());
            }
            const docType = Sys.Parameters.GetInstance("AP").GetParameter("SAPDocumentTypeFIInvoice");
            documentIds = Lib.AP.SAP.Invoice.Post.SAPCreateInvoice(docType, false);
        }
        if (documentIds && documentIds.FI) {
            Data.SetValue("ERPInvoiceNumber__", documentIds.FI);
            Lib.AP.SAP.Invoice.Post.ERPAttachURLs();
        }
        else {
            // clearing document not created, remove date
            Data.SetValue("PostingDate__", null);
            Data.SetValue("InvoiceDate__", null);
            const error = Sys.Helpers.SAP.GetLastError();
            throw error ? error : "can't get FI document ID";
        }
        if (!documentIds.Cleared) {
            throw "document has not been cleared";
        }
        return true;
    }
    catch (exception) {
        setProcessInError("Error during invoice clearing : " + exception);
    }
    return false;
}
function setProcessInError(errorMessage) {
    Log.Error(errorMessage);
    const error = Data.GetError("ERPInvoiceNumber__");
    Data.SetError("ERPInvoiceNumber__", (error ? error + "\n" : "") + errorMessage);
    Process.PreventApproval();
}
function getMsnExsFromRuidExs(alreadyUpdatedInvoices) {
    const result = {
        processid: null,
        msnexs: []
    };
    const ancestorRuids = Variable.GetValueAsString("AncestorsRuid");
    if (!ancestorRuids) {
        return result;
    }
    const ancestors = ancestorRuids.split("|");
    for (const ancestor of ancestors) {
        if (ancestor.length > 3 &&
            "CD#" === ancestor.substr(0, 3)) {
            const currentProcessId = ancestor.substr(3, ancestor.indexOf(".") - 3);
            const msnEx = ancestor.substr(ancestor.indexOf(".") + 1);
            if (!result.processid) {
                result.processid = currentProcessId;
            }
            if (currentProcessId === result.processid && alreadyUpdatedInvoices.indexOf(msnEx) < 0) {
                result.msnexs.push(msnEx);
            }
            else {
                Log.Warn(`Ignore ${ancestor} because the processid ${currentProcessId} !=${result.processid}`);
            }
        }
        else {
            Log.Warn(`Ignore ${ancestor} because not a CD#`);
        }
    }
    return result;
}
function findAndUpdateInvoice() {
    try {
        let alreadyUpdatedInvoices = Transaction.Read(Lib.ERP.Invoice.transaction.keys.invoicesUpdatedWithClearDocNumber);
        const ancestors = getMsnExsFromRuidExs(alreadyUpdatedInvoices);
        //MSN and ProcessID are mandatory to commit modification
        const query = Process.CreateQueryAsProcessAdmin();
        query.Reset();
        query.AddAttribute("*");
        query.SetSearchInArchive(false);
        let filter;
        if (ancestors.processid && ancestors.msnexs.length > 0) {
            query.SetSpecificTable("CD#" + ancestors.processid);
            if (ancestors.msnexs.length > 1) {
                filter = `|(MsnEx=${ancestors.msnexs.join(")(MsnEx=")})`;
            }
            else {
                filter = "MsnEx=" + ancestors.msnexs[0];
            }
            query.SetFilter(filter);
        }
        else {
            Log.Error("Empty or invalid AncestorsRuidEx to update child invoices");
            return;
        }
        query.MoveFirst();
        let eddTransport = query.MoveNext();
        const erpId = Data.GetValue("ERPInvoiceNumber__");
        while (eddTransport) {
            const vars = eddTransport.GetUninheritedVars();
            const externalVariables = eddTransport.GetExternalVars();
            const state = vars.GetValue_Long("State", 0);
            const waitForUpdate = vars.GetValue_Long("WaitingForUpdate", 0);
            if (state === 90 && waitForUpdate) {
                Log.Info("Updating invoice with document ID:" + erpId);
                vars.AddValue_String("ERPClearingDocumentNumber__", erpId, true);
                externalVariables.AddValue_String("VendorInvoiceClearingRuidex", Data.GetValue("RuidEx"), true);
                if (!eddTransport.ResumeWithAction("clearingdone", false)) {
                    setProcessInError(`Cannot validate invoice with document ID ${erpId} with action clearingdone :${eddTransport.GetLastErrorMessage()}`);
                }
                else {
                    alreadyUpdatedInvoices += vars.GetValue_String("msnex", 0) + ";";
                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.invoicesUpdatedWithClearDocNumber, alreadyUpdatedInvoices);
                }
            }
            else if (state === 70) // Legacy part, still need to handle invoices in state 70
             {
                Log.Info("Updating invoice with document ID:" + erpId);
                externalVariables.AddValue_String("VendorInvoiceClearingRuidex", Data.GetValue("RuidEx"), true);
                vars.AddValue_String("ERPClearingDocumentNumber__", erpId, true);
                vars.AddValue_String("RequestedActions", "approve|clearingdone", true);
                if (!eddTransport.Validate(Data.GetValue("ClearInvoicesComment__"))) {
                    // The invoice is not in the expected state: failure
                    setProcessInError(`Cannot validate invoice with document ID ${erpId} with action clearingdone`);
                }
                else {
                    alreadyUpdatedInvoices += vars.GetValue_String("msnex", 0) + ";";
                    Transaction.Write(Lib.ERP.Invoice.transaction.keys.invoicesUpdatedWithClearDocNumber, alreadyUpdatedInvoices);
                }
            }
            else {
                // The invoice is not in the expected state: failure
                setProcessInError(`Cannot update invoice with document ID ${erpId} because it is not in the expected state (state=${state})`);
            }
            eddTransport = query.MoveNext();
        }
    }
    catch (exception) {
        setProcessInError("Error while updating invoices after clearing done : " + exception);
    }
}
function actionClearInvoices() {
    Data.SetError("ERPInvoiceNumber__", "");
    if (createAndClearDocumentInSAP()) {
        findAndUpdateInvoice();
    }
}
function runValidationScript() {
    if (Data.GetActionName() === "ClearInvoices") {
        actionClearInvoices();
    }
    else {
        Process.PreventApproval();
    }
}
runValidationScript();
//# sourceMappingURL=validationscript.js.map