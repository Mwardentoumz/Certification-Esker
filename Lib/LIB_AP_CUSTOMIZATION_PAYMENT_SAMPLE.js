"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_PAYMENT_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "AP payment customization",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP payment customization.
 * Used in the 'Vendor invoice payment' and 'Vendor Invoice Payment (SAP)' processes and 'Vendor Invoice Payment Split'
 * @namespace Lib.AP.Customization.Payment
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var Payment;
            (function (Payment) {
                /**
                 * PaymentMethods
                 * @typedef {Object.<string, string> | Object.<string, Object.<string, string>>} Lib.AP.Customization.Payment.PaymentMethods
                 */
                /**
                 * PaymentMethodsByCompanyCode
                 * @typedef {Object.<string, PaymentMethods>} Lib.AP.Customization.Payment.PaymentMethodsByCompanyCode
                 */
                /**
                 * @method Lib.AP.Customization.Payment.GetPaymentMethodMapping
                 * @description
                 * Use this function to specify the mapping between the ERP payment method and the possible values of the invoice payment method control.
                 * Values are case sensitive and have to match the possible values of the Payment Method combo boxes of the Vendor invoice and
                 * Customer invoice processes. By default the possible values are "Cash", "Check", "Credit card", "EFT" and "Other". You can customize and
                 * add your own in the processes (additional values will be kept on update).
                 * If an ERP code is not found in the mapping, the invoice payment method will be set to "Other".
                 * @param {string} ERPName Name of the ERP.
                 * @param {PaymentMethods | PaymentMethodsByCompanyCode} paymentMethodMap Default payment method mapping for ERP <ERPName>.
                 * @returns {PaymentMethods | PaymentMethodsByCompanyCode} The modified paymentMethodMap
                 * @example
                 * <pre><code>
                 * GetPaymentMethodMapping: function (ERPName, paymentMethodMap)
                 * {
                 *	if (ERPName === "SAP")
                 *	{
                 *		// Override the default mapping
                 *		paymentMethodMap = {
                 *			// All company codes section
                 *			"*": {
                 *				"C": "Check",
                 *				"O": "Check",
                 *				"S": "Check",
                 *				"1": "Credit card",
                 *				"4": "Credit card",
                 *				"Y": "EFT"
                 *			},
                 *			// Company code specific mapping (overrides the * section)
                 *			"2200": {
                 *				"1": "Other"
                 *			}
                 *		};
                 *	}
                 *	return paymentMethodMap;
                 * }
                 * </code></pre>
                 */
                Payment.GetPaymentMethodMapping = function (ERPName, paymentMethodMap) {
                };
                /**
                 * @method Lib.AP.Customization.Payment.CustomizeNbLinesSplit
                 * @description
                 * Use this function to override number of lines used to split the csv file provided in the process Vendor Invoice payment split
                 * The value returned must be a number between 1000 and 100 000.
                 * If the split is under 1000 lines, the split may be too small and may overload the EOD plateform
                 * If the number of lines is above 100000 the csv is too big and will not be fully read
                 * @return {number} number of lines
                 * @example
                 * <pre><code>
                 * CustomizeNbLinesSplit: function()
                 * {
                 * 		// In this example we split the csv according to the number of configurations
                 * 		var query = Process.CreateQueryAsProcessAdmin();
                 * 		query.SetSpecificTable("AP - Application Settings__");
                 * 		var nbConfs = query.GetRecordCount();
                 *
                 *		var magicNumberToSplit = (101 - nbConfs) * 1000;
                 *		magicNumberToSplit = Math.max(Math.min(magicNumberToSplit, 100000), 1000);
                 *
                 * 	 	return magicNumberToSplit;
                 * }
                 * </code></pre>
                 */
                Payment.CustomizeNbLinesSplit = function () {
                };
                /**
                 * @method Lib.AP.Customization.Payment.OnSAPUpdateInvoicePayment
                 * @description
                 * This user exit is called in the 'Vendor Invoice Payment (SAP)' process.
                 * It can be used to customize the behavior of invoice update during payment step.
                 * @param {string} SAPConfiguration the name of the configuration initialized, based on the company code in the CSV file.
                 * @param {Lib.ERP.SAP.InvoicePayment} invoicePaymentsDocument INVOICE_PAYMENTS document object returned by the ERP manager.
                 *  * @example
                 * <pre><code>
                 * OnSAPUpdateInvoicePayment: function(SAPConfiguration, invoicePaymentsDocument)
                 * {
                 * 		Lib.AP.UpdatePaymentDetails.updateVIPPayment = Sys.Helpers.Wrap(Lib.AP.UpdatePaymentDetails.updateVIPPayment, function (originalFn, transport, vars, PaymentDetails, paymentMethod, curUser) {
                 *      	// Wrap updateVIPPayment to clear ERP errors after payment.
                 *          var externalVars = transport.GetExternalVars();
                 *          vars.AddValue_String("ERPPostingError__", "", true);
                 *          externalVars.AddValue_String("CommonDialog_NextAlert", "", true);
                 *          originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                 *     });
                 * }
                 * </code></pre>
                 */
                Payment.OnSAPUpdateInvoicePayment = function (SAPConfiguration, invoicePaymentsDocument) {
                };
                /**
                 * @method Lib.AP.Customization.Payment.OnSAPCompletePaymentInformation
                 * @description
                 * This user exit is called in the 'Vendor Invoice Payment (SAP)' process.
                 * It can be used to customize or complete payment information after request to the SAP payment table.
                 * @param {ISAP.ReadSAPTableRecord<any>} sapItem the result of the SAP Query
                 * @example
                 * <pre><code>
                 * OnSAPCompletePaymentInformation: function(sapItem)
                 * {
                 * 		// If not check and no payment reference, use the Document number of clearing document
                 * 		if (!Sys.Helpers.String.SAP.Trim(sapItem.KIDNO) && this.GetPaymentMethodFromERPCode(sapItem.ZLSCH, sapItem.BUKRS) !== "Check")
                 * 		{
                 * 			sapItem.KIDNO = sapItem.AUGBL;
                 * 		}
                 * </code></pre>
                 */
                Payment.OnSAPCompletePaymentInformation = function (sapItem) {
                    return sapItem;
                };
                /**
                 * @method Lib.AP.Customization.Payment.ShouldUpdatePaidInvoices
                 * @since 333
                 * @description
                 * This user exit is called in the 'Vendor invoice payment' process.
                 * It can be used to allow paid invoices to have their payment process run again, to update payment details.
                 * @example
                 * <caption> To allow paid invoices to be updated based on Z_AllowUpdatingPaidInvoices variable </caption>
                 * ShouldUpdatePaidInvoices: function()
                 * {
                 * 		return Variable.GetValueAsString("Z_AllowUpdatingPaidInvoices") === "1";
                 * }
                 */
                Payment.ShouldUpdatePaidInvoices = function () {
                };
                let ReadSAPTable;
                (function (ReadSAPTable) {
                    /**
                     * @method Lib.AP.Customization.Payment.ReadSAPTable.GetPayments
                     * @since 332
                     * @description
                     * Allows you to modify all the parameters used in the ReadSAPTable for the SAP payments.
                     * @param {ReadSAPTableParameters<T>} params An object containing all parameters:
                     * 	 - {object} rfcReadTableBapi The RFC_READ_TABLE bapi object. Not required in webservice
                     *   - {string} table The SAP table to query
                     * 	 - {string} fields The list of fields to fetch (separated by |)
                     * 	 - {string} filter The filter for the query (max 70 characters per \n separeted lines)
                     * 	 - {int} rowCount The number of rows to fetch
                     * 	 - {int} rowSkip The number of rows to skip
                     * 	 - {boolean} noData If true, no data will be fetched
                     * 	 - {object} jsonOptions Options for the query ({ useCache: true } will use the SAPProxy cache for this query)
                     * @returns {void | ReadSAPTableParameters<T>} The modified parameters to use for the SAP read table.
                     * @example <caption>In this example, we change the filter to filter out special G/L transaction type.</caption>
                     * ReadSAPTable.GetPayments: function (params)
                     * {
                     *  	params.filter += Sys.Helpers.SAP.GetQuerySeparator() + "AND UMSKZ <> 'M'";
                     * 		return params;
                     * }
                     */
                    ReadSAPTable.GetPayments = function (params) {
                    };
                    /**
                     * @method Lib.AP.Customization.Payment.ReadSAPTable.GetReversedInvoicesFI
                     * @since 332
                     * @description
                     * Allows you to modify all the parameters used in the ReadSAPTable to retrieve the SAP reversed FI invoices.
                     * @param {ReadSAPTableParameters<T>} params An object containing all parameters:
                     * 	 - {object} rfcReadTableBapi The RFC_READ_TABLE bapi object. Not required in webservice
                     *   - {string} table The SAP table to query
                     * 	 - {string} fields The list of fields to fetch (separated by |)
                     * 	 - {string} filter The filter for the query (max 70 characters per \n separeted lines)
                     * 	 - {int} rowCount The number of rows to fetch
                     * 	 - {int} rowSkip The number of rows to skip
                     * 	 - {boolean} noData If true, no data will be fetched
                     * 	 - {object} jsonOptions Options for the query ({ useCache: true } will use the SAPProxy cache for this query)
                     * @returns {void | ReadSAPTableParameters<T>} The modified parameters to use for the SAP read table.
                     * @example <caption>In this example, we add a custom field to the fields and modify the filter to use this custom attribute.</caption>
                     * ReadSAPTable.GetReversedInvoicesFI: function (params)
                     * {
                     * 		params.fields. += "|Z_CUSTOMFIELDS__";
                     * 		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + "AND Z_CUSTOMFIELDS__ = '0001'";
                     * 		return params;
                     * }
                     */
                    ReadSAPTable.GetReversedInvoicesFI = function (params) {
                    };
                    /**
                     * @method Lib.AP.Customization.Payment.ReadSAPTable.GetReversedInvoicesMM
                     * @since 332
                     * @description
                     * Allows you to modify all the parameters used in the SAPQuery to retrieve the SAP reversed MM invoices.
                     * @param {ReadSAPTableParameters<T>} params An object containing all parameters:
                     * 	 - {object} rfcReadTableBapi The RFC_READ_TABLE bapi object. Not required in webservice
                     *   - {string} table The SAP table to query
                     * 	 - {string} fields The list of fields to fetch (separated by |)
                     * 	 - {string} filter The filter for the query (max 70 characters per \n separeted lines)
                     * 	 - {int} rowCount The number of rows to fetch
                     * 	 - {int} rowSkip The number of rows to skip
                     * 	 - {boolean} noData If true, no data will be fetched
                     * 	 - {object} jsonOptions Options for the query ({ useCache: true } will use the SAPProxy cache for this query)
                     * @returns {void | ReadSAPTableParameters<T>} The modified parameters to use for the SAP read table.
                     * @example <caption>In this example, we add a custom field to the fields and modify the filter to use this custom attribute</caption>
                     * ReadSAPTable.GetReversedInvoicesMM: function (params)
                     * {
                     * 		params.fields += "|Z_CUSTOMFIELDS__";
                     * 		params.filter += Sys.Helpers.SAP.GetQuerySeparator() + "AND Z_CUSTOMFIELDS__ = '0001'";
                     * 		return params;
                     * }
                     */
                    ReadSAPTable.GetReversedInvoicesMM = function (params) {
                    };
                })(ReadSAPTable = Payment.ReadSAPTable || (Payment.ReadSAPTable = {}));
                ;
                /**
                 * @method Lib.AP.Customization.Payment.CustomizePaymentFields
                 * @description
                 * This user exit is called in the 'Vendor Invoice Payment' process.
                 * It can be used to reference custom fields in the invoice payment process (eg ERP invoice number).
                 * @param {Sys.Helpers.CSVReader.CSVReader2} csvReader The csv reader containing the CSV with all payment information.
                 * @return {Lib.AP.UpdatePaymentDetails.CustomPaymentParameters} An object containing the following properties:
                 * <ul>
                 * <li>customOptionalCSVHeaders: an array of custom headers to read from the CSV file</li>
                 * <li>customCSVHeadersToJson: a map of custom headers to their JSON representation</li>
                 * <li>customColumnKeys: an array of custom column keys to identify the invoices updated</li>
                 * <li>customQueryLoopAttributes: an array of custom attributes to query the vendor invoices</li>
                 * <li>customizeKeyForCSVToJSON: a function to customize the key to identify the payment information in GenerateCSVToJson</li>
                 * <li>customizeQueryFilterForCreatePaymentInformation: a function to customize the query filter on vendor invoices for CreatePaymentInformation</li>
                 * </ul>
                 * @example
                 * <caption>This example allows to use the ERP invoice number in the csv instead of the invoice number and supplier number, only if the header _ERP number is present in the CSV from the ERP.</caption>
                 * CustomizePaymentFields: function(csvReader)
                 * {
                 * 		const isERPNumberPresent = csvReader.GetHeaderIndex("_ERP Number") !== -1;
                 * 		return isERPnumberPresent ? {
                 * 			customOptionalCSVHeaders: ["_ERP Number"],
                 * 			customCSVHeadersToJson: new ESKMap<string>([
                 * 				["_ERP Number", "ERPInvoiceNumber"]
                 * 			]),
                 * 			customColumnKeys: ["CompanyCode__", "ERPInvoiceNumber__"],
                 * 			customQueryLoopAttributes: ["ERPInvoiceNumber__"],
                 * 			customizeKeyForCSVToJSON: function (key, lineObject) {
                 * 				return `${lineObject.getValue("Company code")}#${lineObject.getValue("_ERP Number")}`;
                 * 			},
                 * 			customizeQueryFilterForCreatePaymentInformation: function (payment) {
                 * 				return `&(Deleted=0)(State!=400)(State!=300)(State!=200)(CompanyCode__=${Sys.Helpers.String.EscapeValueForLdapFilter(payment.companyCode)})(ERPInvoiceNumber__=${Sys.Helpers.String.EscapeValueForLdapFilter(payment.ERPInvoiceNumber)})`;
                 * 			}
                 * 		} : null;
                 * }
                 */
                Payment.CustomizePaymentFields = function (csvReader) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Payment.SetPaymentDetailsFields
                 * @description
                 * It allows customization of PaymentDetails before invoice variable updates are applied.
                 * @param {Lib.AP.UpdatePaymentDetails.PaymentInfo} paymentDetails The payment information object
                 * @param {xTransport} transport The invoice transport object (may be undefined)
                 * @param {xVars} vars The invoice variables
                 * @returns {Lib.AP.UpdatePaymentDetails.PaymentInfo} Modified payment details
                 * @example
                 * <caption>Modify payment details based on invoice amount</caption>
                 * SetPaymentDetailsFields: function(paymentDetails, transport, vars)
                 * {
                 * 		const invoiceAmount = vars.GetValue_Double("InvoiceAmount__", 0);
                 * 		if (invoiceAmount > 10000) {
                 * 			paymentDetails.additionalFields["Z_Field__"] = "Yes";
                 * 		}
                 *
                 * 		return paymentDetails;
                 * }
                 */
                Payment.SetPaymentDetailsFields = function (paymentDetails, transport, vars) {
                };
                /**
                 * @method Lib.AP.Customization.Payment.OnPaymentUpdateDone
                 * @since 344
                 * @description
                 * This user exit is called after a successful payment status update for each invoice.
                 * It allows you to perform additional actions based on the updated invoice data such as publishing to external systems (PYTHEAS, vendor portals).
                 * @param {Lib.AP.InvoiceStatus.Paid | Lib.AP.InvoiceStatus.Reversed} status The payment update status - Lib.AP.InvoiceStatus.Paid ("Paid") for successful payment, Lib.AP.InvoiceStatus.Reversed ("Reversed") for SAP invoice reversal
                 * @param {xTransport} transport The invoice transport object that was updated
                 * @param {xVars} vars The invoice variables
                 * @param {Lib.AP.UpdatePaymentDetails.PaymentInfo | null} paymentDetails The payment information from the CSV file. Will be null for reversals
                 * @returns {void}
                 * @example
                 * OnPaymentUpdateDone: function(status, transport, vars, paymentDetails)
                 * {
                 * 		if (status === Lib.AP.InvoiceStatus.Paid)
                 * 		{
                 * 			// Get processed payment method if needed in the PAID scenario
                 * 			const paymentMethod = Lib.AP.UpdatePaymentDetails.GetPaymentMethod(paymentDetails);
                 *
                 * 			const publicationData = {
                 * 				ruidex: vars.GetValue_String("RuidEx", 0),
                 * 				invoiceNumber: vars.GetValue_String("InvoiceNumber__", 0),
                 * 				vendorNumber: vars.GetValue_String("VendorNumber__", 0),
                 * 				vendorVATNumber: vars.GetValue_String("Z_VendorVATNumber__", 0),
                 * 				erpInvoiceNumber: vars.GetValue_String("ERPInvoiceNumber__", 0),
                 * 				paymentDate: paymentDetails.paymentDate,
                 * 				paymentMethod: paymentMethod,
                 * 				paymentReference: paymentDetails.paymentReference,
                 * 				status: status  // "Paid"
                 * 			};
                 *
                 * 			// Example: Call your custom publication function
                 * 			Lib.AP.Customization.Common.PublishInPYTHEAS(publicationData);
                 * 		}
                 * 		else if (status === Lib.AP.InvoiceStatus.Reversed)
                 * 		{
                 * 			// Handle reversed invoices (SAP scenario)
                 * 			const publicationData = {
                 * 				ruidex: vars.GetValue_String("RuidEx", 0),
                 * 				invoiceNumber: vars.GetValue_String("InvoiceNumber__", 0),
                 * 				status: status  // "Reversed"
                 * 			};
                 *
                 * 			// Example: Call your custom publication function
                 * 			Lib.AP.Customization.Common.PublishInPYTHEAS(publicationData);
                 * 		}
                 * }
                 */
                Payment.OnPaymentUpdateDone = function (status, transport, vars, paymentDetails) {
                };
                /**
                 * @method Lib.AP.Customization.Payment.CustomizeKeyForRecord
                 * @since 353
                 * @description
                 * This user exit is called in the 'Vendor Invoice Payment' process, in the main invoice-fetch loop,
                 * before any standard key assembly (RuidEx or column-keys lookup).
                 * Return a non-empty string to completely override the key used to look up the corresponding row
                 * in the payment map, skipping the standard key-assembly logic entirely.
                 * Return void (or do not return) to let the standard key-assembly logic run unchanged.
                 * The returned value will be uppercased before use.
                 * @see Lib.AP.Customization.Payment.CustomizePaymentFields (property customizeKeyForCSVToJSON)
                 * @param {xTransport} record The invoice transport object.
                 * @returns {string | void} The lookup key to use, or void to let standard key assembly run.
                 * @example
                 * <caption>Override the company code part of the key using a Z_ transport variable</caption>
                 * CustomizeKeyForRecord: function(record)
                 * {
                 * 		// return a custom lookup key (this will be uppercased by the framework)
                 * 		const vars = record.GetUninheritedVars();
                 * 		const customCompanyCode = vars.GetValue_String("Z_PaymentCompanyCode__", 0);
                 * 		if (customCompanyCode)
                 * 		{
                 * 			const vendorNumber = vars.GetValue_String("VendorNumber__", 0);
                 * 			const invoiceNumber = vars.GetValue_String("InvoiceNumber__", 0);
                 * 			// Return a non-empty string to override the standard key-assembly
                 * 			return customCompanyCode + "#" + vendorNumber + "#" + invoiceNumber;
                 * 		};
                 *
                 * }
                 */
                Payment.CustomizeKeyForRecord = function (record) {
                };
            })(Payment = Customization.Payment || (Customization.Payment = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_PAYMENT_SAMPLE.js.map