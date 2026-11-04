"use strict";
function IsDistanceUnit(value) {
    return value === "km" || value === "mi";
}
function UpdateCompanyCodeDerivedValues() {
    const companyCode = Controls.CompanyCode__.GetValue();
    if (!companyCode) {
        Controls.MileageRateUnit__.SetValue("");
        return;
    }
    Lib.P2P.CompanyCodesValue.QueryValues(companyCode)
        .Then((companyCodeValues) => {
        const currency = (companyCodeValues && companyCodeValues.Currency__) || "";
        const configuredDistanceUnit = (companyCodeValues && companyCodeValues.CorporateDistanceUnit__) || "";
        const translatedDistanceUnit = configuredDistanceUnit ? Language.Translate("_" + configuredDistanceUnit) : "";
        if (configuredDistanceUnit && !IsDistanceUnit(configuredDistanceUnit)) {
            Log.Warn("Invalid corporate distance unit configured for mileage company code " + companyCode + ": " + configuredDistanceUnit);
        }
        Controls.MileageRateUnit__.SetValue(currency && IsDistanceUnit(configuredDistanceUnit) ? currency + "/" + translatedDistanceUnit : "");
    })
        .Catch((error) => {
        Log.Error("Unable to load company code units for mileage rate: " + error);
        Controls.MileageRateUnit__.SetValue("");
    });
}
Controls.CompanyCode__.OnChange = UpdateCompanyCodeDerivedValues;
UpdateCompanyCodeDerivedValues();
//# sourceMappingURL=customscript.js.map