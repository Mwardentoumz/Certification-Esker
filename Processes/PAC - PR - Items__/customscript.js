"use strict";
var CustomScript;
(function (CustomScript) {
    function HideLegacyFields() {
        const deprecatedFields = [
            "QuantityTakenFromStock__",
            "AmountTakenFromStock__",
        ];
        for (let deprecatedField of deprecatedFields) {
            if (Controls[deprecatedField]) {
                Controls[deprecatedField].Hide(true);
            }
        }
    }
    async function Start() {
        HideLegacyFields();
        await Sys.Parameters.GetInstance("P2P").PromisedIsReady();
        Lib.P2P.InitItemTypeControl(Controls.ItemType__);
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map