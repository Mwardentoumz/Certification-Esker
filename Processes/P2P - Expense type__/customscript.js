"use strict";
var P2P;
(function (P2P) {
    var Expense;
    (function (Expense) {
        var ExpenseType;
        (function (ExpenseType) {
            var CustomScript;
            (function (CustomScript) {
                /* Expense HTML page script */
                /** **************** **/
                /** Global variables **/
                /** **************** **/
                var layout = {
                    panes: ["GeneralPanel", "SpecificProperties", "Analytics", "VAT"].map((name) => { return Controls[name]; }),
                    taxCodes: ["TaxCode1__", "TaxCode2__", "TaxCode3__", "TaxCode4__", "TaxCode5__"].map((name) => { return Controls[name]; }),
                    taxRates: ["TaxRate1__", "TaxRate2__", "TaxRate3__", "TaxRate4__", "TaxRate5__"].map((name) => { return Controls[name]; }),
                    actionButtons: ["PreSave", "Save", "DeleteExpense", "Close"].map((name) => { return Controls[name]; }),
                    inputTaxRate: Controls["InputTaxRate__"]
                };
                var fieldsVisible = layout.taxCodes.length;
                async function InitLayout() {
                    // Hide every tax rate field
                    layout.taxRates.forEach((field, index) => {
                        field.Hide(true);
                        if (!Sys.Helpers.IsEmpty(field.GetValue())) {
                            layout.taxCodes[index].SetLabel(Language.Translate("_TaxCodeWithRate", false, field.GetValue().toFixed(2)));
                        }
                    });
                    // Set "OnSelectItem" for each TaxCode field
                    layout.taxCodes.forEach((field, index) => {
                        field.OnSelectItem = function (item) {
                            field.SetLabel(Language.Translate("_TaxCodeWithRate", false, parseFloat(item.GetValue("TaxRate__") || 0).toFixed(2)));
                            layout.taxRates[index].SetValue(item.GetValue("TaxRate__"));
                        };
                        field.OnChange = function () {
                            if (Sys.Helpers.IsEmpty(field.GetValue())) {
                                field.SetLabel(Language.Translate("_TaxCode"));
                                layout.taxRates[index].SetValue(null);
                            }
                        };
                        if (index > 0 && !field.GetValue()) {
                            field.Hide(true);
                            fieldsVisible--;
                        }
                    });
                    // Hide save button (real one)
                    Controls.Save.Hide(true);
                    var initTaxField = function (indexFieldToInit, indexFieldSrc = -1) {
                        layout.taxCodes[indexFieldToInit].SetValue(indexFieldSrc >= 0 ? layout.taxCodes[indexFieldSrc].GetValue() : "");
                        layout.taxRates[indexFieldToInit].SetValue(indexFieldSrc >= 0 ? layout.taxRates[indexFieldSrc].GetValue() : "");
                        layout.taxCodes[indexFieldToInit].SetLabel(indexFieldSrc >= 0 ? Language.Translate("_TaxCodeWithRate", false, layout.taxRates[indexFieldToInit].GetValue().toFixed(2)) : Language.Translate("_TaxCode"));
                    };
                    // Set pre save button onclick action (unreal one)
                    Controls.PreSave.OnClick = function () {
                        for (var i = 0; i < layout.taxCodes.length; i++) {
                            if (layout.inputTaxRate.GetValue()) {
                                for (var j = i + 1; j < layout.taxCodes.length && !layout.taxCodes[i].GetValue(); j++) {
                                    if (layout.taxCodes[j].GetValue()) {
                                        initTaxField(i, j);
                                        initTaxField(j);
                                    }
                                }
                            }
                            else if (i > 0) {
                                initTaxField(i);
                            }
                        }
                        Controls.Save.Click();
                    };
                    // Init layout depending the input tax rate (false/true)
                    if (!layout.inputTaxRate.GetValue()) {
                        layout.taxCodes.forEach(function (field, index) {
                            if (index > 0) {
                                field.Hide(true);
                            }
                        });
                        Controls.VATAddRemoveButtons.Hide(true);
                    }
                    // Disable the button or not corresponding the fields displayed
                    if (fieldsVisible === 1) {
                        Controls.Remove__.SetDisabled(true);
                    }
                    else if (fieldsVisible === layout.taxCodes.length) {
                        Controls.Add__.SetDisabled(true);
                    }
                    // Set OnChange behavior on the input tax rate field
                    layout.inputTaxRate.OnChange = function () {
                        layout.taxCodes.forEach(function (field, index) {
                            if (index > 0 && index < fieldsVisible) {
                                field.Hide(!layout.inputTaxRate.GetValue());
                            }
                        });
                        Controls.VATAddRemoveButtons.Hide(!!!layout.inputTaxRate.GetValue());
                    };
                    // Set the remove button onclick action
                    Controls.Remove__.OnClick = function () {
                        var $fillRemoveField = function (dialog, tabId) {
                            if (!tabId) {
                                var ctrlText = "";
                                for (var i = 0; i < fieldsVisible; i++) {
                                    if (layout.taxCodes[i].IsVisible() && layout.taxCodes[i].GetValue()) {
                                        if (ctrlText) {
                                            ctrlText += "\n";
                                        }
                                        ctrlText += i + "=" + layout.taxCodes[i].GetValue() + " (" + layout.taxRates[i].GetValue().toFixed(2) + "%)";
                                    }
                                }
                                var ctrlField = dialog.AddComboBox("ctrlField", "_Tax");
                                ctrlField.SetText(ctrlText);
                            }
                        };
                        var $commitRemoveField = function (dialog) {
                            if (fieldsVisible > 1 && dialog.GetControl("ctrlField").GetValue()) {
                                var fieldIndex = parseInt(dialog.GetControl("ctrlField").GetValue(), 10);
                                var ctrl = layout.taxCodes[fieldIndex];
                                ctrl.SetValue("");
                                ctrl.SetLabel(Language.Translate("_TaxCode"));
                                layout.taxRates[fieldIndex].SetValue("");
                                for (var i = fieldIndex; i < layout.taxCodes.length; i++) {
                                    if (!layout.taxCodes[i].GetValue() && i + 1 < layout.taxCodes.length) {
                                        if (layout.taxCodes[i + 1].GetValue()) {
                                            initTaxField(i, i + 1);
                                            initTaxField(i + 1);
                                        }
                                        else {
                                            initTaxField(i);
                                        }
                                    }
                                }
                                fieldsVisible--;
                                if (fieldsVisible === 1) {
                                    Controls.Remove__.SetDisabled(true);
                                }
                                else if (fieldsVisible === layout.taxCodes.length - 1) {
                                    Controls.Add__.SetDisabled(false);
                                }
                                layout.taxCodes[fieldsVisible].Hide();
                                initTaxField(fieldsVisible);
                            }
                        };
                        Popup.Dialog("_Remove a tax", null, $fillRemoveField, $commitRemoveField); //, null, $handleEventAddField);
                    };
                    // Set the add button onclick action
                    Controls.Add__.OnClick = function () {
                        if (fieldsVisible < layout.taxCodes.length) {
                            layout.taxCodes[fieldsVisible++].Hide(false);
                        }
                        if (fieldsVisible === 2) {
                            Controls.Remove__.SetDisabled(false);
                        }
                        else if (fieldsVisible === layout.taxCodes.length) {
                            Controls.Add__.SetDisabled(true);
                        }
                    };
                    await (async function InitTemplateFeature() {
                        await Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Common.OnLoadLayoutManagerTemplates");
                        const templateOptions = Object.values(Lib.Expense.LayoutManager.templates)
                            .map(template => `${template.name}=${template.label || ("_" + template.name)}`);
                        Controls.Template__.SetAvailableValues(templateOptions);
                        // By default all behavior fields are hidden
                        Lib.Expense.LayoutManager.GetBehaviorFieldNames()
                            .forEach(fieldName => Controls[fieldName].Hide(true));
                        let RefreshLayout = options => {
                            options = options || {};
                            let template = Lib.Expense.LayoutManager.GetTemplate();
                            Sys.Helpers.Object.ForEach(template.fields, (field) => {
                                if (field.overloadBehavior) {
                                    let ctrl = Controls[field.overloadBehavior.fieldName];
                                    ctrl.Hide(false);
                                    if (!options.noDefaultValue && !field.overloadBehavior.keepValueWhenChangingTemplate) {
                                        ctrl.SetValue(field.overloadBehavior.defaultValue);
                                    }
                                }
                            });
                            Lib.Expense.LayoutManager.GetBehaviorFieldNames(Lib.Expense.LayoutManager.FieldSelector.Ignored)
                                .forEach(fieldName => Controls[fieldName].Hide(true));
                        };
                        Controls.Template__.OnChange = RefreshLayout;
                        RefreshLayout({
                            noDefaultValue: !!Data.GetValue("RuidEx")
                        });
                    })();
                    //For version before release which upgrade to release one
                    // Itemizable__ was hidden in layout.json before complete release
                    Controls.Itemizable__.Hide(false);
                }
                async function main() {
                    try {
                        Controls.Save.Wait(true);
                        await InitLayout();
                    }
                    finally {
                        Controls.Save.Wait(false);
                    }
                }
                main();
            })(CustomScript = ExpenseType.CustomScript || (ExpenseType.CustomScript = {}));
        })(ExpenseType = Expense.ExpenseType || (Expense.ExpenseType = {}));
    })(Expense = P2P.Expense || (P2P.Expense = {}));
})(P2P || (P2P = {}));
//# sourceMappingURL=customscript.js.map