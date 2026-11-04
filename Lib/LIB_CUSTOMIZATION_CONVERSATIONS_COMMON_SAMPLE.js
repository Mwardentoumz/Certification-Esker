/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_CONVERSATIONS_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Common customization for external conversations (conversations with the customer)",
  "require": [],
  "versionable": false
}*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Customization = Lib.Customization || {};
Lib.Customization.Conversations = Lib.Customization.Conversations || {};

/**
 * @namespace Lib.Customization.Conversations.Common
*/
Lib.Customization.Conversations.Common = (function ()
{
	/**
	 * @lends Lib.Customization.Conversations.Common
	 */
	var customization = {
		/**
		 * @namespace
		 */
		/**
		 * @method Lib.Customization.Conversations.Common.ChangeReplyToEmailAddress
		 * @description This function will be called when sending an message in an external conversation (conversations with the customer).
		 * It allows you to change the email address that will be used when the customer tries to reply to the conversation from his emails.
		 * The "Reply to" will be the email address returned by this function instead of the technical Esker one.
		 * BE CAREFUL: if you use this user exit, you will have to add a routing between the new email address and the default Esker one, either a redirection or alias. Forwading the email will not work.
		 * @returns {string} The wanted "Reply to" email address
		 *
		 * @example
		 * function ChangeReplyToEmailAddress()
		 * {
		 *		return "myEmailAddress@email.com";
		 * }
		 **/
		ChangeReplyToEmailAddress: function ()
		{
			return "";
		},
		/**
		 * @method Lib.Customization.Conversations.Common.ModifyConversationPopupUsersFilter
		 * @description Use this user exit to modify the default filter to retrieve users from ODUSER table. It is used in the conversation popup to retrieve the email addresses selectable for autocompletion
		 * @param {Sys.Helpers.LdapUtil.IFilter} filter
		 * @returns {Sys.Helpers.LdapUtil.IFilter} Ldap filter
		 * @example
		 * function ChangeReplyToEmailAddress()
		 * {
		 *		return "myEmailAddress@email.com";
		 * }
		 **/
		ModifyConversationPopupUsersFilter: function (filter)
		{
			return filter;
		},
		/**
		 * @method Lib.Customization.Conversations.Common.ModifyDefaultToEmailAddressList
		 * @description Use this user exit to modify the default email addresses displayed in the "To" field in the conversation popup.
		 * @since 332
		 * @param {string[]} emailAddressList default email addresses
		 * @returns {string[]} The modified list of email addresses
		 * @example <caption>Remove the sender email address from the conversation popup:</caption>
		 * ModifyDefaultToEmailAddressList: function (emailAddressList)
		 * {
		 * 	emailAddressList = emailAddressList.filter(function (emailAddress)
		 * 	{
		 * 		return emailAddress !== Sys.Helpers.Email.GetEmailDataFromIsm().SenderEmail;
		 * 	});
		 * 	return emailAddressList;
		 * }
		 **/
		ModifyDefaultToEmailAddressList: function (emailAddressList)
		{
			return emailAddressList;
		},
		/**
		 * @method Lib.Customization.Conversations.Common.ModifyDefaultCCEmailAddressList
		 * @description Use this user exit to modify the default email addresses displayed in the "CC" field in the conversation popup.
		 * @since 332
		 * @param {string[]} emailAddressList default email addresses
		 * @returns {string[]} The modified list of email addresses
		 * @example <caption>Remove the sender email address from the conversation popup:</caption>
		 * ModifyDefaultCCEmailAddressList: function (emailAddressList)
		 * {
		 * 	emailAddressList = emailAddressList.filter(function (emailAddress)
		 * 	{
		 * 		return emailAddress !== Sys.Helpers.Email.GetEmailDataFromIsm().SenderEmail;
		 * 	});
		 * 	return emailAddressList;
		 * }

		 **/
		ModifyDefaultCCEmailAddressList: function (emailAddressList)
		{
			return emailAddressList;
		},

		/**
		 * Get the list of processes to call after inbound email processing
		 * @param {*} defaultProcessList 
		 * @returns a string containing the list of processes to call separated by comma
		 */

		GetProcessListToCallAfterInboundEmailProcessing: function (defaultProcessList)
		{
			return defaultProcessList;
		}
	};

	return customization;
})();
