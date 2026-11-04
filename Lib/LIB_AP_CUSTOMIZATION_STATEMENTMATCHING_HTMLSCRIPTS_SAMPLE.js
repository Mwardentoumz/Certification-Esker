"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_HTMLSCRIPTS_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP vendor statement customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * HTML (custom script) AP vendor statement customization callbacks
 * Used in the 'Vendor statement matching' process
 * @namespace Lib.AP.Customization.StatementMatching.HTMLScripts
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var StatementMatching;
            (function (StatementMatching) {
                var HTMLScripts;
                (function (HTMLScripts) {
                    /**
                     * @method Lib.AP.Customization.StatementMatching.HTMLScripts.OnHTMLScriptEnd
                     * @description
                     * This user exit is called at the end of the Vendor statement matching customscript, after all standard script has run.
                     * Allows you to customize the layout.
                     * @example
                     * <pre><code>
                     * OnHTMLScriptEnd: function ()
                     * {
                     *      const companyCode = Data.GetValue("CompanyCode__");
                     *      if (companyCode && Data.IsNullOrEmpty("Z_LowerCompanyCode__"))
                     *      {
                     *            Controls.Z_LowerCompanyCode__.SetValue(companyCode.toLowerCase());
                     *      }
                     * }
                     * </code></pre>
                     */
                    HTMLScripts.OnHTMLScriptEnd = function () {
                    };
                })(HTMLScripts = StatementMatching.HTMLScripts || (StatementMatching.HTMLScripts = {}));
            })(StatementMatching = Customization.StatementMatching || (Customization.StatementMatching = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_HTMLSCRIPTS_SAMPLE.js.map