"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_WORKFLOW_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending workflow",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * P2P Workflow engine calls customization callbacks
 * @namespace Lib.Workflow.Customization.Common
 */
var Lib;
(function (Lib) {
    var Workflow;
    (function (Workflow) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.Workflow.Customization.Common.OnBuildFieldsMapping
                 * @since 121
                 * @description Allows you to customize the default procedure that is used in the Purchase to Pay application for computing the sequence of users in the workflows.
                 * By default, a list of users is built for each cost center or G/L account, depending on the amount of the items related to this cost center or G/L account. In case of multiple cost centers or G/L accounts, the multiple lists of users are finally merged into one single workflow of users. Refer to Using tables to set up the validation workflow for an example.
                 * Instead of the cost center or G/L account, you can implement this user exit to build your lists of users based on another field or combination of fields of your choice.
                 *
                 * 	 For example, you can build your workflow based on the combination of a cost center and a geographic location.
                 *
                 * This user exit is called both from the processing scripts and from the HTML page script, each time the list of users of the workflow is retrieved or updated. Refer to WorkflowEngine.GetStepsResult for more information.
                 * @param {string} type
                 * String value identifying the workflow that is being retrieved. Possible values are:
                 * - PR-approvers: The purchasing workflow in the Purchase Requisition process is being retrieved or updated in the HTML page script.
                 * - PR-reviewers: The review purchasing workflow in the Purchase Requisition process is being retrieved or updated in the HTML page script.
                 * - AP-controllers: The invoice review workflow (before the AP specialist posts the invoice) in the Vendor invoice process is being retrieved or updated in the HTML page script or in the extraction script.
                 * - AP-approvers: The invoice payment approval workflow (after the AP specialist has posted the invoice) in the Vendor invoice process is being retrieved or updated in the HTML page script or in the extraction script.
                 * - OC-reviewer: The review workflow in the Order Confirmation process used to review the extracted data before sending the document to the approval workflow.
                 * - OC-approver: The approval workflow in the Order Confirmation process used to validate the extracted data before accepting, modifying or rejecting the purchase order.
                 * @param {object} baseFieldsMapping
                 * JavaScript object containing all the workflow fields that are common to the multiple lists of users, regardless of the procedure you implement.
             
                 * For example, you want to add the field "IsWorkflowNeeded" in the workflow rules designer to be able to decide in the workflow engine if the workflow should be triggered or not based on a condition. You can add it then in the default mapping:
                 *
                 * export const OnBuildFieldsMapping = function (type: string, baseFieldsMapping: any, mapping: any): object
                 *	{
                 *		if (type === "PR-approvers")
                 *		{
                 *			const workflowNotNeeded = condition;
                 *			if (baseFieldsMapping.values)
                 *				{
                 *					baseFieldsMapping.values.IsWorkflowNeeded = !workflowNotNeeded;
                 *				}
                 * 			//return null so the function Lib.P2P.BuildFieldsMapping(mapping); will still be called to compute the rest of the fields mapping and merge the different lists of users if needed.
                 * 			return null;
                 *		}
                 *	};
                 *
                 * Other example, you don't want any of the fields of the default mapping, so you return your own mapping:
                 *
                 * export const OnBuildFieldsMapping = function (type: string, baseFieldsMapping: any, mapping: any): object
                 *	{
                 *		if (type === "PR-approvers")
                 *		{
                 *			const customMapping = [
                 *				{
                 *					values: {
                 *						// Required fields for workflow engine
                 *						"WorkflowType__": "purchaseRequisitionApproval",
                 *						"CompanyCode__": "US01",
                 *					}
                 *				}
                 *			];
                 *			return customMapping;
                 *		}
                 *		return null;
                 *	};
                 * @param {object} mapping The whole mapping computed by the application.
                 * You can modify this object and return it to implement customizations.
                 * @return {object} The modified fieldsMapping. Return null to keep standard behavior.
                 * @see {@link Lib.Custom.WorkflowDefinition} to customize the Workflow rules designer and workflow engine with new fields and stepTypes.
                 */
                Common.OnBuildFieldsMapping = function (type, baseFieldsMapping, mapping) {
                    return null;
                };
                /**
                 * @method Lib.Workflow.Customization.Common.OnWorkflowImpacted
                 * @since 132
                 * @description This function is called by the Purchase requisition validation script when an impact on the workflow taken place.
                 * @return {boolean} result.
                 */
                Common.OnWorkflowImpacted = function () {
                    Log.Info("OnWorkflowImpacted");
                    return true;
                };
                /**
                 * @method Lib.Workflow.Customization.Common.OverrideMerger
                 * @since 206
                 * @description This function is called before building the workflow to allow you to override the merger used.
                 *
                 * @param {string} type
                 * String value identifying the workflow for which to override the merger. Possible values are:
                 * - PR-reviewers: The reviewer workflow in the Purchase Requisition process.
                 * - PR-approvers: The purchasing workflow in the Purchase Requisition proces.
                 *
                 * @return {string}
                 * - Name of the merger to use;
                 * - null if you want to use the default merger defined for this workflow type (same as commenting this function);
                 * @see {@link Lib.Custom.WorkflowDefinition} to customize the workflow engine with new mergers.
                 */
                Common.OverrideMerger = function (type) {
                    return null;
                };
                /**
                 * @method Lib.Workflow.Customization.Common.BypassERPError
                 * @since 140
                 * @description Use this function to post the invoice and move forward in the workflow even if the ERP ack returned an error.
                 * For example, if the ERP ack contains both an error and an invoice number, it could mean that the invoice should continue in EOD while
                 * the error will be manually fixed in the ERP system.
                 * The parameter erpError can be used to choose which errors should be blocking.
                 * @param {string} erpError Error set by the ERP system.
                 * @param {string} erpInvoiceNumber Invoice number set by the ERP system.
                 * @returns {boolean} BypassERPError True if the invoice workflow should continue despite the error set by the ERP system.
                 * @example
                 * Common.BypassERPError = function(erpError, erpInvoiceNumber)
                 * {
                 * 	// If the ERP ack contains both an error and an invoice number, continue in the workflow.
                 * 	return Boolean(erpError && erpInvoiceNumber);
                 * };
                 */
                Common.BypassERPError = function (erpError, erpInvoiceNumber) {
                    return false;
                };
                /**
                 * @method Lib.Workflow.Customization.Common.ExtendWorkflowParameters
                 * @since 207
                 * @description Use this function to modify workflow parameters.
                 * For instance, it can be used to map a new information in the workflow table
                 * @param {Sys.WorkflowController.IWorkflowParam} WorkflowParameters Workflow parameters.
                 * @param {GetContributionDataFn} getContributionData function to retrieve the current action contribution data.
                 * @returns {Sys.WorkflowController.IWorkflowParam} WorkflowParameters: a new workflow parameters object (or part of it) to extend the default parameters.
                 * @example
                 * Common.ExtendWorkflowParameters = function(WorkflowParameters, getContributionData)
                 * {
                 *	WorkflowParameters.mappingTable.columns.Z_Exception__ =
                 *	{
                 *		data: "exception"
                 *	};
                 *	WorkflowParameters.actions.setasideautomatically = {
                 *		OnDone: function (sequenceStep) {
                 *			Lib.AP.SetInvoiceStatus(Lib.AP.InvoiceStatus.SetAside);
                 *			var currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(sequenceStep);
                 *			var contributionData = getContributionData(sequenceStep, this.actions.setAside.GetName(), Lib.AP.CommentHelper.GetReliableComment(), {
                 *				action: "Set aside automatically",
                 *				reason: Data.GetValue("AsideReason__"),
                 *				onBehalfOf: true
                 *			});
                 *			Lib.AP.CommentHelper.UpdateHistory(Language.Translate("_Set aside history"), true);
                 *			if (contributionData.role === Lib.AP.WorkflowCtrl.roles.apStart) {
                 *				Lib.AP.WorkflowCtrl.workflowUI.Restart(contributionData);
                 *			}
                 *			else {
                 *				Lib.AP.WorkflowCtrl.workflowUI.BackTo(sequenceStep, contributionData);
                 *			}
                 *			Lib.AP.WorkflowCtrl.NotificationCtrl.NotifyEndOfContributionOnMobile(currentContributor);
                 *			Process.PreventApproval();
                 *		}
                 *  };
                 *	return WorkflowParameters;
                 * };
                 */
                Common.ExtendWorkflowParameters = function (WorkflowParameters, getContributionData) {
                };
                /**
                 * @method Lib.Workflow.Customization.Common.ExtendContributor
                 * @since 207
                 * @description Use this function to modify/add contributor data. Data are used to build and add the contributor to the Workflow table then.
                 * Old role and action parameters can be retrieved from the contributor object (i.e.: contributor.role or contributor.action).
                 * @param {Sys.WorkflowController.IWorkflowContributor} contributor contributor data.
                 * @param {Sys.WorkflowController.IWorkflowUser} user user data.
                 * @returns {Sys.WorkflowController.IWorkflowContributor} contributor contributor data extended with custom data.
                 * @example
                 * Common.ExtendContributor = function(contributor, user)
                 * {
                 *  // In case a new column has been added to track the exception the contributor has been added for
                 *  var exception = Data.GetValue("CurrentException__") || '';
                 *  contributor.exception = exception;
                 *  return contributor;
                 * };
                 */
                Common.ExtendContributor = function (contributor, user) {
                };
                /**
                 * @method Lib.Workflow.Customization.Common.GetDefaultAPClerkEnd
                 * @since 337
                 * @description Use this function to overide the logic of using the default AP Clerck retrieved from configuration's parameter "DefaultAPClerkEnd".
                 * @param {string} defaultAPClerkEnd the standard default AP End user.
                 * @returns a string representing the login of the custom default AP Clerk end user.
                 * @example <caption>Return the configuration's default AP Clerk as AP End for Non-PO Invoice and the configuration's default AP Clerk End in other cases</caption>
                 * Common.GetDefaultAPClerkEnd = function(defaultAPClerkEnd)
                 * {
                 *	if (Data.GetValue("InvoiceType__") != "PO Invoice")
                 *	{
                 *		return Sys.Parameters.GetInstance("AP").GetParameter("DefaultAPClerk", "");
                 *	}
                 *
                 *	return defaultAPClerkEnd;
                 * };
                 */
                Common.GetDefaultAPClerkEnd = function (defaultAPClerkEnd) {
                };
                // Specific extension for PR workflow parameters and contributors
                Common.PR = {
                    /**
                     * @method Lib.Workflow.Customization.Common.PR.ExtendWorkflowParameters
                     * @since 357
                     * @description Use this function to modify workflow parameters.
                     * For instance, it can be used to map a new information in the workflow table
                     * @param {Sys.WorkflowController.IWorkflowParam} WorkflowParameters Workflow parameters.
                     * @returns {Sys.WorkflowController.IWorkflowParam} WorkflowParameters: a new workflow parameters object (or part of it) to extend the default parameters.
                     * @example
                     * PR.ExtendWorkflowParameters = function(WorkflowParameters)
                     * {
                     *	WorkflowParameters.mappingTable.columns.Z_CustomValue__ =
                    *	{
                    *		data: "customValue"
                    *	};
                    *	return WorkflowParameters;
                    * };
                    */
                    ExtendWorkflowParameters: function (WorkflowParameters) {
                    },
                    /**
                     * @method Lib.Workflow.Customization.Common.PR.ExtendContributor
                     * @since 357
                     * @description Use this function to modify/add contributor data. Data are used to build and add the contributor to the Workflow table then.
                     * Old role and action parameters can be retrieved from the contributor object (i.e.: contributor.role or contributor.action).
                     * @param {Sys.WorkflowController.IWorkflowContributor} contributor contributor data.
                     * @param {Sys.WorkflowController.IWorkflowUser} user user data.
                     * @returns {Sys.WorkflowController.IWorkflowContributor} contributor contributor data extended with custom data.
                     * @example
                     * PR.ExtendContributor = function(contributor, user)
                     * {
                     *  // In case a new column has been added to track a customfield the contributor has been added for
                     *  var customValue = Data.GetValue("Z_CustomField__") || '';
                     *  contributor.customValue = customValue;
                     *  return contributor;
                     * };
                     */
                    ExtendContributor: function (contributor, user) {
                    }
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = Workflow.Customization || (Workflow.Customization = {}));
    })(Workflow = Lib.Workflow || (Lib.Workflow = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_WORKFLOW_CUSTOMIZATION_COMMON_SAMPLE.js.map