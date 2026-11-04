"use strict";
/**
 * ValidationScript of the Detailed Accrual Report Launcher
 * This script use the parameters of the Detailed Accrual Report Launcher to query the P2P - Detailed accrual report events__ table
 * and then generate the Accrual Report CSV file
 */
/* eslint-disable class-methods-use-this */
var AccrualReportStatus;
(function (AccrualReportStatus) {
    AccrualReportStatus["Draft"] = "Draft";
    AccrualReportStatus["InProgress"] = "InProgress";
    AccrualReportStatus["Computed"] = "Computed";
    AccrualReportStatus["ComputeTimeout"] = "ComputeTimeout";
    AccrualReportStatus["ComputedAndExpired"] = "ComputedAndExpired";
    AccrualReportStatus["Exported"] = "Exported";
    AccrualReportStatus["Integrated"] = "Integrated";
    AccrualReportStatus["IntegrationFailed"] = "IntegrationFailed";
})(AccrualReportStatus || (AccrualReportStatus = {}));
// #region Query and record processing
//DBSET_READONLY | DBSET_QUICK
const DBFastAccess = 0x00210000;
// also returns ownershipped records
const DBDirtyRead = 0x00020000;
/**
 * Creates a query object to retrieve accrual report events from the database.
 * @returns The query object.
 */
function createQuery() {
    const processQuery = Process.CreateQueryAsProcessAdmin();
    processQuery.SetSpecificTable(Sys.P2P.Accrual.AccrualTableName);
    processQuery.SetFilter(getQueryFilter());
    processQuery.SetAttributesList("*");
    processQuery.SetOptions(DBFastAccess | DBDirtyRead);
    processQuery.SetOptionEx("FastSearch=1");
    processQuery.SetOptionEx("ESFetchCount=100");
    processQuery.SetOptionEx("ForceOrderedWithUpdate=1");
    processQuery.SetSortOrder("CompanyCode__ ASC, VendorNumber__ ASC, OrderNumber__ ASC, ItemNumber__ ASC, ActionDate__ ASC");
    return processQuery;
}
/**
 * Generates the filter string for the query based on the Detailed Accrual Report Launcher parameters.
 * @returns The filter string.
 */
function getQueryFilter() {
    const eventCreationLimit = Variable.GetValueAsString("firstComputationStartTime"); // limit to maintain coherent indexes between recalls if new event are created during a long computation time
    const lastVendorNumberTreated = Variable.GetValueAsString("lastVendorNumberTreated"); // in place of an offset or search_after, we use the last Vendor Number treated as a bottom boundary
    const lastOrderNumberTreated = Variable.GetValueAsString("lastOrderNumberTreated"); // in place of an offset or search_after, we use the last PO number of the last vendor treated as a bottom boundary
    const defaultQueryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("AccrualCompanyCode__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("CreationDatetime", eventCreationLimit), Sys.Helpers.LdapUtil.FilterLesserOrEqual("ActionDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("AccrualEndDate__"))), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterStrictlyGreater("FullyInvoicedDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("AccrualEndDate__"))), Sys.Helpers.LdapUtil.FilterNotExist("FullyInvoicedDate__")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", lastVendorNumberTreated), Sys.Helpers.LdapUtil.FilterStrictlyGreater("OrderNumber__", lastOrderNumberTreated)), Sys.Helpers.LdapUtil.FilterStrictlyGreater("VendorNumber__", lastVendorNumberTreated)));
    const customQueryFilter = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Accrual.CustomizeDetailedAccrualQueryFilter", defaultQueryFilter, eventCreationLimit, lastVendorNumberTreated, lastOrderNumberTreated);
    if (customQueryFilter) {
        return customQueryFilter.toString();
    }
    return defaultQueryFilter.toString();
}
/**
 * Represents an accrual line.
 * @param eventVars The event variables.
 * @returns The accrual line.
 */
