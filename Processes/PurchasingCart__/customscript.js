"use strict";
var CustomScript;
(function (CustomScript) {
    var SupplyType = Lib.Purchasing.SupplyType;
    class CConfiguration {
        static get defaultLayout() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("DefaultCatalogLayout", "Lines");
        }
        static get vendorInformation() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("DisplayVendorInformationOnCard", false);
        }
        static get itemRating() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("EnableItemRating", false);
        }
        static get publicPrice() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("EnablePublicPrice", false);
        }
        static get isPunchoutV2Enable() {
            return Sys.Parameters.GetInstance("P2P").GetParameterBool("EnablePunchoutV2", false);
        }
        static get inventoryManagement() {
            return Lib.P2P.Inventory.IsEnabled();
        }
        static get useMultiSupplierItem() {
            return !Sys.Helpers.Data.IsTrue(Process.GetURLParameter("disableMultiSupplierItem")) && Lib.Purchasing.CatalogHelper.IsMultiSupplierItemEnabled();
        }
        static get displaySortBy() {
            return CConfiguration.useMultiSupplierItem;
        }
    }
    const DayInMs = 86400000;
    let g_PRLocalStorageIndex = Process.GetURLParameter("ls");
    const g_IsIntakeRequestCatalogFlow = g_PRLocalStorageIndex === null || g_PRLocalStorageIndex === void 0 ? void 0 : g_PRLocalStorageIndex.startsWith("irCatalog");
    const g_UserCartLocalStorageUniqueCounter = "ESKCart" + Lib.Purchasing.HashLoginID(User.loginId) + "UniqueCounter";
    const g_UserCartLocalStorageIndex = "ESKCart" + Lib.Purchasing.HashLoginID(User.loginId);
    const g_CartLocalStorageUniqueCounter = g_IsIntakeRequestCatalogFlow ? `${g_PRLocalStorageIndex}CartUniqueCounter` : g_UserCartLocalStorageUniqueCounter;
    const g_CartLocalStorageIndex = g_IsIntakeRequestCatalogFlow ? `${g_PRLocalStorageIndex}Cart` : g_UserCartLocalStorageIndex;
    const g_UserDisplayLayoutLocalStorageIndex = "ESKCartDisplayLayout" + Lib.Purchasing.HashLoginID(User.loginId);
    const ldapUtil = Sys.Helpers.LdapUtil;
    let g_uniqueCounter = Number.parseInt(Data.StorageGetValue(g_CartLocalStorageUniqueCounter) || "1", 10);
    CustomScript.g_companyCode = Process.GetURLParameter("companycode");
    let g_allowedWarehouses = [];
    let g_filter = Process.GetURLFragment("filter");
    const g_initialFilter = Process.GetURLFragment("initialfilter");
    let g_isInitialFilterActive = !!g_initialFilter;
    const g_search = Process.GetURLParameter("search");
    let g_catalogs = [];
    CustomScript.g_vendorCompanyExtendedPropertiesQueryCache = {};
    let timeOut = null;
    let lastSearchCacheVendors;
    let g_totalQueries = 0;
    let g_totalQueriesVendors = 0;
    let g_totalQueriesCategorie = 0;
    const g_selectedSuppliers = {
        vendors: [],
        warehouses: []
    };
    CustomScript.categorySelected = "*";
    let treeview_options = {
        GetChildren: function (parentID) {
            const ccChildren = SupplyType.manager.GetChildren(Data.GetValue("CompanyCode__"), parentID);
            const emptyCCChildren = SupplyType.manager.GetChildren(null, parentID);
            return ccChildren.concat(emptyCCChildren).map(child => ({
                id: child.id,
                value: child.name
            }));
        },
        DisplayParent: "all",
        AllLabel: "_AllPurchasingSupply",
        ChildrenFilter: null
    };
    function UpdateSendToPurchaseRequisitionLabel() {
        if (g_PRLocalStorageIndex === null || g_PRLocalStorageIndex === void 0 ? void 0 : g_PRLocalStorageIndex.startsWith("irCatalog")) {
            Controls.SendToPurchaseRequisition__.SetText(Language.Translate("_SendToIntakeRequest"));
            return;
        }
        if (g_filter === null || g_filter === void 0 ? void 0 : g_filter.startsWith("(VendorNumber__=")) {
            Controls.SendToPurchaseRequisition__.SetText("Add Items");
            return;
        }
        Controls.SendToPurchaseRequisition__.SetText(Language.Translate("_SendToPurchaseRequisition"));
    }
    function IsIntakeRequestCatalogFlow() {
        return !!g_IsIntakeRequestCatalogFlow;
    }
    function GetActiveCatalogFilter() {
        return g_filter || (g_isInitialFilterActive ? g_initialFilter : "");
    }
    function ClearInitialCatalogFilter() {
        g_isInitialFilterActive = false;
    }
    function ResetActiveCartStorage() {
        Data.StorageSetValue(g_CartLocalStorageIndex, "{}");
        Data.StorageSetValue(g_CartLocalStorageUniqueCounter, 1);
    }
    function DisplaySnackbarSingleItemOnly() {
        const options = {
            message: Language.Translate("_OnlyOneCatalogItemAllowedForIntakeRequest", false),
            timeout: 3000,
            status: "warning"
        };
        Popup.Snackbar(options);
    }
    function RemoveTrailingZero(value) {
        const numericValue = parseFloat(value);
        return !isNaN(numericValue) ? numericValue.toString() : "";
    }
    function UpdateWarehouseFilter(values, selectedOptions = [], vendorAvailableOptions = 0) {
        const show = CConfiguration.inventoryManagement && !!selectedOptions.length;
        Controls.WarehouseSpacer__.Hide(!show);
        Controls.WarehouseFilterDescription__.Hide(!show);
        Controls.WarehouseList__.Hide(!show);
        if (show && values) {
            Controls.WarehouseList__.SetAvailableValues(values);
            let availableOptions = Controls.WarehouseList__.GetAvailableValues().length + vendorAvailableOptions;
            if (availableOptions === 1 && selectedOptions.length === 1) {
                Controls.WarehouseList__.SelectOptions(selectedOptions);
                Controls.WarehouseList__.SetReadOnly(true);
            }
            else if (availableOptions > 1) {
                Controls.WarehouseList__.SelectOptions(g_selectedSuppliers.warehouses);
                Controls.WarehouseList__.SetReadOnly(false);
            }
        }
    }
    function UpdateVendorFilter(values, selectedOptions = [], warehouseAvailableOptions = 0) {
        const show = !!selectedOptions.length;
        Controls.VendorSpacer__.Hide(!show);
        Controls.VendorFilterDescription__.Hide(!show);
        Controls.VendorList__.Hide(!show);
        if (values) {
            Controls.VendorList__.SetAvailableValues(values);
        }
        let availableOptions = Controls.VendorList__.GetAvailableValues().length + warehouseAvailableOptions;
        if (availableOptions === 1 && selectedOptions.length === 1) {
            Controls.VendorList__.SelectOptions(selectedOptions);
            Controls.VendorList__.SetReadOnly(true);
        }
        else {
            Controls.VendorList__.SelectOptions(g_selectedSuppliers.vendors);
            Controls.VendorList__.SetReadOnly(false);
        }
    }
    async function LoadCompanyCodeConfiguration() {
        const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(User.loginId);
        const promises = [];
        CustomScript.g_companyCode = CustomScript.g_companyCode || UserPropertiesValues.CompanyCode__;
        g_allowedWarehouses = CConfiguration.useMultiSupplierItem ? UserPropertiesValues.AllowedWarehouses__ || [] : [];
        if (CustomScript.g_companyCode) {
            Data.SetValue("CompanyCode__", CustomScript.g_companyCode);
            promises.push(Lib.P2P.CompanyCodesValue.QueryValues(CustomScript.g_companyCode)
                .Then(async (CCValues) => {
                if (Object.keys(CCValues).length > 0) {
                    await Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
                    await (CCValues === null || CCValues === void 0 ? void 0 : CCValues.currencies.QueryRate());
                    Data.SetValue("Currency__", CCValues.Currency__);
                    Data.SetValue("ExchangeRate__", CCValues.currencies.GetRate(CCValues.Currency__));
                    if (CConfiguration.useMultiSupplierItem) {
                        g_catalogs = ["P2P - CatalogItems__"];
                    }
                    else {
                        g_catalogs = ["PurchasingOrderedItems__"];
                    }
                    UpdateWarehouseFilter();
                }
                else {
                    Log.Error("The requested company code is not in the company code table.");
                }
            }));
            promises.push(SupplyType.manager.Query(Data.GetValue("CompanyCode__"))
                .Then(() => {
                Controls.VerticalTreeview__.Init(treeview_options, false);
            }));
            await Promise.all(promises);
        }
        else {
            Popup.Alert("_ErrorLoadingConfiguration", true, () => {
                Process.OpenLink({ url: Process.GetURLParameter("ReturnUrl"), inCurrentTab: true });
            }, "_ErrorLoadingConfigurationTitle");
        }
    }
    CustomScript.LoadCompanyCodeConfiguration = LoadCompanyCodeConfiguration;
    function InitForm() {
        ProcessInstance.SetSilentChange(true);
        ProcessInstance.SetFormWidth(1980);
        Controls.Quit__.OnClick = function () {
            if (!g_PRLocalStorageIndex) {
                ProcessInstance.Quit("Quit");
            }
            else {
                if (IsIntakeRequestCatalogFlow()) {
                    ResetActiveCartStorage();
                }
                Process.CloseTab();
            }
        };
        Controls.Close.Hide(true);
        Controls.Save.Hide(true);
        Data.SetValue("Currency__", "");
        Data.SetValue("ExchangeRate__", 1);
        Process.SetHelpId(5008);
    }
    CustomScript.InitForm = InitForm;
    function UpdateResultCounter(resultCount) {
        let translationKey;
        if (resultCount === 0) {
            translationKey = "_no result";
        }
        else if (resultCount === 1) {
            translationKey = "_1 result";
        }
        else {
            translationKey = "_{0} results";
        }
        Controls.ResultCounter__.SetText(Language.Translate(translationKey, false, resultCount));
    }
    async function UpdateVendorList(searchValue) {
        let filter = await GetFilter(searchValue, true);
        if (filter != lastSearchCacheVendors) {
            lastSearchCacheVendors = filter;
            let options = {
                table: "PurchasingOrderedItems__",
                filter: filter,
                attributes: ["VENDORNUMBER__", "VENDORNUMBER__.NAME__", "count(*) 'NBITEMS'"],
                sortOrder: ["NBITEMS DESC"],
                maxRecords: 100,
                additionalOptions: "EnableJoin=1",
                groupBy: ["VendorNumber__", "VendorNumber__.Name__"]
            };
            if (CConfiguration.useMultiSupplierItem) {
                options.table = "P2P - CatalogItems__";
                options.attributes = [
                    "ITEMNUMBER__.VENDORNUMBER__",
                    "ITEMNUMBER__.VENDORNUMBER__.NAME__",
                    "ITEMNUMBER__.WAREHOUSENUMBER__",
                    "ITEMNUMBER__.WAREHOUSENUMBER__.NAME__",
                    "count(*) 'NBITEMS'"
                ];
                options.groupBy = [
                    "ITEMNUMBER__.VENDORNUMBER__",
                    "ITEMNUMBER__.VENDORNUMBER__.NAME__",
                    "ITEMNUMBER__.WAREHOUSENUMBER__",
                    "ITEMNUMBER__.WAREHOUSENUMBER__.NAME__"
                ];
                options.sortOrder.push("ITEMNUMBER__.VENDORNUMBER__.NAME__ ASC");
                options.sortOrder.push("ITEMNUMBER__.WAREHOUSENUMBER__.NAME__ ASC");
            }
            let currentQuery = ++g_totalQueriesVendors;
            const promises = g_catalogs
                .map((table) => Sys.GenericAPI.PromisedQuery({ ...options, table })
                .Catch(( /*error*/) => []));
            const queryResults = await Promise.all(promises);
            if (currentQuery === g_totalQueriesVendors) {
                const vendorValues = [], vendorsNumberArray = [];
                const warehouseValues = [], warehouseNumberArray = [];
                const [vendorNumberField, vendorNameField] = CConfiguration.useMultiSupplierItem
                    ? ["ITEMNUMBER__.VENDORNUMBER__", "ITEMNUMBER__.VENDORNUMBER__.NAME__"]
                    : ["VENDORNUMBER__", "VENDORNUMBER__.NAME__"];
                const vendorList = [].concat(...queryResults).sort((a, b) => b.NBITEMS - a.NBITEMS);
                for (const r of vendorList) {
                    if (r["ITEMNUMBER__.WAREHOUSENUMBER__"]) {
                        warehouseValues.push(`${r["ITEMNUMBER__.WAREHOUSENUMBER__"]}=${r["ITEMNUMBER__.WAREHOUSENUMBER__.NAME__"]} (${r.NBITEMS})`);
                        warehouseNumberArray.push(r["ITEMNUMBER__.WAREHOUSENUMBER__"]);
                    }
                    else {
                        vendorValues.push(`${r[vendorNumberField]}=${r[vendorNameField]} (${r.NBITEMS})`);
                        vendorsNumberArray.push(r[vendorNumberField]);
                    }
                }
                UpdateVendorFilter(vendorValues, vendorsNumberArray, warehouseNumberArray.length);
                UpdateWarehouseFilter(warehouseValues, warehouseNumberArray, vendorsNumberArray.length);
            }
        }
    }
    async function UpdateCategoriesList(searchValue, autoSelectCategorie) {
        let filter = await GetFilter(searchValue, false, true);
        const attributes = [
            "SUPPLYTYPEID__"
        ];
        const options = {
            table: CConfiguration.useMultiSupplierItem ? "P2P - CatalogItems__" : "PurchasingOrderedItems__",
            filter: filter,
            attributes: attributes,
            maxRecords: "FULL_RESULT",
            additionalOptions: "EnableJoin=1",
            groupBy: attributes
        };
        let currentQuery = ++g_totalQueriesCategorie;
        let promises = g_catalogs.map((table) => Sys.GenericAPI.PromisedQuery({ ...options, table })
            .Catch(( /*error*/) => []));
        const queryResults = await Promise.all(promises);
        if (currentQuery === g_totalQueriesCategorie) {
            const categorieList = new Set();
            if (queryResults) {
                for (const res of queryResults) {
                    if (res) {
                        for (const r of res) {
                            categorieList.add(r.SUPPLYTYPEID__);
                        }
                    }
                }
            }
            treeview_options.ChildrenFilter = [...categorieList];
            Controls.VerticalTreeview__.UpdateOptions(treeview_options, autoSelectCategorie, CustomScript.categorySelected === "*" ? null : CustomScript.categorySelected);
        }
    }
    let exchangeRatesCache = {};
    function UpdateExchangeRateCache(currencies) {
        return Sys.Helpers.Promise.Create((resolve, reject) => {
            Lib.P2P.ExchangeRate.GetExchangeRates(Data.GetValue("CompanyCode__"), currencies, (results, error) => {
                if (error) {
                    Log.Error("Error in UpdateExchangeRateCache :", error);
                    reject(error);
                }
                else {
                    if (results) {
                        for (const res of results) {
                            exchangeRatesCache[res.CurrencyFrom__] = new Sys.Decimal(Lib.P2P.ExchangeRate.ComputeExchangeRate(res.Rate__, res.RatioFrom__, res.RatioTo__) || 1);
                        }
                    }
                    resolve();
                }
            });
        });
    }
    function SelectDefaultVendorForCommonOrder(itemsCards) {
        let cardsByRUIDEX = itemsCards.reduce((groups, cardProperties) => {
            groups[cardProperties.ruidex] = groups[cardProperties.ruidex] || [];
            groups[cardProperties.ruidex].push(cardProperties);
            return groups;
        }, {});
        for (const ruidex in cardsByRUIDEX) {
            const cards = cardsByRUIDEX[ruidex];
            let bestWarehousePrice = Number.MAX_SAFE_INTEGER;
            let bestVendorPrice = Number.MAX_SAFE_INTEGER;
            let defaultWarehouse = null;
            let defaultVendor = null;
            for (const card of cards) {
                const localUnitPrice = new Sys.Decimal(card.initialUnitPrice || card.unitPrice || 0).mul(exchangeRatesCache[card.currency] || 1).toNumber();
                if (card.vendorNumber === Lib.P2P.UserProperties.GetValues(User.loginId).DefaultWarehouse__) {
                    defaultWarehouse = card.vendorNumber;
                    break;
                }
                else if (card.vendorType === "Warehouse" /* Lib.Purchasing.CatalogHelper.SupplierType.Warehouse */) {
                    if (localUnitPrice < bestWarehousePrice) {
                        bestWarehousePrice = localUnitPrice;
                        defaultWarehouse = card.vendorNumber;
                    }
                }
                else if (localUnitPrice < bestVendorPrice) {
                    bestVendorPrice = localUnitPrice;
                    defaultVendor = card.vendorNumber;
                }
            }
            for (const card of cards) {
                card.defaultVendor = defaultWarehouse || defaultVendor;
            }
        }
    }
    async function GetSupplyTypeFilter(getCategories) {
        let filterByIds;
        const activeCatalogFilter = GetActiveCatalogFilter();
        if (!getCategories) {
            if (CustomScript.categorySelected !== "*") {
                const ccChildren = SupplyType.manager.GetChildrenTree(Data.GetValue("CompanyCode__"), CustomScript.categorySelected);
                const emptyCCChildren = SupplyType.manager.GetChildrenTree(null, CustomScript.categorySelected);
                filterByIds = ldapUtil.FilterIn("SupplyTypeID__", [CustomScript.categorySelected, ...emptyCCChildren.concat(ccChildren).map(({ id }) => id)]);
            }
        }
        return activeCatalogFilter ? filterByIds : await SupplyType.manager.BuildFilter(Data.GetValue("CompanyCode__"), User, [filterByIds]);
    }
    CustomScript.GetSupplyTypeFilter = GetSupplyTypeFilter;
    function GetSearchFields(getCategories) {
        let standardSearchFields;
        if (CConfiguration.useMultiSupplierItem) {
            standardSearchFields = [
                "ItemNumber__",
                "ManufacturerPartID__",
                "ManufacturerName__",
                "Description__",
                "LongDescription__",
                "ItemNumber__.VendorNumber__.Name__"
            ];
            if (CConfiguration.inventoryManagement) {
                standardSearchFields.push("ItemNumber__.WarehouseNumber__.Name__");
            }
        }
        else {
            standardSearchFields = [
                "ItemNumber__",
                "ManufacturerPartID__",
                "ManufacturerName__",
                "ItemDescription__",
                "ItemLongDescription__",
                "VendorNumber__.Name__"
            ];
        }
        if (!getCategories && CustomScript.categorySelected === "*") {
            standardSearchFields.push("SupplyTypeID__.FullName__");
        }
        return CConfiguration.useMultiSupplierItem ? Lib.Purchasing.CatalogHelper.GetSearchableAttributes("searchOnCatalog", standardSearchFields) : standardSearchFields;
    }
    function BuildSearchFilter(searchValue, getCategories) {
        const searchFields = GetSearchFields(getCategories);
        const search = searchValue === null ? Controls.SearchField__.GetValue() : searchValue;
        if (CConfiguration.useMultiSupplierItem) {
            const values = search ? [] : ["*"];
            const keywordsFilters = [];
            const keywordsAttributes = [];
            if (search) {
                const keyWords = Lib.Purchasing.CatalogHelper.GetKeyWords();
                for (const searchPart of search.split(" ")) {
                    let keywordFilter;
                    if (searchPart.includes("=")) {
                        const [keyWord, val] = searchPart.split("=");
                        const lowercase = keyWord.toLocaleLowerCase();
                        if (keyWord && val && keyWords[lowercase]) {
                            keywordFilter = keyWords[lowercase].GetLDAPFilter(val);
                            keywordsAttributes.push(...keyWords[lowercase].attributes);
                        }
                    }
                    if (keywordFilter) {
                        keywordsFilters.push(keywordFilter);
                    }
                    else {
                        values.push(`*${searchPart}*`);
                    }
                }
            }
            const fieldsToSearch = searchFields.filter(searchField => !keywordsAttributes.includes(Lib.Purchasing.CatalogHelper.NormalizeAttribute(searchField)));
            const valuesFilters = values.map(value => {
                const valueFilters = fieldsToSearch.map(field => ldapUtil.FilterEqual(field, value));
                return valueFilters.length === 1 ? valueFilters[0] : ldapUtil.FilterOr(...valueFilters);
            });
            const inputFilters = valuesFilters.concat(keywordsFilters);
            return inputFilters.length === 1 ? inputFilters[0] : ldapUtil.FilterAnd(...inputFilters);
        }
        else {
            let searchFilterDescription = search ? `*${search}*` : "*";
            return ldapUtil.FilterOr(...searchFields.map(field => ldapUtil.FilterEqual(field, searchFilterDescription)));
        }
    }
    CustomScript.BuildSearchFilter = BuildSearchFilter;
    async function GetFilter(searchValue, getVendors, getCategories) {
        const allFilters = [];
        const activeCatalogFilter = GetActiveCatalogFilter();
        if (!getCategories) {
            const supplyTypeFilter = await GetSupplyTypeFilter(getCategories);
            if (supplyTypeFilter) {
                allFilters.push(supplyTypeFilter);
            }
        }
        if (!getVendors && (g_selectedSuppliers.vendors.length || g_selectedSuppliers.warehouses.length)) {
            let supplierFilter;
            if (g_selectedSuppliers.vendors.length) {
                const supplierNameAttribute = CConfiguration.useMultiSupplierItem ? "ITEMNUMBER__.VENDORNUMBER__" : "VendorNumber__";
                supplierFilter = ldapUtil.FilterIn(supplierNameAttribute, g_selectedSuppliers.vendors);
            }
            if (CConfiguration.inventoryManagement && g_selectedSuppliers.warehouses.length) {
                const warehouseFilter = ldapUtil.FilterIn("ITEMNUMBER__.WAREHOUSENUMBER__", g_selectedSuppliers.warehouses);
                supplierFilter = ldapUtil.FilterOr(supplierFilter, warehouseFilter);
            }
            allFilters.push(supplierFilter);
        }
        const searchedValueFilter = BuildSearchFilter(searchValue, getCategories);
        allFilters.push(searchedValueFilter);
        UpdateSendToPurchaseRequisitionLabel();
        if (activeCatalogFilter) {
            allFilters.push(activeCatalogFilter);
        }
        else {
            if (CConfiguration.useMultiSupplierItem) {
                allFilters.push(...(await Lib.Purchasing.CatalogHelper.GetCatalogFilters(CustomScript.g_companyCode, g_allowedWarehouses, false, false)));
            }
            else {
                allFilters.push(...(await Lib.Purchasing.CatalogHelper.GetCatalogV1Filters(CustomScript.g_companyCode)));
            }
        }
        return ldapUtil.FilterAnd(...allFilters).toString();
    }
    CustomScript.GetFilter = GetFilter;
    let OrderBy;
    (function (OrderBy) {
        OrderBy["NAME_ASC"] = "DESCRIPTION__ ASC";
        OrderBy["PRICE_ASC"] = "UNITPRICEINLOCALCURRENCY ASC";
        OrderBy["PRICE_DESC"] = "UNITPRICEINLOCALCURRENCY DESC";
        OrderBy["GHGE_ASC"] = "ITEMNUMBER__.ENERGYCONSUMPTIONKGCO2EPERUNIT__ ASC";
        OrderBy["LEADTIME_ASC"] = "ITEMNUMBER__.LEADTIME__ ASC";
        OrderBy["RISK_DESC"] = "ITEMNUMBER__.VENDORNUMBER__.NUMBER__.INTERNALSCORE__ DESC";
    })(OrderBy || (OrderBy = {}));
    CustomScript.ORDER_ON_COMMON = [
        OrderBy.NAME_ASC
    ];
    function IsCommonOrderBy() {
        return CustomScript.ORDER_ON_COMMON.includes(OrderBy[Controls.SortCriterion__.GetValue()]);
    }
    const UNITPRICEINLOCALCURRENCYAttribute = "((ITEMNUMBER__.UNITPRICE__*ITEMNUMBER__.CURRENCY__.RATE__*ITEMNUMBER__.CURRENCY__.RATIOTO__)/ITEMNUMBER__.CURRENCY__.RATIOFROM__) 'UNITPRICEINLOCALCURRENCY'";
    CustomScript.AdditionalAttributesByOrderByValue = {
        NAME_ASC: [],
        PRICE_ASC: [UNITPRICEINLOCALCURRENCYAttribute],
        PRICE_DESC: [UNITPRICEINLOCALCURRENCYAttribute],
        GHGE_ASC: [],
        LEADTIME_ASC: [],
        RISK_DESC: []
    };
    function ComputeSortOrder() {
        const sortCriterion = Controls.SortCriterion__.GetValue();
        let orderby = OrderBy[sortCriterion];
        if (orderby !== OrderBy.NAME_ASC) {
            orderby += ` NULLS LAST,${OrderBy.NAME_ASC}`;
        }
        return orderby;
    }
    CustomScript.ComputeSortOrder = ComputeSortOrder;
    async function SearchInCatalog(searchValue, refreshVendorList, autoSelectCategorie, clearVendorCardsSelection) {
        function formatQueryResult(result) {
            var _a, _b;
            const currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
            const vendorNumber = result.VENDORNUMBER__ || result["ITEMNUMBER__.VENDORNUMBER__"] || result["ITEMNUMBER__.WAREHOUSENUMBER__"];
            let uniqueID = result.RUIDEX + vendorNumber;
            let formattedResult = {
                ruidex: result.RUIDEX,
                productName: result.ITEMDESCRIPTION__,
                itemType: result.ITEMTYPE__,
                vendorName: result["VENDORNUMBER__.NAME__"],
                vendorNumber: vendorNumber,
                currency: result.ITEMCURRENCY__,
                imgUrl: Lib.Purchasing.GetCatalogImageUrl(result.IMAGE__ || "ItemNoImage.png"),
                punchout: !!result.PUNCHOUTSITENAME__,
                rawData: result,
                quantity: currentUserCart[uniqueID] ? currentUserCart[uniqueID].ITEMQUANTITY__ : 0,
                leadTime: result["ITEMNUMBER__.LEADTIME__"]
            };
            formattedResult.unitPrice = (_a = GetItemCurrentUnitPrice({
                ...result,
                ITEMQUANTITY__: formattedResult.quantity || 1
            })) === null || _a === void 0 ? void 0 : _a.toNumber();
            if (CConfiguration.useMultiSupplierItem) {
                const supplierName = result["ITEMNUMBER__.VENDORNUMBER__.NAME__"] || result["ITEMNUMBER__.WAREHOUSENUMBER__.NAME__"];
                formattedResult.productName = result.DESCRIPTION__;
                formattedResult.vendorName = supplierName;
                formattedResult.vendorType = result["ITEMNUMBER__.VENDORNUMBER__"] ? "Vendor" /* Lib.Purchasing.CatalogHelper.SupplierType.Vendor */ : "Warehouse" /* Lib.Purchasing.CatalogHelper.SupplierType.Warehouse */;
                formattedResult.currency = supplierName ? result["ITEMNUMBER__.CURRENCY__"] : result.DEFAULTCURRENCY__;
                formattedResult.punchout = CConfiguration.isPunchoutV2Enable && !!result["ITEMNUMBER__.PUNCHOUTSITENAME__"];
                if (!formattedResult.punchout) {
                    delete formattedResult.rawData["ITEMNUMBER__.PUNCHOUTSITENAME__"];
                }
                if (!Sys.Helpers.IsEmpty(result.STICKERID__)) {
                    formattedResult.sticker = {
                        name: result["STICKERID__.NAME__"],
                        color: result["STICKERID__.COLOR__"]
                    };
                }
                if (CConfiguration.inventoryManagement) {
                    formattedResult.stock = result["ITEMNUMBER__.AVAILABLESTOCK__"];
                }
                if (result["ITEMNUMBER__.PRICECONDITIONDATA__"]) {
                    formattedResult.initialUnitPrice = (_b = GetItemCurrentUnitPrice({
                        ...result,
                        ITEMQUANTITY__: 1
                    })) === null || _b === void 0 ? void 0 : _b.toNumber();
                    formattedResult.priceConditions = JSON.parse(result["ITEMNUMBER__.PRICECONDITIONDATA__"]);
                }
                if (Lib.Purchasing.IsGHGEnableForProcurement() && result["ITEMNUMBER__.ENERGYCONSUMPTIONKGCO2EPERUNIT__"]) {
                    formattedResult.ghgeValue = result["ITEMNUMBER__.ENERGYCONSUMPTIONKGCO2EPERUNIT__"];
                    formattedResult.ghgeUnit = Language.Translate("_GHGE_DefaultUnit");
                }
                if (Lib.Purchasing.Vendor.IsVendorRegistrationAvailable() && result["ITEMNUMBER__.VENDORNUMBER__.NUMBER__.INTERNALSCORE__"]) {
                    const score = parseInt(result["ITEMNUMBER__.VENDORNUMBER__.NUMBER__.INTERNALSCORE__"], 10);
                    formattedResult.vendorRisk = {
                        score: score,
                        color: Lib.Purchasing.Vendor.Client.GetScoreColor(score)
                    };
                }
            }
            if (CConfiguration.vendorInformation) {
                if (CConfiguration.useMultiSupplierItem) {
                    formattedResult.vendorStreet = result["ITEMNUMBER__.VENDORNUMBER__.STREET__"];
                    formattedResult.vendorCity = result["ITEMNUMBER__.VENDORNUMBER__.CITY__"];
                    formattedResult.vendorPostalCode = result["ITEMNUMBER__.VENDORNUMBER__.POSTALCODE__"];
                    formattedResult.vendorRegion = result["ITEMNUMBER__.VENDORNUMBER__.REGION__"];
                    formattedResult.vendorCountry = Sys.Locale.Country.GetCountryName(result["ITEMNUMBER__.VENDORNUMBER__.COUNTRY__"]);
                }
                else {
                    formattedResult.vendorStreet = result["VENDORNUMBER__.STREET__"];
                    formattedResult.vendorCity = result["VENDORNUMBER__.CITY__"];
                    formattedResult.vendorPostalCode = result["VENDORNUMBER__.POSTALCODE__"];
                    formattedResult.vendorRegion = result["VENDORNUMBER__.REGION__"];
                    formattedResult.vendorCountry = Sys.Locale.Country.GetCountryName(result["VENDORNUMBER__.COUNTRY__"]);
                }
            }
            if (CConfiguration.itemRating) {
                formattedResult.grade = result.GRADE__;
                formattedResult.gradeNumber = result.GRADENUMBER__ || result.GRADE_NUMBER__;
            }
            if (CConfiguration.publicPrice && result["ITEMNUMBER__.PUBLICPRICE__"]) {
                formattedResult.publicPrice = CConfiguration.useMultiSupplierItem ? result["ITEMNUMBER__.PUBLICPRICE__"] : result.PUBLICPRICE__;
                formattedResult.publicPriceCurrency = result.ITEMCURRENCY__;
            }
            else if (formattedResult.vendorName) {
                formattedResult.publicPrice = result.DEFAULTPUBLICPRICE__;
                formattedResult.publicPriceCurrency = result.DEFAULTCURRENCY__;
            }
            return formattedResult;
        }
        function GetItemCardCompanyStructureAddon(itemsCards) {
            let itemsCardsAddon = [];
            for (const item of itemsCards) {
                if (CustomScript.g_vendorCompanyExtendedPropertiesQueryCache[item.vendorNumber]) {
                    itemsCardsAddon.push({
                        ruidex: item.ruidex,
                        companyStructure: CustomScript.g_vendorCompanyExtendedPropertiesQueryCache[item.vendorNumber]
                    });
                }
            }
            return itemsCardsAddon;
        }
        async function CompleteVendorCompanyExtendedPropertiesCache(itemsCards) {
            let vendorLdapArray = [];
            let vendorToRequestArray = [];
            for (const item of itemsCards) {
                if (!CustomScript.g_vendorCompanyExtendedPropertiesQueryCache[item.vendorNumber] && !vendorToRequestArray.includes(item.vendorNumber)) {
                    vendorToRequestArray.push(item.vendorNumber);
                    vendorLdapArray.push(ldapUtil.FilterEqual("VendorNumber__", item.vendorNumber));
                }
            }
            const table = "Vendor_company_extended_properties__";
            const requestFilter = ldapUtil.FilterAnd(ldapUtil.FilterEqual("CompanyCode__", CustomScript.g_companyCode), ldapUtil.FilterOr(...vendorLdapArray));
            const fields = ["VendorNumber__", "CompanyCode__", "CompanyStructure__"];
            const options = {
                table: table,
                filter: requestFilter.toString(),
                attributes: fields,
                maxRecords: 100
            };
            const queryResults = await Sys.GenericAPI.PromisedQuery(options);
            if (queryResults.length > 0) {
                for (const res of queryResults) {
                    if (res) {
                        CustomScript.g_vendorCompanyExtendedPropertiesQueryCache[res.VendorNumber__] = res.CompanyStructure__;
                    }
                }
            }
            return GetItemCardCompanyStructureAddon(itemsCards);
        }
        clearTimeout(timeOut);
        let filter = await CustomScript.GetFilter(searchValue);
        const searchKey = filter + Controls.SortCriterion__.GetValue();
        if (searchKey !== CustomScript.lastSearchCache) {
            CustomScript.lastSearchCache = searchKey;
            let maxRecords = 50;
            let options = {
                table: "PurchasingOrderedItems__",
                filter: filter,
                attributes: Lib.Purchasing.CatalogHelper.CatalogItem.AttributesV1,
                sortOrder: "ITEMDESCRIPTION__ ASC",
                maxRecords: maxRecords,
                additionalOptions: "EnableJoin=1"
            };
            if (CConfiguration.useMultiSupplierItem) {
                options.table = "P2P - CatalogItems__";
                options.attributes = [...Lib.Purchasing.CatalogHelper.CatalogItem.FullQueryAttributesV2, ...CustomScript.AdditionalAttributesByOrderByValue[Controls.SortCriterion__.GetValue()]];
                options.sortOrder = ComputeSortOrder();
            }
            Controls.ProductCardsList__.ShowLoadingGifs();
            let currentQuery = ++g_totalQueries;
            await Sys.Parameters.IsReady();
            const promises = [];
            promises.push(Promise.all(g_catalogs.map((table) => Sys.GenericAPI.PromisedQuery({ ...options, table })
                .Catch(( /*error*/) => null)))
                .then(async (queryResults) => {
                if (currentQuery === g_totalQueries) {
                    let itemsCards = [];
                    let uniqueCardsID = [];
                    const currencies = [];
                    if (queryResults) {
                        for (const res of queryResults) {
                            if (res) {
                                for (const r of res) {
                                    const formattedQueryResult = formatQueryResult(r);
                                    itemsCards.push(formattedQueryResult);
                                    if (uniqueCardsID.indexOf(formattedQueryResult.ruidex) === -1) {
                                        uniqueCardsID.push(formattedQueryResult.ruidex);
                                    }
                                    if (currencies.indexOf(formattedQueryResult.currency) === -1) {
                                        currencies.push(formattedQueryResult.currency);
                                    }
                                }
                            }
                        }
                    }
                    try {
                        await UpdateExchangeRateCache(currencies);
                        if (IsCommonOrderBy()) {
                            SelectDefaultVendorForCommonOrder(itemsCards);
                        }
                    }
                    finally {
                        Controls.ProductCardsList__.SetCardsData(itemsCards, Data.GetValue("Currency__"), clearVendorCardsSelection);
                        UpdateResultCounter(uniqueCardsID.length);
                        if (CConfiguration.vendorInformation) {
                            const _itemsCardsAddon = await CompleteVendorCompanyExtendedPropertiesCache(itemsCards);
                            Controls.ProductCardsList__.UpdateCardsData(_itemsCardsAddon, Data.GetValue("Currency__"));
                        }
                    }
                }
            }));
            if (refreshVendorList) {
                promises.push(UpdateVendorList(searchValue));
            }
            promises.push(UpdateCategoriesList(searchValue, autoSelectCategorie));
            await Promise.all(promises);
        }
    }
    CustomScript.SearchInCatalog = SearchInCatalog;
    function GetItemCurrentUnitPrice(item) {
        const itemNumber = item.ITEMNUMBER__;
        const vendorNumber = item["ITEMNUMBER__.VENDORNUMBER__"];
        if (item["ITEMNUMBER__.PRICECONDITIONDATA__"]) {
            Lib.Purchasing.ConditionedPricing.PopulateCacheConditionedPricingData([{
                    ItemNumber__: itemNumber,
                    VendorNumber__: vendorNumber,
                    pricesData: JSON.parse(item["ITEMNUMBER__.PRICECONDITIONDATA__"])
                }]);
        }
        let unitPrice;
        let currency;
        if (CConfiguration.useMultiSupplierItem) {
            const isTemplateItem = !item["ITEMNUMBER__.VENDORNUMBER__"] && !item["ITEMNUMBER__.WAREHOUSENUMBER__"];
            unitPrice = isTemplateItem ? item.DEFAULTPUBLICPRICE__ : item["ITEMNUMBER__.UNITPRICE__"];
            currency = isTemplateItem ? item.DEFAULTCURRENCY__ : item["ITEMNUMBER__.CURRENCY__"];
        }
        else {
            unitPrice = item.ITEMUNITPRICE__;
            currency = item.CURRENCY__;
        }
        return Lib.Purchasing.ConditionedPricing.GetItemUnitPrice(itemNumber, vendorNumber, item.ITEMQUANTITY__, unitPrice, Lib.P2P.Currency.Get(currency));
    }
    function AddItemToCart(keyedQuantity, item) {
        let itemID = item.RUIDEX + (CConfiguration.useMultiSupplierItem ? item["ITEMNUMBER__.VENDORNUMBER__"] || item["ITEMNUMBER__.WAREHOUSENUMBER__"] : item.VENDORNUMBER__);
        let currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
        const existingCartItemIds = Object.keys(currentUserCart);
        let currentCartItem = currentUserCart[itemID];
        // In intake request catalog flow, only allow adding items to cart if the cart is empty or if the item is already in the cart.
        // This is to avoid users adding multiple items from the catalog when they are only supposed to add one item to link to their request.
        if (IsIntakeRequestCatalogFlow() && keyedQuantity > 0 && !currentCartItem && existingCartItemIds.length > 0) {
            Controls.ProductCardsList__.UpdateCardsData([
                {
                    ruidex: item.RUIDEX,
                    vendorNumber: CConfiguration.useMultiSupplierItem ? item["ITEMNUMBER__.VENDORNUMBER__"] || item["ITEMNUMBER__.WAREHOUSENUMBER__"] : item.VENDORNUMBER__,
                    quantity: 0
                }
            ], Data.GetValue("Currency__"));
            DisplaySnackbarSingleItemOnly();
            return;
        }
        if (item.ITEMTYPE__ == Lib.P2P.ItemType.AMOUNT_BASED) {
            itemID += ++g_uniqueCounter;
            currentCartItem = currentUserCart[itemID];
        }
        Data.StorageSetValue(g_CartLocalStorageUniqueCounter, g_uniqueCounter);
        if (currentCartItem) {
            if (keyedQuantity === 0) {
                delete currentUserCart[itemID];
            }
            else {
                let [quantity, overOrdered] = Lib.Purchasing.CatalogHelper.AvoidOverOrderStockQuantity(keyedQuantity, currentCartItem);
                if (overOrdered) {
                    DisplaySnackbarOverorder();
                }
                keyedQuantity = quantity;
                currentUserCart[itemID].ITEMQUANTITY__ = keyedQuantity;
            }
        }
        else {
            item.UNIQUEITEMID = itemID;
            item.ITEMQUANTITY__ = keyedQuantity;
            currentUserCart[itemID] = item;
        }
        Data.StorageSetValue(g_CartLocalStorageIndex, JSON.stringify(currentUserCart));
    }
    ;
    async function AddPunchoutItemsToCart(providerInfo, punchOutItems, cartLocalStorageKey, cartLocalStorageUniqueCounter) {
        let currentUserCart = JSON.parse(Data.StorageGetValue(cartLocalStorageKey)) || {};
        let uniqueCounterValue = parseInt(Data.StorageGetValue(cartLocalStorageUniqueCounter) || "1", 10);
        let hasRejectedExtraItem = false;
        let itemsWithErrors = [];
        let filter = "(&(Number__=" + providerInfo.SupplierID__ + ")(|(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")(CompanyCode__=)))";
        let fields = ["Number__", "Name__"];
        const vendor = (await Sys.GenericAPI.PromisedQuery({
            table: "AP - Vendors__",
            filter: filter,
            attributes: fields,
            maxRecords: 1
        }))[0];
        for (let punchOutItem of punchOutItems) {
            if (IsIntakeRequestCatalogFlow() && Object.keys(currentUserCart).length > 0) {
                hasRejectedExtraItem = true;
                break;
            }
            const result = Lib.Purchasing.Punchout.CheckPunchoutItem(punchOutItem);
            if (!result.error) {
                const key = punchOutItem.description + uniqueCounterValue;
                const item = {
                    "UNIQUEITEMID": key,
                    "DESCRIPTION__": punchOutItem.description,
                    "ITEMQUANTITY__": parseFloat(punchOutItem.quantity),
                    "ITEMINCXML__": punchOutItem.rawXmlIn,
                    "ITEMNUMBER__.CURRENCY__": punchOutItem.currency,
                    "ITEMNUMBER__.UNITPRICE__": parseFloat(punchOutItem.unitPrice),
                    "ITEMNUMBER__.VENDORNUMBER__": vendor.Number__,
                    "ITEMNUMBER__.VENDORNUMBER__.NAME__": vendor.Name__,
                    "punchOutItems": punchOutItem,
                    "providerInfo": providerInfo
                };
                currentUserCart[key] = item;
                ++uniqueCounterValue;
            }
            else {
                itemsWithErrors.push({ item: punchOutItem, error: result.error });
            }
        }
        if (hasRejectedExtraItem) {
            DisplaySnackbarSingleItemOnly();
        }
        // Display error popup containing items we can't process
        if (itemsWithErrors.length > 0) {
            Lib.Purchasing.Punchout.Errors.PopupPunchoutErrors(itemsWithErrors);
        }
        Data.StorageSetValue(cartLocalStorageUniqueCounter, uniqueCounterValue);
        Data.StorageSetValue(cartLocalStorageKey, JSON.stringify(currentUserCart));
    }
    function InitCardsList() {
        Controls.ProductCardsList__.OnItemsAddedToCart = AddItemToCart;
        Controls.ProductCardsList__.OnClickCart = function (item, quantity) {
            if (item) {
                let punchoutSiteName = item.PUNCHOUTSITENAME__ || item["ITEMNUMBER__.PUNCHOUTSITENAME__"];
                if (punchoutSiteName) {
                    Lib.Purchasing.Punchout.LoadConfigs(Data.GetValue("CompanyCode__"))
                        .Then((configs) => {
                        const currentConfig = configs.find((config) => {
                            return config.ConfigurationName__ === punchoutSiteName;
                        });
                        if (currentConfig) {
                            Lib.Purchasing.Punchout.PR.OpenPunchoutSite(currentConfig, item, g_CartLocalStorageIndex, g_CartLocalStorageUniqueCounter);
                        }
                    })
                        .Catch((error) => {
                        Log.Error("Error in InitCardsList OnClickCart PunchoutSiteName :", error);
                    });
                }
                else if (item.RUIDEX) {
                    let url = "FlexibleForm.aspx?action=run&layout=_flexibleform&Id=" + encodeURIComponent(item.RUIDEX) + "&fc=" + quantity;
                    if (g_PRLocalStorageIndex && CConfiguration.useMultiSupplierItem) {
                        url += "&ls=" + encodeURIComponent(g_PRLocalStorageIndex);
                    }
                    if (CConfiguration.useMultiSupplierItem) {
                        if (!Sys.Helpers.IsEmpty(item["ITEMNUMBER__.VENDORNUMBER__"])) {
                            url += "&vendorNumber=" + item["ITEMNUMBER__.VENDORNUMBER__"];
                        }
                        else if (!Sys.Helpers.IsEmpty(item["ITEMNUMBER__.WAREHOUSENUMBER__"])) {
                            url += "&warehouseNumber=" + item["ITEMNUMBER__.WAREHOUSENUMBER__"];
                        }
                    }
                    url += "&OnQuit=Close";
                    Process.OpenLink({ "url": url, "inCurrentTab": false });
                }
            }
        };
        let additionalComparisonProperties = [
            {
                label: "_LongDescription",
                itemKey: "LONGDESCRIPTION__"
            },
            {
                label: "_UnitOfMeasure",
                itemKey: "UNITOFMEASURE__"
            },
            {
                label: "_VendorFilter",
                itemKey: "ITEMNUMBER__.VENDORNUMBER__.NAME__"
            },
            {
                label: "_WarehouseFilter",
                itemKey: "ITEMNUMBER__.WAREHOUSENUMBER__.NAME__"
            },
            {
                label: "_SupplierPartID",
                itemKey: "ITEMNUMBER__.SUPPLIERPARTID__"
            },
            {
                label: "_SupplierPartAuxID",
                itemKey: "ITEMNUMBER__.SUPPLIERPARTAUXID__"
            },
            {
                label: "_CurrentStock",
                formatValue: function (rawData) {
                    return RemoveTrailingZero(rawData["ITEMNUMBER__.AVAILABLESTOCK__"]);
                }
            },
            {
                label: "_LeadTime",
                itemKey: "ITEMNUMBER__.LEADTIME__"
            },
            {
                label: "_ManufacturerName",
                itemKey: "MANUFACTURERNAME__"
            },
            {
                label: "_ManufacturerPartID",
                itemKey: "MANUFACTURERPARTID__"
            },
            {
                label: "_SupplyTypeName",
                itemKey: "SUPPLYTYPEID__.NAME__"
            },
            {
                label: "_UNSPSC",
                itemKey: "UNSPSC__"
            },
            {
                label: "_ContractName",
                itemKey: "ITEMNUMBER__.CONTRACTNAME__"
            }
        ];
        if (Lib.Purchasing.IsGHGEnableForProcurement()) {
            const leadTimeIndex = additionalComparisonProperties.findIndex(e => e.itemKey === "ITEMNUMBER__.LEADTIME__");
            additionalComparisonProperties.splice(leadTimeIndex, 0, {
                label: "_EnergyConsumptionKgCO2e",
                formatValue: function (rawData) {
                    return RemoveTrailingZero(rawData["ITEMNUMBER__.ENERGYCONSUMPTIONKGCO2EPERUNIT__"]);
                }
            });
        }
        const vendorNameIdex = additionalComparisonProperties.findIndex(e => e.itemKey === "ITEMNUMBER__.VENDORNUMBER__.NAME__");
        additionalComparisonProperties.splice(vendorNameIdex + 1, 0, {
            label: "_VendorInternalScore",
            formatValue: function (rawData) {
                const score = rawData["ITEMNUMBER__.VENDORNUMBER__.NUMBER__.INTERNALSCORE__"];
                return score ? Lib.Purchasing.Vendor.Client.GetScoreGaugeHTML(RemoveTrailingZero(score), false) : "";
            }
        });
        Controls.ProductCardsList__.SetAdditionalComparisonProperties(additionalComparisonProperties);
    }
    CustomScript.InitCardsList = InitCardsList;
    function InitCartSummary() {
        Controls.CartSummary__.SetWidth("355px");
        Controls.CartSummary__.OnDeleteItem = function (item /*, tableIndex: number*/) {
            let currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
            const itemID = item.GetValue("CartItemNumber__");
            const ruidex = currentUserCart[itemID].RUIDEX;
            const vendorNumber = CConfiguration.useMultiSupplierItem ? currentUserCart[itemID]["ITEMNUMBER__.VENDORNUMBER__"] || currentUserCart[itemID]["ITEMNUMBER__.WAREHOUSENUMBER__"] : currentUserCart[itemID].VENDORNUMBER__;
            delete currentUserCart[itemID];
            Data.StorageSetValue(g_CartLocalStorageIndex, JSON.stringify(currentUserCart));
            const itemToUpdate = {
                ruidex: ruidex,
                vendorNumber: vendorNumber,
                quantity: 0
            };
            Controls.ProductCardsList__.UpdateCardsData([itemToUpdate], Data.GetValue("Currency__"));
            setTimeout(function () {
                UpdateCartSummary();
            }, 30);
        };
        Controls.CartSummary__.CartItemQuantity__.OnChange = function () {
            const currentRow = this.GetRow();
            let keyedQuantity = currentRow.CartItemQuantity__.GetValue();
            let currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
            const itemID = currentRow.CartItemNumber__.GetValue();
            let currentCartItem = currentUserCart[itemID];
            if (currentCartItem) {
                if (keyedQuantity == 0) {
                    delete currentUserCart[currentRow.CartItemNumber__.GetValue()];
                    currentRow.GetItem().Remove();
                }
                else {
                    keyedQuantity = keyedQuantity < 0 ? 1 : keyedQuantity;
                    let [quantity, overOrdered] = Lib.Purchasing.CatalogHelper.AvoidOverOrderStockQuantity(keyedQuantity, currentCartItem);
                    if (overOrdered) {
                        DisplaySnackbarOverorder();
                    }
                    keyedQuantity = quantity;
                    currentCartItem.ITEMQUANTITY__ = keyedQuantity;
                }
                Data.StorageSetValue(g_CartLocalStorageIndex, JSON.stringify(currentUserCart));
                const itemToUpdate = {
                    ruidex: currentCartItem.RUIDEX,
                    vendorNumber: CConfiguration.useMultiSupplierItem ? currentCartItem["ITEMNUMBER__.VENDORNUMBER__"] || currentCartItem["ITEMNUMBER__.WAREHOUSENUMBER__"] : currentCartItem.VENDORNUMBER__,
                    quantity: keyedQuantity
                };
                Controls.ProductCardsList__.UpdateCardsData([itemToUpdate], Data.GetValue("Currency__"));
            }
        };
        Controls.CartSummary__.OnBlurRow = function (index) {
            const currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
            const itemID = Controls.CartSummary__.GetRow(index).CartItemNumber__.GetValue();
            if (currentUserCart[itemID] && currentUserCart[itemID].RUIDEX) {
                Controls.ProductCardsList__.SelectCard(currentUserCart[itemID].RUIDEX, false);
            }
        };
        Controls.CartSummary__.OnFocusRow = function (index) {
            const currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
            const itemID = Controls.CartSummary__.GetRow(index).CartItemNumber__.GetValue();
            if (currentUserCart[itemID] && currentUserCart[itemID].RUIDEX) {
                Controls.ProductCardsList__.SelectCard(currentUserCart[itemID].RUIDEX, true);
            }
        };
        Controls.SendToPurchaseRequisition__.OnClick = function () {
            function CartSuccessfullySent() {
                // Success
                ResetActiveCartStorage();
                Process.CloseTab();
            }
            let currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
            const items = Object.values(currentUserCart);
            if (!g_PRLocalStorageIndex) {
                const timestamp = new Date().getTime();
                const localStorageName = "cart" + timestamp;
                Data.StorageSetValue(localStorageName, JSON.stringify(items));
                let url = "FlexibleForm.aspx?action=run&layout=_flexibleform&pName=Purchase requisition V2&cartkey=" + localStorageName;
                Process.OpenLink({ url: url, inCurrentTab: false });
                CartSuccessfullySent();
            }
            else {
                let statusCode = Data.StorageSetValue(g_PRLocalStorageIndex, JSON.stringify(items));
                if (statusCode === 0) {
                    CartSuccessfullySent();
                }
                else if (statusCode === -1) {
                    Data.CleanLocalStorage("cart([0-9])*", true, function (key) {
                        let timestamp = new Date().getTime();
                        // Change me if you change the pattern :)
                        const existenceTime = timestamp - parseInt(key.substring(4), 10);
                        // Clean only if the key is in the local storage for more than 1 day
                        if (existenceTime / DayInMs > 1) {
                            return true;
                        }
                        return false;
                    });
                    // Try again after cleaning the storage
                    statusCode = Data.StorageSetValue(g_PRLocalStorageIndex, JSON.stringify(items));
                    if (statusCode === -1) {
                        // Cleaning not sufficient
                        Popup.Alert("_LocalStorage is full", true, null, "_Error localStoage full");
                    }
                    else {
                        CartSuccessfullySent();
                    }
                }
                else if (statusCode === -2) {
                    // LocalStorage is not supported
                    Popup.Alert("_LocalStorage not supported by your browser", true, null, "_Error localStoage probably not supported");
                }
            }
        };
    }
    function UpdateCartSummary() {
        const currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
        const table = Controls.CartSummary__;
        const items = Object.values(currentUserCart);
        table.SetItemCount(0);
        const lineCount = table.GetItemCount();
        let totalQuantity = 0;
        let totalPrice = 0;
        const currency = Data.GetValue("Currency__") || "";
        const currencyPrecision = Lib.P2P.Currency.Get(currency);
        function SetRowStyle(index, amountBased = false, isPunchoutItem = false) {
            setTimeout(function () {
                table.HideTableRowDeleteForItem(index, false);
                let row = table.GetRow(index);
                row.CartItemQuantity__.Hide(amountBased);
                row.CartItemQuantity__.SetReadOnly(amountBased || isPunchoutItem);
            }, 30);
        }
        table.HideTableRowDelete(items.length === 0);
        items.forEach((item, idx) => {
            const rowItem = idx >= lineCount ? table.AddItem() : table.GetRow(idx).GetItem();
            SetRowStyle(idx, item.ITEMTYPE__ === Lib.P2P.ItemType.AMOUNT_BASED, !!item.ITEMINCXML__);
            rowItem.SetValue("CartItemNumber__", item.UNIQUEITEMID);
            rowItem.SetValue("CartItemQuantity__", item.ITEMQUANTITY__);
            let itemCurrency, itemUnitPrice;
            if (CConfiguration.useMultiSupplierItem) {
                const supplierName = item["ITEMNUMBER__.VENDORNUMBER__.NAME__"] || item["ITEMNUMBER__.WAREHOUSENUMBER__.NAME__"];
                const isTemplateItem = !supplierName;
                rowItem.SetValue("CartItemDescription__", item.DESCRIPTION__);
                rowItem.SetValue("VendorName__", supplierName);
                itemCurrency = (isTemplateItem ? item.DEFAULTCURRENCY__ : item["ITEMNUMBER__.CURRENCY__"]) || currency;
                itemUnitPrice = isTemplateItem ? item.DEFAULTPUBLICPRICE__ : item["ITEMNUMBER__.UNITPRICE__"];
            }
            else {
                rowItem.SetValue("CartItemDescription__", item.ITEMDESCRIPTION__);
                rowItem.SetValue("VendorName__", item["VENDORNUMBER__.NAME__"]);
                itemCurrency = item.ITEMCURRENCY__ || currency;
                itemUnitPrice = item.ITEMUNITPRICE__;
            }
            const itemCurrencyPrecision = Lib.P2P.Currency.Get(itemCurrency);
            const unitPrice = GetItemCurrentUnitPrice(item) || 0;
            const itemTotalPrice = new Sys.Decimal(item.ITEMQUANTITY__ || 0).mul(unitPrice);
            const itemTotalPriceFormatted = !Sys.Helpers.IsEmpty(itemUnitPrice) ? Language.FormatNumber(itemTotalPrice.toNumber(), false, itemCurrencyPrecision.amountPrecision) + " " + itemCurrency : Language.Translate("_CardItem_EmptyValue");
            rowItem.SetValue("CartItemPrice__", itemTotalPriceFormatted);
            totalQuantity += item.ITEMQUANTITY__;
            const itemExchangeRate = Lib.P2P.CompanyCodesValue.GetValues(CustomScript.g_companyCode).currencies.GetRate(itemCurrency);
            totalPrice += itemTotalPrice.mul(itemExchangeRate || 1).toNumber();
        });
        Controls.CartSummaryHeader__.FireEvent("onChange", {
            label: Language.Translate("_Cart"),
            totalQuantity: totalQuantity >= 100 ? "99+" : totalQuantity,
            totalPrice: Language.FormatNumber(totalPrice, false, currencyPrecision.amountPrecision),
            currency: currency
        });
        Controls.SendToPurchaseRequisition__.SetDisabled(items.length === 0);
    }
    function UpdateCards(oldCards, newCards) {
        // oldCards : qty can be set to 0 on item details page (especially when remove the last item in the cart)
        const cards = { ...oldCards, ...newCards };
        const itemsToUpdate = [];
        Sys.Helpers.Object.ForEach(cards, (card, itemID) => {
            var _a;
            const itemToUpdate = {
                ruidex: card.RUIDEX,
                vendorNumber: CConfiguration.useMultiSupplierItem ? card["ITEMNUMBER__.VENDORNUMBER__"] || card["ITEMNUMBER__.WAREHOUSENUMBER__"] : card.VENDORNUMBER__
            };
            if (newCards[itemID]) // updated
             {
                itemToUpdate.quantity = card.ITEMTYPE__ == Lib.P2P.ItemType.AMOUNT_BASED ? 0 : card.ITEMQUANTITY__;
            }
            else // deleted
             {
                card.ITEMQUANTITY__ = 1;
                itemToUpdate.quantity = 0;
            }
            itemToUpdate.unitPrice = (_a = GetItemCurrentUnitPrice(card)) === null || _a === void 0 ? void 0 : _a.toNumber();
            itemsToUpdate.push(itemToUpdate);
        });
        Controls.ProductCardsList__.UpdateCardsData(itemsToUpdate, Data.GetValue("Currency__"));
    }
    Data.OnStorageChange(g_CartLocalStorageIndex, function (storageValue) {
        if (storageValue.newValue) {
            UpdateCartSummary();
            UpdateCards(JSON.parse(storageValue.oldValue), JSON.parse(storageValue.newValue));
        }
    });
    function InitSearchPane() {
        if (g_search) {
            Controls.SearchField__.SetValue(g_search);
        }
        Controls.SearchField__.SetBrowsable(true, {
            font: "esk-ifont-search-bold",
            fontColor: "text-color-color8",
            backgroundColor: "customSkin"
        });
        Controls.SearchField__.AddStyle("roundInputContainer");
        Controls.SearchField__.SetPlaceholder(Language.Translate("_SearchInCatalog"));
        Controls.SearchField__.OnBrowse = function () {
            ClearInitialCatalogFilter();
            SearchInCatalog(null, true, true, false);
        };
        Controls.SearchField__.OnEnter = function () {
            if (timeOut) {
                clearTimeout(timeOut);
            }
            ClearInitialCatalogFilter();
            SearchInCatalog(null, true, true, false);
        };
        // Must be kept enabled by default for existing Customer (before S335)
        const isAutoSearchEnable = !Sys.Parameters.GetInstance("P2P").GetParameterBool("DisableCatalogAutoSearch");
        if (isAutoSearchEnable) {
            Controls.SearchField__.OnTextChange = function (newSearch) {
                clearTimeout(timeOut);
                timeOut = setTimeout(function () {
                    ClearInitialCatalogFilter();
                    SearchInCatalog(newSearch, true, true, false);
                }, 300);
            };
        }
        Controls.SortCriterion__.OnChange = function () {
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                SearchInCatalog(null, true, false, !IsCommonOrderBy());
            }, 300);
        };
        let orderByList = [
            "NAME_ASC=_Name_Ascending",
            "PRICE_ASC=_Price_Ascending",
            "PRICE_DESC=_Price_Descending",
            "LEADTIME_ASC=_LeadTime_ascending"
        ];
        if (Lib.Purchasing.IsGHGEnableForProcurement()) {
            orderByList.push("GHGE_ASC=_GHGEmissions_ascending");
        }
        if (Lib.Purchasing.Vendor.IsVendorRegistrationAvailable()) {
            orderByList.push("RISK_DESC=_SupplierInternalScore_descending");
        }
        Controls.SortCriterion__.SetAvailableValues(orderByList);
        Controls.SortCriterion__.AddStyle("roundInputContainer");
        const defaultSortBy = "NAME_ASC";
        Controls.SortCriterion__.SetValue(defaultSortBy);
        Controls.SortCriterion__.Hide(!CConfiguration.displaySortBy);
        Controls.VerticalTreeview__.OnSelectItem = function (id /*, value: string*/) {
            CustomScript.categorySelected = id ? id : "*";
            SearchInCatalog(null, true, false, false);
        };
        Controls.VendorList__.OnChange = function (selectedVendors) {
            g_selectedSuppliers.vendors = selectedVendors;
            SearchInCatalog(null, false, true, false);
        };
        Controls.WarehouseList__.OnChange = function (selectedWarehouse) {
            g_selectedSuppliers.warehouses = selectedWarehouse;
            SearchInCatalog(null, false, true, false);
        };
        function SetTileLayout(layout) {
            Data.StorageSetValue(g_UserDisplayLayoutLocalStorageIndex, layout);
            Controls.ProductCardsList__.SetLayout(layout);
            Controls.ToggleCards__.SetTextColor("color1", layout === "Cards" ? "color1" : "color4");
            Controls.ToggleLists__.SetTextColor("color1", layout === "Lines" ? "color1" : "color4");
        }
        const defaultLayout = Data.StorageGetValue(g_UserDisplayLayoutLocalStorageIndex) || CConfiguration.defaultLayout;
        SetTileLayout(defaultLayout);
        Controls.ToggleCards__.OnClick = function () {
            SetTileLayout("Cards");
        };
        Controls.ToggleLists__.OnClick = function () {
            SetTileLayout("Lines");
        };
        UpdateResultCounter(0);
    }
    CustomScript.InitSearchPane = InitSearchPane;
    function InitPunchout() {
        Lib.Purchasing.Punchout.RegisterStorageChange(async (punchoutSession, punchoutOrderMessageResult) => {
            await AddPunchoutItemsToCart(punchoutSession.providerInfo, punchoutOrderMessageResult.items, punchoutSession.cartLocalStorageKey, punchoutSession.cartLocalStorageUniqueCounter);
        });
    }
    function DisplaySnackbarOverorder() {
        const Options = {
            message: Language.Translate("_notEnoughStock", false),
            timeout: 3000,
            status: "warning"
        };
        Popup.Snackbar(Options);
    }
    function InitDeprecatedFields() {
        var _a;
        const deprecatedFields = [
            "HorizontalTreeview__",
            "WarehouseFilter",
            "VendorFilter",
            "SearchButton__",
            "SpacerTop1__"
        ];
        for (let control of deprecatedFields) {
            (_a = Controls[control]) === null || _a === void 0 ? void 0 : _a.Hide(true);
        }
    }
    async function preloadAndStart() {
        try {
            InitDeprecatedFields();
            InitForm();
            await LoadCompanyCodeConfiguration();
            InitPunchout();
            InitSearchPane();
            InitCartSummary();
            InitCardsList();
            SearchInCatalog(null, true, true, true);
            UpdateCartSummary();
            Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
        }
        catch (error) {
            Log.Error(error);
        }
    }
    const promiseLayoutLoadAndStart = preloadAndStart();
    Sys.Helpers.Synchronizer.OnProgressFromPromise(promiseLayoutLoadAndStart, { progressDelay: 15000 });
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map