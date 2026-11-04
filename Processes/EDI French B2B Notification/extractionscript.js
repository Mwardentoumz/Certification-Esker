"use strict";
class MandatoryInfo {
    constructor(invoiceNumber, invoiceIssueDate) {
        this.invoiceNumber = invoiceNumber;
        this.invoiceIssueDate = invoiceIssueDate;
        this.vendorId = {
            SIREN: "",
            SIRET: "",
            vendorNumber: ""
        };
        this.customerId = {
            SIREN: "",
            SIRET: "",
            companyCode: ""
        };
    }
}
function tryGetFirstVendorRecord(searchedField, value, companyCode) {
    let firstRecordResult = null;
    let filter = Sys.Helpers.LdapUtil.FilterEqual(searchedField, value).toString();
    filter = filter.AddCompanyCodeFilter(companyCode);
    const attributes = Lib.AP.GetExtendedVendorAttributes();
    Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, attributes, function (records, error) {
        if (!error && records && records.length === 1) {
            firstRecordResult = records[0];
        }
        else if (records.length > 1) {
            Log.Error("More than one Vendor Number have been retrieved");
        }
        else {
            Log.Error("No Vendor Number retrieved");
        }
    });
    return firstRecordResult;
}
function tryQueryVendorFromTable(mandatoryInfo, companyCode) {
    let result;
    if (mandatoryInfo.vendorId.SIREN) {
        const vendorVat = Lib.AP.GetVATFromSIREN(mandatoryInfo.vendorId.SIREN);
        Data.SetValue("VATNumber__", vendorVat);
        result = tryGetFirstVendorRecord("VATNumber__", vendorVat, companyCode);
    }
    if (!result && mandatoryInfo.vendorId.SIRET) {
        result = tryGetFirstVendorRecord("Siret__", mandatoryInfo.vendorId.SIRET, companyCode);
    }
    return result;
}
function getCompanyCode(mandatoryInfo) {
    var _a;
    let customerVat;
    Log.Verbose(JSON.stringify(mandatoryInfo));
    if (mandatoryInfo.customerId.SIREN) {
        customerVat = Lib.AP.GetVATFromSIREN(mandatoryInfo.customerId.SIREN);
    }
    let foundCompanyCode;
    if (customerVat || mandatoryInfo.customerId.SIRET) {
        foundCompanyCode = (_a = Lib.AP.CompanyCodeDetermination.DetermineWithTaxInformationNoFormReprocess({
            vatNumber: customerVat, siret: mandatoryInfo.customerId.SIRET
        })) === null || _a === void 0 ? void 0 : _a.companyCode;
    }
    if (!foundCompanyCode) {
        return false;
    }
    mandatoryInfo.customerId.companyCode = foundCompanyCode;
    return true;
}
function FindUniqueVICDVWithoutCompanyCode(mandatoryInfo) {
    Log.Info(`Searching a unique Vendor Invoice CDV by invoice '${mandatoryInfo.invoiceNumber}'`);
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable("CDNAME#Vendor Invoice CDV");
    query.SetAttributesList("CompanyCode__,VendorNumber__,InvoiceNumber__");
    query.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("InvoiceNumber__", mandatoryInfo.invoiceNumber), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100")).toString());
    query.SetOptionEx("FastSearch=1");
    query.SetOptionEx("Limit=-1");
    if (!query.MoveFirst()) {
        Log.Error(`Could not search Vendor Invoice CDV for fallback: (${query.GetLastError()}) ${query.GetLastErrorMessage()}`);
        return null;
    }
    const matches = [];
    for (let record = query.MoveNext(); record !== null; record = query.MoveNext()) {
        const vars = record.GetUninheritedVars();
        const companyCode = vars.GetValue_String("CompanyCode__", 0);
        const vendorNumber = vars.GetValue_String("VendorNumber__", 0);
        matches.push({
            companyCode: companyCode,
            vendorNumber: vendorNumber,
            invoiceNumber: mandatoryInfo.invoiceNumber,
            PDPConfigurationName: Variable.GetValueAsString(Sys.EDI.FRB2B.Helpers.PDPConfigurationName) || ""
        });
    }
    if (matches.length !== 1) {
        Log.Warn(`CDV fallback without buyer found ${matches.length} matching Vendor Invoice CDV processes for invoice '${mandatoryInfo.invoiceNumber}'`);
        return null;
    }
    Log.Info(`CDV fallback without buyer found Vendor Invoice CDV for company '${matches[0].companyCode}' and vendor '${matches[0].vendorNumber}'`);
    return matches[0];
}
function UpdateOrCreateVICDVFromNotificationAndAvoidConcurrency(sharedInfo, cdvRaw, cdvInfo) {
    // Prevent several incoming CDVs that target the same VICDV from being processed at the same time.
    // Without this lock, two notifications for the same invoice could be handled concurrently and:
    //  - miss the existing VICDV during the double-check and create duplicate VICDV processes, and/or
    // The lock key is the VICDV identity (AccountId + companyCode + vendorNumber + invoiceNumber), so only notifications
    // targeting the same invoice are serialized.
    const accessKey = `APEdiFrenchB2BCdvNotification#${Data.GetValue("AccountId")}#${sharedInfo.companyCode}#${sharedInfo.vendorNumber}#${sharedInfo.invoiceNumber}`;
    let isVICDVUpdatedOrCreated = false;
    const lockAcquired = Process.PreventConcurrentAccess(accessKey, function () {
        isVICDVUpdatedOrCreated = Sys.FRB2B.AP.UpdateOrCreateVICDVFromNotification(sharedInfo, cdvRaw, true, cdvInfo);
    }, null, 60);
    if (!lockAcquired) {
        const message = `Could not get concurrent access for UpdateOrCreateVICDVFromNotification (key: ${accessKey})`;
        Log.Error(message);
        if (Process.GetScriptRetryCount() >= Process.GetScriptMaxRetryCount() - 1) {
            Log.Error(`Could not get concurrent access for UpdateOrCreateVICDVFromNotification (key: ${accessKey}) on the last retry`);
            return false;
        }
        Log.Info("Retrying...");
        throw message;
    }
    return isVICDVUpdatedOrCreated;
}
function run() {
    const cdvRaw = Attach.GetAttach(0).GetInputFile();
    let cdvData = null;
    try {
        cdvData = Sys.EDI.FRB2B.XMLExtraction.CDV.Extract();
    }
    catch (e) {
        Log.Error("Failed to extract CDV data from attachment");
        return false;
    }
    let parties = cdvData.recipients;
    if (cdvData.issuer) {
        parties.push(cdvData.issuer);
    }
    if (cdvData.sender) {
        parties.push(cdvData.sender);
    }
    if (!cdvData.document.objectID || !cdvData.document.objectReceiptTimestamp) {
        Log.Error("Miss mandatory infos in CDV (invoice number and/or Invoice receipt timestamps)");
        return false;
    }
    Data.SetValue("InvoiceNumber__", cdvData.document.objectID);
    Data.SetValue("InvoiceReceivedDate__", cdvData.document.objectReceiptTimestamp);
    let mandatoryInfo = new MandatoryInfo(cdvData.document.objectID, cdvData.document.objectReceiptTimestamp);
    const notificationParty = Sys.EDI.FRB2B.CDV.Utils.tryGetEDIFrenchB2BNotificationParty(parties, Sys.EDI.FRB2B.CDV.Utils.RoleCode.Seller, mandatoryInfo.vendorId);
    if (!notificationParty) {
        Log.Error("Needed/Mandatory information about Supplier/Seller not found");
        return false;
    }
    Data.SetValue("VendorSIREN__", mandatoryInfo.vendorId.SIREN);
    Data.SetValue("VendorSIRET__", mandatoryInfo.vendorId.SIRET);
    Sys.EDI.FRB2B.CDV.Utils.tryGetEDIFrenchB2BNotificationParty(parties, Sys.EDI.FRB2B.CDV.Utils.RoleCode.Buyer, mandatoryInfo.customerId);
    Data.SetValue("CustomerSIREN__", mandatoryInfo.customerId.SIREN);
    Data.SetValue("CustomerSIRET__", mandatoryInfo.customerId.SIRET);
    if (!getCompanyCode(mandatoryInfo)) {
        Log.Info("Cannot retrieve CompanyCode from the CDV buyer, trying to find a unique matching Vendor Invoice CDV");
        let fallbackVICDVInfo = FindUniqueVICDVWithoutCompanyCode(mandatoryInfo);
        if (!fallbackVICDVInfo) {
            Log.Error("Cannot retrieve CompanyCode and no unique matching Vendor Invoice CDV was found");
            return false;
        }
        mandatoryInfo.customerId.companyCode = fallbackVICDVInfo.companyCode;
        mandatoryInfo.vendorId.vendorNumber = fallbackVICDVInfo.vendorNumber;
    }
    Data.SetValue("CompanyCode__", mandatoryInfo.customerId.companyCode);
    // Do not query the vendor if we got it from the fallback
    if (!mandatoryInfo.vendorId.vendorNumber) {
        let result = tryQueryVendorFromTable(mandatoryInfo, mandatoryInfo.customerId.companyCode);
        if (!result) {
            Log.Error("Cannot retrieve Vendor Number");
            return false;
        }
        mandatoryInfo.vendorId.vendorNumber = result.Number__;
    }
    Data.SetValue("VendorNumber__", mandatoryInfo.vendorId.vendorNumber);
    if (!mandatoryInfo.invoiceNumber || !mandatoryInfo.vendorId.vendorNumber || !mandatoryInfo.customerId.companyCode || !mandatoryInfo.invoiceIssueDate) {
        Log.Error("Miss needed informations for querying for RuidEx VIP");
        return false;
    }
    // Derive the CDV status from the inbound notification code so the invoice lifecycle history
    const cdvInfo = {
        status: Sys.FRB2B.CDV.AP.Mapping.GetCDVStatusFromNotificationCode(cdvData.status.code),
        issueTimestamp: cdvData.issueTimestamp,
        source: Sys.FRB2B.AP.CDVHistorySource.PDP
    };
    const sharedInfo = {
        companyCode: mandatoryInfo.customerId.companyCode,
        vendorNumber: mandatoryInfo.vendorId.vendorNumber,
        invoiceNumber: mandatoryInfo.invoiceNumber,
        PDPConfigurationName: Variable.GetValueAsString(Sys.EDI.FRB2B.Helpers.PDPConfigurationName) || ""
    };
    return UpdateOrCreateVICDVFromNotificationAndAvoidConcurrency(sharedInfo, cdvRaw, cdvInfo);
}
if (run()) {
    Data.SetValue("State", 100);
}
else {
    Data.SetValue("State", 200);
}
//# sourceMappingURL=extractionscript.js.map