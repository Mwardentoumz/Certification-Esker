"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    class Configuration {
        static get publicPrice() {
            return Sys.Parameters.GetInstance("PAC").GetParameterBool("EnablePublicPrice", false);
        }
        static get itemType() {
            return Sys.Parameters.GetInstance("PAC").GetParameterBool("DisplayItemType", false);
        }
        static get inventoryManagement() {
            return Lib.P2P.Inventory.IsEnabled();
        }
    }
    Configuration.companyCode = Process.GetURLParameter("companycode");
    Configuration.warehouseNumber = Process.GetURLParameter("warehouseNumber");
    Configuration.itemNumber = Process.GetURLParameter("itemNumber");
    function CheckForm() {
        if (!Controls.FromName__.GetValue()) {
            Controls.FromName__.SetError("_ErrorFieldRequired");
        }
        if (!Controls.ToName__.GetValue()) {
            Controls.ToName__.SetError("_ErrorFieldRequired");
        }
        Sys.Helpers.Data.ForEachTableItem("ItemsTable__", function (line) {
            const qty = line.GetValue("TransfertQuantity__");
            const availableStock = line.GetValue("AvailableStock__");
            if (qty > availableStock) {
                line.SetError("TransfertQuantity__", Language.Translate("_NoStockAvailable", false, availableStock));
            }
            else if (!qty || qty < 0) {
                line.SetError("TransfertQuantity__", Language.Translate("_ItemErrorQty", false));
            }
        });
    }
    CustomScript.CheckForm = CheckForm;
    function InitWarehousesDataPanes() {
        if (ProcessInstance.isReadOnly && Lib.P2P.Inventory.IsInventoryManager()) {
            const companyCode = Data.GetValue("CompanyCode__");
            const fromId = Data.GetValue("FromID__");
            const toId = Data.GetValue("ToID__");
            Controls.FromName__.DisplayAs({ type: "Link" });
            Controls.FromName__.OnClick = function OpenLink() {
                Lib.P2P.Inventory.OpenWarehouse(companyCode, fromId);
            };
            Controls.ToName__.DisplayAs({ type: "Link" });
            Controls.ToName__.OnClick = function OpenLink() {
                Lib.P2P.Inventory.OpenWarehouse(companyCode, toId);
            };
        }
    }
    function InitItemsPane() {
        Controls.ItemsTable__.SetAtLeastOneLine(false);
        Controls.ItemsTable__.SetWidth("100%");
        Controls.ItemsTable__.SetExtendableColumn("Description__");
        Controls.ItemsTable__.Currency__.SetReadOnly(true);
    }
    function UpdateItemsPane() {
        const noVendorItems = Controls.ItemsTable__.GetItemCount() === 0;
        Controls.ItemsTable__.Hide(noVendorItems);
        Controls.NoItems__.Hide(!noVendorItems);
    }
    function InitButton() {
        Controls.Transfer.Hide(ProcessInstance.isReadOnly);
        Controls.Approve.Hide(true);
        Controls.Save.Hide(true);
        Controls.Reject.Hide(true);
        Controls.Reprocess.Hide(true);
    }
    Controls.Transfer.OnClick = function () {
        CheckForm();
        if (!Process.ShowFirstError()) {
            ProcessInstance.Approve("transfer");
        }
    };
    function InitBanner() {
        banner.SetHTMLBanner(Controls.HTMLBanner__);
        banner.SetMainTitle("_BannerTransfert");
        banner.SetSubTitle("");
    }
    function OnFormLoaded() {
        globalLayout.Hide(false);
        globalLayout.HideWaitScreen();
        InitBanner();
        Controls.FromName__.SetReadOnly(true);
        InitWarehousesDataPanes();
        InitItemsPane();
        UpdateItemsPane();
        InitButton();
        Lib.CommonDialog.NextAlert.Show();
        ProcessInstance.SetSilentChange(false);
    }
    /**
     * ENTRY POINT
     */
    const panes = ["Banner", "FromPane", "ToPane", "ItemsPane"];
    const buttons = ["Transfer", "Save", "Approve", "Reject", "Reprocess", "Close"];
    const globalLayout = new Lib.P2P.Layout.Manager(panes, buttons);
    const banner = Sys.Helpers.Banner;
    async function Start() {
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        globalLayout.Hide(true);
        globalLayout.ShowWaitScreen();
        const nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
        if (!(nextAlert === null || nextAlert === void 0 ? void 0 : nextAlert.isError) && Configuration.warehouseNumber) {
            Data.SetValue("FromID__", Configuration.warehouseNumber);
            const options = {
                supplierID: Configuration.warehouseNumber,
                itemNumber: Configuration.itemNumber
            };
            try {
                const items = await Lib.Purchasing.CatalogHelper.GetItems([options]);
                if (!items.length) {
                    Log.Error("No catalog items found with options", JSON.stringify(options));
                    return;
                }
                const itemsTable = Data.GetTable("ItemsTable__");
                itemsTable.SetItemCount(0);
                Data.SetValue("CompanyCode__", items[0].companyCode);
                const warehouseItemProperties = items[0].providersItemProperties[0];
                Data.SetValue("FromName__", warehouseItemProperties.warehouseName);
                Data.SetValue("FromDescription__", warehouseItemProperties.warehouseDescription);
                for (const item of items) {
                    const newItem = itemsTable.AddItem();
                    const warehouseItemProperties = item.providersItemProperties[0];
                    newItem.SetValue("RUIDEX__", item.ruidex);
                    newItem.SetValue("ItemNumber__", item.itemNumber);
                    newItem.SetValue("Description__", item.description);
                    newItem.SetValue("UnitOfMeasure__", item.UOM);
                    newItem.SetValue("AvailableStock__", warehouseItemProperties.availableStock);
                    newItem.SetValue("UnitPrice__", warehouseItemProperties.unitPrice);
                    newItem.SetValue("Currency__", warehouseItemProperties.currency);
                }
            }
            finally {
                OnFormLoaded();
            }
        }
        else {
            OnFormLoaded();
        }
    }
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map