"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_BILLINGSCHEDULE_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Common customizable functions",
  "versionable": false,
  "require": [
    "Sys/Sys_Helpers_Array",
    "Sys/Sys_Helpers_Promise",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
/**
 * User exits to customize BillingSchedule
 * @namespace Lib.P2P.Customization.BillingSchedule
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var BillingSchedule;
            (function (BillingSchedule) {
                /**
                 * @method Lib.P2P.Customization.BillingSchedule.CustomizeWorkflowConfiguration
                 * @description
                 * [Common] Allows you to customize workflow fields used to compute Billing Schedule approvers.
                 * @since 351
                 * @returns {WorkflowConfiguration | void} Return custom workflow configuration to override defaults.
                 * @example
                 * <caption>Use a dedicated workflow type and another dimension</caption>
                 * BillingSchedule.CustomizeWorkflowConfiguration = function ()
                 * {
                 * 	return {
                 * 		WorkflowType__: "ContractApproval",
                 * 		InvoiceType__: "Non-PO Invoice",
                 * 		CompanyCode__: "US01",
                 * 		WorkflowAmount__: Data.GetValue("MaximumScheduledAmount__"),
                 * 		DimensionColumnInCT__: "GLAccount__",
                 * 		DimensionValue__: Data.GetValue("GLAccount__")
                 * 	};
                 * };
                 */
                BillingSchedule.CustomizeWorkflowConfiguration = function () {
                };
                /**
                 * @method Lib.P2P.Customization.BillingSchedule.Validate
                 * @description [Client & Server] Allows you updates all existing events before inserting new ones
                 * @since 266
                 * @param {Validator[]} originalValidators
                 * @return {Validator[]} The overriden list. You can of course define your own validatorName.
                 * @example
                 * <caption>Only validate the billingScheduleID and a custom field</caption>
                 * BillingSchedule.Validate = function (originalValidators)
                 * {
                 * 		var newValidators = [];
                 * 		var billingScheduleIDRecord = Sys.Helpers.Array.Find(originalValidators, function (val) { return val.validatorName === "BillingScheduleID"});
                 * 		if (billingScheduleIDRecord)
                 * 		{
                 * 			newValidators.push(billingScheduleIDRecord);
                 * 		}
                 * 		const customFieldValidatorPromise = Sys.Helpers.Promise.Create(function (resolve, _reject)
                 * 		{
                 * 			if (!Data.GetValue<string>("Z_Custom__"))
                 * 			{
                 * 				Log.Error("Z_Custom__ field is mandatory.");
                 * 				Data.SetError("Z_Custom__", "This field is mandatory!");
                 * 				resolve(false);
                 * 			}
                 * 			else
                 * 			{
                 * 				resolve(true);
                 * 			}
                 * 		});
                 * 		newValidators.push({
                 * 			validatorName : "Z_Custom",
                 * 			promise : customFieldValidatorPromise
                 * 		})
                 * 		return newValidators;
                 * };
                 */
                BillingSchedule.Validate = function (originalValidators) {
                };
                /**
                 * @method Lib.P2P.Customization.BillingSchedule.ExtendActionMap
                 * @description [Server] Allows you defined your own validation actions
                 * @since 266
                 * @param {Record<string, ValidationAction>} originalActionMap
                 * @return {Record<string, ValidationAction>} The overriden action map
                 * @example
                 * <caption>Only validate the billingScheduleID and a custom field</caption>
                 * BillingSchedule.ExtendActionMap = function (originalActionMap)
                 * {
                 *	originalActionMap.newAction = {
                 *		handler: function () {
                 *			Process.PreventApproval();
                 *			return true;
                 *		},
                 *		validateForm:false,
                 *		leaveForm:false
                 *	};
                 *	return originalActionMap;
                 * };
                 */
                BillingSchedule.ExtendActionMap = function (originalActionMap) {
                };
                /**
                 * @callback Lib.P2P.Customization.PopupCB
                 * @param {Dialog} dialog
                 */
                /**
                 * @callback Lib.P2P.Customization.PopupCBResult
                 * @param {Dialog} dialog
                 * @param {object} result
                 */
                /**
                 * @callback Lib.P2P.Customization.OnClickOkCB
                 * @param {object} result
                 */
                /**
                 * @typedef Lib.P2P.Customization.PopupCommentConfig
                 * @param {string} title
                 * @param {string} helpId
                 * @param {string} reasonListLabel
                 * @param {string} possibleValues
                 * @param {string} currentReason
                 * @param {boolean} commentRequired
                 * @param {string} fieldName
                 * @param {string} limitDate
                 * @param {string} confirmationMessage
                 * @param {true} confirmationValue
                 * @param {Lib.P2P.Customization.PopupCB} extendedFillPopupCB - To display additional fields in the popup
                 * @param {Lib.P2P.Customization.PopupCBResult} extendedCommitPopupCB - To get additional fields values from the popup and add them to the result
                 * @param {Lib.P2P.Customization.OnClickOkCB} onClickOk
                 * @param {Lib.P2P.Customization.PopupCB} extendedValidatePopupCB - To validate additional fields in the popup
                 * @param {Lib.P2P.Customization.PopupCB} extendedHandleDialogCB - To handle custom events in the dialog
                 */
                /**
                 * @method Lib.P2P.Customization.BillingSchedule.CustomizePopupCommentConfig
                 * @since 324
                 * @description
                 * Allows to customize the configuration used to configure the popup comment
                 * @param {Lib.P2P.Customization.PopupCommentConfig} conf The configuration of pop up comment
                 * @returns {Lib.P2P.Customization.PopupCommentConfig} The configuration of pop up comment customized
                 * @example
                 * BillingSchedule.CustomizePopupCommentConfig = function(conf)
                 * {
                 *		conf.commentRequired = true;
                 *		return conf;
                 * };
                 */
                BillingSchedule.CustomizePopupCommentConfig = function (conf) {
                    return conf;
                };
                /**
                 * @typedef Lib.P2P.Customization.PopupOkExtendedConfig
                 * @param {string} title
                 * @param {string} explanationLabel
                 * @param {string} commentLabel
                 * @param {boolean} allowComment
                 * @param {string} currentComment
                 * @param {boolean} commentRequired
                 * @param {Lib.P2P.Customization.PopupCB} extendedFillPopupCB - To display additional fields in the popup
                 * @param {Lib.P2P.Customization.PopupCBResult} extendedCommitPopupCB - To get additional fields values from the popup and add them to the result
                 * @param {Lib.P2P.Customization.OnClickOkCB} onClickOk
                 * @param {Lib.P2P.Customization.PopupCB} extendedValidatePopupCB - To validate additional fields in the popup
                 * @param {Lib.P2P.Customization.PopupCB} extendedHandleDialogCB - To handle custom events in the dialog
                 */
                /**
                 * @method Lib.P2P.Customization.BillingSchedule.CustomizePopupOkConfig
                 * @since 324
                 * @description
                 * Allows to customize the configuration used to configure the popup comment
                 * @param {Lib.P2P.Customization.PopupOkExtendedConfig} conf The configuration of pop up comment
                 * @returns {Lib.P2P.Customization.PopupOkExtendedConfig} The configuration of pop up comment customized
                 * @example
                 * BillingSchedule.CustomizePopupOkConfig = function(conf)
                 * {
                 *		conf.commentRequired = true;
                 *		return conf;
                 * };
                 */
                BillingSchedule.CustomizePopupOkConfig = function (conf) {
                    return conf;
                };
                /**
                 * @method Lib.P2P.Customization.BillingSchedule.OnExtractionScriptEnd
                 * @description
                 * [Server] This user exit is called at the end of the extraction script of the Billing Schedule process.
                 * For example you can use this UE to customize the contract's mapping.
                 * @since 331
                 * @example
                 * <caption>Override the currency mapping in the contract form</caption>
                 * BillingSchedule.OnExtractionScriptEnd = function ()
                 * {
                 *  	Data.SetValue("Currency__", "EUR");
                 * };
                 */
                BillingSchedule.OnExtractionScriptEnd = function () {
                };
                /**
                 * @method Lib.P2P.Customization.BillingSchedule.OnHTMLScriptEnd
                 * @description
                 * [Client] This user exit is called at the end of the HTML script of the Billing Schedule process.
                 * For example you can use this UE to customize the behavior of the HTML form.
                 * @since 350
                 * @example
                 * <caption>Log message at the end of the HTML script</caption>
                 * BillingSchedule.OnHTMLScriptEnd = function ()
                 * {
                 *  	Log.Info("The HTML script has ended!");
                 * };
                 */
                BillingSchedule.OnHTMLScriptEnd = function () {
                };
                let AutoGenerateBillingSchedule;
                (function (AutoGenerateBillingSchedule) {
                    /**
                     * @method Lib.P2P.Customization.BillingSchedule.AutoGenerateBillingSchedule.OnExtractionScriptBegin
                     * @description
                     * [Server] This user exit is called at the beginning of the Extraction script in the Auto Generate Billing Schedule Invoices process.
                     * For example you can use this UE to initialize custom behaviors.
                     * @since 361
                     * @example
                     * <caption>Log message at the beginning of the Extraction script</caption>
                     * AutoGenerateBillingSchedule.OnExtractionScriptBegin = function ()
                     * {
                     * 	Log.Info("The Extraction script has started!");
                     * };
                     */
                    AutoGenerateBillingSchedule.OnExtractionScriptBegin = function () {
                    };
                })(AutoGenerateBillingSchedule = BillingSchedule.AutoGenerateBillingSchedule || (BillingSchedule.AutoGenerateBillingSchedule = {}));
            })(BillingSchedule = Customization.BillingSchedule || (Customization.BillingSchedule = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_BILLINGSCHEDULE_SAMPLE.js.map