"use strict";
var ValidationScript;
(function (ValidationScript) {
    async function Start() {
        // Same as the PO
        Lib.P2P.InitValidityDateTime("PAC");
        Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
        Lib.CommonDialog.NextAlert.Reset();
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Sys.Parameters.GetInstance("PAC").Serialize(true);
        Sys.Parameters.GetInstance("P2P").Serialize(true);
        Log.Info(`-- Request For Quote Validation Script -- Name: '${currentName || "<empty>"}', Action: '${currentAction || "<empty>"}' , Device: '${Data.GetActionDevice()}'`);
        if (currentName === "save") {
            // first call of the validation script when a user clicks an action button.
        }
        if (currentName === "" && currentAction === "" && Data.GetValue("State") === 50) {
            if (Data.GetValue("AutomaticRFQSubmit__") === true) {
                Log.Info("Auto-submitting RFQ");
                ValidationScript.Submit();
            }
            else {
                Process.PreventApproval();
            }
        }
        else if (currentName === "Save_") {
            Lib.Sourcing.RFQ.Save();
        }
        else if (currentName === "CancelRFQ") {
            ValidationScript.Cancel();
        }
        else if (currentName === "Submit") {
            ValidationScript.Submit();
        }
        else if (currentName === "Synchronize") {
            Process.DisableChecks();
            await ValidationScript.SynchronizeSuppliers(undefined, Data.GetValue("RFQStatus__") === "Closed" /* Lib.Sourcing.RFQStatus.Closed */);
            Process.WaitForUpdate();
        }
        else if (currentName === "TerminateRFQ") {
            await ValidationScript.TerminateRFQ();
        }
        else if (currentName === "AwardRFQ") {
            await ValidationScript.AwardRFQ();
        }
        else if (currentName === "SaveEditing_") {
            ValidationScript.EditRFQVendor();
            ValidationScript.CreateFieldNotificationToTerminateOnDeadline();
            Process.WaitForUpdate();
        }
        let isRecallScriptScheduled = Process.IsRecallScriptScheduled();
        Sys.Helpers.TryCallFunction("Lib.RFQ.Customization.Server.OnValidationScriptEnd", currentAction, currentName, isRecallScriptScheduled);
    }
    ValidationScript.Start = Start;
    function Cancel() {
        Data.SetValue("RFQStatus__", "Canceled" /* Lib.Sourcing.RFQStatus.Canceled */);
        Process.Cancel();
        Process.LeaveForm();
    }
    ValidationScript.Cancel = Cancel;
    function Submit() {
        Lib.Sourcing.DocumentsTable.HandleAttachementModifications();
        Lib.Sourcing.RFQ.SetRFQNumber();
        const number = Data.GetValue("RFQNumber__");
        if (!number) {
            Process.PreventApproval();
            return;
        }
        const now = new Date();
        Data.SetValue("RFQSubmissionDateTime__", now);
        Lib.P2P.SetBillingInfo("RFQ01");
        Sys.Helpers.Data.ForEachTableItem("Suppliers__", (supplier) => {
            Lib.Sourcing.RFQ.CreateRFQVendorProcess(supplier);
            Lib.Sourcing.RFQ.CreateConversation(supplier);
        });
        Variable.SetValueAsString("RichTextEditorStyle", "");
        Data.SetValue("RFQStatus__", "Pending response" /* Lib.Sourcing.RFQStatus.PendingResponse */);
        // Set next alert with RFQ number
        const msg = "_Advise buyer on RFQ creation with number";
        Lib.CommonDialog.NextAlert.Define("_RFQ creation popup", msg, {
            isError: false,
            behaviorName: "RFQCreationInfo"
        }, number);
        Lib.Sourcing.RFQ.UpdateIntakeRequest();
        ValidationScript.CreateFieldNotificationToTerminateOnDeadline();
        Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
        Process.WaitForUpdate();
    }
    ValidationScript.Submit = Submit;
    function CreateFieldNotificationToTerminateOnDeadline() {
        const ruidex = Data.GetValue("RuidEx");
        const originalRFQ = Process.GetUpdatableTransportAsProcessAdmin(ruidex);
        const vars = originalRFQ.GetUninheritedVars();
        const terminationDateTime = Sys.Helpers.Date.Date2DBDateTime(Data.GetValue("RFQDeadline__"));
        vars.AddValue_String("IsUnique", "1", true);
        vars.AddValue_String("Replace", "1", true);
        vars.AddValue_String("NextTryDateTime", terminationDateTime, true);
        originalRFQ.ResumeWithActionAsync("TerminateRFQ");
        Log.Info(`Fields notif createdat date '${terminationDateTime}' for RuidEX '${ruidex}' (myself*)`);
    }
    ValidationScript.CreateFieldNotificationToTerminateOnDeadline = CreateFieldNotificationToTerminateOnDeadline;
    function SendSupplierUpdatedEmailNotification(supplier) {
        const supplierUpdatedTemplates = {
            ["Rejected" /* Lib.Sourcing.RFQVendorStatus.Rejected */]: "Sourcing_Email_NotifRFQVendor_Rejected.htm",
            ["Pending evaluation" /* Lib.Sourcing.RFQVendorStatus.PendingEvaluation */]: "Sourcing_Email_NotifRFQVendor_Submitted.htm"
        };
        const template = supplierUpdatedTemplates[supplier.GetValue("SupplierStatus__")];
        if (template) {
            const customTags = {
                RFQUrl: Data.GetValue("ValidationUrl"),
                RFQNumber__: Data.GetValue("RFQNumber__"),
                RFQName__: Data.GetValue("RFQName__"),
                SupplierName__: supplier.GetValue("SupplierName__"),
                SupplierComment__: supplier.GetValue("SupplierComment__"),
                RequesterName__: Data.GetValue("RequesterName__")
            };
            Lib.Sourcing.RFQ.SendEmailNotification(Data.GetValue("RequesterID__"), template, customTags, false);
        }
    }
    ValidationScript.SendSupplierUpdatedEmailNotification = SendSupplierUpdatedEmailNotification;
    ;
    async function SynchronizeSuppliers(vendorForms, isRFQClosed) {
        vendorForms = vendorForms || await Lib.Sourcing.RFQ.GetVendorProcessMap();
        if (vendorForms.size) {
            let suppliersWhoResponded = 0, suppliersWhoDeclined = 0;
            const respondedSupplierNames = [];
            const bestPrices = new Map();
            Sys.Helpers.Data.ForEachTableItem("Suppliers__", (supplierItem) => {
                var _a;
                const supplierRuidEx = supplierItem.GetValue("SupplierResponseRuidEx__");
                if (vendorForms.has(supplierRuidEx)) {
                    const supplier = vendorForms.get(supplierRuidEx);
                    const updated = SynchronizeSupplier(supplierItem, supplier, isRFQClosed);
                    if (updated && supplierItem.GetValue("SupplierStatus__") === "Pending evaluation" /* Lib.Sourcing.RFQVendorStatus.PendingEvaluation */) {
                        respondedSupplierNames.push(supplierItem.GetValue("SupplierName__"));
                    }
                    if (supplierItem.GetValue("SupplierStatus__") !== "Rejected" /* Lib.Sourcing.RFQVendorStatus.Rejected */ && ((_a = supplier.items) === null || _a === void 0 ? void 0 : _a.length)) {
                        UpdateItemsBestPrice(supplier, bestPrices);
                    }
                }
                switch (supplierItem.GetValue("SupplierStatus__")) {
                    case "Pending evaluation" /* Lib.Sourcing.RFQVendorStatus.PendingEvaluation */:
                        suppliersWhoResponded++;
                        break;
                    case "Rejected" /* Lib.Sourcing.RFQVendorStatus.Rejected */:
                        suppliersWhoDeclined++;
                        break;
                    default:
                        break;
                }
            });
            Data.SetValue("SuppliersWhoResponded__", suppliersWhoResponded);
            Data.SetValue("SuppliersWhoDeclined__", suppliersWhoDeclined);
            const overviewTable = Data.GetTable("ItemsToSource__");
            bestPrices.forEach((bestPrice, tableIndex) => {
                let item = overviewTable.GetItem(tableIndex);
                if (!item) {
                    // Create all rows to keep indexes correct
                    item = overviewTable.AddItem();
                }
                if (Sys.Helpers.IsNumeric(bestPrice === null || bestPrice === void 0 ? void 0 : bestPrice.bestNetAmount)) {
                    if (Sys.Helpers.IsNumeric(bestPrice === null || bestPrice === void 0 ? void 0 : bestPrice.bestUnitPrice)) {
                        item.SetValue("ItemBestUnitPrice__", bestPrice.bestUnitPrice);
                    }
                    item.SetValue("ItemTotalBestUnitPrice__", bestPrice.bestNetAmount);
                    item.SetValue("ItemBestSupplierNumber__", bestPrice.bestSupplierNumber);
                    item.SetValue("ItemBestResponseRuidEx__", bestPrice.bestSupplierRuidEx);
                }
            });
            Lib.Sourcing.RFQ.UpdateTotals();
            Lib.Sourcing.RFQ.UpdateIntakeRequest();
            if (respondedSupplierNames.length > 0) {
                Lib.Sourcing.RFQ.SendResponseReceivedTeamsNotification(respondedSupplierNames);
            }
        }
    }
    ValidationScript.SynchronizeSuppliers = SynchronizeSuppliers;
    function SynchronizeSupplier(item, rfqVendorObject, isRFQClosed) {
        const status = rfqVendorObject.form.status;
        const updated = item.GetValue("SupplierStatus__") !== status && item.GetValue("SupplierStatus__") !== "No answer" /* Lib.Sourcing.RFQVendorStatus.NoAnswer */;
        Log.Info(`Synchronize Supplier with number ${Lib.Sourcing.RFQ.GetVendorNumber(item)} => ${status}`);
        if (status !== "Closed" /* Lib.Sourcing.RFQVendorStatus.Closed */) {
            let newStatus = status;
            if (isRFQClosed && status === "Draft" /* Lib.Sourcing.RFQVendorStatus.Draft */) {
                newStatus = "No answer" /* Lib.Sourcing.RFQVendorStatus.NoAnswer */;
            }
            item.SetValue("SupplierStatus__", newStatus);
        }
        item.SetValue("SupplierLastUpdateDateTime__", rfqVendorObject.form.lastUpdateDatetime);
        if (status === "Rejected" /* Lib.Sourcing.RFQVendorStatus.Rejected */) {
            item.SetValue("SupplierComment__", rfqVendorObject.form.rejectionReason);
        }
        if (updated) {
            SendSupplierUpdatedEmailNotification(item);
        }
        return updated;
    }
    function UpdateItemsBestPrice(RFQVendorObject, bestPrices) {
        var _a;
        (_a = RFQVendorObject.items) === null || _a === void 0 ? void 0 : _a.forEach(item => {
            // LineID are formatted like : <Process MSNEX>_<CDL ID>_<index in table>
            const tableIndex = item.lineId.split("_")[2];
            let currentBest = bestPrices.get(tableIndex);
            // Create an entry for every items to fill the table correctly later
            if (!currentBest) {
                currentBest = {
                    bestUnitPrice: undefined,
                    bestNetAmount: undefined,
                    bestSupplierNumber: undefined,
                    bestSupplierRuidEx: undefined
                };
            }
            if ((item.itemType !== Lib.P2P.ItemType.AMOUNT_BASED && !Sys.Helpers.IsEmpty(item.unitPrice))
                || (item.itemType === Lib.P2P.ItemType.AMOUNT_BASED && !Sys.Helpers.IsEmpty(item.netAmount))) {
                const netAmount = parseFloat(item.netAmount);
                if (!Sys.Helpers.IsNumeric(currentBest.bestNetAmount) || currentBest.bestNetAmount > netAmount) {
                    currentBest = {
                        bestUnitPrice: item.unitPrice ? parseFloat(item.unitPrice) : undefined,
                        bestNetAmount: netAmount,
                        bestSupplierNumber: RFQVendorObject.supplier.number,
                        bestSupplierRuidEx: RFQVendorObject.form.ruidex
                    };
                }
            }
            bestPrices.set(tableIndex, currentBest);
        });
    }
    ValidationScript.UpdateItemsBestPrice = UpdateItemsBestPrice;
    function forEachPendingVendor(vendorForms, callback) {
        vendorForms.forEach((supplier) => {
            const status = supplier.form.status;
            if (status === "Draft" /* Lib.Sourcing.RFQVendorStatus.Draft */ || status === "Pending evaluation" /* Lib.Sourcing.RFQVendorStatus.PendingEvaluation */) {
                const updatableDocument = Process.GetUpdatableTransportAsProcessAdmin(supplier.form.ruidex);
                const updatableVars = updatableDocument.GetUninheritedVars();
                updatableVars.AddValue_Long("ResumeWithActionAsyncAllowedOnState70", 1, true);
                updatableVars.AddValue_Long("IsUnique", 1, true);
                callback(supplier, updatableDocument, updatableVars);
            }
        });
    }
    async function TerminateRFQ() {
        const vendorForms = await Lib.Sourcing.RFQ.GetVendorProcessMap();
        const isEarlyTermination = Variable.GetValueAsString("EarlyTermination") === "1";
        forEachPendingVendor(vendorForms, (supplier, updatableDocument, updatableVars) => {
            if (isEarlyTermination) {
                updatableVars.AddValue_Date("RFQDeadline__", Data.GetValue("RFQDeadline__"), true);
            }
            if (updatableDocument.ResumeWithActionAsync("TerminateRFQ")) {
                Log.Info(`Terminating RFQ Vendor with status ${supplier.form.status} with ruidex ${supplier.form.ruidex}`);
            }
            else {
                Log.Info(`Failed to send Terminating RFQ Vendor with status ${supplier.form.status} with ruidex ${supplier.form.ruidex}`);
            }
        });
        Data.SetValue("RFQStatus__", "Closed" /* Lib.Sourcing.RFQStatus.Closed */);
        Log.Info("updating RFQ status to Closed");
        await SynchronizeSuppliers(vendorForms, true);
        if (isEarlyTermination) {
            await Lib.Sourcing.RFQ.SendEarlyTerminationEmails();
            Variable.SetValueAsString("EarlyTermination", "");
        }
    }
    ValidationScript.TerminateRFQ = TerminateRFQ;
    async function EditRFQVendor() {
        Lib.P2P.Edition.ChangesManager.Init();
        const supplierItems = Sys.Helpers.Data.GetTableAsArray("Suppliers__");
        Sys.Helpers.Data.ForEachTableItem("Suppliers__", (supplier) => {
            if (Sys.Helpers.IsEmpty(supplier.GetValue("SupplierResponseRuidEx__"))) {
                Lib.Sourcing.RFQ.CreateRFQVendorProcess(supplier);
            }
            if (Sys.Helpers.IsEmpty(supplier.GetValue("SupplierConversationID__"))) {
                Lib.Sourcing.RFQ.CreateConversation(supplier);
            }
        });
        const message = Lib.Sourcing.RFQ.Edition.GetConversationMessage();
        if (message) {
            const vendorForms = await Lib.Sourcing.RFQ.GetVendorProcessMap();
            forEachPendingVendor(vendorForms, (supplier, updatableDocument, updatableVars) => {
                updatableVars.AddValue_Date("RFQDeadline__", Data.GetValue("RFQDeadline__"), true);
                const supplierItem = supplierItems.find(item => item.GetValue("SupplierResponseRuidEx__") === supplier.form.ruidex);
                const extVars = updatableDocument.GetExternalVars();
                extVars.AddValue_String(Lib.Sourcing.Conversation.MessageOptionsVariable, JSON.stringify({
                    senderLogin: Data.GetValue("LastSavedOwnerID"),
                    message: message,
                    conversationID: supplierItem.GetValue("SupplierConversationID__")
                }), true);
                if (updatableDocument.ResumeWithActionAsync("EditRFQ")) {
                    Log.Info(`Editing RFQ Vendor with status ${supplier.form.status} with ruidex ${supplier.form.ruidex}`);
                }
                else {
                    Log.Error(`Failed to send Editing RFQ Vendor with status ${supplier.form.status} with ruidex ${supplier.form.ruidex} with error : ${updatableDocument.GetLastErrorMessage()}`);
                }
            });
        }
        else {
            Log.Info(`No RFQVendor form update required : nothing to notify to the suppliers`);
        }
        Lib.P2P.Edition.ChangesManager.Reset();
    }
    ValidationScript.EditRFQVendor = EditRFQVendor;
    async function AwardRFQ() {
        let awardedLines = [];
        try {
            const awardedLinesJSON = Variable.GetValueAsString("AWARDEDLINES");
            awardedLines = awardedLinesJSON ? JSON.parse(awardedLinesJSON) : [];
            if (awardedLines) {
                Lib.Sourcing.RFQ.FillItemsToSourceAwardedSuppliers(awardedLines);
                const awardShouldSendEmail = Variable.GetValueAsString("AWARDSHOULDSENDEMAIL");
                if (awardShouldSendEmail === "true") {
                    await Lib.Sourcing.RFQ.SendEmailsToAwardedSuppliers(awardedLines);
                }
            }
            Variable.SetValueAsString("AWARDEDLINES", "");
            Variable.SetValueAsString("AWARDSHOULDSENDEMAIL", "");
        }
        catch (e) {
            Log.Error("Failed to fill items with awarded suppliers: " + e);
        }
        if (Data.GetValue("RFQStatus__") !== "Closed" /* Lib.Sourcing.RFQStatus.Closed */) {
            Lib.Sourcing.RFQ.UpdateIntakeRequest();
            Process.WaitForUpdate();
        }
        // else we are doing nothing else so the process pass in State 100
    }
    ValidationScript.AwardRFQ = AwardRFQ;
    Lib.P2P.HandleScriptError(Start());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map