"use strict";
var CustomScript;
(function (CustomScript) {
    function InitOperationDetailsPane() {
        Controls.OperationDetailsView__.SetView({
            tabName: "",
            viewName: "_Contract Budget Operation Details view",
            processOrTableName: "ContractSpendingOperationDetails__",
            checkProfileTab: false,
            isSystem: true,
            filterParameters: { contractNumber: Controls.ContractNumber__.GetValue() }
        });
        Controls.OperationDetailsView__.Apply();
    }
    /**
     * Initform
     */
    function InitForm() {
        ProcessInstance.SetFormWidth(1280);
        InitOperationDetailsPane();
    }
    /**
     * Start
     */
    function Start() {
        /**
         * Variables
         */
        if (Controls.ComputedRemaining__.GetValue() >= 0 || Controls.ComputedRemaining__.GetValue() == null) {
            Controls.ComputedRemaining__.RemoveStyle("text-highlight-warning");
        }
        else {
            Controls.ComputedRemaining__.AddStyle("text-highlight-warning");
        }
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    // Start custom script
    InitForm();
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map