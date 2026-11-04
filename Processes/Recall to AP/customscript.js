"use strict";
// RUN PART
const tabName = "_My documents-AP-Embedded";
const discountViewName = "_AP_SAP_View_Vendor invoice - embedded";
const paymentFeeViewName = "_AP_SAP_View_Vendor invoice payment fee - embedded";
const paymentFeeFromViewName = "_AP_SAP_View_Invoices overdue";
const processName = "Vendor invoice";
function getInvoicesFilter(ruids) {
    if (!ruids) {
        return {
            msnex: ["0"]
        };
    }
    const msnexlist = ruids.split("|");
    for (let i = 0; i < msnexlist.length; i++) {
        msnexlist[i] = msnexlist[i].split(".")[1];
    }
    return { "msnex": msnexlist };
}
function run() {
    const ancestorRuids = Variable.GetValueAsString("AncestorsRuid");
    const fromView = Variable.GetValueAsString("FromView");
    const view = fromView === paymentFeeFromViewName ? paymentFeeViewName : discountViewName;
    if (ancestorRuids) {
        const ancestors = ancestorRuids.split("|");
        Controls.InvoicesToRecallCount__.SetText("_InvoicesToRecallCountLabel", ancestors.length);
        Controls.InvoicesView__.SetView(tabName, view, processName);
        Controls.InvoicesView__.SetFilterParameters(getInvoicesFilter(ancestorRuids));
        Controls.InvoicesView__.CheckProfileTab(false);
        Controls.InvoicesView__.Apply();
    }
    else {
        Controls.InvoicesToRecallCount__.SetText("_NoInvoicesToRecallCountLabel");
    }
    if (ProcessInstance.isReadOnly) {
        Controls.RecallToAPComment__.Hide(true);
    }
    else {
        Controls.RecallToAPComment__.SetPlaceholder(Language.Translate("_Enter your comment..."));
    }
}
run();
//# sourceMappingURL=customscript.js.map