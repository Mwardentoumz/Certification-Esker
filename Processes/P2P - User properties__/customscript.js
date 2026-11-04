"use strict";
var CustomScript;
(function (CustomScript) {
    async function Init() {
        var _a, _b;
        Controls.CompanyCode__.OnChange = function () {
            var control = this;
            Controls.AllowedCompanyCodes__.Defer(null, function () {
                if (!control.GetError()) {
                    var cc = control.GetValue();
                    var allowed = Controls.AllowedCompanyCodes__.GetValue();
                    if (allowed) {
                        var exp = new RegExp("(^|;)" + Sys.Helpers.String.EscapeValueForRegEx(cc) + "(;|$)");
                        var res = exp.exec(allowed);
                        if (res === null) {
                            allowed += ";" + cc;
                        }
                    }
                    else {
                        allowed = cc;
                    }
                    Controls.AllowedCompanyCodes__.SetValue(allowed);
                }
            }, 100);
        };
        Controls.AllowedWarehouses__.OnChange = function () {
            var _a, _b;
            const control = this;
            const defaultWarehouse = (_a = control.GetValue()) === null || _a === void 0 ? void 0 : _a.split(/\r?\n/).filter(n => n)[0];
            Data.SetValue("DefaultWarehouse__", defaultWarehouse ? defaultWarehouse : "");
            Data.SetValue("AllowedWarehouses__", (_b = control.GetValue()) === null || _b === void 0 ? void 0 : _b.split(/\r?\n/).filter(n => n).join("\r\n"));
        };
        Controls.AllowedWarehouses__.OnBrowse = function () {
            Controls.DefaultWarehouse__.DoBrowse();
        };
        Controls.DefaultWarehouse__.OnChange = function () {
            var _a, _b;
            const warehouse = this.GetText().toUpperCase();
            const newWharehouse = (_a = Controls.AllowedWarehouses__.GetValue()) === null || _a === void 0 ? void 0 : _a.toUpperCase().split(/\r?\n/).indexOf(warehouse);
            if (newWharehouse === -1 || newWharehouse === undefined) {
                let AllowedWarehouses = ((_b = Controls.AllowedWarehouses__.GetValue()) === null || _b === void 0 ? void 0 : _b.split(/\r?\n/)) || [];
                AllowedWarehouses.push(warehouse);
                Controls.AllowedWarehouses__.SetValue(AllowedWarehouses.filter(n => n).join("\r\n"));
                Controls.AllowedWarehouses__.OnChange();
            }
        };
        Controls.UseEODLoginForMarketDojo__.OnChange = function () {
            const useEODLogin = Controls.UseEODLoginForMarketDojo__.GetValue();
            if (useEODLogin) {
                Controls.MarketDojoEmail__.SetValue("");
            }
            Controls.MarketDojoEmail__.Hide(useEODLogin);
        };
        await Sys.Parameters.GetInstance("P2P").PromisedIsReady();
        //--- DO NOT REMOVE ---
        //The following two lines hide a field and a tooltip (helper) that were introduced in 267 and removed in 268.
        //This only concerns instances that have used sprint 267
        (_a = Controls["MarketDojo_integration__"]) === null || _a === void 0 ? void 0 : _a.Hide(true);
        (_b = Controls["MarketDojoEmail__"]) === null || _b === void 0 ? void 0 : _b.SetHelpData(null);
        Controls.DefaultWarehouse__.Hide(true);
        Controls.AllowedWarehouses__.Hide(!Lib.P2P.Inventory.IsEnabled());
        const isEnableMarketDojoActivated = Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableMarketDojoIntegration", false);
        Controls.MarketDojoPanel.Hide(!isEnableMarketDojoActivated);
        if (isEnableMarketDojoActivated) {
            Controls.MarketDojoEmail__.Hide(Controls.UseEODLoginForMarketDojo__.GetValue());
        }
        if (Lib.Expense.IsOnBehalfByUserEnabled()) {
            Controls.OnBehalfPanel.Hide(false);
            const logins = Controls.AllowedOnBehalfUsers__.GetValue();
            Lib.P2P.UserProperties.GetOnBehalfUsersDisplayString(logins).Then(displayString => {
                Controls.AllowedOnBehalfUsersData__.SetValue(displayString);
            });
        }
        Controls.DataPanel.HideTitle(false);
    }
    CustomScript.Init = Init;
    async function Main() {
        return Sys.Helpers.TryCallFunctionAsync("Lib.P2P.Customization.Tables.Client.UserProperties.OnHTMLScriptBegin")
            .Then(() => {
            return CustomScript.Init();
        }).Then(() => {
            Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
            Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.UserProperties.OnHTMLScriptEnd");
        });
    }
    CustomScript.Main = Main;
    Main();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map