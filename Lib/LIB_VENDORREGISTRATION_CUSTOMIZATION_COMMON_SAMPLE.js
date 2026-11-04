"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_VENDORREGISTRATION_CUSTOMIZATION_COMMON_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Library containing helper to choose document type",
  "versionable": false,
  "require": []
}*/
/**
 * @namespace Lib.VendorRegistration.Customization.Common
 */
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.VendorRegistration.Customization.Common.DocumentTypeAvailableValues
                 * @description
                * Function called in Vendor registration to customize available values
                * in DocumentType Combobox
                *
                * @returns {array} result an Array of strings which represents availables values for document type,
                *                  in the value=label format.
                * @example
                * <pre><code>
                * DocumentTypeAvailableValues: function()
                * {
                *	return ["KBIS=_KBIS", "RIB=_RIB", "Other=_Other"];
                * }
                * </code></pre>
                */
                Common.DocumentTypeAvailableValues = function () {
                    return [];
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.GetFieldsAndTablesToIgnoreInModifiedMasterData
                 * @since 353
                 * @description
                 * Function called in vendor registration when computing modified master data fields.
                 * Allows you to add custom field or table names to the ignore list, so they are not
                 * reported as modified even if their value changed.
                 * Modify the `fieldsAndTablesToIgnore` array directly to add entries.
                 *
                 * @param {string[]} fieldsAndTablesToIgnore Reference to the current array of fields/tables to ignore. Modify this array directly.
                 * @returns {void}
                 * @example
                 * <pre><code>
                 * Common.GetFieldsAndTablesToIgnoreInModifiedMasterData = function (fieldsAndTablesToIgnore)
                 * {
                 *	 fieldsAndTablesToIgnore.push("MyCustomField__");
                 *	 fieldsAndTablesToIgnore.push("MyCustomTable__");
                 * }
                 * </code></pre>
                 */
                Common.GetFieldsAndTablesToIgnoreInModifiedMasterData = function (fieldsAndTablesToIgnore) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.GetOFACMinScore
                 * @description
                 * Function called in Vendor registration when OFAC verification is enabled
                 * This specify the minimum scoring for alerting user
                 * A message will be displayed in the form if a match is found with a score greater than minScore
                 *
                 * The score is a percentage of match between research and individual / entity found by OFAC
                 * The score must be between 50 and 100 (default value is 80)
                 * 100 : perfect match
                 * 50 : approximate match
                 *
                 * @returns {number} The minimum scoring for alerting user of match in OFAC list
                 * @example
                 * <pre><code>
                 * GetOFACMinScore: function()
                 * {
                 *	return 80;
                 * }
                 * </code></pre>
                 */
                Common.GetOFACMinScore = function () {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.GetSisIDUrl
                 * @description
                 * Function called in Vendor registration to personnalize the URL of the validation SIs-ID
                 *
                 * @returns {String} The URL of the validation of SisID
                 * @example
                 * <pre><code>
                 * GetSisIDUrl: function()
                 * {
                 *	return "https://api.eu-west-a.apiconnect.ibmappdomain.cloud/sis-id-com/my-sis-id-staging/sis-id/";
                 * }
                 * </code></pre>
                 */
                Common.GetSisIDUrl = function () {
                    return "";
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.SetRolesSequence
                 * @description Use this function to override the default roles sequence of the workflow
                 * @param {string[]} defaultRolesSequence The default roles sequence. In case of record migration without serialize defaultRoles, the current are sent.
                 * Always check if the added role is not always present in the sequence
                 * @returns {void | string[]} null if not enabled, an array of strings (the roles sequence) if enabled
                 * @example
                 * <pre><code>
                 * // Exemple: you want to add an AddressApprover and a BankDetailsApprover in the sequence, before the final approver
                 * // defaultRolesSequence is ["requester", "SisIdChecker", "OFACChecker", "legalReviewer", "approver"] here
                 * SetRolesSequence: function (defaultRolesSequence)
                 * {
                 *      var approver = defaultRolesSequence.pop();
                 *
                 *		if (defaultRolesSequence.indexOf("AddressApprover") === -1)
                 *		{
                 *			defaultRolesSequence.push("AddressApprover");
                 *		}
                 *		if (defaultRolesSequence.indexOf("AddressApprover") === -1)
                 *		{
                 *			defaultRolesSequence.push("BankDetailsApprover");
                 * 		}
                 *      defaultRolesSequence.push(approver);
                 *      return defaultRolesSequence;
                 * }
                 * </code></pre>
                 */
                Common.SetRolesSequence = function (defaultRolesSequence) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.SetWorkflowParameters
                 * @description Use this function to override the defaultworkflow parameters
                 * @param {Object} defaultWorkflowParameters The default workflow parameters
                 * @param {function} buildGenericContributors A function that makes the creation of OnBuild actions easier
                 * @returns {null | object} null if not enabled, an object representing the workflow parameters if enabled
                 * @example
                 * <pre><code>
                 * // Exemple: you want to add an AddressApprover and a BankDetailsApprover in the workflow parameters
                 * // Note: anything you pass to buildGenericContributors will overwrite the defaults values in objects
                 * SetWorkflowParameters: function (defaultWorkflowParameters, buildGenericContributors)
                 * {
                 *      var addressApprover = {};
                 *      addressApprover["OnBuild"] = buildGenericContributors({ role: "AddressApprover"});
                 *      addressApprover["contributorKey"] = "AddressApprover";
                 *      defaultWorkflowParameters.roles["AddressApprover"] = addressApprover;
                 *      var bankDetailsApprover = {};
                 *      bankDetailsApprover["OnBuild"] = buildGenericContributors({ role: "BankDetailsApprover"});
                 *      bankDetailsApprover["contributorKey"] = "BankDetailsApprover";
                 *      defaultWorkflowParameters.roles["BankDetailsApprover"] = bankDetailsApprover;
                 *      return defaultWorkflowParameters;
                 * }
                 * </code></pre>
                 */
                Common.SetWorkflowParameters = function (defaultWorkflowParameters, buildGenericContributors) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.CustomizeDuplicateCheckFilter
                 * @userExit
                 * @since 359
                 * @description
                 * Allows you to customize query parameters before Vendor Registration duplicate checks query master data.
                 * This user exit is called before querying `AP - Vendors__`, `AP - Vendors officers__`, and `AP - Bank details__`.
                 * @param {Sys.GenericAPI.PromisedQueryParameters} queryParameters The query parameters built by standard code.
                 * @returns {Sys.GenericAPI.PromisedQueryParameters | void} A custom query parameters object to use, or void to keep the passed parameters.
                 * @example <caption>Restrict duplicate checks to specific company codes</caption>
                 * Common.CustomizeDuplicateCheckFilter = function (queryParameters)
                 * {
                 * 	var companyCodes = ["FR01", "FR02", "FR03"];
                 * 	queryParameters.filter = Sys.Helpers.LdapUtil.FilterAnd(
                 * 		queryParameters.filter,
                 * 		Sys.Helpers.LdapUtil.FilterIn("CompanyCode__", companyCodes)
                 * 	).toString();
                 * };
                 */
                Common.CustomizeDuplicateCheckFilter = function (queryParameters) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.OfficersAvailableRoles
                 * @description
                * Function called in Vendor registration to customize available values
                * in Officer Role Combobox
                * @param {string[]} currentRoles The current roles in the combobox
                * @returns {array} result an Array of strings which represents availables values for roles
                *                  in the value=label format.
                * @example
                * <pre><code>
                * OfficersAvailableRoles: function(currentRoles)
                * {
                *	currentRoles.push("Treasurer=_Treasurer");
                *	return currentRoles;
                * }
                * </code></pre>
                */
                Common.OfficersAvailableRoles = function (currentRoles) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.OnParseCompanyData
                 * @description
                 * Function called in Vendor registration, VM System Score Polling when a scoring provider return a result not managed by default.
                 * This function let you parse the result and return a JsonData object
                 *
                 * @param {object} jsonObject The json object returned by the scoring provider
                 * @param {string} typeScore The type of score to parse
                 * @returns A JsonData object or void
                 */
                Common.OnParseCompanyData = function (jsonObject, typeScore) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Common.DisableAutomaticRowInsertion
                 * @since 347
                 * @description
                 * Function called in Vendor registration to control automatic row insertion in the Documents table.
                 * By default, when a file is uploaded to a row in the Documents table, a new empty row is automatically added.
                 * This function allows you to disable this behavior
                 *
                 * @returns {boolean} true to disable automatic row insertion, false or undefined to keep default behavior
                 * @example
                 * <caption> Disable automatic row insertion to maintain pre-populated document rows </caption>
                 * Common.DisableAutomaticRowInsertion = function()
                 * {
                 *     return true;
                 * }
                 */
                Common.DisableAutomaticRowInsertion = function () {
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = VendorRegistration.Customization || (VendorRegistration.Customization = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VENDORREGISTRATION_CUSTOMIZATION_COMMON_SAMPLE.js.map