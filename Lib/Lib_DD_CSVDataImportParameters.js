"use strict";
/* LIB_DEFINITION{
  "name": "Lib_DD_CSVDataImportParameters",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Lib_CSVDataImportParameters",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Lib_V12.0.566.0"
  ]
}*/
var Lib;
(function (Lib) {
    let DD;
    (function (DD) {
        let CSVDataImportParameters;
        (function (CSVDataImportParameters) {
            CSVDataImportParameters.Parameters = {
                CsvHasHeader: true,
                FileNamePattern: ".*",
                /* possible values:
                 * "full" - if the csv represent the whole content of the table
                 * "incremental" - if the csv represent a subset of the table */
                ReplicationMode: "full",
                ClearTable: false,
                NoDelete: true,
                NoUpdate: false,
                NoInsert: false
            };
            function GetErpId(fileName) {
                //Useless for recipients import
                return "";
            }
            CSVDataImportParameters.GetErpId = GetErpId;
            function GetTableName(fileName) {
                return "ODUSER";
            }
            CSVDataImportParameters.GetTableName = GetTableName;
            function GetMappingFile(tableName) {
                return "mapping_recipients.xml";
            }
            CSVDataImportParameters.GetMappingFile = GetMappingFile;
            function GetJSON() {
                return this.Parameters;
            }
            CSVDataImportParameters.GetJSON = GetJSON;
        })(CSVDataImportParameters = DD.CSVDataImportParameters || (DD.CSVDataImportParameters = {}));
    })(DD = Lib.DD || (Lib.DD = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_DD_CSVDataImportParameters.js.map