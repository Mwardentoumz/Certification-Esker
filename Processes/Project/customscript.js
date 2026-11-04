"use strict";
/* eslint-disable class-methods-use-this */
var CustomScript;
(function (CustomScript) {
    var CompanyCodesValue = Lib.P2P.CompanyCodesValue;
    var ProcessStatus = Lib.Project.ProcessStatus;
    const CompanyCodeManager = {
        previousCompanyCode: "",
        Init: function CCManagerInit() {
            Controls.CompanyCode__.OnSelectItem = function () {
                setTimeout(() => {
                    Popup.Confirm("_This action will delete company code related fields.", false, CompanyCodeManager.UpdateCompanyCodeDependencies, CompanyCodeManager.RevertCompanyCode, "_Warning");
                });
            };
        },
        InitConfiguration: async function () {
            var _a;
            const newcc = Data.GetValue("CompanyCode__");
            const CCValues = await CompanyCodesValue.QueryValues(newcc);
            if (Object.keys(CCValues).length) {
                await Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__, ["Project"]);
                await ((_a = CCValues.currencies) === null || _a === void 0 ? void 0 : _a.QueryRate());
                CompanyCodeManager.SetDefaultCCValuesOnForm();
            }
            else {
                Data.SetError("CompanyCode__", "_This CompanyCode does not exist in the table.");
                Log.Error("The requested company code is not in the company code table.");
            }
        },
        UpdateCompanyCodeDependencies: async function () {
            CompanyCodeManager.previousCompanyCode = Data.GetValue("CompanyCode__");
            Lib.Project.Navigation.projectLayout.ShowWaitScreen();
            const updatePromise = CompanyCodeManager.InitConfiguration()
                .finally(() => {
                Lib.Project.Navigation.projectLayout.HideWaitScreen();
            });
            Sys.Helpers.Synchronizer.OnProgressFromPromise(updatePromise, {
                progressDelay: 15000,
                OnProgress: Lib.P2P.OnSynchronizerProgress
            });
        },
        RevertCompanyCode: function () {
            Controls.CompanyCode__.SetValue(CompanyCodeManager.previousCompanyCode);
        },
        SetPreviousCompanyCode: function (companyCode) {
            CompanyCodeManager.previousCompanyCode = companyCode;
        },
        SetDefaultCCValuesOnForm: function () {
            let CCValues = Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__"));
            if (Object.keys(CCValues).length > 0) {
                const EnablePurchasingGlobalSetting = Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnablePurchasingGlobalSetting__ && ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableStandardPurchasingGlobalSetting__);
                const EnableAccountPayableGlobalSetting = Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableAccountPayableGlobalSetting__);
                if (EnablePurchasingGlobalSetting || EnableAccountPayableGlobalSetting) {
                    const currency = CCValues.Currency__ || "";
                    Controls.MaxAmount__.SetLabel(Language.Translate("_MaxAmountCurrency", true, currency));
                    Data.SetValue("Currency__", currency);
                }
            }
        }
    };
    class Main {
        constructor(userProperties) {
            this.notificationTableHandler = Lib.Project.Notification.tableHandler;
            this.HasMarketDojoCredentials = false;
            this.EnableMarketDojoIntegration = Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableMarketDojoIntegration__);
            this.EnableContractGlobalSetting = Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableContractGlobalSetting__);
            this.EnablePurchasingGlobalSetting = Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnablePurchasingGlobalSetting__ && ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableStandardPurchasingGlobalSetting__);
            this.EnableAccountPayableGlobalSetting = Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableAccountPayableGlobalSetting__);
            //Sourcing - Checking whether user has Market Dojo creds to determine Events display
            this.HasMarketDojoCredentials = userProperties.HasMarketDojoCredentials();
        }
        //#region Initialisation
        /**
         * @description	Initialize some TmpData during the runtime of client
         * @returns 	void
         */
        async InitData() {
            // Update Edition mode for formtemplate
            const ownerLogin = Data.GetValue("OwnerLogin__");
            Lib.Project.TmpData.IsAdminOrOwner = Lib.P2P.IsAdmin() || User.loginId === ownerLogin || User.IsMemberOf(ownerLogin) || User.IsBackupUserOf(ownerLogin);
            // Init TechnicalData and default values
            if (Sys.Helpers.IsEmpty(Controls.ProjectMadeBy__.GetValue())) {
                Data.SetValue("ProjectMadeBy__", User.fullName);
            }
            if (Sys.Helpers.IsEmpty(Controls.OwnerName__.GetValue())) {
                Data.SetValue("OwnerName__", User.fullName);
                Data.SetValue("OwnerLogin__", User.loginId);
                Sys.TechnicalData.SetValue("ProjectOwner", {
                    IsGroup: false,
                    Name: User.fullName,
                    Login: User.loginId
                }); // Note: OwnerId is not used when !IsGroup
            }
            await Lib.P2P.UsersBrowse.Init({
                browsedControl: Controls.Members__,
                storageName: Lib.Project.Members.membersTechnicalDataName,
                storageType: Lib.P2P.UsersBrowse.StorageType.TechnicalData,
                dialogTitle: "_MembersPopup_Title",
                select2CtrlOptions: Lib.Project.Members.GetMembersOptions(),
                select2CtrlLabel: "_MembersPopup_Members",
                storeDisplayName: true,
                onDialogSubmitCallback: Lib.Project.Members.OnDialogSubmitCallback
            });
            if (Sys.Helpers.IsEmpty(Controls.CreationDateTime__.GetValue())) {
                Data.SetValue("CreationDateTime__", new Date());
            }
            // valorizing TechnicalData with project values before user changes them
            const data = {};
            Sys.Helpers.Object.ForEach(Lib.Project.ProjectFieldsImpactingTasks, (taskKey, projectKey) => {
                var _a;
                data[projectKey] = (_a = Data.GetValue(projectKey)) !== null && _a !== void 0 ? _a : "";
            });
            Sys.TechnicalData.SetValue("ProjectFieldsImpactingTasks", data);
        }
        /**
         * @description	Initialize Controls behaviour for header fiels (pane GeneralInformation)
         * @returns 	void
         */
        InitControls() {
            Lib.Project.SetupFormTemplateManager();
            //#region Owner control
            const OnSelectOwner = (item) => {
                const selectedOwner = {
                    IsGroup: item.GetValue("IsGroup") === "1",
                    Name: item.GetValue("DisplayName"),
                    Login: item.GetValue("Login"),
                    OwnerId: item.GetValue("OwnerId")
                };
                Lib.Project.ConfirmSelectedOwner(selectedOwner);
            };
            const OnUnknownOrEmptyOwner = () => {
                Lib.Project.ConfirmSelectedOwner();
            };
            Controls.OwnerName__.SetImageColumn("DisplayName", {
                "IsGroup": [{ value: "1", imageUrl: Lib.P2P.GetP2PUserImage(true) }],
                "defaultImageUrl": Lib.P2P.GetP2PUserImage(false)
            }, 18);
            Controls.OwnerName__.SetAttributes("OwnerId");
            Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.OwnerName__, OnSelectOwner, OnUnknownOrEmptyOwner, OnUnknownOrEmptyOwner);
            //#endregion
            // On creation, cancel and done status not available
            if (!Data.GetValue("ProjectNumber__")) {
                const creationStatus = Controls.Status__.GetAvailableValues()
                    .filter(keyLabel => {
                    const key = keyLabel.split("=")[0];
                    return ["Done", "Canceled"].indexOf(key) === -1;
                });
                Controls.Status__.SetAvailableValues(creationStatus);
            }
            Controls.EndDate__.OnChange = () => {
                Lib.Project.IsStartEndDateValid("StartDate__", "EndDate__");
                if (Lib.Project.TmpData.DisplayGanttView) {
                    Lib.Project.Gantt.ganttManager.Fill();
                }
                this.notificationTableHandler.UpdateFromFormData();
            };
            Controls.StartDate__.OnChange = () => {
                Lib.Project.IsStartEndDateValid("StartDate__", "EndDate__");
                if (Lib.Project.TmpData.DisplayGanttView) {
                    Lib.Project.Gantt.ganttManager.Fill();
                }
                this.notificationTableHandler.UpdateFromFormData();
            };
            Controls.MaxAmount__.OnChange = () => {
                if (Controls.MaxAmount__.GetValue() > 0 || Sys.Helpers.IsEmpty(Controls.MaxAmount__.GetValue())) {
                    this.notificationTableHandler.UpdateFromFormData();
                }
            };
            if (this.EnablePurchasingGlobalSetting || this.EnableAccountPayableGlobalSetting) {
                Lib.Project.Spending.InitSpendingInformationVisibility();
                Lib.Project.Spending.InitSpendingInformation();
            }
        }
        /**
         * @description	Initialize global Action behaviour of the form
         * @returns 	void
         */
        InitActions() {
            const currentStatus = Controls.Status__.GetValue();
            const CheckErrorAndSave = () => {
                // Can't save without a CompanyCode or ProjectName
                const requiredFields = ["Name__", "CompanyCode__", "OwnerName__"];
                let showError = false;
                for (const field of requiredFields) {
                    if (Sys.Helpers.IsEmpty(Controls[field].GetValue())) {
                        Controls[field].SetError("This field is required!");
                        Controls[field].ShowErrorMessage();
                        showError = true;
                    }
                }
                showError || (showError = !Lib.Project.IsStartEndDateValid("StartDate__", "EndDate__"));
                showError || (showError = !this.notificationTableHandler.SaveNotifications());
                if (showError) {
                    Process.ShowFirstError();
                }
                else {
                    Lib.Project.Save(currentStatus);
                }
                return false; // prevent the default click action
            };
            Controls.Edit_.OnClick = () => {
                Data.StorageSetValue(this.storageKeyForAnchorWhenStartingEditMode, Lib.Project.Navigation.manager.GetSelected());
                ProcessInstance.Edit_("");
            };
            Controls.Save.OnClick = CheckErrorAndSave;
            Controls.ReOpen_.OnClick = () => Lib.Project.ReOpen();
        }
        /**
         * @description	Initialize Banner value with the correct Status
         * @returns 	void
         */
        InitBanner() {
            Sys.Helpers.Banner.SetStatusCombo(Controls.Status__);
        }
        /**
         * @description	Initialize the NaviationDrawer control with correct conditional element
         * @returns 	void
         */
        InitNavigation() {
            Lib.Project.Navigation.manager.AddAvailableItem("Informations");
            Lib.Project.Navigation.manager.AddAvailableItem("Document");
            const notificationEnable = this.EnablePurchasingGlobalSetting || this.EnableAccountPayableGlobalSetting;
            if (!Lib.Project.TmpData.InEditionMode) {
                Lib.Project.Navigation.manager.AddAvailableItem("Tasks");
                if (this.EnableMarketDojoIntegration && this.HasMarketDojoCredentials) {
                    Lib.Project.Navigation.manager.AddAvailableItem("Events");
                }
                if (this.EnableContractGlobalSetting) {
                    Lib.Project.Navigation.manager.AddAvailableItem("Contracts");
                }
                if (this.EnablePurchasingGlobalSetting) {
                    Lib.Project.Navigation.manager.AddAvailableItem("Orders");
                }
                if (this.EnableAccountPayableGlobalSetting) {
                    Lib.Project.Navigation.manager.AddAvailableItem("Invoices");
                }
                if (this.EnablePurchasingGlobalSetting || this.EnableAccountPayableGlobalSetting) {
                    Lib.Project.Navigation.manager.AddAvailableItem("Spending");
                }
                if (notificationEnable) {
                    Lib.Project.Navigation.manager.AddAvailableItem("Notification");
                }
            }
            else {
                Lib.Project.Navigation.manager.RemovePaneOnItem("Informations", "CounterPanel");
                Lib.Project.Navigation.manager.RemovePaneOnItem("Informations", "Archive_Details");
                if (notificationEnable) {
                    Lib.Project.Navigation.manager.AddPaneOnItem("Informations", "Notification");
                }
            }
        }
        /**
         * @description	Initialize the content of the page with the menu content
         * @returns 	void
         */
        InitLayoutWithMenu() {
            Lib.Project.Navigation.manager.UpdateMenu();
            //Select default menu
            this.storageKeyForAnchorWhenStartingEditMode = "ESKnavigationDrawerAnchorWhenStartingEditMode" + Data.GetValue("RuidEx");
            const menuItemLocalStorage = Data.StorageGetValue(this.storageKeyForAnchorWhenStartingEditMode);
            if (!Sys.Helpers.IsEmpty(menuItemLocalStorage)) {
                Data.CleanLocalStorage(this.storageKeyForAnchorWhenStartingEditMode);
                Lib.Project.Navigation.manager.SelectItem(menuItemLocalStorage);
            }
            else {
                Lib.Project.Navigation.manager.SelectItem("Informations");
            }
            Lib.Project.RefreshTotalTasksNumber(Lib.Project.Navigation.manager);
            Lib.Project.RefreshLateTasksNumber(Lib.Project.Navigation.manager);
            const promises = [];
            if (this.EnablePurchasingGlobalSetting) {
                promises.push(Lib.Project.OrdersTable.manager.Init());
                const orderDashboardCounter = new Lib.Project.OrdersDashCounter.DashboardCounter(Lib.Project.OrdersTable.manager);
                orderDashboardCounter.OnClick = () => {
                    Lib.Project.Navigation.manager.SelectItem("Orders");
                };
                promises.push(orderDashboardCounter.Init());
            }
            if (this.EnableAccountPayableGlobalSetting) {
                promises.push(Lib.Project.InvoicesTable.manager.Init());
                const invoicesDashboardCounter = new Lib.Project.InvoicesDashCounter.DashboardCounter(Lib.Project.InvoicesTable.manager);
                invoicesDashboardCounter.OnClick = () => {
                    Lib.Project.Navigation.manager.SelectItem("Invoices");
                };
                promises.push(invoicesDashboardCounter.Init());
            }
            if (this.EnablePurchasingGlobalSetting || this.EnableAccountPayableGlobalSetting) {
                Lib.Project.Spending.InitOperationDetailsView();
            }
            return promises;
        }
        /**
         * @description	Initialize Archive data with P2P parameter
         * @returns 	void
         */
        InitArchiving() {
            if (!Data.GetValue("ProjectNumber__")) {
                Controls.ArchiveDurationInMonths__.SetValue(Sys.Parameters.GetInstance("Project").GetParameter("ProjectArchiveDurationInMonths"));
            }
        }
        //#endregion
        /**
         * @description	Beginnig of the runtime of the Process Project
         * @returns 	Promise<any>
         */
        async Start() {
            Log.Info("Start custom script");
            Lib.CommonDialog.NextAlert.Show({});
            let promises = [];
            Controls.form_header.SetProcessDisplayName(Language.Translate("_Project"));
            // Pass the information wether the account is a demo account or not to the server
            Variable.SetValueAsString("InDemoAccount", User.isInDemoAccount ? "1" : "0");
            this.InitNavigation();
            await this.InitData();
            this.InitActions();
            this.InitControls();
            this.InitArchiving();
            this.InitBanner();
            await this.notificationTableHandler.InitNotificationPane();
            Lib.ModuleProject.InitWarnings();
            switch (Data.GetValue("Status__")) {
                case ProcessStatus.Draft:
                case ProcessStatus.InProgress:
                case ProcessStatus.Done:
                case ProcessStatus.Canceled:
                    break;
                default:
                    throw new Error("Invalid status");
            }
            if (Data.GetValue("ProjectNumber__")) {
                promises = this.InitLayoutWithMenu();
            }
            else {
                Lib.Project.Navigation.projectLayout.DisplaySplitters([Lib.P2P.Layout.Splitter.Middle, Lib.P2P.Layout.Splitter.Right]);
                Lib.Project.Navigation.projectLayout.DisplayPanels(["Title", "GeneralInformation", "PreviewPanel", "Archive_Details"]);
            }
            return Sys.Helpers.Promise.All(promises);
        }
    }
    CustomScript.Main = Main;
    async function Run() {
        Process.ShowFirstErrorAfterBoot(false);
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        Lib.Project.Navigation.projectLayout.ShowWaitScreen();
        Lib.Project.Navigation.projectLayout.Hide(true);
        try {
            const userProperties = await Lib.ModuleProject.LoadUserProperties();
            CompanyCodeManager.Init();
            CompanyCodeManager.SetPreviousCompanyCode(Data.GetValue("CompanyCode__"));
            await CompanyCodeManager.InitConfiguration();
            const main = new Main(userProperties);
            if (main.EnablePurchasingGlobalSetting || main.EnableAccountPayableGlobalSetting) {
                CompanyCodeManager.SetDefaultCCValuesOnForm();
            }
            await Sys.Helpers.TryCallFunction("Lib.Project.Customization.Client.OnLoad");
            Lib.Project.Navigation.projectLayout.Hide(false);
            Lib.Project.Navigation.projectLayout.HideDeprecatedControls();
            return await main.Start();
        }
        catch (reason) {
            Log.Error("GlobalError : " + reason);
        }
        finally {
            Lib.Project.Navigation.projectLayout.HideWaitScreen();
            ProcessInstance.SetSilentChange(false);
            Process.ShowFirstError();
        }
    }
    CustomScript.Run = Run;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Run();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map