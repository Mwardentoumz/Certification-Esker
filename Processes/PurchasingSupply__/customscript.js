"use strict";
var CustomScript;
(function (CustomScript) {
    const panes = ["AccessRestrictionPane", "AnalyticsPane", "DataPanel"];
    const buttons = ["Save", "Close"];
    const g_layout = new Lib.P2P.Layout.Manager(panes, buttons);
    var SupplyType = Lib.Purchasing.SupplyType;
    let isUNSPSCEnabled = false;
    const initialValues = {
        companyCode: Data.GetValue("CompanyCode__"),
        supplyTypeID: Data.GetValue("SupplyID__"),
        name: Data.GetValue("Name__"),
        unspscs: [],
        supplierNumbers__: []
    };
    class SupplyTypeLinker extends Lib.LinkerManagerClient {
        constructor() {
            super("Purchasing Supply Updater");
        }
        async Process(action, companyCode, supplyId) {
            if (!supplyId) {
                throw "Supply Id is required";
            }
            const msnex = await this.CreateLinker(action, {
                CompanyCode__: companyCode,
                SupplyID__: supplyId
            });
            return await this.WaitLinker(msnex);
        }
        async Update(companyCode, supplyTypeId) {
            return await this.Process(SupplyType.Action.UpdateChildrenTree, companyCode, supplyTypeId);
        }
    }
    CustomScript.SupplyTypeLinker = SupplyTypeLinker;
    class UsersBrowse {
        static async Configure() {
            const usersOrGroupsOptions = Lib.P2P.UsersBrowseOptions.GetUsersOrGroupsOptions({
                placeholder: "_SelectOrEnterEmailAddress"
            });
            await Lib.P2P.UsersBrowse.Init({
                browsedControl: Controls.AllowedUsersOrGroups__,
                storageName: "TechnicalAllowedUsersOrGroups__",
                storageType: Lib.P2P.UsersBrowse.StorageType.Control,
                dialogTitle: "_UserPopup_Title",
                select2CtrlOptions: usersOrGroupsOptions,
                select2CtrlLabel: "_UserPopup_UsersOrGroups",
                storeDisplayName: false
            });
        }
    }
    async function OnCompanyCodeChange() {
        g_layout.ShowWaitScreen();
        const companyCode = Data.GetValue("CompanyCode__");
        const filter = Sys.Helpers.IsEmpty(companyCode)
            ? Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", "")
            : Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode);
        Controls.ParentSupplyID__.SetFilter(filter.toString());
        Controls.DefaultGLAccount__.SetFilter(filter.toString());
        await Process.CheckAllControls();
        await SupplyType.manager.Query(companyCode);
        await OnParentOrIDChange();
        g_layout.HideWaitScreen();
    }
    async function OnDependencyChange() {
        const fieldDependencies = ["CompanyCode__", "SupplyID__", "ParentSupplyID__", "Name__"];
        const updateDependencies = fieldDependencies.every(fieldName => !Data.GetError(fieldName));
        if (updateDependencies) {
            ProcessInstance.SetSilentChange(true);
            const companyCode = Data.GetValue("CompanyCode__");
            const id = Data.GetValue("SupplyID__");
            const parentId = Data.GetValue("ParentSupplyID__");
            const name = Data.GetValue("Name__");
            const allowedLogins = Data.GetValue("TechnicalAllowedUsersOrGroups__");
            const updatedSupply = SupplyType.manager.UpdateSupplyTypeInCache(ruidex, {
                CompanyCode__: companyCode,
                SupplyID__: id,
                ParentSupplyID__: parentId,
                Name__: name,
                DisableRestrictionInheritance__: Data.GetValue("DisableRestrictionInheritance__"),
                TechnicalAllowedUsersOrGroups__: allowedLogins ? allowedLogins.split(";") : null,
            });
            await UpdateFormValues(updatedSupply);
        }
        ProcessInstance.SetSilentChange(false);
    }
    async function OnParentOrIDChange() {
        await Controls.ParentSupplyID__.WaitForCheck();
        const companyCode = Data.GetValue("CompanyCode__");
        const id = Data.GetValue("SupplyID__");
        const parentId = Data.GetValue("ParentSupplyID__");
        let error = "";
        if (!Sys.Helpers.IsEmpty(id) && id === parentId) {
            error = Language.Translate("_SupplyTypeError_IdenticalIdAndParent", false);
        }
        else if (SupplyType.manager.GetRecursionID(companyCode, id, parentId)) {
            const parent = SupplyType.manager.GetFromCache(companyCode, parentId);
            error = Language.Translate("_SupplyTypeError_Recursion", false, parent.name);
        }
        if (error) {
            Data.SetCategorizedError("ParentSupplyID__", Lib.P2P.ErrorCategory.SupplyType, error);
        }
        else {
            Lib.P2P.ResetCategorizedError("ParentSupplyID__", Lib.P2P.ErrorCategory.SupplyType);
        }
        await OnDependencyChange();
        isUNSPSCEnabled = await Lib.P2P.UNSPSC.IsEnabledByQuery(companyCode);
        await InitUNSPSC(isUNSPSCEnabled);
        await InitFavoriteSuppliers(isUNSPSCEnabled);
    }
    async function UpdateFormValues(supply) {
        Data.SetValue("FullName__", supply.GetPath());
        const parent = SupplyType.manager.GetParent(supply.companyCode, supply.id);
        const inhUsersLogins = parent ? parent.computedAllowedLogins : [];
        const inhUsersInfo = inhUsersLogins.length ? await Lib.P2P.UsersBrowse.GetCompleteUsersOrGroups(inhUsersLogins) : [];
        Controls.InheritedTechnicalAllowedLogins__.SetValue(inhUsersLogins.join(";"));
        Controls.InheritedAllowedLogins__.SetValue(inhUsersInfo.map(userOrGroup => userOrGroup.name).join("\n"));
        Data.SetValue("ComputedTechnicalAllowedLogins__", supply.computedAllowedLogins.join(";"));
        UpdateLayout();
    }
    function UpdateLayout() {
        const hideParentDependencies = !Data.GetValue("ParentSupplyID__") || !Controls.InheritedTechnicalAllowedLogins__.GetValue();
        Controls.InheritedAllowedLogins__.Hide(hideParentDependencies);
        Controls.DisableRestrictionInheritance__.Hide(hideParentDependencies);
        if (Controls.DisableRestrictionInheritance__.IsChecked()) {
            Controls.InheritedAllowedLogins__.AddStyle("highlight-grayed");
        }
        else {
            Controls.InheritedAllowedLogins__.RemoveStyle("highlight-grayed");
        }
    }
    async function GetUnspscsUpdateParameters() {
        const companyCode = Data.GetValue("CompanyCode__");
        const supplyTypeID = Data.GetValue("SupplyID__");
        const name = Data.GetValue("Name__");
        const selectedUNSPSCs = Sys.Helpers.Data.GetTableAsArray(Controls.UNSPSCList__).map((item) => item.GetValue("Code__"));
        const hasKeyChanged = initialValues.companyCode !== companyCode || initialValues.supplyTypeID !== supplyTypeID;
        const hasChangedName = initialValues.name !== name;
        const updateParameters = {
            codes: selectedUNSPSCs,
            deleted: hasKeyChanged ? {
                UNSPSCs__: initialValues.unspscs,
                SupplyTypeID__: initialValues.supplyTypeID,
                CompanyCode__: initialValues.companyCode
            } : undefined
        };
        let doUpdate = hasKeyChanged || hasChangedName;
        if (!doUpdate) {
            const previousUNSPSCs = await Lib.P2P.UNSPSC.ItemCategories.QueryUNSPSCFromItemCategory(supplyTypeID, companyCode);
            const previousNumbers = previousUNSPSCs.map((item) => item.number).sort().join(",");
            const selectedNumbers = selectedUNSPSCs.sort().join(",");
            doUpdate = previousNumbers !== selectedNumbers;
        }
        return doUpdate ? updateParameters : null;
    }
    function RequireChildrenUpdate() {
        const children = SupplyType.manager.GetChildrenTree(Data.GetValue("CompanyCode__"), Data.GetValue("SupplyID__"));
        return children && children.some(child => SupplyType.manager.UpdateParentDependencies(child));
    }
    function RequireSupplierUpdate() {
        if (isUNSPSCEnabled) {
            const supplierNumbers = Sys.Helpers.Data.GetTableAsArray(Controls.Suppliers__).map((item) => item.GetValue("SupplierNumber__"));
            const selectedNumbers = supplierNumbers.sort().join(",");
            const previousNumbers = initialValues.supplierNumbers__.sort().join(",");
            return previousNumbers !== selectedNumbers;
        }
        return false;
    }
    async function RequireUNSPSCDuplicatesCheck() {
        return isUNSPSCEnabled && await Lib.P2P.UNSPSC.ItemCategories.Client.CheckUNSPSCDuplicates(Controls.UNSPSCList__, Controls.SupplyID__.GetValue(), Data.GetValue("CompanyCode__"));
    }
    async function ValidateForm() {
        await Process.CheckAllControls();
        if (!Process.ShowFirstError()) {
            const requireChildrenUpdate = RequireChildrenUpdate();
            const requireDuplicateValidation = await RequireUNSPSCDuplicatesCheck();
            let dialogConfig = null;
            if (requireChildrenUpdate && requireDuplicateValidation) {
                dialogConfig = {
                    title: "_MultipleChangesWarningTitle",
                    message: "_MultipleChangesWarningMessage",
                    yesLabel: "_MultipleChangesWarningConfirm"
                };
            }
            else if (requireChildrenUpdate) {
                dialogConfig = {
                    title: "_LongProcessingWarningTitle",
                    message: "_LongProcessingWarning",
                    yesLabel: "_UpdateChildren"
                };
            }
            else if (requireDuplicateValidation) {
                dialogConfig = {
                    title: "_Warning",
                    message: "_Some UNSPSC already used by other supply types",
                    yesLabel: "_Save"
                };
            }
            const allowSave = !dialogConfig || await Lib.CommonDialog.PromisedPopup(dialogConfig, "Yes" /* Lib.CommonDialog.Action.Yes */);
            if (allowSave) {
                return {
                    updateChildren: requireChildrenUpdate,
                    updateUnspscParameters: await GetUnspscsUpdateParameters(),
                    updateSuppliers: RequireSupplierUpdate()
                };
            }
        }
        return null;
    }
    async function UpdateUNSPSC(parameters) {
        Controls.UNSPSCPane.Wait(true);
        const unspscRecord = new Lib.P2P.UNSPSC.RecordManager.Client();
        await unspscRecord.UpdateItemCategory({
            CompanyCode__: Controls.CompanyCode__.GetValue(),
            SupplyID__: Controls.SupplyID__.GetValue(),
            SupplyType__: Controls.Name__.GetValue(),
            UNSPSCs__: parameters.codes,
            MappingsToDelete: parameters.deleted
        });
        Controls.UNSPSCPane.Wait(false);
    }
    async function UpdateSuppliers() {
        const companyCode = Data.GetValue("CompanyCode__");
        const supplyTypeId = Controls.SupplyID__.GetValue();
        if (!Sys.Helpers.IsEmpty(companyCode) && !Sys.Helpers.IsEmpty(supplyTypeId)) {
            Controls.Suppliers__.Wait(true);
            await Lib.P2P.PreferredSuppliers.SavePreferredSuppliersFromControls(Controls, companyCode, supplyTypeId);
            Controls.Suppliers__.Wait(false);
        }
    }
    async function SynchronousSave(validation) {
        const promises = [];
        if (validation.updateUnspscParameters) {
            promises.push(UpdateUNSPSC(validation.updateUnspscParameters));
        }
        if (validation.updateSuppliers) {
            promises.push(UpdateSuppliers());
        }
        await Promise.all(promises);
    }
    async function OnSubmitForm() {
        const validation = await ValidateForm();
        if (validation) {
            await SynchronousSave(validation);
            if (validation.updateChildren) {
                const linkerManager = new SupplyTypeLinker();
                // not awaited : backeground processing requires new form values
                void linkerManager.Update(Data.GetValue("CompanyCode__"), Data.GetValue("SupplyID__"));
            }
            ProcessInstance.SaveAndQuit("Save");
        }
    }
    function InitControls() {
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.CompanyCode__, OnCompanyCodeChange, OnCompanyCodeChange, OnCompanyCodeChange);
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ParentSupplyID__, OnParentOrIDChange, OnParentOrIDChange, OnParentOrIDChange);
        Controls.SupplyID__.OnChange = OnParentOrIDChange;
        Controls.Name__.OnChange = OnDependencyChange;
        Controls.SupplyID__.SetRequired(true);
        Controls.Name__.SetRequired(true);
        Controls.FullName__.SetReadOnly(true);
        Controls.AccessRestrictionPane.Hide(false);
        Controls.DisableRestrictionInheritance__.OnChange = OnDependencyChange;
        Controls.AllowedUsersOrGroups__.OnSetValue = OnDependencyChange;
        Controls.AllowedUsersOrGroups__.SetReadOnly(true);
        Controls.AllowedUsersOrGroups__.SetBrowsable(!ProcessInstance.isReadOnly);
        Controls.TechnicalAllowedUsersOrGroups__.OnSetValue = OnDependencyChange;
        Controls.Save.OnClick = function () {
            OnSubmitForm();
            return false;
        };
    }
    const ruidex = Data.GetValue("RuidEx");
    async function Init() {
        Sys.Helpers.EnableSmartSilentChange();
        g_layout.Hide(true);
        g_layout.ShowWaitScreen();
        await Sys.Parameters.GetInstance("P2P").PromisedIsReady();
        await UsersBrowse.Configure();
        // Display errors if any + Set Parent filter
        await OnCompanyCodeChange();
        g_layout.Hide(false);
        g_layout.HideWaitScreen();
        InitControls();
        SaveInitialMappings();
    }
    CustomScript.Init = Init;
    function SaveInitialMappings() {
        initialValues.unspscs = Sys.Helpers.Data.GetTableAsArray(Controls.UNSPSCList__).map((item) => item.GetValue("Code__"));
        initialValues.supplierNumbers__ = Sys.Helpers.Data.GetTableAsArray(Controls.Suppliers__).map((item) => item.GetValue("SupplierNumber__"));
    }
    async function InitFavoriteSuppliers(isUNSPSCEnabled) {
        const companyCode = Controls.CompanyCode__.GetValue();
        const supplyTypeId = Controls.SupplyID__.GetValue();
        Controls.FavoriteSuppliersPane.Hide(!isUNSPSCEnabled);
        if (isUNSPSCEnabled) {
            await Lib.P2P.PreferredSuppliers.InitPane(Controls, companyCode, supplyTypeId);
        }
    }
    async function InitUNSPSC(isUNSPSCEnabled) {
        const isFilled = Controls.UNSPSCList__.GetItemCount() !== 0;
        const companyCode = Controls.CompanyCode__.GetValue();
        await Lib.P2P.UNSPSC.CheckUNSPSCExistsInUserLanguage();
        Lib.P2P.UNSPSC.Client.InitUNSPSCBrowseAndTable(isUNSPSCEnabled, Controls.UNSPSC__, Controls.UNSPSCList__, false, true);
        Controls.UNSPSCPane.Hide(!isUNSPSCEnabled);
        Controls.EmptyUNSPSCList__.Hide(isFilled);
        if (isUNSPSCEnabled) {
            await Lib.P2P.UNSPSC.ItemCategories.Client.FillTableFromItemCategoriesUNSPSCMapping(Controls.SupplyID__.GetValue(), companyCode);
            await Lib.P2P.UNSPSC.ItemCategories.Client.CheckUNSPSCDuplicates(Controls.UNSPSCList__, Controls.SupplyID__.GetValue(), companyCode);
        }
    }
    async function Main() {
        return Sys.Helpers.TryCallFunctionAsync("Lib.P2P.Customization.Tables.Client.PurchasingSupply.OnHTMLScriptBegin")
            .Then(() => {
            return CustomScript.Init();
        }).Then(() => {
            Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
            Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.PurchasingSupply.OnHTMLScriptEnd");
        });
    }
    CustomScript.Main = Main;
    Main();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map