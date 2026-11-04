/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "Lib_Customization_CSVDataImport_Sample",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Allow the customization of the CSV Data Import process",
  "require": [],
  "versionable": false
}*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.Customization = Lib.Customization || {};
Lib.Customization.CSVDataImport = Lib.Customization.CSVDataImport || {};

/**
 * @namespace Lib.Customization.CSVDataImport
*/
Lib.Customization.CSVDataImport = (function ()
{
	/**
	 * @lends Lib.Customization.CSVDataImport
	 */
	var customization = {
		/**
		 * @namespace
		 */
		/**
		 * This custom user exit allows you to add parameters to CSVDataImportParameters.
		 * @returns {Object} - an object containing all the custom parameters to add.
		 * @example
		 * A ReplicationMode parameter is added to the CSVDataImportParameters object, its value depends on
		 * the csv file attached to the CSV Data Import process.
		 * <pre><code>GetCustomParameters: function ()
		 * {
		 * 	return {
		*  		ReplicationMode: Attach.GetName(0).indexOf("Customers") !== -1?"incremental": "full"
		 * 	};
		 * }</code></pre>
		*/
		GetCustomParameters: function ()
		{
			return {};
		},

		/**
		 * This custom user exit allows perform some processing at the end of the execution of the finalization script of the process CSV Data Import.
		 * Caution: when this function is called, the cmd line which does the actual import may not be finished yet.
		 *
		 * @returns {void}
		*/
		OnFinalizationScriptEnd: function ()
		{
		},

		/**
		 * @method Lib.Customization.CSVDataImport.GetCorrectedFileName
		 * @since 335
		 * @description
		 * This function is used to normalize the name of an incoming CSV file before it is processed, if the file name does not match the expected format.
		 * If used, this function returns a corrected version, otherwise it returns nothing.
		 * The expected format is typically "<Package>__<ERP>__<Table>__<Timestamp>", for example: "P2P__Generic__GoodsReceiptItems__09JUL2025151515".
		 * @param {string} fileName - The original name of the uploaded CSV file
		 * @returns {string|void} The corrected file name, or nothing if no correction is needed
		 * @example <caption> In this example, received csv file name is "GoodsReceiptItems_09JUL2025151515_MHS".
		 * We want to return the expected file name "P2P__Generic__GoodsReceiptItems__09JUL2025151515"</caption>
		 * function GetCorrectedFileName(fileName)
		 * {
		 * 		var fileNameSplitted = fileName.split("_");
		 *		return "P2P__Generic__" + fileNameSplitted[0] + "__" + fileNameSplitted[1];
		 * }
		 **/
		GetCorrectedFileName: function (fileName)
		{
		},

		/**
		 * @method Lib.Customization.CSVDataImport.GetCustomERPIndexSeparator
		 * @since 341
		 * @description Allow customizing the ERP index separator
		 * @returns {string|void} The custom ERP index separator, or nothing to use the default one (#)
		 * @example <caption>If ERP (such as EBS) is unable to generate filenames containing default separator (#), return another character (ie. "^").</caption>
		 * CSVDataImport.GetCustomERPIndexSeparator = function ()
		 * {
		 * 	return "^";
		 * };
		 */
		GetCustomERPIndexSeparator: function ()
		{
		},

		/**
		 * @method Lib.Customization.CSVDataImport.GetCustomMappingTable
		 * @since 344
		 * @description
		 * This user exit allows you to extend the mapping table.
		 * The mapping table defines how CSV files are processed, including the target database table
		 * and the fields used for company code filtering.
		 * Note: This user exit is currently only supported for NAV ERP.
		 * @returns {Object} An object containing custom mapping entries to add to the standard mapping table.
		 * Each entry should have the following structure:
		 * - table: The target table name in the database
		 * - fieldNameInFile: The field name in the CSV file used for filtering
		 * - fieldNameInTable: The field name in the database table used for filtering
		 * @example <caption>Add support for custom NAV tables</caption>
		 * CSVDataImport.GetCustomMappingTable = function ()
		 * {
		 * 	return {
		 * 		"JobTasks": {
		 * 			table: "AP - Jobs Tasks__",
		 * 			fieldNameInFile: "CompanyCode__",
		 * 			fieldNameInTable: "CompanyCode__"
		 * 		},
		 * 		"Jobs": {
		 * 			table: "AP - Jobs__",
		 * 			fieldNameInFile: "CompanyCode__",
		 * 			fieldNameInTable: "CompanyCode__"
		 * 		},
		 * 	};
		 * };
		 */
		GetCustomMappingTable: function ()
		{
		}
	};

	return customization;
})();
