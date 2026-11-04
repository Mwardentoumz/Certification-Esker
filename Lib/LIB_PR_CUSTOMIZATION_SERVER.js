/**
 * @file Lib.PR.Customization.Server library: server script Purchase Requisition customization callbacks
 */

/**
 * Package Purchase Requisition server script customization callbacks
 * @namespace Lib.PR.Customization.Server
 */

/* LIB_DEFINITION{
  "name": "LIB_PR_CUSTOMIZATION_SERVER",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Purchase Requisition scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/

var Lib;
Sys.ExtendLib(Lib, "PR.Customization.Server", function ()
{
	/**
	 * @lends Lib.PR.Customization.Server
	 */
	var customization = {
		/**
		* return true if you want to bypass the buyer step of the PR (automaticaly approved)
		*/
		IsAutoCreateOrderEnabled: function ()
		{
			var triggerAuto = false;

			var table = Data.GetTable("LineItems__");
			var firstRow = table.GetItem(0);
			var vendorNumber, areSameVendors = true;
			if (firstRow)
			{
				// Use vendor at the line level if available (PAC-V2), otherwise use the one of the header (PAC-V1)
				vendorNumber = firstRow.GetValue("VendorNumber__") || Data.GetValue("VendorNumber__");
			}
			for (var i = table.GetItemCount() - 1; i > 0; i--)
			{
				var currentVendor = (table.GetItem(i).GetValue("VendorNumber__") || Data.GetValue("VendorNumber__"));
				areSameVendors = areSameVendors && (currentVendor === vendorNumber);
			}

			var totalNetAmount = Data.GetValue("TotalNetAmount__");

			Log.Info("Auto Create PO - Vendor number of the first line = ", vendorNumber);
			Log.Info("Auto Create PO - Vendors are the same on all lines ?", areSameVendors);
			Log.Info("Auto Create PO - Amount = " + totalNetAmount);

			var isCorrectVendor = vendorNumber == "3000" || vendorNumber == "100" || vendorNumber == "DES0157" || vendorNumber == "DUR0005";
			triggerAuto = areSameVendors && isCorrectVendor && totalNetAmount < 100;

			Log.Info("Auto Create PO - is set to : ", triggerAuto);
			return triggerAuto;
		},

		/**
		* This function is called when a quote is uploaded and when a vendor has been recognized
		* @param {ESKMap<string>} vendor A ESKMap<string> object representing the recognized vendor
		*/
		OnVendorRecognition: function (vendor)
		{
			Log.Info("Vendor recognized, currency= " + vendor.Currency__);
			Data.SetValue("Currency__", vendor.Currency__);
		}
	};

	return customization;
});
