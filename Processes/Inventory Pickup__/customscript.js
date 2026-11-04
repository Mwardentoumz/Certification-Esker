"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    /* Good receipt HTML page script */
    let topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
    let ConfirmPickup_RetryFinalizePO = false;
    let formTemplateManager = Lib.Purchasing.PU.FormTemplate.Get();
    /** Global Helpers **/
    class LayoutHelper {
        static InitBanner() {
            let banner = Sys.Helpers.Banner;
            banner.SetStatusCombo(Controls.PickupStatus__);
            banner.SetHTMLBanner(Controls.HTMLBanner__);
            banner.SetMainTitle("Inventory Pickup__");
            banner.SetSubTitle();
        }
        static InitActionButtons() {
            if (Data.GetValue("PickupStatus__") === Lib.Purchasing.PickupStatus.received) {
                Controls.ConfirmPickup.Hide(true);
            }
            else {
                Controls.ConfirmPickup.SetDisabled(true);
            }
        }
        static InitAttachmentPane() {
            Controls.DocumentsPanel.Hide(ProcessInstance.isReadOnly && !Attach.GetNbAttach());
        }
        static InitGeneralInformationPane() {
            Controls.PickupNumber__.Hide(!Controls.PickupNumber__.GetText());
        }
        static async InitWarehouseInformation() {
            Controls.WarehouseID__.Hide(true);
            const warehouseID = Data.GetValue("WarehouseID__");
            if (!warehouseID) {
                return;
            }
            const companyCode = Data.GetValue("CompanyCode__");
            if (Lib.P2P.Inventory.IsInventoryManager()) {
                Controls.WarehouseName__.DisplayAs({ type: "Link" });
                Controls.WarehouseName__.OnClick = function OpenWarehouseLink() {
                    Lib.P2P.Inventory.OpenWarehouse(companyCode, warehouseID);
                };
            }
            Lib.P2P.Address.SetFormattedAddressControl(Controls.WarehouseAddress__);
            const warehouse = await Lib.P2P.Inventory.Warehouse.GetWarehouse(companyCode, warehouseID);
            const result = await Lib.Purchasing.ShipTo.QueryShipToById(warehouse.shipToID, companyCode);
            const options = {
                isVariablesAddress: true,
                address: {
                    ToName: result.GetValue("ShipToCompany__"),
                    ToSub: result.GetValue("ShipToSub__"),
                    ToMail: result.GetValue("ShipToStreet__"),
                    ToPostal: result.GetValue("ShipToZipCode__"),
                    ToCountryCode: result.GetValue("ShipToCountry__"),
                    ToState: result.GetValue("ShipToRegion__"),
                    ToCity: result.GetValue("ShipToCity__"),
                    ForceCountry: true
                },
                countryCode: result.GetValue("ShipToCountry__"),
                keepCompanyInBlock: true
            };
            return await Lib.P2P.Address.ComputeFormattedAddressWithOptions(options);
        }
    }
    const panes = ["TopPaneWarning", "Banner", "GeneralInformation", "LineItems", "DocumentsPanel", "WarehouseInformation"];
    const buttons = [];
    const globalLayout = new Lib.P2P.Layout.Manager(panes, buttons);
    /** ****** **/
    /** LAYOUT **/
    /** ****** **/
    Controls.ConfirmPickup.OnClick = function () {
        if (ConfirmPickup_RetryFinalizePO) {
            ProcessInstance.Approve("Retry_FinalizePO_");
            return false;
        }
        return Process.ShowFirstError() === null;
    };
    function FillFromAncestor() {
        var _a;
        if (!Data.GetValue("State") && ((_a = ProcessInstance.selectedRuidFromView) === null || _a === void 0 ? void 0 : _a.length)) {
            Log.Info("Filling Pickup Form with PO items");
            Lib.CommonDialog.NextAlert.Reset();
            const filters = ProcessInstance.selectedRuidFromView.map(ruidex => {
                if (ruidex.startsWith("CT#")) {
                    // It's a PO item
                    let msn = ruidex.split(".")[1];
                    return Sys.Helpers.LdapUtil.FilterEqual("MSNEX", msn);
                }
                return Sys.Helpers.LdapUtil.FilterEqual("PORUIDEX__", ruidex);
            });
            const queryParams = {
                orderByClause: "LineNumber__ ASC",
                additionnalFilters: filters.length === 1 ? filters : [Sys.Helpers.LdapUtil.FilterOr(...filters)],
                includeNoGoodReceiptItems: true
            };
            return Lib.Purchasing.ReceivingItems.FillPickupForm(queryParams);
        }
        return Sys.Helpers.Promise.Resolve();
    }
    function FixLayoutBeforeStarting() {
        Log.Info("FixLayoutBeforeStarting");
        Process.ShowFirstErrorAfterBoot(false);
        globalLayout.Hide(true);
        globalLayout.ShowWaitScreen();
    }
    async function FixLayout() {
        var _a;
        globalLayout.Hide(false);
        Lib.Purchasing.PU.LineItems.Init(formTemplateManager);
        LayoutHelper.InitAttachmentPane();
        LayoutHelper.InitGeneralInformationPane();
        await LayoutHelper.InitWarehouseInformation();
        let recipientDN = ((_a = Data.GetTable("LineItems__").GetItem(0)) === null || _a === void 0 ? void 0 : _a.GetValue("RecipientDN__")) || "";
        let isRecipientOrBackUp = User.loginId.toUpperCase() === recipientDN.toUpperCase()
            || User.IsMemberOf(recipientDN)
            || User.IsBackupUserOf(recipientDN);
        if (isRecipientOrBackUp) {
            Process.SetHelpId(5049);
        }
        await formTemplateManager.Apply();
    }
    function ShowPopup() {
        Lib.CommonDialog.NextAlert.Show({
            "PickupCreationInfo": {
                IsShowable: function () {
                    // show info when GR has been just terminated
                    return Data.GetActionName();
                },
                OnOK: function () {
                    ProcessInstance.Quit("quit");
                }
            },
            "GRCreationError": {
                Popup: function (nextAlert) {
                    Lib.CommonDialog.NextAlert.PopupYesNoCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                ProcessInstance.Approve("Continue_");
                                break;
                            case "No":
                                ProcessInstance.Approve("Retry_");
                                break;
                            case "Cancel":
                                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit__");
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_GR found in ERP", "_GR not found in ERP");
                }
            },
            "finalizePOError": {
                Popup: function (nextAlert) {
                    Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                ProcessInstance.Approve("Retry_FinalizePO_");
                                break;
                            case "Cancel":
                                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit__");
                                Controls.ConfirmPickup.SetDisabled(false);
                                ConfirmPickup_RetryFinalizePO = true;
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_Retry finalize PO", "_Retry finalize PO later");
                }
            },
            "GREditionError": {
                Popup: function (nextAlert) {
                    Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                ProcessInstance.Approve("RetryOnEditOrder");
                                break;
                            case "Cancel":
                                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit__");
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_Retry now", "_Retry later");
                }
            }
        });
    }
    function Start() {
        Log.Time("Start");
        const promisesToWait = [
            Lib.Purchasing.InitTechnicalFields()
        ];
        Lib.Purchasing.Browse.Init();
        LayoutHelper.InitBanner();
        LayoutHelper.InitActionButtons();
        promisesToWait.push(FixLayout());
        Controls.TopPaneWarning.Hide(true);
        promisesToWait.push(Lib.P2P.DisplayArchiveDurationWarning("PAC", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning)));
        const additionalDisplayCondition = Data.GetValue("PickupStatus__") === Lib.Purchasing.PickupStatus.received;
        promisesToWait.push(Lib.P2P.DisplayAdminWarning("PAC", function (displayName) {
            topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
        }, additionalDisplayCondition, [100]));
        promisesToWait.push(Lib.P2P.DisplayBackupUserWarning("PAC", function (displayName) {
            topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName));
        }));
        if (!ProcessInstance.state) {
            ProcessInstance.DisableExtractionScript();
        }
        return Sys.Helpers.Promise.All(promisesToWait)
            .Finally(() => {
            Log.TimeEnd("Start");
        });
    }
    /** ******************** **/
    /** FORM INITIALIZATION  **/
    /** ******************** **/
    Sys.Helpers.EnableSmartSilentChange();
    ProcessInstance.SetSilentChange(true);
    FixLayoutBeforeStarting();
    Log.Time("LoadParameters");
    const promiseLayoutLoadAndStart = Lib.Purchasing.LoadParameters()
        .Finally(() => Log.TimeEnd("LoadParameters"))
        .Then(() => FillFromAncestor())
        .Then(() => Start())
        .Catch(reason => {
        Lib.CommonDialog.NextAlert.Define("_Pickup creation error", reason.message || reason, {
            isError: true,
            behaviorName: "GRInitError"
        });
    })
        .Finally(() => {
        globalLayout.HideWaitScreen();
        ShowPopup();
        ProcessInstance.SetSilentChange(false);
    });
    Sys.Helpers.Synchronizer.OnProgressFromPromise(promiseLayoutLoadAndStart, { progressDelay: 15000 });
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map