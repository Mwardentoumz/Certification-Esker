"use strict";
var Notifier;
(function (Notifier) {
    function sendEmail(dest, customTags) {
        const template = "DD_ValidityNotifier_XX.htm";
        const userID = Data.GetValue("OwnerId");
        const userAdmin = Users.GetUserAsProcessAdmin(userID);
        const destEmail = dest.GetValue("EmailAddress");
        customTags.AccountLogo__ = userAdmin.GetLogoPath();
        const email = Sys.EmailNotification.CreateEmailWithUser(userAdmin, destEmail, null, template, customTags, true);
        if (email) {
            const destLanguage = dest.GetVars().GetValue_String("Language", 0);
            Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", Language.TranslateInto("Esker Accounts payable", destLanguage, false));
            Sys.EmailNotification.SendEmail(email);
        }
        else {
            Log.Error(`Cannot send email to '${destEmail}'`);
        }
    }
    Notifier.sendEmail = sendEmail;
    function GetDocumentTypesToNotify() {
        const documentTypes = [];
        const ASQuery = Process.CreateQueryAsProcessAdmin();
        ASQuery.SetSpecificTable("DD - Application Settings__");
        ASQuery.SetAttributesList("Document_Type__");
        ASQuery.SetFilter("(EndOfValidityNotification__=true)");
        ASQuery.SetSearchInArchive(true);
        if (!ASQuery.MoveFirst()) {
            Log.Warn(`Query on 'DD - Application Settings__' failed`);
            return documentTypes;
        }
        let transport = ASQuery.MoveNext();
        while (transport) {
            const docType = transport.GetUninheritedVars().GetValue_String("Document_Type__", 0);
            documentTypes.push(docType);
            transport = ASQuery.MoveNext();
        }
        return documentTypes;
    }
    Notifier.GetDocumentTypesToNotify = GetDocumentTypesToNotify;
    function SendNotificationIfNeeded(docType, horizonDate) {
        Log.Info(`... Notifying for SDA configuration '${docType}' ...`);
        const SFQuery = Process.CreateQueryAsProcessAdmin();
        SFQuery.SetSpecificTable("CDNAME#DD - SenderForm");
        SFQuery.SetAttributesList("NotificationRecipient__,EndOfValidity__,Subject,State");
        SFQuery.SetFilter(`&(Document_Type__=${docType})(State=100)`);
        SFQuery.SetSortOrder("NotificationRecipient__ DESC, EndOfValidity__ DESC, SubmitDateTime DESC");
        SFQuery.SetSearchInArchive(true);
        if (!SFQuery.MoveFirst()) {
            Log.Warn(`Query on 'DD - SenderForm' failed for type '${docType}'`);
            return;
        }
        let currentRecipient;
        let expiredDocToNotifyCount = 0;
        let transport = SFQuery.MoveNext();
        while (transport) {
            const vars = transport.GetUninheritedVars();
            const recipientFullDN = vars.GetValue_String("NotificationRecipient__", 0);
            const endOfValidity = vars.GetValue_String("EndOfValidity__", 0);
            // A document without an end of validity date never expires: skip it
            if (Sys.Helpers.IsEmpty(endOfValidity)) {
                currentRecipient = recipientFullDN;
                transport = SFQuery.MoveNext();
                continue;
            }
            // We only notify for the most recent document of each type (if it expired)
            if (endOfValidity >= horizonDate) {
                // We have a valid document for this type of document and recipient
                // No need to notify recipient
                currentRecipient = recipientFullDN;
            }
            // Check if we already processed a document for this type and recipient or if we already found a non-expired version.
            // The sort order of the query is important for this algorithm to work properly
            if (recipientFullDN !== currentRecipient) {
                const recipient = Users.GetUser(recipientFullDN);
                if (recipient) {
                    const endOfValidityDate = vars.GetValue_Date("EndOfValidity__", 0);
                    // Workaround timezone issues when formatting date in recipient timezone
                    endOfValidityDate.setHours(13);
                    const customTags = {
                        endOfValidity: recipient.GetFormattedDate(endOfValidityDate, {
                            dateFormat: "ShortDate",
                            timeFormat: "None"
                        }),
                        documentName: vars.GetValue_String("Subject", 0),
                        documentType: docType,
                        portalURL: recipient.GetPortalURL()
                    };
                    sendEmail(recipient, customTags);
                }
                else {
                    Log.Warn("User not found: " + recipientFullDN);
                }
                ++expiredDocToNotifyCount;
                currentRecipient = recipientFullDN;
            }
            transport = SFQuery.MoveNext();
        }
        Log.Info(`Found ${expiredDocToNotifyCount} expired documents of type '${docType}'`);
    }
    Notifier.SendNotificationIfNeeded = SendNotificationIfNeeded;
})(Notifier || (Notifier = {}));
function run() {
    const horizonDate = new Date();
    horizonDate.setDate(horizonDate.getDate() + 15);
    const horizonDateDBString = Sys.Helpers.Date.Date2DBDate(horizonDate);
    const documentTypes = Notifier.GetDocumentTypesToNotify();
    if (documentTypes.length) {
        documentTypes.forEach(docType => Notifier.SendNotificationIfNeeded(docType, horizonDateDBString));
    }
    else {
        Log.Info("No notifiable SDA configuration was found");
    }
}
run();
//# sourceMappingURL=finalizationscript.js.map