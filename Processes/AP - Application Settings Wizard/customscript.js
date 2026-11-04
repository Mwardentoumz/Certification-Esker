"use strict";
var CustomScript;
(function (CustomScript) {
    const topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
    CustomScript.globalSettings = {};
    /**
     * Manage the General step
     */
    class GroupOfControls {
        constructor(controlsName) {
            this.allControls = controlsName.map(name => {
                return Controls[name];
            });
        }
        IsVisible() {
            return this.allControls.some(ctrl => ctrl.IsVisible());
        }
        Hide(hide) {
            this.allControls.forEach((control) => {
                //Specific cases, thoses controls can be hide from multiple change event
                if ((control.GetName() === "SAPDocumentTypeFIConsignmentStock__" && !Data.GetValue("EnableConsignmentStock__"))
                    || (control.GetName() === "SAPDocumentTypeDownPaymentInvoice__" && !Data.GetValue("EnableDownPaymentInvoice__"))
                    || (control.GetName() === "ERPNotifierProcessName__" && Data.GetValue("ERPExportMethod__") === "SFTP")) {
                    control.Hide(true);
                }
                else {
                    control.Hide(hide);
                }
            });
        }
    }
    CustomScript.generalStep = {
        panels: [
            Controls.General_pane,
            Controls.Portal,
            Controls.EnergyConsumption_pane,
            Controls.ERP_pane,
            Controls.DataExchangeParameters,
            Controls.SAPConnectionParameters,
            Controls.S4HANAParameters,
            Controls.CustomERPParameters
        ],
        icon: "fa-cog",
        title: "General_pane",
        helpId: 2501,
        onStart: function () {
            CustomScript.generalStep.initLayout();
            CustomScript.generalStep.handleErrorMessage();
            CustomScript.generalStep.handleERP();
            CustomScript.generalStep.handleSAPWS();
            CustomScript.generalStep.handleSAPS4HANA();
            CustomScript.generalStep.handleConnectionType();
            CustomScript.generalStep.handleProcurementERPMigration();
            Controls.ERP__.OnChange = CustomScript.generalStep.handleERP;
            //VendorRegistrationERPIntegration__ is only use in the configurator for UI purpose
            //EnableVendorERPConnection__ is needed for Update, so we can't replace it by VendorRegistrationERPIntegration__
            Controls.VendorRegistrationERPIntegration__.SetValue(Controls.EnableVendorERPConnection__.IsChecked() ? "universal" : "none");
            Controls.VendorRegistrationERPIntegration__.OnChange = function () {
                Controls.EnableVendorERPConnection__.Check(Controls.VendorRegistrationERPIntegration__.GetValue() === "universal");
                return CustomScript.generalStep.handleERP();
            };
            Controls.ERPProcurement__.OnChange = CustomScript.generalStep.handleERP;
            Controls.ERPExportMethod__.OnChange = CustomScript.generalStep.handleConnectionType;
            Controls.SAPConfiguration__.OnChange = CustomScript.generalStep.showHideDisplayRequirementsButton;
            // SAP Web Service specific options
            Controls.SAPWSEnabled__.OnChange = CustomScript.generalStep.handleSAPWS;
            Controls.SAPWSAuthenticationType__.OnChange = CustomScript.generalStep.handleSAPWSAuthentMethodChange;
            Controls.SAPWSUser__.OnChange = CustomScript.generalStep.handleCheckSimulationProto;
            Controls.SAPWSPwd__.OnChange = CustomScript.generalStep.handleCheckSimulationProto;
            Controls.SAPWSAlias__.OnChange = CustomScript.generalStep.handleCheckSimulationProto;
            Controls.SAPWSTokenRequestURL__.OnChange = CustomScript.generalStep.handleCheckSimulationProto;
            Controls.SAPWSSelectTransportsURL__.OnChange = CustomScript.generalStep.resetSelectTransportURL;
            Controls.SAPS4HANAAuthenticationType__.OnChange = CustomScript.generalStep.handleSAPS4HANAAuthentMethodChange;
            Controls.CheckSimulationProto__.OnClick = CustomScript.generalStep.showRequirementsDialog;
            Controls.EnableConsignmentStock__.OnChange = CustomScript.generalStep.handleERP;
            // Custom ERP settings
            Controls.AuthenticationType__.OnChange = function () {
                CustomScript.generalStep.handleAuthenticationTypeChange();
                CustomScript.generalStep.handleERP();
            };
            Controls.CustomERPBaseUrl__.OnChange = CustomScript.generalStep.handleERP;
            Controls.OAuth2TokenUrl__.OnChange = CustomScript.generalStep.handleERP;
            Controls.CustomERPUser__.OnChange = CustomScript.generalStep.handleERP;
            Controls.CustomERPPassword__.OnChange = CustomScript.generalStep.handleERP;
            Controls.GrantType__.OnChange = function () {
                CustomScript.generalStep.handleOAuthGrantTypeChange();
                CustomScript.generalStep.handleERP();
            };
            Controls.OAuthUsername__.OnChange = CustomScript.generalStep.handleERP;
            Controls.OAuthPassword__.OnChange = CustomScript.generalStep.handleERP;
            /**
             * Display a popup if ExceptionResolutionMode__ is set to "line" and EnablePortalAccountCreation__ is not activated, preventing this combination
             * and adapt visibility of AllowTouchlessWithPriceQtyMismatch
             */
            Controls.ExceptionResolutionMode__.OnChange = function () {
                if (Controls.ExceptionResolutionMode__.GetValue() !== "header" && !Controls.EnablePortalAccountCreation__.IsChecked()) {
                    Popup.Confirm("_You must enable portal account creation to use line exception resolution mode, it will be automatically enabled", false, () => {
                        // Confirm OK
                        Controls.EnablePortalAccountCreation__.Check(true);
                    }, () => {
                        // Confirm Cancel
                        // Restore previous selected value
                        Controls.ExceptionResolutionMode__.SetValue("header");
                    }, "_Incompatible settings");
                }
                labsStep.adaptAllowTouchlessWithPriceQtyMismatchVisibility();
            };
            Controls.EnablePortalAccountCreation__.OnChange = function () {
                if (Controls.ExceptionResolutionMode__.GetValue() !== "header" && !Controls.EnablePortalAccountCreation__.IsChecked()) {
                    Popup.Confirm("_You must enable portal account creation to use line exception resolution mode, line exception resolution mode has been switched to header", false, () => {
                        // Confirm OK
                        Controls.ExceptionResolutionMode__.SetValue("header");
                    }, () => {
                        // Confirm Cancel
                        // Restore previous selected value
                        Controls.EnablePortalAccountCreation__.Check(true);
                    }, "_Incompatible settings");
                }
            };
            Sys.Wizard.Tools.HandleHTMLToggle(Controls.GeneralMoreOptionsSAPInformations__, new GroupOfControls(["SAPDocumentTypeFIInvoice__",
                "SAPDocumentTypeFICreditNote__",
                "SAPDocumentTypeFIConsignmentStock__",
                "SAPDocumentTypeMMInvoice__",
                "SAPDocumentTypeMMCreditNote__",
                "SAPDocumentTypeDownPaymentInvoice__",
                "Spacer_line7__",
                "SAPWSSelectTransportsURL__",
                "CheckSimulationProto__"]), Language.Translate("More options"));
            // Always call this function to hide the associated advanced pane
            Sys.Wizard.Tools.HandleHTMLToggle(Controls.GeneralMoreOptionsConnectionTypeInformations__, new GroupOfControls(["ERPNotifierProcessName__",
                "ExportInvoiceImageFormat__"]), Language.Translate("More options"));
        },
        onQuit: function () {
            let existingConfNames = [];
            if (Variable.GetValueAsString("ExistingConfigurations") && JSON.parse(Variable.GetValueAsString("ExistingConfigurations"))) {
                existingConfNames = JSON.parse(Variable.GetValueAsString("ExistingConfigurations"));
            }
            const confName = Data.GetValue("ConfigurationName__");
            let result = true;
            if (!confName) {
                Controls.ConfigurationName__.SetError(Language.Translate("_Expecting a configuration name"));
                result = false;
            }
            else if (Sys.Helpers.Array.IndexOf(existingConfNames, confName) !== -1) {
                Controls.ConfigurationName__.SetError(Language.Translate("_Existing configuration"));
                result = false;
            }
            if (!result) {
                return result;
            }
            Controls.ERP__.OnChange = null;
            // After the first step, do not allow to change configuration name
            Controls.ConfigurationName__.SetReadOnly(true);
            return true;
        },
        handleSAPWS: function () {
            const isSAPWSEnabled = Data.GetValue("SAPWSEnabled__");
            Controls.SAPConfiguration__.Hide(isSAPWSEnabled);
            // SAP Web service specific
            const hideSAPWSFields = !isSAPWSEnabled;
            if (hideSAPWSFields) {
                Controls.SAPWSAlias__.Hide(true);
                Controls.SAPWSMapping__.Hide(true);
                Controls.SAPWSTokenRequestURL__.Hide(true);
            }
            else {
                CustomScript.generalStep.handleSAPWSAuthentMethodChange();
            }
            Controls.SAPWSAuthenticationType__.Hide(hideSAPWSFields);
            Controls.SAPWSPwd__.Hide(hideSAPWSFields);
            Controls.SAPWSUser__.Hide(hideSAPWSFields);
            Controls.SAPWSDateFormat__.Hide(hideSAPWSFields);
            Controls.SAPWSConnectionLanguage__.Hide(hideSAPWSFields);
            Controls.SAPWSClient__.Hide(hideSAPWSFields);
        },
        handleSAPS4HANA: function () {
            CustomScript.generalStep.handleSAPS4HANAAuthentMethodChange();
        },
        handleERP: function () {
            const erpConnector = Data.GetValue("ERP__");
            const isAPUniversal = erpConnector === "generic";
            const isAPSAP = erpConnector === "SAP";
            const isProcSAP = Data.GetValue("ERPProcurement__") === "SAP";
            const isProcUniversal = Data.GetValue("ERPProcurement__") === "universal";
            const isAPSAPS4HANA = erpConnector === "SAPS4CLOUD";
            const isAPCustomERP = erpConnector === null || erpConnector === void 0 ? void 0 : erpConnector.startsWith("CustomERP_");
            const isAPSAPFamily = isAPSAP || isAPSAPS4HANA;
            const isAPNAV = erpConnector === "NAV";
            const isAPEBS = erpConnector === "EBS";
            const isAPJDE = erpConnector === "JDE";
            const isProcEnabled = CustomScript.globalSettings.ENABLEPURCHASINGGLOBALSETTING__ === "1";
            const isProcStandardEnabled = CustomScript.globalSettings.ENABLESTANDARDPURCHASINGGLOBALSETTING__ === "1";
            const idVMEnabled = CustomScript.globalSettings.ENABLEVENDORMANAGEMENTGLOBALSETTING__ === "1";
            const hasSAPConnectivity = isAPSAP || (isProcEnabled && isProcSAP);
            const hasProcUniversalConnectivity = isProcEnabled && isProcUniversal;
            const hasUniversalConnectivity = !isAPSAPFamily || hasProcUniversalConnectivity || (idVMEnabled && Data.GetValue("EnableVendorERPConnection__"));
            const hasSAPS4HANAConnectivity = isAPSAPS4HANA;
            const hasCustomERPConnectivity = isAPCustomERP;
            const erpContext = { erpConnector, isAPSAPFamily, isAPSAPS4HANA, isAPNAV, isAPEBS, isAPJDE, hasSAPConnectivity, hasSAPS4HANAConnectivity };
            Controls.DataExchangeParameters.Hide(!hasUniversalConnectivity);
            Controls.S4HANAParameters.Hide(!hasSAPS4HANAConnectivity);
            Controls.CustomERPParameters.Hide(!hasCustomERPConnectivity);
            CustomScript.generalStep.handleAuthenticationTypeChange();
            Controls.SAPConnectionParameters.Hide(!hasSAPConnectivity);
            Controls.ERPProcurement__.Hide(!isProcStandardEnabled);
            Controls.GoodIssueNumberPatterns__.Hide(!isAPSAPFamily || !Data.GetValue("EnableConsignmentStock__"));
            Controls.EnableAsyncEditPOInERP__.Hide(!hasProcUniversalConnectivity);
            Controls.EnableAsyncCancelPOInERP__.Hide(!hasProcUniversalConnectivity);
            if (!hasProcUniversalConnectivity) {
                Controls.EnableAsyncEditPOInERP__.SetValue(false);
                Controls.EnableAsyncCancelPOInERP__.SetValue(false);
            }
            if (!hasSAPConnectivity) {
                Data.SetValue("SAPWSEnabled__", false);
                CustomScript.generalStep.handleSAPWS();
            }
            CustomScript.generalStep.resetERPSpecificDefaults(erpContext);
            CustomScript.generalStep.handleCheckSimulationProto();
            const erpProcurementError = isProcEnabled && isProcSAP && !isAPSAP ? "_ERPProcurement_can_be_SAP_only_when_AP_is_SAP" : "";
            Controls.ERPProcurement__.SetError(erpProcurementError);
            CustomScript.generalStep.handleConnectionType();
            Data.SetValue("ERPConnectorConfiguration__", "");
            if (erpConnector === null || erpConnector === void 0 ? void 0 : erpConnector.startsWith("CustomERP_")) {
                CustomScript.generalStep.handleERPConnectorConfiguration(erpConnector.substring("CustomERP_".length));
            }
            Controls.EnableLifeCycleStatusesManagedByERP__.Hide(!isAPUniversal);
            if (!isAPUniversal) {
                Controls.EnableLifeCycleStatusesManagedByERP__.SetValue(false);
            }
        },
        resetERPSpecificDefaults: function (erpCtx) {
            if (!erpCtx.hasSAPConnectivity && !erpCtx.hasSAPS4HANAConnectivity) {
                Controls.CodingEnableCompanyCode__.SetValue(false);
                Controls.CodingEnableWBSElement__.SetValue(false);
                Controls.CodingEnableBusinessArea__.SetValue(false);
                Controls.CodingEnableAssignments__.SetValue(false);
                Controls.CodingEnableInternalOrder__.SetValue(false);
                Controls.CodingEnableTradingPartner__.SetValue(false);
                Controls.CodingEnableProfitCenter__.SetValue(false);
                Controls.PaymentTermsSource__.SetValue("Default");
            }
            if (erpCtx.isAPSAPFamily || erpCtx.isAPEBS || erpCtx.isAPJDE) {
                Controls.CodingEnableProjectCode__.SetValue(false);
            }
            if (erpCtx.isAPSAPFamily || erpCtx.isAPNAV || erpCtx.isAPJDE) {
                Controls.MultiTaxesOnALineItem__.SetValue(false);
            }
            if (erpCtx.isAPSAPS4HANA) {
                Controls.ArchiveIntercompanyInvoices__.SetValue(false);
            }
            if (erpCtx.erpConnector !== "generic" && erpCtx.erpConnector !== "SAP") {
                Controls.EnableDownPaymentInvoice__.SetValue(false);
            }
        },
        handleERPConnectorConfiguration: function (erpConnector) {
            let needToQueryErpConnectorConfig = true;
            const erpConnectorConfigString = Data.GetValue("ERPConnectorConfiguration__");
            if (erpConnectorConfigString) {
                try {
                    const erpConnectorConfig = JSON.parse(erpConnectorConfigString);
                    needToQueryErpConnectorConfig = erpConnector !== erpConnectorConfig.ConnectorId__;
                }
                catch (e) {
                    Log.Error("Error while parsing ERP Connector Configuration as JSON");
                }
            }
            if (needToQueryErpConnectorConfig) {
                Query.DBQuery(CustomScript.generalStep.serializeERPConnectorsConfiguration, "Sys_PartnerConnectors__", "ConnectorId__|ConnectorName__|IntegratorName__|Description__|EndpointList__|AnalyticFieldsStorage__", `ConnectorId__=${erpConnector}`);
            }
        },
        handleConnectionType: function () {
            Controls.ERPNotifierProcessName__.Hide(!Controls.ExportInvoiceImageFormat__.IsVisible() || Data.GetValue("ERPExportMethod__") === "SFTP");
        },
        handleAuthenticationTypeChange: function () {
            const authenticationType = Data.GetValue("AuthenticationType__");
            const userLabel = authenticationType === "OAuth" ? "_ClientID" : "_CustomERPUser";
            const passwordLabel = authenticationType === "OAuth" ? "_ClientSecret" : "_CustomERPPassword";
            Controls.OAuth2TokenUrl__.Hide(authenticationType !== "OAuth");
            Controls.GrantType__.Hide(authenticationType !== "OAuth");
            Controls.CustomERPUser__.SetLabel(userLabel);
            Controls.CustomERPPassword__.SetLabel(passwordLabel);
            CustomScript.generalStep.handleOAuthGrantTypeChange();
        },
        handleOAuthGrantTypeChange: function () {
            const authenticationType = Data.GetValue("AuthenticationType__");
            const isPasswordGrant = authenticationType === "OAuth" && Data.GetValue("GrantType__") === "password";
            Controls.OAuthUsername__.Hide(!isPasswordGrant);
            Controls.OAuthPassword__.Hide(!isPasswordGrant);
        },
        handleCheckSimulationProto: function () {
            const isAPSAP = Data.GetValue("ERP__") === "SAP";
            const isProcEnabled = CustomScript.globalSettings.ENABLEPURCHASINGGLOBALSETTING__ === "1";
            const isProcSAP = Data.GetValue("ERPProcurement__") === "SAP";
            const hasSAPConnectivity = isAPSAP || (isProcEnabled && isProcSAP);
            // Early exit if no SAP connectivity
            if (!hasSAPConnectivity) {
                Controls.CheckSimulationProto__.SetDisabled(true);
                return;
            }
            // Check configuration type
            const hasSAPConfiguration = !!Data.GetValue("SAPConfiguration__");
            if (hasSAPConfiguration) {
                Controls.CheckSimulationProto__.SetDisabled(false);
                return;
            }
            // Check SAP WS authentication if enabled
            const isSAPWSEnabled = !!Data.GetValue("SAPWSEnabled__");
            if (!isSAPWSEnabled) {
                Controls.CheckSimulationProto__.SetDisabled(true);
                return;
            }
            // Check credentials
            const hasValidCredentials = !!Controls.SAPWSUser__.GetValue() && !!Controls.SAPWSPwd__.GetValue();
            if (!hasValidCredentials) {
                Controls.CheckSimulationProto__.SetDisabled(true);
                return;
            }
            // Validate authentication based on mode
            let isAuthValid = false;
            switch (Data.GetValue("SAPWSAuthenticationType__")) {
                case Lib.P2P.SAP.Soap.AuthMode.Basic:
                    isAuthValid = true;
                    break;
                case Lib.P2P.SAP.Soap.AuthMode.Certificate:
                    isAuthValid = !!Controls.SAPWSAlias__.GetValue();
                    break;
                case Lib.P2P.SAP.Soap.AuthMode.OAuth:
                    isAuthValid = !!Controls.SAPWSTokenRequestURL__.GetValue();
                    break;
            }
            Controls.CheckSimulationProto__.SetDisabled(!isAuthValid);
        },
        handleSAPWSAuthentMethodChange: function () {
            switch (Data.GetValue("SAPWSAuthenticationType__")) {
                case Lib.P2P.SAP.Soap.AuthMode.Certificate:
                    {
                        Controls.SAPWSAlias__.Hide(false);
                        Controls.SAPWSMapping__.Hide(true);
                        Controls.SAPWSTokenRequestURL__.Hide(true);
                        break;
                    }
                case Lib.P2P.SAP.Soap.AuthMode.OAuth:
                    {
                        Controls.SAPWSAlias__.Hide(true);
                        Controls.SAPWSMapping__.Hide(false);
                        Controls.SAPWSTokenRequestURL__.Hide(false);
                        break;
                    }
                case Lib.P2P.SAP.Soap.AuthMode.Basic:
                default:
                    {
                        Controls.SAPWSAlias__.Hide(true);
                        Controls.SAPWSMapping__.Hide(false);
                        Controls.SAPWSTokenRequestURL__.Hide(true);
                        break;
                    }
            }
            CustomScript.generalStep.handleCheckSimulationProto();
        },
        handleSAPS4HANAAuthentMethodChange: function () {
            const authModeKey = Data.GetValue("SAPS4HANAAuthenticationType__");
            if (authModeKey === "OAuth") {
                Controls.SAPS4HANATokenRequestURL__.Hide(false);
                Controls.WebserviceUser__.SetLabel("_ClientID");
                Controls.WebservicePassword__.SetLabel("_ClientSecret");
            }
            else {
                Controls.SAPS4HANATokenRequestURL__.Hide(true);
                Controls.WebserviceUser__.SetLabel("_WebserviceUser");
                Controls.WebservicePassword__.SetLabel("_WebservicePassword");
            }
        },
        handleErrorMessage: function () {
            const errorMessage = Variable.GetValueAsString("ErrorMessage");
            if (errorMessage) {
                Popup.Alert(Language.Translate(errorMessage));
                Controls.ConfigurationName__.SetReadOnly(false);
                Variable.SetValueAsString("ErrorMessage", "");
            }
            else if (Variable.GetValueAsString("currentStep")) {
                //Once the first step has been left with a correct configuration name, the configuration name cannot be changed
                //in order to avoid issues with extraction configurations
                Controls.ConfigurationName__.SetReadOnly(true);
            }
        },
        setLastModifiedInformationsVisible: function (isVisible) {
            Controls.LastModifiedDateTime__.Hide(!isVisible);
            Controls.LastModifiedBy__.Hide(!isVisible);
        },
        initLayout: function () {
            Controls.LastModifiedDateTime__.SetReadOnly(true);
            Controls.LastModifiedBy__.SetReadOnly(true);
            Controls.EnableVendorERPConnection__.Hide(true);
            Controls.WebserviceURL__.Hide(false);
            Controls.WebserviceUser__.Hide(false);
            Controls.WebservicePassword__.Hide(false);
            Controls.WebserviceURLDetails__.Hide(false);
            Controls.VendorRegistrationERPIntegration__.Hide(CustomScript.globalSettings.ENABLEVENDORMANAGEMENTGLOBALSETTING__ !== "1");
            CustomScript.generalStep.setLastModifiedInformationsVisible(Boolean(Variable.GetValueAsString("ConfigurationLoaded")));
            // EnergyConsumption_pane layout
            Controls.EnableEnergyConsumptionReporting__.Hide(false);
            Controls.GHGConversionFactorSource__.Hide(true);
        },
        showHideDisplayRequirementsButton: function () {
            Controls.CheckSimulationProto__.SetDisabled(!this.GetValue());
        },
        showRequirementsDialog: function () {
            this.Wait(true);
            const bapiName = "SVRS_GET_REPS_FROM_OBJECT";
            const bapiParams = {
                "EXPORTS": {
                    "OBJECT_NAME": "BAPI_INCOMINGINVOICE_CREATE",
                    "OBJECT_TYPE": "FUNC"
                }
            };
            if (Data.GetValue("SAPWSEnabled__")) {
                GetRequirementsSAPWS();
            }
            else {
                Query.SAPCallBapi(rfcReadTableCallback, Controls.SAPConfiguration__.GetValue(), bapiName, bapiParams);
            }
        },
        resetSelectTransportURL: function () {
            Lib.P2P.SAP.Soap.ResetInternalParameters();
            CustomScript.generalStep.handleERP();
        },
        handleProcurementERPMigration: function () {
            const isAPSAP = Data.GetValue("ERP__") === "SAP";
            if (Controls.ERPProcurement__.GetValue() === "NullValueForMigration") {
                if (isAPSAP) {
                    Controls.ERPProcurement__.SetValue("SAP");
                }
                else {
                    Controls.ERPProcurement__.SetValue("generic");
                }
            }
            Controls.ERPProcurement__.SetAvailableValues([
                "generic=_GenericProcurement",
                "universal=_Universal",
                "SAP=_SAP"
            ]);
        },
        serializeERPConnectorsConfiguration: function () {
            const err = this.GetQueryError();
            if (err) {
                Popup.Alert(err);
                return;
            }
            const nbRecords = this.GetRecordsCount();
            if (nbRecords === 1) {
                const erpConnectorConfig = {
                    ConnectorId__: this.GetQueryValue("ConnectorId__"),
                    ConnectorName__: this.GetQueryValue("ConnectorName__"),
                    IntegratorName__: this.GetQueryValue("IntegratorName__"),
                    Description__: this.GetQueryValue("Description__"),
                    CustomERPBaseUrl__: Data.GetValue("CustomERPBaseUrl__"),
                    AuthenticationType__: Data.GetValue("AuthenticationType__"),
                    OAuth2TokenUrl__: Data.GetValue("OAuth2TokenUrl__"),
                    GrantType__: Data.GetValue("GrantType__"),
                    OAuthUsername__: Data.GetValue("OAuthUsername__"),
                    OAuthPassword__: Data.GetValue("OAuthPassword__"),
                    CustomERPUser__: Data.GetValue("CustomERPUser__"),
                    CustomERPPassword__: Data.GetValue("CustomERPPassword__"),
                    EndpointList__: this.GetQueryValue("EndpointList__"),
                    AnalyticFields__: this.GetQueryValue("AnalyticFieldsStorage__")
                };
                Data.SetValue("ERPConnectorConfiguration__", JSON.stringify(erpConnectorConfig));
            }
            else {
                Data.SetValue("ERPConnectorConfiguration__", "");
            }
        }
    };
    function GetRequirementsSAPWS() {
        const bapiName = "SVRS_GET_REPS_FROM_OBJECT";
        const bapiParams = {
            "EXPORTS": {
                "OBJECT_NAME": "BAPI_INCOMINGINVOICE_CREATE",
                "OBJECT_TYPE": "FUNC"
            }
        };
        const resolvedBapiParams = Lib.P2P.SAP.Soap.MergeBapiParams(Lib.P2P.SAP.Soap.InitBapiParams(bapiName, bapiName)[bapiName], bapiParams);
        const params = BuildInternalParametersForSAPCallBAPI(bapiName);
        Lib.P2P.SAP.Soap.OverrideInternalParameters(params);
        Lib.P2P.SAP.Soap.CallSAPSOAPWS(bapiName, resolvedBapiParams, false)
            .Then(function (result) {
            rfcReadTableCallback(result ? result.response : null);
        })
            .Catch(function (error) {
            rfcReadTableCallback(error ? error.response : null);
        });
    }
    function BuildInternalParametersForSAPCallBAPI(bapiName) {
        const parameters = {
            bapiURLMapping: {},
            namespaceQualifier: "urn",
            namespaceURL: "urn:sap-com:document:sap:rfc:functions",
            method: "POST",
            useUserERPCredentialsIfDefined: true,
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": "http://sap.com/xi/WebService/soap1.1"
            },
            authMode: Lib.P2P.SAP.Soap.AuthMode.Basic,
            authData: null
        };
        parameters.bapiURLMapping[bapiName] = Controls.SAPWSSelectTransportsURL__.GetValue(); // todo replace next line when process template updated
        parameters.authData = {};
        parameters.authData.user = Controls.SAPWSUser__.GetValue();
        parameters.authData.password = Controls.SAPWSPwd__.GetValue();
        // Mode certificate
        if (Data.GetValue("SAPWSAuthenticationType__") === Lib.P2P.SAP.Soap.AuthMode.Certificate) {
            parameters.authMode = Lib.P2P.SAP.Soap.AuthMode.Certificate;
            parameters.authData.alias = Controls.SAPWSAlias__.GetValue();
        }
        // Mode OAuth
        else if (Controls.SAPWSTokenRequestURL__.GetValue()) {
            parameters.authMode = Lib.P2P.SAP.Soap.AuthMode.OAuth;
            parameters.authData.endpoint = Controls.SAPWSTokenRequestURL__.GetValue();
            parameters.authData.authenticationTokenCache = null;
            parameters.authData.tokenExpirationDateCache = null;
        }
        // Mode Basic Auth
        else {
            parameters.authMode = Lib.P2P.SAP.Soap.AuthMode.Basic;
        }
        return parameters;
    }
    CustomScript.BuildInternalParametersForSAPCallBAPI = BuildInternalParametersForSAPCallBAPI;
    /**
     * Manage Sourcing
     */
    const sourcingStep = {
        panels: [Controls.Sourcing_RFQ_pane],
        icon: "esk-ifont-sourcing-module",
        title: "_Sourcing_tab_title",
        helpId: 5167,
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEREQUESTFORQUOTE__ === "1";
        },
        onStart: function () {
            //Nothing to do
        },
        onQuit: function () {
            return true;
        }
    };
    /**
     * Manage Vendor Management
     */
    const vendorManagementStep = {
        panels: [Controls.VendorManagement_options_pane],
        icon: "fas fa-briefcase",
        title: "_Vendor_management_tab_title",
        helpId: 2543,
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEVENDORMANAGEMENTGLOBALSETTING__ === "1";
        },
        onStart: function () {
            vendorManagementStep.handleSiSid();
            Controls.EnableSiSid__.OnChange = vendorManagementStep.handleSiSid;
            Controls.EnableAddingUNSPSCInVendorRegistration__.SetReadOnly(!Controls.EnableVendorUNSPSCBrowse__.IsChecked());
        },
        onQuit: function () {
            return true;
        },
        handleSiSid: function () {
            const hideSiSidControls = !Controls.EnableSiSid__.IsChecked();
            Controls.SiSidLogin__.Hide(hideSiSidControls);
            Controls.SiSidPassword__.Hide(hideSiSidControls);
        }
    };
    /**
     * Manage Purchasing
     */
    const budgetManagementMoreOptionsControls = new GroupOfControls(["BudgetKeyColumns__",
        "BudgetValidationKeyColumns__",
        "UndefinedBudgetBehavior__",
        "OutOfBudgetBehavior__",
        "DisableCrossSectionalBudgetLine__"]);
    const purchasingStep = {
        panels: [
            Controls.Purchasing_General_pane,
            Controls.Purchasing_options_pane,
            Controls.BudgetManagement_pane
        ],
        icon: "esk-ifont-purchasing-module",
        title: "Purchasing_pane_V2",
        helpId: 2509,
        procurementViewerBrowseInitialized: false,
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEPURCHASINGGLOBALSETTING__ === "1";
        },
        onStart: function () {
            Controls.InvoicedProcessCancellationBehavior__.Hide(Controls.InvoicedProcessCancellationBehavior__.GetValue() == "prevent");
            Controls.BudgetManagementMoreOptions__.Hide(!Controls.EnableBudget__.IsChecked());
            Controls.EnableBudget__.OnChange = purchasingStep.showBudgetManagementMoreOptions;
            Controls.DefaultOCRecipient__.Hide(CustomScript.globalSettings.ENABLEORDERCONFIRMATION__ !== "1");
            Controls.WorkflowEnableNewOCNotifications__.Hide(CustomScript.globalSettings.ENABLEORDERCONFIRMATION__ !== "1");
            Controls.EnableVendorModifyPO__.SetReadOnly(CustomScript.globalSettings.ENABLEORDERCONFIRMATION__ !== "1");
            Controls.EnablePOApprovalWorkflow__.Hide(Controls.EnablePOApprovalWorkflow__.IsChecked());
            Controls.ProcurementViewerDisplay__.SetHelpData(Language.Translate("_ProcurementVisibilityUserGroup_Help"), "2499", "HTML Format", "Right");
            // User data initialized here so that the configuration values are already loaded into ProcurementViewer__
            if (!purchasingStep.procurementViewerBrowseInitialized) {
                purchasingStep.procurementViewerBrowseInitialized = true;
                const usersOrGroupsOptions = Lib.P2P.UsersBrowseOptions.GetUsersOrGroupsOptions({
                    placeholder: "_SelectOrEnterEmailAddress",
                    queryOnSearch: true,
                    displayFormat: "%%DisplayName%% <%%EmailAddress%%>",
                    titleDisplayFormat: "%%DisplayName%%"
                });
                Lib.P2P.UsersBrowse.Init({
                    browsedControl: Controls.ProcurementViewerDisplay__,
                    storageName: "ProcurementViewer__",
                    storageType: Lib.P2P.UsersBrowse.StorageType.Control,
                    dialogTitle: "_ProcurementViewer",
                    select2CtrlOptions: usersOrGroupsOptions,
                    select2CtrlLabel: "_UserPopup_UsersOrGroups",
                    storeDisplayName: false
                });
            }
            const controlsNeedingStandardPurchasing = ["EnableChatGPT__", "DisplayTaxCode__", "DefaultUnitOfMeasure__", "DisplayCostType__", "MultiShipTo__", "AllowRequestedDeliveryDateInPast__", "AllowUserUpdatePOCurrency__", "AllowBuyerToReceiveOnBehalfOfRecipient__", "ProcurementViewerDisplay__", "InvoicedProcessCancellationBehavior__", "TreasurerLogin__"];
            // if undefined,ENABLEPURCHASINGGLOBALSETTING__ will be set and handle the display of the page
            const isProcStandardEnabled = CustomScript.globalSettings.ENABLESTANDARDPURCHASINGGLOBALSETTING__ === undefined ? true : CustomScript.globalSettings.ENABLESTANDARDPURCHASINGGLOBALSETTING__ === "1";
            for (const controlName of controlsNeedingStandardPurchasing) {
                const Control = Controls[controlName];
                if (!Control)
                    continue;
                Control.Hide(!isProcStandardEnabled);
            }
            Controls.BudgetManagement_pane.Hide(!isProcStandardEnabled);
            Controls.Purchasing_General_pane.Hide(!isProcStandardEnabled);
            purchasingStep.initUNSPSC();
            // Always call this function to hide the associated advanced pane
            Sys.Wizard.Tools.HandleHTMLToggle(Controls.BudgetManagementMoreOptions__, budgetManagementMoreOptionsControls, Language.Translate("More options"));
        },
        onQuit: function () {
            return true;
        },
        showBudgetManagementMoreOptions: function () {
            Controls.BudgetManagementMoreOptions__.Hide(!Controls.EnableBudget__.IsChecked());
            budgetManagementMoreOptionsControls.Hide(true);
        },
        initUNSPSC: function () {
            Controls.EnableVendorUNSPSCBrowse__.OnChange = function () {
                if (Controls.EnableAddingUNSPSCInVendorRegistration__.IsChecked() && !Controls.EnableVendorUNSPSCBrowse__.IsChecked()) {
                    Popup.Confirm("_DisableUNSPSCWarningPopupMessage", false, function () {
                        Controls.EnableAddingUNSPSCInVendorRegistration__.Check(false);
                    }, function () {
                        // Restore the previous state of the EnableVendorUNSPSCBrowse__ control
                        Controls.EnableVendorUNSPSCBrowse__.Check(true);
                    }, "_DisableUNSPSCWarningPopupTitle");
                }
                Controls.EnableAddingUNSPSCInVendorRegistration__.SetReadOnly(!this.IsChecked());
            };
        }
    };
    /**
     * Manage Vendor Contract
     */
    const vendorContractStep = {
        panels: [Controls.Contract_pane, Controls.Contract_integration_pane],
        icon: "fa fa-file-text",
        title: "_Vendor_contract_tab_title",
        helpId: 5122,
        isVisible: function () {
            return CustomScript.globalSettings.ENABLECONTRACTGLOBALSETTING__ === "1";
        },
        onStart: function () {
            Controls.DefaultContractSignatureDesigner__.Hide(CustomScript.globalSettings.ENABLEDOCUSIGNINTEGRATION__ !== "1");
        },
        onQuit: function () {
            return true;
        }
    };
    /**
     * Manage Expense
     */
    const expenseStep = {
        panels: [Controls.Expense_options_pane],
        icon: "esk-ifont-receipt",
        title: "_Expense_tab_title",
        helpId: 5009,
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEEXPENSECLAIMSGLOBALSETTING__ === "1";
        },
        onStart: function () {
            //Nothing to do
        },
        onQuit: function () {
            return true;
        }
    };
    /**
     * Manage the Destination Recognition step
     */
    let OCRFlag = false;
    CustomScript.destinationRecognitionStep = {
        panels: [Controls.EDI_pane, Controls.Routing_Information, Controls.Recognition_pane, Controls.OCRParameters_pane],
        icon: "fa-external-link",
        title: "Routing_Recognition",
        helpId: 2502,
        OCRSettings: {
            LoadOCRJsonOverrideSettings: function () {
                OCRFlag = true;
                // Fill the languages list
                let OCRLanguages = Process.GetOCRLanguages();
                // This customization was previously located at Lib.AP.Customization.HTMLScripts.APWizard.Common.CustomizeOCRLanguagesList
                // For compatibility reason, still try to get OCR language list from the old location before switching to the new one
                // or use the default one
                OCRLanguages = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.APWizard.Common.CustomizeOCRLanguagesList", OCRLanguages)
                    || Sys.Helpers.TryCallFunction("Lib.AP.Customization.Wizard.Common.CustomizeOCRLanguagesList", OCRLanguages)
                    || OCRLanguages;
                Controls.OCRLanguagesList__.SetAvailableValues([]);
                Controls.OCRLanguagesList__.AddOptions(OCRLanguages);
                // Try to parse the settings from the record
                let OCRJsonOverrideSettings;
                try {
                    OCRJsonOverrideSettings = JSON.parse(Data.GetValue("OCRJsonOverrideSettings__"));
                }
                catch (e) {
                    OCRJsonOverrideSettings = null;
                }
                // Show or not the parameters
                function UpdateOcrFieldsVisibility() {
                    const checked = Controls.EnableOverrideOCRParameters__.IsChecked();
                    const isGoogleCloud = Controls.OCREngineList__.GetValue() === "GoogleCloudVision";
                    Controls.OCREngineList__.Hide(!checked || !ProcessInstance.isDebugActive);
                    const hideOptions = !checked || isGoogleCloud;
                    Controls.OCRImageBinarization__.Hide(hideOptions);
                    Controls.OCRImageDraftFax__.Hide(hideOptions);
                    Controls.OCRImageDespeckle__.Hide(hideOptions);
                    Controls.OCRPdfProcessing__.Hide(hideOptions);
                    Controls.OCRTolerantWordSeparation__.Hide(hideOptions);
                    Controls.OCRGlobalPerformances__.Hide(hideOptions);
                    Controls.OCRLanguagesList__.Hide(hideOptions);
                }
                Controls.EnableOverrideOCRParameters__.OnChange = UpdateOcrFieldsVisibility;
                // Fill the form
                if (OCRJsonOverrideSettings) {
                    Controls.EnableOverrideOCRParameters__.Check(true);
                    Controls.OCREngineList__.SetValue(OCRJsonOverrideSettings.ocr_engine ? OCRJsonOverrideSettings.ocr_engine : "KeepOriginalEngine");
                    Controls.OCRPdfProcessing__.SelectOption(OCRJsonOverrideSettings["pdf-processing"]);
                    Controls.OCRLanguagesList__.DeselectAllOptions();
                    if (Object.prototype.hasOwnProperty.call(OCRJsonOverrideSettings, "allowed-language")) {
                        Controls.OCRLanguagesList__.SelectOptions(OCRJsonOverrideSettings["allowed-language"].split("\n"));
                    }
                    Controls.OCRImageDraftFax__.Check(OCRJsonOverrideSettings["image-draft-fax"] === "yes");
                    Controls.OCRImageDespeckle__.Check(OCRJsonOverrideSettings["image-despeckle"] === "yes");
                    if (Object.prototype.hasOwnProperty.call(OCRJsonOverrideSettings, "ocr-tolerant-word-separation")) {
                        Controls.OCRTolerantWordSeparation__.Check(OCRJsonOverrideSettings["ocr-tolerant-word-separation"] === "33");
                    }
                    Controls.OCRImageBinarization__.SelectOption(OCRJsonOverrideSettings["image-binarization"]);
                    Controls.OCRGlobalPerformances__.SelectOption(OCRJsonOverrideSettings["trade-off"]);
                }
                else {
                    Controls.EnableOverrideOCRParameters__.Check(false);
                }
                function backupOcrEngine() {
                    if (!OCRJsonOverrideSettings) {
                        OCRJsonOverrideSettings = {};
                    }
                    OCRJsonOverrideSettings.ocr_engine = Controls.OCREngineList__.GetValue();
                }
                Controls.OCREngineList__.OnChange = () => {
                    if (Controls.OCREngineList__.GetValue() === "GoogleCloudVision") {
                        Popup.Confirm("_OCREngineList_GoogleCloudVision_Confirm_Selection_Message", false, () => {
                            // Confirm OK
                            backupOcrEngine();
                            UpdateOcrFieldsVisibility();
                        }, () => {
                            // Confirm Cancel
                            // Restore previous selected value
                            let previousValue = "KeepOriginalEngine";
                            if (OCRJsonOverrideSettings && OCRJsonOverrideSettings.ocr_engine) {
                                previousValue = OCRJsonOverrideSettings.ocr_engine;
                            }
                            Controls.OCREngineList__.SetValue(previousValue);
                        }, "_OCREngineList_GoogleCloudVision_Confirm_Selection_Title");
                    }
                    else {
                        // Backup selected value in case of cancelation of Cloud Vision after
                        backupOcrEngine();
                        UpdateOcrFieldsVisibility();
                    }
                };
                UpdateOcrFieldsVisibility();
            },
            SaveOCRJsonOverrideSettings: function () {
                if (Controls.EnableOverrideOCRParameters__.IsChecked()) {
                    const ocrEngine = Controls.OCREngineList__.GetValue() !== "KeepOriginalEngine" ? Controls.OCREngineList__.GetValue() : null;
                    const draftFax = Controls.OCRImageDraftFax__.IsChecked() ? "yes" : "no";
                    const despeckle = Controls.OCRImageDespeckle__.IsChecked() ? "yes" : "no";
                    const tolerance = Controls.OCRTolerantWordSeparation__.IsChecked() ? "33" : "no";
                    let sLanguages = "";
                    const sLanguagesArray = Controls.OCRLanguagesList__.GetSelectedOptions();
                    if (sLanguagesArray) {
                        for (const i in sLanguagesArray) {
                            if (sLanguagesArray[i] !== "") {
                                sLanguages += sLanguagesArray[i];
                                sLanguages += "\n";
                            }
                        }
                        sLanguages = sLanguages.slice(0, sLanguages.length - 1);
                    }
                    const json = {
                        "pdf-processing": Controls.OCRPdfProcessing__.GetSelectedOption(),
                        "image-draft-fax": draftFax,
                        "image-despeckle": despeckle,
                        "ocr-tolerant-word-separation": tolerance,
                        "image-binarization": Controls.OCRImageBinarization__.GetSelectedOption(),
                        "trade-off": Controls.OCRGlobalPerformances__.GetSelectedOption()
                    };
                    if (sLanguages) {
                        json["allowed-language"] = sLanguages;
                    }
                    if (ocrEngine) {
                        json.ocr_engine = ocrEngine;
                    }
                    const customizedJson = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Wizard.CustomizeOCRJsonSettings", json);
                    const finalJson = customizedJson || json;
                    Data.SetValue("OCRJsonOverrideSettings__", JSON.stringify(finalJson));
                }
                else if (OCRFlag === true) {
                    Data.SetValue("OCRJsonOverrideSettings__", "");
                }
            }
        },
        onStart: function () {
            Sys.Wizard.Tools.HandleHTMLToggle(Controls.DestinationMoreOptionsInvoiceDestination__, Controls.DefaultAPClerkEnd__, Language.Translate("More options"));
            Controls.ReconciliationType__.OnChange = CustomScript.destinationRecognitionStep.ReconciliationType.onChange;
            Controls.HeaderFooterThreshold__.OnChange = CustomScript.destinationRecognitionStep.HeaderFooterThreshold.validate;
            CustomScript.destinationRecognitionStep.HeaderFooterThreshold.updateVisibility();
            CustomScript.destinationRecognitionStep.OCRSettings.LoadOCRJsonOverrideSettings();
            Controls.Autolearning_Folder__.OnChange = CustomScript.destinationRecognitionStep.onAutolearningFolderChanged;
            CustomScript.destinationRecognitionStep.onAutolearningFolderChanged();
            Controls.NonPOInvoiceEDIGroupLinesByTax__.OnChange = CustomScript.destinationRecognitionStep.NonPOGroupEDILinesOnChanged;
            CustomScript.destinationRecognitionStep.NonPOGroupEDILinesOnChanged();
            Controls.DisplayAllowanceChargeOnNonPOLines__.OnChange = CustomScript.destinationRecognitionStep.DisplayAllowanceChargeOnNonPOLinesOnChanged;
            CustomScript.destinationRecognitionStep.DisplayAllowanceChargeOnNonPOLinesOnChanged();
        },
        onQuit: function () {
            let isValid = true;
            if (Controls.CompanyCode__.GetError()) {
                isValid = false;
            }
            CustomScript.destinationRecognitionStep.OCRSettings.SaveOCRJsonOverrideSettings();
            CustomScript.destinationRecognitionStep.HeaderFooterThreshold.validate();
            return isValid;
        },
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEACCOUNTPAYABLEGLOBALSETTING__ === "1";
        },
        ReconciliationType: {
            onChange: function () {
                if (Controls.ReconciliationType__.GetValue() === "LineItems") {
                    Controls.HeaderFooterThreshold__.SetValue("");
                }
                CustomScript.destinationRecognitionStep.HeaderFooterThreshold.updateVisibility();
            }
        },
        HeaderFooterThreshold: {
            updateVisibility: function () {
                Controls.HeaderFooterThreshold__.Hide(Controls.ReconciliationType__.GetSelectedOption() !== "HeaderFooter");
            },
            validate: function () {
                const isHeaderFooter = Controls.ReconciliationType__.GetValue() === "HeaderFooter";
                Controls.HeaderFooterThreshold__.SetWarning("");
                if (isHeaderFooter) {
                    // Validate the value
                    const validationRegEx = new RegExp(/^[0-9.]+\s?%?$/);
                    if (!validationRegEx.test(Controls.HeaderFooterThreshold__.GetValue())) {
                        Controls.HeaderFooterThreshold__.SetWarning(Language.Translate("_HeaderFooterThreshold_InvalidValue"));
                    }
                }
                return !Controls.HeaderFooterThreshold__.GetWarning();
            }
        },
        onAutolearningFolderChanged: function () {
            // Only allow to select the fallback on common folder if a folder is specified
            const value = Controls.Autolearning_Folder__.GetValue();
            if (value) {
                Controls.Autolearning_FallbackOnCommonFolder__.SetReadOnly(false);
            }
            else {
                Controls.Autolearning_FallbackOnCommonFolder__.SetValue("");
                Controls.Autolearning_FallbackOnCommonFolder__.SetReadOnly(true);
            }
        },
        NonPOGroupEDILinesOnChanged: function () {
            const value = Controls.NonPOInvoiceEDIGroupLinesByTax__.GetValue();
            if (value) {
                Controls.DisplayAllowanceChargeOnNonPOLines__.SetValue(false);
                Controls.DisplayAllowanceChargeOnNonPOLines__.SetReadOnly(true);
            }
            else {
                Controls.DisplayAllowanceChargeOnNonPOLines__.SetReadOnly(false);
            }
        },
        DisplayAllowanceChargeOnNonPOLinesOnChanged: function () {
            const value = Controls.DisplayAllowanceChargeOnNonPOLines__.GetValue();
            if (value) {
                Controls.NonPOInvoiceEDIGroupLinesByTax__.SetValue(false);
                Controls.NonPOInvoiceEDIGroupLinesByTax__.SetReadOnly(true);
            }
            else {
                Controls.NonPOInvoiceEDIGroupLinesByTax__.SetReadOnly(false);
            }
        }
    };
    /**
     * Manage the Verification Coding step of the wizard
     */
    const verificationCodingStep = {
        panels: [
            Controls.Verification_pane,
            Controls.DuplicateCheck_pane,
            Controls.Coding_pane,
            Controls.Taxes_pane,
            Controls.IntercompanyInvoice_pane,
            Controls.PostingDate_pane,
            Controls.PlannedDeliveryCosts_pane,
            Controls.VerificationAndCodingActions_pane
        ],
        icon: "fa-eye",
        title: "Verification_coding_pane",
        helpId: 2503,
        onStart: function () {
            verificationCodingStep.initLayout();
            Controls.POMatching__.OnChange = verificationCodingStep.POMatchingOnChange;
            verificationCodingStep.POMatchingOnChange();
        },
        onQuit: function () {
            return true;
        },
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEACCOUNTPAYABLEGLOBALSETTING__ === "1";
        },
        initLayout: function () {
            const erpConnector = Data.GetValue("ERP__");
            const isAPSAP = erpConnector === "SAP";
            const isAPSAPS4HANA = erpConnector === "SAPS4CLOUD";
            const isAPNAV = erpConnector === "NAV";
            const isAPEBS = erpConnector === "EBS";
            const isAPJDE = erpConnector === "JDE";
            Controls.SAPDuplicateCheck__.Hide(!isAPSAP);
            Controls.PaymentTermsSource__.Hide(!isAPSAP /*&& !isAPSAPS4HANA*/); // Payment terms source will be available for SAP S4/Hana when connector will be released.
            Controls.CodingEnableCompanyCode__.Hide(!isAPSAP && !isAPSAPS4HANA);
            Controls.CodingEnableWBSElement__.Hide(!isAPSAP && !isAPSAPS4HANA);
            Controls.CodingEnableBusinessArea__.Hide(!isAPSAP && !isAPSAPS4HANA);
            Controls.CodingEnableAssignments__.Hide(!isAPSAP && !isAPSAPS4HANA);
            Controls.CodingEnableInternalOrder__.Hide(!isAPSAP && !isAPSAPS4HANA);
            Controls.CodingEnableTradingPartner__.Hide(!isAPSAP && !isAPSAPS4HANA);
            Controls.CodingEnableProjectCode__.Hide(isAPSAP || isAPSAPS4HANA || isAPEBS || isAPJDE);
            Controls.CodingEnableProfitCenter__.Hide(!isAPSAP);
            Controls.IntercompanyInvoice_pane.Hide(isAPSAPS4HANA);
            Controls.ArchiveIntercompanyInvoices__.OnChange = verificationCodingStep.onArchiveIntercompanyInvoicesChanged;
            Controls.ArchiveIntercompanyInvoices__.OnChange();
            // The taxes pane is only visible in SAP connected mode
            Controls.Taxes_pane.Hide(isAPSAPS4HANA || isAPNAV || isAPJDE);
            Controls.TaxesWithholdingTax__.Hide(isAPSAPS4HANA || isAPNAV || isAPEBS || isAPJDE);
            Controls.MultiTaxesOnALineItem__.Hide(isAPSAP || isAPSAPS4HANA || isAPNAV || isAPJDE);
            if (isAPSAP || isAPSAPS4HANA || isAPNAV || isAPJDE) {
                Controls.MultiTaxesOnALineItem__.SetValue(false);
            }
            // The Planned delivery costs pane is only visible in SAP connected mode
            Controls.PlannedDeliveryCosts_pane.Hide(!isAPSAP);
            Controls.PlannedPricingConditions__.Hide(!isAPSAP);
            Controls.EnergyConsumption_pane.Hide(!Data.GetValue("EnableEnergyConsumptionReporting__"));
            Controls.EnableEnergyConsumptionReporting__.Hide(true);
            Controls.GHGConversionFactorSource__.Hide(false);
            // PO matching mode is defined in SAP
            if (isAPSAP) {
                Controls.POMatching__.Hide(true);
                Controls.POMatching__.SetValue("Enabled");
                Controls.VerificationPOMatchingMode__.SetHelpData("_HelpVerificationPOMatchingMode");
            }
            else {
                Controls.POMatching__.Hide(false);
                Controls.VerificationPOMatchingMode__.SetHelpData("");
            }
        },
        onArchiveIntercompanyInvoicesChanged: function () {
            const archiveInterco = this.IsChecked();
            Controls.EnableTouchlessForIntercompanyInvoices__.SetReadOnly(!archiveInterco);
            if (!archiveInterco) {
                Controls.EnableTouchlessForIntercompanyInvoices__.SetValue(false);
            }
        },
        POMatchingOnChange: function () {
            if (Data.GetValue("ERP__") !== "SAP") {
                const value = Controls.POMatching__.GetValue();
                Controls.VerificationPOMatchingMode__.Hide(value === "Disabled");
            }
        }
    };
    /**
     * Manage the Worflow step of the wizard
     */
    const paymentApprovalWorkflowStep = {
        panels: [Controls.Workflow_pane, Controls.WorkflowActions_pane],
        icon: "fa-check-circle-o",
        title: "Payment_approval_workflow",
        helpId: 2504,
        associatedControls: {
            "CodingEnableCostCenter__": Controls.WorkflowReviewersCanModifyCostCenter__,
            "CodingEnableGLAccount__": Controls.WorkflowReviewersCanModifyGLAccount__,
            "CodingEnableCompanyCode__": Controls.WorkflowReviewersCanModifyCompanyCode__,
            "CodingEnableWBSElement__": Controls.WorkflowReviewersCanModifyWBSElement__,
            "CodingEnableBusinessArea__": Controls.WorkflowReviewersCanModifyBusinessArea__,
            "CodingEnableAssignments__": Controls.WorkflowReviewersCanModifyAssignments__,
            "CodingEnableInternalOrder__": Controls.WorkflowReviewersCanModifyInternalOrder__,
            "CodingEnableTradingPartner__": Controls.WorkflowReviewersCanModifyTradingPartner__,
            "CodingEnableProjectCode__": Controls.WorkflowReviewersCanModifyProjectCode__,
            "CodingEnableProfitCenter__": Controls.WorkflowReviewersCanModifyProfitCenter__
        },
        onStart: function () {
            // Display/Hide specifics fields for SAP
            const erpConnector = Data.GetValue("ERP__");
            const isAPSAP = erpConnector === "SAP";
            const isAPSAPS4HANA = erpConnector === "SAPS4CLOUD";
            const isAPEBS = erpConnector === "EBS";
            const isAPJDE = erpConnector === "JDE";
            Controls.WorkflowReviewersCanModifyCompanyCode__.Hide(!isAPSAP);
            Controls.WorkflowReviewersCanModifyWBSElement__.Hide(!isAPSAP);
            Controls.WorkflowReviewersCanModifyBusinessArea__.Hide(!isAPSAP);
            Controls.WorkflowReviewersCanModifyAssignments__.Hide(!isAPSAP);
            Controls.WorkflowReviewersCanModifyInternalOrder__.Hide(!isAPSAP);
            Controls.WorkflowReviewersCanModifyTradingPartner__.Hide(!isAPSAP);
            Controls.WorkflowReviewersCanModifyProjectCode__.Hide(isAPSAP || isAPSAPS4HANA || isAPEBS || isAPJDE);
            Controls.WorkflowReviewersCanModifyProfitCenter__.Hide(!isAPSAP);
            paymentApprovalWorkflowStep.syncWorkflowAxisWithCoding();
            Controls.CodingEnableCostCenter__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableGLAccount__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableCompanyCode__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableWBSElement__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableBusinessArea__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableAssignments__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableInternalOrder__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableTradingPartner__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableProjectCode__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.CodingEnableProfitCenter__.OnChange = paymentApprovalWorkflowStep.onCodingVisibilityChanged;
            Controls.WorkflowReviewersCanAddLineItems__.OnChange = paymentApprovalWorkflowStep.onWorkflowReviewersCanAddLineItemsChange;
            Controls.WorkflowAutoEscalationDays__.OnChange = paymentApprovalWorkflowStep.onWorkflowAutoEscalationDaysChange;
        },
        onQuit: function () {
            return true;
        },
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEACCOUNTPAYABLEGLOBALSETTING__ === "1";
        },
        syncWorkflowAxisWithCoding: function () {
            // Enable/Disable not selected in previous step
            for (const c in paymentApprovalWorkflowStep.associatedControls) {
                if (Object.prototype.hasOwnProperty.call(paymentApprovalWorkflowStep.associatedControls, c)) {
                    const workflowControl = paymentApprovalWorkflowStep.associatedControls[c];
                    const codingControl = Controls[c];
                    workflowControl.SetReadOnly(!codingControl.IsChecked() || Controls.WorkflowReviewersCanAddLineItems__.IsChecked());
                    if (Controls.WorkflowReviewersCanAddLineItems__.IsChecked()) {
                        workflowControl.Check(codingControl.IsChecked());
                    }
                    if (!codingControl.IsChecked()) {
                        workflowControl.Check(false);
                    }
                }
            }
            if (Controls.WorkflowReviewersCanAddLineItems__.GetValue()) {
                Controls.WorkflowReviewersCanAddLineItems__.SetHelpData("_InfoWorkflowReviewersCanAddLineItems", "", "HTML Format");
            }
            else {
                Controls.WorkflowReviewersCanAddLineItems__.SetHelpData("", "", "HTML Format");
            }
        },
        onCodingVisibilityChanged: function () {
            if (!this.IsChecked()) {
                const workflowControl = paymentApprovalWorkflowStep.associatedControls[this.GetName()];
                if (workflowControl) {
                    workflowControl.Check(false);
                }
            }
        },
        onWorkflowReviewersCanAddLineItemsChange: function () {
            paymentApprovalWorkflowStep.syncWorkflowAxisWithCoding();
        },
        onWorkflowAutoEscalationDaysChange: function () {
            Controls.WorkflowAutoEscalationDays__.SetError("");
            const value = Controls.WorkflowAutoEscalationDays__.GetValue();
            if (typeof value === "number" && value <= 0) {
                Controls.WorkflowAutoEscalationDays__.SetError(Language.Translate("_ValueCannotBeNegative"));
            }
        }
    };
    /**
     * Manage the Payment step of the wizard
     */
    const paymentStep = {
        panels: [Controls.Payment_pane],
        icon: "fa-credit-card",
        title: "_Payment",
        helpId: 2536,
        isVisible: function () {
            return CustomScript.globalSettings.ENABLEEPAYMENTRUNGLOBALSETTING__ === "1";
        },
        onStart: function () {
            const isAPSAP = Data.GetValue("ERP__") === "SAP";
            Controls.PaymentProvider__.SetReadOnly(isAPSAP);
            if (isAPSAP && Controls.PaymentProvider__.GetSelectedOption() !== "") {
                Controls.PaymentProvider__.SetValue("");
            }
            Controls.PaymentProvider__.OnChange = paymentStep.HandleNvoicePay;
            paymentStep.HandleNvoicePay();
        },
        onQuit: function () {
            const isAPSAP = Data.GetValue("ERP__") === "SAP";
            if (isAPSAP && Controls.PaymentProvider__.GetValue() !== "") {
                Controls.PaymentProvider__.SetValue("");
                paymentStep.HandleNvoicePay(true);
            }
            return true;
        },
        HandleNvoicePay: function (cleanControlsValueIfHidden = false) {
            const hideNvoicePayControls = Controls.PaymentProvider__.GetValue() !== "NvoicePay";
            Controls.PaymentProviderLogin__.Hide(hideNvoicePayControls);
            Controls.PaymentProviderPassword__.Hide(hideNvoicePayControls);
            Controls.PaymentProviderBankAccountId__.Hide(hideNvoicePayControls);
            Controls.PaymentProviderLocationId__.Hide(hideNvoicePayControls);
            Controls.PaymentProviderCompanyId__.Hide(hideNvoicePayControls);
            if (cleanControlsValueIfHidden && hideNvoicePayControls) {
                Controls.PaymentProviderLogin__.SetValue("");
                Controls.PaymentProviderPassword__.SetValue("");
                Controls.PaymentProviderBankAccountId__.SetValue("");
                Controls.PaymentProviderLocationId__.SetValue("");
                Controls.PaymentProviderCompanyId__.SetValue("");
            }
        }
    };
    /**
     * Manage the Archive step of the wizard
     */
    const archivingStep = {
        panels: [Controls.Archiving_pane, Controls.Procurement_Archiving_Pane, Controls.Expense_Archiving_Pane, Controls.Contract_Archiving_Pane, Controls.Project_Archiving_Pane],
        icon: "fa-archive",
        title: "Archiving_Vendor_Portal",
        helpId: 2538,
        onStart: function () {
            const signatureFormat = Data.GetValue("SignatureFormat__");
            if (signatureFormat === null || signatureFormat === "") {
                Data.SetValue("SignatureFormat__", Controls.SignInvoicesForArchiving__.IsChecked() ? "CADESA" : "PADESLTV");
            }
            archivingStep.handleSignFormat();
            Controls.SignInvoicesForArchiving__.OnChange = archivingStep.handleSignFormat;
            Controls.Archiving_pane.Hide(CustomScript.globalSettings.ENABLEACCOUNTPAYABLEGLOBALSETTING__ !== "1");
            Controls.Procurement_Archiving_Pane.Hide(CustomScript.globalSettings.ENABLEPURCHASINGGLOBALSETTING__ !== "1");
            Controls.Expense_Archiving_Pane.Hide(CustomScript.globalSettings.ENABLEEXPENSECLAIMSGLOBALSETTING__ !== "1");
            Controls.Contract_Archiving_Pane.Hide(CustomScript.globalSettings.ENABLECONTRACTGLOBALSETTING__ !== "1");
            Controls.Project_Archiving_Pane.Hide(CustomScript.globalSettings.ENABLEPROJECT__ !== "1");
            Controls.ContractArchiveDurationPortalInMonths__.Hide(CustomScript.globalSettings.ENABLECONTRACTPUBLICATION__ !== "1");
        },
        onQuit: function () {
            return true;
        },
        handleSignFormat: function () {
            const hideSignFormatControl = !Controls.SignInvoicesForArchiving__.IsChecked();
            Controls.SignatureFormat__.Hide(hideSignFormatControl);
        }
    };
    /**
     * Customizations step
     */
    const customizationsStep = {
        panels: [Controls.Customizations_pane],
        icon: "fas fa-cogs",
        title: "_Customizations_tab_title",
        isVisible: function () {
            return false;
        },
        onStart: null,
        onQuit: function () {
            return true;
        }
    };
    /**
     * Labs step
     */
    const labsStep = {
        panels: [Controls.Labs_pane],
        icon: "fa-flask",
        title: "Labs",
        helpId: 2539,
        onStart: function () {
            const ERPIsSAP = Data.GetValue("ERP__") === "SAP";
            const ERPIsGeneric = Data.GetValue("ERP__") === "generic";
            Controls.EnableConsignmentStock__.Hide(!ERPIsSAP);
            Controls.EnableDoNotUseTaxCode__.Hide(!ERPIsSAP);
            Controls.EnableConsignmentStock__.OnChange = CustomScript.generalStep.handleERP;
            Controls.EnableDownPaymentInvoice__.Hide(!ERPIsGeneric && !ERPIsSAP);
            labsStep.adaptAllowTouchlessWithPriceQtyMismatchVisibility();
            if (User.isInDemoAccount) {
                Controls.EnableSupplierScoring__.Hide(false);
            }
            topMessageWarning.Add(Language.Translate("_LabsWarningMessage"));
        },
        onQuit: function () {
            topMessageWarning.Clear();
            return !Controls.CompanyCode__.GetError();
        },
        hideStep: function () {
            for (const panel of labsStep.panels) {
                panel.Hide(true);
            }
        },
        GetLabel: function () {
            return null;
        },
        adaptAllowTouchlessWithPriceQtyMismatchVisibility: function () {
            if (Controls.ExceptionResolutionMode__.GetValue() === Lib.AP.ExceptionResolutionMode.Header) {
                Data.SetValue("AllowTouchlessWithPriceQtyMismatch__", false);
                Controls.AllowTouchlessWithPriceQtyMismatch__.Hide(true);
            }
            else {
                Controls.AllowTouchlessWithPriceQtyMismatch__.Hide(false);
            }
        }
    };
    const FieldNameLastModifiedDateTime = "LASTMODIFIEDDATETIME__";
    const FieldNameOrderNumberPatterns = "ORDERNUMBERPATTERNS__";
    const FieldNameGoodIssueNumberPatterns = "GOODISSUENUMBERPATTERNS__";
    const FieldNameArchiveRoutingAddressMatch = "ARCHIVEROUTINGADDRESSMATCH__";
    const FieldNameDisableBudget = "DISABLEBUDGET__";
    const FieldNameEnableBudget = "ENABLEBUDGET__";
    /**
     * Fields list to display in multiline controls
     * Values are stored as semi-column separated values in the configuration, but will be displayed as different
     * lines in the control of the Wizard.
     * Variable is exported to be extended with any custom control in User exit
     */
    CustomScript.MultiValuedFieldsToDisplayAsMultiLine = [FieldNameOrderNumberPatterns, FieldNameGoodIssueNumberPatterns, FieldNameArchiveRoutingAddressMatch];
    function InitializeConfigurationValues(callback) {
        function InitializeGeneralPane() {
            if (Variable.GetValueAsString("isCloning") === "1") {
                Data.SetValue("ConfigurationName__", null);
                Data.SetValue("LastModifiedDateTime__", null);
                Data.SetValue("LastModifiedBy__", null);
                Controls.ConfigurationName__.SetReadOnly(false);
            }
            else {
                //The configuration has been loaded from an existing record : it must not be modified !!
                const configurationName = Data.GetValue("ConfigurationName__");
                if (configurationName) {
                    Controls.ConfigurationName__.SetReadOnly(true);
                    CustomScript.generalStep.setLastModifiedInformationsVisible(true);
                    Variable.SetValueAsString("ConfigurationLoaded", configurationName);
                    Variable.SetValueAsString("oldERPConnector", Data.GetValue("ERP__"));
                    Variable.SetValueAsString("oldEnablePeppolC5Reporting", Data.GetValue("EnablePeppolC5Reporting__") ? "true" : "false");
                }
            }
        }
        function StoreConfigurationName() {
            const err = this.GetQueryError();
            if (err) {
                EndInitialization();
                Popup.Alert(err);
                return;
            }
            const existingConfNames = [];
            for (let i = 0; i < this.GetRecordsCount(); i++) {
                existingConfNames.push(this.GetQueryValue("ConfigurationName__", i));
            }
            Variable.SetValueAsString("ExistingConfigurations", JSON.stringify(existingConfNames));
            EndInitialization();
        }
        function IsFieldToDisplayAsMultiline(field) {
            return CustomScript.MultiValuedFieldsToDisplayAsMultiLine.indexOf(field.toUpperCase()) >= 0;
        }
        function FillValueForField(query, field) {
            let value = query.GetQueryValue(field);
            if (field.toUpperCase() === FieldNameLastModifiedDateTime) {
                const dateLastModification = Sys.Helpers.Date.ISOSTringToDate(value);
                value = Sys.Helpers.Date.GetDateInUserTimezone(dateLastModification, User.utcOffset);
            }
            else if (IsFieldToDisplayAsMultiline(field)) {
                const table = value.split(";");
                value = "";
                for (let i = 0; i < table.length; i++) {
                    value = value + table[i] + (i === table.length - 1 ? "" : "\n");
                }
            }
            else if (field.toUpperCase() === FieldNameDisableBudget) {
                field = FieldNameEnableBudget;
                value = value === "0" ? "1" : "0";
            }
            Data.SetValue(field, value);
        }
        function FillValues(query) {
            const fields = query.GetQueryValue().RecordsDefinition;
            let count = 0;
            for (const field in fields) {
                if (/.*__$/.test(field)) {
                    FillValueForField(query, field);
                    count++;
                }
            }
            Log.Info(`Sucessfully initialized ${count} values for the configuration`);
        }
        // handle upgrade on newly-added fields
        function FillDefaultValuesForExistingConfiguration(query) {
            const defaultValuesMap = {
                EnablePortalAccountCreation__: true,
                ContractTypeRequired__: true
            };
            const headers = query.GetQueryValue().RecordsDefinition;
            for (const defaultValueKey in defaultValuesMap) {
                if (!(defaultValueKey.toUpperCase() in headers)) {
                    // Set the default value
                    Data.SetValue(defaultValueKey, defaultValuesMap[defaultValueKey]);
                }
            }
        }
        function FillValuesCallback() {
            const err = this.GetQueryError();
            if (err) {
                EndInitialization();
                Popup.Alert(err);
                return;
            }
            if (this.GetRecordsCount() === 1) {
                FillDefaultValuesForExistingConfiguration(this);
                FillValues(this);
                InitializeGeneralPane();
            }
            const currentConfigurationName = Data.GetValue("ConfigurationName__");
            // Only query if it's a new configuration => configuration name is empty
            if (!currentConfigurationName) {
                // Query all configuration names
                Query.DBQuery(StoreConfigurationName, "AP - Application Settings__", "ConfigurationName__");
            }
            callback();
            if (currentConfigurationName) {
                EndInitialization();
            }
        }
        function FillGlobalValuesCallback() {
            const err = this.GetQueryError();
            if (err) {
                EndInitialization();
                Popup.Alert(err);
                return;
            }
            const nbRecords = this.GetRecordsCount();
            if (nbRecords === 1) {
                const fields = this.GetQueryValue().RecordsDefinition;
                let count = 0;
                for (const field in fields) {
                    if (/.*__$/.test(field)) {
                        CustomScript.globalSettings[field] = this.GetQueryValue(field);
                        count++;
                    }
                }
                Log.Info(`Successfully initialized ${count} global values for the configuration`);
            }
            //The record that must be loaded is set using the "AncestorsRuid" variable
            Query.DBQuery(FillValuesCallback, "AP - Application Settings__", "", "Ruid=" + Variable.GetValueAsString("AncestorsRuid"));
        }
        function FillERPConnectorsCallback() {
            const err = this.GetQueryError();
            if (err) {
                Popup.Alert(err);
                return;
            }
            const nbRecords = this.GetRecordsCount();
            const existingERPs = Controls.ERP__.GetAvailableValues();
            const connectorIdSet = new Set();
            const currentChoice = Data.GetValue("ERP__");
            if (nbRecords > 0) {
                for (let i = 0; i < nbRecords; i++) {
                    const connectorId = this.GetQueryValue("ConnectorId__", i);
                    existingERPs.push(`CustomERP_${connectorId}=${connectorId}`);
                    connectorIdSet.add(connectorId);
                }
                Controls.ERP__.SetAvailableValues(existingERPs);
            }
            if (!connectorIdSet.has(currentChoice) && !existingERPs.some(existingERP => existingERP.includes(currentChoice))) {
                Data.SetValue("ERPConnectorConfiguration__", "");
                Data.SetValue("ERP__", "generic");
                Controls.ERP__.SetError("_Previously selected {0} ERP has been removed", currentChoice);
                CustomScript.generalStep.handleERP();
            }
            ProcessInstance.SetSilentChange(false);
        }
        function EndInitialization() {
            //Load ERP Connectors after all configuration values have been loaded, or if there is no configuration at the end of initialization to get the connector that was set
            ProcessInstance.SetSilentChange(true);
            Query.DBQuery(FillERPConnectorsCallback, "Sys_PartnerConnectors__", "", "", null, 100);
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.Wizard.OnHTMLScriptEnd");
            ProcessInstance.SetSilentChange(false);
        }
        ProcessInstance.SetSilentChange(true);
        Query.DBQuery(FillGlobalValuesCallback, "P2P - Global Application Settings__", "");
    }
    function parseFunctionModule(sapResults) {
        // Get list of TABLES,USING and CHANGING for every PERFORM
        const performs = [];
        let currentPerform = null;
        let currentGroup = null;
        for (const sapResult of sapResults) {
            const line = sapResult.LINE;
            // Skip comments
            if (line.indexOf("*") === 0) {
                continue;
            }
            // Check new "perform" (function call)
            const performIndex = line.toUpperCase().indexOf("PERFORM");
            if (performIndex !== -1) {
                currentPerform = { name: line.substr(performIndex + 8).split(/ |\./)[0] };
                performs.push(currentPerform);
            }
            if (currentPerform) {
                // Check group (TABLES,USING or CHANGING)
                currentGroup = line.match(/TABLES|USING|CHANGING/i) || currentGroup;
                if (currentGroup) {
                    currentGroup = currentGroup.toString().toUpperCase();
                    currentPerform[currentGroup] = currentPerform[currentGroup] || [];
                    // Add param to list
                    const currentParam = line.substring(line.lastIndexOf(" ")).replace(/\./g, "");
                    currentPerform[currentGroup].push(currentParam);
                }
            }
            // A dot is the end of the call
            if (line.indexOf(".") === line.length - 1) {
                currentPerform = null;
                currentGroup = null;
            }
        }
        return performs;
    }
    CustomScript.parseFunctionModule = parseFunctionModule;
    function formatABAPCode(codes) {
        let text = "<div style=\"height: 700px;\"><code>";
        for (const code of codes) {
            text += code.LINE.replace(/ /g, "&nbsp;") + "<br>";
        }
        text += "</code></div>";
        return text;
    }
    CustomScript.formatABAPCode = formatABAPCode;
    function rfcReadTableCallback(jsonResult) {
        if (!Data.GetValue("SAPWSEnabled__") && (jsonResult === null || jsonResult === void 0 ? void 0 : jsonResult.GetQueryError) && jsonResult.GetQueryError()) {
            Popup.Alert(jsonResult.GetQueryError(), false, null, "_Select transport request error");
            return;
        }
        else if (jsonResult.ERRORS && jsonResult.ERRORS.length > 0) {
            Popup.Alert(jsonResult.ERRORS[0].err, false, null, "_Select transport request error");
            return;
        }
        const result = CustomScript.parseFunctionModule(jsonResult.TABLES.REPOS_TAB);
        function fillPopup(dialog) {
            const description = dialog.AddDescription("Description__");
            description.SetText("_Requirements dialog explanations");
            const link = dialog.AddLink("LinkToDoc__");
            link.SetText("_Requirements dialog help link");
            link.SetOpenInCurrentWindow(true);
            link.SetURL("#");
            const table = dialog.AddTable("FunctionModuleCalls__");
            table.SetReadOnly(true);
            table.SetRowToolsHidden(true);
            table.HideBottomNavigation(true);
            table.HideTopNavigation(true);
            const groups = ["USING", "TABLES", "CHANGING"];
            table.AddDescriptionColumn("Name__", "_Function name", 200);
            for (const g of groups) {
                table.AddDescriptionColumn(g, "_" + g, 50);
            }
            for (const perform of result) {
                const item = table.AddItem();
                for (const group of groups) {
                    item.SetValue("Name__", perform.name);
                    item.SetValue(group, perform[group] ? perform[group].length : 0);
                }
            }
            const button = dialog.AddButton("ShowFullCode__");
            button.SetText(Language.Translate("_Advanced information"));
        }
        function handlePopup(dialog, tabId, event, control) {
            if (event === "OnClick") {
                if (control.GetName() === "ShowFullCode__") {
                    Popup.Dialog("_Advanced information dialog title", control, function (innerdialog) {
                        const fullCodeCtrl = innerdialog.AddHTML("FullCode__");
                        fullCodeCtrl.SetHTML(formatABAPCode(jsonResult.TABLES.REPOS_TAB));
                    });
                }
                else if (control.GetName() === "LinkToDoc__") {
                    Process.ShowHelp(2530);
                }
            }
        }
        // Display result popup
        Popup.Dialog("_Requirements dialog title", null, fillPopup, null, null, handlePopup);
    }
    CustomScript.rfcReadTableCallback = rfcReadTableCallback;
    const steps = [CustomScript.generalStep, sourcingStep, vendorManagementStep, vendorContractStep, purchasingStep, CustomScript.destinationRecognitionStep, verificationCodingStep, paymentApprovalWorkflowStep, paymentStep, expenseStep, archivingStep, customizationsStep];
    function OnSave() {
        for (const step of steps) {
            if (!step.onQuit()) {
                return false;
            }
        }
        return true;
    }
    /**
     * Removed panes are not removed after upgrading and must be hidden manually in code
     * at the start of the process.
     */
    function HideRemovedPanes() {
        ["Vendor_Portal_Archiving"]
            .forEach(paneName => {
            const paneCtrl = Controls[paneName];
            if (paneCtrl) {
                paneCtrl.Hide(true);
            }
        });
    }
    function HideLegacyFields() {
        function hideIfExists(ctrlName) {
            if (Controls[ctrlName]) {
                Controls[ctrlName].Hide(true);
            }
        }
        const deprecatedFields = [
            "AllowAutomaticPOCurrencyConversion__",
            "Available_modules_pane",
            "BudgetManagementMoreOptions_pane",
            "ComplianceRiskProviderAccountID__",
            "ComplianceRiskProviderEnv__",
            "ComplianceRiskProviderLogin__",
            "ComplianceRiskProviderPassword__",
            "ContractNumberPatterns__",
            "CorporateCurrency__",
            "DisplayContractInProcurement__",
            "EnableAccountPayableGlobalSetting__",
            "EnableAdvancedShippingNotice__",
            "EnableAIForExpenses__",
            "ExpenseAIVersion__",
            "EnableBankStatement__",
            "EnableChatGPTForContractFraudulentClauses__",
            "EnableComplianceRiskProvider__",
            "EnableContractGlobalSetting__",
            "EnableEPaymentRunGlobalSetting__",
            "EnableExpenseClaimsGlobalSetting__",
            "EnableFlipPOGlobalSetting__",
            "EnableInventoryManagement__",
            "EnableLowBudgetNotification__",
            "EnablePriceThreshold__",
            "EnablePunchoutV2__",
            "EnablePurchasingGlobalSetting__",
            "EnableServiceBasedItem__",
            "EnableSupplierInternalScore__",
            "EnableSynergyNeuralNetworkGlobalSetting__",
            "EnableSynergyNeuralNetworkLineItemsGlobalSetting__",
            "EnableThresholdBase__",
            "EnableVendorManagementGlobalSetting__",
            "ForceVendorCurrency__",
            "General_Advanced_ConnectionType_Informations_pane",
            "General_Advanced_SAP_Informations_pane",
            "ocrEngine__",
            "SAPWSConfigurationPane",
            "SendNotificationsToEachGroupMembers__",
            "Spacer2__",
            "Spacer_line__",
            "Spacer_line2__",
            "Spacer_line4__",
            "TitleArrow",
            "VendorManagementCompanyCodeGlobalSetting__",
            "VendorManagementERP_Pane",
            "VendorManagementGlobalOptions_Pane",
            "Wizard_step_desc__",
            "EnableBulkReceipt__",
            "ActivateFRB2B__",
            "PDPConfigurationName__"
        ];
        for (let deprecatedField of deprecatedFields) {
            hideIfExists(deprecatedField);
        }
    }
    function Main() {
        Sys.Helpers.EnableSmartSilentChange();
        if (ProcessInstance.isDebugActive) {
            steps.push(labsStep);
        }
        else {
            labsStep.hideStep();
        }
        HideLegacyFields();
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Wizard.Common.CustomizeStep", customizationsStep);
        Sys.Wizard.Wizard.Init({
            width: 1250,
            steps: steps,
            previousButton: Controls.Previous,
            nextButton: Controls.Next,
            wizardControl: Controls.Wizard_steps__,
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
                    InitializeConfigurationValues(runWizardCb);
                }
                else {
                    runWizardCb();
                }
            }
        });
        // Other layout initializations
        Controls.Save.OnClick = OnSave;
        HideRemovedPanes();
    }
    CustomScript.Main = Main;
    /// ==================================
    /// Entry point !!!
    /// ==================================
    Main();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map