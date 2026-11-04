"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ExtractionScript;
(function (ExtractionScript) {
    function GetRFQTransport(filter) {
        return Lib.P2P.QueryPurchasingTransport("Request For Quote", filter, "*", true);
    }
    async function FillVendorItemsToSource() {
        const RFQRuidEx = Data.GetValue("RFQRUIDEX__");
        let filter = `(RUIDEX=${RFQRuidEx})`;
        Log.Info("Filling RFQ Form with items from filter: " + filter);
        try {
            const transport = GetRFQTransport(filter);
            const formData = transport.GetFormData();
            const customerTable = formData.GetTable("ItemsToSource__");
            const vendorTable = Data.GetTable("ItemsToSource__");
            const customerLineCount = customerTable.GetItemCount();
            vendorTable.SetItemCount(customerLineCount);
            for (let i = 0; i < customerLineCount; i++) {
                const customerTableItem = customerTable.GetItem(i);
                const vendorTableItem = vendorTable.GetItem(i);
                vendorTableItem.SetValue("ItemName__", customerTableItem.GetValue("ItemName__"));
                vendorTableItem.SetValue("ItemDescription__", customerTableItem.GetValue("ItemDescription__"));
                vendorTableItem.SetValue("ItemType__", customerTableItem.GetValue("ItemType__"));
                vendorTableItem.SetValue("ItemQuantity__", customerTableItem.GetValue("ItemQuantity__"));
                vendorTableItem.SetValue("RequestedDeliveryDate__", customerTableItem.GetValue("ItemRequestedDeliveryDate__"));
                vendorTableItem.SetValue("ItemUoM__", customerTableItem.GetValue("ItemUoM__"));
                vendorTableItem.SetValue("ItemCurrency__", Data.GetValue("Currency__"));
            }
            Log.Info("FillItemsToSource: " + customerLineCount + " line(s) found");
            Lib.Sourcing.RFQ.Checks.CheckItemsToSourceTable();
        }
        catch (e) {
            Log.Error(e);
            Lib.CommonDialog.NextAlert.Define("_RFQ creation error", "_Cannot retrieve RFQ", {
                isError: true,
                behaviorName: "RFQInitError"
            });
        }
    }
    function SendEmailNotification() {
        const vendorLogin = Variable.GetValueAsString("VendorLogin");
        const vendorUser = Users.GetUser(vendorLogin);
        const PortalUrl = vendorUser.GetProcessURL(Data.GetValue("RuidEx"), true);
        const customTags = {
            PortalUrl: PortalUrl,
            RFQName__: Data.GetValue("RFQName__"),
            RFQDeadline__: new Date(Data.GetValue("RFQDeadline__")).toLocaleDateString(),
            RequesterName__: Data.GetValue("RequesterName__"),
            Brief__: Data.GetValue("Brief__"),
            RichTextEditorStyle: Variable.GetValueAsString("RichTextEditorStyle")
        };
        Variable.SetValueAsString("RichTextEditorStyle", "");
        Lib.Sourcing.RFQ.SendEmailNotification(vendorLogin, "Sourcing_Email_NotifNewRFQPortal.htm", customTags, false);
    }
    async function Start() {
        Lib.P2P.CompanyCodesValue
            .QueryValues(Data.GetValue("CompanyCode__"))
            .Then(function (CCValues) {
            if (Object.keys(CCValues).length > 0) {
                Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
            }
            else {
                Log.Error("The requested company code is not in the company code table.");
            }
        })
            .Then(() => {
            // Must be done when the configuration is loaded
            Lib.P2P.InitValidityDateTime("PAC");
            Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationPortalInMonths");
        });
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Lib.P2P.SetTablesToIndex(["SupplierQuestionnaireResultTable__", "ItemsToSource__"]);
        Log.Info("-- RFQ Extraction Script -- Name: '" + (currentName || "<empty>") + "', Action: '" + (currentAction || "<empty>") + "'");
        await FillVendorItemsToSource();
        SendEmailNotification();
        // TODO : Create customization lib and doc
        // Sys.Helpers.TryCallFunction("Lib.RFQ.Customization.Server.OnLoad");
    }
    Lib.P2P.HandleScriptError(Start());
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map