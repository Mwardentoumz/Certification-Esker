"use strict";
// Vendor invoice nodes
const xpathC5RuidEx = "//ID[@schemeID=\"C5IntegrationRuidEx\"]";
const xpathAckStatusDate = "/Acknowledgement/Status/Date";
const xpathAckStatusCode = "/Acknowledgement/Status/Code";
const xpathAckStatusType = "/Acknowledgement/Status/Type";
const xpathAckStatusMessage = "/Acknowledgement/Status/Message";
function extractionMain() {
    /*******************************
    Read the C5 Acknowledgment File
    ********************************/
    const xmlDoc = getC5AckXML();
    if (xmlDoc === null) {
        Log.Info("No attached XML file to read");
        return;
    }
    parseInvoiceAckValues(xmlDoc);
    getAttachments(xmlDoc);
}
function getC5AckXML() {
    const xmlFile = Attach.GetInputFile(0);
    if (xmlFile) {
        return Process.CreateXMLDOMElement(xmlFile);
    }
    return null;
}
/**
 * Helper to safely get the text content of a single XML node
 */
function getXmlNodeText(xmlDoc, xpath) {
    var _a;
    const node = xmlDoc.selectSingleNode(xpath);
    return (_a = node === null || node === void 0 ? void 0 : node.text) !== null && _a !== void 0 ? _a : "";
}
/**
 * Parse values of an Invoice C5 Ack XML
 * @param xmlDoc
 */
function parseInvoiceAckValues(xmlDoc) {
    const data = getXmlNodeText(xmlDoc, xpathC5RuidEx);
    Data.SetValue("EskerID__", data);
    const date = getXmlNodeText(xmlDoc, xpathAckStatusDate);
    Data.SetValue("C5Status_Date__", new Date(date));
    Data.SetValue("C5Status_Code__", getXmlNodeText(xmlDoc, xpathAckStatusCode));
    Data.SetValue("C5Status_Type__", getXmlNodeText(xmlDoc, xpathAckStatusType));
    Data.SetValue("C5Status_Message__", getXmlNodeText(xmlDoc, xpathAckStatusMessage));
}
function getAttachments(xmlDoc) {
    const attachCount = xmlDoc.selectNodes("Attachments/Attachment").length;
    for (let iAttachIndex = 0; iAttachIndex < attachCount; iAttachIndex++) {
        const nodePathRoot = "//Attachments/Attachment[" + (iAttachIndex + 1) + "]";
        try {
            const attachment = {
                filename: xmlDoc.selectSingleNode(nodePathRoot + "/Filename").text,
                base64Content: xmlDoc.selectSingleNode(nodePathRoot + "/Content").text,
                type: getXmlNodeText(xmlDoc, nodePathRoot + "/Type")
            };
            DecodeB64FileAndAttach(attachment);
        }
        catch (e) {
            Log.Error("Error attaching file index " + iAttachIndex + ", exception is: " + e);
        }
    }
}
function DecodeB64FileAndAttach(attachment) {
    const extensionIndex = attachment.filename.lastIndexOf(".");
    const extension = extensionIndex > 0 ? attachment.filename.substring(extensionIndex) : "";
    // If extension is empty, will generate a .bin file
    const tempFile = TemporaryFile.CreateFile(extension, "b64");
    if (tempFile) {
        TemporaryFile.Append(tempFile, attachment.base64Content);
        Attach.AttachTemporaryFile(tempFile, attachment.filename);
    }
    else {
        throw "Unable to create temporary file for attachment: " + attachment.filename;
    }
}
extractionMain();
//# sourceMappingURL=extractionscript.js.map