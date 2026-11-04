"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var extractionscript;
(function (extractionscript) {
    function Run() {
        InvoiceLoadingHelper.Load();
        ForwardToAP();
    }
    function ForwardToAP() {
        const apUserLogin = Lib.AP.VendorPortal.GetDefaultApUserLogin();
        if (!apUserLogin) {
            Log.Error("Cannot retrieve default AP clerk");
            return;
        }
        Log.Info("Forwarding to " + apUserLogin);
        Process.Forward(apUserLogin);
    }
    let InvoiceLoadingHelper;
    (function (InvoiceLoadingHelper) {
        let discountInfos = {};
        function parseDiscountInfosFromPreviousProcess() {
            const discountInfosAsString = Variable.GetValueAsString("InvoicesDiscountInfo");
            try {
                const discountInfosAsJSON = JSON.parse(discountInfosAsString);
                discountInfos = Sys.Helpers.Array.Reduce(discountInfosAsJSON, (acc, item) => {
                    acc[item.RUIDEX__] = item;
                    return acc;
                }, {});
            }
            catch (exception) {
                Log.Error(`Could not parse variable InvoicesDiscountInfo as JSON: ${exception}`);
            }
        }
        function fillHeaderFields(firstInvoice) {
            const headerFields = [
                "CompanyCode__",
                "VendorNumber__",
                "VendorName__"
            ];
            for (const field of headerFields) {
                Data.SetValue(field, firstInvoice[field]);
            }
        }
        function getInvoiceList() {
            const ancestorRuids = Variable.GetValueAsString("AncestorsRuid");
            if (ancestorRuids) {
                return ancestorRuids.split("|");
            }
            return [];
        }
        function buildLDAPFilter(ruidExList) {
            const filters = [];
            for (const ruidex of ruidExList) {
                filters.push(Sys.Helpers.LdapUtil.FilterEqual("PortalRuidEx__", ruidex));
            }
            return Sys.Helpers.LdapUtil.FilterOr(...filters).toString();
        }
        function addLine(item, result) {
            // Consolidate query result with discount infos from previous process (Early payment request)
            if (result.PortalRuidEx__) {
                const discountInfo = discountInfos[result.PortalRuidEx__];
                if (discountInfo) {
                    result.ProposedInvoiceDiscountRate__ = discountInfo.Discount_rate__;
                    result.ProposedInvoiceDiscountAmount__ = discountInfo.Discount_amount__;
                    result.ProposedInvoiceAmountWithDiscount__ = discountInfo.InvoiceAmountWithDiscount__;
                    result.PaymentTermDayLimit__ = discountInfo.PaymentTermDayLimit__;
                    result.Remaining__ = discountInfo.Remaining__;
                }
            }
            for (const attribute in result) {
                if (Object.prototype.hasOwnProperty.call(result, attribute)) {
                    const fieldName = attribute === "RUIDEx" ? "RUIDEx__" : attribute;
                    item.SetValue(fieldName, result[attribute]);
                }
            }
            // Each item is selected by default
            item.SetValue("IsSelected__", true);
        }
        function Load() {
            const ruidExList = getInvoiceList();
            if (!ruidExList || ruidExList.length <= 0) {
                return;
            }
            parseDiscountInfosFromPreviousProcess();
            const filter = buildLDAPFilter(ruidExList);
            const fields = [
                "RUIDEx",
                "CompanyCode__",
                "VendorNumber__",
                "VendorName__",
                "PortalRuidEx__",
                "DueDate__",
                "InvoiceAmount__",
                "InvoiceCurrency__",
                "InvoiceDate__",
                "InvoiceNumber__",
                "OrderNumber__",
                "PostingDate__"
            ];
            Sys.GenericAPI.PromisedQuery({
                table: "CDNAME#Vendor invoice",
                filter: filter,
                attributes: fields,
                maxRecords: 500,
                additionalOptions: {
                    useConstantQueryCache: true,
                    asAdmin: true,
                    searchInArchive: false
                }
            })
                .Then(function (results) {
                if (!results || !results.length) {
                    Log.Error(`addInvoice - Invoice not found with filter ${filter}`);
                }
                else {
                    // Fill hearder fields (from the first invoice)
                    fillHeaderFields(results[0]);
                    // Fill table
                    for (const result of results) {
                        const newItem = Data.GetTable("Invoices__").AddItem(true);
                        if (newItem) {
                            addLine(newItem, result);
                        }
                    }
                }
            })
                .Catch(function (error) {
                Log.Error(`addInvoice - Error when retrieving invoice: ${error}`);
            });
        }
        InvoiceLoadingHelper.Load = Load;
    })(InvoiceLoadingHelper || (InvoiceLoadingHelper = {}));
    Run();
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map