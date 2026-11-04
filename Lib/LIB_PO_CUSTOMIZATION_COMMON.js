/* LIB_DEFINITION{
  "name": "LIB_PO_CUSTOMIZATION_COMMON",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Purchase Order scripts on client and server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
var Lib;
Sys.ExtendLib(Lib, "PO.Customization.Common", function ()
{
	return {
		OnValidateForm: async function (isFormValid)
		{
			async function CheckVendorScore()
			{
				await Lib.Purchasing.Vendor.UpdateVendorInternalScore(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"));
				const score = Sys.TechnicalData.GetValue("VendorInternalScore");
				const errorMessage = Language.Translate("_BadVendorInternalScoreError");
				if (Data.GetValue("TotalNetLocalCurrency__") >= 200 && !Sys.Helpers.IsEmpty(score) && Number(score) <= 20)
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
				return true;
			}

			const isVendorScoreValid = await CheckVendorScore();
			return isFormValid && isVendorScoreValid;
		}
	};
});