function createAccrualLineFromRecord(eventVars) {
    let accrualLine = {
        CompanyCode: eventVars.GetValue_String("CompanyCode__", 0),
        VendorNumber: eventVars.GetValue_String("VendorNumber__", 0),
        OrderNumber: eventVars.GetValue_String("OrderNumber__", 0),
        ItemNumber: eventVars.GetValue_String("ItemNumber__", 0),
        GLAccount: eventVars.GetValue_String("GLAccount__", 0),
        OrderedAmount: eventVars.GetValue_Double("OrderedAmount__", 0),
        DeliveredAmount: eventVars.GetValue_Double("DeliveredAmount__", 0),
        InvoicedAmount: eventVars.GetValue_Double("InvoicedAmount__", 0),
        AccrualAmount: 0,
        GenerationDate: Sys.Helpers.Date.Date2DBDateTime(new Date()),
        SituationDate: Sys.Helpers.Date.Date2DBDate(Data.GetValue("AccrualEndDate__"))
    };
    accrualLine.AccrualAmount = accrualLine.DeliveredAmount - accrualLine.InvoicedAmount;
    const customizeAccrualLineFromRecord = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Accrual.CustomizeAccrualLineFromRecord", accrualLine, eventVars);
    return customizeAccrualLineFromRecord ? customizeAccrualLineFromRecord : accrualLine;
}
// #endregion Query
function computeAccrual() {
    Data.SetValue("AccrualReportStatus__", AccrualReportStatus.InProgress);
    Process.RecallScript("startComputation", true);
}
/**
 * Computes the accrual report by querying the database and generating the CSV file.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function startComputation(isFirstRun = true) {
    Variable.SetValueAsString("ScriptStartExecutionTime", new Date().toString());
    const areAllLinesComputed = buildCSV(isFirstRun);
    if (areAllLinesComputed) {
        endComputation();
    }
    else {
        Process.RecallScript("continueComputation", true);
    }
}
function endComputation() {
    Data.SetValue("ComputationDateTime__", new Date());
    Data.SetValue("AccrualReportStatus__", AccrualReportStatus.Computed);
    let validityDateTime = new Date();
    validityDateTime.setDate(validityDateTime.getDate() + 2); //  2 days window to export before expiration
    Data.SetValue("ValidityDateTime", validityDateTime);
    Process.SetAutoValidateOnExpiration(true);
    Process.PreventApproval();
    if (Variable.GetValueAsString("exportAfterCompute") === "true") {
        Process.RecallScript("exporttoerp", true);
    }
}
/**
 * Generates the filename for the accrual report CSV file.
 * @returns The filename.
 */
function getAccrualFileName() {
    let formattedAccrualReport = Language.Translate("_AccrualReport", false);
    formattedAccrualReport = Sys.Helpers.String.RemoveDiacritics(formattedAccrualReport);
    formattedAccrualReport = formattedAccrualReport.replace(" ", "-");
    const formattedAccrualDate = Sys.Helpers.Date.ToUTCDate(Data.GetValue("AccrualEndDate__"));
    const accrualCompanyCode = Data.GetValue("AccrualCompanyCode__");
    const accrualReportMsnex = Data.GetValue("MSNEX");
    return `${formattedAccrualReport}_${accrualCompanyCode}_${formattedAccrualDate}_${accrualReportMsnex}`;
}
function getHeaderAccrualLineMapping() {
    // Map to store the header and the data of AccrualLine
    const headerAccrualLineMapping = new Map([
        ["Company Code", "CompanyCode"],
        ["Vendor Number", "VendorNumber"],
        ["Order Number", "OrderNumber"],
        ["Item Number", "ItemNumber"],
        ["GL Account", "GLAccount"],
        ["Ordered Amount", "OrderedAmount"],
        ["Delivered Amount", "DeliveredAmount"],
        ["Invoiced Amount", "InvoicedAmount"],
        ["Accrual Amount", "AccrualAmount"],
        ["Generation Date", "GenerationDate"],
        ["Situation Date", "SituationDate"]
    ]);
    const customHeaderAccrualLineMapping = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Accrual.CustomizeHeaderAccrualLineMapping", headerAccrualLineMapping);
    return customHeaderAccrualLineMapping ? customHeaderAccrualLineMapping : headerAccrualLineMapping;
}
/**
 * Builds the CSV file for the accrual report.
 * @returns if all event lines have been computed
 */
