"use strict";
var CustomScript;
(function (CustomScript) {
    CustomScript.documentViewer = new Lib.Sourcing.RFQVendor.Viewer();
    Log.Time("CustomScript");
    async function LoadConfiguration() {
        Log.Info("LoadConfiguration");
        const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(Data.GetValue("CompanyCode__"));
        await Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__ || "default");
    }
    CustomScript.LoadConfiguration = LoadConfiguration;
    function InitBanner() {
        const banner = Sys.Helpers.Banner;
        banner.SetSubTitleAligned(true);
        banner.SetCentered(false);
        banner.SetStatusCombo(Controls.RFQStatus__);
        banner.SetHTMLBanner(Controls.HTMLBanner__);
        banner.SetMainTitle("_Request For Quote Vendor");
        banner.SetSubTitle();
        Controls.form_header.SetProcessDisplayName("_Request For Quote");
    }
    CustomScript.InitBanner = InitBanner;
    async function Init() {
        const documentsTableHandler = new Lib.Sourcing.DocumentsTable.RFQVendorDocumentsHandler(Controls.DocumentsNotInDB__, Controls.AnswerDocumentsNotInDB__);
        documentsTableHandler.Init();
        const displayedPane = [
            "Banner",
            "GeneralInformationPanel",
            "ItemsPane",
            "ActionsPanel",
            "TransmittedInformationPane"
        ];
        if (documentsTableHandler.HasItem(Controls.DocumentsNotInDB__)) {
            displayedPane.push("DocumentsPane");
        }
        if (documentsTableHandler.HasItem(Controls.AnswerDocumentsNotInDB__) || !ProcessInstance.isReadOnly) {
            displayedPane.push("AnswerDocumentPane");
        }
        if (Lib.Sourcing.RFQVendor.HasQuestionnaire()) {
            displayedPane.push("QuestionnairePane");
        }
        Lib.Sourcing.RFQVendor.globalLayout.DisplayPanels(displayedPane);
        Lib.Sourcing.RFQVendor.globalLayout.HideDeprecatedControls();
        await Lib.Sourcing.RFQVendor.FormTemplate.SetupFormTemplateManager();
        Lib.Sourcing.RFQVendor.FormTemplate.UpdateTmpData();
        Process.SetHelpId(5166);
        InitBanner();
        Lib.Sourcing.RFQVendor.InitEvents(documentsTableHandler);
        Lib.Sourcing.RFQVendor.InitItemsToSource();
        Lib.Sourcing.RFQVendor.InitConversation();
        Lib.Sourcing.RFQVendor.InitQuestionnaire();
    }
    CustomScript.Init = Init;
    async function Start() {
        Sys.Helpers.EnableSmartSilentChange();
        // START - ignore all changes on form during the initialization processing
        ProcessInstance.SetSilentChange(true);
        Lib.Sourcing.RFQVendor.globalLayout.Hide(true);
        Lib.Sourcing.RFQVendor.globalLayout.ShowWaitScreen();
        try {
            await CustomScript.LoadConfiguration();
            await CustomScript.Init();
        }
        catch (reason) {
            Log.Error("GlobalError : " + reason);
        }
        finally {
            Lib.Sourcing.RFQVendor.globalLayout.HideWaitScreen();
        }
        Lib.CommonDialog.NextAlert.Show();
        ProcessInstance.SetSilentChange(false);
    }
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map