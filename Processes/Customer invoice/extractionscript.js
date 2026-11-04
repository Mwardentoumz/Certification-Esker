"use strict";
/* Customer invoice Extraction script */
function getShortLogin(login) {
    if (login && login.indexOf("$") !== -1) {
        return login.substring(1 + login.indexOf("$"));
    }
    return login;
}
function getCurrentVendorInfos() {
    const currentVendor = Users.GetUser(Data.GetValue("OwnerId"));
    const businessPartnerID = currentVendor.GetValue("BusinessPartnerID");
    const vendorLogin = currentVendor.GetValue("Login");
    return {
        businessPartnerID: businessPartnerID,
        login: vendorLogin,
        shortLogin: getShortLogin(vendorLogin),
        ownerId: currentVendor.GetValue("OwnerID")
    };
}
function setVendorVariables({ login, shortLogin, businessPartnerID }) {
    Variable.SetValueAsString("shortLogin", login);
    Variable.SetValueAsString("submission_vendorid", shortLogin);
    Data.SetValue("BusinessPartnerID__", businessPartnerID);
}
function initCompany(vendorInfo) {
    const vendorLinksInfos = getVendorLinksInfos(vendorInfo);
    Variable.SetValueAsString("vendorLinksInfos", JSON.stringify(vendorLinksInfos));
    const companiesDescriptions = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.OnGetCompaniesDescription", vendorLinksInfos) || getCompaniesDescription(vendorLinksInfos);
    Variable.SetValueAsString("companies", JSON.stringify(companiesDescriptions));
}
function addCompanyDescription(companiesDescriptions, companyCode, companyDescription) {
    if (companyCode) {
        if (companyDescription) {
            companiesDescriptions[companyCode] = companyDescription;
        }
        else {
            companiesDescriptions[companyCode] = companyCode;
        }
    }
}
//Link company codes and their description so that display only the description for the vendor
function getCompaniesDescription(vendorLinksInfos) {
    const companiesDescriptions = {};
    let countCompanies = 0;
    const query = Process.CreateQueryAsProcessAdmin();
    let filter = "";
    let i = 0;
    for (const companyCode in vendorLinksInfos) {
        if (Object.prototype.hasOwnProperty.call(vendorLinksInfos, companyCode)) {
            if (i > 0) {
                filter = `|(CompanyCode__=${companyCode})(${filter})`;
            }
            else {
                filter = `CompanyCode__=${companyCode}`;
            }
            i++;
        }
    }
    query.Reset();
    query.SetSpecificTable("PurchasingCompanycodes__");
    query.SetAttributesList("CompanyCode__,CompanyName__");
    query.SetFilter(filter);
    query.SetSortOrder("CompanyName__ ASC");
    query.MoveFirst();
    let record = query.MoveNextRecord();
    while (record) {
        const companyVars = record.GetVars();
        const companyCode = companyVars.GetValue_String("CompanyCode__", 0);
        const companyDescription = companyVars.GetValue_String("CompanyName__", 0);
        addCompanyDescription(companiesDescriptions, companyCode, companyDescription);
        if (countCompanies === 0) {
            Data.SetValue("Company__", companyDescription);
        }
        countCompanies++;
        record = query.MoveNextRecord();
    }
    if (countCompanies > 1) {
        Data.SetValue("Company__", getLastCompanySelected());
    }
    return companiesDescriptions;
}
function getAvailableShortLogins(vendorInfo) {
    const shortLogins = [];
    if (vendorInfo.businessPartnerID) {
        const query = Process.CreateQueryAsProcessAdmin();
        query.Reset();
        query.SetSpecificTable("ODUSER");
        query.SetAttributesList("Login");
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Vendor", "1"), Sys.Helpers.LdapUtil.FilterEqual("OwnerID", vendorInfo.ownerId), Sys.Helpers.LdapUtil.FilterEqual("BusinessPartnerID", vendorInfo.businessPartnerID));
        query.SetFilter(filter.toString());
        query.MoveFirst();
        let record = query.MoveNextRecord();
        while (record) {
            const login = record.GetVars().GetValue_String("Login", 0);
            shortLogins.push(getShortLogin(login));
            record = query.MoveNextRecord();
        }
    }
    else {
        shortLogins.push(vendorInfo.shortLogin);
    }
    return shortLogins;
}
//Get all company code for the current vendor
function getVendorLinksInfos(vendorInfo) {
    let vendorLinksInfos = {};
    const query = Process.CreateQueryAsProcessAdmin();
    query.Reset();
    query.SetSpecificTable("AP - Vendors links__");
    query.SetAttributesList("CompanyCode__,Number__,Configuration__");
    const shortLogins = getAvailableShortLogins(vendorInfo);
    const filter = Sys.Helpers.LdapUtil.FilterIn("ShortLogin__", shortLogins);
    query.SetFilter(filter.toString());
    query.MoveFirst();
    let record = query.MoveNextRecord();
    while (record) {
        const CC = record.GetVars().GetValue_String("CompanyCode__", 0);
        const VID = record.GetVars().GetValue_String("Number__", 0);
        const conf = record.GetVars().GetValue_String("Configuration__", 0);
        if (!CC) {
            vendorLinksInfos = {};
            vendorLinksInfos["*"] = { number: VID, configuration: conf };
            return vendorLinksInfos;
        }
        vendorLinksInfos[CC] = { number: VID, configuration: conf };
        record = query.MoveNextRecord();
    }
    return vendorLinksInfos;
}
//Get the last company description selected in order to set the same value for the current invoice
function getLastCompanySelected() {
    const query = Process.CreateQuery();
    query.Reset();
    query.SetSpecificTable("CDNAME#Customer invoice");
    query.SetAttributesList("RUIDEX,SubmitDateTime,Company__,CustomerInvoiceStatus__");
    query.SetSortOrder("SubmitDateTime DESC");
    query.SetFilter("!(CustomerInvoiceStatus__=To send)");
    query.SetOptionEx("limit=1");
    query.MoveFirst();
    const record = query.MoveNextRecord();
    if (record) {
        return record.GetVars().GetValue_String("Company__", 0);
    }
    return null;
}
function extraction() {
    if (Data.GetValue("VIRuidEx__")) {
        // If the VIRuidEx__ field is set, it means the process was instanciated from an invoice
        Log.Info("Created from an invoice");
    }
    else if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
        Log.Info("FlipPO creation mode");
        if (!Lib.AP.VendorPortal.CreateFromFlipPO.Fill(Data)) {
            Log.Error("Unable to fill the customer invoice");
        }
        // Linking the source CustomerOrder record with the current RuidEx
        const source_ruidex = Data.GetValue("Source_RuidEx__");
        if (source_ruidex !== null) {
            Log.Info(`Linking the source CustomerOrder (${source_ruidex}) record with the current RuidEx`);
            Process.UpdateProcessInstanceDataAsync(source_ruidex, JSON.stringify({
                fields: {
                    Invoice_RuidEx__: Data.GetValue("RuidEx")
                }
            }));
        }
        // When created from the portal, CI is the conversation master
        const vendorUserId = Data.GetValue("OwnerID");
        Lib.AP.VendorPortal.InitiateConversationFromCI(vendorUserId);
    }
    else {
        Log.Info("Created from the portal");
        const vendorInfo = getCurrentVendorInfos();
        setVendorVariables(vendorInfo);
        initCompany(vendorInfo);
        // When created from the portal, CI is the conversation master
        const vendorUserId = Data.GetValue("OwnerID");
        Lib.AP.VendorPortal.InitiateConversationFromCI(vendorUserId);
    }
    Data.SetValue("PortalRuidEx__", Data.GetValue("RUIDEX"));
}
extraction();
//# sourceMappingURL=extractionscript.js.map