"use strict";
/*******************************
Expected ERP ACK Format: Vendor Invoice
********************************

<?xml version="1.0" encoding="utf-8"?>
<ERPAck>
    <ERPID> ERP ID </ERPID>
    <EskerInvoiceID> Esker ID </EskerInvoiceID>
    <ERPPostingError> ERP Error </ERPPostingError>
    <Holds>
        <Hold>
            <HoldName></HoldName>
            <HoldDate></HoldDate>
            <HoldReason></HoldReason>
        </Hold>
    </Holds>
</ERPAck>

*/
/*******************************
Expected ERP ACK Format: Vendor Invoice Lifecycle Status
********************************

<?xml version="1.0" encoding="utf-8"?>
<ERPAck>
    <EskerInvoiceID> Esker ID </EskerInvoiceID>
    <ERPLifecycleStatus>Approved|Refused|InDispute|TakenInCharge</ERPLifecycleStatus>
    <ReasonCode> Reason Code (mandatory for Refused and InDispute) </ReasonCode>
    <Reason> Reason Label (optional) </Reason>
    <ReasonComment> Comment (optional) </ReasonComment>
    <ActionCode> Action Code (optional) </ActionCode>
    <ActionReason> Action Reason (optional) </ActionReason>
</ERPAck>

*/
/*******************************
Expected ERP ACK Format: Vendor Registration
********************************

<?xml version="1.0" encoding="utf-8"?>
<ERPAck>
    <ERPVendorNumber> ERP ID </ERPVendorNumber>
    <EskerVendorRegistrationID> Esker ID </EskerVendorRegistrationID>
    <ERPPostingError> ERP Error </ERPPostingError>
</ERPAck>


/*******************************
Expected ERP ACK Format: Detailed Accrual Report
********************************

<?xml version="1.0" encoding="utf-8"?>
<ERPAck>
    <ERPID> ERP ID </ERPID>
    <DetailedAccrualReportLauncherID> Esker ID </DetailedAccrualReportLauncherID>
    <ERPPostingError> ERP Error </ERPPostingError>
</ERPAck>

/*******************************
Expected ERP ACK Format: Purchase order - Create
********************************

<?xml version="1.0" encoding="utf-8"?>
<ERPAck>
    <TransactionID> Esker ERP Transaction ID </TransactionID>
    <ERPID> ERP ID </ERPID>
    <EskerPOID> Esker ID </EskerPOID>
    <ERPPostingError> ERP Error </ERPPostingError>
</ERPAck>

/*******************************
Expected ERP ACK Format: Purchase order - Update|CancelItems|ReOpenItems|Cancel // Select the correct action needed among the 3 options depending on the OrderSubStatus__ of the PO in Esker
********************************

<?xml version="1.0" encoding="utf-8"?>
<ERPAck>
    <TransactionID> Esker ERP Transaction ID </TransactionID>
    <ERPID> ERP ID </ERPID>
    <EskerPOID> Esker ID </EskerPOID>
    <ERPPostingError> ERP Error </ERPPostingError>
    <Action>Update|CancelItems|ReOpenItems|Cancel</Action>
</ERPAck>

/*******************************
Expected ERP ACK Format: Goods Receipt
********************************

<?xml version="1.0" encoding="utf-8"?>
<ERPAck>
    <ERPID> ERP ID </ERPID>
    <EskerGRID> Esker ID </EskerGRID>
    <ERPPostingError> ERP Error </ERPPostingError>
</ERPAck>

*/
// Common xml nodes
const xpathERPError = "/ERPAck/ERPPostingError";
const xpathERPAction = "/ERPAck/Action";
// Vendor invoice nodes
const xpathERPID = "/ERPAck/ERPID";
const xpathEskerInvoiceID = "/ERPAck/EskerInvoiceID";
const xpathHolds = "/ERPAck/Holds/Hold";
// Vendor registration specifics nodes
const xpathERPVendorNumber = "/ERPAck/ERPVendorNumber";
const xpathVendorRegistrationID = "/ERPAck/EskerVendorRegistrationID";
// Detailed accrual report nodes
const xpathDetailedAccrualReportLauncherID = "/ERPAck/DetailedAccrualReportLauncherID";
// Purchase order nodes
const xpathEskerPOID = "/ERPAck/EskerPOID";
// Goods receipt nodes
const xpathEskerGRID = "/ERPAck/EskerGRID";
// ERP Lifecycle ack nodes
const xpathERPLifecycleStatus = "/ERPAck/ERPLifecycleStatus";
const xpathReasonCode = "/ERPAck/ReasonCode";
const xpathReason = "/ERPAck/Reason";
const xpathReasonComment = "/ERPAck/ReasonComment";
const xpathActionCode = "/ERPAck/ActionCode";
const xpathActionReason = "/ERPAck/ActionReason";
function serializeAckData(xmlDoc, data) {
    var _a;
    const action = (_a = xmlDoc.selectSingleNode(xpathERPAction)) === null || _a === void 0 ? void 0 : _a.text;
    Variable.SetValueAsString("ERPAckData", JSON.stringify({
        ...data,
        action: action
    }));
}
function extractionMain() {
    // Only an explicit boolean true from the user exit must bypass the standard extraction flow.
    if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnERPAckExtractionScriptBegin") === true) {
        Log.Info("Extraction script bypassed by OnERPAckExtractionScriptBegin user exit");
        return;
    }
    /*******************************
    Read the ERP Acknowledgment File
    ********************************/
    const xmlDoc = getERPAckXML();
    if (xmlDoc === null) {
        Log.Info("No attached XML file to read");
        return;
    }
    if (xmlDoc.selectSingleNode(xpathEskerInvoiceID)) {
        parseInvoiceAckValues(xmlDoc);
    }
    else if (xmlDoc.selectSingleNode(xpathEskerPOID)) {
        parsePurchaseOrderAckValues(xmlDoc);
    }
    else if (xmlDoc.selectSingleNode(xpathEskerGRID)) {
        parseGoodsReceiptAckValues(xmlDoc);
    }
    else if (xmlDoc.selectSingleNode(xpathVendorRegistrationID)) {
        parseVendorRegistrationAckValues(xmlDoc);
    }
    else if (xmlDoc.selectSingleNode(xpathDetailedAccrualReportLauncherID)) {
        parseAccrualAckValues(xmlDoc);
    }
    else {
        throw new Error("No valid value read from ERPAck XML, retrying to avoid temporary error");
    }
    parseErrorIfNeeded(xmlDoc);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnERPAckExtractionScriptEnd");
    // parse custom values
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Server.ERPAckProcessing.ExtractDataFromERPAck", xmlDoc);
}
function getERPAckXML() {
    const xmlFile = Attach.GetInputFile(0);
    if (xmlFile) {
        try {
            return Process.CreateXMLDOMElement(xmlFile);
        }
        catch (error) {
            Log.Error("Cannot parse the XML file: ", error);
            throw error;
        }
    }
    return null;
}
/**
 * Parse values of an Invoice ERP Ack XML
 * @param xmlDoc
 */
