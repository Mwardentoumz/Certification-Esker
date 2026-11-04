"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line no-redeclare
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VENDORPORTAL_HTMLSCRIPTS_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "Client Script Vendor Portal AP customization",
  "versionable": false,
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @namespace Lib.AP.Customization.VendorPortal.HTMLScripts
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var VendorPortal;
            (function (VendorPortal) {
                var HTMLScripts;
                (function (HTMLScripts) {
                    /**
                     * @method Lib.AP.Customization.VendorPortal.HTMLScripts.OnHTMLScriptEnd
                     * @since 174
                     * @description
                     * This user exit is called at the end of the HTML page script of the Vendor Portal Customer Invoice.
                     * Allows you to customize layout settings of the Vendor invoice process.
                     * If you need to customize callback functions associated with control events, refer to HTML page script API: Control events.
                     *
                     * This example allows you to customize different options in conversations, for example :
                     *  - the list of recipient for the conversation with the option "recipientList"
                     *  - the email template to use with the option "emailTemplate"
                     *  - custom tags with the option "emailCustomTags"
                     * @example
                     * HTMLScripts.OnHTMLScriptEnd = function ()
                     * {
                     *	 var options =
                     *	 {
                     *		ignoreIfExists: false,
                     *		notifyByEmail: true,
                     *		notifyAllUsersInGroup: false,
                     *		recipientList: ["cfoprocess.wegeneren@esker.com","buyerprocess.wegeneren@esker.com"],
                     *		emailTemplate: "Conversation_MissedItem_Custom.htm",
                     *		emailCustomTags: {
                     *			DocumentNumber: Data.GetValue("Invoice_number__")
                     * 		},
                     *		externalContributors: [
                     *		{
                     *			emailAddress: "prunelle@example.com",
                     *			emailSubject: "email to Prunelle",
                     *			emailTemplate: "notifPrunelle.htm"
                     *		},
                     *		{
                     *			emailAddress: "test2@example.com"
                     *		}]
                     *	};
                     *	Controls.ConversationUI__.SetOptions(options);
                     * }
                     */
                    HTMLScripts.OnHTMLScriptEnd = function () {
                    };
                    /**
                     * @method Lib.AP.Customization.VendorPortal.HTMLScripts.OnCustomerOrderHTMLScriptEnd
                     * @since 222
                     * @description
                     * This user exit is called at the end of the HTML page script of the Vendor Portal Customer Order.
                     * @example
                     * HTMLScripts.OnCustomerOrderHTMLScriptEnd = function ()
                     * {
                     *	// Display a button that creates a new process
                     *	Controls.ServiceEntrySheet__.Hide(false);
                     *	Controls.ServiceEntrySheet__.SetDisabled(false);
                     *	Controls.ServiceEntrySheet__.OnClick = function ()
                     *	{
                     *		Process.CreateProcessInstance("Service entry sheet");
                     *	}
                     * }
                     */
                    HTMLScripts.OnCustomerOrderHTMLScriptEnd = function () {
                    };
                })(HTMLScripts = VendorPortal.HTMLScripts || (VendorPortal.HTMLScripts = {}));
            })(VendorPortal = Customization.VendorPortal || (Customization.VendorPortal = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_VENDORPORTAL_HTMLSCRIPTS_SAMPLE.js.map