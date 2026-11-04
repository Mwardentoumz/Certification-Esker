"use strict";
/* Order Confirmation Vendor HTML page script */
/* eslint-disable dot-notation,class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    class Main {
        constructor(panes = ["BannerPanel", "ActionsPanel", "HeaderPanel", "ItemsPanel", "OrderInfo", "ConversationPanel"], buttons = ["Submit__", "Save__", "Quit__", "Delete__", "RefreshPreview__"], deprecatedControls = [], globalLayout = new Lib.P2P.Layout.Manager(panes, buttons, Object.values(Lib.P2P.Layout.Splitter), deprecatedControls)) {
            this.panes = panes;
            this.buttons = buttons;
            this.deprecatedControls = deprecatedControls;
            this.globalLayout = globalLayout;
        }
        async InitControls() {
            const banner = Sys.Helpers.Banner;
            banner.SetMainTitle("_S2P - Order Confirmation Vendor");
            banner.SetSubTitleAligned(true);
            banner.SetCentered(false);
            banner.SetHTMLBanner(Controls.HTMLBanner__);
            banner.SetStatusCombo(Controls.Status__);
            banner.SetSubTitle();
            Controls.form_header.SetProcessDisplayName("_S2P - Order Confirmation Vendor");
            Controls.LineItems__.SetExtendableColumn("ItemDescription__");
            Controls.LineItems__.ItemOCType__.SetWidth(110);
            this.InitConversation();
        }
        InitConversation() {
            Controls.Conversation__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsSupplier));
        }
        async InitData() {
            Lib.Purchasing.OCVendor.UpdateAllItemsRejectedTmpData();
        }
        InitEvents() {
            Controls.LineItems__.ItemOCType__.OnChange = Lib.Purchasing.OCVendor.OnChangeItemOCType;
            Controls.LineItems__.ItemRequestedDeliveryDate__.OnChange = function () {
                const item = this.GetItem();
                const row = this.GetRow();
                Lib.Purchasing.OCVendor.ValidateItemDeliveryDate(item, row.GetLineNumber(true) - 1);
            };
            Controls.LineItems__.ItemQuantity__.OnChange = function () {
                const item = this.GetItem();
                Lib.Purchasing.OCVendor.ValidateItemQuantity(item);
                Lib.Purchasing.ModuleOC.FillTotalNetAmount();
            };
            Controls.LineItems__.ItemUnitPrice__.OnChange = function () {
                const item = this.GetItem();
                Lib.Purchasing.OCVendor.ValidateItemUnitPrice(item);
                Lib.Purchasing.ModuleOC.FillTotalNetAmount();
            };
            Controls.LineItems__.ItemNetAmount__.OnChange = function () {
                const item = this.GetItem();
                Lib.Purchasing.OCVendor.ValidateItemNetAmount(item);
                Lib.Purchasing.ModuleOC.FillTotalNetAmount();
            };
            Controls.Submit__.OnClick = function () {
                Lib.Purchasing.OCVendor.CheckRequiredFields();
                return Process.ShowFirstError() === null;
            };
            Controls.Delete__.OnClick = function () {
                Popup.Confirm("_Delete OC explanation", false, () => ProcessInstance.Approve("Delete__"), null, "_Delete OC title");
                return false;
            };
        }
        async Start() {
            Process.ShowFirstErrorAfterBoot(false);
            Sys.Helpers.EnableSmartSilentChange();
            ProcessInstance.SetSilentChange(true);
            this.globalLayout.HidePanes(true);
            this.globalLayout.HideDeprecatedControls();
            this.globalLayout.ShowWaitScreen();
            Controls.TopPaneWarning.Hide(); // prevent panel from flashing
            Process.SetHelpId("5154");
            await Sys.Parameters.GetInstance("PAC").PromisedIsReady();
            await Lib.Purchasing.OCVendor.InitConfirmedFieldsDefinition();
            await this.InitData();
            await Sys.Helpers.TryCallFunction("Lib.OCVendor.Customization.Client.OnLoad");
            await this.InitControls();
            this.InitEvents();
            await Lib.Purchasing.OCVendor.FormTemplate.SetupFormTemplateManager();
            Sys.Helpers.TryCallFunction("Lib.OCVendor.Customization.Client.CustomizeLayout", Lib.Purchasing.OCVendor.FormTemplate.formTemplateManager);
            this.globalLayout.HideWaitScreen();
            ProcessInstance.SetSilentChange(false);
            Lib.CommonDialog.NextAlert.Show();
            Process.ShowFirstError();
        }
    }
    CustomScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        main.Start();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map