"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_TRANSACTIONPARSER_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Transaction Parser scripts on Client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Transaction Parser scripts customization callbacks
 * @namespace Lib.Expense.TransactionParser.Customization.Client
 */
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var TransactionParser;
        (function (TransactionParser) {
            var Customization;
            (function (Customization) {
                var Client;
                (function (Client) {
                    /**
                     * @method Lib.Expense.TransactionParser.Customization.Client.CustomizeLayout
                     * @description
                     * CLIENT_WEB
                     * Allows you to customize layout settings of the Transaction Parser process.
                     * This user exit is called from the HTML Page script of the Transaction Parser process, after loading the form and determining the workflow.
                     *
                     * This function will be called at the first Transaction Parser rendering; just after calling the InitLayout function.
                     * Here you can declare custom OnEvent callbacks and set the initial state (hidden, readonly, etc.) of controls in the transaction table.
                     * @since 338
                     * @example
                     * This user exit customizes the layout of the Transaction Parser table to hide specific amount and currency columns.
                     * <pre><code>
                     * CustomizeLayout: function ()
                     * {
                     *	 // Hide local amount and currency columns
                     *	 Controls.LineTransaction__.LocalAmount__.Hide(true);
                     *	 Controls.LineTransaction__.LocalAmountCurrency__.Hide(true);
                     *
                     *	 // Hide billing amount and currency columns
                     *	 Controls.LineTransaction__.BillingAmount__.Hide(true);
                     *	 Controls.LineTransaction__.BillingAmountCurrency__.Hide(true);
                     *
                     *	 // Example: Customize table behavior
                     *	 Controls.LineTransaction__.SetExtendableColumn("TransactionDescription__");
                     *	 Controls.LineTransaction__.SetWidth("100%");
                     *
                     *	 // Example: Add custom validation on amount fields
                     *	 Controls.LineTransaction__.LocalAmount__.OnChange = function()
                     *	 {
                     *		 var row = this.GetRow();
                     *		 var localAmount = this.GetValue();
                     *		 if (localAmount > 10000)
                     *		 {
                     *			 row.LocalAmount__.SetWarning("High amount detected - please verify");
                     *		 }
                     *		 else
                     *		 {
                     *			 row.LocalAmount__.SetWarning("");
                     *		 }
                     *	 };
                     * }
                     * </code></pre>
                     */
                    Client.CustomizeLayout = function () {
                    };
                })(Client = Customization.Client || (Customization.Client = {}));
            })(Customization = TransactionParser.Customization || (TransactionParser.Customization = {}));
        })(TransactionParser = Expense.TransactionParser || (Expense.TransactionParser = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_TRANSACTIONPARSER_CUSTOMIZATION_CLIENT_SAMPLE.js.map