"use strict";
/* Vendor invoice Extraction script */
//#endregion
/** ***** **/
/** DEBUG **/
/** ***** **/
//#region
// Enable/disable debug mode
let g_debug = false;
function traceDebug(txt) {
    if (g_debug) {
        Log.Info(txt);
    }
}
//#endregion
/** **************** **/
/** Global variables **/
/** **************** **/
//#region
// DBSET_READONLY | DBSET_QUICK
const DBFastAccess = 0x00210000;
// also returns ownershipped records
const DBDirtyRead = 0x00020000;
//#endregion
/** ***************** **/
/** CURRENCY HELPERS  **/
/** ***************** **/
//#region
function GetDefaultCurrency() {
    const companyCode = Data.GetValue("CompanyCode__");
    if (companyCode) {
        return Lib.P2P.ExchangeRate.GetCompanyCodeCurrency(companyCode);
    }
    return "";
}
function CurrencyHasDecimal(currency) {
    return Lib.AP.GetIntegerCurrencies().indexOf(currency) === -1;
}
//#endregion
/** ******************* **/
/** PREVIEW INTERACTION **/
/** ******************* **/
//#region
function highlightVendorArea(area) {
    if (area === null || area === void 0 ? void 0 : area.zone) {
        const highlightColorBorder = 0xFFFFFF;
        const highlightColorBackground = 0xFFCC00;
        area.zone.Highlight(true, highlightColorBackground, highlightColorBorder, "VendorName__");
        area.zone.Highlight(true, highlightColorBackground, highlightColorBorder, "VendorNumber__");
        area.zone.Highlight(true, highlightColorBackground, highlightColorBorder, "ExtractedIBAN__");
    }
}
//#endregion
/** ****************** **/
/** VENDOR RECOGNITION **/
/** ****************** **/
//#region
function searchVendorNumber() {
    const sTaxID = Data.GetValue("ExtractedVendorTaxID__");
    const sVendorNumber = Data.GetValue("VendorNumber__");
    const sVendorName = Data.GetValue("VendorName__");
    const sCompanyCode = Data.GetValue("CompanyCode__");
    if (sVendorNumber || sVendorName || sTaxID) {
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        // WARNING : When vendor found in SAP / SAPS4 / CustomERP, the callback FillVendorFieldsFromQueryResult is not called
        if (!invoiceDoc.SearchVendorFromPO(sCompanyCode, sVendorNumber, sVendorName, Lib.AP.Extraction.Vendor.FillVendorFieldsFromQueryResult, sTaxID)) {
            Data.SetValue("VendorNumber__", "");
            Data.SetValue("VendorName__", "");
        }
    }
}
function fillPayeeFieldsFromQueryResult(result, lookupValue, desc) {
    const payeeNumber = result.Number__;
    Data.SetValue("AlternativePayee__", payeeNumber);
    Data.SetValue("AlternativePayeeName__", result.Name__);
    Data.SetValue("AlternativePayeeStreet__", result.Street__);
    Data.SetValue("AlternativePayeePOBox__", result.PostOfficeBox__);
    Data.SetValue("AlternativePayeeCity__", result.City__);
    Data.SetValue("AlternativePayeeZipCode__", result.PostalCode__);
    Data.SetValue("AlternativePayeeRegion__", result.Region__);
    Data.SetValue("AlternativePayeeCountry__", result.Country__);
    Lib.AP.Extraction.FillPayeeEmail();
}
//#endregion
/** ******************** **/
/** HEADER FIELDS SEARCH **/
/** ******************** **/
//#region
function setEDIFirstRecoValues(inv, source) {
    // CalculateDueDateFromPaymentTerm__: checked ("1") = always calculate from payment terms, ignore e-invoice due date
    if (Sys.Parameters.GetInstance("AP").GetParameter("CalculateDueDateFromPaymentTerm", "") !== "1") {
        Lib.AP.Extraction.SetFirstRecoValueForce(source, "DueDate__", inv.GetDueDate());
    }
    Lib.AP.Extraction.SetFirstRecoValueForce(source, "EDIInvoiceType__", inv.GetEDIInvoiceType());
    Lib.AP.Extraction.SetFirstRecoValueForce(source, "EDIBusinessProcessType__", inv.GetEDIBusinessProcessType());
    const ediProviderCandidates = inv.GetHeaderFieldCandidates("EDIProvider");
    if ((ediProviderCandidates === null || ediProviderCandidates === void 0 ? void 0 : ediProviderCandidates.length) > 0) {
        Lib.AP.Extraction.SetFirstRecoValueForce(source, "EDIProvider__", ediProviderCandidates[0].standardStringValue);
    }
    // Extract reserve clause amounts from EDI documents (French B2B invoices: UBL/CII)
    const reserveClauseGuaranteeCandidates = inv.GetHeaderFieldCandidates("ReserveClauseGuarantee");
    if (reserveClauseGuaranteeCandidates && reserveClauseGuaranteeCandidates.length > 0) {
        Lib.AP.Extraction.SetFirstRecoValueForce(source, "ReserveClauseGuarantee__", reserveClauseGuaranteeCandidates[0].standardStringValue);
    }
    const reserveClauseProrataCandidates = inv.GetHeaderFieldCandidates("ReserveClauseProrata");
    if (reserveClauseProrataCandidates && reserveClauseProrataCandidates.length > 0) {
        Lib.AP.Extraction.SetFirstRecoValueForce(source, "ReserveClauseProrata__", reserveClauseProrataCandidates[0].standardStringValue);
    }
    const reserveClauseInsuranceCandidates = inv.GetHeaderFieldCandidates("ReserveClauseInsurance");
    if (reserveClauseInsuranceCandidates && reserveClauseInsuranceCandidates.length > 0) {
        Lib.AP.Extraction.SetFirstRecoValueForce(source, "ReserveClauseInsurance__", reserveClauseInsuranceCandidates[0].standardStringValue);
    }
    const electronicRoutingAddressCandidates = inv.GetHeaderFieldCandidates("ElectronicRoutingAddress");
    if (electronicRoutingAddressCandidates && electronicRoutingAddressCandidates.length > 0) {
        Lib.AP.Extraction.SetFirstRecoValueForce(source, "ElectronicRoutingAddress__", electronicRoutingAddressCandidates[0].standardStringValue);
    }
    Lib.AP.Extraction.SetFirstRecoValue(source, "ReferenceForPayment__", inv.GetReferenceForPayment());
}
function fillEDIMapperFields(inv) {
    if (inv.GetCalculateTax() === false) {
        Data.SetValue("CalculateTax__", false);
    }
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    const source = mapperDoc.GetComputedValueSource();
    const fieldMappings = [
        { getter: () => mapperDoc.GetBillingScheduleInstallmentNumber(), field: "BillingScheduleInstallment__" },
        { getter: () => mapperDoc.GetBillingScheduleID(), field: "BillingScheduleID__" },
        { getter: () => mapperDoc.GetBillingScheduleInstallmentDate(), field: "BillingScheduleDate__", isDate: true },
        { getter: () => mapperDoc.GetContractReferenceNumber(), field: "ContractReferenceNumber__" },
        { getter: () => mapperDoc.GetContractNumber(), field: "ContractNumber__" },
        { getter: () => mapperDoc.GetInvoicePeriodStartDate(), field: "InvoicePeriodStartDate__", isDate: true },
        { getter: () => mapperDoc.GetInvoicePeriodEndDate(), field: "InvoicePeriodEndDate__", isDate: true },
        { getter: () => mapperDoc.GetVendorVATNumber(), field: "ExtractedVendorTaxID__" },
        { getter: () => mapperDoc.GetIBAN(), field: "ExtractedIBAN__" },
        { getter: () => mapperDoc.GetHeaderDNExtracted(), field: "HeaderDNExtracted__" }
    ];
    for (const mapping of fieldMappings) {
        const value = mapping.getter();
        if (value) {
            Data.SetValue(mapping.field, mapping.isDate ? new Date(value) : value);
            Data.SetComputedValueSource(mapping.field, source);
        }
    }
    if (mapperDoc instanceof Lib.AP.Mapping.EDIDocument) {
        mapperDoc.CopyHTMLIdMapping("VendorVATNumber__", "ExtractedVendorTaxID__");
    }
}
function processOrderNumbers(inv, invoiceDoc) {
    let orderNumberCandidates = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.FormatOrderNumberCandidates", inv.GetHeaderFieldCandidates("OrderNumber")) || inv.GetHeaderFieldCandidates("OrderNumber");
    orderNumberCandidates = invoiceDoc.FormatOrderNumberCandidates(orderNumberCandidates);
    let extractedHeaderOrderNumberCandidates = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.FormatOrderNumberCandidates", inv.GetHeaderFieldCandidates("OrderNumber", false)) || inv.GetHeaderFieldCandidates("OrderNumber", false);
    extractedHeaderOrderNumberCandidates = invoiceDoc.FormatOrderNumberCandidates(extractedHeaderOrderNumberCandidates);
    if (invoiceDoc.IsConnectedAPIAvailable("POHeader")) {
        processOrderNumbersConnected(inv, orderNumberCandidates);
    }
    else {
        processOrderNumbersStandard(invoiceDoc, orderNumberCandidates, extractedHeaderOrderNumberCandidates);
    }
}
function processOrderNumbersConnected(inv, orderNumberCandidates) {
    const invoiceDocConnected = Lib.AP.GetInvoiceDocument();
    const goodIssueProcessed = invoiceDocConnected.searchGoodIssueNumbersAndFillLines(inv.GetHeaderFieldCandidates("GoodIssueNumber"), searchVendorNumber);
    if (!goodIssueProcessed) {
        Lib.AP.Extraction.ERPConnected.SearchOrderNumbersAndFillLines(invoiceDocConnected, orderNumberCandidates, searchVendorNumber, reconcileInvoiceWithPO);
    }
    if (Lib.AP.MappingManager.DataExtractedFromEDI()) {
        tryQueryBusinessValueFromMRU(Data.GetValue("CompanyCode__"), "SAPPaymentMethod__", inv.GetPaymentMethod());
    }
}
function processOrderNumbersStandard(invoiceDoc, orderNumberCandidates, headerOrderNumberCandidates) {
    const shouldSkipValidation = Lib.AP.MappingManager.DataExtractedFromEDI() && Lib.AP.InvoiceType.isPOInvoice() && !Lib.P2P.IsPOMatchingEnabled();
    if (shouldSkipValidation) {
        const distinctHeaderOrderNumbers = Array.from(new Set((headerOrderNumberCandidates || [])
            .map(orderNumberCandidate => orderNumberCandidate.standardStringValue)
            .filter((orderNumberCandidate) => !!orderNumberCandidate)));
        const orderNumbers = Lib.AP.Extraction.GetOrderNumbers(orderNumberCandidates);
        if ((orderNumbers === null || orderNumbers === void 0 ? void 0 : orderNumbers.length) > 0) {
            Data.SetValue("OrderNumber__", orderNumbers.join(","));
            Log.Info("Checks disabled on PO invoices, order number retrieved from Mapper document");
        }
        if (distinctHeaderOrderNumbers.length === 1) {
            propagateHeaderOrderNumberToLines(distinctHeaderOrderNumbers[0]);
        }
    }
    else {
        invoiceDoc.ValidateOrdersAndFillPO(orderNumberCandidates, searchVendorNumber, null, false, reconcileInvoiceWithPO);
    }
}
function propagateHeaderOrderNumberToLines(headerOrderNumber) {
    const lineItems = Data.GetTable("LineItems__");
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    const source = mapperDoc ? mapperDoc.GetComputedValueSource() : null;
    let propagatedCount = 0;
    for (let i = 0; i < lineItems.GetItemCount(); i++) {
        const item = lineItems.GetItem(i);
        if (Sys.Helpers.IsEmpty(item.GetValue("OrderNumber__"))) {
            item.SetValue("OrderNumber__", headerOrderNumber);
            if (source) {
                item.SetComputedValueSource("OrderNumber__", source);
            }
            propagatedCount++;
        }
    }
    if (propagatedCount > 0) {
        Log.Info(`Single-order e-invoice: header order number '${headerOrderNumber}' propagated to ${propagatedCount} line(s) missing an order number`);
    }
}
function processContractReference(inv, source) {
    const isContractEnabled = Sys.Parameters.GetInstance("P2P").GetParameter("EnableContractGlobalSetting", "") === "1";
    if (!isContractEnabled) {
        return;
    }
    if (Data.IsNullOrEmpty("ContractReferenceNumber__")) {
        const contractReferenceNumberCandidates = inv.GetHeaderFieldCandidates("ContractReferenceNumber");
        if ((contractReferenceNumberCandidates === null || contractReferenceNumberCandidates === void 0 ? void 0 : contractReferenceNumberCandidates.length) > 0) {
            Lib.AP.Extraction.Contract.FillContractFieldsFromCandidate(contractReferenceNumberCandidates, source);
        }
    }
    else {
        Lib.AP.Extraction.Contract.FillContractFields();
    }
}
function traceUnsupportedFields(inv) {
    if (inv.GetUnplannedCosts() !== null) {
        traceDebug("FTR - UnplannedCosts found: " + JSON.stringify(inv.GetUnplannedCosts()));
    }
    if (inv.GetTaxAmount() !== null) {
        traceDebug("FTR - TaxAmount found: " + JSON.stringify(inv.GetTaxAmount()));
    }
    if (inv.GetTaxRate() !== null) {
        traceDebug("FTR - TaxRate found: " + JSON.stringify(inv.GetTaxRate()));
    }
}
function readFirstRecoResults(inv) {
    let source = inv.GetComputedValueSource();
    const IsEDI = Lib.AP.MappingManager.DataExtractedFromEDI();
    const SetFirstRecoValue = IsEDI ? Lib.AP.Extraction.SetFirstRecoValueForce : Lib.AP.Extraction.SetFirstRecoValue;
    SetFirstRecoValue(source, "InvoiceDate__", inv.GetDocumentDate());
    SetFirstRecoValue(source, "InvoiceAmount__", inv.GetGrossAmount(), "0.00");
    SetFirstRecoValue(source, "AmountDueForPayment__", inv.GetAmountDueForPayment());
    SetFirstRecoValue(source, "ExtractedNetAmount__", inv.GetNetAmount(), inv.GetGrossAmount());
    SetFirstRecoValue(source, "InvoiceNumber__", inv.GetDocumentNumber());
    SetFirstRecoValue(source, "InvoiceCurrency__", inv.GetCurrency());
    if (IsEDI) {
        setEDIFirstRecoValues(inv, source);
    }
    const extendedSource = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.ExtendFirstTimeRecognition", inv);
    if (extendedSource != null) {
        source = extendedSource;
    }
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    validateInvoiceCurrency();
    updateExchangeRate();
    processOrderNumbers(inv, invoiceDoc);
    processContractReference(inv, source);
    if (Data.IsNullOrEmpty("RelatedInvoice__")) {
        Lib.AP.Extraction.RelatedInvoice.FillValueFromCandidate(inv.GetHeaderFieldCandidates("RelatedInvoice"), source, Data.GetValue("InvoiceAmount__") < 0);
    }
    if (Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() && !Data.IsNullOrEmpty("ExtractedNetAmount__")) {
        invoiceDoc.FillGLLines();
    }
    if (Lib.AP.MappingManager.DataExtractedFromEDI()) {
        fillEDIMapperFields(inv);
    }
    traceUnsupportedFields(inv);
    if (inv.GetDocumentType() !== null) {
        adaptSignByInvoiceType(Lib.AP.IsDocumentCreditNote(inv.GetDocumentType()));
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.FillWithFirstRecognitionResults", inv);
}
function synergyExtraction() {
    const isSNNHeaderEnabled = Sys.Parameters.GetInstance("P2P").GetParameter("EnableSynergyNeuralNetworkGlobalSetting") === "1";
    const isSNNLineItemEnabled = Sys.Parameters.GetInstance("P2P").GetParameter("EnableSynergyNeuralNetworkLineItemsGlobalSetting") === "1";
    if ((isSNNHeaderEnabled || isSNNLineItemEnabled) && !Lib.AP.MappingManager.DataExtractedFromEDI()) {
        Log.Info("Using Synergy Neural Network");
        const options = {
            synergyNeuralNetworkHeader: isSNNHeaderEnabled,
            synergyNeuralNetworkLineItem: isSNNLineItemEnabled,
            GetDefaultCurrency: GetDefaultCurrency,
            CurrencyHasDecimal: CurrencyHasDecimal
        };
        const customOptions = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.SetSynergyPostProcessingOptions", options);
        Lib.AP.SynergyNeuralNetwork.FillFormFields(customOptions ? customOptions : options);
    }
}
function searchHeaderFieldsAndLineItems() {
    traceDebug("Search header fields and lineItems");
    // Call Synergy Neural Network API
    synergyExtraction();
    // Init recognition engine
    if (Process.GetScriptRetryCount() > 1) {
        Variable.SetValueAsString("AlertExtractionScriptTimeout", "NoFTR");
        if (Data.GetValue("InvoiceCurrency__")) {
            // The invoice currency can be set by the teaching/autolearning, validate the value and
            // correctly set the local currency and the exchange rate.
            validateInvoiceCurrency();
            updateExchangeRate();
        }
    }
    else {
        let engine = null;
        if (Lib.AP.MappingManager.HasMapperDocument()) {
            engine = Lib.AP.MappingManager.CurrentMapperDocument;
        }
        else {
            Lib.AP.Extraction.ExtractQRCode();
            engine = Lib.AP.FirstTimeRecognition.Init(g_debug);
        }
        if (engine) {
            // Parse document
            engine.Run();
            // Read results
            readFirstRecoResults(engine);
            if (!Data.GetValue("RecognitionMethod")) {
                Data.SetValue("RecognitionMethod", "FTR");
            }
        }
    }
}
function handleContractValidity() {
    if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableContractGlobalSetting", "") === "1") {
        Lib.AP.Contract.HandleContractValidity();
    }
}
/**
* This function will determinate the best way to reconcile the invoice
* with the PO found (Teaching, extract data, perfect match, ...)
*/
function reconcileInvoiceWithPO() {
    // If no teaching, or if nothing was found by teaching, try to extract data from invoice
    const extractionTable = Data.GetTable("ExtractedLineItems__");
    if (extractionTable
        && (extractionTable.GetItemCount() === 0
            || Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.ForceToExtractLineItemsFromInvoice", extractionTable))) {
        extractLineItemsFromInvoice();
    }
    Variable.SetValueAsString("ReconciledByHeader", "false");
    Lib.AP.Reconciliation.reconcileInvoice();
}
//#endregion
/** *************************** **/
/** RECOGNITION OF CREDIT NOTES **/
/** *************************** **/
//#region
function adaptFieldSignByInvoiceType(item, fieldName, creditNote) {
    const fldValue = item.GetValue(fieldName);
    if (fldValue !== null && fldValue > 0 && creditNote) {
        const fldArea = item.GetArea(fieldName);
        if (fldArea) {
            item.SetValue(fieldName, fldArea, -fldValue);
        }
        else {
            item.SetValue(fieldName, -fldValue);
        }
    }
}
function adaptSignByInvoiceType(creditNote) {
    adaptFieldSignByInvoiceType(Data, "InvoiceAmount__", creditNote);
    adaptFieldSignByInvoiceType(Data, "ExtractedNetAmount__", creditNote);
    Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
    if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.AdaptFieldSign.ShouldAdaptLineItemSign") === false) {
        return;
    }
    const lineItems = Data.GetTable("LineItems__");
    for (let j = 0; j < lineItems.GetItemCount(); j++) {
        const item = lineItems.GetItem(j);
        adaptFieldSignByInvoiceType(item, "Amount__", creditNote);
        adaptFieldSignByInvoiceType(item, "TaxAmount__", creditNote);
    }
}
/**
* Extract by script the invoice line items table
*/
function extractLineItemsFromInvoice() {
    if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.AddLineItemsRecognitionTemplates")) {
        Log.Info("Starting to extract line items from document");
        Sys.Helpers.ExtractTable.TableName = "ExtractedLineItems__";
        Sys.Helpers.ExtractTable.Extract();
    }
}
//#endregion
/** ************** **/
/** INIT FUNCTIONS **/
/** ************** **/
//#region
function initDefaultValues() {
    clearUnwantedAutolearnedFields();
    Lib.ERP.AP.InitERP();
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    invoiceDocument.InitDefaultValues();
    if (Lib.AP.MappingManager.DataExtractedFromEDI()) {
        const vendorNumberDeterminedBy = fillVendorFromMapperDocument();
        setFormFieldsFromMapperDocument(vendorNumberDeterminedBy);
        fillPayeeFromMapperDocument();
    }
    else {
        initVendor();
    }
    initInvoiceType();
    initGHGEmissionsHeader();
    Lib.AP.PeppolC5Reporting.SetC5ReportingFields();
    if (Lib.AP.MappingManager.DataExtractedFromEDI()) {
        if (Lib.AP.InvoiceType.isPOInvoice() && !Lib.P2P.IsPOMatchingEnabled()) {
            fillLineItemsFromMapperDocument();
        }
        else {
            fillExtractedLinesFromMapperDocument();
        }
    }
    Data.SetValue("CurrentException__", "");
    Data.SetValue("SubsequentDocument__", false);
    if (!Lib.ERP.IsSAP()) {
        Data.SetValue("GRIV__", Lib.P2P.IsGRIVEnabledGlobally());
    }
    //Serialize serializable parameters on the process so they can be retrieve by the Mobile App
    Sys.Parameters.GetInstance("P2P").Serialize();
    Sys.Parameters.GetInstance("AP").Serialize();
}
/**
 * Clears fields that could have been autolearned, but we don't want them to be autolearned
 */
