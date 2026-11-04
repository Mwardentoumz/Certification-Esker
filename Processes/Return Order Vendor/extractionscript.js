"use strict";
var extractionscript;
(function (extractionscript) {
    function FillFromTechnicalData() {
        Log.Info("FillFromTechnicalData");
        Lib.Purchasing.ReturnManagement.FillFromTechnicalData();
    }
    function Run() {
        FillFromTechnicalData();
        Log.Info("ExtractionScript");
        Lib.Purchasing.ReturnManagement.SendNotifForROCreation();
        Lib.P2P.InitValidityDateTime("PAC");
        Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationPortalInMonths");
        Data.SetValue("State", 100);
    }
    extractionscript.Run = Run;
    Run();
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map