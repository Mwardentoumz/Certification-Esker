"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_TABLESNAPSHOTS_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Customization library for table snapshots",
  "versionable": false,
  "require": []
}*/
/**
 * @namespace Lib.Customization.TableSnapshots
 * @description Customization library for table snapshots
 * @see {@link Sys.Process.P2P.TableSnapshot} for the implementation of the table snapshot process.
 */
var Lib;
(function (Lib) {
    var Customization;
    (function (Customization) {
        var TableSnapshots;
        (function (TableSnapshots) {
            /**
             * @method Lib.Customization.TableSnapshots.ExtendSnapshotConfigs
             * @description Allows to add or modify snapshot configurations in the table snapshot process.
             * @param {object} snapshotConfigs The current snapshot configurations defined in the process, where the key is the source name and the value is the configuration object.
             * @return {void}
             * @example
             * ExtendSnapshotConfigs: function (snapshotConfigs)
             * {
             * 		snapshotConfigs["customTableSnapshot"] = {
             * 			sourceId: "customTableSnapshot",
             * 			tableName: "customTableSnapshot__",
             * 			snapshotDate: new Date(),
             * 			columnMappings: [
             *				{ csvColumnIndex: 0, tableFieldName: "BudgetID__", fieldType: "string", isRequired: true },
             *				{ csvColumnIndex: 1, tableFieldName: "CompanyCode__", fieldType: "string" },
             *				{ csvColumnIndex: 2, tableFieldName: "CostCenter__", fieldType: "string" }
             * 			]
             * 		};
             * }
             * In this example, a new snapshot configuration is added for a custom table. The sourceId and tableName are set to "customTableSnapshot" and "customTableSnapshot__" respectively, the snapshotDate is set to the current date, and columnMappings are defined to map CSV columns to table fields.
             * }
             */
            TableSnapshots.ExtendSnapshotConfigs = function (snapshotConfigs) {
            };
        })(TableSnapshots = Customization.TableSnapshots || (Customization.TableSnapshots = {}));
    })(Customization = Lib.Customization || (Lib.Customization = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Customization_TableSnapshots_Sample.js.map