"use strict";
/**
 * Manage the General step
 */
let generalStep = {
    panels: [Controls.GeneralPane, Controls.LoginPane],
    icon: "fa-cog",
    title: "_General",
    description: "_ScoringAgencySettings",
    helpId: 2498,
    onStart: function () {
        generalStep.initLayout();
        generalStep.handleErrorMessage();
    },
    onQuit: function () {
        const provider = Data.GetValue("Provider__");
        if (CheckProviderUnicity(provider)) {
            // After the first step, do not allow to change configuration name
            Controls.Provider__.SetReadOnly(true);
            Data.SetValue("ConfigurationName__", provider);
            return true;
        }
        return false;
    },
    updateWizard: function () {
        Sys.Wizard.Wizard.DrawSteps();
    },
    handleErrorMessage: function () {
        const errorMessage = Variable.GetValueAsString("ErrorMessage");
        if (errorMessage) {
            Popup.Alert(Language.Translate(errorMessage));
            // to uncomment when several provider will be set
            // Controls.Provider__.SetReadOnly(false);
            Variable.SetValueAsString("ErrorMessage", "");
        }
        else if (Variable.GetValueAsString("currentStep")) {
            //Once the first step has been left with a correct configuration name, the configuration name cannot be changed
            //in order to avoid issues with extraction configurations
            Controls.Provider__.SetReadOnly(true);
        }
    },
    initLayout: function () {
        // add init code here
        if (Data.GetValue("ConfigurationName__")) {
            Controls.Provider__.SetReadOnly(true);
        }
        OnChangeProvider();
    }
};
let LayoutHelper = {
    DnbLayout: function () {
        Controls.OptionsPane.Hide(false);
        Controls.CompanyInformation__.Hide(false);
        Controls.ScoringAgencyHomePage__.Hide(false);
        Controls.RiskRating__.Hide(false);
        Controls.ESGRating__.Hide(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Hide(true);
        DunsHelper.IsUNSPSCEnabled().then((enabled) => Controls.ShouldInsertUNSPSCFromDNB__.Hide(!enabled));
        Controls.ComplianceScore__.Hide(true);
        Controls.ComplianceScore__.Check(false);
        Controls.ProviderEnv__.Hide(true);
        Controls.ContractId__.Hide(true);
        Controls.Token__.Hide(true);
        Controls.UserId__.Hide(false);
        Controls.ContractId__.SetLabel("_ContractId");
        Controls.UserId__.SetLabel("_UserId");
        Controls.Password__.SetLabel("_Password");
        Controls.TaxIdentificationNumberCheck__.Hide(true);
        Controls.TaxIdentificationNumberCheck__.Check(false);
        Controls.BankDetailsCheck__.Hide(true);
        Controls.BankDetailsCheck__.Check(false);
        Controls.GenerateTokenButton__.Hide(true);
        Controls.Spacer3__.Hide(true);
    },
    EALayout: function () {
        Controls.OptionsPane.Hide(true);
        Controls.CompanyInformation__.Hide(true);
        Controls.CompanyInformation__.Check(false);
        Controls.ScoringAgencyHomePage__.Hide(false);
        Controls.RiskRating__.Check(false);
        Controls.ESGRating__.Check(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Check(false);
        Controls.ComplianceScore__.Check(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Hide(true);
        Controls.Token__.Hide(true);
        Controls.ProviderEnv__.Hide(false);
        Controls.ContractId__.Hide(false);
        Controls.UserId__.Hide(false);
        Controls.ContractId__.SetLabel("_AccountId");
        Controls.UserId__.SetLabel("_ComplianceRiskProviderLogin");
        Controls.Password__.SetLabel("_Password");
        Controls.TaxIdentificationNumberCheck__.Hide(true);
        Controls.TaxIdentificationNumberCheck__.Check(false);
        Controls.BankDetailsCheck__.Hide(true);
        Controls.BankDetailsCheck__.Check(false);
        Controls.GenerateTokenButton__.Hide(true);
        Controls.Spacer3__.Hide(true);
    },
    FONLayout: function () {
        Controls.OptionsPane.Hide(false);
        Controls.ComplianceScore__.Hide(true);
        Controls.CompanyInformation__.Hide(true);
        Controls.ScoringAgencyHomePage__.SetValue("");
        Controls.ScoringAgencyHomePage__.Hide(true);
        Controls.RiskRating__.Hide(true);
        Controls.ESGRating__.Hide(true);
        Controls.RiskRating__.Check(false);
        Controls.ESGRating__.Check(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Hide(true);
        Controls.ShouldInsertUNSPSCFromDNB__.Check(false);
        Controls.ProviderEnv__.Hide(true);
        Controls.ContractId__.Hide(false);
        Controls.ContractId__.SetLabel("_PortalId");
        Controls.UserId__.Hide(false);
        Controls.UserId__.SetLabel("_UserId");
        Controls.Password__.SetLabel("_Password");
        Controls.Token__.Hide(false);
        Controls.TaxIdentificationNumberCheck__.Hide(false);
        Controls.BankDetailsCheck__.Hide(false);
        Controls.GenerateTokenButton__.Hide(false);
        Controls.Spacer3__.Hide(false);
        Controls.GenerateTokenButton__.OnClick = FONTokenHelper.GenerateTokenOnClick;
    },
    IndueDLayout: function () {
        Controls.OptionsPane.Hide(false);
        Controls.ComplianceScore__.Hide(false);
        Controls.CompanyInformation__.Hide(true);
        Controls.ScoringAgencyHomePage__.Hide(false);
        Controls.RiskRating__.Hide(true);
        Controls.ESGRating__.Hide(true);
        Controls.CompanyInformation__.Check(false);
        Controls.RiskRating__.Check(false);
        Controls.ESGRating__.Check(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Check(false);
        Controls.ProviderEnv__.Hide(true);
        Controls.ContractId__.Hide(true);
        Controls.UserId__.Hide(true);
        Controls.Password__.Hide(true);
        Controls.Token__.Hide(false);
        Controls.TaxIdentificationNumberCheck__.Hide(true);
        Controls.TaxIdentificationNumberCheck__.Check(false);
        Controls.BankDetailsCheck__.Hide(true);
        Controls.BankDetailsCheck__.Check(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Hide(true);
        Controls.GenerateTokenButton__.Hide(true);
        Controls.Spacer3__.Hide(true);
    },
    EcovadisLayout: () => {
        Controls.OptionsPane.Hide(false);
        Controls.ComplianceScore__.Hide(true);
        Controls.CompanyInformation__.Hide(true);
        Controls.ScoringAgencyHomePage__.Hide(false);
        Controls.RiskRating__.Hide(true);
        Controls.ESGRating__.Hide(false);
        Controls.ESGRating__.SetLabel("_SustainabilityScore");
        Controls.ESGRating__.SetHelpData("_SustainabilityScoreTooltip", "2570");
        Controls.CompanyInformation__.Check(false);
        Controls.RiskRating__.Check(false);
        Controls.ComplianceScore__.Check(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Check(false);
        Controls.ProviderEnv__.Hide(true);
        Controls.ContractId__.Hide(true);
        Controls.UserId__.Hide(false);
        Controls.Password__.Hide(false);
        Controls.Token__.Hide(true);
        Controls.TaxIdentificationNumberCheck__.Hide(true);
        Controls.TaxIdentificationNumberCheck__.Check(false);
        Controls.BankDetailsCheck__.Hide(true);
        Controls.BankDetailsCheck__.Check(false);
        Controls.ShouldInsertUNSPSCFromDNB__.Hide(true);
        Controls.GenerateTokenButton__.Hide(false);
        Controls.Spacer3__.Hide(true);
        Controls.GenerateTokenButton__.OnClick = EcovadisTokenHelper.GenerateTokenOnClick;
        Controls.GenerateTokenButton__.SetButtonLabel("_Ecovadis_GenerateToken_ValidateConnection");
    }
};
let FONTokenHelper = {
    GenerateTokenOnClick: function () {
        if (!Data.IsNullOrEmpty("UserId__") && !Data.IsNullOrEmpty("Password__") && !Data.IsNullOrEmpty("ContractId__")) {
            const fillDialog = function (dialog) {
                dialog.AddDescription("Description", null, 400).SetText(Language.Translate("_GenerateTokenConfirmation"));
                const commitButton = dialog.GetControl("ButtonOk");
                commitButton.SetLabel(Language.Translate("_ButtonGenerateToken"));
            };
            Popup.Dialog("_GenerateTokenConfirmationTitle", null, fillDialog, FONTokenHelper.GetToken);
        }
        else {
            if (Data.IsNullOrEmpty("UserId__")) {
                Controls.UserId__.SetError("_FieldRequiredGenerateToken");
            }
            if (Data.IsNullOrEmpty("Password__")) {
                Controls.Password__.SetError("_FieldRequiredGenerateToken");
            }
            if (Data.IsNullOrEmpty("ContractId__")) {
                Controls.ContractId__.SetError("_FieldRequiredGenerateToken");
            }
        }
    },
    GetToken: function () {
        Controls.GenerateTokenButton__.Wait(true);
        let credentials = {
            user: Controls.UserId__.GetValue(),
            pwd: Controls.Password__.GetValue(),
            portalId: Controls.ContractId__.GetValue()
        };
        if (credentials.pwd && !credentials.pwd.startsWith("##Encrypted##")) {
            credentials.pwd = encodeURIComponent(credentials.pwd);
        }
        const FONclient = new Sys.VM.FONClient(credentials);
        FONclient.GetSessionKey(FONTokenHelper.GetTokenCallback);
    },
    GetTokenCallback: function (isAuthenticated, data) {
        Controls.GenerateTokenButton__.Wait(false);
        if (isAuthenticated) {
            Controls.Token__.SetValue(data);
            const popupMsg = Language.Translate("_GenerateTokenSuccess {0}", false, data);
            Popup.Alert(popupMsg, false, null, "_GenerateTokenSuccessTitle");
        }
        else {
            Log.Error(data);
            Popup.Alert("_GenerateTokenError", false, null, "_GenerateTokenErrorTitle");
        }
    }
};
const EcovadisTokenHelper = {
    /**
     * Call the GetSessionKey from the EcovadisClient to validate the provided credentials
     */
    GenerateTokenOnClick: async function () {
        Controls.UserId__.SetError("");
        Controls.Password__.SetError("");
        if (!Data.IsNullOrEmpty("UserId__") && !Data.IsNullOrEmpty("Password__")) {
            let message = Language.Translate("_ValidateConnectionError ({0})", true, "_EcovadisTokenMissing");
            let hasConnectionFailed = true;
            const ecovadisClient = new Sys.EcovadisClient({ user: Controls.UserId__.GetValue(), pwd: Controls.Password__.GetValue() });
            try {
                const credentials = await ecovadisClient.UpdateToken();
                if (credentials.token) {
                    message = Language.Translate("_ValidateConnectionSuccess");
                    hasConnectionFailed = false;
                }
            }
            catch (error) {
                message = Language.Translate("_ValidateConnectionError ({0})", true, error);
            }
            finally {
                Popup.Alert(message, hasConnectionFailed, null, "_ValidateEcovadisConnectionTitle");
            }
        }
        else {
            Controls.UserId__.SetError(Data.IsNullOrEmpty("UserId__") ? "_FieldRequiredValidateConnection" : "");
            Controls.Password__.SetError(Data.IsNullOrEmpty("Password__") ? "_FieldRequiredValidateConnection" : "");
        }
    }
};
const DunsHelper = {
    IsUNSPSCEnabled: async function () {
        let filter = Sys.Helpers.LdapUtil.FilterEqual("EnableVendorUNSPSCBrowse__", "1");
        const result = await Sys.GenericAPI.PromisedQuery({
            table: "AP - Application Settings__",
            attributes: ["EnableVendorUNSPSCBrowse__"],
            filter: filter.toString(),
            maxRecords: 1
        });
        return result.length > 0;
    }
};
function CheckProviderUnicity(provider) {
    let existingProviders = [];
    if (Variable.GetValueAsString("ExistingProviders") && JSON.parse(Variable.GetValueAsString("ExistingProviders"))) {
        existingProviders = JSON.parse(Variable.GetValueAsString("ExistingProviders"));
    }
    if (!provider) {
        Controls.Provider__.SetError(Language.Translate("_ExpectingAProvider"));
        return false;
    }
    if (Sys.Helpers.Array.IndexOf(existingProviders, provider) !== -1) {
        Controls.Provider__.SetError(Language.Translate("_ExistingProvider"));
        return false;
    }
    return true;
}
function InitializeProviders(callback) {
    function StoreProviders() {
        const err = this.GetQueryError();
        if (err) {
            Popup.Alert(err);
            return;
        }
        const existingProviders = [];
        for (let i = 0; i < this.GetRecordsCount(); i++) {
            existingProviders.push(this.GetQueryValue("Provider__", i));
        }
        Variable.SetValueAsString("ExistingProviders", JSON.stringify(existingProviders));
        callback();
    }
    // Only query if it's a new configuration => configuration name is empty
    if (!Data.GetValue("ConfigurationName__")) {
        // Query all configuration names
        Query.DBQuery(StoreProviders, "VM - Scoring Agency Settings__", "Provider__", null, null, 10);
    }
    else {
        callback();
    }
}
const steps = [generalStep];
function OnSave() {
    for (const step of steps) {
        if (!step.onQuit()) {
            return false;
        }
    }
    // To succeed to call fon, we need to save the password encoded
    const password = Controls.Password__.GetValue();
    if (Data.GetValue("Provider__") === "fon" && password && !password.startsWith("##Encrypted##")) {
        Controls.Password__.SetValue(encodeURIComponent(password));
    }
    return true;
}
function SetBasicLabels() {
    Controls.ESGRating__.SetLabel("_ESGRating");
    Controls.ESGRating__.SetHelpData("_ESGRatingToolTip", "2566");
}
function OnChangeProvider() {
    Controls.UserId__.SetError("");
    Controls.Password__.SetError("");
    SetBasicLabels();
    const provider = Data.GetValue("Provider__");
    switch (provider) {
        case Lib.VM.ScoringProviders.Common.ProviderName.eattestations:
            LayoutHelper.EALayout();
            break;
        case "fon":
            LayoutHelper.FONLayout();
            break;
        case Lib.VM.ScoringProviders.Common.ProviderName.indueD:
            LayoutHelper.IndueDLayout();
            break;
        case Lib.VM.ScoringProviders.Common.ProviderName.ecovadis:
            LayoutHelper.EcovadisLayout();
            break;
        default:
            LayoutHelper.DnbLayout();
            break;
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Wizard.AgencySettings.OnChangeProvider", provider);
    CheckProviderUnicity(provider);
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
                InitializeProviders(runWizardCb);
            }
            else {
                runWizardCb();
            }
        }
    });
    // Other layout initializations
    (_a = Controls.Spacer__) === null || _a === void 0 ? void 0 : _a.Hide(true);
    Controls.Save.OnClick = OnSave;
    Controls.Provider__.OnChange = OnChangeProvider;
}
/// ==================================
/// Entry point !!!
/// ==================================
Main();
//# sourceMappingURL=customscript.js.map