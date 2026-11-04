"use strict";
var InvoicesHelper;
(function (InvoicesHelper) {
    function SetupLayout() {
        Controls.EligibleInvoices__.SetWidth("100%");
        Controls.EligibleInvoices__.SetExtendableColumn("Invoice_number__");
    }
    InvoicesHelper.SetupLayout = SetupLayout;
    function UpdateInvoicesAmounts() {
        for (let i = 0; i < Controls.EligibleInvoices__.GetItemCount(); i++) {
            const eligibleInvoiceItem = Controls.EligibleInvoices__.GetItem(i);
            UpdateSingleInvoiceAmounts(eligibleInvoiceItem);
        }
        SummaryHelper.Refresh();
    }
    InvoicesHelper.UpdateInvoicesAmounts = UpdateInvoicesAmounts;
    function UpdateSingleInvoiceAmounts(eligibleInvoiceItem) {
        const dueDate = eligibleInvoiceItem.GetValue("Due_date__");
        const discountRate = Lib.AP.VendorPortal.isDiscountRateProposalAvailable()
            ? Data.GetValue("RequestedDiscountRate__")
            : eligibleInvoiceItem.GetValue("PaymentTermDiscountRate__");
        if (dueDate) {
            // calculated field InvoiceAmountWithDiscount__, Discount_amount__
            const dynamicDiscountInfos = {
                discountRate: discountRate / 100,
                dueDate: dueDate,
                expirationDiscountDate: Data.GetValue("RequestedPaymentDate__"),
                invoiceAmount: parseFloat(eligibleInvoiceItem.GetValue("Invoice_amount__"))
            };
            const computedDynamicDiscount = Lib.P2P.DynamicDiscounting.ComputeDynamicDiscountAmount(dynamicDiscountInfos);
            const currencyPrecision = Lib.P2P.Currency.Get(getCurrency());
            eligibleInvoiceItem.SetValue("InvoiceAmountWithDiscount__", Sys.Helpers.Round(computedDynamicDiscount.invoiceAmountWithDiscount, currencyPrecision.amountPrecision));
            eligibleInvoiceItem.SetValue("Discount_amount__", Sys.Helpers.Round(computedDynamicDiscount.estimatedDiscountAmount, currencyPrecision.amountPrecision));
            eligibleInvoiceItem.SetValue("Discount_rate__", computedDynamicDiscount.discountRate);
        }
    }
    function FillTable(results) {
        // Initialize max number of remaining days
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        let maxDateRange = tomorrow;
        Variable.SetValueAsString("MaxRemainingDays", 1);
        // Initalize max discount rate
        let maxDiscountRate = 0;
        let totalInvoicesAmount = 0;
        // Fill table
        for (const result of results) {
            const eligibleInvoiceItem = Controls.EligibleInvoices__.AddItem();
            for (const attribute in result) {
                if (Object.prototype.hasOwnProperty.call(result, attribute)) {
                    const fieldName = attribute === "RUIDEX" ? "RUIDEX__" : attribute;
                    eligibleInvoiceItem.SetValue(fieldName, result[attribute]);
                }
            }
            const dueDate = eligibleInvoiceItem.GetValue("Due_date__");
            if (dueDate) {
                // calculated field Remaining__
                const remainingDays = Sys.Helpers.Date.ComputeDeltaDays(new Date(), eligibleInvoiceItem.GetValue("Due_date__"));
                eligibleInvoiceItem.SetValue("Remaining__", remainingDays);
                // Retrieve max number of remaining days
                const maxRemainingDays = parseInt(Variable.GetValueAsString("MaxRemainingDays"), 10);
                if (remainingDays > 1 && maxRemainingDays < (remainingDays - 1)) {
                    Variable.SetValueAsString("MaxRemainingDays", remainingDays - 1);
                    maxDateRange = new Date(eligibleInvoiceItem.GetValue("Due_date__"));
                }
                // Retrieve max rate among invoice
                const discountRate = parseFloat(result.PaymentTermDiscountRate__);
                if (!Number.isNaN(discountRate) && discountRate > maxDiscountRate) {
                    maxDiscountRate = discountRate;
                }
            }
            totalInvoicesAmount += eligibleInvoiceItem.GetValue("Invoice_amount__");
        }
        // Set date range
        if (maxDateRange > tomorrow) {
            maxDateRange.setDate(maxDateRange.getDate() - 1);
        }
        Controls.RequestedPaymentDate__.SetDateRange(tomorrow, maxDateRange);
        // Mode 3 - Display and set Discount rate by default if setting VendorCanProposeEarlyPayment is actived
        if (Lib.AP.VendorPortal.isDiscountRateProposalAvailable()) {
            if (maxDiscountRate > 0) {
                Data.SetValue("RequestedDiscountRate__", maxDiscountRate);
            }
            Controls.RequestedDiscountRate__.Hide(false);
            Controls.RequestedDiscountRate__.SetRequired(true);
        }
        InvoicesHelper.UpdateInvoicesAmounts();
        // Handle description on top of the invoices table
        const description = Language.Translate("_Recap", false, Controls.EligibleInvoices__.GetItemCount(), `${totalInvoicesAmount} ${getCurrency()}`);
        Controls.Recap__.Hide(false);
        Controls.Recap__.SetText(description);
    }
    InvoicesHelper.FillTable = FillTable;
})(InvoicesHelper || (InvoicesHelper = {}));
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
        Controls.EligibleInvoices__.ForEachSelectedItem(function (item) {
            selectedInvoicesCount += 1;
            totalInvoicesAmount += item.GetValue("Invoice_amount__");
            totalInvoicesAmountMinusFee += item.GetValue("InvoiceAmountWithDiscount__");
        });
        let totalFees = totalInvoicesAmount - totalInvoicesAmountMinusFee;
        const currency = Lib.P2P.Currency.Get(getCurrency());
        totalInvoicesAmount = Sys.Helpers.Round(totalInvoicesAmount, currency.amountPrecision);
        totalInvoicesAmountMinusFee = Sys.Helpers.Round(totalInvoicesAmountMinusFee, currency.amountPrecision);
        totalFees = Sys.Helpers.Round(totalFees, currency.amountPrecision);
        Controls.SummarySelected__.SetItemCount(0);
        AddSelectedItem("_Summary selected invoices", selectedInvoicesCount);
        Controls.SummarySelected__.GetRow(0).AddStyle("highlight-info");
        AddSelectedItem("_Summary selected invoices amount", totalInvoicesAmount, true);
        AddSelectedItem("_Summary selected discount amount", totalFees, true);
        AddSelectedItem("_Summary selected payment amount", totalInvoicesAmountMinusFee, true);
        Controls.SummarySelected__.GetRow(3).AddStyle("highlight-success");
        // Refresh "Pay me now" button
        const discountRate = Data.GetValue("RequestedDiscountRate__");
        const disableCondition = selectedInvoicesCount === 0
            || !Data.GetValue("RequestedPaymentDate__")
            || (Lib.AP.VendorPortal.isDiscountRateProposalAvailable() && (!Sys.Helpers.IsNumeric(discountRate) || discountRate === 0));
        Controls.PayMeButton__.SetDisabled(disableCondition);
    }
    SummaryHelper.Refresh = Refresh;
    function SetupLayout() {
        Controls.Recap__.SetText("");
        Controls.Recap__.Hide(true);
        Controls.SummarySelected__.SetWidth("auto");
        Controls.SummarySelected__.SetItemCount(0);
        Controls.PayMeButton__.SetDisabled(true);
        Refresh();
    }
    SummaryHelper.SetupLayout = SetupLayout;
})(SummaryHelper || (SummaryHelper = {}));
function setupEvents() {
    Controls.RequestedPaymentDate__.OnChange = function () {
        // Update inputs value with number of limit days
        Controls.Slider__.FireEvent("onActionLoad", { value: Sys.Helpers.Date.ComputeDeltaDays(new Date(), Controls.RequestedPaymentDate__.GetValue()) });
        InvoicesHelper.UpdateInvoicesAmounts();
    };
    Controls.RequestedDiscountRate__.OnChange = function () {
        InvoicesHelper.UpdateInvoicesAmounts();
    };
    Controls.Slider__.BindEvent("input", function (event) {
        if (event && event.value) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(event.value, 10));
            Controls.RequestedPaymentDate__.SetValue(date);
            InvoicesHelper.UpdateInvoicesAmounts();
        }
    });
    Controls.PayMeButton__.OnClick = function () {
        Controls.PayMeButton__.Wait(true);
        const selectedInvoicesRuidex = [];
        const selectedInvoicesDiscountInfo = [];
        Controls.EligibleInvoices__.ForEachSelectedItem(function (item) {
            selectedInvoicesRuidex.push(item.GetValue("RUIDEX__"));
            selectedInvoicesDiscountInfo.push({
                "RUIDEX__": item.GetValue("RUIDEX__"),
                "InvoiceAmountWithDiscount__": item.GetValue("InvoiceAmountWithDiscount__"),
                "Discount_amount__": item.GetValue("Discount_amount__"),
                "Discount_rate__": item.GetValue("Discount_rate__"),
                "PaymentTermDayLimit__": item.GetValue("PaymentTermDayLimit__") || "0",
                "Remaining__": item.GetValue("Remaining__")
            });
        });
        if (selectedInvoicesRuidex.length > 0) {
            const ruidExs = selectedInvoicesRuidex.join("|");
            const externalVars = {
                AncestorsRUID: ruidExs,
                ShortLogin: User.loginId, // used in VIP workflow to link the early payment proposal to the current user
                InvoicesDiscountInfo: JSON.stringify(selectedInvoicesDiscountInfo)
            };
            const quitOnClick = function () {
                Controls.Close.Click();
            };
            const processOptions = {
                callback: function (data) {
                    if (data.error) {
                        Log.Error(`Error while submitting early payment requests: ${data.error}`);
                        Popup.Alert("_Error submitting an early payment request", true, null, "_Error popup title");
                    }
                    else {
                        Popup.Alert("_Proposals have been sent", false, quitOnClick, "_EarlyPaymentProposalsSuccess_title");
                    }
                    Controls.PayMeButton__.Wait(false);
                }
            };
            const fields = {
                RequestedPaymentDate__: Data.GetValue("RequestedPaymentDate__"),
                ProposedDiscountRate__: Lib.AP.VendorPortal.isDiscountRateProposalAvailable() ? Data.GetValue("RequestedDiscountRate__") : null
            };
            Process.CreateProcessInstance("Early payments proposals", fields, externalVars, processOptions);
        }
    };
    Controls.EligibleInvoices__.OnSelectLine = function () {
        InvoicesHelper.UpdateInvoicesAmounts();
    };
    Controls.EligibleInvoices__.OnRefreshRow = function (index) {
        const row = Controls.EligibleInvoices__.GetRow(index);
        if (row) {
            // Refresh row links
            row.Invoice_number__.SetText(row.Invoice_number__.GetValue());
            row.Invoice_number__.SetURL(Sys.Helpers.GetFlexibleFormURL(row.RUIDEX__.GetValue(), true));
        }
    };
    Controls.EligibleInvoices__.ActionViewPDF__.OnClick = function () {
        const invoiceRUIDEX = this.GetRow().RUIDEX__.GetValue();
        const url = Sys.Helpers.GetAttachFileURL(invoiceRUIDEX, 0, -2);
        Process.OpenLink(url);
    };
}
function setupRequestedPaymentDate() {
    const discountLimitDate = getTomorrowDate();
    Controls.RequestedPaymentDate__.SetValue(discountLimitDate);
}
function getTomorrowDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return tomorrow;
}
function getCurrency() {
    const firstItem = Controls.EligibleInvoices__.GetItem(0);
    if (firstItem) {
        return firstItem.GetValue("Currency__");
    }
    return "";
}
function LoadDataAsync() {
    Controls.EligibleInvoices__.SetItemCount(0);
    const tomorrow = getTomorrowDate();
    const tomorowDBDate = Sys.Helpers.Date.Date2DBDate(tomorrow);
    const filtersList = [
        Sys.Helpers.LdapUtil.FilterEqual("deleted", "0"),
        Sys.Helpers.LdapUtil.FilterGreaterOrEqual("Due_date__", tomorowDBDate),
        Sys.Helpers.LdapUtil.FilterEqual("CustomerInvoiceStatus__", Lib.AP.CIStatus.AwaitingPayment)
    ];
    if (!Lib.AP.VendorPortal.isDiscountRateProposalAvailable()) {
        filtersList.push(Sys.Helpers.LdapUtil.FilterEqual("PaymentTermEnableDynamicDiscounting__", "1"));
    }
    const filter = Sys.Helpers.LdapUtil.FilterAnd(...filtersList);
    const queryParameters = {
        table: "CDNAME#Customer Invoice",
        filter,
        attributes: [
            "RUIDEX",
            "Invoice_number__",
            "Invoice_date__",
            "Order_number__",
            "Invoice_amount__",
            "Due_date__",
            "PaymentTermDiscountRate__",
            "DiscountLimitDate__",
            "PaymentTermDayLimit__",
            "Currency__"
        ],
        maxRecords: "NO_LIMIT",
        sortOrder: "Due_date__ ASC"
    };
    return Sys.Helpers.Promise.Create((resolve, reject) => {
        Sys.GenericAPI.PromisedQuery(queryParameters)
            .Then((results) => {
            InvoicesHelper.FillTable(results);
            resolve();
        })
            .Catch((reason) => {
            Log.Error(`Error while loading Customer invoice data from database: ${reason}`);
            reject(reason);
        });
    });
}
function Main() {
    setupRequestedPaymentDate();
    setupEvents();
    InvoicesHelper.SetupLayout();
    SummaryHelper.SetupLayout();
    ProcessInstance.SetSilentChange(true);
    Controls.EligibleInvoices__.Wait(true);
    return LoadDataAsync().Then(() => {
        InvoicesHelper.UpdateInvoicesAmounts();
        Controls.EligibleInvoices__.Wait(false);
        // Set max value in input Slider__
        Controls.Slider__.FireEvent("onActionLoad", { maxDays: Variable.GetValueAsString("MaxRemainingDays") || 1 });
    });
}
Main();
//# sourceMappingURL=customscript.js.map