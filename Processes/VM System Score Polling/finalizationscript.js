"use strict";
//Required: Sys/Sys_Helpers_TimeoutHelper, Lib_VM_ScoringProviders_Server
function runFinalization() {
    var _a;
    const showAlertsVendorCache = {};
    const nbAttach = Attach.GetNbAttach();
    if (nbAttach === 0) {
        return;
    }
    const file = Attach.GetInputFile(nbAttach - 1);
    let scores = null;
    try {
        scores = JSON.parse(file.GetContent());
    }
    catch (_b) {
        Log.Error("Failed to parse JSON file");
    }
    if (scores) {
        const timeoutHelper = new Sys.Helpers.TimeoutHelper();
        for (const scoreType in scores) {
            if (Object.prototype.hasOwnProperty.call(scores, scoreType)) {
                for (const score of scores[scoreType]) {
                    const scoreUpdated = Lib.VM.ScoringProviders.Server.Providers.Store(scoreType, score);
                    if (scoreUpdated && scoreUpdated.setShowAlerts) {
                        showAlertsVendorCache[scoreUpdated.identifier] =
                            showAlertsVendorCache[scoreUpdated.identifier] || ((_a = scoreUpdated === null || scoreUpdated === void 0 ? void 0 : scoreUpdated.alerts) === null || _a === void 0 ? void 0 : _a.indicator) === "warning";
                    }
                    timeoutHelper.NotifyIteration();
                }
            }
        }
        const providerName = Lib.VM.ScoringProviders.Server.GetScoringProviderFromParameters();
        Log.Info(`Provider name: ${providerName}`);
        const providerInstance = Lib.VM.ScoringProviders.Server.Manager.GetProviderOrDefault(providerName);
        for (const identifier in showAlertsVendorCache) {
            if (Object.prototype.hasOwnProperty.call(showAlertsVendorCache, identifier)) {
                providerInstance.UpdateVendorShowAlerts(identifier, showAlertsVendorCache[identifier]);
                timeoutHelper.NotifyIteration();
            }
        }
    }
    UpdateVendorInternalScoring();
}
function UpdateVendorInternalScoring() {
    if (Variable.GetValueAsString("InternalScoreNeedUpdate") === "true") {
        const vendors = Attach.GetContent(0);
        const vendorsListFile = TemporaryFile.CreateFile("json", "utf8");
        TemporaryFile.Append(vendorsListFile, vendors);
        const VendorScoringDetails = Process.CreateProcessInstanceAsProcessAdmin("Vendor Scoring Details", true, false);
        const attach = VendorScoringDetails.AddAttachEx(vendorsListFile);
        const vars = attach.GetVars();
        vars.AddValue_String("AttachOutputName", "VendorsToUpdate", true);
        vars.AddValue_Long("AttachAsConverted", 1, true);
        vars.AddValue_Long("IsTechnical", 1, true);
        VendorScoringDetails.Process();
        const ret = VendorScoringDetails.GetLastError();
        if (ret === 0) {
            Log.Info("VendorScoringDetails process call OK");
        }
        else {
            Log.Error("VendorScoringDetails process call returns with error message : " + VendorScoringDetails.GetLastErrorMessage());
        }
    }
    else {
        Log.Info("No vendor requiring score re-computation");
    }
}
runFinalization();
//# sourceMappingURL=finalizationscript.js.map