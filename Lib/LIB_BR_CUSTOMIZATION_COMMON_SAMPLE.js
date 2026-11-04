"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_BR_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Bulk Receipt scripts on common side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Bulk Receipt common script customization callbacks
 * @namespace Lib.BR.Customization.Common
 */
var Lib;
(function (Lib) {
    var BR;
    (function (BR) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.BR.Customization.Common.OnValidateForm
                 * @since 354
                 * @description
                 * Allows you to customize the validation logic for the Bulk Receipt process.
                 * This user exit is called at the start of the validation script of the process and when clicking the Approve button.
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
        })(Customization = BR.Customization || (BR.Customization = {}));
    })(BR = Lib.BR || (Lib.BR = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_BR_CUSTOMIZATION_COMMON_SAMPLE.js.map