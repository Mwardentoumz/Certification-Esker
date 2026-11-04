"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_PAYMENTRUNPROVIDER_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "AP payment run provider customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP payment run provider customization callbacks.
 * Used in the 'payment run' processes.
 * @namespace Lib.AP.Customization.PaymentRunProvider
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var PaymentRunProvider;
            (function (PaymentRunProvider) {
                /**
                 * @method Lib.AP.Customization.PaymentRunProvider.GetFormattedData
                 * @description
                 * Use this function to overload the default values of a payment run provider.
                 * If your function returns a falsy value, the function will be called but
                 * the default value will be used.
                 * @see https://developer.mozilla.org/en-US/docs/Glossary/Falsy
                 * @param {object} data Default payload sent to the payment provider
                 * @example
                 * <pre><code>
                 * GetFormattedData: function (data)
                 * {
                 *	var example = {
                 *		payload: {
                 *			invoices: [
                 *				{
                 *					id: 1,
                 *					amount: 16.54
                 *				},
                 *				{
                 *					id: 13,
                 *					amount: 65.52
                 *				}
                 *			]
                 *		},
                 *		companyID: "azerty"
                 *	};
                 *
                 *	return JSON.stringify(example);
                 * }
                 *
                 * </code></pre>
                 *
                 * To change the settlementCurrency (depends of Nvoice Pay configuration):
                 * <pre><code>
                 * GetFormattedData: function (data)
                 * {
                 *	for (var i = 0; i < data.payload.invoices.length; i++)
                 *	{
                 *		var invoice = data.payload.invoices[i];
                 *		invoice[i].settlementCurrency = "USD";
                 *	}
                 *	return JSON.stringify(data);
                 * }
                 * </code></pre>
                 */
                PaymentRunProvider.GetFormattedData = function (data) {
                };
                /**
                 * @method Lib.AP.Customization.PaymentRunProvider.GetCustomSettings
                 * @description
                 * Use this function to override default payment provider settings.
                 * The values are read at payment provider initialization.
                 * @returns {Object.<string, any>} Settings to override
                 * @example
                 * <pre><code>
                 * GetCustomSettings: function (data)
                 * {
                 *	// Set all retry delays to 1 minute and retry counts to 5
                 *	return {
                 *		paymentPollingDelayBeforeReturnFile: 1000 * 60,
                 *		paymentPollingDelayAfterReturnFileFirstTry: 1000 * 60,
                 *		paymentPollingDelayAfterReturnFile: 1000 * 60,
                 *		maxPaymentPollingRetriesBeforeReturnFile: 5,
                 *		maxPaymentPollingRetriesAfterReturnFile: 5
                 *	};
                 * }
                 * </code></pre>
                 */
                PaymentRunProvider.GetCustomSettings = function () {
                    return {
                    // paymentPollingDelayBeforeReturnFile: 1000 * 60,
                    // paymentPollingDelayAfterReturnFileFirstTry: 1000 * 60,
                    // paymentPollingDelayAfterReturnFile: 1000 * 60,
                    // maxPaymentPollingRetriesBeforeReturnFile: 5,
                    // maxPaymentPollingRetriesAfterReturnFile: 5
                    };
                };
                /**
                 * PaymentInfos
                 * @typedef {Object} Lib.AP.Customization.PaymentRunProvider.PaymentInfos
                 * @property {"Paid" | "Pending" | "Rejected" | "UserActionNeeded"} Status
                 * @property {string} [PaymentDate]
                 * @property {"Cash" | "Check" | "Credit card" | "EFT" | "Other"} [PaymentMethod]
                 * @property {string} [PaymentReference]
                 * @property {string} [ErrorMessage]
                 */
                /**
                 * @method Lib.AP.Customization.PaymentRunProvider.AddInvoiceInformation
                 * @description
                 * Use this function to add information in the xml exported after a payment run.
                 * Each invoice described in the xml will have the added information
                 * item corresponds to the invoice line in the form table
                 * paymentInfos corresponds to the payment provider's response
                 * @param {Item} item
                 * @param {PaymentInfos} paymentInfos
                 * @returns {string} XML as string
                 * @example
                 * <pre><code>
                 * AddInvoiceInformation: function(item, paymentInfos)
                 * {
                 *	return "<DueDate>" + item.GetValue("DueDate__") + "</DueDate><ErrorMessage>" + paymentInfos.ErrorMessage + "</ErrorMessage>";
                 * }
                 * </code></pre>
                 */
                PaymentRunProvider.AddInvoiceInformation = function (item, paymentInfos) {
                };
                /**
                 * @method Lib.AP.Customization.PaymentRunProvider.IsPaymentRunXMLExportDisabled
                 * @description
                 * Use this function to disable the payment run xml export
                 * @returns {boolean}
                 * @example
                 * <pre><code>
                 * IsPaymentRunXMLExportDisabled: function()
                 * {
                 *	return true;
                 * }
                 * </code></pre>
                 */
                PaymentRunProvider.IsPaymentRunXMLExportDisabled = function () {
                };
                /**
                 * @namespace Lib.AP.Customization.PaymentRunProvider.Nvoicepay
                 */
                PaymentRunProvider.Nvoicepay = {
                    /**
                     * @method Lib.AP.Customization.PaymentRunProvider.Nvoicepay.CustomizeInvoiceErrorMessageMap
                     * @description
                     * Allow to customize the map that handles ErrorMessage that could be returned in ReturnFile InvoiceError node.
                     * If you want a new error message means the invoice is considered as cancelled on Corpay (Nvoicepay) side, you have to set
                     * "NoError" as corresponding value in the map.
                     * @param {Map<string, string>} existingMap The current error message/invoice status maps that will be used.
                     * @returns {Mas<string, string>} The error message/invoice status maps to use. Return null to use default map.
                     * @example
                     * <pre><code>
                     * CustomizeInvoiceErrorMessageMap: function(existingMap)
                     * {
                     *    existingMap.set("NewErrorMessage", "NoError");
                     *
                     *	  return existingMap;
                     * }
                     * </code></pre>
                     */
                    CustomizeInvoiceErrorMessageMap: function (existingMap) {
                        return null;
                    }
                };
            })(PaymentRunProvider = Customization.PaymentRunProvider || (Customization.PaymentRunProvider = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_PAYMENTRUNPROVIDER_SAMPLE.js.map