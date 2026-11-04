"use strict";
function executeFinalizationScript() {
    if (Data.GetValue("State") <= 100) {
        Process.Forward(Lib.AP.WorkflowCtrl.GetWorkflowInitiator().login);
        if (Lib.AP.WorkflowCtrl.workflowUI.IsEnded()) {
            Data.SetValue("EstimatedLatePaymentDays__", "");
        }
    }
    if (Lib.AP.WorkflowCtrl.workflowUI.IsEnded()) {
        Lib.AP.VendorInvoice.WorkflowTimeParser.ComputeLeadTimes();
    }
}
// In case of retry of the finalization script on unexpected error the CD Connector is reseting the archive duration with the ones from the process design.
// Make sure we keep the ArchiveDuration value from the configuration
Lib.AP.InitArchiveDuration();
const currentName = Data.GetActionName();
if (currentName !== "FullBudgetRecovery") {
    Lib.AP.WorkflowCtrl.Init();
    executeFinalizationScript();
}
//# sourceMappingURL=finalizationscript.js.map