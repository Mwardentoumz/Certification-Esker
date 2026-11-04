"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CONTRACT_MANAGEMENT_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Contract Management scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * @namespace Lib.Contract.Management.Customization.Server
 */
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Management;
        (function (Management) {
            var Customization;
            (function (Customization) {
                var Server;
                (function (Server) {
                    /**
                     * @method Lib.Contract.Management.Customization.Server.OnSendEmailNotification
                     * @description Allows you to customize the Contract Management process form.
                     * 		Allows you to choose if you want to send email notification.
                     * @param {Sys.EmailNotification.SendEmailNotificationWithUserIdOptions} options
                     * @return {boolean}
                     * @example
                     *  <pre><code>
                     * OnSendEmailNotification: function (options)
                     * {
                     *      return false; // disable email notification
                     * }
                     * </code></pre>
                     */
                    Server.OnSendEmailNotification = function (options) {
                    };
                    /**
                     * @method Lib.Contract.Management.Customization.Server.AddCustomFieldsOnContractCreation
                     * @description Allows you to add the custom field from a csv file for creating a new contract.
                     * @param {ESKMap<string>} csvFields Object representing the fields of a line of the csv file.
                     * @returns {Promise<ESKMap<string>>} A promise with an object containing custom fields.
                     * @example
                     * This user exit adds the buyer name (custom field Z_Buyer__ in "P2P - Contract") from the field Z_BuyerLogin__ of the csv file.
                     * <pre><code>
                     * export const AddCustomFieldsOnContractCreation = async (csvFields: ESKMap<string>): Promise<ESKMap<string>> =>
                     * {
                     * 		if (!csvFields.Z_BuyerLogin__)
                     * 		{
                     * 			return null; // no custom field to add
                     * 		}
                     *
                     *     	const ret: ESKMap<string> = {};
                     *     	ret.Z_Buyer__ = await Lib.Contract.GetUserName(csvFields.Z_BuyerLogin__);
                     *     	return ret;
                     * }
                     * </code></pre>
                     */
                    Server.AddCustomFieldsOnContractCreation = async (csvFields) => {
                        return null;
                    };
                    /**
                     * @method Lib.Contract.Management.Customization.Server.AddUsersToNotifyOnContractExpiryOrRenewal
                     * @since 338
                     * @description Allows you to add additional users to notify when a contract is expiring or due for renewal.
                     * This function is called during contract notification processing to customize the list of users
                     * who should receive notifications about contract expiry or renewal.
                     * @param {string[]} parsedLine Array representing the fields of a line from the CSV file containing contract data.
                     * 		The array follows the COLUMNS structure defined in the extraction script:
                     * 		[0] MSNEX, [1] NAME__, [2] REFERENCENUMBER__, [3] CONTRACTSTATUS__, [4] EFFECTIVEDATE__,
                     * 		[5] ENDDATE__, [6] TACITRENEWAL__, [7] DONOTNOTIFYONNOTIFICATIONDATEREACHED__,
                     * 		[8] NOTIFICATIONDATE__, [9] INITIALLYEXPECTEDENDDATE__, [10] OWNERID, [11] CREATOROWNERID,
                     * 		[12] ORIGINALOWNERID, [13] CREATEONBEHALF, [14] OWNERLOGIN__, [15] REQUESTERLOGIN__
                     * @param {string[]} usersToNotify Array of user logins to notify. This array can be modified to add or remove users.
                     * @return {void}
                     * @example
                     * This user exit adds the department manager to notifications based on a custom field in the CSV:
                     * <pre><code>
                     * export const AddUsersToNotifyOnContractExpiryOrRenewal = function (parsedLine: string[], usersToNotify: string[]): void
                     * {
                     *     // Add department manager if specified in custom field
                     *     const departmentManagerLogin = parsedLine[16]; // Assuming custom field at index 16
                     *     if (departmentManagerLogin && usersToNotify.indexOf(departmentManagerLogin) === -1)
                     *     {
                     *         usersToNotify.push(departmentManagerLogin);
                     *         Log.Info(`Added department manager ${departmentManagerLogin} to contract notifications`);
                     *     }
                     *
                     *     // Add finance team for high-value contracts
                     *     const contractValue = parseFloat(parsedLine[17]); // Assuming contract value at index 17
                     *     if (contractValue > 100000)
                     *     {
                     *         const financeTeamLogin = "finance.team@company.com";
                     *         if (usersToNotify.indexOf(financeTeamLogin) === -1)
                     *         {
                     *             usersToNotify.push(financeTeamLogin);
                     *             Log.Info(`Added finance team to high-value contract notifications`);
                     *         }
                     *     }
                     * }
                     * </code></pre>
                     */
                    Server.AddUsersToNotifyOnContractExpiryOrRenewal = function (parsedLine, usersToNotify) {
                        // Custom logic to add additional users to notify
                        // The usersToNotify array can be modified directly to add or remove users
                        // parsedLine contains all the CSV fields for the current contract
                    };
                    /**
                     * @method Lib.Contract.Management.Customization.Server.OnValidationScriptEnd
                     * @description Allows you to perform operations after the Contract Management process validation. This user exit is called at the end of the validation script of the Contract Management process.
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
            })(Customization = Management.Customization || (Management.Customization = {}));
        })(Management = Contract.Management || (Contract.Management = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CONTRACT_MANAGEMENT_CUSTOMIZATION_SERVER_SAMPLE.js.map