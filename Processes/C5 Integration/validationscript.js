"use strict";
const errorState = 200;
var DataExporter;
(function (DataExporter) {
    /**
     * the following variables are used for exporting data:
     * 	- SFTPConfigurationNameForC5
     * 	- FTPAccountNameForC5
     * 	- FTPFolderNameForC5
     * 	- NotificationProcessNameForC5
     **/
    const notificationProcessName = Variable.GetValueAsString("NotificationProcessNameForC5");
    const notificationProcessId = notificationProcessName ? Process.GetProcessID(notificationProcessName) : "";
    const invoiceXmlFilePrefix = "Invoice";
    const invoiceXmlFileSuffix = "_C5";
    /**
     * Try to guess the environment name parsing the OwnerID string looking for a sub-account
     * @param ownerID
     * @param ignoreDepartment
     * @returns {string} the environment
     */
    function GuessEnvironment() {
        const defaultEnvironment = "DEV";
        const accountIdentifier = Lib.AP.PeppolC5Reporting.GuessEDIEnvironment(defaultEnvironment);
        let environment = defaultEnvironment;
        if (accountIdentifier === null) {
            // Let's choose the default environment and log a trace if environment could not be extracted from ownerID
            Log.Error("Unable to guess the environment from the OwnerID. Default environment " + defaultEnvironment + " is forced.");
        }
        else if (!["DEV", "QA", "PROD"].includes(accountIdentifier)) {
            Log.Warn("Account identifier environment is not DEV, QA or PROD. Default environment " + defaultEnvironment + " is forced.");
        }
        else {
            environment = accountIdentifier;
        }
        return environment;
    }
    /**
     * Get the SFTP configuration to use
     * @returns {string} the SFTP configuration coressponding to the environment
     */
    function GetSftpConfigurationName() {
        let configuration = Variable.GetValueAsString("SFTPConfigurationNameForC5");
        const isDEV = /^.*_DEV$/.exec(configuration);
        const isQA = /^.*_QA$/.exec(configuration);
        const isPROD = /^.*_PROD$/.exec(configuration);
        if (isDEV) {
            Log.Info("Use DEV EIntegration SFTP (determined from variable SFTPConfigurationNameForC5)");
        }
        else if (isQA) {
            Log.Info("Use QA EIntegration SFTP (determined from variable SFTPConfigurationNameForC5)");
        }
        else if (isPROD) {
            Log.Info("Use PROD EIntegration SFTP (determined from variable SFTPConfigurationNameForC5)");
        }
        else {
            const environment = GuessEnvironment();
            Log.Info(`Use ${environment} EIntegration SFTP (determined from ownerid)`);
            configuration = `${configuration}_${environment}`;
        }
        return configuration;
    }
    /**
     * Construct output path for the current SFTP configuration
     * @returns {string} the output path
     */
    function GetOutputPath() {
        let path = "";
        const ftpAccountName = Variable.GetValueAsString("FTPAccountNameForC5");
        const ftpFolderName = Variable.GetValueAsString("FTPFolderNameForC5");
        if (ftpAccountName && ftpAccountName !== "") {
            path = `${ftpAccountName}\\`;
        }
        if (ftpFolderName && ftpFolderName !== "") {
            path += `${ftpFolderName}\\`;
        }
        return path;
    }
    /**
    * Compute the full name of the xml file
    * @returns {string} the xml file name
    **/
    function GetXmlFilename() {
        return `${invoiceXmlFilePrefix}${Data.GetValue("msnex")}${invoiceXmlFileSuffix}`;
    }
    /**
     * Retrieve the informations on the related supplier invoice
     * @param supplierInvoiceRuidex the identifier of the invoice to retrieve
     * @returns {xFormData} an xFormData of the invoice
     */
    function GetVIPData(supplierInvoiceRuidex) {
        const query = Process.CreateQueryAsProcessAdmin();
        query.SetSpecificTable("CDNAME#Vendor invoice");
        query.SetAttributesList("*");
        query.SetSearchInArchive(true);
        const filter = Sys.Helpers.LdapUtil.FilterEqual("ruidex", supplierInvoiceRuidex).toString();
        query.SetFilter(filter);
        if (query.MoveFirst()) {
            const trn = query.MoveNext();
            if (trn) {
                return trn.GetFormData();
            }
        }
        return null;
    }
    /**
     * Generate and write the pivot xml to the specified temporary file
     * @param xmlFile a temporary file to write the xml to
     * @returns {boolean} true is we manage to get invoice information or false otherwise
     */
    function GetXMLFile(xmlFile) {
        const invoiceRuidex = Data.GetValue("InvoiceRuidEx__");
        const vipData = GetVIPData(invoiceRuidex);
        if (!vipData) {
            return false;
        }
        const ediDocContent = Lib.AP.PeppolC5Reporting.Mapping.GenerateEdiDocument(vipData, notificationProcessId, GetXmlFilename());
        TemporaryFile.Append(xmlFile, ediDocContent);
        Attach.AddAttach(GetXmlFilename(), ediDocContent, "xml", "utf8");
        return true;
    }
    /**
     * Attach the pivot XML file to a CopyFile transport.
     * @param {object} transport A xTransport on which the file will be attached
     * @param {string} attachName The name of the attachment
     * @returns {boolean} true is we manage to get invoice information or false otherwise
     */
    function AttachXmlFile(transport, attachName) {
        //Create tempFile to avoid memory consumption issue
        const tempInvoiceXml = TemporaryFile.CreateFile("xml", "utf8");
        const succeed = GetXMLFile(tempInvoiceXml);
        if (succeed) {
            // Attach temporary file instead of using string
            // Attach the temporary File to the transport.
            const attachVars = transport.AddAttachEx(tempInvoiceXml).GetVars();
            attachVars.AddValue_String("AttachEncoding", "UTF-8", true);
            attachVars.AddValue_String("AttachOutputName", attachName, true);
            attachVars.AddValue_String("AttachToDisplay", "converted", true);
        }
        return succeed;
    }
    /**
     * Create a CopyFile transport to copy invoice data in a SFTP folder
     */
    function ToSFTP() {
        let ruidex = null;
        try {
            const copyFileTransport = Process.CreateTransport("Copy");
            if (copyFileTransport) {
                const vars = copyFileTransport.GetUninheritedVars();
                vars.AddValue_String("CopyPath", GetSftpConfigurationName(), true);
                vars.AddValue_String("CreateIfNotExist", 1, true);
                // Attach the XML file to the Copy transport
                const succeed = AttachXmlFile(copyFileTransport, `${GetOutputPath()}${GetXmlFilename()}`);
                if (succeed) {
                    copyFileTransport.Process();
                    ruidex = copyFileTransport.GetUninheritedVars().GetValue_String("RuidEx", 0);
                    Log.Info("CopyFile RuidEx : " + ruidex);
                }
                else {
                    Log.Error("Unable to get invoice information");
                }
            }
            else {
                Log.Error("Unable to create transport");
            }
        }
        catch (err) {
            Log.Error(err);
            Log.Error("Unable to send the data XML data file to the specified SFTP configuration, please check your configuration.");
        }
        return ruidex;
    }
    DataExporter.ToSFTP = ToSFTP;
})(DataExporter || (DataExporter = {}));
var Action;
(function (Action) {
    function Reprocess() {
        // Clear status and error
        Variable.SetValueAsString("exportStatus", "");
        Data.SetError("InvoiceSubmissionStatus__", "");
        Data.SetValue("NeedValidation", false);
    }
    Action.Reprocess = Reprocess;
    function ContinueAfterAck(exportStatus, actionResult) {
        var _a;
        // should finalize the C5 Integration
        if (exportStatus === "inprogress") {
            Log.Info("Continue after receiving the C5 ack");
        }
        else {
            Log.Warn(`C5 ack received but the export status is not the expected one ('${exportStatus}' instead of 'inprogress')`);
        }
        Variable.SetValueAsString("exportStatus", "done");
        const C5StatusCode = parseInt(Data.GetValue("C5Status_Code__"), 10);
        if (C5StatusCode > 0) {
            const C5StatusType = Data.GetValue("C5Status_Type__");
            const C5StatusMessage = Data.GetValue("C5Status_Message__");
            Data.SetError("InvoiceSubmissionStatus__", `Error ack received: ${C5StatusCode} - ${C5StatusType} - ${C5StatusMessage}`);
            if (((_a = Variable.GetValueAsString("AllowResubmit")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== "true") {
                actionResult.setInError = true;
            }
        }
        actionResult.preventApproval = false;
    }
    Action.ContinueAfterAck = ContinueAfterAck;
})(Action || (Action = {}));
function handleActionResult(actionResult) {
    // avoid the double execution of validation script to create 2 sftp outputs
    if (actionResult.shouldExport && DataExporter.ToSFTP()) {
        Variable.SetValueAsString("exportStatus", "inprogress");
        // wait for the acknoledgement
        Log.Info("-- Wait for C5 Ack --");
        Process.WaitForUpdate();
        actionResult.preventApproval = false;
    }
    if (actionResult.preventApproval) {
        Log.Info("handle all exceptions manually");
        Process.PreventApproval();
    }
    else if (actionResult.setInError) {
        Log.Info("Error ack received");
        Data.SetValue("State", errorState);
    }
}
function SetArchiveDuration() {
    const archiveDuration = Variable.GetValueAsString("SupplierInvoice_ArchiveDuration__");
    if (archiveDuration) {
        Data.SetValue("ArchiveDuration", archiveDuration);
    }
}
/**
 * main entry point of the validation script
 */
function validationMain() {
    var _a, _b;
    const currentState = Data.GetValue("State");
    const actionType = (_a = Data.GetActionType()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const actionName = (_b = Data.GetActionName()) === null || _b === void 0 ? void 0 : _b.toLowerCase();
    const exportStatus = Variable.GetValueAsString("exportStatus") || "";
    const actionResult = {
        preventApproval: true,
        setInError: false,
        shouldExport: exportStatus === ""
    };
    Log.Info(`action type: ${actionType}`);
    Log.Info(`action name: ${actionName}`);
    Log.Info(`exportStatus: ${exportStatus}`);
    Log.Info(`shouldExport: ${actionResult.shouldExport}`);
    Log.Info(`currentState: ${currentState}`);
    SetArchiveDuration();
    if (currentState === 0) {
        if (actionType === "reprocess") {
            Action.Reprocess();
        }
        Log.Info(`Skip state ${currentState}`);
    }
    else {
        if (actionName === "continueafterc5ack") {
            Action.ContinueAfterAck(exportStatus, actionResult);
        }
        handleActionResult(actionResult);
    }
}
validationMain();
//# sourceMappingURL=validationscript.js.map