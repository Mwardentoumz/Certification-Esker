"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_OC_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending order confirmation scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Sys/Sys_FormTemplate_Manager"
  ]
}*/
/**
 * Package Order Confirmation Client script customization callbacks
 * @namespace Lib.OC.Customization.Client
 */
var Lib;
(function (Lib) {
    var OC;
    (function (OC) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.OC.Customization.Client.OnLoad
                 * @since 328
                 * @description
                 * This function will be called at the order confirmation loading; just before calling the Start function.
                 * If you return a promise object, we synchronize on it before calling the Start function.
                 * @example
                 * <pre><code>
                 * OnLoad: function ()
                 * {
                 * 	// Initialize company code
                 * 	Data.SetValue("CompanyCode__", "US01");
                 * }
                 * </code></pre>
                 */
                Client.OnLoad = function () {
                };
                /**
                 * @method Lib.OC.Customization.Client.CustomizeLayout
                 * @description Allows you to customize the Order Confirmation process form. This user exit is called from the HTML page script of the Order Confirmation process, after loading the form.
                 * 		This user exit is typically used to customize:
                 * 		Objects from the included script libraries.
                 * 		Objects from the HTML page script.
                 * @since 321
                 * @param {Sys.FormTemplate.Manager} formTemplateManager Form template manager instance
                 * <pre><code>
                 * 		export const CustomizeLayout = function (formTemplateManager: Sys.FormTemplate.Manager): void
                 * 		{
                 * 			const customFormTemplate: Lib.Purchasing.OC.FormTemplate.FormTemplate = // can be an array of templates too
                 * 				{
                 * 					name: "CUSTOMIZATION ",
                 * 					condition: (LineItems__: LineItems) => LineItems__.ItemType__ !== "AmountBased",
                 * 					modifications: [
                 * 						{ type: "setControlVisible", control: "NetAmount__", table: "LineItems__", value: true },
                 * 						{ type: "setControlVisible", control: "NetAmount__", table: "LineItems__", atRow: true, value: true }
                 * 					]
                 * 				};
                 * 			formTemplateManager.RegisterTemplate(customFormTemplate); // you can also pass an array of templates here
                 * 			formTemplateManager.Apply();
                 *
                 * 			Controls.PONumber__.SetDisplayedColumns(Controls.PONumber__.GetDisplayedColumns() + "|" + "Z_POCreator__");
                 * 			return;
                 * 		};
                 * </code></pre>
                 */
                Client.CustomizeLayout = (formTemplateManager) => {
                    return;
                };
                /**
                 * Namespace containing functions to customize the behavior of browsing local purchase orders (POV2).
                 * @namespace Lib.OC.Customization.Client.BrowseLocalPO
                 */
                let BrowseLocalPO;
                (function (BrowseLocalPO) {
                    /**
                     * Customizes the attribute mapping for browsing purchase orders.
                     *
                     * @method Lib.OC.Customization.Client.BrowseLocalPO.CustomizeAttributeMapping
                     * @description Customizes the attribute mapping for browsing purchase orders.
                     * @since 328
                     * @param attributeMapping - The original attribute mapping.
                     * @returns The customized attribute mapping.
                     * @example
                     * <pre><code>
                     * 	export const CustomizeAttributeMapping = (attributeMapping: Lib.Purchasing.OC.BrowsePOAttributeMapping): Lib.Purchasing.OC.BrowsePOAttributeMapping =>
                     * 	{
                     * 		// Customize the attribute mapping here
                     * 		// For example, you can add the mapping for a specific attribute
                     * 		attributeMapping["Plant"] = "Z_PlantName__";
                     * 		return attributeMapping;
                     * 	};
                     * </code></pre>
                     */
                    BrowseLocalPO.CustomizeAttributeMapping = (attributeMapping) => {
                        return attributeMapping;
                    };
                    /**
                     * Customizes the query parameters for browsing purchase orders.
                     *
                     * @method Lib.OC.Customization.Client.BrowseLocalPO.CustomizeQueryParams
                     * @description Customizes the query parameters for browsing purchase orders.
                     * @since 328
                     * @param params - The original query parameters.
                     * @returns The customized query parameters.
                     * @example
                     * <pre><code>
                     * 	export const CustomizeQueryParams = (params: BrowsePOQueryParameters): BrowsePOQueryParameters =>
                     * 	{
                     * 		// Customize the query parameters here
                     * 		// For example, you can add a filter to the query
                     * 		params.filter = Sys.Helpers.LdapUtil.FilterAnd(
                     * 			params.filter,
                     * 			Sys.Helpers.LdapUtil.FilterEqual("Plant", "U1")
                     * 		);
                     * 		return params;
                     * 	};
                     * </code></pre>
                     */
                    BrowseLocalPO.CustomizeQueryParams = (params) => {
                        return params;
                    };
                    /**
                     * Executes a promised query to retrieve purchase order records based on the provided parameters.
                     *
                     * @method Lib.OC.Customization.Client.BrowseLocalPO.PromisedQuery
                     * @description Executes a promised query to retrieve purchase order records based on the provided parameters.
                     * @since 328
                     * @param params - The query parameters.
                     * @returns A promise that resolves to an array of purchase order records. Returns null if you want to use the default query.
                     * @example
                     * <pre><code>
                     * 	export const PromisedQuery = (params: BrowsePOQueryParameters): Promise<Lib.Purchasing.OC.BrowsePORecord[]> =>
                     * 	{
                     * 		// Execute the query here
                     * 		// For example, you can use Sys.GenericAPI.PromisedQuery to perform a custom query before returning the results
                     * 		return Sys.GenericAPI.PromisedQuery(params);
                     * 	};
                     * </code></pre>
                     */
                    BrowseLocalPO.PromisedQuery = (params) => {
                        return null;
                    };
                })(BrowseLocalPO = Client.BrowseLocalPO || (Client.BrowseLocalPO = {}));
                /**
                 * Namespace containing functions to customize the behavior of browsing purchase orders (APPOHeaders).
                 * @namespace Lib.OC.Customization.Client.BrowseAPPOHeaders
                 */
                let BrowseAPPOHeaders;
                (function (BrowseAPPOHeaders) {
                    /**
                     * Customizes the attribute mapping for browsing purchase orders.
                     *
                     * @method Lib.OC.Customization.Client.BrowseAPPOHeaders.CustomizeAttributeMapping
                     * @description Customizes the attribute mapping for browsing purchase orders.
                     * @since 328
                     * @param attributeMapping - The original attribute mapping.
                     * @returns The customized attribute mapping.
                     * @example
                     * <pre><code>
                     * 	export const CustomizeAttributeMapping = (attributeMapping: Lib.Purchasing.OC.BrowsePOAttributeMapping): Lib.Purchasing.OC.BrowsePOAttributeMapping =>
                     * 	{
                     * 		// Customize the attribute mapping here
                     * 		// For example, you can add the mapping for a specific attribute
                     * 		attributeMapping["Plant"] = "Z_PlantName__";
                     * 		return attributeMapping;
                     * 	};
                     * </code></pre>
                     */
                    BrowseAPPOHeaders.CustomizeAttributeMapping = (attributeMapping) => {
                        return attributeMapping;
                    };
                    /**
                     * Customizes the query parameters for browsing purchase orders.
                     *
                     * @method Lib.OC.Customization.Client.BrowseAPPOHeaders.CustomizeQueryParams
                     * @description Customizes the query parameters for browsing purchase orders.
                     * @since 328
                     * @param params - The original query parameters.
                     * @returns The customized query parameters.
                     * @example
                     * <pre><code>
                     * 	export const CustomizeQueryParams = (params: BrowsePOQueryParameters): BrowsePOQueryParameters =>
                     * 	{
                     * 		// Customize the query parameters here
                     * 		// For example, you can add a filter to the query
                     * 		params.filter = Sys.Helpers.LdapUtil.FilterAnd(
                     * 			params.filter,
                     * 			Sys.Helpers.LdapUtil.FilterEqual("Plant", "U1")
                     * 		);
                     * 		return params;
                     * 	};
                     * </code></pre>
                     */
                    BrowseAPPOHeaders.CustomizeQueryParams = (params) => {
                        return params;
                    };
                    /**
                     * Executes a promised query to retrieve purchase order records based on the provided parameters.
                     *
                     * @method Lib.OC.Customization.Client.BrowseAPPOHeaders.PromisedQuery
                     * @description Executes a promised query to retrieve purchase order records based on the provided parameters.
                     * @since 328
                     * @param params - The query parameters.
                     * @returns A promise that resolves to an array of purchase order records. Returns null if you want to use the default query.
                     * @example
                     * <pre><code>
                     * 	export const PromisedQuery = (params: BrowsePOQueryParameters): Promise<Lib.Purchasing.OC.BrowsePORecord[]> =>
                     * 	{
                     * 		// Execute the query here
                     * 		// For example, you can use Sys.GenericAPI.PromisedQuery to perform a custom query before returning the results
                     * 		return Sys.GenericAPI.PromisedQuery(params);
                     * 	};
                     * </code></pre>
                     */
                    BrowseAPPOHeaders.PromisedQuery = (params) => {
                        return null;
                    };
                })(BrowseAPPOHeaders = Client.BrowseAPPOHeaders || (Client.BrowseAPPOHeaders = {}));
                /**
                 * Namespace containing functions to customize the behavior of browsing purchase orders (SAP).
                 * @namespace Lib.OC.Customization.Client.BrowseSapPO
                 */
                let BrowseSapPO;
                (function (BrowseSapPO) {
                    /**
                     * Customizes the attribute mapping for browsing purchase orders.
                     *
                     * @method Lib.OC.Customization.Client.BrowseSapPO.CustomizeAttributeMapping
                     * @description Customizes the attribute mapping for browsing purchase orders.
                     * @since 328
                     * @param attributeMapping - The original attribute mapping.
                     * @returns The customized attribute mapping.
                     * @example
                     * <pre><code>
                     * 	export const CustomizeAttributeMapping = (attributeMapping: Lib.Purchasing.OC.BrowsePOAttributeMapping): Lib.Purchasing.OC.BrowsePOAttributeMapping =>
                     * 	{
                     * 		// Customize the attribute mapping here
                     * 		// For example, you can add the mapping for a specific attribute
                     *     	attributeMapping["ERNAM"] = "Z_POCreator__";
                     * 		return attributeMapping;
                     * 	};
                     * </code></pre>
                     */
                    BrowseSapPO.CustomizeAttributeMapping = (attributeMapping) => {
                        return attributeMapping;
                    };
                    /**
                     * Customizes the Sap config for browsing purchase orders.
                     *
                     * @method Lib.OC.Customization.Client.BrowseSapPO.CustomizeQueryParams
                     * @description Customizes the Sap config for browsing purchase orders.
                     * @since 328
                     * @param sapConfigForPO - The original Sap config.
                     * @returns The customized Sap config.
                     * @example
                     * <pre><code>
                     * 	const CustomizeQueryParams = (sapConfigForPO) =>
                     * 	{
                     * 		// Customize the Sap config here
                     *		// For example, you can add a filter to the query
                     *		const previousCallback = sapConfigForPO.sapFilterBuilder;
                     * 		sapConfigForPO.sapFilterBuilder = (queryResult, ldapFilter) => {
                     *			return `( ( ${previousCallback(queryResult, ldapFilter)} ) AND ERNAM = 'CARRIER' )`;
                     *		};
                     *		return sapConfigForPO;
                     * 	};
                     * </code></pre>
                     */
                    BrowseSapPO.CustomizeQueryParams = (sapConfigForPO) => {
                        return sapConfigForPO;
                    };
                    /**
                     * Executes a query to retrieve purchase order records based on the provided parameters.
                     *
                     * @method Lib.OC.Customization.Client.BrowseSapPO.SapQuery
                     * @description Executes a query to retrieve purchase order records based on the provided parameters.
                     * @since 328
                     * @param callback - A function that is called once the query is executed.
                     * @param table - The name of the table to query.
                     * @param attributes - The attributes to retrieve from the table.
                     * @param filter - The filter to apply to the query.
                     * @param sortOrder - The order in which to sort the results.
                     * @param maxRecords - The maximum number of records to retrieve.
                     * @param config - The configuration object for the query.
                     * @param option - Additional options for the query.
                     * @param ctrl - The control to use for the query.
                     * @returns {void}
                     * @example
                     * <pre><code>
                     * 	export const SapQuery = (callback: (result: QueryResult) => void, table: string, attributes: string, filter: string, sortOrder: string, maxRecords: number, config: any, option: string, ctrl: DatabaseComboBox): void =>
                     * 	{
                     * 		const sapConfigForPlant =
                            {
                                sapConfigName: config.sapConfigName,
                                sapTableName: "EKPO",
                                
                                sapField2FFFieldMapping:
                                {
                                    EBELN: "OrderNumber__",
                                    WERKS: "Z_Plant__",
                                },
                                sapSearchFields:
                                {
                                    EBELN: "EBELN"
                                },
                                sapAdditionalFields:
                                [
                                    "WERKS"
                                ],
                                ffFieldKey: "OrderNumber__"
                            };
                        
                            config.sapField2FFFieldMapping["BSART"] =
                            {
                                ffField: "Z_Plant__",
                                sapConfig: sapConfigForPlant
                            };
                                
                            Sys.ERP.SAP.Browse.SapQuery(callback, table, attributes, filter, sortOrder, maxRecords, config, option, ctrl);
                     * 	};
                     * </code></pre>
                     */
                    /*
                    export const SapQuery = (callback: (result: QueryResult) => void, table: string, attributes: string, filter: string, sortOrder: string, maxRecords: number, config: any, option: string, ctrl: DatabaseComboBox): void =>
                    {
                    };
                    */
                })(BrowseSapPO = Client.BrowseSapPO || (Client.BrowseSapPO = {}));
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = OC.Customization || (OC.Customization = {}));
    })(OC = Lib.OC || (Lib.OC = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_OC_CUSTOMIZATION_CLIENT_SAMPLE.js.map