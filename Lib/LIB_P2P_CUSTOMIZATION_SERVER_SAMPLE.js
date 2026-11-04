"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending P2P scripts",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
/**
 * P2P packages script customization callbacks
 * @namespace Lib.P2P.Customization.Server
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.P2P.Customization.Server.EmailOptions
                 * @since 307
                 * @description
                 * This function can be used to override email properties before sending.
                 * It is called for PAC emails, Vendor Portal notifications (LIB_AP_VendorPortal.NotifyVendor), and Vendor Registration notifications.
                 * Implementations should branch on the template argument.
                 * @param {xTransport} email email object
                 * @param {string} template the email template name, can be used to apply customization to specific templates
                 * @returns {void}
                 * @example
                 * <caption>Override one of the email properties with a custom value by retrieving email property value and modifying it</caption>
                 * Server.EmailOptions = function(email, template)
                 * {
                 * 		//Different AddValue methods exists according to property types
                 * 		email.GetSender(true).GetVars().AddValue_String("FromName", "MyFromName", true);
                 * 		//Add an attachment to a specific email template
                 * 		const subject = email.GetVars(false).GetValue_String("Subject", 0);
                 * 		if (subject === Language.Translate("_My subject translation key"))
                 * 		{
                 * 			const name = "TermsAndConditions.pdf";
                 * 			// Get a file from shared files
                 * 			const file = Process.GetResourceFile("%Misc%\\"+name);
                 * 			if(file)
                 * 			{
                 * 				Sys.EmailNotification.AddAttach(email, file, name);
                 * 			}
                 * 		}
                 * 		if (template === "Purchasing_Email_NotifOCApprover_XX.htm")
                 * 		{
                 * 			email.GetVars(false).AddValue_String("Subject", "Custom subject for approver notification", true);
                 * 		}
                 * };
                 */
                Server.EmailOptions = function (email, template) {
                };
                /**
                 * @method Lib.P2P.Customization.Server.IsReminderEmailNotificationActivatedForUser
                 * @description
                 * Allows you to determine whether the email notification should be sent to the user or not.
                 * This user exit is called
                 * - in some processing scripts, e.g. when a document is submitted for review or approval.
                 * - in Lib.P2P.EmailNotification.SendReminders, used by some scheduled tasks.
                 * Be specific enough to avoid impacts on notifications out of scope.
                 * @since 327
                 * @param {string} template The email template to be sent.
                 * @param {string} userLogin The notification recipient.
                 * @returns {boolean} true if the email notification should be sent to the user, false otherwise
                 * @example <caption>Preventing some notifications for a template, group, user</caption>
                 * IsReminderEmailNotificationActivatedForUser: function (template, userLogin)
                 * {
                 * 		// Preventing reviewer notifications
                 * 		if (template.includes("Purchasing_Email_NotifOCReviewer_XX"))
                 * 		{
                 * 			return false;
                 * 		}
                 * 		// Preventing notifications to be sent to Buyers group
                 * 		const user = Users.GetUser(userLogin);
                 * 		if (user.IsMemberOf("buyersprocess.pac@esker.com"))
                 * 		{
                 * 			return false;
                 * 		}
                 * 		// Preventing notifications to be sent to the CEO
                 * 		if (userLogin === "ceoprocess.pac@esker.com")
                 * 		{
                 * 			return false;
                 * 		}
                 * 		return true;
                 * }
                 */
                Server.IsReminderEmailNotificationActivatedForUser = (template, userLogin) => {
                    return true;
                };
                /**
                 * @method Lib.P2P.Customization.Server.OnSendReminderNotification
                 * @description
                 * Allows you to modify the email notifications sent as a reminder.
                 * This user exit is called before sending the notification.
                 * You can choose to not send the notification by returning false for some notification.
                 * @since 340
                 * @param { Sys.EmailNotification.SendEmailNotificationWithUserIdOptions } emailOptions
                 * @returns { boolean } false to indicate that the notification should not be sent or true to indicate that the notification should be sent.
                 * @example <caption>This example sets the sender name.</caption>
                 * OnSendEmailNotification: function (emailOptions)
                 * {
                 *	 emailOptions.fromName = "My From Name";
                 *	 return true;
                 * }
                 */
                Server.OnSendReminderNotification = function (emailOptions) {
                };
                /**
                 * Specifics customization SAP Connected
                 * @namespace Lib.P2P.Customization.Server.SAP
                 */
                Server.SAP = {
                    /**
                     * @method Lib.P2P.Customization.Server.SAP.ComputeTotalsForGR
                     * @since 334
                     * @description
                     * This user exit allows to override the standard ComputeTotalsForGR method in charge of computing total amounts and quantities for the goods reception (Amounts are expressed in the refCurrency specified in the options).
                     * If the user exit returns a Lib.AP.SAP.PurchaseOrder.TotalsForGR object then the standard ComputeTotalsForGR is skipped and the custom object is used instead.
                     * The client side asynchronous version of the user exit should also be implemented in Lib.P2P.Customization.Client.SAP.ComputeTotalsForGR.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory} purchaseItemHistory the current historic dealt with
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory[]} purchaseItemHistorics all retrieved historics for the current PO Item
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} poItem the internal structure describing the PO Item
                     * @param {Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGROptions} options options mainly for exchange rate computation
                     * @return {Lib.AP.SAP.PurchaseOrder.TotalsForGR} the totals structure or null to apply the standard method
                     * @example <caption>Same as function ComputeTotalsForGR, except that purchaseItemHistoryKey and historyKey do not contain SERIAL_NO for Transport orders</caption>
                     * SAP.ComputeTotalsForGR: function (purchaseItemHistory, purchaseItemHistorics, poItem, options)
                     * {
                     * const totals = {
                     * 		totalInvoicedAmount: 0,
                     * 		totalInvoicedQty: 0,
                     * 		totalDeliveredAmount: 0,
                     * 		totalDeliveredQty: 0,
                     * 		reverse: false
                     * 	};
                     * 	let purchaseItemHistoryKey = purchaseItemHistory.PO_ITEM + purchaseItemHistory.REF_DOC +
                     * 		purchaseItemHistory.REF_DOC_IT + purchaseItemHistory.REF_DOC_YR;
                     * 	for (let idx = 0; idx < purchaseItemHistorics.length; idx++)
                     * 	{
                     * 		let aPoItemHistory = purchaseItemHistorics[idx];
                     * 		let historyKey = void 0;
                     * 		if (purchaseItemHistory.SERIAL_NO === "00")
                     * 		{
                     * 			historyKey = aPoItemHistory.PO_ITEM + "00" + aPoItemHistory.REF_DOC + aPoItemHistory.REF_DOC_IT + aPoItemHistory.REF_DOC_YR;
                     * 		} else
                     * 		{
                     * 			historyKey = aPoItemHistory.PO_ITEM + aPoItemHistory.REF_DOC + aPoItemHistory.REF_DOC_IT + aPoItemHistory.REF_DOC_YR;
                     * 		}
                     * 		if (purchaseItemHistoryKey === historyKey)
                     * 		{
                     * 			totals.reverse = aPoItemHistory.HIST_TYPE === "E" && aPoItemHistory.DB_CR_IND === "H";
                     * 			if (aPoItemHistory.PROCESS_ID === "1")
                     * 			{
                     * 				Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfGoodsReceipt(totals, aPoItemHistory, poItem, options);
                     * 			}
                     * 			else if (aPoItemHistory.PROCESS_ID === "2")
                     * 			{
                     * 				Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfInvoicesReceipt(totals, aPoItemHistory, options);
                     * 			}
                     * 		}
                     * 	}
                     * 	return totals;
                     * }
                     */
                    ComputeTotalsForGR: function (purchaseItemHistory, purchaseItemHistorics, poItem, options) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.SAP.InitializeSAPProxy
                     * @since 303
                     * @description
                     * This function can be used for specific setup of the SAPProxy.
                     * @param {ISAPControl} sapControl SAP controller
                     * @param {ISAPBapiManager} bapiMgr SAP Bapi Manager
                     * @returns {void}
                     * @example
                     * <caption>Use EOD User ERP Credentials only for specific BAPI Calls</caption>
                     * SAP.InitializeSAPProxy = function(sapControl, bapiMgr)
                     * {
                     * 	// using the UseUserCredentialsForBAPIs API will force other calls to use the SAP Connector configuration credentials
                     * 	bapiMgr.UseUserCredentialsForBAPIs("BAPI_ACC_DOCUMENT_POST,BAPI_INCOMINGINVOICE_CREATE,BAPI_PO_CREATE1,BAPI_PO_CHANGE,BAPI_GOODSMVT_CREATE,BAPI_GOODSMVT_CANCEL");
                     * };
                     */
                    InitializeSAPProxy: function (sapControl, bapiMgr) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.SAP.OnCustomizeBAPIPOGETDETAILMaxItems
                     * @since 342
                     * @description
                     * User exit to customize the maximum number of items per Purchase Order during BAPI_PO_GETDETAIL processing.
                     * @param {number} defaultMaxItems The default maximum number of items per Purchase Order.
                     * @returns {number | void} - Modify params.maxItemsCountPerPO directly
                     *
                     * @example
                     * SAP.OnCustomizeBAPIPOGETDETAILMaxItems = function(defaultMaxItems)
                     * {
                     *   return 600;
                     * }
                     */
                    OnCustomizeBAPIPOGETDETAILMaxItems: function (defaultMaxItems) {
                    }
                };
                /**
                 * Specifics customization for conversation options
                 * @namespace Lib.P2P.Customization.Server.Conversation.Options
                 */
                let Conversation;
                (function (Conversation) {
                    let Options;
                    (function (Options) {
                        /**
                         * @method Lib.P2P.Customization.Server.Conversation.Options.GetDefault
                         * @since 313
                         * @description Allows you to customize options for external conversations.
                         *
                         * @param {IConversationAPI_Option} options The default options for the conversation.
                         * @param {"IsSupplier"|"IsCustomer"} senderType The type of the sender
                         * @returns {IConversationAPI_Option} The customized options for the conversation.
                         * @example
                         * Options.GetDefault = function (options, senderType) {
                         * 	if (senderType === Lib.Purchasing.SenderType.IsSupplier)
                         * 	{
                         * 		options.fromEmailAddress = "suppliernotification@eskerondemand.com";
                         * 	}
                         * 	else if(senderType === Lib.Purchasing.SenderType.IsCustomer)
                         * 	{
                         * 		options.fromEmailAddress = "customernotification@gmail.com";
                         * 	}
                         * 	return options;
                         * };
                         */
                        Options.GetDefault = function (options, senderType) {
                            return options;
                        };
                    })(Options = Conversation.Options || (Conversation.Options = {}));
                })(Conversation = Server.Conversation || (Server.Conversation = {}));
                /**
                 * Specifics customization when updating the purchase order master data after posting an invoice
                 * @namespace Lib.P2P.Customization.Server.TablesUpdater
                 */
                Server.TablesUpdater = {
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.UpdateItemsTables
                     * @since 316
                     * @description
                     * This function can be used to customize the update of the items table.
                     * Standard processing is skipped when this function returns a truthy value.
                     * Return nothing (or a falsy value) to continue standard processing.
                     * Note: if the invoice can also be reversed outside the Vendor Invoice process, consider implementing
                     * {@link Lib.P2P.Customization.Server.TablesUpdater.UpdateItemsTablesOutsideVIP} as well.
                     * @param {Item} lineItem This is the table item that is being processed.
                     * @param {boolean} [bRevert] Indicates whether the invoice is being reversed.
                     * @returns {void} Return nothing to continue standard processing; return a truthy value to skip it.
                     * @example <caption>Update SAP purchase order items instead of running the standard processing</caption>
                     * TablesUpdater.UpdateItemsTables = function(lineItem, bRevert)
                     * {
                     *		if (Variable.GetValueAsString("Configuration") === "SAP")
                     *		{
                     * 			var orderNumber = lineItem.GetValue("OrderNumber__");
                     * 			var itemNumber = lineItem.GetValue("ItemNumber__");
                     * 			var amount = lineItem.GetValue("Amount__") * (bRevert ? -1 : 1);
                     * 			var modifyFilter = "(OrderNumber__=" + orderNumber + ")(ItemNumber__=" + itemNumber + ")";
                     * 			var itemFieldsToUpdate = [{ name: "InvoicedAmount__", value: amount, behavior: "incrementNumber" }];
                     * 			Sys.Helpers.Database.ModifyTableRecord("AP - Purchase order - Items__", modifyFilter, itemFieldsToUpdate);
                     * 			return true;
                     *		}
                     * };
                     */
                    UpdateItemsTables: function (lineItem, bRevert) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.UpdateItemsTablesOutsideVIP
                     * @since 361
                     * @description
                     * This function can be used to customize the update of the items table when reversing an invoice outside the Vendor Invoice process.
                     * Standard processing is skipped when this function returns a truthy value.
                     * Return nothing (or a falsy value) to continue standard processing.
                     * Note: if the invoice can also be reversed from within the Vendor Invoice process, consider implementing
                     * {@link Lib.P2P.Customization.Server.TablesUpdater.UpdateItemsTables} as well.
                     * @param {Sys.Helpers.CDL.CDLRecord} lineItem This is the CDL line record that is being processed.
                     * @param {boolean} [bRevert] Indicates whether the invoice is being reversed.
                     * @returns {void} Return nothing to continue standard processing; return a truthy value to skip it.
                     * @example <caption>Update SAP purchase order items instead of running the standard processing</caption>
                     * TablesUpdater.UpdateItemsTablesOutsideVIP = function(lineItem, bRevert)
                     * {
                     *		if (Variable.GetValueAsString("Configuration") === "SAP")
                     *		{
                     * 			var orderNumber = lineItem.Line_OrderNumber__;
                     * 			var itemNumber = lineItem.Line_ItemNumber__;
                     * 			var amount = Number(lineItem.Line_Amount__) * (bRevert ? -1 : 1);
                     * 			var modifyFilter = "(OrderNumber__=" + orderNumber + ")(ItemNumber__=" + itemNumber + ")";
                     * 			var itemFieldsToUpdate = [{ name: "InvoicedAmount__", value: amount, behavior: "incrementNumber" }];
                     * 			Sys.Helpers.Database.ModifyTableRecord("AP - Purchase order - Items__", modifyFilter, itemFieldsToUpdate);
                     * 			return true;
                     *		}
                     * };
                     */
                    UpdateItemsTablesOutsideVIP: function (lineItem, bRevert) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.CustomizeVIPCDLLinesParameters
                     * @since 341
                     * @description
                     * Allows to customize the parameters used to get invoice CDL lines records.
                     * @param {ESKMap<string | Array<string>>} parameters - The map of parameters to be customized with tableName and fields properties.
                     * @returns {ESKMap<string | Array<string>>} The customized parameters. If nothing is returned, the default parameters are used.
                     * @example <caption>Customize tableName and fields parameters</caption>
                     * TablesUpdater.CustomizeVIPCDLLinesParameters = function(parameters)
                     * {
                     *		parameters.tableName = "Z_LineItems__";
                     *		parameters.fields.push("Z_CustomField__");
                     *		return parameters;
                     * };
                     */
                    CustomizeVIPCDLLinesParameters: function (parameters) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.CustomizeAddToHeaders
                     * @since 340
                     * @description
                     *
                     *
                     * This user exit allows to customize the addition of fields to update in the headers array when updating the purchase order master data after posting an invoice.
                     * @param {string} orderNumber the purchase order number
                     * @param {number} invoicedAmount the invoiced amount to add to the InvoicedAmount__ field
                     * @param {any[]} headers the current list of headers to update
                     * @param {any} headerInfos an potential header to add to the headers array
                     * @param {boolean} shouldAddHeaderInfos indicates whether the headerInfos will be added to the headers array or not (false if another header with the same orderNumber is already present in the headers array)
                     * @param {number} lineNumber the line number of the invoice line item being processed in the LineItems__ table
                     * @return {void}
                     * @example
                     * <caption>Add the vendor number in the headers array</caption>
                     * CustomizeAddToHeaders: function (orderNumber, invoicedAmount, headers, headerInfos, shouldAddHeaderInfos, lineNumber)
                     * {
                     * 		var item = Data.GetTable("LineItems__").GetItem(lineNumber);
                     *		var vendorNumber = item.GetValue("VendorNumber__");
                    *		if(shouldAddHeaderInfos)
                    *		{
                    *			headerInfos.vendorNumber = vendorNumber;
                    *		}
                    *		else
                    *		{
                    *			for(var i = 0; i < headers.length; i++)
                    *			{
                    *				if(headers[i].OrderNumber__ === orderNumber)
                    *				{
                    *					headers[i].VendorNumber__ = vendorNumber;
                    *				}
                    *			}
                    *		}
                    * }
                    */
                    CustomizeAddToHeaders: function (orderNumber, invoicedAmount, headers, headerInfos, shouldAddHeaderInfos, lineNumber) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.CustomizeUpdatePOHeadersTableFilter
                     * @since 340
                     * @description
                     *
                     * 	This user exit allows to customize the filter used to update the purchase order headers table when updating the purchase order master data after posting an invoice.
                     * @param {string} companyCode the company code of the purchase order
                     * @param {any} header the current header to update
                     * @param {string} originalFilter the current filter used to update the purchase order headers table
                     * @return {string} the customized filter to use to update the purchase order headers table
                     * @example
                     * <caption>Add the vendor number in the filter</caption>
                     * CustomizeUpdatePOHeadersTableFilter: function (companyCode, header, originalFilter)
                     * {
                     * 		if(header.vendorNumber)
                     *		{
                    *			originalFilter += "(VendorNumber__=" + header.vendorNumber + ")";
                    *		}
                    *		return originalFilter;
                    * }
                    */
                    CustomizeUpdatePOHeadersTableFilter: function (companyCode, header, originalFilter) {
                        return null;
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.CustomizeUpdatePOItemTableFilter
                     * @since 340
                     * @description
                     *
                     * 	This user exit allows to customize the filter used to update the purchase order items table when updating the purchase order master data after posting an invoice.
                     * @param {string} companyCode the company code of the purchase order
                     * @param {string} orderNumber the purchase order number
                     * @param {string} itemNumber the item number of the purchase order item to update
                     * @param {string} originalFilter the current filter used to update the purchase order items table
                     * @param {number} lineNumber the line number of the invoice line item being processed in the LineItems__ table
                     * @return {string} the customized filter to use to update the purchase order items table
                     * @example
                     * <caption>Add the vendor number in the filter</caption>
                     * CustomizeUpdatePOItemTableFilter: function (companyCode, orderNumber, itemNumber, originalFilter, lineNumber)
                     * {
                     * 		var item = Data.GetTable("LineItems__").GetItem(lineNumber);
                     *		var vendorNumber = item.GetValue("VendorNumber__");
                    *		if(vendorNumber)
                    *		{
                    *			originalFilter += "(VendorNumber__=" + vendorNumber + ")";
                    *		}
                    *		return originalFilter;
                    * }
                    */
                    CustomizeUpdatePOItemTableFilter: function (companyCode, orderNumber, itemNumber, originalFilter, lineNumber) {
                        return null;
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.CustomizeUpdatePOItemFieldsToUpdate
                     * @since 366
                     * @description
                     *
                     * 	This user exit allows to customize the list of fields to update in the purchase order items table when updating the purchase order master data after posting an invoice.
                     * @param {string} companyCode the company code of the purchase order
                     * @param {string} orderNumber the purchase order number
                     * @param {string} itemNumber the item number of the purchase order item to update
                     * @param {any[]} itemFieldsToUpdate the current list of fields to update in the purchase order items table
                     * @param {number} lineNumber the line number of the invoice line item being processed in the LineItems__ table
                     * @return {void}
                     * @example
                     * <caption>Do not overwrite the vendor number when the invoiced line already has one</caption>
                     * CustomizeUpdatePOItemFieldsToUpdate: function (companyCode, orderNumber, itemNumber, itemFieldsToUpdate, lineNumber)
                     * {
                     * 		var lineItems = Data.GetTable("LineItems__");
                     * 		var item = lineItems && lineNumber != null ? lineItems.GetItem(lineNumber) : null;
                     *		var vendorNumber = item ? item.GetValue("VendorNumber__") : "";
                    *		if(!Sys.Helpers.IsEmpty(vendorNumber))
                    *		{
                    *			for(var i = itemFieldsToUpdate.length - 1; i >= 0; i--)
                    *			{
                    *				if(itemFieldsToUpdate[i].name === "VendorNumber__")
                    *				{
                    *					itemFieldsToUpdate.splice(i, 1);
                    *				}
                    *			}
                    *		}
                    * }
                    */
                    CustomizeUpdatePOItemFieldsToUpdate: function (companyCode, orderNumber, itemNumber, itemFieldsToUpdate, lineNumber) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.TablesUpdater.CustomizeUpdateGRItemTableFilter
                     * @since 359
                     * @description
                     *
                     * 	This user exit allows to customize the filter used to update the goods receipt items table after posting an invoice.
                     * @param {string} companyCode the company code
                     * @param {string} orderNumber the purchase order number
                     * @param {string} itemNumber the item number of the GR item to update
                     * @param {string} originalFilter the current filter used to update the GR items table
                     * @param {string} GRNumber the goods receipt number
                     * @return {string} the customized filter to use to update the GR items table
                     * @example <caption>Add a custom key in the filter</caption>
                     * CustomizeUpdateGRItemTableFilter: function (companyCode, orderNumber, itemNumber, originalFilter, GRNumber)
                     * {
                     * 		originalFilter += "(CustomKey__=" + customValue + ")";
                     * 		return originalFilter;
                     * }
                     */
                    CustomizeUpdateGRItemTableFilter: function (companyCode, orderNumber, itemNumber, originalFilter, GRNumber) {
                        return null;
                    }
                };
                /**
                 * Specifics customization when processing an ERP Ack
                 * @namespace Lib.P2P.Customization.Server.ERPAckProcessing
                 */
                Server.ERPAckProcessing = {
                    /**
                     * @method Lib.P2P.Customization.Server.ERPAckProcessing.ExtractDataFromERPAck
                     * @since 330
                     * @description
                     * This function can be used to extract custom data from ERPAcks.
                     * Called from the extraction script of the Update invoice with ERP ID process.
                     * @param {XML.IXMLDOMElement} xmlDoc The XML DOM element of the ERP Ack received
                     * @returns {void}
                     * @example <caption>Extract the due date provided by the ERP after invoice post</caption>
                     * ExtractDataFromERPAck: function(xmlDoc)
                     * {
                     * 	// Extract the due date from the ERPAck
                     * 	var customPaymentDueDate = xmlDoc.selectSingleNode("/ERPAck/Z_PaymentDueDate");
                     * 	Data.SetValue("Z_PaymentDueDate__", customPaymentDueDate ? customPaymentDueDate.text: "");
                     * };
                     */
                    ExtractDataFromERPAck: function (xmlDoc) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.ERPAckProcessing.UpdateProcessVars
                     * @since 330
                     * @description
                     * This function can be used to update extra variables on the process when receiving an ERPAck.
                     * Called from the validation script of the Update invoice with ERP ID process.
                     * @param {string} processName The name of the process representing the type of ERPAck (can be one of "Vendor Registration", "Vendor Invoice", "Detailed Accrual Report Launcher", "Purchase Order V2", "Goods receipt V2")
                     * @param {xVars} vars The attributes list of the process to update
                     * @param {xVars} externalVars The external variables of the process to update
                     * @returns {void}
                     * @example <caption>Update the due date of the vendor invoice with the one retrieved from the ERP on post</caption>
                     * UpdateProcessVars: function(processName, vars, externalVars)
                     * {
                     * 	if (processName === "Vendor Invoice")
                     * 	{
                     * 		// Update the due date of the vendor invoice with the one retrieved from the ERP on post
                     * 		vars.AddValue_String("DueDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("Z_PaymentDueDate__")), true);
                     * 	}
                     * };
                     */
                    UpdateProcessVars: function (processName, vars, externalVars) {
                    }
                };
                /**
                 * Specifics customization related to parameters (AP - Parameters__, AP - Last used values__ and AP - Templates__)
                 * @namespace Lib.P2P.Customization.Server.Parameters
                 */
                Server.Parameters = {
                    /**
                     * @typedef {object} Lib.P2P.Customization.Server.Parameters.FieldMapping
                     * @property {string} name - name of the fields to save
                     * @property {string} value - value of the fields to save
                     */
                    /**
                     * @method Lib.P2P.Customization.Server.Parameters.ShouldSaveTemplateForGLInvoice
                     * @since 366
                     * @description
                     * This function is called for GL (Non-PO) and down payment invoices before any existing record of AP - Last used values__ or AP - Templates__ is deleted or saved.
                     * Return false to skip the save: the existing records of the table are kept unchanged.
                     * The MRU written in AP - Last used values__ for PO invoices is not impacted by this user exit.
                     * @param {string} tableName The name of the table about to be updated. Can be AP - Last used values__ or AP - Templates__
                     * @returns {boolean | void} false to skip the save, true or nothing to keep the standard behavior
                     * @example <caption>Do not update the last used values when a line uses an alternative coding method (project or distribution set)</caption>
                     * ShouldSaveTemplateForGLInvoice: function (tableName)
                     * {
                     * 	if (tableName !== "AP - Last used values__")
                     * 	{
                     * 		return;
                     * 	}
                     * 	var lineItems = Data.GetTable("LineItems__");
                     * 	for (var i = 0; i < lineItems.GetItemCount(); i++)
                     * 	{
                     * 		var item = lineItems.GetItem(i);
                     * 		if (item.GetValue("Z_ProjectNumber__") || item.GetValue("Z_DistributionSet_ID__"))
                     * 		{
                     * 			return false;
                     * 		}
                     * 	}
                     * };
                     */
                    ShouldSaveTemplateForGLInvoice: function (tableName) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.Parameters.OnBeforeSave
                     * @since 339
                     * @description
                     * This function can be used to customize the fields saved when saving parameters in AP - Parameters__, AP - Last used values__ or AP - Templates__
                     * @param {string} tableName The name of updated table. Can be AP - Parameters__, AP - Last used values__ or AP - Templates__
                     * @param {Sys.Helpers.LdapUtil.IFilter} filter The filter used to identify the record to update or create
                     * @param {Lib.P2P.Customization.Server.Parameters.FieldMapping[]} fields The list of fields to save
                     * @returns {void}
                     * @example <caption>Add a new field to save in the parameters</caption>
                     * OnBeforeSave: function(tableName, filter, fields)
                     * {
                     * 	if (tableName === "AP - Parameters__")
                     * 	{
                     * 		fields.push({ name: "Z_Region__", value: Data.GetValue("Z_Region__") });
                     * 	}
                     * };
                     */
                    OnBeforeSave: function (tableName, fields) {
                        // Custom logic before saving parameters
                    },
                    /**
                     * @method Lib.P2P.Customization.Server.Parameters.SetFilter
                     * @since 339
                     * @description
                     * This function can be used to customize the filter used when saving or deleting parameters in AP - Parameters__, AP - Last used values__ or AP - Templates__
                     * @param {string} tableName The name of updated table. Can be AP - Parameters__, AP - Last used values__ or AP - Templates__
                     * @param {Sys.Helpers.LdapUtil.IFilter} filter The filter used to identify the record to update or create
                     * @returns {Sys.Helpers.LdapUtil.IFilter} the updated filter
                     * @example <caption>Use Z_Region as a criteria</caption>
                     * SetFilter: function(tableName, filter)
                     * {
                     * 	if (tableName === "AP - Parameters__")
                     * 	{
                     * 		return Sys.Helpers.LdapUtil.FilterAnd(filter, Sys.Helpers.LdapUtil.FilterEqual("Z_Region", Data.GetValue("Z_Region__")));
                     * 	}
                     * };
                     */
                    SetFilter: function (tableName, filter) {
                        // Customize the filter
                    }
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_SERVER_SAMPLE.js.map