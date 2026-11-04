"use strict";
var CustomScript;
(function (CustomScript) {
    let g_ReplenishmentItems = [];
    let g_LastFilterApplied = [];
    let g_lastItemNumberLoaded;
    CustomScript.g_numberOfItemsLoaded = 0;
    CustomScript.g_maxLoadableItems = 0;
    let g_totalNumberOfItems = 0;
    let g_TotalAmount = 0;
    let g_localCurrency;
    class CompanyCodeManager {
        static Initialize() {
            Controls.CompanyCode__.OnChange = CompanyCodeManager.OnCompanyCodeChange;
            return CompanyCodeManager.companyCode ? CompanyCodeManager.LoadConfiguration() : CompanyCodeManager.LoadDefaultCompanyCode();
        }
        static LoadDefaultCompanyCode() {
            return Lib.P2P.UserProperties.QueryValues(User.loginId)
                .Then((UserPropertiesValues) => {
                CompanyCodeManager.companyCode = UserPropertiesValues.CompanyCode__;
                Data.SetValue("CompanyCode__", CompanyCodeManager.companyCode);
                return CompanyCodeManager.LoadConfiguration();
            });
        }
        static LoadConfiguration() {
            return Lib.P2P.CompanyCodesValue.QueryValues(CompanyCodeManager.companyCode)
                .Then((CCValues) => {
                if (Object.keys(CCValues).length > 0) {
                    Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
                }
                else {
                    Log.Error("The requested company code is not in the company code table.");
                }
                return Sys.Parameters.IsReady();
            });
        }
        static HasDependencies() {
            return !Sys.Helpers.IsEmpty(Controls.ShipToID__.GetValue());
        }
        static UpdateCompanyCodeDependencies() {
            CompanyCodeManager.companyCode = Data.GetValue("CompanyCode__");
            Controls.ShipToID__.SetValue("");
            Controls.DeliveryAddressFormated__.SetValue("");
        }
        static RevertCompanyCode() {
            Controls.CompanyCode__.SetValue(CompanyCodeManager.companyCode);
        }
        static OnCompanyCodeChange( /*item*/) {
            if (CompanyCodeManager.HasDependencies()) {
                setTimeout(() => {
                    Popup.Confirm("_This action will delete company code related fields.", false, () => CompanyCodeManager.UpdateCompanyCodeDependencies(), () => CompanyCodeManager.RevertCompanyCode(), "_Warning");
                });
            }
            else {
                CompanyCodeManager.LoadConfiguration();
            }
        }
    }
    CompanyCodeManager.companyCode = Data.GetValue("CompanyCode__");
    const stockTableParameters = {
        standardMapping: {
            "ItemNumber__": { name: "ITEMNUMBER__", type: "catalog", operator: "contains" },
            "ItemDescription__": { name: "DESCRIPTION__", type: "catalog", operator: "contains" },
            "SupplyTypeFullpath__": { name: "SUPPLYTYPEID__.FULLNAME__", type: "catalog", operator: "contains" },
            // "StocktakingDate__": { name: "CAST(ITEMNUMBER__.STOCKTAKINGDATETIME__ ::text)", type: "catalog", operator: "contains" },
            "Stock__": { name: "CURRENTSTOCK__", type: "warehouse", operator: "startsWith" },
            "ReservedStock__": { name: "RESERVEDSTOCK__", type: "warehouse", operator: "startsWith" },
            "AvailableStock__": { name: "AVAILABLESTOCK__", type: "warehouse", operator: "startsWith" },
            "IncomingStock__": { name: "INCOMINGSTOCK__", type: "warehouse", operator: "startsWith" },
            "MinimumThreshold__": { name: "MINIMUMTHRESHOLD__", type: "warehouse", operator: "startsWith" },
            "ExpectedStockLevel__": { name: "EXPECTEDSTOCKLEVEL__", type: "warehouse", operator: "startsWith" },
            "ItemUnitPrice__": { name: "UNITPRICE__", type: "warehouse", operator: "startsWith" }
        },
        customMapping: null
    };
    function BuildStockTableFilter(columnFilters) {
        let r = [];
        for (const columnFilter of columnFilters) {
            const filterParams = stockTableParameters.customMapping[columnFilter.columnName] || stockTableParameters.standardMapping[columnFilter.columnName];
            if (filterParams && filterParams.operator) {
                const value = filterParams.operator === "startsWith" ? columnFilter.startWith : columnFilter[filterParams.operator];
                const filter = Lib.Purchasing.CatalogHelper.BuildFilter(filterParams.name, value, filterParams.operator, filterParams.type);
                r.push(filter);
            }
        }
        return r;
    }
    CustomScript.BuildStockTableFilter = BuildStockTableFilter;
    async function InitStockPanel() {
        stockTableParameters.customMapping = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Warehouses.GetCatalogToStockTableMap") || {};
        Controls.StockInformationPanel.Hide(!ProcessInstance.isReadOnly);
        Controls.StockTable__.SetWidth("100%");
        Controls.StockTable__.SetExtendableColumn("ItemDescription__");
        Controls.StockTable__.Transfer__.OnClick = function () {
            const itemNumber = this.GetRow().GetItem().GetValue("ItemNumber__");
            const url = "FlexibleForm.aspx?action=run&layout=_flexibleform&pName=P2P - Inventory Transfert__"
                + "&warehouseNumber=" + encodeURIComponent(Data.GetValue("WarehouseID__"))
                + "&itemNumber=" + encodeURIComponent(itemNumber);
            Process.OpenLink({
                url: url,
                inCurrentTab: true,
                onQuit: "Back"
            });
        };
        Controls.StockTable__.ItemNumber__.OnClick = function OpenCatalogItemEdit() {
            const shortURL = `FlexibleForm.aspx?layout=_flexibleform&pName=P2P - CatalogItemEdit__&itemnumber=${this.GetRow().ItemNumber__.GetValue()}`;
            const currentURL = Process.GetURL();
            const url = `${shortURL}&ReturnUrl=${encodeURIComponent(currentURL)}`;
            Process.OpenLink({
                url: url,
                inCurrentTab: true
            });
        };
        Controls.StockTable__.OnRefreshRow = function (index) {
            let row = Controls.StockTable__.GetRow(index);
            const item = row.GetItem();
            const currentStock = item.GetValue("Stock__");
            const availableStock = item.GetValue("AvailableStock__");
            if (currentStock <= item.GetValue("MinimumThreshold__")) {
                row.Stock__.AddStyle("text-warning");
            }
            else {
                row.Stock__.RemoveStyle("text-warning");
            }
            row.ItemNumber__.DisplayAs({ type: "Link" });
            row.Transfer__.SetDisabled(!availableStock);
        };
        Controls.StockTable__.OnFilter = function (filters) {
            if (g_totalNumberOfItems !== CustomScript.g_numberOfItemsLoaded) {
                const newFilter = BuildStockTableFilter(filters);
                if ((newFilter === null || newFilter === void 0 ? void 0 : newFilter.toString()) != (g_LastFilterApplied === null || g_LastFilterApplied === void 0 ? void 0 : g_LastFilterApplied.toString())) {
                    g_LastFilterApplied = newFilter;
                    g_lastItemNumberLoaded = null;
                    CustomScript.g_numberOfItemsLoaded = 0;
                    ProcessInstance.SetSilentChange(true);
                    Controls.StockLoader__.Hide(false);
                    Controls.StockTable__.SetItemCount(0);
                    LoadStockTable(g_lastItemNumberLoaded, g_LastFilterApplied).Finally(() => {
                        RefreshStockDisplay();
                        Controls.StockLoader__.Hide(true);
                        ProcessInstance.SetSilentChange(false);
                    });
                    return false;
                }
            }
            return true;
        };
        if (Data.GetValue("WarehouseID__")) {
            const [, totalItemToReplenish] = await Promise.all([LoadStockTable(), GetTotalItemsToReplenish()]);
            InitCounter(totalItemToReplenish);
        }
        InitStockDisplay();
        RefreshStockDisplay();
    }
    let g_LastQueryID = 1;
    async function LoadStockTable(lastItemNumberLoaded, additionalFilter = []) {
        const promises = [];
        const warehouseID = Data.GetValue("WarehouseID__");
        const idUsed = ++g_LastQueryID;
        const filter = Array.from(additionalFilter);
        if (lastItemNumberLoaded) {
            filter.push(Sys.Helpers.LdapUtil.FilterStrictlyGreater("ITEMNUMBER__", lastItemNumberLoaded));
        }
        else {
            promises.push(GetNumberOfRows(filter));
        }
        const table = Controls.StockTable__;
        promises.push(Lib.Purchasing.CatalogHelper.GetItems([{ supplierID: warehouseID }], filter)
            .Then(function (catalogItems) {
            var _a;
            if (idUsed === g_LastQueryID) {
                for (let item of catalogItems) {
                    const warehouseItem = item.providersItemProperties[0];
                    const tableItem = table.AddItem();
                    tableItem.SetValue("ItemNumber__", item.itemNumber);
                    tableItem.SetValue("ItemDescription__", item.description);
                    tableItem.SetValue("Stock__", warehouseItem.currentStock);
                    tableItem.SetValue("ReservedStock__", warehouseItem.reservedStock);
                    tableItem.SetValue("AvailableStock__", warehouseItem.availableStock);
                    tableItem.SetValue("MinimumThreshold__", warehouseItem.minimumThreshold);
                    tableItem.SetValue("IncomingStock__", warehouseItem.incomingStock);
                    tableItem.SetValue("ExpectedStockLevel__", warehouseItem.expectedStockLevel);
                    tableItem.SetValue("ItemUnitPrice__", warehouseItem.unitPrice);
                    tableItem.SetValue("Currency__", warehouseItem.currency);
                    tableItem.SetValue("StocktakingDate__", warehouseItem.stocktakingDateTime);
                    tableItem.SetValue("DefaultReplenishmentVendorNumber__", warehouseItem.defaultReplenishmentVendorNumber);
                    tableItem.SetValue("SupplyTypeID__", item.supplytypeID);
                    tableItem.SetValue("SupplyTypeName__", item.supplytypeIDName);
                    tableItem.SetValue("SupplyTypeFullpath__", item.supplytypeIDFullPath);
                    for (const customTableColumn in stockTableParameters.customMapping) {
                        const filterParams = stockTableParameters.customMapping[customTableColumn];
                        const fieldName = Lib.Purchasing.CatalogHelper.NormalizeAttribute(filterParams.name);
                        const value = item.impliedFields[fieldName] || warehouseItem.impliedFields[fieldName];
                        tableItem.SetValue(customTableColumn, value);
                    }
                }
                g_lastItemNumberLoaded = (_a = catalogItems[catalogItems.length - 1]) === null || _a === void 0 ? void 0 : _a.itemNumber;
                CustomScript.g_numberOfItemsLoaded += catalogItems.length;
            }
        }));
        await Promise.all(promises);
    }
    CustomScript.LoadStockTable = LoadStockTable;
    async function GetTotalItemsToReplenish() {
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("WAREHOUSENUMBER__", Data.GetValue("WarehouseID__")), "(|(&(MINIMUMTHRESHOLD__=*)(|(CURRENTSTOCK__!=*)(INCOMINGSTOCK__!=*)))((CURRENTSTOCK__+INCOMINGSTOCK__-MINIMUMTHRESHOLD__)<=0))");
        const options = {
            table: "P2P - VendorItems__",
            filter: filter,
            attributes: [
                "COUNT(*) 'NBITEMS'"
            ],
            maxRecords: 1,
            groupBy: ["WAREHOUSENUMBER__"],
            additionalOptions: {
                recordBuilder: Sys.GenericAPI.BuildQueryResult,
                fieldToTypeMap: {
                    NBITEMS: "int"
                },
                queryOptions: "FastSearch=-1"
            }
        };
        const results = await Sys.GenericAPI.PromisedQuery(options);
        return (results === null || results === void 0 ? void 0 : results.length) ? results[0].GetValue("NBITEMS") : 0;
    }
    async function GetItemsToReplenish() {
        const warehouseID = Data.GetValue("WarehouseID__");
        const filter = Sys.Helpers.LdapUtil.FilterOr("(&(ITEMNUMBER__.EXPECTEDSTOCKLEVEL__=*)(|(ITEMNUMBER__.CURRENTSTOCK__!=*)(ITEMNUMBER__.INCOMINGSTOCK__!=*)))", Sys.Helpers.LdapUtil.FilterStrictlyGreater("(ITEMNUMBER__.EXPECTEDSTOCKLEVEL__-ITEMNUMBER__.CURRENTSTOCK__-ITEMNUMBER__.INCOMINGSTOCK__)", "0"));
        const catalogItems = await Lib.Purchasing.CatalogHelper.GetItems([{ supplierID: warehouseID }], [filter]);
        const itemsToReplenish = [];
        for (let item of catalogItems) {
            const warehouseItem = item.providersItemProperties[0];
            const requestedQuantity = new Sys.Decimal(warehouseItem.expectedStockLevel || 0).sub(warehouseItem.currentStock || 0).sub(warehouseItem.incomingStock || 0).toNumber();
            itemsToReplenish.push({
                itemNumber: item.itemNumber,
                requestedQuantity,
                defaultVendorNumber: warehouseItem.defaultReplenishmentVendorNumber
            });
        }
        return itemsToReplenish;
    }
    CustomScript.GetItemsToReplenish = GetItemsToReplenish;
    function GetNumberOfRows(additionalFilter = []) {
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", Data.GetValue("WarehouseID__")), ...additionalFilter);
        const options = {
            table: "P2P - CatalogItems__",
            filter: filter,
            attributes: [
                "COUNT(*) 'NBITEMS'",
                "SUM(ITEMNUMBER__.UnitPrice__*ITEMNUMBER__.CurrentStock__) 'WAREHOUSEVALUE'",
                "ITEMNUMBER__.Currency__"
            ],
            maxRecords: "FULL_RESULT",
            groupBy: ["ITEMNUMBER__.WAREHOUSENUMBER__", "ITEMNUMBER__.Currency__"],
            additionalOptions: {
                recordBuilder: Sys.GenericAPI.BuildQueryResult,
                fieldToTypeMap: {
                    WAREHOUSEVALUE: "double",
                    NBITEMS: "int",
                    CURRENCY: "string"
                },
                queryOptions: "EnableJoin=1;FastSearch=-1"
            }
        };
        return Sys.GenericAPI.PromisedQuery(options)
            .Then(([result]) => {
            if (result) {
                CustomScript.g_maxLoadableItems = result.GetValue("NBITEMS");
                g_TotalAmount = result.GetValue("WAREHOUSEVALUE");
                g_localCurrency = result.GetValue("ITEMNUMBER__.Currency__");
            }
            else {
                CustomScript.g_maxLoadableItems = 0;
            }
        });
    }
    function InitCounter(totalItemToReplenish) {
        Controls.TotalAmount__.SetValue(Lib.P2P.CurrencyFormat(g_TotalAmount, g_localCurrency));
        g_totalNumberOfItems = CustomScript.g_maxLoadableItems;
        Controls.TotalItems__.SetValue(g_totalNumberOfItems.toString());
        Controls.CounterStockAlarm__.SetValue(totalItemToReplenish.toString());
        if (totalItemToReplenish > 0) {
            Controls.CounterStockAlarm__.SetColor({ colorIndex: 3, textColorIndex: 3 });
        }
        else {
            Controls.CounterStockAlarm__.SetColor({ textColorIndex: 1 });
        }
        Controls.TotalAmount__.SetColor({ textColorIndex: 1 });
        Controls.TotalItems__.SetColor({ textColorIndex: 1 });
    }
    function InitButtonBar() {
        if (ProcessInstance.isReadOnly) {
            Controls.Save.Hide(true);
            Controls.Save.SetReadOnly(true);
            Controls.Edit.Hide(!User.IsBusinessRoleEnabled("AllowCTModification"));
            Controls.ReplenishmentOrderButton__.OnClick = function () {
                let replenishmentData = {
                    warehouseID: Data.GetValue("WarehouseID__"),
                    warehouseName: Data.GetValue("Name__"),
                    shipToID: Data.GetValue("ShipToID__"),
                    requestedItems: g_ReplenishmentItems
                };
                const storageKey = "ESKReplenishment" + Math.floor(Math.random() * 1000000000);
                Data.StorageSetValue(storageKey, JSON.stringify(replenishmentData));
                let url = "FlexibleForm.aspx?action=run&layout=_flexibleform&pName=Purchase requisition V2&replenishmentkey=" + encodeURIComponent(storageKey);
                Process.OpenLink({ url: url, inCurrentTab: false });
            };
            Controls.ExportButton__.OnClick = function () {
                const url = `FlexibleForm.aspx?action=run&layout=_flexibleform&pName=Catalog Exporter&warehouseid=${encodeURIComponent(Data.GetValue("WarehouseID__"))}&companyCode=${encodeURIComponent(Data.GetValue("CompanyCode__"))}&OnQuit=Close`;
                Process.OpenLink({ url: url, inCurrentTab: false });
            };
            Controls.ImportButton__.OnClick = function () {
                const url = `FlexibleForm.aspx?action=run&layout=_flexibleform&pName=Catalog management workflow&warehouseid=${encodeURIComponent(Data.GetValue("WarehouseID__"))}&companyCode=${encodeURIComponent(Data.GetValue("CompanyCode__"))}&OnQuit=Close&OnSubmit=Close`;
                Process.OpenLink({ url: url, inCurrentTab: false });
            };
            Controls.Edit.OnClick = function () {
                const currentURL = Process.GetURL();
                const shortURL = currentURL.substring(0, currentURL.indexOf("&ReturnUrl"));
                Process.OpenLink({
                    url: `${shortURL}&readonly=0&edit=1&ReturnUrl=${encodeURIComponent(currentURL)}`,
                    inCurrentTab: true
                });
            };
            Controls.LoadMoreButton__.OnClick = function () {
                ProcessInstance.SetSilentChange(true);
                LoadStockTable(g_lastItemNumberLoaded, g_LastFilterApplied)
                    .Finally(() => {
                    RefreshStockDisplay();
                    ProcessInstance.SetSilentChange(false);
                });
            };
        }
        else {
            Controls.ImportButton__.Hide(true);
            Controls.ExportButton__.Hide(true);
            Controls.ReplenishmentOrderButton__.Hide(true);
            Controls.Edit.Hide(true);
        }
    }
    async function InitStockDisplay() {
        Controls.StockInformationPanel.Hide(!ProcessInstance.isReadOnly || !Controls.StockTable__.GetItemCount());
        Controls.Counter.Hide(!ProcessInstance.isReadOnly);
        g_ReplenishmentItems = await GetItemsToReplenish();
        Controls.ReplenishmentOrderButton__.SetDisabled(g_ReplenishmentItems.length === 0);
    }
    function RefreshStockDisplay() {
        const isHidden = CustomScript.g_numberOfItemsLoaded >= CustomScript.g_maxLoadableItems;
        Controls.LoadMoreText__.Hide(isHidden);
        Controls.LoadMoreButton__.Hide(isHidden);
        Controls.LoadMoreText__.SetLabel(Language.Translate("_LoadMoreText", false, CustomScript.g_numberOfItemsLoaded, CustomScript.g_maxLoadableItems));
    }
    CustomScript.RefreshStockDisplay = RefreshStockDisplay;
    function InitShipTo() {
        Lib.P2P.Address.SetFormattedAddressControl(Controls.DeliveryAddressFormated__);
        Controls.ShipToID__.OnSelectItem = function (selectedItem) {
            FillDeliveryAdress(selectedItem);
        };
        if (Data.GetValue("ShipToID__")) {
            return Lib.Purchasing.ShipTo.QueryShipToById(Data.GetValue("ShipToID__"), Data.GetValue("CompanyCode__"))
                .Then(queryResult => {
                Sys.Helpers.SilentChange(() => {
                    FillDeliveryAdress(queryResult);
                });
            }).Catch((error) => Log.Error(error));
        }
        return Sys.Helpers.Promise.Resolve();
    }
    function InitWarehouseManager() {
        Controls.WarehouseManagerName__.SetRequired(true);
        Controls.WarehouseManagerName__.SetBrowsable(!ProcessInstance.isReadOnly);
        Controls.WarehouseManagerName__.OnBrowse = function () {
            Controls.WarehouseManagerLogin__.DoBrowse();
        };
        const warehouseManagerLogin = Data.GetValue("WarehouseManagerLogin__");
        if (warehouseManagerLogin) {
            const options = {
                table: "ODUSER",
                filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Login", warehouseManagerLogin), Sys.Helpers.LdapUtil.FilterEqual("Customer", "0"), Sys.Helpers.LdapUtil.FilterEqual("Vendor", "0"), Sys.Helpers.LdapUtil.FilterNotEqual("PortalUser", "1")).toString(),
                attributes: ["DisplayName"],
                maxRecords: 100,
                additionalOptions: {
                    recordBuilder: Sys.GenericAPI.BuildQueryResult
                }
            };
            return Sys.GenericAPI.PromisedQuery(options)
                .Then((results) => {
                if (!(results === null || results === void 0 ? void 0 : results.length)) {
                    Log.Error("No user found for id: " + warehouseManagerLogin);
                    return;
                }
                Sys.Helpers.SilentChange(() => {
                    Controls.WarehouseManagerName__.SetValue(results[0].GetValue("DisplayName"));
                });
            });
        }
        return Sys.Helpers.Promise.Resolve();
    }
    function InitEditMode() {
        if (!ProcessInstance.isReadOnly && Process.GetURLParameter("edit") === "1") {
            Controls.CompanyCode__.SetReadOnly(true);
            Controls.WarehouseID__.SetReadOnly(true);
        }
    }
    function FillDeliveryAdress(selectedItem) {
        const options = {
            isVariablesAddress: true,
            address: {
                ToName: selectedItem.GetValue("ShipToCompany__"),
                ToSub: selectedItem.GetValue("ShipToSub__"),
                ToMail: selectedItem.GetValue("ShipToStreet__"),
                ToPostal: selectedItem.GetValue("ShipToZipCode__"),
                ToCountryCode: selectedItem.GetValue("ShipToCountry__"),
                ToState: selectedItem.GetValue("ShipToRegion__"),
                ToCity: selectedItem.GetValue("ShipToCity__"),
                ForceCountry: true
            },
            countryCode: selectedItem.GetValue("ShipToCountry__"),
            keepCompanyInBlock: true
        };
        Lib.P2P.Address.ComputeFormattedAddressWithOptions(options);
    }
    /** ******************* **/
    /** Form initialization **/
    /** ******************* **/
    class LayoutManager {
        static HideWaitScreen(hide) {
            // async call just after boot
            setTimeout(function () {
                Controls.CompanyCode__.Wait(!hide);
            });
        }
        static Hide(hide) {
            for (const pane of LayoutManager.panes) {
                pane.Hide(hide);
            }
            Log.TimeStamp("HideWaitScreen : " + !hide);
            LayoutManager.HideWaitScreen(!hide);
        }
        static async InitForm() {
            InitEditMode();
            InitButtonBar();
            InitWarehouseManager();
            InitShipTo();
            LayoutManager.Hide(false);
            await InitStockPanel();
        }
    }
    LayoutManager.panes = [
        "DataPanel",
        "StockInformationPanel",
        "Counter",
        "Address"
    ].map((name) => Controls[name]);
    async function InitializeProcess() {
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        LayoutManager.Hide(true);
        if (!ProcessInstance.isReadOnly) {
            await CompanyCodeManager.Initialize();
        }
        await LayoutManager.InitForm();
        ProcessInstance.SetSilentChange(false);
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    CustomScript.InitializeProcess = InitializeProcess;
})(CustomScript || (CustomScript = {}));
CustomScript.InitializeProcess();
//# sourceMappingURL=customscript.js.map