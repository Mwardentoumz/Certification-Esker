"use strict";
var StepName;
(function (StepName) {
    StepName["Lookup"] = "Lookup";
    StepName["CompanyProfile"] = "CompanyProfile";
    StepName["Diversity"] = "Diversity";
    StepName["Contacts"] = "Contacts";
    StepName["Payment"] = "Payment";
    StepName["Documents"] = "Documents";
    StepName["Questionnaire"] = "Questionnaire";
})(StepName || (StepName = {}));
var QuestionnaireType;
(function (QuestionnaireType) {
    QuestionnaireType["companyQuestionnaire"] = "companyQuestionnaire";
})(QuestionnaireType || (QuestionnaireType = {}));
const steps = {
    lookup: {
        panels: [Controls.DemoDataPane, Controls.CompanyLookup],
        button: Controls.Lookup_Step__,
        spacer: Controls.spacer22__,
        hiddenStep: true,
        requiredFields: [],
        withErrors: null,
        onShow: function () {
            Wizard.GetRequiredFields(this);
            Controls.DemoDataPane.Hide(!DnBObject.options.showDemoBanner);
        },
        onQuit: async function () {
            Wizard.GetRequiredFields(this);
            this.withErrors = !Wizard.CheckRequiredFields(this);
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    },
    company: {
        panels: [Controls.CompanyProfilePane],
        button: Controls.Company_Step__,
        spacer: Controls.spacer__,
        requiredFields: [],
        withErrors: null,
        onShow: function () {
            Wizard.GetRequiredFields(this);
            if (!this.withErrors) {
                Wizard.ResetRequiredFields(this);
            }
            TaxRegistrationNumber.Validate();
        },
        onQuit: async function (goesBack) {
            if (goesBack) {
                // don't check fields when going back to 'lookup'
                return true;
            }
            Wizard.GetRequiredFields(this); // TaxID__'s required property is now dynamically set when Country__ changes, so we need to refresh the list here
            this.withErrors = !Wizard.CheckRequiredFields(this) || !await TaxRegistrationNumber.Validate();
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    },
    unspsc: {
        panels: [Controls.UNSPSCPane],
        button: Controls.UNSPSC_Step__,
        spacer: Controls.spacer40__,
        requiredFields: [],
        withErrors: null,
        onShow: function () {
            Wizard.GetRequiredFields(this);
            if (!this.withErrors) {
                Wizard.ResetRequiredFields(this);
            }
        },
        onQuit: async function (goesBack) {
            if (goesBack) {
                // don't check fields when going back to 'lookup'
                return true;
            }
            Wizard.GetRequiredFields(this); // TaxID__'s required property is now dynamically set when Country__ changes, so we need to refresh the list here
            this.withErrors = !Wizard.CheckRequiredFields(this);
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    },
    diversity: {
        panels: [Controls.DiversityPane],
        button: Controls.Diversity__,
        spacer: Controls.spacer5__,
        hiddenStep: true,
        requiredFields: [],
        requiredFieldsInTable: [],
        withErrors: null,
        onShow: function () {
            DiversityClassificationManagement.InitFields();
        },
        onQuit: async function () {
            Wizard.GetRequiredFields(this); // Diversity__'s required properties is now dynamically set when Country__ changes, so we need to refresh the list here
            this.withErrors = !Wizard.CheckRequiredFields(this);
            // If a diversity classification is selected, at least one certificate document must be provided.
            if (Controls.DiversityClassification__.GetValue() && Data.GetValue("RegistrationType__") !== registrationType.update) {
                this.withErrors = this.withErrors || Lib.VendorRegistration.DocumentsTable.CheckMandatoryDocumentTypes();
            }
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    },
    officers: {
        panels: [Controls.CompanyOfficers],
        button: Controls.Company_Officers__,
        spacer: Controls.spacer2__,
        requiredFieldsInTable: [],
        withErrors: null,
        onShow: function () {
            setOfficerRoles();
            for (let k = 1; k <= Controls.CompanyOfficersTable__.GetColumnCount(); k++) {
                const column = Controls.CompanyOfficersTable__.GetColumnControl(k);
                if (column.IsRequired()) {
                    this.requiredFieldsInTable.push(column.GetName());
                }
            }
        },
        onQuit: async function () {
            this.withErrors = false;
            if (Controls.CompanyOfficersTable__.GetItemCount() < 1) {
                Controls.CompanyOfficersTable__.AddItem(false);
            }
            for (let i = 0; i < Controls.CompanyOfficersTable__.GetItemCount(); i++) {
                const row = Controls.CompanyOfficersTable__.GetRow(i);
                for (const requiredFld of this.requiredFieldsInTable) {
                    if (!row[requiredFld].GetValue()) {
                        row[requiredFld].SetError("This field is required!");
                        this.withErrors = true;
                    }
                }
                if (!this.withErrors && row.Email__.GetError()) {
                    this.withErrors = true;
                }
            }
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    },
    payment: {
        panels: [Controls.PaymentPane, Controls.Banks],
        button: Controls.Banks__,
        spacer: Controls.spacer4__,
        withErrors: null,
        onInit: function () {
            Wizard.GetRequiredFields(this);
            Wizard.ResetRequiredFields(this);
        },
        onShow: function () {
            if (!ProcessInstance.isReadOnly) {
                BankAccountsManagement.SetBankDetailLineCountryIfEmpty();
            }
            PaymentManagement.ValidatePaymentTerms();
            PaymentManagement.ValidatePaymentMethod();
            Wizard.GetRequiredFields(this); // Payment fields' required property is set dynamically, so we need to refresh the list here
            this.withErrors = !Wizard.CheckRequiredFields(this) || BankAccountsManagement.SetAllReadOnlyAndRequiredFields();
            if (!this.withErrors) {
                Wizard.ResetRequiredFields(this);
            }
        },
        onQuit: async function () {
            Wizard.GetRequiredFields(this); // Payment fields' required property is set dynamically, so we need to refresh the list here
            this.withErrors = !Wizard.CheckRequiredFields(this) || BankAccountsManagement.SetAllReadOnlyAndRequiredFields();
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    },
    documents: {
        panels: [Controls.DocumentsPane],
        button: Controls.Documents_Step__,
        spacer: Controls.spacer4__,
        withErrors: null,
        onInit: function () {
            Wizard.GetRequiredFields(this);
            Wizard.ResetRequiredFields(this);
        },
        onShow: function () {
            UpdateDiversityDocumentControlsDependingOnDiversityClassification();
            if (!this.withErrors) {
                Wizard.ResetRequiredFields(this);
            }
            QueryQuestionnaireAndShowIfNotEmpty();
        },
        onQuit: async function () {
            this.withErrors = !Wizard.CheckRequiredFields(this);
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    },
    questionnaire: {
        name: StepName.Questionnaire,
        panels: [Controls.GlobalQuestionnairePane],
        button: Controls.Questionnaire_Step__,
        spacer: Controls.spacer6__,
        hiddenStep: true,
        requiredFields: [Controls.GlobalQuestionnaire__],
        requiredFieldsInTable: [],
        withErrors: null,
        onShow: function () {
            UnserializeQuestionnaire(Controls.GlobalQuestionnaire__, true);
        },
        onQuit: async function () {
            this.withErrors = !Wizard.CheckRequiredFields(this);
            if (this.withErrors) {
                Process.ShowFirstError();
            }
            return !this.withErrors;
        }
    }
};
//#region globals
const registrationType = {
    update: "update",
    registration: "registration"
};
const DnBObject = {
    isDnBConfigured: false,
    credentials: {
        user: "",
        pwd: ""
    },
    options: {
        showDemoBanner: false,
        isVendorLookupEnabled: false,
        shouldInsertUNSPSCFromDNB: false,
        isRiskRatingEnabled: false,
        isESGRatingEnabled: false
    }
};
const Parameters = Lib.VendorRegistration.Common.Parameters;
const g_commentPlaceHolder = Language.Translate("_Enter your comment...");
let g_currentLookupCountry = Controls.LookupCountry__.GetValue();
let g_CurrentCountry = "";
let g_CurrentCountryForBank = "";
const warningMessageTradKey = "_One or more vendors with the same informations are already registered";
const highlightStyles = {
    error: "highlight-danger",
    warning: "highlight-warning",
    success: "highlight-success"
};
let ValuesFromMasterData;
let ValuesFromCompanyLookup;
const hasBeenOpenedInNewTab = Process.GetURLParameter("onquit") === "close";
//#endregion
//#region helpers objects
const BankAccountsManagement = {
    _countriesUsingEuro: [
        "AT", // Austria
        "BE", // Belgium
        "CY", // Cyprus
        "EE", // Estonia
        "FI", // Finland
        "FR", // France
        "DE", // Germany
        "GR", // Greece
        "IE", // Ireland
        "IT", // Italy
        "LV", // Latvia
        "LT", // Lithuania
        "LU", // Luxembourg
        "MT", // Malta
        "NL", // The Netherlands
        "PT", // Portugal
        "SK", // Slovakia
        "SI", // Slovenia
        "ES", // Spain
        "GF", // France - French Guyana
        "GP", // France - Guadeloupe
        "MQ", // France - Martinique
        "RE", // France - Reunion
        "TF", // France - French Southern Territories
        "YT", // France - Mayotte
        "BL", // France - Saint Barthelemy
        "MF", // France - Saint Martin (French part)
        "PM", // France - Saint Pierre et Miquelon
        "AX", // Finland - Aland Islands
        "IC", // Spain - Canary Islands
        "EA", // Spain - Ceuta and Melilla
        "MC", // Monaco
        "AD", // Andorre
        "SM", // San Marino
        "VA" // Vatican
    ],
    Init: function () {
        if (!ProcessInstance.isReadOnly) {
            BankAccountsManagement.SetBankDetailLineCountryIfEmpty();
        }
    },
    EmptyFields: function (item) {
        item.SetValue("BankIBAN__", "");
        item.SetValue("BankIBANScore__", null);
        item.SetValue("BankKey__", "");
        item.SetValue("BankAccountNumber__", "");
        item.SetValue("ControlKey__", "");
        item.SetValue("SWIFT_BICCode__", "");
        item.SetValue("RoutingCode__", "");
    },
    IsCountryUsingEuro: function (countryCode) {
        return BankAccountsManagement._countriesUsingEuro.indexOf(countryCode) >= 0;
    },
    IsItemEmpty: function (item) {
        return item.IsNullOrEmpty("BankAccountHolder__") &&
            item.IsNullOrEmpty("BankIBAN__") &&
            item.IsNullOrEmpty("BankKey__") &&
            item.IsNullOrEmpty("BankAccountNumber__") &&
            item.IsNullOrEmpty("ControlKey__") &&
            item.IsNullOrEmpty("SWIFT_BICCode__") &&
            item.IsNullOrEmpty("RoutingCode__");
    },
    SetCurrency: function (item, country) {
        if (item) {
            if (country === "US") {
                item.SetValue("Currency__", "USD");
            }
            else if (BankAccountsManagement.IsCountryUsingEuro(country)) {
                item.SetValue("Currency__", "EUR");
            }
            else {
                item.SetValue("Currency__", "");
            }
        }
    },
    SetErrorIfEmpty: function (item, field) {
        if (item.IsNullOrEmpty(field)) {
            item.SetError(field, "This field is required!");
            return 1;
        }
        item.SetError(field, "");
        return 0;
    },
    SetRequiredFields: function (item) {
        let nbErrors = 0;
        if (item) {
            if (BankAccountsManagement.IsItemEmpty(item)) {
                item.SetError("BankCountry__", "");
                item.SetError("BankAccountHolder__", "");
                item.SetError("SWIFT_BICCode__", "");
                item.SetError("BankKey__", "");
                item.SetError("BankAccountNumber__", "");
                item.SetError("BankIBAN__", "");
                item.SetError("ControlKey__", "");
                item.SetError("Currency__", "");
                item.SetError("RoutingCode__", "");
            }
            else {
                nbErrors += BankAccountsManagement.SetErrorIfEmpty(item, "BankCountry__");
                nbErrors += BankAccountsManagement.SetErrorIfEmpty(item, "BankAccountHolder__");
                nbErrors += BankAccountsManagement.SetErrorIfEmpty(item, "Currency__");
                const bankCountry = item.GetValue("BankCountry__");
                if (Sys.Helpers.Iban.IsIbanCountry(bankCountry)) {
                    item.SetError("BankKey__", "");
                    item.SetError("BankAccountNumber__", "");
                    item.SetError("RoutingCode__", "");
                    // FT-022346: SWIFT_BICCode__ is not mandatory for Non-IBAN, remain mandatory for IBAN
                    nbErrors += BankAccountsManagement.SetErrorIfEmpty(item, "SWIFT_BICCode__");
                    nbErrors += IBAN.Validate(item);
                }
                else if (bankCountry === "US") {
                    item.SetError("BankIBAN__", "");
                    nbErrors += BankAccountsManagement.SetErrorIfEmpty(item, "RoutingCode__");
                    nbErrors += BankAccountsManagement.SetErrorIfEmpty(item, "BankAccountNumber__");
                }
                else {
                    item.SetError("BankIBAN__", "");
                    item.SetError("RoutingCode__", "");
                    nbErrors += BankAccountsManagement.SetErrorIfEmpty(item, "BankAccountNumber__");
                }
                const newNbErrors = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.SetRequiredBankFields", item, nbErrors);
                if (typeof newNbErrors === "number") {
                    nbErrors = newNbErrors;
                }
            }
        }
        return nbErrors;
    },
    SetReadOnlyFields: function (row) {
        if (row) {
            const bankCountry = row.BankCountry__.GetValue();
            if (Sys.Helpers.Iban.IsIbanCountry(bankCountry)) {
                row.BankKey__.SetReadOnly(true);
                row.BankAccountNumber__.SetReadOnly(true);
                row.ControlKey__.SetReadOnly(true);
                row.RoutingCode__.SetReadOnly(true);
                row.BankIBAN__.SetReadOnly(false);
            }
            else {
                row.BankKey__.SetReadOnly(false);
                row.BankAccountNumber__.SetReadOnly(false);
                row.ControlKey__.SetReadOnly(false);
                row.RoutingCode__.SetReadOnly(false);
                row.BankIBAN__.SetReadOnly(true);
            }
        }
    },
    SetAllReadOnlyAndRequiredFields: function () {
        let nbErrors = 0;
        const bankDetailsTable = Data.GetTable("CompanyBankAccountsTable__");
        for (let i = 0; i < bankDetailsTable.GetItemCount(); i++) {
            nbErrors += BankAccountsManagement.SetRequiredFields(bankDetailsTable.GetItem(i));
            BankAccountsManagement.SetReadOnlyFields(Controls.CompanyBankAccountsTable__.GetRow(i));
        }
        return nbErrors > 0;
    },
    SetReadOnlyAndRequiredFields: function (item, row) {
        BankAccountsManagement.SetRequiredFields(item);
        BankAccountsManagement.SetReadOnlyFields(row);
    },
    SetColumnsVisibility: function () {
        const bankAccountTable = Controls.CompanyBankAccountsTable__;
        let isAtLeastAnIbanCountry = false;
        let isAtLeastANonIbanCountry = false;
        Sys.Helpers.Controls.ForEachTableItem(bankAccountTable, (item) => {
            const bankCountry = item.GetValue("BankCountry__");
            if (Sys.Helpers.Iban.IsIbanCountry(bankCountry)) {
                isAtLeastAnIbanCountry = true;
            }
            else {
                isAtLeastANonIbanCountry = true;
            }
            return isAtLeastAnIbanCountry && isAtLeastANonIbanCountry;
        });
        bankAccountTable.BankKey__.Hide(!isAtLeastANonIbanCountry);
        bankAccountTable.BankAccountNumber__.Hide(!isAtLeastANonIbanCountry);
        bankAccountTable.ControlKey__.Hide(!isAtLeastANonIbanCountry);
        bankAccountTable.RoutingCode__.Hide(!isAtLeastANonIbanCountry);
        bankAccountTable.BankIBAN__.Hide(!isAtLeastAnIbanCountry);
    },
    SetBankDetailLineCountryIfEmpty: function () {
        const country = Controls.Country__.GetValue();
        const bankAccountTable = Controls.CompanyBankAccountsTable__;
        Sys.Helpers.Controls.ForEachTableItem(bankAccountTable, (item) => {
            if (BankAccountsManagement.IsItemEmpty(item)) {
                item.SetValue("BankCountry__", country);
                BankAccountsManagement.SetCurrency(item, item.GetValue("BankCountry__"));
            }
        });
        BankAccountsManagement.SetAllReadOnlyAndRequiredFields();
        BankAccountsManagement.SetColumnsVisibility();
        Layout.AdaptAddressForBank();
    }
};
const PaymentManagement = {
    ValidatePaymentTerms: function () {
        let errorMessageByField = {
            PaymentTermCode__: "",
            PaymentTerms__: ""
        };
        const isComboBoxActive = CountryManagement.IsPaymentTermComboBoxActive();
        const commentValue = Controls.PaymentTerms__.GetValue();
        if (isComboBoxActive && Sys.Helpers.IsEmpty(commentValue)) {
            const codeValue = Controls.PaymentTermCode__.GetValue();
            const defaultValue = CountryManagement.GetDefaultPaymentTerm();
            // Handle empty payment term fields
            if (Sys.Helpers.IsEmpty(codeValue)) {
                let errorMessage = Language.Translate("_Payment terms code or comment required");
                errorMessageByField.PaymentTermCode__ = errorMessage;
                errorMessageByField.PaymentTerms__ = errorMessage;
            }
            // Handle changing from default payment term code
            else if (defaultValue && codeValue !== defaultValue) {
                // Before upgrading to S302, PaymentTermCode__ may be stored in PaymentTerms__
                const storedValue = HighlightHandling.HeaderFieldValueFromMasterData("PaymentTermCode__") || HighlightHandling.HeaderFieldValueFromMasterData("PaymentTerms__");
                // Handle initial value or restoring initial value
                if (codeValue === storedValue) {
                    // do not raise error
                }
                else if (Data.GetValue("RegistrationType__") !== registrationType.update
                    || (Data.GetValue("RegistrationType__") === registrationType.update && !Data.IsComputed("PaymentTermCode__"))) {
                    errorMessageByField.PaymentTermCode__ = "";
                    errorMessageByField.PaymentTerms__ = Language.Translate("_Payment terms comment required");
                }
            }
        }
        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnValidatePaymentTerms", errorMessageByField, isComboBoxActive);
        const codeFieldIsReadOnly = Controls.PaymentTermCode__.IsReadOnly();
        const commentFieldIsReadOnly = Controls.PaymentTerms__.IsReadOnly();
        Controls.PaymentTermCode__.SetError(codeFieldIsReadOnly ? "" : errorMessageByField.PaymentTermCode__);
        Controls.PaymentTerms__.SetError(commentFieldIsReadOnly ? "" : errorMessageByField.PaymentTerms__);
    },
    ValidatePaymentMethod: function () {
        let errorMessageByField = {
            PaymentMethodCode__: "",
            PaymentMethod__: ""
        };
        const isComboBoxActive = CountryManagement.IsPaymentMethodComboBoxActive();
        const commentValue = Controls.PaymentMethod__.GetValue();
        if (isComboBoxActive && Sys.Helpers.IsEmpty(commentValue)) {
            const codeValue = Controls.PaymentMethodCode__.GetValue();
            const defaultValue = CountryManagement.GetDefaultPaymentMethod();
            // Handle empty payment term fields
            if (Sys.Helpers.IsEmpty(codeValue)) {
                let errorMessage = Language.Translate("_Payment method code or comment required");
                errorMessageByField.PaymentMethodCode__ = errorMessage;
                errorMessageByField.PaymentMethod__ = errorMessage;
            }
            // Handle changing from default payment term code
            else if (defaultValue && codeValue !== defaultValue) {
                // Before upgrading to S302, PaymentMethodCode__ may be stored in PaymentMethod__
                const storedValue = HighlightHandling.HeaderFieldValueFromMasterData("PaymentMethodCode__") || HighlightHandling.HeaderFieldValueFromMasterData("PaymentMethod__");
                // Handle initial value or restoring initial value
                if (codeValue === storedValue) {
                    // do not raise error
                }
                else if (Data.GetValue("RegistrationType__") !== registrationType.update
                    || (Data.GetValue("RegistrationType__") === registrationType.update && !Data.IsComputed("PaymentMethodCode__"))) {
                    errorMessageByField.PaymentMethodCode__ = "";
                    errorMessageByField.PaymentMethod__ = Language.Translate("_Payment method comment required");
                }
            }
        }
        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnValidatePaymentMethod", errorMessageByField, isComboBoxActive);
        const codeFieldIsReadOnly = Controls.PaymentMethodCode__.IsReadOnly();
        const commentFieldIsReadOnly = Controls.PaymentMethod__.IsReadOnly();
        Controls.PaymentMethodCode__.SetError(codeFieldIsReadOnly ? "" : errorMessageByField.PaymentMethodCode__);
        Controls.PaymentMethod__.SetError(commentFieldIsReadOnly ? "" : errorMessageByField.PaymentMethod__);
    }
};
const FON = {
    LoadConfiguration: async function () {
        if (!User.isVendor) {
            await Lib.VM.FON.LoadConfiguration();
        }
    },
    IsTINWithOFACCheckEnabled: function () {
        return Lib.VM.FON.IsTINWithOFACCheckEnabled() || (User.isVendor && Variable.GetValueAsString("IsTINWithOFACCheckEnabled") === "1");
    }
};
const ComplianceRisk = {
    eAttestationsClient: null,
    currentFolderId: null,
    currentDetails: null,
    foldersData: {},
    thirdParties: null,
    attributDefinitions: null,
    popupCallback: null,
    LoadConfiguration: async function () {
        if (!User.isVendor) {
            await Lib.VM.ComplianceRisk.LoadConfiguration();
        }
    },
    ClearResult: function () {
        ComplianceRisk.foldersData = {};
        Data.SetValue("ComplianceRiskIdentifier__", null);
        ComplianceRisk.DisplayDetailsResult(null, null);
        Controls.ComplianceFoldersTitle__.Hide();
        Controls.ComplianceFolders__.SetItemCount(0);
        Controls.ComplianceFolders__.Hide();
        ComplianceRisk.HideDocuments();
    },
    DisplayAddThirdPartyPopup(thirdParties, attributDefinitions, callback) {
        ComplianceRisk.thirdParties = thirdParties;
        ComplianceRisk.attributDefinitions = attributDefinitions;
        ComplianceRisk.popupCallback = callback;
        if (thirdParties.length > 0) {
            return Popup.Dialog("_AddThirdPartyTitle", null, fillThirdPartyDialog, commitThirdPartyDialog, ValidateThirdPartyDialog, HandleThirdPartyDialog, cancelThirdPartyDialog);
        }
        return Popup.Alert(Language.Translate("_NoThirdPartyMessage"), false, null, Language.Translate("_NoThirdPartyTitle"));
    },
    DisplayDetailsResult: function (details, lastLocalUpdatedDate = null) {
        ComplianceRisk.DisplayStatus(false, details === null || details === void 0 ? void 0 : details.onboarded, details === null || details === void 0 ? void 0 : details.complete);
        ComplianceRisk.currentDetails = details;
        let followingDateTime = null;
        let lastChangeDateTime = null;
        let lastLocalUpdateDateTime = lastLocalUpdatedDate == null ? new Date() : new Date(lastLocalUpdatedDate);
        if (details === null || details === void 0 ? void 0 : details.onboarded) {
            followingDateTime = new Date(details === null || details === void 0 ? void 0 : details.followingDate);
            lastChangeDateTime = new Date(details === null || details === void 0 ? void 0 : details.lastChangeDate);
        }
        Controls.ComplianceRefreshingDate__.SetValue(lastLocalUpdateDateTime);
        Controls.ComplianceFollowingDate__.SetValue(followingDateTime);
        Controls.ComplianceLastChangeDate__.SetValue(lastChangeDateTime);
        const monitored = details === null || details === void 0 ? void 0 : details.monitored;
        Controls.FollowButton__.SetText(monitored ? "_StopFollowing" : "_StartFollowing");
        const hideFollowButton = (details === null || details === void 0 ? void 0 : details.onboarded) && !monitored && (details === null || details === void 0 ? void 0 : details.thirdPartyId) !== null;
        Controls.FollowButton__.Hide(details === null ? false : hideFollowButton);
    },
    DisplayFoldersResult: function (jsonFolders) {
        ComplianceRisk.foldersData = {};
        let itemIndex = 0;
        Controls.ComplianceFolders__.SetItemCount(0);
        if (Sys.Helpers.IsArray(jsonFolders)) {
            for (const folder of jsonFolders) {
                ComplianceRisk.foldersData[folder.folderId] = folder;
                const item = Controls.ComplianceFolders__.AddItem(false);
                item.SetValue("ComplianceFolderId__", folder.folderId);
                item.SetValue("ComplianceFolderDescription__", folder.folderDescription);
                item.SetValue("ComplianceFolderCategory__", folder.folderCategory);
                item.SetValue("ComplianceFolderReference__", folder.folderReference);
                itemIndex++;
            }
        }
        Controls.ComplianceFoldersTitle__.Hide(itemIndex === 0);
        Controls.ComplianceFolders__.Hide(itemIndex === 0);
    },
    DisplayFolderStatus(item, control, complete) {
        const status = Lib.VM.ComplianceRisk.GetStatus(false, true, complete);
        item.SetValue("ComplianceFolderStatus__", status.text);
        ComplianceRisk.DisplayStatusStyle(control, status.style);
    },
    DisplayUnfollowThirdPartyConfirmation() {
        async function unfollow() {
            Controls.FollowButton__.SetDisabled(true);
            const promises = [];
            for (let folderId in ComplianceRisk.foldersData) {
                if (ComplianceRisk.foldersData[folderId]) {
                    promises.push(ComplianceRisk.eAttestationsClient.UnfollowThirdPartyFolder(folderId));
                }
            }
            try {
                await Sys.Helpers.Promise.All(promises);
            }
            catch (reason) {
                ComplianceRisk.HandleError(reason, true);
            }
            await ComplianceRisk.Refresh();
            Controls.FollowButton__.SetDisabled(false);
        }
        Popup.Confirm(Language.Translate("_Do you really want to stop following this thirdparty ?"), false, unfollow, null, "_StopFollowingPopupTitle");
    },
    DisplayStatus(isError, onboarded, complete) {
        let widgetData = null;
        if (isError) {
            widgetData = Lib.VM.ComplianceRisk.GetWidgetData(null, null, false, null, true);
        }
        else {
            const complianceData = {
                details: {
                    onboarded: onboarded,
                    complete: complete
                },
                folders: []
            };
            let link = null;
            if (onboarded) {
                link = ComplianceRisk.eAttestationsClient.GetWebSiteUrl(Data.GetValue("ComplianceRiskIdentifier__"));
            }
            widgetData = Lib.VM.ComplianceRisk.GetWidgetData(Controls.ComplianceRiskIdentifier__.GetValue(), complianceData, false, link, true);
        }
        Controls.DisplayedStatusHTML__.FireEvent("onDisplayWidgetStatus", widgetData);
    },
    DisplayStatusStyle(control, style) {
        control.RemoveStyle("compliance-complete");
        control.RemoveStyle("compliance-incomplete");
        control.RemoveStyle("compliance-unfollowed");
        control.RemoveStyle("compliance-unknown");
        control.AddStyle(style);
    },
    FollowThirdParty: function () {
        const SearchThirdParty = async () => {
            let searchValue = Data.GetValue("VendorRegistrationDUNSNumber__");
            let searchBy = "DUNS";
            if (!searchValue) {
                searchBy = "VAT";
                searchValue = await TaxRegistrationNumber.GetTaxRegistrationNumberValue();
                if (!searchValue) {
                    Log.Warn("FollowThirdParty: no search value retrieved to seek third parties");
                    return [];
                }
            }
            return ComplianceRisk.eAttestationsClient.SearchNewThirdParty({
                "countryCode": countryCode,
                "searchBy": searchBy,
                "value": searchValue
            });
        };
        Controls.FollowButton__.Wait(true);
        Controls.FollowButton__.SetDisabled(true);
        const countryCode = Controls.Country__.GetValue();
        const promiseSearchThirdParty = SearchThirdParty();
        const promiseAttributes = ComplianceRisk.eAttestationsClient.GetAttributes();
        Sys.Helpers.Promise.All([promiseSearchThirdParty, promiseAttributes])
            .Then((thirdPartyData) => {
            const thirdparties = thirdPartyData[0];
            const attributes = thirdPartyData[1];
            ComplianceRisk.DisplayAddThirdPartyPopup(thirdparties, attributes, (newThirdPartydata) => {
                if (!newThirdPartydata.cancel) {
                    // CIT001 = SIRET Number, CIT002 = VAT or TAX Number, CIT003 = DUNS Number
                    Controls.FollowButton__.Wait(true);
                    ComplianceRisk.eAttestationsClient.FollowThirdParty({
                        companyIdEncrypted: newThirdPartydata.isIdEncrypted,
                        companyIdType: countryCode === "FR" ? "CIT001" : "CIT003",
                        companyIdValue: newThirdPartydata.id
                    }, newThirdPartydata.email, newThirdPartydata.attributes)
                        .Then(() => {
                        Popup.Alert(Language.Translate("_ComplianceFollowedMessage"), false, function () {
                            ComplianceRisk.Refresh(true);
                        }, Language.Translate("_ComplianceFollowedTitle"));
                    })
                        .Catch((reason) => {
                        ComplianceRisk.HandleError(reason, true);
                    })
                        .Finally(() => {
                        Controls.FollowButton__.Wait(false);
                    });
                }
            });
        })
            .Catch((reason) => {
            ComplianceRisk.HandleError(reason, true);
        })
            .Finally(() => {
            Controls.FollowButton__.Wait(false);
            Controls.FollowButton__.SetDisabled(false);
        });
    },
    HandleError(error, manualRefresh = false) {
        if (error && error.wsError) {
            Sys.Helpers.Array.ForEach(error.wsError, (wsError) => {
                Log.Error("Error Code: " + wsError.code + ", Error Message: " + wsError.msg);
            });
        }
        Data.SetValue("ComplianceRiskIdentifier__", null);
        if (manualRefresh) {
            Popup.Alert(error.msg, false, null, error.msgTitle);
        }
        Controls.ComplianceRefreshingDate__.SetValue(null);
        Controls.ComplianceFollowingDate__.SetValue(null);
        Controls.ComplianceLastChangeDate__.SetValue(null);
        Controls.FollowButton__.Hide();
        Controls.ComplianceFoldersTitle__.Hide();
        Controls.ComplianceFolders__.SetItemCount(0);
        Controls.ComplianceFolders__.Hide();
        ComplianceRisk.DisplayStatus(true, false, false);
        ComplianceRisk.HideDocuments();
    },
    HideDocuments() {
        Controls.ComplianceFolders__.RemoveStyle("highlight");
        Controls.Spacer_ComplianceDocuments__.Hide();
        Controls.ComplianceDocumentsTitle__.Hide();
        Controls.ComplianceDocuments__.SetItemCount(0);
        Controls.ComplianceDocuments__.Hide();
    },
    Init: async function () {
        Controls.ComplianceFolders__.ComplianceFolderButton__.OnClick = ComplianceRisk.OnShowDocuments;
        Controls.ComplianceDocuments__.ComplianceDocumentName__.OnClick = ComplianceRisk.OnViewDocument;
        Controls.CompliancePane.Hide(false);
        ComplianceRisk.eAttestationsClient = new Sys.VM.E_AttestationsClient({
            user: Lib.VM.ComplianceRisk.GetComplianceRiskLogin(),
            pwd: Lib.VM.ComplianceRisk.GetComplianceRiskPassword(),
            accountId: Lib.VM.ComplianceRisk.GetComplianceRiskAccountID(),
            env: Lib.VM.ComplianceRisk.GetComplianceRiskEnv()
        });
        Controls.FollowButton__.OnClick = () => {
            var _a;
            if ((_a = ComplianceRisk.currentDetails) === null || _a === void 0 ? void 0 : _a.monitored) {
                ComplianceRisk.DisplayUnfollowThirdPartyConfirmation();
            }
            else {
                ComplianceRisk.FollowThirdParty();
            }
        };
        Controls.DisplayedStatusHTML__.Hide(false);
        Controls.ComplianceRefreshingDate__.Hide(false);
        Controls.ComplianceFollowingDate__.Hide(false);
        Controls.ComplianceLastChangeDate__.Hide(false);
        Controls.ComplianceFolders__.OnRefreshRow = function (index) {
            const row = Controls.ComplianceFolders__.GetRow(index);
            const item = row.GetItem();
            const folderId = item.GetValue("ComplianceFolderId__");
            ComplianceRisk.DisplayFolderStatus(item, row.ComplianceFolderStatus__, ComplianceRisk.foldersData[folderId].folderState);
            row.ComplianceFolderButton__.Hide(!ComplianceRisk.foldersData[folderId].documents || ComplianceRisk.foldersData[folderId].documents.length === 0);
        };
        Controls.ComplianceDocuments__.OnRefreshRow = function (index) {
            const row = Controls.ComplianceDocuments__.GetRow(index);
            const item = row.GetItem();
            const documentId = item.GetValue("ComplianceDocumentId__");
            const documents = ComplianceRisk.foldersData[ComplianceRisk.currentFolderId].documents;
            const document = documents.find((doc) => doc.documentId.toString() === documentId.toString());
            row.ComplianceDocumentName__.DisplayAs({ type: document.present ? "Link" : "" });
        };
        Controls.DisplayedStatusHTML__.BindEvent("onRefresh", function () {
            ComplianceRisk.Refresh(true);
        });
        if (Data.GetValue("ComplianceRiskIdentifier__")) {
            await ComplianceRisk.LoadData();
        }
        else {
            const taxRegistrationNumber = await TaxRegistrationNumber.GetTaxRegistrationNumberValue();
            if (taxRegistrationNumber) {
                await ComplianceRisk.Refresh();
            }
            else {
                ComplianceRisk.HandleError(null);
            }
        }
    },
    IsEnabled: function () {
        // Only available for non vendor when option activated
        return !User.isVendor && Lib.VM.ComplianceRisk.IsEnabled();
    },
    LoadData: async function () {
        const thirdPartyId = Data.GetValue("ComplianceRiskIdentifier__");
        const data = await Lib.VM.ComplianceRisk.ReadData(thirdPartyId);
        if (data) {
            ComplianceRisk.DisplayDetailsResult(data.details, data.lastLocalUpdate);
            ComplianceRisk.DisplayFoldersResult(data.folders);
        }
        else {
            const taxRegistrationNumber = await TaxRegistrationNumber.GetTaxRegistrationNumberValue();
            if (taxRegistrationNumber) {
                await ComplianceRisk.Refresh();
            }
            else {
                ComplianceRisk.HandleError(null);
            }
        }
    },
    OnShowDocuments: function () {
        Controls.ComplianceFolders__.RemoveStyle("highlight");
        const row = this.GetRow();
        row.AddStyle("highlight");
        const folderId = row.GetItem().GetValue("ComplianceFolderId__");
        ComplianceRisk.currentFolderId = folderId;
        const documents = ComplianceRisk.foldersData[folderId].documents;
        Controls.ComplianceDocuments__.SetItemCount(0);
        for (const document of documents) {
            const item = Controls.ComplianceDocuments__.AddItem(false);
            item.SetValue("ComplianceDocumentId__", document.documentId);
            item.SetValue("ComplianceDocumentName__", document.documentName);
            if (document.present) {
                if (document.evidences.length > 0 && document.evidences[0].expirationDate != null) {
                    item.SetValue("ComplianceExpiryDate__", new Date(document.evidences[0].expirationDate));
                }
                item.SetValue("ComplianceDocumentStatus__", Language.Translate("_ComplianceDocumentPresent"));
            }
            else {
                item.SetValue("ComplianceExpiryDate__", "");
                item.SetValue("ComplianceDocumentStatus__", Language.Translate("_ComplianceDocumentMissing"));
            }
        }
        Controls.Spacer_ComplianceDocuments__.Hide(false);
        Controls.ComplianceDocumentsTitle__.Hide(false);
        Controls.ComplianceDocuments__.Hide(false);
    },
    OnViewDocument: function () {
        const row = this.GetRow();
        const documentItem = row.GetItem();
        const documentId = documentItem.GetValue("ComplianceDocumentId__");
        const documents = ComplianceRisk.foldersData[ComplianceRisk.currentFolderId].documents;
        const document = documents.find((doc) => doc.documentId.toString() === documentId.toString());
        const fileId = document.evidences[0].id;
        ComplianceRisk.eAttestationsClient.GetAttachmentUrl(ComplianceRisk.currentFolderId, documentId, fileId)
            .Then((viewUrl) => {
            Process.OpenLink(viewUrl);
        })
            .Catch((reason) => {
            ComplianceRisk.HandleError(reason, true);
        });
    },
    Refresh: async function (manualRefresh = false) {
        const taxRegistrationNumber = await TaxRegistrationNumber.GetTaxRegistrationNumberValue();
        const taxRegistrationError = TaxRegistrationNumber.GetTaxRegistrationNumberError();
        if (taxRegistrationNumber && !taxRegistrationError) {
            Controls.DisplayedStatusHTML__.Wait(true);
            try {
                let thirdpartyId = await ComplianceRisk.eAttestationsClient.SearchThirdParty("tva=" + taxRegistrationNumber);
                thirdpartyId = await Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.RetrieveThirdPartyId", thirdpartyId) || thirdpartyId;
                if (thirdpartyId) {
                    Data.SetValue("ComplianceRiskIdentifier__", thirdpartyId);
                    const promiseDetails = ComplianceRisk.eAttestationsClient.GetThirdpartyDetails(thirdpartyId);
                    const promiseFolders = ComplianceRisk.eAttestationsClient.SearchThirdPartyFolders(thirdpartyId);
                    const thirdPartyData = await Sys.Helpers.Promise.All([promiseDetails, promiseFolders]);
                    if (thirdPartyData[0]) {
                        const thirdParty = thirdPartyData[0];
                        ComplianceRisk.DisplayDetailsResult(thirdParty, null);
                        const thirdPartyFolders = thirdPartyData[1];
                        ComplianceRisk.DisplayFoldersResult(thirdPartyFolders);
                        ComplianceRisk.HideDocuments();
                    }
                    else {
                        ComplianceRisk.ClearResult();
                    }
                    const customData = await Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnRefreshThirdparty", thirdpartyId, thirdPartyData);
                    ComplianceRisk.StoreData(thirdPartyData, customData);
                }
                else {
                    ComplianceRisk.ClearResult();
                }
            }
            catch (reason) {
                ComplianceRisk.HandleError(reason, manualRefresh);
            }
            finally {
                Controls.DisplayedStatusHTML__.Wait(false);
            }
        }
        else {
            const errorTaxIDJson = {
                error: true, msg: "_TaxIDError", msgTitle: "_TaxIDErrorTitle"
            };
            ComplianceRisk.HandleError(errorTaxIDJson, manualRefresh);
        }
    },
    StoreData: async function (data, customData) {
        if (data) {
            await Lib.VM.ComplianceRisk.StoreData({
                details: data[0],
                folders: data[1],
                customData: customData
            });
        }
    }
};
const CountryManagement = {
    _countriesNameCache: null,
    _statesCache: {},
    _businessStructuresForCurrentCountry: null,
    _isBusinessStructuresIndividualForCurrentCountry: {},
    _diversityClassificationsForCurrentCountry: null,
    _paymentTermsForCurrentCountry: null,
    _paymentTermsDefaultForCurrentCountry: null,
    _paymentMethodsForCurrentCountry: null,
    _paymentMethodsDefaultForCurrentCountry: null,
    _nbRetries: 4,
    Init: function () {
        const wait = ms => Sys.Helpers.Promise.Create(resolve => setTimeout(resolve, ms));
        const getCountriesList = () => Sys.Helpers.Promise.Create(function (resolve) {
            const allCountries = Controls.Country__.GetAvailableValues();
            if (allCountries.length <= 0 && CountryManagement._nbRetries > 0) {
                CountryManagement._nbRetries--;
                wait(200).Then(getCountriesList).Then(resolve);
            }
            else {
                CountryManagement._countriesNameCache = {};
                for (let i = 0; i < allCountries.length; i++) {
                    const keyVal = allCountries[i].split("=");
                    CountryManagement._countriesNameCache[keyVal[0]] = keyVal[1];
                }
                resolve();
            }
        });
        return Sys.Helpers.Promise.Create(function (resolve) {
            // Default country on new registration only & only for first time load
            if (IsUnModifiedNewRegistration() && Sys.Helpers.IsEmpty(Data.GetValue("Country__"))) {
                Data.SetValue("Country__", CountryManagement.GetUserDefaultCountry());
            }
            g_CurrentCountry = Data.GetValue("Country__");
            if (CountryManagement._countriesNameCache === null) {
                getCountriesList().Then(resolve);
            }
            else {
                resolve();
            }
        }).Then(CountryManagement.ApplyChangeOfCountry);
    },
    GetUserDefaultCountry: function () {
        const navigatorLanguageSplit = navigator.language.split("-");
        return navigatorLanguageSplit[navigatorLanguageSplit.length - 1];
    },
    GetStatesListForCountry: function (country) {
        if (!country) {
            return Sys.Helpers.Promise.Resolve([]);
        }
        if (CountryManagement._statesCache[country]) {
            return Sys.Helpers.Promise.Resolve(CountryManagement._statesCache[country]);
        }
        // Init cache with null value indicating the search was already done for this country
        CountryManagement._statesCache[country] = null;
        return Sys.Helpers.Promise.Create(function (resolve) {
            Data.GetStatesFromCountry(country, function (result) {
                if (result) {
                    CountryManagement.CachingStates(country, result);
                }
                resolve(CountryManagement._statesCache[country] || []);
            });
        });
    },
    SetIfStructureIsIndividual: function () {
        const businessStructure = Data.GetValue("CompanyStructure__");
        Data.SetValue("IsIndividualStructure__", CountryManagement._isBusinessStructuresIndividualForCurrentCountry[businessStructure]);
        Controls.IsIndividualStructure__.OnChange();
    },
    ApplyChangeOfCountry: function () {
        const promises = [];
        const country = Controls.Country__.GetValue();
        const isCountryChanged = g_CurrentCountry !== country;
        const previousCountry = g_CurrentCountry;
        g_CurrentCountry = country;
        promises.push(CountryManagement.UpdateDisplayedStatesList(country, isCountryChanged));
        promises.push(CountryManagement.DisplayCountryBusinessStructures(country));
        promises.push(CountryManagement.DisplayCountryDiversityClassifications(country));
        promises.push(CountryManagement.DisplayCountryPaymentTerms(country, isCountryChanged));
        promises.push(CountryManagement.DisplayCountryPaymentMethods(country, isCountryChanged));
        return Sys.Helpers.Promise.All(promises)
            .Then(UpdateDiversityDocumentControlsDependingOnDiversityClassification)
            .Then(() => {
            CountryManagement.SetIfStructureIsIndividual();
            TaxRegistrationNumber.ResetValues(previousCountry, g_CurrentCountry);
            Layout.AdaptCompanyProfilePane();
            Layout.AdaptAddressForBank();
            const ueValue = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.ApplyChangeOfCountryEnd", isCountryChanged);
            return ueValue;
        });
    },
    ApplyChangeOfBankAddressCountry: function () {
        g_CurrentCountryForBank = Controls.CountryForBank__.GetValue();
        return CountryManagement.UpdateDisplayedStatesListForBankAddress(g_CurrentCountryForBank)
            .then(() => {
            Layout.AdaptAddressForBank();
        });
    },
    DisplayCountryBusinessStructures: function (country) {
        function getStructureValues() {
            const queryOptions = {
                table: "Country_Business_Structures__",
                filter: `(Country__=${country})`,
                attributes: ["BusinessStructure__", "IsIndividualStructure__"],
                sortOrder: "BusinessStructure__ ASC",
                maxRecords: 100
            };
            return Sys.GenericAPI.PromisedQuery(queryOptions)
                .Then((queryResults) => {
                const comboBoxOptions = [];
                CountryManagement._isBusinessStructuresIndividualForCurrentCountry = {};
                let isInit = false;
                if (queryResults.length > 0) {
                    for (const queryResult of queryResults) {
                        const businessStructure = queryResult.BusinessStructure__;
                        comboBoxOptions.push(`${businessStructure}=${businessStructure}`);
                        CountryManagement._isBusinessStructuresIndividualForCurrentCountry[businessStructure] = queryResult.IsIndividualStructure__ === "1";
                    }
                    comboBoxOptions.unshift("=");
                }
                if (!CountryManagement._businessStructuresForCurrentCountry || Controls.CompanyStructure__.GetValue() !== "") {
                    isInit = true;
                }
                CountryManagement._businessStructuresForCurrentCountry = comboBoxOptions;
                setStructureValues(isInit);
            })
                .Catch((reason) => {
                Log.Error(`Query has failed. Could not retrieve the business structures ${reason}`);
            });
        }
        function setStructureValues(isInit = false) {
            const values = CountryManagement._businessStructuresForCurrentCountry;
            Controls.CompanyStructure__.SetAvailableValues(values);
            if (isInit) {
                const value = Controls.CompanyStructure__.GetValue();
                if (Controls.CompanyStructure__.GetAvailableValues(true).indexOf(value) === -1) {
                    Controls.CompanyStructure__.SetValue(null);
                }
            }
            else {
                Controls.CompanyStructure__.SetValue(null);
            }
            Controls.CompanyStructure__.Hide(values.length === 0);
        }
        return getStructureValues();
    },
    DisplayCountryDiversityClassifications: function (country) {
        function fillDiversityClassificationComboBox(values) {
            const isDiversityStepNeeded = values.length > 0;
            if (isDiversityStepNeeded) {
                // Allow empty value ("=")
                Controls.DiversityClassification__.SetAvailableValues(["="].concat(values));
            }
            else {
                Controls.DiversityClassification__.SetAvailableValues(null);
            }
            steps.diversity.hiddenStep = !isDiversityStepNeeded;
            if (!User.isVendor) {
                Controls.DiversityPane.Hide(!isDiversityStepNeeded);
                if (isDiversityStepNeeded) {
                    DiversityClassificationManagement.InitFields();
                }
            }
            Wizard.RefreshStepButtons();
        }
        function queryDiversityClassifications() {
            const queryOptions = {
                table: "Country_Diversity_Classifications__",
                filter: `(Country__=${country})`,
                attributes: ["DiversityClassification__"],
                maxRecords: 100
            };
            return Sys.GenericAPI.PromisedQuery(queryOptions);
        }
        function buildDiversityClassificationsComboBoxOptions(queryResults) {
            const comboBoxOptions = [];
            for (const result of queryResults) {
                const diversityClassification = result.DiversityClassification__;
                comboBoxOptions.push(`${diversityClassification}=${diversityClassification}`);
            }
            CountryManagement._diversityClassificationsForCurrentCountry = comboBoxOptions;
            return comboBoxOptions;
        }
        CountryManagement._diversityClassificationsForCurrentCountry = null;
        return queryDiversityClassifications()
            .Then(result => buildDiversityClassificationsComboBoxOptions(result))
            .Then(options => fillDiversityClassificationComboBox(options));
    },
    DisplayCountryPaymentTerms: function (country, isCountryChanged) {
        function setDefaultPaymentTerms() {
            const defaultValue = CountryManagement._paymentTermsDefaultForCurrentCountry || "";
            // Only set the value if the country has changed OR for new registrations that have not yet been saved
            if (isCountryChanged || IsUnModifiedNewRegistration()) {
                Controls.PaymentTermCode__.SetValue(defaultValue);
            }
        }
        function fillPaymentTermsComboBox(values) {
            const paymentTermsRetrieved = values.length > 0;
            if (paymentTermsRetrieved) {
                Controls.PaymentTerms__.SetLabel("_Payment terms comment");
                Controls.PaymentTermCode__.Hide(false);
                // Allow empty value ("=")
                Controls.PaymentTermCode__.SetAvailableValues(["="].concat(values));
                setDefaultPaymentTerms();
            }
            else {
                Controls.PaymentTermCode__.Hide(true);
                Controls.PaymentTermCode__.SetAvailableValues(null);
                Controls.PaymentTerms__.SetLabel("_Payment terms");
            }
        }
        function queryPaymentTerms() {
            const queryOptions = {
                table: "Country_Payment_Term__",
                filter: `(Country__=${country})`,
                attributes: ["Code__", "IsDefault__"],
                sortOrder: "Code__ ASC",
                maxRecords: 100
            };
            return Sys.GenericAPI.PromisedQuery(queryOptions);
        }
        function builPaymentTermsComboBoxOptions(queryResults) {
            const comboBoxOptions = [];
            let defaultVal = "";
            for (const result of queryResults) {
                const paymentTerm = result.Code__;
                comboBoxOptions.push(`${paymentTerm}=${paymentTerm}`);
                if (result.IsDefault__ === "1" && defaultVal === "") {
                    defaultVal = paymentTerm;
                }
            }
            CountryManagement._paymentTermsForCurrentCountry = comboBoxOptions;
            CountryManagement._paymentTermsDefaultForCurrentCountry = defaultVal;
            return comboBoxOptions;
        }
        CountryManagement._paymentTermsForCurrentCountry = null;
        CountryManagement._paymentTermsDefaultForCurrentCountry = null;
        return queryPaymentTerms()
            .Then(result => builPaymentTermsComboBoxOptions(result))
            .Then(options => fillPaymentTermsComboBox(options));
    },
    DisplayCountryPaymentMethods: function (country, isCountryChanged) {
        function setDefaultPaymentMethods() {
            const defaultValue = CountryManagement._paymentMethodsDefaultForCurrentCountry || "";
            // Only set the value if the country has changed OR for new registrations that have not yet been saved
            if (isCountryChanged || IsUnModifiedNewRegistration()) {
                Controls.PaymentMethodCode__.SetValue(defaultValue);
            }
        }
        function fillPaymentMethodsComboBox(values) {
            const paymentMethodsRetrieved = values.length > 0;
            if (paymentMethodsRetrieved) {
                Controls.PaymentMethod__.SetLabel("_Payment method comment");
                Controls.PaymentMethodCode__.Hide(false);
                // Allow empty value ("=")
                Controls.PaymentMethodCode__.SetAvailableValues(["="].concat(values));
                setDefaultPaymentMethods();
            }
            else {
                Controls.PaymentMethodCode__.Hide(true);
                Controls.PaymentMethodCode__.SetAvailableValues(null);
                Controls.PaymentMethod__.SetLabel("_Payment method");
            }
        }
        function queryPaymentMethods() {
            const queryOptions = {
                table: "Country_Payment_Method__",
                filter: `(Country__=${country})`,
                attributes: ["PaymentMethod__", "IsDefault__"],
                sortOrder: "PaymentMethod__ ASC",
                maxRecords: 100
            };
            return Sys.GenericAPI.PromisedQuery(queryOptions);
        }
        function buildPaymentMethodsComboBoxOptions(queryResults) {
            const comboBoxOptions = [];
            let defaultVal = "";
            for (const result of queryResults) {
                const paymentMethod = result.PaymentMethod__;
                comboBoxOptions.push(`${paymentMethod}=${paymentMethod}`);
                if (result.IsDefault__ === "1" && defaultVal === "") {
                    defaultVal = paymentMethod;
                }
            }
            CountryManagement._paymentMethodsForCurrentCountry = comboBoxOptions;
            CountryManagement._paymentMethodsDefaultForCurrentCountry = defaultVal;
            return comboBoxOptions;
        }
        CountryManagement._paymentMethodsForCurrentCountry = null;
        CountryManagement._paymentMethodsDefaultForCurrentCountry = null;
        return queryPaymentMethods()
            .Then(result => buildPaymentMethodsComboBoxOptions(result))
            .Then(options => fillPaymentMethodsComboBox(options));
    },
    CachingStates: function (country, statesNode) {
        const states = statesNode.getElementsByTagName("state");
        if (states && states.item(0)) {
            CountryManagement._statesCache[country] = [];
            for (let i = 0; i < states.length; i++) {
                const state = states.item(i);
                CountryManagement._statesCache[country].push(`${state.getAttribute("code")}=${state.getAttribute("name")}`);
            }
        }
    },
    UpdateDisplayedStatesList: async function (country, isCountryChanged) {
        const states = await CountryManagement.GetStatesListForCountry(country);
        Controls.ComboState__.SetAvailableValues(states);
        if (states.length > 0) {
            Controls.ComboState__.SelectOption(Controls.Mail_State__.GetValue());
            Controls.Mail_State__.SetValue(Controls.ComboState__.GetSelectedOption());
        }
        else if (isCountryChanged) {
            Controls.Mail_State__.SetValue("");
        }
    },
    UpdateDisplayedStatesListForBankAddress: function (country) {
        return CountryManagement.GetStatesListForCountry(country).then((states) => {
            Controls.ComboStateForBank__.SetAvailableValues(states);
            Controls.ComboStateForBank__.SelectOption(Controls.StateForBank__.GetValue());
            Controls.StateForBank__.SetValue(Controls.ComboStateForBank__.GetSelectedOption());
        });
    },
    GetCountryName: function (country) {
        return CountryManagement._countriesNameCache[country] || country;
    },
    IsPaymentTermComboBoxActive: function () {
        return CountryManagement._paymentTermsForCurrentCountry && Object.keys(CountryManagement._paymentTermsForCurrentCountry).length > 0;
    },
    GetDefaultPaymentTerm: function () {
        return CountryManagement._paymentTermsDefaultForCurrentCountry || "";
    },
    IsPaymentMethodComboBoxActive: function () {
        return CountryManagement._paymentMethodsForCurrentCountry && Object.keys(CountryManagement._paymentMethodsForCurrentCountry).length > 0;
    },
    GetDefaultPaymentMethod: function () {
        return CountryManagement._paymentMethodsDefaultForCurrentCountry || "";
    }
};
const DiversityClassificationManagement = {
    InitFields: function () {
        const diversityClassification = Controls.DiversityClassification__.GetValue() || "";
        if (diversityClassification === "") {
            // Hide diversity metadata since the diversity combobox is empty
            DiversityClassificationManagement.ResetFields();
            DiversityClassificationManagement.DisableFields();
        }
        else {
            // Show diversity metadata
            DiversityClassificationManagement.EnableFields();
        }
        UpdateDiversityDocumentControlsDependingOnDiversityClassification();
    },
    EnableFields: function () {
        Controls.DiversityCertificationID__.Hide(false);
        Controls.DiversityCertificationID__.SetRequired(true);
        Controls.DiversityCertificationIssuedDate__.Hide(false);
        Controls.DiversityCertificationIssuedDate__.SetRequired(true);
        Controls.DiversityCertificationExpirationDate__.Hide(false);
        Controls.DiversityCertificationExpirationDate__.SetRequired(true);
        // Handle documents pane
        if (User.isVendor) {
            Controls.DocumentsPane.Hide(false);
        }
    },
    DisableFields: function () {
        Controls.DiversityCertificationID__.Hide(true);
        Controls.DiversityCertificationID__.SetRequired(false);
        Controls.DiversityCertificationIssuedDate__.Hide(true);
        Controls.DiversityCertificationIssuedDate__.SetRequired(false);
        Controls.DiversityCertificationExpirationDate__.Hide(true);
        Controls.DiversityCertificationExpirationDate__.SetRequired(false);
        // Handle documents pane
        if (User.isVendor) {
            Controls.DocumentsPane.Hide(true);
        }
    },
    ResetFields: function () {
        Controls.DiversityCertificationID__.SetValue("");
        Controls.DiversityCertificationID__.SetError("");
        Controls.DiversityCertificationIssuedDate__.SetValue("");
        Controls.DiversityCertificationIssuedDate__.SetError("");
        Controls.DiversityCertificationExpirationDate__.SetValue("");
        Controls.DiversityCertificationExpirationDate__.SetError("");
    },
    PrefillDocumentsExpirationDates: function () {
        const documentsTable = Data.GetTable("DocumentsTable__");
        const diversityCertificationEndOfValidity = Data.GetValue("DiversityCertificationExpirationDate__");
        const diversityDocumentCategory = Lib.VendorRegistration.DocumentsTable.documentTypes.getValue(Lib.VendorRegistration.DocumentsTable.documentTypes.diversityClassification);
        for (let i = 0; i < documentsTable.GetItemCount(); i++) {
            const documentCategory = documentsTable.GetItem(i).GetValue("DocumentType__");
            const documentEndOfValidity = documentsTable.GetItem(i).GetValue("EndOfValidity__");
            if (documentCategory === diversityDocumentCategory && !documentEndOfValidity && diversityCertificationEndOfValidity) {
                documentsTable.GetItem(i).SetValue("EndOfValidity__", diversityCertificationEndOfValidity);
            }
        }
    },
    HidePanelIfNeeded: function () {
        if (Controls.DiversityClassification__.GetAvailableValues().length <= 1) {
            // The vendor did not fill a diversity classification - hide the panel.
            Controls.DiversityPane.Hide(true);
        }
    }
};
const FlexibleFormToJSON = {
    GetTable: function (tableName) {
        const table = Data.GetTable(tableName);
        const tableObj = [];
        // Adds each item
        for (let itemIdx = 0; itemIdx < table.GetItemCount(); itemIdx++) {
            const item = table.GetItem(itemIdx);
            const itemObj = {};
            let lineEmpty = true;
            const columns = Controls[tableName].GetColumnsOrder();
            for (const column of columns) {
                itemObj[column] = item.GetValue(column);
                if (lineEmpty && itemObj[column]) {
                    lineEmpty = false;
                }
            }
            if (!lineEmpty) {
                tableObj.push(itemObj);
            }
        }
        return tableObj;
    }
};
const HandleActions = {
    ApproveWithPopupCommentDialog: function () {
        ValidateRequiredFields();
        if (!Process.ShowFirstError()) {
            HandleActions.popUpCommentDialog("_ApprovePopupTitle", "Submit");
        }
    },
    Approve: function () {
        ValidateRequiredFields();
        const submitFn = () => {
            let withError = false;
            if (Data.GetValue("RegistrationType__") !== registrationType.update) {
                withError = Lib.VendorRegistration.DocumentsTable.CheckMandatoryDocumentTypes();
            }
            if (!Process.ShowFirstError() && !withError) {
                Lib.VendorRegistration.DocumentsTable.AttachDocumentsToRecord();
                HandleApprovalAndTab("Submit");
            }
        };
        const cancelApproveActionFn = () => {
            // do nothing.
        };
        const passIBANErrorToWarningAndSubmit = () => {
            SisID.EnableSisidErrorAsWarning(true);
            SisID.SetAllSisidErrorsAsWarnings();
            submitFn();
        };
        const passFONBankRefErrorToWarningAndSubmit = () => {
            FON_BankCheck.EnableFONErrorAsWarning(true);
            FON_BankCheck.SetAllFONErrorsAsWarnings();
            submitFn();
        };
        const displayApproveConfirmationPopup = (messagesToFormat, callback) => {
            let popupMessage = "";
            let popupTile = "";
            if (messagesToFormat.length > 1) {
                let concatenatedMessages = "";
                messagesToFormat.forEach(element => {
                    concatenatedMessages += `• ${element}\n`;
                });
                popupMessage = Language.Translate("_{0} ApproveDespiteMultipleIssues", false, concatenatedMessages);
                popupTile = "_ApproveDespiteIssuesPopupTile";
            }
            else {
                popupMessage = Language.Translate("_{0} ApproveDespiteOneIssue", false, messagesToFormat[0]);
                popupTile = "_ApproveDespiteIssuePopupTile";
            }
            Popup.Confirm(popupMessage, false, callback, cancelApproveActionFn, popupTile);
        };
        if (!User.isVendor && ProcessInstance.id) {
            const messageToDisplay = [];
            if (Lib.VendorRegistration.CheckDuplicateVendor.ShouldCheckDuplicates()) {
                const ruidEx = ProcessInstance.id;
                const msnEx = ruidEx.substring(ruidEx.indexOf(".") + 1);
                Lib.VendorRegistration.CheckDuplicateVendor.CheckAllDuplicates(msnEx).then((duplicationsFound) => {
                    let popupConfirmationCallback = submitFn;
                    if (duplicationsFound) {
                        messageToDisplay.push(Language.Translate("_DuplicatesFound"));
                        DisplayDuplicateWarning();
                        CheckDuplicateCompanyCode();
                    }
                    if (SisID.hasError) {
                        popupConfirmationCallback = passIBANErrorToWarningAndSubmit;
                        messageToDisplay.push(Language.Translate("_SisIdErrorOnIBAN"));
                    }
                    if (FON_BankCheck.hasError) {
                        popupConfirmationCallback = passFONBankRefErrorToWarningAndSubmit;
                        messageToDisplay.push(Language.Translate("_FONErrorOnBankRef"));
                    }
                    if (messageToDisplay.length > 0) {
                        displayApproveConfirmationPopup(messageToDisplay, popupConfirmationCallback);
                    }
                    else {
                        submitFn();
                    }
                });
            }
            else if (SisID.hasError) {
                displayApproveConfirmationPopup([Language.Translate("_SisIdErrorOnIBAN")], passIBANErrorToWarningAndSubmit);
            }
            else if (FON_BankCheck.hasError) {
                displayApproveConfirmationPopup([Language.Translate("_FONErrorOnBankRef")], passFONBankRefErrorToWarningAndSubmit);
            }
            else {
                submitFn();
            }
        }
        else {
            submitFn();
        }
    },
    Reject: function () {
        HandleActions.popUpCommentDialog("_WarningRejectTitle", "Reject");
    },
    BackToVendor: function () {
        HandleActions.popUpCommentDialog("_BackToVendorPopupTitle", "BackToVendor");
    },
    /* HELPER */
    popUpCommentDialog: function (dialogTitle, actionName) {
        let popupConfig = {
            allowComment: true,
            commentRequired: true,
            explanationLabel: null,
            title: dialogTitle,
            onClickOk: function (result) {
                // Store value on the form!
                Data.SetValue("Comment__", result.comment);
                HandleApprovalAndTab(actionName);
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.CustomizePopupOkConfig", popupConfig) || popupConfig;
        Lib.CommonDialog.PopupOkExtended(popupConfig);
    }
};
const HighlightHandling = {
    companyLookupVariable: "FieldsFromCompanyLookup",
    masterDataProcessVariable: "FieldsFromMasterData",
    modifiedFieldsProcessVariable: "ModifiedFields",
    diff: {},
    HeaderFieldValueFromCompanyLookup: function (field) {
        if (ValuesFromCompanyLookup && ValuesFromCompanyLookup.fields) {
            return ValuesFromCompanyLookup.fields[field];
        }
        return null;
    },
    HeaderFieldValueFromMasterData: function (field) {
        if (ValuesFromMasterData && ValuesFromMasterData.fields) {
            return ValuesFromMasterData.fields[field];
        }
        return null;
    },
    HighlightUpdatedFields: function () {
        const highlightStyle = highlightStyles.warning;
        const modifiedFields = HighlightHandling.FetchModifiedFields();
        if (modifiedFields) {
            if (Data.GetValue("RegistrationType__") === registrationType.update) {
                HighlightHandling.FetchInitialMasterData();
                for (const field of modifiedFields.fields) {
                    HighlightHandling.HandleHighlightForField(field, highlightStyle, HighlightHandling.HeaderFieldValueFromMasterData(field), false);
                }
                for (const table of modifiedFields.tables) {
                    if (ValuesFromMasterData && ValuesFromMasterData.tables[table]) {
                        HighlightHandling.HandleHighlightForTable(table, ValuesFromMasterData.tables[table]);
                    }
                }
            }
            else if (Data.GetValue("RegistrationType__") === registrationType.registration) {
                if (!Lib.VendorRegistration.InternalRequest.IsInternalRequest() || Lib.VendorRegistration.Workflow.Controller.GetContributorIndex() !== 0) {
                    HighlightHandling.FetchInitialCompanyLookup();
                    for (const field of modifiedFields.fields) {
                        HighlightHandling.HandleHighlightForField(field, highlightStyle, HighlightHandling.HeaderFieldValueFromCompanyLookup(field), true);
                    }
                }
            }
        }
    },
    HandleHighlightForField: function (fieldName, highlightStyle, oldValue, fromDnB) {
        if (fromDnB && !oldValue) {
            // no highlights when DnB returns an empty value
            return;
        }
        Controls[fieldName].AddStyle(highlightStyle);
        // Prettify the tooltip for the combo controls.
        if (oldValue) {
            if (fieldName === "Country__") {
                oldValue = CountryManagement.GetCountryName(oldValue);
            }
            else if (Controls[fieldName].GetType() === "ComboBox") {
                oldValue = Language.Translate(oldValue, false);
            }
        }
        const infoText = fromDnB ? "_PreviousDNBValueIs" : "_PreviousValueIs";
        Controls[fieldName].SetInfo(`${Language.Translate(infoText)} ${oldValue || Language.Translate("_NoValue")}`);
    },
    HandleHighlightForTable: function (tableName, initTableValues) {
        function stringifyTableLine(line) {
            // Pretty-print the bank account country
            if (line.BankCountry__) {
                line.BankCountry__ = CountryManagement.GetCountryName(line.BankCountry__);
            }
            const columnsOrder = Controls[tableName].GetColumnsOrder();
            return columnsOrder.filter((col) => col !== "BankDetailID__" && col !== "CompanyOfficerID__")
                .map((col) => `${Language.Translate(Controls[tableName][col].GetLabel())}:&nbsp;<b>${line[col] || Language.Translate("_NoValue")}</b>`)
                .join(", ");
        }
        function buildDeletedTooltip(deletedLines) {
            if (!deletedLines || deletedLines.length === 0) {
                return "";
            }
            const deletedLineLabelKey = tableName === "CompanyBankAccountsTable__" ? "_DeletedLinesBankReferences" : "_DeletedLinesContacts";
            let t = Language.Translate(deletedLineLabelKey) + "<br/><del>";
            for (const deletedLine of deletedLines) {
                t += `${stringifyTableLine(deletedLine)}<br/>`;
            }
            return t + "</del>";
        }
        function highlightRowsFromTable(keyColumn) {
            var _a;
            const table = Controls[tableName];
            const lineCount = table.GetLineCount(true);
            for (let i = 0; i < lineCount; i++) {
                const row = table.GetRow(i);
                if (!row) {
                    continue;
                }
                const id = row[keyColumn].GetValue();
                const status = (_a = HighlightHandling.diff[tableName]) === null || _a === void 0 ? void 0 : _a.statuses[id];
                if (status) {
                    HighlightHandling.HandleLineHighlightDetails(row, status, tableName);
                }
            }
        }
        function isProcessableStandardTable() {
            // Exclude the questionnaire result table and any custom table starting with Z_
            return tableName !== "GlobalQuestionnaireResultTable__" && !tableName.startsWith("Z_");
        }
        // Hard-coded controls name map for tables
        const tooltipTableMapping = {
            "CompanyOfficersTable__": "CompanyOfficersTableMessage__",
            "CompanyBankAccountsTable__": "CompanyBankAccountsTableMessage__",
            "DocumentsTable__": "DocumentsTableMessage__"
        };
        const tooltipControl = Controls[tooltipTableMapping[tableName]];
        // Create tooltip HTML value
        let tooltip = "";
        function applyDiffForKeyColumn(keyColumn) {
            const currentTableValues = FlexibleFormToJSON.GetTable(tableName);
            HighlightHandling.diff[tableName] = HighlightHandling.GetTableDiffDetails(currentTableValues, initTableValues, keyColumn);
            tooltip += buildDeletedTooltip(HighlightHandling.diff[tableName].deletedLines);
            highlightRowsFromTable(keyColumn);
        }
        if (tableName === "DocumentsTable__") {
            // Specific case for documents
            if (Attach.GetNbAttach() > 0) {
                tooltip = `<b>${Language.Translate("_{0}NewDocuments", undefined, Attach.GetNbAttach())}</b>`;
            }
        }
        else if (isProcessableStandardTable()) {
            const keyColumnByTable = {
                "CompanyBankAccountsTable__": "BankDetailID__",
                "UNSPSCList__": "Code__"
            };
            const keyColumn = keyColumnByTable[tableName] || "CompanyOfficerID__";
            applyDiffForKeyColumn(keyColumn);
        }
        const customKeyColumn = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.GetCustomTableKeyColumn", tableName) || null;
        if (customKeyColumn) {
            applyDiffForKeyColumn(customKeyColumn);
        }
        if (tooltipControl && tooltip) {
            tooltipControl.Hide(false);
            tooltipControl.SetHTML(tooltip);
        }
    },
    HandleHighlightForRow: function (tableName, keyColumn, row) {
        var _a;
        if (row && !User.isVendor) {
            HighlightHandling.ResetTooltipsOnRow(row);
            const id = row[keyColumn].GetValue();
            if ((_a = HighlightHandling.diff[tableName]) === null || _a === void 0 ? void 0 : _a.statuses[id]) {
                HighlightHandling.HandleLineHighlightDetails(row, HighlightHandling.diff[tableName].statuses[id], tableName);
            }
        }
    },
    GetTableDiffDetails: function (currentTableValues, initTableValues, keyColumn) {
        let i;
        let initTableLine;
        let currentTableLine;
        let isInInitTable;
        const linesStatuses = {};
        // new table
        for (currentTableLine of currentTableValues) {
            i = 0;
            isInInitTable = false;
            // old table
            while (!isInInitTable && i < initTableValues.length) {
                initTableLine = initTableValues[i];
                // id found
                if (currentTableLine[keyColumn] === initTableLine[keyColumn]) {
                    isInInitTable = true;
                    if (!lineEquals(currentTableLine, initTableLine)) {
                        linesStatuses[currentTableLine[keyColumn]] = {
                            status: "updated",
                            updatedColumns: getColumnsDiff(currentTableLine, initTableLine)
                        };
                    }
                }
                else {
                    i++;
                }
            }
            // if not in old table
            if (!isInInitTable) {
                linesStatuses[currentTableLine[keyColumn]] = { status: "new" };
            }
            else {
                // removing found line from old table
                initTableValues.splice(i, 1);
            }
        }
        function getColumnsDiff(currentLine, initLine) {
            const columnsDiff = {};
            for (const column of Object.keys(currentLine)) {
                if ((currentLine[column] || "") !== (initLine[column] || "")) {
                    columnsDiff[column] = { "oldValue": initLine[column] };
                }
            }
            return columnsDiff;
        }
        function lineEquals(line1, line2) {
            return !Object.keys(line1).some(column => (line1[column] || "") !== (line2[column] || ""));
        }
        // initTableValues now only contains lines not present in current table (i.e. deleted lines)
        return { statuses: linesStatuses, deletedLines: initTableValues };
    },
    HandleLineHighlightDetails: function (line, lineDetails, tableName) {
        if (lineDetails.status === "new") {
            //line.BankKey__.SetInfo(lineDetails.updatedColumns[column]);
            const newLabelMapping = {
                "CompanyBankAccountsTable__": "_NewBankReference",
                "UNSPSCList__": "_NewUNSPSC",
            };
            const labelKey = newLabelMapping[tableName] || "_NewContact";
            const newLabel = Language.Translate(labelKey);
            const columns = Object.keys(line);
            for (const column of columns) {
                if (typeof line[column].AddStyle !== "undefined") {
                    line[column].AddStyle(highlightStyles.warning);
                    line[column].SetInfo(newLabel);
                }
            }
        }
        else if (lineDetails.status === "updated") {
            for (const column of Object.keys(lineDetails.updatedColumns)) {
                line[column].AddStyle(highlightStyles.warning);
                line[column].SetInfo(`${Language.Translate("_PreviousValueIs")} ${lineDetails.updatedColumns[column].oldValue || Language.Translate("_NoValue")}`);
            }
        }
    },
    FetchInitialCompanyLookup: function () {
        if (!ValuesFromCompanyLookup) {
            try {
                const struct = Variable.GetValueAsString(HighlightHandling.companyLookupVariable);
                ValuesFromCompanyLookup = JSON.parse(struct).flexible;
            }
            catch (ex) {
                Log.Warn("Unable to fetch initial company lookup data");
            }
        }
    },
    FetchInitialMasterData: function () {
        if (!ValuesFromMasterData) {
            try {
                const struct = Variable.GetValueAsString(HighlightHandling.masterDataProcessVariable);
                ValuesFromMasterData = JSON.parse(struct).flexible;
            }
            catch (ex) {
                Log.Warn("Unable to fetch initial master data");
            }
        }
    },
    FetchModifiedFields: function () {
        try {
            const struct = Variable.GetValueAsString(HighlightHandling.modifiedFieldsProcessVariable);
            return JSON.parse(struct);
        }
        catch (ex) {
            Log.Warn("Unable to fetch the list of modified fields");
        }
        return null;
    },
    ResetTooltipsOnRow: function (row) {
        Object.keys(row).forEach(function (control) {
            if (row[control]) {
                if (typeof row[control].RemoveStyle === "function") {
                    row[control].RemoveStyle(highlightStyles.warning);
                }
                if (typeof row[control].SetInfo === "function") {
                    row[control].SetInfo(null);
                }
            }
        });
    },
    ResetAllTooltips: function () {
        function resetTablTooltips(tableControl) {
            const lineCount = tableControl.GetLineCount(true);
            for (let i = 0; i < lineCount; i++) {
                HighlightHandling.ResetTooltipsOnRow(tableControl.GetRow(i));
            }
        }
        Object.keys(Controls).forEach(function (control) {
            if (Controls[control] && typeof Controls[control].SetInfo === "function") {
                Controls[control].SetInfo(null);
            }
        });
        resetTablTooltips(Controls.CompanyOfficersTable__);
        resetTablTooltips(Controls.CompanyBankAccountsTable__);
    }
};
const IBAN = {
    Validate: function (item) {
        let errorCount = 0;
        if (item && !BankAccountsManagement.IsItemEmpty(item)) {
            const country = item.GetValue("BankCountry__");
            const notVerifiedBySisID = item.IsNullOrEmpty("BankIBANScore__");
            const checkIban = Sys.Helpers.Iban.IsIbanCountry(country);
            if (checkIban && notVerifiedBySisID) {
                item.SetError("BankIBAN__", "");
                item.SetError("BankIBANScore__", "");
                item.SetValue("RoutingCode__", "");
                const isValidIBAN = Sys.Helpers.Iban.IsValid(item.GetValue("BankIBAN__"), country);
                if (!isValidIBAN) {
                    const errorMsg = item.IsNullOrEmpty("BankIBAN__") ? "This field is required!" : "_invalid iban format";
                    AddError("BankIBAN__", errorMsg, item);
                    // Reset fields depending on BankIBAN__
                    item.SetValue("BankKey__", "");
                    item.SetValue("BankAccountNumber__", "");
                    item.SetValue("ControlKey__", "");
                    errorCount++;
                }
                else {
                    // IBAN is valid - fill associated fields
                    const bankIdentifiers = Sys.Helpers.Iban.GetBankIdentifiers(item.GetValue("BankIBAN__"), country);
                    item.SetValue("BankKey__", bankIdentifiers[0] + bankIdentifiers[1]); // BankCode + BranchCode
                    item.SetValue("BankAccountNumber__", bankIdentifiers[2]);
                    item.SetValue("ControlKey__", bankIdentifiers[3]);
                }
            }
        }
        return errorCount;
    },
    ValidateAll: function () {
        const bankDetailsTable = Data.GetTable("CompanyBankAccountsTable__");
        for (let i = 0; i < bankDetailsTable.GetItemCount(); i++) {
            IBAN.Validate(bankDetailsTable.GetItem(i));
        }
    }
};
const Layout = {
    General: function () {
        Controls.CompanyOfficersTable__.SetWidth("100%");
        Controls.CompanyOfficersTable__.SetExtendableColumn("Email__");
        Controls.CompanyBankAccountsTable__.SetWidth("100%");
        Controls.CompanyBankAccountsTable__.SetExtendableColumn("BankIBAN__");
        Controls.DocumentsTable__.SetWidth("100%");
        Controls.DocumentsTable__.SetExtendableColumn("DocumentFile__");
        Controls.Workflow__.SetWidth("100%");
        Controls.Workflow__.SetExtendableColumn("ApproverComment__");
        Controls.Workflow__.HideTableRowDelete(false);
        Controls.Workflow__.HideTableRowAdd(false);
        const headerParameters = Controls.form_header.GetActionControl("parameters");
        if (headerParameters && !ProcessInstance.isDesignActive) {
            headerParameters.Hide();
        }
        //Hide deleted fields
        if (Controls.YearsInBusiness__) {
            Controls.YearsInBusiness__.Hide();
        }
        if (Controls.RefreshCompliance__) {
            Controls.RefreshCompliance__.Hide();
        }
        Controls.Save__.OnClick = function () {
            Lib.VendorRegistration.DocumentsTable.AttachDocumentsToRecord();
            Variable.SetValueAsString("IsProcessModifiedByUser", "true");
            ProcessInstance.Save("save");
            return false;
        };
        Controls.Save.OnClick = Controls.Save__.OnClick;
        //WORKFLOW LAYOUT
        //Controls.Workflow__.SetRowToolsHidden(true);
        if (!ProcessInstance.isDebugActive) {
            Controls.Workflow__.Action__.Hide();
            Controls.Workflow__.Workflow_index__.Hide();
        }
        const nbSteps = Lib.VendorRegistration.Workflow.Controller.GetNbContributors() - 1;
        const currentRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex());
        const previousRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex() - 1);
        // Hides buttons under certain conditions
        Controls.Approve.Hide(ProcessInstance.isReadOnly || Lib.VendorRegistration.Workflow.Controller.GetContributorIndex() !== nbSteps);
        Controls.SubmitToNext.Hide(ProcessInstance.isReadOnly || Lib.VendorRegistration.Workflow.Controller.GetContributorIndex() === nbSteps);
        Controls.BackToPrevious.Hide(ProcessInstance.isReadOnly || (previousRole !== Lib.VendorRegistration.Workflow.roleApprover && previousRole !== Lib.VendorRegistration.Workflow.roleLegalReviewer));
        Controls.Reject.Hide(ProcessInstance.isReadOnly || currentRole === Lib.VendorRegistration.Workflow.roleVendor);
        Controls.Comment__.SetPlaceholder(g_commentPlaceHolder);
        setOfficerRoles();
        Layout.AdaptCompanyOfficersTableAvailableActions();
        Layout.AdaptBankAccountsTableAvailableActions();
        Layout.AdaptLookupPanel();
        Controls.BanksActionsPane.Hide(true);
        Controls.IBANVerification__.Hide(true);
        Controls.GenerateSISIDInvitation__.Hide(true);
        Lib.VendorRegistration.DocumentsTable.Init();
        HighlightHandling.ResetAllTooltips();
    },
    ForVendor: function () {
        Process.SetHelpId(2571);
        const contactLinkBtn = Controls.form_header.GetActionControl("contactLink");
        const logoutBtn = Controls.form_header.GetActionControl("logout");
        const homeBtn = Controls.form_header.GetActionControl("home");
        if (contactLinkBtn) {
            contactLinkBtn.Hide();
        }
        if (logoutBtn) {
            logoutBtn.Hide();
        }
        if (homeBtn) {
            homeBtn.Hide();
        }
        Controls.CompanyCode__.SetRequired(false);
        Controls.VendorNumber__.SetRequired(false);
        Controls.ERPPane.Hide(true);
        Controls.WorkflowPane.Hide(true);
        Controls.ProcessStatus__.Hide(true);
        Controls.Save.Hide(true);
        Controls.Approve.Hide(true);
        Controls.Close.Hide(true);
        Controls.Reject.Hide(true);
        Controls.SubmitToNext.Hide(true);
        Controls.BackToPrevious.Hide(true);
        Controls.DocumentsTable__.EndOfValidity__.Hide(true);
        Controls.ManualLinkMode__.Hide(true);
        Controls.VendorCategory__.Hide(true);
        Controls.DefaultItemCategory__.Hide(true);
        Controls.LookupBtn__.Hide(true);
        Controls.RatingsPane.Hide();
        Controls.BanksActionsPane.Hide(true);
        Controls.CompliancePane.Hide(true);
        if (DnBObject.isDnBConfigured && DnBObject.options.isVendorLookupEnabled) {
            Controls.LookupCountry__.SetRequired(true);
            Controls.NationalID__.SetRequired(true);
        }
        const backToComment = Data.GetValue("Comment__");
        if (backToComment) {
            if (ProcessInstance.state === 400) {
                // Reject - set banner color to red
                const css = "{ " +
                    "border: solid #E42518; " +
                    "border-width: 0 0 0 5px; " +
                    "border-radius: 5px;" +
                    "padding-left: 15px; " +
                    "padding-top: 10px; " +
                    "padding-bottom: 10px; " +
                    "margin-left: -10px; " +
                    "background-color:#fce9e7; }";
                Controls.CommentContent__.SetCSS(css);
            }
            Controls.CommentContent__.SetHTML(backToComment.replace(/\n/g, "<br/>"));
            Controls.CommentPane.Hide(false);
        }
        const defaultItemCategoryID__ = Data.GetValue("DefaultItemCategoryID__");
        if (defaultItemCategoryID__) {
            // Mandatory when the field defaultItemCategory is filled
            const companyCode = Variable.GetValueAsString("companyCode");
            Controls.CompanyCode__.SetText(companyCode);
            Lib.VendorRegistration.Client.FillDefaultItemCategory(defaultItemCategoryID__, Variable.GetValueAsString("companyCode"));
        }
    },
    HasCompanyCodeFromPreviousProcess: function () {
        //If Company Code is filled, VR comes from previous process (e.g. Procurement) and CC is prefilled => no need to retrieve extvars
        return !Sys.Helpers.IsEmpty(Controls.CompanyCode__.GetValue());
    },
    AdaptCompanyCodeAndVendorNumberLayout: function () {
        // CompanyCode is mandatory for the last approver and when global option VendorManagementCompanyCodeGlobalSetting is set to OneCompanyCode
        Controls.CompanyCode__.SetRequired(IsCompanyCodeRequired());
        // Do not change the company code if the process is an internal clone request
        if (!Lib.VendorRegistration.InternalRequest.IsInternalCloneRequest()) {
            if (!Layout.HasCompanyCodeFromPreviousProcess()) {
                const companyCode = Variable.GetValueAsString("companyCode");
                if (companyCode !== "" && companyCode !== null) {
                    Controls.CompanyCode__.SetValue(companyCode);
                }
            }
            else {
                //Aligning external and internal variables
                Variable.SetValueAsString("companyCode", Controls.CompanyCode__.GetValue());
            }
        }
        // erp fields are not visible when ERP connection is activated for registration
        if (Parameters.IsERPIntegrationParameterEnabled() &&
            Data.GetValue("RegistrationType__") === registrationType.registration) {
            Controls.VendorNumber__.Hide(true);
            Controls.VendorNumber__.SetRequired(false);
        }
        else {
            Controls.VendorNumber__.Hide(false);
            Controls.VendorNumber__.SetRequired(IsERPFieldsMandatory());
        }
        // erp fields cannot be modified if they already have a value
        if (Data.GetValue("RegistrationType__") === registrationType.update) {
            Controls.CompanyCode__.SetReadOnly(true);
            Controls.VendorNumber__.SetReadOnly(Controls.VendorNumber__.GetValue() && Controls.VendorNumber__.GetValue() !== "");
        }
    },
    SetReadOnlyFieldsForCloneRequest: function () {
        Controls.Banks.Hide(true);
        const officerItems = {
            Role__: "",
            FirstName__: "",
            LastName__: "",
            Email__: "",
            CompanyOfficerID__: null,
        };
        const headerFields = [...Object.keys(Lib.VendorRegistration.Common.HeaderFields), "VendorNumber__", "ComboState__"];
        headerFields.forEach((field) => {
            Controls[field].SetReadOnly(true);
        });
        const tableName = "CompanyOfficersTable__";
        const table = Data.GetTable(tableName);
        for (let i = 0; i < table.GetItemCount(); i++) {
            const row = Controls[tableName].GetRow(i);
            Object.keys(officerItems).forEach((field) => {
                row[field].SetReadOnly(true);
            });
        }
        ;
    },
    SetBothApproveButtonsLabels: function (label) {
        Controls.Approve.SetLabel(label);
        Controls.SubmitToNext.SetLabel(label);
    },
    GetLabelFromIntegrationMode: function (isIntegrationERPDisabledManually, isAutoApprove) {
        if (isIntegrationERPDisabledManually && !isAutoApprove) {
            return "_Manually archive";
        }
        if (isIntegrationERPDisabledManually && isAutoApprove) {
            return "_Auto approve and manually archive";
        }
        if (!isIntegrationERPDisabledManually && isAutoApprove) {
            return "_Auto approve and integrate vendor";
        }
        return "_Integrate vendor";
    },
    SetApproveButtonLabelForFinalStep: function (isAutoApprove) {
        if (Parameters.IsERPIntegrationWizardParameterEnabled()) {
            const isIntegrationERPDisabledManually = Variable.GetValueAsString("EnableVendorERPConnection") === "0";
            Layout.SetBothApproveButtonsLabels(Layout.GetLabelFromIntegrationMode(isIntegrationERPDisabledManually, isAutoApprove));
        }
        else if (isAutoApprove) {
            Layout.SetBothApproveButtonsLabels("_Auto approve");
        }
    },
    SetApproveButtonLabelForApproval: function (isAutoApprove) {
        if (isAutoApprove) {
            Layout.SetBothApproveButtonsLabels("_Auto approve");
        }
    },
    SetApproveButtonLabel: function () {
        const isFinalStep = Lib.VendorRegistration.Workflow.WorkflowControllerHelper.GetNextUserWithoutAutoApprovers() === null;
        const isAutoApprove = Lib.VendorRegistration.Workflow.WorkflowControllerHelper.GetHowManyTimesUserIsInWorkflowStraight() > 1;
        if (isFinalStep) {
            Layout.SetApproveButtonLabelForFinalStep(isAutoApprove);
        }
        else {
            Layout.SetApproveButtonLabelForApproval(isAutoApprove);
        }
    },
    OnManualLinkModeValueChange: function () {
        Variable.SetValueAsString("EnableVendorERPConnection", Controls.ManualLinkMode__.IsChecked() ? "1" : "0");
        Layout.AdaptCompanyCodeAndVendorNumberLayout();
        Layout.SetApproveButtonLabel();
        const type = Data.GetValue("RegistrationType__");
        if (type === registrationType.registration) {
            const vendorNumber = Controls.VendorNumber__.GetValue();
            if (vendorNumber) {
                Controls.VendorNumber__.SetValue("");
            }
        }
    },
    InitManualLinkModeCheckBox: function () {
        Controls.ManualLinkMode__.Check(Parameters.IsERPIntegrationParameterEnabled());
        Controls.ManualLinkMode__.OnChange = Layout.OnManualLinkModeValueChange;
        Controls.ManualLinkMode__.Hide(!Parameters.IsERPIntegrationWizardParameterEnabled() ||
            ProcessInstance.isReadOnly ||
            !IsERPFieldsMandatory());
    },
    ForManagement: function () {
        var _a;
        Process.SetHelpId(2562);
        Controls.Steps.Hide(true);
        Controls.Navigation_Pane.Hide(true);
        Layout.AdaptCompanyCodeAndVendorNumberLayout();
        Controls.Workflow__.HideTableRowMenu(true);
        Controls.Workflow__.SetReadOnly(false);
        Controls.Workflow__.User__.SetBrowsable(false);
        Controls.Workflow__.User__.SetReadOnly(true);
        Controls.Workflow__.Date__.SetReadOnly(true);
        Controls.Workflow__.Role__.SetReadOnly(true);
        Controls.Workflow__.Workflow_index__.SetReadOnly(true);
        Controls.Workflow__.Action__.SetReadOnly(true);
        Controls.Workflow__.Marker__.SetReadOnly(true);
        Controls.BackToVendor.Hide(ProcessInstance.isReadOnly);
        if (Lib.VendorRegistration.InternalRequest.IsInternalRequest()) {
            Controls.GlobalQuestionnairePane.Hide();
            if (Lib.VendorRegistration.Workflow.Controller.GetContributorIndex() === 0) {
                Controls.BackToVendor.Hide();
            }
            else {
                Controls.BackToVendor.SetLabel(Language.Translate("_BackToRequester"));
            }
        }
        else {
            if (Lib.VendorRegistration.Workflow.Controller.GetRoleAt(0) === "_Requester" && Lib.VendorRegistration.Workflow.Controller.GetRoleAt(1) !== "_Vendor") {
                Controls.BackToVendor.SetLabel(Language.Translate("_BackToRequester"));
            }
            //Questionnaires
            UnserializeQuestionnaire(Controls.GlobalQuestionnaire__);
        }
        const vendorIndex = Lib.VendorRegistration.Workflow.Controller.GetRoleSequenceIndex(Lib.VendorRegistration.Workflow.roleVendor);
        if (vendorIndex + 1 === Lib.VendorRegistration.Workflow.Controller.GetContributorIndex()) {
            Controls.BackToPrevious.Hide(true);
        }
        const currentRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex());
        const hideQuestionnaireResults = Lib.VendorRegistration.InternalRequest.IsInternalRequest() ||
            (currentRole !== Lib.VendorRegistration.Workflow.roleRequester && currentRole !== Lib.VendorRegistration.Workflow.roleApprover);
        Controls.GlobalQuestionnaireScoreRecap__.Hide(hideQuestionnaireResults);
        Controls.GlobalQuestionnaireResultTable__.Hide(hideQuestionnaireResults);
        if (Variable.GetValueAsString("VendorCategoryFeatureActivated") === "1") {
            Controls.VendorCategory__.Hide(false);
            Controls.VendorCategory__.SetRequired(currentRole === Lib.VendorRegistration.Workflow.roleRequester);
            Controls.VendorCategory__.SetReadOnly(currentRole !== Lib.VendorRegistration.Workflow.roleRequester);
        }
        else {
            Controls.VendorCategory__.Hide(true);
            Controls.VendorCategory__.SetRequired(false);
            Controls.VendorCategory__.SetReadOnly(true);
        }
        if (Controls.CompanyCode__.GetValue() !== null) {
            const currentContributor = Lib.VendorRegistration.Workflow.Controller.GetCurrentContributor();
            if (currentContributor !== null && currentContributor.role === Lib.VendorRegistration.Workflow.roleApprover) {
                Controls.CompanyCode__.SetReadOnly(false);
                Controls.CompanyCode__.SetHelpData("_CompanyCode_Help", "2537");
            }
            else {
                const approvers = Lib.VendorRegistration.Workflow.Controller.GetContributorsByRole("approver");
                const isRO = (approvers === null || approvers === void 0 ? void 0 : approvers.filter(e => e.login === User.loginId || User.IsMemberOf(e.login)).length) <= 0;
                Controls.CompanyCode__.SetReadOnly(isRO);
                Controls.CompanyCode__.SetHelpData(isRO ? "" : "_CompanyCode_Help", isRO ? "" : "2537");
            }
            Controls.DefaultItemCategory__.SetFilter(`(CompanyCode__=${Data.GetValue("CompanyCode__")})`);
        }
        else {
            Controls.CompanyCode__.SetReadOnly(false);
            Controls.CompanyCode__.SetHelpData("_CompanyCode_Help", "2537");
            Controls.DefaultItemCategory__.SetFilter("(CompanyCode__=)");
        }
        const defaultItemCategoryID__ = Data.GetValue("DefaultItemCategoryID__");
        if (defaultItemCategoryID__) {
            Lib.VendorRegistration.Client.FillDefaultItemCategory(defaultItemCategoryID__, Data.GetValue("CompanyCode__"));
        }
        DiversityClassificationManagement.HidePanelIfNeeded();
        DiversityClassificationManagement.PrefillDocumentsExpirationDates();
        Layout.InitManualLinkModeCheckBox();
        Layout.AdaptWorkflowTableAvailableActions();
        Layout.SetApproveButtonLabel();
        if (Lib.VendorRegistration.InternalRequest.IsInternalCloneRequest()) {
            Layout.SetReadOnlyFieldsForCloneRequest();
        }
        Controls.DefaultItemCategory__.SetReadOnly(currentRole !== Lib.VendorRegistration.Workflow.roleRequester);
        // Init Gauge for approver and legalReviewer
        if (Lib.VendorRegistration.InternalRequest.IsInternalRequest() ||
            (currentRole === Lib.VendorRegistration.Workflow.roleApprover || currentRole === Lib.VendorRegistration.Workflow.roleLegalReviewer)) {
            Controls.RatingsPane.Hide(false);
            Lib.VM.ScoringProviders.Manager.Init(Controls.CreditScore_GaugeContainer__);
            const companyData = {
                companyName: Controls.Company__.GetValue(),
                countryCode: (_a = Controls.Country__.GetValue()) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
                identifier: Controls.VendorRegistrationDUNSNumber__.GetValue(),
                ecovadisIntegrationId: Controls.Ecovadis_Integration_ID__.GetValue()
            };
            const controlsList = {
                scoringPanel: Controls.RatingsPane,
                alertsCtrl: null,
                ShowAlertsCtrl: null,
                VendorDUNSNumberCtrl: Controls.VendorRegistrationDUNSNumber__,
                VendorCompanyCodeCtrl: Controls.CompanyCode__,
                VendorNumberCtrl: Controls.VendorNumber__,
                EcovadisIntegrationID: Controls.Ecovadis_Integration_ID__
            };
            Lib.VM.ScoringProviders.Manager.OnStart(companyData, controlsList);
        }
    },
    AdaptCompanyOfficersTableAvailableActions: function () {
        Controls.CompanyOfficersTable__.HideTableRowDelete(Controls.CompanyOfficersTable__.GetItemCount() === 1);
        // Prevent pagination
        if (Data.GetTable("CompanyOfficersTable__").GetItemCount() > (Controls.CompanyOfficersTable__.GetLineCount() - 1)) {
            Data.GetTable("CompanyOfficersTable__").SetItemCount(Controls.CompanyOfficersTable__.GetLineCount() - 1);
        }
        Controls.CompanyOfficersTable__.GetRow(0).Role__.SetReadOnly(true);
        Controls.CompanyOfficersTable__.HideTableRowDeleteForItem(0, true);
    },
    AdaptBankAccountsTableAvailableActions: function () {
        Controls.CompanyBankAccountsTable__.HideTableRowDelete(Controls.CompanyBankAccountsTable__.GetItemCount() === 1);
    },
    AdaptWorkflowTableAvailableActions: function () {
        Controls.Workflow__.OnCheckIfItemDeletable = function (item, idx) {
            const sequenceIndex = Lib.VendorRegistration.Workflow.Controller.GetSequenceIndexAt(idx);
            const contributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(sequenceIndex);
            return contributor.isAdditional;
        };
        Controls.Workflow__.OnDeleteItem = function (item, idx) {
            Controls.Workflow__.DisableLinesAudit(false);
            const sequenceIndex = Lib.VendorRegistration.Workflow.Controller.GetSequenceIndexAt(idx);
            const contributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(sequenceIndex);
            Lib.VendorRegistration.Workflow.Controller.RemoveAdditionalContributor(contributor.contributorId);
        };
        Controls.Workflow__.OnAddItem = function (item, idx) {
            // Remove added item since no all fields are empty
            // New item will be added later by WorkflowController
            item.Remove();
            let sequenceIndex = 1;
            if (idx > 0) {
                sequenceIndex = Lib.VendorRegistration.Workflow.Controller.GetSequenceIndexAt(idx);
            }
            const role = "approver";
            const contributorRole = Lib.VendorRegistration.Workflow.roleApprover;
            const action = "toApprove";
            Lib.VendorRegistration.Workflow.WorkflowControllerHelper.BrowseWorkflowUser("_Approver Information", role)
                .Then(function (user) {
                if (user) {
                    Lib.VendorRegistration.Workflow.WorkflowControllerHelper.AddAdditionalContributor(role, action, contributorRole, user, sequenceIndex);
                }
            });
        };
    },
    AdaptLookupPanel: function () {
        if (!Wizard.hideFirstStep) {
            DnBObject.credentials.user = Variable.GetValueAsString("DnbCredentialUser__");
            DnBObject.credentials.pwd = Variable.GetValueAsString("DnBCredentialPwd__");
            if (DnBObject.credentials.user === "demo") {
                const companies = Sys.Helpers.TryCallFunction("Lib.VM.Customization.LookupCompany.GetDemoCompanies");
                if (Array.isArray(companies) && companies.length > 0) {
                    DnBObject.options.showDemoBanner = true;
                    Controls.DemoDataContent__.FireEvent("displayDemoText", {
                        label: Language.Translate("_DemoDataDescription"),
                        companies: companies
                    });
                    Controls.DemoDataContent__.BindEvent("fillVendorLookup", function (args) {
                        Controls.LookupCountry__.SetValue(companies[args.index].country);
                        Controls.NationalID__.SetValue(companies[args.index].nationalID);
                        Controls.LookupCountry__.OnBlur();
                        EnableLookupButton();
                    });
                }
                Controls.DemoDataPane.Hide(!DnBObject.options.showDemoBanner);
            }
        }
        Wizard.steps[0].hiddenStep = Wizard.hideFirstStep;
        Controls.CompanyLookup.Hide(Wizard.hideFirstStep);
        Controls.LookupCountry__.SetTooltip(Language.Translate("_Info lookupCountry field"));
        Controls.NationalID__.SetTooltip(Language.Translate("_Info NationalID field"));
    },
    AdaptCompanyProfilePane: function () {
        const isIndividual = Lib.VendorRegistration.Common.IsVendorIndividual();
        const isCompanyStructureFeatureActive = Controls.CompanyStructure__.GetAvailableValues().length > 0;
        const isCountryUS = Lib.VendorRegistration.Common.IsCountryUS();
        const availableStates = Controls.ComboState__.GetAvailableValues();
        const isCompanyStructureRequired = (Parameters.IsUSBankCheckEnabled() || FON.IsTINWithOFACCheckEnabled()) && isCountryUS;
        Controls.Company__.Hide(isIndividual);
        Controls.FirstName__.Hide(!isIndividual);
        Controls.LastName__.Hide(!isIndividual);
        Controls.MailSub__.Hide(isIndividual);
        Controls.Mail_State__.Hide(availableStates.length > 0);
        Controls.ComboState__.Hide(availableStates.length === 0);
        Controls.NumberOfEmployees__.Hide(isIndividual);
        // Do not hide the field if it is needed - the table needs to be filled by an admin
        Controls.CompanyStructure__.Hide(!isCompanyStructureFeatureActive && !isCompanyStructureRequired);
        Controls.TaxID__.Hide(isCountryUS);
        Controls.TaxIdentificationNumber__.Hide(!isCountryUS);
        Controls.Company__.SetRequired(!isIndividual);
        Controls.FirstName__.SetRequired(isIndividual);
        Controls.LastName__.SetRequired(isIndividual);
        Controls.CompanyStructure__.SetRequired(isCompanyStructureRequired);
        TaxRegistrationNumber.AdaptLabelAndRequire();
        TaxRegistrationNumber.Validate();
        if (!isIndividual) {
            Data.SetValue("FirstName__", "");
            Data.SetValue("LastName__", "");
        }
        Lib.VendorRegistration.Common.UpdateCompanyName();
    },
    AdaptAddressForBank: function () {
        const availableStates = Controls.ComboStateForBank__.GetAvailableValues();
        const isBankCheckPossible = FON_BankCheck.IsBankCheckPossible();
        const useCompanyAddressForBank = Controls.AddressForBankIsSameAsCompany__.IsChecked();
        const isBankAdressFieldsDisplayed = isBankCheckPossible && !useCompanyAddressForBank;
        Controls.Spacer1__.Hide(!isBankCheckPossible);
        Controls.AddressForBankIsSameAsCompany__.Hide(!isBankCheckPossible);
        if (!isBankCheckPossible) {
            Controls.AddressForBankIsSameAsCompany__.Check(true);
        }
        Controls.SubForBank__.Hide(!isBankAdressFieldsDisplayed);
        Controls.StreetForBank__.Hide(!isBankAdressFieldsDisplayed);
        Controls.ZipCodeForBank__.Hide(!isBankAdressFieldsDisplayed);
        Controls.CityForBank__.Hide(!isBankAdressFieldsDisplayed);
        Controls.CountryForBank__.Hide(!isBankAdressFieldsDisplayed);
        Controls.StreetForBank__.SetRequired(isBankAdressFieldsDisplayed);
        Controls.ZipCodeForBank__.SetRequired(isBankAdressFieldsDisplayed);
        Controls.CityForBank__.SetRequired(isBankAdressFieldsDisplayed);
        Controls.CountryForBank__.SetRequired(isBankAdressFieldsDisplayed);
        Controls.StateForBank__.Hide(!isBankAdressFieldsDisplayed || availableStates.length > 0);
        Controls.ComboStateForBank__.Hide(!isBankAdressFieldsDisplayed || availableStates.length === 0);
    },
    /**
     * Adapt the layout of the whole form in case this process was created from an inquiry
     * The presence of the SDADocTypeSource is used to determine if the document pane and the preview should be visible
     * In that case, the form should take the full screen width
     */
    AdaptForInquiryRequest: function () {
        if (Variable.GetValueAsString("SDADocTypeSource") === "Supplier information update") {
            // Display the document pane and the preview
            Controls.DocumentsPanel.Hide(false);
            Controls.form_content_right.Hide(false);
            Controls.PreviewPanel.Hide(false);
            // Full screen mode
            ProcessInstance.SetFormWidth();
            Controls.form_content_left.SetSize(60);
        }
    },
    InitUNSPSC: function () {
        async function init(enabled) {
            await Lib.P2P.UNSPSC.CheckUNSPSCExistsInUserLanguage();
            const isInitiallyReadonly = ProcessInstance.isReadOnly || !isManualAddEnabled;
            Lib.P2P.UNSPSC.Client.InitUNSPSCBrowseAndTable(enabled, Controls.UNSPSC__, Controls.UNSPSCList__, isInitiallyReadonly);
            const isDunsInsertEnabled = !User.isVendor && enabled && DnBObject.options.shouldInsertUNSPSCFromDNB;
            Controls.RetrieveUNSPSCFromDNB__.Hide(!isDunsInsertEnabled);
            if (!isInitiallyReadonly) {
                // If UNSPSC is enabled and the D&B UNSPSC import setting is disabled
                // We assume that any created vendor has UNSPSC manually set so if enabled later, D&B should not override them
                // If UNSPSC is disabled
                // We assume that the client could enable the feature later and want to synchronize all his existing vendors
                if (IsUnModifiedNewRegistration()) {
                    if (!enabled) {
                        Controls.RetrieveUNSPSCFromDNB__.Check(true);
                    }
                    else if (User.isVendor || !DnBObject.options.shouldInsertUNSPSCFromDNB) {
                        Controls.RetrieveUNSPSCFromDNB__.Check(false);
                    }
                }
                if (isDunsInsertEnabled) {
                    Lib.P2P.UNSPSC.Client.InitUNSPSCThirdPartySynchronization(Controls.RetrieveUNSPSCFromDNB__, !User.isVendor);
                }
            }
            Wizard.RefreshStepButtons();
            if (enabled && Controls.UNSPSCList__.GetItemCount() > 0) {
                Lib.P2P.UNSPSC.Client.FillTableWithUNSPSCTitleAndDescription();
            }
        }
        const isUNSPSCEnabled = User.isVendor
            ? Variable.GetValueAsString("EnableVendorUNSPSC") === "true"
            : Lib.P2P.UNSPSC.IsEnabled();
        const isManualAddEnabled = User.isVendor
            ? Variable.GetValueAsString("EnableManualUNSPSCAdd") === "true"
            : true;
        // On portal, visibility is handled by the stepper
        Controls.UNSPSCPane.Hide(User.isVendor || !isUNSPSCEnabled);
        steps.unspsc.hiddenStep = !(isUNSPSCEnabled && isManualAddEnabled);
        void init(isUNSPSCEnabled && isManualAddEnabled);
    }
};
const SisID = {
    messages: [],
    hasError: false,
    snackbarMessage: "",
    snackbarStatus: "",
    snackbarCounter: 0,
    Init: function () {
        SisID.snackbarMessage = "";
        SisID.snackbarStatus = "";
        SisID.snackbarCounter = 0;
        SisID.messages = Sys.Helpers.GetSerializedObjectFromVariable("SisidIBANResults", []);
        SisID.RefreshAll();
        if (Data.GetActionName() === "recheckIban" && SisID.snackbarMessage !== "") {
            Popup.Snackbar({
                message: Language.Translate(SisID.snackbarMessage, true, SisID.snackbarCounter),
                status: SisID.snackbarStatus ? SisID.snackbarStatus : "info"
            });
            SisID.snackbarMessage = "";
            SisID.snackbarStatus = "";
            SisID.snackbarCounter = 0;
        }
        if (Data.GetActionName() === "sendSisIdInvitationEmail") {
            const msgKey = Lib.VendorRegistration.InternalRequest.IsInternalRequest() ?
                "_SisIdInvitationEmailSentToVendorInternal" : "_SisIdInvitationEmailSentToVendor";
            Popup.Snackbar({
                message: Language.Translate(msgKey, false),
                status: "success"
            });
        }
    },
    IsCompanyUnknown: function () {
        let i = 0;
        let isUnknown = false;
        const IBANResults = SisID.messages;
        while (!isUnknown && i < IBANResults.length) {
            const result = IBANResults[i];
            if (Array.isArray(result.messageCode) && result.messageCode.length > 0) {
                isUnknown = !!result.messageCode.find((code) => code === Sys.Helpers.Sis_ID.ErrorReasonSisId.CompanyNotEnrolled);
            }
            i++;
        }
        return isUnknown;
    },
    IsEnabled: function () {
        // Only available for approvers when option activated
        const currentRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex());
        return Parameters.IsSisIDEnabled() && currentRole === Lib.VendorRegistration.Workflow.roleApprover;
    },
    GetMessage: function (bankReference, score) {
        const IBANMessages = [];
        if (bankReference === null) {
            return "SisID: " + Language.Translate("_SisIdErrorOnIBAN");
        }
        for (let SisIDmessage of SisID.messages) {
            if ((SisIDmessage.IBAN === bankReference || SisIDmessage.BBAN === bankReference) && SisIDmessage.score === score) {
                const messageCode = SisIDmessage.messageCode;
                if (messageCode) {
                    const messageCodeValue = SisIDmessage.message;
                    for (let j = 0; j < messageCode.length; j++) {
                        IBANMessages.push(`SisID: ${messageCodeValue["reason.code." + messageCode[j]]}`);
                    }
                    return IBANMessages.join("\n");
                }
            }
        }
        return "";
    },
    GetMessageFromIBANOrBBAN: function (iban, bban, score) {
        if (iban) {
            return SisID.GetMessage(iban, score);
        }
        else if (bban) {
            return SisID.GetMessage(bban, score);
        }
        return SisID.GetMessage(null, score);
    },
    Refresh: function (row) {
        if (SisID.IsEnabled() && row && !User.isVendor) {
            const ibanControl = row.BankIBAN__;
            const bbanControl = row.BankAccountNumber__;
            const ibanScoreControl = row.BankIBANScore__;
            const score = row.BankIBANScore__.GetValue();
            if (score || score === 0) {
                /**
                 * Display iban verification button only if form is not in final state and bank detail has a SisID result in warning or error
                 * and keep it if it was already displayed
                 */
                BankActionsButtonsAndPaneVisibility((score >= 90 || !SisID.IsEnabled()) && !Controls.IBANVerification__.IsVisible());
                const tooltipFieldName = "BankIBANScore__";
                const item = row.GetItem();
                item.SetInfo(tooltipFieldName, "");
                item.SetWarning(tooltipFieldName, "");
                item.SetError(tooltipFieldName, "");
                ibanScoreControl.RemoveStyle(highlightStyles.success);
                ibanScoreControl.RemoveStyle(highlightStyles.warning);
                ibanScoreControl.RemoveStyle(highlightStyles.error);
                let message;
                message = SisID.GetMessageFromIBANOrBBAN(ibanControl.GetValue(), bbanControl.GetValue(), score);
                if (score <= Sys.Helpers.Sis_ID.defaultScoreLimits.error && !SisID.ShouldTreatSisidErrorAsWarning()) {
                    item.SetError(tooltipFieldName, message);
                    ibanScoreControl.AddStyle(highlightStyles.error);
                    SisID.hasError = true;
                    if (SisID.snackbarStatus !== "error") {
                        SisID.snackbarCounter = 0;
                    }
                    SisID.snackbarMessage = "_SisIDSnackbarError";
                    SisID.snackbarStatus = "error";
                    SisID.snackbarCounter++;
                }
                else if (score <= Sys.Helpers.Sis_ID.defaultScoreLimits.warning
                    || (score <= Sys.Helpers.Sis_ID.defaultScoreLimits.error && SisID.ShouldTreatSisidErrorAsWarning())) {
                    item.SetWarning(tooltipFieldName, message);
                    ibanScoreControl.AddStyle(highlightStyles.warning);
                    // Set snackbar in warning only if not already in error
                    if (SisID.snackbarStatus !== "error") {
                        if (SisID.snackbarStatus !== "warning") {
                            SisID.snackbarCounter = 0;
                        }
                        SisID.snackbarMessage = "_SisIDSnackbarWarning";
                        SisID.snackbarStatus = "warning";
                        SisID.snackbarCounter++;
                    }
                }
                else {
                    item.SetInfo(tooltipFieldName, message);
                    ibanScoreControl.AddStyle(highlightStyles.success);
                    // Set snackbar in success only if not already in warning or error
                    if (SisID.snackbarStatus !== "error" && SisID.snackbarStatus !== "warning") {
                        if (SisID.snackbarStatus !== "success") {
                            SisID.snackbarCounter = 0;
                        }
                        SisID.snackbarMessage = "_SisIDSnackbarSuccess";
                        SisID.snackbarStatus = "success";
                        SisID.snackbarCounter++;
                    }
                }
            }
            else {
                // Display iban verification button only if form is not in final state and SisID option is enabled, and keep it if it was already displayed
                BankActionsButtonsAndPaneVisibility(!SisID.IsEnabled() && !Controls.IBANVerification__.IsVisible());
            }
        }
    },
    RefreshAll: function () {
        if (!User.isVendor) {
            const bankDetailsControl = Controls.CompanyBankAccountsTable__;
            SisID.hasError = false;
            const lineCount = bankDetailsControl.GetLineCount(true);
            for (let i = 0; i < lineCount; i++) {
                const row = bankDetailsControl.GetRow(i);
                SisID.Refresh(row);
            }
        }
    },
    /**
     * Threats all Sis id error set on IBAN Fields as warning, removing the sid is error and adding it as a warning.
     * Keep all other errors.
     */
    SetAllSisidErrorsAsWarnings: function () {
        const bankDetailsControl = Controls.CompanyBankAccountsTable__;
        for (let i = 0; i < bankDetailsControl.GetLineCount(); i++) {
            const row = bankDetailsControl.GetRow(i);
            if (row) {
                const ibanControl = row.BankIBAN__;
                const bbanControl = row.BankAccountNumber__;
                const ibanScoreControl = row.BankIBANScore__;
                const score = row.BankIBANScore__.GetValue();
                if (score || score === 0) {
                    let message;
                    message = SisID.GetMessageFromIBANOrBBAN(ibanControl.GetValue(), bbanControl.GetValue(), score);
                    if (score <= Sys.Helpers.Sis_ID.defaultScoreLimits.error) {
                        if (SisID.SetSisidErrorAsWarning(ibanScoreControl.GetName(), message, row.GetItem())) {
                            ibanScoreControl.RemoveStyle(highlightStyles.error);
                        }
                        ibanScoreControl.AddStyle(highlightStyles.warning);
                    }
                }
            }
        }
        SisID.hasError = false;
    },
    /**
     * remove a string from another
     * @param message the string to clean
     * @param sisIdMessage the string to remove
     */
    RemoveSisIdMessage: function (message, sisIdMessage) {
        if (!message || message === sisIdMessage) {
            return "";
        }
        const regex = new RegExp(`(${sisIdMessage}\\n)|(\\n${sisIdMessage})`, "gm");
        return message.replace(regex, "");
    },
    SetSisidErrorAsWarning: function (fieldName, sisIdMessage, item) {
        let errorMessage = SisID.RemoveSisIdMessage(item.GetError(fieldName), sisIdMessage);
        if (errorMessage === Language.Translate("_One or more vendors with the same informations are already registered")) {
            sisIdMessage = `${errorMessage}\n${sisIdMessage}`;
            errorMessage = "";
        }
        item.SetError(fieldName, errorMessage);
        AddWarning(fieldName, sisIdMessage, item);
        return !errorMessage;
    },
    ShouldTreatSisidErrorAsWarning: function () {
        const SisidErrorAsWarningValue = Variable.GetValueAsString("SisidErrorAsWarning");
        return SisidErrorAsWarningValue !== null && ((SisidErrorAsWarningValue.toLowerCase() === "true") || SisidErrorAsWarningValue === "1");
    },
    EnableSisidErrorAsWarning: function (enable) {
        Variable.SetValueAsString("SisidErrorAsWarning", enable);
    },
    ResetIbanStatus: function (ibanItem, row) {
        if (row && ibanItem && !User.isVendor) {
            const ibanControl = row.BankIBANScore__;
            ibanControl.RemoveStyle(highlightStyles.success);
            ibanControl.RemoveStyle(highlightStyles.warning);
            ibanControl.RemoveStyle(highlightStyles.error);
        }
    },
    async HandleInvitationErrors(result) {
        const GetMessageAlert = async () => {
            const errorType = result === null || result === void 0 ? void 0 : result.errorType;
            if (errorType === Sys.Helpers.Sis_ID.InvitationErrors.CompanyIdIsYours) {
                const taxRegistrationNumber = await TaxRegistrationNumber.GetTaxRegistrationNumberValue();
                return {
                    isError: false,
                    message: ["_Bank details checker Invitation with vendor {0} already belong to this company", taxRegistrationNumber]
                };
            }
            let isError = false;
            let messageAlert = null;
            switch (result === null || result === void 0 ? void 0 : result.errorType) {
                case Sys.Helpers.Sis_ID.InvitationErrors.InvitationAlreadyExisting:
                    messageAlert = "_Bank details checker Invitation already generated";
                    break;
                case Sys.Helpers.Sis_ID.InvitationErrors.InvitationCodeValidationFailure:
                    messageAlert = [
                        "_Bank details checker Invalid invitation data: check '{0}' field and '{1}' field",
                        Language.Translate(Controls.Country__.GetLabel(), false),
                        Language.Translate(TaxRegistrationNumber.GetTaxRegistrationNumberLabel(), false)
                    ];
                    break;
                case Sys.Helpers.Sis_ID.InvitationErrors.Forbidden403:
                    isError = true;
                    messageAlert = "_Bank details checker wrong credentials";
                    break;
                case Sys.Helpers.Sis_ID.InvitationErrors.LinkNotGenerated:
                    isError = true;
                    messageAlert = "_Bank details checker Invitation link not generated";
                    break;
                case Sys.Helpers.Sis_ID.InvitationErrors.UnknownErrorWithMessage:
                case Sys.Helpers.Sis_ID.InvitationErrors.EODErrorWithMessage:
                    isError = true;
                    messageAlert = ["_Bank details checker Invitation generation error: {0}", result.message];
                    break;
                default: //Sys.Helpers.Sis_ID.InvitationErrors.UnknownError
                    isError = true;
                    messageAlert = "_Bank details checker Invitation generation error";
                    break;
            }
            return {
                isError: isError,
                message: messageAlert
            };
        };
        const alert = await GetMessageAlert();
        Popup.Alert(alert.message, false, null, alert.isError ? "_Error" : "_Warning");
    },
    AddNewInvitationMessage(result) {
        if (!result || !(result === null || result === void 0 ? void 0 : result.code) || !(result === null || result === void 0 ? void 0 : result.url)) {
            const error = {
                errorType: Sys.Helpers.Sis_ID.InvitationErrors.LinkNotGenerated
            };
            throw error;
        }
        if (!Lib.VendorRegistration.InternalRequest.IsInternalRequest()) {
            const msg = Language.Translate("_Bank details checker Generated link {0} to enroll vendor", true, result.url);
            Controls.ConversationUI__.AddItem({ Message: msg }, { ignoreIfExists: false });
        }
        Variable.SetValueAsString("BankDetailsCheckerInvitation", JSON.stringify(result));
        Lib.VendorRegistration.DocumentsTable.AttachDocumentsToRecord();
        ProcessInstance.Approve("sendSisIdInvitationEmail");
    },
    GetGenerateInvitationOptions(companyId, country, userLanguage) {
        const options = {
            clientId: Parameters.GetSisIDLogin(),
            clientSecret: Parameters.GetSisIDPassword(),
            companyId: companyId,
            country: country,
            responseLanguage: userLanguage
        };
        const customUrl = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Common.GetSisIDUrl");
        if (customUrl) {
            options.sisIdUrlBase = customUrl;
        }
        return options;
    }
};
const FON_BankCheck = {
    messages: [],
    hasError: false,
    snackbarMessage: "",
    snackbarStatus: "",
    snackbarCounter: 0,
    Init: function () {
        FON_BankCheck.snackbarMessage = "";
        FON_BankCheck.snackbarStatus = "";
        FON_BankCheck.snackbarCounter = 0;
        FON_BankCheck.messages = Sys.Helpers.GetSerializedObjectFromVariable("FONBankCheckResults", []);
        FON_BankCheck.RefreshAll();
        if (Data.GetActionName() === "recheckIban" && FON_BankCheck.snackbarMessage !== "") {
            Popup.Snackbar({
                message: Language.Translate(FON_BankCheck.snackbarMessage, true, FON_BankCheck.snackbarCounter),
                status: FON_BankCheck.snackbarStatus ? FON_BankCheck.snackbarStatus : "info"
            });
            FON_BankCheck.snackbarMessage = "";
            FON_BankCheck.snackbarStatus = "";
            FON_BankCheck.snackbarCounter = 0;
        }
        FON_BankCheck.InitBankCheckFieldsOnChange();
    },
    IsEnabled: function () {
        // Only available for approvers when option activated
        const currentRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex());
        return Parameters.IsUSBankCheckEnabled() && currentRole === Lib.VendorRegistration.Workflow.roleApprover;
    },
    IsBankCheckPossible: function () {
        return Lib.VendorRegistration.Common.IsCountryUS() && Lib.VendorRegistration.Common.HasUSBankAccount();
    },
    GetBankVerificationResult: function (bankAccountNumber, bankRoutingNumber, score) {
        if (score || score === 0) {
            for (const bankVerificationResult of FON_BankCheck.messages) {
                if (bankVerificationResult.BBRN === (bankRoutingNumber || "") &&
                    bankVerificationResult.BBAN === (bankAccountNumber || "") &&
                    bankVerificationResult.score.toString() === score.toString()) {
                    return bankVerificationResult;
                }
            }
        }
        return null;
    },
    GetMessage: function (bankVerificationResult) {
        let returnMessage = "FON: " + bankVerificationResult.status;
        if (bankVerificationResult.details && bankVerificationResult.status &&
            !Lib.VM.FON.IsBankDetailStatusSuccess(bankVerificationResult.status)) {
            returnMessage += " - " + bankVerificationResult.details;
        }
        return returnMessage;
    },
    Refresh: function (row) {
        if (FON_BankCheck.IsEnabled() && row && !User.isVendor) {
            const item = row.GetItem();
            if (item.GetValue("BankCountry__") !== "US" || item.IsNullOrEmpty("BankAccountNumber__") || item.IsNullOrEmpty("RoutingCode__")) {
                Log.Info("Skipping row - non US or empty bank item");
                return;
            }
            const bbanControl = row.BankAccountNumber__;
            const bbrnControl = row.RoutingCode__;
            const ibanScoreControl = row.BankIBANScore__;
            const bankVerificationResult = FON_BankCheck.GetBankVerificationResult(bbanControl.GetValue(), bbrnControl.GetValue(), ibanScoreControl.GetValue());
            if (bankVerificationResult) {
                /**
                 * Display iban verification button only if form is not in final state and bank detail has a FON result in warning or error
                 * and keep it if it was already displayed
                 */
                const tooltipFieldName = "BankIBANScore__";
                item.SetInfo(tooltipFieldName, "");
                item.SetWarning(tooltipFieldName, "");
                item.SetError(tooltipFieldName, "");
                ibanScoreControl.RemoveStyle(highlightStyles.success);
                ibanScoreControl.RemoveStyle(highlightStyles.warning);
                ibanScoreControl.RemoveStyle(highlightStyles.error);
                const message = FON_BankCheck.GetMessage(bankVerificationResult);
                const status = bankVerificationResult.status;
                const hasWarningOrError = (Lib.VM.FON.IsBankDetailStatusError(status) || Lib.VM.FON.IsBankDetailStatusWarning(status));
                BankActionsButtonsAndPaneVisibility((!hasWarningOrError || !FON_BankCheck.IsBankCheckPossible()) && !Controls.IBANVerification__.IsVisible());
                if (bankVerificationResult.technicalError) {
                    ibanScoreControl.SetError(Language.Translate("_Technical error occured"));
                }
                else if (Lib.VM.FON.IsBankDetailStatusError(status) && !FON_BankCheck.ShouldTreatFONErrorAsWarning()) {
                    item.SetError(tooltipFieldName, message);
                    ibanScoreControl.AddStyle(highlightStyles.error);
                    FON_BankCheck.hasError = true;
                    if (FON_BankCheck.snackbarStatus !== "error") {
                        FON_BankCheck.snackbarCounter = 0;
                    }
                    FON_BankCheck.snackbarMessage = "_BankCheckSnackbarError";
                    FON_BankCheck.snackbarStatus = "error";
                    FON_BankCheck.snackbarCounter++;
                }
                else if ((Lib.VM.FON.IsBankDetailStatusError(status) && FON_BankCheck.ShouldTreatFONErrorAsWarning()) || Lib.VM.FON.IsBankDetailStatusWarning(status)) {
                    item.SetWarning(tooltipFieldName, message);
                    ibanScoreControl.AddStyle(highlightStyles.warning);
                    // Set snackbar in warning only if not already in error
                    if (FON_BankCheck.snackbarStatus !== "error") {
                        if (FON_BankCheck.snackbarStatus !== "warning") {
                            FON_BankCheck.snackbarCounter = 0;
                        }
                        FON_BankCheck.snackbarMessage = "_BankCheckSnackbarWarning";
                        FON_BankCheck.snackbarStatus = "warning";
                        FON_BankCheck.snackbarCounter++;
                    }
                }
                else {
                    item.SetInfo(tooltipFieldName, message);
                    ibanScoreControl.AddStyle(highlightStyles.success);
                    // Set snackbar in success only if not already in warning or error
                    if (FON_BankCheck.snackbarStatus !== "error" && FON_BankCheck.snackbarStatus !== "warning") {
                        if (FON_BankCheck.snackbarStatus !== "success") {
                            FON_BankCheck.snackbarCounter = 0;
                        }
                        FON_BankCheck.snackbarMessage = "_BankCheckSnackbarSuccess";
                        FON_BankCheck.snackbarStatus = "success";
                        FON_BankCheck.snackbarCounter++;
                    }
                }
            }
            else {
                // Display iban verification button only if form is not in final state and FON option is enabled, and keep it if it was already displayed
                BankActionsButtonsAndPaneVisibility(!FON_BankCheck.IsBankCheckPossible() && !Controls.IBANVerification__.IsVisible());
            }
        }
    },
    RefreshAll: function () {
        if (!User.isVendor) {
            const bankDetailsControl = Controls.CompanyBankAccountsTable__;
            FON_BankCheck.hasError = false;
            const lineCount = bankDetailsControl.GetLineCount(true);
            for (let i = 0; i < lineCount; i++) {
                const row = bankDetailsControl.GetRow(i);
                FON_BankCheck.Refresh(row);
            }
        }
    },
    /**
     * Threats all FON error set on IBAN Fields as warning, removing the sid is error and adding it as a warning.
     * Keep all other errors.
     */
    SetAllFONErrorsAsWarnings: function () {
        const bankDetailsControl = Controls.CompanyBankAccountsTable__;
        for (let i = 0; i < bankDetailsControl.GetLineCount(); i++) {
            const row = bankDetailsControl.GetRow(i);
            if (row) {
                const bbrnControl = row.RoutingCode__;
                const bbanControl = row.BankAccountNumber__;
                const ibanScoreControl = row.BankIBANScore__;
                const score = row.BankIBANScore__.GetValue();
                const bankVerificationResult = FON_BankCheck.GetBankVerificationResult(bbanControl.GetValue(), bbrnControl.GetValue(), score);
                if (bankVerificationResult) {
                    const message = FON_BankCheck.GetMessage(bankVerificationResult);
                    const status = bankVerificationResult.status;
                    if (Lib.VM.FON.IsBankDetailStatusError(status)) {
                        if (FON_BankCheck.SetFONErrorAsWarning(ibanScoreControl.GetName(), message, row.GetItem())) {
                            ibanScoreControl.RemoveStyle(highlightStyles.error);
                        }
                        ibanScoreControl.AddStyle(highlightStyles.warning);
                    }
                }
            }
        }
        FON_BankCheck.hasError = false;
    },
    /**
     * remove a string from another
     * @param message the string to clean
     * @param fonMessage the string to remove
     */
    RemoveFONMessage: function (message, fonMessage) {
        if (!message || message === fonMessage) {
            return "";
        }
        const regex = new RegExp(`(${fonMessage}\\n)|(\\n${fonMessage})`, "gm");
        return message.replace(regex, "");
    },
    SetFONErrorAsWarning: function (fieldName, fonMessage, item) {
        let errorMessage = FON_BankCheck.RemoveFONMessage(item.GetError(fieldName), fonMessage);
        if (errorMessage === Language.Translate("_One or more vendors with the same informations are already registered")) {
            fonMessage = `${errorMessage}\n${fonMessage}`;
            errorMessage = "";
        }
        item.SetError(fieldName, errorMessage);
        AddWarning(fieldName, fonMessage, item);
        return !errorMessage;
    },
    ShouldTreatFONErrorAsWarning: function () {
        const fonErrorAsWarningValue = Variable.GetValueAsString("FONErrorAsWarning");
        return fonErrorAsWarningValue !== null && ((fonErrorAsWarningValue.toLowerCase() === "true") || fonErrorAsWarningValue === "1");
    },
    EnableFONErrorAsWarning: function (enable) {
        Variable.SetValueAsString("FONErrorAsWarning", enable);
    },
    ResetBankDetail: function (item, row) {
        if (item.GetValue("BankCountry__") === "US" && FON_BankCheck.IsEnabled()) {
            SisID.ResetIbanStatus(item, row);
            item.SetValue("BankIBANScore__", null);
            FON_BankCheck.Refresh(row);
        }
    },
    ResetAllBankDetails: function () {
        if (FON_BankCheck.IsEnabled()) {
            const bankDetailsControl = Controls.CompanyBankAccountsTable__;
            const lineCount = bankDetailsControl.GetLineCount(true);
            for (let i = 0; i < lineCount; i++) {
                const row = bankDetailsControl.GetRow(i);
                const item = row.GetItem();
                FON_BankCheck.ResetBankDetail(item, row);
            }
        }
    },
    InitBankCheckFieldsOnChange: function () {
        const controlsToResetBankDetails = [
            Controls.IsIndividualStructure__,
            Controls.Company__,
            Controls.FirstName__,
            Controls.LastName__,
            Controls.TaxIdentificationNumber__,
            Controls.Country__,
            Controls.CountryForBank__,
            Controls.StreetForBank__,
            Controls.CityForBank__,
            Controls.ZipCodeForBank__,
            Controls.ComboStateForBank__,
            Controls.AddressForBankIsSameAsCompany__
        ];
        const adressControlsToResetBankDetails = [
            Controls.Street__,
            Controls.City__,
            Controls.Zip_Code__,
            Controls.ComboState__,
            Controls.Mail_State__
        ];
        const wrapOnChange = function (control, onChangeListener) {
            const ctrlOnChange = control.OnChange;
            control.OnChange = function () {
                ctrlOnChange.apply(this);
                onChangeListener();
            };
        };
        function companyAddressFieldOnChange() {
            if (Controls.AddressForBankIsSameAsCompany__.IsChecked()) {
                FON_BankCheck.ResetAllBankDetails();
            }
        }
        ;
        controlsToResetBankDetails.forEach(control => {
            wrapOnChange(control, FON_BankCheck.ResetAllBankDetails);
        });
        adressControlsToResetBankDetails.forEach(control => {
            wrapOnChange(control, companyAddressFieldOnChange);
        });
    }
};
const TaxRegistrationNumber = {
    GetTaxRegistrationNumberValue: async function () {
        if (Lib.VendorRegistration.Common.IsCountryUS()) {
            let taxIdentificationNumber = "";
            try {
                taxIdentificationNumber = await Data.GetConfidentialValue("TaxIdentificationNumber__");
            }
            catch (reason) {
                Log.Warn(`Unable to read TaxIdentificationNumber: ${reason}`);
            }
            return taxIdentificationNumber === null || taxIdentificationNumber === void 0 ? void 0 : taxIdentificationNumber.toString().replace(/ /g, "");
        }
        return Data.GetValue("TaxID__");
    },
    GetTaxRegistrationNumberError: function () {
        if (Lib.VendorRegistration.Common.IsCountryUS()) {
            return Data.GetError("TaxIdentificationNumber__");
        }
        return Data.GetError("TaxID__");
    },
    GetTaxRegistrationNumberLabel: function () {
        if (Lib.VendorRegistration.Common.IsCountryUS()) {
            return Controls.TaxIdentificationNumber__.GetLabel();
        }
        return Controls.TaxID__.GetLabel();
    },
    ValidateUSTaxNumber: function (taxNumber) {
        const isIndividual = Lib.VendorRegistration.Common.IsVendorIndividual();
        const isValid = isIndividual
            ? /^(?:\d{3}-\d{2}-\d{4}|\d{9})$/.test(taxNumber)
            : /^(?:\d{2}-\d{7}|\d{9})$/.test(taxNumber);
        if (!isValid) {
            return Language.Translate(isIndividual ? "_invalid SSN format" : "_invalid EIN format");
        }
        return "";
    },
    ValidateInternationalTaxNumber: function (taxNumber, country) {
        if (!Sys.Helpers.VAT.IsVATCountry(country)) {
            return "";
        }
        const vatInfo = Sys.Helpers.VAT.CheckVAT(taxNumber);
        if (!vatInfo.isValid) {
            return Language.Translate("_invalid VAT format");
        }
        if (vatInfo.country.isoCode.short !== country) {
            return Language.Translate("_invalid {0} VAT format does not match country {1}", true, CountryManagement.GetCountryName(vatInfo.country.isoCode.short), CountryManagement.GetCountryName(country));
        }
        return "";
    },
    ValidateTaxRegistrationNumber: async function () {
        const country = Data.GetValue("Country__");
        const isCountryUS = Lib.VendorRegistration.Common.IsCountryUS();
        let errorMsg = "";
        // async call only for error display if any - do not wait for result
        const taxRegistrationNumber = await TaxRegistrationNumber.GetTaxRegistrationNumberValue();
        if (taxRegistrationNumber) {
            if (isCountryUS) {
                errorMsg = TaxRegistrationNumber.ValidateUSTaxNumber(taxRegistrationNumber);
                Controls.TaxIdentificationNumber__.SetError(errorMsg);
            }
            else {
                errorMsg = TaxRegistrationNumber.ValidateInternationalTaxNumber(taxRegistrationNumber, country);
                Controls.TaxID__.SetError(errorMsg);
            }
        }
        return Sys.Helpers.IsEmpty(errorMsg);
    },
    Validate: async function () {
        let customValidationFunction = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.CustomTaxIDValidationFunction");
        if (typeof customValidationFunction === "function") {
            return await customValidationFunction();
        }
        return await TaxRegistrationNumber.ValidateTaxRegistrationNumber();
    },
    AdaptLabelAndRequire: function () {
        const country = Data.GetValue("Country__");
        const isVatCountry = Sys.Helpers.VAT.IsVATCountry(country);
        const isCountryUS = Lib.VendorRegistration.Common.IsCountryUS();
        Controls.TaxID__.SetRequired(isVatCountry);
        Controls.TaxID__.SetLabel(isVatCountry ? "_TaxID" : "_TaxID_NonVAT");
        Controls.TaxID__.Hide(isCountryUS);
        Controls.TaxIdentificationNumber__.Hide(!isCountryUS);
        Controls.TaxIdentificationNumber__.SetLabel(Lib.VendorRegistration.Common.IsVendorIndividual() ? "_Social security number" : "_TaxID_EIN");
        Controls.TaxIdentificationNumber__.SetRequired(isCountryUS);
    },
    ResetValues(previousCountry, currentCountry) {
        if (previousCountry === currentCountry) {
            return;
        }
        if (currentCountry === "US") {
            Data.SetValue("TaxID__", "");
            Controls.TaxID__.SetError("");
        }
        else if (previousCountry === "US") {
            Data.SetValue("TaxIdentificationNumber__", "");
            Controls.TaxIdentificationNumber__.SetError("");
        }
    }
};
const Wizard = {
    _currentStepId: 0,
    hideFirstStep: false,
    steps: [
        steps.lookup,
        steps.company,
        steps.unspsc,
        steps.diversity,
        steps.officers,
        steps.payment,
        steps.documents,
        steps.questionnaire
    ],
    /**
     * Calls the OnWizardStepChange user exit and validates the returned step ID.
     * @param currentStepId - The current wizard step index
     * @param targetStepId - The target wizard step index
     * @param action - The navigation action being performed
     * @returns The validated step ID to use (either custom or original target)
     */
    CallOnWizardStepChangeUserExit: function (currentStepId, targetStepId, action) {
        // Call user exit
        const customStepId = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnWizardStepChange", currentStepId, targetStepId, action, {
            wizard: this,
            steps: this.steps,
            isValid: true
        });
        // Validate and return custom step ID if valid, otherwise return target
        if (typeof customStepId === "number" &&
            customStepId >= 0 &&
            customStepId < this.steps.length &&
            !this.steps[customStepId].hiddenStep) {
            return customStepId;
        }
        return targetStepId;
    },
    Init: function () {
        Wizard.MapControls();
        Wizard.InitPanes();
        Wizard.RefreshStepButtons();
        // Determine default initial step
        let initialStepId = this.hideFirstStep ? 1 : 0;
        // Call user exit and get validated step ID
        initialStepId = this.CallOnWizardStepChangeUserExit(initialStepId, initialStepId, "init");
        Wizard.ShowStep(this.steps[initialStepId]);
    },
    InitPanes: function () {
        for (const step of Wizard.steps) {
            if (typeof step.onInit === "function") {
                step.onInit();
            }
        }
    },
    NextStep: async function () {
        const currentStepId = this._currentStepId;
        // Calculate next non-hidden step
        let targetStepId = currentStepId;
        do {
            targetStepId++;
        } while (targetStepId < this.steps.length - 1 && this.steps[targetStepId].hiddenStep);
        // Call user exit and get validated step ID
        targetStepId = this.CallOnWizardStepChangeUserExit(currentStepId, targetStepId, "next");
        await this.ChangeStep(this.steps[targetStepId], false);
    },
    PreviousStep: async function () {
        const currentStepId = this._currentStepId;
        // Calculate previous non-hidden step
        let targetStepId = currentStepId;
        do {
            targetStepId--;
        } while (targetStepId > 0 && this.steps[targetStepId].hiddenStep);
        // Call user exit and get validated step ID
        targetStepId = this.CallOnWizardStepChangeUserExit(currentStepId, targetStepId, "previous");
        await this.ChangeStep(this.steps[targetStepId], true);
    },
    ChangeStep: async function (step, goesBack) {
        if (!await Wizard.ValidCurrentStep(goesBack) || !step || step.hiddenStep) {
            return;
        }
        Wizard.ShowStep(step);
    },
    ShowStep: function (stepToShow) {
        const stepIdToShow = this.steps.indexOf(stepToShow);
        for (let index = 0; index < this.steps.length; index++) {
            const step = Wizard.steps[index];
            const isCurrentStep = step === stepToShow;
            // Hide every pannel that does not belong to the current step
            if (!isCurrentStep) {
                for (const panel of step.panels) {
                    panel.Hide(true);
                }
            }
            // Grey-out future steps
            const isFutureStep = this.steps.indexOf(step) > stepIdToShow;
            step.button.SetDisabled(isFutureStep);
            step.button.SetAwesomeClasses(isCurrentStep ? "fa fa-circle fa-2" : "fa fa-circle-o fa-2");
        }
        // Show current step panels
        for (const panel of stepToShow.panels) {
            panel.Hide(false);
        }
        stepToShow.onShow();
        Wizard.HandlePreviousNextButtons(stepIdToShow);
        Wizard.HandleSaveButton();
        Wizard._currentStepId = stepIdToShow;
    },
    ValidCurrentStep: async function (goesBack) {
        return Wizard._currentStepId !== null && await Wizard.steps[Wizard._currentStepId].onQuit(goesBack);
    },
    HandleSaveButton: function () {
        Controls.Save__.Hide(ProcessInstance.isReadOnly || Data.GetValue("RegistrationType__") === registrationType.update);
    },
    HandlePreviousNextButtons: function (stepId) {
        Controls.Previous__.SetDisabled(stepId === 0 || (stepId === 1 && Wizard.hideFirstStep));
        const nextButton = Controls.Next__;
        if (stepId === Wizard.steps.length - 1) {
            if (ProcessInstance.isReadOnly) {
                nextButton.SetDisabled(true);
                nextButton.SetText("_Next");
            }
            else {
                nextButton.SetDisabled(false);
                nextButton.SetText("_Submit");
            }
        }
        else {
            nextButton.SetDisabled(false);
            nextButton.SetText("_Next");
        }
    },
    MapControls: function () {
        Controls.Lookup_Step__.OnClick = async () => {
            const targetStepId = this.CallOnWizardStepChangeUserExit(Wizard._currentStepId, this.steps.indexOf(steps.lookup), "goto");
            await Wizard.ChangeStep(this.steps[targetStepId], true);
        };
        Controls.Company_Step__.OnClick = async () => {
            const targetStepId = this.CallOnWizardStepChangeUserExit(Wizard._currentStepId, this.steps.indexOf(steps.company), "goto");
            await Wizard.ChangeStep(this.steps[targetStepId], true);
        };
        Controls.Questionnaire_Step__.OnClick = async () => {
            const targetStepId = this.CallOnWizardStepChangeUserExit(Wizard._currentStepId, this.steps.indexOf(steps.questionnaire), "goto");
            await Wizard.ChangeStep(this.steps[targetStepId], true);
        };
        Controls.Company_Officers__.OnClick = async () => {
            const targetStepId = this.CallOnWizardStepChangeUserExit(Wizard._currentStepId, this.steps.indexOf(steps.officers), "goto");
            await Wizard.ChangeStep(this.steps[targetStepId], true);
        };
        Controls.Banks__.OnClick = async () => {
            const targetStepId = this.CallOnWizardStepChangeUserExit(Wizard._currentStepId, this.steps.indexOf(steps.payment), "goto");
            await Wizard.ChangeStep(this.steps[targetStepId], true);
        };
        Controls.Documents_Step__.OnClick = async () => {
            const targetStepId = this.CallOnWizardStepChangeUserExit(Wizard._currentStepId, this.steps.indexOf(steps.documents), "goto");
            await Wizard.ChangeStep(this.steps[targetStepId], true);
        };
        Controls.Previous__.OnClick = async () => {
            await Wizard.PreviousStep();
        };
        Controls.Next__.OnClick = async () => {
            if (DnBObject.isDnBConfigured && DnBObject.options.isVendorLookupEnabled && Wizard._currentStepId === 0 && Variable.GetValueAsString("DunsValueChanged") === "1") {
                if (await Wizard.ValidCurrentStep(false)) {
                    LookupCompany(LookupCompanyCallback);
                }
            }
            else {
                let isStepValid = true;
                // Deprecated Lib.AP.Customization.VendorRegistration_HTMLScripts.ValidCurrentSte
                // New use exit name space is Lib.VendorRegistration.Customization.HTMLScripts.ValidCurrentStep
                if ((Sys.Helpers.TryGetFunction("Lib.AP.Customization.VendorRegistration_HTMLScripts.ValidCurrentStep") &&
                    Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorRegistration_HTMLScripts.ValidCurrentStep") === false) ||
                    Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.ValidCurrentStep") === false) {
                    isStepValid = false;
                }
                if (isStepValid) {
                    if (Wizard._currentStepId === Wizard.steps.length - 1) {
                        // Call user exit for submit action (return value is ignored for submit)
                        Wizard.CallOnWizardStepChangeUserExit(Wizard._currentStepId, Wizard._currentStepId, "submit");
                        return Wizard.Approve();
                    }
                    return Wizard.NextStep();
                }
            }
            return null;
        };
    },
    GetRequiredFields: function (step) {
        step.requiredFields = [];
        step.panels.forEach(function (panel) {
            panel.GetControls().forEach(function (control) {
                if (typeof control.IsRequired === "function" && control.IsRequired()) {
                    step.requiredFields.push(control);
                }
            });
        });
    },
    ResetRequiredFields: function (step) {
        var _a;
        (_a = step.requiredFields) === null || _a === void 0 ? void 0 : _a.forEach(function (control) {
            control.SetError(null);
        });
    },
    CheckRequiredFields: function (step) {
        let stepValid = true;
        for (const control of step.requiredFields) {
            if (control.GetType() === "Questionnaire") {
                stepValid = control.CheckRequired();
            }
            else if (!control.GetText() || (control.GetType() === "ComboBox" && !control.GetSelectedOption())) {
                control.SetError("This field is required!");
                stepValid = false;
            }
            else if ((control.GetType() === "Decimal" || control.GetType() === "Integer") && isNaN(parseFloat(control.GetText()))) {
                control.SetError("Value is not allowed!");
                stepValid = false;
            }
        }
        return stepValid;
    },
    Approve: async function () {
        for (const step of Wizard.steps) {
            if (!step.hiddenStep && !await step.onQuit(false)) {
                Wizard.ShowStep(step);
                return;
            }
        }
        if (Data.GetValue("RegistrationType__") !== registrationType.update) {
            Lib.VendorRegistration.DocumentsTable.CheckMandatoryDocumentTypes();
        }
        if (Process.ShowFirstError()) {
            return;
        }
        const queryOptions = {
            table: "CDNAME#Vendor Registration",
            filter: `(&(State<100)(Deleted=0)(!(MsnEx=${Data.GetValue("MsnEx")}))(VendorNumber__=${Data.GetValue("VendorNumber__")})(CompanyCode__=${Data.GetValue("CompanyCode__")}))`,
            attributes: ["RuidEx"],
            maxRecords: 1
        };
        const queryResult = await Sys.GenericAPI.PromisedQuery(queryOptions);
        if (queryResult && queryResult.length > 0) {
            // Show an error popup and leave the form
            Popup.Alert("_ErrorMessageDuplicateRegistrationUpdate", false, function () {
                ProcessInstance.Quit("Quit");
            }, "_ErrorTitleDuplicateRegistrationUpdate");
        }
        else {
            Lib.VendorRegistration.DocumentsTable.AttachDocumentsToRecord();
            if (isVendorGuest()) {
                Process.SetReturnURL("logout.aspx?vendor=1&status=LogoutAndByeSuccess&appId=VendorRegistration&lang=" + User.language);
            }
            HandleApprovalAndTab("Submit");
        }
    },
    RefreshStepButtons: function () {
        for (const step of Wizard.steps) {
            step.button.Hide(step.hiddenStep || false);
            step.spacer.Hide(step.hiddenStep || false);
        }
    }
};
/**
 * Function to customize the list of roles availables for the officers
 */
function setOfficerRoles() {
    const customizeRoles = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Common.OfficersAvailableRoles", Controls.CompanyOfficersTable__.GetColumnControl(1).GetAvailableValues());
    if (customizeRoles) {
        Controls.CompanyOfficersTable__.GetColumnControl(1).SetAvailableValues(customizeRoles);
    }
}
//#endregion
//#region helpers function
/**
 * Specific approve to manage approval and current tab when VR was created in a new tab
 * @param actionName string matching the action name
 */
function HandleApprovalAndTab(actionName) {
    if (hasBeenOpenedInNewTab) {
        const url = "FlexibleForm/FlexibleForm.aspx?" + Process.GetURL().split("?")[1] + "&closeTabOnLoad=1";
        Process.SetReturnURL(url);
    }
    ProcessInstance.Approve(actionName);
}
function LookupCompany(callback) {
    // try to call the user exit only if the configuration is Demo
    if (DnBObject && DnBObject.credentials.user === "demo") {
        const customReturn = Sys.Helpers.TryCallFunction("Lib.VM.Customization.LookupCompany.OverrideReturn", Data.GetValue("LookupCountry__"), Data.GetValue("NationalID__"));
        if (customReturn) {
            callback(customReturn);
            return;
        }
    }
    const returnMsg = {
        error: false,
        msg: "",
        errorCode: 0,
        popupTitle: ""
    };
    if (DnBObject.isDnBConfigured && DnBObject.options.isVendorLookupEnabled) {
        const dunsClient = new Sys.DunsClient(DnBObject.credentials);
        dunsClient.GetSessionKey(function (isAuthenticated) {
            if (!isAuthenticated) {
                returnMsg.error = true;
                returnMsg.msg = "_ErrorAuthentication";
                returnMsg.popupTitle = "_ErrorAuthenticationPopupTitle";
                callback(returnMsg);
            }
            else {
                dunsClient.SearchCompanyFromNationalID(Data.GetValue("LookupCountry__"), Data.GetValue("NationalID__"), false, function (jsonResult) {
                    if (jsonResult.error) {
                        dunsClient.SearchCompanyFromNationalID(Data.GetValue("LookupCountry__"), Data.GetValue("NationalID__"), true, function (jsonDUNSResult) {
                            if (jsonDUNSResult.error) {
                                returnMsg.error = true;
                                returnMsg.msg = "_NoCompanyFound";
                                returnMsg.popupTitle = "_CompanyLookupPopupTitle";
                                callback(returnMsg);
                            }
                            else {
                                CompleteCompanyInfos(dunsClient, jsonDUNSResult, callback);
                            }
                        });
                    }
                    else {
                        CompleteCompanyInfos(dunsClient, jsonResult, callback);
                    }
                });
            }
        });
    }
}
function CompleteCompanyInfos(dunsClient, jsonResult, callback) {
    dunsClient.GetCompanyInfos(jsonResult.dunsNumber, (companyData) => {
        if (companyData.error) {
            callback(jsonResult);
            return;
        }
        jsonResult.registrationNumbers = companyData.registrationNumbers;
        jsonResult.website = companyData.website;
        jsonResult.unspscCodes = companyData.unspscCodes;
        callback(jsonResult);
    });
}
function FillVendorFields(jsonResult) {
    const lookupCompanyValues = {
        flexible: {
            fields: {
                Company__: jsonResult.companyName,
                VendorRegistrationDUNSNumber__: jsonResult.dunsNumber,
                Street__: jsonResult.address.street,
                Zip_Code__: jsonResult.address.postalCode,
                City__: jsonResult.address.city,
                Phone_Number__: jsonResult.phoneNumber,
                NumberOfEmployees__: jsonResult.numberOfEmployees,
                Mail_State__: jsonResult.address.state,
                TaxID__: "",
                Website__: jsonResult.website,
                Country__: Data.GetValue("LookupCountry__"),
                CompanyStructure__: jsonResult.structure
            }
        }
    };
    CheckEmptyField("Company__", jsonResult.companyName);
    CheckEmptyField("VendorRegistrationDUNSNumber__", jsonResult.dunsNumber);
    CheckEmptyField("Street__", jsonResult.address.street);
    CheckEmptyField("Zip_Code__", jsonResult.address.postalCode);
    CheckEmptyField("City__", jsonResult.address.city);
    CheckEmptyField("Phone_Number__", jsonResult.phoneNumber);
    CheckEmptyField("NumberOfEmployees__", jsonResult.numberOfEmployees);
    CheckEmptyField("Website__", jsonResult.website);
    CheckEmptyField("Country__", Data.GetValue("LookupCountry__"));
    CheckEmptyField("CompanyStructure__", jsonResult.structure);
    if (jsonResult.address.state !== "") {
        CheckEmptyField("Mail_State__", jsonResult.address.state);
        CountryManagement.ApplyChangeOfCountry();
    }
    //Tax Code
    let taxIdFound = false;
    let j = 0;
    const isVATCountry = Sys.Helpers.VAT.IsVATCountry(Data.GetValue("Country__"));
    let registrationNumber;
    // For VAT Country, only "Value Added Tax Number" can be used
    // For non VAT Country, "*Tax*" identifier is preferred, and then the preferredRegistrationNumber
    while (j < jsonResult.registrationNumbers.length && !taxIdFound) {
        const currentRegistrationNumber = jsonResult.registrationNumbers[j];
        const description = currentRegistrationNumber.typeDescription.toLowerCase();
        if (description.indexOf("value added tax number") !== -1 || (!isVATCountry && description.indexOf("tax") !== -1)) {
            registrationNumber = currentRegistrationNumber.registrationNumber;
            taxIdFound = true;
        }
        else if (!isVATCountry && currentRegistrationNumber.isPreferredRegistrationNumber === true) {
            registrationNumber = currentRegistrationNumber.registrationNumber;
        }
        j++;
    }
    if (registrationNumber) {
        if (Lib.VendorRegistration.Common.IsCountryUS()) {
            CheckEmptyField("TaxIdentificationNumber__", registrationNumber);
        }
        else {
            CheckEmptyField("TaxID__", registrationNumber);
        }
        OnChangeTaxID(); //trigger onChangeTaxID to handle compliance refresh
        lookupCompanyValues.flexible.fields.TaxID__ = registrationNumber;
    }
    const isEnabled = User.isVendor
        ? Variable.GetValueAsString("EnableVendorUNSPSC") === "true"
        : Lib.P2P.UNSPSC.IsEnabled();
    const shouldRetrieveUNSPSCFromDNB = User.isVendor || Controls.RetrieveUNSPSCFromDNB__.IsChecked();
    if (isEnabled && DnBObject.options.shouldInsertUNSPSCFromDNB && jsonResult.unspscCodes && jsonResult.unspscCodes.length > 0 && shouldRetrieveUNSPSCFromDNB) {
        Lib.P2P.UNSPSC.Client.FillTableWithUNSPSC(jsonResult.unspscCodes);
    }
    // Call user exit to allow extraction of additional D&B data (e.g., SIRET, SIREN)
    Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnFillVendorFieldsFromDnB", jsonResult);
    Variable.SetValueAsString(HighlightHandling.companyLookupVariable, JSON.stringify(lookupCompanyValues));
}
function CheckEmptyField(fieldToFill, value) {
    if (value !== "") {
        Data.SetValue(fieldToFill, value);
    }
}
function BankActionsButtonsAndPaneVisibility(isHiddenIBANCheck) {
    isHiddenIBANCheck = ProcessInstance.isReadOnly || isHiddenIBANCheck;
    const isHiddenInvitationBtn = !SisID.IsCompanyUnknown();
    Controls.BanksActionsPane.Hide(isHiddenIBANCheck);
    Controls.IBANVerification__.Hide(isHiddenIBANCheck);
    Controls.GenerateSISIDInvitation__.Hide(isHiddenIBANCheck || isHiddenInvitationBtn);
}
function IsERPFieldsMandatory() {
    return !Lib.VendorRegistration.Workflow.WorkflowControllerHelper.GetNextUserWithoutAutoApprovers();
}
function IsCompanyCodeRequired() {
    return IsERPFieldsMandatory() && Parameters.IsVendorManagementCompanyCodeMandatory();
}
function IsUnModifiedNewRegistration() {
    return Data.GetValue("RegistrationType__") === registrationType.registration && Variable.GetValueAsString("IsProcessModifiedByUser") !== "true";
}
function UpdateDiversityDocumentControlsDependingOnDiversityClassification() {
    const documentTableLib = Lib.VendorRegistration.DocumentsTable;
    documentTableLib.UpdateDocumentTypeAvailableValues();
    const documentTypes = documentTableLib.documentTypes;
    const diversityDocumentType = documentTypes.getValue(documentTypes.diversityClassification);
    if (Controls.DiversityClassification__.GetValue()) {
        documentTableLib.SetMandatoryDocumentType(diversityDocumentType);
    }
    else {
        documentTableLib.RemoveMandatoryDocumentType(diversityDocumentType);
    }
}
function InitWorkflow() {
    Lib.VendorRegistration.Workflow.Init();
    const currentStepRole = Lib.VendorRegistration.Workflow.Controller.GetCurrentStepRole();
    const allowRebuild = currentStepRole === Lib.VendorRegistration.Workflow.roleRequester;
    Lib.VendorRegistration.Workflow.Controller.AllowRebuild(allowRebuild);
}
function OnChangeCountry() {
    Controls.Mail_State__.SetValue("");
    BankAccountsManagement.SetBankDetailLineCountryIfEmpty();
    BankActionsButtonsAndPaneVisibility(!IsBankCheckPossible());
    return CountryManagement.ApplyChangeOfCountry()
        .Then(() => {
        PaymentManagement.ValidatePaymentTerms();
        PaymentManagement.ValidatePaymentMethod();
    })
        .Then(() => Lib.VendorRegistration.Workflow.Controller.Rebuild());
}
function OnCountryForBankChange() {
    Controls.StateForBank__.SetValue("");
    return CountryManagement.ApplyChangeOfBankAddressCountry();
}
function OnChangeVendorCategory() {
    return Lib.VendorRegistration.Workflow.Controller.Rebuild();
}
async function OnChangeTaxID() {
    await TaxRegistrationNumber.Validate();
    // Display iban verification button only if form is not in final state and SisID or FON option is enabled, and keep it if it was already displayed
    BankActionsButtonsAndPaneVisibility(!IsBankCheckPossible() && !Controls.IBANVerification__.IsVisible());
    if (ComplianceRisk.IsEnabled()) {
        Data.SetValue("ComplianceRiskIdentifier__", null);
        ComplianceRisk.Refresh();
    }
}
function IsBankCheckPossible() {
    return SisID.IsEnabled() || (FON_BankCheck.IsEnabled() && FON_BankCheck.IsBankCheckPossible());
}
function EnableLookupButton() {
    Variable.SetValueAsString("DunsValueChanged", "1");
    Controls.LookupBtn__.SetDisabled(!(Controls.LookupCountry__.GetValue() && Controls.NationalID__.GetValue()));
}
const BankAddress = {
    Init: function () {
        let isBankAddressFieldsInUse = !Controls.AddressForBankIsSameAsCompany__.IsChecked();
        if (IsUnModifiedNewRegistration() && isBankAddressFieldsInUse && Sys.Helpers.IsEmpty(Data.GetValue("CountryForBank__"))) {
            Data.SetValue("CountryForBank__", "US");
        }
        return CountryManagement.ApplyChangeOfBankAddressCountry();
    }
};
function InitEvents() {
    const ApproveOnclickEvent = function () {
        const currentRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex());
        if (currentRole === Lib.VendorRegistration.Workflow.roleLegalReviewer) {
            HandleActions.ApproveWithPopupCommentDialog();
        }
        else {
            HandleActions.Approve();
        }
    };
    // Defines what must be done when the user clicks the form buttons.
    // In this sample, the 'Submit' action name executes the default contributor action.
    Controls.SubmitToNext.OnClick = ApproveOnclickEvent;
    Controls.Approve.OnClick = ApproveOnclickEvent;
    Controls.BackToPrevious.OnClick = function () {
        ProcessInstance.Approve("BackToPrevious");
    };
    Controls.Reject.OnClick = function () {
        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.CustomizeHandleRejection") || HandleActions.Reject();
    };
    Controls.BackToVendor.OnClick = function () {
        HandleActions.BackToVendor();
    };
    // Header fields
    Controls.TaxID__.OnChange = OnChangeTaxID;
    Controls.TaxIdentificationNumber__.OnChange = OnChangeTaxID;
    Controls.ComboState__.OnChange = function () {
        Controls.Mail_State__.SetValue(this.GetSelectedOption());
    };
    Controls.Country__.OnChange = OnChangeCountry;
    Controls.Country__.OnBlur = async function () {
        if (Controls.Country__.GetValue() !== g_CurrentCountry) {
            await OnChangeCountry();
        }
    };
    Controls.LookupCountry__.OnBlur = function () {
        const isChanged = Controls.LookupCountry__.GetValue() !== g_currentLookupCountry;
        if (isChanged) {
            g_currentLookupCountry = Controls.LookupCountry__.GetValue();
            Controls.Country__.SetValue(Controls.LookupCountry__.GetValue());
            OnChangeCountry();
            EnableLookupButton();
        }
    };
    Controls.CountryForBank__.OnChange = OnCountryForBankChange;
    Controls.CountryForBank__.OnBlur = function () {
        if (Controls.CountryForBank__.GetValue() !== g_CurrentCountryForBank) {
            return OnCountryForBankChange();
        }
        return Promise.resolve();
    };
    Controls.VendorCategory__.OnChange = OnChangeVendorCategory;
    Controls.NationalID__.OnChange = EnableLookupButton;
    Controls.DiversityClassification__.OnChange = function () {
        DiversityClassificationManagement.InitFields();
    };
    Controls.PaymentTermCode__.OnChange = function () {
        PaymentManagement.ValidatePaymentTerms();
    };
    Controls.PaymentTerms__.OnChange = function () {
        PaymentManagement.ValidatePaymentTerms();
    };
    Controls.PaymentMethodCode__.OnChange = function () {
        PaymentManagement.ValidatePaymentMethod();
    };
    Controls.PaymentMethod__.OnChange = function () {
        PaymentManagement.ValidatePaymentMethod();
    };
    Controls.AddressForBankIsSameAsCompany__.OnChange = function () {
        if (Controls.AddressForBankIsSameAsCompany__.IsChecked()) {
            Data.SetValue("StreetForBank__", "");
            Data.SetValue("ZipCodeForBank__", "");
            Data.SetValue("CityForBank__", "");
            Data.SetValue("StateForBank__", "");
            Data.SetValue("SubForBank__", "");
            Data.SetValue("CountryForBank__", "");
        }
        else {
            Data.SetValue("CountryForBank__", "US");
        }
        CountryManagement.ApplyChangeOfBankAddressCountry();
    };
    Controls.ComboStateForBank__.OnChange = function () {
        Controls.StateForBank__.SetValue(this.GetSelectedOption());
    };
    Controls.CreationDate__.OnChange = function () {
        if (Controls.CreationDate__.GetValue()) {
            const yearValue = parseInt(Controls.CreationDate__.GetValue(), 10);
            if (!isNaN(yearValue) && yearValue > 0 && yearValue <= new Date().getFullYear()) {
                Controls.CreationDate__.SetError("");
                Data.SetValue("CreationDate__", yearValue);
            }
            else {
                Controls.CreationDate__.SetError("_InvalidYear");
            }
        }
        else {
            Controls.CreationDate__.SetError("");
        }
    };
    Controls.CompanyStructure__.OnChange = function () {
        CountryManagement.SetIfStructureIsIndividual();
        Layout.AdaptCompanyProfilePane();
    };
    Controls.FirstName__.OnChange = function () {
        Lib.VendorRegistration.Common.UpdateCompanyName();
    };
    Controls.LastName__.OnChange = function () {
        Lib.VendorRegistration.Common.UpdateCompanyName();
    };
    Controls.VendorRegistrationDUNSNumber__.OnChange = function () {
        const providerName = Lib.VM.ScoringProviders.Common.ProviderName.indueD;
        const provider = Lib.VM.ScoringProviders.Manager.GetProvider(providerName);
        if (provider) {
            const scoreType = Lib.VM.ScoringProviders.Common.ScoreType.ComplianceScore;
            const noScoreData = provider.GetScore(scoreType).GetDefaultScoreData();
            provider.GetScore(scoreType).ScoreData = noScoreData;
            Lib.Gauge.RefreshGauge(`${providerName}_${scoreType}_${noScoreData.msn}`, "noUpdate");
        }
        if (ComplianceRisk.IsEnabled()) {
            Data.SetValue("ComplianceRiskIdentifier__", null);
            ComplianceRisk.Refresh();
        }
    };
    // Officers table
    Controls.CompanyOfficersTable__.OnAddItem = function (item /*, tableIndex: number*/) {
        Layout.AdaptCompanyOfficersTableAvailableActions();
        item.SetValue("CompanyOfficerID__", GetMaxContactID());
    };
    Controls.CompanyOfficersTable__.OnDeleteItem = function ( /*item: Item, tableIndex: number*/) {
        Layout.AdaptCompanyOfficersTableAvailableActions();
    };
    Controls.CompanyOfficersTable__.OnRefreshRow = function (index) {
        const row = Controls.CompanyOfficersTable__.GetRow(index);
        HighlightHandling.HandleHighlightForRow("CompanyOfficersTable__", "CompanyOfficerID__", row);
    };
    Controls.CompanyOfficersTable__.Email__.OnChange = function () {
        Lib.P2P.Email.TrimAndCheckEmailControl(this);
    };
    // Bank details table
    Controls.CompanyBankAccountsTable__.OnAddItem = function (item /*, tableIndex: number*/) {
        const country = Controls.Country__.GetValue();
        item.SetValue("BankCountry__", country);
        BankAccountsManagement.SetCurrency(item, country);
        Layout.AdaptBankAccountsTableAvailableActions();
        Layout.AdaptAddressForBank();
        item.SetValue("BankDetailID__", GetMaxBankDetailID());
        BankAccountsManagement.SetColumnsVisibility();
    };
    Controls.CompanyBankAccountsTable__.OnDeleteItem = function ( /*item: Item, tableIndex: number*/) {
        Layout.AdaptBankAccountsTableAvailableActions();
        Layout.AdaptAddressForBank();
        BankAccountsManagement.SetColumnsVisibility();
    };
    Controls.CompanyBankAccountsTable__.OnRefreshRow = function (index) {
        BankAccountsManagement.SetAllReadOnlyAndRequiredFields();
        const row = Controls.CompanyBankAccountsTable__.GetRow(index);
        const ibanScoreControl = row.BankIBANScore__;
        ibanScoreControl.RemoveStyle(highlightStyles.success);
        ibanScoreControl.RemoveStyle(highlightStyles.warning);
        ibanScoreControl.RemoveStyle(highlightStyles.error);
        HighlightHandling.HandleHighlightForRow("CompanyBankAccountsTable__", "BankDetailID__", row);
        SisID.Refresh(row);
        FON_BankCheck.Refresh(row);
    };
    Controls.CompanyBankAccountsTable__.BankCountry__.OnChange = function () {
        const item = this.GetItem();
        const row = this.GetRow();
        SisID.ResetIbanStatus(item, row);
        BankAccountsManagement.SetCurrency(item, item.GetValue("BankCountry__"));
        BankAccountsManagement.EmptyFields(item);
        BankAccountsManagement.SetReadOnlyAndRequiredFields(item, row);
        BankAccountsManagement.SetColumnsVisibility();
        SisID.Refresh(row);
        FON_BankCheck.Refresh(row);
        IBAN.Validate(item);
        Layout.AdaptAddressForBank();
    };
    Controls.CompanyBankAccountsTable__.BankAccountHolder__.OnChange = function () {
        FON_BankCheck.ResetBankDetail(this.GetItem(), this.GetRow());
        BankAccountsManagement.SetReadOnlyAndRequiredFields(this.GetItem(), this.GetRow());
    };
    Controls.CompanyBankAccountsTable__.BankIBAN__.OnChange = function () {
        const item = this.GetItem();
        const row = this.GetRow();
        SisID.ResetIbanStatus(item, row);
        item.SetValue("BankIBANScore__", null);
        BankAccountsManagement.SetReadOnlyAndRequiredFields(item, row);
        SisID.Refresh(row);
        FON_BankCheck.Refresh(row);
        IBAN.Validate(item);
    };
    Controls.CompanyBankAccountsTable__.BankKey__.OnChange = function () {
        BankAccountsManagement.SetReadOnlyAndRequiredFields(this.GetItem(), this.GetRow());
    };
    Controls.CompanyBankAccountsTable__.BankAccountNumber__.OnChange = function () {
        FON_BankCheck.ResetBankDetail(this.GetItem(), this.GetRow());
        BankAccountsManagement.SetReadOnlyAndRequiredFields(this.GetItem(), this.GetRow());
    };
    Controls.CompanyBankAccountsTable__.ControlKey__.OnChange = function () {
        BankAccountsManagement.SetReadOnlyAndRequiredFields(this.GetItem(), this.GetRow());
    };
    Controls.CompanyBankAccountsTable__.SWIFT_BICCode__.OnChange = function () {
        BankAccountsManagement.SetReadOnlyAndRequiredFields(this.GetItem(), this.GetRow());
    };
    Controls.CompanyBankAccountsTable__.RoutingCode__.OnChange = function () {
        FON_BankCheck.ResetBankDetail(this.GetItem(), this.GetRow());
        BankAccountsManagement.SetReadOnlyAndRequiredFields(this.GetItem(), this.GetRow());
    };
    Controls.CompanyBankAccountsTable__.Currency__.OnChange = function () {
        BankAccountsManagement.SetReadOnlyAndRequiredFields(this.GetItem(), this.GetRow());
    };
    Controls.CompanyCode__.OnChange = function () {
        Variable.SetValueAsString("companyCode", Controls.CompanyCode__.GetValue());
        Data.SetValue("DefaultItemCategory__", "");
        Data.SetValue("DefaultItemCategoryID__", "");
        Lib.VendorRegistration.Workflow.Controller.Rebuild();
        if (Data.GetValue("CompanyCode__")) {
            Controls.DefaultItemCategory__.SetFilter(`(CompanyCode__=${Data.GetValue("CompanyCode__")})`);
        }
        else {
            Controls.DefaultItemCategory__.SetFilter("(CompanyCode__=)");
        }
        Layout.InitUNSPSC();
    };
    Controls.DefaultItemCategory__.SetAttributes("SupplyID__");
    Controls.DefaultItemCategory__.OnSelectItem = function (item) {
        Data.SetValue("DefaultItemCategoryID__", item.GetValue("SupplyID__"));
    };
    Controls.DefaultItemCategory__.OnChange = function () {
        if (Data.GetValue("DefaultItemCategory__") === "") {
            Data.SetValue("DefaultItemCategoryID__", "");
        }
        return Lib.VendorRegistration.Workflow.Controller.Rebuild();
    };
    Controls.IBANVerification__.OnClick = function () {
        Controls.CompanyCode__.SetRequired(false);
        Controls.VendorNumber__.SetRequired(false);
        Lib.VendorRegistration.DocumentsTable.AttachDocumentsToRecord();
        ProcessInstance.Approve("recheckIban");
    };
    Controls.GenerateSISIDInvitation__.OnClick = async function () {
        const country = Data.GetValue("Country__");
        const taxRegistrationNumber = await TaxRegistrationNumber.GetTaxRegistrationNumberValue();
        if (taxRegistrationNumber && country) {
            Controls.GenerateSISIDInvitation__.Wait(true);
            const options = SisID.GetGenerateInvitationOptions(taxRegistrationNumber, country, Sys.Helpers.Globals.User.language);
            // Generate an Sis id invitation to enroll a vendor with his bank details
            try {
                const result = await Sys.Helpers.Sis_ID.GenerateInvitation(options);
                SisID.AddNewInvitationMessage(result);
            }
            catch (error) {
                await SisID.HandleInvitationErrors(error);
            }
            finally {
                Controls.GenerateSISIDInvitation__.Wait(false);
            }
        }
        else {
            Popup.Alert([
                "_Bank details checker Invalid invitation data: '{0}' field and '{1}' field are required.",
                Language.Translate(Controls.Country__.GetLabel(), false),
                Language.Translate(TaxRegistrationNumber.GetTaxRegistrationNumberLabel(), false)
            ], false, null, "_Warning");
        }
    };
    // Form title HTML control
    const titleState = {
        "PendingInternalInfo": {
            label: Language.Translate("_PendingInternalInfo"),
            imageUrl: `url('${Process.GetImageURL("being_process.png")}')`
        },
        "PendingVendorInfo": {
            label: Language.Translate("_PendingVendorInfo"),
            imageUrl: `url('${Process.GetImageURL("being_process.png")}')`
        },
        "Approved": {
            label: Language.Translate("_Approved"),
            imageUrl: `url('${Process.GetImageURL("approval_green.png")}')`
        },
        "ToValidate": {
            label: Language.Translate("_ToValidate"),
            imageUrl: `url('${Process.GetImageURL("warning_yellow.png")}')`
        },
        "Rejected": {
            label: Language.Translate("_Denied"),
            imageUrl: `url('${Process.GetImageURL("warning_red.png")}')`
        },
        "Draft": {
            label: Language.Translate("_Draft"),
            imageUrl: `url('${Process.GetImageURL("warning_yellow.png")}')`
        }
    };
    Controls.Title__.BindEvent("onTitleLoad", function () {
        const status = Data.GetValue("ProcessStatus__");
        let statusToDisplay = null;
        if (!User.isVendor && !Lib.VendorRegistration.InternalRequest.IsInternalRequest()) {
            switch (status) {
                case "PendingVendorInfo": {
                    statusToDisplay = titleState.PendingVendorInfo;
                    break;
                }
                case "Approved": {
                    statusToDisplay = titleState.Approved;
                    break;
                }
                case "ToValidate": {
                    const isUserTheOwner = User.loginId === Data.GetValue("OwnerId") || User.IsMemberOf(Data.GetValue("OwnerId"));
                    statusToDisplay = isUserTheOwner ? titleState.ToValidate : titleState.PendingInternalInfo;
                    break;
                }
                case "Rejected": {
                    statusToDisplay = titleState.Rejected;
                    break;
                }
                case "Draft": {
                    statusToDisplay = titleState.Draft;
                    break;
                }
                default: {
                    break;
                }
            }
        }
        const type = Data.GetValue("RegistrationType__");
        let title;
        if (type === registrationType.registration) {
            title = Language.Translate(Lib.VendorRegistration.InternalRequest.IsInternalCloneRequest() ? "_CloneTitlePane" : "_TitlePane");
        }
        else if (User.isVendor) {
            title = Language.Translate("_UpdateTitlePaneVendorSide");
        }
        else {
            title = Language.Translate("_UpdateTitlePane");
        }
        Controls.Title__.FireEvent("displayTitle", { title: title, status: statusToDisplay });
    });
    Controls.LookupBtn__.OnClick = function () {
        LookupCompany(LookupCompanyCallback);
    };
}
function HideQuestionnaireTab(toHide) {
    const indexQuestionnaire = Sys.Helpers.Array.FindIndex(Wizard.steps, s => s.name === StepName.Questionnaire);
    if (toHide) {
        if (indexQuestionnaire >= 0) {
            Wizard.steps.splice(indexQuestionnaire, 1);
        }
        Controls.GlobalQuestionnairePane.Hide(true);
    }
    else if (!toHide && indexQuestionnaire < 0) {
        Wizard.steps.push(steps.questionnaire);
    }
    steps.questionnaire.hiddenStep = toHide;
    Controls.spacer6__.Hide(toHide);
    Controls.Questionnaire_Step__.Hide(toHide);
    if (User.profileRole !== "guest" && User.profileRole !== "vendor") {
        Controls.GlobalQuestionnairePane.Hide(toHide);
    }
    Wizard.HandlePreviousNextButtons(Wizard._currentStepId);
}
function ShowQuestionnaireIfNotEmpty(questionnairesApplied) {
    if (Object.keys(questionnairesApplied).length > 0) {
        HideQuestionnaireTab(false);
    }
    else {
        HideQuestionnaireTab(true);
    }
}
function QueryQuestionnaireAndShowIfNotEmpty() {
    if (User.isVendor && Variable.GetValueAsString("IsQuestionnaireActivated") === "1") {
        const getQuestionnaireOptions = {
            fields: {
                values: {
                    QuestionnaireType__: QuestionnaireType.companyQuestionnaire,
                    CompanyStructure__: Data.GetValue("CompanyStructure__"),
                    Country__: Data.GetValue("Country__"),
                    DiversityClassification__: Data.GetValue("DiversityClassification__"),
                    NbEmployees__: Data.GetValue("NumberOfEmployees__"),
                    TaxStatus__: Data.GetValue("TaxStatus__")
                }
            },
            success: ShowQuestionnaireIfNotEmpty,
            error: function (errorMessage) {
                Log.Error(errorMessage);
                HideQuestionnaireTab(true);
            }
        };
        Sys.QuestionnaireEngine.GetQuestionnaires(getQuestionnaireOptions);
    }
    else {
        HideQuestionnaireTab(true);
    }
}
function UnserializeQuestionnaire(QuestionnaireCtrl, forceInit = false) {
    if (!QuestionnaireCtrl.IsInit() || forceInit) {
        const content = Variable.GetValueAsString(QuestionnaireCtrl.GetName());
        if (content) {
            QuestionnaireCtrl.InitQuestionnaire(JSON.parse(content));
        }
        else {
            let getQuestionnaireOptions = {
                debug: true,
                dbInactiveRules: false,
                fields: {
                    values: {
                        QuestionnaireType__: QuestionnaireType.companyQuestionnaire,
                        CompanyStructure__: Data.GetValue("CompanyStructure__"),
                        Country__: Data.GetValue("Country__"),
                        DiversityClassification__: Data.GetValue("DiversityClassification__"),
                        NbEmployees__: Data.GetValue("NumberOfEmployees__"),
                        TaxStatus__: Data.GetValue("TaxStatus__")
                    }
                },
                success: function (questionnairesApplied) {
                    QuestionnaireCtrl.InitQuestionnaire(Object.keys(questionnairesApplied).length > 0 ? questionnairesApplied : null);
                    const userRole = User.profileRole;
                    const currentRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex());
                    if (userRole !== "guest" && userRole !== "vendor") {
                        if (currentRole === Lib.VendorRegistration.Workflow.roleApprover) {
                            Controls.GlobalQuestionnaire__.ResultLayout();
                        }
                        else {
                            Controls.GlobalQuestionnaire__.SetReadOnly(true);
                        }
                    }
                    ShowQuestionnaireIfNotEmpty(questionnairesApplied);
                },
                error: function (errorMessage) {
                    Log.Error(errorMessage);
                    if (Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex()) === Lib.VendorRegistration.Workflow.roleVendor) {
                        QuestionnaireCtrl.InitQuestionnaire(null);
                    }
                    else {
                        Controls.GlobalQuestionnairePane.Hide();
                    }
                }
            };
            // Get a list of questionnaires applicable on this process
            Sys.QuestionnaireEngine.GetQuestionnaires(getQuestionnaireOptions);
        }
    }
}
function LookupCompanyCallback(result) {
    let fields = [
        "Company__",
        "VendorRegistrationDUNSNumber__",
        "Street__",
        "Zip_Code__",
        "Mail_State__",
        "City__",
        "Phone_Number__",
        "NumberOfEmployees__",
        "Website__",
        "Country__",
        "CompanyStructure__"
    ];
    fields.push(Lib.VendorRegistration.Common.IsCountryUS() ? "TaxIdentificationNumber__" : "TaxID__");
    fields.forEach(field => {
        Data.SetValue(field, null);
    });
    Controls.ComboState__.SetAvailableValues([]);
    Variable.SetValueAsString(HighlightHandling.companyLookupVariable, "");
    if (result.error) {
        Popup.Alert(result.msg, false, null, result.popupTitle);
        Data.SetWarning("NationalID__", "_no entry found for this identifier.");
        if (User.isVendor) {
            Wizard.NextStep();
        }
    }
    else {
        Data.SetWarning("NationalID__", "");
        FillVendorFields(result);
        if (User.isVendor) {
            Wizard.NextStep();
        }
    }
    Variable.SetValueAsString("DunsValueChanged", "0");
}
let maxBankDetailIDCache = null;
function GetMaxBankDetailID() {
    if (!maxBankDetailIDCache) {
        const table = Controls.CompanyBankAccountsTable__;
        let maxValue = 0;
        let testValue;
        for (let i = 0; i < table.GetItemCount(); i++) {
            testValue = table.GetRow(i).BankDetailID__.GetValue();
            if (testValue > maxValue) {
                maxValue = testValue;
            }
        }
        maxBankDetailIDCache = maxValue;
    }
    maxBankDetailIDCache = maxBankDetailIDCache + 1;
    return maxBankDetailIDCache;
}
let maxContactIDCache = null;
function GetMaxContactID() {
    if (!maxContactIDCache) {
        const table = Controls.CompanyOfficersTable__;
        let maxValue = 0;
        let testValue;
        for (let i = 0; i < table.GetItemCount(); i++) {
            testValue = table.GetRow(i).CompanyOfficerID__.GetValue();
            if (testValue > maxValue) {
                maxValue = testValue;
            }
        }
        maxContactIDCache = maxValue;
    }
    maxContactIDCache = maxContactIDCache + 1;
    return maxContactIDCache;
}
function isVendorGuest() {
    return User.profileRole.toLowerCase() === "guest";
}
function InitUIForVendor() {
    ResetRegistrationWarnings();
    ResetIbanVerificationMessage();
    Process.ShowFirstErrorAfterBoot(false);
    Layout.ForVendor();
    Layout.InitUNSPSC();
    if (isVendorGuest()) {
        const quitBtn = Controls.form_header.GetActionControl("quit");
        if (quitBtn) {
            quitBtn.OnClick = function () {
                User.Logout();
            };
        }
        Controls.Close.OnClick = function () {
            User.Logout();
        };
    }
    Wizard.Init();
}
function InitUIForManagement() {
    ResetRegistrationWarnings();
    if (Number(Data.GetValue("State")) < 100) {
        EnableLookupButton();
        UpdateCommentPane();
    }
    Layout.ForManagement();
    Layout.AdaptForInquiryRequest();
    Layout.InitUNSPSC();
    Controls.Close.OnClick = function () {
        if (Variable.GetValueAsString("IsProcessModifiedByUser") === "true" || Data.GetValue("ProcessStatus__") !== "Draft" || Number(Data.GetValue("State")) === 300) {
            ProcessInstance.Quit("Quit");
        }
        else {
            ProcessInstance.Approve("OnCancel");
            return false;
        }
        return null;
    };
    UpdateWorkflowLayout();
}
function ValidateRequiredFieldsBaseFunction() {
    const currentRole = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex());
    Controls.Company__.Focus();
    Controls.Street__.Focus();
    Controls.Zip_Code__.Focus();
    Controls.City__.Focus();
    Controls.Phone_Number__.Focus();
    Controls.CreationDate__.Focus();
    Controls.CompanyStructure__.Focus();
    if (Lib.VendorRegistration.Common.IsCountryUS()) {
        Controls.TaxIdentificationNumber__.Focus();
    }
    else {
        Controls.TaxID__.Focus();
    }
    Controls.CompanyCode__.Focus();
    Controls.VendorNumber__.Focus();
    Sys.Helpers.Controls.ForEachTableRow(Controls.CompanyOfficersTable__, (row) => {
        row.FirstName__.Focus();
        row.LastName__.Focus();
        row.Email__.Focus();
    });
    if (Variable.GetValueAsString("VendorCategoryFeatureActivated") === "1" && currentRole === Lib.VendorRegistration.Workflow.roleRequester) {
        Controls.VendorCategory__.Focus();
    }
    const isCountryUS = Lib.VendorRegistration.Common.IsCountryUS();
    if (isCountryUS && !Controls.AddressForBankIsSameAsCompany__.IsChecked()) {
        Controls.CityForBank__.Focus();
        Controls.CountryForBank__.Focus();
        Controls.StreetForBank__.Focus();
        Controls.ZipCodeForBank__.Focus();
    }
    if (Lib.VendorRegistration.Common.IsVendorIndividual()) {
        Controls.FirstName__.Focus();
        Controls.LastName__.Focus();
    }
    PaymentManagement.ValidatePaymentTerms();
    PaymentManagement.ValidatePaymentMethod();
}
function ValidateRequiredFields() {
    const overloadedFunc = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.ValidateRequiredFields", ValidateRequiredFieldsBaseFunction) || null;
    if (overloadedFunc && typeof overloadedFunc === "function") {
        overloadedFunc();
    }
    else {
        ValidateRequiredFieldsBaseFunction();
    }
}
function UpdateWorkflowLayout() {
    const approversTableCtrl = Controls.Workflow__;
    // Make sure that at least the last 4 steps and the current step is displayed by default
    // and that following steps are displayed (upon to 5)
    let tIdx1 = Lib.VendorRegistration.Workflow.Controller.GetTableIndex() - 4;
    tIdx1 = tIdx1 < 0 ? 0 : tIdx1;
    const tIdx2 = approversTableCtrl.GetItemCount() - 10;
    if (approversTableCtrl.GetItemCount() >= 10) {
        approversTableCtrl.DisplayItem(approversTableCtrl.GetItemCount() - 1);
        approversTableCtrl.DisplayItem(tIdx1 < tIdx2 ? tIdx1 : tIdx2);
    }
}
function UpdateCommentPane() {
    Controls.CommentContent__.SetHTML("");
    if (Lib.VM.FON.IsTINWithOFACCheckEnabled()) {
        DisplayTINResult();
        DisplayOFACFONResults();
    }
    if (Lib.VendorRegistration.Common.Parameters.IsUSBankCheckEnabled()) {
        DisplayFONBankBannerMessage();
    }
    DisplayOFACResults();
    DisplayDuplicateWarning();
}
function GetNewConcatenatedText(previous = "", textToAppend = "", separator = "", prepend = false) {
    if (!previous) {
        return textToAppend;
    }
    else if (previous.indexOf(textToAppend) === -1) {
        const first = prepend ? textToAppend : previous;
        const second = prepend ? previous : textToAppend;
        const sep = first && second ? separator : "";
        return `${first}${sep}${second}`;
    }
    return "";
}
function AddHtml(control, html, prepend = false) {
    const newHtml = GetNewConcatenatedText(control.GetHTML(), html, "<br/><br/>", prepend);
    if (newHtml) {
        control.SetHTML(newHtml);
    }
}
function AddWarning(field, text, control = Data) {
    const newWarning = GetNewConcatenatedText(control.GetWarning(field), text, "\n");
    if (newWarning) {
        control.SetWarning(field, newWarning);
    }
}
function AddError(field, text, control = Data) {
    const newError = GetNewConcatenatedText(control.GetError(field), text, "\n");
    if (newError) {
        control.SetError(field, newError);
    }
}
function DisplayOFACResults() {
    const OFACResults = Lib.VendorRegistration.CheckOFAC.GetLastOFACResults();
    if (OFACResults.length) {
        const bannerWarningMessageHTML = getOFACBannerMessageHTML(OFACResults);
        AddHtml(Controls.CommentContent__, bannerWarningMessageHTML, true);
        Controls.CommentPane.Hide(false);
        DisplayOFACWarnings();
    }
}
function getOFACBannerMessageHTML(OFACResults) {
    let retStr = Language.Translate("_OFACSanctionsListsHits", false);
    retStr += "<br/><div class=\"Link\">";
    retStr += Lib.VendorRegistration.CheckOFAC.FormatOFACDisplay(OFACResults, true);
    retStr += Language.Translate("_OFACWebsite", false);
    retStr += `<a id = "OFACWebSite" class="nav-link" onclick="window.open('${Sys.OFAC.Common.OFACGeneralInfoURL}');" >`;
    retStr += ` ${Sys.OFAC.Common.OFACGeneralInfoURL}`;
    retStr += "</a></div>";
    return retStr;
}
function DisplayOFACWarnings() {
    const OFACWarnings = Lib.VendorRegistration.CheckOFAC.GetLastOFACWarnings();
    if (OFACWarnings && Object.keys(OFACWarnings).length > 0) {
        const trad = Sys.OFAC.Common.OFAC_RESULT_WARNING_MESSAGE;
        for (const prop of OFACWarnings.fields) {
            AddWarning(prop, trad);
        }
        for (const table of OFACWarnings.tables) {
            AddWarning(table.column, trad, Data.GetTable(table.name).GetItem(table.line));
        }
    }
}
function DisplayTINResult() {
    const TINMatchResult = Lib.VM.FON.GetLastTINMatchResult();
    if (TINMatchResult && !Lib.VM.FON.IsGoodTINMatchCode(TINMatchResult.TINNAME_CODE)) {
        const bannerWarningMEssageHTML = GetTINMatchBannerMessage(TINMatchResult);
        AddHtml(Controls.CommentContent__, bannerWarningMEssageHTML, true);
        Controls.CommentPane.Hide(false);
        AddWarning("TaxIdentificationNumber__", TINMatchResult.TINNAME_DETAILS);
    }
}
function GetTINMatchBannerMessage(TINMatchResult) {
    if (TINMatchResult.ERROR_DETAILS) {
        if (TINMatchResult.ERROR_DETAILS.indexOf(Sys.VM.FONError.InvalidBearerToken) !== -1) {
            return Language.Translate("_TINMatchAuthenticationFailed");
        }
        return `${Language.Translate("_TINMatchWarning", false)} ${Language.Translate(TINMatchResult.ERROR_DETAILS, false)}`;
    }
    return `${Language.Translate("_TINMatchWarning", false)}<br/><div class="Link">${Lib.VM.FON.FormatTINDisplay(TINMatchResult, true)}</div>`;
}
function DisplayOFACFONResults() {
    const OFACResults = Lib.VM.FON.GetLastOFACResults();
    if (OFACResults && Object.keys(OFACResults).length > 1) {
        const bannerWarningMessageHTML = GetOFACFONBannerMessage(OFACResults);
        AddHtml(Controls.CommentContent__, bannerWarningMessageHTML, true);
        Controls.CommentPane.Hide(false);
    }
}
function DisplayFONBankBannerMessage() {
    var _a;
    const FONBankCheckResults = Variable.GetValueAsString("FONBankCheckResults");
    const FONResults = JSON.parse(FONBankCheckResults);
    if (FONResults) {
        for (let FONmessage of FONResults) {
            if (((_a = FONmessage.details) === null || _a === void 0 ? void 0 : _a.indexOf(Sys.VM.FONError.InvalidBearerToken)) !== -1) {
                AddHtml(Controls.CommentContent__, Language.Translate("_FONMatchAuthenticationFailed"), true);
                Controls.CommentPane.Hide(false);
                return;
            }
        }
    }
}
function GetOFACFONBannerMessage(OFACResults) {
    let retStr = "";
    if (OFACResults.TECHNICAL_ERROR) {
        retStr += Language.Translate("_FONOFACTechnicalError");
    }
    else {
        retStr += Language.Translate("_OFACSanctionsListsHits", false);
        retStr += "<br/><div class=\"Link\">";
        retStr += Lib.VM.FON.FormatOFACDisplay(OFACResults, true);
        retStr += "</div>";
    }
    return retStr;
}
function DisplayDuplicateWarning() {
    const vendorsDuplicates = Sys.Helpers.GetSerializedObjectFromVariable(Lib.VendorRegistration.CheckDuplicateVendor.KEY_VENDORS_DUPLICATES, null);
    if (vendorsDuplicates) {
        const bannerWarningMessageHTML = getVendorBannerMessageHTML(vendorsDuplicates.vendorsInformations);
        AddHtml(Controls.CommentContent__, bannerWarningMessageHTML);
        Controls.CommentPane.Hide(false);
        const warningMessage = Language.Translate(warningMessageTradKey, false);
        DisplayRegistrationDuplicatesWarnings(vendorsDuplicates, warningMessage);
    }
    else {
        const pendingRegistrationDuplicates = Sys.Helpers.GetSerializedObjectFromVariable(Lib.VendorRegistration.CheckDuplicateVendor.KEY_PENDING_REGISTRATION_DUPLICATES, null);
        if (pendingRegistrationDuplicates) {
            const bannerWarningMessageHTML = Language.Translate("_A pending registration already exists with the same information", false);
            AddHtml(Controls.CommentContent__, bannerWarningMessageHTML);
            Controls.CommentPane.Hide(false);
            const warningMessage = Language.Translate(warningMessageTradKey, false);
            DisplayRegistrationDuplicatesWarnings(pendingRegistrationDuplicates, warningMessage);
        }
    }
}
function CheckDuplicateCompanyCode() {
    if (!Lib.VendorRegistration.InternalRequest.IsInternalCloneRequest()) {
        return;
    }
    const companyCode = Data.GetValue("CompanyCode__");
    const vendorNumber = Data.GetValue("VendorNumber__");
    if (companyCode) {
        const vendorsDuplicates = Sys.Helpers.GetSerializedObjectFromVariable(Lib.VendorRegistration.CheckDuplicateVendor.KEY_VENDORS_DUPLICATES, null);
        if (vendorsDuplicates) {
            let duplicateCompanyCode = vendorsDuplicates.vendorsInformations.find((vendorInfo) => vendorInfo.companyCode.toString() === companyCode && vendorInfo.vendorNumber.toString() === vendorNumber);
            if (duplicateCompanyCode) {
                Controls.CompanyCode__.SetRequired(true);
                Controls.CompanyCode__.SetError(Language.Translate("_DuplicateCompanyCode", false, companyCode));
            }
        }
    }
}
function getVendorBannerMessageHTML(vendorsInformations) {
    let bannerWarningMessageHTML = Language.Translate(warningMessageTradKey, false);
    bannerWarningMessageHTML += "<br/>";
    bannerWarningMessageHTML += Language.Translate("_You can consult duplicate vendors informations below", false);
    for (const informations of vendorsInformations) {
        bannerWarningMessageHTML += "<br/>&#32;&#45;&#32;";
        bannerWarningMessageHTML += Language.Translate("_Company code: {0}, Vendor number: {1}", false, informations.companyCode, informations.vendorNumber);
    }
    return bannerWarningMessageHTML;
}
function DisplayWarningsOnProperties(propertyNames, warningMessage) {
    for (const propertyName of propertyNames) {
        AddWarning(propertyName, warningMessage);
    }
}
function DisplayWarningsOnTableColumns(tables, warningMessage) {
    for (const duplicateTable of tables) {
        const table = Data.GetTable(duplicateTable.name);
        for (let itemCounter = 0; itemCounter < table.GetItemCount(); itemCounter++) {
            const rowItem = table.GetItem(itemCounter);
            for (const duplicate of duplicateTable.duplicates) {
                const columnValue = rowItem.GetValue(duplicate.column);
                if (columnValue && duplicate.value.toLowerCase() === columnValue.toLowerCase()) {
                    AddWarning(duplicate.column, warningMessage, rowItem);
                    break;
                }
            }
        }
    }
}
function DisplayRegistrationDuplicatesWarnings(registrationDuplicates, warningMessage) {
    DisplayWarningsOnProperties(registrationDuplicates.propertiesNames, warningMessage);
    DisplayWarningsOnTableColumns(registrationDuplicates.tables, warningMessage);
}
function ResetRegistrationWarningsTable(tableName, dataToCheck) {
    const table = Data.GetTable(tableName);
    for (let i = 0; i < table.GetItemCount(); i++) {
        const item = table.GetItem(i);
        if (item) {
            for (const column in dataToCheck[tableName]) {
                if ({}.hasOwnProperty.call(dataToCheck[tableName], column)) {
                    item.SetWarning(column, null);
                }
            }
        }
    }
}
function ResetRegistrationWarnings() {
    let dataToCheck = Sys.Helpers.GetSerializedObjectFromVariable(Lib.VendorRegistration.CheckDuplicateVendor.KEY_PENDING_REGISTRATION_TO_CHECK, null);
    dataToCheck = Lib.VendorRegistration.CheckOFAC.ExtendRegistrationWarningFields(dataToCheck);
    for (const prop in dataToCheck) {
        if (typeof dataToCheck[prop] === "string") {
            Data.SetWarning(prop, null);
        }
        else if (typeof dataToCheck[prop] === "object") {
            ResetRegistrationWarningsTable(prop, dataToCheck);
        }
    }
}
function ResetIbanVerificationMessage() {
    const bankDetailsControl = Controls.CompanyBankAccountsTable__;
    for (let i = 0; i < bankDetailsControl.GetLineCount(); i++) {
        const row = bankDetailsControl.GetRow(i);
        const item = row.GetItem();
        if (item) {
            item.SetInfo("BankIBANScore__", "");
            item.SetWarning("BankIBANScore__", "");
            item.SetError("BankIBANScore__", "");
        }
        const ibanControl = row.BankIBANScore__;
        ibanControl.RemoveStyle(highlightStyles.error);
        ibanControl.RemoveStyle(highlightStyles.warning);
        ibanControl.RemoveStyle(highlightStyles.success);
    }
}
async function ValidateForm() {
    BankAccountsManagement.SetAllReadOnlyAndRequiredFields();
    PaymentManagement.ValidatePaymentMethod();
    PaymentManagement.ValidatePaymentTerms();
    IBAN.ValidateAll();
    await TaxRegistrationNumber.Validate();
}
async function initUI() {
    if (User.isVendor) {
        InitUIForVendor();
    }
    else {
        InitUIForManagement();
        HighlightHandling.HighlightUpdatedFields();
        if (!Sys.Helpers.IsEmpty(Data.GetValue("ERPPostingError__"))) {
            Data.SetWarning("VendorNumber__", Data.GetValue("ERPPostingError__"));
        }
        if (SisID.IsEnabled()) {
            SisID.Init();
        }
        if (FON_BankCheck.IsEnabled()) {
            FON_BankCheck.Init();
        }
        if (Parameters.IsSisIDEnabled() || Parameters.IsUSBankCheckEnabled()) {
            Controls.CompanyBankAccountsTable__.BankIBANScore__.Hide(false);
        }
    }
    BankAccountsManagement.Init();
    HideQuestionnaireTab(true);
    if (Parameters.IsSisIDEnabled()) {
        Controls.TaxID__.SetHelpData("_TheFilledValueWillBeUsedFor3rdPartyServiceSISIDChecks", "2573", "HTML Format", "Right");
        Controls.TaxIdentificationNumber__.SetHelpData("_TheFilledValueWillBeUsedFor3rdPartyServiceSISIDChecks", "2573", "HTML Format", "Right");
    }
    InitTablesLineIds();
    await ValidateForm();
    if (ComplianceRisk.IsEnabled()) {
        await ComplianceRisk.Init();
    }
}
function InitTableLineIds(tableCtrl, idFieldName) {
    if (tableCtrl && tableCtrl.GetRow(0)[idFieldName].GetValue() === null) {
        for (let i = 0; i < tableCtrl.GetItemCount(); i++) {
            tableCtrl.GetRow(i)[idFieldName].SetValue(i);
        }
    }
}
function InitTablesLineIds() {
    InitTableLineIds(Controls.CompanyOfficersTable__, "CompanyOfficerID__");
    InitTableLineIds(Controls.CompanyBankAccountsTable__, "BankDetailID__");
}
function InitConversation() {
    // Create conversation and show conversation pane only if we have both parts of the conversation
    let hideConversationPane = true;
    if (Lib.VendorRegistration.Workflow.Controller.GetTableIndex() > Lib.VendorRegistration.Workflow.Controller.GetRoleSequenceIndex(Lib.VendorRegistration.Workflow.roleVendor)) {
        hideConversationPane = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.HideConversationPane", Lib.VendorRegistration.Workflow.Controller, Controls.ConversationPane.IsVisible()) || false;
        let options = Lib.P2P.Conversation.defaultOptions;
        if (User.isVendor) {
            options.fromEmailAddress = Lib.P2P.EmailNotification.GetDefaultFromAddress();
        }
        const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({ Options: options }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
        Controls.ConversationUI__.Init(conversationInfo);
    }
    Controls.ConversationPane.Hide(hideConversationPane);
}
function CheckPendingRegistrationStatus() {
    if (!isVendorGuest() && Variable.GetValueAsString("AlreadyPendingRegistrationUpdate") === "true") {
        // Show an error popup and leave the form
        Popup.Alert("_ErrorMessageDuplicateRegistrationUpdate", false, function () {
            ProcessInstance.Quit("Quit");
        }, "_ErrorTitleDuplicateRegistrationUpdate");
    }
}
/**
 * Notify source process the VR has been submitted
 */
function NotifySourceProcess() {
    var _a, _b, _c;
    const localStorageNotification = Process.GetURLParameter("ls");
    const params = Process.GetURLParameter("ls-params");
    if (localStorageNotification) {
        const localStorageData = {
            data: {
                RuidEx: Data.GetValue("RuidEx"),
                State: Data.GetValue("State"),
                Company__: Data.GetValue("Company__"),
                MailSub__: Data.GetValue("MailSub__"),
                Street__: Data.GetValue("Street__"),
                POBox__: Data.GetValue("POBox__"),
                City__: Data.GetValue("City__"),
                Zip_Code__: Data.GetValue("Zip_Code__"),
                Mail_State__: Data.GetValue("Mail_State__"),
                Country__: Data.GetValue("Country__"),
                Website__: Data.GetValue("Website__"),
                Phone_Number__: Data.GetValue("Phone_Number__"),
                Email__: (_a = Data.GetTable("CompanyOfficersTable__").GetItem(0).GetValue("Email__")) === null || _a === void 0 ? void 0 : _a.trim(),
                FirstName__: (_b = Data.GetTable("CompanyOfficersTable__").GetItem(0).GetValue("FirstName__")) === null || _b === void 0 ? void 0 : _b.trim(),
                LastName__: (_c = Data.GetTable("CompanyOfficersTable__").GetItem(0).GetValue("LastName__")) === null || _c === void 0 ? void 0 : _c.trim()
            },
            params: params
        };
        Data.StorageSetValue(localStorageNotification, JSON.stringify(localStorageData));
        Data.CleanLocalStorage(localStorageNotification);
    }
}
//function to handle third party popup
function fillThirdPartyDialog(dialog) {
    const ctrlSelectedThirdPartyIndex = dialog.AddText("SelectedThirdPartyIndex__");
    ctrlSelectedThirdPartyIndex.Hide(true);
    if (ComplianceRisk.thirdParties.length === 1) {
        ctrlSelectedThirdPartyIndex.SetValue("0");
    }
    else {
        const ctrlDescription = dialog.AddDescription("ThirdPartyDescription__");
        ctrlDescription.SetText(Language.Translate("_SelectThirdPartyDescription"));
        const ctrlTable = dialog.AddTable("ThirdPartyDetails__");
        ctrlTable.AddTextColumn("Name__", "_ThirdPartyName", 150);
        ctrlTable.AddTextColumn("Address__", "_ThirdPartyAddress", 250);
        ctrlTable.AddTextColumn("Zip_Code__", "_ThirdPartyZip_Code", 100);
        ctrlTable.AddTextColumn("CityName__", "_ThirdPartyCityName", 150);
        ctrlTable.AddTextColumn("Country__", "_ThirdPartyCountry", 100);
        ctrlTable.AddTextColumn("BusinessType__", "_BusinessType", 150);
        const ctrlIndex = ctrlTable.AddTextColumn("Index__");
        ctrlIndex.Hide(true);
        ctrlTable.SetRowToolsHidden(true);
        ctrlTable.HideTopNavigation(true);
        ctrlTable.SetReadOnly(true);
        ctrlTable.SetLineCount(5);
        for (let i = 0; i < ComplianceRisk.thirdParties.length; i++) {
            if (!ComplianceRisk.thirdParties[i].monitored) {
                const businessType = ComplianceRisk.thirdParties[i].headquarter ? "_HeadquartersBusiness" : "_SecondaryBusiness";
                const row = ctrlTable.AddItem(false);
                row.SetValue("Name__", ComplianceRisk.thirdParties[i].name);
                row.SetValue("Address__", ComplianceRisk.thirdParties[i].addressStreet);
                row.SetValue("Zip_Code__", ComplianceRisk.thirdParties[i].addressPostCode);
                row.SetValue("CityName__", ComplianceRisk.thirdParties[i].addressCity);
                row.SetValue("Country__", ComplianceRisk.thirdParties[i].addressCountryCode);
                row.SetValue("BusinessType__", Language.Translate(businessType));
                row.SetValue("Index__", i);
            }
        }
        const ctrlErrorMessage = dialog.AddDescription("SelectedThirdPartyErrorMessage__");
        ctrlErrorMessage.Hide(true);
        ctrlErrorMessage.SetErrorStyle();
        ctrlErrorMessage.SetText(Language.Translate("_SelectThirdPartyError"));
        dialog.AddSeparator();
    }
    if (ComplianceRisk.attributDefinitions == null) {
        ComplianceRisk.attributDefinitions = [];
    }
    else if (ComplianceRisk.attributDefinitions.length > 0) {
        const ctrlAttributesDescription = dialog.AddDescription("AttributesDescription__");
        ctrlAttributesDescription.SetText(Language.Translate("_AttributesDescription"));
        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.SetAttributeDefinitionsDisplayOrder", ComplianceRisk.attributDefinitions);
        ComplianceRisk.attributDefinitions.forEach(attribute => {
            const controlName = "Attribute_" + attribute.id;
            switch (attribute.type) {
                case "string":
                    dialog.AddText(controlName, attribute.label, "250");
                    break;
                case "integer":
                    dialog.AddInteger(controlName, attribute.label, "250");
                    break;
                case "decimal":
                case "percentage":
                    dialog.AddDecimal(controlName, attribute.label, "250");
                    break;
                case "boolean":
                    dialog.AddCheckBox(controlName, attribute.label);
                    break;
                case "list_unique":
                case "list_multiple":
                    {
                        const control = dialog.AddComboBox(controlName, attribute.label, "200");
                        let options = [];
                        if (attribute.type === "list_multiple") {
                            control.SetMultiple(true, true);
                        }
                        else {
                            options.push({ key: "", value: "" });
                        }
                        attribute.values.forEach(value => {
                            options.push({ key: value.value, value: value.value });
                        });
                        control.AddOptions(options);
                        break;
                    }
                default:
                    break;
            }
        });
        dialog.AddSeparator();
    }
    const ctrlEmailDescription = dialog.AddDescription("EmailDescription__");
    ctrlEmailDescription.SetText(Language.Translate("_EmailDescription"));
    const ctrlEmail = dialog.AddText("ContactEmail__", "_ContactEmail", "300");
    ctrlEmail.SetValue(Controls.CompanyOfficersTable__.GetRow(0).Email__.GetValue());
    dialog.RequireControl(ctrlEmail);
    let addButton = dialog.AddButton("AddButton", "_StartFollowing");
    addButton.SetSubmitStyle();
    dialog.AddButton("CancelButton", "_Cancel");
    dialog.HideDefaultButtons();
}
function commitThirdPartyDialog(dialog) {
    const index = parseInt(dialog.GetControl("SelectedThirdPartyIndex__").GetValue(), 10);
    const thirdParty = ComplianceRisk.thirdParties[index];
    let attributes = [];
    ComplianceRisk.attributDefinitions.forEach(attribute => {
        const control = dialog.GetControl("Attribute_" + attribute.id);
        let values = [];
        if (attribute.type === "list_multiple") {
            values = control.GetSelectedOptions();
        }
        else if (attribute.type === "list_unique") {
            if (control.GetSelectedOption() !== "") {
                values.push(control.GetValue());
            }
        }
        else if (control.GetValue() != null && control.GetValue() !== "") {
            values.push(control.GetValue());
        }
        if (values.length > 0) {
            attributes.push({
                label: attribute.label,
                values: values
            });
        }
    });
    let response = {
        "id": thirdParty.id,
        "isIdEncrypted": thirdParty.isIdEncrypted,
        "email": dialog.GetControl("ContactEmail__").GetValue(),
        "attributes": attributes
    };
    ComplianceRisk.popupCallback(response);
}
function cancelThirdPartyDialog() {
    ComplianceRisk.popupCallback({ cancel: true });
}
function HandleThirdPartyDialog(dialog, tabId, event, control, row) {
    const controlName = control.GetName();
    switch (controlName) {
        case "AddButton":
            dialog.Commit();
            break;
        case "CancelButton":
            dialog.Cancel();
            break;
        default:
            if (event === "OnRefreshRow") {
                dialog.PlaceInMiddle();
                const ctrlRow = control.GetRow(row);
                const ctrlSelectedIndex = dialog.GetControl("SelectedThirdPartyIndex__").GetValue();
                if (ctrlSelectedIndex != null && ctrlSelectedIndex.toString() === ctrlRow.Index__.GetValue().toString()) {
                    ctrlRow.AddStyle("highlight");
                }
                else {
                    ctrlRow.RemoveStyle("highlight");
                }
            }
            if (event === "OnClick") {
                control.RemoveStyle("highlight");
                row.AddStyle("highlight");
                dialog.GetControl("SelectedThirdPartyIndex__").SetValue(row.Index__.GetValue().toString());
                dialog.GetControl("SelectedThirdPartyErrorMessage__").Hide();
            }
            break;
    }
    Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnHandleThirdPartyDialog", dialog, tabId, event, control, row);
}
function ValidateThirdPartyDialog(dialog, tabId, event, control) {
    if (dialog.GetControl("SelectedThirdPartyIndex__").GetValue() == null) {
        dialog.GetControl("SelectedThirdPartyErrorMessage__").Hide(false);
        return false;
    }
    const customValidation = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnValidateThirdPartyDialog", dialog, tabId, event, control);
    if (typeof customValidation === "boolean") {
        return customValidation;
    }
    return true;
}
//#endregion
async function Main() {
    if (Process.GetURLParameter("closeTabOnLoad") === "1" && !Process.ShowFirstError()) {
        NotifySourceProcess();
        Process.CloseTab();
        return;
    }
    ProcessInstance.SetSilentChange(true);
    Controls.form_header.Wait(true, "", false);
    DnBObject.isDnBConfigured = Variable.GetValueAsString("isDnBConfigured__") === "1";
    if (DnBObject.isDnBConfigured) {
        DnBObject.options.isVendorLookupEnabled = Variable.GetValueAsString("DnBCompanyInformation__") === "1";
        DnBObject.options.shouldInsertUNSPSCFromDNB = Variable.GetValueAsString("ShouldInsertUNSPSCFromDNB__") === "1";
    }
    Wizard.hideFirstStep = !DnBObject.isDnBConfigured
        || !DnBObject.options.isVendorLookupEnabled
        || Data.GetValue("RegistrationType__") === "update"
        || Number(Data.GetValue("State")) >= 100
        || ProcessInstance.isReadOnly
        || Lib.VendorRegistration.InternalRequest.IsInternalCloneRequest();
    InitEvents();
    Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnHTMLScriptEndSync");
    await Parameters.SynchronizeConfig();
    await ComplianceRisk.LoadConfiguration();
    await FON.LoadConfiguration();
    CheckPendingRegistrationStatus();
    InitWorkflow();
    Layout.General();
    if (!Lib.VendorRegistration.InternalRequest.IsInternalRequest()) {
        InitConversation();
    }
    await CountryManagement.Init();
    await BankAddress.Init();
    await initUI();
    Log.Info("HTML page script execution complete");
    Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.OnHTMLScriptEnd", Lib.VendorRegistration.Workflow.Controller.GetCurrentStepRole());
    Lib.VendorRegistration.Workflow.Controller.Rebuild();
    const currentStepRole = Lib.VendorRegistration.Workflow.Controller.GetCurrentStepRole();
    // Prevent unauthorized users from creating a new vendor registration
    // On portal side user cannot have the roleRequester -> always false
    if (!ProcessInstance.isReadOnly
        && currentStepRole === Lib.VendorRegistration.Workflow.roleRequester
        && !Lib.VendorRegistration.Client.UserCanStartVendorRegistration(User)) {
        Popup.Alert("_NoPermissionToCreateVendorRegistration", false, () => { Controls.Close.OnClick(); }, "_NoPermissionToCreateVendorRegistration_title");
    }
    Controls.form_header.Wait(false);
    // If user is administrator (not vendor and not simple user)
    if (!User.isVendor && User.profileRole !== "simpleUser") {
        ProcessInstance.SetSilentChange(false);
    }
    switch (Data.GetValue("RegistrationType__")) {
        case registrationType.registration:
            Controls.LifeCyclePane.Hide(true);
            break;
        case registrationType.update:
            Controls.LifeCyclePane.Hide(User.isVendor);
            break;
    }
}
Main();
//# sourceMappingURL=customscript.js.map