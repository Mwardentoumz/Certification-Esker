/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_DOWNLOADDOCUMENTS_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Customization callbacks for download documents feature",
  "versionable": false,
  "require": []
}*/

/**
 * Specific Client side User Exits layout for the docwnload document feature
 * @class Lib.Customization.DownloadDocuments
*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Customization = Lib.Customization || {};
Lib.Customization.DownloadDocuments = (function ()
{
	/**
	 * @lends Lib.Customization
	 */
	return {
		/**
		 * Client side User Exit
		 * Allows you to customize layout settings of the Zip Documents sys process.
		 * This user exit is called at the end of the HTML page script of the Zip Documents sys process.
		 * If you need to customize callback functions associated with control events, refer to HTML page script API: Control events.
		 * @example
		 * <pre><code>
		 * OnHTMLScriptEnd: function ()
		 * {
		 * 	 // Include the audit file in the ZIP by default.
		 * 	 Controls.IncludeAuditTrail__.SetValue(true);
		 * }
		 * </code></pre>
		 * @memberOf Lib.Customization.DownloadDocuments
		 */
		OnHTMLScriptEnd: function ()
		{
		}
	};
})();
