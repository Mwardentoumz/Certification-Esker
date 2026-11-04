"use strict";
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VENDORPORTAL_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Validation Script AP customization callbacks",
  "versionable": false,
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * Lib.AP.Customization.VendorPortal library
 * @namespace Lib.AP.Customization.VendorPortal
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var VendorPortal;
            (function (VendorPortal) {
                /**
                 * @method Lib.AP.Customization.VendorPortal.ExtendCIParametersFromVIP
                 * @since 342
                 * @description
                 * Allow to tranfer field value from Vendor Invoice to Customer Invoice parameters. new parameters to use in the ExtendCIFieldsToUpdateFromParameters user exit.
                 * @param {ESKMap<string|number|date>} parameters - parameters to use when creating/updating the Customer Invoice
                 * @param {IData} data - data of the Vendor invoice - the Data global object can either be the one from the "Vendor invoice" or "Vendor invoice payment" process
                 * @param {IVariable} [variable] - variable of the Vendor invoice - the Variable global object can either be the one from the "Vendor invoice" or "Vendor invoice payment" process
                 * @example <caption>Set the value of a VIP custom field in the parameters object</caption>
                 * VendorPortal.ExtendCIParametersFromVIP = function (parameters, data, variable)
                 * {
                 *	 parameters.Z_CustomFieldValue = data.GetValue("Z_CustomVIPField__");
                 * }
                 **/
                VendorPortal.ExtendCIParametersFromVIP = function (parameters, data, variable) {
                };
                /**
                 * @method Lib.AP.Customization.VendorPortal.ShouldUpdateCI
                 * @description
                 * Allows overriding the synchronization logic of the Customer Invoice (CI) from the Vendor Invoice Portal (VIP).
                 * Return true to force the update, false to skip it, or undefined to rely on the standard status threshold.
                 * @param {any} parameters - parameters to use when updating the Customer Invoice
                 * @returns {boolean} return true to force the update, false to skip it, or undefined to rely on the standard status threshold.
                 * @since 353
                 * @example <caption>Force update for specific vendor</caption>
                 * VendorPortal.ShouldUpdateCI = function (parameters: any)
                 * {
                 *    return true;
                 * };
                 */
                VendorPortal.ShouldUpdateCI = function (parameters) {
                };
                /**
                 * @method Lib.AP.Customization.VendorPortal.ExtendCIFieldsToUpdateFromParameters
                 * @since 342
                 * @description
                 * Allow to specifiy the list of CI fields to update based on the parameters.
                 * @param {ESKMap<{value: string|number|Date, type: "string"|"long"|"double"|"date"}>} fields - fields to update in the Customer Invoice
                 * @param {ESKMap<string|number|date>} parameters - parameters used when creating/updating the Customer Invoice (extended with the ExtendCIParametersFromVIP user exit)
                 * @example <caption>Set the value of a CI custom field to update based on the parameters object</caption>
                 * VendorPortal.ExtendCIFieldsToUpdateFromParameters = function (fields, parameters)
                 * {
                 * 	if (parameters.Z_CustomFieldValue !== undefined)
                 * 	{
                 *	 fields.Z_CustomCIField__ = { value: parameters.Z_CustomFieldValue, type: "string" };
                 * 	}
                 * }
                 */
                VendorPortal.ExtendCIFieldsToUpdateFromParameters = function (fields, parameters) {
                };
                /**
                 * @typedef {object} Lib.AP.Customization.VendorPortal.FieldMapping
                 * @property {string} nameInCI - name of the field in the Customer Invoice
                 * @property {string} nameInVIP - name of the field in the Vendor Invoice
                 */
                /**
                 * @method Lib.AP.Customization.VendorPortal.GetCustomFieldMappingForVIPCreation
                 * @since 333
                 * @description
                 * Allow to tranfer field value from Customer Invoice to Vendor Invoice
                 * @returns {Lib.AP.Customization.VendorPortal.FieldMapping[]} return an array of field mapping
                 * @example
                 * <caption>Copy three custom fields from CI to VIP</caption>
                 * VendorPortal.GetCustomFieldMappingForVIPCreation = function ()
                 * {
                 * 	return [
                 * 		{
                 * 			nameInCI: "Z_StoreNumber__",
                 * 			nameInVIP: "Z_StoreNumber__"
                 * 		},
                 * 		{
                 * 			nameInCI: "Z_Store__",
                 * 			nameInVIP: "Z_Store__"
                 * 		},
                 * 		{
                 * 			nameInCI: "Z_Location__",
                 * 			nameInVIP: "Z_Location__"
                 * 		}
                 * 	]
                 * }
                 **/
                VendorPortal.GetCustomFieldMappingForVIPCreation = function () {
                };
                /**
                 * @method Lib.AP.Customization.VendorPortal.ValidateOnSubmit
                 * @since 333
                 * @description
                 * Allow to tranfer field value from Customer Invoice to Vendor Invoice. The User exist should take care of setting the error so the user understand why the submission fail.
                 * @param {string} generateInvoiceNumber The default invoice number that may have been generated with Lib.AP.Customization.VendorPortal.GenerateInvoiceNumber, can be empty
                 * @returns {boolean} return true if data is valid, false in other cases (no return is considered as a true)
                 * @example
                 * <caption>Customer invoice submitted to France location should provide a Store</caption>
                 * VendorPortal.ValidateOnSubmit = function (generateInvoiceNumber)
                 * {
                 * 		Data.SetError("Invoice_number__", "");
                 * 		if (Data.GetValue("Z_Location__") === "France" && Data.IsNullOrEmpty("Z_Store")
                 * 		{
                 * 			Data.SetError("Invoice_number__", "Store is required for France location");
                 * 			return false;
                 * 		}
                 * 		return true;
                 * }
                 **/
                VendorPortal.ValidateOnSubmit = function (generateInvoiceNumber) {
                };
                /**
                 * @description
                 * Function called in FlipPO mode for activate or not the InvoiceNumber auto-generation
                 * If activated:
                 *  - The field InvoiceNumber is set to read only on the form
                 *  - An InvoiceNumber is generated with a customizable pattern (see GetInvoiceNumberPattern)
                 * @method Lib.AP.Customization.VendorPortal.GenerateInvoiceNumber
                 * @example
                 * <pre><code>
                 * GenerateInvoiceNumber: function()
                 * {
                 *	return true;
                 * }
                 * </code></pre>
                 */
                VendorPortal.GenerateInvoiceNumber = function () {
                    return false;
                };
                /**
                 * @description
                 * Function called to customize the customer invoice number when the invoice is created from a purchase order.
                 * $YYYY$ is replaced by the current year
                 * $seq$ is replaced by an auto-incremental ID (independant for every vendor)
                 * @method Lib.AP.Customization.VendorPortal.GetInvoiceNumberPattern
                 * @param {string} defaultPattern The default invoice number pattern
                 * @returns {string} The pattern to use. If you return an empty string (or nothing), the defaultPattern will be used.
                 * @example
                 * <pre><code>
                 * GetInvoiceNumberPattern: function(defaultPattern)
                 * {
                 *	return "ESK$YYYY$-$seq$";
                 * }
                 * </code></pre>
                 */
                VendorPortal.GetInvoiceNumberPattern = function (defaultPattern) {
                };
                /**
                 * @description Allows you to set the new short login. It will be processed normally even if a new one is set
                 * @method Lib.AP.Customization.VendorPortal.SetNewShortLogin
                 * @param {string} newLogin The default login, can be empty
                 * @returns {string} the customized login
                 * @example
                 * <pre><code>
                 * SetNewShortLogin: function(newLogin)
                 * {
                 *	return newLogin+"-custom";
                 * }
                 * </code></pre>
                 */
                VendorPortal.SetNewShortLogin = function (newLogin) {
                };
                /**
                 * @description
                 * Allows you to specify whether an invoice generated by the Convert Order to Invoice process should be signed or not.
                 * This user exit is called from the validation script of the Customer invoice process.
                 * @method Lib.AP.Customization.VendorPortal.SignInvoice
                 * @returns {boolean} true, to enable the digital signature feature. By default, the invoices will not be signed.
                 * @example
                 * <pre><code>
                 * SignInvoice: function()
                 * {
                 *	var company = Data.GetValue("Company__");
                 *	if (company === "TMC Truck Leasing")
                 *	{
                 *		return true;
                 *	}
                 *	return false;
                 * }
                 * </code></pre>
                 */
                VendorPortal.SignInvoice = function () {
                    return false;
                };
                /**
                 * Allows you to override email options or deactivate vendor notifications sending.
                 * Allows to change the sender of the email if emailSender.senderName and emailSender.senderAddress are filled in this user exit
                 * @method Lib.AP.Customization.VendorPortal.OnSendVendorNotification
                 * @param {object} emailOptions Notification email options which can be modified
                 * @param {object} emailSender Notification email sender which can be modified
                 * @returns {boolean} false, to deactivate email sending.
                 * @example
                 * <pre><code>
                 * OnSendVendorNotification: function (emailOptions, emailSender))
                 * {
                 * 		if (emailOptions.subject.key == "_Customer invoice received" )
                 *		{
                 *			// Deactivate vendor notification for new invoices
                 *			return false;
                 *		}
                 * 		else if (emailOptions.subject.key == "_Customer invoice rejected")
                 *		{
                 *			// Add a custom tag to be used in a custom email template for rejected invoices
                 *			emailOptions.template = "Custom_NewInvoice_XX.htm";
                 *			emailOptions.customTags.AdditionalNote = Lib.AP.VendorPortal.GetCurrentUser().GetVars().GetValue_String("AdditionalField1", 0);
                 *		}
                 *		// Change the sender of the email
                 *		// Both of these options must be set to be taken into account
                 *		emailSender.senderName = "Custom sender name";
                 *		emailSender.senderAddress = "custom@eskerondemand.com";
                 * }
                 * </code></pre>
                 */
                VendorPortal.OnSendVendorNotification = function (emailOptions, emailSender) {
                };
                /**
                 * @method Lib.AP.Customization.VendorPortal.OnSendDailyVendorNotification
                 * @since 353
                 * @description
                 * Allows you to override email options or deactivate the daily paid invoices vendor notification sending.
                 * This user exit is called once per supplier group (one email per vendor/company code pair).
                 * At the time this user exit is called, emailOptions.customTags only contains CompanyName__ as a plain string.
                 * Any custom tags added here will be HTML-escaped automatically before being applied to the template.
                 * Do not add pre-escaped HTML to customTags; use plain text values only.
                 * The invoiceLines HTML table is built after this user exit returns and cannot be modified via customTags.
                 * To customize the invoice lines table layout, override emailOptions.template with a custom template.
                 * To access individual invoice lines, iterate emailOptions.data.lines.
                 * @param {object} emailOptions Notification email options which can be modified
                 * @param {string} emailOptions.subject Email subject
                 * @param {string} emailOptions.template Email template filename
                 * @param {object} emailOptions.customTags Custom tags for the template (plain text, will be auto-escaped)
                 * @param {object} emailOptions.data Supplier group data ({ vendorNumber, vendorName, companyCode, configuration, lines[{ invoiceNumber, invoiceDate, invoiceAmount, invoiceCurrency, paymentDate, paymentMethod, paymentReference, configuration }] })
                 * @param {object} emailSender Notification email sender which can be modified (both senderName and senderAddress must be set to take effect)
                 * @returns {boolean} false, to deactivate email sending.
                 * @example
                 * OnSendDailyVendorNotification: function (emailOptions, emailSender)
                 * {
                 * 		if (emailOptions.data.companyCode == "US01")
                 * 		{
                 * 			// Deactivate daily notification for a specific company code
                 * 			return false;
                 * 		}
                 * 		// Add a custom tag derived from line data (plain text; will be HTML-escaped automatically)
                 * 		emailOptions.customTags.InvoiceCount = String(emailOptions.data.lines.length);
                 * 		// Override the template
                 * 		emailOptions.template = "Custom_DailyPaidInvoices_XX.htm";
                 * 		// Change the sender of the email
                 * 		// Both of these options must be set to be taken into account
                 * 		emailSender.senderName = "Custom sender name";
                 * 		emailSender.senderAddress = "custom@eskerondemand.com";
                 * }
                 */
                VendorPortal.OnSendDailyVendorNotification = function (emailOptions, emailSender) {
                };
                /**
                 * Define how to match vendors numbers as a single vendor contact
                 * In this exemple, we match by VAT number
                 * @method Lib.AP.Customization.VendorPortal.MatchVendorContact
                 * @param {object} parameters Invoice Data
                 * @returns {IUser} Vendor User
                 * @example
                 * <pre><code>
                 * MatchVendorContact: function (parameters)
                 * {
                 *	if (parameters.VendorNumber__ !== null && parameters.VendorName__ !== null)
                 *	{
                 *		var query = Process.CreateQueryAsProcessAdmin();
                 *
                 *		// Search vendor info
                 *		query.Reset();
                 *		query.SetSpecificTable("AP - Vendors__");
                 *		query.SetAttributesList("VATNumber__");
                 *		var filter = "(&(Number__=" + parameters.VendorNumber__ + ")(Name__=" + parameters.VendorName__ + "))";
                 *		query.SetFilter(filter);
                 *		if (query.MoveFirst())
                 *		{
                 *			var vendorInfoRecord = query.MoveNextRecord();
                 *			if (vendorInfoRecord)
                 *			{
                 *				var vendorInfoVars = vendorInfoRecord.GetVars();
                 *				// Search all vendors with the same VAT Number
                 *				query.Reset();
                 *				query.SetSpecificTable("AP - Vendors__");
                 *				query.SetAttributesList("CompanyCode__, VendorNumber__");
                 *				filter = "(VATNumber__=" + vendorInfoVars.GetValue_String("VATNumber__", 0) + ")";
                 *				query.SetFilter(filter);
                 *				return Lib.AP.VendorPortal.LookUpVendorContact(parameters, query);
                 *			}
                 *		}
                 *		Log.Info("MatchVendorContact - Vendor contact not founded");
                 *	}
                 *	return null;
                 * }
                 * </code></pre>
                 */
                VendorPortal.MatchVendorContact = function (parameters) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.VendorPortal.CustomizeVendorInfo
                 * @since 329
                 * @description
                 * Allow to customize new vendor's infos
                 * @param {object} vendorInfo Vendor info
                 * @param {object} parameters Parameters used for new vendor creation
                 * @param {string} businessPartnerId businessPartnerId of the new vendor
                 * @returns {IUser} return vendor user's info customized
                 * @example
                 * <caption>Force new vendor language to be "en" instead of copying current user's language</caption>
                 * VendorPortal.CustomizeVendorInfo = function (vendorInfo, parameters, businessPartnerId)
                 * {
                 *		if (parameters.Language && parameters.Culture)
                 *		{
                 *			return vendorInfo; 	// Vendor language is specified in parameters, dont change anything
                 *		}
                 *		else
                 *		{
                 *			vendorInfo.Language = "en"; // Force new vendor language to be "en" instead of copying current user's language
                 *			return vendorInfo;
                 *		}
                 * }
                 */
                VendorPortal.CustomizeVendorInfo = function (vendorInfo, parameters, businessPartnerId) {
                    return null;
                };
                /**
                 * Allows you to customize the company code and their description list for the current vendor
                 * @method Lib.AP.Customization.VendorPortal.OnGetCompaniesDescription
                 * @param {Lib.AP.CIVendorLinksInfos} vendorLinksInfos The vendor links infos
                 * @returns {Lib.AP.CICompanies} The companies list
                 * @example
                 * <pre><code>
                 * OnGetCompaniesDescription: function(vendorLinksInfos)
                 * {
                 * 	const companiesDescriptions = {};
                 * let countCompanies = 0;
                 * const query = Process.CreateQueryAsProcessAdmin();
                 * let filter = "";
                 * let i = 0;
                 * for (const companyCode in vendorLinksInfos) {
                 * 	if (Object.prototype.hasOwnProperty.call(vendorLinksInfos, companyCode)) {
                 * 		if (i &gt; 0) {
                 * 			filter = `|(CompanyCode__=${companyCode})(${filter})`;
                 * 		}
                 * 			else {
                 * 				filter = `CompanyCode__=${companyCode}`;
                 * 			}
                 * 			i++;
                 * 		}
                 * 	}
                 * 	filter = "&(" + filter + ")(|(Z_DisableVendorPortal__=0)(Z_DisableVendorPortal__!=*))";
                 * 	query.Reset();
                 * 	query.SetSpecificTable("PurchasingCompanycodes__");
                 * 	query.SetAttributesList("CompanyCode__,CompanyName__");
                 * 	query.SetFilter(filter);
                 * 	query.SetSortOrder("CompanyName__ ASC");
                 * 	query.MoveFirst();
                 * 	let record = query.MoveNextRecord();
                 * 	while (record) {
                 * 		const companyVars = record.GetVars();
                 * 		const companyCode = companyVars.GetValue_String("CompanyCode__", 0);
                 * 		const companyDescription = companyVars.GetValue_String("CompanyName__", 0);
                 * 		addCompanyDescription(companiesDescriptions, companyCode, companyDescription);
                 * 		if (countCompanies === 0) {
                 * 			Data.SetValue("Company__", companyDescription);
                 * 		}
                 * 		countCompanies++;
                 * 		record = query.MoveNextRecord();
                 * 	}
                 * 	if (countCompanies &gt; 1) {
                 * 		Data.SetValue("Company__", getLastCompanySelected());
                 *	}
                 *	return companiesDescriptions;
                 * }
                 * </code></pre>
                 */
                VendorPortal.OnGetCompaniesDescription = function (vendorLinksInfos) {
                    return null;
                };
                /**
                 * This user exit is called at the beginning of the validation script on the Customer Invoice process, right before any action is executed
                 * @method Lib.AP.Customization.VendorPortal.OnActionBegin
                 * @since 366
                 * @description
                 * Allows you to initialize or set process data before any action (submit, refresh preview, pending payment, reverse CI) is executed.
                 * @param {String} actionType validation script type called (return value of Data.GetActionType())
                 * @param {String} actionName validation script action called in lower case (return value of Data.GetActionName())
                 * @returns {void}
                 * @example <caption>Resolve billing entity from archived vendor invoice before invoice generation</caption>
                 * OnActionBegin = function(actionType, actionName)
                 * {
                 *	if (actionName == "submit") {
                 *		// For flip-PO invoices, resolve CostCenter from archived vendor invoice
                 *		if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
                 *			var query = Process.CreateQueryAsProcessAdmin();
                 *			query.Reset();
                 *			query.SetSpecificTable("AP - Vendor invoices__");
                 *			query.SetAttributesList("CompanyCode__");
                 *			query.SetFilter("RuidEx=" + Data.GetValue("PORefRuidEx"));
                 *			query.SetSearchInArchive(true);
                 *			if (query.MoveFirst()) {
                 *				var vendorInvoice = query.MoveNext();
                 *				if (vendorInvoice) {
                 *					var companyCode = vendorInvoice.GetVars().GetValue_String("CompanyCode__", 0);
                 *					Data.SetValue("CostCenter__", companyCode);
                 *				}
                 *			}
                 *		}
                 *	}
                 * }
                 */
                VendorPortal.OnActionBegin = function (actionType, actionName) {
                };
                /**
                 * This user exit is called at the end of the validation script on the Customer Invoice process, right after the action is performed
                 * @method Lib.AP.Customization.VendorPortal.OnActionEnd
                 * @param {String} actionType validation script type called (return value of Data.GetActionType())
                 * @param {String} actionName validation script action called in lower case (return value of Data.GetActionName())
                 * @example
                 * <pre><code>
                 * OnActionEnd: function(actionType, actionName)
                 * {
                 * // Code to execute after invoice submission
                 *	if (actionName == "Submit") {
                 *		var companyCode = Variable.GetValueAsString("customerInvoiceCompanyCode");
                 *		var orderNumber = Data.GetValue("Z_OrderNumber__");
                 *		if (orderNumber) {
                 *			// Search for order and set company code accordingly
                 *			var query = Process.CreateQueryAsProcessAdmin();
                 *			query.Reset();
                 *			query.SetSpecificTable("PAC - PO - Items__");
                 *			query.SetAttributesList("CompanyCode__,RequesterDN__,RecipientDN__,VendorName__,Currency__");
                 *			query.SetFilter("PONumber__=" + orderNumber);
                 *			query.SetSearchInArchive(true);
                 *			if (query.MoveFirst()) {
                 *				var transport = query.MoveNext();
                 *				if (transport) {
                 *					var vars = transport.GetUninheritedVars();
                 *					if (vars) {
                 *						var companyCode = vars.GetValue_String("CompanyCode__", 0);
                 *						var vendorName = vars.GetValue_String("VendorName__", 0);
                 *						var currency = Data.GetValue("Currency__") || vars.GetValue_String("Currency__", 0);
                 *						var requesterDN = vars.GetValue_String("RequesterDN__", 0);
                 *						var recipientDN = vars.GetValue_String("RecipientDN__", 0);
                 *						var requesterLogin = Sys.Helpers.String.ExtractLoginFromDN(requesterDN);
                 *						var recipientLogin = Sys.Helpers.String.ExtractLoginFromDN(recipientDN);
                 *						Log.Info("Company code", companyCode, " found for order ", orderNumber);
                 *						// Setting configuration and company code on form
                 *						CustomHelpers.SetConfigurationFromCompanyCode(companyCode);
                 *						CustomHelpers.SetCompanyOnForm(companyCode);
                 *						// Add order number in variable to set it during invoice extraction
                 *						Variable.SetValueAsString("Z_OrderNumber__", Data.GetValue("Z_OrderNumber__"));
                 *						// Send email to requester AND recipient if different users, otherwise send it only to recipient
                 *						var template = "CUSTOM_AP_Email_NotifRequester.htm";
                 *						var customTags = {
                 *							InvoiceNumber__: Data.GetValue("Invoice_number__"),
                 *							TotalNetAmount__: Data.GetValue("Net_amount__"),
                 *							Currency__: currency,
                 *							OrderNumber__: orderNumber,
                 *							VendorName__: vendorName
                 *						};
                 *						if (requesterLogin != recipientLogin) {
                 *							CustomHelpers.SendEmail(requesterLogin, null, template, customTags);
                 *						}
                 *						CustomHelpers.SendEmail(recipientLogin, null, template, customTags);
                 *					}
                 *				} else {
                 *					Log.Warn("No order found with number: ", orderNumber, ". Cannot set default company code.");
                 *				}
                 *			}
                 *		} else {
                 *			// If order number is empty set configuration for selected company code
                 *			Log.Info("Order number is empty, setting configuration for company", companyCode);
                 *			CustomHelpers.SetConfigurationFromCompanyCode(companyCode);
                 *		}
                 *	}
                 * </code></pre>
                 */
                VendorPortal.OnActionEnd = function (actionType, actionName) {
                };
                /**
                 * @method Lib.AP.Customization.VendorPortal.ForceUpdateShortLoginPAC
                 * @since 339
                 * @description
                 * Set boolean flag to force update of ShortLoginPAC even if a shortLoginPAC is already in the record.
                 * This is only applied if the parameter fillShortLoginPAC of Lib.Purchasing.Vendor.CreateOrUpdateVendorLink is true and there is already an existing ShortLoginPAC__ value.
                 * @param {object} parameters Parameters used for new vendor creation
                 * @returns {boolean} return true of false.
                 * @example
                 * <caption>Force the update of ShortLoginPAC same as the ShortLogin</caption>
                 * VendorPortal.ForceUpdateShortLoginPAC = function (parameters)
                 * {
                 *		if (parameters.CompanyCode__ === "1000") // Only for company code 1000
                 *		{
                 *			return true; 	// Force update of ShortLoginPAC
                 *		}
                 *		else
                 *		{
                 *			return false;	// Do not force update of ShortLoginPAC
                 *		}
                 * }
                 */
                VendorPortal.ForceUpdateShortLoginPAC = function (parameters) {
                };
                /**
                 * @method Lib.AP.Customization.VendorPortal.ExtendPortalSynchronizationRule
                 * @since 343
                 * @description
                 * Allows you to customize the vendor portal status mapping (statusVIPtoCI).
                 * This user exit enables adding custom invoice statuses or modifying existing mappings
                 * between Vendor Invoice Process statuses and Customer Invoice statuses.
                 * @param {object} statusMapping - The default status mapping object that can be modified
                 * @returns {void | object} - Modified status mapping object, or nothing to use the default mapping
                 * @example
                 * <caption>Add custom invoice status "Customized Reject" for specific rejection handling</caption>
                 * VendorPortal.ExtendPortalSynchronizationRule = function(statusMapping)
                 * {
                 *     // Add a custom status for specific rejection handling with low threshold
                 *     statusMapping["Customized Reject"] = {
                 *         name: Lib.AP.CIStatus.Rejected,
                 *         statusThreshold: 1
                 *     };
                 *
                 *     return statusMapping;
                 * }
                 */
                VendorPortal.ExtendPortalSynchronizationRule = function (statusMapping) {
                };
            })(VendorPortal = Customization.VendorPortal || (Customization.VendorPortal = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_VENDORPORTAL_SAMPLE.js.map