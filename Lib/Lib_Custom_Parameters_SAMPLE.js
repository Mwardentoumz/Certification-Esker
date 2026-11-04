"use strict";
/* eslint no-empty-function: "off", no-unused-vars: "off" */
// eslint-disable-next-line no-redeclare
/* LIB_DEFINITION{
  "name": "Lib_Custom_Parameters_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "My custom parameters definition for any applications.",
  "versionable": false,
  "require": [
    "Sys/Sys_Parameters"
  ]
}*/
var Lib;
(function (Lib) {
    /**
     * @description This module allows you to set the parameters of any solutions
     * depending on the current execution environment (Development/QA/Production).
     * The environment is detected based on the sub-account identifier.
     */
    // If the environment detection fails, the parameters are set based on the default environment (PROD by default).
    /*
    Example: My custom parameters for Purchasing processes only (PAC instance).
    Sys.Parameters.GetInstance("PAC").Extend(
    // Each object associates one environment to a list of parameters and their values.
    // This shouldn't be used to declare new environments that were not declared at the init, mostly because the current running environment is compute during the init and won't take into account those new ones.
    {
        "PROD": // Environment name: must exactly match on of those declared during init
        {
            "ERP": "SAP"
        },
        "QA":
        {
            "ERP": "SAP"
        },
        "DEV":
        {
            "ERP": "SAP"
        }
    });
    */
    Sys.Parameters.GetInstance("P2P").Extend({
        "DEV": {
            "SSO_URL": ""
        },
        "QA": {
            // If your customer uses SSO to log into Esker on Demand, put here the SSO URL, for example "https://as1.ondemand.esker.com/ondemand/webaccessSSO?name=CUSTOMERNAME_QA&uniqueId=CUSTOMERNAME_QA"
            "SSO_URL": ""
        },
        "PROD": {
            // If your customer uses SSO to log into Esker on Demand, put here the SSO URL, for example "https://as1.ondemand.esker.com/ondemand/webaccessSSO?name=CUSTOMERNAME_PROD&uniqueId=CUSTOMERNAME_PROD"
            "SSO_URL": ""
        }
    });
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Custom_Parameters_Sample.js.map