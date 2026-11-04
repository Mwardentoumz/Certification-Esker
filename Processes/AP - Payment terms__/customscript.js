"use strict";
var CustomScript;
(function (CustomScript) {
    function setupDiscountLayout(dynamicDiscount) {
        // Static discount
        Controls.DiscountRate__.Hide(dynamicDiscount);
        Controls.DiscountPeriod__.Hide(dynamicDiscount);
        // Dynamic discount
        Controls.DiscountRate30Days__.Hide(!dynamicDiscount);
        Controls.DiscountRate30Days__.SetRequired(dynamicDiscount);
    }
    Controls.EnableDynamicDiscounting__.OnChange = function () {
        Data.SetValue("DiscountPeriod__", "");
        Data.SetValue("DiscountRate__", "");
        Data.SetValue("DiscountRate30Days__", "");
        setupDiscountLayout(this.GetValue());
    };
    function run() {
        const dynamicDiscount = Controls.EnableDynamicDiscounting__.GetValue();
        setupDiscountLayout(dynamicDiscount);
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    CustomScript.run = run;
    run();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map