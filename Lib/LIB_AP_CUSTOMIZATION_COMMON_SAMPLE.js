"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_COMMON_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Script AP customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP common scripts customization callbacks
 * @namespace Lib.AP.Customization.Common
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @namespace Lib.AP.Customization.Common.CustomUserExits
                 * @description
                 * Allows you to define custom user exists added for this customer
                 * Functions defined in this scope will be accessible from outside this library
                 * They can be called the following way Lib.AP.Customization.Common.CustomUserExits.OnComputeExpectedAndOpenValues(invoiceLine, poItemVars, grItemVars)
                 * @example
                 * <pre><code>
                 * Common.CustomUserExits:
                 * {
                 *		OnComputeExpectedAndOpenValues: function(invoiceLine, poItemVars, grItemVars)
                 *		{
                 *			if (Sys.Parameters.GetInstance("AP").GetParameter("Z_DisableMMDeliveredAmountsChecks", "0") === "1")
                 *			{
                 *				invoiceLine.expectedAmount = invoiceLine.openAmount;
                 *				invoiceLine.expectedQuantity = invoiceLine.openQuantity;
                 *			}
                 *		}
                 * },
                 * </code></pre>
                 */
                Common.CustomUserExits = {};
                /**
                 * @namespace Lib.AP.Customization.Common.CustomFunctions
                 * @description
                 * Allows you to define custom Custom functions which are not user exits
                 * i.e. business functions to be called both in server & client libraries
                 * They can be called the following way Lib.AP.Customization.Common.CustomFunctions.ShouldPerformReconciliation()
                 * @example
                 * <pre><code>
                 * Common.CustomFunctions:
                 * {
                 *		ShouldPerformReconciliation: function()
                 *		{
                 *			return Sys.Parameters.GetInstance("AP").GetParameter("Z_PerformReconciation", "0") === "1";
                 *		}
                 * },
                 * </code></pre>
                 */
                Common.CustomFunctions = {};
                /**
                 * @method Lib.AP.Customization.Common.AppendUncheckedHeaderAndLineItemsFieldsDuringApproval
                 * @since 363
                 * @description
                 * Allows you to add custom fields to the fields which are not restricted to their table values during the approval workflow.
                 * Push the header field names into Lib.AP.UncheckedHeaderFieldsDuringApproval and the line item field names
                 * into Lib.AP.UncheckedLineItemsFieldsDuringApproval.
                 * This user exit is called both by the HTML script and by the validation script, and it can be called several times
                 * within the same context, so the fields must only be added when they are not already present.
                 * @returns {void}
                 * @example <caption>Also allow free values on a custom header field and on the line item GL account during approval</caption>
                 * Common.AppendUncheckedHeaderAndLineItemsFieldsDuringApproval = function ()
                 * {
                 *	if (Lib.AP.UncheckedHeaderFieldsDuringApproval.indexOf("Z_SectorCode__") < 0)
                 *	{
                 *		Lib.AP.UncheckedHeaderFieldsDuringApproval.push("Z_SectorCode__");
                 *	}
                 *	if (Lib.AP.UncheckedLineItemsFieldsDuringApproval.indexOf("GLAccount__") < 0)
                 *	{
                 *		Lib.AP.UncheckedLineItemsFieldsDuringApproval.push("GLAccount__");
                 *	}
                 * };
                 */
                Common.AppendUncheckedHeaderAndLineItemsFieldsDuringApproval = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnHandleMatchedBillingSchedule
                 * @since 364
                 * @description
                 * Called after a matched billing schedule has been handled by the Vendor invoice process.
                 * Allows you to populate custom Vendor invoice fields from the complete billing schedule matching result.
                 * @param {Lib.P2P.BillingSchedule.MatchingBillingSchedule[]} billingScheduleMatchingContractResult The billing schedules matching the invoice contract.
                 * @returns {void}
                 * @example <caption>Populate a custom field with the matched billing schedule amount</caption>
                 * Common.OnHandleMatchedBillingSchedule = function (billingScheduleMatchingContractResult)
                 * {
                 * 	Data.SetValue("Z_BillingScheduleAmount__", billingScheduleMatchingContractResult[0].BillingScheduleAmount);
                 * };
                 */
                Common.OnHandleMatchedBillingSchedule = function (billingScheduleMatchingContractResult) {
                };
                /**
                 * @typedef {object} Lib.AP.Customization.Common.GetCustomFilterForPODateUpdateOptions
                 * @property {string} [companyCode]
                 * @property {number} [limitHistoryToLastDays]
                 */
                /**
                 * @method Lib.AP.Customization.Common.GetCustomFilterForPODateUpdate
                 * @since 333
                 * @description
                 * Allows you to define a custom filter string to be used when retrieving the last PO event date for a given order number and ERP system.
                 * This user exit is called by the system when updating invoices waiting for goods receipt, and can be used to restrict or modify the PO date update query.
                 * If you return a string, it will be used as an the filter in the PO date update process. If you return null or do not implement this function, the default behavior applies (no extra filter).
                 * @param {string} ERPName The name of the ERP system (e.g., "SAP", "generic").
                 * @param {string} orderNumber The purchase order number for which the filter is being built.
                 * @param {Lib.AP.Customization.Common.GetCustomFilterForPODateUpdateOptions} options options used in GetLastPODateUpdate to determine date
                 * @returns {string} A custom filter string to be used in the PO date update query, should return null to use default filter.
                 * @example <caption>This example reproduce the default filter applied</caption>
                 * Common.GetCustomFilterForPODateUpdate = function(ERPName, orderNumber)
                 * {
                 *     if (ERPName === "SAP")
                 *     {
                 *         // default filter for sap retrieval
                 *         return `EBELN = '${orderNumber}' AND BEWTP = 'E'`;
                 *     }
                 *     // default filter on local table
                 *     return `&(OrderNumber__=${poNumber})(CompanyCode__=${options.companyCode})`;
                 * }
                 */
                Common.GetCustomFilterForPODateUpdate = function (ERPName, orderNumber, options) {
                };
                /**
                 * @typedef {object} Lib.AP.Customization.Common.CustomizeLastEventDateForWaitingGROptions
                 * @property {string} orderNumber Purchase order number currently processed.
                 * @property {string} companyCode Company code of the invoice.
                 * @property {string} invoiceType Invoice type used to select ERP-specific behavior.
                 * @property {string} configuration AP configuration name.
                 * @property {string} ERP ERP key requested by waiting GR flow.
                 * @property {string} ERPName Effective ERP manager name used for PO date retrieval.
                 * @property {object} getLastPODateUpdateOptions options used in GetLastPODateUpdate to determine date.
                 * @property {string} [customFilter] Custom filter returned by GetCustomFilterForPODateUpdate.
                 * @property {object} options Runtime options passed to UpdateInvoicesWaitingForGR.
                 */
                /**
                 * @method Lib.AP.Customization.Common.CustomizeLastEventDateForWaitingGR
                 * @since 354
                 * @description
                 * Allows you to override the date used to wake invoices waiting for goods receipt.
                 * This callback must return a function that computes the custom date.
                 * When this user exit is not implemented, the standard PO-based date logic (GetLastPODateUpdate) is used.
                 * When implemented, the returned function completely replaces the standard date computation.
                 * The returned function can return null to explicitly clear the date.
                 * @param {Lib.AP.Customization.Common.CustomizeLastEventDateForWaitingGROptions} context Execution context used to compute an alternate date.
                 * @param {ERP.Manager.Instance} erpManager ERP manager used by the standard flow.
                 * @returns {function} A function returning a custom date (or null), or void to keep standard behavior.
                 * @example <caption>Use the latest date between PO and GR events</caption>
                 * Common.CustomizeLastEventDateForWaitingGR = function(context, erpManager)
                 * {
                 *     return function()
                 *     {
                 *         var poDate = erpManager.GetDocument("INVOICE").GetLastPODateUpdate(context.orderNumber, context.getLastPODateUpdateOptions, context.customFilter);
                 *         var grDate = erpManager.GetDocument("INVOICE").GetLastGRDateUpdate(context.orderNumber, context.getLastPODateUpdateOptions, context.customFilter);
                 *         if (!grDate)
                 *         {
                 *             return poDate;
                 *         }
                 *         if (!poDate || grDate > poDate)
                 *         {
                 *             return grDate;
                 *         }
                 *         return poDate;
                 *     };
                 * };
                 */
                Common.CustomizeLastEventDateForWaitingGR = function (context, erpManager) {
                };
                /**
                 * @typedef {object} Lib.AP.Customization.Common.VendorCustomFields
                 * @property {string} nameInForm
                 * @property {string} nameInTable
                 * @property {string} [nameInSAP] @deprecated Use nameInERP instead
                 * @property {string} [nameInERP]
                 */
                /**
                 * @method Lib.AP.Customization.Common.GetVendorCustomFields
                 * @description
                 * Allows you to add vendor custom fields which will be filled and emptied along with standard
                 * vendor properties, on client and server side.
                 * @returns {Lib.AP.Customization.Common.VendorCustomFields[]} requiredFields The updated list of all required fields definition
                 * @example
                 * <pre><code>
                 * GetVendorCustomFields: function ()
                 * {
                 *		// Set mapping between custom field name in 'AP - Vendors__' table and VIP custom field name
                 *		var customFields = [
                 *			{ nameInForm: "Z_VendorSIRET__", nameInTable: "Z_SIRET__" }
                 *		];
                 *
                 *		// OR Set mapping between ERP field name (like SAP field name in 'ZESK_VENDORS' view) and VIP custom field name ('AP - Vendors__' table doesn't need to be customized but nameInTable mandatory here)
                 *		var customFields = [
                 *			{ nameInForm: "Z_VendorVATNumber__", nameInTable: "Z_VATNumber__", nameInERP: "STCEG" },
                 *			{ nameInForm: "Z_VendorSIRET__", nameInTable: "Z_SIRET__", nameInERP: "STCD1" },
                 *			{ nameInForm: "Z_VendorSIREN__", nameInTable: "Z_SIREN__", nameInERP: "STCD2" },
                 *			{ nameInForm: "Z_VendorTradingPartner__", nameInTable: "Z_TradingPartner__", nameInERP: "VBUND" },
                 *			{ nameInForm: "Z_VendorReconciliationAct_GL__", nameInTable: "Z_ReconciliationAct_GL__", nameInERP: "AKONT" }
                 *		];
                 *
                 *		return customFields;
                 * }
                 * </code></pre>
                 */
                Common.GetVendorCustomFields = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.ShouldFillVendorFieldsFromSAP
                 * @since 354
                 * @description
                 * Allows you to control whether vendor fields should be filled from SAP vendor data.
                 * This user exit is called when vendor details are retrieved from SAP, before any vendor fields are updated.
                 *
                 * Return `false` to prevent the standard vendor fields from being filled with SAP data. This allows you to:
                 * - Preserve manually entered vendor data for one-time/dummy vendor numbers
                 * - Implement custom field-filling logic
                 * - Conditionally skip vendor data updates based on business rules
                 *
                 * Return `true` or do not implement this user exit to use the default behavior (fill all vendor fields from SAP).
                 *
                 * **Note:** When returning `false`, you can still access the SAP vendor data in the user exit to selectively
                 * fill specific fields using `Data.SetValue()` if needed.
                 *
                 * **Standard fields that will be filled when returning `true` (default):**
                 * - VendorNumber__, VendorName__, VendorStreet__, VendorCity__, VendorZipCode__, VendorRegion__, VendorCountry__
                 * - Payment terms (via SetPaymentTermsAndSourceIfNeeded)
                 * - WithholdingTax__ (if configured)
                 * - Custom vendor fields (via GetVendorCustomFields user exit)
                 *
                 * @param {ISAP.ReadSAPTableRecord<"ZESK_VENDORS">} sapVendorItem The vendor data retrieved from SAP's ZESK_VENDORS view
                 * @returns {boolean} `true` to fill vendor fields with SAP data (default), `false` to skip field filling
                 *
                 * @example
                 * <caption>Skip vendor field updates for dummy/one-time vendor numbers</caption>
                 * ShouldFillVendorFieldsFromSAP: function(sapVendorItem)
                 * {
                 *     // List of dummy vendor numbers used for one-time vendors
                 *     var dummyVendorNumbers = ["419999999", "410000000", "9999999999"];
                 *     var vendorNumber = Sys.Helpers.String.SAP.TrimLeadingZeroFromID(sapVendorItem.LIFNR);
                 *
                 *     // Don't fill vendor fields for dummy vendors - preserve manual data entry
                 *     if (dummyVendorNumbers.indexOf(vendorNumber) >= 0)
                 *     {
                 *         return false;
                 *     }
                 *
                 *     return true; // Use default behavior for normal vendors
                 * }
                 *
                 * @example
                 * <caption>Selective field filling - preserve payment terms but update address</caption>
                 * ShouldFillVendorFieldsFromSAP: function(sapVendorItem)
                 * {
                 *     // Skip default filling and implement custom logic
                 *     if (Data.GetValue("VendorNumber__").startsWith("99"))
                 *     {
                 *         // For special vendors, only update address fields, not payment terms
                 *         Data.SetValue("VendorName__", Sys.Helpers.String.SAP.Trim(sapVendorItem.NAME1));
                 *         Data.SetValue("VendorStreet__", Sys.Helpers.String.SAP.Trim(sapVendorItem.STRAS));
                 *         Data.SetValue("VendorCity__", Sys.Helpers.String.SAP.Trim(sapVendorItem.ORT01));
                 *         Data.SetValue("VendorZipCode__", Sys.Helpers.String.SAP.Trim(sapVendorItem.PSTLZ));
                 *         Data.SetValue("VendorCountry__", Sys.Helpers.String.SAP.Trim(sapVendorItem.LAND1));
                 *         // Don't update payment terms - keep existing value
                 *         return false;
                 *     }
                 *
                 *     return true; // Normal vendors get full update
                 * }
                 */
                Common.ShouldFillVendorFieldsFromSAP = function (sapVendorItem) {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetRequiredFields
                 * @description
                 * Return the list of the required fields based on the current invoice state
                 * See {@link Lib.ERP.Invoice.GetRequiredFieldsCallback} for more details
                 * On client side, the item parameter is only set during the validateData process.
                 * On form loading, only the table header can be set as required and in this case the item parameter is empty.
                 * @param {ERPTypes.RequiredFields} requiredFields The list of all required fields definition
                 * @returns {ERPTypes.RequiredFields} requiredFields The updated list of all required fields definition
                 * @example
                 * <pre><code>
                 * GetRequiredFields: function (requiredFields)
                 * {
                 *		// Set invoice number always required
                 *		requiredFields.Header.InvoiceNumber__ = true;
                 *
                 *		// Set LineItems__ GLAccount__ column required if CodingEnableGLAccount is enabled in the configurator depending on the current row lineType__
                 *		// On client side, the item parameter is only set during the validateData process. On form loading,
                 *		// only the table header can be set as required and in this case the item parameter is empty.
                 *		var apParameters = Sys.Parameters.GetInstance("AP");
                 *		requiredFields.LineItems__.GLAccount__ = function(item) {
                 *			var lineType = item ? item.GetValue("LineType__") : Lib.P2P.LineType.GL;
                 *			return lineType === 'GL' && apParameters.GetParameter("CodingEnableGLAccount") === "1";
                 *		};
                 *		return requiredFields;
                 * }
                 * </code></pre>
                 */
                Common.GetRequiredFields = function (requiredFields) {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetCodingsPredictionFields
                 * @description
                 * Returns the list of fields used by codings prediction
                 *
                 * If it returns null, default fields are used ("LineType__", "Amount__", "GLAccount__", "CostCenter__", "TaxCode__").
                 *
                 * `Amount__` is mandatory and the list should contain one field among `GLAccount__`, `CostCenter__` and `TaxCode__`
                 *
                 * Any column could be used by codings prediction but best practices should be followed to garantuee performance:
                 * 	- use fields having standard data
                 * 	  fields with data that differs but matching the same template should not be used such as `Quantity__`, `UnitPrice__`, `OrderNumber__`, etc.
                 *  - the name of the columns must end by '__'
                 * 	- do not use too many fields
                 *
                 * @returns {Array<string>} An array of fields name that codings
                 *
                 * @example
                 * <pre><code>
                 *	GetCodingsPredictionFields: function()
                 *	{
                 *		return ["LineType__", "Amount__", "GLAccount__", "CostCenter__", "TaxCode__", "ProjectCode__"];
                 *	}
                 * </code></pre>
                 */
                Common.GetCodingsPredictionFields = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnInitInternalConversationPane
                 * @since 330
                 * @description
                 * Allows you to customize the internal conversation pane in the Vendor invoice process.
                 * This user exit is called from the HTML page script of the Vendor invoice process, when initializing the internal conversation pane.
                 * @param {InternalConversationOptions} options internal conversation options
                 * @returns {InternalConversationOptions} The internal conversation options
                 * @example
                 * <caption>This example allows to enable a conformation diaglog when adding a participant to the internal conversation</caption>
                 * OnInitInternalConversationPane: function (options)
                 * {
                 * 		options.noConfirmationDialog  = false;
                 *		return options;
                 *	}
                 */
                Common.OnInitInternalConversationPane = function (options) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnGetCodingsPredictionResults
                 * @description
                 * Allows to add behavior or when receiving data from the codings prediction webservice or altering the results if needed
                 * @param {ESKMap<string>} WSResult
                 * 	{
                 * 		data: Array containing the codings predicted for the line items
                 * 		extraInfo: Map containing additional informations such as the confidence for each field predicted, the average confidence by coding and the invoice sample size used
                 *  }
                 * @returns {ESKMap<string>} the modified WSResult if necessary
                 * @example
                 * <pre><code>
                 * OnGetCodingsPredictionResults: function(WSResult)
                 * {
                 * 	if (WSResult.extraInfo.invoiceSampleSize < 10)
                 * 	{
                 * 		WSResult.data = []; // Too few invoices in the sample for this supplier, we ignore the prediction
                 * 	}
                 * 	return WSResult;
                 * }
                 * </pre></code>
                 */
                Common.OnGetCodingsPredictionResults = function (WSResult) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnItemFieldSetConfidenceFromCodingsPrediction
                 * @description Allows custom behavior when setting predicted coding on a field
                 * @param {Item} item Current line item being worked on
                 * @param {number} lineNumber Line item number
                 * @param {string} column Line item field being set
                 * @param {Object} extraInfo Information about the prediction scores
                 * Shape of extraInfo: { ScoresByFields: [{column1__: '0.74'}, {column1__: '0.62'}], ScoresByDimension: {column1__: '0.72'} }
                 * @returns {boolean} If the prediction confidence has been settled
                 * @example
                 * <pre><code>
                 * OnItemFieldSetConfidenceFromCodingsPrediction: function (item, lineNumber, column, extraInfo)
                 * {
                 *  const confidence = Number(extraInfo.ScoresByFields?.[lineNumber]?.[column]);
                 *  item.SetConfidence(column, confidence * 100);
                 * 	if(column === "Amount__" && Number(Variable.GetValueAsString("CodingsPredictionSampleSize")) < 10 && !Number.isNaN(confidence) && confidence < 0.80)
                 * 	{
                 * 		item.SetWarning(column, "Low prediction confidence");
                 *  }
                 *  return true;
                 * }
                 * </code></pre>
                 */
                Common.OnItemFieldSetConfidenceFromCodingsPrediction = function (item, lineNumber, column, extraInfo) {
                };
                /**
                 * @method Lib.AP.Customization.Common.EnableCodingsPrediction
                 * @description
                 * Returns an object to specify the conditions to enable the codings prediction feature
                 *
                 * If it returns null, the codings prediction is enabled if the feature is enable on the AP Wizard.
                 *
                 * the object contains the variable enablePrediction to specify if the prediction of codings is enabled
                 * the object contains the variable enableMLDataCreation to specify if the this form will be take into account for the training of the next model
                 *
                 * @returns {CodingsPrediction} An object to define when the feature is enabled
                 *
                 * @example
                 * <pre><code>
                 *	EnableCodingsPrediction: function()
                 *	{
                 *		if (Data.GetValue("InvoiceType__") === "SpecificNonPoInvoice")
                 *			return { enablePrediction: true, enableMLDataCreation: true};
                 *		return { enablePrediction: false, enableMLDataCreation: false};
                 *	}
                 * </code></pre>
                 */
                Common.EnableCodingsPrediction = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetCodingTemplateName
                 * @since 365
                 * @description
                 * Allows you to override the coding template name applied to a non-PO/GL invoice before line extraction.
                 * Return a string to substitute the standard CodingTemplate__ value, or nothing to keep the default template name.
                 * @param {string} defaultTemplateName The standard coding template name read from the invoice.
                 * @returns {string | void} The coding template name to apply, or void to keep the standard value.
                 * @example <caption>Use a custom field to choose the coding template name for GL invoices.</caption>
                 * Common.GetCodingTemplateName = function (defaultTemplateName)
                 * {
                 * 	return Data.GetValue("Z_TeachingAssignmentTemplate__") || defaultTemplateName;
                 * };
                 */
                Common.GetCodingTemplateName = function (defaultTemplateName) {
                };
                /**
                 * @method Lib.AP.Customization.Common.EnableCodingsTemplates
                 * @since 327
                 * @description Returns a boolean to enable or disable the coding template feature (templates or MRU).
                 * @param templateName Coding template name - can be null, it means we'll use the last used values feature (MRU)
                 * @returns {boolean} false to disable the feature, true to keep it enabled (default).
                 *
                 * @example
                 * <caption>Enable codings templates</caption>
                 * Common.EnableCodingsTemplates = function(templateName)
                 *	{
                 *	 	if (templateName)
                 *		{
                 *			// Codings template feature
                 *			// (Read data from table "AP - Templates__")
                 *			// Keep feature enabled.
                 *			return true;
                 *		}
                 *		else
                 *		{
                 *			// Last used values feature
                 *			// (Read data from table "AP - Last used values__")
                 *			// Disable feature.
                 *			return false;
                 *		}
                 *	}
                 */
                Common.EnableCodingsTemplates = function (templateName) {
                };
                /**
                 * @method Lib.AP.Customization.Common.SetAlertWhenExtractedIBANDoesNotMatch
                 * @description
                 * This function is called when an IBAN has been extracted and does not match any of vendor's bank account. By default,
                 * Vendor Invoice Extraction Script set a warning on ExtractedIBAN__ field. This function allows you to set a different
                 * alert level and message on this field.
                 * @param {IControl} [extractedIbanControl] the ExtractedIBAN__ field control (only when called from the custom script)
                 * @return {boolean} is the alert level has been customized. You can also return null or false to work with the default behavior.
                 * @example
                 * <pre><code>
                 * SetAlertWhenExtractedIBANDoesNotMatch: function(extractedIbanControl)
                 * {
                 *	// change alert level to error and keep the same alert message
                 *	Data.SetError("ExtractedIBAN__", "_Extracted IBAN does not match");
                 *	if (extractedIbanControl)
                 *	{
                 *		// set a red background to the field
                 *		extractedIbanControl.AddStyle("highlight-danger");
                 *	}
                 *   // return false to keep benefits of default extra behavior such as the top banner
                 *	// you may return true if you don't wan't the banner for example.
                 *	return false;
                 * }
                 * </code></pre>
                 */
                Common.SetAlertWhenExtractedIBANDoesNotMatch = function (extractedIbanControl) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnValidateForm
                 * @description
                 * Allows you to customize the validation settings for the Vendor invoice process.
                 * This user exit is called at the end of the validation script of the process.
                 * @param {boolean} isFormValid The actual validation status of the form
                 * @returns {boolean|Promise<boolean>} isFormValid The updated validation status of the form
                 * @example
                 * <pre><code>
                 * OnValidateForm: function(isFormValid)
                 * {
                 * 		if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart &&
                 * 			Lib.AP.WorkflowCtrl.GetNbRemainingControllers() === 0 &&
                 * 			Lib.AP.WorkflowCtrl.GetNbRemainingApprovers() === 0)
                 * 		{
                 * 			// If the current step role is the AP Clerk
                 * 			// and if not a single validator is set, add an error on the invoice status field (the error will be clean at the next try)
                 * 			Data.SetError("InvoiceStatus__", "At least one approver is required before posting");
                 * 			return false;
                 * 		}
                 * 		return isFormValid;
                 * }
                 * </code></pre>
                 */
                Common.OnValidateForm = function (isFormValid) {
                };
                /**
                 * @method Lib.AP.Customization.Common.IsAPEndDisabled
                 * @since 352
                 * @description
                 * Allows you to disable the AP-End step insertion in the Vendor invoice workflow.
                 * This user exit is called from the workflow controller when AP-End contributors are built,
                 * and also when checking low-privilege AP routing logic.
                 * @returns {boolean|void} Return true to disable AP-End. Return false or void to keep standard behavior.
                 * @example <caption>Disable AP-End for PO invoices only.</caption>
                 * Common.IsAPEndDisabled = function ()
                 * {
                 * 	return Lib.AP.InvoiceType.isPOInvoice();
                 * };
                 */
                Common.IsAPEndDisabled = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.ShouldSkipAutolearningData
                 * @since 366
                 * @description
                 * Allows you to skip saving auto-learning data for the current invoice.
                 * This user exit is called before auto-learning data is saved during the first post and first approval action.
                 * @returns {boolean | void} Return true to skip saving auto-learning data, or void/false to keep standard behavior.
                 * @example <caption>Skip auto-learning data for tax invoices</caption>
                 * Common.ShouldSkipAutolearningData = function ()
                 * {
                 * 	return Data.GetValue("Z_TaxInvoice__") === "1";
                 * };
                 */
                Common.ShouldSkipAutolearningData = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnGetInvoiceDocument
                 * @since 348
                 * @description
                 * Allows you to run custom logic after SAP invoice document data is retrieved during a manual link.
                 * This user exit is called from the client when the document payload has been fetched and populated
                 * WARNING this user exit will be called also if we don't have query result (for example if the document does not exist).
                 * So if you want to use queryResult, please check if it is not null.
                 * @param {Sys.ERP.SAP.Browse.QueryValueForBrowse} queryResult The SAP query result wrapper containing invoice data.
                 * @param {boolean} isFI True when the linked document is FI; false for MM.
                 * @returns {void}
                 * @example <caption>This example maps a custom field from SAP to a custom field in the form.</caption>
                 * OnGetInvoiceDocument = function (queryResult, isFI)
                 * {
                 *     var queryValue = queryResult.GetQueryValue();
                 *     if (queryValue.Records && queryValue.Records.length > 0){
                 *         // Example: map SAP document type to a custom field
                 *         var documentType = queryValue.GetQueryValue("DocumentType__", 0);
                 *         if (documentType)
                 *         {
                 *             Data.SetValue("Z_DocumentType__", documentType);
                 *         }
                 *     }
                 * };
                 */
                Common.OnGetInvoiceDocument = function (queryResult, isFI) {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetBAPIName
                 * @description
                 * Allows you to retrieve the customized name from the specified default BAPI name.
                 * If a value is returned, it is used as the BAPI name; otherwise, standard behavior applies.
                 * @param {string} originalBapiName The initial BAPI name
                 * @returns {void | string} The custom BAPI name, or void. Only return values for BAPIs you want to override.
                 * @example <caption>Override only one BAPI and keep standard mapping for all others</caption>
                 * <pre><code>
                 * GetBAPIName: function(originalBapiName)
                 * {
                 * 	if (originalBapiName === "BAPI_INCOMINGINVOICE_CREATE")
                 * 	{
                 * 		return "Z_CUSTOM_BAPI_INVOICE_CREATE";
                 * 	}
                 * }
                 * </code></pre>
                 */
                Common.GetBAPIName = function (originalBapiName) {
                };
                /**
                 * BapiDefinition
                 * @typedef {Object} Lib.AP.Customization.Common.BapiDefinition
                 * @property {Object.<string, string | number>} [EXPORTS]
                 * @property {Object.<string, string | number>} [IMPORTS]
                 * @property {Object.<string, string | number>} [TABLES]
                 */
                /**
                 * @method Lib.AP.Customization.Common.GetDefaultBAPIParams
                 * @description
                 * Allows you to retrieve the customized name from the specified default BAPI name.
                 * @param {string} bapiname The current BAPI to initialize, if overrided by user exit GetBAPIName should be the bapiname returned e.g. Z_BAPI_ACC_DOCUMENT_POST
                 * @param {string} bapialias The usual BAPI name, if overrided by user exit GetBAPIName should be the original bapiname e.g BAPI_ACC_DOCUMENT_POST
                 * @param {BapiDefinition} defaultBapiParams the default bapi params resolved for the bapialias
                 * @return {BapiDefinition} The overrided default bapi params for the bapiname/bapialias
                 * @example
                 * <pre><code>
                 * GetDefaultBAPIParams: function(bapiname, bapialias, defaultBapiParams)
                 * {
                 * 	if (
                 * 			(bapialias === "BAPI_ACC_DOCUMENT" &&	bapiname === "Z_BAPI_ACC_DOC_POST_DOCOMMIT") ||
                 * 			(!bapialias && bapiname === "Z_BAPI_ACC_DOC_POST_DOCOMMIT")
                 * 	)
                 * 	{
                 * 		// Define your needed bapi params structure for this specific bapi
                 * 		return {
                 * 			EXPORTS: {},
                 * 			IMPORTS:{},
                 * 			TABLES:{}
                 * 		};
                 * 	}
                 * 	return defaultBapiParams;
                 * }
                 * </code></pre>
                 */
                Common.GetDefaultBAPIParams = function (bapiname, bapialias, defaultBapiParams) {
                    return defaultBapiParams;
                };
                /**
                 * @method Lib.AP.Customization.Common.FillCostType
                 * @description
                 * Allows you to fill the Cost Type according the GLAccount.
                 * @param {Item} item the line item the user is modifying
                 * @example
                 * <pre><code>
                 * FillCostType: function (item)
                 *{
                 *	switch(item.GetValue("GLAccount__"))
                 *	{
                 *		case "8300":
                 *			item.SetValue("CostType__","CapEx");
                 *				break;
                 *		default:
                 *			item.SetValue("CostType__","OpEx");
                 *			break;
                 *	}
                 *}
                 * </code></pre>
                 */
                Common.FillCostType = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.Common.SAPCurrenciesExternalFactors
                 * @description
                 * low Currencies may be stored in SAP without decimal, but in some SAP system, TCURF.FFACT gives 1 instead of 100 and falses Simulation result amounts,
                 * high Currencies may be stored in SAP with decimal, but in some SAP system, TCURF.FFACT gives 100 instead of 1 and falses Simulation result amounts
                 *
                 * Return all currency external factors to force if SAP returns an unexpected value
                 * @returns {Object.<string, number>}
                 * @example
                 * <pre><code>
                 * SAPCurrenciesExternalFactors: function()
                 * {
                 * 	return {
                 * 		JPY: 100
                 *  };
                 * }
                 * </code></pre>
                 */
                Common.SAPCurrenciesExternalFactors = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.SAPForeignCurrenciesFactorForSimulation
                 * @description
                 * low Currencies may be stored in SAP without decimal, but in some SAP system, TCURF.FFACT gives 1 instead of 100 and falses Simulation result amounts,
                 * high Currencies may be stored in SAP with decimal, but in some SAP system, TCURF.FFACT gives 100 instead of 1 and falses Simulation result amounts
                 *
                 * Return all currency foreign factors to force if SAP returns an unexpected value
                 * @deprecated use Lib.AP.Customization.Common.SAPCurrenciesExternalFactors instead
                 * @returns {{Object.<string, Object.<string, number>>}}
                 * @example
                 * <pre><code>
                 * SAPForeignCurrenciesFactorForSimulation: function()
                 * {
                 * 	return {
                 * 		EUR: {
                 * 			JPY: 1,
                 * 			USD: 100
                 * 		}
                 *  };
                 * }
                 * </code></pre>
                 */
                Common.SAPForeignCurrenciesFactorForSimulation = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeCurrenciesPrecision
                 * @description
                 * This user exit allows you to customize the currencies that does not have a precision of 2 decimals (for instance: integer currencies)
                 * Called in Lib_AP
                 * @param {Object.<string, number>} defaultPrecision the standard DEFAULT_PRECISION object
                 * @returns {Object.<string, number>}
                 * @example
                 * <pre><code>
                 * CustomizeCurrenciesPrecision: function(defaultPrecision)
                 * {
                 *		defaultPrecision.HUF = 0;
                 *		return defaultPrecision;
                 *  };
                 * }
                 * </code></pre>
                 */
                Common.CustomizeCurrenciesPrecision = function (defaultPrecision) {
                };
                /**
                 * @method Lib.AP.Customization.Common.SAPCheckVendorNumber
                 * @description
                 * This user exit will be called each time a call to Lib.AP.SAP.CheckVendorNumber is made.
                 * It can be use to override the default behavior or add extra checks.
                 * @param {Object} validationData a structure representing the state of validation
                 * @param {boolean} validationData.isValid indicates if the header vendor number is valid
                 * @param {string} validationData.vendorNumber represents the number against which is test the header vendor number,
                 * if not specified, the comparison is made against vendor number on each line items
                 * @returns a boolean to indicates if the user exit should override the default beahavior (true) or apply the default behavior (false)
                 * @example
                 * <pre><code>
                 * SAPCheckVendorNumber: function(validationData)
                 * {
                 * 		// threat as error instead of warning
                 * 		if (!validationData.isValid)
                 * 		{
                 * 			Data.SetError("VendorNumber__", "Vendor should match");
                 * 		}
                 * 		// return true to avoid the default behavior to apply
                 * 		return true;
                 * }
                 * </code></pre>
                 */
                Common.SAPCheckVendorNumber = function (validationData) {
                };
                /**
                 * RoundingCallback
                 * @callback Lib.AP.Customization.Common.RoundingCallback
                 * @param {number} amount
                 * @param {number} precision
                 * @returns {number} rounded amount
                 */
                /**
                 * TaxRoundingParameters
                 * @typedef {Object} Lib.AP.Customization.Common.TaxRoundingParameters
                 * @property {number} precision
                 * @property {RoundingCallback} roundingFct
                 */
                /**
                 * @method Lib.AP.Customization.Common.GetTaxRoundingParameters
                 * @description
                 * Allows you to customize the way the solution rounds the amounts during tax computation
                 * Returns a JSON object that set the amount precision to consider and the function used to round the amount.
                 * If an attribute is omitted in the return JSON object, default value is used (2 for precision, and "round half-up" function for roundingFct)
                 * and the user exit returns null, the default value is 2 for precision, and "round half-up" function for roundingFct
                 * @returns {TaxRoundingParameters} Json containing {precision: number, roundingFct: (amount: number, precision: number) => roundedAmount: number}
                 * @example
                 * <pre><code>
                 * GetTaxRoundingParameters: function()
                 * {
                 * 		if (Data.GetValue('InvoiceCurrency__') === 'JPY')
                 * 		{
                 * 			return {
                 * 				"precision": 0,
                 * 				"roundingFct": function(amount, precision)
                 * 				{
                 * 					var factor = Math.pow(10, precision);
                 * 					return Math.floor(amount*factor)/factor;
                 *				}
                 * 			};
                 * 		}
                 * 		return null;
                 * }
                 * </code></pre>
                 */
                Common.GetTaxRoundingParameters = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetUnitPriceAbsoluteTolerance
                 * @since 345
                 * @description
                 * Allows customization of the absolute tolerance for unit price comparison in Lib.AP.IsUnitPriceWithinTolerance.
                 * The absolute tolerance defines the maximum allowed unit price variance in absolute value.
                 * This tolerance is used both client side (to display warnings) and server side (for touchless exceptions).
                 * Default is 0.01.
                 * @returns {number | void} The custom absolute tolerance, or nothing to use the default (0.01)
                 * @example <caption>Allow 0.05 absolute variance</caption>
                 * Common.GetUnitPriceAbsoluteTolerance = function ()
                 * {
                 *     return 0.05;
                 * }
                 */
                Common.GetUnitPriceAbsoluteTolerance = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetUnitPriceRelativeTolerance
                 * @since 345
                 * @description
                 * Allows customization of the relative tolerance for unit price comparison in Lib.AP.IsUnitPriceWithinTolerance.
                 * The relative tolerance defines the maximum allowed unit price variance as a percentage of the expected unit price.
                 * This tolerance is used both client side (to display warnings) and server side (for touchless exceptions).
                 * Default is 0.0001 (0.01%).
                 * @returns {number | void} The custom relative tolerance (e.g., 0.001 for 0.1%), or nothing to use the default (0.0001)
                 * @example <caption>Allow 0.1% relative variance</caption>
                 * Common.GetUnitPriceRelativeTolerance = function ()
                 * {
                 *     return 0.001;
                 * }
                 */
                Common.GetUnitPriceRelativeTolerance = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetArchiveDuration
                 * @since 355
                 * @description
                 * Allows you to override the archive duration applied during Vendor Invoice Processing (extraction, validation, and finalization),
                 * Vendor Registration validation, and Vendor Statement Matching validation.
                 * Return a number to replace the standard AP parameter value.
                 * Return nothing to keep the default behavior.
                 * @param {number | undefined} currentArchiveDuration The archive duration currently resolved by standard behavior, or undefined if no AP archive duration parameter is configured.
                 * @returns {number | void} The custom archive duration in months, or void to keep standard behavior.
                 * @example <caption>Force all invoices to be archived for 60 months</caption>
                 * Common.GetArchiveDuration = function (currentArchiveDuration)
                 * {
                 * 	return 60;
                 * };
                 */
                Common.GetArchiveDuration = function (currentArchiveDuration) {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeMultipleTaxesSeparator
                 * @description
                 * Allows you to customize the separator used on multiple selection of tax code
                 * Returns a string that set the separator for concatenation of taxes code.
                 * If return null, the default separator is used
                 * @returns {string} the separator for concatenation of taxes code
                 * @example
                 * <pre><code>
                 * CustomizeMultipleTaxesSeparator: function()
                 * {
                 * 		if (Data.GetValue("CompanyCode__") === "CA01")
                 * 		{
                 * 			return "|";
                 * 		}
                 * 		return null;
                 * }
                 * </code></pre>
                 */
                Common.CustomizeMultipleTaxesSeparator = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.SetInvoiceUseMultipleTaxes
                 * @description
                 * Allows you to set tax code browse in multiple selection browse
                 * Returns a boolean if return true the tax code browse allow multiple selection.
                 * else return null or false, the tax code browse allow one selection.
                 * @returns {boolean} A boolean indicating if the tax browse allows multiple selection.
                 * @example
                 * <pre><code>
                 * SetInvoiceUseMultipleTaxes: function()
                 * {
                 * 		if (Data.GetValue("CompanyCode__") === "CA01")
                 * 		{
                 * 			return true;
                 * 		}
                 * 		return false;
                 * }
                 * </code></pre>
                 */
                Common.SetInvoiceUseMultipleTaxes = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeTaxRateQueryFilter
                 * @since 339
                 * @description
                 * Allows you to define a custom filter to apply when querying tax rates from the tax rate table.
                 * @param defaultFilter the default filter to customize
                 * @returns {string} the customized filter to apply
                 * @example
                 * <pre><code>
                 * CustomizeTaxRateQueryFilter: function(defaultFilter)
                 * {
                 * 		return `&(${defaultFilter}(Z_Region='${Data.GetValue("Z_Region__")}'))`;
                 * }
                 * </code></pre>
                 */
                Common.CustomizeTaxRateQueryFilter = function (defaultFilter) {
                };
                /**
                 * @method Lib.AP.Customization.Common.BuildTaxCacheKey
                 * @since 359
                 * @description
                 * Allows you to override the in-memory cache key used by `Lib.AP.TaxHelper.computeHeaderTaxAmount`
                 * to group line items per "tax bucket" for header-tax computation.
                 *
                 * The default key is the concatenation `taxCode + taxJurisdiction + taxRate`. Returning a non-empty
                 * string replaces this default; returning `void`/falsy keeps it.
                 *
                 * Typical use case: a single `TaxCode__` must resolve to different buckets depending on additional
                 * context (e.g. GL account / cost center for Non-PO lines, PO line + PO number for PO lines), so
                 * lines that share the same tax code but belong to different contexts are summed independently.
                 *
                 * @param {string} taxCode The standard `TaxCode__` value of the line item.
                 * @param {string} taxJurisdiction The standard `TaxJurisdiction__` value of the line item.
                 * @param {number} taxRate The standard `TaxRate__` value of the line item.
                 * @param {Item} item The current line item being processed.
                 * @returns {string | void} The custom cache key, or `void` to keep the default key.
                 * @example <caption>Split PO lines by PO number + PO line</caption>
                 * BuildTaxCacheKey: function (taxCode, taxJurisdiction, taxRate, item)
                 * {
                 *     var poNumber = item.GetValue("OrderNumber__");
                 *     if (poNumber)
                 *     {
                 *         return taxCode + taxJurisdiction + taxRate + "-" + poNumber + "-" + item.GetValue("OrderLineNumber__");
                 *     }
                 *     // Non-PO: split by GL + Cost Center
                 *     return taxCode + taxJurisdiction + taxRate + "-" + item.GetValue("AccountNumber__") + "-" + item.GetValue("CostCenter__");
                 * }
                 */
                Common.BuildTaxCacheKey = function (taxCode, taxJurisdiction, taxRate, item) {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeAutomaticMessage
                 * @description
                 * allows you to define custom messages to inject in conversations. You can differenciate the messages with the messageDesc parameter.
                 * @param {string} messageDesc description of the message (ex: "missingInvoices" or "requestCreditNotes")
                 * @returns {string} The customized message to inject in the conversation.
                 *
                 * @example
                 * <pre><code>function CustomizeAutomaticMessage(messageDesc)
                 * {
                 * 	// we want to add another information to the generated lines of the vendor statement reconciliation conversation
                 * 	// we added a new translation key "_Invoice {0} missing date of {1} for amount {2} and tax amount {3}" on the process and use this user exit to fill the fourth parameter
                 * 	var message = "";
                 * 	if (messageDesc == "missingInvoices")
                 * 	{
                 * 		var statementDate = Language.FormatDate(Data.GetValue("StatementDate__"));
                 * 		var invoicesList = [];
                 * 		var invoicesTableArray = Data.GetTable("InvoicesTable__");
                 * 		for (var i = 0; i < invoicesTableArray.GetItemCount(); i++)
                 * 		{
                 * 			var currentItem = invoicesTableArray.GetItem(i);
                 * 			var status = currentItem.GetValue("MatchingStatus__");
                 * 			if (status === Lib.AP.StatementMatching.Status.missing)
                 * 			{
                 * 				var invoiceDate = currentItem.GetValue("ReferenceDate__");
                 * 				var invoiceNumber = currentItem.GetValue("ReferenceNumber__");
                 * 				var invoiceAmount = currentItem.GetValue("ReferenceAmount__");
                 * 				var invoiceTaxAmount = currentItem.GetValue("ReferenceTaxAmount__");
                 * 				invoicesList.push(Language.Translate(
                 * 					"_Invoice {0} missing date of {1} for amount {2} and tax amount {3}",
                 * 					false,
                 * 					invoiceNumber,
                 * 					Language.FormatDate(invoiceDate),
                 * 					invoiceAmount,
                 * 					invoiceTaxAmount));
                 * 			}
                 * 		}
                 * 		message = Language.Translate("_Conversation invoices missing for the date: {0}, invoice list: {1}", false, statementDate, invoicesList.join("\n"));
                 * 	}
                 * 	return message;
                 * }</code></pre>
                 **/
                Common.CustomizeAutomaticMessage = function (messageDesc) {
                };
                /**
                 * @method Lib.AP.Customization.Common.AllowEditingDiscountAmount
                 * @description
                 * Allows modifying the 'EstimatedDiscountAmount__' field.
                 * Note: Additional customizations may be required for ERP integration to accommodate these changes.
                 * @return {boolean} If the current user should be allowed to manually enter/modify the discount amount on the form.
                 * @example
                 * <code>
                 * AllowEditingDiscountAmount: function()
                 * {
                 *     // Only allow modification of discount amount if not SAP and if payment terms are not setup to utilize dynamic discounting
                 *     return !Lib.ERP.IsSAP() && Variable.GetValueAsString("EnableDynamicDiscounting") !== "1";
                 * }
                 * </code>
                 * <code>
                 * AllowEditingDiscountAmount: function()
                 * {
                 *     // Only allow modification of discount amount if not a PO invoice. If doing this, you must catch
                 *     return !Lib.AP.InvoiceType.IsPOInvoice();
                 * }
                 * </code>
                 */
                Common.AllowEditingDiscountAmount = function () {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Common.IsPaymentDatesComputationDisabled
                 * @since 352
                 * @description
                 * Allows you to disable the recomputation of payment dates (DueDate__, DiscountLimitDate__) during invoice processing.
                 * When this user exit returns `true`, all payment date recomputation in `ComputePaymentAmountsAndDates` will be skipped, regardless of the invoice type and ERP system.
                 * By default (when not implemented), payment dates are recomputed normally.
                 * @returns {boolean | void} Return `true` to disable payment dates recomputation, or `void`/`undefined` to keep standard behavior.
                 * @example <caption>Disable payment dates recomputation for all invoices</caption>
                 * Common.IsPaymentDatesComputationDisabled = function ()
                 * {
                 *     return true;
                 * };
                 */
                Common.IsPaymentDatesComputationDisabled = function () {
                };
                /**
                 * @namespace Lib.AP.Customization.Common.PurchaseOrder
                 * @description
                 * Namespace for user exits specific to purchase orders related features
                 */
                Common.PurchaseOrder = {
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.AddPoLine
                     * @description
                     * Allows you to choose whether a purchase order or goods receipt item should be added into the Line Items table of the Vendor invoice process when adding a purchase order.
                     * @param {boolean} isPoLineAdded The original condition result
                     * @param {xVars} poItemVars Po item object
                     * @param {xVars} grItemVars GR item object
                     * @returns {boolean} isPoLineAdded
                     * @example
                     * <pre><code>
                     * AddPoLine: function (isPoLineAdded, poItemVars, grItemVars)
                     * {
                     * 	if(poItemVars)
                     *	{
                     *		isPoLineAdded = true;
                     *	}
                     *	else
                     *	{
                     *		isPoLineAdded = false;
                     *	}
                     *	return isPoLineAdded;
                     * }
                     * </code></pre>
                     */
                    AddPoLine: function (isPoLineAdded, poItemVars, grItemVars) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.AllowAddBrowsePOItem
                     * @since 352
                     * @description
                     * Allows you to prevent a PO line from being added to the invoice Line Items table when the AP Specialist browses for purchase orders in the Vendor Invoice Processing process.
                     * This user exit is called for all invoice types (PO and POGL).
                     * If you need to apply the filter to PO lines only, check Lib.AP.InvoiceType.isPOInvoice() inside your implementation.
                     * @param {Lib.AP.BrowsePO.ItemMap} itemMap PO line item data object as returned by the browse, giving access to fields such as DELIVEREDAMOUNT__, DELIVEREDQUANTITY__, ORDERNUMBER__, ITEMNUMBER__, etc.
                     * @returns {void | boolean} Return false to prevent the line from being added, or nothing (void/undefined) to allow it (default behavior)
                     * @example
                     * <caption>Prevent adding PO lines where no reception has been made (DeliveredAmount and DeliveredQuantity are both zero).
                     * In this example the check is skipped for POGL invoice types, so those lines are always allowed.</caption>
                     * AllowAddBrowsePOItem: function (itemMap)
                     * {
                     * 	if (!Lib.AP.InvoiceType.isPOGLInvoice() && itemMap.DELIVEREDAMOUNT__ === 0.00 && itemMap.DELIVEREDQUANTITY__ === 0)
                     *	{
                     *		// No reception recorded: prevent this line from being added to the invoice
                     *		return false;
                     *	}
                     * }
                     */
                    AllowAddBrowsePOItem: function (itemMap) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.OnAddPOLine
                     * @description
                     * Allows you to customize PO line details when the values are being added to the LineItems__ table
                     * @since 186
                     * @param {Item} tableItem Data.Item object representing the line item being added in the LineItems__ table
                     * @param {poItemDetails} poItemDetails JavaScript object representing the PO line details retrieved from the ERP (Line number, Tax code, Ordered quantity, etc.)
                     *		poItemDetails JavaScript Object attributes depend on ERP and client/server side.
                     *		Refer to the "sapMMAddLineItem" and "genericAndSapPOGLAddLineItem" methods in customscript, as well as the "AddPOLine" methods in Lib_AP for further details
                     * @param {Lib.AP.SAP.PurchaseOrder.PODetailsClient} poDetails Optional: In SAP-connected mode only, SapBAPI object representing all PO details as returned by BAPI_PO_GETDETAIL (Header details, PO history, etc.)
                     * @example
                     *  <caption>In the following example, the user exit is implemented to fill the taxCode field with a default value when missing on the PO line in the ERP.
                     *	It can prove useful for the AP Specialist if the Buyer didn't specify a tax code upon creating the PO but the nature of the company's business makes so that the Tax code always follows the same logic.</caption>
                     *	OnAddPOLine: function (tableItem, poItemDetails, poDetails)
                     *	{
                     *		if (tableItem && !tableItem.GetValue("TaxCode__"))
                     *		{
                     *			var prefix = "[" + tableItem.GetValue("OrderNumber__") + "/" + tableItem.GetValue("ItemNumber__") + "] ";
                     *			if (tableItem.GetValue("GLAccount__") === "123456")
                     *			{
                     *				Log.Info(prefix + "Applying tax code P0 for G/L '12345'");
                     *				tableItem.SetValue("TaxCode__", "P0");
                     *			}
                     *			else
                     *			{
                     *				Log.Info(prefix + "Applying tax code P1");
                     *				tableItem.SetValue("TaxCode__", "P1");
                     *			}
                     *		}
                     *	}
                     **/
                    OnAddPOLine: function (tableItem, poItemDetails, poDetails) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.GetExtendedPOSearchCriteria
                     * @description
                     * Use this function to add an extra research criteria upon current po number.
                     * Basically it is used when only a part on the purchase order is known as
                     * it may append when dealing with blanket purchase order,
                     * or when reading a contract number to query the ERP or the local P2P - Contract records
                     * to return an array of potential po numbers
                     * @param {string} poNumber The original current purchase order number
                     * @returns {string|Array<string>} The extended research string(s)
                     * @example
                     * <pre><code>
                     * GetExtendedPOSearchCriteria: function (poNumber)
                     * {
                     *   // fully qualified blanket poNumber should be [bpoNumber]-[releaseNumber]
                     * 	if (poNumber.indexOf('-') < 0)
                     *	{
                     *       // if poNumber represent only the bpoNumber part, extend search criteria to all ponumber based on the BPO
                     *		return  poNumber+"-*";
                     *	}
                     *
                     *	var sapContractx = /^0*[1-9][0-9]{5}$/;
                     *	if (poNumber && Lib.ERP.IsSAP() && sapContractx.test(poNumber))
                     *	{
                     *		// if captured poNumber has a contract syntax (here 6 digits), query the ERP or the local P2P - Contract records to retrieve the related poNumbers
                     *		var bapiParams = Lib.AP.SAP.PurchaseOrder.GetBapiParameters();
                     *		if (bapiParams)
                     *		{
                     *			var poFoundByContract = [];
                     *			var contractNum = Sys.Helpers.String.SAP.NormalizeID(poNumber, 10);
                     *			var filter = "KONNR = '" + contractNum + "'";
                     *			Log.Info("potential SAP contract captured on the document, search related POs in SAP: EKPO.EBELN, filter " + filter);
                     *			var contractQueryResults = Sys.Helpers.SAP.ReadSAPTable(bapiParams.GetBapi("RFC_READ_TABLE"), "EKPO", "EBELN", filter, 0, 0, false, { "useCache": true });
                     *			for (var i=0; contractQueryResults && i<contractQueryResults.length; i++)
                     *			{
                     *				var poNum = Sys.Helpers.String.SAP.Trim(contractQueryResults[0].EBELN);
                     *				if (poFoundByContract.indexOf(poNum) ==-1) {
                     *					poFoundByContract.push(poNum);
                     *				}
                     *			}
                     *			if (poFoundByContract.length) {
                     *				Log.Info("Found POs " + poFoundByContract.join(","));
                     *				return poFoundByContract;
                     *			}
                     *		}
                     *		else {
                     *			Log.Warn("Could not load bapiParam to search POs in SAP from read contract number " + poNumber);
                     *		}
                     *	}
                     *   // if the poNumber specified is fully qualified, don't return extended search criteria
                     *	return null;
                     * }
                     * </code></pre>
                     */
                    GetExtendedPOSearchCriteria: function (poNumber) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.ModifyOrderNumbersToSearch
                     * @since 340
                     * @description
                     * Allows customization of the list of order numbers to search before building the database filters.
                     * @param {Array<string>} orderNumbersToSearch The current list of PO numbers that will be used for search.
                     * @param {Array} orderNumbersCandidates Original candidate objects extracted from document (may contain area and other metadata)
                     * @returns {void}
                     * @example <caption>Remove any order number from the search list if it exists in the candidate list so it keeps only customized order numbers</caption>
                     * PurchaseOrder.ModifyOrderNumbersToSearch = function (orderNumbersToSearch, orderNumbersCandidates)
                     * {
                     * 		foreach (var candidate in orderNumbersCandidates)
                     * 		{
                     * 			if (orderNumbersToSearch.indexOf(candidate.standardStringValue) >= 0)
                     * 			{
                     * 				// remove it from the search list
                     * 				orderNumbersToSearch.splice(orderNumbersToSearch.indexOf(candidate.standardStringValue), 1);
                     * 			}
                     * 		}
                     * }
                     */
                    ModifyOrderNumbersToSearch: function (orderNumbersToSearch, orderNumbersCandidates) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.SetErrorWhenPOVendorDiffersFromHeaderVendor
                     * @description
                     * Allows you to set an error when the PO vendor on the line item field doesn't match the header field vendor; it will prevent posting if you return true.
                     * @param {Item} item The LineItems__ table item being passed in
                     * @returns {boolean} True if OrderNumber__ should be set in error when the PO vendor doesn't match the header vendor, False will set it in warning
                     */
                    SetErrorWhenPOVendorDiffersFromHeaderVendor: function (item) {
                        return false;
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.CustomPOLineItemValidation
                     * @since 351
                     * @description
                     * Allows you to add additional validation rules for PO line item.
                     * For example if the line item has a zero quantity but a non-zero amount, invoice posting can be blocked.
                     * The validation rules implemented in this user exit should return true if the line item is valid, and false if not.
                     * Returning false will block invoice posting.
                     * The implementation should set an error using item.SetCategorizedError(fieldName, errorCode, errorMessage) method
                     * to specify the field in error, the error code (as defined in Lib.AP.TouchlessException) and the error message to display.
                     * @param {Item} item The LineItems__ table item being validated
                     * @returns {boolean | void} true = valid, false = invalid; no return = standard validation behavior is kept.
                     * @example <caption>Block posting when quantity is zero but amount is not zero</caption>
                     * PurchaseOrder.CustomPOLineItemValidation = function (item)
                     * {
                     *		if (!item.IsNullOrEmpty("Amount__") && !item.IsNullOrEmpty("Quantity__"))
                     *		{
                     *			const quantityValue = item.GetValue("Quantity__");
                     *			const amountValue = item.GetValue("Amount__");
                     *			if (quantityValue === 0 && amountValue !== 0)
                     *			{
                     *				item.SetCategorizedError("Quantity__", Lib.AP.TouchlessException.InvalidValue, "Quantity cannot be zero when amount is not zero");
                     *				return false;
                     *			}
                     *		}
                     *		return true;
                     * }
                     */
                    CustomPOLineItemValidation: function (item) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.GetPOLineValuesToVerify
                     * @since 351
                     * @description
                     * This user exit allows you to customize the values that are verified and updated on the PO line items during the `UpdateExpectedValuesOnPOLine` process.
                     * By default, the system checks and updates `ExpectedAmount__`, `ExpectedQuantity__`, `OpenAmount__`, `OpenQuantity__`, and `NoGoodsReceipt__`.
                     * You can use this user exit to modify the `valueToVerify` object, for example to skip the check for specific fields or to change the precision.
                     * @param {object} valueToVerify The object containing the values to verify and update. The keys are the field names on the line item.
                     * 		{
                     * 			ExpectedAmount__: number,
                     * 			ExpectedQuantity__: number,
                     * 			OpenAmount__: number,
                     * 			OpenQuantity__: number,
                     * 			NoGoodsReceipt__: boolean
                     * 		}
                     * @param {Item} item The current line item being processed (DB item).
                     * @param {object} poItemValues The original values retrieved for the purchase order item.
                     * @returns {ESKMap<any>|void} The modified `valueToVerify` object to use for the update process. If void, the original `valueToVerify` object is used.
                     * @example
                     * GetPOLineValuesToVerify: function (valueToVerify, item, poItemValues)
                     * {
                     *    delete valueToVerify.ExpectedAmount__;
                     *    delete valueToVerify.ExpectedQuantity__;
                     *    return valueToVerify;
                     * }
                     */
                    GetPOLineValuesToVerify: function (valueToVerify, item, poItemValues) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.GetUpdateOrAddPOLineExpectedQuantity
                     * @since 362
                     * @description
                     * Allows you to override the rounding applied to `expectedQuantity` inside `UpdateOrAddPOLine`.
                     * By default the quantity is rounded to the precision of the `ExpectedQuantity__` field (5).
                     * Use this user exit when the default rounding does not match the precision stored on the line item,
                     * which would otherwise cause a false positive `updated` flag and wake invoices out of a waiting-GR status.
                     * @param {number} quantity The raw quantity value coming from the PO/ERP system.
                     * @param {Item} item The matching line item in the `LineItems__` table.
                     * @returns {number | void} The rounded quantity to use for the comparison. Return void to keep the default behavior.
                     * @example <caption>Force 5-decimal rounding to match the ExpectedQuantity__ field precision</caption>
                     * GetUpdateOrAddPOLineExpectedQuantity: function (quantity, item)
                     * {
                     *     return Sys.Helpers.Round(quantity, 5);
                     * }
                     */
                    GetUpdateOrAddPOLineExpectedQuantity: function (quantity, item) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.ShouldUpdateNotFoundPOLine
                     * @since 352
                     * @description
                     * This user exit is called during `UpdateExpectedValuesOnPOLine` when a PO line item on the invoice
                     * is not found in the local `AP_POItems` table.
                     * By default, the system zeroes out the expected/open amounts and quantities and sets a warning on the line.
                     * Return `false` to skip this treatment and leave the line unchanged.
                     * @param {Item} lineItem The current line item on the invoice.
                     * @param {string} orderNumber The purchase order number.
                     * @param {string} lineNumber The PO line item number.
                     * @returns {boolean | void} Return `false` to skip the not-found treatment. Return `true` or `void` for standard behavior (zero out values and set warning).
                     * @example <caption>Skip the not-found zeroing for POGL balancing lines</caption>
                     * PurchaseOrder.ShouldUpdateNotFoundPOLine = function (lineItem, orderNumber, lineNumber)
                     * {
                     *     if (Lib.P2P.InvoiceLineItem.IsPOGLLineItem(lineItem))
                     *     {
                     *         return false;
                     *     }
                     * };
                     */
                    ShouldUpdateNotFoundPOLine: function (lineItem, orderNumber, lineNumber) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.ShouldUpdateNotFoundGRLine
                     * @since 352
                     * @description
                     * This user exit is called during `UpdateExpectedValuesOnPOLine` when a GR (Goods Receipt) line item on the invoice
                     * is not found in the local `GRItems` table.
                     * By default, the system zeroes out the expected/open amounts and quantities and sets a warning on the line.
                     * Return `false` to skip this treatment and leave the line unchanged.
                     * @param {Item} lineItem The current line item on the invoice.
                     * @param {string} orderNumber The purchase order number.
                     * @param {string} lineNumber The GR line item number.
                     * @returns {boolean | void} Return `false` to skip the not-found treatment. Return `true` or `void` for standard behavior (zero out values and set warning).
                     * @example <caption>Skip the not-found zeroing for POGL balancing lines</caption>
                     * PurchaseOrder.ShouldUpdateNotFoundGRLine = function (lineItem, orderNumber, lineNumber)
                     * {
                     *     if (Lib.P2P.InvoiceLineItem.IsPOGLLineItem(lineItem))
                     *     {
                     *         return false;
                     *     }
                     * };
                     */
                    ShouldUpdateNotFoundGRLine: function (lineItem, orderNumber, lineNumber) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.ComputeExpectedValuesBasedOnOrderedValues
                     * @public
                     * @memberof Lib.AP.Customization.Common.PurchaseOrder
                     * @since 366
                     * @description
                     * Allows you to choose whether invoice expected amount and quantity are based on ordered/open or delivered values when NoGoodsReceipt__ is true.
                     * By default, ordered/open values are used when NoGoodsReceipt__ is true (only for PO not coming from purchasing application); otherwise delivered values are used.
                     * For PO generated from the purchasing application, there is always a RequestedDeliveryDate that will trigger the update of delivery values (even when no goods receipt is generated).
                     * @param {boolean} defaultUseOrderedValues The standard choice based on NoGoodsReceipt__ and IsLocalPO__.
                     * @param {xVars | Lib.AP.BrowsePO.ItemMap} poItemVars The purchase order item variables, which can be xVars on the server side or Lib.AP.BrowsePO.ItemMap on the client side.
                     * @returns {boolean | void} Return true to use ordered/open values, false to use delivered values, or void to keep the default.
                     * @example <caption>Only check NoGoodsReceipt__ value on the poItem </caption>
                     * PurchaseOrder.ComputeExpectedValuesBasedOnOrderedValues = function (defaultUseOrderedValues, poItemVars)
                     * {
                     *     if (Sys.ScriptInfo.IsServer())
                     *     {
                     *         return poItemVars.GetValue_Long("NoGoodsReceipt__", 0) === 1;
                     *     }
                     *     else
                     *     {
                     *         return Sys.Helpers.Data.IsTrue(poItemVars.NOGOODSRECEIPT__);
                     *     }
                     * };
                     */
                    ComputeExpectedValuesBasedOnOrderedValues: function (defaultUseOrderedValues, poItemVars) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.PurchaseOrder.OnExpectedValuesUpdated
                     * @since 366
                     * @description
                     * This user exit is called at the end of `UpdateExpectedValuesOnPOLine`, when posting a PO invoice (AP specialist step),
                     * after the PO/GR line items have been refreshed from the `AP_POItems` / `GRItems` tables.
                     * It exposes, for each line item, the fields whose value changed (old and new values) and whether the change requires
                     * a revalidation (expected/open amount or quantity now lower than the invoiced amount or quantity).
                     * Use it to give visibility on the updated values, for example by setting a computed value source, a warning or a log.
                     * It is called even when no value changed (empty array), but not when the order number filters cannot be built.
                     * This user exit is notification-only: its return value is ignored and it cannot change the revalidation decision.
                     * @param {object[]} updatedLines The updated line items. Empty array if no value changed.
                     * 		[{
                     * 			item: Item,
                     * 			lineIndex: number,
                     * 			poItemValues: object,
                     * 			updatedFields: { [fieldName: string]: { oldValue: any, newValue: any, requiresRevalidation: boolean } }
                     * 		}]
                     * @param {boolean} requiresRevalidation true if the invoice is blocked for revalidation ("Line items have been updated from master data, revalidation required.").
                     * @returns {void}
                     * @example <caption>Flag the fields refreshed from master data with a computed value source</caption>
                     * PurchaseOrder.OnExpectedValuesUpdated = function (updatedLines, requiresRevalidation)
                     * {
                     *     for (var i = 0; i < updatedLines.length; i++)
                     *     {
                     *         var line = updatedLines[i];
                     *         for (var fieldName in line.updatedFields)
                     *         {
                     *             var change = line.updatedFields[fieldName];
                     *             line.item.SetComputedValueSource(fieldName, change.requiresRevalidation ? "PO line refresh - revalidation required" : "PO line refresh");
                     *         }
                     *     }
                     * };
                     * @example <caption>Display a warning on the fields that block posting</caption>
                     * PurchaseOrder.OnExpectedValuesUpdated = function (updatedLines, requiresRevalidation)
                     * {
                     *     for (var i = 0; i < updatedLines.length; i++)
                     *     {
                     *         for (var fieldName in updatedLines[i].updatedFields)
                     *         {
                     *             var change = updatedLines[i].updatedFields[fieldName];
                     *             if (change.requiresRevalidation)
                     *             {
                     *                 updatedLines[i].item.SetWarning(fieldName, "Updated from master data: " + change.oldValue + " -> " + change.newValue);
                     *             }
                     *         }
                     *     }
                     * };
                     */
                    OnExpectedValuesUpdated: function (updatedLines, requiresRevalidation) {
                    }
                };
                /**
                 * @method Lib.AP.Customization.Common.OnVendorBankDetailsFetched
                 * @since 355
                 * @description
                 * Allows you to filter or modify the list of bank details retrieved from the ERP before display.
                 *
                 * If implemented, the function **must** return true to indicate it handled the result and you **must** call
                 * `resumeCallback` with the (filtered) array to display the results.
                 *
                 * If this function is not implemented or returns false, the original array is displayed unchanged.
                 * @param {ESK.ERP.BankDetails[]} bankAccounts The retrieved bank accounts to potentially filter/modify.
                 * @param {any} parameters Information about the vendor (e.g., `companyCode`, `vendorNumber`).
                 * @param {Lib.ERP.Manager.Instance} erpManager The current ERP manager instance.
                 * @param {function} resumeCallback Must be called with the final array to display.
                 * @returns {boolean} true if the user exit handled (or will handle asynchronously) the result, false otherwise.
                 * @example <caption>Synchronous: filter out bank accounts based on country</caption>
                 * OnVendorBankDetailsFetched: function (bankAccounts, parameters, erpManager, resumeCallback)
                 * {
                 * 	resumeCallback(bankAccounts.filter(function (account)
                 * 	{
                 * 		return account.Country === 'FR';
                 * 	}));
                 * 	return true;
                 *
                 * }
                 * @example <caption>Asynchronous: filter based on an async SAP query</caption>
                 * OnVendorBankDetailsFetched: function (bankAccounts, parameters, erpManager, resumeCallback)
                 * {
                 * 	 CustomFunctions.Bank.CheckValidityDate(bankAccounts, resumeCallback);
                 * 	 return true; // We return true because the callback will be called later
                 * }
                 */
                Common.OnVendorBankDetailsFetched = function (bankAccounts, parameters, erpManager, resumeCallback) {
                };
                /**
                 * Specifics SAP customizations
                 * @namespace Lib.AP.Customization.Common.SAP
                 */
                let SAP;
                (function (SAP) {
                    /**
                     * @method Lib.AP.Customization.Common.SAP.ShouldAddAccDataParameterForTaxComputation
                     * @description
                     * Allow to send or not the I_ACCDATA parameter to the Z_ESK_CALCULATE_TAX_FRM_NET BAPI
                     * @returns {boolean} True to send the fill and send the I_ACCDATA, false to avoid this.
                     * @example
                     * <pre><code>
                     * SAP.OnBuildOfApprovers = function()
                     * {
                     *		return false;
                     * };
                     * </code></pre>
                     */
                    SAP.ShouldAddAccDataParameterForTaxComputation = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetAccDataParameterForTaxComputation
                     * @description
                     * Allow to customize the data sent in the I_ACCDATA parameter of the Z_ESK_CALCULATE_TAX_FRM_NET BAPI
                     * @param {Object.<string, string>} currentAccData The current values that will be sent to SAP.
                     * @param {Item} lineItem The current line item for which the tax is computed
                     * @returns {Object.<string, string>} The key-value object to sent to SAP
                     * @example
                     * <pre><code>
                     * SAP.GetAccDataParameterForTaxComputation = function(currentAccData, lineItem)
                     * {
                     *		return { LIFNR: Data.GetValue("VendorNumber__") };
                     * };
                     * </code></pre>
                     */
                    SAP.GetAccDataParameterForTaxComputation = function (currentAccData, lineItem) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetCustomTaxCode
                     * @since 359
                     * @description
                     * Allows you to override the tax code value used by `Lib.AP.SAP.TaxHelper.getTaxRate`
                     * when caching/looking up the tax rate returned by the SAP `Z_ESK_CALCULATE_TAX_FRM_NET` BAPI.
                     *
                     * By default the line `TaxCode__` is used both as the cache entry and as the BAPI input.
                     * Returning a non-empty string replaces it; returning `void`/falsy keeps the default.
                     * Use this to make a single `TaxCode__` resolve to different cached rates depending on context
                     * (e.g. GL + Cost Center for Non-PO lines, PO line + PO number for PO lines), avoiding
                     * collisions on the same `TaxCode__`.
                     *
                     * **Important:** the returned value must match for two lines that should share the cached rate,
                     * and differ for two lines that must trigger a fresh BAPI call.
                     *
                     * @param {string} taxCode The standard `TaxCode__` value of the line item.
                     * @param {Item} item The current line item being processed.
                     * @returns {string | void} The custom tax code, or `void` to keep the default (`taxCode`).
                     * @example <caption>Split cache by GL + Cost Center for Non-PO lines, by PO for PO lines</caption>
                     * SAP.GetCustomTaxCode = function (taxCode, item)
                     * {
                     *     var poNumber = item.GetValue("OrderNumber__");
                     *     if (poNumber)
                     *     {
                     *         return taxCode + "-" + poNumber + "-" + item.GetValue("OrderLineNumber__");
                     *     }
                     *     return taxCode + "-" + item.GetValue("AccountNumber__") + "-" + item.GetValue("CostCenter__");
                     * };
                     */
                    SAP.GetCustomTaxCode = function (taxCode, item) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetCurrencyConversionDate
                     * @description
                     * Allow to customize the translation date used when calling the SAP BAPI Z_ESK_CONV_TO_FOREIGN_CURRENCY.
                     * This user exit can be used to override the date passed to the BAPI for currency conversion calculations.
                     * If not implemented or returns null/undefined, the original translation date will be used.
                     * @since 343
                     * @param {string} translationDate The original translation date in SAP format (YYYYMMDD).
                     * @param {string} currencyKey The local/source currency code.
                     * @param {string} foreignCurrencyKey The foreign/target currency code.
                     * @param {string} typeOfRate The type of exchange rate (M=Average, G=Bank buying, B=Bank selling).
                     * @returns {string} The customized translation date in SAP format (YYYYMMDD), or null/undefined to use the original date.
                     * @example <caption>Use current date for conversion</caption>
                     * SAP.GetCurrencyConversionDate = function(translationDate, currencyKey, foreignCurrencyKey, exchangeRate, typeOfRate)
                     * {
                     *		// Use the current date instead of the invoice date for currency conversion
                     *		return Sys.Helpers.SAP.FormatToSAPDateTimeFormat(new Date());
                     * };
                     * @example <caption>Use invoice date for conversion</caption>
                     * SAP.GetCurrencyConversionDate = function(translationDate, currencyKey, foreignCurrencyKey, typeOfRate)
                     * {
                     *		const invoiceDate = Data.GetValue("InvoiceDate__");
                     *		if (invoiceDate)
                     *		{
                     *			return Sys.Helpers.SAP.FormatToSAPDateTimeFormat(invoiceDate);
                     *		}
                     *		return translationDate; // fallback to original date
                     * };
                     */
                    SAP.GetCurrencyConversionDate = function (translationDate, currencyKey, foreignCurrencyKey, typeOfRate) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.OnComputePaymentTermsDatesEnd
                     * @description
                     * Use this function to customize or modify computed payment dates (due date and discount limit date) after they have been calculated.
                     * This user exit is called at the end of the SAP payment terms date computation on both client and server side.
                     * @since 354
                     * @param {Object} paymentTermsDatesData - Object containing computed payment dates
                     * @param {boolean} paymentTermsDatesData.keepCurrentDates - Flag indicating if current dates should be kept
                     * @param {Date | null} paymentTermsDatesData.dueDate - The computed due date, or null if no due date was determined
                     * @param {Date | null} paymentTermsDatesData.discountDate - The computed discount limit date, or null if no discount date was determined
                     * @example
                     * <pre><code>
                     * SAP.OnComputePaymentTermsDatesEnd = function (paymentTermsDatesData)
                     * {
                     *     // Check if calculated due date is older than 60 days
                     *     const dueDate = paymentTermsDatesData.dueDate;
                     *     const today = new Date();
                     *     let days = dueDate ? today.getTime() - dueDate.getTime() : 0;
                     *     days = days / (24 * 60 * 60 * 1000);
                     *     if (days > 60)
                     *     {
                     *         Data.SetWarning("DueDate__", "_Due date is older than 60 days");
                     *     }
                     *     else
                     *     {
                     *         Data.SetWarning("DueDate__", "");
                     *     }
                     * }
                     * </code></pre>
                     */
                    SAP.OnComputePaymentTermsDatesEnd = function (paymentTermsDatesData) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.TrimPartNumberLeadingZeros
                     * @description
                     * Enable trimming of PartNumber__ leading zeros for PO items.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} itemDetails An object containing all of the line item parameters.
                     * @returns {boolean} True if the leading zeros on the material number should be truncated, false otherwise.
                     */
                    SAP.TrimPartNumberLeadingZeros = function (itemDetails) {
                        return false;
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomQueryLanguage
                     * @description
                     * Allow to customize the language used in SAP queries.
                     * By default, the user's language is used
                     * @returns {string} Keyword to define the language :
                     * 		"%EDWLANGUAGE%" if you want to use the user's language
                     * 		"%SAPCONNECTIONLANGUAGE%" if you want to use the SAP configuration language
                     * 		"FR" or "IT" if you want you can set a ISO code manually to force it
                     * @example
                     * <pre><code>
                     * SAP.CustomQueryLanguage = function()
                     * {
                     * 		var queryLanguage = "";
                     *		switch(Sys.Helpers.Globals.User.language.toUpperCase())
                     *		{
                     *			case "FR":
                     *			case "EN":
                     *				queryLanguage = "%EDWLANGUAGE%";
                     *			break;
                     *			case "IT":
                     *				queryLanguage = "FR";
                     *			break;
                     *			default:
                     *				queryLanguage = "%SAPCONNECTIONLANGUAGE%";
                     *		}
                     * 		return queryLanguage;
                     * };
                     * </code></pre>
                     */
                    SAP.CustomQueryLanguage = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeDocumentType
                     * @description
                     * Allow to customize SAP document type in addition to wizard parameters.
                     * @param {string} documentType - The type of the document to be customized.
                     * @example
                     * <pre><code>
                     * SAP.CustomQueryLanguage = function()
                     * {
                     *		// When order number starts with 45, set invoice type to AM for credit notes and AI for invoices
                     *		if (Data.GetValue("OrderNumber__") && Data.GetValue("OrderNumber__").startsWith("45"))
                     *		{
                     *			documentType = parseFloat(Data.GetValue("InvoiceAmount__")) < 0 ? "AM" : "AI";
                     *		}
                     *		return documentType;
                     * };
                     * </code></pre>
                     * @returns {string} - The customized document type.
                     */
                    SAP.CustomizeDocumentType = function (documentType) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.IsEKBECacheEnabled
                     * @description
                     * Allow to enable or disable cache on EKBE table queries
                     * @returns {boolean} true to enable the cache, false to disabled it
                     */
                    SAP.IsEKBECacheEnabled = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeWSParams
                     * @description
                     * *This user exit is called if the SAP pre-built connector is selected with the Webservices(SOAP) integration method*
                     * Customize SOAP SAP parameters before sending the HTTPRequest. It can be used to add additional headers for instance.
                     * @example
                     * 	SAP.CustomizeWSParams = function (wsParams)
                     *	{
                     *		var sapBackEnd = Sys.Parameters.GetInstance("AP").GetParameter("Z_SAPBackEnd", "");
                     *		if (sapBackEnd)
                     *		{
                     *			wsParams.headers.target_system = sapBackEnd;
                     *		}
                     *		return wsParams;
                     *	};
                     * @returns {void | Sys.GenericAPI.HTTPRequestParam} parameters structure that will be used for SAP SOAP calls
                     */
                    SAP.CustomizeWSParams = function (wsParams) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeMMInvoiceDocumentTypeFilter
                     * @description
                     * This user exit is called after a MM posting, when we attempt to retrieve the FI document number
                     * Implement it if you used a custom doc type for posting, different from the ones configured in AP configurator
                     * @example
                     * <pre><code>
                     * SAP.CustomizeMMInvoiceDocumentTypeFilter = function ()
                     * {
                     * 		let customFilter = null;
                     * 		if (!Data.IsNullOrEmpty("EDIInvoiceType__"))
                     * 		{
                     * 			customFilter = "BLART = '" + Data.GetValue("EDIInvoiceType__") + "'";
                     * 		}
                     * 		return customFilter;
                     * };
                     * </code></pre>
                     * @returns {void | string} custom filter to use
                     */
                    SAP.CustomizeMMInvoiceDocumentTypeFilter = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetMultipleAccountAssignmentCategories
                     * @description
                     * This user exit is called when determining isMultipleAccountAssignment and allows you to define
                     * the account assignment categories that should be considered for multiple account assignment.
                     * This is called when checking an item in the line items table for multiple account assignment.
                     * @example
                     * <pre><code>
                     * SAP.GetMultipleAccountAssignmentCategories = function ()
                     * {
                     * 		return ["K", "P", "F"]
                     * };
                     * </code></pre>
                     * @returns {void | string[]} An array of account assignment category codes that should be treated as multiple account assignment
                     */
                    SAP.GetMultipleAccountAssignmentCategories = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomMultipleAccountAssignmentCondition
                     * @description
                     * This user exit is called when determining isMultipleAccountAssignment
                     * Implement it if you need to define other conditions for isMultipleAccountAssignment
                     * @example
                     * <pre><code>
                     * SAP.CustomMultipleAccountAssignmentCondition = function (poItemData, isMultipleAccountAssignment)
                     * {
                     * 		return (poItemData.AcctAssCat === "F" &&
                     * 			(
                     * 				Sys.Helpers.SAP.SAPValuesAreEqual(poItemData.Distribution, "1") ||
                     * 				Sys.Helpers.SAP.SAPValuesAreEqual(poItemData.Distribution, "2")
                     * 			)) || isMultipleAccountAssignment;
                     * };
                     * </code></pre>
                     * @returns {void | boolean} to determine if it is for multiple account assignment
                     */
                    SAP.CustomMultipleAccountAssignmentCondition = function (poItemData, isMultipleAccountAssignment) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.IsTaxJurisdictionError
                     * @description
                     * This user exit is called to determine if the error from SAP is related to Tax Jurisdiction
                     * @since 329
                     * @param {Object} error The error object returned from SAP
                     * @param {Item} item The line item object
                     * @example <caption>In this example, we consider any error with code 3 and a message containing "specify a tax jurisdiction key" as a Tax Jurisdiction error.</caption>
                     * SAP.IsTaxJurisdictionError = function (error)
                     * {
                     *		return (error.code === 3 && error.err && error.err.toLowerCase().indexOf("specify a tax jurisdiction key") !== -1);
                     * };
                     * @returns {void | boolean} true if the error is related to Tax Jurisdiction
                     */
                    SAP.IsTaxJurisdictionError = function (error, item) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizedTaxErrorMessage
                     * @description
                     * This user exit is called to determine if the field is used to set the error message.
                     * @example
                     * <pre><code>
                     * SAP.CustomizedTaxErrorMessage = function (errorField)
                     * {
                     * 		if (errorField === "TaxJurisdiction__")
                     * 		{
                     * 			return {
                     * 				error: "This field is required!",
                     * 				errorField: "",
                     * 				category: Lib.AP.TouchlessException.Other
                     * 			};
                     * 		}
                     * 		return null;
                     * };
                     * </code></pre>
                     * @returns {Lib.AP.SAP.TaxRateCallbackError | null} to return an object with error, errorField and category. Otherwise, return null
                     */
                    SAP.CustomizedTaxErrorMessage = function (errorField) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.itemNumberIdx
                     * @description
                     * This user exit is called to handle the item number index during a SAP post or simulation
                     * @example
                     * <pre><code>
                     * SAP.itemNumberIdx = function (itemNumberIdx, calculatedItemNumberIdx)
                     * {
                     * 		if (Data.GetValue("Z_DownPaymentRequest__") && Lib.AP.InvoiceType.isGLInvoice())
                     * 		{
                     * 			return itemNumberIdx;
                     * 		}
                     * 		return calculatedItemNumberIdx;
                     * };
                     * </code></pre>
                     * @param {number} itemNumberIdx
                     * @param {number} calculatedItemNumberIdx
                     * @returns {number} itemNumberIdx
                     */
                    SAP.itemNumberIdx = function (itemNumberIdx, calculatedItemNumberIdx) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.OnFIInvoiceLinesAdded
                     * @since 352
                     * @description
                     * Allows you to customize the SAP non-PO lines transmitted through the BAPI parameters of the FIAddGLLines function in the Lib_AP_SAP_Invoice_Common script library.
                     * This user exit is called from both HTML page script and validation script of the Vendor invoice process, when simulating or posting an invoice in the FI module of SAP.
                     * @param {Lib.AP.SAP.Invoice.Parameters} params The BAPI structure that will be sent to SAP
                     * @param {number} itemNumberIdx The current item number index
                     * @param {number} itemNumberTaxIdx The current tax item number index
                     * @returns {number | void} The updated itemNumberIdx, or void to use the default value
                     * @example <caption>Add custom tax lines from a custom taxes table</caption>
                     * OnFIInvoiceLinesAdded = function (params, itemNumberIdx, itemNumberTaxIdx)
                     * {
                     * 	var taxesTable = Data.GetTable("Z_MunicipalTaxes__");
                     * 	var taxesCount = taxesTable.GetItemCount();
                     * 	for (var i = 0; i < taxesCount; i++)
                     * 	{
                     * 		var tableItem = taxesTable.GetItem(i);
                     * 		if (Sys.ScriptInfo.IsClient())
                     * 		{
                     * 			var curAmountItem = Lib.AP.Customization.HTMLScripts.CustomUserExits.MapTaxForCurrencyAmount(tableItem);
                     * 			params.Bapi.TABLES.CURRENCYAMOUNT.push(curAmountItem);
                     * 			var accTaxItem = Lib.AP.Customization.HTMLScripts.CustomUserExits.MapTaxForAccountTax(tableItem);
                     * 			params.Bapi.TABLES.ACCOUNTTAX.push(accTaxItem);
                     * 			itemNumberIdx++;
                     * 			itemNumberTaxIdx++;
                     * 		}
                     * 		else
                     * 		{
                     * 			var curAmountItem = params.GetTable("BAPI_ACC_DOCUMENT", "CURRENCYAMOUNT").AddNew();
                     * 			Lib.AP.Customization.Validation.CustomUserExits.MapTaxForCurrencyAmount(tableItem, curAmountItem);
                     * 			var accountTaxItem = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTTAX").AddNew();
                     * 			Lib.AP.Customization.Validation.CustomUserExits.MapTaxForAccountTax(tableItem, accountTaxItem);
                     * 			itemNumberIdx++;
                     * 			itemNumberTaxIdx++;
                     * 		}
                     * 	}
                     * 	return itemNumberIdx;
                     * };
                     */
                    SAP.OnFIInvoiceLinesAdded = function (params, itemNumberIdx, itemNumberTaxIdx) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.OnMMInvoiceLinesAdded
                     * @since 352
                     * @description
                     * Allows you to customize the SAP invoice lines transmitted through the BAPI parameters of both MMCreateInvoice function in the Lib_AP_SAP_Invoice_Post and MMProcessLines function in the LIB_AP_SAP_Invoice_Simulation_Client script libraries.
                     * This user exit is called from both HTML page script and validation script of the Vendor invoice process, when simulating or posting an invoice in the MM module of SAP.
                     * @param {Lib.AP.SAP.Invoice.Parameters} params The BAPI structure that will be sent to SAP
                     * @param {number} itemNumberIdx The current item number index
                     * @returns {number | void} The updated itemNumberIdx, or void to use the default value
                     * @example <caption>Add custom tax lines from a custom taxes table</caption>
                     * OnMMInvoiceLinesAdded = function (params, itemNumberIdx)
                     * {
                     * 	var taxesTable = Data.GetTable("Z_MunicipalTaxes__");
                     * 	var taxesCount = taxesTable.GetItemCount();
                     * 	for (var i = 0; i < taxesCount; i++)
                     * 	{
                     * 		var tableItem = taxesTable.GetItem(i);
                     * 		if (Sys.ScriptInfo.IsClient())
                     * 		{
                     * 			var glTaxItem = Lib.AP.Customization.HTMLScripts.CustomUserExits.MapTaxForGlAccountData(tableItem);
                     * 			params.Bapi.TABLES.GLACCOUNTDATA.push(glTaxItem);
                     * 			itemNumberIdx++;
                     * 		}
                     * 		else
                     * 		{
                     * 			var glTaxItem = params.GetTable("BAPI_INCOMINGINVOICE", "GLACCOUNTDATA").AddNew();
                     * 			Lib.AP.Customization.Validation.CustomUserExits.MapTaxForGlAccountData(tableItem, glTaxItem);
                     * 			itemNumberIdx++;
                     * 		}
                     * 	}
                     * 	return itemNumberIdx;
                     * };
                     */
                    SAP.OnMMInvoiceLinesAdded = function (params, itemNumberIdx) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeExtendedWithholdingTaxQuery
                     * @description
                     * This user exit is called when quering Withholding Tax data
                     * Implement it if you want to customize the parameters of the query (filter, fields, cache, number of items retrieved, ...)
                     * @example
                     * <pre><code>
                     * SAP.CustomizeExtendedWithholdingTaxQuery = function ()
                     * {
                     *		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + " AND WT_SUBJCT = 'X'";
                     *		return params;
                     * };
                     * </code></pre>
                     * @param {{table: "LFBW", fields: string, filter: string, rowCount: number, rowSkip: number, useCache: boolean }} params the standard parameters of the query
                     * @returns {{table: "LFBW", fields: string, filter: string, rowCount: number, rowSkip: number, useCache: boolean }} custom parameters to use
                     */
                    function CustomizeExtendedWithholdingTaxQuery(params) {
                        return null;
                    }
                    SAP.CustomizeExtendedWithholdingTaxQuery = CustomizeExtendedWithholdingTaxQuery;
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeExtendedWithholdingTaxDescriptionQuery
                     * @description
                     * This user exit is called when quering Withholding Tax description
                     * Implement it if you want to customize the parameters of the query (filter, fields, cache, number of items retrieved, ...)
                     * @example
                     * <pre><code>
                     * SAP.CustomizeExtendedWithholdingTaxDescriptionQuery = function ()
                     * {
                     *	const country = Variable.GetValueAsString("companyCodeCountry") || Data.GetValue("VendorCountry__");
                     *	params.filter += Sys.Helpers.SAP.GetQuerySeparator() + "AND LAND1 = '" + country + "'";
                     *	return params;
                     * };
                     * </code></pre>
                     * @param {{table: "LFBW", fields: string, filter: string, rowCount: number, rowSkip: number, useCache: boolean }} params the standard parameters of the query
                     * @returns {{table: "LFBW", fields: string, filter: string, rowCount: number, rowSkip: number, useCache: boolean }} custom parameters to use
                    */
                    function CustomizeExtendedWithholdingTaxDescriptionQuery(params) {
                        return null;
                    }
                    SAP.CustomizeExtendedWithholdingTaxDescriptionQuery = CustomizeExtendedWithholdingTaxDescriptionQuery;
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetWSCustomErrorMessage
                     * @description
                     * This user exit is called when an error response code is returned from SAP web services call. It can be used to customize the error message or
                     * to retrieve an error message from a different element than standard solution supports
                     * @since 329
                     * @example <caption>In this example, if there is no message in the "faultstring" xml tag, we extract the error message from the custom xml tag "errormessage".</caption>
                     *	SAP.GetWSCustomErrorMessage = function (responseText)
                     *	{
                     *		if (responseText && responseText.indexOf("<faultstring") === -1 && responseText.toLowerCase().indexOf("<errormessage") !== -1)
                     *		{
                     *			const idxOpenTag = responseText.toLowerCase().indexOf("<errormessage");
                     *			const idxBeginMessage  = responseText.toLowerCase().indexOf(">", idxOpenTag);
                     *			const indexCloseTag  = responseText.toLowerCase().indexOf("</errormessage>");
                     *			if (idxBeginMessage  !== -1 &&
                     *				indexCloseTag  !== -1 &&
                     *				idxBeginMessage  + 1 < indexCloseTag )
                     *			{
                     *				const customWSErrorMessage = responseText.substring(idxBeginMessage  + 1, indexCloseTag );
                     *				return Sys.Helpers.Promise.Resolve(customWSErrorMessage);
                     *			}
                     *		}
                     *	};
                     * @returns {void | Promise<string>} promise resolving to a string that represents the custom error message to use
                     */
                    SAP.GetWSCustomErrorMessage = function (responseText) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetSAPToUTCOffsetInHours
                     * @description
                     * Returns the UTC offset (in hours) required to convert a time from the SAP user's time zone to UTC.
                     * This offset should be added to a SAP-local time to obtain the corresponding UTC time.
                     * If the offset is not available or is zero, no adjustment is made.
                     * The reference date is used to determine the correct offset, especially for time zones that observe daylight saving time.
                     * @since 331
                     * @param {Date} referenceDate Since 334 - The reference date which can be used for offset calculation, ie. to determine if daylight saving time is in effect.
                     * @returns {void | number} The number of offset in hours, if used
                     * @example
                     * <caption>Add offset in hours to convert SAP user time to UTC time</caption>
                     * SAP.GetSAPToUTCOffsetInHours = function(referenceDate)
                     * {
                     *	// Example: Replace this with dynamic retrieval if needed
                     *	const sapTimeZone = "MYT"; // Malaysia Time
                     *
                     * 	//Mapping of SAP time zones to UTC offsets (for SAP time → UTC conversion)
                     * 	const timeZoneOffsets = {
                     * 		"UTC": 0,
                     * 		"MYT": -8,		// Malaysia Time (UTC+8)
                     * 		"EST": +5,		// Eastern Standard Time (UTC-5)
                     * 		"EDT": +4,		// Eastern Daylight Time (UTC-4)
                     * 		"CST": +6,		// Central Standard Time (UTC-6)
                     * 		"CDT": +5,		// Central Daylight Time (UTC-5)
                     * 		"CET": -1,		// Central European Time (UTC+1)
                     * 		"CEST": -2,		// Central European Summer Time (UTC+2)
                     * 		"PST": +8,		// Pacific Standard Time (UTC-8)
                     * 		"PDT": +7,		// Pacific Daylight Time (UTC-7)
                     * 		"IST": -5.5,	// India Standard Time (UTC+5:30)
                     * 		"JST": -9		// Japan Standard Time (UTC+9)
                     * 	};
                     * 	return timeZoneOffsets[sapTimeZone];
                     * };
                     */
                    SAP.GetSAPToUTCOffsetInHours = function (referenceDate) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetPOItemHistoryForComputeTotalsForGR
                     * @description
                     * Allow to select the purchase order item history to use for computing totals for goods receipt (GR).
                     * This user exit is called before calling Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGR and update his first parameter
                     * Only call for invoice line items (Lib.AP.SAP.Invoice), not when computing purchase order item history totals
                     * which already send the current history item.
                     * @since 333
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory[]} itemDetailedHistories An array of purchase order item histories.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} poItemData The purchase order item data.
                     * @returns {POItemHistory} The purchase order item history to use for computing totals for goods receipt (GR).
                     * @example
                     * <caption>Add offset in hours to convert SAP user time to UTC time</caption>
                     * SAP.GetPOItemHistoryForComputeTotalsForGR = function()
                     * {
                     *		let historyIdx = 0;
                     *		if (poItemData.IsServiceItem())
                     *		{
                     *			// Make sure we pass the service line and not the GRs that may be partial.
                     *			for (let i = 0; i < itemDetailedHistories.length; i++)
                     *			{
                     *				if (itemDetailedHistories[i].PROCESS_ID === "9")
                     *				{
                     *					historyIdx = i;
                     *				}
                     *			}
                     *		}
                     *		return itemDetailedHistories[historyIdx];
                     * };
                    */
                    SAP.GetPOItemHistoryForComputeTotalsForGR = function (itemDetailedHistories, poItemData) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.ShouldIncludeGRHistoryEntry
                     * @since 358
                     * @description
                     * Allows you to override the deduplication logic when building PO item details per goods receipt (GR).
                     * By default, the system uses the key `REF_DOC-REF_DOC_IT-REF_DOC_YR` to deduplicate GR history entries and
                     * only creates one PO item per unique key. When REF_DOC is empty, all entries with an empty REF_DOC
                     * are collapsed into a single entry.
                     * Use this user exit to include entries that would otherwise be excluded by the standard deduplication,
                     * for example when REF_DOC is empty but the entries represent distinct goods receipts.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory} history The current GR history entry being evaluated.
                     * @param {string} historyKey The computed deduplication key (`REF_DOC-REF_DOC_IT-REF_DOC_YR`).
                     * @param {ESKMap<Lib.AP.SAP.PurchaseOrder.POItemHistory>} refDoc The map of already-included history keys. You may add entries to this map to track custom deduplication.
                     * @returns {boolean | void} Return `true` to include the entry, `false` to exclude it, or void/undefined to use the standard deduplication logic.
                     * @example
                     * <caption>Include all GR entries when REF_DOC is empty (no deduplication for entries without a material document)</caption>
                     * SAP.ShouldIncludeGRHistoryEntry = function (history, historyKey, refDoc)
                     * {
                     *  if (!history.REF_DOC)
                     *  {
                     *      return true;
                     *  }
                     * };
                     */
                    SAP.ShouldIncludeGRHistoryEntry = function (history, historyKey, refDoc) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetEKBEQueryParameters
                     * @since 355
                     * @description
                     * Allows you to modify the SAP query parameters used when reading EKBE purchase order history.
                     * This user exit is called before executing the EKBE query.
                     * Use it to extend the delivered query (for example, append fields or safely refine the filter),
                     * while preserving the standard EKBE query contract required by PO history computation.
                     *
                     * Constraints:
                     * - params.table must remain "EKBE".
                     * - params.fields must keep all delivered base EKBE fields used by standard PO history logic.
                     *   You may append custom fields, but do not remove or rename delivered ones.
                     * - params.filter may be tightened only if it remains compatible with delivered purchasing
                     *   document/item scope and does not exclude records required to build PO history.
                     *
                     * The parameter shape depends on the execution context:
                     * - Server-side (Lib.AP.SAP.ReadSAPTable): Lib.AP.SAP.ReadSAPTableParametersServer<"EKBE"> with rfcReadTableBapi, table, fields, filter, rowCount, rowSkip, noData, jsonOptions.
                     * - Client-side (Lib.AP.SAP.SAPQuery): Lib.AP.SAP.SAPQueryParameters with queryCallback, sapConf, table, fields, filter, rowCount, rowSkip, noData, useCache.
                     *
                     * Common fields across all contexts: table, fields (pipe-delimited), filter, rowCount, rowSkip, noData.
                     * @param {Lib.AP.SAP.ReadSAPTableParametersServer<"EKBE"> | Lib.AP.SAP.SAPQueryParameters} params An object containing the query parameters (shape depends on context):
                     *   - {string} table The SAP table to query (always "EKBE").
                     *   - {string} fields The pipe-delimited field names to retrieve (e.g., "EBELP|BWART|MENGE").
                     *   - {string} filter The WHERE clause filter to apply to the query.
                     *   - {number} rowCount The maximum number of rows to retrieve (0 for unlimited).
                     *   - {number} [rowSkip] The number of rows to skip.
                     *   - {boolean} noData Whether to skip data retrieval.
                     *   - Server-specific: {ISAP.Bapi<"RFC_READ_TABLE">} rfcReadTableBapi, {Sys.Helpers.SAP.ReadSAPTableJSONOptions} jsonOptions.
                     *   - Client-specific: {Function} queryCallback, {string} sapConf, {boolean} useCache.
                     * @returns {void | Lib.AP.SAP.ReadSAPTableParametersServer<"EKBE"> | Lib.AP.SAP.SAPQueryParameters} Return the modified params object to override query parameters while preserving EKBE base query compatibility, or void to use original params.
                     * @example <caption>In this example, we add a custom EKBE field and refine the filter.</caption>
                     * SAP.GetEKBEQueryParameters = function (params)
                     * {
                     * 	params.fields += "|ZZ_CUSTOM_EKBE";
                     * 	params.filter += " AND BWART <> '102'";
                     * 	return params;
                     * };
                     * @example <caption>Use Sys.ScriptInfo.IsClient() to apply context-specific logic.</caption>
                     * SAP.GetEKBEQueryParameters = function (params)
                     * {
                     * 	if (Sys.ScriptInfo.IsClient())
                     * 	{
                     * 		// Client-side only: params has sapConf, queryCallback, useCache
                     * 		params.fields += "|ZZ_CLIENT_FIELD";
                     * 	}
                     * 	else
                     * 	{
                     * 		// Server-side only: params has rfcReadTableBapi, jsonOptions
                     * 		params.fields += "|ZZ_SERVER_FIELD";
                     * 	}
                     * 	return params;
                     * };
                     */
                    SAP.GetEKBEQueryParameters = function (params) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.ExtendPOItemHistoryFieldsForEKBE
                     * @description
                     * Allows you to extend the purchase order item history with additional fields from the EKBE query result.
                     * This user exit is called when retrieving purchase order item history from EKBE table.
                     * The returned object is merged (via Object.assign) into the standard PO item history entry
                     * built from the EKBE result for the current record.
                     *
                     * The parameter shape depends on the execution context:
                     * - Server-side: queryResult is an ISAP.ReadSAPTableRecord<"EKBE"> (a single record object). recordIndex is not provided.
                     * - Client-side: queryResult is a QueryResult object. Use queryResult.GetQueryValue(fieldName, recordIndex) to read field values.
                     * @since 355
                     * @param {any} queryResult The EKBE query result. Server: a single record object. Client: a QueryResult with indexed access.
                     * @param {number} [recordIndex] The index of the current record (client-side only).
                     * @returns {ESKMap<any> | void} An object whose properties will be merged into the PO item history entry, or void to add nothing.
                     * @example <caption>Add the field "LIFNR" to the purchase order item history</caption>
                     * SAP.ExtendPOItemHistoryFieldsForEKBE = function (queryResult, recordIndex)
                     * {
                     * 	if (Sys.ScriptInfo.IsClient())
                     * 	{
                     * 		return { LIFNR: queryResult.GetQueryValue("LIFNR", recordIndex) };
                     * 	}
                     * 	return { LIFNR: queryResult.LIFNR };
                     * };
                     */
                    SAP.ExtendPOItemHistoryFieldsForEKBE = function (queryResult, recordIndex) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.TransformPOItemHistoricsFromEKBE
                     * @since 358
                     * @description
                     * Allows sorting or transforming the purchase order item historics array built from EKBE rows.
                     * This user exit is called on client-side after all historics are assembled and just before callback processing.
                     * Mutate the input array in place to customize ordering or filtering.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory[]} historics The assembled historics array to transform in place.
                     * @example <caption>Sort historics to process goods receipts (E) before invoice receipts (Q)</caption>
                     * SAP.TransformPOItemHistoricsFromEKBE = function (historics)
                     * {
                     * 	historics.sort(function (a, b)
                     * 	{
                     * 		return a.HIST_TYPE > b.HIST_TYPE ? 1 : -1;
                     * 	});
                     * };
                     */
                    SAP.TransformPOItemHistoricsFromEKBE = function (historics) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.AdjustGRAmountForSpecialMovementTypes
                     * @description
                     * Allow to adjust the GR amount for special movement types such as returns.
                     * This user exit is called from Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGR when computing totals for goods receipt (GR) and allows to adjust the GR amount based on the purchase order item history and data.
                     * Because this GR totals computation is also reused by generic purchase order totals logic, this user exit can be called in invoice-related contexts as well as in purchase order totals computation contexts.
                     * Do not assume it is limited to invoice line items only.
                     * @since 355
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory} aPoItemHistory The purchase order item history.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} poItem The purchase order item data.
                     * @returns {{ aPoItemHistory: Lib.AP.SAP.PurchaseOrder.POItemHistory, DeliveredAmount: number }} An object containing the adjusted purchase order item history and/or the adjusted delivered amount for goods receipt (GR).
                     * @example
                     * <caption>Adjust GR amount for returns</caption>
                     * SAP.AdjustGRAmountForSpecialMovementTypes = function (aPoItemHistory, poItem)
                     * {
                     * 	if (aPoItemHistory.MOVE_TYPE === "103")
                     * 	{
                     * 		aPoItemHistory.QUANTITY = aPoItemHistory.BL_QTY;
                     * 	}
                     * 	return { aPoItemHistory: aPoItemHistory };
                     * };
                     */
                    SAP.AdjustGRAmountForSpecialMovementTypes = function (aPoItemHistory, poItem) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.DisableUpdateOfOpenAndExpectedOnLineUpdate
                     * @description Allows you to disable the update of the Open and Expected amount and quantity during post or simulation of an invoice.
                     * @since 333
                     * @param {PurchaseOrder.POItemData} poItemData The associated PO item
                     * @returns {boolean} Whether to disable the update of Open and Expected amount and quantity.
                     * @example
                     * SAP.DisableUpdateOfOpenAndExpectedOnLineUpdate = function(simulationReport, simulationError)
                     * {
                     *		return poItemData.IsServiceItem();
                     * };
                     **/
                    SAP.DisableUpdateOfOpenAndExpectedOnLineUpdate = function (poItemData) {
                    };
                    /*
                     * @method Lib.AP.Customization.Common.SAP.VendorBankDetails_AccountsAdditionalFields
                     * @since 332
                     * @description
                     * Allows you to add additional fields to the vendor bank details (from the table LFBK).
                     * @returns {Lib.ERP.SAP.SAPField[]} An array of additional fields to add to the vendor bank details.
                     * @example <caption>In this example, we add two custom fields to the vendor bank details.</caption>
                     * SAP.VendorBankDetails_AccountsAdditionalFields = function ()
                     * {
                     * 	return [
                     * 		{
                     * 			nameInForm: "Z_CustomField1__",
                     * 			nameInSAP: "Z_CUSTOM_FIELD1"
                     * 		},
                     * 		{
                     * 			nameInForm: "Z_CustomField2__",
                     * 			nameInSAP: "Z_CUSTOM_FIELD2"
                     * 		}
                     * 	];
                     * };
                     */
                    SAP.VendorBankDetails_AccountsAdditionalFields = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.VendorBankDetails_BankInfoAdditionalFields
                     * @since 332
                     * @description
                     * Allows you to add additional fields to the vendor bank details (from the table BNKA).
                     * @returns {Lib.ERP.SAP.SAPField[]} An array of additional fields to add to the vendor bank details.
                     * @example <caption>In this example, we add two custom fields to the vendor bank details.</caption>
                     * SAP.VendorBankDetails_BankInfoAdditionalFields = function ()
                     * {
                     * 	return [
                     * 		{
                     * 			nameInForm: "Z_CustomField1__",
                     * 			nameInSAP: "Z_CUSTOM_FIELD1"
                     * 		},
                     * 		{
                     * 			nameInForm: "Z_CustomField2__",
                     * 			nameInSAP: "Z_CUSTOM_FIELD2"
                     * 		}
                     * 	];
                     * };
                     */
                    SAP.VendorBankDetails_BankInfoAdditionalFields = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.VendorBankDetails_IbanAdditionalFields
                     * @since 332
                     * @description
                     * Allows you to add additional fields to the vendor bank details (from the table TIBAN).
                     * @returns {Lib.ERP.SAP.SAPField[]} An array of additional fields to add to the vendor bank details.
                     * @example <caption>In this example, we add two custom fields to the vendor bank details.</caption>
                     * SAP.VendorBankDetails_IbanAdditionalFields = function ()
                     * {
                     * 		return [
                     * 			{
                     * 				nameInForm: "Z_CustomField1__",
                     * 				nameInSAP: "Z_CUSTOM_FIELD1"
                     * 			},
                     * 			{
                     * 				nameInForm: "Z_CustomField2__",
                     * 				nameInSAP: "Z_CUSTOM_FIELD2"
                     * 			}
                     * 		];
                     * 	};
                     */
                    SAP.VendorBankDetails_IbanAdditionalFields = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetCustomFilterForTaxProcedure
                     * @since 334
                     * @description
                     * Allows you to set a specific filter to retrieve tax procedure.
                     * @param {boolean} forBrowse specify if the filter is applied for browse filtering (if true companyCode is not provided)
                     * @param {string} [companyCode] the actual company code for which we try to get tax procedure (available only in server side call)
                     * @returns {string} a filter to apply
                     * @example <caption>Exclude inactive tax procedure</caption>
                     * SAP.GetCustomFilterForTaxProcedure = function (forBrowse, companyCode)
                     * {
                     * 		// XINACT should be a space to exclude inactive tax procedure
                     * 		if (forBrowse)
                     * 		{
                     * 			return "XINACT = ' '";
                     * 		}
                     * 		return "BUKRS = '" + companyCode + "' AND XINACT = ' '";
                     * };
                     */
                    SAP.GetCustomFilterForTaxProcedure = function (forBrowse, companyCode) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetCustomFilterForCostCenter
                     * @since 346
                     * @description
                     * Allows you to set a specific filter to retrieve cost center.
                     * @param {boolean} forBrowse specify if the filter is applied for browse filtering (if true companyCode is not provided)
                     * @param {string} originalFilter the original filter computed by the application
                     * @param {string} [companyCode] the actual company code for which we try to get cost center (available only in server side call)
                     * @param {string} [costCenter] the cost center for which we try to get description (available only in server side call)
                     * @returns {string} a filter to apply
                     * @example <caption>Filter by Controlling Area</caption>
                     * SAP.GetCustomFilterForCostCenter = function (forBrowse, originalFilter, companyCode, costCenter)
                     * {
                     * 		if (forBrowse)
                     * 		{
                     * 			return "KOKRS = 'AGL1'";
                     * 		}
                     * 		// Server side: must return full filter
                     * 		return originalFilter + " AND KOKRS = 'AGL1'";
                     * };
                     */
                    SAP.GetCustomFilterForCostCenter = function (forBrowse, originalFilter, companyCode, costCenter) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeLineItemExpectedValues
                     * @since 335
                     * @description
                     * Allows you to customize the expected values for line items.
                     * @param {Item} item The line item object for which to compute expected values.
                     * @returns {POItemData | void} Returns the item data with customized expected values.
                     * Return void to use the default expected values calculation.
                     * @example
                     * <caption>Example of customizing expected values</caption>
                     * SAP.CustomizeLineItemExpectedValues = function (item)
                     * {
                     * 	item.refExpectedQuantity = item.Quantity;
                     * 	item.refExpectedAmount = item.Amount;
                     * 	return item;
                     * };
                     */
                    SAP.CustomizeLineItemExpectedValues = function (item) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeGRItemExpectedValues
                     * @since 359
                     * @description
                     * Allows you to customize the expected quantity and amount for GR-based (Goods Receipt) PO line items.
                     *
                     * This user exit is called at the end of UpdateValuesOfGRItem, in both the server and client side.
                     * It receives the PO item data and the GR totals object.
                     *
                     * Return the modified item to override its values (for example refExpectedQuantity and/or refExpectedAmount).
                     * Return void to keep the standard behavior.
                     *
                     * @param {POItemData} poItemData The PO item data.
                     * @param {TotalsForGR} totals The GR totals object exposing totalDeliveredQty, totalDeliveredAmount, totalInvoicedQty, totalInvoicedAmount.
                     * @returns {POItemData | void} Returns the item data with customized expected values, or void to keep defaults.
                     * @example <caption>Customize expected values for negative-delivery items (returns)</caption>
                     * SAP.CustomizeGRItemExpectedValues = function (poItemData, totals)
                     * {
                     * 	if (poItemData.Ret_Item)
                     * 	{
                     * 		poItemData.refExpectedQuantity = totals.totalDeliveredQty - totals.totalInvoicedQty;
                     * 		poItemData.refExpectedAmount = totals.totalDeliveredAmount - totals.totalInvoicedAmount;
                     * 	}
                     * 	else
                     * 	{
                     * 		poItemData.refExpectedQuantity = Math.max(0, poItemData.refExpectedQuantity);
                     * 		poItemData.refExpectedAmount = Math.max(0, poItemData.refExpectedAmount);
                     * 	}
                     * 	poItemData.refOpenInvoiceQuantity = poItemData.refExpectedQuantity;
                     * 	poItemData.refOpenInvoiceValue = poItemData.refExpectedAmount;
                     * 	return poItemData;
                     * };
                     */
                    SAP.CustomizeGRItemExpectedValues = function (poItemData, totals) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeLineItemPassedValuesComputing
                     * @since 351
                     * @description
                     * Allows you to customize the computation of passed values for PO line items.
                     *
                     * This user exit is called from ComputePassedValues.
                     * Return the modified item to apply your custom calculation.
                     * Return void to keep the standard, category-specific behavior implemented by ComputePassedValues.
                     *
                     * Standard behavior when this exit returns void (high-level overview):
                     * - For limit items and service items: item.refDeliveredAmount = 0 and item.refInvoicedAmount = item.Val_Iv_For.
                     * - For goods items: item.refDeliveredAmount and item.refInvoicedAmount are derived from GR-based logic
                     *   (for example, using GetGRForeignValue and quantity-based fallbacks).
                     *
                     * @param {POItemData} item The PO line item to customize.
                     * @returns {POItemData | void} Returns the customized item, or void to keep the default, category-specific behavior.
                     * @example <caption>Customize passed values depending on the item category</caption>
                     * SAP.CustomizeLineItemPassedValuesComputing = function (item)
                     * {
                     * 	if (item.IsLimitItem())
                     * 	{
                     * 		item.refDeliveredAmount = 0;
                     * 		item.refInvoicedAmount = item.Val_Iv_For;
                     * 		return item;
                     * 	}
                     * 	else if (item.IsServiceItem())
                     * 	{
                     * 		item.refDeliveredAmount = item.Val_Gr_For;
                     * 		item.refInvoicedAmount = item.Val_Iv_For;
                     * 		return item;
                     * 	}
                     * };
                     */
                    SAP.CustomizeLineItemPassedValuesComputing = function (item) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.OverrideIsOpenInvoiceItem
                     * @since 351
                     * @description
                     * Allows you to override whether a PO item is considered open for invoicing.
                     *
                     * This user exit is called from IsOpenInvoiceItem and receives the PO item data
                     * along with the standard computed result.
                     *
                     * Return true or false to override the standard result.
                     * Return void to keep the standard behavior.
                     *
                     * @param {POItemData} poItemData The current PO item data.
                     * @param {boolean} standardIsOpenInvoiceItem The standard computed result.
                     * @returns {boolean | void} The overridden open-invoice result, or void to keep standard behavior.
                     * @example <caption>Use delivered vs invoiced quantity for service items</caption>
                     * SAP.OverrideIsOpenInvoiceItem = function (poItemData, standardIsOpenInvoiceItem)
                     * {
                     * 	if (poItemData.IsServiceItem())
                     * 	{
                     * 		return !(poItemData.Final_Inv || (poItemData.Deliv_Qty === poItemData.Iv_Qty));
                     * 	}
                     * 	return standardIsOpenInvoiceItem;
                     * };
                     */
                    SAP.OverrideIsOpenInvoiceItem = function (poItemData, standardIsOpenInvoiceItem) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.ValidateFIGLLine
                     * @description
                     * Allows you to do a custom validation on FIGLLine line item.
                     * @param {Item} line FIGLLine line item.
                     * @param {{errNum: string, errMessage: string}} currentError Current error message and SAP reference number associated.
                     *
                     * @returns {{errNum: string, errMessage: string} | void}
                     * To override the current error, return an object with errNum and errMessage properties.
                     * If the function returns null or undefined, the current error is kept unchanged.
                     * @example <caption>pass error validation if Z_DisableCheckFIGLLine is true</caption>
                     * SAP.ValidateFIGLLine = function (line, currentError)
                     * {
                     *	if (Data.GetValue("Z_DisableCheckFIGLLine") === true)
                     *	{
                     *		return {
                     *			errNum: "",
                     *			errMessage: ""
                     *		};
                     *	}
                     * };
                     */
                    SAP.ValidateFIGLLine = function (line, currentError) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.SkipAddAccountAssignmentLine
                     * @description Allows to skip the function AddAccountAssignmentLine for example for service entry sheets
                     * @param {Item} item The LineItems__ table item being processed
                     * @returns {boolean}
                     * @example <caption>Skip AddAccountAssignmentLine if a column containing account assignment info is already filled on the item</caption>
                     * SAP.SkipAddAccountAssignmentLine = function (item)
                     * {
                     *		return !Sys.Helpers.IsEmpty(item.GetValue("Z_SESAccountAssignments__"));
                     * }
                     */
                    SAP.SkipAddAccountAssignmentLine = function (item) {
                        return false;
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.SkipReadAccountAssignment
                     * @description Allows to skip the reading of account assignment for example for service entry sheets
                     * @param {Item} item The PO item object coming from SAP
                     * @returns {boolean}
                     * @example <caption>Skip account assignment info read if the item from SAP is a service item</caption>
                     * SAP.SkipReadAccountAssignment = function (item)
                     * {
                     *		return item.IsServiceItem();
                     * }
                     */
                    SAP.SkipReadAccountAssignment = function (item) {
                        return false;
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.SkipCreateAccountAssignmentLines
                     * @since 363
                     * @description
                     * Allows to skip the creation of one invoice line per SAP account assignment during the extraction of a purchase order item,
                     * for example for service entry sheet items which must remain on a single invoice line.
                     * When this user exit returns true, a single line is created for the purchase order item instead of one line per account assignment.
                     * It is called both for the classic SAP extraction and for the S/4HANA Cloud extraction.
                     *
                     * Important: returning true only changes the number of lines created. Depending
                     * on the connector and account-assignment data, the resulting line may retain
                     * values derived from the first account assignment. The customization must
                     * ensure that Amount__, Quantity__, GLAccount__, CostCenter__, and other
                     * accounting values are correct for the resulting single line.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData | any} item The PO item object coming from SAP
                     * @returns {boolean | void} True to create a single line for the PO item, false or nothing to keep the default behavior (one line per account assignment)
                     * @example <caption>Create a single invoice line for service entry sheet items</caption>
                     * SAP.SkipCreateAccountAssignmentLines = function (item)
                     * {
                     *	return item.Item_Cat === "9";
                     * }
                     */
                    SAP.SkipCreateAccountAssignmentLines = function (item) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetBAPIPOGetDetailsConfig
                     * @since 341
                     * @description
                     * Allows customization of BAPI_PO_GETDETAIL configuration to retrieve additional structures like EXTENSIONS.
                     * This user exit is called before executing BAPI_PO_GETDETAIL to allow modification of the BAPI parameters
                     * and configuration, enabling retrieval of custom fields from structures such as EXTENSIONS/VALUEPART.
                     * @param {ESKMap<boolean>} defaultConfig - The default BAPI configuration parameters
                     * @returns {ESKMap<boolean>|void} - Modified configuration or void to use default configuration
                     * @example
                     * <caption>Enable EXTENSIONS and EXTENSIONSIN structures to retrieve custom fields from VALUEPART</caption>
                     * SAP.GetBAPIPOGetDetailsConfig = function(defaultConfig)
                     * {
                     *     // Enable EXTENSIONS structure retrieval to get custom fields
                     *     var customConfig = Sys.Helpers.Extend(true, {}, defaultConfig);
                     *     customConfig.EXTENSIONS = true;
                     *     customConfig.EXTENSIONSIN = true;
                     *     return customConfig;
                     * }
                     */
                    SAP.GetBAPIPOGetDetailsConfig = function (defaultConfig) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetCustomExchangeRateType
                     * @since 341
                     * @description
                     * Allow to configure the type of rate when doing a BAPI call to SAP, instead of relying on the hardcoded default "M".
                     * @param {string} localCurrency The local currency code
                     * @param {string} foreignCurrency The foreign currency code
                     * @returns {string} The exchange rate type to use
                     * @example
                     * <caption>Customize exchange rate type if the local currency is different than the foreign currency.</caption>
                     * SAP.GetCustomExchangeRateType = function(localCurrency, foreignCurrency)
                     * {
                     * 		if (localCurrency === "EUR" && foreignCurrency === "USD")
                     *		{
                     *			return "B"; // Use type B for EUR to USD
                     *		}
                     *		// Return nothing to use the default type "M"
                     * };
                     */
                    SAP.GetCustomExchangeRateType = function (localCurrency, foreignCurrency) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.OnAddAccountAssignmentLine
                     * @since 345
                     * @description
                     * This User Exit is called when an account assignment line is added. It lets you intercept and customize the accountingLine object before it is sent to SAP, allowing you to modify existing fields or add custom ones as needed.
                     * @param {SAP.Structures.BAPI_INCINV_CREATE_ACCOUNT} accountingLine the accounting line that will be added
                     * @param {string} invoiceDocItem the invoice document name
                     * @param {Lib.AP.SAP.AccountAssignment} accountAssignmentFromPO the account assignment defined on purchase order document
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} poItemData the item from the PO the accounting line refers to
                     * @param {Item} line the item in the invoice document that the accounting line refers to
                     * @param {boolean} isSubsequentDoc flag to indicate if we are dealing with a subsequent document
                     * @returns {void}
                     * @example
                     * <caption>Set a custom field on the account assignment line.</caption>
                     * SAP.OnAddAccountAssignmentLine = function(accountingLine, invoiceDocItem, accountAssignmentFromPO, poItemData, line, isSubsequentDoc)
                     * {
                     * 		accountingLine.NAME = Sys.Helpers.String.SAP.NormalizeID(line.GetValue("FieldName__"), 4);
                     * };
                     */
                    SAP.OnAddAccountAssignmentLine = function (accountingLine, invoiceDocItem, accountAssignmentFromPO, poItemData, line, isSubsequentDoc) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.GetItemCategoriesWithNoQuantity
                     * @since 346
                     * @description
                     * Allows to set item categories for which no quantity should be sent to BAPI (NoQuantity parameter)
                     * @param {string[]} categories array containing the standard categories, ie "1" and "9"
                     * @returns {void | string[]} array of categories for which no quantity should be sent to BAPI. Don't return anything to use the standard ones.
                     * @example
                     * <caption>Add item category "A" to list of item categories</caption>
                     * SAP.GetItemCategoriesWithNoQuantity = function(categories)
                     * {
                     * 		categories.push("A");
                     *		return categories;
                     * };
                     */
                    SAP.GetItemCategoriesWithNoQuantity = function (categories) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.IsServiceItem
                     * @since 351
                     * @description
                     * Allows you to determine if a PO item should be treated as a service item.
                     * If you return a boolean, it will override the standard behavior.
                     * If you return void or do not implement this function, the default behavior applies (Item_Cat === "9").
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} item The PO item data
                     * @returns {void | boolean} True if the item is a service item, false if not, or void to use standard logic.
                     * @example
                     * SAP.IsServiceItem = function (item)
                     * {
                     * 		return item.Item_Cat === "9" || item.Item_Cat === "A";
                     * };
                     */
                    SAP.IsServiceItem = function (item) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeSAPConfigurations
                     * @since 353
                     * @description
                     * Allows to customize SAP configurations used in AP, by mutating the default configuration object initialized by the application.
                     * @param defaultSAPConfigurations The default SAP configurations
                     * @example <caption>Customize the VATNumber__ mapping on the vendor configuration</caption>
                     * SAP.CustomizeSAPConfigurations = function (defaultSAPConfigurations)
                     * {
                     * 		delete defaultSAPConfigurations.sapConfigForVendor.sapField2FFFieldMapping.STCEG;
                     * 		defaultSAPConfigurations.sapConfigForVendor.sapField2FFFieldMapping.STCD1 = "VATNumber__";
                     * };
                     */
                    SAP.CustomizeSAPConfigurations = function (defaultSAPConfigurations) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.SAP.IsExtractedIbanMatchingBankAccount
                     * @since 355
                     * @description
                     * Allows to customize the IBAN matching logic when checking if the extracted IBAN matches
                     * a vendor bank account. By default, the system checks for an exact match between the
                     * extracted IBAN and the IBAN from SAP. This user exit is called for each bank account and
                     * allows returning true to extend the match if a custom comparison is needed (e.g., partial match, prefix/suffix match).
                     * To use with the user exit Lib.AP.Customization.Common.SAP.Query.VendorBankDetails_Iban to retrieve a custom IBAN from SAP to compare with the extracted IBAN.
                     * @param {ESK.ERP.BankDetails} account The vendor bank account to check
                     * @param {string} extractedIban The IBAN extracted from the invoice
                     * @returns {void | boolean} Return true to consider the IBAN as matching for this account,
                     * false to explicitly reject it, or nothing to keep the standard exact-match logic
                     * @example <caption>Match when the SAP IBAN contains the extracted IBAN</caption>
                     * SAP.IsExtractedIbanMatchingBankAccount = function (account, extractedIban)
                     * {
                     *     if (account.IBAN && account.IBAN.indexOf(extractedIban) !== -1)
                     *     {
                     *         return true;
                     *     }
                     *     return false;
                     * };
                     */
                    SAP.IsExtractedIbanMatchingBankAccount = function (account, extractedIban) {
                    };
                    /**
                     * Specifics SAP customizations for planned delivery costs
                     * @namespace Lib.AP.Customization.Common.SAP.PlannedDeliveryCosts
                     */
                    let PlannedDeliveryCosts;
                    (function (PlannedDeliveryCosts) {
                        /**
                         * @method Lib.AP.Customization.Common.SAP.PlannedDeliveryCosts.CustomizeConditionTypeDescriptionFilter
                         * @description
                         * Customize the filter applied to get condition type dscription
                         * @param {string} filter The filter to apply
                         * @returns {void | string} The filter to apply
                         * @example
                         * <caption>Extend the filter with a custom criteria</caption>
                         * PlannedDeliveryCosts.CustomizeConditionTypeDescriptionFilter = function (filter) {
                         *  const separator = Sys.Helpers.SAP.GetQuerySeparator();
                         * 	return filter + `${filter} ${separator} AND KAPPL = 'M'`;
                         * }
                         * @example
                         * <caption>Change the default language</caption>
                         * PlannedDeliveryCosts.CustomizeConditionTypeDescriptionFilter = function (filter) {
                         * 	return filter.replace(/SPRAS\s*=\s* \'.+?\'/, "SPRAS = 'E'");
                         * }
                         */
                        PlannedDeliveryCosts.CustomizeConditionTypeDescriptionFilter = function (filter) {
                        };
                        /**
                         * @method Lib.AP.Customization.Common.SAP.PlannedDeliveryCosts.GetAdditionalGroupingKeys
                         * @since 360
                         * @description
                         * Allows to sub-group delivery costs (EKBZ lines) within the same item number (EBELP) and condition type (KSCHL) before they are merged.
                         * Return an array of EKBZ field names to add grouping levels after the standard grouping keys:
                         * delivery costs sharing the same item and condition type but having a different value for any of these fields will not be merged together.
                         * Return void to keep the standard behavior (merge by item number and condition type only).
                         * @returns {void | string[]} A list of EKBZ field names to use as additional grouping keys, or void
                         * @example <caption>Prevent merging delivery costs having the same condition type but a different condition counter</caption>
                         * PlannedDeliveryCosts.GetAdditionalGroupingKeys = function ()
                         * {
                         * 	return ["ZAEHK"];
                         * };
                         * @example <caption>Add several grouping levels after the standard grouping keys</caption>
                         * PlannedDeliveryCosts.GetAdditionalGroupingKeys = function ()
                         * {
                         * 	return ["ZAEHK", "LIFNR"];
                         * };
                         */
                        PlannedDeliveryCosts.GetAdditionalGroupingKeys = function () {
                        };
                    })(PlannedDeliveryCosts = SAP.PlannedDeliveryCosts || (SAP.PlannedDeliveryCosts = {}));
                    /**
                     * @method Lib.AP.Customization.Common.SAP.CustomizeInvoicingPlanFilter
                     * @since 360
                     * @description
                     * Called before querying the FPLT table to compute open invoice values for invoicing plans.
                     * Allows you to customize the filter applied to the FPLT SAP query.
                     * Return a modified filter string or void to keep the original filter.
                     * @param {string} filter The original FPLT query filter
                     * @returns {void | string} The customized filter to apply, or void to use the original
                     * @example <caption>Filter invoicing plan lines by date to exclude future-dated lines</caption>
                     * SAP.CustomizeInvoicingPlanFilter = function (filter)
                     * {
                     * 	var invoiceDate = Data.GetValue("InvoiceDate__");
                     * 	if (invoiceDate)
                     * 	{
                     * 		var firstOfMonth = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1);
                     * 		var formattedDate = Sys.Helpers.Date.Format(firstOfMonth, "yyyymmdd");
                     * 		return filter + " AND AFDAT <= '" + formattedDate + "'";
                     * 	}
                     * };
                     */
                    SAP.CustomizeInvoicingPlanFilter = function (filter) {
                    };
                    /**
                     * Specifics SAP customizations for duplicate check
                     * @namespace Lib.AP.Customization.Common.SAP.DuplicateCheck
                     */
                    let DuplicateCheck;
                    (function (DuplicateCheck) {
                        /**
                         *
                         * @method Lib.AP.Customization.Common.SAP.DuplicateCheck.CustomizeDuplicateCheckCallback
                         * @description
                         * Allows to implements custom behavior for simulation duplicate callback
                         * This user exit is called after the simulation of invoice duplicate check
                         * @param {Array} sapDuplicateCandidates The SAP duplicate candidates
                         * @param {Lib.AP.SAP.Invoice.SimulationReport} simulationReport The simulation report
                         * @returns {boolean} return true if we bypass standard code of DuplicateCheckCallback function
                         * @example
                         * <pre><code>
                         * CustomizeDuplicateCheckCallback: function (sapDuplicateCandidates, simulationReport)
                         * {
                         *		const duplicateInfoTable = Variable.GetValueAsString("DuplicateInfoTable") != "" ? JSON.parse(Variable.GetValueAsString("DuplicateInfoTable")) : null;
                            *		var errorsString = [];
                            *		var warningsString = [];
                            *		for (var j = 0; j < sapDuplicateCandidates.length; j++)
                            *		{
                            *			var duplicate = sapDuplicateCandidates[j].split("-");
                            *			var foundDuplicate = duplicateInfoTable.find(function(dup)
                            *			{
                            *				return dup.BELNR == duplicate[0] && dup.BUKRS == duplicate[1] && dup.GJAHR == duplicate[2];
                            *			});
                            *			if (foundDuplicate)
                            *			{
                            *				if ((!Lib.AP.InvoiceType.isPOInvoice() && foundDuplicate.WRBTR.trim() == Data.GetValue("InvoiceAmount__"))
                            *					|| (Lib.AP.InvoiceType.isPOInvoice() && foundDuplicate.RMWWR.trim() == Data.GetValue("InvoiceAmount__"))
                            *				)
                            *				{
                            *					errorsString.push(sapDuplicateCandidates[j]);
                            *				}
                            *				else
                            *				{
                            *					warningsString.push(sapDuplicateCandidates[j]);
                            *				}
                            *			}
                            *		}
                            *
                            *		if (errorsString.length > 0)
                            *		{
                            *			var duplicateErrorMessage = Language.Translate("_SAP Duplicate found", false, errorsString.join(", "));
                            *			Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "E", "009", duplicateErrorMessage);
                            *		}
                            *		if (warningsString.length > 0)
                            *		{
                            *			var duplicateWarningMessage = Language.Translate("_SAP Duplicate warning", false, warningsString.join(", "));
                            *			Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "", "ESKAP", "W", "009", duplicateWarningMessage);
                            *		}
                            * }
                            * </code></pre>
                        */
                        DuplicateCheck.CustomizeDuplicateCheckCallback = function (sapDuplicateCandidates, simulationReport) {
                            return null;
                        };
                        /**
                         *
                         * @method Lib.AP.Customization.Common.SAP.DuplicateCheck.OnCustomizeSAPReadSAPTableFilter
                         * @description
                         * This user exit is called when a read SAP table is performed.
                         * It allows you to customize the filter used to read the SAP table.
                         * @param {string} tableName The name of the table to read
                         * @param {string} filter The filter to apply
                         * @returns {void | string} The filter to apply or empty string if no filter should be applied
                         * @example
                         * <pre><code>
                         * OnCustomizeSAPReadSAPTableFilter: function (tableName, filter)
                         * {
                         * 		if (tableName === "EKPO")
                         * 		{
                         * 			return filter + " AND EBELN = '4500000001'";
                         * 		}
                         *      else
                         * 		{
                         * 			return "";
                         * 		}
                         * }
                         * </code></pre>
                         */
                        DuplicateCheck.OnCustomizeSAPReadSAPTableFilter = function (tableName, filter) {
                        };
                        /**
                         *
                         * @method Lib.AP.Customization.Common.SAP.DuplicateCheck.OnCustomizeSAPReadSAPTableAttributes
                         * @description
                         * This user exit is called when a read SAP table is performed.
                         * It allows you to customize the attributes of records fetched from SAP.
                         * @param {string} tableName The name of the table to read
                         * @param {string} attributes The attributes currently retrieved
                         * @returns {void | string} Attributes to fetch, or nothing so the default attributes are fetched
                         * @example
                         * <pre><code>
                         * OnCustomizeSAPReadSAPTableAttributes: function (tableName, attributes)
                         * {
                         * 		if (tableName === "RBKP")
                         *		{
                            *			return attributes + "|WAERS";
                            *		}
                            * }
                            * </code></pre>
                            */
                        DuplicateCheck.OnCustomizeSAPReadSAPTableAttributes = function (tableName, attributes) {
                        };
                        /**
                         *
                         * @method Lib.AP.Customization.Common.SAP.DuplicateCheck.OnCustomizeSAPAddDuplicateAmountFilter
                         * @description
                         * This user exit is called when a duplicate amount filter is added.
                         * It allows you to customize the filter used to add the duplicate amount filter.
                         * @param {string} duplicateAmountFilter The filter to apply
                         * @param {string} normalizedInvoiceAmount The normalized invoice amount
                         * @param {boolean} bForMM A boolean indicating if the filter is for MM or not
                         * @returns {void | string} The filter to apply or empty string if no filter should be applied
                         * @example
                         * <pre><code>
                         * OnCustomizeSAPAddDuplicateAmountFilter: function (duplicateAmountFilter, normalizedInvoiceAmount, bForMM)
                         * {
                         * 		if (bForMM)
                         * 		{
                         * 			return duplicateAmountFilter + " AND WRBTR = " + normalizedInvoiceAmount;
                         * 		}
                         * 		else
                         * 		{
                         * 			return "";
                         * 		}
                         * }
                         * </code></pre>
                         */
                        DuplicateCheck.OnCustomizeSAPAddDuplicateAmountFilter = function (duplicateAmountFilter, normalizedInvoiceAmount, bForMM) {
                        };
                        /**
                         *
                         * @method Lib.AP.Customization.Common.SAP.DuplicateCheck.OnAddDuplicateCandidates
                         * @description
                         * This user exit is called when the duplicate result object is created
                         * It allows you to customize the duplicates returned, or do any custom treatement when the duplicate query is done
                         * @param {ISAP.ReadSAPTableResult<"BKPF">} SAPQueryResults the query results from SAP
                         * @param {string[]} duplicateCandidates The duplicates candidates returned by the method
                         * @example
                         * <pre><code>
                         * OnAddDuplicateCandidates: function (SAPQueryResults, duplicateCandidates)
                         * {
                         * 		for (let i = 0; i < duplicateCandidates.length; i++)
                         *		{
                         *			if (SAPQueryResults[i])
                         *			{
                         *				// Display the currency of duplicate invoices
                         *				duplicateCandidates[i] += " - " +  SAPQueryResults[i].WAERS;
                         *			}
                         *		}
                         * }
                         * </code></pre>
                            */
                        DuplicateCheck.OnAddDuplicateCandidates = function (SAPQueryResults, duplicateCandidates) {
                        };
                    })(DuplicateCheck = SAP.DuplicateCheck || (SAP.DuplicateCheck = {}));
                    /**
                     * Specifics SAP customizations for query
                     * @namespace Lib.AP.Customization.Common.SAP.Query
                     */
                    let Query;
                    (function (Query) {
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Query.VendorBankDetails_BankInfo
                         * @since 332
                         * @description
                         * Allows you to modify all the parameters used in the SAPQuery for the Vendor Bank Details Bank Record (BNKA).
                         * @param {Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} params An object containing all parameters:
                         *   - {string | ISAPBapiManager} sapConf The SAP configuration or BAPI manager to use.
                         *   - {string} table The SAP table to query.
                         *   - {string} filter The filter to apply to the query.
                         *   - {Sys.GenericAPI.QueryAttribute<T_in>[]} attributes The attributes to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryCallback<T_out>} callback The callback to call with the results.
                         *   - {number} [maxRecords] The maximum number of records to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryOptions<T_in, T_out>} [options] Additional options for the query.
                         * @returns {void | Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} The modified parameters to use for the SAP query.
                         * @example <caption>In this example, we add a custom field to the attributes and modify the callback to include additional fields in the results.</caption>
                         * Query.VendorBankDetails_BankInfo: function (params)
                         * {
                         * 		args.attributes.push("Z_CUSTOMFIELDS_BNKA__");
                         * 		var callback = args.callback;
                         * 		args.callback = function (results, error)
                         * 		{
                         * 			additionalFields = [{ nameInForm: "Z_CustomFields_BNKA__", nameInSAP: "Z_CUSTOMFIELDS_BNKA__" }];
                         * 			for (result of results)
                         * 			{
                         * 				for (const accKey in erpInvoiceDocument.accountsByKey)
                         * 				{
                         * 					const account = erpInvoiceDocument.accountsByKey[accKey];
                         * 					if (account.Country === result.BANKS && account.Key === result.BANKL)
                         * 					{
                         * 						for (const field in additionalFields)
                         * 						{
                         * 							account[additionalFields[field].nameInForm] = result[additionalFields[field].nameInSAP];
                         * 						}
                         * 					}
                         * 				}
                         * 			}
                         * 			callback(results, error);
                         * 		}
                         * 		return args;
                         * }
                         */
                        Query.VendorBankDetails_BankInfo = function (params) {
                        };
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Query.VendorBankDetails_Iban
                         * @since 332
                         * @description
                         * Allows you to modify all the parameters used in the SAPQuery for the Vendor Bank Details IBAN Record (TIBAN).
                         * @param {Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} params An object containing all parameters:
                         *   - {string | ISAPBapiManager} sapConf The SAP configuration or BAPI manager to use.
                         *   - {string} table The SAP table to query.
                         *   - {string} filter The filter to apply to the query.
                         *   - {Sys.GenericAPI.QueryAttribute<T_in>[]} attributes The attributes to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryCallback<T_out>} callback The callback to call with the results.
                         *   - {number} [maxRecords] The maximum number of records to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryOptions<T_in, T_out>} [options] Additional options for the query.
                         * @returns {void | Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} The modified parameters to use for the SAP query.
                         * @example <caption>In this example, we modify the filter to only retrieve IBAN records for a specific bank country.</caption>
                         * Query.VendorBankDetails_Iban: function (params)
                         * {
                         * 		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + " AND LAND1 = 'FR'";
                         * 		return params;
                         * }
                         */
                        Query.VendorBankDetails_Iban = function (params) {
                        };
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Query.VendorBankDetails_Accounts
                         * @since 332
                         * @description
                         * Allows you to modify all the parameters used in the SAPQuery for the Vendor Bank Details Bank Account Record (LFBK).
                         * @param {Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} params An object containing all parameters:
                         *   - {string | ISAPBapiManager} sapConf The SAP configuration or BAPI manager to use.
                         *   - {string} table The SAP table to query.
                         *   - {string} filter The filter to apply to the query.
                         *   - {Sys.GenericAPI.QueryAttribute<T_in>[]} attributes The attributes to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryCallback<T_out>} callback The callback to call with the results.
                         *   - {number} [maxRecords] The maximum number of records to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryOptions<T_in, T_out>} [options] Additional options for the query.
                         * @returns {void | Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} The modified parameters to use for the SAP query.
                         * @example <caption>In this example, we modify the filter to only retrieve bank account records for a specific bank country.</caption>
                         * Query.VendorBankDetails_Accounts: function (params)
                         * {
                         * 		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + " AND LAND1 = 'FR'";
                         * 		return params;
                         * }
                         */
                        Query.VendorBankDetails_Accounts = function (params) {
                        };
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Query.VendorNumberFromIBAN_Accounts
                         * @since 332
                         * @description
                         * Allows you to modify all the parameters used in the SAPQuery for the Vendor Bank Details Vendor Number From IBAN (LFBK).
                         * @param {Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} params An object containing all parameters:
                         *   - {string | ISAPBapiManager} sapConf The SAP configuration or BAPI manager to use.
                         *   - {string} table The SAP table to query.
                         *   - {string} filter The filter to apply to the query.
                         *   - {Sys.GenericAPI.QueryAttribute<T_in>[]} attributes The attributes to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryCallback<T_out>} callback The callback to call with the results.
                         *   - {number} [maxRecords] The maximum number of records to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryOptions<T_in, T_out>} [options] Additional options for the query.
                         * @returns {void | Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} The modified parameters to use for the SAP query.
                         * @example <caption>In this example, we modify the filter to only retrieve vendor numbers from IBAN for a specific bank country.</caption>
                         * Query.VendorNumberFromIBAN_Accounts: function (params)
                         * {
                         * 		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + " AND LAND1 = 'FR'";
                         * 		return params;
                         * }
                         */
                        Query.VendorNumberFromIBAN_Accounts = function (params) {
                        };
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Query.PurchaseOrder_PlannedDeliveryCost
                         * @since 332
                         * @description Allows you to modify all the parameters used in the SAPQuery for the Purchase order planned delivery cost (EKBZ).
                         * @param {Sys.GenericAPI.SAPQueryParameters<T_in, T_out>} params An object containing all parameters:
                         *   - {string | ISAPBapiManager} sapConf The SAP configuration or BAPI manager to use.
                         *   - {string} table The SAP table to query.
                         *   - {string} filter The filter to apply to the query.
                         *   - {Sys.GenericAPI.QueryAttribute<T_in>[]} attributes The attributes to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryCallback<T_out>} callback The callback to call with the results.
                         *   - {number} [maxRecords] The maximum number of records to retrieve.
                         *   - {Sys.GenericAPI.SAPQueryOptions<T_in, T_out>} [options] Additional options for the query.
                         * @example <caption>In this example, we modify the filter to only retrieve vendor numbers from IBAN for a specific bank country.</caption>
                         * Query.PurchaseOrder_PlannedDeliveryCost: function (params)
                         * {
                         * 		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + " AND VGABE = '1'";
                         * 		return params;
                         * }
                        */
                        Query.PurchaseOrder_PlannedDeliveryCost = function (params) {
                        };
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Query.ClearingDocument_CheckNumber
                         * @since 332
                         * @description
                         * Allows you to modify all the parameters used in the SAPQuery for querying the payment table when fetching check number for a clearing document
                         * @param {Lib.AP.SAP.ReadSAPTableParametersServer<"BSAK">} params An object containing all parameters:
                         *   - {ISAP.Bapi<"RFC_READ_TABLE">} rfcReadTableBapi The BAPI to use for reading the table.
                         *   - {"BSAK"} table The SAP table to query.
                         *   - {string} fields The fields to retrieve.
                         *   - {string} filter The filter to apply to the query.
                         *   - {number} rowCount The maximum number of records to retrieve.
                         *   - {number} [rowSkip] The number of records to skip.
                         *   - {boolean} noData A boolean indicating if no data should be returned.
                         *   - {Lib.AP.SAP.ReadSAPTableJSONOptions} [jsonOptions] Additional options for the query.
                         * @param {ISAP.ReadSAPTableRecord<"BSAK">} sapItem SAP Cleared item (instance of BSAK table)
                         * @returns {void | Lib.AP.SAP.ReadSAPTableParametersServer<"BSAK">} The modified parameters to use for the SAP query.
                         * @example <caption>In this example, we modify the filter to only retrieve IBAN records for a specific bank country.</caption>
                         * Query.ClearingDocument_CheckNumber: function (params, sapItem)
                         * {
                         * 		// Allow to fetch check number for a clearing document even if it has been issued on the next fiscal year (GJAHR + 1)
                         * 		params.filter = `ZBUKR = '${sapItem.BUKRS}'\n AND (GJAHR = '${sapItem.GJAHR}' OR GJAHR = '${sapItem.GJAHR + 1}')\n AND VBLNR = '${sapItem.AUGBL}'`;
                         *		return params;
                         * }
                        */
                        Query.ClearingDocument_CheckNumber = function (params, sapItem) {
                        };
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Query.ClearingDocument_PaymentMethod
                         * @since 332
                         * @description
                         * Allows you to modify all the parameters used in the SAPQuery for querying the payment method for a clearing document
                         * @param {Lib.AP.SAP.ReadSAPTableParametersServer<"PAYR">} params An object containing all parameters:
                         *   - {ISAP.Bapi<"RFC_READ_TABLE">} rfcReadTableBapi The BAPI to use for reading the table.
                         *   - {"PAYR"} table The SAP table to query.
                         *   - {string} fields The fields to retrieve.
                         *   - {string} filter The filter to apply to the query.
                         *   - {number} rowCount The maximum number of records to retrieve.
                         *   - {number} [rowSkip] The number of records to skip.
                         *   - {boolean} noData A boolean indicating if no data should be returned.
                         *   - {Lib.AP.SAP.ReadSAPTableJSONOptions} [jsonOptions] Additional options for the query.
                         * @returns {void | Lib.AP.SAP.ReadSAPTableParametersServer<"BSAK">} The modified parameters to use for the SAP query.
                         * @example <caption>In this example, we modify the filter to only retrieve vendor numbers from IBAN for a specific bank country.</caption>
                         * Query.ClearingDocument_PaymentMethod: function (params)
                         * {
                         * 		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + " AND LAND1 = 'FR'";
                         * 		return params;
                         * }
                         */
                        Query.ClearingDocument_PaymentMethod = function (params, sapItem) {
                        };
                    })(Query = SAP.Query || (SAP.Query = {}));
                    /**
                     * Specifics SAP customizations for authentication-related features
                     * @namespace Lib.AP.Customization.Common.SAP.Authentication
                     */
                    let Authentication;
                    (function (Authentication) {
                        /**
                         * @method Lib.AP.Customization.Common.SAP.Authentication.CustomizeOAuth2WSParameters
                         * @since 348
                         * @description
                         * Allows you to customize the HTTP request parameters used when requesting an OAuth2 access token.
                         * This user exit is called before sending the token request to the OAuth2 authorization server.
                         * You can modify headers, data, or other request parameters as needed for your OAuth2 provider.
                         *
                         * @param {Sys.GenericAPI.HTTPRequestParam} httpParams The default HTTP request parameters configured for the OAuth2 token request.
                         * @returns {Sys.GenericAPI.HTTPRequestParam} The modified HTTP request parameters, or null/undefined to use the default parameters.
                         *
                         * @example
                         * <caption>Add additional parameters to the OAuth2 token request</caption>
                         * CustomizeOAuth2WSParameters: function (httpParams)
                         * {
                         * 		// Add a scope parameter to the token request
                         * 		httpParams.data += "&scope=custom_scope";
                         * 		return httpParams;
                         * }
                         */
                        Authentication.CustomizeOAuth2WSParameters = function (httpParams) {
                        };
                    })(Authentication = SAP.Authentication || (SAP.Authentication = {}));
                })(SAP = Common.SAP || (Common.SAP = {}));
                /**
                 * Specifics SAP customizations
                 * @namespace Lib.AP.Customization.Common.SAPS4Cloud
                 */
                let SAPS4Cloud;
                (function (SAPS4Cloud) {
                    /**
                     * @method Lib.AP.Customization.Common.SAPS4Cloud.CustomizeWSParams
                     * @since 361
                     * @description
                     * Allows you to customize SAP S/4HANA Cloud web service parameters.
                     * This user exit is called before making the web service call.
                     * @param {Sys.GenericAPI.HTTPRequestParam} wsParams The default parameters used for the web service call.
                     * @returns {Sys.GenericAPI.HTTPRequestParam | void} The modified parameters, or void to use the default parameters.
                     * @example <caption>Add the Accept-Language header to SAP S/4HANA Cloud calls</caption>
                     * SAPS4Cloud.CustomizeWSParams = function (wsParams)
                     * {
                     * 	wsParams.headers["Accept-Language"] = "FR";
                     * 	return wsParams;
                     * };
                     */
                    SAPS4Cloud.CustomizeWSParams = function (wsParams) {
                    };
                    /**
                     * Specifics SAP customizations for authentication-related features
                     * @namespace Lib.AP.Customization.Common.SAPS4Cloud.Authentication
                     */
                    let Authentication;
                    (function (Authentication) {
                        /**
                         * @method Lib.AP.Customization.Common.SAPS4Cloud.Authentication.CustomizeOAuth2WSParameters
                         * @since 349
                         * @description
                         * Allows you to customize the HTTP request parameters used when requesting an OAuth2 access token.
                         * This user exit is called before sending the token request to the OAuth2 authorization server.
                         * You can modify headers, data, or other request parameters as needed for your OAuth2 provider.
                         *
                         * @param {Sys.GenericAPI.HTTPRequestParam} httpParams The default HTTP request parameters configured for the OAuth2 token request.
                         * @returns {Sys.GenericAPI.HTTPRequestParam} The modified HTTP request parameters, or null/undefined to use the default parameters.
                         *
                         * @example
                         * <caption>Add additional parameters to the OAuth2 token request</caption>
                         * CustomizeOAuth2WSParameters: function (httpParams)
                         * {
                         * 		// Add a scope parameter to the token request
                         * 		httpParams.data += "&scope=custom_scope";
                         * 		return httpParams;
                         * }
                         */
                        Authentication.CustomizeOAuth2WSParameters = function (httpParams) {
                        };
                    })(Authentication = SAPS4Cloud.Authentication || (SAPS4Cloud.Authentication = {}));
                    /**
                     * @method Lib.AP.Customization.Common.SAPS4Cloud.CustomizeBrowsePagesConfig
                     * @since 361
                     * @description
                     * Allows you to customize the SAP S/4HANA Cloud PO browse query configuration for the "POHeader" and "POItem" endpoints.
                     * Use it to add custom field mappings, attributes, expanded navigation properties, or formatters needed by PO browse and PO line retrieval.
                     * Modify the `config` object directly; there is nothing to return.
                     *
                     * If a custom field must be displayed in the PO browse dialog or copied onto invoice line items, also declare it in
                     * {@link Lib.P2P.Customization.Common.GetCustomDimensions}.
                     *
                     * @param {string} endpointName The name of the endpoint being queried: "POHeader" or "POItem".
                     * @param {Lib.ERP.SAPS4CLOUD.QueryConfigByEndPoint} config The query configuration to customize.
                     * @returns {void}
                     *
                     * @example
                     * <caption>Add SAP S/4 Cloud PO fields to the POHeader and POItem query configurations</caption>
                     * CustomizeBrowsePagesConfig: function (endpointName, config)
                     * {
                     * 		if (endpointName === "POItem")
                     * 		{
                     * 			config.fieldsMapping.ChartOfAccounts =
                     * 			{
                     * 				tableFrom: "_PurOrdAccountAssignment",
                     * 				name: "ChartOfAccounts"
                     * 			};
                     * 			config.fieldsMapping.PurgDocPriceDate =
                     * 			{
                     * 				name: "PurgDocPriceDate",
                     * 				type: "date"
                     * 			};
                     * 		}
                     * 		else if (endpointName === "POHeader")
                     * 		{
                     * 			config.fieldsMapping.PricingProcedure =
                     * 			{
                     * 				name: "PricingProcedure"
                     * 			};
                     * 			config.fieldsMapping.Supplier =
                     * 			{
                     * 				name: "Supplier"
                     * 			};
                     * 		}
                     * }
                     */
                    SAPS4Cloud.CustomizeBrowsePagesConfig = function (endpointName, config) {
                    };
                })(SAPS4Cloud = Common.SAPS4Cloud || (Common.SAPS4Cloud = {}));
                /**
                 * Generic ERPs specific customizations
                 * @namespace Lib.AP.Customization.Common.Generic
                 */
                let Generic;
                (function (Generic) {
                    /**
                     * @method Lib.AP.Customization.Common.Generic.OverrideStoredInLocalTableFields
                     * @description
                     * Allow overriding the DatabaseCombobox fields which are stored or not in local table.
                     * AllowTableValuesOnly property depends on the returned values.
                     * @param {Lib.ERP.Invoice.StoredInLocalTableFieldResolver} storedInLocalTableFields Default values for Generic ERPs
                     * @returns {void | Lib.ERP.Invoice.StoredInLocalTableFieldResolver} Updated values
                     * @example
                     * <pre><code>
                     * OverrideStoredInLocalTableFields: function (storedInLocalTableFields)
                     * {
                     * 	storedInLocalTableFields.LineItems__.CostCenter__ = false;
                     * 	return storedInLocalTableFields;
                     * }
                     * </code></pre>
                     */
                    Generic.OverrideStoredInLocalTableFields = function (storedInLocalTableFields) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.BankDetailsCustomAttributes
                     * @since 327
                     * @description Allows you to define custom attributes for bank details.
                     * @returns {string[]} a table containing all custom attributes for the bank details table.
                     *
                     * @example
                     * <caption>Enable bank details templates</caption>
                     * BankDetailsCustomAttributes: function(templateName)
                     *	{
                     *	 	return [
                     *			"Z_CustomAttribute1__",
                     *			"Z_CustomAttribute2__",
                     *			"Z_CustomAttribute3__"];
                     *	}
                     */
                    Generic.BankDetailsCustomAttributes = function () {
                        return [];
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.CustomizeExtendedWithHoldingTaxFilter
                     * @since 340
                     * @description
                     * Allows you to customize the filter of query table 'AP - Extended Withholding Tax__'
                     * @param {string} defaultFilter the default filter of the query
                     * @returns {string} The customized filter.
                     * @example <caption>Add filter on WHTType__</caption>
                     * <pre><code>
                     * Generic.CustomizeExtendedWithHoldingTaxFilter: function (defaultFilter)
                     * {
                     *	var customizedFilter = Sys.Helpers.LdapUtil.FilterAnd(
                     *		defaultFilter,
                     *		Sys.Helpers.LdapUtil.FilterEqual("WHTType__", "CUSTOM")
                     *	);
                     *	// Do not forget to return a string
                     *  return customizedFilter.toString();
                     * };
                     * </code></pre>
                     */
                    Generic.CustomizeExtendedWithHoldingTaxFilter = function (defaultFilter) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.CustomizeVendorIBANFilter
                     * @description
                     * Allows customizing the filter used when querying vendor bank details by IBAN.
                     * This user exit is called before querying the "AP - Bank details__" table
                     * Warning : The user exit is called in both InnerGetVendorBankDetails and GetFirstVendorNumberFromIBANS functions.
                     * Differentiate the calls by checking the default filter if needed.
                     * @param {string} filter - The default filter constructed by standard logic
                     * @param {Object} parameters - Query parameters containing companyCode and ibans array
                     * @returns {string | void} - Modified filter to use, or void to use the original filter
                     * @example <caption>Add custom country filter to match invoice country with bank details country</caption>
                     * CustomizeVendorIBANFilter: function(filter, parameters)
                     * {
                     *		return Sys.Helpers.LdapUtil.FilterAnd(
                     *			filter,
                     * 			Sys.Helpers.LdapUtil.FilterEqualOrEmpty("Z_Country__", Data.GetValue("Z_Country__"))
                     *		).toString();
                     * }
                     */
                    Generic.CustomizeVendorIBANFilter = function (filter, parameters) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.OnVendorIBANQueryResults
                     * @since 361
                     * @description
                     * Allows customizing how the vendor is resolved from the results returned when querying vendor bank details by IBAN.
                     * This user exit is called after querying vendor bank details in GetFirstVendorNumberFromIBANS, for the Generic ERP.
                     * Use it, for instance, to detect when the same IBAN is shared by several vendors and warn the user.
                     * @param {ESKMap[]} results - The bank details results matching the queried IBANs. Each result contains at least VendorNumber__ and IBAN__.
                     * @param {Object} parameters - Query parameters containing companyCode and ibans array
                     * @param {string} parameters.companyCode
                     * @param {string[]} parameters.ibans
                     * @param {function} resultCallback - Callback to call with the resolved vendorNumber and iban. Must be called if this user exit returns true.
                     * @returns {boolean | void} true if this user exit handled the result and called resultCallback itself, false or void to let the standard behavior (pick the first result) proceed.
                     * @example <caption>Warn when the same IBAN is shared by several vendors</caption>
                     * OnVendorIBANQueryResults: function (results, parameters, resultCallback)
                     * {
                     *		if (!results || results.length === 0)
                     *		{
                     *			Log.Warn("Vendor not found by IBAN for " + parameters.ibans);
                     *			resultCallback();
                     *			return true;
                     *		}
                     *		var vendorNumbers = new Set(results.map(function (r) { return r.VendorNumber__; }));
                     *		if (vendorNumbers.size > 1)
                     *		{
                     *			Log.Warn("Multiple vendors share the same IBAN: " + parameters.ibans);
                     *			Data.SetWarning("VendorNumber__", "to verify");
                     *		}
                     *		resultCallback(results[0].VendorNumber__, results[0].IBAN__);
                     *		return true;
                     * }
                     */
                    Generic.OnVendorIBANQueryResults = function (results, parameters, resultCallback) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.OnComputePaymentAmountsEnd
                     * @description
                     * Use this function to customize or modify computed payment amounts (discount and fees) after they have been calculated.
                     * This user exit is called at the end of the discount and fee amount computation.
                     * @param {Object} amountsData - Object containing computed payment amounts
                     * @param {number} amountsData.discountAmount - The computed discount amount
                     * @param {number} amountsData.localDiscountAmount - The computed local currency discount amount
                     * @param {number} amountsData.feeAmount - The computed late payment fee amount
                     * @param {number} amountsData.localFeeAmount - The computed local currency late payment fee amount
                     * @returns {void}
                     * @example
                     * <pre><code>
                     * Generic.OnComputePaymentAmountsEnd: function (amountsData)
                     * {
                     *		Log.Info("Discount Amount: " + amountsData.discountAmount);
                    *		Log.Info("Fee Amount: " + amountsData.feeAmount);
                    *		// Custom logic to modify invoice fields based on computed amounts
                    * }
                    * </code></pre>
                    */
                    Generic.OnComputePaymentAmountsEnd = function (amountsData) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.OnComputePaymentTermsDatesEnd
                     * @description
                     * Use this function to customize or modify computed payment dates (due date and discount limit date) after they have been calculated.
                     * This user exit is called at the end of the payment terms date computation.
                     * @param {Object} paymentTermsDatesData - Object containing computed payment dates
                     * @param {boolean} paymentTermsDatesData.keepCurrentDates - Flag indicating if current dates should be kept
                     * @param {Date} paymentTermsDatesData.dueDate - The computed due date
                     * @param {Date} paymentTermsDatesData.discountDate - The computed discount limit date
                     * @returns {void}
                     * @example
                     * <pre><code>
                     * Generic.OnComputePaymentTermsDatesEnd: function (paymentTermsDatesData)
                     * {
                     *		Log.Info("Due Date: " + paymentTermsDatesData.dueDate);
                    *		Log.Info("Discount Date: " + paymentTermsDatesData.discountDate);
                    *		// Custom logic to modify invoice fields based on computed dates
                    * }
                    * </code></pre>
                    */
                    Generic.OnComputePaymentTermsDatesEnd = function (paymentTermsDatesData) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.CustomizeVendorIBANSortOrder
                     * @since 347
                     * @description
                     * Allows customizing the sort order used when querying vendor bank details.
                     * This user exit is called before querying the "AP - Bank details__" table
                     * and allows customers to prioritize bank accounts based on customer need.
                     * @param {string} defaultSortOrder - The default sort order: "CompanyCode__ DESC,BankCountry__ ASC,BankName__ ASC"
                     * @param {Object} parameters - Query parameters containing companyCode, vendorNumber, and optional iban
                     * @param {string} parameters.companyCode - The company code
                     * @param {string} parameters.vendorNumber - The vendor number
                     * @param {string} [parameters.iban] - Optional IBAN to filter
                     * @returns {string | void} - Modified sort order to use, or void to use the default
                     * @example <caption>Add Z_BankPriority__ sorting for Oracle ERP integration</caption>
                     * Generic.CustomizeVendorIBANSortOrder = function(defaultSortOrder, parameters)
                     * {
                     *     // Prepend custom bank priority field to sort order
                     *     return "Z_BankPriority__ ASC, " + defaultSortOrder;
                     * };
                     */
                    Generic.CustomizeVendorIBANSortOrder = function (defaultSortOrder, parameters) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.Generic.CustomizeGoodsReceiptFilter
                     * @since 355
                     * @description
                     * Allows customizing the LDAP filter used when querying purchase order items for goods receipt check.
                     * This user exit is called in CheckGoodsReceipt before querying the "AP - Purchase order - Items__" table.
                     * @param {string} filter - The default LDAP filter constructed by standard logic
                     * @param {string[]} orderNumbers - The purchase order numbers being checked
                     * @returns {string | void} - Modified filter to use, or void to use the original filter
                     * @example <caption>Rebuild the filter to allow GR records with no company code</caption>
                     * Generic.CustomizeGoodsReceiptFilter = function (filter, orderNumbers)
                     * {
                     *		// The default filter uses FilterEqual for CompanyCode__, which excludes GR records
                     *		// that have no company code (i.e. records applicable to all companies).
                     *		// Rebuild the filter using FilterEqualOrEmpty so those records are also matched.
                     *		var orderFilter = orderNumbers.length === 1
                     *			? Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumbers[0])
                     *			: Sys.Helpers.LdapUtil.FilterOr.apply(null, orderNumbers.map(function (n) { return Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", n); }));
                     *		return Sys.Helpers.LdapUtil.FilterAnd(
                     *			orderFilter,
                     *			Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", Data.GetValue("CompanyCode__"))
                     *		).toString();
                     * }
                     */
                    Generic.CustomizeGoodsReceiptFilter = function (filter, orderNumbers) {
                    };
                })(Generic = Common.Generic || (Common.Generic = {}));
                /**
                 * @namespace Lib.AP.Customization.Common.Workflow
                 * @description
                 * Specifics customization for the workflow
                 */
                Common.Workflow = {
                    /**
                     * The current action that cause the rebuild of the workflow
                     * @typedef {object} Lib.AP.Customization.Common.Workflow.workflowActions
                     * @property {string} name - The name of the action.
                     * Possible values are :
                     *	- balanceUpdated : Happens after the update of the cost center
                     *	- contributorAdded : Happens when a contributor is manually added
                     *	- contributorRemoved : Happens when a contributor is manually removed
                     *	- costCenterUpdated : Happens after the update of the cost center
                     *	- exceptionChanged : Happens after the update on the current workflow exception
                     *	- manualLink : Happens after a manual link
                     *	- mobileAppRebuild : Happens when a reviewer or an approver approve from the mobile application
                     *	- quantityChanged: Happens after the quantity has changed on one invoice line item
                     *	- subsequentDocBoxTicked: Happens after a user has ticked the "Subsequent document" checkbox
                     *	- subsequentDocBoxUnticked: Happens after a user has unticked the "Subsequent document" checkbox
                     *	- updateContributor : Happens when a contributor is replaced
                     *	- workflowReviewEnd : Happens when all the reviewers approved
                     */
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.OnBuildOfReviewers
                     * @description
                     * Allows you to enable or disable the update of reviewers in the workflow when the workflow is recomputed.
                     * This user exit is called in the Vendor invoice process, when an action that causes the workflow to recompute is performed.
                     * ATTENTION: For versions 5.165 or lower of the application, this user exit is part of the LIB_AP_CUSTOMIZATION_HTMLSCRIPTS library.
                     * @param {Lib.AP.Customization.Common.Workflow.workflowActions} action The action that cause the rebuild of the workflow
                     * @param {boolean} isAllowed A boolean indicating if the computation is allowed or not
                     * @returns {boolean} A boolean indicating if the computation is allowed or not. If null, the default value is used
                     * @example
                     * <pre><code>
                     * OnBuildOfReviewers: function(action, isAllowed)
                     * {
                     * 	if (action.name === 'costCenterUpdated' || action.name === 'mobileAppRebuild')
                     *	{
                     *		return true;
                     *	}
                     * }
                     * </code></pre>
                     */
                    OnBuildOfReviewers: function (action, isAllowed) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.OnBuildOfApprovers
                     * @description
                     * Allows you to enable or disable the update of approvers in the workflow when the workflow is recomputed.
                     * This user exit is called in the Vendor invoice process, when an action that causes the workflow to recompute is performed.
                     * @returns {boolean} A boolean indicating if the computation is allowed or not. If null, the default value is used
                     * @example
                     * <pre><code>
                     * OnBuildOfApprovers: function()
                     * {
                     *		return false;
                     * }
                     * </code></pre>
                     */
                    OnBuildOfApprovers: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.ForceAddContributorAtIndex
                     * @since 345
                     * @description
                     * Allows you to customize the forceIndex parameter behavior when adding workflow contributors.
                     * IMPORTANT: Do not override forceIndex to true when it is already true. When forceIndex is already true, it indicates a critical workflow scenario
                     * (such as workflow escalation due to inactivity of the current approver/reviewer) that must maintain exact positioning to avoid breaking workflow behavior.
                     * Only override forceIndex to true when it is false and you have specific business requirements to enforce exact positioning.
                     * @param {boolean} forceIndex The current value of forceIndex parameter - if true, do not modify it
                     * @param {number} tableIndex The table index where the contributor should be inserted
                     * @param {Sys.WorkflowController.IWorkflowUser} approver The workflow user being added (approver or reviewer)
                     * @param {string} role The role of the contributor being added (e.g., "_Role approver", "_Role controller")
                     * @returns {void | boolean}
                     * @example
                     * ForceAddContributorAtIndex: function(forceIndex, tableIndex, approver, role)
                     * {
                     *		// Don't override if already true - this protects critical scenarios like escalation
                     *		if (forceIndex === true)
                     *		{
                     *			return forceIndex;
                     *		}
                     *
                     *		if (role === "_Role approver" && approver.addedManuallyByUser)
                     *		{
                     *			return true;
                     *		}
                     *
                     *		return forceIndex;
                     * }
                     */
                    ForceAddContributorAtIndex: function (forceIndex, tableIndex, approver, role) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.ProcessApproverList
                     * @since 346
                     * @description
                     * Allows you to customize the approver list after all standard approvers have been determined.
                     * This user exit is called in the Vendor invoice process after IncludeAdditionalApprovers and
                     * IncludeExceptionApprovers have been executed, providing you with the complete list of approvers
                     * to transform as needed.
                     *
                     * Common use cases:
                     * - Remove duplicate approvers when the same person appears in multiple workflow roles
                     * - Sort approvers in a specific order
                     * - Filter out approvers based on custom criteria
                     * - Add custom metadata to approver objects
                     *
                     * WARNING: Removing approvers may affect workflow audit trails and compliance requirements.
                     * Ensure your customization aligns with your organization's approval policies.
                     *
                     * @param {Array<Sys.WorkflowController.IWorkflowUser>} approverList The complete list of approvers
                     * @returns {Array<Sys.WorkflowController.IWorkflowUser>|void} Modified approver list, or void/null to keep standard behavior
                     * @example <caption>Example 1: Remove duplicate approvers based on login</caption>
                     * ProcessApproverList: function(approverList)
                     * {
                     *     // Deduplicate based on login, keeping first occurrence
                     *     return approverList.reduce(function(accumulator, current)
                     *     {
                     *         if (!accumulator.find(function(item) { return item.login === current.login; }))
                     *         {
                     *             accumulator.push(current);
                     *         }
                     *         return accumulator;
                     *     }, []);
                     * }
                     * @example <caption>Example 2: Sort approvers by a custom field</caption>
                     * ProcessApproverList: function(approverList)
                     * {
                     *     return approverList.sort(function(a, b)
                     *     {
                     *         return (a.customPriority || 0) - (b.customPriority || 0);
                     *     });
                     * }
                     */
                    ProcessApproverList: function (approverList) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.GetOwnershipDate
                     * @since 358
                     * @description
                     * Allows you to override the ownership date (startingDate) computed for a workflow contributor.
                     * This user exit is called in the Vendor invoice process, in Lib_AP_WorkflowCtrl. Returning a `Date`
                     * value overrides the contributor's `startingDate` used; returning nothing (void) keeps
                     * the standard value computed.
                     * @param {Sys.WorkflowController.IWorkflowContributor} currentContributor The contributor whose startingDate is being set (contains action, login, role, parallel flag, etc.)
                     * @returns {Date|void} A Date to use as the contributor's startingDate, or void to keep the standard date
                     * @example <caption>Example: for the checkGoodsReceipt action, use the date of the most recent setAside entry</caption>
                     * Workflow.GetOwnershipDate: function(currentContributor)
                     * {
                     *		if (currentContributor.action === "checkGoodsReceipt")
                     *		{
                     *			const approversList = Data.GetTable("ApproversList__");
                     *			if (approversList)
                     *			{
                     *				for (let i = approversList.GetItemCount() - 1; i >= 0; i--)
                     *				{
                     *					const line = approversList.GetItem(i);
                     *					if (line.GetValue("ApproverAction__") === "setAside")
                     *					{
                     *						return line.GetValue("ApprovalDate__");
                     *					}
                     *				}
                     *			}
                     *		}
                     * }
                     */
                    GetOwnershipDate: function (currentContributor) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.AutoGuessException
                     * @description
                     * Use this function to allow or disable the automatic detection of invoice exceptions (e.g. Quantity mismatch, Price mismatch) on both server and client sides.
                     * This option is automatically enabled when first receiving the invoice and processing it on the server side (extraction script).
                     * However, this is not done on the client side to avoid risking infinite workflow loops, where one exception is cleared and invoice comes back to the AP specialists, only to modify more information which in turn triggers the exception workflow again.
                     * Return true on the client side or false on the server side to modify this behaviour.
                     * @param {Lib.AP.Customization.Common.Workflow.workflowActions} action The action that triggered the rebuild of the workflow
                     * @param {boolean} computeControllers A boolean indicating whether workflow rebuild was triggered with the intention to detect reviewers (workflow before posting in ERP)
                     * @param {boolean} computeApprovers A boolean indicating whether workflow rebuild was triggered with the intention to detect approvers (workflow after posting in ERP)
                     * @returns {boolean} whether or not to allow automatic detection of exceptions on the invoice
                     * @example
                     * <pre><code>
                     * AutoGuessException: function (action, computeControllers, computeApprovers)
                     * {
                     *		// true : Automatically detect invoice exceptions every time workflow is built (default on server side)
                     *		// false: Do not automatically detect invoice exceptions when building workflow; leave manual exception selection to the AP user (default on client side)
                     *		// /!\ this function is very powerful and is called in multiple situations where you would probably not expect any exception to be computed
                     *		//	for instance :
                     *		//		- manual change of the Exception field
                     *		//		- within or after the exception workflow itself workflow
                     *		//		- non PO invoices
                     *
                     *		if (!Lib.AP.InvoiceType.isPOInvoice()
                     *			|| (action && action.name == "workflowReviewEnd")
                     *			|| (action && action.name == "exceptionChanged")
                     *			|| Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.controller
                     *			|| Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.approver
                     *			|| Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apEnd)
                     *		{
                     *			return false;
                     *		}
                     *		else
                     *		{
                     *			return true; // ACTIVE for both server and client side
                     *		}
                     *
                     * }
                     * </code></pre>
                     *
                     */
                    AutoGuessException: function (action, computeControllers, computeApprovers) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.GetQuantityMismatchToleranceAbsolute
                     * @since 330
                     * @description
                     * Allows you to specify an absolute tolerance for line item quantity mismatch.
                     * When exception resolution is defined at the line item level (option in configuration) and mismatch is within the tolerance, line item exception is not triggered.
                     * @returns {number} The maximum quantity mismatch allowed to not trigger line item exception.
                     * @example
                     * Workflow.GetQuantityMismatchToleranceAbsolute: function()
                     * {
                     *		return 2;
                     * }
                     */
                    GetQuantityMismatchToleranceAbsolute: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.GetQuantityMismatchToleranceRelative
                     * @since 330
                     * @description
                     * Allows you to specify a relative tolerance (in percentage) for line item quantity mismatch.
                     * When exception resolution is defined at the line item level (option in configuration) and mismatch is within the tolerance, line item exception is not triggered.
                     * @returns {number} The maximum percentage of quantity mismatch allowed to not trigger line item exception.
                     * @example
                     * Workflow.GetQuantityMismatchToleranceRelative: function()
                     * {
                     *		return 1.5;
                     * }
                     */
                    GetQuantityMismatchToleranceRelative: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.GetUnitPriceMismatchToleranceAbsolute
                     * @since 330
                     * @description
                     * Allows you to specify an absolute tolerance for line item unit price mismatch.
                     * When exception resolution is defined at the line item level (option in configuration) and mismatch is within the tolerance, line item exception is not triggered.
                     * @returns {number} The maximum item unit price mismatch allowed to not trigger line item exception.
                     * @example
                     * Workflow.GetUnitPriceMismatchToleranceAbsolute: function()
                     * {
                     *		return 5;
                     * }
                     */
                    GetUnitPriceMismatchToleranceAbsolute: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.GetUnitPriceMismatchToleranceRelative
                     * @since 330
                     * @description
                     * Allows you to specify a relative tolerance (in percentage) for line item item unit price mismatch.
                     * When exception resolution is defined at the line item level (option in configuration) and mismatch is within the tolerance, line item exception is not triggered.
                     * @returns {number} The maximum percentage of item unit price mismatch allowed to not trigger line item exception.
                     * @example
                     * Workflow.GetUnitPriceMismatchToleranceRelative: function()
                     * {
                     *		return 1.5;
                     * }
                     */
                    GetUnitPriceMismatchToleranceRelative: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.SetCustomInvoiceStatusAfterReview
                     * @since 338
                     * @description
                     * Allows you to customize the invoice status set at the last step of the workflow, after the review is completed.
                     * @param {string} wkfException A string that contains the value of CurrentException__ field.
                     * @returns {Lib.AP.InvoiceStatus} The customized invoice status to set after review is completed.
                     * @example
                     * Workflow.SetCustomInvoiceStatusAfterReview: function(wkfException)
                     * {
                     * 		if (wkfException)
                     * 		{
                     * 			return Lib.AP.InvoiceStatus.ToPost;
                     * 		}
                     * }
                     */
                    SetCustomInvoiceStatusAfterReview: function (wkfException) {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.ShouldIgnoreBalanceForApprovalWorkflow
                     * @since 348
                     * @description
                     * By default, the approval workflow is only computed when the balance is at 0 or within the
                     * configured threshold. Implementing this user exit allows bypassing this check.
                     * @returns {boolean|void} Return true to ignore balance check, false or void to use standard behavior
                     * @example <caption>Ignore the balance for approval workflow computing</caption>
                     * Workflow.ShouldIgnoreBalanceForApprovalWorkflow: function()
                     * {
                     *     return true;
                     * }
                     */
                    ShouldIgnoreBalanceForApprovalWorkflow: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Common.Workflow.OnWorkflowActionEnd
                     * @since 353
                     * @description
                     * Called immediately after a workflow action is performed via DoAction.
                     * Use it to run custom logic (e.g., rebuild the workflow, add a contributor, set a custom
                     * status) right after the action completes.
                     * @param {string} actionName The name of the action that was performed (e.g., "approve", "reject", "post")
                     * @returns {void}
                     * @example <caption>Rebuild the workflow after a setAside action</caption>
                     * Workflow.OnWorkflowActionEnd: function(actionName)
                     * {
                     *     if (actionName === "setAside")
                     *     {
                     *         Lib.AP.WorkflowCtrl.RebuildWorkflow(true, false, false);
                     *     }
                     * }
                     */
                    OnWorkflowActionEnd: function (actionName) {
                    }
                };
                /**
                 * @namespace Lib.AP.Customization.Common.EDI
                 * @description
                 * Specifics customization for EDI
                 */
                Common.EDI = {
                    /**
                     * @method Lib.AP.Customization.Common.EDI.FillAdditionalLineFieldsFromMapper
                     * @description
                     * Allow to add additional field filled with mapped values
                     * @returns {void} lines are added to the object
                     * @example
                     * <pre><code>
                     * FillAdditionalLineFieldsFromMapper: function(newLineItem, extractedLineItem)
                     * {
                     * 		newLineItem.TaxJurisdiction = extractedLineItem.TaxJurisdiction;
                     * 		newLineItem.TaxCode = extractedLineItem.TaxCode;
                     * 		newLineItem.CostCenter = extractedLineItem.CostCenter;
                     * 		newLineItem.GLAccount = extractedLineItem.GLAccount;
                     * 		newLineItem.TradingPartner = extractedLineItem.TradingPartner;
                     * 		newLineItem.InternalOrder = extractedLineItem.InternalOrder;
                     * 		newLineItem.CompanyCode = extractedLineItem.CompanyCode;
                     * }
                     * </code></pre>
                     */
                    FillAdditionalLineFieldsFromMapper: function (newLineItem, extractedLineItem) {
                    }
                };
                /**
                 * @method Lib.AP.Customization.Common.DeactivateLocalPOTableUpdates
                 * @description
                 * Choose whether you want to prevent the system from updating the local PO tables (PO Headers, PO items, Goods receipts).
                 * The standard configuration (return false value) updates the tables so that extra posting against a PO is prevented in case it ran out of available amount/quantity to invoice.
                 * However, it leads to some desynchronization between replicated master data and data available in the local tables.
                 * In the case where:
                 *  - the master data shall always override local tables data
                 *  - Posting acknowledgements are not always sent to the solution on time
                 *  One can deactivate local table updates with this user exit.
                 * Beware that extra posting between two master data replication is no longer detected when local PO Table update is deactivated
                 * @returns {boolean} false (default) to indicate that PO tables shall be updated by the system.
                 * @example
                 * <pre><code>
                 * DeactivateLocalPOTableUpdates: function ()
                 * {
                 *	return true;
                 * }
                 * </code></pre>
                 */
                Common.DeactivateLocalPOTableUpdates = function () {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Common.getDefaultParametersValues
                 * @description
                 * Use this function to change the default value for duplicate check, touchless and Non-PO invoice EDI line extraction mode functionality.
                 * @returns {{defaultDuplicateLevel:string, defaultTouchlessValue: string, defaultNonPOInvoiceEDILineExtractionMode: string}|null} The set of values
                 * @example
                 * <pre><code>
                 * getDefaultParametersValues: function ()
                 * {
                 *   // We change the value of duplicate check to 2 as default
                 *	return {defaultDuplicateLevel: "2", defaultTouchlessValue: "0", defaultNonPOInvoiceEDILineExtractionMode: "0"};
                 * }
                 * </code></pre>
                 */
                Common.getDefaultParametersValues = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Common.GetCustomAssignmentTemplate
                 * @since 365
                 * @description
                 * Allows you to override the coding template assigned when invoice parameters are loaded.
                 * Return a non-empty template name to replace the standard `Template__` value from `AP - Parameters__`.
                 * Return nothing or an empty string to keep the default behavior.
                 * @param {string} companyCode The company code of the invoice.
                 * @param {string} vendorNumber The vendor number of the invoice.
                 * @returns {string | void} The custom template name, or void to keep the standard assignment template.
                 * @example <caption>Force a specific coding template for one vendor in one company code</caption>
                 * Common.GetCustomAssignmentTemplate = function (companyCode, vendorNumber)
                 * {
                 * 	if (companyCode === "US01" && vendorNumber === "ACME123")
                 * 	{
                 * 		return "SpecialNonPOCodingTemplate";
                 * 	}
                 * };
                 */
                Common.GetCustomAssignmentTemplate = function (companyCode, vendorNumber) {
                };
                /**
                 * @method Lib.AP.Customization.Common.IsDynamicDiscountingAllowed
                 * @description
                 * Use this function to allow dynamic discounting in invoice.
                 * @returns {boolean} True if dynamic discounting is allowed and False to probihit it
                 * @example
                 * <pre><code>
                 * IsDynamicDiscountingAllowed: function ()
                 * {
                 *   return true;
                 * }
                 * </code></pre>
                 */
                Common.IsDynamicDiscountingAllowed = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Common.OnComputeBackdatingTargetDate
                 * @description
                 * Use this function to allow customizing VI posting date computation.
                 * @param {Array.<Object.<string,string>>} queryResults The list of results queried in the "AP - BackdatingPeriods__" table from posting date reference, company code and invoice type
                 * @returns {Date} return the custom computed posting date
                 * @example
                 * <pre><code>
                 * OnComputeBackdatingTargetDate: function (queryResults)
                 * {
                 *	// if the invoice is a credit note, then use the result with empty company code
                 *	if (Data.GetValue("InvoiceAmount__") < 0)
                 *	{
                 *		queryResults.forEach((result: ESKMap<string>) =>
                 *		{
                 *			if ((!Sys.Helpers.IsEmpty(result.CompanyCode__))
                 *			{
                 *				return new Date(result.BackdatingTargetDate__);
                 *			}
                 *		});
                 *	}
                 * 	return null;
                 * }
                 * </code></pre>
                 */
                Common.OnComputeBackdatingTargetDate = function (queryResults) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeBackdatingTargetDateFilter
                 * @since 343
                 * @description
                 * Use this function to customize the filter used when querying the "AP - BackdatingPeriods__" table to compute the posting date.
                 * This user exit is called in the ComputeBackdatingTargetDate function before the default filter is built.
                 * @param {string} companyCode The company code of the invoice
                 * @param {string} invoiceType The invoice type
                 * @param {string} actualPostingDate The actual posting date reference in DB DateTime format
                 * @returns {Sys.Helpers.LdapUtil.IFilter} A custom filter to use for querying backdating periods, or null to use the default filter
                 * @example <caption>Add a custom condition to filter only periods with a specific custom field</caption>
                 * Common.CustomizeBackdatingTargetDateFilter: function (companyCode, invoiceType, actualPostingDate)
                 * {
                 *	const customField = Data.GetValue("Z_CustomBackdatingType__");
                 *	if (!Sys.Helpers.IsEmpty(customField))
                 *	{
                 *		const customFilter = Sys.Helpers.LdapUtil.FilterAnd(
                 *			Sys.Helpers.LdapUtil.FilterLesserOrEqual("BackdatingStartDate__", actualPostingDate),
                 *			Sys.Helpers.LdapUtil.FilterGreaterOrEqual("BackdatingEndDate__", actualPostingDate),
                 *			Sys.Helpers.LdapUtil.FilterEqualOrEmpty("InvoiceType__", invoiceType),
                 *			Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode),
                 *			Sys.Helpers.LdapUtil.FilterEqual("Z_BackdatingType__", customField)
                 *		);
                 *		return customFilter;
                 *	}
                 * 	return null;
                 * }
                 */
                Common.CustomizeBackdatingTargetDateFilter = function (companyCode, invoiceType, actualPostingDate) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnComputeDueDate
                 * @description
                 * Use this function to compute the due date for an invoice.
                 * @memberof Lib.AP.Customization.Common
                 * @param {Date} dueDate The original due date of the invoice
                 * @param {Date} referenceDate The reference date for the computation
                 * @param {number} dayLimit The number of days allowed for payment
                 * @param {boolean} endOfMonth Flag indicating if the due date should be at the end of the month
                 * @param {number} paymentDay The specific day of the month for payment
                 * @param {boolean} isCreditNote Flag indicating if the invoice is a credit note
                 * @param {any} [paymentTermsRecord=null] payment terms fetched for this invoice, containing all custom fields added prior. Optional for backward compatibility purposes
                 * @returns {Date} The computed due date
                 * @example
                 * <pre><code>
                 * OnComputeDueDate: function (dueDate, referenceDate, dayLimit, endOfMonth, paymentDay)
                 * {
                 *		// Force due date computation for credit notes
                 * 		return dueDate;
                 * }
                 * </code></pre>
                 */
                Common.OnComputeDueDate = function (dueDate, referenceDate, dayLimit, endOfMonth, paymentDay, isCreditNote, paymentTermsRecord = null) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnInvoiceStatusChange
                 * @description
                 * Use this function to add custom actions following a change of InvoiceStatus
                 * This function is called BEFORE updating InvoiceStatus
                 * @param {string} newInvoiceStatus
                 * @returns {void}
                 * @example
                 * <pre><code>
                 * OnInvoiceStatusChange: function (newInvoiceStatus)
                 * {
                 *		var oldInvoiceStatus = Data.GetValue("InvoiceStatus__");
                 *		var InvoiceNumber = Data.GetValue("InvoiceNumber__");
                 *		var VendorName = Data.GetValue("VendorName__");
                 *		// Do something
                 * }
                 * </code></pre>
                 */
                Common.OnInvoiceStatusChange = function (newInvoiceStatus) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnInvoiceStatusChangeFromExternalContext
                 * @description
                 * Use this function to add custom actions following a change of InvoiceStatus
                 * This function is called when invoices has been updated from an external process.
                 * This function is called AFTER updating InvoiceStatus
                 * @param {string} newInvoiceStatus
                 * @param {Object} externalContextInfo Structure that contains informations about invoice that has been updated
                 * @param {string} externalContextInfo.invoiceRuidEx
                 * @param {Object.<string, string>} [externalContextInfo.fieldsToUpdateAsync]
                 * @returns {void}
                 * @example
                 * <pre><code>
                 * OnInvoiceStatusChangeFromExternalContext: function (newInvoiceStatus, externalContextInfo)
                 * {
                 *		var invoiceRuidex = externalContextInfo.invoiceRuidEx;
                 *		// In case of asynchronous update, the invoice may be not updated yet.
                 *		// That's wy we provide the list of updated fields.
                 *		var updatedFields = externalContextInfo.fieldsToUpdateAsync || {};
                 *		if (newInvoiceStatus == "Paid")
                 *		{
                 *			const options = {
                 *				table: "CDNAME#Vendor invoice",
                 *				filter: "(RUIDEX=" + invoiceRuidex + ")",
                 *				attributes: ["InvoiceNumber__", "VendorEmail__", "PaymentScheduled__"],
                 *				maxRecords: 1,
                 *				additionalOptions:
                 *				{
                 *					asAdmin: true,
                 *					queryOptions: "FastSearch=1"
                 *				}
                 *			};
                 *			// Fetch invoice
                 *			Sys.GenericAPI.PromisedQuery(options)
                 *				.Then(function (results)
                 *				{
                 *					var invoice = results[0];
                 *					if (invoice)
                 *					{
                 *						var InvoiceNumber = invoice.InvoiceNumber__;
                 *						var vendorEmail = invoice.VendorEmail__;
                 *						// PaymentScheduled__ may be updated asynchronously in payment proposal
                 *						var PaymentScheduled = updatedFields.PaymentScheduled__ || invoice.PaymentScheduled__;
                 *						// Do something
                 *					}
                 *				});
                 *		}
                 * }
                 * </code></pre>
                 */
                Common.OnInvoiceStatusChangeFromExternalContext = function (newInvoiceStatus, externalContextInfo) {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetDefaultIntercompanyInvoiceArchivingID
                 * @description
                 * Use this function to customize the default temporary ERP invoice number set when automatically archiving an intercompany invoice
                 * @returns {void | string} return the default temporary ERP invoice number
                 * @example
                 * <pre><code>
                 * GetDefaultIntercompanyInvoiceArchivingID: function()
                 * {
                 * 		return Data.GetValue("CompanyCode__") + "-" + Data.GetValue("VendorNumber__") + "-" + Data.GetValue("InvoiceNumber__");
                 * }
                 * </code></pre>
                 */
                Common.GetDefaultIntercompanyInvoiceArchivingID = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetClearableFields
                 * @description
                 * Return the list of the fields that should be cleared before performing intercompany invoice touchless archiving
                 * @param {Lib.ERP.Invoice.ClearableFieldResolver} clearableFields
                 * @returns {void | Lib.ERP.Invoice.ClearableFieldResolver} return list of the fields that should be cleared
                 * @example
                 *
                 * <pre><code>
                 * GetClearableFields: function (clearableFields)
                 * {
                 * 		// clear GLAccount if this analytical axis is enabled in configuration, on lines of GL type
                 *		var apParameters = Sys.Parameters.GetInstance("AP");
                 *		clearableFields.LineItems__.GLAccount__ = function(item) {
                 *			var lineType = item ? item.GetValue("LineType__") : Lib.P2P.LineType.GL;
                 *			return lineType === 'GL' && apParameters.GetParameter("CodingEnableGLAccount") === "1";
                 *		};
                 *		return clearableFields;
                 * }
                 * </code></pre>
                 */
                Common.GetClearableFields = function (clearableFields) {
                };
                /**
                 * @method Lib.AP.Customization.Common.IsInternationalVATNumber
                 * @description
                 * Allows to customize the way we check if a VAT number is international or not.
                 * @param {string} VATNumber The VAT number we want to check.
                 * @return {boolean} If the VAT number should be considered international or not.
                 * @example
                 *
                 * <pre><code>
                 * IsInternationalVATNumber: function (VATNumber)
                 * 	{
                 * 		if (VATNumber.substr(0, 2) === "FR")
                 * 		{
                 * 			return false;
                 * 		}
                 * 		return true;
                 * 	}
                 * </code></pre>
                 */
                Common.IsInternationalVATNumber = function (VATNumber) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnLoadTemplateLine
                 * @description
                 * Allows to customize current item on LoadTemplate before the callbackForEachLine call.
                 * Next lines processing can be delayed by returning a resolved promise.
                 * @param {Item} item The current line item processed by LoadTemplate.
                 * @param {ESKMap<string>} record The record of this item from the loaded template.
                 * @param {number} index Index of the line item
                 * @param { { amountLeft: number } } [localContext] The local context
                 * @return {Promise<any> | void}
                 * @example
                 *
                 * <pre><code>
                 * OnLoadTemplateLine: function (item, record, index, localContext)
                 * 	{
                 * 		if (Data.GetValue("VendorNumber__") === "ACME1234")
                 * 		{
                 * 			// Assuming DoInitQueries returns a Promise.
                 * 			return DoInitQueries().Then(function(result)
                 * 			{
                 * 				item.SetValue("Amount__", 0 * result["factor"]);
                 * 			});
                 * 		}
                 * 		return Sys.Helpers.Promise.Resolve();
                 * 	}
                 * </code></pre>
                 */
                Common.OnLoadTemplateLine = function (item, record, index, localContext) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnLoadTemplateEnd
                 * @description
                 * Allows to make actions at the end of the LoadTemplate run. When executed from client side, this method is called
                 * before desactivation of the wait screen.
                 * Further processing can be delayed by returning a resolved promise.
                 * @return {Promise<any> | void}
                 * @example
                 *
                 * <pre><code>
                 * OnLoadTemplateEnd: function ()
                 * {
                 *		if (Data.GetValue("VendorNumber__") === "ACME1234")
                 *		{
                 *			// Assuming DoInitQueries returns a Promise.
                 *			return DoInitQueries().Then(function (result)
                 *			{
                 *				const lineItems = Data.GetTable("LineItems__");
                 *				const nbItems = lineItems.GetItemCount();
                 *				let cumul = 0;
                 *				for (let i = 0; i < nbItems; i++)
                 *				{
                 *					const item = lineItems.GetItem(i);
                 *					cumul += item.GetValue<number>("Z_CustomFieldAmount__");
                 *				}
                 *				Data.SetValue("Z_CustomFieldTotalAmount__", cumul * result["factor"]);
                 *			});
                 *		}
                 *		return Sys.Helpers.Promise.Resolve();
                 * }
                 * </code></pre>
                 */
                Common.OnLoadTemplateEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeLoadTemplateQueryOptions
                 * @since 338
                 * @description
                 * Customize the query options used when loading the template.
                 * @param {PromisedQueryParameters} defaultOptions The default query options.
                 * @returns The customized query options.
                 * @example
                 * <pre><code>
                 * CustomizeLoadTemplateQueryOptions: function (defaultOptions)
                 * {
                 * 		// Allows to segregate templates on custom dimension
                 * 		if (defaultOptions["table"] == "AP - Last used values__")
                 * 		{
                 * 			defaultOptions["filter"] += " AND Z_CustomField__ = 'CustomValue'";
                 * 		}
                 * 		return defaultOptions;
                 * 	}
                 * </code></pre>
                 */
                Common.CustomizeLoadTemplateQueryOptions = function (defaultOptions) {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetLoadTemplateMatchingMode
                 * @since 366
                 * @description
                 * Selects how coding values are matched to tax-grouped non-PO invoice lines when loading a template or MRU.
                 * "standard" (or no return value) keeps the default tax-rate-first matching with tax-code fallback.
                 * "MRU-first" applies the queried coding values to each line without matching its extracted tax.
                 * "tax-code-first" matches the extracted tax code first, falling back to the tax rate for coding values,
                 * while retaining the invoice's resolved tax code even if it has no MRU/template entry.
                 * If the tax code cannot be resolved, the extracted tax values remain unchanged rather than using an arbitrary MRU tax code.
                 * When tax codes are disabled, matching uses tax rates and the selected coding record supplies the tax rate.
                 * This exit is only called when tax-grouped template loading is enabled.
                 * @param {string} templateName The selected coding template, or an empty value when loading MRU.
                 * @returns {"MRU-first" | "tax-code-first" | "standard" | void} The matching mode.
                 * @example <caption>Prefer the extracted tax code on structured invoices</caption>
                 * <pre><code>
                 * Common.GetLoadTemplateMatchingMode = function (templateName)
                 * {
                 *		return templateName ? "standard" : "tax-code-first";
                 * };
                 * </code></pre>
                 */
                Common.GetLoadTemplateMatchingMode = function (templateName) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnReprocessInitiated
                 * @description
                 * Allows modification of re-extraction/re-processing variables when the invoice form reprocesses.
                 * When extraction is rerun, these variables can be referenced using 'Variable.GetValueAsString("<variableName>")'.
                 * @return {void}
                 * @example
                 *
                 * <pre><code>
                 * OnReprocessInitiated: function (reprocessVars: ESKMap<any>)
                 * {
                 *		// Add variable to be read when extraction runs again
                 *		reprocessVars.Z_DocumentNumber = Data.GetValue("Z_DocumentNumber__");
                 *		// In the OnExtractionScriptBegin user exit we can use this variable to set a form field
                 *		// if(Variable.GetValueAsString("Z_DocumentNumber")) {
                 *		// 	Data.SetValue("Z_DocumentNumber__", Variable.GetValueAsString("Z_DocumentNumber"));
                 *		// }
                 *
                 * 		// Update supplementaryRuleFolder (teaching) to different value depending on 'system'
                 * 		reprocessVars.SupplementaryRuleFolder = Sys.Parameters.GetInstance("AP").GetParameter("Z_SystemType", "");
                 * }
                 * </code></pre>
                 */
                Common.OnReprocessInitiated = function (reprocessVars) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnComputeHeaderAmount
                 * @description
                 * Allows you to customize the amounts that will be put in the NetAmount__ and the InvoiceMismatchAmount__ fields. These values come from summing up the line items.
                 * NOTE: If you adjust mismatchAmount, consider the warnings that get set on NetAmount__. For example, handleInvoiceMismatchAmount & DetectUnusualInvoiceAmount set a warning
                 * if mismatchAmount is greater than zero. If you want to adjust the behavior, you can use OnSetWarning or other functions in LIB_AP_CUSTOMIZATION_HTMLSCRIPT.
                 * @param {number} netAmount The sum of the line items Amounts__ fields.
                 * @param {number} mismatchAmount The sum of the positive MismatchAmount__ fields. Standard code will only add up the positive values of the MismatchAmount__ fields.
                 * @returns {{netAmount: number, mismatchAmount: number}} An object containing netAmount and mismatchAmount. It must contain both of these and be those exact names.
                 * If the names are not exact, the standard calculations will be used instead.
                 * @example
                 * We want the mismatch amount to be the sum of all the MismatchAmount__ fields, not just the positive ones.
                 *
                 * <pre><code>
                 * OnComputeHeaderAmount: function (netAmount, mismatchAmount)
                 * {
                 * 	mismatchAmount = 0;
                 * 	Sys.Helpers.Data.ForEachItem("LineItems__", function (item) {
                 * 		mismatchAmount += item.GetValue("MismatchAmount__");
                 * 	}
                 * 	//Since it could be negative now, I could use OnSetWarning in OnHTMLScriptBegin to change when warnings are set on the field.
                 *
                 * 	return {netAmount, mismatchAmount};
                 * }
                 * </code></pre>
                 */
                Common.OnComputeHeaderAmount = function (netAmount, mismatchAmount) {
                    return { netAmount, mismatchAmount };
                };
                /**
                 * @method Lib.AP.Customization.Common.OnComputeItemMismatchAmount
                 * @description
                 * Allows you to customize the mismatch amount that will be put in the MismatchAmount__ field of a line item. In standard, this value is only calculated if
                 * Amount__ is greater than ExpectedAmount__.
                 * NOTE: If you implement this user exit, you should consider the warnings being set based on Amount__. For example, checkPOInvoiceLineItemAmount & CheckWarningPO
                 * set warnings on Amount__ if mismatch amount is greater than zero. (These are not the only places warnings can be set.)
                 * If you want to adjust the behavior, you can use OnSetWarning or other functions in LIB_AP_CUSTOMIZATION_HTMLSCRIPT.
                 * @param {Item} item This is the table item that is being processed.
                 * @param {number} mismatchAmount This is the default calculated value.
                 * @returns {number} The new mismatch amount value.
                 * @example
                 * We want to allow negative mismatch amounts.
                 *
                 * <pre><code>
                 * OnComputeItemMismatchAmount: function (item, mismatchAmount)
                 * {
                 *  	const invoicedAmount = item.GetValue<number>("Amount__") || 0;
                 *  	const expectedAmount = item.GetValue<number>("ExpectedAmount__") || 0;
                 *  	mismatchAmount = invoicedAmount - expectedAmount;
                 * 		//If the customer wanted to be warned about negative amounts, I could use OnSetWarning in OnHTMLScriptBegin to change when warnings are set on the field.
                 * 		return mismatchAmount;
                 * }
                 * </code></pre>
                 */
                Common.OnComputeItemMismatchAmount = function (item, mismatchAmount) {
                    return mismatchAmount;
                };
                /**
                 * @method Lib.AP.Customization.Common.CalculateCustomBalance
                 * @description
                 * Allows you to customize the invoice balance calculation with additional amounts. This user exit is executed both server and client side. If no value is returned,
                 * the standard balance calculation will be used (invoice amount - net amount - tax amount). If a value is returned, it will be used as the balance amount for the invoice.
                 *
                 * @param {number} invoiceAmount The standard invoice amount
                 * @param {number} netAmount The standard net amount from the invoice line-items
                 * @param {number} taxAmount The standard tax amount
                 * @returns {void | number} The custom balance amount, if used
                 *
                 * @example
                 * <pre><code>
                 * CalculateCustomBalance: function(invoiceAmount, netAmount, taxAmount)
                 * {
                 * 		// Include custom deduction amount in balance calculation
                 * 		const deductionAmount = Data.GetValue("Z_DeductionAmount__");
                 * 		return invoiceAmount - netAmount - taxAmount - deductionAmount;
                 * }
                 * </code></pre>
                 */
                Common.CalculateCustomBalance = function (invoiceAmount, netAmount, taxAmount) {
                };
                /*************************
                 ***** Custom Helpers ****
                 *************************/
                /**
                 * To define custom functions corresponding to business behaviors:
                 * Create a object in which Functions defined in this scope will only be accessible within this library
                 * They can be called the following way CustomHelpers.MyCustomHelper()
                 * New objects can be defined to isolate several functions linked to a feature (i.e. : VendorHelpers)
                 *  @example
                 * <pre><code>
                 * var CustomHelpers =
                 * {
                 * 		SetWarningOnLineItem: function(lineItem, warningMessage)
                 * 		{
                 *			lineItem.SetWarning("Z_CustomField__", "My custom warning: " + warningMessage);
                 *		}
                 * };
                 * </code></pre>
                 */
                // Uncomment here
                // var CustomHelpers =
                // {
                // };
                /**
                 * @method Lib.AP.Customization.Common.ActivateEmailNotificationOnPaymentProposalApproved
                 * @description
                 * Allows to activate the email notification for the requester after a payment proposal is approved
                 * By default the email notification is deactivated
                 * @returns {boolean} if the email notification should be activated
                 * @example
                 * <pre><code>
                 * ActivateEmailNotificationOnPaymentProposalApproved: function ()
                 * {
                 *	return true;
                 * }
                 * </code></pre>
                 */
                Common.ActivateEmailNotificationOnPaymentProposalApproved = function () {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Common.ShouldSkipCalculateTax
                 * @description
                 * Determines whether the tax calculation process should be skipped.
                 * @param {Item} item This is the table item that is being processed.
                 * @returns {boolean} Returns `true` if tax calculation should be skipped
                 * @example
                 * <pre><code>
                 * ShouldSkipCalculateTax: function (item)
                 * {
                 * if (item.GetValue("Amount__"))
                 *	{
                 *		return true;
                 *	}
                 * }
                 * </code></pre>
                 */
                Common.ShouldSkipCalculateTax = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.Common.ShouldSkipTaxRoundingLineDispatch
                 * @since 361
                 * @description
                 * Allows you to keep a tax rounding difference in the header tax amount instead of dispatching it to the first line for the tax key.
                 * When returning true, set any custom warning on the line item directly.
                 * @param {Item} item The first line item for the tax key.
                 * @param {string} taxKey The tax key whose rounding difference is being handled.
                 * @param {number} roundingDifference The difference between the rounded tax total and the sum of rounded line taxes.
                 * @returns {boolean | void} Return true to keep the difference in the header tax amount, or void/false to use the standard line dispatch.
                 * @example <caption>Keep rounding differences in the header for a specific entity</caption>
                 * Common.ShouldSkipTaxRoundingLineDispatch = function (item, taxKey, roundingDifference)
                 * {
                 * 	if (Data.GetValue("EntityCode__") === "MY_ENTITY")
                 * 	{
                 * 		item.SetWarning("TaxAmount__", "Tax rounding difference kept in header");
                 * 		return true;
                 * 	}
                 * };
                 */
                Common.ShouldSkipTaxRoundingLineDispatch = function (item, taxKey, roundingDifference) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnComputeHeaderTaxAmount
                 * @since 330
                 * @description
                 * Allows you to customize the tax amount that will be put in the TaxAmount__ field. This value comes from summing up the line items.
                 * @param {number} taxAmount The sum of the line items TaxAmount__ fields.
                 * @returns {number | void} The new tax amount value. 0 is a valid value; return nothing to keep the computed amount.
                 * @example <caption>We want to add a custom value to the tax amount</caption>
                 * Common.OnComputeHeaderTaxAmount = function (taxAmount)
                 * {
                 * 	const customTaxAmount = Data.GetValue("Z_CustomTaxAmount__") || 0;
                 * 	taxAmount += customTaxAmount;
                 * 	return taxAmount;
                 * }
                 */
                Common.OnComputeHeaderTaxAmount = function (taxAmount) {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomPaymentTermsAttributes
                 * @description
                 * Allows to customize and override the attributes of payment terms being fetched
                 * @param defaultAttributes
                 * @returns {string[]}
                 * @example
                 * <pre><code>
                 * CustomPaymentTermsAttributes: function (defaultAttributes)
                 * {
                 *		defaultAttributes.push("Z_PaymentDay2__");
                 *		return defaultAttributes;
                 * }
                 * </code></pre>
                 */
                Common.CustomPaymentTermsAttributes = function (defaultAttributes) {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizePaymentTermsQueryFilter
                 * @since 339
                 * @description
                 * Allows to customize and override the filter of payment terms being fetched
                 * @param defaultFilter
                 * @returns {string}
                 * @example
                 * <pre><code>
                 * CustomizePaymentTermsQueryFilter: function (defaultFilter)
                 * {
                 * 	return `&(${defaultFilter}(Z_Region='${Data.GetValue("Z_Region__")}'))`;
                 * }
                 * </code></pre>
                 */
                Common.CustomizePaymentTermsQueryFilter = function (defaultFilter) {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomAPMappingXMLParameters
                 * @description
                 * Allows customization of the parameters for the AP Mapping to get content of file based on the GetContent param
                 * @returns {IContentParameters} for the customized GetContent xml parameters
                 * @example
                 * <pre><code>
                 * CustomAPMappingXMLParameters = function ()
                 * {
                 * 		return {
                 * 			raw: false,
                 * 			detectEncoding: true,
                 * 			readByBlock: true,
                 * 			blockIndex: 0,
                 * 			blockSize: 2048
                 * 		};
                 * };
                 * </code></pre>
                 */
                Common.CustomAPMappingXMLParameters = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Common.InvoiceToProcessFilterForWorkflowEndPrediction
                 * @description Allows custom filter to be set to define supplier invoices that need to be included
                 * @param {IFilter} standardFilter Standard filter from Lib_AP_WorkflowEndPrediction_Update
                 * @returns {IFilter} the customized filter
                 * @example
                 * <pre><code>
                 * InvoiceToProcessFilterForWorkflowEndPrediction: function (standardFilter)
                 * {
                 *  const customizedFilter = Sys.Helpers.LdapUtil.FilterAnd(
                 * 						standardFilter,
                 *						Sys.Helpers.LdapUtil.FilterNotEqual("ERPPostingDate__", "")
                 *					);
                 *  return customizedFilter;
                 * }
                 * </code></pre>
                 */
                Common.InvoiceToProcessFilterForWorkflowEndPrediction = function (standardFilter) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Common.DisableReloadConfigurationAndReExtractOnCompanyCodeChange
                 * @description
                 * Allow disabling reload of configuration and re-extraction when company code changes.
                 * For example, if configuration is associated to a custom field rather than company code.
                 * @returns {boolean} true if we want to disable configuration reload and re-extraction
                 * @example
                 * <pre><code>
                 * DisableReloadConfigurationAndReExtractOnCompanyCodeChange: function ()
                 * {
                 * 	return true;
                 * }
                 * </code></pre>
                 */
                Common.DisableReloadConfigurationAndReExtractOnCompanyCodeChange = function () {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Common.HandleCompanyCodeChange
                 * @since 337
                 * @description
                 * Allows to add customization when the company code changes
                 * For example, if two configurations are associated with one company code
                 * @param {String} newCompanyCode The new company code being set
                 * @returns {void}
                 * @example
                 * <caption>An example of adjusting default configuration on company code change</caption>
                 * HandleCompanyCodeChange: function (newCompanyCode)
                 * {
                 *     if (Sys.Helpers.IsEmpty(newCompanyCode))
                 *     {
                 *         return;
                 *     }
                 *
                 *     // Reset manually selected application name
                 *     Variable.SetValueAsString("Z_ApplicationName", "");
                 *
                 *     const options = {
                 *         table: "AP - Application Settings__",
                 *         filter: Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", newCompanyCode),
                 *         attributes: ["ConfigurationName__"],
                 *         maxRecords: 20
                 *     };
                 *
                 *     Sys.GenericAPI.PromisedQuery(options)
                 *         .Then(function (queryResults)
                 *         {
                 *             if (queryResults && queryResults.length > 0)
                 *             {
                 *                 // If more than one config, show browse dialog
                 *                 if (Sys.ScriptInfo.IsClient() && typeof Sys.Helpers.Browse !== "undefined" && queryResults.length > 1)
                 *                 {
                 *                     let searchDialogSettings = {
                 *                         browseTitle: "_Z_SelectConfiguration",
                 *                         tableName: "AP - Application Settings__",
                 *                         rowcount: 20,
                 *                         searchAtOpening: true,
                 *                         filter: Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", newCompanyCode).toString(),
                 *                         returnSelection: function (browseDialog, parentControl, lineItem)
                 *                         {
                 *                             let selectedConfig = lineItem["ConfigurationName__"].GetValue();
                 *                             Log.Info("Selected config: " + selectedConfig);
                 *                             Variable.SetValueAsString("Z_ApplicationName", selectedConfig);
                 *                             this.dialog.Commit();
                 *                         },
                 *                         rollbackDialogCallback: function ()
                 *                         {
                 *                             Variable.SetValueAsString("Z_ApplicationName", "");
                 *                             Data.SetValue("CompanyCode__", Data.GetValue("CompanyCode__")); // revert to previous if needed
                 *                         },
                 *                         searchCriterias: [
                 *                            {
                 *                                id: "ConfigurationName__",
                 *                                label: "Configuration",
                 *                                required: false,
                 *                                toUpper: false,
                 *                                visible: true,
                 *                                defaultValue: ""
                 *                            }
                 *                        ],
                 *                        columns: [
                 *                            {
                 *                                id: "ConfigurationName__",
                 *                                label: "Configuration name",
                 *                                type: "STR",
                 *                                orderBy: "ASC"
                 *                            }
                 *                        ]
                 *                    };
                 *                    Sys.Helpers.Browse.SimpleBrowseDialog(searchDialogSettings).OnBrowse();
                 *                }
                 *                else
                 *                {
                 *                    // Only one config or server-side: set first config automatically
                 *                    Variable.SetValueAsString("Z_ApplicationName", queryResults[0].ConfigurationName__);
                 *                }
                 *            }
                 *            else
                 *            {
                 *                Log.Info("No query Results found with filter: " + options.filter + " - Continue standard execution.");
                 *            }
                 *        })
                 *        .Catch(function ()
                 *        {
                 *            Log.Info("Query on table " + options.table + " failed.");
                 *        });
                 *}
                 */
                Common.HandleCompanyCodeChange = function (newCompanyCode) {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeCompanyCodeChangeBehavior
                 * @since 347
                 * @description
                 * Allows customizing the popup behavior when the company code changes
                 * This user exit is called before the standard popup is displayed
                 * If return true, the standard popup behavior will be skipped
                 * If return false the standard popup behavior will be applied
                 * @param {string} newCompanyCode The new company code being set
                 * @param {string} previousConf The previous configuration name
                 * @param {string} newConf The new default configuration name
                 * @param {function} applyConfigurationCallback Callback function to apply the configuration change. Call this when you want to apply the new configuration
                 * @param {function} revertCallback Callback function to revert to the previous company code. Call this when you want to cancel the company code change
                 * @returns {boolean|void} true if the user exit handled the popup and standard popup should be skipped, false or undefined otherwise
                 * @example <caption>Display a custom alert instead of confirm dialog</caption>
                 * CustomizeCompanyCodeChangeBehavior: function (newCompanyCode, previousConf, newConf, applyConfigurationCallback, revertCallback)
                 * {
                 * 		const popupMsg = Language.Translate(
                 * 			"_The default configuration will be changed according to the new company code {0} From {1} to {2}",
                 *			true,
                 *			Data.GetValue("Z_Segment1__"), // display different value
                 *			previousConf,
                 *			newConf
                 *			);
                 *		Popup.Alert(popupMsg, false, applyConfigurationCallback, "Warning");
                 *		return true;
                 * }
                 */
                Common.CustomizeCompanyCodeChangeBehavior = function (newCompanyCode, previousConf, newConf, applyConfigurationCallback, revertCallback) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OverrideErrorsOnGetAndFillDescriptionFromCode
                 * @description
                 * Allow overriding errors on specific fields of table items
                 * @param {Item} item Current line item being worked on
                 * @param {string} field Current field to have its errors customized
                 * @returns {void | boolean} true if we want to bypass setting standard error
                 * @example
                 * <pre><code>
                 * OverrideErrorsOnGetAndFillDescriptionFromCode: function (item, field)
                 * {
                 * 	const COLUMNS = ["CostCenter__"];
                 * 	if (COLUMNS.includes(field))
                 * 	{
                 * 		item.SetError(field, "");
                 * 		return true;
                 * 	}
                 * }
                 * </code></pre>
                 */
                Common.OverrideErrorsOnGetAndFillDescriptionFromCode = function (item, field) {
                };
                /**
                 * @method Lib.AP.Customization.Common.UseCustomAttributesToSelectDefaultBankDetails
                 * @since 327
                 * @description
                 * Allow to define a new default bank details selection method.
                 * @param {Item} Item The current line item being processed
                 * @param {ESKMap[]} account The bank details account to be selected
                 * @returns {void}
                 * @example
                 * <caption>Use a custom attribute to select a default bank details</caption>
                 * 	UseCustomAttributesToSelectDefaultBankDetails: function (item, account)
                 * 	{
                 * 		// Set additional custom fields
                 * 		for (let key of Object.keys(account))
                 * 		{
                 * 			if (key.startsWith("Z_"))
                 * 			{
                 * 				item.SetValue(key, account[key]);
                 * 			}
                 * 		}
                 *
                 * 		// If a bank account is already selected, make sure other bank details are unselected
                 * 		if (!Sys.Helpers.IsEmpty(Data.GetValue("SelectedBankAccountID__")))
                 * 		{
                 * 			item.SetValue("BankDetails_Select__", false);
                 * 			return;
                 * 		}
                 * 		if (item.GetValue("BankDetails_Select__") === true)
                 * 		{
                 * 			return;
                 * 		}
                 * 		if (Sys.Helpers.String.ToBoolean(item.GetValue("Z_QAD_Default__")))
                 * 		{
                 * 			item.SetValue("BankDetails_Select__", true);
                 * 			Data.SetValue("SelectedBankAccountID__", item.GetValue("BankDetails_ID__"));
                 * 		}
                 * 	}
                 */
                Common.UseCustomAttributesToSelectDefaultBankDetails = function (item, account) {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetNbBankAccountsToRetrieve
                 * @description
                 * Allows to define the number of bank accounts to retrieve when loading supplier's bank details.
                 * @returns {number} The number of bank accounts to retrieve.
                 * @example
                 * <pre><code>
                 * GetNbBankAccountsToRetrieve: function ()
                 * {
                 * 	return 50;
                 * }
                 * </code></pre>
                 */
                Common.GetNbBankAccountsToRetrieve = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.IsDocumentCreditNote
                 * @since 332
                 * @description
                 * Allow to choose what document type is a credit note.
                 * In standard, only "KG" type is considered as credit note.
                 * @param {string} documentType The type of the current document.
                 * @returns {void|boolean} to indicate if the document is a credit note or not. Return null to keep default behavior.
                 * @example
                 * <caption>This example define document type "KA" as credit note and keep the default behavior on other types</caption>
                 * IsDocumentCreditNote: function (documentType)
                 * {
                 * 	if (documentType === "KA")
                 * 	{
                 *		return true;
                 * 	}
                 * 	return null;
                 * }
                 */
                Common.IsDocumentCreditNote = function (documentType) {
                };
                /**
                * @method Lib.AP.Customization.Common.CustomizeInvoiceStatementMatchingFilter
                * @since 334
                * @description Customize invoice statement matching filter
                * @param {Sys.Helpers.LdapUtil.IFilter} filter The default filter of the invoice statement check feature
                * @return {Sys.Helpers.LdapUtil.IFilter} A customized filter for invoice statement check
                * @example
                * <caption>Add a filter to match custom vendor number</caption>
                * Common.CustomizeInvoiceStatementMatchingFilter: function (filter)
                * {
                *	const vendorName = Data.GetValue("Z_VendorNumber__");
                *	filter = Sys.Helpers.LdapUtil.FilterAnd(
                *		filter,
                *		Sys.Helpers.LdapUtil.FilterEqual("Z_VendorNumber__", vendorName),
                *	);
                *	return filter;
                * }
                */
                Common.CustomizeInvoiceStatementMatchingFilter = function (filter) {
                };
                /**
                * @method Lib.AP.Customization.Common.IsLineVendorNumberValid
                * @since 334
                * @description Customize PO line vendor number validation with header
                * @param {Item} item The current line item being verified
                * @return {boolean} The validity of the PO line vendor number, it will display an error or a warning if false depending on the UE SetErrorWhenPOVendorDiffersFromHeaderVendor. Do not return anything for standard behavior.
                * @example
                * <caption>This example checks if the line vendor number matches the header vendor number</caption>
                * Common.IsLineVendorNumberValid: function (item)
                * {
                *	let lineVendorNumber = item.GetValue("VendorNumber__") || "";
                *	//retrieve vendor number only, ignoring site which is separated by forward slash
                *	lineVendorNumber = lineVendorNumber.indexOf("/") !== -1 ? lineVendorNumber.substring(0, lineVendorNumber.indexOf("/")) : lineVendorNumber;
                *	const headerVendorNumber = Data.GetValue("Z_VendorNumber__");
                *	return lineVendorNumber === headerVendorNumber;
                * }
                */
                Common.IsLineVendorNumberValid = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetCustomLineItemCompanyCode
                 * @since 334
                 * @description
                 * User exit to provide a custom company code for a given line item. This is called by the core logic when mapping or processing line items, allowing you to override or supply a company code based on custom logic (e.g., based on item fields, vendor, or other business rules).
                 * If not implemented or returns null/undefined, the default company code logic applies.
                 * @param {Item} item The line item object for which to determine the company code.
                 * @returns {string|void} The company code to use for this line item, or void/null to use line item company code or fallback on header company code.
                 * @example
                 * <caption>Example of a custom company code logic based on a custom field</caption>
                 * Common.GetCustomLineItemCompanyCode: function(item) {
                 *   var customCode = item.GetValue("Z_CustomCompanyCode__");
                 *   if (customCode) {
                 *     return customCode;
                 *   }
                 *   return null;
                 * }
                 */
                Common.GetCustomLineItemCompanyCode = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.Common.AllowAutoPostAfterReview
                 * @since 334
                 * @description
                 * Boolean value to allow auto-posting after review.
                 * @returns {boolean | void} Returns true if auto-posting after review is allowed, false otherwise.
                 * If not defined, the default behavior is to allow auto-posting after review.
                 * @example
                 * <caption>Set allow auto-posting after review</caption>
                 * 	Common.AllowAutoPostAfterReview: function ()
                 * 	{
                 * 		return true;
                 * 	}
                 */
                Common.AllowAutoPostAfterReview = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.OverrideDownPaymentInvoiceSupport
                 * @since 338
                 * @description
                 * Boolean value to allow down payment posting.
                 * @returns {boolean | void} Returns boolean representing if down payment should be supported,
                 * default value depending on the ERP will be used if nothing is returned.
                 * @example <caption>Set allow down payment posting for SAP</caption>
                 * 	OverrideDownPaymentInvoiceSupport: function (): boolean | void {
                 * 		if (Lib.ERP.GetERPName() === "SAP")
                 * 		{
                 * 			return true;
                 * 		}
                 * 	}
                 */
                Common.OverrideDownPaymentInvoiceSupport = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.KeepUnprocessedLineItems
                 * @since 337
                 * @description
                 * Use this user exit when an invoice is set aside waiting for GR,
                 * and you want to keep the unprocessed line items after the GR is received.
                 * @param {string} orderNumber the order number for which we process line items.
                 * @param {Item[]} linesProcessed the content of line items processed for this order number.
                 * @returns {boolean | void} Returns true if unprocessed line items should be kept, false otherwise.
                 * If not defined, the default behavior is to remove unprocessed line items (same as returning false).
                 * @example
                 * <caption>Force keeping unprocessed line items for all order numbers</caption>
                 * 	Common.KeepUnprocessedLineItems: function (orderNumber, linesProcessed)
                 * 	{
                 * 		return true;
                 * 	}
                 */
                Common.KeepUnprocessedLineItems = function (orderNumber, linesProcessed) {
                };
                /**
                 * @method Lib.AP.Customization.Common.ValidateWHTItem
                 * @since 359
                 * @description
                 * Allows you to override the standard validation of a row in the Extended Withholding Tax table.
                 * This user exit is called before the standard validation checks WHT type, WHT code, WHT base amount, and WHT tax amount.
                 * Return void to keep the standard validation behavior.
                 * Return true when the custom validation handled the row as valid and the standard validation must be skipped.
                 * Return false when the custom validation handled the row as invalid and the standard validation must be skipped.
                 * When returning true or false, the custom implementation is responsible for setting or clearing categorized errors on the row.
                 * @param {Item} item Current Extended Withholding Tax table row.
                 * @returns {boolean | void} Return true or false to override the standard validation result, or void to keep standard behavior.
                 * @example <caption>Allow WHT rows where base amount and tax amount are both zero</caption>
                 * ValidateWHTItem = function (item)
                 * {
                 *     if (Number(item.GetValue("WHTBaseAmount__")) === 0 && Number(item.GetValue("WHTTaxAmount__")) === 0)
                 *     {
                 *         item.SetCategorizedError("WHTBaseAmount__", null, null);
                 *         item.SetCategorizedError("WHTTaxAmount__", null, null);
                 *         return true;
                 *     }
                 * };
                 */
                Common.ValidateWHTItem = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.Common.AllowZeroWHTBaseAmount
                 * @since 356
                 * @description
                 * Allows you to accept a zero value for the Withholding Tax base amount (WHTBaseAmount__) field
                 * in the Extended Withholding Tax table.
                 * By default, zero is rejected as an invalid value to avoid confusion between empty and zero.
                 * Implement this user exit and return true to allow zero as a valid WHT base amount.
                 * @returns {boolean | void} Return true to allow zero WHT base amount, false or void to keep default behavior (reject zero).
                 * @example <caption>Allow zero WHT base amount for all invoices</caption>
                 * AllowZeroWHTBaseAmount = function ()
                 * {
                 *     return true;
                 * };
                 */
                Common.AllowZeroWHTBaseAmount = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.ExtendValidReasonAndActionCodes
                 * @since 364
                 * @description
                 * Called both by the validation script of the Update invoice with ERP ID process (when checking the ReasonCode
                 * (motif) and ActionCode received in an ERP lifecycle acknowledgment) and by the FRB2B CDV generation (when a
                 * user manually rejects/disputes an invoice, or resolves a fallback reason for the outbound CDV), before
                 * checking these codes against Esker's built-in valid lists. Allows you to add extra codes (with their labels)
                 * that will be considered valid in addition to the built-in ones, in both places consistently.
                 * @param {(Sys.FRB2B.AP.ReasonScope|void)} reasonScope `"Rejection"` or `"Dispute"` (see `Sys.FRB2B.AP.ReasonScope`)
                 * depending on what is being validated/generated, or `undefined` when no scope-specific list applies (e.g. an
                 * Approved or TakenInCharge lifecycle status).
                 * @returns {({ reasonCodes: Object.<string, string>=, actionCodes: Object.<string, string>= }|void)}
                 *   An object with optional `reasonCodes` and `actionCodes` maps, each keyed by the additional code value and
                 *   mapping to its label. These entries are merged with (and take precedence over) the built-in valid lists.
                 *   Return nothing to keep the built-in lists unchanged.
                 * @example
                 * ExtendValidReasonAndActionCodes: function (reasonScope)
                 * {
                 *     return {
                 *         reasonCodes: {
                 *             Z_CUSTOM_REASON: "Custom reason label"
                 *         },
                 *         actionCodes: {
                 *             Z_CUSTOM_ACTION: "Custom action label"
                 *         }
                 *     };
                 * }
                 */
                Common.ExtendValidReasonAndActionCodes = function (reasonScope) {
                };
                /**
                 * French B2B (FRB2B) compliance customization callbacks
                 * @namespace Lib.AP.Customization.Common.FRB2B
                 */
                let FRB2B;
                (function (FRB2B) {
                    /**
                     * @method Lib.AP.Customization.Common.FRB2B.GetOnHoldReasons
                     * @since 345
                     * @description
                     * User exit to customize the available reasons for On Hold / Set Aside action in French B2B compliance.
                     * This allows customizations to add, remove, or modify the list of reasons displayed to users.
                     * You have to translate added reasons on the VIP for them to appear as option in the combobox
                     * @param {string[]} defaultReasons - The default array of reasons combining Dispute, PartiallyApproved, and Suspended reasons
                     * @returns {void | string[]} - Modified array of reasons to use instead of the default, or nothing to use the default reasons
                     * @example
                     * GetOnHoldReasons = function(defaultReasons)
                     * {
                     *     // Use only specific reasons
                     *     return [
                     *         "Autre",
                     *         "Erreur de calcul de la facture",
                     *         "N° de COMMANDE Incorrect ou manquant"
                     *     ];
                     * }
                     */
                    FRB2B.GetOnHoldReasons = function (defaultReasons) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.FRB2B.GetRejectReasons
                     * @since 345
                     * @description
                     * User exit to customize the available rejection reasons list in French B2B compliance.
                     * The available reasons must stay within the list of valid rejection reason keys (see {@link Sys.FRB2B.AP.RejectionReasons}).
                     * You can only customize which reasons will be displayed to users amongst that list.
                     * @param {string[]} defaultReasons - The default array of rejection reasons
                     * @returns {void | string[]} - Modified array of rejection reasons to use instead of the default, or nothing to use the default reasons
                     * @example
                     * GetRejectReasons = function(defaultReasons)
                     * {
                     *     // Remove the CMD_ERR rejection reason
                     *     return defaultReasons.filter(function(reason) { return reason !== "CMD_ERR"; });
                     * }
                     */
                    FRB2B.GetRejectReasons = function (defaultReasons) {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.FRB2B.CustomizeDefaultCDVRejectReason
                     * @since 364
                     * @description
                     * User exit to override the default CDV rejection reason code used when no reason has been selected.
                     * When a Refused CDV is generated and the rejection reason is empty, the standard fallback is "ADR_ERR".
                     * An invalid rejection reason is never replaced: the CDV is not generated.
                     * Called from the Vendor Invoice CDV process: Data refers to the CDV record, not to the vendor invoice.
                     * Return a custom reason code to replace that default, or return nothing to keep "ADR_ERR".
                     * The returned value must be a valid rejection reason key (see {@link Sys.FRB2B.AP.RejectionReasons}), otherwise the CDV is not generated.
                     * @returns {string | void} The default rejection reason code, or void to use "ADR_ERR"
                     * @example <caption>Use default rejection reason "DEST_ERR" (recipient error)</caption>
                     * CustomizeDefaultCDVRejectReason = function ()
                     * {
                     *     return "DEST_ERR";
                     * }
                     */
                    FRB2B.CustomizeDefaultCDVRejectReason = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Common.FRB2B.CustomizeDefaultCDVDisputeReason
                     * @since 366
                     * @description
                     * User exit to override the default CDV dispute reason code used when no reason has been selected.
                     * When an OnHold (207), PartiallyApproved (206) or Suspended (208) CDV is generated and the dispute reason is empty,
                     * the standard fallback is "AUTRE" when it is allowed for the status, otherwise the CDV is not generated (208).
                     * An invalid dispute reason is never replaced: the CDV is not generated.
                     * Called from the Vendor Invoice CDV process: Data refers to the CDV record, not to the vendor invoice.
                     * The returned value must be a valid reason key for the given status (see {@link Sys.FRB2B.AP.DisputeReasons},
                     * {@link Sys.FRB2B.AP.PartiallyApprovedReasons} and {@link Sys.FRB2B.AP.SuspendedReasons}), otherwise the CDV is not generated.
                     * @param {string} cdvStatus - The CDV status being generated (see {@link Sys.FRB2B.AP.Helpers.CDVStatus}):
                     * "FRB2B_206_PartiallyApproved", "FRB2B_207_OnHold" or "FRB2B_208_Suspended"
                     * @returns {string | void} The default dispute reason code, or void to keep the standard fallback
                     * @example <caption>Use "JUSTIF_ABS" (missing supporting document) for a Suspended CDV</caption>
                     * CustomizeDefaultCDVDisputeReason = function (cdvStatus)
                     * {
                     *     if (cdvStatus === Sys.FRB2B.AP.Helpers.CDVStatus.Suspended)
                     *     {
                     *         return "JUSTIF_ABS";
                     *     }
                     * }
                     */
                    FRB2B.CustomizeDefaultCDVDisputeReason = function (cdvStatus) {
                    };
                })(FRB2B = Common.FRB2B || (Common.FRB2B = {}));
                /**
                 * @method Lib.AP.Customization.Common.AutoAwakeRelatedInvoice
                 * @since 345
                 * @description
                 * Allows you to customize the condition for determining if a credit note matches the claimed amount of an invoice.
                 * By default, the matching is based on checking if the invoice claimed amount and credit note amount sum to zero.
                 * This user exit allows you to implement custom matching logic based on amounts.
                 * This is used when automatically posting the original invoice after a credit memo is received.
                 * See also {@link Lib.AP.Customization.Extraction.IsMatchingOriginalInvoice} for automatic credit note matching during extraction.
                 * Note: This user exit is only used when ExceptionResolutionMode is set to LineLevelReview or LineLevelApproval.
                 * @param {number} invoiceClaimedAmount The claimed amount of the original invoice that is waiting for credit memo
                 * @param {number} creditNoteAmount The amount of the current credit note being processed
                 * @returns {boolean | void} true if the credit note matches the invoice, false if it doesn't match. Return void or undefined to use the default amount-based matching logic.
                 * @example <caption>Match credit note based on a custom reference field</caption>
                 * Common.AutoAwakeRelatedInvoice: function (invoiceClaimedAmount, creditNoteAmount)
                 * {
                 *     // Custom matching logic based on a reference field from the credit note
                 *     const creditNoteReference = Data.GetValue<string>("Z_InvoiceReference__");
                 *     if (creditNoteReference)
                 *     {
                 *         // Match based on custom reference field
                 *         return true;
                 *     }
                 *     // Otherwise, return nothing to use default amount-based matching
                 * }
                 * @example <caption>Match with a tolerance on the amount</caption>
                 * Common.AutoAwakeRelatedInvoice: function (invoiceClaimedAmount, creditNoteAmount)
                 * {
                 *     if (!creditNoteAmount || isNaN(creditNoteAmount) || !invoiceClaimedAmount || isNaN(invoiceClaimedAmount))
                 *     {
                 *         return false;
                 *     }
                 *
                 *     // Allow a tolerance of 0.01 for matching
                 *     const tolerance = 0.01;
                 *     const difference = Math.abs(invoiceClaimedAmount + creditNoteAmount);
                 *
                 *     return difference <= tolerance;
                 * }
                 */
                Common.AutoAwakeRelatedInvoice = function (invoiceClaimedAmount, creditNoteAmount) {
                };
                /**
                 * @method Lib.AP.Customization.Common.CustomizeDefaultCDVTypeForOnHoldAction
                 * @since 347
                 * @description
                 * User exit to customize the default value of CDV types presented in the on hold dialog in the context of invoices coming from the PA (French e-invoicing).
                 * @param {string[]} defaultCDVTypes The default ordered list of CDV types to present in the on hold dialog.
                 * @returns {string} The default CDV type to select in the on hold dialog.
                 * @example <caption>Prioritize Sys.FRB2B.AP.OnHoldCDVType.NothingToDeclare</caption>
                 * GetDefaultCDVTypeForOnHoldAction: function (defaultCDVTypes)
                 * {
                 *     		if (cdvTypes.indexOf(Sys.FRB2B.AP.OnHoldCDVType.NothingToDeclare) !== -1)
                 *			{
                 *				return Sys.FRB2B.AP.OnHoldCDVType.NothingToDeclare;
                 *			}
                 *			if (cdvTypes.indexOf(Sys.FRB2B.AP.OnHoldCDVType.Dispute) !== -1)
                 *			{
                 *				return Sys.FRB2B.AP.OnHoldCDVType.Dispute;
                 *			}
                 *			if (cdvTypes.indexOf(Sys.FRB2B.AP.OnHoldCDVType.Suspended) !== -1)
                 *			{
                 *				return Sys.FRB2B.AP.OnHoldCDVType.Suspended;
                 *			}
                 *			return Sys.FRB2B.AP.OnHoldCDVType.PartiallyApproved;
                 * }
                 */
                Common.CustomizeDefaultCDVTypeForOnHoldAction = function (defaultCDVTypes) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnRevertCompanyCode
                 * @description
                 * Allows you to run logic after the company code field has been reverted
                 * @since 347
                 * @example
                 * <pre><code>
                 * OnRevertCompanyCode: function()
                 * {
                 * 		Controls.CompanyCode__.SetValue("");
                 * }
                 * </code></pre>
                 */
                Common.OnRevertCompanyCode = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.GetEReportingBatchExportCompanyCodes
                 * @description Allows you to provide the list of company codes to generate child "Export Invoices" processes in "EReporting Batch Export".
                 * If this user exit returns nothing or an empty array, standard behavior continues (scheduler parameter, then table fallback).
                 * @since 351
                 * @returns {string[]|void} List of company codes to process (for example ["UK01", "US01"]).
                 * @example
                 * <pre><code>
                 * Common.GetEReportingBatchExportCompanyCodes = function ()
                 * {
                 * 	return ["UK01", "US01", "MY01"];
                 * };
                 * </code></pre>
                 */
                Common.GetEReportingBatchExportCompanyCodes = function () {
                };
                /**
                 * @method Lib.AP.Customization.Common.OnShouldUpdateVendorNumberOnPOHeaderAndItems
                 * @since 353
                 * @description
                 * Allows you to override whether the vendor number on PO header and items should be updated
                 * when an invoice is posted. By default, the ERP implementation determines this value.
                 * This is useful in "PO Invoice as FI" setups with a non-SAP ERP providing POs, where
                 * the default SAP/S4 behavior always returns true and would overwrite local PO table vendor numbers.
                 * @param {boolean} value The default value returned by the ERP implementation.
                 * @returns {boolean | void} Return false to prevent the vendor number update, true to allow it,
                 * or nothing to use the default ERP behavior.
                 * @example <caption>Prevent vendor number update on PO header and items</caption>
                 * 	Common.OnShouldUpdateVendorNumberOnPOHeaderAndItems = function (value)
                 * 	{
                 * 		return false;
                 * 	}
                 */
                Common.OnShouldUpdateVendorNumberOnPOHeaderAndItems = function (value) {
                };
                /**
                 * Allows appending extra segments to the grouping key used to bucket invoices during the UpdateWaitingGR auto-post processing.
                 *
                 * The standard key is built from `configuration|ERP|companyCode|orderNumber|invoiceType`.
                 * Return a non-empty array of non-empty strings to append to the standard key (joined with `|`).
                 * Return `void`, `undefined`, or an empty array to use the standard key unchanged.
                 *
                 * @method Lib.AP.Customization.Common.GetGRAutoPostProcessingKeySuffix
                 * @since 356
                 * @param {string} invoice - The MSNEX of the waiting invoice record.
                 * @returns {string[] | void} An ordered array of non-empty strings to append to the standard key, or void to use the standard key.
                 * @example
                 * // Route GRIV-eligible invoices into a separate processing bucket
                 * Lib.AP.Customization.Common.GetGRAutoPostProcessingKeySuffix = function (invoice)
                 * {
                 *     var grAutoPostPossible = GenericAPI.GetField(invoice, "Z_GR_AutoPost_Possible__");
                 *     if (grAutoPostPossible === "1")
                 *     {
                 *         return ["GRIV"];
                 *     }
                 * };
                 */
                Common.GetGRAutoPostProcessingKeySuffix = function (invoice) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OverrideShouldArchiveIntercompanyInvoice
                 * @since 356
                 * @description
                 * Allows you to override the result of the ShouldArchiveIntercompanyInvoice function.
                 * In standard, an intercompany invoice is archived when the invoice is detected as intercompany
                 * and the ArchiveIntercompanyInvoices parameter is set to "1".
                 * Return a boolean to override the standard behavior, or void to keep it.
                 * @param {boolean} standardResult The value that the standard function would have returned.
                 * @returns {boolean | void} Return true to force archiving, false to prevent it, or void to keep the standard behavior.
                 * @example <caption>Force archiving for all intercompany invoices regardless of configuration</caption>
                 * OverrideShouldArchiveIntercompanyInvoice = function (standardResult)
                 * {
                 * 	return true;
                 * };
                 */
                Common.OverrideShouldArchiveIntercompanyInvoice = function (standardResult) {
                };
                /**
                 * @method Lib.AP.Customization.Common.OverrideIsEDIIntercompanyInvoice
                 * @since 359
                 * @description
                 * Allows you to override the result of the EDI intercompany invoice detection.
                 * In standard, an intercompany invoice is detected when the vendor SIRET/SIREN or VAT number
                 * matches a company code in the PurchasingCompanycodes__ table (SIRET__ or VATNumber__ field).
                 * Return a boolean to override the standard behavior, or void to keep it.
                 * @param {Lib.AP.Mapping.EDIDocument} mapperDoc The EDI mapper document containing the vendor identification data.
                 * @param {boolean} standardResult The value that the standard detection would have returned.
                 * @returns {boolean | void} Return true to force intercompany detection, false to prevent it, or void to keep the standard behavior.
                 * @example <caption>Force intercompany detection based on a custom condition</caption>
                 * OverrideIsEDIIntercompanyInvoice = function (mapperDoc, standardResult)
                 * {
                 * 	if (mapperDoc.GetVendorVATNumber() === "FR12345678901")
                 * 	{
                 * 		return true;
                 * 	}
                 * };
                 */
                Common.OverrideIsEDIIntercompanyInvoice = function (mapperDoc, standardResult) {
                };
                /**
                 * @method Lib.AP.Customization.Common.LimitUDCToSingleLinePerKeyword
                 * @since 364
                 * @description
                 * This user exit is called during UDC keyword detection in the non-EDI path.
                 * When it returns true, only the first occurrence of a matched keyword generates
                 * a non-PO line, even if the keyword appears multiple times in the document.
                 * By default (not implemented or returning a falsy value), one non-PO line is
                 * added per occurrence found (standard behavior).
                 * @returns {boolean | void} Return true to limit to a single non-PO line per keyword, or void/falsy to keep standard behavior.
                 * @example <caption>Limit UDC keyword detection to a single non-PO line per keyword</caption>
                 * LimitUDCToSingleLinePerKeyword = function ()
                 * {
                 * 	return true;
                 * };
                 */
                Common.LimitUDCToSingleLinePerKeyword = function () {
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_COMMON_SAMPLE.js.map