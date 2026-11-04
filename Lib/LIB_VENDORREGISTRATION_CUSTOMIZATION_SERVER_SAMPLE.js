"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "LIB_VENDORREGISTRATION_CUSTOMIZATION_SERVER_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Vendor registration validation process",
  "versionable": false,
  "require": []
}*/
/**
 * @namespace Lib.VendorRegistration.Customization.Server
 */
var Lib;
(function (Lib) {
    var VendorRegistration;
    (function (VendorRegistration) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.VendorRegistration.Customization.Server.IsProcessValid
                 * @description Function called in Vendor registration when the process is sent by the user
                 * @returns {boolean} If the process is valid and can be sent
                 * @example
                 * <pre><code>
                 * IsProcessValid: function()
                 * {
                 *  //We require a value for this field
                 *  var value = Data.GetValue("CompanyStructure__");
                 *  return (value !== null && value !== "");
                 * }
                 * </code></pre>
                 */
                Server.IsProcessValid = function () {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.CustomizeERPNotifierVendor
                 * @description
                 * Allows you to customize the value of variables and fields of the process to which vendor registration files
                 * are submitted when vendor registration are sent the ERP via Esker Loader.
                 * This user exit is called from the validation script of the Vendor registration process,
                 * when the vendor registration is approved by the last approver
                 * @param {xTransport} erpNotifierVendorProcess The xTransport object of the ERPNotiferVendor that will be created
                 * @example
                 * <pre><code>
                 * CustomizeERPNotifierVendor: function (erpNotifierVendorProcess)
                 * {
                 *  var vars = erpNotifierVendorProcess.GetUninheritedVars();
                 *  vars.AddValue_String("TaxID__", Data.GetValue("TaxID__"), true);
                 * }
                 * </code></pre>
                 */
                Server.CustomizeERPNotifierVendor = function (erpNotifierVendorProcess) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetEncoding
                 * @description
                 * Allows you to customize the xml file encoding output by returning the new encoding
                 * Available values are 'UTF-8' (default value) or 'UTF-16'
                 * @param {string} previousEncoding the default encoding
                 * @returns {string} the new encoding (should be "UTF-16" if you want another encoding than UTF-8)
                 * @example
                 * <pre><code>
                 * GetEncoding: function (previousEncoding)
                 * {
                 *  return "UTF-16"
                 * }
                 * </code></pre>
                 */
                Server.GetEncoding = function (previousEncoding) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetExportMode
                 * @description
                 * Allows you to customize the XML export mode used when applying GetFieldsRules,
                 * GetTablesRules and GetModifiedNodeMapping
                 * @param {Lib.FlexibleFormToXML.ExportMode} previousExportMode The default exportMode used in the standard package.
                 *                                    Default value is 1 meaning exports every fields except those in exclusion rules
                 * @returns {Lib.FlexibleFormToXML.ExportMode} 0 (allExcept) or 1 (onlyIncluded)
                 * @example
                 * <pre><code>
                 * GetExportMode: function (previousExportMode)
                 * {
                 *  return 1;
                 * }
                 * </code></pre>
                 */
                Server.GetExportMode = function (previousExportMode) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetFieldsRules
                 * @description Allows you to customize the fields rules used for XML Export
                 * @param {Lib.FlexibleFormToXML.ExportMode} exportMode The current export mode used during the XML generation
                 * @param {Lib.FlexibleFormToXML.FieldsRules} defaultFieldsRule default package XML Export fields rules
                 * @returns {Lib.FlexibleFormToXML.FieldsRules}
                 * @example
                 * <pre><code>
                 * CustomizeERPNotifierVendor: function (exportMode, defaultFieldsRule)
                 * {
                 *  if (exportMode === 1)
                 *   {
                 *      defaultFieldsRule.excludedFields.push("Z_CustomFieldToExcludeWhenExportModeIsExcludeOnly");
                 *  }
                 *   else
                 *   {
                 *      includedFields.excludedFields.push("Z_CustomFieldToIncludeWhenExportModeIsIncludeOnly");
                 *   }
                 *  return defaultFieldsRule;
                 * }
                 * </code></pre>
                 */
                Server.GetFieldsRules = function (exportMode, defaultFieldsRule) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetTablesRules
                 * @description Allows you to customize the tables rules used for XML Export
                 * @param {Lib.FlexibleFormToXML.ExportMode} exportMode The current export mode used during the XML generation
                 * @param {Lib.FlexibleFormToXML.TablesRules} defaultTablesRule default package XML Export table rules
                 * @example
                 * <pre><code>
                 * GetTablesRules: function (exportMode, defaultTablesRule)
                 * {
                 *   return [
                 *          { name: "OfficersTable__" },
                 *          { name: "CompanyBankAccountsTable__" }
                 *      ];
                 * }
                 * </code></pre>
                 */
                Server.GetTablesRules = function (exportMode, defaultTablesRule) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetModifiedNodeMapping
                 * @description
                 * Allows you to specify names for the XML nodes corresponding to custom fields of the Vendor Registration process.
                 * This user exit is called from the validation script of the Vendor Registration process,
                 * when the registration is sent to the ERP.
                 * @param {Lib.FlexibleFormToXML.ExportMode} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
                 * @param {Lib.FlexibleFormToXML.ModifiedNodeNameMappings} modifiedNodeNameMappings The current fields mapping
                 * @returns {Lib.FlexibleFormToXML.ModifiedNodeNameMappings} The updated fields mapping to include or exclude
                 * @example
                 * <pre><code>
                 * GetModifiedNodeMapping: function (defaultModifiedNodeMapping)
                 * {
                 *   return { "Z_CustomField__" : "CustomField" };
                 * }
                 * </code></pre>
                */
                Server.GetModifiedNodeMapping = function (exportMode, defaultModifiedNodeMapping) {
                    // Customization not implemented in sample package library
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetFieldValuesMapping
                 * @description
                 * Allows you to override some fields values in the resulting XML.
                 * This user exit is called from the validation script of the Vendor Registration process,
                 * when the registration is sent to the ERP.
                 * @param {Lib.FlexibleFormToXML.ModifiedFieldValuesMapping} modifiedFieldValuesMapping The current fields values mapping
                 * @returns {Lib.FlexibleFormToXML.ModifiedFieldValuesMapping} The updated fields values
                 * @example <caption>Add a mapping to set the due date empty for NON-PO invoices</caption>
                 * Server.GetFieldValuesMapping = function (modifiedFieldValuesMapping)
                 * {
                 *  	var invoiceType = Data.GetValue("RegistrationType__");
                 *  	if (invoiceType === "Creation")
                 *  	{
                 *      	modifiedFieldValuesMapping.VendorNumber__ = "New vendor"
                 *  	}
                 * 		return modifiedFieldValuesMapping;
                 * }
                 */
                Server.GetFieldValuesMapping = function (modifiedFieldValuesMapping) {
                    return modifiedFieldValuesMapping;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetFieldValuesTransformation
                 * @description
                 * Allows you to customize the transformation of the field values in the resulting XML.
                 * This user exit is called from the validation script of the Vendor Registration process,
                 * when the registration is sent to the ERP.
                 * @param {Object.<string, function>} transformations
                 * @returns {Object.<string, function>} The updated transformation rules to apply
                 * @example
                 * <pre><code>
                 * // Add a transformation to format the date in the XML
                 * GetFieldValuesTransformation: function (transformations)
                 * {
                 * 	transformations.InvoiceDate__ = function (value)
                 * 	{
                 * 		return value ? value.toISOString() : "";
                 * 	};
                 * 	return transformations;
                 * }
                 * </code></pre>
                 */
                Server.GetFieldValuesTransformation = function (transformations) {
                    return transformations;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetHeaderColumnsList
                 * @since 330
                 * @description
                 * Allows you to customize the header fields to be exported in the resulting XML (including the order).
                 * This user exit is called from the validation script of the Vendor Registration process,
                 * when the registration is sent to the ERP.
                 * @param {Array<Object<string, any>>} fieldList The list of header fields with associated values. The list can be filtered or reordered before the export in the XML.
                 * @example <caption>Move the first field in 4th position</caption>
                 * Server.GetHeaderColumnsList: function (fieldList)
                 * {
                 *   // move first field in 4th position
                 *   var fieldToMove = fieldList.shift();
                 *   fieldList.splice(3, 0, fieldToMove);
                 * }
                 */
                Server.GetHeaderColumnsList = function (fieldList) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetConfiguration
                 * @since 343
                 * @description
                 * Allows you to customize which S2P configuration will be used for newly created vendor portal user.
                 * @example <caption>Return the configuration related to current company code</caption>
                 * Server.GetConfigurationForNewlyCreatedVendorUser: function ()
                 * {
                 *   return Data.GetValue("CompanyCode__") + "_conf";
                 * }
                 */
                Server.GetConfigurationForNewlyCreatedVendorUser = function () {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SetERPWaitingValidityDate
                 * @description Use this function to override the standard validity date, for the waiting state of ERP integration (default 24 hours timeout)
                 * @param {string} validityDate the default computed validityDateTime (Now + 24 hours)
                 * @returns {string|null} Return the new Date to override the validityDateTime, if returns null does not override the default validityDateTime
                 * @example
                 * <pre><code>
                 * SetERPWaitingValidityDate: function (validityDate)
                 * {
                 *  // Increase the timeout from 24 to 48 hours
                 *  validityDate.setHours(validityDate.getHours() + 24);
                 *  return validityDate;
                 * }
                 * </code></pre>
                 */
                Server.SetERPWaitingValidityDate = function (validityDate) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.EnableTouchlessForUpdateOnVendorRegistration
                 * @description
                 * Use this function to enable touchless processing of vendor registration process.
                 * When enabled, after a vendor submits a "vendor update", the form is processed automatically if no forms are in warning or error.
                 * SIS-ID verification must pass too (if not a warning will be triggered)
                 * @returns {boolean} true if enabled, false if not
                 * @example
                 * <pre><code>
                 * EnableTouchlessForUpdateOnVendorRegistration: function ()
                 * {
                 *  return true;
                 * }
                 * </code></pre>
                 */
                Server.EnableTouchlessForUpdateOnVendorRegistration = function () {
                    return false;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SetRolesSequence
                 * @deprecated Use Lib.VendorRegistration.Customization.Common.SetRolesSequence
                 * @description Use this function to override the default roles sequence of the workflow
                 * @param {string[]} defaultRolesSequence The default roles sequence
                 * @returns {null | string[]} null if not enabled, an array of strings (the roles sequence) if enabled
                 * @example
                 * <pre><code>
                 * // Exemple: you want to add an AddressApprover and a BankDetailsApprover in the sequence, before the final approver
                 * // defaultRolesSequence is ["requester", "SisIdChecker", "OFACChecker", "legalReviewer", "approver"] here
                 * SetRolesSequence: function (defaultRolesSequence)
                 * {
                 *      var approver = defaultRolesSequence.pop();
                 *      defaultRolesSequence.push("AddressApprover");
                 *      defaultRolesSequence.push("BankDetailsApprover");
                 *      defaultRolesSequence.push(approver);
                 *      return defaultRolesSequence;
                 * }
                 * </code></pre>
                 */
                Server.SetRolesSequence = function (defaultRolesSequence) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SetWorkflowParameters
                 * @deprecated Use Lib.VendorRegistration.Customization.Common.SetWorkflowParameters
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
                Server.SetWorkflowParameters = function (defaultWorkflowParameters, buildGenericContributors) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SetMasterDataMapping
                 * @description
                 * Use this function to extend the default MasterData mapping. Do not reset the object to avoid breaking standard features.
                 *
                 * Columns from "Vendor_company_extended_properties__" and "AP - Vendors__" are associated to header's fields.
                 * Columns from "AP - Bank details__" are associated to the fields of "CompanyBankAccountsTable__".
                 * Columns from "AP - Vendors officers__" are associated to the fields of "CompanyOfficersTable__".
                 *
                 * @param {MasterDataMapping} masterDataMapping
                 * @returns {MasterDataMapping}
                 * @example Sample to add a custom field from Vendor_company_extended_properties__ and a BankName__ field into CompanyBankAccountsTable__
                 * <pre><code>
                 * SetMasterDataMapping: function (masterDataMapping)
                 * {
                 *      masterDataMapping["Vendor_company_extended_properties__"]["Z_CustomTableField"] = "Z_CustomFormField";
                 *      masterDataMapping["AP - Bank details__"]["BankName__"] = "Z_AccountBankName__";
                 *      return masterDataMapping;
                 * }
                 * </code></pre>
                 */
                Server.SetMasterDataMapping = function (masterDataMapping) {
                    return masterDataMapping;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnFillInterfaceWithMasterData
                 * @description Use this function to trigger an event when Inferface is filled by MasterData
                 *
                 * @example Sample to populate a table
                 * <pre><code>
                 * OnFillInterfaceWithMasterData: function ()
                 * {
                 *      const table = Data.GetTable("Z_Table__");
                 *      var queryFilter = Sys.Helpers.LdapUtil.FilterAnd(
                 *          Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber),
                 *          Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode)
                 *      );
                 *      Sys.GenericAPI.Query("Z_CUSTOMTABLE__", queryFilter.toString(), "*", function (records, error) {
                 *          if (error) {
                 *              Log.Error(error);
                 *          }
                 *          else if (!records || records.length === 0) {
                 *              table.SetItemCount(0);
                 *              return;
                 *          }
                 *          table.SetItemCount(records.length);
                 *          for (let i = 0; i < records.length; i++) {
                 *              var vars = records[i].GetVars();
                 *              var item = table.GetItem(i);
                 *              item.SetValue("Z_FormField", vars.GetValue_String("Z_TableField", 0));
                 *          }
                 *      });
                 * }
                 * </code></pre>
                 *
                 * @example Sample to populate a header field
                 * <pre><code>
                 * OnFillInterfaceWithMasterData: function ()
                 * {
                 *      var queryFilter = Sys.Helpers.LdapUtil.FilterAnd(
                 *          Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber),
                 *          Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode)
                 *      );
                 *      Sys.GenericAPI.Query("Z_CUSTOMTABLE__", queryFilter.toString(), "*", function (records, error) {
                 *          if (error) {
                 *              Log.Error(error);
                 *          }
                 *          else if (!records || records.length === 0) {
                 *              return;
                 *          }
                 *          var vars = records[0].GetVars();
                 *          Data.SetValue("Z_FormField", vars.GetValue_String("Z_TableField", 0));
                 *      }, null, 1);
                 * }
                 * </code></pre>
                 */
                Server.OnFillInterfaceWithMasterData = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.CustomizePaymentMethodQueryFilter
                 * @since 351
                 * @description
                 * Allows you to customize the filter used to lookup payment methods in Vendor Registration master data translation.
                 * This user exit is called from the validation script before querying `Country_Payment_Method__`.
                 * @param {Sys.Helpers.LdapUtil.IFilter} queryFilter The default LDAP filter built by standard code.
                 * @returns {Sys.Helpers.LdapUtil.IFilter | void} A custom LDAP filter to use, or void to keep the default filter.
                 * @example
                 * <caption>Remove country criterion from payment method lookup</caption>
                 * CustomizePaymentMethodQueryFilter: function (queryFilter)
                 * {
                 * 	return queryFilter;
                 * }
                 */
                Server.CustomizePaymentMethodQueryFilter = function (queryFilter) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.IsBankDetailsSynchronizationDisabled
                 * @since 353
                 * @description
                 * Allows you to disable synchronization of the `AP - Bank details__` custom table when vendor master data is serialized.
                 * This user exit is called from the validation script before synchronizing bank details.
                 * @returns {boolean | void} Return `true` to disable the synchronization, or void to keep the standard behavior.
                 * @example
                 * <caption>Disable synchronization of bank details</caption>
                 * IsBankDetailsSynchronizationDisabled: function ()
                 * {
                 * 	return true;
                 * }
                 */
                Server.IsBankDetailsSynchronizationDisabled = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnBeforeSerializeMasterData
                 * @since 353
                 * @description
                 * Called before standard master data serialization begins.
                 * Standard serialization writes vendor links, vendor record, officers table, bank details table, and company extended properties to the database.
                 * Return `true` to fully bypass all standard serialization and replace it with custom logic.
                 * Return void or any other value to let the standard serialization proceed normally.
                 * @param {MasterDataMapping} masterDataMapping The cloned raw standard mapping object defining table-to-form field associations.
                 * @returns {boolean | void} Return `true` to skip standard serialization; return void or any other value to proceed normally.
                 * @example
                 * <caption>Bypass standard serialization and propagate vendor updates to all company codes sharing a Common Supplier ID</caption>
                 * Server.OnBeforeSerializeMasterData = function (masterDataMapping)
                 * {
                 *	var commonSupplierId = Data.GetValue("Z_CommonSupplierID__");
                 *	if (!commonSupplierId)
                 *	{
                 *		return;
                 *	}
                 *
                 *	// Find all vendors in this cluster
                 *	var query = Process.CreateQueryAsProcessAdmin();
                 *	query.SetSpecificTable("AP - Vendors__");
                 *	query.SetAttributesList("Number__,CompanyCode__");
                 *	query.SetFilter("(Z_CommonSupplierID__=" + commonSupplierId + ")");
                 *	query.MoveFirst();
                 *
                 *	var record = query.MoveNextRecord();
                 *	while (record)
                 *	{
                 *		var vars = record.GetVars();
                 *		// Use the mapping to know which fields to write
                 *		var vendorTableMapping = masterDataMapping["AP - Vendors__"];
                 *		for (var tableKey in vendorTableMapping)
                 *		{
                 *			var formKey = vendorTableMapping[tableKey];
                 *			vars.AddValue_String(tableKey, Data.GetValue(formKey), true);
                 *		}
                 *		record.Commit();
                 *		record = query.MoveNextRecord();
                 *	}
                 *
                 *	return true; // Skip standard serialization
                 * }
                 */
                Server.OnBeforeSerializeMasterData = function (masterDataMapping) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnSerializeMasterData
                 * @description Use this function to trigger an event when MasterData is serialized
                 * @param {IUser} user Current user serialized
                 * @example Sample to serialize a table
                 * <pre><code>
                 * OnSerializeMasterData: function (user)
                 * {
                 *      var customTable = {
                 *          groupKeys: {
                 *              CompanyCode__: companyCode,
                 *              VendorNumber__: vendorNumber
                 *          },
                 *          dataIndexColumn: "TableIndex__",
                 *          data: {}
                 *      };
                 *      const customDataTable = Data.GetTable("Z_Table__");
                 *      for (let i = 0; i < customDataTable.GetItemCount(); i++)
                 *      {
                 *          const item = customDataTable.GetItem(i);
                 *          vendorRegistrationOfficersTable.data[i + 1] = {
                 *              "Z_TableField": item.GetValue("Z_FormField");
                 *          };
                 *      }
                 *      Sys.Helpers.Database.SynchronizeCustomTable("Z_CUSTOMTABLE__", customTable);
                 * }
                 * </code></pre>
                 * @example Sample to serialize a header field
                 * <pre><code>
                 * OnSerializeMasterData: function (user)
                 * {
                 *      var query = Process.CreateQuery();
                 *      query.Reset();
                 *      query.SetAttributesList("*");
                 *      query.SetSpecificTable("Z_CUSTOMTABLE__");
                 *      var filter = Sys.Helpers.LdapUtil.FilterAnd(
                 *          Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode),
                 *          Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber),
                 *      );
                 *      query.SetFilter(filter.toString());
                 *      query.SetOptionEx("Limit=1");
                 *      if (query.MoveFirst())
                 *      {
                 *          var record = query.MoveNextRecord();
                 *          var vars = record.GetVars();
                 *          vars.AddValue_String("Z_TableField", Data.GetValue("Z_FormField"), true);
                 *          record.Commit();
                 *      }
                 * }
                 * </code></pre>
                 */
                Server.OnSerializeMasterData = function (user) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.NewVendorRegistrationFinalizeProcess
                 * @description Function called in New Vendor registration to synchronize data with Vendor registration process
                 * @param {xTransport} vendorRegistrationProcess the transport of Vendor registration process
                 * @example
                 * <pre><code>
                 * NewVendorRegistrationFinalizeProcess: function(vendorRegistrationProcess)
                 * {
                 *  if (vendorRegistrationProcess)
                 *  {
                 *      var extVars = vendorRegistrationProcess.GetExternalVars();
                 *      extVars.AddValue_String("nameField", "value", true);
                 *
                 * 		var data = vendorRegistrationProcess.GetUninheritedVars();
                 * 		data.AddValue_String("CompanyCode__", Variable.GetValueAsString("CompanyCode"), true);
                 *  }
                 * }
                 * </code></pre>
                */
                Server.NewVendorRegistrationFinalizeProcess = function (vendorRegistrationProcess) {
                };
                /**
                 * VendorEmailCustomization - An object to define the email template, tags and cc to use in the email sent to the vendor.
                 * @typedef {object} Lib.VendorRegistration.Customization.Server.VendorEmailCustomization
                 * @property {string} template - The template to use.
                 * @property {ESKMap<string>} customTags - Tags to include.
                 * @property {string[]} [ccRecipients] - Optional CC recipients.
                 */
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnSendEmailToVendor
                 * @description Use this function to customize the tags, template and cc of the email sent to the vendor
                 * @param {string} template template name used by default (for example AP-Vendor_RegistrationInvitation.htm or AP-Vendor_RegistrationSubmit.htm)
                 * @param {ESKMap<string>} customTags object containing the tags used to generate the email
                 * @param {string} userID id of the connected user sending the email (for example the user sending the registration to the vendor)
                 * @returns {VendorEmailCustomization | null} The custom template, tags and cc to use in the email. Return null to keep the default email.
                 * @example
                 * <caption>Sample to customize the email sent to the vendor</caption>
                 * Server.OnSendEmailToVendor = function (template, customTags, userID)
                 * {
                 *	// Use a custom template when sending a registration to the vendor. In this template add the name and email of the user requesting the registration.
                 *	if (template === "AP-Vendor_RegistrationInvitation.htm")
                 *	{
                 *		const user = Users.GetUser(userID);
                 *		if (user)
                 *		{
                 *			customTags.Z_FirstName__ = user.GetValue("FirstName");
                 *			customTags.Z_LastName__ = user.GetValue("LastName");
                 *			customTags.Z_Email__ = user.GetValue("EmailAddress");
                 *		}
                 *		return { template: "Z_AP-Vendor_RegistrationInvitation.htm", customTags: customTags };
                 *	}
                 *	return null;
                 * }
                 * @example
                 * <caption>Sample to customize to whom the email is sent</caption>
                 * Server.OnSendEmailToVendor = function (template, customTags, userID)
                 * {
                 *	// Add the current user in CC of the email
                 *	var ccRecipients = [];
                 *	if (template === "AP-Vendor_RegistrationInvitation.htm")
                 *	{
                 *		const user = Users.GetUser(userID);
                 *		if (user)
                 *		{
                 *			ccRecipients.push(user.GetValue("EmailAddress"));
                 *		}
                 *		return { template: template, customTags: customTags, ccRecipients: ccRecipients };
                 *	}
                 *	return null;
                 * }
                 */
                Server.OnSendEmailToVendor = function (template, customTags, userID) {
                    return null;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnSendEmailToCreator
                 * @description
                 * Use this function to customize the emailOptions of all emails sent to the creator of the vendor registration
                 * at the end of the workflow in case of approbation or rejection.
                 * @param {Sys.EmailNotification.CreateEmailWithUserOptions} emailOptions object containing the email options
                 * @returns {boolean} A boolean indicating if the notification should be sent
                 * @example
                 * <pre><code>
                 * OnSendEmailToCreator: function (emailOptions):
                 * {
                 * 		// Do not send the email to the creator if it's an approval email
                 * 		if (emailOptions.subject === "_Vendor_ApprovedEmailSubject")
                 * 		{
                 * 			return false;
                 * 		}
                 *
                 * 		// Customize the email sent to the creator
                 * 		emailOptions.emailAddress = "creator@example.com";
                 * 		emailOptions.subject = "Custom subject";
                 * 		emailOptions.template = "Z_AP-Vendor_RegistrationInvitation.htm";
                 * 		emailOptions.customTags.Z_CustomTag = "CustomValue";
                 * 		return true;
                 * }
                 * </code></pre>
                 */
                Server.OnSendEmailToCreator = function (emailOptions) {
                    return true;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnCreateRelatedOneDocumentEnd
                 * @since 328
                 * @description Allows you to customize "DD - SenderForm" process to create related document for SDA at the end of finalizing vendor registration
                 * @param {xTransport} senderFormProcess xTransport object of "DD - SenderForm" instance
                 * @param {ESKMap<any>} document Related document object
                 *
                 * @example
                 * <caption>Add rights to custom group users</caption>
                 * Server.OnCreateRelatedOneDocumentEnd: function (senderFormProcess, document):
                 * {
                 * 		senderFormProcess.AddRight(Sys.Parameters.GetInstance("P2P").GetParameter("CustomGroup"), "all");
                 * }
                 *
                 * @example
                 * <caption>Customize "DD - SenderForm" process fields</caption>
                 * Server.OnCreateRelatedOneDocumentEnd: function (senderFormProcess, document):
                 * {
                 *		const transportVars = senderFormProcess.GetUninheritedVars();
                 *		transportVars.AddValue_String("Subject", "LastName " + Attach.GetName(document.attachmentIndex), true);
                 *		transportVars.AddValue_String("Z_CustomField__", "custom", true);
                 * }
                 */
                Server.OnCreateRelatedOneDocumentEnd = function (senderFormProcess, document) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnExtractionEnd
                 * @since 330
                 * @description This user exit is called at the end of the extraction script
                 *
                 * @example
                 * <caption>This user exit allows you to add customization at the end of extraction script</caption>
                 * Server.OnExtractionEnd: function ():
                 * {
                 * 		var months = 12;
                 * 		var submitDate = Data.GetValue("SubmitDateTime");
                 * 		var validityDT = submitDate;
                 * 		validityDT.setMonth(validityDT.getMonth() + months);
                 * 		Data.SetValue("ValidityDateTime", validityDT);
                 * }
                 */
                Server.OnExtractionEnd = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.CustomizeVendorNumberFromVendorLinks
                 * @since 361
                 * @description
                 * This user exit is called when the vendor number is retrieved from the 'AP - Vendors links__' table
                 * (during a vendor registration update from the vendor portal). It allows you to customize that vendor
                 * number, which is then used for the pending update check and stored in the 'VendorNumber__' field.
                 * @param {xVars} recordVars The vars of the 'AP - Vendors links__' record, giving access to all its columns
                 * (e.g. 'Number__', 'CompanyCode__', 'ShortLogin__').
                 * @returns {string | void} The customized vendor number. Return nothing to keep the default value.
                 * @example
                 * <caption>Prefix the vendor number retrieved from the vendor links table</caption>
                 * Server.CustomizeVendorNumberFromVendorLinks = function (recordVars)
                 * {
                 * 		return "Z_" + recordVars.GetValue_String("Number__", 0);
                 * }
                 */
                Server.CustomizeVendorNumberFromVendorLinks = function (recordVars) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.DisableWelcomeEmail
                 * @since 330
                 * @description Disable sending welcome email to the supplier upon registration finalization.
                 * @returns {boolean | void} Return `true` to disable welcome email notification sending to the supplier
                 *
                 * @example
                 * <caption>Disable welcome email if Supplier Portal is disabled in Configuration</caption>
                 * Server.DisableWelcomeEmail: function()
                 * {
                 * 	return Sys.Parameters.GetInstance("AP").GetParameter("EnablePortalAccountCreation", "0") !== "1";
                 * }
                 */
                Server.DisableWelcomeEmail = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.IsNonBusinessEntity
                 * @since 331
                 * @description
                 * Function called in Vendor registration to check if the vendor is a non-business entity.
                 * This function can be used in conjunction with the client-side user exit Lib.VendorRegistration.Customization.HTMLScripts.CustomTaxIDValidationFunction,
                 * which can supersede the validation of the tax ID on the client side and add specific checks for non-business entities.
                 * @returns {boolean} If the vendor is a non-business entity
                 * @example
                 * <caption>Sample to check if the vendor is a non-business entity</caption>
                 * IsNonBusinessEntity: function()
                 * {
                 *	return Data.GetValue("Z_nonBusinessEntity__");
                 * }
                 */
                Server.IsNonBusinessEntity = function () {
                    return false;
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SetCustomXmlFilename
                 * @description
                 * Allows you to customize the XML filename for vendor registration export.
                 * This user exit is called when generating the XML file for ERP export.
                 * @returns {string | void} Return a custom filename string, or void/null to use the default filename format
                 * @example
                 * SetCustomXmlFilename: function()
                 * {
                 *	var companyCode = Data.GetValue("Company__");
                 *	var msn = Data.GetValue("MSN");
                 *	return "VendorRegistration_" + companyCode + "_" + msn;
                 * }
                 */
                Server.SetCustomXmlFilename = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SetEmailNotificationFromNameAndAddress
                 * @since 341
                 * @description
                 * Allows you to customize the "From" email name and address for vendor registration emails.
                 * This user exit is called when sending emails to the vendor.
                 * @returns {{name: string, address: string} | void} Return a map containing the custom "From" email name and address, or void/null to use the default values
                 * @example
                 * SetFromEmailNameAndAddress: function()
                 * {
                 *	var companyCode = Data.GetValue("Company__");
                 *	return {
                 *		name: "VendorRegistration_" + companyCode,
                 *		address: "notifications@eskerondemand.com"
                 *	};
                 * }
                 */
                Server.SetEmailNotificationFromNameAndAddress = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnValidationScriptBegin
                 * @since 332
                 * @description
                 * This user exit is called at the beginning of the validation script.
                 * Allows you to initialize wrappers or execute custom functionality at the beginning of the vendor registration process.
                 * @returns {void}
                 * @example
                 * <caption>Disable VAT validation checks</caption>
                 * OnValidationScriptBegin: function()
                 * {
                 *	Sys.Helpers.VAT.CheckVAT = Sys.Helpers.Wrap(Sys.Helpers.VAT.CheckVAT, function (originalFn) {
                 *		Data.SetError("TaxID__", "");
                 *		return {
                 *			isValid: true
                 * 		};
                 * 	});
                 * }
                 */
                Server.OnValidationScriptBegin = function (currentName, currentAction) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.OnValidationScriptEnd
                 * @since 337
                 * @description
                 * This user exit is called at the end of the validation script.
                 * Allows you to finalize wrappers or execute custom functionality at the end of the vendor registration process.
                 * @param {String} currentName The name of the current workflow step
                 * @param {String} currentAction The action performed by the user that triggered the validation script (for example: "Approve", "Reject", "Submit", "Save", etc.)
                 * @param {Boolean} isRecallScriptScheduled Boolean value indicating if the user exit is expected to be called again in the current workflow step. The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step. This parameter is set to false after the last execution of the RecallScript function.
                 * 		Possible values are:
                 * 			true: The user exit is expected to be called again in the current workflow step.
                 * 			false: The user exit is not expected to be called again in the current workflow step.
                 * @returns {void}
                 * @example
                 * <caption>Load company-specific configuration after vendor registration updates</caption>
                 * OnValidationScriptEnd: function (currentName, currentAction, isRecallScriptScheduled)
                 * {
                 *     if (currentAction === "InitRegistrationUpdate" && Data.GetValue("CompanyCode__"))
                 *     {
                 *         Log.Info("[LoadConfiguration] companyCode : " + companyCode);
                 *         Lib.P2P.CompanyCodesValue.QueryValues(companyCode).Then(function (CCValues)
                 *         {
                 *             if (Object.keys(CCValues).length > 0)
                 *             {
                 *                 const newConf = CCValues.DefaultConfiguration__;
                 *                 Log.Info("[LoadConfigurationLog] Configuration to load : " + newConf + " for company code : " + companyCode);
                 *                 if (!newConf)
                 *                 {
                 *                     Log.Warn("No default configuration found for company code " + companyCode);
                 *                 }
                 *                 Lib.P2P.ChangeConfiguration(newConf);
                 *                 Variable.SetValueAsString("Configuration", newConf);
                 *             }
                 *         });
                 *     }
                 * }
                 */
                Server.OnValidationScriptEnd = function (currentName, currentAction, isRecallScriptScheduled) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.GetWorkflowActionComment
                 * @since 347
                 * @description
                 * Allows you to customize the comment value that is stored in the workflow history table when a workflow action is performed.
                 * By default, the comment field is cleared after certain workflow transitions.
                 * This user exit allows you to preserve the comment or provide a custom comment value.
                 * @param {string} action The workflow action being performed, can be  "approved", "backToPrevious" or "submitted"
                 * @param {string} defaultComment The default comment value that would be used by standard code (usually empty string)
                 * @returns {string | void} The comment to use for the workflow action. Return void or undefined to use the default comment.
                 * @example
                 * <caption>Keep the Comment__ field value for all workflow actions</caption>
                 * Server.GetWorkflowActionComment = function (action, defaultComment)
                 * {
                 *     // Preserve the comment entered by the user for all actions
                 *     return Data.GetValue("Comment__") || defaultComment;
                 * }
                 * @example
                 * <caption>Keep comment only for specific actions</caption>
                 * Server.GetWorkflowActionComment = function (action, defaultComment)
                 * {
                 *     // Only preserve comment for approve and backToPrevious actions
                 *     if (action === "approved" || action === "backToPrevious")
                 *     {
                 *         return Data.GetValue("Comment__") || defaultComment;
                 *     }
                 *     return defaultComment;
                 * }
                 */
                Server.GetWorkflowActionComment = function (action, defaultComment) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SetCustomOwner
                 * @since 346
                 * @description Sets a custom owner for the vendor registration process, when created via the "New supplier registration" process.
                 * @param {string} currentUserID The identifier of the current user.
                 * @returns {string | void} The identifier of the custom owner
                 * @example
                 * <caption>Assign the vendor registration process to a specific user</caption>
                 * SetCustomOwner: function (currentUserID)
                 * {
                 * 		return Sys.Parameters.GetInstance("AP").GetParameter("Z_VendorRegistrationOwner");
                 * }
                 */
                Server.SetCustomOwner = function (currentUserID) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.ShouldExportToSFTP
                 * @since 361
                 * @description Allows forcing the SFTP export for Vendor registration forms regardless of the ERP export method.
                 * @returns {boolean | void} Only an explicit true return value forces SFTP export; all other return values preserve default behavior based on ERPExportMethod.
                 * @example
                 * <caption>Force SFTP export even when ERPExportMethod is not "SFTP"</caption>
                 * ShouldExportToSFTP: function ()
                 * {
                 * 		return true;
                 * }
                 */
                Server.ShouldExportToSFTP = function () {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.CustomizeSFTPExport
                 * @since 348
                 * @description Allows to override the SFTP export for Vendor registrations forms.
                 * @returns {boolean | void} If export succeeded
                 * @example
                 * <caption>Override the SFTP export with a web service call</caption>
                 * CustomizeSFTPExport: function ()
                 * {
                 * 		var accessToken = GenerateAccessToken();
                 * 		if (!Sys.Helpers.IsEmpty(accessToken) && CallWebService(accessToken))
                 * 		{
                 * 			Log.Info("Vendor export done via Webservice call.");
                 * 			return true;
                 * 		}
                 * 		// Vendor export via Webservice call failed or not setup, use default SFTP export.
                 * 		return false;
                 * }
                 */
                Server.CustomizeSFTPExport = function () {
                };
                /**
                * @method Lib.VendorRegistration.Customization.Server.CustomizePaymentTermQueryFilter
                 * @since 352
                 * @description
                 * Allows you to customize the LDAP filter used to validate the payment term code against the `Country_Payment_Term__` table.
                 * Pass the masterDataPane as parameter to have access to the current values of the form and customize the filter accordingly.
                 * @param {any} masterDataPane  the current values of the form
                 * @returns {Sys.Helpers.LdapUtil.IFilter} The customized filter
                 * @example
                 * <caption>Match payment term by code only, ignoring country</caption>
                 * CustomizePaymentTermQueryFilter: function (masterDataPane)
                 * {
                 *     return Sys.Helpers.LdapUtil.FilterEqual("Code__", masterDataPane.PaymentTermCode__);
                 * }
                 */
                Server.CustomizePaymentTermQueryFilter = function (masterDataPane) {
                };
                /**
                 * @method Lib.VendorRegistration.Customization.Server.SkipRequiredFieldsValidation
                 * @since 353
                 * @description
                 * Allows you to skip the required fields validation during vendor registration approval.
                 * When this user exit returns `true`, the standard validation for CompanyCode__ and VendorNumber__ fields
                 * is bypassed, allowing the registration to proceed without these fields being mandatory.
                 * This is useful when the ERP integration provides these values automatically or when
                 * alternative business rules apply.
                 * @returns {boolean | void} Return `true` to skip the required fields validation. Return `false`, `void`, or `undefined` to use standard validation.
                 * @example
                 * <caption>Skip validation when vendor number is auto-generated by ERP</caption>
                 * SkipRequiredFieldsValidation = function ()
                 * {
                 * 	var registrationType = Data.GetValue("RegistrationType__");
                 * 	// Skip validation for update requests since vendor already exists
                 * 	if (registrationType === "update")
                 * 	{
                 * 		return true;
                 * 	}
                 * 	return false;
                 * }
                 * @example
                 * <caption>Skip validation for specific company codes</caption>
                 * SkipRequiredFieldsValidation = function ()
                 * {
                 * 	var country = Data.GetValue("Country__");
                 * 	// Skip validation for countries where vendor number is not required
                 * 	if (country === "US" || country === "CA")
                 * 	{
                 * 		return true;
                 * 	}
                 * 	return false;
                 * }
                 */
                Server.SkipRequiredFieldsValidation = function () {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = VendorRegistration.Customization || (VendorRegistration.Customization = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VENDORREGISTRATION_CUSTOMIZATION_SERVER_SAMPLE.js.map