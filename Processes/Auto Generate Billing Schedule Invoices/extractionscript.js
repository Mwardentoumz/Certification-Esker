"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ExtractionScript;
(function (ExtractionScript) {
    function GetBillingSchedule() {
        const query = Process.CreateQueryAsProcessAdmin();
        query.Reset();
        query.SetSpecificTable(Lib.P2P.BillingSchedule.BillingScheduledFormName);
        query.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("SelfBilling__", "1"), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("BillingScheduleStatus__", Lib.P2P.BillingSchedule.BillingScheduleState.Approved), Sys.Helpers.LdapUtil.FilterEqual("BillingScheduleStatus__", Lib.P2P.BillingSchedule.BillingScheduleState.ToApprove)), Sys.Helpers.LdapUtil.FilterLesserOrEqual("StartDate__", Sys.Helpers.Date.Date2DBDate(new Date())), Sys.Helpers.LdapUtil.FilterGreaterOrEqual("EndDate__", Sys.Helpers.Date.Date2DBDate(new Date()))).toString());
        query.SetAttributesList("RuidEx, CompanyCode__, CostCenter__");
        query.SetSearchInArchive(true);
        let BillingScheduleList = {};
        if (query.MoveFirst()) {
            let record = query.MoveNext();
            while (record) {
                const vars = record.GetUninheritedVars();
                BillingScheduleList[vars.GetValue_String("RuidEx", 0)] =
                    {
                        "costCenter": vars.GetValue_String("CostCenter__", 0),
                        "companyCode": vars.GetValue_String("CompanyCode__", 0)
                    };
                record = query.MoveNext();
            }
        }
        return BillingScheduleList;
    }
    function GetBillingScheduleLineRecord(BillingScheduleInfo) {
        let RUIDList = [];
        Object.keys(BillingScheduleInfo).forEach(key => {
            RUIDList.push(key);
        });
        return Sys.Helpers.Promise.Create(function (resolve) {
            Sys.GenericAPI.PromisedQuery({
                table: Lib.P2P.BillingSchedule.BillingScheduledItemsTable,
                filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("BillingDate__", Sys.Helpers.Date.Date2DBDate(new Date())), Sys.Helpers.LdapUtil.FilterIn("BillingScheduleRUIDEX__", RUIDList)).toString(),
                attributes: ["*"],
                maxRecords: 100,
                additionalOptions: {
                    useConstantQueryCache: true
                }
            }).Then((tableResult) => {
                let BillingScheduleParamList = [];
                if (tableResult && tableResult.length > 0) {
                    for (let billingScheduleTable of tableResult) {
                        BillingScheduleParamList.push({
                            companyCode: billingScheduleTable.CompanyCode__,
                            vendorNumber: billingScheduleTable.VendorNumber__,
                            contractReferenceNumber: billingScheduleTable.ContractReferenceNumber__,
                            contractNumber: billingScheduleTable.ContractNumber__,
                            billingScheduleID: billingScheduleTable.BillingSchedule__,
                            billingScheduleDescription: billingScheduleTable.Description__,
                            billingScheduleInstallmentNumber: billingScheduleTable.Installment__,
                            billingScheduleInstallmentDate: billingScheduleTable.BillingDate__,
                            billingScheduleInstallmentLocalNetAmount: billingScheduleTable.Amount__,
                            invoiceLocalNetAmount: billingScheduleTable.Amount__,
                            invoiceDate: billingScheduleTable.BillingDate__,
                            isSelfBillingInvoice: true,
                            nonPOAssignmentTemplate: []
                        });
                    }
                }
                resolve(BillingScheduleParamList);
            });
        });
    }
    function CallVendorInvoiceGenerator(billingScheduleParameters) {
        let nextProcess = Process.CreateProcessInstance(Lib.AP.VendorInvoice.Generator.ProcessName, false);
        const nextprocessExternalVars = nextProcess.GetExternalVars();
        const nextProcessExternalVars = Lib.AP.VendorInvoice.Generator.GetBillingScheduleToPDFProcessVariables(billingScheduleParameters, "JSON");
        for (let key in nextProcessExternalVars) {
            if (Object.prototype.hasOwnProperty.call(nextProcessExternalVars, key)) {
                nextprocessExternalVars.AddValue_String(key, nextProcessExternalVars[key], true);
            }
        }
        nextProcess.Process();
    }
    function Main() {
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.BillingSchedule.AutoGenerateBillingSchedule.OnExtractionScriptBegin");
        const BillingScheduleInfo = GetBillingSchedule();
        if (BillingScheduleInfo) {
            return GetBillingScheduleLineRecord(BillingScheduleInfo)
                .Then((BillingScheduleParamList) => {
                if (BillingScheduleParamList && BillingScheduleParamList.length > 0) {
                    for (let billingScheduleParam of BillingScheduleParamList) {
                        CallVendorInvoiceGenerator(billingScheduleParam);
                    }
                    return Sys.Helpers.Promise.Resolve(BillingScheduleParamList.length);
                }
                return Sys.Helpers.Promise.Reject("No matching Billing Schedule record found");
            });
        }
        return Sys.Helpers.Promise.Reject("No matching Billing Schedule process found");
    }
    ExtractionScript.Main = Main;
    Main()
        .Then((result) => {
        Log.Info("Number of invoices generated: " + result);
    })
        .Catch((error) => {
        Log.Error(error);
    });
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map