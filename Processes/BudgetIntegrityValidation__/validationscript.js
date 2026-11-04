"use strict";
/*globals Data, Log, Lib, Process, Query */
const RecoveryHelper = {
    /** Recovery for PAC */
    Recover: function () {
        const operationsId = [];
        const budgetToCompute = [];
        const when = new Date();
        when.setTime(when.getTime() - 86400 * 3 * 1000); // Only check 3 days old records
        const filter = "(&(state>100)(CompletionDateTime>" + Sys.Helpers.Date.Date2DBDateTime(when) + "))";
        this.PopulateBudgetToCompute(operationsId, "Purchase requisition V2", filter);
        this.PopulateBudgetToCompute(operationsId, "Purchase order V2", filter);
        this.PopulateBudgetToCompute(operationsId, "Goods receipt V2", filter);
        this.PopulateBudgetToCompute(operationsId, "Vendor invoice", this.FindInvoicesInError());
        //delete operation detail from failed purchase Requisition
        for (let i = 0; i < operationsId.length; i++) {
            Lib.Spending.Budget.CleanOperationDetails(operationsId[i], budgetToCompute);
        }
        //recompute all impacted budget
        for (let index in budgetToCompute) {
            const budget = {};
            budget[budgetToCompute[index]] = null;
            const criticalSectionName = Lib.Spending.Budget.budgetHandler.GetCriticalSection(budget);
            Log.Info("Try entering Budget critical section: " + criticalSectionName);
            Process.PreventConcurrentAccess(criticalSectionName, () => {
                Log.Info("Entered budget critical section");
                Lib.Spending.Budget.ComputeBudgetFromOperationDetails(budgetToCompute[index]);
            }, null, 60);
        }
        //delete operation detail from failed purchase Requisition
        for (let i = 0; i < operationsId.length; i++) {
            Lib.Spending.Budget.DeleteOperationDetails(operationsId[i]);
        }
    },
    FindInvoicesInError: function () {
        const when = new Date();
        when.setTime(when.getTime() - 86400 * 3 * 1000); // Only check 3 days old records
        return "&(State>100)(ERPInvoiceNumber__=)(InvoiceStatus__!=Rejected)(CompletionDateTime>" + Sys.Helpers.Date.Date2DBDateTime(when) + "))";
    },
    PopulateBudgetToCompute: function (operationsId, processName, filter) {
        let xTransport;
        let vars;
        // Query for old PAC version
        Log.Info("PopulateBudgetToCompute with PAC");
        Query.Reset();
        Query.SetOptionEx("Limit=-1");
        Query.SetSpecificTable("CDNAME#" + processName);
        Query.SetAttributesList("RUIDEX");
        const when = new Date();
        when.setTime(when.getTime() - 86400 * 3 * 1000); // Only check 3 days old records
        Query.SetFilter("(&(state>100)(CompletionDateTime>" + Sys.Helpers.Date.Date2DBDateTime(when) + "))");
        if (Query.MoveFirst()) {
            xTransport = Query.MoveNext();
            while (xTransport) {
                vars = xTransport.GetUninheritedVars();
                const ruidEx = vars.GetValue_String("RUIDEX", 0);
                operationsId.push(ruidEx);
                Log.Info("Check RUIDEX " + ruidEx);
                xTransport = Query.MoveNext();
            }
        }
        else {
            Log.Error(Query.GetLastErrorMessage());
        }
    }
};
const InvoicesRecoveryHelper = {
    /** Recovery for AP */
    RecoverInvoices: function () {
        this.RecoverInvoicesPostedNotExported();
    },
    FindInvoices: function (filter) {
        // [[invoicesRUIDEX, invoiceCompanyCode, deletedfromoperation][...]]
        const invoices = [];
        Query.Reset();
        Query.SetSpecificTable("CDNAME#Vendor invoice");
        Query.SetAttributesList("RUIDEX");
        Query.SetOptionEx("Limit=-1");
        Query.SetFilter(filter);
        if (Query.MoveFirst()) {
            let xTransport = Query.MoveNext();
            let vars;
            while (xTransport) {
                vars = xTransport.GetUninheritedVars();
                Log.Info("Found invoice :" + vars.GetValue_String("RUIDEX", 0) + " - " + vars.GetValue_String("CompanyCode__", 0));
                invoices.push({
                    ruidex: vars.GetValue_String("RUIDEX", 0),
                });
                xTransport = Query.MoveNext();
            }
        }
        else {
            Log.Error(Query.GetLastErrorMessage());
        }
        return invoices;
    },
    /**
     * Find invoices posted but not exported by the VIP
     */
    FindInvoicesPostedNotExported: function () {
        const when = new Date();
        when.setTime(when.getTime() - 86400 * 3 * 1000); // Only check 3 days old records
        return this.FindInvoices("(&(BudgetExportStatus__!=success)(BudgetExportStatus__!=ignored)(ERPInvoiceNumber__!=)(CompletionDateTime>" + Sys.Helpers.Date.Date2DBDateTime(when) + "))");
    },
    /**
     * Recreate operations and compute budget for all invoices posted but not exported
     */
    RecoverInvoicesPostedNotExported: function () {
        Log.Info("start RecoverInvoicesPostedNotExported");
        // [[invoicesRUIDEX,invoiceCompanyCode][...]]
        const invoices = this.FindInvoicesPostedNotExported();
        /** Recover invoices */
        for (let i = 0; i < invoices.length; i++) {
            Lib.Spending.Budget.RecreateOperationDetails(invoices[i].ruidex);
        }
    },
    /**
     * Get the concurrent access and call the callback with Invoices
     */
    ProcessConcurrentAccess: function (invoice, callback) {
        const criticalSectionName = "PAC_Budget_" + Process.GetProcessID(Lib.P2P.GetPRProcessName()) + "_" + invoice.companyCode;
        return Process.PreventConcurrentAccess(criticalSectionName, () => {
            Log.Info("Entered budget critical section");
            callback(invoice);
        }, () => {
            Log.Info("Entered budget recovery section");
        }, 60);
    }
};
if (Data.GetActionName() === "Approve" || (Data.GetActionName() === "" && Lib.Spending.Budget.budgetHandler.IsEnabled())) {
    Process.SetTimeOut(3600);
    /** Budget recovery */
    RecoveryHelper.Recover();
    /** AP budget recovery */
    InvoicesRecoveryHelper.RecoverInvoices();
}
//# sourceMappingURL=validationscript.js.map