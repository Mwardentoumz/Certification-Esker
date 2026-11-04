/* LIB_DEFINITION{
  "name": "LIB_CONTRACT_CUSTOMIZATION_CLIENT",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Contract scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/

var Lib;
Sys.ExtendLib(Lib, "Contract.Customization.Client", function ()
{
	var customization = {
		CustomizeLayout: function ()
		{
			async function CheckVendorScore()
			{
				if (!(Controls.Version__.GetValue() > 1))
				{
					await Lib.Purchasing.Vendor.UpdateVendorInternalScore(Controls.CompanyCode__.GetValue(), Controls.VendorNumber__.GetValue());
					const score = Sys.TechnicalData.GetValue("VendorInternalScore");
					const errorMessage = Language.Translate("_BadVendorInternalScoreError");
					if (!Sys.Helpers.IsEmpty(score) && Number(score) < 40)
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
			}

			Sys.Helpers.Controls.AddEventHandler(Controls.VendorNumber__, "OnSetValue", async function ()
			{
				await CheckVendorScore();
			});
		},

		GetContractType: function (contractNumber, vendorNumber)
		{
			switch (vendorNumber)
			{
				case "AdamMat60102":
					return "maintenance";
				default:
					return null;
			}
		}
	};

	return customization;
});
