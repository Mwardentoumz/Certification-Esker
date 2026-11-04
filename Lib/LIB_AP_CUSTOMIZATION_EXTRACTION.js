/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_EXTRACTION",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Extraction script AP customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Extraction library: extraction script AP customization callbacks
 */

/**
 * Package AP extraction script customization callbacks
 * @namespace Lib.AP.Customization.Extraction
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.Extraction
	 */
	parentLib.Extraction =
	{
		/**
		 * Allows you to force the line items extraction, even if ExtractedLineItems__ is not empty
		 * By default, it tries to extract data from invoice if nothing was found by teaching or synergy
		 * @param {ITable} extractedLineItemsTable ExtractedLineItems__ table object
		 * @returns {boolean} if true, force the line items extraction
		 */
		ForceToExtractLineItemsFromInvoice: function (extractedLineItemsTable)
		{
			return true;
		},

		AddLineItemsRecognitionTemplates: function ()
		{
			var londonPostMasterMultiline = "LondonPostmaster-Multiline";
			var londonPostMasterSingleLine = "LondonPostmaster-SingleLine";
			var londonPostMasterMultilinePartial = "LondonPostmaster-Multiline-Partial";
			var IDESSimpleLine = "IDES-SimpleLine";
			var MMGeneratorSimpleLine = "MMGenerator-SimpleLine";
			var PACMultiline = "PAC-Multiline";
			var londonPostMasterVendor = "London Postmaster vendor";
			var londonPostMaster = "London Postmaster";
			var totalGBP = "Total GBP Incl. VAT";


			/**
			*	Declare the template for London Postmaster multiline template
			*/
			function AddLondonPostmasterTemplateGeneric()
			{
				Sys.Helpers.ExtractTable.AddDocumentType(londonPostMasterMultiline);
				Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterMultiline, londonPostMasterVendor, londonPostMaster, Document.GetArea(0, 76, 154, 360, 166), false, true);
				Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterMultiline, "Invoice N°", "109423", Document.GetArea(0, 540, 543, 305, 135), false, true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "OrderNumber", null, null, /Your Order No.\s*(45000[0-9]{5})/gi, "OrderNumberExtracted__", true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "PartNo", null, null, /(PD#[0-9]+)/gi, "PartNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "UnitPrice", 1200, 200, "Number", "UnitPriceExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "Quantity", 960, 160, "Number", "QuantityExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "Amount", 2000, 250, "Number", "AmountExtracted__");
				var multiLineOptions =
				{
					LineItemHeight: 170,
					TableTopPosition: 1430,
					TableBottomPosition: 3200,
					TableBottomDelimiter: totalGBP,
					ExactBoundingArea: true
				};
				Sys.Helpers.ExtractTable.SetOptions(londonPostMasterMultiline, multiLineOptions);

				/* FT-028576 - Fix sample invoice recognition :
				* Extract line items for template of invoice PO_INVOICE_GB_2_Lines.pdf if there is no teaching template associated
				* The need is to make sure this training scenario :
				* https://webdoc/training/cv_ly/en/portal/startpage.htm?AP_Application_Reconciliation_Mechanism/Demo_scenarios.html#AP_Application_Reconciliation_Mechanism/Demo_scenarios.html
				* works as expected, and for that, we need to ignore results from Synergy Neural Network for line items for this particular invoice
				*/
				if (!Data.GetValue("LayoutIdentifier__"))
				{
					Sys.Helpers.ExtractTable.AddDocumentType(londonPostMasterMultilinePartial);
					Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterMultilinePartial, londonPostMasterVendor, londonPostMaster, Document.GetArea(0, 76, 154, 360, 166), false, true);
					Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterMultilinePartial, "Invoice N°", "108037", Document.GetArea(0, 180, 780, 570, 60), false, true);
				}

				Sys.Helpers.ExtractTable.AddDocumentType(londonPostMasterSingleLine);
				Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterSingleLine, londonPostMasterVendor, londonPostMaster, Document.GetArea(0, 76, 154, 360, 166), false, true);
				Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterSingleLine, "Ref. in table", "Ref.", Document.GetArea(0, 156, 1232, 113, 47), false, true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "OrderNo", null, null, /(45000[0-9]{5})/gi, "OrderNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "PartNo", null, null, /(DPC[0-9]+)/gi, "PartNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "UnitPrice", 1200, 200, "Number", "UnitPriceExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "Quantity", 900, 110, /([0-9]+)/gi, "QuantityExtracted__", true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "Amount", 2100, 220, "Number", "AmountExtracted__", true);
				var singleLineOptions =
				{
					LineItemHeight: 50,
					TableTopPosition: 1410,
					TableBottomPosition: 2180,
					TableBottomDelimiter: totalGBP,
					ExactBoundingArea: true
				};
				Sys.Helpers.ExtractTable.SetOptions(londonPostMasterSingleLine, singleLineOptions);
			}

			/**
			*	Declare the template for London Postmaster multiline template (SAP)
			*/
			function AddLondonPostmasterTemplateSAP()
			{
				Sys.Helpers.ExtractTable.AddDocumentType(londonPostMasterMultiline);
				Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterMultiline, londonPostMasterVendor, londonPostMaster, Document.GetArea(0, 153, 220, 360, 300), false, true);
				Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterMultiline, "Your Order No in description", "Your Order No", Document.GetArea(0, 400, 1649, 638, 607), false, true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "OrderNumber", null, null, /Your Order No.\s*(45000[0-9]{5})/gi, "OrderNumberExtracted__", true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "PartNo", null, null, /(PD#[0-9]+)/gi, "PartNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "UnitPrice", 1300, 200, "Number", "UnitPriceExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "Quantity", 940, 180, "Number", "QuantityExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterMultiline, "Amount", 2170, 180, "Number", "AmountExtracted__");
				var multiLineOptions =
				{
					LineItemHeight: 100,
					TableTopPosition: 1400,
					TableBottomPosition: 3400,
					TableBottomDelimiter: totalGBP,
					ExactBoundingArea: true
				};
				Sys.Helpers.ExtractTable.SetOptions(londonPostMasterMultiline, multiLineOptions);

				Sys.Helpers.ExtractTable.AddDocumentType(londonPostMasterSingleLine);
				Sys.Helpers.ExtractTable.AddRecognitionRule(londonPostMasterSingleLine, londonPostMasterVendor, londonPostMaster, Document.GetArea(0, 140, 150, 360, 300), false, true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "OrderNo", null, null, /(45000[0-9]{5})/gi, "OrderNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "PartNo", null, null, /(DPC[0-9]+)/gi, "PartNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "UnitPrice", 1300, 300, "Number", "UnitPriceExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "Quantity", 900, 400, /([0-9]+)/gi, "QuantityExtracted__", true);
				Sys.Helpers.ExtractTable.AddExtractionRule(londonPostMasterSingleLine, "Amount", 2100, 250, "Number", "AmountExtracted__", true);

				var singleLineOptions =
				{
					LineItemHeight: 49,
					TableTopPosition: 1400,
					TableBottomPosition: 2300,
					TableBottomDelimiter: totalGBP,
					ExactBoundingArea: true
				};
				Sys.Helpers.ExtractTable.SetOptions(londonPostMasterSingleLine, singleLineOptions);
			}

			/**
			*	Declare the template for IDES templates
			*/
			function AddIDESTemplate()
			{
				Sys.Helpers.ExtractTable.AddDocumentType(IDESSimpleLine);
				Sys.Helpers.ExtractTable.AddRecognitionRule(IDESSimpleLine, "IDES invoice", "IDES AG", Document.GetArea(0, 2175, 310, 200, 100), false, true);
				Sys.Helpers.ExtractTable.AddExtractionRule(IDESSimpleLine, "OrderNo", null, null, /(45000[0-9]{5})/gi, "OrderNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(IDESSimpleLine, "PartNo", null, null, /((DPC|T-|40-)[0-9]+[a-z]?)/gi, "PartNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(IDESSimpleLine, "UnitPrice", 1300, 300, "Number", "UnitPriceExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(IDESSimpleLine, "Quantity", 900, 400, /([0-9]+)/gi, "QuantityExtracted__", true);
				Sys.Helpers.ExtractTable.AddExtractionRule(IDESSimpleLine, "Amount", 2100, 250, "Number", "AmountExtracted__", true);
				var singleLineOptions =
				{
					LineItemHeight: 50,
					TableTopPosition: 1400,
					TableBottomPosition: 2500,
					TableBottomDelimiter: "Total EUR Incl. VAT",
					ExactBoundingArea: true
				};
				Sys.Helpers.ExtractTable.SetOptions(IDESSimpleLine, singleLineOptions);

				Sys.Helpers.ExtractTable.AddDocumentType(MMGeneratorSimpleLine);
				Sys.Helpers.ExtractTable.AddRecognitionRule(MMGeneratorSimpleLine, "MMGenerator invoice", "Ides AG", Document.GetArea(0, 1240, 845, 1000, 250), false, true);
				Sys.Helpers.ExtractTable.AddExtractionRule(MMGeneratorSimpleLine, "Order", null, null, /(45000[0-9]{5})/gi, "OrderNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(MMGeneratorSimpleLine, "Ref", null, null, /((DPC|T-|40-)[0-9]+[a-z]?)/gi, "PartNumberExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(MMGeneratorSimpleLine, "Unit Price", 1620, 225, "Number", "UnitPriceExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(MMGeneratorSimpleLine, "Quantity", 1370, 225, /([0-9]+)/gi, "QuantityExtracted__", true);
				Sys.Helpers.ExtractTable.AddExtractionRule(MMGeneratorSimpleLine, "Amount", 1875, 225, "Number", "AmountExtracted__", true);
				singleLineOptions =
				{
					LineItemHeight: 50,
					TableTopPosition: 1500,
					TableBottomPosition: 3000,
					TableBottomDelimiter: "AMOUNT DUE",
					ExactBoundingArea: true
				};
				Sys.Helpers.ExtractTable.SetOptions(MMGeneratorSimpleLine, singleLineOptions);
			}

			/**
			*	Declare the template for the demo multiline template
			*/
			function AddEskerDemoTemplate()
			{
				Sys.Helpers.ExtractTable.AddDocumentType(PACMultiline);
				// Use full document area since it only appears on last page
				Sys.Helpers.ExtractTable.AddRecognitionRule(PACMultiline, "Esker Demo", "Esker Demo", Document.GetArea(), false, true);
				var bGRIV = Lib.P2P.IsGRIVEnabledGlobally();
				if (bGRIV)
				{
					Sys.Helpers.ExtractTable.AddExtractionRule(PACMultiline, "DN", 149, 244, /([#0-9A-Za-z_-]+)/gi, "DeliveryNoteExtracted__");
					Sys.Helpers.ExtractTable.AddExtractionRule(PACMultiline, "PartNo", 400, 244, /([0-9A-Za-z_-]+)/gi, "PartNumberExtracted__", true);
				}
				else
				{
					Sys.Helpers.ExtractTable.AddExtractionRule(PACMultiline, "PartNo", 149, 244, /([0-9A-Za-z_-]+)/gi, "PartNumberExtracted__", true);
				}
				Sys.Helpers.ExtractTable.AddExtractionRule(PACMultiline, "UnitPrice", 1713, 208, "Number", "UnitPriceExtracted__");
				Sys.Helpers.ExtractTable.AddExtractionRule(PACMultiline, "Quantity", 1312, 219, "Number", "QuantityExtracted__", true);
				Sys.Helpers.ExtractTable.AddExtractionRule(PACMultiline, "Amount", 2190, 181, "Number", "AmountExtracted__", true);
				var multiLineOptions =
				{
					LineItemHeight: 48,
					TableTopPosition: 1650,
					TableBottomPosition: 2354,
					ExactBoundingArea: true
				};
				Sys.Helpers.ExtractTable.SetOptions(PACMultiline, multiLineOptions);
			}

			if (Sys.Parameters.GetInstance("AP").GetParameter("AutolearningOnPOLines") !== "1")
			{
				if (Lib.ERP.IsSAP())
				{
					AddLondonPostmasterTemplateSAP();
					AddIDESTemplate();
				}
				else
				{
					AddLondonPostmasterTemplateGeneric();
				}
				AddEskerDemoTemplate();
			}
			return true;
		},

		DetermineCompanyCodeAndERPByDocumentName: function ()
		{
			return true;
		},

		/**
		 * Called after tax computation but before the workflow is built:
		 * fills the vendor risk fields so that the compliance review step is added to the workflow if needed
		 */
		OnLineItemsPopulatedPostTax: function ()
		{
			const VendorRisk = Lib.AP.Customization.Common.CustomFunctions.VendorRisk;
			VendorRisk.EvaluateInvoiceRisk()
				.Then(function (assessment)
				{
					VendorRisk.ApplyToForm(assessment);
				})
				.Catch(function (error)
				{
					Log.Error("[VendorRisk] Unexpected error during extraction: " + (error && error.message ? error.message : error));
				});
		},

		/**
		 * When the company code is not defined, uses the default value for the given ERP.
		 */
		ForceCompanyCode: function ()
		{
			if (!Data.GetValue("CompanyCode__"))
			{
				const companyCode = Lib.ERP.IsSAP() ? "1000" : "US01";
				Log.Info("CompanyCode not defined by process variable or vendor, set to default value " + companyCode);
				Data.SetValue("CompanyCode__", companyCode);
			}
		},

		/**
		 * Allow override of the CompanyCode from the default configuration in generic ERP
		 * but always keep CompanyCode defined as an External Variable
		 */
		OnFillVendorFieldsFromQueryResult: function (vendorRecord)
		{
			/**
			 * Check if the company code can be computed
			 * @returns {boolean} true if the company code can be computed
			 */
			function isCompanyCodeCanBeComputed()
			{
				const companyCodeVariable = Variable.GetValueAsString("CompanyCode");
				const portalCompanyCode = Variable.GetValueAsString("customerInvoiceCompanyCode");

				return !companyCodeVariable && !portalCompanyCode && Lib.ERP.IsGeneric("AP");
			}

			if (!isCompanyCodeCanBeComputed())
			{
				return;
			}

			/**
			 * Retrieve the company code from the list using the vendor number and name
			 * @param {Object.<string, Object.<string, string>>} list
			 * @param {string} vendorNumber
			 * @param {string} vendorName
			 * @returns {string|null} the company code or null if not found
			 */
			function getCompanyCodeFromList(list, vendorNumber, vendorName)
			{
				if (list[vendorNumber])
				{
					return list[vendorNumber][vendorName] || list[vendorNumber]["*"] || null;
				}
				return null;
			}

			let companyCode = null;
			if (Lib.ERP.IsSAP())
			{
				// Get company code for SAP
				companyCode = getCompanyCodeFromList({
					"8004": {
						"MJ": "1000"
					},
					"8005": {
						"London Postmaster": "1000"
					}
				}, vendorRecord.Number__, vendorRecord.Name__);
			}
			else
			{
				// Get company code for generic ERP
				companyCode = getCompanyCodeFromList({
					"MJ1186": {
						"MJ": "US01"
					},
					"DUR0005": {
						"Durial Bureautique": "FR01"
					},
					"10000": {
						"London Postmaster": "UK01"
					},
					"TH10000": {
						"*": "TH01"
					},
					"TH20000": {
						"*": "TH01"
					},
					"MY10000": {
						"*": "MY01"
					},
					"MY20000": {
						"*": "MY01"
					},
					"SG10000": {
						"*": "SG01"
					},
					"SG20000": {
						"*": "SG01"
					}
				}, vendorRecord.Number__, vendorRecord.Name__);

				// Try to highlight the area related to the Invoice Number
				let areas = [];
				if (vendorRecord.Number__ === "TH20000")
				{
					areas = Document.SearchString("TRC.PR.2423/2352/02", 0, 1811, 884, 461, 34, false, false);

				}
				else if (vendorRecord.Number__ === "SG10000")
				{
					areas = Document.SearchString("980004652", 0, 1299, 1358, 205, 30, false, false);
				}
				if (areas.length > 0)
				{
					Data.SetValue("InvoiceNumber__", areas[0]);
				}
			}

			if (companyCode)
			{
				// Force the company code
				Log.Info("Demo sample : Force company code to " + companyCode);
				Data.SetValue("CompanyCode__", companyCode);

				// Clean warning if any
				Data.SetWarning("CompanyCode__", "");

				// Reset highlight of the company code area
				if (Lib.AP.CompanyCodeDetermination.g_CompanyCodeArea !== null)
				{
					Lib.AP.CompanyCodeDetermination.g_CompanyCodeArea.Highlight(false, 0, 0, "CompanyCode__");
				}
			}
		}

	};

})(Lib.AP.Customization);
