"use strict";
/** ***** **/
/** DEBUG **/
/** ***** **/
const g_debug = false;
/** **************** **/
/** Global variables **/
/** **************** **/
const g_apParameters = Sys.Parameters.GetInstance("AP");
function getNowInUserTimezone() {
    const date = new Date();
    const userUtcOffsetVar = Variable.GetValueAsString("userUTCOffSet");
    const timezoneOffsetInMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + timezoneOffsetInMs + parseInt(userUtcOffsetVar, 10));
}
/**
* Determine the current export mode (all invoices, custom selection, differential export
* @return {string} A string containing the export mode
**/
function getExportMode() {
    if (Variable.GetValueAsString("AncestorsRuid")) {
        Controls.SkipInvoicesAlreadyExported__.SetValue(false);
        return "_CustomSelectionFromAdminList";
    }
    return "_NoRestrictions";
}
function removeFlux10_1Fields() {
    let isEReportingEnabled = "0";
    if (this && this.GetQueryValue()) {
        let res = this.GetQueryValue();
        // if one of the configurations has EnableInternationalEReporting__ checked, we consider that it is enabled
        let enableInternationlEReporting;
        for (let i = 0; i < this.GetRecordsCount(); i++) {
            enableInternationlEReporting = res.GetQueryValue("EnableInternationalEReporting__", i);
            if (enableInternationlEReporting === "1") {
                isEReportingEnabled = enableInternationlEReporting;
                break;
            }
        }
    }
    if (isEReportingEnabled === "0" || getExportMode() === "_CustomSelectionFromAdminList") {
        // remove Flux 10.1 output option as company codes of selected invoices are not necessarily the same
        let converterValues = Controls.Converter__.GetAvailableValues();
        converterValues = converterValues.filter(item => item !== "Flux_10_1=_Flux_10_1");
        Controls.Converter__.SetAvailableValues(converterValues);
    }
}
function setInvoicesToExportPaneLayout() {
    if (getExportMode() === "_CustomSelectionFromAdminList") {
        Controls.SkipInvoicesAlreadyExported__.Hide(true);
        Controls.CompanyCode__.Hide(true);
        const ancestors = Variable.GetValueAsString("AncestorsRuid").split("|");
        Controls.InvoicesToExportExplanation__.SetText("_CustomSelectionExportModeExplanation", ancestors.length);
        Controls.Scheduling.Hide(true);
        Controls.SchedulingOptions__.SetReadOnly(true);
        Controls.Then_repeat__.SetReadOnly(true);
    }
    else {
        Controls.InvoicesToExportExplanation__.SetText("_DefaultExportModeExplanation");
        Controls.InvoicesToExportExplanation__.Hide(false);
    }
}
// Layout functions
//Technical fields
function hideTechnicalFields() {
    Controls.InvoicesToExportTempFile__.Hide(!g_debug);
    Controls.InvoicesApprovedTempFile__.Hide(!g_debug);
    Controls.DateOfStartExport__.Hide(!g_debug);
    Controls.LastMsnEx__.Hide(!g_debug);
}
// Configuration mode
function configurationLayout() {
    hideTechnicalFields();
    Controls.ExportedInvoices.Hide(!g_debug);
    Controls.ExportInformation.Hide(!g_debug);
    Controls.ERP.Hide(false);
    Controls.InvoicesToExport.Hide(false);
    Controls.Scheduling.Hide(false);
    Controls.TitleExportedInvoices__.Hide(!g_debug);
    Controls.TitleExportInvoices__.Hide(false);
    Controls.SubTitleExportInvoices__.Hide(false);
    Controls.Export.Hide(false);
    Controls.NumberOfExportedInvoices__.Hide(!g_debug);
    Controls.NumberOfExportedApprovedInvoices__.Hide(!g_debug);
    Controls.NumberOfInvoicesInError__.Hide(true);
    Controls.Cancel.Hide(Controls.ExportStatus__.GetValue() !== "Pending");
    if (Controls.SchedulingOptions__.GetValue() === "Execute now") {
        Controls.SchedulingDate__.SetReadOnly(true);
        Controls.SchedulingHours__.SetReadOnly(true);
        Controls.SchedulingMinutes__.SetReadOnly(true);
    }
    else {
        Controls.SchedulingDate__.SetReadOnly(false);
        Controls.SchedulingHours__.SetReadOnly(false);
        Controls.SchedulingMinutes__.SetReadOnly(false);
    }
    setInvoicesToExportPaneLayout();
    updateSchedulingOptionsLayout();
}
// Result mode
function exportLayout() {
    hideTechnicalFields();
    Controls.ExportedInvoices.Hide(false);
    Controls.ExportInformation.Hide(false);
    Controls.ERP.Hide(!g_debug);
    Controls.InvoicesToExport.Hide(!g_debug);
    Controls.Scheduling.Hide(!g_debug);
    Controls.TitleExportedInvoices__.Hide(false);
    Controls.TitleExportInvoices__.Hide(!g_debug);
    Controls.SubTitleExportInvoices__.Hide(!g_debug);
    Controls.Export.Hide(!g_debug);
    Controls.NumberOfExportedInvoices__.Hide(false);
    Controls.NumberOfExportedApprovedInvoices__.Hide(false);
    if (Controls.NumberOfInvoicesInError__.GetValue() > 0) {
        Controls.NumberOfInvoicesInError__.Hide(false);
    }
    else {
        Controls.NumberOfInvoicesInError__.Hide(true);
    }
    Controls.Cancel.Hide(true);
}
function SetErrorInThePast() {
    const today = getNowInUserTimezone();
    const SelectedDate = Controls.SchedulingDate__.GetValue();
    if (SelectedDate) {
        SelectedDate.setHours(parseInt(Controls.SchedulingHours__.GetValue().substr(0, 2), 10));
        SelectedDate.setMinutes(parseInt(Controls.SchedulingMinutes__.GetValue(), 10));
        if (today < SelectedDate) {
            Data.SetError("SchedulingDate__", "");
        }
        else {
            Data.SetError("SchedulingDate__", "_The_date_is_in_the_past");
        }
    }
}
function SetErrorStartDateEndDate() {
    const today = Sys.Helpers.Date.Date2DBDate(new Date());
    const startDate = Sys.Helpers.Date.Date2DBDate(Controls.ExportStartDate__.GetValue());
    const endDate = Sys.Helpers.Date.Date2DBDate(Controls.ExportEndDate__.GetValue());
    Data.SetError("ExportStartDate__", "");
    Data.SetError("ExportEndDate__", "");
    if (startDate || endDate) {
        if (today < startDate) {
            Data.SetError("ExportStartDate__", "_The_start_date_is_in_the_future");
            if (endDate && startDate > endDate) {
                Data.SetError("ExportEndDate__", "_The_end_date_is_before_start_date");
            }
        }
        else if (startDate && endDate && startDate > endDate) {
            Data.SetError("ExportStartDate__", "_The_start_date_is_after_end_date");
            Data.SetError("ExportEndDate__", "_The_end_date_is_before_start_date");
        }
        if (today < endDate) {
            Data.SetError("ExportEndDate__", "_The_end_date_is_in_the_future");
        }
    }
}
function SetErrorEmptyCompanyCodeForFlow10() {
    const isFlux10 = Controls.Converter__.GetValue() === "Flux_10_1";
    const companyCodeData = Data.GetValue("CompanyCode__");
    if (isFlux10 && !companyCodeData) {
        Controls.CompanyCode__.SetError("This field is required!");
    }
}
function intDivisionByTen(minutes) {
    const newMinutes = Math.floor(parseInt(minutes, 10) / 10).toString();
    // multiply by ten by adding 0 at end;
    return newMinutes + "0";
}
function updateSchedulingOptionsLayout() {
    if (Controls.SchedulingOptions__.GetValue() === "Execute now") {
        Controls.SchedulingDate__.Hide(true);
        Controls.SchedulingHours__.Hide(true);
        Controls.SchedulingMinutes__.Hide(true);
        Controls.SchedulingDate__.SetRequired(false);
        Controls.SchedulingDate__.SetReadOnly(true);
        Controls.SchedulingHours__.SetReadOnly(true);
        Controls.SchedulingMinutes__.SetReadOnly(true);
        Controls.Export.SetLabel("Export now");
        if (Controls.Then_repeat__.GetValue() === "Never") {
            Controls.ExportEndDate__.Hide(false);
            Controls.ExportStartDate__.Hide(false);
            Controls.ExportEndDate__.SetReadOnly(false);
            Controls.ExportStartDate__.SetReadOnly(false);
        }
        else {
            Controls.ExportEndDate__.Hide(true);
            Controls.ExportStartDate__.Hide(true);
            Controls.ExportEndDate__.SetReadOnly(true);
            Controls.ExportStartDate__.SetReadOnly(true);
        }
    }
    else {
        let date = null;
        if (Controls.ExportDateTime__.GetValue()) {
            date = Controls.ExportDateTime__.GetValue();
            Controls.SchedulingMinutes__.SetValue(intDivisionByTen(date.getMinutes()));
        }
        else if (!Controls.SchedulingDate__.GetValue()) {
            date = getNowInUserTimezone();
            // Add one hour
            date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1, date.getMinutes());
            Controls.SchedulingMinutes__.SetValue("00");
        }
        if (date) {
            Controls.SchedulingDate__.SetValue(date);
            let Hours = date.getHours();
            Hours = Hours + "";
            if (Hours.length === 1) {
                Hours = "0" + Hours;
            }
            Controls.SchedulingHours__.SetValue(Hours + "OClock");
        }
        Controls.ExportEndDate__.Hide(true);
        Controls.ExportStartDate__.Hide(true);
        Controls.SchedulingDate__.Hide(false);
        Controls.SchedulingHours__.Hide(false);
        Controls.SchedulingMinutes__.Hide(false);
        Controls.ExportEndDate__.SetReadOnly(true);
        Controls.ExportStartDate__.SetReadOnly(true);
        Controls.SchedulingDate__.SetRequired(true);
        Controls.SchedulingDate__.SetReadOnly(false);
        Controls.SchedulingHours__.SetReadOnly(false);
        Controls.SchedulingMinutes__.SetReadOnly(false);
        if (Controls.ExportStatus__.GetValue() === "Pending") {
            Controls.Export.SetLabel("Update configuration");
        }
        else {
            Controls.Export.SetLabel("Schedule Export");
        }
    }
}
function OnConverterChange() {
    let isFlux10 = Controls.Converter__.GetValue() === "Flux_10_1";
    Controls.Payment_release_output_format__.Hide(isFlux10);
    Controls.CompanyCode__.SetRequired(isFlux10);
}
Controls.SchedulingDate__.OnChange = SetErrorInThePast;
Controls.SchedulingHours__.OnChange = SetErrorInThePast;
Controls.SchedulingMinutes__.OnChange = SetErrorInThePast;
Controls.SchedulingOptions__.OnChange = updateSchedulingOptionsLayout;
Controls.Then_repeat__.OnChange = updateSchedulingOptionsLayout;
Controls.ExportEndDate__.OnChange = SetErrorStartDateEndDate;
Controls.ExportStartDate__.OnChange = SetErrorStartDateEndDate;
Controls.Converter__.OnChange = OnConverterChange;
Controls.Export.OnClick = function () {
    SetErrorInThePast();
    SetErrorStartDateEndDate();
    SetErrorEmptyCompanyCodeForFlow10();
    return !Process.ShowFirstError();
};
// RUN PART
function run() {
    Variable.SetValueAsString("CurrentUserId", User.loginId);
    Variable.SetValueAsString("userUTCOffSet", User.utcOffset);
    if (["Completed", "Error", "InProgress"].indexOf(Controls.ExportStatus__.GetValue()) !== -1) {
        exportLayout();
    }
    else {
        Query.DBQuery(removeFlux10_1Fields, "AP - Application Settings__", "EnableInternationalEReporting__", "", "", 50);
        configurationLayout();
    }
}
run();
//# sourceMappingURL=customscript.js.map