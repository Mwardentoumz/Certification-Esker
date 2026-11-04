"use strict";
/* LIB_DEFINITION{
  "name": "LIB_OCVENDOR_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending order confirmation vendor scripts on client and server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Order Confirmation Vendor common script customization callbacks
 * @namespace Lib.OCVendor.Customization.Common
 */
var Lib;
(function (Lib) {
    var OCVendor;
    (function (OCVendor) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.OCVendor.Customization.Common.IsItemQuantityChangeAllowed
                 * @description Allows you to check the item quantity when the item has been modified on a submitted order confirmation.
                 * 		This user exit is called when validating the editing of the Order confirmation vendor process.
                 * @since 328
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
                Common.IsItemQuantityChangeAllowed = (item) => {
                    return null;
                };
                /**
                 * @method Lib.OCVendor.Customization.Common.IsItemUnitPriceChangeAllowed
                 * @description Allows you to check the item unit price when the item has been modified on a submitted order confirmation.
                 * 		This user exit is called when validating the editing of the Order confirmation vendor process.
                 * @since 328
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
                Common.IsItemUnitPriceChangeAllowed = (item) => {
                    return null;
                };
                /**
                 * @method Lib.OCVendor.Customization.Common.GetOrderConfirmationTemplateName
                 * @description
                 * Allows you to specify the name of the template used to generate the order confirmation file. The template is a resource file in the Crystal Report (.rpt) format.
                 *
                 * @returns {string}
                 *
                 * String value containing the name of the order confirmation template file with its extension (.rpt).
                 *
                 * @example The following sample allows you to specify an order confirmation file when the tax code is available:
                 *
                 * GetOrderConfirmationTemplateName: function ()
                 * {
                 * 	// Get OC template set by default
                 * 	var OrderConfirmationTemplateName = Sys.Parameters.GetInstance("PAC").GetParameter("OrderConfirmationTemplateName");
                 * 	// Get value of attribute 'DisplayTaxCode'
                 * 	var isDisplayTaxCodeEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayTaxCode");
                 * 	if (isDisplayTaxCodeEnabled)
                 * 	{
                 * 		OrderConfirmationTemplateName = "My_Template_with_tax.rpt";
                 * 	}
                 * 	return OrderConfirmationTemplateName;
                 * }
                 *
                 */
                Common.GetOrderConfirmationTemplateName = function () {
                    return null;
                };
                /**
                 * @method Lib.OCVendor.Customization.Common.GetExtraOrderConfirmationRPTDataMapping
                 * @description
                 * Allows you to specify extra data to map in the template used to generate the order confirmation file.
                 *
                 * @returns {Object}
                 *
                 * Json object that defines data fields for the template
                 *
                 * @example The following sample allows you to specify a extra field in the mapping:
                 *
                 * GetExtraOrderConfirmationRPTDataMapping: function ()
                 * {
                 *  	return {
                 * 			tables: {
                 *				"LineItems__": {
                 *					table: "LineItems__",
                 *						fields: {
                 *							"Z_extraField__": "Z_extraField__"
                 *						}
                 * 					}
                 * 				}
                 * 			}
                 * 		}
                 * }
                 *
                 */
                Common.GetExtraOrderConfirmationRPTDataMapping = function () {
                    return {};
                };
                /**
                 * @method Lib.OCVendor.Customization.Common.CustomizeOCRPTData
                 * @description
                 * Allows you to customize the order confirmation data before generating the order confirmation file.
                 *
                 * @param {Lib.Purchasing.OCVendor.OCRPTData} data Order confirmation data
                 * @returns {Lib.Purchasing.OCVendor.OCRPTData} updated order confirmation data
                 *
                 * @example The following sample allows you to customize the order confirmation data:
                 *
                 * CustomizeOCRPTData: function (data)
                 * {
                 * 	if (data)
                 * 	{
                 * 		data.OrderConfirmationNumber = "OC-123456";
                 * 		data["Z_extraField__"] = "Extra field value";
                 * 	}
                 * 	return data;
                 * }
                 *
                 */
                Common.CustomizeOCRPTData = function (data) {
                    return data;
                };
                /**
                 * @method Lib.OCVendor.Customization.Common.OnAttachOrderConfirmation
                 * @description User exit called when the order confirmation is attached to the OCVendor process.
                 * @param attachIdx zero-based index of the attachment
                 */
                Common.OnAttachOrderConfirmation = function (attachIdx) {
                    return null;
                };
                /**
                 * @method Lib.OCVendor.Customization.Common.CustomizeConfirmedFieldsDefinition
                 * @description Allows you to customize the mapping between ordered fields and the actual confirmed fields in the LineItems__ table.
                 * This user exit will override the standard mapping. The fields added will be managed as standard fields.
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
                 * @param orderedToConfirmedMapping
                 */
                Common.CustomizeConfirmedFieldsDefinition = async (orderedToConfirmedMapping) => {
                    return;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = OCVendor.Customization || (OCVendor.Customization = {}));
    })(OCVendor = Lib.OCVendor || (Lib.OCVendor = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_OCVENDOR_CUSTOMIZATION_COMMON_SAMPLE.js.map