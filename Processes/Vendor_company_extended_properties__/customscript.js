"use strict";
var CustomScript;
(function (CustomScript) {
    function GetAppInstances() {
        const P2PGlobalSettings = ProcessInstance.extendedProperties
            && ProcessInstance.extendedProperties.appInstances
            && ProcessInstance.extendedProperties.appInstances.P2P
            && ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration;
        if (P2PGlobalSettings) {
            return {
                "P2P": true,
                "P2P_AP": P2PGlobalSettings.EnableAccountPayableGlobalSetting__ === "1",
                "P2P_CONTRACT": P2PGlobalSettings.EnableContractGlobalSetting__ === "1",
                "P2P_PAC": P2PGlobalSettings.EnablePurchasingGlobalSetting__ === "1" && P2PGlobalSettings.EnableStandardPurchasingGlobalSetting__ === "1",
                "P2P_EXPENSE": P2PGlobalSettings.EnableExpenseClaimsGlobalSetting__ === "1",
                "P2P_VENDOR": P2PGlobalSettings.EnableVendorManagementGlobalSetting__ === "1",
                "P2P_FLIPPO": P2PGlobalSettings.EnableFlipPOGlobalSetting__ === "1",
                "DD": Boolean(ProcessInstance.extendedProperties.appInstances.DD)
            };
        }
        return {};
    }
    CustomScript.GetAppInstances = GetAppInstances;
    function GetLoginsFilter(logins, loginFieldName) {
        const uniqueLogins = logins.filter((element, index) => {
            return logins.indexOf(element) === index;
        });
        if (uniqueLogins && uniqueLogins.length > 0) {
            if (uniqueLogins.length === 1) {
                return Sys.Helpers.LdapUtil.FilterEqual(loginFieldName, uniqueLogins[0]).toString();
            }
            return Sys.Helpers.LdapUtil.FilterIn(loginFieldName, uniqueLogins).toString();
        }
        return "(1=0)";
    }
    CustomScript.GetLoginsFilter = GetLoginsFilter;
    CustomScript.ActionMenuHelper = {
        BindEvents: function () {
            Controls.ActionMenu__.BindEvent("onActionLoad", function () {
                Controls.ActionMenu__.FireEvent("onActionLoad", {
                    appInstances: CustomScript.GetAppInstances(),
                    tabs: {
                        MoreDetails: Language.Translate("_More_Details"),
                        Edit: Language.Translate("_Edit"),
                        Clone: Language.Translate("_Clone"),
                    }
                });
            });
            Controls.ActionMenu__.BindEvent("MoreDetails", CustomScript.ActionMenuHelper.MoreDetails);
            if (CustomScript.GetAppInstances().P2P_VENDOR) {
                Controls.ActionMenu__.BindEvent("EditAction", CustomScript.ActionMenuHelper.Edit);
                Controls.ActionMenu__.BindEvent("CloneAction", CustomScript.ActionMenuHelper.Clone);
            }
        },
        Init: async function () {
            if (Lib.VendorRegistration.Client.UserCanStartVendorRegistration(User)) {
                if (CustomScript.GetAppInstances().P2P_VENDOR) {
                    // A vendor without company code ("all company codes" record) is a standard case, it can be updated
                    Controls.ActionMenu__.FireEvent("enableButton", { buttonId: "Edit" });
                    if (Data.GetValue("CompanyCode__")) {
                        Controls.ActionMenu__.FireEvent("enableButton", { buttonId: "Clone" });
                    }
                }
            }
        },
        MoreDetails: function () {
            const diversityHasValue = !!Data.GetValue("DiversityClassification__");
            const expectedPanes = {
                VendorInformation: true,
                VendorAddress: true,
                BankDetails: true,
                Vendor_diversity: diversityHasValue,
                Vendor_diversity_spacer: diversityHasValue
            };
            let panes = Controls.form_content_right.GetPanes();
            for (const pane of panes) {
                pane.Hide(!expectedPanes[pane.GetName()]);
            }
            Controls.Alerts.Hide(true);
            Controls.ComplianceRiskIdentifier__.Hide(true);
            Controls.BankDetails__.SetView({
                tabName: "_Tables",
                filter: CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilter(),
                viewName: "_Table 'AP - Bank details'",
                checkProfileTab: false,
                processOrTableName: "AP - Bank details__"
            });
            Controls.BankDetails__.Apply();
            const isCountryUS = (Controls.Country__.GetValue() === "US");
            const displayBankAddressFields = !Controls.AddressForBankIsSameAsCompany__.IsChecked() && isCountryUS;
            const bankAddressControls = [
                Controls.SubForBank__, Controls.StreetForBank__, Controls.ZipCodeForBank__, Controls.CityForBank__,
                Controls.StateForBank__, Controls.CountryForBank__
            ];
            Controls.Spacer_line6__.Hide(!isCountryUS);
            Controls.AddressForBankIsSameAsCompany__.Hide(!isCountryUS);
            bankAddressControls.forEach(control => {
                control.Hide(!displayBankAddressFields);
            });
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany.OnDisplayMoreDetails");
        },
        Edit: function () {
            Controls.ActionMenu__.Wait(true);
            return Lib.VendorRegistration.InternalRequest.CreateInternalUpdateRequest(User.FullDn, User.loginId, Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"))
                .Catch(function (err) {
                let popupMessage = "_ErrorCannotCreateVendorRegistration";
                let popupTitle = "Error";
                if (err.message === "Vendor Registration request already exists") {
                    popupMessage = "_ErrorMessageDuplicateRegistrationUpdateFromTable";
                    popupTitle = "_ErrorTitleDuplicateRegistrationUpdateFromTable";
                }
                else {
                    Log.Error(err.message);
                }
                Popup.Alert([popupMessage], true, null, popupTitle);
            })
                .Finally(() => {
                Controls.ActionMenu__.Wait(false);
            });
        },
        Clone: function () {
            Controls.ActionMenu__.Wait(true);
            let fields = {
                CompanyCode__: Data.GetValue("CompanyCode__"),
                VendorNumber__: Data.GetValue("VendorNumber__"),
            };
            return Lib.VendorRegistration.InternalRequest.CreateInternalCloneRequest({
                creatorOwnerId: User.FullDn,
                creatorOwnerEmail: User.loginId,
                values: fields
            })
                .Catch(function (err) {
                let popupMessage = "_ErrorCannotCreateVendorRegistration";
                let popupTitle = "Error";
                Log.Error(err.message);
                Popup.Alert([popupMessage], true, null, popupTitle);
            })
                .Finally(() => {
                Controls.ActionMenu__.Wait(false);
            });
        }
    };
    const defaultComplianceRiskData = {
        details: {},
        folders: []
    };
    CustomScript.ComplianceRisk = {
        innerData: { ...defaultComplianceRiskData },
        eAttestationsClient: null,
        GetWidgetData() {
            let link = null;
            if (CustomScript.ComplianceRisk.innerData && CustomScript.ComplianceRisk.innerData.details.onboarded) {
                link = CustomScript.ComplianceRisk.eAttestationsClient.GetWebSiteUrl(Controls.ComplianceRiskIdentifier__.GetValue());
            }
            return Lib.VM.ComplianceRisk.GetWidgetData(Controls.ComplianceRiskIdentifier__.GetValue(), CustomScript.ComplianceRisk.innerData, Controls.ShowComplianceAlerts__.IsChecked(), link, false);
        },
        LoadData: function () {
            if (Lib.VM.ComplianceRisk.IsEnabled()) {
                CustomScript.ComplianceRisk.eAttestationsClient = new Sys.VM.E_AttestationsClient({
                    user: Lib.VM.ComplianceRisk.GetComplianceRiskLogin(),
                    pwd: Lib.VM.ComplianceRisk.GetComplianceRiskPassword(),
                    accountId: Lib.VM.ComplianceRisk.GetComplianceRiskAccountID(),
                    env: Lib.VM.ComplianceRisk.GetComplianceRiskEnv()
                });
                const thirdPartyId = Controls.ComplianceRiskIdentifier__.GetValue();
                return Lib.VM.ComplianceRisk.ReadData(thirdPartyId)
                    .Then((data) => {
                    if (data) {
                        CustomScript.ComplianceRisk.innerData = data;
                    }
                    else {
                        CustomScript.ComplianceRisk.innerData = { ...defaultComplianceRiskData };
                    }
                });
            }
            return Sys.Helpers.Promise.Resolve();
        }
    };
    CustomScript.NavMenuHelper = {
        embeddedViewsTab: "_My documents-AP-Embedded",
        Menus: {
            overview: {
                scoringInitialized: false,
                gaugeContainer: Controls.CreditScore_GaugeContainer__,
                complianceContainer: Controls.DisplayedStatusHTML__,
                panes: {
                    PurchaseOrdersMetricsPanel: GetAppInstances().P2P_PAC,
                    InvoicesMetricsPanel: GetAppInstances().P2P_AP,
                    DiscountMetricsPanel: GetAppInstances().P2P_AP,
                    ReportsPanel: GetAppInstances().P2P_AP,
                    ScoringReportsPanel: false,
                    ComplianceRiskPanel: GetAppInstances().P2P_AP,
                    InternalScorePane: false
                },
                init: async function () {
                    const complianceControlsList = {
                        alertsCtrl: Controls.Alerts,
                        ShowAlertsCtrl: Controls.ShowComplianceAlerts__,
                        VendorCompanyCodeCtrl: Controls.VendorInfoCompanyCode__,
                        VendorNumberCtrl: Controls.VendorInfoVendorNumber__
                    };
                    Lib.VM.ComplianceRisk.Init(complianceControlsList);
                    Lib.VM.ScoringProviders.Manager.Init(this.gaugeContainer, CustomScript.AlertHelper.DisplayAlert);
                    CustomScript.NavMenuHelper.Menus.overview.panes.ScoringReportsPanel = Sys.Parameters.GetInstance("AP").GetParameter("EnableSupplierScoring", "0") === "1";
                    Controls.InternalScore__.Hide(true);
                    const initInternalScoreCounter = function () {
                        const internalScore = Data.GetValue("InternalScore__");
                        CustomScript.NavMenuHelper.Menus.overview.panes.InternalScorePane = true;
                        if (internalScore || internalScore === 0) {
                            Lib.VM.InternalScoring.VendorCompanyExtendedProperties.RefreshInternalScoreDisplay(internalScore);
                        }
                        else {
                            Controls.InternalScoreCounter__.SetValue({
                                value: "N/A"
                            });
                        }
                        Controls.InternalScoreCounter__.SetClickable(true);
                        Controls.InternalScoreCounter__.OnClick = Lib.VM.InternalScoring.VendorCompanyExtendedProperties.OpenDetails;
                    };
                    if (CustomScript.GetAppInstances().P2P_VENDOR) {
                        initInternalScoreCounter();
                    }
                    const onClickPOCounter = function () {
                        CustomScript.NavMenuHelper.Menus.overview.displayView("purchaseOrders");
                    };
                    const onClickInvoiceCounter = function () {
                        CustomScript.NavMenuHelper.Menus.overview.displayView("invoices");
                    };
                    const initReports = async function () {
                        const companyCodeAndVendorFilter = CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilter();
                        const promises = [];
                        for (const panel of ["ReportsPanel"]) {
                            const controls = Controls[panel].GetControls();
                            for (const report of controls) {
                                report.Hide(false);
                                report.SetAdditionalFilter(companyCodeAndVendorFilter);
                                report.Refresh();
                            }
                        }
                        if (CustomScript.NavMenuHelper.Menus.overview.panes.ReportsPanel) {
                            promises.push(CustomScript.ReportDataHelper.GetInvoicingHistoryData(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"))
                                .Then((historicalData) => Controls.ReportInvoicingHistory__.SetValue(historicalData)));
                        }
                        if (CustomScript.NavMenuHelper.Menus.overview.panes.ScoringReportsPanel) {
                            promises.push(Lib.AP.Scoring.GetScoringReportData(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"))
                                .Then(function (reportData) {
                                Controls.ReportSupplierScoring__.SetValue(reportData);
                                Controls.ReportSupplierScoring__.Hide(false);
                            }));
                        }
                        await Sys.Helpers.Promise.All(promises);
                    };
                    const initCounters = function () {
                        for (const panel of ["PurchaseOrdersMetricsPanel", "InvoicesMetricsPanel", "DiscountMetricsPanel"]) {
                            const panelVisible = CustomScript.NavMenuHelper.Menus.overview.panes[panel];
                            const controls = Controls[panel].GetControls();
                            for (const counter of controls) {
                                if (panelVisible) {
                                    counter.Hide(false);
                                    const filter = CustomScript.VendorDetailsHelper.controlFilters[counter.GetName()].toString();
                                    counter.SetAdditionalFilter(filter);
                                    counter.Refresh();
                                    counter.OnClick = panel === "PurchaseOrdersMetricsPanel" ? onClickPOCounter : onClickInvoiceCounter;
                                }
                                else {
                                    counter.Hide(true);
                                }
                            }
                        }
                    };
                    await initReports();
                    initCounters();
                },
                displayView: function (tabId) {
                    Controls.NavMenu__.FireEvent("onChangeTab", { tabId: tabId });
                },
                onStart: function () {
                    if (Lib.VM.ComplianceRisk.IsEnabled()) {
                        this.complianceContainer.FireEvent("onDisplayWidgetStatus", CustomScript.ComplianceRisk.GetWidgetData());
                        Controls.ComplianceRiskPanel.Hide(false);
                    }
                    else {
                        Controls.ComplianceRiskPanel.Hide(true);
                    }
                    let promises = [];
                    if (!this.scoringInitialized) {
                        this.scoringInitialized = true;
                        const companyData = {
                            companyName: Controls.VendorInfoName__.GetText(),
                            countryCode: Controls.Country__.GetText().toUpperCase(),
                            identifier: Controls.VendorInfoDUNSNumber__.GetText(),
                            ecovadisIntegrationId: Controls.Ecovadis_Integration_ID__.GetText()
                        };
                        const controlsList = {
                            scoringPanel: Controls.SupplierRiskScoringPanel,
                            alertsCtrl: Controls.Alerts,
                            ShowAlertsCtrl: Controls.ShowAlerts__,
                            VendorDUNSNumberCtrl: Controls.VendorInfoDUNSNumber__,
                            VendorCompanyCodeCtrl: Controls.VendorInfoCompanyCode__,
                            VendorNumberCtrl: Controls.VendorInfoVendorNumber__,
                            EcovadisIntegrationID: Controls.Ecovadis_Integration_ID__
                        };
                        promises = [Lib.VM.ScoringProviders.Manager.OnStart(companyData, controlsList)];
                    }
                    Sys.Helpers.Promise.All(promises).Then(() => {
                        Controls.SupplierRiskScoringPanel.Hide(!Lib.VM.ScoringProviders.Manager.HasProviders());
                        CustomScript.AlertHelper.DisplayAlert();
                    });
                }
            },
            invoices: {
                panes: { InvoicesPane: true },
                init: async function () {
                    Controls.Invoices__.SetView({
                        tabName: CustomScript.NavMenuHelper.embeddedViewsTab,
                        filter: CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilter(),
                        viewName: "_SIM_View_Invoices - embedded",
                        processOrTableName: "Vendor invoice",
                        checkProfileTab: false
                    });
                    Controls.Invoices__.OpenInNewTab(true);
                    Controls.Invoices__.OpenInReadOnlyMode(false);
                },
                onStart: function () {
                    Controls.Alerts.Hide(true);
                    Controls.Invoices__.Apply();
                }
            },
            purchaseOrders: {
                panes: { PurchaseOrdersPane: true },
                init: async function () {
                    Controls.PurchaseOrders__.SetView({
                        tabName: CustomScript.NavMenuHelper.embeddedViewsTab,
                        filter: CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilter(),
                        viewName: "_SIM_View_PurchaseOrders - embedded",
                        processOrTableName: "Purchase order V2",
                        checkProfileTab: false
                    });
                    Controls.PurchaseOrders__.OpenInNewTab(true);
                    Controls.PurchaseOrders__.OpenInReadOnlyMode(false);
                },
                onStart: function () {
                    Controls.Alerts.Hide(true);
                    Controls.PurchaseOrders__.Apply();
                }
            },
            contracts: {
                panes: { ContractsPane: true },
                init: async function () {
                    Controls.Contracts__.SetView({
                        tabName: CustomScript.NavMenuHelper.embeddedViewsTab,
                        filter: CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilter(),
                        viewName: "_SIM_View_Contracts - embedded",
                        processOrTableName: "P2P - Contract",
                        checkProfileTab: false
                    });
                },
                onStart: function () {
                    Controls.Alerts.Hide(true);
                    Controls.Contracts__.Apply();
                }
            },
            vendorRegistrations: {
                panes: { VendorRegistrationsPane: true },
                init: async function () {
                    Controls.VendorRegistrations__.SetView({
                        tabName: CustomScript.NavMenuHelper.embeddedViewsTab,
                        filter: CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilter(),
                        viewName: "_SIM_View_Vendor Registrations - embedded",
                        processOrTableName: "Vendor Registration",
                        checkProfileTab: false
                    });
                    Controls.VendorRegistrations__.OpenInReadOnlyMode(false);
                },
                onStart: function () {
                    Controls.Alerts.Hide(true);
                    Controls.VendorRegistrations__.Apply();
                }
            },
            relatedDoc: {
                panes: { RelatedDocPane: true },
                init: async function () {
                    Controls.RelatedDoc__.SetView({
                        tabName: "_VendorRelatedDocEmbeddedTab",
                        filter: CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilterForSDA(),
                        viewName: "_VendorRelatedDocEmbeddedView",
                        processOrTableName: "DD - SenderForm",
                        checkProfileTab: false
                    });
                },
                onStart: function () {
                    Controls.Alerts.Hide(true);
                    Controls.RelatedDoc__.Apply();
                }
            },
            contacts: {
                panes: { ContactsPane: true },
                init: async function () {
                    const filter = await CustomScript.VendorDetailsHelper.GetContactsFilterForVendorContacts();
                    Controls.ContactsList__.SetView({
                        tabName: "_VendorsContacts",
                        filter: filter,
                        viewName: "_SIM_View_Contacts - embedded",
                        checkProfileTab: false
                    });
                },
                onStart: function () {
                    Controls.Alerts.Hide(true);
                    Controls.ContactsList__.Apply();
                }
            },
            settings: {
                panes: {
                    OrderPreferrencesPane: GetAppInstances().P2P_PAC,
                    FlipPOPane: true,
                    EarlyPaymentPane: true
                },
                init: async function () {
                    try {
                        await CustomScript.NavMenuHelper.InitVendorContactForOrderIdBrowse();
                        await CustomScript.NavMenuHelper.FillVendorContactForOrder();
                        Controls.VendorContactForOrder__.Hide(Controls.POMethod__.GetValue() !== "SendToVendor");
                        Controls.POMethod__.OnChange = function () {
                            Controls.VendorContactForOrder__.Hide(Controls.POMethod__.GetValue() !== "SendToVendor");
                        };
                    }
                    catch (e) {
                    }
                },
                onStart: function () {
                    let vendorCanProposeEarlyPayment = Data.GetValue("VendorCanProposeEarlyPayment__");
                    Controls.Alerts.Hide(true);
                    Controls.VendorCanProposeDiscountRate__.SetReadOnly(!vendorCanProposeEarlyPayment);
                    Controls.VendorCanProposeEarlyPayment__.OnChange = () => {
                        vendorCanProposeEarlyPayment = Data.GetValue("VendorCanProposeEarlyPayment__");
                        Controls.VendorCanProposeDiscountRate__.SetReadOnly(!vendorCanProposeEarlyPayment);
                        if (!vendorCanProposeEarlyPayment) {
                            Data.SetValue("VendorCanProposeDiscountRate__", false);
                        }
                    };
                }
            }
        },
        BindEvents: function () {
            Controls.NavMenu__.BindEvent("onLoad", function () {
                Controls.NavMenu__.FireEvent("onLoad", {
                    appInstances: GetAppInstances(),
                    tabs: {
                        overview: Language.Translate("_NavOverview"),
                        invoices: Language.Translate("_NavInvoices"),
                        purchaseOrders: Language.Translate("_NavOrders"),
                        contracts: Language.Translate("_NavContracts"),
                        vendorRegistrations: Language.Translate("_NavVendorRegistrations"),
                        relatedDoc: Language.Translate("_NavRelatedDoc"),
                        contacts: Language.Translate("_NavContacts"),
                        settings: Language.Translate("_NavSettings")
                    },
                    startMenu: "overview"
                });
            });
            Controls.NavMenu__.BindEvent("onClick", CustomScript.NavMenuHelper.OnClick);
            for (const m in this.Menus) {
                if (typeof this.Menus[m].bindEvents === "function") {
                    this.Menus[m].bindEvents();
                }
            }
        },
        Init: async function () {
            for (const k in CustomScript.NavMenuHelper.Menus) {
                await CustomScript.NavMenuHelper.Menus[k].init();
            }
            CustomScript.NavMenuHelper.OnClick({ args: "overview" });
            Process.SetHelpId(2526);
        },
        OnClick: function (evt) {
            const menu = CustomScript.NavMenuHelper.Menus[evt.args];
            let panes = Controls.form_content_right.GetPanes();
            for (const pane of panes) {
                pane.Hide(!menu.panes[pane.GetName()]);
            }
            menu.onStart();
        },
        FillVendorContactForOrder: function () {
            return Lib.Purchasing.Vendor.QueryVendorContactEmail(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"))
                .Then((email) => {
                Sys.Helpers.SilentChange(() => {
                    var _a;
                    const contactLogin = Variable.GetValueAsString("ContactLogin");
                    if (email) {
                        Controls.VendorContactForOrder__.SetValue(email);
                        Controls.VendorContactForOrderId__.SetText((_a = contactLogin === null || contactLogin === void 0 ? void 0 : contactLogin.substring(contactLogin.indexOf("$") + 1)) !== null && _a !== void 0 ? _a : "");
                    }
                    else {
                        Controls.VendorContactForOrder__.SetValue(Language.Translate("_No email found for this vendor"));
                        Controls.VendorContactForOrderId__.SetText("");
                    }
                });
            });
        },
        InitVendorContactForOrderIdBrowse: async () => {
            Sys.Helpers.SilentChange(() => {
                //Setting up the browse for the hidden VendorContactForOrderId__ control where the login is retrieved
                Controls.VendorContactForOrderId__.SetTitle("_VendorContactForOrder");
                Controls.VendorContactForOrderId__.SetReadOnly(true);
                Controls.VendorContactForOrderId__.SetDataSource("ODUSER");
                Controls.VendorContactForOrderId__.SetAttributes("EmailAddress|Login");
                Controls.VendorContactForOrderId__.SetDisplayedColumns("EmailAddress|DisplayName|Description|Country|City|LastConnectionDateTime");
                Controls.VendorContactForOrderId__.SetSavedColumn("EmailAddress");
                const vendorNumber = Data.GetValue("VendorNumber__");
                const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VENDOR", "1"), Sys.Helpers.LdapUtil.FilterEqual("DESCRIPTION", vendorNumber)).toString();
                Controls.VendorContactForOrderId__.SetFilter(filter);
                Controls.VendorContactForOrderId__.SetSearchMode("contains");
                Controls.VendorContactForOrderId__.SetAllowTableValuesOnly(false);
                Controls.VendorContactForOrderId__.OnSelectItem = CustomScript.NavMenuHelper.OnSelectVendorContact;
                //Adding browse to displayed VendorContactForOrder__ control where the email is retrieved
                Controls.VendorContactForOrder__.SetBrowsable(!ProcessInstance.isReadOnly);
                Controls.VendorContactForOrder__.OnBrowse = function () {
                    Controls.VendorContactForOrderId__.DoBrowse();
                };
            });
        },
        OnSelectVendorContact: function (item) {
            const login = item.GetValue("Login");
            const loginWithoutPortalPrefix = login.substring(login.indexOf("$") + 1);
            if (Controls.VendorContactForOrderId__.GetText() !== loginWithoutPortalPrefix || Controls.VendorContactForOrder__.GetValue() !== item.GetValue("EmailAddress")) {
                ProcessInstance.SetDataChanged(true);
                Controls.VendorContactForOrderId__.SetText(loginWithoutPortalPrefix);
                Controls.VendorContactForOrder__.SetValue(item.GetValue("EmailAddress"));
            }
        }
    };
    CustomScript.ReportDataHelper = {
        GetXValues: function (endDate) {
            const dates = [];
            for (let month = 0; month < 12; month++) {
                const d = new Date(endDate);
                d.setDate(1);
                d.setMonth(endDate.getMonth() - month);
                dates.push(Sys.Helpers.Date.Format(d, "yyyy-mm"));
            }
            return dates;
        },
        CurrencyFormat: function (yValue) {
            if (!yValue) {
                return "";
            }
            const currency = CustomScript.VendorDetailsHelper.CompanyCurrency;
            const options = {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            };
            if (currency) {
                options.style = "currency";
                options.currency = currency.toUpperCase();
            }
            const formatter = new Intl.NumberFormat(User.culture, options);
            const formattedCurrency = formatter.format(123); //123 is only used to be replaced later
            const shortenedFormat = Language.FormatNumber(yValue, {
                shorten: true,
                shortenedFormat: Language.NumberShortenedFormats.auto
            });
            return formattedCurrency.replace("123", shortenedFormat);
        },
        GetInvoicingHistoryData: async function (companyCode, vendorNumber) {
            const values = { pendingPayment: {}, paid: {}, overdue: {} };
            const dates = CustomScript.ReportDataHelper.GetXValues(new Date());
            const populateValuesAndDatesWithResults = function (queryResults, valueTypeToFill) {
                for (const result of queryResults) {
                    if (!valueTypeToFill[result.InvoiceDateMonth__]) {
                        valueTypeToFill[result.InvoiceDateMonth__] = 0;
                    }
                    valueTypeToFill[result.InvoiceDateMonth__] += parseFloat(result["__SUM__:LocalInvoiceAmount__"]);
                }
            };
            const buildInvoicingHistoryDataPromisedQuery = function (filter) {
                const options = {
                    table: "CDNAME#Vendor invoice",
                    filter: filter,
                    attributes: ["__SUM__:LocalInvoiceAmount__", "SUBSTRING(CHR(InvoiceDate__),1,7) 'InvoiceDateMonth__'"],
                    maxRecords: 100,
                    additionalOptions: {
                        asAdmin: true,
                        queryOptions: "FastSearch=1"
                    }
                };
                return Sys.GenericAPI.PromisedQuery(options);
            };
            // Build promise for each query
            const promisedQueries = [];
            const now = new Date();
            const d12MonthsAgo = Sys.Helpers.Date.Date2DBDate(new Date(now.getFullYear() - 1, now.getMonth(), 0));
            const nowDBDate = Sys.Helpers.Date.Date2DBDate(now);
            // not paid,rejected,reversed,expired and DueDate not <= next 5 days
            const filterInvoicePendingPayment = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterGreaterOrEqual("InvoiceDate__", d12MonthsAgo), Sys.Helpers.LdapUtil.FilterNotIn("InvoiceStatus__", ["Paid", "Reversed", "Rejected", "Expired"]), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterNot(Sys.Helpers.LdapUtil.FilterLesserOrEqual("DueDate__", nowDBDate)), Sys.Helpers.LdapUtil.FilterNotExist("DueDate__")));
            // paid
            const filterInvoicePaid = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterGreaterOrEqual("InvoiceDate__", d12MonthsAgo), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", "Paid"));
            // not paid,rejected,reversed,expired and DueDate <= next 5 days
            const filterInvoicePaymentOverdue = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterGreaterOrEqual("InvoiceDate__", d12MonthsAgo), Sys.Helpers.LdapUtil.FilterNotIn("InvoiceStatus__", ["Paid", "Reversed", "Rejected", "Expired"]), Sys.Helpers.LdapUtil.FilterLesserOrEqual("DueDate__", nowDBDate));
            const promisePending = buildInvoicingHistoryDataPromisedQuery(filterInvoicePendingPayment.toString())
                .Then((queryResults) => populateValuesAndDatesWithResults(queryResults, values.pendingPayment));
            const promisePaid = buildInvoicingHistoryDataPromisedQuery(filterInvoicePaid.toString())
                .Then((queryResults) => populateValuesAndDatesWithResults(queryResults, values.paid));
            const promiseOverdue = buildInvoicingHistoryDataPromisedQuery(filterInvoicePaymentOverdue.toString())
                .Then((queryResults) => populateValuesAndDatesWithResults(queryResults, values.overdue));
            promisedQueries.push(promisePending);
            promisedQueries.push(promisePaid);
            promisedQueries.push(promiseOverdue);
            try {
                await Sys.Helpers.Promise.All(promisedQueries);
            }
            catch (e) {
            }
            const abscissa = dates.sort();
            return {
                type: Controls.ReportInvoicingHistory__.Types.VBarStacked,
                xAxis: { values: abscissa },
                yAxis: { min: 0 },
                legend: {
                    enabled: true,
                    reversed: true
                },
                series: [
                    {
                        name: Language.Translate("_Paid"),
                        type: Controls.ReportInvoicingHistory__.Types.VBarStacked,
                        color: "rgba(0, 152, 170, 0.4)",
                        dataLabelsColor: "rgba(0, 152, 170, 1)",
                        dataLabelsFormatter: CustomScript.ReportDataHelper.CurrencyFormat,
                        values: values.paid
                    },
                    {
                        name: Language.Translate("_Pending"),
                        type: Controls.ReportInvoicingHistory__.Types.VBarStacked,
                        color: "rgba(241, 174, 0, 0.4)",
                        dataLabelsColor: "rgba(241, 174, 0, 1)",
                        dataLabelsFormatter: CustomScript.ReportDataHelper.CurrencyFormat,
                        values: values.pendingPayment
                    },
                    {
                        name: Language.Translate("_Overdue"),
                        type: Controls.ReportInvoicingHistory__.Types.VBarStacked,
                        color: "rgba(216, 38, 46, 0.4)",
                        dataLabelsColor: "rgba(216, 38, 46, 1)",
                        dataLabelsFormatter: CustomScript.ReportDataHelper.CurrencyFormat,
                        values: values.overdue
                    }
                ]
            };
        }
    };
    CustomScript.VendorDetailsHelper = {
        loginsCache: null,
        businessPartnerIDCache: null,
        controlFilters: {
            OrdersToReceiveCounter__: null,
            OrdersToInvoiceCounter__: null,
            TotalOrdersCounter__: null,
            InvoicesOverdueCounter__: null,
            InvoicesPendingCounter__: null,
            InvoicesOnHoldCounter__: null,
            InvoicesTotalCounter__: null,
            InvoicesDiscountCounter__: null
        },
        CompanyCurrency: null,
        Init: async function () {
            var _a;
            ProcessInstance.SetSilentChange(true);
            const vendorNumber = Process.GetURLParameter("vendornumber") || Process.GetURLParameter("number");
            let companyCodeParameter = Process.GetURLParameter("companycode");
            if (typeof companyCodeParameter == "boolean" && companyCodeParameter === true) {
                // GetURLParameter can return the value true when the parameter have no value set
                companyCodeParameter = "";
            }
            CustomScript.VendorDetailsHelper.setFieldIfNotEmpty("CompanyCode__", companyCodeParameter);
            CustomScript.VendorDetailsHelper.setFieldIfNotEmpty("VendorNumber__", vendorNumber);
            //Hide deleted fields
            const deprecatedFields = [
                "YearsInBusiness__",
                "Spacer_line__",
                "Spacer_line6__",
                "Spacer_line7__",
                "Spacer_line9__",
                "Spacer_line10__",
                "Spacer_line11__",
                "Spacer_line12__",
                "Spacer_line13__",
                "Spacer_line14__",
                "Spacer_line15__",
                "Spacer_line17__",
                "Spacer_line18__",
                "Spacer_line19__"
            ];
            deprecatedFields.forEach((field) => {
                if (Controls[field]) {
                    Controls[field].Hide();
                }
            });
            const vendorCategory = Data.GetValue("VendorCategory__");
            if (!vendorCategory) {
                Controls.VendorDetailsCategory__.Hide(true);
            }
            Controls.VendorDetailsCategory__.SetText(vendorCategory);
            const itemCategoryID = Data.GetValue("DefaultItemCategoryID__");
            if (!itemCategoryID) {
                Controls.DefaultItemCategory__.Hide(true);
            }
            else {
                Lib.VendorRegistration.Client.FillDefaultItemCategory(itemCategoryID, Data.GetValue("CompanyCode__"));
            }
            if (Process.GetURLParameter("quitOnClose") === "1") {
                // We were open in a new tab, close it
                Controls.Close.OnClick = function () {
                    Process.CloseTab();
                };
            }
            if (!Data.GetValue("CompanyCode__")) {
                Controls.VendorDetailsCompanyCode__.SetText("_AllCompanyCodes");
                Controls.VendorDetailsCompanyCode__.AddStyle("text-grayed");
            }
            else {
                Controls.VendorDetailsCompanyCode__.RemoveStyle("text-grayed");
                Controls.VendorDetailsCompanyCode__.SetText(Data.GetValue("CompanyCode__"));
            }
            Controls.VendorDetailsVendorNumber__.SetText(Data.GetValue("VendorNumber__"));
            Controls.VendorInfoCompanyCode__.SetText(Data.GetValue("CompanyCode__"));
            Controls.VendorInfoVendorNumber__.SetText(Data.GetValue("VendorNumber__"));
            if (await Lib.P2P.UNSPSC.IsEnabledByQuery(Controls.CompanyCode__.GetValue())) {
                Controls.VendorUNSPSCTitle__.Hide(false);
                Controls.UNSPSCTable__.Hide(false);
                Controls.VendorUNSPSCTitle__.RemoveStyle('text-normal text-size-S text-color-default text-backgroundcolor-default');
                Controls.VendorUNSPSCTitle__.AddStyle('panel-title-extra-M');
                await CustomScript.VendorDetailsHelper.GetUNSPSCData();
                Controls.EmptyUNSPSCList__.Hide(Controls.UNSPSCTable__.GetItemCount() > 0);
                if (!((_a = Controls.UNSPSCTable__.BulkActions) === null || _a === void 0 ? void 0 : _a.IsVisible())) {
                    Controls.EmptyUNSPSCList__.SetText("_EmptyUNSPSCListNoBulkActions");
                }
            }
            ProcessInstance.SetSilentChange(false);
            CustomScript.VendorDetailsHelper.controlFilters.OrdersToReceiveCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"));
            CustomScript.VendorDetailsHelper.controlFilters.OrdersToInvoiceCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("NoMoreInvoiceExpected__", "0"), Sys.Helpers.LdapUtil.FilterNot(Sys.Helpers.LdapUtil.FilterEqual("NoMoreInvoiceExpected__", "*"))));
            CustomScript.VendorDetailsHelper.controlFilters.TotalOrdersCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"));
            CustomScript.VendorDetailsHelper.controlFilters.InvoicesOverdueCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"));
            CustomScript.VendorDetailsHelper.controlFilters.InvoicesPendingCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.Received), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.ToVerify), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.SetAside), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.ToApprove), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.OnHold), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.ToPost), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.ToPay), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.InPaymentProposal), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.BeingPaid), Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.BeingPaidByProvider)));
            CustomScript.VendorDetailsHelper.controlFilters.InvoicesOnHoldCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"));
            CustomScript.VendorDetailsHelper.controlFilters.InvoicesTotalCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"));
            CustomScript.VendorDetailsHelper.controlFilters.InvoicesDiscountCounter__ = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"));
            await CustomScript.VendorDetailsHelper.FillVendorInformations();
            await CustomScript.VendorDetailsHelper.GetCompanyCodeData();
            let showFirstLastName = !Data.IsNullOrEmpty("FirstName__") || !Data.IsNullOrEmpty("LastName__");
            Controls.FirstName__.Hide(!showFirstLastName);
            Controls.LastName__.Hide(!showFirstLastName);
            Controls.VendorInfoName__.Hide(showFirstLastName);
            if (Controls.Country__.GetValue() === "US") {
                Controls.VendorInfoVATNumber__.Hide(true);
                Controls.TaxIdentificationNumber__.SetLabel(showFirstLastName ? "_Social security number" : "_TaxID_EIN");
            }
            else {
                Controls.TaxIdentificationNumber__.Hide(true);
                if (!Sys.Helpers.VAT.IsVATCountry(Controls.Country__.GetValue())) {
                    Controls.VendorInfoVATNumber__.SetLabel(Language.Translate("_NonVATNumber"));
                }
            }
            //Hide lifecycle fields by default as they are not relevant for most of the vendors and they are only used for specific scenarios like vendor registration
            Controls.LifeCycleStatusCode__.Hide(true);
            Controls.LifeCycleComment__.Hide(true);
            await CustomScript.ComplianceRisk.LoadData();
        },
        UpdateFields: function (fields, value) {
            for (const field of fields) {
                if (Controls[field]) {
                    const c = Controls[field];
                    if (field.startsWith("ShowAlerts") || field.startsWith("ShowComplianceAlerts")) {
                        c.Check(Boolean(Number(value)));
                    }
                    else if (value) {
                        c.SetText(value);
                        if (field !== "VendorCategory__") {
                            c.Hide(false);
                        }
                    }
                    else if (field.startsWith("VendorDetails") || field.includes("VendorCategory")) {
                        c.Hide(true);
                    }
                }
            }
        },
        FillVendorInformations: function () {
            let mapping = {
                Name__: ["VendorDetailsName__", "VendorInfoName__"],
                Email__: ["VendorDetailsEmail__", "VendorInfoEmail__"],
                PhoneNumber__: ["VendorDetailsPhoneNumber__", "VendorInfoPhoneNumber__"],
                VATNumber__: ["VendorInfoVATNumber__"],
                DUNSNumber__: ["VendorInfoDUNSNumber__"],
                FaxNumber__: ["VendorInfoFaxNumber__"],
                PreferredInvoiceType__: ["VendorInfoPreferredInvoiceType__"],
                PaymentTermCode__: ["VendorInfoPaymentTermCode__"],
                Currency__: ["VendorInfoCurrency__"],
                Street__: ["Street__"],
                PostOfficeBox__: ["PostOfficeBox__"],
                City__: ["City__"],
                PostalCode__: ["PostalCode__"],
                Region__: ["Region__"],
                Sub__: ["Sub__"],
                Country__: ["Country__"],
                ShowAlerts__: ["ShowAlerts__"],
                DiversityClassification__: ["DiversityClassification__"],
                DiversityCertificationID__: ["DiversityCertificationID__"],
                DiversityCertificationIssuedDate__: ["DiversityCertificationIssuedDate__"],
                DiversityCertificationExpirationDate__: ["DiversityCertificationExpirationDate__"],
                ComplianceRiskIdentifier__: ["ComplianceRiskIdentifier__"],
                ShowComplianceAlerts__: ["ShowComplianceAlerts__"],
                LifeCycleStatusCode__: ["LifeCycleStatusCode__"],
                LifeCycleComment__: ["LifeCycleComment__"],
                VendorCategory__: ["VendorCategory__", "VendorDetailsCategory__"]
            };
            mapping = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.HTMLScripts.SetCustomMappingForVendorInformations", mapping) || mapping;
            return Sys.Helpers.Promise.Create(function (resolve) {
                Query.DBQuery(
                /** @this QueryResult */
                function () {
                    Sys.Helpers.SilentChange(() => {
                        for (const prop of Object.keys(mapping)) {
                            CustomScript.VendorDetailsHelper.UpdateFields(mapping[prop], this.GetQueryValue(prop));
                        }
                        Lib.P2P.Address.SetFormattedAddressControl(Controls.VendorAddress__);
                        Lib.P2P.Address.ComputeFormattedAddressWithOptions({
                            "isVariablesAddress": true,
                            "address": {
                                "ToName": "ToRemove",
                                "ToSub": Controls.Sub__.GetText(),
                                "ToMail": Controls.Street__.GetText(),
                                "ToPostal": Controls.PostalCode__.GetText(),
                                "ToCountry": Controls.Country__.GetText(),
                                "ToCountryCode": Controls.Country__.GetText(),
                                "ToState": Controls.Region__.GetText(),
                                "ToCity": Controls.City__.GetText(),
                                "ToPOBox": Controls.PostOfficeBox__.GetText(),
                                "ForceCountry": true
                            },
                            "countryCode": Controls.Country__.GetText()
                        });
                    });
                    resolve();
                }, "AP - Vendors__", Object.keys(mapping).join("|"), CustomScript.VendorDetailsHelper.GetCompanyCodeAndVendorFilter().replace("VendorNumber__", "Number__"), null, 1, null, "FastSearch=1");
            });
        },
        GetCompanyCodeData: function () {
            return Sys.Helpers.Promise.Create(function (resolve) {
                Query.DBQuery(
                /** @this QueryResult */
                function () {
                    CustomScript.VendorDetailsHelper.CompanyCurrency = this.GetQueryValue("Currency__");
                    resolve();
                }, "PurchasingCompanycodes__", "Currency__", `CompanyCode__=${Data.GetValue("CompanyCode__")}`, null, 1, null, "FastSearch=1");
            });
        },
        setFieldIfNotEmpty: function (fieldName, value) {
            if (value) {
                Data.SetValue(fieldName, value);
            }
        },
        GetCompanyCodeAndVendorFilter: function () {
            let companyCodeAndVendorFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")));
            companyCodeAndVendorFilter = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorEntity.HTMLScripts.VendorDetails.GetCustomCompanyCodeAndVendorFilter", companyCodeAndVendorFilter) || companyCodeAndVendorFilter;
            return companyCodeAndVendorFilter.toString();
        },
        GetCompanyCodeAndVendorFilterForSDA: function () {
            let companyCodeAndVendorFilterForSDA = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqualOrExist("CF_1711725718e_Company_code__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CF_17117258411_Vendor_number__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"));
            companyCodeAndVendorFilterForSDA = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorEntity.HTMLScripts.VendorDetails.GetCustomCompanyCodeAndVendorFilterForSDA", companyCodeAndVendorFilterForSDA) || companyCodeAndVendorFilterForSDA;
            return companyCodeAndVendorFilterForSDA.toString();
        },
        GetVendorLogins: function () {
            return Sys.Helpers.Promise.Create(function (resolve) {
                if (!CustomScript.VendorDetailsHelper.loginsCache) {
                    // Get logins from VendorsLinks
                    const vendorLinksFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")));
                    Query.DBQuery(
                    /* @this QueryResult */
                    function () {
                        const queryResults = this;
                        const nbResults = queryResults.GetRecordsCount();
                        CustomScript.VendorDetailsHelper.loginsCache = [];
                        CustomScript.VendorDetailsHelper.businessPartnerIDCache = [];
                        if (nbResults === 0) {
                            Log.Warn("Vendor company is not associated to any contacts in Vendors links__ table");
                        }
                        else {
                            for (let i = 0; i < nbResults; i++) {
                                const shortLogin = queryResults.GetQueryValue("ShortLogin__", i);
                                const PACShortLogin = queryResults.GetQueryValue("ShortLoginPAC__", i);
                                if (shortLogin) {
                                    CustomScript.VendorDetailsHelper.loginsCache.push(`${User.accountId}$${shortLogin}`);
                                }
                                if (PACShortLogin) {
                                    CustomScript.VendorDetailsHelper.loginsCache.push(`${User.accountId}$${PACShortLogin}`);
                                }
                            }
                        }
                        if (CustomScript.VendorDetailsHelper.loginsCache.length > 0) {
                            const vendorFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Vendor", "1"), Sys.Helpers.LdapUtil.FilterIn("Login", CustomScript.VendorDetailsHelper.loginsCache));
                            Query.DBQuery(
                            /* @this QueryResult */
                            function () {
                                const vendorQueryResults = this;
                                const nbVendorResults = vendorQueryResults.GetRecordsCount();
                                for (let i = 0; i < nbVendorResults; i++) {
                                    const vendorBusinessID = vendorQueryResults.GetQueryValue("BusinessPartnerID", i);
                                    if (vendorBusinessID) {
                                        CustomScript.VendorDetailsHelper.businessPartnerIDCache.push(vendorBusinessID);
                                    }
                                }
                                resolve(CustomScript.VendorDetailsHelper);
                            }, "ODUSER", "BusinessPartnerID", vendorFilter.toString(), null, "full_result");
                        }
                        else {
                            resolve(CustomScript.VendorDetailsHelper);
                        }
                    }, "AP - Vendors links__", "ShortLogin__|ShortLoginPAC__", vendorLinksFilter.toString(), null, 100);
                }
                else {
                    resolve(CustomScript.VendorDetailsHelper);
                }
            });
        },
        GetContactsFilterForVendorExtendedProperties: function () {
            return Sys.Helpers.Promise.Create(function (resolve) {
                CustomScript.VendorDetailsHelper.GetVendorLogins()
                    .Then((vendorDetails) => {
                    const notFound = "(1=0)";
                    const businessPartnerIDFilter = GetLoginsFilter(vendorDetails.businessPartnerIDCache, "BusinessPartnerID");
                    if (businessPartnerIDFilter !== notFound) {
                        Query.DBQuery(
                        /* @this QueryResult */
                        function () {
                            const vendorQueryResults = this;
                            const nbVendorResults = vendorQueryResults.GetRecordsCount();
                            const loginsFromBusinessID = [...vendorDetails.loginsCache];
                            for (let i = 0; i < nbVendorResults; i++) {
                                const vendorBusinessID = vendorQueryResults.GetQueryValue("Login", i);
                                if (vendorBusinessID) {
                                    loginsFromBusinessID.push(vendorBusinessID);
                                }
                            }
                            const loginsFromBusinessIDFilter = GetLoginsFilter(loginsFromBusinessID, "Login__");
                            resolve(loginsFromBusinessIDFilter);
                        }, "ODUSER", "Login", businessPartnerIDFilter, null, "full_result");
                    }
                    else {
                        const loginsFilter = GetLoginsFilter(vendorDetails.loginsCache, "Login__");
                        resolve(loginsFilter);
                    }
                });
            });
        },
        GetContactsFilterForVendorContacts: function () {
            return Sys.Helpers.Promise.Create(function (resolve) {
                CustomScript.VendorDetailsHelper.GetVendorLogins()
                    .Then((vendorDetails) => {
                    const notFound = "(1=0)";
                    const loginsFilter = GetLoginsFilter(vendorDetails.loginsCache, "Login");
                    const businessPartnerIDFilter = GetLoginsFilter(vendorDetails.businessPartnerIDCache, "BusinessPartnerID");
                    if (loginsFilter === notFound) {
                        resolve(businessPartnerIDFilter);
                    }
                    else if (businessPartnerIDFilter === notFound) {
                        resolve(loginsFilter);
                    }
                    resolve(`(|${loginsFilter} ${businessPartnerIDFilter})`);
                });
            });
        },
        SetBusinessPartnerID: function () {
            if (!Data.GetValue("BusinessPartnerID__") && CustomScript.VendorDetailsHelper.businessPartnerIDCache.length > 0) {
                Sys.Helpers.SilentChange(() => {
                    Data.SetValue("BusinessPartnerID__", CustomScript.VendorDetailsHelper.businessPartnerIDCache[0]);
                });
            }
        },
        GetUNSPSCData: async function () {
            await Lib.P2P.UNSPSC.CheckUNSPSCExistsInUserLanguage();
            let UNSPSCList = await Lib.P2P.UNSPSC.Vendor.QueryUNSPSCFromVendor(Data.GetValue("VendorNumber__"), Data.GetValue("CompanyCode__"));
            let UNSPSCParentList = await Lib.P2P.UNSPSC.QueryParents(UNSPSCList.map(UNSPSC => UNSPSC.number));
            const table = Sys.Helpers.Globals.Controls["UNSPSCTable__"];
            table.SetItemCount(0);
            Sys.Helpers.Array.ForEach(UNSPSCList, (UNSPSC, index) => {
                const tableItem = table.AddItem();
                tableItem.SetValue("UNSPSC__", UNSPSC.number);
                tableItem.SetValue("Title__", UNSPSC.title);
                tableItem.SetValue("Description__", UNSPSC.description);
                if (!UNSPSC.title) {
                    tableItem.SetWarning("UNSPSC__", Language.Translate("_UNSPSC code not valid"));
                }
                else {
                    const parentCodes = Lib.P2P.UNSPSC.GetUNSPSCParentCodes(UNSPSC.number, 2).reverse();
                    let hoverMsg = Language.Translate("_ParentCategories") + "\n";
                    parentCodes.forEach((parentCode, i) => {
                        if (UNSPSCParentList[parentCode] !== undefined) {
                            const indent = i > 0 ? "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0" : "";
                            hoverMsg += indent + parentCode + " - " + UNSPSCParentList[parentCode] + "\n";
                        }
                    });
                    table.GetRow(index).UNSPSC__.SetHoverMessage(hoverMsg);
                }
            });
        }
    };
    CustomScript.AlertHelper = {
        DisplayAlert: function () {
            let isScoringAlert = Lib.VM.ScoringProviders.Manager.HasProviders() && Controls.ShowAlerts__.IsChecked();
            let isComplianceAlert = Lib.VM.ComplianceRisk.IsEnabled() && Controls.ShowComplianceAlerts__.IsChecked();
            const lifeCycleStatusCode = Controls.LifeCycleStatusCode__.GetValue();
            const isLifeCycleStatusAlert = lifeCycleStatusCode === Lib.P2P.VendorLifeCycleStatus.BLOCKED || lifeCycleStatusCode === Lib.P2P.VendorLifeCycleStatus.DISABLED;
            // Show appropriate message in the warning message control based on the type of alert,
            // as scoring and compliance alert can be shown at the same time, we have a specific message for this case
            if (isScoringAlert && isComplianceAlert) {
                Controls.TopMessageWarning__.SetLabel(Language.Translate("_UpdatesAlertDescription"));
            }
            else if (isScoringAlert) {
                Controls.TopMessageWarning__.SetLabel(Language.Translate("_RatingAgenciesUpdatesAlertDescription"));
            }
            else if (isComplianceAlert) {
                Controls.TopMessageWarning__.SetLabel(Language.Translate("_ComplianceUpdatesAlertDescription"));
            }
            else {
                Controls.TopMessageWarning__.SetLabel("");
            }
            // Show or hide dismiss button in case of scoring or compliance alert, as they are the only alerts that can be dismissed
            const canDismissAlerts = isScoringAlert || isComplianceAlert;
            Controls.DismissAlerts__.Hide(!canDismissAlerts);
            // Life cycle status alert has its own logic and is not related to the scoring and compliance alerts,
            // so it will be shown even if the user decide to dismiss the scoring and compliance alerts
            if (lifeCycleStatusCode === Lib.P2P.VendorLifeCycleStatus.BLOCKED) {
                Controls.AlertsMessageLifeCycleStatus__.SetLabel(Language.Translate("_LifeCycleAlertMessageBlocked"));
            }
            else if (lifeCycleStatusCode === Lib.P2P.VendorLifeCycleStatus.DISABLED) {
                Controls.AlertsMessageLifeCycleStatus__.SetLabel(Language.Translate("_LifeCycleAlertMessageDisabled"));
            }
            else {
                Controls.AlertsMessageLifeCycleStatus__.SetLabel("");
            }
            // Show spacer when both alert types are present
            const showSpacer = (isScoringAlert || isComplianceAlert) && isLifeCycleStatusAlert;
            Controls.SpacerAlerts__.Hide(!showSpacer);
            // Show alerts panel if any alert is active
            const hasAnyAlert = isScoringAlert || isComplianceAlert || isLifeCycleStatusAlert;
            Controls.Alerts.Hide(!hasAnyAlert);
        },
        DismissAlert: function () {
            if (Lib.VM.ScoringProviders.Manager.HasProviders()) {
                Lib.VM.ScoringProviders.ResetAlerts();
            }
            if (Lib.VM.ComplianceRisk.IsEnabled()) {
                Lib.VM.ComplianceRisk.ResetAlerts(Controls.ComplianceRiskIdentifier__.GetValue());
            }
            CustomScript.AlertHelper.DisplayAlert();
        }
    };
    Controls.DismissAlerts__.OnClick = function () {
        CustomScript.AlertHelper.DismissAlert();
    };
    Controls.CustomSave.OnClick = async () => {
        Controls.CompanyCode__.Wait(true);
        CustomScript.VendorDetailsHelper.SetBusinessPartnerID();
        if (Controls.POMethod__.GetValue() === "SendToVendor" && !Sys.Helpers.IsEmpty(Controls.VendorContactForOrderId__.GetText())) {
            const contactLogin = Variable.GetValueAsString("ContactLogin");
            const contactLoginWithoutPortal = contactLogin === null || contactLogin === void 0 ? void 0 : contactLogin.substring(contactLogin.indexOf("$") + 1);
            if (contactLoginWithoutPortal !== Controls.VendorContactForOrderId__.GetText() || Sys.Helpers.Data.IsTrue(Variable.GetValueAsString("EmptyShortLoginPAC__"))) {
                await CustomScript.CreateOrUpdateVendorLink();
                Variable.SetValueAsString("ContactLogin", "");
                Variable.SetValueAsString("EmptyShortLoginPAC__", "");
            }
        }
        ProcessInstance.Save("Save");
        Controls.CompanyCode__.Wait(false);
        return false;
    };
    async function CreateOrUpdateVendorLink() {
        Log.Info("Save button clicked");
        const vendorLinkRecord = new Lib.P2P.VendorLink.RecordManager.Client();
        await vendorLinkRecord.CreateOrUpdate({
            CompanyCode__: Data.GetValue("CompanyCode__"),
            VendorNumber__: Data.GetValue("VendorNumber__"),
            ShortLoginPAC__: Controls.VendorContactForOrderId__.GetText()
        });
    }
    CustomScript.CreateOrUpdateVendorLink = CreateOrUpdateVendorLink;
    function run() {
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany.OnHTMLScriptBegin");
        Controls.CompanyCode__.Wait(true);
        Controls.Save.Hide(true);
        Sys.Helpers.EnableSmartSilentChange();
        // BindEvents must be synchronous
        // The framework is executing HTML controls script just after customscript execution
        CustomScript.NavMenuHelper.BindEvents();
        CustomScript.ActionMenuHelper.BindEvents();
        // Init can be asynchronous
        return Sys.Parameters.GetInstance("AP").PromisedIsReady()
            .Then(Lib.VM.ComplianceRisk.LoadConfiguration)
            .Then(Lib.VM.FON.LoadConfiguration)
            .Then(CustomScript.VendorDetailsHelper.Init)
            .Then(CustomScript.NavMenuHelper.Init)
            .Then(CustomScript.ActionMenuHelper.Init)
            .Then(() => {
            Controls.CompanyCode__.Wait(false);
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorEntity.HTMLScripts.FromCompany.OnHTMLScriptEndAsync");
        });
    }
    CustomScript.run = run;
})(CustomScript || (CustomScript = {}));
CustomScript.run();
//# sourceMappingURL=customscript.js.map