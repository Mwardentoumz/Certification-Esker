/* LIB_DEFINITION{
  "name": "LIB_DD_CUSTOMIZATION_FINALIZATION_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "all Finalization customization function",
  "versionable": false,
  "require": []
}*/

/**
 * Package DD Finalization customization callbacks for all processes
 * @namespace Lib.DD.Customization.Finalization
 */

var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Finalization = (function ()
{
	/**
	 * @lends Lib.DD.Customization.Finalization
	 */
	var Finalization =
	{
		/**
		 * Called at the start of the SenderForm finalization script
		 */
		InitializeSenderFormFinalization: function ()
		{
		},

		/**
		 * Called at the end of the SenderForm finalization script
		 */
		FinalizeSenderFormFinalization: function ()
		{
		},

		/**
		 * Called in FeedVectorStore function inside the SenderForm finalization script if activate vector store configuration option is activated.
		 * If you don't want the standard code of FeedVectorStore to be executed after your user exit return object {stop: true}
		 */
		FeedVectorStore: function ()
		{
		},

		/**
		 * Called in the SenderForm finalization script to extend the conversations to vectorize.
		 * the arguments is the conversations to vectorize formatted as a string.
		 * this string is then given to GPT to vectorize the conversations.
		 * You can modify the conversations to vectorize by returning a new string.
		 * @param {string} conversations - The conversations to vectorize
		 */
		ExtendConversationsToVectorize: function (conversations)
		{
			// Add additional content to the conversations to vectorize
			return conversations;
		}
	};

	return Finalization;

})();
