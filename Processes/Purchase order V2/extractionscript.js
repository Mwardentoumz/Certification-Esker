"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ExtractionScript;
(function (ExtractionScript) {
    var ContractSpendingHandler = Lib.Spending.Contract.Handler;
    var ContractSpendingUpdater = Lib.Spending.Contract.Updater;
    var POContractSpending = Lib.Purchasing.POContractSpending;
    var poSpendingDispatcher = Lib.Purchasing.poSpendingDispatcher;
    const contractSpendingHandler = new ContractSpendingHandler();
    const poContractSpending = new POContractSpending(contractSpendingHandler, new ContractSpendingUpdater(contractSpendingHandler));
    poSpendingDispatcher.Register(poContractSpending);
    async function FillPurchaseOrder() {
        let options = { resetItems: true, orderByClause: null };
        const prRuidEx = Variable.GetValueAsString("PR_RuidEx__");
        let filter = `(PRRUIDEX__=${prRuidEx})`;
        options.orderByClause = "LineNumber__ ASC";
        const orderedItemsSubFilter = Variable.GetValueAsString("PR_OrderedItemsSubFilter");
        if (orderedItemsSubFilter) {
            filter = `(&${filter}${orderedItemsSubFilter})`;
        }
        // only no completely ordered items for this ruidex
        Log.Info("Filling PO Form with items from filter: " + filter);
        try {
            await Lib.Purchasing.POItems.FillForm(filter, options);
            const nbLines = Data.GetTable("LineItems__").GetItemCount();
            Data.SetValue("NumberOfLines__", nbLines);
            if (Lib.Purchasing.IsMultiShipTo() && nbLines > 0 && Data.GetValue("EmailNotificationOptions__") == "PunchoutMode") {
                const firstItem = Data.GetTable("LineItems__").GetItem(0);
                //Filling header ship to with first line ship to, useful in punchout mode (Electronical Order).
                Data.SetValue("DeliveryAddressID__", firstItem.GetValue("ItemDeliveryAddressID__"));
                Data.SetValue("ShipToCompany__", firstItem.GetValue("ItemShipToCompany__"));
                Data.SetValue("ShipToAddress__", firstItem.GetValue("ItemShipToAddress__"));
            }
            Lib.Purchasing.CheckPO.CheckItemsDeliveryDates();
        }
        catch (e) {
            Lib.CommonDialog.NextAlert.Define("_Purchase order creation error", e, {
                isError: true,
                behaviorName: "POInitError"
            });
        }
    }
    ExtractionScript.FillPurchaseOrder = FillPurchaseOrder;
    function DownPaymentAsked() {
        let val = Data.GetValue("PaymentAmount__");
        return val !== null && val !== 0;
    }
    async function SendOrderAutomatically(emailNotificationOptionsParams, autoSendOrderParam) {
        // Fill data
        let inError = false;
        // If EmailNotificationOptions not set, use default value
        let emailNotificationOptions = emailNotificationOptionsParams || "";
        const customTransmissionMethods = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomOrderTransmissionMethods") || [];
        if (emailNotificationOptions !== "SendToVendor"
            && emailNotificationOptions !== "DontSend"
            && emailNotificationOptions !== "PunchoutMode"
            && emailNotificationOptions !== ""
            && !customTransmissionMethods.some(method => method.value === emailNotificationOptions)) {
            Log.Error("AutoSendOrder: Invalid value [" + emailNotificationOptions + "] for EmailNotificationOptions__ field");
            inError = true;
        }
        else if (emailNotificationOptions !== "") {
            Data.SetValue("EmailNotificationOptions__", emailNotificationOptions);
        }
        // VendorEmail is required when in SendToVendor mode
        // We retrieve the first known address for the vendor
        if (emailNotificationOptions === "SendToVendor" && !autoSendOrderParam.VendorEmail) {
            //Create Vendor contact if empty
            const vendor = Lib.Purchasing.Vendor.GetVendorContact();
            const autoCreateVendor = Sys.Parameters.GetInstance("PAC").GetParameterBool("AlwaysCreateVendor", false) && Sys.Parameters.GetInstance("PAC").GetParameterBool("EnablePortalAccountCreation", false);
            if (vendor) {
                autoSendOrderParam.VendorEmail = vendor.GetValue("EmailAddress");
            }
            // show an error if the autocreation of the vendor has failed during the processing of Lib.Purchasing.Vendor.GetVendorContact
            else if (autoCreateVendor) {
                Data.SetError("VendorEmail__", "This field is required");
                Log.Error("Vendor could not be created");
                inError = true;
            }
            // in case of a purchase order in not auto create vendor, if the email adress is empty we need to warn the user
            else if (!Data.GetValue("VendorEmail__")) {
                Data.SetError("VendorEmail__", "This field is required");
                Log.Error("Vendor email is empty");
                inError = true;
            }
        }
        if (autoSendOrderParam.VendorEmail) {
            Data.SetValue("VendorEmail__", autoSendOrderParam.VendorEmail);
        }
        if (autoSendOrderParam.VendorLogin) {
            Variable.SetValueAsString("ContactLogin", autoSendOrderParam.VendorLogin);
        }
        if (autoSendOrderParam.BuyerComment) {
            Data.SetValue("BuyerComment__", autoSendOrderParam.BuyerComment);
        }
        if (autoSendOrderParam.ValidityStart) {
            Data.SetValue("ValidityStart__", autoSendOrderParam.ValidityStart);
        }
        if (autoSendOrderParam.ValidityEnd) {
            Data.SetValue("ValidityEnd__", autoSendOrderParam.ValidityEnd);
        }
        // Calculate downpayment
        const baseAmountFieldName = Lib.Purchasing.CheckPO.GetDownPaymentBaseAmountFieldName();
        const baseAmount = Data.GetValue(baseAmountFieldName);
        const res = Lib.Purchasing.PO.DownPayment.GetValues(baseAmount, autoSendOrderParam.PaymentAmount, autoSendOrderParam.PaymentPercent);
        Data.SetValue("PaymentPercent__", res.PaymentPercent);
        Data.SetValue("PaymentAmount__", res.PaymentAmount);
        const errors = await poSpendingDispatcher.CheckAsOrdered();
        if (errors.length > 0) {
            Log.Error(errors[0]);
            inError = true;
        }
        const lastErrorMessage = await Lib.Purchasing.CheckPO.CheckAll();
        if (lastErrorMessage) {
            Log.Error(`CheckAll set error on form: ${lastErrorMessage}`);
            inError = true;
        }
        inError = Lib.P2P.FormHasError() || inError; // Always do the check to highlight wrong fields even if we already encountered an error
        if (inError) {
            Log.Error("Order not autosent because of invalid data");
            sendNotificationPOInDraftMode("_A Purchase Order was not automatically sent", "Purchasing_Email_NotifAutoPOError.htm");
        }
        else {
            // Compute workflow
            Lib.Purchasing.PO.Workflow.controller.Define(Lib.Purchasing.PO.Workflow.parameters);
            Lib.Purchasing.PO.Workflow.UpdateRolesSequence(DownPaymentAsked());
            Data.SetValue("AutomaticOrder__", true);
        }
    }
    ExtractionScript.SendOrderAutomatically = SendOrderAutomatically;
    async function GetOrderTransmissionMethod(companyCode, vendorNumber, autoSendOrderParam) {
        if (autoSendOrderParam.EmailNotificationOptions !== "DefaultOrderTransmissionMethod") {
            return autoSendOrderParam.EmailNotificationOptions;
        }
        try {
            const preferences = await Lib.Purchasing.Vendor.QueryVendorPreferences(companyCode, vendorNumber);
            // Prompt method should not autosend
            if ((preferences === null || preferences === void 0 ? void 0 : preferences.POMethod__) && (preferences === null || preferences === void 0 ? void 0 : preferences.POMethod__) !== "Prompt") {
                return preferences.POMethod__;
            }
            throw "Preferred PO method not set for this vendor";
        }
        catch (e) {
            throw "PO not sent : Error querying preferred PO method: " + e;
        }
    }
    ExtractionScript.GetOrderTransmissionMethod = GetOrderTransmissionMethod;
    function sendNotificationPOInDraftMode(subject, template) {
        let row = Data.GetTable("LineItems__").GetItem(0);
        let requesterDN = row.GetValue("RecipientDN__");
        let requesterMail = Sys.Helpers.String.ExtractLoginFromDN(requesterDN);
        let options = {
            userId: requesterMail,
            subject,
            template,
            customTags: {
                RequesterName__: row.GetValue("ItemRequester__"),
                PRNumber__: row.GetValue("PRNumber__"),
                GoodsSummary: Lib.Purchasing.GetGoodsSummary()
            },
            fromName: "_EskerPurchaseOrder",
            backupUserAsCC: true,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false)
        };
        Lib.P2P.EmailNotification.SendEmailNotification(options);
    }
    function setPOInDraftMode(error) {
        Log.Error("setPOInDraftMode:" + error);
        let emailNotification = {
            subject: "_A purchase order was not automatically sent using the vendors default transmission method",
            template: "Purchasing_Email_NotifAutoPODraft.htm"
        };
        if (error === "PO not sent: Vendor has not been registered yet") {
            emailNotification.subject = "_A purchase order was not automatically sent because the vendor is pending registration";
            emailNotification.template = "Purchasing_Email_NotifAutoPOVendorPending.htm";
        }
        sendNotificationPOInDraftMode(emailNotification.subject, emailNotification.template);
    }
    function callCustomizationOnLoad() {
        Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnLoad");
    }
    async function Start() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- PO Extraction Script -- Name: '" + (currentName || "<empty>") + "', Action: '" + (currentAction || "<empty>") + "'");
        await Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnExtractionScriptBegin");
        const prRuidEx = Variable.GetValueAsString("PR_RuidEx__");
        if (prRuidEx) {
            for (let i = Attach.GetNbAttach() - 1; i >= 0; i--) {
                const attachmentName = Attach.GetName(i) + Attach.GetExtension(i);
                const shouldAttach = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.ShouldAttachFromPRToPO", attachmentName);
                if (shouldAttach === false) {
                    Log.Info("[PurchaseOrderExtraction] Attachment excluded from PO: " + attachmentName);
                    Attach.RemoveAttach(i);
                }
            }
        }
        // set some values on record
        Lib.Purchasing.InitTechnicalFields();
        Lib.P2P.InitSAPConfiguration("PAC");
        Lib.Purchasing.PO.Validation.SetupDataConfigurations();
        const autoSendOrderParamString = Variable.GetValueAsString("AutoSendOrderParam");
        const hasAutoSendOrderParam = autoSendOrderParamString && autoSendOrderParamString !== "{}";
        if (Lib.Purchasing.IsAutoCreateOrderEnabledFromCustomization() || Lib.Purchasing.IsAutoCreateOrderEnabledFromPopup() || hasAutoSendOrderParam) {
            await ExtractionScript.FillPurchaseOrder();
        }
        else {
            Log.Info("PO created from scratch.");
        }
        const isAutoSendOrderEnabled = ((Lib.Purchasing.IsAutoCreateOrderEnabledFromCustomization() || Lib.Purchasing.IsAutoCreateOrderEnabledFromPopup())
            && !!Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.IsAutoSendOrderEnabled")) || hasAutoSendOrderParam;
        let autoSendOrderParam = {
            autoOrder: isAutoSendOrderEnabled
        };
        if (hasAutoSendOrderParam) {
            autoSendOrderParam = JSON.parse(autoSendOrderParamString);
        }
        if (isAutoSendOrderEnabled) {
            Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.CustomizeAutoSendOrderParam", autoSendOrderParam);
        }
        Log.Info("autoSendOrderParam: ", JSON.stringify(autoSendOrderParam));
        Variable.SetValueAsString("wkfdata", "");
        Variable.SetValueAsString("wkfdata_history", "");
        try {
            if (Lib.P2P.Inventory.IsInternalOrder()) {
                const companyCode = Data.GetValue("CompanyCode__");
                const warehouse = await Lib.P2P.Inventory.Warehouse.GetWarehouse(companyCode, Data.GetValue("WarehouseID__"));
                Data.SetValue("DeliveryAddressID__", warehouse.shipToID);
                const result = await Lib.Purchasing.ShipTo.QueryShipToById(warehouse.shipToID, companyCode);
                await Lib.Purchasing.ShipTo.Fill((field) => result.GetValue(field));
                await ExtractionScript.SendOrderAutomatically("DontSend", autoSendOrderParam);
            }
            else if (Lib.Purchasing.IsAutoOrderRequested(autoSendOrderParam.autoOrder)) {
                if (!Sys.Helpers.IsEmpty(Data.GetValue("VendorName__"))) {
                    try {
                        const emailNotificationOptionsParams = await ExtractionScript.GetOrderTransmissionMethod(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"), autoSendOrderParam);
                        await ExtractionScript.SendOrderAutomatically(emailNotificationOptionsParams, autoSendOrderParam);
                    }
                    catch (e) {
                        setPOInDraftMode(e);
                    }
                }
                else {
                    await ExtractionScript.SendOrderAutomatically(autoSendOrderParam.EmailNotificationOptions === "DefaultOrderTransmissionMethod" ? "SendToVendor" : autoSendOrderParam.EmailNotificationOptions, autoSendOrderParam);
                    setPOInDraftMode("PO not sent: Vendor has not been registered yet");
                }
            }
        }
        finally {
            callCustomizationOnLoad();
        }
    }
    ExtractionScript.Start = Start;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Lib.P2P.HandleScriptError(Start());
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map