function parseInvoiceAckValues(xmlDoc) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var _p;
    Data.SetValue("UpdateType__", Language.Translate("_Update vendor invoice processing"));
    Data.SetValue("EskerID__", xmlDoc.selectSingleNode(xpathEskerInvoiceID).text);
    Data.SetValue("Document_ERP_ID__", (_p = (_a = xmlDoc.selectSingleNode(xpathERPID)) === null || _a === void 0 ? void 0 : _a.text) !== null && _p !== void 0 ? _p : "");
    const holdList = xmlDoc.selectNodes(xpathHolds);
    const jsonHolds = [];
    for (let i = 0; i < holdList.length; i++) {
        const holdNode = holdList.item(i);
        const jsonHold = {
            HoldName__: holdNode.selectSingleNode("HoldName").text,
            HoldDate__: holdNode.selectSingleNode("HoldDate").text,
            HoldReason__: holdNode.selectSingleNode("HoldReason").text
        };
        jsonHolds.push(jsonHold);
    }
    Variable.SetValueAsString("Holds__", JSON.stringify(jsonHolds));
    const lifecycleStatus = (_c = (_b = xmlDoc.selectSingleNode(xpathERPLifecycleStatus)) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.trim();
    if (lifecycleStatus) {
        Log.Info("ERPLifecycleStatus value: " + lifecycleStatus);
        Variable.SetValueAsString("ERPLifecycleStatus__", lifecycleStatus);
        // Reset reason variables to avoid keeping stale values when the extraction script is re-run.
        Variable.SetValueAsString("ERPReasonCode__", "");
        Variable.SetValueAsString("ERPReason__", "");
        Variable.SetValueAsString("ERPReasonComment__", "");
        Variable.SetValueAsString("ERPActionCode__", "");
        Variable.SetValueAsString("ERPActionReason__", "");
        const reasonCode = (_e = (_d = xmlDoc.selectSingleNode(xpathReasonCode)) === null || _d === void 0 ? void 0 : _d.text) === null || _e === void 0 ? void 0 : _e.trim();
        if (reasonCode) {
            Log.Info("ReasonCode value: " + reasonCode);
            Variable.SetValueAsString("ERPReasonCode__", reasonCode);
        }
        const reason = (_g = (_f = xmlDoc.selectSingleNode(xpathReason)) === null || _f === void 0 ? void 0 : _f.text) === null || _g === void 0 ? void 0 : _g.trim();
        if (reason) {
            Log.Info("Reason value: " + reason);
            Variable.SetValueAsString("ERPReason__", reason);
        }
        const reasonComment = (_j = (_h = xmlDoc.selectSingleNode(xpathReasonComment)) === null || _h === void 0 ? void 0 : _h.text) === null || _j === void 0 ? void 0 : _j.trim();
        if (reasonComment) {
            Log.Info("ReasonComment value: " + reasonComment);
            Variable.SetValueAsString("ERPReasonComment__", reasonComment);
        }
        const actionCode = (_l = (_k = xmlDoc.selectSingleNode(xpathActionCode)) === null || _k === void 0 ? void 0 : _k.text) === null || _l === void 0 ? void 0 : _l.trim();
        if (actionCode) {
            Log.Info("ActionCode value: " + actionCode);
            Variable.SetValueAsString("ERPActionCode__", actionCode);
        }
        const actionReason = (_o = (_m = xmlDoc.selectSingleNode(xpathActionReason)) === null || _m === void 0 ? void 0 : _m.text) === null || _o === void 0 ? void 0 : _o.trim();
        if (actionReason) {
            Log.Info("ActionReason value: " + actionReason);
            Variable.SetValueAsString("ERPActionReason__", actionReason);
        }
    }
}
/**
 * Parse values from an Vendor Registration ERP Ack XML
 * @param xmlDoc
 */
