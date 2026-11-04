"use strict";
/** ***** **/
/** DEBUG **/
/** ***** **/
// Enable/disable debug mode
const g_debug = false;
const CompanyHelper = {
    getCompanies: function () {
        const companies = Variable.GetValueAsString("companies");
        if (companies) {
            try {
                return JSON.parse(companies);
            }
            catch (e) {
                Log.Error("getCompanies - exception");
            }
        }
        return {};
    },
    getCompanyValues: function () {
        const comboValues = [];
        const companies = this.getCompanies();
        if (!companies) {
            return comboValues;
        }
        for (const companyCode in companies) {
            if (Object.prototype.hasOwnProperty.call(companies, companyCode)) {
                comboValues.push(companies[companyCode]);
            }
        }
        return comboValues;
    },
    readyCompanyBrowse: false,
    companyBrowseListeners: {},
    initCompanyBrowse: function () {
        if (Variable.GetValueAsString("vendorLinksInfos") !== "{}") {
            const comboValues = this.getCompanyValues();
            const selectedCompanyDescription = Data.GetValue("Company__");
            if (comboValues.length) {
                Controls.Company__.SetText(comboValues.join("\n"));
                Controls.Company__.SetRequired(true);
            }
            if (selectedCompanyDescription && selectedCompanyDescription !== "null") {
                if (!comboValues.length) {
                    Controls.Company__.SetText(selectedCompanyDescription);
                }
                Controls.Company__.SetValue(selectedCompanyDescription);
            }
            Controls.Company__.Hide(comboValues.length <= 1);
            Controls.Company__.OnChange = function () {
                for (const id in CompanyHelper.companyBrowseListeners) {
                    if (Object.prototype.hasOwnProperty.call(CompanyHelper.companyBrowseListeners, id)) {
                        CompanyHelper.companyBrowseListeners[id]();
                    }
                }
            };
            CompanyHelper.readyCompanyBrowse = true;
        }
        else {
            Controls.Company__.Hide(true);
            Popup.Alert(["_PleaseContactAPDepartment"], true, null, "_Submission failed");
        }
    },
};
const EventHistoryHelper = {
    init: function () {
        // Conversation is enabled when the join in the extraction script was called. So when the msn is allocated too.
        if (CompanyHelper.readyCompanyBrowse && Controls.PortalRuidEx__.GetValue() && Controls.CustomerInvoiceStatus__.GetValue() !== Lib.AP.CIStatus.Draft) {
            EventHistoryHelper.updateTitle();
            Controls.Event_history.Hide(false);
            CompanyHelper.companyBrowseListeners.EventHistoryHelper = function () {
                EventHistoryHelper.updateTitle();
            };
        }
        else {
            Controls.Event_history.Hide(true);
        }
    },
    updateTitle: function () {
        // Add vendor name into Event history panel title
        const title = Language.Translate("_Event_history", false, Data.GetValue("Company__"));
        Controls.Event_history.SetText(title);
    }
};
const LayoutHelper = {
    initForm: function () {
        const invoiceStatus = Controls.CustomerInvoiceStatus__.GetValue();
        // Init the banner with the customer invoice status
        const banner = Sys.Helpers.Banner;
        banner.SetMainTitle("_Submission title");
        banner.SetSubTitleAligned(true);
        banner.SetCentered(false);
        banner.SetHTMLBanner(Controls.Title__);
        banner.SetSubTitle(invoiceStatus);
        Process.SetHelpId(2532);
        //always hide status, it is displayed in the title
        Controls.CustomerInvoiceStatus__.Hide(!g_debug);
        Controls.PortalRuidEx__.Hide(!g_debug);
        Controls.ReceptionMethod__.Hide(!g_debug);
        Controls.VIRuidEx__.Hide(!g_debug);
        Controls.Source_RuidEx__.Hide(!g_debug);
        Controls.Order_number__.Hide(!g_debug);
        Controls.Tax_amount__.Hide(!g_debug);
        Controls.ContactsInformation.Hide(!g_debug);
        Controls.Line_Items.Hide(!g_debug);
        CompanyHelper.initCompanyBrowse();
        EventHistoryHelper.init();
        if ((invoiceStatus !== Lib.AP.CIStatus.ToSend && invoiceStatus !== Lib.AP.CIStatus.Draft) || ProcessInstance.isReadOnly) {
            if (Controls.Submit__) {
                Controls.Submit__.Hide();
            }
            Controls.Line_Items.SetReadOnly(true);
        }
        else {
            Controls.Invoice_number__.SetRequired(true);
        }
        if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
            LayoutHelper.setFlipPOLayout(invoiceStatus);
        }
        else if (Controls.RefreshPreview__) {
            Controls.RefreshPreview__.Hide();
        }
        // Disable modification of invoice informations after invoice posted
        Controls.Invoice_details.SetReadOnly(!!Data.GetValue("VIRuidEx__"));
        Controls.RejectReason__.Hide(invoiceStatus !== Lib.AP.CIStatus.Rejected || !Data.GetValue("RejectReason__"));
        Controls.PaymentDetails.Hide(invoiceStatus !== Lib.AP.CIStatus.Paid);
    },
    setFlipPOLayout: function (invoiceStatus) {
        // Manage visibility
        Controls.Order_number__.Hide(false);
        Controls.Tax_amount__.Hide(false);
        Controls.Due_date__.Hide(true);
        Controls.ContactsInformation.Hide(false);
        Controls.LineItems__.MaxExpectedQuantity__.Hide(true);
        Controls.Line_Items.Hide(false);
        const hideRefreshButton = (invoiceStatus !== Lib.AP.CIStatus.ToSend && invoiceStatus !== Lib.AP.CIStatus.Draft) || ProcessInstance.isReadOnly;
        Controls.RefreshPreview__.Hide(hideRefreshButton);
        // Manage read-only
        Controls.Invoice_amount__.SetReadOnly(true);
        Controls.Invoice_date__.SetReadOnly(true);
        Controls.Net_amount__.SetReadOnly(true);
        Controls.Tax_amount__.SetReadOnly(true);
        Controls.Currency__.SetReadOnly(true);
        // Line item quantity is required
        Controls.LineItems__.ExpectedQuantity__.SetRequired(true);
        Controls.LineItems__.TaxRate__.SetRequired(true);
        // If the invoice number is generated, we set the field in readonly
        if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.GenerateInvoiceNumber")) {
            Controls.Invoice_number__.SetReadOnly(true);
            Controls.Invoice_number__.SetRequired(false);
            Controls.Invoice_number__.SetPlaceholder(Language.Translate("_Computed at post"));
        }
    }
};
//#region Gartner
const DynamicDiscountHelper = {
    init: function () {
        if (Data.GetValue("PaymentTerms__") && Data.GetValue("PaymentTerms__") !== "") {
            Controls.PaymentTerms__.Hide(false);
        }
        // display payment discount state panel if data are present
        Controls.Payment_discount.Hide(Data.IsNullOrEmpty("EstimatedDiscountAmount__"));
        // display early payment proposal pane, if early payment is pending review, or refused
        const discountState = Data.GetValue("DiscountState__");
        if (discountState === Lib.AP.CIDiscountState.PendingReview || discountState === Lib.AP.CIDiscountState.Refused) {
            Controls.Early_payment_offer_pane.Hide(false);
        }
    }
};
//#endregion
function InitConversation() {
    const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({ Options: Lib.P2P.Conversation.defaultOptions }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
    Controls.ConversationUI__.Init(conversationInfo);
    Controls.ConversationUI__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsSupplier));
}
function initFlipPOData() {
    if (Controls.CustomerInvoiceStatus__.GetValue() === Lib.AP.CIStatus.Draft) {
        Data.SetValue("Invoice_date__", new Date());
    }
    Controls.LineItems__.HideTableRowMenu(true);
    let lineItemsTable = Data.GetTable("LineItems__");
    let nbItems = lineItemsTable.GetItemCount();
    for (let n = 0; n < nbItems; n++) {
        const lineItem = lineItemsTable.GetItem(n);
        if (lineItem && !lineItem.GetValue("MaxExpectedQuantity__")) {
            /**
             * Save the initial expected quantity
             * It corresponds to the quantity received and not invoiced
             * It is used later to check if the expected quantity is more than the quantity received and not invoiced when modified manually
             **/
            lineItem.SetValue("MaxExpectedQuantity__", lineItem.GetValue("ExpectedQuantity__"));
        }
    }
    Controls.LineItems__.OnDeleteItem = OnLineItemChange;
    Controls.LineItems__.ExpectedQuantity__.OnChange = OnLineItemChange;
    function OnLineItemChange() {
        updateAmounts();
        lineItemsTable = Data.GetTable("LineItems__");
        nbItems = lineItemsTable.GetItemCount();
        for (let i = 0; i < nbItems; i++) {
            const item = lineItemsTable.GetItem(i);
            if (item) {
                const maxQuantity = item.GetValue("MaxExpectedQuantity__");
                const currentQuantity = item.GetValue("ExpectedQuantity__");
                if (currentQuantity > maxQuantity) {
                    item.SetWarning("ExpectedQuantity__", Language.Translate("_warningMessageExpectedQuantity", false, maxQuantity));
                }
            }
        }
    }
    Controls.LineItems__.TaxRate__.OnChange = function () {
        updateAmounts();
    };
    function updateAmounts() {
        lineItemsTable = Data.GetTable("LineItems__");
        nbItems = lineItemsTable.GetItemCount();
        let invoiceNetAmount = 0;
        let invoiceTaxAmount = 0;
        for (let i = 0; i < nbItems; i++) {
            const item = lineItemsTable.GetItem(i);
            if (item) {
                const itemNetAmount = item.GetValue("UnitPrice__") * item.GetValue("ExpectedQuantity__");
                item.SetValue("ExpectedAmount__", itemNetAmount);
                const itemTaxAmount = itemNetAmount * (item.GetValue("TaxRate__") / 100);
                invoiceNetAmount += itemNetAmount;
                invoiceTaxAmount += itemTaxAmount;
            }
        }
        Controls.Net_amount__.SetValue(invoiceNetAmount);
        Controls.Tax_amount__.SetValue(invoiceTaxAmount);
        Controls.Invoice_amount__.SetValue(invoiceNetAmount + invoiceTaxAmount);
    }
}
function submit() {
    var _a;
    if (CompanyHelper.readyCompanyBrowse) {
        // Allow submit in FlipPO mode or if a document was added
        if (Lib.AP.CustomerInvoiceType.isFlipPO() || Attach.GetProcessedDocument() !== null) {
            const generateInvoiceNumber = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.GenerateInvoiceNumber");
            const isCustomValid = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.ValidateOnSubmit", generateInvoiceNumber)) !== null && _a !== void 0 ? _a : true;
            if (((Lib.AP.CustomerInvoiceType.isFlipPO() && generateInvoiceNumber) || Controls.Invoice_number__.GetValue()) && isCustomValid) {
                Sys.Parameters.GetInstance("AP").IsReady(function () {
                    ProcessInstance.ApproveAsynchronous("Submit");
                });
            }
            else {
                Controls.Invoice_number__.ShowErrorMessage();
            }
        }
        else {
            Popup.Alert(["_Upload an invoice"], true, null, "_No invoice found");
        }
    }
    else {
        Popup.Alert(["_PleaseContactAPDepartment"], true, null, "_Submission failed");
    }
}
function run() {
    LayoutHelper.initForm();
    Controls.Submit__.OnClick = submit;
    Controls.Exit__.OnClick = function () {
        if (Variable.GetValueAsString("lasterror")) {
            ProcessInstance.Delete("Delete");
        }
        else {
            ProcessInstance.Quit("Quit");
        }
    };
    if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
        initFlipPOData();
    }
    if (Data.GetValue("PaymentTermEnableDynamicDiscounting__") || Lib.AP.VendorPortal.isDiscountRateProposalAvailable()) {
        DynamicDiscountHelper.init();
    }
    Sys.Parameters.GetInstance("P2P").IsReady(function () {
        InitConversation();
    });
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.HTMLScripts.OnHTMLScriptEnd");
    const lastError = Variable.GetValueAsString("lasterror");
    if (lastError) {
        Popup.Alert([lastError], false, null, "_Submission failed");
    }
}
run();
//# sourceMappingURL=customscript.js.map