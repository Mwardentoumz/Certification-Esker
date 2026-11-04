"use strict";
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable dot-notation */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    const g_UserCartLocalStorageUniqueCounter = "ESKCart" + Lib.Purchasing.HashLoginID(User.loginId) + "UniqueCounter";
    const g_UserCartLocalStorageIndex = "ESKCart" + Lib.Purchasing.HashLoginID(User.loginId);
    let g_ToastTimeout = 0;
    let g_uniqueCounter = parseInt(Data.StorageGetValue(g_UserCartLocalStorageUniqueCounter) || "1", 10);
    CustomScript.g_fromCart = Process.GetURLParameter("fc");
    Sys.Helpers.EnableSmartSilentChange();
    ProcessInstance.SetSilentChange(true);
    ProcessInstance.SetFormWidth(1024);
    function DisplayVendorItem(settings, item) {
        let options = {
            "isVariablesAddress": true,
            "address": {
                "ToName": "ToRemove",
                "ToSub": item.GetValue("Sub__"),
                "ToMail": item.GetValue("Street__"),
                "ToPostal": item.GetValue("PostalCode__"),
                "ToCountry": item.GetValue("Country__"),
                "ToState": item.GetValue("Region__"),
                "ToCity": item.GetValue("City__"),
                "ToPOBox": item.GetValue("PostOfficeBox__"),
                "ForceCountry": true
            },
            "countryCode": "US"
        };
        Sys.GenericAPI.PromisedCheckPostalAddress(options)
            .Then(function (address) {
            Sys.Helpers.SilentChange(() => {
                // Display error message OR address without first line
                settings.controlName.SetValue(item.GetValue("Name__"));
                settings.controlAddress.SetValue(address.LastErrorMessage ? address.LastErrorMessage : address.FormattedBlockAddress.replace(/^[^\r\n]+(\r|\n)+/, ""));
            });
        });
    }
    function ClearVendorInfo() {
        Controls.VendorName__.SetValue("");
        Controls.VendorAddress__.SetValue("");
    }
    function FindAndDisplayVendorInformation(settings) {
        // Build filter
        let filter = "(&(" + settings.tableFieldName + "=" + Data.GetValue(settings.fieldName) + ")" + Controls[settings.fieldName].GetCustomFilter(true) + ")";
        // Do query
        Sys.GenericAPI.Query(settings.tableName, filter, settings.attributes, function (result, error) {
            if (error) {
                settings.controlName.SetValue("");
                settings.controlAddress.SetValue(Language.Translate("_Query on table {0} failed. Details: {1}", false, settings.tableName, error));
            }
            else if (result.length == 0) {
                settings.controlName.SetValue("");
                settings.controlAddress.SetValue(Language.Translate("_No vendor found", false));
            }
            else if (result.length > 1) {
                settings.controlName.SetValue("");
                settings.controlAddress.SetValue(Language.Translate("_Too many vendors found", false));
            }
            else {
                let item = {
                    data: result[0],
                    GetValue: function (id) {
                        return this.data[id];
                    }
                };
                DisplayVendorItem(settings, item);
                FindAndDisplayExtendedVendorInformation("CompanyStructure__", Controls.VendorBusinessStructure__);
            }
        }, "" /* sort */, 1 /* max count */, "" /* options */);
    }
    function FindAndDisplayExtendedVendorInformation(attribute, control) {
        const filter = `(&(CompanyCode__=${Controls.ItemCompanyCode__.GetValue()})(VendorNumber__=${Controls.VendorNumber__.GetValue()}))`;
        Sys.GenericAPI.Query("Vendor_company_extended_properties__", filter.toString(), [attribute], (result, error) => {
            if (!error && result.length === 1 && result[0] && result[0][attribute] && result[0][attribute].length > 0) {
                control.SetValue(result[0][attribute]);
            }
            else {
                control.Hide();
                if (error) {
                    Log.Error("Error getting extended vendor information");
                }
            }
        }, "" /* sort */, 1 /* max count */, "" /* options */);
    }
    Controls.VendorNumber__.SetAttributes("PostOfficeBox__|PostalCode__|Sub__|Street__|Region__|City__|Country__");
    Controls.VendorNumber__.OnChange = function () {
        if (Data.GetValue("VendorNumber__") == "") {
            ClearVendorInfo();
        }
    };
    Controls.VendorNumber__.OnSelectItem = function (item) {
        DisplayVendorItem({
            controlName: Controls.VendorName__,
            controlAddress: Controls.VendorAddress__
        }, item);
    };
    let CompanyCodeManager = {
        previousCompanyCode: "",
        HasDependencies: function () {
            return !Sys.Helpers.IsEmpty(Controls.ItemCurrency__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.SupplyTypeID__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.ItemGLAccount__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.VendorNumber__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.ItemTaxCode__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.Grade__.GetValue()) ||
                !Sys.Helpers.IsEmpty(Controls.Grade_number__.GetValue());
        },
        UpdateCompanyCodeDependencies: function () {
            LoadConfig();
            CompanyCodeManager.previousCompanyCode = Data.GetValue("ItemCompanyCode__");
            Controls.ItemCurrency__.SetValue("");
            Controls.SupplyTypeID__.SetValue("");
            Controls.ItemGLAccount__.SetValue("");
            Controls.VendorNumber__.SetValue("");
            Controls.VendorName__.SetValue("");
            Controls.VendorAddress__.SetValue("");
            Controls.ItemTaxCode__.SetValue("");
            Controls.Grade__.SetValue("");
            Controls.Grade_number__.SetValue("");
            Controls.PublicPrice__.SetValue("");
        },
        RevertCompanyCode: function () {
            Controls.ItemCompanyCode__.SetValue(CompanyCodeManager.previousCompanyCode);
        },
        Init: function () {
            CompanyCodeManager.previousCompanyCode = Data.GetValue("ItemCompanyCode__");
            if (!CompanyCodeManager.previousCompanyCode) {
                return Lib.P2P.UserProperties.QueryValues(User.loginId).Then(function (UserPropertiesValues) {
                    CompanyCodeManager.previousCompanyCode = UserPropertiesValues.CompanyCode__;
                    Data.SetValue("ItemCompanyCode__", CompanyCodeManager.previousCompanyCode);
                });
            }
            return Sys.Helpers.Promise.Resolve();
        }
    };
    Controls.ItemCompanyCode__.OnChange = function ( /*item*/) {
        if (CompanyCodeManager.HasDependencies()) {
            setTimeout(() => {
                Popup.Confirm("_This action will delete company code related fields.", false, CompanyCodeManager.UpdateCompanyCodeDependencies, CompanyCodeManager.RevertCompanyCode, "_Warning");
            });
        }
        else {
            LoadConfig();
        }
    };
    if (Data.GetValue("VendorNumber__")) {
        FindAndDisplayVendorInformation({
            fieldName: "VendorNumber__",
            tableName: "AP - Vendors__",
            tableFieldName: "Number__",
            attributes: [
                "Name__",
                "Sub__",
                "Street__",
                "PostOfficeBox__",
                "City__",
                "PostalCode__",
                "Region__",
                "Country__"
            ],
            controlName: Controls.VendorName__,
            controlAddress: Controls.VendorAddress__
        });
    }
    else {
        ClearVendorInfo();
    }
    function SetImgUrl() {
        let imageLink = Controls.Image__.GetValue() || "ItemNoImage.png";
        let html = "<div><img src=\"" + Lib.Purchasing.GetCatalogImageUrl(imageLink) + "\"></div>";
        Controls.ItemImg__.SetHTML(html);
    }
    SetImgUrl();
    Controls.ItemImageBrowse__.OnChange = function () {
        let browsedImage = this.GetText();
        if (browsedImage) {
            Controls.Image__.SetValue(browsedImage);
            this.SetValue("");
            SetImgUrl();
        }
    };
    Controls.Image__.OnBrowse = function () {
        Controls.ItemImageBrowse__.DoBrowse();
    };
    Controls.SupplyTypeID__.SetAttributes("Name__");
    Controls.SupplyTypeName__.OnBrowse = function () {
        Controls.SupplyTypeID__.DoBrowse();
    };
    function ResetSupplyTypeName() {
        Controls.SupplyTypeName__.SetValue("");
    }
    function FillSupplyTypeName() {
        let options = {
            table: "PurchasingSupply__",
            filter: "(&(SupplyID__=" + Controls.SupplyTypeID__.GetValue() + ")(CompanyCode__=" + Controls.ItemCompanyCode__.GetValue() + "))",
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
    FillSupplyTypeName();
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.SupplyTypeID__, function (item) {
        Controls.SupplyTypeName__.SetValue(item.GetValue("Name__"));
    }, ResetSupplyTypeName, ResetSupplyTypeName);
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
    Controls.Image__.OnChange = SetImgUrl;
    function HideDeprecatedFields() {
        if (Controls.AdvancedSectionPanel) {
            Controls.AdvancedSectionPanel.Hide(true);
        }
    }
    function InitAddToCartPane() {
        function SetTotalPrice() {
            const unitPrice = Controls.ItemUnitPrice__.GetValue();
            const currencyPrecision = Lib.P2P.Currency.Get(Controls.ItemCurrency__.GetValue());
            Controls.TotalPrice__.SetValue(Data.GetValue("ItemCurrency__") + " " + Language.FormatNumber(new Sys.Decimal(Controls.TotalQuantity__.GetValue() || 0).mul(unitPrice || 0).toNumber(), false, currencyPrecision.amountPrecision));
        }
        function UpdateCart(quantity) {
            let itemID = ProcessInstance.id + Data.GetValue("VendorNumber__");
            if (Data.GetValue("ItemType__") == Lib.P2P.ItemType.AMOUNT_BASED) {
                itemID += ++g_uniqueCounter;
            }
            Data.StorageSetValue(g_UserCartLocalStorageUniqueCounter, g_uniqueCounter);
            let currentUserCart = JSON.parse(Data.StorageGetValue(g_UserCartLocalStorageIndex)) || {};
            function SaveChange() {
                Data.StorageSetValue(g_UserCartLocalStorageIndex, JSON.stringify(currentUserCart));
                if (g_ToastTimeout !== 0) {
                    clearTimeout(g_ToastTimeout);
                }
                g_ToastTimeout = setTimeout(() => {
                    Popup.Snackbar({ message: Language.Translate("_CartSuccessfullyUpdated"), status: "success" });
                }, 500);
            }
            if (!!currentUserCart[itemID]) {
                if (quantity == 0) {
                    delete currentUserCart[itemID];
                }
                else {
                    currentUserCart[itemID]["ITEMQUANTITY__"] = quantity;
                }
                SaveChange();
            }
            else if (quantity > 0) {
                const options = {
                    table: "PurchasingOrderedItems__",
                    filter: "RUIDEX=" + ProcessInstance.id,
                    attributes: Lib.Purchasing.CatalogHelper.CatalogItem.AttributesV1,
                    sortOrder: "ITEMDESCRIPTION__ ASC",
                    maxRecords: 100,
                    additionalOptions: "EnableJoin=1"
                };
                Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    let newItem = queryResults[0];
                    newItem.UNIQUEITEMID = itemID;
                    newItem.ITEMQUANTITY__ = quantity;
                    currentUserCart[itemID] = newItem;
                    SaveChange();
                });
            }
        }
        function UpdateQuantityFromCart() {
            let quantity = 0;
            if (Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED) {
                const currentUserCart = JSON.parse(Data.StorageGetValue(g_UserCartLocalStorageIndex)) || {};
                const itemID = ProcessInstance.id + Data.GetValue("VendorNumber__");
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
            SetTotalPrice();
        };
        Controls.AddToCard__.Hide(Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED);
        Controls.AddToCard__.OnClick = function () {
            UpdateCart(1);
            SetTotalPrice();
        };
        Data.OnStorageChange(g_UserCartLocalStorageIndex, function (storageValue) {
            if (storageValue.newValue) {
                UpdateQuantityFromCart();
            }
        });
    }
    function InitBackToCartPane() {
        Controls.BackToCartLink__.SetValue("< " + Language.Translate("_Back to cart"));
        Controls.BackToCartLink__.DisplayAs({ type: "Link" });
        Controls.BackToCartLink__.OnClick = function () {
            ProcessInstance.Quit("quit");
        };
    }
    function InitFieldFollowingItemType() {
        if (Data.GetValue("ItemType__") == Lib.P2P.ItemType.AMOUNT_BASED) {
            Controls.UnitOfMeasure__.Hide(true);
            Data.SetValue("UnitOfMeasure__", "");
            Controls.TotalQuantity__.Hide(true);
        }
        else {
            Controls.UnitOfMeasure__.Hide(false);
            Controls.TotalQuantity__.Hide(false);
        }
    }
    function Init() {
        InitFieldFollowingItemType();
        Controls.ItemType__.OnChange = InitFieldFollowingItemType;
        HideDeprecatedFields();
        Controls.ItemImageBrowse__.Hide(true);
        Sys.Parameters.GetInstance("P2P").IsReady(() => {
            Controls.PunchoutSiteName__.Hide(Sys.Parameters.GetInstance("P2P").GetParameter("EnablePunchoutV2") !== "1" || (CustomScript.g_fromCart && Data.IsNullOrEmpty("PunchoutSiteName__")));
            Lib.P2P.InitItemTypeControl(Controls.ItemType__);
        });
        const EnableItemRating = Sys.Parameters.GetInstance("PAC").GetParameter("EnableItemRating", false);
        if (CustomScript.g_fromCart) {
            Controls.AddToCartPane.Hide(false);
            Controls.AddToCartPane.SetReadOnly(false);
            Controls.ItemCompanyCode__.Hide(true);
            InitAddToCartPane();
            InitBackToCartPane();
            Controls.ItemImg.Hide(false);
            Controls.ItemImg.SetReadOnly(true);
            Controls.DataPanel.Hide(false);
            Controls.DataPanel.SetReadOnly(true);
            Controls.VendorInformationPanel.Hide(false);
            Controls.VendorInformationPanel.SetReadOnly(true);
            Controls.PriceConditionPanel.Hide(true);
            Controls.AnalyticsPane.Hide(true);
            Controls.AnalyticsPane.SetReadOnly(true);
            Controls.ImagesPane.Hide(true);
            Controls.ImagesPane.SetReadOnly(true);
            Controls.BackToCartPane__.Hide(false);
            Controls.Save.Hide(true);
            Controls.Close.Hide(true);
            Controls.Delete.Hide(true);
            Controls.SupplyTypeID__.Hide(true);
            Controls.ValidityDate__.Hide(true);
            Controls.ExpirationDate__.Hide(true);
            Controls.SupplyTypeName__.SetBrowsable(false);
            Controls.Locked__.Hide(true);
            Controls.ItemType__.Hide(true);
            Controls.Grade__.Hide(true);
            Controls.Grade_number__.Hide(true);
            Controls.ItemTags__.Hide(true);
            Controls.TagsDisplay__.Hide(!EnableItemRating);
            Controls.GradeDisplay__.Hide(!EnableItemRating || Data.IsNullOrEmpty("Grade__"));
            Controls.ItemLongDescription__.Hide(Data.IsNullOrEmpty("ItemLongDescription__"));
            Controls.ItemSupplierPartAuxID__.Hide(Data.IsNullOrEmpty("ItemSupplierPartAuxID__"));
            Controls.ManufacturerName__.Hide(Data.IsNullOrEmpty("ManufacturerName__"));
            Controls.ManufacturerPartID__.Hide(Data.IsNullOrEmpty("ManufacturerPartID__"));
            Process.SetHelpId(5008);
        }
        else {
            Controls.AddToCartPane.Hide(true);
            Controls.BackToCartPane__.Hide(true);
            Controls.ImagesPane.Hide(ProcessInstance.isReadOnly);
            Controls.AnalyticsPane.Hide(ProcessInstance.isReadOnly);
            Controls.SupplyTypeID__.Hide(ProcessInstance.isReadOnly);
            Controls.Locked__.Hide(ProcessInstance.isReadOnly);
            Controls.ItemType__.Hide(!Sys.Parameters.GetInstance("PAC").GetParameter("DisplayItemType"));
            Controls.PublicPrice__.Hide(!Sys.Parameters.GetInstance("PAC").GetParameter("EnablePublicPrice", false));
            // Section for items rating + preferred items
            Controls.Grade__.Hide(!EnableItemRating);
            Controls.Grade_number__.Hide(!EnableItemRating);
            Controls.ItemTags__.Hide(!EnableItemRating);
            Controls.TagsDisplay__.Hide(true);
            Controls.GradeDisplay__.Hide(true);
            Controls.ContractNumber__.Hide(false);
            Controls.ContractName__.Hide(false);
            ProcessInstance.SetSilentChange(false);
        }
        InitInventoryPane();
    }
    CustomScript.Init = Init;
    function InitInventoryPane() {
        const hideInventoryPane = !Lib.P2P.Inventory.IsEnabled() || !!CustomScript.g_fromCart;
        Controls.Inventory_pane.Hide(hideInventoryPane);
        Controls.InventoryMovementsChart__.SetAdditionalFilter(`(&(CompanyCode__=${Data.GetValue("ItemCompanyCode__")})(ItemNumber__=${Data.GetValue("ItemNumber__")}))`);
        Controls.InventoryMovementsChart__.Refresh();
    }
    /** ******************* **/
    /** Form initialization **/
    /** ******************* **/
    let GlobalLayout = {
        panes: [
            "BackToCartPane__",
            "ItemImg",
            "AddToCartPane",
            "DataPanel",
            "VendorInformationPanel",
            "AnalyticsPane",
            "ImagesPane"
        ].map((name) => Controls[name]),
        actionButtons: ["Save",
            "Close",
            "Delete"].map((name) => Controls[name]),
        HideWaitScreen: function (hide) {
            // async call just after boot
            setTimeout(function () {
                Controls.ItemCompanyCode__.Wait(!hide);
            });
        },
        Hide: function (hide) {
            GlobalLayout.panes.forEach(function (pane) {
                pane.Hide(hide);
            });
            GlobalLayout.actionButtons.forEach(function (button) {
                button.Hide(hide);
            });
            Log.TimeStamp("HideWaitScreen : " + !hide);
            GlobalLayout.HideWaitScreen(!hide);
        }
    };
    GlobalLayout.Hide(true);
    Controls.GradeDisplay__.BindEvent("OnLoad", function () {
        const gradeVal = Data.GetValue("Grade__");
        if (gradeVal) {
            Controls.GradeDisplay__.FireEvent("onLoad", {
                grade: gradeVal,
                gradeNumber: Data.GetValue("Grade_number__")
            });
        }
        else {
            Controls.GradeDisplay__.Hide(true);
        }
    });
    Controls.TagsDisplay__.BindEvent("OnLoadTags", function () {
        const tagsVal = Data.GetValue("ItemTags__");
        if (tagsVal) {
            Controls.TagsDisplay__.FireEvent("onLoadTags", { tags: tagsVal });
        }
        else {
            Controls.TagsDisplay__.Hide(true);
        }
    });
    function LoadConfig() {
        Lib.P2P.CompanyCodesValue.QueryValues(Data.GetValue("ItemCompanyCode__")).Then(function (CCValues) {
            if (Object.keys(CCValues).length > 0) {
                Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
            }
            else {
                Log.Error("The requested company code is not in the company code table.");
            }
            Sys.Parameters.GetInstance("PAC").IsReady(() => {
                GlobalLayout.Hide(false);
                Init();
                Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
            });
        });
    }
    CompanyCodeManager.Init()
        .Then(LoadConfig);
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map