"use strict";
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_ExportUnpaidInvoices_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Script AP customization Export Unpaid Invoices",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP customization when exporting unpaid invoices
 * Used in the 'Export Unpaid Invoices' process.
 * @namespace Lib.AP.Customization.ExportUnpaidInvoices
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var ExportUnpaidInvoices;
            (function (ExportUnpaidInvoices) {
                /**
                * @method Lib.AP.Customization.ExportUnpaidInvoices.GetOutputPath
                * @description Allows users to set the output path for the payment update process dynamically
                * @param {string} folder Folder where the invoice will be posted (in the format "<SFTP Account>\<SFTP Folder>")
                * @param {string} filename Name of the file that will be posted
                * @returns {string} path that the invoice will be posted to (in the format "<SFTP Account>\<SFTP Folder>\<File name>")
                * @example
                * <pre><code>
                * GetOutputPath: function(folder, filename)
                * {
                *		var customFilename = `myPrefix_${filename}`;
                *		return `${folder}\\my_prefix_${filename}`;
                * }
                * </code></pre>
                */
                function GetOutputPath(folder, filename) {
                }
                ExportUnpaidInvoices.GetOutputPath = GetOutputPath;
                /**
                * @method Lib.AP.Customization.ExportUnpaidInvoices.GetAttributesAndHeaders
                * @description Allows users to customize the list of attributes and headers for the CSV export
                * @param {object} defaultAttributesAndHeaders Object containing default attributes and headers
                * @param {string[]} defaultAttributesAndHeaders.attributes Array of attribute names to query from the database
                * @param {string[]} defaultAttributesAndHeaders.headers Array of header labels for the CSV file
                * @returns {object} Object containing customized attributes and headers arrays
                * @since 347
                * @example
                * <pre><code>
                * GetAttributesAndHeaders: function(defaultAttributesAndHeaders)
                * {
                *		// Add a custom field to the export
                *		return {
                *			attributes: [...defaultAttributesAndHeaders.attributes, "Z_CustomField__"],
                *			headers: [...defaultAttributesAndHeaders.headers, "Custom Field"]
                *		};
                * }
                * </code></pre>
                */
                function GetAttributesAndHeaders(defaultAttributesAndHeaders) {
                }
                ExportUnpaidInvoices.GetAttributesAndHeaders = GetAttributesAndHeaders;
                /**
                * @method Lib.AP.Customization.ExportUnpaidInvoices.TransformCSVContent
                * @since 361
                * @description Server-side hook to transform CSV content before dispatching the file to SFTP
                * in Lib.AP.UnpaidInvoices.exportAttachToSFTP only (direct copy of the existing attachment).
                * Exports that split the attachment or generate CSV from query data do not call this hook.
                * @param {File} inputFile Input CSV file
                * @param {number} attachIndex Attachment index (0-based)
                * @returns {string | void} Transformed content string to export, or void to keep default behavior (uses the original file without transformation).
                * Use Process.GetInputFileAsString(inputFile) to read the file content.
                * @example <caption>Append CRLF at end of file for a specific integration</caption>
                * TransformCSVContent: function (inputFile, attachIndex)
                * {
                *		return Process.GetInputFileAsString(inputFile) + "\r\n";
                * }
                */
                function TransformCSVContent(inputFile, attachIndex) {
                }
                ExportUnpaidInvoices.TransformCSVContent = TransformCSVContent;
            })(ExportUnpaidInvoices = Customization.ExportUnpaidInvoices || (Customization.ExportUnpaidInvoices = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_ExportUnpaidInvoices_SAMPLE.js.map