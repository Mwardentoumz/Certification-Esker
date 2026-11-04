"use strict";
// Nothing to save in this process... (no Save button)
ProcessInstance.SetSilentChange(true);
let steps = [
    "PR",
    "PO",
    "GR",
    "Invoice",
    "Budget"
];
let currentStep = Controls.CurrentStep__.GetValue() || steps[0];
let currentStepIdx = steps.indexOf(currentStep);
let stepLayouts = GetStepLayouts();
let pendingRecoveryRefresher = CreateAsyncTask(5000);
let docLinkCache = {};
let userActionResults = GetUserActionHistoryResults();
Lib.CommonDialog.NextAlert.Show({});
Lib.CommonDialog.NextAlert.Reset();
InitLayout();
///////////////////
function InitLayout() {
    Controls.CurrentStep__.Hide();
    Controls.CheckTable__.SetWidth("100%");
    Controls.CheckTable__.SetExtendableColumn("CheckDetails__");
    Controls.CheckTable__.SetAtLeastOneLine(false);
    Controls.CheckTable__.CheckLevel__.Hide();
    Controls.CheckTable__.OnRefreshRow = OnRefreshRowCheckTable;
    Controls.CheckTable__.CheckDocRuidEx__.OnClick = OnClickDocRuidEx;
    Controls.TriggerOnInvoicePost.OnClick = OnClickTriggerOnInvoicePost;
    Controls.RecoveryRequestErrorsTable__.SetWidth("100%");
    Controls.RecoveryRequestErrorsTable__.SetExtendableColumn("RecoveryRequestErrorDetails__");
    Controls.RecoveryRequestErrorsTable__.SetAtLeastOneLine(false);
    Controls.RecoveryRequestErrorsTable__.OnRefreshRow = OnRefreshRowRecoveryRequestErrorsTable;
    Controls.RecoveryRequestErrorsTable__.RecoveryRequestErrorDocRuidEx__.OnClick = OnClickDocRuidEx;
    Controls.RecoveryErrorsTable__.SetWidth("100%");
    Controls.RecoveryErrorsTable__.SetExtendableColumn("RecoveryErrorDetails__");
    Controls.RecoveryErrorsTable__.SetAtLeastOneLine(false);
    Controls.RecoveryErrorsTable__.OnRefreshRow = OnRefreshRowRecoveryErrorsTable;
    Controls.RecoveryErrorsTable__.RecoveryErrorDocRuidEx__.OnClick = OnClickDocRuidEx;
    Controls.RecomputeBudgetTable__.SetWidth("100%");
    Controls.RecomputeBudgetTable__.SetExtendableColumn("RecomputeErrorDetails__");
    Controls.RecomputeBudgetTable__.SetAtLeastOneLine(false);
    Controls.RecomputeBudgetTable__.OnRefreshRow = OnRefreshRowRecomputeBudgetTable;
    Controls.PendingRecoveriesTable__.SetWidth("100%");
    Controls.PendingRecoveriesTable__.SetAtLeastOneLine(false);
    Controls.PendingRecoveriesTable__.OnRefreshRow = OnRefreshRowPendingRecoveriesTable;
    Controls.PendingRecoveriesTable__.PendingRecoveryDocRuidEx__.OnClick = OnClickDocRuidEx;
    Controls.BudgetIDs__.OnChange = OnChangeBudgetIDs;
    Controls.UserActionHistory__.OnChange = OnChangeUserActionHistory;
    Controls.Previous.OnClick = OnClickPrevious;
    Controls.Next.OnClick = OnClickNext;
    Controls.CheckBudgetButton.OnClick = OnClickCheckBudgetButton;
    Controls.RecoverBudgetButton.OnClick = OnClickRecoverBudgetButton;
    Controls.RecomputeBudgetButton.OnClick = OnClickRecomputeBudgetButton;
    // Temporarily this button is hidden. In readonly mode, we cannot change the user Actions history combo...
    Controls.TerminateButton.Hide();
    Controls.TerminateButton.OnClick = OnClickTerminateButton;
    Object.keys(stepLayouts).forEach(function (step) {
        let stepLayout = stepLayouts[step];
        stepLayout.Init();
        stepLayout.panels.forEach(function (panel) {
            Controls[panel].Hide();
        });
        stepLayout.buttons.forEach(function (button) {
            Controls[button].Hide();
        });
    });
    UpdateStepLayout(currentStep);
}
function GetStepLayouts() {
    return {
        PR: CreateDocumentStepLayout("PR"),
        PO: CreateDocumentStepLayout("PO"),
        GR: CreateDocumentStepLayout("GR"),
        Invoice: CreateInvoiceStepLayout(),
        Budget: CreateBudgetStepLayout()
    };
}
function UpdateStepLayout(to, from) {
    let fromLayout = from && stepLayouts[from];
    let toLayout = stepLayouts[to];
    if (fromLayout) {
        fromLayout.panels.forEach(function (panel) {
            Controls[panel].Hide();
        });
        fromLayout.buttons.forEach(function (button) {
            Controls[button].Hide();
        });
        fromLayout.HideLayout && fromLayout.HideLayout();
    }
    toLayout.DisplayLayout && toLayout.DisplayLayout();
    // disabling previous & next buttons
    Controls.Previous.SetDisabled(currentStepIdx === 0);
    Controls.Next.SetDisabled(currentStepIdx === (steps.length - 1));
    Controls.CurrentStep__.SetValue(to);
    Controls.CurrentStepDesc__.SetLabel(to);
}
function OnClickCheckBudgetButton() {
    Variable.SetValueAsString("RuidexList", "");
    Variable.SetValueAsString("Results", "");
    Variable.SetValueAsString("RecoverbudgetResult", "");
    DisplayLongActionPopup("CheckBudget");
}
function OnClickRecoverBudgetButton() {
    Variable.SetValueAsString("RuidexList", "");
    Variable.SetValueAsString("Results", "");
    Variable.SetValueAsString("RecoverbudgetResult", "");
    DisplayLongActionPopup("RecoverBudget");
}
function OnClickTriggerOnInvoicePost() {
    DisplayLongActionPopup("WakeUpPO");
}
function OnClickRecomputeBudgetButton() {
    DisplayLongActionPopup("RecomputeBudget");
}
function OnClickTerminateButton() {
    ProcessInstance.Approve("Terminate");
}
function OnClickPrevious() {
    // strange behavior (when disabling design mode for ex.)
    if (currentStepIdx === 0) {
        Controls.Previous.SetDisabled(true);
    }
    else {
        let fromStep = currentStep;
        currentStepIdx--;
        currentStep = steps[currentStepIdx];
        UpdateStepLayout(currentStep, fromStep);
    }
}
function OnClickNext() {
    // strange behavior (when disabling design mode for ex.)
    if (currentStepIdx === (steps.length - 1)) {
        Controls.Next.SetDisabled(true);
    }
    else {
        let fromStep = currentStep;
        currentStepIdx++;
        currentStep = steps[currentStepIdx];
        UpdateStepLayout(currentStep, fromStep);
    }
}
function OnChangeUserActionHistory() {
    let stepLayout = stepLayouts[currentStep];
    if (stepLayout && stepLayout.OnChangeUserActionHistory) {
        stepLayout.OnChangeUserActionHistory();
    }
}
function GetUserActionHistoryResults() {
    let userActionResults = Variable.GetValueAsString("UserActionResults");
    return (userActionResults && JSON.parse(userActionResults)) || {};
}
function FillCheckBudgetTable(table, results, level) {
    Object.keys(results).forEach(function (ruidEx) {
        let resultsForDoc = results[ruidEx];
        resultsForDoc.forEach(function (result) {
            table.AddItem(false);
            let newItem = table.GetItem(table.GetItemCount() - 1);
            newItem.SetValue("CheckDocRuidEx__", ruidEx);
            let translatedResult = TranslateResult(result);
            newItem.SetValue("CheckType__", translatedResult.type);
            newItem.SetValue("CheckDetails__", translatedResult.details);
            newItem.SetValue("CheckLevel__", level);
        });
    });
}
function FillCheckBudgetResultFields(step, userActionResult) {
    let resultOfCheckBudget = userActionResult.CheckBudget || {
        errors: {},
        warnings: {},
        infos: {},
        docCount: 0,
        docProcessed: 0,
        docInErrorCount: 0,
        docInWarningCount: 0,
        errorCount: 0,
        warningCount: 0
    };
    Controls.TotalCheckCount__.SetValue(resultOfCheckBudget.docCount);
    if (resultOfCheckBudget.docCount != resultOfCheckBudget.docProcessed) {
        Controls.TotalCheckCount__.SetWarning(`${resultOfCheckBudget.docProcessed} processed / ${resultOfCheckBudget.docCount} found`);
    }
    else {
        Controls.TotalCheckCount__.SetWarning("");
    }
    Controls.CheckDocCountInError__.SetValue(resultOfCheckBudget.docInErrorCount);
    Controls.CheckDocCountInWarning__.SetValue(resultOfCheckBudget.docInWarningCount);
    Controls.CheckCountError__.SetValue(resultOfCheckBudget.errorCount);
    Controls.CheckCountWarning__.SetValue(resultOfCheckBudget.warningCount);
    Controls.CheckTable__.SetItemCount(0);
    Controls.CheckTable__.Hide(true);
    Controls.CheckTable__.Defer("OnPostRefresh", function () {
        Controls.CheckTable__.Hide(false);
    });
    FillCheckBudgetTable(Controls.CheckTable__, resultOfCheckBudget.errors || {}, "error");
    FillCheckBudgetTable(Controls.CheckTable__, resultOfCheckBudget.warnings || {}, "warning");
    FillCheckBudgetTable(Controls.CheckTable__, resultOfCheckBudget.infos || {}, "info");
    Controls.CheckBudgetResultSummaryPanel.Hide(!userActionResult.CheckBudget);
    Controls.CheckBudgetResultDetailsPanel.Hide(Controls.CheckTable__.GetItemCount() === 0);
}
function FillRecoverBudgetResultFields(step, userActionResult) {
    pendingRecoveryRefresher.Stop();
    Controls.RecoveryRequestResultSummaryPanel.Hide();
    Controls.RecoveryRequestResultDetailsPanel.Hide();
    Controls.RecoverBudgetSummaryResultPanel.Hide();
    Controls.RecoverBudgetDetailsResultPanel.Hide();
    Controls.PendingRecoveryBudgetPanel.Hide();
    if (userActionResult.RecoverBudget) {
        Controls.RecoveryRequestCount__.SetValue(userActionResult.RecoverBudget.requestCount);
        Controls.RecoveryAbortedRequestCount__.SetValue(userActionResult.RecoverBudget.errors ? Object.keys(userActionResult.RecoverBudget.errors).length : 0);
        Controls.RecoveryRequestErrorsTable__.SetItemCount(0);
        Controls.RecoveryRequestErrorsTable__.Hide(true);
        Controls.RecoveryRequestErrorsTable__.Defer("OnPostRefresh", function () {
            Controls.RecoveryRequestErrorsTable__.Hide(false);
        });
        Object.keys(userActionResult.RecoverBudget.errors).forEach(function (ruidEx) {
            let error = userActionResult.RecoverBudget.errors[ruidEx];
            Controls.RecoveryRequestErrorsTable__.AddItem(false);
            let newItem = Controls.RecoveryRequestErrorsTable__.GetItem(Controls.RecoveryRequestErrorsTable__.GetItemCount() - 1);
            newItem.SetValue("RecoveryRequestErrorDocRuidEx__", ruidEx);
            newItem.SetValue("RecoveryRequestErrorDetails__", error);
        });
        Controls.RecoveryRequestResultSummaryPanel.Hide(false);
        Controls.RecoveryRequestResultDetailsPanel.Hide(Controls.RecoveryRequestErrorsTable__.GetItemCount() === 0);
        if (userActionResult.RecoverBudget.requestCount > 0) {
            Controls.RecoverBudgetSummaryResultPanel.Hide(false);
            Controls.PendingRecoveryBudgetPanel.Hide(false);
            let toolRuidEx = Data.GetValue("RuidEx");
            pendingRecoveryRefresher.Start(function () {
                let filter = "(&(ToolRuidEx__=" + toolRuidEx + ")(RequestTimestamp__=" + userActionResult.timestamp + ")(Status__!=1))";
                let options = {
                    table: "PurchasingFullBudgetRecoveryOperationDetails__",
                    filter: filter,
                    attributes: ["ToolRuidEx__", "RequestTimestamp__", "DocumentRuidEx__", "Status__", "Details__"],
                    sortOrder: "DocumentRuidEx__ ASC",
                    maxRecords: "FULL_RESULT"
                };
                return Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    let pendingCount = 0;
                    let errorsCount = 0;
                    Controls.RecoveryErrorsTable__.SetItemCount(0);
                    Controls.RecoveryErrorsTable__.Hide(true);
                    Controls.RecoveryErrorsTable__.Defer("OnPostRefresh", function () {
                        Controls.RecoveryErrorsTable__.Hide(false);
                    });
                    Controls.PendingRecoveriesTable__.SetItemCount(0);
                    Controls.PendingRecoveriesTable__.Hide(true);
                    Controls.PendingRecoveriesTable__.Defer("OnPostRefresh", function () {
                        Controls.PendingRecoveriesTable__.Hide(false);
                    });
                    queryResults.forEach(function (r) {
                        if (r.Status__ == 2) {
                            errorsCount++;
                            Controls.RecoveryErrorsTable__.AddItem(false);
                            let newItem = Controls.RecoveryErrorsTable__.GetItem(errorsCount - 1);
                            newItem.SetValue("RecoveryErrorDocRuidEx__", r.DocumentRuidEx__);
                            newItem.SetValue("RecoveryErrorDetails__", r.Details__);
                        }
                        else if (r.Status__ == 0) {
                            pendingCount++;
                            Controls.PendingRecoveriesTable__.AddItem(false);
                            let newItem = Controls.PendingRecoveriesTable__.GetItem(pendingCount - 1);
                            newItem.SetValue("PendingRecoveryDocRuidEx__", r.DocumentRuidEx__);
                        }
                    });
                    Controls.PendingRecoveryCount__.SetValue(pendingCount);
                    Controls.RecoveryInSuccessCount__.SetValue(userActionResult.RecoverBudget.requestCount - pendingCount - errorsCount);
                    Controls.RecoveryInErrorCount__.SetValue(errorsCount);
                    Controls.RecoverBudgetDetailsResultPanel.Hide(errorsCount === 0);
                    return pendingCount > 0;
                })
                    .Catch(function (error) {
                    Log.Error("An error occured when requesting the pending full recovery operation details. Details: " + error.toString());
                    return false;
                });
            });
        }
    }
}
function CreateAsyncTask(delay) {
    let timeoutID = null;
    let taskFn = null;
    function RunTask() {
        taskFn().Then(function (_continue) {
            if (_continue) {
                timeoutID = setTimeout(RunTask, delay);
            }
            else {
                timeoutID = null;
            }
        });
    }
    return {
        Start: function (_taskFn) {
            this.Stop();
            taskFn = _taskFn;
            RunTask();
        },
        Stop: function () {
            taskFn = null;
            if (timeoutID !== null) {
                clearTimeout(timeoutID);
                timeoutID = null;
            }
        }
    };
}
function OnRefreshRowCheckTable(index) {
    let row = Controls.CheckTable__.GetRow(index);
    let level = row.CheckLevel__.GetValue();
    if (level === "info") {
        row.AddStyle("highlight-info");
    }
    else {
        row.RemoveStyle("highlight-info");
    }
    if (level === "warning") {
        row.AddStyle("highlight-warning");
    }
    else {
        row.RemoveStyle("highlight-warning");
    }
    if (level === "error") {
        row.AddStyle("highlight-danger");
    }
    else {
        row.RemoveStyle("highlight-danger");
    }
    row.CheckDocRuidEx__.DisplayAs({ type: "Link" });
}
function OnRefreshRowRecoveryRequestErrorsTable(index) {
    let row = Controls.RecoveryRequestErrorsTable__.GetRow(index);
    row.RecoveryRequestErrorDocRuidEx__.DisplayAs({ type: "Link" });
    row.AddStyle("highlight-danger");
}
function OnRefreshRowRecoveryErrorsTable(index) {
    let row = Controls.RecoveryErrorsTable__.GetRow(index);
    row.RecoveryErrorDocRuidEx__.DisplayAs({ type: "Link" });
    row.AddStyle("highlight-danger");
}
function OnRefreshRowRecomputeBudgetTable(index) {
    let row = Controls.RecomputeBudgetTable__.GetRow(index);
    row.AddStyle("highlight-danger");
}
function OnRefreshRowPendingRecoveriesTable(index) {
    let row = Controls.PendingRecoveriesTable__.GetRow(index);
    row.PendingRecoveryDocRuidEx__.DisplayAs({ type: "Link" });
    row.AddStyle("highlight-warning");
}
function CreateDocumentStepLayout(step) {
    let buttons = [
        "CheckBudgetButton",
        "RecoverBudgetButton"
    ];
    if (step === "PO") {
        buttons.push("TriggerOnInvoicePost");
    }
    return {
        userActionResultHistory: null,
        userActionResultName: null,
        userActionResult: null,
        panels: [
            "UserActionHistoryPanel",
            "SelectionMethodPanel",
            "CheckBudgetResultSummaryPanel",
            "CheckBudgetResultDetailsPanel",
            "RecoveryRequestResultSummaryPanel",
            "RecoveryRequestResultDetailsPanel",
            "RecoverBudgetSummaryResultPanel",
            "RecoverBudgetDetailsResultPanel",
            "PendingRecoveryBudgetPanel"
        ],
        buttons,
        Init: function () {
            this.userActionResultHistory = (userActionResults[step] && Object.keys(userActionResults[step]).reverse()) || [];
            this.userActionResultName = this.userActionResultHistory[0];
            this.userActionResult = this.userActionResultName && userActionResults[step][this.userActionResultName];
        },
        DisplayLayout: function () {
            Controls.UserActionHistory__.SetText(this.userActionResultHistory.join("\n"));
            this.userActionResultName = this.userActionResultName || (this.userActionResultHistory.length > 0 && this.userActionResultHistory[0]);
            Controls.SelectionMethod__.Hide(false);
            if (this.userActionResultName) {
                Controls.UserActionHistory__.SetValue(this.userActionResultName);
                this.OnChangeUserActionHistory();
            }
            else {
                this.DisplayPanels();
            }
            if (!ProcessInstance.isReadOnly) {
                this.buttons.forEach(function (button) {
                    Controls[button].Hide(false);
                });
            }
        },
        DisplayPanels: function () {
            Controls.UserActionHistoryPanel.Hide(!this.userActionResult);
            Controls.SelectionMethodPanel.Hide(false);
        },
        OnChangeUserActionHistory: function () {
            this.userActionResultName = Controls.UserActionHistory__.GetValue();
            this.userActionResult = userActionResults[step][this.userActionResultName];
            this.DisplayPanels();
            if (this.userActionResult.SelectionMethod) {
                Controls.SelectionMethod__.SetValue(this.userActionResult.SelectionMethod.method);
                Controls.Filter__.SetValue(this.userActionResult.SelectionMethod.filter);
            }
            else {
                Controls.SelectionMethod__.SetValue("_Doc");
                Controls.Filter__.SetValue("MsnEx=*");
            }
            FillCheckBudgetResultFields(step, this.userActionResult);
            FillRecoverBudgetResultFields(step, this.userActionResult);
        }
    };
}
function CreateInvoiceStepLayout() {
    let stepLayout = CreateDocumentStepLayout("Invoice");
    stepLayout.DisplayLayout = Sys.Helpers.Wrap(stepLayout.DisplayLayout, function (originalFn) {
        originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
        Controls.SelectionMethod__.Hide();
    });
    return stepLayout;
}
function CreateBudgetStepLayout() {
    return {
        userActionResultHistory: null,
        userActionResultName: null,
        userActionResult: null,
        panels: [
            "UserActionHistoryPanel",
            "BudgetIDListPanel",
            "RecomputeBudgetResultSummaryPanel",
            "RecomputeBudgetResultDetailsPanel"
        ],
        buttons: [
            "RecomputeBudgetButton"
        ],
        Init: function () {
            this.userActionResultHistory = (userActionResults.Budget && Object.keys(userActionResults.Budget).reverse()) || [];
            this.userActionResultName = this.userActionResultHistory[0];
            this.userActionResult = this.userActionResultName && userActionResults.Budget[this.userActionResultName];
        },
        DisplayLayout: function () {
            Controls.UserActionHistory__.SetText(this.userActionResultHistory.join("\n"));
            this.userActionResultName = this.userActionResultName || (this.userActionResultHistory.length > 0 && this.userActionResultHistory[0]);
            if (this.userActionResultName) {
                Controls.UserActionHistory__.SetValue(this.userActionResultName);
                this.OnChangeUserActionHistory();
            }
            else {
                this.SetDefaultBudgetIDs();
                this.DisplayPanels();
            }
            if (!ProcessInstance.isReadOnly) {
                this.buttons.forEach(function (button) {
                    Controls[button].Hide(false);
                });
            }
        },
        DisplayPanels: function () {
            Controls.UserActionHistoryPanel.Hide(!this.userActionResult);
            Controls.BudgetIDListPanel.Hide(false);
            Controls.BudgetIDs__.SetRequired(true);
        },
        HideLayout: function () {
            Controls.BudgetIDs__.SetRequired(false);
        },
        OnChangeUserActionHistory: function () {
            this.userActionResultName = Controls.UserActionHistory__.GetValue();
            this.userActionResult = userActionResults.Budget[this.userActionResultName];
            this.DisplayPanels();
            if (this.userActionResult.RecomputeBudget) {
                Controls.RecomputeBudgetResultSummaryPanel.Hide(false);
                let budgetIDs = this.userActionResult.RecomputeBudget.budgetIDs;
                Controls.BudgetIDs__.SetValue(budgetIDs.join("\n"));
                Controls.RecomputeBudgetTable__.SetItemCount(0);
                Controls.RecomputeBudgetTable__.Hide(true);
                Controls.RecomputeBudgetTable__.Defer("OnPostRefresh", function () {
                    Controls.RecomputeBudgetTable__.Hide(false);
                });
                Object.keys(this.userActionResult.RecomputeBudget.errors).forEach(function (budgetID) {
                    let error = this.userActionResult.RecomputeBudget.errors[budgetID];
                    Controls.RecomputeBudgetTable__.AddItem(false);
                    let newItem = Controls.RecomputeBudgetTable__.GetItem(Controls.RecomputeBudgetTable__.GetItemCount() - 1);
                    newItem.SetValue("RecomputeBudgetID__", budgetID);
                    let translatedResult = TranslateResult(error);
                    newItem.SetValue("RecomputeErrorType__", translatedResult.type);
                    newItem.SetValue("RecomputeErrorDetails__", translatedResult.details);
                }, this);
                Controls.TotalRecomputeCount__.SetValue(budgetIDs.length);
                Controls.RecomputeCountError__.SetValue(Controls.RecomputeBudgetTable__.GetItemCount());
                Controls.RecomputeBudgetResultDetailsPanel.Hide(Controls.RecomputeBudgetTable__.GetItemCount() === 0);
            }
            else {
                this.SetDefaultBudgetIDs();
            }
        },
        SetDefaultBudgetIDs: function () {
            // fill with the impacted
            let str_impactedBudgetIDs = Variable.GetValueAsString("ImpactedBudgetIDs");
            let impactedBudgetIDs = (str_impactedBudgetIDs && JSON.parse(str_impactedBudgetIDs)) || [];
            Controls.BudgetIDs__.SetValue(impactedBudgetIDs.join("\n"));
        }
    };
}
function OnChangeBudgetIDs() {
    let str_budgetIDs = Controls.BudgetIDs__.GetValue();
    let budgetIDs = str_budgetIDs
        .replace(/(,|\||;|\r?\n)/gm, "\n")
        .split("\n");
    budgetIDs = budgetIDs
        .map(function (budgetID) {
        return Sys.Helpers.IsString(budgetID) && budgetID.trim();
    })
        .filter(function (budgetID) {
        return !!budgetID;
    });
    Controls.BudgetIDs__.SetValue(budgetIDs.join("\n"));
}
function DisplayLongActionPopup(actionName) {
    let str_remChoice = Variable.GetValueAsString("LongActionPopupRememberedChoice");
    let remChoice = Sys.Helpers.String.ToBoolean(str_remChoice);
    if (!remChoice) {
        Popup.Dialog("_LongActionPopupTitle", null, FillPopup, null, null, OnEventPopup);
    }
    else {
        let str_toNotify = Variable.GetValueAsString("EndOfLongActionToNotify");
        let toNotify = Sys.Helpers.String.ToBoolean(str_toNotify);
        // Workaround, to avoid store tables data in database...
        ResetDataTables();
        if (toNotify) {
            ProcessInstance.ApproveAsynchronous(actionName);
        }
        else {
            ProcessInstance.Approve(actionName);
        }
    }
    ////
    function FillPopup(dialog) {
        let msgCtrl = dialog.AddDescription("ctrlMessage", null, 466);
        msgCtrl.SetText("_LongActionPopupMessage");
        let checkCtrl = dialog.AddCheckBox("ctrlRememberChoice");
        checkCtrl.SetText("_LongActionPopupRememberChoice");
        dialog.HideDefaultButtons();
        dialog.AddButton("ctrlYes", "_Yes").SetSubmitStyle();
        dialog.AddButton("ctrlNo", "_No");
    }
    function OnEventPopup(dialog, tabID, event, control) {
        if (event === "OnClick") {
            let ctrlName = control.GetName();
            let isCtrlYes = ctrlName === "ctrlYes";
            if (isCtrlYes || ctrlName === "ctrlNo") {
                let rememberChoice = dialog.GetControl("ctrlRememberChoice").GetValue();
                Variable.SetValueAsString("LongActionPopupRememberedChoice", !!rememberChoice);
                Variable.SetValueAsString("EndOfLongActionToNotify", isCtrlYes);
                if (isCtrlYes) {
                    ProcessInstance.ApproveAsynchronous(actionName);
                }
                else {
                    ProcessInstance.Approve(actionName);
                }
            }
            else {
                dialog.Cancel();
            }
        }
    }
}
function TranslateResult(result) {
    let ret = {
        type: "",
        details: ""
    };
    if (result.type) {
        let splitType = result.type.split("|");
        ret.type = Language.Translate(splitType[0], false);
        if (splitType.length > 1 || result.details) {
            let args = [
                splitType.length > 1 ? splitType[1] : (splitType[0] + "_DETAILS"),
                false
            ];
            if (result.details) {
                let details = Sys.Helpers.IsArray(result.details) ? result.details : [result.details];
                args = args.concat(details);
            }
            ret.details = Language.Translate.apply(Language, args);
        }
    }
    return ret;
}
function OnClickDocRuidEx() {
    let ruidEx = this.GetValue();
    OpenDocumentViaLink(ruidEx);
}
function OpenDocumentViaLink(ruidEx) {
    let docLink = docLinkCache[ruidEx];
    if (!docLink) {
        let ruidExParts = ruidEx.split(".");
        let options = {
            table: ruidExParts[0],
            filter: "MsnEx=" + ruidExParts[1],
            attributes: ["ValidationURL"]
        };
        docLink = docLinkCache[ruidEx] = {
            promise: Sys.GenericAPI
                .PromisedQuery(options)
                .Then(function (queryResults) {
                if (queryResults.length === 0) {
                    throw "Cannot found document";
                }
                return queryResults[0].ValidationURL;
            })
        };
    }
    docLink.promise
        .Then(function (url) {
        Process.OpenLink(url + "&OnQuit=Close");
    })
        .Catch(function (error) {
        Log.Error("Cannot open document " + ruidEx + ". Details: " + error);
        Popup.Alert(Language.Translate("_OpenDocumentViaLinkErrorMsg", false, ruidEx), true, null, "_OpenDocumentViaLinkErrorTitle");
    });
}
function ResetDataTables() {
    Controls.CheckTable__.SetItemCount(0);
    Controls.RecoveryRequestErrorsTable__.SetItemCount(0);
    Controls.RecoveryErrorsTable__.SetItemCount(0);
    Controls.RecomputeBudgetTable__.SetItemCount(0);
    Controls.PendingRecoveriesTable__.SetItemCount(0);
}
//# sourceMappingURL=customscript.js.map