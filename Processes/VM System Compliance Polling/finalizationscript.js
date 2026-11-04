"use strict";
//Required: Sys/Sys_Helpers_TimeoutHelper, Sys/Sys_GenericAPI_Server, Sys/Sys_Helpers_LdapUtil
function RunFinalization() {
    const nbAttach = Attach.GetNbAttach();
    if (nbAttach < 2) {
        return;
    }
    const file = Attach.GetInputFile(nbAttach - 1);
    let thirdPartyDetails = JSON.parse(file.GetContent());
    const timeoutHelper = Sys.Helpers.TimeoutHelper.GetTimeoutHelper();
    for (const thirdPartyDetail of thirdPartyDetails) {
        if (!Lib.VM.ComplianceRisk.Server.ComplianceRiskStorage.Store(thirdPartyDetail)) {
            return;
        }
        timeoutHelper.NotifyIteration();
    }
    Log.Info(`Number of third parties updated: ${thirdPartyDetails.length}`);
}
RunFinalization();
//# sourceMappingURL=finalizationscript.js.map