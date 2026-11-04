"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var validationscript;
(function (validationscript) {
    async function IsValid() {
        const isValid = !Lib.P2P.FormHasError();
        const customIsValid = await Sys.Helpers.TryCallFunction("Lib.RO.Customization.Common.OnValidateForm", isValid);
        if (typeof customIsValid === "boolean") {
            return customIsValid;
        }
        return isValid;
    }
    async function Run() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- RO Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice() + "'");
        await Sys.Helpers.TryCallFunction("Lib.RO.Customization.Server.OnValidationScriptStart");
        Lib.P2P.SetTablesToIndex(["LineItems__"]);
        if (currentAction === "approve_asynchronous" || currentAction === "approve" || currentAction === "ResumeWithAction") {
            switch (currentName) {
                case "Submit":
                    if (await IsValid()) {
                        await SubmitReturnOrder();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    break;
                default:
                    Process.PreventApproval();
                    break;
            }
        }
        // this code must be done once the configuration is loaded
        Lib.P2P.InitValidityDateTime("PAC");
        Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
        await Sys.Helpers.TryCallFunction("Lib.RO.Customization.Server.OnValidationScriptEnd");
    }
    validationscript.Run = Run;
    async function SubmitReturnOrder() {
        Log.Info("[SubmitReturnOrder]");
        Data.SetValue("ReturnDate__", new Date());
        RemoveUnreturnedItems();
        GenerateRONumber();
        try {
            await UpdateGoodsReceipts();
        }
        catch (e) {
            Log.Info("Error when updating good receipts");
        }
        try {
            await ManageROVendorCreation();
            ManageRightsAndStatus();
        }
        catch (e) {
            Log.Info("Error when creating vendor RO");
        }
        finally {
            Process.LeaveForm();
        }
    }
    validationscript.SubmitReturnOrder = SubmitReturnOrder;
    async function ManageROVendorCreation() {
        Log.Info("[ManageROVendorCreation]");
        const customerOrderNumber = Variable.GetValueAsString("CustomerOrderNumber");
        const vendor = Lib.Purchasing.Vendor.GetVendorContact();
        if (!customerOrderNumber) {
            validationscript.SendEmailToVendor(); //namespace here for TU purpose
            return;
        }
        const tr = await Lib.Purchasing.ReturnManagement.CreateVendorRO(vendor);
        FillVendorROfromClientRO(tr);
    }
    //send mail to vendor if the vendor doesnt use vendor portal
    function SendEmailToVendor() {
        Log.Info("[SendEmailToVendor]");
        Lib.Purchasing.ReturnManagement.SendNotifForROCreation(false);
    }
    validationscript.SendEmailToVendor = SendEmailToVendor;
    function ManageRightsAndStatus() {
        GiveReadRightToCurrentOwner();
        ChangeProcessStatusAndOwnership();
        AddPartyConversation(true, Variable.GetValueAsString("ROVendorLogin"));
    }
    // give read right to requester so he can still access the return order lines
    function GiveReadRightToCurrentOwner() {
        Process.AddRight(Data.GetValue("OwnerId"), "read");
        AddPartyConversation(false, Data.GetValue("OwnerId"));
    }
    function AddPartyConversation(isVendor, loginParty) {
        const customerOrderNumber = Variable.GetValueAsString("CustomerOrderNumber");
        if (!customerOrderNumber) {
            return;
        }
        if (!isVendor && loginParty) {
            // Internal user conversation
            Log.Info("Internal user Conversation - AddParty");
            const conversationInfo = Lib.P2P.Conversation.InitConversationInfo(Lib.P2P.Conversation.Options.GetReturnOrder());
            const vendorUser = Lib.Purchasing.Vendor.GetVendorContact();
            const internalUser = Users.GetUserAsProcessAdmin(loginParty);
            if (internalUser) {
                const internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
                const extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
                    BusinessId: internalUserInfo.BusinessId,
                    BusinessIdFieldName: internalUserInfo.BusinessIdFieldName,
                    OwnerID: internalUserInfo.OwnerID,
                    OwnerPB: internalUserInfo.OwnerPB,
                    RecipientCompany: vendorUser ? vendorUser.GetValue("Company") : ""
                });
                Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
            }
            else {
                Log.Error(`User ${loginParty} not found - not added to the conversation`);
            }
        }
        else if (isVendor) {
            // Internal user conversation
            Log.Info("Vendor Conversation - AddParty");
            const apClerkLogin = Lib.Purchasing.GetAPClerkLogin(true);
            const apClerkUser = Users.GetUserAsProcessAdmin(apClerkLogin);
            const vendorUser = Lib.Purchasing.Vendor.GetVendorContact();
            const vendorInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
            const roVendorRUIDEX = Data.GetValue("ROVendorRUIDEX__");
            const conversationInfo = Lib.P2P.Conversation.InitConversationInfo(Lib.P2P.Conversation.Options.GetReturnOrder(), roVendorRUIDEX);
            const extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
                BusinessId: vendorInfo.BusinessId,
                BusinessIdFieldName: vendorInfo.BusinessIdFieldName,
                OwnerID: vendorInfo.OwnerID,
                OwnerPB: vendorInfo.OwnerPB,
                RecipientCompany: apClerkUser ? apClerkUser.GetValue("Company") : ""
            });
            Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
        }
    }
    function ChangeProcessStatusAndOwnership() {
        const reviewer = Users.GetUser(Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("AP").GetParameter("DefaultAPClerk", "")));
        const newOwnerLogin = reviewer.GetValue("Login");
        Lib.Purchasing.ReturnManagement.SendNotifToReviewer(reviewer);
        SetStatus("_StatusSubmitted");
        Process.ChangeOwner(newOwnerLogin);
        AddPartyConversation(false, newOwnerLogin);
    }
    function SetStatus(status) {
        Log.Info(`[SetStatus] ${status}`);
        Data.SetValue("Status__", status);
    }
    function FillVendorROfromClientRO(clientVendorROProcess) {
        let vars = clientVendorROProcess.GetUninheritedVars();
        const technicalData = Lib.Purchasing.ReturnManagement.GetTechnicalData();
        Lib.Purchasing.ReturnManagement.FillTechnicalData(vars, technicalData);
        clientVendorROProcess.Process();
        const ROVendorRUIDEX = vars.GetValue_String("RUIDEX", 0);
        Data.SetValue("ROVendorRUIDEX__", ROVendorRUIDEX);
        const ROVendorLogin = vars.GetValue_String("OwnerID", 0);
        Variable.SetValueAsString("ROVendorLogin", ROVendorLogin);
    }
    function GenerateRONumber() {
        Log.Info("[GenerateRONumber]");
        let roNumber = Data.GetValue("RONumber__");
        if (!roNumber) {
            // Fetch previous GR number if it already exists (crash protection)
            roNumber = Transaction.Read("SafePAC_RONUMBER");
            if (!roNumber) {
                roNumber = Lib.P2P.NextNumber("RO", "RONumber__");
                Transaction.Write("SafePAC_RONUMBER", roNumber);
            }
            Data.SetValue("RONumber__", roNumber);
            Log.Info("Created with number " + roNumber);
        }
        else {
            Log.Info("Already created with number " + roNumber);
        }
    }
    /**
     * "Wake-up" all associated Goods receipt with action "OnReturnOrder", so they retrieve returned quantities
     */
    async function UpdateGoodsReceipts() {
        Log.Info("Update goods receipts");
        const PORuid = Data.GetValue("SourceRuid");
        const POMsnEx = PORuid.substring(PORuid.indexOf(".") + 1);
        const parameters = {
            processName: "Purchase order V2",
            tableName: "LineItems__",
            sourceMSNEXs: [POMsnEx],
            fields: [
                "Line_ItemCompanyCode__",
                "VendorNumber__",
                "OrderNumber__",
                "Line_LineItemNumber__",
                "Line_ItemGLAccount__",
                "Line_ItemCostCenterId__",
                "Line_ItemQuantity__",
                "Line_ItemNetAmountLocalCurrency__"
            ]
        };
        const lineItemsPO = Sys.Helpers.CDL.getCDLRecords(parameters);
        // get impacted GR numbers
        let grNumbers = {};
        let poLineNumbers = {};
        Sys.Helpers.Data.ForEachTableItem("LineItems__", (line) => {
            const grNumber = line.GetValue("GoodsReceiptNumber__");
            grNumbers[grNumber] = true;
            poLineNumbers[line.GetValue("POLineNumber__")] = true;
            if (lineItemsPO && lineItemsPO[POMsnEx]) {
                for (let i = 0; i < lineItemsPO[POMsnEx].length; i++) {
                    const lineItem = JSON.parse(JSON.stringify(lineItemsPO[POMsnEx][i]));
                    if (line.GetValue("POLineNumber__") == lineItem.Line_LineItemNumber__) {
                        lineItem.Line_ItemNetAmountLocalCurrency__ = lineItem.Line_ItemNetAmountLocalCurrency__ * line.GetValue("ReturnedQuantity__") / lineItem.Line_ItemQuantity__;
                        Sys.P2P.Accrual.PrepareDetailedAccrualEvent(Sys.P2P.Accrual.ActionType.PurchaseOrderItemReturned, lineItem);
                    }
                }
            }
        });
        Sys.P2P.Accrual.CommitDetailedAccrualEvents();
        const grNumbersHavingDeliveryCompleted = await GetGRItemsHavingDeliveryCompleted(Data.GetValue("OrderNumber__"), Object.keys(poLineNumbers));
        for (let grNumber of grNumbersHavingDeliveryCompleted) {
            grNumbers[grNumber] = true;
        }
        // fetch impacted GR ruidex from GRNumber__
        Log.Verbose(`Fetch GR ${Object.keys(grNumbers).join(", ")}`);
        const queryParam = {
            table: "CDNAME#Goods receipt V2",
            attributes: ["GRNumber__", "RuidEx"],
            filter: Sys.Helpers.LdapUtil.FilterIn("GRNumber__", Object.keys(grNumbers)).toString(),
            additionalOptions: {
                searchInArchive: true,
                asAdmin: true
            }
        };
        const results = await Sys.GenericAPI.PromisedQuery(queryParam);
        // wake-up GRs
        for (const result of results) {
            Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("Goods receipt", result.RuidEx, "OnReturnOrder", JSON.stringify({ poLineNumbers: Object.keys(poLineNumbers) }));
        }
        return true;
    }
    async function GetGRItemsHavingDeliveryCompleted(orderNumber, poLineNumbers) {
        Log.Verbose(`[GetGRHavingDeliveryCompleted] PO:${orderNumber}`);
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Line_OrderNumber__", orderNumber), Sys.Helpers.LdapUtil.FilterEqual("Line_ItemType__", Lib.P2P.ItemType.QUANTITY_BASED), Sys.Helpers.LdapUtil.FilterIn("Line_LineNumber__", poLineNumbers), Sys.Helpers.LdapUtil.FilterEqual("Line_DeliveryCompleted__", "1")).toString();
        Log.Info(`[GetGRHavingDeliveryCompleted] filter:${filter}`);
        const table = "CDLNAME#Goods receipt V2.LineItems__";
        const GRQueryOptions = {
            table,
            filter,
            attributes: [
                "Line_LineNumber__",
                "GRNumber__",
                "Line_DeliveryCompleted__"
            ]
        };
        const queryResults = await Sys.GenericAPI.PromisedQuery(GRQueryOptions);
        Log.Verbose(`[GetGRHavingDeliveryCompleted] queryResults length:${queryResults.length}`);
        Log.Verbose(`[GetGRHavingDeliveryCompleted] queryResults content:${JSON.stringify(queryResults)}`);
        return Sys.Helpers.Array.Map(queryResults, v => v.GRNumber__);
    }
    function RemoveUnreturnedItems() {
        Log.Info("[RemoveUnreturnedItems]");
        Sys.Helpers.Data.ForEachReverseTableItem("LineItems__", (line) => {
            if (line.GetValue("ReturnedQuantity__") === 0) {
                Log.Verbose(`Remove unreturned item GoodsReceiptNumber__:${line.GetValue("GoodsReceiptNumber__")} / POLineNumber__:${line.GetValue("POLineNumber__")}`);
                line.RemoveItem();
            }
        });
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Lib.P2P.HandleScriptError(Run());
    }
})(validationscript || (validationscript = {}));
//# sourceMappingURL=validationscript.js.map