"use strict";
function handleComputeTimeout() {
    if (Data.GetValue("AccrualReportStatus__") === "InProgress" && Data.GetValue("State") === 200) {
        Data.SetValue("AccrualReportStatus__", "ComputeTimeout");
    }
}
function runPostProcessing() {
    handleComputeTimeout();
}
runPostProcessing();
//# sourceMappingURL=postprocessingscript.js.map