"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Package Expense Report Common script customization callbacks
 * @namespace Lib.Shipping.Customization.Common
 */
/* LIB_DEFINITION{
  "name": "LIB_SHIPPING_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "",
  "versionable": false,
  "require": []
}*/
var Lib;
(function (Lib) {
    var Shipping;
    (function (Shipping) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                * @method Lib.Shipping.Customization.Common.UpdateCarriers
                * @description Allows you to update the list of available carriers in the ASN process. You can modify or delete existing carriers as well as adding new carriers.
                * This user exit is called at the carriers loading step in Lib_Shipping.
                * @param {Record<string,Carrier>} defaultCarriers The list of carriers provided by default
                * @returns {Record<string,Carrier>} A record with name as key and link as a property. Link properties use \<parcelNumber\> as a placeholder for the tracking number of the parcel. The actual tracking number will be substituted for the placeholder in the Lib.Shipping.Carrier.GetLink method.
                * @example
                * <pre><code>
                * UpdateCarriers: function (defaultCarriers)
                * {
                *	var carriers = defaultCarriers;
                *
                *	carriers["GLS"] = {link : "https://gls-group.eu/FR/fr/suivi-colis.html?match=<parcelNumber>"};
                *
                *	return carriers;
                * },
                * </code></pre>
                */
                Common.UpdateCarriers = function (defaultCarriers) {
                    return defaultCarriers;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = Shipping.Customization || (Shipping.Customization = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_SHIPPING_CUSTOMIZATION_COMMON_SAMPLE.js.map