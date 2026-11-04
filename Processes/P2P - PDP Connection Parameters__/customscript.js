"use strict";
const fieldsToShowPerConnectorType = {
    "SIREN__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "TokenURI__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "OAuthGrantType__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "OAuthUsername__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "OAuthPassword__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "ClientId__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "ClientSecret__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "OrganizationId__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "RoutingSettings__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1],
    "API_Key_Identifier__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.EOD],
    "API_Key__": [Sys.EDI.FRB2B.PDPConnector.ConnectorType.EOD]
};
const oauthGrantTypeEnum = Sys.OAuthGrantType;
const fieldsToTrim = ["OrganizationId__"];
const generalStep = {
    panels: [Controls.GeneralPane],
    icon: "fa-cog",
    title: "_General",
    description: "_Configure the PDP connection settings",
    helpId: 2623,
    onStart: function () {
        generalStep.initLayout();
        generalStep.handleErrorMessage();
    },
    onQuit: function () {
        return true;
    },
    updateWizard: function () {
        Sys.Wizard.Wizard.DrawSteps();
    },
    handleErrorMessage: function () {
        // Handle error message
    },
    initLayout: function () {
        Controls.ConnectorType__.OnChange = function () {
            cleanFieldsBasedOnConnectorType();
            setConnectorTypeDefaults(true); // Force defaults when user changes connector type
            showFieldsBasedOnConnectorType();
        };
        Controls.OAuthGrantType__.OnChange = function () {
            showOAuthGrantFieldsBasedOnGrantType();
        };
        showFieldsBasedOnConnectorType();
        setConnectorTypeDefaults(false); // Don't overwrite when opening existing config
        showOAuthGrantFieldsBasedOnGrantType();
    }
};
function InitializePDPConfiguration(callback) {
    callback();
}
const steps = [generalStep];
function OnSave() {
    for (const step of steps) {
        if (!step.onQuit()) {
            return false;
        }
    }
    trimFields(fieldsToTrim);
    // Wait for the asynchronous DatabaseComboBox checks (e.g. SIREN__) to complete before evaluating errors,
    // otherwise a value picked through Browse might still be reported as invalid and block the save.
    Process.WaitForCheck().then(function () {
        if (Process.ShowFirstError()) {
            return;
        }
        const configurationName = Controls.Name__.GetValue();
        if (configurationName) {
            const options = {
                table: Process.GetName(),
                filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Name__", configurationName), Sys.Helpers.LdapUtil.FilterNot(Sys.Helpers.LdapUtil.FilterEqual("MSNEX", Data.GetValue("MSNEX")))).toString(),
                attributes: ["Name__"],
                maxRecords: 1,
                additionalOptions: {
                    queryOptions: "FastSearch=1"
                }
            };
            Sys.GenericAPI.PromisedQuery(options).Then(function (results) {
                if (results.length > 0) {
                    Controls.Name__.SetError("_errorExistingConfigurationName");
                    Process.ShowFirstError();
                }
                else {
                    cleanFieldsBasedOnConnectorType();
                    ProcessInstance.SaveAndQuit("Save");
                }
            });
        }
    });
    return false;
}
function trimFields(fieldNames) {
    for (const fieldName of fieldNames) {
        const value = Controls[fieldName].GetValue();
        if (typeof value === "string") {
            Controls[fieldName].SetValue(value.trim());
        }
    }
}
function showFieldsBasedOnConnectorType() {
    const connectorType = Controls.ConnectorType__.GetValue();
    for (const field of Object.keys(fieldsToShowPerConnectorType)) {
        const connectorTypes = fieldsToShowPerConnectorType[field];
        const isVisible = connectorTypes.includes(connectorType);
        Controls[field].Hide(!isVisible);
    }
    // SIREN is mandatory by default but is not applicable to REST API connections, since no company is bound to that kind of connection.
    Controls.SIREN__.SetRequired(fieldsToShowPerConnectorType["SIREN__"].includes(connectorType));
    showOAuthGrantFieldsBasedOnGrantType();
}
function showOAuthGrantFieldsBasedOnGrantType() {
    const isSG5Connector = Controls.ConnectorType__.GetValue() === Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1;
    const usesPasswordGrant = isSG5Connector && Controls.OAuthGrantType__.GetValue() === oauthGrantTypeEnum.Password;
    Controls.OAuthUsername__.Hide(!usesPasswordGrant);
    Controls.OAuthPassword__.Hide(!usesPasswordGrant);
}
function cleanFieldsBasedOnConnectorType() {
    const connectorType = Controls.ConnectorType__.GetValue();
    for (const field of Object.keys(fieldsToShowPerConnectorType)) {
        if (!fieldsToShowPerConnectorType[field].includes(connectorType)) {
            Controls[field].SetValue(null);
        }
    }
}
function setConnectorTypeDefaults(forceDefaults) {
    const connectorType = Controls.ConnectorType__.GetValue();
    if (connectorType === Sys.EDI.FRB2B.PDPConnector.ConnectorType.SG5_V1) {
        // When changing connector type (forceDefaults=true), always set defaults
        // When opening existing config (forceDefaults=false), only set if empty to preserve custom URLs
        if (forceDefaults || !Controls.URI__.GetValue()) {
            Controls.URI__.SetValue(Sys.EDI.FRB2B.PDPConnector.PAApi.SG5_URI);
        }
        if (forceDefaults || !Controls.TokenURI__.GetValue()) {
            Controls.TokenURI__.SetValue(Sys.EDI.FRB2B.PDPConnector.PAApi.TOKEN_URI);
        }
        if (forceDefaults || !Controls.OAuthGrantType__.GetValue()) {
            Controls.OAuthGrantType__.SetValue(oauthGrantTypeEnum.ClientCredentials);
        }
    }
}
function Main() {
    var _a;
    Sys.Wizard.Wizard.Init({
        steps: steps,
        previousButton: Controls.Previous,
        nextButton: Controls.Next,
        wizardControl: Controls.Wizard_steps__,
        descriptionControl: Controls.Wizard_step_desc__,
        LoadFirstStep: function () {
            return Variable.GetValueAsString("currentStep");
        },
        SaveCurrentStep: function (currentStep) {
            ProcessInstance.SetSilentChange(true);
            Variable.SetValueAsString("currentStep", currentStep);
            ProcessInstance.SetSilentChange(false);
        },
        RefreshDefaultValues: function (runWizardCb) {
            if (!Variable.GetValueAsString("currentStep")) {
                InitializePDPConfiguration(runWizardCb);
            }
            else {
                runWizardCb();
            }
        }
    });
    // Other layout initializations
    (_a = Controls.Spacer__) === null || _a === void 0 ? void 0 : _a.Hide(true);
    Controls.Save.OnClick = OnSave;
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
}
/// ==================================
/// Entry point !!!
/// ==================================
Main();
//# sourceMappingURL=customscript.js.map