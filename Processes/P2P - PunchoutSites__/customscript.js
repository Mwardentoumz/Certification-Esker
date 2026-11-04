"use strict";
/* eslint-disable @typescript-eslint/quotes */
var CustomScript;
(function (CustomScript) {
    let g_topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
    const contractControls = [
        Controls.ContractRUIDEX__,
        Controls.OriginalContractRUIDEX__,
        Controls.ContractNumber__,
        Controls.ContractReferenceNumber__,
        Controls.ContractName__
    ];
    const onContractSelectedItem = function (item) {
        Controls.ContractRUIDEX__.SetValue(item.GetValue("RUIDEX"));
        Controls.OriginalContractRUIDEX__.SetValue(item.GetValue("OriginalContractRUIDEX__"));
        Controls.ContractNumber__.SetValue(item.GetValue("ContractNumber__"));
        Controls.ContractReferenceNumber__.SetValue(item.GetValue("ReferenceNumber__"));
        Controls.ContractName__.SetValue(item.GetValue("Name__"));
    };
    const onContractResetOrUnknown = function () {
        for (const control of contractControls) {
            control.SetValue(null);
        }
    };
    function ValidateContract() {
        const hasContract = contractControls.some(control => !Sys.Helpers.IsEmpty(control.GetValue()));
        const isUniversalSite = Sys.Helpers.IsEmpty(Controls.CompanyCode__.GetValue());
        Controls.ContractName__.SetError(isUniversalSite && hasContract ? "_PunchoutContractRequiresCompanyCode" : "");
    }
    class CompanyCodeManager {
        constructor() {
            this.companyCode = Controls.CompanyCode__.GetValue();
        }
        Initialize() {
            Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.CompanyCode__, this.OnCompanyCodeChange.bind(this), this.OnCompanyCodeChange.bind(this), this.OnCompanyCodeChange.bind(this));
            this.LoadConfiguration();
        }
        LoadConfiguration() {
            const companyCodeValues = Lib.P2P.CompanyCodesValue.GetValues(this.companyCode);
            if (Object.keys(companyCodeValues).length > 0) {
                Lib.P2P.ChangeConfiguration(companyCodeValues.DefaultConfiguration__);
            }
        }
        HasDependencies() {
            return contractControls.some(control => !Sys.Helpers.IsEmpty(control.GetValue()))
                || !Sys.Helpers.IsEmpty(Controls.SupplierID__.GetValue())
                || !Sys.Helpers.IsEmpty(Controls.SupplyTypeId__.GetValue());
        }
        UpdateCompanyCodeDependencies() {
            this.companyCode = Controls.CompanyCode__.GetValue();
            onContractResetOrUnknown();
            Controls.SupplierID__.SetValue("");
            Controls.SupplyTypeId__.SetValue("");
            this.LoadConfiguration();
        }
        RevertCompanyCode() {
            Controls.CompanyCode__.SetValue(this.companyCode);
        }
        OnCompanyCodeChange() {
            if (this.HasDependencies()) {
                setTimeout(() => {
                    const controlLabels = [Controls.SupplierID__, Controls.ContractName__, Controls.ContractReferenceNumber__, Controls.SupplyTypeId__].map(control => `- ${Language.Translate(control.GetLabel())}`).join("\n");
                    Popup.Confirm(["_This action will delete company code related fields.", controlLabels], false, () => this.UpdateCompanyCodeDependencies(), () => this.RevertCompanyCode(), "_Warning");
                });
            }
            else {
                this.companyCode = Controls.CompanyCode__.GetValue();
                this.LoadConfiguration();
            }
        }
    }
    new CompanyCodeManager().Initialize();
    Controls.ContractName__.DisableExposedColumnImplicitRequest();
    Controls.ContractReferenceNumber__.DisableExposedColumnImplicitRequest();
    Controls.ContractNumber__.DisableExposedColumnImplicitRequest();
    Controls.ContractName__.SetAutocompletable(true);
    Controls.ContractName__.SetDisplayedColumns("Name__|ReferenceNumber__|ContractNumber__");
    Controls.ContractName__.SetAttributes("RUIDEX|OriginalContractRUIDEX__");
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ContractName__, onContractSelectedItem, onContractResetOrUnknown, onContractResetOrUnknown);
    Lib.Purchasing.Contract.SetFilterAvailableContracts(Controls.ContractName__, null);
    ValidateContract();
    Controls.ContractRUIDEX__.Hide(true);
    Controls.OriginalContractRUIDEX__.Hide(true);
    Controls.ContractNumber__.Hide(true);
    Controls.ContractReferenceNumber__.Hide(true);
    Controls.ContractReferenceNumber__.SetReadOnly(true);
    Controls.ContractName__.Hide(true);
    Sys.Parameters.GetInstance("P2P").PromisedIsReady().Then(() => {
        const contractEnabled = Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableContractGlobalSetting", false);
        Controls.ContractName__.Hide(!contractEnabled);
        Controls.ContractReferenceNumber__.Hide(!contractEnabled);
    });
    const usersOrGroupsOptions = Lib.P2P.UsersBrowseOptions.GetUsersOrGroupsOptions({
        placeholder: "_PunchoutSelectOrEnterAtLeastOneEmailAddress",
        groupsLabel: "_Punchout_Group_Group",
        usersLabel: "_Punchout_Group_User",
        displayedColumns: "DisplayName|IsGroup"
    });
    Lib.P2P.UsersBrowse.Init({
        browsedControl: Controls.AllowedUsersOrGroups__,
        storageName: "TechnicalAllowedUsersOrGroups__",
        storageType: Lib.P2P.UsersBrowse.StorageType.Control,
        dialogTitle: "_UserPopup_Title",
        select2CtrlOptions: usersOrGroupsOptions,
        select2CtrlLabel: "_UserPopup_UsersOrGroups"
    });
    // Hide this button which has been removed in S149
    if (Controls.ShowSecret__) {
        Controls.ShowSecret__.Hide(true);
    }
    // Hide this button which has been removed in S149
    if (Controls.Currency__) {
        Controls.Currency__.Hide(true);
    }
    let idUrlTrustedWithSpinnerByControlName = {};
    // Trusted local cache. true/false
    let isTrustedByControlName = {};
    let checkUrlsTrustedCallbackId = 0;
    // Hide "buyer email" part
    Controls.Spacer_line2__.Hide(true);
    Controls.User__.Hide(true);
    // Hide fields in test part
    Controls.TestLogin__.Hide(true);
    Controls.TestName__.Hide(true);
    Controls.TestRequest__.Hide(true);
    Controls.TestResponse__.Hide(true);
    Controls.TestPunchout__.SetDisabled(true);
    Controls.TestPunchout__.SetText("_TestPunchout");
    Controls.OverrideCredentials__.SetHelpData(Language.Translate("_OverrideCredentials tooltip"));
    CheckUrlsTrusted();
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    Controls.Enabled__.OnChange = function () {
        CheckUrlsTrusted();
    };
    Controls.PunchoutOrderURL__.OnChange = function () {
        isTrustedByControlName[this.GetName()] = null;
        CheckUrlsTrusted();
    };
    Controls.PunchoutURL__.OnChange = function () {
        isTrustedByControlName[this.GetName()] = null;
        CheckUrlsTrusted();
    };
    Controls.SenderIdentity__.OnChange = function () {
        UpdatePunchoutTestButton();
    };
    Controls.Identity__.OnChange = function () {
        UpdatePunchoutTestButton();
    };
    Controls.Secret__.OnChange = function () {
        UpdatePunchoutTestButton();
    };
    Controls.OverrideCredentials__.OnChange = function () {
        if (Controls.OverrideCredentials__.GetValue()) {
            Controls.TestLogin__.Hide(false);
            Controls.TestName__.Hide(false);
        }
        else {
            Controls.TestLogin__.Hide(true);
            Controls.TestName__.Hide(true);
        }
    };
    Controls.SupplierID__.OnChange = function () {
        onContractResetOrUnknown();
    };
    Controls.TestPunchout__.OnClick = function () {
        Controls.TestRequest__.SetHTML("");
        Controls.TestResponse__.SetHTML("");
        Controls.TestStatus__.SetValue("");
        Controls.TestName__.SetReadOnly(true);
        Controls.TestLogin__.SetReadOnly(true);
        Controls.TestPunchout__.SetDisabled(true);
        Controls.TestStatus__.SetImageURL("loading.gif");
        let user = "";
        let email = "";
        if (Controls.OverrideCredentials__.GetValue()) {
            user = Controls.TestName__.GetValue();
            email = Controls.TestLogin__.GetValue();
        }
        let config = {
            user: user,
            email: email,
            TestMode__: Controls.TestMode__.GetValue(),
            PunchoutURL__: Controls.PunchoutURL__.GetValue(),
            SenderDomain__: Controls.SenderDomain__.GetValue(),
            SenderIdentity__: Controls.SenderIdentity__.GetValue(),
            Domain__: Controls.Domain__.GetValue(),
            Identity__: Controls.Identity__.GetValue(),
            Secret__: Controls.Secret__.GetValue()
        };
        let onPunchoutOpenResult = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.OnPunchoutOpen");
        if (onPunchoutOpenResult) {
            config.extrinsic = onPunchoutOpenResult.extrinsic;
            if (onPunchoutOpenResult.notSendUserAgent) {
                config.notSendUserAgent = onPunchoutOpenResult.notSendUserAgent;
            }
        }
        Punchout.Test(config, function (data) {
            let result;
            if (data.httpRequest) {
                result = {};
                HighlightSpecialChars(data.httpRequest, result);
                Controls.TestRequest__.SetHTML(result.html);
                Controls.TestRequest__.SetCSS(result.css);
            }
            if (data.httpResponse) {
                result = {};
                HighlightSpecialChars(data.httpResponse, result);
                Controls.TestResponse__.SetHTML(result.html);
                Controls.TestResponse__.SetCSS(result.css);
            }
            if (!data.error) {
                Controls.TestStatus__.RemoveStyle("highlight-danger");
                Controls.TestStatus__.AddStyle("highlight-success");
                Controls.TestStatus__.SetValue(Language.Translate("_Success"));
            }
            else {
                Controls.TestStatus__.RemoveStyle("highlight-success");
                Controls.TestStatus__.AddStyle("highlight-danger");
                let errorMessage = Language.Translate("_Fail") + "\n" + data.error;
                if (data.errorMessage) {
                    errorMessage += "\n" + data.errorMessage;
                }
                Controls.TestStatus__.SetValue(errorMessage);
            }
            Controls.TestName__.SetReadOnly(false);
            Controls.TestLogin__.SetReadOnly(false);
            Controls.TestPunchout__.SetDisabled(false);
            Controls.TestStatus__.SetImageURL();
        });
        Controls.TestStatus__.Hide(false);
        Controls.TestRequest__.Hide(false);
        Controls.TestResponse__.Hide(false);
    };
    function OnQuickAccessChange() {
        const isQuickAccessEnabled = Controls.EnableQuickAccess__.GetValue();
        Controls.DisplayName__.SetRequired(isQuickAccessEnabled);
    }
    Controls.EnableQuickAccess__.OnChange = OnQuickAccessChange;
    OnQuickAccessChange();
    function CheckUrlsTrusted() {
        checkUrlsTrustedCallbackId++;
        // Set some fields to required if we try to enable the configuration
        let isConfEnabled = Controls.Enabled__.GetValue();
        Controls.ConfigurationName__.SetRequired(isConfEnabled);
        Controls.Identity__.SetRequired(isConfEnabled);
        Controls.LogoURL__.SetRequired(isConfEnabled);
        Controls.Secret__.SetRequired(isConfEnabled);
        Controls.SenderIdentity__.SetRequired(isConfEnabled);
        Controls.SupplierID__.SetRequired(isConfEnabled);
        let controls = [];
        if (!Sys.Helpers.IsEmpty(Controls.PunchoutURL__.GetValue())) {
            controls.push(Controls.PunchoutURL__);
        }
        //Check PunchoutOrderURL__ si non vide et ne contient pas ##SIMULATE##
        if (!Sys.Helpers.IsEmpty(Controls.PunchoutOrderURL__.GetValue()) && Controls.PunchoutOrderURL__.GetValue().indexOf("##SIMULATE##") === -1) {
            controls.push(Controls.PunchoutOrderURL__);
        }
        if (controls.length === 0) {
            return;
        }
        Sys.Helpers.Array.ForEach(controls, function (control) {
            control.SetImageURL();
        });
        Controls.TestPunchout__.SetDisabled(true); // Test button will be reenabled if urls are trusted
        if (Controls.Enabled__.GetValue() === false) {
            Sys.Helpers.Array.ForEach(controls, function (control) {
                control.SetError();
                control.SetImageURL();
            });
            Controls.Save.SetDisabled(false);
            g_topMessageWarning.Clear();
            return;
        }
        Controls.Save.SetDisabled(true);
        let promises = Sys.Helpers.Array.Map(controls, function (control) {
            return CheckUrlTrustedWithSpinner(control);
        });
        Sys.Helpers.Synchronizer.All(promises)
            .Then(function () {
            let id = checkUrlsTrustedCallbackId;
            return function (items) {
                if (id != checkUrlsTrustedCallbackId) {
                    Log.Info("Ignored previous CheckUrlsTrusted result");
                    return;
                }
                let allTrusted = true;
                for (let i in items) {
                    let isTrusted = items[i];
                    let control = controls[i];
                    if (isTrusted) {
                        control.SetError();
                    }
                    else {
                        allTrusted = false;
                        control.SetError("_URL is not trusted");
                    }
                }
                if (allTrusted) {
                    Log.Info("All urls trusted");
                    g_topMessageWarning.Clear();
                    Controls.Save.SetDisabled(false);
                    UpdatePunchoutTestButton();
                }
                else {
                    Log.Error("Some URL are not trusted");
                    g_topMessageWarning.Clear();
                    g_topMessageWarning.Add(Language.Translate("_Some urls are not trusted"));
                    Controls.TestPunchout__.SetDisabled(true);
                }
            };
        }());
    }
    function CheckUrlTrustedWithSpinner(control) {
        if (typeof idUrlTrustedWithSpinnerByControlName[control.GetName()] == "undefined") {
            idUrlTrustedWithSpinnerByControlName[control.GetName()] = 0;
        }
        else {
            idUrlTrustedWithSpinnerByControlName[control.GetName()]++;
        }
        return Sys.Helpers.Promise.Create(function (resolve, reject) {
            let promise;
            if (typeof isTrustedByControlName[control.GetName()] === "boolean") {
                promise = Sys.Helpers.Promise.Resolve(isTrustedByControlName[control.GetName()]);
            }
            else if (control.GetValue() == null && control.GetValue() == "") {
                promise = Sys.Helpers.Promise.Resolve(false);
            }
            else {
                control.SetImageURL("loading.gif");
                promise = CheckUrlTrusted(control.GetValue());
            }
            promise
                .Then(function () {
                let id = idUrlTrustedWithSpinnerByControlName[control.GetName()];
                return function (isTrusted) {
                    if (id != idUrlTrustedWithSpinnerByControlName[control.GetName()]) {
                        Log.Info("Ignore previous CheckControlUrlTrusted result");
                        return;
                    }
                    isTrustedByControlName[control.GetName()] = isTrusted;
                    control.SetImageURL();
                    resolve(isTrusted);
                };
            }());
        });
    }
    function CheckUrlTrusted(targetUrl) {
        return Sys.Helpers.Promise.Create(function (resolve, reject) {
            Query.IsURLTrusted({
                targetURL: targetUrl,
                callback: function (result) {
                    resolve(result.isTrusted);
                }
            });
        });
    }
    function UpdatePunchoutTestButton() {
        if (Controls.PunchoutURL__.GetValue() === "" ||
            Controls.SenderIdentity__.GetValue() === "" ||
            Controls.Identity__.GetValue() === "" ||
            Controls.Secret__.GetValue() === "" ||
            isTrustedByControlName["PunchoutURL__"] != true) {
            Controls.TestPunchout__.SetDisabled(true);
        }
        else {
            Controls.TestPunchout__.SetDisabled(false);
        }
    }
    const dangerousChars = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\u00A0\ufeff\ufff9-\ufffc]/g;
    // \u200b => zero width space, the worst :)
    // \u00ad => Soft hyphen
    // \u00A0 => Non-breaking space (added from list)
    const specialChars = {
        '\r': { text: "CR", help: "CR" },
        '\n': { text: "LF", help: "LF" },
        '\t': { text: "→", help: "TAB" }
    };
    // Transforms special chars of the given string into a result containing html and css
    function HighlightSpecialChars(rawStr, result) {
        let html = "<pre>";
        let cssText = {}; // map char code => text to display with css beside (e.g. 13 => "CR")
        for (let i = 0; i < rawStr.length; i++) {
            let specialChar = specialChars[rawStr[i]];
            let helpText;
            if (specialChar) {
                helpText = "&#" + rawStr.charCodeAt(i) + " " + specialChar.help;
                html += "<span class='badge badge-small text" + rawStr.charCodeAt(i) + "' title='" + escapeHtml(helpText) + "'>" + escapeHtml(rawStr[i]) + "</span>";
                cssText[rawStr.charCodeAt(i)] = specialChar.text;
                if (rawStr[i] == '\n') {
                    html += "<br/>";
                }
            }
            else if (rawStr[i].match(dangerousChars)) {
                helpText = "&#" + rawStr.charCodeAt(i);
                html += "<span class='badge badge-small badge-error text" + rawStr.charCodeAt(i) + "' title='" + escapeHtml(helpText) + "'>" + escapeHtml(rawStr[i]) + "</span>";
                cssText[rawStr.charCodeAt(i)] = '0x' + rawStr.charCodeAt(i).toString(16);
            }
            else {
                html += escapeHtml(rawStr[i]);
            }
        }
        html += "</pre>";
        result.html = html;
        result.css =
            "pre {\n\
	width: 750px;\n\
	white-space: pre-wrap;\n\
	word-break: break-all;\n\
	word-wrap: break-word;\n\
	line-break: anywhere;\n\
	margin: 5px 0px\n\
}\n\
\n\
.badge {\n\
	display: inline-block;\n\
	padding: .25em .4em;\n\
	margin: 0 .1em;\n\
	font-weight: 700;\n\
	line-height: 1;\n\
	text-align: center;\n\
	white-space: nowrap;\n\
	vertical-align: baseline;\n\
	border-radius: .25rem;\n\
\n\
	color: #000;\n\
	background-color: #E0E2E5;\n\
}\n\
\n\
.badge-small {\n\
	font-size: 75%;\n\
}\n\
\n\
.badge-error {\n\
	color: #fff;\n\
	background-color: #a94442\n\
}\n\
\n\
";
        for (let i in cssText) {
            result.css += ".text" + i + "::after {\n\
content: '" + cssText[i] + "';\n\
}\n\
";
        }
    }
    // List of HTML entities for escaping.
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    // Regex containing the keys listed immediately above.
    let htmlEscaper = /[&<>"'\/]/g;
    // Escape a string for HTML interpolation.
    function escapeHtml(string) {
        return ('' + string).replace(htmlEscaper, function (match) {
            return htmlEscapes[match];
        });
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map