"use strict";
function GetAppInstances() {
    const P2PGlobalSettings = ProcessInstance.extendedProperties
        && ProcessInstance.extendedProperties.appInstances
        && ProcessInstance.extendedProperties.appInstances.P2P
        && ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration;
    if (P2PGlobalSettings) {
        return {
            "P2P": true,
            "P2P_AP": P2PGlobalSettings.EnableAccountPayableGlobalSetting__ === "1",
            "P2P_PAC": P2PGlobalSettings.EnablePurchasingGlobalSetting__ === "1" && P2PGlobalSettings.EnableStandardPurchasingGlobalSetting__ === "1",
            "P2P_CONTRACT": P2PGlobalSettings.EnableContractGlobalSetting__ === "1",
            "P2P_EXPENSE": P2PGlobalSettings.EnableExpenseClaimsGlobalSetting__ === "1",
            "P2P_FLIPPO": P2PGlobalSettings.EnableFlipPOGlobalSetting__ === "1"
        };
    }
    return {};
}
const VendorDetailsHelper = {
    vendorsMasterData: null,
    vendorsCompanyRUIDexById: {},
    Init: function () {
        return Sys.Helpers.Promise.Create(function (resolve) {
            let vendorId = Controls.Login__.GetValue();
            if (vendorId) {
                const vendorIdParts = vendorId.split("$");
                if (vendorIdParts.length === 2) {
                    vendorId = vendorIdParts[1];
                }
            }
            if (ProcessInstance.extendedProperties) {
                const props = ProcessInstance.extendedProperties;
                const vendorInfos = {
                    "name": props.displayName,
                    "vendorID": vendorId,
                    "email": props.emailAddress,
                    "phoneNumber": props.phoneNumber,
                    "profileId": props.profileId,
                    "profileName": props.profileName,
                    "company": props.company
                };
                VendorDetailsHelper.SetDetails(vendorInfos);
                Controls.Params_LockLogin__.SetValue(props.locked);
                Controls.Params_PasswordFree__.SetValue((parseInt(props.loginType, 10) & 16) === 16);
                // Settings pane - TODO
                //Controls.CreationDateTime__.SetValue(props.creationDateTime);
                //Controls.LastLoginDateTime__.SetValue(props.lastConnectionDateTime);
                //Controls.LastWelcomeEmailSendDate__.SetValue(props.lastWelcomeEmailDateTime);
                //Controls.Options__.SetValue(props.options);
            }
            resolve();
        });
    },
    SetDetails: function (details) {
        this.FillOrHideField(details.name, Controls.VendorDetailsName__);
        VendorDetailsHelper.FillOrHideField(details.company, Controls.VendorDetailsCompany__);
        VendorDetailsHelper.FillOrHideField(details.vendorID, Controls.VendorDetailsID__);
        VendorDetailsHelper.FillOrHideField(details.email, Controls.VendorDetailsEmail__);
        VendorDetailsHelper.FillOrHideField(details.phoneNumber, Controls.VendorDetailsPhoneNumber__);
        Controls.Params_ProfileLink__.SetURL(`../profile.aspx?id=${details.profileId}`);
        VendorDetailsHelper.FillOrHideField(details.profileName, Controls.Params_ProfileLink__);
        Controls.Params_Login__.SetText(details.vendorID);
    },
    FillOrHideField: function (value, control) {
        if (value) {
            control.SetText(value);
        }
        else {
            control.Hide(true);
        }
    },
    FillUserInformation: function (callback) {
        if (!ProcessInstance.extendedProperties) {
            callback();
            return;
        }
        const mapping = {
            ADDITIONALFIELD1: "AdditionalField1__",
            ADDITIONALFIELD2: "AdditionalField2__",
            ADDITIONALFIELD3: "AdditionalField3__",
            ADDITIONALFIELD4: "AdditionalField4__",
            ADDITIONALFIELD5: "AdditionalField5__",
            CITY: "City__",
            COMPANY: "Company__",
            COUNTRY: "Country__",
            //DELIVERYCOPYEMAIL: "Send_Copy_Email__",
            DESCRIPTION: "AdditionalInformation__",
            DISPLAYNAME: "DisplayName__",
            EMAILADDRESS: "EmailAddress__",
            FAXNUMBER: "FaxNumber__",
            FIRSTNAME: "FirstName__",
            LASTNAME: "LastName__",
            MAILSTATE: "MailState__",
            MAILSUB: "MailSub__",
            MIDDLENAME: "MiddleName__",
            MOBILENUMBER: "MobileNumber__",
            PHONENUMBER: "PhoneNumber__",
            STREET: "Street__",
            POBOX: "POBox__",
            TITLE: "Title__",
            ZIPCODE: "ZipCode__",
            DISPLAYWELCOMESCREEN: "DisplayWelcomePageOnNextLogin__"
        };
        const readyState = {
            callback: callback,
            Ready: function (module) {
                this[module] = true;
                if (this.callback && this.language && this.culture && this.encoding && this.timezone) {
                    this.callback();
                    ProcessInstance.SetSilentChange(false);
                }
            }
        };
        const complexMapping = {
            LANGUAGE: function (val) {
                Language.GetAvailableLanguages({
                    userType: "vendor", callback: function (data) {
                        if (!data.error && data.languages && data.languages[val]) {
                            Controls.Language__.SetText(data.languages[val].Display);
                        }
                        readyState.Ready("language");
                    }
                });
            },
            CULTURE: function (val) {
                Language.GetAvailableCultures({
                    callback: function (data) {
                        if (!data.error && data.cultures && data.cultures[val]) {
                            Controls.RegionalSettings__.SetText(data.cultures[val].Name);
                        }
                        readyState.Ready("culture");
                    }
                });
            },
            EXPORTENCODING: function (val) {
                val = val || "_Default";
                Language.Translate({
                    async: true,
                    key: "_Culture",
                    module: "user",
                    callback: function (dataCulture) {
                        if (!dataCulture.error) {
                            Language.Translate({
                                async: true,
                                key: val,
                                module: "exportencoding",
                                replacements: [dataCulture.formatted],
                                callback: function (dataEncoding) {
                                    if (!dataEncoding.error) {
                                        Controls.ExportEncoding__.SetText(dataEncoding.formatted);
                                    }
                                    readyState.Ready("encoding");
                                }
                            });
                        }
                    }
                });
            },
            TIMEZONEINDEX: function (val) {
                Language.Translate({
                    async: true,
                    key: val,
                    module: "timezone",
                    callback: function (data) {
                        if (!data.error) {
                            Controls.TimeZone__.SetText(data.formatted);
                        }
                        readyState.Ready("timezone");
                    }
                });
            }
        };
        Query.DBQuery(function () {
            ProcessInstance.SetSilentChange(true);
            for (const prop in mapping) {
                if (Controls[mapping[prop]]) {
                    Controls[mapping[prop]].SetValue(this.GetQueryValue(prop));
                }
            }
            for (const cProps in complexMapping) {
                if (typeof complexMapping[cProps] === "function") {
                    complexMapping[cProps](this.GetQueryValue(cProps), this);
                }
            }
            readyState.Ready("common");
        }, "ODUSER", Object.keys(mapping).concat(Object.keys(complexMapping)).join("|"), `(msn=${ProcessInstance.extendedProperties.msn})`, null, 1, null, "FastSearch=1");
    },
    GetVendorsMasterDataList: function () {
        return Sys.Helpers.Promise.Create(function (resolve) {
            if (!VendorDetailsHelper.vendorsMasterData) {
                const shortLogin = Controls.VendorDetailsID__.GetText();
                if (shortLogin) {
                    const filter = `(|(ShortLogin__=${shortLogin})(ShortLoginPAC__=${shortLogin}))`;
                    Query.DBQuery(function () {
                        const queryResults = this;
                        const vendorsMasterData = [];
                        const nbResults = queryResults.GetRecordsCount();
                        for (let i = 0; i < nbResults; i++) {
                            vendorsMasterData.push({
                                companyCode: queryResults.GetQueryValue("CompanyCode__", i),
                                vendorNumber: queryResults.GetQueryValue("Number__", i)
                            });
                        }
                        VendorDetailsHelper.vendorsMasterData = vendorsMasterData;
                        resolve(VendorDetailsHelper.vendorsMasterData);
                    }, "AP - Vendors links__", "CompanyCode__|Number__", filter, null, 100);
                }
                else {
                    resolve([]);
                }
            }
            else {
                resolve(VendorDetailsHelper.vendorsMasterData);
            }
        });
    },
    GetCompanyCodeAndVendorFilter: function () {
        return Sys.Helpers.Promise.Create(function (resolve) {
            VendorDetailsHelper.GetVendorsMasterDataList().Then((vendorsMasterData) => {
                const filter = [];
                for (const vendorMasterData of vendorsMasterData) {
                    filter.push(`(&(CompanyCode__=${vendorMasterData.companyCode})(VendorNumber__=${vendorMasterData.vendorNumber}))`);
                }
                if (filter.length > 0) {
                    resolve(`(|${filter.join("")})`);
                }
                else {
                    Log.Warn("Vendor contact is not associated to any company in Vendors links__ table");
                    resolve("(1=0)");
                }
            });
        });
    },
    BuildVendorID: function (vendor) {
        return `id_${vendor.companyCode}_${vendor.vendorNumber}`;
    },
    ParseVendorID: function (id) {
        const idSplits = id.split("_");
        if (idSplits.length >= 3) {
            return {
                companyCode: idSplits[1],
                vendorNumber: id.split("_").splice(2, 10).join("_")
            };
        }
        return null;
    },
    GetVendorCompanyID: function (key) {
        return this.vendorsCompanyRUIDexById[key];
    },
    SetVendorCompanyID: function (key, value) {
        this.vendorsCompanyRUIDexById[key] = value;
    }
};
const ActionMenuHelper = {
    BindEvents: function () {
        Controls.ActionMenu__.BindEvent("onActionLoad", function () {
            Controls.ActionMenu__.FireEvent("onActionLoad", {
                appInstances: GetAppInstances(),
                tabs: {
                    MoreDetails: Language.Translate("_More_Details"),
                    Edit: Language.Translate("_Edit"),
                    ResendWelcomeEmail: Language.Translate("_ResendWelcomeEmail"),
                    ResetPassword: Language.Translate("_ResetPassword")
                }
            });
        });
        Controls.ActionMenu__.BindEvent("EditAction", ActionMenuHelper.Edit);
        Controls.ActionMenu__.BindEvent("WelcomeEmailAction", ActionMenuHelper.ResendWelcomeEmail);
        Controls.ActionMenu__.BindEvent("ResetPasswordAction", ActionMenuHelper.ResetPassword);
        Controls.Params_ResetPassword__.OnClick = ActionMenuHelper.ResetPassword;
    },
    Init: function () {
        return Sys.Helpers.Promise.Create(function (resolve) {
            resolve();
        });
    },
    Edit: function () {
        const editVendorUrl = `${Sys.Portal.GetModifyUserUrl(ProcessInstance.extendedProperties.msn)}&extendedPropsId=${encodeURIComponent(ProcessInstance.id)}`;
        Process.OpenLink({ url: editVendorUrl, inCurrentTab: true, onQuit: "Back" });
    },
    ResendWelcomeEmail: function () {
        Popup.Confirm("_Resend welcome email confirmation", false, ActionMenuHelper.SendWelcomeEmail, null, "_Resend welcome email title");
    },
    ResetPassword: function () {
        Popup.Confirm("_Reset password confirmation", false, ActionMenuHelper.SendResetPasswordEmail, null, "_Reset password title");
    },
    SendWelcomeEmail: function () {
        Sys.Portal.ResendWelcomeEmail(ProcessInstance.extendedProperties.msn);
    },
    SendResetPasswordEmail: function () {
        Sys.Portal.ResetPassword(ProcessInstance.extendedProperties.msn);
    }
};
const NavMenuHelper = {
    Menus: {
        activity: {
            _views: {
                allEvents: "_Default audit-history view",
                loginEvents: "_Login audit-history view",
                persoInfEditEvents: "_Modification audit-history view",
                actionsEvents: "_Transport audit-history view"
            },
            panes: { ActivityPane: true },
            bindEvents: function () {
                const that = this;
                Controls.EventsHistory_NavMenu__.BindEvent("onLoad", function () {
                    const trads = {};
                    for (const view in that._views) {
                        if (that._views.hasOwnProperty(view)) {
                            trads[view] = Language.Translate(that._views[view]);
                        }
                    }
                    Controls.EventsHistory_NavMenu__.FireEvent("onEventHistoryLoad", { tabs: trads });
                });
                Controls.EventsHistory_NavMenu__.BindEvent("onClick", function (evt) {
                    that.changeActivityView(that._views[evt.args]);
                });
            },
            init: function () {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    resolve();
                });
            },
            onStart: function () {
                this.changeActivityView(this._views.persoInfEditEvents);
            },
            changeActivityView: function (viewName) {
                Controls.EventHistoryView__.SetView({
                    viewName: viewName,
                    filter: `(&(RecipientType=AUD)(|(OwnerID=${ProcessInstance.extendedProperties.ownerId})(SourceMsn=${ProcessInstance.extendedProperties.msn})))`,
                    checkProfileTab: false,
                    isSystem: true
                });
                Controls.EventHistoryView__.Apply();
            }
        },
        vendors: {
            panes: { VendorsMasterDataPane: true },
            bindEvents: function () {
                Controls.VendorsMasterDataList__.BindEvent("onClickVendor", this.OnClickVendor);
            },
            init: function () {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    resolve();
                });
            },
            _vendorMasterDataAlreadyFill: false,
            onStart: function () {
                if (!this._vendorMasterDataAlreadyFill) {
                    const htmlTag = "<!-- ###Insert Items Here### -->";
                    VendorDetailsHelper.GetVendorsMasterDataList().Then((vendorsMasterData) => {
                        let html = Controls.VendorsMasterDataList__.GetHTML();
                        for (const vendorMasterData of vendorsMasterData) {
                            const vendorId = VendorDetailsHelper.BuildVendorID(vendorMasterData);
                            let item = `<li class=\"nav-item\"><a id=\"${vendorId}\" style=\"display: inherit;\" onclick=\"OnClickVendor(this.id);\" href=\"#\" class=\"nav-link\">`;
                            item += `<span id=\"${vendorId}Lbl\">${vendorMasterData.companyCode} - ${vendorMasterData.vendorNumber}</span></a></li>`;
                            item += htmlTag;
                            html = html.replace(htmlTag, item);
                        }
                        Controls.VendorsMasterDataList__.SetHTML(html);
                    });
                    this._vendorMasterDataAlreadyFill = true;
                }
            },
            OnClickVendor: function (evt) {
                Controls.VendorsMasterDataList__.Wait(true);
                const vendorCompanyExtendedId = VendorDetailsHelper.GetVendorCompanyID(evt.args);
                if (vendorCompanyExtendedId) {
                    Process.OpenMessage(vendorCompanyExtendedId, true);
                    Controls.VendorsMasterDataList__.Wait(false);
                }
                else {
                    const vendorMD = VendorDetailsHelper.ParseVendorID(evt.args);
                    Lib.P2P.SIM.OpenCompanyDashboard(vendorMD.vendorNumber, vendorMD.companyCode)
                        .Then(function (ruidex) {
                        VendorDetailsHelper.SetVendorCompanyID(evt.args, ruidex);
                        Controls.VendorsMasterDataList__.Wait(false);
                    });
                }
            }
        },
        settings: {
            panes: { GeneralPane: true, SecurityPane: true },
            init: function () {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    resolve();
                });
            },
            onStart: function () {
            }
        },
        moreDetails: {
            panes: { GeneralInformationPane: true, MailAddressPane: true, RegionalSettingsPane: true, VendorAdvancedFieldsPane: true, WelcomeSettingsPane: true },
            init: function () {
                return Sys.Helpers.Promise.Create(function (resolve) {
                    // tslint:disable-next-line:forin
                    for (const pane in NavMenuHelper.Menus.moreDetails.panes) {
                        Controls[`${pane}_Loader__`].SetHTML(Sys.Portal.GetFieldsLoaderHtmlContent());
                        const controls = Controls[pane].GetControls();
                        for (const control of controls) {
                            control.Hide(control.GetName() !== `${pane}_Loader__`);
                        }
                    }
                    resolve();
                });
            },
            _vendorDetailsAlreadyFill: false,
            onStart: function () {
                if (!this._vendorDetailsAlreadyFill) {
                    VendorDetailsHelper.FillUserInformation(() => {
                        // tslint:disable-next-line: forin
                        for (const pane in NavMenuHelper.Menus.moreDetails.panes) {
                            const controls = Controls[pane].GetControls();
                            for (const control of controls) {
                                control.Hide(control.GetName() === `${pane}_Loader__`);
                            }
                        }
                    });
                    this._vendorDetailsAlreadyFill = true;
                }
            }
        }
    },
    BindEvents: function () {
        NavMenuHelper.OnClick({ args: "moreDetails" });
        Controls.NavMenu__.BindEvent("onLoad", function () {
            Controls.NavMenu__.FireEvent("onLoad", {
                appInstances: GetAppInstances(),
                tabs: {
                    vendors: Language.Translate("_NavVendors"),
                    activity: Language.Translate("_NavActivity"),
                    settings: Language.Translate("_NavSettings"),
                    moreDetails: Language.Translate("_More_Details")
                },
                startMenu: "moreDetails"
            });
        });
        Controls.NavMenu__.BindEvent("onClick", NavMenuHelper.OnClick);
        for (const m in this.Menus) {
            if (typeof this.Menus[m].bindEvents === "function") {
                this.Menus[m].bindEvents();
            }
        }
    },
    Init: function () {
        return Sys.Helpers.Promise.Create(function (resolve) {
            Object.keys(NavMenuHelper.Menus).reduce((p, l) => {
                return p.Then(() => {
                    return NavMenuHelper.Menus[l].init();
                });
            }, Sys.Helpers.Promise.Resolve())
                .Then(function () {
                Process.SetHelpId(2525);
                resolve();
            });
        });
    },
    OnClick: function (evt) {
        const panes = Controls.form_content_right.GetPanes();
        const menu = NavMenuHelper.Menus[evt.args];
        for (const pane of panes) {
            pane.Hide(!menu.panes[pane.GetName()]);
        }
        menu.onStart();
    }
};
function hideLegacyFields() {
    if (Controls.PaymentSettingsPane) {
        Controls.PaymentSettingsPane.Hide(true);
    }
    if (Controls.VendorCanProposeEarlyPayment__) {
        Controls.VendorCanProposeEarlyPayment__.Hide(true);
    }
    if (Controls.VendorCanProposeDiscountRate__) {
        Controls.VendorCanProposeDiscountRate__.Hide(true);
    }
    if (Controls.PaymentSettingsPane_Loader__) {
        Controls.PaymentSettingsPane_Loader__.Hide(true);
    }
}
function run() {
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorEntity.HTMLScripts.FromVendor.OnHTMLScriptBegin");
    hideLegacyFields();
    // BindEvents must be synchronous
    // The framework is executing HTML controls script just after customscript execution
    ActionMenuHelper.BindEvents();
    NavMenuHelper.BindEvents();
    // Init can be asynchronous
    return VendorDetailsHelper.Init()
        .Then(ActionMenuHelper.Init)
        .Then(NavMenuHelper.Init)
        .Then(function () {
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorEntity.HTMLScripts.FromVendor.OnHTMLScriptEndAsync");
    });
}
run();
//# sourceMappingURL=customscript.js.map