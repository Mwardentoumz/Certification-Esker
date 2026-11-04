"use strict";
/* Bulk Receipt HTML page script */
/* eslint-disable dot-notation */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    // List of BR status : "Draft" | "Canceled" | "Success" | "Partial success" | "Error";
    async function IsValid() {
        const isValid = Process.ShowFirstError() === null;
        const customIsValid = await Sys.Helpers.TryCallFunction("Lib.BR.Customization.Common.OnValidateForm", isValid);
        if (typeof customIsValid === "boolean") {
            return customIsValid;
        }
        return isValid;
    }
    class Main {
        constructor(panes = ["GeneralInformation", "DocumentsPanel", "LineItems"], buttons = ["Approve", "Quit"], globalLayout = new Lib.P2P.Layout.Manager(panes, buttons), startInPopup = ProcessInstance.isOpenInPopup, selectedRuidEx = ProcessInstance.selectedRuidFromView, popupDialog = Lib.Purchasing.BR.CreatePopupDialog(), topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__), bulkActionsManager = null, bulkReceiptItemsManager = Lib.Purchasing.BR.Items.bulkReceiptItemsManager) {
            this.panes = panes;
            this.buttons = buttons;
            this.globalLayout = globalLayout;
            this.startInPopup = startInPopup;
            this.selectedRuidEx = selectedRuidEx;
            this.popupDialog = popupDialog;
            this.topMessageWarning = topMessageWarning;
            this.bulkActionsManager = bulkActionsManager;
            this.bulkReceiptItemsManager = bulkReceiptItemsManager;
            this.bulkActionsManager = new Lib.P2P.BulkActions.Manager(Controls.LineItems__, [
                {
                    actionParameters: {
                        controlName: "FillDeliveredQuantities__",
                        options: {
                            buttonLabel: "_FillDeliveredQuantities",
                            isOutline: true,
                            isRounded: true,
                            url: "",
                            style: 1
                        }
                    },
                    onClick: () => this.bulkReceiptItemsManager.FillDeliveredQuantities()
                },
                {
                    actionParameters: {
                        controlName: "ResetDeliveredQuantities__",
                        options: {
                            buttonLabel: "_ResetDeliveredQuantities",
                            isOutline: true,
                            isRounded: true,
                            style: 1
                        }
                    },
                    onClick: this.bulkReceiptItemsManager.ResetDeliveredQuantities
                }
            ]);
        }
        InitControls() {
            const banner = Sys.Helpers.Banner;
            banner.SetStatusCombo(Controls.BRStatus__);
            banner.SetHTMLBanner(Controls.HTMLBanner__);
            banner.SetMainTitle("BulkReceipt");
            banner.SetSubTitle();
            // former field DeliveryDate__ doesn't exist anymore - always hide
            if (Controls["DeliveryDate__"]) {
                Controls["DeliveryDate__"].Hide(true);
                Controls["DeliveryDate__"].SetRequired(false);
                Controls["DeliveryDate__"].SetReadOnly(true);
            }
            Controls.LineItems__.SetWidth("100%");
            Controls.LineItems__.SetExtendableColumn("Description__");
            Controls.Approve.OnClick = async () => {
                if (await IsValid()) {
                    ProcessInstance.ApproveAsynchronous("Approve");
                }
                else {
                    Process.ShowFirstError();
                }
            };
            if (!ProcessInstance.state) {
                this.bulkActionsManager.InitBulkActions();
            }
            Lib.Purchasing.Receiving.InitControlsOnChange();
        }
        Start() {
            Sys.Helpers.EnableSmartSilentChange();
            ProcessInstance.SetSilentChange(true);
            this.globalLayout.ShowWaitScreen();
            if (!ProcessInstance.state) {
                Lib.Purchasing.BR.InitData();
            }
            if (this.startInPopup) {
                Sys.Helpers.Object.ForEach(Controls, function (control) {
                    const type = control.GetType();
                    if (type.startsWith("Panel")) {
                        control.Hide(true);
                    }
                });
            }
            else // We don't need this for popup
             {
                this.InitControls();
                if (this.selectedRuidEx && this.selectedRuidEx.length > 100) {
                    Popup.Alert(Language.Translate("_More than 100 items is selected, {0} removed", false, this.selectedRuidEx.length - 100), false, null, "_More than 100 items is selected title");
                }
            }
            // Autofill item quantities/amounts if popup
            if (this.startInPopup) {
                Lib.Purchasing.autoReceiveOrderData = {};
            }
            const promiseLayoutLoadAndStart = Lib.Purchasing.BR.Items.bulkReceiptItemsManager.Init()
                .Then(() => {
                const otherRecipients = Lib.Purchasing.Receiving.GetOtherRecipients();
                if (this.startInPopup) {
                    if (this.selectedRuidEx && this.selectedRuidEx.length > 100) {
                        Popup.Alert("_More than 100 items is selected Reject", false, () => ProcessInstance.Quit("quit"), "_More than 100 items is selected Reject title");
                    }
                    else if (otherRecipients.length > 0) {
                        Popup.Confirm("_You are about to receive items from other recipients message", false, () => {
                            this.popupDialog.Show();
                        }, () => ProcessInstance.Quit("quit"), "_You are about to receive items from other recipients title");
                    }
                    else {
                        this.popupDialog.Show();
                    }
                }
                else {
                    Lib.Purchasing.BR.InitWarnings(otherRecipients, this.topMessageWarning);
                    Lib.Purchasing.BR.FormTemplate.SetupFormTemplateManager();
                    this.bulkReceiptItemsManager.InitEvent();
                    this.bulkReceiptItemsManager.InitDisplayAsLinkColumns();
                    if (Controls.BRStatus__.GetValue() !== "Draft") {
                        return this.bulkReceiptItemsManager.FillRelatedGoodsReceipt();
                    }
                }
                return null;
            })
                .Catch(reason => {
                Lib.CommonDialog.NextAlert.Define("Bulk Receipt creation error", reason.message || reason, {
                    isError: true,
                    behaviorName: "InitError"
                });
            })
                .Finally(() => {
                this.globalLayout.HideWaitScreen();
                ProcessInstance.SetSilentChange(false);
            });
            return Sys.Helpers.Synchronizer.OnProgressFromPromise(promiseLayoutLoadAndStart, { progressDelay: 15000 });
        }
    }
    CustomScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        main.Start();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map