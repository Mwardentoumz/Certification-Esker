"use strict";
Lib.P2P.Address.SetFormattedAddressControl(Controls.DeliveryAddress__);
function ComputeDeliveryAddress() {
    var options = {
        "isVariablesAddress": true,
        "address": {
            "ToName": "ToRemove",
            "ToSub": Controls.ShipToSub__.GetValue(),
            "ToMail": Controls.ShipToStreet__.GetValue(),
            "ToPostal": Controls.ShipToZipCode__.GetValue(),
            "ToCountryCode": Controls.ShipToCountry__.GetValue(),
            "ToState": Controls.ShipToRegion__.GetValue(),
            "ToCity": Controls.ShipToCity__.GetValue(),
            "ForceCountry": true
        },
        "countryCode": Controls.ShipToCountry__.GetValue()
    };
    Lib.P2P.Address.ComputeFormattedAddressWithOptions(options);
}
Controls.ShipToStreet__.OnChange = ComputeDeliveryAddress;
Controls.ShipToZipCode__.OnChange = ComputeDeliveryAddress;
Controls.ShipToCountry__.OnChange = ComputeDeliveryAddress;
Controls.ShipToRegion__.OnChange = ComputeDeliveryAddress;
Controls.ShipToCity__.OnChange = ComputeDeliveryAddress;
Controls.ShipToSub__.OnChange = ComputeDeliveryAddress;
ComputeDeliveryAddress();
Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
//# sourceMappingURL=customscript.js.map