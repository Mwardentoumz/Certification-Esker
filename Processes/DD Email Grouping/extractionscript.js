"use strict";
var DD;
(function (DD) {
    var EmailGrouping;
    (function (EmailGrouping) {
        var Extraction;
        (function (Extraction) {
            function Main() {
                // This file will contain an document stack per line, each stored in a JSON.
                // It will NOT be a big array of JSON.
                const tempFile = TemporaryFile.CreateFile("txt");
                const timeoutHelper = new Sys.Helpers.TimeoutHelper(400, 100);
                AppendRecordsToBeGrouped(tempFile, timeoutHelper, "PORTAL");
                AppendRecordsToBeGrouped(tempFile, timeoutHelper, "SM");
                Attach.AttachTemporaryFile(tempFile, "DocumentStacks");
            }
            Extraction.Main = Main;
            function AppendRecordsToBeGrouped(tempFile, timeoutHelper, deliveryMethod) {
                const groupingKey = GetGroupingKey(deliveryMethod);
                Variable.SetValueAsString(`GroupingKey_${deliveryMethod}`, JSON.stringify(groupingKey));
                const query = GetGroupableRecords(deliveryMethod, groupingKey);
                let documentRecord = null;
                let lastReadDocument = null;
                let documentStack = [];
                let attachSize = 0;
                do {
                    documentRecord = query.MoveNext();
                    if (documentRecord) {
                        const documentVars = documentRecord.GetUninheritedVars();
                        const documentExtVars = documentRecord.GetExternalVars();
                        // The following line load the current CUSI record configuration, it allow
                        // us to use Sys.Outbound.GetParameter properly for this loop
                        Sys.DD.InitConfigurationFromRecordCache(documentRecord, true);
                        // RD00032943 - Rebuild the path of attachments from shared - lots of code could be removed in DD sender form
                        const attachList = documentRecord.GetAttachs(true);
                        const files = GetAttachmentFilesForGrouping(documentVars.GetValue_String("Document_Type__", 0), attachList);
                        const settings = {
                            archiveCondition: Sys.DD.GetParameter("ArchiveCondition__"),
                            forceEmailValidation: Sys.DD.GetParameter("ForceMessageValidation_NOTIF_EMAIL"),
                            bounceBackEnabled: Sys.DD.GetParameter("BounceBacks_Enable")
                        };
                        const groupedFields = [];
                        for (const groupingField of groupingKey) {
                            groupedFields.push(documentVars.GetValue_String(groupingField, 0));
                        }
                        const currentDocument = {
                            senderFormRUIDEX: documentVars.GetValue_String("RUIDEx", 0),
                            senderFormArchiveDuration: Sys.DD.ComputeArchiveDuration("", Data.GetValue("Delivery_method__")),
                            recipientID: documentVars.GetValue_String("Recipient_ID__", 0),
                            type: documentVars.GetValue_String("Document_Type__", 0),
                            number: documentVars.GetValue_String("Document_ID__", 0),
                            priority: documentVars.GetValue_String("Document_Priority__", 0),
                            recipientDeliveryMethod: documentVars.GetValue_String("Delivery_method__", 0),
                            sendWelcomeEMail: documentExtVars.GetValue_String("SendWelcomeEmail__", 0),
                            passwordUrl: documentExtVars.GetValue_String("Password_url__", 0),
                            recipientEmailAddress: documentVars.GetValue_String("Recipient_email__", 0),
                            senderEmailAddress: documentVars.GetValue_String("Sender_email__", 0),
                            senderOwnerID: documentExtVars.GetValue_String("Sender_ownerID__", 0),
                            groupedFields: groupedFields,
                            files: files ? files : [],
                            settings: settings
                        };
                        const currentDocumentAttachmentsSize = parseInt(documentExtVars.GetValue_String("AttachmentsSize__", 0), 10);
                        attachSize += isNaN(currentDocumentAttachmentsSize) ? 0 : currentDocumentAttachmentsSize;
                        if (lastReadDocument === null) {
                            lastReadDocument = currentDocument;
                        }
                        else if (ShouldSendNewEmail(currentDocument, lastReadDocument, attachSize, deliveryMethod)) {
                            lastReadDocument = currentDocument;
                            TemporaryFile.Append(tempFile, JSON.stringify(documentStack) + "\n");
                            documentStack = [];
                            attachSize = currentDocumentAttachmentsSize;
                        }
                        documentStack.push(currentDocument);
                    }
                    timeoutHelper.NotifyIteration();
                } while (documentRecord);
                // The last stack has to be sent too
                if (documentStack.length > 0) {
                    TemporaryFile.Append(tempFile, JSON.stringify(documentStack) + "\n");
                }
            }
            function GetGroupingKey(deliveryMethod) {
                const groupKeyFromUserExit = Sys.Helpers.TryCallFunction("Lib.DD.Customization.Deliveries.CustomizeEmailGroupingKey", deliveryMethod);
                if (groupKeyFromUserExit === null || groupKeyFromUserExit === undefined) {
                    Log.Info(`Using default ${deliveryMethod} grouping key because the user exit Lib.DD.Customization.Deliveries.CustomizeEmailGroupingKey returned null or isn't defined`);
                }
                else if (!Sys.Helpers.IsArray(groupKeyFromUserExit)) {
                    Log.Error(`Using default ${deliveryMethod} grouping key because object returned wasn't an array in Lib.DD.Customization.Deliveries.CustomizeEmailGroupingKey`);
                }
                else if (groupKeyFromUserExit.length === 0) {
                    Log.Error(`Using default ${deliveryMethod} grouping key because was returned an empty array in Lib.DD.Customization.Deliveries.CustomizeEmailGroupingKey`);
                }
                else {
                    Log.Info(`Custom ${deliveryMethod} grouping key: ${JSON.stringify(groupKeyFromUserExit)}`);
                    return groupKeyFromUserExit;
                }
                return ["Recipient_ID__", "Recipient_email__"];
            }
            function ShouldSendNewEmail(currentDocument, lastReadDocument, attachSize, deliveryMethod) {
                // WARNING: here we're supposing than the query order determinates a correct
                // set of documents with THE SAME configuration. Multi-configurations sending
                // to a same customer IS NOT SUPPORTED.
                let maxAttachSize = parseInt(Sys.DD.GetParameter("GroupEmailMaxAttachSize"), 10); // Max attachment size in a single email
                if (isNaN(maxAttachSize)) {
                    Log.Error("Error: wizard parameter 'GroupEmailMaxAttachSize' is not a number, value is: " + maxAttachSize);
                    Log.Warn("Setting default value to: 6");
                    maxAttachSize = 6;
                }
                const sameGroupingKey = lastReadDocument.groupedFields.every((v, i) => v === currentDocument.groupedFields[i]);
                if (deliveryMethod === "SM") {
                    const attachMaxSizeReached = (attachSize >= maxAttachSize * 1024 * 1024);
                    return (!sameGroupingKey || attachMaxSizeReached);
                }
                else {
                    return !sameGroupingKey;
                }
            }
            function GetGroupableRecords(deliveryMethod, groupingKey) {
                // It's important not to create "AsProcessAdmin" because subaccounts don't have to group for brothers subaccounts
                const processQuery = Process.CreateQuery();
                const processID = "CD#" + Process.GetProcessID("DD - SenderForm");
                const filterForDMPortal = "(&(Delivery_method__=PORTAL)(State=100))";
                const filterForDMEmail = "(&(Delivery_method__=SM)(State=90))";
                const filterToUse = (deliveryMethod === "SM") ? filterForDMEmail : filterForDMPortal;
                const filter = `(&(Email_grouping_state__=GROUPABLE_WAITING)(Deleted=0)${filterToUse})`;
                let order = "";
                for (const groupField of groupingKey) {
                    order += `${groupField} ASC, `;
                }
                Log.Info(`Query for delivery method ${deliveryMethod} is:`);
                Log.Info(`   > filter: ${filter}`);
                Log.Info(`   > order:  ${order}`);
                processQuery.SetSpecificTable(processID);
                processQuery.SetFilter(filter);
                processQuery.SetSearchInArchive(false);
                processQuery.SetAttributesList("*");
                processQuery.SetSortOrder(order);
                processQuery.SetOptionEx("Limit=-1");
                processQuery.SetOptionEx("DONOTGETLOCALDBFILES=1");
                const eddRecords = processQuery.MoveFirst();
                if (!eddRecords) {
                    throw new Error("Unable to query groupables records, error: " + processQuery.GetLastErrorMessage());
                }
                return processQuery;
            }
            function GetAttachmentFilesForGrouping(documentType, attachList) {
                let attachmentForGrouping = [];
                let attachmentFiles = [];
                const nbAttach = attachList.GetNbAttachs();
                const documentAttachIndex = GetDocumentAttachIndex(attachList, nbAttach, documentType);
                for (let i = 0; i < nbAttach; i++) {
                    if (documentAttachIndex === i || Sys.DD.GetParameter("AddAttachmentsWithEmail", false)) {
                        attachmentForGrouping.push(attachList.GetAttach(i));
                    }
                }
                const invoiceRelatedDocumentsInfo = Sys.Outbound.Document.GetRelatedDocumentsGroupingInfoFromAttachments(attachmentForGrouping);
                attachmentFiles = attachmentFiles.concat(invoiceRelatedDocumentsInfo);
                return attachmentFiles;
            }
            function GetDocumentAttachIndex(attachList, nbAttach, documentType) {
                let index;
                for (index = 0; index < nbAttach; index++) {
                    let attach = attachList.GetAttach(index);
                    let attachVars = attach.GetVars();
                    let attachDocumentType = attachVars.GetValue_String("DocumentType", 0) || "";
                    if (attachDocumentType.toLowerCase() === documentType.toLowerCase()) {
                        return index;
                    }
                }
                return 0;
            }
            Main();
        })(Extraction = EmailGrouping.Extraction || (EmailGrouping.Extraction = {}));
    })(EmailGrouping = DD.EmailGrouping || (DD.EmailGrouping = {}));
})(DD || (DD = {}));
//# sourceMappingURL=extractionscript.js.map