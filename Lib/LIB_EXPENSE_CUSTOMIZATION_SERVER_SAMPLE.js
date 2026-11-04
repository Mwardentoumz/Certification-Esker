"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Expense scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Expense Server script customization callbacks
 * @namespace Lib.Expense.Customization.Server
 */
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.Expense.Customization.Server.OnUnknownAction
                 * @description
                 * This function is called when the validation script executes an unknown action.
                 * User can simply add any custom action treatment here.
                 * @param {string} currentAction name of the executed action
                 * @param {string} currentName sub-name of the executed action
                 * @returns {boolean} returns true if this action has been treated otherwise false.
                 * @example
                 * <pre><code>
                 * OnUnknownAction: function (currentAction, currentName)
                 * {
                 * 	Log.Error(currentAction + "-" + currentName);
                 * }
                 * </code></pre>
                 */
                Server.OnUnknownAction = function (currentAction, currentName) {
                    return false;
                };
                /**
                 * @method Lib.Expense.Customization.Server.OnExtractionScriptEnd
                 * @description
                 * Allows you to customize the value of the fields available in the Expense process.
                 * This function will be called at the end of Expense extraction script.
                 * @example
                 * <pre><code>
                 * OnExtractionScriptEnd: function ()
                 * {
                 * 	Log.Error(currentAction + "-" + currentName);
                 * }
                 * </code></pre>
                 */
                Server.OnExtractionScriptEnd = function () {
                };
                /**
                 * @method Lib.Expense.Customization.Server.GetNumber
                 * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script.
                 * @since 164
                 * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
                 * @param {string} prefix prefix added by default
                 * @returns {string} String value containing the next number from your customized sequence.
                 * @example
                 * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
                 * <pre><code>
                 *	Server.GetNumber = function (defaultSequenceName, prefix)
                 *	{
                 *		var number = "";
                 *		var companyCode = Data.GetValue("CompanyCode__");
                 *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName);
                 *		number = ReqNumberSequence.GetNextValue();
                 *		if (number === "")
                 *		{
                 *			Log.Info("Error while retrieving a number");
                 *		}
                 *		else
                 *		{
                 *			number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
                 *			Log.Info("Number: " + number);
                 *		}
                 *		return number;
                 *	};
                 * </code></pre>
                 */
                /*
                export const GetNumber = function (defaultSequenceName: string, prefix: string): string
                {
                    // Must return something
                };
                */
                /**
                 * @method Lib.Expense.Customization.Server.OnSendEmailNotification
                 * @description
                 * Allows you to modify the email notifications in the Expense process.
                 * This user exit is called before sending the notification.
                 * You can choose to not send the notification by returning false for some notification.
                 * @param { Sys.EmailNotification.SendEmailNotificationWithUserIdOptions } emailOptions
                 * @returns { boolean } false to indicate that the notification should not be sent or true to indicate that the notification should be sent.
                 * This user exit sets the sender name.
                 * @example
                 * <pre><code>
                 * OnSendEmailNotification: function (emailOptions)
                 * {
                 *	 emailOptions.fromName = "Expense Management Notifier";
                 *	 return true;
                 * }
                 * </code></pre>
                 */
                Server.OnSendEmailNotification = function (emailOptions) {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = Expense.Customization || (Expense.Customization = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_CUSTOMIZATION_SERVER_SAMPLE.js.map