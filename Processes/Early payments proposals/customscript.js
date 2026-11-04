"use strict";
function getCurrency() {
    const firstItem = Controls.Invoices__.GetItem(0);
    if (firstItem) {
        return firstItem.GetValue("InvoiceCurrency__");
    }
    return "";
}
var SummaryHelper;
(function (SummaryHelper) {
    function AddSelectedItem(label, amount, showCurrency = false) {
        const item = Controls.SummarySelected__.AddItem(false);
        item.SetValue("Labels__", Language.Translate(label, true));
        if (amount !== undefined) {
            item.SetValue("Amount__", `${amount} ${showCurrency ? getCurrency() : ""}`);
        }
    }
    function Refresh() {
        let selectedInvoicesCount = 0;
        let totalInvoicesAmount = 0;
        let totalInvoicesAmountMinusFee = 0;
        for (let i = 0; i < Controls.Invoices__.GetItemCount(); i++) {
            const item = Controls.Invoices__.GetItem(i);
            if (item.GetValue("IsSelected__")) {
                selectedInvoicesCount += 1;
                totalInvoicesAmount += item.GetValue("InvoiceAmount__");
                totalInvoicesAmountMinusFee += item.GetValue("ProposedInvoiceAmountWithDiscount__");
            }
        }
        let totalFees = totalInvoicesAmount - totalInvoicesAmountMinusFee;
        const currencyPrecision = Lib.P2P.Currency.Get(getCurrency());
        totalInvoicesAmount = Sys.Helpers.Round(totalInvoicesAmount, currencyPrecision.amountPrecision);
        totalInvoicesAmountMinusFee = Sys.Helpers.Round(totalInvoicesAmountMinusFee, currencyPrecision.amountPrecision);
        totalFees = Sys.Helpers.Round(totalFees, currencyPrecision.amountPrecision);
        Controls.SummarySelected__.SetItemCount(0);
        AddSelectedItem("_Summary selected invoices", selectedInvoicesCount);
        Controls.SummarySelected__.GetRow(0).AddStyle("highlight-info");
        AddSelectedItem("_Summary selected invoices amount", totalInvoicesAmount, true);
        AddSelectedItem("_Summary selected discount amount", totalFees, true);
        AddSelectedItem("_Summary selected payment amount", totalInvoicesAmountMinusFee, true);
        Controls.SummarySelected__.GetRow(3).AddStyle("highlight-success");
        refreshSubmitButtonLabel(selectedInvoicesCount);
    }
    SummaryHelper.Refresh = Refresh;
    function refreshSubmitButtonLabel(selectedInvoicesCount) {
        if (selectedInvoicesCount === Controls.Invoices__.GetItemCount()) {
            // Accept all
            Controls.SubmitButton__.SetButtonLabel("_Accept proposal");
        }
        else if (selectedInvoicesCount === 0) {
            // Reject all
            Controls.SubmitButton__.SetButtonLabel("_Refuse proposal");
        }
        else {
            // Accept some
            Controls.SubmitButton__.SetButtonLabel("_Accept part of the proposal");
        }
    }
    function Setup() {
        Controls.Recap__.SetText("");
        Controls.Recap__.Hide(true);
        Controls.SummarySelected__.SetWidth("auto");
        Refresh();
    }
    SummaryHelper.Setup = Setup;
})(SummaryHelper || (SummaryHelper = {}));
var TableHelper;
(function (TableHelper) {
    function Refresh() {
        for (let i = 0; i < Controls.Invoices__.GetLineCount(); i++) {
            const row = Controls.Invoices__.GetRow(i);
            const item = row.GetItem();
            if (!item) {
                // GetLineCount does not represent the number of items currently visible,
                // but the maximum possible number of items that can be displayed at any time.
                // If item does not exist, break loop
                break;
            }
            // Check / uncheck row according to checkbox
            const isSelected = item.GetValue("IsSelected__");
            row.SetSelected(isSelected);
            if (row.GetSelected()) {
                row.RemoveStyle("highlight-grayed");
            }
            else {
                row.AddStyle("highlight-grayed");
            }
        }
    }
    TableHelper.Refresh = Refresh;
})(TableHelper || (TableHelper = {}));
function setupEvents() {
    Controls.Invoices__.OnSelectLine = function (lineIndex) {
        // Check/Uncheck the header's checkbox does not trigger OnSelectAllLines/OnUnselectAllLines event
        // so we have to infer the event type with the state of the first row
        if (lineIndex === -1) {
            const firstRow = Controls.Invoices__.GetRow(0);
            if (!firstRow) {
                return;
            }
            for (let i = 0; i < Controls.Invoices__.GetItemCount(); i++) {
                const item = Controls.Invoices__.GetItem(i);
                const isSelected = firstRow.GetSelected();
                item.SetValue("IsSelected__", isSelected);
            }
        }
        else {
            const row = Controls.Invoices__.GetRow(lineIndex - 1);
            const isSelected = row.GetSelected();
            row.GetItem().SetValue("IsSelected__", isSelected);
        }
        SummaryHelper.Refresh();
        TableHelper.Refresh();
    };
    Controls.Invoices__.OnRefreshRow = function () {
        TableHelper.Refresh();
    };
    Controls.SubmitButton__.OnClick = function () {
        ProcessInstance.Approve("Approve");
    };
    Controls.Invoices__.ActionViewPDF__.OnClick = function () {
        const invoiceRUIDEX = this.GetRow().RUIDEx__.GetValue();
        const url = Sys.Helpers.GetAttachFileURL(invoiceRUIDEX, 0, -2);
        Process.OpenLink(url);
    };
}
function setupHeaderFields() {
    // Set banner based on current status
    const htmlTitle = `<div style='color: #435464;margin: 0px -10px 0px -10px;line-height: 2em;text-align: center; font-family: Arial, Helvetica, sans-serif'>
	<span style='font-size: 20pt;font-weight: bold'>${Language.Translate("Early payment proposal")}</span>
</div>`;
    Controls.HTMLBanner__.SetHTML(htmlTitle);
    const submitDateTime = Data.GetValue("SubmitDateTime");
    if (submitDateTime) {
        Controls.CreationDateTime__.SetValue(submitDateTime.toLocaleString(User.culture));
    }
    const requestedPaymentDate = Data.GetValue("RequestedPaymentDate__");
    if (requestedPaymentDate) {
        Controls.RequestedPaymentDate_Header__.SetText(requestedPaymentDate.toLocaleDateString(User.culture));
    }
    if (Data.GetValue("State") != 70 || ProcessInstance.isReadOnly) {
        Controls.SubmitButton__.Hide(true);
        Controls.Invoices__.IsSelected__.Hide(false);
    }
}
function Main() {
    setupEvents();
    setupHeaderFields();
    SummaryHelper.Setup();
    TableHelper.Refresh();
}
Main();
//# sourceMappingURL=customscript.js.map