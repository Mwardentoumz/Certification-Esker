"use strict";
/* LIB_DEFINITION{
  "name": "Lib_Expense_WorkflowDefinition",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Expense library",
  "versionable": false,
  "require": [
    "Sys/Sys_Expense_WorkflowDefinition",
    "Lib_V12.0.566.0"
  ]
}*/
// Common part
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var WorkflowDefinition;
        (function (WorkflowDefinition) {
            function AddJSONTo(definitions) {
                definitions.push(Sys.Expense.WorkflowDefinition.GetJSON(1));
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = Expense.WorkflowDefinition || (Expense.WorkflowDefinition = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Expense_WorkflowDefinition.js.map