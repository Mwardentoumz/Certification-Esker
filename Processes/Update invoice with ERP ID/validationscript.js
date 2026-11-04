"use strict";
let ERPID = Data.GetValue("Document_ERP_ID__");
let ERPVendorNumber = Data.GetValue("ERP_Vendor_Number__");
let EskerID = Data.GetValue("EskerID__");
let ERPError = Data.GetValue("ERPPostingError__");
let ERPAckData = GetERPAckData();
let Holds = Variable.GetValueAsString("Holds__");
let VALIDITY_DURATION = 6;
let FormErrors = [];
const validationXpathVendorRegistrationID = "/ERPAck/EskerVendorRegistrationID";
const validationXpathDetailedAccrualReportLauncherID = "/ERPAck/DetailedAccrualReportLauncherID";
const validationXpathEskerPOID = "/ERPAck/EskerPOID";
const validationXpathEskerGRID = "/ERPAck/EskerGRID";
const validationXpathERPLifecycleStatus = "/ERPAck/ERPLifecycleStatus";
const ProcessType = {
    VendorRegistration: "Vendor Registration",
    VendorInvoice: "Vendor Invoice",
    DetailedAccrualReportLauncher: "Detailed Accrual Report Launcher",
    PurchaseOrder: "Purchase Order V2",
    GoodsReceipt: "Goods receipt V2"
};
/**
 * Throw an error to enter retry mode
 * @param errorMsg Short error message for logs and EskerID field error message after last try
 * @param longMsg Description used in logs
 * @param failAfterLastTry If true, set the status of the process to 200 if retryCount equal MaxRetryCount, otherwise, let in state 70
 */
