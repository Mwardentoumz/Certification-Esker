"use strict";
Lib.P2P.Address.SetFormattedAddressControl(Controls.CompanyAddress__);
function OnSave() {
    const companyCode = Controls.CompanyCode__.GetValue();
    if (companyCode) {
        const options = {
            table: Process.GetName(),
            filter: `(&(CompanyCode__=${companyCode})(!(MSNEX=${Data.GetValue("MSNEX")})))`,
            attributes: ["CompanyCode__"],
            maxRecords: 1,
            additionalOptions: {
                queryOptions: "FastSearch=1"
            }
        };
        Sys.GenericAPI.PromisedQuery(options).Then(function (results) {
            if (results.length > 0) {
                Controls.CompanyCode__.SetError("_errorExistingCompanyCode");
                Process.ShowFirstError();
            }
            else {
                ProcessInstance.SaveAndQuit("Save");
            }
        });
    }
    else {
        Process.ShowFirstError();
    }
    return false;
}
function eReportingFieldsDisplay() {
    const hasEReportingEnabled = this && this.GetQueryValue() && this.GetRecordsCount() > 0;
    Controls.TaxMode__.Hide(!hasEReportingEnabled);
    Controls.PDPConfiguration__.Hide(!hasEReportingEnabled);
}
const eReportingFilter = Sys.Helpers.LdapUtil.FilterEqual("EnableInternationalEReporting__", "1").toString();
Query.DBQuery(eReportingFieldsDisplay, "AP - Application Settings__", "EnableInternationalEReporting__", eReportingFilter, "", 1);
Controls.CompanyCode__.SetRequired(true);
Controls.Sub__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.Street__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.PostalCode__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.Country__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.Region__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.City__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.PostOfficeBox__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.Save.OnClick = OnSave;
Lib.P2P.Address.ComputeFormattedAddress();
Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
//# sourceMappingURL=customscript.js.map