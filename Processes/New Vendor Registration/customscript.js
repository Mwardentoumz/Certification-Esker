"use strict";
Process.SetHelpId(2561);
Controls.DataPanel.Hide(true);
Controls.SystemData.Hide(true);
ProcessInstance.SetSilentChange(true);
var Customscript;
(function (Customscript) {
    async function main() {
        try {
            const properties = await Lib.P2P.UserProperties.QueryValues(User.loginId);
            await Lib.VendorRegistration.Popup.Show({
                sourceInfo: {
                    sourceGUID: null,
                    urlParameters: null,
                    sourceCompanyCode: properties === null || properties === void 0 ? void 0 : properties.CompanyCode__
                },
                waitingControl: Controls.OpenRegistrationForm__
            });
        }
        catch (error) {
            Log.Error("Failed to get user properties", error);
            // In case of failure to get user information, open the Popup without sourceInfo
            await Lib.VendorRegistration.Popup.Show({
                waitingControl: Controls.OpenRegistrationForm__
            });
        }
    }
    Customscript.main = main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        main();
    }
})(Customscript || (Customscript = {}));
//# sourceMappingURL=customscript.js.map