function retryScript(errorMsg, longMsg, failAfterLastTry = false) {
    Log.Error(`${errorMsg} : ${longMsg}`);
    if (Process.GetScriptRetryCount() < Process.GetScriptMaxRetryCount() - 1) {
        // Generate an exception for script to retry
        throw new Error(errorMsg + ". Retrying...");
    }
    else if (failAfterLastTry === true) {
        // Put the process in failure state
        Data.SetValue("State", 200);
    }
    else {
        // Let the process in toValidate with error on the Esker ID
        Data.SetError("EskerID__", errorMsg);
    }
}
function GetERPAckData() {
    const ERPactionDataStr = Variable.GetValueAsString("ERPAckData");
    if (ERPactionDataStr) {
        return JSON.parse(ERPactionDataStr);
    }
    return {};
}
/*******************************
Update the Vendor registration or the Vendor Invoice
********************************/
function updateProcess(transport, process) {
    const vars = transport.GetUninheritedVars();
    const externalVariables = transport.GetExternalVars();
    const state = vars.GetValue_Long("State", 0);
    const waitingForUpdate = vars.GetValue_Long("WaitingForUpdate", 0);
    const contFlag = vars.GetValue_Long("ContainerFlag", 0);
    const invoiceState = vars.GetValue_String("InvoiceStatus__", 0);
    const LastSavedDateTime = vars.GetValue_Date("LastSavedDateTime", 0);
    const vendorRegistrationState = vars.GetValue_String("ProcessStatus__", 0);
    // Fix RD00031845 : ensure CompareDate returns -1 when ERPIntegrationTimeout has never been set
    const ERPIntegrationTimeoutDateTime = new Date(externalVariables.GetValue_String("ERPIntegrationTimeout", 0) || 0);
    const bProcessInERPIntegrationTimeout = Sys.Helpers.Date.CompareDate(ERPIntegrationTimeoutDateTime, LastSavedDateTime) !== -1;
    // FT-025989 - The vendor invoice process is frozen, add an automatic retry mechanism waiting for the invoice process to be resumed
    if (contFlag === 123456789) // invoice is frozen
     {
        updateProcessInFrozenState(state, process, transport, waitingForUpdate, bProcessInERPIntegrationTimeout);
    }
    else if ((state === 90 && waitingForUpdate) || (state === 70 && bProcessInERPIntegrationTimeout) ||
        (state === 100 && (invoiceState === Lib.AP.InvoiceStatus.ToPost || invoiceState === Lib.AP.InvoiceStatus.ToVerify || vendorRegistrationState === "ToValidate"))) {
        updateProcessInExpectedState(process, vars, externalVariables, transport, state);
    }
    else {
        // The process is not in the expected state: failure
        updateProcessInInvalidState(state, waitingForUpdate, bProcessInERPIntegrationTimeout, process);
    }
}
function updateProcessInExpectedState(process, vars, externalVariables, transport, state) {
    switch (process) {
        case ProcessType.VendorRegistration:
            if (ERPVendorNumber === null || ERPVendorNumber === void 0 ? void 0 : ERPVendorNumber.trim()) {
                Log.Info("Updating vendor registration with vendor number:" + ERPVendorNumber);
                vars.AddValue_String("VendorNumber__", ERPVendorNumber, true);
            }
            else {
                Log.Info("Cannot update vendor registration because the vendor number is empty");
            }
            break;
        case ProcessType.DetailedAccrualReportLauncher:
            Log.Info("Updating detailed accrual report with document ID:" + ERPID);
            vars.AddValue_String("ERPID__", ERPID, true);
            break;
        default:
            {
                Log.Info("Updating invoice with document ID:" + ERPID);
                vars.AddValue_String("ERPInvoiceNumber__", ERPID, true);
                externalVariables.AddValue_String("ScheduledActionParameters", Holds, true);
                // Persist any ERPLifecycleStatus received alongside this ack so that a subsequent
                // standard ack (without ERPLifecycleStatus node) can detect a pending TakenInCharge.
                const pendingLifecycleStatus = Variable.GetValueAsString("ERPLifecycleStatus__");
                if (pendingLifecycleStatus) {
                    externalVariables.AddValue_String("PrevERPLifecycleStatusInVIP", pendingLifecycleStatus, true);
                }
                break;
            }
    }
    vars.AddValue_String("ERPPostingError__", ERPError, true);
    vars.AddValue_String("ERPAckRuidEx__", Data.GetValue("RuidEx"), true);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.FinalizeERPAckUpdateInvoice", transport, process);
    // Update custom fields
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Server.ERPAckProcessing.UpdateProcessVars", process, vars, externalVariables);
    const scheduledAction = new Lib.CallScheduledAction.ScheduledAction();
    scheduledAction.msnEx = vars.GetValue_String("MsnEx", 0);
    scheduledAction.actionName = "continueAfterERPAck";
    const isSuccess = Lib.CallScheduledAction.executeAction(vars, scheduledAction, transport, true);
    if (isSuccess) {
        // Fix RD00031845 : ensure ERPIntegrationTimeout is reset so invoice will not be considered
        // as in ERPAck timeout if it has been re-posted without user interaction
        externalVariables.AddValue_String("ERPIntegrationTimeout", "", true);
    }
    else if (state === 100) {
        Log.Info("VIP state 100 - try to reopen it and call scheduled action again");
        Lib.CallScheduledAction.executeAction(vars, scheduledAction, transport, true);
    }
    else {
        retryScript("Failed resume processing on " + process, transport.GetLastErrorMessage());
    }
}
function updateProcessInFrozenState(state, process, transport, waitingForUpdate, bProcessInERPIntegrationTimeout) {
    if (state <= 90) {
        retryScript(`Waiting frozen process ${process} to be resumed`, transport.GetLastErrorMessage());
    }
    else {
        // The process is not in the expected state: failure
        updateProcessInInvalidState(state, waitingForUpdate, bProcessInERPIntegrationTimeout, process);
    }
}
/**
 * Manage records in state other than 90 or waiting state
 * Add a log error in the current process and set in error
 */