function buildCSV(isFirstRun) {
    Log.Info("Build CSV");
    const outputCSV = new Sys.Helpers.CSVExport.OutputCSV();
    outputCSV.SetAutoFlush(20000);
    if (isFirstRun) {
        outputCSV.SetHeader(buildOutputCSVHeader());
    }
    let orderCalculationObject = new Map();
    const isTheTreatmentCompleted = processAccrualEvents(orderCalculationObject, outputCSV);
    if (isFirstRun) {
        outputCSV.AttachCSVFile(getAccrualFileName());
    }
    else {
        outputCSV.AppendContentToExistingAttachment(0);
    }
    return isTheTreatmentCompleted;
}
/**
 * Processes the accrual events and updates the order calculation object and CSV output.
 * @param orderCalculationObject The order calculation object.
 * @param outputCSV The output CSV object.
 * @returns if the treatment is completed
 */
function processAccrualEvents(orderCalculationObject, outputCSV) {
    const processQuery = createQuery();
    if (processQuery.MoveFirst()) {
        let previousVendorNumber = "";
        let previousOrderNumber = "";
        let record = processQuery.MoveNextRecord();
        let isProcessRecallNeeded = false;
        while (record && !isProcessRecallNeeded) {
            const vars = record.GetVars();
            let accrualLine = createAccrualLineFromRecord(vars);
            // If the previous order number is different from the current one, we add the previous order to the csv
            if (!Sys.Helpers.IsEmpty(previousOrderNumber) && previousOrderNumber !== accrualLine.OrderNumber) {
                addAccrualLinesToCSV(orderCalculationObject, outputCSV);
                isProcessRecallNeeded = handleProcessRecall(previousVendorNumber, previousOrderNumber);
            }
            if (!isProcessRecallNeeded) {
                updateCalculationObjet(accrualLine, orderCalculationObject);
                previousVendorNumber = accrualLine.VendorNumber;
                previousOrderNumber = accrualLine.OrderNumber;
                record = processQuery.MoveNextRecord();
            }
        }
        if (!isProcessRecallNeeded) {
            // Serialize last lines left in the orderCalculationObject into the CSV
            addAccrualLinesToCSV(orderCalculationObject, outputCSV);
        }
        processQuery.Reset();
        return !isProcessRecallNeeded;
    }
    processQuery.Reset();
    return true;
}
/**
 * Called after all items of an order have been added to the CSV to check if there are still at least 2 minutes to treat the next order
 * If not it set all variables for a recall
 */
function handleProcessRecall(previousVendorNumber, previousOrderNumber) {
    Variable.SetValueAsString("lastVendorNumberTreated", previousVendorNumber);
    Variable.SetValueAsString("lastOrderNumberTreated", previousOrderNumber);
    const currentTime = new Date();
    const scriptStartExecutionTime = new Date(Variable.GetValueAsString("ScriptStartExecutionTime"));
    const customProcessCall = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Accrual.IsProcessCallRequired", scriptStartExecutionTime) === true;
    if (customProcessCall) {
        Log.Info("Force ProcessCall from the UserExit IsProcessCallRequired");
        return customProcessCall;
    }
    // After 8 minutes, the script will be recalled (to avoid timeout)
    const timeout = 8 * 60 * 1000;
    return currentTime.getTime() - scriptStartExecutionTime.getTime() > timeout;
}
/**
 * Adds all accrual lines from the orderCalculationObject to the CSV.
 * @param orderCalculationObject The order calculation object.
 * @param outputCSV The output CSV object.
 */
