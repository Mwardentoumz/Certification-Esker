"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "LIB_VENDORSCORINGDETAILS_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Vendor scoring details validation process",
  "versionable": false,
  "require": []
}*/
/**
 * @namespace Lib.VendorScoringDetails.Customization.Server
 */
var Lib;
(function (Lib) {
    var VendorScoringDetails;
    (function (VendorScoringDetails) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.VendorScoringDetails.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to perform operations after the Vendor Scoring Details process validation. This user exit is called at the end of the validation script of the Vendor Scoring Details process.
                 * @since 350
                 * @example
                 * <pre><code>
                 *	OnValidationScriptEnd: function ()
                 *	{
                 *		Log.Info("ValidationScript called");
                 *	};
                 * </code></pre>
                 */
                Server.OnValidationScriptEnd = function () {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = VendorScoringDetails.Customization || (VendorScoringDetails.Customization = {}));
    })(VendorScoringDetails = Lib.VendorScoringDetails || (Lib.VendorScoringDetails = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VENDORSCORINGDETAILS_CUSTOMIZATION_SERVER_SAMPLE.js.map