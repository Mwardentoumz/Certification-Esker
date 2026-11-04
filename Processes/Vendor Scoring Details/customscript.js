"use strict";
/* eslint-disable class-methods-use-this */
var CustomScript;
(function (CustomScript) {
    var InternalScoring = Lib.VM.InternalScoring;
    CustomScript.topMessageWarning = Lib.P2P.TopMessageWarning(Controls.Warning, Controls.WarningMessage__);
    class Layout extends Lib.P2P.Layout.Manager {
        constructor() {
            super(Layout.panes, Layout.actionButtons, Layout.splitters);
            this.waitControl = Controls.AppliedRuleName__;
        }
    }
    Layout.panes = ["Banner", "Warning", "AppliedRule", "PreviewScore", "CalculationDetails", "IndicatorDetailsPanel", "Conditions"];
    Layout.actionButtons = ["Close"];
    Layout.splitters = ["form-content-middle"];
    CustomScript.Layout = Layout;
    class BaseVendorScoringView {
        constructor(rule, isReadonly = true, isNewRule = false) {
            this.rule = rule;
            this.isReadonly = isReadonly;
            this.isNewRule = !isReadonly && isNewRule;
            this.enabledScoreDefinitionIDs = InternalScoring.ScoreDefinition.GetEnabledScoreDefinitionIDs();
        }
        InitHeaderControls() {
            Controls.ApplicationCondition__.AddStyle("monospace");
            Controls.ApplicationConditionClone__.AddStyle("monospace");
            if (this.rule) {
                Controls.AppliedRuleName__.SetValue(this.rule.name);
                Controls.Active__.Check(this.rule.active);
                Controls.Order__.SetValue(this.rule.order);
                Controls.ApplicationCondition__.SetValue(this.rule.ToFormattedString());
                Controls.ApplicationConditionClone__.SetValue(this.rule.ToFormattedString());
            }
        }
        UpdateIndicatorCombobox(row) {
            const scoreDefinitionIDs = [...this.enabledScoreDefinitionIDs];
            const currentId = row.IndicatorCombobox__.GetValue();
            if (currentId && !scoreDefinitionIDs.includes(currentId)) {
                scoreDefinitionIDs.push(currentId);
            }
            row.IndicatorCombobox__.SetText(scoreDefinitionIDs
                .map((defID) => `${defID}=${InternalScoring.ScoreDefinition.GetScoreDefinitionDisplayName(defID)}`)
                .join("\n"));
        }
        FillThresholdsTable(indicatorItem) {
            const indicatorValue = indicatorItem.GetValue("IndicatorValue__");
            const defID = indicatorItem.GetValue("IndicatorCombobox__");
            const thresholds = JSON.parse(indicatorItem.GetValue("ThresholdsJSON__"))
                .map((json) => InternalScoring.Threshold.FromJSON(InternalScoring.ScoreDefinition.GetScoreDefinition(defID).valueType, json));
            const appliedThreshold = !Sys.Helpers.IsEmpty(indicatorValue) ? InternalScoring.Indicator.GetAppliedThreshold(thresholds, indicatorValue) : null;
            Controls.IndicatorDetailsPanel.SetLabel(Language.Translate("_IndicatorDetailsPanel ({0})", false, InternalScoring.ScoreDefinition.GetScoreDefinitionDisplayName(defID)));
            Controls.ThresholdsTable__.SetItemCount(0);
            for (const threshold of thresholds) {
                const thresholdItem = Controls.ThresholdsTable__.AddItem();
                thresholdItem.SetValue("When__", threshold.Translate(InternalScoring.ScoreDefinition.GetScoreDefinitionThresholdDisplayName(defID)));
                thresholdItem.SetValue("Points__", threshold.points);
                thresholdItem.SetValue("Applied__", threshold === appliedThreshold);
            }
            const isTableEmpty = !Controls.ThresholdsTable__.GetItemCount();
            Controls.ThresholdsTable__.Hide(isTableEmpty);
            Controls.Spacer2__.Hide(!isTableEmpty);
            Controls.NoThreshold__.Hide(!isTableEmpty || InternalScoring.ScoreDefinition.GetScoreDefinition(defID).valueType !== "decimal");
            Controls.Spacer4__.Hide(!isTableEmpty || InternalScoring.ScoreDefinition.GetScoreDefinition(defID).valueType !== "decimal");
            if (isTableEmpty && InternalScoring.ScoreDefinition.GetScoreDefinition(defID).valueType !== "decimal") {
                indicatorItem.SetError("IndicatorCombobox__", "_no_decimal_score_type_need_at_least_one_threshold");
            }
            else if (indicatorItem.GetError("IndicatorCombobox__") === Language.Translate("_no_decimal_score_type_need_at_least_one_threshold")) {
                indicatorItem.SetError("IndicatorCombobox__", "");
            }
            Controls.IndicatorDetailsPanel.Hide(false);
            Controls.EditThresholds__.Hide(true);
        }
        InitPanes(layout) {
            layout.DisplayPanels(this.initDisplayedPanes, this.initIgnoredPanes);
            if (!this.enabledScoreDefinitionIDs.length) {
                CustomScript.topMessageWarning.Add(Language.Translate(this.warningNoIndicatorKey));
                if (this.isNewRule) {
                    const panesToHide = ["AppliedRule", "Conditions", "CalculationDetails"];
                    for (const pane of panesToHide) {
                        Controls[pane].Hide(true);
                    }
                }
                Controls.Update.SetDisabled(true);
            }
        }
        InitControls() {
            this.InitHeaderControls();
            const FillThresholdsTable = this.FillThresholdsTable.bind(this);
            const UpdateIndicatorCombobox = this.UpdateIndicatorCombobox.bind(this);
            Controls.IndicatorsTable__.OnRefreshRow = (index) => {
                const row = Controls.IndicatorsTable__.GetRow(index);
                const deducedValue = row.DeducedPoints__.GetValue();
                row.DeducedPoints__.SetPlaceholder(Language.Translate("_NotApplicable"));
                if (deducedValue || deducedValue === 0) {
                    row.Arrow__.SetHTML('<span class="material-symbols-rounded text-color-color4">trending_flat</span>');
                    row.DeducedPoints__.SetTooltip({
                        html: "_Informations",
                        iconCssClasses: "text-color-color4",
                        position: "Right"
                    });
                }
                if (!this.isReadonly) {
                    const row = Controls.IndicatorsTable__.GetRow(index);
                    row.IndicatorCombobox__.SetTooltip({
                        html: "_Informations",
                        iconCssClasses: "text-color-color4",
                        position: "Right"
                    });
                }
                UpdateIndicatorCombobox(row);
            };
            Controls.IndicatorsTable__.OnFocusRow = (index) => {
                FillThresholdsTable(Controls.IndicatorsTable__.GetItem(index));
            };
            Controls.IndicatorsTable__.OnClick = (row) => {
                FillThresholdsTable(row.GetItem());
            };
            Controls.IndicatorsTable__.Arrow__.OnClick = function () {
                FillThresholdsTable(this.GetRow().GetItem());
            };
            Controls.ThresholdsTable__.SetExtendableColumn("When__");
            Controls.ThresholdsTable__.OnRefreshRow = (index) => {
                const row = Controls.ThresholdsTable__.GetRow(index);
                const isApplied = row.Applied__.IsChecked();
                row.RemoveStyle("skin-highlight");
                if (isApplied) {
                    row.AddStyle("skin-highlight");
                }
            };
            Controls.IndicatorsTable__.IndicatorCombobox__.OnChange = function () {
                const row = this.GetRow();
                const item = row.GetItem();
                item.SetValue("ThresholdsJSON__", "[]");
                FillThresholdsTable(item);
                UpdateIndicatorCombobox(row);
            };
            Controls.IndicatorsTable__.OnAddItem = function (item) {
                item.SetValue("ThresholdsJSON__", "[]");
                item.SetValue("Coefficient__", 1);
            };
            Controls.IndicatorsTable__.OnDeleteItem = function () {
                if (this.GetItemCount() === 0) {
                    const alwaysItem = this.AddItem();
                    alwaysItem.SetValue("ThresholdsJSON__", "[]");
                    alwaysItem.SetValue("Coefficient__", 1);
                }
            };
            Controls.IndicatorsTable__.Coefficient__.OnChange = function () {
                const item = this.GetRow().GetItem();
                if (item.GetValue("Coefficient__") < 0) {
                    item.SetValue("Coefficient__", 0);
                }
            };
            Controls.IndicatorsTable__.Spacer__.Hide(true);
        }
        async FillFormData() {
            var _a;
            this.InitBanner();
            await this.FillIndicatorsTable();
            (_a = this.rule) === null || _a === void 0 ? void 0 : _a.CleanIndicators(); // IndicatorsTable__ are ref Data
        }
    }
    CustomScript.BaseVendorScoringView = BaseVendorScoringView;
    class VendorScoringViewDetails extends BaseVendorScoringView {
        constructor(vendor, rule) {
            super(rule);
            //#region LAYOUT
            this.initDisplayedPanes = ["Banner", "AppliedRule", "PreviewScore", "CalculationDetails"];
            this.initIgnoredPanes = ["Warning"];
            this.warningNoIndicatorKey = "_Warning: no applicable indicator for this vendor";
            this.vendor = vendor;
        }
        static async QueryAndComputeScore(vendor, rule) {
            const scores = await InternalScoring.GetVendorsScores([vendor]);
            return rule.ComputeScore(scores[InternalScoring.GetVendorUniqueID(vendor)]);
        }
        InitBanner() {
            const vendorName = this.vendor.GetValue("Name__");
            const internalScore = this.vendor.GetValue("Number__.InternalScore__");
            Controls.HTMLBanner__.FireEvent("onBannerLoad", {
                translation: {
                    vendorNameLabel: Language.Translate("_Supplier scoring details title", false)
                },
                vendorNameValue: vendorName
            });
            Controls.HTMLBanner__.FireEvent("onNewScore", {
                scoreValue: internalScore,
                scoreColor: Lib.Purchasing.Vendor.Client.GetScoreColor(internalScore)
            });
        }
        InitHeaderControls() {
            super.InitHeaderControls();
            Controls.AppliedRuleName__.SetReadOnly(true);
            Controls.Order__.SetReadOnly(true);
        }
        ExtractDisplayIndicatorValue(details) {
            if (details.indicator.valueType === "decimal") {
                const providerScore = Number(details.providerScore);
                if (isNaN(providerScore)) {
                    return "";
                }
                return Language.FormatNumber(providerScore, false, 0, VendorScoringViewDetails.DISPLAY_INDICATOR_VALUE_PRECISION);
            }
            return String(details.providerScore);
        }
        async FillIndicatorsTable() {
            if (this.rule) {
                const computedScore = await VendorScoringViewDetails.QueryAndComputeScore(this.vendor, this.rule);
                for (const detail of computedScore.details) {
                    const item = Controls.IndicatorsTable__.AddItem();
                    item.SetValue("IndicatorCombobox__", detail.indicator.defID);
                    item.SetValue("ThresholdsJSON__", JSON.stringify(detail.indicator.GetThresholds()));
                    if (detail.providerScore) {
                        item.SetValue("IndicatorValue__", this.ExtractDisplayIndicatorValue(detail));
                        if (typeof detail.deducedPoints === "number") {
                            item.SetValue("DeducedPoints__", detail.deducedPoints);
                            item.SetValue("Coefficient__", detail.coefficient);
                            item.SetValue("Multiplication__", "x");
                            item.SetValue("Equal__", "=");
                            item.SetValue("TotalPoints__", detail.totalPoints);
                        }
                    }
                }
                this.InitTotals(computedScore);
            }
        }
        InitTotals(computedScore) {
            const formattedTotal = Language.FormatNumber(computedScore.value, true);
            if (computedScore.value !== null) {
                Controls.IndicatorsTable__.AddSummaryDescription(4, "Total", Language.Translate("_Total", false));
                const totalCoefficientControl = Controls.IndicatorsTable__.AddSummaryDecimal(7, "TotalCoefficient");
                totalCoefficientControl.SetPrecisionMax(0);
                totalCoefficientControl.SetValue(computedScore.totalCoef);
                totalCoefficientControl.SetReadOnly(true);
                totalCoefficientControl.SetTextAlignment("center");
                const totalPointsControl = Controls.IndicatorsTable__.AddSummaryDecimal(9, "TotalPoints");
                totalPointsControl.SetPrecisionMax(0);
                totalPointsControl.SetValue(computedScore.totalPoints);
                totalPointsControl.SetReadOnly(true);
                totalPointsControl.SetTextAlignment("center");
                const textScore = `${Language.FormatNumber(computedScore.totalPoints, true)} / ${Language.FormatNumber(computedScore.totalCoef, true)} = ${formattedTotal}`;
                Controls.ScoreCalcul__.SetValue(computedScore.totalCoef > 0 ? textScore : "0");
                Controls.ScoreGauge__.SetHTML(Lib.Purchasing.Vendor.Client.GetScoreGaugeHTML(computedScore.value));
            }
            else {
                Controls.ScoreCalcul__.Hide(true);
                Controls.PreviewScore.Hide(true);
                CustomScript.topMessageWarning.Add(Language.Translate(this.warningNoIndicatorKey));
            }
            const formattedInternalScore = Language.FormatNumber(parseFloat(this.vendor.GetValue("Number__.InternalScore__")), true);
            if (formattedTotal !== formattedInternalScore) {
                this.DisplayWarningScoresDontMatch(formattedTotal, formattedInternalScore);
            }
        }
        DisplayWarningScoresDontMatch(calculatedScore, savedScore) {
            const lastInternalScoreUpdate = this.vendor.GetValue("Number__.InternalScoreLastComputeDateTime__");
            let lastComputeDate = "/";
            if (lastInternalScoreUpdate) {
                lastComputeDate = Sys.Helpers.Date.ToLocale(new Date(lastInternalScoreUpdate), User.culture);
            }
            const warn = Language.Translate("_Warning: calculated score ({0}) different than vendor score ({1}) last computed date {2}", false, calculatedScore, savedScore, lastComputeDate);
            CustomScript.topMessageWarning.Add(warn);
        }
    }
    VendorScoringViewDetails.DISPLAY_INDICATOR_VALUE_PRECISION = 3;
    CustomScript.VendorScoringViewDetails = VendorScoringViewDetails;
    class RuleFieldInput {
        get replaceInputOnBrowseResult() {
            return false;
        }
        ;
        static Build(fieldName) {
            const raw = InternalScoring.FIELD_DEFINITIONS[fieldName];
            const rawClient = InternalScoring.FIELD_DEFINITIONS_CLIENT[fieldName];
            if (!raw) {
                throw new Error(`unknow filed: ${fieldName}, the field need be register in FIELD_DEFINITIONS`);
            }
            if (!rawClient) {
                throw new Error(`unknow filed: ${fieldName}, the field need be register in FIELD_DEFINITIONS_CLIENT`);
            }
            if (rawClient.browseSettings) {
                return new BrowsableRuleFieldInput(fieldName, raw, rawClient);
            }
            else {
                return new RuleFieldInput(fieldName, raw, rawClient);
            }
        }
        constructor(name, raw, rawClient) {
            this.isBrowsable = false;
            this.name = name;
            this.type = raw.type;
            this.allowManualEdit = rawClient.allowManualEdit;
            this.placeholder = rawClient.placeholder;
        }
        Browse() {
            return Promise.resolve([]);
        }
        GetTranstionKey() {
            return `_${this.name}`;
        }
    }
    class BrowsableRuleFieldInput extends RuleFieldInput {
        get replaceInputOnBrowseResult() {
            var _a;
            // rawClient.browseSettings.result are use for multi select browse, so we replace the current values by result.
            return !!((_a = this === null || this === void 0 ? void 0 : this.browseSettings) === null || _a === void 0 ? void 0 : _a.result);
        }
        ;
        constructor(name, raw, rawClient) {
            super(name, raw, rawClient);
            this.isBrowsable = true;
            this.browseSettings = rawClient.browseSettings;
        }
        BuildBrowseListSettings() {
            var _a, _b, _c;
            return {
                ...this.browseSettings,
                "dialogTitle": Language.Translate(this.browseSettings.dialogTitle, false),
                "headerText": Language.Translate(this.browseSettings.headerText, false),
                "tableTitle": Language.Translate(this.browseSettings.tableTitle, false),
                "helperText": Language.Translate(this.browseSettings.helperText, false),
                "selectedTableTitle": Language.Translate(this.browseSettings.selectedTableTitle, false),
                "selectedHelperText": Language.Translate(this.browseSettings.selectedHelperText, false),
                columns: (_a = this.browseSettings.columns) === null || _a === void 0 ? void 0 : _a.map((column) => ({
                    ...column,
                    label: Language.Translate(column.label, false),
                })),
                result: (_b = this.browseSettings.result) === null || _b === void 0 ? void 0 : _b.map((res) => ({
                    ...res,
                    NICEVALUE: Language.Translate(res.NICEVALUE, false)
                })),
                searchCriterias: (_c = this.browseSettings.searchCriterias) === null || _c === void 0 ? void 0 : _c.map((criteria) => ({
                    ...criteria,
                    label: Language.Translate(criteria.label, false),
                })),
                maxRowCountPerPage: this.browseSettings.maxRowCountPerPage || BrowsableRuleFieldInput.MAX_ROW_COUNT_PER_PAGE,
                maxRowCount: this.browseSettings.maxRowCount !== null ? (this.browseSettings.maxRowCount || BrowsableRuleFieldInput.MAX_ROW_COUNT) : null
            };
        }
        ExtractResultValues(results) {
            return results === null || results === void 0 ? void 0 : results.map((result) => result[this.browseSettings.storedValueColumn]);
        }
        Browse() {
            return new Promise((resolve) => {
                Sys.Helpers.Browse.BrowseList({
                    ...this.BuildBrowseListSettings(),
                    onClose: (results) => resolve(this.ExtractResultValues(results))
                });
            });
        }
    }
    BrowsableRuleFieldInput.MAX_ROW_COUNT_PER_PAGE = 10;
    BrowsableRuleFieldInput.MAX_ROW_COUNT = 10;
    function BuildRuleFieldsInputMap() {
        const ruleFieldMap = {};
        for (const fieldName of Object.keys(InternalScoring.FIELD_DEFINITIONS)) {
            ruleFieldMap[fieldName] = RuleFieldInput.Build(fieldName);
        }
        return ruleFieldMap;
    }
    const RULE_FIELD_INPUTS = BuildRuleFieldsInputMap();
    class RuleConditionDialogEdition {
        constructor(conditions) {
            this.conditionsForInit = conditions;
        }
        UpdateOperator(ruleField, row) {
            const operatorNiceNames = ["=_Select an operator"];
            if (ruleField) {
                const operators = Lib.P2P.RuleCondition.FieldType.GetAvailableOperators(ruleField.type);
                for (const operator of operators) {
                    operatorNiceNames.push(`${Sys.WorkflowEngine.operators[operator].niceName.languageKey}`);
                }
            }
            row.Operator__.SetAvailableValues(operatorNiceNames);
        }
        UpdateValue(ruleField, row) {
            if (ruleField) {
                row.Value__.Hide(false);
                row.Value__.SetReadOnly(ruleField.allowManualEdit === false);
                row.Value__.SetPlaceholder(ruleField.placeholder);
                row.Value__.SetBrowsable(ruleField.isBrowsable);
            }
            else {
                row.Value__.SetValue(null);
                row.Value__.SetBrowsable(false);
                row.Value__.SetReadOnly(true);
                row.Value__.SetPlaceholder(null);
            }
        }
        // Fill dialog callback: Design and instantiation of the controls.
        fill_CB(dialog) {
            const error_control = dialog.AddDescription("ErrorOnDialogMsg__");
            error_control.SetText("_ErrorOnDialogMsg");
            error_control.SetErrorStyle();
            dialog.HideControl(error_control, true);
            // 1 - Dialog design.
            const ctrl_Table = dialog.AddTable("Conditions__");
            dialog.AddSeparator();
            const ctrlField = ctrl_Table.AddComboBoxColumn("Field__", "_Field", 250);
            ctrlField.SetText("=_Select a field\n" +
                Object.values(RULE_FIELD_INPUTS).map(rField => `${rField.name}=${rField.GetTranstionKey()}`)
                    .join("\n"));
            ctrl_Table.AddComboBoxColumn("Operator__", "_Operator", 200);
            ctrl_Table.AddTextColumn("Value__", "_Value", 300);
            ctrl_Table.HideTableRowMenu(true);
            ctrl_Table.HideTopNavigation(true);
            ctrl_Table.HideBottomNavigation(true);
            ctrl_Table.HideTableRowDelete(false);
            ctrl_Table.HideTableRowAdd(false);
            if (this.conditionsForInit.length > 0) {
                for (let i = 0; i < this.conditionsForInit.length; i++) {
                    const condition = this.conditionsForInit[i];
                    const item = ctrl_Table.AddItem();
                    const operators = Lib.P2P.RuleCondition.FieldType.GetAvailableOperators(condition.type);
                    item.SetValue("Field__", condition.fieldName);
                    item.SetValue("Operator__", `${1 + operators.findIndex((op) => op === condition.operator)}`);
                    item.SetValue("Value__", condition.values.join(Lib.P2P.RuleCondition.Condition.MULTIPLE_VALUES_SEPARATOR));
                }
            }
            else {
                this.CreateEmptyItem(dialog);
            }
        }
        CreateEmptyItem(dialog) {
            const alwaysItem = dialog.GetControl("Conditions__").AddItem();
            alwaysItem.SetValue("Operator__", "");
            alwaysItem.SetValue("Field__", "");
            alwaysItem.SetValue("Value__", "");
        }
        ExtractOperator(item) {
            const fieldName = item.GetValue("Field__");
            const operatorIndex = item.GetValue("Operator__");
            const ruleField = RULE_FIELD_INPUTS[fieldName];
            const operators = Lib.P2P.RuleCondition.FieldType.GetAvailableOperators(ruleField.type);
            return operators[Number(operatorIndex) - 1];
        }
        AllowMultipleValues(item) {
            var _a;
            return (_a = Sys.WorkflowEngine.operators[this.ExtractOperator(item)]) === null || _a === void 0 ? void 0 : _a.allowMultipleValues;
        }
        ExtractValues(item) {
            var _a;
            const inputs = (_a = item.GetValue("Value__")) === null || _a === void 0 ? void 0 : _a.split(Lib.P2P.RuleCondition.Condition.MULTIPLE_VALUES_SEPARATOR);
            const fieldName = item.GetValue("Field__");
            const ruleField = RULE_FIELD_INPUTS[fieldName];
            if (this.AllowMultipleValues(item)) {
                return inputs.map((v) => Lib.P2P.RuleCondition.FieldType.ExtractValue(ruleField.type, v));
            }
            else {
                return [Lib.P2P.RuleCondition.FieldType.ExtractValue(ruleField.type, inputs[0])];
            }
        }
        ExtractConditions(dialog) {
            const newConditions = [];
            const tableControl = dialog.GetControl("Conditions__");
            if (!this.IsConditionsEmpty(dialog)) {
                for (let i = 0; i < tableControl.GetItemCount(); i++) {
                    const item = tableControl.GetItem(i);
                    newConditions.push(Lib.P2P.RuleCondition.Instance.Build(item.GetValue("Field__"), this.ExtractOperator(item), this.ExtractValues(item), Lib.VM.InternalScoring.FIELD_DEFINITIONS));
                }
            }
            return newConditions;
        }
        IsConditionsEmpty(dialog) {
            const tableControl = dialog.GetControl("Conditions__");
            if (tableControl.GetItemCount() === 1) {
                const item = tableControl.GetItem(0);
                const isOperatorEmpty = !item.GetValue("Operator__") || item.GetValue("Operator__") === '0';
                return !item.GetValue("Field__") && isOperatorEmpty && !item.GetValue("Value__");
            }
            return false;
        }
        // Commit dialog callback: Updates the process form with dialog results.
        commit_CB(dialog, tabId, event, control) {
            this.resolve(this.ExtractConditions(dialog));
        }
        validate_CB(dialog, tabId, event, control) {
            var _a;
            let isValid = true;
            const tableControl = dialog.GetControl("Conditions__");
            if (!this.IsConditionsEmpty(dialog)) {
                for (let i = 0; i < tableControl.GetItemCount(); i++) {
                    const item = tableControl.GetItem(i);
                    if (!item.GetValue("Field__")) {
                        item.SetError("Field__", "_required");
                    }
                    if (!item.GetValue("Operator__") || item.GetValue("Operator__") === '0') {
                        item.SetError("Operator__", "_required");
                    }
                    if (!item.GetValue("Value__")) {
                        item.SetError("Value__", "_required");
                    }
                    if (!item.GetError("Value__") && !item.GetError("Field__") && !item.GetError("Operator__")) {
                        const inputs = (_a = item.GetValue("Value__")) === null || _a === void 0 ? void 0 : _a.split(Lib.P2P.RuleCondition.Condition.MULTIPLE_VALUES_SEPARATOR);
                        const field = item.GetValue("Field__");
                        const ruleField = RULE_FIELD_INPUTS[field];
                        if (this.AllowMultipleValues(item)) {
                            if (!inputs.every((v) => Lib.P2P.RuleCondition.FieldType.IsValidInput(ruleField.type, v))) {
                                item.SetError("Value__", `_field_input_invalid_${ruleField.type}_format`);
                            }
                        }
                        else if (inputs.length > 1 || !Lib.P2P.RuleCondition.FieldType.IsValidInput(ruleField.type, inputs[0])) {
                            item.SetError("Value__", `_field_input_invalid_${ruleField.type}_format`);
                        }
                    }
                    isValid && (isValid = !item.GetError("Value__") && !item.GetError("Field__") && !item.GetError("Operator__"));
                }
                if (!isValid) {
                    const errorMsgControl = dialog.GetControl("ErrorOnDialogMsg__");
                    errorMsgControl.SetText("_ErrorOnDialogMsg");
                    dialog.HideControl(errorMsgControl, false);
                }
            }
            return isValid;
        }
        OnRefreshRow(dialog, tabId, event, control, index) {
            const row = control.GetRow(index);
            const fieldName = row.Field__.GetValue();
            const ruleField = RULE_FIELD_INPUTS[fieldName];
            this.UpdateOperator(ruleField, row);
            this.UpdateValue(ruleField, row);
        }
        OnChange(dialog, tabId, event, control) {
            const row = control.GetRow();
            if (control.GetName() === "Field__") {
                row.Value__.SetValue(null); // Clean current value
                const fieldName = control.GetValue();
                const ruleField = RULE_FIELD_INPUTS[fieldName];
                this.UpdateOperator(ruleField, row);
                this.UpdateValue(ruleField, row);
            }
            control.RemoveStyle("Error");
        }
        OnBrowse(dialog, tabId, event, control) {
            const row = control.GetRow();
            const item = row.GetItem();
            const fieldName = row.Field__.GetValue();
            const ruleField = RULE_FIELD_INPUTS[fieldName];
            if (ruleField) {
                ruleField.Browse()
                    .then((selectedValues) => {
                    var _a;
                    if (selectedValues) {
                        if (this.AllowMultipleValues(item)) {
                            const currentValues = ruleField.replaceInputOnBrowseResult
                                ? []
                                : ((_a = row.Value__.GetValue()) === null || _a === void 0 ? void 0 : _a.split(Lib.P2P.RuleCondition.Condition.MULTIPLE_VALUES_SEPARATOR)) || [];
                            const uniqueValues = new Set([...currentValues, ...selectedValues]
                                .filter((e) => !Sys.Helpers.IsEmpty(e)));
                            row.Value__.SetValue([...uniqueValues].join(Lib.P2P.RuleCondition.Condition.MULTIPLE_VALUES_SEPARATOR));
                        }
                        else {
                            row.Value__.SetValue(selectedValues[0]);
                        }
                    }
                });
            }
        }
        OnDeleteItem(dialog, tabId, event, control) {
            const tableControl = dialog.GetControl("Conditions__");
            if (tableControl.GetItemCount() === 0) {
                this.CreateEmptyItem(dialog);
            }
        }
        handle_CB(dialog, tabId, event, control) {
            var _a;
            Log.Info("event: " + event + ", tabId: " + tabId + ", control: " + control.GetName());
            (_a = this[event]) === null || _a === void 0 ? void 0 : _a.apply(this, arguments);
        }
        cancel_CB( /*dialog, tabId, event, control*/) {
            this.resolve(null);
        }
        rollback_CB( /*dialog, tabId, event, control*/) {
            this.resolve(null);
        }
        Open() {
            return new Promise((resovle) => {
                this.resolve = resovle;
                // Instantiate the dialog.
                Popup.Dialog("_Conditions", null, this.fill_CB.bind(this), this.commit_CB.bind(this), this.validate_CB.bind(this), this.handle_CB.bind(this), this.cancel_CB.bind(this), this.rollback_CB.bind(this));
            });
        }
    }
    class ThresholdsDialogEdition {
        get valueType() {
            return InternalScoring.ScoreDefinition.GetScoreDefinition(this.defID).valueType;
        }
        get scoreDisplayName() {
            return InternalScoring.ScoreDefinition.GetScoreDefinitionThresholdDisplayName(this.defID);
        }
        constructor(defID, thresholds) {
            this.thresholds = thresholds;
            this.defID = defID;
        }
        CreateEmptyItem(dialog) {
            const alwaysItem = dialog.GetControl("Conditions__").AddItem();
            alwaysItem.SetValue("ScoreSuffix__", this.scoreDisplayName);
            alwaysItem.SetValue("Operator__", "");
            alwaysItem.SetValue("Value__", "");
            alwaysItem.SetValue("Points__", "");
        }
        UpdateOperator(row) {
            const operatorNiceNames = ["=_Select an operator"];
            const operators = Lib.P2P.RuleCondition.FieldType.GetAvailableOperators(this.valueType);
            for (const operator of operators) {
                operatorNiceNames.push(`${Sys.WorkflowEngine.operators[operator].niceName.languageKey}`);
            }
            row.Operator__.SetAvailableValues(operatorNiceNames);
        }
        OnRefreshRow(dialog, tabId, event, control, index) {
            const row = control.GetRow(index);
            row.ScoreSuffix__.SetValue(this.scoreDisplayName);
            this.UpdateOperator(row);
        }
        OnDeleteItem(dialog, tabId, event, control, item, index) {
            if (control.GetItemCount() === 0) {
                this.CreateEmptyItem(dialog);
            }
        }
        ExtractOperator(item) {
            const operatorIndex = item.GetValue("Operator__");
            const operators = Lib.P2P.RuleCondition.FieldType.GetAvailableOperators(this.valueType);
            return operators[Number(operatorIndex) - 1];
        }
        fill_CB(dialog) {
            const error_control = dialog.AddDescription("ErrorOnDialogMsg__");
            error_control.SetText("_ErrorOnThresholdsDialogMsg");
            error_control.SetErrorStyle();
            dialog.HideControl(error_control, true);
            // 1 - Dialog design.
            const ctrl_Table = dialog.AddTable("Conditions__");
            dialog.AddSeparator();
            const ctrlLabelField = ctrl_Table.AddTextColumn("ScoreSuffix__", "_When", 250);
            ctrlLabelField.SetReadOnly(true);
            const ctrlOperator = ctrl_Table.AddComboBoxColumn("Operator__", "_Operator", 200);
            ctrlOperator.SetRequired(true);
            const ctrlValue = ctrl_Table.AddTextColumn("Value__", "_Value", 200);
            ctrlValue.SetRequired(true);
            const ctrlPoints = ctrl_Table.AddDecimalColumn("Points__", "_Points", 200);
            ctrlPoints.SetPrecision(0);
            ctrlPoints.SetPrecisionMin(0);
            ctrlPoints.SetPrecisionMax(0);
            ctrlPoints.SetRequired(true);
            ctrl_Table.HideTableRowMenu(true);
            ctrl_Table.HideTopNavigation(true);
            ctrl_Table.HideBottomNavigation(true);
            ctrl_Table.HideTableRowDelete(false);
            ctrl_Table.HideTableRowAdd(false);
            if (this.thresholds.length > 0) {
                for (const threshold of this.thresholds) {
                    const item = ctrl_Table.AddItem();
                    const operators = Lib.P2P.RuleCondition.FieldType.GetAvailableOperators(threshold.type);
                    item.SetValue("ScoreSuffix__", this.scoreDisplayName);
                    item.SetValue("Operator__", `${1 + operators.findIndex((op) => op === threshold.operator)}`);
                    item.SetValue("Value__", threshold.values.join(Lib.P2P.RuleCondition.Condition.MULTIPLE_VALUES_SEPARATOR));
                    item.SetValue("Points__", threshold.points);
                }
            }
            else {
                this.CreateEmptyItem(dialog);
            }
        }
        validate_CB(dialog, tabId, event, control) {
            let isValid = true;
            const tableControl = dialog.GetControl("Conditions__");
            if (!this.IsThresholdsEmpty(dialog) || this.valueType !== "decimal") {
                for (let i = 0; i < tableControl.GetItemCount(); i++) {
                    const item = tableControl.GetItem(i);
                    if (!item.GetValue("Operator__") || item.GetValue("Operator__") === '0') {
                        item.SetError("Operator__", "_required");
                    }
                    if (item.GetValue("Value__")) {
                        const inputs = item.GetValue("Value__");
                        if (!Lib.P2P.RuleCondition.FieldType.IsValidInput(this.valueType, inputs[0])) {
                            item.SetError("Value__", `_field_input_invalid_${this.valueType}_format`);
                        }
                    }
                    else {
                        item.SetError("Value__", "_required");
                    }
                    if (!item.GetError("Points__")) {
                        if (item.GetValue("Points__") === null) {
                            item.SetError("Points__", "_required");
                        }
                        else {
                            const points = Number(item.GetValue("Points__")) || 0;
                            if (points < 0 || points > 100) {
                                item.SetError("Points__", "_should_be_between_{0}_and_{1}", 0, 100);
                            }
                        }
                    }
                    isValid && (isValid = !item.GetError("Value__") && !item.GetError("Points__") && !item.GetError("Operator__"));
                }
                if (!isValid) {
                    const errorMsgControl = dialog.GetControl("ErrorOnDialogMsg__");
                    errorMsgControl.SetText("_ErrorOnThresholdsDialogMsg");
                    dialog.HideControl(errorMsgControl, false);
                }
            }
            return isValid;
        }
        handle_CB(dialog, tabId, event, control) {
            var _a;
            Log.Info("event: " + event + ", tabId: " + tabId + ", control: " + control.GetName());
            (_a = this[event]) === null || _a === void 0 ? void 0 : _a.apply(this, arguments);
        }
        ExtractThreshold(dialog) {
            const newThresholds = [];
            const tableControl = dialog.GetControl("Conditions__");
            if (!this.IsThresholdsEmpty(dialog)) {
                for (let i = 0; i < tableControl.GetItemCount(); i++) {
                    const item = tableControl.GetItem(i);
                    newThresholds.push(new InternalScoring.Threshold(Number(item.GetValue("Points__")), this.valueType, this.ExtractOperator(item), Lib.P2P.RuleCondition.FieldType.ExtractValue(this.valueType, item.GetValue("Value__"))));
                }
            }
            return newThresholds;
        }
        IsThresholdsEmpty(dialog) {
            const tableControl = dialog.GetControl("Conditions__");
            if (tableControl.GetItemCount() === 1) {
                const item = tableControl.GetItem(0);
                const isOperatorEmpty = !item.GetValue("Operator__") || item.GetValue("Operator__") === '0';
                return isOperatorEmpty && !item.GetValue("Value__") && !item.GetValue("Points__");
            }
            return false;
        }
        commit_CB(dialog, tabId, event, control) {
            this.resolve(this.ExtractThreshold(dialog));
        }
        cancel_CB( /*dialog, tabId, event, control*/) {
            this.resolve(null);
        }
        rollback_CB( /*dialog, tabId, event, control*/) {
            this.resolve(null);
        }
        Open() {
            return new Promise((resovle) => {
                this.resolve = resovle;
                // Instantiate the dialog.
                Popup.Dialog(Language.Translate("_ThresholdsEditionTitle", false), null, this.fill_CB.bind(this), this.commit_CB.bind(this), this.validate_CB.bind(this), this.handle_CB.bind(this), this.cancel_CB.bind(this), this.rollback_CB.bind(this));
            });
        }
    }
    class VendorScoringViewEdition extends BaseVendorScoringView {
        constructor(rule, isReadonly, isNewRule) {
            super(rule, isReadonly, isNewRule);
            //#region LAYOUT
            this.initDisplayedPanes = ["Banner", "AppliedRule", "CalculationDetails", "Conditions"];
            this.initIgnoredPanes = ["Warning"];
            this.warningNoIndicatorKey = "_Warning: no applicable indicator for this rule";
        }
        InitHeaderControls() {
            super.InitHeaderControls();
            Controls.AppliedRule.SetLabel("_RuleInformation");
            Controls.AppliedRuleName__.SetRequired(!this.isReadonly);
            Controls.AppliedRuleName__.SetReadOnly(this.isReadonly);
            Controls.AppliedRuleName__.OnChange = () => {
                this.rule.name = Controls.AppliedRuleName__.GetValue();
            };
            Controls.Active__.Hide(false);
            Controls.Active__.SetReadOnly(this.isReadonly);
            Controls.Active__.OnChange = () => {
                this.rule.active = Controls.Active__.IsChecked();
            };
            Controls.Order__.SetRequired(!this.isReadonly);
            Controls.Order__.SetReadOnly(this.isReadonly);
            Controls.Order__.Hide(false);
            Controls.Order__.OnChange = () => {
                const newValue = Controls.Order__.GetValue();
                if (newValue <= 0) {
                    Controls.Order__.SetError("_OrderMustBePositive");
                }
                else {
                    Controls.Order__.SetError("");
                }
                this.rule.order = Controls.Order__.GetValue();
            };
            Controls.ApplicationCondition__.SetBrowsable(!this.isReadonly);
            Controls.ApplicationCondition__.SetReadOnly(true);
            Controls.ApplicationConditionClone__.Hide(true);
            Controls.ApplicationCondition__.OnBrowse = async () => {
                const dialog = new RuleConditionDialogEdition(this.rule.GetConditions());
                const newConditions = await dialog.Open();
                if (newConditions) {
                    this.rule.SetConditions(newConditions);
                    // Update view
                    Controls.ApplicationCondition__.SetValue(this.rule.ToFormattedString());
                    Controls.ApplicationConditionClone__.SetValue(this.rule.ToFormattedString());
                }
            };
            if (!this.isReadonly) {
                if (!Controls.AppliedRuleName__.GetValue()) {
                    // Not in DB Bug ? error are not detect on save if field are not in error.
                    Controls.AppliedRuleName__.SetError("_required");
                }
                if (!Controls.Order__.GetValue()) {
                    // Not in DB Bug ? error are not detect on save if field are not in error.
                    Controls.Order__.SetError("_required");
                }
            }
        }
        FillThresholdsTable(indicatorItem) {
            super.FillThresholdsTable(indicatorItem);
            const defID = indicatorItem.GetValue("IndicatorCombobox__");
            const valueType = InternalScoring.ScoreDefinition.GetScoreDefinition(defID).valueType;
            const thresholds = JSON.parse(indicatorItem.GetValue("ThresholdsJSON__"))
                .map((json) => InternalScoring.Threshold.FromJSON(valueType, json));
            Controls.EditThresholds__.Hide(this.isReadonly);
            Controls.EditThresholds__.SetButtonLabel(thresholds.length ? "_EditThresholds" : "_AddThresholds");
            Controls.EditThresholds__.OnClick = async () => {
                const dialog = new ThresholdsDialogEdition(defID, thresholds);
                const newThresholds = await dialog.Open();
                if (newThresholds) {
                    indicatorItem.SetValue("ThresholdsJSON__", JSON.stringify(newThresholds));
                    this.FillThresholdsTable(indicatorItem);
                }
            };
        }
        InitControls() {
            super.InitControls();
            Controls.Update.Hide(this.isReadonly);
            Controls.Update.OnClick = this.OnFormUpdate.bind(this);
            Controls.Delete.Hide(this.isReadonly || this.isNewRule);
            Controls.Delete.OnClick = this.OnFormDelete.bind(this);
            Controls.IndicatorsTable__.SetReadOnly(this.isReadonly);
            Controls.IndicatorsTable__.HideTableRowDelete(this.isReadonly);
            Controls.IndicatorsTable__.HideTableRowAdd(this.isReadonly);
            Controls.IndicatorsTable__.Coefficient__.SetReadOnly(this.isReadonly);
            Controls.IndicatorsTable__.Coefficient__.SetRequired(!this.isReadonly);
            Controls.IndicatorsTable__.IndicatorCombobox__.SetReadOnly(this.isReadonly);
            Controls.IndicatorsTable__.Spacer__.Hide(this.isReadonly);
            Controls.IndicatorsTable__.DisableMenuAddLine(!this.isReadonly);
            Controls.IndicatorsTable__.DisableMenuInsertLine(!this.isReadonly);
            Controls.IndicatorsTable__.HideTableRowDelete(this.isReadonly);
        }
        InitBanner() {
            Controls.form_header.SetProcessDisplayName("_EditingProcessDisplayName");
            const banner = Sys.Helpers.Banner;
            banner.SetHTMLBanner(Controls.HTMLBanner__);
            banner.SetMainTitle("_VendorScoringBanner");
            banner.Apply();
        }
        async FillIndicatorsTable() {
            Controls.ScoreCalcul__.Hide(true);
            Controls.IndicatorsTable__.IndicatorValue__.Hide(true);
            Controls.IndicatorsTable__.Arrow__.Hide(true);
            Controls.IndicatorsTable__.DeducedPoints__.Hide(true);
            Controls.IndicatorsTable__.Multiplication__.Hide(true);
            Controls.IndicatorsTable__.Equal__.Hide(true);
            Controls.IndicatorsTable__.TotalPoints__.Hide(true);
            const indicators = this.rule.GetIndicators();
            for (const indicator of indicators) {
                const item = Controls.IndicatorsTable__.AddItem();
                item.SetValue("IndicatorCombobox__", indicator.defID);
                item.SetValue("Coefficient__", indicator.coefficient);
                item.SetValue("ThresholdsJSON__", JSON.stringify(indicator.GetThresholds()));
                if (!this.enabledScoreDefinitionIDs.includes(indicator.defID)) {
                    item.SetWarning("IndicatorCombobox__", "_Indicator no longer enabled");
                }
            }
            if (!this.isReadonly && !indicators.length) {
                const item = Controls.IndicatorsTable__.AddItem();
                const defID = this.enabledScoreDefinitionIDs[0];
                item.SetValue("IndicatorCombobox__", defID);
                item.SetValue("Coefficient__", 1);
                item.SetValue("ThresholdsJSON__", "[]");
                this.FillThresholdsTable(item);
            }
        }
        SerializeRuleOnProcess() {
            this.rule.CleanIndicators();
            Sys.Helpers.Controls.ForEachTableItem(Controls.IndicatorsTable__, (item) => {
                const defID = item.GetValue("IndicatorCombobox__");
                this.rule.AddIndicator(InternalScoring.Indicator.Build(defID, item.GetValue("Coefficient__"), JSON.parse(item.GetValue("ThresholdsJSON__"))
                    .map((json) => InternalScoring.Threshold.FromJSON(InternalScoring.ScoreDefinition.GetScoreDefinition(defID).valueType, json))));
            });
            InternalScoring.SerializeRuleOnProcess(this.rule);
        }
        OnFormUpdate() {
            if (this.isFormValid()) {
                this.SerializeRuleOnProcess();
                ProcessInstance.DisableExtractionScript();
                ProcessInstance.Approve("Update" /* InternalScoring.ProcessActionName.Update */);
            }
        }
        OnFormDelete() {
            this.SerializeRuleOnProcess();
            ProcessInstance.DisableExtractionScript();
            ProcessInstance.Approve("Delete" /* InternalScoring.ProcessActionName.Delete */);
        }
        isFormValid() {
            return !Process.ShowFirstError()
                && !Controls.Order__.GetError()
                && !Controls.AppliedRuleName__.GetError();
        }
    }
    CustomScript.VendorScoringViewEdition = VendorScoringViewEdition;
    async function BuildVendorScoringView() {
        const companyCode = Process.GetURLParameter("companyCode");
        const vendorNumber = Process.GetURLParameter("vendorNumber");
        if (vendorNumber) // Vendor Score view
         {
            const [vendor, scoringRules] = await Promise.all([
                InternalScoring.GetVendorRecord(vendorNumber, companyCode),
                await InternalScoring.ScoringRules.QueryRulesAndBuild()
            ]);
            const rule = scoringRules.GetAppliedRule(vendor);
            return new VendorScoringViewDetails(vendor, rule);
        }
        else if (Data.GetValue("RuidEx")) // Process Tab
         {
            const rule = InternalScoring.DeserializeRuleFromProcess("UpdatedRule");
            return new VendorScoringViewEdition(rule, true, false);
        }
        else // Edit / Create
         {
            const ruleRuidex = ProcessInstance.selectedRuidFromView ? ProcessInstance.selectedRuidFromView[0] : null;
            const rule = ruleRuidex
                ? (await InternalScoring.ScoringRules.QuerySortedRules(ruleRuidex))[0] // Edite
                : new InternalScoring.ScoringRule(); // Create
            InternalScoring.SerializeRuleOnProcess(rule, "PreviousRule");
            return new VendorScoringViewEdition(rule, false, !ruleRuidex);
        }
    }
    CustomScript.BuildVendorScoringView = BuildVendorScoringView;
    async function Run() {
        Process.ShowFirstErrorAfterBoot(false);
        Sys.Helpers.EnableSmartSilentChange();
        ProcessInstance.SetSilentChange(true);
        const layout = new Layout();
        layout.ShowWaitScreen();
        layout.Hide(true);
        try {
            await InternalScoring.LoadParameters();
            const view = await BuildVendorScoringView();
            view.InitPanes(layout);
            view.InitControls();
            await view.FillFormData();
        }
        catch (reason) {
            Log.Error("GlobalError : " + reason);
        }
        finally {
            layout.HideActionButtons(false);
            layout.HideWaitScreen();
            Process.ShowFirstError();
        }
    }
    CustomScript.Run = Run;
    Run();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map