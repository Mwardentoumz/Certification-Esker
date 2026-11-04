"use strict";
var Extraction;
(function (Extraction) {
    function replaceUserProperties(obj, user) {
        for (const property in obj) {
            if (typeof obj[property] == "string") {
                if (obj[property] === "<USERNAME>") {
                    obj[property] = user.GetValue("DisplayName");
                }
                else if (obj[property] === "<USERLOGIN>") {
                    obj[property] = user.GetValue("login");
                }
                else if (obj[property] === "<USERDN>") {
                    obj[property] = user.GetValue("FullDn");
                }
            }
        }
    }
    Extraction.replaceUserProperties = replaceUserProperties;
    function SetDefaultValidityDateTime() {
        const validityDT = Data.GetValue("SubmitDateTime");
        if (validityDT) {
            validityDT.setMonth(validityDT.getMonth() + 12);
            Data.SetValue("ValidityDateTime", validityDT);
        }
    }
    function Main() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        //Check FT for questionnaire
        Variable.SetValueAsString("IsQuestionnaireActivated", (FeatureToggle.Read("AllowDesigningQuestionnaires") ? "1" : "0"));
        Log.Info("-- VR Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice() + "'");
        //#region import from JSON demo data
        if (Variable.GetValueAsString("ApplicationEnable") === "1") {
            Log.Info("Try to import from json demodata");
            Process.DisableChecks();
            let attachContent = Attach.GetContent(0);
            Log.Info("Import JSON information: " + attachContent);
            let importData = JSON.parse(attachContent);
            importData.actions.forEach(action => {
                var _a, _b;
                if (action.userInfo) {
                    const newLogin = Sys.OnDemand.Users.GetDemoUserDN(action.userInfo.Login);
                    const user = Users.GetUser(newLogin);
                    replaceUserProperties(action === null || action === void 0 ? void 0 : action.variables, user);
                    replaceUserProperties((_a = action === null || action === void 0 ? void 0 : action.flexible) === null || _a === void 0 ? void 0 : _a.fields, user);
                    for (const table in (_b = action === null || action === void 0 ? void 0 : action.flexible) === null || _b === void 0 ? void 0 : _b.tables) {
                        if (Sys.Helpers.IsArray(table)) {
                            table.forEach(item => {
                                replaceUserProperties(item, user);
                            });
                        }
                    }
                }
            });
            Variable.SetValueAsString("ApplicationEnableActions", JSON.stringify(importData.actions));
        }
        //#endregion
        SetDefaultValidityDateTime();
        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnExtractionEnd");
    }
    Extraction.Main = Main;
})(Extraction || (Extraction = {}));
Extraction.Main();
//# sourceMappingURL=extractionscript.js.map