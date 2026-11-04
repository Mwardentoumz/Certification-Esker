"use strict";
/* LIB_DEFINITION{
  "name": "Lib_Purchasing_OC_WorkflowDefinition",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Purchasing OC library",
  "versionable": false,
  "require": [
    "Sys/Sys_Purchasing_OC_WorkflowDefinition"
  ]
}*/
var Lib;
(function (Lib) {
    let Purchasing;
    (function (Purchasing) {
        let OC;
        (function (OC) {
            let WorkflowDefinition;
            (function (WorkflowDefinition) {
                function AddJSONTo(definitions) {
                    definitions.push(Sys.Purchasing.OC.WorkflowDefinition.GetJSON());
                }
                WorkflowDefinition.AddJSONTo = AddJSONTo;
            })(WorkflowDefinition = OC.WorkflowDefinition || (OC.WorkflowDefinition = {}));
        })(OC = Purchasing.OC || (Purchasing.OC = {}));
    })(Purchasing = Lib.Purchasing || (Lib.Purchasing = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Purchasing_OC_WorkflowDefinition.js.map