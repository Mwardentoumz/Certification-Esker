"use strict";
var CustomScript;
(function (CustomScript) {
    Controls.UpgradeDate__.SetValue(Data.GetValue("CreationDateTime") || new Date());
    if (!Controls.MainAccountId2__.GetValue()) {
        Controls.MainAccountId2__.SetValue(User.shortMainAccountId);
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map