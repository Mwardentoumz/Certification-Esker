"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_WIZARD_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP wizard customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP HTML page script customization callbacks for all processes
 * @namespace Lib.AP.Customization.Wizard
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var Wizard;
            (function (Wizard) {
                /**
                 * @namespace Lib.AP.Customization.Wizard.CustomUserExits
                 * @description
                 * Allows you to define custom user exists added for this customer
                 * Functions defined in this scope will be accessible from outside this library
                 * They can be called the following way Lib.AP.Customization.CustomUserExits.OnCompanyCodeChange(queryResult)
                 * @example
                 * <pre><code>
                 * CustomUserExits:
                 * {
                 *		OnCompanyCodeChange: function (queryResult)
                 *		{
                 *			//Call a business function to handle the custom behavior to be applied
                 *			//See CustomHelpers object definition below
                 *			CustomHelpers.HandleVendorWarning();
                 *		}
                 * },
                 * </code></pre>
                 */
                Wizard.CustomUserExits = {};
                /**
                 * Specifics customization for the SAP and Generic AP Wizard
                 * @namespace Lib.AP.Customization.Wizard.Common
                 */
                Wizard.Common = {
                    /**
                     * OCRLanguageDefinition
                     * @typedef {Object} Lib.AP.Customization.Wizard.Common.OCRLanguageDefinition
                     * @property {number} value - OCRLanguage language code
                     * @property {string} key - OCRLanguage translation key
                     */
                    /**
                     * @name Lib.AP.Customization.Wizard.Common.CustomizeOCRLanguagesList
                     * @description
                     * Allows you to customize OCR languages list show in the comboBox of the OCR parameters.
                     * @param {Lib.AP.Customization.Wizard.Common.OCRLanguageDefinition[]} defaultOCRLanguagesList default OCR languages supported.
                     * @return {Lib.AP.Customization.Wizard.Common.OCRLanguageDefinition[]} customized list to be shown in the OCR languages comboBox.
                     * @example
                     * <pre><code>
                     * CustomizeOCRLanguagesList: function (defaultOCRLanguagesList)
                     * {
                     *	defaultOCRLanguagesList.push({ value: "_Danish", key: 7 });
                     *	return defaultOCRLanguagesList;
                     * }
                     * </code></pre>
                     */
                    CustomizeOCRLanguagesList: function (defaultOCRLanguagesList) {
                    },
                    /**
                     * WizardStep
                     * @typedef {Object} Lib.AP.Customization.Wizard.Common.WizardStep
                     * @property {string[]} panels - Panel names
                     * @property {string} icon - Step's icon
                     * @property {string} title - Step's title
                     * @property {string} description - Step's description
                     * @property {Function(): boolean} isVisible - To determine if pane should be shown
                     * @property {Function(): void} onStart - To initialize the pane, declare OnChanges...
                     * @property {Function(): boolean} onQuit - To validate the data entered by the user (true allows saving or moving to the previous wizard steps, false silently prevents leaving the page)
                     */
                    /**
                     * @name Lib.AP.Customization.Wizard.Common.CustomizeStep
                     * @description
                     * Allow you to customize and personalize the Customization step pane in the wizard
                     * @param {WizardStep} step The configurator's Customization step
                     * @see https://docptn.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#cshid=2547
                     * @example
                     * <pre><code>
                     * CustomizeStep: function(step)
                     * {
                     *		// Use isVisible to determine if Customizations pane should be shown
                     *		step.isVisible = function() {
                     *			 return true;
                     *		};
                     *
                     *		// Use onStart to initialize the pane, declare OnChanges, ...
                     *		step.onStart = function () {
                     *			var customizationPanel = step.panels[0];
                     *			customizationPanel.SetText("My custom title");
                     *			var myTextField_defaultValue = "This is the default";
                     *			if(Data.IsNullOrEmpty("Z_myTextField__"))
                     *			{
                     *				Data.SetValue("Z_myTextField__", myTextField_defaultValue);
                     *			}
                     *		};
                     *
                     *		// Use onQuit to validate the data entered by the user
                     *		// - returning true allows saving or moving to the previous wizard steps
                     *		// - returning false silently prevents leaving the page (via Previous or Save buttons)
                     *		// In that case, be sure to explicit the reason with a message/warning for the user to know about it
                     *		step.onQuit = function () {
                     *			var allIsOk = true;
                     *			return allIsOk;
                     *		};
                     *
                     *		// Customize other variables before form initialization
                     *		CustomScript.MultiValuedFieldsToDisplayAsMultiLine.push("Z_GRNumberPatterns__");
                     * }
                     * </code></pre>
                     */
                    CustomizeStep: function (step) {
                    },
                    /**
                     * @name Lib.AP.Customization.Wizard.Common.CustomizeGlobalStep
                     * @description
                     * Allow you to customize and personalize the Customization step pane in the global wizard
                     * @param {WizardStep} step - The configurator's Customization step
                     * @see https://docptn.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#cshid=2547
                     * @example
                     * <pre><code>
                     * CustomizeGlobalStep: function(step)
                     * {
                     *		// Use isVisible to determin if Customizations pane should be shown
                     *		step.isVisible = function() {
                     *			 return true;
                     *		};
                     *
                     *		// Use onStart to initialize the pane, declare OnChanges, ...
                     *		step.onStart = function () {
                     *			var customizationPanel = step.panels[0];
                     *			customizationPanel.SetText("My custom title");
                     *			var myTextField_defaultValue = "This is the default";
                     *			if(Data.IsNullOrEmpty("myTextField__"))
                     *			{
                     *				Data.SetValue("myTextField__", myTextField_defaultValue);
                     *			}
                     *		};
                     *
                     *		// Use onQuit to validate the data entered by the user
                     *		// - returning true allows saving or moving to the previous wizard steps
                     *		// - returning false silently prevents leaving the page (via Previous or Save buttons)
                     *		// In that case, be sure to explicit the reason with a message/warning for the user to know about it
                     *		step.onQuit = function () {
                     *			var allIsOk = true;
                     *			return allIsOk;
                     *		};
                     * }
                     * </code></pre>
                     */
                    CustomizeGlobalStep: function (step) {
                    }
                };
                Wizard.AgencySettings = {
                    /**
                     * @name Lib.AP.Customization.Wizard.AgencySettings.OnChangeProvider
                     * @description
                     * Allows you to customize the OnChangeProvider event in the definition of the agency settings
                     *
                     * @param {string} providerName The name of the provider selected
                     * @return {void}
                     * @example
                     * <pre><code>
                     * OnChangeProvider: function (providerName) {
                     * 		// Custom code to be executed when the provider is changed in the Agency Settings page of the wizard
                     * 		Controls.Z_FailureScoreL1__.Hide(providerName !== "duns");
                     * 	}
                     * </code></pre>
                     */
                    OnChangeProvider: function (providerName) {
                    }
                };
                /**
                 * @method Lib.AP.Customization.Wizard.OnHTMLScriptEnd
                 * @since 330
                 * @description
                 * This user exit is called at the end of the initialization of the S2P configuration Wizard.
                 * @example <caption>Set a default field value</caption>
                 * Wizard.OnHTMLScriptEnd = function ()
                 * {
                 *   var myTextField_defaultValue = "This is the default";
                 *   if(Data.IsNullOrEmpty("Z_myTextField__"))
                 *   {
                 *     Data.SetValue("Z_myTextField__", myTextField_defaultValue);
                 *   }
                 * }
                 */
                Wizard.OnHTMLScriptEnd = function () {
                };
                /**
                 * @name Lib.AP.Customization.Wizard.CustomizeOCRJsonSettings
                 * @description
                 * Allows you to customize OCR JSON settings before they are saved.
                 * @param {any} json The OCR JSON settings object to be customized
                 * @return {any} The customized JSON settings object
                 * @example <caption>Add force-preprocessing parameter to the settings OCR JSON</caption>
                 * CustomizeOCRJsonSettings: function (json)
                 * {
                 *     json["force-preprocessing"] = "yes";
                 *     return json;
                 * }
                 */
                Wizard.CustomizeOCRJsonSettings = function (json) {
                };
                /**
                 * To define custom functions corresponding to business behaviors:
                 * Create a object in which Functions defined in this scope will only be accessible within this library
                 * They can be called the following way CustomHelpers.MyCustomHelper()
                 * New objects can be defined to isolate several functions linked to a feature (i.e. : VendorHelpers)
                 * @example
                 * <pre><code>
                 * var CustomHelpers =
                 * {
                 *		HandleVendorWarning: function ()
                 *		{
                 *			if (Sys.Helpers.IsEmpty(Data.GetValue("VendorNumber__"))
                 *			{
                 *				Popup.Snackbar({message: "Please select a vendor", status: "warning", timeout: "6000"});
                 *			}
                 *		}
                 * };
                 * </code></pre>
                 */
                // Uncomment here
                // var CustomHelpers =
                // {
                // };
            })(Wizard = Customization.Wizard || (Customization.Wizard = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_WIZARD_SAMPLE.js.map