function updateProcessInInvalidState(state, waitingForUpdate, dateCompare, process) {
    let errorMsg = `Cannot update invoice with document ID ${ERPID} because it is not in the expected state (state=${state}`;
    errorMsg += `, waitingForUpdate=${waitingForUpdate}, date compare=${dateCompare})`;
    if (process === ProcessType.VendorRegistration) {
        errorMsg = `Cannot update vendor registration with vendor number ${ERPVendorNumber}`;
        errorMsg += ` because it is not in the expected state (state=${state}, waitingForUpdate=${waitingForUpdate})`;
    }
    Log.Error(errorMsg);
    if (!waitingForUpdate) {
        FormErrors.push(`The ${process} is not expecting an update from the ERP`);
    }
    if (state !== 90) {
        FormErrors.push(`The ${process} is not in the expected state: ${state} instead of '90'`);
    }
    if (!dateCompare) {
        FormErrors.push(`The ${process} is not in the expected state: The date comparison shows the process has been updated during the waiting period.`);
    }
    const errors = FormErrors.join("\n");
    Data.SetValue("ProcessingError__", errors);
    Data.SetValue("State", 200);
}
/*******************************
Find the process to update
********************************/
function findAndUpdateProcess(process) {
    var _a, _b;
    const eddTransport = findRecordToUpdate(process);
    if (eddTransport) {
        // When lifecycle is managed by ERP, reject a standard ERPID ack if the VIP is already
        // waiting for a lifecycle ack (BeingProcessedByERP) and the XML has no ERPLifecycleStatus node.
        if (process === ProcessType.VendorInvoice) {
            const invoiceStatus = eddTransport.GetUninheritedVars().GetValue_String("InvoiceStatus__", 0);
            if (invoiceStatus === Lib.AP.InvoiceStatus.BeingProcessedByERP && !((_b = (_a = validationGetERPAckXML()) === null || _a === void 0 ? void 0 : _a.selectSingleNode(validationXpathERPLifecycleStatus)) === null || _b === void 0 ? void 0 : _b.text)) {
                const pendingLifecycleStatus = eddTransport.GetExternalVars().GetValue_String("PrevERPLifecycleStatusInVIP", 0);
                if (pendingLifecycleStatus === Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.TakenInCharge) {
                    Log.Info(`Standard ERP ack received while VIP is BeingProcessedByERP with a pending TakenInCharge lifecycle status — firing ${Lib.AP.ERPAcknowledgment.Actions.ERPLifecycleTakenInCharge} (Esker ID: ${EskerID})`);
                    eddTransport.ResumeWithActionAsync(Lib.AP.ERPAcknowledgment.Actions.ERPLifecycleTakenInCharge);
                    return;
                }
                Log.Error(`Cannot perform standard ERP ID update for ${process} (Esker ID: ${EskerID}): invoice is waiting for an ERP lifecycle ack but ERPLifecycleStatus is missing from the XML`);
                Data.SetValue("ProcessingError__", `Cannot update ${process}: invoice is awaiting an ERP lifecycle update`);
                Data.SetValue("State", 200);
                return;
            }
        }
        updateProcess(eddTransport, process);
        if (Data.GetValue("State") !== 200) {
            // Activate a timeout on the process
            const newValidityDate = new Date();
            newValidityDate.setHours(newValidityDate.getHours() + VALIDITY_DURATION);
            Data.SetValue("ValidityDateTime", newValidityDate);
            // Wait for a response from the record
            Process.WaitForUpdate();
        }
    }
    else {
        Data.SetValue("ProcessingError__", `Cannot find any ${process} matching the Esker ID: ${EskerID}`);
        if (process === ProcessType.VendorInvoice) {
            retryScript("Unable to retrieve invoice record", `Cannot find any ${process} matching the Esker ID: ${EskerID}`, true);
        }
        else {
            Data.SetValue("State", 200);
        }
    }
}
/**
 * Generate the Query and return the eddTransport to update
 * @param process {string} Type of the process to update (VIP, VR)
 * @return {xTransport} The transport that match the RUID/MSNEX from the XML
 */
