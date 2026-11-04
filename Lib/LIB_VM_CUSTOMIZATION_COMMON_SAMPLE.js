"use strict";
/* eslint-disable no-empty-function */
/* LIB_DEFINITION{
  "name": "LIB_VM_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "versionable": false,
  "require": []
}*/
/**
 * Lib.VM.Customization.Common library
 * @namespace Lib.VM.Customization.Common
 */
var Lib;
(function (Lib) {
    var VM;
    (function (VM) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * Personalize the URL of the FON Vendor info API
                 *
                 * @method Lib.VM.Customization.Common.GetFONUrl
                 * @param {string} portalId - Portal ID set on FON third-party agency configuration
                 * @returns {String} The URL of FON Vendor info API
                 * @example
                 * <pre><code>
                 * GetFONUrl: function()
                 * {
                 *	return "https://{id}.vendorinfo.com".replace("{id}", portalId);
                 * }
                 * </code></pre>
                 */
                Common.GetFONUrl = function (portalId) {
                };
                /**
                 * Personalize the URL of the DUNS API
                 *
                 * @memberof Lib.VM.Customization.Common.GetDunsUrl
                 * @returns {String} The URL of the validation for Dun and Bradstreet
                 * @example
                 * <pre><code>
                 * GetDunsUrl: function()
                 * {
                 *	return "https://my.dnb.com/";
                 * }
                 * </code></pre>
                 */
                Common.GetDunsUrl = function () {
                };
                /**
                 * Use or not the Ecovadis sandbox alias, if not, the production alias will be used
                 *
                 * @memberof Lib.VM.Customization.Common.UseEcovadisSandboxAlias
                 * @returns {boolean} True if the Ecovadis sandbox alias should be used
                 * @example
                 * <pre><code>
                 * UseEcovadisSandboxAlias: function()
                 * {
                 *	return true;
                 * }
                 * </code></pre>
                 */
                Common.UseEcovadisSandboxAlias = function () {
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = VM.Customization || (VM.Customization = {}));
    })(VM = Lib.VM || (Lib.VM = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VM_CUSTOMIZATION_COMMON_SAMPLE.js.map