"use strict";
var CustomScript;
(function (CustomScript) {
    Controls.DataPanel.Hide(true);
    Controls.SystemData.Hide(true);
    ProcessInstance.SetSilentChange(true);
    async function preload() {
        await Lib.Purchasing.LoadParameters();
        await Lib.P2P.UserProperties.QueryValues(User.loginId);
    }
    async function Run() {
        await preload();
        Lib.Purchasing.Sourcing.EventCreationPopup.ShowFromDashboard();
    }
    CustomScript.Run = Run;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Run();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map