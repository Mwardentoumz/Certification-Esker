"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_EMPLOYEETRANSACTIONS_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Employee Transactions scripts on Client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Employee Transactions scripts customization callbacks
 * @namespace Lib.Expense.EmployeeTransactions.Customization.Client
 */
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var EmployeeTransactions;
        (function (EmployeeTransactions) {
            var Customization;
            (function (Customization) {
                var Client;
                (function (Client) {
                    /**
                     * @method Lib.Expense.EmployeeTransactions.Customization.Client.CustomizeLayout
                     * @description
                     * CLIENT_WEB
                     * Allows you to customize layout settings of the Employee Transactions process.
                     * This user exit is called from the HTML Page script of the Employee Transactions process, after loading the form and determining the workflow.
                     *
                     * This function will be called at the first Employee Transactions rendering; just after calling the InitLayout function.
                     * Here you can declare custom OnEvent callbacks and set the initial state (hidden, readonly, etc.) of controls in the transaction table.
                     * @since 338
                     * @example
                     * This user exit hides the local amount and billing currency columns in the Employee Transactions table.
                     * <pre><code>
                     * CustomizeLayout: function ()
                     * {
                     *	 // Hide local amount and currency columns
                     *	 Controls.TransactionItems__.LocalAmount__.Hide(true);
                     *	 Controls.TransactionItems__.LocalAmountCurrency__.Hide(true);
                     *
                     *	 // Hide billing amount and currency columns
                     *	 Controls.TransactionItems__.BillingAmount__.Hide(true);
                     *	 Controls.TransactionItems__.BillingAmountCurrency__.Hide(true);
                     *
                     *	 // Example: Show/hide columns based on company code
                     *	 if (Data.GetValue("CompanyCode__") === "US01")
                     *	 {
                     *		 Controls.TransactionItems__.LocalAmount__.Hide(false);
                     *		 Controls.TransactionItems__.LocalAmountCurrency__.Hide(false);
                     *	 }
                     * }
                     * </code></pre>
                     */
                    Client.CustomizeLayout = function () {
                    };
                })(Client = Customization.Client || (Customization.Client = {}));
            })(Customization = EmployeeTransactions.Customization || (EmployeeTransactions.Customization = {}));
        })(EmployeeTransactions = Expense.EmployeeTransactions || (Expense.EmployeeTransactions = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_EMPLOYEETRANSACTIONS_CUSTOMIZATION_CLIENT_SAMPLE.js.map