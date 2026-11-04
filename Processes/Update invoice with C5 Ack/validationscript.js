"use strict";
let xmlDoc = null;
const C5IntegrationProcess = "C5 Integration";
const fieldsmapping = [
    { nameInForm: "C5Status_Date__", xmlPath: "/Acknowledgement/Status/Date", type: "date" },
    { nameInForm: "C5Status_Code__", xmlPath: "/Acknowledgement/Status/Code", type: "string" },
    { nameInForm: "C5Status_Type__", xmlPath: "/Acknowledgement/Status/Type", type: "string" },
    { nameInForm: "C5Status_Message__", xmlPath: "/Acknowledgement/Status/Message", type: "string" },
    { nameInForm: "TransmissionUUID__", xmlPath: "/Acknowledgement/AdditionalInformation/TransmissionUUID", type: "string" },
    { nameInForm: "DocumentUUID__", xmlPath: "/Acknowledgement/AdditionalInformation/DocumentUUID", type: "string" },
    { nameInForm: "PeppolID__", xmlPath: "/Acknowledgement/AdditionalInformation/PeppolID", type: "string" },
    { nameInForm: "InvoiceSubmissionDatetime__", xmlPath: "/Acknowledgement/AdditionalInformation/InvoiceSubmissionDateTime", type: "date" },
    { nameInForm: "InvoiceSubmissionStatus__", xmlPath: "/Acknowledgement/AdditionalInformation/InvoiceSubmissionStatus", type: "string" },
    { nameInForm: "IRASAcknowledgmentID__", xmlPath: "/Acknowledgement/AdditionalInformation/IRASAcknowledgmentID", type: "string" },
];
/*******************************
Find the process to update
********************************/
function findAndUpdateProcess() {
    var _a;
    var _b;
    try {
        const eskerID = Data.GetValue("EskerID__");
        // EskerID is the RuidEx of the C5 Integration process to update
        const updatableC5Integration = Process.GetUpdatableTransport(eskerID);
        if (updatableC5Integration) {
            Log.Info(`Update the C5 Integration process ${eskerID}`);
            const updatableC5IntegrationVars = updatableC5Integration.GetUninheritedVars();
            // Update of default transport variables.
            for (const field of fieldsmapping) {
                const value = (_b = (_a = xmlDoc.selectSingleNode(field.xmlPath)) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "";
                if (value && value.length > 0) {
                    Log.Info(`Update field: ${JSON.stringify(field)} with value: ${value}`);
                    if (field.type === "date") {
                        updatableC5IntegrationVars.AddValue_Date(field.nameInForm, new Date(value), true);
                    }
                    else {
                        updatableC5IntegrationVars.AddValue_String(field.nameInForm, value, true);
                    }
                }
            }
            // Effectively applies the above updates.
            const actionSuccessful = updatableC5Integration.ResumeWithAction("continueafterc5ack");
            if (!actionSuccessful) {
                Log.Info("Try update asynchronously");
                updatableC5Integration.ResumeWithActionAsync("continueafterc5ack");
            }
        }
        else {
            Log.Warn(`No C5 integration process to update for '${eskerID}'`);
        }
    }
    catch (e) {
        Log.Error(e);
    }
}
function validationGetC5AckXML() {
    const xmlFile = Attach.GetInputFile(0);
    if (xmlFile) {
        return Process.CreateXMLDOMElement(xmlFile);
    }
    return null;
}
function main() {
    if (Data.GetValue("State") < 50) {
        // Validation script executed after extraction script, don't do anything
        // Validation script will be re-executed as the process don't expect a manual approval
        return;
    }
    if (!Data.GetValue("EskerID__")) {
        Data.SetValue("State", 200);
        return;
    }
    xmlDoc = validationGetC5AckXML();
    if (xmlDoc) {
        const C5StatusCode = Data.GetValue("C5Status_Code__");
        const C5StatusType = Data.GetValue("C5Status_Type__");
        if (C5StatusCode === "1" || C5StatusType === "SENT_TO_C5_SUCCESS") {
            findAndUpdateProcess();
        }
        else {
            Log.Info(`Ignore acknowledgement with status=${C5StatusCode} and type=${C5StatusType}`);
        }
    }
    else {
        Log.Error("C5 xml not valid");
    }
}
main();
//# sourceMappingURL=validationscript.js.map