function findRecordToUpdate(process) {
    //MSN and ProcessID are mandatory to commit modification
    Query.Reset();
    Query.AddAttribute("MSN");
    Query.AddAttribute("ProcessID");
    Query.AddAttribute("ContainerFlag");
    switch (process) {
        case ProcessType.VendorRegistration:
            Query.AddAttribute("ERPVendorNumber__");
            break;
        case ProcessType.VendorInvoice:
            Query.AddAttribute("ERPInvoiceNumber__");
            break;
        case ProcessType.DetailedAccrualReportLauncher:
            Query.AddAttribute("ERPID__");
            break;
        default:
            break;
    }
    Query.AddAttribute("State");
    Query.AddAttribute("WaitingForUpdate");
    Query.AddAttribute("OwnerId");
    Query.AddAttribute("OwnerPb");
    Query.AddAttribute("MainAccountId");
    Query.AddAttribute("RuidEx");
    Query.AddAttribute("MsnEx");
    Query.AddAttribute("InvoiceStatus__");
    Query.AddAttribute("ProcessStatus__");
    Query.AddAttribute("LastSavedDateTime");
    Query.AddAttribute("ValidityDateTime");
    Query.SetSearchInArchive(true);
    Query.SetOptionEx("DoNotGetLocalDBFiles=1");
    let ruid = EskerID;
    if (ruid && !ruid.includes("#")) {
        // add missing process ID
        switch (process) {
            case ProcessType.VendorRegistration:
                ruid = `CD#${Process.GetProcessID("Vendor Registration")}.${EskerID}`;
                break;
            case ProcessType.VendorInvoice:
                ruid = `CD#${Process.GetProcessID("Vendor invoice")}.${EskerID}`;
                break;
            case ProcessType.DetailedAccrualReportLauncher:
                ruid = `CD#${Process.GetProcessID("DetailedAccrualReportLauncher")}.${EskerID}`;
                break;
            case ProcessType.PurchaseOrder:
                ruid = `CD#${Process.GetProcessID(ProcessType.PurchaseOrder)}.${EskerID}`;
                break;
            case ProcessType.GoodsReceipt:
                ruid = `CD#${Process.GetProcessID(ProcessType.GoodsReceipt)}.${EskerID}`;
                break;
            default:
                break;
        }
    }
    Query.SetFilter(`RUIDEX=${ruid}`);
    Query.MoveFirst();
    return Query.MoveNext();
}
function validationGetERPAckXML() {
    const xmlFile = Attach.GetInputFile(0);
    if (xmlFile) {
        try {
            return Process.CreateXMLDOMElement(xmlFile);
        }
        catch (error) {
            Log.Error("Cannot parse the XML file: ", error);
            return null;
        }
    }
    return null;
}
function handleErpAcknowledgmentProcessed() {
    Log.Info("Notification received from the target process. ErpAck completed successfully.");
    // In case the VIP says ok, restore the ValidityDateTime to 2 month
    const validityDateTime = Data.GetValue("ValidityDateTime");
    validityDateTime.setMonth(validityDateTime.getMonth() + 2);
    Data.SetValue("ValidityDateTime", validityDateTime);
}
function updatePurchaseOrderProcess() {
    Log.Info(`Update the Purchase order process with id ${EskerID}`);
    let ruid = EskerID;
    if (ruid && !ruid.includes("#")) {
        ruid = `CD#${Process.GetProcessID(ProcessType.PurchaseOrder)}.${EskerID}`;
    }
    try {
        const updatableDocument = Process.GetUpdatableTransportAsProcessAdmin(ruid);
        const vars = updatableDocument.GetUninheritedVars();
        const externalVariables = updatableDocument.GetExternalVars();
        const actionParts = [ERPError ? "OnERPAckError" : "OnERPAckReceived"];
        if (ERPAckData.action && ERPAckData.action !== "Create") {
            actionParts.push(ERPAckData.action);
        }
        else {
            externalVariables.AddValue_String("ERPACK_OrderNumber__", ERPID, true);
        }
        externalVariables.AddValue_String("ERPACK_TransactionID__", ERPAckData.transactionID, true);
        externalVariables.AddValue_String("ERPACK_Error__", ERPError, true);
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Server.ERPAckProcessing.UpdateProcessVars", ProcessType.PurchaseOrder, vars, externalVariables);
        const action = actionParts.join("-");
        updatableDocument.ResumeWithActionAsync(action);
    }
    catch (error) {
        Log.Error(`Cannot find any ${ProcessType.PurchaseOrder} matching the Esker ID: ${EskerID}`, error);
        Data.SetValue("ProcessingError__", `Cannot find any ${ProcessType.PurchaseOrder} matching the Esker ID: ${EskerID}`);
        Data.SetValue("State", 200);
    }
}
function updateGoodsReceiptProcess() {
    Log.Info("Update the Goods receipt process");
    let ruid = EskerID;
    if (ruid && !ruid.includes("#")) {
        ruid = `CD#${Process.GetProcessID(ProcessType.GoodsReceipt)}.${EskerID}`;
    }
    try {
        const updatableDocument = Process.GetUpdatableTransportAsProcessAdmin(ruid);
        const vars = updatableDocument.GetExternalVars();
        vars.AddValue_String("ERPACK_GRNumber__", ERPID, true);
        vars.AddValue_String("ERPACK_Error__", ERPError, true);
        const action = ERPError ? "OnERPAckError" : "OnERPAckReceived";
        updatableDocument.ResumeWithActionAsync(action);
    }
    catch (error) {
        Log.Error(`Cannot find any ${ProcessType.GoodsReceipt} matching the Esker ID: ${EskerID}`, error);
        Data.SetValue("ProcessingError__", `Cannot find any ${ProcessType.GoodsReceipt} matching the Esker ID: ${EskerID}`);
        Data.SetValue("State", 200);
    }
}
function isCustomLifecycleWaitingStatus(invoiceStatus) {
    const mapping = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.GetERPLifecycleStatusMapping");
    if (typeof mapping !== "object" || mapping === null) {
        return false;
    }
    return Object.keys(mapping).some(key => mapping[key] === invoiceStatus);
}
/**
 * Helper to get ERP lifecycle data variables without duplication
 */
