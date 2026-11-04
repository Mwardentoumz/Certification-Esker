"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CONTRACT_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Contract scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Contract Server script customization callbacks
 * @namespace Lib.Contract.Customization.Server
 */
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                * @method Lib.Contract.Customization.Server.OnValidationScriptEnd
                * @description Allows you to perform operations after the contract process validation. This user exit is called at the end of the validation script of the contract process.
                * @since 158
                * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                * @param {boolean} isRecallScriptScheduled Boolean value indicating if the user exit is expected to be called again in the current workflow step. The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step. This parameter is set to false after the last execution of the RecallScript function.
                * 		Possible values are:
                * 			true: The user exit is expected to be called again in the current workflow step.
                * 			false: The user exit is not expected to be called again in the current workflow step.
                * @example In the following example, when the contract is activated, we call a fake function to create contract in ERP
            
                    OnValidationScriptEnd: function (currentAction, currentName, isRecallScriptScheduled)
                    {
                        if (Variable.GetValueAsString("PreviousContractStatus") === "ToValidate"
                            && (Data.GetValue("ContractStatus__") === "Active" || Data.GetValue("ContractStatus__") === "ApprovedPendingActivation"))
                        {
                            Log.Info("This contract is now active");
                            Log.Info("ERP called to set the new status");
                            const contractInfo = {
                                ContractReference: Data.GetValue("ReferenceNumber__"),
                                ContractName: Data.GetValue("ContractName__"),
                                VendorNumber: Data.GetValue("VendorNumber__"),
                                StartDate: Data.GetValue("StartDate__"),
                                EndDate: Data.GetValue("EndDate__")
                            };
                            //Lib.ERP.CreateContract(contractInfo);
                        }
            
                        Log.Info("PreviousContractStatus set  to : " + Data.GetValue("ContractStatus__"));
                        Variable.SetValueAsString("PreviousContractStatus", Data.GetValue("ContractStatus__"));
                    }
                */
                Server.OnValidationScriptEnd = function (currentAction, currentName, isRecallScriptScheduled) { };
                /**
                 * @method Lib.Contract.Customization.Server.OnExtractionScriptEnd
                 * @description Allows you to perform operations after the contract process extraction. This user exit is called at the end of the extraction script of the contract process.
                 * @since 337
                 * @param currentAction
                 * @param currentName
                 * @example In the following example, we initialize a variable to store the previous contract status
                 * <pre><code>
                 * OnExtractionScriptEnd: function (currentAction, currentName)
                 * {
                 * 		Log.Info("PreviousContractStatus set to : " + Data.GetValue("ContractStatus__"));
                 * 		Data.SetValue("Z_PreviousContractStatus__", Data.GetValue("ContractStatus__"));
                 * }
                 * </code></pre>
                 */
                Server.OnExtractionScriptEnd = function (currentAction, currentName) { };
                /**
                 * @method Lib.Contract.Customization.Server.OnSendEmailNotification
                 * @description Allows you to modify the email notifications. This user exit is called before the notification is sent.
                 * @since 314
                 * @param {Sys.EmailNotification.SendEmailNotificationWithUserIdOptions} emailOptions
                 * @example
                 *  <pre><code>
                 * OnSendEmailNotification: function (options)
                 * {
                 * 		return false; // disable email notification
                 * }
                 * </code></pre>
                 */
                Server.OnSendEmailNotification = function (emailOptions) {
                    return true;
                };
                /**
                 * @method Lib.Contract.Customization.Server.GetFraudulentClauses
                 * @description NOT FOR PRODUCTION USE, UNSTABLE API !
                 * Allows you to modify the AI analyse of the fraudulent clauses.
                 * @since 322
                 * @param {Sys.EmailNotification.SendEmailNotificationWithUserIdOptions} emailOptions
                 * @example
                 * <pre><code>
                 * 		return policies.map((policy, index) => ({
                 * 			name: policy.name,
                 * 			sentence: `sentence #${index}`,
                 * 			commentary: `prompt was: ${policy.prompt}`,
                 * 			severity: policy.severity
                 * 		}));
                 * </code></pre>
                 */
                Server.GetFraudulentClauses = function (documentOCR, policies) {
                    return null;
                };
                /**
                 * @method Lib.Contract.Customization.Server.CustomizeRecognition
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
                 * 		const recognitionMethod = recognitionParameters.recognitionMethods.Get<Sys.RecognitionEngine.LLMRecognitionMethod>("GPT_Contract_Completion");
                 * 		recognitionMethod.model = "GPT4oMini";
                 * 		recognitionMethod.maxTokens = 16000;
                 * 		recognitionMethod.temperature = 0.5;
                 *
                 * 		logger.Log("Updating GPT prompt");
                 * 		recognitionMethod.UpdateInstruction("__Step3__", "Your custom instruction...");
                 * 		// Force french date format conversion
                 * 		recognitionMethod.AddInstruction("__Z_FrenchDateConversionRule__", "All dates in the received document are in French format (day/month/year) and must be converted to the international ISO 8601 format.");
                 * 		// Resolve variable
                 * 		recognitionMethod.AddInstruction("__Z_CustomField", "Possible values for CustomField are: {{ Z_CustomFieldPossibleValues }}.");
                 * 		recognitionMethod.AddPropertiesToInputGenerator({
                 * 			Z_CustomFieldPossibleValues: (await Sys.GenericAPI.PromisedQuery({...})).map((item: any) => item.Name__).join(", ")
                 * 		});
                 *
                 * 		logger.Log("Adding a custom recognition method **after** GPT, then remove the existing one.");
                 * 		recognitionParameters.recognitionMethods.AddLLMMethod({...}).Remove("GPT_Contract_Completion");
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
                 * 		recognitionParameters.dataToExtract.Remove("ReferenceNumber__");
                 *
                 * 		logger.Log("Adding a table column to extract to the existing recognition method");
                 * 		recognitionParameters.dataToExtract.AddOrGetTable("ItemsToCreate__", (tableToExtract: Sys.RecognitionEngine.TableToExtract) =>
                 * 		{
                 * 			tableToExtract.AddField(new Sys.RecognitionEngine.FieldToExtract({...}));
                 * 		});
                 *
                 * 		logger.Log("Removing a table column to extract from the existing recognition method");
                 * 		recognitionParameters.dataToExtract.GetTable("ItemsToCreate__").Remove("ItemUnitPrice__");
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
                Server.CustomizeRecognition = async (recognitionParameters, logger) => {
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = Contract.Customization || (Contract.Customization = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CONTRACT_CUSTOMIZATION_SERVER_SAMPLE.js.map