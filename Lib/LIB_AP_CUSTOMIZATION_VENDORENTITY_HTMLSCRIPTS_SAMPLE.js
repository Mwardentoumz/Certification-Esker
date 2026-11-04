"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VENDORENTITY_HTMLSCRIPTS_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP vendor entity customization callbacks",
  "versionable": false,
  "require": [
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
/**
 * HTML (custom script) AP vendor entity customization callbacks
 * Used in the 'Vendor_company_extended_properties__' and 'Vendor_extended_properties__' process
 * @namespace Lib.AP.Customization.VendorEntity.HTMLScripts
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var VendorEntity;
            (function (VendorEntity) {
                var HTMLScripts;
                (function (HTMLScripts) {
                    /**
                     * HTML (custom script) AP vendor entity customization callbacks
                     * Used in the 'Vendor_company_extended_properties__' process
                     * @namespace Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany
                     */
                    let FromCompany;
                    (function (FromCompany) {
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany.OnHTMLScriptBegin
                         * @description
                         * This user exit is called at the beginning of synchronous part of the Vendor_company_extended_properties__ customscript, before loading asynchronous resources.
                         * Useful to define Control Events and avoid asynchronous issue
                         * @example
                         * <pre><code>
                         * OnHTMLScriptBegin: function ()
                         * {
                         *      const isComplianceAlert = Lib.VM.ComplianceRisk.IsEnabled() && Controls.ShowComplianceAlerts__.IsChecked();
                         *      Controls.Z_CustomField__.SetReadOnly(!isComplianceAlert);
                         *      Controls.Z_CustomField__.SetRequired(isComplianceAlert);
                         *      Controls.Z_CustomField__.OnChange = function ()
                         *      {
                         *            Data.SetValue("Z_CustomField2__", this.GetValue());
                         *      };
                         * }
                         * </code></pre>
                         */
                        FromCompany.OnHTMLScriptBegin = function () {
                        };
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany.OnHTMLScriptEndAsync
                         * @description
                         * This user exit is called at the end of the asynchronous part of the Vendor_company_extended_properties__ customscript, after the form has fully loaded.
                         * Allows you to customize the layout.
                         * Caution: this user exit is called asynchronously, if you need to define Control events, please implement the OnHTMLScriptBegin User Exit instead.
                         * @example
                         * <pre><code>
                         * OnHTMLScriptEndAsync: function ()
                         * {
                         *      Controls.Save.Hide(ProcessInstance.isReadOnly || User.profileRole === "guest");
                         * }
                         * </code></pre>
                         */
                        FromCompany.OnHTMLScriptEndAsync = function () {
                        };
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany.ForceRefreshScoreOnRiskScoringTable
                         * @description
                         * When refreshing the score gauge, allows a scoring provider to used the data from table 'VM - Risk Scoring__' instead of API response
                         * @param {ESK.Scoring.GaugeObject} data Gauge object containning the data of provider
                         * @return {boolean} return true if a scoring provider use data from table 'VM - Risk Scoring__'
                         * @example
                         * <pre><code>
                         * ForceRefreshScoreOnRiskScoringTable: function(providerData)
                         * {
                         *		return Variable.GetValueAsString("DnbCredentialUser__") === "demo" && data?.providerData.provider === Lib.VM.ScoringProviders.Common.ProviderName.duns;
                        * }
                        * </code></pre>
                        */
                        FromCompany.ForceRefreshScoreOnRiskScoringTable = function (data) {
                            return false;
                        };
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany.OnDisplayMoreDetails
                         * @description
                         * Called when the user clicks on the "More details"
                         * @example
                         * <pre><code>
                         * OnDisplayMoreDetails: function()
                         * {
                         *		Controls.SubForBank__.Hide(true);
                         *		Controls.StreetForBank__.Hide(true);
                         *		Controls.ZipCodeForBank__.Hide(true);
                         *		Controls.CityForBank__.Hide(true);
                         *		Controls.StateForBank__.Hide(true);
                         *		Controls.CountryForBank__.Hide(true);
                         * }
                         * </code></pre>
                         */
                        FromCompany.OnDisplayMoreDetails = function () {
                        };
                    })(FromCompany = HTMLScripts.FromCompany || (HTMLScripts.FromCompany = {}));
                    /**
                     * HTML (custom script) AP vendor entity customization callbacks
                     * Used in the 'Vendor_extended_properties__' process
                     * @namespace Lib.AP.Customization.VendorEntity.HTMLScripts.FromVendor
                     */
                    let FromVendor;
                    (function (FromVendor) {
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.FromVendor.OnHTMLScriptBegin
                         * @description
                         * This user exit is called at the beginning of synchronous part of the Vendor_extended_properties__ customscript, before loading asynchronous resources.
                         * Useful to define Control Events and avoid asynchronous issue
                         * @example
                         * <pre><code>
                         * OnHTMLScriptBegin: function ()
                         * {
                         *      Controls.Z_CustomField__.SetRequired(true);
                         *      Controls.Z_CustomField__.OnChange = function ()
                         *      {
                         *            Data.SetValue("Z_CustomField2__", this.GetValue());
                         *      };
                         * }
                         * </code></pre>
                         */
                        FromVendor.OnHTMLScriptBegin = function () {
                        };
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.FromVendor.OnHTMLScriptEndAsync
                         * @description
                         * This user exit is called at the end of the asynchronous part of the Vendor_extended_properties__ customscript, after the form has fully loaded.
                         * Allows you to customize the layout.
                         * Caution: this user exit is called asynchronously, if you need to define Control events, please implement the OnHTMLScriptBegin User Exit instead.
                         * @example
                         * <pre><code>
                         * OnHTMLScriptEndAsync: function ()
                         * {
                         *      Controls.Save.Hide(ProcessInstance.isReadOnly || User.profileRole === "guest");
                         * }
                         * </code></pre>
                         */
                        FromVendor.OnHTMLScriptEndAsync = function () {
                        };
                    })(FromVendor = HTMLScripts.FromVendor || (HTMLScripts.FromVendor = {}));
                    /**
                     * HTML (custom script) AP vendor entity customization callbacks
                     * Used in the 'Vendor_extended_properties__' process inside the VendorDetailsHelper object
                     * @namespace Lib.AP.Customization.VendorEntity.HTMLScripts.VendorDetails
                     */
                    let VendorDetails;
                    (function (VendorDetails) {
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.VendorDetails.GetCustomCompanyCodeAndVendorFilter
                         * @description
                         * This user exit is called when building the filter used to fill the related vendor views
                         * (Invoices, Purchase Orders, Contracts, etc.)
                         * @example
                         * GetCustomCompanyCodeAndVendorFilter: function (defaultFilter)
                         * {
                         *      // Allow company code to be empty. Replace FilterEqualOrExists with FilterEqualOrEmpty
                         * 		return Sys.Helpers.LdapUtil.FilterAnd(
                         *			Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", Data.GetValue("CompanyCode__")),
                         *			Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__"))
                         *		);
                         * }
                         * @since 332
                         */
                        function GetCustomCompanyCodeAndVendorFilter(defaultFilter) {
                            // This function is used to filter the company code and vendor in the vendor details.
                            // It can be customized to add additional filters based on business requirements.
                        }
                        VendorDetails.GetCustomCompanyCodeAndVendorFilter = GetCustomCompanyCodeAndVendorFilter;
                        /**
                         * @method Lib.AP.Customization.VendorEntity.HTMLScripts.VendorDetails.GetCustomCompanyCodeAndVendorFilterForSDA
                         * @since 354
                         * @description
                         * This user exit is called when building the filter used by the SDA related documents embedded view
                         * (table "DD - SenderForm") from Vendor details.
                         * @returns {Sys.Helpers.LdapUtil.IFilter} The filter to apply on the SDA related documents embedded view
                         * @example <caption>Allow empty company code for SDA sender forms while keeping vendor and active state constraints</caption>
                         * GetCustomCompanyCodeAndVendorFilterForSDA: function (defaultFilter)
                         * {
                         * 	return Sys.Helpers.LdapUtil.FilterAnd(
                         * 		Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CF_1711725718e_Company_code__", Data.GetValue("CompanyCode__")),
                         * 		Sys.Helpers.LdapUtil.FilterEqual("CF_17117258411_Vendor_number__", Data.GetValue("VendorNumber__")),
                         * 		Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100")
                         * 	);
                         * }
                         */
                        function GetCustomCompanyCodeAndVendorFilterForSDA(defaultFilter) {
                            // This function is used to filter the company code and vendor in the vendor details.
                            // It can be customized to add additional filters based on business requirements.
                        }
                        VendorDetails.GetCustomCompanyCodeAndVendorFilterForSDA = GetCustomCompanyCodeAndVendorFilterForSDA;
                    })(VendorDetails = HTMLScripts.VendorDetails || (HTMLScripts.VendorDetails = {}));
                })(HTMLScripts = VendorEntity.HTMLScripts || (VendorEntity.HTMLScripts = {}));
            })(VendorEntity = Customization.VendorEntity || (Customization.VendorEntity = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_VENDORENTITY_HTMLSCRIPTS_SAMPLE.js.map