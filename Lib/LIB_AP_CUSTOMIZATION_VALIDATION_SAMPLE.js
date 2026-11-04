"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VALIDATION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Validation Script AP customization callbacks",
  "versionable": false,
  "require": [
    "Sys/Sys_WorkflowController"
  ]
}*/
/**
 * Customization callbacks for the validation of the Vendor invoice process
 * @namespace Lib.AP.Customization.Validation
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var Validation;
            (function (Validation) {
                /**
                 * @namespace Lib.AP.Customization.Validation.CustomUserExits
                 * @description
                 * Allows you to define custom user exists added for this customer
                 * Functions defined in this scope will be accessible from outside this library
                 * They can be called the following way Lib.AP.Customization.Validation.CustomUserExits.GetCopyFileOwnerLogin()
                 * @example
                 * <pre><code>
                 * CustomUserExits:
                 * {
                 *		GetTopAccountServiceUser: function()
                 *		{
                 *			return Sys.Parameters.GetInstance("AP").GetParameter("Z_TopAccountServiceUser", "");
                 *		}
                 * },
                 * </code></pre>
                 */
                Validation.CustomUserExits = {};
                /**
                * @typedef {Object} Lib.AP.Customization.Validation.InvoiceExporter.ColumnRules
                * @property {string[]} excludedColumns list of excluded fields
                */
                /**
                * @typedef {Object} Lib.AP.Customization.Validation.InvoiceExporter.FieldsRules
                * List the rules for flexible form inclusion or exclusion
                * @property {string[]} excludedFields list of excluded fields used when exportMode = 0 (allExcept)
                * @property {string[]} includedFields list of included fields used when exportMode = 1 (onlyIncluded)
                */
                /**
                * @typedef Lib.AP.Customization.Validation.InvoiceExporter.ExcludedConditionalColumns
                * excludedConditionalColumn property defintion
                * @property {string} fieldConditional The column name used to compare values for each line
                * @property {Object.<string, Lib.AP.Customization.Validation.InvoiceExporter.ColumnRules>} conditionalTable  "Value to compare"
                */
                /**
                * @typedef {Object} Lib.AP.Customization.Validation.InvoiceExporter.TablesRule
                * List of options for table behavior as follow
                * @property {string} name table name (ex. "LineItems\_\_")
                * @property {boolean} includedFullTable true/false, specify if the whole table should be included from generation even if there are no lines (to define table columns).
                * Used when exportMode = 1 (onlyIncluded).
                * @property {boolean} excludedFullTable true/false, specify if the whole table should be excluded from generation.
                * Used when exportMode = 0 (allExcept).
                * @property {string[]} excludedColumns list of table columns to exclude. Used when exportMode = 0 (allExcept).
                * Exclusive with option excludedConditionalColumns
                * @property {string[]} includedColumns list of table columns which columns are always added in generation.
                * Used when exportMode = 1 (onlyIncluded)
                * @property {string[]} requiredColumns list of table columns which values are required for generation. When the table line has an empty value for required columns the line is not exported.
                * Option used in both export modes (onlyincluded and allExcept)
                * @property {Lib.AP.Customization.Validation.InvoiceExporter.ExcludedConditionalColumns} excludedConditionalColumns list of table columns to exclude after an equal comparison to a specified field.
                * Exclusive with option excludedColumns
                * @example { name: "ApproversList\_\_", requiredColumns: ["ApproverID\_\_"], excludedColumns: ["ApproverAction\_\_", "LineMarker\_\_", "WorkflowIndex\_\_", "WRKFIsGroup\_\_"] }
                */
                /**
                * @typedef {Object.<string, Object.<string, string> | string | Function>} Lib.AP.Customization.Validation.InvoiceExporter.FieldValuesMapping
                * Map to override or format the value of fields when generating the output XML
                * The key of this map is the FieldName__ for Header fields or the TableName__.ColumnName__ for line items values
                * You can override the value with
                * * An fixed value
                * * A map of values to change the value based on the original value
                * * A function to build the value to export. This function will receive the original field value and eventually the line item object
                * @example <caption>Z_CustomField will always have the invoice description value.
                * When InvoiceType__ is set to "PO Invoice (as FI)", replace the value in the XML with "Non-PO Invoice".
                * And when exporting a line Quantity, use the Z_ExtendedQuantity__ line value when it exists instead</caption>
                * {
                * 	"Z_CustomField__": Data.GetValue("InvoiceDescription__"),
                * 	"InvoiceType__": {
                * 		"PO Invoice (as FI)": "Non-PO Invoice"
                * 	},
                * 	"LineItems__.Quantity__": function (originalValue, lineItem)
                * 	{
                * 		if (!Sys.Helpers.IsEmpty(lineItem.GetValue("Z_ExtendedQuantity__")))
                * 		{
                * 			// Use value from another column of the line
                * 			return lineItem.GetValue("Z_ExtendedQuantity__");
                * 		}
                * 	}
                * }
                */
                /**
                 * @namespace Lib.AP.Customization.Validation.InvoiceExporter
                 */
                Validation.InvoiceExporter = {
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetXmlFilename
                     * @description
                     * Allows you to customize the name of the invoice XML file generated by the Vendor invoice process.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released.
                     * @param {string} defaultName The default computed filename.
                     * @returns {string} The name of the XML file or null to keep the default filename
                     * @example
                     * <pre><code>
                     * GetXmlFilename: function (defaultName)
                     * {
                     *	var suffix = "toPay";
                     *	if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) > 0)
                     *	{
                     *		suffix = "toValidate";
                     *	}
                     *	return Data.GetValue("MSNEx") + suffix;
                     * }
                     * </code></pre>
                     */
                    GetXmlFilename: function (defaultName) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetImageFilename
                     * @description
                     * Allows you to customize the name of the invoice image file generated by the Vendor invoice process.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released.
                     * @returns {string} The name of the image file or null to keep the default filename
                     * @example
                     * <pre><code>
                     * GetImageFilename: function ()
                     * {
                     *	var suffix = "toPay";
                     *	if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) > 0)
                     *	{
                     *		suffix = "toValidate";
                     *	}
                     *	return Data.GetValue("MSNEx") + suffix;
                     * }
                     * </code></pre>
                     */
                    GetImageFilename: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetOutputPath
                     * @since 328
                     * @description
                     * Allows you to customize the output path for the invoice.
                     * To change the filename of the xml file, use the GetXmlFilename user exit.
                     * To change the filename of the image file, use the GetImageFilename user exit.
                     * @param {string} outputPath Standard output path (in the format "<SFTP Account>\<SFTP Folder>\")
                     * @return {string} MUST END WITH "\" - The path where the invoice will be posted to (in the format "<SFTP Account>\<SFTP Folder>\")
                     * @example
                     * <caption>Customize output folder for MY_ERP</caption>
                     * InvoiceExporter.GetOutputPath = function (outputPath)
                     * 	{
                     * 		const erp = Data.GetValue("ERP__");
                     * 		if (erp === "MY_ERP")
                     * 		{
                     * 			return `Variable.GetValueAsString("FTPAccountName")\\MY_ERP\\`;
                     * 		}
                     * 		return outputPath;
                     * 	}
                     */
                    GetOutputPath: function (outputPath) {
                        // Must end with "\"
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomizeSFTPExport
                     * @since 344
                     * @description
                     * Allows you to completely override the standard SFTP export process.
                     * This user exit is called from the validation script before the standard ToSFTP method is executed.
                     * If this user exit returns true, the standard ToSFTP method will be skipped.
                     * If it returns false or null, the standard ToSFTP method will be executed.
                     *
                     * Use cases:
                     * - Usecase #1: Generate and send EDIFact file for EDIFiscal invoices (sent via AS2)
                     * - Usecase #2: Force TIFF format for MSE invoices (sent via AS2)
                     * - Usecase #3: Conditionally add custom file attachments (CSV, JSON, etc.)
                     *
                     * @param {boolean} exportImage Flag indicating if invoice image should be exported
                     * @param {string} exportImageFormat The format of the image ("TIF" or "PDF")
                     * @returns {boolean} Return true to skip standard ToSFTP, false/null to execute standard behavior
                     * @example
                     * CustomizeSFTPExport: function (exportImage, exportImageFormat)
                     * {
                     *     // Usecase #1: EDIFact file for EDIFiscal invoices
                     *     if (Data.GetValue("InvoiceType__") === "EDIFiscal")
                     *     {
                     *         var copyFileTransport = Process.CreateTransport("Copy");
                     *         var vars = copyFileTransport.GetUninheritedVars();
                     *         vars.AddValue_String("CopyPath", Lib.AP.InvoiceExporter.exportName.SFTP, true);
                     *
                     *         // Generate EDIFact file instead of XML
                     *         var edifactFile = GenerateEDIFactFile(); // Your custom function
                     *         var attach = copyFileTransport.AddAttachEx(edifactFile);
                     *         attach.GetVars().AddValue_String("AttachOutputName", "invoice.edifact", true);
                     *
                     *         copyFileTransport.Process();
                     *         return true; // Skip standard ToSFTP
                     *     }
                     *
                     *     // Usecase #2: Force TIFF format for MSE invoices
                     *     if (Data.GetValue("InvoiceType__") === "MSE")
                     *     {
                     *         Lib.AP.InvoiceExporter.ToSFTP(true, "TIF"); // Force TIFF format
                     *         return true; // Skip standard ToSFTP (already called)
                     *     }
                     *
                     *     // Usecase #3: Standard behavior for other invoices
                     *     return false; // Execute standard ToSFTP
                     * }
                     */
                    CustomizeSFTPExport: function (exportImage, exportImageFormat) {
                        return false; // false or null = use standard behavior
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetFieldsRules
                     * @description
                     * Allows you to customize the invoice XML file generated by the Vendor invoice process. The customizations made through this user exit concern only XML nodes originating from the Vendor invoice process header fields.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
                     * @param {number} exportMode The current exportMode integer value (0=allExcept or 1=onlyIncluded)
                     * @param {Lib.AP.Customization.Validation.InvoiceExporter.FieldsRules} fieldsRules The current rules for the flexible form fields
                     * @returns {Lib.AP.Customization.Validation.InvoiceExporter.FieldsRules} The updated rules about the fields to include or exclude
                     * @example
                     * <pre><code>
                     * GetFieldsRules: function (exportMode, fieldsRules)
                     * {
                     *	// In exclude export mode add InvoiceStatus in xml export for NON-PO invoices
                     *	var invoiceType = Data.GetValue("InvoiceType__");
                     *	var index = fieldsRules.excludedFields.indexOf("InvoiceStatus__");
                     *	if (exportMode == 0 && invoiceType === "Non-PO Invoice" && index !== -1)
                     *	{
                     *		fieldsRules.excludedFields.splice(index, 1);
                     *	}
                     *	return fieldsRules;
                     * }
                     * </code></pre>
                     * <pre><code>
                     * GetFieldsRules: function (exportMode, fieldsRules)
                     * {
                     *	// In include export mode add my customized field in xml export for NON-PO invoices
                     *	var invoiceType = Data.GetValue("InvoiceType__");
                     *	if (exportMode == 1 && invoiceType === "Non-PO Invoice")
                     *	{
                     *		fieldsRules.includedFields.push("Z_CustomizedField__");
                     *	}
                     *	return fieldsRules;
                     * }
                     * </code></pre>
                     */
                    GetFieldsRules: function (exportMode, fieldsRules) {
                        return fieldsRules;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetTablesRules
                     * @description
                     * Allows you to customize the invoice XML file generated by the Vendor invoice process. The customizations made through this user exit concern only XML nodes originating from the Vendor invoice process tables.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
                     * @param {number} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
                     * @param {Lib.AP.Customization.Validation.InvoiceExporter.TableRule[]} tablesRules The current rules for the flexible form tables
                     * @returns {Lib.AP.Customization.Validation.InvoiceExporter.TableRule[]} The updated rules about the tables to include or exclude
                     * @example
                     * <pre><code>
                     * // Add LineItems__ WBSElement__,  WBSElementID__ and also TradingPartner__ for GLLines
                     * GetTablesRules: function (exportMode, tablesRules)
                     * {
                     *	if (exportMode == 0)
                     *	{
                     *		for (var i = 0; i < tablesRules.length; i++)
                     *		{
                     *			if (tablesRules[i].name === "LineItems__")
                     *			{
                     *				var POLine = tablesRules[i].excludedConditionalColumns.conditionalTable.PO.excludedColumns;
                     *				var GLLine = tablesRules[i].excludedConditionalColumns.conditionalTable.GL.excludedColumns;
                     *
                     *				POLine.splice(POLine.indexOf('WBSElement__'), 1);
                     *				POLine.splice(POLine.indexOf('WBSElementID__'), 1);
                     *
                     *				GLLine.splice(GLLine.indexOf('TradingPartner__'), 1);
                     *				GLLine.splice(GLLine.indexOf('WBSElement__'), 1);
                     *				GLLine.splice(GLLine.indexOf('WBSElementID__'), 1);
                     *			}
                     *		}
                     *	}
                     *	return tablesRules;
                     * }
                     * </code></pre>
                     */
                    GetTablesRules: function (exportMode, tablesRules) {
                        return tablesRules;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetExportMode
                     * @since 330
                     * @description
                     * Enables customization of the export mode for the invoice XML file generated during the Vendor invoice process.
                     * If exportMode is set to 1 (onlyIncluded), you must define the fieldsRules.includedFields variable
                     * in the GetFieldsRules or GetTablesRules user exits.
                     * This user exit is invoked from the validation script of the Vendor invoice process, either when the invoice is posted or when the payment is released.
                     * @param {number} exportMode The current exportMode value: 0 (allExcept) or 1 (onlyIncluded)
                     * @returns {number} The modified export mode
                     * @example <caption>Force the export mode to 1</caption>
                     * GetExportMode: function (exportMode)
                     * {
                     *  return 1;
                     * }
                     */
                    GetExportMode: function (exportMode) {
                        return exportMode;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetModifiedNodeNameMappings
                     * @description
                     * Allows you to specify names for the XML nodes corresponding to custom fields of the Vendor invoice process.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
                     * @param {number} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
                     * @param {Object.<string, Object.<string, string>>} modifiedNodeNameMappings The current fields mapping
                     * @returns {Object.<string, Object.<string, string>>} The updated fields mapping to include or exclude
                     * @example
                     * <pre><code>
                     * // Add a mapping to put the value of custom field Z_GroupId__ to xml field AdditionalField1
                     * GetModifiedNodeNameMappings: function (exportMode, modifiedNodeNameMappings)
                     * {
                     *	modifiedNodeNameMappings.Z_GroupId__ = "AdditionalField1";
                     *	return modifiedNodeNameMappings;
                     * }
                     * </code></pre>
                     */
                    GetModifiedNodeNameMappings: function (exportMode, modifiedNodeNameMappings) {
                        return modifiedNodeNameMappings;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetFieldValuesMapping
                     * @description
                     * Allows you to override some fields values in the resulting XML.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
                     * @param {Lib.AP.Customization.Validation.InvoiceExporter.FieldValuesMapping} modifiedFieldValuesMapping The current fields values mapping
                     * @returns {Lib.AP.Customization.Validation.InvoiceExporter.FieldValuesMapping} The updated fields values
                     * @example <caption>Add a mapping to set the due date empty for NON-PO invoices and override a quantity field with an extended quantity value</caption>
                     * GetFieldValuesMapping: function (modifiedFieldValuesMapping)
                     * {
                     * 	modifiedFieldValuesMapping.InvoiceType__ = {
                     *		"PO Invoice (as FI)": "Non-PO Invoice",
                     *		"AnotherKey": "Another Label"
                     *	};
                     *	modifiedFieldValuesMapping["LineItems__.Quantity__"] = function (originalValue, lineItem)
                     *	{
                     *		if (lineItem && Lib.AP.Customization.Common.CustomFunctions.isExtendedQuantityActivated()
                     *			&& !Sys.Helpers.IsEmpty(lineItem.GetValue("Z_ExtendedQuantity__")))
                     *		{
                     *			// Use extended quantity field instead of standard Quantity__ column
                     *			return lineItem.GetValue("Z_ExtendedQuantity__");
                     *		}
                     *		return originalValue;
                     *	}
                     *	return modifiedFieldValuesMapping;
                     * }
                     */
                    GetFieldValuesMapping: function (modifiedFieldValuesMapping) {
                        return modifiedFieldValuesMapping;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetFieldValuesTransformation
                     * @description
                     * Allows you to customize the transformation of the field values in the resulting XML.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
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
                    GetFieldValuesTransformation: function (transformations) {
                        return transformations;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetHeaderColumnsList
                     * @since 330
                     * @description
                     * Allows you to customize the header fields to be exported in the resulting XML (including the order).
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
                     * @param {Array<Object<string, any>>} fieldList The list of header fields with associated values. The list can be filtered or reordered before the export in the XML.
                     * @example <caption>Move the first field in the 4th position</caption>
                     * GetHeaderColumnsList: function (fieldList)
                     * {
                     *   var fieldToMove = fieldList.shift();
                     *   fieldList.splice(3, 0, fieldToMove);
                     * }
                     */
                    GetHeaderColumnsList: function (fieldList) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomizeERPNotifier
                     * @description
                     * Allows you to customize the value of variables and fields of the process to which invoice files are submitted when invoices are posted in the ERP via Esker Loader.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
                     * @param {xTransport} erpNotifierProcess The xTransport object of the ERPNotifer that will be created
                     * @example
                     * <pre><code>
                     * CustomizeERPNotifier: function (erpNotifierProcess)
                     * {
                     *	var vars = erpNotifierProcess.GetUninheritedVars();
                     *	vars.AddValue_Date("InvoiceDate__", Data.GetValue("InvoiceDate__"), true);
                     * }
                     * </code></pre>
                     */
                    CustomizeERPNotifier: function (erpNotifierProcess) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomizeInvoiceImageURL
                     * @description
                     * Allows you to customize the image URL to attach to the document
                     * This user exit is called from the CustomiseInvoiceXmlFile of Lib_AP_ExportInvoice, when posting an invoice with any ERP.
                     * @param {string} imageURL Image URL
                     * @example
                     * <pre><code>
                     * CustomizeInvoiceImageURL: function (imageURL)
                     * {
                     * 	return Lib.AP.GetURLFromSSO(imageURL)
                     * }
                     * </code></pre >
                     */
                    CustomizeInvoiceImageURL: function (imageURL) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomizeInvoiceDocumentURL
                     * @description
                     * Allows you to customize the invoice form URL to attach to the document
                     * This user exit is called from the CustomiseInvoiceXmlFile of Lib_AP_ExportInvoice, when posting an invoice with any ERP.
                     * @param {string} invoiceURL Invoice form URL
                     * @example
                     * <pre><code>
                     * CustomizeInvoiceDocumentURL: function (invoiceURL)
                     * {
                     * 	return Lib.AP.GetURLFromSSO(invoiceURL)
                     * }
                     * </code></pre >
                    */
                    CustomizeInvoiceDocumentURL: function (invoiceURL) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.ShouldExportXMLWhenArchiving
                     * @description
                     * Allows you to specify whether an XML file should be sent to the ERP when archiving an invoice.
                     * This user exit is called from the validation script of the Vendor invoice process when archiving an invoice
                     * If the Accounts Payable module is integrated with NAV, when the user clicks Archive in Vendor invoice process:
                     * - The name of the XML file is suffixed with _Archive.
                     * - The XML file contains the manually entered ERP invoice number.
                     *
                     * This mechanism is used by the version 1.4.6 of the NAV integration kit. If an XML file with _Archive suffixed to its name is detected in NAV, a link to the invoice in the Accounts Payable module is added to the invoice in NAV.
                     * @returns {boolean}
                     * @example
                     * <pre><code>
                     * ShouldExportXMLWhenArchiving: function ()
                     * {
                     *	return true;
                     * }
                     * </code></pre>
                     */
                    ShouldExportXMLWhenArchiving: function () {
                        return false;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.ShouldExportXML
                     * @since 347
                     * @description
                     * Allows you to override the export decision for invoice XML files based on custom conditions.
                     * This user exit is called after the standard export logic has determined whether to export,
                     * but before the final decision is made. You can use this to prevent or force export based on
                     * workflow state, invoice type, custom fields, or any other business logic.
                     *
                     * Common use cases:
                     * - Prevent export when waiting for credit notes
                     * - Conditional export based on custom workflow modes
                     * - Override export for specific invoice types or company codes
                     *
                     * @param {boolean} allowExport The current export decision from standard logic
                     * @param {boolean} postCondition Whether this is a post condition (approval at start)
                     * @param {boolean} updateCondition Whether this is an update condition
                     * @param {boolean} workflowFinished Whether the workflow is completely finished
                     * @returns {boolean|void} Return false to prevent export, true to force export, or null/undefined to keep the standard decision
                     * @example
                     * <caption>Prevent export when waiting for credit note (except for PO Invoices)</caption>
                     * InvoiceExporter.ShouldExportXML: function (allowExport, postCondition, updateCondition, workflowFinished)
                     * {
                     *     // Do not export payment approved XML if a credit note is awaited - does not apply for PO Invoices
                     *     if (workflowFinished && Data.GetValue("Z_WaitingForCreditNote__") && Data.GetValue("InvoiceType__") !== "PO Invoice")
                     *     {
                     *         return false;
                     *     }
                     *     return allowExport;
                     * }
                     * @example
                     * <caption>Custom workflow mode (only export in default mode)</caption>
                     * InvoiceExporterShouldExportXML: function (allowExport, postCondition, updateCondition, workflowFinished)
                     * {
                     *     var workflowMode = Data.GetValue("Z_WorkflowMode__") || "Default";
                     *     if (workflowMode === "ARC") // Archive mode - no export
                     *     {
                     *         return false;
                     *     }
                     *     return allowExport;
                     * }
                     */
                    ShouldExportXML: function (allowExport, postCondition, updateCondition, workflowFinished) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.SetInvoiceXmlAttachmentVars
                     * @description
                     * Allows you to customize the variables attached to the invoice XML file.
                     * This user exit is called from the validation script of the Vendor invoice process, when the invoice is posted or when the payment is released
                     * @param {xVars} attachmentVars The xVars object to which the variables are attached
                     * @example
                     * <pre><code>
                     * SetInvoiceXmlAttachmentVars: function (attachmentVars)
                     * {
                     *	var erp = Data.GetValue("Z_ERP__") || Variable.GetValueAsString("Z_ERP__");
                     *  var erpFileFormat = Variable.GetValueAsString("Z_ERPFileFormat__");
                     *  Log.Info("[SetInvoiceXmlAttachmentVars] ERP: ", erp, " - file format: ", erpFileFormat);
                     *  if (erpFileFormat.toLowerCase() === "csv") {
                     * 	  var templateName = "OutputInvoiceXMLToCSV_" + erp + ".xsl";
                     * 	  var xslOption = "?xsl=%Templates%\\" + templateName;
                     * 	  attachmentVars.AddValue_String("AttachInputFormat", ".xml", true);
                     * 	  attachmentVars.AddValue_String("AttachOutputFormat", ".csv", true);
                     * 	  attachmentVars.AddValue_String("AttachConverterToUse", "Xml2All", true);
                     * 	  attachmentVars.AddValue_String("AttachType", "inline", true);
                     * 	  attachmentVars.AddValue_String("AttachStyle", xslOption, true);
                     *   }
                     * }
                     * </code></pre>
                     */
                    SetInvoiceXmlAttachmentVars: function (attachmentVars) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomizeSFTPTransport
                     * @since 328
                     * @description
                     * Allows you to customize the SFTP transport used to post output files in the SFTP folder
                     * @param {xTransport} transport The SFTP transport object
                     * @param {string} outputPath The output path (in the format "<SFTP Account>\<SFTP Folder>\")
                     * @example
                     * <caption>Add a CSV File as attachment</caption>
                     * CustomizeSFTPTransport: function (transport, outputPath)
                     * {
                     * 	var tempFile = TemporaryFile.CreateFile("csv", "utf8");
                     * 	TemporaryFile.Append(tempFile, "InvoiceNumber;VendorNumber\r\n");
                     * 	TemporaryFile.Append(tempFile, `${Data.GetValue("InvoiceNumber__")};${Data.GetValue("VendorNumber__")}\r\n`);
                     *
                     * 	// Attaches the temporary File to the transport.
                     * 	var attach = transport.AddAttachEx(tempFile);
                     * 	var attachVars = attach.GetVars();
                     * 	attachVars.AddValue_String("AttachType", "converted", true);
                     * 	attachVars.AddValue_String("AttachType", "inline", true);
                     * 	attachVars.AddValue_String("AttachEncoding", "utf8", true);
                     * 	attachVars.AddValue_String("AttachOutputName", outputPath + Data.GetValue("MSN") + "_mycsv.csv", true);
                     * }
                     */
                    CustomizeSFTPTransport: function (transport, outputPath) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.OnExportIfNeededEnd
                     * @since 332
                     * @description
                     * Allows you to add customizations in ExportIfNeeded function
                     * @param {Lib.AP.InvoiceExporter.InvoiceExportConfig} ret Object that contains booleans indicating if the invoice, image, and image format have been exported
                     * @param {ESKMap<string>} modifiedNodeNameMappings List of names that replace default names of fields in the invoice
                     * @param {ESKMap<string>} fieldValuesMapping list of fields containing values to replace in the invoice
                     * @example
                     * <caption>Save the XML content in a variable</caption>
                     * OnExportIfNeededEnd : function (ret, modifiedNodeNameMappings, fieldValuesMapping)
                     * {
                     * 		const customerName = "customerName";
                     * 		const invoiceXML = TemporaryFile.CreateFile("xml", Lib.AP.InvoiceExporter.xmlEncoding === "UTF-16" ? "utf16" : "utf8");
                     *		Lib.AP.InvoiceExporter.InitExportRules();
                     *		Lib.FlexibleFormToXML.setOptions(Lib.AP.InvoiceExporter.xmlEncoding, "Invoice", Lib.AP.InvoiceExporter.fieldsRules, Lib.AP.InvoiceExporter.tablesRules, Data, [], Lib.AP.InvoiceExporter.exportMode, modifiedNodeNameMappings, null, fieldValuesMapping);
                     *		Lib.FlexibleFormToXML.GetXMLFile(invoiceXML, Lib.AP.InvoiceExporter.CustomiseInvoiceXmlFile);
                     *		//Put the content in a variable
                     *		if (Variable.SetValueAsString(customerName, invoiceXML.GetContent({
                     *			detectEncoding: true
                     *		}))) {
                     *			Log.Info("customer XML saved as \"" + customerName + "\"");
                     *		} else {
                     *			Log.Error("CreatecustomerXML: customer XML NOT saved");
                     *		}
                     * }
                     */
                    OnExportIfNeededEnd: function (ret, modifiedNodeNameMappings, fieldValuesMapping) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.AddLineBreaksInXML
                     * @since 332
                     * @description
                     * Allows you to include line breaks in the invoice XML sent to the ERP.
                     * @returns {boolean} return true to include line breaks in the invoice XML
                     * @example
                     * <caption>Add line breaks in XML</caption>
                     * AddLineBreaksInXML: function ()
                     * {
                     * 	return true;
                     * }
                     */
                    AddLineBreaksInXML: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomizeInvoiceExportImage
                     * @description Allows you to customize the invoice image export to the ERP.
                     * exportImage => indicates whether the image should be exported or not, exportImageFormat => indicates the image format to use.
                     * @param {Lib.AP.InvoiceExporter.InvoiceExportConfig} invoiceExportConfig The configuration object for invoice export.
                     * @returns {Object.<string, string>} exportImage and exportImageFormat.
                     * @example <caption>Force the generation of the image file</caption>
                     * CustomizeInvoiceExportImage: function (invoiceExportConfig)
                     * {
                     * 	 return {
                     * 		exportImage: true,
                     * 		exportImageFormat: invoiceExportConfig.exportImageFormat
                     * 	 };
                     * }
                     */
                    CustomizeInvoiceExportImage: function (invoiceExportConfig) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.GetDocumentImageFileRef
                     * @since 361
                     * @description
                     * Allows you to customize the priority order of the file sources used to retrieve
                     * the document image (GDRTiffFile, ConvertedFiles, FileContent).
                     * Called before the standard cascade (GDRTiffFile -> ConvertedFiles -> FileContent).
                     * Return a file ref string to use it. Return void to keep the standard behavior.
                     * @param {xVars} attachVars The vars of the processed document.
                     * @returns {string | void} The file ref to use, or void to use the standard cascade.
                     * @example <caption>Custom priority: FileContent then ConvertedFiles then GDRTiffFile</caption>
                     * GetDocumentImageFileRef: function (attachVars)
                     * {
                     * 	let file = attachVars.GetValue_FileRef("FileContent", 0);
                     * 	if (!file) { file = attachVars.GetValue_FileRef("ConvertedFiles", 0); }
                     * 	if (!file) { file = attachVars.GetValue_FileRef("GDRTiffFile", 0); }
                     * 	return file;
                     * };
                     */
                    GetDocumentImageFileRef: function (attachVars) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomiseInvoiceXmlFile
                     * @since 335
                     * @description Allows you to customize the invoice XML file export to the ERP.
                     * @param {File} invoiceXml The base invoice XML file.
                     * @return {File | void} Return the customized invoice XML file.
                     * Return null to keep the default invoice XML file.
                     * @example
                     * <caption>Convert the xml file to a custom format</caption>
                     * InvoiceExporter.CustomiseInvoiceXmlFile = function (invoiceXml)
                     * {
                     *	 function ConvertXmlToCustomFormat(xmlContent) {
                     *		 // Custom logic to convert XML content to a custom format
                     *		 return xmlContent; // Return the modified XML content
                     *	 }
                     *	 const customInvoiceXml = TemporaryFile.CreateFile("xml", "utf8");
                     *	 const invoiceXmlContent = ConvertXmlToCustomFormat(invoiceXml.GetContent());
                     *	 TemporaryFile.Append(customInvoiceXml, invoiceXmlContent);
                     *	 return customInvoiceXml;
                     * };
                     */
                    CustomiseInvoiceXmlFile: function (invoiceXml) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.UseFirstPOLineOrderNumberForJDE
                     * @since 351
                     * @description
                     * For JDE ERP: Enables replacing the header OrderNumber with the first PO line order number before XML export.
                     * This fixes JDE connector parsing errors when header OrderNumber contains multiple comma-separated values
                     * (e.g., "12345,OP-3000-67890").
                     *
                     * When enabled, the standard code will automatically find the first PO line item with a valid OrderNumber
                     * and use it as the header OrderNumber in the exported XML.
                     *
                     * This is specific to InvoiceType__ === "PO Invoice" and will not impact other invoice types.
                     *
                     * @returns {boolean} Return true to enable the replacement, false or void to keep standard behavior
                     * @example <caption>Enable JDE OrderNumber replacement for all JDE invoices</caption>
                     * UseFirstPOLineOrderNumberForJDE: function ()
                     * {
                     *     return true;
                     * }
                     * @example <caption>Enable JDE OrderNumber replacement only for specific company codes</caption>
                     * UseFirstPOLineOrderNumberForJDE: function ()
                     * {
                     *     var companyCode = Data.GetValue("CompanyCode__");
                     *     return companyCode === "US01" || companyCode === "US02";
                     * }
                     */
                    UseFirstPOLineOrderNumberForJDE: function () {
                    },
                    /*
                     * @method Lib.AP.Customization.Validation.InvoiceExporter.CustomizeLineAddConditions
                     * @since 334
                     * @description
                     * Allows you to customize the conditions for adding lines in the invoice XML.
                     * @return {Function | void} A function that returns true if the line should be added, false otherwise.
                     * * If this function is not defined, all lines will be added.
                     * * @example For table "LineItems__", add line if field customized Z_isFreight__ is empty
                     * <pre><code>
                     * CustomizeLineAddConditions: function ()
                     * {
                     * 	return {
                     * 		"LineItems__": function (item)
                     * 		{
                     *			return Sys.Helpers.IsEmpty(item.GetValue("Z_isFreight__"));
                     *		}
                     *	};
                     * }
                     * </code></pre>
                     * * @example For table "LineItems__", skip all lines
                     * <pre><code>
                     * CustomizeLineAddConditions: function ()
                     * {
                     * 	return {
                     * 		"LineItems__": function (item)
                     * 		{
                     *			return false;
                     *		}
                     *	};
                     * }
                     * </code></pre>
                     */
                    CustomizeLineAddConditions: function () {
                    }
                };
                /**
                 * @typedef {Object} Lib.AP.Customization.Validation.SAP.ClearingHeaderDates
                 * @property {Date} [invoiceDate]
                 * @property {Date} [postingDate]
                 */
                /**
                 * Specifics customization for SAP
                 * @namespace Lib.AP.Customization.Validation.SAP
                 */
                Validation.SAP = {
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnFIHeaderSet
                     * @description
                     * Allows you to customize the SAP header information transmitted through the BAPI parameters of the FIHeaderSet function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP.
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} documentHeader The DOCUMENTHEADER structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnFIHeaderSet: function (params, documentHeader)
                     * {
                     * 	documentHeader.SetValue("SAPFIELD", Data.GetValue("MyNewField__"));
                     * }
                     * </code></pre>
                     */
                    OnFIHeaderSet: function (params, documentHeader) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.CustomizeClearingHeaderDates
                     * @description
                     * Allows you to customize the header dates, invoice date and clearing date in the clearing form.
                     * This user exit is called from the validation script of the Vendor invoice clearing.
                     * @returns {Lib.AP.Customization.Validation.SAP.ClearingHeaderDates}
                     * @example
                     * <pre><code>
                     *	CustomizeClearingHeaderDates: function (Data)
                     *	{
                     * 		var latestInvoiceDate = null;
                     *		var lineItems = Data.GetTable("LineItems__");
                     *		for (var idx = 0; idx < lineItems.GetItemCount(); idx++)
                     *		{
                     *			var line = lineItems.GetItem(idx);
                     *			var lineType = line.GetValue("LineType__");
                     *			if (lineType === "Vendor")
                     *			{
                     *				var invoiceDate = line.GetValue("InvoiceDate__");
                     *				if (!latestInvoiceDate || latestInvoiceDate < invoiceDate)
                     *				{
                     *					latestInvoiceDate = invoiceDate;
                     *				}
                     *			}
                     *		}
                     *		if (latestInvoiceDate)
                     *		{
                     *			return {
                     *				postingDate: latestInvoiceDate,
                     *				invoiceDate: latestInvoiceDate
                     *			};
                     *		}
                     *		return null;
                     *	}
                     * </code></pre>
                     */
                    CustomizeClearingHeaderDates: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnFIAddInvoiceLineForClearing
                     * @since 358
                     * @description
                     * Allows you to customize the SAP vendor line information transmitted through the BAPI parameters of the FIAddInvoiceLineForClearing function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting a clearing invoice in the FI module of SAP.
                     * @param {Object} params The BAPI structure that will be sent to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {Object} accountPayableItem The ACCOUNTPAYABLE structure that will be sent to SAP
                     * @param {Object} currencyAmountItem The CURRENCYAMOUNT structure that will be sent to SAP
                     * @example <caption>Set payment terms from a custom line field</caption>
                     * OnFIAddInvoiceLineForClearing: function (params, line, accountPayableItem, currencyAmountItem)
                     * {
                     * 	var customPaymentTerms = line.GetValue("Z_PaymentTerms__");
                     * 	if (customPaymentTerms)
                     * 	{
                     * 		accountPayableItem.SetValue("PMNTTRMS", customPaymentTerms);
                     * 	}
                     * }
                     */
                    OnFIAddInvoiceLineForClearing: function (params, line, accountPayableItem, currencyAmountItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnFIAddVendorLine
                     * @description
                     * Allows you to customize the SAP vendor information transmitted through the BAPI parameters of the FIAddVendorLine function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} accountPayableItem The ACCOUNTPAYABLE structure that will be send to SAP
                     * @param {Object} currencyAmountItem TThe CURRENCYAMOUNT structure that will be send to SAP
                     */
                    OnFIAddVendorLine: function (params, accountPayableItem, currencyAmountItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnFIAddGLLine
                     * @description
                     * Allows you to customize the SAP non-PO line information transmitted through the BAPI parameters of the FIAddGLLine function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                     *
                     * You can also use this user exit to redirect a GL line to the ACCOUNTPAYABLE table instead of ACCOUNTGL.
                     * To do this, remove the just-added ACCOUNTGL record using params.GetTable().Remove() and create a new ACCOUNTPAYABLE record instead.
                     *
                     * @param {Object} params The BAPI structure that will be sent to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {Object} accountGLItem The ACCOUNTGL structure that will be sent to SAP
                     * @param {Object} currencyAmountItem The CURRENCYAMOUNT structure that will be sent to SAP
                     * @example <caption>Example 1: Add a custom field to the GL line</caption>
                     * <pre><code>
                     * OnFIAddGLLine: function (params, line, accountGLItem, currencyAmountItem)
                     * {
                     * 	accountGLItem.SetValue("CS_TRANS_T", line.GetValue("Z_Transaction_type__"));
                     * }
                     * </code></pre>
                     * @example <caption>Example 2: Redirect auxiliary GL accounts to ACCOUNTPAYABLE table</caption>
                     * <pre><code>
                     * OnFIAddGLLine: function (params, line, accountGLItem, currencyAmountItem)
                     * {
                     * 	var glAccount = accountGLItem.GetValue("GL_ACCOUNT");
                     * 	// Check if this is an auxiliary account that should go to ACCOUNTPAYABLE
                     * 	if (glAccount && glAccount.indexOf("408") === 0)
                     * 	{
                     * 		// Remove the ACCOUNTGL record that was just added
                     * 		var accountGLTable = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTGL");
                     * 		accountGLTable.Remove(accountGLTable.Count - 1);
                     *
                     * 		// Create an ACCOUNTPAYABLE record instead
                     * 		var accountPayable = params.GetTable("BAPI_ACC_DOCUMENT", "ACCOUNTPAYABLE").AddNew();
                     * 		accountPayable.SetValue("ITEMNO_ACC", accountGLItem.GetValue("ITEMNO_ACC"));
                     * 		accountPayable.SetValue("VENDOR_NO", Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10));
                     * 		accountPayable.SetValue("GL_ACCOUNT", glAccount);
                     * 		accountPayable.SetValue("COMP_CODE", accountGLItem.GetValue("COMP_CODE"));
                     * 		accountPayable.SetValue("TAX_CODE", accountGLItem.GetValue("TAX_CODE"));
                     * 		accountPayable.SetValue("TAXJURCODE", accountGLItem.GetValue("TAXJURCODE"));
                     * 		accountPayable.SetValue("ITEM_TEXT", accountGLItem.GetValue("ITEM_TEXT"));
                     * 		accountPayable.SetValue("BUS_AREA", accountGLItem.GetValue("BUS_AREA"));
                     * 		accountPayable.SetValue("ALLOC_NMBR", accountGLItem.GetValue("ALLOC_NMBR"));
                     * 		accountPayable.SetValue("PROFIT_CTR", accountGLItem.GetValue("PROFIT_CTR"));
                     * 		// Note: CURRENCYAMOUNT already created with same ITEMNO_ACC, no changes needed
                     * 	}
                     * }
                     * </code></pre>
                     */
                    OnFIAddGLLine: function (params, line, accountGLItem, currencyAmountItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnFIAddTaxLine
                     * @description
                     * Allows you to customize the SAP tax line information transmitted through the BAPI parameters of the FIAddTaxLine function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} sapTaxAccount The tax account retrieved from SAP
                     * @param {Object} accountTaxItem The ACCOUNTTAX structure that will be send to SAP
                     * @param {Object} currencyAmmountTax The CURRENCYAMOUNT structure that will be send to SAP
                     */
                    OnFIAddTaxLine: function (params, sapTaxAccount, accountTaxItem, currencyAmmountTax) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnFIAddWht
                     * @since 352
                     * @description
                     * Allows you to customize the SAP Extended Withholding Taxes transmitted through the BAPI parameters of the FIAddWHT function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP.
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} accountWhtTable The ACCOUNTWT table of the BAPI structure that will be sent to SAP
                     * @example <caption>Override a WHT base amount for all entries</caption>
                     * OnFIAddWht = function (params, accountWhtTable)
                     * {
                     * 	for (var idx = 0; idx < accountWhtTable.Count; idx++)
                     * 	{
                     * 		accountWhtTable.Get(idx).SetValue("BAS_AMT_IND", "2");
                     * 	}
                     * };
                     * @example <caption>Remove a WHT item / clear all WHT items</caption>
                     * OnFIAddWht = function (params, accountWhtTable)
                     * {
                     * 	// Remove a single entry by its index
                     * 	accountWhtTable.Remove(0);
                     *
                     * 	// Or remove every entry, for instance when the invoice is exempt from withholding
                     * 	if (Data.GetValue("Z_ExemptFromWht__"))
                     * 	{
                     * 		accountWhtTable.Clear();
                     * 	}
                     * };
                     */
                    OnFIAddWht: function (params, accountWhtTable) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnSetFIUnblockPaymentInvoiceReference
                     * @description
                     * Allows you to customize the invoice payment reference
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                     * @param {Object} invRef The invoice reference
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} parsedDocNumber The invoice document parsed
                     * @param {string} invoiceType The invoice type of document
                     * @example
                     * <pre><code>
                     * OnSetFIUnblockPaymentInvoiceReference: function(invRef, params, parsedDocNumber, invoiceType)
                     * {
                     *		if (invRef)
                     *		{
                     *			var companyCode = parsedDocNumber.companyCode ? Sys.Helpers.String.PadRight(parsedDocNumber.companyCode, " ", 4) : "    ";
                     *			var referenceKey = parsedDocNumber.documentNumber + companyCode + parsedDocNumber.fiscalYear;
                     *
                     *			params.AddBapi("RFC_READ_TABLE");
                     *			params.BapiController.InitBapi("RFC_READ_TABLE");
                     *			var results = Sys.Helpers.SAP.ReadSAPTable(params.GetBapi("RFC_READ_TABLE"), "BKPF", "AWKEY", "BELNR = '" + parsedDocNumber.documentNumber + "' AND BUKRS = '" + companyCode + "' AND GJAHR = '" + parsedDocNumber.fiscalYear + "'", 1, 0, false, { "useCache": true });
                     *			if (results && results.length > 0)
                     *			{
                     *				referenceKey = results[0].AWKEY;
                     *			}
                     *
                     *			invRef.SetValue("OBJ_KEY", referenceKey);
                     *		}
                     * }
                     * </code></pre>
                     */
                    OnSetFIUnblockPaymentInvoiceReference: function (invRef, params, parsedDocNumber, invoiceType) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.ShouldUnblockFIPayment
                     * @description
                     * Allows you to block payment in SAP. By default the value is return to true to unblock payment.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                      * @returns {boolean} return false to block payment
                     */
                    ShouldUnblockFIPayment: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnMMHeaderSet
                     * @description
                     * Allows you to customize the SAP header information transmitted through the BAPI parameters of the MMHeaderSet function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} headerData The HEADERDATA structure that will be send to SAP
                     */
                    OnMMHeaderSet: function (params, headerData) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnMMAddPOLine
                     * @description
                     * Allows you to customize the SAP PO line information transmitted through the BAPI parameters of the MMAddPOLine function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {Object} poItemData The current PO item information
                     * @param {Object} itemData The ITEMDATA structure that will be send to SAP
                     */
                    OnMMAddPOLine: function (params, line, poItemData, itemData) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnMMAddPOLineDuplicate
                     * @description
                     * Allows you to customize the SAP PO line information when merging duplicate invoice lines that reference the same PO number and item number.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP.
                     * Unlike OnMMAddPOLine which is called only for new lines, this user exit is specifically called during the duplicate/merge scenario,
                     * enabling customization of analytical accounting dimensions on the consolidated line.
                     * @param {Object} duplicate The existing ITEMDATA structure being updated with merged values
                     * @param {Item} line The current line item being merged into the duplicate
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} poItemData The current PO item information
                     * @param {boolean} isServiceItem Whether the PO item is a service item
                     * @param {boolean} isLimitItem Whether the PO item is a limit item
                     * @example
                     * OnMMAddPOLineDuplicate: function (duplicate, line, poItemData, isServiceItem, isLimitItem)
                     * {
                     *     var currentPo = line.GetValue("Z_PONumber__");
                     *     if (currentPo)
                     *     {
                     *         var existingPo = duplicate.GetValue("PO_NUMBER");
                     *         duplicate.SetValue("PO_NUMBER", existingPo ? existingPo + ";" + currentPo : currentPo);
                     *     }
                     * }
                     */
                    OnMMAddPOLineDuplicate: function (duplicate, line, poItemData, isServiceItem, isLimitItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnMMAddGLLine
                     * @description
                     * Allows you to customize the SAP non-PO line information transmitted through the BAPI parameters of the MMAddGLLine function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {Object} accountGLItem The ACCOUNTGL structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnMMAddGLLine: function (params, line, accountGLItem)
                     * {
                     * 	accountGLItem.SetValue("CS_TRANS_T", line.GetValue("Z_Transaction_type__"));
                     * }
                     * </code></pre>
                     */
                    OnMMAddGLLine: function (params, line, accountGLItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnMMAddTaxData
                     * @description
                     * Allows you to customize the SAP tax data transmitted through the BAPI parameters of the MMAddTaxData function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} taxCodeValues Tax information
                     * @param {Object} taxDataItem The TAXDATA structure that will be send to SAP
                     */
                    OnMMAddTaxData: function (params, taxCodeValues, taxDataItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnCalculateTaxFromNet
                     * @since 359
                     * @description
                     * Server-side counterpart of `Lib.AP.Customization.HTMLScripts.SAP.OnCalculateTaxFromNet`.
                     *
                     * Called in `Lib.AP.SAP.SAPTaxFromNetBapiServer.Init` (used by both the tax-rate flow
                     * `GetTaxRateFromTaxCode` and the tax-amount flow `Calculate` / `GetTaxFromNetServer`),
                     * after the standard parameters `I_BUKRS`, `I_MWSKZ`, `I_TXJCD`, `I_WAERS`, `I_WRBTR`,
                     * `I_PROTOKOLL`, `I_PRSDT`, `I_ZBD1P` have been set, but before `Z_ESK_CALCULATE_TAX_FRM_NET`
                     * is invoked.
                     *
                     * Use it to mutate the BAPI parameters server-side (and/or build the coding line). Add or
                     * override exported fields directly through `bapi.ExportsPool.SetValue(...)`, mirroring what
                     * the client-side hook does on the `bapiParams` structure.
                     *
                     * @param {object} bapi The SAP BAPI object for `Z_ESK_CALCULATE_TAX_FRM_NET` (mutate via `bapi.ExportsPool.SetValue`).
                     * @param {string} [itemNumberTax] The current SAP item-number-tax (provided by the tax-amount flow; `null` from the tax-rate flow).
                     * @param {number} baseAmount The net base amount sent to the BAPI (`I_WRBTR`).
                     * @param {Item} [item] The current line item being processed.
                     * @param {Lib.AP.SAP.SAPParameters} [params] The SAP parameters used to post the invoice.
                     * @returns {void}
                     * @example <caption>Force the price determination date and add a coding line</caption>
                     * SAP.OnCalculateTaxFromNet = function (bapi, itemNumberTax, baseAmount, item, params)
                     * {
                     *	bapi.ExportsPool.SetValue("I_PRSDT", Sys.Helpers.SAP.Date.ToSAPDate(Data.GetValue("InvoiceDate__")));
                     * };
                     */
                    OnCalculateTaxFromNet: function (bapi, itemNumberTax, baseAmount, item, params) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnCalculateTaxFromNetSuccess
                     * @since 359
                     * @description
                     * Called server-side after a successful response of the `Z_ESK_CALCULATE_TAX_FRM_NET` BAPI
                     * (in `Lib.AP.SAP.SAPTaxFromNetBapiServer.GetTaxRateFromTaxCode`).
                     *
                     * Use it to post-process the BAPI response server-side - for example, persist additional
                     * values from `jsonParams.IMPORTS` / `jsonParams.TABLES` on the line item or audit the
                     * BAPI parameters that were sent.
                     *
                     * @param {Item} item The current line item for which the tax was computed.
                     * @param {object} jsonParams The full JSON parameters of the BAPI call (EXPORTS + IMPORTS + TABLES).
                     * @returns {void}
                     * @example <caption>Persist the SAP-calculated tax amount on the line</caption>
                     * SAP.OnCalculateTaxFromNetSuccess = function (item, jsonParams)
                     * {
                     *     item.SetValue("Z_SAPTaxAmount__", jsonParams.IMPORTS.E_FWSTE / 10);
                     * };
                     */
                    OnCalculateTaxFromNetSuccess: function (item, jsonParams) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnMMAddWht
                     * @since 352
                     * @description
                     * Allows you to customize the SAP Extended Withholding Taxes transmitted through the BAPI parameters of the MMAddWHT function in the Lib_AP_SAP_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP.
                     * @param {Object} params The BAPI structure that will be send to SAP
                     * @param {Object} accountWhtTable The WITHTAXDATA table of the BAPI structure that will be sent to SAP
                     * @example <caption>Override the WHT base amount indicator for all entries</caption>
                     * OnMMAddWht = function (params, accountWhtTable)
                     * {
                     * 	for (var idx = 0; idx < accountWhtTable.Count; idx++)
                     * 	{
                     * 		accountWhtTable.Get(idx).SetValue("WI_TAX_BASE", 2);
                     * 	}
                     * };
                     * @example <caption>Remove a WHT item / clear all WHT items</caption>
                     * OnMMAddWht = function (params, accountWhtTable)
                     * {
                     * 	// Remove a single entry by its index
                     * 	accountWhtTable.Remove(0);
                     *
                     * 	// Or remove every entry, for instance when the invoice is exempt from withholding
                     * 	if (Data.GetValue("Z_ExemptFromWht__"))
                     * 	{
                     * 		accountWhtTable.Clear();
                     * 	}
                     * };
                     */
                    OnMMAddWht: function (params, accountWhtTable) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.ShouldUnblockMMPayment
                     * @description
                     * Allows you to block payment in SAP. By default the value is return to true to unblock payment.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                      * @returns {boolean} return false to block payment
                     */
                    ShouldUnblockMMPayment: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.ShouldShowOverInvoicingError
                     * @since 347
                     * @description
                     * User exit to customize whether over-invoicing errors should be displayed during SAP invoice posting.
                     * This allows customers to suppress false positive over-invoicing errors for valid business scenarios
                     * (e.g., freight invoices with multiple line items referencing the same PO line).
                     *
                     * @returns {boolean | void}
                     *   - Return `false` to suppress the error (customer override)
                     *   - Return `true` to show the error (explicit approval of standard behavior)
                     *   - Return `void`/`undefined` to use standard behavior (show error)
                     *
                     * @example <caption>Example: PQ Corp - Suppress over-invoicing errors for freight condition invoices</caption>
                     * ShouldShowOverInvoicingError: function()
                     * {
                     *     // Check if this is a freight condition invoice
                     *     var purchasingDocumentType = Data.GetValue("PurchasingDocumentType__");
                     *     if (purchasingDocumentType === "FREIGHT" || purchasingDocumentType === "FRT")
                     *     {
                     *         Log.Info("Suppressing over-invoicing error for freight condition invoice");
                     *         return false; // Suppress error for freight invoices
                     *     }
                     *
                     *     // For other invoice types, use standard behavior (show error)
                     *     return;
                     * }
                     */
                    ShouldShowOverInvoicingError: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnSAPPostResponse
                     * @since 332
                     * @description
                     * Called after posting an FI or MM invoice in SAP just before the commit.
                     * Allows you to add a customization depending of the RETURN0 BAPI table.
                     * @param {object} RETURN0 The RETURN0 BAPI table.
                     * @example <caption>In this example, we add logs depending on ids and types in RETURN0 table.</caption>
                     * OnSAPPostResponse: function (RETURN0)
                     * {
                     * 	for (var idx = 1; idx <= RETURN0.Count; idx++)
                     * 	{
                     * 		var type = RETURN0.GetValue(idx, "TYPE");
                     * 		var ID = RETURN0.GetValue(idx, "ID");
                     * 		var message = RETURN0.GetValue(idx, "MESSAGE");
                     * 		if (type === "S" && ID === "M8")
                     * 		{
                     * 			Log.Info("BAPI Success Message - ID: " + ID + ", Number: " + number + ", Message: " + message);
                     * 		}
                     * 	}
                     * }
                     */
                    OnSAPPostResponse: function (RETURN0) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.OnSAPPostEnd
                     * @description
                     * Allows you to run logic after SAP invoice posting
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice with ERP type SAP.
                     * @param {string} ERPPostingError Last error from SAP posting
                     */
                    OnSAPPostEnd: function (ERPPostingError) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.ShouldRetryERPIntegration
                     * @since 358
                     * @description
                     * Called when a posting error is detected (ERPPostingError__ is set after an ERP posting attempt)
                     * for connected ERP integrations (SAP, SAP WS and SAPS4).
                     * Return `true` to trigger an automatic script retry of the ERP posting.
                     * Return `false` or `undefined` to keep the standard behavior (no retry).
                     * The retry is subject to the maximum retry count guard enforced by the calling code (default: 5 retries).
                     * @returns {boolean} Return `true` to retry the ERP posting, `false` or `undefined` otherwise.
                     * @example <caption>This example retries the ERP posting while the retry count is strictly less than 3, and only if the error message contains "Attempted to read or write protected memory.".</caption>
                     * ShouldRetryERPIntegration: function()
                     * {
                     *		if (Process.GetScriptRetryCount() < 3 && Data.GetValue("ERPPostingError__").indexOf("Attempted to read or write protected memory.") !== -1)
                     *		{
                     *			return true;
                     *		}
                     *		return false;
                     * }
                     */
                    ShouldRetryERPIntegration: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.CustomizeImageURL
                     * @description
                     * Allows you to customize the image URL to attach to the document
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice with ERP type SAP.
                     * @param {string} imageURL Image URL
                     * @example
                     * <pre><code>
                     * CustomizeImageURL: function (imageURL)
                     * {
                     *		return Lib.AP.GetURLFromSSO(imageURL)
                     * }
                     * </code></pre >
                     */
                    CustomizeImageURL: function (imageURL) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.CustomizeInvoiceURL
                     * @description
                     * Allows you to customize the invoice form URL to attach to the document
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice with ERP type SAP.
                     * @param {string} invoiceURL Invoice form URL
                     * @example
                     * <pre><code>
                     * CustomizeInvoiceURL: function (invoiceURL)
                     * {
                     *		return Lib.AP.GetURLFromSSO(invoiceURL)
                     * }
                     * </code></pre >
                     */
                    CustomizeInvoiceURL: function (invoiceURL) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.CustomShouldExportInvoiceXMLSAP
                     * @since 333
                     * @description
                     * Allows you to determine whether an invoice XML should be exported for SAP integration
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice with ERP type SAP.
                     * @returns {boolean} return true to export the invoice XML, false to skip export
                      * @example <caption>Export XML only for specific company codes</caption>
                     * <pre><code>
                     * CustomShouldExportInvoiceXMLSAP: function ()
                     * {
                     *		// Export XML only for specific company codes
                     *		var companyCode = Data.GetValue("CompanyCode__");
                     *		return companyCode === "1000" || companyCode === "2000";
                     * }
                     * </code></pre >
                     */
                    CustomShouldExportInvoiceXMLSAP: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAP.SkipTaxAccountRetrieval
                     * @since 353
                     * @description
                     * Allows you to skip the tax account retrieval and the whole tax-key processing for a given tax code
                     * during SAP invoice posting.
                     * This user exit is called before retrieving tax accounts from SAP in the FI posting flow.
                     * If this function returns true for a given tax code, the system does not retrieve tax accounts,
                     * does not create any tax lines and does not dispatch any tax amount for this tax code.
                     * As a consequence, the tax amount for this tax code is not posted as tax; in gross-posting scenarios
                     * the full gross amount for this tax code is posted to non-tax accounts according to your configuration.
                     * @param {string} companyCode The company code of the invoice
                     * @param {string} taxCode The current tax code being processed
                     * @returns {boolean | void} Return true to skip tax account retrieval and tax-key processing for this tax code
                     * (no tax lines created and no tax amount dispatch), void or false to use standard behavior
                     * @example <caption>Skip tax processing for PO invoices in a specific company code</caption>
                     * SkipTaxAccountRetrieval: function (companyCode, taxCode)
                     * {
                     *     if (companyCode === "1000" && Data.GetValue("OrderNumber__"))
                     *     {
                     *         // Returning true will prevent any tax line creation and tax posting for this tax code
                     *         return true;
                     *     }
                     * }
                     */
                    SkipTaxAccountRetrieval: function (companyCode, taxCode) {
                    },
                    /**
                     *
                     * @method Lib.AP.Customization.Validation.SAP.CustomizeDuplicateCheckCallback
                     * @since 366
                     * @description
                     * Allows to implements custom behavior for the duplicate check during the posting process.
                     * This user exit is called during the posting process, before the standard duplicate check is performed.
                     * If this function returns true, the default duplicate check is bypassed and the invoice is posted without checking for duplicates.
                     * @param {Array} sapDuplicateCandidates The SAP duplicate candidates
                     * @returns {boolean} Return true to bypass the default duplicate check, or false to use the default behavior
                     * @example <caption>Bypass the default duplicate check</caption>
                     * CustomizeDuplicateCheckCallback: function (sapDuplicateCandidates)
                     * {
                     *  if (Data.GetValue("Z_IgnoreSAPDuplicatesOnPost__") && sapDuplicateCandidates && sapDuplicateCandidates.length > 0)
                     *  {
                     *    Log.Warn("User opted to ignore SAP duplicates on post (" + sapDuplicateCandidates.length + " duplicates found)");
                     *    return true;
                     *  }
                     * 	return false;
                     * }
                     */
                    CustomizeDuplicateCheckCallback: function (sapDuplicateCandidates) {
                        return false;
                    }
                };
                /**
                 * Specifics customization for SAP S4Hana public cloud
                 * @namespace Lib.AP.Customization.Validation.SAPS4Cloud
                 */
                Validation.SAPS4Cloud = {
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIHeaderSet
                     * @description
                     * Allows you to customize the SAP header information transmitted through the Webservice parameters of the FIHeaderSet function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP.
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnFIHeaderSet: function (params)
                     * {
                     * 	params.WSParams.CreatedByUser = "ESKER";
                     * }
                     * </code></pre>
                     */
                    OnFIHeaderSet: function (params) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIAddVendorLine
                     * @description
                     * Allows you to customize the SAP vendor information transmitted through the Webservice parameters of the FIAddVendorLine function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @param {Object} newCreditorItem The CreditorItem structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnFIAddVendorLine: function (params, newCreditorItem)
                     * {
                     * 	newCreditorItem.DocumentItemText = "Custom text";
                     * }
                     * </code></pre>
                     */
                    OnFIAddVendorLine: function (params, newCreditorItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIAddGLLine
                     * @description
                     * Allows you to customize the SAP non-PO line information transmitted through the Webservice parameters of the FIAddGLLine function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {Object} newItem The Item structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnFIAddGLLine: function (params, line, newItem)
                     * {
                     * 	newItem.DocumentItemText = "Custom text";
                     * }
                     * </code></pre>
                     */
                    OnFIAddGLLine: function (params, line, newItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIAddTaxLine
                     * @description
                     * Allows you to customize the SAP tax line information transmitted through the Webservice parameters of the FIAddTaxLine function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @param {Object} sapTaxAccount The tax account structure
                     * @param {Object} newProductTaxItem The ProductTaxItem structure that will be send to SAP
                     */
                    OnFIAddTaxLine: function (params, sapTaxAccount, newProductTaxItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIAddWht
                     * @since 352
                     * @description
                     * Allows you to customize the SAP Extended Withholding Taxes transmitted through the Webservice parameters of the FIAddWHT function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP S4 Hana public cloud.
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @param {Array} accountWhtTable The WithholdingTaxItem list that will be sent to SAP
                     * @example <caption>Clear all WHT items when the invoice is marked as exempt</caption>
                     * OnFIAddWht = function (params, accountWhtTable)
                     * {
                     * 	if (Data.GetValue("Z_ExemptFromWht__"))
                     * 	{
                     * 		accountWhtTable.splice(0);
                     * 	}
                     * };
                     */
                    OnFIAddWht: function (params, accountWhtTable) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnMMHeaderSet
                     * @description
                     * Allows you to customize the SAP header information transmitted through the Webservice payload of the MMHeaderSet function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP S4 Hana public cloud
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnMMHeaderSet: function (params)
                     * {
                     * 	params.WSParams.PaymentReference = "CUSTOM REF";
                     * }
                     * </code></pre>
                     */
                    OnMMHeaderSet: function (params) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnMMAddPOLine
                     * @description
                     * Allows you to customize the SAP PO line information transmitted through the Webservice parameters of the MMAddPOLine function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {Object} SuplrInvcItemPurOrdRef The to_SuplrInvcItemPurOrdRef structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnMMAddPOLine: function (params, line, SuplrInvcItemPurOrdRef)
                     * {
                     * 	SuplrInvcItemPurOrdRef.TaxCountry = "BE";
                     * }
                     * </code></pre>
                     */
                    OnMMAddPOLine: function (params, line, SuplrInvcItemPurOrdRef) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnMMAddGLLine
                     * @description
                     * Allows you to customize the SAP non-PO line information transmitted through the Webservice parameters of the MMAddGLLine function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {Object} SupplierInvoiceItemGLAcct The to_SupplierInvoiceItemGLAcct structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnMMAddGLLine: function (params, line, SupplierInvoiceItemGLAcct)
                     * {
                     * 	SupplierInvoiceItemGLAcct.TaxCountry = "BE";
                     * }
                     * </code></pre>
                     */
                    OnMMAddGLLine: function (params, line, SupplierInvoiceItemGLAcct) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnMMAddTaxData
                     * @description
                     * Allows you to customize the SAP tax data transmitted through the Webservice parameters of the MMAddTaxData function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP
                     * @param {Object} params The Webservice structure that will be send to SAP
                     * @param {Object} SupplierInvoiceTax The to_SupplierInvoiceTax structure that will be send to SAP
                     * @param {Boolean} isNewInvoiceTaxItem Indicates if a new Tax item is added, or if the function is called only to increment the tax amount on an existing Tax item
                     * @example
                     * <pre><code>
                     * OnMMAddTaxData: function (params, SupplierInvoiceTax, isNewInvoiceTaxItem)
                     * {
                     * 	if (isNewInvoiceTaxItem)
                     * 	{
                     * 		SupplierInvoiceTax.TaxCountry = "BE";
                     * 	}
                     * }
                     * </code></pre>
                     */
                    OnMMAddTaxData: function (params, SupplierInvoiceTax, isNewInvoiceTaxItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.ShouldPostFIInvoicesAsMM
                     * @description
                     * Return true to post FI invoices via the MM webservice
                     * It allows SAP to generate additional accounting entries that are not supported by direct journal entry posting (e.g. reverse charge VAT).
                     * @returns {boolean}
                     * @example <caption>Force to post FI invoices as MM</caption>
                     * <pre><code>
                     * ShouldPostFIInvoicesAsMM: function ()
                     * {
                     * 	return true;
                     * }
                     * </code></pre>
                     */
                    ShouldPostFIInvoicesAsMM: function () {
                        return false;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIDocumentCreated
                     * @since 361
                     * @description
                     * This user exit is called after an FI accounting document is created in SAP S/4HANA Cloud.
                     * It allows you to read the newly created accounting document and update the invoice.
                     * @param {Object} erpInvoiceDocument The ERP invoice document used to call SAP web services.
                     * @param {string} FIDocNumber The FI document number in "AccountingDocument-CompanyCode-FiscalYear" format.
                     * @returns {void}
                     * @example <caption>Set the invoice due date from the FI accounting document</caption>
                     * SAPS4Cloud.OnFIDocumentCreated = function (erpInvoiceDocument, FIDocNumber)
                     * {
                     * 	if (!FIDocNumber)
                     * 	{
                     * 		return;
                     * 	}
                     * 	const [accountingDocument, companyCode, fiscalYear] = FIDocNumber.split("-");
                     * 	const params = {
                     * 		"$top": "1",
                     * 		"$select": "AccountingDocument,CompanyCode,FiscalYear,NetDueDate",
                     * 		"$filter": `AccountingDocument eq '${accountingDocument}' and CompanyCode eq '${companyCode}' and FiscalYear eq '${fiscalYear}' and FinancialAccountType eq 'K'`
                     * 	};
                     * 	Lib.AP.SAPS4Cloud.FIReadAccountingDocument(erpInvoiceDocument, params, 3, 0.5, function (data)
                     * 	{
                     * 		if (data && data.d && data.d.results && data.d.results.length > 0)
                     * 		{
                     * 			const match = /\/Date\((\d+)\)\//.exec(data.d.results[0].NetDueDate);
                     * 			if (match)
                     * 			{
                     * 				Data.SetValue("DueDate__", new Date(parseInt(match[1], 10)));
                     * 			}
                     * 			return true;
                     * 		}
                     * 		// Return false to trigger retry if results are not yet available
                     * 		return false;
                     * 	});
                     * };
                     */
                    OnFIDocumentCreated: function (erpInvoiceDocument, FIDocNumber) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.CustomizeWSParams
                     * @since 343
                     * @description
                     * Allows you to customize the parameters of the SAPS4Cloud web service calls.
                     * @param {HttpRequestParam} wsParams The actual parameters used for the web service call.
                     * @returns {HttpRequestParam} The modified parameters to use.
                     * @example <caption>Clean WS Headers “Application-Interface-Key“ inherited from SAP PUBLIC CLOUD</caption>
                     * CustomizeWSParams: function(wsParams)
                     * {
                     * 	delete wsParams.headers["Application-Interface-Key"];
                     * 	return wsParams;
                     * }
                     */
                    CustomizeWSParams: function (wsParams) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnMMUnblockPaymentParams
                     * @since 360
                     * @description
                     * Allows you to customize the parameters sent to SAP S/4HANA Cloud when unblocking a payment through the MM flow.
                     * @param {Object.<string, string>} params The current MM unblock payment parameters.
                     * Standard fields: SupplierInvoice, FiscalYear, DiscountDaysHaveToBeShifted.
                     * @returns {(Object.<string, string>|void)} The updated parameters to send to SAP, or nothing to keep the standard payload.
                     * @example <caption>Add the last approver to the MM unblock payment payload</caption>
                     * OnMMUnblockPaymentParams = function (params)
                     * {
                     * 	params.JrnlEntryCntrySpecificRef2 = Data.GetValue("Z_LastApprover");
                     * 	return params;
                     * };
                     */
                    OnMMUnblockPaymentParams: function (params) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIUnblockPaymentParams
                     * @since 360
                     * @description
                     * Allows you to customize the parameters sent to SAP S/4HANA Cloud when unblocking a payment through the FI flow.
                     * @param {Object.<string, string>} params The current FI unblock payment parameters.
                     * Standard fields: AccountingDocument, CompanyCode, FiscalYear.
                     * @returns {(Object.<string, string>|void)} The updated parameters to send to SAP, or nothing to keep the standard payload.
                     * @example <caption>Add the last approver to the FI unblock payment payload</caption>
                     * OnFIUnblockPaymentParams = function (params)
                     * {
                     * 	params["JrnlEntryCntrySpecificRef2"] = Data.GetValue("Z_LastApprover");
                     * 	return params;
                     * };
                     */
                    OnFIUnblockPaymentParams: function (params) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.CustomizeWSResult
                     * @since 344
                     * @description
                     * Allows you to customize the result of the SAPS4Cloud web service calls.
                     * This user exit is called after receiving the HTTP response from SAP S/4HANA Cloud,
                     * before processing the response data in the application.
                     * @param {HttpResponse} wsResult The actual result returned from the web service call.
                     * Contains: status (HTTP code), data (response body), headers (response headers object), lastErrorMessage
                     * @returns {HttpResponse} The modified result to use.
                     * @example <caption>Modify response headers to change Content-Type</caption>
                     * CustomizeWSResult: function(wsResult)
                     * {
                     *     if (wsResult.headers)
                     *     {
                     *         wsResult.headers["Content-Type"] = "application/soap+xml";
                     *     }
                     *     return wsResult;
                     * }*/
                    CustomizeWSResult: function (wsResult) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnFIInvoiceLinesAdded
                     * @since 352
                     * @description
                     * Allows you to customize the SAP non-PO lines transmitted through the Webservice parameters of the FIAddGLLines function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the FI module of SAP.
                     * @param {Lib.AP.SAPS4Cloud.Invoice.FIParameters} params The Webservice structure that will be sent to SAP
                     * @param {number} itemNumberIdx The current item number index
                     * @param {number} itemNumberTaxIdx The current tax item number index
                     * @returns {number | void} The updated itemNumberIdx, or void to use the default value
                     * @example <caption>Add custom tax lines from a custom taxes table</caption>
                     * OnFIInvoiceLinesAdded = function (params, itemNumberIdx, itemNumberTaxIdx)
                     * {
                     * 	var taxesTable = Data.GetTable("Z_MunicipalTaxes__");
                     * 	var taxesCount = taxesTable.GetItemCount();
                     * 	for (var i = 0; i < taxesCount; i++)
                     * 	{
                     * 		var tableItem = taxesTable.GetItem(i);
                     * 		var newItem = Lib.AP.Customization.Validation.CustomUserExits.MapTaxForSAPS4CloudFIItem(tableItem);
                     * 		params.WSParams.Item.push(newItem);
                     * 		itemNumberIdx++;
                     * 	}
                     * 	return itemNumberIdx;
                     * };
                     */
                    OnFIInvoiceLinesAdded: function (params, itemNumberIdx, itemNumberTaxIdx) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.OnMMInvoiceLinesAdded
                     * @since 352
                     * @description
                     * Allows you to customize the SAP invoice lines transmitted through the Webservice parameters of the MMAddGLLines function in the Lib_AP_SAPS4Cloud_Invoice script library.
                     * This user exit is called from the validation script of the Vendor invoice process, when posting an invoice in the MM module of SAP.
                     * @param {Lib.AP.SAPS4Cloud.Invoice.FIParameters | Lib.AP.SAPS4Cloud.Invoice.MMParameters} params The Webservice structure that will be sent to SAP
                     * @param {number} itemNumberIdx The current item number index
                     * @returns {number | void} The updated itemNumberIdx, or void to use the default value
                     * @example <caption>Add custom tax lines from a custom taxes table</caption>
                     * OnMMInvoiceLinesAdded = function (params, itemNumberIdx)
                     * {
                     * 	var taxesTable = Data.GetTable("Z_MunicipalTaxes__");
                     * 	var taxesCount = taxesTable.GetItemCount();
                     * 	for (var i = 0; i < taxesCount; i++)
                     * 	{
                     * 		var tableItem = taxesTable.GetItem(i);
                     * 		var newItem = Lib.AP.Customization.Validation.CustomUserExits.MapTaxForSAPS4CloudMMItem(tableItem);
                     * 		itemNumberIdx++;
                     * 		params.WSParams.to_SupplierInvoiceTax.push(newItem);
                     * 	}
                     * 	return itemNumberIdx;
                     * };
                     */
                    OnMMInvoiceLinesAdded: function (params, itemNumberIdx) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.SAPS4Cloud.SkipTaxAccountRetrieval
                     * @since 353
                     * @description
                     * Allows you to skip the tax account retrieval during SAP S/4HANA Cloud invoice posting.
                     * This user exit is called before retrieving tax accounts from SAP in the FI posting flow.
                     * Return true to suppress the tax account retrieval, which can be useful when your SAP configuration
                     * does not require tax accounts to be populated for certain invoice types.
                     * @param {string} companyCode The company code of the invoice
                     * @param {string} taxCode The current tax code being processed
                     * @returns {boolean | void} Return true to skip tax account retrieval, void or false to use standard behavior
                     * @example <caption>Skip tax account retrieval for PO invoices in a specific company code</caption>
                     * SkipTaxAccountRetrieval: function (companyCode, taxCode)
                     * {
                     *     if (companyCode === "1000" && Data.GetValue("OrderNumber__"))
                     *     {
                     *         return true;
                     *     }
                     * }
                     */
                    SkipTaxAccountRetrieval: function (companyCode, taxCode) {
                    }
                };
                /**
                 * Specifics customization for Workflow
                 * @namespace Lib.AP.Customization.Validation.Workflow
                 */
                Validation.Workflow = {
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.GetListOfExtraUsersWithReadRight
                     * @description
                     * By default, a read access on the vendor invoice is granted to:
                     * 1. The contributors of workflow (determined by the workflow rules) - can include GL/Account or cost center managers
                     * 2. The cost center managers independently of the ones determined by workflow rules (since sprint S247)
                     * 3. The full list of managers for these users (since S245)
                     * Use this function to override the 2nd list.
                     * The managers of the users returned here will also be granted a read access (use the UpdateListOfManagersWithReadRight user
                     * exit to customize this)
                     * @param {Array<string>} workflowContributors the list of contributors logins computed by the workflow (1rst list)
                     * @returns {Array<string>} return the list of extra contributors you want to grant a read access to.
                     * Returning null will not override the 2nd list.
                     * Returning an empty list will disable the 2nd list (workflow contributors will keep their read access).
                     * @example
                     * <pre><code>
                     * GetListOfExtraUsersWithReadRight: function (contributorsLogin)
                     * {
                     * 	// Get the list of GL/Account managers (instead of the cost center manager by default)
                     * 	var GLAccounts = [];
                     * 	var lineItems = Data.GetTable("LineItems__");
                     * 	var nbItems = lineItems.GetItemCount();
                     * 	for (var i = 0; i < nbItems; i++)
                     * 	{
                     * 		var line = lineItems.GetItem(i);
                     * 		var gl = line.GetValue("GLAccount__");
                     * 		if (gl && GLAccounts.indexOf(gl) < 0)
                     * 		{
                     * 			GLAccounts.push(gl);
                     * 		}
                     * 	}
                     *
                     * 	var list = [];
                     * 	if (GLAccounts.length > 0)
                     * 	{
                     * 		var filter = Sys.Helpers.LdapUtil.FilterAnd(
                     * 			"(" + Lib.P2P.GetCompanyCodeFilter(Data.GetValue("CompanyCode__")) + ")",
                     * 			Sys.Helpers.LdapUtil.FilterIn("Account__", GLAccounts)
                     * 		).toString();
                     *
                     * 		Sys.GenericAPI.Query("AP - G/L accounts__", filter, ["Manager__"], function (result, error)
                     * 		{
                     * 			if (error || !result)
                     * 			{
                     * 				return;
                     * 			}
                     *
                     * 			for (var i = 0; i < result.length; i++)
                     * 			{
                     * 				var r = result[i];
                     * 				if (r.Manager__ && list.indexOf(r.Manager__) === -1)
                     * 				{
                     * 					list.push(r.Manager__);
                     * 				}
                     * 			}
                     * 		}, null, -1, { useConstantQueryCache: true });
                     * 	}
                     *
                     * 	return list;
                     * },
                     * </code></pre>
                     */
                    GetListOfExtraUsersWithReadRight: function (workflowContributors) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.ShouldAddExtraUserToConversation
                     * @since 363
                     * @description
                     * Allows you to decide whether a contributor is added as a vendor invoice conversation party.
                     * This user exit is called for every contributor registration. Returning false skips the conversation-party registration without affecting access rights.
                     * Return true or nothing to preserve the standard behavior.
                     * @param {string} login The login of the user or group being registered.
                     * @param {Array<string>} workflowContributors The logins of approvers and controllers computed by the workflow.
                     * @returns {boolean | void} Return false to exclude the login from the conversation, or true/void to keep the standard behavior.
                     * @example <caption>Exclude a read-only group from vendor invoice conversations</caption>
                     * Workflow.ShouldAddExtraUserToConversation = function (login, workflowContributors)
                     * {
                     * 	if (login === "readonlygroup@example.com" && workflowContributors.indexOf(login) === -1)
                     * 	{
                     * 		return false;
                     * 	}
                     * 	return true;
                     * };
                     */
                    ShouldAddExtraUserToConversation: function (login, workflowContributors) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.UpdateListOfManagersWithReadRight
                     * @description
                     * By default, a read access on the vendor invoice is granted to:
                     * 1. The contributors of workflow (determined by the workflow rules) - can include GL/Account or cost center managers
                     * 2. The cost center managers independently of the ones determined by workflow rules (since sprint S247)
                     * 3. The full list of managers for these users (since S245)
                     * Manager should be able to see invoices of their subordinate regardless of the amount triggering a workflow operation.
                     * Use this function to override the 3rd list.
                     * @param {Array<string>} contributorsLogin the list of contributors. Also including the contributors added in GetListOfExtraUsersWithReadRight.
                     * @param {Array<string>} managersList a list of managers found in table P2P - User properties__ based on the list of contributors computed by the workflow
                     * @returns {Array<string>} return a list of specific managers to give read right. If you return a empty list, that means managers shouldn't be able to see invoices regardless of the amount triggering a workflow operation.
                     * @example
                     * <pre><code>
                     * UpdateListOfManagersWithReadRight: function (contributorsLogin, managersList)
                     * {
                     *	managersList.push("david.ceo@sample.com");
                     * 	return managersList;
                     * }
                     * </code></pre>
                     */
                    UpdateListOfManagersWithReadRight: function (contributorsLogin, managersList) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.OnSendApproverNotification
                     * @description
                    * Allows you to enable or disable the approver notifications and to customize the parameters (email or push).
                    * This user exit is called in the Vendor invoice process, when the notification is sent.
                    * The available options depend on the type of notification (email or push)
                    * @param {Object} options the options of the email or the push notification
                    * @param {Sys.WorkflowController.IWorkflowContributor} userStep The current user in the workflow concerned by the notification
                    * @returns {boolean} A boolean indicating if the notification should be sent
                    * @example
                    * OnSendApproverNotification: function(options)
                    * {
                    *	// Notification is an email
                    *	if (options && options.emailOptions)
                    *	{
                    *		options.emailOptions.subject = "My custom subject";
                    *		options.emailOptions.template = "Z_AP-Review_Custom.htm";
                    *		options.emailOptions.customTags.additionalTag = "MyAdditionalTag";
                    *		options.emailSenderAddress = "custom@eskerondemand.com";
                    *		options.emailSenderName = "Custom sender name";
                    *	}
                    *	// Notification is a push notification
                    *	else
                    *	{
                    *		options.template = "Z_AP-PushNotif_Review_Custom.txt";
                    *		options.customTags.additionalTag = "MyAdditionalTag";
                    *	}
                    *	return true;
                    * }
                    */
                    OnSendApproverNotification: function (options, userStep) {
                        return true;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.CustomizeApproverNotificationEmail
                     * @since 366
                     * @description
                     * Allows you to customize an approver notification email before it is sent.
                     * @param {xTransport} email The approver notification email to customize.
                     * @param {Sys.WorkflowController.IWorkflowContributor} userStep The workflow contributor receiving the notification.
                     * @returns {void}
                     * @example <caption>Set approver notification emails to high importance</caption>
                     * Workflow.CustomizeApproverNotificationEmail = function (email, userStep)
                     * {
                     * 	var vars = email.GetUninheritedVars();
                     * 	vars.AddValue_String("EmailImportance", "H", true);
                     * };
                     */
                    CustomizeApproverNotificationEmail: function (email, userStep) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.OnCustomizeActionInComment
                     * @description
                     * Allows you to customize the action to log in workflow
                     * @param {LazyTranslationString} action Action to log in workflow
                     * @param {string} reason Reason for the action log
                     * @param {string} by User who did the action
                     * @returns {LazyTranslationString} return an action comment customized
                     * @example
                     * <pre><code>
                     * OnCustomizeActionInComment: function(action, comment, reason, by)
                     * {
                     *		// update to add mobile tag for mobile actions
                     *		if (Sys.ScriptInfo.IsServer() && Data.GetActionDevice() === "mobile")
                     *		{
                     *			action = Language.CreateLazyTranslation("{1} {0} ", action, Language.CreateLazyTranslation("[MOBILE]"));
                     *		}
                     *		return action;
                     * }
                     * </code></pre>
                     */
                    OnCustomizeActionInComment: function (action, reason, by) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.IsNextContributorSameAsCurrentApprover
                     * @description
                     * Allows you to determine whether the next contributor is the same as the current approver
                     * @param {Sys.WorkflowController.IWorkflowContributor} nextContributor Action to log in workflow
                     * @param {string} currentUserLogin Reason for the action log
                     * @returns {boolean} true if the next contributor is the same as the current approver
                     * @example
                     * <pre><code>
                     * IsNextContributorSameAsCurrentApprover: function(nextContributor, currentUserLogin)
                     * {
                     *		return nextContributor.login === currentUserLogin.toLowerCase();
                     * }
                     * </code></pre>
                     */
                    IsNextContributorSameAsCurrentApprover: function (nextContributor, currentUserLogin) {
                        return false;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.GetEscalationDuration
                     * @description
                     * Allows you to determine the number of days before the escalation of the next contributor
                     * A value <= 0 means no escalation
                     * @returns {number} The escalation duration in days. 0 or less means no escalation.
                     * @example
                     * GetEscalationDuration: function()
                     * {
                     *		return 5;
                     * }
                     */
                    GetEscalationDuration: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.GetUsersForEscalation
                     * @description
                     * Allows you to determine the users to escalate to for the given contributors.
                     * @param {string[]} contributorsLogin List of contributor logins.
                     * @return {Promise} A promise resolving to an array of objects with the contributor login and the manager login to add for escalation.
                     * The promise should resolve to an array of objects, each object representing a manager to escalate to.
                     * Each object should have a key "UserLogin__" with the contributor login and a key "ManagerLogin__" with the associated manager's login.
                     * @example
                     * GetUsersForEscalation: async function(contributorsLogin)
                     * {
                     *		return Lib.P2P.Managers.queryGetManagers(contributorsLogin);
                     * }
                     */
                    GetUsersForEscalation: function (contributorsLogin) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.Workflow.CustomShouldWaitForERPAck
                     * @since 332
                     * @description
                     * Allows you to customize when the system should wait for ERP acknowledgment before proceeding
                     * @param {boolean} defaultShouldWait The default system decision on whether to wait for ERP acknowledgment
                     * @param {boolean} invoicePosted The current invoice posted status
                     * @param {boolean} archiveOnly The current archive only status
                     * @returns {boolean} true if the system should wait for ERP acknowledgment, false otherwise
                     * @example <caption>This example disables the erp ack wait in demo mode and enables it for high amount invoices</caption>
                     * <pre><code>
                     * CustomShouldWaitForERPAck: function(defaultShouldWait, invoicePosted, archiveOnly)
                     * {
                     *		// Never wait for test ERP systems
                     *		if (Data.GetValue("Z_ERPEnvironment__") === "TEST")
                     *		{
                     *			return false;
                     *		}
                     *		// For high-value invoices, always wait for acknowledgment
                     *		var invoiceAmount = Data.GetValue("InvoiceAmount__");
                     *		if (invoiceAmount && invoiceAmount > 10000)
                     *		{
                     *			return true;
                     *		}
                     *		return defaultShouldWait;
                     * }
                     * </code></pre>
                     */
                    CustomShouldWaitForERPAck: function (defaultShouldWait, invoicePosted, archiveOnly) {
                    }
                };
                /**
                 * Specifics customization for French B2B e-invoicing
                 * @namespace Lib.AP.Customization.Validation.FrenchB2B
                 */
                Validation.FrenchB2B = {
                    /**
                     * Specifics customization for Cycle De Vie generation
                     * @namespace Lib.AP.Customization.Validation.FrenchB2B.CDV
                     */
                    CDV: {
                        /**
                         * @method Lib.AP.Customization.Validation.FrenchB2B.CDV.ShouldDisableCDVForOnHoldStatus
                         * @description
                         * Allow to disable the generation of a CDV notification when invoice status is set to OnHold
                         * @returns {boolean} True to disable the CDV generation
                         * @example
                         * <pre><code>
                         *	ShouldDisableCDVForOnHoldStatus: function()
                         *	{
                         *		return true;
                         *	}
                         * </code></pre>
                         */
                        ShouldDisableCDVForOnHoldStatus: function () {
                            return false;
                        },
                        /**
                         * @method Lib.AP.Customization.Validation.FrenchB2B.CDV.ShouldDisableCDVForInvoiceStatus
                         * @since 361
                         * @description
                         * Allows you to disable the generation of a CDV notification for a given invoice status.
                         * Use this when ERP acknowledgement events drive the invoice lifecycle and Esker should not generate CDVs for specific statuses.
                         * Return true only for statuses whose CDV generation must be disabled. Returning true for every status suppresses all CDV notifications and may violate French B2B e-invoicing obligations.
                         * @param {string} invoiceStatus - The current invoice status triggering CDV determination.
                         * @returns {boolean | void} True to disable CDV generation for this status, or void to keep the default behavior.
                         * @example <caption>Disable CDV generation after ERP-managed payment statuses</caption>
                         * CDV.ShouldDisableCDVForInvoiceStatus = function (invoiceStatus)
                         * {
                         *	if (invoiceStatus === "To pay" || invoiceStatus === "Paid")
                         *	{
                         *		return true;
                         *	}
                         *	return false;
                         * };
                         */
                        ShouldDisableCDVForInvoiceStatus: function (invoiceStatus) {
                        },
                        /**
                         * @method Lib.AP.Customization.Validation.FrenchB2B.CDV.CustomizeCDVData
                         * @since 353
                         * @description
                         * This user exit is called from a SysProcess, it can be implemented on any sprint
                         * Allows you to customize the data used to generate a CDV (Cycle De Vie) notification before it is rendered to XML.
                         * Use this user exit to modify sender/receiver information
                         *
                         * @param {Sys.EDI.FRB2B.CDV.Utils.Datas} datasCDV - The structured data object for the CDV notification
                         * @param {string} status - The CDV status code triggering this generation (e.g. "FRB2B_204_TakeOn", "FRB2B_205_Approved")
                         * @returns {Sys.EDI.FRB2B.CDV.Utils.Datas | void} The customized data object, or void to keep the default data
                         * @example <caption>Override the reasonInformation to send in the CDV file</caption>
                         * CDV.CustomizeCDVData = function (datasCDV, status)
                         * {
                         *	datasCDV.document.reasonInformation = "Custom reason for status " + status;
                         *	return datasCDV;
                         * }
                         */
                        CustomizeCDVData: function (datasCDV, status) {
                        },
                        /**
                         * @method Lib.AP.Customization.Validation.FrenchB2B.CDV.OnUpdateVIP
                         * @description
                         * This user exit is called from a SysProcess, it can be implemented on any sprint.
                         * Called when the Vendor Invoice CDV process propagates a new EDI status to the related Vendor Invoice (VIP).
                         * Use this user exit to run custom business logic whenever the VIP EDI status is updated from the VICDV.
                         *
                         * @param {Sys.FRB2B.CDV.AP.Mapping.CDVStatus} newEDIStatus - The new EDI status being propagated to the VIP
                         * @param {string} vipRuidEx - The RUIDEx of the related Vendor Invoice (VIP) being updated
                         * @returns {void}
                         * @example <caption>Log the new EDI status applied to the VIP</caption>
                         * CDV.OnUpdateVIP = function (newEDIStatus, vipRuidEx)
                         * {
                         *	Variable.SetValueAsString("Z_LastCDVStatus", newEDIStatus);
                         * }
                         */
                        OnUpdateVIP: function (newEDIStatus, vipRuidEx) {
                        }
                    },
                    /**
                     * Specifics customization for connection PDP
                     * @namespace Lib.AP.Customization.Validation.FrenchB2B.PDP
                     */
                    PDP: {
                        /**
                         * @method Lib.AP.Customization.Validation.FrenchB2B.PDP.GetPDPConfigurationName
                         * @deprecated since 334 - No longer relevant. The PDP configuration now carries the S2P configuration name directly.
                         * A new field has been added to the PDP configuration interface that allows users to select the S2P configuration
                         * they want to link. This method is maintained for backward compatibility only.
                         * @description
                         * Allow to specify a PDP configuration name which will overwrite the PDPConfigurationName defined in P2P configuration
                         * @returns {string} the name of the PDP configuration
                         * @example
                         * <pre><code>
                         *	GetPDPConfigurationName: function()
                         *	{
                         *		return "PDP";
                         *	}
                         * </code></pre>
                         */
                        GetPDPConfigurationName: function () {
                            return null;
                        }
                    }
                };
                /**
                 * Specifics customization for Peppol invoice responses
                 * @namespace Lib.AP.Customization.Validation.PeppolIR
                 */
                Validation.PeppolIR = {
                    /**
                     * @method Lib.AP.Customization.Validation.PeppolIR.CustomizePeppolIRMapping
                     * @since 346
                     * @description
                     * Allows you to customize the XPath mappings used to extract invoice data from UBL XML for Peppol Invoice Response generation.
                     * Use this user exit to add new mappings for custom fields or modify existing XPath expressions.
                     *
                     * @param {Sys.Peppol.InvoiceResponse.AP.Mapping.XPathPeppolIRMapping[]} XPathToPeppolIR - The default XPath mappings array
                     * @returns {Sys.Peppol.InvoiceResponse.AP.Mapping.XPathPeppolIRMapping[]} The customized XPath mappings array
                     * @example
                     * 	<caption>Add a custom field mapping for Peppol Invoice Response</caption>
                     *	PeppolIR.CustomizePeppolIRMapping: function(XPathToPeppolIR)
                     *	{
                     *		// Add a custom field mapping
                     *		XPathToPeppolIR.push({
                     *			FieldPeppolIR: "CustomField",
                     *			XPathUBL: "cbc:Note"
                     *		});
                     *		return XPathToPeppolIR;
                     *	}
                     */
                    CustomizePeppolIRMapping: function (XPathToPeppolIR) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.PeppolIR.CustomizeDatasInvoiceResponse
                     * @since 346
                     * @description
                     * Allows you to customize the data structure used to generate the Peppol Invoice Response before it is rendered to XML.
                     * Use this user exit to modify sender/receiver information, add optional fields, or override any response data.
                     *
                     * @param {Sys.Peppol.InvoiceResponse.AP.Mapping.BISInvoiceResponse} datasInvoiceResponse - The structured data object for the Invoice Response
                     * @param {Sys.Peppol.InvoiceResponse.AP.Mapping.UnstructuredPeppolIRData} processedDocumentJson - The extracted data from the original invoice UBL XML
                     * @returns {Sys.Peppol.InvoiceResponse.AP.Mapping.BISInvoiceResponse} The customized datasInvoiceResponse object
                     *
                     * @example
                     * 	<caption>Customize sender contact info and response description</caption>
                     *	PeppolIR.CustomizeDatasInvoiceResponse: function(datasInvoiceResponse, processedDocumentJson)
                     *	{
                     *		// Add optional contact information for sender
                     *		datasInvoiceResponse.sender.contact = {
                     *			contactName: "Custom Department",
                     *			telephone: "+33 1 23 45 67 89",
                     *			electronicMail: "custom@company.com"
                     *		};
                     *
                     *		// Add custom response description
                     *		datasInvoiceResponse.response.description = "Custom description";
                     *
                     *		// Override sender name from process variable if available
                     *		var customSenderName = Variable.GetValueAsString("CustomSenderName");
                     *		if (customSenderName)
                     *		{
                     *			datasInvoiceResponse.sender.registrationName = customSenderName;
                     *		}
                     *
                     *		return datasInvoiceResponse;
                     *	}
                     */
                    CustomizeDatasInvoiceResponse: function (datasInvoiceResponse, processedDocumentJson) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.PeppolIR.GetRejectionStatus
                     * @description
                     * Allow to customize the mapping between the possible rejection reasons in the supplier invoice process and the Peppol invoice response ones
                     * https://docs.peppol.eu/poacc/upgrade-3/profiles/63-invoiceresponse/#response
                     * https://docs.peppol.eu/poacc/upgrade-3/codelist/OPStatusReason/
                     * https://docs.peppol.eu/poacc/upgrade-3/codelist/OPStatusAction/
                     *
                     * @param {string} invoiceRejectReason - Contains the reject reason selected when rejecting the invoice
                     * @param {string} invoiceRejectionComment - Contains the rejection comment entered when rejected the invoice
                     * @returns {Object[]} The structured array of objects representing the rejection status(es), expected format is the one given in the sample :
                     * an array of objects with the following attributes :
                     * {
                     * 		listID: string (mandatory) : either "OPStatusReason" or "OPStatusAction"
                     * 		code: string (mandatory) : a code from the links listed above. The value of listID has to match the origin of this code
                     * 		reasonDescription: string (not mandatory) : free text to justify the reject
                     * }
                     *
                     * @example
                     * <pre><code>
                     *	GetRejectionStatus: function(invoiceRejectReason, invoiceRejectionComment)
                     *	{
                     *		var status = [
                     *			{
                     *				listID: "OPStatusReason",
                     *				code: "",
                     *				reasonDescription: ""
                     *			}
                     *		];
                     *
                     *		switch (invoiceRejectReason)
                     *		{
                     *			case "Invoice is not compliant":
                     *			case "Invalid signature":
                     *				status[0].code = "LEG";
                     *				break;
                     *			case "Unreadable invoice / bad quality scan":
                     *			case "Document is not an invoice":
                     *				status[0].code = "UNR";
                     *				break;
                     *			default:
                     *				status[0].code = "OTH";
                     *		}
                     *
                     *		if (invoiceRejectionComment)
                     *		{
                     *			status[0].reasonDescription = invoiceRejectionComment;
                     *		}
                     *
                     *		return status;
                     *	}
                     * </code></pre>
                     */
                    GetRejectionStatus: function (invoiceRejectReason, invoiceRejectionComment) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.PeppolIR.CustomizeGeneratedInvoiceResponse
                     * @description
                     * Allow to customize the generated Peppol invoice response XML before its transmission to the Peppol network
                     * @param sbdhInvoiceResponse default response xml
                     * @param datasInvoiceResponse datas used to generate the response
                     * @param sbdhParams parameters used to generate the SBDH
                     * @returns {string} The customized Peppol invoice response XML
                     * @example
                     * <pre><code>
                     * 	CustomizeGeneratedInvoiceResponse: function (sbdhInvoiceResponse, datasInvoiceResponse)
                     *	{
                     *		// For example, we want to return only the UBL content
                     *		return sbdhParams.content;
                     *	}
                     * </code></pre>
                     */
                    CustomizeGeneratedInvoiceResponse: function (sbdhInvoiceResponse, datasInvoiceResponse, sbdhParams) {
                    },
                    /**
                     * @method Lib.AP.Customization.Validation.PeppolIR.GetCustomCopyTransport
                     * @description
                     * Allow to specify a custom transport to send the peppol invoice response to specific endpoints
                     * @param {File} xmlFile The Peppol invoice response XML file
                     * @returns {xTransport} The custom transport
                     * @example
                     * <pre><code>
                     *	GetCustomCopyTransport: function (xmlFile)
                     *	{
                     *		const copyFileTransport = Process.CreateTransport("Copy");
                     *		const vars = copyFileTransport.GetUninheritedVars();
                     *		let ediEnvironment = "QA";
                     *		const EskerEnvironment = Sys.Parameters.GetInstance("AP")?.GetEnvironment()?.toUpperCase();
                     *		if (EskerEnvironment?.includes("PROD"))
                     *		{
                     *			ediEnvironment = "PROD";
                     *		}
                     *
                     *		vars.AddValue_String("CopyPath", `EskerToEIntegrationPeppolGeneric_${ediEnvironment}`, true);
                     *		const attachVars: xVars = copyFileTransport.AddAttachEx(xmlFile).GetVars();
                     *		attachVars.AddValue_String('AttachManagement', 'REF_COPY', true);
                     *		attachVars.AddValue_String('IsEDI', '1', true);
                     *		return copyFileTransport;
                     *	}
                     * </code></pre>
                     */
                    GetCustomCopyTransport: function (xmlFile) {
                    }
                };
                /**
                 * Structure that will contain the compliance information for the current invoice.
                 * @typedef Lib.AP.Customization.Validation.TouchlessComplianceInfo
                 * @property {boolean} reject - set to true if the invoice should be auto reject (default is false)
                 * @property {boolean} [forAllActionType] - set to true if you want the auto-reject occurs for all action types (reprocessing and manual submission through interface) (default is false)
                 * @property {string} [reason] - the reason of the reject, if the invoice is to be reject and no reason specified the default "Invoice is not compliant" will be applied
                 * @property {string} [message] - the message for the reject, if the invoice is to be reject and no reason specified the default "Invoice doesn't match requirement" will be applied
                 */
                /**
                 * @method Lib.AP.Customization.Validation.GetInvoiceComplianceInformation
                 * @description
                 * Called when in the validation script when comming just after the extraction before the touchless try.
                 * Allows you to auto-reject the invoice if it doesn't match your specified requirement. It will be ignored in case of reprocessing or manual submission throught the interface
                 * @returns {Lib.AP.Customization.Validation.TouchlessComplianceInfo} TouchlessComplianceInfo - structure that will contain the compliance information for the current invoice
                 * @example
                 * <pre><code>
                 *	GetInvoiceComplianceInformation: function()
                 *	{
                 *		// For example, if you want to auto-reject all PO-Invoices comming from the Vendor Portal and where no PO# could be found on the document
                 *
                 *		var isPOInvoice = Lib.AP.InvoiceType.isPOInvoice();
                 *		var isFromPortal = !Sys.Helpers.IsEmpty(Data.GetValue("PortalRuidEx__"));
                 *		var hasNoOrderNumber = Sys.Helpers.IsEmpty(Data.GetValue("OrderNumber__"));
                 *
                 *		if (isPOInvoice && isFromPortal && hasNoOrderNumber)
                 *		{
                 *			// feed the structure
                 *			// labels should be added in language files
                 *			return {
                 *				reject: true,
                 *				reason: "Invoice is not compliant",
                 *				message: Language.Translate("Invoice doesn't match requirement")
                 *			};
                 *		}
                 *		return null;
                 *	}
                 * </code></pre>
                 */
                Validation.GetInvoiceComplianceInformation = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Validation.ExtendActionMap
                 * @description
                 * Called at the begining of the validation script.
                 * Allows you to add a new validation action in the Vendor invoice process or to edit existing validation actions.
                 * This user exit is called from the validation script of the Vendor invoice process
                 * @param {Object} validationActionMap validation script actions definition, add new actions into this object (key must be value of Data.GetActionType() in lower case)
                 * @example
                 * <pre><code>
                 * ExtendActionMap: function (validationActionMap)
                 * {
                 *	validationActionMap.endworkflow = {
                 *		"execute": function () {
                 *			if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToApprove )
                 *			{
                 *				var usr = Lib.AP.WorkflowCtrl.usersObject.GetUser(Data.GetValue("LastValidatorUserId__"));
                 *				var userVars = usr.GetVars();
                 *				var contributor = {
                 *					contributorId : Lib.AP.WorkflowCtrl.workflowUI.CreateUniqueContributorId(userVars.GetValue_String("Login", 0) + Lib.AP.WorkflowCtrl.roles.apEnd),
                 *					role : "",
                 *					login : "",
                 *					email : "",
                 *					name : "System",
                 *					action : "unblockPaymentManually",
                 *					date : new Date(),
                 *					approved : true,
                 *					comment : "Payment unblocked automatically, payment was unblocked manually on the ERP"
                 *				};
                 *				Lib.AP.WorkflowCtrl.workflowUI.EndWorkflow(contributor);
                 *				Lib.AP.SetInvoiceStatus(Lib.AP.InvoiceStatus.ToPay);
                 *			}
                 *			else
                 *			{
                 *				Log.Error("endWorkflow custom action call ignored, wrong invoice status " + Data.GetValue("InvoiceStatus__"));
                 *				Process.PreventApproval();
                 *			}
                 *		},
                 *		"requireValidation":false
                 *	};
                 *
                 *	// Customize globals
                 *	// Include some fields in the automation rate report
                 *	headerFieldsListForRecognitionStatistics.push("Z_Extracted_CustomField__");
                 *	lineItemsFieldsListForRecognitionStatistics.push("Z_Extracted_LineItemCustomField__");
                 * }
                 * </code></pre>
                 */
                Validation.ExtendActionMap = function (validationActionMap) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.OnBeforeActionPost
                 * @description
                 * Allows you to customize the Vendor invoice process before the action actionPost if performed.
                 * @param {boolean} touchless - true if the action is performed in touchless mode
                 **/
                Validation.OnBeforeActionPost = function (touchless) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.OnCompletePostEnd
                 * @since 328
                 * @description
                 * Allows you to specify custom code to execute at the end of the post process.
                 * This function is called from the end of completePost() of LIB_AP_WorkflowCtrl script library.
                 * @example
                 * <caption>Replicate extracted vendor taxID for autolearning</caption>
                 * Validation.OnCompletePostEnd = function ()
                 *	{
                 *		if (Sys.Parameters.GetInstance("AP").GetParameter("Z_VendorRecognitionByTaxID") === "1")
                 *		{
                 *			var vendorTaxIDArea = Data.GetArea("ExtractedVendorTaxID__");
                 *			if (vendorTaxIDArea && !Data.IsComputed("ExtractedVendorTaxID__"))
                 *			{
                 *				Data.SetValue("Z_ExtractedVendorTaxID__", vendorTaxIDArea, Data.GetValue("ExtractedVendorTaxID__"));
                 *				Data.SetComputed("Z_ExtractedVendorTaxID__", false);
                 *			}
                 *		}
                 *	};
                 */
                Validation.OnCompletePostEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.ShouldExecuteAction
                 * @since 347
                 * @description
                 * Called immediately before any action is executed in the validation script.
                 * Allows custom code to run before standard action behavior and optionally prevent execution.
                 *
                 * This user exit is useful for:
                 * - Conditional action prevention
                 * - Logging and tracking before actions are performed
                 *
                 * @param {String} actionName - The name of the action being executed (in lowercase)
                 *                               Examples: "post", "save", "reject", "approve"
                 * @returns {Boolean | void} - Return false to prevent standard action execution,
                 *                              true or undefined to continue with standard behavior
                 * @example
                 * <caption>Prevents posting if external API fails to track the invoice, otherwise allows standard execution</caption>
                 *
                 * Validation.ShouldExecuteAction: function(actionName)
                 * {
                 *     if (actionName === "post" || actionName === "postafterduplicatecheckignored")
                 *     {
                 *         // Track invoice in external system before posting
                 *         var invoiceNumber = Data.GetValue("InvoiceNumber__");
                 *         var result = ExternalAPI.TrackInvoice({
                 *             invoiceNumber: invoiceNumber,
                 *             companyCode: Data.GetValue("CompanyCode__"),
                 *             vendorNumber: Data.GetValue("VendorNumber__")
                 *         });
                 *
                 *         if (!result.success)
                 *         {
                 *             Log.Error("Failed to track invoice in external system: " + result.error);
                 *             Process.SetException("Unable to post invoice. External tracking failed: " + result.error);
                 *             return false; // Prevent posting
                 *         }
                 *
                 *         Log.Info("Invoice tracked successfully with ID: " + result.trackingId);
                 *         Data.SetValue("Z_ExternalTrackingId__", result.trackingId);
                 *     }
                 *
                 *     return true; // Continue with standard behavior
                 * }
                 */
                Validation.ShouldExecuteAction = function (actionName) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.BypassUnauthorizedStepCompletionCheck
                 * @since 362
                 * @description
                 * Called when a workflow step-completing action is detected as unauthorized by the stale replay guard.
                 * Allows custom logic to bypass this protection for edge cases and continue the action normally.
                 *
                 * Return true only for strictly controlled scenarios, as this bypasses the standard unauthorized-actor protection.
                 * Returning false, null or undefined keeps the standard protection enabled.
                 *
                 * @param {string} actionNameLowerCase Action name in lower case.
                 * @param {string} actionType Raw action type from Data.GetActionType().
                 * @param {string} actorLogin Effective actor login used by the guard.
                 * @param {string} ownerId Current workflow owner login.
                 * @param {string} currentRole Current workflow step role.
                 * @returns {boolean | void} Return true to bypass the unauthorized step completion guard.
                 * @example
                 * <caption>Allow a specific admin-list actor to continue workflow completion</caption>
                 * Validation.BypassUnauthorizedStepCompletionCheck = function (actionNameLowerCase, actionType, actorLogin, ownerId, currentRole)
                 * {
                 * 	if (actionNameLowerCase === "adminlist" && actorLogin === "batch.approver@customer.com")
                 * 	{
                 * 		Log.Info("Bypassing unauthorized-step guard for controlled admin-list scenario.");
                 * 		return true;
                 * 	}
                 * };
                 */
                Validation.BypassUnauthorizedStepCompletionCheck = function (actionNameLowerCase, actionType, actorLogin, ownerId, currentRole) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.ShouldCheckGoodsReceiptOnSetAside
                 * @since 361
                 * @description
                 * Allows you to customize whether to check the goods receipt when an invoice is set aside.
                 * @param {boolean} defaultValue Whether the goods receipt is checked by default.
                 * @returns {boolean | void} Return true to check the goods receipt, false to skip it, or void to use standard behavior.
                 * @example <caption>Skip the goods receipt check shortly after browsing a purchase order</caption>
                 * This example requires LastPOBrowse to be populated with the purchase-order browse time.
                 * Validation.ShouldCheckGoodsReceiptOnSetAside = function (defaultValue)
                 * {
                 *	var grCheckTimeoutInMilliseconds = 2 * 60 * 60 * 1000;
                 *	var lastPOBrowse = new Date(Variable.GetValueAsString("LastPOBrowse"));
                 *	if (defaultValue && new Date().getTime() - lastPOBrowse.getTime() < grCheckTimeoutInMilliseconds)
                 *	{
                 *		return false;
                 *	}
                 * };
                 */
                Validation.ShouldCheckGoodsReceiptOnSetAside = function (defaultValue) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.onActionEnd
                 * @description
                 * Allows you to customize the Vendor invoice process when a user performs an action.
                 * This user exit is called at the end of the validation script, right after the action is performed
                 * If all necessary conditions are not met, the action is not performed and the user exit is not called.
                 * For example, if a required field is empty when the AP specialist clicks the Post button, it is detected by the validation script. In this case, the invoice is not posted and the user exit is not called.
                 * @param {String} actionType validation script type called (return value of Data.GetActionType())
                 * @param {String} actionName validation script action called in lower case ("onexpiration" if Process.AutoValidatingOnExpiration() or return value of Data.GetActionName() in lower case)
                 * @param {Object} [contributor] current Workflow contributor when the action is called
                 * @example
                 * <pre><code>
                 * onActionEnd: function (actionType, actionName, contributor)
                 * {
                 *	if (Lib.AP.WorkflowCtrl.IsEnded() &&
                 *		contributor &&
                 *		contributor.role === Lib.AP.WorkflowCtrl.roles.approver &&
                 *		contributor.action === "approve" &&
                 *		contributor.approved )
                 *	{
                 *		var globalPdfCommmand = "-instxt %infile[1]% -blt \"Arial\" 12 black -erase #FFFFFF -inflate 1 -XY 5 15 \""+contributor.date+"\" 1 -blt \"Arial\" 12 black -erase #FFFFFF -inflate 1 -XY 5 30 \""+contributor.login+" : "+ contributor.action+"\" 1";
                 *		var options = {RemoveGDRTiffFile:false};
                 *		// options = {RemoveGDRTiffFile:true}; // Functional example deactivated by default to avoid autolearning issues. If you really want the preview to be up to date uncomment the line
                 *		if(Attach.PDFCommands(globalPdfCommmand, options))
                 *		{
                 *			Log.Info("pdf command executed");
                 *		}
                 *		else
                 *		{
                 *			Log.Error("error pdfCommand");
                 *		}
                 *	}
                 * </code></pre>
                 */
                Validation.onActionEnd = function (actionType, actionName, contributor) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.OnValidationScriptEnd
                 * @description
                 * This user exit is called at the very end of the validation script in all cases
                 * @param {String} actionType validation script type called (return value of Data.GetActionType())
                 * @param {String} actionName validation script action called in lower case ("onexpiration" if Process.AutoValidatingOnExpiration() or return value of Data.GetActionName() in lower case)
                * OnValidationScriptEnd: function (actionType, actionName)
                * {
                *	Data.SetValue("Z_NumberOfLineItems__", Data.GetTable("LineItems__").GetItemCount());
                * }
                * </code></pre>
                */
                Validation.OnValidationScriptEnd = function (actionType, actionName) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.OnBilling
                 * @description
                 * Use this function to change billing information
                 * OnBilling is responsible to manage error, include eventual calling to Process.PreventApproval()
                 * @returns {boolean} false to indicate an error occurred and ask the process to stop the validation script execution.
                 */
                Validation.OnBilling = function () {
                    return true;
                };
                /**
                 * @method Lib.AP.Customization.Validation.FinalizeERPAckUpdateInvoice
                 * @since 330
                 * @description
                 * This user exit is called from the validation script of the Update invoice with ERP ID process
                 * Use this function to override the standard ERPAck Update of the Vendor Invoice, Vendor registration or Detailed Accrual Report Launcher process
                 * @param {xTransport} transport updated Process In Expected State
                 * @param {string} process updated process name
                 * @returns {void}
                 * @example
                 * <caption>This exmple shows how to add a custom field in the transport</caption>
                 * transport.GetUninheritedVars().AddValue_String("Z_ERPAdditionalInfo__", "OK", true);
                 */
                Validation.FinalizeERPAckUpdateInvoice = function (transport, process) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.SetInvoiceValidityDate
                 * @since 358
                 * @description
                 * Use this function to override the standard invoice validity date (default: SubmitDateTime + 16 months).
                 * This user exit is called every time the validity date is reset during the invoice workflow lifecycle.
                 * @param {number} defaultMonthsToAdd The number of months the standard behavior would add to compute the validity date.
                 * This value is `6` specifically for the post-expiration grace period reset, and `16` for every other caller
                 * (initial invoice extraction, ERP-acknowledgment-timeout reset, and the various workflow steps that reset the
                 * validity date without passing an explicit number of months).
                 * @returns {Date | void} Return the new Date to override the validityDateTime, or void to keep the default behavior. If an invalid value is returned, the default validity date will be applied.
                 * @example <caption>Extend the invoice validity to 5 years from submission date whenever the standard 16-months default applies
                 * (initial extraction, ERP-acknowledgment-timeout reset, and the other callers that don't pass an explicit number of months),
                 * while leaving the 6-months grace period reset unchanged.</caption>
                 * SetInvoiceValidityDate: function (defaultMonthsToAdd)
                 * {
                 *  if (defaultMonthsToAdd !== 16)
                 *  {
                 *   // Do not override the 6-months grace period reset
                 *   return;
                 *  }
                 *  var extendedDate = new Date(Data.GetValue("SubmitDateTime"));
                 *  extendedDate.setMonth(extendedDate.getMonth() + 60);
                 *  return extendedDate;
                 * }
                 */
                Validation.SetInvoiceValidityDate = function (defaultMonthsToAdd) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.GetERPLifecycleStatusMapping
                 * @since 358
                 * @description
                 * Called in the validation script of the Update invoice with ERP ID process before waking up the Vendor Invoice
                 * process with an ERP lifecycle event. Allows you to define a custom mapping from ERP lifecycle status values to
                 * Esker functional invoice statuses.
                 *
                 * When this user exit is not implemented, the Vendor Invoice validation script applies its built-in defaults:
                 * - `Approved`      → `Lib.AP.InvoiceStatus.ToPay`
                 * - `Refused`       → `Lib.AP.InvoiceStatus.Rejected`  *(direct-post path only)*
                 * - `InDispute`     → `Lib.AP.InvoiceStatus.OnHold`    *(direct-post path only)*
                 * - `TakenInCharge` → `Lib.AP.InvoiceStatus.ToApprove`
                 *
                 * Note: For `Refused` and `InDispute`, the custom status only applies when the invoice is on the direct-post
                 * path (workflow already ended). When the approval workflow is still active, the status is driven by the
                 * workflow engine and the mapping entry is not used.
                 *
                 * @returns {(Object.<string, string>|void)}
                 *   An object keyed by `Lib.AP.ERPAcknowledgment.ERPLifecycleStatus` values mapping to the desired
                 *   `Lib.AP.InvoiceStatus` value. Only entries that differ from the defaults need to be included.
                 *   Return nothing to keep all built-in defaults.
                 * @example
                 * GetERPLifecycleStatusMapping: function ()
                 * {
                 *     // Keep invoices in "To approve" instead of "Being processed by ERP" when the ERP takes them in charge,
                 *     // so that they remain visible in the approvers' worklist during ERP processing.
                 *     return {
                 *         TakenInCharge: Lib.AP.InvoiceStatus.ToApprove
                 *     };
                 * }
                 */
                Validation.GetERPLifecycleStatusMapping = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.CustomERPLifecycleDataValidation
                 * @since 364
                 * @description
                 * Called in the validation script of the Update invoice with ERP ID process before the ERP-provided
                 * lifecycle reason code (motif) is validated against Esker's built-in FRB2B reason lists
                 * (`Sys.FRB2B.AP.RejectionReasons`, `DisputeReasons`, `PartiallyApprovedReasons`, `SuspendedReasons`),
                 * and validated against the action code and action reason.
                 * You are given the full ERPAck XML document so you can perform custom validation, decide whether the
                 * standard reason code validation should be bypassed, or reject the ERPAck with a custom error.
                 *
                 * By default (standard behavior), the ERPAck is rejected when:
                 * - the reason code is missing for the `Refused` or `InDispute` lifecycle statuses,
                 * - the reason code does not match Esker's built-in FRB2B reason lists.
                 * - the action code is provided but invalid.
                 *
                 * The `erpReasonCode`/`erpReason`/`erpActionCode`/`erpActionReason` values in `erpLifecycleData` are
                 * propagated to the outbound CDV notification to the PA. Returning `true` bypasses the code-list validation
                 *
                 * @param {(XML.IXMLDOMElement|null)} xmlDoc the parsed ERPAck XML document, or `null` if it could not be read
                 * @param {string} lifecycleStatus the ERP lifecycle status being applied (see `Lib.AP.ERPAcknowledgment.ERPLifecycleStatus`)
                 * @param {Sys.FRB2B.AP.ERPLifecycleData} erpLifecycleData the ERP lifecycle data extracted from the ERPAck
                 *
                 * @returns {(boolean|string|void)}
                 * - Return `true` to bypass the standard reason/action code validation. The values in `erpLifecycleData`
                 *   are still used for the outbound CDV; missing labels are filled from the built-in/extended maps when the
                 *   code is known
                 * - Return a non-empty `string` to reject the ERPAck immediately with that string as the custom error message
                 *   (the standard validation is not run in this case).
                 * - Return `false` or nothing to keep the standard validation behavior.
                 * @example
                 * <caption>Always accept reason codes coming from a custom ERP system identified in the ERPAck XML</caption>
                 * CustomERPLifecycleDataValidation: function (xmlDoc, lifecycleStatus, erpLifecycleData)
                 * {
                 *  if (xmlDoc?.selectSingleNode("/ERPAck/ERPSystem")?.text === "MyCustomERP")
                 *  {
                 *   return true;
                 *  }
                 * }
                 * @example
                 * <caption>Reject the ERPAck when a required action code is missing for a custom ERP system</caption>
                 * CustomERPLifecycleDataValidation: function (xmlDoc, lifecycleStatus, erpLifecycleData)
                 * {
                 *  if (xmlDoc?.selectSingleNode("/ERPAck/ERPSystem")?.text === "MyCustomERP" &&
                 *      lifecycleStatus === Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Refused &&
                 *      !erpLifecycleData.erpActionCode)
                 *  {
                 *   return "An action code is required to refuse this invoice for MyCustomERP";
                 *  }
                 * }
                 */
                Validation.CustomERPLifecycleDataValidation = function (xmlDoc, lifecycleStatus, erpLifecycleData) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.SetClearingWaitingValidityDate
                 * @description
                 * Use this function to override the standard validity date for the Wait for Clearing state (default 24 hours timeout).
                 * This state is entered after the invoice is posted and the process waits for a clearing notification from SAP.
                 * @returns {Date | void} Return the new Date to override the validityDateTime, or void to keep the default behavior. If an invalid value is returned, the default validity date will be applied.
                 * @example
                 * SetClearingWaitingValidityDate: function ()
                 * {
                 *  // Extend the clearing wait timeout to 3 months (e.g. for SAP consignment invoices)
                 *  var extendedDate = new Date();
                 *  extendedDate.setMonth(extendedDate.getMonth() + 3);
                 *  return extendedDate;
                 * }
                 * </code></pre>
                 */
                Validation.SetClearingWaitingValidityDate = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.SetERPWaitingValidityDate
                 * @description
                 * Use this function to override the standard validity date, for the waiting state of ERP integration (default 24 hours timeout)
                 * @param {Date} validityDate the default computed validityDateTime (Now + 24 hours)
                 * @returns {Date | void} Return the new Date to override the validityDateTime, or void to keep the default behavior. If an invalid value is returned, the default validity date will be applied.
                 * @example
                 * SetERPWaitingValidityDate: function (validityDate)
                 * {
                 *  // Increase the timeout from 24 to 48 hours
                 *  validityDate.setHours(validityDate.getHours() + 24);
                 *  return validityDate;
                 *}
                 */
                Validation.SetERPWaitingValidityDate = function (validityDate) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.SetTransportSubject
                 * @description
                 * Use this function to change the subject of the transport.
                 * This subject will be visible on the billing logs and could be displayed in views and report.
                 * The SetTransportSubject user exit will be called for any validation action with valid vendor invoice data.
                 * @param {string} subject the precomputed subject
                 * @returns {string} the subject to set on transport. Return null, empty or the precomputed subject to keep the standar behavior
                 */
                Validation.SetTransportSubject = function (subject) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Validation.CustomPOItemAmountCheck
                 * @description
                 * Allows you to redefine the amount checks on PO or POGL Line Item so as to prevent automatic posting.
                 * By default, a touchless exception will be set if there is a mismatch amount or if the line amount exceeds the open amount.
                 * If this user exit returns true, the standard amount checks will be skipped for the line item (including the AdditionalPOItemAmountCheck user exit call).
                 * @since 349
                 * @param {Item} item The line item to check
                 * @returns {void|boolean} true to prevent automatic posting, false if valid, undefined to perform standard checks.
                 * @example <caption>Do not autopost if the amount differs from ExpectedAmount__ by more than 5% OR 50.</caption>
                 * CustomPOItemAmountCheck: function (item)
                 * {
                 *	if(!item) return false;
                 *
                 *	if(!Lib.P2P.InvoiceLineItem.IsPOLineItem(item))
                 *	{
                 *		item.SetWarning("Amount__", "");
                 *		return false;
                 *	}
                 *
                 *	var deliveredAmount = item.GetValue("ExpectedAmount__");
                 *	var amount = item.GetValue("Amount__");
                 *	var amountDiff = Math.abs(amount - deliveredAmount);
                 *	var absoluteLimit = 50;
                 *	var percentageLimit = 0.05;
                 *	var setTolerance = amountDiff >= absoluteLimit || amountDiff >= (percentageLimit * deliveredAmount);
                 *
                 *	if(setTolerance){
                 *		item.SetWarning("Amount__", "Tolerance limit exceeded. Amount must be within 5% or $50 of delivered amount.");
                 *	}else{
                 *		item.SetWarning("Amount__", "");
                 *	}
                 *
                 *	return setTolerance;
                 * }
                 */
                Validation.CustomPOItemAmountCheck = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.AdditionalPOItemAmountCheck
                 * @description
                 * Allows you to add a custom amout check on PO line items to prevent automatic posting.
                 * @since 349
                 * @param {Item} item The line item to check
                 * @returns {void|boolean} true to prevent automatic posting.
                 * @example <caption>Do not autopost if the amount differs from ExpectedAmount__ by more than 5% OR 50.</caption>
                 * AdditionalPOItemAmountCheck: function (item)
                 * {
                 *	if(!item) return false;
                 *
                 *	if(!Lib.P2P.InvoiceLineItem.IsPOLineItem(item))
                 *	{
                 *		item.SetWarning("Amount__", "");
                 *		return false;
                 *	}
                 *
                 *	var deliveredAmount = item.GetValue("ExpectedAmount__");
                 *	var amount = item.GetValue("Amount__");
                 *	var amountDiff = Math.abs(amount - deliveredAmount);
                 *	var absoluteLimit = 50;
                 *	var percentageLimit = 0.05;
                 *	var setTolerance = amountDiff >= absoluteLimit || amountDiff >= (percentageLimit * deliveredAmount);
                 *
                 *	if(setTolerance){
                 *		item.SetWarning("Amount__", "Tolerance limit exceeded. Amount must be within 5% or $50 of delivered amount.");
                 *	}else{
                 *		item.SetWarning("Amount__", "");
                 *	}
                 *
                 *	return setTolerance;
                 * }
                 */
                Validation.AdditionalPOItemAmountCheck = function (item) {
                };
                /**
                 * @typedef {Object} Lib.AP.Customization.Validation.CheckCSVDataImportParams
                 * @property {string} [POHeadersSubject]
                 * @property {string} [POItemsSubject]
                 * @property {number} [maxTry]
                 */
                /**
                 * @method Lib.AP.Customization.Validation.CheckCSVImportsParams
                 * @description
                 * Use this function to change the subject of the CSV Import for PO Headers and PO Items table and change the number of retry allowed.
                 * This subject will be used to check if there is a current import on these table and delay the post of the facture to avoid concurrent access
                 * The retry will be used to parametrize retry process.
                 * @returns {Lib.AP.Customization.Validation.CheckCSVDataImportParams} An object containing subjects for PO Headers and Items. Return null or the precomputed subject to keep the standar behavior
                 * @example
                 * <pre><code>
                 * CheckCSVImportsParams: function ()
                 * {
                 *  return {"POHeadersSubject": "CSV Import for PO Headers", "POItemsSubject": "CSV Import for PO Items", "maxTry": "5"};
                 *}
                 * </code></pre>
                 */
                Validation.CheckCSVImportsParams = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Validation.ShouldRebuildWFAfterCheckGoodsReceipt
                 * @description
                 * Use this function to rebuild the workflow after the checkgoodsreceipt action
                 * Rebuilding the workflow will allow to correctly compute contributors in case of price/quantity mismatch for instance
                 * /!\ The manually added contributors will be removed if the Rebuild action is called
                 * @returns {boolean} set to true to rebuild the workflow (default is false)
                 */
                Validation.ShouldRebuildWFAfterCheckGoodsReceipt = function () {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.Validation.OnCheckGoodsReceiptReconcile
                 * @description
                 * Use this function to add custom code AFTER checkGoodsReceipt action
                 * This action is triggered when an invoice is woken up after being set aside for "Waiting for goods receipt" reason.
                 */
                Validation.OnCheckGoodsReceiptReconcile = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.ShouldAutoPostInvoiceAfterGoodsReceiptDetection
                 * @since 356
                 * @description
                 * Use this function to prevent the touchless auto-post attempt after the checkgoodsreceipt action.
                 * This action is triggered when an invoice is woken up after being set aside for "Waiting for goods receipt" reason.
                 * Returning false preserves the wake-up and reconcile flow, while leaving the invoice on the standard manual validation path.
                 * Returning nothing preserves the standard behavior.
                 * @returns {boolean | void} Return false to skip the touchless auto-post attempt after goods receipt detection.
                 */
                Validation.ShouldAutoPostInvoiceAfterGoodsReceiptDetection = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.IsAutoSetAsideWaitingGRAllowed
                 * @description
                 * Use this function to override the standard 'canAutomaticallySetAsideWaitingGR' return result.
                 * @param {boolean} isAllowed the current value of whether the system will perform the auto set-aside or not
                 * @returns {boolean} return true to perform auto set-aside, false to not.
                 */
                Validation.IsAutoSetAsideWaitingGRAllowed = function (isAllowed) {
                };
                /**
                 * @typedef {Object} Lib.AP.Customization.Validation.CustomTouchlessRule
                 * @property {boolean} [byPassException]
                 * @property {boolean} [byPassCheckbox]
                 */
                /**
                 * @method Lib.AP.Customization.Validation.ByPassTouchlessManagerException
                 * @description
                 * Allows you to choose if you want a category of exceptions to block Touchless or not.
                 * This user exit is called from the function TouchlessManager.SetException which is called in the validation script of the Vendor invoice process.
                 * Important: for category `Lib.AP.TouchlessException.DataToConfirm`, even if the exception is bypassed here, the invoice is still considered invalid
                 * when the corresponding category error is raised.
                 * In this case, you may rely on `Lib.AP.Customization.Common.PurchaseOrder.GetPOLineValuesToVerify`, while keeping in mind this user exit is also
                 * used to prevent double posting and must be customized accordingly.
                 * @param {string} category The category of exception (Lib.AP.TouchlessException) which will be set
                 * @param {string} message The message associated with the exception
                 * @returns {Lib.AP.Customization.Validation.CustomTouchlessRule} If this category should raise an exception or not
                 * @example
                 * <pre><code>
                 * ByPassTouchlessManagerException: function(category, message)
                 * {
                 *	var customTouchlessRule = {};
                 *	switch (category) {
                 *		case Lib.AP.TouchlessException.VendorIdentificationException:
                 *			customTouchlessRule.byPassException = true;
                 *			break;
                 *		case Lib.AP.TouchlessException.PriceMismatch:
                 *			customTouchlessRule.byPassException = true;
                 *			customTouchlessRule.byPassCheckbox = true;
                 *			break;
                 *		case Lib.AP.TouchlessException.QuantityMismatch:
                 *			customTouchlessRule.byPassException = true;
                 *			break;
                 *		case Lib.AP.TouchlessException.NotCompliant:
                 *			if(message === "Cannot perform touchless because there are no line items.")
                 *			{
                 *				customTouchlessRule.byPassException = true;
                 *				customTouchlessRule.byPassCheckbox = true;
                 *			}
                 *			break;
                 *
                 *		default:
                 *			break;
                 *	}
                 *	return customTouchlessRule;
                 * }
                 * </code></pre>
                 */
                Validation.ByPassTouchlessManagerException = function (category, message) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.SetTouchlessManagerCustomExceptions
                 * @description
                 * Allows you to add custom exceptions to block touchless
                 * This user exit is called from the function TouchlessManager.CheckData which is called in the validation script of the Vendor invoice process.
                 * @returns {string[]} All the different exceptions messages
                 * @example
                 * <pre><code>
                 * SetTouchlessManagerCustomExceptions: function()
                 * {
                 *	var customExceptions = [];
                 *	var table = Data.GetTable("LineItems__");
                 *	var vendorNumber = Data.GetValue("VendorNumber__");
                 *	for (var i = 0; i < table.GetItemCount(); i++)
                 *	{
                 *		var item = table.GetItem(i);
                 *		if (item)
                 *		{
                 *			var itemVendorNumber = item.GetValue("VendorNumber__");
                 *			if(itemVendorNumber && vendorNumber && itemVendorNumber != vendorNumber)
                 *			{
                 *				customExceptions.push("Cannot perform touchless because the order vendor " + itemVendorNumber + " doesn't match the header vendor "  + vendorNumber);
                 *			}
                 *		}
                 *	}
                 *	return customExceptions;
                 * }
                 * </code></pre>
                 */
                Validation.SetTouchlessManagerCustomExceptions = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Validation.AttachOriginalFileToERPInvoice
                 * @description
                 * Allows you to attach the original EDI file to an ERP invoice instead of the generated HTML preview
                 * Not applicable for types like FacturX where the attached file is a PDF
                 * @returns {boolean} return true to attach the original file
                 * @example
                 * <pre><code>
                 * AttachOriginalFileToERPInvoice: function()
                 * {
                 *	return true;
                 * }
                 * </code></pre>
                 */
                Validation.AttachOriginalFileToERPInvoice = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.DeactivateAutoPostAfterReview
                 * @description
                 * Choose whether you want to prevent the system from automatically posting after review.
                 * @since 330
                 * @param {boolean} roleBeforePost the actual role before posting
                 * @returns {boolean} return true to prevent auto posting, false continue.
                 * @example <caption>This example deactivate the auto post action if reception method is not manual payment.</caption>
                 * Validation.DeactivateAutoPostAfterReview = function(roleBeforePost)
                 * {
                 *		if(Data.GetValue("ReceptionMethod__") != "Manual payment")
                 *		{
                 *			return true;
                 *		}
                 *		return false;
                 * }
                 */
                Validation.DeactivateAutoPostAfterReview = function (roleBeforePost) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.ForwardNonPoInvoiceToReviewerAllowed
                 * @description
                 * Choose the conditions under which you want to allow the system to forward the invoice to reviewer, or not.
                 * @since 330
                 * @returns {boolean} return true to allow the automatic forward, false to prevent the forward.
                 * @example <caption>This example allows the automatic forward only if reception method is manual payment.</caption>
                 * Validation.ForwardNonPoInvoiceToReviewerAllowed = function()
                 * {
                 *		if(Data.GetValue("ReceptionMethod__") === "Manual payment")
                 *		{
                 *			return true;
                 *		}
                 *		return false;
                 * }
                 */
                Validation.ForwardNonPoInvoiceToReviewerAllowed = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.GetActionName
                 * @since 332
                 * @description
                 * Use this function to customize the action name called.
                 * Do not forget to add your custom action in ExtendActionMap user exit.
                 * @returns {string} the customAction to execute. Return null or empty to keep the standard behavior
                 * @example <caption>In this example we use another action if invoice should be rejected</caption>
                 * Validation.GetActionName: function()
                 * {
                 *	let isRejectEnabled = Sys.Parameters.GetInstance("AP").GetParameter("Z_EnabledRejectInvoice", "0") === "1";
                 *  if (Data.GetValue("Z_Status__") == "Waiting vendor response" && isRejectEnabled)
                 *  {
                 *      return "z_rejecttimeout";
                 *  }
                 *	return null;
                 *
                 */
                Validation.GetActionName = function () {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.Validation.DeactivateAutoLearnForLineItems
                 * @description
                 * [Server] Use this function to prevent Esker from clearing and rewriting the ExtractedLineItems__ table
                 * during the validation script execution.
                 * By default, Esker's auto-learn mechanism feeds the ExtractedLineItems__ table with the current
                 * line item values each time the validation script runs. This overwrites previously extracted line data.
                 * Returning `true` deactivates this behavior, preserving the original extracted line items.
                 * @since 352
                 * @returns {boolean} Return `true` to deactivate auto-learn for line items and preserve extracted line data.
                 * Return `false` (default) to keep the standard behavior.
                 * @example <caption>Deactivate auto-learn for line items to preserve PO line data for reconciliation</caption>
                 * Validation.DeactivateAutoLearnForLineItems = function ()
                 * {
                 * 	   if(Z_ExtractedFromPO__ && Data.GetTable("LineItems__").GetItemCount() > 0)
                 * 	   {
                 *     		return true;
                 * 	   }
                 * 	   return false;
                 * };
                 */
                Validation.DeactivateAutoLearnForLineItems = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.GetCustomFieldsForALLineItems
                 * @description
                 * [Server] Allows to specify the list of custom fields to be used for the Auto Learning in line items.
                 * @since 331
                 * @returns {string[]} return the list of custom fields.
                 * @example <caption>This example returns a list of custom fields for AL in line items.</caption>
                 * Validation.GetCustomFieldsForALLineItems = function()
                 * {
                 *		return ["Z_CustomField1__", "Z_CustomField2__"];
                 * }
                 */
                Validation.GetCustomFieldsForALLineItems = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.ForceTryTouchless
                 * @description
                 * Use this function to bypass checks for the TryTouchless function.
                 * @param {boolean} fromCheckGR "true" if the function is called from the CheckGoodsReceipt action, false otherwise.
                 * @returns {boolean} "true" if TryTouchless should be called without checks.
                 * @example <caption>This example force the call of TryTouchless according to the invoice status</caption>
                 * Validation.ForceTryTouchless = function(fromCheckGR)
                 * {
                 * 	if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToVerify) {
                 * 		return true;
                 *  }
                 *	return false;
                 * }
                 */
                Validation.ForceTryTouchless = function (fromCheckGR) {
                };
                /**
                 * @method Lib.AP.Customization.Validation.CustomizeInvoiceERPManagerOnUpdateTablesAndPost
                 * @description
                 * Allows to customize the ERP manager instance used in the Update tables and post action.
                 * @since 332
                 * @returns {Lib.ERP.Invoice.Instance<any>} returns the customized ERP manager instance
                 * @example <caption>This example set the process to wait for the erp ack and returns a generic invoice manager</caption>
                 * Validation.CustomizeInvoiceERPManagerOnUpdateTablesAndPost = function()
                 * {
                 *		if(Data.GetValue("Z_ERP__") == "CUSTOMER_ERP")
                 *		{
                 *		 	Variable.SetValueAsString("WaitForERPAck", "true");
                 *			return Lib.ERP.CreateManager("generic").GetDocument("INVOICE");
                 *		}
                 * }
                 */
                Validation.CustomizeInvoiceERPManagerOnUpdateTablesAndPost = function () {
                };
                /**
                 * To define custom functions corresponding to business behaviors:
                 * Create a object in which Functions defined in this scope will only be accessible within this library
                 * They can be called the following way CustomHelpers.MyCustomHelper()
                 * New objects can be defined to isolate several functions linked to a feature (i.e. : VendorHelpers)
                 *  @example
                 * <pre><code>
                 * var CustomHelpers =
                 * {
                 *		ResetValidity: function () {
                 *			// Set the ValidityDateTime as in the extraction script (SubmitDateTime + 16 months)
                 *			var validityDT = Data.GetValue("SubmitDateTime");
                 *			validityDT.setMonth(validityDT.getMonth() + 16);
                 *			Data.SetValue("ValidityDateTime", validityDT);
                 *		}
                 * };
                 * </code></pre>
                 */
                // Uncomment here
                // var CustomHelpers =
                // {
                // };
                /*
                 * @method Lib.AP.Customization.Validation.GetCopyFileOwnerLogin
                 * @since 333
                 * @description
                 * Allows to specify the owner of the copy file transport used to export invoice.
                 * @returns {string} return the login of the user to set as owner.
                 * @example <caption>This example returns the login of the Top account service user stored as a custom parameter.</caption>
                 * Validation.GetCopyFileOwnerLogin = function()
                 * {
                 *		return Sys.Parameters.GetInstance("AP").GetParameter("Z_TopAccountServiceUser", "");
                 * }
                 */
                Validation.GetCopyFileOwnerLogin = function () {
                };
                /**
                 * @method Lib.AP.Customization.Validation.GetCustomFieldsForRecognitionStatistics
                 * @since 353
                 * @description
                 * [Server] Allows to extend the list of fields used to compute recognition statistics counters
                 * (AutomaticallyModifiedFieldsCount__ and ManuallyModifiedFieldsCount__).
                 * Use the `header` property to add header-level fields and `lineItems` to add line item-level fields.
                 * @returns { {header: string[], lineItems: string[]} } An object with optional arrays of field names to include in the statistics computation.
                 * @example <caption>This example adds custom header and line item fields to the recognition statistics.</caption>
                 * Validation.GetCustomFieldsForRecognitionStatistics = function()
                 * {
                 *		return {
                 *			header: ["Z_DocumentType__", "PostingDate__"],
                 *			lineItems: ["GLAccount__", "CostCenter__"]
                 *		};
                 * }
                 */
                Validation.GetCustomFieldsForRecognitionStatistics = function () {
                };
            })(Validation = Customization.Validation || (Customization.Validation = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_VALIDATION_SAMPLE.js.map