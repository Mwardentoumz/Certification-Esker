"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_OC_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending P2P scripts",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Order Confirmation customization callbacks
 * @namespace Lib.OC.Customization.Common
 */
var Lib;
(function (Lib) {
    var OC;
    (function (OC) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.OC.Customization.Common.IsItemQuantityChangeAllowed
                 * @description Allows you to check the item quantity when the item has been modified on a submitted order confirmation.
                 * 		This user exit is called when validating the editing of the Order confirmation process.
                 * @since 317
                 * @param {*} item Data.Item object representing the item to check.
                 * @returns {boolean|null} Boolean value specifying if the new item quantity is validated.
                 * @example
                 * This user exit validates an item quantity if it has not increased by more than 5.
                 * <pre><code>
                 * IsItemQuantityChangeAllowed = function (item)
                 *	{
                 *		if (!!item)
                 *		{
                 *			return item.GetValue("ItemQuantity__") <= item.GetValue("ItemRequestedQuantity__") + 5;
                 *		}
                 *		return false;
                 *	}
                 * </code></pre>
                 */
                /* export const IsItemQuantityChangeAllowed = (item: Item): boolean | null =>
                {
                    return null; // disallow change
                }; */
                /**
                 * @method Lib.OC.Customization.Common.IsItemUnitPriceChangeAllowed
                 * @description Allows you to check the item unit price when the item has been modified on a submitted order confirmation.
                 * 		This user exit is called when validating the editing of the Order confirmation process.
                 * @since 317
                 * @param {Item} item Data.Item object representing the item to check.
                 * @returns {boolean|null} Boolean value specifying if the new item unit price is validated.
                 * @example
                 * This user exit validates an item unit price if it is less than twice the original unit price.
                 * <pre><code>
                 * IsItemUnitPriceChangeAllowed = function (item)
                 *	{
                 *		if (!!item)
                 *		{
                 *			return item.GetValue("ItemUnitPrice__") <= item.GetValue("ItemRequestedUnitPrice__") * 2;
                 *		}
                 *		return false;
                 *	}
                 * </code></pre>
                 */
                /* export const IsItemUnitPriceChangeAllowed = (item: Item): boolean | null =>
                {
                    return null; // disallow change
                }; */
                /**
                 * @namespace Lib.OC.Customization.Common.FillPODataFromLocalPO
                 * @description Specific to Local PO using
                 */
                let FillPODataFromLocalPO;
                (function (FillPODataFromLocalPO) {
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromLocalPO.CustomizeAttributeMapping
                     * @description Allows you to customize the attribute mapping for filling purchase order data on Order Confirmation.
                     * 		This user exit is called when initializing the attribute mapping.
                     * @since 327
                     * @param {Lib.Purchasing.ModuleOC.PODataCommonAttributes} headerAttributeMapping Object representing the attribute mapping for header fields.
                     * @param {Lib.Purchasing.ModuleOC.PODataByLineAttributes} itemAttributeMapping Object representing the attribute mapping for item fields.
                     * @returns {void} No return... !!! The reference of the object is given as parameter you must use the object's properties to apply your custom mapping (and not override the reference) !!!.
                     * @example
                     * This user exit adds mapping for two custom fields on header & item.
                     * <pre><code>
                     * CustomizeAttributeMapping = function (headerAttributeMapping, itemAttributeMapping)
                     *	{
                     *		// Mapping for header fields [OC Header Field = PO Field]
                     *		headerAttributeMapping["Z_FactoryName__"] = "Z_FactoryName__";
                     *
                     *		// Mapping for item fields [OC Item Field = PO Field]
                     *		itemAttributeMapping["Z_FactoryDepartment"] = "Z_ItemFactoryDepartment";
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromLocalPO.CustomizeAttributeMapping = (headerAttributeMapping, itemAttributeMapping) => {
                    };
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromLocalPO.CustomizeQueryParams
                     * @description Allows you to customize the query parameters used to run the Query on PO CDL table.
                     * 		This user exit is called just before the query execution.
                     * @since 327
                     * @param {Sys.GenericAPI.PromisedQueryParameters} params Object representing the query parameters to execute the Query.
                     * @returns {void} No return... !!! The reference of the object is given as parameter you must use the object's properties to apply your customization !!!.
                     * @example
                     * This user exit adds 2 new attributes to the query parameters to get data from a custom field.
                     * <pre><code>
                     * CustomizeQueryParams = function (params)
                     *	{
                     *		// Add custom fields to the query parameters
                     *		params.attributes.push("Z_FactoryName__");
                     *		params.attributes.push("Z_FactoryDepartment__");
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromLocalPO.CustomizeQueryParams = (params) => {
                    };
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromLocalPO.PromisedQuery
                     * @description Allows you to override the query to get PO Data, can also be helpfull to manage data after the query.
                     * 		This user exit will override the standard query if something is returned.
                     * @since 327
                     * @param {Sys.GenericAPI.PromisedQueryParameters} params Object representing the query parameters to execute the query.
                     * @returns {Promise<Sys.GenericAPI.QueryResult[]>} You must return a promise with the result of the query.
                     * @example
                     * This user exit initialize a custom field based on the query result.
                     * <pre><code>
                     * PromisedQuery = function (params)
                     *	{
                     *		return Sys.GenericAPI.PromisedQuery(params).Then((records: Sys.GenericAPI.QueryResult[]) => {
                     *			if (records && records.length > 0)
                     *			{
                     *				records.forEach((record) => {
                     *					if (record["Z_FactoryName__"])
                     *					{
                     *						Data.SetValue("Z_FromFactory", true);
                     *					}
                     *				});
                     *			}
                     *			return records;
                     *		});
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromLocalPO.PromisedQuery = (params) => {
                        return null;
                    };
                })(FillPODataFromLocalPO = Common.FillPODataFromLocalPO || (Common.FillPODataFromLocalPO = {}));
                /**
                 * @namespace Lib.OC.Customization.Common.FillPODataFromAPPOTables
                 * @description Specific to not local PO using (replicate in AP PO Tables)
                 */
                let FillPODataFromAPPOTables;
                (function (FillPODataFromAPPOTables) {
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromAPPOTables.CustomizeAttributeMapping
                     * @description Allows you to customize the attribute mapping for filling purchase order data on Order Confirmation.
                     * 		This user exit is called when initializing the attribute mapping.
                     * @since 327
                     * @param {Lib.Purchasing.ModuleOC.PODataCommonAttributes} headerAttributeMapping Object representing the attribute mapping for header fields.
                     * @param {Lib.Purchasing.ModuleOC.PODataByLineAttributes} itemsAttributeMapping Object representing the attribute mapping for item fields.
                     * @returns {void} No return... !!! The reference of the object is given as parameter you must use the object's properties to apply your custom mapping (and not override the reference) !!!.
                     * @example
                     * This user exit adds mapping for two custom fields on header & item.
                     * <pre><code>
                     * CustomizeAttributeMapping = function (headerAttributeMapping, itemAttributeMapping)
                     *	{
                     *		// Mapping for header fields [OC Header Field = AP PO Header Field]
                     *		headerAttributeMapping["Z_FactoryName__"] = "Z_FactoryName__";
                     *
                     *		// Mapping for item fields [OC Item Field = AP PO Item Field]
                     *		itemAttributeMapping["Z_FactoryDepartment"] = "Z_ItemFactoryDepartment";
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromAPPOTables.CustomizeAttributeMapping = (headerAttributeMapping, itemsAttributeMapping) => {
                    };
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromAPPOTables.CustomizeQueryParams
                     * @description Allows you to customize the query parameters used to run the Query on AP PO Header table & AP PO Item table.
                     * 		This user exit is called just before the query execution.
                     * @since 327
                     * @param {Sys.GenericAPI.PromisedQueryParameters} headerQueryParams Object representing the query parameters to execute the AP PO Header Query.
                     * @param {Sys.GenericAPI.PromisedQueryParameters} itemsQueryParams Object representing the query parameters to execute the AP PO Item Query.
                     * @returns {void} No return... !!! The reference of the object is given as parameter you must use the object's properties to apply your customization !!!.
                     * @example
                     * This user exit adds 2 new attributes to the query parameters to get data from a custom field.
                     * <pre><code>
                     * CustomizeQueryParams = function (headerQueryParams, itemsQueryParams)
                     *	{
                     *		// Add custom fields to the query parameters
                     *		headerQueryParams.attributes.push("Z_FactoryName__");
                     *		itemsQueryParams.attributes.push("Z_FactoryDepartment__");
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromAPPOTables.CustomizeQueryParams = (headerQueryParams, itemsQueryParams) => {
                    };
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromAPPOTables.PromisedQuery
                     * @description Allows you to override the queries to get PO Data, can also be helpfull to manage data after the query.
                     * 		This user exit will override the standard queries if something is returned.
                     * @since 327
                     * @param {Sys.GenericAPI.PromisedQueryParameters} headerQueryParams Object representing the query parameters to execute the AP PO Header Query.
                     * @param {Sys.GenericAPI.PromisedQueryParameters} itemsQueryParams Object representing the query parameters to execute the AP PO Item Query.
                     * @param {Function} recordsMergeFunction Function to merge header data in each item.
                     * @returns {Promise<Sys.GenericAPI.QueryResult[]>} You must return a promise with the result of the query.
                     * The result of the query must be an array of item records containing header data (see recordsMergeFunction).
                     * @example
                     * This user exit executes both queries with standard parameter and initializes a OC Header field depending records Data.
                     * Also initializes Z_FactoryDepartment__ field on each item with the value of Z_FactoryName__ if Z_FactoryDepartment__ is null or empty.
                     * <pre><code>
                     * PromisedQuery = function (headerQueryParams, itemsQueryParams, recordsMergeFunction)
                     *	{
                     *		const poHeaderQueryPromise = Sys.GenericAPI.PromisedQuery(headerQueryParams);
                     *
                     *		const poItemsQueryPromise = Sys.GenericAPI.PromisedQuery(itemsQueryParams);
                     *
                     *		Promise.all([poHeaderQueryPromise, poItemsQueryPromise]).Then(promiseResult => {
                     *			const poHeaderRecords = promiseResult[0];
                     *			const poItemsRecords = promiseResult[1];
                     *
                     *			// call records merge function to merge header data in each item
                     *			const poItems = recordsMergeFunction(poHeaderRecords, poItemsRecords);
                     *
                     *			poItems.forEach(item =>
                     *			{
                     *				// Set OC Header checkbox to true if is from Factory
                     *				if (item["Z_FactoryDepartment__"] && item["Z_FactoryDepartment__"] != "")
                     *				{
                     *					Data.SetValue("Z_FromFactory", true);
                     *				}
                     *				// Set OC Header checkbox to true if is from factory & fallback on FactoryName if FactoryDepartment is null or empty
                     *				else if (item["Z_FactoryName__"] && item["Z_FactoryName__"] != "")
                     *				{
                     *					Data.SetValue("Z_FromFactory", true);
                     *					item["Z_FactoryDepartment__"] = item["Z_FactoryName__"];
                     *				}
                     *				// Set OC Header checkbox to false if is not from Factory
                     *				else
                     *				{
                     *					Data.SetValue("Z_FromFactory", false);
                     *				}
                     *			});
                     *			return poItems;
                     *		});
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromAPPOTables.PromisedQuery = (headerQueryParams, itemsQueryParams, recordsMergeFunction) => {
                        return null;
                    };
                })(FillPODataFromAPPOTables = Common.FillPODataFromAPPOTables || (Common.FillPODataFromAPPOTables = {}));
                /**
                 * @method Lib.OC.Customization.Common.CustomizeConfirmedFieldsDefinition
                 * @description Allows you to customize the mapping between ordered fields and the actual confirmed fields in the LineItems__ table.
                 * This user exit will override the standard mapping. The fields added will be managed as standard fields.
                 * @param {Lib.Purchasing.ModuleOC.ConfirmedFieldsDefinition} orderedToConfirmedMapping
                 * @since 327
                 * @returns {void | Promise<void>}
                 * @example
                 * This user exit adds a custom field definition for the custom Z_Plant__ field. As this is a specific field, we need to redefine the IsUpdated, IsRejected, and Validate functions.
                 * <pre><code>
                 * 	CustomizeConfirmedFieldsDefinition: (orderedToConfirmedMapping: Lib.Purchasing.ModuleOC.ConfirmedFieldsDefinition) =>
                 * 	{
                 * 		// Here, we add a field definition for the custom Z_Plant__ field so that it is managed in the same way as standard fields.
                 * 		const Z_PlantFieldDefinition: Lib.Purchasing.OC.POData.ConfirmedFieldDefinition = new Lib.Purchasing.OC.POData.ConfirmedFieldDefinition({
                 * 			orderedFieldName: "Z_Plant__",
                 * 			confirmedFieldName: "Z_Plant__",
                 * 			IsUpdated: (item: Item, index: number, table: ITable): boolean | Promise<boolean> =>
                 * 			{
                 * 				// Here, we redefine IsUpdated to remove spaces before comparing the strings, so changes are ignored if only spaces are different.
                 * 				const headerPlant: string = Data.GetValue<string>("Z_Plant__")?.replace(/[\s\t\r\n]+/g, "");
                 * 				const linePlant: string = item.GetValue<string>("Z_Plant__")?.replace(/[\s\t\r\n]+/g, "");
                 * 				return Sys.Helpers.String.CompareString(headerPlant, linePlant) !== 0;
                 * 			},
                 * 			IsRejected: (item: Item, index: number, table: ITable): boolean | Promise<boolean> =>
                 * 			{
                 * 				// Here, we redefine IsRejected to consider the line as rejected if no plant is provided for the line.
                 * 				const linePlant: string = item.GetValue<string>("Z_Plant__");
                 * 				return Sys.Helpers.IsEmpty(linePlant);
                 * 			},
                 * 			Validate: (item: Item, index: number, table: ITable): void | Promise<void> =>
                 * 			{
                 * 				// Here, we redefine Validate to check if the plant provided in the header is different from the one in the line.
                 * 				const headerPlant: string = Data.GetValue("Z_Plant__");
                 * 				const linePlant: string = item.GetValue("Z_Plant__");
                 * 				const isSameFactory: boolean = headerPlant.split(" - ")[0] === linePlant.split(" - ")[0];
                 * 				if (!isSameFactory)
                 * 				{
                 * 					const errorMessage: Lib.P2P.ErrorMessage = "Factory must be the same, only sector can change";
                 * 					Lib.P2P.SetErrorMessage("Z_ConfirmedPlant", errorMessage, item);
                 * 				}
                 * 			},
                 * 			ApplyOnlyIf: (item: Item, index: number, table: ITable): boolean =>
                 * 			{
                 * 				// Here, we redefine ApplyOnlyIf to apply this mapping only for strategic orders requiring plant filling.
                 * 				return Sys.Helpers.Data.IsTrue(item.GetValue("Z_FactoryOrder__"));
                 * 			}
                 * 		});
                 *
                 * 		orderedToConfirmedMapping.fields.push(Z_PlantFieldDefinition);
                 *
                 * 		return;
                 * 	}
                 * </code></pre>
                 */
                Common.CustomizeConfirmedFieldsDefinition = async (orderedToConfirmedMapping) => {
                    return;
                };
                /**
                 * @namespace Lib.OC.Customization.Common.FillPODataFromSapPO
                 */
                let FillPODataFromSapPO;
                (function (FillPODataFromSapPO) {
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromSapPO.CustomizeAttributeMapping
                     * @description Allows you to customize the attribute mapping for filling purchase order data on Order Confirmation.
                     * 		This user exit is called when initializing the attribute mapping.
                     * @since 327
                     * @param {Lib.Purchasing.OC.POData.PODataCommonAttributes} headerAttributeMapping Object representing the attribute mapping for header fields.
                     * @param {Lib.Purchasing.ModuleOC.PODataByLineAttributes} itemsAttributeMapping Object representing the attribute mapping for item fields.
                     * @returns {void} No return... !!! The reference of the object is given as parameter you must use the object's properties to apply your custom mapping (and not override the reference) !!!.
                     * @example
                     * This user exit adds mapping for two custom fields on header & item.
                     * <pre><code>
                     * FillPODataFromSapPO.CustomizeAttributeMapping = function (headerAttributeMapping, itemAttributeMapping)
                     *	{
                     *		// Mapping for header fields [OC Header Field = SAP PO Header Field]
                            headerAttributeMapping["Z_Plant__"] = "Z_Plant__";
                     *
                     *		// Mapping for item fields [OC Item Field = SAP PO Item Field]
                     *		itemAttributeMapping["Z_FactoryDepartment"] = "Z_ItemFactoryDepartment";
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromSapPO.CustomizeAttributeMapping = (headerAttributeMapping, itemsAttributeMapping) => {
                    };
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromSapPO.CustomizeQueryParams
                     * @description Customizes BAPI parameters from QuerySAPPOData in Lib.Purchasing.OC.POData.
                     * More informations here: https://www.se80.co.uk/sap-function-modules-pre-ecc/b/bapi/bapi_po_getdetail.htm
                     * @returns {void} No return - reference of the object is given as a parameter. Do nit override the reference
                     * @example
                     * <pre><code>
                     * FillPODataFromSapPO.CustomizeAttributeMapping = function (bapiParams)
                     * {
                     * 		// Customize the prefix of the purchase order number
                     * 		bapiParams.EXPORTS.PURCHASEORDER = Sys.Helpers.String.SAP.NormalizeID("3000" + orderNumber, 10, null, true);
                     * 		bapiParams.EXPORTS.HISTORY = "";
                     * 		bapiParams.EXPORTS.SERVICES = "X";
                     * 		bapiParams.EXPORTS.ITEMS = "X";
                     * }
                     * </code></pre>
                     */
                    FillPODataFromSapPO.CustomizeQueryParams = (bapiParams) => {
                    };
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromSapPO.PromisedQuery
                     * @description allow you to return poRecords from a custom sapConfig, bapiParams. You can also specify another BAPI than BAPI_PO_GETDETAIL.
                     * @param {string} sapConfig SAP configuration to use for the query.
                     * @param {object} bapiParams BAPI parameters to use for the query.
                     * @returns {Promise<any>} Promise with the poRecords (you can find a description in Lib.Purchasing.OC.POData).
                     * @example
                     * <pre><code>
                     * // Before, edit the BAPI parameters using Lib.OC.Customization.Common.FillPODataFromSapPO.CustomizeQueryParams
                     * // then, do the query using the wanted BAPI
                     * // finally, build the records.
                     * // Don't forget that Lib.OC.Customization.Common.FillPODataFromSapPO.BuildRecords will not be called on package-side if you use this UE,
                     * // so if you want to use it, you have to call it manually.
                     * // This example replace the current call on the BAPI_PO_GETDETAIL with a call on the BAPI_PO_GETDETAIL1.
                     * // https://www.sapdatasheet.org/abap/func/bapi_po_getdetail1.html
                     * FillPODataFromSapPO.PromisedQuery = async function (sapConfig, bapiParams)
                     * {
                     * 		const orderNumber = Data.GetValue("OrderNumber__");
                     *		const poDetails = await Sys.GenericAPI.PromisedSAPCallBapi(sapConfig, "BAPI_PO_GETDETAIL1" as any, bapiParams) as any;
                     *		const bapiReturn = poDetails.TABLES.RETURN;
                     *		if (bapiReturn)
                     *		{
                     *			let err = "";
                     *			for (let idx = 0; idx < bapiReturn.length; idx++)
                     *			{
                     *				const ret = bapiReturn[idx];
                     *				const type = ret.TYPE;
                     *				if (type === "E" || type === "A")
                     *				{
                     *					err += `Message #${idx}: [${type}/${ret.ID}/${ret.NUMBER}] ${ret.MESSAGE}\n`;
                     *				}
                     *			}
                     *			if (err)
                     *			{
                     *				Log.Verbose("[QuerySAPPOData] No record found for the given order number.");
                     *				Log.Verbose(err);
                     *				return null;
                     *			}
                     *		}
                     *
                     *		const poItems = poDetails.TABLES.POITEM.filter(item => item.DELETE_IND !== 'X');
                     *		if (poItems.length === 0)
                     *		{
                     *			Log.Info(`Purchase Order #${orderNumber} does not contain any valid items`);
                     *			return null;
                     *		}
                     *
                     *		const poHeader = poDetails.IMPORTS.POHEADER;
                     *		const vendorNumber = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(poHeader.VENDOR);
                     *		const shipToAddress = await Lib.Purchasing.OC.POData.GetSapPOItemShipTo(poItems[0], poDetails.IMPORTS.POSHIPPINGEXP.COUNTRY);
                     *
                     *		let poRecords = poItems.map((item) =>
                     *		{
                     *			const itemHistory = poDetails.TABLES.POHISTORY_TOTALS.find(h => h.POITEM === item.POITEM && h.SERIALNUMBER === "00");
                     *			const itemSchedule = poDetails.TABLES.POSCHEDULE.find(s => s.POITEM === item.POITEM);
                     *			const record =
                     *			{
                     *				// Header
                     *				OrderNumber__: orderNumber,
                     *				CompanyCode__: poHeader.COMP_CODE,
                     *				VendorNumber__: vendorNumber,
                     *				VendorName__: "",
                     *				Currency__: itemHistory?.CURRENCY || poHeader.CURRENCY,
                     *				OrderDate__: Sys.Helpers.Date.SapDate2DBDate(poHeader.DOC_DATE),
                     *				ShipToAddress__: shipToAddress,
                     *				// Items
                     *				ItemType__: "",
                     *				LineItemNumber__: Sys.Helpers.String.SAP.TrimLeadingZeroFromID(item.PO_ITEM),
                     *				ItemDescription__: item.SHORT_TEXT,
                     *				ItemOrderedDeliveryDate__: itemSchedule ? Sys.Helpers.Date.SapDate2DBDate(itemSchedule.DELIV_DATE) : "",
                     *				ItemOrderedQuantity__: item.QUANTITY,
                     *				ItemTotalDeliveredQuantity__: itemHistory?.DELIV_QTY || 0,
                     *				ItemInvoicedQuantity__: itemHistory?.IVVAL_LOC || 0,
                     *				ItemOrderedUnitPrice__: item.NET_PRICE,
                     *				ItemUnit__: item.PO_UNIT_ISO,
                     *				ItemOrderedNetAmount__: item.NET_PRICE,
                     *				ItemReceivedAmount__: itemHistory?.VAL_GR_LOC || 0,
                     *				ItemInvoicedAmount__: itemHistory?.IVVAL_LOC || 0,
                     *				ItemCurrency__: itemHistory?.CURRENCY || poHeader.CURRENCY
                     *			};
                     *			return {
                     *				record,
                     *				GetValue(fieldName: string)
                     *				{
                     *					const value = this.record[fieldName];
                     *					return Sys.Helpers.IsEmpty(value) ? "" : value;
                     *				}
                     *			};
                     *		});
                     *		return poRecords;
                     * }
                     * </code></pre>
                     */
                    /*
                    export const PromisedQuery = async (sapConfig: string, bapiParams: any): Promise<any> =>
                    {
                    };
                    */
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromSapPO.BuildRecords
                     * @description Build the records from the PO details and the PO items.
                     * @param {Object} poRecords PO records to build to return
                     * @param {Object} poDetails PO details from the BAPI.
                     * @returns {Object} PO records with the custom fields added.
                     * @example
                     * <pre><code>
                     * FillPODataFromSapPO.BuildRecords = function (poRecords, poDetails)
                     * {
                     *	 	const poItems = poDetails.TABLES.PO_ITEMS.filter(item => item.DELETE_IND !== 'X');
            
                     *		// Add Z_Plant__ field to each record for example
                     *		poRecords.forEach((poRecord: any) =>
                     *		{
                     *			const item = poItems.find(item => Sys.Helpers.String.SAP.TrimLeadingZeroFromID(item.PO_ITEM) === poRecord.GetValue("LineItemNumber__"));
                     *			poRecord.record.Z_Plant__ = item?.PLANT || "";
                     *		});
                     *
                     *		return poRecords;
                     *	}
                     * </code></pre>
                     */
                    FillPODataFromSapPO.BuildRecords = (poRecords, poDetails) => {
                        return null;
                    };
                    /**
                     * @method Lib.OC.Customization.Common.FillPODataFromSapPO.SAPGetItemType
                     * @description Allows you to get the item type from the SAP PO item. See https://www.sapdatasheet.org/abap/tabl/bapimepoitem-item_cat.html
                     * @param {Object} item PO item to get the type from.
                     * @param {Object} poHeader PO header to get the type from.
                     * @returns {string} Item type from the SAP PO item.
                     * @example
                     * <pre><code>
                     * FillPODataFromSapPO.SAPGetItemType = function (item, poHeader)
                     * {
                     * 		switch (item.ITEM_CAT)
                     * 		{
                     * 			case "D":
                     * 			case "F":
                     * 				return "ServiceBased";
                     * 			case "L":
                     * 				return "AmountBased";
                     * 			default:
                     * 				return "QuantityBased";
                     * 		}
                     * }
                     * </code></pre>
                     */
                    FillPODataFromSapPO.SAPGetItemType = (item, poHeader) => {
                        return "";
                    };
                })(FillPODataFromSapPO = Common.FillPODataFromSapPO || (Common.FillPODataFromSapPO = {}));
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = OC.Customization || (OC.Customization = {}));
    })(OC = Lib.OC || (Lib.OC = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_OC_CUSTOMIZATION_COMMON_SAMPLE.js.map