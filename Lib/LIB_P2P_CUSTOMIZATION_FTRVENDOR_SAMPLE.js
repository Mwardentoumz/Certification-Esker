"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_FTRVENDOR_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Customizable vendor first time recognition",
  "versionable": false,
  "require": []
}*/
/**
 * Package P2P Vendor first time recognition script customization callbacks
 * @namespace Lib.P2P.Customization.FTRVendor
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var FTRVendor;
            (function (FTRVendor) {
                /**
                 * @typedef FTRMethod
                 * @memberof Lib.P2P.Customization.FTRVendor
                 * @property {function} func - the function to call
                 * @property {string} desc - short description of the method
                 * @property {boolean} [cultureIndependant=false] - the function is executed one time (not for each available culture for the current document)
                 */
                /**
                 * @method Lib.P2P.Customization.FTRVendor.GetVendorFTRMethods
                 * @since 128
                 * @description Allows you to customize the type and the order of the checks that are carried out to determine the vendor from vendor data. By default, the following checks are carried out:
                 * - The process first checks whether the vendor can be determined from the VAT information.
                 * - If the vendor could not be determined, the process then checks the phone or fax number information.
                 * - If the vendor failed to be determined using the previous data, the process checks the address block information.
                 * - This user exit is called by the extraction script of the Vendor invoice and Purchase Requisition processes.
                 * Note : You can further customize the vendor determination algorithm using the GetInvoiceFTRParameters and GetCultureInfos user exits.This function permit to override default parameters used to drive first time recognition extraction module
                 * @param {FTRMethod[]} FTRMethods A sorted array of methods to apply to search for vendor ("by VAT", "by Phone number or fax", "by address block")
                 * @param {Object} cultureManager Object the allows management of available cultures, mostly it permits to retrieve culture property using the method GetProperty(propertyName)
                 * @returns {FTRMethod[]} The updated array of methods to apply to search for vendor
                 * @example
                 * <caption>This user exit adds a check in the email information and carries out the check in the address block before the check in the phone and fax number:</caption>
                 * FTRVendor.GetVendorFTRMethods = function (FTRMethods, cultureManager)
                 * {
                 *     // search by address block before by phone/fax number and add default recognition
                 *     function vendorLookupFTSEmail(companyCode)
                 *     {
                 *         // adapt the regular expression and the list of available characters to your needs
                 *         var emailRegExp = cultureManager.GetProperty("emailRegExp");
                 *         var availableCharacters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@-_'.";
                 *         var documentWordsList = [];
                 *         var result = { dbresult: null, areas: [] };
                 *
                 *         if (!emailRegExp)
                 *         {
                 *             return result;
                 *         }
                 *
                 *         for (var iPage = 0; iPage < Document.GetPageCount(); iPage++)
                 *         {
                 *             // Look for email
                 *             var sPageText = Document.GetArea(iPage).toString();
                 *             var arrayEmail = emailRegExp.exec(sPageText);
                 *             while (arrayEmail)
                 *             {
                 *                 var sWord = Lib.P2P.FirstTimeRecognition_Vendor.spanIncluding(arrayEmail[0], availableCharacters);
                 *                 documentWordsList.push(sWord);
                 *                 var objMatchingInfo = {};
                 *                 objMatchingInfo.zone = Document.SearchString(arrayEmail[0], iPage, true, false)[0];
                 *                 objMatchingInfo.columns = ["Email__"];
                 *                 objMatchingInfo.value = sWord;
                 *                 result.areas.push(objMatchingInfo);
                 *
                 *                 arrayEmail = emailRegExp.exec(sPageText);
                 *             }
                 *         }
                 *
                 *         if (documentWordsList.length === 0) {
                 *             return result;
                 *         }
                 *
                 *         var searchCriteria = [];
                 *         for (var i = 0; i < documentWordsList.length; i++) {
                 *             var word = documentWordsList[i];
                 *             if (word.length > 0) {
                 *                 searchCriteria.push(Sys.Helpers.LdapUtil.FilterEqual("Email__", word));
                 *             }
                 *         }
                 *         if (searchCriteria.length === 0) {
                 *             Log.Warn("Filter to query vendors with Email is built with wrong arguments");
                 *         }
                 *         var filter = Sys.Helpers.LdapUtil.FilterOr(searchCriteria).toString().AddCompanyCodeFilter(companyCode);
                 *         traceDebug("Filter to query vendors with Email = " + filter);
                 *         var attributes = Lib.AP.GetExtendedVendorAttributes();
                 *         Sys.GenericAPI.Query(Lib.P2P.TableNames.Vendors, filter, attributes, function (records, error) {
                 *             if (error) {
                 *                 Log.Error(error);
                 *             }
                 *             else if (!records || records.length === 0) {
                 *                 return;
                 *             }
                 *             for (var i = 0; i < records.length; i++) {
                 *                 var record = records[i];
                 *                 // Validate this matching record with your own function
                 *                 if (Lib.P2P.FirstTimeRecognition_Vendor.validateVendorRecordForVATPhoneOrFax(record, result.areas)) {
                 *                     result.dbresult = record;
                 *                     break;
                 *                 }
                 *                 else {
                 *                     traceDebug("Discarding invalid value");
                 *                 }
                 *             }
                 *         });
                 *         return result;
                 *     }
                 *
                 *     // search by VAT (standard), Email (custom), Address (standard), phone/fax (standard)
                 *     FTRMethods = [
                 *         {"func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSVAT, "desc":"by VAT"},
                 *         {"func": vendorLookupFTSEmail, "desc":"by email"},
                 *         {"func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSPostal, "desc":"by address bloc"},
                 *         {"func": Lib.P2P.FirstTimeRecognition_Vendor.vendorLookupFTSPhoneOrFax, "desc":"by Phone number or fax"}
                 *     ];
                 *
                 *     return FTRMethods;
                 * };
                 */
                FTRVendor.GetVendorFTRMethods = function (FTRMethods, cultureManager) {
                };
                /**
                 * @method Lib.P2P.Customization.FTRVendor.OnIBANFoundWithoutVendor
                 * @since 359
                 * @description Allows you to customize what happens when an IBAN is found in the document but no matching vendor is identified during the IBAN lookup.
                 * This user exit receives the best matched IBAN area so you can fill the ExtractedIBAN__ field and set an alert for the operator.
                 * @param {Lib.P2P.FirstTimeRecognition_Vendor.MatchingInfo} ibanArea The best matched IBAN area found in the document.
                 * @returns {void}
                 * @example <caption>Fill the extracted IBAN and warn the operator when no vendor matches the IBAN</caption>
                 * FTRVendor.OnIBANFoundWithoutVendor = function (ibanArea)
                 * {
                 * 	Data.SetValue("ExtractedIBAN__", ibanArea.value);
                 * 	Data.SetWarning("ExtractedIBAN__", "_Extracted IBAN does not match");
                 * };
                 */
                FTRVendor.OnIBANFoundWithoutVendor = function (ibanArea) {
                };
                /**
                 * @typedef CultureInfo
                 * @memberof Lib.P2P.Customization.FTRVendor
                 * @property {string} name The ISO code of the culture
                 * @property {regexp} VATRegExp The regexp to find the VAT
                 * @property {regexp} faxOrPhoneRegExp The regexp to find the fax or the phone number
                 * @property {regexp} postalCodeRegExp The regexp to find the postal code
                 * @property {string} defaultCurrency The currency for this culture
                 * @property {string[]} totalKeywordsFirstTry A array of keyword to find the total amount (AP V1 only)
                 * @property {string[]} totalKeywordsSecondTry A sarray of keyword to find the total amount if the first try failed (AP V1 only)
                 * @property {string[]} invoiceNumberKeywordsFirstTry A array of keyword to find the invoice number (AP V1 only)
                 * @property {string[]} invoiceNumberKeywordsSecondTry A array of keyword to find the invoice number if the first try failed (AP V1 only)
                 * @property {regexp} invoiceNumberRegExp The regexp to find the invoice number (AP V1 only)
                 * @property {regexp} invoicePORegExp The regexp to find the PO Number (AP V1 only)
                 */
                /**
                 * @method Lib.P2P.Customization.FTRVendor.GetCultureInfos
                 * @since 128
                 * @description Allows you to customize the list of the cultures that are supported in the application and the culture information, such as the phone or fax number format, the postal code, etc. Culture information is used by the process for the vendor determination. This user exit is called by the extraction script of the Vendor invoice and Purchase Requisition processes.
                 *
                 * !! The new culture(s) added through the GetCultureInfos user exit must also be added:
                 * - To the list of the expected document cultures in the configuration tool for the Accounts Payable module of the Purchase to Pay application.
                 * - To the Lib_P2P_Custom_Parameters library for the Purchasing module of the Purchase to Pay application.
                 * @param {CultureInfo[]} standardCultureInfos An array of the cultures supported by the standard package
                 * @returns {CultureInfo[]} The updated list of CultureInfo
                 * @example
                 * <caption>This user exit adds the new Portuguese culture pt-PT and some culture information such as the Portuguese fax and number format, postal code, etc. to the application culture list:</caption>
                 * FTRVendor.GetCultureInfos = function(standardCultureInfos)
                 * {
                 * 		// Add a new culture
                 *		standardCultureInfos.push(
                 *		{
                 *			name: "pt-PT",
                 *			emailRegExp: /([a-zA-Z0-9-'_]+(\.[a-zA-Z0-9-'_]+)*)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{2,}|[0-9]{1,3})(\]?)/mg,
                 *			VATRegExp: /(PT)?[ ]?([0-9][ ]?){9}/mg,
                 *			faxOrPhoneRegExp: /(T|F)?(\(?(\+?(351))|0)\)?[ ]?([0-9][ ]?){9}/mg,
                 *			postalCodeRegExp: /[0-9]{4}[ ]?\-[ ]?[0-9]{3}/mg,
                 *			defaultCurrency: "EUR"
                 *		});
                 *		return standardCultureInfos;
                 * };
                 */
                FTRVendor.GetCultureInfos = function (standardCultureInfos) {
                };
                /**
                 * @typedef PhoneNormalizationConfig
                 * @memberof Lib.P2P.Customization.FTRVendor
                 * @property {string} ext - The international dialing code (country code) without the + prefix (e.g., "33" for France)
                 * @property {number} [len] - Optional expected length of the phone number (excluding country code). Use 0 for variable length.
                 * @property {string} [trunk] - Optional trunk prefix to remove (e.g., "0" in most countries)
                 */
                /**
                 * @method Lib.P2P.Customization.FTRVendor.CustomizePhoneNormalization
                 * @since 347
                 * @description Allows you to customize phone number normalization for vendor identification by adding, removing, or modifying culture-specific normalization rules.
                 * This is useful when new cultures are added to the standard package and you want to revert to the previous behavior, or when you need to add custom normalization for cultures not supported by default.
                 * The normalization process converts phone numbers found in documents to a standardized international format (e.g., "+33 123456789") to facilitate matching with vendor data.
                 * This user exit is called by the NormalizeTel method during vendor first time recognition.
                 * @param {ESKMap<PhoneNormalizationConfig>} defaultNormalizationMap - A map of country codes (2-letter ISO codes) to their normalization configuration
                 * @param {string} currentCountry - The current document's country code (2-letter ISO code in uppercase, e.g., "FR", "US", "DE")
                 * @returns {ESKMap<PhoneNormalizationConfig>} The customized normalization map
                 * @example
                 * <caption>Remove normalization for specific countries (e.g., if new cultures were recently added and you want to keep the old behavior):</caption>
                 * FTRVendor.CustomizePhoneNormalization = function(defaultNormalizationMap, currentCountry)
                 * {
                 *     // Remove normalization for Hong Kong and Singapore (revert to old behavior)
                 *     delete defaultNormalizationMap["HK"];
                 *     delete defaultNormalizationMap["SG"];
                 *
                 *     return defaultNormalizationMap;
                 * };
                 * @example
                 * <caption>Add normalization for a new country not supported by default:</caption>
                 * FTRVendor.CustomizePhoneNormalization = function(defaultNormalizationMap, currentCountry)
                 * {
                 *     // Add normalization for Brazil
                 *     defaultNormalizationMap["BR"] = {
                 *         ext: "55",      // Brazil country code
                 *         len: 10,        // Expected phone number length
                 *         trunk: "0"      // Trunk prefix to remove
                 *     };
                 *
                 *     return defaultNormalizationMap;
                 * };
                 * @example
                 * <caption>Modify existing normalization rules:</caption>
                 * FTRVendor.CustomizePhoneNormalization = function(defaultNormalizationMap, currentCountry)
                 * {
                 *     // Change France normalization to not enforce length
                 *     if (defaultNormalizationMap["FR"])
                 *     {
                 *         defaultNormalizationMap["FR"].len = 0; // Accept any length
                 *     }
                 *
                 *     return defaultNormalizationMap;
                 * };
                 */
                FTRVendor.CustomizePhoneNormalization = function (defaultNormalizationMap, currentCountry) {
                };
            })(FTRVendor = Customization.FTRVendor || (Customization.FTRVendor = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_FTRVENDOR_SAMPLE.js.map