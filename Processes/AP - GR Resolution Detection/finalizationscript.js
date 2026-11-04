"use strict";
const PROCESS_TIMEOUT_SECONDS = 3600;
Process.SetTimeOut(PROCESS_TIMEOUT_SECONDS);
const QUEUE_TABLE = "AP - GR Resolution Queue__";
const PO_ITEMS_TABLE = "PAC - PO - Items__";
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MIN_WAITING_DAYS = 1;
const DEFAULT_REMINDER_HOURS = 24;
const RESOLVED_RETENTION_DAYS = 1;
// An invoice holding one of these statuses must not be queued again.
const BLOCKING_STATUSES = ["Pending" /* QueueStatus.Pending */, "Sent" /* QueueStatus.Sent */, "InConversation" /* QueueStatus.InConversation */, "Resolved" /* QueueStatus.Resolved */];
function getSchedulerParameters() {
    const reportParameter = Variable.GetValueAsString("reportParameter");
    if (!reportParameter) {
        return {};
    }
    try {
        const parsedParameters = JSON.parse(reportParameter);
        return parsedParameters && typeof parsedParameters === "object" && !Array.isArray(parsedParameters)
            ? parsedParameters
            : {};
    }
    catch (error) {
        Log.Warn(`Invalid scheduled task process parameter, default values will be used: ${error}`);
        return {};
    }
}
function getPositiveNumberParameter(value, defaultValue) {
    const parsedValue = Number.parseInt(String(value), 10);
    return parsedValue > 0 ? parsedValue : defaultValue;
}
function getNonNegativeNumberParameter(value, defaultValue) {
    const parsedValue = Number.parseInt(String(value), 10);
    return parsedValue >= 0 ? parsedValue : defaultValue;
}
function computeCutoffDate(daysBack) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack, now.getHours(), now.getMinutes(), now.getSeconds());
}
function computeReminderCutoff(hoursBack) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - hoursBack, now.getMinutes(), now.getSeconds());
}
// The scheduled report already applied the detection filter, its CSV output is the candidate list.
function readCandidatesFromReport() {
    const csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
    csvReader.ReturnSeparator = "\n";
    csvReader.GuessSeparator();
    const invoices = [];
    let line = csvReader.GetNextLine();
    while (line || line === "") {
        const columns = csvReader.GetCurrentLineArray();
        if (columns === null || columns === void 0 ? void 0 : columns[0]) {
            invoices.push({
                ruidEx: "",
                msnEx: columns[0],
                orderNumbers: Lib.AP.GetOrderNumbersAsArray(columns[1]),
                companyCode: columns[2],
                vendorNumber: columns[3],
                invoiceNumber: columns[4]
            });
        }
        line = csvReader.GetNextLine();
    }
    return invoices;
}
// A report cannot expose RuidEx, and the set aside date is read here rather than parsed from the localized CSV.
function completeInvoicesFromDatabase(invoices, minWaitingDays) {
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable("CDNAME#Vendor invoice");
    query.SetAttributesList("RuidEx,MsnEx,SetAsideDate__");
    query.SetFilter(Sys.Helpers.LdapUtil.FilterIn("MsnEx", invoices.map(invoice => invoice.msnEx)).toString());
    if (!query.MoveFirst()) {
        return [];
    }
    const cutoffDate = Sys.Helpers.Date.Date2DBDateTime(computeCutoffDate(minWaitingDays));
    const eligibleByMsnEx = {};
    let transport = query.MoveNext();
    while (transport) {
        const vars = transport.GetVars(false);
        if (vars.GetValue_String("SetAsideDate__", 0) < cutoffDate) {
            eligibleByMsnEx[vars.GetValue_String("MsnEx", 0)] = vars.GetValue_String("RuidEx", 0);
        }
        transport = query.MoveNext();
    }
    return invoices.filter(invoice => {
        invoice.ruidEx = eligibleByMsnEx[invoice.msnEx];
        return !!invoice.ruidEx;
    });
}
function getOrderKey(companyCode, orderNumber) {
    return `${companyCode}|${orderNumber}`;
}
function collectOrderNumbers(invoices) {
    const seen = {};
    const orderNumbers = [];
    invoices.forEach(invoice => {
        invoice.orderNumbers.forEach(orderNumber => {
            if (orderNumber && !seen[orderNumber]) {
                seen[orderNumber] = true;
                orderNumbers.push(orderNumber);
            }
        });
    });
    return orderNumbers;
}
// Only lines that can still be received in Esker Procurement are relevant, the same exclusions as the "items to receive" list apply.
function getReceivablePOItemsByOrder(orderNumbers) {
    const itemsByOrder = {};
    if (orderNumbers.length === 0) {
        return itemsByOrder;
    }
    const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("PONumber__", orderNumbers), Sys.Helpers.LdapUtil.FilterEqual("Status__", "To receive"), Sys.Helpers.LdapUtil.FilterNotEqual("NoGoodsReceipt__", "1"), Sys.Helpers.LdapUtil.FilterNotEqual("IsInternal__", "1"), Sys.Helpers.LdapUtil.FilterNotEqual("AsyncProcessingLock__", "1")).toString();
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable(PO_ITEMS_TABLE);
    query.SetAttributesList("CompanyCode__,PONumber__,RecipientDN__,BuyerDN__");
    query.SetFilter(filter);
    if (!query.MoveFirst()) {
        return itemsByOrder;
    }
    let record = query.MoveNextRecord();
    while (record) {
        const vars = record.GetVars();
        const item = {
            companyCode: vars.GetValue_String("CompanyCode__", 0),
            poNumber: vars.GetValue_String("PONumber__", 0),
            recipientDN: vars.GetValue_String("RecipientDN__", 0),
            buyerDN: vars.GetValue_String("BuyerDN__", 0)
        };
        const orderKey = getOrderKey(item.companyCode, item.poNumber);
        if (!itemsByOrder[orderKey]) {
            itemsByOrder[orderKey] = [];
        }
        itemsByOrder[orderKey].push(item);
        record = query.MoveNextRecord();
    }
    return itemsByOrder;
}
function getQueueEntryKey(invoiceMsnEx, contactLogin) {
    return `${invoiceMsnEx}|${contactLogin.toLowerCase()}`;
}
// Entries are read for the whole batch at once to avoid one query per invoice.
function getBlockingQueueEntries(invoices) {
    const blockingEntries = {};
    const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("InvoiceMsnEx__", invoices.map(invoice => invoice.msnEx)), Sys.Helpers.LdapUtil.FilterIn("Status__", BLOCKING_STATUSES)).toString();
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable(QUEUE_TABLE);
    query.SetAttributesList("InvoiceMsnEx__,ContactUserLogin__,Status__");
    query.SetFilter(filter);
    if (!query.MoveFirst()) {
        return blockingEntries;
    }
    let record = query.MoveNextRecord();
    while (record) {
        const vars = record.GetVars();
        const key = getQueueEntryKey(vars.GetValue_String("InvoiceMsnEx__", 0), vars.GetValue_String("ContactUserLogin__", 0));
        blockingEntries[key] = vars.GetValue_String("Status__", 0);
        record = query.MoveNextRecord();
    }
    return blockingEntries;
}
// Invoices already tracked by an entry, whatever the contact it was created for.
function getTrackedInvoiceMsnEx() {
    const trackedMsnEx = {};
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable(QUEUE_TABLE);
    query.SetAttributesList("InvoiceMsnEx__");
    query.SetFilter(Sys.Helpers.LdapUtil.FilterIn("Status__", BLOCKING_STATUSES).toString());
    query.SetOptionEx("Limit=-1");
    if (!query.MoveFirst()) {
        return trackedMsnEx;
    }
    let record = query.MoveNextRecord();
    while (record) {
        trackedMsnEx[record.GetVars().GetValue_String("InvoiceMsnEx__", 0)] = true;
        record = query.MoveNextRecord();
    }
    return trackedMsnEx;
}
// A notified invoice stays set aside, so it stays in the report: without this ordering every run would refill
// the batch with the same invoices and the ones beyond the batch size would never be reached. Tracked invoices
// are kept last rather than excluded, so a contact still awaiting a first notification is not lost either.
function selectBatch(candidates, batchSize) {
    if (candidates.length <= batchSize) {
        return candidates;
    }
    const trackedMsnEx = getTrackedInvoiceMsnEx();
    const untracked = [];
    const tracked = [];
    candidates.forEach(candidate => {
        (trackedMsnEx[candidate.msnEx] ? tracked : untracked).push(candidate);
    });
    return untracked.concat(tracked).slice(0, batchSize);
}
// Reminder throttling relies on the queue itself: the most recent attempt recorded for a contact is their last communication.
function getLastCommunicationByContact(logins) {
    const lastCommunication = {};
    if (logins.length === 0) {
        return lastCommunication;
    }
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable(QUEUE_TABLE);
    query.SetAttributesList("ContactUserLogin__,LastAttemptDateTime__");
    query.SetFilter(Sys.Helpers.LdapUtil.FilterIn("ContactUserLogin__", logins).toString());
    if (!query.MoveFirst()) {
        return lastCommunication;
    }
    let record = query.MoveNextRecord();
    while (record) {
        const vars = record.GetVars();
        const login = vars.GetValue_String("ContactUserLogin__", 0).toLowerCase();
        const attemptDate = vars.GetValue_String("LastAttemptDateTime__", 0);
        if (attemptDate && (!lastCommunication[login] || attemptDate > lastCommunication[login])) {
            lastCommunication[login] = attemptDate;
        }
        record = query.MoveNextRecord();
    }
    return lastCommunication;
}
function getInvoiceLines(invoice, itemsByOrder) {
    let lines = [];
    invoice.orderNumbers.forEach(orderNumber => {
        lines = lines.concat(itemsByOrder[getOrderKey(invoice.companyCode, orderNumber)] || []);
    });
    return lines;
}
// Mirrors Lib.Purchasing.ReceivingItems.BuyerCanReceiveOnBehalf, which cannot be reused here as it only runs client side.
function buyerCanReceiveOnBehalf() {
    const userExitResult = Sys.Helpers.TryCallFunction("Lib.GR.Customization.Common.AllowBuyerToReceiveOnBehalfOfRecipient");
    if (Sys.Helpers.IsBoolean(userExitResult)) {
        return userExitResult;
    }
    return Sys.Parameters.GetInstance("PAC").GetParameterBool("AllowBuyerToReceiveOnBehalfOfRecipient", false);
}
function collectCandidates(lines, source, getDN) {
    const candidates = [];
    const seenDNs = {};
    for (const line of lines) {
        const dn = getDN(line);
        const normalizedDN = (dn || "").toLowerCase();
        if (normalizedDN && !seenDNs[normalizedDN]) {
            seenDNs[normalizedDN] = true;
            candidates.push({ dn: dn, source: source });
        }
    }
    return candidates;
}
function getRecipientCandidates(lines) {
    return collectCandidates(lines, "ItemRecipient" /* ContactResolutionSource.ItemRecipient */, line => line.recipientDN);
}
function getBuyerCandidates(lines) {
    return collectCandidates(lines, "ItemBuyer" /* ContactResolutionSource.ItemBuyer */, line => line.buyerDN);
}
function isGroup(user) {
    return user.GetValue("IsGroup") === "1";
}
// OOTO status is ignored for now: only a single real user is resolved per candidate.
function getContactInfo(candidate, attempts) {
    const candidateLogin = Sys.Helpers.String.ExtractLoginFromDN(candidate.dn);
    if (!candidateLogin) {
        attempts.push(`${candidate.source}: invalid DN`);
        return null;
    }
    const user = Users.GetUser(candidateLogin);
    if (!user) {
        attempts.push(`${candidate.source}: user "${candidateLogin}" not found`);
        return null;
    }
    if (isGroup(user)) {
        // Groups are not registered in Teams and cannot be a direct messaging recipient.
        attempts.push(`${candidate.source}: group recipient "${candidateLogin}" is not supported`);
        return null;
    }
    const login = user.GetValue("Login");
    if (!login) {
        attempts.push(`${candidate.source}: resolved user has no login`);
        return null;
    }
    return {
        login: login,
        source: candidate.source
    };
}
// Every receiver of a line still awaiting reception is a contact, so one invoice can involve several people.
function resolveContact(lines, allowBuyer) {
    const attempts = [];
    const contacts = [];
    const seenLogins = {};
    const addContacts = function (candidates) {
        for (const candidate of candidates) {
            const contact = getContactInfo(candidate, attempts);
            if (contact && !seenLogins[contact.login.toLowerCase()]) {
                seenLogins[contact.login.toLowerCase()] = true;
                contacts.push(contact);
            }
        }
    };
    addContacts(getRecipientCandidates(lines));
    // The buyer is only a fallback, and only when the account allows receiving on behalf of the recipient.
    if (contacts.length === 0 && allowBuyer) {
        addContacts(getBuyerCandidates(lines));
    }
    if (contacts.length === 0 && attempts.length === 0) {
        attempts.push(allowBuyer ? "no recipient or buyer DN found" : "no recipient DN found and buyer fallback is disabled");
    }
    return { contacts: contacts, attempts: attempts };
}
// Contacts are grouped so that a person responsible for several blocked invoices receives a single message.
function buildContactWorkloads(invoices, itemsByOrder, counters) {
    const workloads = {};
    const allowBuyer = buyerCanReceiveOnBehalf();
    invoices.forEach(invoice => {
        const resolution = resolveContact(getInvoiceLines(invoice, itemsByOrder), allowBuyer);
        if (resolution.contacts.length === 0) {
            counters.skipped++;
            const details = resolution.attempts.length > 0 ? resolution.attempts.join("; ") : "no receivable purchase order line";
            Log.Warn(`Invoice ${invoice.msnEx} (${invoice.invoiceNumber}) is unresolvable for orders [${invoice.orderNumbers.join(", ")}]: ${details}.`);
            return;
        }
        resolution.contacts.forEach(contact => {
            const key = contact.login.toLowerCase();
            if (!workloads[key]) {
                workloads[key] = { contact: contact, invoices: [] };
            }
            workloads[key].invoices.push(invoice);
        });
    });
    return workloads;
}
function createQueueEntry(invoice, contact) {
    const record = Process.CreateTableRecordAsProcessAdmin(QUEUE_TABLE);
    if (!record) {
        Log.Error(`Cannot create a ${QUEUE_TABLE} record for invoice ${invoice.msnEx}.`);
        return "";
    }
    const now = new Date();
    const vars = record.GetVars();
    vars.AddValue_String("InvoiceMsnEx__", invoice.msnEx, true);
    vars.AddValue_String("InvoiceRuid__", invoice.ruidEx, true);
    vars.AddValue_String("OrderNumber__", invoice.orderNumbers.join(","), true);
    vars.AddValue_String("InvoiceNumber__", invoice.invoiceNumber, true);
    vars.AddValue_String("ContactUserLogin__", contact.login, true);
    vars.AddValue_String("Status__", "Pending" /* QueueStatus.Pending */, true);
    vars.AddValue_Date("QueuedDateTime__", now, true);
    vars.AddValue_Date("LastAttemptDateTime__", now, true);
    record.Commit();
    if (record.GetLastError()) {
        Log.Error(`Cannot commit the ${QUEUE_TABLE} record for invoice ${invoice.msnEx}: ${record.GetLastError()}`);
        return "";
    }
    return vars.GetValue_String("ruidex", 0);
}
function updateQueueEntry(queueEntryRuidEx, values) {
    const record = Process.GetUpdatableTableRecord(queueEntryRuidEx);
    if (!record) {
        Log.Error(`Cannot update the ${QUEUE_TABLE} record ${queueEntryRuidEx}.`);
        return;
    }
    const vars = record.GetVars();
    if (values.status) {
        vars.AddValue_String("Status__", values.status, true);
        if ((values.status === "Resolved" /* QueueStatus.Resolved */ || values.status === "Failed" /* QueueStatus.Failed */ || values.status === "Expired" /* QueueStatus.Expired */) && !vars.GetValue_Date("PurgeDateTime__", 0)) {
            vars.AddValue_Date("PurgeDateTime__", new Date(), true);
        }
    }
    if (values.errorMessage) {
        vars.AddValue_String("ErrorMessage__", values.errorMessage, true);
    }
    record.Commit();
    if (record.GetLastError()) {
        Log.Error(`Cannot commit the update of the ${QUEUE_TABLE} record ${queueEntryRuidEx}: ${record.GetLastError()}`);
    }
}
function reconcileActiveQueueEntries() {
    const queueEntries = [];
    const queueQuery = Process.CreateQueryAsProcessAdmin();
    queueQuery.SetSpecificTable(QUEUE_TABLE);
    queueQuery.SetAttributesList("RuidEx,InvoiceMsnEx__");
    queueQuery.SetFilter(Sys.Helpers.LdapUtil.FilterIn("Status__", ["Pending" /* QueueStatus.Pending */, "Sent" /* QueueStatus.Sent */, "InConversation" /* QueueStatus.InConversation */]).toString());
    queueQuery.SetOptionEx("Limit=-1");
    if (queueQuery.MoveFirst()) {
        let queueRecord = queueQuery.MoveNextRecord();
        while (queueRecord) {
            const vars = queueRecord.GetVars();
            queueEntries.push({
                ruidEx: vars.GetValue_String("RuidEx", 0),
                invoiceMsnEx: vars.GetValue_String("InvoiceMsnEx__", 0)
            });
            queueRecord = queueQuery.MoveNextRecord();
        }
    }
    const waitingInvoices = {};
    if (queueEntries.length > 0) {
        const invoiceQuery = Process.CreateQueryAsProcessAdmin();
        invoiceQuery.SetSpecificTable("CDNAME#Vendor invoice");
        invoiceQuery.SetAttributesList("MsnEx");
        invoiceQuery.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("MsnEx", queueEntries.map(entry => entry.invoiceMsnEx)), Sys.Helpers.LdapUtil.FilterEqual("State", "70"), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", "Set aside"), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("AsideReason__", Lib.AP.AsideReason.WaitingForGR), Sys.Helpers.LdapUtil.FilterEqual("AsideReason__", Sys.FRB2B.AP.MapStandardToFRB2BOnHoldReasons.WaitingForGR))).toString());
        invoiceQuery.SetOptionEx("Limit=-1");
        if (invoiceQuery.MoveFirst()) {
            let invoice = invoiceQuery.MoveNext();
            while (invoice) {
                waitingInvoices[invoice.GetVars(false).GetValue_String("MsnEx", 0)] = true;
                invoice = invoiceQuery.MoveNext();
            }
        }
    }
    let resolvedCount = 0;
    queueEntries.forEach(entry => {
        if (!waitingInvoices[entry.invoiceMsnEx]) {
            updateQueueEntry(entry.ruidEx, { status: "Resolved" /* QueueStatus.Resolved */ });
            resolvedCount++;
        }
    });
    Log.Info(`${resolvedCount} active queue entry(ies) resolved.`);
}
// Resolved entries have no diagnostic value once the GR is confirmed, so they are cleared well before the table's 1-month native purge (which still covers Failed/Expired as a safety net).
function deleteResolvedQueueEntries() {
    const cutoffDate = Sys.Helpers.Date.Date2DBDateTime(computeCutoffDate(RESOLVED_RETENTION_DAYS));
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable(QUEUE_TABLE);
    query.SetAttributesList("RuidEx");
    query.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Status__", "Resolved" /* QueueStatus.Resolved */), Sys.Helpers.LdapUtil.FilterExist("PurgeDateTime__"), Sys.Helpers.LdapUtil.FilterStrictlyLesser("PurgeDateTime__", cutoffDate)).toString());
    query.SetOptionEx("Limit=-1");
    if (!query.MoveFirst()) {
        return;
    }
    let deletedCount = 0;
    let record = query.MoveNextRecord();
    while (record) {
        const ruidEx = record.GetVars().GetValue_String("RuidEx", 0);
        const transport = Process.GetUpdatableTableRecord(ruidEx);
        if (transport) {
            transport.Delete();
            if (transport.GetLastError()) {
                Log.Error(`Cannot delete the ${QUEUE_TABLE} record ${ruidEx}: ${transport.GetLastError()}`);
            }
            else {
                deletedCount++;
            }
        }
        record = query.MoveNextRecord();
    }
    Log.Info(`${deletedCount} resolved queue entry(ies) deleted.`);
}
// SendNotifToUser embeds the message in a command line argument, so double quotes would break the notification.
function sanitizeForNotification(text) {
    return (text || "").replace(/["\r\n]/g, " ").trim();
}
function buildConsolidatedMessage(invoices) {
    const lines = invoices.map(invoice => {
        const invoiceNumber = sanitizeForNotification(invoice.invoiceNumber) || sanitizeForNotification(invoice.msnEx);
        const orders = sanitizeForNotification(invoice.orderNumbers.join(", "));
        return `- Invoice ${invoiceNumber} - purchase order ${orders}`;
    });
    const header = invoices.length === 1
        ? "An invoice cannot be processed because the goods receipt is missing:"
        : `${invoices.length} invoices cannot be processed because their goods receipts are missing:`;
    return [
        header,
        "",
        lines.join("\n"),
        "",
        "If you have received these goods, I can record the reception for you. Tell me which ones are received and I will take care of it."
    ].join("\n");
}
function sendConsolidatedNotification(workload, queueEntryRuidExs) {
    const user = Users.GetUserAsProcessAdmin(workload.contact.login);
    if (!user) {
        const errorMessage = Language.Translate("_Cannot find EOD user {0}.", false, workload.contact.login);
        Log.Error(errorMessage);
        queueEntryRuidExs.forEach(ruidEx => updateQueueEntry(ruidEx, { status: "Failed" /* QueueStatus.Failed */, errorMessage: errorMessage }));
        return false;
    }
    try {
        const notificationCreated = Sys.TeamsNotification.SendNotifToUser({
            user: user,
            body: { message: buildConsolidatedMessage(workload.invoices) }
        });
        if (!notificationCreated) {
            throw new Error(Language.Translate("_Teams notification request was not created.", false));
        }
        queueEntryRuidExs.forEach(ruidEx => updateQueueEntry(ruidEx, { status: "Sent" /* QueueStatus.Sent */ }));
        return true;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Log.Error(`Cannot send Teams notification to ${workload.contact.login}: ${errorMessage}`);
        queueEntryRuidExs.forEach(ruidEx => updateQueueEntry(ruidEx, { status: "Failed" /* QueueStatus.Failed */, errorMessage: errorMessage }));
        return false;
    }
}
function processContact(workload, blockingEntries, lastCommunication, reminderCutoff, counters) {
    const invoicesToQueue = workload.invoices.filter(invoice => {
        const blockingStatus = blockingEntries[getQueueEntryKey(invoice.msnEx, workload.contact.login)];
        if (blockingStatus) {
            counters.skipped++;
            Log.Info(`Invoice ${invoice.msnEx} is already queued for ${workload.contact.login} with status "${blockingStatus}".`);
        }
        return !blockingStatus;
    });
    if (invoicesToQueue.length === 0) {
        return;
    }
    if (lastCommunication && lastCommunication > reminderCutoff) {
        counters.skipped += invoicesToQueue.length;
        const invoiceNumbers = invoicesToQueue.map(invoice => invoice.invoiceNumber || invoice.msnEx).join(", ");
        Log.Info(`${workload.contact.login} was already contacted on ${lastCommunication}, ${invoicesToQueue.length} invoice(s) postponed to respect the reminder interval: ${invoiceNumbers}.`);
        return;
    }
    const queueEntryRuidExs = [];
    invoicesToQueue.forEach(invoice => {
        const queueEntryRuidEx = createQueueEntry(invoice, workload.contact);
        if (queueEntryRuidEx) {
            queueEntryRuidExs.push(queueEntryRuidEx);
        }
        else {
            counters.errors++;
        }
    });
    if (queueEntryRuidExs.length === 0) {
        return;
    }
    if (!sendConsolidatedNotification(workload, queueEntryRuidExs)) {
        counters.errors += queueEntryRuidExs.length;
        return;
    }
    counters.queued += queueEntryRuidExs.length;
    Log.Info(`${queueEntryRuidExs.length} invoice(s) notified to ${workload.contact.login} (${workload.contact.source}).`);
}
function run() {
    Log.Info("Starting detection of invoices waiting for goods receipt.");
    reconcileActiveQueueEntries();
    deleteResolvedQueueEntries();
    const schedulerParameters = getSchedulerParameters();
    const batchSize = getPositiveNumberParameter(schedulerParameters.batchSize, DEFAULT_BATCH_SIZE);
    const minWaitingDays = getNonNegativeNumberParameter(schedulerParameters.minWaitingDays, DEFAULT_MIN_WAITING_DAYS);
    const reminderHours = getPositiveNumberParameter(schedulerParameters.reminderHours, DEFAULT_REMINDER_HOURS);
    const candidates = readCandidatesFromReport();
    const batch = selectBatch(candidates, batchSize);
    const invoices = batch.length > 0 ? completeInvoicesFromDatabase(batch, minWaitingDays) : [];
    const counters = { detected: candidates.length, queued: 0, skipped: candidates.length - invoices.length, errors: 0 };
    if (candidates.length > batch.length) {
        Log.Info(`${candidates.length - batch.length} invoice(s) deferred to a next run by the batch size of ${batchSize}.`);
    }
    if (invoices.length === 0) {
        Log.Info(`No invoice waiting for goods receipt to process (${counters.detected} detected, all skipped).`);
        return;
    }
    const itemsByOrder = getReceivablePOItemsByOrder(collectOrderNumbers(invoices));
    const workloads = buildContactWorkloads(invoices, itemsByOrder, counters);
    const contactLogins = Object.keys(workloads).map(key => workloads[key].contact.login);
    const blockingEntries = getBlockingQueueEntries(invoices);
    const lastCommunication = getLastCommunicationByContact(contactLogins);
    const reminderCutoff = Sys.Helpers.Date.Date2DBDateTime(computeReminderCutoff(reminderHours));
    for (const key in workloads) {
        if (!Object.prototype.hasOwnProperty.call(workloads, key)) {
            continue;
        }
        try {
            processContact(workloads[key], blockingEntries, lastCommunication[key], reminderCutoff, counters);
        }
        catch (error) {
            counters.errors++;
            Log.Error(`Unexpected error while processing contact ${workloads[key].contact.login}: ${error}`);
        }
    }
    Log.Info(`Detection of invoices waiting for goods receipt completed. Detected: ${counters.detected}, queued: ${counters.queued}, skipped: ${counters.skipped}, errors: ${counters.errors}.`);
}
run();
//# sourceMappingURL=finalizationscript.js.map