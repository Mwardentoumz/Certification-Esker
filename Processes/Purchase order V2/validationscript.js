"use strict";
var ValidationScript;
(function (ValidationScript) {
    var ContractSpendingHandler = Lib.Spending.Contract.Handler;
    var ContractSpendingUpdater = Lib.Spending.Contract.Updater;
    var POContractSpending = Lib.Purchasing.POContractSpending;
    var poSpendingDispatcher = Lib.Purchasing.poSpendingDispatcher;
    var ProjectSpendingHandler = Lib.Spending.Project.Handler;
    var ProjectSpendingUpdater = Lib.Spending.Project.Updater;
    var POProjectSpending = Lib.Purchasing.POProjectSpending;
    var POStatus = Lib.Purchasing.POStatus;
    const parameters = Lib.Purchasing.PO.Workflow.parameters;
    const treasurerLogin = Lib.P2P.ResolveDemoLogin(Sys.Parameters.GetInstance("PAC").GetParameter("TreasurerLogin"));
    poSpendingDispatcher.Register(Lib.Purchasing.poBudgetSpending);
    const contractSpendingHandler = new ContractSpendingHandler();
    const poContractSpending = new POContractSpending(contractSpendingHandler, new ContractSpendingUpdater(contractSpendingHandler));
    poSpendingDispatcher.Register(poContractSpending);
    const projectSpendingHandler = new ProjectSpendingHandler();
    const poProjectSpending = new POProjectSpending(projectSpendingHandler, new ProjectSpendingUpdater(projectSpendingHandler));
    poSpendingDispatcher.Register(poProjectSpending);
    ValidationScript.wkfController = Lib.Purchasing.PO.Workflow.controller;
    const g_newComment = Data.GetValue("Comments__");
    function AreAllGRItemsCanceled() {
        const grItemsFilter = "(&(!(Status__=Canceled))(OrderNumber__=" + Data.GetValue("OrderNumber__") + "))";
        let query = Process.CreateQuery();
        query.SetSpecificTable(Lib.Purchasing.Items.GRItemsDBInfo.table);
        query.SetFilter(grItemsFilter);
        return query.GetRecordCount() == 0;
    }
    ValidationScript.ERPHandler = {
        get poNumber() {
            return Variable.GetValueAsString("ERPACK_OrderNumber__") || Data.GetValue("OrderNumber__");
        },
        get erpError() {
            return Variable.GetValueAsString("ERPACK_Error__");
        },
        CanReceiveAck(ERPAction) {
            const incoming = Variable.GetValueAsString("ERPACK_TransactionID__");
            const canReceiveAck = Lib.Purchasing.PO.ERP.IsCurrentAck(ERPAction, incoming);
            if (!canReceiveAck) {
                Log.Warn(`Ignore ERP Ack : (Order Status=${Data.GetValue("OrderStatus__")}, SubStatus=${Data.GetValue("OrderSubStatus__")}, Action=${ERPAction}, Expected AckID=${Data.GetValue("ERPNextTransactionID__")}, Incoming AckID=${incoming})`);
            }
            return canReceiveAck;
        },
        async HandleERPAckReceived(ERPAction) {
            try {
                const nonEditActions = ["Create", "Cancel"];
                if (!nonEditActions.includes(ERPAction)) {
                    await Lib.Purchasing.PO.Edition.Manager.ValidateEditOrder();
                }
                switch (ERPAction) {
                    case "Update": return await ValidationScript.ERPHandler.HandleAckUpdate();
                    case "Create": return await ValidationScript.ERPHandler.HandleAckSubmission();
                    case "CancelItems": return await ValidationScript.ERPHandler.HandleAckCancelItems();
                    case "ReOpenItems": return await ValidationScript.ERPHandler.HandleAckReOpenItems();
                    case "Cancel": return await ValidationScript.ERPHandler.HandleAckCancel();
                    default: return false;
                }
            }
            catch (error) {
                Log.Error("Ack handling error: ", error);
                await ProcessEditPORequestError(error);
                return false;
            }
        },
        async HandleERPAckError(ERPAction) {
            ValidationScript.ERPHandler.SetAckError();
            if (ERPAction === "Create") {
                await ValidationScript.ERPHandler.HandleAckCreateError();
            }
            else {
                Lib.Purchasing.PO.Edition.Rollback.NeedRollbackUpTo("ChangeInERP");
                Process.WaitForUpdate();
            }
            SendEmailToBuyerOnERPAsyncError(ERPAction);
        },
        HandleUnexpectedAck() {
            const status = Data.GetValue("OrderStatus__");
            if (status === POStatus.toPay || status === POStatus.toOrder) {
                Process.PreventApproval();
            }
            else if (Lib.Purchasing.POStatus.ForERP.includes(status)) {
                Process.WaitForUpdate();
            }
        },
        async ProcessAck(action, ERPAction) {
            if (ValidationScript.ERPHandler.CanReceiveAck(ERPAction)) {
                if (action === "OnERPAckReceived") {
                    Log.Info(`Processing ERP Ack Action '${ERPAction}'`);
                    Variable.SetValueAsString("AllowStatusUpdate", true);
                    const done = await ValidationScript.ERPHandler.HandleERPAckReceived(ERPAction);
                    Variable.SetValueAsString("AllowStatusUpdate", "");
                    if (done) {
                        Data.SetValue("OrderSubStatus__", "");
                        ValidationScript.ERPHandler.ClearAckError();
                    }
                    else {
                        Process.WaitForUpdate();
                    }
                }
                else {
                    Log.Info(`Reseting transction now that a erpAck is received`);
                    Lib.ERP.ExecuteERPFunc("CommitTransaction", "PO");
                    Log.Info(`Processing ERP Ack Error Action '${ERPAction}'`);
                    await ValidationScript.ERPHandler.HandleERPAckError(ERPAction);
                }
                Lib.Purchasing.PO.ERP.ResetAckID();
            }
            else {
                ValidationScript.ERPHandler.HandleUnexpectedAck();
            }
        },
        async SetPONumberFromAck() {
            if (ValidationScript.ERPHandler.poNumber) {
                const isNumberUnique = await ValidationScript.HandleNumberUnicity(ValidationScript.ERPHandler.poNumber);
                Variable.SetValueAsString("ERPACK_OrderNumber__", "");
                return isNumberUnique;
            }
            Log.Warn("No order number receive from the ERP");
            return false;
        },
        SetAckError() {
            const erpError = ValidationScript.ERPHandler.erpError || Language.Translate("_No error provided by ERP");
            Data.SetValue("ERPError__", erpError);
            Log.Info("ERPAck error: ", erpError);
            Variable.SetValueAsString("ERPACK_Error__", "");
        },
        ClearAckError() {
            Log.Info("ClearAckError");
            Data.SetValue("ERPError__", "");
        },
        async UpdatePO() {
            try {
                Lib.ERP.ExecuteERPFunc("AttachURL", "PO");
                await Lib.Purchasing.Vendor.PO.SetVendorCommunicationCultureAndLanguage();
                let bok = await ValidationScript.AttachPO();
                bok = bok && !poSpendingDispatcher.AsOrdered({ forceUpdateOperationDetails: true }).length;
                Lib.Purchasing.POItems.SetCorporateCurrencyAndRate();
                Lib.Purchasing.POItems.ComputeTotalNetCorporateCurrency();
                // Re-synchronize items as they may have been modified when computing budget
                bok = bok && await SynchronizeItems();
                bok = bok && await Lib.P2P.Inventory.CreateOrUpdateInventoryMovementFromPOItems(Data.GetValue("RuidEx"), Data.GetValue("OrderStatus__"), Data.GetValue("CompanyCode__"), Data.GetValue("OrderNumber__"));
                bok = bok && await SendOrderToVendor();
                if (bok) {
                    Lib.Purchasing.PO.Validation.InsertAPPOHeader(Data.GetValue("OrderNumber__"));
                    Lib.Purchasing.PO.Validation.UpdateAPPOItemsTable("INSERT", "CreatePO");
                    Lib.Purchasing.PO.Validation.InsertAPPOItemsInAccrualTable(Sys.P2P.Accrual.ActionType.PurchaseOrderItemOrdered);
                    Lib.Purchasing.CheckPO.ResetWarning();
                    const buyersWithRights = Lib.Purchasing.PO.Validation.GiveReadRightToBuyers(Lib.P2P.GetValidatorOrOwnerLogin());
                    const ccManagersWithRights = await Lib.Purchasing.PO.Validation.GiveReadRightsToCostCenterManagers();
                    const p2pSupervisor = await Lib.Purchasing.SetRightForP2PSupervisor();
                    const procurementViewer = await Lib.Purchasing.SetRightForProcurementViewer();
                    const contractOwner = await Lib.Purchasing.SetRightForContractOwner();
                    const defaultOCRecipient = await Lib.Purchasing.SetRightForDefaultOCRecipient();
                    const customUsersWithRights = Lib.Purchasing.SetRightToCustomUsers("PO");
                    const usersWithRights = new Set([...buyersWithRights, ...ccManagersWithRights, ...p2pSupervisor, ...procurementViewer, ...contractOwner, ...customUsersWithRights, ...defaultOCRecipient]);
                    // Add Recipient to read right on invoice
                    const usersWithReadRightsOnInvoice = new Set([...usersWithRights, ...GetReceivers()]);
                    Variable.SetValueAsString("UsersWithReadRights__", JSON.stringify(Array.from(usersWithReadRightsOnInvoice)));
                    for (const userLogin of usersWithRights) {
                        GiveRightOnConversationToUser(userLogin, false);
                    }
                    let comment = g_newComment;
                    const contributionData = Lib.Purchasing.PO.Workflow.GetContributionData(ValidationScript.wkfController.GetContributorIndex(), parameters.actions.ordered.GetName(), comment, { onBehalfOf: true });
                    // If contributor is workflow automatically created order step
                    if (Lib.Purchasing.PO.Workflow.IsEnabled() && contributionData.contributorId.startsWith("doOrder")) {
                        contributionData.comment = Language.Translate("_Comment order created with number {0}", false, Data.GetValue("OrderNumber__"));
                    }
                    if (Lib.Purchasing.PO.DownPayment.IsAsked()) {
                        ValidationScript.wkfController.NextContributor(contributionData);
                        Data.SetValue("OrderStatus__", POStatus.toPay);
                        SendEmailToRequesters();
                        SendNotifWaitingForDownPaymentToTreasurer();
                        Log.Info("Forwarding purchase order to Treasurer: " + treasurerLogin);
                        Process.Forward(treasurerLogin);
                    }
                    else {
                        ValidationScript.wkfController.EndWorkflow(contributionData);
                        Lib.Purchasing.PO.Validation.SetAsToReceive();
                        SendEmailToRequesters();
                        await WaitForDelivery();
                        Process.WaitForUpdate();
                    }
                    Log.Info(`OrderStatus__ set to '${Data.GetValue("OrderStatus__")}'`);
                }
                else {
                    Data.SetValue("OrderStatus__", POStatus.toOrder);
                    Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
                    Process.PreventApproval();
                }
            }
            catch (e) {
                Log.Error(e.toString());
                Lib.CommonDialog.NextAlert.Define("_Purchase order creation error", "_PO unhandled exception error message");
                Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
                Process.PreventApproval();
            }
        },
        async HandleAckSubmission() {
            if (await ValidationScript.ERPHandler.SetPONumberFromAck()) {
                await ValidationScript.ERPHandler.UpdatePO();
                Data.SetValue("OrderSubStatus__", "");
                return true;
            }
            Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
            return false;
        },
        async HandleAckUpdate() {
            if (Variable.GetValueAsString("FromEditPORequest")) {
                Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("EditPORequest", Variable.GetValueAsString("FromEditPORequest"), "EditPOSuccess");
                Variable.SetValueAsString("FromEditPORequest", "");
            }
            Lib.Purchasing.CheckPO.ResetWarning();
            if (Data.GetValue("OrderStatus__") !== POStatus.received) {
                Process.WaitForUpdate();
            }
            return true;
        },
        async HandleAckCancelItems() {
            const hasReception = Variable.GetValueAsString("HasReception") === "true";
            if (!hasReception) {
                CancelCustomerOrderOnPortal();
            }
            Variable.SetValueAsString("HasReception", "");
            Data.SetValue("OrderStatus__", POStatus.received);
            return true;
        },
        async HandleAckReOpenItems() {
            if (!Lib.Purchasing.POItems.HasReception()) {
                ReopenCustomerOrderOnPortal();
            }
            Process.WaitForUpdate();
            Data.SetValue("OrderStatus__", POStatus.toReceive);
            return true;
        },
        async HandleAckCancel() {
            let ok = false;
            const rejectionAction = Variable.GetValueAsString("RejectionAction__");
            if (rejectionAction) {
                ok = await ValidationScript.ERPHandler.HandleAckRejection(rejectionAction);
            }
            else {
                if (ValidationScript.wkfController.IsEnded()) {
                    ValidationScript.wkfController.Restart(Lib.Purchasing.PO.Workflow.GetContributionData(0, parameters.actions.canceled.GetName(), g_newComment, { onBehalfOf: true }));
                    Data.SetValue("Comments__", g_newComment);
                }
                ok = await ValidationScript.wkfController.DoAction(parameters.actions.canceled.GetName());
            }
            return ok;
        },
        async HandleAckRejection(rejectionAction) {
            let ok = false;
            const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
            const actionName = parameters.actions.rejected.GetName();
            const contributor = CreateRejectionContributor(rejectionAction, data);
            if (ValidationScript.wkfController.IsEnded()) {
                ValidationScript.wkfController.Reopen();
            }
            const currentSequenceStep = ValidationScript.wkfController.GetContributorIndex();
            ValidationScript.wkfController.AddContributorAt(currentSequenceStep, contributor);
            ok = await ValidationScript.wkfController.DoAction(actionName);
            if (rejectionAction === "RejectFromOC") {
                Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("S2P - Order Confirmation", data.sourceRUIDEX, ok ? "EditPOSuccess" : "EditPOError");
            }
            Variable.SetValueAsString("RejectionAction__", "");
            return ok;
        },
        async HandleAckCreateError() {
            const shouldUnlock = Sys.Helpers.IsEmpty(Variable.GetValueAsString("ERPACK_OrderNumber__"));
            await ValidationScript.ERPHandler.SetPONumberFromAck();
            if (shouldUnlock) {
                try {
                    await Lib.Purchasing.PO.Validation.DeleteItems("Cancel_PO");
                    poSpendingDispatcher.AsCanceled({ forceUpdateOperationDetails: true });
                }
                catch (e) {
                    Log.Error(e.toString());
                }
            }
            Data.SetValue("OrderStatus__", POStatus.toOrder);
            Process.PreventApproval();
        },
    };
    function CancelInERP() {
        if (Lib.P2P.Inventory.IsInternalOrder()) {
            Log.Info("Do not cancel PO in ERP for internal order");
            return { success: true };
        }
        if (Lib.ERP.IsSAP() || (Lib.ERP.IsUniversal() && Lib.Purchasing.PO.ERP.IsUniversalCancelEnabled())) {
            let res = null;
            Log.Info("CancelInERP");
            Lib.Purchasing.PO.ERP.SetERPAckID();
            res = Lib.ERP.ExecuteERPFunc("Cancel", "PO");
            if (!res || res.error) {
                Log.Error("Error during cancel in ERP. Details: " + res.error);
                Lib.CommonDialog.NextAlert.Define("_PO cancel error", "_PO cancel error message", {
                    isError: true,
                    behaviorName: "POCancelError"
                });
                Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
                Process.PreventApproval();
            }
            return { success: !res.error, isAsynchronous: (res === null || res === void 0 ? void 0 : res.ret.isAsynchronous) === true };
        }
        Log.Info("ERP cancel is disabled in configuration.");
        // Return success:true to finish the cancelation flow even if no cancelation in ERP
        return { success: true };
    }
    function CreatePOInERP() {
        Log.Time("CreatePOInERP");
        let poData = { number: Data.GetValue("OrderNumber__") };
        const ERPName = Lib.ERP.GetERPName();
        const createDocInERP = Sys.Parameters.GetInstance("P2P_" + ERPName).GetParameter("CreateDocInERP");
        Lib.Purchasing.PO.ERP.SetERPAckID();
        const autoSendOrderParam = Lib.Purchasing.PR.ExternalFile.Server.GetAutoSendOrderParam();
        if (!Sys.Helpers.IsEmpty(autoSendOrderParam.PONumber)) {
            poData.number = autoSendOrderParam.PONumber;
            Data.SetValue("OrderNumber__", autoSendOrderParam.PONumber);
            Log.Info("Do not create order in ERP because a PO number was provided by automatic PO creation");
        }
        else if (poData.number) {
            Log.Info("Already created with number " + poData.number);
        }
        else {
            Data.SetValue("OrderDate__", Helpers.Date.InDocumentTimezone(new Date()));
            Data.SetValue("OrderDateTime__", new Date());
            if (Lib.P2P.Inventory.IsInternalOrder()) {
                Log.Info("Do not create order in ERP for internal order");
                AllocatePONumber(false, poData);
                return true;
            }
            Log.Info("Create purchase order in ERP " + ERPName);
            let result = Lib.ERP.ExecuteERPFunc("Create", "PO");
            if (!result || result.error) {
                // Unit of measure not available in SAP
                if (ERPName === "SAP" && result.error.includes("E/ME/057")) {
                    Log.Error(result.error);
                    result.error = "_Error unit of measure unavailable";
                }
                Lib.CommonDialog.NextAlert.Define("_Purchase order creation error", result.error);
                Log.TimeEnd("CreatePOInERP");
                return false;
            }
            poData = result.ret;
            AllocatePONumber(createDocInERP, poData);
            Log.Info("Created with number " + poData.number);
        }
        Log.TimeEnd("CreatePOInERP");
        return true;
    }
    ValidationScript.CreatePOInERP = CreatePOInERP;
    function AllocatePONumber(createDocInERP, poData) {
        // allocate a number if no document created in ERP
        if (!createDocInERP || poData.number === undefined) {
            // Fetch previous PO number if it already exists (crash protection)
            poData.number = Transaction.Read("SafePAC_PONUMBER");
            if (!poData.number) {
                poData.number = Lib.P2P.NextNumber("PO", "OrderNumber__");
                Transaction.Write("SafePAC_PONUMBER", poData.number);
            }
        }
        Data.SetValue("OrderNumber__", poData.number);
    }
    async function AttachPO() {
        Log.Time("AttachPO");
        if (!await Lib.Purchasing.PO.Validation.AttachPO(Data.GetValue("OrderNumber__"))) {
            let popup = Lib.CommonDialog.NextAlert.GetNextAlert();
            if (!(popup === null || popup === void 0 ? void 0 : popup.isError)) {
                Lib.CommonDialog.NextAlert.Define("_Purchase order attaching error", "_Error attaching purchase order", { isError: true });
            }
            Log.TimeEnd("AttachPO");
            return false;
        }
        Log.TimeEnd("AttachPO");
        return true;
    }
    ValidationScript.AttachPO = AttachPO;
    async function IsOrderNumberUnique(PONumber, CompanyCode = Data.GetValue("CompanyCode__")) {
        const filter = [
            Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", PONumber),
            Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", CompanyCode)
        ];
        const queryOptions = {
            table: "CDNAME#Purchase order V2",
            filter: Sys.Helpers.LdapUtil.FilterAnd(...filter),
            attributes: ["RuidEx"],
            additionalOptions: {
                asAdmin: true,
                queryOptions: "FastSearch=-1"
            },
            maxRecords: 2
        };
        const res = await Sys.GenericAPI.PromisedQuery(queryOptions);
        return !res.length || (res.length === 1 && res[0].RuidEx === Data.GetValue("RuidEx"));
    }
    ValidationScript.IsOrderNumberUnique = IsOrderNumberUnique;
    async function HandleNumberUnicity(poNumber) {
        const isNumberUnique = await ValidationScript.IsOrderNumberUnique(poNumber);
        if (isNumberUnique) {
            Data.SetValue("OrderNumber__", poNumber);
            Lib.CommonDialog.NextAlert.Reset();
        }
        else {
            Lib.CommonDialog.NextAlert.Define(Lib.Purchasing.PODuplicateNumberTitle, "_An order already exist with this number", null, poNumber);
            Data.SetValue("OrderNumber__", "");
        }
        return isNumberUnique;
    }
    ValidationScript.HandleNumberUnicity = HandleNumberUnicity;
    function CheckErrorPO() {
        if (Lib.P2P.Inventory.IsInternalOrder()) {
            Log.Info("Do not check error in ERP for internal order");
            return false;
        }
        return Lib.ERP.ExecuteERPFunc("CheckError", "PO").ret;
    }
    function RetryPO(continueMode) {
        return Lib.ERP.ExecuteERPFunc("Retry", "PO", continueMode).ret;
    }
    function CreateNewVendor() {
        // Build variables for AP Clerk notif
        if (Variable.GetValueAsString("NewVendor__") == "true") {
            Log.Info("New vendor detected: " + Data.GetValue("VendorName__"));
            Variable.SetValueAsString("NewVendorName__", Data.GetValue("VendorName__"));
            Variable.SetValueAsString("NewVendorAddress__", Data.GetValue("VendorAddress__"));
            Variable.SetValueAsString("NewVendorEmail__", Data.GetValue("VendorEmail__"));
            Lib.Purchasing.SetRightForAPClerk();
        }
    }
    function OrderOnPunchout() {
        let vendorID = Data.GetTable("LineItems__").GetItem(0).GetValue("RequestedVendor__");
        let ret = Lib.Purchasing.Punchout.Order(vendorID);
        // If an error occured
        if (!ret.ret) {
            let errorMessage;
            if (ret.status == "401") {
                errorMessage = "_OpenPunchout wrong credentials";
            }
            else if (typeof ret.status == "string" && ret.status.startsWith("5")) {
                errorMessage = "_OpenPunchout error 5xx message";
            }
            else if (typeof ret.status == "string" && ret.status.startsWith("4")) {
                errorMessage = "_OpenPunchout error 4xx message";
            }
            else {
                errorMessage = "_OpenPunchout wrong network configuration";
            }
            Log.Error(Language.Translate(errorMessage));
            Variable.SetValueAsString("ErrorTransmitPunchoutOrderToVendor", "true");
            Lib.CommonDialog.NextAlert.Define("_Purchase order creation error", "_OpenPunchout error sending order", { isError: true }, ret.punchoutSiteConfigNameUsed);
        }
        return ret.ret;
    }
    ValidationScript.OrderOnPunchout = OrderOnPunchout;
    async function GetCustomerCompany() {
        let companyName = "";
        // If doesn't, query the company code info
        const companyCode = Data.GetValue("CompanyCode__");
        const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(companyCode);
        if (Object.keys(CCValues).length > 0) {
            companyName = CCValues.CompanyName__;
        }
        // Last fallback, returns the ShipToCompany...
        if (!companyName) {
            Log.Warn("GetCustomerCompany: no CompanyName__ in CompanyCode table. Returns ShipToCompany field.");
            companyName = Data.GetValue("ShipToCompany__");
        }
        Log.Info("GetCustomerCompany for Company code '" + companyCode + "' returns '" + companyName + "'.");
        return companyName;
    }
    function AddContractInfo(externalVars) {
        let contractNumber = "";
        let contractReference = "";
        const table = Data.GetTable("LineItems__");
        const itemCount = table ? table.GetItemCount() : 0;
        for (let i = 0; i < itemCount; ++i) {
            let line = table.GetItem(i);
            if (!Sys.Helpers.IsEmpty(line.GetValue("ContractNumber__"))) {
                contractNumber = line.GetValue("ContractNumber__");
                contractReference = line.GetValue("ContractReferenceNumber__");
                break;
            }
        }
        if (Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableContractGlobalSetting", false) && contractNumber !== "") {
            externalVars.AddValue_String("ContractNumber", contractNumber, true);
            externalVars.AddValue_String("ContractReference", contractReference, true);
        }
    }
    async function CreateCO(vendor) {
        let childCD = Process.CreateProcessInstance("Customer Order", false, false, false);
        if (childCD) {
            const vendorLogin = vendor.GetValue("login");
            let vars = childCD.GetUninheritedVars();
            vars.AddValue_String("Sales_Order_Number__", Data.GetValue("OrderNumber__"), true);
            vars.AddValue_Date("Sales_Order_Date__", new Date(), true);
            vars.AddValue_Double("Total__", Data.GetValue("TotalNetAmount__"), true);
            vars.AddValue_String("CompanyCode__", Data.GetValue("CompanyCode__"), true);
            vars.AddValue_String("VendorNumber__", Data.GetValue("VendorNumber__"), true);
            vars.AddValue_String("BuyerComment__", Data.GetValue("BuyerComment__"), true);
            vars.AddValue_String("BusinessPartnerID__", vendor.GetValue("BusinessPartnerID"), true);
            let externalVars = childCD.GetExternalVars();
            externalVars.AddValue_String("VendorLogin", vendorLogin, true);
            externalVars.AddValue_String("VendorEmail", Data.GetValue("VendorEmail__"), true);
            externalVars.AddValue_String("CustomerCompany", await GetCustomerCompany(), true);
            externalVars.AddValue_String("PORUIDEX", Data.GetValue("RuidEx"), true);
            AddContractInfo(externalVars);
            // Add attachments for CO
            externalVars.AddValue_String("BuyerComment__", Data.GetValue("BuyerComment__"), true);
            externalVars.AddValue_String("BuyerName__", Data.GetValue("BuyerName__"), true);
            let currentUser = Users.GetUser(Data.GetValue("OwnerId"));
            let CcEmailAddress = currentUser.GetValue("EmailAddress");
            CcEmailAddress += "\n";
            CcEmailAddress += Data.GetValue("EmailCarbonCopy__");
            externalVars.AddValue_String("EmailCarbonCopy__", CcEmailAddress, true);
            externalVars.AddValue_String("AlwaysAttachPurchaseOrder", Sys.Parameters.GetInstance("PAC").GetParameter("AlwaysAttachPurchaseOrder"), true);
            if (Data.GetValue("EmailNotificationOptions__") === "SendToVendor") {
                externalVars.AddValue_String("SendNotification", "1", true);
            }
            vars.AddValue_String("OrderNumber__", Data.GetValue("OrderNumber__"), true);
            vars.AddValue_String("ShipToCompany__", Data.GetValue("ShipToCompany__"), true);
            vars.AddValue_String("Currency__", Data.GetValue("Currency__"), true);
            vars.AddValue_Double("TotalNetAmount__", Data.GetValue("TotalNetAmount__"), true);
            let nbAttach = Attach.GetNbAttach();
            // Loops on all attachments.
            Log.Verbose("Nb Attach: " + nbAttach);
            let sendAttachments = Sys.Parameters.GetInstance("PAC").GetParameterBool("SendPOAttachments", false);
            for (let idx = 0; idx < nbAttach; idx++) {
                let type = Attach.GetValue(idx, "Purchasing_DocumentType");
                Log.Verbose("Purchasing document type: " + type);
                if (type === "PO" || (type !== "CSV" && sendAttachments)) {
                    let attachFile = Attach.GetConvertedFile(idx) || Attach.GetInputFile(idx);
                    // eslint-disable-next-line max-depth
                    if (attachFile != null) {
                        let name = Attach.GetName(idx);
                        Log.Verbose("Attach name: " + name);
                        let newAttach = childCD.AddAttachEx(attachFile);
                        let newAttachVars = newAttach.GetVars();
                        newAttachVars.AddValue_String("AttachOutputName", name, true);
                        newAttachVars.AddValue_String("Purchasing_DocumentType", type, false);
                    }
                }
            }
            await Sys.Helpers.TryCallFunctionAsync("Lib.PO.Customization.Server.OnCreateCO", childCD);
            return childCD;
        }
        throw new Error("Could not create the next process");
    }
    /**
     * Creates the customer order on the portal
     * @param vendor vendor contact user
     * @returns RUIDEX of the customer order (empty string if the customer order could not be created)
     */
    async function PublishCustomerOrder(vendor) {
        if (vendor && Data.GetValue("EmailNotificationOptions__") !== "PunchoutMode") {
            try {
                const vendorLogin = vendor.GetValue("login");
                Log.Info(`[PublishCustomerOrder] Generating Customer order for user ${vendorLogin}`);
                const childCD = await CreateCO(vendor);
                childCD.Process();
                const vars = childCD.GetUninheritedVars();
                const customerOrderRuidEx = vars.GetValue_String("RUIDEX", 0);
                Log.Info(`[PublishCustomerOrder] Customer order created RuidEx=${customerOrderRuidEx}`);
                return customerOrderRuidEx;
            }
            catch (e) {
                Log.Error(e.toString());
                Log.Info("Customer Order does not exist");
            }
        }
        return "";
    }
    ValidationScript.PublishCustomerOrder = PublishCustomerOrder;
    function UpdateCustomerOrder(newValues) {
        try {
            const coRUIDEX = Variable.GetValueAsString("CustomerOrderNumber");
            if (!coRUIDEX) {
                Log.Warn("No customer order to update");
                return true;
            }
            const filter = Sys.Helpers.LdapUtil.FilterEqual("RUIDEX", coRUIDEX);
            let processQuery = Process.CreateQueryAsProcessAdmin();
            processQuery.SetFilter(filter.toString());
            processQuery.SetSpecificTable(coRUIDEX.split(".")[0]);
            processQuery.AddAttribute("State");
            const DBDirtyRead = 0x00020000; // also returns ownershipped records
            processQuery.SetOptions(DBDirtyRead);
            processQuery.SetOptionEx("Limit=1");
            processQuery.MoveFirst();
            let customerOrder = processQuery.MoveNext();
            if (customerOrder) {
                let vars = customerOrder.GetUninheritedVars();
                if (vars.GetValue_Long("state", 0) === 0) {
                    Log.Info("Update Customer order failed : still in state 0");
                    return false;
                }
            }
            else {
                Log.Info("Unable to find Customer order " + coRUIDEX);
            }
            customerOrder = Process.GetUpdatableTransportAsProcessAdmin(coRUIDEX);
            let vars = customerOrder.GetUninheritedVars();
            Sys.Helpers.Object.ForEach(newValues, (attributeValue, attributeName) => {
                Sys.Helpers.Database.UpdateValueInVars(vars, {
                    name: attributeName,
                    value: Sys.Helpers.IsFunction(attributeValue) ? attributeValue(vars) : attributeValue
                });
            });
            customerOrder.Process();
            if (customerOrder.GetLastError()) {
                Log.Info("Update Customer order failed : " + customerOrder.GetLastErrorMessage() + "(" + customerOrder.GetLastError() + ")");
                return false;
            }
        }
        catch (e) {
            Log.Info("Update Customer order failed : " + e);
            return false;
        }
        return true;
    }
    function CancelCustomerOrderOnPortal() {
        Log.Info("Update Customer order for cancelation");
        return UpdateCustomerOrder({
            "CanceledDatetime__": Sys.Helpers.Date.Date2DBDateTime(new Date()),
            "State": 100
        });
    }
    function ReopenCustomerOrderOnPortal() {
        Log.Info("Reopen Customer order after cancelation");
        return UpdateCustomerOrder({
            "CanceledDatetime__": "",
            "State": (vars) => vars.GetValue("ConfirmationDatetime__", 0) ? 100 : 70
        });
    }
    function ImplicitlyAcceptCustomerOrder() {
        if (Data.IsNullOrEmpty("ConfirmationDatetime__")) {
            Log.Info("Update Customer order for acceptance");
            const confirmationDateTime = Sys.Helpers.Date.Date2DBDateTime(new Date());
            Data.SetValue("ConfirmationDatetime__", confirmationDateTime);
            if (UpdateCustomerOrder({ "ConfirmationDatetime__": confirmationDateTime, "State": 100 })) {
                const msg = Language.Translate("_PurchaseOrderImplicitlyAccepted", false);
                Lib.Purchasing.VendorNotifications.AddConversationItem(msg, Lib.Purchasing.ConversationTypes.DefaultTechnical, undefined, Users.GetUser(Data.GetValue("BuyerLogin__")));
                return true;
            }
            return false;
        }
        return true;
    }
    //#region Email notifications
    function SendNotifNewVendorToAPClerk() {
        const apClerkUser = Users.GetUser(Lib.Purchasing.GetAPClerkLogin(true));
        if (apClerkUser) {
            Lib.P2P.EmailNotification.SendEmailNotificationWithUser(apClerkUser, {
                subject: "_New vendor requested",
                template: "Purchasing_Email_NotifNewVendor_APClerk.htm",
                backupUserAsCC: false,
                sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
                fromName: "",
                customTags: {
                    "Last_comments__": Variable.GetValueAsString("Last_comments__"),
                    "APClerkName": apClerkUser.GetValue("DisplayName")
                }
            });
        }
    }
    function SendNotifWaitingForDownPaymentToTreasurer() {
        const treasurerUser = Users.GetUser(treasurerLogin);
        const buyerComment = ValidationScript.wkfController.GetContributorAt(0).comment;
        if (treasurerUser) {
            Lib.P2P.EmailNotification.SendEmailNotificationWithUser(treasurerUser, {
                subject: "_Purchase order waiting for payment",
                template: "Purchasing_Email_NotifWaitingForDownPayment.htm",
                backupUserAsCC: false,
                sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
                fromName: "",
                customTags: {
                    OrderNumber__: Data.GetValue("OrderNumber__"),
                    BuyerName__: Data.GetValue("BuyerName__"),
                    VendorName__: Data.GetValue("VendorName__"),
                    Currency__: Data.GetValue("Currency__"),
                    PaymentAmount__: Data.GetValue("PaymentAmount__"),
                    Last_comments__: buyerComment,
                    TreasureName: treasurerUser.GetValue("DisplayName")
                }
            });
        }
    }
    function SendNotifDownPaymentDoneToBuyer() {
        Lib.P2P.EmailNotification.SendEmailNotificationWithUser(Users.GetUser(Data.GetValue("BuyerLogin__")), {
            subject: "_Purchase order payment done",
            template: "Purchasing_Email_NotifDownPaymentDone.htm",
            backupUserAsCC: true,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
            fromName: "",
            customTags: {
                "DestinationFullName": Data.GetValue("BuyerName__"),
                "Last_comments__": Variable.GetValueAsString("Last_comments__"),
                "TreasureName": Users.GetUser(treasurerLogin).GetValue("DisplayName"),
                "OrderNumber__": Data.GetValue("OrderNumber__"),
                "VendorName__": Data.GetValue("VendorName__"),
                "Currency__": Data.GetValue("Currency__"),
                "PaymentAmount__": Data.GetValue("PaymentAmount__"),
                "PaymentType__": Data.GetValue("PaymentType__")
            }
        });
        let nval = Lib.Purchasing.GetNumberAsString;
        let culture = Lib.P2P.GetValidatorOrOwner().GetValue("Culture");
        let decimalValue = nval(Data.GetValue("PaymentAmount__"), culture);
        let msg = Language.Translate("_Down payment done") + " - " + Data.GetValue("Currency__") + " " + decimalValue;
        Lib.Purchasing.VendorNotifications.AddConversationItem(msg, Lib.Purchasing.ConversationTypes.DefaultTechnical);
    }
    function SendEmailToRequesters() {
        let itemsIndex = [];
        let PRitems = Data.GetTable("LineItems__");
        let itemCount = PRitems.GetItemCount();
        for (let i = 0; i < itemCount; i++) {
            itemsIndex.push(i);
        }
        Lib.Purchasing.PO.Validation.SendEmailToRequesters(itemsIndex);
    }
    function SendEmailToBuyerOnERPAsyncError(action) {
        const buyerLogin = Data.GetValue("BuyerLogin__");
        Lib.P2P.EmailNotification.SendEmailNotificationWithUser(Users.GetUser(buyerLogin), {
            template: action === "Update" ? "Purchasing_Email_POEditAsyncERP_NotifError.htm" : "Purchasing_Email_POAsyncERP_NotifError.htm",
            backupUserAsCC: true,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1",
            fromName: "",
            customTags: {
                ERPError__: Data.GetValue("ERPError__")
            }
        });
    }
    //#endregion
    async function SendOrderToVendor() {
        if (Lib.P2P.Inventory.IsInternalOrder()) {
            Log.Info("Do not send order to vendor for internal order");
            return true;
        }
        Log.Time("SendOrderToVendor");
        if (Sys.Parameters.GetInstance("PAC").GetParameterNumber("DemoEnableInvoiceCreation") === 2) {
            await Lib.Purchasing.Demo.GenerateVendorInvoice(Data.GetValue("OrderNumber__"), true);
        }
        let vendor;
        let ruidex;
        try {
            vendor = Lib.Purchasing.Vendor.GetVendorContact();
            ruidex = await PublishCustomerOrder(vendor);
        }
        catch (error) {
            if (error === "Error on vendor contact creation") {
                Log.Error(error);
            }
            else {
                throw error;
            }
        }
        // Publish event
        if (ruidex) {
            Variable.SetValueAsString("CustomerOrderNumber", ruidex);
        }
        // ensure Conversation is created for current owner
        GiveRightOnConversationToUser(Data.GetValue("OwnerId"), true);
        let ok = true;
        if (Data.GetValue("EmailNotificationOptions__") === "SendToVendor") {
            const asUser = Users.GetUser(Data.GetValue("BuyerLogin__"));
            ok = Lib.Purchasing.PO.Validation.SendNotifToVendor(vendor, "Purchasing_Email_NotifSupplier.htm", false, asUser);
        }
        else if (Data.GetValue("EmailNotificationOptions__") === "DontSend") {
            Lib.Purchasing.PO.Validation.SendNotifToCurrentOwner("Purchasing_Email_NotifBuyer_PODoNotSend.htm", false);
        }
        else if (Data.GetValue("EmailNotificationOptions__") === "PunchoutMode") {
            ok = OrderOnPunchout();
        }
        else if (Data.GetValue("EmailNotificationOptions__")) {
            const transmissionMethod = Data.GetValue("EmailNotificationOptions__");
            ok = await Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.ExecuteCustomOrderTransmissionMethod", transmissionMethod) === true;
            if (!ok) {
                Log.Error("Custom order transmission method failed or is unsupported: " + transmissionMethod);
            }
        }
        // We advise APClerk for new vendor
        if (ok && Variable.GetValueAsString("NewVendor__") === "true") {
            SendNotifNewVendorToAPClerk();
        }
        Log.TimeEnd("SendOrderToVendor");
        return ok;
    }
    ValidationScript.SendOrderToVendor = SendOrderToVendor;
    function GiveRightToConversationForVendor(vendorUser, ruidex) {
        const conversationID = Variable.GetValueAsString("ConversationID");
        const conversationInfo = Lib.P2P.Conversation.InitConversationInfo(Lib.P2P.Conversation.Options.GetPurchaseOrder({
            OrderNumber__: Data.GetValue("OrderNumber__")
        }), ruidex, conversationID);
        const vendorUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
        const extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
            BusinessId: vendorUserInfo.BusinessId,
            BusinessIdFieldName: vendorUserInfo.BusinessIdFieldName,
            OwnerID: vendorUserInfo.OwnerID,
            OwnerPB: vendorUserInfo.OwnerPB,
            RecipientCompany: Users.GetUser(Data.GetValue("OwnerId")).GetValue("Company")
        });
        const newConversationID = Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
        if (newConversationID && !conversationID) {
            Variable.SetValueAsString("ConversationID", newConversationID);
        }
    }
    function GetReceivers() {
        let allRecipientLogins = [];
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            allRecipientLogins.push(line.GetValue("RecipientDN__"));
        });
        return Sys.Helpers.Array.GetDistinctArray(allRecipientLogins);
    }
    function CreateGRForAutoReception() {
        Log.Info("Generating one GR for auto reception");
        const allRecipientLoginsDistinct = GetReceivers();
        let grInstance;
        if (allRecipientLoginsDistinct.length === 1 && Users.GetUser(allRecipientLoginsDistinct[0]).GetValue("IsGroup") !== "1") {
            let recipient = allRecipientLoginsDistinct[0];
            Log.Info(`Only one recipient which is not a group => generating GR for ${recipient}`);
            grInstance = Process.CreateProcessInstanceForUser(Lib.P2P.GetGRProcessName(), recipient, 2 /* ChildProcessType.Notification */, true);
        }
        else { // We explicitely create the GR as the buyer to avoid creating it with the user or group who did the downpayment
            const buyer = Data.GetValue("BuyerLogin__");
            Log.Info(`Multiple recipients or recipient is a group => generating GR for buyer ${buyer}`);
            grInstance = Process.CreateProcessInstanceForUser(Lib.P2P.GetGRProcessName(), buyer, 2 /* ChildProcessType.Notification */, true);
        }
        let extGRVars = grInstance.GetExternalVars();
        extGRVars.AddValue_String("OrderNumber__", Data.GetValue("OrderNumber__"), true);
        extGRVars.AddValue_String("CompanyCode__", Data.GetValue("CompanyCode__"), true);
        // Serialize "AutoReceiveOrderData" in GR & PO because it's needed in both side
        const jsonData = JSON.stringify(Lib.Purchasing.GetAutoReceiveOrderData());
        extGRVars.AddValue_String("AutoReceiveOrderData", jsonData, true);
        Variable.SetValueAsString("AutoReceiveOrderData", jsonData);
        grInstance.Process();
    }
    /**
     * Calculate Undelivered_amount__ and OpenOrderLocalCurrency__ (aka Undelivered_amount__ in local currency)
     */
    async function WaitForDelivery() {
        const allRecipientLoginsDistinct = GetReceivers();
        // Give read right on PO to all recipients
        const ownerLogin = Lib.P2P.GetOwner().GetValue("login");
        for (let recipientLogin of allRecipientLoginsDistinct) {
            // Give right to recipient if different from buyer/treasurer
            if (ownerLogin !== recipientLogin) {
                Log.Info("Grant all right on purchase order to recipient: " + recipientLogin);
                // we need the "all" right in order to be able to resubmit PO if recipient cancels a GR and reopens PO
                Process.SetRight(recipientLogin, "all");
                // add user to conversation
                GiveRightOnConversationToUser(recipientLogin, false);
            }
        }
        const customerOrderNumber = Variable.GetValueAsString("CustomerOrderNumber");
        const vendor = Lib.Purchasing.Vendor.GetVendorContact();
        if (customerOrderNumber && vendor) {
            GiveRightToConversationForVendor(vendor, customerOrderNumber);
        }
        if (Lib.Purchasing.IsAutoReceiveOrderEnabled()) {
            CreateGRForAutoReception();
        }
        else {
            // Check NoGR items with a delivery date in the past to sync items
            if (Lib.Purchasing.POItems.HasNoGRItemWithClosedReception()) {
                Log.Info("There is a NoGR item that should be considered received due to the requested delivery date in the past");
                await Lib.Purchasing.PO.Validation.SynchronizeItemsFromAction();
            }
            Log.Info("Purchase order ready to be delivered");
        }
        // Add an expiration timeout
        let validityDate = new Date();
        validityDate.setFullYear(validityDate.getFullYear() + 10);
        Data.SetValue("ValidityDateTime", Sys.Helpers.Date.Date2DBDateTime(validityDate));
    }
    function GiveRightOnConversationToUser(userLogin, doSendNotif) {
        if (Lib.P2P.Inventory.IsInternalOrder()) {
            return;
        }
        const conversationID = Variable.GetValueAsString("ConversationID");
        const conversationInfo = Lib.P2P.Conversation.InitConversationInfo(Lib.P2P.Conversation.Options.GetCustomerOrder({
            OrderNumber__: Data.GetValue("OrderNumber__")
        }, doSendNotif), Data.GetValue("RuidEx"), conversationID);
        const internalUser = Users.GetUserAsProcessAdmin(userLogin);
        if (internalUser) {
            const internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
            const extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
                BusinessId: internalUserInfo.BusinessId,
                BusinessIdFieldName: internalUserInfo.BusinessIdFieldName,
                OwnerID: internalUserInfo.OwnerID,
                OwnerPB: internalUserInfo.OwnerPB,
                RecipientCompany: Data.GetValue("VendorName__")
            });
            const newConversationID = Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo);
            if (newConversationID && !conversationID) {
                Variable.SetValueAsString("ConversationID", newConversationID);
            }
        }
        else {
            Log.Error(`User ${userLogin} not found - not added to the conversation`);
        }
    }
    async function SynchronizeItems(justUpdateItemsParam, futureOrderStatus, resumeDocumentAction) {
        // Items synchronization
        Log.Time("SynchronizeItems");
        let justUpdateItems = justUpdateItemsParam || false;
        let bok = await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
            let orderStatus;
            if (futureOrderStatus) {
                orderStatus = futureOrderStatus;
            }
            else if (Lib.Purchasing.PO.DownPayment.IsAsked()) {
                orderStatus = POStatus.toPay;
            }
            else if (Lib.Purchasing.IsAutoReceiveOrderEnabled()) {
                orderStatus = POStatus.awaitingAutoGRProcessing;
            }
            else {
                orderStatus = POStatus.toReceive;
            }
            let options = {
                futureOrderStatus: orderStatus,
                justUpdateItems: null,
                allPRItems: null,
                resumeDocumentAction: resumeDocumentAction
            };
            if (justUpdateItems) {
                options.justUpdateItems = true;
            }
            else {
                let allPRItems = Lib.Purchasing.POItems.GetPRItemsInForm();
                options.allPRItems = allPRItems;
            }
            return await Lib.Purchasing.PO.Validation.SynchronizeItems(options) || rollbackFn();
        });
        Log.TimeEnd("SynchronizeItems");
        return bok;
    }
    async function LockItemsToOrder() {
        const allPRItems = Lib.Purchasing.POItems.GetPRItemsInForm();
        const lockByPRNames = Object.keys(allPRItems);
        let bok = true;
        const concurrentAccessTimeout = 300;
        try {
            await Process.PreventConcurrentAccessAsync(lockByPRNames, async function () {
                if (Data.GetValue("AutomaticOrder__") && !Lib.Purchasing.PO.Workflow.IsEnabled()) {
                    Log.Info("AUTO doOrder");
                    Data.SetValue("Comments__", Language.Translate("_Auto Send PO Message"));
                }
                if (Lib.Purchasing.IsMultiShipTo() && Data.GetValue("EmailNotificationOptions__") !== "PunchoutMode") {
                    Data.SetValue("ShipToCompany__", await GetCustomerCompany());
                }
                try {
                    bok = await Lib.Purchasing.PO.Validation.CheckOrderableOrOverOrderedItems();
                }
                catch (e) {
                    Lib.Purchasing.OnUnexpectedError(e.toString());
                    bok = false;
                }
                bok = bok && await SynchronizeItems(true);
            }, concurrentAccessTimeout);
        }
        catch (e) {
            Log.Error(e.toString());
            bok = false;
            Lib.CommonDialog.NextAlert.Define("_Purchase order creation error", "_PreventConcurrentAccess on items error message");
        }
        return bok;
    }
    function GetCreationMessage() {
        const ERPName = Lib.ERP.GetERPName();
        const createDocInERP = Sys.Parameters.GetInstance("P2P_" + ERPName).GetParameter("CreateDocInERP");
        let msg = "_Advise buyer on PO creation";
        msg += createDocInERP ? " with number " + ERPName : " with number";
        return msg;
    }
    function SetNextAlertOrderCreatedInERP() {
        const number = Data.GetValue("OrderNumber__");
        if (number) {
            // Set next alert with order number
            const msg = GetCreationMessage();
            Lib.CommonDialog.NextAlert.Define("_PO creation popup", msg, {
                isError: false,
                behaviorName: "POCreationInfo"
            }, number);
        }
        else {
            Lib.CommonDialog.NextAlert.Define("_PO creation popup", "_PO is being created in ERP", {
                isError: false,
                behaviorName: "POCreationInfo"
            });
        }
    }
    async function UpdateAsWaitingForERPAck() {
        const orderNumber = Data.GetValue("OrderNumber__") || Lib.Purchasing.PR.ExternalFile.Server.GetAutoSendOrderParam().PONumber;
        const isNumberUnique = Sys.Helpers.IsEmpty(orderNumber) || await ValidationScript.HandleNumberUnicity(orderNumber);
        if (!isNumberUnique) {
            return false;
        }
        Data.SetValue("ERPError__", "");
        if (!await LockItemsToOrder()) {
            Log.Error("LockItemsToOrder Failed");
            return false;
        }
        const spendingErrors = poSpendingDispatcher.AsOrdered();
        if (spendingErrors.length) {
            return false;
        }
        if (!CreatePOInERP()) {
            Log.Error("Error creating PO in ERP");
            return false;
        }
        return true;
    }
    function HasItemsNeedingBudgetFix(previousItems, updatedItems) {
        const itemsNeedingBudgetFix = previousItems
            .filter((previousItem, index) => previousItem.BudgetID__ !== updatedItems[index].BudgetID__)
            .map((item) => item.LineItemNumber__ + "");
        return itemsNeedingBudgetFix.length > 0;
    }
    ValidationScript.HasItemsNeedingBudgetFix = HasItemsNeedingBudgetFix;
    ValidationScript.serverParameters = {
        actions: {
            submission: {
                OnDone: async function (sequenceStep) {
                    Log.Info("PO Validation -- Action: submission -- SequenceStep: " + sequenceStep);
                    if (Data.GetValue("AutomaticOrder__")) {
                        Log.Info("AUTO submission");
                        Variable.SetValueAsString("Last_comments__", "");
                        Data.SetValue("Comments__", Language.Translate("_Auto Create PO Message"));
                    }
                    let bok = await Lib.Purchasing.PO.Workflow.SubmitImpl({
                        sequenceStep: sequenceStep,
                        actionName: this.actions.submitted.GetName(),
                    });
                    return bok;
                }
            },
            submitted: {},
            doReceipt: {
                OnDone: async function (sequenceStep) {
                    Log.Info("PO Validation -- Action: doReceipt -- SequenceStep: " + sequenceStep);
                    let data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
                    if (data.actualRecipientDN) {
                        Lib.Purchasing.PO.Validation.GiveReadRightToActualRecipientIfNeeded(data.actualRecipientDN);
                    }
                    let bok = await Lib.Purchasing.PO.Validation.SynchronizeItems({ fromAction: false });
                    bok = bok && await Lib.P2P.Inventory.CreateOrUpdateInventoryMovementFromPOItems(Data.GetValue("RuidEx"), Data.GetValue("OrderStatus__"), Data.GetValue("CompanyCode__"), Data.GetValue("OrderNumber__"));
                    const previousItems = Sys.Helpers.Data.GetTableAsObjectArray(Data.GetTable("LineItems__"), ["BudgetID__", "LineItemNumber__"]);
                    bok = bok && !poSpendingDispatcher.AsOrdered().length;
                    const updatedItems = Sys.Helpers.Data.GetTableAsObjectArray(Data.GetTable("LineItems__"), ["BudgetID__"]);
                    if (ValidationScript.HasItemsNeedingBudgetFix(previousItems, updatedItems)) {
                        Lib.Purchasing.POBudget.UpdateBudgetIDInPOItems();
                        Lib.Purchasing.POBudget.UpdateBudgetIDInAPPOItems();
                        Lib.Purchasing.Receiving.RecoverGRBudget();
                    }
                    if (bok) {
                        ImplicitlyAcceptCustomerOrder();
                        if (Data.GetValue("OrderStatus__") === POStatus.received) {
                            if (Lib.Purchasing.IsAutoReceiveOrderEnabled()) {
                                Log.Info("AUTO doReceipt");
                                Data.SetValue("Comments__", Language.Translate("_Auto PO Reception Message"));
                            }
                            else {
                                Log.Info("doReceipt");
                            }
                            // Once delivered, forward to buyer if not already owner
                            const ownerLogin = Lib.P2P.GetOwner().GetValue("login");
                            const buyerLogin = Data.GetValue("BuyerLogin__");
                            if (buyerLogin && ownerLogin !== buyerLogin) {
                                Log.Info("ChangeOwner to buyer: " + buyerLogin);
                                Process.ChangeOwner(buyerLogin);
                                Conversation.UpdateParties(Lib.P2P.Conversation.TableName, { OwnerLogin: ownerLogin }, {
                                    Options: Lib.P2P.Conversation.Options.GetCustomerOrder({
                                        OrderNumber__: Data.GetValue("OrderNumber__")
                                    }, false)
                                });
                                GiveRightOnConversationToUser(buyerLogin, true);
                                Process.LeaveForm();
                            }
                            if (Lib.Purchasing.POItems.HasDeliveredItems()) {
                                Lib.Purchasing.VendorNotifications.AddConversationItem(Language.Translate("_Item received"), Lib.Purchasing.ConversationTypes.ItemReception, undefined, Users.GetUser(buyerLogin));
                            }
                        }
                        else {
                            Process.WaitForUpdate();
                            Process.LeaveForm();
                        }
                    }
                    else {
                        Process.PreventApproval();
                    }
                }
            },
            doDownPayment: {
                OnDone: async function (sequenceStep) {
                    let bok = await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
                        Lib.Purchasing.PO.Validation.SetAsToReceive();
                        return await Lib.Purchasing.PO.Validation.SynchronizeItems() || rollbackFn();
                    });
                    if (bok) {
                        let contributionData = Lib.Purchasing.PO.Workflow.GetContributionData(sequenceStep, this.actions.downPaymentDone.GetName(), g_newComment, { onBehalfOf: true });
                        ValidationScript.wkfController.EndWorkflow(contributionData);
                        Log.Info("Down payment done");
                        Variable.SetValueAsString("DownPaymentDone__", "true");
                        SendNotifDownPaymentDoneToBuyer();
                        await WaitForDelivery(); // forward to recipient
                        Process.WaitForUpdate();
                        Process.LeaveForm();
                    }
                    else {
                        Process.PreventApproval();
                    }
                }
            },
            doOrder: {
                OnDone: async function (sequenceStep) {
                    Log.Info("PO Validation -- Action: doOrder -- SequenceStep: " + sequenceStep);
                    try {
                        CreateNewVendor();
                        if (await UpdateAsWaitingForERPAck()) {
                            const number = Data.GetValue("OrderNumber__");
                            if (Lib.Purchasing.ContributorIsCurrentUser(ValidationScript.wkfController.GetContributorAt(0), Lib.P2P.GetValidatorOrOwner())) {
                                SetNextAlertOrderCreatedInERP();
                            }
                            else {
                                Lib.Purchasing.PO.Workflow.SendEmailToBuyerAfterApproval(number);
                            }
                            Data.SetValue("OrderSubStatus__", "ERPAckCreate" /* Lib.Purchasing.PO.ERP.SubStatus.Create */);
                            if (number) {
                                Data.SetValue("KeepOpenAfterApproval", "WaitForAsyncRecall");
                                Variable.SetValueAsString("ERPACK_TransactionID__", Data.GetValue("ERPNextTransactionID__"));
                                const action = Lib.Purchasing.PO.ERP.ComputeBypassAction();
                                Process.RecallScript(action, true);
                            }
                            else {
                                Lib.Purchasing.PO.ERP.SetAsWaitingForERPAck();
                                await SynchronizeItems(); //Tell PR items have been ordred
                                Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
                                Process.WaitForUpdate();
                            }
                        }
                        else {
                            Process.PreventApproval();
                        }
                    }
                    catch (e) {
                        Log.Error(e.toString());
                        Lib.CommonDialog.NextAlert.Define("_Purchase order creation error", "_PO unhandled exception error message");
                        Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
                        Process.PreventApproval();
                    }
                }
            },
            received: {},
            downPaymentDone: {},
            ordered: {},
            canceled: {
                OnDone: async function (sequenceStep) {
                    Log.Info("PO Validation -- Action: canceled -- SequenceStep: " + sequenceStep);
                    let bok = true;
                    const currentContributor = ValidationScript.wkfController.GetContributorAt(sequenceStep);
                    let comment = g_newComment;
                    const POPendingCommitment = currentContributor.role === Lib.Purchasing.roleApprover ||
                        currentContributor.role === Lib.Purchasing.roleTreasurer;
                    if (POPendingCommitment) {
                        comment = Language.Translate("_PO waiting for approval by {0} canceled by buyer", false, currentContributor.name) + "\n" + comment;
                    }
                    const poStatus = Data.GetValue("OrderStatus__");
                    const contributionData = Lib.Purchasing.PO.Workflow.GetContributionData(0, this.actions.canceled.GetName(), comment, { onBehalfOf: true });
                    Lib.CommonDialog.NextAlert.Reset();
                    if (poStatus !== POStatus.toOrder) {
                        bok = bok && !poSpendingDispatcher.AsCanceled().length;
                        bok = bok && await SynchronizeItems(false, POStatus.canceled, "Cancel_PO");
                        bok = bok && await Lib.P2P.Inventory.CancelAllStockMovements(Data.GetValue("RuidEx"));
                        bok = bok && CancelCustomerOrderOnPortal();
                    }
                    else {
                        poSpendingDispatcher.AsCanceled();
                        await SynchronizeItems(false, POStatus.canceled, "Cancel_PO");
                        await Lib.P2P.Inventory.CancelAllStockMovements(Data.GetValue("RuidEx"));
                        CancelCustomerOrderOnPortal();
                    }
                    if (bok) {
                        Data.SetValue("OrderStatus__", POStatus.canceled);
                        ValidationScript.wkfController.EndWorkflow(contributionData);
                        if (POPendingCommitment) {
                            Lib.Purchasing.PO.Workflow.SendEmailOrderCanceled(currentContributor, g_newComment);
                        }
                        Log.Info("Notify cancellation via the conversation");
                        const msg = Language.Translate("_PurchaseOrderCanceled", false);
                        Lib.Purchasing.VendorNotifications.AddConversationItem(msg, Lib.Purchasing.ConversationTypes.ItemReception, undefined, Users.GetUser(Data.GetValue("BuyerLogin__")));
                        Process.Cancel();
                        Process.LeaveForm();
                    }
                    else {
                        Lib.CommonDialog.NextAlert.Define("_PO cancel error", "_PO cancel error message", {
                            isError: true,
                            behaviorName: "POCancelError"
                        });
                        Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            rejected: {
                OnDone: async function (sequenceStep) {
                    Log.Info("PO Validation -- Action: rejected -- SequenceStep: " + sequenceStep);
                    let bok = true;
                    let contributionData = Lib.Purchasing.PO.Workflow.GetContributionData(sequenceStep, this.actions.rejected.GetName());
                    bok = bok && !poSpendingDispatcher.AsCanceled().length;
                    bok = bok && await SynchronizeItems(false, POStatus.rejected, "Cancel_PO");
                    if (bok) {
                        Data.SetValue("RejectionDatetime__", contributionData.date);
                        Data.SetValue("OrderStatus__", POStatus.rejected);
                        ValidationScript.wkfController.EndWorkflow(contributionData);
                        // Reject message
                        Data.SetValue("State", 400);
                        Process.LeaveForm();
                    }
                    else {
                        Lib.CommonDialog.NextAlert.Define("_PO reject error", "_PO reject error message", {
                            isError: true,
                            behaviorName: "POrejectError"
                        });
                        Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            approval: {
                OnDone: async function (sequenceStep) {
                    Log.Info("PO Validation -- Action: approval -- SequenceStep: " + sequenceStep);
                    let bok = await Lib.Purchasing.PO.Workflow.SubmitImpl({
                        sequenceStep: sequenceStep,
                        actionName: this.actions.approved.GetName(),
                    });
                    return bok;
                }
            },
            approved: {},
            sentBack: {
                OnDone: async function (sequenceStep) {
                    Log.Info("PO Validation -- Action: sentBack -- SequenceStep: " + sequenceStep);
                    let bok = true;
                    const approverContributor = ValidationScript.wkfController.GetContributorAt(sequenceStep);
                    Data.SetValue("OrderStatus__", POStatus.toOrder);
                    await Lib.Purchasing.PO.Validation.DeleteItems();
                    if (bok) {
                        const contributionData = Lib.Purchasing.PO.Workflow.GetContributionData(sequenceStep, this.actions.sentBack.GetName());
                        ValidationScript.wkfController.Restart(contributionData);
                        const nextContributor = ValidationScript.wkfController.GetContributorAt(0);
                        Lib.Purchasing.PO.Validation.SendEmailAfterBackToBuyer(approverContributor);
                        Process.Forward(nextContributor.login);
                        Process.LeaveForm();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            }
        }
    };
    async function Start() {
        // Initialize workflow and technical fields
        await InitializeWorkflow();
        const { currentName, currentAction } = GetCurrentAction();
        Log.Info(`-- PO Validation Script -- Name: '${currentName || "<empty>"}', Action: '${currentAction || "<empty>"}'`);
        await Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnValidationScriptBegin", currentName, currentAction);
        Lib.Purchasing.PO.Validation.SetupDataConfigurations();
        // Handle specific actions
        let actionHandled = await ProcessActionWithoutDataValidation(currentName);
        if (!actionHandled) {
            if (await ShouldPreventApproval(currentName, currentAction)) {
                Process.PreventApproval();
                actionHandled = true;
            }
            else {
                // Process standard actions
                actionHandled = await ProcessActions(currentName, currentAction);
            }
        }
        if (!actionHandled && !IsFirstValidation(currentName, currentAction)) {
            Lib.Purchasing.PO.Validation.OnUnknownAction(currentAction, currentName);
        }
        // Call customization hook
        const isRecallScriptScheduled = Process.IsRecallScriptScheduled();
        await Sys.Helpers.TryCallFunction("Lib.PO.Customization.Server.OnValidationScriptEnd", currentAction, currentName, isRecallScriptScheduled);
    }
    async function InitializeWorkflow() {
        Sys.Helpers.Extend(true, parameters, ValidationScript.serverParameters);
        ValidationScript.wkfController.AllowRebuild(false);
        ValidationScript.wkfController.Define(parameters);
        Lib.Purchasing.InitTechnicalFields();
    }
    ValidationScript.InitializeWorkflow = InitializeWorkflow;
    function GetCurrentAction() {
        return {
            currentName: Data.GetActionName(),
            currentAction: Data.GetActionType()
        };
    }
    async function ProcessActionWithoutDataValidation(currentName) {
        let handled = true;
        switch (currentName) {
            case "PostValidation_DoReceipt":
                await parameters.actions.doReceipt.OnDone();
                break;
            case "OnERPAckReceived":
            case "OnERPAckReceived-Update":
            case "OnERPAckReceived-CancelItems":
            case "OnERPAckReceived-ReOpenItems":
            case "OnERPAckReceived-Cancel":
            case "OnERPAckError":
            case "OnERPAckError-Update":
            case "OnERPAckError-CancelItems":
            case "OnERPAckError-ReOpenItems":
            case "OnERPAckError-Cancel":
                {
                    const [action, ERPAction] = currentName.split("-");
                    await ValidationScript.ERPHandler.ProcessAck(action, ERPAction || "Create");
                    break;
                }
            case "OnInvoicePost":
                Lib.Purchasing.PO.Validation.OnInvoicePost();
                break;
            case "SaveBeforeVendorRegistration":
                Log.Info("Prevent approval before vendor registration");
                Process.PreventApproval();
                break;
            case "Cancel_purchase_order":
                await CancelPurchaseOrder();
                break;
            case "Cancel_unreceived_items":
                await CancelUnreceivedItems();
                break;
            case "Reopen_unreceived_items":
                await ReopenUnreceivedItems();
                break;
            case "Reject":
            case "RejectFromOC":
                await Rejection(currentName);
                break;
            case "BackToBuyer":
                await BackToBuyer();
                break;
            case "Rollback_cancellation":
                await RollbackCancellation();
                break;
            default:
                handled = false;
                break;
        }
        return handled;
    }
    async function RollbackCancellation() {
        Data.SetValue("OrderStatus__", POStatus.toReceive);
        Lib.Purchasing.PO.ERP.ResetAck();
        ValidationScript.ERPHandler.ClearAckError();
        Process.WaitForUpdate();
    }
    async function CancelPurchaseOrder() {
        const isOrderNumberEmpty = !Data.GetValue("OrderNumber__");
        const allGRItemsCanceled = AreAllGRItemsCanceled();
        const universalCancelEnabled = Lib.Purchasing.PO.ERP.IsUniversalCancelEnabled();
        let isInternalOrderOrCanceledInERP = false;
        let asyncERPChange = false;
        Data.SetValue("OrderSubStatus__", "ERPAckCancel" /* Lib.Purchasing.PO.ERP.SubStatus.Cancel */);
        if (!isOrderNumberEmpty && allGRItemsCanceled) {
            const result = CancelInERP();
            isInternalOrderOrCanceledInERP = result.success;
            asyncERPChange = result.isAsynchronous;
        }
        Log.Info(`isInternalOrderOrCanceledInERP: ${isInternalOrderOrCanceledInERP}, isAsynchronous: ${asyncERPChange}`);
        if (isInternalOrderOrCanceledInERP && universalCancelEnabled && asyncERPChange) {
            Data.SetValue("OrderStatus__", POStatus.waitingForERPAck);
            Process.WaitForUpdate();
        }
        else if (isOrderNumberEmpty || isInternalOrderOrCanceledInERP) {
            Variable.SetValueAsString("ERPACK_TransactionID__", Data.GetValue("ERPNextTransactionID__"));
            const action = Lib.Purchasing.PO.ERP.ComputeBypassAction();
            Process.RecallScript(action);
        }
        else {
            Log.Warn(`PO cancel ignored : OrderNumber__ should be empty: (${isOrderNumberEmpty}) or all GR items should be canceled (${allGRItemsCanceled}) and PO should be an internal order or canceled in ERP (${isInternalOrderOrCanceledInERP})`);
            Process.WaitForUpdate();
        }
    }
    async function CancelUnreceivedItems() {
        try {
            const hasReception = Lib.Purchasing.POItems.HasReception();
            Variable.SetValueAsString("HasReception", hasReception ? "true" : "false");
            await Lib.Purchasing.PO.Edition.Manager.CancelUnreceivedItems();
        }
        catch (error) {
            Log.Error("CancelUnreceivedItems on error: " + error);
            Process.PreventApproval();
        }
    }
    async function ReopenUnreceivedItems() {
        try {
            await Lib.Purchasing.PO.Edition.Manager.ReOpenUnreceivedItems();
            Process.WaitForUpdate();
        }
        catch (error) {
            Log.Error("ReopenUnreceivedItems on error: " + error);
            Process.PreventApproval();
        }
    }
    async function Rejection(currentName) {
        let ok = false;
        if (AreAllGRItemsCanceled()) {
            const result = CancelInERP();
            const isInternalOrderOrCanceledInERP = result.success;
            const asyncERPCancel = result.isAsynchronous;
            const universalCancelEnabled = Lib.Purchasing.PO.ERP.IsUniversalCancelEnabled();
            if (isInternalOrderOrCanceledInERP) {
                ok = true;
                Data.SetValue("OrderSubStatus__", "ERPAckCancel" /* Lib.Purchasing.PO.ERP.SubStatus.Cancel */);
                Variable.SetValueAsString("RejectionAction__", currentName);
                if (universalCancelEnabled && asyncERPCancel) {
                    Data.SetValue("OrderStatus__", POStatus.waitingForERPAck);
                    Process.WaitForUpdate();
                }
                else {
                    Variable.SetValueAsString("ERPACK_TransactionID__", Data.GetValue("ERPNextTransactionID__"));
                    const action = Lib.Purchasing.PO.ERP.ComputeBypassAction();
                    Process.RecallScript(action);
                }
            }
        }
        if (currentName === "RejectFromOC" && !ok) {
            const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
            Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("S2P - Order Confirmation", data.sourceRUIDEX, "EditPOError");
        }
    }
    function CreateRejectionContributor(currentName, data) {
        const actionName = parameters.actions.rejected.GetName();
        let contributor = ValidationScript.wkfController.GetCurrentContributor();
        if (currentName === "Reject") {
            if ((contributor === null || contributor === void 0 ? void 0 : contributor.role) !== Lib.Purchasing.roleApprover) {
                const vendor = Lib.Purchasing.Vendor.GetVendorContact();
                contributor = {
                    contributorId: ValidationScript.wkfController.CreateUniqueContributorId("Vendor") + Lib.Purchasing.roleVendor,
                    role: Lib.Purchasing.roleVendor,
                    name: vendor.GetValue("displayName"),
                    login: vendor.GetValue("login"),
                    email: vendor.GetValue("emailAddress")
                };
            }
        }
        else {
            contributor = ValidationScript.wkfController.GetContributorAt(0);
        }
        contributor.action = actionName;
        contributor.date = data.RejectionDatetime__;
        contributor.comment = data.RejectionReason__;
        return contributor;
    }
    async function BackToBuyer() {
        if (Data.GetActionType() !== "ResumeWithAction") {
            Log.Info("comment : ", Data.GetValue("Comments__"));
            const actionName = parameters.actions.sentBack.GetName();
            await ValidationScript.wkfController.DoAction(actionName);
        }
        if (Data.GetValue("State") == 90) {
            Process.WaitForUpdate();
        }
    }
    async function ShouldPreventApproval(currentName, currentAction) {
        let shouldPrevent = false;
        if (currentName !== "Retry_" && currentName !== "Continue_") {
            const hasError = CheckErrorPO();
            const hasDataIncoherency = await Lib.Purchasing.CheckPO.CheckDataCoherency(true);
            shouldPrevent = !!hasError || !!hasDataIncoherency;
        }
        return shouldPrevent;
    }
    async function ProcessActions(currentName, currentAction) {
        // Handle retry actions
        currentName = HandleRetryInERP(currentName);
        currentName = FirstValidation(currentName, currentAction);
        return await ProcessActionsWithDataValidation(currentName);
    }
    function HandleRetryInERP(currentName) {
        let resultName = currentName;
        if (currentName === "Retry_") {
            RetryPO();
            resultName = "Submit_";
        }
        else if (currentName === "Continue_") {
            RetryPO(true);
            resultName = "Submit_";
        }
        return resultName;
    }
    function IsFirstValidation(currentName, currentAction) {
        return currentName === "" && currentAction === "";
    }
    function FirstValidation(currentName, currentAction) {
        let resultName = currentName;
        if (IsFirstValidation(currentName, currentAction)) {
            if (Process.AutoValidatingOnExpiration()) {
                Log.Warn("The PO has expired");
            }
            else if (Data.GetValue("State") == 50) {
                if (Data.GetValue("AutomaticOrder__")) {
                    resultName = "Submit_";
                }
                else {
                    Process.PreventApproval();
                }
            }
        }
        return resultName;
    }
    async function ProcessActionsWithDataValidation(currentName) {
        let handled = false;
        const lastErrorMessage = await Lib.Purchasing.CheckPO.CheckAll();
        if (currentName === "Submit_" || currentName === "RequestPayment") {
            Lib.Purchasing.Items.CheckProjectFields(Data.GetValue("CompanyCode__"), false, true);
        }
        const formHasError = Lib.P2P.FormHasError();
        if (formHasError || lastErrorMessage) {
            if (currentName === "SaveEditing_" || currentName === "RetryEditOrder") {
                Lib.Purchasing.PO.Edition.Manager.SetNextAlertPOEditionError();
            }
            handled = true;
        }
        else {
            Lib.CommonDialog.NextAlert.Reset();
            handled = await ProcessApprovalActions(currentName);
        }
        return handled;
    }
    async function ProcessApprovalActions(currentName) {
        let handled = true;
        switch (currentName) {
            case "Generate_Invoice":
                await Lib.Purchasing.Demo.GenerateVendorInvoice(Data.GetValue("OrderNumber__"), false);
                Process.PreventApproval();
                break;
            case "Generate_CO":
                await PublishCustomerOrder(Lib.Purchasing.Vendor.GetVendorContact());
                Process.PreventApproval();
                break;
            case "Submit_":
            case "RequestPayment":
                {
                    let action = parameters.actions.doOrder.GetName();
                    if (Lib.Purchasing.PO.Workflow.IsEnabled()) {
                        action = ValidationScript.wkfController.GetCurrentContributor().action;
                    }
                    await ValidationScript.wkfController.DoAction(action);
                    break;
                }
            case "SynchronizeItems":
                Process.StateOnLastScriptFailure(70);
                Process.AllowScriptRetries(true);
                await Lib.Purchasing.PO.Validation.SynchronizeItemsFromAction();
                break;
            case "UpdateExchangeRate":
                await Lib.Purchasing.PO.Validation.UpdateExchangeRate();
                poSpendingDispatcher.AsOrdered();
                Process.WaitForUpdate();
                Process.LeaveForm();
                break;
            case "OnCanceledReception":
                await Lib.Purchasing.PO.Validation.OnCanceledReception();
                poSpendingDispatcher.AsOrdered();
                break;
            case "DoCurrentWorkflowAction":
                await Lib.Purchasing.PO.Workflow.CurrentWorkflowAction();
                break;
            case "SaveEditing_":
            case "RetryEditOrder":
                await EditingActions();
                break;
            case "FullBudgetRecovery":
                Lib.Purchasing.POBudget.DoFullRecovery();
                break;
            case "SendEmailNotifications":
                Lib.Purchasing.PO.Validation.NotifyVendorByEmail();
                break;
            case "UpdateFromEditPORequest":
                await UpdateFromEditPORequest();
                break;
            case "UpdateFromOC":
                await UpdateFromOC();
                break;
            case "RollbackEditOrder":
                await RollbackEditOrder();
                break;
            case "ManualReceipt":
                await Lib.Purchasing.PO.Validation.ReverseItemToManualReceiption();
                break;
            case "UpdateBillingCompleted":
                Lib.Purchasing.PO.Validation.UpdateBillingCompleted(true);
                break;
            case "ReopenBilling":
                Lib.Purchasing.PO.Validation.UpdateBillingCompleted(false);
                break;
            default:
                handled = false;
                break;
        }
        return handled;
    }
    async function EditingActions() {
        if (Variable.GetValueAsString("SaveEditingAction") === "RollbackEditOrder") {
            Variable.SetValueAsString("SaveEditingAction", "");
            try {
                await Lib.Purchasing.PO.Edition.Manager.DoRollback();
                Lib.Purchasing.PO.ERP.ResetAck();
                Process.WaitForUpdate();
                Process.LeaveForm();
            }
            catch (error) {
                Log.Error("RollbackEditOrder on error: " + error);
                Process.PreventApproval();
            }
        }
        else {
            try {
                await Lib.Purchasing.PO.Edition.Manager.AsyncEditOrder({ origin: "EditPO" });
            }
            catch (error) {
                Log.Error("EditOrder on error: " + error);
                Process.PreventApproval();
            }
        }
    }
    async function UpdateFromEditPORequest() {
        const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
        Variable.SetValueAsString("FromEditPORequest", data.sourceRUIDEX);
        try {
            Log.Info("[UpdateFromEditPORequest] Try updating data");
            await Lib.Purchasing.PO.Edition.Manager.UpdateFromEditPORequest(data, {
                ancestorProcess: "EPOR"
            });
            Variable.SetValueAsString("FromEditPORequest", "");
            Process.WaitForUpdate();
            Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("EditPORequest", data.sourceRUIDEX, "EditPOSuccess");
        }
        catch (err) {
            await ProcessUpdateFromEditPORequestError(err, data);
        }
    }
    async function UpdateFromOC() {
        const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
        Variable.SetValueAsString("FromEditPORequest", data.sourceRUIDEX);
        let isRollbackNeeded = false;
        try {
            Log.Info("[Update from OC] Try updating data");
            Lib.Purchasing.PO.Edition.Manager.AssertNoUpdateForAmountBasedItemsWithReception(data);
            isRollbackNeeded = true;
            await Lib.Purchasing.PO.Edition.Manager.UpdateFromEditPORequest(data, {
                addConversationMessage: false,
                ancestorProcess: "OC"
            });
            Process.WaitForUpdate();
        }
        catch (err) {
            await ProcessUpdateFromOCError(err, data, isRollbackNeeded);
        }
    }
    async function ProcessUpdateFromOCError(err, data, isRollbackNeeded) {
        Log.Error(`[Update from OC] Error on EditPORequest ${err}`);
        let isErrorRollbacked = false;
        let nextAlert;
        if (isRollbackNeeded) {
            try {
                Log.Info("[Update from OC] Rollback needed : try rollbacking data");
                await Lib.Purchasing.PO.Edition.Manager.DoRollback("EditPORequest");
                isErrorRollbacked = true;
                nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                Lib.CommonDialog.NextAlert.Reset();
                Process.WaitForUpdate();
                Variable.SetValueAsString("FromEditPORequest", "");
            }
            catch (error) {
                Log.Error(`[Update from OC] Error on rollback ${error}`);
                nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                Lib.CommonDialog.NextAlert.Define("_PORollBackErrorTitle", "_PORollBackError", {
                    isError: true,
                    behaviorName: "EditPOREquestError"
                });
                Process.PreventApproval();
            }
        }
        else {
            Log.Info("[Update from OC] No rollback needed");
            nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
            Lib.CommonDialog.NextAlert.Reset();
            Process.WaitForUpdate();
            Variable.SetValueAsString("FromEditPORequest", "");
        }
        const resumeWithActionData = CreateResumeWithActionData(err, isErrorRollbacked, isRollbackNeeded, nextAlert);
        Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("S2P - Order Confirmation", data.sourceRUIDEX, "EditPOError", JSON.stringify(resumeWithActionData));
    }
    function CreateResumeWithActionData(err, isErrorRollbacked, isRollbackNeeded, nextAlert) {
        const resumeWithActionData = {
            IsErrorRollbacked: isErrorRollbacked || !isRollbackNeeded,
            NextAlert: nextAlert,
            Error: err
        };
        if (err instanceof Lib.Purchasing.PO.Edition.Manager.FormHasErrorBeforeUpdatingFromEditPORequest ||
            err instanceof Lib.Purchasing.PO.Edition.Manager.FormHasErrorAfterUpdatingFromEditPORequest) {
            resumeWithActionData.Error = err.constructor.name;
            resumeWithActionData.FieldsInError = err.fieldsInError;
        }
        return resumeWithActionData;
    }
    async function ProcessUpdateFromEditPORequestError(err, data) {
        Log.Error(`[UpdateFromEditPORequest] Error on EditPORequest ${err}`);
        let IsErrorRollbacked = false;
        let NextAlert;
        if (Lib.Purchasing.PO.Edition.Rollback.IsRollbackNeeded()) {
            try {
                Log.Info("[UpdateFromEditPORequest] Try rollbacking data");
                await Lib.Purchasing.PO.Edition.Manager.DoRollback("EditPORequest");
                IsErrorRollbacked = true;
                NextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                Lib.CommonDialog.NextAlert.Reset();
                Process.WaitForUpdate();
                Variable.SetValueAsString("FromEditPORequest", "");
            }
            catch (error) {
                Log.Error(`[UpdateFromEditPORequest] Error on rollback ${error}`);
                NextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                Lib.CommonDialog.NextAlert.Define("_PORollBackErrorTitle", "_PORollBackError", {
                    isError: true,
                    behaviorName: "EditPOREquestError"
                });
                Process.PreventApproval();
            }
        }
        else {
            NextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
            Lib.CommonDialog.NextAlert.Define("_PORequestEditErrorTitle", "_PORequestEditError", {
                isError: true,
                behaviorName: "EditPOREquestError"
            });
            Process.PreventApproval();
        }
        Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("EditPORequest", data.sourceRUIDEX, "EditPOError", JSON.stringify({
            IsErrorRollbacked,
            NextAlert
        }));
    }
    ValidationScript.ProcessUpdateFromEditPORequestError = ProcessUpdateFromEditPORequestError;
    async function ProcessEditPORequestError(error) {
        var _a;
        const editData = Lib.Purchasing.PO.Edition.ChangesManager.GetData();
        if (editData.origin === "EditPORequest") {
            const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
            if (((_a = editData.options) === null || _a === void 0 ? void 0 : _a.ancestorProcess) === "EPOR") {
                await ProcessUpdateFromEditPORequestError(error, data);
            }
            else {
                await ProcessUpdateFromOCError(error, data, true);
            }
            return true;
        }
        return false;
    }
    async function RollbackEditOrder() {
        try {
            const isEPOR = await ProcessEditPORequestError();
            if (!isEPOR) {
                await Lib.Purchasing.PO.Edition.Manager.DoRollback();
                Process.WaitForUpdate();
                Process.LeaveForm();
            }
        }
        catch (e) {
            Log.Error(e.toString());
            Process.PreventApproval();
        }
        Process.WaitForUpdate();
    }
    Lib.P2P.HandleScriptError(Start());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map