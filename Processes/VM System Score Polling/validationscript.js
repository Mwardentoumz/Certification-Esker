"use strict";
/* eslint-disable max-depth */
//Required: Sys/Sys_Helpers_TimeoutHelper, Sys/Sys_DunsServer, Lib_VM_ScoringProviders_Server, Sys/Sys_DunsHelper, Sys/Sys_IndueDHelper, Sys/Sys_IndueDServer, Sys/Sys_EcovadisServer, Sys/Sys_EcovadisHelper
function GetProviderAccessor(configuration, providerString) {
    if (!(configuration === null || configuration === void 0 ? void 0 : configuration.credentials)) {
        return null;
    }
    switch (providerString) {
        case Lib.VM.ScoringProviders.Common.ProviderName.duns:
            return new Sys.DunsServer(configuration.credentials, configuration.settings);
        case Lib.VM.ScoringProviders.Common.ProviderName.indueD:
            return new Sys.IndueDServer(configuration.credentials);
        case Lib.VM.ScoringProviders.Common.ProviderName.ecovadis:
            return new Sys.EcovadisServer(configuration.credentials);
    }
}
async function GetData(vendorIds, provider) {
    const configuration = Lib.VM.ScoringProviders.Server.Providers.GetConfiguration(provider);
    const accessor = GetProviderAccessor(configuration, provider);
    if (!accessor || !configuration.scoreTypes) {
        return;
    }
    const vendorIdsToDelete = initializeVendorIdsToDelete(configuration.scoreTypes);
    for (const scoreType of configuration.scoreTypes) {
        if (!await processVendorIds(vendorIds, accessor, scoreType, vendorIdsToDelete, provider)) {
            return;
        }
    }
    deleteVendorScores(configuration.scoreTypes, vendorIdsToDelete, provider);
}
function initializeVendorIdsToDelete(scoreTypes) {
    return scoreTypes.reduce((acc, scoreType) => {
        acc[scoreType] = [];
        return acc;
    }, {});
}
async function processVendorIds(vendorIds, accessor, scoreType, vendorIdsToDelete, provider) {
    for (const vendorId of vendorIds) {
        if (accessor instanceof Sys.DunsServer && !isValidSession(accessor)) {
            return false;
        }
        const data = await accessor.GetCompanyData(vendorId, scoreType);
        if (!handleCompanyData(data, vendorId, scoreType, vendorIdsToDelete, provider)) {
            return false;
        }
        ScoringAgenciesHandler.TimeOutHelper.NotifyIteration();
    }
    return true;
}
function isValidSession(accessor) {
    if (!accessor.IsSessionKey() && !accessor.GetSessionKey()) {
        Data.SetValue("State", 200);
        Data.SetValue("ShortStatus", "Error getting session key");
        return false;
    }
    return true;
}
function handleCompanyData(data, vendorId, scoreType, vendorIdsToDelete, provider) {
    if (data) {
        if (data.msg) {
            Log.Warn(data.msg);
        }
        if (data.error) {
            // Probably a configuration/credentials issue - exit processing
            const errorMsg = `Error getting company data for ${provider} ${vendorId}`;
            Log.Error(errorMsg);
            Data.SetValue("State", 200);
            Data.SetValue("ShortStatus", errorMsg);
            return false;
        }
        if (data.noScore) {
            vendorIdsToDelete[scoreType].push(vendorId);
        }
        else {
            ResultHelper.Add(vendorId, provider, scoreType, data);
        }
    }
    else {
        vendorIdsToDelete[scoreType].push(vendorId);
    }
    return true;
}
function deleteVendorScores(scoreTypes, vendorIdsToDelete, provider) {
    for (const scoreType of scoreTypes) {
        if (vendorIdsToDelete[scoreType].length > 0) {
            Lib.VM.ScoringProviders.Server.Providers.Clear(vendorIdsToDelete[scoreType], provider, scoreType);
        }
    }
}
const ResultHelper = {
    _results: {},
    Add: function (vendorId, provider, scoreType, data) {
        if (!scoreType) {
            scoreType = "FailureScore";
        }
        if (data) {
            data.identifier = vendorId;
            data.provider = provider;
            if (!this._results[scoreType]) {
                this._results[scoreType] = [];
            }
            this._results[scoreType].push(data);
        }
    },
    Get: function () {
        return this._results;
    }
};
const ScoringAgenciesHandler = {
    TimeOutHelper: null,
    GetData,
    GetProviderAccessor,
};
function GetScoringAgencies() {
    const parameterString = Variable.GetValueAsString("reportParameter");
    if (parameterString) {
        try {
            const { provider } = JSON.parse(parameterString);
            return [provider];
        }
        catch (e) {
            Log.Error(`Error parsing the reportParameter JSON: ${parameterString}`);
            return [];
        }
    }
    return [Lib.VM.ScoringProviders.Common.ProviderName.duns];
}
async function runValidation() {
    if (Variable.GetValueAsString("ScoreRequestDone") !== "true") {
        Sys.Helpers.TryCallFunction("Lib.VM.Customization.Server.OnValidationScriptBegin");
        const nbAttach = Attach.GetNbAttach();
        if (nbAttach === 0) {
            return;
        }
        const file = Attach.GetInputFile(nbAttach - 1);
        const vendorIds = JSON.parse(file.GetContent());
        const scoringAgencies = GetScoringAgencies();
        ScoringAgenciesHandler.TimeOutHelper = Sys.Helpers.TimeoutHelper.GetTimeoutHelper();
        await Promise.all(scoringAgencies.map(async (scoringAgency) => {
            Log.Info(`Refreshing data from ${scoringAgency}...`);
            await ScoringAgenciesHandler.GetData(vendorIds, scoringAgency);
        }));
        Log.Info("Serializing results in Scores.json");
        const tempFile = TemporaryFile.CreateFile("json", "utf8");
        TemporaryFile.Append(tempFile, JSON.stringify(ResultHelper.Get()));
        Attach.AttachTemporaryFile(tempFile, "Scores");
        Variable.SetValueAsString("ScoreRequestDone", "true");
    }
}
runValidation();
//# sourceMappingURL=validationscript.js.map