"use strict";
/* eslint-disable class-methods-use-this */
var CustomScript;
(function (CustomScript) {
    var Warehouse = Lib.P2P.Inventory.Warehouse;
    class CatalogExporterClientRequester {
        // eslint-disable-next-line class-methods-use-this
        async GetNumberOfRowsToExport(filter) {
            const [result] = await Sys.GenericAPI.PromisedQuery({
                table: "P2P - CatalogItems__",
                filter: filter,
                attributes: ["__Count__"],
                maxRecords: "FULL_RESULT",
                additionalOptions: "EnableJoin=1"
            });
            return result.__Count__;
        }
        GetWarehouse(companyCode, warehouseid) {
            return Warehouse.GetWarehouse(companyCode, warehouseid);
        }
    }
    CustomScript.CatalogExporterClientRequester = CatalogExporterClientRequester;
    class CatalogExporterClient {
        constructor(requester) {
            this.requester = requester;
        }
        OnRunExport(row) {
            ProcessInstance.Approve("run_catalog_export");
        }
        HasBeenExported() {
            return !!Controls.ExportDate__.GetValue();
        }
        async FillNumberOfRowsToExport() {
            const filter = this.GetNumberOfRowsToExportFilter();
            try {
                const nb_items = await this.requester.GetNumberOfRowsToExport(filter);
                Controls.NumberOfRows__.SetValue(nb_items);
            }
            catch (error) {
                Log.Error(error);
            }
        }
        async InitNewExporterCatalogForm() {
            Log.Info("InitNewExporterCatalogForm");
            Controls.ExportDate__.Hide(true);
            Controls.NumberOfRows__.SetReadOnly(true);
            Controls.NumberOfRows__.SetLabel(Language.Translate("_ExpectedNumberOfRows"));
            Controls.NumberOfItems__.Hide(true);
            Controls.DocumentsPanel.Hide(true);
            return await this.FillNumberOfRowsToExport();
        }
        InitExportedCatalog() {
            Log.Info("InitExportedCatalog");
            Controls.ExportDate__.SetReadOnly(true);
            Controls.NumberOfRows__.SetReadOnly(true);
            Controls.NumberOfItems__.SetReadOnly(true);
            Controls.ExportDescription__.SetReadOnly(true);
            Controls.Run_Export.Hide(true);
        }
        InitEvent() {
            Controls.Run_Export.OnClick = this.OnRunExport.bind(this);
        }
        Start() {
            ProcessInstance.SetSilentChange(true);
            const promisesToWait = [];
            this.InitBanner();
            this.InitEvent();
            if (this.HasBeenExported()) {
                this.InitExportedCatalog();
            }
            else {
                promisesToWait.push(this.InitNewExporterCatalogForm());
            }
            return Sys.Helpers.Promise.All(promisesToWait)
                .Finally(() => {
                ProcessInstance.SetSilentChange(false);
            });
        }
    }
    CustomScript.CatalogExporterClient = CatalogExporterClient;
    class CatalogExporterClientVendorItem extends CatalogExporterClient {
        GetNumberOfRowsToExportFilter() {
            return Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterNotExist("ITEMNUMBER__.WAREHOUSENUMBER__"), Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", ""));
        }
        InitNewExporterCatalogForm() {
            Controls.CompanyCode__.Hide(true);
            Controls.WarehouseID__.Hide(true);
            Controls.WarehouseName__.Hide(true);
            return super.InitNewExporterCatalogForm();
        }
        InitBanner() {
            Log.Info("InitBanner");
            Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
            Sys.Helpers.Banner.SetMainTitle("_Catalog Exporter");
            if (this.HasBeenExported()) {
                Sys.Helpers.Banner.SetSubTitle("_Catalog Export Result");
            }
            else {
                Sys.Helpers.Banner.SetSubTitle("_New Catalog Export");
            }
            Sys.Helpers.Banner.Apply();
        }
    }
    CustomScript.CatalogExporterClientVendorItem = CatalogExporterClientVendorItem;
    class CatalogExporterClientWarehouseItem extends CatalogExporterClient {
        constructor(requester, warehouseid, companyCode) {
            super(requester);
            this.warehouseid = warehouseid;
            this.companyCode = companyCode;
            Variable.SetValueAsString("warehouseid", warehouseid);
            Variable.SetValueAsString("companyCode", companyCode);
            Process.SetHelpId(5047);
        }
        GetNumberOfRowsToExportFilter() {
            return Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", this.warehouseid), Sys.Helpers.LdapUtil.FilterEqual("COMPANYCODE__", this.companyCode));
        }
        InitBanner() {
            Log.Info("InitBanner");
            Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
            Controls.form_header.SetProcessDisplayName("WAREHOUSE EXPORTER");
            Sys.Helpers.Banner.SetMainTitle("_Warehouse Exporter");
            if (this.HasBeenExported()) {
                Sys.Helpers.Banner.SetSubTitle("_Warehouse Export Result");
            }
            else {
                Sys.Helpers.Banner.SetSubTitle("_New Warehouse Export");
            }
            Sys.Helpers.Banner.Apply();
        }
        InitNewExporterCatalogForm() {
            // Show warehouse
            Controls.CompanyCode__.Hide(false);
            Controls.WarehouseID__.Hide(false);
            Controls.WarehouseName__.Hide(false);
            const promiseInitWarehouse = this.requester.GetWarehouse(this.companyCode, this.warehouseid)
                .Then((warehouse) => {
                Controls.CompanyCode__.SetValue(warehouse.companyCode);
                Controls.WarehouseID__.SetValue(warehouse.ID);
                Controls.WarehouseName__.SetValue(warehouse.name);
            });
            return Sys.Helpers.Promise.All([
                super.InitNewExporterCatalogForm(),
                promiseInitWarehouse
            ]);
        }
        InitExportedCatalog() {
            Controls.CompanyCode__.Hide(false);
            Controls.WarehouseID__.Hide(false);
            Controls.WarehouseName__.Hide(false);
            super.InitExportedCatalog();
        }
    }
    CustomScript.CatalogExporterClientWarehouseItem = CatalogExporterClientWarehouseItem;
    Sys.Helpers.EnableSmartSilentChange();
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const requester = new CatalogExporterClientRequester();
        const warehouseid = Process.GetURLParameter("warehouseid") || Variable.GetValueAsString("warehouseid");
        const companyCode = Process.GetURLParameter("companyCode") || Variable.GetValueAsString("companyCode");
        const main = warehouseid
            ? new CatalogExporterClientWarehouseItem(requester, warehouseid, companyCode)
            : new CatalogExporterClientVendorItem(requester);
        main.Start();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map