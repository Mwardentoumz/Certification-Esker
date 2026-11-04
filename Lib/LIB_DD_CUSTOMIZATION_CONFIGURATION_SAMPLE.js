/* LIB_DEFINITION{
  "name": "LIB_DD_CUSTOMIZATION_CONFIGURATION_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "PS configurations made with wizard customization functions",
  "versionable": false,
  "require": []
}*/

/**
 * Package DD configuration sellection callbacks
 * @namespace Lib.DD.Customization.Configuration
 */

var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Configuration = (function ()
{
	/**
	 * @lends Lib.DD.Customization.Configuration
	 */
	var Configuration =
	{
		/**
		 * @method Lib.DD.Customization.Configuration.GetFormattingTemplate
		 * @since 149
		 * @description
		 * This function will be called at the end of the validation script of the SUPI
		 * when your input file is a XML and you try to generate the corresponding PDF.
		 * It's expected to return a file path corresponding to your formatting template
		 * @param {object} context with the following 2 getters  GetSenderUser() and GetRecipientUser()
		 */
		GetFormattingTemplate: function (context)
		{
			return null;
		},

		/**
		 * @typedef {object} Lib.DD.Customization.Configuration.Page
		 * @property {boolean} enabled - true if page is enabled, false otherwise
		 * @property {string} file - path to the page image (only JPG are supported)
		 * @property {string} options - options for the page image (PDFCommand options)
		 */
		/**
		 * @typedef {object} Lib.DD.Customization.Configuration.FrontPage
		 * @property {string} file - path to the page image (only JPG are supported)
		 * @property {string} options - options for the page image (PDFCommand options)
		 */

		/**
		 * @typedef {object} Lib.DD.Customization.Configuration.Backgrounds
		 * @property {boolean} enabled - true if backgrounds are enabled, false otherwise
		 * @property {Lib.DD.Customization.Configuration.Page} first - first page background settings
		 * @property {Lib.DD.Customization.Configuration.FrontPage} front - front page background settings
		 * @property {Lib.DD.Customization.Configuration.Page} back - back page background settings
		 */

		/**
		 * @method Lib.DD.Customization.Configuration.GetBackgrounds
		 * @since 149
		 * @description
		 * This function will be called when extraction script of the sender copy is finished.
		 * It's expected to return files used to format document and according PDFCommand options to resize or change position of backgrounds images choose in wizard.
		 * @param {Lib.DD.Customization.Configuration.Backgrounds} backgrounds default backgrounds settings to be modified
		 * @example
		 * GetBackgrounds: function (backgrounds)
		 * {
		 * 		backgrounds.enabled = true;
		 * 		backgrounds.first = {
		 * 			enabled: true/false,
		 * 			file: "%Images%\\firstpage.jpg",
		 * 			options: "-jpegres"
		 * 		};
		 * }
		 */
		GetBackgrounds: function (backgrounds)
		{
		},
		/**
		 * @typedef {object} Lib.DD.Customization.Configuration.TermsAndConditions
		 * @property {boolean} enabled - true if terms and conditions are enabled, false otherwise
		 * @property {string} file - path to the terms and conditions document (only PDF are supported)
		 * @property {"FIRST"|"LAST"|"EACH"} position - position of the terms and conditions document in the wizard (FIRST, LAST, EACH)
		 */
		/**
		 * @method Lib.DD.Customization.Configuration.GetTermsAndConditions
		 * @since 149
		 * @description
		 * This function will be called when extraction script of the sender copy is finished.
		 * It's expected to return recipient terms and conditions document and/or change position of terms and conditions file choose in wizard.
		 * @param {Lib.DD.Customization.Configuration.TermsAndConditions} terms default terms and conditions settings to be modified
		 * @example
		 * <caption>set the terms and condition template depending on the current date</caption>
		 * 	GetTermsAndConditions: function (terms)
		 * 	{
		 * 		var currentYear = new Date().getFullYear().toString();
		 * 		terms.file = "%Misc%\\terms_" + currentYear + ".pdf";
		 * 		terms.position = "FIRST";
		 * 	}
		 */
		GetTermsAndConditions: function (terms)
		{
		},

		/**
		 * @method Lib.DD.Customization.Configuration.CustomizeConfiguration
		 * @since 205
		 * @description
		 * This function is called the first time a parameter is queried, in order to know which configuration should be addressed
		 * @return {string} the name of the configuration to use
		 * @example
		 *	CustomizeConfiguration: function () {
		 *		return "My configuration";
		 * }
		 */
		/*CustomizeConfiguration: function ()
		{
			return null;
		},*/

		/**
		 * @method Lib.DD.Customization.Configuration.ApplyLastResortConfiguration
		 * @since 361
		 * @description
		 * Last-resort configuration selection user exit.
		 * It is called only when NO configuration with applicability criteria matched the current document
		 * immediately before the standard <code>ApplyDefaultConfiguration</code> logic is run.
		 * Because it runs after the standard matching, it can never override a configuration that already
		 * matched its applicability criteria: use it to define a catch-all configuration for documents that
		 * would otherwise not be processed by any configuration (typical SDA fallback scenario).
		 *
		 * @returns {object|undefined} The configuration to apply as last resort to override the default behavior, or return
		 * nothing (undefined/null) to keep the standard <code>ApplyDefaultConfiguration</code> behavior.
		 * @example
		 * <caption>Apply a fallback configuration that carries no specific parameters (global settings only).</caption>
		 * ApplyLastResortConfiguration: function ()
		 * {
		 * 	return new Sys.DD.UserConfiguration({});
		 * }
		 * @example
		 * <caption>Apply an existing configuration named "CatchAll" as the last-resort configuration.</caption>
		 * ApplyLastResortConfiguration: function ()
		 * {
		 * 	var configs = Sys.Helpers.Database.LoadTableToJSON(
		 * 		Sys.DD.settingTableName,
		 * 		"(ConfigurationName__=CatchAll)",
		 * 		"",
		 * 		null,
		 * 		Sys.DD.configurationLoadingQueryOptions
		 * 	);
		 * 	if (configs && configs.length > 0)
		 * 	{
		 * 		return new Sys.DD.UserConfiguration(configs[0]);
		 * 	}
		 * 	// Not found: keep the standard behavior
		 * 	return undefined;
		 * }
		 */
		ApplyLastResortConfiguration: function ()
		{
			return undefined;
		},

		/**
		 * @method Lib.DD.Customization.Configuration.OverrideGetParameter
		 * @since 305
		 * @description
		 * Allows you to override every parameter value that should be returned by Sys.DD.GetParameter().
		 * WARNING: beware of implementing processing with high cost in that user exit because it's called
		 * a lot of time. For instance, DO NOT perform a query in that user exit without caching the result.
		 * @param {string} configurationName The detected configuration name
		 * @param {object} configurationParameters Set of all configuration parameters and values
		 * @param {string} parameterName The parameter asked in GetParameter call IN LOWER CASE
		 * @param {any} currentValue The current value that should be returned if the user exit was commented
		 * @returns The value to keep for the asked parameter
		 *
		 * @example
		 * <caption>In the following example, if the configuration name is "Order" then we will set next process owner to a specific group.</caption>
		 * OverrideGetParameter: function (configurationName, configurationParameters, parameterName, currentValue)
		 * {
		 * 		if(configurationName === "Order" && parameterName === "nextprocessowner__")
		 *		{
		 *			return "csrgroup..su@1010012";
		 *		}
		 *
		 * 		// Always return the currentValue if not modified
		 *		return currentValue;
		 * }
		 */
		/*OverrideGetParameter: function (configurationName, configurationParameters, parameterName, currentValue)
		{
			// Always return the currentValue if not modified
			return currentValue;
		},*/

		/**
		 * @typedef {object} Lib.DD.Customization.Configuration.ConversationSettings
		 * @property {string} relatedFormName - name of the form to be used for the conversation. Default is "CDNAME#Customer Order Processing"
		 * @property {string} relatedFormIdentifierName - name of the identifier field of the form to be used for the conversation. Default is "Sales_Order_Number__"
		 * @property {string} conversationTableName - name of the table to be used for the conversation. Default is "ConversationCOP__"
		 * @property {string} emailTemplateName - name of the email template to be used for the conversation. Default is "Notify_Order_Conversation_NewMessage.htm"
		 */

		/**
		 * @method Lib.DD.Customization.Configuration.ModifyConversationSettings
		 * @since 201
		 * @description
		 * This function is called to modify the conversation settings of the current configuration.
		 * @param {Lib.DD.Customization.Configuration.ConversationSettings} settings conversation settings (member 'conversations' of the additional settings object )
		 * @example
		 *	ModifyConversationSettings: function (settings) {
		 *		settings.emailTemplateName = "MyEmailTemplate.htm"
		 * }
		 */
		ModifyConversationSettings: function (settings)
		{
		}
	};
	return Configuration;
})();
