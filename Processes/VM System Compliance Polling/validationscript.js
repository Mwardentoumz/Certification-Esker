"use strict";
/* eslint-disable max-depth */
//Required: Sys/Sys_Helpers_LdapUtil, Sys/Sys_Helpers_TimeoutHelper, Sys/Sys_VM_E_AttestationsServer, Sys/Sys_VM_E_AttestationsHelper, Lib_VendorRegistration_Common, Lib_VM_ComplianceRisk_Server
const ComplianceRisk = {
    eAttestationsServer: null,
    timeoutHelper: null,
    GetReferenceDate(thirdPartyIDs) {
        // DBSET_READONLY | DBSET_QUICK
        const DBFastAccess = 0x00210000;
        // also returns ownershipped records
        const DBDirtyRead = 0x00020000;
        //retrieve the last execution date of the process
        let queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("State", "100"), Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0"));
        const processQuery = Process.CreateQuery();
        processQuery.Reset();
        processQuery.SetSpecificTable("CDNAME#VM System Compliance Polling");
        processQuery.SetAttributesList("SubmitDateTime");
        processQuery.SetFilter(queryFilter.toString());
        processQuery.SetSortOrder("SubmitDateTime DESC");
        processQuery.SetOptions(DBFastAccess | DBDirtyRead);
        processQuery.SetOptionEx("Limit=1");
        processQuery.SetSearchInArchive(true);
        if (processQuery.MoveFirst()) {
            let record = processQuery.MoveNextRecord();
            if (record) {
                const recordVars = record.GetVars();
                if (recordVars) {
                    Log.Info("Reference date computed with last process execution date");
                    return recordVars.GetValue_Date("SubmitDateTime", 0);
                }
            }
        }
        //first time the process is launched, retrieve oldest refresh date
        queryFilter = Sys.Helpers.LdapUtil.FilterIn("Identifier__", thirdPartyIDs);
        const vendorQuery = Process.CreateQuery();
        vendorQuery.Reset();
        vendorQuery.SetSpecificTable("VM - Compliance Vendors Details__");
        vendorQuery.SetAttributesList("LastLocalUpdateDate__");
        vendorQuery.SetFilter(queryFilter.toString());
        vendorQuery.SetSortOrder("LastLocalUpdateDate__ ASC");
        vendorQuery.SetOptions(DBFastAccess | DBDirtyRead);
        vendorQuery.SetOptionEx("Limit=1");
        if (vendorQuery.MoveFirst()) {
            let record = vendorQuery.MoveNextRecord();
            if (record) {
                Log.Info("Reference date computed with the oldest third party update date");
                const recordVars = record.GetVars();
                return recordVars.GetValue_Date("LastLocalUpdateDate__", 0);
            }
        }
        return null;
    },
    GetData(thirdPartyIDs) {
        let results = [];
        if (thirdPartyIDs.length > 0) {
            const dateReference = ComplianceRisk.GetReferenceDate(thirdPartyIDs);
            Log.Info(`Third parties data retrieved from ${dateReference}`);
            const thirdPartiesResult = ComplianceRisk.eAttestationsServer.GetThirdparties(dateReference);
            if (thirdPartiesResult.error) {
                Log.Error(thirdPartiesResult.msg);
                Data.SetValue("State", 200);
                Data.SetValue("ShortStatus", "Error getting third parties from compliance platform");
                return [];
            }
            const thirdParties = thirdPartiesResult.data;
            Log.Info(`Compliance platform returned ${thirdParties.length} third parties with data changes`);
            for (const thirdParty of thirdParties) {
                const thirdpartyId = thirdParty.thirdpartyId.toString();
                if (thirdPartyIDs.indexOf(thirdpartyId) === -1) {
                    continue;
                }
                let foldersResult = ComplianceRisk.eAttestationsServer.SearchThirdPartyFolders(thirdpartyId);
                if (foldersResult.error) {
                    Log.Error(thirdPartiesResult.msg);
                    Data.SetValue("State", 200);
                    Data.SetValue("ShortStatus", `Error getting folders from compliance platform for third party ${thirdpartyId}`);
                    return [];
                }
                if (foldersResult.data.totalElements > 0) {
                    //Determine thirdparty stateLastChangeDate based on folders stateLastChangeDate
                    let stateLastChangeDate = null;
                    foldersResult.data.content.forEach(folder => {
                        //When status is complete, thirdparty.stateLastChangeDate is the most recent folder.stateLastChangeDate
                        if (thirdParty.complete) {
                            let folderDate = new Date(folder.stateLastChangeDate);
                            if (folderDate > stateLastChangeDate) {
                                stateLastChangeDate = folderDate;
                            }
                        }
                        //When status is incomplete, thirdparty.stateLastChangeDate is the oldest folder.stateLastChangeDate among incomplete folders
                        else if (!folder.state) {
                            let folderDate = new Date(folder.stateLastChangeDate);
                            if (!stateLastChangeDate || folderDate < stateLastChangeDate) {
                                stateLastChangeDate = folderDate;
                            }
                        }
                    });
                    thirdParty.stateLastChangeDate = stateLastChangeDate.toISOString().split("T")[0];
                }
                else {
                    Log.Warn(`No folder retrieved for third party ${thirdpartyId}. Last change date on the compliance platform could not be computed`);
                    thirdParty.stateLastChangeDate = null;
                }
                let thirdpartyData = Sys.VM.E_AttestationsHelper.ReturnThirdPartyData(thirdpartyId, { content: thirdParty });
                thirdpartyData.folders = Sys.VM.E_AttestationsHelper.ParseFoldersData(foldersResult.data);
                results.push(thirdpartyData);
                ComplianceRisk.timeoutHelper.NotifyIteration();
            }
        }
        Log.Info(`Number of third parties to update with data changes: ${results.length}`);
        return results;
    }
};
function RunValidation() {
    if (Variable.GetValueAsString("ComplianceRequestDone") !== "true") {
        Lib.VM.ComplianceRisk.Server.LoadConfiguration();
        if (Lib.VM.ComplianceRisk.Server.IsEnabled()) {
            const nbAttach = Attach.GetNbAttach();
            if (nbAttach === 0) {
                return;
            }
            const file = Attach.GetInputFile(nbAttach - 1);
            const thirdPartyIDs = JSON.parse(file.GetContent());
            ComplianceRisk.eAttestationsServer = new Sys.VM.E_AttestationsServer({
                user: Lib.VM.ComplianceRisk.Server.GetComplianceRiskLogin(),
                pwd: Lib.VM.ComplianceRisk.Server.GetComplianceRiskPassword(),
                accountId: Lib.VM.ComplianceRisk.Server.GetComplianceRiskAccountID(),
                env: Lib.VM.ComplianceRisk.Server.GetComplianceRiskEnv()
            });
            ComplianceRisk.timeoutHelper = Sys.Helpers.TimeoutHelper.GetTimeoutHelper();
            const results = ComplianceRisk.GetData(thirdPartyIDs);
            const tempFile = TemporaryFile.CreateFile("json", "utf8");
            TemporaryFile.Append(tempFile, JSON.stringify(results));
            Attach.AttachTemporaryFile(tempFile, "ComplianceData");
            Variable.SetValueAsString("ComplianceRequestDone", "true");
        }
        else {
            Data.SetValue("State", 200);
            Data.SetValue("ShortStatus", "Compliance checks configuration setting is disabled");
        }
    }
}
RunValidation();
//# sourceMappingURL=validationscript.js.map