function getERPLifecycleData() {
    return {
        erpReasonCode: Variable.GetValueAsString("ERPReasonCode__"),
        erpReason: Variable.GetValueAsString("ERPReason__"),
        erpReasonComment: Variable.GetValueAsString("ERPReasonComment__"),
        erpActionCode: Variable.GetValueAsString("ERPActionCode__"),
        erpActionReason: Variable.GetValueAsString("ERPActionReason__")
    };
}
/**
 * Maps an ERP lifecycle status to the ReasonCode/ActionCode scope used to resolve the valid code lists
 * (shared with the CDV generation in Sys.FRB2B.CDV.AP.Mapping so an extended/bypassed code is not dropped from the CDV)
 */
function getReasonScopeForLifecycleStatus(lifecycleStatus) {
    switch (lifecycleStatus) {
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Refused:
            return Sys.FRB2B.AP.ReasonScope.Rejection;
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.InDispute:
            return Sys.FRB2B.AP.ReasonScope.Dispute;
        default:
            return undefined;
    }
}
function getERPLifecyclePlainErrorMessage(translationKey, erpLifecycleData, lifecycleStatus) {
    switch (translationKey) {
        case "_ERPLifecycleInvalidReasonCode":
            return erpLifecycleData.erpReasonCode
                ? `Invalid ReasonCode '${erpLifecycleData.erpReasonCode}' for lifecycle status '${lifecycleStatus}'`
                : `ReasonCode is mandatory for lifecycle status '${lifecycleStatus}'`;
        case "_ERPLifecycleInvalidActionCode":
            return `Invalid ActionCode '${erpLifecycleData.erpActionCode || ""}' for lifecycle status '${lifecycleStatus}'`;
        default:
            return translationKey;
    }
}
/**
 * If a reason code is provided, it must match the valid list for the scope (unless bypassed);
 * completes the reason label from the valid list when absent.
 */
