"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_PAYMENTRUN_VALIDATION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "AP payment run validation script customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * AP payment run validation script customization callbacks.
 * @namespace Lib.AP.Customization.PaymentRun.Validation
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var PaymentRun;
            (function (PaymentRun) {
                var Validation;
                (function (Validation) {
                    /**
                     * @method Lib.AP.Customization.PaymentRun.Validation.OnValidationScriptEnd
                     * @since 349
                     * @description
                     * This user exit is called at the end of the payment run validation script, after all workflow actions have been executed.
                     * Allows you to perform custom actions after the payment proposal has been approved or any other validation action has been completed.
                     * This can be used to update custom fields in the payment proposal form or trigger additional business logic.
                     * @example
                     * Validation.OnValidationScriptEnd = function ()
                     * {
                     *     // Example: Update a custom field after approval
                     *     const status = Data.GetValue("Status__");
                     *     if (status === Lib.AP.PaymentRunStatus.ApprovedToPay || status === Lib.AP.PaymentRunStatus.Approved)
                     *     {
                     *         Data.SetValue("Z_CustomApprovalDate__", new Date());
                     *         Data.SetValue("Z_CustomApprover__", Variable.GetValueAsString("CurrentContributorName"));
                     *     }
                     * }
                     */
                    Validation.OnValidationScriptEnd = function () {
                    };
                })(Validation = PaymentRun.Validation || (PaymentRun.Validation = {}));
            })(PaymentRun = Customization.PaymentRun || (Customization.PaymentRun = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_PAYMENTRUN_VALIDATION_SAMPLE.js.map