"use strict";
/* eslint-disable dot-notation */
/* eslint-disable class-methods-use-this,guard-for-in,no-case-declarations */
var ValidationScript;
(function (ValidationScript) {
    class Main {
        constructor() {
            this.VARIABLE_PROP = Lib.Project.VARIABLE_PROP;
            this.IsNew = false;
        }
        ///#region Initialisation
        InitTaskNumber() {
            let taskNumber = Data.GetValue("TaskNumber__");
            if (!taskNumber) {
                this.IsNew = true;
                taskNumber = Lib.Project.NextNumber("Task", "TaskNumber__");
                Data.SetValue("TaskNumber__", taskNumber);
            }
        }
        ///#endregion
        ActionSave(leaveForm) {
            this.InitTaskNumber();
            Lib.Project.ModifyTaskRights();
            Lib.Project.IsStartEndDateValid("StartDate__", "EndDate__", "_Task_end_date_before_start_date");
            this.NotifyTaskOwnerIfNecessary();
            Sys.TechnicalData.SetValue("FormerTaskOwner", Data.GetValue("OwnerLogin__"));
            Process.PreventApproval();
            if (leaveForm) {
                Process.LeaveForm();
            }
        }
        NotifyTaskOwnerIfNecessary() {
            const currentOwner = Data.GetValue("OwnerLogin__");
            const formerOwner = this.IsNew ? "" : Sys.TechnicalData.GetValue("FormerTaskOwner");
            const loggedUser = Users.GetUser(Data.GetValue("LastSavedOwnerID"));
            // no owner or owner is the logged user --> do not send
            if (Sys.Helpers.IsEmpty(currentOwner) || loggedUser.GetValue("Login") === currentOwner) {
                return;
            }
            // owner has changed --> do send
            if (this.IsNew || (!this.IsNew && !Sys.Helpers.IsEmpty(formerOwner) && formerOwner !== currentOwner)) {
                const customTags = {
                    OwnerName: Data.GetValue("OwnerName__"),
                    ModifierName: loggedUser.GetValue("DisplayName"),
                    TaskName: Data.GetValue("Name__"),
                    TaskNumber: Data.GetValue("TaskNumber__"),
                    ProjectName: Data.GetValue("ProjectName__"),
                    ProjectNumber: Data.GetValue("ProjectNumber__")
                };
                Lib.Project.SendEmailNotification("Project_Email_NotifChangeTaskOwner.htm", customTags, "_EskerTask");
            }
        }
        ActionDelete() {
            Log.Info("[ActionDelete] try to cancel...");
            Process.Cancel();
            Log.Info("[ActionDelete] End");
        }
        ActionSynchronize() {
            Log.Info("[ActionSynchronize] Start");
            return Sys.GenericAPI.PromisedQuery({
                table: "CDNAME#Project",
                attributes: ["*"],
                filter: Sys.Helpers.LdapUtil.FilterEqual("ProjectNumber__", Data.GetValue("ProjectNumber__")),
                maxRecords: 1,
                additionalOptions: {
                    asAdmin: true
                }
            }).Then((queryResults) => {
                if (queryResults.length > 0) {
                    const project = queryResults[0];
                    let projectTechnicalData;
                    try {
                        Log.Info(`Project TechnicalData__=${project.TechnicalData__}`);
                        projectTechnicalData = JSON.parse(project.TechnicalData__);
                        Sys.TechnicalData.SetValue("ProjectOwner", projectTechnicalData === null || projectTechnicalData === void 0 ? void 0 : projectTechnicalData.ProjectOwner);
                        Sys.TechnicalData.SetValue("ProjectMembers", projectTechnicalData === null || projectTechnicalData === void 0 ? void 0 : projectTechnicalData.ProjectMembers);
                        if ((projectTechnicalData === null || projectTechnicalData === void 0 ? void 0 : projectTechnicalData.MakeTasksCompleted) && Data.GetValue("Progress__") < 100) {
                            Data.SetValue("Progress__", 100);
                        }
                    }
                    catch (e) {
                        Log.Error(`[ActionSynchronize] TechnicalData is not set properly to initialize task's members with project members. error : ${e.message}`);
                    }
                    Data.SetValue("ProjectName__", project.Name__);
                    Data.SetValue("CompanyCode__", project.CompanyCode__);
                    Data.SetValue("ProjectStatus__", project.Status__);
                    Data.SetValue("ArchiveDuration", project.ArchiveDuration);
                    Data.SetValue("ValidityDateTime", project.ValidityDateTime);
                    Lib.Project.ModifyTaskRights();
                    if (!(projectTechnicalData === null || projectTechnicalData === void 0 ? void 0 : projectTechnicalData.MakeTasksSuccess)) {
                        Process.PreventApproval();
                    }
                }
                else {
                    Log.Error(`[ActionSynchronize] Cannot retrieve the project associated to the task "${Data.GetValue("TaskNumber__")}" (${queryResults.length} results found.`);
                }
                Log.Info("[ActionSynchronize] End");
            });
        }
        Start() {
            Log.Info(`ActionName: "${Data.GetActionName()}" ActionType: "${Data.GetActionType()}"`);
            const action = `${Data.GetActionType()}_${Data.GetActionName()}`;
            try {
                switch (action) {
                    case "approve_Save": // From Project
                        this.ActionSave(false);
                        break;
                    case "approve_asynchronous_Save": // From AdminList
                        this.ActionSave(true);
                        break;
                    case "approve_synchronizeTasks":
                    case "ResumeWithAction_synchronizeTasks":
                        this.ActionSynchronize();
                        break;
                    case "approve_Delete":
                        this.ActionDelete();
                        break;
                    default:
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