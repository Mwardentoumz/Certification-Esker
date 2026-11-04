"use strict";
/**
 * Upate the field RelatedInvoice__ to display an anchor link to the invoice and store the ruidex if necessary
 * @param invoiceLinkedRuidex the ruidex of the related invoice
 * @param updateValues flag to store the related invoice ruidex
 */
function updateRelatedInvoiceLink(invoiceLinkedRuidex, updateValues = true) {
    if (invoiceLinkedRuidex) {
        Controls.RelatedInvoice__.SetReadOnly(true);
        let displayAsOptions = { type: "Link" };
        if (!Controls.RelatedInvoice__.GetValue()) {
            displayAsOptions.text = Data.GetValue("InvoiceNumber__");
        }
        Controls.RelatedInvoice__.DisplayAs(displayAsOptions);
        const openMessageParams = {
            ruidEx: invoiceLinkedRuidex,
            goBackOnQuit: false,
            inNewTab: true,
            additionalParameters: {
                OnQuit: "CleanAndClose"
            }
        };
        Controls.RelatedInvoice__.OnClick = function () {
            Process.OpenMessage(openMessageParams);
        };
    }
    else {
        if (updateValues) {
            Controls.RelatedInvoice__.SetValue("");
        }
        Controls.RelatedInvoice__.DisplayAs();
        Controls.RelatedInvoice__.OnClick = () => void 0;
        Controls.RelatedInvoice__.SetReadOnly(false);
        Controls.RelatedInvoice__.SetBrowsable(true);
        Controls.RelatedInvoice__.SetRemovable(false);
    }
    if (updateValues) {
        Controls.InvoiceRuidEx__.SetValue(invoiceLinkedRuidex);
    }
}
/**
 * Event: handle the selection of item when browsing RelatedInvoice__
 * @param item Selected item
 */
function onRelatedInvoiceSelectItem(item) {
    if (item) {
        updateRelatedInvoiceLink(item.GetValue("RuidEx"), true);
    }
    else {
        Log.Error("onRelatedInvoiceSelectItem called with a null item");
    }
}
/**
 * Event: handle the manual change of RelatedInvoice__
 */
function onRelatedInvoiceChange() {
    if (!Controls.InvoiceRuidEx__.GetValue() && Controls.RelatedInvoice__.GetValue()) {
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceNumber__", Data.GetValue("RelatedInvoice__"))).toString();
        Sys.GenericAPI.PromisedQuery({
            table: "CDNAME#Vendor invoice",
            filter: filter,
            attributes: ["RuidEx", "InvoiceNumber__", "OwnerID"],
            maxRecords: 10,
            additionalOptions: {
                searchInArchive: true,
                queryOptions: "FastSearch=1"
            }
        }).Then((queryResults) => {
            if (queryResults && queryResults.length > 0) {
                if (queryResults.length === 1) {
                    updateRelatedInvoiceLink(queryResults[0].RuidEx, true);
                }
                else {
                    Controls.RelatedInvoice__.SetWarning(Language.Translate("_Several invoices matching warning"));
                }
            }
            else {
                Controls.RelatedInvoice__.SetWarning(Language.Translate("_No matching invoice warning"));
            }
        });
    }
}
/**
 * Initialize the RelatedInvoice__ combobox setting required attributes (ruidex) and search criterii
 */
function initializeRelatedInvoiceDatabaseComboBox() {
    function queryForAutoComplete(callback, table, attributes, filter, sort, maxRecords) {
        const filterWithVendorNumber = Sys.Helpers.LdapUtil.FilterAnd(filter, Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__"))).toString();
        const promiseOptions = {
            table: table,
            filter: filterWithVendorNumber,
            attributes: attributes.split("|"),
            sortOrder: sort,
            maxRecords: maxRecords
        };
        const promise = Sys.GenericAPI.PromisedQuery(promiseOptions).Then(queryResult => {
            return queryResult;
        });
        callback(promise);
    }
    const getCustomizeFieldFunc = (fieldName) => {
        return function (searchField) {
            searchField.SetValue(Controls[fieldName].GetValue());
        };
    };
    // Customize autocomplete query, to add filter on VendorNumber__
    let configSharedBetweenQueries = {};
    Controls.RelatedInvoice__.SetCustomQuery(null, null, queryForAutoComplete, configSharedBetweenQueries);
    // Customize browse window and prefill VendorNumber__
    Controls.RelatedInvoice__.ClearSearchFields();
    Controls.RelatedInvoice__.AddSearchField({
        type: "Text",
        label: "_Invoice number",
        id: "InvoiceNumber__",
        customize: getCustomizeFieldFunc("RelatedInvoice__")
    });
    Controls.RelatedInvoice__.AddSearchField({
        type: "Text",
        label: "_Vendor number",
        id: "VendorNumber__",
        customize: getCustomizeFieldFunc("VendorNumber__")
    });
    // Customize filter and add RuidEx field retrieval
    Controls.RelatedInvoice__.SetAttributes("RuidEx|OwnerID");
    const ruidex = Data.GetValue("RuidEx");
    const filter = Sys.Helpers.LdapUtil.FilterAnd(Controls.RelatedInvoice__.GetCustomFilter(false), Sys.Helpers.LdapUtil.FilterNot(Sys.Helpers.LdapUtil.FilterEqual("RuidEx", ruidex))).toString();
    Controls.RelatedInvoice__.SetFilter(filter);
}
/**
 * Main function that should be run first
 */
function run() {
    Controls.RelatedInvoice__.OnSelectItem = onRelatedInvoiceSelectItem;
    Controls.RelatedInvoice__.OnChange = onRelatedInvoiceChange;
    initializeRelatedInvoiceDatabaseComboBox();
    // ensure the update comes after dom loading
    setTimeout(() => updateRelatedInvoiceLink(Data.GetValue("InvoiceRuidEx__"), false));
}
run();
//# sourceMappingURL=customscript.js.map