/* LIB_DEFINITION{
  "name": "LIB_DD_CUSTOMIZATION_VALIDATION_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "additional process validation",
  "versionable": false,
  "require": []
}*/

/**
 * This module contains functions allowing to perform additional process validation
 * @namespace Lib.DD.Customization.Validation
 */

var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Validation = (function ()
{
	/**
	 * @lends Lib.DD.Customization.Validation
	 */
	var validation =
	{
		/**
		 * Function called by the SenderForm process at the start of the validation script
		 */
		InitializeSenderFormValidation: function ()
		{
		},
		/**
		 * Function called by the SenderForm process at the end of the validation script
		 */
		FinalizeSenderFormValidation: function ()
		{
		},

		/**
		 * Function called by the Splitting process at the end of the validation script
		 */
		FinalizeSplittingValidation: function ()
		{
		},

		/**
		 * @method Lib.DD.Customization.Validation.CheckInboundEmailArchiving
		 * @description Called by the validation script to customize the check of the inbound email attachment archiving.
		 * The standard archiving checks that the inbound email attachment is not flagged as resource (which prevents archiving) or that the archive duration lower or equal to 2 months (free archiving).
		 * Typically, for the check to pass, an email processing rule must be defined for the email inbound channel.
		 * @returns {boolean|undefined} Return true if the check is successful, false if it fails, or undefined to use the standard check.
		 */
		CheckInboundEmailArchiving: function ()
		{
		}
	};

	return validation;
})();
