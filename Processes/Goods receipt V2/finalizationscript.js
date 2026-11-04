"use strict";
const currentName = Data.GetActionName();
const currentAction = Data.GetActionType();
Log.Info("-- GR Finalization Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
async function GenerateDemoInvoice() {
    let bHasReceivedSomething = false;
    let table = Data.GetTable("LineItems__");
    let nItems = table.GetItemCount();
    for (let i = 0; i < nItems; i++) {
        let lineItem = table.GetItem(i);
        if (lineItem.GetValue("ReceivedQuantity__")) {
            bHasReceivedSomething = true;
            break;
        }
    }
    if (bHasReceivedSomething) {
        await Lib.Purchasing.Demo.GenerateVendorInvoice(Data.GetValue("OrderNumber__"), true, true);
    }
}
async function Start() {
    // Generate demo invoice asynchronously (demo only AND it can take some time)
    if (Sys.Parameters.GetInstance("PAC").GetParameterNumber("DemoEnableInvoiceCreation") === 3 &&
        currentName !== "UpdateExchangeRate"
        && currentName !== "FullBudgetRecovery"
        && currentName !== "OnReturnOrder"
        && currentName !== "OnEditOrder"
        && currentName !== "RetryOnEditOrder"
        && Data.GetValue("GRNumber__") !== "") {
        if (Lib.Purchasing.Demo.GetVendorInvoiceDOCTemplate()) {
            await GenerateDemoInvoice();
        }
        else {
            //let an error in log, but not block the process
            Log.Error("Try to generate demo invoice, but no template found");
        }
    }
    const poNumber = Data.GetValue("OrderNumber__");
    if (poNumber && Data.GetValue("GRStatus__") === "Received") {
        const noGRReason = Sys.Parameters.GetInstance("P2P").GetParameter("CustomWaitingForGoodsReceiptAsideReason", Lib.AP.AsideReason.WaitingForGR);
        Log.Info("Try waking up any set aside invoice(s) with missing GR related to PO#" + poNumber);
        const filter = `(&(Deleted=0)(State=70)(SplitDone=0)(InvoiceStatus__=Set aside)(AsideReason__=${noGRReason})(OrderNumber__=*${poNumber}*))`;
        let query = Process.CreateQueryAsProcessAdmin();
        query.SetSpecificTable("CDNAME#Vendor invoice");
        query.SetAttributesList("*");
        query.SetFilter(filter);
        query.SetSearchInArchive(false);
        query.SetOptionEx("Limit=10");
        if (query.MoveFirst()) {
            let rec = query.MoveNext();
            if (rec) {
                while (rec) {
                    let vars = rec.GetUninheritedVars();
                    const msnEx = vars.GetValue_String("MsnEx", 0);
                    vars.AddValue_String("RequestedActions", "approve|checkgoodsreceipt", true);
                    vars.AddValue_String("NeedValidation", "0", true);
                    rec.Validate("Check for goods receipts (GR form)");
                    if (rec.GetLastError() !== 0) {
                        Log.Warn("Cannot wake invoice " + msnEx + " up:\n" + rec.GetLastErrorMessage());
                    }
                    else {
                        Log.Info("Waking up invoice " + msnEx);
                    }
                    rec = query.MoveNext();
                }
            }
            else {
                Log.Info("No set aside invoices to 'wake up'");
            }
        }
        else {
            Log.Error("Error trying to retrieve invoices to 'wake up' with filter '" + filter + "'\n" + query.GetLastErrorMessage());
        }
    }
}
Lib.P2P.HandleScriptError(Start());
//# sourceMappingURL=finalizationscript.js.map