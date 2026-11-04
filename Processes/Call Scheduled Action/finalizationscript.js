"use strict";
const options = {
    maxElementsPerRecall: 50,
    maxRetriesPerRecord: 10
};
Process.SetTimeOut(3600);
const NOT_FINISHED = 0;
if (Lib.CallScheduledAction.callActionOnDocumentsFromCSV(options) === NOT_FINISHED) {
    Process.Sleep(10);
    Process.RecallScript("call_scheduled_action_in_progress", true);
}
//# sourceMappingURL=finalizationscript.js.map