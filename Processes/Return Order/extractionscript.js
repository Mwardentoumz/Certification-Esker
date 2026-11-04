"use strict";
var extractionscript;
(function (extractionscript) {
    async function Run() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- RO Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice() + "'");
        await Sys.Helpers.TryCallFunction("Lib.RO.Customization.Server.OnExtractionScriptStart");
        const orderNumber = Variable.GetValueAsString("OrderNumber__");
        Data.SetValue("OrderNumber__", orderNumber);
        const vendorAddress = Variable.GetValueAsString("VendorAddress__");
        Data.SetValue("VendorReturnAddress__", vendorAddress);
        const vendorEmail = Variable.GetValueAsString("VendorEmail__");
        Data.SetValue("VendorEmail__", vendorEmail);
        const vendorName = Variable.GetValueAsString("VendorName__");
        Data.SetValue("VendorName__", vendorName);
        const vendorNumber = Variable.GetValueAsString("VendorNumber__");
        Data.SetValue("VendorNumber__", vendorNumber);
        const companyCode = Variable.GetValueAsString("CompanyCode__");
        Data.SetValue("CompanyCode__", companyCode);
        const status = "_StatusDraft";
        Data.SetValue("Status__", status);
        Lib.Purchasing.ReturnManagement.FillFormFromGrItems(orderNumber);
        const user = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerId"));
        Data.SetValue("RequesterName__", user.GetValue("DisplayName"));
        // this code must be done once the configuration is loaded
        Lib.P2P.InitValidityDateTime("PAC");
        Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
        await Sys.Helpers.TryCallFunction("Lib.RO.Customization.Server.OnExtractionScriptEnd");
    }
    extractionscript.Run = Run;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Run();
    }
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map