"use strict";
/* Remittance Advise page script */
function run() {
    Controls.DownloadCrystalReportsDataFile.OnClick = function () {
        const templateInfos = Lib.Purchasing.RA.Export.GetTemplateInfos();
        if (templateInfos.fileFormat === "RPT") {
            Process.OpenPreview({
                "conversionType": "crystal",
                "templateName": templateInfos.template,
                "language": templateInfos.escapedCompanyCode,
                "outputFormat": "mdb",
                "data": function (fnDataBuildDone) {
                    Lib.Purchasing.RA.Export.CreateJsonString(templateInfos, function (jsonString) {
                        fnDataBuildDone(jsonString);
                    });
                }
            });
        }
        return false;
    };
    Lib.CommonDialog.NextAlert.Show({});
    Controls.Line_items.Hide(true);
    Controls.form_content_top.Hide(true);
}
run();
//# sourceMappingURL=customscript.js.map