function validateReasonCode(validReasonMap, reasonScope, lifecycleStatus, erpLifecycleData, bypassValidation) {
    if (!erpLifecycleData.erpReasonCode || !reasonScope) {
        return { error: "", lazyError: "" };
    }
    if (!bypassValidation && !Object.prototype.hasOwnProperty.call(validReasonMap, erpLifecycleData.erpReasonCode)) {
        return {
            error: getERPLifecyclePlainErrorMessage("_ERPLifecycleInvalidReasonCode", erpLifecycleData, lifecycleStatus),
            lazyError: Language.CreateLazyTranslation("_ERPLifecycleInvalidReasonCode", erpLifecycleData.erpReasonCode, lifecycleStatus)
        };
    }
    const resolvedReason = Object.prototype.hasOwnProperty.call(validReasonMap, erpLifecycleData.erpReasonCode)
        ? validReasonMap[erpLifecycleData.erpReasonCode]
        : "";
    if (!erpLifecycleData.erpReason && resolvedReason) {
        erpLifecycleData.erpReason = resolvedReason;
        Variable.SetValueAsString("ERPReason__", resolvedReason);
    }
    return { error: "", lazyError: "" };
}
/**
 * Maps an ERP lifecycle status to the action name used to resume the target invoice.
 * @returns null when the lifecycle status is not recognized.
 */
function getLifecycleActionName(lifecycleStatus) {
    switch (lifecycleStatus) {
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Approved:
            return Lib.AP.ERPAcknowledgment.Actions.ERPLifecycleApproved;
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Refused:
            return Lib.AP.ERPAcknowledgment.Actions.ERPLifecycleRefused;
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.InDispute:
            return Lib.AP.ERPAcknowledgment.Actions.ERPLifecycleInDispute;
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.TakenInCharge:
            return Lib.AP.ERPAcknowledgment.Actions.ERPLifecycleTakenInCharge;
        default:
            return null;
    }
}
/**
 * If an action code is provided, it must match the valid list (unless bypassed);
 * completes the action reason label from the valid list when absent.
 */
function validateActionCode(validActionMap, lifecycleStatus, erpLifecycleData, bypassValidation) {
    if (!erpLifecycleData.erpActionCode) {
        return { error: "", lazyError: "" };
    }
    if (!bypassValidation && !Object.prototype.hasOwnProperty.call(validActionMap, erpLifecycleData.erpActionCode)) {
        return {
            error: getERPLifecyclePlainErrorMessage("_ERPLifecycleInvalidActionCode", erpLifecycleData, lifecycleStatus),
            lazyError: Language.CreateLazyTranslation("_ERPLifecycleInvalidActionCode", erpLifecycleData.erpActionCode, lifecycleStatus)
        };
    }
    if (!erpLifecycleData.erpActionReason && validActionMap[erpLifecycleData.erpActionCode]) {
        erpLifecycleData.erpActionReason = validActionMap[erpLifecycleData.erpActionCode];
        Variable.SetValueAsString("ERPActionReason__", erpLifecycleData.erpActionReason);
    }
    return { error: "", lazyError: "" };
}
/**
 * Validate the ERP-provided reason and action data from the ERPAck XML, and resolve the labels
 * (erpReason/erpActionReason) to complete when missing.
 * @returns the plain error message (for log/ProcessingError__), the lazy translation (for ERPLifecycleError variable),
 * and the data when invalid data is detected (data is then the raw unvalidated values), otherwise
 * empty errors and the data completed with resolved labels - this is what gets propagated to the CDV.
 */
