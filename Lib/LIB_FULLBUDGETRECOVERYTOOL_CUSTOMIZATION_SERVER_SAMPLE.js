"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "LIB_FULLBUDGETRECOVERYTOOL_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Full Budget Recovery Tool validation process",
  "versionable": false,
  "require": []
}*/
/**
 * @namespace Lib.FullBudgetRecoveryTool.Customization.Server
 */
var Lib;
(function (Lib) {
    var FullBudgetRecoveryTool;
    (function (FullBudgetRecoveryTool) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.FullBudgetRecoveryTool.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to perform operations after the Full Budget Recovery Tool process validation. This user exit is called at the end of the validation script of the Full Budget Recovery Tool process.
                 * @since 350
                 * @example
                 * <pre><code>
                 *	OnValidationScriptEnd: function ()
                 *	{
                 *		Log.Info("ValidationScript called");
                 *	};
                 * </code></pre>
                 */
                Server.OnValidationScriptEnd = function () {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = FullBudgetRecoveryTool.Customization || (FullBudgetRecoveryTool.Customization = {}));
    })(FullBudgetRecoveryTool = Lib.FullBudgetRecoveryTool || (Lib.FullBudgetRecoveryTool = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_FULLBUDGETRECOVERYTOOL_CUSTOMIZATION_COMMON_SAMPLE.js.map