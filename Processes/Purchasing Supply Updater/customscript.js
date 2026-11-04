"use strict";
/* eslint-disable class-methods-use-this */
var CustomScript;
(function (CustomScript) {
    var SupplyType = Lib.Purchasing.SupplyType;
    var Banner = Sys.Helpers.Banner;
    class Main {
        get hasError() {
            return !!Data.GetValue("ErrorCount__");
        }
        get statusKey() {
            if (Variable.GetValueAsString("NextCompanyCode")) {
                return "_FormBanner_SubTitle_Processing";
            }
            if (this.hasError) {
                return "_FormBanner_SubTitle_WithError";
            }
            return "_FormBanner_SubTitle_Success";
        }
        Start() {
            Sys.Helpers.EnableSmartSilentChange();
        }
        DisplayBanner() {
            Banner.SetHTMLBanner(Controls.HTMLBanner__);
            Banner.SetMainTitle("_FormBannerTitle");
            Banner.SetSubTitle(this.statusKey);
        }
        InitLayout() {
            this.DisplayBanner();
            Controls.CompanyCode__.Hide(Data.IsNullOrEmpty("CompanyCode__"));
            Controls.SupplyID__.Hide(Data.IsNullOrEmpty("SupplyID__"));
            Controls.ErrorCount__.Hide(!this.hasError);
            Controls.NoActionCount__.Hide(Data.IsNullOrEmpty("NoActionCount__"));
            Controls.UpdateCount__.Hide(Data.IsNullOrEmpty("UpdateCount__"));
            Controls.ErrorsTable__.SetExtendableColumn("Errors__");
        }
        async DisplaySummary() {
            var _a;
            const summary = SupplyType.ReadSummary();
            if (summary && summary.errors.length) {
                Controls.ErrorsPanel.SetLabel(Language.Translate("_ErrorsPane", true));
                let displayParentColumns = false;
                for (const line of summary.errors) {
                    const item = Controls.ErrorsTable__.AddItem();
                    item.SetValue("CompanyCode__", line.companyCode);
                    await SupplyType.manager.Query(line.companyCode);
                    const supply = SupplyType.manager.GetFromCache(line.companyCode, line.id);
                    item.SetValue("SupplyId__", line.id);
                    item.SetValue("SupplyName__", supply.name);
                    item.SetValue("Errors__", (_a = line.errors) === null || _a === void 0 ? void 0 : _a.join("\n"));
                    if (!!line.parentId) {
                        displayParentColumns = true;
                        item.SetValue("ParentId__", line.parentId);
                        const parentSupply = SupplyType.manager.GetFromCache(line.companyCode, line.parentId);
                        if (parentSupply) {
                            item.SetValue("ParentName__", parentSupply.name);
                        }
                    }
                }
                if (displayParentColumns) {
                    Controls.ErrorsTable__.ParentId__.Hide(false);
                    Controls.ErrorsTable__.ParentName__.Hide(false);
                }
                Controls.ErrorsTable__.Errors__.Hide(!this.hasError);
                Controls.ErrorsPanel.Hide(false);
            }
        }
    }
    class PopupForAdminList {
        async Start() {
            Sys.Helpers.Object.ForEach(Controls, function (control) {
                const type = control.GetType();
                if (type.startsWith("Panel")) {
                    control.Hide(true);
                }
            });
            Lib.CommonDialog.PopupYesCancel((action) => {
                if (action === "Yes" /* Lib.CommonDialog.Action.Yes */) {
                    ProcessInstance.ApproveAsynchronous(SupplyType.Action.CheckTableIntegrity);
                }
                ProcessInstance.Quit("quit");
            }, "_PopupStartupMode_Title", "_PopupStartupMode_Message", "_ValidateDialog", "_CancelDialog", 5149);
        }
    }
    async function Run() {
        if (typeof _ENV_TEST_ENABLED === "undefined") {
            const panes = ["DetailsPane", "DocumentPane"];
            const buttons = ["Save", "Approve", "Reject", "Reprocess", "Close"];
            const layout = new Lib.P2P.Layout.Manager(panes, buttons);
            try {
                layout.ShowWaitScreen();
                if (ProcessInstance.isOpenInPopup) {
                    const popup = new PopupForAdminList();
                    await popup.Start();
                }
                else {
                    const main = new Main();
                    main.InitLayout();
                    main.Start();
                    await main.DisplaySummary();
                }
            }
            finally {
                layout.HideWaitScreen();
            }
        }
    }
    Run();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map