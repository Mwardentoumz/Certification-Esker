"use strict";
/** ***** **/
/** DEBUG **/
/** ***** **/
//#region
// Enable/disable debug mode
const g_debug = false;
function traceDebug(txt) {
    if (g_debug) {
        Log.Info(txt);
    }
}
//#endregion
/* Vendor statement matching extraction server script */
function highlightCompanyCodeArea(area) {
    if (area) {
        area.Highlight(true, 0xFFCC00, 0xFFFFFF, "CompanyCode__");
    }
}
function setCompanyCode(companyCode, warningMessage, companyCodeArea) {
    Log.Info("Init company code :" + companyCode);
    Data.SetValue("CompanyCode__", companyCode);
    Data.SetWarning("CompanyCode__", warningMessage ? warningMessage : "");
    highlightCompanyCodeArea(companyCodeArea);
}
function initCompanyCode() {
    Data.SetValue("Configuration__", Variable.GetValueAsString("Configuration"));
    const companyCode = Variable.GetValueAsString("CompanyCode");
    if (companyCode) {
        setCompanyCode(companyCode);
        return true;
    }
    if (Data.GetValue("CompanyCode__")) {
        return true;
    }
    const companyCodeInfo = Lib.AP.CompanyCodeDetermination.GetCompanyCodeInfo();
    if (!companyCodeInfo.reExtractCalled) {
        if (companyCodeInfo.companyCode) {
            setCompanyCode(companyCodeInfo.companyCode, companyCodeInfo.warningMessage, companyCodeInfo.companyCodeArea);
        }
        return true;
    }
    return false;
}
function fillVendorFieldsFromQueryResult(result) {
    Data.SetValue("VendorNumber__", result.Number__);
    Data.SetValue("VendorName__", result.Name__);
    Data.SetValue("VendorCountry__", result.Country__);
    Data.SetValue("VendorEmail__", result.Email__);
}
function highlightVendorArea(area) {
    if (area && area.zone) {
        const highlightColorBorder = 0xFFFFFF;
        const highlightColorBackground = 0xFFCC00;
        area.zone.Highlight(true, highlightColorBackground, highlightColorBorder, "VendorName__");
        area.zone.Highlight(true, highlightColorBackground, highlightColorBorder, "VendorNumber__");
    }
}
function initVendor() {
    if (Data.IsNullOrEmpty("VendorNumber__") || Data.IsNullOrEmpty("VendorName__")) {
        Lib.P2P.FirstTimeRecognition_Vendor.Recognize(Lib.AP.GetAvailableDocumentCultures(), Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"), Data.GetValue("VendorName__"), fillVendorFieldsFromQueryResult, highlightVendorArea, Lib.P2P.FirstTimeRecognition_Vendor.SearchVendorNumber);
    }
}
function addConversationParty(processUrl) {
    const conversationOptions = Lib.P2P.Conversation.Options.GetVendorStatementMatchingForInternalUser({
        VendorStatementUrl__: processUrl
    });
    const conversationInfo = Lib.P2P.Conversation.InitConversationInfo(conversationOptions);
    const internalUser = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerID"));
    const internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
    const extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
        BusinessId: internalUserInfo.BusinessId,
        BusinessIdFieldName: internalUserInfo.BusinessIdFieldName,
        OwnerID: internalUserInfo.OwnerID,
        OwnerPB: internalUserInfo.OwnerPB,
        RecipientCompany: Data.GetValue("VendorName__")
    });
    Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
    Variable.SetValueAsString("VendorRecipientCompany", internalUserInfo.Company);
}
function initFirstRecoEngine() {
    return initAPFirstRecoEngine();
}
function initAPFirstRecoEngine() {
    Log.Info("Using AP extraction engine");
    let dateRange = parseFloat(Variable.GetValueAsString("DateRangeFromToday"));
    if (!dateRange) {
        dateRange = 3;
    }
    const today = new Date(), lowerBound = new Date(), upperBound = new Date();
    const dateRangeInDays = dateRange * 365;
    lowerBound.setDate(today.getDate() - dateRangeInDays);
    upperBound.setDate(today.getDate());
    Lib.FirstTimeRecognition.Register("AP", Lib.FirstTimeRecognition.EngineAP, true);
    Lib.FirstTimeRecognition.EngineAP.ActivateLog(g_debug);
    const statment = Lib.FirstTimeRecognition.EngineAP.GetNewDocument();
    const params = {
        pageIgnoreThreshold: 6500,
        enableFuzzySearch: false,
        spaceTolerance: 0.9,
        headerFieldsAlignmentTolerance: 0.3,
        documentDateHeaderMargin: 0.5,
        documentDatePreferredKeywords: ["statement"],
        documentDateExclusionKeywords: ["ste[i1]nga", "order", "due", "pay by", "received", "verval", "echeance", "PO ", "ship", "abgang", "departure", "fulfilment", "zahlungsfrist", "liefer",
            "주문", "만기", "지급일", "수취", "선박", "출발", "이행", "支払日", "振替日", "口座引落日", "注文番号", "お支払い期日", "支払期日", "受取", "船舶", "出発", "易行"],
        documentDateExpectedCultures: null,
        documentDateExpectMonthBeforeDate: Data.GetValue("VendorCountry__") === "US" || Data.GetValue("VendorCountry__") === "CA",
        documentDateValidityRangeLowerBound: lowerBound,
        documentDateValidityRangeUpperBound: upperBound,
        headerFields: {},
        enableLineItemsRecognition: false,
        bypassCurrency: true,
        bypassVATNumber: true,
        bypassDocumentType: true,
        bypassDocumentNumber: true,
        bypassAmounts: true
    };
    params.computedDocumentDate = Lib.AP.Extraction.GetComputedDateValue("StatementDate__");
    statment.InitParameters(params);
    return statment;
}
function searchHeaderFields() {
    traceDebug("Search header fields and lineItems");
    // Init recognition engine
    if (Process.GetScriptRetryCount() > 1) {
        Variable.SetValueAsString("AlertExtractionScriptTimeout", "NoFTR");
    }
    else {
        const engine = initFirstRecoEngine();
        engine.Run();
        traceDebug("FTR log : " + Lib.FirstTimeRecognition.EngineBase.GetDebugLog());
        readFirstRecoResults(engine);
    }
}
function readFirstRecoResults(statement) {
    traceDebug("FTR statement : " + JSON.stringify(statement));
    Lib.AP.Extraction.SetFirstRecoValue(statement.GetComputedValueSource(), "StatementDate__", statement.GetDocumentDate());
}
function run() {
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.StatementMatching.Extraction.OnExtractionScriptBegin");
    if (initCompanyCode()) {
        initVendor();
        searchHeaderFields();
    }
    if (Data.GetValue("OwnerID")) {
        const processUrl = Process.GetProcessURL(Data.GetValue("Ruidex"));
        Variable.SetValueAsString("VendorStatementURL", processUrl);
        addConversationParty(processUrl);
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.StatementMatching.Extraction.OnExtractionScriptEnd");
}
run();
//# sourceMappingURL=extractionscript.js.map