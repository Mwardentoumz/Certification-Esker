"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line no-redeclare
/* LIB_DEFINITION{
  "name": "LIB_VENDORREGISTRATION_CUSTOMIZATION_HTMLSCRIPTS_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) Vendor registration process",
  "versionable": false,
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @namespace Lib.VendorRegistration.Customization.HTMLScripts
 */
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var Customization;
        (function (Customization) {
            var HTMLScripts;
            (function (HTMLScripts) {
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.GetContributorsExtraFilter
                 * @since 249
                 * @description
                 * Allows you to customize the filter used when browsing for users in the workflow pane of the Vendor registration process.
                 * This user exit is called from the HTML Page script of the Vendor registration process, when browsing for users.
                 * @param {string} role Role of the contributor to select.
                 * @return {array<string>} result An array of LDAP filters that will be used to filter the contributors.
                 * @example
                 * HTMLScripts.GetContributorsExtraFilter = function(role)
                 * {
                 * 	// exclude ap specialists
                 * 	var extraFilters = [ "(!(LOGIN=ap*))" ];
                 * 	if (role === WorkflowParameters.roles.approver)
                 * 	{
                 * 		// Include cost center owners only
                 * 		extraFilters.push("LOGIN=ccowner*");
                 * 	}
                 * 	return extraFilters;
                 * }
                 */
                HTMLScripts.GetContributorsExtraFilter = function (role) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnHTMLScriptEnd
                 * @since 241
                 * @description
                 * This user exit is called at the end of the HTML page script of the Vendor Registration.
                 * It Allows you to customize layout settings of the Vendor invoice process
                 * Caution: this user exit is called asynchronously, if you need to defined Controls events
                 * Please implement the OnHTMLScriptEndSync User Exit instead.
                 * @param {string} currentRole
                 * @example
                 * <caption>This example allows you to customize different options in conversations, for example :
                 *  - the list of recipient for the conversation with the option "recipientList"
                 *  - the email template to use with the option "emailTemplate"
                 *  - custom tags with the option "emailCustomTags"</caption>
                 * HTMLScripts.OnHTMLScriptEnd = function (currentRole)
                 * {
                 *	if (!User.isVendor)
                 *	{
                 *		var registrationURL = Variable.GetValueAsString("VendorRegistrationURLInternal");
                 *
                 *		var options =
                 *		{
                 *			"addPreviousMessageTags": true,
                 *			"gatherMessagesOfGroups": [],
                 *			"createConversationIfNotExist": true,
                 *			"allowAttachments": true,
                 *			"notifyByEmail": true,
                 *			"recipientList": ["cfoprocess.wegeneren@esker.com","buyerprocess.wegeneren@esker.com"],
                 *			"emailTemplate": "AP-Vendor_RegistrationConversationVendor_Custom.htm",
                 *			"emailCustomTags": {
                 *				"VendorRegistrationUrl__": registrationURL
                 *			},
                 *			"fromName": "My Company",
                 *			"fromEmailAddress": "contact@example.com"
                 *		};
                 *		Controls.ConversationUI__.SetOptions(options);
                 *	}
                 * }
                 *
                 * @example
                 * <caption>This example allows you to show panes depending of the current workflow role</caption>
                 * HTMLScripts.OnHTMLScriptEnd = function (currentRole)
                 * {
                 *	function hideEverything()
                 *	{
                 *		[
                 *		"CompanyProfilePane",
                 *		"DiversityPane",
                 *		"DocumentsPane",
                 *		"ERPPane",
                 *		"PaymentPane",
                 *		"CompanyOfficers",
                 *		"Banks",
                 *		"CommentPane"
                 *		].forEach(function (control)
                 *		{
                 *			if (Controls[control])
                 *			{
                 *				Controls[control].Hide(true);
                 *			}
                 *			else
                 *			{
                 *				Log.Info("Could not hide control " + control);
                 *			}
                 *		});
                 *	}
                 *	var onChangeBackup = Controls.Country__.OnChange;
                 *	Controls.Country__.OnChange = function()
                 *	{
                 *		onChangeBackup().then(() =>
                 *		{
                 *			switch (currentRole)
                 *			{
                 *				case "_LegalReviewer":
                 *					Controls.DiversityPane.Hide(true);
                 *					break;
                 *				default:
                 *					break;
                 *			}
                 *		});
                 *	}
                 *
                 *	switch (currentRole)
                 *	{
                 *		case "_LegalReviewer":
                 *			hideEverything();
                 *			Controls.CompanyOfficers.Hide(false);
                 *			Controls.CommentPane.Hide(false);
                 *			break;
                 *		default:
                 *			break;
                 *	}
                 * }
                 */
                HTMLScripts.OnHTMLScriptEnd = function (currentRole) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnHTMLScriptEndSync
                 * @since 245
                 * @description
                 * This user exit is called at the end of synchronous part of the Vendor Registration process.
                 * Useful to overload Controls Events and avoid asynchronous issues
                 * @example
                 * HTMLScripts.OnHTMLScriptEndSync = function ()
                 * {
                 *			Controls.VendorCategory__.OnChange = function()
                 *			{
                 *					if (!User.isVendor)
                 *					{
                 *						Control.Z_Custo__.Hide(false);
                 *						Control.Z_Custo__.SetRequired(true);
                 *					}
                 *			};
                 *		}
                 * }
                 */
                HTMLScripts.OnHTMLScriptEndSync = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnFillVendorFieldsFromDnB
                 * @since 348
                 * @description
                 * This user exit is called after the standard vendor fields have been populated from D&B (Dun & Bradstreet)
                 * company lookup results. It receives the complete D&B JSON response, allowing you to extract any
                 * registration numbers (SIRET, SIREN, VAT, etc.) and populate your custom fields.
                 * @param {Object} jsonResult - The complete D&B JSON response containing company data
                 * @param {string} jsonResult.companyName - Company name from D&B
                 * @param {string} jsonResult.dunsNumber - DUNS number
                 * @param {Object} jsonResult.address - Address object
                 * @param {string} jsonResult.address.street - Street address
                 * @param {string} jsonResult.address.postalCode - Postal/ZIP code
                 * @param {string} jsonResult.address.city - City name
                 * @param {string} jsonResult.address.state - State/Region
                 * @param {string} jsonResult.phoneNumber - Phone number
                 * @param {string} jsonResult.numberOfEmployees - Number of employees
                 * @param {string} jsonResult.structure - Company structure (e.g., "Corporation")
                 * @param {string} jsonResult.website - Company website URL
                 * @param {Array<Object>} jsonResult.registrationNumbers - Array of registration numbers
                 * @param {string} jsonResult.registrationNumbers[].registrationNumber - The registration number value
                 * @param {string} jsonResult.registrationNumbers[].typeDescription - Description (e.g., "SIRET (FR)", "Value Added Tax Number (FR)")
                 * @param {number} jsonResult.registrationNumbers[].typeDnBCode - D&B type code (2081=SIRET, 2078=SIREN, 2080=VAT)
                 * @param {boolean} jsonResult.registrationNumbers[].isPreferredRegistrationNumber - Whether this is the preferred registration number
                 * @returns {void}
                 * @example <caption>Extract SIRET number for French companies</caption>
                 * HTMLScripts.OnFillVendorFieldsFromDnB = function (jsonResult)
                 * {
                 *     if (jsonResult.registrationNumbers)
                 *     {
                 *         jsonResult.registrationNumbers.forEach(function (regNum)
                 *         {
                 *             if (regNum.typeDnBCode === 2081) // SIRET (FR)
                 *             {
                 *                 Data.SetValue("Z_SIRET__", regNum.registrationNumber);
                 *             }
                 *         });
                 *     }
                 * };
                 * @example <caption>Extract multiple French registration numbers</caption>
                 * HTMLScripts.OnFillVendorFieldsFromDnB = function (jsonResult)
                 * {
                 *     if (jsonResult.registrationNumbers)
                 *     {
                 *         jsonResult.registrationNumbers.forEach(function (regNum)
                 *         {
                 *             switch (regNum.typeDnBCode)
                 *             {
                 *                 case 2081: // SIRET (FR)
                 *                     Data.SetValue("Z_SIRET__", regNum.registrationNumber);
                 *                     break;
                 *                 case 2078: // SIREN (FR)
                 *                     Data.SetValue("Z_SIREN__", regNum.registrationNumber);
                 *                     break;
                 *                 case 2080: // VAT Number (FR)
                 *                     Data.SetValue("Z_VATNumber__", regNum.registrationNumber);
                 *                     break;
                 *             }
                 *         });
                 *     }
                 * };
                 */
                HTMLScripts.OnFillVendorFieldsFromDnB = function (jsonResult) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.ValidCurrentStep
                 * @since 215
                 * @description
                 * Function called in Vendor registration when the Next button is clicked by the user (Vendor profile)
                 * to add additionnal checks on step validation.
                 * Default process checks are done after calling this function.
                 *
                 * @returns {boolean} If the current step is valid and the user can go to the next step.
                 * @example
                 * HTMLScripts.ValidCurrentStep = function()
                 * {
                 *	//We require a value for this field
                 *	const value = Data.GetValue("CompanyStructure__");
                 *	const isValid = !Controls.CompanyStructure__.IsVisible() || (value !== null && value !== "");
                 *	if(!isValid){
                 *		Data.SetError("CompanyStructure__", "This field is required");
                 *	}
                 *	return isValid;
                 * }
                 */
                HTMLScripts.ValidCurrentStep = function () {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.HideConversationPane
                 * @since 241
                 * @description
                 * Function called in Vendor registration process during the external conversation initialization
                 * to modify the conversation pane visibility.
                 * Default process checks are done after calling this function.
                 *
                 * @param {Sys.WorkflowController.WorkflowController} workflowController the WorkflowController instance used in the HTML page script
                 * @param {boolean} actualState Represent the actual visibility of the pane
                 * @returns {boolean} If the conversation pane have to be hidden.
                 * @example
                 * HTMLScripts.HideConversationPane = function(workflowController, actualState)
                 * {
                 *	//Conversation pane is hidden before vendor validation
                 *  return workflowController.GetTableIndex() <= workflowController.GetRoleSequenceIndex("_Vendor");
                 * }
                 */
                HTMLScripts.HideConversationPane = function (workflowController, actualState) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.NewVendorRegistrationPopups
                 * @since 245
                 * @description
                 * This user exit is called at the end of the HTML page script of the New Vendor Registration.
                 * You can customize the popups shown to users before creating a vendor registration,
                 * including default values, popup fields and popup event handlers.
                 * @param {ChoicePopupOption} choicePopup
                 * @param {SendPopupOption} sendPopup
                 * @example
                 * <caption>Change the default value for the category field</caption>
                 * HTMLScripts.NewVendorRegistrationPopups = function (choicePopup, sendPopup)
                 * {
                 * 	sendPopup._defaultValue.category = "";
                 *
                 * 	//Setting popup company code field
                 *  sendPopup._controlNames.companyCode = "ctrlCompanyCode";
                 *  sendPopup._controlParameters.companyCode = {
                 * 		Enabled: true,
                 * 		Width: "100px",
                 * 		Label: "Company code",
                 * 		TableName: "PurchasingCompanycodes__",
                 * 		SortOrder: "ASC",
                 * 		SavedColumn: "CompanyCode__",
                 * 		DefaultValueColumn: "DefaultValue__",
                 * 		Customfilter: "",
                 * 		DisplayedColumns: "CompanyCode__|CompanyName__",
                 * 		BrowseTitle: "_CompanyCodeBrowseTitle",
                 * 		ErrorMessageEmptyField: "_Company Code is mandatory."
                 * 	};
                 *  let previousHandleEvents = sendPopup.HandleEvents;
                 * 	sendPopup.HandleEvents = function (dialog, tab_id, event, control, param1)
                 * 	{
                 * 		previousHandleEvents(dialog, tab_id, event, control, param1);
                 * 		if (event === "OnChange" && control.GetName() === "ctrlCompanyCode")
                 * 		{
                 * 			const companyCodeValue = control.GetValue();
                 * 			const companyCodeText = control.GetText();
                 * 			Log.Info("Selected company code: " + companyCodeValue + " - " + companyCodeText);
                 * 		}
                 * 	}
                 * }
                 * @example
                 * <caption>Customize popup event handlers</caption>
                 * HTMLScripts.NewVendorRegistrationPopups = function (choicePopup, sendPopup)
                 * {
                 * 	var previousHandleEvents = sendPopup.HandleEvents;
                 * 	sendPopup.HandleEvents = function (dialog, tab_id, event, control, param1)
                 * 	{
                 * 		previousHandleEvents(dialog, tab_id, event, control, param1);
                 * 		// your custom event handling logic here
                 * 	};
                 * }
                 */
                HTMLScripts.NewVendorRegistrationPopups = function (choicePopup, sendPopup) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.ValidateRequiredFields
                 * @since 245
                 * @description
                 * This user exit is called in the Vendor Registration custom script process.
                 * When requester approves
                 * 	- In function ApproveWithPopupCommentDialog (Role == LegalReviewer)
                 * 	- In function Approve (Role != LegalReviewer)
                 * You can return our own validation function
                 * You are in charge of calling the baseValidateFunction in your returned function if you want to keep
                 * The standard validation behavior
                 * @param {callback} baseValidateFunction - function applying standard validation
                 * you should call this function in your returned function if you want to keep
                 * The standard validation behavior
                 * @returns {callback} - function applying your custom validation.
                 * @example
                 * <caption>Change the default function used to validate fields</caption>
                 * HTMLScripts.ValidateRequiredFields = function (baseValidateFunction)
                 * {
                 * 			return function()
                 * 			{
                 * 						baseValidateFunction();
                 * 						Controls.Z_Custo1__.Focus();
                 * 						if (Controls.Z_Custo2__.GetValue() === "")
                 * 						{
                 * 							Controls.Z_Custo2__.SetError("_This field should not be empty");
                 * 						}
                 * 			}
                 * }
                 */
                HTMLScripts.ValidateRequiredFields = function (baseValidateFunction) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnValidatePaymentTerms
                 * @since 302
                 * @description
                 * This user exit is called in the Vendor Registration custom script process
                 * You can modify whether payment term fields are required or not
                 * @param {Object} errorMessageByField - Object containing error message by payment term fields
                 * @param {boolean} isPaymentTermComboBoxActive - Flag indicating if the payment term combo box is active (if the customer is using Country_Payment_Term__ table for the current Country__)
                 * @returns {void} - Modify the object reference @argument errorMessageByField to customize the error messages
                 * @example
                 * HTMLScripts.OnValidatePaymentTerms = function (errorMessageByField, isPaymentTermComboBoxActive)
                 * {
                 * 		// Scenario 1: Force the combo box field to be required and 'comment' field to be optional
                 * 		if (isPaymentTermComboBoxActive)
                 * 		{
                 * 			errorMessageByField.PaymentTermCode__ = Sys.Helpers.IsEmpty(Controls.PaymentTermCode__.GetValue()) ? "This field is required" : "";
                 * 			errorMessageByField.PaymentTerms__ = "";
                 * 		}
                 *
                 * 		// Scenario 2: Force the entry of a payment term 'comment' if the customer is not using the combo box field
                 * 		if (!isPaymentTermComboBoxActive && Sys.Helpers.IsEmpty(Controls.PaymentTerms__.GetValue()))
                 * 		{
                 * 			errorMessageByField.PaymentTerms__ = "This field is required";
                 * 		}
                 *
                 * 		// Scenario 3: Set payment terms & payment terms comment as optional if the customer does not require these details for vendor registration
                 * 		errorMessageByField.PaymentTermCode__ = "";
                 * 		errorMessageByField.PaymentTerms__ = "";
                 * }
                 */
                HTMLScripts.OnValidatePaymentTerms = function (errorMessageByField, isPaymentTermComboBoxActive) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnValidatePaymentMethod
                 * @since 302
                 * @description
                 * This user exit is called in the Vendor Registration custom script process
                 * You can modify whether payment method fields are required or not
                 * @param {Object} errorMessageByField - Object containing error message by payment method fields
                 * @param {boolean} isPaymentMethodComboBoxActive - Flag indicating if the payment method combo box is active (if the customer is using Country_Payment_Method__ table for the current Country__)
                 * @returns {void} - Modify the object reference @argument errorMessageByField to customize the error messages
                 * @example
                 * HTMLScripts.OnValidatePaymentMethod = function (errorMessageByField, isPaymentMethodComboBoxActive)
                 * {
                 * 		// Scenario 1: Force the combo box field to be required and 'comment' field to be optional
                 * 		if (isPaymentMethodComboBoxActive)
                 * 		{
                 * 			errorMessageByField.PaymentMethodCode__ = Sys.Helpers.IsEmpty(Controls.PaymentMethodCode__.GetValue()) ? "This field is required" : "";
                 * 			errorMessageByField.PaymentMethod__ = "";
                 * 		}
                 *
                 * 		// Scenario 2: Force the entry of a payment method 'comment' if the customer is not using the combo box field
                 * 		if (!isPaymentMethodComboBoxActive && Sys.Helpers.IsEmpty(Controls.PaymentMethod__.GetValue()))
                 * 		{
                 * 			errorMessageByField.PaymentMethod__ = "This field is required";
                 * 		}
                 *
                 * 		// Scenario 3: Set payment method & payment method comment as optional if the customer does not require these details for vendor registration
                 *		errorMessageByField.PaymentMethodCode__ = "";
                        errorMessageByField.PaymentMethod__ = "";
                 * }
                 */
                HTMLScripts.OnValidatePaymentMethod = function (errorMessageByField, isPaymentMethodComboBoxActive) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.SetWorkflowParameters
                 * @deprecated Use Lib.VendorRegistration.Customization.Common.SetWorkflowParameters
                 * @since 249
                 * @description
                 * Use this function to override the defaultworkflow parameters
                 * @param {Sys.WorkflowController.IWorkflowParam} defaultWorkflowParameters The default workflow parameters
                 * @returns {null | Sys.WorkflowController.IWorkflowParam} null if not enabled, an object representing the workflow parameters if enabled
                 * @example
                 * <caption>Add an AddressApprover and a BankDetailsApprover in the workflow parameters</caption>
                 * HTMLScripts.SetWorkflowParameters = function (defaultWorkflowParameters)
                 * {
                 * 		defaultWorkflowParameters.roles["AddressApprover"] = "_AddressApprover";
                 * 		defaultWorkflowParameters.roles["BankDetailsApprover"] = "_BankDetailsApprover";
                 * 		return defaultWorkflowParameters;
                 * }
                 */
                HTMLScripts.SetWorkflowParameters = function (defaultWorkflowParameters) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.ApplyChangeOfCountryEnd
                 * @since 302
                 * @description
                 * Use this function to do something after the ApplyChangeOfCountry has executed.
                 * @param {boolean} isCountryChanged - true if the country has changed (this function is also called on form initialization)
                 * @returns {void | Promise<any>} void if there is no need to sync. A promise if the customization should be syncronized.
                 * @example
                 * <caption>Show/Hide control based on country</caption>
                 * ApplyChangeOfCountryEnd: function (isCountryChanged: boolean)
                 * {
                 * 		// Hide fields for specific countries
                 * 		const country = Controls.Country__.GetValue();
                 * 		Controls.NumberOfEmployees__.Hide(country === "US");
                 *
                 * 		// Set payment terms fields as read-only if the customer wants to force the default value to be used for the vendor
                 * 		Controls.PaymentTermCode__.SetReadOnly(true);
                 * 		Controls.PaymentTerms__.SetReadOnly(true);
                 *
                 * 		// Set payment method fields as read-only if the customer wants to force the default value to be used for the vendors of a specific country
                 * 		Controls.PaymentMethodCode__.SetReadOnly(country === "AU" && User.isVendor); // This field will be read-only specifically for a vendor login
                 * 		Controls.PaymentMethod__.SetReadOnly(country === "AU");
                 * }
                 */
                HTMLScripts.ApplyChangeOfCountryEnd = function (isCountryChanged) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.SetRequiredBankFields
                 * @since 317
                 * @param {Item} item The item in the bank accounts table
                 * @param {number} nbErrors The total number of errors from all fields for this item.
                 * This should be incremented by one for each additional required field that is not filled. If a field required by standard should not be required,
                 * standard has already incremented nbErrors, so in additional to calling setErrorIfEmpty on the field, decrement nbErrors.
                 * @returns nbErrors, after any adjustments made
                 */
                HTMLScripts.SetRequiredBankFields = function (item, nbErrors) {
                    return nbErrors;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.CustomizePopupOkConfig
                 * @since 324
                 * @description
                 * Allows to customize the configuration used to configure the popup comment
                 * @param {Lib.P2P.Customization.PopupOkExtendedConfig} conf The configuration of pop up comment
                 * @returns {Lib.P2P.Customization.PopupOkExtendedConfig} The configuration of pop up comment customized
                 * @example
                 * <caption>Customize the popup conf</caption>
                 * HTMLScripts.CustomizePopupOkConfig = function(conf)
                 * {
                 *		conf.commentRequired = true;
                 *		return conf;
                 * }
                 */
                HTMLScripts.CustomizePopupOkConfig = function (conf) {
                    return conf;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.CustomizeHandleRejection
                 * @since 330
                 * @description
                 * Allows to customize the behavior of the rejection popup
                 * @returns {boolean} true, to prevent the default rejection action. By default, default rejection handling will be done
                 * @example
                 * <caption>Customize the rejection action</caption>
                 * HTMLScripts.CustomizeHandleRejection = function()
                 * {
                 * 		// Custom logic for handling rejection
                 * 		// For example, you can log the rejection reason or perform additional actions
                 * 		Log.Info("Rejection reason: " + Controls.RejectionReason__.GetValue());
                 * 		// You can also show display a custom popup to the user
                 * 		return true; // Prevent the default rejection action
                 * }
                 */
                HTMLScripts.CustomizeHandleRejection = function () {
                    return false;
                };
                /**
                 * @typedef Lib.VendorRegistration.Customization.HTMLScripts.ThirdPartyItem
                 * @param {string[]} authorizingRoles
                 * @param {boolean} monitored
                 * @param {boolean} present
                 * @param {boolean} onboarded
                 * @param {string} name
                 * @param {string} addressStreet
                 * @param {string} addressCity
                 * @param {string} addressPostCode
                 * @param {string} addressCountryCode
                 * @param {boolean} headquarter
                 * @param {string} id
                 * @param {boolean} isIdEncrypted
                 * @param {string} localIdValue
                 * @param {string} localIdType
                 * @param {string} website
                 * @param {string} isdCode
                 * @param {string} nationalPhone
                 * @param {string} activityCode
                 * @param {string} activityLabel
                 * @param {string} source
                 * @param {number} thirdPartyId
                 * @param {string} vatNumber
                 * @param {string[]} registrationNumbers
                 * @param {boolean} canBeAdded
                 */
                /**
                 * @typedef Lib.VendorRegistration.Customization.HTMLScripts.ThirdPartyData
                 * @param {string} id
                 * @param {boolean} isIdEncrypted
                 * @param {string} email
                 * @param {Lib.VendorRegistration.Customization.HTMLScripts.Attribute[]} attributes
                 * @param {boolean} cancel
                 */
                /**
                 * @typedef Lib.VendorRegistration.Customization.HTMLScripts.AttributeValue
                 * @param {number} id
                 * @param {string} value
                 */
                /**
                 * @typedef Lib.VendorRegistration.Customization.HTMLScripts.AttributeDefinition
                 * @param {number} id
                 * @param {number} accountId
                 * @param {"string" | "integer" | "decimal" | "percentage" | "boolean" | "list_unique" | "list_multiple"} type
                 * @param {"thirdparty"} bondType
                 * @param {string} label
                 * @param {string} creationDate
                 * @param {Lib.VendorRegistration.Customization.HTMLScripts.AttributeValue[]} values
                 */
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnRefreshThirdparty
                 * @since 330
                 * @description
                 * Function called in Vendor registration to customize the refresh of third party information.
                 * This function is called when the refresh of third party is done in Esker.
                 * The refresh could ever be triggered manually refreshing the compliance risk widget or triggered when loading data, following up a third party
                 * or changing the Tax id.
                 *
                 * @param {string} thirdpartyId	the current third party to refresh
                 * @param {Lib.VendorRegistration.Customization.HTMLScripts.ThirdPartyData} thirdPartydata the actual retrieved data for this third party
                 * @returns {Promise} A promise that resolves to a map of form values to be serialized, key should match a column name in the table "VM - Compliance Vendors Details__"
                 *
                 * @example
                 * <caption>Get thirparty attributes and store them in VM - Compliance Vendors Details__</caption>
                 * HTMLScripts.OnRefreshThirdparty = async function (thirdpartyId, thirdPartydata)
                 * {
                 * 	// supposing the function GetThirdpartyAttributes retrieves the attributes of the third party as an array of objects
                 * 	const attributes = await HTMLScripts.GetThirdpartyAttributes(thirdpartyId);
                 * 	if (attributes && attributes.length > 0)
                 * 	{
                 *		// supposing the function DisplayAttributes is in charge of handling the display of attributes in the UI
                 *		HTMLScripts.DisplayAttributes(attributes);
                 *
                 *		// map the attributes to "VM - Compliance Vendors Details__" for storage
                 *		const mapping = {
                 *			526: "Z_CustomField1__",
                 *			956: "Z_CustomField2__",
                 *		};
                 *
                 *		let attributesDataToStore = {};
                 *		attributes.forEach((attribute) =>
                 *		{
                 *			if (mapping[attribute.id])
                 *			{
                 *				const value = attribute.values[0].string || attribute.values[0].number;
                 *				attributesData[mapping[attribute.id]] = value;
                 *			}
                 *		});
                 *		return attributesDataToStore;
                 *	}
                 *	else
                 *	{
                 *		// supposing the function CleanAttributes is in charge of handling the removal on any attributes information in the UI
                 *		HTMLScripts.CleanAttributes();
                 *	}
                 *	return null;
                 * }
                */
                HTMLScripts.OnRefreshThirdparty = async function (thirdpartyId, thirdPartydata) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnHandleThirdPartyDialog
                 * @since 329
                 * @description
                 * Function called in Vendor registration to customize the third party dialog
                 *
                 * @param {Dialog} dialog - The dialog object representing the third-party dialog.
                 * @param {string} tabId - The identifier of the tab where the dialog is located.
                 * @param {string} event - The name of the event that triggered the function (e.g., "OnRefreshRow", "OnClick").
                 * @param {any} control - The control object that triggered the event.
                 * @param {any} row - The row object associated with the event, if applicable.
                 *
                 * @example
                 * <caption>Handle OnChange event on a custom attribute</caption>
                 * HTMLScripts.OnHandleThirdPartyDialog = function (dialog, tabId, event, control, row)
                 * {
                 * 	// Get the control name
                 * 	const controlName = control.GetName();
                 * 	if (controlName === "Attribute_523"  && event === "OnChange")
                 * 	{
                 * 		// implement your logic here
                 * 	}
                 * }
                 */
                HTMLScripts.OnHandleThirdPartyDialog = function (dialog, tabId, event, control, row) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnValidateThirdPartyDialog
                 * @since 329
                 * @description
                 * Handles the validation logic for the third-party dialog. This function is called after standard validation is passed.
                 *
                 * @param {Dialog} dialog - The dialog object representing the third-party dialog.
                 * @param {string} tabId - The identifier of the tab where the dialog is located.
                 * @param {string} event - The name of the event that triggered the function (always "OnDialogValidate").
                 * @param {any} control - The control object that triggered the event.
                 * @returns A boolean indicating the validation result, or `null` if no validation is performed.
                 *
                 * @example
                 * <caption>Validate third party if the custom control is valuated</caption>
                 * HTMLScripts.OnValidateThirdPartyDialog = function (dialog, tabId, event, control)
                 * {
                 * 	const customControl = dialog.GetControl("Attribute_523");
                 * 	return customControl && !Sys.Helpers.IsEmpty(customControl.GetValue());
                 * }
                 */
                HTMLScripts.OnValidateThirdPartyDialog = function (dialog, tabId, event, control) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.RetrieveThirdPartyId
                 * @since 331
                 * @description
                 * Function called in Vendor registration to allow subsquent action after getting the third party
                 *
                 * @param {string} thirdPartyId - The ID of the third party retrieved while refreshing
                 *
                 * @example
                 * <caption>If the third party ID is null, try search by another criteria</caption>
                 * HTMLScripts.RetrieveThirdPartyId = function (thirdPartyId)
                 * {
                 * 		var newThirdPartyId;
                 * 		if (thirdPartyId === null)
                 * 		{
                 * 			var alternativeVATNumber = Controls.Z_AlternativeVATNumber.GetValue();
                 * 			newThirdPartyId = await ComplianceRisk.eAttestationsClient.SearchThirdParty("tva=" + alternativeVATNumber);
                 * 			return newThirdPartyId;
                 * 		}
                 * }
                 */
                HTMLScripts.RetrieveThirdPartyId = function (thirdPartyId) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.CustomTaxIDValidationFunction
                 * @since 331
                 * @description
                 * Function called in Vendor registration to validate the custom tax ID based on the entity type, mainly for non-business entities.
                 * This function should be used in conjunction with the server-side user exit Lib.VendorRegistration.Customization.Server.IsNonBusinessEntity,
                 * which can deactivate the check on the tax ID server-side (the same condition should apply to both).
                 * @return {void | callback} void when not implemented, otherwise a function applying your custom validation.
                 * @example
                 * <caption>Validate the Tax ID field for non-business entities</caption>
                 * HTMLScripts.CustomTaxIDValidationFunction = function ()
                 * {
                 *		// only applies to non-business entities
                 *		var isNonBusinessEntity = Controls.Z_nonBusinessEntity__.GetValue();
                 *		if (isNonBusinessEntity)
                 *		{
                 *			return () =>
                 *          {
                 *				return new Promise((resolve) =>
                 *				{
                 *					var isValid = true;
                 *					var taxIdValue = Controls.TaxID__.GetValue();
                 *					if (taxIdValue && taxIdValue.length >= 6)
                 *					{
                 *						Controls.TaxID__.SetError("");
                 *					}
                 *					else
                 *					{
                 *						Controls.TaxID__.SetError("This field must have at least 6 characters.");
                 *						isValid = false;
                 *					}
                 *					resolve(isValid);
                 *				});
                 *			}
                 *		}
                 *		// in other case rely on the default validation
                 *		return null;
                 *	};
                 */
                HTMLScripts.CustomTaxIDValidationFunction = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.SetAttributeDefinitionsDisplayOrder
                 * @since 329
                 * @description
                 * Function called in Vendor registration to customize the order of attributes display in the follow-up dialog.
                 *
                 * @param {Lib.VendorRegistration.Customization.HTMLScripts.AttributeDefinition[]} attributesDefinitions - The array of attributes to sort
                 *
                 * @example
                 * <caption>Sort the attributes by numerical order then by alphabetical order</caption>
                 * HTMLScripts.SetAttributeDefinitionsDisplayOrder = function(attributesDefinition) {
                 * 	attributesDefinition.sort((a, b) =>
                 * 	{
                 * 		const regex = /^(\d+)/; // Regex to capture numbers at the begining of labels
                 * 		const aMatch = regex.exec(a.label);
                 * 		const bMatch = regex.exec(b.label);
                 * 		if (aMatch && bMatch)
                 * 		{
                 * 			// Both labels start with a number, compare numerically
                 * 			return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
                 * 		}
                 * 		else if (aMatch)
                 * 		{
                 * 			// Only 'a' starts with a number, it should come first
                 * 			return -1;
                 * 		}
                 * 		else if (bMatch)
                 * 		{
                 * 			// Only 'b' starts with a number, it should come first
                 * 			return 1;
                 * 		}
                 * 		else
                 * 		{
                 * 			// Both labels start with letters, compare alphabetically
                 * 			return a.label.localeCompare(b.label);
                 * 		}
                 * 	});
                 * };
                 */
                HTMLScripts.SetAttributeDefinitionsDisplayOrder = function (attributeDefinitions) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.addCustomFieldsToVendorRegistrationDialog
                 * @since 330
                 * @description
                 * Function called in Lib_VendorRegistration_Popup to add custom fields in the dialog.
                 *
                 * @param {Dialog} dialog
                 * @param {PopupOption} sendPopup
                 *
                 * @example
                 * <caption>Set the attributes to add fields to new vendor registration popup</caption>
                 * HTMLScripts.addCustomFieldsToVendorRegistrationDialog = function (dialog, sendPopup) {
                 * 		var ctrlCompanyCode = dialog.AddDatabaseComboBox(
                 * 			sendPopup._controlNames.companyCode, // name
                 * 			sendPopup._controlParameters.companyCode.Label, // label
                 * 			sendPopup._controlParameters.companyCode.Width, // width
                 * 			{ // fieldData
                 * 				"TableName": sendPopup._controlParameters.companyCode.TableName,
                 * 				"SortOrder": sendPopup._controlParameters.companyCode.SortOrder,
                 * 				"SavedColumn": sendPopup._controlParameters.companyCode.SavedColumn,
                 * 				"Customfilter": sendPopup._controlParameters.companyCode.Customfilter,
                 * 				"DisplayedColumns": sendPopup._controlParameters.companyCode.DisplayedColumns,
                 * 				"BrowseTitle": sendPopup._controlParameters.companyCode.BrowseTitle
                 * 			});
                 * 		ctrlCompanyCode.SetAllowTableValuesOnly(true);
                 * 		ctrlCompanyCode.SetSearchMode("contains");
                 * 		ctrlCompanyCode.SetPrefillResult(true);
                 * 		if (sendPopup._defaultValue) {
                 * 			ctrlCompanyCode.SetValue(sendPopup._defaultValue.companyCode);
                 * 		}
                 * 		dialog.HideControl(dialog.GetControl("ctrlVendorItemCategory"), true);
                 * };
                 */
                HTMLScripts.addCustomFieldsToVendorRegistrationDialog = function (dialog, sendPopup) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.setCustomFieldsValues
                 * @since 330
                 * @description
                 * Function called in Lib_VendorRegistration_Popup to set values in the custom fields in the dialog.
                 *
                 * @param {Dialog} dialog
                 * @param {SendPopupOption} sendPopup
                 *
                 * @example
                 * <caption>Set values to the custom fields added to the vendor registration popup</caption>
                 * HTMLScripts.setCustomFieldsValues = function (dialog, sendPopup) {
                 * 		var CompanyCode = dialog.GetControl(sendPopup._controlNames.companyCode).GetValue();
                 * 		Variable.SetValueAsString("CompanyCode", CompanyCode);
                 * };
                 */
                HTMLScripts.setCustomFieldsValues = function (dialog, sendPopup) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.SetCustomMappingForVendorInformations
                 * @since 330
                 * @description
                 * Define a custom mapping between "AP - Vendors" table fields and "Vendor Company Extended Properties" table fields.
                 * With this mapping, in the "Vendor Company Extended Properties", fields will be filled with values from "AP - Vendors".
                 * @param {string[]} mapping The standard fields mapping used to fill the "Vendor Company Extended Properties" fields from "AP - Vendors" values
                 * @returns {string[]} The custom fields mapping to use to fill the "Vendor Company Extended Properties" fields from "AP - Vendors" values
                 * @example <caption>Fields "Z_CustomFieldInExtendedProperties1__" and "Z_CustomFieldInExtendedProperties2__" in "Vendor Company Extended Properties" will be filled with  "AP - Vendors" field "Z_CustomFieldInForm__"</caption>
                 * HTMLScripts.SetCustomMappingForVendorInformations = function (mapping)
                 * {
                 * 		mapping.Z_CustomFieldInForm__ = ["Z_CustomFieldInExtendedProperties1__", "Z_CustomFieldInExtendedProperties2__"];
                 * 		return mapping;
                 * };
                 */
                HTMLScripts.SetCustomMappingForVendorInformations = function (mapping) {
                };
                /**
                 * @typedef Lib.VendorRegistration.Customization.HTMLScripts.WizardContext
                 * @property {any} wizard - The wizard object instance
                 * @property {any[]} steps - Array of wizard step configurations
                 * @property {boolean} isValid - Whether the current step validation passed
                 */
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.OnWizardStepChange
                 * @since 342
                 * @description
                 * This user exit is called during wizard navigation in the Vendor Registration process.
                 * It allows customization of step navigation behavior, including step persistence, conditional navigation,
                 * and validation override. The user exit is called at different points in the wizard lifecycle:
                 * - On initialization ('init') to set the initial step
                 * - When moving to next step ('next')
                 * - When moving to previous step ('previous')
                 * - When clicking a step button for direct navigation ('goto')
                 * - When submitting the final step ('submit')
                 *
                 * The function can override the target step by returning a different step number.
                 * If the returned step is invalid (negative, out of range, or hidden), the standard behavior continues.
                 *
                 * @param {number} currentStepId - The current wizard step index (0-based)
                 * @param {number} targetStepId - The target wizard step index that would be navigated to
                 * @param {'init' | 'next' | 'previous' | 'goto' | 'submit'} action - The navigation action being performed
                 * @param {Lib.VendorRegistration.Customization.HTMLScripts.WizardContext} wizardContext - Context object containing wizard state
                 * @returns {number | void} The step index to navigate to (overrides targetStepId), or void to use standard behavior
                 *
                 * @example
                 * <caption>Persist wizard step in browser storage to restore position on page refresh</caption>
                 * HTMLScripts.OnWizardStepChange = function (currentStepId, targetStepId, action, wizardContext)
                 * {
                 * 	const msnex = Data.GetValue("MsnEx");
                 * 	const STORAGE_KEY = "vendorRegistration_currentStep_" + msnex;
                 *
                 * 	if (action === "init")
                 * 	{
                 * 		// On initialization, restore the saved step if available
                 * 		const savedStep = localStorage.getItem(STORAGE_KEY);
                 * 		if (savedStep !== null)
                 * 		{
                 * 			const stepNumber = parseInt(savedStep, 10);
                 * 			// Return the saved step to override the default initial step
                 * 			return stepNumber;
                 * 		}
                 * 	}
                 * 	else if (action === "next" || action === "previous" || action === "goto")
                 * 	{
                 * 		// Save the target step whenever navigation occurs
                 * 		localStorage.setItem(STORAGE_KEY, targetStepId.toString());
                 * 	}
                 * 	else if (action === "submit")
                 * 	{
                 * 		// Clear saved step on submission
                 * 		localStorage.removeItem(STORAGE_KEY);
                 * 	}
                 *
                 * 	// Return void to use standard navigation behavior
                 * };
                 */
                HTMLScripts.OnWizardStepChange = function (currentStepId, targetStepId, action, wizardContext) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.HTMLScripts.GetCustomTableKeyColumn
                 * @since 351
                 * @description
                 * This user exit is called during the highlight handling phase of the Vendor Registration process,
                 * for each table that is not a standard built-in table (i.e., not `CompanyOfficersTable__` or `CompanyBankAccountsTable__`).
                 * It allows you to specify the key column for a custom table so that row-level differences can be
                 * highlighted when a vendor registration is being reviewed (update registration type).
                 *
                 * Return the name of the column that uniquely identifies each row in the custom table.
                 * If the function returns void or null, no highlight diff will be applied to the custom table.
                 *
                 * @param {string} tableName The name of the custom table being processed (e.g. `"Z_CustomItems__"`).
                 * @returns {string | void} The key column name used to identify rows in the table (e.g. `"Z_ItemId__"`), or void to skip highlighting.
                 * @example
                 * <caption>Return the key column for a custom line items table</caption>
                 * HTMLScripts.GetCustomTableKeyColumn = function (tableName)
                 * {
                 * 	if (tableName === "Z_CustomItems__")
                 * 	{
                 * 		return "Z_ItemId__";
                 * 	}
                 * };
                 */
                HTMLScripts.GetCustomTableKeyColumn = function (tableName) {
                };
            })(HTMLScripts = Customization.HTMLScripts || (Customization.HTMLScripts = {}));
        })(Customization = VendorRegistration.Customization || (VendorRegistration.Customization = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VENDORREGISTRATION_CUSTOMIZATION_HTMLSCRIPTS_SAMPLE.js.map