"use strict";
var CustomScript;
(function (CustomScript) {
    Log.Time("CustomScript");
    async function InitCompanyCodeConfiguration() {
        await Lib.Sourcing.RFQ.InitCompanyCode();
        await Lib.Sourcing.RFQ.CompanyCodeManager.UpdateDependencies(true);
    }
    CustomScript.InitCompanyCodeConfiguration = InitCompanyCodeConfiguration;
    function InitBanner() {
        const banner = Sys.Helpers.Banner;
        banner.SetStatusCombo(Controls.RFQStatus__);
        banner.SetHTMLBanner(Controls.HTMLBanner__);
        banner.SetMainTitle("_Request For Quote");
        banner.SetSubTitle();
    }
    CustomScript.InitBanner = InitBanner;
    function InitRequester() {
        if (Sys.Helpers.IsEmpty(Controls.RequesterID__.GetValue())) {
            Log.Info("Setting requester to " + User.loginId);
            Controls.RequesterID__.SetValue(User.loginId);
            Controls.RequesterName__.SetValue(User.fullName);
        }
    }
    CustomScript.InitRequester = InitRequester;
    function InitHelpID() {
        const helpIdDraft = 5163;
        const helpIdInProgress = 5164;
        const helpId = Data.GetValue("RFQStatus__") === "Draft" /* Lib.Sourcing.RFQStatus.Draft */ ? helpIdDraft : helpIdInProgress;
        Process.SetHelpId(helpId);
    }
    async function InitOOTOOrAdminBanner() {
        const topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
        Lib.P2P.DisplayBackupUserWarning("PAC", (displayName) => {
            topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName));
        }, () => {
            if (User.IsBackupUserOf(Data.GetValue("OwnerID"))) {
                return Data.GetValue("OwnerID");
            }
            return null;
        });
        await Lib.P2P.DisplayAdminWarning("PAC", function (displayName) {
            topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
        });
    }
    async function Init() {
        CustomScript.documentViewer = new Lib.Sourcing.RFQ.Viewer();
        const documentsTableHandler = new Lib.Sourcing.DocumentsTable.RFQDocumentsHandler(Controls.QuoteDocumentsTable__);
        documentsTableHandler.Init();
        Lib.Sourcing.RFQ.ConditionalLayout(documentsTableHandler.HasItem());
        Lib.Sourcing.RFQ.globalLayout.HideDeprecatedControls();
        if (Process.GetURL().indexOf("#InputData") >= 0 && !Variable.GetValueAsString("RFQData")) {
            await Lib.Sourcing.RFQ.FillRFQFromFragmentData();
        }
        await Lib.Sourcing.RFQ.FormTemplate.SetupFormTemplateManager();
        await Lib.Sourcing.RFQ.FormTemplate.UpdateAsyncTmpData();
        Lib.Sourcing.RFQ.FormTemplate.UpdateTmpData();
        Lib.Sourcing.RFQ.InitGeneralInformations();
        await Lib.Sourcing.RFQ.Suppliers.InitPane();
        await Lib.Sourcing.RFQ.InitItemsToSource();
        Lib.Sourcing.RFQ.AI.Init();
        InitHelpID();
        if (Lib.Sourcing.RFQ.IsInDashboardLayout()) {
            const RFQVendors = await Lib.Sourcing.RFQ.GetVendorProcessMap();
            await Lib.Sourcing.RFQ.Comparator.InitPane(RFQVendors);
            Lib.Sourcing.RFQ.Suppliers.InitCounters();
            Lib.Sourcing.RFQ.ButtonsBar.InitInProgressEvents(RFQVendors);
            Lib.Sourcing.RFQ.InitOverviewPane();
            Lib.Sourcing.RFQ.Conversation.InitConversationList();
            await Lib.Sourcing.RFQ.Award.UpdateTopMessageWarning();
        }
        else {
            if (Lib.Sourcing.RFQ.TmpData.IsEditLayout) {
                Lib.Sourcing.RFQ.Edition.Init();
                Lib.Sourcing.RFQ.Suppliers.InitEditing();
            }
            InitBanner();
            InitRequester();
            Lib.Sourcing.RFQ.InitDraftEvents(documentsTableHandler);
            Lib.Sourcing.RFQ.InitTransmittedInformation();
            Lib.Sourcing.RFQ.Questionnaire.Init();
        }
        await InitOOTOOrAdminBanner();
        await Lib.Sourcing.RFQ.FormTemplate.formTemplateManager.WaitUntilNoMoreChange();
    }
    CustomScript.Init = Init;
    async function Start() {
        Sys.Helpers.EnableSmartSilentChange();
        // START - ignore all changes on form during the initialization processing
        ProcessInstance.SetSilentChange(true);
        Process.ShowFirstErrorAfterBoot(false);
        Lib.Sourcing.RFQ.globalLayout.Hide(true);
        Lib.Sourcing.RFQ.globalLayout.ShowWaitScreen();
        try {
            await Sys.Parameters.IsReady();
            await CustomScript.InitCompanyCodeConfiguration();
            const isSAP = Lib.ERP.GetBrowseERPName("PAC") === "SAP";
            if (isSAP) {
                Lib.P2P.Browse.InitSAPVariable();
                Controls.Suppliers__.SupplierName__.SetAllowTableValuesOnly(false);
            }
            await CustomScript.Init();
        }
        catch (reason) {
            Log.Error("GlobalError : " + reason);
        }
        finally {
            Lib.Sourcing.RFQ.globalLayout.HideWaitScreen();
        }
        const hasPendingNextAlert = !!Lib.CommonDialog.NextAlert.GetNextAlert();
        Lib.CommonDialog.NextAlert.Show({
            "RFQCreationInfo": {
                IsShowable: function () {
                    const action = Data.GetActionName();
                    return !!action && action !== "Edit_";
                },
                OnOK: function () {
                    // Close or go to the next document
                    if (!ProcessInstance.Next("next")) {
                        ProcessInstance.Quit("quit");
                    }
                }
            },
        });
        const isBeingProcessed = (ProcessInstance.state < 70 && ProcessInstance.isReadOnly && Data.GetValue("RFQStatus__") === "Draft" /* Lib.Sourcing.RFQStatus.Draft */);
        if (isBeingProcessed && !hasPendingNextAlert) {
            Popup.Alert("_ExitFormDocumentProcessingMessage", false, null, "_ExitFormDocumentProcessingTitle");
        }
        Lib.CommonDialog.NextAlert.Reset();
        ProcessInstance.SetSilentChange(false);
    }
    CustomScript.Start = Start;
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map