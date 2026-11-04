"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_EXTRACTION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Extraction script AP customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP extraction script customization callbacks
 * @namespace Lib.AP.Customization.Extraction
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var Extraction;
            (function (Extraction) {
                /**
                 * @namespace Lib.AP.Customization.Extraction.CustomUserExits
                 * @description
                 * Allows you to define custom user exists added for this customer
                 * Functions defined in this scope will be accessible from outside this library
                 */
                Extraction.CustomUserExits = {};
                /**
                 * @method Lib.AP.Customization.Extraction.OnExtractionScriptBegin
                 * @description
                 * Allows you to customize extraction settings. This user exit is called at the beginning of the extraction script of the Vendor invoice process.
                 * @example
                 * <pre><code>
                 * OnExtractionScriptBegin: function ()
                 * {
                 * 	// Run custom code to determine the company code,
                 *  // so the rest of the processing can use the proper settings
                 * 	var firstRecordRuidEx = Data.GetValue("SourceRUID");
                 *	if (firstRecordRuidEx.indexOf("ISM") === 0)
                 *	{
                 *		// Fetch email record and retrieve sender address and recipient address
                 *		var senderAddress = "myCompany@us.acme.com"; // ...
                 *
                 *		if (senderAddress.indexOf("@us") > 0)
                 *		{
                 *			Data.SetValue("CompanyCode__", "US01");
                 *		}
                 *		else if (senderAddress.indexOf("@fr") > 0)
                 *		{
                 *			Data.SetValue("CompanyCode__", "FR01");
                 *		}
                 *		else
                 *		{
                 *			// Keep default company code, set via Configurator
                 *		}
                 *	 }
                 * }
                 * </code></pre>
                 */
                Extraction.OnExtractionScriptBegin = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnLineItemsPopulatedPreTax
                 * @description
                 * Called after the line items table is populated with all data except the tax calculations.
                 * Allows you to customize the form, including changing the line items table, before the tax is calculated so you don't have to control the tax calculation yourself.
                 * @example
                 * <pre><code>
                 * OnLineItemsPopulatedPreTax: function ()
                 * {
                 *  // Add a standard line for specific vendors if certain criteria are met (specific criteria determined in external function for this example)
                 *  const standardLine =
                 *  {
                 * 		"Amount__": 100,
                 * 		"Quantity__": 1,
                 * 		"Description__": "Standard line description"
                 *  }
                 *  if (addStandardLine(Data.GetValue("VendorNumber__")))
                 *  {
                 * 		<add values from standardLine to line items table>
                 *  }
                 * }
                 */
                Extraction.OnLineItemsPopulatedPreTax = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnLineItemsPopulatedPostTax
                 * @description
                 * Called after the line items table is populated with all data including the tax calculations.
                 * Allows you to customize the form, including changing tax information, after the whole table is populated but before other automations are run.
                 * This UE runs before the balance calculation, the workflow automation, and others.
                 * @example
                 * <pre><code>
                 * OnLineItemsPopulatedPostTax: function ()
                 * {
                 * 	// Change the cost center value based on the GL account (calling here means the workflow will calculate with the new value)
                 * 	Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item)
                 * 	{
                 * 		const glAccount = item.GetValue("GLAccount__");
                 * 		if (glAccount.indexOf(".") !== -1)
                 * 		{
                 * 			item.SetValue("CostCenter__", glAccount.split(".")[0]);
                 * 		}
                 * 	}
                 * }
                 */
                Extraction.OnLineItemsPopulatedPostTax = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnDoNotUseTaxCode
                 * @since 334
                 * @description
                 * Allows you to customize the behavior of the tax code lookup : it's called by the extraction script of the Vendor invoice process and
                 * used to prevent the tax code lookup from being performed. Please note that a parameter exists in the S2P configuration to disable tax code lookup, but it does not allow
                 * disabling it based on invoice data.
                 * @returns {boolean} true if the tax code lookup should not be performed. False if it should be performed even if DoNotUseTaxCode is set to true in configuration. Nothing if DoNotUseTaxCode parameter should be used (if set).
                 * <caption> Prevent tax code lookup for specific vendors </caption>
                 * OnDoNotUseTaxCode: function ()
                 * {
                 *   // Prevent tax code lookup for specific vendors
                 *   var vendorNumber = Data.GetValue("VendorNumber__");
                 *   if (vendorNumber === "12345" || vendorNumber === "67890")
                 *   {
                 *       return true;
                 *   }
                 *   return false;
                 */
                Extraction.OnDoNotUseTaxCode = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.CustomizeTaxCodePredictionFilter
                 * @since 361
                 * @description
                 * Allows you to customize the LDAP filter used to predict a tax code during extraction.
                 * Return void to use the standard filter.
                 * @param {string} companyCode The company code of the invoice.
                 * @param {Sys.Decimal} taxRateLowerBound The lower tax rate bound used by the standard filter.
                 * @param {Sys.Decimal} taxRateUpperBound The upper tax rate bound used by the standard filter.
                 * @returns {string | void} The customized LDAP filter, or void to use the standard filter.
                 * @example <caption>Use an entity code to look up tax codes maintained for a dedicated entity</caption>
                 * Extraction.CustomizeTaxCodePredictionFilter = function (companyCode, taxRateLowerBound, taxRateUpperBound)
                 * {
                 * 	var entityCode = Data.GetValue("Z_EntityCode__");
                 * 	if (entityCode)
                 * 	{
                 * 		return "&(TaxRate__>=" + taxRateLowerBound.toNumber() + ")"
                 * 			+ "(TaxRate__<=" + taxRateUpperBound.toNumber() + ")"
                 * 			+ "(CompanyCode__=" + entityCode + ")";
                 * 	}
                 * };
                 */
                Extraction.CustomizeTaxCodePredictionFilter = function (companyCode, taxRateLowerBound, taxRateUpperBound) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnExtractionScriptEnd
                 * @description
                 * Allows you to customize extraction settings. This user exit is called at the end of the extraction script of the Vendor invoice process.
                 * ATTENTION: During the execution of the extraction script, some fields are set or inferred based on reference fields (for example, Company code). It is recommended not to modify these reference fields in this user exit as this could result in inconsistencies in the Vendor invoice process
                 * @example
                 * <pre><code>
                 * OnExtractionScriptEnd: function ()
                 * {
                 * 	// Initialize posting date with invoice date
                 * 	var invoiceDate = Data.GetValue("InvoiceDate__");
                 * 	Data.SetValue("PostingDate__", invoiceDate);
                 * }
                 * </code></pre>
                 */
                Extraction.OnExtractionScriptEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.ExtendFirstTimeRecognition
                 * @since 349
                 * @description
                 * Allows you to extend the first time recognition extraction.
                 * This user exit is called during first time recognition,
                 * before validate invoice currency, update exchange rate and PO items.
                 * @param {Lib.FirstTimeRecognition.InvoiceDocument | Lib.AP.Mapping.InvoiceDocument} inv The invoice document structure containing the extracted data from mapped file.
                 * @returns {Lib.AP.ComputedValueSource | void} Return a computed value source to set a field value, or void to do nothing.
                 * @example <caption> Set a custom document type based on the extracted DocumentType field </caption>
                 * ExtendFirstTimeRecognition: function (inv)
                 * {
                 * 	let defaultDocType = 001; //Invoice
                 * 	let g_documentType = inv.GetHeaderField("DocumentType");
                 * 	if(g_documentType && g_documentType.standardStringValue)
                 * 	{
                 * 		if(g_documentType.standardStringValue.toUpperCase().indexOf("DEBIT") != -1)
                 * 		{
                 * 			defaultDocType = 002;
                 * 		}
                 * 		else if(g_documentType.standardStringValue.toUpperCase().indexOf("CREDIT") != -1)
                 * 		{
                 * 			defaultDocType = 003;
                 * 		}
                 * 	}
                 * 	Data.SetValue("Z_CustomDocTypeField__", defaultDocType);
                 * }
                 */
                Extraction.ExtendFirstTimeRecognition = function (inv) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.SkipSetFirstRecoValueForce
                 * @since 358
                 * @description
                 * Allows you to skip the forced setting of a field value during first time recognition.
                 * This user exit is called at the very beginning of the SetFirstRecoValueForce function,
                 * before any field value is applied. SetFirstRecoValueForce is used in EDI mode and
                 * overwrites field values unconditionally, including values a user has already taught.
                 * When this user exit returns true for a given field, the forced set is skipped for that
                 * field, allowing taught values to be preserved per-field in EDI mode.
                 * When not implemented (the default), the current behavior is fully preserved.
                 * @param {string} fieldName The name of the field about to be force-set.
                 * @param {Lib.AP.ComputedValueSource | string} source The source of the new extraction value about to be applied.
                 * @returns {boolean | void} Return true to skip the forced set for this field, or a falsy value to proceed as usual.
                 * @example <caption> Preserve taught values for a specific field in EDI mode </caption>
                 * Extraction.SkipSetFirstRecoValueForce: function (fieldName, source)
                 * {
                 * 	if (fieldName === "InvoiceDate__" && Data.IsComputed(fieldName))
                 * 	{
                 * 		return true;
                 * 	}
                 * 	return false;
                 * }
                 * @example <caption> Skip the forced set only when the new value comes from EDI </caption>
                 * Extraction.SkipSetFirstRecoValueForce: function (fieldName, source)
                 * {
                 * 	if (fieldName === "InvoiceDate__" && source === Lib.AP.ComputedValueSource.EDI && Data.IsComputed(fieldName))
                 * 	{
                 * 		return true;
                 * 	}
                 * 	return false;
                 * }
                 * @example <caption> Preserve any already computed value for every field </caption>
                 * Extraction.SkipSetFirstRecoValueForce: function (fieldName, source)
                 * {
                 * 	return Data.IsComputed(fieldName);
                 * }
                 */
                Extraction.SkipSetFirstRecoValueForce = function (fieldName, source) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnBatchExtractionScriptBegin
                 * @description
                 * For Vendor Invoice Batch process
                 * --------------------------------
                 * Allows you to customize extraction settings. This user exit is called at the beginning of the extraction script of the Vendor invoice batch process.
                 */
                Extraction.OnBatchExtractionScriptBegin = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnBatchExtractionScriptEnd
                 * @description
                 * For Vendor Invoice Batch process
                 * --------------------------------
                 * Allows you to customize extraction settings. This user exit is called at the end of the extraction script of the Vendor invoice batch process.
                 */
                Extraction.OnBatchExtractionScriptEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnERPAckExtractionScriptBegin
                 * @since 354
                 * @description
                 * For Update invoice with ERP ID process
                 * --------------------------------
                 * This user exit is called at the very beginning of the extraction script of the Update invoice with ERP ID process,
                 * before any XML parsing occurs. Return a truthy value to bypass the entire standard XML extraction logic.
                 * This is useful when the ERP acknowledgment file is not in the expected XML format (e.g. CSV, JSON, flat file)
                 * and you need to implement custom parsing instead.
                 * @returns {boolean | void} Return truthy to bypass standard XML parsing, or void/falsy to continue with standard extraction.
                 * @example <caption>Handle CSV-format ERP acknowledgments instead of XML</caption>
                 * OnERPAckExtractionScriptBegin = function ()
                 * {
                 *     var inputFile = Attach.GetInputFile(0);
                 *     if (!inputFile)
                 *     {
                 *         return false;
                 *     }
                 *     var content = Process.GetInputFileAsString(inputFile);
                 *     if (content.indexOf("<?xml") === 0)
                 *     {
                 *         return false; // Standard XML format, let default extraction handle it
                 *     }
                 *     // Custom CSV parsing logic
                 *     var lines = content.split("\n");
                 *     var headers = lines[0].split(",");
                 *     var values = lines[1].split(",");
                 *     for (var i = 0; i < headers.length; i++)
                 *     {
                 *         Data.SetValue(headers[i].trim(), values[i].trim());
                 *     }
                 *     return true; // Bypass standard XML extraction
                 * };
                 */
                Extraction.OnERPAckExtractionScriptBegin = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnERPAckExtractionScriptEnd
                 * @since 330
                 * @description
                 * For Update invoice with ERP ID process
                 * --------------------------------
                 * Allows you to customize extraction settings. This user exit is called at the end of the extraction script of the Update invoice with ERP ID process.
                 * CARE: This ERPAck usage has been extended to update other processes than Vendor Invoice depending on the XML content.
                 */
                Extraction.OnERPAckExtractionScriptEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnUpdateExchangeRate
                 * @description
                 * This method allows you to add custom behavior when the the exchange rate is updated
                 */
                Extraction.OnUpdateExchangeRate = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.MustDetermineOwner
                 * @since 350
                 * @description
                 * Allows you to extend the conditions under which owner determination is triggered for a Vendor invoice.
                 * By default, owner determination runs only for invoices submitted via the Vendor Portal, created manually in Document Manager,
                 * when `AutomaticallyForwardNonPoInvoiceToReviewer` is enabled, when `forwardToCorrectAP` variable is set, or when the invoice comes from PDP.
                 * Return `true` from this user exit to force owner determination (and trigger `DetermineVendorInvoiceOwner`) for other cases such as EDI invoices.
                 * Return `false` to suppress owner determination even when the standard conditions above are met.
                 * Return `undefined` (or omit the return) to rely on the standard conditions.
                 * @returns {boolean | void} true to force owner determination, false to suppress it, undefined/void to rely on the standard conditions
                 * @example
                 * MustDetermineOwner: function ()
                 * {
                 *     // Force owner determination for EDI invoices (e.g. for Belgian/Polish compliance routing)
                 *     if (Data.GetValue("ReceptionMethod__") === "EDI")
                 *     {
                 *         return true;
                 *     }
                 * }
                 */
                Extraction.MustDetermineOwner = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.DetermineVendorInvoiceOwner
                 * @description
                 * Allows you to customize the owner of the Vendor invoice process. This user exit is called at the end of the extraction script of the process.
                 * This user exit is called when the invoice is manually entered in Document Manager, submitted in the Vendor Portal, or when `MustDetermineOwner` returns true.
                 * @returns {string} invoice owner
                 * @example
                 * <pre><code>
                 * DetermineVendorInvoiceOwner: function ()
                 * {
                 *     if (Data.GetValue("CompanyCode__") === "FR01")
                 *     {
                 *         return "apspecialists-FR@example.com";
                 *     }
                 *     else
                 *     {
                 *         return "apspecialists-US@example.com";
                 *     }
                 * }
                 * </code></pre>
                 */
                Extraction.DetermineVendorInvoiceOwner = function () {
                };
                /**
                 * @callback Lib.AP.Customization.Extraction.GetDefaultCurrency
                 * @description
                 * This function type is used to define `GetDefaultCurrency` option for Synergy post-processing	 *
                 * @returns {string} the default currency
                 */
                /**
                 * @callback Lib.AP.Customization.Extraction.CurrencyHasDecimal
                 * @description
                 * This function type is used to define `CurrencyHasDecimal` option for Synergy post-processing	 *
                 * @param {string} currency the currency to evaluate
                 * @returns {boolean} True if the currency has decimal (should be the default)
                 */
                /**
                 * @typedef {object} Lib.AP.Customization.Extraction.SynergyPostProcessingOptions
                 * @description
                 * A JSON describing specific callback use in synergy post-processing
                 * @property {boolean} synergyNeuralNetworkHeader is enabled or not
                 * @property {boolean} synergyNeuralNetworkLineItem is enabled or not
                 * @property {Lib.AP.Customization.Extraction.GetDefaultCurrency} GetDefaultCurrency
                 * @property {Lib.AP.Customization.Extraction.CurrencyHasDecimal} CurrencyHasDecimal
                 */
                /**
                 * @method Lib.AP.Customization.Extraction.SetSynergyPostProcessingOptions
                 * @description
                 * Allows you to customize the algorithm used for synergy post processing.
                 * This user exit is called by the extraction script of the Vendor invoice process.
                 * @param {Lib.AP.Customization.Extraction.SynergyPostProcessingOptions} options A JSON describing specific callback use in synergy post-processing
                 * @returns {object} The updated JSON of all options used for synergy post-processing
                 * @example
                 * <pre><code>
                 * SetSynergyPostProcessingOptions: function (options)
                 * {
                 *      // Optional: Specify currencies that do not have decimals, e.g. Japanese yens, Vietnamese dongs, etc.
                 *      function CurrencyHasDecimal(currency)
                 *      {
                 *          return ["CLP, "IDR", "JPY", "LAK", "PYG", "VND"].includes(currency);
                 *      }
                 *
                 *      // Optional: Perform advanced currency determination when $ sign is extracted
                 *      function DetermineCurrency(bestCandidate = {}, candidates = [])
                 *      {
                 *          let currency = bestCandidate.parsed_value;
                 *          const companyCode = Data.GetValue("CompanyCode__");
                 *          if (bestCandidate.raw_text === "$" && companyCode)
                 *          {
                 *              if (companyCode.startsWith("SG"))
                 *              {
                 *                  currency = "SGD";
                 *              }
                 *              else if (companyCode.startsWith("AU"))
                 *              {
                 *                  currency = "AUD";
                 *              }
                 *          }
                 *          return currency;
                 *      }
                 *
                 *      // Optional: Set Vietnamese dong as default currency
                 *      function GetDefaultCurrency()
                 *      {
                 *          return "VND";
                 *      }
                 *
                 *      options.CurrencyHasDecimal = CurrencyHasDecimal;
                 *      options.DetermineCurrency  = DetermineCurrency;
                 *      options.GetDefaultCurrency = GetDefaultCurrency;
                 *
                 *      return options;
                 * }
                 * </code></pre>
                 */
                Extraction.SetSynergyPostProcessingOptions = function (options) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.CustomizeDocumentSearchStringForCollectOtherDocumentTypesInArea
                 * @since 345
                 * @description
                 * Allows you to customize the search string parameters used by Document.SearchString in the CollectOtherDocumentTypesInArea function.
                 * This user exit is called by the First Time Recognition Script to let you adapt the search logic for specific document areas and validity ranges.
                 * @param {string} valueToSearch The value or pattern to search for in the document area (e.g., a validity range string)
                 * @param {object} area The area object describing the region of the document to search (should include at least the page number)
                 * @returns {ISearchParams} The parameters object to be passed to Document.SearchString
                 * @example <caption>This example customizes the search to use case-insensitive regexp on the specified area and page.</caption>
                 * CustomizeDocumentSearchStringForCollectOtherDocumentTypesInArea: function (valueToSearch, area)
                 * {
                 *     return {
                 *         area: area,
                 *         page: area.page,
                 *         keepCase: false,
                 *         valueToSearch: valueToSearch,
                 *         type: "regexp"
                 *     };
                 * }
                 */
                Extraction.CustomizeDocumentSearchStringForCollectOtherDocumentTypesInArea = function (valueToSearch, area) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.GetInvoiceFTRParameters
                 * @description
                 * Allows you to customize the algorithm used for the vendor determination with new keywords, heuristics, etc.
                 * This user exit is called by the extraction script of the Vendor invoice process.
                 * @param {object} parameters A JSON describing the default parameters used for first time recognition module
                 * @returns {object} The updated JSON of all parameters used for first time recognition module
                 * @example
                 * <pre><code>
                 * GetInvoiceFTRParameters: function (parameters)
                 * {
                 *     // append italian total keyword to amount recognition list of keywords
                 *     parameters.amountAnchorKeywords.push("totale");
                 *     return parameters;
                 * }
                 * </code></pre>
                 */
                Extraction.GetInvoiceFTRParameters = function (parameters) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OverrideInvoiceFTRBypassAmounts
                 * @since 366
                 * @description
                 * Overrides whether invoice first time recognition skips amount detection.
                 * Called after the standard bypass decision and before parsing the invoice.
                 * The standard decision skips amount detection when bypassAmounts is already enabled,
                 * both gross and net amounts are computed, or the document has more than 50 pages.
                 * @param {boolean} bypassAmounts The standard bypass decision.
                 * @returns {boolean | null} Return true to skip amount detection, false to run it, or null to keep the standard decision.
                 * Leaving this user exit unimplemented also keeps the standard decision.
                 * @example <caption>Enable amount detection for documents with more than 50 pages.</caption>
                 * Extraction.OverrideInvoiceFTRBypassAmounts = function (bypassAmounts)
                 * {
                 * 	return Document.GetPageCount() > 50 ? false : null;
                 * };
                 */
                Extraction.OverrideInvoiceFTRBypassAmounts = function (bypassAmounts) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.ForceToExtractLineItemsFromInvoice
                 * @description
                 * Allows you to force the line items extraction, even if ExtractedLineItems__ is not empty
                 * By default, it tries to extract data from invoice if nothing was found by teaching or synergy
                 * @param {ITable} extractedLineItemsTable ExtractedLineItems__ table object
                 * @returns {boolean} if true, force the line items extraction
                 */
                Extraction.ForceToExtractLineItemsFromInvoice = function (extractedLineItemsTable) {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Extraction.AddLineItemsRecognitionTemplates
                 * @description
                 * Adds the line items recognition templates
                 * @returns {boolean} if true, extract line items using the templates declared in this function
                 * @example
                 * <pre><code>
                 * AddLineItemsRecognitionTemplates: function ()
                 * {
                 * 		function AddEskerDemoTemplate()
                 * 		{
                 * 			Sys.Helpers.ExtractTable.AddDocumentType("PAC-Multiline");
                 * 			// Use full document area since it only appears on last page
                 * 			Sys.Helpers.ExtractTable.AddRecognitionRule("PAC-Multiline", "Esker Demo", "Esker Demo", Document.GetArea(), false, true);
                 * 			var bGRIV = Lib.P2P.IsGRIVEnabledGlobally();
                 * 			if (bGRIV)
                 * 			{
                 * 				Sys.Helpers.ExtractTable.AddExtractionRule("PAC-Multiline", "DN", 149, 244, /([#0-9A-Za-z_-]+)/gi, "DeliveryNoteExtracted__");
                 * 				Sys.Helpers.ExtractTable.AddExtractionRule("PAC-Multiline", "PartNo", 400, 244, /([0-9A-Za-z_-]+)/gi, "PartNumberExtracted__", true);
                 * 			}
                 * 			else
                 * 			{
                 * 				Sys.Helpers.ExtractTable.AddExtractionRule("PAC-Multiline", "PartNo", 149, 244, /([0-9A-Za-z_-]+)/gi, "PartNumberExtracted__", true);
                 * 			}
                 * 			Sys.Helpers.ExtractTable.AddExtractionRule("PAC-Multiline", "UnitPrice", 1713, 208, "Number", "UnitPriceExtracted__");
                 * 			Sys.Helpers.ExtractTable.AddExtractionRule("PAC-Multiline", "Quantity", 1312, 219, "Number", "QuantityExtracted__", true);
                 * 			Sys.Helpers.ExtractTable.AddExtractionRule("PAC-Multiline", "Amount", 2190, 181, "Number", "AmountExtracted__", true);
                 * 			var multiLineOptions =
                 * 			{
                 * 				LineItemHeight: 48,
                 * 				TableTopPosition: 1650,
                 * 				TableBottomPosition: 2354,
                 * 				ExactBoundingArea: true
                 * 			};
                 * 			Sys.Helpers.ExtractTable.SetOptions("PAC-Multiline", multiLineOptions);
                 * 		}
                 *
                 * 		if (Sys.Parameters.GetInstance("AP").GetParameter("AutolearningOnPOLines") !== "1")
                 * 		{
                 * 			AddEskerDemoTemplate();
                 * 		}
                 * 		return true;
                 * }
                 * </code></pre>
                 */
                Extraction.AddLineItemsRecognitionTemplates = function () {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Extraction.FormatOrderNumberCandidates
                 * @description
                 * Allows you to customize the order number candidates from the FTR before the look up in database.
                 * This user exit is called by the extraction script of the Vendor invoice process.
                 * @param {Lib.AP.Customization.Extraction.Candidate[]} orderNumbersCandidates An array of Order Numbers condidates extracted by the FTR
                 * @returns {Lib.AP.Customization.Extraction.Candidate[]} The updated array of candidates
                 * @example
                 * <pre><code>
                 * FormatOrderNumberCandidates: function (orderNumbersCandidates)
                 * {
                 *
                 *
                 *     return orderNumbersCandidates;
                 * }
                 * </code></pre>
                 */
                Extraction.FormatOrderNumberCandidates = function (orderNumbersCandidates) {
                    return orderNumbersCandidates;
                };
                /**
                 * @typedef {object} Lib.AP.Customization.Extraction.MatchingCompanyCodes
                 * @property {string} companyCode
                 * @property {Area} [area]
                 * @property {string} defaultConfiguration
                 * @property {boolean} reExtractCalled
                 * @property {"VATNumber__"|"SIRET__"} determinedBy
                 */
                /**
                 * @method Lib.AP.Customization.Extraction.CompanyCodeDetermination
                 * @description
                 * Allows to override the CompanyCodeDetermination function and you can define the method to determine the company code candidates.
                 * By default, we call the function CompanyCodeDetermination defined on the library Lib_AP_CompanyCodeDetermination,
                 * and returned the company codes where the associated keyword matched with the content of the document.
                 * The company code determination must be activated on the AP wizard to call this user-exit.
                 * The first result of this function will be set on the CompanyCode__ field and the other results will be displayed on the CompanyCode__ warning message
                 * Lib.AP.Customization.Extraction.GetCompanyCodeCustomFieldsMapping will not be called if this function is defined. So include the custom fields and their desired values in the returned array.
                 * @returns {Lib.AP.Customization.Extraction.MatchingCompanyCodes[]} The function returns an empty or a list of json and each json contains two fields:
                 * "companyCode": it is a string and it is equal to a company code value
                 * "area": the type is Area, can be null, and contains the area of the matching area on the document
                 * @example
                 * <pre><code>
                 * CompanyCodeDetermination: function ()
                 * {
                 *    // In this example, the company code is present in the document after the field 'Customer company'
                 *    // We return the value of this field and the corresponding area
                 * 		var tabCodes= [];
                 *		var zoneArray = Document.SearchString("customer company", 0, false, false);
                 *		for (var cc=0; cc < zoneArray.length; cc++)
                 *		{
                 *			var companyCodeExtracted = zoneArray[cc].GetNextWord();
                 *			var companyCodeCandidate = {
                 *				"companyCode": companyCodeExtracted,
                 *				"area": companyCodeExtracted,
                 *				"customFields": {
                 *					"Z_CustomField1__": "Custom value 1",
                 *					"Z_CustomField2__": "Custom value 2"
                 *				}
                 *			};
                 *			tabCodes.push(companyCodeCandidate);
                 *		}
                 *		return tabCodes;
                 * }
                 * </code></pre>
                 */
                Extraction.CompanyCodeDetermination = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.GetCompanyCodeCustomFieldsMapping
                 * @description
                 * Allows to define custom fields mapping during company code determination.
                 * Custom fields in the companyCode table returned by this function will be mirrored in the referenced Supplier invoide form fields.
                 * @returns {Lib.AP.CompanyCodeDetermination.CustomCompanyCodeFieldsMapping} The mapping between company code table custom fields and supplier invoice form fields.
                 * @example
                 * <caption>Define custom fields mapping for company code determination<br>
                 * The contents of Z_CustomColumn1__ and Z_CustomColumn2__ will be replicated in the invoice fields Z_CustomField1__ and Z_CustomField2__</caption>
                 * 	GetCompanyCodeCustomFieldsMapping = function ()
                 *	{
                 *		return [{nameInTable: "Z_CustomColumn1__", nameInForm: "Z_CustomField1__"},
                 *				{nameInTable: "Z_CustomColumn2__", nameInForm: "Z_CustomField2__"}];
                 *	}
                 */
                Extraction.GetCompanyCodeCustomFieldsMapping = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Extraction.GetCompanyCodeCustomFilter
                 * @since 337
                 * @description
                 * Allows to define custom filter during company code determination.This user exit is called when querying the "PurchasingCompanycodes__" table to determine the company code.
                 * This function can be implemented to modify or extend the default filter logic for querying the "PurchasingCompanycodes__" table.
                 * @param {String} filter The standard filter string (e.g., "(DeterminationKeyword__=*)"), used for company code determination
                 * @returns {String | void} The customized filter string to be used in the query, or void if no filter is specified.
                 * @example
                 * <caption>Creates a company code filter that includes the current AP configuration—especially useful when multiple ERPs are in use and company codes are shared. This ensures the filter targets only the relevant application setup.</caption>
                 * 	GetCompanyCodeCustomFilter = function (filter)
                 *	{
                 *		let configuration = Sys.Parameters.GetInstance("AP").GetParameter("ConfigurationName");
                 *		if (configuration)
                 *		{
                 *			return "(&" + filter + "(DefaultConfiguration__=" + configuration + "))";
                 *		}
                 *		return filter;
                 *	}
                 */
                Extraction.GetCompanyCodeCustomFilter = function (filter) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.GetCompanyCodeKeywordSearchPages
                 * @since 354
                 * @description
                 * Allows you to customize the pages to search keyword when performing automated company code keyword matching.
                 * By default, the keyword is searched only on the first page (page 0) of the document.
                 * Use this function to define the pages to search the keyword.
                 * Pages are searched in the order specified in the returned array.
                 * When the keyword is found on a page, the search stops and is not performed on remaining pages.
                 * @returns {void | number[]} An array of zero-based page indexes to search, or void for default behavior (search only on the first page).
                 * @example
                 * <caption>Search for keywords on the first two pages of the document</caption>
                 * GetCompanyCodeKeywordSearchPages = function ()
                 * {
                 *     return [0, 1];
                 * }
                 */
                Extraction.GetCompanyCodeKeywordSearchPages = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnFillVendorFieldsFromQueryResult
                 * @param {ESKMap<string>} result
                 * @param {string} [lookupValue] the lookup value that permits to retrieve the vendor when using FTR
                 * @param {string} [desc] the desc of the method that permits to retrieve the vendor when using FTR
                 * @description
                 * Allows you to customize the vendor fields filling from the query result.
                 * @example
                 * <pre><code>
                 * OnFillVendorFieldsFromQueryResult: function (result)
                 * {
                 *		const CompanyCodesList = { "8004": "1000" };
                 *		if (result.Number__ && Lib.ERP.IsSAP() && CompanyCodesList[result.Number__])
                 *		{
                 *			Data.SetValue("CompanyCode__", CompanyCodesList[result.Number__]);
                 *		}
                 * }
                 * </code></pre>
                 */
                Extraction.OnFillVendorFieldsFromQueryResult = function (result, lookupValue, desc) {
                };
                /**
                 * @typedef {Object} ParamsForDeterminingVendor
                 * @memberof Lib.AP.Customization.Extraction
                 * @property {string} searchField The field used to search the vendor in the database
                 * @property {string} searchFieldValue The value used to search the vendor in the database
                 * @property {string} fieldToDetermineVendor The field used to determine the vendor in the database
                 * @property {function} customVendorSearchFunction function that returns a searchField and searchFieldValue to use to search the vendor in the database
                 */
                /**
                 * @method Lib.AP.Customization.Extraction.CustomizeVendorDeterminationMethods
                 * @since 329
                 * @description allow to customize the array of methods used to determine the vendor
                 * @param {Array.<Lib.P2P.EDI.ParamsForDeterminingVendor>} The default array of methods used to determine the vendor
                 * @param {Lib.AP.Mapping.InvoiceDocument} invoiceDocument: structure containing the extracted data from mapped file.
                 * @returns {Array.<Lib.P2P.EDI.ParamsForDeterminingVendor>} The updated array of methods used to determine the vendor
                 *
                 * @example
                 * <caption>Insert a new method based on ExtractedIBAN__ field value to determine vendor.
                 * To determine vendor from IBAN, we will search the vendor number in the AP - Bank details__ table using the IBAN value.
                 * Then we will use the vendor number to get the vendor record, using the standard "getVendorRecordFunction" method passed in the params.
                 * This method will take priority on the one based on the VAT Number</caption>
                 * Extraction.CustomizeVendorDeterminationMethods = function (defaultVendorDeterminationMethods, invoiceDocument)
                 * {
                 * 	function searchVendorNumberFromIBAN(companyCode, searchedField, value)
                 * 	{
                 * 		let filter = Sys.Helpers.LdapUtil.FilterEqual(searchedField, value).toString();
                 * 		if (companyCode)
                 * 		{
                 * 			filter = filter.AddCompanyCodeFilter(companyCode);
                 * 		}
                 * 		Sys.GenericAPI.Query("AP - Bank details__", filter, ["VendorNumber__"], function (records)
                 * 		{
                 * 			if (records && records.length > 0)
                 * 			{
                 * 				return records[0].VendorNumber__;
                 * 			}
                 * 		});
                 * 	}
                 * 	function getVendorParamsFromIBAN(companyCode, params, getVendorRecordFunction)
                 * 	{
                 * 		var vendorNumber = searchVendorNumberFromIBAN(companyCode, params.searchField, params.searchFieldValue);
                 * 		if (vendorNumber)
                 * 		{
                 * 			return {searchedField: "Number__", searchFieldValue: searchvendorNumber};
                 * 		}
                 * 		return null;
                 * 	}
                 * 	var extractedIBAN = Data.GetValue("ExtractedIBAN__");
                 * 	if (extractedIBAN)
                 * 	{
                 * 		// we want to add a new vendor determination method before the VATNumber__ one
                 * 		const index = defaultVendorDeterminationMethods.findIndex((obj) => obj.searchField === "VATNumber__");
                 * 		if (index !== -1)
                 * 		{
                 * 			defaultVendorDeterminationMethods.splice(index, 0,
                 * 				{
                 * 					searchField: "IBAN__",
                 * 					searchFieldValue: extractedIBAN,
                 * 					fieldToDetermineVendor: "ExtractedIBAN__",
                 * 					customVendorSearchFunction: getVendorParamsFromIBAN
                 * 				}
                 * 			);
                 * 		}
                 * 	}
                 * 	return defaultVendorDeterminationMethods;
                 * };
                 */
                Extraction.CustomizeVendorDeterminationMethods = function (defaultVendorDeterminationMethods, invoiceDocument) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.ForceCompanyCode
                 * @description
                 * Allows you to force the company code extraction when the determination from the vendor is not possible.
                 * @example
                 * <pre><code>
                 * ForceCompanyCode: function ()
                 * {
                 *		if (!Data.GetValue("CompanyCode__"))
                 *		{
                 *			const companyCode = Lib.ERP.IsSAP() ? "1000" : "US01";
                 *			Log.Info("CompanyCode not defined by process variable or vendor, set to default value " + companyCode);
                 *			Data.SetValue("CompanyCode__", companyCode);
                 *		}
                 * }
                 * </code></pre>
                 */
                Extraction.ForceCompanyCode = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.AllowFapiaoQRCodeExtraction
                 * @description
                 * Allows to search and extract informations from the QR code on a FAPIAO invoice
                 * You can alternatively customize the QR code extraction using the {@link Lib.AP.Customization.Extraction.ExtractQRCode} user exit.
                 * Be sure to have the following settings in your process recognition parameters
                 * Advanced paramaters: ?allowed-bar-code=26
                 * @returns {boolean} true to activate the QRCode extraction
                 */
                Extraction.AllowFapiaoQRCodeExtraction = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.DetermineMinimumPageCountToSplit
                 * @since 330
                 * @description
                 * Allows to determine the minimum page count to split in vendor invoice batch process
                 * @returns {number} the minimum page count to split
                 * @example
                 * <caption>Determine the minimum page count to split</caption>
                 * DetermineMinimumPageCountToSplit: function ()
                 * {
                 * 		return 4;
                 * 	}
                 * */
                Extraction.DetermineMinimumPageCountToSplit = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.ExtractQRCode
                 * @description
                 * Allows to customize the QR code extraction. Only the extraction of the QR code
                 * is given, you will have to add the code to parse the result.
                 * This user exit will not be called if {@link Lib.AP.Customization.Extraction.AllowFapiaoQRCodeExtraction} is defined and returns true.
                 * The example code searches for the QR code on the bottom half of the last page.
                 * Be sure to have the following settings in your process recognition parameters:
                 * Advanced parameters: ?allowed-bar-code=26
                 * @example
                 * <pre><code>
                 * ExtractQRCode: function ()
                 * {
                 *    var p = Document.GetPageCount() - 1;
                 *    var x = 0;
                 *    var y = Document.GetPageHeight(0) / 2;
                 *    var w = Document.GetPageWidth(0);
                 *    var h = Document.GetPageHeight(0) / 2;
                 *    var qrCode = Document.GetArea(p, x, y, w, h, { "area-filling-method": "2d-barcode-2" }, "Nuance190");
                 *    if (qrCode)
                 *    {
                 *        // TODO - parse data and fill the corresponding fields
                 *        Data.SetValue("InvoiceDescription__", qrCode);
                 *    }
                 * },
                 * </code></pre>
                 */
                Extraction.ExtractQRCode = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.FillWithFirstRecognitionResults
                 * @description
                 * This is called after filling the form with first recognition results.
                 * If you need to get custom data extracted from the FTR file, customize the FTR engine (using GetInvoiceFTRParameters user exit)
                 * If you need to get custom data extracted from EDI file, customize the mapper (using CustomizeUBLMapping or CustomizeCIIMapping user exits)
                 * or create your own mapper library.
                 * @param {Lib.FirstTimeRecognition.InvoiceDocument | Lib.AP.Mapping.InvoiceDocument} invoiceDocument: structure containing the extracted data from file.
                 * @see {@link Lib.AP.Customization.Extraction.GetInvoiceFTRParameters}
                 * @see {@link Lib.AP.Customization.Extraction.MappingUBL.CustomizeUBLMapping}
                 * @see {@link Lib.AP.Customization.Extraction.MappingCII.CustomizeCIIMapping}
                 * @example <caption>Example of a user exit that fills the custom field Z_CustomFreeText__ with the value extracted from the FTR or mapped document and complete PO lines when PO Matching is disabled</caption>
                 * Extraction.FillWithFirstRecognitionResults = function (invoiceDocument)
                 * {
                 *	if (invoiceDocument)
                 *	{
                 *		if (invoiceDocument.jsonDoc) // mapped document
                 *		{
                 *			Data.SetValue("Z_CustomFreeText__", invoiceDocument.jsonDoc.header.Z_CustomFreeText);
                 *		}
                 *		else // FTR document
                 *		{
                 *			var candidates = invoiceDocument.GetHeaderFieldCandidates("Z_CustomFreeText");
                 *			if (candidates && candidates.length > 0)
                 *			{
                 *				Data.SetValue("Z_CustomFreeText__", candidates[0].area, candidates[0].standardStringValue);
                 *			}
                 *		}
                 *	}
                 *	// Complete PO lines when PO Matching is disabled
                 *	if (Lib.AP.InvoiceType.isPOInvoice() && !Lib.P2P.IsPOMatchingEnabled())
                 *	{
                 *		var mapperLineItems = invoiceDocument.GetLineItems();
                 *		var lineItems = Data.GetTable("LineItems__");
                 *		for (var i = 0; i < mapperLineItems.length; i++)
                 *		{
                 *			var line = lineItems.GetItem(i);
                 *			if (line)
                 *			{
                 *				line.SetValue("GLAccount__", "1290");
                 *			}
                 *		}
                 *	}
                 * },
                 */
                Extraction.FillWithFirstRecognitionResults = function (invoiceDocument) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.OnFillExtractedLineItemsFromMapperDocumentEnd
                 * @since 349
                 * @description
                 * This user exit is called after the ExtractedLineItems__ table is filled from the mapper document (UBL/EDI)
                 * but BEFORE the invoice reconciliation process begins. This allows you to extract and set custom data
                 * from the invoice line items that will be used during the reconciliation mechanism.
                 *
                 * Use this user exit when you need to:
                 * - Extract custom fields from UBL/EDI line items before reconciliation
                 * - Populate custom columns in ExtractedLineItems__ table that affect PO matching
                 * - Transform or enrich line item data before the reconciliation logic processes them
                 *
                 * Note: The existing FillWithFirstRecognitionResults user exit is called too late (after reconciliation),
                 * so use this new user exit when you need to influence the reconciliation behavior.
                 *
                 * @param {Lib.AP.Mapping.InvoiceDocument} mapperDocument The mapper document containing the UBL/EDI data
                 * @param {Typing.AP_VIP.Data.ExtractedLineItems__.Table} extractedLineItems The ExtractedLineItems__ table that was just populated
                 * @see {@link Lib.AP.Customization.Extraction.FillWithFirstRecognitionResults}
                 * @example <caption>Extract custom line item data from UBL document before reconciliation</caption>
                 * OnFillExtractedLineItemsFromMapperDocumentEnd: function (mapperDocument, extractedLineItems)
                 * {
                 *     // Access the raw mapper line items
                 *     var mapperLineItems = mapperDocument.GetLineItems();
                 *
                 *     // Loop through the extracted line items table
                 *     for (var i = 0; i < extractedLineItems.GetItemCount(); i++)
                 *     {
                 *         var item = extractedLineItems.GetItem(i);
                 *         var mapperLine = mapperLineItems[i];
                 *
                 *         // Extract custom fields from the UBL data that will be used during reconciliation
                 *         // For example, extract a custom serial number field
                 *         if (mapperLine.SerialNumber)
                 *         {
                 *             item.SetValue("Z_SerialNumberExtracted__", mapperLine.SerialNumber);
                 *         }
                 *
                 *         // Or transform existing data before reconciliation
                 *         var partNumber = item.GetValue("PartNumberExtracted__");
                 *         if (partNumber && partNumber.startsWith("LEGACY-"))
                 *         {
                 *             // Remove legacy prefix so it matches the PO
                 *             item.SetValue("PartNumberExtracted__", partNumber.substring(7));
                 *         }
                 *     }
                 * }
                 */
                Extraction.OnFillExtractedLineItemsFromMapperDocumentEnd = function (mapperDocument, extractedLineItems) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.DetermineCompanyCodeAndERPByDocumentName
                 * @description
                 * Allow to enable the determination of Company Code and ERP thanks to document name during extraction. For demo purpose only
                 * @returns {boolean} true if we want to try to determine Company Code or ERP through DocumentName
                 * @example
                 * <pre><code>
                 * DetermineCompanyCodeAndERPByDocumentName: function ()
                 * {
                 *		return true;
                 * },
                 * </code></pre>
                 */
                Extraction.DetermineCompanyCodeAndERPByDocumentName = function () {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Extraction.CustomizeTablesToIndex
                 * @since 316
                 * @description
                 * Allow to customize the table indexed at the start of the VIP's extractionscript
                 * @param {Array<string>} defaultTablesToIndex The default tables to index (added since 351)
                 * @returns {Array<string>}
                 * @example
                 * CustomizeTablesToIndex = function(defaultTablesToIndex)
                 * {
                 * 	return defaultTablesToIndex.concat(["Z_DEBItems__"]);
                 * }
                 */
                Extraction.CustomizeTablesToIndex = function (defaultTablesToIndex) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.ShouldClearExtractedLineItems
                 * @since 345
                 * @description
                 * Allows you to customize whether extracted line items should be cleared at the start of extraction.
                 * By default, line items are cleared when both AutolearningOnPOLines and EnableAutocompleteOnLineItems are disabled.
                 * Return true to force clearing regardless of these settings, or false to prevent clearing even when both features are disabled.
                 * @returns {boolean | void} true to force clearing of extracted line items. false to prevent clearing even when both AutolearningOnPOLines and EnableAutocompleteOnLineItems are disabled. Nothing (void) to use default behavior (clear when both features are disabled).
                 * @example <caption>Always preserve extracted line items for specific vendors</caption>
                 * Extraction.ShouldClearExtractedLineItems = function()
                 * {
                 * 	// Keep extracted line items for vendor "12345" even when autocomplete is disabled
                 * 	var vendorNumber = Data.GetValue("VendorNumber__");
                 * 	if (vendorNumber === "12345")
                 * 	{
                 * 		return false; // Prevent clearing
                 * 	}
                 * 	// Use default logic for other vendors
                 * }
                 *
                 * @example <caption>Always clear line items for specific company codes</caption>
                 * Extraction.ShouldClearExtractedLineItems = function()
                 * {
                 * 	// Always clear line items for company code "2000"
                 * 	var companyCode = Data.GetValue("CompanyCode__");
                 * 	if (companyCode === "2000")
                 * 	{
                 * 		return true; // Force clearing
                 * 	}
                 * }
                 */
                Extraction.ShouldClearExtractedLineItems = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.DisableCheckGenericLayoutTeaching
                 * @description
                 * Disabled CheckGenericLayoutTeaching to avoid overwriting the vendor number if it was already set (by teaching for example)
                 */
                Extraction.DisableCheckGenericLayoutTeaching = function () {
                };
                /**
                * @method Lib.AP.Customization.Extraction.OnFillNewLineItemEnd
                * @description
                * Allow to fill new line item using custom dimension or field
                * @returns {void}
                * @example
                * <pre><code>
                * OnFillNewLineItemEnd: function (source, lineItemToSet, vipLineItem, customDimensions)
                * {
                *  	function setValueAndSource(columnName: string, value: any): void
                *	{
                *		lineItemToSet.SetValue(columnName, value);
                *		lineItemToSet.SetComputedValueSource(columnName, source);
                *	}
                *
                *	const setTaxRateAndTaxAmount = function (item, taxRates, nonDeductibleTaxRates, roundingModes)
                *	{
                *		const taxRate = Lib.AP.SAP.TaxHelper.setTaxRate(item, taxRates, nonDeductibleTaxRates, roundingModes);
                *		const setTaxAmount = function (it, taxAmount)
                *		{
                *			it.SetValue("TaxAmount__", taxAmount);
                *			Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
                *		};
                *		Lib.AP.SAP.TaxHelper.computeTaxAmount(item.GetValue("Amount__"), taxRate, setTaxAmount, item);
                *	};
                *
                *	setValueAndSource("TaxJurisdiction__", vipLineItem.TaxJurisdiction);
                *	setValueAndSource("CompanyCode__", vipLineItem.CompanyCode);
                *	setValueAndSource("TradingPartner__", vipLineItem.TradingPartner);
                *	setValueAndSource("InternalOrder__", vipLineItem.InternalOrder);
                *
                *	if (!lineItemToSet.IsNullOrEmpty("TaxCode__"))
                *	{
                *		let headerCompanyCode = Data.GetValue<string>("CompanyCode__");
                *		Lib.AP.SAP.TaxHelper.getTaxRate(lineItemToSet.GetValue("TaxCode__"), "", headerCompanyCode, null, setTaxRateAndTaxAmount, lineItemToSet);
                *	}
                * },
                * </code></pre>
                */
                Extraction.OnFillNewLineItemEnd = function (source, lineItemToSet, vipLineItem, customDimensions) {
                };
                /**
                * @method Lib.AP.Customization.Extraction.AdjustJsonForPdf
                * @description
                * Allow to modify the JSON before generating the PDF
                * @returns {Lib.AP.VIPData} return the modified jsonValue
                * @example
                * <pre><code>
                * AdjustJsonForPdf: function (jsonValue)
                * {
                *		for (var i = 0; i < jsonValue.tables.LineItems.length; i++)
                *		{
                *			jsonValue.tables.LineItems[i].Amount = '';
                *			jsonValue.tables.LineItems[i].Description = '';
                *		}
                *		return jsonValue;
                * },
                * </code></pre>
                */
                Extraction.AdjustJsonForPdf = function (jsonValue) {
                };
                /**
                * @method Lib.AP.Customization.Extraction.ModifyTaxCodePredictionBounds
                * @description
                * Allows you to customize the tax code prediction's upper and lower bounds by adding a fixed value to them.
                * By using it you can search for tax codes with a tax rate that is slightly wider or narrower than the default bounds.
                * The filter used by the R&D to find the tax Code is : &(TaxRate__>=${taxRateLowerBound.toNumber()})(TaxRate__<=${taxRateUpperBound.toNumber()})
                * @param {object} calculatedTaxRate The tax rate lookup object calulated by the extraction script
                * @param {object} invoiceAmount The total amount of the invoice
                * @param {object} netAmount The net amount of the invoice
                * @example
                * <pre><code>
                * ModifyTaxCodePredictionBounds: function(calculatedTaxRate)
                * {
                * 	// Add 0.01 to the tax rate prediction upper and lower bounds
                * 	return 0.01;
                * }
                */
                Extraction.ModifyTaxCodePredictionBounds = function (calculatedTaxRate, invoiceAmount, netAmount) {
                    return null;
                };
                /**
                 * @typedef {object} Lib.AP.Customization.Extraction.XPathMapping
                 * @property {string} [XPath] A XPath to find the value to get.
                 * @property {string[]} [XPathList] List of XPath for a single field. The first XPath returning a node is used to get the value.
                 * @property {string} [FieldVIP] Field for Vendor invoice
                 * @property {string} [Attribute] Allow to specify the attribute to read on the selecting node.
                 * @property {string} [Default] The default value to set if no node is found
                 * @property {function} [Transform] A function to transform the value read from the node.
                 * @property {"MultiNode"} [Type] The type of the value read from the document. "MultiNode" allows to concat the values of multiple nodes occurrences
                 * @property {string | Array<string>} [HTMLId]
                 * @property {} [InferredField] value will be used to infer antoher field on the form. this inferred field will be map to the corresponding HTMLId on the HTML preview
                 */
                /**
                * Specifics customization for UBL mapping
                * @namespace Lib.AP.Customization.Extraction.MappingUBL
                */
                Extraction.MappingUBL = {
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingUBL.GetConversionTemplatePath
                     * @description
                     * Allows you to override the Crystal Reports template used for creating PDF files from XML data.
                     * This user exit is called at the end of the extraction script of the process.
                     * This user exit is only called when invoices in XML format are received by EDI.
                     * @param {String} defaultValue The default template used for conversion
                     * @returns {String} The template to used for conversion
                     * @example
                     * <pre><code>
                     * GetConversionTemplatePath: function (defaultValue)
                     * {
                     *      // choose a specific template for London Postmaster  in companyCode UK01
                     *  	if (Data.GetValue("CompanyCode__") === "UK01" && Data.GetValue("VendorNumber__") === "10000")
                     *  	{
                     * 			return "%Templates%\\VendorInvoiceUBL_UK01_10000.rpt";
                     * 		}
                     * }
                     * </code></pre>
                     */
                    GetConversionTemplatePath: function (defaultValue) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingUBL.CustomizeUBLMapping
                     * @description
                     * Allows to customize the mapping defined in Lib_AP_Mapping_UBL. This mapping is used to extract data from the EDI file.
                     * You can used the {@link Lib.AP.Customization.Extraction.FillWithFirstRecognitionResults} user exit if you need to fill form fields with this data.
                     * To fill line items, implement user exits {@link Lib.AP.Customization.Common.FillAdditionalLineFieldsFromMapper} and {@link Lib.P2P.Customization.Common.GetCustomDimensions}.
                     * Can also be used for EDIFACT files since EDIFACT files are converted to UBL before extraction (see {@link Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeInvoiceDataMapping} and {@link Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeGeneratedUBL})
                     * @param {String} componentName Value : XPathToAttachmentInformations|XPathToHeaderFields|XPathToLineItemInformations|XPathToTaxInformations|XPathToPaymentInformations
                     * @param {Lib.AP.Customization.Extraction.XPathMapping[]} originalMapping Standard mapping
                     * @returns {Lib.AP.Customization.Extraction.XPathMapping[]} Customized mapping
                     * @see {@link Lib.AP.Customization.Extraction.FillWithFirstRecognitionResults}
                     * @example <caption>Add a new field to the mapping</caption>
                     * CustomizeUBLMapping: function (componentName, originalMapping)
                     * {
                     * 		if (componentName === "XPathToHeaderFields")
                     * 		{
                     * 			originalMapping.push(
                     * 				{
                     * 					XPath: "cbc:Note",
                     * 					FieldVIP: "Z_CustomFreeText",
                     * 					HTMLId: "BT-22"
                     * 				}
                     * 			);
                     * 			return originalMapping;
                     * 		}
                     * }
                     * @example <caption>Modify an existing mapping to use XPathList and add format validation (since sprint 347)</caption>
                     * CustomizeUBLMapping: function (componentName, originalMapping)
                     * {
                     * 		if (componentName === "XPathToHeaderFields")
                     * 		{
                     * 			// Find the order number mapping
                     * 			const orderMapping = originalMapping.find(m => m.XPath === "cac:OrderReference/cbc:ID");
                     * 			if (orderMapping)
                     * 			{
                     * 				// Remove single XPath and HTMLId property
                     * 				delete orderMapping.XPath;
                     * 				delete orderMapping.HTMLId;
                     *
                     * 				// Add XPathList with multiple XPath sources
                     * 				orderMapping.XPathList = [
                     * 					"cac:OrderReference/cbc:ID",
                     * 					"cbc:BuyerReference"
                     * 				];
                     *
                     * 				// Define multiple HTMLIds to match the XPathList entries
                     * 				orderMapping.HTMLId = ["BT-13", "BT-10"];
                     *
                     * 				// Add format validation method
                     * 				orderMapping.HasExpectedFormat = function(value)
                     * 				{
                     * 					// Example: Check if value starts with "PO-" and has at least 3 digits
                     * 					return /^PO-\d{3,}$/.test(value);
                     * 				};
                     * 			}
                     * 			return originalMapping;
                     * 		}
                     * }
                     * @example <caption>Use local-name() to extract data from UBL extensions with dynamic namespaces</caption>
                     * CustomizeUBLMapping: function (componentName, originalMapping)
                     * {
                     * 		// Using local-name() to handle different namespaces in extensions
                     * 		// This works for both Invoice-2 and CreditNote-2 documents
                     * 		var extensionPath = "//ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent/inv:Data/inv:MessageReference";
                     *
                     * 		// Extract custom field from KSeF extension
                     * 		originalMapping.push({
                     * 			XPath: extensionPath + "/*[local-name()='AdditionalDocumentReference']/*[local-name()='ID'][.='KSeF is_reverse_charge__']/../*[local-name()='DocumentDescription']",
                     * 			FieldVIP: "Z_KSEFReverseCharge"
                     * 		});
                     *
                     * 		return originalMapping;
                     * }
                     */
                    CustomizeUBLMapping: function (componentName, originalMapping) {
                        return originalMapping;
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingUBL.CreditNodeTypeCodes
                     * @description
                     * Return a list of credit note codes
                     * @returns {string[]} An array of credit note codes
                     * @example
                     * <pre><code>
                     * CreditNodeTypeCodes: function ()
                     * {
                     * 		[Language.Translate("_CreditNote"), "81", "83", "261", "262", "381", "396", "532"];
                     * }
                     * </code></pre>
                     */
                    CreditNodeTypeCodes: function () {
                        return null;
                    },
                    /**
                    * @method Lib.AP.Customization.Extraction.MappingUBL.CustomizeUBLUseCodingTemplate
                    * @description
                    * Allow overriding the default useCodingTemplate value
                    * @param {boolean} defaultValue default useCodingTemplate value, inherited from Mapping.EDIDocument
                    * @returns {boolean} a customized value
                    */
                    CustomizeUBLUseCodingTemplate: function (defaultValue) {
                        return defaultValue;
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingUBL.ExtractAdditionalData
                     * @since 332
                     * @description
                     * Allows you to extract data from the UBL to fill in new object or array in the invoice JSON.
                     * If you just need to extract additional header fields or fields from one of the already extracted sections, please use the @see {@link Lib.AP.Customization.Extraction.MappingUBL.CustomizeUBLMapping} instead.
                     * You can use @see {@link Lib.AP.Customization.Extraction.FillWithFirstRecognitionResults} to fill in the form fields with the values extracted.
                     * @param {Lib.AP.Mapping.UBLInvoiceDocument} mappingDoc The current EDI Mapper document that holds the current state of the EDI extraction.
                     * @example <caption>Extract WHT tax codes from the UBL</caption>
                     * ExtractAdditionalData: function (mappingDoc)
                     * {
                     * 	// Parse withholding taxes from UBL (same data as for taxes)
                     * 	mappingDoc.jsonDoc.tables.WithholdingTaxes = [];
                     * 	mappingDoc.fillTableFromXPath.call(mappingDoc, "cac:WithholdingTaxTotal/cac:TaxSubtotal", mappingDoc.XPathToTaxInformations, mappingDoc.jsonDoc.tables.WithholdingTaxes, mappingDoc.xmlDom, true, Lib.AP.VIPTaxInformation, null, "LineItems__", Sys.AP.PreviewMappingLineType.TaxBreakdown);
                     * }
                     */
                    ExtractAdditionalData: function (mappingDoc) {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingUBL.SetCustomizedProcessingLabel
                     * @since 343
                     * @description
                     * Allows you to set a customized processing label for UBL invoices.
                     * You can use the user exit Lib.AP.Customization.Extraction.MappingUBL.CustomizeUBLMapping to extract the necessary data from the UBL invoice.
                     * @param {Lib.AP.VIPHeader} header Header of the VIP invoice being processed.
                     * @example <caption>Add BE2AP processingLabel if UBL is peppol v3.0 BIS for belgium B2B e-invoice</caption>
                     * SetCustomizedProcessingLabel: function (header)
                     * {
                     * 	if (header.CustomizationID === "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0"
                     *		&& header.VendorCountry === "BE"
                     *		&& header.CustomerCountry === "BE"
                     *	)
                     *	{
                     *		Variable.SetValueAsString("ProcessingLabel", "BE2AP");
                     *	}
                     */
                    SetCustomizedProcessingLabel: function (header) {
                    }
                };
                /**
                * Specifics customization for CII mapping
                * @namespace Lib.AP.Customization.Extraction.MappingCII
                */
                Extraction.MappingCII = {
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingCII.GetConversionTemplatePath
                     * @description
                     * Allows you to override the Crystal Reports template used for creating PDF files from XML data.
                     * This user exit is called at the end of the extraction script of the process.
                     * This user exit is only called when invoices in XML format are received by EDI.
                     * @param {String} defaultValue The default template used for conversion
                     * @returns {String} The template to used for conversion
                     * @example
                     * <pre><code>
                     * GetConversionTemplatePath: function (defaultValue)
                     * {
                     *      // choose a specific template for London Postmaster  in companyCode UK01
                     *  	if (Data.GetValue("CompanyCode__") === "UK01" && Data.GetValue("VendorNumber__") === "10000")
                     *  	{
                     * 			return "%Templates%\\VendorInvoiceCII_UK01_10000.rpt";
                     * 		}
                     * }
                     * </code></pre>
                     */
                    GetConversionTemplatePath: function (defaultValue) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingCII.CustomizeCIIMapping
                     * @description
                     * Allows to customize the mapping defined in Lib_AP_Mapping_CII. This mapping is used to extract data from the EDI file.
                     * You can used the {@link Lib.AP.Customization.Extraction.ExtendFirstTimeRecognition} user exit if you need to fill form fields with this data.
                     * To fill non-po line items, implement user exits {@link Lib.AP.Customization.Common.FillAdditionalLineFieldsFromMapper} and {@link Lib.P2P.Customization.Common.GetCustomDimensions}.
                     * @param {String} componentName Value : XPathToAttachmentInformations|XPathToHeaderFields|XPathToLineItemInformations|XPathToTaxInformations|XPathToPaymentInformations
                     * @param {Lib.AP.Customization.Extraction.XPathMapping[]} originalMapping Standard mapping
                     * @returns {Lib.AP.Customization.Extraction.XPathMapping[]} Customized mapping
                     * @see {@link Lib.AP.Customization.Extraction.FillWithFirstRecognitionResults}
                     * @example
                     * <pre><code>
                     * CustomizeCIIMapping:function(componentName, originalMapping)
                     *	{
                     *	 	if (componentName === "XPathToHeaderFields")
                     *		{
                     *			var siretMapping = originalMapping.find(mapping => mapping.FieldVIP == "InvoiceNumber");
                     *			siretMapping.XPath = "cbc:Test";
                     *			siretMapping.XPathList = null;
                     *			return originalMapping;
                     *		}
                     *
                     *		if (componentName === "XPathToLineItemInformations")
                     *		{
                     *			var siretMapping = originalMapping.find(mapping => mapping.FieldVIP == "Description");
                     *			siretMapping.XPath = "cbc:Test";
                     *			siretMapping.XPathList = null;
                     *			return originalMapping;
                     *		}
                     *	}
                     * </code></pre>
                    **/
                    CustomizeCIIMapping: function (componentName, originalMapping) {
                        return originalMapping;
                    }
                };
                /**
                * Specifics customization for EDIFACT mapping
                * @namespace Lib.AP.Customization.Extraction.MappingEDIFACT
                */
                Extraction.MappingEDIFACT = {
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeInvoiceDataMapping
                     * @description
                     * Allows to customize the invoice data mapping generated in Sys_EDIFACTExtraction.
                     * This invoice data mapping will be used to generate a UBL file which will be used for extraction in the Vendor invoice.
                     * You can customize the UBL generation using the {@link Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeGeneratedUBL} user exit.
                     * @param {object} jsonParsedDocument Intermediate JSON object representing the complete EDIFACT file
                     * @param {object} invoiceDataMapping Invoice JSON object generated from the EDIFACT file
                     * @returns {object} Customized invoice data mapping
                     * @see {@link Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeGeneratedUBL}
                     * @example
                     * <pre><code>
                     * CustomizeInvoiceDataMapping: function (jsonParsedDocument, invoiceDataMapping)
                     * {
                    * 	if (jsonParsedDocument && jsonParsedDocument.freeText.instances)
                     * 	{
                     * 		invoiceDataMapping.z_header_free_text__ = "";
                     * 		jsonParsedDocument.freeText.instances.forEach(fields =>
                     * 		{
                     * 			if (fields.fields.freeText01.value)
                     * 			{
                     * 				invoiceDataMapping.z_header_free_text__ += fields.fields.freeText01.value + "\n";
                     * 			}
                     * 		});
                     * 	}
                     * 	return invoiceDataMapping;
                     * }
                     * </code></pre>
                     */
                    CustomizeInvoiceDataMapping: function (jsonParsedDocument, invoiceDataMapping) {
                        return invoiceDataMapping;
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeGeneratedUBL
                     * @description
                     * Allows to customize the xml of the generated UBL file defined in Lib_AP_Mapping_EDIFACT
                     * This user exit allows to add/update/remove xml nodes.
                     * This user exit is called after converting the EDIFACT file to UBL.
                     * You can also use {@link Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeInvoiceDataMapping} to customize what is extracted from the EDIFACT file.
                     * You can customize the UBL extraction mapping using the {@link Lib.AP.Customization.Extraction.MappingUBL.CustomizeUBLMapping} user exit.
                     * @param {IXMLDomElement} xmlDomElement IXMLDomElement representing the generated UBL file.
                     * @param {object} invoiceDataMapping invoice data JSON containing the mapping data sent from SYS_EDIFACTExtraction, you can add some properties by customizing the user exit CustomizeInvoiceDataMapping() in order to get it back here.
                     * @returns {IXMLDomElement} xmlDomElement
                     * @see {@link Lib.AP.Customization.Extraction.MappingEDIFACT.CustomizeInvoiceDataMapping}
                     * @see {@link Lib.AP.Customization.Extraction.MappingUBL.CustomizeUBLMapping}
                     * @example
                     * <pre><code>
                     * CustomizeGeneratedUBL: function (xmlDomElement, invoiceDataMapping)
                     * {
                     * 	var cbcNoteElement = xmlDomElement.ownerDocument.createElement("cbc:Note");
                     * 	cbcNoteElement.text = invoiceDataMapping.z_header_free_text__;
                     * 	xmlDomElement.appendChild(cbcNoteElement);
                     * 	return xmlDomElement;
                     * }
                     * </code></pre>
                     */
                    CustomizeGeneratedUBL: function (xmlDomElement, invoiceDataMapping) {
                        return null;
                    }
                };
                /**
                 * @namespace Lib.AP.Customization.Extraction.EDI
                 */
                Extraction.EDI = {
                    /**
                     * @method Lib.AP.Customization.Extraction.EDI.ForceHumanReadablePDFGeneration
                     * @deprecated Use {@link Lib.AP.Customization.Extraction.EDI.EnableHumanReadablePDFGeneration} instead (since 329)
                     * @description
                     * Allows you to enforce the generation of a human readable PDF for UBL and CII invoices even if a preview is available.
                     * It does not apply to FatturaPA (UBL based) invoices since the generation of a human readable PDF is already enforced.
                     * @returns {boolean} true if a human readable PDF will be generated. False to apply the default behavior.
                     * @example <caption>Keep the human readable PDF generation for UBL/CII invoices</caption>
                     * EDI.ForceHumanReadablePDFGeneration = function ()
                     * {
                     *  	return true;
                     * }
                     */
                    ForceHumanReadablePDFGeneration: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.EDI.EnableHumanReadablePDFGeneration
                     * @since 329
                     * @description
                     * Allows you to enable or disable the generation of a human readable PDF for UBL and CII invoices.
                     * By default the generation of a human readable PDF is disabled for UBL and CII invoices, and enabled for FatturaPA (UBL based) invoices.
                     * @param {"fatturaPA"|"UBL"|"CII"|"CII_BASIC"|"CII_BASICWL"} ediType The type of the EDI document (e.g. UBL, CII)
                     * @param {boolean} currentValue The current value of the setting (true if a human readable PDF will be generated)
                     * @returns {boolean} true if a humand readable PDF will be generated, false otherwise.
                     * @example <caption>Keep the human readable PDF generation for UBL/CII invoices</caption>
                     * EDI.EnableHumanReadablePDFGeneration = function (editType, currentValue)
                     * {
                     *  	return true;
                     * }
                     * @example <caption>Disable the human readable PDF generation for 'fatturaPA'</caption>
                     * EDI.EnableHumanReadablePDFGeneration = function (editType, currentValue)
                     * {
                     * 	if (ediType === "fatturaPA")
                     * 	{
                     * 		return false;
                     * 	}
                     * 	return currentValue;
                     * }
                     */
                    EnableHumanReadablePDFGeneration: function (ediType, currentValue) {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.EDI.GetCustomFileNameList
                     * @since 332
                     * @description
                     * Retrieves a list of custom filenames to be checked
                     * @returns {string[]} Array of custom filename strings
                     * @example
                     * EDI.GetCustomFileNameList = function ()
                     * {
                     * 	return ["custom-edi.xml", "invoice-data.xml"];
                     * }
                     */
                    GetCustomFileNameList: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.EDI.DisableProcessingEmbeddedFiles
                     * @since 338
                     * @description
                     * Allows to disable the processing of embedded files
                     * @returns {boolean} true to disable the processing of embedded files
                     * @example
                     * <caption>Disable the processing of embedded files</caption>
                     * EDI.DisableProcessingEmbeddedFiles = function ()
                     * {
                     * 	if (Sys.Parameters.GetInstance("AP").GetParameter("ProcessEmbeddedXMLs", "1") === "0")
                     * 	{
                     * 		return true;
                     * 	}
                     * }
                     */
                    DisableProcessingEmbeddedFiles: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.EDI.CustomizeAttachEmbedded
                     * @since 346
                     * @description
                     * Allows to customize the embedded attachment after it has been converted and attached to the process.
                     * This user exit is called during the attachment of embedded documents in EDI invoices (UBL, CII, FacturX, etc.).
                     * You can use this user exit to perform additional processing on the attachment, such as:
                     * - Modifying the attachment properties
                     * - Extracting additional data from the attachment
                     * - Performing custom validation
                     * - Logging attachment information
                     * @param {Lib.AP.Mapping.AttachmentInformations} attachmentInformations The attachment information object
                     * @param {File} invoice The converted invoice file (temporary file after base64 decoding)
                     * @param {ESKMap<string>} result The result object from extension consistency check containing:
                     *   - extension: The determined file extension
                     *   - attachFileName: The final attachment filename
                     * @param {boolean} asFirstAttach Indicates whether this attachment should be attached as the first attachment
                     * @returns {void}
                     * @example
                     * <caption>Modifying attachment information</caption>
                     * EDI.CustomizeAttachEmbedded: function (attachmentInformations, invoice, result, asFirstAttach)
                     * {
                     *     var attachIndex = Attach.GetNbAttach() - 1;
                     *     if (invoice && attachIndex)
                     *     {
                     *         // Set a custom attachment name
                     *         Attach.SetValue(attachIndex, "AttachOutputName", "CustoName");
                     *
                     *         // Remove the "AttachAsFirst" flag if "asFirstAttach" parameter was set to true
                     *         if (asFirstAttach)
                     *         {
                     *             Attach.SetValue(attachIndex, "AttachAsFirst", false);
                     *         }
                     *     }
                     * }
                     * @example
                     * <caption>Set DocumentType on attachment if the attachment is marked as "Human readable"</caption>
                     * EDI.CustomizeAttachEmbedded: function (attachmentInformations, invoice, result, asFirstAttach)
                     * {
                     *     if (invoice)
                     *     {
                     *         var docDescription = attachmentInformations.DocumentDescription?.toLowerCase() || "";
                     *         if (docDescription.indexOf("human readable") !== -1)
                     *         {
                     *             var attachIndex = Attach.GetNbAttach() - 1;
                     *             Attach.SetValue(attachIndex, "DocumentType", "Human readable file");
                     *         }
                     *     }
                     * }
                     */
                    CustomizeAttachEmbedded: function (attachmentInformations, invoice, result, asFirstAttach) {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.EDI.GetSourceAttachmentIndex
                     * @since 359
                     * @description
                     * Allows you to override which input attachment is used as the source file for the mapper during extraction.
                     * This user exit is called after the standard attachment selection logic has computed the default attachment index.
                     * Return a custom attachment index to override the standard behavior, or null/void to keep the default attachment index.
                     * @param {number} defaultIdx The default attachment index computed by the standard extraction logic.
                     * @returns {number | null | void} A custom attachment index to use, or null/void to keep the default attachment index.
                     * @example <caption>Select the first XML attachment when it is not the first input attachment</caption>
                     * EDI.GetSourceAttachmentIndex = function (defaultIdx)
                     * {
                     * 	for (var i = 0; i < Attach.GetNbAttach(); i++)
                     * 	{
                     * 		if (Attach.GetInputFile(i).GetExtension().toLowerCase() === ".xml")
                     * 		{
                     * 			return i;
                     * 		}
                     * 	}
                     * 	return null;
                     * }
                     */
                    GetSourceAttachmentIndex: function (defaultIdx) {
                    }
                };
                /**
                 * Specifics customization for Reconciliation
                 * @namespace Lib.AP.Customization.Extraction.Reconciliation
                 */
                let Reconciliation;
                (function (Reconciliation) {
                    /**
                     * @typedef {object} Lib.AP.Customization.Extraction.Reconciliation.AdditionalReconciliationChecks
                     * @property {string} key is a string containing the name of the key field in the LineItems table, without
                     * underscores. It will be compared with its ExtractedLineItems equivalent using "===".
                     * If "Amount" or "Quantity" is given, the LineItems table will be searched using the expected amount.
                     * Ex: "Amount" would compare ExpectedAmount__ in the line items table and AmountExtracted__ in the
                     * ExtractedLineItems table using ===.
                     * @property {string} field is a string containing the name of the field in the LineItems table. It is used like
                     * the object.key but is instead compared using the comparer function after the keys are verified.
                     * @property {Function} comparer is a function taking in two values to compare. It should return 0 if equal, and -1 otherwise.
                     * Used to compare the values for object.field.
                     * @property {boolean} noReconcilePass optional - set to true to prevent a reconcile pass with this field (the field can be used in other user exits).
                     */
                    /**
                     * @typedef {object} Lib.AP.Customization.Extraction.Reconciliation.ReconcileBestMatch
                     * @property {string} matches The update list of reconciliation matches (usually one of the matches given in parameter of the DetermineBestMatch user exit)
                     * @property {boolean} bForceMatchPOLineToMultipleGRs optional - if matches still contains multiple matches, you can set this to true to force the matching against multiple line items (which only works if the extracted quantity equals the sum of expected quantities of all of the matching line items)
                     */
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.GetHeaderFooterThreshold
                     * @description
                     * Allows to override the computation of the threshold used on Header/Footer reconciliation mode.
                     * By default, we used the value from Sys.Parameters.GetInstance("AP").GetParameter("HeaderFooterThreshold")
                     * and the value returned is used to determine if the difference between the expected invoiced amount and the
                     * invoice amount is within the threshold.
                     * @param {number} totalExpectedAmount The sum of the PO lines amount.
                     * @param {number} extractedInvoiceAmount The invoice amount extracted from the document (Data.GetValue("InvoiceAmount__"))
                     * @returns {number} The maximum amount allowed to consider that the Header/Footer reconciliation is valid
                     * @example <caption></caption>
                     * Reconciliation.GetHeaderFooterThreshold = function (totalExpectedAmount, extractedInvoiceAmount)
                     * {
                     * 	// In this example, the threshold is based on a fixed amount from the wizard and a % of the expected invoiced amount
                     * 	// We return the lower of those two values to have an AND condition between the fixed amount and the percentage
                     * 	var thresholdByValue = parseFloat(Sys.Parameters.GetInstance("AP").GetParameter("HeaderFooterThreshold"));
                     * 	var thresholdByPercentage = totalExpectedAmount * 0.1;
                     * 	return Math.min(thresholdByValue, thresholdByPercentage);
                     * }
                     */
                    Reconciliation.GetHeaderFooterThreshold = function (totalExpectedAmount, extractedInvoiceAmount) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.CustomizeCompareLines
                     * @since 332
                     * @description
                     * Allows customization of the line comparison during the reconciliation process.
                     * This function is called during the reconciliation process to compare two lines (for each reconciliation passes).
                     * You can use this function to override the default line keys comparison.
                     * Return a boolean to fully override the comparison result of the two lines (the returned value is used as-is,
                     * so it must take both the keys and the field comparison into account). Return nothing (void) to keep the
                     * standard behaviour (the standard field comparison is then applied on top of the keys match).
                     * @param {boolean} isKeyMatch A boolean indicating if the keys of the two lines match.
                     * @param {any} line1 The first line to compare, usually from the ExtractedLineItems table.
                     * @param {any} line2 The second line to compare, usually from the LineItems table.
                     * @param {string} key The key to compare.
                     * @param {string} field The field to compare.
                     * @param {Function} compareFieldsCallback The standard comparer used for the field of the current pass (returns 0 when the field values match). (since S358)
                     * @returns {boolean | void} true to force a match, false to force a non-match, or void to keep the standard behaviour.
                     * @example <caption>Example of a user exit that normalizes the DeliveryNote check for SAP ERP</caption>
                     * Reconciliation.CustomizeCompareLines = function(isKeyMatch, line1, line2, key, field, compareFieldsCallback)
                     * {
                     * 	if (!isKeyMatch && key === "DeliveryNote" && Lib.ERP.IsSAP())
                     * 	{
                     * 		// Normalize the DeliveryNote key for SAP ERP
                     * 		const line1Key = line1[key];
                     * 		const line2Key = line2[key];
                     * 		if(line1Key.length < 10 && line2Key.length === 10)
                     * 		{
                     * 			isKeyMatch = (Sys.Helpers.String.SAP.NormalizeID(line1Key, 10) === line2Key);
                     * 		}
                     * 		else if(line2Key.length < 10 && line1Key.length === 10)
                     * 		{
                     * 			isKeyMatch = (Sys.Helpers.String.SAP.NormalizeID(line2Key, 10) === line1Key);
                     * 		}
                     * 		// Return the full comparison result (keys AND field) since a boolean return value is used as-is
                     * 		return isKeyMatch && compareFieldsCallback(line1[field], line2[field]) === 0;
                     * 	}
                     * 	// Return a boolean to fully decide whether the lines match (bypasses the standard field comparer).
                     * 	return isKeyMatch && compareFieldsCallback(line1[field], line2[field]) === 0;
                     * }
                     * @example <caption>Example of a user exit that normalizes the PartNumber before delegating to the standard field comparer</caption>
                     * Reconciliation.CustomizeCompareLines = function(isKeyMatch, line1, line2, key, field, compareFieldsCallback)
                     * {
                     * 	if (isKeyMatch && field === "PartNumber")
                     * 	{
                     * 		// Normalize the part numbers, then delegate the field comparison to the standard comparer.
                     * 		const part1 = String(line1[field]).replace(/[\s-]/g, "");
                     * 		const part2 = String(line2[field]).replace(/[\s-]/g, "");
                     * 		return compareFieldsCallback(part1, part2) === 0;
                     * 	}
                     * }
                     */
                    Reconciliation.CustomizeCompareLines = function (isKeyMatch, line1, line2, key, field, compareFieldsCallback) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.GetAdditionalReconciliationChecks
                     * @description
                     * Allows custom reconciliation passes. This function is called after the normal four passes. See the function "reconcile" in LIB_AP_RECONCILIATION.
                     * To create additional passes, return an array of objects.
                     * Each object should have these properties: key, "field", "comparer", and if needed "keysComparer" (optionnal, since S334).
                     * Without keysComparer property, lines will be reconciled if the extracted value for key strictly equals the master data value for key, and comparer returns 0.
                     * With keysComparer property, lines will be reconciled if keysComparer property returns true, and comparer returns 0.
                     * Comparer should return 0 if the extracted value for field matches the master data value for field.
                     * keysComparer should return true if the extracted value for key matches the master data value for key, or false if it does not match.
                     * @returns {Lib.AP.Customization.Extraction.Reconciliation.AdditionalReconciliationChecks[]} List of objects containing key, field, comparer, keysComparer (optionnal) parameters.
                     * @example <caption>
                     * 	Add the DeliveryNote and PONumber to the reconciliation checks
                     * 	Add the Amount to the reconciliation checks
                     * 	Also add the Quantity as information to be available in Lib.AP.Customization.Extraction.Reconciliation.DetermineBestMatch
                     * </caption>
                     * Reconciliation.GetAdditionalReconciliationChecks = function()
                     * {
                     * 	let compareAmount = function(amount1, amount2)
                     * 	{
                     * 		return amount1 && amount2 && amount1 === amount2 ? 0 : -1;
                     * 	};
                     *
                     * 	let compareCaseInsensitive = function(extractedValue, lineItemValue)
                     * 	{
                     * 		return extractedValue && lineItemValue && extractedValue.toLowerCase() === lineItemValue.toLowerCase();
                     * 	};
                     *
                     * 	return [
                     *  	{key: "DeliveryNote", field: "PONumber", comparer: compareCaseInsensitive, keysComparer: compareCaseInsensitive},
                     *  	{key: "UnitPrice", field: "Amount", comparer: compareAmount},
                     *  	{key: "Quantity", field: "Quantity", noReconcilePass: true}
                     * ];
                     * }
                     */
                    Reconciliation.GetAdditionalReconciliationChecks = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.GetReconciliationPassesOrder
                     * @since 358
                     * @description
                     * Allows consultants to change the execution order of the reconciliation passes.
                     * This user exit is called in Lib_AP_Reconciliation (function "reconcile") after building the full list of
                     * reconciliation passes: the 4 standard passes (DeliveryNote_PartNumber, DeliveryNote_UnitPrice,
                     * PONumber_PartNumber, PONumber_UnitPrice) followed by any custom passes returned by GetAdditionalReconciliationChecks.
                     * Return an array of pass ids describing the wanted execution order
                     * (e.g. "PONumber_PartNumber" or "Z_EAN_PONumber").
                     * Any pass not listed in the returned array is automatically appended at the end, preserving the default order.
                     * Unknown ids are ignored. Return nothing (or an empty array) to keep the default order.
                     * @param {Lib.AP.Customization.Extraction.Reconciliation.ReconciliationPassInfo[]} reconciliationPasses The list of reconciliation passes, in their default order.
                     * @param {string[]} reconciliationPassIds The ids of the reconciliation passes, in their default order (shortcut for reconciliationPasses.map(p => p.id)).
                     * @returns {string[]|void} The wanted execution order as a list of pass ids, or void to keep the default order.
                     *
                     * @example <caption>Run the PO Number passes before the Delivery Note passes</caption>
                     * Reconciliation.GetReconciliationPassesOrder = function (reconciliationPasses, reconciliationPassIds)
                     * {
                     * 	return ["PONumber_PartNumber", "PONumber_UnitPrice", "DeliveryNote_PartNumber", "DeliveryNote_UnitPrice"];
                     * }
                     * @example <caption>Prioritise a custom EAN/PO pass before the standard passes (unlisted passes keep their default order at the end)</caption>
                     * Reconciliation.GetReconciliationPassesOrder = function (reconciliationPasses, reconciliationPassIds)
                     * {
                     * 	return ["Z_EAN_PONumber"];
                     * }
                     * @example <caption>Build the order dynamically from the provided passes (custom passes first)</caption>
                     * Reconciliation.GetReconciliationPassesOrder = function (reconciliationPasses, reconciliationPassIds)
                     * {
                     * 	var customPasses = reconciliationPasses.filter(function (pass) { return pass.isCustom; });
                     * 	return customPasses.map(function (pass) { return pass.id; });
                     * }
                     */
                    Reconciliation.GetReconciliationPassesOrder = function (reconciliationPasses, reconciliationPassIds) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.GetExtendedFillLinesFromPOCriteria
                     * @description
                     * Allows to refine the reconciliation process, by adjusting the filter used to retrieve line items.
                     * This function is called before performing the reconciliation, when the line items are added on the form.
                     * @param {String} filter The standard filter used to retrieve PO items
                     * @param {String} orderNumber The order number of the current PO
                     * @param {String} type The PO type of the current PO
                     * @param {String} buyer The buyer of the current PO
                     * @param {String} receiver The receiver of the current PO
                     * @param {String} diffInv The different invoicing party of the current PO
                     * @returns {String} The filter used to find and fill the line items before the reconciliation
                     * @example <caption></caption>
                     * Reconciliation.GetExtendedFillLinesFromPOCriteria = function (filter, orderNumber, type, buyer, receiver, diffInv)
                     * {
                     * 		// Refine the filter to only add lines for which the Reference has been extracted by Teaching / Auto-learning
                     * 		var extractedItemTable = Data.GetTable("ExtractedLineItems__");
                     * 		var extractedItemCount = extractedItemTable.GetItemCount();
                     * 		var extractedReferencesForPO = [];
                     * 		for (var index = 0; index < extractedItemCount; index++)
                     * 		{
                     * 			var extractedItem = extractedItemTable.GetItem(index);
                     * 			var itemOrderNumber = extractedItem.GetValue("OrderNumberExtracted__");
                     * 			if (itemOrderNumber === orderNumber)
                     * 			{
                     * 				extractedReferencesForPO.push(extractedItem.GetValue("PartNumberExtracted__"));
                     * 			}
                     * 		}
                     * 		// Limit the References to 200 according to R&D recommendations for the API FilterIn
                     * 		if (extractedReferencesForPO.length < 200)
                     * 		{
                     * 			filter = Sys.Helpers.LdapUtil.FilterAnd(
                     * 				filter,
                     * 				Sys.Helpers.LdapUtil.FilterIn("PartNumber__", extractedReferencesForPO)
                     * 			);
                     * 		}
                     * 		else
                     * 		{
                     * 			Log.Warn("GetFillLinesFromPOFilter : " + extractedReferencesForPO.length + " candidates for PO " + orderNumber);
                     * 		}
                     * 		return filter;
                     * }
                     */
                    Reconciliation.GetExtendedFillLinesFromPOCriteria = function (filter, orderNumber, type, buyer, receiver, diffInv) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.GetCustomOrderNumberCandidates
                     * @description
                     * Allows to refine or extend the selection of PO candidates for reconciliation.
                     * This function is called before filling the line items from the PO candidates, before the reconciliation occurs.
                     * @param {Lib.AP.Customization.Extraction.Candidate[]}} Standard list of PO Candidates used for PO Reconciliation
                     * @returns {Lib.AP.Customization.Extraction.Candidate[]} Custom list of PO Candidates used for PO Reconciliation
                     * @example <caption></caption>
                     * Reconciliation.GetCustomOrderNumberCandidates = function(orderNumbersCandidates)
                     * {
                     * 	// Add taught PO from lines to the PO candidates, in case taught PO numbers at line level have been transformed by a Teaching rule
                     * 	var extractedItemTable = Data.GetTable("ExtractedLineItems__");
                     * 	var extractedItemCount = extractedItemTable.GetItemCount();
                     * 	orderNumbersCandidates = orderNumbersCandidates || [];
                     * 	for (var i = 0; i < extractedItemCount; i++)
                     * 	{
                     * 		var POnumber = extractedItemTable.GetItem(i).GetValue("OrderNumberExtracted__");
                     * 		// Do not consider PO numbers that were already checked
                     * 		var isAlreadyCandidate = orderNumbersCandidates.some(function (candidate)
                     * 		{
                     * 			return candidate.standardStringValue === POnumber;
                     * 		});
                     * 		if (isAlreadyCandidate)
                     * 		{
                     * 			Log.Verbose("PO # " + POnumber + " is already a candidate");
                     * 		}
                     * 		else
                     * 		{
                     * 			var orderNumber = {};
                     * 			orderNumber.standardStringValue = POnumber;
                     * 			orderNumbersCandidates.push(orderNumber);
                     * 			Log.Verbose("New candidate PO # " + POnumber);
                     * 		}
                     * 	}
                     * 	return orderNumbersCandidates;
                     * }
                     */
                    Reconciliation.GetCustomOrderNumberCandidates = function (orderNumbersCandidates) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.ResolveTaughtPOMatches
                     * @since 365
                     * @description
                     * Allows you to control which PO headers matching the taught order number(s) are used to fill invoice
                     * lines, and which order numbers are persisted on `OrderNumber__`.
                     * The PO-header search covers all order numbers that were taught on the invoice, so `recordList` may contain
                     * PO headers for any of those numbers (including extended-search matches such as half-width variants).
                     * By default, once the exact taught PO number is found among the query results, the standard behavior stops
                     * there, binds the original OCR area to `OrderNumber__`, and discards any other matching PO headers.
                     * Implement this user exit to process every returned PO header (for example when several PO numbers were
                     * taught on the same invoice) instead of stopping at the exact match.
                     *
                     * Returning `void`/`undefined` keeps the standard strict-match behavior.
                     * Returning an array is a shortcut for `{ recordsToProcess: array }`; it fills lines from every record in
                     * the array and persists all of their order numbers on `OrderNumber__` without binding the OCR area.
                     * Returning an object lets you explicitly choose:
                     *   - `recordsToProcess`: the PO header records to fill lines from,
                     *   - `orderNumbersToPersist`: the values joined into `OrderNumber__` (defaults to every processed record's `OrderNumber__`),
                     *   - `bindOrderNumberArea`: `true` to keep the standard OCR-area binding (3-arg `Data.SetValue`), `false` to use plain value synthesis (2-arg `Data.SetValue`).
                     * @param {String} orderNumber The taught order number used as the strict-match reference: the first value of `OrderNumber__` (as returned by `Lib.AP.GetFirstOrderNumber()`), before any search-criteria extension
                     * @param {ESKMap[]} recordList The PO header records returned by the search query (OrderNumber__, Buyer__, Receiver__, DifferentInvoicingParty__, IsLocalPO__, Currency__, plus any custom PO header attributes)
                     * @param {Object} context Additional context: { type: the caller-supplied line type (optional/nullable), ERPConnected: whether the process is ERP-connected }
                     * @returns {ESKMap[] | Object | void} The list of PO header records to process, an explicit result object, or void/undefined to keep the standard strict-match behavior
                     * @example <caption>Process every matching PO and keep the OCR area bound to the taught value</caption>
                     * Reconciliation.ResolveTaughtPOMatches = function (orderNumber, recordList, context)
                     * {
                     * 		return {
                     * 			recordsToProcess: recordList,
                     * 			orderNumbersToPersist: recordList.map(function (record) { return record.OrderNumber__; }),
                     * 			bindOrderNumberArea: true
                     * 		};
                     * }
                     */
                    Reconciliation.ResolveTaughtPOMatches = function (orderNumber, recordList, context) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.OnPOCandidatesValidationEnd
                     * @since 350
                     * @description
                     * Called after PO candidate order numbers have been validated against the database.
                     * This user exit allows you to inspect which order numbers were found and which were not found in master data.
                     * It is called even when no candidates are found in the database (validatedOrderNumberList is empty).
                     * @param {string[]} orderNumbers The cleaned/standardized order numbers that were searched
                     * @param {Candidate[]} orderNumbersCandidates The raw extracted candidates from the document
                     * @param {ESKMap[]} validatedOrderNumberList The PO header records found and validated in the database
                     * @returns {void}
                     * @example <caption>Store not-found order numbers in a variable for display</caption>
                     * Reconciliation.OnPOCandidatesValidationEnd = function (orderNumbers, orderNumbersCandidates, validatedOrderNumberList)
                     * {
                     *     var validatedNumbers = validatedOrderNumberList.map(function (record) { return record.OrderNumber__; });
                     *     var notFoundOrders = orderNumbers.filter(function (orderNumber)
                     *     {
                     *         return validatedNumbers.indexOf(orderNumber) === -1;
                     *     });
                     *     if (notFoundOrders.length > 0)
                     *     {
                     *         Variable.SetValueAsString("NotFoundPO", notFoundOrders.join(","));
                     *         Log.Info("PO numbers not found in master data: " + notFoundOrders.join(", "));
                     *     }
                     * };
                     * @example <caption>PS implementation: filter and deduplicate candidates, then store the ones not found in database</caption>
                     * Reconciliation.OnPOCandidatesValidationEnd = function (orderNumbers, orderNumbersCandidates, validatedOrderNumberList)
                     * {
                     *     var notFoundArray = orderNumbers.slice();
                     *     notFoundArray = notFoundArray.filter(function (po) { return /\S/.test(po); });
                     *     // Remove duplicates
                     *     notFoundArray = notFoundArray.filter(function (value, index, self) { return self.indexOf(value) === index; });
                     *     for (var i = 0; i < validatedOrderNumberList.length; i++)
                     *     {
                     *         var found = validatedOrderNumberList[i].OrderNumber__;
                     *         var index = notFoundArray.indexOf(found);
                     *         if (index !== -1)
                     *         {
                     *             notFoundArray.splice(index, 1);
                     *         }
                     *     }
                     *     Variable.SetValueAsString("NotFoundPO", notFoundArray.toString());
                     * };
                     */
                    Reconciliation.OnPOCandidatesValidationEnd = function (orderNumbers, orderNumbersCandidates, validatedOrderNumberList) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.UseHeaderReconciliationWhenNoLineReconciled
                     * @description
                     * When line reconciliation failed, uses header/footer reconciliation to fill the line items with the expected amounts and quantities even if the invoice total doesn't match the PO expected amounts perfectly
                     * @returns {boolean} if true, enables header/footer reconciliation when line reconciliation failed
                     * @example <caption></caption>
                     * Reconciliation.UseHeaderReconciliationWhenNoLineReconciled = function()
                     * {
                     * 	return true;
                     * }
                     */
                    Reconciliation.UseHeaderReconciliationWhenNoLineReconciled = function () {
                        return null;
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.GetReconciledFieldsMapping
                     * @since 331
                     * @description
                     * [Server] Allows to customize the mapping of fields used for line items reconciliation.
                     * @returns {Record<string, string>} a mapping with the fields to use for customizing the line items reconciliation.
                     * @example <caption>Return a custom mapping for line items reconciliation</caption>
                     * Reconciliation.GetReconciledFieldsMapping = function()
                     * {
                     * 	return {
                     * 		"Z_LineItemsExtractedCustom__": "Z_LineItemsExtractedCustomExtracted__"
                     * 	};
                     * }
                     */
                    Reconciliation.GetReconciledFieldsMapping = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.DetermineBestMatch
                     * @since 332
                     * @description
                     * [Server] Allows to add custom logic to determine the best association when an extracted line item matches multiple line items (PO or GR).
                     * By default such lines are not reconciled.
                     * This function can also be used to force the matching against multiple line items (which only works if the extracted quantity equals the sum of expected quantities of all of the matching line items)
                     * @param {Lib.AP.Reconciliation.ReconcileMatch[]} matches list of matching line items for the current extracted lines. Will always be an array of length > 1 when called.
                     * @param {Lib.AP.Reconciliation.ReconcileObject} reconcileObj The global object containing the current state of the reconciliation algorithm.
                     * @returns {Lib.AP.Customization.Extraction.Reconciliation.ReconcileBestMatch} an object containing the updated matches list and optionally a boolean to force the matching against multiple line items.
                     * @example <caption>In case of multiple match always pick the first line</caption>
                     * Reconciliation.DetermineBestMatch = function(matches, reconcileObj)
                     * {
                     * 	// Always assign on first matching line
                     * 	return {
                     * 		matches: [matches[0]]
                     * 	};
                     * }
                     */
                    Reconciliation.DetermineBestMatch = function (matches, reconcileObj) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.CustomizeReconcilePassMatchProcessing
                     * @since 332
                     * @description
                     * Allows customization of the reconciliation pass match processing.
                     * @param {Lib.AP.Reconciliation.ReconcileMatch[]} matches list of matching line items for the current extracted lines.
                     * @param {Lib.AP.Reconciliation.ReconcileObject} reconcileObj The global object containing the current state of the reconciliation algorithm.
                     * @param {object} passObj The current reconciliation pass object, containing the key and field to be processed.
                     * @param {number} index The index of the current extracted line item being processed.
                     * @param {number} nLinesExtracted The number of lines extracted from the document.
                     * @param {number} nLineReconciled The number of lines reconciled so far.
                     * @returns {Lib.AP.Customization.Extraction.Reconciliation.CustomReconciliationPassMatchProcessing} an object containing the updated index, nLinesExtracted, and nLineReconciled.
                     * @example <caption>Disable "Third pass check PO Number and Part Number" reconciliation match</caption>
                     * Reconciliation.CustomizeReconcilePassMatchProcessing = function(matches, reconcileObj, passObj, index, nLinesExtracted, nLineReconciled)
                     * {
                     * 	// Return an object with same values passed in parameters to disable the third pass check PO Number and Part Number
                     * 	// This will prevent the third pass from being executed
                     * 	if (passObj.key === "PONumber" && passObj.field === "PartNumber")
                     * 	{
                     * 		return {
                     * 			index: index,
                     * 			nLinesExtracted: nLinesExtracted,
                     * 			nLineReconciled: nLineReconciled
                     * 		};
                     * 	}
                     * 	return;
                     * }
                     */
                    Reconciliation.CustomizeReconcilePassMatchProcessing = function (matches, reconcileObj, passObj, index, nLinesExtracted, nLineReconciled) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.OnInitializeReconcileObjectEnd
                     * @since 333
                     * @description
                     * Allows customization of the reconciliation object after its initialization.
                     * @param {Lib.AP.Reconciliation.ReconcileObject[]} reconcileObj reconciliation object to customize.
                     * @param {string[]} userExitMapEntries extended field list used by user exits
                     * @example <caption>Reconcile only PO line not already confirmed (field Z_AlreadyConfirmed__)</caption>
                     * Reconciliation.OnInitializeReconcileObjectEnd = function(reconcileObj, userExitMapEntries)
                     * {
                     * 		obj.LinesFromPO = [];
                     * 		if (obj.LinesExtracted.length > 0)
                     * 		{
                     * 			const lineItems = Data.GetTable("LineItems__");
                     * 			const map = { PONumber: "OrderNumber__", PartNumber: "PartNumber__", UnitPrice: "UnitPrice__", DeliveryNote: "DeliveryNote__" };
                     * 			// Add user exit fields to map
                     *  		for (const additionalEntry of userExitMapEntries)
                     * 			{
                     * 				if (!map[additionalEntry])
                     * 				{
                     * 					map[additionalEntry] = additionalEntry === "Amount" || additionalEntry === "Quantity" ?
                     * 						`Expected${additionalEntry}__` : `${additionalEntry}__`;
                     * 				}
                     * 			}
                     * 			for (let i = 0; i < lineItems.GetItemCount(); i++)
                     * 			{
                     * 				const item = lineItems.GetItem(i);
                     * 				if (!Lib.P2P.InvoiceLineItem.IsPOLineItemEmpty(item) && !item.GetValue("Z_AlreadyConfirmed__")))
                     * 				{
                     * 					obj.LinesFromPO.push(Lib.AP.Reconciliation.readTableLine(lineItems, i, map));
                     * 				}
                     * 			}
                     * 		}
                     * }
                     **/
                    Reconciliation.OnInitializeReconcileObjectEnd = function (reconcileObj, userExitMapEntries) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.ModifyPORecordMaxAgeInMonths
                     * @since 338
                     * @description
                     * Allows you to customize the maximum age in months for PO records during reconciliation (default is 16).
                     * This user exit is called to determine how old PO records can be before they are considered too old for reconciliation.
                     * @param {string} orderNumber The PO record order number being evaluated.
                     * @param {number[]} orderDate The PO record date as an array [year, month, day].
                     * @returns {number| void} The maximum age in months for PO records, or void to use the default system value
                     * @example <caption>Set different age limits based on company code</caption>
                     * Reconciliation.ModifyPORecordMaxAgeInMonths = function (orderNumber, orderDate)
                     * {
                     * 	const companyCode = Data.GetValue("CompanyCode__");
                     * 	if (companyCode === "US01")
                     * 	{
                     * 		// US company: allow PO records up to 24 months old
                     * 		return 24;
                     * 	}
                     * 	else if (companyCode === "FR01")
                     * 	{
                     * 		// French company: allow PO records up to 12 months old
                     * 		return 12;
                     * 	}
                     * 	// Use default value for other company codes
                     * 	return 18;
                     * }
                     */
                    Reconciliation.ModifyPORecordMaxAgeInMonths = function (orderNumber, orderDate) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.CustomFilterFillLinesFromGRItems
                     * @since 339
                     * @description
                     * Customize the filter for filling lines from Goods Receipt (GR) items.
                     * @param defaultFilter The default filter to be customized
                     * @returns {string} The customized filter to be used for retrieving GR items
                     * @example <caption>Example of a user exit that adds a custom condition to the default filter</caption>
                     * <pre><code>
                     * Reconciliation.CustomFilterFillLinesFromGRItems = function (defaultFilter)
                     * {
                     * 		return `&(${defaultFilter}(Z_Region=${Data.GetValue("Z_Region__")}))`;
                     * }
                     * </code></pre>
                     */
                    Reconciliation.CustomFilterFillLinesFromGRItems = function (defaultFilter) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.OnSetReconciledLineItem
                     * @since 342
                     * @description
                     * Called when a line item has been successfully reconciled to modify lineitem object values.
                     * @param {Item} lineItem
                     * @param {Item} extractedLineItem
                     * @param {string} additionalExtractedLineItem
                     * @param {Area} extractedLineItemValue
                     * @param {Lib.AP.Reconciliation.ReconcileMatch} lineReconciled (added since 345)
                     * @example <caption>Example of a user exit that sets a custom field on the reconciled line item</caption>
                     * Reconciliation.OnSetReconciledLineItem: function (lineItem, extractedLineItem, additionalExtractedLineItem, extractedLineItemValue, lineReconciled)
                     * {
                     *     lineItem.SetValue("Z_CustomField__", extractedLineItem.GetValue("Z_CustomField__"));
                     * }
                     */
                    Reconciliation.OnSetReconciledLineItem = function (lineItem, extractedLineItem, additionalExtractedLineItem, extractedLineItemValue, lineReconciled) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.OnReconcileInvoiceEnd
                     * @since 363
                     * @description
                     * Allows to perform custom actions once the reconciliation process is done.
                     * @param {boolean} isReconciliationDone True if the reconciliation has been done, false otherwise.
                     * @param {string} reconciliationType The reconciliation type used
                     * @param {Lib.AP.Reconciliation.ReconcileObject} [reconcileObject] The completed reconciliation object, available when line reconciliation was performed. Contains the PO lines, extracted lines, reconciled lines, and additional user-exit checks.
                     * @example
                     * <pre><code>
                     * OnReconcileInvoiceEnd: function (isReconciliationDone, reconciliationType, reconcileObject)
                     * {
                     *   	if (!isReconciliationDone)
                     *  	{
                     *  		// Log that the reconciliation has failed
                     *  		Log.Info("Reconciliation failed for invoice RUID: " + Data.GetValue("RUID__"));
                     *  	}
                     * }
                     * </code></pre>
                     */
                    Reconciliation.OnReconcileInvoiceEnd = function (isReconciliationDone, reconciliationType, reconcileObject) {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.ShouldReloadAllPOLines
                     * @since 347
                     * @description
                     * User exit to determine if all PO lines should be reloaded during autocomplete action.
                     * When returning true, the system will clear existing line items and reload fresh PO/GR data
                     * from the ERP before performing reconciliation.
                     * This is useful for customers where GR data may not be available at the time of invoice submission,
                     * allowing AP specialists to get the latest PO/GR lines when performing autocomplete at a later time.
                     * @returns {boolean} - Return true to enable PO line reload, false or undefined to use standard behavior
                     * @example <caption>Always reload PO lines during autocomplete</caption>
                     * Reconciliation.ShouldReloadAllPOLines = function()
                     * {
                     *     return true;
                     * }
                     */
                    Reconciliation.ShouldReloadAllPOLines = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.Extraction.Reconciliation.IsBalanceWithinThreshold
                     * @since 353
                     * @description
                     * User exit to customize the handling of the balance threshold during header/footer reconciliation.
                     * @param {number} sum The sum of the expected amounts.
                     * @param {number} threshold The threshold value.
                     * @returns {boolean} - Return true to force the balance to be within the threshold, false to force it to be out of the threshold, or undefined to use standard behavior.
                     * @example <caption>Custom balance threshold handling</caption>
                     * Reconciliation.IsBalanceWithinThreshold = function (sum, threshold)
                     * {
                     *     const invoiceAmount = Data.GetValue<number>("InvoiceAmount__");
                     *     const fieldThreshold = parseFloat(Variable.GetValueAsString("BalanceThreshold"));
                     *
                     *     return Math.abs(invoiceAmount - sum) <= threshold && Math.abs(invoiceAmount - sum) <= fieldThreshold;
                     * }
                     */
                    Reconciliation.IsBalanceWithinThreshold = function (sum, threshold) {
                    };
                })(Reconciliation = Extraction.Reconciliation || (Extraction.Reconciliation = {}));
                ;
                /**
                 * @namespace Lib.AP.Customization.Extraction.UDCDetection
                 */
                Extraction.UDCDetection = {
                    /**
                     * @method Lib.AP.Customization.Extraction.UDCDetection.GetCustomDimensions
                     * @description
                     * Allows you to add custom dimensions at Unplanned Delivery Cost (UDC) detection step.
                     * You have to add the custom field:
                     * - In the vendor invoice process (new column in the table LineItems__)
                     * - To the CT "P2P - Unplanned Delivery Cost Detection"
                     * (the fields must have the same name)
                     * @returns {string[]} List of custom dimensions fields to retrieve along UDC detection.
                     * @example
                     * <pre><code>
                     * GetCustomDimensions: function()
                     * {
                     *     return ["Z_ProjectCode"];
                     * }
                     * </code></pre>
                     */
                    GetCustomDimensions: function () {
                        return null;
                    }
                };
                /**
                 * @namespace Lib.AP.Customization.Extraction.SAP
                 */
                Extraction.SAP = {
                    /**
                     * @method Lib.AP.Customization.Extraction.SAP.GetCustomDeliveryNotes
                     * @description
                     * Allows you to override the default delivery notes extracted from the invoice when adding the SAP line items on the invoice
                     * @param {String[]} deliveryNotes The standard delivery notes array extracted from the invoice
                     * @returns {String[]} The custom delivery notes array
                     * @example
                     * SAP.GetCustomDeliveryNotes = function (deliveryNotes)
                     * {
                     *	// Use extracted header delivery notes from a custom field (Z_DeliveryNotes)
                     *	var extractedDN = Data.GetValue("Z_DeliveryNotes__");
                     *	if (extractedDN)
                     *	{
                     *		return extractedDN.split(",");
                     *	}
                     *	return deliveryNotes;
                     * }
                     */
                    GetCustomDeliveryNotes: function (deliveryNotes) {
                        return null;
                    },
                    /**
                         * @method Lib.AP.Customization.Extraction.SAP.AddAdditionalBAPI
                         * @since 341
                         * @description
                         * Add extra SAP BAPIs for purchase order details.
                         * @returns {ISAP.BapiName[]} The list of additional BAPIs to call.
                         * @example
                         * SAP.AddAdditionalBAPI = function () {
                         *		// Automatic archivation of invoices. This table is used to get PO items info
                         * 		return ["BAPI_INCOMINGINVOICE_GETDETAIL"];
                         * };
                     */
                    AddAdditionalBAPI: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.SAP.onDuplicatePoItemsDetails
                     * @since 331
                     * @description
                     * Allows you to force the update of the invoiced and delivered amount from Goods Receipt (GR) on the PO.
                     * @params {PODetailsServer} returnPO The PO object to update
                     * @params {POItemData} itemDetails The array of item details to process
                     * @returns {void} The custom delivery notes array
                     * <caption> Allow to update the PO amounts even if the GR quantity is 0 </caption>
                     * SAP.onDuplicatePoItemsDetails = function (deliveryNotes)
                     * {
                     * 		if (itemDetails[i].Quantity === 0)
                     *		{
                     *			returnPO.refDeliveredAmount += itemDetails[i].refDeliveredAmount;
                     *			returnPO.refInvoicedAmount += itemDetails[i].refInvoicedAmount;
                     *		}
                     * }
                    */
                    onDuplicatePoItemsDetails: function (returnPO, itemDetail) {
                    },
                    /**
                     * @method Lib.AP.Customization.Extraction.SAP.CustomizePOItemHistorics
                     * @since 341
                     * @description
                     * Allows you to customize the PO item historics.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory[]} poItemHistorics The array of PO item historics to customize
                     * @example
                     * <caption>Sort PO item historics based on the availability of delivery notes</caption>
                     * SAP.CustomizePOItemHistorics = function (poItemHistorics)
                     * {
                     * 		poItemHistorics.sort((a, b) =>
                     * 		{
                     * 			if (a.REF_DOC_NO === b.REF_DOC_NO)
                     * 			{
                     * 				return 0;
                     * 			}
                     * 			return a.REF_DOC_NO === "" ? 1 : -1;
                     * 		});
                     * }
                     */
                    CustomizePOItemHistorics: function (poItemHistorics) {
                    }
                };
                /**
                 * @member Lib.AP.Customization.Extraction.CustomHelpers
                 * @description
                 * To define custom functions corresponding to business behaviors:
                 * Create a object in which Functions defined in this scope will only be accessible within this library
                 * They can be called the following way CustomHelpers.MyCustomHelper()
                 * New objects can be defined to isolate several functions linked to a feature (i.e. : VendorHelpers)
                 *  @example
                 * Extraction.CustomHelpers =
                 * {
                 *		InitValues: function()
                 *		{
                 *			Data.SetValue("CalculateTax__", false);
                 *		}
                 * };
                 */
                // Uncomment here
                // Extraction.CustomHelpers =
                // {
                // },
                /**
                 * @namespace Lib.AP.Customization.Extraction.AdaptFieldSign
                 */
                Extraction.AdaptFieldSign = {
                    /**
                     * @method Lib.AP.Customization.Extraction.AdaptFieldSign.ShouldAdaptLineItemSign
                     * @description
                     * Determines whether the field 'Sign' needs to be updated for a line item
                     * @returns {Boolean}
                     * @example
                     * AdaptFieldSign.ShouldAdaptLineItemSign = function ()
                     * {
                     *		if (Lib.AP.InvoiceType.isPOInvoice())
                     *		{
                     *			return false;
                     * 		}
                     *
                     */
                    ShouldAdaptLineItemSign: function () {
                        return null;
                    }
                };
                /**
                 * @method Lib.AP.Customization.Extraction.CustomExtractionMappingTableFilter
                 * @since 333
                 * @description
                 * Allows you to customize the filter used for extraction mapping table queries.
                 * This function can be used to modify or enhance the default filter criteria
                 * @param {string} defaultFilter The default filter to be customized
                 * @param {string} companyCode The company code for the invoice
                 * @param {string} formField The form field name being processed
                 * @param {string} ediValue The original EDI value from the document
                 * @returns {string} The customized filter, or void to keep the original filter
                 * @example <caption>Add additional filter criteria based on company code</caption>
                 * CustomExtractionMappingTableFilter = function (defaultFilter, companyCode, formField, ediValue)
                 * {
                 *     if (companyCode === "US01")
                 *     {
                 *         return `(defaultFilter + "(Active__=true)`;
                 *     }
                 *     return defaultFilter;
                 * }
                 */
                Extraction.CustomExtractionMappingTableFilter = function (defaultFilter, companyCode, formField, ediValue) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.CustomizeCrossReferenceERPValue
                 * @since 333
                 * @description
                 * Allows you to customize the cross reference ERP value used for vendor invoice processing.
                 * This function can be used to modify or transform the business value
                 * @param {string} defaultERPValue The default ERP value to be customized
                 * @param {string} companyCode The company code for the invoice
                 * @param {string} formField The form field name being processed
                 * @param {string} ediValue The original EDI value from the document
                 * @returns {string} The customized cross reference ERP value, or void to keep the original value
                 * @example <caption>Transform ERP value based on company code</caption>
                 * CustomizeCrossReferenceERPValue = function (defaultERPValue, companyCode, formField, ediValue)
                 * {
                 *     if (companyCode === "US01")
                 *     {
                 *         return defaultERPValue.toUpperCase();
                 *     }
                 *     return defaultERPValue;
                 * }
                 */
                Extraction.CustomizeCrossReferenceERPValue = function (defaultERPValue, companyCode, formField, ediValue) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.ShouldDiscardPOCandidate
                 * @since 337
                 * @description
                 * Allows you to discard order number candidates based on certain criteria before reconciliation.
                 * @param {Lib.AP.SAP.PurchaseOrder.PODetailsServer} poDetails The SAP PO details for the PO candidate.
                 * @param {string} orderNumber The PO candidate number.
                 * @returns {boolean | void} Return true to discard the PO candidate, false to keep it, or void to keep the original behavior.
                 * @example <caption>Discard the candidate if CO_CODE field is different from CompanyCode__</caption>
                 * ShouldDiscardPOCandidate = function (poDetails, orderNumber)
                 * {
                 *		const cc = poDetails.PO_HEADER.GetValue("CO_CODE");
                 *		if (cc !== Data.GetValue("CompanyCode__"))
                 *		{
                 *			Log.Info(`discarded PO# ${orderNumber}`);
                 *			return true;
                 *		}
                 *		return false;
                 * }
                 */
                Extraction.ShouldDiscardPOCandidate = function (poDetails, orderNumber) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.AvoidRetrievingVendorFromPO
                 * @since 342
                 * @description
                 * Allows you to avoid retrieving the vendor from the PO even if it would normally be set based on extraction logic
                 * @param {string} vendorNumber the vendor number extracted from PO
                 * @param {string|Candidate} order the order number, or the order candidate in SAP connected mode (contains the poDetails fetched from SAP)
                 * @returns {boolean} true, to avoid filling the vendor from the PO. false, to use default logic.
                 * @example <caption>Avoid vendor retrieval from PO for PO in company code 2000</caption>
                 * AvoidRetrievingVendorFromPO: function (vendorNumber, order) {
                 * 		if (order.poDetails && order.poDetails.PO_HEADER.GetValue("CO_CODE") === "2000")
                 *		{
                 * 			// poDetails only available in SAP connected
                 *			return true;
                 *		}
                 *		else if (GetCompanyCodeFromOrderNumber(order) === "2000")
                 *		{
                 *			return true;
                 *		}
                 *		return false;
                 * }
                 *
                 * @example <caption>Avoid vendor retrieval if vendor is already taught or extracted</caption>
                 * AvoidRetrievingVendorFromPO: function (vendorNumber, orderCandidate) {
                 *		return Data.GetValue("VendorNumber__") && Data.IsComputed("VendorNumber__");
                 * }
                 */
                Extraction.AvoidRetrievingVendorFromPO = function (vendorNumber, order) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.ForceRetrievingVendorFromPO
                 * @since 339
                 * @description
                 * Allows you to force retrieving the vendor from the PO regardless of other extraction results or if a vendor is already set on the invoice
                 * @param {string} vendorNumber the vendor number extracted from PO
                 * @param {string|Candidate} order the order number, or the order candidate in SAP connected mode (contains the poDetails fetch from SAP)
                 * @returns {boolean} true, to force filling the vendor from the PO. false, to use default logic.
                 * @example <caption>Force vendor retrieval from PO for PO in company code 1000</caption>
                 * ForceRetrievingVendorFromPO: function (vendorNumber, order) {
                 * 		if (order.poDetails && order.poDetails.PO_HEADER.GetValue("CO_CODE") === "1000")
                 *		{
                 * 			// poDetails only available in SAP connected
                 *			return true;
                 *		}
                 *		else if (GetCompanyCodeFromOrderNumber(order) === "1000")
                 *		{
                 *			return true;
                 *		}
                 *		return false;
                 * }
                 *
                 * @example <caption> only force if teaching rule was not applied </caption>
                 * ForceRetrievingVendorFromPO: function (vendorNumber, orderCandidate) {
                 *		return !Data.GetValue("SupplementaryRule") && vendorNumber;
                 * }
                 */
                Extraction.ForceRetrievingVendorFromPO = function (vendorNumber, order) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.DisableVendorMRU
                 * @since 340
                 * @description
                 * Allows you to disable the vendor MRU (Most Recently Used) feature for the current invoice.
                 * @returns {boolean | void} true, if the vendor MRU feature is disabled. false, if it is enabled.
                 * @example <caption> Disable vendor MRU regardless of condition </caption>
                 * DisableVendorMRU: function () {
                 *		return true;
                 * }
                 */
                Extraction.DisableVendorMRU = function () {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.IsMatchingOriginalInvoice
                 * @since 345
                 * @description
                 * Allows you to customize the condition for determining if a credit note matches an original invoice during extraction.
                 * By default, the matching is based on checking if the invoice claimed amount or invoice mismatch amount, and credit note amount sum to zero.
                 * This user exit allows you to implement custom matching logic based on other criteria (e.g., invoice number, PO number, or other custom fields).
                 * If the function returns true, the credit note is considered a match for the original invoice and will prevail over other matching criteria.
                 * @param {xVars} invoiceVars The vars from the original invoice candidate being evaluated
                 * @param {number} creditNoteAmount The amount of the current credit note being processed
                 * @returns {boolean | void} true if the credit note matches the invoice. Return void, false or undefined to use the default amount-based matching logic.
                 * @example <caption>Match credit note based on a custom reference field</caption>
                 * Extraction.IsMatchingOriginalInvoice: function (invoiceVars, creditNoteAmount)
                 * {
                 *     // Custom matching logic based on a reference field from the credit note
                 *     const creditNoteReference = Data.GetValue<string>("Z_InvoiceReference__");
                 *     const invoiceNumber = invoiceVars.GetValue<string>("InvoiceNumber__", 0);
                 *     if (creditNoteReference && creditNoteReference === invoiceNumber)
                 *     {
                 *         return true;
                 *     }
                 *     // Otherwise, return nothing to use default amount-based matching
                 * }
                 * @example <caption>Match with a tolerance on the amount</caption>
                 * Extraction.IsMatchingOriginalInvoice: function (invoiceVars, creditNoteAmount)
                 * {
                 *     const invoiceClaimedAmount = Number(invoiceVars.GetValue<number>("InvoiceClaimedAmount__", 0));
                 *     if (!creditNoteAmount || creditNoteAmount === 0 || !invoiceClaimedAmount)
                 *     {
                 *         return false;
                 *     }
                 *
                 *     // Allow a tolerance of 0.01 for matching
                 *     const tolerance = 0.01;
                 *     // For credit notes, amounts are negative, so we add them
                 *     const difference = Math.abs(invoiceClaimedAmount + creditNoteAmount);
                 *
                 *     return difference <= tolerance;
                 * }
                 */
                Extraction.IsMatchingOriginalInvoice = function (invoiceVars, creditNoteAmount) {
                };
                /**
                 * @method Lib.AP.Customization.Extraction.IsUDCDetectionDisabled
                 * @since 349
                 * @description
                 * Allows you to disable Unplanned Delivery Costs (UDC) detection.
                 * This user exit is called in the extraction script when the invoice type is a PO Invoice or PO GL Invoice.
                 * @returns {boolean | void} True if the UDC detection should be disabled, false or undefined otherwise.
                 * @example
                 * IsUDCDetectionDisabled: function ()
                 * {
                 *     // Disable UDC detection for Intercompany invoices
                 *     if (Data.GetValue("CompanyCode__") === "US01" && Data.GetValue("VendorNumber__") === "INT01")
                 *     {
                 *         return true;
                 *     }
                 *     return false;
                 * }
                 */
                Extraction.IsUDCDetectionDisabled = function () {
                };
            })(Extraction = Customization.Extraction || (Customization.Extraction = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_EXTRACTION_SAMPLE.js.map