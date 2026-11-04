"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_TRANSACTION_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Expense Transaction customization Server",
  "versionable": false,
  "require": []
}*/
/**
 * Transaction parser objects
 * @namespace Lib.Expense.Transaction.Parser
 */
/**
 * Expense transaction server script customization callbacks
 * @namespace Lib.Expense.Transaction.Customization.Server
 */
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Transaction;
        (function (Transaction) {
            var Customization;
            (function (Customization) {
                var Server;
                (function (Server) {
                    /**
                     * @method Lib.Expense.Transaction.Customization.Server.GetParsers
                     * @description Allows to add custom parsers (GL1025 ASCII is already supported) for bank transaction files.
                     * @returns {Lib.Expense.Transaction.Parser.IParser[]} customParsers Array of custom parsers for bank transaction files
                     * @example
                     * <pre><code>
                     * var customization =
                     * {
                     * 	GetParsers: function ()
                     * 	{
                     * 		return [
                     * 			{
                     * 				IsCompatible: function(indexOfFileToParse)
                     * 				{
                     *					let content = Attach.GetContentByLine(indexOfFile);
                     *					let compatible = content.length >= 34 && content.substr(27, 6) === "GL1025";
                     *					Attach.ResetGetContentByBlock(0);
                     *					return compatible;
                     * 				},
                     * 				RunParsing: function(indexOfFileToParse)
                     * 				{
                     * 					let contentLine = Attach.GetContentByLine(indexOfFile);
                     *					while (contentLine !== "")
                     *					{
                     *						itemOrData = Data.GetTable("LineTransaction__").AddItem();
                     *						itemOrData.SetValue("TransactionDate__","value to extract from line");
                     *						itemOrData.SetValue("TransactionID__","value to extract from line");
                     *						itemOrData.SetValue("BilledAmount__","value to extract from line");
                     *						itemOrData.SetValue("ISOBilledCurrencyCode__","value to extract from line");
                     *						itemOrData.SetValue("LocalAmount__","value to extract from line");
                     *						itemOrData.SetValue("CurrencyExchangeRate__","value to extract from line");
                     *						itemOrData.SetValue("ISOLocalCurrencyCode__","value to extract from line");
                     *						itemOrData.SetValue("ExpenseDescription__","value to extract from line");
                     *						itemOrData.SetValue("MerchantCategory__","value to extract from line");
                     *						contentLine = Attach.GetContentByLine(indexOfFile);
                     *					}
                     * 					return true;
                     * 				}
                     * 			}
                     * 		];
                     * 	}
                     * }
                     * </code></pre>
                     */
                    Server.GetParsers = function () {
                        let customParsers;
                        return customParsers;
                    };
                    /**
                     * @description Allows to customize whether expense are automatically created when a bank transaction is parsed.
                     * @method Lib.Expense.Transaction.Customization.Server.getAutoCreateExpenses
                     * @returns {boolean} If true, new expenses will be automatically created when transaction parser is approved
                     * @example
                     * <pre><code>
                     * var customization =
                     * {
                     * 	getAutoCreateExpenses: function ()
                     * 	{
                     * 		return true;
                     * 	}
                     * }
                     * </code></pre>
                    */
                    Server.getAutoCreateExpenses = function () {
                        return false;
                    };
                    /**
                     * @description Allows to customize the behavior before parsing transactions. This method can be asynchronous. It can be used to get some data before parsing transactions.
                     * @method Lib.Expense.Transaction.Customization.Server.OnBeforeParsing
                     * @example
                     * <pre><code>
                     * var customization =
                     * {
                     * 	OnBeforeParsing: async function ()
                     * 	{
                     * 		// Your code here (can be asynchronous)
                     * 	 	return Sys.Helpers.Promise.Resolve();
                     * 	}
                     * }
                     * </code></pre>
                     */
                    Server.OnBeforeParsing = async function () { };
                    /**
                     * @description Allows to customize the behavior after parsing transactions has been completed.
                     * @method Lib.Expense.Transaction.Customization.Server.OnAfterParsing
                     * @example
                     * <pre><code>
                     * var customization =
                     * {
                     * 	OnAfterParsing: function ()
                     * 	{
                     * 		// Your code here
                     * 	}
                     * }
                     * </code></pre>
                     */
                    Server.OnAfterParsing = function () { };
                    /**
                     * @description Allows to customize the behavior after a transaction line has been added to the process.
                     * @method Lib.Expense.Transaction.Customization.Server.OnAfterTransactionAdd
                     * @param {Item} item - The item that has been added to the process.
                     * @param {(Lib.Expense.Transaction.Customization.Server.CDF3XMLTransactionLineData|Lib.Expense.Transaction.Customization.Server.GL1025TransactionLineData|Lib.Expense.Transaction.Customization.Server.GL1076TransactionLineData|Lib.Expense.Transaction.Customization.Server.VCF4TransactionLineData)} transaction - TransactionData object. It always has a type property to identify the transaction type. The content depends on the transaction type (see available types).
                     * @example
                     * <pre><code>
                     * var customization =
                     * {
                     * 	OnAfterTransactionAdd: function (item, transactionData)
                     * 	{
                     *		Log.Info(`[OnAfterTransactionParsed] transaction type ${transactionData.type}`);
                     *		if(transactionData.type === "VCF4")
                     *		{
                     *			const employeeID = transactionData.cardHolder.fields[13];
                     *			Log.Info(`[OnAfterTransactionParsed] Overriding employee ID "${item.GetValue("EmployeeID__")}" by "${employeeID}"`);
                     *			item.SetValue("EmployeeID__", employeeID);
                     *		}
                     *		else if(transactionData.type === "GL1076" || transactionData.type === "GL1025")
                     *		{
                     *			//Log.Info(transactionData.transaction.line);
                     *			//Log.Info(JSON.stringify(transactionData.transaction.modifiedValues));
                     *			Log.Info(JSON.stringify(transactionData.transaction.mapping));
                     *			//Log.Info(JSON.stringify(transactionData.transaction.extractorConfig));
                     *		}
                     *		else if(transactionData.type === "CDF3")
                     *		{
                     *			Log.Info(JSON.stringify(transactionData.transaction.mapping));
                     *		}
                     * 	}
                     * }
                     * </code></pre>
                     */
                    Server.OnAfterTransactionAdd = function (item, transactionData) { };
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.CDF3XMLTransactionLineData
                     * @property {string} [type] Transaction type (equals to "CDF3")
                     * @property {Lib.Expense.Transaction.Customization.Server.CDF3XMLTransactionLineDataDetail} [transaction] Transaction data object that contains the mapping and the XML line
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.CDF3XMLTransactionLineDataDetail
                     * @property {object} [mapping] Mapping object used for the current transaction
                     * @property {XML.IXMLDOMNode} [xmlLine] XML line object matching the current transaction
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.GL1025TransactionLineData
                     * @property {string} [type] Transaction type (equals to "GL1025")
                     * @property {Lib.Expense.Transaction.Customization.Server.GL1025TransactionLineDataDetail} [transaction] Transaction data object
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.GL1025TransactionLineDataDetail
                     * @property {string} [line] Raw line content for the current transaction
                     * @property {Lib.Expense.Transaction.Parser.GL1025.LineMapping} [mapping] Mapping object used for the current transaction
                     * @property {Record<string, ExtractFieldInfo>} [extractorConfig] Extractor configuration object
                     * @property {Record<string, any>} [modifiedValues] extracted values that have been set for the current line. Format: {fieldName: value}
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.GL1076TransactionLineData
                     * @property {string} [type] Transaction type (equals to "GL1076")
                     * @property {Lib.Expense.Transaction.Customization.Server.GL1076TransactionLineDataDetail} [transaction] Transaction data object
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.GL1076TransactionLineDataDetail
                     * @property {string} [line] Raw line content for the current transaction
                     * @property {Lib.Expense.Transaction.Parser.GL1076.LineMapping} [mapping] Mapping object used for the current transaction
                     * @property {Record<string, ExtractFieldInfo>} [extractorConfig] Extractor configuration object
                     * @property {Record<string, any>} [modifiedValues] extracted values that have been set for the current line. Format: {fieldName: value}
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.VCF4TransactionLineData
                     * @property {string} [type] Transaction type (equals to "VCF4")
                     * @property {Lib.Expense.Transaction.Customization.Server.VCF4TransactionLineDataDetail} [transaction] Transaction data object
                     * @property {Lib.Expense.Transaction.Customization.Server.VCF4TCardHolderLineDataDetail} [cardHolder] Card holder data object
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.VCF4TransactionLineDataDetail
                     * @property {string[]} [fields] Raw line content for the current transaction split by separator (tabulation)
                     * @property {any} [mapping] Mapping object used for the current transaction
                     */
                    /**
                     * @typedef {object} Lib.Expense.Transaction.Customization.Server.VCF4TCardHolderLineDataDetail
                     * @property {string[]} [fields] Raw line content for the matcing card holder split by separator (tabulation)
                     */
                    /**
                     * @description Allows to customize the behavior after a transaction linehas been updated. Only available for GL1025 and GL1076 transactions. This UE exit  is called after the transaction line has been updated OR added.
                     * @method Lib.Expense.Transaction.Customization.Server.OnAfterTransactionUpdate
                     * @param {Item} item - The transaction item
                     * @param {(Lib.Expense.Transaction.Customization.Server.GL1025TransactionLineData|Lib.Expense.Transaction.Customization.Server.GL1076TransactionLineDataDetail)} transactionData - The transaction object
                     * @example
                     * <pre><code>
                     * var customization =
                     * {
                     * 	OnAfterTransactionUpdate: function (item, transactionData)
                     * 	{
                     * 		// Your code here
                     * 	}
                     * }
                     * </code></pre>
                     */
                    Server.OnAfterTransactionUpdate = function (item, transactionData) { };
                    /**
                     * @description Allows to Customize Expense Processing when a bank transaction is parsed. That can be used to handle personal expense
                     * @method Lib.Expense.Transaction.Customization.Server.CustomizeExpenseProcessing
                     * @param {boolean} createOnBehalf - bool to indicate if the process is validated by the owner or on behalf of the user
                     * @returns {boolean} Returns true if no error occurs
                     * @example
                     * <pre><code>
                     * var customization =
                     * {
                     * 	CustomizeExpenseProcessing: function (createOnBehalf)
                     * 	{
                     * 		let ret = true;
                     * 		let expensesToCreate = [];
                     *		Sys.Helpers.Data.ForEachTableItem("TransactionItems__", (item: Item) =>
                     *		{
                     *			if (item.GetValue("ExpenseCreationMode__") === "TransactionPersonalExpense" && !item.GetValue("ExpenseCreated__"))
                     *			{
                     *				expensesToCreate.push(item);
                     *			}
                     *		});
                     *
                     *		Log.Info("Personal expenses to create: " + expensesToCreate.length);
                     *
                     *		expensesToCreate.forEach(transactionLine =>
                     *		{
                     *			const RUIDEXExpense = Lib.Expense.Transaction.Validation.CreateExpense(transactionLine, createOnBehalf);
                     *			if (!RUIDEXExpense)
                     *			{
                     *				ret = false;
                     *			}
                     *			else
                     *			{
                     *				transactionLine.SetValue("ExpenseRUIDEX__", RUIDEXExpense);
                     *				transactionLine.SetValue("ExpenseCreated__", true);
                     *			}
                     *		});
                     * 	}
                     * }
                     * </code></pre>
                    */
                    function CustomizeExpenseProcessing(createOnBehalf) {
                        let ret = true;
                        return ret;
                    }
                    Server.CustomizeExpenseProcessing = CustomizeExpenseProcessing;
                })(Server = Customization.Server || (Customization.Server = {}));
            })(Customization = Transaction.Customization || (Transaction.Customization = {}));
        })(Transaction = Expense.Transaction || (Expense.Transaction = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_TRANSACTION_CUSTOMIZATION_SERVER_SAMPLE.js.map