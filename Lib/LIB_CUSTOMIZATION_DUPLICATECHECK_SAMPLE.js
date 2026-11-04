"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_DUPLICATECHECK_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Customization library for duplicate check feature",
  "versionable": false,
  "require": []
}*/
/**
 * @namespace Lib.Customization.DuplicateCheck
 */
var Lib;
(function (Lib) {
    var Customization;
    (function (Customization) {
        var DuplicateCheck;
        (function (DuplicateCheck) {
            /**
             * @method Lib.Customization.DuplicateCheck.CustomizeDuplicateCheckFilter
             * @description Customize duplicate check filter
             * @param {string} filter The default filter of the duplicate check feature
             * @param {DuplicateCheckFilterOptions} options The options object of the duplicate check
             * @return {string} A customized filter for duplicate check
             * @example
             * A simple html footer
             * <pre><code>
             * CustomizeDuplicateCheckFilter: function (filter)
             * {
             * 		// Add company code to duplicate check filter
             * 		var companyCode = Data.GetValue("CompanyCode__");
             * 		filter += `(CompanyCode__=${companyCode})`;
             * 		return filter;
             * }
             * </code></pre>
             */
            DuplicateCheck.CustomizeDuplicateCheckFilter = function (filter, options) {
                return;
            };
            /**
             * @method Lib.Customization.DuplicateCheck.CustomizeDuplicateCheckOptions
             * @description Customize duplicate check options, like the fields that are used to detect a duplicate
             * @param {DuplicateCheckFilterOptions} options The options object of the duplicate check
             * @return {DuplicateCheckFilterOptions} The custom options for the duplicate check
             * @example
             * <pre><code>
             * CustomizeDuplicateCheckOptions: function (options)
             * {
             *		// Check that current process is Vendor invoice
             *		if ((Sys.ScriptInfo.IsClient() && Process.GetName() === "Vendor invoice")
             *			|| (Sys.ScriptInfo.IsServer() && Data.GetValue("ProcessId") === Process.GetProcessID("Vendor invoice")))
             *		{
             *			// Do not use InvoiceAmount as duplicate check criteria
             *			options.ControlsToCheck = ["InvoiceNumber__", "InvoiceDate__"];
             *		}
             *
             *		// Override the CallBack function
             *		var originalCallBack = options.CallBack;
             *		options.CallBack = function (duplicateList)
             *		{
             *			var atLeastOneDuplicatePosted = duplicateList.some(duplicate =>
             *			duplicate.additionalAttributes.InvoiceStatus__ === "To pay" ||
             *			duplicate.additionalAttributes.InvoiceStatus__ === "Paid");
             *
             *			Data.SetValue("Z_DuplicateInvoiceMightBePosted__", atLeastOneDuplicatePosted);
             *			originalCallBack(duplicateList);
             *		}
             *		return options;
             * }
             * </code></pre>
             */
            DuplicateCheck.CustomizeDuplicateCheckOptions = function (options) {
                return;
            };
            /**
             * @typedef {Object} Duplicate
             * @memberof Lib.Customization.DuplicateCheck
             * @property {string} RUIDEX Unique identifier of the duplicate record
             * @property {Object} duplicateKeys Key fields used to identify the duplicate scope
             * @property {Object} controlsToCheck Fields that matched the duplicate criteria
             * @property {Object} additionalAttributes Additional fields returned from the query
             */
            /**
             * @method Lib.Customization.DuplicateCheck.OnDuplicateCheckEnd
             * @since 345
             * @description
             * User exit called at the end of duplicate check.
             * Allows you to add custom duplicates from additional sources.
             * Use this hook to extend duplicate detection beyond the standard process query.
             * @param {Duplicate[]} duplicateList - Array of current duplicates found. Modify by pushing new items.
             * @param {DuplicateCheckFilterOptions} options - Read-only configuration from standard check to ease custom queries. Do not modify this object.
             * @returns {void} - Modify duplicateList directly
             * @example
             * OnDuplicateCheckEnd: function (duplicateList, options)
             * {
             *     // Use options to get the duplicate key and controls used in the standard check
             *     var vendorNumber = Data.GetValue(options.DuplicateKeyControls[0]); // e.g., "VendorNumber__"
             *     var invoiceNumber = Data.GetValue(options.ControlsToCheck[0]); // e.g., "InvoiceNumber__"
             *
             *     // Read pre-fetched historical data from variable
             *     var historicalJson = Variable.GetValueAsString("HistoricalInvoices__");
             *     if (!historicalJson) return;
             *
             *     var historical = JSON.parse(historicalJson);
             *
             *     // Find matching records using the same criteria as standard check
             *     for (var i = 0; i < historical.length; i++) {
             *         if (historical[i].VendorNumber__ === vendorNumber &&
             *             historical[i].InvoiceNumber__ === invoiceNumber) {
             *             duplicateList.push({
             *                 RUIDEX: "HIST-" + historical[i].InvoiceNumber__,
             *                 duplicateKeys: {
             *                     VendorNumber__: historical[i].VendorNumber__
             *                 },
             *                 controlsToCheck: {
             *                     InvoiceNumber__: historical[i].InvoiceNumber__,
             *                     InvoiceAmount__: historical[i].InvoiceAmount__
             *                 },
             *                 additionalAttributes: {
             *                     Source__: "Historical"
             *                 }
             *             });
             *         }
             *     }
             * }
             */
            DuplicateCheck.OnDuplicateCheckEnd = function (duplicateList, options) {
            };
            /**
             * @typedef {object} DuplicateCheckInputs
             * @memberof Lib.Customization.DuplicateCheck
             * @property {string[]} duplicateKeyControls Key controls defining the duplicate scope.
             * @property {string[]} controlsToCheck Controls used to detect duplicates.
             * @property {object} queryOptions Query options passed to the engine.
             * @property {number} iGroupSize Permutation size used by BuildControlToCheckFilter.
             * @property {boolean} checkEmptyFields When true, empty values are kept for filter building.
             * @property {Function} [callback] Client only callback.
             */
            /**
             * @method Lib.Customization.DuplicateCheck.CustomizeInputsCheckDuplicate
             * @since 348
             * @description Customize runtime inputs of duplicate check (iGroupSize, checkEmptyFields, etc.). Called before InitCheckDuplicate.
             * @param {DuplicateCheckInputs} inputs Runtime inputs for this execution. Modify this object directly.
             * @returns {void}
             * @example <caption>Force iGroupSize to avoid BuildControlToCheckFilter returning null (Vendor invoice only).</caption>
             * CustomizeInputsCheckDuplicate = function (inputs, options)
             * {
             * 	if (
             * 		(Sys.ScriptInfo.IsClient() && Process.GetName() === "Vendor invoice")
             * 		|| (Sys.ScriptInfo.IsServer() && Data.GetValue("ProcessId") === Process.GetProcessID("Vendor invoice"))
             * 	)
             * 	{
             * 		if (Sys.Parameters.GetInstance("AP").GetParameter("Z_ForceDuplicateCheck", "0") === "1")
             * 		{
             * 			inputs.iGroupSize = inputs.controlsToCheck.length;
             * 		}
             * 	}
             * };
             */
            DuplicateCheck.CustomizeInputsCheckDuplicate = function (inputs, options) {
            };
            /**
             * @typedef {object} DuplicateCheckQueryDef
             * @memberof Lib.Customization.DuplicateCheck
             * @property {string} filter Final filter passed to the query execution.
             * @property {string} sortOrder Sort order passed to the query execution.
             * @property {number} maxResults Maximum duplicates to return.
             *
             * @property {string} [table] Client only: table id used by Query.DBQuery.
             * @property {string} [attributes] Client only: attributes string used by Query.DBQuery.
             * @property {Function} [callback] Callback to reuse standard processing (client: DuplicateQueryCallBack, server: AddDuplicateToResult).
             *   On server side, this callback is pre-bound to `Lib.DuplicateCheck` and can be called directly: `queryDef.callback(rec)`.
             * @property {any} [callbackInstance] Client only: callback instance.
             *
             * @property {string} [specificTable] Server only: table name used by Query.SetSpecificTable.
             * @property {string} [attributesList] Server only: attributes list used by Query.SetAttributesList.
             * @property {boolean} [searchInArchive] Server only: when true, also searches in archive.
             */
            /**
             * @method Lib.Customization.DuplicateCheck.CustomizeQueryForDuplicate
             * @since 348
             * @description
             * Customize the duplicate query definition before execution.
             * You can override queryDef fields (standard query will run), or fully handle the query.
             *
             * @param {DuplicateCheckQueryDef} queryDef Query definition used by the engine. Modify this object directly.
             * @param {DuplicateCheckFilterOptions} options Duplicate check options. Do not modify this object.
             * @param {Duplicate[]} [duplicateList] Server only: list to populate with query results when you return true (can also be done using standard Lib.DuplicateCheck.AddDuplicateToResult function).
             * @returns {void|boolean} Return true to indicate that you fully handle the query. Return null or false to keep default query behavior.
             *
             * @example <caption>Client: run a custom DBQuery and reuse standard processing (DuplicateQueryCallBack).</caption>
             * CustomizeQueryForDuplicate = function (queryDef, options)
             * {
             *     if (!Sys.ScriptInfo.IsClient())
             *     {
             *         // keep default behavior
             *         return false;
             *     }
             *
             *     Log.Info("[DC][UE][Client] Custom query executed");
             *
             *     // Example: extend the filter
             *     queryDef.filter = "(&" + queryDef.filter + "(RUIDEX=*))";
             *
             *     // Run the query yourself, but keep standard parsing + callback behavior
             *     Query.DBQuery(
             *         queryDef.callback,
             *         queryDef.table,
             *         queryDef.attributes,
             *         queryDef.filter,
             *         queryDef.sortOrder,
             *         queryDef.maxResults,
             *         queryDef.callbackInstance
             *     );
             *
             *     return true;
             * };
            *
            * @example <caption>Server: run a custom query and populate duplicateList.</caption>
            * CustomizeQueryForDuplicate = function (queryDef, options, duplicateList)
            * {
            *     if (!Sys.ScriptInfo.IsServer())
            *     {
            *         // keep default behavior
            *         return false;
            *     }
            *
            *     Log.Info("[DC][UE][Server] Custom query executed");
            *
            *     Query.Reset();
            *     Query.SetSpecificTable(queryDef.specificTable);
            *     Query.SetFilter(queryDef.filter);
            *     Query.SetSortOrder(queryDef.sortOrder);
            *     Query.SetAttributesList("RUIDEX");
            *     Query.SetSearchInArchive(queryDef.searchInArchive);
            *
            *     if (Query.MoveFirst())
            *     {
            *         var rec = Query.MoveNext();
            *         while (rec && duplicateList.length < queryDef.maxResults)
            *         {
            *             // Use standard callback to add duplicate to result (pre-bound, safe to call directly):
            *             queryDef.callback(rec);
            *             // You can also add the result yourself in the list
            *             //duplicateList.push({ RUIDEX: rec.GetUninheritedVars().GetValue_String("RUIDEX", 0) });
            *             rec = Query.MoveNext();
            *         }
            *     }
            *
            *     return true;
            * };
            */
            DuplicateCheck.CustomizeQueryForDuplicate = function (queryDef, options, duplicateList) {
            };
        })(DuplicateCheck = Customization.DuplicateCheck || (Customization.DuplicateCheck = {}));
    })(Customization = Lib.Customization || (Lib.Customization = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CUSTOMIZATION_DUPLICATECHECK_SAMPLE.js.map