function resolveERPLifecycleData(lifecycleStatus, xmlDoc) {
    const erpLifecycleData = getERPLifecycleData();
    const userExitResult = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.CustomERPLifecycleDataValidation", xmlDoc, lifecycleStatus, erpLifecycleData);
    if (typeof userExitResult === "string" && userExitResult.length > 0) {
        Log.Error(`ERP lifecycle validation rejected by CustomERPLifecycleDataValidation user exit: ${userExitResult}`);
        return { error: userExitResult, lazyError: userExitResult, data: erpLifecycleData };
    }
    const bypassValidation = userExitResult === true;
    if (bypassValidation) {
        Log.Info("ERP lifecycle validation bypassed by CustomERPLifecycleDataValidation user exit");
    }
    const reasonScope = getReasonScopeForLifecycleStatus(lifecycleStatus);
    // Reason (motif) is mandatory for Refused and InDispute statuses
    if (!bypassValidation && reasonScope && !erpLifecycleData.erpReasonCode) {
        return {
            error: getERPLifecyclePlainErrorMessage("_ERPLifecycleInvalidReasonCode", erpLifecycleData, lifecycleStatus),
            lazyError: Language.CreateLazyTranslation("_ERPLifecycleInvalidReasonCode", "", lifecycleStatus),
            data: erpLifecycleData
        };
    }
    // ExtendValidReasonAndActionCodes user exit is called once here, resolving both maps for the reason and action checks below
    const { reasonCodes: validReasonMap, actionCodes: validActionMap } = Sys.FRB2B.AP.GetValidReasonAndActionCodes(reasonScope);
    const reasonError = validateReasonCode(validReasonMap, reasonScope, lifecycleStatus, erpLifecycleData, bypassValidation);
    if (reasonError.error) {
        return { error: reasonError.error, lazyError: reasonError.lazyError, data: erpLifecycleData };
    }
    const actionError = validateActionCode(validActionMap, lifecycleStatus, erpLifecycleData, bypassValidation);
    return { error: actionError.error, lazyError: actionError.lazyError, data: erpLifecycleData };
}
/**
 * Update the Vendor Invoice process with the ERP lifecycle status (Approved/Refused/InDispute/TakenInCharge).
 * Checks that the invoice is waiting for an update (state=90 + WaitingForUpdate) and in a lifecycle-waiting status
 * (BeingProcessedByERP / OnHold / ToApprove) before waking it.
 */
