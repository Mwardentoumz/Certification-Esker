"use strict";
function InitArchiveDuration() {
    const archiveDuration = Sys.Parameters.GetInstance("AP").GetParameter("ArchiveDurationVendorPortalInMonth", null);
    if (archiveDuration !== null) {
        Data.SetValue("ArchiveDuration", archiveDuration);
    }
}
const CompanyHelper = {
    getCompanies: function () {
        const companies = Variable.GetValueAsString("companies");
        if (companies) {
            try {
                return JSON.parse(companies);
            }
            catch (e) {
                Log.Error("CompanyHelper.getCompanies - Cannot parse companies");
                Log.Verbose(e);
            }
        }
        return {};
    },
    getVendorLinksInfos: function () {
        const vendorLinksInfos = Variable.GetValueAsString("vendorLinksInfos");
        if (vendorLinksInfos) {
            try {
                return JSON.parse(vendorLinksInfos);
            }
            catch (e) {
                Log.Error("CompanyHelper.getVendorLinksInfos - Cannot parse vendor links infos");
                Log.Verbose(e);
            }
        }
        return {};
    }
};
async function updateSelectedCompany() {
    var _a, _b;
    const companies = CompanyHelper.getCompanies();
    const vendorLinksInfos = CompanyHelper.getVendorLinksInfos();
    const currentConfiguration = Variable.GetValueAsString("Configuration");
    let newConfiguration;
    for (const [companyCode, companyName] of Object.entries(companies)) {
        const selectedCompanyName = Data.GetValue("Company__");
        if (companyName !== selectedCompanyName) {
            continue;
        }
        Log.Info(`Selected company: ${companyName} with code: ${companyCode}`);
        // Will define the company code for the VIP
        Variable.SetValueAsString("customerInvoiceCompanyCode", companyCode);
        if (vendorLinksInfos["*"]) {
            Variable.SetValueAsString("submission_vendorid", vendorLinksInfos["*"].number);
            newConfiguration = vendorLinksInfos["*"].configuration;
        }
        else {
            Variable.SetValueAsString("submission_vendorid", (_a = vendorLinksInfos[companyCode]) === null || _a === void 0 ? void 0 : _a.number);
            newConfiguration = (_b = vendorLinksInfos[companyCode]) === null || _b === void 0 ? void 0 : _b.configuration;
        }
        break;
    }
    newConfiguration = newConfiguration || "Default";
    if (currentConfiguration !== newConfiguration) {
        Variable.SetValueAsString("Configuration", newConfiguration);
        await Lib.P2P.ChangeConfiguration(newConfiguration);
    }
}
//#region action
async function actionSubmit() {
    const setBusinessPartnerID = () => {
        if (Data.GetValue("BusinessPartnerID__")) {
            return;
        }
        const ownerId = Data.GetValue("OwnerId");
        const user = Users.GetUser(ownerId);
        if (user && user.GetValue("Vendor") === "1") {
            Data.SetValue("BusinessPartnerID__", user.GetValue("BusinessPartnerID"));
        }
    };
    // Update info based on the companyName selected on the form
    await updateSelectedCompany();
    setBusinessPartnerID();
    Variable.SetValueAsString("lasterror", "");
    if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
        const generateInvoiceNumber = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.GenerateInvoiceNumber");
        if (!Data.GetValue("Invoice_number__") && generateInvoiceNumber) {
            Data.SetValue("Invoice_number__", Lib.AP.VendorPortal.CreateFromFlipPO.getNextInvoiceNumber());
        }
        // Generate final version of the invoice image based on the form values the vendor changed.
        Lib.AP.VendorPortal.CreateFromFlipPO.validatePDF(Lib.AP.VendorPortal.CreateFromFlipPO.getCIDataFromForm());
        const bSign = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.SignInvoice");
        if (bSign && !Lib.AP.VendorPortal.CreateFromFlipPO.signInvoice()) {
            Variable.SetValueAsString("lasterror", "_ErrorMessageSignatureFailed");
            Process.PreventApproval();
        }
    }
}
async function actionRefreshPreview() {
    if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
        const overrideValues = Lib.AP.VendorPortal.CreateFromFlipPO.getCIDataFromForm();
        overrideValues.CustomerInvoiceStatus__ = Data.GetValue("CustomerInvoiceStatus__");
        Lib.AP.VendorPortal.CreateFromFlipPO.validatePDF(overrideValues);
    }
    Process.PreventApproval();
}
async function actionPendingPayment() {
    const scheduleActionParameters = Variable.GetValueAsString("ScheduledActionParameters") || "{}";
    const varsScheduleActionParams = JSON.parse(scheduleActionParameters);
    if (varsScheduleActionParams.invoiceStatus) {
        // Dynamic discounting - Go back to state 100
        Process.LeaveForm();
    }
}
async function actionReverseCI() {
    Data.SetValue("CustomerInvoiceStatus__", Lib.AP.CIStatus.Rejected);
    Process.LeaveForm();
}
function getCleanActionName(actionName) {
    let res = actionName.toLowerCase();
    if (res.substr(-2) === "__") {
        res = res.substr(0, res.length - 2);
    }
    return res;
}
//#endregion
/** ******** **/
/** RUN PART **/
/** ******** **/
async function executeRequestedAction() {
    InitArchiveDuration();
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info("currentAction:" + currentAction);
    Log.Info("currentName:" + currentName);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.OnActionBegin", currentAction, currentName);
    const approveActionMap = {
        "submit": { "execute": actionSubmit },
        "refreshpreview": { "execute": actionRefreshPreview },
        "invoicependingpayment": { "execute": actionPendingPayment },
        "reverseci": { "execute": actionReverseCI }
    };
    const action = approveActionMap[getCleanActionName(currentName)];
    if (action) {
        await action.execute();
    }
    else if (Lib.AP.CustomerInvoiceType.isFlipPO()) {
        Process.PreventApproval();
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.OnActionEnd", currentAction, currentName);
    //force empty billing label
    Data.SetValue("ProcessingLabel", "");
}
executeRequestedAction().Then(() => {
    Data.SetValue("PortalRuidEx__", Data.GetValue("RuidEx"));
});
//# sourceMappingURL=validationscript.js.map