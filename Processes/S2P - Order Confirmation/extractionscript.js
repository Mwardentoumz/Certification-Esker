"use strict";
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ExtractionScript;
(function (ExtractionScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    class Main {
        constructor() {
            this.logger = new NamedLog({ namespace: "Order Confirmation" });
        }
        async Start() {
            const currentName = Data.GetActionName();
            const currentAction = Data.GetActionType();
            this.logger.Info("-- Order Confirmation Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
            await Lib.Purchasing.OC.POData.InitConfirmedFieldsDefinition();
            // currentAction === "reprocess": manually load doc to process
            if (!currentAction && Lib.Purchasing.OC.IsCreatedFromPortal()) {
                await Lib.Purchasing.OC.InitFormFromPortal();
            }
            else if (!currentAction && Lib.P2P.InboundChannel.IsCreatedFromInboundChannel()) {
                await Lib.Purchasing.OC.InitFormFromInboundEmail();
            }
            else if (!currentAction || currentAction === "reprocess") {
                await Lib.Purchasing.OC.InitFormFromClientSide();
            }
        }
    }
    ExtractionScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        Lib.P2P.HandleScriptError(main.Start());
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map