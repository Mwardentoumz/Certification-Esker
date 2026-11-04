"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isReviewNeeded() {
    // If vendor has proposed discount rate, proposal need to be validate by AP
    return !!Data.GetValue("ProposedDiscountRate__");
}
function Run() {
    if (Data.GetValue("State") < 50) {
        return;
    }
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info(`Action: ${currentAction ? currentAction : "<empty>"}, Name: ${currentName ? currentName : "<empty>"}, Device: ${Data.GetActionDevice()}`);
    const requestedDiscountLimitDate = Data.GetValue("RequestedPaymentDate__");
    const requestedDiscountRate = Data.GetValue("ProposedDiscountRate__");
    Log.Info(`About to send Early payment proposal with discount limit date to ${requestedDiscountLimitDate}`);
    if (requestedDiscountRate) {
        Log.Info(`Option 'Vendor can propose discount rate' enabled with discount rate requested of ${requestedDiscountRate} %`);
    }
    switch (currentName) {
        case "Approve":
            InvoiceUpdateHelper.UpdateInvoicesWithDiscountInfo(false);
            break;
        default:
            if (isReviewNeeded()) {
                Log.Info("Proposal need to be reviewed. Send to approver");
                Process.PreventApproval();
                InvoiceUpdateHelper.UpdateInvoicesWithDiscountInfo(true);
                NotificationHelper.SendEmail("EarlyPaymentsProposals_NotifNextApprover_XX.htm", Lib.AP.VendorPortal.GetDefaultApUserLogin());
            }
            else {
                Log.Info("Proposal doesn't need to be reviewed. Approve it automatically.");
                InvoiceUpdateHelper.UpdateInvoicesWithDiscountInfo(false);
            }
            break;
    }
}
var InvoiceUpdateHelper;
(function (InvoiceUpdateHelper) {
    function updateDiscountValuesOnCI(discountInfo, pendingReview) {
        Log.Verbose(`Updating CI ${discountInfo.CIRuidEx} : update discount request infos`);
        const valuesToUpdateOnCI = {
            DiscountExpirationDate__: discountInfo.DiscountExpirationDate,
            DiscountAmount__: discountInfo.DiscountAmount,
            DiscountRate__: discountInfo.DiscountRate,
            DiscountState__: discountInfo.DiscountState
        };
        if (!pendingReview) {
            Log.Verbose(`Updating CI ${discountInfo.CIRuidEx} : update accepted discount infos`);
            valuesToUpdateOnCI.DiscountLimitDate__ = discountInfo.DiscountExpirationDate;
            valuesToUpdateOnCI.DiscountPercent__ = discountInfo.DiscountRate;
            valuesToUpdateOnCI.EstimatedDiscountAmount__ = discountInfo.DiscountAmount;
            valuesToUpdateOnCI.InvoiceAmountWithDiscount__ = discountInfo.InvoiceAmountWithDiscount;
        }
        Log.Verbose(`Updating CI ${discountInfo.CIRuidEx} (Discount state : ${discountInfo.DiscountState})`);
        return Process.UpdateProcessInstanceDataAsync(discountInfo.CIRuidEx, JSON.stringify({ fields: valuesToUpdateOnCI }));
    }
    function UpdateInvoicesWithDiscountInfo(pendingReview) {
        let allInSuccess = true;
        const discountExpirationDate = Data.GetValue("RequestedPaymentDate__");
        const table = Data.GetTable("Invoices__");
        const nbInvoices = table.GetItemCount();
        const vipsToUpdate = new Map();
        for (let i = 0; i < nbInvoices; i++) {
            const invoice = table.GetItem(i);
            const discountAmount = invoice.GetValue("ProposedInvoiceDiscountAmount__");
            const dueDate = invoice.GetValue("DueDate__");
            const isSelected = invoice.GetValue("IsSelected__");
            const VIPRuidEx = invoice.GetValue("RUIDEx__");
            let discountState = Lib.AP.CIDiscountState.Refused;
            if (pendingReview) {
                discountState = Lib.AP.CIDiscountState.PendingReview;
            }
            else if (isSelected) {
                discountState = Lib.AP.CIDiscountState.Accepted;
            }
            if (Sys.Helpers.Date.CompareDate(dueDate, discountExpirationDate) === 1) {
                const discountInfo = {
                    IsSelected: isSelected,
                    CIRuidEx: invoice.GetValue("PortalRuidEx__"),
                    VIPRuidEx: VIPRuidEx,
                    DiscountAmount: discountAmount,
                    InvoiceAmountWithDiscount: invoice.GetValue("ProposedInvoiceAmountWithDiscount__"),
                    DiscountRate: invoice.GetValue("ProposedInvoiceDiscountRate__"),
                    DiscountExpirationDate: discountExpirationDate,
                    DiscountState: discountState
                };
                const CIUpdateResult = updateDiscountValuesOnCI(discountInfo, pendingReview);
                if (CIUpdateResult && !pendingReview && isSelected) {
                    Log.Verbose(`Add VIP ${discountInfo.VIPRuidEx} in list of VIP to update`);
                    vipsToUpdate.set(discountInfo.VIPRuidEx, discountInfo);
                }
                allInSuccess = CIUpdateResult && allInSuccess;
            }
            else {
                Log.Warn(`Discount not proposed : VIP ${VIPRuidEx} with due date expired - ${Sys.Helpers.Date.Date2DBDate(dueDate)}`);
            }
        }
        // now update VIPS if needed
        if (vipsToUpdate.size > 0) {
            Log.Verbose(`Update discount info on ${vipsToUpdate.size} VIPs`);
            allInSuccess = Lib.AP.VendorPortal.ScheduledProposeEarlyPaymentOnVIP(vipsToUpdate, Variable.GetValueAsString("shortLogin")) &&
                allInSuccess;
        }
        if (!allInSuccess) {
            Log.Warn("Some Customer invoice/Vendor invoice have not been updated successfully with discount info");
        }
        return allInSuccess;
    }
    InvoiceUpdateHelper.UpdateInvoicesWithDiscountInfo = UpdateInvoicesWithDiscountInfo;
})(InvoiceUpdateHelper || (InvoiceUpdateHelper = {}));
var NotificationHelper;
(function (NotificationHelper) {
    function SendEmail(template, receiverLogin) {
        const customTags = {};
        const emailReceiver = Users.GetUserAsProcessAdmin(receiverLogin);
        let destLanguage;
        if (emailReceiver) {
            destLanguage = emailReceiver.GetValue("Language");
            customTags.ProcessUrl = emailReceiver.GetProcessURL(Data.GetValue("Ruidex"), true);
        }
        else {
            Log.Error(`Cannot retrieve user with value '${receiverLogin}'`);
            return;
        }
        const destEmail = emailReceiver.GetValue("EmailAddress");
        const email = Sys.EmailNotification.CreateEmailWithUser(emailReceiver, destEmail, null, template, customTags, true);
        if (email) {
            Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", Language.TranslateInto("Esker Accounts payable", destLanguage, false));
            Sys.EmailNotification.SendEmail(email);
        }
        else {
            Log.Error(`Cannot send email to '${destEmail}'`);
        }
    }
    NotificationHelper.SendEmail = SendEmail;
})(NotificationHelper || (NotificationHelper = {}));
Run();
//# sourceMappingURL=validationscript.js.map