"use strict";
var CustomScript;
(function (CustomScript) {
    var VendorItemProperties = Lib.Purchasing.CatalogHelper.VendorItemProperties;
    const g_PRLocalStorageIndex = Process.GetURLParameter("ls");
    const g_IsIntakeRequestCatalogFlow = g_PRLocalStorageIndex === null || g_PRLocalStorageIndex === void 0 ? void 0 : g_PRLocalStorageIndex.startsWith("irCatalog");
    const g_UserCartLocalStorageUniqueCounter = "ESKCart" + Lib.Purchasing.HashLoginID(User.loginId) + "UniqueCounter";
    const g_UserCartLocalStorageIndex = "ESKCart" + Lib.Purchasing.HashLoginID(User.loginId);
    const g_CartLocalStorageUniqueCounter = g_IsIntakeRequestCatalogFlow ? `${g_PRLocalStorageIndex}CartUniqueCounter` : g_UserCartLocalStorageUniqueCounter;
    const g_CartLocalStorageIndex = g_IsIntakeRequestCatalogFlow ? `${g_PRLocalStorageIndex}Cart` : g_UserCartLocalStorageIndex;
    let g_ToastTimeout = 0;
    let g_uniqueCounter = parseInt(Data.StorageGetValue(g_CartLocalStorageUniqueCounter) || "1", 10);
    let g_catalogItem;
    const g_fromCart = Process.GetURLParameter("fc");
    const g_fromContract = Process.GetURLParameter("fromContract");
    const g_vendorNumber = Process.GetURLParameter("vendorNumber");
    const g_warehouseNumber = Process.GetURLParameter("warehouseNumber");
    function IsIntakeRequestCatalogFlow() {
        return !!g_IsIntakeRequestCatalogFlow;
    }
    function DisplaySnackbarSingleItemOnly() {
        Popup.Snackbar({
            message: Language.Translate("_OnlyOneCatalogItemAllowedForIntakeRequest", false),
            timeout: 3000,
            status: "warning"
        });
    }
    //#region HELPERS
    class Configuration {
        static get isItemRatingEnabled() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("EnableItemRating", false);
        }
        static get isPublicPriceEnabled() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("EnablePublicPrice", false);
        }
        static get isItemTypeEnabled() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("DisplayItemType", false);
        }
        static get isGHGeEnabled() {
            return Lib.Purchasing.IsGHGEnableForProcurement();
        }
    }
    //#endregion HELPERS
    class CompanyCodeManager {
        constructor() {
            this.companyCode = Data.GetValue("CompanyCode__");
            Controls.CompanyCode__.OnChange = this.OnCompanyCodeChange.bind(this);
        }
        static HasDependencies() {
            return !Sys.Helpers.IsEmpty(Controls.SupplyTypeID__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.GLAccount__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.TaxCode__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.Grade__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.GradeNumber__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.StickerID__.GetValue());
        }
        static LoadConfiguration() {
            return Lib.P2P.CompanyCodesValue.QueryValues(Data.GetValue("CompanyCode__"))
                .Then(function (CCValues) {
                if (Object.keys(CCValues).length > 0) {
                    Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
                }
                else {
                    Log.Error("The requested company code is not in the company code table.");
                }
                return Sys.Parameters.IsReady();
            });
        }
        async Init() {
            if (!this.companyCode) {
                const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(User.loginId);
                this.companyCode = UserPropertiesValues.CompanyCode__;
                Data.SetValue("CompanyCode__", this.companyCode);
            }
            await CompanyCodeManager.LoadConfiguration();
        }
        async UpdateCompanyCodeDependencies() {
            this.companyCode = Data.GetValue("CompanyCode__");
            Controls.SupplyTypeID__.SetValue("");
            Controls.GLAccount__.SetValue("");
            Controls.TaxCode__.SetValue("");
            Controls.Grade__.SetValue("");
            Controls.GradeNumber__.SetValue("");
            Data.SetValue("StickerID__", "");
            await CompanyCodeManager.LoadConfiguration();
            SetStickerContent();
        }
        RevertCompanyCode() {
            Controls.CompanyCode__.SetValue(this.companyCode);
        }
        OnCompanyCodeChange( /*item*/) {
            if (CompanyCodeManager.HasDependencies()) {
                setTimeout(() => {
                    Popup.Confirm("_This action will delete company code related fields.", false, () => this.UpdateCompanyCodeDependencies(), () => this.RevertCompanyCode(), "_Warning");
                });
            }
            else {
                CompanyCodeManager.LoadConfiguration();
            }
        }
    }
    //#region IMAGE
    function SetImgUrl() {
        const imageLink = Controls.Image__.GetValue() || "ItemNoImage.png";
        const html = "<div><img src=\"" + Lib.Purchasing.GetCatalogImageUrl(imageLink) + "\"></div>";
        Controls.ItemImage__.SetHTML(html);
    }
    Controls.ImageBrowse__.OnChange = function () {
        const browsedImage = this.GetText();
        if (browsedImage) {
            Controls.Image__.SetValue(browsedImage);
            this.SetValue("");
            SetImgUrl();
        }
    };
    Controls.Image__.OnChange = SetImgUrl;
    Controls.Image__.OnBrowse = function () {
        Controls.ImageBrowse__.DoBrowse();
    };
    //#endregion IMAGE
    //#region SUPPLYTYPE
    Controls.SupplyTypeID__.SetAttributes("Name__");
    Controls.SupplyTypeName__.OnBrowse = function () {
        Controls.SupplyTypeID__.DoBrowse();
    };
    function ResetSupplyTypeName() {
        Controls.SupplyTypeName__.SetValue("");
    }
    function FillSupplyTypeName() {
        const supplyTypeId = Controls.SupplyTypeID__.GetValue();
        if (!supplyTypeId) {
            Log.Error("No supply type id too query");
            return;
        }
        const options = {
            table: "PurchasingSupply__",
            filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", Controls.CompanyCode__.GetValue()), Sys.Helpers.LdapUtil.FilterEqual("SupplyID__", Controls.SupplyTypeID__.GetValue())).toString(),
            attributes: ["Name__"]
        };
        Sys.GenericAPI.PromisedQuery(options)
            .Then(function (queryResults) {
            Sys.Helpers.SilentChange(() => {
                Controls.SupplyTypeName__.SetValue(queryResults[0]["Name__"]);
            });
        })
            .Catch(function () {
            ResetSupplyTypeName();
        });
    }
    Controls.UNSPSC__.OnChange = function () {
        Lib.Purchasing.Items.QueryUNSPSCSupplyType(Controls.UNSPSC__.GetValue())
            .Then(function (result) {
            if (result && result.length) {
                let supplyTypeId = result[0].SupplyTypeId__;
                let customSupplyTypeId = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetSupplyTypeIdFromUNSPSC", Controls.UNSPSC__.GetValue(), supplyTypeId);
                supplyTypeId = customSupplyTypeId || supplyTypeId;
                Controls.SupplyTypeID__.SetValue(supplyTypeId);
                FillSupplyTypeName();
            }
        });
    };
    //#endregion SUPPLYTYPE
    //#region GRADE
    Controls.GradeDisplay__.BindEvent("OnLoad", function () {
        const gradeVal = Data.GetValue("Grade__");
        if (gradeVal) {
            Controls.GradeDisplay__.FireEvent("onLoad", {
                grade: gradeVal,
                gradeNumber: Data.GetValue("GradeNumber__")
            });
        }
        else {
            Controls.GradeDisplay__.Hide(true);
        }
    });
    //#endregion
    //#region ITEMTYPE
    function InitFieldFollowingItemType() {
        const isAmountBased = Data.GetValue("ItemType__") == Lib.P2P.ItemType.AMOUNT_BASED;
        Controls.UnitOfMeasure__.Hide(isAmountBased);
        Controls.TotalQuantity__.Hide(isAmountBased);
        if (isAmountBased) {
            Data.SetValue("UnitOfMeasure__", "");
        }
    }
    //#endregion ITEMTYPE
    //#region PurchasingCart
    function InitAddToCartPane() {
        function SetTotalPrice() {
            const isTemplateItem = g_catalogItem.providersItemProperties.length === 0;
            const currency = isTemplateItem ? Controls.DefaultCurrency__.GetValue() : Controls.Currency__.GetValue();
            const currencyPrecision = Lib.P2P.Currency.Get(currency);
            const priceConditionDataString = Controls.PriceConditionData__.GetValue() || "";
            const vendorNumber = Controls.VendorNumber__.GetValue();
            const itemNumber = Data.GetValue("ItemNumber__");
            if (priceConditionDataString !== "") {
                Lib.Purchasing.ConditionedPricing.PopulateCacheConditionedPricingData([{
                        ItemNumber__: itemNumber,
                        VendorNumber__: vendorNumber,
                        pricesData: JSON.parse(priceConditionDataString)
                    }]);
            }
            const unitPrice = Lib.Purchasing.ConditionedPricing.GetItemUnitPrice(itemNumber, vendorNumber, Controls.TotalQuantity__.GetValue() || 1, isTemplateItem ? Controls.DefaultPublicPrice__.GetValue() : Controls.UnitPrice__.GetValue(), Lib.P2P.Currency.Get(Controls.Currency__.GetValue()));
            Sys.Helpers.SilentChange(() => {
                if (isTemplateItem) {
                    Controls.DefaultPublicPrice__.SetPrecisionMin(currencyPrecision.amountPrecision);
                    Controls.DefaultPublicPrice__.SetPrecision(currencyPrecision.unitPricePrecision);
                    Controls.DefaultPublicPrice__.SetValue(unitPrice === null || unitPrice === void 0 ? void 0 : unitPrice.toNumber());
                }
                else {
                    Controls.UnitPrice__.SetPrecisionMin(currencyPrecision.amountPrecision);
                    Controls.UnitPrice__.SetPrecision(currencyPrecision.unitPricePrecision);
                    Controls.UnitPrice__.SetValue(unitPrice.toNumber());
                }
            });
            let totalPrice = "--";
            if (unitPrice || (unitPrice != null && unitPrice.toNumber() === 0)) {
                totalPrice = Language.FormatNumber(new Sys.Decimal(Controls.TotalQuantity__.GetValue() || 0).mul(unitPrice).toNumber(), false, currencyPrecision.amountPrecision);
            }
            Controls.TotalPrice__.SetValue((currency ? currency + " " : "") + totalPrice);
        }
        function UpdateCart(keyedQuantity) {
            const vendorNumber = Controls.VendorNumber__.GetValue() || "";
            let itemID = ProcessInstance.id + vendorNumber;
            let currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
            const existingCartItemIds = Object.keys(currentUserCart);
            let currentCartItem = currentUserCart[itemID];
            if (IsIntakeRequestCatalogFlow() && keyedQuantity > 0 && !currentCartItem && existingCartItemIds.length > 0) {
                DisplaySnackbarSingleItemOnly();
                UpdateQuantityFromCart();
                return;
            }
            if (Data.GetValue("ItemType__") == Lib.P2P.ItemType.AMOUNT_BASED) {
                itemID += ++g_uniqueCounter;
                currentCartItem = currentUserCart[itemID];
            }
            Data.StorageSetValue(g_CartLocalStorageUniqueCounter, g_uniqueCounter);
            function SaveChange(isOverOrdered) {
                Data.StorageSetValue(g_CartLocalStorageIndex, JSON.stringify(currentUserCart));
                if (isOverOrdered) {
                    const Options = {
                        message: Language.Translate("_notEnoughStock", false),
                        status: "warning"
                    };
                    if (g_ToastTimeout !== 0) {
                        clearTimeout(g_ToastTimeout);
                    }
                    g_ToastTimeout = setTimeout(() => {
                        Popup.Snackbar(Options);
                    }, 500);
                }
                else {
                    if (g_ToastTimeout !== 0) {
                        clearTimeout(g_ToastTimeout);
                    }
                    g_ToastTimeout = setTimeout(() => {
                        Popup.Snackbar({ message: Language.Translate("_CartSuccessfullyUpdated"), status: "success" });
                    }, 500);
                }
            }
            let quantity = 0;
            let overOrdered = false;
            if (!!currentCartItem) {
                if (keyedQuantity == 0) {
                    delete currentUserCart[itemID];
                }
                else {
                    [quantity, overOrdered] = Lib.Purchasing.CatalogHelper.AvoidOverOrderStockQuantity(keyedQuantity, currentCartItem);
                    keyedQuantity = quantity;
                    currentUserCart[itemID]["ITEMQUANTITY__"] = keyedQuantity;
                }
                SaveChange(overOrdered);
            }
            else if (keyedQuantity > 0) {
                currentUserCart[itemID] = {
                    ...g_catalogItem.GetRawData(vendorNumber),
                    UNIQUEITEMID: itemID,
                    ITEMQUANTITY__: keyedQuantity
                };
                SaveChange(overOrdered);
            }
        }
        function UpdateQuantityFromCart() {
            let quantity = 0;
            if (Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED) {
                const currentUserCart = JSON.parse(Data.StorageGetValue(g_CartLocalStorageIndex)) || {};
                const itemID = ProcessInstance.id + (Controls.VendorNumber__.GetValue() || "");
                if (!!currentUserCart[itemID]) {
                    quantity = currentUserCart[itemID]["ITEMQUANTITY__"];
                }
            }
            else {
                quantity = 1;
            }
            Controls.TotalQuantity__.SetValue(quantity);
            SetTotalPrice();
        }
        UpdateQuantityFromCart();
        Controls.TotalQuantity__.OnChange = function () {
            let quantity = Controls.TotalQuantity__.GetValue();
            if (quantity <= 0) {
                quantity = 0;
                Controls.TotalQuantity__.SetValue(quantity);
            }
            UpdateCart(quantity);
        };
        Controls.AddToCart__.Hide(Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED);
        Controls.AddToCart__.OnClick = function () {
            UpdateCart(1);
        };
        Data.OnStorageChange(g_CartLocalStorageIndex, function (storageValue) {
            if (storageValue.newValue) {
                UpdateQuantityFromCart();
            }
        });
    }
    function InitBackToCartPane() {
        Controls.BackToCartLink__.SetValue("< " + Language.Translate("_BackToCart"));
        Controls.BackToCartLink__.DisplayAs({ type: "Link" });
        Controls.BackToCartLink__.OnClick = function () {
            ProcessInstance.Quit("quit");
        };
    }
    //#endregion PurchasingCart
    //#region VENDOR
    function LoadVendorItem() {
        if (g_fromCart || g_fromContract) {
            const filter = [{
                    itemNumber: Controls.ItemNumber__.GetValue(),
                    supplierID: g_vendorNumber || g_warehouseNumber
                }];
            return Lib.Purchasing.CatalogHelper.GetItems(filter)
                .Then((catalogItems) => {
                if (!catalogItems.length) {
                    Log.Error("No supplier item found with filter", filter);
                    return;
                }
                else if (catalogItems.length > 1) {
                    Log.Warn(catalogItems.length + " items found with filter ", filter);
                }
                g_catalogItem = catalogItems[0];
            });
        }
        return Sys.Helpers.Promise.Resolve();
    }
    function InitVendorItemFields() {
        if (g_catalogItem) {
            const isTemplateItem = g_catalogItem.providersItemProperties.length === 0;
            HideVendorItemFields(isTemplateItem);
            if (!isTemplateItem) {
                const vendorItemProperties = g_catalogItem.providersItemProperties[0];
                FillVendorItemData(vendorItemProperties);
                if (vendorItemProperties instanceof VendorItemProperties) {
                    FillPriceConditionsData(vendorItemProperties.priceConditionData);
                }
            }
            InitAddToCartPane();
        }
        else {
            HideVendorItemFields(true);
        }
    }
    class PriceConditiontableDisplay extends Lib.Purchasing.ConditionedPricing.PriceConditionDisplayer {
        constructor(panel, textModel, table, priceConditionData) {
            super();
            this.originPriceData = priceConditionData;
            this.originPricingType = priceConditionData.type;
            this.originCurrency = g_catalogItem.providersItemProperties[0].currency || "USD";
            this.ctrlPane = panel;
            this.ctrlTextModelDescription = textModel;
            this.ctrlTableConditions = table;
            this.ctrlColumnNumber = table.ColumnLabel__;
            this.ctrlColumnThreshold = table.ColumnThreshold__;
            this.ctrlColumnRangeTextThreshold = table.ColumnRangeTextThreshold__;
            this.ctrlColumnMaxThreshold = table.ColumnMaxThreshold__;
            this.ctrlColumnBase = table.ColumnBase__;
            this.ctrlColumnUnitPrice = table.ColumnUnitPrice__;
            this.currencyPrecision = Lib.P2P.Currency.Get(this.originCurrency);
        }
        Init() {
            this.ctrlPane.SetLabel("_" + this.originPricingType);
            this.ctrlTextModelDescription.SetText(Language.Translate(`_TextModelDescription_${this.originPricingType}`));
            this.ctrlTextModelDescription.AddStyle("text-emphasis");
            this.InitTable();
        }
        InitTable() {
            this.PRICING_TYPES[this.originPricingType]();
            this.ctrlColumnUnitPrice.SetLabel(`_ColumnUnitPrice_${this.originPricingType}`);
            this.ctrlColumnUnitPrice.SetPrecision(this.currencyPrecision.unitPricePrecision);
            this.ctrlColumnUnitPrice.SetPrecisionMin(this.currencyPrecision.amountPrecision);
            this.ctrlTableConditions.SetWidth("100%");
            this.ctrlTableConditions.SetExtendableColumn("ColumnRangeTextThreshold__");
            this.ctrlTableConditions.OnRefreshRow = (index) => {
                const row = this.ctrlTableConditions.GetRow(index);
                row.ColumnUnitPrice__.AddSurroundingText(this.originCurrency);
            };
        }
        Fill() {
            this.InitOldConditionedPricingData();
        }
    }
    function FillPriceConditionsData(priceConditionDataJSON) {
        try {
            const priceConditionData = JSON.parse(priceConditionDataJSON);
            if (!priceConditionData) {
                Controls.PriceConditions.Hide(true);
                return;
            }
            Controls.PriceConditions.Hide(false);
            const displayer = new PriceConditiontableDisplay(Controls.PriceConditions, Controls.ModelDescription__, Controls.PriceThresholds__, priceConditionData);
            displayer.Init();
            displayer.Fill();
        }
        catch (e) {
            Log.Error("Price Conditions Error", e.message || e);
            Controls.PriceConditions.Hide(true);
        }
    }
    function FillVendorItemData(vendorItemProperties) {
        // General information panel
        Controls.UnitPrice__.SetValue(vendorItemProperties.unitPrice);
        Controls.Currency__.SetValue(vendorItemProperties.currency);
        Controls.LeadTime__.SetValue(vendorItemProperties.leadtime);
        Controls.Locked__.SetValue(vendorItemProperties.locked);
        // Vendor information
        Controls.VendorNumber__.SetValue(vendorItemProperties.SourceNumber);
        Controls.VendorName__.SetValue(vendorItemProperties.SourceName);
        if (vendorItemProperties instanceof VendorItemProperties) {
            Controls.PunchoutSiteName__.SetValue(vendorItemProperties.punchoutsitename);
            Controls.ValidityDate__.SetValue(vendorItemProperties.validityDate);
            Controls.ExpirationDate__.SetValue(vendorItemProperties.expirationDate);
            Controls.PublicPrice__.SetValue(vendorItemProperties.publicPrice);
            Controls.EnergyConsumptionKgCO2ePerUnit__.SetValue(vendorItemProperties.energyConsumptionKgCO2ePerUnit);
            Controls.SupplierPartID__.SetValue(vendorItemProperties.supplierPartID);
            Controls.SupplierPartAuxID__.SetValue(vendorItemProperties.supplierPartAuxID);
            Controls.PriceConditionData__.SetValue(vendorItemProperties.priceConditionData);
            if (Lib.Purchasing.Vendor.IsVendorRegistrationAvailable() && !Sys.Helpers.IsEmpty(vendorItemProperties.vendorInternalScore)) {
                Controls.VendorInternalScore__.SetHTML(Lib.Purchasing.Vendor.Client.GetScoreGaugeHTML(vendorItemProperties.vendorInternalScore));
            }
            else {
                Controls.VendorInternalScore__.Hide(true);
                Controls.VendorInternalScoreSpacerLine__.Hide(true);
            }
            vendorItemProperties.GetVendorAddress()
                .Then((address) => {
                Controls.VendorAddress__.SetValue(address);
            })
                .Catch((error) => {
                Log.Error("Error getting vendor address. Details: ", error);
                Controls.VendorAddress__.Hide(true);
            });
            const options = {
                table: "Vendor_company_extended_properties__",
                filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Controls.CompanyCode__.GetValue()), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorItemProperties.SourceNumber)).toString(),
                attributes: ["CompanyStructure__"],
                additionalOptions: {
                    recordBuilder: Sys.GenericAPI.BuildQueryResult
                }
            };
            Sys.GenericAPI.PromisedQuery(options)
                .Then((results) => {
                if (results && results[0]) {
                    Controls.VendorBusinessStructure__.SetValue(results[0].GetValue("CompanyStructure__"));
                }
            })
                .Catch(error => {
                Controls.VendorBusinessStructure__.Hide(true);
                Log.Error("Error getting extended vendor information", error);
            });
        }
        else {
            Controls.EnergyConsumptionKgCO2ePerUnit__.Hide(true);
            Controls.VendorInternalScoreSpacerLine__.Hide(true);
            Controls.VendorAddress__.Hide(true);
            Controls.VendorBusinessStructure__.Hide(true);
        }
    }
    function HideVendorItemFields(hide = true) {
        // General Information
        Controls.PunchoutSiteName__.Hide(hide || !Configuration.isPublicPriceEnabled || !Controls.PunchoutSiteName__.GetValue());
        Controls.ValidityDate__.Hide(hide);
        Controls.ExpirationDate__.Hide(hide);
        Controls.UnitPrice__.Hide(hide);
        Controls.PublicPrice__.Hide(hide || !Configuration.isPublicPriceEnabled);
        Controls.Currency__.Hide(hide);
        Controls.EnergyConsumptionKgCO2ePerUnit__.Hide(hide);
        Controls.LeadTime__.Hide(hide);
        Controls.SupplierPartAuxID__.Hide(hide || !Controls.SupplierPartAuxID__.GetValue());
        Controls.Locked__.Hide(hide);
        // Vendor inforations
        Controls.VendorDetails.Hide(hide);
        Controls.PriceConditions.Hide(true);
    }
    //#endregion VENDOR
    //#region STICKER
    function OnSelectSticker(item) {
        const html = Lib.Purchasing.CatalogHelper.Sticker.GetHTMLFromDBItem(item);
        SetStickerContent(html);
    }
    function SetStickerContent(html) {
        Controls.TagsDisplay__.SetHTML(html);
        Controls.TagsDisplay__.Hide(!html);
    }
    async function InitSticker() {
        Controls.StickerID__.Hide(!!g_fromCart || !!g_fromContract);
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.StickerID__, OnSelectSticker, OnSelectSticker, OnSelectSticker);
        let stickerHTMLhtml = "";
        if (g_catalogItem && g_catalogItem.sticker) {
            Data.SetValue("StickerID__", g_catalogItem.sticker.id);
            stickerHTMLhtml = Lib.Purchasing.CatalogHelper.Sticker.GetHTML(g_catalogItem.sticker);
        }
        else if (!Data.IsNullOrEmpty("StickerID__") && !Data.IsNullOrEmpty("CompanyCode__")) {
            const stickerID = Data.GetValue("StickerID__");
            const companyCode = Data.GetValue("CompanyCode__");
            const sticker = await Lib.Purchasing.CatalogHelper.Sticker.QueryStickers([{ id: stickerID, companyCode }]);
            stickerHTMLhtml = Lib.Purchasing.CatalogHelper.Sticker.GetHTMLFromDBItem(sticker[0]);
        }
        SetStickerContent(stickerHTMLhtml);
    }
    //#endregion STICKER
    //#region INIT
    async function OnFormLoaded() {
        g_layout.Hide(false);
        g_layout.SetReadOnly(!!g_fromCart || ProcessInstance.isReadOnly);
        Controls.ImageBrowse__.Hide(true);
        SetImgUrl();
        InitFieldFollowingItemType();
        Lib.P2P.InitItemTypeControl(Controls.ItemType__);
        if (g_fromCart || g_fromContract) {
            InitVendorItemFields();
            Controls.Save.Hide(true);
            Controls.Close.Hide(true);
            Controls.Delete.Hide(true);
            Controls.SupplyTypeID__.Hide(true);
            Controls.SupplyTypeName__.SetBrowsable(false);
            Controls.ValidityDate__.Hide(true);
            Controls.ExpirationDate__.Hide(true);
            Controls.ItemType__.Hide(true);
            Controls.Image__.Hide(true);
            Controls.Grade__.Hide(true);
            Controls.GradeNumber__.Hide(true);
            Controls.GradeDisplay__.Hide(!Configuration.isItemRatingEnabled || Data.IsNullOrEmpty("Grade__"));
            Controls.Locked__.Hide(true);
            Controls.LongDescription__.Hide(Data.IsNullOrEmpty("LongDescription__"));
            Controls.ManufacturerName__.Hide(Data.IsNullOrEmpty("ManufacturerName__"));
            Controls.ManufacturerPartID__.Hide(Data.IsNullOrEmpty("ManufacturerPartID__"));
            Controls.DefaultPublicPrice__.Hide(Data.IsNullOrEmpty("DefaultPublicPrice__"));
            Controls.DefaultCurrency__.Hide(Data.IsNullOrEmpty("DefaultCurrency__"));
            Controls.EnergyConsumptionKgCO2ePerUnit__.Hide(!Configuration.isGHGeEnabled);
            Process.SetHelpId(5008);
            if (g_fromCart) {
                Controls.AddToCartPane.SetReadOnly(false);
                Controls.BackToCartPane.SetReadOnly(false);
                Controls.AnalyticsPane.Hide(true);
                InitBackToCartPane();
            }
            else if (g_fromContract) {
                Controls.AddToCartPane.Hide(true);
                Controls.AddToCartPane.SetReadOnly(true);
                Controls.BackToCartPane.Hide(true);
            }
        }
        else {
            Controls.AddToCartPane.Hide(true);
            Controls.AddToCartPane.SetReadOnly(true);
            Controls.BackToCartPane.Hide(true);
            HideVendorItemFields(true);
            Controls.Image__.Hide(ProcessInstance.isReadOnly);
            Controls.AnalyticsPane.Hide(ProcessInstance.isReadOnly);
            Controls.SupplyTypeID__.Hide(ProcessInstance.isReadOnly);
            FillSupplyTypeName();
            Controls.ItemType__.Hide(!Configuration.isItemTypeEnabled);
            // Section for items rating + preferred items
            Controls.Grade__.Hide(!Configuration.isItemRatingEnabled);
            Controls.GradeNumber__.Hide(!Configuration.isItemRatingEnabled);
            Controls.GradeDisplay__.Hide(true);
        }
        await InitSticker();
    }
    async function Init() {
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        g_layout.Hide(true);
        await g_companyCodeManager.Init();
        await LoadVendorItem();
        await OnFormLoaded();
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    //#endregion INIT
    const panes = ["BackToCartPane", "AddToCartPane", "VendorDetails", "ImagePane", "DataPanel", "AnalyticsPane", "PriceConditions"];
    const buttons = ["Save", "Close", "Delete"];
    const deprecatedControls = ["Spacer_line11__", "Spacer3__", "Tags__"];
    const g_layout = new Lib.P2P.Layout.Manager(panes, buttons, deprecatedControls);
    const g_companyCodeManager = new CompanyCodeManager();
    Init();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map