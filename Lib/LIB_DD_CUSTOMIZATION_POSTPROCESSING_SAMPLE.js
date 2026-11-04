/* LIB_DEFINITION{
  "name": "LIB_DD_CUSTOMIZATION_POSTPROCESSING_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "all PostProcessing customization function",
  "versionable": false,
  "require": []
}*/

/**
 * Package DD PostProcessing customization callbacks for all processes
 * @namespace Lib.DD.Customization.PostProcessing
 */

var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.PostProcessing = (function ()
{
	/**
	 * @lends Lib.DD.Customization.PostProcessing
	 */
	var PostProcessing =
	{
		/**
		 * Called at the start of the SenderForm PostProcessing script
		 */
		InitializeSenderFormPostProcessing: function ()
		{
		},

		/**
		 * Called at the end of the SenderForm PostProcessing script
		 */
		FinalizeSenderFormPostProcessing: function ()
		{
		}
	};

	return PostProcessing;

})();
