"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMERP_CUSTOMIZATION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Server side script CustomERP User Exits",
  "versionable": false,
  "require": [
    "Sys/Sys_Helpers_ODATA_Common"
  ]
}*/
/**
 * Package AP HTML page script customization callbacks for all processes
 * @namespace Lib.CustomERP.Customization
 */
var Lib;
(function (Lib) {
    var CustomERP;
    (function (CustomERP) {
        var Customization;
        (function (Customization) {
            const ERPInfo = {
                ERP: Data.GetValue("ERP__"),
                CompanyCode: Data.GetValue("CompanyCode__")
            };
            /**
             * @namespace Lib.CustomERP.Customization.InvoiceExporter
             */
            Customization.InvoiceExporter = {
                /**
                 * @method Lib.CustomERP.Customization.InvoiceExporter.GetPostInvoiceCustomPayload
                 * @since 336
                 * @description
                 * Allows you to customize the payload sent when posting an invoice.
                 * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted.
                 * @param {any} invoiceJSON A JSON object representing the full data of the invoice.
                 * @param {any} defaultPostInvoicePayload A JSON object representing the default posting payload.
                 * @param {string} invoiceType The type of the invoice, e.g., "nonpoinvoice" or "poinvoice".
                 * @returns {any} A JSON object representing the customized posting payload, or nothing to use the default payload.
                 * @example <caption>This example replaces the order number with a custom field value when the invoice type is "poinvoice" & ERP is "CustomERP_ERP1-test". Instead, if ERP is "CustomERP_ERP2-test", it adds the tax amount and local tax amount as new parameters.</caption>
                 * GetPostInvoiceCustomPayload: function (invoiceJSON, defaultPostInvoicePayload, invoiceType)
                 * {
                 * 		if(ERPInfo.ERP === "CustomERP_ERP1-test" && invoiceType === "poinvoice")
                 * 		{
                 * 			defaultPostInvoicePayload.flexible.fields.OrderNumber = invoiceJSON.flexible.fields.Z_OrderNumber__;
                 * 		}
                 * 		else if(ERPInfo.ERP === "CustomERP_ERP2-test")
                 * 		{
                 * 			defaultPostInvoicePayload.flexible.fields.ExternalTaxAmount = invoiceJSON.flexible.fields.TaxAmount__ ;
                 * 			defaultPostInvoicePayload.flexible.fields.InternalTaxAmount = invoiceJSON.flexible.fields.LocalTaxAmount__ ;
                 * 		}
                 * 		return defaultPostInvoicePayload;
                 * }
                 */
                GetPostInvoiceCustomPayload: function (invoiceJSON, defaultPostInvoicePayload, invoiceType) {
                },
                /**
                 * @method Lib.CustomERP.Customization.InvoiceExporter.GetUnblockPaymentCustomPayload
                 * @since 336
                 * @description
                 * Allows you to customize the payload sent when unblocking a payment for an invoice.
                 * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released.
                 * @param {any} invoiceJSON A JSON object representing the full data of the invoice.
                 * @param {any} defaultUnblockPaymentPayload A JSON object representing the default unblock payment payload.
                 * @returns {any} A JSON object representing the customized unblock payment payload, or nothing to use the default payload.
                 * @example <caption>This example adds the invoice type to the unblock payment payload.</caption>
                 * GetUnblockPaymentCustomPayload: function (invoiceJSON, defaultUnblockPaymentPayload)
                 * {
                 * 		defaultUnblockPaymentPayload.invoiceType = invoiceJSON.flexible.fields.InvoiceType__;
                 * 		return defaultUnblockPaymentPayload;
                 * }
                 */
                GetUnblockPaymentCustomPayload: function (invoiceJSON, defaultUnblockPaymentPayload) {
                }
            };
            /**
             * @method Lib.CustomERP.Customization.HandleCustomERPResponse
             * @since 336
             * @description
             * Allows you to customize the handling of the response of the invoice posting.
             * @param {any} response A JSON object representing the invoice posting response.
             * @returns {any} The ERP acknowledgement object with the ERP ID and any posting error. The expected structure is:
             * {
             *		"ERPAck": {
             *			"ERPID": string,
             *			"ERPPostingError": string
             *		}
             *	}
             * @example <caption>This example assume the structure of the response object contains a success property.</caption>
             * HandleCustomERPResponse: function (response)
             * {
             *		if (response && response.success)
             *		{
             *			return {
             *				"ERPAck": {
             *					"ERPID": response.id,
             *					"ERPPostingError": ""
             *				}
             *			};
             *		}
             *		if (response && response.error)
             *		{
             *			return {
             *				"ERPAck": {
             *					"ERPID": "",
             *					"ERPPostingError": response.error
             *				}
             *			};
             *		}
             *		return {
             *			"ERPAck": {
             *				"ERPID": "",
             *				"ERPPostingError": "_Error posting invoice in ERP"
             *			}
             *		};
             *	}
             * @example <caption>This example assumes we need to cater to different structures of different ERP for different company codes.</caption>
             * HandleCustomERPResponse: function (response)
             * {
             * 		if (ERPInfo.ERP === "CustomERP_ERP1-test" && ERPInfo.CompanyCode === "CC1")
             * 		{
             * 			// Custom logic for CustomERP_ERP1-test and CC1
             * 			if (response && response.success)
             * 			{
             *				return {
             *					"ERPAck": {
             *						"ERPID": response.id,
             *						"ERPPostingError": ""
             *					}
             *				};
             *			}
             *			return {
             *				"ERPAck": {
             *					"ERPID": "",
             *					"ERPPostingError": "Error posting to CustomERP_ERP1-test and CC1"
             *				}
             *			};
             * 		}
             * 		if (ERPInfo.ERP === "CustomERP_ERP2-test" && ERPInfo.CompanyCode === "CC2")
             * 		{
             * 			// Custom logic for CustomERP_ERP2-test and CC2
             * 			if (response && response.postingStatus)
             * 			{
             * 				return {
             *					"ERPAck": {
             *						"ERPID": response.erpId,
             *						"ERPPostingError": ""
             *					}
             *				};
             * 			}
             * 			return {
             *				"ERPAck": {
             *					"ERPID": "",
             *					"ERPPostingError": "Error posting to CustomERP_ERP2-test and CC2"
             *				}
             *			};
             * 		}
             * }
             */
            Customization.HandleCustomERPResponse = function (response) {
            };
            /**
             * @method Lib.CustomERP.Customization.HandleCustomUnblockPaymentResponse
             * @since 336
             * @description
             * Allows you to customize the handling of the response of the unblock payment request for an invoice.
             * @param {any} response A JSON object representing the unblock payment response.
             * @returns {{boolean, string}} A boolean indicating whether the payment was unblocked successfully or not, and an error message if it failed.
             * @example <caption>This example assume the structure of the response object contains a success property.</caption>
             * HandleCustomUnblockPaymentResponse: function (response)
             * {
             *		if (response && response.unblocked)
             *		{
             *			return { unblocked: response.unblocked, errorMsg: "" };
             *		}
             *		return { unblocked: false, errorMsg: "_Payment not unblocked in response data" };
             * }
             * @example <caption>This example assumes we need to cater to different structures of different ERP for different company codes.</caption>
             * HandleCustomUnblockPaymentResponse: function (response)
             * {
             * 		if (ERPInfo.ERP === "CustomERP_ERP1-test" && ERPInfo.CompanyCode === "CC1")
             * 		{
             * 			// Custom logic for CustomERP_ERP1-test and CC1
             * 			if (response && response.unblockedStatus)
             * 			{
             * 				return { unblocked: response.unblockedStatus, errorMsg: "" };
             * 			}
             * 			return { unblocked: false, errorMsg: "_Payment not unblocked in response data for CustomERP_ERP1-test and CC1" };
             * 		}
             * 		if (ERPInfo.ERP === "CustomERP_ERP2-test" && ERPInfo.CompanyCode === "CC2")
             * 		{
             * 			// Custom logic for CustomERP_ERP2-test and CC2
             * 			if (response && response.paymentBlockedStatus)
             * 			{
             * 				return { unblocked: response.paymentBlockedStatus, errorMsg: "" };
             * 			}
             * 			return { unblocked: false, errorMsg: "_Payment not unblocked in response data for ERP2 and CC2" };
             * 		}
             * }
             */
            Customization.HandleCustomUnblockPaymentResponse = function (response) {
            };
            /**
             * @method Lib.CustomERP.Customization.GetWebServiceCallParameters
             * @since 364
             * @description
             * Allows you to customize the HTTP request parameters (URL, authentication, headers, body) sent to the CustomERP web service, for any endpoint (GET or POST).
             * This is the recommended place to customize non-GET calls (e.g. posting an invoice, unblocking a payment), since {@link Lib.CustomERP.Customization.GetWebServiceGetDataParameters} only applies to GET/OData calls.
             * @param {string} api The api name defined in the endpoint list of the ERP connector definition, e.g. "postnonpoinvoice".
             * @param {any} defaultParameters The default HTTP request parameters ({@link Sys.GenericAPI.HTTPRequestParam}) built from the ERP connector definition.
             * @returns {any} The customized HTTP request parameters, or nothing to use the default ones.
             * @example <caption>This example adds a custom header for a specific ERP.</caption>
             * <pre><code>
             * GetWebServiceCallParameters: function (api, defaultParameters)
             * {
             * 		if (ERPInfo.ERP === "CustomERP_ERP1-test")
             * 		{
             * 			defaultParameters.headers["X-Custom-Header"] = "CustomValue";
             * 		}
             * 		return defaultParameters;
             * }
             * </pre></code>
             */
            Customization.GetWebServiceCallParameters = function (api, defaultParameters) {
            };
            /**
             * @method Lib.CustomERP.Customization.GetWebServiceGetDataParameters
             * @since 364
             * @description
             * Allows you to customize the OData parameters (field mapping, cache, fetch-all, LDAP filter) used for GET/browse calls to the CustomERP web service (e.g. supplier, cost centers, GL accounts).
             * @param {string} api The api name defined in the endpoint list of the ERP connector definition, e.g. "supplier".
             * @param {any} defaultConfig The default OData parameters ({@link Sys.Helpers.ODataCommon.ODataParams}) built from the browse page configuration.
             * @returns {any} The customized OData parameters, or nothing to use the default ones.
             * @example <caption>This example adds a new field mapping for a specific endpoint.</caption>
             * <pre><code>
             * GetWebServiceGetDataParameters: function (api, defaultConfig)
             * {
             * 		if (api === "supplier")
             * 		{
             * 			defaultConfig.mapping.push({ input: "NewField__", QueryFieldName: "NewField" });
             * 		}
             * 		return defaultConfig;
             * }
             * </pre></code>
             */
            Customization.GetWebServiceGetDataParameters = function (api, defaultConfig) {
            };
            /**
             * @method Lib.CustomERP.Customization.CustomizeODataGetParameters
             * @since 365
             * @description
             * Allows you to customize the OData parameters of the server-side extraction reads sent to the CustomERP web service.
             * This user exit is called for every server-side read performed during the extraction of a vendor invoice:
             * vendor search, vendor details, purchase order header, purchase order items, goods receipt items, delivery notes and IBAN lookup.
             * The endpoint currently being read is given by the "api" parameter, so you can restrict your customization to a single read.
             *
             * The "odataParams" object is modified in place: change its properties directly, the returned value is ignored.
             * It is already customized by {@link Lib.CustomERP.Customization.GetWebServiceCallParameters}, so the transport level settings
             * (URL, authentication, headers) you set there are visible here.
             *
             * Scope: server-side extraction reads only. The browse and lookup pages (supplier, cost centers, GL accounts, tax codes)
             * are customized by {@link Lib.CustomERP.Customization.GetWebServiceGetDataParameters},
             * and the transport level parameters of any call by {@link Lib.CustomERP.Customization.GetWebServiceCallParameters}.
             * @param {string} api The api name defined in the endpoint list of the ERP connector definition, e.g. "supplier", "POHeader", "POItem", "GRItem" or "bankdetails".
             * @param {Sys.Helpers.ODataCommon.ODataParams} odataParams The OData parameters to modify in place: "ldapFilter", "urlParams", "mapping", "useCache", "headers"...
             * @returns {void} Nothing. Modify "odataParams" in place.
             * @example <caption>This example retrieves an additional ERP field for the vendor read and maps it to an Esker field.</caption>
             * CustomizeODataGetParameters = function (api, odataParams)
             * {
             * 		if (api === "supplier")
             * 		{
             * 			odataParams.urlParams.select += ",PaymentMethodCode";
             * 			odataParams.mapping.push({ input: "PaymentMethod__", QueryFieldName: "PaymentMethodCode" });
             * 		}
             * }
             * @example <caption>This example disables the cache and lifts the result limit for a specific ERP.</caption>
             * CustomizeODataGetParameters = function (api, odataParams)
             * {
             * 		if (ERPInfo.ERP === "CustomERP_ERP1-test")
             * 		{
             * 			odataParams.useCache = false;
             * 			odataParams.urlParams.top = 50;
             * 		}
             * }
             */
            Customization.CustomizeODataGetParameters = function (api, odataParams) {
            };
            /**
             * @method Lib.CustomERP.Customization.OnODataGetResultCallback
             * @since 365
             * @description
             * Allows you to react to and customize the result of the server-side extraction reads sent to the CustomERP web service.
             * This user exit is called for every server-side read performed during the extraction of a vendor invoice, right after the response is received:
             * vendor search, vendor details, purchase order header, purchase order items, goods receipt items, delivery notes and IBAN lookup.
             * The endpoint that was just read is given by the "api" parameter, so you can restrict your customization to a single read.
             *
             * The "response" object is modified in place: change its "value" array (or its items) directly, the returned value is ignored.
             * @param {string} api The api name defined in the endpoint list of the ERP connector definition, e.g. "supplier", "POHeader", "POItem", "GRItem" or "bankdetails".
             * @param {Sys.Helpers.ODataCommon.ODataResponse} response The OData response to modify in place: "value" holds the array of returned records.
             * @returns {void} Nothing. Modify "response" in place.
             * @example <caption>This example discards vendor records that are flagged as blocked by a custom ERP field.</caption>
             * OnODataGetResultCallback = function (api, response)
             * {
             * 		if (api === "supplier" && response?.value)
             * 		{
             * 			response.value = response.value.filter(function (vendor) { return vendor.BlockedStatus !== "X"; });
             * 		}
             * }
             * @example <caption>This example normalizes the PO order number casing returned by a specific ERP.</caption>
             * OnODataGetResultCallback = function (api, response)
             * {
             * 		if (api === "poheaders" && ERPInfo.ERP === "CustomERP_ERP1-test" && response?.value)
             * 		{
             * 			response.value.forEach(function (poHeader) { poHeader.OrderNumber = poHeader.OrderNumber.toUpperCase(); });
             * 		}
             * }
             */
            Customization.OnODataGetResultCallback = function (api, response) {
            };
            /**
             * @method Lib.CustomERP.Customization.GetPostInvoiceEndpointOverride
             * @since 365
             * @description
             * Allows you to override the endpoint used to post an invoice to the CustomERP connector.
             * This user exit is called from the Vendor invoice process, before posting the invoice, for any invoice type.
             * By default, only "Non-PO Invoice" and "PO Invoice" have a posting endpoint ("postnonpoinvoice" and "postpoinvoice" respectively).
             * Any other invoice type (e.g. "Downpayment Invoice", "Consignment", "Clearing", "PO Invoice (as FI)") has no default endpoint
             * and, unless overridden here, falls back to the generic ERP connector (no API call to CustomERP).
             * @param {Lib.ERP.CustomERP.EndpointName | null} defaultEndpoint The endpoint computed by the standard logic, or null if no default endpoint applies to this invoice type.
             * @param {string} invoiceType The current invoice type, e.g. "Non-PO Invoice", "PO Invoice", "Downpayment Invoice".
             * @returns {string | void} One of the endpoint names already declared in EndpointList__ (e.g. "postnonpoinvoice", "postpoinvoice") to use to post the invoice, or nothing to keep the default behavior.
             * @example <caption>This example posts Downpayment invoices to the "postnonpoinvoice" endpoint instead of falling back to the generic ERP connector.</caption>
             * <pre><code>
             * GetPostInvoiceEndpointOverride: function (defaultEndpoint, invoiceType)
             * {
             * 		if (!defaultEndpoint && invoiceType === "Downpayment Invoice")
             * 		{
             * 			return "postnonpoinvoice";
             * 		}
             * }
             * </code></pre>
             */
            Customization.GetPostInvoiceEndpointOverride = function (defaultEndpoint, invoiceType) {
            };
        })(Customization = CustomERP.Customization || (CustomERP.Customization = {}));
    })(CustomERP = Lib.CustomERP || (Lib.CustomERP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CUSTOMERP_CUSTOMIZATION_SAMPLE.js.map