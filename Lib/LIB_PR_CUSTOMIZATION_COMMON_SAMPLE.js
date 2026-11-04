"use strict";
/* LIB_DEFINITION{
  "name": "LIB_PR_CUSTOMIZATION_COMMON_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Custom library extending Purchase Requisition scripts on Common side",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Sys/Sys_Helpers_LdapUtil"
  ]
}*/
/**
 * Package Purchase Requisition Common script customization callbacks
 *
 * Timeline of user exit calls
 * ------------------
 * <img src="img/PAC/Lib_PR_Customization_Common_TimeLine.png">
 * @namespace Lib.PR.Customization.Common
 */
var Lib;
(function (Lib) {
    var PR;
    (function (PR) {
        var Customization;
        (function (Customization) {
            var Common;
            (function (Common) {
                /**
                 * @method Lib.PR.Customization.Common.OnValidateForm
                 * @description
                 * Allows you to customize the validation settings for the Purchase requisition process.
                 * This user exit is called at the end of the validation script of the process.
                 * @memberof Lib.PR.Customization.Common
                 * @param {boolean} isFormValid The actual validation status of the form
                 * @returns {boolean|Promise<boolean>} isFormValid The updated validation status of the form
                 * @example
                 * Common.OnValidateForm = function(isFormValid)
                 * {
                 * 		if (Lib.Purchasing.PR.Workflow.controller.GetContributorsByRole("approver").length == 0)
                 *		{
                 *			Data.SetError("Reason__", "At least one approver is required before submit");
                 *			return false;
                 *		}
                 *		return isFormValid;
                 * }
                 */
                Common.OnValidateForm = function (isFormValid) {
                    return isFormValid;
                };
                /**
                 * @method Lib.PR.Customization.Common.GetSingleVendorNumber
                 * @description
                 * User Exit used for Single Vendor Mode
                 * Allows you to define the vendor number of the single vendor.
                 *
                 * This function is called on the enabling of the single vendor mode and will set the vendor return
                 * by this function as single vendor on the PR.
                 *
                 * @returns {string} vendorNumber The vendor number of the vendor that you want use as single vendor.
                 * @example
                 * Common.GetSingleVendorNumber = function()
                 * {
                 *		return Process.GetURLParameter("vendor");
                 * }
                 */
                Common.GetSingleVendorNumber = function () {
                };
                /**
                 * @method Lib.PR.Customization.Common.CustomizeOutlierCheckFilter
                 * @description Allows you to customize the filter used for the outlier checking feature.
                 * The query whose filter you customize is useful for constructing the dataset used to calculate outlier values
                 * Be careful to exclude the current PR from the query as shown in the example below
                 * Warning: this user exit is experimental and may be subject to change in future versions.
                 * @param {Item} item The current item
                 * @param {Sys.Helpers.LdapUtil.IFilter} filter The original filter used if you don't provide a custom one
                 * @return {Sys.Helpers.LdapUtil.IFilter|string|void} A customized filter for querying the dataset used to calculate outlier values
                 * @example
                 * 	Common.CustomizeOutlierCheckFilter = function(item: Item, filter)
                 * 	{
                 * 		// every Item column is prefixed by 'Line_' in the CDL
                 * 		const itemIdFilter = Lib.Purchasing.IsFreeItem(item) ?
                 * 			[
                 * 				Sys.Helpers.LdapUtil.FilterEqual("Line_ItemDescription__", item.GetValue("ItemDescription__")),
                 * 				Sys.Helpers.LdapUtil.FilterEqual("Line_ItemUnitPrice__", item.GetValue("ItemUnitPrice__"))
                 * 			]
                 * 			: [Sys.Helpers.LdapUtil.FilterEqual("Line_ItemNumber__", item.GetValue("ItemNumber__"))];
                 *
                 * 		return Sys.Helpers.LdapUtil.FilterAnd(
                 * 			...itemIdFilter,
                 * 			Sys.Helpers.LdapUtil.FilterEqual("RequisitionInitiator__", Data.GetValue("RequisitionInitiator__")),
                 * 			Sys.Helpers.LdapUtil.FilterIn("RequisitionStatus__", [Lib.Purchasing.PRStatus.toOrder, Lib.Purchasing.PRStatus.toReceive, Lib.Purchasing.PRStatus.received]),
                 * 			// We want to exclude the current requisition from the dataset
                 * 			Sys.Helpers.LdapUtil.FilterNotEqual("RequisitionNumber__", Data.GetValue("RequisitionNumber__"))
                 * 		);
                 * 	};
                 */
                Common.CustomizeOutlierCheckFilter = function (item, filter) {
                };
                /**
                 * @method Lib.PR.Customization.Common.ShouldAutoApproveNextWorkflowStep
                 * @description Allows you to determine whether the next step in the purchasing workflow can be automatically approved.
                 *
                 * **Important: Budget visibility constraint**
                 * The standard auto-approval logic only works safely when the requester (current user) has the same budget visibility
                 * as the approver being skipped. When an approver step is auto-approved, the approver never opens the document,
                 * so the budget viewed flag (`ItemBudgetViewed__`) is never set for items the approver would have seen.
                 * If no approver with sufficient budget visibility opens the document before the buyer step, the submission will fail
                 * with a "_NotAllItemsApproved" error.
                 *
                 * If you need to auto-approve steps where the requester does NOT share the same budget visibility as the approver,
                 * you must also customize budget visibility. Be aware that this is a complex scenario and requires careful attention
                 * to the management of budget visibility across all workflow participants.
                 *
                 * @param {IUser} currentUser current user
                 * @param {Sys.WorkflowController.IWorkflowContributor} nextContributor The next contributor in the workflow
                 * @returns {(boolean|Object)} Return a legacy truthy/falsy value to keep the standard behavior and add custom auto-approval conditions.
                 * Return an object with `override: true` to force the final auto-approval decision with `shouldAutoApproveNextWorkflowStep`.
                 * When `override` is true, the standard logic is no longer applied automatically, so your customization must include every condition you want to keep.
                 * @example <caption>Legacy behavior: auto approve all approval steps</caption>
                 *	Common.ShouldAutoApproveNextWorkflowStep = function(currentUser, nextContributor)
                 *	{
                 *		return Data.GetValue("RequisitionStatus__") === Lib.Purchasing.PRStatus.toApprove &&
                 *			nextContributor.role === Lib.Purchasing.roleApprover;
                 *	};
                 * @example <caption>Override behavior: always auto approve the next approver step</caption>
                 *	Common.ShouldAutoApproveNextWorkflowStep = function(currentUser, nextContributor)
                 *	{
                 *		return {
                 *			override: true,
                 *			shouldAutoApproveNextWorkflowStep: nextContributor.role === Lib.Purchasing.roleApprover
                 *		};
                 *	};
                 * @example <caption>Override behavior: reproduce the standard and custom fallback logic</caption>
                 *	Common.ShouldAutoApproveNextWorkflowStep = function(currentUser, nextContributor)
                 *	{
                 *		const notMergeableRoles = [Lib.Purchasing.roleBuyer];
                 *		const currentUserLogin = currentUser.GetValue("Login");
                 *		const defaultAutoApprove = currentUserLogin === nextContributor.login && !notMergeableRoles.includes(nextContributor.role);
                 *
                 *		// Add your custom auto-approval condition to reproduce the historical standard || custom behavior.
                 *		const customAutoApprove = Data.GetValue("RequisitionStatus__") === Lib.Purchasing.PRStatus.toApprove &&
                 *			nextContributor.role === Lib.Purchasing.roleApprover;
                 *
                 *		return {
                 *			override: true,
                 *			shouldAutoApproveNextWorkflowStep: defaultAutoApprove || customAutoApprove
                 *		};
                 *	};
                 */
                Common.ShouldAutoApproveNextWorkflowStep = function (currentUser, nextContributor) {
                    return false;
                };
                /**
                 * @method Lib.PR.Customization.Common.GetDefaultRequestedDeliveryDate
                 * @description
                 * User exit to customize the default requested delivery date for PR line items.
                 * Called when adding a new line item to allow clients to override the default delivery date logic.
                 * By default, the delivery date is computed from the item's lead time, or copied from the previous line item.
                 * @since 345
                 * @scope CLIENT_WEB|CLIENT_MOBILE|SERVER
                 * @param {Sys.Types.Data.TableItem} item - The line item being added
                 * @param {number} [index] - Optional index of the item in the table
                 * @returns {Date | null | void} - Return a Date to set a custom delivery date, null to set no default date, or undefined/void to use the standard logic
                 * @example <caption>Set delivery date based on item lead time</caption>
                 *	Common.GetDefaultRequestedDeliveryDate = function(item, index)
                 *	{
                 *		const leadTime = item.GetValue("LeadTime__");
                 *		if (!Sys.Helpers.IsEmpty(leadTime))
                 *		{
                 *			const date = new Date();
                 *			date.setHours(0, 0, 0, 0);
                 *			date.setDate(date.getDate() + parseInt(leadTime, 10));
                 *			return date;
                 *		}
                 *		return null;
                 *	};
                 */
                Common.GetDefaultRequestedDeliveryDate = function (item, index) {
                };
                /**
                 * @method Lib.PR.Customization.Common.GetDefaultShipToID
                 * @since 346
                 * @description
                 * User exit to customize the default ShipTo ID (delivery address) for Purchase Requisition line items or header.
                 * Called when setting the default ShipTo to allow clients to override the standard ShipTo logic.
                 * By default, the ShipTo ID is retrieved from the company code configuration or user profile.
                 * This function supports both synchronous and asynchronous operations when external data lookups are required.
                 * Use Promise return type for database queries, web service calls, or other async operations.
                 * @scope CLIENT_WEB|CLIENT_MOBILE|SERVER
                 * @param {Item} [item] - The line item being processed. Optional parameter - may be undefined when setting ShipTo at header level
                 * @returns {Promise<string> | string | void} - Return a string to set a custom ShipTo ID, a Promise resolving to a string for async operations, or undefined/void to use the standard logic
                 *
                 * @example <caption>Synchronous ShipTo selection based on company code</caption>
                 * Common.GetDefaultShipToID = function(item)
                 * {
                 *     const companyCode = Data.GetValue("CompanyCode__");
                 *     switch (companyCode) {
                 *         case "US01":
                 *             return "WAREHOUSE_US_EAST";
                 *         case "US02":
                 *             return "WAREHOUSE_US_WEST";
                 *         case "FR01":
                 *             return "WAREHOUSE_FRANCE";
                 *         default:
                 *             // Return undefined to use standard logic
                 *             return;
                 *     }
                 * };
                 *
                 * @example <caption>Asynchronous ShipTo lookup from user profile or master data</caption>
                 * Common.GetDefaultShipToID = function(item)
                 * {
                 *     const requesterLogin = Data.GetValue("RequisitionInitiator__");
                 *
                 *     return Sys.GenericAPI.PromisedQuery({
                 *         table: "User Profile__",
                 *         filter: Sys.Helpers.LdapUtil.FilterEqual("Login__", requesterLogin),
                 *         attributes: ["DefaultShipToID__", "Department__"]
                 *     }).Then(function(userProfiles) {
                 *         if (userProfiles && userProfiles.length > 0) {
                 *             const userProfile = userProfiles[0];
                 *
                 *             // Use user-specific ShipTo if available
                 *             if (userProfile.DefaultShipToID__) {
                 *                 return userProfile.DefaultShipToID__;
                 *             }
                 *
                 *             // Fallback to department-based ShipTo
                 *             switch (userProfile.Department__) {
                 *                 case "IT":
                 *                     return "SHIPTO_IT_DEPT";
                 *                 case "HR":
                 *                     return "SHIPTO_HR_DEPT";
                 *                 default:
                 *                     return "SHIPTO_DEFAULT";
                 *             }
                 *         }
                 *
                 *         // Return null to use standard logic if no user profile found
                 *         return null;
                 *     });
                 * };
                 */
                Common.GetDefaultShipToID = function (item) {
                };
                /**
                 * @method Lib.PR.Customization.Common.CustomizeRecognition
                 * @description Customizes the fields to extract and the extraction methods used for the recognition process
                 * This function allows you to:
                 * - Add, remove, or modify fields in the extraction process.
                 * - Add a custom extraction method in complement of the standard ones.
                 * - Modify the ChatGPT prompts and parameters.
                 * - Remove a specific extraction method.
                 * - Disable the extraction process.
                 * - Change ChatGPT settings / model.
                 * - Use a custom OCR engine.
                 * - Add custom traces to the engine logger.
                 * - More customizations are possible, refer to the documentation or contact PAC team for more details.
                 *
                 * @since 346
                 *
                 * @param {Sys.RecognitionEngine.IRecognitionParameters} recognitionParameters
                 * @param {Sys.RecognitionEngine.ILogger} logger
                 * @returns {void}
                 *
                 * @example
                 *  export const CustomizeRecognition = async (
                 * 		recognitionParameters: Sys.RecognitionEngine.IRecognitionParameters,
                 * 		logger: Sys.RecognitionEngine.ILogger
                 * 	): Promise<void> =>
                 *  {
                 * 		logger.Log("Disabling recognition");
                 * 		recognitionParameters.recognitionMethods.DisableRecognition();
                 *
                 * 		logger.Log("Updating GPT parameters");
                 * 		const recognitionMethod = recognitionParameters.recognitionMethods.Get<Sys.RecognitionEngine.LLMRecognitionMethod>("GPT_PR_Completion");
                 * 		recognitionMethod.model = "GPT4oMini";
                 * 		recognitionMethod.maxTokens = 16000;
                 * 		recognitionMethod.temperature = 0.5;
                 *
                 * 		logger.Log("Updating GPT prompt");
                 * 		// Force translation in French
                 * 		recognitionMethod.UpdateInstruction("__DescriptionRule__", "Description field must contain a brief summary in French of what the quotation is for, extracted from the document content.");
                 * 		recognitionMethod.UpdateInstruction("__NoTranslationRule__", "Translate all content explicitly into French, regardless of the source document language.");
                 * 		// Force french date format conversion
                 * 		recognitionMethod.AddInstruction("__Z_FrenchDateConversionRule__", "All dates in the received document are in French format (day/month/year) and must be converted to the international ISO 8601 format.");
                 * 		// Resolve variable
                 * 		recognitionMethod.AddInstruction("__Z_CustomField", "Possible values for CustomField are: {{ Z_CustomFieldPossibleValues }}.");
                 * 		recognitionMethod.AddPropertiesToInputGenerator({
                 * 			Z_CustomFieldPossibleValues: (await Sys.GenericAPI.PromisedQuery({...})).map((item: any) => item.Name__).join(", ")
                 * 		});
                 *
                 * 		logger.Log("Adding a custom recognition method **after** GPT, then remove the existing one.");
                 * 		recognitionParameters.recognitionMethods.AddLLMMethod({...}).Remove("GPT_PR_Completion");
                 *
                 * 		recognitionParameters.GetDocumentString = async (): Promise<string> =>
                 * 		{
                 * 			logger.Log("Calling custom OCR engine");
                 * 			// Call to custom OCR engine and return the extracted text
                 * 			return "Custom OCR extracted text";
                 * 		};
                 *
                 * 		logger.Log("Add a custom log before each element processing");
                 * 		recognitionParameters.PreAction = Sys.Helpers.Wrap(
                 * 			recognitionParameters.PreAction,
                 * 			(originalFn, elementToProcess) =>
                 * 			{
                 * 				logger.Log(`Starting to process the [${typeof elementToProcess}] named "${elementToProcess.identifier}"`);
                 * 				return originalFn.apply(elementToProcess);
                 * 			}
                 * 		);
                 *
                 * 		logger.Log("Adding a header field to extract to the existing recognition method");
                 * 		recognitionParameters.dataToExtract.AddField(new Sys.RecognitionEngine.FieldToExtract({...}));
                 *
                 * 		logger.Log("Removing a header field to extract to the existing recognition method");
                 * 		recognitionParameters.dataToExtract.Remove("RequisitionNumber__");
                 *
                 * 		logger.Log("Adding a table column to extract to the existing recognition method");
                 * 		recognitionParameters.dataToExtract.AddOrGetTable("LineItems__", (tableToExtract: Sys.RecognitionEngine.TableToExtract) =>
                 * 		{
                 * 			tableToExtract.AddField(new Sys.RecognitionEngine.FieldToExtract({...}));
                 * 		});
                 *
                 * 		logger.Log("Removing a table column to extract from the existing recognition method");
                 * 		recognitionParameters.dataToExtract.GetTable("LineItems__").Remove("ItemUnitPrice__");
                 *
                 * 		logger.Log("Provide a custom validity condition for the Date__ field");
                 * 		const assert = Sys.RecognitionEngine.Assert;
                 * 		const assertFormValue = Sys.RecognitionEngine.FormValueDate;
                 * 		const assertExtractedValue = Sys.RecognitionEngine.ExtractedValueDate;
                 * 		recognitionParameters.dataToExtract.GetField("Date__").SetIf = assert.And(
                 * 			assert.Or(
                 * 				assertFormValue.IsEmpty(),
                 * 				assertFormValue.HasDefaultValue()
                 * 			),
                 * 			assert.Not(assertExtractedValue.IsEmpty()),
                 * 			assert.Not(assertExtractedValue.HasDefaultValue()),
                 * 			assertExtractedValue.IsValidDate(),
                 * 			assertExtractedValue.IsInTheFutureOrToday(),
                 * 			assertExtractedValue.IsLessThanOneYearOld(),
                 * 			(fieldToProcess: Sys.RecognitionEngine.FieldToProcess) =>
                 * 			{
                 * 				// Custom condition, return true if the condition is validated, false otherwise
                 * 				const value: Date = fieldToProcess.extractedValue;
                 * 				return value !== null && value.getDay() !== 0; // Example: date is not a Sunday
                 * 			}
                 * 			// You can also inherit from Sys.RecognitionEngine.Asserter to create reusable custom assertions
                 * 		);
                 *
                 * 		logger.Log("Adding a resolver to parse string dates into Date objects");
                 * 		recognitionMethod.aiResultResolvers["Z_ParseDatesResolver"] = (aiResult: Sys.RecognitionEngine.AIResult, params: Sys.RecognitionEngine.RecognitionMethodParameters): void =>
                 * 		{
                 * 			const requestedDeliveryDateField: Sys.RecognitionEngine.AIResultField = aiResult.GetField("RequestedDeliveryDate__");
                 * 			const extractedValue: string = requestedDeliveryDateField.value;
                 * 			requestedDeliveryDateField.value = new Date(extractedValue);
                 * 		};
                 *
                 * 		logger.Log("Modifying an existing resolver to implement a new behavior");
                 * 		recognitionMethod.aiResultResolvers["resolverName"] = (aiResult: Sys.RecognitionEngine.AIResult, params: Sys.RecognitionEngine.RecognitionMethodParameters): void =>
                 * 		{
                 * 			// new behaviour, transforming aiResult directly
                 * 		};
                 * };
                 */
                Common.CustomizeRecognition = async (recognitionParameters, logger) => {
                };
            })(Common = Customization.Common || (Customization.Common = {}));
        })(Customization = PR.Customization || (PR.Customization = {}));
    })(PR = Lib.PR || (Lib.PR = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_PR_CUSTOMIZATION_COMMON_SAMPLE.js.map