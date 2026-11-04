"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ExtractionScript;
(function (ExtractionScript) {
    async function Main() {
        function set24HoursExpiration() {
            Data.SetValue("ValidityDateTime", new Date(new Date().setHours(new Date().getHours() + 24)));
        }
        function InitDefaultValues() {
            Data.SetValue("Recurrence__", "Monthly");
            Data.SetValue("RecurringAmount__", "");
            Data.SetValue("ApproveTolerance__", true);
            Data.SetValue("SelfBilling__", false);
        }
        async function fillFieldsFromExternalVariables() {
            if (Variable.GetValueAsString("InvoiceType__")) // if from VIP
             {
                fillFieldsFromVIPExternalVariables();
                if (Data.GetValue("ContractReferenceNumber__")) {
                    await fillFieldsFromQueryContract();
                }
            }
            else // from Contract
             {
                fillFieldsFromContractExternalVariables();
            }
        }
        function fillFieldsFromVIPExternalVariables() {
            const fieldsMapping = {
                "OriginalContractRUIDEX__": "OriginalContractRUIDEX__",
                "ContractNumber__": "ContractNumber__",
                "ContractReferenceNumber__": "ContractReferenceNumber__",
                "CompanyCode__": "CompanyCode__",
                "VendorNumber__": "VendorNumber__",
                "VendorName__": "VendorName__",
                "Currency__": "InvoiceCurrency__",
                "RecurringAmount__": "NetAmount__"
            };
            Object.keys(fieldsMapping).forEach(key => {
                Data.SetValue(key, Variable.GetValueAsString(fieldsMapping[key]));
            });
            const startDate = Sys.Helpers.Date.ISOSTringToDate(Variable.GetValueAsString("InvoiceDate__"));
            Data.SetValue("StartDate__", startDate);
            // Fetch cost center from invoice lines
            const invoiceMsnex = Data.GetValue("SourceRUID").split(".")[1];
            Log.Info(`Fetch cost center from invoice ${invoiceMsnex}`);
            const invoiceLineItems = Sys.Helpers.CDL.getCDLRecords({
                processID: Data.GetValue("ParentProcessId"), // Vendor Invoice process
                tableName: "LineItems__",
                sourceMSNEXs: [invoiceMsnex],
                fields: [
                    "LineNum",
                    "Line_CostCenter__",
                    "Line_CCDescription__"
                ],
                orderBy: "LineNum"
            });
            if (invoiceLineItems && invoiceLineItems[invoiceMsnex]) {
                const firstLineItem = invoiceLineItems[invoiceMsnex][0];
                if (firstLineItem && firstLineItem.Line_CostCenter__) {
                    Data.SetValue("CostCenter__", firstLineItem.Line_CostCenter__);
                    Data.SetValue("CostCenterDescription__", firstLineItem.Line_CCDescription__);
                }
            }
        }
        async function fillFieldsFromQueryContract() {
            var _a;
            Log.Info("fillFieldsFromQueryContract");
            const _queryVars = (filter) => {
                const query = Process.CreateQueryAsProcessAdmin();
                query.Reset();
                query.SetSpecificTable("CDNAME#P2P - Contract");
                query.SetFilter(filter.toString());
                query.SetAttributesList("ArchiveDuration, StartDate__, EndDate__, OriginalContractRUIDEX__");
                query.SetSearchInArchive(true);
                if (query.MoveFirst()) {
                    let record = query.MoveNext();
                    return record === null || record === void 0 ? void 0 : record.GetUninheritedVars();
                }
            };
            let vars;
            if (Data.GetValue("OriginalContractRUIDEX__")) {
                const contract = await Lib.Contract.Amendment.GetToUseVersion(Data.GetValue("OriginalContractRUIDEX__"));
                vars = (_a = contract === null || contract === void 0 ? void 0 : contract.record) === null || _a === void 0 ? void 0 : _a.GetVars();
            }
            // if !vars, upgrade issue, OriginalContractRUIDEX__ not set on contract
            if (!vars) {
                vars = _queryVars(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("ReferenceNumber__", Data.GetValue("ContractReferenceNumber__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__"))));
            }
            if (vars) {
                Data.SetValue("OriginalContractRUIDEX__", vars.GetValue_String("OriginalContractRUIDEX__", 0));
                Data.SetValue("ArchiveDuration", vars.GetValue_Long("ArchiveDuration", 0));
                Data.SetValue("EndDate__", vars.GetValue_Date("EndDate__", 0));
                // Process variable start date and end date are contract start and end dates
                Variable.SetValueAsString("StartDate__", Sys.Helpers.Date.Date2DBDate(vars.GetValue_Date("StartDate__", 0)));
                Variable.SetValueAsString("EndDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("EndDate__")));
                Variable.SetValueAsString("OriginalContractRUIDEX__", vars.GetValue_String("OriginalContractRUIDEX__", 0));
                Variable.SetValueAsString("ArchiveDurationInMonths__", vars.GetValue_Long("ArchiveDuration", 0));
            }
        }
        function fillFieldsFromContractExternalVariables() {
            Log.Info("fillFieldsFromContractExternalVariables");
            const fieldsMapping = {
                "OriginalContractRUIDEX__": "OriginalContractRUIDEX__",
                "ContractNumber__": "ContractNumber__",
                "ContractReferenceNumber__": "ReferenceNumber__",
                "ArchiveDuration": "ArchiveDurationInMonths__",
                "StartDate__": "StartDate__",
                "EndDate__": "EndDate__",
                "CompanyCode__": "CompanyCode__",
                "VendorNumber__": "VendorNumber__",
                "VendorName__": "VendorName__"
            };
            Object.keys(fieldsMapping).forEach(key => {
                Data.SetValue(key, Variable.GetValueAsString(fieldsMapping[key]));
            });
            Data.SetValue("Currency__", Lib.P2P.ExchangeRate.GetCompanyCodeCurrency(Variable.GetValueAsString("CompanyCode__")));
        }
        set24HoursExpiration();
        InitDefaultValues();
        await fillFieldsFromExternalVariables();
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.BillingSchedule.OnExtractionScriptEnd");
        Lib.P2P.BillingSchedule.PopulateBillingScheduleInstallmentTable();
    }
    ExtractionScript.Main = Main;
    Lib.P2P.HandleScriptError(Main());
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map