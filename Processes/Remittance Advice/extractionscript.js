"use strict";
const PaymentData = JSON.parse(Variable.GetValueAsString("ExtractedData"));
function AttachRA() {
    const isAttached = Lib.Purchasing.RA.Server.AttachRA();
    if (!isAttached) {
        Lib.CommonDialog.NextAlert.Define("_Remittance advice attaching error", "_Error attaching remittance advice", { isError: true });
    }
    return isAttached;
}
function SendEmailNotification(subject, template) {
    const customTags = {
        PaymentReference__: PaymentData.ExtractedData.PaymentId,
        Currency__: PaymentData.ExtractedData.Currency,
        VendorNumber__: PaymentData.ExtractedData.VendorId,
        CompanyCode__: PaymentData.ExtractedData.VendorCompanyCode
    };
    const vendorUser = Lib.AP.VendorPortal.GetVendorUser(customTags);
    if (vendorUser) {
        Lib.AP.VendorPortal.AddFormattedValues(customTags, vendorUser);
        customTags.CompanyName__ = Data.GetValue("PayerCompany__ ");
        customTags.PortalUrl = Data.GetValue("ValidationUrl");
        customTags.TotalInvoiceAmount__ = vendorUser.GetFormattedNumber(PaymentData.ExtractedData.TotalInvoiceAmount);
        customTags.PaymentDate__ = Sys.Helpers.Date.ToLocaleDateEx(new Date(PaymentData.ExtractedData.PaymentDate), vendorUser.GetValue("culture"));
        const vendorEmail = Lib.P2P.computeVendorEmailRedirection(vendorUser.GetValue("EmailAddress"));
        if (vendorEmail) {
            const emailOptions = {
                "subject": Language.Translate(subject),
                "template": template,
                "customTags": customTags
            };
            const doSendNotif = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.OnSendVendorNotification", emailOptions);
            if (doSendNotif !== false) {
                const email = Sys.EmailNotification.CreateEmailWithUser(vendorUser, vendorEmail, emailOptions.subject, emailOptions.template, emailOptions.customTags, true);
                if (email) {
                    Sys.EmailNotification.SendEmail(email);
                }
            }
        }
    }
}
Data.SetValue("PaymentDate__", PaymentData.ExtractedData.PaymentDate);
Lib.Purchasing.RA.ComputeInvoicesTable();
AttachRA();
SendEmailNotification("_RemittanceAdviceAvailable", "AP-Vendor_RemittanceAdvicePublished.htm");
//# sourceMappingURL=extractionscript.js.map