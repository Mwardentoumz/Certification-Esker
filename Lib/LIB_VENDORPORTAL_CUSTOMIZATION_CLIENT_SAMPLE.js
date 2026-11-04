"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_VENDORPORTAL_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending vendor portal on client side",
  "versionable": false,
  "require": []
}*/
var Lib;
(function (Lib) {
    var VendorPortal;
    (function (VendorPortal) {
        var Customization;
        (function (Customization) {
            /**
             * @namespace Lib.VendorPortal.Customization.ConversationUI
             */
            let ConversationUI;
            (function (ConversationUI) {
                /**
                 * @method Lib.VendorPortal.Customization.ConversationUI.AddItem
                 * @description Allows you to override conversation item addition behavior.
                 * @param {IConversationUI_AddItem} data conversation item
                 * @param {IConversationUI_AddItemOption} options item options
                 * @returns {boolean} false to prevent the item to be added to the conversation
                 * @example
                 * <pre><code>
                 * OnAddItem: function (data, options)
                 * {
                 * 		if (data.Type === Lib.Purchasing.ConversationTypes.Viewed)
                 * 		{
                 * 			Log.Info("Do not notify by email for viewed customer order");
                 * 			options.notifyByEmail = false;
                 * 		}
                 * }
                 * </code></pre>
                 */
                ConversationUI.OnAddItem = function (data, options) {
                };
            })(ConversationUI = Customization.ConversationUI || (Customization.ConversationUI = {}));
        })(Customization = VendorPortal.Customization || (VendorPortal.Customization = {}));
    })(VendorPortal = Lib.VendorPortal || (Lib.VendorPortal = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_VENDORPORTAL_CUSTOMIZATION_CLIENT_SAMPLE.js.map