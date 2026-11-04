"use strict";
var PostProcessingScript;
(function (PostProcessingScript) {
    if (Data.GetValue("Status__") === "Failed") {
        Data.SetValue("State", 200);
        // Do not archive because document has deleted=1 so it's not visible by the customer.
        Data.SetValue("ArchiveDuration", 0);
    }
})(PostProcessingScript || (PostProcessingScript = {}));
//# sourceMappingURL=postprocessingscript.js.map