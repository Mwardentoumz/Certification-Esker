"use strict";
// DBSET_READONLY | DBSET_QUICK
const DB_FAST_ACCESS = 0x00210000;
// also returns owned records
const DB_DIRTY_READ = 0x00020000;
// Number of records to update in a single batch when deactivating vendors
const VENDOR_UPDATE_BATCH_SIZE = 200;
// Below this threshold, vendor filters are pushed to the DB-level activity query to reduce scanned rows.
// Above it, a date-only query is used.
const ACTIVITY_VENDOR_FILTER_THRESHOLD = 200;
function getVendorKey(vendor) {
    return `${vendor.companyCode}|${vendor.vendorNumber}`;
}
function getGlobalParameter(paramName, defaultValue) {
    return Sys.Parameters.GetInstance("P2P").GetParameter(paramName, defaultValue);
}
function isFeatureEnabled() {
    return getGlobalParameter("EnableAutomaticSuppliersDeactivation", "0") === "1";
}
function getInactivityThresholdMonths() {
    const value = getGlobalParameter("NumberOfMonthsForAutomaticDeactivation", "0");
    return Number.parseInt(value, 10) || 0;
}
function computeCutoffDate(monthsBack) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
}
function deactivateVendor(vendorRecord, numberOfMonths) {
    const vars = vendorRecord.GetVars();
    const comment = Language.Translate(`_AutomaticSupplierDeactivation`, false, numberOfMonths);
    vars.AddValue_String("LifeCycleStatusCode__", Lib.P2P.VendorLifeCycleStatus.DISABLED, true);
    vars.AddValue_String("LifeCycleComment__", comment, true);
    vars.AddValue_Date("LastLifeCycleStatusChangeDate__", new Date(), true);
    vendorRecord.Commit();
    if (vendorRecord.GetLastError()) {
        const vendorNumber = vars.GetValue_String("Number__", 0);
        const companyCode = vars.GetValue_String("CompanyCode__", 0);
        const vendorLabel = companyCode ? `${vendorNumber} / ${companyCode}` : vendorNumber;
        Log.Error(`Failed to deactivate vendor ${vendorLabel}: ${vendorRecord.GetLastError()}`);
    }
}
function initializeVendorChangeDate(vendorsToUpdate) {
    if (vendorsToUpdate.length === 0) {
        Log.Info("All vendors have LastLifeCycleStatusChangeDate__ initialized.");
        return;
    }
    Log.Info(`${vendorsToUpdate.length} vendors found without LastLifeCycleStatusChangeDate__. Initializing this field to today for these vendors.`);
    // Update collected vendors in batches
    for (let startIndex = 0; startIndex < vendorsToUpdate.length; startIndex += VENDOR_UPDATE_BATCH_SIZE) {
        const batch = vendorsToUpdate.slice(startIndex, startIndex + VENDOR_UPDATE_BATCH_SIZE);
        const vendorFilter = batch.map(vendor => Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", vendor.vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", vendor.companyCode)));
        const updateQuery = Process.CreateQueryAsProcessAdmin();
        updateQuery.SetSpecificTable("AP - Vendors__");
        updateQuery.SetFilter(Sys.Helpers.LdapUtil.FilterOr(...vendorFilter).toString());
        updateQuery.SetAttributesList("CompanyCode__,Number__,LastLifeCycleStatusChangeDate__");
        if (!updateQuery.MoveFirst()) {
            Log.Error(`Failed to retrieve vendors to initialize for batch starting at index ${startIndex}.`);
            continue;
        }
        let vendorRecord = updateQuery.MoveNextRecord();
        while (vendorRecord) {
            const vars = vendorRecord.GetVars();
            vars.AddValue_Date("LastLifeCycleStatusChangeDate__", new Date(), true);
            vendorRecord.Commit();
            if (vendorRecord.GetLastError()) {
                const vendorNumber = vars.GetValue_String("Number__", 0);
                const companyCode = vars.GetValue_String("CompanyCode__", 0);
                const vendorLabel = companyCode ? `${vendorNumber} / ${companyCode}` : vendorNumber;
                Log.Error(`Failed to initialize LastLifeCycleStatusChangeDate__ for vendor ${vendorLabel}: ${vendorRecord.GetLastError()}`);
            }
            vendorRecord = updateQuery.MoveNextRecord();
        }
    }
}
function deactivateVendors(vendorRecords, numberOfMonths) {
    for (let startIndex = 0; startIndex < vendorRecords.length; startIndex += VENDOR_UPDATE_BATCH_SIZE) {
        const batch = vendorRecords.slice(startIndex, startIndex + VENDOR_UPDATE_BATCH_SIZE);
        let vendorFilter = batch.map(vendor => Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", vendor.vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", vendor.companyCode)));
        const vendorQuery = Process.CreateQueryAsProcessAdmin();
        vendorQuery.SetSpecificTable("AP - Vendors__");
        vendorQuery.SetFilter(Sys.Helpers.LdapUtil.FilterOr(...vendorFilter).toString());
        vendorQuery.SetAttributesList("CompanyCode__,Number__,LifeCycleStatusCode__,LifeCycleComment__,LastLifeCycleStatusChangeDate__");
        if (!vendorQuery.MoveFirst()) {
            Log.Error(`Failed to retrieve vendors to deactivate for batch starting at index ${startIndex}.`);
            continue;
        }
        let vendorRecord = vendorQuery.MoveNextRecord();
        while (vendorRecord) {
            deactivateVendor(vendorRecord, numberOfMonths);
            vendorRecord = vendorQuery.MoveNextRecord();
        }
    }
}
function getAllCandidatesVendors(cutoffDateStr) {
    const vendorFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterNotEqual("LifeCycleStatusCode__", Lib.P2P.VendorLifeCycleStatus.DISABLED), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterLesserOrEqual("LastLifeCycleStatusChangeDate__", cutoffDateStr), Sys.Helpers.LdapUtil.FilterNotExist("LastLifeCycleStatusChangeDate__")));
    const vendorQuery = Process.CreateQueryAsProcessAdmin();
    vendorQuery.SetSpecificTable("AP - Vendors__");
    vendorQuery.SetFilter(vendorFilter.toString());
    vendorQuery.SetAttributesList("CompanyCode__,Number__,LastLifeCycleStatusChangeDate__");
    vendorQuery.SetOptions(DB_FAST_ACCESS | DB_DIRTY_READ);
    vendorQuery.SetOptionEx("FastSearch=1");
    vendorQuery.SetOptionEx("Limit=-1");
    if (!vendorQuery.MoveFirst()) {
        Log.Info("No active or blocked vendors found.");
        return [];
    }
    let vendorRecord = vendorQuery.MoveNextRecord();
    const vendors = [];
    const vendorsToInitialize = [];
    // First pass: collect identifiers only (no record references kept across cursor moves)
    while (vendorRecord) {
        const vars = vendorRecord.GetVars();
        const companyCode = vars.GetValue_String("CompanyCode__", 0);
        const vendorNumber = vars.GetValue_String("Number__", 0);
        if (vars.GetValue_Date("LastLifeCycleStatusChangeDate__", 0)) {
            vendors.push({ companyCode, vendorNumber });
        }
        else {
            vendorsToInitialize.push({ companyCode, vendorNumber });
        }
        vendorRecord = vendorQuery.MoveNextRecord();
    }
    // Second pass: initialize LastLifeCycleStatusChangeDate__ in batches using separate queries
    initializeVendorChangeDate(vendorsToInitialize);
    Log.Info(`${vendors.length} vendors to check for inactivity.`);
    return vendors;
}
function getVendorsWithRecentActivity(candidates, cutoffDateStr, tableToCheck) {
    const dateFilter = Sys.Helpers.LdapUtil.FilterGreaterOrEqual("SubmitDateTime", cutoffDateStr);
    let filter;
    if (candidates.length <= ACTIVITY_VENDOR_FILTER_THRESHOLD) {
        // Small candidate set: push vendor filtering to the DB to avoid a full table scan.
        const vendorFilters = candidates.map(vendor => Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendor.vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", vendor.companyCode)));
        filter = Sys.Helpers.LdapUtil.FilterAnd(dateFilter, Sys.Helpers.LdapUtil.FilterOr(...vendorFilters));
    }
    else {
        // Large candidate set: date-only filter at the DB level, vendor membership checked in memory.
        filter = dateFilter;
    }
    const invoicesQuery = Process.CreateQueryAsProcessAdmin();
    invoicesQuery.SetSpecificTable(tableToCheck);
    invoicesQuery.SetFilter(filter.toString());
    invoicesQuery.SetAttributesList("VendorNumber__,CompanyCode__");
    invoicesQuery.SetGroupBy("CompanyCode__,VendorNumber__");
    invoicesQuery.SetOptionEx("FastSearch=1");
    invoicesQuery.SetOptionEx("DONOTGETLOCALDBFILES=1");
    invoicesQuery.SetSearchInArchive(true);
    invoicesQuery.SetOptionEx("Limit=-1");
    if (!invoicesQuery.MoveFirst()) {
        Log.Info("No vendors with recent activity found.");
        return {};
    }
    const vendorsWithRecentActivity = {};
    let invoiceRecord = invoicesQuery.MoveNextRecord();
    while (invoiceRecord) {
        const vars = invoiceRecord.GetVars();
        const vendorWithActivity = {
            companyCode: vars.GetValue_String("CompanyCode__", 0),
            vendorNumber: vars.GetValue_String("VendorNumber__", 0)
        };
        vendorsWithRecentActivity[getVendorKey(vendorWithActivity)] = true;
        invoiceRecord = invoicesQuery.MoveNextRecord();
    }
    return vendorsWithRecentActivity;
}
function extractVendorsToDeactivate(vendors, vendorsWithRecentActivityLookup) {
    const vendorsToDeactivate = [];
    vendors.forEach(vendor => {
        if (!vendorsWithRecentActivityLookup[getVendorKey(vendor)]) {
            vendorsToDeactivate.push(vendor);
        }
    });
    return vendorsToDeactivate;
}
function getVendorWithoutRecentActivity(vendors, cutoffDateStr, tableToCheck) {
    const vendorsWithRecentActivityLookup = getVendorsWithRecentActivity(vendors, cutoffDateStr, tableToCheck);
    const vendorsWithRecentActivityCount = Object.keys(vendorsWithRecentActivityLookup).length;
    if (vendorsWithRecentActivityCount === vendors.length) {
        Log.Info("All vendors have recent activity. No deactivation needed.");
        return [];
    }
    if (vendorsWithRecentActivityCount === 0) {
        return vendors;
    }
    return extractVendorsToDeactivate(vendors, vendorsWithRecentActivityLookup);
}
function run() {
    Log.Info("Starting automatic supplier deactivation process.");
    // Make sure the functionality is enabled
    if (!isFeatureEnabled()) {
        Log.Warn("Automatic supplier deactivation is disabled.");
        return;
    }
    // Get the number of months required to consider a supplier as inactive
    const numberOfMonths = getInactivityThresholdMonths();
    if (!numberOfMonths || numberOfMonths <= 0) {
        Log.Warn("NumberOfMonthsForAutomaticDeactivation is not set or invalid. Skipping deactivation.");
        return;
    }
    // Determine the date before which a supplier is considered as inactive
    const cutoffDate = computeCutoffDate(numberOfMonths);
    const cutoffDateStr = Sys.Helpers.Date.Date2DBDate(cutoffDate);
    Log.Info(`Deactivation threshold: ${numberOfMonths} months. Cutoff date: ${cutoffDateStr}`);
    // Get all non-disabled suppliers whose LCM status was last changed before the cutoff date
    let vendors = getAllCandidatesVendors(cutoffDateStr);
    if (vendors.length === 0) {
        Log.Info("No vendors found for deactivation.");
        return;
    }
    vendors = getVendorWithoutRecentActivity(vendors, cutoffDateStr, "CDNAME#Vendor invoice");
    if (vendors.length === 0) {
        Log.Info("No vendors found for deactivation after invoice activity check.");
        return;
    }
    vendors = getVendorWithoutRecentActivity(vendors, cutoffDateStr, "CDNAME#Purchase order V2");
    if (vendors.length === 0) {
        Log.Info("No vendors found for deactivation after invoice and purchase order activity check.");
        return;
    }
    Log.Info(`${vendors.length} vendors found for deactivation after activity checks. Proceeding with deactivation.`);
    deactivateVendors(vendors, numberOfMonths);
}
run();
//# sourceMappingURL=finalizationscript.js.map