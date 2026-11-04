"use strict";
function readPaidInvoicesForDay(processName) {
    const table = "CDNAME#" + processName;
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable(table);
    query.SetSearchInArchive(true);
    query.SetAttributesList("RUIDEX,PortalRuidEx__,InvoiceNumber__,InvoiceDate__,InvoiceAmount__,InvoiceCurrency__,PaymentDate__,PaymentMethod__,PaymentReference__,VendorNumber__,VendorName__,CompanyCode__,PendingDailyPaymentNotification__,Configuration__");
    query.SetFilter("&(Deleted=0)(State<=100)(InvoiceStatus__=" + Lib.AP.InvoiceStatus.Paid + ")(PendingDailyPaymentNotification__=1)");
    query.SetOptionEx("DoNotGetLocalDBFiles=1");
    query.SetOptionEx("FastSearch=1");
    query.SetOptionEx("Limit=-1");
    const results = [];
    if (!query.MoveFirst()) {
        return results;
    }
    let rec = query.MoveNext();
    while (rec) {
        const vars = rec.GetUninheritedVars();
        results.push({
            ruidex: vars.GetValue_String("RUIDEX", 0),
            portalRuidex: vars.GetValue_String("PortalRuidEx__", 0),
            invoiceNumber: vars.GetValue_String("InvoiceNumber__", 0),
            invoiceDate: vars.GetValue_Date("InvoiceDate__", 0),
            invoiceAmount: vars.GetValue_Double("InvoiceAmount__", 0),
            invoiceCurrency: vars.GetValue_String("InvoiceCurrency__", 0),
            paymentDate: vars.GetValue_Date("PaymentDate__", 0),
            paymentMethod: vars.GetValue_String("PaymentMethod__", 0),
            paymentReference: vars.GetValue_String("PaymentReference__", 0),
            vendorNumber: vars.GetValue_String("VendorNumber__", 0),
            vendorName: vars.GetValue_String("VendorName__", 0),
            companyCode: vars.GetValue_String("CompanyCode__", 0),
            configuration: vars.GetValue_String("Configuration__", 0)
        });
        vars.AddValue_String("PendingDailyPaymentNotification__", "0", true);
        rec.ProcessAsync("PendingDailyPaymentNotification__");
        rec = query.MoveNext();
    }
    return results;
}
function groupInvoicesBySupplier(lines) {
    const map = {};
    for (const line of lines) {
        const key = line.companyCode + "|" + line.vendorNumber;
        if (!map[key]) {
            map[key] = {
                key: key,
                vendorNumber: line.vendorNumber,
                vendorName: line.vendorName,
                companyCode: line.companyCode,
                configuration: line.configuration,
                lines: []
            };
        }
        map[key].lines.push(line);
    }
    const groups = [];
    for (const mapKey in map) {
        if (Object.prototype.hasOwnProperty.call(map, mapKey)) {
            groups.push(map[mapKey]);
        }
    }
    return groups;
}
function escapeHtml(value) {
    return Sys.Helpers.String.EscapeValueForHTML(value || "");
}
function sanitizeUrlForHref(url) {
    const trimmedUrl = (url || "").trim();
    if (!trimmedUrl) {
        return "";
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
        Log.Warn("[DailyPaidInvoicesNotification] Ignoring unsupported portal URL in email content");
        return "";
    }
    return encodeURI(trimmedUrl);
}
function buildInvoiceLinesHtml(lines, vendorUser) {
    const dateOptions = {
        dateFormat: "ShortDate",
        timeFormat: "None",
        timeZone: "User"
    };
    const language = vendorUser.GetValue("Language");
    const viewInvoiceLabel = escapeHtml(Language.TranslateInto("TRAD_CLICKCINVOICEDETAILS", language, false));
    let html = "";
    for (const line of lines) {
        const invoiceDate = escapeHtml(line.invoiceDate ? vendorUser.GetFormattedDate(line.invoiceDate, dateOptions) : "");
        const paymentDate = escapeHtml(line.paymentDate ? vendorUser.GetFormattedDate(line.paymentDate, dateOptions) : "");
        const amount = escapeHtml(vendorUser.GetFormattedNumber(line.invoiceAmount));
        const paymentMethod = escapeHtml(line.paymentMethod ? Language.TranslateInto(line.paymentMethod, language, false) : "");
        const portalUrl = sanitizeUrlForHref(line.portalRuidex ? vendorUser.GetProcessURL(line.portalRuidex, true) : "");
        const invoiceNumber = escapeHtml(line.invoiceNumber);
        const invoiceCurrency = escapeHtml(line.invoiceCurrency);
        const paymentReference = escapeHtml(line.paymentReference || "");
        html += "<tr>";
        html += "<td style=\"padding: 4px 8px; border-bottom: 1px solid #e6eaeb;\">" + invoiceNumber + "</td>";
        html += "<td style=\"padding: 4px 8px; border-bottom: 1px solid #e6eaeb;\">" + invoiceDate + "</td>";
        html += "<td style=\"padding: 4px 8px; border-bottom: 1px solid #e6eaeb; text-align:right;\">" + invoiceCurrency + " " + amount + "</td>";
        html += "<td style=\"padding: 4px 8px; border-bottom: 1px solid #e6eaeb;\">" + paymentDate + "</td>";
        html += "<td style=\"padding: 4px 8px; border-bottom: 1px solid #e6eaeb;\">" + paymentMethod + "</td>";
        html += "<td style=\"padding: 4px 8px; border-bottom: 1px solid #e6eaeb;\">" + paymentReference + "</td>";
        html += "<td style=\"padding: 4px 8px; border-bottom: 1px solid #e6eaeb;\">" + (portalUrl ? "<a href=\"" + portalUrl + "\">" + viewInvoiceLabel + "</a>" : "") + "</td>";
        html += "</tr>";
    }
    return html;
}
function sendDailyMailForSupplier(group, processDate) {
    const userParameters = {
        VendorNumber__: group.vendorNumber,
        VendorName__: group.vendorName,
        CompanyCode__: group.companyCode
    };
    const vendorUser = Lib.AP.VendorPortal.GetVendorUserWithTolerance(userParameters);
    if (!vendorUser) {
        Log.Warn("[DailyPaidInvoicesNotification] No vendor contact found for " + group.vendorNumber + " / " + group.companyCode);
        return;
    }
    const vendorEmail = Lib.P2P.computeVendorEmailRedirection(vendorUser.GetValue("EmailAddress"));
    if (!vendorEmail) {
        Log.Warn("[DailyPaidInvoicesNotification] No email for vendor contact " + vendorUser.GetValue("ShortLogin"));
        return;
    }
    const companyName = Lib.AP.VendorPortal.GetCompanyName(group.companyCode);
    const dateLabel = vendorUser.GetFormattedDate(processDate, {
        dateFormat: "ShortDate",
        timeFormat: "None",
        timeZone: "User"
    });
    const subject = Language.TranslateInto("TRAD_NOTIFVENDOR", vendorUser.GetValue("Language"), false) + " - " + dateLabel;
    const emailOptions = {
        "subject": subject,
        "template": "AP-Vendor_InvoicePaid.htm",
        "customTags": {
            CompanyName__: companyName
        },
        "data": group
    };
    const emailSender = {
        senderName: null,
        senderAddress: null
    };
    const doSendNotif = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.OnSendDailyVendorNotification", emailOptions, emailSender);
    if (doSendNotif !== false) {
        emailOptions.customTags = Sys.EmailNotification.EscapeCustomTags(emailOptions.customTags);
        emailOptions.customTags.invoiceLines = buildInvoiceLinesHtml(group.lines, vendorUser);
        const email = Sys.EmailNotification.CreateEmailWithUser(vendorUser, vendorEmail, emailOptions.subject, emailOptions.template, emailOptions.customTags, false);
        if (email) {
            if ((emailSender === null || emailSender === void 0 ? void 0 : emailSender.senderName) && (emailSender === null || emailSender === void 0 ? void 0 : emailSender.senderAddress)) {
                Sys.EmailNotification.AddSender(email, emailSender.senderAddress, emailSender.senderName);
            }
            Sys.EmailNotification.SendEmail(email);
        }
        Log.Info("[DailyPaidInvoicesNotification] Sent daily paid invoices email to " + vendorEmail + " for " + group.lines.length + " invoice(s)");
    }
}
function Run() {
    const processName = Variable.GetValueAsString("VendorInvoiceProcessName") || "Vendor invoice";
    const daysOffset = Number.parseInt(Variable.GetValueAsString("SendForDaysOffset") || "0", 10);
    const processDate = new Date();
    processDate.setDate(processDate.getDate() + daysOffset);
    Log.Info("[DailyPaidInvoicesNotification] Running for date " + Sys.Helpers.Date.Date2DBDate(processDate));
    const lines = readPaidInvoicesForDay(processName);
    if (lines.length === 0) {
        Log.Info("[DailyPaidInvoicesNotification] No paid invoices found");
        Data.SetValue("KeepOpenAfterApproval", "ForceClose");
        return;
    }
    const groups = groupInvoicesBySupplier(lines);
    Log.Info("[DailyPaidInvoicesNotification] Found " + lines.length + " invoice(s), " + groups.length + " supplier group(s)");
    for (const group of groups) {
        sendDailyMailForSupplier(group, processDate);
    }
    Data.SetValue("KeepOpenAfterApproval", "ForceClose");
}
Run();
//# sourceMappingURL=finalizationscript.js.map