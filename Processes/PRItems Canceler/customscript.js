"use strict";
/* Purchase order HTML page script */
const topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
const banner = Sys.Helpers.Banner;
banner.SetHTMLBanner(Controls.HTMLBanner__);
banner.SetMainTitle("_Cancel those items");
banner.SetSubTitle("_Cancel those items subtitle");
Controls.LineItems__.PRRUIDEX__.Hide(true);
Controls.LineItems__.RequesterDN__.Hide(true);
Controls.LineItems__.SetWidth("100%");
Controls.LineItems__.SetExtendableColumn("Description__");
Controls.LineItems__.HideTableRowMenu(true);
Controls.LineItems__.HideTopNavigation(true);
Controls.LineItems__.HideBottomNavigation(true);
Controls.LineItems__.HideTableRowDelete(false);
Controls.LineItems__.HideTableRowAdd(true);
Controls.LineItems__.SetAtLeastOneLine(false);
Sys.Parameters.GetInstance("P2P").IsReady(() => {
    Lib.P2P.InitItemTypeControl(Controls.LineItems__.ItemType__);
});
Controls.Comment__.SetError("");
Controls.Comment__.Focus();
/** ************** **/
/** Global Helpers **/
/** ************** **/
const confirmCancelItemsButton = (function () {
    function SetDisabledState() {
        Controls.ConfirmCancelItems.SetDisabled(Controls.LineItems__.GetItemCount() == 0 || Sys.Helpers.IsEmpty(Controls.Comment__.GetValue()));
    }
    return {
        SetDisabledState: SetDisabledState
    };
})();
Controls.LineItems__.OnDeleteItem = function ( /*item, index*/) {
    confirmCancelItemsButton.SetDisabledState();
};
Controls.Comment__.OnChange = function () {
    confirmCancelItemsButton.SetDisabledState();
};
Controls.ConfirmCancelItems.OnClick = function () {
    if (Process.ShowFirstError() === null) {
        ProcessInstance.ApproveAsynchronous("Cancel_PRItems");
    }
};
Controls.LineItems__.OnRefreshRow = function (index) {
    let row = Controls.LineItems__.GetRow(index);
    const isAmountBase = Lib.Purchasing.Items.IsAmountBasedItem(row.GetItem());
    row.CancelableQuantity__.Hide(isAmountBase);
    row.CancelableAmount__.Hide(!isAmountBase);
};
let nbrItemsAmountBased = 0;
let nbrItemsQuantityBased = 0;
let index = 0;
Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
    Lib.Purchasing.Items.IsAmountBasedItem(item) ? ++nbrItemsAmountBased : ++nbrItemsQuantityBased;
    ++index;
});
Controls.LineItems__.CancelableAmount__.Hide(nbrItemsAmountBased == 0);
Controls.LineItems__.CancelableQuantity__.Hide(nbrItemsQuantityBased == 0);
for (let i = 0; i < index; i++) {
    Controls.LineItems__.OnRefreshRow(i);
}
const deprecatedControls = ["Actions", "Spacer", "Spacer_line__", "Spacer_line2__"].map((name) => Controls[name]);
deprecatedControls.forEach(function (deprecatedControl) {
    if (deprecatedControl) {
        deprecatedControl.Hide(true);
    }
});
confirmCancelItemsButton.SetDisabledState();
//# sourceMappingURL=customscript.js.map