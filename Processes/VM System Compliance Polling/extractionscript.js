"use strict";
//Required: Sys/Sys_Helpers_LdapUtil, Sys/Sys_Helpers_TimeoutHelper
function GetThirdPartiesToUpdateFromDB() {
    // DBSET_READONLY | DBSET_QUICK
    const DBFastAccess = 0x00210000;
    // also returns ownershipped records
    const DBDirtyRead = 0x00020000;
    const customQueryFilter = Sys.Helpers.TryCallFunction("Lib.VM.Customization.Server.GetExtraFilterForVendorComplianceSynchronization");
    let queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterExist("ComplianceRiskIdentifier__"), Sys.Helpers.LdapUtil.FilterNotEqual("ComplianceRiskIdentifier__", ""));
    if (customQueryFilter) {
        queryFilter = Sys.Helpers.LdapUtil.FilterAnd(queryFilter, customQueryFilter);
    }
    const vendorQuery = Process.CreateQuery();
    vendorQuery.Reset();
    vendorQuery.SetSpecificTable("AP - Vendors__");
    vendorQuery.SetFilter(queryFilter.toString());
    vendorQuery.SetAttributesList("ComplianceRiskIdentifier__");
    vendorQuery.SetOptions(DBFastAccess | DBDirtyRead);
    vendorQuery.SetOptionEx("Limit=-1");
    const results = [];
    if (vendorQuery.MoveFirst()) {
        const timeoutHelper = Sys.Helpers.TimeoutHelper.GetTimeoutHelper();
        let record = vendorQuery.MoveNextRecord();
        while (record) {
            const recordVars = record.GetVars();
            const thirdPartyId = recordVars.GetValue_String("ComplianceRiskIdentifier__", 0);
            if (results.indexOf(thirdPartyId) < 0) {
                results.push(thirdPartyId);
            }
            record = vendorQuery.MoveNextRecord();
            timeoutHelper.NotifyIteration();
        }
    }
    Log.Info(`Number of third parties to update: ${results.length}`);
    return JSON.stringify(results);
}
function CreateFile(thirdParties) {
    const tempFile = TemporaryFile.CreateFile("json", "utf8");
    TemporaryFile.Append(tempFile, thirdParties);
    Attach.AttachTemporaryFile(tempFile, "ThirdPartiesToUpdate");
}
function RunExtraction() {
    const thirdPartiesToUpdate = GetThirdPartiesToUpdateFromDB();
    CreateFile(thirdPartiesToUpdate);
}
RunExtraction();
//# sourceMappingURL=extractionscript.js.map