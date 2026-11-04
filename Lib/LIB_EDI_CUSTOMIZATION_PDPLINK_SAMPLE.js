"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EDI_CUSTOMIZATION_PDPLINK_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Customization library for PDP link features",
  "versionable": false,
  "require": []
}*/
/**
 * Customization library for PDP link feature.
 * @namespace Lib.EDI.Customization.PDPLink
 */
var Lib;
(function (Lib) {
    var EDI;
    (function (EDI) {
        var Customization;
        (function (Customization) {
            var PDPLink;
            (function (PDPLink) {
                /**
                 * @method Lib.EDI.Customization.PDPLink.CustomizeOAuth2TokenRequest
                 * @since 352
                 * @description
                 * Callback used by PDP OAuth2 authentication to customize the token request parameters
                 * before calling the token endpoint.
                 *
                 * This sample shows how to disable basic authentication and pass client credentials
                 * in the request body (data) instead.
                 *
                 * Return the updated params to apply changes. Return `undefined` to keep default params.
                 *
                 * @param {Sys.GenericAPI.HTTPRequestParam} httpParams Default token request parameters.
                 * @returns {Sys.GenericAPI.HTTPRequestParam | void} Updated token request parameters.
                 * @example
                 * <pre><code>
                 * CustomizeOAuth2TokenRequest: function (httpParams)
                 * {
                 * 	const clientId = httpParams.user;
                 * 	const clientSecret = httpParams.password;
                 *
                 * 	delete httpParams.authentType;
                 * 	delete httpParams.user;
                 * 	delete httpParams.password;
                 *
                 * 	httpParams.data = `${httpParams.data || "grant_type=client_credentials"}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;
                 * 	return httpParams;
                 * }
                 * </code></pre>
                 */
                PDPLink.CustomizeOAuth2TokenRequest = function (httpParams) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.CustomizeFetchUnprocessedInvoicesQueryParam
                 * @since 353
                 * @description
                 * Callback used to customize the HTTP query parameters sent to PDP when searching
                 * unprocessed invoices in `fetchUnprocessedInvoices`.
                 *
                 * Return the updated params to apply changes. Return `undefined`/`null` to keep default params.
                 * Mutating the input object without returning it is not supported.
                 *
                 * @param {Sys.GenericAPI.HTTPRequestParam} queryParam Default HTTP query parameters.
                 * @returns {Sys.GenericAPI.HTTPRequestParam | void} Updated HTTP query parameters.
                 * @example
                 * <pre><code>
                 * CustomizeFetchUnprocessedInvoicesQueryParam: function (queryParam)
                 * {
                 * 	queryParam.headers["X-Custom-Header"] = "Invoices";
                 * 	return queryParam;
                 * }
                 * </code></pre>
                 */
                PDPLink.CustomizeFetchUnprocessedInvoicesQueryParam = function (queryParam) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.CustomizeFetchUnprocessedCDVsQueryParam
                 * @since 353
                 * @description
                 * Callback used to customize the HTTP query parameters sent to PDP when searching
                 * unprocessed CDVs in `fetchUnprocessedCDVs`.
                 *
                 * Return the updated params to apply changes. Return `undefined`/`null` to keep default params.
                 * Mutating the input object without returning it is not supported.
                 *
                 * @param {Sys.GenericAPI.HTTPRequestParam} queryParam Default HTTP query parameters.
                 * @returns {Sys.GenericAPI.HTTPRequestParam | void} Updated HTTP query parameters.
                 * @example
                 * <pre><code>
                 * CustomizeFetchUnprocessedCDVsQueryParam: function (queryParam)
                 * {
                 * 	queryParam.headers["X-Custom-Header"] = "CDVs";
                 * 	return queryParam;
                 * }
                 * </code></pre>
                 */
                PDPLink.CustomizeFetchUnprocessedCDVsQueryParam = function (queryParam) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.CustomizeFetchSelfBilledInvoicesQueryParam
                 * @since 353
                 * @description
                 * Callback used to customize the HTTP query parameters sent to PDP when searching
                 * self-billed invoices in `fetchSelfBilledInvoices`.
                 *
                 * Return the updated params to apply changes. Return `undefined`/`null` to keep default params.
                 * Mutating the input object without returning it is not supported.
                 *
                 * @param {Sys.GenericAPI.HTTPRequestParam} queryParam Default HTTP query parameters.
                 * @returns {Sys.GenericAPI.HTTPRequestParam | void} Updated HTTP query parameters.
                 * @example
                 * <pre><code>
                 * CustomizeFetchSelfBilledInvoicesQueryParam: function (queryParam)
                 * {
                 * 	queryParam.headers["X-Custom-Header"] = "SelfBilled";
                 * 	return queryParam;
                 * }
                 * </code></pre>
                 */
                PDPLink.CustomizeFetchSelfBilledInvoicesQueryParam = function (queryParam) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.CustomizeFetchUnprocessedEReportingsQueryParam
                 * @since 353
                 * @description
                 * Callback used to customize the HTTP query parameters sent to PDP when searching
                 * unprocessed e-reportings in `fetchUnprocessedEReportings`.
                 *
                 * Return the updated params to apply changes. Return `undefined`/`null` to keep default params.
                 * Mutating the input object without returning it is not supported.
                 *
                 * @param {Sys.GenericAPI.HTTPRequestParam} queryParam Default HTTP query parameters.
                 * @returns {Sys.GenericAPI.HTTPRequestParam | void} Updated HTTP query parameters.
                 * @example
                 * <pre><code>
                 * CustomizeFetchUnprocessedEReportingsQueryParam: function (queryParam)
                 * {
                 * 	queryParam.headers["X-Custom-Header"] = "EReportings";
                 * 	return queryParam;
                 * }
                 * </code></pre>
                 */
                PDPLink.CustomizeFetchUnprocessedEReportingsQueryParam = function (queryParam) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.CustomizeSubmitFlowQueryParam
                 * @since 360
                 * @description
                 * Callback used to customize the HTTP query parameters sent to PDP when submitting a flow.
                 *
                 * Return the updated params to apply changes. Return `undefined`/`null` to keep default params.
                 * Mutating the input object without returning it is not supported.
                 *
                 * @param {Sys.GenericAPI.HTTPRequestParam} queryParam Default HTTP query parameters.
                 * @param {string} context Context of the flow submission. Can be one of: "Invoice", "CDV", "e-reporting".
                 * @returns {Sys.GenericAPI.HTTPRequestParam | void} Updated HTTP query parameters.
                 * @example
                 * <pre><code>
                 * // example - add a custom HTTP header to every flow submission
                 * CustomizeSubmitFlowQueryParam: function (queryParam, context)
                 * {
                 * 	queryParam.headers["X-Custom-Context"] = context;
                 * 	return queryParam;
                 * }
                 * </code></pre>
                 * @example
                 * <pre><code>
                 * // example - add a custom field in the flowInfo part for CDV submissions only
                 * CustomizeSubmitFlowQueryParam: function (queryParam, context)
                 * {
                 * 	if (context === "CDV")
                 * 	{
                 * 		queryParam.multipart.parts.forEach((part) =>
                 * 		{
                 * 			if (part.name === "flowInfo")
                 * 			{
                 * 				try
                 * 				{
                 * 					const flowInfo = JSON.parse(part.value);
                 * 					flowInfo.customField = "myCustomValue";
                 * 					part.value = JSON.stringify(flowInfo);
                 * 				}
                 * 				catch (e)
                 * 				{
                 * 					Log.Error(`Failed to parse flowInfo: ${e.message}`);
                 * 				}
                 * 			}
                 * 		});
                 * 	}
                 * 	return queryParam;
                 * }
                 * </code></pre>
                 */
                PDPLink.CustomizeSubmitFlowQueryParam = function (queryParam, context) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.OnCreateInvoiceFailure
                 * @description
                 * Callback function called when an invoice retrieval/creation fails after maximum retry attempts.
                 * @param {string} invoiceId Invoice id of the failed invoice (Flux id for SG5)
                 * @example
                 * <pre><code>
                 * OnCreateInvoiceFailure: function (invoiceId)
                 * {
                 * 	const email = Process.CreateTransport("mail");
                 * 	const emailVars = email.GetUninheritedVars();
                 * 	emailVars.AddValue_String("Subject", "Retrieve invoice from PDP failure", true);
                 * 	emailVars.AddValue_String("emailAddress", "user1@example.com", true);
                 * 	emailVars.AddValue_String("Message", `Invoice id: ${invoiceId}`, true);
                 * 	email.Process();
                 * }
                 * </code></pre>
                 */
                PDPLink.OnCreateInvoiceFailure = function (invoiceId) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.OnBeforeCreateVIPProcess
                 * @since 356
                 * @description
                 * Callback called just before the Vendor Invoice Process is created from the PDP connector.
                 * Use this to add custom uninherited or external variables to the transport.
                 *
                 * @param {xTransport} vendorInvoiceTransport The transport object for the VIP being created.
                 * @param {Sys.EDI.FRB2B.PDPConnector.IPDPDocument} pdpInvoice The PDP invoice document (contains id, format, metadata).
                 * @param {Sys.EDI.FRB2B.PDPConnector.IPDPConfiguration} pdpConf The PDP configuration used.
                 * @example
                 * <pre><code>
                 * OnBeforeCreateVIPProcess: function (vendorInvoiceTransport, pdpInvoice, pdpConf)
                 * {
                 * 	// Example: Add FlowID as external var for AP versions < 348
                 * 	var externalVars = vendorInvoiceTransport.GetExternalVars();
                 * 	externalVars.AddValue_String("FlowID", pdpInvoice.id, true);
                 * }
                 * </code></pre>
                 */
                PDPLink.OnBeforeCreateVIPProcess = function (vendorInvoiceTransport, pdpInvoice, pdpConf) {
                };
                /**
                 * @method Lib.EDI.Customization.PDPLink.GetOriginalFileForPDPInvoices
                 * @since 364
                 * @description
                 * Callback called before getting the document attachment for a PDP invoice.
                 * Use this to determine if the original file should be fetched instead of the converted one.
                 *
                 * @param {Sys.EDI.FRB2B.PDPConnector.IPDPDocument} pdpDocument The metadata of the invoice being fetched
                 * @return {boolean | void} True if the original file should be fetched, false if the converted file should be fetched.
                 * @param {Sys.EDI.FRB2B.PDPConnector.IPDPConfiguration} pdpConf The PDP configuration used.
                 * @example
                 * <pre><code>
                 * GetOriginalFileForPDPInvoices: function (pdpDocument)
                 * {
                 * 	if(pdpDocument.flowSyntax == "Factur-X")
                 * 	{
                 * 		return true; // fetch original file for Factur-X invoices
                 * 	}
                 * 	return false; // fetch converted file for other invoices
                 * }
                 * </code></pre>
                 */
                PDPLink.GetOriginalFileForPDPInvoices = function (pdpDocument) {
                };
            })(PDPLink = Customization.PDPLink || (Customization.PDPLink = {}));
        })(Customization = EDI.Customization || (EDI.Customization = {}));
    })(EDI = Lib.EDI || (Lib.EDI = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EDI_CUSTOMIZATION_PDPLink_SAMPLE.js.map