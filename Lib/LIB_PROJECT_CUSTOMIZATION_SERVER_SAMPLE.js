"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_PROJECT_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Script Project customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package Project server scripts customization callbacks
 * @namespace Lib.Project.Customization.Server
 */
var Lib;
(function (Lib) {
    var Project;
    (function (Project) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.Project.Customization.Server.OnSendEmailNotification
                 * @description Allows you to modify the email notifications. This user exit is called before the notification is sent.
                 * @since 282
                 * @param {Sys.EmailNotification.SendEmailNotificationWithUserIdOptions} emailOptions
                 * @example
                 *  <pre><code>
                 * OnSendEmailNotification: function (options)
                 * {
                 *      return false; // disable email notification
                 * }
                 * </code></pre>
                 */
                Server.OnSendEmailNotification = function (emailOptions) {
                    return true;
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = Project.Customization || (Project.Customization = {}));
    })(Project = Lib.Project || (Lib.Project = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_PROJECT_CUSTOMIZATION_SERVER_SAMPLE.js.map