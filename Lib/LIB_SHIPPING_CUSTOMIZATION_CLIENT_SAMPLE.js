"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Shipping Management / Advanced Shipping Notice customization callbacks
 * @namespace Lib.Shipping.Customization.Client
 */
/* LIB_DEFINITION{
  "name": "LIB_SHIPPING_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
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
            var Client;
            (function (Client) {
                /**
                 * @method Lib.Shipping.Customization.Client.CustomizeLayout
                 * @description Allows you to customize the Advanced Shipping Notice process form. This user exit is called from the HTML page script of the Advanced Shipping Notice process, after loading the form and initializing the workflow.
                 * 		This user exit is typically used to customize:
                 * 			Objects from the included script libraries.
                 * 			Objects from the HTML page script.
                 * 			Form controls and their visibility, read-only state, or requirements.
                 * @since 343
                 * @returns {Promise<void>}
                 * @example
                 * The following user exit hides the TrackingNumber__ field and makes ShippingNote__ mandatory.
                 * <pre><code>
                 * export const CustomizeLayout = async function (): Promise<void>
                 * {
                 * 	Controls.ShippingNote__.SetRequired(true);
                 *
                 * 	// Hide item notes column in line items table
                 * 	Controls.LineItems__.ItemNote__.Hide(true);
                 * }
                 * </code></pre>
                 */
                Client.CustomizeLayout = async function () {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = Shipping.Customization || (Shipping.Customization = {}));
    })(Shipping = Lib.Shipping || (Lib.Shipping = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_SHIPPING_CUSTOMIZATION_CLIENT_SAMPLE.js.map