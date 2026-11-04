"use strict";
/* Good receipt HTML page script */
const GRStatus = Lib.Purchasing.GRStatus;
let topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
let ConfirmDelivery_RetryFinalizePO = false;
let g_isCancelable = false;
let g_status = GRStatus.toReceive;
const g_IsInventoryManager = Lib.P2P.Inventory.IsInventoryManager();
let formTemplateManager = Lib.Purchasing.GR.FormTemplate.Get();
/** ************** **/
/** Global Helpers **/
/** ************** **/
const scoringHelper = {
    Init: function () {
        const scoringFeatureEnabled = !ProcessInstance.isReadOnly && Sys.Parameters.GetInstance("AP").GetParameter("EnableSupplierScoring", "0") === "1";
        const scoringFeatureDisabled = !scoringFeatureEnabled;
        Controls.ScoringPane.Hide(scoringFeatureDisabled);
        Controls.ScoringValue__.Hide(true);
        Controls.Scoring__.Hide(scoringFeatureDisabled);
        Controls.ScoringComment__.Hide(scoringFeatureDisabled);
        if (scoringFeatureEnabled) {
            Controls.ScoringComment__.SetPlaceholder(Language.Translate("_Enter your evaluation"));
            Controls.Scoring__.BindEvent("OnLoad", scoringHelper.OnLoad);
            Controls.Scoring__.BindEvent("OnClick", scoringHelper.OnClick);
        }
    },
    OnLoad: function () {
        const score = Data.GetValue("ScoringValue__");
        Controls.Scoring__.FireEvent("onLoad", { score: score });
    },
    OnClick: function (evt) {
        Data.SetValue("ScoringValue__", parseInt(evt.args, 10));
    }
};
class LayoutHelper {
    static InitHeader() {
        let banner = Sys.Helpers.Banner;
        banner.SetStatusCombo(Controls.GRStatus__);
        banner.SetHTMLBanner(Controls.HTMLBanner__);
        banner.SetMainTitle("_Goods receipt");
        banner.SetSubTitle();
    }
    static async InitActionButtons() {
        Controls.ConfirmDelivery.Hide(true);
        if (g_status === GRStatus.toReceive) {
            Controls.ConfirmDelivery.Hide(false);
            Controls.ConfirmDelivery.SetDisabled(true);
        }
        Controls.GRCancel.Hide(!g_cancelManager.buttonVisible);
        Controls.GRCancel.SetDisabled(g_cancelManager.buttonDisabled);
        Controls.Quit.Hide(false);
        // This allows to enable confirm receiption if we're back after an error
        if (!ProcessInstance.isReadOnly) {
            Lib.Purchasing.Receiving.CheckErrorOnTable();
            Lib.Purchasing.Receiving.CheckConfirmDelivery();
        }
        Controls.EnterGRNumber.Hide(true);
        if (ProcessInstance.state === 90) {
            try {
                const result = await ProcessInstance.CheckResumeWithActionPending(["OnERPAckReceived"]);
                const grStatus = Data.GetValue("GRStatus__");
                if (!result.hasResumeActionPending) {
                    Controls.EnterGRNumber.Hide(grStatus !== GRStatus.waitingForERPAck);
                    Controls.EnterGRNumber.SetDisabled(grStatus !== GRStatus.waitingForERPAck);
                }
            }
            catch (errorResult) {
                // Error retrieving hasResumeActionPending
                Log.Info(JSON.stringify(errorResult.errors));
            }
        }
    }
    static InitGeneralInformationPane() {
        Controls.GRNumber__.Hide(!Controls.GRNumber__.GetText() && !!Controls.GRNumber__.GetError());
        Controls.DeliveryNote__.Hide(!Sys.Helpers.IsEmpty(Controls.ASNNumber__.GetValue()));
        if (Controls.ERPError__.GetValue() == Language.Translate("_No error provided by ERP")) {
            Controls.GRNumber__.SetError(Language.Translate("_No error provided by ERP Tooltip"));
        }
        else if (Sys.Helpers.IsEmpty(Controls.ERPError__.GetValue())) {
            Controls.GRNumber__.SetError("");
        }
        else {
            const errorTranslationKey = Sys.Helpers.IsEmpty(Controls.GRNumber__.GetValue()) ? "_ERPError {0}" : "_ERPError {0} with number";
            Controls.GRNumber__.SetError(Language.Translate(errorTranslationKey, false, Controls.ERPError__.GetValue()));
        }
    }
    static async InitInternalPane() {
        Controls.WarehouseID__.Hide(true);
        Controls.InternalPane.Hide(true);
        const warehouseID = Data.GetValue("WarehouseID__");
        if (!warehouseID) {
            return Sys.Helpers.Promise.Resolve();
        }
        const companyCode = Data.GetValue("CompanyCode__");
        if (g_IsInventoryManager) {
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
        await Lib.P2P.Address.ComputeFormattedAddressWithOptions(options);
    }
}
const panes = ["TopPaneWarning", "Banner", "GeneralInformation", "LineItems", "ScoringPane", "LocalActionPane", "DocumentsPanel", "RelatedInvoicesPane"];
const buttons = ["ConfirmDelivery", "GRCancel", "Quit"];
const deprecatedControls = ["IsInternal__", "Spacer2__", "FillDeliveredQuantities__", "ResetDeliveredQuantities__", "Spacer3__", "Spacer", "Actions"];
const globalLayout = new Lib.P2P.Layout.Manager(panes, buttons, Object.values(Lib.P2P.Layout.Splitter), deprecatedControls);
class CancelManager {
    constructor() {
        this.buttonVisible = false;
        this.buttonDisabled = false;
        this.grCanceler = {
            creationErrorMessage: null,
            resultNextAlertVariable: null,
            table: null,
            msnEx: null,
            refreshStatusInterval: null,
            queryPending: false,
            ended: false,
            resolve: null
        };
    }
    async Init() {
        this.canceled = Controls.GRStatus__.GetValue() === GRStatus.canceled;
        this.buttonVisible = true;
        this.cancelConfirmationPopup = new CancelConfirmationPopup();
        const isPOBillingCompleted = await Lib.Purchasing.RelatedVIP.IsPOBillingCompletedFromGR();
        const nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
        const isDuplicateAlert = nextAlert && nextAlert.title === Lib.Purchasing.PODuplicateNumberTitle;
        this.buttonVisible = ((ProcessInstance.state === 90 && (!!Controls.GRNumber__.GetError() || isDuplicateAlert)) || ProcessInstance.state === 70 || (ProcessInstance.state === 100 && !this.canceled))
            && !atLeastOneItemIsReturned()
            && (IsBuyerOrBackup() || IsRecipientOrBackup() || Lib.P2P.IsAdmin())
            && !isPOBillingCompleted;
        this.buttonDisabled = !this.buttonVisible || await Lib.Purchasing.PO.ERP.IsPOLocked(Data.GetValue("SourceRUID"));
        Controls.CancelComment__.Hide(!this.canceled);
        Controls.GRCancel.OnClick = () => {
            this.cancelConfirmationPopup.Display(this.Cancel.bind(this), !Sys.Helpers.IsEmpty(Controls.GRNumber__.GetValue()));
        };
    }
    async Cancel() {
        if (Sys.Helpers.IsEmpty(Controls.GRNumber__.GetValue()) && Data.GetValue("state") !== "90") {
            // GR is in Draft, the result of a GR creation error in ERP, in this case,
            // no GR created in ERP, no budget impacted, no GR items created...
            // --> just cancel the current message.
            Controls.CancelComment__.SetValue(this.cancelConfirmationPopup.$comment);
            ProcessInstance.ApproveAsynchronous("Cancel");
        }
        else {
            await Sys.Helpers.Synchronizer.OnProgressFromPromise(this.CreateAndWaitForGRCanceler(), {
                progressDelay: 15000,
                userData: {
                    dialogTitle: "_Form awaiting GR cancel",
                    dialogMessage: "_Form awaiting GR cancel message"
                }
            }).OnProgressDone();
            await this.DisplayGRCancelerResult();
        }
    }
    static async HideWaitScreen(hide) {
        // async call just after boot
        await Sys.Helpers.Promise.Tools.Sleep(0);
        Controls.OrderNumber__.Wait(!hide);
    }
    async CreateAndWaitForGRCanceler() {
        await CancelManager.HideWaitScreen(false);
        await Sys.Helpers.Promise.Create((resolve) => {
            // 1- Create GR canceler
            Process.CreateProcessInstance("Goods receipt canceler", {
                GRRuidEx__: Data.GetValue("RuidEx"),
                CancelComment__: this.cancelConfirmationPopup.$comment
            }, {
                "ERP": Data.GetValue("ERP__"),
                ...this.cancelConfirmationPopup.externalVars
            }, {
                callback: (data) => {
                    if (data.error) {
                        this.grCanceler.creationErrorMessage = data.errorMessage;
                        resolve();
                    }
                    else {
                        Log.Info("Canceler created with ruidEx: " + data.ruid);
                        this.grCanceler.table = data.ruid.replace(/\.[^\.]+$/, "");
                        this.grCanceler.msnEx = data.ruid.replace(/^[^\.]+\./, "");
                        this.grCanceler.resolve = resolve;
                        // 2- Wait for the end of GR canceler (polling...)
                        this.grCanceler.refreshStatusInterval = setInterval(this.RefreshGRCancelerStatus.bind(this), 2000);
                    }
                }
            });
        });
    }
    RefreshGRCancelerStatus() {
        const that = this;
        function OnRequestResult() {
            that.grCanceler.queryPending = false;
            if (that.grCanceler.ended) {
                return;
            }
            let err = this.GetQueryError();
            if (err) {
                Log.Error("Query Error: " + err);
                return;
            }
            let recordsCount = this.GetRecordsCount();
            if (recordsCount !== 1) {
                return;
            }
            let state = this.GetQueryValue("State", 0);
            if (state === 70 || state >= 100) {
                that.grCanceler.ended = true;
                clearInterval(that.grCanceler.refreshStatusInterval);
                that.grCanceler.refreshStatusInterval = null;
                that.grCanceler.resultNextAlertVariable = this.GetQueryValue("EXTERNAL_VARIABLE_CommonDialog_NextAlert%FORMATTED", 0);
                that.grCanceler.resolve();
            }
        }
        if (!this.grCanceler.queryPending) {
            this.grCanceler.queryPending = true;
            Query.DBQuery(OnRequestResult, this.grCanceler.table, "State|EXTERNAL_VARIABLE_CommonDialog_NextAlert%FORMATTED", "msnex=" + this.grCanceler.msnEx, "", 1);
        }
    }
    async DisplayGRCancelerResult() {
        if (this.grCanceler.resultNextAlertVariable) {
            Variable.SetValueAsString("CommonDialog_NextAlert", this.grCanceler.resultNextAlertVariable);
        }
        else {
            let reason = "Unexpected error.";
            if (this.grCanceler.creationErrorMessage) {
                Log.Error("GR canceler creation error. Details: " + this.grCanceler.creationErrorMessage);
                reason = this.grCanceler.creationErrorMessage;
            }
            Lib.CommonDialog.NextAlert.Define("_GR cancel error", "_GR cancel error message", {
                isError: true,
                behaviorName: "GRCancelFailure"
            }, reason);
        }
        Lib.CommonDialog.NextAlert.Show({
            "GRCancelSuccess": {
                OnOK: function () {
                    ProcessInstance.Quit("quit");
                }
            },
            "GRCancelFailure": {
                OnOK: function () {
                    ProcessInstance.Quit("quit");
                }
            },
            "GRCancelAborted": {
                OnOK: function () {
                    ProcessInstance.Quit("quit");
                }
            }
        });
        await CancelManager.HideWaitScreen(true);
    }
}
const g_cancelManager = new CancelManager();
class CancelConfirmationPopup {
    constructor() {
        this.$comment = null;
        this.externalVars = {};
        this.onCommitted = null;
        this.commentRequired = false;
        this.customization = null;
    }
    Fill(dialog /*, tabId, event, control*/) {
        var _a;
        if (!Sys.Helpers.IsEmpty(Data.GetValue("GrNumber__")) || Data.GetValue("GRStatus__") === GRStatus.waitingForERPAck) {
            Lib.ERP.Procurement.AddERPWarningToDialog(dialog, "GR", "cancel");
        }
        const warnWhenInvoiced = Lib.Purchasing.InvoicedProcessCancellationBehavior.IsWarned();
        const preventWhenInvoiced = Lib.Purchasing.InvoicedProcessCancellationBehavior.IsPrevented();
        let warningCtrl = dialog.AddDescription("warningCtrlDesc", null, 466);
        let ctrl = dialog.AddDescription("ctrlDesc", null, 466);
        ctrl.SetText(Language.Translate("_GR cancel confirmation message"));
        let commentCtrl = dialog.AddMultilineText("ctrlComments", "_Comment", 400);
        if (this.commentRequired) {
            dialog.RequireControl(commentCtrl);
        }
        if (!g_isCancelable && (warnWhenInvoiced || preventWhenInvoiced)) {
            let message;
            if (warnWhenInvoiced) {
                warningCtrl.SetWarningStyle();
                message = Language.Translate("_Cancel_invoiced_GR_warning");
            }
            else if (preventWhenInvoiced) {
                warningCtrl.SetErrorStyle();
                dialog.HideDefaultButtons();
                dialog.HideControl(ctrl);
                dialog.HideControl(commentCtrl);
                dialog.RequireControl(commentCtrl, false);
                dialog.AddButton("CancelButton", "_Cancel");
                message = Language.Translate("_Cancel_invoiced_GR_error");
            }
            if (message) {
                warningCtrl.SetText(message);
            }
        }
        if (Sys.Helpers.IsFunction((_a = this.customization) === null || _a === void 0 ? void 0 : _a.FillGRCancelPopup)) {
            this.customization.FillGRCancelPopup(dialog);
        }
    }
    Commit(dialog /*, tabId, event, control*/) {
        var _a;
        this.$comment = dialog.GetControl("ctrlComments").GetValue();
        if (Sys.Helpers.IsFunction((_a = this.customization) === null || _a === void 0 ? void 0 : _a.CommitGRCancelPopup)) {
            // The customization may return a map of external variables to transmit to the "Goods receipt canceler" process.
            const customExternalVars = this.customization.CommitGRCancelPopup(dialog);
            if (customExternalVars) {
                this.externalVars = customExternalVars;
            }
        }
        if (Sys.Helpers.IsFunction(this.onCommitted)) {
            this.onCommitted();
        }
    }
    Validate(dialog /*, tabId, event, control*/) {
        var _a;
        if (this.commentRequired && !dialog.GetControl("ctrlComments").GetValue()) {
            dialog.GetControl("ctrlComments").SetError("This field is required!");
            return false;
        }
        if (Sys.Helpers.IsFunction((_a = this.customization) === null || _a === void 0 ? void 0 : _a.ValidateGRCancelPopup)) {
            return this.customization.ValidateGRCancelPopup(dialog);
        }
        return true;
    }
    Handle(dialog, tabId, event, control, param1, param2) {
        var _a;
        const controlName = control ? control.GetName() : "";
        if (dialog && event === "OnClick" && controlName === "CancelButton") {
            Log.Info("Closing the dialog by pressing 'CancelButton'");
            dialog.Cancel();
        }
        if (Sys.Helpers.IsFunction((_a = this.customization) === null || _a === void 0 ? void 0 : _a.HandleGRCancelPopup)) {
            this.customization.HandleGRCancelPopup(dialog, tabId, event, control, param1, param2);
        }
    }
    Display(_onCommitted, _commentRequired) {
        this.$comment = null;
        this.externalVars = {};
        this.onCommitted = _onCommitted;
        this.commentRequired = _commentRequired;
        this.customization = Sys.Helpers.TryCallFunction("Lib.GR.Customization.Client.DialogGRCancelCustomization");
        const warnWhenInvoiced = Lib.Purchasing.InvoicedProcessCancellationBehavior.IsWarned();
        const preventWhenInvoiced = Lib.Purchasing.InvoicedProcessCancellationBehavior.IsPrevented();
        if (!g_isCancelable && warnWhenInvoiced) {
            Popup.Dialog("_GR cancel warning", null, this.Fill.bind(this), this.Commit.bind(this), this.Validate.bind(this), this.Handle.bind(this));
        }
        else if (!g_isCancelable && preventWhenInvoiced) {
            Controls.GRCancel.SetReadOnly(true);
            Popup.Dialog("_GR cancel prevent", null, this.Fill.bind(this), this.Commit.bind(this), this.Validate.bind(this), this.Handle.bind(this));
        }
        else {
            Popup.Dialog("_GR cancel confirmation", null, this.Fill.bind(this), this.Commit.bind(this), this.Validate.bind(this), this.Handle.bind(this));
        }
    }
}
function IsRecipientOrBackup() {
    const table = Data.GetTable("LineItems__");
    const count = table.GetItemCount();
    for (let i = 0; i < count; i++) {
        const row = table.GetItem(i);
        const recipientLogin = row.GetValue("RecipientDN__");
        if (recipientLogin && (User.loginId.toUpperCase() === recipientLogin.toUpperCase() || User.IsMemberOf(recipientLogin) || User.IsBackupUserOf(recipientLogin))) {
            return true;
        }
    }
    return false;
}
function atLeastOneItemIsReturned() {
    const table = Data.GetTable("LineItems__");
    const count = table.GetItemCount();
    for (let i = 0; i < count; i++) {
        const row = table.GetItem(i);
        const quantityReturned = row.GetValue("ReturnedQuantity__");
        if (quantityReturned > 0) {
            return true;
        }
    }
    return false;
}
function IsBuyerOrBackup() {
    const buyerLogin = Variable.GetValueAsString("BuyerLogin__") || "";
    return User.loginId.toUpperCase() === buyerLogin.toUpperCase()
        || User.IsMemberOf(buyerLogin)
        || User.IsBackupUserOf(buyerLogin);
}
/** ****** **/
/** LAYOUT **/
/** ****** **/
async function IsValid() {
    const isValid = Process.ShowFirstError() === null;
    const customIsValid = await Sys.Helpers.TryCallFunction("Lib.GR.Customization.Common.OnValidateForm", isValid);
    if (typeof customIsValid === "boolean") {
        return customIsValid;
    }
    return isValid;
}
Controls.ConfirmDelivery.OnClick = async function () {
    if (ConfirmDelivery_RetryFinalizePO) {
        ProcessInstance.Approve("Retry_FinalizePO_");
    }
    else {
        Lib.Purchasing.GR.LineItems.WrapCheckDeliveryDate(Lib.Purchasing.Receiving.CheckDeliveryDate, true)();
        if (await IsValid()) {
            ProcessInstance.Approve("approve");
        }
        else {
            Process.ShowFirstError();
        }
    }
};
Controls.EnterGRNumber.OnClick = function () {
    function Fill(dialog /*, tabId, event, control*/) {
        let ctrl = dialog.AddDescription("ctrlDesc", null, 466);
        ctrl.SetText(Language.Translate("_Enter_GRNumber_explanation"));
        let ctrlGRNumber = dialog.AddText("ctrlGRNumber", "_GRNumber", 400);
        dialog.RequireControl(ctrlGRNumber);
    }
    function Commit(dialog /*, tabId, event, control*/) {
        const ctrlGRNumber = dialog.GetControl("ctrlGRNumber").GetValue();
        Controls.OrderNumber__.SetValue(ctrlGRNumber);
        ProcessInstance.ResumeWithActionAsynchronous("OnERPAckReceived", {
            "GRNumber__": ctrlGRNumber,
            "ERPError__": ""
        });
    }
    function Validate(dialog /*, tabId, event, control*/) {
        const GRNumber = dialog.GetControl("ctrlGRNumber").GetValue();
        if (!GRNumber) {
            dialog.GetControl("ctrlGRNumber").SetError("This field is required!");
            return false;
        }
        return true;
    }
    function Handle(dialog, tabId, event, control) {
        const controlName = control ? control.GetName() : "";
        if (dialog && event === "OnClick" && controlName === "CancelButton") {
            Log.Info("Closing the dialog by pressing 'CancelButton'");
            dialog.Cancel();
        }
    }
    Popup.Dialog("_Enter a GR number", null, Fill, Commit, Validate, Handle);
    return false;
};
function MakeControlsOrderNumberOnClick(sourcePORuid, sourcePONum) {
    return function (row) {
        if (sourcePORuid) {
            Process.OpenMessage({
                ruidEx: sourcePORuid,
                goBackOnQuit: false,
                inNewTab: true,
                additionalParameters: { "OnQuit": "CleanAndClose" }
            });
        }
        else {
            Sys.GenericAPI.PromisedQuery({
                table: "CDNAME#Purchase order V2",
                filter: "OrderNumber__=" + sourcePONum,
                attributes: ["ValidationURL"],
                sortOrder: "",
                maxRecords: 1,
                additionalOptions: { searchInArchive: true }
            }).Then(function (results) {
                if (results && results.length) {
                    Process.OpenLink({ url: results[0].ValidationURL + "&OnQuit=CleanAndClose", inCurrentTab: false });
                }
                else {
                    Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
                }
            });
        }
    };
}
async function FillGRFromAncestor() {
    var _a;
    // Always one PO ancestor for a GR
    const ancestorsid = ((_a = ProcessInstance.selectedRuidFromView) === null || _a === void 0 ? void 0 : _a.length) > 0 ? ProcessInstance.selectedRuidFromView[0] : null;
    if (!Data.GetValue("State") && ancestorsid) {
        Log.Info("Filling GR Form with PO items");
        Lib.CommonDialog.NextAlert.Reset();
        const queryParams = {
            orderByClause: "LineNumber__ ASC",
            ancestorsid
        };
        Log.Time("FillGoodReceipt");
        await Lib.Purchasing.ReceivingItems.FillGRForm(queryParams);
        Log.TimeEnd("FillGoodReceipt");
    }
}
function InitRelatedDocumentPane() {
    Controls.DisplayInvoices__.Hide(true);
    Controls.RelatedInvoicesPane.Hide(true);
    if (g_status !== GRStatus.toReceive && Attach.GetNbAttach() === 0) {
        Controls.DocumentsPanel.Hide(true);
    }
}
function FixLayoutBeforeStarting() {
    Log.Info("FixLayoutBeforeStarting");
    Process.ShowFirstErrorAfterBoot(false);
    globalLayout.HidePanes(true);
    globalLayout.HideActionButtons();
    globalLayout.ShowWaitScreen();
}
async function FixLayout() {
    var _a;
    globalLayout.HidePanes(false);
    globalLayout.HideDeprecatedControls();
    Lib.Purchasing.GR.LineItems.Init(formTemplateManager);
    // Hides the recipient column when none is found
    let table = Data.GetTable("LineItems__");
    let recipientDN = table.GetItem(0).GetValue("RecipientDN__") || "";
    let isBuyerOrBackUp = User.loginId.toUpperCase() === recipientDN.toUpperCase()
        || User.IsMemberOf(recipientDN)
        || User.IsBackupUserOf(recipientDN);
    if (isBuyerOrBackUp) {
        Process.SetHelpId("5032");
    }
    // if the ASN number control is not empty, this process instance was created from an ASN
    // Therefore SourceRUID leads to this ASN
    const isFromASN = !Sys.Helpers.IsEmpty(Controls.ASNNumber__.GetValue());
    const isFromBR = Lib.P2P.GetBulkReceiptProcessName() === ((_a = Sys.TechnicalData.GetValue("autoCompleteFromData")) === null || _a === void 0 ? void 0 : _a.SourceProcess);
    const sourcePORuid = !isFromASN && !isFromBR ? Data.GetValue("SourceRUID") : null;
    const sourceASNRuid = isFromASN ? Data.GetValue("SourceRUID") : null;
    const sourceBRRuid = isFromBR ? Data.GetValue("SourceRUID") : null;
    const BRNumber = Data.GetValue("BRNumber__");
    // Make Order number field clickable
    let sourcePONum = Data.GetValue("OrderNumber__") || Variable.GetValueAsString("OrderNumber__");
    if (sourcePORuid || sourcePONum) {
        Controls.OrderNumber__.DisplayAs({ type: "Link" });
        Controls.OrderNumber__.OnClick = MakeControlsOrderNumberOnClick(sourcePORuid, sourcePONum);
    }
    // Make BRNumber__ field clickable
    if (isFromBR && BRNumber && sourceBRRuid) {
        Controls.BRNumber__.Hide(false);
        Controls.BRNumber__.DisplayAs({ type: "Link" });
        Controls.BRNumber__.OnClick = () => {
            Process.OpenMessage({
                ruidEx: sourceBRRuid,
                goBackOnQuit: false,
                inNewTab: true,
                additionalParameters: { "OnQuit": "CleanAndClose" }
            });
        };
    }
    else {
        Controls.BRNumber__.Hide(true);
    }
    InitRelatedDocumentPane();
    LayoutHelper.InitGeneralInformationPane();
    await LayoutHelper.InitInternalPane();
    Controls.ASNNumber__.Hide(!isFromASN);
    if (sourceASNRuid) {
        Controls.ASNNumber__.DisplayAs({ type: "Link" });
        Controls.ASNNumber__.OnClick = function () {
            Process.OpenMessage({
                ruidEx: sourceASNRuid,
                goBackOnQuit: false,
                inNewTab: true,
                additionalParameters: { "OnQuit": "CleanAndClose" }
            });
        };
    }
    FixReturnManagementLayout();
    await formTemplateManager.Apply();
}
function FixReturnManagementLayout() {
    if (Lib.Purchasing.ReturnManagement.IsEnabled()) {
        let totalReturnedQuantity = 0;
        Sys.Helpers.Controls.ForEachTableRow(Controls.LineItems__, (row) => {
            totalReturnedQuantity += row.ReturnedQuantity__.GetValue();
        });
        Controls.LineItems__.ReturnedQuantity__.Hide(totalReturnedQuantity === 0);
    }
}
async function FixLayoutAsync() {
    const grStatus = Data.GetValue("GRStatus__");
    const toReceive = grStatus === GRStatus.toReceive;
    Controls.LocalActionPane.Hide(true);
    await Lib.Purchasing.RelatedVIP.InitRelatedInvoice(toReceive, Controls.LocalActionPane);
}
function ShowPopup() {
    Lib.CommonDialog.NextAlert.Show({
        "GRCreationInfo": {
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
                            Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit");
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
                            Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit");
                            Controls.ConfirmDelivery.SetDisabled(false);
                            ConfirmDelivery_RetryFinalizePO = true;
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
                            Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit");
                            break;
                        default:
                            break;
                    }
                }, nextAlert, "_Retry now", "_Retry later");
            }
        }
    });
}
async function Start() {
    try {
        const promisesToWait = [];
        Log.Time("Start");
        await g_cancelManager.Init();
        promisesToWait.push(Lib.Purchasing.InitTechnicalFields());
        Lib.Purchasing.Browse.Init();
        g_status = Data.GetValue("GRStatus__");
        LayoutHelper.InitHeader();
        promisesToWait.push(FixLayout());
        promisesToWait.push(FixLayoutAsync());
        scoringHelper.Init();
        /* All the layout is fixed, try to call for PS customization */
        let funcZ = Sys.Helpers.TryGetFunction("Lib.GR.Customization.Client.CustomizeLayout"); // customiZe
        let funcS = Sys.Helpers.TryGetFunction("Lib.GR.Customization.Client.CustomiseLayout"); // customiSe
        if (funcZ) {
            funcZ();
        }
        else if (funcS) {
            funcS();
        }
        promisesToWait.push(Lib.Purchasing.RelatedVIP.IsGRCancelable()
            .then((isGRCancelable) => {
            g_isCancelable = isGRCancelable;
        }));
        if (!ProcessInstance.state) {
            ProcessInstance.DisableExtractionScript();
        }
        await InitWarnings();
        await Sys.Helpers.Promise.All(promisesToWait);
    }
    finally {
        await LayoutHelper.InitActionButtons();
        Log.TimeEnd("Start");
    }
}
async function InitWarnings() {
    Controls.TopPaneWarning.Hide(true);
    const isReceived = g_status === GRStatus.received;
    // Archive duration
    await Lib.P2P.DisplayArchiveDurationWarning("PAC", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning));
    // When GR is received (state 100, we know the OwnerID)
    if (+Data.GetValue("State") === 100) {
        const ownerID = Data.GetValue("OwnerID");
        // admin
        await Lib.P2P.DisplayAdminWarning("PAC", (displayName) => {
            topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
        }, isReceived, [100]);
        // backup user / OOTO
        await Lib.Purchasing.Receiving.DisplayWarningMultipleRecipients("PAC", "BackupUserWarning", [ownerID], 
        // condition
        () => !Lib.P2P.IsAdmin() && Lib.P2P.IsOwnerBackup() && !Lib.Purchasing.Receiving.LoginMatchesLoggedUser(ownerID) && ProcessInstance.isReadOnly && isReceived, 
        // message
        (displayName) => topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName)));
        if (g_cancelManager.buttonDisabled) {
            topMessageWarning.Add(Language.Translate("_PO Waiting for erp ack", false));
        }
    }
    // When GR is on creation (no state, no ownerID)
    else {
        const otherRecipients = Lib.Purchasing.Receiving.GetOtherRecipients();
        // admin
        await Lib.Purchasing.Receiving.DisplayWarningMultipleRecipients("PAC", "AdminWarning", otherRecipients, 
        // condition
        () => Lib.P2P.IsAdmin() && otherRecipients.length > 0 && !ProcessInstance.isReadOnly && !isReceived, 
        // single user message
        (displayName) => topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0} on creation", false, displayName)), 
        // multiple users message
        () => topMessageWarning.Add(Language.Translate("_View as admin on bealf of multiple users on creation")));
        // backup user / OOTO / Buyer on behalf of recipient
        await Lib.Purchasing.Receiving.DisplayWarningMultipleRecipients("PAC", "BackupUserWarning", otherRecipients, 
        // condition
        () => !Lib.P2P.IsAdmin() && otherRecipients.length > 0 && !ProcessInstance.isReadOnly && !isReceived, 
        // single user message
        (displayName) => {
            if (Lib.Purchasing.ReceivingItems.shouldReceiveItemAsBuyer) {
                topMessageWarning.Add(Language.Translate("_View on bealf of {0} on creation for buyer", false, displayName));
            }
            else {
                topMessageWarning.Add(Language.Translate("_View on bealf of {0} on creation", false, displayName));
            }
        }, 
        // multiple users message
        () => {
            if (Lib.Purchasing.ReceivingItems.shouldReceiveItemAsBuyer) {
                topMessageWarning.Add(Language.Translate("_View on bealf of multiple users on creation for buyer"));
            }
            else {
                topMessageWarning.Add(Language.Translate("_View on bealf of multiple users on creation"));
            }
        });
    }
}
async function main() {
    try {
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        FixLayoutBeforeStarting();
        Log.Time("LoadParameters");
        await Lib.Purchasing.LoadParameters();
        Log.TimeEnd("LoadParameters");
        await FillGRFromAncestor();
        await Start();
    }
    catch (reason) {
        Lib.CommonDialog.NextAlert.Define("_Goods receipt creation error", reason.message || reason, {
            isError: true,
            behaviorName: "GRInitError"
        });
    }
    finally {
        globalLayout.HideWaitScreen();
        ShowPopup();
        ProcessInstance.SetSilentChange(false);
    }
}
Sys.Helpers.Synchronizer.OnProgressFromPromise(main(), { progressDelay: 15000 });
//# sourceMappingURL=customscript.js.map