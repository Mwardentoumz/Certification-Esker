"use strict";
var CustomScript;
(function (CustomScript) {
    function InitBanner(status = "_StatusDraft") {
        Sys.Helpers.Banner.SetMainTitle("_Return Order Title");
        Sys.Helpers.Banner.SetSubTitleAligned(true);
        Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
        Sys.Helpers.Banner.SetSubTitle(status);
    }
    function InitLayout() {
        const status = Data.GetValue("Status__");
        InitBanner(status);
        Controls.RequesterName__.SetReadOnly(true);
        InitFieldsVisibility(status);
        Controls.LineItems__.SetWidth("100%");
        Controls.LineItems__.SetExtendableColumn("Description__");
        if (Data.GetValue("ROVendorRUIDEX__")) {
            Controls.Events.Hide(false);
        }
        InitConversation();
        Sys.Helpers.TryCallFunction("Lib.RO.Customization.Client.CustomizeLayout");
    }
    CustomScript.InitLayout = InitLayout;
    function InitConversation() {
        const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({ Options: Lib.P2P.Conversation.defaultOptions }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
        Controls.ConversationUI__.Init(conversationInfo);
        Controls.ConversationUI__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsCustomer));
    }
    function InitFieldsVisibility(status) {
        Controls.RONumber__.Hide(Sys.Helpers.IsEmpty(Data.GetValue("RONumber__")));
        Controls.RODescription__.Hide(Sys.Helpers.IsEmpty(Data.GetValue("RODescription__")) && status !== "_StatusDraft");
        Controls.ReturnDate__.Hide(Sys.Helpers.IsEmpty(Data.GetValue("ReturnDate__")));
        Controls.LineItems__.ReturnableQuantity__.Hide(ProcessInstance.isReadOnly);
        Controls.LineItems__.AlreadyReturnedQuantity__.Hide(true);
        const isUOMEnabled = Sys.Parameters.GetInstance("PAC").GetParameterBool("DisplayUnitOfMeasure", false);
        Controls.LineItems__.UOM__.Hide(!isUOMEnabled);
    }
    function IsReturnReasonSelected(item) {
        const returnReason = item.GetValue("ReturnReason__");
        return returnReason !== "Unselected";
    }
    function IsReturnedQuantityFilled(item) {
        const returnedQuantity = item.GetValue("ReturnedQuantity__");
        return !(Sys.Helpers.IsEmpty(returnedQuantity) || returnedQuantity === 0);
    }
    function CheckComment(row) {
        Log.Info("CheckComment");
        const rowItem = row.GetItem();
        const returnReason = rowItem.GetValue("ReturnReason__");
        const isInError = returnReason === "Other" && Sys.Helpers.IsEmpty(rowItem.GetValue("Comment__"));
        rowItem.SetError("Comment__", isInError ? "_Mandatory Comment Error Message" : null);
        row.Comment__.ShowErrorMessage(isInError);
        return !isInError;
    }
    CustomScript.CheckComment = CheckComment;
    function CheckReturnReason(row) {
        Log.Info("CheckReturnReason");
        const rowItem = row.GetItem();
        const isInError = IsReturnReasonSelected(rowItem) !== IsReturnedQuantityFilled(rowItem);
        if (isInError && IsReturnReasonSelected(rowItem)) {
            rowItem.SetError("ReturnedQuantity__", "_Return Quantity not filled Error Message");
        }
        else if (isInError) {
            rowItem.SetError("ReturnReason__", "_Mandatory Reason Error Message");
        }
        return !isInError;
    }
    CustomScript.CheckReturnReason = CheckReturnReason;
    //#region checks on returned quantity
    function CheckReturnedQuantityLowerThanReturnableQuantity(row) {
        Log.Info("CheckReturnedQuantityLowerThanReturnableQuantity");
        const allowWrongSignReceptions = Sys.Parameters.GetInstance("PAC").GetParameterBool("allowWrongSignReceptions", false);
        const rowItem = row.GetItem();
        const quantityReturned = rowItem.GetValue("ReturnedQuantity__");
        const returnableQuantity = rowItem.GetValue("ReturnableQuantity__");
        const isInError = returnableQuantity < quantityReturned || quantityReturned < 0;
        let errorMessage = null;
        if (!allowWrongSignReceptions && quantityReturned < 0) {
            errorMessage = "_Returned Quantity Cannot Be Negative Error Message";
        }
        else if (returnableQuantity < quantityReturned) {
            errorMessage = "_Returned Quantity Over Returnable Quantity Error Message";
        }
        rowItem.SetError("ReturnedQuantity__", errorMessage);
        row.ReturnedQuantity__.ShowErrorMessage(isInError);
        return !isInError;
    }
    CustomScript.CheckReturnedQuantityLowerThanReturnableQuantity = CheckReturnedQuantityLowerThanReturnableQuantity;
    function CheckAtLeastOneReturnedQuantityFilled() {
        Log.Info("CheckAtLeastOneReturnedQuantityFilled");
        let isInError = true;
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (lineItem) {
            if (IsReturnedQuantityFilled(lineItem)) {
                isInError = false;
                return true;
            }
            return false;
        });
        if (isInError) {
            Popup.Alert("_No Returned Quantity Has Been Filled Error Message", isInError, null, "_Error On Returned Quantity Filled Title");
        }
        return !isInError;
    }
    CustomScript.CheckAtLeastOneReturnedQuantityFilled = CheckAtLeastOneReturnedQuantityFilled;
    function CheckErrorOnReturnedQuantity(row) {
        Log.Info("CheckErrorOnReturnedQuantity");
        return CheckReturnedQuantityLowerThanReturnableQuantity(row);
    }
    //remove errors on returned quantity and return reason if item has no return reason and no return quantity
    //avoid calling checks functions that are not meant to be called on update but only on form submit
    function ClearErrorsOnLineWithNoReturn(row) {
        const rowItem = row.GetItem();
        if (!IsReturnReasonSelected(rowItem) && !IsReturnedQuantityFilled(rowItem)) {
            rowItem.SetError("ReturnedQuantity__", "");
            rowItem.SetError("ReturnReason__", "");
        }
    }
    //#endregion
    async function CheckFormBeforeApproval() {
        Log.Info("CheckFormBeforeApproval");
        //check to avoid displaying popup if there is already an error on a line (to be less instrusive)
        let formIsValid = CheckAtLeastOneReturnedQuantityFilled();
        if (Process.ShowFirstError() === null) {
            const customIsValid = await Sys.Helpers.TryCallFunction("Lib.RO.Customization.Common.OnValidateForm", formIsValid);
            if (typeof customIsValid === "boolean") {
                formIsValid = customIsValid;
            }
            return formIsValid;
        }
        return false;
    }
    async function OpenOrder() {
        const sourcePONum = Data.GetValue("OrderNumber__");
        Controls.OrderNumber__.Wait(true);
        try {
            const results = await Sys.GenericAPI.PromisedQuery({
                table: "CDNAME#Purchase order V2",
                filter: "OrderNumber__=" + sourcePONum,
                attributes: ["ValidationURL"],
                sortOrder: "",
                maxRecords: 1,
                additionalOptions: { searchInArchive: true }
            });
            if (results && results.length) {
                Process.OpenLink({ url: results[0].ValidationURL, inCurrentTab: false });
            }
            else {
                Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
            }
        }
        catch (e) {
            Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
        }
        finally {
            Controls.OrderNumber__.Wait(false);
        }
    }
    CustomScript.OpenOrder = OpenOrder;
    //#region Handlers and links
    function RegisterHandlers() {
        RegisterOnClickHandlers();
        RegisterOnChangeHandlers();
        CreateLinks();
    }
    CustomScript.RegisterHandlers = RegisterHandlers;
    function CreateLinks() {
        const sourcePONum = Data.GetValue("OrderNumber__");
        if (sourcePONum) {
            Controls.OrderNumber__.DisplayAs({ type: "Link" });
        }
        //Line Items
        Sys.Helpers.Controls.ForEachTableRow(Controls.LineItems__, (row) => {
            Lib.Purchasing.ReturnManagement.Items.GRNumber.SetLink(row);
        });
    }
    CustomScript.CreateLinks = CreateLinks;
    function RegisterOnChangeHandlers() {
        Controls.LineItems__.ReturnReason__.OnChange = function () {
            CheckReturnReason(this.GetRow());
            CheckComment(this.GetRow());
            ClearErrorsOnLineWithNoReturn(this.GetRow());
        };
        Controls.LineItems__.ReturnedQuantity__.OnChange = function () {
            CheckErrorOnReturnedQuantity(this.GetRow());
            CheckReturnReason(this.GetRow());
            ClearErrorsOnLineWithNoReturn(this.GetRow());
        };
        Controls.LineItems__.Comment__.OnChange = function () {
            CheckComment(this.GetRow());
        };
    }
    CustomScript.RegisterOnChangeHandlers = RegisterOnChangeHandlers;
    function RegisterOnClickHandlers() {
        // Make Order number field clickable
        const sourcePONum = Data.GetValue("OrderNumber__");
        if (sourcePONum) {
            Controls.OrderNumber__.OnClick = OpenOrder;
        }
        Controls.Submit.OnClick = CheckFormBeforeApproval;
        //line items
        Controls.LineItems__.GoodsReceiptNumber__.OnClick = Lib.Purchasing.ReturnManagement.Items.GRNumber.OnClick;
    }
    CustomScript.RegisterOnClickHandlers = RegisterOnClickHandlers;
    //#endregion
    //#region Filling of missing/computed data
    function CompleteFormData() {
        Log.Info("CompleteFormData");
        FillReturnableQuantity();
    }
    CustomScript.CompleteFormData = CompleteFormData;
    function FillReturnableQuantity() {
        Log.Info("FillReturnableQuantity");
        ProcessInstance.SetSilentChange(true);
        Sys.Helpers.Data.ForEachTableItem("LineItems__", (lineItem) => {
            const receivedQuantity = lineItem.GetValue("ReceivedQuantity__");
            const alreadyReturnedQuantity = lineItem.GetValue("AlreadyReturnedQuantity__");
            if (receivedQuantity) {
                const returnableQuantity = new Sys.Decimal(receivedQuantity).minus(alreadyReturnedQuantity ? alreadyReturnedQuantity : 0);
                lineItem.SetValue("ReturnableQuantity__", returnableQuantity ? returnableQuantity.toNumber() : 0);
            }
        });
        ProcessInstance.SetSilentChange(false);
    }
    //#endregion
    async function Run() {
        Log.Time("CustomScript.Run");
        //Load parameters first
        await Sys.Parameters.GetInstance("PAC").PromisedIsReady();
        RegisterHandlers();
        InitLayout();
        CompleteFormData();
        Log.TimeEnd("CustomScript.Run");
    }
    CustomScript.Run = Run;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        void Run();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map