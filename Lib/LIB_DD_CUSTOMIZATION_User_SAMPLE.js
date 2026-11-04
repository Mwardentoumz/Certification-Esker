/* LIB_DEFINITION{
  "name": "LIB_DD_CUSTOMIZATION_User_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "all User customization function",
  "versionable": false,
  "require": []
}*/

/**
 * Package DD User customization callbacks
 * @namespace Lib.DD.Customization.User
 */

var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.User = (function ()
{
	/**
	 * @lends Lib.DD.Customization.User
	 */
	var User =
	{
		/**
		 * Function called before automatically creating a non-existing recipient using data extracted from the document.
		 * Used to override default user properties.
		 * @param {object} propertyOverrides
		 * <pre><code>
		 * 	CustomizeAutomaticRecipientCreation: function(propertyOverrides)
		   *  {
		 *  	// force user's language to english
		 *  	propertyOverrides.language = "en";
		 *	}
		 * </code></pre>
		 */
		CustomizeAutomaticRecipientCreation: function (propertyOverrides)
		{
		}
	};

	return User;
})();
