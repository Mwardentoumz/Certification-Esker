"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMERP_CUSTOMIZATION_CLIENT_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "Client side script CustomERP User Exits",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP HTML page script customization callbacks for CustomERP processes
 * @namespace Lib.CustomERP.Customization.Client
 */
var Lib;
(function (Lib) {
    var CustomERP;
    (function (CustomERP) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.CustomERP.Customization.Client.CustomizeBrowseConfig
                 * @since 364
                 * @description
                 * Allows you to customize the browse configuration used to query a CustomERP endpoint (url, headers, authentication, field mapping, etc.).
                 * This user exit is called every time a browse configuration is built, so it always receives up-to-date credentials.
                 * Modify the `browseConfig` object directly; there is nothing to return.
                 * @param {string} api The name of the CustomERP endpoint being queried (e.g. "Supplier", "costcenters", "glaccounts").
                 * @param {Sys.Helpers.ODataCommon.BrowseConfig} browseConfig The browse configuration to customize.
                 * @returns {void}
                 * @example <caption>This example adds a custom header only for the "Supplier" endpoint.</caption>
                 * <pre><code>
                 * CustomizeBrowseConfig: function (api, browseConfig)
                 * {
                 * 		if (api === "Supplier")
                 * 		{
                 * 			browseConfig.headers = browseConfig.headers || {};
                 * 			browseConfig.headers["X-Custom-Header"] = "CustomValue";
                 * 		}
                 * }
                 * </code></pre>
                 */
                Client.CustomizeBrowseConfig = function (api, browseConfig) {
                };
                /**
                 * @method Lib.CustomERP.Customization.Client.CustomizeBrowseParameters
                 * @description
                 * Allows you to customize the query parameters used to browse CustomERP endpoints (dimensions, vendors,
                 * delivery notes, PO headers, PO items, goods received items) from the Vendor invoice client scripts,
                 * before the OData browse is executed.
                 * Modify the `defaultBrowseParameters` object directly; there is nothing to return.
                 *
                 * The defaultBrowseParameters object has the following structure:
                 * - attributes {string} Pipe-separated list of fields requested from the endpoint.
                 * - filter {string} LDAP filter built from the browse criteria.
                 * - sortOrder {string} Sort order applied to the query, or null if not applicable.
                 * - maxRecords {number} Maximum number of records returned by the browse query.
                 *
                 * These parameters are passed to Sys.Helpers.OData.Browse as follows:
                 * Sys.Helpers.OData.Browse(callback, null, attributes, filter, sortOrder, maxRecords, browseConfig)
                 * @since 364
                 * @param {string} api The CustomERP endpoint name being browsed (see Lib.ERP.CustomERP.EndpointName), e.g. "gritems" or "poheaders".
                 * @param {object} defaultBrowseParameters The default browse parameters to customize.
                 * @returns {void}
                 * @example <caption>Add a custom filter on open goods receipts and request one additional ERP field, and sort PO headers by order date.</caption>
                 * <pre><code>
                 * CustomizeBrowseParameters: function (api, defaultBrowseParameters)
                 * {
                 * 	if (api === Lib.ERP.CustomERP.EndpointName.gritems)
                 * 	{
                 * 		defaultBrowseParameters.attributes += "|Z_GRStatus__";
                 * 		defaultBrowseParameters.filter = "(&" + defaultBrowseParameters.filter + "(Z_GRStatus__=OPEN))";
                 * 		defaultBrowseParameters.maxRecords = 100;
                 * 	}
                 * 	else if (api === Lib.ERP.CustomERP.EndpointName.poheaders)
                 * 	{
                 * 		defaultBrowseParameters.sortOrder = "OrderDate__ desc";
                 * 	}
                 * }
                 * </code></pre>
                 */
                Client.CustomizeBrowseParameters = function (api, defaultBrowseParameters) {
                };
                /**
                 * @method Lib.CustomERP.Customization.Client.OnBrowseQueryResultCallback
                 * @since 364
                 * @description
                 * Allows you to perform extra actions with the query result of any CustomERP browse
                 * (GetDimension, GetVendor, GetPOHeaders, GetPOItems, GetPOItemGoodsReceived, GetDeliveryNote, GetTaxRate),
                 * before it is passed to the standard callback. It is called as soon as the query result is received,
                 * even when the browse failed, so you can also react to errors here. Always check queryResult.GetQueryError()
                 * before acting on the result, so that error handling done by the standard callback is not duplicated or
                 * short-circuited. The standard behavior always runs; there is nothing to return.
                 * @param {IQueryValue} queryResult The query result returned by the browse.
                 * @param {string} api The CustomERP endpoint name that was browsed (see Lib.ERP.CustomERP.EndpointName), used to tell the browses apart.
                 * @returns {void}
                 * @example <caption>This example handles browse errors first, then stores an extra "Z_Type__" field on the current Data for goods received items.</caption>
                 * <pre><code>
                 * OnBrowseQueryResultCallback: function (queryResult, api)
                 * {
                 * 		if (queryResult.GetQueryError())
                 * 		{
                 * 			// Handle the error as needed
                 * 			return;
                 * 		}
                 * 		else if (api === Lib.ERP.CustomERP.EndpointName.gritems)
                 * 		{
                 * 			Data.SetValue("Z_Type__", queryResult.GetQueryValue("Z_Type__", 0));
                 * 		}
                 * }
                 * </code></pre>
                 */
                Client.OnBrowseQueryResultCallback = function (queryResult, api) {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = CustomERP.Customization || (CustomERP.Customization = {}));
    })(CustomERP = Lib.CustomERP || (Lib.CustomERP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CUSTOMERP_CUSTOMIZATION_CLIENT_SAMPLE.js.map