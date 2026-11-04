"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_QUESTIONNAIREDEFINITION_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Customization library extending questionnaire definition",
  "versionable": false,
  "require": []
}*/
/**
 * Questionnaire customization callbacks.
 * Used in the 'Questionnaires Designer' process.
 * @namespace Lib.Customization.QuestionnaireDefinition
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    let Customization;
    (function (Customization) {
        let QuestionnaireDefinition;
        (function (QuestionnaireDefinition) {
            /**
             * QuestionnaireDefinition custom extension
             * @typedef {object} Lib.Customization.QuestionnaireDefinition.definition
             * @property {object} fields - List of intrinsic fields used by the Questionnaire engine and proposed by Questionnaire designer
             * @property {object} properties - List of intrinsic object allowing to browse table to obtain value.
             * Use this function to customize what filter you can use in the application conditions of the questionnaires
             * Here is an example on how to use this function to allow to add an application condition to apply questionnaire on specific supplier categories
             * @example
             * <pre><code>
             * const definition =
             * {
             *	"fields": {
             *		"VendorCategory__":
             *		{
             *			"type": "string",
             *			"niceName":
             *			{
             *				"languageKey": "Supplier Category"
             *			},
             *			"browsableValues": "properties.browseSupplierCategory"
             *		}
             *	},
             * 	"properties": {
             * 		"browseSupplierCategory":
             * 		{
             * 			"dialogTitle": "Select a category",
             * 			"headerText": null,
             * 			"tableTitle": "Categories",
             * 			"helperText": null,
             * 			"selectedHelperText": null,
             * 			"table": "P2P - Vendor Category__",
             * 			"maxRowCount": 20,
             * 			"maxRowCountPerPage": 10,
             * 			"columns":
             * 			{
             * 				"Code__":
             * 				{
             * 					"type": "string",
             * 					"niceName":
             * 					{
             * 						"languageKey": "Category"
             * 					},
             * 					"width": 200,
             * 					"storedValue": true
             * 				}
             * 			},
             * 			"searchCriterias":
             * 			{
             * 				"Code__":
             * 				{
             * 					"niceName":
             * 					{
             * 						"languageKey": "Category"
             * 					},
             * 					"required": false,
             * 					"toUpper": false,
             * 					"visible": true,
             * 					"filterId": "Code__",
             * 					"defaultValue": "",
             * 					"autoAddAsterisk": true
             * 				}
             * 			}
             * 		}
             * 	}
             * };
             * </code></pre>
             */
            const definition = {
                "fields": {},
                "properties": {}
            };
            /**
             * Called by the Questionnaire designer and Questionnaire Engine to extend the default QuestionnaireDefinition
             * @memberof Lib.Customization.QuestionnaireDefinition
             * @return {Lib.Customization.QuestionnaireDefinition.definition} The custom QuestionnaireDefinition extension for the Questionnaire designer and Questionnaire engine.
             */
            function GetJSON() {
                return definition;
            }
            QuestionnaireDefinition.GetJSON = GetJSON;
        })(QuestionnaireDefinition = Customization.QuestionnaireDefinition || (Customization.QuestionnaireDefinition = {}));
    })(Customization = Lib.Customization || (Lib.Customization = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CUSTOMIZATION_QUESTIONNAIREDEFINITION_SAMPLE.js.map