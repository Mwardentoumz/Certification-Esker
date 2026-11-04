"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_COMMON_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Common AP vendor statement customizations",
  "versionable": false,
  "require": []
}*/
/**
 * Lib AP Statement Matching common customizations
 * @namespace Lib.AP.Customization.StatementMatching.Common
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var StatementMatching;
            (function (StatementMatching) {
                var Common;
                (function (Common) {
                    /**
                     * @method Lib.AP.Customization.StatementMatching.Common.OnHandleAdditionalInvoiceFields
                     * @since 328
                     * @description Allow to customize the mapping of the invoice fields to be used in the Vendor statement reconciliation process.
                     * @param defaultMapping default mapping of the invoice fields to be used in the Vendor statement reconciliation process.
                     * @returns {ESKMap<string>} a map of the default mapping to be used for the invoice fields or null or nothing to use the default mapping.
                     * @remarks defaultMapping is a map of the default mapping to be used for the invoice fields.
                     * You can modify it or return a new map with the mapping you want to use.
                     * If you return null or nothing, the default mapping will be used.
                     * Keys are the field names in the invoice, values are the corresponding field names in the Vendor statement matching process invoice table.
                     * this mapping is then used to deduced the fields to retrieve when querying the Vendor invoices
                     * @example
                     * <caption>Add a custom Vendor invoice field to Vendor statement matching</caption>
                     * Common.OnHandleAdditionalInvoiceFields = function(defaultMapping)
                     *	{
                     *	 	defaultMapping["VIPCustomField1__"] = "VendorStatementTableCustomField1__";
                     *
                     *	 	return defaultMapping;
                     *	}
                     */
                    Common.OnHandleAdditionalInvoiceFields = function (defaultMapping) {
                        return null;
                    };
                    /**
                     * @method Lib.AP.Customization.StatementMatching.Common.OnCustomizeHandledVIPStates
                     * @since 328
                     * @description Allows to customize the VIP states to retrieve and exclude in the Vendor statement reconciliation process.
                     * @param defaultVIPStatesToRetrieve default VIP states to retrieve in the Vendor statement reconciliation process.
                     * states to retrieve are the states that will be used to retrieve the list of Vendor invoices for the Vendor statement reconciliation process.
                     * @param defaultVIPStatesToExclude default VIP states to exclude in the Vendor statement reconciliation process.
                     * states to exclude are the states that will be used to exclude the list of Vendor invoices when checking for missing references during the Vendor statement reconciliation process.
                     * @returns {ESKMap<string>} a map of the default VIP states to be used for the Vendor statement reconciliation process or null or nothing to use the default mapping.
                     *
                     * @example
                     * <caption>Customize the VIP states to retrieve and exclude in the Vendor statement reconciliation process</caption>
                     * Common.OnCustomizeHandledVIPStates = function(defaultVIPStatesToRetrieve, defaultVIPStatesToExclude)
                     * {
                     *	 	defaultVIPStatesToRetrieve.push("CustomState1");
                     *	 	defaultVIPStatesToExclude.push("CustomState2");
                     *
                     *	 	return { toRetrieve: defaultVIPStatesToRetrieve, toExclude: defaultVIPStatesToExclude };
                     * }
                     */
                    Common.OnCustomizeHandledVIPStates = function (defaultVIPStatesToRetrieve, defaultVIPStatesToExclude) {
                        return null;
                    };
                    /**
                     * @method Lib.AP.Customization.StatementMatching.Common.OnValidateStatementHeader
                     * @since 353
                     * @description
                     * User exit called during statement matching to allow overriding the standard header validation.
                     * By default, `CompanyCode__`, `StatementDate__`, and `VendorNumber__` are all required.
                     * Return `true` to allow matching to proceed even when `CompanyCode__` is absent (cross-company scenario).
                     * Return `false` to force rejection regardless of the standard check.
                     * Return nothing (or `undefined`) to use the standard validation result.
                     * @returns {boolean | void} Return a boolean to override the standard validation result, or void to use it as-is.
                     * @example
                     * <caption>Make CompanyCode__ optional — only StatementDate__ and VendorNumber__ are required</caption>
                     * Common.OnValidateStatementHeader = function ()
                     * {
                     * 	return Boolean(Data.GetValue("StatementDate__")) && Boolean(Data.GetValue("VendorNumber__"));
                     * }
                     */
                    Common.OnValidateStatementHeader = function () {
                    };
                    /**
                    * @method Lib.AP.Customization.StatementMatching.Common.CustomizeIndividualInvoiceStatementMatchingFilter
                    * @since 353
                    * @description Customize the per-reference invoice query filter used during the fallback matching pass.
                    * Called in `ProcessIndividualQuery` for each unmatched statement reference when no invoice was found
                    * during the initial bulk query. The default filter uses `FilterNotIn("InvoiceStatus__", ...)` (a blacklist),
                    * unlike the bulk query which uses a whitelist. Use this exit to add extra restrictions consistent with
                    * those applied in `CustomizeInvoiceStatementMatchingFilter`.
                    * @param {Sys.Helpers.LdapUtil.IFilter} filter The default filter for the per-reference invoice query
                    * @return {Sys.Helpers.LdapUtil.IFilter} A customized filter for the per-reference invoice query
                    * @example
                    * <caption>Add a filter to match custom vendor number</caption>
                    * Common.CustomizeIndividualInvoiceStatementMatchingFilter = function (filter)
                    * {
                    *	const vendorName = Data.GetValue("Z_VendorNumber__");
                    *	filter = Sys.Helpers.LdapUtil.FilterAnd(
                    *		filter,
                    *		Sys.Helpers.LdapUtil.FilterEqual("Z_VendorNumber__", vendorName),
                    *	);
                    *	return filter;
                    * }
                    */
                    Common.CustomizeIndividualInvoiceStatementMatchingFilter = function (filter) {
                    };
                })(Common = StatementMatching.Common || (StatementMatching.Common = {}));
            })(StatementMatching = Customization.StatementMatching || (Customization.StatementMatching = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_COMMON_SAMPLE.js.map