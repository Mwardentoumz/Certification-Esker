"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_RO_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Return Order scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * @namespace Lib.RO.Customization.Server
 * @description Package Return Order server script customization callbacks
 */
var Lib;
(function (Lib) {
    var RO;
    (function (RO) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.RO.Customization.Server.OnExtractionScriptStart
                 * @description Allows you to customize the value of the fields available on the return order form.
                 * 		This user exit is called at the start of the extraction script of the Return Order process.
                 * @since 342
                 * @example
                 * <pre><code>
                 * 	OnExtractionScriptStart: function ()
                 * 	{
                 * 		// Sets custom field value at extraction start
                 * 	 	Data.SetValue("Z_CustomField__", "my custom value");
                 * 	}
                 * </code></pre>
                 */
                Server.OnExtractionScriptStart = async function () {
                };
                /**
                 * @method Lib.RO.Customization.Server.OnExtractionScriptEnd
                 * @description Allows you to customize the value of the fields available on the return order form.
                 * 		This user exit is called at the end of the extraction script of the Return Order process.
                 * @since 337
                 * @example
                 * <pre><code>
                 * 	OnExtractionScriptEnd: function ()
                 * 	{
                 * 		// Sets custom field value at extraction end
                 * 	 	Data.SetValue("Z_CustomField__", "my custom value");
                 * 	}
                 * </code></pre>
                 */
                Server.OnExtractionScriptEnd = async function () {
                };
                /**
                 * @method Lib.RO.Customization.Server.OnValidationScriptStart
                 * @description Allows you to customize the value of the fields available on the return order form.
                 * 		This user exit is called at the start of the validation script of the Return Order process.
                 * @since 342
                 * @example
                 * <pre><code>
                 * 	OnValidationScriptStart: function ()
                 * 	{
                 * 		// Sets custom field value at validation start
                 * 	 	Data.SetValue("Z_CustomField__", "my custom value");
                 * 	}
                 * </code></pre>
                 */
                Server.OnValidationScriptStart = async function () {
                };
                /**
                 * @method Lib.RO.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to customize the value of the fields available on the return order form.
                 * 		This user exit is called at the end of the validation script of the Return Order process.
                 * @since 342
                 * @example
                 * <pre><code>
                 * 	OnValidationScriptEnd: function ()
                 * 	{
                 * 		// Sets custom field value at validation end
                 * 	 	Data.SetValue("Z_CustomField__", "my custom value");
                 * 	}
                 * </code></pre>
                 */
                Server.OnValidationScriptEnd = async function () {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = RO.Customization || (RO.Customization = {}));
    })(RO = Lib.RO || (Lib.RO = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_RO_CUSTOMIZATION_SERVER_SAMPLE.js.map