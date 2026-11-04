"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    async function IsGRInError() {
        const formHasError = Lib.P2P.FormHasError();
        const erpHasError = Lib.ERP.ExecuteERPFunc("CheckError", "GR").ret;
        const isValid = !formHasError && !erpHasError;
        const customIsValid = await Sys.Helpers.TryCallFunction("Lib.GR.Customization.Common.OnValidateForm", isValid);
        if (typeof customIsValid === "boolean") {
            return !customIsValid;
        }
        return !isValid;
    }
    function RetryGRInERP(continueMode) {
        return Lib.ERP.ExecuteERPFunc("Retry", "GR", continueMode).ret;
    }
    function AllocateGRNumber(createDocInERP, grData) {
        // allocate a number if no document created in ERP
        if (!createDocInERP || grData.number === undefined) {
            // Fetch previous GR number if it already exists (crash protection)
            grData.number = Transaction.Read("SafePAC_GRNUMBER");
            if (!grData.number) {
                grData.number = Lib.P2P.NextNumber("GR", "GRNumber__");
                Transaction.Write("SafePAC_GRNUMBER", grData.number);
            }
        }
        Data.SetValue("GRNumber__", grData.number);
        Log.Info("Created with number " + grData.number);
    }
    function CheckDeliveryCompleted(grData) {
        let nCompleted = 0;
        let table = Data.GetTable("LineItems__");
        let nItems = table.GetItemCount();
        for (let i = 0; i < nItems; i++) {
            let lineItem = table.GetItem(i);
            let receivedQuantity = lineItem.GetValue("ReceivedQuantity__");
            let completed = lineItem.GetValue("DeliveryCompleted__");
            if (receivedQuantity !== 0 || completed) {
                if (completed || receivedQuantity >= lineItem.GetValue("OpenQuantity__")) {
                    nCompleted++;
                }
            }
        }
        grData.localDoc = grData.localDoc || {};
        grData.localDoc.deliveryCompleted = nCompleted === nItems;
    }
    function CreateGRInERP() {
        let ok = true;
        let ERPName = Lib.ERP.GetERPName();
        let createDocInERP = Sys.Parameters.GetInstance("P2P_" + ERPName).GetParameter("CreateDocInERP");
        Log.Info("Create goods receipt in ERP " + ERPName);
        let ret = Lib.ERP.ExecuteERPFunc("Create", "GR");
        if (ret.error) {
            Lib.CommonDialog.NextAlert.Define("_Goods receipt creation error", ret.error);
            ok = false;
        }
        else {
            AllocateGRNumber(createDocInERP, ret.ret);
            Lib.ERP.ExecuteERPFunc("AttachURL", "GR");
            if (!Sys.Helpers.IsEmpty(ret.ret.number)) {
                CheckDeliveryCompleted(ret.ret);
            }
        }
        return ok;
    }
    ValidationScript.CreateGRInERP = CreateGRInERP;
    function InheritPOExternalVariables(poTransport) {
        Log.Info("[InheritPOExternalVariables]");
        const extVars = poTransport.GetExternalVars();
        const varNames = ["ContactLogin", "VendorAddress"];
        for (const name of varNames) {
            Variable.SetValueAsString(name, extVars.GetValue(name, 0));
        }
    }
    function NotifyOnSuccess() {
        const number = Data.GetValue("GRNumber__");
        let msg = "_Advise buyer on GR creation";
        if (number) {
            let ERPName = Lib.ERP.GetERPName();
            let createDocInERP = Sys.Parameters.GetInstance("P2P_" + ERPName).GetParameter("CreateDocInERP");
            msg += createDocInERP ? " with number " + ERPName : " with number";
        }
        else {
            msg = "_GR is being created in ERP";
            Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
            Process.WaitForUpdate();
        }
        Lib.CommonDialog.NextAlert.Define("_GR creation popup", msg, {
            isError: false,
            behaviorName: "GRCreationInfo"
        }, number);
    }
    function TakeOwnerShipOnPurchaseOrder(transport, token) {
        let ok = false;
        if (transport) {
            ok = transport.GetAsyncOwnership(token, 20000) === 0;
        }
        if (!ok) {
            Lib.CommonDialog.NextAlert.Define("_Goods receipt creation error", "_PreventConcurrentAccess PO items modified error message");
        }
        return ok;
    }
    function ReleaseOwnershipOnPurchaseOrder(transport, token) {
        if (transport) {
            transport.ReleaseAsyncOwnership(token);
        }
    }
    function PublishReviewScoring(transport) {
        const transportVars = transport.GetUninheritedVars();
        let scoring = Data.GetValue("ScoringValue__");
        if (scoring > 0) {
            Lib.AP.Scoring.AddScoreValue(transportVars.GetValue_String("CompanyCode__", 0), transportVars.GetValue_String("VendorNumber__", 0), Lib.AP.Scoring.ScoreTypes.Delivery, scoring, Data.GetValue("ScoringComment__"));
        }
    }
    const GetPOTransport = (() => {
        let _POTransport = null;
        return () => {
            var _a;
            if (!_POTransport) {
                let filter = "(RUIDEX=" + Data.GetValue("SourceRuid") + ")";
                if (Lib.Purchasing.IsAutoReceiveOrderEnabled()) {
                    const sourcePONumber = (_a = Lib.Purchasing.GetAutoReceiveOrderData()) === null || _a === void 0 ? void 0 : _a.SourcePONumber;
                    if (sourcePONumber) {
                        filter = "(OrderNumber__=" + sourcePONumber + ")";
                    }
                }
                _POTransport = Lib.P2P.QueryPurchasingTransport("Purchase order", filter, "*", true);
            }
            return _POTransport;
        };
    })();
    async function Receive() {
        const poTransport = GetPOTransport();
        // In the automatic mode, we prefer to use a global lock which allows to wait to acquire the lock.
        // Taking ownership does not have this functionality and it is highly likely to have several GRs on the same PO in the same time.
        let receiveOK = false;
        const beforeReceiveGRStatus = Data.GetValue("GRStatus__");
        const criticalSection = GetCriticalSectionToReceive(poTransport);
        Log.Info("[Validation.Receive] taking the global lock to receive PO items");
        try {
            await Process.PreventConcurrentAccessAsync(criticalSection, async () => {
                // Take ownership only when we are not in auto receive
                receiveOK = await ReceiveImpl(poTransport, !Lib.Purchasing.IsAutoReceiveOrderEnabled());
            }, 30);
        }
        catch (e) {
            Log.Error(e.toString());
            receiveOK = false;
        }
        if (!receiveOK) {
            Log.Error("[Validation.Receive] cannot take the global lock to receive PO items");
            Process.PreventApproval();
        }
        receiveOK = receiveOK && await Lib.P2P.Inventory.CreateOrUpdateInventoryMovementFromGRItems(Data.GetValue("RuidEx"), Data.GetValue("GRStatus__"), Data.GetValue("CompanyCode__"), Data.GetValue("OrderNumber__"));
        if (!receiveOK) {
            Data.SetValue("GRStatus__", beforeReceiveGRStatus);
            if (!Lib.CommonDialog.NextAlert.GetNextAlert()) {
                Lib.CommonDialog.NextAlert.Define("_Goods receipt creation error", "_Goods receipt creation error");
            }
        }
        return receiveOK;
    }
    ValidationScript.Receive = Receive;
    function GetCriticalSectionToReceive(poTransport) {
        const orderNumber = poTransport.GetUninheritedVars().GetValue("OrderNumber__", 0);
        const grFields = {
            orderNumberItemFieldName: "OrderNumber__",
            deliveryCompletedItemFieldName: "DeliveryCompleted__",
            receivedQuantityItemFieldName: "ReceivedQuantity__"
        };
        const criticalSection = [];
        Sys.Helpers.Data.ForEachTableItem("LineItems__", (item) => {
            if (Lib.Purchasing.Receiving.IsItemToReceive(item, grFields)) {
                const lineNumber = item.GetValue("LineNumber__");
                criticalSection.push(`RECEIVPO_${orderNumber}_${lineNumber}`);
            }
        });
        return criticalSection;
    }
    async function ReceiveImpl(poTransport, ownerShipOnPurchaseOrderNeeded) {
        const poRuidEx = poTransport.GetUninheritedVars().GetValue("RuidEx", 0);
        let ownershipToken = "RECEIV_" + Data.GetValue("MsnEx");
        let ok = true;
        if (ownerShipOnPurchaseOrderNeeded) {
            // Take ownership to avoid conflict in case the PO is being edited by someone else
            // PAC - FT-013911 - Ability for the buyer to update the delivery date of a purchase order
            ok = TakeOwnerShipOnPurchaseOrder(poTransport, ownershipToken);
        }
        try {
            // When the GR is submitted by ASN/BR (with autoCompleteFromData method), the PO external variables are not transmitted.
            if (Lib.Purchasing.IsAutoCompleteFromData()) {
                InheritPOExternalVariables(poTransport);
            }
            ok = ok && await Lib.Purchasing.GRValidation.CheckOverReceivedItems();
            const grNumber = Data.GetValue("GRNumber__");
            if (!grNumber) {
                ok = ok && CreateGRInERP();
            }
            else {
                Log.Info("Already created with number " + grNumber);
            }
            if (ok) {
                NotifyOnSuccess();
            }
            ok = ok && Lib.Purchasing.GRBudget.AsReceived();
            ok = ok && Sys.Helpers.Data.RollbackableSection(function (rollbackFn) {
                if (ownerShipOnPurchaseOrderNeeded) {
                    ReleaseOwnershipOnPurchaseOrder(poTransport, ownershipToken);
                }
                Lib.Purchasing.GRValidation.InsertAPPOItemsGRInDetailedAccrualEventsTable();
                if (Data.GetValue("GRNumber__")) {
                    Data.SetValue("GRStatus__", "Received" /* GRStatus.Received */);
                }
                else {
                    Data.SetValue("GRStatus__", "WaitingForERPAck" /* GRStatus.WaitingForERPAck */);
                }
                return Lib.Purchasing.GRValidation.SynchronizeItems({ poRuidEx }) || rollbackFn();
            });
        }
        catch (e) {
            if (ownerShipOnPurchaseOrderNeeded) {
                ReleaseOwnershipOnPurchaseOrder(poTransport, ownershipToken);
            }
            Lib.Purchasing.OnUnexpectedError(e.toString());
            ok = false;
        }
        if (ok) {
            Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
            SendEmailToRequesters();
        }
        else if (ownerShipOnPurchaseOrderNeeded) {
            ReleaseOwnershipOnPurchaseOrder(poTransport, ownershipToken);
        }
        if (ok && Sys.Parameters.GetInstance("AP").GetParameter("EnableSupplierScoring", "0") === "1" && poTransport) {
            PublishReviewScoring(poTransport);
        }
        return ok;
    }
    function SendEmailToRequesters() {
        const itemsPerRequester = {};
        const grOwnerLogin = Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OwnerId"));
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            if (line.GetValue("DeliveryCompleted__") && line.GetValue("NotifyRequester__")) {
                const requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(line.GetValue("RequesterDN__"));
                if (requesterLogin !== grOwnerLogin) {
                    if (!itemsPerRequester[requesterLogin]) {
                        itemsPerRequester[requesterLogin] = [];
                    }
                    itemsPerRequester[requesterLogin].push(line);
                }
            }
        });
        for (let requesterLogin in itemsPerRequester) {
            if (Object.prototype.hasOwnProperty.call(itemsPerRequester, requesterLogin)) {
                const options = BuildEmailToRequester(requesterLogin, itemsPerRequester[requesterLogin]);
                Log.Info(`Send notification to requester: ${requesterLogin}`);
                Lib.P2P.EmailNotification.SendEmailNotification(options);
            }
        }
    }
    function BuildEmailToRequester(requester, items) {
        const currentUser = Users.GetUser(Data.GetValue("OwnerId"));
        const fromName = currentUser.GetValue("DisplayName");
        const PRNumbers = [];
        let baseUrl = Data.GetValue("ValidationUrl");
        baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/"));
        let tempCustomTags = {
            Items__: "",
            putLink: false,
            FromName: fromName,
            PRNumber__: "",
            PlurialItems: items.length > 1,
            ViewUrl: Lib.P2P.GetURLFromSSO(baseUrl + "/View.link?tabName=_Purchasing%20Items&viewName=_PAC%20-%20My%20requested%20items%20-%20Received", currentUser)
        };
        const itemsCount = items.length;
        for (let i = 0; i < itemsCount; i++) {
            const PRNumber = items[i].GetValue("RequisitionNumber__");
            if (PRNumbers.indexOf(PRNumber) === -1) {
                PRNumbers.push(PRNumber);
                if (tempCustomTags.PRNumber__.length > 0) {
                    tempCustomTags.PRNumber__ += ", ";
                }
                tempCustomTags.PRNumber__ += PRNumber;
            }
            let description = String(items[i].GetValue("Description__"));
            tempCustomTags.Items__ += "<li>" + description.replace(/\n/g, "<br />") + "</li>";
            const recipient = items[i].GetValue("RecipientDN__");
            if (Users.GetUser(requester).IsMemberOf(recipient)) {
                tempCustomTags.putLink = true;
            }
        }
        let options = {
            userId: requester,
            template: "Purchasing_Email_ItemReceivedNotifRequester.htm",
            fromName: fromName,
            backupUserAsCC: false,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
            customTags: tempCustomTags,
            escapeCustomTags: false
        };
        return options;
    }
    function SetRightsOnGR() {
        // Add right for supervisor and buyer
        Lib.Purchasing.SetRightForP2PSupervisor();
        Lib.Purchasing.SetRightForProcurementViewer();
        Lib.Purchasing.SetRightForContractOwner();
        Lib.Purchasing.SetRightForAPClerk();
        Lib.Purchasing.SetRightToCustomUsers("GR");
        let recipientDnSet = {};
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            // Gives reading right to the recipient
            let currentDn = line.GetValue("RecipientDN__");
            if (Object.keys(recipientDnSet).length === 0 || !recipientDnSet[currentDn]) {
                recipientDnSet[currentDn] = 1;
                Log.Info("Grant read right to recipient " + currentDn);
                Process.SetRight(currentDn, "read");
            }
        });
        let buyer = Variable.GetValueAsString("BuyerLogin__");
        // find buyer login on the PO transport
        if (!buyer) {
            const transport = GetPOTransport();
            buyer = transport.GetFormData().GetValue("BuyerLogin__");
            Variable.SetValueAsString("BuyerLogin__", buyer);
        }
        if (buyer) {
            Log.Info("Grant read right to buyer: " + buyer);
            Process.SetRight(buyer, "read");
        }
    }
    function GetReturnOrderParameters() {
        const resumeWithActionData = Variable.GetValueAsString("resumeWithActionData");
        Log.Info(`OnReturnOrder: ${resumeWithActionData}`);
        const data = JSON.parse(resumeWithActionData || "{}");
        return data;
    }
    async function IsGRNumberUnique(GRNumber, CompanyCode = Data.GetValue("CompanyCode__")) {
        const filter = [
            Sys.Helpers.LdapUtil.FilterEqual("GRNumber__", GRNumber),
            Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", CompanyCode)
        ];
        const queryOptions = {
            table: "CDNAME#Goods receipt V2",
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
    ValidationScript.IsGRNumberUnique = IsGRNumberUnique;
    async function HandleNumberUnicity(grNumber) {
        const isNumberUnique = await ValidationScript.IsGRNumberUnique(grNumber);
        if (isNumberUnique) {
            Data.SetValue("GRNumber__", grNumber);
        }
        else {
            Lib.CommonDialog.NextAlert.Define(Lib.Purchasing.GRDuplicateNumberTitle, "_A goods receipt already exist with this number", null, grNumber);
            Data.SetValue("GRNumber__", "");
        }
        return isNumberUnique;
    }
    ValidationScript.HandleNumberUnicity = HandleNumberUnicity;
    function SendEmailToReceiverERPAsyncError() {
        const grOwnerLogin = Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OwnerId"));
        Log.Info(`Send order error email notification to ${grOwnerLogin}`);
        Lib.P2P.EmailNotification.SendEmailNotificationWithUser(Users.GetUser(grOwnerLogin), {
            customTags: {
                ERPError__: Data.GetValue("ERPError__")
            },
            template: "Purchasing_Email_GRAsyncERP_NotifError.htm",
            fromName: "",
            backupUserAsCC: true,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
        });
    }
    const ERPHandler = {
        get grNumber() {
            return Variable.GetValueAsString("ERPACK_GRNumber__") || Data.GetValue("GRNumber__");
        },
        get erpError() {
            return Variable.GetValueAsString("ERPACK_Error__");
        },
        CanReceiveAck() {
            return Data.GetValue("GRStatus__") === "WaitingForERPAck" /* GRStatus.WaitingForERPAck */;
        },
        async SetGRNumberFromAck() {
            if (ERPHandler.grNumber) {
                const isNumberUnique = await ValidationScript.HandleNumberUnicity(ERPHandler.grNumber);
                if (!isNumberUnique) {
                    // TODO : Lib.Purchasing.PO.Validation.SendErrorNotifToCurrentValidator();
                    Process.WaitForUpdate();
                }
                Variable.SetValueAsString("ERPACK_GRNumber__", "");
                return isNumberUnique;
            }
            Log.Warn("No goods receipt number receive from the ERP");
            return false;
        },
        SetAckError() {
            const erpError = ERPHandler.erpError || Language.Translate("_No error provided by ERP");
            Data.SetValue("ERPError__", erpError);
            Log.Info("ERPAck error: ", erpError);
            Variable.SetValueAsString("ERPACK_Error__", "");
        },
        async UpdateGR() {
            try {
                Data.SetValue("GRStatus__", "Received" /* GRStatus.Received */);
                Log.Info(`GRStatus__ set to '${Data.GetValue("GRStatus__")}'`);
                Lib.Purchasing.GRValidation.SynchronizeItems({ justUpdateItems: true });
                await Lib.P2P.Inventory.CreateOrUpdateInventoryMovementFromGRItems(Data.GetValue("RuidEx"), Data.GetValue("GRStatus__"), Data.GetValue("CompanyCode__"), Data.GetValue("OrderNumber__"));
                Lib.Purchasing.GRBudget.AsReceived(null, { forceUpdateOperationDetails: true });
            }
            catch (e) {
                Log.Error(e.toString());
                Lib.CommonDialog.NextAlert.Define("_Goods receipt creation error", "_GR unhandled exception error message");
                Process.PreventApproval();
            }
        },
        async HandleAckSubmission() {
            if (ERPHandler.CanReceiveAck()) {
                if (await ERPHandler.SetGRNumberFromAck()) {
                    await ERPHandler.UpdateGR();
                }
                else {
                    Process.WaitForUpdate();
                }
            }
            else {
                Log.Warn(`Can't acknowledge ERP input as gr status is ${Data.GetValue("GRStatus__")}`);
            }
        },
        async HandleAckError() {
            if (ERPHandler.CanReceiveAck()) {
                const noGrNumber = Sys.Helpers.IsEmpty(Variable.GetValueAsString("ERPACK_GRNumber__"));
                ERPHandler.SetAckError();
                await ERPHandler.SetGRNumberFromAck();
                SendEmailToReceiverERPAsyncError();
            }
            else {
                Log.Warn(`Can't acknowledge ERP Error as goods receipt status is ${Data.GetValue("GRStatus__")}`);
            }
            Process.WaitForUpdate();
        }
    };
    const actionHandler = {
        "UpdateExchangeRate": async () => {
            await Lib.Purchasing.GRValidation.UpdateExchangeRate();
            Lib.Purchasing.GRValidation.SynchronizeItems({ justUpdateItems: true });
            await Lib.P2P.Inventory.CreateOrUpdateInventoryMovementFromGRItems(Data.GetValue("RuidEx"), Data.GetValue("GRStatus__"), Data.GetValue("CompanyCode__"), Data.GetValue("OrderNumber__"));
            Lib.Purchasing.GRBudget.AsReceived();
        },
        "OnEditOrder": async () => {
            const transport = GetPOTransport();
            const poRuidEx = transport.GetUninheritedVars().GetValue_String("RuidEx", 0);
            await Lib.Purchasing.GRValidation.OnEditOrder({ poRuidEx });
        },
        "RetryOnEditOrder": async () => {
            const transport = GetPOTransport();
            const poRuidEx = transport.GetUninheritedVars().GetValue_String("RuidEx", 0);
            await Lib.Purchasing.GRValidation.OnEditOrder({ poRuidEx });
        },
        "FullBudgetRecovery": async () => {
            Lib.Purchasing.GRBudget.DoFullRecovery();
        },
        "FullBudgetRecoveryAndCompute": async () => {
            Lib.Purchasing.GRBudget.DoFullRecovery();
            // Find distinct budget IDs from LineItems table
            const budgetIdsToRecompute = new Set(Sys.Helpers.Data
                .GetTableAsObjectArray(Data.GetTable("LineItems__"), ["BudgetID__"])
                .filter(budget => budget.BudgetID__ !== undefined && budget.BudgetID__ !== "")
                .map(budget => budget.BudgetID__));
            budgetIdsToRecompute.forEach(Lib.Spending.Budget.ComputeBudgetFromOperationDetails);
        },
        "OnReturnOrder": async () => {
            const parameters = GetReturnOrderParameters();
            await Lib.Purchasing.GRValidation.OnReturnOrder(parameters.poLineNumbers);
            Lib.Purchasing.GRValidation.SynchronizeItems(); // Synchronize GR items and update PO
            Lib.Purchasing.GRBudget.AsReceived(); // Update budget
            await Lib.P2P.Inventory.CreateOrUpdateInventoryMovementFromGRItems(Data.GetValue("RuidEx"), Data.GetValue("GRStatus__"), Data.GetValue("CompanyCode__"), Data.GetValue("OrderNumber__"));
        },
        "OnERPAckReceived": async () => {
            await ERPHandler.HandleAckSubmission();
        },
        "OnERPAckError": async () => {
            await ERPHandler.HandleAckError();
        },
        "Cancel": async () => {
            Data.SetValue("GRStatus__", "Canceled" /* GRStatus.Canceled */);
            Process.Cancel();
            Process.LeaveForm();
        },
        "Retry_FinalizePO_": async () => {
            if (!await ValidationScript.Receive()) {
                Process.PreventApproval();
            }
        },
        "Retry_": async () => {
            // GPF, GR not found in ERP, retry all
            RetryGRInERP();
            if (!await HandleReceiveAction()) {
                Process.PreventApproval();
            }
        },
        "Continue_": async () => {
            // GPF, GR Number known
            RetryGRInERP(true);
            if (!await HandleReceiveAction()) {
                Process.PreventApproval();
            }
        }
    };
    async function HandleReceiveAction() {
        if (await IsGRInError()) {
            Log.Info("Form in error.");
            return false;
        }
        else {
            return await ValidationScript.Receive();
        }
    }
    async function Main() {
        await Lib.Purchasing.InitTechnicalFields();
        Sys.Helpers.Data.SetAllowTableValuesOnlyForColumns("LineItems__", ["ProjectCode__", "ProjectCodeDescription__"], false);
        Lib.P2P.SetTablesToIndex(["LineItems__"]);
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- GR Validation Script -- Name: '" + (currentName || "<empty>") + "', Action: '" + (currentAction || "<empty>") + "'");
        const handler = actionHandler[currentName];
        if (handler) {
            await handler();
            if (Data.GetValue("GRStatus__") === "WaitingForERPAck" /* GRStatus.WaitingForERPAck */) {
                Process.WaitForUpdate();
            }
        }
        else {
            const extractCDValidationState = 50;
            const isExtractCDValidation = Data.GetValue("State") === extractCDValidationState;
            // first approve with auto-reception (only execute the touchless in the sendCD action)
            if (currentName === "" && currentAction === "" && Lib.Purchasing.IsAutoReceiveOrderEnabled() && isExtractCDValidation) {
                if (!await HandleReceiveAction()) {
                    Process.PreventApproval();
                    Lib.Purchasing.GRValidation.EmailNotifyError();
                }
            }
            else if (currentAction === "approve_asynchronous" || currentAction === "approve") {
                if (!await HandleReceiveAction()) {
                    Process.PreventApproval();
                }
            }
            // ExtractCD Validation, set rights
            // The rights are defined at the end of the script because some items can be removed during validation
            if (isExtractCDValidation) {
                SetRightsOnGR();
            }
        }
        const isRecallScriptScheduled = Process.IsRecallScriptScheduled();
        Sys.Helpers.TryCallFunction("Lib.GR.Customization.Server.OnValidationScriptEnd", currentAction, currentName, isRecallScriptScheduled);
    }
    ValidationScript.Main = Main;
    Lib.P2P.HandleScriptError(Main());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map