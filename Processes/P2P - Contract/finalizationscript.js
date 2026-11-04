"use strict";
var FinalizationScript;
(function (FinalizationScript) {
    function IsInDemoAccount() {
        return Variable.GetValueAsString("InDemoAccount") === "1";
    }
    function SetArchiveDuration() {
        // Ignore the archive duration set by the user when we are in a demo account
        // 0 is equivalent to a free 2 months archiving
        let archiveDuration = 0;
        if (IsInDemoAccount()) {
            Log.Warn("The archiving has been disabled on your demo account.");
        }
        else {
            archiveDuration = parseInt(Data.GetValue("ArchiveDurationInMonths__"), 10);
            Log.Info(`Setting the archive expiration date to ${archiveDuration} months after the expiration date.`);
            const expirationDate = new Date(Data.GetValue("EndDate__"));
            expirationDate.setMonth(expirationDate.getMonth() + archiveDuration);
            Log.Info("Setting the archive expiration date to " + expirationDate.toDateString());
            Process.SetArchiveExpiration(expirationDate);
        }
        Data.SetValue("ArchiveDuration", archiveDuration);
    }
    function Main() {
        SetArchiveDuration();
    }
    FinalizationScript.Main = Main;
    Main();
})(FinalizationScript || (FinalizationScript = {}));
//# sourceMappingURL=finalizationscript.js.map