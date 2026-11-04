"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_GR_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Goods Receipt scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Sys/SYS_HELPERS_DATA",
    "Sys/SYS_HELPERS_DATE",
    "Sys/Sys_GenericAPI_Client"
  ]
}*/
/**
 * Package Good Receipt client script customization callbacks
 * @namespace Lib.GR.Customization.Client
 */
var Lib;
(function (Lib) {
    var GR;
    (function (GR) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.GR.Customization.Client.CustomizeLayout
                 * @description Allows you to customize the Goods Receipt process form. This user exit is called from the HTML page script of the Goods Receipt process, after loading the form.
                 * 		This user exit is typically used to customize:
                 * 			Objects from the included script libraries.
                 * 			Objects from the HTML page script.
                 * @since 127
                 * @example
                 * The following user exit hides the z_ProjectCode__ field.
                 * <pre><code>
                 *	CustomiseLayout: function ()
                 *	{
                 *		Controls.LineItems__.z_ProjectCode__.Hide(true);
                 *		Controls.LineItems__.z_ProjectCode__.SetReadOnly(true);
                 *	}
                 * </code></pre>
                 *
                 */
                Client.CustomizeLayout = function () {
                };
                /**
                 * @method Lib.GR.Customization.Client.IsDeliveryDateValid
                 * @description Asynchronously checks if the delivery date is valid. This user exit is called from the HTML page script when the delivery date changes and when the form is submitted.
                 * @param {Date} deliveryDate The delivery date to check.
                 * Errors on fields should be set and reset via the user exit, as it won't be managed by standard code if the UE is active
                 * @returns {boolean} True if the delivery date is valid, false otherwise.
                 * @since 329
                 * @example
                 * The following UE allows item receipt only if
                 *	- the GR delivery date is in the past or
                 *	- the item is amount-based, has the item category "Services", and the GR delivery date matches its requested receipt date
                 * <pre><code>
                 *
                 *export const IsDeliveryDateValid = async function (date: Date): Promise<boolean>
                 *{
                 *	let dateIsValid = true;
                 *	let lineItems = Data.GetTable("LineItems__");
                 *	if (Sys.Helpers.Date.CompareDateToToday(date) > 0)
                 *	{
                 *		let orderNumber = Data.GetValue("OrderNumber__");
                 *		let tableAsObjectArray = Sys.Helpers.Data.GetTableAsObjectArray(lineItems, ["LineNumber__", "ItemType__", "ReceivedQuantity__", "NetAmount__", "RequestedDeliveryDate__"]);
                 *		let map_DateIsValid = {}
                 *		for (const item of tableAsObjectArray)
                 *		{
                 *			//Item with no quantity to received are considered as valid
                 *			map_DateIsValid[item["LineNumber__"].toString()] = (item.NetAmount__ == 0 || item.NetAmount__ == null) && (item.ReceivedQuantity__ == 0 || item.ReceivedQuantity__ == null);
                 *		}
                 *
                 *		//Amount based item with item category equal to "Services" can be received in advance on their requested delivery date
                 *		let itemToQuery = tableAsObjectArray
                 *			.filter((item) =>
                 *				item.ItemType__ === "AmountBased"
                 *				&& item.NetAmount__ > 0
                 *				&& item.RequestedDeliveryDate__.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0) === 0)
                 *			.map((item) => item.LineNumber__.toString());
                 *		if (itemToQuery.length > 0)
                 *		{
                 *			const POItemsQueryOptions = {
                 *				table: "CDLNAME#Purchase order V2.LineItems__",
                 *			attributes: ["OrderNumber__", "Line_LineItemNumber__", "Line_SupplyTypeId__"],
                 *			filter: Sys.Helpers.LdapUtil.FilterAnd(
                 *					Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber),
                 *					Sys.Helpers.LdapUtil.FilterIn("Line_LineItemNumber__", itemToQuery)
                 *				),
                 *				maxRecords: "NO_LIMIT",
                 *			};
                 *			await Sys.GenericAPI.PromisedQuery(POItemsQueryOptions)
                 *				.then((result) =>
                 *				{
                 *					return result.forEach(
                 *						(poLine) =>
                 *							poLine.Line_SupplyTypeId__.toLowerCase() === "4" ? map_DateIsValid[poLine.Line_LineItemNumber__] = true : map_DateIsValid[poLine.Line_LineItemNumber__] = false);
                 *				});
                 *		}
                 *		Log.Info("[Lib.GR.Customization.Client.IsDeliveryDateValid]" + JSON.stringify(map_DateIsValid));
                 *		dateIsValid = Object.values(map_DateIsValid).every((value) => value === true);
                 *	}
                 *
                 *	if (dateIsValid)
                 *	{
                 *		// Reset the error message if the date is valid
                 *		Data.SetError("DeliveryDate__", "");
                 *	}
                 *	else
                 *	{
                 *		// Set the error message if the date is invalid
                 *		Data.SetError("DeliveryDate__", "Only services items can be received in advance on their requested delivery date.");
                 *	}
                 *	return dateIsValid;
                 *};
                 * </code></pre>
                 *
                 */
                Client.IsDeliveryDateValid = async function (date) {
                    return true;
                };
                /**
                 * @method Lib.GR.Customization.Client.DialogGRCancelCustomization
                 * @description Allows you to customize the confirmation popup displayed when the user cancels a Goods Receipt.
                 * 		To keep the application upgradable, store the entered values into process variables instead of modifying the Goods Receipt controls.
                 * @since 360
                 * @return {DialogGRCancelCustomizationReturn} - The returned object
                 * @example
                 * <pre><code>
                 * DialogGRCancelCustomization: function ()
                 * {
                 *	return {
                 *		FillGRCancelPopup: function (dialog)
                 *		{
                 *			dialog.AddText("ctrl_CancelReason", "_Cancel reason", 400);
                 *		},
                 *		CommitGRCancelPopup: function (dialog)
                 *		{
                 *			// The returned object is transmitted to the "Goods receipt canceler" process
                 *			// and readable server-side (e.g. in OnBeforeCallBapi) via Variable.GetValueAsString.
                 *			return {
                 *				z_CancelReason: dialog.GetControl("ctrl_CancelReason").GetValue()
                 *			};
                 *		}
                 *	};
                 * }
                 * </code></pre>
                 */
                Client.DialogGRCancelCustomization = function () {
                    return {
                        /**
                         * @method Lib.GR.Customization.Client.DialogGRCancelCustomization.FillGRCancelPopup
                         * @description Called once the popup is instantiated. Create and initialize the custom controls to display inside the popup.
                         * @since 360
                         * @param {Dialog} dialog The instantiated Dialog object. Use it to add controls to the popup.
                         */
                        FillGRCancelPopup: function (dialog) {
                        },
                        /**
                         * @method Lib.GR.Customization.Client.DialogGRCancelCustomization.ValidateGRCancelPopup
                         * @description Called before CommitGRCancelPopup to validate the user input.
                         * 		Note: this callback runs in addition to the standard validation, which is executed first. In particular, when the cancellation comment is configured as required, the standard "This field is required!" check runs before this callback, so ValidateGRCancelPopup cannot make the standard comment field non-required.
                         * @since 360
                         * @param {Dialog} dialog The Dialog object being validated.
                         * @returns {boolean} true to proceed with the Commit action, false to keep the popup open for corrections.
                         */
                        ValidateGRCancelPopup: function (dialog) {
                            return true;
                        },
                        /**
                         * @method Lib.GR.Customization.Client.DialogGRCancelCustomization.CommitGRCancelPopup
                         * @description Called when the user confirms the popup.
                         * 		Since 361, it can optionally return a set of external variables (name/value pairs) to transmit to the "Goods receipt canceler" process. These variables are then available server-side (for instance in the OnBeforeCallBapi user exit) through Variable.GetValueAsString. The variable names are free (the "z_" prefix is only a convention for persistent process variables). Return nothing to transmit no extra variable.
                         * @since 360
                         * @param {Dialog} dialog The Dialog object from which OK was clicked.
                         * @returns {Object} [Optional] An object whose keys are the external variable names and values are their string values. (since 361)
                         * @example
                         * <pre><code>
                         *	CommitGRCancelPopup: function (dialog)
                         *	{
                         *		return {
                         *			z_CancelReason: dialog.GetControl("ctrl_CancelReason").GetValue()
                         *		};
                         *	}
                         * </code></pre>
                         */
                        CommitGRCancelPopup: function (dialog) {
                        },
                        /**
                         * @method Lib.GR.Customization.Client.DialogGRCancelCustomization.HandleGRCancelPopup
                         * @description Called to handle the events (OnClick, OnChange, ...) not handled by the other callbacks.
                         * @since 360
                         * @param {Dialog} dialog The Dialog object on which the event originates.
                         * @param {string} tabId Always null, the popup has no tabs.
                         * @param {string} event The event that triggered the callback.
                         * @param {Control} control The Control object from which the event originates.
                         * @param {Object} param1 Extra parameter forwarded from the original event callback, if any.
                         * @param {Object} param2 Extra parameter forwarded from the original event callback, if any.
                         */
                        HandleGRCancelPopup: function (dialog, tabId, event, control, param1, param2) {
                        }
                    };
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = GR.Customization || (GR.Customization = {}));
    })(GR = Lib.GR || (Lib.GR = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_GR_CUSTOMIZATION_CLIENT_SAMPLE.js.map