"use strict";
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable dot-notation */
var VendorItems;
(function (VendorItems) {
    /** ******************* **/
    /**       Helpers       **/
    /** ******************* **/
    class Configuration {
        static get publicPrice() {
            return Sys.Parameters.GetInstance("PAC").GetParameter("EnablePublicPrice", false);
        }
    }
    class LayoutManager {
        constructor(layoutPanes, layoutButtons) {
            this.panes = [];
            this.actionButtons = [];
            this.panes = layoutPanes.map((name) => Controls[name]);
            this.actionButtons = layoutButtons.map((name) => Controls[name]);
        }
        Hide(hide) {
            this.panes.forEach(function (pane) {
                pane.Hide(hide);
            });
            this.actionButtons.forEach(function (button) {
                button.Hide(hide);
            });
        }
    }
    class CompanyCodeManager {
        constructor() {
            this.companyCode = Data.GetValue("CompanyCode__");
            Controls.CompanyCode__.OnChange = this.OnCompanyCodeChange.bind(this);
        }
        static HasDependencies() {
            return !Sys.Helpers.IsEmpty(Controls.Currency__.GetValue())
                || !Sys.Helpers.IsEmpty(Controls.VendorNumber__.GetValue());
        }
        static async LoadConfiguration() {
            const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(Data.GetValue("CompanyCode__"));
            if (Object.keys(CCValues).length > 0) {
                await Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
            }
            else {
                Log.Error("The requested company code is not in the company code table.");
            }
            await Sys.Parameters.GetInstance("PAC").PromisedIsReady();
            await Sys.Parameters.GetInstance("AP").PromisedIsReady();
            Controls.PublicPrice__.Hide(!Configuration.publicPrice);
            Controls.EnergyConsumptionKgCO2ePerUnit__.Hide(!Lib.Purchasing.IsGHGEnableForProcurement());
        }
        Init() {
            if (!this.companyCode) {
                return Lib.P2P.UserProperties.QueryValues(User.loginId).Then((UserPropertiesValues) => {
                    this.companyCode = UserPropertiesValues.CompanyCode__;
                    Data.SetValue("CompanyCode__", this.companyCode);
                });
            }
            return Sys.Helpers.Promise.Resolve();
        }
        UpdateCompanyCodeDependencies() {
            this.companyCode = Data.GetValue("CompanyCode__");
            Controls.Currency__.SetValue("");
            Controls.VendorNumber__.SetValue("");
            Controls.PublicPrice__.SetValue("");
            Controls.EnergyConsumptionKgCO2ePerUnit__.SetValue("");
            CompanyCodeManager.LoadConfiguration();
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
    /** ******************* **/
    /**  Controls Handlers  **/
    /** ******************* **/
    Controls.Save.OnClick = function SaveOnClick() {
        return true;
    };
    function OnFormLoaded() {
        Controls.DataPanel.Hide(false);
        Controls.CompanyCode__.SetRequired(true);
        Controls.ItemNumber__.SetRequired(true);
        const isWarehouseItem = Lib.P2P.Inventory.IsEnabled() && !Data.IsNullOrEmpty("WarehouseNumber__");
        Controls.VendorNumber__.Hide(isWarehouseItem);
        Controls.WarehouseNumber__.Hide(!isWarehouseItem);
        Controls.PriceConditionPanel.Hide(true);
        Controls.AnalyticsPane.Hide(ProcessInstance.isReadOnly);
        const onSelectedItem = function (item) {
            Controls.ContractRUIDEX__.SetValue(item.GetValue("RUIDEX"));
            Controls.OriginalContractRUIDEX__.SetValue(item.GetValue("OriginalContractRUIDEX__"));
            Controls.ContractNumber__.SetValue(item.GetValue("ContractNumber__"));
            Controls.ContractReferenceNumber__.SetValue(item.GetValue("ReferenceNumber__"));
            Controls.ContractName__.SetValue(item.GetValue("Name__"));
        };
        const onResetOrUnknown = function () {
            Controls.ContractRUIDEX__.SetValue(null);
            Controls.OriginalContractRUIDEX__.SetValue(null);
            Controls.ContractNumber__.SetValue(null);
            Controls.ContractReferenceNumber__.SetValue(null);
            Controls.ContractName__.SetValue(null);
        };
        Controls.ContractNumber__.Hide(false);
        Controls.ContractName__.Hide(false);
        Controls.ContractName__.DisableExposedColumnImplicitRequest();
        Controls.ContractNumber__.DisableExposedColumnImplicitRequest();
        Controls.ContractName__.SetAutocompletable(true);
        Controls.ContractNumber__.SetAutocompletable(true);
        Controls.ContractName__.SetDisplayedColumns("Name__|ReferenceNumber__|ContractNumber__");
        Controls.ContractNumber__.SetDisplayedColumns("Name__|ReferenceNumber__|ContractNumber__");
        Controls.ContractName__.SetAttributes("RUIDEX|OriginalContractRUIDEX__");
        Controls.ContractNumber__.SetAttributes("RUIDEX|OriginalContractRUIDEX__");
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ContractName__, onSelectedItem, onResetOrUnknown, onResetOrUnknown);
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ContractNumber__, onSelectedItem, onResetOrUnknown, onResetOrUnknown);
        Lib.Purchasing.Contract.SetFilterAvailableContracts(Controls.ContractName__, null);
        Lib.Purchasing.Contract.SetFilterAvailableContracts(Controls.ContractNumber__, null);
        Controls.Save.Hide(ProcessInstance.isReadOnly);
        Controls.Close.Hide(false);
        Controls.Delete.Hide(false);
        ProcessInstance.SetSilentChange(false);
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    function Init() {
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        g_layout.Hide(true);
        g_companyCodeManager.Init()
            .Then(CompanyCodeManager.LoadConfiguration)
            .Then(OnFormLoaded);
    }
    /** ******************* **/
    /**     Entry point     **/
    /** ******************* **/
    const panes = ["DataPanel", "AnalyticsPane", "PriceConditionPanel"];
    const buttons = ["Save", "Close", "Delete"];
    const g_layout = new LayoutManager(panes, buttons);
    const g_companyCodeManager = new CompanyCodeManager();
    Init();
})(VendorItems || (VendorItems = {}));
//# sourceMappingURL=customscript.js.map