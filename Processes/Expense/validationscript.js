"use strict";
var ValidationScript;
(function (ValidationScript) {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info("-- Expense Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
    /** ********* **/
    /** FUNCTIONS **/
    /** ********* **/
    function IsFormInError() {
        return Lib.P2P.FormHasError();
    }
    ValidationScript.IsFormInError = IsFormInError;
    function Save(doNotif, leaveForm = true) {
        if (!doNotif) {
            Lib.Expense.LayoutManager.CleanHiddenFields();
        }
        Lib.Expense.LayoutManager.FillEmptyFields();
        // Enforce the local amount server-side
        if (!Lib.Expense.Transaction.KeepAmountsFromTransactionData()) {
            Lib.Expense.FillLocalAmount();
        }
        // Enforce the reimbursable amount server-side
        Lib.Expense.FillReimbursableAmount();
        Lib.Expense.ComputeStatus();
        const expenseNumber = InitExpenseNumber();
        Lib.Expense.LayoutManager.SetRequiredFields(false);
        if (doNotif) {
            let customTags = {
                Number: expenseNumber,
                ValidationUrl: Data.GetValue("ValidationUrl")
            };
            if (!Data.IsNullOrEmpty("TotalAmount__")) {
                customTags["Total"] = Data.GetValue("TotalAmount__");
                customTags["Currency"] = Data.GetValue("TotalAmountCurrency__");
            }
            let date = Data.GetValue("Date__");
            if (date) {
                customTags["Date"] = Helpers.Date.DateToShortFormat(date);
            }
            SendEmailNotification(customTags);
            SendPushNotification(customTags);
        }
        Process.PreventApproval();
        if (leaveForm) {
            Process.LeaveForm();
        }
    }
    ValidationScript.Save = Save;
    function SendEmailNotification(customTags) {
        let options = {
            userId: Users.GetUser(Data.GetValue("OwnerId")).GetValue("Login"),
            emailAddress: Data.GetValue("FromAddress"),
            subject: "_Expense has been created",
            template: "Expense_Email_NotifExpenseCreated.htm",
            customTags: customTags,
            escapeCustomTags: true,
            fromName: "_EskerExpenseManagement"
        };
        Log.Info("Notify the Expense creation to " + options.emailAddress);
        let doSendNotif = Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Server.OnSendEmailNotification", options);
        if (doSendNotif !== false) {
            Lib.P2P.EmailNotification.SendEmailNotification(options);
        }
    }
    ValidationScript.SendEmailNotification = SendEmailNotification;
    function SendPushNotification(customTags) {
        // Send push notifications if enabled
        if (Process.GetProcessDefinition().PushNotification === true) {
            let pushNotificationType = (Sys.Parameters.GetInstance("Expense").GetParameter("PushNotificationType") || Sys.Parameters.GetInstance("P2P").GetParameter("PushNotificationType") || "").toLowerCase();
            Log.Info("Sending " + pushNotificationType + " push notification");
            if (pushNotificationType == "short" || pushNotificationType == "full") {
                Sys.PushNotification.SendNotifToUser({
                    user: Users.GetUser(Data.GetValue("OwnerId")),
                    id: (pushNotificationType == "short") ? Process.GetProcessID() : Data.GetValue("RuidEx"),
                    template: "Expense_PushNotif_NotifExpenseCreated_" + pushNotificationType + ".txt",
                    sendToBackupUser: false,
                    customTags: customTags
                });
            }
        }
    }
    ValidationScript.SendPushNotification = SendPushNotification;
    function OnSubmitReport() {
        Log.Info("This expense is pending approval");
        RemoveVisibilityOnExpense();
        let actionData = GetActionDataFromExpenseReport();
        GiveVisibilityOnExpense(actionData);
        SetManager(actionData.manager);
        ResetActionDataFromExpenseReport();
        Process.WaitForUpdate();
    }
    ValidationScript.OnSubmitReport = OnSubmitReport;
    function OnRollbackSubmitReport() {
        Log.Info("The submission of this expense has been rollbacked");
        SetManager();
        ResetActionDataFromExpenseReport();
        Process.PreventApproval();
    }
    ValidationScript.OnRollbackSubmitReport = OnRollbackSubmitReport;
    function OnApprovedReport() {
        Log.Info("This expense has been approved");
        ResetActionDataFromExpenseReport();
        Process.WaitForUpdate();
    }
    ValidationScript.OnApprovedReport = OnApprovedReport;
    function OnValidatedReport() {
        Log.Info("This expense is validated");
        ResetActionDataFromExpenseReport();
    }
    ValidationScript.OnValidatedReport = OnValidatedReport;
    function OnForwardReport() {
        Log.Info("This expense has been forwarded");
        let actionData = GetActionDataFromExpenseReport();
        GiveVisibilityOnExpense(actionData);
        ResetActionDataFromExpenseReport();
        Process.WaitForUpdate();
    }
    ValidationScript.OnForwardReport = OnForwardReport;
    function OnRequestFurtherApprovalReport() {
        OnForwardReport();
    }
    ValidationScript.OnRequestFurtherApprovalReport = OnRequestFurtherApprovalReport;
    function OnBackToUserReport() {
        Log.Info("This expense is back to user");
        SetManager();
        ResetActionDataFromExpenseReport();
        Process.PreventApproval();
    }
    ValidationScript.OnBackToUserReport = OnBackToUserReport;
    async function OnLinkFromTransaction() {
        await Lib.Expense.Server.InitExpenseFromTechnicalData();
        ValidationScript.Save(false, false);
    }
    ValidationScript.OnLinkFromTransaction = OnLinkFromTransaction;
    function Delete() {
        Log.Info("[Delete] Deleting Expense");
        Lib.Expense.LayoutManager.CleanHiddenFields();
        Data.SetValue("ExpenseStatus__", "Deleted");
        Lib.Expense.Itemization.Server.DeleteAllSubExpenses();
        Process.Cancel();
        Process.LeaveForm();
    }
    ValidationScript.Delete = Delete;
    function DeleteAndPreventApproval() {
        Log.Info("[Delete] Deleting Expense");
        Lib.Expense.LayoutManager.CleanHiddenFields();
        Data.SetValue("ExpenseStatus__", "Deleted");
        Lib.Expense.Itemization.Server.DeleteAllSubExpenses();
        Process.PreventApproval();
    }
    ValidationScript.DeleteAndPreventApproval = DeleteAndPreventApproval;
    function UpdateExpense() {
        const updatedData = Sys.TechnicalData.GetValue("autoCompleteFromParentExpense");
        Sys.Helpers.Object.ForEach(updatedData, (fieldValue, fieldName) => {
            Data.SetValue(fieldName, fieldValue);
        });
        Sys.TechnicalData.SetValue("autoCompleteFromParentExpense", "");
        Process.PreventApproval();
    }
    ValidationScript.UpdateExpense = UpdateExpense;
    function GetActionDataFromExpenseReport() {
        let actionData = Variable.GetValueAsString("FromExpenseReport_ActionData");
        return actionData && JSON.parse(actionData);
    }
    ValidationScript.GetActionDataFromExpenseReport = GetActionDataFromExpenseReport;
    function ResetActionDataFromExpenseReport() {
        Variable.SetValueAsString("FromExpenseReport_ActionData", "");
    }
    ValidationScript.ResetActionDataFromExpenseReport = ResetActionDataFromExpenseReport;
    function SetManager(manager) {
        const managerUser = manager ? Users.GetUser(manager) : null;
        if (managerUser) {
            Data.SetValue("Manager__", managerUser.GetValue("DisplayName"));
            Data.SetValue("ManagerDN__", managerUser.GetValue("FullDn"));
        }
        else {
            Data.SetValue("Manager__", "");
            Data.SetValue("ManagerDN__", "");
        }
    }
    ValidationScript.SetManager = SetManager;
    function GiveVisibilityOnExpense(actionData) {
        Log.Info("Give visibility on this expense");
        if (actionData) {
            if (actionData.contributors) {
                Log.Info("Give visibility on this expense to report contributors");
                actionData.contributors.forEach(login => {
                    Log.Info(`contributor: ${login}`);
                    Process.SetRight(login, "read");
                });
            }
            if (actionData.expenseViewer) {
                Log.Info("Give visibility on this expense to expense viewer");
                Lib.Expense.SetRightForExpenseViewer(actionData.expenseViewer);
            }
        }
        else {
            Log.Warn("No contributors/expense viewer specified.");
        }
    }
    ValidationScript.GiveVisibilityOnExpense = GiveVisibilityOnExpense;
    function RemoveVisibilityOnExpense() {
        Log.Info("Remove visibility on this expense to report contributors");
        Process.ResetRights();
    }
    ValidationScript.RemoveVisibilityOnExpense = RemoveVisibilityOnExpense;
    function HandleSubExpenseOperations() {
        InitExpenseNumber();
        const rawSubExpenseOperations = Variable.GetValueAsString("SubExpensesModifications");
        const hasSubExpensesData = !Sys.Helpers.IsEmpty(rawSubExpenseOperations);
        if (!hasSubExpensesData) {
            return false;
        }
        const subExpenseOperations = JSON.parse(rawSubExpenseOperations);
        if (!Sys.Helpers.IsEmpty(subExpenseOperations) && subExpenseOperations.length > 0) {
            let subExpenseData;
            Log.Info(`[HandleSubExpenseOperations] ${subExpenseOperations.length} subexpenses operations to process`);
            subExpenseOperations.forEach(subExpenseOperation => {
                switch (subExpenseOperation.action) {
                    case "create" /* Lib.Expense.Itemization.SubExpenseOperationAction.Create */:
                        subExpenseData = Lib.Expense.Itemization.Server.CreateSubExpense(subExpenseOperation.data);
                        SetNewExpenseValuesInTable(subExpenseData);
                        break;
                    case "update" /* Lib.Expense.Itemization.SubExpenseOperationAction.Update */:
                        Lib.Expense.Itemization.Server.UpdateSubExpense(subExpenseOperation.msnex, "update" /* Lib.Expense.Itemization.SubExpenseOperationAction.Update */, subExpenseOperation.data);
                        break;
                    case "delete" /* Lib.Expense.Itemization.SubExpenseOperationAction.Delete */:
                        Lib.Expense.Itemization.Server.UpdateSubExpense(subExpenseOperation.msnex, "delete" /* Lib.Expense.Itemization.SubExpenseOperationAction.Delete */);
                        break;
                    default:
                        UnknownOperationSubExpense(subExpenseOperation);
                        break;
                }
            });
            // TODO: reset status to draft only when needed ?
            Data.SetValue("ExpenseStatus__", "Draft");
            // Clean operations to avoid double processing
            Variable.SetValueAsString("SubExpensesModifications", "");
            Lib.Expense.Itemization.Server.CheckIsItemized();
            return true;
        }
        Log.Verbose("[HandleSubExpenseOperations] No subexpense operations found");
        return false;
    }
    function SetNewExpenseValuesInTable(expenseData) {
        const line = Sys.Helpers.Data.FindTableItem("SubExpenses__", (item) => {
            // TODO: make it similar for web & mobile ?
            // Empty when coming from mobile, "_New Expense" when coming from web
            const expenseNumber = item.GetValue("ExpenseNumber__");
            return Sys.Helpers.IsEmpty(expenseNumber) || expenseNumber == "_New Expense";
        });
        if (line) {
            line.SetValue("ExpenseNumber__", expenseData.ExpenseNumber__);
            line.SetValue("MsnEx__", expenseData.MsnEx__);
        }
        else {
            Log.Error("[SetNewExpenseValuesInTable] Did not found any available line");
        }
    }
    function UnknownOperationSubExpense(subExpenseOperation) {
        Log.Error(`[UnknownOperationSubExpense] ${JSON.stringify(subExpenseOperation)}`);
    }
    function InitExpenseNumber() {
        let expenseNumber = Data.GetValue("ExpenseNumber__");
        if (!expenseNumber) {
            expenseNumber = Lib.Expense.NextNumber("Expense", "ExpenseNumber__");
            Data.SetValue("ExpenseNumber__", expenseNumber);
        }
        return expenseNumber;
    }
    /** ******** **/
    /** RUN PART **/
    /** ******** **/
    async function main() {
        Lib.P2P.SetBillingInfo("EX001");
        Lib.Expense.InitTechnicalFields();
        await Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.OnLoadLayoutManagerTemplates");
        if (currentName == "" && currentAction == "") {
            // When the process is created from an inbound channel, SourceRUID can be
            // Email inbound channel (ISM.XXXXX) or Email preprocessing (CD#XXXXX)
            // The SourceRuid is also set when the current document is a sub-expense => so we have to ignore it
            const isCreatedFromInboundChannel = !!Data.GetValue("SourceRuid") && !Lib.Expense.Itemization.IsSubExpense();
            HandleSubExpenseOperations();
            Save(isCreatedFromInboundChannel);
        }
        else if (currentName !== "" && currentAction !== "") {
            if (currentAction === "approve_asynchronous" || currentAction === "approve" || currentAction === "ResumeWithAction") {
                Lib.CommonDialog.NextAlert.Reset();
                switch (currentName) {
                    case "save":
                        break;
                    case "Save":
                        HandleSubExpenseOperations();
                        Save(false, currentAction !== "approve");
                        break;
                    case "SaveAndQuit":
                        HandleSubExpenseOperations();
                        Save(false, true);
                        break;
                    case "DeleteExpense":
                        Delete();
                        break;
                    case "DeleteExpenseAndPreventApproval":
                        DeleteAndPreventApproval();
                        break;
                    case "UpdateExpense":
                        UpdateExpense();
                        break;
                    case "FromExpenseReport_Submit":
                        OnSubmitReport();
                        break;
                    case "FromExpenseReport_RollbackSubmit":
                        OnRollbackSubmitReport();
                        break;
                    case "FromExpenseReport_BackToUser":
                        OnBackToUserReport();
                        break;
                    case "FromExpenseReport_Approve":
                        OnApprovedReport();
                        break;
                    case "FromExpenseReport_Validated":
                        OnValidatedReport();
                        break;
                    case "FromExpenseReport_Forward":
                        OnForwardReport();
                        break;
                    case "FromExpenseReport_RequestFurtherApproval":
                        OnRequestFurtherApprovalReport();
                        break;
                    case "FromTransaction_LinkExpenseToTransaction":
                        await OnLinkFromTransaction();
                        break;
                    default:
                        Lib.Expense.OnUnknownAction(currentAction, currentName);
                        break;
                }
            }
            else if (currentAction !== "reprocess" && currentAction !== "reprocess_asynchronous") {
                Lib.Expense.OnUnknownAction(currentAction, currentName);
            }
            else if (Data.GetActionDevice() === "mobile") {
                HandleSubExpenseOperations();
                Save();
            }
        }
        else {
            Lib.Expense.OnUnknownAction(currentAction, currentName);
        }
        Lib.Expense.SetRightForDelegateUsers("AllowedToTerminateExpenseUser__", "validate");
    }
    Lib.P2P.HandleScriptError(main());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map