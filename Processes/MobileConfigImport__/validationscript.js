"use strict";
const currentName = Data.GetActionName();
const currentAction = Data.GetActionType();
Log.Info("-- Contract Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice() + "'");
/*
    - The order with the highest value has higher priority to avoid negative value
    - New imported config must have highest priority order
*/
function SaveConfiguration(migration, config, order, configName, forceUpgrade) {
    try {
        const json = Sys.Helpers.ParseJS(config.Customization);
        let processName = json.processName;
        let processId = config.ProcessId;
        if (migration && !processName) {
            // The customization was imported from a xml without processName specified in json
            try {
                processName = Process.GetProcessDefinitionFromID(processId).name;
            }
            catch (e) {
                Log.Error(e);
                return { error: e.toString() };
            }
        }
        configName = configName || processName;
        Log.Info(`Save mobile configuration "${configName}"`);
        const configType = processName ? "ProcessConfiguration" : "GlobalConfiguration";
        const orderAndUpgradable = GetConfigOrderAndUpgradable(configName);
        if (!forceUpgrade && (orderAndUpgradable && !orderAndUpgradable.upgradable)) {
            Log.Warn(`The mobile configuration '${configName}' exists and is not upgradable`);
            return { type: configType, warning: configName };
        }
        if (orderAndUpgradable) {
            // keep existing config order
            order = orderAndUpgradable.order;
        }
        if (!processId && processName) {
            processId = Process.GetProcessID(processName);
        }
        if (config.Customization.length >= 32766) {
            Log.Error(`The mobile configuration '${configName}' is too long. It exceed 32766 characters.`);
            return { type: configType, error: Language.Translate("_Error saving mobile configuration '{0}': {1}", false, configName, "The config is too long.") };
        }
        const upgradable = Sys.Helpers.IsUndefined(json.upgradable) || json.upgradable === true || Sys.Helpers.String.ToBoolean(json.upgradable) ? "1" : "0";
        const filter = Sys.Helpers.LdapUtil.FilterEqual("ConfigName__", configName).toString();
        const attributes = [
            { name: "ConfigName__", value: configName },
            { name: "ConfigType__", value: configType },
            { name: "ProcessName__", value: processName || "" },
            { name: "ProcessId__", value: processId || "" },
            { name: "Template__", value: json.template || "" },
            { name: "MainAccountId2__", value: config.MainAccountId2 },
            { name: "OwnerId__", value: config.OwnerId },
            { name: "Order__", value: order },
            { name: "Upgradable__", value: upgradable },
            { name: "LanguageName__", value: json.languageName },
            { name: "Configuration__", value: GetConfigurationJSON(json) },
            { name: "OriginalConfiguration__", value: config.Customization }
        ];
        const result = Sys.Helpers.Database.AddOrModifyTableRecord("MobileConfig__", filter, attributes);
        if (result.nSuccess == 0) {
            Log.Error(`Error saving mobile configuration '${configName}': ${result.msg}`);
            return { type: configType, error: Language.Translate("_Error saving mobile configuration '{0}': {1}", false, configName, result.msg) };
        }
        if (result.createdNewRecord) {
            Log.Info(`New mobile configuration '${configName}' successfully created`);
        }
        else {
            Log.Info(`Mobile configuration '${configName}' successfully updated`);
        }
        return { type: configType };
    }
    catch (e) {
        Log.Error(`Invalid mobile configuration: ${e.toString()}`);
        return { error: Language.Translate("_Invalid mobile configuration '{0}': {1}", false, configName || "", e.toString()) };
    }
}
function MigrateCustomizations() {
    Log.Info("Migrate customizations");
    const mainAccountId2 = Users.GetUser(Data.GetValue("OwnerId")).GetValue("MainAccountId");
    let filter = [];
    filter.push(Sys.Helpers.LdapUtil.FilterEqual("MainAccountId2", mainAccountId2));
    filter.push(Sys.Helpers.LdapUtil.FilterEqual("MainAccountId2", mainAccountId2 + "/*"));
    const queryFilter = Sys.Helpers.LdapUtil.FilterOr(...filter);
    const options = {
        table: "EDD_PROCESSMOBILE",
        attributes: ["ProcessId", "Customization", "MainAccountId2", "OwnerId"],
        filter: queryFilter.toString(),
        maxRecords: -1,
        additionalOptions: "FastSearch=-1"
    };
    return Sys.GenericAPI.PromisedQuery(options).Then(results => {
        let order = QueryLastOrder();
        let processIds = [];
        results.forEach(config => {
            order += 5;
            const result = SaveConfiguration(true, config, order);
            if (!result.error) {
                processIds.push(config.ProcessId);
            }
        });
        if (processIds.length > 0) {
            Log.Info("Remove migrated configs from EDD_PROCESSMOBILE");
            const removeFilter = Sys.Helpers.LdapUtil.FilterAnd(queryFilter, Sys.Helpers.LdapUtil.FilterIn("ProcessId", processIds));
            Sys.Helpers.Database.RemoveTableRecord("EDD_PROCESSMOBILE", removeFilter.toString());
        }
        return order;
    });
}
function Save(lastOrder, forceUpgrade) {
    let savingResult = { ProcessConfiguration: 0, GlobalConfiguration: 0, error: null, warning: null };
    const ownerId = Data.GetValue("OwnerId");
    const mainAccountId2 = Users.GetUser(ownerId).GetValue("MainAccountId");
    const nbAttach = Attach.GetNbAttach();
    let orderInc = 10;
    for (let i = 0; i < nbAttach && !savingResult.error; i++) {
        let order;
        // The attached file name defines the config order and name. Ex. 12-Expense ==> order=12, configName=Expense
        // Note: the importing from application enabling/upgrade creates only 1 attachement per process.
        let configName = Attach.GetName(i);
        const exp = /^(\d+)-(.+)$/;
        const res = exp.exec(configName);
        if (res !== null) {
            order = parseInt(res[1], 10);
            configName = res[2];
            if (order > lastOrder) {
                lastOrder = order;
            }
        }
        else {
            // No order specified in the file name will have a highet order of precedence (lastOrder + 110), (lastOrder + 120), ...
            order = lastOrder + 200 + orderInc;
            orderInc += 10;
        }
        // For the moment, only the importing from application enabling/upgrade should check upgradable
        const result = SaveConfiguration(false, { Customization: Attach.GetConvertedFile(i).GetContent({ detectEncoding: true }), MainAccountId2: mainAccountId2, OwnerId: ownerId }, order, configName, forceUpgrade);
        if (result.error) {
            savingResult.error = result.error;
        }
        else if (result.warning) {
            if (!savingResult.warning) {
                savingResult.warning = [];
            }
            savingResult.warning.push(result.warning);
        }
        else {
            savingResult[result.type]++;
        }
    }
    return savingResult;
}
function QueryLastOrder() {
    const vars = Sys.Helpers.Database.GetFirstRecordResult("MobileConfig__", null, "Order__", "Order__ DESC", "Limit=1");
    return vars ? vars.GetValue_Long("Order__", 0) : 0;
}
function GetConfigOrderAndUpgradable(configName) {
    const filter = Sys.Helpers.LdapUtil.FilterEqual("ConfigName__", configName).toString();
    const vars = Sys.Helpers.Database.GetFirstRecordResult("MobileConfig__", filter, "Order__,Upgradable__");
    if (!vars) {
        return null;
    }
    return { order: vars.GetValue_Long("Order__", 0), upgradable: vars.GetValue_Long("Upgradable__", 0) === 1 };
}
function GetConfigurationJSON(json) {
    // Migrate old customization on actions and notif: undefined properties are removed with the JSON.stringify
    [json.actions, json.notif]
        .filter(obj => !!obj)
        .forEach(obj => {
        for (const name in obj) {
            if (typeof obj[name] === "undefined") {
                obj[name] = null;
            }
        }
    });
    return JSON.stringify(json);
}
Process.DisableChecks();
if (!currentAction && !currentName) {
    // Enable/update the package
    if (Variable.GetValueAsString("ApplicationEnable") == "1" || Variable.GetValueAsString("ApplicationUpgrade") == "1") {
        let state = 100;
        if (!Process.PreventConcurrentAccess("SaveMobileConfig", () => {
            MigrateCustomizations().Then(newLastOrder => {
                if (Save(newLastOrder).error) {
                    state = 200;
                }
            });
        }, null, 120)) {
            Log.Error("Error creating the critical section 'SaveMobileConfig'");
            state = 200;
        }
        Data.SetValue("State", state);
    }
}
else if (currentAction === "approve_asynchronous" || currentAction === "approve") {
    let savingResult;
    switch (currentName) {
        case "Save":
        case "SaveQuit":
        case "ForceUpgrade":
            // Import configuration
            if (!Process.PreventConcurrentAccess("SaveMobileConfig", () => {
                savingResult = Save(QueryLastOrder(), currentName == "ForceUpgrade");
            })) {
                Log.Error("Error creating the critical section 'SaveMobileConfig'");
                savingResult = { ProcessConfiguration: 0, GlobalConfiguration: 0, error: Language.Translate("_Error creating the critical section 'SaveMobileConfig'") };
            }
            Variable.SetValueAsString("SavingResult", JSON.stringify(savingResult));
            if (savingResult.warning) {
                Process.PreventApproval();
            }
            else {
                Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
            }
            break;
        default:
            break;
    }
}
//# sourceMappingURL=validationscript.js.map