"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_REPORT_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Expense Report scripts on Client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Expense Report Client script customization callbacks
 * @namespace Lib.Expense.Report.Customization.Client
 */
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var Customization;
            (function (Customization) {
                var Client;
                (function (Client) {
                    /**
                     * @namespace Lib.Expense.Report.Customization.Client.CustomFunctions
                     * @description
                     * Allows you to define custom Custom functions which are not user exits
                     * i.e. business functions to be called in client libraries
                     * They can be called the following way Lib.Expense.Report.Customization.Client.CustomFunctions.ExampleName()
                     * @example
                     * <pre><code>
                     * Client.CustomFunctions:
                     * {
                     *		ExampleName: function()
                     *		{
                     *			// Custom function logic here
                     *			return true;
                     *		}
                     * },
                     * </code></pre>
                     */
                    Client.CustomFunctions = {};
                    /**
                     * @method Lib.Expense.Report.Customization.Client.OnLoad
                     * @description
                     * Allows you to customize layout settings of the Expense Report process.
                     * This user exit is called from the HTML Page script of the Expense Report process, before loading the form and determining the workflow.
                     *
                     * This function will be called at the Expense Report loading; just before calling the Start function.
                     * If you return a promise object, we synchronize on it before calling the Start function.
                     *
                     * CLIENT_WEB
                     *
                     * This user exit sets the company code.
                     * @example
                     * <pre><code>
                     * OnLoad: function ()
                     * {
                     * 	// Initialize company code
                     * 	Data.SetValue("CompanyCode__", "US01");
                     * }
                     * </code></pre>
                     */
                    Client.OnLoad = function () {
                    };
                    /**
                     * @method Lib.Expense.Report.Customization.Client.OnWorkflowBuilt
                     * @description
                     * Allows you to customize the behavior after the workflow has been built.
                     * This user exit is called from the HTML Page script of the Expense Report process, after the workflow has been built.
                     * It is also called when the user adds or removes a user manually on the workflow.
                     *
                     * This function will be called at the end of the workflow building process.
                     * Here you can add any custom logic that should be executed after the workflow is built.
                     *
                     * CLIENT_WEB|CLIENT_MOBILE
                     * @example
                     * <pre><code>
                     * OnWorkflowBuilt: function ()
                     * {
                     * 	// Custom logic here
                     * }
                     * </code></pre>
                     */
                    Client.OnWorkflowBuilt = function () {
                    };
                    /**
                     * @method Lib.Expense.Report.Customization.Client.CustomizeLayout
                     * @description
                     * Allows you to customize layout settings of the Expense Report process.
                     * This user exit is called from the HTML Page script of the Expense Report process, after loading the form and determining the workflow.
                     *
                     * This function will be called at the first Expense Report rendering; just after calling the Start function.
                     * Here you declare the OnEvent callbacks and set the initial state (hidden, readonly, etc.) of controls.
                     *
                     * CLIENT_WEB|CLIENT_MOBILE
                     */
                    Client.CustomizeLayout = function () {
                    };
                })(Client = Customization.Client || (Customization.Client = {}));
            })(Customization = Report.Customization || (Report.Customization = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_REPORT_CUSTOMIZATION_CLIENT_SAMPLE.js.map