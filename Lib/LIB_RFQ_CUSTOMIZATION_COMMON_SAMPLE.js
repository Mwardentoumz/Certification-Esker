"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_RFQ_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Request For Quote scripts on common side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * @namespace Lib.RFQ.Customization.Common
 * @description Package Request For Quote Common script customization callbacks
 */
var Lib;
(function (Lib) {
    var RFQ;
    (function (RFQ) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.RFQ.Customization.Common.OverrideRFQSubmitWithPendingVendorRegistration
                 * @description Allows you to override the default behavior defined by the S2P - Application setting "Enable submitting quote request with pending vendor registration".
                 * If the S2P - Global application setting "Supplier Management" is disabled, you won't be able to onboard new suppliers anyway.
                 * @since 340
                 * @returns {boolean} True to enable submission with vendor registrations, false to disable it.
                 * @example
                 * Example:
                 * 	Common.OverrideRFQSubmitWithPendingVendorRegistration = function () {
                 * 		let override = false;
                 * 		// Your custom logic
                 * 		return override;
                 *	};
                 */
                Common.OverrideRFQSubmitWithPendingVendorRegistration = function () {
                    return null;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = RFQ.Customization || (RFQ.Customization = {}));
    })(RFQ = Lib.RFQ || (Lib.RFQ = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_RFQ_CUSTOMIZATION_COMMON_SAMPLE.js.map