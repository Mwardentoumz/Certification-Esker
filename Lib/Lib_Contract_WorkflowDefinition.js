"use strict";
/* LIB_DEFINITION{
  "name": "Lib_Contract_WorkflowDefinition",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Contract library",
  "versionable": false,
  "require": [
    "Sys/Sys_P2P_WorkflowDefinition",
    "Sys/Sys_Contract_WorkflowDefinition",
    "Lib_V12.0.566.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    let Contract;
    (function (Contract) {
        let WorkflowDefinition;
        (function (WorkflowDefinition) {
            function AddJSONTo(definitions) {
                definitions.push(Sys.Contract.WorkflowDefinition.GetJSON(8));
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = Contract.WorkflowDefinition || (Contract.WorkflowDefinition = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Contract_WorkflowDefinition.js.map