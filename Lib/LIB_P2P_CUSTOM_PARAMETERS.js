/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOM_PARAMETERS",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "My custom parameters definition for P2P applications.",
  "versionable": false,
  "require": [
    "Sys/Sys_Parameters"
  ]
}*/
var Lib;
(function ()
{
	/**
	 * @description This module allows you to set the parameters of the P2P solutions
	 * depending on the current execution environment (Development/QA/Production).
	 * The environment is detected based on the sub-account identifier.
	 */

	// If the environment detection fails, the parameters are set based on the default environment (PROD by default).

	// All parameters are described in the following documentation page:
	// https://webdoc/eskerondemand/cv_ly/en/manager/startpage.htm#processes/pac/Customizing/Parameters.html

	// My custom parameters for Purchasing processes only (PAC instance).
	Sys.Parameters.GetInstance("PAC").Extend(
		// Each object associates one environment to a list of parameters and their values.
		{
			"PROD": // Environment name: must exactly match the sub-account identifier.
			{
				"DemoEnableInvoiceCreation": "3",
				"ItemPriceVarianceToleranceLimit": "5%",
				"TotalPriceVarianceToleranceLimit": "5%",
				"DefaultCatalogLayout": "Cards"
			},
			"QA":
			{
				"DemoEnableInvoiceCreation": "3",
				"ItemPriceVarianceToleranceLimit": "5%",
				"TotalPriceVarianceToleranceLimit": "5%",
				"DefaultCatalogLayout": "Cards"
			},
			"DEV":
			{
				"DemoEnableInvoiceCreation": "3",
				"ItemPriceVarianceToleranceLimit": "5%",
				"TotalPriceVarianceToleranceLimit": "5%",
				"DefaultCatalogLayout": "Cards"
			}
		});

	// Vendor risk management (see LIB_AP_CUSTOMIZATION_COMMON)
	// Z_RiskThresholdMedium / Z_RiskThresholdHigh: amount (company currency) above which a compliance review is required
	// Z_AuditorsGroupLogin: group granted a read-only access to the invoices of sensitive vendors (see AuditControl)
	Sys.Parameters.GetInstance("AP").Extend(
		{
			"PROD":
			{
				"Z_RiskThresholdMedium": "10000",
				"Z_RiskThresholdHigh": "2000",
				"Z_AuditorsGroupLogin": "auditeurs@vilt-group.com"
			},
			"QA":
			{
				"Z_RiskThresholdMedium": "10000",
				"Z_RiskThresholdHigh": "2000",
				"Z_AuditorsGroupLogin": "auditeurs@vilt-group.com"
			},
			"DEV":
			{
				"Z_RiskThresholdMedium": "10000",
				"Z_RiskThresholdHigh": "2000",
				"Z_AuditorsGroupLogin": "auditeurs@vilt-group.com"
			}
		});

	Sys.Parameters.GetInstance("Contract").Extend(
		// Each object associates one environment to a list of parameters and their values.
		{
			"PROD": // Environment name: must exactly match the sub-account identifier.
			{
				"HighlightAIExtraction": "1"
			},
			"QA":
			{
				"HighlightAIExtraction": "1"
			},
			"DEV":
			{
				"HighlightAIExtraction": "1"
			}
		});

})();