"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_EXPORTINVOICES_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Script AP customization Export Invoices callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP ExportInvoices scripts customization callbacks
 * Used in the 'Export Invoices' processes.
 * @namespace Lib.AP.Customization.ExportInvoices
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var ExportInvoices;
            (function (ExportInvoices) {
                /**
                 * @method Lib.AP.Customization.ExportInvoices.GetReportDocumentInformation
                 * @description
                 * Allows you to customize the name, issuer and sender details based on the selected Company code at the Vendor Invoice Export process.
                 *	These informations will be used to generate the Report Document section of the Flux 10.1 xml.
                 * @since 287
                 * @returns {ReportInformation} The ReportInformation JavaScript object that contains name, issuer and sender details which will be used to populate the generated Flux 10.1 xml
                 * @example
                 * <pre><code>
                 * GetReportDocumentInformation: function()
                 * {
                 *	var ReportInformation = null;
                 * 	switch (Data.GetValue("CompanyCode__"))
                 *	{
                 *		case "FR01": {
                 *			ReportInformation = {
                 *				Id: "Matricule00001",
                 *				Name: "Déclaration 6 juin 2022",
                 *				Sender: {
                 *					IdType: "0002",
                 *					Id: "111111111",
                 *					Name: "PDP FOURNISSEUR",
                 *					RoleCode: "WK",
                 *					URIUniversalCommunication: {
                 *						URIID: "fournisseur@pdp.fr"
                 *					}
                 *				},
                 *				Issuer: {
                 *					IdType: "0002",
                 *					Id: "100000000",
                 *					Name: "FOURNISSEUR",
                 *					RoleCode: "SE",
                 *					URIUniversalCommunication: {
                 *						URIID: "fournisseur@fournisseur.fr"
                 *					}
                 *				}
                 *			};
                 *			break;
                 *		}
                 *		case "US01": {
                 *			ReportInformation = {
                 *				Name: "Declaration 6 june 2023",
                 *				Sender: {
                 *					IdType: "0003",
                 *					Id: "111111111",
                 *					Name: "PDP SUPPLIER",
                 *					RoleCode: "WK",
                 *					URIUniversalCommunication: {
                 *						URIID: "fournisseur@pdp.us"
                 *					}
                 *				},
                 *				Issuer: {
                 *					IdType: "0003",
                 *					Id: "100000000",
                 *					Name: "SUPPLIER",
                 *					RoleCode: "SE",
                 *					URIUniversalCommunication: {
                 *						URIID: "fournisseur@fournisseur.us"
                 *					}
                 *				}
                 *			};
                 *			break;
                 *		}
                 *		default:
                 *			break;
                 *	}
                 *	return ReportInformation;
                 * }
                 * </code></pre>
                 */
                ExportInvoices.GetReportDocumentInformation = function () {
                    return null;
                };
                /**
                 * @namespace Lib.AP.Customization.ExportInvoices.CSV
                 */
                ExportInvoices.CSV = {
                    /**
                     * @method Lib.AP.Customization.ExportInvoices.CSV.CustomizeOptions
                     * @description
                     * Allows you to customize the CSV options
                     * This user exit is called from the library Lib_FormDataToCSV
                     * @returns {Object} CSV options
                     * @example
                     * <pre><code>
                     * CustomizeOptions: function (options)
                     * {
                     *		return {
                     *			separator: ",",
                     *			delimiter: ""
                     *		}
                     * }
                     * </code></pre>
                     */
                    CustomizeOptions: function (options) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.ExportInvoices.CSV.CustomizeColumns
                     * @description
                     * Allows you to customize the columns options used to generate the CSV header
                     * @returns {Object} CSV columns
                     * @example
                     * <pre><code>
                     * CustomizeColumns: function (columns)
                     * {
                     *		return ["CompanyCode", "Type", "Z_AccountNumber", "Z_Description", "Amount"];
                     * }
                     * </code></pre>
                     */
                    CustomizeColumns: function (columns) {
                        return null;
                    },
                    /**
                     * @method Lib.AP.Customization.ExportInvoices.CSV.CustomizeVendorLine
                     * @description
                     * Allows you to customize vendor line output in the CSV
                     * @param {any} dataSrc - The Data object of the document.
                     * @param {object} vendorLineObj - The vendor line object.
                     * @param {object} vendorInfo - The vendor information object.
                     * @returns {CustomizeLineReturn} Returns a customized vendor line object or null if we discard vendor line.
                     * @example
                     * <pre><code>
                     * CustomizeVendorLine: function (dataSrc, vendorLineObj, vendorInfo)
                     * {
                     * 		// if we want to discard vendor line
                     * 		// return null;
                     * 		// otherwise, return a customized vendor line object
                     *		return {
                     *			CompanyCode: dataSrc.GetValue("CompanyCode__"),
                     *			Type: "V",
                     *			Z_AccountNumber: dataSrc.GetValue("Z_AccountNumber"),
                     *			Z_Description: vendorInfo.Account,
                     * 			Amount: vendorLineObj.invoiceAmount,
                     *		};
                     * }
                     * </code></pre>
                     */
                    CustomizeVendorLine: function (dataSrc, vendorLineObj, vendorInfo) {
                    },
                    /**
                     * @method Lib.AP.Customization.ExportInvoices.CSV.CustomizeInvoiceLines
                     * @description
                     * Allows you to customize invoice lines output in the CSV
                     * @param {any} dataSrc - The Data object of the document.
                     * @param {object} invoiceLineObj - The invoice line object.
                     * @param {any} item - An item line of table LineItem__.
                     * @returns {CustomizeLineReturn} Returns a customized invoice line object or null if we discard invoice line.
                     * @example
                     * <pre><code>
                     * CustomizeInvoiceLines: function (dataSrc, invoiceLineObj, item)
                     * {
                     * 		// if we wante to discard invoice line
                     * 		// return null;
                     * 		// otherwise, return a customized invoice line object
                     *		return {
                     *			Z_CompanyCode: dataSrc.GetValue("Z_CompanyCode"),
                     *			Type: invoiceLineObj.Type,
                     *			AccountNumber: dataSrc.GetValue("VendorNumber__"),
                     *			Z_Description: dataSrc.GetValue("Z_Description__"),
                     *			Amount: item.GetValue("Amount__")
                     *		};
                     * }
                     * </code></pre>
                     */
                    CustomizeInvoiceLines: function (dataSrc, invoiceLineObj, item) {
                    },
                    /**
                     * @method Lib.AP.Customization.ExportInvoices.CSV.CustomizeTaxLines
                     * @description
                     * Allows you to customize tax line output in the CSV
                     * @param {any} dataSrc - The Data object of the document.
                     * @param {object} vendorInfo - The vendor information object.
                     * @param {number} taxAmount - The tax amount value.
                     * @param {object} taxLineObj - The tax line object.
                     * @returns {CustomizeLineReturn} Returns a customized tax line object or null if we discard tax line.
                     * @example
                     * <pre><code>
                     * CustomizeTaxLines: function (dataSrc, vendorInfo, taxAmount, taxLineObj)
                     * {
                     * 		// if we discard tax line
                     * 		// return null;
                     * 		// otherwise, we return a customized tax line object
                     *		return {
                     *			Z_CompanyCode: Data.GetValue("Z_CompanyCode"),
                     *			Type: "T",
                     *			AccountNumber: vendorInfo.Account,
                     *			Z_Description: taxLineObj.Description,
                     *			Amount: taxAmount
                     *		};
                     * }
                     * </code></pre>
                     */
                    CustomizeTaxLines: function (dataSrc, vendorInfo, taxAmountsInfo, taxLineObj) {
                    }
                };
                /**
                 * @namespace Lib.AP.Customization.ExportInvoices.TRA
                 */
                ExportInvoices.TRA = {
                    /**
                     * @method Lib.AP.Customization.ExportInvoices.TRA.OnInvoiceItemInitCommonPartsEnd
                     * @since 345
                     * @description
                     * Called at the end of InitCommonParts. Allows you to customize any property of the InvoiceItem object.
                     * You can:
                     * - mutate invoiceItem directly
                     * @param {object} invoiceItem The InvoiceItem object being built.
                     * @param {any} dataSrc The Data object of the document.
                     * @param {any} itemLine The current line item record (LineItem__ row).
                     * @param {object} vendorHelperObj The vendor helper object (can be null/undefined).
                     * @example <caption>Example: override LIBRETEXTE3 field.</caption>
                     * OnInvoiceItemInitCommonPartsEnd: function (invoiceItem, dataSrc, itemLine, vendorHelperObj)
                     * {
                     *     invoiceItem.LIBRETEXTE3 = "TEST";
                     * }
                     */
                    OnInvoiceItemInitCommonPartsEnd: function (invoiceItem, dataSrc, itemLine, vendorHelperObj) {
                    }
                };
            })(ExportInvoices = Customization.ExportInvoices || (Customization.ExportInvoices = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_EXPORTINVOICES_SAMPLE.js.map