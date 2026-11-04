"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_FRB2B_ADDRESSLINESBATCHIMPORT_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Customization library for the Sys_FRB2B_AddressLinesBatchImport process",
  "versionable": false,
  "require": []
}*/
/**
 * Customization library for the French B2B address lines batch import process Sys_FRB2B_AddressLinesBatchImport.
 * @namespace Lib.Customization.FRB2B.AddressLinesBatchImport
 */
var Lib;
(function (Lib) {
    var Customization;
    (function (Customization) {
        var FRB2B;
        (function (FRB2B) {
            var AddressLinesBatchImport;
            (function (AddressLinesBatchImport) {
                /**
                 * @method Lib.Customization.FRB2B.AddressLinesBatchImport.GetMaxEntriesPerProcess
                 * @since 362
                 * @description
                 * Callback used to override the maximum number of address line entries per
                 * `Sys_FRB2B_AddressLinesUpdate` process instance created during a csv batch import.
                 *
                 * When the number of rows for a given PA configuration exceeds this limit, multiple
                 * process instances are created, each containing at most this number of entries.
                 *
                 * Return a positive integer to override the default limit (500).
                 * Keep user exit empty to keep the default value.
                 *
                 * @returns {number | void} Maximum number of entries per process, or nothing to use the default (500).
                 * @example
                 * <pre><code>
                 * GetMaxEntriesPerProcess: function ()
                 * {
                 * 	return 200;
                 * }
                 * </code></pre>
                 */
                AddressLinesBatchImport.GetMaxEntriesPerProcess = function () {
                };
            })(AddressLinesBatchImport = FRB2B.AddressLinesBatchImport || (FRB2B.AddressLinesBatchImport = {}));
        })(FRB2B = Customization.FRB2B || (Customization.FRB2B = {}));
    })(Customization = Lib.Customization || (Lib.Customization = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Customization_FRB2B_AddressLinesBatchImport_Sample.js.map