"use strict";
var CustomScript;
(function (CustomScript) {
    Log.Time("CustomScript");
    function InitBanner() {
        Sys.Helpers.Banner.SetMainTitle("_Return Order Title");
        Sys.Helpers.Banner.SetSubTitleAligned(false);
        Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
        Sys.Helpers.Banner.SetSubTitle("");
    }
    function InitLayout() {
        InitBanner();
        Controls.form_header.SetProcessDisplayName("_Return Order Title");
        Controls.LineItems__.SetWidth("100%");
        Controls.LineItems__.SetExtendableColumn("Description__");
        Sys.Parameters.GetInstance("PAC").OnLoad(() => {
            const isUOMEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("DisplayUnitOfMeasure");
            Controls.LineItems__.UOM__.Hide(!isUOMEnabled);
        });
        //TODO: show or remove columns later
        Controls.LineItems__.GoodsReceiptNumber__.Hide(true);
        if (Data.GetValue("ROClientRUIDEX__")) {
            Controls.Events.Hide(false);
        }
        InitConversation();
    }
    function InitConversation() {
        Controls.ConversationUI__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsSupplier));
    }
    function run() {
        InitLayout();
    }
    run();
    Log.TimeEnd("CustomScript");
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map