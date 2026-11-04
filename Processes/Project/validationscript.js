"use strict";
/* eslint-disable dot-notation */
/* eslint-disable class-methods-use-this,guard-for-in,no-case-declarations */
var ValidationScript;
(function (ValidationScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    class Main {
        constructor() {
            this.VARIABLE_PROP = Lib.Project.VARIABLE_PROP;
            this.logger = new NamedLog({ namespace: "Project" });
            this.projectSpendingHandler = new Lib.Spending.Project.Handler();
        }
        ///#region Initialisation
        InitProjectNumber() {
            let projectNumber = Data.GetValue("ProjectNumber__");
            if (!projectNumber) {
                projectNumber = Lib.Project.NextNumber("Project", "ProjectNumber__");
                Data.SetValue("ProjectNumber__", projectNumber);
            }
        }
        ///#endregion
        async ActionSave(leaveForm) {
            this.logger.Info(`ActionSave: ${leaveForm}`);
            this.InitProjectNumber();
            Lib.Project.IsStartEndDateValid("StartDate__", "EndDate__");
            Lib.Project.ModifyProjectRights(Data.GetValue("OwnerLogin__"));
            await Lib.Project.Spending.UpdateWithNewProject((spending, max) => { var _a; return (_a = this.projectSpendingHandler.ComputeRemainingForSteps(spending, max)) === null || _a === void 0 ? void 0 : _a.toNumber(); });
            Lib.Project.Notification.SaveFromExternalVariable();
            const status = Data.GetValue("Status__");
            if (status !== "Done" && status !== "Canceled") {
                if (!leaveForm) {
                    Data.SetValue("State", "70");
                    Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
                }
                Process.WaitForUpdate();
                if (leaveForm) {
                    Process.LeaveForm();
                }
            }
            else if (status === "Canceled") {
                const filter = [{
                        processName: "Project",
                        processKey: "ProjectNumber__",
                        processKeyValue: Data.GetValue("ProjectNumber__")
                    }];
                Lib.P2P.Notification.Server.CancelNotification(filter);
            }
            Lib.Project.SetArchiveDurationIfNecessary();
            // this code must be done once the configuration is loaded
            Lib.P2P.InitValidityDateTime("Project", "ValidityDurationInMonths", Lib.Project.ValidityNumberOfMonths);
        }
        ActionReOpen() {
            Log.Info("[ActionReOpen] call");
            Data.SetValue("Status__", Lib.Project.ProcessStatus.InProgress);
            Sys.TechnicalData.DeleteValue("MakeTasksSuccess");
            Sys.TechnicalData.DeleteValue("MakeTasksCompleted");
            Lib.P2P.InitValidityDateTime("Project", "ValidityDurationInMonths", Lib.Project.ValidityNumberOfMonths);
            Process.WaitForUpdate();
            const filter = [{
                    processName: "Project",
                    processKey: "ProjectNumber__",
                    processKeyValue: Data.GetValue("ProjectNumber__")
                }];
            Lib.P2P.Notification.Server.ReopenNotification(filter);
            Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
            Process.RecallScript("SynchronizeTasks");
        }
        Start() {
            Log.Info(`ActionName: "${Data.GetActionName()}" ActionType: "${Data.GetActionType()}"`);
            const action = `${Data.GetActionType()}_${Data.GetActionName()}`;
            try {
                switch (action) {
                    case "approve_Save":
                        this.ActionSave(false);
                        break;
                    case "approve_asynchronous_Save":
                    case "reseal_SaveEditing_":
                        this.ActionSave(true);
                        if (Lib.Project.MustSynchronizeTasks()) {
                            Sys.TechnicalData.SetValue("ProjectFieldsImpactingTasks", "");
                            Process.RecallScript("SynchronizeTasks", true);
                        }
                        break;
                    case "approve_SynchronizeTasks":
                    case "approve_asynchronous_SynchronizeTasks":
                    case "reseal_SynchronizeTasks":
                    case "unarchiveandvalidate_SynchronizeTasks":
                        Log.Info(`TechnicalData__=${Data.GetValue("TechnicalData__")}`);
                        Lib.Project.SynchronizeTasks();
                        break;
                    case "unarchiveandvalidate_ReOpen_":
                        this.ActionReOpen();
                        break;
                    default:
                        Log.Warn("Unknown action");
                        Process.WaitForUpdate();
                        break;
                }
            }
            catch (e) {
                let errorMsg = Language.Translate("_technical_error");
                if (typeof e === "string") {
                    errorMsg = e;
                }
                else {
                    Log.Info("A error occured: ", e);
                }
                // Don't use state 200, because customscript are not re-execute after post back, c-epalle 26/09/2022
                Variable.SetValueAsString(this.VARIABLE_PROP.Error__, errorMsg);
                Lib.CommonDialog.NextAlert.Define("_SaveProjectError_title", "_SaveProjectError_message");
                Process.PreventApproval();
            }
        }
    }
    ValidationScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        main.Start();
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map