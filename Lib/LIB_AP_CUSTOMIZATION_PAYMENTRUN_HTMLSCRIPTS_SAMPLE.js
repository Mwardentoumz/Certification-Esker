"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_PAYMENTRUN_HTMLSCRIPTS_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "AP payment run process HTML (custom script) customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * AP payment run process HTML (custom script) customization callbacks.
 * @namespace Lib.AP.Customization.PaymentRun.HTMLScripts
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var PaymentRun;
            (function (PaymentRun) {
                var HTMLScripts;
                (function (HTMLScripts) {
                    /**
                     * @method Lib.AP.Customization.PaymentRun.HTMLScripts.OnHTMLScriptEndSync
                     * @since 309
                     * @description
                     * This user exit is called at the end of synchronous part of the payment run process, before loading the selected invoices.
                     * Useful to overload Controls events and avoid asynchronous issue.
                     * @example
                     * HTMLScripts.OnHTMLScriptEndSync = function ()
                     * {
                     *		const isNewPaymentRun = [Lib.AP.PaymentRunStatus.New, Lib.AP.PaymentRunStatus.ToVerify].includes(Data.GetValue("Status__"));
                     *		Controls.Z_CustomField__.SetReadOnly(!isNewPaymentRun);
                     *		Controls.Z_CustomField__.SetRequired(isNewPaymentRun);
                     *		Controls.Z_CustomField__.OnChange = function ()
                     *		{
                     *			Data.SetValue("Z_CustomField2__", this.GetValue());
                     *		};
                     * }
                     */
                    HTMLScripts.OnHTMLScriptEndSync = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.PaymentRun.HTMLScripts.OnHTMLScriptEnd
                     * @since 309
                     * @description
                     * This user exit is called at the end of asynchronous part of the payment run process, after loading the selected invoices and checking for errors.
                     * Allows you to customize the layout using information from the invoices.
                     * Caution: this user exit is called asynchronously.
                     * Please implement the OnHTMLScriptEndSync User Exit if you need to define Controls events.
                     * @example
                     * HTMLScripts.OnHTMLScriptEnd = function ()
                     * {
                     *		const firstInvoice = Controls.LineItems__.GetItem(0);
                     *		if (firstInvoice && firstInvoice.GetValue("CompanyCode__") && firstInvoice.GetValue("VendorNumber__"))
                     *		{
                     *			Controls.Z_CustomField__.SetValue(firstInvoice.GetValue("CompanyCode__") + firstInvoice.GetValue("VendorNumber__"));
                     *		}
                     * }
                     */
                    HTMLScripts.OnHTMLScriptEnd = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.PaymentRun.HTMLScripts.CustomizePopupCommentConfig
                     * @since 324
                     * @description
                     * Allows to customize the configuration used to configure the popup comment
                     * @param {Lib.P2P.Customization.PopupCommentConfig} conf The configuration of pop up comment
                     * @returns {Lib.P2P.Customization.PopupCommentConfig} The configuration of pop up comment customized
                     * @example
                     * HTMLScripts.CustomizePopupCommentConfig = function(conf)
                     * {
                     *		conf.commentRequired = true;
                     *		return conf;
                     * }
                     */
                    HTMLScripts.CustomizePopupCommentConfig = function (conf) {
                        return conf;
                    };
                    /**
                     * @method Lib.AP.Customization.PaymentRun.HTMLScripts.GetAdditionalInvoiceAttributesToRetrieve
                     * @since 356
                     * @description
                     * Allows you to declare additional vendor invoice attributes to query when loading line items in the Payment run process.
                     * Use this user exit when the vendor invoice field name and the Payment run line-item field name are identical.
                     * @returns {string[]} The additional invoice attributes to retrieve
                     * @example
                     * HTMLScripts.GetAdditionalInvoiceAttributesToRetrieve = function ()
                     * {
                     *		return ["Z_BranchCode__", "Z_RegionCode__"];
                     * }
                     */
                    HTMLScripts.GetAdditionalInvoiceAttributesToRetrieve = function () {
                    };
                })(HTMLScripts = PaymentRun.HTMLScripts || (PaymentRun.HTMLScripts = {}));
            })(PaymentRun = Customization.PaymentRun || (Customization.PaymentRun = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_PAYMENTRUN_HTMLSCRIPTS_SAMPLE.js.map