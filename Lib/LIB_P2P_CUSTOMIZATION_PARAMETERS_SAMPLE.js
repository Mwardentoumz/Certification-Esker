"use strict";
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_PARAMETERS_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending P2P parameters",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * P2P packages parameter customization callbacks
 * @namespace Lib.P2P.Customization.Parameters
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var Parameters;
            (function (Parameters) {
                /**
                 * @method Lib.P2P.Customization.Parameters.GetCustomInstanceEnvironments
                 * @description
                 * Return additional environment parameter blocks to add to a named Sys.Parameters instance initialization.
                 * Use this to support non-standard sub-account identifiers (e.g. "DEV-OM") without depending on the
                 * internal structure of Lib_Parameters_P2P.ts.
                 *
                 * The returned map is shallow-merged with the default environment map: each top-level key you return
                 * is added as a new entry. This user exit is intended for **adding new environments only**.
                 * Do not return an existing environment key (e.g. "DEV", "QA", "PROD") as it will replace the entire
                 * default block for that environment, causing all default parameters for it to be lost.
                 * @since 355
                 * @param {string} instanceName Name of the Sys.Parameters instance being initialized (for example "AP", "P2P", "PAC").
                 * @returns {ESKMap<any> | void} A map of new environment parameter blocks to add.
                 *   Each key must be an exact sub-account identifier that does not already exist in the defaults.
                 *   Return undefined to use defaults only.
                 * @example
                 * Parameters.GetCustomInstanceEnvironments = function (instanceName)
                 * {
                 *     if (instanceName !== "AP")
                 *     {
                 *         return;
                 *     }
                 *     return {
                 *         "DEV-OM": {
                 *             "SFTPConfigurationName": "SFTP2"
                 *         },
                 *         "QA-OM": {
                 *             "SFTPConfigurationName": "SFTP2"
                 *         },
                 *         "PROD-OM": {
                 *             "SFTPConfigurationName": "SFTP2"
                 *         }
                 *     };
                 * };
                 */
                Parameters.GetCustomInstanceEnvironments = function (instanceName) {
                    return;
                };
            })(Parameters = Customization.Parameters || (Customization.Parameters = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_PARAMETERS_SAMPLE.js.map