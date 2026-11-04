"use strict";
const options = {
    maxElementsPerRecall: 50,
    limitHistoryToLastDays: 30
};
Process.SetTimeOut(3600);
const NOT_FINISHED = 0;
function run(withOptions) {
    const UE_OnUpdateInvoicesWaitingForGR = "Lib.AP.Customization.Finalization.OnUpdateInvoicesWaitingForGR";
    const UE_context = {
        script: "finalizationscript",
        context: "begin",
        parameters: [withOptions]
    };
    Sys.Helpers.TryCallFunction(UE_OnUpdateInvoicesWaitingForGR, UE_context);
    if (Lib.AP.UpdateWaitingGR.UpdateInvoicesWaitingForGR(withOptions) === NOT_FINISHED) {
        Process.RecallScript("update_gr_in_progress", true);
    }
    Sys.Helpers.TryCallFunction(UE_OnUpdateInvoicesWaitingForGR, { ...UE_context, context: "end" });
}
run(options);
//# sourceMappingURL=finalizationscript.js.map