"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_ERP_CUSTOMIZATION_COMMON_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Common script ERP customization",
  "versionable": false,
  "require": []
}*/
/**
 * Package ERP common script customization callbacks
 * @namespace Lib.ERP.Customization.Common
 */
var Lib;
(function (Lib) {
    var ERP;
    (function (ERP) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.ERP.Customization.Common.OverrideERPFromRecord
                 * @since 330
                 * @description
                 * Allows you to override ERP found from record or define a default ERP if no ERP was found
                 * @param {string} ERPFound The ERP found on record
                 * @returns {string} the modified ERP
                 * @example <caption>Override ERP found from record</caption>
                 * Common.OverrideERPFromRecord = function (ERPFound)
                 * {
                 *	if(!ERPFound)
                 *	{
                 *		return "generic";
                 *	}
                 * },
                 */
                Common.OverrideERPFromRecord = function (ERPFound) {
                };
                /**
                 * @method Lib.ERP.Customization.Common.SetCustomERPName
                 * @since 336
                 * @description
                 * Allows you to customize the ERP name during initialization.
                 * This user exit is called when initializing the ERP name for a process.
                 * @param {string} ERPName The ERP name passed to InitERPName function
                 * @param {string} configurationERPName The ERP name from configuration/parameters
                 * @returns {string | void} Return a custom ERP name, or void/null to use the default logic
                 * @example
                 * <caption>Override ERP based on company code</caption>
                 * Common.SetCustomERPName = function(ERPName, configurationERPName)
                 * {
                 *	var companyCode = Data.GetValue("CompanyCode__");
                 *	if (companyCode === "US01")
                 *	{
                 *		return "SAP";
                 *	}
                 *	else if (companyCode === "FR01")
                 *	{
                 *		return "generic";
                 *	}
                 *	// Return null to use default logic
                 *	return null;
                 * }
                 */
                Common.SetCustomERPName = function (ERPName, configurationERPName) {
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = ERP.Customization || (ERP.Customization = {}));
    })(ERP = Lib.ERP || (Lib.ERP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_ERP_CUSTOMIZATION_COMMON_SAMPLE.js.map