function addAccrualLinesToCSV(orderCalculationObject, outputCSV) {
    for (const dataLine of orderCalculationObject.values()) {
        // Skip line when the accrual amount is equal to 0 or less
        if (dataLine.AccrualAmount <= 0) {
            continue;
        }
        const isLineNotWantedCSV = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Accrual.CustomizeIsLineNotWantedCSV", dataLine);
        if (isLineNotWantedCSV) {
            continue;
        }
        const headerAccrualLineMapping = getHeaderAccrualLineMapping();
        const stringifiedValues = Array.from(headerAccrualLineMapping.values()).map(key => {
            let value = dataLine[key];
            if (typeof value === "number") {
                value = value.toFixed(2);
            }
            return value ? value.toString() : "";
        });
        outputCSV.AddLine(stringifiedValues);
    }
    orderCalculationObject.clear();
}
/**
 * Updates the order calculation object with the accrual line.
 * @param accrualLine The accrual line.
 * @param orderCalculationObject The order calculation object.
 */
function updateCalculationObjet(accrualLine, orderCalculationObject) {
    const lineKey = getLineKey(accrualLine);
    if (!orderCalculationObject.has(lineKey)) {
        orderCalculationObject.set(lineKey, accrualLine);
    }
    else {
        const existingAccrualLine = orderCalculationObject.get(lineKey);
        existingAccrualLine.OrderedAmount += accrualLine.OrderedAmount;
        existingAccrualLine.DeliveredAmount += accrualLine.DeliveredAmount;
        existingAccrualLine.InvoicedAmount += accrualLine.InvoicedAmount;
        existingAccrualLine.AccrualAmount += accrualLine.AccrualAmount;
        if (accrualLine.InvoicedAmount > 0) {
            existingAccrualLine.GLAccount = accrualLine.GLAccount;
        }
    }
}
/**
 * Generate the key to identify with which line this event should be aggregated with
 * @param accrualLine current accrual event being treated
 * @returns key for the map of accrual lines
 */
function getLineKey(accrualLine) {
    const standardKey = `${accrualLine.CompanyCode}-${accrualLine.VendorNumber}-${accrualLine.OrderNumber}-${accrualLine.ItemNumber}`;
    const customLineKey = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Accrual.CustomizeAccrualLineKeyCSV", accrualLine, standardKey);
    return customLineKey ? customLineKey : standardKey;
}
/**
 * Builds the header for the output CSV.
 * @returns The header array.
 */
function buildOutputCSVHeader() {
    Log.Info("Build CSV header");
    const headerAccrualLineMapping = getHeaderAccrualLineMapping();
    return Array.from(headerAccrualLineMapping.keys());
}
/**
 * Place Accrual Report CSV attachment in dedicated outbound channel
 */
