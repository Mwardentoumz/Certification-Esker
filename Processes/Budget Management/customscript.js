"use strict";
var CustomScript;
(function (CustomScript) {
    /**
     * Manage the General step
     */
    const generalStep = {
        panels: [Controls.GeneralPane],
        icon: "fa-th-list",
        title: "_GeneralStep",
        helpId: 5016,
        onStart: function () {
            InitButtons(0);
            Controls.User__.SetValue(User.loginId);
            Controls.UserName__.SetValue(User.fullName);
            Controls.Reason__.SetReadOnly(false);
            Controls.Operation__.SetReadOnly(Controls.Operation__.GetAvailableValues().length <= 1);
            Controls.Operation__.OnChange = function () {
                let title = "_Operation" + Controls.Operation__.GetValue() + "Step";
                let index = Sys.Wizard.Wizard.GetPanelIndex(title);
                Sys.Wizard.Wizard.SetTranslatedTitle(index, Language.Translate(title));
            };
        },
        onQuit: function () {
            return true;
        }
    };
    /**
     * Manage the Import step
     */
    const operationImportStep = {
        panels: [Controls.ImportPane, Controls.AttachmentsPane],
        icon: "fa-cog",
        title: "_OperationImportStep",
        helpId: 5017,
        isVisible: function () {
            return Controls.Operation__.GetValue() === "Import";
        },
        onStart: function () {
            InitButtons(1);
            Controls.Run.SetDisabled(Attach.GetNbAttach() == 0);
            Controls.Run.OnClick = operationImportStep.Run;
            Controls.AttachmentsPane.AllowChangeOrUploadReferenceDocument(true);
            Controls.AttachmentsPane.OnDocumentDeleted = function () {
                Controls.Next.Hide(true);
                Controls.Run.SetDisabled(true);
            };
        },
        onQuit: function () {
            Controls.AttachmentsPane.AllowChangeOrUploadReferenceDocument(false);
            return true;
        },
        Run: function () {
            function OnConfirm() {
                Variable.SetValueAsString("currentStep", Sys.Wizard.Wizard.GetNextStep());
                ProcessInstance.Approve("ImportCSV");
            }
            Popup.Confirm("_ImportCSV_explanation", false, OnConfirm, null, "_ImportCSV_confirmation");
            return false;
        }
    };
    /**
     * Manage the Delete step
     */
    const operationDeleteStep = {
        panels: [Controls.DeletePane],
        icon: "fa-cog",
        title: "_OperationDeleteStep",
        helpId: 5021,
        isVisible: function () {
            return Controls.Operation__.GetValue() === "Delete";
        },
        onStart: function () {
            InitButtons(1);
            Controls.Run.SetDisabled(!operationDeleteStep.IsRunnable());
            Controls.Run.OnClick = operationDeleteStep.Run;
            Lib.Spending.Budget.Management.mixin.ForEachActionField("Delete", (fieldBy, budgetFields) => {
                Controls[fieldBy].OnChange = function () {
                    operationDeleteStep.Select(fieldBy);
                };
                Lib.Spending.Budget.Management.mixin.ForEachBudgetField(budgetFields, (field, budgetTableField) => {
                    Controls[field].SetRequired(true);
                    Controls[field].SetAllowTableValuesOnly(true);
                    Controls[field].OnChange = function () {
                        QueryBudgetLinesImpacted("Delete", budgetFields);
                    };
                });
            });
            operationDeleteStep.Select();
        },
        onQuit: function () {
            ResetBudgetFields("Delete");
            return true;
        },
        Select: function (by) {
            Lib.Spending.Budget.Management.mixin.ForEachActionField("Delete", (fieldBy, budgetFields) => {
                if (!by && Controls[fieldBy].IsSelected(0)) {
                    by = fieldBy;
                }
                let unselect = fieldBy !== by;
                if (unselect) {
                    Controls[fieldBy].Unselect();
                }
                else {
                    QueryBudgetLinesImpacted("Delete", budgetFields);
                }
                Lib.Spending.Budget.Management.mixin.ForEachBudgetField(budgetFields, (field, budgetTableField) => {
                    Controls[field].Hide(unselect);
                });
                Controls.SpacerAfterBudgetID__.Hide(by !== "Delete_ByBudgetID__");
            });
        },
        IsRunnable: function () {
            return Controls.Delete_BudgetLinesImpacted__.GetValue() > 0;
        },
        Run: function () {
            function OnConfirm() {
                ResetBudgetFields("Delete");
                Variable.SetValueAsString("currentStep", Sys.Wizard.Wizard.GetNextStep());
                Attach.RemoveAttach(0);
                ProcessInstance.Approve("Delete");
            }
            Popup.Confirm(["_Delete_explanation", Controls.Delete_BudgetLinesImpacted__.GetValue().toString()], false, OnConfirm, null, "_Delete_confirmation");
            return false;
        }
    };
    /**
     * Manage the Export step
     */
    const operationExportStep = {
        panels: [Controls.ExportPane],
        icon: "fa-cog",
        title: "_OperationExportStep",
        helpId: 5018,
        isVisible: function () {
            return Controls.Operation__.GetValue() === "Export";
        },
        onStart: function () {
            InitButtons(1);
            Controls.Run.SetDisabled(!operationExportStep.IsRunnable());
            Controls.Run.OnClick = operationExportStep.Run;
            Lib.Spending.Budget.Management.mixin.ForEachActionField("Export", (fieldBy, budgetFields) => {
                Lib.Spending.Budget.Management.mixin.ForEachBudgetField(budgetFields, (field, budgetTableField) => {
                    Controls[field].SetRequired(true);
                    Controls[field].SetAllowTableValuesOnly(true);
                    Controls[field].OnChange = function () {
                        QueryBudgetLinesImpacted("Export", budgetFields);
                    };
                });
            });
        },
        onQuit: function () {
            ResetBudgetFields("Export");
            return true;
        },
        IsRunnable: function () {
            return Controls.Export_BudgetLinesImpacted__.GetValue() > 0;
        },
        Run: function () {
            ResetBudgetFields("Export");
            Variable.SetValueAsString("currentStep", Sys.Wizard.Wizard.GetNextStep());
            Attach.RemoveAttach(0);
            ProcessInstance.Approve("Export");
        }
    };
    /**
     * Manage the Revise step
     */
    const operationReviseStep = {
        panels: [Controls.RevisePane],
        icon: "fa-cog",
        title: "_OperationReviseStep",
        helpId: 5019,
        isVisible: function () {
            return Controls.Operation__.GetValue() === "Revise";
        },
        onStart: function () {
            InitButtons(1);
            Controls.Run.SetDisabled(!operationReviseStep.IsRunnable());
            Controls.Run.OnClick = operationReviseStep.Run;
            Lib.Spending.Budget.Management.mixin.ForEachActionField("Revise", (fieldBy, budgetFields) => {
                Lib.Spending.Budget.Management.mixin.ForEachBudgetField(budgetFields, (field, budgetTableField) => {
                    Controls[field].SetRequired(true);
                    Controls[field].SetAllowTableValuesOnly(true);
                    Controls[field].OnChange = function () {
                        operationReviseStep.QueryBudget(budgetFields);
                    };
                });
            });
            Controls.NewBudget__.OnChange = function () {
                let newBudget = Controls.NewBudget__.GetValue();
                if (!Sys.Helpers.IsEmpty(newBudget)) {
                    let budget = Controls.Budget__.GetValue();
                    let availableAfterRevision = newBudget - budget + Controls.AvailableBeforeRevision__.GetValue();
                    Controls.AvailableAfterRevision__.SetValue(availableAfterRevision);
                    Controls.AvailableAfterRevision__.SetWarning(availableAfterRevision < 0 ? "_Available budget after revision is negative" : "");
                    Controls.Run.SetDisabled(budget === newBudget);
                }
                else {
                    Controls.AvailableAfterRevision__.SetValue(null);
                    Controls.Run.SetDisabled(true);
                }
            };
        },
        onQuit: function () {
            ResetBudgetFields("Revise");
            Controls.NewBudget__.SetRequired(false);
            Controls.NewBudget__.SetError("");
            return true;
        },
        IsRunnable: function () {
            return !Sys.Helpers.IsEmpty(Controls.NewBudget__.GetValue());
        },
        QueryBudget: function (budgetFields) {
            if (IsQueryable(budgetFields)) {
                let options = {
                    table: "PurchasingBudget__",
                    filter: Lib.Spending.Budget.Management.mixin.MakeFilter(budgetFields),
                    attributes: ["BudgetID__", "CompanyCode__", "Description__", "PeriodCode__", "Budget__", "Committed__", "ToApprove__", "Ordered__", "Received__", "InvoicedPO__", "InvoicedNonPO__"],
                    maxRecords: "no_limit"
                };
                Sys.GenericAPI.PromisedQuery(options)
                    .Then((queryResults) => {
                    operationReviseStep.FillBudget(queryResults.length > 0 ? queryResults[0] : null);
                })
                    .Catch((err) => {
                    Log.Error("Error querying budget table: " + err);
                    operationReviseStep.FillBudget();
                });
            }
            else {
                operationReviseStep.FillBudget();
            }
            Controls.Run.SetDisabled(true);
        },
        FillBudget: function (budgetLine) {
            if (budgetLine) {
                Controls.Revise_BudgetID__.SetValue(budgetLine.BudgetID__);
                Controls.Revise_CompanyCode__.SetValue(budgetLine.CompanyCode__);
                Controls.BudgetDescription__.SetValue(budgetLine.Description__);
                Controls.Revise_PeriodCode__.SetValue(budgetLine.PeriodCode__);
                Controls.Budget__.SetValue(budgetLine.Budget__);
                Controls.AvailableBeforeRevision__.SetValue(budgetLine.Budget__ - budgetLine.Committed__ - budgetLine.ToApprove__ - budgetLine.Ordered__ - budgetLine.Received__ - budgetLine.InvoicedPO__ - budgetLine.InvoicedNonPO__);
                Controls.NewBudget__.SetRequired(true);
                Controls.NewBudget__.SetReadOnly(false);
                Controls.NewBudget__.Focus();
            }
            else {
                Controls.Revise_CompanyCode__.SetValue(null);
                Controls.BudgetDescription__.SetValue(null);
                Controls.Revise_PeriodCode__.SetValue(null);
                Controls.Budget__.SetValue(null);
                Controls.AvailableBeforeRevision__.SetValue(null);
                Controls.NewBudget__.SetRequired(false);
                Controls.NewBudget__.SetReadOnly(true);
            }
            Controls.NewBudget__.SetValue(0); // workaround for the next call SetValue(null) works.
            Controls.NewBudget__.SetValue(null);
            Controls.AvailableAfterRevision__.SetValue(null);
        },
        Run: function () {
            function OnConfirm() {
                ResetBudgetFields("Revise");
                Variable.SetValueAsString("currentStep", Sys.Wizard.Wizard.GetNextStep());
                Attach.RemoveAttach(0);
                ProcessInstance.Approve("Revise");
            }
            Popup.Confirm("_Revise_explanation", false, OnConfirm, null, "_Revise_confirmation");
            return false;
        }
    };
    /**
     * Manage the Close step
     */
    const operationCloseStep = {
        panels: [Controls.ClosePane],
        icon: "fa-cog",
        title: "_OperationCloseStep",
        helpId: 5020,
        isVisible: function () {
            return Controls.Operation__.GetValue() === "Close";
        },
        onStart: function () {
            InitButtons(1);
            Controls.Run.SetDisabled(!operationCloseStep.IsRunnable());
            Controls.Run.OnClick = operationCloseStep.Run;
            Lib.Spending.Budget.Management.mixin.ForEachActionField("Close", (fieldBy, budgetFields) => {
                Controls[fieldBy].OnChange = function () {
                    operationCloseStep.Select(fieldBy);
                };
                Lib.Spending.Budget.Management.mixin.ForEachBudgetField(budgetFields, (field, budgetTableField) => {
                    Controls[field].SetRequired(true);
                    Controls[field].SetAllowTableValuesOnly(true);
                    Controls[field].OnChange = function () {
                        QueryBudgetLinesImpacted("Close", budgetFields);
                    };
                });
            });
            operationCloseStep.Select();
        },
        onQuit: function () {
            ResetBudgetFields("Close");
            return true;
        },
        Select: function (by) {
            Lib.Spending.Budget.Management.mixin.ForEachActionField("Close", (fieldBy, budgetFields) => {
                if (!by && Controls[fieldBy].IsSelected(0)) {
                    by = fieldBy;
                }
                let unselect = fieldBy !== by;
                if (unselect) {
                    Controls[fieldBy].Unselect();
                }
                else {
                    QueryBudgetLinesImpacted("Close", budgetFields);
                }
                Lib.Spending.Budget.Management.mixin.ForEachBudgetField(budgetFields, (field, budgetTableField) => {
                    Controls[field].Hide(unselect);
                });
                Controls.SpacerCloseAfterBudgetID__.Hide(by !== "Close_ByBudgetID__");
            });
        },
        IsRunnable: function () {
            return Controls.Close_BudgetLinesImpacted__.GetValue() > 0;
        },
        Run: function () {
            function OnConfirm() {
                ResetBudgetFields("Close");
                Variable.SetValueAsString("currentStep", Sys.Wizard.Wizard.GetNextStep());
                Attach.RemoveAttach(0);
                ProcessInstance.Approve("Close");
            }
            Popup.Confirm(["_Close_explanation", Controls.Close_BudgetLinesImpacted__.GetValue().toString()], false, OnConfirm, null, "_Close_confirmation");
            return false;
        }
    };
    /**
     * Manage the Result step
     */
    const resultStep = {
        panels: [Controls.GeneralPane, Controls.ResultPane, Controls.AttachmentsPane],
        icon: "fa-flag-checkered",
        title: "_ResultStep",
        helpId: 5016,
        onStart: function () {
            InitButtons(-1);
            Controls.Close.SetLabel(Language.Translate("_Quit"));
            Controls.UserName__.Hide(false);
            Controls.Reason__.SetReadOnly(true);
            Controls.Operation__.SetReadOnly(true);
            Process.SetHelpId(generalStep.helpId + Sys.Wizard.Wizard.GetPreviousStep());
        },
        onQuit: function () {
            return true;
        }
    };
    function ResetBudgetFields(action) {
        Lib.Spending.Budget.Management.mixin.ForEachActionField(action, (fieldBy, budgetFields) => {
            Lib.Spending.Budget.Management.mixin.ForEachBudgetField(budgetFields, (field, budgetTableField) => {
                Controls[field].SetRequired(false);
                Controls[field].SetAllowTableValuesOnly(false);
                Controls[field].SetError("");
            });
        });
    }
    function IsQueryable(budgetFields) {
        return !Lib.Spending.Budget.Management.mixin.FindField(budgetFields, (field, budgetTableField) => {
            let ctrl = Controls[field];
            return ctrl.GetError() || Sys.Helpers.IsEmpty(ctrl.GetValue());
        });
    }
    function QueryBudgetLinesImpacted(action, budgetFields) {
        if (IsQueryable(budgetFields)) {
            let options = {
                table: "PurchasingBudget__",
                filter: Lib.Spending.Budget.Management.mixin.MakeFilter(budgetFields),
                attributes: ["__Count__"]
            };
            Sys.GenericAPI.PromisedQuery(options)
                .Then((queryResults) => {
                FillBudgetLinesImpacted(action, parseInt(queryResults[0].__Count__, 10) || 0);
            })
                .Catch((err) => {
                Log.Error("Error querying budget table: " + err);
                FillBudgetLinesImpacted(action, 0);
            });
        }
        else {
            FillBudgetLinesImpacted(action, 0);
        }
    }
    function FillBudgetLinesImpacted(action, count) {
        Controls[action + "_BudgetLinesImpacted__"].SetValue(count);
        Controls.Run.SetDisabled(!count);
    }
    // step: 0=first; -1=last; 1=middle
    function InitButtons(step) {
        Controls.Previous.Hide(step <= 0);
        Controls.Next.Hide(step != 0);
        Controls.Run.Hide(step <= 0);
        Controls.Close.OnClick = function () {
            if (step > 0 && !ProcessInstance.IsModified()) {
                Popup.Confirm("", false, () => {
                    ProcessInstance.Quit("quit");
                }, null, "_Quit_confirmation");
                return false;
            }
        };
    }
    function Main() {
        var _a;
        ProcessInstance.SetSilentChange(true);
        Controls.AttachmentsPane.AllowChangeOrUploadReferenceDocument(false);
        let steps = [generalStep, operationImportStep, operationExportStep, operationReviseStep, operationCloseStep, operationDeleteStep, resultStep];
        Lib.CommonDialog.NextAlert.Show({
            "LargeCSV": {
                Popup: function (nextAlert) {
                    Variable.SetValueAsString("currentStep", 1); // 1 = operationImportStep
                    Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                Variable.SetValueAsString("currentStep", Sys.Wizard.Wizard.GetNextStep());
                                ProcessInstance.ApproveAsynchronous("ImportCSV");
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_Ok");
                }
            }
        });
        Sys.Wizard.Wizard.Init({
            steps: steps,
            previousButton: Controls.Previous,
            nextButton: Controls.Next,
            wizardControl: Controls.WizardSteps__,
            descriptionControl: null,
            LoadFirstStep: function () {
                return Variable.GetValueAsString("currentStep");
            },
            SaveCurrentStep: function (currentStep) {
                Variable.SetValueAsString("currentStep", currentStep);
            },
            RefreshDefaultValues: null
        });
        (_a = Controls.Spacer_line__) === null || _a === void 0 ? void 0 : _a.Hide(true);
        // Other layout initializations
        Sys.Helpers.TryCallFunction("Lib.Budget.Management.Customization.Client.OnLoad");
    }
    /// ==================================
    /// Entry point !!!
    /// ==================================
    Main();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map