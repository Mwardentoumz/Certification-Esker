"use strict";
var CustomScript;
(function (CustomScript) {
    let AccrualReportStatus;
    (function (AccrualReportStatus) {
        AccrualReportStatus["Draft"] = "Draft";
        AccrualReportStatus["Computed"] = "Computed";
        AccrualReportStatus["ComputeTimeout"] = "ComputeTimeout";
        AccrualReportStatus["ComputedAndExpired"] = "ComputedAndExpired";
        AccrualReportStatus["Exported"] = "Exported";
        AccrualReportStatus["Integrated"] = "Integrated";
        AccrualReportStatus["IntegrationFailed"] = "IntegrationFailed";
    })(AccrualReportStatus = CustomScript.AccrualReportStatus || (CustomScript.AccrualReportStatus = {}));
    // Layout functions
    function adjustLayout() {
        const accrualReportStatus = Data.GetValue("AccrualReportStatus__");
        const isDraft = accrualReportStatus === AccrualReportStatus.Draft;
        const isComputed = accrualReportStatus === AccrualReportStatus.Computed;
        const isComputedAndExpired = accrualReportStatus === AccrualReportStatus.ComputedAndExpired;
        const isExported = accrualReportStatus === AccrualReportStatus.Exported || accrualReportStatus === AccrualReportStatus.Integrated || accrualReportStatus === AccrualReportStatus.IntegrationFailed;
        // Draft dependant fields
        Controls.Compute.Hide(!isDraft);
        Controls.DocumentsPanel.Hide(isDraft);
        Controls.ComputationDateTime__.Hide(isDraft);
        // Computed dependant fields
        Controls.ExportERP.Hide(!(isComputed || isDraft) || isComputedAndExpired);
        Controls.AccrualEndDate__.SetReadOnly(!isDraft);
        Controls.AccrualCompanyCode__.SetReadOnly(!isDraft);
        // ERP Ack dependant fields
        Controls.ERPExportDataPane.Hide(!isExported);
        Controls.ExportDate__.Hide(!isExported);
        Controls.ExportERP.SetLabel(isDraft ? "_ComputeExportERP" : "_ExportERP");
        const ERPID = Data.GetValue("ERPID__");
        Controls.ERPID__.Hide(Sys.Helpers.IsEmpty(ERPID));
        if (!Sys.Helpers.IsEmpty(Data.GetValue("ERPPostingError__"))) {
            Data.SetError("AccrualReportStatus__", Data.GetValue("ERPPostingError__"));
        }
        // Expired fields
        handleExpiredWarningBanner(isComputedAndExpired);
    }
    function handleExpiredWarningBanner(isComputedAndExpired) {
        const warningPaneHandler = Lib.P2P.TopMessageWarning(Controls.WarningPane, Controls.WarningMessage__);
        if (isComputedAndExpired) {
            warningPaneHandler.Add(Language.Translate("_ComputedReportExpiredWarningMessage"));
        }
        warningPaneHandler.Display();
    }
    function isDataValidate() {
        const formattedAccrualDate = Data.GetValue("AccrualEndDate__");
        const accrualCompanyCode = Data.GetValue("AccrualCompanyCode__");
        return !!formattedAccrualDate && !!accrualCompanyCode;
    }
    function checkForm(callback) {
        if (isDataValidate()) {
            callback();
        }
        else {
            Controls.AccrualEndDate__.Focus();
            Controls.AccrualCompanyCode__.Focus();
        }
    }
    function checkDuplicateReports() {
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("AccrualCompanyCode__", Controls.AccrualCompanyCode__.GetValue()), Sys.Helpers.LdapUtil.FilterEqual("AccrualEndDate__", Sys.Helpers.Date.Date2DBDate(Controls.AccrualEndDate__.GetValue())), Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0"), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("AccrualReportStatus__", AccrualReportStatus.Exported), Sys.Helpers.LdapUtil.FilterEqual("AccrualReportStatus__", AccrualReportStatus.Integrated)));
        const customFilter = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Accrual.CustomizeFilterDuplicateReport");
        const queryParams = {
            table: "CDNAME#DetailedAccrualReportLauncher",
            filter: customFilter !== null && customFilter !== void 0 ? customFilter : filter,
            attributes: ["ruidex"],
            maxRecords: 1,
            additionalOptions: {
                queryOptions: "FastSearch=1"
            }
        };
        return Sys.GenericAPI.PromisedQuery(queryParams);
    }
    CustomScript.checkDuplicateReports = checkDuplicateReports;
    function forceExport() {
        ProcessInstance.ApproveAsynchronous("ExportToERP");
    }
    function showDuplicateWarning() {
        Popup.Confirm("_DuplicateWarningMessage", "warn", forceExport, null, "_DuplicateWarningTitle");
    }
    function handleDuplicate(result) {
        if (result && result.length > 0) {
            showDuplicateWarning();
        }
        else {
            ProcessInstance.ApproveAsynchronous("ExportToERP");
        }
    }
    function onClickCompute() {
        checkForm(() => ProcessInstance.ApproveAsynchronous("Compute"));
        return false;
    }
    function onClickExportToERP() {
        checkForm(() => {
            if (Data.GetValue("AccrualReportStatus__") === AccrualReportStatus.Computed || Data.GetValue("AccrualReportStatus__") === AccrualReportStatus.Draft) {
                CustomScript.checkDuplicateReports()
                    .then(handleDuplicate)
                    .catch(error => {
                    Log.Error(`Could not check duplicate: ${error.toString()}`);
                });
            }
            else {
                Log.Warn("The report cannot be exported with the process in this state");
            }
        });
        return false;
    }
    CustomScript.onClickExportToERP = onClickExportToERP;
    // RUN PART
    function run() {
        adjustLayout();
        Controls.Compute.OnClick = onClickCompute;
        Controls.ExportERP.OnClick = onClickExportToERP;
    }
    CustomScript.run = run;
})(CustomScript || (CustomScript = {}));
CustomScript.run();
//# sourceMappingURL=customscript.js.map