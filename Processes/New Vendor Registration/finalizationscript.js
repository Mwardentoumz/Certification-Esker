"use strict";
const CultureHelper = {
    cultures: { en: "en-EN", fr: "fr-FR", de: "de-DE", it: "it-IT", es: "es-ES", "zh-CN": "zh-CN" },
    language: "en",
    selectedCulture: "",
    computeCulture: function () {
        this.language = Data.GetValue("VendorLanguage__");
        this.selectedCulture = this.cultures[this.language];
    }
};
const actionName = Data.GetActionName() || Variable.GetValueAsString("actionName");
const RegistrationHelper = {
    CreateRegistration: function () {
        let loginUser;
        const currentUserID = Data.GetValue("OwnerId");
        const ownerID = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.SetCustomOwner", currentUserID) || currentUserID;
        if (UserHelper.clonedUser) {
            const userVars = UserHelper.clonedUser.GetVars();
            loginUser = userVars.GetValue_String("Login", 0);
        }
        else {
            const internalUserVars = Users.GetUser(ownerID).GetVars();
            const accountID = internalUserVars.GetValue_String("AccountID", 0);
            loginUser = `${accountID}$${Data.GetValue("VendorEmail__")}`;
            const user = Users.GetUserAsProcessAdmin(loginUser);
            user.SetValues({
                AccountLocked: false,
                LoginType: 0x00000018 // AllowNoPassword | Vendor
            });
        }
        Lib.P2P.UserProperties.QueryValues(Users.GetUser(ownerID).GetValue("login")).then((properties) => {
            const vendorRegistrationProcess = Process.CreateProcessInstanceForUser("Vendor Registration", ownerID);
            //Manage fields potentially coming from a previous process in case NVR is requested from Procurement for example
            const vrData = vendorRegistrationProcess.GetUninheritedVars();
            RegistrationHelper.FillFieldsFromPreviousProcess(vrData);
            const capExtVars = vendorRegistrationProcess.GetExternalVars();
            capExtVars.AddValue_String("creatorOwnerId", ownerID, true);
            capExtVars.AddValue_String("creatorOwnerEmail", Users.GetUser(ownerID).GetValue("login"), true);
            capExtVars.AddValue_String("guestUserLogin", loginUser, true);
            capExtVars.AddValue_String("vendorCategory", Variable.GetValueAsString("vendorCategory"), true);
            capExtVars.AddValue_String("vendorItemCategoryID", Variable.GetValueAsString("vendorItemCategoryID"), true);
            capExtVars.AddValue_String("companyCode", properties.CompanyCode__, true);
            // Call user exit to add addtionnal variables
            Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.NewVendorRegistrationFinalizeProcess", vendorRegistrationProcess);
            vendorRegistrationProcess.Process();
        });
    },
    FillFieldsFromPreviousProcess: function (vrData) {
        const sourceGUID = Variable.GetValueAsString("SourceGUID");
        if (!Sys.Helpers.IsEmpty(sourceGUID)) {
            vrData.AddValue_String("SourceGUID__", sourceGUID, true);
        }
        const sourceCompanyCode = Variable.GetValueAsString("sourceCompanyCode");
        if (!Sys.Helpers.IsEmpty(sourceCompanyCode)) {
            vrData.AddValue_String("CompanyCode__", sourceCompanyCode, true);
        }
    }
};
const UserHelper = {
    guestUser: null,
    clonedUser: null,
    GetUserTemplateGuest: function () {
        if (this.guestUser === null) {
            const internalUser = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerId"));
            const supplierVars = internalUser.GetVars();
            const accountID = supplierVars.GetValue_String("AccountID", 0);
            this.guestUser = Users.GetUserAsProcessAdmin(accountID + "$_vendor_guest_template_");
        }
    },
    CloneTemplateGuest: function () {
        this.GetUserTemplateGuest();
        if (this.guestUser) {
            const email = Data.GetValue("VendorEmail__");
            this.clonedUser = this.guestUser.Clone(email, {
                emailaddress: email,
                culture: CultureHelper.selectedCulture,
                language: CultureHelper.language
            });
            return this;
        }
        throw "An error occcured during the creation of the vendor. Try again later, if the problem persist, contact the support.";
    }
};
if (Data.GetValue("VendorEmail__") && !Data.GetValue("OpenRegistrationForm__")) {
    if (actionName === "createUserAndSendInvitation") {
        CultureHelper.computeCulture();
        UserHelper.CloneTemplateGuest();
    }
    RegistrationHelper.CreateRegistration();
}
//# sourceMappingURL=finalizationscript.js.map