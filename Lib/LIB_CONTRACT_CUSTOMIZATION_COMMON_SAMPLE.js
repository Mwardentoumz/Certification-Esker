"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CONTRACT_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Contract scripts on server and client side",
  "versionable": false,
  "require": []
}*/
/**
 * Package Contract Common script customization callbacks
 * @namespace Lib.Contract.Customization.Common
 */
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.Contract.Customization.Common.OnValidateForm
                 * @description Allow you to customize the validation of the contract approbation.
                 * @since 307
                 * @example
            
                    const OnValidateForm = async (isValid) => {
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
                    };
                 */
                Common.OnValidateForm = async (isValid) => {
                    return isValid;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = Contract.Customization || (Contract.Customization = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CONTRACT_CUSTOMIZATION_COMMON_SAMPLE.js.map