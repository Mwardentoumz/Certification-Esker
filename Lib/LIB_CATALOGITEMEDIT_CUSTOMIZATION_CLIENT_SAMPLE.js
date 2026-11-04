"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CATALOGITEMEDIT_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library for catalog item edit customization on client side",
  "versionable": false,
  "require": []
}*/
/**
 * Package Order Confirmation Client script customization callbacks
 * @namespace Lib.CatalogItemEdit.Customization.Client
 */
var Lib;
(function (Lib) {
    var CatalogItemEdit;
    (function (CatalogItemEdit) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.CatalogItemEdit.Customization.Client.OnLoad
                 * @since 335
                 * @description
                 * This function will be called at the end of process loading.
                 * should return a promise object if you need to perform asynchronous operations.
                 * @example
                 * <pre><code>
                 * OnLoad: function ()
                 * {
                 *		const vendorDisplayedColumns = Controls.VendorItems__.VendorName__.GetDisplayedColumns();
                 * 		Controls.VendorItems__.VendorName__.SetDisplayedColumns(vendorDisplayedColumns + "|Z_CustomField__");
                 * }
                 * </code></pre>
                 */
                Client.OnLoad = function () {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = CatalogItemEdit.Customization || (CatalogItemEdit.Customization = {}));
    })(CatalogItemEdit = Lib.CatalogItemEdit || (Lib.CatalogItemEdit = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CATALOGITEMEDIT_CUSTOMIZATION_CLIENT_SAMPLE.js.map