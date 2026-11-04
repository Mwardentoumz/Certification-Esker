"use strict";
async function Run() {
    let currentName = Data.GetActionName();
    let currentAction = Data.GetActionType();
    Log.Info("-- GR canceler validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
    // Configuration (tableParameters) inherited from GR instance
    await Lib.P2P.InitValidityDateTime("PAC");
    await Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
    // First validation
    if (currentName === "" && currentAction === "") {
        if (Data.GetValue("State") == 50) {
            Log.Info("Validation in touchless");
            currentName = "Approve";
            currentAction = "approve";
        }
    }
    if (currentName === "Approve" && currentAction === "approve") {
        const ruidEx = Data.GetValue("GRRuidEx__");
        const comment = Data.GetValue("CancelComment__");
        try {
            await Lib.Purchasing.GRCanceler.Cancel(ruidEx, comment);
            const GRMsnEx = ruidEx.substring(ruidEx.indexOf(".") + 1);
            Lib.Purchasing.GRCanceler.InsertAPPOItemsCanceledGRInDetailedAccrualEventsTable(GRMsnEx);
            Lib.CommonDialog.NextAlert.Define("_GR cancel success", "_GR cancel success message", {
                isError: false,
                behaviorName: "GRCancelSuccess"
            });
        }
        catch (reason) {
            // any error
            if (Sys.Helpers.IsString(reason) || reason instanceof Error) {
                Log.Error(reason.toString());
                Lib.CommonDialog.NextAlert.Define("_GR cancel error", "_GR cancel error message", {
                    isError: true,
                    behaviorName: "GRCancelFailure"
                }, reason.toString());
            }
            // noError reject
            else if (reason instanceof Lib.Purchasing.GRCanceler.NoLongerCancelable) {
                Log.Info(reason.toString());
                Lib.CommonDialog.NextAlert.Define("_GR cancel aborted", "_GR cancel aborted message", {
                    isError: false,
                    behaviorName: "GRCancelAborted"
                }, reason.toString());
            }
        }
    }
}
Lib.P2P.HandleScriptError(Run());
//# sourceMappingURL=validationscript.js.map