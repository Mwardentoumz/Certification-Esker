"use strict";
var Validation;
(function (Validation) {
    var currentName = Data.GetActionName();
    var currentAction = Data.GetActionType();
    var wkf = Lib.Expense.Report.Workflow;
    wkf.controller.Define(wkf.parameters);
    Log.Info("-- Expense Report Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
    /** ********* **/
    /** FUNCTIONS **/
    /** ********* **/
    function Save() {
        // The standard Save action does not save the EDDMessageVars, in our case ValidityDateTime
        // --> use Approve action + PreventApproval
        const contributor = Lib.Expense.Report.Workflow.controller.GetContributorAt(0);
        Lib.Expense.Report.Workflow.NotifyEndOfContributionOnMobile(contributor);
        Process.PreventApproval();
        Process.LeaveForm();
    }
    function SubmitExpenseReport() {
        Log.Info("Submit expense report...");
        // After first submit workflow cannot be rebuild
        wkf.controller.AllowRebuild(false);
        var sequenceStep = wkf.controller.GetContributorIndex();
        var currentContributor = wkf.controller.GetContributorAt(sequenceStep);
        if (!wkf.controller.DoAction(currentContributor.action)) {
            Process.PreventApproval();
        }
        Lib.Expense.SetRightForExpenseViewer();
    }
    function BackToUser() {
        Log.Info("Back to user...");
        wkf.controller.AllowRebuild(true);
        if (!wkf.controller.DoAction(wkf.enums.actions.sentBack)) {
            Process.PreventApproval();
        }
    }
    function ModifyExpenseReport() {
        Log.Info("Modify expense report...");
        wkf.controller.AllowRebuild(true);
        if (!wkf.controller.DoAction(wkf.enums.actions.modifyReport)) {
            Process.PreventApproval();
        }
    }
    function DeleteExpenseReport() {
        Log.Info("Delete expense report...");
        if (!wkf.controller.DoAction(wkf.enums.actions.deleted)) {
            Process.PreventApproval();
        }
    }
    function ForwardExpenseReport() {
        Log.Info("Forward expense report...");
        if (!wkf.controller.DoAction(wkf.enums.actions.forward)) {
            Process.PreventApproval();
        }
    }
    function RequestFurtherApproval() {
        Log.Info("Request further approval");
        if (!wkf.controller.DoAction(wkf.enums.actions.requestFurtherApproval)) {
            Process.PreventApproval();
        }
    }
    function AtLeastOneDuplicateIsDifferent() {
        // ExpenseID (ExpenseMSNEX) of expense that have at least one possible duplicate are write inside technicalData
        let allExpenseNumberAlreadyCheck = Sys.TechnicalData.GetValue("expenseAlreadyViewAsDuplicate") || [];
        let possibleNewDuplicates = [];
        Sys.Helpers.Data.ForEachTableItem("ExpensesTable__", (expense) => {
            //This expense was not possible duplicate when loading client side ?
            if (allExpenseNumberAlreadyCheck.indexOf(expense.GetValue("ExpenseMSNEX__").toString()) === -1) {
                possibleNewDuplicates.push(expense);
            }
        });
        return Lib.Expense.Report.DuplicateCheck.IsDuplicateDetectedInList(possibleNewDuplicates);
    }
    function ExpenseReportSubmissionFromMobile(expensesList) {
        function LoadUserProperties() {
            Log.Info("Loading user properties");
            // We query the properties of owner (not validator) because the expense report may be submitted by an assistant
            return Lib.P2P.UserProperties.QueryValues(Lib.P2P.GetOwner().GetValue("login"))
                .Then((UserPropertiesValues) => {
                const companyCode = Data.GetValue("CompanyCode__");
                Data.SetValue("UserNumber__", UserPropertiesValues.UserNumber__);
                Data.SetValue("CompanyCode__", companyCode);
                return Lib.Expense.Report.LoadCompanyCodesValue();
            })
                .Then(() => {
                Log.Info("User properties loaded");
            });
        }
        function LoadExpenseReportTypeTable() {
            Log.Info("Expense report type table loading");
            if (Data.GetValue("ExpenseReportStatus__") !== "Draft") {
                Log.Info("Expense report type table loaded (nothing done)");
                return Sys.Helpers.Promise.Resolve();
            }
            return Lib.Expense.Report.QueryExpenseReportType(Data.GetValue("CompanyCode__"))
                .Then((records) => {
                if (records.length === 1) {
                    Data.SetValue("ExpenseReportTypeName__", records[0].ExpenseReportTypeName__);
                    Data.SetValue("ExpenseReportTypeID__", records[0].ID__);
                }
                else if (records.length > 1) {
                    // > 1 in case no ERT is defined
                    let defaultID = Data.GetValue("ExpenseReportTypeID__");
                    let defaultType = Sys.Helpers.Array.Find(records, (type) => {
                        return type.ID__ == defaultID;
                    });
                    if (defaultType !== undefined) {
                        Data.SetValue("ExpenseReportTypeName__", defaultType.ExpenseReportTypeName__);
                    }
                    else {
                        // No need to clear the ExpenseReportTypeID__, since ExpenseReportTypeName__ required
                        Log.Warn("The default Expense Report type specified by the admin doesn't exist OR none is specified.");
                    }
                }
                Log.Info("Expense report type table loaded (draft state)");
            });
        }
        function SetUserBaseInfo() {
            if (!Data.GetValue("User__") && !Data.GetValue("UserName__")) {
                Data.SetValue("User__", Lib.P2P.GetValidatorOrOwner().GetValue("login"));
                Data.SetValue("UserName__", Lib.P2P.GetValidatorOrOwner().GetValue("displayname"));
            }
        }
        function InitWorkflow() {
            Log.Info("Initializing workflow");
            let wkf = Lib.Expense.Report.Workflow;
            wkf.controller.Define(wkf.parameters);
            RefreshWorkflow();
            Log.Info("Initialization of workflow done");
        }
        function RefreshExpensesTable() {
            Log.Info("Refreshing of expenses table");
            return Lib.Expense.Report.FillExpensesTable(expensesList)
                .Then(() => {
                Log.Info("Refreshing of expenses table done");
            });
        }
        function RefreshWorkflow() {
            let wkf = Lib.Expense.Report.Workflow;
            if (wkf.controller.GetTableIndex() === 0) {
                wkf.controller.SetRolesSequence([
                    wkf.enums.roles.user,
                    wkf.enums.roles.manager,
                    wkf.enums.roles.controller
                ]);
            }
            else if (wkf.controller.RebuildAllowed()) {
                // The workflow can be changed before BackToUser,
                wkf.controller.Rebuild();
            }
        }
        SetUserBaseInfo();
        LoadUserProperties()
            .Then(LoadExpenseReportTypeTable)
            .Then(RefreshExpensesTable)
            .Then(InitWorkflow)
            .Then(() => {
            let err = Lib.Expense.Report.Workflow.parameters.getLastError();
            if (err != null) {
                if (err instanceof Sys.WorkflowEngine.Error) {
                    Lib.CommonDialog.NextAlert.Define("_Expense report creation error", "_Workflow error from mobile", {
                        isError: true,
                        behaviorName: "onUnexpectedError"
                    });
                    Process.PreventApproval();
                }
                else if (err instanceof Sys.WorkflowEngine.ErrorNoPopUp) {
                    Process.PreventApproval();
                }
                else {
                    Lib.Expense.OnUnexpectedError(err);
                    // Process.PreventApproval(); is done in OnUnexpectedError
                }
                const contributor = Lib.Expense.Report.Workflow.controller.GetContributorAt(0);
                if (!(err instanceof Lib.Expense.Report.CreatingPDFError)) {
                    if (contributor) {
                        Lib.Expense.Report.Workflow.SendEmailNotification(contributor, "_Expense report failed", "Expense_Email_ExpenseReportError.htm");
                    }
                    else {
                        Log.Warn("No error notification mail sent: contributor is null");
                    }
                }
                if (contributor) {
                    Lib.Expense.Report.Workflow.NotifyEndOfContributionOnMobile(contributor);
                }
            }
            else {
                Process.RecallScript("PostValidation_Post", true);
            }
        });
    }
    Variable.SetValueAsString("LastActionName", currentName);
    /** ******** **/
    /** RUN PART **/
    /** ******** **/
    Lib.Expense.InitTechnicalFields();
    Lib.P2P.SetTablesToIndex(["ExpensesTable__", "ReportWorkflow__"]);
    if (currentName == "" && currentAction == "") {
        if (Data.GetValue("State") == 50) {
            if (Sys.Helpers.Data.IsTrue(Variable.GetValueAsString("SubmittedFromMobileApp"))) {
                let expenses;
                try {
                    expenses = JSON.parse(Variable.GetValueAsString("SelectedExpenseIDs"));
                    ExpenseReportSubmissionFromMobile(expenses);
                }
                catch (_a) {
                    Lib.CommonDialog.NextAlert.Define("_No expenses in expense report title", "_No expenses to submit in expense report", { isError: true });
                }
            }
            else {
                Process.PreventApproval();
            }
        }
    }
    else if (currentName === "PostValidation_Post") {
        SubmitExpenseReport();
    }
    else if (currentName === "PostValidation_Validated") {
        Log.Info("Validate expense report...");
        if (!wkf.controller.DoAction(wkf.enums.actions.validated)) {
            Process.PreventApproval();
        }
    }
    else if (currentName !== "" && currentAction !== "") {
        if (currentAction === "approve_asynchronous" || currentAction === "approve") {
            Lib.CommonDialog.NextAlert.Reset();
            switch (currentName) {
                case "save":
                    break;
                case "Save":
                    Save();
                    break;
                case "SubmitExpenses":
                    if (Lib.P2P.FormHasError()) {
                        Log.Info("Form in error.");
                    }
                    else if (Data.GetValue("ExpenseReportStatus__") === "To control") {
                        AtLeastOneDuplicateIsDifferent()
                            .Then((result) => {
                            //At least one duplicate wasn't exist at loading client side
                            if (result) {
                                Log.Warn("Some expense are now Duplicate but was not at client loading of the flexible form");
                                Lib.CommonDialog.NextAlert.Define("_Duplicate Expense not validate", "_Duplicate Expense not validate warning", { isError: false });
                                Process.PreventApproval();
                            }
                            else {
                                SubmitExpenseReport();
                            }
                        })
                            .Catch((error) => {
                            Log.Error(`An error occurred while checking expense duplicate: ${error}`);
                            Lib.CommonDialog.NextAlert.Define("_Error during validate duplicate title", "_Error during validate duplicate description", { isError: true });
                            Process.PreventApproval();
                        });
                    }
                    else {
                        SubmitExpenseReport();
                    }
                    break;
                case "BackToUser":
                    BackToUser();
                    break;
                case "ModifyReport":
                    ModifyExpenseReport();
                    break;
                case "DeleteReport":
                    DeleteExpenseReport();
                    break;
                case "Approve_Forward":
                    if (!Lib.P2P.FormHasError()) {
                        ForwardExpenseReport();
                    }
                    break;
                case "Approve_RequestFurtherApproval":
                    if (!Lib.P2P.FormHasError()) {
                        RequestFurtherApproval();
                    }
                    break;
                default:
                    Lib.Expense.OnUnknownAction(currentAction, currentName);
                    break;
            }
        }
        else if (currentAction !== "reprocess" && currentAction !== "reprocess_asynchronous" && currentAction !== "save") {
            Lib.Expense.OnUnknownAction(currentAction, currentName);
        }
    }
    else {
        Lib.Expense.OnUnknownAction(currentAction, currentName);
    }
})(Validation || (Validation = {}));
//# sourceMappingURL=validationscript.js.map