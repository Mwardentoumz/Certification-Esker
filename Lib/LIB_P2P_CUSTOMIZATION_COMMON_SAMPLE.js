"use strict";
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending P2P scripts",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * P2P packages script customization callbacks
 * @namespace Lib.P2P.Customization.Common
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.P2P.Customization.Common.GetCustomOrderTransmissionMethods
                 * @description Returns custom transmission methods for the PR popup, PO form and automatic PO extraction. Standard methods are added by the application. This user exit must return synchronously.
                 * @returns {Array<{value: string, label: string}>} Custom method keys and their display labels.
                 * @example
                 * GetCustomOrderTransmissionMethods: function ()
                 * {
                 *	return [{ value: "MyCustomTransmission", label: "My custom transmission" }];
                 * }
                 */
                Common.GetCustomOrderTransmissionMethods = function () {
                    return [];
                };
                /**
                 * In order to synchronize a custom field between all procurement processes, you should add the following lines
                 * Details of the structure can be find in Lib_Purchasing_Items.Config
                 * For more information, refer to 'Adding custom fields in Procurement processes' in the documentation
                 * @since 331 : 'catalogName' property is available and only works to synchronize the fields from the PurchasingSupply__ table to the purchasing processes, and must be returned by the "GetCustomFields" User Exit below
                 * @since 346 : 'prType', 'poType', 'grType' properties are available
                 * @since 349: 'ignoreMultipleValuesAtHeaderLevel' property is available in 'options' property
                 */
                /*
                const customFields = [
                    {name: "Z_FromPRToGR__", pacType: "header", cloned: true},
                    {name: "Z_LineField__", pacType: "line", cloned: true},
                    {prName: "Z_FromPRToPO__", poName: "Z_FromPRToPO__", pacType: "header", cloned: true},
                    {poName: "Z_FromPOToGR__", grName: "Z_FromPOToGR__", pacType: "header", cloned: true},
                    {prName: "Z_FromPRHeaderToPOLine__", poName: "Z_POLine__", prType: "header", poType: "line", cloned: true},
                    {poName: "Z_FromPOLineToGRHeader__", grName: "Z_GRHeader__", poType: "line", grType: "header", cloned: true},
                    {prName: "Z_PRHeader__", poName: "Z_POHeader__", grName: "Z_GRHeader__", prType: "header", poType: "header", grType: "header", cloned: true},
                    {prName: "Z_PRLine__", poName: "Z_POLine__", grName: "Z_GRLine__", prType: "line", poType: "line", grType: "line", cloned: true},
                    {name: "Z_DoNotClone__", pacType: "header", cloned: false},
            
                    {prName: "Z_Field1__", poName: "Z_FromPRToPO__", prType: "header", poType: "line", options:{ignoreMultipleValuesAtItemLevel: true}},
                    {prName: "Z_Field2__", poName: "Z_FromPRToPO__", pacType: "line", options:{ignoreMultipleValuesAtItemLevel: true}},
            
                    {name: "Z_IgnoreMultipleValueHeader__", prType: "line", poType: "header", options:{ignoreMultipleValuesAtHeaderLevel: true}}
                ];
                */
                Common.customFields = [];
                if (Lib.Purchasing && Lib.Purchasing.Items) {
                    Lib.Purchasing.Items.AddCustomFields(Common.customFields);
                }
                /**
                 * @method Lib.P2P.Customization.Common.GetCustomFields
                 * @returns {Array<CustomField>} A JavaScript Array containing objects that define the mapping between PurchasingSupply__ table fields and the purchasing processes
                 * @since 331
                 * @description Describe the mappings between the purchasing processes.
                 * Details of the structure can be find in Lib_Purchasing_Items.Config
                 * For more information, refer to 'Adding custom fields in the Purchasing processes' in the documentation
                 * Since 332: 'catalogName' and 'prName' properties can be used to retrieve custom catalog fields or catalog joint fields.
                 * Fields must be properly declared in User Exit Lib.P2P.Customization.Common.GetExtraCatalogProperties
                 * @example
                 * This user exit fills:
                 *  * the "Z_SameName__" of the PR Line Items with the value in the "Z_SameName__" field of the PurchasingSupply__ table
                 *  * the "Z_ItemSubGLAccount__" of the PR Line Items with the value in the "Z_SubGLAccount__" field of the PurchasingSupply__ table
                 *  * the "Z_CopiedEveryWhere__" of the PR/PO/GR Line Items with the value in the "Z_EveryWhere__" field of the PurchasingSupply__ table
                 *  * the "Z_CatalogFieldPR__" of the PR Line Items with the value in the "Z_CatalogField__" field of the P2P - CatalogItems__ table
                 *  * the "Z_CustomFieldVendor__" of the PR Line Items with the value in the "Z_CustomFieldVendor__" field of the P2P - Vendors__ table
                 *
                 * <pre><code>
                 *	Common.GetCustomFields: function ()
                 *	{
                 *  	return [
                 * 			{ catalogName: "SupplyTypeID__.Z_SameName__", prName: "Z_SameName__", pacType: "line", cloned: true },
                 * 			{ catalogName: "SupplyTypeID__.Z_SubGLAccount__", prName: "Z_ItemSubGLAccount__", pacType: "line", cloned: true },
                 * 			{ catalogName: "SupplyTypeID__.Z_EveryWhere__", name: "Z_CopiedEveryWhere__", pacType: "line", cloned: true },
                 * 			{ catalogName: "Z_CatalogField__", prName: "Z_CatalogFieldPR__", pacType: "line", cloned: true },
                 * 			{ catalogName: "ItemNumber__.VendorNumber__.Z_VendorField__", prName: "Z_VendorField__", pacType: "line", cloned: true }
                 *  	];
                 *	}
                 * </code></pre>
                 */
                Common.GetCustomFields = function () {
                    return Common.customFields;
                };
                /**
                 * @method Lib.P2P.Customization.Common.GetVendorsExtraFilter
                 * @description Allows you to customize the filter used when browsing for vendors in Purchase Requisition, Purchase Order, Contract processes. This user exit is typically used to hide some vendors from the browse dialog, under the conditions of your choice. This user exit is called from the HTML Page script of the process, when browsing for vendors.
                 * @since 116
                 * @return {array} Array of LDAP filters. The conjunction (AND operation) of all the filters in the array is applied to the list of vendors.
                 * @example
                 * <caption>This user exit excludes from the browse dialog the vendors who have a name starting with HID.</caption>
                 * Common.GetVendorsExtraFilter = function()
                 * {
                 * 	return [ "(!(Name__=HID*))" ];
                 * };
                 */
                Common.GetVendorsExtraFilter = function () {
                };
                /**
                 * @typedef {Object} CustomDimensionGeneric
                 * @memberof Lib.P2P.Customization.Common
                 * @property {string} nameInTable The name of the field in the master data table.
                 * @property {string} nameInForm The name of the field in the line item table.
                 * @property {string} [nameInPOForm] The name of the field in the line item table of the Purchase Order process, if it differs from its name in the Vendor invoice process.
                 * @property {Object} fieldPropertiesInBrowsePage The parameters to display the added dimensions in the purchase order browse dialog.
                 * @property {boolean} fieldPropertiesInBrowsePage.isVisible Whether the field is visible in the purchase order browse dialog.
                 * @property {number} fieldPropertiesInBrowsePage.width The width of the field in the purchase order browse dialog.
                 */
                /**
                 * @typedef {Object} CustomDimensionCodeTemplate
                 * @memberof Lib.P2P.Customization.Common
                 * @property {string} nameInTable The name of the field in the master data table.
                 * @property {string} nameInForm The name of the field in the line item table.
                 */
                /**
                 * @typedef {Object} CustomDimensionSAP
                 * @memberof Lib.P2P.Customization.Common
                 * @property {string} nameInSAP The name of the field in the SAP table.
                 * @property {string} nameInForm The name of the field in the line item table.
                 * @property {Object} fieldPropertiesInBrowsePage The parameters to display the added dimensions in the purchase order browse dialog.
                 * @property {boolean} fieldPropertiesInBrowsePage.isVisible Whether the field is visible in the purchase order browse dialog.
                 * @property {number} fieldPropertiesInBrowsePage.width The width of the field in the purchase order browse dialog.
                 * @property {function} fieldFormatter The function to format the field value.
                 */
                /**
                 * @typedef {Object} CustomDimensions
                 * @memberof Lib.P2P.Customization.Common
                 * @property {CustomDimensionGeneric[]} [poItems] The list of the dimensions to add from the purchase order items. (since 339, also for SAPS4)
                 * @property {CustomDimensionGeneric[]} [poHeader] The list of the dimensions to add from the purchase order headers. (since 260, also for SAPS4 since 339)
                 * @property {CustomDimensionGeneric[]} [poItemAccountAssignment] The list of the dimensions to add from the purchase order item account assignment for SAPS4.
                 * @property {CustomDimensionGeneric[]} [grItems] The list of the dimensions to add from the goods and services receipt items. (since 339, also for SAPS4)
                 * @property {CustomDimensionCodeTemplate[]} [codingTemplates] The list of the dimensions to add from the coding templates.
                 * @property {Object} [poSAPItems] The list of the dimensions to add from the SAP tables.
                 * @property {CustomDimensionSAP[]} [poSAPItems.PO_ITEMS] The list of the dimensions to add from the PO_ITEMS table.
                 * @property {CustomDimensionSAP[]} [poSAPItems.PO_HEADER] The list of the dimensions to add from the PO_HEADER table.
                 * @property {CustomDimensionSAP[]} [poSAPItems.PO_ADDRESS] The list of the dimensions to add from the PO_ADDRESS table.
                 * @property {CustomDimensionSAP[]} [poSAPItems.PO_ITEM_ACCOUNT_ASSIGNMENT] The list of the dimensions to add from the PO_ITEM_ACCOUNT_ASSIGNMENT table.
                 */
                /**
                 * @method Lib.P2P.Customization.Common.GetCustomDimensions
                 * @description Allows you to add dimensions to associate with the invoice line items in the Line items table.
                 * You can also use it to:
                 * - Display the added dimensions in the purchase order browse dialog.
                 * - Save the added dimensions in the P2P - Assignment templates table.
                 * The fields for the added dimensions are filled in with data from either the P2P - Purchase order - Items, the P2P - Purchase order - Headers or the P2P - Goods and services receipt items master table during extraction. This user exit is called from the HTML Page script and from the extraction script in the Vendor invoice process.
                 * @since 132
                 * @returns {Lib.P2P.Customization.Common.CustomDimensions}
                 * The customDimensions JavaScript object that contains:
                 * - The list of the dimensions to add.
                 * - The names of the fields for the dimensions to add in the corresponding master data table.
                 * - CAUTION : The field names must be unique accross the P2P - Purchase order - Items and the P2P - Goods and services receipt items. If both tables have a field named CustomField1 for example and both field are returned by this user exit, they will both contain data from the goods receipt table in the Vendor invoice process, regardless of the fact they have different names in the destination form.
                 * - The names of the fields for the dimensions to add in the Line items table of the Vendor invoice and Purchase Order processes. (nameInForm)
                 * - Optionally the name of the fields for the dimenstion to add in the Line items table of Purchase Order processes if it differs for its name in the Line items table of the Vendor invoice. (nameInPOForm)
                 * - The parameters to display the added dimensions in the purchase order browse dialog.
                 * - The parameters to save the added dimensions in the P2P - Assignment templates table.
                 *
                 * @example
                 * <caption>For an application integrated with SAP, this user exit adds the following dimensions to the Line items table:
                 * - The asset information dimension.
                 * - Plant dimension.
                 * - Store location dimension.
                 * - Account assignment dimension.</caption>
                 * Common.GetCustomDimensions = function()
                 * {
                 * 	return {
                 *		poItems:
                 *		[
                 *			{
                 *				nameInTable: "AssetId__",
                 *				nameInForm: "POAssetId__",
                 *				fieldPropertiesInBrowsePage:
                 *				{
                 *					isVisible: true,
                 *					width: 90
                 *				}
                 *			},
                 *			{
                 *				nameInTable: "AssetDescription__",
                 *				nameInForm: "POAssetDescription__",
                 *				nameInPOForm: "POAssetDescriptionItem__"
                 *			}
                 *		],
                 *		poHeader:
                 *		[
                 *			{
                 *				nameInTable: "DocumentType__",
                 *				nameInForm: "PODocumentType__",
                 *				fieldPropertiesInBrowsePage:
                 *				{
                 *					isVisible: true,
                 *					width: 90
                 *				}
                 *			},
                 *			{
                 *				nameInTable: "DocumentDescription__",
                 *				nameInForm: "PODocumentDescription__",
                 *				nameInPOForm: "PODocumentDescriptionHeader__"
                 *			}
                 *		],
                 *		poItemAccountAssignment:
                 *		[
                 *			{
                 *				nameInTable: "GLAccount__",
                 *				nameInForm: "GLAccount__"
                 *			}
                 *		],
                 *		grItems:
                 *		[
                 *			{
                 *				nameInTable: "AssetId__",
                 *				nameInForm: "GRAssetId__",
                 *				fieldPropertiesInBrowsePage:
                 *				{
                 *					isVisible: true,
                 *					width: 90
                 *				}
                 *			},
                 *			{
                 *				nameInTable: "AssetDescription__",
                 *				nameInForm: "GRAssetDescription__"
                 *			}
                 *		],
                 *		codingTemplates:
                 *		[
                 *			{
                 *				nameInTable: "TplAssetId__",
                 *				nameInForm: "POAssetId__"
                 *			},
                 *			{
                 *				nameInTable: "TplAssetDescription__",
                 *				nameInForm: "POAssetDescription__"
                 *			}
                 *		],
                 *		poSAPItems:
                 *		{
                 *			PO_ITEMS:
                 *			[
                 *				{
                 *					nameInSAP: "PLANT",
                 *					nameInForm: "Z_Plant__",
                 *					fieldPropertiesInBrowsePage:
                 *					{
                 *						isVisible: true,
                 *						width: 90
                 *					}
                 *				},
                 *				{
                 *					nameInSAP: "STORE_LOC",
                 *					nameInForm: "Z_StoreLoc__",
                 *					fieldFormatter: Sys.Helpers.String.SAP.TrimLeadingZeroFromID
                 *				}
                 *			],
                 *			PO_HEADER:
                 *			[
                 *				{
                 *					nameInSAP: "DOC_TYPE",
                 *					nameInForm: "Z_PO_DocType__",
                 *					fieldPropertiesInBrowsePage:
                 *					{
                 *						isVisible: true,
                 *						width: 60
                 *					}
                 *				}
                 *			],
                 *			PO_ITEM_ACCOUNT_ASSIGNMENT:
                 *			[
                 *				{
                 *					nameInSAP: "ASSET_NO",
                 *					nameInForm: "Z_AssetNumber__",
                 *					fieldFormatter: Sys.Helpers.String.SAP.TrimLeadingZeroFromID,
                 *					fieldPropertiesInBrowsePage:
                 *					{
                 *						isVisible: true,
                 *						width: 90
                 *					}
                 *				}
                 *			]
                 *		}
                 * };
                 */
                Common.GetCustomDimensions = function () {
                    return null;
                };
                /**
                * @method Lib.P2P.Customization.Common.GetPOLineItemNumberFieldName
                * @description Allows you to customize the field that carries the PO line number in case the PO is created remotely in an ERP and cannot be stored in the standard ItemNumber__ field
                * 		This user exit is called when in the following contexts :
                * 			- the validation script of the Purchase Order process is triggered by the "OnInvoicePost" action
                * 			- the validation script of the Vendor Invoice  process is triggered by the "continueaftererpack" action to retrieve the previous budget ids
                * 			- the validation script of the Full Budget Recovery Tool
                * @return {string} String the name of the column in the Purchase Order that matches the Line Number stored in the ItemNumber__ column of the VIP
                * @example Returns a custom column name wherein the calculated line item number is stored. The custom field must exist in the PO process as well as in the AP - Purchase order - Items__ table
                *	GetPOLineItemNumberFieldName: function(formData: IData | xFormData): string
                * 	{
                * 		return "Z_CustomItemNumber__";
                *	}
                */
                /**
                * @method Lib.P2P.Customization.Common.CustomizePreviousBudgetIDQueryParameters
                * @description Allows you to customize the parameters passed to the PromisedQuery call when the Vendor invoice is retrieveing the previous budget IDs
                * @return {Sys.GenericAPI.PromisedQueryParameters<ESKMap<any>, ESKMapKeys<ESKMap<any>, any>>} Object the adapted query parameters
                * @example Returns updated query options in query parameters
                *	CustomizePreviousBudgetIDQueryParameters: function(parameters): string
                * 	{
                *		parameters.additionalOptions.queryOptions = ...
                *		return parameters;
                *	}
                */
                /**
                 * @typedef {object} Lib.P2P.Customization.Common.LegacyExtraCatalogProperties
                 * @description
                 * since 257, deprecated since 332 (use {@link Lib.P2P.Customization.Common.ExtraCatalogProperty} instead)
                 * * Declare new fields in both catalog tables : header level (table P2P - CatalogItems__) and item level (table P2P - VendorItems__)
                 * * These fields are added to the queries and automatically displayed on the catalog item details and in the 'Catalog Item Edit' forms.
                 * * Also allows to configure the CSV import/export for each fields
                 * @since 257
                 * @deprecated
                 * @property {string[]} catalogFields List of fields that belong to the catalog header (P2P - CatalogItems__ table).
                 * @property {string[]} catalogCSVFields Same as 'catalogFields' and additionally exported/imported from a CSV.
                 * @property {string[]} vendorFields List of fields that belong to the catalog 'vendor' item (P2P - VendorItems__ table)
                 * @property {string[]} vendorCSVFields Same as 'vendorFields' and additionally exported/imported from a CSV using the Catalog Management and Catalog Export processes.
                 * @property {string[]} warehouseFields List of fields that belong to the catalog 'warehouse' item (P2P - VendorItems__ table)
                 * @property {string[]} warehouseCSVFields Same as 'warehouseFields' and additionally exported/imported from a CSV using the 'P2P - Warehouses__' buttons.
                 */
                /**
                 * @typedef {object} Lib.P2P.Customization.Common.ExtraCatalogProperty
                 * @description
                 * Still supports features of {@link Lib.Purchasing.CatalogHelper.LegacyExtraCatalogProperties}:
                 * * Declare new fields in both catalog tables : header level (table P2P - CatalogItems__) and item level (table P2P - VendorItems__)
                 * * These fields are added to the queries and automatically displayed on the catalog item details and in the 'Catalog Item Edit' forms.
                 * * Also allows to configure the CSV import/export for each fields
                 * Since 332
                 * * Allows to configure if the field is searchable through the Purchase Requisition auto-completion
                 * * Allows to configure if the field is searchable when browsing the Catalog
                 * Since 335
                 * * Allows to customize the way the field is searched when browsing the Catalog
                 * @since 332
                 * @property {string} name The name of the field.
                 * @property {"catalog" | "supplier" | "warehouse"} type Indicates if the field belongs to the header or if it is part of the item (supplier or warehouse)
                 * @property {boolean} [csvIntegration] allows or prevents the field to be exported to and imported from a CSV file (Import won't work anyway for joint table fields other than "P2P - VendorItems__").
                 * If 'undefined' or not specified, the standard behavior is preserved.
                 * @property {boolean} [searchOnPR] allows or prevents the field to be searched via Purchase Requisition autocomplete.
                 * If 'undefined' or not specified, the standard behavior is preserved.
                 * @property {boolean} [searchOnCatalog] allows or prevents the field to be searched when browsing the catalog.
                 * If 'undefined' or not specified, the standard behavior is preserved.
                 * When 'true', each searchbar values will be searched in the field using `contains`
                 * @property {object} [advancedCatalogSearch] Since 335: Customize the way the field is searched in the catalog through the Searchar
                 * @property {string[]} advancedCatalogSearch.keyWords The different keywords usable in the catalog SearchBar by the user to associate a specific value with it
                 * * Each keyword supports only a single value
                 * * Associated with a value using the '=' symbol (e.g with the "Type" keyword : 'Type=ACME')
                 * * Using a keyword in the SearchBar will prevent the `searchOnCatalog` behavior for this field
                 * @property {"contains" | "equal" | "startsWith"} advancedCatalogSearch.operator The operator used to build the filer that associate the field name and the value
                 */
                /**
                 * @method Lib.P2P.Customization.Common.GetExtraCatalogProperties
                 * @description
                 * Allows to describe the customization on the P2P Catalog at both levels: header (table P2P - CatalogItems__) and supplier (table P2P - VendorItems__)
                 * and also to automatically transmit the data from the catalog item to the purchase requisition if both processes have a field with the exact same name
                 * @since 257
                 * @returns {Lib.P2P.Customization.Common.ExtraCatalogProperty[] | Lib.P2P.Customization.Common.LegacyExtraCatalogProperties} A table of objects that describe the catalog fields customizations.
                 * @example
                 * <pre><code>
                 * Common.GetExtraCatalogProperties = function ()
                 * {
                 * 	return [
                *		// Declares a new field 'Z_CatalogField__' in the item header (P2P - CatalogItems__) that cannot be exported or imported. It can be searched in Catalog and PR autocomplete.
                * 		{ name: "Z_CatalogField__", type: "catalog", csvIntegration: false, searchOnPR: true, searchOnCatalog: true },
                *		// Declares a new field 'Z_CatalogSupplierField__' in the item details (P2P - VendorItems__) that cannot be exported or imported. It can be searched in Catalog and PR autocomplete.
                * 		{ name: "Z_CatalogSupplierField__", type: "supplier", csvIntegration: false, searchOnPR: true, searchOnCatalog: true },
                *		// Declares a new field 'Z_VendorField__' in the item vendor joint table (P2P - Vendors__) that cannot be exported or imported. It can be searched in Catalog and PR autocomplete.
                * 		{ name: "VendorNumber__.Z_VendorField__", type: "supplier", csvIntegration: false, searchOnPR: true, searchOnCatalog: true },
                *		// Declares a new field 'Z_CatalogWarehouseField__' in the item details (P2P - VendorItems__) that cannot be exported or imported.
                * 		{ name: "Z_CatalogWarehouseField__", type: "warehouse", csvIntegration: false, searchOnPR: false, searchOnCatalog: false },
                *		// Declares a new field 'Z_CatalogFieldCSVUpdate__' in the item header (P2P - CatalogItems__) that can be exported and imported.
                * 		{ name: "Z_CatalogFieldCSVUpdate__", type: "catalog", csvIntegration: true, searchOnPR: false, searchOnCatalog: false },
                *		// Declares a new field 'Z_CatalogSupplierFieldCSVUpdate__' in the item details (P2P - VendorItems__) that can be exported and imported.
                * 		{ name: "Z_CatalogSupplierFieldCSVUpdate__", type: "supplier", csvIntegration: true, searchOnPR: false, searchOnCatalog: false },
                *		// Declares a new field 'Z_CatalogWarehouseFieldCSVUpdate__' in the item details (P2P - VendorItems__) that can be exported and imported.
                * 		{ name: "Z_CatalogWarehouseFieldCSVUpdate__", type: "warehouse", csvIntegration: true, searchOnPR: false, searchOnCatalog: false },
                *		// Declares a new field 'Z_CustomSearchField__' in the item details (P2P - VendorItems__) that will be search in the catalog if the user enter 'Custom=MyValue' in the Search Bar
                 * 		{ name: "Z_CustomSearchField__", type: "supplier", searchOnCatalog: true, advancedCatalogSearch: { keyWords: ["Custom"], operator: "startsWith" }}
                 * 	];
                 * };
                 * </code></pre>
                 */
                Common.GetExtraCatalogProperties = function () {
                    return [];
                };
                /**
                 * @method Lib.P2P.Customization.Common.GetCustomShipToConfiguration
                 * @description Allows you to extend the delivery address (PurchasingShipTo__) query and field mappings
                 * with custom fields. Use this user exit when you have extended the PurchasingShipTo__ table
                 * with custom columns (e.g., PlantID, Building, Floor) and need them loaded alongside the
                 * standard address fields in the Purchase Requisition and Purchase Order processes.
                 *
                 * This user exit is called once during library initialization from Lib_Purchasing_ShipTo.Base.
                 * @since 357
                 * @scope CLIENT_WEB|CLIENT_MOBILE|SERVER
                 * @param {Object} shipToFieldsMapping Maps PurchasingShipTo__ field names to header-level form field names.
                 * Add entries to map custom ShipTo table columns to custom header fields.
                 * @param {Object} itemShipToFieldsMapping Maps PurchasingShipTo__ field names to line item-level form field names.
                 * Add entries to map custom ShipTo table columns to custom line item fields.
                 * @param {Object} defaultQueryOptions The query options used to retrieve data from PurchasingShipTo__.
                 * Add custom field names to the `attributes` array to include them in queries.
                 * @example
                 * <caption>Extend delivery address with a PlantID field.
                 * The PurchasingShipTo__ table has been extended with a "Z_PlantID__" column.
                 * This maps it to "Z_Plant__" at header level and "Z_ItemPlant__" at line item level.</caption>
                 * Common.GetCustomShipToConfiguration = function (shipToFieldsMapping, itemShipToFieldsMapping, defaultQueryOptions)
                 * {
                 *     shipToFieldsMapping["Z_PlantID__"] = "Z_Plant__";
                 *     itemShipToFieldsMapping["Z_PlantID__"] = "Z_ItemPlant__";
                 *     defaultQueryOptions.attributes.push("Z_PlantID__");
                 * };
                 */
                Common.GetCustomShipToConfiguration = function (shipToFieldsMapping, itemShipToFieldsMapping, defaultQueryOptions) {
                    // No-op in standard. Override in LIB_P2P_CUSTOMIZATION_COMMON.
                };
                /**
                 * @typedef {Object} CheckPostalAddressOptions
                 * @memberof Lib.P2P.Customization.Common
                 * @property {boolean} isVariablesAddress Whether the address is a variable address.
                 * @property {Object} address The address to check.
                 * @property {string} address.ToName The name of the recipient.
                 * @property {string} address.ToSub The department of the recipient.
                 * @property {string} address.ToMail The email address of the recipient.
                 * @property {string} address.ToPostal The postal code of the recipient.
                 * @property {string} address.ToCountry The country of the recipient.
                 * @property {string} address.ToState The state of the recipient.
                 * @property {string} address.ToCity The city of the recipient.
                 * @property {boolean} address.ForceCountry Whether the country
                 * @property {string} countryCode The country code.
                 * @property {string} [language] The language code.
                 */
                /**
                 * @method Lib.P2P.Customization.Common.OnShipToAddressFormat
                 * @description Allows you to customize the delivery address format and to disable the usual checks on the postal address format.
                 * This user exit is called from the HTML Page script and from the extraction script in the Purchase Requisition process.
                 * @since 161
                 * @scope CLIENT_WEB|CLIENT_MOBILE|SERVER
                 * @param {CheckPostalAddressOptions} options JavaScript object specifying the options for checking if the postal address is valid
                 * @returns {(string|boolean)} a string containing the customized address. This disables the usual checks on the postal address format. The customized address can be an empty string.
                 * or false to perform the usual checks on the postal address format.
                 * @example
                 * <caption>For the MY01 company code, you have long postal addresses that often exceed the allowed address size limit. In such a case, the usual checks of the address format return an error.
                 * The following user exit allows you to disable the usual checks for addresses that are specific to this company code.</caption>
                 * Common.OnShipToAddressFormat = function (options)
                 * {
                 *	 var companyCode = Data.GetValue("CompanyCode__");
                 *	 if (companyCode === "MY01" && options.address.ToCountry === "US" && options.address.ToSub)
                 *	 {
                 *		 Log.Info("MY01 address detected: skipping the postal address check");
                 *		 return options.address.ToSub + "\n" +
                 *				options.address.ToMail + "\n" +
                 *				options.address.ToPostal + " " + options.address.ToCity + "\n" +
                 *				"USA";
                 *	 }
                 *	 else
                 *	 {
                 *		 // Performs the usual postal address check.
                 *		 return null;
                 *	 }
                 * };
                 */
                Common.OnShipToAddressFormat = function (options) {
                    return false;
                };
                /**
                 * @method Lib.P2P.Customization.Common.OnVendorAddressFormat
                 * @description Allows you to customize the vendor address format and to disable the usual checks on the postal address format.
                 * This user exit is called from the HTML Page script and from the extraction script in the Purchase Requisition and Purchase Order processes.
                 * @since 161
                 * @param {CheckPostalAddressOptions} options JavaScript object specifying the options for checking if the postal address is valid.
                 * @returns {(string|boolean)} a string containing the customized address. This disables the usual checks on the postal address format. The customized address can be an empty string.
                 * or false to perform the usual checks on the postal address format.
                 * @example
                 * <caption>For the MY01 company code, you have long postal addresses that often exceed the allowed address size limit. In such a case, the usual checks of the address format return an error.
                 * The following user exit allows you to disable the usual checks for addresses that are specific to this company code.</caption>
                 * Common.OnVendorAddressFormat = function (options)
                 * {
                 *	 var companyCode = Data.GetValue("CompanyCode__");
                 *	 if (companyCode === "MY01" && options.address.ToCountry === "US" && options.address.ToSub)
                 *	 {
                 *		 Log.Info("MY01 address detected: skipping the postal address check");
                 *		 return options.address.ToName + options.address.ToMail + options.address.ToPostal + options.address.ToCity;
                 *	 }
                 *	 else
                 *	 {
                 *		 // Performs the usual postal address check.
                 *		 return null;
                 *	 }
                 * };
                 */
                Common.OnVendorAddressFormat = function (options) {
                    return false;
                };
                /**
                 * @method Lib.P2P.Customization.Common.OnCompanyAddressFormat
                 * @description Allows you to customize the company address format and to disable the usual checks on the postal address format.
                 * This user exit is called from the HTML Page script and from the extraction script in the Purchase Order process.
                 * @since 331
                 * @param {CheckPostalAddressOptions} options JavaScript object specifying the options for checking if the postal address is valid.
                 * @returns {(string|boolean)} a string containing the customized address. This disables the usual checks on the postal address format. The customized address can be an empty string.
                 * or false to perform the usual checks on the postal address format.
                 * @example
                 * <caption>For the MY01 company code, you have long postal addresses that often exceed the allowed address size limit. In such a case, the usual checks of the address format return an error.
                 * The following user exit allows you to disable the usual checks for addresses that are specific to this company code.</caption>
                 * Common.OnCompanyAddressFormat = function (options)
                 * {
                 *	 var companyCode = Data.GetValue("CompanyCode__");
                 *	 if (companyCode === "MY01" && options.address.ToCountry === "US" && options.address.ToSub)
                 *	 {
                 *		 Log.Info("MY01 address detected: skipping the postal address check");
                 *		 return options.address.ToName + options.address.ToMail + options.address.ToPostal + options.address.ToCity;
                 *	 }
                 *	 else
                 *	 {
                 *		 // Performs the usual postal address check.
                 *		 return null;
                 *	 }
                 * };
                 */
                Common.OnCompanyAddressFormat = function (options) {
                    return false;
                };
                /**
                 * @method Lib.P2P.Customization.Common.OnChangeConfigurationEnd
                 * @description This function will be called just after configuration has been loaded.
                 *  If you return a promise object, we synchronize on it before calling function after.
                 * @since 291
                 * @param {string} newConfiguration New loaded configuration
                 * @scope CLIENT_WEB|SERVER
                 * @returns {Promise<any> | void}
                 */
                Common.OnChangeConfigurationEnd = function (newConfiguration) {
                };
                /**
                 * @method Lib.P2P.Customization.Common.GetSupplyTypeIdFromUNSPSC
                 * @description When an item is added to the purchase requisition from a punchout catalog that provides an UNSPSC code, the Purchasing application computes the corresponding item category based on the mappings stored in the `P2P - UNSPSC codes/item categories mapping` table. The following algorithm is used :
                 *
                 *  * If the UNSPSC code is 45111616 we start by looking for it in the mapping table,
                 *  * If it doesn't exist we look for its UNSPSC parent that is 45111600 (a UNSPSC category is encoded with two digits),
                 *  * If it still doesn't exist we look for the parent of the parent and so on, so we would be looking for a mapping item category for the following UNSPSC codes 45111616, 45111600, 45110000, 45000000 in that order.
                 *
                 * This user exit allows you to map a UNSPSC code to a different item category than the one computed using the above algorithm.
                 *
                 * @since 181
                 * @param {string} UNSPSCCode The UNSPSC code returned by the punchout catalog.
                 * @param {string} determinedSupplyTypeId The item category computed using the algorithm described above.
                 * @returns {string} A different item category you want to map the UNSPSC code to, or null if you want to keep `determinedSupplyTypeId`.
                 */
                Common.GetSupplyTypeIdFromUNSPSC = function (UNSPSCCode, determinedSupplyTypeId) {
                    return null;
                };
                /**
                 * @method Lib.P2P.Customization.Common.IsAdmin
                 * @description
                 * !!! EXPERIMENTAL - USE WITH CAUTION - PENDING RIGHT MANAGEMENT !!!
                 * Allows modifying what types of users are given admin level access to the procurement forms.
                 * @param {boolean} isAdmin Whether the current user's profile is considered an admin
                 * @return {boolean} If the current user should be given admin access to the form.
                 * @example
                 * Common.IsAdmin = function(isAdmin)
                 * {
                 *    // Only standard admin with login starting with 'admin' are considered admin
                 *    return isAdmin && /^admin/.test(User.loginId);
                 * }
                 */
                Common.IsAdmin = function (isAdmin) {
                    // !!! EXPERIMENTAL - USE WITH CAUTION - PENDING RIGHT MANAGEMENT !!!
                };
                /**
                 * @method Lib.P2P.Customization.Common.GetVendorScoreScale
                 * @description Allows you to configure the minimum and maximum value of the supplier score.
                 *
                 * Minimum and maximum must be integers.
                 *
                 * @since 306
                 * @returns {Object} { min: number; max: number }, representing the desired interval.
                 */
                Common.GetVendorScoreScale = () => {
                    return null;
                };
                /**
                 * @method Lib.PR.Customization.Client.GetVendorScoreThresholds
                 * @description Allows you to configure thresholds and the associated color of a threshold.
                 *
                 * A threshold is described by a maximum value and a color (#FFFFFF).
                 * Maximum must be an integer.
                 *
                 * @since 306
                 * @returns {Array<Object>} { maxVal: number; color: string }[], a array of thresholds.
                 */
                Common.GetVendorScoreThresholds = () => {
                    return null;
                };
                /**
                 * @typedef {Object} ScoreDefinition
                 * @memberof Lib.P2P.Customization.Common
                 * @property {string} valueType The type of the value returned by the extractor.
                 * @property {function} valueExtractor The function that returns the score used by thresholds.
                 * @property {string} provider The provider of the score.
                 * @property {string} type The type of the score.
                 * @property {string} labelKey The label of the score.
                 * @property {string} thresholdLabelKey The threshold of the score.
                 */
                /**
                 * @method Lib.P2P.Customization.Common.GetCustomScoreDefinitions
                 * @description see Lib.VM.InternalScoring.ScoreDefinition.stdScoreDefinitions for example.
                 * @since 315
                 * @returns {Map<string, ScoreDefinition>} a map of ScoreDefinition.
                 */
                Common.GetCustomScoreDefinitions = () => {
                    return {};
                };
                /**
                 * Specifics customization for vendor portal
                 * @namespace Lib.P2P.Customization.Common.VendorPortal
                 */
                let VendorPortal;
                (function (VendorPortal) {
                    /**
                     * @method Lib.P2P.Customization.Common.VendorPortal.GetVendorTemplate
                     * @since 268
                     * @description
                     * Allows you to specify which profile to use when creating a vendor (standard, manager or with invoices and/or orders visibility)
                     * @returns {Lib.P2P.Customization.Common.VendorPortal.VendorTemplate} the desired template to use
                     * @example
                     * Common.GetVendorTemplate = function ()
                     * {
                     * 	// use manager profile
                     * 	return "manager";
                     * };
                     */
                    VendorPortal.GetVendorTemplate = function () {
                        return null;
                    };
                })(VendorPortal = Common.VendorPortal || (Common.VendorPortal = {}));
                /**
                 * @method Lib.P2P.Customization.Common.IsGLLikeLineItem
                 * @since 316
                 * @description
                 * Determines whether the given item qualifies as a GL-like item
                 * @param {Item} item The item object to evaluate.
                 * @param {boolean} isGLLikeLineItem The current classification of the item as a GL-like item.
                 * @return {boolean} Returns `true` if the item is classified as a GL-like item, otherwise `false`.
                 * @example
                 * <pre><code>
                 * IsGLLikeLineItem: function(item, isGLLikeLineItem)
                 * {
                 *    return (item.GetValue("LineType__") === "XXX" || isGLLikeLineItem);
                 * }
                 * </code></pre>
                 */
                Common.IsGLLikeLineItem = function (item, isGLLikeLineItem) {
                };
                /**
                 * @method Lib.P2P.Customization.Common.DisablePOCurrencyExchangeRate
                 * @description
                 * Disables the system that converts the invoice line items amount to the PO currency
                 * @returns {boolean} Returns true if the feature is disabled
                 * @example
                 * <pre><code>
                 * DisableInvoiceCurrencyToPOCurrencyExchangeRate: function()
                 * {
                 * 	return true;
                 * }
                 * </code></pre>
                 */
                Common.DisablePOCurrencyExchangeRate = function () {
                };
                /**
                 * @method Lib.P2P.Customization.Common.CustomPOCurrencyExchangeRate
                 * @description
                 * Allows to custom the exchange rate
                 * @param {string} POCurrency the currency used to pass the order
                 * @returns {number} the exchange rate between the line item currency and the po
                 * @example
                 * <pre><code>
                 * CustomPOCurrencyExchangeRate: function(POCurrency)
                 * {
                 * 	if (POCurrency === "EUR" && Data.GetValue<string>("InvoiceCurrency__") === "USD")
                 * 	{
                 * 		return 1.15;
                 * 	}
                 * }
                 * </code></pre>
                 */
                Common.CustomPOCurrencyExchangeRate = function (POCurrency) {
                };
                /**
                 * @method Lib.P2P.Customization.Common.IsGPTDebugEnabled
                 * @since 330
                 * @description
                 * Allows to enable or disable debug mode for ChatGPT. Enabling debug mode will add logs and set external variables.
                 * @returns {boolean} true if debug mode is enabled, false otherwise
                 */
                Common.IsGPTDebugEnabled = function () {
                    return false;
                };
                /**
                 * @method Lib.P2P.Customization.Common.GetCurrencyPrecision
                 * @since 331
                 * @deprecated
                 * @description
                 * Modifies the precision of a currency.
                 * By default R&D use ISO 4217.
                 * To change default currency precision or add a new currency, you have to call Language.SetCurrencyPrecision as soon as possible on client and serverside script.
                 * @returns {number} return the number of digits after the point supported by this currency, between 0 and 4 decimal places.
                 */
                Common.GetCurrencyPrecision = function (currency) {
                    return null;
                };
                /**
                 * @method Lib.P2P.Customization.Common.HandleUnsupportedSAPPOItemDimension
                 * @description
                 * To use in complement of Lib.P2P.Customization.Common.GetCustomDimensions,
                 * Where are defined the mappings between the fields returned here and the VIP line item custom fields
                 *
                 * Allows you to handle custom SAP PO item dimensions that are not supported by default in the AddCustomDimensions function.
                 * You can use this function to return custom data objects for your specific SAP PO item dimensions.
                 * Called from both Client and Server side but watch out for the PO parameter type.
                 * * It will contain JSON objects on client side and SAPProxy objects/tables on server side.
                 * * Use Sys.ScriptInfo.IsClient() or Sys.ScriptInfo.IsServer() if you need to access data store in the PO parameter.
                 * @param {string} key - The custom dimension key from the poSAPItems configuration.
                 * @param {PurchaseOrder.PODetailsClient | PurchaseOrder.PODetailsServer} PO - The purchase order details object.
                 * @param {PurchaseOrder.POItemData} POItem - The purchase order item data.
                 * @returns {any} The custom data object for the specified dimension key, or null if not supported.
                 * @example
                 * <caption>This example shows how to handle "PO_ITEM_HISTORY" dimension (with hardcoded index 0):</caption>
                 * HandleUnsupportedSAPPOItemDimension = function(key, PO, POItem)
                 * {
                 *	switch (key)
                 *	{
                 *		case "PO_ITEM_HISTORY":
                 *			let firstGRDate = null;
                 *			if (!PO || !PO.PO_ITEM_HISTORY)
                 *			{
                 *				return {
                 *					PSTNG_DATE: firstGRDate
                 *				};
                 *			}
                 *
                 *			if (Sys.ScriptInfo.IsClient() && PO.PO_ITEM_HISTORY[0])
                 *			{
                 *				firstGRDate = Sys.Helpers.SAP.FormatFromSAPDateTimeFormat(PO.PO_ITEM_HISTORY[0].PSTNG_DATE);
                 *			}
                 *			else if (PO.PO_ITEM_HISTORY.Get(0))
                 *			{
                 *				// Server side
                 *				firstGRDate = Sys.Helpers.SAP.FormatFromSAPDateTimeFormat(PO.PO_ITEM_HISTORY.Get(0).GetValue("PSTNG_DATE"));
                 *			}
                 *
                 *			return {
                 *				PSTNG_DATE: firstGRDate
                 *			};
                 *		default:
                 *			return null;
                 *	}
                 * };
                 */
                Common.HandleUnsupportedSAPPOItemDimension = function (key, PO, POItem) {
                };
                /**
                 * @method Lib.P2P.Customization.Common.GetSSOUrl
                 * @description Allows you to customize the SSO URL used for Single Sign-On authentication. This user exit is called from the GetURLFromSSO function to determine whether to use a custom SSO URL or the standard SSO_URL parameter.
                 * @since 340
                 * @param {IUser} user The current user object
                 * @returns {string|any} If implemented and returns a string:
                 * - Empty string ("") - SSO_URL parameter will be ignored and the original URL will be returned as-is
                 * - Non-empty string - This custom URL will be used directly as the SSO URL
                 * For any other return type or if not implemented, the standard behavior applies (use SSO_URL parameter if user login type is not "Password")
                 * @example
                 * <caption>This user exit provides a custom SSO URL based on user properties or returns empty string to disable SSO for specific conditions.</caption>
                 * Common.GetSSOUrl = function(user)
                 * {
                 *     // Disable SSO for users with OrganizationId ending with IT_ADMIN
                 *     if (user.GetValue("OrganizationId").endsWith("IT_ADMIN")) {
                 *         return ""; // Return empty string to ignore SSO_URL parameter
                 *     }
                 *
                 *     // Use custom SSO URL for users with OrganizationId ending with EXTERNAL
                 *     if (user.GetValue("OrganizationId").endsWith("EXTERNAL")) {
                 *         return "https://external-sso.company.com";
                 *     }
                 *
                 *     // For all other cases, use standard behavior
                 *     return undefined;
                 * };
                 */
                Common.GetSSOUrl = function (user) {
                };
                /**
                 * @method Lib.P2P.Customization.Common.GetExchangeRates
                 * @description Allows to customize the exchange rates retrieval.
                 * This user exit is called by Lib.P2P.ExchangeRate.GetExchangeRates.
                 * If the user exit returns a non-null value, it is used as the result of GetExchangeRates.
                 * If the user exit returns null, the standard implementation of GetExchangeRates is executed.
                 * @memberof Lib.P2P.Customization.Common
                 * @param {string} companyCode The company code
                 * @param {string[]} currencies The currencies to retrieve
                 * @param {function} [callback] The callback to call when the result is ready (client side)
                 * @returns {ESKMap<number> | void} The exchange rates map or void to use standard implementation
                 * @example
                 * 	Common.GetExchangeRates(companyCode: string, currencies: string[], callback?: (result: ESKMap<string>[], err?: string) => void): ESKMap<number> | void
                 *	{
                 *		// Only for US Company code
                 *		if (companyCode === "US01")
                 *		{
                 *			const exchangeRates = {
                 *				"EUR": 0.85,
                 *				"USD": 1.0
                 *			};
                 *			// If asynchronous mode
                 *			if (callback)
                 *			{
                 *				// Fake result from query
                 *				const result = [
                 *					{ CurrencyFrom__: "EUR", Rate__: "0.85", RatioFrom__: "1", RatioTo__: "1" },
                 *					{ CurrencyFrom__: "USD", Rate__: "1.0", RatioFrom__: "1", RatioTo__: "1" }
                 *				];
                 *				callback(result, null);
                 *			}
                 *			return exchangeRates;
                 *		}
                 *	}
                 */
                function GetExchangeRates(companyCode, currencies, callback) {
                }
                Common.GetExchangeRates = GetExchangeRates;
                /**
                 * @method Lib.P2P.Customization.Common.OverrideCostTypeFromGLAccount
                 * @since 350
                 * @description
                 * Called inside `Lib.P2P.fillCostTypeFromGLAccount` after the cost type mapping has been resolved
                 * from the "P2P - G/L account to Cost type" table.
                 * Allows you to override the cost type value that will be set on the item.
                 * Return a cost type string to override the standard mapping (e.g., return `oldCostType` to keep the current value).
                 * Return `undefined` (default) to apply the standard cost type mapping.
                 * @param {Item} item The line item being processed.
                 * @param {string} oldCostType The current cost type value on the item (before overwrite).
                 * @param {string} newCostType The cost type value resolved from the GL account mapping table.
                 * @param {string} glAccount The current GL account value on the item.
                 * @returns {string | void} A cost type string to use instead of the standard mapping, or `undefined` to apply the standard behavior.
                 * @example <caption>Keep the existing cost type when it has been set by a custom logic</caption>
                 * Common.OverrideCostTypeFromGLAccount = function (item, oldCostType, newCostType, glAccount)
                 * {
                 *     // Keep the existing cost type if it was already set (e.g., by FillCostType user exit)
                 *     if (oldCostType && oldCostType !== "OpEx")
                 *     {
                 *         return oldCostType;
                 *     }
                 * };
                 */
                Common.OverrideCostTypeFromGLAccount = function (item, oldCostType, newCostType, glAccount) {
                };
                /**
                 * @method Lib.P2P.Customization.Common.CustomizeSapField2FFFieldMapping
                 * @since 353
                 * @description
                 * Allows to customize the mapping between SAP and EOD vendor fields
                 * @param {Record<string, string>} defaultMapping The default mapping between SAP and EOD vendor fields
                 * @returns {Record<string, string> | void} The customized mapping or void to use the default mapping
                 * @example <caption>Rework the VATNumber__ mapping</caption>
                 * Common.CustomizeSapField2FFFieldMapping = function (defaultMapping)
                 * {
                 *   delete defaultMapping.STCEG; // Remove the mapping for the field STCEG
                 *   defaultMapping.STCD1 = "VATNumber__";
                 *   return defaultMapping; // Return the customized mapping
                 */
                Common.CustomizeSapField2FFFieldMapping = function (defaultMapping) {
                };
                /**
                 * @method Lib.P2P.Customization.Common.IsSubmitWithInvalidShipToAddressAllowed
                 * @description Allows the form to be submitted with an invalid delivery address.
                 * @since 354
                 * @scope CLIENT_WEB|CLIENT_MOBILE|SERVER
                 * @param {Item} item In case of multiShipTo activated, called once per item. Else, called only once for the whole document and no parameter is given.
                 * @returns { boolean | null } Boolean value specifying if submit the form with an invalid delivery address is allowed.
                 * @example
                 * Common.IsSubmitWithInvalidShipToAddressAllowed = function()
                 * {
                 *	return true;
                 * };
                 */
                Common.IsSubmitWithInvalidShipToAddressAllowed = function (item) {
                    return null;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_COMMON_SAMPLE.js.map