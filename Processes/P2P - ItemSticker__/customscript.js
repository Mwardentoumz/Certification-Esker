"use strict";
var CustomScript;
(function (CustomScript) {
    const nameLengthLimit = 15;
    function OnNameChange() {
        const name = Data.GetValue("Name__");
        const message = name.length > nameLengthLimit ? Language.Translate("_Warning_TooLongString", false, nameLengthLimit) : "";
        Controls.Name__.SetWarning(message);
        UpdateSticker();
    }
    function UpdateSticker() {
        const options = {
            color: Data.GetValue("Color__"),
            name: Data.GetValue("Name__")
        };
        const html = Lib.Purchasing.CatalogHelper.Sticker.GetHTML(options);
        Controls.TagsDisplay__.SetHTML(html);
        Controls.TagsDisplay__.Hide(!html);
    }
    Controls.Name__.OnChange = OnNameChange;
    Controls.Color__.OnChange = UpdateSticker;
    OnNameChange();
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map