"use strict";
/* LIB_DEFINITION{
  "name": "LIB_BR_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Bulk Receipt scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Bulk Receipt Server script customization callbacks
 * @namespace Lib.BR.Customization.Server
 */
var Lib;
(function (Lib) {
    var BR;
    (function (BR) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.BR.Customization.Server.OnSendEmailNotification
                 * @description Allows you to modify the email notifications. This user exit is called before the notification is sent.
                 * @since 289
                 * @param {Sys.EmailNotification.SendEmailNotificationWithUserIdOptions} emailOptions Notification email options which can be modified
                */
                Server.OnSendEmailNotification = function (emailOptions) {
                    return true;
                };
                /**
                 * @method Lib.BR.Customization.Server.GetNumber
                 * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script of the Bulk Receipt.
                 * @since 291
                 * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
                 * @returns {string} String value containing the next number from your customized sequence.
                 * @example
                 * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
                 * <pre><code>
                 *	Server.GetNumber = function (defaultSequenceName)
                 *	{
                 *		var number = "";
                 *		var companyCode = Data.GetValue("CompanyCode__");
                 *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName + companyCode);
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
                 *
                 */
                /*
                export const GetNumber = function (defaultSequenceName: string): string | void
                {
                    // Must return something
                };
                */
                /**
                 * @method Lib.BR.Customization.Server.GetListOfExtraUsersWithReadRight
                 * @description Allow you to return a list of user to give read right to.
                 * @since 296
                 * @returns {Array<string>} array of login to give read rights to
                 * @example
                 * For exemple, always add read rights to buyer@company.com.
                 * <pre><code>
                 * 	GetListOfExtraUsersWithReadRight: function ()
                 * 	{
                 * 		return ["buyer@company.com"];
                 * 	}
                 * </code></pre>
                 */
                Server.GetListOfExtraUsersWithReadRight = function () {
                    return [];
                };
                /**
                 * @method Lib.BR.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to perform operations after the Bulk Receipt process validation. This user exit is called at the end of the validation script of the Bulk Receipt process.
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
        })(Customization = BR.Customization || (BR.Customization = {}));
    })(BR = Lib.BR || (Lib.BR = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_BR_CUSTOMIZATION_SERVER_SAMPLE.js.map