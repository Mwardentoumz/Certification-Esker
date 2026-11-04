"use strict";
/* eslint-disable no-empty-function */
/* LIB_DEFINITION{
  "name": "LIB_VM_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "versionable": false,
  "require": []
}*/
/**
 * Lib.VM.Customization.Server library
 * @namespace Lib.VM.Customization.Server
 */
var Lib;
(function (Lib) {
    var VM;
    (function (VM) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @description
                 * Function called in scheduled task "VM - Compliance polling"
                 * This function allows to customize the filter applied on the Vendor Entity table
                 * This filter is used to select which vendors will have their compliance data updated
                 * @method Lib.VM.Customization.Server.GetExtraFilterForVendorComplianceSynchronization
                 * @returns {string} the customized filter
                 * @example
                 * <pre><code>
                 * GetExtraFilterForVendorComplianceSynchronization: function()
                 * {
                 *	return Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", "US01").toString();
                 * }
                 * </code></pre>
                 */
                Server.GetExtraFilterForVendorComplianceSynchronization = function () {
                    // Customization not implemented in sample package library
                };
                /**
                 * @description
                 * Function called in scheduled task "VM - Score polling"
                 * This function allows to customize the filter applied on the AP - Vendors table
                 * This filter is used to select which vendors will have their failure score updated
                 * @method Lib.VM.Customization.Server.GetExtraFilterForVendorFailureRiskSynchronization
                 * @returns {string} the customized filter
                 * @example
                 * <pre><code>
                 * GetExtraFilterForVendorFailureRiskSynchronization: function()
                 * {
                 *	return Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", "US01").toString();
                 * }
                 * </code></pre>
                 */
                Server.GetExtraFilterForVendorFailureRiskSynchronization = function () {
                    // Customization not implemented in sample package library
                };
                /**
                 * @description Alerting function customize alerts displayed in gauge
                 * @method Lib.VM.Customization.Server.Alerting
                 * @property { CustomerScoreAlert } args object with all data needed
                 * @returns { any } Object representing the alerts to display below gauges.
                 * @example
                 * <pre><code>
                 * Alerting: function (args)
                 * {
                 *		args.alerts.list.push([{
                 *				key: "credit limit change"
                 *			},
                 *			{
                 *				key: "_score change from {0} to {1}",
                 *				parameters: [10, 3]
                 *			}]);
                 *		args.alerts.indicator = "favourable";
                 *		return args.alerts;
                 * }
                 * </code></pre>
                 */
                Server.Alerting = function ( /*args: CustomerScoreAlert*/) {
                };
                /**
                 * @description Customize the filter when updating the scores by querying ecovadis server-side
                 * @method Lib.VM.Customization.Server.CustomEcovadisUpdateFilter
                 * @param {string} defaultFilter default filter on published_date of the last month
                 * @returns {string} the customized filter
                 * @example
                 * <pre><code>
                 * CustomEcovadisUpdateFilter = (defaultFilter) => {
                 *		return Sys.EcovadisHelper.HandleEcovadisFilter(
                 *		"AND",
                 *		{
                 *			field: "published_date",
                 *			operator: "<=",
                 *			value: new Date()
                 *		},
                 *		{
                 *			field: "current_stage",
                 *			operator: "=",
                 *			value: "Not under assessment"
                 *		});
                 *	}
                 * </code></pre>
                 */
                Server.CustomEcovadisUpdateFilter = (defaultFilter) => {
                };
                /**
                * @description
                * Function called in scheduled task "VM - Score polling"
                * This user exit is called when storing a score (in the score polling process), after checking if the score has changed
                * @method Lib.VM.Customization.Server.OnStoringScore
                * @param {string} scoreType - The type of the score
                * @param {object} storedScore - The previously stored score
                * @param {object} newScore - The new score being stored
                * @returns {void} No return value
                * @example
                * <pre><code>
                * Server.OnStoringScore = function (scoreType, storedScore, newScore)
                * {
                *      // Early return if not the concerned score type
                *      if (scoreType !== "FailureScoreL1")
                *          return null;
                *
                *      // Preparing data
                *      newScore.score =
                *      {
                *          value: newScore.rating.riskSegment,
                *          lastUpdate: newScore.rating.scoreDate,
                *          scale: "1-3"
                *      };
                *
                *      Lib.VM.ScoringProviders.Server.AddConfigurationToScoreMapping("Z_FailureScoreL1__", "FailureScoreL1", {invertedTrend: false});
                * }
                * </code></pre>
                */
                Server.OnStoringScore = (scoreType, storedScore, newScore) => {
                };
                /**
                 * @method Lib.VM.Customization.Server.OnValidationScriptBegin
                 * @description
                 * This user exit is called at the very beginning of the validation script of the score polling process)
                 *
                 *
                 * OnValidationScriptBeginEnd: function ()
                 * {
                 *		Lib.VM.ScoringProviders.Common.mappingConfigurationFieldToScoreType["Z_FailureScoreL1__"] = "FailureScoreL1";
                * }
                * </code></pre>
                */
                Server.OnValidationScriptBegin = function () {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = VM.Customization || (VM.Customization = {}));
    })(VM = Lib.VM || (Lib.VM = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VM_CUSTOMIZATION_SERVER_SAMPLE.js.map