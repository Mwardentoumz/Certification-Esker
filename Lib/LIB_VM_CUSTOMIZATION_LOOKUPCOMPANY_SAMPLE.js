"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_VM_CUSTOMIZATION_LOOKUPCOMPANY_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "versionable": false,
  "require": []
}*/
/**
 * Lib.VM.Customization.LookupCompany library
 * @namespace Lib.VM.Customization.LookupCompany
 */
var Lib;
(function (Lib) {
    var VM;
    (function (VM) {
        var Customization;
        (function (Customization) {
            var LookupCompany;
            (function (LookupCompany) {
                /**
                 * @description Override the LookupCompany function to have a demo result even if the configuration is empty or false
                 * @method Lib.VM.Customization.LookupCompany.OverrideReturn
                 * @param {string} country - The country selected in vendor lookup panel
                 * @param {string} nationalID - The national ID selected in vendor lookup panel
                 * @returns {string} JSON to replace results of D&B LookupCompany API
                 * @example
                 * <pre><code>
                 * OverrideReturn: function()
                 * {
                 *	return {}
                 * }
                 * </code></pre>
                 */
                LookupCompany.OverrideReturn = function (country, nationalID) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @description Function called to define demo companies to fill the D&B Company Search fields
                 * @method Lib.VM.Customization.LookupCompany.GetDemoCompanies
                 * @example
                 * <pre><code>
                 * GetDemoCompanies: function()
                 * {
                 *	return [
                 *		{
                 *			name: "ESKER Inc",
                 *			country: "US",
                 *			nationalID: "102217569"
                 *		},
                 *		{
                 *			name: "ESKER SA",
                 *			country: "FR",
                 *			nationalID: "331518498"
                 *		}
                 *	];
                 * }
                 * </code></pre>
                 */
                LookupCompany.GetDemoCompanies = function () {
                    // Customization not implemented in sample package library
                };
            })(LookupCompany = Customization.LookupCompany || (Customization.LookupCompany = {}));
        })(Customization = VM.Customization || (VM.Customization = {}));
    })(VM = Lib.VM || (Lib.VM = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VM_CUSTOMIZATION_LOOKUPCOMPANY_SAMPLE.js.map