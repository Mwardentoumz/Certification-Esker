"use strict";
const BalancingLineItem = {
    isRemovable: function (item) {
        return !item.GetValue("Amount__") || item.GetValue("Amount__") === 0;
    }
};
const ButtonsBehavior = {
    init: function () {
        Controls.ClearInvoices.OnClick = ButtonsBehavior.onclickClearInvoices;
    },
    // actions
    onclickClearInvoices: function () {
        ButtonsBehavior.removeEmptyBalancingItems();
        // always return false to let the validation script fire the preventApproval or not
        return false;
    },
    // helpers
    removeEmptyBalancingItems: function () {
        const BalancingItemsTable = Data.GetTable("BalancingLineItems__");
        let i = 0;
        while (i < BalancingItemsTable.GetItemCount()) {
            const item = BalancingItemsTable.GetItem(i);
            if (BalancingLineItem.isRemovable(item)) {
                item.Remove();
            }
            else {
                i++;
            }
        }
        if (Data.GetTable("LineItems__").GetItemCount() > 0) {
            ProcessInstance.Approve("ClearInvoices");
        }
    }
};
const EventHandlers = {
    init: function () {
        Controls.BalancingLineItems__.GLAccount__.OnChange = EventHandlers.onGLAccountChange;
        Controls.BalancingLineItems__.CostCenter__.OnChange = EventHandlers.onCostCenterChange;
        Controls.LineItems__.OnRefreshRow = EventHandlers.onRefreshRow;
        Controls.BalancingLineItems__.OnAddItem = EventHandlers.onAddItem;
        Controls.BalancingLineItems__.OnDeleteItem = EventHandlers.onDeleteItem;
        Controls.BalancingLineItems__.Amount__.OnChange = EventHandlers.onChangeAmount;
        Controls.BalancingLineItems__.TaxCode__.OnChange = EventHandlers.onChangeTaxCode;
        EventHandlers.initGlRow(Controls.BalancingLineItems__.GetItem(0));
    },
    // actions
    onCostCenterChange: function () {
        const item = this.GetItem();
        const param = EventHandlers.getFillCCSAPParameters(item);
        Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, param);
    },
    onGLAccountChange: function () {
        const item = this.GetItem();
        const param = EventHandlers.getFillGLSAPParameters(item);
        Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, param);
    },
    onRefreshRow: function (index) {
        const row = this.GetRow(index);
        row.DocumentNumber__.DisplayAs({ type: "Link" });
    },
    onAddItem: function (item) {
        EventHandlers.initGlRow(item);
    },
    onDeleteItem: function () {
        EventHandlers.computeAmount();
    },
    onChangeAmount: function () {
        const item = this.GetItem();
        if (item && item.GetValue("LineType__") === Lib.P2P.LineType.GL && item.GetValue("TaxCode__")) {
            Lib.AP.GetInvoiceDocument().GetTaxRate(item, updateItemWithTaxRate, onErrorWithTaxCode, null);
            return;
        }
        EventHandlers.computeAmount();
    },
    onChangeTaxCode: function () {
        const item = this.GetItem();
        if (item.GetValue("TaxCode__")) {
            Lib.AP.GetInvoiceDocument().GetTaxRate(item, updateItemWithTaxRate, onErrorWithTaxCode, null);
            return;
        }
        updateItemWithTaxRate(item, 0);
    },
    //helpers
    initGlRow: function (item) {
        if (ProcessInstance.isReadOnly) {
            const BalancingItemsTable = Data.GetTable("BalancingLineItems__");
            if (BalancingItemsTable.GetItemCount() === 1) {
                Controls.GL_lines_adjustment_pane.Hide(BalancingLineItem.isRemovable(BalancingItemsTable.GetItem(0)));
            }
        }
        else {
            item.SetValue("LineType__", Lib.P2P.LineType.GL);
            if (!item.GetValue("TaxAmount__")) {
                item.SetValue("TaxAmount__", 0.00);
            }
            if (!item.GetValue("Amount__")) {
                item.SetValue("Amount__", 0.00);
            }
        }
    },
    computeAmount: function () {
        let balance = 0.0, totalAmount = 0.0, totalNetAmount = 0.0;
        for (let i = 0; i < Controls.LineItems__.GetItemCount(); i++) {
            const item = Controls.LineItems__.GetItem(i);
            totalNetAmount += parseFloat(item.GetValue("NetAmount__"));
            totalAmount += parseFloat(item.GetValue("Amount__"));
        }
        for (let i = 0; i < Controls.BalancingLineItems__.GetItemCount(); i++) {
            const item = Controls.BalancingLineItems__.GetItem(i);
            if (item.GetValue("Amount__")) {
                totalNetAmount += parseFloat(item.GetValue("Amount__"));
                totalAmount += parseFloat(item.GetValue("Amount__"));
            }
            if (item.GetValue("TaxAmount__")) {
                totalAmount += parseFloat(item.GetValue("TaxAmount__"));
            }
        }
        Data.SetValue("InvoiceNetAmount__", totalNetAmount);
        Data.SetValue("InvoiceAmount__", totalAmount);
        const assignedAmount = Controls.AssignedAmount__.GetValue();
        balance = totalAmount - assignedAmount;
        balance = Sys.Helpers.Round(balance, 2);
        Controls.Balance__.SetValue(balance);
        if (balance !== 0.00) {
            Controls.Balance__.SetError("");
            Controls.Balance__.SetWarning("_Balance is not null");
        }
        else {
            Controls.Balance__.SetError("");
            Controls.Balance__.SetWarning("");
        }
    },
    getGLAccountDescription: function (GLAcctId, callback, companyCode) {
        Lib.P2P.Browse.GetGlAccountDescription(callback, companyCode, GLAcctId, "AP");
    },
    getFillGLSAPParameters: function (item) {
        return {
            value: item.GetValue("GLAccount__"),
            formCodeField: "GLAccount__",
            formDescriptionField: "GLDescription__",
            companyCode: Data.GetValue("CompanyCode__"),
            getFunction: EventHandlers.getGLAccountDescription
        };
    },
    getCostCenterDescriptionFromId: function (CCId, callback, companyCode) {
        Lib.P2P.Browse.GetCostCenterDescription(callback, companyCode, CCId, "AP");
    },
    getFillCCSAPParameters: function (item) {
        return {
            value: item.GetValue("CostCenter__"),
            formCodeField: "CostCenter__",
            formDescriptionField: "CCDescription__",
            companyCode: Data.GetValue("CompanyCode__"),
            getFunction: EventHandlers.getCostCenterDescriptionFromId
        };
    }
};
function updateLayout() {
    // When table is already filled force to display Document Number as Links
    for (let i = 0; i < Controls.LineItems__.GetLineCount(); ++i) {
        setVendorLineLayout(i);
    }
    for (let i = 0; i < Controls.BalancingLineItems__.GetLineCount(); ++i) {
        setGLLineLayout(i);
    }
    Controls.LineItems__.DocumentNumber__.OnClick = function () {
        Process.OpenLink(this.GetRow().ValidationURL__.GetValue());
    };
    if (ProcessInstance.isReadOnly) {
        Controls.ClearInvoicesComment__.Hide(true);
    }
    else {
        Controls.ClearInvoicesComment__.SetPlaceholder(Language.Translate("_Enter your comment..."));
    }
}
/**
 * Query callback
 * @this QueryResult
 */
