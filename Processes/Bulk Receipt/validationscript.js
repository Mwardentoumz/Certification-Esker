"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    async function IsValid() {
        const isValid = !Lib.P2P.FormHasError();
        const customIsValid = await Sys.Helpers.TryCallFunction("Lib.BR.Customization.Common.OnValidateForm", isValid);
        if (typeof customIsValid === "boolean") {
            return customIsValid;
        }
        return isValid;
    }
    class Main {
        constructor() {
            this.logger = new NamedLog({ namespace: "Bulk Receipt" });
        }
        async ActionSubmit(asynchrone) {
            this.logger.Info("ActionSubmit");
            if (!(await IsValid())) {
                throw new Error("Form is in error");
            }
            Lib.Purchasing.SetRightForP2PSupervisor();
            Lib.Purchasing.SetRightForProcurementViewer();
            Lib.Purchasing.SetRightToCustomUsers("BR");
            Lib.Purchasing.Receiving.InitBulkReceiptNumber();
            const brToGr = new Lib.Purchasing.Receiving.BRToGR();
            const lineItems = Data.GetTable("LineItems__");
            let itemCount = lineItems.GetItemCount();
            let lineIdx = 0;
            while (lineIdx < itemCount) {
                const item = lineItems.GetItem(lineIdx);
                if (Lib.Purchasing.Receiving.IsItemToReceive(item, brToGr)) {
                    lineIdx++;
                }
                else {
                    Log.Info(`Removing line item #${lineIdx} because it has no reception`);
                    itemCount = item.RemoveItem();
                }
            }
            const counts = Lib.Purchasing.Receiving.CreateMultipleGRsPerPO(Sys.Helpers.Data.GetTableAsArray("LineItems__"), brToGr, Lib.P2P.GetValidatorOrOwnerLogin());
            this.logger.Info(`Total Goods receipt to create: ${counts.total}, created: ${counts.created}`);
            if (counts.created === counts.total) {
                Data.SetValue("BRStatus__", "Success");
            }
            else {
                Data.SetValue("BRStatus__", counts.created === 0 ? "Error" : "Partial success");
                if (asynchrone) {
                    Lib.Purchasing.BR.SendEmailNotification("Purchasing_Email_NotifBRError.htm");
                }
                else {
                    // NextAlert
                }
            }
        }
        async Start() {
            // Index LineItems table to ES for better reporting
            Lib.P2P.SetTablesToIndex(["LineItems__"]);
            const actionName = Data.GetActionName();
            const actionType = Data.GetActionType();
            Log.Info(`ActionName: "${actionName}" ActionType: "${actionType}"`);
            // @ts-ignore
            Data.SetRequired("DeliveryDate__", false);
            if (actionName === "" && actionType === "") {
                if (Data.GetValue("State") === 50) {
                    if (Sys.Helpers.Data.IsTrue(Variable.GetValueAsString("SubmittedFromMobileApp")) || Sys.Helpers.Data.IsTrue(Variable.GetValueAsString("SubmittedFromAgent"))) {
                        await this.ActionSubmit(true);
                    }
                    else {
                        Process.PreventApproval();
                    }
                }
            }
            else if (actionName === "Approve") {
                await this.ActionSubmit(actionType === "approve_asynchronous");
            }
            else {
                Log.Warn("Unknown action");
                Process.PreventApproval();
            }
            Sys.Helpers.TryCallFunction("Lib.BR.Customization.Server.OnValidationScriptEnd");
        }
    }
    ValidationScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        main.Start();
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map