function clearUnwantedAutolearnedFields() {
    // We should disable autolearning DatabaseCombobox when the feature will be available
    Data.SetValue("ERPInvoiceNumber__", "");
    Data.SetValue("ERPMMInvoiceNumber__", "");
}
const isMultiLayoutTeaching = (suppRule) => suppRule.startsWith("Layout_");
function CheckGenericLayoutTeaching() {
    const suppRule = Data.GetValue("LayoutIdentifier__");
    // If supplementary rule is not for a generic layout, set vendor number
    if (suppRule && !isMultiLayoutTeaching(suppRule)) {
        Log.Info(`[CheckGenericLayoutTeaching] Supplementary rule is not for a generic layout, set vendor number with ${suppRule}`);
        Data.SetValue("VendorNumber__", suppRule);
        Data.SetComputedValueSource("VendorNumber__", Lib.AP.ComputedValueSource.TEACHING);
    }
}
function initBusinessUnit() {
    Lib.AP.GetBusinessUnitFromCompanyCode(Data.GetValue("CompanyCode__"), FeatureToggle.Read("ManagingUsersWithBU") === 1);
}
function initVendor() {
    if (!Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.DisableCheckGenericLayoutTeaching")) {
        // Init vendor from teaching
        CheckGenericLayoutTeaching();
    }
    Sys.FRB2B.AP.InitInternationalReportingData();
    // Init vendor number if the invoice has been submitted from vendor portal
    const submitterVendorId = Variable.GetValueAsString("submission_vendorid");
    if (submitterVendorId) {
        Data.SetValue("VendorNumber__", submitterVendorId);
        Data.SetValue("VendorName__", "");
        traceDebug(`Vendor '${submitterVendorId}' retrieved by submission on vendor portal.`);
    }
    // If it is a retry, search vendor only if it has been set by teaching or autolearning (to fill vendor info from SAP)
    if (Process.GetScriptRetryCount() <= 1 || Data.GetValue("VendorNumber__") || Data.GetValue("VendorName__") || Data.GetValue("ExtractedVendorTaxID__")) {
        const invoiceDocument = Lib.AP.GetInvoiceDocument();
        Lib.P2P.FirstTimeRecognition_Vendor.Recognize(Lib.AP.GetAvailableDocumentCultures(), Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"), Data.GetValue("VendorName__"), Lib.AP.Extraction.Vendor.FillVendorFieldsFromQueryResult, highlightVendorArea, invoiceDocument.SearchVendorNumber, invoiceDocument, Data.GetValue("ExtractedVendorTaxID__"));
    }
}
function initReverseChargeTax() {
    const isFlux10_1Compliant = !Data.IsNullOrEmpty("VendorNumber__") && Sys.FRB2B.AP.IsFlux10_1Compliant() === "1";
    if (isFlux10_1Compliant) {
        Lib.AP.FRB2B.VatReverseCharge.AddDefaultLine();
        const reverseChargeTable = Data.GetTable("Flux10_1_ReverseChargeTaxLines__");
        const item = reverseChargeTable.GetItem(0);
        item.SetRequired("OperationType__", true);
        item.SetRequired("TaxRate__", true);
        item.SetRequired("TaxableAmount__", true);
    }
}
function initGHGEmissionsHeader() {
    if (Sys.Parameters.GetInstance("AP").GetParameter("EnableEnergyConsumptionReporting", "0") === "1") {
        if (!Data.GetValue("EnergyConsumptionLevel__")) {
            Data.SetValue("EnergyConsumptionLevel__", "Scope 3");
        }
    }
}
function getGHGEmissionFactor() {
    const DnBConfig = Lib.VM.ScoringProviders.Server.Providers.GetConfiguration(Lib.VM.ScoringProviders.Common.ProviderName.duns);
    if (Sys.Parameters.GetInstance("AP").GetParameter("EnableEnergyConsumptionReporting", "0") === "1" && DnBConfig && DnBConfig.scoreTypes && DnBConfig.scoreTypes.includes(Lib.VM.ScoringProviders.Common.ScoreType.ESG)) {
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")));
        Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, ["Currency__", "GHGEmissionFactor__"], (records, error) => {
            if (error) {
                Log.Error(error);
            }
            else if (records && records.length > 0) {
                if (records[0].Currency__ === Data.GetValue("InvoiceCurrency__")) {
                    Data.SetValue("GHGEmissionFactor__", records[0].GHGEmissionFactor__);
                }
            }
        }, null, 1);
    }
}
/**
* Invoice type not fill by teach nor autolearn nor vendor preferred invoice type
*/
function initInvoiceType() {
    if (Lib.AP.IsDownPaymentInvoiceEnabled() && Lib.AP.MappingManager.DataExtractedFromEDI() &&
        Lib.AP.MappingManager.CurrentMapperDocument.IsDownPaymentInvoice()) {
        Log.Info("Setting invoice type from EDI Document type 386");
        Data.SetValue("InvoiceType__", Lib.AP.InvoiceType.DOWNPAYMENT_INVOICE);
    }
    else {
        if (!Data.IsComputed("InvoiceType__")) {
            const vendorPreferredInvoiceType = Lib.AP.Extraction.Vendor.GetVendorPreferredInvoiceType();
            if (vendorPreferredInvoiceType) {
                Log.Info(`Setting invoice type with preferred value from vendor (${vendorPreferredInvoiceType})`);
                Data.SetValue("InvoiceType__", vendorPreferredInvoiceType);
            }
            else {
                const defaultInvoiceType = Variable.GetValueAsString("InvoiceType");
                if (defaultInvoiceType) {
                    Log.Info(`Setting invoice type with external variable value (${defaultInvoiceType})`);
                    Data.SetValue("InvoiceType__", defaultInvoiceType);
                }
            }
        }
        if (Variable.GetValueAsString("IsSelfBillingInvoice") === "true") {
            traceDebug("Overwrite invoice type with Non-PO Invoice as the invoice is Self Billing");
            Data.SetValue("InvoiceType__", Lib.AP.InvoiceType.NON_PO_INVOICE);
        }
    }
}
function applyPartNumberEDIExtractionMode(mode) {
    if (Sys.Helpers.IsEmpty(mode) || mode === "BT-155" || !Lib.AP.MappingManager.DataExtractedFromEDI()) {
        return;
    }
    // Re-resolve PartNumber on each line using the mapper's preferred BT XPath, then push the
    // updated values back into the ExtractedLineItems__ table. This runs after initDefaultValues
    // (which fills line items using the first-non-empty XPathList fallback), ensuring the mode
    // is known and each PartNumber is matched to its own line node by the mapper itself.
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    mapperDoc.ApplyPartNumberEDIMode(mode);
    const updatedLineItems = mapperDoc.GetLineItems();
    const source = mapperDoc.GetComputedValueSource();
    const extractedTable = Data.GetTable("ExtractedLineItems__");
    const maxIndex = Math.min(extractedTable.GetItemCount(), updatedLineItems.length);
    for (let i = 0; i < maxIndex; i++) {
        const value = updatedLineItems[i].PartNumber;
        const item = extractedTable.GetItem(i);
        item.SetValue("PartNumberExtracted__", value);
        if (value) {
            item.SetComputedValueSource("PartNumberExtracted__", source);
        }
    }
}
function initParameters() {
    const setParametersCallback = function (lastAlertLevel, lastTouchlessEnabled, templateName, lineItemsImporterMapping, nonPOInvoiceEDILineExtractionMode, supplierReconciliationType, partNumberEDIPreferredExtractionValue, flux10_1_FirstLineOperationTypeMRU, flux10_1_FirstLineTaxRateMRU, eReportingEnabled) {
        Data.SetValue("DuplicateCheckAlertLevel__", lastAlertLevel);
        Data.SetValue("TouchlessEnabled__", lastTouchlessEnabled);
        Data.SetValue("CodingTemplate__", templateName);
        Data.SetValue("PartNumberEDIPreferredExtractionMode__", partNumberEDIPreferredExtractionValue);
        Variable.SetValueAsString("LineItemsImporterMapping", lineItemsImporterMapping ? lineItemsImporterMapping : "");
        Variable.SetValueAsString("NonPOInvoiceEDILineExtractionMode", nonPOInvoiceEDILineExtractionMode);
        Data.SetValue("SupplierReconciliationType__", supplierReconciliationType);
        Variable.SetValueAsString("Flux10_1_FirstLineOperationTypeMRU", flux10_1_FirstLineOperationTypeMRU);
        Variable.SetValueAsString("Flux10_1_FirstLineTaxRateMRU", flux10_1_FirstLineTaxRateMRU);
        if (eReportingEnabled === "1") {
            Data.SetValue("IsFlux10_1Compliant__", eReportingEnabled);
        }
        applyPartNumberEDIExtractionMode(partNumberEDIPreferredExtractionValue);
    };
    const companyCode = Data.GetValue("CompanyCode__");
    const vendorNumber = Data.GetValue("VendorNumber__");
    Lib.AP.Parameters.GetParameters(companyCode, vendorNumber, setParametersCallback);
}
function validateInvoiceCurrency() {
    if (!Lib.P2P.ExchangeRate.IsCurrencyDefinedForCompanyCode(Data.GetValue("CompanyCode__"), Data.GetValue("InvoiceCurrency__"))) {
        Data.SetValue("InvoiceCurrency__", Lib.P2P.ExchangeRate.GetCompanyCodeCurrency(Data.GetValue("CompanyCode__")));
    }
}
function updateExchangeRate() {
    const invoiceCurrency = Data.GetValue("InvoiceCurrency__");
    const corporateCurrency = Sys.Parameters.GetInstance("P2P").GetParameter("CorporateCurrency", "") || "";
    const localCurrency = Lib.P2P.ExchangeRate.GetCompanyCodeCurrency(Data.GetValue("CompanyCode__"));
    Data.SetValue("CorporateCurrency__", corporateCurrency);
    Data.SetValue("LocalCurrency__", localCurrency);
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    if (!invoiceDocument.RetrieveExchangeRate(invoiceCurrency, corporateCurrency, localCurrency, "")) {
        // Default path (non-SAP or SAP conditions not met)
        updateExchangeRateStandard(invoiceCurrency, corporateCurrency, localCurrency);
    }
    invoiceDocument.UpdateLocalAndCorporateAmounts();
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnUpdateExchangeRate");
}
function updateExchangeRateStandard(invoiceCurrency, corporateCurrency, localCurrency) {
    const exchangeRates = Lib.P2P.ExchangeRate.GetExchangeRates(Data.GetValue("CompanyCode__"), [invoiceCurrency, corporateCurrency]);
    const invoiceToLocalRate = exchangeRates[invoiceCurrency];
    Data.SetValue("ExchangeRate__", typeof invoiceToLocalRate === "number" ? invoiceToLocalRate.toString() : "");
    if (corporateCurrency === invoiceCurrency) {
        Data.SetValue("CorporateExchangeRate__", "1");
    }
    else if (typeof exchangeRates[corporateCurrency] === "number") {
        // exchangeRates[invoiceCurrency] is the rate to convert invoice currency amounts to local currency amounts
        // exchangeRates[corporateCurrency] is the rate to convert corporate currency amounts to local currency amounts
        // invoiceToCorporateExchangeRate is the rate to convert invoice currency amounts to local corporate amounts => invoiceToLocalExchangeRate / corporateToLocalRate
        const invoiceToCorporateExchangeRate = Lib.P2P.ExchangeRate.ComputeInvoiceToCorporateExchangeRate(corporateCurrency, invoiceCurrency, invoiceToLocalRate, exchangeRates[corporateCurrency]);
        Data.SetValue("CorporateExchangeRate__", typeof invoiceToCorporateExchangeRate === "number" ? invoiceToCorporateExchangeRate.toString() : "");
    }
}
function ApplyCodingsPrediction(overrideInputData) {
    const lineItemsTable = Data.GetTable("LineItems__");
    const vendorNumber = Data.GetValue("VendorNumber__");
    const companyCode = Data.GetValue("CompanyCode__");
    const extractedNetAmount = Data.GetValue("ExtractedNetAmount__");
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    let linesExtracted = 0;
    function setItemsAmountRepartitions(amountRepartition, totalPercentage, remainingAmount, lastDistribAmount) {
        if (amountRepartition.length > 0 && totalPercentage > 0 && remainingAmount !== 0) {
            let amountToDistribute = remainingAmount;
            for (let l = 0; l < amountRepartition.length; l++) {
                if (amountRepartition[l] != "$") {
                    let curItem = lineItemsTable.GetItem(l);
                    if (lastDistribAmount == l) {
                        curItem.SetValue("Amount__", amountToDistribute);
                    }
                    else {
                        const lineAmount = Math.round(100 * (Number(amountRepartition[l]) * remainingAmount) / Number(totalPercentage)) / 100;
                        amountToDistribute = amountToDistribute - lineAmount;
                        curItem.SetValue("Amount__", lineAmount);
                    }
                }
            }
        }
    }
    if (!companyCode || !vendorNumber) {
        return false;
    }
    const options = {
        CompanyCode: companyCode,
        VendorID: vendorNumber
    };
    if (overrideInputData) {
        options.OverrideInputData = overrideInputData;
    }
    try {
        let WSResult = Process.GetCodingsPrediction(options);
        if (WSResult && WSResult.status === 200) {
            let data = JSON.parse(WSResult.data);
            let extraInfo = JSON.parse(WSResult.extraInfo);
            const predictionsCustomized = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnGetCodingsPredictionResults", { data: data, extraInfo: extraInfo });
            if (predictionsCustomized) {
                data = predictionsCustomized.data;
                extraInfo = predictionsCustomized.extraInfo;
            }
            Variable.SetValueAsString("CodingsPredictionSampleSize", extraInfo.invoicesSampleSize);
            Log.Info(`[ Codings Prediction ] Sample size used for supplier ${vendorNumber}: ${extraInfo.invoicesSampleSize} invoices`);
            if (data[0] && data[0].PartnerUnknown) {
                Log.Info("[ Codings Prediction ] - Unknown supplier, using similar invoices from others suppliers to guess lines-codings");
            }
            const lineItemsColumns = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetCodingsPredictionFields")
                || ["LineType__", "Amount__", "GLAccount__", "CostCenter__", "TaxCode__"];
            const TaxHelper = Lib.AP.GetTaxHelper();
            const setTaxRateAndTaxAmount = function (item, taxRates, nonDeductibleTaxRate, roundingModes) {
                const taxRate = TaxHelper.setTaxRate(item, taxRates, nonDeductibleTaxRate, roundingModes);
                const setTaxAmount = function (it, taxAmount) {
                    it.SetValue("TaxAmount__", taxAmount);
                };
                TaxHelper.computeTaxAmount(item.GetValue("Amount__"), taxRate, setTaxAmount, item);
            };
            let remainingAmount = extractedNetAmount || 0;
            let totalPercentage = 0;
            let amountRepartition = [];
            let lastDistribAmount = -1;
            const fillLineFromPredictions = function (item, predictions, lineNumber, extraInfo = null) {
                var _a;
                let atLeastOneColumnExtracted = false;
                let lineTypeCandidate = Lib.P2P.LineType.GL;
                // Codings prediction API returns Amount without "__"
                predictions.Amount__ = predictions.Amount;
                const predictionConfidenceByField = (_a = extraInfo === null || extraInfo === void 0 ? void 0 : extraInfo.ScoresByFields) === null || _a === void 0 ? void 0 : _a[lineNumber];
                if (predictionConfidenceByField === null || predictionConfidenceByField === void 0 ? void 0 : predictionConfidenceByField.Amount) {
                    predictionConfidenceByField.Amount__ = predictionConfidenceByField.Amount;
                }
                for (let column of lineItemsColumns) {
                    if (!predictions[column]) {
                        continue;
                    }
                    if (column === "Amount__" && predictions.Amount && extractedNetAmount) {
                        if (predictions.Amount_type && predictions.Amount_type != "distrib" && predictions.Amount_Abs) {
                            if (predictions.Amount_Abs == "$") {
                                amountRepartition.push(Number(predictions.Amount));
                                totalPercentage = totalPercentage + Number(predictions.Amount);
                                lastDistribAmount = lineNumber;
                            }
                            else {
                                amountRepartition.push("$");
                                item.SetValue("Amount__", Number(predictions.Amount_Abs));
                                remainingAmount = remainingAmount - Number(predictions.Amount_Abs);
                            }
                        }
                        else {
                            item.SetValue("Amount__", Number(predictions.Amount) * extractedNetAmount);
                        }
                    }
                    else if (column === "LineType__") {
                        for (let lineType in Lib.P2P.LineType) {
                            if (Lib.P2P.LineType[lineType] === predictions.LineType__) {
                                lineTypeCandidate = predictions.LineType__;
                            }
                        }
                    }
                    else {
                        item.SetValue(column, predictions[column]);
                    }
                    atLeastOneColumnExtracted = true;
                    item.SetComputedValueSource(column, Lib.AP.ComputedValueSource.CODINGS_PREDICTION);
                    const isConfidenceSet = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnItemFieldSetConfidenceFromCodingsPrediction", item, lineNumber, column, extraInfo);
                    if (!isConfidenceSet && column !== "LineType__" && predictionConfidenceByField && predictionConfidenceByField[column]) {
                        setCodingsPredictionByConfidence(item, column, Number(predictionConfidenceByField[column]));
                    }
                }
                item.SetValue("LineType__", lineTypeCandidate);
                const isConfidenceSet = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnItemFieldSetConfidenceFromCodingsPrediction", item, lineNumber, "LineType__", extraInfo);
                if (!isConfidenceSet && predictionConfidenceByField && predictionConfidenceByField["LineType__"]) {
                    setCodingsPredictionByConfidence(item, "LineType__", Number(predictionConfidenceByField["LineType__"]));
                }
                return atLeastOneColumnExtracted;
            };
            const setCodingsPredictionByConfidence = function (item, column, confidence) {
                item.SetConfidence(column, confidence * 100);
            };
            lineItemsTable.SetItemCount(0);
            for (let i = 0; i < data.length; i++) {
                let curItem = lineItemsTable.AddItem();
                if (fillLineFromPredictions(curItem, data[i], i, extraInfo)) {
                    linesExtracted++;
                }
                Lib.P2P.fillCostTypeFromGLAccount(curItem);
                invoiceDoc.UpdateGLLineDescriptions(curItem);
                TaxHelper.getTaxRate(data[i].TaxCode__, "", companyCode, null, setTaxRateAndTaxAmount, curItem);
            }
            setItemsAmountRepartitions(amountRepartition, totalPercentage, remainingAmount, lastDistribAmount);
            Log.Info(`[ Codings Prediction ] - guessed codings for ${linesExtracted} lines`);
        }
        else {
            Log.Error(`[ Codings Prediction ] - Exception during webservice call: Status ${WSResult.status}, ${WSResult.lastMessage}`);
        }
    }
    catch (e) {
        Log.Warn(`[ Codings Prediction ] - Exception during webservice call : ${e}`);
    }
    return linesExtracted > 0;
}
function CreateMLDataFromMapper(enableMLDataCreation) {
    if (Lib.AP.MappingManager.DataExtractedFromEDI()) {
        const rawData = Lib.AP.MappingManager.CurrentMapperDocument.GetRawLineItems();
        // do not set data in ext variable if it won't be used
        if (rawData && enableMLDataCreation) {
            Variable.SetValueAsString("codingsPredictionData", rawData);
        }
        return rawData;
    }
    return null;
}
async function loadTemplateForPOInvoice() {
    if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.EnableCodingsTemplates") === false) {
        return;
    }
    const lineItemsTable = Data.GetTable("LineItems__");
    const vendorNumber = Data.GetValue("VendorNumber__");
    const companyCode = Data.GetValue("CompanyCode__");
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    await invoiceDoc.LoadTemplateForPOInvoice(companyCode, vendorNumber, lineItemsTable, Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts);
}
/** List of Item without an associated TaxCode */
const lineItemsWithoutTaxCode = {};
/**
 * Keep a map of all line items with a TaxRate but no TaxCode.
 * A query will be done and TaxCode will be added to all line items
 */
