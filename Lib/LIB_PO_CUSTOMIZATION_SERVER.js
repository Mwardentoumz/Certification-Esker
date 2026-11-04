/**
 * @file Lib.PO.Customization.Server library: server script Purchase Order customization callbacks
 */

/**
 * Package Purchase Order Server script customization callbacks
 * @namespace Lib.PO.Customization.Server
 */

/* LIB_DEFINITION{
  "name": "LIB_PO_CUSTOMIZATION_SERVER",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Purchase Order scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/

var Lib;
Sys.ExtendLib(Lib, "PO.Customization.Server", function ()
{
	/**
	 * @lends Lib.PO.Customization.Server
	 */
	var customization = {
		/**
		 * @typedef {Object} IsAutoSendOrderEnabledReturn Use the following object if you want to customize some fields before sending automatically the PO :
		 * @property {string} EmailNotificationOptions: can be "SendToVendor", "DontSend" [Optional]
		 * @property {string} VendorEmail: Email of the vendor [Optional, used only when EmailNotificationOptions is set to "SendToVendor"]
		 * @property {string} VendorLogin: Login of the vendor [Optional, used only when EmailNotificationOptions is set to "SendToVendor"]
		 * @property {string} BuyerComment: Buyer comment ("Additional message" field) [Optional, used only when EmailNotificationOptions is set to "SendToVendor"]
		 * @property {number} PaymentAmount: Down payment amount [Optional] (In case of down payment, either PaymentAmount or PaymentPercent should be set, the other one is automatically computed)
		 * @property {number} PaymentPercent: Down payment percentage [Optional]
		 */
		/**
		 * Return true if you want to send automatically the PO
		 * Return an object if you want to customize some fields before sending automatically the PO
		 * Return null or false, if you don't want to send the PO automatically
		 *
		 * @returns {boolean} Set to 'true', the PO will be sent automatically with the default values (as if the buyer clicked on "Send" button without modifying anything).
		 * @returns {IsAutoSendOrderEnabledReturn}
		 *					  NOTE : If these attributes are not set, the default values of the fields of the form will be used.
		 *					  NOTE : If the object is empty, then auto send PO will be enabled as if it was set to 'true'.
		 */
		IsAutoSendOrderEnabled: function ()
		{
			var triggerAuto = false;
			var vendorNumber = Data.GetValue("VendorNumber__");
			var totalNetAmount = Data.GetValue("TotalNetAmount__");

			Log.Info("Auto Send PO - Vendor number = ", vendorNumber);
			Log.Info("Auto Send PO - Amount = " + totalNetAmount);

			var isCorrectVendor = vendorNumber == "3000" || vendorNumber == "100" || vendorNumber == "DES0157" || vendorNumber == "DUR0005";
			triggerAuto = isCorrectVendor && totalNetAmount < 100;

			Log.Info("Auto Send PO - is set to : ", triggerAuto);
			return triggerAuto;
		},

		/**
		 * @typedef {Object} IsAutoReceiveOrderEnabledReturn Fields which are possible to include are the following :
		 * @property {date}	DeliveryDate: Delivery date of the good receipt [Optional]
		 * @property {string}	DeliveryNote: Delivery note of the good receipt [Optional]
		 * @property {string}	Comment: Comment regarding the good receipt		[Optional]
		 */
		/**
		 * Return an object with Good Receipt fields. You can specify them up to your neeed.
		 * By default, if there is no boolean or object specified, the auto receive order will be disable.
		 *
		 * @returns {boolean} Set to 'true', the good receipt form will be created automatically which will directly mark the PO as 'Received'.
		 * @returns {IsAutoReceiveOrderEnabled}  
		 *					  NOTE : If the object is empty, then auto receive order will be enable as it was set to 'true'.
		 */
		IsAutoReceiveOrderEnabled: function ()
		{
			/*
			var res = {};
			res.DeliveryDate = new Date();
			res.Comment = "Automatic delivery";
			return res;
			*/
			return false;
		},
		OnAddLine: function (manager, bapi, item, poItem, poItemx, poAccount, poAccountx, sched, schedx, poline)
		{
			var materialNumber = item.GetValue("ItemNumber__");
			var CompanyCode = Data.GetValue("CompanyCode__");
			if (CompanyCode === "2200" && (materialNumber === "REDD1005" || materialNumber === "LT1764EQ#PBF"))
			{
				poItem.SetValue("EMATERIAL", materialNumber);
				poItemx.SetValue("EMATERIAL", "X");

				poline["PurchasingMaterial__"] = materialNumber;
			}
		}
	};

	return customization;
});
