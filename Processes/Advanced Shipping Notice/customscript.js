"use strict";
/* Advanced Shipping Notice HTML page script */
const nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
let currentStatus = Data.GetValue("Status__");
let topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
// TODO
// const readOnly = Controls.Status__.GetValue() !== "Draft" || !(User.isVendor || Lib.P2P.IsAdmin());
Log.Time("CustomScript");
Sys.Helpers.EnableSmartSilentChange();
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
async function InitLayout() {
    Sys.Helpers.Banner.SetMainTitle("_Advanced Shipping Notice");
    Sys.Helpers.Banner.SetSubTitleAligned(true);
    Sys.Helpers.Banner.SetCentered(false);
    Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
    Lib.Shipping.Workflow.InitPanel();
    Lib.P2P.DisplayArchiveDurationWarning("PAC", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning), "ProcurementArchiveDurationInMonths");
    Lib.P2P.DisplayBackupUserWarning("P2P", (displayName) => {
        topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName), 0);
    }, () => {
        let currentContributor = Lib.Shipping.Workflow.controller.GetCurrentContributor();
        if ((Data.GetValue("State") == 70 || Data.GetValue("State") == 90) && currentContributor && User.loginId !== currentContributor.login && User.IsBackupUserOf(currentContributor.login)) {
            return currentContributor.login;
        }
        return null;
    });
    const sourceType = Controls.ASNSourceType__.GetValue();
    const lineItemsReadOnly = currentStatus !== "Draft" || sourceType === "Portal" || sourceType === "cXML";
    if (lineItemsReadOnly) {
        setTimeout(() => {
            Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
        });
    }
    Controls.LineItems__.HideBottomNavigation(lineItemsReadOnly);
    Controls.LineItems__.HideTableRowAdd(lineItemsReadOnly);
    Controls.LineItems__.HideTableRowDelete(lineItemsReadOnly);
    Controls.LineItems__.ItemPOLineQuantity__.SetReadOnly(true);
    let itemInError = Lib.Purchasing.Items.IsAsnLineItemsInError();
    // Show ItemCompanyCode__ only when in error
    Controls.LineItems__.ItemCompanyCode__.Hide(!itemInError);
    Controls.LineItems__.ItemQuantity__.SetRequired(!lineItemsReadOnly);
    const isUOMEnabled = Sys.Parameters.GetInstance("PAC").GetParameterBool("DisplayUnitOfMeasure", false);
    Controls.LineItems__.ItemUOM__.Hide(!isUOMEnabled);
    Controls.LineItems__.ItemUOM__.SetReadOnly(true);
    Controls.ASNNumber__.SetRequired(true);
    Controls.ShipToAddress__.SetReadOnly(lineItemsReadOnly);
    Lib.Shipping.Client.InitVendorNameControl(sourceType, lineItemsReadOnly);
    Lib.Shipping.Client.InitBrowsePOItemControls(lineItemsReadOnly);
    Controls.LineItems__.SetWidth("100%");
    Controls.LineItems__.SetExtendableColumn("ItemDescription__");
    if (Controls.LineItems__.ItemPONumber__.IsReadOnly()) {
        InitPONumberAssociation(Controls.LineItems__);
    }
    Controls.Quit__.Hide(false);
    switch (currentStatus) {
        case "Submitted":
            InitSubmittedStep();
            break;
        case "Partially Received":
            InitReceivedSteps(Lib.Shipping.StatusLabels.PartiallyReceived);
            break;
        case "Received":
            InitReceivedSteps(Lib.Shipping.StatusLabels.Received);
            break;
        case "Rejected":
            InitReceivedSteps(Lib.Shipping.StatusLabels.Rejected);
            break;
        case "Draft":
            InitDraftStep();
            break;
        default:
            InitRequestStep();
            break;
    }
    Controls.ConversationPane.Hide(!Controls.VendorASNRUIDEX__.GetValue());
    await Sys.Helpers.TryCallFunction("Lib.Shipping.Customization.Client.CustomizeLayout");
}
function InitConversation() {
    const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({ Options: Lib.P2P.Conversation.defaultOptions }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
    Controls.ConversationUI__.Init(conversationInfo);
    Controls.ConversationUI__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsCustomer));
}
function InitRequestStep() {
    Lib.Shipping.Client.InitControl(false);
    Controls.Save__.Hide(false);
    // ASN writeable if no reviewer in the workflow (portal) or I'm the current reviewer in the workflow (inbound channel)
    let isCurrentReviewerOrAdmin = !Lib.Shipping.Workflow.IsCurrentStepRole(Lib.Shipping.Workflow.Roles.reviewer) || Lib.Shipping.Workflow.IsCurrentContributor() || Lib.P2P.IsAdmin();
    if (!isCurrentReviewerOrAdmin) {
        Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit__");
        Controls.Comments__.Hide();
    }
    else if (!User.isVendor) {
        Controls.Reject__.Hide(false);
        Controls.Reject__.SetDisabled(false);
    }
    Sys.Helpers.Banner.SetSubTitle(Lib.Shipping.StatusLabels.Draft);
}
function InitResultStep(status) {
    Lib.Shipping.Client.InitControl(true);
    Controls.SubmitApprove__.Hide(true);
    Controls.HTML__.Hide(true);
    Sys.Helpers.Banner.SetSubTitle(status);
    Controls.LineItems__.ItemQuantity__.SetReadOnly(true);
    Controls.LineItems__.ItemNote__.SetReadOnly(true);
    Controls.TrackingNumber__.SetReadOnly(true);
    Controls.ShippingNote__.SetReadOnly(true);
    Controls.ASNNumber__.SetReadOnly(true);
    Controls.ShippingDate__.SetReadOnly(true);
    Controls.ExpectedDeliveryDate__.SetReadOnly(true);
    Controls.LineItems__.ItemQuantityReceived__.Hide(false);
    Controls.LineItems__.ItemQuantityToReceive__.Hide(false);
    Controls.LineItems__.ItemQuantityToReceive__.SetReadOnly(true);
    let hideNotes = !Sys.Helpers.Data.FindTableItem("LineItems__", (lineItem) => {
        return !Sys.Helpers.IsEmpty(lineItem.GetValue("ItemNote__"));
    });
    Controls.LineItems__.ItemNote__.Hide(hideNotes);
}
function InitDraftStep() {
    InitRequestStep();
    const isFromcXML = Controls.ASNSourceType__.GetValue() === "cXML";
    // if form is in draft and was create from cXML we should disable all actions except rejection
    if (isFromcXML) {
        Controls.SubmitApprove__.Hide(true);
        Controls.HTML__.Hide(true);
        Controls.LineItems__.ItemQuantity__.SetReadOnly(true);
        Controls.LineItems__.ItemNote__.SetReadOnly(true);
        Controls.TrackingNumber__.SetReadOnly(true);
        Controls.ShippingNote__.SetReadOnly(true);
        Controls.ASNNumber__.SetReadOnly(true);
        Controls.ShippingDate__.SetReadOnly(true);
        Controls.ExpectedDeliveryDate__.SetReadOnly(true);
        Controls.CarrierCombo__.Hide(false);
        Controls.Carrier__.Hide(true);
        Controls.TrackingLink__.Hide(true);
    }
}
function InitSubmittedStep() {
    InitResultStep(Lib.Shipping.StatusLabels.Submitted);
    if (Lib.Shipping.Workflow.IsCurrentContributor()) {
        // Delivery date is only prefilled when empty
        if (Sys.Helpers.IsEmpty(Controls.ASNDeliveryDate__.GetValue())) {
            Controls.ASNDeliveryDate__.SetValue(new Date());
        }
        Controls.ASNDeliveryDate__.Hide(false);
        Controls.ASNDeliveryDate__.SetReadOnly(false);
        Controls.ASNDeliveryDate__.SetRequired(true);
        Sys.Helpers.Data.ForEachTableItem("LineItems__", (lineItem) => {
            const recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(lineItem.GetValue("ItemPORecipientDN__"));
            if (Lib.P2P.CurrentUserMatchesLogin(recipientLogin)) {
                lineItem.SetValue("ItemQuantityReceived__", lineItem.GetValue("ItemQuantity__"));
            }
        });
        Sys.Helpers.Controls.ForEachTableRow(Controls.LineItems__, (lineItemRow) => {
            const recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(lineItemRow.ItemPORecipientDN__.GetValue());
            if (!Lib.P2P.CurrentUserMatchesLogin(recipientLogin)) {
                lineItemRow.SetReadOnly(true);
                lineItemRow.AddRowStyle("greyed");
            }
        });
        Controls.ConfirmReceipt__.Hide(false);
        scoringHelper.Init();
    }
}
function InitReceivedSteps(status) {
    InitResultStep(status);
    Controls.LineItems__.ItemQuantityReceived__.SetReadOnly(true);
    Controls.LineItems__.ItemQuantityReceived__.SetRequired(true);
    Controls.ASNDeliveryDate__.Hide(false);
}
function CheckAllLinesEmpty() {
    let hasAllEmptyLines;
    hasAllEmptyLines = !Sys.Helpers.Data.FindTableItem("LineItems__", (lineItem) => {
        return !Sys.Helpers.IsEmpty(lineItem.GetValue("ItemQuantity__")) && lineItem.GetValue("ItemQuantity__") > 0;
    });
    if (hasAllEmptyLines) {
        Popup.Alert("_ASN without items line", true, null, "_ASN without items line title");
    }
    return hasAllEmptyLines;
}
function CheckRequiredFields() {
    if (Sys.Helpers.IsEmpty(Data.GetValue("ASNNumber__"))) {
        Controls.ASNNumber__.SetError("This field is required!");
    }
}
function ConfirmReceipt() {
    ProcessInstance.Approve("ConfirmReceipt");
}
function RegisterHandlers() {
    Controls.SubmitApprove__.OnClick = function () {
        CheckRequiredFields();
        if (Process.ShowFirstError() === null && !CheckAllLinesEmpty()) {
            ProcessInstance.Approve("Submit");
        }
        return false;
    };
    Controls.Quit__.OnClick = function () {
        ProcessInstance.Quit("Quit");
        return false;
    };
    Controls.Save__.OnClick = function () {
        ProcessInstance.Approve("Save");
        return false;
    };
    Controls.ConfirmReceipt__.OnClick = function () {
        if (Process.ShowFirstError() === null) {
            if (Lib.Shipping.IsPartiallyReceivedForUser(User)) {
                Popup.Confirm("_Popup warning partial receipt message", false, ConfirmReceipt, null, "_Popup warning partial receipt title");
            }
            else {
                ConfirmReceipt();
            }
        }
        return false;
    };
    function fillDialogCallback(dialog /*, tabId, event, control*/) {
        let commentValue = Controls.Comments__.GetValue();
        let ctrl = dialog.AddDescription("ctrlDesc", null, 466);
        ctrl.SetText(Language.Translate("_ASNRejectionDialogDescription"));
        let commentCtrl = dialog.AddMultilineText("ctrlComments", "_ASNRejectionDialogComment", 400);
        dialog.RequireControl(commentCtrl);
        commentCtrl.SetValue(commentValue);
    }
    function commitDialogCallback(dialog /*, tabId, event, control*/) {
        const newValue = dialog.GetControl("ctrlComments").GetValue();
        Controls.Comments__.SetValue(newValue);
        ProcessInstance.Approve("ReviewerReject");
    }
    function validateDialogCallback(dialog /*, tabId, event, control*/) {
        if (!dialog.GetControl("ctrlComments").GetValue()) {
            dialog.GetControl("ctrlComments").SetError("_ASNRejectionDialogMandatoryComment");
            return false;
        }
        return true;
    }
    Controls.Reject__.OnClick = function () {
        Popup.Dialog("_ASNRejectionDialogTitle", null, fillDialogCallback, commitDialogCallback, validateDialogCallback);
        return false;
    };
    Controls.LineItems__.OnDeleteItem = function (item, index) {
        Lib.Shipping.Workflow.Rebuild();
        if (index == 0) {
            //First line is deleted, we need to check if the CompanyCode of this ASN needs to be changed
            if (Controls.LineItems__.GetRow(1) && Controls.LineItems__.GetRow(1).GetItem()) {
                let companyCode = Controls.LineItems__.GetRow(1).GetItem().GetValue("ItemCompanyCode__");
                Log.Info("First line CompanyCode : " + companyCode);
                if (companyCode !== Controls.CompanyCode__.GetValue()) {
                    Data.SetValue("CompanyCode__", companyCode);
                    Lib.Shipping.LoadCompanyCodeConfiguration(companyCode);
                    Lib.Shipping.CheckAllLinesCoherency();
                }
            }
        }
    };
    Controls.LineItems__.ItemQuantityReceived__.OnChange = function () {
        CheckErrorOnRow(this.GetRow());
    };
}
function DisplayNextAlert() {
    Lib.CommonDialog.NextAlert.Show({
        "PrepareDownloadablePreviewRPTDataFileError": {
            IsShowable: () => !!Data.GetActionName()
        },
        "onUnexpectedError": {
            IsShowable: function () {
                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit__");
                Controls.Comments__.Hide(true);
                return true;
            }
        }
    });
}
function OnExecutedAction() {
    const actionName = Data.GetActionName();
    if (actionName === "DownloadPreviewRPTDataFile") {
        if (!nextAlert || !nextAlert.isError) {
            const dataJSON = Variable.GetValueAsString("DownloadablePreviewDataJSON");
            Variable.SetValueAsString("DownloadablePreviewDataJSON", "");
            Process.OpenPreview({
                "conversionType": Lib.P2P.GetCrystalConverterByParameter(),
                "templateName": "PackingSlipV2.rpt",
                "language": "en",
                "outputFormat": "mdb",
                "data": dataJSON
            });
        }
    }
}
function InitPONumberAssociation(ItemTable) {
    Sys.Helpers.Controls.ForEachTableRow(ItemTable, function (row) {
        if (row.ItemPONumber__.GetValue() != null) {
            row.ItemPONumber__.DisplayAs({ type: "Link" });
        }
    });
    Controls.LineItems__.ItemPONumber__.OnClick = async function () {
        if (this.GetValue() != null) {
            Controls.LineItems__.ItemPONumber__.Wait(true);
            let options = {
                table: "CDNAME#Purchase order V2",
                filter: "OrderNumber__=" + this.GetValue(),
                attributes: ["MsnEx", "ValidationURL"],
                sortOrder: null,
                maxRecords: 1
            };
            try {
                const queryResult = await Sys.GenericAPI.PromisedQuery(options);
                if (queryResult.length == 1) {
                    Process.OpenLink(queryResult[0].ValidationURL + "&OnQuit=Close");
                }
                else {
                    Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
                }
            }
            catch (e) {
                Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
            }
            finally {
                Controls.LineItems__.ItemPONumber__.Wait(false);
            }
        }
        else {
            throw new Error();
        }
    };
}
function CheckErrorOnRow(row) {
    let item = row.GetItem();
    let receivedField = row.ItemQuantityReceived__;
    if (item.GetValue("ItemQuantityReceived__") < 0) {
        Log.Info("Quantity is negative");
        receivedField.SetError("_Received qty cannot be negative");
        receivedField.ShowErrorMessage(true);
    }
    CheckOverReceivingQuantity(item);
}
//#region OverReceiving management
function CheckOverReceivingQuantity(item) {
    //check if user exit allows over delivery and change the message type accordingly
    if (IsOverReceiving(item)) {
        const overReceivedErrorMsg = IsQuantityShippedGreaterThanToReceive(item) ? "_Received qty outmatch qty to receive ({0})" : "_TooManyItemsReceived";
        if (Sys.Helpers.TryCallFunction("Lib.GR.Customization.Common.AllowOverdelivery", item)) {
            item.SetWarning("ItemQuantityReceived__", Language.Translate(overReceivedErrorMsg, false, item.GetValue("ItemQuantityToReceive__")));
        }
        else {
            item.SetError("ItemQuantityReceived__", Language.Translate(overReceivedErrorMsg, false, item.GetValue("ItemQuantityToReceive__")));
        }
    }
}
//Check if user doesn't receive more than he should
function IsOverReceiving(rowItem) {
    const quantityReceived = rowItem.GetValue("ItemQuantityReceived__");
    const quantityToReceive = rowItem.GetValue("ItemQuantityToReceive__");
    const quantityShipped = rowItem.GetValue("ItemQuantity__");
    return quantityReceived > quantityToReceive || quantityReceived > quantityShipped;
}
function IsQuantityShippedGreaterThanToReceive(rowItem) {
    const quantityToReceive = rowItem.GetValue("ItemQuantityToReceive__");
    const quantityShipped = rowItem.GetValue("ItemQuantity__");
    return quantityShipped > quantityToReceive;
}
//Retrieve opened quantities from Database
async function FetchOpenedQuantities() {
    let ordersList = [];
    //get PO Numbers from the list of items
    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
        const poNumber = line.GetValue("ItemPONumber__");
        if (ordersList.indexOf(poNumber) == -1) //avoid getting duplicate numbers
         {
            ordersList.push(poNumber);
        }
    });
    //create query to retrieve received quantity from related purchase orders
    const queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterIn("OrderNumber__", ordersList), Sys.Helpers.LdapUtil.FilterNotEqual("Status__", "Canceled")).toString();
    const table = Lib.Purchasing.Items.GRItemsDBInfo.table;
    const ASNQueryOptions = {
        table,
        filter: queryFilter,
        attributes: [
            "OrderNumber__",
            "LineNumber__",
            "Quantity__",
            "ReturnedQuantity__",
            "DeliveryCompleted__"
        ],
        maxRecords: 100 //added max record because on client side, default maxrecord is set to 1
    };
    return await Sys.GenericAPI.PromisedQuery(ASNQueryOptions);
}
//Fill the matching lines items with quantity to receive data
async function FillOpenedQuantities() {
    Log.Info("FillOpenedQuantities - Start...");
    try {
        const results = await FetchOpenedQuantities();
        Log.Info("FillOpenedQuantities - " + results.length.toString() + " lines of good receipts found for this ASN");
        ProcessInstance.SetSilentChange(true); //activate silent modifications on fields
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item, i) {
            const poNumber = item.GetValue("ItemPONumber__");
            const lineNumber = item.GetValue("ItemPOLineNumber__");
            let quantityToReceive = item.GetValue("ItemPOLineQuantity__");
            let deliveryCompleted = false;
            if (results) {
                Sys.Helpers.Array.Every(results, resultElt => {
                    if (resultElt.OrderNumber__ === poNumber
                        && resultElt.LineNumber__ === lineNumber) {
                        if (resultElt.DeliveryCompleted__ === "1") {
                            deliveryCompleted = true;
                        }
                        else {
                            quantityToReceive = Sys.Decimal.sub(quantityToReceive || 0, resultElt.Quantity__ || 0).add(resultElt.ReturnedQuantity__ || 0).toNumber();
                        }
                    }
                    //If one of the GR lines for this PO/line combination is fully delivered, we should prevent the ASN for this line
                    return deliveryCompleted === false;
                });
            }
            if (deliveryCompleted) {
                Log.Info(`FillOpenedQuantities - PO/line:${poNumber}/${lineNumber} - Line is already fully delivered`);
                //If the line is already fully delivered, we should prevent the customer from accepting the ASN
                item.SetValue("ItemQuantityToReceive__", 0);
                item.SetValue("ItemQuantityReceived__", 0);
                //Setting a warning, not an error, cause other lines might be valid
                item.SetWarning("ItemQuantityToReceive__", "_Line is already fully delivered");
                Controls.LineItems__.GetRow(i).SetReadOnly(true);
            }
            else {
                Log.Info(`FillOpenedQuantities - PO/line:${poNumber}/${lineNumber} quantityToReceive -> ${quantityToReceive}`);
                item.SetValue("ItemQuantityToReceive__", quantityToReceive);
                //Do not check errors if line is readonly
                if (!Controls.LineItems__.GetRow(i).IsReadOnly()) {
                    CheckOverReceivingQuantity(item);
                }
            }
        });
        ProcessInstance.SetSilentChange(false);
        Log.Info("FillOpenedQuantities - Quantities to receive successfully initialized for the " + Controls.LineItems__.GetItemCount().toString() + " item rows");
    }
    catch (error) {
        Log.Error("FillOpenedQuantities - Error when retrieving GR data : " + error.toString());
    }
}
//#endregion
////////////////////////////////////////////////////
// START
////////////////////////////////////////////////////
async function Run() {
    Lib.P2P.InitValidityDateTime("PAC");
    Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
    Controls.CompanyCode__.Wait(true);
    Lib.Shipping.InitDefaultCompanyCode().Finally(() => Controls.CompanyCode__.Wait(false));
    await InitLayout();
    RegisterHandlers();
    DisplayNextAlert();
    OnExecutedAction();
    FillOpenedQuantities();
    Sys.Parameters.GetInstance("P2P").IsReady(function () {
        InitConversation();
    });
    Log.TimeEnd("CustomScript");
}
if (typeof _ENV_TEST_ENABLED === "undefined") {
    Run();
}
//# sourceMappingURL=customscript.js.map