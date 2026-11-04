"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "Lib_Contract_Customization_Client_Sample",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Contract scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Contract client script customization callbacks
 *
 * Timeline of user exit calls
 * ------------------
 * @namespace Lib.Contract.Customization.Client
 */
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.Contract.Customization.Client.OnLoad
                 * @description Allows you to customize the Contract process form. This user exit is called from the HTML page script of the Contract process, before loading the form and determining the workflow.
                 * 		This user exit is typically used to customize:
                 * 			Objects from the included script libraries.
                 * 			Objects from the HTML page script.
                 * @since 117
                 * @example
                 *  <pre><code>
                 * OnLoad: function ()
                 * {
                 *
                 * }
                 * </code></pre>
                 */
                Client.OnLoad = function () {
                };
                /**
                 * @method Lib.Contract.Customization.Client.CustomizeLayout
                 * @description Allows you to customize the Contract process form. This user exit is called from the HTML page script of the Contract process, after loading the form and determining the workflow.
                 *		This user exit is typically used to customize:
                 *		Objects from the included script libraries.
                 *		Objects from the HTML page script.
                 * @since 125
                 * @example
                 * <pre><code>
                 * </code></pre>
                 *
                */
                Client.CustomizeLayout = function () {
                };
                /**
                 * @method Lib.Contract.Customization.Client.OnUpdateLayout
                 * @description Allows you to customize the Contract process form. This user exit is called from the HTML page script of the Contract process, when the form layout is updated upon user modifications.
                 *		This user exit is typically used to customize:
                 *		Objects from the included script libraries.
                 *		Objects from the HTML page script.
                 * 		Note:
                 * 			We recommend that you use the CustomizeLayout user exit instead of the OnUpdateLayout user exit when possible.
                 * @see {@link Lib.Contract.Customization.Client.CustomizeLayout}
                 * @since 125
                */
                Client.OnUpdateLayout = function () {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = Contract.Customization || (Contract.Customization = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CONTRACT_CUSTOMIZATION_CLIENT_SAMPLE.js.map