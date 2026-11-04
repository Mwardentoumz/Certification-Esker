"use strict";
function SendToApproval() {
    const submissionDate = Helpers.Date.DateToShortFormat(new Date());
    Data.SetValue("SubmissionDateTime__", submissionDate);
    Data.SetValue("Status__", "Approved");
    const ExtractedDataString = Variable.GetValueAsString("ExtractedData");
    const ExtractedData = Sys.Helpers.IsEmpty(ExtractedDataString) ? {} : JSON.parse(ExtractedDataString);
    for (const key in ExtractedData) {
        if (Object.hasOwnProperty.call(ExtractedData, key)) {
            const PaymentData = ExtractedData[key].ExtractedData;
            const VendorInfo = GetVendorInfo(PaymentData.VendorId, PaymentData.VendorCompanyCode);
            const OwnerInformation = GetCompanyAddress(PaymentData.PayerCompanyCode);
            const VendorContactLogin = GetVendorContactLogin(PaymentData.VendorId, PaymentData.VendorCompanyCode);
            FormatOwnerAddress(OwnerInformation);
            if (VendorContactLogin && VendorContactLogin.length > 0) {
                const RemittanceAdvice = Process.CreateProcessInstanceForUser("Remittance Advice", VendorContactLogin[0], 1, false);
                const externalVars = RemittanceAdvice.GetExternalVars();
                externalVars.AddValue_String("VendorContactLogin", VendorContactLogin.toString(), true);
                externalVars.AddValue_String("ExtractedData", JSON.stringify(ExtractedData[key]), true);
                const vars = RemittanceAdvice.GetUninheritedVars();
                vars.AddValue_String("TotalInvoiceAmount__", PaymentData.TotalInvoiceAmount, true);
                vars.AddValue_String("Currency__", PaymentData.Currency, true);
                vars.AddValue_String("PaymentMethodDescription__", PaymentData.PaymentMethodDescription, true);
                vars.AddValue_String("PaymentReference__", PaymentData.PaymentId, true);
                vars.AddValue_String("PayerAddress__", Data.GetValue("PayerAddress__"), true);
                vars.AddValue_String("PayerCompany__", OwnerInformation.CompanyName__, true);
                vars.AddValue_String("PayerCompanyCode__", PaymentData.PayerCompanyCode, true);
                vars.AddValue_String("VendorAddress__", Data.GetValue("VendorAddress__"), true);
                vars.AddValue_String("VendorName__", VendorInfo.VendorName__, true);
                vars.AddValue_String("VendorNumber__", PaymentData.VendorId, true);
                vars.AddValue_String("VendorCompanyCode__", PaymentData.VendorCompanyCode, true);
                RemittanceAdvice.Process();
                const ret = RemittanceAdvice.GetLastError();
                if (ret === 0) {
                    Log.Info("RA process call OK");
                }
                else {
                    Log.Error("RA process call returns with error message : " + RemittanceAdvice.GetLastErrorMessage());
                }
            }
            else {
                Log.Error(`Vendor User Login not found for Vendor Number = ${PaymentData.VendorId} and Company Code = ${PaymentData.VendorCompanyCode}`);
            }
        }
    }
}
function GetVendorContactLogin(VendorNumber, CompanyCode) {
    const vendorContactLogin = [];
    const accountId = Lib.P2P.GetValidatorOrOwner().GetVars().GetValue_String("AccountId", 0);
    const query = Process.CreateQueryAsProcessAdmin();
    query.Reset();
    query.SetSpecificTable("AP - Vendors links__");
    query.SetFilter(`(&(Number__=${VendorNumber})(CompanyCode__=${CompanyCode}))`);
    query.SetAttributesList("*");
    if (query.MoveFirst()) {
        let record = query.MoveNextRecord();
        while (record) {
            const invoiceContactLogin = record.GetVars().GetValue_String("ShortLogin__", 0);
            const orderContactLogin = record.GetVars().GetValue_String("ShortLoginPAC__", 0);
            [invoiceContactLogin, orderContactLogin].forEach(login => {
                if (login && !vendorContactLogin.includes(`${accountId}$${login}`)) {
                    vendorContactLogin.push(`${accountId}$${login}`);
                }
            });
            record = query.MoveNextRecord();
        }
    }
    return vendorContactLogin;
}
function GetVendorInfo(VendorNumber, CompanyCode) {
    const query = Process.CreateQueryAsProcessAdmin();
    query.Reset();
    query.SetSpecificTable("AP - Vendors__");
    query.SetAttributesList("CompanyCode__,Number__,Name__,Email__,Sub__,Street__,PostalCode__,Country__,Country__,Region__,City__,PostOfficeBox__");
    query.SetFilter(`(&(Number__=${VendorNumber})(CompanyCode__=${CompanyCode}))`);
    query.MoveFirst();
    const record = query.MoveNextRecord();
    let vendor = {};
    if (record) {
        const companyCode = record.GetVars().GetValue_String("CompanyCode__", 0);
        const companyName = record.GetVars().GetValue_String("Name__", 0);
        const Sub__ = record.GetVars().GetValue_String("Sub__", 0);
        const Street__ = record.GetVars().GetValue_String("Street__", 0);
        const PostalCode__ = record.GetVars().GetValue_String("PostalCode__", 0);
        const Country__ = record.GetVars().GetValue_String("Country__", 0);
        const Region__ = record.GetVars().GetValue_String("Region__", 0);
        const City__ = record.GetVars().GetValue_String("City__", 0);
        const PostOfficeBox__ = record.GetVars().GetValue_String("PostOfficeBox__", 0);
        const address = {
            Sub__, Street__, PostalCode__, Country__, Region__, City__, PostOfficeBox__
        };
        FormatVendorAddress(address);
        vendor = {
            "CompanyName__": companyName ? companyName : companyCode,
            "VendorNumber__": record.GetVars().GetValue_String("Number__", 0),
            "VendorName__": record.GetVars().GetValue_String("Name__", 0)
        };
        Log.Info(`Vendor Info retrieved for company code = ${companyCode} is : ${JSON.stringify(vendor)}`);
    }
    return vendor;
}
function GetCompanyAddress(CompanyCode) {
    let attributes = {};
    Lib.P2P.CompanyCodesValue.QueryValues(CompanyCode).Then(function (CCValues) {
        if (Object.keys(CCValues).length > 0) {
            attributes = CCValues;
        }
    });
    return attributes;
}
function FormatVendorAddress(address) {
    const VendorAddress = {
        "ToName": "ToRemove",
        "ToSub": address.Sub__,
        "ToMail": address.Street__,
        "ToPostal": address.PostalCode__,
        "ToCountry": address.Country__,
        "ToCountryCode": address.Country__,
        "ToState": address.Region__,
        "ToCity": address.City__,
        "ToPOBox": address.PostOfficeBox__,
        "ForceCountry": "false"
    };
    Lib.Purchasing.Vendor.FillPostalAddress(VendorAddress);
}
function FormatOwnerAddress(options) {
    const OwnerAddress = {
        "ToName": options.CompanyName__,
        "ToSub": options.Sub__,
        "ToMail": options.Street__,
        "ToPostal": options.PostalCode__,
        "ToCountry": options.Country__,
        "ToCountryCode": options.Country__,
        "ToState": options.Region__,
        "ToCity": options.City__,
        "ToPOBox": options.PostOfficeBox__,
        "ForceCountry": "false"
    };
    const AddressOptions = {
        "isVariablesAddress": true,
        "address": OwnerAddress,
        "countryCode": options.Country__ // Get country code from contract ModProvider
    };
    Sys.GenericAPI.CheckPostalAddress(AddressOptions, function (address) {
        if (!Sys.Helpers.IsEmpty(address.LastErrorMessage)) {
            Data.SetWarning("OwnerAddress__", `${Language.Translate("_Owner address error:")} ${address.LastErrorMessage}`);
        }
        else {
            Data.SetValue("PayerAddress__", address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, ""), true);
        }
    });
}
function getExistingScheduleName() {
    const reportParameter = Variable.GetValueAsString("reportParameter");
    if (reportParameter) {
        const params = JSON.parse(reportParameter);
        if ("scheduleName" in params) {
            return params.scheduleName;
        }
    }
    return "";
}
function run() {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    const existingScheduleName = getExistingScheduleName();
    const isApprovalAction = currentAction === "approve_asynchronous" || currentAction === "approve" || currentAction === "ResumeWithAction";
    if (existingScheduleName === "generateRemittanceAdviceFromPaidInvoices" || (isApprovalAction && currentName === "Submit")) {
        SendToApproval();
        if (existingScheduleName === "generateRemittanceAdviceFromPaidInvoices") {
            Data.SetValue("State", 100);
        }
    }
}
run();
//# sourceMappingURL=validationscript.js.map