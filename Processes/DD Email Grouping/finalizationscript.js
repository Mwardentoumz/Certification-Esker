"use strict";
var DD;
(function (DD) {
    var EmailGrouping;
    (function (EmailGrouping) {
        var Finalization;
        (function (Finalization) {
            // Two cache global variables
            let _doesSMNeedToLoadRecipientLinks = null;
            let _doesPORTALNeedToLoadRecipientLinks = null;
            function Main() {
                let result;
                let allUpdateInSuccess = true;
                let index = 0;
                let emailSentCount = 0;
                const timeoutHelper = new Sys.Helpers.TimeoutHelper(400, 20 /* case RD00005764 was used to compute this value */);
                // To read the input file line by line, we use the CSVReader because it's fully
                // scalable. We consider that it's a single column CSV line without header.
                const csvHelper = Sys.Helpers.CSVReader.CreateInstance(0);
                csvHelper.SplitSeparator = "\x00";
                csvHelper.ReturnSeparator = "\n";
                csvHelper.RemoveDoubleQuotes = false;
                let lineContent = null;
                let documentStack = null;
                do {
                    lineContent = csvHelper.GetNextLine();
                    if (lineContent !== null) {
                        try {
                            documentStack = JSON.parse(lineContent);
                        }
                        catch (e) {
                            documentStack = null;
                        }
                        if (documentStack !== null) {
                            result = SendGroupedEmailAndUpdateDocuments(index, documentStack);
                            allUpdateInSuccess = allUpdateInSuccess && result;
                            if (allUpdateInSuccess) {
                                emailSentCount++;
                            }
                        }
                    }
                    index++;
                    timeoutHelper.NotifyIteration();
                } while (lineContent !== null && lineContent !== "" && documentStack !== null);
                Log.Info(emailSentCount + " email(s) were sent to recipient(s)");
                Data.SetValue("CounterSentEmail__", emailSentCount);
                if (!allUpdateInSuccess) {
                    Log.Error("Some documents couldn't be updated, this process has to be in error");
                    Data.SetValue("State", "200");
                }
            }
            Finalization.Main = Main;
            function SendGroupedEmailAndUpdateDocuments(index, documentStack) {
                const recipientID = documentStack[0].recipientID;
                const transactionKey = `${index}-${recipientID}`;
                const transactionValue = Transaction.Read(transactionKey);
                // In case of retry, we need to have the previously sent email's MSNEX so
                // that we can update documents. The emails transports are real childs so we
                // want to enter in the transport.process() again but the transaction is
                // here so that we can remember the correct MSNEX.
                // sentEmailMsnEx is empty when the email has been sent in a previous retry
                let sentEmailMsnEx = "";
                if (transactionValue === "") {
                    sentEmailMsnEx = SendGroupedEmail(documentStack);
                    Transaction.Write(transactionKey, sentEmailMsnEx);
                }
                else {
                    //If the updates has already been done, or that if we already have stored the EmailMsnEx, we create fake emails in order to bypass the first one in case of retry.
                    CreateFakeEmail();
                    if (transactionValue === "UPDATES_DONE") {
                        return true;
                    }
                    sentEmailMsnEx = transactionValue;
                    Log.Warn(`A transaction for recipient with key "${transactionKey}" was read with MSNEX=${sentEmailMsnEx}, we may be currently in a retry`);
                }
                // Should not happen except if redis do not give us back the msnex during a retry
                if (!sentEmailMsnEx) {
                    Log.Warn(`We do not have the msnex of the grouped email with transaction key "${transactionKey}"`);
                    return false;
                }
                // If the email was sent, we update the documents with the sent email MSNEX and grouping data
                if (UpdateDocuments(sentEmailMsnEx, documentStack)) {
                    Transaction.Write(transactionKey, "UPDATES_DONE");
                    return true;
                }
                return false;
            }
            function AttachDocumentsFilesToTransport(documents, transport) {
                for (const document of documents) {
                    for (let f = 0; f < document.files.length; f++) {
                        const file = document.files[f];
                        const outputName = file.outputName;
                        // Temporary fix FW00324026 some filename of attachments are truncated
                        // rebuild a full path by using the path of the json document attached to the email grouping process
                        if (file.fileName.startsWith("attach\\")) {
                            Log.Info("[AttachDocumentsFilesToTransport] Email attachment " + file.fileName + " is a relative path. Reatach it to local storage hosting the email grouping process");
                            let pathJson = (Attach.GetAttachConvertedPath(0) || Attach.GetAttach(0).GetAttachFile()).toLowerCase();
                            let localTmp = pathJson.substring(0, pathJson.indexOf("attach\\"));
                            file.fileName = localTmp + file.fileName;
                            Log.Info("[AttachDocumentsFilesToTransport] New path on local storage is " + file.fileName);
                        }
                        Sys.Helpers.Attach.AttachFileRef(transport, file.fileName, file.outputFormat, outputName);
                    }
                }
            }
            function AddDocumentUpdateNotifs(documents, email) {
                const senderFormRUIDEXList = [];
                for (const document of documents) {
                    senderFormRUIDEXList.push(document.senderFormRUIDEX);
                }
                const groupingEmailFailedNotifForCUSI = {
                    transport: email,
                    ruidExToUpdate: senderFormRUIDEXList,
                    notifyFilter: "(state>100)",
                    notifySubject: "Email Grouping notification",
                    notifyEachTime: true,
                    varsToUpdate: {
                        "State": { type: "long", value: 200 },
                        "CompletionDateTime": { type: "string", value: "NOW()" },
                        "RecomputeParentsState": { type: "string", value: "1" }
                    }
                };
                Lib.DD.Records.AddUpdateNotification(groupingEmailFailedNotifForCUSI);
                const groupingEmailSuccessNotifForCUSI = {
                    transport: email,
                    ruidExToUpdate: senderFormRUIDEXList,
                    notifyFilter: "(state=100)",
                    notifySubject: "Email Grouping notification",
                    notifyEachTime: true,
                    varsToUpdate: {
                        "State": { type: "long", value: 100 },
                        "CompletionDateTime": { type: "string", value: "NOW()" },
                        "RecomputeParentsState": { type: "string", value: "1" }
                    }
                };
                Lib.DD.Records.AddUpdateNotification(groupingEmailSuccessNotifForCUSI);
            }
            function CreateFakeEmail() {
                const email = Process.CreateTransport("mail", true);
                email.Process();
            }
            function SendGroupedEmail(documentStack) {
                const senderObj = GetCachedSenderObject();
                const sender = {
                    company: senderObj.GetValue("Company"),
                    logoPath: senderObj.GetLogoPath(),
                    accountID: senderObj.GetValue("AccountID"),
                    ownerID: documentStack[0].senderOwnerID
                };
                const recipientLogin = `${sender.accountID}$${documentStack[0].recipientID}`;
                const recipientObj = GetCachedRecipientObject(recipientLogin);
                if (!recipientObj) {
                    // We can enter here if the recipient has been deleted between submission and grouping
                    Log.Error(`Unable to find recipient with login "${recipientLogin}"`);
                    return null;
                }
                const recipient = {
                    identifier: documentStack[0].recipientID,
                    emailAddress: Sys.DD.ComputeRedirectEmailAddress("Redirect_recipient_notifications", documentStack[0].recipientEmailAddress),
                    culture: recipientObj.GetValue("Culture"),
                    language: recipientObj.GetValue("Language"),
                    portalUrl: recipientObj.GetPortalURL(true),
                    internalUser: recipientObj,
                    company: recipientObj.GetValue("Company")
                };
                let allRecipientsLinks = null;
                if (ShouldLoadEveryDocumentLinks(documentStack[0].recipientDeliveryMethod)) {
                    allRecipientsLinks = LoadEveryDocumentLinks(sender, recipient, documentStack);
                }
                const settings = documentStack[0].settings;
                const subjectKey = `_New document${(documentStack.length > 1 ? "s" : "")} from sender {0}`;
                const subjectTranslated = Language.TranslateInto(subjectKey, recipient.language, true, sender.company);
                const senderLogo = `<img src="${sender.logoPath}" >`;
                const documentLinesHTML = GetDocumentLinesHtml(recipient, allRecipientsLinks, documentStack);
                Log.Info(`Creating email groupment of ${documentStack.length} document(s) for recipient ${recipient.identifier} to address: ${recipient.emailAddress}`);
                const email = Process.CreateTransport("mail", true);
                const emailVars = email.GetUninheritedVars();
                emailVars.AddValue_String("OwnerID", sender.ownerID, true);
                emailVars.AddValue_String("EmailAddress", recipient.emailAddress, true);
                emailVars.AddValue_String("Subject", subjectTranslated, true);
                emailVars.AddValue_String("ToName", recipient.identifier, true);
                if (settings.forceEmailValidation) {
                    emailVars.AddValue_String("NeedValidation", "1", true);
                }
                const archiveDuration = documentStack[0].senderFormArchiveDuration;
                if (archiveDuration !== "0") {
                    emailVars.AddValue_String("ArchiveDuration", archiveDuration, true);
                    emailVars.AddValue_String("ArchiveBehavior", "0", true); //Do not archive attach for end messages
                    if (settings.archiveCondition) {
                        emailVars.AddValue_String("ArchiveCondition", settings.archiveCondition, true);
                    }
                }
                if (settings.bounceBackEnabled) {
                    Sys.Helpers.BounceBack.SetBounceBack(email, "ALWAYS", true, false);
                }
                const recipientDeliveryMethod = documentStack[0].recipientDeliveryMethod;
                const introSentenceKey = recipientDeliveryMethod === "SM" ? "_Grouped email intro with attach" : "_Grouped email intro portal";
                const introSentence = Language.TranslateInto(introSentenceKey, recipient.language, false);
                const template = recipient.internalUser.GetTemplateContent({
                    templateName: "DD_Grouped_Notification.htm",
                    replaceTags: true,
                    customTags: {
                        logo: senderLogo,
                        portalUrl: recipient.portalUrl,
                        welcomeInformations: ShouldOneDocumentSendWelcomeEMail(documentStack) ? GetWelcomeEmailLoginInfo(recipient) : "",
                        introSentence: introSentence,
                        documentLines: documentLinesHTML,
                        recipientName: recipient.company
                    }
                });
                Sys.Helpers.Attach.AttachHTML(email, "NewDocuments.htm", template.content);
                if (recipientDeliveryMethod === "SM") {
                    AttachDocumentsFilesToTransport(documentStack, email);
                    AddDocumentUpdateNotifs(documentStack, email);
                }
                const emailsProperties = Lib.DD.Emails.GetEmailsProperties("EmailGrouping");
                const toUser1 = {
                    "AR-transportType": "SM-GROUPED",
                    "AR-transportIsOriginal": recipientDeliveryMethod === "SM"
                };
                emailVars.AddValue_String("ToUser1", JSON.stringify(toUser1), true);
                Lib.DD.Emails.SetSender(email, emailsProperties);
                if (recipientDeliveryMethod === "SM") {
                    Sys.Helpers.TryCallFunction("Lib.DD.Customization.Deliveries.FinalizeGroupedEmailsTransport", email, GetUserExitContextParam(recipientObj), documentStack);
                }
                else {
                    Sys.Helpers.TryCallFunction("Lib.DD.Customization.Deliveries.FinalizeGroupedNotificationsTransport", email, GetUserExitContextParam(recipientObj), documentStack);
                }
                email.Process();
                // Let's return the MSNEX of created process so that we can make the checkpoint
                return email.GetUninheritedVars().GetValue_String("MSNEX", 0);
            }
            function ShouldOneDocumentSendWelcomeEMail(documentStack) {
                for (const document of documentStack) {
                    if (document.sendWelcomeEMail === "CONCAT" && document.passwordUrl) {
                        return true;
                    }
                }
                return false;
            }
            function GetDocumentLinesHtml(recipient, allRecipients, documentStack) {
                let res = "";
                const viewLinkStr = Language.TranslateInto("_View", recipient.language);
                for (let i = 0; i < documentStack.length; i++) {
                    const document = documentStack[i];
                    let documentURL = "";
                    if (allRecipients !== null) {
                        // We already loaded every links of the table
                        documentURL = allRecipients[document.senderFormRUIDEX];
                    }
                    if (!allRecipients) {
                        documentURL = recipient.internalUser.GetProcessURL(document.senderFormRUIDEX);
                    }
                    res += `<tr class="${(i % 2 === 0 ? "odd" : "even")}">\r\n`;
                    res += `	<td>${document.type}</td>\r\n`;
                    res += `	<td>${document.number}</td>\r\n`;
                    res += `	<td><a href="${documentURL}">${viewLinkStr}</a></td>\r\n`;
                    res += `</tr>\r\n`;
                }
                return res;
            }
            function GetWelcomeEmailLoginInfo(recipient) {
                const parametersObject = {
                    templateName: "DD_Welcome_PasswordUrl.txt",
                    replaceTags: true,
                    customTags: {
                        recipientID: recipient.identifier,
                        passwordUrl: recipient.internalUser.GeneratePasswordURL()
                    }
                };
                return recipient.internalUser.GetTemplateContent(parametersObject).content;
            }
            function UpdateDocuments(emailMsnEx, documentStack) {
                for (const document of documentStack) {
                    const updateProcess = Process.GetUpdatableTransport(document.senderFormRUIDEX);
                    const eddRecordVars = updateProcess.GetUninheritedVars();
                    eddRecordVars.AddValue_String("Email_grouping_state__", "GROUPABLE_GROUPED", true);
                    eddRecordVars.AddValue_Date("Email_grouping_datetime__", new Date(), true);
                    eddRecordVars.AddValue_String("Email_groupment_identifier__", emailMsnEx, true);
                    updateProcess.Process();
                }
                return true;
            }
            // Cache to query sender only once
            let _senderObj = null;
            function GetCachedSenderObject() {
                if (!_senderObj) {
                    _senderObj = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerID"));
                }
                return _senderObj;
            }
            // Cache to query recipient only once
            let _recipientHash = {};
            function GetCachedRecipientObject(recipientLogin) {
                if (!(recipientLogin in _recipientHash)) {
                    _recipientHash[recipientLogin] = Users.GetUserAsProcessAdmin(recipientLogin);
                }
                return _recipientHash[recipientLogin];
            }
            // Object made to be given to the user exit to customize generated email
            function GetUserExitContextParam(recipient) {
                return {
                    GetSenderUser: function () {
                        return GetCachedSenderObject();
                    },
                    GetRecipientUser: function () {
                        return recipient;
                    }
                };
            }
            function ShouldLoadEveryDocumentLinks(deliveryMethod) {
                // Read values from cache if already computed
                if (deliveryMethod === "SM" && _doesSMNeedToLoadRecipientLinks !== null) {
                    return _doesSMNeedToLoadRecipientLinks;
                }
                else if (deliveryMethod === "PORTAL" && _doesPORTALNeedToLoadRecipientLinks !== null) {
                    return _doesPORTALNeedToLoadRecipientLinks;
                }
                let groupingKey = null;
                const groupingKeyStr = Variable.GetValueAsString(`GroupingKey_${deliveryMethod}`);
                try {
                    groupingKey = JSON.parse(groupingKeyStr);
                }
                catch (e) {
                    Log.Error(`Unable to parse grouping key "${groupingKeyStr}", exception was: ${e}`);
                    return false;
                }
                if (!groupingKey || !Sys.Helpers.IsArray(groupingKey)) {
                    Log.Error(`The parsed grouping key "${groupingKeyStr}" isn't a valid array`);
                    return false;
                }
                // We need to load every recipients only if the Recipient_ID__ isn't in the grouping list
                let recipientIDFieldFound = false;
                for (let i = 0; i < groupingKey.length && !recipientIDFieldFound; i++) {
                    if (groupingKey[i].toLowerCase() === "recipient_id__") {
                        recipientIDFieldFound = true;
                    }
                }
                // Put result in cache
                if (deliveryMethod === "SM") {
                    _doesSMNeedToLoadRecipientLinks = !recipientIDFieldFound;
                }
                else {
                    _doesPORTALNeedToLoadRecipientLinks = !recipientIDFieldFound;
                }
                if (!recipientIDFieldFound) {
                    Log.Info(`The grouping key for ${deliveryMethod} doesn't contain the "Recipient_ID__" field, so we need to load every recipients in DB`);
                    Log.Info(`As an information, the grouping key is: ${groupingKeyStr}`);
                }
                return !recipientIDFieldFound;
            }
            function LoadEveryDocumentLinks(sender, recipient, documentStack) {
                const allRecipientObjects = {};
                const allDocumentLinks = {};
                // We passed the first recipient as a parameter because it's already fully loaded
                allRecipientObjects[recipient.identifier] = recipient.internalUser;
                allDocumentLinks[documentStack[0].senderFormRUIDEX] = recipient.internalUser.GetProcessURL(documentStack[0].senderFormRUIDEX);
                for (let i = 1; i < documentStack.length; i++) {
                    const recipientID = documentStack[i].recipientID;
                    const senderFormRUIDEX = documentStack[i].senderFormRUIDEX;
                    let recipientObj = null;
                    if (!allRecipientObjects[recipientID]) {
                        // The user isn't in cache yet: let's query it
                        const recipientLogin = `${sender.accountID}$${documentStack[i].recipientID}`;
                        recipientObj = GetCachedRecipientObject(recipientLogin);
                        if (!recipientObj) {
                            // We can enter here if the recipient has been deleted between submission and grouping
                            Log.Error(`Unable to find recipient with login "${recipientLogin}"`);
                            // We pass the first link as we can't do better, but it shouldn't happen as it's
                            // a limit case because recipient deletion is rare
                            allDocumentLinks[senderFormRUIDEX] = allDocumentLinks[documentStack[0].senderFormRUIDEX];
                            continue;
                        }
                        // Put the queried recipient in cache an continue
                        allRecipientObjects[recipientID] = recipientObj;
                    }
                    else {
                        // Get the recipient from the cache
                        recipientObj = allRecipientObjects[recipientID];
                    }
                    // We have the recipient object, we can finally get the link
                    allDocumentLinks[senderFormRUIDEX] = recipientObj.GetProcessURL(senderFormRUIDEX);
                }
                return allDocumentLinks;
            }
            Main();
        })(Finalization = EmailGrouping.Finalization || (EmailGrouping.Finalization = {}));
    })(EmailGrouping = DD.EmailGrouping || (DD.EmailGrouping = {}));
})(DD || (DD = {}));
//# sourceMappingURL=finalizationscript.js.map