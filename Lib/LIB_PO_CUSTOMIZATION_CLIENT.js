/* LIB_DEFINITION{
  "name": "LIB_PO_CUSTOMIZATION_CLIENT",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Purchase order scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
var Lib;
Sys.ExtendLib(Lib, "PO.Customization.Client", function ()
{
	var customization = {
		CustomizeLayout: function ()
		{
			async function CheckVendorScore()
			{
				await Lib.Purchasing.Vendor.UpdateVendorInternalScore(Controls.CompanyCode__.GetValue(), Controls.VendorNumber__.GetValue());
				const score = Sys.TechnicalData.GetValue("VendorInternalScore");
				const errorMessage = Language.Translate("_BadVendorInternalScoreError");
				if (Controls.TotalNetLocalCurrency__.GetValue() >= 200 && !Sys.Helpers.IsEmpty(score) && Number(score) <= 20)
				{
					Controls.CombinedVendor__.SetError(errorMessage);
					Controls.CombinedVendor__.SetInnerIcon(null);
					Controls.CombinedVendor__.SetHoverMessage("");
				}
				else if (Controls.CombinedVendor__.GetError() === errorMessage)
				{
					Controls.CombinedVendor__.SetError("");
				}
			}

			Sys.Helpers.Controls.AddEventHandler(Controls.VendorNumber__, "OnSetValue", async function ()
			{
				await CheckVendorScore();
			});
			Sys.Helpers.Controls.AddEventHandler(Controls.TotalNetLocalCurrency__, "OnSetValue", async function ()
			{
				await CheckVendorScore();
			});
		}
	};

	return customization;
});