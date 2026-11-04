"use strict";
var apSpendingDispatcher = Lib.AP.apSpendingDispatcher;
var APContractSpending = Lib.AP.APContractSpending;
var ContractSpendingHandler = Lib.Spending.Contract.Handler;
var ContractSpendingUpdater = Lib.Spending.Contract.Updater;
var APProjectSpending = Lib.AP.APProjectSpending;
var ProjectSpendingHandler = Lib.Spending.Project.Handler;
var ProjectSpendingUpdater = Lib.Spending.Project.Updater;
apSpendingDispatcher.Register(Lib.AP.apBudgetSpending);
const contractSpendingHandler = new ContractSpendingHandler();
const apContractSpending = new APContractSpending(contractSpendingHandler, new ContractSpendingUpdater(contractSpendingHandler));
apSpendingDispatcher.Register(apContractSpending);
const projectSpendingHandler = new ProjectSpendingHandler();
const apProjectSpending = new APProjectSpending(projectSpendingHandler, new ProjectSpendingUpdater(projectSpendingHandler));
apSpendingDispatcher.Register(apProjectSpending);
let vendorInvoiceLineItems;
function reverseCI() {
    const CIruidex = Variable.GetValueAsString("CustomerInvoiceRuidEx");
    if (CIruidex) {
        let CIUpdated = false;
        const CIQuery = Process.CreateQueryAsProcessAdmin();
        CIQuery.Reset();
        CIQuery.SetSpecificTable("CDNAME#Customer invoice");
        CIQuery.SetAttributesList("RUIDEX,State,CustomerInvoiceStatus__");
        CIQuery.SetFilter("RUIDEX=" + CIruidex);
        CIQuery.SetSearchInArchive(true);
        if (CIQuery.MoveFirst()) {
            const transport = CIQuery.MoveNext();
            if (transport) {
                const action = "reverseci";
                Log.Info(`The customer invoice process ${CIruidex} has been found`);
                Log.Info(`Call customer action ${action}`);
                if (!transport.ResumeWithAction(action, false)) {
                    transport.ResumeWithActionAsync(action);
                }
                CIUpdated = true;
            }
        }
        if (!CIUpdated) {
            Log.Info(`The customer invoice process ${CIruidex} has not been updated`);
        }
    }
}
function reverseBudget() {
    const VIPRuidex = Variable.GetValueAsString("VendorInvoiceRuidEx");
    if (VIPRuidex) {
        if (apSpendingDispatcher.IsEnable()) {
            const BudgetQuery = Process.CreateQueryAsProcessAdmin();
            BudgetQuery.Reset();
            BudgetQuery.SetSpecificTable("CDNAME#Vendor invoice");
            BudgetQuery.SetAttributesList("*");
            BudgetQuery.SetFilter("RUIDEX=" + VIPRuidex);
            BudgetQuery.SetSearchInArchive(true);
            if (BudgetQuery.MoveFirst()) {
                const transport = BudgetQuery.MoveNext();
                if (transport) {
                    apSpendingDispatcher.AsInvoiceReversed(transport);
                }
            }
            else {
                Log.Info(`Budget is not enable - Budget not been updated after reversing invoice in Vendor Invoice Process ${VIPRuidex}`);
            }
        }
    }
}
function reverseInvoice() {
    const VIPRuidex = Variable.GetValueAsString("VendorInvoiceRuidEx");
    const msnex = VIPRuidex.substring(VIPRuidex.indexOf(".") + 1);
    if (msnex && (!Lib.AP.InvoiceType.isPOInvoice() || (Lib.AP.InvoiceType.isPOInvoice() && Lib.P2P.IsPOMatchingEnabled()))) {
        vendorInvoiceLineItems = Lib.AP.TablesUpdater.Update(true, false, VIPRuidex);
        if (Sys.P2P.Accrual.UseDetailedAccrualReport()) {
            Object.values(vendorInvoiceLineItems[msnex]).forEach(lineItem => {
                if (!Sys.Helpers.IsEmpty(lineItem.Line_OrderNumber__)) {
                    Sys.P2P.Accrual.PrepareDetailedAccrualEvent(Sys.P2P.Accrual.ActionType.PurchaseOrderItemInvoiceReversed, lineItem);
                }
            });
            Sys.P2P.Accrual.CommitDetailedAccrualEvents();
        }
    }
}
function reversePOsLinkedToInvoice() {
    const VIPRuidex = Variable.GetValueAsString("VendorInvoiceRuidEx");
    const msnex = VIPRuidex.substring(VIPRuidex.indexOf(".") + 1);
    if (vendorInvoiceLineItems === null || vendorInvoiceLineItems === void 0 ? void 0 : vendorInvoiceLineItems[msnex]) {
        Lib.AP.PurchaseOrder.UpdatePOFormsForInvoicePost({
            cdlRecord: vendorInvoiceLineItems[msnex]
        });
    }
}
reverseInvoice();
reverseCI();
reverseBudget();
reversePOsLinkedToInvoice();
//# sourceMappingURL=finalizationscript.js.map