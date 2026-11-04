"use strict";
Variable.SetValueAsString("CurrentUserId", User.loginId);
const MAX_INVOICES_PER_QUERY = 40;
const MAX_INVOICE_IN_VIEW = 20;
const tabName = "_My documents-AP-Embedded";
const viewName = "_AP_View_To paid - embedded";
const processName = "Vendor invoice";
let LayoutHelper;
const InvoiceCheckHelper = {
    invoicesAlreadyChecked: 0,
    ruidsList: null,
    nbInvoices: 0,
    check: function (ruids) {
        this.ruidsList = ruids.split("|");
        this.nbInvoices = this.ruidsList.length;
        Controls.Update.SetDisabled(true);
        this.checkRuids();
    },
    checkRuids: function () {
        Log.Info(`Checked ${InvoiceCheckHelper.invoicesAlreadyChecked}/${InvoiceCheckHelper.nbInvoices} invoices`);
        //Check invoices 50 by 50
        if (InvoiceCheckHelper.ruidsList && InvoiceCheckHelper.ruidsList.length > InvoiceCheckHelper.invoicesAlreadyChecked) {
            Controls.Update.Wait(true);
            const attributes = "InvoiceStatus__|VendorNumber__|InvoiceCurrency__";
            let filter;
            //Get the next 50 invoices
            const invoicesToCheck = InvoiceCheckHelper.ruidsList.slice(InvoiceCheckHelper.invoicesAlreadyChecked).slice(0, MAX_INVOICES_PER_QUERY);
            InvoiceCheckHelper.invoicesAlreadyChecked += invoicesToCheck.length;
            if (invoicesToCheck.length > 1) {
                filter = `|(RUIDEX=${invoicesToCheck.join(")(RUIDEX=")})`;
            }
            else {
                filter = `(RUIDEX=${invoicesToCheck[0]})`;
            }
            Query.DBQuery(InvoiceCheckHelper.checkRuidsCallback, "CDNAME#Vendor invoice", attributes, filter, null, MAX_INVOICES_PER_QUERY, 0);
        }
        else {
            Log.Info("Restore button");
            Controls.Update.SetDisabled(false);
            Controls.Update.Wait(false);
        }
    },
    checkSameValue: function (bReturn, value1, value2) {
        if (value1 === value2) {
            return bReturn;
        }
        return false;
    },
    checkRuidsCallback: function (queryResult) {
        queryResult = queryResult || this;
        let sameCurrency = true;
        let sameVendor = true;
        let isUnpaid = true;
        let failure = false;
        if (!queryResult) {
            Log.Error("The request does not return any record");
            failure = true;
        }
        else {
            const err = queryResult.GetQueryError();
            if (err) {
                Log.Error("Query in error : " + err);
                failure = true;
            }
            else if (queryResult.GetRecordsCount() === 0) {
                Log.Info("Query does not return any record...");
            }
            else {
                const vendorReference = queryResult.GetQueryValue("VendorNumber__", 0);
                const currencyReference = queryResult.GetQueryValue("InvoiceCurrency__", 0);
                let invoiceStatus = queryResult.GetQueryValue("InvoiceStatus__", 0);
                isUnpaid = Lib.AP.InvoiceStatus.ToPay === invoiceStatus || Lib.AP.InvoiceStatus.BeingPaid === invoiceStatus;
                for (let i = 1; i < queryResult.GetRecordsCount() && sameVendor && sameCurrency && isUnpaid; ++i) {
                    sameVendor = InvoiceCheckHelper.checkSameValue(sameVendor, vendorReference, queryResult.GetQueryValue("VendorNumber__", i));
                    sameCurrency = InvoiceCheckHelper.checkSameValue(sameCurrency, currencyReference, queryResult.GetQueryValue("InvoiceCurrency__", i));
                    invoiceStatus = queryResult.GetQueryValue("InvoiceStatus__", i);
                    isUnpaid = InvoiceCheckHelper.checkSameValue(isUnpaid, Lib.AP.InvoiceStatus.ToPay, invoiceStatus) ||
                        InvoiceCheckHelper.checkSameValue(isUnpaid, Lib.AP.InvoiceStatus.BeingPaid, invoiceStatus);
                }
            }
        }
        if (!sameVendor || !sameCurrency || !isUnpaid || failure) {
            Log.Info(`Check invoices find error : sameVendor=${sameVendor} - sameCurrency=${sameCurrency} - isUnpaid${isUnpaid}`);
            LayoutHelper.setWrongSelectionLayout(sameVendor, sameCurrency, isUnpaid);
            Controls.Update.Wait(false);
        }
        else {
            InvoiceCheckHelper.checkRuids();
        }
    }
};
const InvoiceViewHelper = {
    getInvoicesFilter: function (ruids) {
        if (!ruids) {
            return { "msnex": "0" };
        }
        const msnexlist = ruids.split("|");
        for (let i = 0; i < msnexlist.length; i++) {
            msnexlist[i] = msnexlist[i].split(".")[1];
        }
        return { "msnex": msnexlist };
    },
    show: function (ruids) {
        const nbInvoices = ruids.split("|").length;
        if (nbInvoices > MAX_INVOICE_IN_VIEW) {
            Controls.InvoicesToPayExplanation__.Hide(false);
            Controls.InvoicesView__.Hide();
            Controls.InvoicesToPayExplanation__.SetText("_InvoicesToPayExplanation", nbInvoices, nbInvoices);
        }
        else {
            Controls.InvoicesToPayExplanation__.Hide();
            Controls.InvoicesView__.Hide(false);
            Controls.InvoicesView__.SetView(tabName, viewName, processName);
            Controls.InvoicesView__.SetFilterParameters(this.getInvoicesFilter(ruids));
            Controls.InvoicesView__.CheckProfileTab(false);
            Controls.InvoicesView__.Apply();
        }
    }
};
LayoutHelper =
    {
        panelVisibility: {},
        init: function () {
            this.panelVisibility.Update_payment_title_pane = { "ctrl": Controls.Update_payment_title_pane, "fromVIP": true, "fromAdminList": true, "fromAdminListWrongSelection": false, "fromCSVImport": false };
            this.panelVisibility.Payment_pane = { "ctrl": Controls.Payment_pane, "fromVIP": true, "fromAdminList": true, "fromAdminListWrongSelection": false, "fromCSVImport": false };
            this.panelVisibility.ProcessDescriptionPane = { "ctrl": Controls.ProcessDescriptionPane, "fromVIP": false, "fromAdminList": false, "fromAdminListWrongSelection": false, "fromCSVImport": true };
            this.panelVisibility.CSVImportFilePane = { "ctrl": Controls.CSVImportFilePane, "fromVIP": false, "fromAdminList": false, "fromAdminListWrongSelection": false, "fromCSVImport": true };
            this.panelVisibility.InvoicesViewPanel = { "ctrl": Controls.InvoicesViewPanel, "fromVIP": false, "fromAdminList": true, "fromAdminListWrongSelection": false, "fromCSVImport": false };
            this.panelVisibility.ErrorPane = { "ctrl": Controls.ErrorPane, "fromVIP": false, "fromAdminList": false, "fromAdminListWrongSelection": true, "fromCSVImport": false };
            const ruids = Variable.GetValueAsString("AncestorsRuid");
            if (ruids) {
                Log.Info("Openning from admin list selection");
                this.setAdminListSelectionLayout(ruids);
                if (!ProcessInstance.isReadOnly) {
                    InvoiceCheckHelper.check(ruids);
                }
            }
            else if (Variable.GetValueAsString("InvoiceDate__")) {
                // If the InvoiceDate__ variable is, it means the process was instanciated from an invoice
                // InvoiceDate__ variable is not set when instanciated from the dashboard or a view
                Log.Info("Openning from an invoice");
                this.setPaymentFromVIPLayout();
            }
            else {
                Log.Info("Openning from dashboard button : CSV import");
                this.setImportFromCSVLayout();
            }
        },
        setPaymentFieldsReadOnly: function () {
            // Disable fields
            Controls.PaymentDate__.SetRequired(false);
            Controls.Payment_method__.SetRequired(false);
            Controls.Payment_method__.SetText("\n" + Controls.Payment_method__.GetText());
        },
        showPanelsFor: function (layout) {
            for (const panel in this.panelVisibility) {
                if (Object.prototype.hasOwnProperty.call(this.panelVisibility, panel)) {
                    this.panelVisibility[panel].ctrl.SetReadOnly(!this.panelVisibility[panel][layout]);
                    this.panelVisibility[panel].ctrl.Hide(!this.panelVisibility[panel][layout]);
                }
            }
        },
        manageDescriptionTranslation: function () {
            let description = "\n";
            description += Language.Translate("_Please select your CSV file containing the list of invoices to update.") + "\n";
            description += Language.Translate("_The CSV had to respect the following format:") + "\n";
            description += "\n";
            // Manage labels
            Controls.ProcessDescriptionPart1__.SetLabel(description);
        },
        setPaymentFromVIPLayout: function () {
            // Display specifics panels
            this.showPanelsFor("fromVIP");
            // Disable fields
            Controls.CSVImportFilePane.SetReadOnly(true);
            // Manage labels
            Controls.Update.SetLabel("_UpdatePayment");
        },
        setImportFromCSVLayout: function () {
            // Display specifics panels
            this.showPanelsFor("fromCSVImport");
            this.manageDescriptionTranslation();
            Controls.Update.SetLabel("_Import and update");
            Controls.Update.SetDisabled(Attach.GetNbAttach() === 0);
            this.setPaymentFieldsReadOnly();
            const message = Variable.GetValueAsString("errorMessage");
            if (message) {
                Popup.Alert(message, true, null, "_Error");
            }
        },
        setAdminListSelectionLayout: function (ruids) {
            // Display specifics panels
            this.showPanelsFor("fromAdminList");
            // Manage labels
            Controls.Update.SetLabel("_UpdateListPayment");
            InvoiceViewHelper.show(ruids);
        },
        setWrongSelectionLayout: function (sameVendor, sameCurrency, isUnpaid) {
            ProcessInstance.SetSilentChange(true);
            this.showPanelsFor("fromAdminListWrongSelection");
            let errorMessage = "_An error occured while retrieving invoice information";
            if (!sameVendor) {
                errorMessage = "_You try to update payment status for invoices addressed to different vendors.";
            }
            else if (!sameCurrency) {
                errorMessage = "_You try to update payment status for invoices with different currency.";
            }
            else if (!isUnpaid) {
                errorMessage = "_You try to pay invoices which are not to pay.";
            }
            const errorMessageTranslated = Language.Translate(errorMessage);
            Controls.Error__.SetLabel(errorMessageTranslated);
            this.setPaymentFieldsReadOnly();
            Controls.Update.Hide();
        }
    };
LayoutHelper.init();
//# sourceMappingURL=customscript.js.map