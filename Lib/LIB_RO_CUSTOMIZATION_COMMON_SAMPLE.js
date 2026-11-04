"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_RO_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Return Order scripts on common side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Return Order common script customization callbacks
 * @namespace Lib.RO.Customization.Common
 */
var Lib;
(function (Lib) {
    var RO;
    (function (RO) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.RO.Customization.Common.OnValidateForm
                 * @since 360
                 * @description
                 * Allows you to customize the validation logic for the Return Order process.
                 * This user exit is called at the start of the validation script of the process and when clicking the Submit button.
                 * Use this function to add additional validation rules, check business conditions, or override the default validation behavior.
                 * @param {boolean} isFormValid The current validation status of the form based on standard validation rules.
                 * @returns {boolean|Promise<boolean>} The updated validation status: true if the form should be considered valid, false to prevent validation, or a Promise resolving to the validation status for async operations.
                 * @example
                 * Common.OnValidateForm = function(isFormValid)
                 * {
                 *     return isFormValid;
                 * };
                 */
                Common.OnValidateForm = function (isFormValid) {
                    return isFormValid;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = RO.Customization || (RO.Customization = {}));
    })(RO = Lib.RO || (Lib.RO = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_RO_CUSTOMIZATION_COMMON_SAMPLE.js.map