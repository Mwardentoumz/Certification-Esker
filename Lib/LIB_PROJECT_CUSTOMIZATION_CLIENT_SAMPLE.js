"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_PROJECT_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Script Project customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package Project client scripts customization callbacks
 * @namespace Lib.Project.Customization.Client
 */
var Lib;
(function (Lib) {
    var Project;
    (function (Project) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                * @method Lib.Project.Customization.Client.OnLoad
                * @description
                * This function will be called at the project loading; just before calling the Start function.
                * If you return a promise object, we synchronize on it before calling the Start function.
                * @example
                * <pre><code>
                * OnLoad: function ()
                * {
                * 	// Initialize company code
                * 	Data.SetValue("CompanyCode__", "US01");
                * }
                * </code></pre>
                */
                Client.OnLoad = function () {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = Project.Customization || (Project.Customization = {}));
    })(Project = Lib.Project || (Lib.Project = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_PROJECT_CUSTOMIZATION_CLIENT_SAMPLE.js.map