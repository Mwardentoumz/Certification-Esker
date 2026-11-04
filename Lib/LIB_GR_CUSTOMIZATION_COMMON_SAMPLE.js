"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_GR_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Goods Receipt scripts on common side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Good Receipt common script customization callbacks
 * @namespace Lib.GR.Customization.Common
 */
var Lib;
(function (Lib) {
    var GR;
    (function (GR) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.GR.Customization.Common.AllowOverdelivery
                 * @description Allows you to customize the reception of an item in case of an overdelivery. This user exit is called from the HTML Page script of the Goods Receipt process.
                 * By default, the Goods Receipt process does not accept the overdelivery of items. Use this user exit to allow and customize the overdelivery of items. This user exit is called for each overdelivered item in the Goods Receipt process.
                 * @since 152
                 * @param {Item} Item An Item object representing an item in the Goods Receipt process.
                 * @returns {boolean} Boolean value specifying whether overdelivery is enabled for the item.
                 * @example <caption>Allow up to 10% overdelivery for office supplies</caption>
                 * AllowOverdelivery: function(item)
                 *	{
                 *		return item.GetValue("Group__") === "OS" && (item.GetValue("ReceivedQuantity__") <= Math.ceil(1.1 * item.GetValue("OpenQuantity__")));
                 *	}
                 */
                Common.AllowOverdelivery = function (item) {
                    return false;
                };
                /**
                 * @method Lib.GR.Customization.Common.OnVerifyLastDelivery
                 * @description Allows you to customize the lastDelivery logic for an item.
                 * lastDeliveryOptions can be edited and will be taken into account in the last delivery logic of the item.
                 * This user exit is called for each item in the Goods Receipt process.
                 * @since 350
                 * @param {Item} Item An Item object representing an item in the Goods Receipt process.
                 * @param {*} lastDeliveryOptions The options already computed on our side.
                 * @returns {void}
                 * @example <caption>Mark office supplies as completed during last-delivery verification</caption>
                 * OnVerifyLastDelivery: function(item,lastDeliveryOptions)
                 *	{
                 *		if(item.GetValue("Group__") === "OS")
                 *		{
                 *			lastDeliveryOptions.completed = true
                 *		}
                 *
                 *	}
                 */
                Common.OnVerifyLastDelivery = function (item, lastDeliveryOptions) {
                };
                /**
                 * @method Lib.GR.Customization.Common.AllowBuyerToReceiveOnBehalfOfRecipient
                 * @description Allows you to enforce the application setting "AllowBuyerToReceiveOnBehalfOfRecipient" for the Purchase order process.
                 * @Example
                 * - If you return true, the "New receipt" button will be displayed on the Purchase order form for the buyer, whether he is the recipient or not, regardless of the configurator setting.
                 * - If you return false, the "New receipt" button will be hidden on the Purchase order form for the buyer if he is not the recipient, regardless of the configurator setting.
                 * - If you return null, the application setting "AllowBuyerToReceiveOnBehalfOfRecipient" will be used and the user exit will be ignored.
                 * @since 304
                 * @returns {boolean} True to allow the reception on behalf, false to forbid reception on behalf, null to use the application setting.
                 */
                Common.AllowBuyerToReceiveOnBehalfOfRecipient = function () {
                    return null;
                };
                /**
                 * @method Lib.GR.Customization.Common.CanFinalizeReceiptForItem
                 * @description Allows you to override whether a Goods Receipt can be finalized for an item.
                 * It is called for each eligible Purchase Order item when filling the Goods Receipt form.
                 * @since 365
                 * @param {Item} item The Purchase Order item being evaluated.
                 * @returns {boolean | void} True to allow finalization, false to prevent it, or void to apply the standard authorization rules.
                 * @example <caption>Prevent receipt finalization for items from company 1000</caption>
                 * CanFinalizeReceiptForItem: function(item)
                 * {
                 * 	if (item.GetValue("CompanyCode__") === "1000")
                 * 	{
                 * 		return false;
                 * 	}
                 * }
                 */
                Common.CanFinalizeReceiptForItem = function (item) {
                };
                /**
                 * @method Lib.GR.Customization.Common.OnValidateForm
                 * @since 346
                 * @description
                 * Allows you to customize the validation logic for the Goods Receipt process.
                 * This user exit is called at the start of the validation script of the process and when clicking the ConfirmDelivery button.
                 * Use this function to add additional validation rules, check business conditions, or override the default validation behavior.
                 * You can perform additional checks on received quantities, validate against business rules, or enforce custom approval workflows.
                 * @param {boolean} isFormValid - The current validation status of the form based on standard validation rules
                 * @returns {boolean|Promise<boolean>} - The updated validation status: true if form should be considered valid, false to prevent validation, or a Promise resolving to the validation status for async operations
                 *
                 * @example
                 * Common.OnValidateForm = function(isFormValid)
                 * {
                 *     return isFormValid;
                 * }
                 */
                Common.OnValidateForm = function (isFormValid) {
                    return isFormValid;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = GR.Customization || (GR.Customization = {}));
    })(GR = Lib.GR || (Lib.GR = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_GR_CUSTOMIZATION_COMMON_SAMPLE.js.map