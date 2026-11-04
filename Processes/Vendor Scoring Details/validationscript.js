"use strict";
var ValidationScript;
(function (ValidationScript) {
    var InternalScoring = Lib.VM.InternalScoring;
    async function OnProcessUpdate() {
        const newRule = InternalScoring.DeserializeRuleFromProcess("UpdatedRule");
        Log.Info(`Found serialized rule '${newRule.name}' (active=${newRule.active}, ${newRule.GetConditions().length} conditions)`);
        InternalScoring.UpdateRuleInDB(newRule);
        Process.RecallScript("Update_UpdateVendors" /* InternalScoring.ProcessActionName.Update_UpdateVendors */, true);
    }
    async function OnProcessUpdate_UpdateVendors() {
        await InternalScoring.LoadParameters();
        const newRule = InternalScoring.DeserializeRuleFromProcess("UpdatedRule");
        const exists = !!newRule.ruidex;
        const previousRule = exists ? InternalScoring.DeserializeRuleFromProcess("PreviousRule") : newRule;
        Log.Info(`Found serialized rule '${newRule.name}' (active=${newRule.active}, ${newRule.GetConditions().length} conditions)`);
        const newRules = await InternalScoring.ScoringRules.QuerySortedRules();
        const newScoringRules = new InternalScoring.ScoringRules(newRules);
        let filter;
        if (exists) {
            // update with previous rule for calculation filter to get old impacted suppliers
            const oldScoringRules = new InternalScoring.ScoringRules(newRules);
            oldScoringRules.AddOrUpdateRule(previousRule);
            const newVendorsFilter = newScoringRules.GetOptiVendorsFilter(newRule);
            const previousVendorsFilter = oldScoringRules.GetOptiVendorsFilter(previousRule);
            Log.Info("newVendorsFilter: ", newVendorsFilter);
            Log.Info("previousVendorsFilter: ", previousVendorsFilter);
            if (newVendorsFilter.toString() === previousVendorsFilter.toString()) {
                filter = newVendorsFilter;
            }
            else if (newVendorsFilter.toString() == "" || previousVendorsFilter.toString() == "") {
                Log.Info("Filter is empty, need to update all vendors");
            }
            else {
                filter = Sys.Helpers.LdapUtil.FilterOr(newVendorsFilter, previousVendorsFilter);
            }
        }
        else {
            filter = newScoringRules.GetOptiVendorsFilter(newRule);
        }
        await InternalScoring.UpdateVendors(filter, newScoringRules, "Update_UpdateVendors" /* InternalScoring.ProcessActionName.Update_UpdateVendors */);
    }
    async function OnProcessDelete() {
        const previousRule = InternalScoring.DeserializeRuleFromProcess("PreviousRule");
        Log.Info(`Found PreviousRule serialized '${previousRule.name}' (active=${previousRule.active}, ${previousRule.GetConditions().length} conditions)`);
        InternalScoring.DeleteRuleInDB(previousRule);
        Process.RecallScript("Delete_UpdateVendors" /* InternalScoring.ProcessActionName.Delete_UpdateVendors */, true);
    }
    async function OnProcessDelete_UpdateVendors() {
        await InternalScoring.LoadParameters();
        const previousRule = InternalScoring.DeserializeRuleFromProcess("PreviousRule");
        Log.Info(`Found PreviousRule serialized '${previousRule.name}' (active=${previousRule.active}, ${previousRule.GetConditions().length} conditions)`);
        const newRules = await InternalScoring.ScoringRules.QuerySortedRules();
        const newScoringRules = new InternalScoring.ScoringRules(newRules);
        const oldScoringRules = new InternalScoring.ScoringRules(newRules);
        // add previous rule for calculation filter to get old impacted suppliers
        oldScoringRules.AddOrUpdateRule(previousRule);
        const filter = oldScoringRules.GetOptiVendorsFilter(previousRule);
        await InternalScoring.UpdateVendors(filter, newScoringRules, "Delete_UpdateVendors" /* InternalScoring.ProcessActionName.Delete_UpdateVendors */);
    }
    async function Main() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info(`-- VSD Validation Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}' , Device: '${Data.GetActionDevice()}'`);
        if (currentAction === "approve") {
            switch (currentName) {
                case "Update" /* InternalScoring.ProcessActionName.Update */:
                    await OnProcessUpdate();
                    break;
                case "Update_UpdateVendors" /* InternalScoring.ProcessActionName.Update_UpdateVendors */:
                    await OnProcessUpdate_UpdateVendors();
                    break;
                case "Delete" /* InternalScoring.ProcessActionName.Delete */:
                    await OnProcessDelete();
                    break;
                case "Delete_UpdateVendors" /* InternalScoring.ProcessActionName.Delete_UpdateVendors */:
                    await OnProcessDelete_UpdateVendors();
                    break;
                default:
                    break;
            }
        }
        Sys.Helpers.TryCallFunction("Lib.VendorScoringDetails.Customization.Server.OnValidationScriptEnd");
    }
    ValidationScript.Main = Main;
})(ValidationScript || (ValidationScript = {}));
Lib.P2P.HandleScriptError(ValidationScript.Main());
//# sourceMappingURL=validationscript.js.map