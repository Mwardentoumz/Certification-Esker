"use strict";
/* Advanced Shipping Notice HTML page script */
const nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
let currentStatus = Data.GetValue("Status__");
Log.Time("CustomScript");
function InitLayout() {
    Sys.Helpers.Banner.SetMainTitle("_Advanced Shipping Notice");
    Sys.Helpers.Banner.SetSubTitleAligned(true);
    Sys.Helpers.Banner.SetCentered(false);
    Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
    Controls.form_header.SetProcessDisplayName("_Advanced Shipping Notice");
    const sourceType = Controls.ASNSourceType__.GetValue();
    const lineItemsReadOnly = currentStatus !== "Draft";
    if (lineItemsReadOnly) {
        setTimeout(() => {
            Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
        });
    }
    Controls.LineItems__.HideBottomNavigation(true);
    Controls.LineItems__.HideTableRowAdd(true);
    Controls.LineItems__.HideTableRowDelete(true);
    Controls.RefreshPreview__.Hide(currentStatus !== "Draft");
    Controls.LineItems__.ItemQuantityToShip__.Hide(currentStatus !== "Draft");
    Controls.LineItems__.ItemPOLineQuantity__.SetReadOnly(true);
    const isUOMEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
    Controls.LineItems__.ItemUOM__.Hide(!isUOMEnabled);
    Controls.LineItems__.ItemUOM__.SetReadOnly(true);
    Controls.ASNNumber__.SetRequired(true);
    Controls.ShipToAddress__.SetReadOnly(lineItemsReadOnly);
    Lib.Shipping.Client.InitVendorNameControl(sourceType, lineItemsReadOnly);
    Controls.LineItems__.SetWidth("100%");
    Controls.LineItems__.SetExtendableColumn("ItemDescription__");
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
        case "Draft":
            InitRequestStep();
            break;
        default:
            InitRequestStep();
            break;
    }
    InitConversation();
}
function InitConversation() {
    Controls.ConversationUI__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsSupplier));
    Controls.ConversationPane.Hide(!Controls.ClientASNRUIDEX__.GetValue());
}
function ShowQuantitiesButtons() {
    Controls.ResetShippedQuantities__.Hide(false);
    Controls.FillShippedQuantities__.Hide(false);
    Controls.Spacer4__.Hide(false);
    Controls.Spacer5__.Hide(false);
}
function InitRequestStep() {
    Lib.Shipping.Client.InitControl(false);
    Controls.Save__.Hide(false);
    Sys.Helpers.Banner.SetSubTitle(Lib.Shipping.StatusLabels.Draft);
    ShowQuantitiesButtons();
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
    const hideNotes = !Sys.Helpers.Data.FindTableItem("LineItems__", (lineItem) => {
        return !Sys.Helpers.IsEmpty(lineItem.GetValue("ItemNote__"));
    });
    Controls.LineItems__.ItemNote__.Hide(hideNotes);
}
function InitSubmittedStep() {
    InitResultStep(Lib.Shipping.StatusLabels.Submitted);
}
function InitReceivedSteps(status) {
    InitResultStep(status);
    Controls.LineItems__.ItemQuantityReceived__.Hide(false);
    Controls.LineItems__.ItemQuantityReceived__.SetReadOnly(true);
    Controls.LineItems__.ItemQuantityReceived__.SetRequired(true);
    Controls.ASNDeliveryDate__.Hide(false);
}
function CheckAllLinesEmpty() {
    const hasAllEmptyLines = !Sys.Helpers.Data.FindTableItem("LineItems__", (lineItem) => {
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
    Controls.LineItems__.ItemQuantity__.OnChange = function () {
        CheckErrorOnRow(this.GetRow());
    };
    Controls.FillShippedQuantities__.OnClick = FillShippedQuantities;
    Controls.ResetShippedQuantities__.OnClick = ResetShippedQuantities;
}
function FillShippedQuantities() {
    Sys.Helpers.Data.ForEachTableItem("LineItems__", (line) => {
        line.SetError("ItemQuantity__", null);
        line.SetValue("ItemQuantity__", line.GetValue("ItemQuantityToShip__"));
    });
}
function ResetShippedQuantities() {
    Sys.Helpers.Data.ForEachTableItem("LineItems__", (line, i) => {
        line.SetValue("ItemQuantity__", null);
        line.SetError("ItemQuantity__", "");
        CheckErrorOnRow(Controls.LineItems__.GetRow(i));
    });
}
function DisplayNextAlert() {
    Lib.CommonDialog.NextAlert.Show({
        "PrepareDownloadablePreviewRPTDataFileError": {
            IsShowable: () => !!Data.GetActionName()
        },
        "onUnexpectedError": {
            IsShowable: function () {
                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("Quit__");
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
function CheckErrorOnRow(row) {
    const shippingField = row.ItemQuantity__;
    if (row.ItemQuantity__.GetValue() < 0) {
        shippingField.SetError("_Shipped qty cannot be negative");
        shippingField.ShowErrorMessage(true);
    }
    if (row.ItemQuantity__.GetValue() > row.ItemQuantityToShip__.GetValue() && typeof row.ItemQuantityToShip__.GetValue() === "number") {
        shippingField.SetError(Language.Translate("_Max shippable quantity exceeded", true, row.ItemQuantityToShip__.GetValue()));
        shippingField.ShowErrorMessage(true);
    }
}
function verifyIfAtLeastOneItemIsNotFullyShip() {
    if (currentStatus === "Draft" && Variable.GetValueAsString("atLeastOneItemIsNotFullyShip") === "false") {
        ProcessInstance.SetSilentChange(true);
        const onCommitAllItemAreFullyShipPopUpOption = function () {
            ProcessInstance.Quit("Quit");
        };
        Sys.Helpers.Globals.Popup.Alert("_Desc AllItemAreFullyShipPopUpOption", false, onCommitAllItemAreFullyShipPopUpOption, "_Title AllItemAreFullyShipPopUpOption");
    }
}
////////////////////////////////////////////////////
// START
////////////////////////////////////////////////////
verifyIfAtLeastOneItemIsNotFullyShip();
Controls.CompanyCode__.Wait(true);
Lib.Shipping.InitDefaultCompanyCode().Finally(() => Controls.CompanyCode__.Wait(false));
InitLayout();
RegisterHandlers();
DisplayNextAlert();
OnExecutedAction();
Log.TimeEnd("CustomScript");
//# sourceMappingURL=customscript.js.map