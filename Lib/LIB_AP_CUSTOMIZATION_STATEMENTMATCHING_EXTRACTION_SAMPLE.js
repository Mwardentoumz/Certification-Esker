"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_EXTRACTION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Extraction script AP vendor statement customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP extraction script customization callbacks
 * @namespace Lib.AP.Customization.StatementMatching.Extraction
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var StatementMatching;
            (function (StatementMatching) {
                var Extraction;
                (function (Extraction) {
                    /**
                     * @namespace Lib.AP.Customization.StatementMatching.Extraction.CustomUserExits
                     * @description
                     * Allows you to define custom user exists added for this customer
                     * Functions defined in this scope will be accessible from outside this library
                     * They can be called the following way Lib.AP.Customization.StatementMatching.Extraction.CustomUserExits.OnValidateInvoice(invoiceNumber)
                     * @example
                     * <pre><code>
                     * CustomUserExits:
                     * {
                     *		OnValidateInvoice: function(invoiceNumber)
                     *		{
                     *			// Fill Company code and vendor number
                     *			if (!Sys.Helpers.IsEmpty(Data.GetValue("VendorNumber__")))
                     *			{
                     *				ExtractionHelper.FillCompanyCodeAndVendorNumber();
                     *			}
                     *		}
                     * },
                     * </code></pre>
                     */
                    Extraction.CustomUserExits = {};
                    /**
                     * @method Lib.AP.Customization.StatementMatching.Extraction.OnExtractionScriptBegin
                     * @description
                     * Allows you to customize extraction settings. This user exit is called at the beginning of the extraction script of the Vendor statement reconciliation process.
                     * @example
                     * <pre><code>
                     * OnExtractionScriptBegin: function ()
                     * {
                     * 	// Run custom code to determine the company code,
                     *  // so the rest of the processing can use the proper settings
                     * 	const firstRecordRuidEx = Data.GetValue("SourceRUID");
                     *	if (firstRecordRuidEx.indexOf("ISM") === 0)
                     *	{
                     *		// Fetch email record and retrieve sender address and recipient address
                     *		const senderAddress = "myCompany@us.acme.com"; // ...
                     *		if (senderAddress.indexOf("@us") > 0)
                     *		{
                     *			Data.SetValue("CompanyCode__", "US01");
                     *		}
                     *		else if (senderAddress.indexOf("@fr") > 0)
                     *		{
                     *			Data.SetValue("CompanyCode__", "FR01");
                     *		}
                     *	 }
                     * }
                     * </code></pre>
                     */
                    Extraction.OnExtractionScriptBegin = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.StatementMatching.Extraction.OnExtractionScriptEnd
                     * @description
                     * Allows you to customize extraction settings. This user exit is called at the end of the extraction script of the Vendor statement reconciliation process.
                     * @example
                     * <pre><code>
                     * OnExtractionScriptEnd: function ()
                     * {
                     * 	// Initialize statement date with current date
                     * 	Data.SetValue("StatementDate__", Helpers.Date.InDocumentTimezone(new Date()));
                     * }
                     * </code></pre>
                     */
                    Extraction.OnExtractionScriptEnd = function () {
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
                     *		InitValues: function()
                     *		{
                     *			Data.SetValue("StatementDate__", new Date());
                     *		}
                     * };
                     * </code></pre>
                     */
                    // Uncomment here
                    // var CustomHelpers =
                    // {
                    // };
                })(Extraction = StatementMatching.Extraction || (StatementMatching.Extraction = {}));
            })(StatementMatching = Customization.StatementMatching || (Customization.StatementMatching = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_EXTRACTION_SAMPLE.js.map