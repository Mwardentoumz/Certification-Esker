/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_PAYMENTRUNPROVIDER",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "AP payment run provider customization callbacks",
  "versionable": false,
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.PaymentRunProvider library: AP payment run provider customization callbacks
 */

/**
 * Package AP payment run provider customization callbacks.
 * Used in the 'payment run' processes.
 * @namespace Lib.AP.Customization.PaymentRunProvider
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.PaymentRunProvider
	 */
	parentLib.PaymentRunProvider =
	{

		/**
		* Use this function to overload the default values of a payment run provider.
		* If your function returns a falsy value, the function will be called but
		* the default value will be used.
		* @see https://developer.mozilla.org/en-US/docs/Glossary/Falsy
		* @memberOf Lib.AP.Customization.PaymentRunProvider
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
		GetFormattedData: function (data)
		{

		},

		/**
		* Use this function to override default payment provider settings.
		* The values are read at payment provider initialization.
		* @memberOf Lib.AP.Customization.PaymentRunProvider
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

		GetCustomSettings: function ()
		{
			return {
				paymentPollingDelayBeforeReturnFile: 1000 * 60,
				paymentPollingDelayAfterReturnFileFirstTry: 1000 * 60,
				paymentPollingDelayAfterReturnFile: 1000 * 60,
				maxPaymentPollingRetriesBeforeReturnFile: 5,
				maxPaymentPollingRetriesAfterReturnFile: 5
			};
		}
	};
})(Lib.AP.Customization);
