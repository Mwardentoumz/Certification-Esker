"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    async function CheckErrorPickup() {
        return !await Lib.Purchasing.PickupValidation.CheckOverReceivedItems();
    }
    function RetryGR(continueMode) {
        return Lib.ERP.ExecuteERPFunc("Retry", "GR", continueMode).ret;
    }
    function AllocatePickupNumber(pickupData) {
        // Fetch previous GR number if it already exists (crash protection)
        pickupData.number = Transaction.Read("SafePAC_GRNUMBER");
        if (!pickupData.number) {
            pickupData.number = Lib.P2P.NextNumber("PICKUP", "PickupNumber__");
            Transaction.Write("SafePAC_GRNUMBER", pickupData.number);
        }
        Data.SetValue("PickupNumber__", pickupData.number);
        Log.Info("Created with number " + pickupData.number);
    }
    function NotifyOnSuccess() {
        const number = Data.GetValue("PickupNumber__");
        const msg = "_Advise buyer on Pickup creation" + (number ? " with number" : "");
        Lib.CommonDialog.NextAlert.Define("_Pickup creation popup", msg, {
            isError: false,
            behaviorName: "PickupCreationInfo"
        }, number);
    }
    class POTransportManager {
        static GetTransport(poNumber) {
            if (!POTransportManager.transportMap.has(poNumber)) {
                Log.Info("Get transport for PO", poNumber);
                const transport = Lib.P2P.QueryPurchasingTransport("Purchase order", Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", poNumber).toString(), "*", true);
                POTransportManager.transportMap.set(poNumber, transport);
            }
            return POTransportManager.transportMap.get(poNumber);
        }
    }
    POTransportManager.transportMap = new Map();
    function Receive() {
        let ok = true;
        try {
            const pickupNumber = Data.GetValue("PickupNumber__");
            if (pickupNumber) {
                Log.Info("Already created with number " + pickupNumber);
            }
            else {
                AllocatePickupNumber({ number: pickupNumber });
            }
            NotifyOnSuccess();
            ok = Sys.Helpers.Data.RollbackableSection(function (rollbackFn) {
                Data.SetValue("PickupStatus__", "Received");
                return Lib.Purchasing.PickupValidation.SynchronizeItems() || rollbackFn();
            });
        }
        catch (e) {
            Lib.Purchasing.OnUnexpectedError(e.toString());
            ok = false;
        }
        if (ok) {
            Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
            SendEmailToRequesters();
        }
        else {
            Process.PreventApproval();
        }
    }
    function SendEmailToRequesters() {
        const itemsPerRequester = {};
        const pickupOwnerLogin = Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OwnerId"));
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            if (line.GetValue("PickupCompleted__") && line.GetValue("NotifyRequester__")) {
                const requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(line.GetValue("RequesterDN__"));
                if (requesterLogin !== pickupOwnerLogin) {
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
    function CreateOrUpdateInventoryMovement() {
        let bok = true;
        if (Data.GetValue("PickupStatus__") !== "Canceled") {
            const ruidex = Data.GetValue("RuidEx");
            const companyCode = Data.GetValue("CompanyCode__");
            let inventoryFilter = [];
            const itemsToUpdate = {};
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                const itemNumber = item.GetValue("Number__");
                const warehouseID = item.GetValue("WarehouseID__");
                inventoryFilter.push({
                    companyCode: companyCode,
                    itemNumber: itemNumber,
                    warehouseNumber: warehouseID
                });
                const key = Lib.P2P.Inventory.GetCriticalSection(itemNumber, warehouseID);
                itemsToUpdate[key] = new Lib.Purchasing.CatalogHelper.WarehouseItemProperties();
                itemsToUpdate[key].companyCode = companyCode;
                itemsToUpdate[key].itemNumber = itemNumber;
                itemsToUpdate[key].warehouseNumber = warehouseID;
                itemsToUpdate[key].currency = item.GetValue("Currency__");
                itemsToUpdate[key].unitPrice = item.GetValue("UnitPrice__");
                itemsToUpdate[key].locked = true;
                const unitPriceInLocalCurrency = Sys.Helpers.Round(new Sys.Decimal(item.GetValue("UnitPrice__") || 0).mul(item.GetValue("ExchangeRate__")), 6);
                let inventoryMovement = new Lib.P2P.Inventory.InventoryMovement();
                inventoryMovement.companyCode = companyCode;
                inventoryMovement.itemNumber = itemNumber;
                inventoryMovement.lineNumber = "" + item.GetValue("LineNumber__");
                inventoryMovement.movementOrigin = ruidex;
                inventoryMovement.movementType = "Removal" /* Lib.P2P.Inventory.MovementType.Removal */;
                inventoryMovement.movementValue = new Sys.Decimal(item.GetValue("PickedUpQuantity__")).mul(-1).toNumber();
                inventoryMovement.movementUnitPrice = unitPriceInLocalCurrency.toNumber();
                inventoryMovement.currency = item.GetValue("Currency__");
                inventoryMovement.unitOfMeasure = item.GetValue("ItemUnit__");
                inventoryMovement.warehouseID = warehouseID;
                bok = Lib.P2P.Inventory.CreateOrUpdateInventoryMovement(inventoryMovement);
            });
            if (inventoryFilter.length > 0) {
                bok = bok && Lib.P2P.Inventory.UpdateInventoryStock(inventoryFilter, true, itemsToUpdate);
            }
        }
        return bok;
    }
    ValidationScript.CreateOrUpdateInventoryMovement = CreateOrUpdateInventoryMovement;
    function SetRightsOnPickup() {
        // Add right for supervisor and buyer
        Lib.Purchasing.SetRightForP2PSupervisor();
        Lib.Purchasing.SetRightForProcurementViewer();
        Lib.Purchasing.SetRightForContractOwner();
        Lib.Purchasing.SetRightForAPClerk();
        Lib.Purchasing.SetRightToCustomUsers("GR");
        let recipients = new Set();
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            // Gives reading right to the recipient
            const currentDn = line.GetValue("RecipientDN__");
            if (!recipients.has(currentDn)) {
                recipients.add(currentDn);
                Log.Info("Grant read right to recipient " + currentDn);
                Process.SetRight(currentDn, "read");
            }
        });
        // find buyer login on each PO
        let buyers = new Set();
        let poItems = Lib.Purchasing.PickupValidation.GetPOItemsInForm();
        Object.keys(poItems).forEach(poNumber => {
            let transport = POTransportManager.GetTransport(poNumber);
            const buyer = transport.GetFormData().GetValue("BuyerLogin__");
            if (buyer && !buyers.has(buyer)) {
                buyers.add(buyer);
                Process.SetRight(buyer, "read");
            }
        });
    }
    function ReceiveAndUpdateInventory() {
        Receive();
        CreateOrUpdateInventoryMovement();
    }
    async function HandleReceiveAction() {
        if (Lib.P2P.FormHasError() || await CheckErrorPickup()) {
            Process.PreventApproval();
        }
        else {
            ReceiveAndUpdateInventory();
        }
    }
    const actionHandler = {
        "UpdateExchangeRate": async () => {
            await Lib.Purchasing.PickupValidation.UpdateExchangeRate();
            Lib.Purchasing.PickupValidation.SynchronizeItems({ justUpdateItems: true });
            CreateOrUpdateInventoryMovement();
        },
        "Retry_FinalizePO_": () => {
            ReceiveAndUpdateInventory();
        },
        "Cancel": () => {
            Data.SetValue("PickupStatus__", "Canceled");
            Process.Cancel();
            Process.LeaveForm();
        },
        "Retry_": async () => {
            // GPF, GR not found in ERP, retry all
            RetryGR();
            await HandleReceiveAction();
        },
        "Continue_": async () => {
            // GPF, GR Number known
            RetryGR(true);
            await HandleReceiveAction();
        }
    };
    async function Main() {
        await Lib.Purchasing.InitTechnicalFields();
        // Index LineItems table to ES for better reporting
        Lib.P2P.SetTablesToIndex(["LineItems__"]);
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- Pickup Validation Script -- Name: '" + (currentName || "<empty>") + "', Action: '" + (currentAction || "<empty>") + "'");
        const handler = actionHandler[currentName];
        if (handler) {
            await handler();
        }
        else {
            const extractCDValidationState = 50;
            const isExtractCDValidation = Data.GetValue("State") === extractCDValidationState;
            const isFirstValidationWithAutoReception = currentName === "" && currentAction === "" && Lib.Purchasing.IsAutoReceiveOrderEnabled() && isExtractCDValidation;
            if (isFirstValidationWithAutoReception || currentAction === "approve_asynchronous" || currentAction === "approve") {
                await HandleReceiveAction();
            }
            // ExtractCD Validation, set rights
            // The rights are defined at the end of the script because some items can be removed during validation
            if (isExtractCDValidation) {
                SetRightsOnPickup();
            }
        }
        const isRecallScriptScheduled = Process.IsRecallScriptScheduled();
        await Sys.Helpers.TryCallFunction("Lib.Pickup.Customization.Server.OnValidationScriptEnd", currentAction, currentName, isRecallScriptScheduled);
    }
    Lib.P2P.HandleScriptError(Main());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map