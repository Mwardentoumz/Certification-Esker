"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_RO_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Return Order scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * @namespace Lib.RO.Customization.Client
 * @description Package Return Order client script customization callbacks
 */
var Lib;
(function (Lib) {
    var RO;
    (function (RO) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.RO.Customization.Client.CustomizeLayout
                 * @description Allows you to customize the Return Order process form. This user exit is called from the HTML page script of the Return Order process, after loading the form.
                 * 		This user exit is typically used to customize:
                 * 			Objects from the included script libraries.
                 * 			Objects from the HTML page script.
                 * @since 360
                 * @example
                 * The following user exit hides the comment column in the line items table.
                 * <pre><code>
                 *	CustomizeLayout: function ()
                 *	{
                 *		Controls.LineItems__.Comment__.Hide(true);
                 *	}
                 * </code></pre>
                 */
                Client.CustomizeLayout = function () {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = RO.Customization || (RO.Customization = {}));
    })(RO = Lib.RO || (Lib.RO = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_RO_CUSTOMIZATION_CLIENT_SAMPLE.js.map