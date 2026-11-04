"use strict";
/* LIB_DEFINITION{
  "name": "LIB_PAC_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending PAC scripts on Common side",
  "versionable": false,
  "require": []
}*/
/**
 * Package PAC common scripts customization callbacks
 * @namespace Lib.PAC.Customization.Common
 */
var Lib;
(function (Lib) {
    var PAC;
    (function (PAC) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                let SAP;
                (function (SAP) {
                    let Query;
                    (function (Query) {
                        /**
                         * @method Lib.PAC.Customization.Common.SAP.Query.VendorInfo
                         * @since 346
                         * @description
                         * Allows you to modify all the parameters used in the SAP query for the Vendor record (ZESK_VENDORS table).
                         * This user exit is called when querying vendor information from SAP, allowing you to:
                         * - Add custom attributes to retrieve from SAP
                         * - Modify the filter criteria
                         * - Customize the callback to process additional fields
                         * - Change any SAP query parameter before execution
                         * @param {Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} params An object containing all parameters:
                         *   - {string | ISAPBapiManager} sapConf The SAP configuration or BAPI manager to use.
                         *   - {string} table The SAP table to query (default: "ZESK_VENDORS").
                         *   - {string} filter The filter to apply to the query (e.g., company code and vendor number/name).
                         *   - {Sys.GenericAPI.QueryAttribute<T_in>[]} attributes The attributes to retrieve (SAP field names).
                         *   - {Sys.GenericAPI.SAPQueryCallback<T_out>} callback The callback to call with the results.
                         *   - {number} [maxRecords] The maximum number of records to retrieve (default: 1).
                         *   - {Sys.GenericAPI.SAPQueryOptions<T_in, T_out>} [options] Additional options for the query.
                         * @returns {void | Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} The modified parameters to use for the SAP query. Return nothing to use default parameters, or return the modified params object.
                         * @example <caption>In this example, we add a custom Z field to the attributes retrieved from SAP vendor query.</caption>
                         * Query.VendorInfo = function (params)
                         * {
                         * 	// Add custom Z field to the list of attributes to retrieve
                         * 	params.attributes.push("ZZVENDOR_RATING");
                         *
                         * 	// Optionally modify the filter to add additional criteria
                         * 	// params.filter += " AND ZZACTIVE = 'X'";
                         *
                         * 	// Return modified params to use them in the query
                         * 	return params;
                         * };
                         */
                        Query.VendorInfo = function (params) {
                        };
                    })(Query = SAP.Query || (SAP.Query = {}));
                    /**
                     * @method Lib.PAC.Customization.Common.SAP.VendorInfo_AdditionalFields
                     * @since 346
                     * @description
                     * Allows you to add additional custom fields to the Vendor information retrieved from SAP.
                     * This user exit is called after the standard SAP vendor query has been executed, allowing you to:
                     * - Map additional SAP Z-fields to form fields
                     * - Include custom fields in the vendor record that will be available in the application
                     * - Extend the vendor data model without modifying core code
                     *
                     * The fields returned by this function must have already been retrieved from SAP using the Query.VendorInfo user exit
                     * or be part of the standard query attributes.
                     * @returns {Lib.ERP.SAP.SAPField[]} An array of additional field mappings to add to the vendor. Each element should have:
                     *   - {string} nameInForm The name of the field as it will appear in the application form (use __ suffix convention).
                     *   - {string} nameInSAP The name of the field in the SAP table (typically a Z-field).
                     * @example <caption>In this example, we add two custom Z-fields from SAP to the vendor record.</caption>
                     * SAP.VendorInfo_AdditionalFields = function ()
                     * {
                     * 	return [
                     * 		{
                     * 			nameInForm: "Z_VendorRating__",
                     * 			nameInSAP: "ZZVENDOR_RATING"
                     * 		},
                     * 		{
                     * 			nameInForm: "Z_VendorCategory__",
                     * 			nameInSAP: "ZZVENDOR_CATEGORY"
                     * 		}
                     * 	];
                     * };
                     */
                    SAP.VendorInfo_AdditionalFields = function () {
                    };
                })(SAP = Common.SAP || (Common.SAP = {}));
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = PAC.Customization || (PAC.Customization = {}));
    })(PAC = Lib.PAC || (Lib.PAC = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_PAC_CUSTOMIZATION_COMMON_SAMPLE.js.map