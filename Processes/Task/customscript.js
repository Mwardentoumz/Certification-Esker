"use strict";
/* eslint-disable class-methods-use-this */
var CustomScript;
(function (CustomScript) {
    const gComesFromProject = !!Process.GetURLParameter("ls");
    const panes = ["Title", "GeneralInformation", "ProgressPane", "DocumentsPanel", "PreviewPanel", "TopPaneWarning"];
    const buttons = ["Save", "Close"];
    const globalLayout = new Lib.P2P.Layout.Manager(panes, buttons);
    function FeedFromProject() {
        const projectNumber = Sys.Helpers.String.DecodeURLParameter("projectNumber");
        if (Sys.Helpers.IsEmpty(Controls.ProjectNumber__.GetValue()) && projectNumber !== "newproject") {
            Data.SetValue("ProjectNumber__", projectNumber);
        }
        const projectName = Sys.Helpers.String.DecodeURLParameter("projectName");
        Controls.ProjectName__.Hide(Sys.Helpers.IsEmpty(projectName));
        Controls.ProjectName__.SetValue(projectName);
        Controls.CompanyCode__.SetValue(Sys.Helpers.String.DecodeURLParameter("companyCode"));
        const projectOwner = Sys.Helpers.String.DecodeURLParameter("projectOwner");
        Sys.TechnicalData.SetValue("ProjectOwner", !Sys.Helpers.IsEmpty(projectOwner) ? JSON.parse(projectOwner) : null);
        const projectMembers = Sys.Helpers.String.DecodeURLParameter("projectMembers");
        Sys.TechnicalData.SetValue("ProjectMembers", !Sys.Helpers.IsEmpty(projectMembers) ? JSON.parse(projectMembers) : null);
    }
    class Main {
        constructor() {
        }
        ComputeRemainingEstimatedDays() {
            const estimatedDays = Controls.EstimatedDays__.GetValue();
            let remainingEstimatedDays = null;
            if (estimatedDays !== null && estimatedDays >= 0) {
                remainingEstimatedDays = estimatedDays - estimatedDays * Controls.Progress__.GetValue() / 100;
                remainingEstimatedDays = Math.max(remainingEstimatedDays, 0);
            }
            Controls.RemainingEstimatedDays__.SetValue(remainingEstimatedDays);
        }
        InitControls() {
            Controls.TaskNumber__.Hide(Sys.Helpers.IsEmpty(Controls.TaskNumber__.GetValue()));
            Controls.Close.OnClick = function () {
                ProcessInstance.Quit("Quit");
                return false;
            };
            Controls.Save.OnClick = function () {
                if (gComesFromProject) // we come from "Project"
                 {
                    ProcessInstance.SetUrlParametersForPreventApproval("syncWithProjectOnExit=1");
                    ProcessInstance.Approve("Save");
                }
                else {
                    // Always approve due to possible change of task owner
                    ProcessInstance.ApproveAsynchronous("Save");
                }
                return false;
            };
            Controls.Save.Hide(ProcessInstance.isReadOnly || ProcessInstance.state >= 100);
            Controls.HTMLProgressBar__.BindEvent("onInput", (evt) => {
                Controls.Progress__.SetValue(evt.progressValue);
                this.ComputeRemainingEstimatedDays();
                this.DisplayBanner();
            });
            Controls.EstimatedDays__.OnChange = () => {
                this.ComputeRemainingEstimatedDays();
            };
            Controls.Progress__.OnChange = () => {
                Controls.HTMLProgressBar__.FireEvent("handler", { value: Controls.Progress__.GetValue() });
                this.ComputeRemainingEstimatedDays();
                this.DisplayBanner();
            };
            /* Work Arround at the end of the file
            Controls.HTMLProgressBar__.BindEvent("onLoad", function (): void
            {
                Controls.HTMLProgressBar__.FireEvent("handler", { value: Controls.Progress__.GetValue(), disabled: ProcessInstance.isReadOnly });
            });*/
            Controls.EndDate__.OnChange = function () {
                Lib.Project.IsStartEndDateValid("StartDate__", "EndDate__", "_Task_end_date_before_start_date");
            };
            Controls.StartDate__.OnChange = function () {
                Lib.Project.IsStartEndDateValid("StartDate__", "EndDate__", "_Task_end_date_before_start_date");
            };
            this.InitOwnerControls();
        }
        DisplayBanner() {
            const banner = Sys.Helpers.Banner;
            banner.SetMainTitle("_Task");
            banner.SetHTMLBanner(Controls.HTMLBanner__);
            banner.SetSubTitle(this.TaskStatus());
        }
        TaskStatus() {
            const progressValue = Controls.Progress__.GetValue();
            if (!progressValue) {
                return "_Draft";
            }
            else if (progressValue >= 100) {
                return "_Completed";
            }
            return "_InProgress";
        }
        Start() {
            Log.Info("Start custom script");
            Controls.form_header.SetProcessDisplayName(Language.Translate("_Task"));
            // Pass the information wether the account is a demo account or not to the server
            Variable.SetValueAsString("InDemoAccount", User.isInDemoAccount ? "1" : "0");
            if (gComesFromProject && ProcessInstance.state && Data.GetValue("Deleted") != "1" && Process.GetURLParameter("syncWithProjectOnExit") == "1") {
                let taskItem = GetTaskDataFromForm();
                Data.StorageSetValue(Process.GetURLParameter("ls"), JSON.stringify(taskItem));
                ProcessInstance.Quit("Quit");
            }
            this.InitControls();
            Lib.ModuleProject.InitWarnings();
            this.DisplayBanner();
        }
        InitOwnerControls() {
            Controls.OwnerName__.DisableExposedColumnImplicitRequest();
            const OnSelectOwner = (item) => {
                Data.SetValue("OwnerName__", item.GetValue("DisplayName"));
                Data.SetValue("OwnerLogin__", item.GetValue("Login"));
            };
            const OnUnknownOrEmptyOwner = () => {
                Data.SetValue("OwnerLogin__", "");
            };
            Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.OwnerName__, OnSelectOwner, OnUnknownOrEmptyOwner, OnUnknownOrEmptyOwner);
            Lib.Project.GetPossibleTaskOwnerLogins()
                .Then(logins => {
                const filter = Sys.Helpers.LdapUtil.FilterIn("Login", logins).toString();
                Sys.Helpers.SilentChange(() => Controls.OwnerName__.SetFilter(filter));
            });
        }
    }
    CustomScript.Main = Main;
    function GetTaskDataFromForm(exceptions = []) {
        let data = { ValidationUrl: Data.GetValue("ValidationUrl") };
        Sys.Helpers.Object.ForEach(Controls, (control) => {
            const name = control.GetName();
            const type = control.GetType();
            if (name.endsWith("__") &&
                Sys.Helpers.Array.IndexOf(exceptions, name) < 0 &&
                !type.startsWith("Panel") &&
                type !== "FormButton" &&
                type !== "SubmitButton" &&
                type !== "Spacer" &&
                type !== "HTML") {
                let value = control.GetValue();
                if (value === null) {
                    value = "";
                }
                data[name] = type === "Date" ? Sys.Helpers.Date.Date2DBDate(value) : value;
            }
        });
        return data;
    }
    function Run() {
        Process.ShowFirstErrorAfterBoot(false);
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        globalLayout.ShowWaitScreen();
        globalLayout.Hide(true);
        const initPromises = [];
        const OnloadPromise = Sys.Helpers.TryCallFunction("Lib.Project.Customization.Client.OnLoad");
        if (OnloadPromise) {
            initPromises.push(OnloadPromise);
        }
        if (gComesFromProject) {
            FeedFromProject();
        }
        initPromises.push(Lib.ModuleProject.LoadUserProperties());
        Sys.Helpers.Promise.All(initPromises)
            .Then(() => {
            globalLayout.Hide(false);
            const main = new Main();
            main.Start();
        })
            .Catch(reason => {
            Log.Error("GlobalError : " + reason);
        })
            .Finally(() => {
            globalLayout.HideWaitScreen();
            // Work Arround for function OnLoad not called
            Controls.HTMLProgressBar__.FireEvent("handler", { value: Controls.Progress__.GetValue(), disabled: ProcessInstance.isReadOnly });
            ProcessInstance.SetSilentChange(false);
            Process.ShowFirstError();
        });
    }
    CustomScript.Run = Run;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Run();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map