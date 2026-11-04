"use strict";
// Load Parameter in extractionScript to avoid access issue from HTML customerScript.
Lib.P2P.CompanyCodesValue
    .QueryValues(Data.GetValue("CompanyCode__"))
    .Then(function (CCValues) {
    if (Object.keys(CCValues).length > 0) {
        Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
    }
    else {
        Log.Error("The requested company code is not in the company code table.");
    }
})
    .Then(() => {
    // Must be done when the configuration is loaded
    Lib.P2P.InitValidityDateTime("PAC");
    Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationPortalInMonths");
});
Lib.Purchasing.POItems.CheckContainsTypeItem(Data.GetValue("OrderNumber__"))
    .Then(function (result) {
    Variable.SetValueAsString("containsQuantityBasedItem", result.containsQuantityBasedItem ? "1" : "0");
    Variable.SetValueAsString("containsAmountBasedItem", result.containsAmountBasedItem ? "1" : "0");
    Variable.SetValueAsString("containsServiceBasedItem", result.containsServiceBasedItem ? "1" : "0");
})
    .Catch(function (rejectMsg) {
    Log.Error(rejectMsg);
    Variable.SetValueAsString("containsQuantityBasedItem", "0");
    Variable.SetValueAsString("containsAmountBasedItem", "0");
    Variable.SetValueAsString("containsServiceBasedItem", "0");
});
Lib.Purchasing.POItems.CheckIfOrderIsMultiShipTo(Data.GetValue("OrderNumber__"))
    .Then(function (result) {
    Variable.SetValueAsString("orderIsMultiShipTo", result ? "1" : "0");
})
    .Catch(function (rejectMsg) {
    Log.Error(rejectMsg);
    Variable.SetValueAsString("orderIsMultiShipTo", "0");
});
if (Variable.GetValueAsString("SendNotification") === "1") {
    Lib.Purchasing.VendorNotifications.SendNotifForCOCreation();
}
// assign Business partner ID for multi vendor portal
const currentVendor = Users.GetUser(Data.GetValue("OwnerId"));
if (currentVendor && currentVendor.GetValue("Vendor") === "1") {
    const businessPartnerID = currentVendor.GetValue("BusinessPartnerID");
    Data.SetValue("BusinessPartnerID__", businessPartnerID);
}
//# sourceMappingURL=extractionscript.js.map