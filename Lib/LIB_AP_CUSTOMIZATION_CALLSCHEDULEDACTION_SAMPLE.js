"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_CALLSCHEDULEDACTION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Call scheduled action customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * CallScheduledAction customization callbacks
 * @namespace Lib.AP.Customization.CallScheduledAction
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var CallScheduledAction;
            (function (CallScheduledAction) {
                /**
                 * @method Lib.AP.Customization.CallScheduledAction.GetIsActionCallableMapping
                 * @param {Map<actionName,function(Lib.CallScheduledAction.ScheduledAction):boolean>} defaultMapping (default) the default pre-steps mapping from actionName key and validation callback.
                 * if the callback returns true, the action will be called, else if the action returns false the actions is not called.
                 * @return {Map<actionName,function(Lib.CallScheduledAction.ScheduledAction):boolean>}  the overriden mapping object
                 * @example
                 * <pre><code>
                 * GetIsActionCallableMapping: function (defaultMapping)
                 * {
                 *		defaultMapping["MyCustomAction"] = function (scheduledAction)
                 *		{
                 *			if(!scheduledAction.parameters["InvoiceStatus__"] || scheduledAction.parameters["InvoiceStatus__"].length === 0)
                 *			{
                 *				return true;
                 *			}
                 *
                 *			var query = Process.CreateQueryAsProcessAdmin();
                 *			query.SetFilter("MsnEx=" + scheduledAction.msnEx);
                 *			if (query.MoveFirst())
                 *			{
                 *				var trn = query.MoveNext();
                 *				if (trn)
                 *				{
                 *					var vars = trn.GetVars(false);
                 *					var statusFound = false;
                 *
                 *					for(var i = 0; i < scheduledAction.parameters["InvoiceStatus__"].length;++i)
                 *					{
                 *						if(scheduledAction.parameters["InvoiceStatus__"][i] === vars.GetValueAsString("InvoiceStatus__"))
                 *						{
                 *							// Inhibit the action call because the invoice is already in the expected status
                 *							return false;
                 *						}
                 *					}
                 *				}
                 *			}
                 *			return true;
                 *		};
                 *		return defaultMapping;
                 * }
                 * </code></pre>
                 */
                CallScheduledAction.GetIsActionCallableMapping = function (defaultMapping) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.CallScheduledAction.DetermineTableName
                 * @description
                 * Implement this user exit to optimize the queries done in the Apply schedule Action process by specifying the table name related to the scheduled action
                 * @param {Lib.CallScheduledAction.ScheduledAction} scheduledAction The scheduled action we are trying to call.
                 * @return {string} The name of table (used to optimize the queries).
                 * @example
                 * <pre><code>
                 * DetermineTableName: function (scheduledAction)
                 * {
                 *		if (scheduledAction.actionName === "notifybuyers")
                 *		{
                 *			return "CDNAME#Vendor invoice";
                 *		}
                 *		return null;
                 * }
                 * </code></pre>
                 */
                CallScheduledAction.DetermineTableName = function (scheduledAction) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.CallScheduledAction.DoNotCallScheduledActionExecute
                 * @since 352
                 * @description
                 * Implement this user exit to conditionally prevent the execution of a scheduled action on a document.
                 * Return true to block the scheduled action from being executed (the action will stop retrying).
                 * This is useful to protect documents in specific statuses from being inadvertently reopened or modified.
                 * @param {xVars} vars The document variables (includes State, RuidEx, etc.)
                 * @param {Lib.CallScheduledAction.ScheduledAction} scheduledAction The scheduled action object
                 * @param {xTransport} trn The transport object for the document
                 * @returns {boolean | void} Return true to block the scheduled action execution, false/undefined to continue normally
                 * @example <caption>Prevent scheduled action execution on documents in Paid status</caption>
                 * DoNotCallScheduledActionExecute = function (vars, scheduledAction, trn)
                 * {
                 *     var invoiceStatus = vars.GetValue_String("InvoiceStatus__", 0);
                 *     if (invoiceStatus === "Paid")
                 *     {
                 *         Log.Info("Blocking scheduled action " + scheduledAction.actionName + " on paid document " + scheduledAction.msnEx);
                 *         return true;
                 *     }
                 * };
                 */
                CallScheduledAction.DoNotCallScheduledActionExecute = function (vars, scheduledAction, trn) {
                };
                /**
                 * @method Lib.AP.Customization.CallScheduledAction.IsHoldsUpdateNeeded
                 * @since 361
                 * @description
                 * Implement this user exit to override the standard decision on whether the holds of an invoice must be updated from the CSV batch.
                 * Return true to force the holds update, false to force skipping it, or void/undefined to keep the standard date-comparison result.
                 * @param {Lib.CallScheduledAction.ScheduledAction} action The scheduled action (includes action.parameters CSV lines and action.msnEx)
                 * @param {Object} context The information computed by the standard logic
                 * @param {number} context.activeHoldsCount The number of active holds currently recorded on the invoice
                 * @param {Date} context.lastHoldReleaseDate The last hold release date currently recorded on the invoice
                 * @param {Date|null} context.csvLastHoldReleaseDate The most recent release date found in the CSV batch lines, or null when none is found
                 * @param {boolean} context.standardResult The boolean computed by the standard date-comparison logic
                 * @returns {boolean | void} true to force the update, false to force skipping it, void/undefined to keep the standard result
                 * @example <caption>Always reapply holds from CSV batch, bypassing the date comparison</caption>
                 * IsHoldsUpdateNeeded = function (action, context)
                 * {
                 *     // Needed when ERP-side holds (VIP) do not carry a ReleaseDate__ that is
                 *     // comparable/greater than the invoice's LastHoldReleaseDate__.
                 *     return true;
                 * };
                 */
                CallScheduledAction.IsHoldsUpdateNeeded = function (action, context) {
                };
            })(CallScheduledAction = Customization.CallScheduledAction || (Customization.CallScheduledAction = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_CALLSCHEDULEDACTION_SAMPLE.js.map