"use strict";
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    class Main {
        constructor() {
            this.logger = new NamedLog({ namespace: "Order Confirmation" });
        }
        async Start() {
            if (Lib.ERP.GetBrowseERPName("AP") === "SAP") {
                Sys.Helpers.Data.SetAllowTableValuesOnlyForFields(["VendorName__"], false);
            }
            // The PO browse is strongly customized and the check on the server side cannot work
            Data.SetAllowTableValuesOnly("PONumber__", false);
            // Index LineItems table to ES for better reporting
            Lib.P2P.SetTablesToIndex(["LineItems__", "WorkflowTable__"]);
            Lib.CommonDialog.NextAlert.Reset();
            // Same as the PO
            Lib.P2P.InitValidityDateTime("PAC");
            Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
            const actionName = Data.GetActionName();
            const actionType = Data.GetActionType();
            this.logger.Info(`ActionName: "${actionName}" ActionType: "${actionType}"`);
            await Lib.Purchasing.OC.POData.InitConfirmedFieldsDefinition();
            try {
                if (actionName === "" && actionType === "") {
                    if (Lib.Purchasing.OC.IsCreatedFromPortal()) {
                        Log.Info("Auto submit the order confirmation (created from portal)");
                        Data.SetValue("InternalComments__", Language.Translate("_OC auto submitted"));
                        // Disable vendor check because the order confirmation is submitted from the portal. It may fail in the scenario of a new vendor (user exists but vendor hasn't yet been created)
                        Data.SetAllowTableValuesOnly("VendorName__", false);
                        // we perform the approval after a recall so that the data is written in the xgf and to avoid an empty form and desynchronized data with the CD record
                        Process.RecallScript("AutoSubmitFromPortal__");
                    }
                    else {
                        Process.PreventApproval();
                    }
                }
                else {
                    switch (actionName) {
                        case "save":
                            break;
                        case "Approve__":
                            await Lib.Purchasing.OC.ActionApprove();
                            break;
                        case "AutoSubmitFromPortal__":
                            Lib.Purchasing.OC.Workflow.notMergeableRoles.push(Lib.Purchasing.OC.Workflow.Roles.approver);
                            await Lib.Purchasing.OC.ActionApprove();
                            break;
                        case "Reject__":
                            await Lib.Purchasing.OC.ActionReject();
                            break;
                        case "EditPOSuccess":
                            Lib.Purchasing.OC.ActionEditPOSuccess();
                            break;
                        case "EditPOError":
                            Lib.Purchasing.OC.ActionEditPOError();
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
            await Sys.Helpers.TryCallFunction("Lib.OC.Customization.Server.OnValidationScriptEnd", actionType, actionName, isRecallScriptScheduled);
        }
        OnUnknownAction(currentAction, currentName) {
            const knownAction = Sys.Helpers.TryCallFunction("Lib.OC.Customization.Server.OnUnknownAction", currentAction, currentName);
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