"use strict";
//Required: Sys/Sys_Helpers_LdapUtil, Sys/Sys_Helpers_TimeoutHelper, Lib_VM_Customization_Server
var ExtractionScript;
(function (ExtractionScript) {
    function fillVendorInfoMap(vendors, vendorNumber, vendorCompanyCode) {
        if (!vendors[vendorCompanyCode]) {
            vendors[vendorCompanyCode] = [];
        }
        if (!vendors[vendorCompanyCode].includes(vendorNumber)) {
            vendors[vendorCompanyCode].push(vendorNumber);
        }
    }
    function fillVendorResults(vendorIds, vendorId) {
        if (vendorId && vendorIds.indexOf(vendorId) < 0) {
            vendorIds.push(vendorId);
        }
    }
    function GetVendorsToUpdateFromDB(providerInstance) {
        const customQueryFilter = Sys.Helpers.TryCallFunction("Lib.VM.Customization.Server.GetExtraFilterForVendorFailureRiskSynchronization");
        const vendorQuery = providerInstance.GetVendorToUpdateQuery(customQueryFilter);
        const results = [];
        const vendors = {};
        if (vendorQuery.MoveFirst()) {
            const timeoutHelper = Sys.Helpers.TimeoutHelper.GetTimeoutHelper();
            let record = vendorQuery.MoveNextRecord();
            const vendorIdColumnName = providerInstance.GetVendorToUpdateIdColumnName();
            while (record) {
                const recordVars = record.GetVars();
                if (recordVars) {
                    const vendorId = recordVars.GetValue_String(vendorIdColumnName, 0);
                    fillVendorInfoMap(vendors, recordVars.GetValue_String("Number__", 0), recordVars.GetValue_String("CompanyCode__", 0));
                    fillVendorResults(results, vendorId);
                    record = vendorQuery.MoveNextRecord();
                    timeoutHelper.NotifyIteration();
                }
            }
        }
        return [JSON.stringify(results), JSON.stringify(vendors)];
    }
    ExtractionScript.GetVendorsToUpdateFromDB = GetVendorsToUpdateFromDB;
    function CreateFileVendorInternalScoring(vendors) {
        if (vendors) {
            Variable.SetValueAsString("InternalScoreNeedUpdate", "true");
            const vendorsListFile = TemporaryFile.CreateFile("json", "utf8");
            TemporaryFile.Append(vendorsListFile, vendors);
            Attach.AttachTemporaryFile(vendorsListFile, "InternalScoreVendorsToUpdate");
        }
        else {
            Log.Info("No vendor requiring score re-computation");
        }
    }
    ExtractionScript.CreateFileVendorInternalScoring = CreateFileVendorInternalScoring;
    function CreateFile(vendors) {
        const tempFile = TemporaryFile.CreateFile("json", "utf8");
        TemporaryFile.Append(tempFile, vendors);
        Attach.AttachTemporaryFile(tempFile, "VendorsToUpdate");
    }
    ExtractionScript.CreateFile = CreateFile;
    function RunExtraction() {
        const providerName = Lib.VM.ScoringProviders.Server.GetScoringProviderFromParameters();
        Log.Info(`Provider name: ${providerName}`);
        // Instantiate the scoring provider instance
        // It will allow to customize the query to list the vendors ID to update
        // Returned a default Provider Instance for compatibility with previous implementation
        const providerInstance = Lib.VM.ScoringProviders.Server.Manager.GetProviderOrDefault(providerName);
        if (!providerInstance) {
            Log.Error(`Provider '${providerName}' not found`);
            return;
        }
        const [vendorsToUpdate, intenalSCoreVendorsToUpdate] = ExtractionScript.GetVendorsToUpdateFromDB(providerInstance);
        ExtractionScript.CreateFileVendorInternalScoring(intenalSCoreVendorsToUpdate);
        ExtractionScript.CreateFile(vendorsToUpdate);
    }
    ExtractionScript.RunExtraction = RunExtraction;
})(ExtractionScript || (ExtractionScript = {}));
ExtractionScript.RunExtraction();
//# sourceMappingURL=extractionscript.js.map