function checkForMissingTaxCode(lineItem) {
    if (lineItem && !lineItem.GetValue("TaxCode__") && lineItem.GetValue("TaxRate__") !== null) {
        const taxRate = parseFloat(lineItem.GetValue("TaxRate__"));
        if (isNaN(taxRate)) {
            return;
        }
        // Group all line items without TaxCode having the same TaxRate
        if (!lineItemsWithoutTaxCode[taxRate]) {
            lineItemsWithoutTaxCode[taxRate] = [];
        }
        lineItemsWithoutTaxCode[taxRate].push(lineItem);
    }
}
/**
 * Add the TaxCode to the line items listed in the missingTaxRate map
 */
function completeItemsWithMissingTaxCode() {
    if (!lineItemsWithoutTaxCode || Object.keys(lineItemsWithoutTaxCode).length === 0) {
        return;
    }
    const taxCodeFromMasterData = Lib.AP.TaxHelper.getTaxCodesForTaxRates(Object.keys(lineItemsWithoutTaxCode));
    if (taxCodeFromMasterData) {
        // Loop on all result from master data to complete the line items.
        // If no tax code found in master data, no loop will be done.
        // eslint-disable-next-line guard-for-in
        for (const taxRate in taxCodeFromMasterData) {
            const taxCodes = taxCodeFromMasterData[taxRate];
            // If multiple TaxCode exist for one TaxRate, ignore it
            if (taxCodes.length !== 1) {
                continue;
            }
            const taxCode = taxCodes[0];
            const associatedLineItems = lineItemsWithoutTaxCode[taxRate];
            if (associatedLineItems) {
                // Affect the TaxCode to all associated line items with this tax rate
                for (const lineItem of associatedLineItems) {
                    lineItem.SetValue("TaxCode__", taxCode);
                }
            }
        }
    }
}
function loadTemplateForGLInvoice() {
    const vendorNumber = Data.GetValue("VendorNumber__");
    let companyCode = Data.GetValue("CompanyCode__");
    const lineItemsTable = Data.GetTable("LineItems__");
    let templateName = Data.GetValue("CodingTemplate__");
    templateName = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetCodingTemplateName", templateName) || templateName;
    const extractedNetAmount = Data.GetValue("ExtractedNetAmount__");
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    const fillEDILineItemsWithGLLines = function () {
        if (Lib.AP.MappingManager.DataExtractedFromEDI()) {
            Lib.AP.CompanyCodeDetermination.InitCompanyCode();
            companyCode = Data.GetValue("CompanyCode__"); // re-init company code in case it was changed by company code determination
            const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
            const source = mapperDoc.GetComputedValueSource();
            const glLineItems = mapperDoc.GetGlLines(companyCode);
            if (glLineItems && glLineItems.length > 0) {
                Log.Info("Filling line items with extracted lines from mapper");
                lineItemsTable.SetItemCount(0);
                let curItem = lineItemsTable.AddItem();
                const customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
                for (let i = 0; i < glLineItems.length; i++) {
                    if (i > 0) {
                        curItem = curItem.AddItem();
                    }
                    FillNewLineItem(source, curItem, glLineItems[i], customDimensions);
                    checkForMissingTaxCode(curItem);
                }
                completeItemsWithMissingTaxCode();
            }
        }
    };
    const noResultCallback = function () {
        if (Data.GetValue("CodingTemplate__")) {
            Data.SetWarning("CodingTemplate__", "_TemplateWarning");
        }
        inferGLAccounts();
    };
    //try to call ML codings prevision WS
    let isDataCreated = false;
    if (companyCode && Sys.Parameters.GetInstance("AP").GetParameter("APCodingsPrediction") === "1") {
        const enableCodingsPrediction = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.EnableCodingsPrediction")
            || { enablePrediction: true, enableMLDataCreation: true };
        if (enableCodingsPrediction.enablePrediction) {
            const rawData = CreateMLDataFromMapper(enableCodingsPrediction.enableMLDataCreation);
            isDataCreated = ApplyCodingsPrediction(rawData);
        }
    }
    if (!isDataCreated) {
        // if we have a mapper document, we try to use the template only when property useCodingTemplate is true
        // else we always try to use the template
        // when loading template fails, we fallback to inferGLAccounts
        fillEDILineItemsWithGLLines();
        if ((!Lib.AP.MappingManager.DataExtractedFromEDI() || Lib.AP.MappingManager.CurrentMapperDocument.useCodingTemplate === true)
            && Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.EnableCodingsTemplates", templateName) !== false) {
            if (templateName) {
                Log.Info(`Trying to apply template ${templateName} for line extraction`);
            }
            else {
                Log.Info("Trying to apply a template for line extraction");
            }
            invoiceDoc.LoadTemplateForGLInvoice(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts, noResultCallback);
        }
    }
    /**
     * Fill the newly added LineItem with informations from EDI document
     * @param {Lib.AP.ComputedValueSource} source Name of the source
     * @param {Item} lineItemToSet The LineItem to fill
     * @param {Lib.AP.VIPLineItem} gLine The line details from EDI document
     * @param {Function} customDimensions Custom dimension to set based on the Lib.P2P.Customization.Common.GetCustomDimensions user exit
     */
    function FillNewLineItem(source, lineItemToSet, vipLineItem, customDimensions) {
        var _a;
        lineItemToSet.SetValue("LineType__", Lib.P2P.LineType.GL);
        lineItemToSet.SetValue("ItemNumber__", vipLineItem.ItemNumber);
        lineItemToSet.SetValue("ExtractedDetails__", ((_a = vipLineItem.ExtractedDetails) === null || _a === void 0 ? void 0 : _a.toString()) || null);
        function setValueAndSource(columnName, value) {
            lineItemToSet.SetValue(columnName, value !== null && value !== void 0 ? value : "");
            lineItemToSet.SetComputedValueSource(columnName, source);
        }
        setValueAndSource("Description__", vipLineItem.Description);
        setValueAndSource("Amount__", vipLineItem.Amount);
        setValueAndSource("CostCenter__", vipLineItem.CostCenter);
        setValueAndSource("TaxCode__", vipLineItem.TaxCode);
        setValueAndSource("TaxRate__", vipLineItem.TaxRate);
        setValueAndSource("AllowanceChargeCode__", vipLineItem.AllowanceChargeCode);
        setValueAndSource("GrossUnitPrice__", vipLineItem.RawUnitPrice || "");
        setValueAndSource("InvoicedUnitPrice__", vipLineItem.UnitPrice || "");
        setValueAndSource("NonDeductibleTaxRate__", vipLineItem.NonDeductibleTaxRate || "");
        setValueAndSource("TaxAmount__", vipLineItem.TaxAmount);
        setValueAndSource("ProjectCode__", vipLineItem.ProjectCode);
        if (!Sys.Helpers.IsEmpty(vipLineItem.InvoiceLinePeriodStartDate)) {
            setValueAndSource("InvoiceLinePeriodStartDate__", new Date(vipLineItem.InvoiceLinePeriodStartDate));
        }
        if (!Sys.Helpers.IsEmpty(vipLineItem.InvoiceLinePeriodEndDate)) {
            setValueAndSource("InvoiceLinePeriodEndDate__", new Date(vipLineItem.InvoiceLinePeriodEndDate));
        }
        if (vipLineItem.ExtractedDetails && Lib.AP.AllowanceCharge.IsAllowanceChargeLine(vipLineItem.ExtractedDetails)) {
            const glAccount = Lib.AP.AllowanceCharge.GLAccountMapping.GetGLAccountFromAllowanceCharge(vipLineItem.AllowanceChargeCode, vipLineItem.Description);
            if (glAccount) {
                lineItemToSet.SetValue("GLAccount__", glAccount);
                lineItemToSet.SetComputedValueSource("GLAccount__", Lib.AP.ComputedValueSource.ALLOWANCECHARGE_GLACCOUNTS);
            }
        }
        else {
            setValueAndSource("GLAccount__", vipLineItem.GLAccount);
        }
        Lib.P2P.fillCostTypeFromGLAccount(lineItemToSet);
        if (customDimensions && customDimensions.codingTemplates) {
            for (const template of customDimensions.codingTemplates) {
                if (vipLineItem[template.nameInTable] !== undefined) {
                    setValueAndSource(template.nameInForm, vipLineItem[template.nameInTable]);
                }
            }
        }
        invoiceDoc.UpdateGLLineDescriptions(lineItemToSet);
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnFillNewLineItemEnd", source, lineItemToSet, vipLineItem, customDimensions);
    }
}
function setGLAccountAndGLDescription(item, GLAccount) {
    item.SetValue("GLAccount__", GLAccount);
    item.SetComputedValueSource("GLAccount__", Lib.AP.ComputedValueSource.SYNERGY_GLACCOUNTFR);
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    invoiceDoc.UpdateGLLineDescriptions(item);
}
function inferGLAccounts() {
    if (Sys.Parameters.GetInstance("AP").GetParameter("GLAccountDeterminationFrench") === "1" && Data.GetValue("InvoiceType__") === "Non-PO Invoice") {
        const jsonString = Process.GetSynergyExtraction("SynergyGLAccountFR");
        let glAccounts = {};
        try {
            glAccounts = JSON.parse(jsonString);
        }
        catch (e) {
            Log.Error("SynergyGLAccountFR : Failed to parse JSON");
            return;
        }
        let bestGLAccount = null;
        let bestScore = 0;
        for (const glAccount in glAccounts) {
            if (glAccounts[glAccount] > bestScore) {
                bestGLAccount = glAccount;
                bestScore = glAccounts[glAccount];
            }
        }
        const lineItems = Data.GetTable("LineItems__");
        const nbItems = lineItems.GetItemCount();
        if (nbItems > 0 && bestGLAccount) {
            for (let i = 0; i < nbItems; i++) {
                const item = lineItems.GetItem(i);
                if (!item.GetValue("GLAccount__")) {
                    setGLAccountAndGLDescription(item, bestGLAccount);
                }
            }
        }
    }
}
function setDigitalSignatureField(CheckSignatureResult) {
    switch (CheckSignatureResult) {
        case "NoSignature":
            Data.SetValue("DigitalSignature__", "Not signed");
            break;
        case "SignatureInvalid":
            Data.SetValue("DigitalSignature__", "Invalid Corrupted");
            break;
        case "SignatureOk":
            Data.SetValue("DigitalSignature__", "Verified");
            break;
        case "SignatureDone":
            Data.SetValue("DigitalSignature__", "Signed");
            break;
        case "SignatureError":
            Data.SetValue("DigitalSignature__", "Signature failed");
            break;
        case "InvalidSignatureParameters":
        case "InvalidParameters":
            Data.SetValue("DigitalSignature__", "Invalid parameters");
            break;
        case "SignatureNotVerified":
            Data.SetValue("DigitalSignature__", "SignatureNotVerified");
            break;
        //case 'VerificationError':
        //case 'InvalidFileExtension':
        default:
            Data.SetValue("DigitalSignature__", "Unknown");
            break;
    }
}
function getCleanDigitalSignatureDetail(CheckSignatureDetail) {
    let result = CheckSignatureDetail;
    // check if starting with SignerInvalid
    const signerInvalidIdx = result.indexOf("SignerInvalid");
    if (signerInvalidIdx > -1) {
        const errorDetailIdx = result.indexOf(": ", signerInvalidIdx);
        result = result.substring(errorDetailIdx + 1);
    }
    else {
        // try extraction extract between quote
        const firstQuoteIdx = result.indexOf('"');
        if (firstQuoteIdx > -1) {
            const secondQuoteIdx = result.indexOf('"', firstQuoteIdx + 1);
            result = result.substring(firstQuoteIdx + 1, secondQuoteIdx);
        }
    }
    return result;
}
function manageSignatureResult(result) {
    let resultShortStatus = result;
    let resultLongStatus = "";
    const splitResultIdx = result.indexOf(": ");
    if (splitResultIdx > 0) {
        resultShortStatus = result.substr(0, splitResultIdx);
        Log.Warn(result.substr(splitResultIdx + 2));
        if (resultShortStatus !== "VerificationError") {
            resultLongStatus = getCleanDigitalSignatureDetail(result.substr(splitResultIdx + 2));
        }
    }
    setDigitalSignatureField(resultShortStatus);
    Variable.SetValueAsString("InvoiceSignature", resultShortStatus);
    Variable.SetValueAsString("InvoiceSignatureDetail", resultLongStatus);
}
function getProcessedDocumentIndex() {
    const nbAttach = Attach.GetNbAttach();
    for (let i = 0; i < nbAttach; i++) {
        if (Attach.IsProcessedDocument(i)) {
            return i;
        }
    }
    return -1;
}
/**
 * Return the FromCountry for the signature check.
 * The From can be the Country of the vendor portal user
 * else the Country of the vendor
 * else the default country provided
 * @param {string} defaultCountry The default country if no country was found
 * @return {string} The From country
 */
