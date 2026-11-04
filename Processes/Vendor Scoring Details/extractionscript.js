"use strict";
var Extraction;
(function (Extraction) {
    function ParseVendorInfoToFilter(vendorMap) {
        const filters = [];
        for (const companyCode in vendorMap) {
            const vendorNumbers = vendorMap[companyCode];
            if (vendorNumbers.length) {
                filters.push(Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterIn("Number__", vendorNumbers)));
            }
        }
        return filters.length === 1 ? filters[0] : Sys.Helpers.LdapUtil.FilterOr(...filters);
    }
    function ParseJSONFileToVendorFilter() {
        const content = Attach.GetContent(0);
        if (content) {
            const vendorMap = JSON.parse(content);
            return ParseVendorInfoToFilter(vendorMap);
        }
        return null;
    }
    function ParseCsvFileToVendorFilter() {
        const csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
        csvHelper.GuessSeparator(); //This read the header to get the separator;
        const COLUMNS = {
            CompanyCode__: 0,
            CreationDateTime: 1,
            Score__: 2,
            ScoringType__: 3,
            VendorNumber__: 4,
            SourceRUIDEX__: 5
        };
        const vendorsMap = {};
        while (csvHelper.GetNextLine()) {
            const csvLine = csvHelper.GetCurrentLineArray();
            if (csvLine) {
                const vendorNumber = csvLine[COLUMNS.VendorNumber__];
                const vendorCompanyCode = csvLine[COLUMNS.CompanyCode__];
                if (!vendorsMap[vendorCompanyCode]) {
                    vendorsMap[vendorCompanyCode] = [];
                }
                if (!vendorsMap[vendorCompanyCode].includes(vendorNumber)) {
                    vendorsMap[vendorCompanyCode].push(vendorNumber);
                }
            }
        }
        return ParseVendorInfoToFilter(vendorsMap);
    }
    async function Main() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info("-- VSD Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice() + "'");
        const nbAttach = Attach.GetNbAttach();
        if (nbAttach !== 0) {
            const attachIndex = 0;
            const extenstion = Attach.GetExtension(attachIndex);
            Log.Info(`Found attach with extension ${extenstion}`);
            const vendorFilter = extenstion === ".json" ? ParseJSONFileToVendorFilter() : ParseCsvFileToVendorFilter();
            if (vendorFilter) {
                await Lib.VM.InternalScoring.LoadParameters();
                const scoringRules = await Lib.VM.InternalScoring.ScoringRules.QueryRulesAndBuild();
                await Lib.VM.InternalScoring.UpdateVendors(vendorFilter, scoringRules, currentName);
            }
        }
        else if (Variable.GetValueAsString("ExtendedPropertiesRuidex") !== "") {
            const companyCode = Variable.GetValueAsString("CompanyCode");
            const vendorNumber = Variable.GetValueAsString("VendorNumber");
            const extendedPropertiesRuidex = Variable.GetValueAsString("ExtendedPropertiesRuidex");
            const score = Variable.GetValueAsString("Score");
            Lib.VM.InternalScoring.SetVendorInternalScore(companyCode, vendorNumber, extendedPropertiesRuidex, parseInt(score));
        }
        else {
            Log.Error("No file to process");
        }
    }
    Extraction.Main = Main;
})(Extraction || (Extraction = {}));
Lib.P2P.HandleScriptError(Extraction.Main());
//# sourceMappingURL=extractionscript.js.map