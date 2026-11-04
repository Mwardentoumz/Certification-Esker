"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_VENDORPORTAL_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Purchase Requisition scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Vendor Portal server scripts customization callbacks
 * @namespace Lib.VendorPortal.Customization
 */
var Lib;
(function (Lib) {
    var VendorPortal;
    (function (VendorPortal) {
        var Customization;
        (function (Customization) {
            /**
             * @method Lib.VendorPortal.Customization.OnSendVendorNotification
             * @description Allows you to override email options or deactivate vendor notifications sending.
             * @param {Sys.EmailNotification.SendEmailNotificationWithUserIdOptions} emailOptions Notification email options which can be modified
             * @returns {boolean} false, to deactivate email sending.
             * @example
             * <pre><code>
             * OnSendVendorNotification: function (emailOptions)
             * {
             * 		if (emailOptions.subject.key == "_Customer invoice received" )
             *		{
             *			// Deactivate vendor notification for new invoices
             *			return false;
             *		}
             * 		else if (emailOptions.subject.key == "_Customer invoice rejected")
             *		{
             *			// Add a custom tag to be used in a custom email template for rejected invoices
             *			emailOptions.template = "Custom_NewInvoice_XX.htm";
             *			emailOptions.customTags.AdditionalNote = Lib.AP.VendorPortal.GetCurrentUser().GetVars().GetValue_String("AdditionalField1", 0);
             *		}
             * }
             * </code></pre>
             */
            Customization.OnSendVendorNotification = function (emailOptions) {
            };
            /**
             * @method Lib.VendorPortal.Customization.OnSendVendorConversationNotification
             * @description Allows you to override email options or deactivate vendor notifications sending for the conversation panel.
             * @param {string} msg The message of the notification.
             * @param {string} type Category of the message, in the form of a number. Establishes a prior convention to use a set of values for this field.
             * @returns {boolean} false, to deactivate email sending.
             * @example
             * <pre><code>
             * OnSendVendorConversationNotification: function (type)
             * {
             * 		if (type == "20" )
             *		{
             *			// Deactivate vendor notification for new receiption
             *			return false;
             *		}
             * }
             * </code></pre>
             */
            Customization.OnSendVendorConversationNotification = function (type) {
            };
            /**
             * @method Lib.VendorPortal.Customization.GetReplacedContractDocumentName
             * @description Allows you to customize the name of the contract document when it is replaced.
             * @param documentName The original document name.
             * @param replacementNumber The total number of the replacement done by the supplier.
             * @param extension The extension of the document.
             * @returns The final document name.
             * @example
             * <pre><code>
             * GetReplacedContractDocumentName: function (documentName, replacementNumber, extension)
             * {
             * 		return documentName + "_replaced_" + replacementNumber + extension;
             * }
             * </code></pre>
             */
            Customization.GetReplacedContractDocumentName = function (documentName, replacementNumber, extension) {
                return null;
            };
            /**
             * @method Lib.VendorPortal.Customization.GetRevisedContractDocumentName
             * @description Allows you to customize the name of the contract document when it is revised.
             * @param documentName The original document name.
             * @param replacementNumber The total number of the replacement done by the supplier.
             * @param extension The extension of the document.
             * @returns The final document name.
             * @example
             * <pre><code>
             * GetRevisedContractDocumentName: function (documentName, replacementNumber, extension)
             * {
             * 		return documentName + "_revised_" + replacementNumber + extension;
             * }
             * </code></pre>
             */
            Customization.GetRevisedContractDocumentName = function (documentName, replacementNumber, extension) {
                return null;
            };
        })(Customization = VendorPortal.Customization || (VendorPortal.Customization = {}));
    })(VendorPortal = Lib.VendorPortal || (Lib.VendorPortal = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VENDORPORTAL_CUSTOMIZATION_SERVER_SAMPLE.js.map