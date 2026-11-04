"use strict";
var ExtractionScript;
(function (ExtractionScript) {
    var CatalogManagement = Lib.Purchasing.CatalogManagement;
    class Main {
        constructor(catalogManagementServer) {
            this.catalogManagementServer = catalogManagementServer;
        }
        async Start() {
            if (!Data.GetActionName() && !Data.GetActionType() && !!Data.GetValue("SourceRUID")) {
                Data.SetValue("NeedValidation", 0);
                Variable.SetValueAsString("CatalogManagmentSource", "inboundChannel");
                await CatalogManagement.ServerVendor.FillInfoForInboundChannelVendorUpdateRequest();
            }
            this.catalogManagementServer.Init();
            try {
                await this.catalogManagementServer.ReadCSVAndSetExtractedDataToProcess();
            }
            catch (e) {
                Log.Error(`Error in CSV extraction: ${e.message}`);
                if (e.stack) {
                    Log.Error("StackTrace : " + e.stack);
                }
                Data.SetValue("Status__", "Failed");
                Data.SetValue("State", 100);
            }
            if (this.catalogManagementServer.IsCMSubmitable()) {
                Variable.SetValueAsString("IsCMSubmitable", "true");
            }
            else {
                Variable.SetValueAsString("IsCMSubmitable", "false");
            }
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        let maxlines = parseInt(Variable.GetValueAsString("MAXLINES"));
        if (isNaN(maxlines)) {
            maxlines = CatalogManagement.maxCSVLinesSupported;
        }
        const isInternalUpdateRequest = CatalogManagement.IsInternalVendorUpdateRequest();
        const mappingVendorItem = new CatalogManagement.MappingVendor();
        const catalogManagementServerVendor = new CatalogManagement.ServerVendor(mappingVendorItem, isInternalUpdateRequest, maxlines);
        const main = new Main(catalogManagementServerVendor);
        Lib.P2P.HandleScriptError(main.Start());
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map