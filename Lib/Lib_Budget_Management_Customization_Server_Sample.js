"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "Lib_Budget_Management_Customization_Server_Sample",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Budget Management scripts on SERVER side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Budget common script customization callbacks
 * @namespace Lib.Budget.Management.Customization.Server
 */
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        var Management;
        (function (Management) {
            var Customization;
            (function (Customization) {
                var Server;
                (function (Server) {
                    /**
                     * @method Lib.Budget.Management.Customization.Server.OnExtractionScriptEnd
                     * @description Allows you to perform operations after the budget management process extraction.
                     * This user exit is called at the end of the extraction script.
                     * @since 311
                     * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                     * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                     * @example
                     * <pre><code>
                     *	OnExtractionScriptEnd: function (currentAction, currentName)
                     *	{
                     *		Log.Info("ExtractionScript called with action <" + currentAction + "> (" + currentName + ")");
                     *	};
                     * </code></pre>
                     */
                    Server.OnExtractionScriptEnd = function () {
                    };
                    /**
                     * @method Lib.Budget.Management.Customization.Server.OnValidationScriptEnd
                     * @description Allows you to perform operations after the budget management process validation.
                     * This user exit is called at the end of the validation script.
                     * @since 311
                     * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                     * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                     * @example
                     * <pre><code>
                     *	OnValidationScriptEnd: function (currentAction, currentName)
                     *	{
                     *		Log.Info("ValidationScript called with action <" + currentAction + "> (" + currentName + ")");
                     *	};
                     * </code></pre>
                     */
                    Server.OnValidationScriptEnd = function (currentAction, currentName) {
                    };
                    /**
                     * @method Lib.Budget.Management.Customization.Server.OnExecuteAction
                     * @description Allows you to perform operations before the action starts.
                     * @since 311
                     * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                     * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                     * @example
                     * <pre><code>
                     *	OnExecuteAction: function (currentName)
                     *	{
                     *		Log.Info("ValidationScript will execute action <" + currentName + ">");
                     *	};
                     * </code></pre>
                     */
                    Server.OnExecuteAction = function (currentName) {
                    };
                    /**
                     * @method Lib.Budget.Management.Customization.Server.OnImportCSVLine
                     * @description
                     * This user exit is called for each CSV line during the budget import.
                     * It allows you to decide whether to import the line or set it in error, and you can stop the import or not.
                     * @since 355
                     * @param {string} budgetID Budget ID read from the CSV line.
                     * @param {xRecord | null} budgetRecord Existing budget record matching the budget ID. Null for new budgets.
                     * @param {Object.<string, string>} budgetCSVByHeader CSV values indexed by header name.
                     * @returns {{ inError: boolean, shouldStopImport: boolean | undefined, errorMessage: string | undefined } | void }
                     * Return "{ inError: false }" to import the line.
                     * Return "{ inError: true }" to set the line in error without importing it.
                     * Return "{ inError: true, shouldStopImport: true }" to stop importing the remaining lines.
                     * You can also use "errorMessage" to provide a custom error message.
                     * @example <caption>Error on lines for a specific company code (still continue importing)</caption>
                     * OnImportCSVLine = function (budgetID, budgetRecord, budgetCSVByHeader)
                     * {
                     *     return { inError: budgetCSVByHeader["CompanyCode__"] === "US01" };
                     * };
                     * @example <caption>Stop import when Budget ID is missing a prefix</caption>
                     * OnImportCSVLine = function (budgetID)
                     * {
                     *     if (budgetID.indexOf("BUD-") !== 0)
                     *     {
                     *         return {
                     *             inError: true,
                     *             shouldStopImport: true,
                     *             errorMessage: "Budget ID must start with BUD-"
                     *         };
                     *     }
                     * };
                     */
                    Server.OnImportCSVLine = function (budgetID, budgetRecord, budgetCSVByHeader) {
                    };
                })(Server = Customization.Server || (Customization.Server = {}));
            })(Customization = Management.Customization || (Management.Customization = {}));
        })(Management = Budget.Management || (Budget.Management = {}));
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_BUDGET_MANAGEMENT_CUSTOMIZATION_SERVER_SAMPLE.js.map