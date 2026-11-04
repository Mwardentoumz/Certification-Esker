"use strict";
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    function GetBuyers() {
        const users = new Set();
        Sys.Helpers.Data.ForEachTableItem("LineItems__", (item) => {
            users.add(Sys.Helpers.String.ExtractLoginFromDN(item.GetValue("ItemBuyerDN__")));
            Log.Info(`[GetBuyers] Added buyer ${item.GetValue("ItemBuyerDN__")}`);
        });
        return users;
    }
    ValidationScript.GetBuyers = GetBuyers;
    async function OnOCRejected() {
        if (Data.GetValue("Status__") === "ToApprove") {
            const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
            Data.SetValue("RejectionComment__", data.RejectionComment__);
            Data.SetValue("Status__", Lib.Purchasing.OCVendor.OCStatus.Rejected);
            Data.SetValue("State", 400);
            const poDataToUpdate = await Lib.Purchasing.ModuleOC.GetPODataToUpdate();
            Lib.Purchasing.OCVendor.SendEmailToVendor("Rejected", poDataToUpdate);
        }
    }
    ValidationScript.OnOCRejected = OnOCRejected;
    async function OnOCApproved() {
        if (Data.GetValue("Status__") === "ToApprove") {
            Data.SetValue("Status__", Lib.Purchasing.OCVendor.OCStatus.Approved);
            const poDataToUpdate = await Lib.Purchasing.ModuleOC.GetPODataToUpdate();
            if (Lib.Purchasing.ModuleOC.HasAnyPODataToUpdate(poDataToUpdate)) {
                Lib.Purchasing.OCVendor.SendEmailToVendor("Approved", poDataToUpdate);
            }
        }
    }
    ValidationScript.OnOCApproved = OnOCApproved;
    async function OnOCError() {
        if (Data.GetValue("Status__") === "ToApprove") {
            Data.SetValue("Status__", Lib.Purchasing.OCVendor.OCStatus.Failed);
            const poDataToUpdate = await Lib.Purchasing.ModuleOC.GetPODataToUpdate();
            Lib.Purchasing.OCVendor.SendEmailToVendor("Failed", poDataToUpdate);
        }
    }
    ValidationScript.OnOCError = OnOCError;
    async function Submit() {
        try {
            Log.Info("[Submit] begin...");
            await Lib.Purchasing.ModuleOC.ResetUpdatedFieldsIfNeeded();
            Lib.Purchasing.ModuleOC.FillTotalNetAmount();
            const status = Data.GetValue("Status__");
            if (status !== Lib.Purchasing.OCVendor.OCStatus.Draft) {
                Log.Error(`[Submit] Unexpected action with status: ${status}`);
                throw new Sys.Helpers.Promise.HandledError();
            }
            if (Lib.P2P.FormHasError()) {
                throw new Sys.Helpers.Promise.HandledError();
            }
            Data.SetValue("OrderConfirmationDate__", new Date());
            Sys.TechnicalData.SetValue("FutureStatus", Lib.Purchasing.OCVendor.OCStatus.ToApprove);
            await Lib.Purchasing.OCVendor.ReAttachOrderConfirmation();
            // The recall is necessary for the regenerated document to be taken into account when creating the client instance of the OC
            Process.RecallScript("FinalizeSubmission", /* isAsync: */ true);
            Process.LeaveForm();
        }
        catch (e) {
            Sys.Helpers.Promise.HandledError.Catcher("Submit", null, false)(e);
            throw new Error("An error occurred while submitting the OC");
        }
        finally {
            Sys.TechnicalData.DeleteValue("FutureStatus");
        }
    }
    ValidationScript.Submit = Submit;
    function FinalizeSubmission() {
        try {
            Log.Info("[FinalizeSubmission] begin...");
            const buyerLogin = Array.from(GetBuyers())[0];
            Log.Info(`[FinalizeSubmission] Generating 'Order confirmation' for user ${buyerLogin}`);
            const orderConfirmation = Process.CreateProcessInstanceForUser("S2P - Order Confirmation", buyerLogin, 0 /* ChildProcessType.Independent */, false);
            if (!orderConfirmation) {
                Log.Error(`[FinalizeSubmission] cannot create instance of the 'S2P - Order Confirmation' process. Details: ${Process.GetLastErrorMessage()}`);
                throw new Sys.Helpers.Promise.HandledError();
            }
            const vars = orderConfirmation.GetUninheritedVars();
            vars.AddValue_String("DisableAutoLearning", "true", true);
            FillOC(orderConfirmation);
            Log.Info("[FinalizeSubmission] Filled OC");
            orderConfirmation.Process();
            if (orderConfirmation.GetLastError() !== 0) {
                Log.Error(`[FinalizeSubmission] cannot submit an instance of the 'S2P - Order Confirmation' process. Details: ${orderConfirmation.GetLastErrorMessage()}`);
                throw new Sys.Helpers.Promise.HandledError();
            }
            Lib.Purchasing.ModuleOC.FillTotalNetAmount();
            Data.SetValue("Status__", "ToApprove");
            Log.Info("[FinalizeSubmission] OC created successfully");
            const OCRuidEx = vars.GetValue_String("RuidEx", 0);
            Variable.SetValueAsString("OCRuidEx__", OCRuidEx);
            Lib.P2P.CreateConversation(buyerLogin, Lib.P2P.Conversation.Options.GetOrderConfirmation(), OCRuidEx);
            Process.WaitForUpdate();
        }
        catch (e) {
            Data.SetValue("Status__", Lib.Purchasing.OCVendor.OCStatus.Draft); // restore status
            Sys.Helpers.Promise.HandledError.Catcher("FinalizeSubmission", null, false)(e);
            throw new Error("An error occurred while creating the OC");
        }
    }
    ValidationScript.FinalizeSubmission = FinalizeSubmission;
    function FillOC(ocInstance) {
        try {
            const ocDocument = Attach.GetAttach(0);
            if (ocDocument) {
                const docVars = ocDocument.GetVars();
                const name = docVars.GetValue_String("AttachOutputName", 0);
                Log.Info(`[FillOC] Attach the main document with name ${name}`);
                const newAttach = ocInstance.AddAttachEx(ocDocument);
                const newAttachVars = newAttach.GetVars();
                newAttachVars.AddValue_String("AttachOutputName", name, true);
                newAttachVars.AddValue_Long("AttachToProcess", 1, true);
            }
            else {
                Log.Error("[FillOC] no document to attach");
            }
            let vars = ocInstance.GetUninheritedVars();
            vars.AddValue_String("TechnicalData__", JSON.stringify({
                "OCVendorRuidEx": Data.GetValue("RuidEx"),
                "CORuidEx": Data.GetValue("SourceRuid"),
                "VendorCompany": Users.GetUserAsProcessAdmin(Data.GetValue("OwnerID")).GetValue("Company") || Data.GetValue("VendorName__")
            }), true);
            vars.AddValue_Date("OrderConfirmationDate__", Data.GetValue("OrderConfirmationDate__"), true);
            vars.AddValue_String("OCNumber__", Data.GetValue("OCNumber__"), true);
            vars.AddValue_String("CompanyCode__", Data.GetValue("CompanyCode__"), true);
            vars.AddValue_String("VendorNumber__", Data.GetValue("VendorNumber__"), true);
            vars.AddValue_String("VendorName__", Data.GetValue("VendorName__"), true);
            vars.AddValue_String("Comment__", Data.GetValue("Comment__"), true);
            vars.AddValue_String("PONumber__", Data.GetValue("PONumber__"), true);
        }
        catch (e) {
            Sys.Helpers.Promise.HandledError.Catcher("FillOC")(e);
        }
    }
    async function RefreshPreview() {
        Log.Info("[OCVendor RefreshPreview]");
        try {
            Lib.Purchasing.ModuleOC.FillTotalNetAmount();
            await Lib.Purchasing.OCVendor.ReAttachOrderConfirmation();
        }
        catch (e) {
            Log.Error(`[OCVendor RefreshPreview] unexpected error: ${e}`);
        }
        finally {
            Process.PreventApproval();
        }
    }
    function Delete() {
        Log.Info("[OCVendor Delete]");
        Data.SetValue("Status__", Lib.Purchasing.OCVendor.OCStatus.Deleted);
        Process.Cancel();
        Process.LeaveForm();
    }
    class Main {
        constructor() {
            this.logger = new NamedLog({ namespace: "Order Confirmation Vendor" });
        }
        async Start() {
            // Index LineItems table to ES for better reporting
            Lib.P2P.SetTablesToIndex(["LineItems__"]);
            Lib.CommonDialog.NextAlert.Reset();
            const actionName = Data.GetActionName();
            const actionType = Data.GetActionType();
            this.logger.Info(`ActionName: "${actionName}" ActionType: "${actionType}"`);
            await Lib.Purchasing.OCVendor.InitConfirmedFieldsDefinition();
            try {
                if (actionName === "" && actionType === "") {
                    await Lib.Purchasing.OCVendor.GeneratePreview();
                    Process.PreventApproval();
                }
                else {
                    switch (actionName) {
                        case "Submit__":
                            await Submit();
                            break;
                        case "FinalizeSubmission":
                            FinalizeSubmission();
                            break;
                        case "OCApproved":
                            await OnOCApproved();
                            break;
                        case "OCRejected":
                            await OnOCRejected();
                            break;
                        case "OCError":
                            await OnOCError();
                            break;
                        case "Save__":
                        case "RefreshPreview__":
                            await RefreshPreview();
                            break;
                        case "Delete__":
                            Delete();
                            break;
                        default:
                            this.OnUnknownAction(actionType, actionName);
                            break;
                    }
                }
            }
            catch (error) {
                this.logger.Error(`[Start] An action has thrown an error with message: ${Lib.Purchasing.ModuleOC.GetStringErrorMessage(error)}`);
                throw error;
            }
            const isRecallScriptScheduled = Process.IsRecallScriptScheduled();
            await Sys.Helpers.TryCallFunction("Lib.OCVendor.Customization.Server.OnValidationScriptEnd", actionType, actionName, isRecallScriptScheduled);
        }
        OnUnknownAction(currentAction, currentName) {
            const knownAction = Sys.Helpers.TryCallFunction("Lib.OCVendor.Customization.Server.OnUnknownAction", currentAction, currentName);
            if (knownAction !== true) {
                Lib.Purchasing.OnUnknownAction(currentAction, currentName);
            }
        }
    }
    ValidationScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        Lib.P2P.HandleScriptError(main.Start());
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map