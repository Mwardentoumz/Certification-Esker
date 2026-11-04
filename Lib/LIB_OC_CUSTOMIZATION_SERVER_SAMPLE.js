"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_OC_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Order Confirmation scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Order Confirmation Server script customization callbacks
 * @namespace Lib.OC.Customization.Server
 */
var Lib;
(function (Lib) {
    var OC;
    (function (OC) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.OC.Customization.Server.CustomizeRecognition
                 * @description Customizes the fields to extract and the extraction methods used for the recognition process (autolearning + AI).
                 * This function allows you to:
                 * - Add, remove, or modify fields in the extraction process.
                 * - Add a custom extraction method in complement of the standard ones.
                 * - Modify the ChatGPT prompts.
                 * - Remove a specific extraction method.
                 * - Disable the first-time recognition process.
                 * - Change ChatGPT settings / model.
                 * - Use a custom OCR engine.
                 * - Add custom traces to the engine logger.
                 * - Customize the way extracted line items are mapped with the form line items
                 *
                 * @since 325
                 *
                 * @param {Lib.Purchasing.OC.Recognition.RecognitionParameters} recognitionParameters
                 * @returns {void}
                 *
                 * @example
                 * For example, the following implementation:
                 * - Adds a new field to the extraction process (no prompt customization required).
                 * - Removes a field from the extraction process (no prompt customization required).
                 * - Improves a field description.
                 * - Disables the recognition process by clearing all extraction methods.
                 * - Adds a custom extraction method in addition to the existing ones.
                 * - Logs the details of the custom extraction method.
                 * - Removes a specific extraction method (FTR_AP_Regex).
                 * - Modifies the ChatGPT prompt and model used for extraction.
                 * - Calls a custom OCR engine to retrieve the OCR text.
                 * - Customizes the document culture for a specific vendor.
                 * - Disables GPT line item recognition when the OC is created on the client side (to reduce processing time).
                 * - Customizes the way extracted line items are mapped with the form line items.
                 *
                 * 	export const CustomizeRecognition = async (recognitionParameters: Lib.Purchasing.OC.Recognition.RecognitionParameters): Promise<void> =>
                 * 	{
                 * 		// Adding a new field to the extraction process --> no prompt customization required
                 * 		recognitionParameters.fieldsToExtract.AddField({
                 * 			Comment__: new Lib.Purchasing.OC.Recognition.FieldToExtractMetadata({
                 * 				label: "Order confirmation comment",
                 * 				description: "Supplier's comment associated with the Order Confirmation only, include it if the text indicates it is a comment.",
                 * 				type: "string",
                 * 				// optional SetValue, Data.SetValue by default, will be called again (as a revert) with an empty value if IsValid returns false
                 * 				// optional IsValid, Sys.Helpers.IsEmpty(Data.GetValue) by default
                 * 			})
                 * 		});
                 *
                 * 		// Removing a field from the extraction process --> no prompt customization required
                 * 		recognitionParameters.fieldsToExtract.RemoveField("OCNumber__");
                 *
                 * 		// Improving a field description
                 * 		await Sys.Parameters.GetInstance("PAC").PromisedIsReady();
                 * 		const numberFormatPO: string = Sys.Parameters.GetInstance("PAC").GetParameter("NumberFormatPO").replace("$seq$", "");
                 * 		recognitionParameters.fieldsToExtract.GetField("PONumber__").description += ` It begins with ${numberFormatPO} followed by 8 digits, forming a 10-digit number.`;
                 *
                 * 		// Helping ChatGPT extract specific documents by providing the precise labels from the client's confirmation documents
                 * 		recognitionParameters.fieldsToExtract.GetField("OCNumber__").examplesOfLabelsInOCR.push("Acknowledgment #");
                 *
                 * 		// Disabling the first time recognition process (clear all extraction methods)
                 * 		recognitionParameters.recognitionMethods.DisableRecognition();
                 *
                 * 		// Adding a custom extraction method
                 * 		recognitionParameters.recognitionMethods.Add({
                 * 			name: "Custom_FTR_Synergy",
                 * 			Extract: (
                 * 				fieldsToExtract: Lib.Purchasing.OC.Recognition.FieldsToExtract,
                 * 				alreadyExtractedData: Lib.Purchasing.OC.Recognition.ExtractedData,
                 * 				documentOCR: string,
                 * 				documentCulture: Lib.Purchasing.OC.Recognition.DocumentCulture,
                 * 				logger: Lib.Purchasing.OC.Recognition.ILogger
                 * 			): Lib.Purchasing.OC.Recognition.ResultFromAI =>
                 * 			{
                 * 				// Instantiate a ResultFromAI object
                 * 				const resultFromAI: Lib.Purchasing.OC.Recognition.ResultFromAI = new Lib.Purchasing.OC.Recognition.ResultFromAI();
                 *
                 * 				// Extract the way you want
                 * 				const jsonString: string = Process.GetSynergyExtraction("SynergyForInvoiceHeader");
                 * 				const extraction = JSON.parse(jsonString);
                 * 				const extractedPONumberObject = extraction["InvoiceNumber"];
                 *
                 * 				// Fill the result object with the custom extraction using the provided AddFieldIfNotNull and AddLineItemIfNotNull methods
                 * 				resultFromAI.AddFieldIfNotNull("PONumber__", extractedPONumberObject?.[0]?.parsed_value, extractedPONumberObject?.[0]?.areas?.[0]);
                 *
                 * 				if (Sys.Helpers.IsEmpty(extractedPONumberObject))
                 * 				{
                 * 					// Log the extraction result in the internal logger in the internal logger (not in the framework logs)
                 * 					logger.Log("No PONumber found in Synergy extraction.");
                 * 				}
                 * 				else
                 * 				{
                 * 					// Log the extraction result and the extracted value in the internal logger (not in the framework logs)
                 * 					logger.Log(`PONumber extracted from Synergy`, { extractedPONumberObject });
                 * 				}
                 *
                 * 				// Return the ResultFromAI filled or empty
                 * 				return resultFromAI;
                 * 			},
                 * 			ExecuteOnlyIf: () => Sys.Helpers.Data.IsTrue(Variable.GetValueAsString("UseSynergyInsteadOfAPRegex"))
                 * 		});
                 *
                 * 		// Removing an extraction method (FTR_AP_Regex)
                 * 		recognitionParameters.recognitionMethods.Remove("FTR_AP_Regex");
                 *
                 * 		// Changing the ChatGPT prompt
                 * 		const chatGPTMethod: Lib.Purchasing.OC.Recognition.IRecognitionMethod = recognitionParameters.recognitionMethods.Get("FTR_ChatGPT_Header");
                 * 		chatGPTMethod.name = "Custom_ChatGPT_Header";
                 * 		chatGPTMethod.Extract = async (
                 * 			fieldsToExtract: Lib.Purchasing.OC.Recognition.FieldsToExtract,
                 * 			alreadyExtractedData: Lib.Purchasing.OC.Recognition.ExtractedData,
                 * 			documentOCR: string,
                 * 			documentCulture: Lib.Purchasing.OC.Recognition.DocumentCulture,
                 * 			logger: Lib.Purchasing.OC.Recognition.ILogger
                 * 		) =>
                 * 		{
                 * 			let myCustomPrompt: string = "my custom prompt as string";
                 * 			myCustomPrompt += "with fields:\n";
                 * 			fieldsToExtract.ForEachFieldToExtract((fieldName: string, fieldToExtractMetadata: Lib.Purchasing.OC.Recognition.FieldToExtractMetadata) =>
                 * 			{
                 * 				myCustomPrompt += `- ${fieldName} (${fieldToExtractMetadata.label} (${fieldToExtractMetadata.description})\n`;
                 * 			});
                 * 			myCustomPrompt += "some data has already been extracted:\n";
                 * 			alreadyExtractedData.ForEachField((fieldName: string, extractedField: Lib.Purchasing.OC.Recognition.ExtractedField) =>
                 * 			{
                 * 				myCustomPrompt += `- ${fieldName} (${extractedField.value})\n`;
                 * 			});
                 * 			myCustomPrompt += `The culture is: ${documentCulture.culture}`;
                 *
                 * 			return Lib.Purchasing.OC.Recognition.GPT.Extract([
                 * 				{
                 * 					content: "my custom prompt",
                 * 					role: "system"
                 * 				},
                 * 				{
                 * 					content: documentOCR, // you can pass another document OCR or input if you want
                 * 					role: "user"
                 * 				}
                 * 			], logger);
                 * 		};
                 *
                 * 		// Changing ChatGPT parameters
                 * 		Sys.Purchasing.OC.Recognition.GPT.MAX_TOKENS = 3000;
                 * 		Sys.Purchasing.OC.Recognition.GPT.TEMPERATURE = 0.2;
                 * 		Sys.Purchasing.OC.Recognition.GPT.MODEL = "GPT4oMini";
                 *
                 * 		// Changing the OCR engine
                 * 		recognitionParameters.GetStringDocument = async (logger: Lib.Purchasing.OC.Recognition.ILogger): Promise<string> =>
                 * 		{
                 * 			let ws: HttpRequest = Process.CreateHttpRequest();
                 * 			let httpResponse: HttpResponse = ws.Call({...});
                 * 			if (httpResponse.status === 200 && httpResponse.data)
                 * 			{
                 * 				return httpResponse.data;
                 * 			}
                 * 			else
                 * 			{
                 * 				logger.Log("Error while calling external OCR service", { httpResponse });
                 * 				Log.Error("[CustomizeRecognition] External OCR failed, calling standard OCR");
                 * 				return Lib.Purchasing.OC.Recognition.StandardGetStringDocument(logger);
                 * 			}
                 * 		};
                 *
                 * 		// Disables GPT line item recognition when the OC is created on the client side
                 * 		recognitionParameters.recognitionMethods.Get("FTR_ChatGPT_LineItems")
                 * 			.ExecuteOnlyIf = () => Variable.GetValueAsString("IsCreatedFrom") !== "ClientSide";
                 *
                 * 		// Customizing the document culture for a specific vendor
                 * 		recognitionParameters.GetDocumentCulture = async (logger: Lib.Purchasing.OC.Recognition.ILogger): Promise<Lib.Purchasing.OC.Recognition.DocumentCulture> =>
                 * 		{
                 * 			const vendorNumber: string = Data.GetValue("VendorNumber__");
                 * 			if (vendorNumber === "ACME1234")
                 * 			{
                 * 				return new Lib.Purchasing.OC.Recognition.DocumentCulture('en-US', 'en');
                 * 			}
                 *
                 * 			return Lib.Purchasing.OC.Recognition.StandardGetDocumentCulture(logger);
                 * 		};
                 *
                 * 		// Customizing the way extracted line items are mapped with the form line items
                 * 		recognitionParameters.MatchAllExtractedLinesToFormLines = async (
                 * 			lineItemValuesAsObject: Record<string, any>,
                 * 			resultFromAI: Lib.Purchasing.OC.Recognition.ResultFromAI,
                 * 			recognitionMethod: Lib.Purchasing.OC.Recognition.RecognitionMethod,
                 * 			logger: Lib.Purchasing.OC.Recognition.ILogger
                 * 		): Promise<Lib.Purchasing.OC.Recognition.ResultFromAI> =>
                 * 		{
                 * 			// You can call standard method and bring your own rules using the Lib.Purchasing.OC.Recognition.LineItemsMapper
                 * 			const myCustomRules: Lib.Purchasing.OC.Recognition.LineItemsMapperRule[] = [
                 * 				// your custom rules, you can also invoke standard rules in the order you want
                 * 			];
                 * 			return Lib.Purchasing.OC.Recognition.StandardMatchAllExtractedLinesToFormLines(lineItemValuesAsObject, resultFromAI, recognitionMethod, logger, myCustomRules);
                 *
                 * 			// Or you can create your own method and return the resultFromAI object
                 * 			const mappedResultFromAI: ResultFromAI = new ResultFromAI();
                 * 			// your custom logic
                 * 			return mappedResultFromAI;
                 * 		};
                 *
                 * 		// Enables advanced logging for GPT calls (prompts + raw responses) — this can be set in this user exit
                 * 		Variable.SetValueAsString("RecognitionDebugModeEnabled", "true");
                 * 		// To access the logs after recognition is complete, open the Chrome debugger and type:
                 * 		// - SDK.Lib.Purchasing.OC.Recognition.DebuggingHelper.GetSummaryLogs()       -> main recognition data
                 * 		// - SDK.Lib.Purchasing.OC.Recognition.DebuggingHelper.GetExecutionLogs()     -> all traces
                 * 		// - SDK.Lib.Purchasing.OC.Recognition.DebuggingHelper.GetDetailedLogs("GPT") -> specific traces
                 * 		// - SDK.Lib.Purchasing.OC.Recognition.DebuggingHelper.GetExtractionResults() -> recognition object
                 *
                 * 		return;
                 * 	};
                 */
                Server.CustomizeRecognition = async (recognitionParameters) => {
                    return;
                };
                /**
                 * @method Lib.OC.Customization.Server.GetListOfExtraUsersWithReadRight
                 * @description Allows you to return a list of user to give read right to.
                 * @since 317
                 * @returns {Array<string>} array of login to give read rights to
                 * @example
                 * For exemple, always add read rights to buyer@company.com.
                 * <pre><code>
                 * 	GetListOfExtraUsersWithReadRight: function ()
                 * 	{
                 * 		return ["buyer@company.com"];
                 * 	}
                 * </code></pre>
                 */
                Server.GetListOfExtraUsersWithReadRight = () => {
                    return [];
                };
                /**
                * @typedef {Object} Lib.OC.Customization.Server.Exporter.ColumnRules
                * @property {string[]} excludedColumns list of excluded fields
                */
                /**
                * @typedef {Object} Lib.OC.Customization.Server.Exporter.FieldsRules
                * List the rules for flexible form inclusion or exclusion
                * @property {string[]} includedFields list of included fields used when exportMode = 0 (allExcept)
                * @property {string[]} excludedFields list of excluded fields used when exportMode = 1 (onlyIncluded)
                * @property {string[]} includedSystemFields list of system fields to include (always available)
                */
                /**
                * @typedef Lib.OC.Customization.Server.Exporter.ExcludedConditionalColumns
                * excludedConditionalColumn property defintion
                * @property {string} fieldConditional The column name used to compare values for each line
                * @property {Object.<string, Lib.OC.Customization.Server.Exporter.ColumnRules>} conditionalTable  "Value to compare"
                */
                /**
                * @typedef {Object} Lib.OC.Customization.Server.Exporter.TablesRule
                * List of options for table behavior as follow
                * @property {string} name table name (ex. "LineItems\_\_")
                * @property {boolean} includedFullTable true/false, specify if the whole table should be included from generation even if there are no lines (to define table columns).
                * Used when exportMode = 1 (onlyIncluded).
                * @property {boolean} excludedFullTable true/false, specify if the whole table should be excluded from generation.
                * Used when exportMode = 0 (allExcept).
                * @property {string[]} excludedColumns list of table columns to exclude. Used when exportMode = 0 (allExcept).
                * Exclusive with option excludedConditionalColumns
                * @property {string[]} includedColumns list of table columns which columns are always added in generation.
                * Used when exportMode = 1 (onlyIncluded)
                * @property {string[]} requiredColumns list of table columns which values are required for generation. When the table line has an empty value for required columns the line is not exported.
                * Option used in both export modes (onlyincluded and allExcept)
                * @property {Lib.OC.Customization.Server.Exporter.ExcludedConditionalColumns} excludedConditionalColumns list of table columns to exclude after an equal comparison to a specified field.
                * Exclusive with option excludedColumns
                * @example { name: "ApproversList\_\_", requiredColumns: ["ApproverID\_\_"], excludedColumns: ["ApproverAction\_\_", "LineMarker\_\_", "WorkflowIndex\_\_", "WRKFIsGroup\_\_"] }
                */
                /**
                 * @namespace Lib.OC.Customization.Server.Exporter
                 */
                Server.Exporter = {
                    /**
                     * @method Lib.OC.Customization.Server.Exporter.GetFieldsRules
                     * @description
                     * Allows you to customize the OC XML file generated by the Order Confirmation process.
                     * The customizations made through this user exit concern only XML nodes originating from the Order Confirmation process header fields.
                     * This user exit is called from at the OC final approval.
                     * @param {number} exportMode The current exportMode integer value (0=allExcept or 1=onlyIncluded)
                     * @param {Lib.OC.Customization.Server.Exporter.FieldsRules} fieldsRules The current rules for the flexible form fields
                     * @returns {Lib.OC.Customization.Server.Exporter.FieldsRules} The updated rules about the fields to include or exclude
                     * @example
                     * <pre><code>
                     * GetFieldsRules: function (exportMode, fieldsRules)
                     * {
                     *	// In exclude export mode remove the PONumber__ field in xml export
                     *	if (exportMode == 0)
                     *	{
                     *		fieldsRules.excludedFields.push("PONumber__");
                     *	}
                     *	return fieldsRules;
                     * }
                     * </code></pre>
                     * <pre><code>
                     * GetFieldsRules: function (exportMode, fieldsRules)
                     * {
                     *	// In include export mode add my customized field in xml export
                     *	if (exportMode == 1)
                     *	{
                     *		fieldsRules.includedFields.push("Z_CustomizedField__");
                     *	}
                     *
                     *  // export a system field
                     *  fieldsRules.includedSystemFields.push("ValidationUrl");
                     *
                     *	return fieldsRules;
                     * }
                     * </code></pre>
                     */
                    GetFieldsRules: function (exportMode, fieldsRules) {
                        fieldsRules.includedSystemFields.push("ValidationUrl");
                        return fieldsRules;
                    },
                    /**
                     * @method Lib.OC.Customization.Server.Exporter.GetXmlFilename
                     * @description
                     * Allows you to customize the OC XML file  name generated by the Order Confirmation process.
                     * This user exit is called from at the OC final approval.
                     * @returns {string} The name that will be used for the XML file
                     * @example
                     * <pre><code>
                     * GetXmlFilename: function ()
                     * {
                     *	return "MyCustomOCFileName";
                     * }
                     * </code></pre>
                     */
                    GetXmlFilename: function () {
                        return null;
                    },
                    /**
                     * @method Lib.OC.Customization.Server.Exporter.GetTablesRules
                     * @description
                     * Allows you to customize the OC XML file generated by the Order confirmation process. The customizations made through this user exit concern only XML nodes originating from the Order confirmation process tables.
                     * This user exit is called from the validation script of the Order confirmation process, when the OC is submitted
                     * @param {number} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
                     * @param {Lib.OC.Customization.Server.Exporter.TableRule[]} tablesRules The current rules for the flexible form tables
                     * @returns {Lib.OC.Customization.Server.Exporter.TableRule[]} The updated rules about the tables to include or exclude
                     * @example
                     * <pre><code>
                     * // Exclude WorkflowTable table and exclude LineItems__ ItemBuyerDN__ field
                     * GetTablesRules: function (exportMode, tablesRules)
                     * {
                     *	if (exportMode == 0)
                     *	{
                     *		for (var i = 0; i < tablesRules.length; i++)
                     *		{
                     *			if (tablesRules[i].name === "WorkflowTable__")
                     *			{
                     *				tablesRules[i].excludedFullTable = true;
                     * 			}
                     *
                     *			if (tablesRules[i].name === "LineItems__")
                     *			{
                     *				tablesRules[i]["excludedColumns"] = ["ItemBuyerDN__"];
                     * 			}
                     *		}
                     *	}
                     *	return tablesRules;
                     * }
                     * </code></pre>
                     */
                    GetTablesRules: function (exportMode, tablesRules) {
                        return tablesRules;
                    },
                    /**
                     * @method Lib.OC.Customization.Server.Exporter.GetModifiedNodeNameMappings
                     * @description
                     * Allows you to specify names for the XML nodes corresponding to custom fields of the Order confirmation process.
                     * This user exit is called from the validation script of the Order confirmation process, when the OC is submited
                     * @param {number} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
                     * @param {Object.<string, Object.<string, string>>} modifiedNodeNameMappings The current fields mapping
                     * @returns {Object.<string, Object.<string, string>>} The updated fields mapping to include or exclude
                     * @example
                     * <pre><code>
                     * // Add a mapping to put the value of custom field Z_CustomizedField__ to xml field AdditionalField1
                     * GetModifiedNodeNameMappings: function (exportMode, modifiedNodeNameMappings)
                     * {
                     *	modifiedNodeNameMappings.Z_CustomizedField__ = "AdditionalField1";
                     *	return modifiedNodeNameMappings;
                     * }
                     * </code></pre>
                     */
                    GetModifiedNodeNameMappings: function (exportMode, modifiedNodeNameMappings) {
                        return modifiedNodeNameMappings;
                    },
                    /**
                     * @method Lib.OC.Customization.Server.Exporter.GetFieldValuesMapping
                     * @description
                     * Allows you to override some fields values in the resulting XML.
                     * This user exit is called from the validation script of the Order confirmation process, when the OC is submited
                     * @param {Object.<string, Object.<string, string>>} modifiedFieldValuesMapping The current fields values mapping
                     * @returns {Object.<string, Object.<string, string>>} The updated fields values
                     * @example
                     * <pre><code>
                     * // Add a mapping to set the Z_CustomizedField__ value to "Customized value"
                     * GetFieldValuesMapping: function (modifiedFieldValuesMapping)
                     * {
                     * 	modifiedFieldValuesMapping.Z_CustomizedField__ = "Customized value";
                     *	return modifiedFieldValuesMapping;
                     * }
                     * </code></pre>
                     */
                    GetFieldValuesMapping: function (modifiedFieldValuesMapping) {
                        return modifiedFieldValuesMapping;
                    },
                    /**
                     * @method Lib.OC.Customization.Server.Exporter.GetHeaderColumnsList
                     * @since 330
                     * @description
                     * Allows you to customize the header fields to be exported in the resulting XML (including the order).
                     * This user exit is called from the validation script of the Order confirmation process, when the OC is submitted
                     * @param {Array<Object<string, any>>} fieldList The list of header fields with associated values. The list can be filtered or reordered before the export in the XML.
                     * @example <caption>Move the first field in the 4th position</caption>
                     * Server.Exporter.GetHeaderColumnsList = function (fieldList)
                     * {
                     *   // move first field in 4th position
                     *   var fieldToMove = fieldList.shift();
                     *   fieldList.splice(3, 0, fieldToMove);
                     * }
                     */
                    GetHeaderColumnsList: function (fieldList) {
                    },
                    /**
                     * @method Lib.OC.Customization.Server.Exporter.GetFile
                     * @description
                     * Allows you to customize the OC file generated by the Order Confirmation process.
                     * This user exit is called from at the OC final approval.
                     * @returns {File} The file that will be send in the outbound channel
                     * @example
                     * <pre><code>
                     * GetFile: function ()
                     * {
                     *	const file = TemporaryFile.CreateFile("json", "utf16");
                     *	const json = Lib.FlexibleFormToJSON.Serializer.GetJSON();
                     *	TemporaryFile.Append(file, json, 0);
                     *	return file;
                     * }
                     * </code></pre>
                     */
                    GetFile: function () {
                        return null;
                    }
                };
                /**
                 * @method Lib.OC.Customization.Server.OnUnknownAction
                 * @description Allows you to customize how the action is processed when the validation script executes an unknown action.
                 * 		This user exit is called when the validation script of the Order Confirmation process is triggered by an unknown action.
                 * @since 328
                 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                 * @return {boolean} Boolean value indicating whether the action has been handled. Possible values are:
                 * 		true: The action has been handled.
                 * 		false: The action has not been handled.
                 * @example This user exit logs the unknown actions details.
                 *	OnUnknownAction: function (currentAction, currentName)
                 *	{
                 *		Log.Error(currentAction + "-" + currentName);
                 *	}
                 */
                Server.OnUnknownAction = function (currentAction, currentName) {
                    return false;
                };
                /**
                 * @method Lib.OC.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to perform operations after the Order Confirmation process validation. This user exit is called at the end of the validation script of the Order Confirmation process.
                 * @since 328
                 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                 * @param {boolean} isRecallScriptScheduled Boolean value indicating if the user exit is expected to be called again in the current workflow step. The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step. This parameter is set to false after the last execution of the RecallScript function.
                 * 		Possible values are:
                 * 			true: The user exit is expected to be called again in the current workflow step.
                 * 			false: The user exit is not expected to be called again in the current workflow step.
                 */
                Server.OnValidationScriptEnd = function (currentAction, currentName, isRecallScriptScheduled) {
                };
                /**
                 * @method Lib.OC.Customization.Server.OnBilling
                 * @description Allows you to override the user whose contract is used to bill the process.
                 * @since 329
                 * @returns {boolean} Boolean value specifying whether the billing information has correctly been set:
                 *		true: The billing information is correct and the process can be approved.
                 *		false: The billing information is not correct and the process cannot be approved.
                 * @example
                 * <pre><code>
                 * 	OnBilling: function ()
                 * 	{
                 *		var info = { userId: "john@example.com" };
                 *		Log.Info("Set billing info: " + info.userId);
                 *		if (!Process.SetBillingInfo(info))
                 *		{
                 *			Log.Error("Error setting billing info: " + info.userId);
                 *			Process.PreventApproval();
                 *			return false;
                 *		}
                 *		return true;
                 * 	}
                 * </code></pre>
                 */
                Server.OnBilling = function () {
                    return true;
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = OC.Customization || (OC.Customization = {}));
    })(OC = Lib.OC || (Lib.OC = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_OC_CUSTOMIZATION_SERVER_SAMPLE.js.map