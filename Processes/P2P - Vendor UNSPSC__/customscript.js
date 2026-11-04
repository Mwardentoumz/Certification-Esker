"use strict";
var CustomScript;
(function (CustomScript) {
    async function InitUNSPSC() {
        async function FillUNSPSC() {
            if (Controls.UNSPSC__.GetValue()) {
                const filter = Lib.P2P.UNSPSC.BuildLdapFilter([Controls.UNSPSC__.GetValue()]);
                const results = await Sys.GenericAPI.PromisedQuery({
                    table: "UNSPSC",
                    filter: filter.toString(),
                    attributes: ["code", "title", "description"]
                });
                if (results.length > 0) {
                    Controls.UNSPSCTitle__.SetValue(results[0].title);
                    Controls.UNSPSCDescription__.SetValue(results[0].description);
                }
            }
        }
        function OnSelectItem(item) {
            Controls.UNSPSCTitle__.SetValue(item.GetValue("title"));
            Controls.UNSPSCDescription__.SetValue(item.GetValue("description"));
        }
        function OnUnknownValue() {
            Controls.UNSPSCTitle__.SetValue("");
            Controls.UNSPSCDescription__.SetValue("");
        }
        await Lib.P2P.UNSPSC.CheckUNSPSCExistsInUserLanguage();
        Controls.UNSPSC__.SetAttributes("description");
        Controls.UNSPSC__.SetSortOrder("ASC");
        Controls.UNSPSC__.SetFilter(Lib.P2P.UNSPSC.GetLanguageFilter().toString());
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.UNSPSC__, OnSelectItem, OnUnknownValue, OnUnknownValue);
        await FillUNSPSC();
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    function Start() {
        Controls.UNSPSC__.Wait(true);
        void InitUNSPSC()
            .Finally(() => Controls.UNSPSC__.Wait(false));
    }
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map