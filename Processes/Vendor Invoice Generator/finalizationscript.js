"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Finalization;
(function (Finalization) {
    function Main() {
        if (!Data.GetValue("VendorInvoice__")) {
            Process.Exit(200, "Vendor invoice process not created");
        }
    }
    Finalization.Main = Main;
    Main();
})(Finalization || (Finalization = {}));
//# sourceMappingURL=finalizationscript.js.map