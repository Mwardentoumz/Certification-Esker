"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_FINALIZATION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Finalization Script AP customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Finalization script AP customization callbacks
 * @namespace Lib.AP.Customization.Finalization
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var Finalization;
            (function (Finalization) {
                /**
                 * @typedef {Object} Lib.AP.Customization.Finalization.UserExitContextParameter
                 * @property {number} maxElementsPerRecall
                 * @property {number} limitHistoryToLastDays
                 */
                /**
                 * @typedef {Object} Lib.AP.Customization.Finalization.UserExitContext
                 * @property {string} script where the UE is called
                 * @property {string} context unique ID location where the UE is called
                 * @param {Lib.AP.Customization.Finalization.UserExitContextParameter[]} parameters UE parameters - only one parameter
                 */
                /**
                 * @method Lib.AP.Customization.Finalization.OnUpdateInvoicesWaitingForGR
                 * @description
                 * Allows you to inject code in the waiting for GR process.
                 * @param {Lib.AP.Customization.Finalization.UserExitContext} UEcontext give the context of user exit call
                 */
                Finalization.OnUpdateInvoicesWaitingForGR = function (UEcontext) {
                };
                /**
                 * @method Lib.AP.Customization.Finalization.AddActionForLeadTime
                 * @description
                 * Allows you to add custom actions during lead time KPI calculation.
                 * @returns {Object.<string, Object.<string, Function> | Function | string>}
                 * @example
                 * <pre><code>
                 * AddActionForLeadTime: function()
                 * {
                 * 		return {
                 *			customAction1: Lib.AP.VendorInvoice.WorkflowTimeParser.computeTimeSpentToReceive,
                 *			customAction2: {
                 *				APStart : Lib.AP.VendorInvoice.WorkflowTimeParser.computeTimeSpentToReceive,
                 *				APEnd : Lib.AP.VendorInvoice.WorkflowTimeParser.computeTimeSpentToReceive,
                 *				Reviewer : Lib.AP.VendorInvoice.WorkflowTimeParser.computeTimeSpentToReceive,
                 *				Approver : Lib.AP.VendorInvoice.WorkflowTimeParser.computeTimeSpentToApprove,
                 *				Vendor : Lib.AP.VendorInvoice.WorkflowTimeParser.USEPREVIOUSHANDLER // Constant used to indicate that the expected timer to increase is the same as the previous step
                 *			}
                 *		}
                 * }
                 * </code></pre>
                 * List of all roles available by action: APStart | APEnd | Reviewer | Approver | Vendor
                 * List of all available time spent functions : computeTimeSpentToVerify | computeTimeSpentToPost | computeTimeSpentToApprove | computeTimeSpentToReview |
                 * computeTimeSpentSetAside | computeTimeSpentOnHold | handleApproveOrReview | handleToApproveOrToPay | handleERPIntegrationErrorOrToApproveOrToPay
                 */
                Finalization.AddActionForLeadTime = function () {
                };
                /**
                 * @method Lib.AP.Customization.Finalization.PreProcessTransport
                 * @since 339
                 * @description
                 * Allows you to customize the processTransport before processing the process
                 * @param {xTransport} processTransport The process instance created as an xTransport object
                 * @param {string} currentUserLogin The login of the user who owns the current process instance
                 * @example <caption>Allow you to customize the processTransport</caption>
                 * PreProcessTransport: function(processTransport, currentUserLogin)
                 * {
                 *		const extVars = processTransport.GetExternalVars();
                 *		extVars.AddValue_String("DocumentCulture", "fr-FR", true);
                 * }
                 */
                Finalization.PreProcessTransport = function (processTransport, currentUserLogin) {
                };
                /**
                 * @method Lib.AP.Customization.Finalization.CustomizeCheckGoodsReceiptQuery
                 * @description
                 * [Server] Use this function to customize the query used by the Goods Receipt wake-up logic
                 * (CheckGoodsReceipt action) when searching for invoices to awaken after GR completion in the ERP.
                 * By default, the query only targets invoices with State=70, InvoiceStatus__="Set aside" and
                 * AsideReason__="Waiting for goods receipt". This user exit allows you to modify the query object
                 * (e.g., add extra attributes) or override the filter to include additional invoice statuses
                 * or workflow steps (such as a custom Resolver step) in the GR wake-up search.
                 * @since 352
                 * @param {IQuery} query The query object used to search for invoices waiting for GR.
                 * You can add attributes via `query.AddAttribute()` or set options via `query.SetOptionEx()`.
                 * @param {Sys.Helpers.LdapUtil.IFilter} filter The default LDAP filter targeting Set-Aside invoices waiting for GR.
                 * @returns {void}
                 * @example <caption>Override the default filter to only target invoices in state 70 with InvoiceStatus__ "Set aside"</caption>
                 * CustomizeCheckGoodsReceiptQuery = function (query, filter)
                 * {
                 *		return Sys.Helpers.LdapUtil.FilterAnd(
                 *			Sys.Helpers.LdapUtil.FilterEqual("State", "70"),
                 *			Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", "Set aside")
                 *		);
                 * };
                 */
                Finalization.CustomizeCheckGoodsReceiptQuery = function (query, filter) {
                };
            })(Finalization = Customization.Finalization || (Customization.Finalization = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_FINALIZATION_SAMPLE.js.map