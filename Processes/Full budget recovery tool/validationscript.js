"use strict";
var NO_MAIN_CALL;
const nbIDPerFilter = 50;
const currentName = Data.GetActionName();
const currentStep = Data.GetValue("CurrentStep__");
const timeoutHelper = new Sys.Helpers.TimeoutHelper(400, 100);
Log.Info(`Execute action: ${currentName}, step: ${currentStep}`);
let userActionResult = null;
const actionsByStep = {
    PR: {
        CheckBudget: { fn: CheckPRBudget, longAction: true },
        RecoverBudget: { fn: RecoverPRBudget, longAction: true }
    },
    PO: {
        CheckBudget: { fn: CheckPOBudget, longAction: true },
        RecoverBudget: { fn: RecoverPOBudget, longAction: true }
    },
    GR: {
        CheckBudget: { fn: CheckGRBudget, longAction: true },
        RecoverBudget: { fn: RecoverGRBudget, longAction: true }
    },
    Invoice: {
        CheckBudget: { fn: CheckInvoiceBudget, longAction: true },
        RecoverBudget: { fn: RecoverInvoiceBudget, longAction: true }
    },
    Budget: {
        RecomputeBudget: { fn: RecomputeBudget, longAction: true }
    }
};
function InitUserActionResult(step, action) {
    const str_userActionResults = Variable.GetValueAsString("UserActionResults");
    const userActionResults = (str_userActionResults && JSON.parse(str_userActionResults)) || {};
    let userActionResultsForStep = userActionResults[step];
    if (!userActionResultsForStep) {
        userActionResults[step] = userActionResultsForStep = {};
    }
    const timestamp = Sys.Helpers.Date.Date2DBDateTime(new Date());
    const internal_userActionResult = userActionResultsForStep[action + " - " + timestamp] = {
        timestamp: timestamp
    };
    return {
        GetTimestamp: function () {
            return timestamp;
        },
        AddResult: function (subAction, result) {
            internal_userActionResult[subAction] = result;
        },
        Serialize: function () {
            Variable.SetValueAsString("UserActionResults", JSON.stringify(userActionResults));
        }
    };
}
function SaveImpactedBudgetIDs(budgetIDs) {
    const str_impactedBudgetIDs = Variable.GetValueAsString("ImpactedBudgetIDs");
    let impactedBudgetIDs = (str_impactedBudgetIDs && JSON.parse(str_impactedBudgetIDs)) || [];
    impactedBudgetIDs = impactedBudgetIDs.concat(budgetIDs);
    impactedBudgetIDs = Sys.Helpers.Array.GetDistinctArray(impactedBudgetIDs);
    Variable.SetValueAsString("ImpactedBudgetIDs", JSON.stringify(impactedBudgetIDs));
}
function GetRuidExs(selectionMethod, filter, options) {
    let documents;
    const getDocumentsOptions = Sys.Helpers.Extend({}, options, {
        dataFileNeeded: false
    });
    if (selectionMethod === "_Doc") {
        documents = GetDocuments(filter, getDocumentsOptions, ["RuidEx", "MsnEx"]);
    }
    else {
        documents = GetDocumentsViaItems(filter, getDocumentsOptions, ["RuidEx", "MsnEx"]);
    }
    const allRuidEx = [];
    documents.ForEach((docWithOnlyRuidEx) => {
        allRuidEx.push(docWithOnlyRuidEx.GetUninheritedVars().GetValue_String("RUIDEX", 0));
    });
    return allRuidEx;
}
function CheckBudget(options) {
    Log.Info(`Checking budget of ${options.docName} documents...`);
    const selectionMethod = options.multiSelectionMethod ? Data.GetValue("SelectionMethod__") : "_Doc";
    const filter = Data.GetValue("Filter__");
    userActionResult.AddResult("SelectionMethod", {
        method: selectionMethod,
        filter: filter
    });
    // We use recallscript to process documents.
    // All documents ruidex are queryied first, then store on an external variable.
    const storedRuidex = Variable.GetValueAsString("RuidexList");
    // If external variable contains ruidex, use it, otherwise a query is needed (first run)
    const allRuidEx = !Sys.Helpers.IsEmpty(storedRuidex) ? JSON.parse(storedRuidex) : GetRuidExs(selectionMethod, filter, options);
    // max recallscript = 100 and avoid to few documents processed in each run
    const maxDocumentsInThisValidationScriptRun = Math.max(Math.ceil(allRuidEx.length / 100), 200);
    const storedResult = Variable.GetValueAsString("Results");
    const result = storedResult ? JSON.parse(storedResult) : {
        errors: {},
        warnings: {},
        infos: {},
        docCount: allRuidEx.length,
        docProcessed: 0,
        docInErrorCount: 0,
        docInWarningCount: 0,
        errorCount: 0,
        warningCount: 0
    };
    let ruidex;
    let nbDocProcessedInThisValidationScriptRun = 0;
    while (nbDocProcessedInThisValidationScriptRun < maxDocumentsInThisValidationScriptRun && (ruidex = allRuidEx.pop()) !== undefined) {
        nbDocProcessedInThisValidationScriptRun++;
        const getDocumentsOptionsWithXML = Sys.Helpers.Extend({}, options, {
            dataFileNeeded: true
        });
        // eslint-disable-next-line no-loop-func
        GetDocuments(Sys.Helpers.LdapUtil.FilterEqual("RuidEx", ruidex).toString(), getDocumentsOptionsWithXML).ForEach((document) => {
            if (!document) {
                Log.Warn("[CheckBudget] No document found for ruidex " + ruidex);
                return;
            }
            const formData = document.GetFormData();
            if (formData) {
                const checkBudgetIntegrityOptions = {
                    initialSpendingIDByItems: options.GetInitialBudgetIDByItems ? options.GetInitialBudgetIDByItems(document) : null
                };
                Sys.Parameters.GetInstance("PAC").Reload({ document });
                Sys.Parameters.GetInstance("P2P").Reload({ document });
                Sys.Parameters.GetInstance("AP").Reload({ document });
                Lib.Spending.Budget.CheckBudgetIntegrity(document, checkBudgetIntegrityOptions)
                    .Then(resultOfCheckBudgetIntegrity => {
                    if (resultOfCheckBudgetIntegrity.errors.length > 0) {
                        result.errors[ruidex] = resultOfCheckBudgetIntegrity.errors;
                        result.errorCount += resultOfCheckBudgetIntegrity.errors.length;
                    }
                    if (resultOfCheckBudgetIntegrity.warnings.length > 0) {
                        result.warnings[ruidex] = resultOfCheckBudgetIntegrity.warnings;
                        result.warningCount += resultOfCheckBudgetIntegrity.warnings.length;
                    }
                    if (resultOfCheckBudgetIntegrity.infos.length > 0) {
                        result.infos[ruidex] = resultOfCheckBudgetIntegrity.infos;
                    }
                    let resultOfCheckBudget, impacted;
                    if (resultOfCheckBudgetIntegrity.errors.length > 0) {
                        resultOfCheckBudget = "error";
                        impacted = true;
                        result.docInErrorCount++;
                    }
                    else if (resultOfCheckBudgetIntegrity.warnings.length > 0) {
                        resultOfCheckBudget = "warning";
                        impacted = true;
                        result.docInWarningCount++;
                    }
                    else {
                        resultOfCheckBudget = "ok";
                        impacted = false;
                    }
                    if (options.OnEachDocumentResult) {
                        options.OnEachDocumentResult(document, resultOfCheckBudget);
                    }
                    if (impacted) {
                        SaveImpactedBudgetIDs(Object.keys(resultOfCheckBudgetIntegrity.budgets.bySpendingID));
                    }
                    result.docProcessed++;
                });
            }
            else {
                result.errors[ruidex] = [
                    {
                        type: "UNEXPECTED_ERROR",
                        details: "No form data"
                    }
                ];
                result.errorCount++;
            }
            timeoutHelper.NotifyIteration();
        });
        // Validation script will be recalled to check/recover other documents, so we store document ids in an external variable to avoid querying it each time.
        Variable.SetValueAsString("RuidexList", JSON.stringify(allRuidEx));
        // Same for result
        Variable.SetValueAsString("Results", JSON.stringify(result));
    }
    if (nbDocProcessedInThisValidationScriptRun >= maxDocumentsInThisValidationScriptRun && allRuidEx.length > 0) {
        Process.RecallScript(currentName, false);
    }
    // if all ruidex are processed, external variable are cleared
    if (allRuidEx.length == 0) {
        Variable.SetValueAsString("RuidexList", "");
        Variable.SetValueAsString("Results", "");
        Variable.SetValueAsString("RecoverbudgetResult", "");
    }
    userActionResult.AddResult("CheckBudget", result);
}
function RecoverBudget(checkBudgetFn) {
    const recoverbudgetResult = Variable.GetValueAsString("RecoverbudgetResult");
    let result = {
        requestCount: 0,
        errors: {}
    };
    if (!Sys.Helpers.IsEmpty(recoverbudgetResult)) {
        result = JSON.parse(recoverbudgetResult);
    }
    checkBudgetFn((document, resultOfCheckBudget) => {
        const ruidex = document.GetUninheritedVars().GetValue_String("RUIDEX", 0);
        if (resultOfCheckBudget === "error") {
            result.errors[ruidex] = Language.Translate("_BlockingBudgetIssues");
        }
        else if (resultOfCheckBudget === "warning") {
            let availabilityInfo = null;
            CheckDocumentAvailability(document)
                .Then(res => {
                availabilityInfo = res;
                return CreateRecoveryOperationDetails(document);
            })
                .Then(() => UpdateDocumentAction(document, availabilityInfo))
                .Then(() => result.requestCount++)
                .Catch(error => {
                result.errors[ruidex] = Language.Translate("_RequestingRecoveryFailed", false, error.toString());
            })
                .Then(() => {
                if (availabilityInfo && availabilityInfo.ownershipToRelease) {
                    document.ReleaseAsyncOwnership("FullBudgetRecovery");
                }
            });
        }
        Variable.SetValueAsString("RecoverbudgetResult", JSON.stringify(result));
    });
    userActionResult.AddResult("RecoverBudget", result);
}
function CheckPRBudget(onEachPRResult) {
    CheckBudget({
        docName: "PR",
        processName: "Purchase requisition V2",
        itemsTableName: "PAC - PR - Items__",
        docIDField: "RUIDEX",
        itemsDocIDField: "PRRUIDEX__",
        multiSelectionMethod: true,
        OnEachDocumentResult: onEachPRResult
    });
}
function RecoverPRBudget() {
    RecoverBudget(CheckPRBudget);
}
function CheckPOBudget(onEachPOResult) {
    CheckBudget({
        docName: "PO",
        processName: "Purchase order V2",
        itemsTableName: "PAC - PO - Items__",
        docIDField: "RUIDEX",
        itemsDocIDField: "PORUIDEX__",
        multiSelectionMethod: true,
        GetInitialBudgetIDByItems: document => {
            const data = document.GetFormData();
            return Sys.Helpers.Promise.Tools.Awaited(Lib.Purchasing.poBudgetSpending.GetPRItemsInfosByItems(data)).map((item) => item.spendingID);
        },
        OnEachDocumentResult: onEachPOResult
    });
}
function RecoverPOBudget() {
    RecoverBudget(CheckPOBudget);
}
function CheckGRBudget(onEachGRResult) {
    CheckBudget({
        docName: "GR",
        processName: "Goods receipt V2",
        itemsTableName: "P2P - Goods receipt - Items__",
        docIDField: "RUIDEX",
        itemsDocIDField: "GRRUIDEX__",
        multiSelectionMethod: true,
        GetInitialBudgetIDByItems: document => {
            const data = document.GetFormData();
            return Lib.Purchasing.GRBudget.GetPOBudgetIDByItems(data);
        },
        OnEachDocumentResult: onEachGRResult
    });
}
function RecoverGRBudget() {
    RecoverBudget(CheckGRBudget);
}
function CheckInvoiceBudget(onEachInvoiceResult) {
    CheckBudget({
        docName: "Invoice",
        processName: "Vendor invoice",
        multiSelectionMethod: false,
        GetInitialBudgetIDByItems: function (document) {
            let data = document.GetFormData();
            return Sys.Helpers.Promise.Tools.Awaited(Lib.AP.apBudgetSpending.GetPreviousBudgetIDByItems(data));
        },
        OnEachDocumentResult: onEachInvoiceResult
    });
}
function RecoverInvoiceBudget() {
    RecoverBudget(CheckInvoiceBudget);
}
function RecomputeBudget() {
    Log.Info("Recomputing budgets...");
    const budgetIDs = Data.GetValue("BudgetIDs__").split("\n");
    const result = {
        budgetIDs: budgetIDs,
        errors: {}
    };
    budgetIDs.forEach(budgetID => {
        const budget = {};
        budget[budgetID] = true;
        const criticalSectionName = Lib.Spending.Budget.budgetHandler.GetCriticalSection(budget);
        Log.Info("Try entering Budget critical section: " + criticalSectionName);
        const lockOK = Process.PreventConcurrentAccess(criticalSectionName, () => {
            Log.Info("Entered budget critical section");
            const ok = Lib.Spending.Budget.ComputeBudgetFromOperationDetails(budgetID);
            if (!ok) {
                result.errors[budgetID] = {
                    type: "RECOMPUTE_ERROR"
                };
            }
        }, null, 60);
        if (!lockOK) {
            result.errors[budgetID] = {
                type: "LOCK_ERROR",
                details: criticalSectionName
            };
        }
    });
    userActionResult.AddResult("RecomputeBudget", result);
}
function GetDocuments(filters, options, attributes) {
    filters = (Sys.Helpers.IsArray(filters) ? filters : [filters]);
    const ctorQueryParams = new Sys.Helpers.QueryParams();
    ctorQueryParams.asAdmin = true;
    ctorQueryParams.onTransport = true;
    ctorQueryParams.table = `CDNAME#${options.processName}`;
    ctorQueryParams.attributes = attributes || ["*"];
    if (options.dataFileNeeded) {
        ctorQueryParams.attributes.push("DataFile");
    }
    ctorQueryParams.searchInArchive = true;
    let idxFilter = 0;
    const nextQueryParamsFn = () => {
        if (idxFilter < filters.length) {
            const queryParams = new Sys.Helpers.QueryParams();
            queryParams.filter = `(&${Sys.Helpers.String.ParenthesisLdapFilter(filters[idxFilter++])}${options.docSubFilter || ""})`;
            return queryParams;
        }
        return null; // no more query
    };
    const queryIterator = new Sys.Helpers.BigQueryIterator(ctorQueryParams, nextQueryParamsFn, "MsnEx");
    queryIterator.timeoutHelper = timeoutHelper;
    return queryIterator;
}
function GetDocumentsViaItems(filters, options, attributes) {
    const items = GetItems(filters, options);
    let docIDs = [];
    const docFilters = []; // filter with max nbIDPerFilter IDs
    items.ForEach(item => {
        const vars = item.GetVars();
        const id = vars.GetValue_String(options.itemsDocIDField, 0);
        docIDs.push("(" + options.docIDField + "=" + id + ")");
        if (docIDs.length === nbIDPerFilter) {
            docFilters.push("(|" + docIDs.join("") + ")");
            docIDs = [];
        }
        timeoutHelper.NotifyIteration();
    });
    if (docIDs.length > 0) {
        docFilters.push("(|" + docIDs.join("") + ")");
    }
    return GetDocuments(docFilters, options, attributes);
}
function GetItems(filters, options) {
    filters = (Sys.Helpers.IsArray(filters) ? filters : [filters]);
    const ctorQueryParams = new Sys.Helpers.QueryParams();
    ctorQueryParams.asAdmin = true;
    ctorQueryParams.onTransport = false;
    ctorQueryParams.table = options.itemsTableName;
    ctorQueryParams.attributes = [options.itemsDocIDField];
    let idxFilter = 0;
    const nextQueryParamsFn = () => {
        if (idxFilter < filters.length) {
            const queryParams = new Sys.Helpers.QueryParams();
            queryParams.filter = `(&${Sys.Helpers.String.ParenthesisLdapFilter(filters[idxFilter++])}${options.docSubFilter || ""})`;
            return queryParams;
        }
        return null; // no more query
    };
    const queryIterator = new Sys.Helpers.BigQueryIterator(ctorQueryParams, nextQueryParamsFn, "Msn");
    queryIterator.timeoutHelper = timeoutHelper;
    return queryIterator;
}
function CheckDocumentAvailability(document) {
    return Sys.Helpers.Promise.Create(resolve => {
        const result = {};
        const vars = document.GetUninheritedVars();
        result.state = vars.GetValue_Long("State", 0);
        result.validityDateTime = vars.GetValue_String("ValidityDateTime", 0);
        const archiveState = vars.GetValue_Long("ArchiveState", 0);
        let available = false;
        if (result.state >= 100 && archiveState) {
            available = true;
        }
        else if (result.state === 90) {
            available = true;
        }
        else if (result.state === 70) {
            const errorCode = document.GetAsyncOwnership("FullBudgetRecovery", 10000);
            if (errorCode !== 0) {
                throw new Error("Get ownership on document failed. Details: " + document.GetLastErrorMessage());
            }
            available = true;
            result.ownershipToRelease = true;
        }
        else if (result.state === 50) {
            const requestedActions = vars.GetValue_String("RequestedActions", 0);
            available = requestedActions === "approve|FullBudgetRecovery";
        }
        if (!available) {
            throw new Error(`Unexpected state of document, state: ${result.state}, archiveState: ${archiveState}`);
        }
        resolve(result);
    });
}
function CreateRecoveryOperationDetails(document) {
    return Sys.Helpers.Promise.Create(resolve => {
        const ruidex = document.GetUninheritedVars().GetValue_String("RUIDEX", 0);
        const record = Process.CreateTableRecordAsProcessAdmin("PurchasingFullBudgetRecoveryOperationDetails__");
        const vars = record.GetVars();
        vars.AddValue_String("ToolRuidEx__", Data.GetValue("RuidEx"), true);
        vars.AddValue_String("RequestTimestamp__", userActionResult.GetTimestamp(), true);
        vars.AddValue_String("DocumentRuidEx__", ruidex, true);
        vars.AddValue_Long("Status__", 0, true);
        record.Commit();
        if (record.GetLastError()) {
            throw new Error("Unable to save full recovery operation details. Details: " + record.GetLastErrorMessage());
        }
        resolve();
    });
}
function UpdateDocumentAction(document, availabilityInfo) {
    return Sys.Helpers.Promise.Create(resolve => {
        if (availabilityInfo.state !== 50) {
            let ok = false;
            const vars = document.GetUninheritedVars();
            const extVars = document.GetExternalVars();
            const ruidex = vars.GetValue_String("RUIDEX", 0);
            let updatableDocument;
            if (availabilityInfo.state === 70) {
                updatableDocument = document;
            }
            else {
                updatableDocument = Process.GetUpdatableTransportAsProcessAdmin(ruidex);
            }
            const varsToUpdate = updatableDocument.GetUninheritedVars();
            const extVarsToUpdate = updatableDocument.GetExternalVars();
            const str_recoveryData = extVars.GetValue_String("FullBudgetRecoveryData", 0);
            const recoveryData = (str_recoveryData && JSON.parse(str_recoveryData)) || {};
            // Keep original state values...
            if (Sys.Helpers.IsUndefined(recoveryData.originalState)) {
                recoveryData.originalState = availabilityInfo.state;
            }
            if (Sys.Helpers.IsUndefined(recoveryData.originalValidityDateTime)) {
                recoveryData.originalValidityDateTime = availabilityInfo.validityDateTime;
            }
            extVarsToUpdate.AddValue_String("FullBudgetRecoveryData", JSON.stringify(recoveryData), true);
            if (availabilityInfo.state >= 100) {
                varsToUpdate.AddValue_Long("State", 90, true);
                ok = !!updatableDocument.ResumeWithActionAsync("FullBudgetRecovery");
            }
            if (availabilityInfo.state === 70) {
                varsToUpdate.AddValue_String("RequestedActions", "approve|FullBudgetRecovery", true);
                varsToUpdate.AddValue_String("NeedValidation", "0", true);
                updatableDocument.Validate("Full budget recovery triggered");
                ok = updatableDocument.GetLastError() === 0;
            }
            else {
                ok = !!updatableDocument.ResumeWithAction("FullBudgetRecovery", false);
                if (!ok) {
                    updatableDocument = Process.GetUpdatableTransportAsProcessAdmin(ruidex);
                    ok = !!updatableDocument.ResumeWithActionAsync("FullBudgetRecovery");
                }
            }
            if (!ok) {
                throw new Error("Unable to update document action. Details: " + updatableDocument.GetLastErrorMessage());
            }
        }
        resolve();
    });
}
function SendEndOfLongActionNotification() {
    const str_toNotify = Variable.GetValueAsString("EndOfLongActionToNotify");
    const toNotify = Sys.Helpers.String.ToBoolean(str_toNotify);
    if (!toNotify) {
        return;
    }
    const ownerID = Lib.P2P.GetValidatorOrOwnerLogin();
    const owner = Users.GetUser(ownerID);
    const ownerEmail = owner.GetValue("EmailAddress");
    if (Sys.Helpers.IsEmpty(ownerEmail)) {
        Log.Error("No email address to notify user of the end of long action.");
        return;
    }
    const template = "FullRecoveryTool_Email_EndOfLongAction.htm";
    const email = Sys.EmailNotification.CreateEmail({
        emailAddress: ownerEmail,
        userId: ownerID,
        customTags: {
            "ValidationUrl": Data.GetValue("ValidationUrl")
        },
        template: template
    });
    try {
        Lib.P2P.EmailNotification.SendEmail(email, null, template);
    }
    catch (e) {
        Log.Error("Cannot send the end of long action notification. Details: " + e);
    }
}
function TriggerOnInvoicePost() {
    Log.Info(`[TriggerOnInvoicePost] Starting with filter "${Data.GetValue("Filter__")}"`);
    const queryPOForms = {
        table: "CDNAME#Purchase order V2",
        attributes: ["RuidEx", "OwnerId"],
        filter: Data.GetValue("Filter__"),
        additionalOptions: {
            searchInArchive: true,
            asAdmin: true
        }
    };
    let resumedOrderCount = 0;
    const failedPOForms = [];
    return Sys.GenericAPI.PromisedQuery(queryPOForms)
        .Then(queryPOFormsResult => {
        queryPOFormsResult.forEach(POForm => {
            var _a;
            let resumed = false;
            const user = Users.GetUser(POForm.OwnerId);
            if (!user) {
                failedPOForms.push({ ruidEx: POForm.RuidEx, ownerId: POForm.OwnerId });
            }
            else {
                resumed = !!((_a = Process.GetUpdatableTransportAsProcessAdmin(POForm.RuidEx)) === null || _a === void 0 ? void 0 : _a.ResumeWithActionAsync("OnInvoicePost"));
            }
            if (resumed) {
                resumedOrderCount++;
                Log.Verbose(`[TriggerOnInvoicePost] Order resumed: ${POForm.RuidEx}`);
            }
            else if (user) {
                Log.Error(`[TriggerOnInvoicePost] Unable to resume order: ${POForm.RuidEx}`);
            }
        });
        Log.Info(`[TriggerOnInvoicePost] ${resumedOrderCount} PO awakened`);
        if (failedPOForms.length > 0) {
            Log.Error(`[TriggerOnInvoicePost] ${failedPOForms.length} PO forms failed because of unexisting users: ${JSON.stringify(failedPOForms)}`);
        }
        Lib.CommonDialog.NextAlert.Define("_PoAwakeningTitle", Language.Translate("_PoAwakeningMsg", false, resumedOrderCount), { isError: false });
        Process.PreventApproval();
    })
        .Catch(reason => Log.Error(`[TriggerOnInvoicePost] An unexpected error occurred while querying purchase order records: ${reason}`));
}
function Main() {
    if (currentName === "Terminate") {
        Log.Info("Terminating the full recovery tool instance");
    }
    else if (currentName === "save") {
        Log.Info("Saving the full recovery tool instance");
    }
    else if (currentName === "WakeUpPO") {
        TriggerOnInvoicePost();
    }
    else {
        const stepActions = actionsByStep[currentStep];
        if (stepActions) {
            const stepAction = stepActions[currentName];
            if (stepAction) {
                userActionResult = InitUserActionResult(currentStep, currentName);
                stepAction.fn();
                if (stepAction.longAction) {
                    SendEndOfLongActionNotification();
                }
            }
            else {
                Log.Error(`Action ${currentName} not supported by step ${currentStep}`);
            }
        }
        else {
            Log.Error("Unknown step " + currentStep);
        }
        if (userActionResult) {
            userActionResult.Serialize();
        }
        Process.PreventApproval();
    }
    Sys.Helpers.TryCallFunction("Lib.FullBudgetRecoveryTool.Customization.Server.OnValidationScriptEnd");
}
if (typeof NO_MAIN_CALL === "undefined") {
    Main();
}
//# sourceMappingURL=validationscript.js.map