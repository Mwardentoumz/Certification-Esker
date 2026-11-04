"use strict";
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_TABLES_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending P2P scripts",
  "versionable": false,
  "require": []
}*/
/**
 * P2P packages script customization callbacks
 * @namespace Lib.P2P.Customization.Tables.Client
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var Tables;
            (function (Tables) {
                var Client;
                (function (Client) {
                    /**
                     * HTML (custom script) common user exits for all custom tables
                     * These user exits can be called by any custom table customscript using:
                     * - Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd")
                     * @namespace Lib.P2P.Customization.Tables.Client.Common
                     */
                    let Common;
                    (function (Common) {
                        /**
                         * @method Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd
                         * @description
                         * This user exit is called at the end of each custom table customscripts.
                         * Can be used to apply common finishing logic that applies to all custom tables or conditioned on one or more.
                         * @since 337
                         * @example
                         * <caption>Disable Save button for users without account management role for table "AP - Purchase order - Headers__" </caption>
                         * Common.OnHTMLScriptEnd = function ()
                         * {
                         *      var tableName = Process.GetName();
                         *  	if( tableName === "AP - Purchase order - Headers__"){
                         * 			Controls.Save.SetDisabled(User.profileRole !== "accountManagement");
                         * 		}
                         * };
                         */
                        Common.OnHTMLScriptEnd = function () {
                        };
                    })(Common = Client.Common || (Client.Common = {}));
                    /**
                     * HTML (custom script) AP - Vendors__ table customization
                     * Used in the 'AP - Vendors__' table customscript
                     * @namespace Lib.P2P.Customization.Tables.Client.Vendors
                     */
                    let Vendors;
                    (function (Vendors) {
                        /**
                         * @method Lib.P2P.Customization.Tables.Client.Vendors.OnHTMLScriptEnd
                         * @deprecated since 337 - Use Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd method conditioned on vendors table
                         * @description
                         * This user exit is called at the end of the AP - Vendors__ table customscript.
                         * @since 327
                         * @example
                         * <caption>Update custom field on OnChange event</caption>
                         * Vendors.OnHTMLScriptEnd = function ()
                         * {
                         *		Controls.Z_CustomField__.SetRequired(true);
                         *		Controls.Z_CustomField__.OnChange = function ()
                         *		{
                         *			Data.SetValue("Z_CustomField2__", this.GetValue());
                         *		};
                         * };
                         */
                        Vendors.OnHTMLScriptEnd = function () {
                        };
                    })(Vendors = Client.Vendors || (Client.Vendors = {}));
                    /**
                     * HTML (custom script) PurchasingSupply__ table customization
                     * Used in the 'PurchasingSupply__' table customscript
                     * @namespace Lib.P2P.Customization.Tables.Client.PurchasingSupply
                     */
                    let PurchasingSupply;
                    (function (PurchasingSupply) {
                        /**
                         * @method Lib.P2P.Customization.Tables.Client.PurchasingSupply.OnHTMLScriptBegin
                         * @description
                         * This user exit is called at the beginning of the PurchasingSupply__ table customscript.
                         * @since 334
                         * @example
                         * <caption>Update custom field on OnChange event</caption>
                         * PurchasingSupply.OnHTMLScriptBegin = function ()
                         * {
                         *		Controls.Z_CustomField__.SetRequired(true);
                         *		Controls.Z_CustomField__.OnChange = function ()
                         *		{
                         *			Data.SetValue("Z_CustomField2__", this.GetValue());
                         *		};
                         * };
                         */
                        PurchasingSupply.OnHTMLScriptBegin = function () {
                        };
                        /**
                         * @method Lib.P2P.Customization.Tables.Client.PurchasingSupply.OnHTMLScriptEnd
                         * @deprecated since 337 - Use Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd method conditioned on vendors table
                         * @description
                         * This user exit is called at the end of the PurchasingSupply__ table customscript.
                         * @since 334
                         * @example
                         * <caption>Update custom field on OnChange event</caption>
                         * PurchasingSupply.OnHTMLScriptEnd = function ()
                         * {
                         *		Controls.Z_CustomField__.SetRequired(true);
                         *		Controls.Z_CustomField__.OnChange = function ()
                         *		{
                         *			Data.SetValue("Z_CustomField2__", this.GetValue());
                         *		};
                         * };
                         */
                        PurchasingSupply.OnHTMLScriptEnd = function () {
                        };
                    })(PurchasingSupply = Client.PurchasingSupply || (Client.PurchasingSupply = {}));
                    /**
                     * HTML (custom script) P2P - User properties__ table customization
                     * Used in the 'P2P - User properties__' table customscript
                     * @namespace Lib.P2P.Customization.Tables.Client.UserProperties
                     */
                    let UserProperties;
                    (function (UserProperties) {
                        /**
                         * @method Lib.P2P.Customization.Tables.Client.UserProperties.OnHTMLScriptBegin
                         * @description
                         * This user exit is called at the end of the P2P - User properties__ table customscript.
                         * @since 334
                         * @example
                         * <caption>Update custom field on OnChange event</caption>
                         * UserProperties.OnHTMLScriptBegin = function ()
                         * {
                         *		Controls.Z_CustomField__.SetRequired(true);
                         *		Controls.Z_CustomField__.OnChange = function ()
                         *		{
                         *			Data.SetValue("Z_CustomField2__", this.GetValue());
                         *		};
                         * };
                         */
                        UserProperties.OnHTMLScriptBegin = function () {
                        };
                        /**
                         * @method Lib.P2P.Customization.Tables.Client.UserProperties.OnHTMLScriptEnd
                         * @deprecated since 337 - Use Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd method conditioned on vendors table
                         * @description
                         * This user exit is called at the end of the P2P - User properties__ table customscript.
                         * @since 334
                         * @example
                         * <caption>Update custom field on OnChange event</caption>
                         * UserProperties.OnHTMLScriptEnd = function ()
                         * {
                         *		Controls.Z_CustomField__.SetRequired(true);
                         *		Controls.Z_CustomField__.OnChange = function ()
                         *		{
                         *			Data.SetValue("Z_CustomField2__", this.GetValue());
                         *		};
                         * };
                         */
                        UserProperties.OnHTMLScriptEnd = function () {
                        };
                    })(UserProperties = Client.UserProperties || (Client.UserProperties = {}));
                    /**
                     * HTML (custom script) P2P - Warehouse__ table customization
                     * Used in the 'P2P - Warehouse__' table customscript
                     * @namespace Lib.P2P.Customization.Tables.Client.Warehouses
                     */
                    let Warehouses;
                    (function (Warehouses) {
                        /**
                         * @typedef {object} Lib.P2P.Customization.Tables.Client.Warehouses.StockTableColumnFilter
                         * @description
                         * Describes the field mappings between the catalog tables ('P2P - CatalogItems__' and 'P2P - VendorItems__') and the 'StockTable__' table on the 'P2P - Warehouses__'.
                         * @since 341
                         * @property {string} type The name of the field.
                         * @property {"contains" | "startsWith"} operator The operator used to build the filer that associate the field name and the value.
                         */
                        /**
                         * @method Lib.P2P.Customization.Tables.Client.Warehouses.GetCatalogToStockTableMap
                         * @description This user exit declare the custom mapping to fill the 'StockTable__' columns from the Catalog tables query results fields.
                         * Please also declare the catalog custom fields in the {@link Lib.P2P.Customization.Common.GetExtraCatalogProperties} user exit.
                         * @since 341
                         * @returns {Record<string, Lib.P2P.Customization.Tables.Client.Warehouses.StockTableColumnFilter>} A map of object that describes the catalog fields customizations.
                         * @example
                         * <caption>Define the custom mapping where : keys are the name of the StockTable__ columns</caption>
                         * Warehouses.GetCatalogToStockTableMap = function ()
                         * {
                         *		return {
                         *			"Z_CustomTableField__": {
                         *				name: "Z_Custom_Catalog_Header_Field__", // name of the field in the catalog table
                         *				operator: "startsWith", // operator used in the catalog query from the table filter
                         *				type: "catalog" // field from the "P2P - CatalogItems__" table
                         *			},
                         *			"Z_CustomItemField__": {
                         *				name: "Z_Custom_Warehouse_Field__", // name of the field in the catalog table
                         *				operator: "contains", // operator used in the catalog query from the table filter
                         *				type: "warehouse" // field from the "P2P - VendorItems__" table
                         *			}
                         *		};
                         * };
                         */
                        Warehouses.GetCatalogToStockTableMap = function () {
                        };
                    })(Warehouses = Client.Warehouses || (Client.Warehouses = {}));
                })(Client = Tables.Client || (Tables.Client = {}));
            })(Tables = Customization.Tables || (Customization.Tables = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_TABLES_CLIENT_SAMPLE.js.map