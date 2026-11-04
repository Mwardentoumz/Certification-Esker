"use strict";
var CustomScript;
(function (CustomScript) {
    async function Start() {
        await Sys.Parameters.GetInstance("P2P").PromisedIsReady();
        Lib.P2P.InitItemTypeControl(Controls.ItemType__);
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map