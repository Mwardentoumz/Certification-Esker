"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CUSTOM_WORKFLOWDEFINITION",
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
*/
var Lib;
(function (Lib) {
    var Custom;
    (function (Custom) {
        var WorkflowDefinition;
        (function (WorkflowDefinition) {
            let definition = {
                "fields": {
                    // Vendor risk (see VendorRisk in LIB_AP_CUSTOMIZATION_COMMON): used as step condition
                    // in the payment approval rules to add the compliance review
                    "Z_ComplianceReviewRequired__": {
                        "type": "boolean",
                        "niceName": {
                            "en": "Compliance review required",
                            "fr": "Revue conformité requise"
                        }
                    }
                },
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
             * @method Lib.Custom.WorkflowDefinition.SetCustomSettings
             * @return {Sys.WorkflowEngine.Settings} The customized settings
             */
            WorkflowDefinition.SetCustomSettings = function (settings) {
            };
        })(WorkflowDefinition = Custom.WorkflowDefinition || (Custom.WorkflowDefinition = {}));
    })(Custom = Lib.Custom || (Lib.Custom = {}));
})(Lib || (Lib = {}));
