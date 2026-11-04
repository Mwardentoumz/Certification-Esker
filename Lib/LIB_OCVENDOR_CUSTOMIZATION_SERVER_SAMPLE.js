"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_OCVENDOR_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending order confirmation vendor scripts on server side",
  "versionable": false,
  "require": []
}*/
/**
 * Package Order Confirmation Vendor Server script customization callbacks
 * @namespace Lib.OCVendor.Customization.Server
 */
var Lib;
(function (Lib) {
    var OCVendor;
    (function (OCVendor) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.OCVendor.Customization.Server.OnUnknownAction
                 * @description Allows you to customize how the action is processed when the validation script executes an unknown action.
                 * 		This user exit is called when the validation script of the Order Confirmation Vendor process is triggered by an unknown action.
                 * @since 328
                 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                 * @return {boolean} Boolean value indicating whether the action has been handled. Possible values are:
                 * 		true: The action has been handled.
                 * 		false: The action has not been handled.
                 * @example This user exit logs the unknown actions details.
                 *	OnUnknownAction: function (currentAction, currentName)
                 *	{
                 *		Log.Error(currentAction + "-" + currentName);
                 *	}
                 */
                Server.OnUnknownAction = function (currentAction, currentName) {
                    return false;
                };
                /**
                 * @method Lib.OCVendor.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to perform operations after the Order Confirmation Vendor process validation. This user exit is called at the end of the validation script of the Order Confirmation Vendor process.
                 * @since 328
                 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                 * @param {boolean} isRecallScriptScheduled Boolean value indicating if the user exit is expected to be called again in the current workflow step. The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step. This parameter is set to false after the last execution of the RecallScript function.
                 * 		Possible values are:
                 * 			true: The user exit is expected to be called again in the current workflow step.
                 * 			false: The user exit is not expected to be called again in the current workflow step.
                 */
                Server.OnValidationScriptEnd = function (currentAction, currentName, isRecallScriptScheduled) {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = OCVendor.Customization || (OCVendor.Customization = {}));
    })(OCVendor = Lib.OCVendor || (Lib.OCVendor = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_OCVENDOR_CUSTOMIZATION_SERVER_SAMPLE.js.map