function parseVendorRegistrationAckValues(xmlDoc) {
    // We are receiving a vendor registration ack
    Data.SetValue("UpdateType__", Language.Translate("_Update vendor registration"));
    Data.SetValue("EskerID__", xmlDoc.selectSingleNode(xpathVendorRegistrationID).text);
    Data.SetValue("ERP_Vendor_Number__", xmlDoc.selectSingleNode(xpathERPVendorNumber).text);
}
/**
 * Parse values from a Detailed Accrual Report ERP Ack XML
 * @param xmlDoc
 */
function parseAccrualAckValues(xmlDoc) {
    var _a;
    var _b;
    // We are receiving a detailed accrual report ack
    Data.SetValue("UpdateType__", Language.Translate("_Update Detailed Accrual Report Launcher"));
    Data.SetValue("EskerID__", xmlDoc.selectSingleNode(xpathDetailedAccrualReportLauncherID).text);
    Data.SetValue("Document_ERP_ID__", (_b = (_a = xmlDoc.selectSingleNode(xpathERPID)) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "");
}
/**
 * Parse values from a Purchase Order ERP Ack XML
 * @param xmlDoc
 */
function parsePurchaseOrderAckValues(xmlDoc) {
    var _a, _b;
    var _c;
    // We are receiving a purchase order ack
    Data.SetValue("UpdateType__", Language.Translate("_Update purchase order"));
    Data.SetValue("EskerID__", xmlDoc.selectSingleNode(xpathEskerPOID).text);
    Data.SetValue("Document_ERP_ID__", (_c = (_a = xmlDoc.selectSingleNode(xpathERPID)) === null || _a === void 0 ? void 0 : _a.text) !== null && _c !== void 0 ? _c : "");
    serializeAckData(xmlDoc, {
        transactionID: (_b = xmlDoc.selectSingleNode("/ERPAck/TransactionID")) === null || _b === void 0 ? void 0 : _b.text
    });
}
function parseGoodsReceiptAckValues(xmlDoc) {
    var _a;
    var _b;
    // We are receiving a purchase order ack
    Data.SetValue("UpdateType__", Language.Translate("_Update goods receipt"));
    Data.SetValue("EskerID__", xmlDoc.selectSingleNode(xpathEskerGRID).text);
    Data.SetValue("Document_ERP_ID__", (_b = (_a = xmlDoc.selectSingleNode(xpathERPID)) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "");
}
/**
 * Parse the error field from the ERP Ack xml
 * @param xmlDoc
 */
function parseErrorIfNeeded(xmlDoc) {
    const erpErrorXmlNode = xmlDoc.selectSingleNode(xpathERPError);
    if (erpErrorXmlNode) {
        Data.SetValue("ERPPostingError__", erpErrorXmlNode.text);
    }
}
extractionMain();
//# sourceMappingURL=extractionscript.js.map