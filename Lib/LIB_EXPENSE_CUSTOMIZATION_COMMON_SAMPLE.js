"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Expense scripts on client or server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Expense Common script customization callbacks
 * @namespace Lib.Expense.Customization.Common
 */
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                * @method Lib.Expense.Customization.Common.IsToSubmitExpense
                * @description
                * Allows you to customize the expense status when saving the Expense process.
                * This function is called from the HTML Page script and the validation script of the Expense process, when saving the Expense.
                * @returns {boolean} returns true if the expense could be set to ToSubmit status otherwise false and status is set to Draft.
                *
                * @example
                * For this example the library : Lib.Expense.LayoutManager must be included to perform the initial "to submit" check of the expense form.
                * This user exit prevents the submission of business meal expenses if the custom field Z_NumberOfGuest__ is empty or
                * if the initial checking function (see initialExpenseFormCheck variable) return false.
                * <pre><code>
                * IsToSubmitExpense: function ()
                * {
                *	var initialExpenseFormCheck = Lib.Expense.LayoutManager.CheckAllLayoutRequiredFields() && Lib.Expense.LayoutManager.CheckFieldsValidity();
                *	if (Data.GetValue("ExpenseType__") === "Business Meals") // For the US01 Company Code
                *	{
                *		if(!Data.GetValue("Z_NumberOfGuest__"))
                *		{
                *			Data.SetError("Z_NumberOfGuest__", "The number of guest must be completed.");
                *			return (false);
                *		}
                *	}
                *	return (initialExpenseFormCheck);
                * }
                * </code></pre>
                */
                Common.IsToSubmitExpense = function () {
                };
                /**
                * @method Lib.Expense.Customization.Common.IsAllowedToCreateExpenseOnBehalfOf
                * @description
                * Allows you to determine who is allowed to create expenses on behalf of another user.
                * This function is called when you click the + button on the mobile "Expenses" screen.
                * In addition to this user exit, you have to declare this library in the "customLibs" parameter of
                * the mobile app customization JSON file.
                *
                * CLIENT_WEB|CLIENT_MOBILE|SERVER
                *
                * @returns {boolean|Promise<any>} returns true (or a promise resolved to true) if the current user is
                * allowed to create an expense on behalf of another user.
                *
                * @example
                * In this example, a user is allowed to create expenses on behalf of another user
                * if the ODUSER field "AdditionalField1" contains the flag "ExpenseOnBehalfOfEnabled".
                * <pre><code>
                *  IsAllowedToCreateExpenseOnBehalfOf: function()
                *  {
                *  	return Sys.Helpers.Promise.Create(function(resolve, reject)
                *  	{
                *  		var filter = "Login=" + Sys.Helpers.Globals.User.loginId;
                *  		Sys.GenericAPI.Query("ODUser", filter, ["AdditionalField1"], function (records, error)
                *  		{
                *  			if (error || records.length === 0)
                *  			{
                *  				Log.Error("Cannot retrieve user info, login: " + Sys.Helpers.Globals.User.loginId);
                *  				reject(false);
                *  			}
                *  			else
                *  			{
                *  				resolve(/\bExpenseOnBehalfOfEnabled\b/i.test(records[0].AdditionalField1));
                *  			}
                *  		});
                *  	});
                *  }
                * </code></pre>
                */
                Common.IsAllowedToCreateExpenseOnBehalfOf = function () {
                    return false;
                };
                /**
                * @method Lib.Expense.Customization.Common.GetCustomExchangeRate
                * @description
                * Implement this function to provide an user-specific exchange rate whenever the process
                * needs to calculate an amount from a currency (TotalAmountCurrency__) to the currency
                * defined for the company (CompanyCode__).
                *
                * CLIENT_WEB|CLIENT_MOBILE|SERVER
                *
                * @returns {number|Promise<any>} returns a number (or a promise resolved to number) representing
                * the user-specific exchange rate.
                *
                * @example
                * In the following example, the exchange rate of a currency depends on the date. A start
                * date (StartDate__) has been added in the "P2P - Exchange rate__" table to indicate the
                * date from which the exchange rate is applied.
                * <pre><code>
                * GetCustomExchangeRate: function()
                * {
                *	var options =
                *	{
                *		table: "P2P - Exchange rate__",
                *		filter: "&(CompanyCode__=" + Data.GetValue("CompanyCode__") + ")" +
                *			"(CurrencyFrom__=" + Data.GetValue("TotalAmountCurrency__") + ")",
                *		attributes: [ "RatioFrom__", "RatioTo__", "Rate__" ],
                *		maxRecords: 1,
                *		sortOrder: "StartDate__ DESC"
                *	};
                *
                *	// !!! In mobile, for the moment, the value type of the control Date can be objet Date or
                *	// string of format 2019-11-26 after datePicker selection.
                *	var expenseDate = Data.GetValue("Date__");
                *	if (expenseDate)
                *	{
                *		if (expenseDate instanceof Date)
                *		{
                *			expenseDate = Sys.Helpers.Date.Date2DBDate(expenseDate);
                *		}
                *		options.filter += "(|(StartDate__!=*)(StartDate__<=" + expenseDate + "))";
                *	}
                *	return Sys.GenericAPI.PromisedQuery(options)
                *		.Then(function (results)
                *	  	{
                *			if (results && results.length > 0)
                *			{
                *				var r = results[0];
                *				return parseFloat(r["Rate__"]) * parseFloat(r["RatioTo__"]) / parseFloat(r["RatioFrom__"]);
                *			}
                *			return null;
                *		});
                * }
                * </code></pre>
                */
                Common.GetCustomExchangeRate = function () {
                    return null;
                };
                /**
                * @method Lib.Expense.Customization.Common.GetCustomReimbursableAmount
                * @description
                * Implement this function to provide an user-specific reimbursable amount
                * This function is called each time the fields TotalAmount__, ExchangeRate__, LocalAmount__, Refundable__ and ExpenseType__ are modified
                * (when the Refundable__ (Reimbursable) checkbox is checked).
                * This function is also called server-side when the user saves his expense to enforce the reimbursable amount.
                *
                * CLIENT_WEB|CLIENT_MOBILE|SERVER
                *
                * @returns {number|Promise<any>} returns a number (or a promise resolved to number) representing
                * the user-specific reimbursable amount.
                *
                * @example
                * In the following example, the reimbursable amount is limited to 80 for hotels and full amount is used for other categories.
                * <pre><code>
                * GetCustomReimbursableAmount: function()
                * {
                *	// in Customize layout: fields ReimbursableLocalAmount__ and NonReimbursableLocalAmount__ are displayed
                *	var localAmount = Data.GetValue("LocalAmount__");
                *	var warningMsg = null, reimbursableAmount = localAmount;
                *	var expenseType = Data.GetValue("ExpenseType__");
                *	if (expenseType === "Hotel" || expenseType === "Hôtel") // US01 and FR01 demo data value for hotel
                *	{
                *		var nbNight = 1; // Retrieve it from a custom field
                *		if (localAmount/nbNight > 80)
                *		{
                *			warningMsg = "Refund is limited to 80$ per night";
                *			reimbursableAmount = 80 * nbNight;
                *		}
                *	}
                *
                *	if (Sys.ScriptInfo.IsClient())
                *	{
                *		Sys.Helpers.Globals.Controls.ReimbursableLocalAmount__.SetWarning(warningMsg);// used to set/reset warning message
                *	}
                *	return reimbursableAmount;
                * }
                * </code></pre>
                */
                Common.GetCustomReimbursableAmount = function () {
                    return null;
                };
                /**
                * @method Lib.Expense.Customization.Common.GetMetaTypeToExpenseTypeMapping
                * @description
                * Implement this function to provide a custom mapping between the metatype returned by AI and the expenseType (or template).
                * This function is called each time we search expense types according to a metatype.
                *
                * CLIENT_WEB|CLIENT_MOBILE|SERVER
                *
                * @returns {Lib.Expense.MetaTypeToExpenseTypeMapping} returns a custom mapping, the standard mapping is used otherwise.
                *
                * @example
                * In the following example, we associate the metatype "Restaurant" only with the expenseType "Business Meals".
                * <pre><code>
                * GetMetaTypeToExpenseTypeMapping: function()
                * {
                *	return Sys.Helpers.Extend(true, {}, Lib.Expense.metaTypeToExpenseTypeMapping, {
                *		Restaurant: { expenseTypes: ["Business Meals"] }
                *	});
                * }
                * </code></pre>
                */
                Common.GetMetaTypeToExpenseTypeMapping = function () {
                    return null;
                };
                /**
                * @method Lib.Expense.Customization.Common.GetExpenseTypeFromAIPredictions
                * @description
                * Implement this function to provide a custom mapping between the metatype returned by AI and the expenseType (or template).
                * This function is called each time we search expense types according to a metatype.
                *
                * CLIENT_WEB|CLIENT_MOBILE|SERVER
                *
                * @param {Lib.Expense.AIForExpenses.Prediction} predictions returned by AI (version according to the company code configuration)
                * @returns {string|string[]|Promise<string>|Promise<string[]>} returns the expense type or the list of expense types you deduce from the
                * 	AI predictions. This method supports an async deduction by returning a promise.
                *
                * @example
                * In the following example, we always take the first metatype prediction with sufficient confidence. If the metatype is "Restaurant",
                * we return the expense type "Business Meal". We deduce it synchronously.
                * <pre><code>
                * GetExpenseTypeFromAIPredictions: function(predictions)
                * {
                *	if (Lib.Expense.AIForExpenses.HasMetaTypePrediction(predictions))
                *	{
                *		var bestMetaTypePrediction = predictions.type[0];
                *		if (bestMetaTypePrediction.confidence > 0.9 && bestMetaTypePrediction.prediction === "Restaurant")
                *		{
                *			return "Business Meals";
                *		}
                *	}
                *	return null;
                * }
                * </code></pre>
                */
                Common.GetExpenseTypeFromAIPredictions = function (predictions) {
                    return null;
                };
                /**
                 * @method Lib.Expense.Customization.Common.ExtendExpenseTypeTableToProcessFieldMapping
                 * @description
                 * Implement this function to extend the mapping between the expense type table and the process fields with custom fields (ex. a fieldBehavior).
                 * This function is called when injecting the Lib_Expense library.
                 *
                 * CLIENT_WEB|CLIENT_MOBILE|SERVER
                 *
                 * @param {object} mapping the mapping between the expense type table and the process fields
                 *
                 * @example
                 * In the following example, we add a custom field "Z_CarbonFootprintFieldBehaviour__" to the mapping between the expense type table and the process fields.
                 * <pre><code>
                 * ExtendExpenseTypeTableToProcessFieldMapping: function(mapping)
                 * {
                 *  	mapping.Z_CarbonFootprintFieldBehaviour__ = "Z_CarbonFootprintFieldBehaviour__";
                 * }
                 * </code></pre>
                 */
                Common.ExtendExpenseTypeTableToProcessFieldMapping = function (mapping) {
                };
                /**
                 * @method Lib.Expense.Customization.Common.OnLoadLayoutManagerTemplates
                 * @description
                 * Implement this function to execute custom code when the layout manager templates are loaded.
                 * This function is called after initializing the layout manager builtin templates and before starting the layout manager.
                 * It could be asynchronous.
                 *
                 * CLIENT_WEB|CLIENT_MOBILE|SERVER
                 *
                 * @example
                 * In the following example, we add a custom field "Z_CarbonFootprint__" to the standard template.
                 * <pre><code>
                 * OnLoadLayoutManagerTemplates: function()
                 * {
                 * 	const stdTemplate = Lib.Expense.LayoutManager.GetTemplate("Standard");
                 *	stdTemplate.fields.Z_CarbonFootprint__ = {
                 *		overloadBehavior: {
                 *			fieldName: "Z_CarbonFootprintFieldBehaviour__",
                 *			defaultValue: Lib.Expense.LayoutManager.FieldBehavior.Hidden,
                 *			keepValueWhenChangingTemplate: false
                 *		}
                 *	};
                 *	Lib.Expense.LayoutManager.AddTemplate("Standard", stdTemplate);
                 * }
                 * </code></pre>
                 */
                Common.OnLoadLayoutManagerTemplates = function () {
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = Expense.Customization || (Expense.Customization = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_CUSTOMIZATION_COMMON_SAMPLE.js.map