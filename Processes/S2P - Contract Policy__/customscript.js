"use strict";
var CustomScript;
(function (CustomScript) {
    CustomScript.clauseCache = new Map();
    let ComplianceResult;
    (function (ComplianceResult) {
        ComplianceResult["Empty"] = "empty";
        ComplianceResult["NonCompliant"] = "nonCompliant";
        ComplianceResult["Compliant"] = "compliant";
    })(ComplianceResult = CustomScript.ComplianceResult || (CustomScript.ComplianceResult = {}));
    ;
    async function GetComplianceAnalysis() {
        const policyPrompt = Controls.PolicyPrompt__.GetValue();
        const textToAnalyze = Controls.TestClause__.GetValue();
        let clause;
        const clauseKey = policyPrompt + textToAnalyze;
        if (CustomScript.clauseCache.has(clauseKey)) {
            clause = CustomScript.clauseCache.get(clauseKey);
        }
        else {
            clause = await Sys.P2P.GPT.Query("Contract-Compliancy", { ocrText: textToAnalyze, policy: Controls.PolicyPrompt__.GetValue() });
            const translatedResponse = await Lib.Contract.Policies.FraudulentClauses.TranslateAnalysis(User.language, [clause]);
            if (Sys.Helpers.IsArray(translatedResponse) && translatedResponse[0]) {
                clause.commentary = translatedResponse[0].commentary;
            }
            CustomScript.clauseCache.set(clauseKey, clause);
        }
        return clause;
    }
    CustomScript.GetComplianceAnalysis = GetComplianceAnalysis;
    function InitConditionsBrowse() {
        Controls.ApplicationConditionDisplay__.AddStyle("monospace");
        Controls.ApplicationConditionDisplay__.SetReadOnly(true);
        Lib.Contract.Policy.Dialog.Init();
        if (ProcessInstance.isReadOnly) {
            Controls.Review.Hide(true);
            return;
        }
        Controls.ApplicationConditionDisplay__.SetBrowsable(true);
        Controls.ApplicationConditionDisplay__.OnBrowse = async () => {
            const newConditions = await Lib.Contract.Policy.Dialog.OpenBrowse();
            if (newConditions) {
                const formattedConditions = Lib.P2P.RuleCondition.RuleConditionDialogEdition.ToFormattedString(newConditions);
                // Update view
                Controls.ApplicationConditionDisplay__.SetValue(formattedConditions);
                Controls.ApplicationCondition__.SetValue(JSON.stringify(newConditions));
                //Empty company code for backward compatibility
                Controls.CompanyCode__.SetValue("");
            }
        };
    }
    CustomScript.InitConditionsBrowse = InitConditionsBrowse;
    async function TestRequirement() {
        try {
            Controls.TestRequirementButton__.Wait(true);
            const analysis = await CustomScript.GetComplianceAnalysis();
            const complianceResult = analysis.compliant ? ComplianceResult.Compliant : ComplianceResult.NonCompliant;
            Controls.AIResult__.SetValue(complianceResult);
            Controls.TestAnalysis__.SetValue(analysis.commentary);
            Controls.TestSentence__.SetValue(analysis.sentence);
            Controls.AIResult__.Hide(false);
            Controls.TestAnalysis__.Hide(false);
            Controls.TestSentence__.Hide(false);
        }
        catch (error) {
            Log.Error(`Error while testing requirement: ${error}`);
            Controls.AIResult__.SetValue(ComplianceResult.Empty);
            Controls.TestAnalysis__.SetValue("");
            Controls.TestSentence__.SetValue("");
            Popup.Alert("_GPT_Contract-Requirement_Test_Error_message", true, null, "_GPT_Contract-Requirement_Test_Error_title");
        }
        finally {
            CustomScript.SetAIResultStyle();
            Controls.TestRequirementButton__.Wait(false);
        }
    }
    CustomScript.TestRequirement = TestRequirement;
    function SetAIResultStyle() {
        const aiResult = Controls.AIResult__.GetValue();
        switch (aiResult) {
            case ComplianceResult.Compliant:
                Controls.AIResult__.AddStyle("highlight-success");
                Controls.AIResult__.RemoveStyle("highlight-danger");
                break;
            case ComplianceResult.NonCompliant:
                Controls.AIResult__.AddStyle("highlight-danger");
                Controls.AIResult__.RemoveStyle("highlight-success");
                break;
            default:
                Controls.AIResult__.RemoveStyle("highlight-success");
                Controls.AIResult__.RemoveStyle("highlight-danger");
                break;
        }
    }
    CustomScript.SetAIResultStyle = SetAIResultStyle;
    function UpdateTestButtonState({ PolicyPrompt__, TestClause__ }) {
        const isPolicyPromptEmpty = Sys.Helpers.IsEmpty(PolicyPrompt__ !== null && PolicyPrompt__ !== void 0 ? PolicyPrompt__ : Controls.PolicyPrompt__.GetValue());
        const isTestClauseEmpty = Sys.Helpers.IsEmpty(TestClause__ !== null && TestClause__ !== void 0 ? TestClause__ : Controls.TestClause__.GetValue());
        Controls.TestRequirementButton__.SetDisabled(isTestClauseEmpty || isPolicyPromptEmpty);
    }
    CustomScript.UpdateTestButtonState = UpdateTestButtonState;
    function InitAiRewiew() {
        if (ProcessInstance.isReadOnly) {
            Controls.Review.Hide(true);
            return;
        }
        Controls.AIResult__.Hide(true);
        Controls.TestAnalysis__.Hide(true);
        Controls.TestSentence__.Hide(true);
        Controls.TestClause__.OnTextChange = (text) => CustomScript.UpdateTestButtonState({ TestClause__: text });
        Controls.PolicyPrompt__.OnTextChange = (text) => CustomScript.UpdateTestButtonState({ PolicyPrompt__: text });
        Controls.TestRequirementButton__.SetDisabled(true);
        Controls.TestRequirementButton__.OnClick = CustomScript.TestRequirement;
    }
    CustomScript.InitAiRewiew = InitAiRewiew;
    function InitDelete() {
        // Leave if we're in read-only mode or if this is a new record
        if (ProcessInstance.isReadOnly || !ProcessInstance.id) {
            return;
        }
        Controls.Delete.Hide(false);
        Controls.Delete.SetDisabled(false);
        Controls.Delete.OnClick = () => {
            Popup.Confirm("_This action will delete the current record message", false, () => {
                Controls.Delete.Wait(true);
                const recordManager = new Lib.P2P.ContractPolicy.RecordManager.Client();
                const policy = new Lib.P2P.ContractPolicy.ContractPolicy();
                policy.ruidex = ProcessInstance.id;
                recordManager.Delete(policy)
                    .finally(() => {
                    Controls.Delete.Wait(false);
                    ProcessInstance.Quit("quit", true);
                });
            }, null, "_This action will delete the current record title");
        };
    }
    CustomScript.InitDelete = InitDelete;
    function InitBanner() {
        Sys.Helpers.Banner.SetHTMLBanner(Controls.HTMLBanner__);
        Sys.Helpers.Banner.SetMainTitle("_S2P - Contract Policy");
        Sys.Helpers.Banner.Apply();
    }
    CustomScript.InitBanner = InitBanner;
    function InitForm() {
        Process.SetHelpId(5159);
        CustomScript.InitBanner();
        CustomScript.InitConditionsBrowse();
        CustomScript.InitAiRewiew();
        CustomScript.InitDelete();
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    CustomScript.InitForm = InitForm;
    CustomScript.InitForm();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map