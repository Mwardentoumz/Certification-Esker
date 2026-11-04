/* LIB_DEFINITION{
  "name": "LIB_DD_CUSTOMIZATION_DELIVERIES_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "all deliveries customization function",
  "versionable": false,
  "require": []
}*/

/**
 * Package DD deliveries customization callbacks for all processes
 * @namespace Lib.DD.Customization.Deliveries
 */

var Lib = Lib || {};
Lib.DD = Lib.DD || {};
Lib.DD.Customization = Lib.DD.Customization || {};

Lib.DD.Customization.Deliveries = (function ()
{
	var Deliveries = {
		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeNonExistingRecipientEmailTransport
		 * @description
		 * Function called before sending an invoice by email to recipient which does not exist in database
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 * @param {object} email xTransport object obtained with Process.CreateProcessInstance()
		 * @param {object} context object with 2 defined getters for now
		 *		GetSenderUser(): 	return User object obtained with Users.GetUserAsProcessAdmin(senderId) (query is done only if needed and cached)
		 *		GetRecipientUser(): 	return User object obtained with Users.GetUserAsProcessAdmin(recipientId) (query is done only if needed and cached)
		 */
		FinalizeNonExistingRecipientEmailTransport: function (email, context) { },
		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeExistingRecipientEmailTransport
		 * @see Lib.DD.Customization.Deliveries.FinalizeNonExistingRecipientEmailTransport
		 */
		FinalizeExistingRecipientEmailTransport: function (email, context) { },

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeNonExistingRecipientCopyEmailTransport
		 * @description
		 * Function called before sending a copy email of the invoice to a recipient which is in database
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 * @param {object} email xTransport object obtained with Process.CreateProcessInstance()
		 * @param {object} context object with the following 2 getters GetSenderUser() and GetRecipientUser()
		 */
		FinalizeNonExistingRecipientCopyEmailTransport: function (email, context)
		{
			//SampleEditCusiNotification(email, context);
		},
		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeExistingRecipientCopyEmailTransport
		 * @see Lib.DD.Customization.Deliveries.FinalizeNonExistingRecipientCopyEmailTransport
		 */
		FinalizeExistingRecipientCopyEmailTransport: function (email, context)
		{
			//SampleEditCusiNotification(email, context);
		},

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeWelcomeEmailTransport
		 * @description
		 * Function called before sending the welcome email only (not called if welcome email is included in another transport)
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 * @param {object} email xTransport object obtained with Process.CreateProcessInstance()
		 * @param {object} context object with the following 2 getters GetSenderUser() and GetRecipientUser()
		 */
		FinalizeWelcomeEmailTransport: function (email, context) { },
		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeRecipientNotifEmailTransport
		 * @see Lib.DD.Customization.Deliveries.FinalizeWelcomeEmailTransport
		 */
		FinalizeRecipientNotifEmailTransport: function (email, context) { },

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeMODTransport
		 * @description
		 * Function called before sending an invoice by mod
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 * @param {object} mod xTransport object obtained with Process.CreateProcessInstance()
		 * @param {object} context object with the following 2 getters  GetSenderUser() and GetRecipientUser()
		 */
		FinalizeMODTransport: function (mod, context)
		{
			//SampleSetBlackAndWhiteMod(mod, context);
			//SampleAddNotification(mod, context);
		},

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeFaxTransport
		 * @description
		 * Function called before sending an invoice by fax
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 * @param {object} fax xTransport object obtained with Process.CreateProcessInstance()
		 * @param {object} context object with the following 2 getters GetSenderUser() and GetRecipientUser()
		 */
		FinalizeFaxTransport: function (fax, context) { },

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeApplicationTransport
		 * @description
		 * Function called before forwarding the document to another application
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 *
		 * @example
		 * switch (appId)
		 *	{
		 *		case "COP":
		 *			//Sales Order Processing : Handle Purchase Orders here
		 *			break;
		 *		default:
		 *			break;
		 *	}
		 * @param {object} processInstance xTransport object obtained with Process.CreateProcessInstance()
		 * @param {string} appId identifier of the application that has been instanciated
		 * @param {string} configurationId identifier of the configuration for the created instance
		 * @param {object} context object with the following 2 getters GetSenderUser() and GetRecipientUser()
		 */
		FinalizeApplicationTransport: function (processInstance, appId, configurationId, context) { },

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeSenderFormGeneration
		 * @description
		 * Called at the end of Sender Form generation script.
		 * Can be used to add custom deliveries
		 */
		FinalizeSenderFormGeneration: function () { },

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeSenderFormGenerationExpiration
		 * @description
		 * Called when the Sender Form is expiring on generation script.
		 * Can be used to add custom deliveries
		 *
		 * @example
		 *	var email = Process.CreateTransport("mail");
		 *	var emailVars = email.GetUninheritedVars();
		 *	var user = Users.GetUser(Data.GetValue("OwnerId"));
		 *	var userVars = user.GetVars();
		 *	var user_email = userVars.GetValue_String("EmailAddress", 0);
		 *	emailVars.AddValue_String("EmailAddress", user_email, true);
		 *	emailVars.AddValue_String("Subject", "Document not linked", true);
		 *	emailVars.AddValue_String("Message", "The document hasn't been linked to a master document", true);
		 *	email.Process();
		 */
		FinalizeSenderFormGenerationExpiration: function () { },


		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeSplittingGeneration
		 * @description
		 * Called at the end of Splitting generation script.
		 */
		FinalizeSplittingGeneration: function () { },

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeGroupedNotificationsTransport
		 * @description
		 * Function called before sending the grouped invoices notification email
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 * @param {object} email xTransport object obtained with Process.CreateProcessInstance()
		 * @param {object} context object with the following 2 getters GetSupplierUser() and GetCustomerUser()
		 * @param {object[]} invoices array of invoice objects to be grouped. Modifying this parameter won't impact the email transport as this user exit it's called just before transport Process(). The invoice objects have the following properties: supiMsnex, cusiMsnex, cusiRUIDEX, cusiArchiveDuration, customerID, customerDeliveryMethod, number, date, dueDate, totalAmount, currency, isSigned, sendWelcomeEMail, passwordUrl, customerEmailAddress, supplierOwnerID, files
		 */
		FinalizeGroupedNotificationsTransport: function (email, context, invoices) { },

		/**
		 * @method Lib.DD.Customization.Deliveries.FinalizeGroupedEmailsTransport
		 * @description
		 * Function called before sending the grouped invoices email with attachments
		 * This function is called just before .Process(). This way, you can still customize notifications, variables, etc of the transport given in parameter
		 * @param {object} email xTransport object obtained with Process.CreateProcessInstance()
		 * @param {object} context object with the following 2 getters GetSupplierUser() and GetCustomerUser()
		 * @param {object[]} invoices array of invoice objects to be grouped. Modifying this parameter 	won't impact the email transport as this user exit it's called just before transport Process(). The invoice objects have the following properties: supiMsnex, cusiMsnex, cusiRUIDEX, cusiArchiveDuration, customerID, customerDeliveryMethod, number, date, dueDate, totalAmount, currency, isSigned, sendWelcomeEMail, passwordUrl, customerEmailAddress, supplierOwnerID, files
		 */
		FinalizeGroupedEmailsTransport: function (email, context, invoices) { },

		/**
		 * @method Lib.DD.Customization.Deliveries.CustomizeEmailGroupingKey
		 * @description
		 * If defined, it overrides the default grouping key for email grouping.
		 *
		 * All fields that can be used into the list are fields from the "Customer Invoice (customer copy)" form.
		 * Note that you can't use external variables values to group, only form fields can be set.
		 *
		 * If the user exit is not defined, the default grouping key will be ["Customer_ID__", "Customer_email__"].
		 * The value "Customer_delivery_method__" is implicit: it will be automatically added by the processing into
		 * the list because we won't group email portal notification with emails with attachments.
		 * Technically, the field list is used in the query first, then used to determinate when a new mail has to been sent.
		 *
		 * A common case of custom grouping is using a custom field like "Additional_field_text_1__" (see first example below).
		 *
		 * Be aware of problems that can happen if you remove the "Customer_ID__" from the list, for instance if you
		 * want to group with ["Customer_email__"] only (see second example). It will result into a single email at destination
		 * of several customers with different portals. The first customer read during grouping will be used to determinate top
		 * and bottom links, customer company name, the email language and culture for numbers.
		 * Note that every table links will point the correct portal BUT if the customer is already logged in a portal, clicking
		 * and an other link will be really confusing because the customer will stay on the already connected portal.
		 *
		 * The parameter deliveryMethod will be set with SM for emails with attachments or PORTAL for portal notification.
		 * It allows you to condition in order to have different grouping key foreach delivery method.
		 *
		 * @example
		 *	CustomizeEmailGroupingKey: function(deliveryMethod)
		 *	{
		 *		// We added "Additional_field_text_1__" in the grouping key so that a same customer receive one
		 *		// email grouped by value of this additional field. We can imagine that this field contains a
		 *		// value different for each company or business unit of the same customer.
		 *		// We keep the "Customer_email__" into the key because it might be extracted from the invoice,
		 *		// so a same customer ID could receive several emails.
		 *		return ["Customer_ID__", "Customer_email__", "Additional_field_text_1__"];
		 *	}
		 * @example
		 *	CustomizeEmailGroupingKey: function(deliveryMethod)
		 *	{
		 *		// In this scenario, several customer contacts have the same email address so we want to group
		 *		// all notification into one single email. Be really careful, it brings some problems that are
		 *		// explained above in the user exit description.
		 *		return ["Customer_email__"];
		 *	}
		 * @example
		 *	CustomizeEmailGroupingKey: function(deliveryMethod)
		 *	{
		 *		// In this example we want to define different grouping key for portal notification and email
		 *		// with attachment. For portal notification we want to group like usually, but for the email
		 *		// we want to split by a business field.
		 *		if( deliveryMethod == "SM" )
		 *		{
		 *			// Group emails with attachments by customer and business field
		 *			return ["Customer_ID__", "Customer_email__", "Additional_field_text_1__"];
		 *		}
		 *		else
		 *		{
		 *			// Group portal notifications by customer
		 *			return ["Customer_ID__", "Customer_email__"];
		 *		}
		 *	}
		 * @param {string} deliveryMethod The delivery method, can be "SM" or "PORTAL", both in uppercase.
		 * @return {object} An array of "Customer Invoice (customer copy)" form fields list to group email by
		 *
		/*CustomizeEmailGroupingKey: function (deliveryMethod)
		{
			// default grouping key
			return ["Customer_ID__", "Customer_email__"];
		},*/

		/**
		 * @method Lib.DD.Customization.Deliveries.ActivateEmailGrouping
		 * @description
		 * Overrides current configuration "Portal with Email Notification" and "Email with Attachment" document grouping settings.
		 * Also overrides customer's email grouping preferences.
		 * @param {string} deliveryMethod Customer delivery method. Possible values: "NONE", "PORTAL", "SM", "EXTERNALPORTAL", "MOD", "FGFAXOUT"
		 * @param {boolean} isDocumentToGroup Indicates if the email grouping would be applied for this document if that user exit were not called
		 * @param {object} context object with the following 2 getters GetSupplierUser() and GetCustomerUser()
		 * @returns {boolean} true to group emails in a daily digest, else false to send emails immediately.
		 */
		/*ActivateEmailGrouping: function(deliveryMethod, isDocumentToGroup, context)
		{
		},*/

		/**
		 * @method Lib.DD.Customization.Deliveries.CustomizeEmailTemplateOption
		 * @description
		 * Function called when retrieving the template content before sending an email.
		 * @param {object} templateOptions TypeScript object containing template option like customTag, templateName...
		 *	{
		 *	 "templateName": "templateName",
		 * 	 "replaceTags": true,
		 * 	 "customTags": {
		 *		displayLinks: false,
		 *      realCustomerEmail: Data.GetValue("Customer_email__")
		 *      ...
		 *	 },
		 *	}
		 *  @example This user exit custom the template option to add customtag and configure the language options with addidition field value.
		 *	CustomizeEmailTemplateOption: function (templateOptions)
		 *	{
		 *	 templateOptions.customTags.customerName = Data.GetValue("Customer_name__");
		 *	 templateOptions.language = Data.GetValue("Additional_field_text_2__").toLowerCase();
		 *	}
		 */
		/*CustomizeEmailTemplateOption: function(templateOptions)
		{
		},*/
	};

	return Deliveries;
})();