function getConsignmentDocumentsCallback() {
    let addingLines = false;
    if (!this) {
        Log.Error("The request does not return any record, reset AncestorsRuid Variable");
        Variable.SetValueAsString("AncestorsRuid", "");
    }
    else {
        const err = this.GetQueryError();
        if (err) {
            Log.Error("Query in error : " + err);
            Variable.SetValueAsString("AncestorsRuid", "");
        }
        else if (this.GetRecordsCount() === 0) {
            Log.Info("Query does not return any record...");
            Variable.SetValueAsString("AncestorsRuid", "");
        }
        else {
            const currentConfiguration = Variable.GetValueAsString("Configuration");
            Controls.LineItems__.SetItemCount(0);
            const firstVendorNumber = this.GetQueryValue("VendorNumber__", 0);
            const firstCompanyCode = this.GetQueryValue("CompanyCode__", 0);
            const firstInvoiceCurrency = this.GetQueryValue("InvoiceCurrency__", 0);
            const firstConfiguration = this.GetQueryValue("Configuration__", 0);
            Data.SetValue("VendorNumber__", firstVendorNumber);
            Data.SetValue("CompanyCode__", firstCompanyCode);
            Data.SetValue("InvoiceCurrency__", firstInvoiceCurrency);
            Variable.SetValueAsString("Configuration", firstConfiguration || "Default");
            addingLines = true;
            if (currentConfiguration !== Variable.GetValueAsString("Configuration")) {
                Variable.SetValueAsString("SAPConfiguration", "");
                Lib.P2P.ChangeConfiguration(Variable.GetValueAsString("Configuration"))
                    .Then(() => {
                    initFromConfiguration();
                    AddLineItems(this, firstVendorNumber, firstCompanyCode, firstInvoiceCurrency, firstConfiguration);
                });
            }
            else {
                AddLineItems(this, firstVendorNumber, firstCompanyCode, firstInvoiceCurrency, firstConfiguration);
            }
        }
    }
    if (!addingLines) {
        Controls.ERPInvoiceNumber__.Wait(false);
        Controls.LineItems__.GetRow(0).DocumentNumber__.SetError("_No settlement document found");
    }
}
function AddLineItems(queryResult, firstVendorNumber, firstCompanyCode, firstInvoiceCurrency, firstConfiguration) {
    const validRuidExs = [];
    const settlements = [];
    let fiscalYear = "";
    Controls.LineItems__.SetItemCount(0);
    for (let i = 0; i < queryResult.GetRecordsCount(); ++i) {
        const vendorNumber = queryResult.GetQueryValue("VendorNumber__", i);
        const companyCode = queryResult.GetQueryValue("CompanyCode__", i);
        const documentNumber = queryResult.GetQueryValue("ERPInvoiceNumber__", i);
        const invoiceCurrency = queryResult.GetQueryValue("InvoiceCurrency__", i);
        const configuration = queryResult.GetQueryValue("Configuration__", i);
        if (firstVendorNumber === vendorNumber &&
            firstCompanyCode === companyCode &&
            firstInvoiceCurrency === invoiceCurrency &&
            firstConfiguration === configuration) {
            const item = Controls.LineItems__.AddItem(false);
            item.SetValue("LineType__", "Vendor");
            item.SetValue("DocumentNumber__", documentNumber);
            item.SetValue("NetAmount__", queryResult.GetQueryValue("NetAmount__", i));
            item.SetValue("Amount__", queryResult.GetQueryValue("InvoiceAmount__", i));
            item.SetValue("Currency__", queryResult.GetQueryValue("InvoiceCurrency__", i));
            item.SetValue("TaxAmount__", queryResult.GetQueryValue("TaxAmount__", i));
            item.SetValue("ValidationURL__", queryResult.GetQueryValue("ValidationURL", i));
            item.SetValue("InvoiceDate__", queryResult.GetQueryValue("InvoiceDate__", i));
            item.SetValue("PostingDate__", queryResult.GetQueryValue("PostingDate__", i));
            item.SetValue("InvoiceDescription__", queryResult.GetQueryValue("InvoiceDescription__", i));
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnFillClearingLineItem", item, queryResult, i);
            validRuidExs.push(`CD#${queryResult.GetQueryValue("ProcessID", i)}.${queryResult.GetQueryValue("MsnEx", i)}`);
            if (documentNumber) {
                const invoiceDocument = Lib.AP.ParseInvoiceDocumentNumber(documentNumber, true);
                const settlement = invoiceDocument.documentNumber;
                settlements.push(settlement);
                fiscalYear = invoiceDocument.fiscalYear;
            }
        }
        else {
            Log.Warn(`The document ${documentNumber} has been ignored`);
        }
    }
    setTimeout(function () {
        for (let i = 0; i < Controls.LineItems__.GetLineCount(); ++i) {
            Controls.LineItems__.GetRow(i).DocumentNumber__.DisplayAs({ type: "Link" });
        }
    });
    if (validRuidExs.length < queryResult.GetRecordsCount()) {
        const errorMessage = Language.Translate(queryResult.GetRecordsCount() - validRuidExs.length === 1 ? "_ignored consignment invoices_sing" : "_ignored consignment invoices", false, queryResult.GetRecordsCount() - validRuidExs.length, firstVendorNumber, firstCompanyCode, firstInvoiceCurrency, firstConfiguration);
        Popup.Alert(errorMessage, false, null, "_ignored consignment invoices popup title");
    }
    const fields = "WRBTR|BELNR|GJAHR|BUKRS|LIFNR|WAERS";
    let filters;
    if (settlements.length > 0) {
        if (settlements.length > 1) {
            filters = `( BELNR = '${settlements.join("' OR BELNR = '")}' )`;
        }
        else {
            filters = `BELNR = '${settlements[0]}'`;
        }
        filters += ` AND GJAHR = '${fiscalYear}' AND BUKRS = '${firstCompanyCode}' AND LIFNR = '${Sys.Helpers.String.SAP.NormalizeID(Sys.Helpers.String.SAP.Trim(firstVendorNumber), 10)}'`;
        Log.Info("Filters : " + filters);
        Lib.AP.SAP.SAPQuery(setAssignedAmount, Variable.GetValueAsString("SAPConfiguration"), "BSIK", fields, filters, 100, 0, false);
    }
    else {
        // no settlement, no clearing possible
        Controls.ERPInvoiceNumber__.Wait(false);
    }
    setInvoicestoClearCountText(validRuidExs.length);
    Variable.SetValueAsString("AncestorsRuid", validRuidExs.join("|"));
    flagAncestorsRuidAsLoaded();
}
/**
 * SAPQuery Callback
 * @this SAPQueryResult
 */