function getFromCountry(defaultCountry) {
    let country = null;
    if (Data.GetValue("ReceptionMethod__") === Lib.AP.ReceptionMethod.VendorPortal) {
        const json = Lib.AP.VendorPortal.GetParametersFromDataInvoice(Data);
        const vendorContact = Lib.AP.VendorPortal.GetVendorUser(json);
        if (vendorContact) {
            country = vendorContact.GetValue("Country");
        }
    }
    else {
        country = Data.GetValue("VendorCountry__");
    }
    return country ? country : defaultCountry;
}
function manageSignature() {
    let companyCodeCountry = "";
    function CheckCompanyCountry(_CCValue, _IsSignature) {
        // Check if company code query return a company code
        if (Object.keys(_CCValue).length === 0) {
            Log.Info((_IsSignature ? "Signature" : "Validation") + " : Error on company code");
            manageSignatureResult(_IsSignature ? "InvalidSignatureParameters" : "InvalidParameters");
            return false;
        }
        companyCodeCountry = _CCValue.Country__;
        // Check if the country code linked to company is valid
        if (!Sys.Locale.Country.GetCountryName(companyCodeCountry)) {
            Log.Info(`${_IsSignature ? "Signature" : "Validation"} : Country code linked to company code is invalid : ${companyCodeCountry}`);
            manageSignatureResult(_IsSignature ? "InvalidSignatureParameters" : "InvalidParameters");
            return false;
        }
        return true;
    }
    // Request company code table to get company code data
    Lib.P2P.CompanyCodesValue.QueryValues(Data.GetValue("CompanyCode__")).Then(function (CCValues) {
        /**
        if document is sign 	-> check signature
        if document is not sign -> sign it
        **/
        const processDocumentIdx = getProcessedDocumentIndex();
        if (processDocumentIdx !== -1) {
            if (Sys.AP.Server.IsSigned(processDocumentIdx)) {
                /** Check first attachment signature**/
                if (Sys.Parameters.GetInstance("AP").GetParameter("VerificationCheckAttachmentSignature") === "1") {
                    if (!CheckCompanyCountry(CCValues, false)) {
                        return;
                    }
                    const fromCountry = getFromCountry(companyCodeCountry);
                    const toCountry = companyCodeCountry;
                    manageSignatureResult(Sys.AP.Server.CheckSignature("TrustWeaver", processDocumentIdx, fromCountry, toCountry));
                }
                else {
                    manageSignatureResult("SignatureNotVerified");
                }
            }
            else if (Sys.Parameters.GetInstance("AP").GetParameter("SignInvoicesForArchiving") === "1") {
                if (!CheckCompanyCountry(CCValues, true)) {
                    return;
                }
                /** Sign first attachment **/
                manageSignatureResult(Sys.AP.Server.SignDocument("TrustWeaver", processDocumentIdx, companyCodeCountry, companyCodeCountry));
            }
            else {
                manageSignatureResult("NoSignature");
            }
        }
        else {
            Log.Info("Signature/Validation : No document to process defined.");
        }
    });
}
function setVIPDataLines(jsonValue) {
    let lineItemsLine;
    if (jsonValue.tables.LineItems.length === 0) {
        lineItemsLine = new Lib.AP.VIPLineItem();
    }
    else {
        lineItemsLine = jsonValue.tables.LineItems.pop();
    }
    lineItemsLine.ItemNumber = "1";
    lineItemsLine.Description = jsonValue.header.ContractReferenceNumber;
    lineItemsLine.PartNumber = jsonValue.header.BillingScheduleID;
    lineItemsLine.Amount = jsonValue.header.NetAmount;
    lineItemsLine.Quantity = "1";
    lineItemsLine.Unit = "PC";
    lineItemsLine.UnitPrice = jsonValue.header.NetAmount;
    lineItemsLine.TaxRate = "0.00";
    lineItemsLine.TaxAmount = "0.00";
    jsonValue.tables.LineItems.push(lineItemsLine);
    return jsonValue;
}
function setVIPDataTaxInfo(jsonValue) {
    let TaxInfo;
    if (jsonValue.tables.TaxInformations.length === 0) {
        TaxInfo = new Lib.AP.VIPTaxInformation();
    }
    else {
        TaxInfo = jsonValue.tables.TaxInformations.pop();
    }
    TaxInfo.TaxableAmount = jsonValue.header.NetAmount;
    TaxInfo.TaxAmount = "0";
    TaxInfo.TaxRate = "0";
    jsonValue.tables.TaxInformations.push(TaxInfo);
    return jsonValue;
}
function generatePdf(jsonValue, templatePath, filename, jsonNumberNeedFormat) {
    if (Variable.GetValueAsString("IsSelfBillingInvoice") === "true") {
        jsonValue = setVIPDataLines(jsonValue);
        jsonValue = setVIPDataTaxInfo(jsonValue);
    }
    let isAttached = false;
    let error = "";
    const reportTemplate = Process.GetResourceFile(templatePath);
    if (reportTemplate) {
        try {
            jsonValue = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.AdjustJsonForPdf", jsonValue) || jsonValue;
            const jsonFile = TemporaryFile.CreateFile("VIP.JSON", "utf16");
            if (!jsonFile) {
                Log.Error("Temporary file creation failed: vip.json");
                throw "Couldn't create the json file";
            }
            if (jsonNumberNeedFormat) {
                Lib.AP.VendorInvoice.FormatJsonNumberFields(jsonValue);
            }
            Lib.AP.VendorInvoice.NormalizeJSONForCrystalReport(jsonValue);
            TemporaryFile.Append(jsonFile, JSON.stringify(jsonValue));
            const cvtFile = jsonFile.ConvertFile({ conversionType: "crystal2020", report: reportTemplate });
            if (!cvtFile) {
                throw "Crystal report error";
            }
            const index = Attach.GetNbAttach();
            isAttached = Attach.AttachTemporaryFile(cvtFile, {
                name: filename,
                attachAsConverted: true,
                attachAsFirst: true
            });
            if (!isAttached) {
                throw "Couldn't attach the generated file";
            }
            Variable.SetValueAsString("HumanReadableAttachmentName", filename);
            Attach.SetValue(index, "AttachConvertedFiles", 0);
        }
        catch (ex) {
            error = `The document could not be formatted: ${ex}`;
        }
    }
    else {
        error = "The document could not be formatted: Template not found";
    }
    if (error) {
        Log.Error(error);
    }
    return isAttached;
}
function getAttachFileNameWithExtension(index, extension) {
    let fileName = Attach.GetAttach(index).GetVars().GetValue_String("AttachOriginalName", 0);
    if (Variable.GetValueAsString("IsSelfBillingInvoice") === "true") {
        fileName = "Vendor Invoice";
    }
    const lastDot = fileName.lastIndexOf(".");
    fileName = lastDot > 0 ? fileName.substr(0, lastDot) : fileName;
    fileName += extension;
    return fileName;
}
function getJsonAttachFile() {
    // Start looking for the json file from the end
    let idx = Attach.GetNbAttach() - 1;
    while (idx > -1 && Attach.GetInputFile(idx).GetExtension().toLowerCase() !== ".json") {
        idx--;
    }
    Log.Info("JSON file is at index " + idx);
    return idx;
}
/*
* Clears the extracted line items table if its data was not teached
* At the beginning of the extraction script, the extracted line items can be teached, autolearned, or come from SSN
* Calling this function at the start of the script allows to clear the table if its data comes from SSN or autolearning
*/
function clearExtractedItemsIfNotTeached() {
    const lineItemsTable = Data.GetTable("ExtractedLineItems__");
    if (lineItemsTable.GetItemCount() > 0) {
        const firstItem = lineItemsTable.GetItem(0);
        const areItemsTeached = firstItem.IsComputed("OrderNumberExtracted__")
            || firstItem.IsComputed("DeliveryNoteExtracted__")
            || firstItem.IsComputed("PartNumberExtracted__")
            || firstItem.IsComputed("UnitPriceExtracted__")
            || firstItem.IsComputed("QuantityExtracted__")
            || firstItem.IsComputed("AmountExtracted__");
        if (!areItemsTeached) {
            lineItemsTable.SetItemCount(0);
        }
    }
}
function getFileDataFromAttachment() {
    let isConvertedFile = false;
    const receptionMethod = Data.GetValue("ReceptionMethod__");
    let idx = 0;
    if (receptionMethod === Lib.AP.ReceptionMethod.Claims || receptionMethod === Lib.AP.ReceptionMethod.VendorPortal) {
        // In Expense the file containing invoice data is not attached at idx = 0 (Also, it's a json file)
        idx = getJsonAttachFile();
    }
    else if (Attach.GetNbAttach() === 1 && Attach.GetInputFile(0).GetExtension().toLowerCase() === ".json") {
        idx = 0;
    }
    const customIdx = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.EDI.GetSourceAttachmentIndex", idx);
    if (Number.isInteger(customIdx) && customIdx >= 0 && customIdx < Attach.GetNbAttach()) {
        idx = customIdx;
    }
    return { idx: idx, isConvertedFile: isConvertedFile };
}
function getFileFromData(idx, isConvertedFile) {
    let file = null;
    if (idx > -1) {
        file = isConvertedFile ? Attach.GetConvertedFile(idx) : Attach.GetInputFile(idx);
    }
    else {
        Log.Error("No file to process...");
    }
    return file;
}
function handleEDICompliance(mapperDocument, file) {
    if (mapperDocument instanceof Lib.AP.Mapping.EDIDocument && Lib.AP.EDI.IsEDIComplianceApplicable()) {
        const mapperEDIDocument = mapperDocument;
        const { status, fatalErrors, warnings } = mapperEDIDocument.CheckEDICompliance(file);
        Data.SetValue("EDIComplianceType__", mapperEDIDocument.GetEDIComplianceType());
        Variable.SetValueAsString("EDIValidationMessages", JSON.stringify({ fatalErrors, warnings }));
        Data.SetValue("EDIComplianceStatus__", status);
    }
}
function handleAttachmentProperties(mapperDocument, idx) {
    Attach.SetTechnical(idx, mapperDocument.IsProcessDocumentTechnical());
    if (!mapperDocument.IsProcessDocumentTechnical()) {
        Attach.SetThumbnailPreviewLogo(idx, mapperDocument.GetProcessedDocumentThumbnailPreviewLogo());
        mapperDocument.SetPreviewStylesheet(idx);
    }
}
function getInvoiceDataFromFile(file, idx) {
    var _a;
    if (file && (!Document.IsLoaded() || [".txt", ".json", ".xml", ".edi", ".pdf"].indexOf(file.GetExtension().toLowerCase()) > -1)) {
        Log.Info("Searching Mapping Lib for data extraction...");
        const mapperDocument = getMapperDocument(file);
        if (mapperDocument) {
            Log.Info("Using Mapping Lib for data extraction");
            Lib.AP.MappingManager.SetCurrentMapperDocument(mapperDocument);
            mapperDocument.Run(TemporaryFile);
            handleEDICompliance(mapperDocument, file);
            handleAttachmentProperties(mapperDocument, idx);
            if (mapperDocument.IsDataExtractedFromEDI()) {
                addDefaultLinesItemIfNeeded(mapperDocument, mapperDocument.toJson());
                if (Data.GetValue("ReceptionMethod__") !== Lib.AP.ReceptionMethod.PDP) {
                    Data.SetValue("ReceptionMethod__", mapperDocument.GetReceptionMethod());
                }
                Data.SetValue("SourceDocument__", (_a = mapperDocument.GetSourceDocument()) !== null && _a !== void 0 ? _a : "");
            }
        }
    }
}
function computeNewMessage() {
    if (Data.IsNullOrEmpty("PortalRuidEx__")) {
        return;
    }
    let conversationId = null;
    const conversationQuery = Process.CreateQueryAsProcessAdmin();
    conversationQuery.Reset();
    conversationQuery.SetSpecificTable("CDNAME#Conversation__");
    let ldapFilter = Sys.Helpers.LdapUtil.FilterEqual("documentruidex", Data.GetValue("RUIDEX"));
    conversationQuery.SetFilter(ldapFilter.toString());
    conversationQuery.SetAttributesList("id");
    conversationQuery.SetOptions(DBFastAccess | DBDirtyRead);
    conversationQuery.SetOptionEx("Limit=1");
    if (conversationQuery.MoveFirst()) {
        const recordConversation = conversationQuery.MoveNextRecord();
        if (recordConversation) {
            const recordVars = recordConversation.GetVars();
            conversationId = recordVars.GetValue_String("id", 0);
            const conversationItemQuery = Process.CreateQueryAsProcessAdmin();
            conversationItemQuery.Reset();
            conversationItemQuery.SetSpecificTable("CDNAME#Conversation__Items__");
            ldapFilter = Sys.Helpers.LdapUtil.FilterEqual("id", conversationId);
            conversationItemQuery.SetFilter(ldapFilter.toString());
            conversationItemQuery.SetAttributesList("id");
            conversationItemQuery.SetOptions(DBFastAccess | DBDirtyRead);
            conversationItemQuery.SetOptionEx("Limit=1");
            if (conversationItemQuery.MoveFirst()) {
                const recordConversationItem = conversationItemQuery.MoveNextRecord();
                if (recordConversationItem) {
                    Log.Info("recordConversationItem is found");
                    Data.SetValue("NewConversationMessage", 1);
                }
            }
        }
    }
}
function initExtraction() {
    var _a;
    Lib.AP.InitArchiveDuration();
    const defaultTablesToIndex = ["LineItems__", "ApproversList__"];
    Lib.P2P.SetTablesToIndex((_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.CustomizeTablesToIndex", defaultTablesToIndex)) !== null && _a !== void 0 ? _a : defaultTablesToIndex);
    const shouldClearLineItems = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.ShouldClearExtractedLineItems");
    const autolearningOnPOLinesIsActive = Sys.Parameters.GetInstance("AP").GetParameter("AutolearningOnPOLines", "0") === "1";
    const autocompleteOnLineItemsIsActive = Sys.Parameters.GetInstance("AP").GetParameter("EnableAutocompleteOnLineItems", "0") === "1";
    if (shouldClearLineItems === true
        || (typeof shouldClearLineItems !== "boolean" && !autolearningOnPOLinesIsActive && !autocompleteOnLineItemsIsActive)) {
        clearExtractedItemsIfNotTeached();
    }
    // Read EDI information - Can force CompanyCode
    const fileData = getFileDataFromAttachment();
    const file = getFileFromData(fileData.idx, fileData.isConvertedFile);
    getInvoiceDataFromFile(file, fileData.idx);
    computeNewMessage();
}
function endExtraction() {
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    let CDVFile = null;
    let PeppolIRFile = null;
    if (mapperDoc) {
        let firstAttachSet = false;
        if (mapperDoc.EnableHumanReadablePDFGeneration()) {
            // Generate Human readable PDF for EDI invoices
            firstAttachSet = generateHumanReadable(mapperDoc);
        }
        else {
            Log.Info("Disable Crystal Report generation for this document");
            if (mapperDoc.IsPreviewAvailableForProcessDocument()) {
                // as HTML preview will be displayed first, we don't want potential embedded in xml docs to be attach first in carousel
                firstAttachSet = true;
            }
        }
        mapperDoc.AttachEmbeddedDocuments(!firstAttachSet, TemporaryFile);
        mapperDoc.SetProcessingLabel();
        // Retrieve EDI file which will use to create CDV
        if (mapperDoc instanceof Lib.AP.Mapping.EDIDocument) {
            const mapperDocEDI = mapperDoc;
            CDVFile = mapperDocEDI.GetEDIDocumentSource();
            if (mapperDoc instanceof Lib.AP.Mapping.UBLInvoiceDocument) {
                PeppolIRFile = CDVFile;
            }
        }
    }
    Lib.AP.GetInvoiceDocument().EndExtraction();
    handleContractValidity();
    // Batch process CF_C5_TaxType__ fields for all line items
    const lineItems = Data.GetTable("LineItems__");
    if (lineItems && lineItems.GetItemCount() > 0) {
        Lib.AP.TaxHelper.SetC5TaxTypeOnAllLineItems(lineItems);
    }
    if (Lib.AP.ReceptionMethod.isEDI() && Sys.Parameters.GetInstance("AP").GetParameter("CheckIntercompanyInvoices", "0") === "1" && Data.GetValue("IntercompanyInvoice__")) {
        //Check if Intercompany invoice exists in table
        Lib.AP.SetExistingIntercompanyInvoiceERPNumber();
    }
    //create a new vendor invoice CDV process
    Sys.FRB2B.AP.CreateVICDV(CDVFile);
    Sys.Peppol.AP.CreatePeppolIR(PeppolIRFile);
    Sys.FRB2B.AP.ValidationRules.CheckInvoiceTypeBusinessProcessTypeConsistency("EDIInvoiceType__", "EDIBusinessProcessType__");
}
function computeLineAmountFromTaxBreakdown(json, taxInfo) {
    // Tax infos (BT-116) include header level allowances & charges.
    // reconstitute line item amount from sales tax breakdown without it
    let lineAmount = parseFloat(taxInfo.TaxableAmount);
    for (const ac of json.tables.AllowanceCharges) {
        if (ac.TaxRate === taxInfo.TaxRate) {
            lineAmount -= parseFloat(ac.Amount);
        }
    }
    return lineAmount.toString();
}
function retrieveInfoFromTaxInfos(json, taxInfos, headerInfos, description) {
    json.tables.LineItems = [];
    taxInfos.forEach((tax, index) => {
        const newLine = new Lib.AP.VIPLineItem();
        newLine.Amount = computeLineAmountFromTaxBreakdown(json, tax);
        newLine.TaxCode = tax.TaxCode;
        newLine.TaxRate = tax.TaxRate;
        newLine.OrderNumber = headerInfos.OrderNumber;
        newLine.Description = description;
        newLine.ExtractedDetails = new Lib.AP.ExtractedDetailsForHeader(index, Sys.AP.PreviewMappingLineType.TaxBreakdown);
        json.tables.LineItems.push(newLine);
    });
}
function retrieveInfoFromHeader(json, headerInfos, description) {
    const emptyLine = { OrderNumber: null, TaxAmount: null, Description: null };
    const line = json.tables.LineItems.length === 0 ? emptyLine : json.tables.LineItems[0];
    const newLine = new Lib.AP.VIPLineItem();
    newLine.Amount = headerInfos.NetAmount;
    newLine.OrderNumber = Sys.Helpers.IsEmpty(line.OrderNumber) ? headerInfos.OrderNumber : line.OrderNumber;
    newLine.TaxAmount = Sys.Helpers.IsEmpty(line.TaxAmount) ? headerInfos.TaxAmount : line.TaxAmount;
    newLine.Description = Sys.Helpers.IsEmpty(line.Description) ? description : line.Description;
    json.tables.LineItems[0] = newLine;
}
// XML without line item, add default lines item
function addDefaultLinesItemIfNeeded(mapperDocument, json) {
    if (json.tables.LineItems.length === 0 || (json.tables.LineItems.length === 1 && Sys.Helpers.IsEmpty(json.tables.LineItems[0].Amount))) {
        const taxInfos = json.tables.TaxInformations;
        const headerInfos = json.header;
        const typeDoc = Language.Translate(mapperDocument.IsCreditNote() ? "_CreditNote" : "_Invoice");
        const description = headerInfos.InvoiceNumber ? `${typeDoc} ${headerInfos.InvoiceNumber}` : null;
        if (taxInfos.length > 0 && !Sys.Helpers.IsEmpty(taxInfos[0].TaxableAmount)) {
            retrieveInfoFromTaxInfos(json, taxInfos, headerInfos, description);
        }
        else if (json.tables.LineItems.length > 0) {
            retrieveInfoFromHeader(json, headerInfos, description);
        }
    }
}
function generateHumanReadable(mapperDoc) {
    const templatePath = mapperDoc.GetConversionTemplatePath();
    let isHumandReadableGenerated = false;
    if (templatePath) {
        const fileName = getAttachFileNameWithExtension(0, ".pdf");
        const languageTemplateFileName = mapperDoc.GetLanguageTemplateFileName();
        if (languageTemplateFileName) {
            try {
                const currentUser = Lib.P2P.GetValidatorOrOwner();
                const templateContent = currentUser.GetTemplateContent({
                    templateName: languageTemplateFileName,
                    language: currentUser.GetValue("Language")
                });
                const parsedLanguageContent = JSON.parse(templateContent.content).language;
                mapperDoc.SetLanguageContent(parsedLanguageContent);
            }
            catch (e) {
                Log.Error(`Failed to get language content from file ${languageTemplateFileName}: ${e}`);
            }
        }
        const json = mapperDoc.toJson();
        if (json) {
            if (!json.error) {
                isHumandReadableGenerated = generatePdf(json, templatePath, fileName, mapperDoc.JSONNumberNeedFormat());
            }
            else {
                Log.Error("Failed to generatePDF from json: " + json.error);
            }
        }
        else {
            Log.Error("Failed to generatePDF from json");
        }
    }
    return isHumandReadableGenerated;
}
function tryQueryVendorNumberFromMRU(companyCode, extractedVendorTaxIdentification, extractedVendorVATNumber) {
    if (tryQueryBusinessValueFromMRU(companyCode, "VendorNumber__", extractedVendorTaxIdentification)) {
        return Lib.AP.Mapping.VendorNumberDeterminedBy.Siret;
    }
    else if (tryQueryBusinessValueFromMRU(companyCode, "VendorNumber__", extractedVendorVATNumber)) {
        return Lib.AP.Mapping.VendorNumberDeterminedBy.VATNumber;
    }
    return null;
}
function tryQueryBusinessValueFromMRU(companyCode, fieldName, extractedValue) {
    if (Sys.Helpers.IsEmpty(extractedValue)) {
        return false;
    }
    const businessValue = Lib.AP.Extraction.CrossReference.GetERPValue(companyCode, fieldName, extractedValue);
    if (businessValue) {
        Log.Info(`Setting ${fieldName} with MRU value ${businessValue}`);
        Data.SetValue(fieldName, businessValue);
        return true;
    }
    return false;
}
function fillPayeeFromMapperDocument() {
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    const companyCode = Data.GetValue("CompanyCode__");
    // list ordered by priority of vendor's identification
    const arrayForDeterminingPayee = [
        {
            searchedField: "Siret__",
            searchFieldValue: mapperDoc.GetPayeeTaxIdentification(),
            fieldToDetermineVendor: Lib.AP.Mapping.VendorNumberDeterminedBy.Siret
        },
        {
            searchedField: "VATNumber__",
            searchFieldValue: mapperDoc.GetPayeeVATNumber(),
            fieldToDetermineVendor: Lib.AP.Mapping.VendorNumberDeterminedBy.VATNumber
        },
        {
            searchedField: "Name__",
            searchFieldValue: mapperDoc.GetPayeeName(),
            fieldToDetermineVendor: Lib.AP.Mapping.VendorNumberDeterminedBy.VendorName
        }
    ];
    const payeeInfo = Lib.P2P.EDI.GetVendorLookupInfo(arrayForDeterminingPayee);
    if (payeeInfo.length > 0) {
        let payeeNumberDeterminedBy = Lib.P2P.EDI.tryQueryVendorFromTable(companyCode, arrayForDeterminingPayee, fillPayeeFieldsFromQueryResult);
        if (payeeNumberDeterminedBy) {
            Log.Info(`Found payee thanks to ${payeeNumberDeterminedBy}`);
            Data.SetComputedValueSource("AlternativePayee__", Lib.AP.ComputedValueSource.EDI);
            if (mapperDoc instanceof Lib.AP.Mapping.EDIDocument) {
                const mapperDocEDI = mapperDoc;
                mapperDocEDI.UpdateAlternativePayeeHTMLId(payeeNumberDeterminedBy);
            }
        }
        else {
            Log.Warn(`Payee not found by ${payeeInfo.map(determinedBy => determinedBy.searchedField).join(" or ")}`);
            Data.SetError("AlternativePayee__", "_Could not find any value for payee {0}", payeeInfo[0].searchFieldValue);
            payeeNumberDeterminedBy = payeeInfo[0].fieldToDetermineVendor;
        }
    }
}
function fillVendorFromVendorNumber(companyCode, vendorNumberSource) {
    const vendorNumber = Data.GetValue("VendorNumber__");
    if (vendorNumber) {
        if (vendorNumberSource) {
            Data.SetComputedValueSource("VendorNumber__", vendorNumberSource);
        }
        const invoiceDocument = Lib.AP.GetInvoiceDocument();
        invoiceDocument.SearchVendorNumber(companyCode, vendorNumber, null, Lib.AP.Extraction.Vendor.FillVendorFieldsFromQueryResult, null);
    }
}
function fillVendorFromMapperDocument() {
    var _a;
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    const companyCode = Data.GetValue("CompanyCode__");
    // First we try to retrieve vendor number using record in table AP - Extraction Mapping__, or check if it is disabled by User Exit
    const vendorMRUIsDisabled = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.DisableVendorMRU")) !== null && _a !== void 0 ? _a : false;
    let vendorNumberDeterminedBy = vendorMRUIsDisabled ? null : tryQueryVendorNumberFromMRU(companyCode, mapperDoc.GetVendorTaxIdentification(), mapperDoc.GetVendorVATNumber());
    if (vendorNumberDeterminedBy) {
        fillVendorFromVendorNumber(companyCode, Lib.AP.ComputedValueSource.EDI_EXTRACTION_MAPPING);
        return vendorNumberDeterminedBy;
    }
    // If not found we try by querying Vendors table
    // List ordered by priority of vendor's identification
    let vendorDeterminationMethods = [
        {
            searchedField: "Number__",
            searchFieldValue: mapperDoc.GetVendorNumber(),
            fieldToDetermineVendor: Lib.AP.Mapping.VendorNumberDeterminedBy.VendorNumber
        },
        {
            searchedField: "Siret__",
            searchFieldValue: mapperDoc.GetVendorTaxIdentification(),
            fieldToDetermineVendor: Lib.AP.Mapping.VendorNumberDeterminedBy.Siret
        },
        {
            searchedField: "VATNumber__",
            searchFieldValue: mapperDoc.GetVendorVATNumber(),
            fieldToDetermineVendor: Lib.AP.Mapping.VendorNumberDeterminedBy.VATNumber
        },
        {
            searchedField: "Name__",
            searchFieldValue: mapperDoc.GetVendorName(),
            fieldToDetermineVendor: Lib.AP.Mapping.VendorNumberDeterminedBy.VendorName
        }
    ];
    // call user exit function to customize the array of fields to determine vendor
    vendorDeterminationMethods = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.CustomizeVendorDeterminationMethods", vendorDeterminationMethods, mapperDoc) || vendorDeterminationMethods;
    vendorNumberDeterminedBy = Lib.P2P.EDI.tryQueryVendorFromTable(companyCode, vendorDeterminationMethods, Lib.AP.Extraction.Vendor.FillVendorFieldsFromQueryResult);
    if (vendorNumberDeterminedBy) {
        Log.Info(`Found vendor thanks to ${vendorNumberDeterminedBy}`);
        Data.SetComputedValueSource("VendorNumber__", Lib.AP.ComputedValueSource.EDI);
        return vendorNumberDeterminedBy;
    }
    // Check if invoice is filled from mapper, and vendor was found another way (AL/Teaching)
    fillVendorFromVendorNumber(companyCode);
    return null;
}
function setFormFieldsFromMapperDocument(vendorNumberDeterminedBy) {
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    if (vendorNumberDeterminedBy && mapperDoc instanceof Lib.AP.Mapping.EDIDocument) {
        const mapperDocEDI = mapperDoc;
        // If document is an EDI invoice, we can set HTML preview highlight on the invoice field that allowed us to find the vendor number
        mapperDocEDI.UpdateVendorNumberHTMLId(vendorNumberDeterminedBy);
        setIntercompanyInvoice(mapperDocEDI);
    }
}
function setIntercompanyInvoice(mapperDoc) {
    // Try SIRET/SIREN match first
    let matchingCompanyCode = Lib.AP.GetCompanyCodeBySIRET(mapperDoc.GetVendorTaxIdentification());
    // Fall back to VAT number match if no SIRET/SIREN match found
    if (!matchingCompanyCode) {
        const vendorVATNumber = mapperDoc.GetVendorVATNumber();
        if (!Sys.Helpers.IsEmpty(vendorVATNumber)) {
            Log.Info("Intercompany invoice detection: no SIRET/SIREN match found, trying VAT number match");
            matchingCompanyCode = Lib.AP.GetCompanyCodeByVATNumber(vendorVATNumber);
        }
    }
    let isIntercompanyInvoice = !!matchingCompanyCode;
    // User exit: allows overriding the intercompany invoice detection
    const overrideIntercompanyInvoice = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OverrideIsEDIIntercompanyInvoice", mapperDoc, isIntercompanyInvoice);
    if (typeof overrideIntercompanyInvoice === "boolean") {
        isIntercompanyInvoice = overrideIntercompanyInvoice;
    }
    if (isIntercompanyInvoice) {
        Log.Info("Intercompany invoice detected, matching company code: " + (matchingCompanyCode || "overridden by user exit"));
        Data.SetValue("IntercompanyInvoice__", true);
    }
}
function fillExtractedLinesFromMapperDocument() {
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    const mapperLineItems = mapperDoc.GetLineItems();
    const source = mapperDoc.GetComputedValueSource();
    if (mapperLineItems.length < 1000) {
        function setValueAndSource(item, columnName, value) {
            if (value) {
                item.SetValue(columnName, value);
                item.SetComputedValueSource(columnName, source);
            }
        }
        const extractedLineItems = Data.GetTable("ExtractedLineItems__");
        extractedLineItems.SetItemCount(mapperLineItems.length);
        for (let i = 0; i < mapperLineItems.length; i++) {
            const data = mapperLineItems[i];
            const item = extractedLineItems.GetItem(i);
            setValueAndSource(item, "OrderNumberExtracted__", data.OrderNumber);
            setValueAndSource(item, "QuantityExtracted__", data.Quantity);
            setValueAndSource(item, "AmountExtracted__", data.Amount);
            setValueAndSource(item, "UnitPriceExtracted__", data.UnitPrice);
            setValueAndSource(item, "GrossUnitPriceExtracted__", data.RawUnitPrice);
            setValueAndSource(item, "DeliveryNoteExtracted__", data.DeliveryNote);
            setValueAndSource(item, "PartNumberExtracted__", data.PartNumber);
        }
        // User Exit: Allows customization of extracted line items from mapper document before reconciliation
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnFillExtractedLineItemsFromMapperDocumentEnd", mapperDoc, extractedLineItems);
    }
}
function fillLineItemsFromMapperDocument() {
    const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
    const mapperLineItems = mapperDoc.GetLineItems();
    if (mapperLineItems.length < 1000) {
        const companyCode = Data.GetValue("CompanyCode__");
        const source = mapperDoc.GetComputedValueSource();
        function setValueAndSource(item, columnName, value) {
            if (value) {
                item.SetValue(columnName, value);
                item.SetComputedValueSource(columnName, source);
            }
        }
        const lineItems = Data.GetTable("LineItems__");
        lineItems.SetItemCount(mapperLineItems.length);
        for (let i = 0; i < mapperLineItems.length; i++) {
            const data = mapperLineItems[i];
            const item = lineItems.GetItem(i);
            item.SetValue("LineType__", Lib.P2P.LineType.PO);
            // Set hidden column for highlights
            const extractedDetails = new Lib.AP.ExtractedDetailsForLine(i);
            item.SetValue("ExtractedDetails__", extractedDetails.toString());
            setValueAndSource(item, "OrderNumber__", data.OrderNumber);
            setValueAndSource(item, "ItemNumber__", data.ItemNumber);
            setValueAndSource(item, "Description__", data.Description);
            setValueAndSource(item, "Quantity__", data.Quantity);
            setValueAndSource(item, "Amount__", data.Amount);
            setValueAndSource(item, "InvoicedUnitPrice__", data.UnitPrice);
            setValueAndSource(item, "GrossUnitPrice__", data.RawUnitPrice);
            setValueAndSource(item, "DeliveryNote__", data.DeliveryNote);
            setValueAndSource(item, "PartNumber__", data.PartNumber);
            setValueAndSource(item, "TaxRate__", data.TaxRate);
            setValueAndSource(item, "TaxCode__", (companyCode && data.TaxCode) ? Lib.AP.TaxHelper.GetTaxCodeFromTaxType(data.TaxCode, data.TaxRate, companyCode) : "");
            checkForMissingTaxCode(item);
        }
        completeItemsWithMissingTaxCode();
    }
}
function getMapperDocument(inputFile) {
    const mapper = Lib.AP.MappingManager.GetMapper(inputFile);
    if (mapper) {
        return mapper.GetNewDocument(inputFile);
    }
    Log.Error("No registered mapper is able to extract informations from the attached file");
    return null;
}
function cleanExtractedLineItems() {
    // Reset extracted line items to reduce the weight of the form data (even if they had been taught)
    const g_clearExtractedLineItems = Lib.AP.GetVariableAsBoolean("ClearExtractedLineItems", false);
    if (!g_debug && g_clearExtractedLineItems) {
        Data.GetTable("ExtractedLineItems__").SetItemCount(0);
        // no need to perform more cleaning action
        return;
    }
    // Clean error on extracted line has they are not relevant for processing
    const exLineItemsTable = Data.GetTable("ExtractedLineItems__");
    const fieldsInError = exLineItemsTable.GetItemCount() > 0 ? Data.GetFieldsInError() : null;
    if (fieldsInError && fieldsInError.nbErrors > 0) {
        const exLinesInError = fieldsInError.tables.ExtractedLineItems__;
        if (exLinesInError) {
            for (const row in exLinesInError.rows) {
                if (Object.hasOwnProperty.call(exLinesInError.rows, row)) {
                    const exItem = exLineItemsTable.GetItem(row);
                    for (const fieldName of exLinesInError.rows[row]) {
                        exItem.SetValue(fieldName, "");
                        exItem.SetError(fieldName, "");
                    }
                }
            }
        }
    }
}
async function continueExtraction() {
    initDefaultValues();
    /** retrieve vendor parameters early to avoid timing issues with PO reconciliation **/
    initParameters();
    /** header gathering **/
    // Try to identify header fields and line items on the form
    searchHeaderFieldsAndLineItems();
    getGHGEmissionFactor();
    manageSignature();
    /** retrieve last used values **/
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    if (Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
        loadTemplateForGLInvoice();
    }
    else if ((Lib.AP.InvoiceType.isPOGLInvoice() || Lib.AP.InvoiceType.isPOInvoice()) && invoiceDocument.EnableMRUForPOInvoice()) {
        await loadTemplateForPOInvoice();
    }
    if (Lib.AP.MappingManager.DataExtractedFromEDI() && Lib.AP.InvoiceType.isPOInvoice()) {
        const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
        const allowanceChargeItems = {
            header: mapperDoc.GetAllowanceChargeHeaderItems(),
            lines: Lib.AP.AllowanceCharge.IsAllowanceChargesOnPOInvoiceDisplayed() ? mapperDoc.GetAllowanceChargeLineItems() : undefined
        };
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        Lib.AP.AllowanceCharge.AddAllowanceChargeLines(mapperDoc.GetComputedValueSource(), allowanceChargeItems, function (item) {
            invoiceDoc.UpdateGLLineDescriptions(item);
        });
    }
    /** load UnplannedDeliveryCosts PDF and EDI **/
    if ((Lib.AP.InvoiceType.isPOInvoice() || Lib.AP.InvoiceType.isPOGLInvoice()) && Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.IsUDCDetectionDisabled") !== true) {
        Lib.AP.UnplannedDeliveryCosts.ExtractFromKeywords();
    }
    /** Allow customization before tax is automatically calculated **/
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnLineItemsPopulatedPreTax");
    /** Tax code lookup **/
    Lib.AP.Extraction.UpdateLinesWithTaxCodeLookup();
    /** Allow customization after tax is calculated but before other automations such as balance or workflow **/
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnLineItemsPopulatedPostTax");
    /** Document fields initialization **/
    // Update the balance
    Lib.AP.UpdateBalance(Lib.AP.TaxHelper.computeHeaderTaxAmount, g_debug);
    Lib.AP.GetInvoiceDocument().ComputePaymentAmountsAndDates(true, true, Lib.AP.MappingManager.DataExtractedFromEDI());
    /** Anomaly detection **/
    Lib.AP.AnomalyDetection.DetectUnusualInvoiceAmount();
    // Set form validity date (to prevent expiration errors)
    Lib.AP.WorkflowCtrl.ExpirationHelper.ResetValidity();
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
    }
    initReverseChargeTax();
    // set a flag to disable Request teaching button when no document is attached
    const refAttach = Attach.GetProcessedDocument();
    if (refAttach) {
        Variable.SetValueAsString("DocAttached", "1");
    }
    else {
        Variable.SetValueAsString("DocAttached", "0");
    }
    cleanExtractedLineItems();
    // Mark document as to verify
    Lib.AP.SetInvoiceStatus(Lib.AP.InvoiceStatus.ToVerify);
    if (!Lib.ERP.IsSAP()) {
        Lib.Spending.Budget.budgetHandler.IsEnabled();
    }
    Lib.AP.Extraction.DetermineSourceTypeFromOriginalJobID();
    Lib.AP.Extraction.DetermineOwner();
    initBusinessUnit();
    let defaultAllowBuildApprovers = true;
    if (Lib.AP.MappingManager.DataExtractedFromEDI()) {
        const mapperDoc = Lib.AP.MappingManager.CurrentMapperDocument;
        if (mapperDoc.GetBillingScheduleInstallmentNumber() &&
            mapperDoc.GetBillingScheduleID() &&
            mapperDoc.GetBillingScheduleInstallmentDate() &&
            mapperDoc.GetContractReferenceNumber() &&
            mapperDoc.GetContractNumber() &&
            mapperDoc.GetBillingScheduleInstallmentAmount()) {
            Lib.P2P.BillingSchedule.VIPCheckBillingScheduleWithinTolerance({
                companyCode: Data.GetValue("CompanyCode__"),
                vendorNumber: Data.GetValue("VendorNumber__"),
                contractReferenceNumber: Data.GetValue("ContractReferenceNumber__"),
                contractNumber: Data.GetValue("ContractNumber__"),
                invoiceDate: Data.GetValue("InvoiceDate__"),
                localNetAmount: Sys.Helpers.String.ToFloat(Data.GetValue("LocalNetAmount__")),
                billingScheduleId: mapperDoc.GetBillingScheduleID(),
                installmentDate: new Date(mapperDoc.GetBillingScheduleInstallmentDate()),
                installmentAmount: parseFloat(mapperDoc.GetBillingScheduleInstallmentAmount()),
                costCenterList: Lib.AP.GetCleanCostCenterListFromInvoice()
            }).Then(function (res) {
                res.fullyMatchedCostCenter = Lib.AP.SetAllLinesItemsCostCenter(res.billingScheduleCostCenter, false);
                res.withinTolerance = res.withinTolerance && res.fullyMatchedCostCenter;
                Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(res.withinTolerance);
                Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable(res);
                if (res.withinTolerance) {
                    defaultAllowBuildApprovers = false;
                }
            });
        }
    }
    else if (Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments()) {
        Lib.P2P.BillingSchedule.VIPFindBillingScheduleMatchingContract("filterWithExactAmount")
            .Then((resultWithAmountFilter) => {
            if (resultWithAmountFilter.length === 0) {
                Lib.P2P.BillingSchedule.VIPFindBillingScheduleMatchingContract("filterWithoutAmount")
                    .Then((resultWithoutAmountFilter) => {
                    if (resultWithoutAmountFilter.length > 0) {
                        handleMatchedBillingSchedule(resultWithoutAmountFilter);
                        defaultAllowBuildApprovers = true;
                        // If the amount is < than the billing schedule amount, invoice is within tolerance,
                        // process variable Lib.P2P.BillingSchedule.VIPBillingScheduledInfoVariable is set to _NoApprovalWorkflowIsRequired
                        // and workflow is not required
                        if (Variable.GetValueAsString(Lib.P2P.BillingSchedule.VIPBillingScheduledInfoVariable) === "_NoApprovalWorkflowIsRequired") {
                            defaultAllowBuildApprovers = false;
                        }
                    }
                });
            }
            else if (resultWithAmountFilter.length > 0) {
                handleMatchedBillingSchedule(resultWithAmountFilter);
                defaultAllowBuildApprovers = false;
            }
            else {
                Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(false);
                Lib.P2P.BillingSchedule.VIPSetWarningMessageInstallmentCouldMatch();
            }
        }).Catch((error) => {
            Log.Error(`Error in getting billing schedule matching contract ${Data.GetValue("ContractReferenceNumber__")}. Error : ${error}`);
            Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(false);
            Lib.P2P.BillingSchedule.VIPSetWarningMessageInstallmentCouldMatch();
        });
    }
    let allowBuildOfApprovers = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers");
    if (typeof allowBuildOfApprovers !== "boolean") {
        allowBuildOfApprovers = defaultAllowBuildApprovers;
    }
    // Build approvers list
    Lib.AP.WorkflowCtrl.Init();
    Lib.AP.WorkflowCtrl.SetObject("usersObject", Users);
    Lib.AP.WorkflowCtrl.SetObject("allowApprovers", Lib.AP.GetInvoiceDocument().AllowApprovers());
    let autoGuessException = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.Workflow.AutoGuessException");
    //Default autoGuessException to true if no UE defined
    autoGuessException = autoGuessException === false ? autoGuessException : true;
    Lib.AP.WorkflowCtrl.InitRolesSequence(allowBuildOfApprovers, true, autoGuessException);
    Lib.AP.Extraction.CrossReference.SaveEDIValues();
    endExtraction();
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnExtractionScriptEnd");
    // Finalize SAP connection
    if (Lib.ERP.IsSAP()) {
        Lib.AP.SAP.PurchaseOrder.FinalizeBapiParameters();
    }
    Lib.AP.ResetERPManager();
}
function handleMatchedBillingSchedule(billingScheduleMatchingContractResult) {
    Lib.P2P.BillingSchedule.SetBillingScheduleMsnex(billingScheduleMatchingContractResult[0].BillingScheduleIDRUIDEX);
    Data.SetValue("BillingScheduleInstallment__", billingScheduleMatchingContractResult[0].Installment);
    Data.SetValue("BillingScheduleID__", billingScheduleMatchingContractResult[0].BillingScheduleID);
    Data.SetValue("BillingScheduleDate__", billingScheduleMatchingContractResult[0].BillingScheduleDate);
    Lib.AP.SetAllLinesItemsCostCenter(billingScheduleMatchingContractResult[0].BillingScheduleCostCenter);
    if (billingScheduleMatchingContractResult[0].BillingScheduleApproveTolerance !== "1") {
        Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(false);
        Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable({
            autoApproveTolerance: false,
            foundBillingSchedule: null,
            withinTolerance: null,
            withinDateTolerance: null,
            withinAmountTolerance: null,
            fullyMatchedCostCenter: null,
            billingScheduleIsValidated: null
        });
    }
    else {
        Lib.P2P.BillingSchedule.VIPCheckBillingScheduleWithinTolerance({
            companyCode: Data.GetValue("CompanyCode__"),
            vendorNumber: Data.GetValue("VendorNumber__"),
            contractReferenceNumber: Data.GetValue("ContractReferenceNumber__"),
            contractNumber: Data.GetValue("ContractNumber__"),
            invoiceDate: Data.GetValue("InvoiceDate__"),
            localNetAmount: Sys.Helpers.String.ToFloat(Data.GetValue("LocalNetAmount__")),
            billingScheduleId: billingScheduleMatchingContractResult[0].BillingScheduleID,
            installmentDate: new Date(billingScheduleMatchingContractResult[0].BillingScheduleDate),
            installmentAmount: billingScheduleMatchingContractResult[0].BillingScheduleAmount,
            costCenterList: Lib.AP.GetCleanCostCenterListFromInvoice()
        }).Then(function (res) {
            Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(res.withinTolerance);
            Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable(res);
        });
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnHandleMatchedBillingSchedule", billingScheduleMatchingContractResult);
}
function shouldRunExtraction() {
    return !Lib.AP.isActionAutoComplete();
}
//#endregion
/** ******** **/
/** RUN PART **/
/** ******** **/
//#region
/** initialization **/
async function runExtraction() {
    if (shouldRunExtraction()) {
        await Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnExtractionScriptBegin");
        initExtraction();
        if (Lib.AP.CompanyCodeDetermination.InitCompanyCode()) {
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.ForceCompanyCode");
            await continueExtraction();
        }
    }
}
Lib.P2P.HandleScriptError(runExtraction());
//#endregion
//# sourceMappingURL=extractionscript.js.map