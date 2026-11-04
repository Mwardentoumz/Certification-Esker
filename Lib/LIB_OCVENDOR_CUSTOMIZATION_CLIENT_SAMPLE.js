"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_OCVENDOR_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending order confirmation vendor scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Sys/Sys_FormTemplate_Manager"
  ]
}*/
/**
 * Package Order Confirmation Vendor Client script customization callbacks
 * @namespace Lib.OCVendor.Customization.Client
 */
var Lib;
(function (Lib) {
    var OCVendor;
    (function (OCVendor) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.OCVendor.Customization.Client.OnLoad
                 * @since 328
                 * @description
                 * This function will be called at the order confirmation vendor loading; just before calling the Start function.
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
                 * @method Lib.OCVendor.Customization.Client.CustomizeLayout
                 * @description Allows you to customize the Order Confirmation vendor process form. This user exit is called from the HTML page script of the Order Confirmation (vendor side) process, after loading the form.
                 * 		This user exit is typically used to customize:
                 * 		Objects from the included script libraries.
                 * 		Objects from the HTML page script.
                 * @since 321
                 * @param {Sys.FormTemplate.Manager} formTemplateManager Form template manager instance
                 * <pre><code>
                 * 		export const CustomizeLayout = function (formTemplateManager: Sys.FormTemplate.Manager): void
                 * 		{
                 * 			const customFormTemplate: Lib.Purchasing.OCVendor.FormTemplate.FormTemplate = // can be an array of templates too
                 * 				{
                 * 					name: "CUSTOMIZATION ",
                 * 					condition: (LineItems__: LineItems) => LineItems__.ItemType__ !== "AmountBased",
                 * 					modifications: [
                 * 						{ type: "setControlVisible", control: "ItemNetAmount__", table: "LineItems__", value: true },
                 * 						{ type: "setControlVisible", control: "ItemNetAmount__", table: "LineItems__", atRow: true, value: true }
                 * 					]
                 * 				};
                 * 			formTemplateManager.RegisterTemplate(customFormTemplate); // you can also pass an array of templates here
                 * 			formTemplateManager.Apply();
                 * 			return;
                 * 		};
                 * </code></pre>
                 */
                Client.CustomizeLayout = function (formTemplateManager) {
                    return;
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = OCVendor.Customization || (OCVendor.Customization = {}));
    })(OCVendor = Lib.OCVendor || (Lib.OCVendor = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_OCVENDOR_CUSTOMIZATION_CLIENT_SAMPLE.js.map