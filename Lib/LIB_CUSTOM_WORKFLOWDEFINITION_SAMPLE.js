"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CUSTOM_WORKFLOWDEFINITION_SAMPLE",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Custom library extending workflow definition",
  "versionable": false,
  "require": []
}*/
/**
 * Workflow rules customizations
 * @namespace Lib.Custom.WorkflowDefinition
 * @see {@link Lib.Workflow.Customization.Common} to customize the data sent to the workflow engine from the P2P application.
 * @see {@link Lib.CM.Customization.Workflow} to customize the data sent to the workflow engine from the CM module.
*/
var Lib;
(function (Lib) {
    var Custom;
    (function (Custom) {
        var WorkflowDefinition;
        (function (WorkflowDefinition) {
            let definition = {
                "fields": {},
                "properties": {},
                "stepTypes": {}
            };
            /**
             * @description Called by the Workflow rules designer and Workflow Engine to extend the default WorkflowDefinition
             * @method Lib.Custom.WorkflowDefinition.GetJSON
             * @return {Definition} The custom WorkflowDefinition extension for the Workflow rules designer and Workflow engine.
             */
            WorkflowDefinition.GetJSON = function () {
                return definition;
            };
            /**
             * @description Called by the Sys.WorkflowDefinition.Extend method to set custom settings.
             * @since 331
             * @method Lib.Custom.WorkflowDefinition.SetCustomSettings
             * @return {Sys.WorkflowEngine.Settings} The customized settings
             * @example
             * <caption>Example of custom settings to skip dimension manager if no result, so that the next step can run if the condition is "Workflow is empty" is true</caption>
             * SetCustomSettings: function (settings)
             * {
             *		if (settings && settings.customs)
             *		{
             *			var customSettings = settings.customs.pop();
             *			customSettings.stepTypes.dimensionManager.noResult = "skip";
             *			settings.customs.push(customSettings);
             *		}
             *		return settings;
             * }
             */
            WorkflowDefinition.SetCustomSettings = function (settings) {
            };
        })(WorkflowDefinition = Custom.WorkflowDefinition || (Custom.WorkflowDefinition = {}));
    })(Custom = Lib.Custom || (Lib.Custom = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CUSTOM_WORKFLOWDEFINITION_SAMPLE.js.map