function exportAccrualToERP() {
    const detailedAccrualReportFile = Attach.GetAttach(0);
    try {
        const copyFileTransport = Process.CreateTransport("Copy");
        if (!copyFileTransport) {
            throw new Error("ERROR: Unable to create transport");
        }
        const vars = copyFileTransport.GetUninheritedVars();
        vars.AddValue_String("CopyPath", Variable.GetValueAsString("SFTPConfigurationName"), true);
        vars.AddValue_String("CreateIfNotExist", 1, true);
        const attachVars = copyFileTransport.AddAttachEx(detailedAccrualReportFile).GetVars();
        attachVars.AddValue_String("AttachEncoding", "UTF-8", true);
        attachVars.AddValue_String("AttachOutputName", getOutputPath() + Attach.GetName(0), true);
        attachVars.AddValue_String("AttachToDisplay", "converted", true);
        copyFileTransport.Process();
        Log.Info("CopyFile RuidEx : " + copyFileTransport.GetUninheritedVars().GetValue_String("RuidEx", 0));
        Data.SetValue("ExportDate__", new Date());
        Data.SetValue("AccrualReportStatus__", AccrualReportStatus.Exported);
        ERPIntegrationHelper.WaitForERPExpiration();
    }
    catch (err) {
        Log.Error(err);
        throw new Error("ERROR: Unable to export CSV to " + Variable.GetValueAsString("SFTPConfigurationName"));
    }
}
/**
 * Construct output path for the current SFTP configuration
 * @returns {string}
*/
function getOutputPath() {
    const ftpAccountName = Variable.GetValueAsString("FTPAccountName");
    const ftpFolderName = Variable.GetValueAsString("FTPFolderName");
    let path = "";
    if (ftpAccountName && ftpAccountName !== "") {
        path += ftpAccountName;
        path += "\\";
    }
    if (ftpFolderName && ftpFolderName !== "") {
        path += ftpFolderName;
        path += "\\";
    }
    return path;
}
function handleTimeout(actionName) {
    // Put the technical status at 200 if the process timed out on computation
    Process.StateOnLastScriptFailure(200);
    if (Process.AutoValidatingOnExpiration()) {
        switch (Data.GetValue("AccrualReportStatus__")) {
            case AccrualReportStatus.Computed: // Report not exported
                Data.SetValue("State", 100);
                Data.SetValue("AccrualReportStatus__", AccrualReportStatus.ComputedAndExpired);
                break;
            case AccrualReportStatus.Exported: // ERP integration timeout
                Data.SetValue("AccrualReportStatus__", AccrualReportStatus.IntegrationFailed);
                Data.SetValue("ERPPostingError__", Language.Translate("_ERP integration in timeout"));
            /* falls through */
            default:
                Data.SetValue("State", 200);
                break;
        }
    }
    else if (Data.GetValue("State") > 0 && actionName === "") // Empty action but not auto validating means process got interrupted during a crash
     {
        Log.Error("Error during treatment");
        Data.SetValue("State", 200);
    }
}
const ERPIntegrationHelper = {
    /**
     * Set the validity date to 48 hours after the current date
     */
    WaitForERPExpiration: function () {
        const validityDate = new Date();
        // Set the default timeout to 48 hours
        validityDate.setHours(validityDate.getHours() + 48);
        // Call the user exit in case of overridden validity date
        Data.SetValue("ValidityDateTime", validityDate);
        Process.SetAutoValidateOnExpiration(true);
        Process.WaitForUpdate();
    },
    /**
     * Set the validity date to 1 month after the current date
     */
    RestoreValidity: function () {
        const validityDT = new Date(Data.GetValue("SubmitDateTime"));
        validityDT.setMonth(validityDT.getMonth() + 1);
        Data.SetValue("ValidityDateTime", validityDT);
    }
};
/**
 * Called after the ERP Acknowledgment
 * and will update the status of the process to "Integrated"
 */
function continueAfterErpAck() {
    ERPIntegrationHelper.RestoreValidity();
    if (Data.GetValue("ERPPostingError__")) {
        Data.SetValue("AccrualReportStatus__", AccrualReportStatus.IntegrationFailed);
    }
    else {
        Data.SetValue("AccrualReportStatus__", AccrualReportStatus.Integrated);
    }
    Lib.AP.ERPAcknowledgment.SendActionToErpAcknowledgmentProcess(Data.GetValue("ERPAckRuidEx__"), Lib.AP.ERPAcknowledgment.Actions.ErpAcknowledgmentProcessed);
}
/**
 * Runs the script to compute the accrual report.
 */
function run() {
    var _a;
    if (Data.GetActionName()) {
        Log.Info("Action:", Data.GetActionName());
    }
    else {
        Log.Info("Action:", Process.AutoValidatingOnExpiration() ? "Auto validating after expiration" : "Empty action name");
    }
    const actionName = (_a = Data.GetActionName()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    handleTimeout(actionName);
    switch (actionName) {
        case "compute":
            computeAccrual();
            break;
        case "startcomputation":
            Variable.SetValueAsString("firstComputationStartTime", Sys.Helpers.Date.Date2DBDateTime(new Date()));
            startComputation();
            break;
        case "continuecomputation":
            startComputation(false);
            break;
        case "exporttoerp":
            if (Data.GetValue("AccrualReportStatus__") === AccrualReportStatus.Draft) {
                Variable.SetValueAsString("exportAfterCompute", "true");
                computeAccrual();
            }
            else {
                exportAccrualToERP();
            }
            break;
        case "continueaftererpack":
            continueAfterErpAck();
            break;
        case "":
            Log.Info(Process.AutoValidatingOnExpiration() ? "Process expired" : "Process failed");
            break;
        case "save":
            Log.Info("Saving process");
            break;
        default:
            Log.Error("Invalid action name");
    }
}
run();
//# sourceMappingURL=validationscript.js.map