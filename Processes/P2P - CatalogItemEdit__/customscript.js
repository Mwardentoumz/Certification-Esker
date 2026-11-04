"use strict";
/* eslint-disable class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// noinspection JSMethodCanBeStatic
var CustomScript;
(function (CustomScript) {
    var PricingType = Lib.Purchasing.ConditionedPricing.Type;
    var ConditionedPricingFactory = Lib.Purchasing.ConditionedPricing.Factory;
    var NB_THRESHOLD_MAX = Lib.Purchasing.ConditionedPricing.NB_THRESHOLD_MAX;
    var VendorItemProperties = Lib.Purchasing.CatalogHelper.VendorItemProperties;
    var WarehouseItemProperties = Lib.Purchasing.CatalogHelper.WarehouseItemProperties;
    class Configuration {
        static get isPublicPriceEnable() {
            return Sys.Parameters.GetInstance("PAC").GetParameterBool("EnablePublicPrice", false);
        }
        static get isItemTypeEnable() {
            return Sys.Parameters.GetInstance("PAC").GetParameterBool("DisplayItemType", false);
        }
        static get isPunchoutV2Enable() {
            return Sys.Parameters.GetInstance("P2P").GetParameterBool("EnablePunchoutV2", false);
        }
        static get isInventoryManagementEnable() {
            return Lib.P2P.Inventory.IsEnabled();
        }
        static get isContractManagementEnable() {
            return Lib.Contract.IsEnabled();
        }
        static get isGHGForProcurementEnable() {
            return Lib.Purchasing.IsGHGEnableForProcurement();
        }
    }
    class CompanyCodeManager {
        constructor() {
            Controls.CompanyCode__.OnChange = this.OnCompanyCodeChange.bind(this);
        }
        static HasDependencies() {
            return Controls.VendorItems__.GetItemCount() !== 0
                || Controls.WarehouseItems__.GetItemCount() !== 0
                || !Sys.Helpers.IsEmpty(Controls.SupplyTypeID__.GetValue())
                || !Sys.Helpers.IsEmpty(Controls.UnitOfMeasure__.GetValue())
                || !Sys.Helpers.IsEmpty(Controls.TaxCode__.GetValue())
                || !Sys.Helpers.IsEmpty(Controls.GLAccount__.GetValue())
                || !Sys.Helpers.IsEmpty(Controls.StickerID__.GetValue());
        }
        async LoadConfiguration() {
            this.companyCode = Data.GetValue("CompanyCode__");
            const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(this.companyCode);
            if (Object.keys(CCValues).length > 0) {
                await Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
                this.currency = CCValues.Currency__;
                if (!existingItem) {
                    Data.SetValue("DefaultCurrency__", CCValues.Currency__);
                }
            }
            else {
                Log.Error("The requested company code is not in the company code table.");
            }
            await Sys.Parameters.IsReady();
        }
        async LoadDefaultCompanyCode() {
            const userPropertiesValues = await Lib.P2P.UserProperties.QueryValues(User.loginId);
            this.companyCode = Data.GetValue("CompanyCode__");
            if (!this.companyCode) {
                this.companyCode = userPropertiesValues.CompanyCode__;
            }
            if (!existingItem) {
                Data.SetValue("CompanyCode__", this.companyCode);
            }
            await this.LoadConfiguration();
            await punchoutManager.LoadPunchoutConfigs();
        }
        async UpdateCompanyCodeDependencies() {
            this.companyCode = Data.GetValue("CompanyCode__");
            Controls.VendorItems__.SetItemCount(0);
            Controls.WarehouseItems__.SetItemCount(0);
            Controls.SupplyTypeName__.SetValue("");
            Controls.SupplyTypeID__.SetValue("");
            Controls.UnitOfMeasure__.SetValue("");
            Controls.TaxCode__.SetValue("");
            Controls.GLAccount__.SetValue("");
            Data.SetValue("StickerID__", "");
            await this.LoadConfiguration();
            await punchoutManager.LoadPunchoutConfigs();
            UpdateGeneralInformationPane();
            UpdateVendorItemsPane();
            UpdateWarehouseItemsPane();
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
                this.LoadConfiguration();
                punchoutManager.LoadPunchoutConfigs();
            }
        }
    }
    class PunchoutManager {
        constructor() {
            this.punchoutConfigs = [];
            Lib.Purchasing.Punchout.RegisterStorageChange(() => {
                Log.Info("Punchout storage change detected");
            });
        }
        InitPunchout() {
            setTimeout(() => {
                this.RefreshRows();
            }, 100);
        }
        async LoadPunchoutConfigs() {
            this.punchoutConfigs = await Lib.Purchasing.Punchout.LoadConfigs(Data.GetValue("CompanyCode__"));
        }
        CheckPunchoutVendorCoherency(row) {
            const item = row.GetItem();
            if (!item) {
                return;
            }
            const config = this.GetPunchoutConfig(item.GetValue("PunchoutSiteName__"));
            if (config && config.SupplierID__ !== item.GetValue("VendorNumber__")) {
                row.PunchoutSiteName__.SetError("_Selected vendor different from punchout {0}", config.SupplierID__);
            }
            else {
                row.PunchoutSiteName__.SetError("");
            }
            const isPunchoutItem = row.IsPunchoutItem__.GetValue();
            row.IsPunchoutItem__.SetError("");
            if (isPunchoutItem) {
                const punchoutConfigs = punchoutManager.GetVendorPunchoutConfigs(row.VendorNumber__.GetValue());
                if (punchoutConfigs.length > 0 && !row.PunchoutSiteName__.GetValue()) {
                    row.PunchoutSiteName__.SetValue(punchoutConfigs[0].ConfigurationName__);
                    row.ContractName__.SetValue(punchoutConfigs[0].ContractName__);
                }
                else if (row.PunchoutSiteName__.GetValue()) {
                    row.ContractName__.SetValue(config.ContractName__);
                }
                if (punchoutConfigs.length == 0) {
                    row.IsPunchoutItem__.SetError("_noPunchoutConfigurationForThisVendor");
                }
            }
            else {
                row.PunchoutSiteName__.SetValue("");
            }
        }
        RefreshRows() {
            const nbLine = Controls.VendorItems__.GetItemCount();
            for (let i = 0; i < nbLine; i++) {
                this.RefreshRow(Controls.VendorItems__.GetRow(i));
            }
        }
        RefreshRow(row) {
            if (Configuration.isPunchoutV2Enable) {
                const isPunchoutItem = !!row.IsPunchoutItem__.GetValue() && !row.IsPunchoutItem__.GetError();
                if (isPunchoutItem) {
                    const punchoutConfig = this.GetPunchoutConfig(row.PunchoutSiteName__.GetValue());
                    row.UnitPrice__.SetValue("");
                    row.PriceConditionData__.SetValue("");
                    row.Currency__.SetValue("");
                    row.LeadTime__.SetValue("");
                    row.ContractName__.SetValue(punchoutConfig === null || punchoutConfig === void 0 ? void 0 : punchoutConfig.ContractName__);
                    row.ContractNumber__.SetValue("");
                    row.ContractRUIDEX__.SetValue("");
                    row.ContractReferenceNumber__.SetValue("");
                    row.EnergyConsumptionKgCO2ePerUnit__.SetValue("");
                    row.PriceConditionType__.SetValue("");
                }
                row.PunchoutTester__.Hide(!isPunchoutItem);
                row.PunchoutSiteName__.Hide(!isPunchoutItem);
                row.UnitPrice__.SetReadOnly(isPunchoutItem);
                row.PriceConditionType__.SetReadOnly(isPunchoutItem);
                row.PriceConditionType__.Hide(isPunchoutItem);
                row.Currency__.SetReadOnly(isPunchoutItem);
                row.LeadTime__.SetReadOnly(isPunchoutItem);
                row.ContractName__.SetReadOnly(isPunchoutItem);
                row.EnergyConsumptionKgCO2ePerUnit__.SetReadOnly(isPunchoutItem);
                RefreshPriceConditionRow(row);
            }
        }
        GetVendorPunchoutConfigs(vendorNumber) {
            return this.punchoutConfigs.filter((config) => { return config.SupplierID__ == vendorNumber; });
        }
        GetPunchoutConfig(configurationName) {
            return this.punchoutConfigs.find((config) => { return config.ConfigurationName__ == configurationName; });
        }
        RemoveDataSetForDisplayOnly() {
            Sys.Helpers.Data.ForEachTableItem("VendorItems__", function (item, index) {
                if (item.GetValue("IsPunchoutItem__")) {
                    item.SetValue("ContractName__", "");
                }
            });
        }
        UpdatePunchoutColumnsVisibility() {
            if (Configuration.isPunchoutV2Enable) {
                let canBeOrderOnPunchoutSite = false;
                let moreThanOneConfig = false;
                let hasError = false;
                let hasPunchoutItems = false;
                let hasRegularItems = false;
                Sys.Helpers.Data.ForEachTableItem("VendorItems__", function (item, index) {
                    const vendorsPunchoutConfigs = punchoutManager.GetVendorPunchoutConfigs(item.GetValue("VendorNumber__"));
                    if (vendorsPunchoutConfigs.length > 0) {
                        canBeOrderOnPunchoutSite = true;
                        moreThanOneConfig || (moreThanOneConfig = vendorsPunchoutConfigs.length > 1 && item.GetValue("IsPunchoutItem__"));
                    }
                    if (item.GetValue("IsPunchoutItem__")) {
                        hasPunchoutItems = true;
                    }
                    else {
                        hasRegularItems = true;
                    }
                    if (item.GetError("PunchoutSiteName__")) {
                        hasError = true;
                    }
                    return false;
                });
                Controls.VendorItems__.UnitPrice__.Hide(!hasRegularItems);
                Controls.VendorItems__.Currency__.Hide(!hasRegularItems);
                Controls.VendorItems__.EnergyConsumptionKgCO2ePerUnit__.Hide(!hasRegularItems);
                Controls.VendorItems__.LeadTime__.Hide(!hasRegularItems);
                const isPriceConditionVisible = hasRegularItems && Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED;
                Controls.VendorItems__.PriceConditionType__.Hide(!isPriceConditionVisible);
                Controls.VendorItems__.PriceConditionEdit__.Hide(!isPriceConditionVisible);
                const punchoutVisibility = canBeOrderOnPunchoutSite || hasPunchoutItems || hasError;
                Controls.VendorItems__.IsPunchoutItem__.Hide(!punchoutVisibility);
                Controls.VendorItems__.PunchoutTester__.Hide(!punchoutVisibility);
                const punchoutSiteNameVisibility = (hasPunchoutItems && canBeOrderOnPunchoutSite && moreThanOneConfig) || hasError;
                Controls.VendorItems__.PunchoutSiteName__.Hide(!punchoutSiteNameVisibility);
                this.RefreshRows();
            }
            else {
                Controls.VendorItems__.PunchoutSiteName__.Hide(true);
                Controls.VendorItems__.PunchoutTester__.Hide(true);
            }
        }
    }
    let ComboboxPricingTypeNone;
    (function (ComboboxPricingTypeNone) {
        ComboboxPricingTypeNone["NONE"] = "NoConditionnedPricing";
    })(ComboboxPricingTypeNone || (ComboboxPricingTypeNone = {}));
    class PriceConditionDialogHandler extends Lib.Purchasing.ConditionedPricing.PriceConditionDisplayer {
        constructor(control) {
            super();
            this.originControl = control;
            const row = this.originControl.GetRow();
            const oldPriceDataStr = row.PriceConditionData__.GetValue();
            this.originPriceData = oldPriceDataStr ? JSON.parse(oldPriceDataStr) : null;
            this.originUnitPrice = row.UnitPrice__.GetValue() || 0;
            this.originCurrency = row.Currency__.GetValue() || "USD";
            this.originPricingType = row.PriceConditionType__.GetSelectedOption();
            this.currencyPrecision = Lib.P2P.Currency.Get(this.originCurrency);
        }
        DisplayErrorMessage(e) {
            Log.Warn(e);
            this.ctrlErrorMessage.Hide(false);
            this.ctrlErrorMessage.SetValue(Language.Translate(e.translationKey || "_GenericErrorMessage"));
        }
        RemoveErrorMessge() {
            this.ctrlErrorMessage.Hide(true);
            this.ctrlErrorMessage.SetValue("");
        }
        UpdateSimulation() {
            try {
                this.ctrlPriceSimulation.SetValue(null);
                if (this.TableConditionsHasError()) {
                    return;
                }
                let newQuantitySimulation = this.ctrlQuantitySimulation.GetValue();
                if (!newQuantitySimulation || newQuantitySimulation < 0) {
                    newQuantitySimulation = 0;
                }
                const conditionedPricing = this.GetConditionedPricing();
                const currency = Lib.P2P.Currency.Get(this.originCurrency);
                const priceSimulation = Sys.Helpers.Round(Sys.Helpers.Round(conditionedPricing.ComputeAverageUnitPrice(newQuantitySimulation), currency.unitPricePrecision).mul(newQuantitySimulation), currency.amountPrecision);
                this.ctrlQuantitySimulation.SetValue(newQuantitySimulation);
                this.ctrlPriceSimulation.SetValue(priceSimulation.toNumber());
                this.RemoveErrorMessge();
            }
            catch (e) {
                Log.Warn(e);
            }
        }
        // Fill dialog callback: Design and instantiation of the controls.
        FillDialogCallback(dialog /*, tabId: string | null, event: "OnDialogFill", control: IControl*/) {
            dialog.SetHelpId(this.DOC_HELP_ID);
            this.ctrlTextModelDescription = dialog.AddDescription("TextModelDescription__");
            this.ctrlTextModelDescription.SetText(Language.Translate(`_TextModelDescription_${this.originPricingType}`));
            this.ctrlTextModelDescription.AddStyle("text-emphasis");
            this.ctrlTextModelDescription.AddStyle("text-color-color1");
            this.ctrlTableConditions = dialog.AddTable("Thresholds__");
            this.ctrlTableConditions.SetLineCount(8);
            dialog.AddSeparator();
            this.ctrlColumnNumber = this.ctrlTableConditions.AddTextColumn("ColumnLabel__", "_ColumnLabel", 90);
            this.ctrlColumnNumber.SetReadOnly(true);
            this.ctrlColumnThreshold = this.ctrlTableConditions.AddDecimalColumn("ColumnThreshold__", "", 90);
            this.ctrlColumnThreshold.Hide(true);
            this.ctrlColumnThreshold.SetPrecisionMin(0);
            this.ctrlColumnRangeTextThreshold = this.ctrlTableConditions.AddTextColumn("ColumnRangeTextThreshold__", "_ColumnRangeText", 270, "right");
            this.ctrlColumnRangeTextThreshold.SetReadOnly(true);
            this.ctrlColumnRangeTextThreshold.SetTextAlignment("right");
            this.ctrlColumnMaxThreshold = this.ctrlTableConditions.AddDecimalColumn("ColumnMaxThreshold__", "", 90);
            this.ctrlColumnMaxThreshold.SetLabel("");
            this.ctrlColumnMaxThreshold.SetPrecisionMin(0);
            this.ctrlColumnMaxThreshold.SetTextAlignment("left");
            this.ctrlColumnBase = this.ctrlTableConditions.AddDecimalColumn("ColumnBase__", "_ColumnBase", 90);
            this.ctrlColumnBase.SetPrecision(this.currencyPrecision.unitPricePrecision);
            this.ctrlColumnBase.SetPrecisionMin(this.currencyPrecision.amountPrecision);
            this.ctrlColumnUnitPrice = this.ctrlTableConditions.AddDecimalColumn("ColumnUnitPrice__", `_ColumnUnitPrice_${this.originPricingType}`, 90);
            this.ctrlColumnUnitPrice.SetPrecision(this.currencyPrecision.unitPricePrecision);
            this.ctrlColumnUnitPrice.SetPrecisionMin(this.currencyPrecision.amountPrecision);
            this.PRICING_TYPES[this.originPricingType]();
            this.ctrlTableConditions.HideTableRowMenu(true);
            this.ctrlTableConditions.HideTopNavigation(true);
            this.ctrlTableConditions.HideBottomNavigation(false);
            this.ctrlTableConditions.DisableMenuAddLine(true);
            this.ctrlTableConditions.HideTableRowDelete(false);
            this.ctrlTableConditions.HideTableRowAdd(false);
            this.ctrlErrorMessage = dialog.AddText("ErrorMessage__");
            this.ctrlErrorMessage.AddStyle("text-highlight-warning");
            this.ctrlErrorMessage.SetReadOnly(true);
            this.ctrlErrorMessage.Hide(true);
            this.ctrlQuantitySimulation = dialog.AddDecimal("QuantitySimulation__", "_Simulate_price_quantity");
            this.ctrlQuantitySimulation.SetWidth(200);
            this.ctrlQuantitySimulation.SetPrecisionMin(0);
            this.ctrlPriceSimulation = dialog.AddDecimal("PriceSimulation__", "_Simulate_price_result");
            this.ctrlPriceSimulation.AddSurroundingText(this.originCurrency);
            this.ctrlPriceSimulation.SetReadOnly(true);
            this.ctrlPriceSimulation.SetWidth(200);
            this.ctrlPriceSimulation.SetPrecision(this.currencyPrecision.amountPrecision);
            this.ctrlPriceSimulation.SetPrecisionMin(this.currencyPrecision.amountPrecision);
            this.ctrlPriceSimulation.SetHelpData(`<div style="max-width: 600px">${Language.Translate(`_tooltip_price_simulation_${this.originPricingType}`)}<div>`, "" + this.DOC_HELP_ID);
            this.InitOldConditionedPricingData();
        }
        // Commit dialog callback: Updates the process form with dialog results.
        CommitDialogCallback( /*dialog: Dialog, tabId: string | null, event: "OnDialogCommit", control: IControl*/) {
            const conditionedPricing = ConditionedPricingFactory.Get(this.originPricingType);
            conditionedPricing.SetThresholds(this.GetThresholds());
            this.resolve(conditionedPricing);
        }
        TableConditionsHasError() {
            const nbItems = this.ctrlTableConditions.GetItemCount();
            for (let i = 0; i < nbItems; i++) {
                const item = this.ctrlTableConditions.GetItem(i);
                if (item.GetError("ColumnMaxThreshold__") ||
                    item.GetError("ColumnThreshold__") ||
                    item.GetError("ColumnUnitPrice__") ||
                    item.GetError("ColumnBase__")) {
                    return true;
                }
            }
            return false;
        }
        // Validate dialog callback: Checks if required fields are set.
        ValidateDialogCallback( /*dialog: Dialog, tabId: string | null, event: "OnDialogValidate", control: IControl*/) {
            try {
                if (this.TableConditionsHasError()) {
                    return false;
                }
                this.GetConditionedPricing();
                this.RemoveErrorMessge();
                return true;
            }
            catch (e) {
                this.DisplayErrorMessage(e);
                return false;
            }
        }
        CheckTableConditionsError() {
            const nbItems = this.ctrlTableConditions.GetItemCount();
            for (let i = 0; i < nbItems; i++) {
                const item = this.ctrlTableConditions.GetItem(i);
                item.SetError("ColumnMaxThreshold__", this.CheckErrorMaxThreshold(item.GetValue("ColumnMaxThreshold__"), i + 1 === nbItems, item));
                item.SetError("ColumnUnitPrice__", this.CheckErrorUnitPrice(item.GetValue("ColumnUnitPrice__")));
                item.SetError("ColumnBase__", this.CheckErrorBase(item.GetValue("ColumnBase__")));
            }
        }
        CheckErrorMaxThreshold(value, isLastLine, item) {
            if (value === null && !isLastLine) {
                return "_required";
            }
            if (value !== null && value <= 0) {
                return "_should_be_strictly_greater_than_zero";
            }
            const min = item.GetValue("ColumnThreshold__");
            const max = item.GetValue("ColumnMaxThreshold__");
            if (max != null && max <= min) {
                return "_ThresholdMax_Below_Threshold";
            }
            return "";
        }
        CheckErrorBase(value) {
            if (this.originPricingType !== PricingType.OveragePricing) {
                return "";
            }
            else if (value === null) {
                return "_required";
            }
            else if (value < 0) {
                return "_should_be_positive";
            }
            return "";
        }
        CheckErrorUnitPrice(value) {
            if (value === null) {
                return "_required";
            }
            else if (value < 0) {
                return "_should_be_positive";
            }
            return "";
        }
        // Handle dialog callback: Manages events issued by the dialog's controls.
        HandleDialogCallback(dialog, tabId, event, control, param1, param2) {
            Log.Info(event, control.GetName(), control.GetType(), param1, param2);
            if (event === "OnEnter") {
                return false;
            }
            if (event === "OnAddItem") {
                const nbItems = this.ctrlTableConditions.GetItemCount();
                const currItem = this.ctrlTableConditions.GetItem(nbItems - 2);
                currItem.SetValue("ColumnRangeTextThreshold__", this.GetRangeTextThreshold(currItem.GetValue("ColumnThreshold__"), nbItems - 2 === 0, false));
                const newItem = this.ctrlTableConditions.GetItem(nbItems - 1);
                newItem.SetValue("ColumnLabel__", this.GetLineLabel(nbItems - 1));
                newItem.SetValue("ColumnRangeTextThreshold__", this.GetRangeTextThreshold(null, false, true));
                setTimeout(() => {
                    this.ctrlTableConditions.DisplayItem(nbItems - 1);
                }, 0);
            }
            if (event === "OnChange") {
                this.RemoveErrorMessge();
                if (control.GetName() === "ColumnMaxThreshold__") {
                    const index = control.GetRow().GetLineNumber(true) - 1;
                    if (index === this.ctrlTableConditions.GetItemCount() - 1) {
                        const currItem = this.ctrlTableConditions.GetItem(index);
                        currItem.SetValue("ColumnRangeTextThreshold__", this.GetRangeTextThreshold(currItem.GetValue("ColumnThreshold__"), index === 0, false));
                        const newItem = this.ctrlTableConditions.AddItem();
                        const newItemIndex = this.ctrlTableConditions.GetItemCount() - 1;
                        newItem.SetValue("ColumnLabel__", this.GetLineLabel(newItemIndex));
                        newItem.SetValue("ColumnThreshold__", control.GetValue());
                        newItem.SetValue("ColumnRangeTextThreshold__", this.GetRangeTextThreshold(control.GetValue(), false, true));
                    }
                    else {
                        const nextIndex = index + 1;
                        const nextItem = this.ctrlTableConditions.GetItem(nextIndex);
                        nextItem.SetValue("ColumnThreshold__", control.GetValue());
                        nextItem.SetValue("ColumnRangeTextThreshold__", this.GetRangeTextThreshold(control.GetValue(), false, nextIndex === this.ctrlTableConditions.GetItemCount() - 1));
                    }
                }
                if (control.GetName() === "ColumnThreshold__"
                    || control.GetName() === "ColumnMaxThreshold__"
                    || control.GetName() === "ColumnUnitPrice__"
                    || control.GetName() === "ColumnBase__"
                    || control.GetName() === "QuantitySimulation__") {
                    this.UpdateSimulation();
                }
                this.CheckTableConditionsError();
            }
            if (event === "OnRefreshRow") {
                const row = this.ctrlTableConditions.GetRow(param1);
                row.ColumnUnitPrice__.AddSurroundingText(this.originCurrency);
                const itemNum = row.GetLineNumber(true);
                const isLast = itemNum === this.ctrlTableConditions.GetItemCount();
                this.ctrlTableConditions.HideTableRowDeleteForItem(param1, !isLast || itemNum === 1);
                this.ctrlTableConditions.HideTableRowAddForItem(param1, !isLast || itemNum >= NB_THRESHOLD_MAX);
                row.ColumnMaxThreshold__.SetReadOnly(isLast);
                this.CheckTableConditionsError();
            }
            if (event === "OnCheckIfItemDeletable") {
                return param2 !== 0;
            }
            if (event === "OnDeleteItem") {
                const lastItem = this.ctrlTableConditions.GetItem(param2 - 1);
                lastItem.SetValue("ColumnMaxThreshold__", null);
                lastItem.SetValue("ColumnRangeTextThreshold__", this.GetRangeTextThreshold(lastItem.GetValue("ColumnThreshold__"), param2 - 1 === 0, true));
            }
            return null;
        }
        // Cancel dialog callback: requests that the user confirms cancellation.
        CancelDialogCallback( /*dialog: Dialog, tabId: string | null, event: "OnDialogCancel", control: IControl*/) {
            this.resolve("CANCELED");
        }
        // Rollback dialog callback: rollbacks process fields to their original values.
        RollbackDialogCallback( /*dialog: Dialog, tabId: string | null, event: "OnDialogCallback", control: IControl*/) {
            //Nothing to rollback
        }
        OpenPopupDialog() {
            return Sys.Helpers.Promise.Create((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
                Popup.Dialog(`_EditPriceCondition_${this.originPricingType}`, this.originControl, this.FillDialogCallback.bind(this), this.CommitDialogCallback.bind(this), this.ValidateDialogCallback.bind(this), this.HandleDialogCallback.bind(this), this.CancelDialogCallback.bind(this), this.RollbackDialogCallback.bind(this));
            });
        }
    }
    function CheckRequiredFields() {
        Sys.Helpers.Controls.ForEachTableRow(Controls.VendorItems__, function (row) {
            row.VendorName__.Focus();
            row.SupplierPartID__.Focus();
        });
        if (Configuration.isInventoryManagementEnable) {
            Sys.Helpers.Controls.ForEachTableRow(Controls.WarehouseItems__, function (row) {
                row.WarehouseName__.Focus();
            });
        }
        Controls.Description__.Focus();
        Controls.ItemNumber__.Focus();
    }
    function CheckDuplicatedSources() {
        let usedSourceID = {};
        let allowedPreferredVendor = [];
        Sys.Helpers.Controls.ForEachTableRow(Controls.VendorItems__, function (row) {
            const sourceID = row.VendorNumber__.GetValue();
            allowedPreferredVendor.push(sourceID);
            if (!usedSourceID[sourceID]) {
                usedSourceID[sourceID] = row;
                row.VendorName__.SetError("");
            }
            else {
                usedSourceID[sourceID].VendorName__.SetError("_Duplicated vendor id");
                row.VendorName__.SetError("_Duplicated vendor id");
            }
        });
        if (Configuration.isInventoryManagementEnable) {
            Sys.Helpers.Controls.ForEachTableRow(Controls.WarehouseItems__, function (row) {
                const sourceID = row.WarehouseNumber__.GetValue();
                if (!usedSourceID[sourceID]) {
                    usedSourceID[sourceID] = row;
                    row.WarehouseName__.SetError("");
                }
                else {
                    usedSourceID[sourceID].WarehouseName__.SetError("_Duplicated warehouse id");
                    row.WarehouseName__.SetError("_Duplicated warehouse id");
                }
                const preferredVendor = row.DefaultReplenishmentVendorNumber__.GetValue();
                if (preferredVendor && allowedPreferredVendor.indexOf(preferredVendor) === -1) {
                    row.DefaultReplenishmentVendorName__.SetError("_This vendor does not supply this item");
                }
                else {
                    row.DefaultReplenishmentVendorName__.SetError("");
                }
            });
        }
    }
    function UpdatePreferredVendorFilter() {
        setTimeout(() => {
            let allowedVendorFilter = [];
            const filterCompanyCode = Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", "%[CompanyCode__]"), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__"));
            Sys.Helpers.Data.ForEachTableItem("VendorItems__", function (item) {
                allowedVendorFilter.push(Sys.Helpers.LdapUtil.FilterEqual("Number__", item.GetValue("VendorNumber__")));
            });
            const filter = Sys.Helpers.LdapUtil.FilterAnd(filterCompanyCode, Sys.Helpers.LdapUtil.FilterOr(...allowedVendorFilter));
            Controls.WarehouseItems__.DefaultReplenishmentVendorName__.SetFilter(filter.toString());
            Controls.WarehouseItems__.DefaultReplenishmentVendorNumber__.SetFilter(filter.toString());
        }, 100);
    }
    function InitVendorItemContractBrowse() {
        Lib.Purchasing.Contract.InitContractBrowses(Controls.VendorItems__, null, function (item) {
            const row = this.GetRow();
            const newCurrency = item === null || item === void 0 ? void 0 : item.GetValue("Currency__");
            row.Currency__.SetReadOnly(!!newCurrency);
            if (newCurrency) {
                row.Currency__.SetValue(newCurrency);
            }
        }, function () {
            const row = this.GetRow();
            row.Currency__.SetReadOnly(false);
        });
        Controls.VendorItems__.ContractName__.Hide(!Configuration.isContractManagementEnable);
        Controls.VendorItems__.ContractReferenceNumber__.Hide(true);
        Controls.VendorItems__.ContractNumber__.Hide(true);
    }
    async function CheckCurrencyVendorCoherency(row) {
        const item = Data.GetTable("VendorItems__").GetItem(row.GetLineNumber() - 1);
        if (item) {
            const itemCurrency = item.GetValue("Currency__");
            const isPunchoutItem = item.GetValue("IsPunchoutItem__");
            const result = await Lib.Purchasing.Vendor.QueryVendor(Data.GetValue("CompanyCode__"), item.GetValue("VendorNumber__"), false);
            Sys.Helpers.SilentChange(() => {
                const vendorCurrency = result === null || result === void 0 ? void 0 : result.Currency__;
                if (!isPunchoutItem && itemCurrency != vendorCurrency && !!vendorCurrency) {
                    row.Currency__.SetWarning("_Selected currency different from vendor currency {0}", vendorCurrency);
                }
                else {
                    row.Currency__.SetWarning("");
                }
            });
        }
    }
    CustomScript.CheckCurrencyVendorCoherency = CheckCurrencyVendorCoherency;
    function InitVendorItemsPane() {
        Controls.VendorItems.Hide(false);
        Controls.VendorItems__.Hide(false);
        Controls.VendorItems__.SetAtLeastOneLine(false);
        Controls.VendorItems__.OnAddItem = function () {
            UpdateVendorItemsPane();
        };
        Controls.VendorItems__.OnDeleteItem = function (item) {
            const vendorNumber = item.GetValue("VendorNumber__");
            UpdatePreferredVendorFilter();
            UpdateWarehouseItems(vendorNumber);
            UpdateVendorItemsPane();
        };
        Controls.VendorItems__.OnRefreshRow = function (idx) {
            const row = Controls.VendorItems__.GetRow(idx);
            const item = row.GetItem();
            const currentContractRuidEx = item.GetValue("ContractRUIDEX__");
            if (currentContractRuidEx) {
                row.Currency__.SetReadOnly(true);
                const options = {
                    table: "CDNAME#P2P - Contract",
                    filter: Sys.Helpers.LdapUtil.FilterEqual("RUIDEX", currentContractRuidEx).toString(),
                    attributes: ["Currency__"],
                    additionalOptions: {
                        searchInArchive: true
                    }
                };
                Sys.GenericAPI.PromisedQuery(options)
                    .Then(function (queryResults) {
                    var _a;
                    const currentCurreny = row.Currency__.GetValue();
                    const requiredCurrency = (_a = queryResults[0]) === null || _a === void 0 ? void 0 : _a.Currency__;
                    row.Currency__.SetReadOnly(!!requiredCurrency);
                    if (requiredCurrency && currentCurreny != requiredCurrency) {
                        row.Currency__.SetValue(requiredCurrency);
                        row.Currency__.SetWarning("_invalid_currency_detected");
                    }
                });
            }
            else {
                row.Currency__.SetReadOnly(false);
            }
            punchoutManager.RefreshRow(row);
        };
        Controls.VendorItems__.PunchoutTester__.OnClick = function () {
            const companyCode = Data.GetValue("CompanyCode__");
            const row = this.GetRow();
            const vendorPunchoutConfig = punchoutManager.GetPunchoutConfig(row.PunchoutSiteName__.GetValue());
            const punchoutItemID = {
                supplierPartID: row.SupplierPartID__.GetValue(),
                supplierPartAuxiliaryID: row.SupplierPartAuxID__.GetValue()
            };
            Lib.Purchasing.Punchout.OpenPunchoutSite(vendorPunchoutConfig, companyCode, null, punchoutItemID);
        };
        function HandlePunchoutSiteNameChanges(selectedItem) {
            const row = this.GetRow();
            punchoutManager.RefreshRow(row);
        }
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.VendorItems__.PunchoutSiteName__, HandlePunchoutSiteNameChanges, HandlePunchoutSiteNameChanges, HandlePunchoutSiteNameChanges);
        function OnChangeVendor() {
            const row = this.GetRow();
            UpdatePreferredVendorFilter();
            CheckCurrencyVendorCoherency(row);
            punchoutManager.CheckPunchoutVendorCoherency(row);
            punchoutManager.UpdatePunchoutColumnsVisibility();
        }
        Controls.VendorItems__.VendorName__.OnExposedColumnsChange = OnChangeVendor;
        Controls.VendorItems__.VendorName__.SetDisplayedColumns("Name__|Number__|Currency__");
        if (Lib.Purchasing.Vendor.IsVendorRegistrationAvailable()) {
            Controls.VendorItems__.VendorName__.SetDisplayedColumns("Name__|Number__|Currency__|Number__.InternalScore__");
            Controls.VendorItems__.VendorName__.OnColumnFormating = (attribute, data, EddQueryResult, iRecord) => {
                if (attribute === "Number__.InternalScore__") {
                    const score = parseFloat(data);
                    if (!isNaN(score)) {
                        return Language.FormatNumber(score, {
                            formatAsInteger: false,
                            precisionMin: 0,
                            precisionMax: 2
                        });
                    }
                }
            };
        }
        Controls.VendorItems__.IsPunchoutItem__.OnChange = function () {
            const row = this.GetRow();
            if (!row.IsPunchoutItem__.GetValue()) {
                row.ContractName__.SetValue("");
            }
            punchoutManager.CheckPunchoutVendorCoherency(row);
            punchoutManager.UpdatePunchoutColumnsVisibility();
        };
        Controls.VendorItems__.Currency__.OnChange = function () {
            const row = this.GetRow();
            const currency = Lib.P2P.Currency.Get(row.Currency__.GetValue());
            row.UnitPrice__.SetPrecisionMin(currency.amountPrecision);
            row.UnitPrice__.SetPrecision(currency.unitPricePrecision);
            CheckCurrencyVendorCoherency(row);
        };
        Controls.NewVendorItem__.OnClick = function () {
            Controls.VendorItems__.AddItem();
            UpdateVendorItemsPane();
        };
        Controls.NewVendorItem__.Hide(ProcessInstance.isReadOnly);
        Controls.VendorItems__.EnergyConsumptionKgCO2ePerUnit__.Hide(!Configuration.isGHGForProcurementEnable);
        Controls.VendorItems__.EnergyConsumptionKgCO2ePerUnit__.OnChange = function () {
            const item = this.GetItem();
            if (item.GetValue("EnergyConsumptionKgCO2ePerUnit__") < 0) {
                item.SetError("EnergyConsumptionKgCO2ePerUnit__", "_should_be_positive");
            }
            else {
                item.SetError("EnergyConsumptionKgCO2ePerUnit__", "");
            }
        };
        InitVendorItemContractBrowse();
        UpdatePreferredVendorFilter();
        UpdateVendorItemsPane();
        setTimeout(() => {
            Sys.Helpers.Controls.ForEachTableRow(Controls.VendorItems__, function (row) {
                CheckCurrencyVendorCoherency(row);
                punchoutManager.CheckPunchoutVendorCoherency(row);
            });
        }, 100);
    }
    CustomScript.InitVendorItemsPane = InitVendorItemsPane;
    function UpdateVendorItemsPane() {
        const enablePublicPrice = Configuration.isPublicPriceEnable;
        const noVendorItems = Controls.VendorItems__.GetItemCount() === 0;
        Controls.EmptyVendorItems__.Hide(!noVendorItems);
        Controls.VendorItems__.PublicPrice__.Hide(!enablePublicPrice);
        punchoutManager.UpdatePunchoutColumnsVisibility();
        RefreshPriceConditionRows();
    }
    function InitWarehouseItemsPane() {
        Controls.WarehouseItems.Hide(!Configuration.isInventoryManagementEnable || !Lib.P2P.Inventory.IsInventoryManager() || Data.GetValue("ItemType__") === Lib.P2P.ItemType.AMOUNT_BASED);
        Controls.WarehouseItems__.SetAtLeastOneLine(false);
        Controls.WarehouseItems__.SetWidth("100%");
        Controls.WarehouseItems__.SetExtendableColumn("WarehouseName__");
        Controls.WarehouseItems__.OnAddItem = UpdateWarehouseItemsPane;
        Controls.WarehouseItems__.OnDeleteItem = UpdateWarehouseItemsPane;
        Controls.WarehouseItems__.OnCheckIfItemDeletable = function (item) {
            const isStocked = item.GetValue("CurrentStock__") > 0 || item.GetValue("IncomingStock__") > 0 || item.GetValue("ReservedStock__") > 0;
            return !isStocked;
        };
        Controls.WarehouseItems__.OnRefreshRow = function (index) {
            let row = Controls.WarehouseItems__.GetRow(index);
            const isStocked = row.CurrentStock__.GetValue() > 0 || row.IncomingStock__.GetValue() > 0 || row.ReservedStock__.GetValue() > 0;
            row.WarehouseName__.SetReadOnly(isStocked);
            row.WarehouseNumber__.SetReadOnly(isStocked);
            Controls.WarehouseItems__.HideTableRowDeleteForItem(index, isStocked);
        };
        Controls.NewWarehouseItem__.OnClick = function () {
            if (Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED) {
                const item = Controls.WarehouseItems__.AddItem();
                item.SetValue("Currency__", companyCodeManager.currency);
                UpdateWarehouseItemsPane();
            }
        };
        Controls.NewWarehouseItem__.Hide(ProcessInstance.isReadOnly);
        UpdateWarehouseItemsPane();
        Sys.Helpers.Controls.ForEachTableRow(Controls.WarehouseItems__, (row, index) => {
            Controls.WarehouseItems__.OnRefreshRow(index);
        });
    }
    function UpdateWarehouseItemsPane() {
        if (Configuration.isInventoryManagementEnable) {
            const noWarehouseItems = Controls.WarehouseItems__.GetItemCount() === 0;
            if (noWarehouseItems == false) {
                Controls.WarehouseItems.Hide(false);
            }
            Controls.WarehouseItems__.Hide(false);
            Controls.EmptyWarehouseItems__.Hide(!noWarehouseItems);
        }
    }
    function UpdateWarehouseItems(vendorNumber) {
        Sys.Helpers.Data.ForEachTableItem("WarehouseItems__", (item) => {
            if (item.GetValue("DefaultReplenishmentVendorNumber__") === vendorNumber) {
                item.SetValue("DefaultReplenishmentVendorNumber__", "");
                item.SetValue("DefaultReplenishmentVendorName__", "");
            }
        });
    }
    function SetImgUrl() {
        let imageLink = Controls.Image__.GetValue() || "ItemNoImage.png";
        Controls.ImageBrowse__.SetText("%Images%\\" + imageLink);
        let html = "<div><img src=\"" + Lib.Purchasing.GetCatalogImageUrl(imageLink) + "\"></div>";
        Controls.ItemImg__.SetHTML(html);
    }
    function OnSelectSticker(item) {
        const html = Lib.Purchasing.CatalogHelper.Sticker.GetHTMLFromDBItem(item);
        SetStickerContent(html);
    }
    function SetStickerContent(html) {
        Controls.TagsDisplay__.SetHTML(html);
        Controls.TagsDisplay__.Hide(!html);
    }
    function InitImagePane() {
        Controls.ImageBrowse__.OnChange = function () {
            let browsedImage = this.GetText();
            Controls.Image__.SetValue(browsedImage);
            SetImgUrl();
        };
        Controls.Image__.OnBrowse = function () {
            Controls.ImageBrowse__.DoBrowse();
        };
        Controls.Image__.OnChange = function () {
            SetImgUrl();
        };
        SetImgUrl();
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.StickerID__, OnSelectSticker, OnSelectSticker, OnSelectSticker);
    }
    function InitGeneralInformationPane() {
        Controls.ItemNumber__.Hide(!Controls.ItemNumber__.GetValue());
        Controls.ItemType__.SetReadOnly(Controls.WarehouseItems__.GetItemCount() > 0);
        Controls.ItemType__.OnChange = () => {
            Controls.UnitOfMeasure__.Hide(Data.GetValue("ItemType__") === Lib.P2P.ItemType.AMOUNT_BASED);
        };
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
    }
    function RefreshPriceConditionRow(row) {
        if (!row) {
            return;
        }
        const idx = row.GetLineNumber(true);
        const item = Controls.VendorItems__.GetItem(idx - 1);
        const priceDataStr = item.GetValue("PriceConditionData__");
        const priceData = priceDataStr ? JSON.parse(priceDataStr) : null;
        if (priceData) {
            row.UnitPrice__.SetReadOnly(true);
            row.PriceConditionType__.SetValue(priceData.type);
            row.PriceConditionEdit__.Hide(false);
        }
        else {
            row.PriceConditionType__.SetValue(ComboboxPricingTypeNone.NONE);
            row.PriceConditionEdit__.Hide(true);
        }
    }
    function RefreshPriceConditionRows() {
        if (Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED) {
            const nbLine = Controls.VendorItems__.GetItemCount();
            for (let i = 0; i < nbLine; i++) {
                RefreshPriceConditionRow(Controls.VendorItems__.GetRow(i));
            }
        }
    }
    function InitPriceCondition() {
        if (Data.GetValue("ItemType__") !== Lib.P2P.ItemType.AMOUNT_BASED) {
            RefreshPriceConditionRows();
            Controls.VendorItems__.PriceConditionType__.OnChange = function () {
                const row = this.GetRow();
                const newType = this.GetSelectedOption();
                const currency = Lib.P2P.Currency.Get(row.Currency__.GetValue());
                if (newType === ComboboxPricingTypeNone.NONE) {
                    row.PriceConditionEdit__.Hide(true);
                    row.UnitPrice__.SetReadOnly(false);
                    row.PriceConditionData__.SetValue("");
                }
                else {
                    row.PriceConditionEdit__.Hide(false);
                    row.UnitPrice__.SetReadOnly(true);
                    const priceDataStr = row.PriceConditionData__.GetValue();
                    const priceData = priceDataStr ? JSON.parse(priceDataStr) : null;
                    if (priceData) {
                        const pricing = ConditionedPricingFactory.Get(newType);
                        pricing.SetThresholds(priceData.thresholds);
                        row.PriceConditionData__.SetValue(JSON.stringify(pricing.ToData()));
                        row.UnitPrice__.SetValue(pricing.GetFirstThresholdUnitPrice().toFixed(currency.unitPricePrecision));
                    }
                    else {
                        const pricing = ConditionedPricingFactory.Get(newType);
                        pricing.SetThresholds([{
                                base: 0,
                                unitPrice: row.UnitPrice__.GetValue() || 0,
                                threshold: 0
                            }]);
                        row.PriceConditionData__.SetValue(JSON.stringify(pricing.ToData()));
                        row.UnitPrice__.SetValue(pricing.GetFirstThresholdUnitPrice().toFixed(currency.unitPricePrecision));
                    }
                }
            };
            Controls.VendorItems__.PriceConditionEdit__.SetLabel("");
            Controls.VendorItems__.PriceConditionEdit__.OnClick = function () {
                const dialogHandler = new PriceConditionDialogHandler(this);
                dialogHandler.OpenPopupDialog()
                    .Then((conditionedPricing) => {
                    if (conditionedPricing !== "CANCELED") {
                        const row = this.GetRow();
                        const currency = Lib.P2P.Currency.Get(row.Currency__.GetValue());
                        const priceData = conditionedPricing.ToData();
                        Log.Info("End Dialog", priceData);
                        row.PriceConditionData__.SetValue(JSON.stringify(priceData));
                        row.UnitPrice__.SetValue(conditionedPricing.GetFirstThresholdUnitPrice().toFixed(currency.unitPricePrecision));
                        row.UnitPrice__.SetReadOnly(true);
                    }
                });
            };
        }
        else {
            Controls.VendorItems__.PriceConditionType__.Hide(true);
            Controls.VendorItems__.PriceConditionEdit__.Hide(true);
        }
    }
    async function FillSupplyTypeName() {
        const options = {
            table: "PurchasingSupply__",
            filter: "(&(SupplyID__=" + Controls.SupplyTypeID__.GetValue() + ")(CompanyCode__=" + Controls.CompanyCode__.GetValue() + "))",
            attributes: ["Name__"]
        };
        try {
            const queryResults = await Sys.GenericAPI.PromisedQuery(options);
            Sys.Helpers.SilentChange(() => {
                if (queryResults.length) {
                    Controls.SupplyTypeName__.SetValue(queryResults[0].Name__);
                }
            });
        }
        catch (e) {
            ResetSupplyTypeName();
        }
    }
    function ResetSupplyTypeName() {
        Controls.SupplyTypeName__.SetValue("");
    }
    function UpdateGeneralInformationPane() {
        Controls.ItemType__.Hide(!Configuration.isItemTypeEnable);
        Controls.ItemType__.OnChange();
    }
    Controls.DeleteItem.OnClick = function () {
        ProcessInstance.Approve("delete");
    };
    Controls.SaveItem.OnClick = function () {
        punchoutManager.RemoveDataSetForDisplayOnly();
        CheckRequiredFields();
        CheckDuplicatedSources();
        if (!Process.ShowFirstError()) {
            ProcessInstance.Approve("save");
        }
    };
    async function OnFormLoaded() {
        globalLayout.Hide(false);
        globalLayout.HideWaitScreen();
        Process.SetHelpId(5109);
        InitGeneralInformationPane();
        InitImagePane();
        InitVendorItemsPane();
        InitWarehouseItemsPane();
        InitPriceCondition();
        punchoutManager.InitPunchout();
        UpdateGeneralInformationPane();
        SetImgUrl();
        Controls.DeleteItem.Hide(!Controls.ItemNumber__.GetValue() || ProcessInstance.isReadOnly);
        Controls.SaveItem.Hide(ProcessInstance.isReadOnly);
        Lib.CommonDialog.NextAlert.Show();
        try {
            await Sys.Helpers.Promise.Tools.Sleep(20);
            // Wait that Controls are feed
            Sys.Helpers.Controls.ForEachTableRow(Controls.VendorItems__, (row, index) => {
                const currency = Lib.P2P.Currency.Get(Data.GetTable("VendorItems__").GetItem(index).GetValue("Currency__"));
                row.UnitPrice__.SetPrecisionMin(currency.amountPrecision);
                row.UnitPrice__.SetPrecision(currency.unitPricePrecision);
            });
        }
        catch (reason) {
            Log.Error("An error occured during form initialization :", reason);
            ProcessInstance.SetSilentChange(false);
        }
        await Sys.Helpers.TryCallFunction("Lib.CatalogItemEdit.Customization.Client.OnLoad");
    }
    Sys.Helpers.EnableSmartSilentChange();
    ProcessInstance.SetSilentChange(true);
    ProcessInstance.DisableExtractionScript();
    const panes = ["ImagePane", "CatalogItemInformations", "AnalyticsPane", "VendorItems", "WarehouseItems"];
    const buttons = ["SaveItem", "DeleteItem", "Close"];
    const deprecatedControls = ["Tags__"];
    const globalLayout = new Lib.P2P.Layout.Manager(panes, buttons, undefined, deprecatedControls);
    const companyCodeManager = new CompanyCodeManager();
    const punchoutManager = new PunchoutManager();
    const itemRUIDEX = ProcessInstance.selectedRuidFromView ? ProcessInstance.selectedRuidFromView[0] : false;
    const itemNumber = Process.GetURLParameter("itemnumber");
    const existingItem = (itemRUIDEX || itemNumber) && !Data.GetValue("RuidEx");
    async function Run() {
        globalLayout.Hide(true);
        globalLayout.ShowWaitScreen();
        if (existingItem) {
            try {
                const filter = itemRUIDEX ? [{ ruidex: itemRUIDEX }] : [{ itemNumber: itemNumber }];
                const [item] = await Lib.Purchasing.CatalogHelper.GetItems(filter);
                Controls.VendorItems__.SetItemCount(0);
                Controls.WarehouseItems__.SetItemCount(0);
                // first apply custom field, for not override standard fields
                for (const field in item.impliedFields) {
                    Data.SetValue(field, item.impliedFields[field]);
                }
                Data.SetValue("CompanyCode__", item.companyCode);
                Data.SetValue("ItemNumber__", item.itemNumber);
                Data.SetValue("Description__", item.description);
                Data.SetValue("LongDescription__", item.longDescription);
                Data.SetValue("ItemType__", item.itemType);
                Data.SetValue("ManufacturerName__", item.manufacturerName);
                Data.SetValue("ManufacturerPartID__", item.manufacturerPartID);
                Data.SetValue("UnitOfMeasure__", item.UOM);
                Data.SetValue("UNSPSC__", item.unspsc);
                Data.SetValue("SupplyTypeID__", item.supplytypeID);
                Data.SetValue("SupplyTypeName__", item.supplytypeIDName);
                Data.SetValue("Image__", item.image);
                Data.SetValue("TaxCode__", item.taxcode);
                Data.SetValue("GLAccount__", item.glaccount);
                Data.SetValue("CostType__", item.costType);
                Data.SetValue("DefaultPublicPrice__", item.defaultPublicPrice);
                Data.SetValue("DefaultCurrency__", item.defaultCurrency);
                let stickerHTML = "";
                if (item.sticker) {
                    Data.SetValue("StickerID__", item.sticker.id);
                    stickerHTML = Lib.Purchasing.CatalogHelper.Sticker.GetHTML(item.sticker);
                }
                SetStickerContent(stickerHTML);
                await companyCodeManager.LoadDefaultCompanyCode();
                const vendorTable = Data.GetTable("VendorItems__");
                const warehouseTable = Data.GetTable("WarehouseItems__");
                for (const providerItem of item.providersItemProperties) {
                    if (providerItem instanceof VendorItemProperties) {
                        const newItem = vendorTable.AddItem();
                        const priceData = providerItem.priceConditionData ? JSON.parse(providerItem.priceConditionData) : null;
                        // first apply custom field, for not override standard fields
                        for (const field in providerItem.impliedFields) {
                            newItem.SetValue(field, providerItem.impliedFields[field]);
                        }
                        newItem.SetValue("VendorNumber__", providerItem.vendorNumber);
                        newItem.SetValue("VendorName__", providerItem.vendorName);
                        newItem.SetValue("SupplierPartID__", providerItem.supplierPartID);
                        newItem.SetValue("SupplierPartAuxID__", providerItem.supplierPartAuxID);
                        newItem.SetValue("PublicPrice__", providerItem.publicPrice);
                        newItem.SetValue("UnitPrice__", providerItem.unitPrice);
                        newItem.SetValue("Currency__", providerItem.currency);
                        newItem.SetValue("EnergyConsumptionKgCO2ePerUnit__", providerItem.energyConsumptionKgCO2ePerUnit);
                        newItem.SetValue("PriceConditionData__", providerItem.priceConditionData);
                        newItem.SetValue("PriceConditionType__", priceData ? priceData.type : ComboboxPricingTypeNone.NONE);
                        newItem.SetValue("ValidityDate__", providerItem.validityDate);
                        newItem.SetValue("ExpirationDate__", providerItem.expirationDate);
                        newItem.SetValue("LeadTime__", providerItem.leadtime);
                        newItem.SetValue("PunchoutSiteName__", providerItem.punchoutsitename);
                        newItem.SetValue("IsPunchoutItem__", !!providerItem.punchoutsitename);
                        newItem.SetValue("Locked__", providerItem.locked);
                        newItem.SetValue("ContractRUIDEX__", providerItem.contractRuidex);
                        newItem.SetValue("ContractName__", providerItem.contractName);
                        newItem.SetValue("ContractNumber__", providerItem.contractNumber);
                        newItem.SetValue("OriginalContractRUIDEX__", providerItem.originalContractRuidex);
                        newItem.SetValue("ContractReferenceNumber__", providerItem.contractReferenceNumber);
                    }
                    else if (providerItem instanceof WarehouseItemProperties && Configuration.isInventoryManagementEnable) {
                        const newItem = warehouseTable.AddItem();
                        // first apply custom field, for not override standard fields
                        for (const field in providerItem.impliedFields) {
                            newItem.SetValue(field, providerItem.impliedFields[field]);
                        }
                        newItem.SetValue("WarehouseNumber__", providerItem.warehouseNumber);
                        newItem.SetValue("WarehouseName__", providerItem.warehouseName);
                        newItem.SetValue("UnitPrice__", providerItem.unitPrice);
                        newItem.SetValue("Currency__", providerItem.currency);
                        newItem.SetValue("StocktakingDateTime__", providerItem.stocktakingDateTime);
                        newItem.SetValue("CurrentStock__", providerItem.currentStock);
                        newItem.SetValue("ReservedStock__", providerItem.reservedStock);
                        newItem.SetValue("AvailableStock__", providerItem.availableStock);
                        newItem.SetValue("IncomingStock__", providerItem.incomingStock);
                        newItem.SetValue("MinimumThreshold__", providerItem.minimumThreshold);
                        newItem.SetValue("ExpectedStockLevel__", providerItem.expectedStockLevel);
                        newItem.SetValue("DefaultReplenishmentVendorName__", providerItem.defaultReplenishmentVendorName);
                        newItem.SetValue("DefaultReplenishmentVendorNumber__", providerItem.defaultReplenishmentVendorNumber);
                        newItem.SetValue("LeadTime__", providerItem.leadtime);
                        newItem.SetValue("Locked__", providerItem.locked);
                    }
                }
                await OnFormLoaded();
            }
            catch (error) {
                Log.Error(error);
            }
            ;
        }
        else {
            await companyCodeManager.LoadDefaultCompanyCode()
                .Then(OnFormLoaded)
                .Catch((error) => {
                Log.Error(error);
            });
        }
    }
    CustomScript.Run = Run;
    Run();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map