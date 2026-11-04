"use strict";
var extractionscript;
(function (extractionscript) {
    let currentName = Data.GetActionName();
    let currentAction = Data.GetActionType();
    Log.Info(`-- ASN Extraction Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}'`);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // MAIN
    function FillFormFromcXML() {
        Lib.Shipping.CXML.ExtractInformation(0);
    }
    function FillFromVendorTechnicalData() {
        Lib.Shipping.Vendor.FillFromTechnicalData();
        Lib.Shipping.Validation.SendNotificationsToRecipients();
    }
    function FillFormFromOther() {
        // TODO: First reco
        // TODO: Complete the form after autolearning (Ex. ItemPONumber__ when PONumber is on the incoming document header)
        if (currentAction !== "reprocess" && Lib.Shipping.InboundEmailProcessing.IsCreatedFromInboundEmail()) {
            Lib.Shipping.InboundEmailProcessing.DoExtraction();
        }
    }
    function Run() {
        let sourceType = "Other";
        const orderNumber = Variable.GetValueAsString("OrderNumber__");
        if (orderNumber) {
            sourceType = "Portal";
        }
        else if (Attach.GetNbAttach() > 0) {
            if (Attach.GetExtension(0).toLowerCase() == ".xml") {
                sourceType = "cXML";
            }
        }
        Data.SetValue("ASNSourceType__", sourceType);
        switch (sourceType) {
            case "Portal":
                FillFromVendorTechnicalData();
                break;
            case "cXML":
                FillFormFromcXML();
                break;
            default:
                FillFormFromOther();
                break;
        }
        // this code must be done once the configuration is loaded
        Lib.P2P.InitValidityDateTime("PAC");
        Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
    }
    Run();
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map