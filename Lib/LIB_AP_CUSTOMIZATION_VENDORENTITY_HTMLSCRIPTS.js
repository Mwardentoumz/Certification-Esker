/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VENDORENTITY_HTMLSCRIPTS",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP vendor entity customization callbacks",
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.VendorEntity.HTMLScripts library: HTML (custom script) AP vendor entity customization callbacks
 */

/**
 * Package AP extraction script customization callbacks
 * @namespace Lib.AP.Customization.VendorEntity.HTMLScripts
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};
Lib.AP.Customization.VendorEntity = Lib.AP.Customization.VendorEntity || {};
Lib.AP.Customization.VendorEntity.HTMLScripts = Lib.AP.Customization.VendorEntity.HTMLScripts || {};

(function (parentLib)
{
	/**
	 * @lends Lib.AP.Customization.VendorEntity.HTMLScripts
	 */
	parentLib.FromCompany =
	{
		/**
		 * When refreshing the score gauge, allows a scoring provider to used the data from table 'VM - Risk Scoring__' instead of API response
		 * @param {ESK.Scoring.GaugeObject} data Gauge object containning the data of provider
		 * @returns {boolean} return true if a scoring provider use data from table 'VM - Risk Scoring__'
		 */
		ForceRefreshScoreOnRiskScoringTable: function (data)
		{
			return Variable.GetValueAsString("DnbCredentialUser__") === "demo" && data && data.providerData && data.providerData.provider === Lib.VM.ScoringProviders.Common.ProviderName.duns;
		}
	};

})(Lib.AP.Customization.VendorEntity.HTMLScripts);
