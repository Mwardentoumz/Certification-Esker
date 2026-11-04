"use strict";
async function Main() {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info("-- Advanced Shipping Notice Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
    Lib.P2P.SetTablesToIndex(["LineItems__", "WorkflowTable__"]);
    // Validation after extracting
    if ((!currentName && !currentAction) || currentAction === "reprocess" || currentAction === "autocomplete") {
        Lib.Shipping.Validation.ValidateExtraction();
        if (currentAction === "autocomplete") {
            Lib.Shipping.Workflow.Rebuild();
        }
    }
    else if (currentAction === "approve_asynchronous" || currentAction === "approve" || currentAction === "ResumeWithAction") {
        Lib.CommonDialog.NextAlert.Reset();
        switch (currentName) {
            case "Save":
                Process.PreventApproval();
                break;
            case "Submit":
                await Lib.Shipping.Workflow.DoAction();
                break;
            case "DownloadPreviewRPTDataFile":
                Lib.Shipping.Validation.PrepareDownloadablePreviewRPTDataFile();
                break;
            case "ConfirmReceipt":
                await Lib.Shipping.Workflow.DoAction();
                break;
            case "ReviewerReject":
                await Lib.Shipping.Workflow.DoAction("rejection");
                break;
            default:
                Process.PreventApproval();
                break;
        }
    }
    // this code must be done once the configuration is loaded
    Lib.P2P.InitValidityDateTime("PAC");
    Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
}
Lib.P2P.HandleScriptError(Main());
//# sourceMappingURL=validationscript.js.map