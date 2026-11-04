"use strict";
function normalizeCompanyCodes(rawCompanyCodes) {
    if (!Array.isArray(rawCompanyCodes)) {
        return [];
    }
    const companyCodes = [];
    const companyCodeMap = {};
    for (const rawCompanyCode of rawCompanyCodes) {
        if (typeof rawCompanyCode !== "string") {
            continue;
        }
        const companyCode = rawCompanyCode.trim();
        if (!companyCode || companyCodeMap[companyCode]) {
            continue;
        }
        companyCodeMap[companyCode] = true;
        companyCodes.push(companyCode);
    }
    return companyCodes;
}
function getCompanyCodesFromSchedulerParameters() {
    const reportParameter = Variable.GetValueAsString("reportParameter");
    if (!reportParameter) {
        return [];
    }
    try {
        const parsed = JSON.parse(reportParameter);
        const companyCodes = normalizeCompanyCodes(parsed.companyCodesToGenerateEReporting);
        if (companyCodes.length > 0) {
            Log.Info(`Using company codes from scheduler reportParameter: ${companyCodes.join(", ")}`);
        }
        return companyCodes;
    }
    catch (e) {
        let errorMessage = "Unknown error";
        if (e instanceof Error) {
            errorMessage = e.message;
        }
        else if (typeof e === "string") {
            errorMessage = e;
        }
        else {
            errorMessage = Object.prototype.toString.call(e);
        }
        Log.Warn(`Failed to parse reportParameter: ${reportParameter}. Error: ${errorMessage}`);
        return [];
    }
}
function getCompanyCodesFromUserExit() {
    const customizedCompanyCodes = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetEReportingBatchExportCompanyCodes");
    const companyCodes = normalizeCompanyCodes(customizedCompanyCodes);
    if (companyCodes.length > 0) {
        Log.Info(`Using company codes from user exit Lib.AP.Customization.Common.GetEReportingBatchExportCompanyCodes: ${companyCodes.join(", ")}`);
    }
    return companyCodes;
}
function getCompanyCodesFromTable() {
    const companyCodes = [];
    const query = Process.CreateQueryAsProcessAdmin();
    query.Reset();
    query.SetSpecificTable("PurchasingCompanycodes__");
    query.SetAttributesList("CompanyCode__");
    query.SetFilter(Sys.Helpers.LdapUtil.FilterExist("PDPConfiguration__").toString());
    query.SetSortOrder("CompanyCode__ ASC");
    if (query.MoveFirst()) {
        let record = query.MoveNextRecord();
        while (record) {
            const companyCode = record.GetVars().GetValue_String("CompanyCode__", 0);
            if (companyCode) {
                companyCodes.push(companyCode);
            }
            record = query.MoveNextRecord();
        }
    }
    return companyCodes;
}
/**
 * Determines company codes in this priority order:
 * 1) Optional user exit Lib.AP.Customization.Common.GetEReportingBatchExportCompanyCodes
 * 2) Scheduler reportParameter.companyCodesToGenerateEReporting
 * 3) Fallback query on PurchasingCompanycodes__
 */
function getCompanyCodes() {
    const userExitCompanyCodes = getCompanyCodesFromUserExit();
    if (userExitCompanyCodes.length > 0) {
        return userExitCompanyCodes;
    }
    const schedulerCompanyCodes = getCompanyCodesFromSchedulerParameters();
    if (schedulerCompanyCodes.length > 0) {
        return schedulerCompanyCodes;
    }
    const tableCompanyCodes = getCompanyCodesFromTable();
    if (tableCompanyCodes.length > 0) {
        Log.Info(`Using company codes from PurchasingCompanycodes__: ${tableCompanyCodes.join(", ")}`);
    }
    else {
        Log.Warn("No company code found in scheduler parameter, user exit, or PurchasingCompanycodes__.");
    }
    return tableCompanyCodes;
}
function createExportInvoicesForCompanyCode(companyCode, exportTypeCode) {
    const exportProcess = Process.CreateProcessInstance("Export Invoices", false, false, false);
    if (!exportProcess) {
        Log.Error(`Unable to create "Export Invoices" process for company code: ${companyCode} (${exportTypeCode})`);
        return "";
    }
    const vars = exportProcess.GetUninheritedVars();
    vars.AddValue_String("CompanyCode__", companyCode, true);
    vars.AddValue_String("Converter__", "Flux_10_1", true);
    const extVars = exportProcess.GetExternalVars();
    extVars.AddValue_String("SendToPA", "true", true);
    // "IN" = first send of never-exported invoices, "CO" = re-export of already-exported invoices
    // flagged as modified since last export. The child applies this typecode to its whole run.
    extVars.AddValue_String("ExportTypeCode", exportTypeCode, true);
    exportProcess.Process();
    if (exportProcess.GetLastError() !== 0) {
        Log.Error(`"Export Invoices" process creation failed for company code ${companyCode} (${exportTypeCode}): ${exportProcess.GetLastErrorMessage()}`);
        return "";
    }
    return vars.GetValue_String("RuidEx", 0);
}
function run() {
    const companyCodes = getCompanyCodes();
    Log.Info(`Found ${companyCodes.length} company code(s): ${companyCodes.join(", ")}`);
    const createdRuidExes = [];
    for (const companyCode of companyCodes) {
        // One child for the first-send invoices (typecode "IN") and one for the re-exports (typecode "CO").
        for (const exportTypeCode of ["IN", "CO"]) {
            const ruidEx = createExportInvoicesForCompanyCode(companyCode, exportTypeCode);
            if (ruidEx) {
                createdRuidExes.push(ruidEx);
                Log.Info(`Created "Export Invoices" process for company code ${companyCode} (${exportTypeCode}) - RuidEx: ${ruidEx}`);
            }
        }
    }
    Data.SetValue("ChildCreatedCount__", createdRuidExes.length);
    Log.Info(`EReporting Batch Export completed: ${createdRuidExes.length} child process(es) created. RuidExes: ${createdRuidExes.join(", ")}`);
}
run();
//# sourceMappingURL=finalizationscript.js.map