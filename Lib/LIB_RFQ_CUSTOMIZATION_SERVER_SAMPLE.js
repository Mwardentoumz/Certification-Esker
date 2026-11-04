"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_RFQ_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Request For Quote scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * @namespace Lib.RFQ.Customization.Server
 * @description Package Request For Quote server script customization callbacks
 */
var Lib;
(function (Lib) {
    var RFQ;
    (function (RFQ) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.RFQ.Customization.Server.GetNumber
                 * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script of the Purchase Requisition, Purchase Order or Goods Receipt process, depending on the library in which it is located.
                 * @since 110
                 * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
                 * @returns {string} String value containing the next number from your customized sequence.
                 * @example
                 * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
                 * <pre><code>
                 * 	Server.GetNumber = function (defaultSequenceName)
                 * 	{
                 * 		var number = "";
                 * 		var ReqNumberSequence = Process.GetSequence(defaultSequenceName);
                 * 		number = ReqNumberSequence.GetNextValue();
                 * 		if (number === "")
                 * 		{
                 * 			Log.Info("Error while retrieving a number");
                 * 		}
                 * 		else
                 * 		{
                 * 			Log.Info("Number:" + number);
                 * 		}
                 * 		return number;
                 *	};
                 * </code></pre>
                 *
                 */
                Server.GetNumber = function (defaultSequenceName) {
                    return "";
                };
                /**
                 * @method Lib.RFQ.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to perform operations after the Purchase Requisition process validation.
                 * 		This user exit is called at the end of the validation script of the Purchase Requisition process.
                 * @since 149
                 * @param {string} currentAction value specifying the type of action that triggered the execution of the script.
                 * 		This value is retrieved using the Processing scripts API: Data.GetActionType function.
                 * @param {string} currentName value specifying the name of the action that triggered the execution of the script.
                 * 		This value is retrieved using the Processing scripts API: Data.GetActionName function.
                 * @param {boolean} isRecallScriptScheduled value indicating if the user exit is expected to be called again in the current workflow step.
                 * 		The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step.
                 * 		This parameter is set to false after the last execution of the RecallScript function.
                 * @example In the following example, a user is allow to read the Purchase Order.
                 * <pre><code>
                 *	OnValidationScriptEnd: function (currentAction, currentName, isRecallScriptScheduled)
                 *	{
                 *	 	Process.AddRight("john.more@example.com", "read")
                 *	}
                 * </code></pre>
                 */
                Server.OnValidationScriptEnd = function (currentAction, currentName, isRecallScriptScheduled) {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = RFQ.Customization || (RFQ.Customization = {}));
    })(RFQ = Lib.RFQ || (Lib.RFQ = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_RFQ_CUSTOMIZATION_SERVER_SAMPLE.js.map