function setAssignedAmount() {
    const results = this.GetQueryValue();
    if (results.ERRORS && results.ERRORS.length > 0) {
        for (const error of results.ERRORS) {
            Log.Info("Query in error : " + error);
        }
    }
    else if (results.Records && results.Records.length > 0) {
        Log.Info(`Query returned ${results.Records.length} records`);
        let sum = 0;
        for (let i = 0; i < results.Records.length; i++) {
            sum += parseFloat(this.GetQueryValue("WRBTR", i));
        }
        Data.SetValue("AssignedAmount__", sum);
        Data.SetValue("SAPCurrency__", this.GetQueryValue("WAERS", 0));
        EventHandlers.computeAmount();
    }
    /*
    else
    {
        // no valid settlement, no clearing possible
    }
    */
    Controls.ERPInvoiceNumber__.Wait(false);
}
function getMsnExsFromRuidExs() {
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
        if (ancestor.length > 3 && "CD#" === ancestor.substr(0, 3)) {
            const currentProcessId = ancestor.substr(3, ancestor.indexOf(".") - 3);
            const msnEx = ancestor.substr(ancestor.indexOf(".") + 1);
            if (!result.processid) {
                result.processid = currentProcessId;
            }
            if (currentProcessId === result.processid) {
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
function ancestorsRuidLoaded() {
    return Variable.GetValueAsString("AncestorsRuidLoaded") === "1";
}
function flagAncestorsRuidAsLoaded() {
    Variable.SetValueAsString("AncestorsRuidLoaded", "1");
}
function setInvoicestoClearCountText(itemCount) {
    if (itemCount <= 0) {
        Controls.InvoicesToClearCount__.SetText("_NoInvoiceToClearCountLabel");
    }
    else {
        Controls.InvoicesToClearCount__.SetText("_InvoicesToClearCountLabel", itemCount);
    }
}
function isDocumentCleared() {
    return Boolean(Controls.ERPInvoiceNumber__.GetValue());
}
function queryAncestorsAndfillForm(ancestors) {
    const attributesArray = [
        "MsnEx", "ProcessId", "ValidationURL",
        "Configuration__", "VendorNumber__", "InvoiceStatus__",
        "CompanyCode__", "InvoiceCurrency__", "LineType__",
        "ERPInvoiceNumber__", "ItemNumber__", "NetAmount__",
        "InvoiceAmount__", "TaxAmount__", "InvoiceDate__",
        "PostingDate__", "InvoiceDescription__"
    ];
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnBuildClearingQueryAttributes", attributesArray);
    const attributes = attributesArray.join("|");
    let filter;
    const MAX_INVOICES_PER_QUERY = 100;
    if (ancestors.processid && ancestors.msnexs.length > 0) {
        Controls.ERPInvoiceNumber__.Wait(true);
        if (ancestors.msnexs.length > 1) {
            filter = `|(MsnEx=${ancestors.msnexs.join(")(MsnEx=")})`;
        }
        else {
            filter = "MsnEx=" + ancestors.msnexs[0];
        }
        const queryFilter = { value: `&(|(State=70)(State=90))(InvoiceStatus__=Wait for clearing)(${filter})` };
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnBuildClearingQueryFilter", queryFilter);
        Query.DBQuery(getConsignmentDocumentsCallback, "CD#" + ancestors.processid, attributes, queryFilter.value, null, MAX_INVOICES_PER_QUERY);
    }
    else {
        setInvoicestoClearCountText(0);
    }
}
function updateItemWithTaxRate(item, taxRate) {
    setItemTaxRate(item, taxRate);
    EventHandlers.computeAmount();
}
function onErrorWithTaxCode(item, error, field, category) {
    item.SetCategorizedError(field, category, error);
    updateItemWithTaxRate(item, 0);
}
function setItemTaxRate(item, taxrate) {
    const taxamount = item.GetValue("Amount__") * taxrate / 100;
    item.SetValue("TaxRate__", taxrate);
    item.SetValue("TaxAmount__", taxamount);
}
function setVendorLineLayout(itemIndex) {
    const row = Controls.LineItems__.GetRow(itemIndex);
    if (row) {
        row.DocumentNumber__.DisplayAs({ type: "Link" });
        row.Amount__.SetReadOnly(true);
        row.TaxAmount__.SetReadOnly(true);
    }
}
function setGLLineLayout(itemIndex) {
    const row = Controls.BalancingLineItems__.GetRow(itemIndex);
    if (row) {
        row.Description__.SetReadOnly(false);
        row.Amount__.SetReadOnly(false);
        row.GLAccount__.SetReadOnly(false);
        row.GLDescription__.SetReadOnly(true);
        row.CostCenter__.SetReadOnly(false);
        row.CCDescription__.SetReadOnly(true);
        row.TaxCode__.SetReadOnly(false);
        row.TaxAmount__.SetReadOnly(true);
    }
}
function initFromConfiguration() {
    Lib.ERP.InitERPName("SAP", false, "AP");
    Lib.P2P.InitSAPConfiguration("AP");
    Lib.P2P.Browse.Init("AP", "BalancingLineItems__");
}
function runCustomScript() {
    initFromConfiguration();
    EventHandlers.init();
    ButtonsBehavior.init();
    updateLayout();
    Controls.LineItems__.HideTableRowDeleteForItem(-1, true);
    Controls.LineItems__.GetRow(0).DocumentNumber__.SetError("");
    const ancestors = getMsnExsFromRuidExs();
    if (!ancestorsRuidLoaded() && !ProcessInstance.isReadOnly) {
        queryAncestorsAndfillForm(ancestors);
    }
    else if (!isDocumentCleared()) {
        setInvoicestoClearCountText(ancestors.msnexs.length);
    }
    else {
        Controls.InvoicesToClearCount__.SetText("");
    }
}
runCustomScript();
//# sourceMappingURL=customscript.js.map