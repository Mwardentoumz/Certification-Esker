/* LIB_DEFINITION{
  "name": "LIB_CONTRACT_CUSTOMIZATION_COMMON",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Contract scripts on server and client side",
  "versionable": false,
  "require": []
}*/

var Lib;
Sys.ExtendLib(Lib, "Contract.Customization.Common", function ()
{
	var customization = {
		OnValidateForm: async (isValid) =>
		{
			async function CheckVendorScore()
			{
				if (!(Data.GetValue("Version__") > 1))
				{
					await Lib.Purchasing.Vendor.UpdateVendorInternalScore(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"));
					const score = Sys.TechnicalData.GetValue("VendorInternalScore");
					const errorMessage = Language.Translate("_BadVendorInternalScoreError");
					if (!Sys.Helpers.IsEmpty(score) && Number(score) <= 20)
					{
						Data.SetError("CombinedVendor__", errorMessage);
						if (Sys.ScriptInfo.IsClient())
						{
							Controls.CombinedVendor__.SetInnerIcon(null);
							Controls.CombinedVendor__.SetHoverMessage("");
						}
						return false;
					}
					else if (Sys.ScriptInfo.IsClient() && Controls.CombinedVendor__.GetError() === errorMessage)
					{
						Controls.CombinedVendor__.SetError("");
					}
				}
				return true;
			}

			const isVendorScoreValid = await CheckVendorScore();
			return isValid && isVendorScoreValid;
		}
	};

	return customization;
});
