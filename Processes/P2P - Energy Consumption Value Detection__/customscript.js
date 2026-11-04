"use strict";
function run() {
    let filter = Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Controls.CompanyCode__.GetValue()).toString();
    let companyCodeConfiguration = "Default";
    let conversionFactorSource = "";
    Sys.GenericAPI.Query("PurchasingCompanycodes__", filter, ["DefaultConfiguration__"], function (result, error) {
        if (!error && result && result.length > 0) {
            companyCodeConfiguration = result[0].DefaultConfiguration__;
        }
        if (!companyCodeConfiguration) {
            companyCodeConfiguration = "Default";
        }
        filter = Sys.Helpers.LdapUtil.FilterEqual("ConfigurationName__", companyCodeConfiguration).toString();
        Sys.GenericAPI.Query("AP - Application Settings__", filter, ["GHGConversionFactorSource__"], function (result, error) {
            if (!error && result && result.length > 0) {
                conversionFactorSource = result[0].GHGConversionFactorSource__;
            }
            let browseDataSource = "";
            let savedColumn = "";
            let displayColumn = "";
            filter = "";
            let attributes = "";
            switch (conversionFactorSource) {
                case "Ademe":
                    browseDataSource = "S2P - GHG Emissions - Ademe Conversion Factor__";
                    savedColumn = "UnitOfMeasure__";
                    displayColumn = "CategoryCode__|BaseName__|AttributeName__|GeographicalLocalization__|GHGConversionFactor__";
                    filter = "(LineType__=Elément)(ElementType__=Facteur d'émission)(ElementStatus__=Valide générique)";
                    attributes = "ElementIdentifier__|GHGConversionFactor__";
                    break;
                case "Defra":
                    browseDataSource = "S2P - GHG Emissions - Defra Conversion Factor__";
                    savedColumn = "UnitOfMeasure__";
                    displayColumn = "Category__|ColumnText__|GHGConversionFactor__";
                    filter = "(!(Scope__=))(GHGPerUnit__=kg CO2e)";
                    attributes = "ElementIdentifier__|GHGConversionFactor__";
                    break;
                case "Internal":
                default:
                    browseDataSource = "P2P - UnitOfMeasureCarbonFootprint__";
                    savedColumn = "UnitOfMeasure__";
                    displayColumn = "UnitOfMeasure__|GHGConversionFactor__|Description__";
                    filter = "(|(CompanyCode__=%[CompanyCode__])(CompanyCode__=)(!(CompanyCode__=*)))";
                    attributes = "GHGConversionFactor__";
                    break;
            }
            ProcessInstance.SetSilentChange(true);
            Controls.UnitOfMeasure__.SetDataSource(browseDataSource);
            Controls.UnitOfMeasure__.SetSavedColumn(savedColumn);
            Controls.UnitOfMeasure__.SetDisplayedColumns(displayColumn);
            Controls.UnitOfMeasure__.SetAttributes(attributes);
            Controls.UnitOfMeasure__.SetFilter(filter);
            ProcessInstance.SetSilentChange(false);
        });
    });
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
}
run();
Controls.CompanyCode__.OnChange = run;
//# sourceMappingURL=customscript.js.map