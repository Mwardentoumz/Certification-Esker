"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_ACCRUAL_CLIENT_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "Customizable actions to serialize accrual events serialization, client side",
  "versionable": false,
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
/**
 * User exits to customize accrual events serialization
 * @namespace Lib.P2P.Customization.Accrual
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var Accrual;
            (function (Accrual) {
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeFilterDuplicateReport
                 * @description Allow to customize the filter of the query done to detect a duplicate report
                 * @since 301
                 * @returns {Sys.Helpers.LdapUtil.IFilter} The filter for the query
                 * @example
                 * <caption>This example use the same filter as the standard but also extend it to the reports with "Computed" status</caption>
                 * Accrual.CustomizeFilterDuplicateReport = function ()
                 * {
                 *	return Sys.Helpers.LdapUtil.FilterAnd(
                 *		Sys.Helpers.LdapUtil.FilterEqual("AccrualCompanyCode__", Controls.AccrualCompanyCode__.GetValue()),
                 *		Sys.Helpers.LdapUtil.FilterEqual("AccrualEndDate__", Sys.Helpers.Date.Date2DBDate(Controls.AccrualEndDate__.GetValue())),
                 *		Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0"),
                 *		Sys.Helpers.LdapUtil.FilterOr(
                 *			Sys.Helpers.LdapUtil.FilterEqual("AccrualReportStatus__", "Computed"),
                 *			Sys.Helpers.LdapUtil.FilterEqual("AccrualReportStatus__", "Exported"),
                 *			Sys.Helpers.LdapUtil.FilterEqual("AccrualReportStatus__", "Integrated")
                 *		)
                 *	);
                 * };
                 */
                Accrual.CustomizeFilterDuplicateReport = function () {
                };
            })(Accrual = Customization.Accrual || (Customization.Accrual = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_ACCRUAL_CLIENT_SAMPLE.js.map