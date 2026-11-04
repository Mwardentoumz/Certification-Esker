"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_BUDGET_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Budget scripts on common side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Budget common script customization callbacks
 * @namespace Lib.Budget.Customization.Common
 */
var Lib;
(function (Lib) {
    var Budget;
    (function (Budget) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.Budget.Customization.Common.GetCustomBudgetColumnValue
                 * @description Allows you to override a budget column value
                 * Can be used to change budget column value corresponding to some conditions.
                 * CLIENT_WEB|CLIENT_MOBILE|SERVER
                 * @param {string} budgetColumn budget column name
                 * @param {IData | xFormData} documentData header document data
                 * @param {Item | xFormDataTableItem} itemData data of the item
                 * @param {Lib.Spending.ISourceType<Lib.Spending.Budget.Impact>} sourceTypeConfig the sourcetype config
                 * @returns {Lib.Spending.Budget.BudgetColumnValue | any} can be an object to define some options or directly the value to return
                 * @example This sample function allows you to replace the Cost Center budget column value by the value of the custom field Z_Customfield where Z_Customfield can be empty.
                 * <pre><code>
                 * GetCustomBudgetColumnValue: function(budgetColumn, documentData, itemData, sourceTypeConfig)
                 * {
                 * 	if (budgetColumn === "CostCenter__")
                 * 	{
                 * 		return
                 * 		{
                 * 			value: documentData.GetValue("Z_Customfield"),
                 *			optional: "true"
                 *		};
                 * 	}
                 * 	return null;
                 * }
                 * </code></pre>
                 */
                Common.GetCustomBudgetColumnValue = function (budgetColumn, documentData, itemData, sourceTypeConfig) {
                    return null;
                };
                /**
                 * @method Lib.Budget.Customization.Common.GetCustomUserBudgetRights
                 * @description
                 * Allows you to override the validation keys (user rights) for the user identified by options.login.
                 * Can be used to customize the storage/computation of the validation keys. By default stored in User.additionalField4.
                 * This method can be synchronous or asynchronous according to the returned value.
                 *
                 * CLIENT_WEB|CLIENT_MOBILE|SERVER
                 * @param {Lib.Spending.Budget.BudgetVisibilityOptions} options options on visibility
                 * @returns {string[] | Promise} custom validation keys are returned directly (synchronous mode) or by the resolved promise (asynchronous mode)
                 * @example This sample function allows you to retrieve the budget validation keys in several fields of User table.
                 * <pre><code>
                 * GetCustomUserBudgetRights: function(options)
                 * {
                 * 	var queryOptions = {
                 * 		table: "ODUSER",
                 * 		filter: "Login=" + options.login,
                 * 		attributes: ["AdditionalField1", "AdditionalField4"]
                 * 	};
                 * 	return Sys.GenericAPI.PromisedQuery(queryOptions)
                 * 		.Then(function(records)
                 * 		{
                 * 			if (records.length > 0)
                 * 			{
                 * 				var validationKeys = [];
                 * 				queryOptions.attributes.forEach(function(field) {
                 * 					var fieldValue = records[0][field];
                 * 					if (fieldValue)
                 * 					{
                 * 						Array.prototype.push.apply(validationKeys, fieldValue.split(";"));
                 * 					}
                 * 				});
                 * 				return validationKeys;
                 * 			}
                 * 			else
                 * 			{
                 * 				throw ("Unable to find any user with the specified login, table: ODUSER, login: " + options.login);
                 * 			}
                 * 		})
                 * 		.Catch(function(error)
                 * 		{
                 * 			Log.Error("An error occured while get custom budget rights. Details: " + error);
                 * 			return []; // no rights
                 * 		});
                 * }
                 * </code></pre>
                 */
                Common.GetCustomUserBudgetRights = function (options) {
                    return null;
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = Budget.Customization || (Budget.Customization = {}));
    })(Budget = Lib.Budget || (Lib.Budget = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_BUDGET_CUSTOMIZATION_COMMON_SAMPLE.js.map