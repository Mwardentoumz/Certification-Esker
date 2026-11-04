/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "Lib_Customization_CustomerExtendedProperties_Sample",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Allow client-side customization of the Customer Extended Properties process",
  "require": [],
  "versionable": false
}*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Customization = Lib.Customization || {};
Lib.Customization.CustomerExtendedProperties = Lib.Customization.CustomerExtendedProperties || {};

/**
 * @namespace Lib.Customization.CustomerExtendedProperties
*/
Lib.Customization.CustomerExtendedProperties = (function ()
{
	/**
	 * @lends Lib.Customization.CustomerExtendedProperties
	 */
	var customization = {
		/**
		 * This user exit allows you to customize the roles dictionary that controls UI visibility in the Customer Extended Properties process.
		 * It is called before the roles configuration is applied to the page, allowing you to add new roles or modify existing role configurations.
		 *
		 * @method Lib.Customization.CustomerExtendedProperties.CustomizeDictionary
		 * @param {Object} dictionary - The roles dictionary object where each key is a business role name (e.g., "_Business Policy - Sales Representative.xml")
		 * and each value is an object with `allowedPanes` (object mapping pane names to arrays of allowed controls),
		 * `allowedNavMenuItems` (array of navigation menu item names), and `hiddenControls` (array of control names to hide).
		 * @returns {void}
		 * @example
		 * <pre><code>
		 * CustomizeDictionary: function (dictionary)
		 * {
		 * 	 dictionary["_Business Policy - Sales Representative.xml"] = {
		 * 	   allowedPanes: {
		 * 	     "CountersPane": [],
		 * 	     "TimelinePane": [],
		 * 	     "MainContactPane": []
		 * 	   },
		 * 	   allowedNavMenuItems: ["overview", "invoices", "contacts"],
		 * 	   hiddenControls: ["CreditHold"]
		 * 	 };
		 * }
		 * </code></pre>
		*/
		CustomizeDictionary: function (dictionary)
		{
		}
	};

	return customization;
})();