function updateVendorInvoiceWithLifecycleStatus(process) {
    const lifecycleStatus = Variable.GetValueAsString("ERPLifecycleStatus__");
    const transport = findRecordToUpdate(process);
    if (!transport) {
        Log.Error(`Cannot find any ${process} matching the Esker ID: ${EskerID}`);
        Data.SetValue("ProcessingError__", `Cannot find any ${process} matching the Esker ID: ${EskerID}`);
        retryScript("Unable to retrieve invoice record", `Cannot find any ${process} matching the Esker ID: ${EskerID}`, true);
        return;
    }
    const vars = transport.GetUninheritedVars();
    const externalVars = transport.GetExternalVars();
    const state = vars.GetValue_Long("State", 0);
    const waitingForUpdate = vars.GetValue_Long("WaitingForUpdate", 0);
    const invoiceStatus = vars.GetValue_String("InvoiceStatus__", 0);
    const isWaitingForLifecycle = invoiceStatus === Lib.AP.InvoiceStatus.BeingProcessedByERP
        || invoiceStatus === Lib.AP.InvoiceStatus.OnHold
        || invoiceStatus === Lib.AP.InvoiceStatus.ToApprove
        || isCustomLifecycleWaitingStatus(invoiceStatus);
    if (state !== 90 || !waitingForUpdate || !isWaitingForLifecycle) {
        Log.Info(`Invoice not in lifecycle-waiting state (state=${state}, waitingForUpdate=${waitingForUpdate}, invoiceStatus=${invoiceStatus})`);
        Log.Info(`Falling back to standard ERP ID update for Esker ID: ${EskerID}`);
        findAndUpdateProcess(process);
        return;
    }
    // The status must be resolved before validating its payload, so an unsupported status is rejected here
    // and never reaches the ERPLifecycleError resume path below (which would leave the invoice untouched otherwise).
    const actionName = getLifecycleActionName(lifecycleStatus);
    if (!actionName) {
        Log.Error(`Unknown ERP lifecycle status: ${lifecycleStatus}`);
        Data.SetValue("ProcessingError__", `Unknown ERP lifecycle status: ${lifecycleStatus}`);
        Data.SetValue("State", 200);
        return;
    }
    const { error: validationError, lazyError: validationLazyError, data: erpLifecycleData } = resolveERPLifecycleData(lifecycleStatus, validationGetERPAckXML());
    if (validationError) {
        Log.Error(`Invalid ERP lifecycle data: ${validationError}`);
        ERPError = validationLazyError;
        Data.SetValue("ProcessingError__", validationError);
        // A dedicated marker (distinct from ERPPostingError__) so Lib.AP.ShouldAllowResumePendingERPDrivenStatus can tell
        // a lifecycle validation error apart from an ordinary ERP posting error; kept as a Variable (not a Data field)
        // since it is only ever read/written from scripts, never queried or bound to a layout control
        externalVars.AddValue_String("ERPLifecycleError", ERPError, true);
        vars.AddValue_String("ERPAckRuidEx__", Data.GetValue("RuidEx"), true);
        transport.ResumeWithActionAsync(Lib.AP.ERPAcknowledgment.Actions.ERPLifecycleError);
        return;
    }
    externalVars.AddValue_String("PrevERPLifecycleStatusInVIP", lifecycleStatus, true);
    externalVars.AddValue_String("ERPReasonOptions", JSON.stringify(erpLifecycleData), true);
    Log.Info(`Updating vendor invoice ${EskerID} with lifecycle status=${lifecycleStatus}, action=${actionName}`);
    transport.ResumeWithActionAsync(actionName);
}
function main() {
    var _a;
    if (Data.GetValue("State") < 50) {
        // Validation script executed after extraction script, don't do anything
        // Validation script will be re-executed as the process don't expect a manual approval
        return;
    }
    const xmlDoc = validationGetERPAckXML();
    const isAccrualReport = xmlDoc === null || xmlDoc === void 0 ? void 0 : xmlDoc.selectSingleNode(validationXpathDetailedAccrualReportLauncherID);
    // Require at least an ERP error or an identifier (invoice ID, vendor ID) except for Accrual Report
    if ((!isAccrualReport && !(ERPID === null || ERPID === void 0 ? void 0 : ERPID.trim())) && !(ERPVendorNumber === null || ERPVendorNumber === void 0 ? void 0 : ERPVendorNumber.trim()) && !ERPError) {
        Data.SetValue("ProcessingError__", "Neither ERP Id nor ERP Error were provided");
        Data.SetValue("State", 200);
        return;
    }
    if (Data.GetActionName() === Lib.AP.ERPAcknowledgment.Actions.ErpAcknowledgmentProcessed) {
        handleErpAcknowledgmentProcessed();
    }
    else if (xmlDoc === null || xmlDoc === void 0 ? void 0 : xmlDoc.selectSingleNode(validationXpathVendorRegistrationID)) {
        Log.Info("Update the Vendor Registration process");
        findAndUpdateProcess(ProcessType.VendorRegistration);
    }
    else if (xmlDoc === null || xmlDoc === void 0 ? void 0 : xmlDoc.selectSingleNode(validationXpathDetailedAccrualReportLauncherID)) {
        Log.Info("Update the Detailed Accrual Report Launcher process");
        findAndUpdateProcess(ProcessType.DetailedAccrualReportLauncher);
    }
    else if (xmlDoc === null || xmlDoc === void 0 ? void 0 : xmlDoc.selectSingleNode(validationXpathEskerPOID)) {
        updatePurchaseOrderProcess();
    }
    else if (xmlDoc === null || xmlDoc === void 0 ? void 0 : xmlDoc.selectSingleNode(validationXpathEskerGRID)) {
        updateGoodsReceiptProcess();
    }
    else if ((_a = xmlDoc === null || xmlDoc === void 0 ? void 0 : xmlDoc.selectSingleNode(validationXpathERPLifecycleStatus)) === null || _a === void 0 ? void 0 : _a.text) {
        Log.Info("Update the Vendor Invoice process with ERP lifecycle status");
        updateVendorInvoiceWithLifecycleStatus(ProcessType.VendorInvoice);
    }
    else {
        // By default, update the VIP
        Log.Info("Update the Vendor Invoice process");
        findAndUpdateProcess(ProcessType.VendorInvoice);
    }
}
main();
//# sourceMappingURL=validationscript.js.map