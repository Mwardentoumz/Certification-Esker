"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_VALIDATION_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Validation Script AP vendor statement customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Customization callbacks for the validation of the Vendor Statement Matching process
 * @namespace Lib.AP.Customization.StatementMatching.Validation
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var StatementMatching;
            (function (StatementMatching) {
                var Validation;
                (function (Validation) {
                    /**
                     * @namespace Lib.AP.Customization.StatementMatching.Validation.CustomUserExits
                     * @description
                     * Allows you to define custom user exists added for this customer
                     * Functions defined in this scope will be accessible from outside this library
                     * They can be called the following way Lib.AP.Customization.StatementMatching.Validation.CustomUserExits.GetCopyFileOwnerLogin()
                     * @example
                     * <pre><code>
                     * CustomUserExits:
                     * {
                     *		GetCopyFileOwnerLogin: function()
                     *		{
                     *			return Sys.Parameters.GetInstance("AP").GetParameter("Z_TopAccountServiceUser", "");
                     *		}
                     * },
                     * </code></pre>
                     */
                    Validation.CustomUserExits = {};
                    /**
                     * @method Lib.AP.Customization.StatementMatching.Validation.ExtendActionMap
                     * @description
                     * Called at the begining of the validation script.
                     * Allows you to add a new validation action in the Vendor statement reconciliation process or to edit existing validation actions.
                     * This user exit is called from the validation script of the Vendor statement reconciliation process
                     * @param {Object} actionMap validation script actions definition, add new actions into this object (key must be value of Data.GetActionType() in lower case)
                     * @example
                     * <pre><code>
                     * ExtendActionMap: function (actionMap)
                     * {
                     *	actionMap.sendemail = {
                     *		"execute": function () {
                     *			Process.DisableChecks();
                     *			Process.PreventApproval();
                     *			Sys.EmailNotification.SendEmailNotification({
                     *				userId: Data.GetValue("OwnerId"),
                     *				subject: "_Email from AP team",
                     *				template: "Purchasing_Email_NotifRecall.htm",
                     *				customTags: null,
                     *				fromName: "_EskerContact",
                     *				backupUserAsCC: true,
                     *				sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameter("SendNotificationsToEachGroupMembers") === "1"
                     *			});
                     *		}
                     *	};
                     * }
                     * </code></pre>
                     */
                    Validation.ExtendActionMap = function (actionMap) {
                    };
                    /**
                     * @method Lib.AP.Customization.StatementMatching.Validation.onActionEnd
                     * @description
                     * Allows you to customize the Vendor statement reconciliation process when a user performs an action.
                     * This user exit is called at the end of the validation script, right after the action is performed
                     * @param {String} actionType validation script type called (return value of ActionHelpers.GetCurrentAction())
                     * @example
                     * <pre><code>
                     * onActionEnd: function (actionType)
                     * {
                     *	if (actionType === "approve")
                     *	{
                     *		var globalPdfCommmand = "-instxt %infile[1]% -blt \"Arial\" 12 black -erase #FFFFFF -inflate 1 -XY 5 15 \"Test_text\" 1";
                     *		if (Attach.PDFCommands(globalPdfCommmand, { RemoveGDRTiffFile: false })) {
                     *			Log.Info("pdfCommand executed");
                     *		}else{
                     *			Log.Error("pdfCommand error");
                     *		}
                     *	}
                     * </code></pre>
                     */
                    Validation.onActionEnd = function (actionType) {
                    };
                    /**
                     * To define custom functions corresponding to business behaviors:
                     * Create a object in which Functions defined in this scope will only be accessible within this library
                     * They can be called the following way CustomHelpers.MyCustomHelper()
                     * New objects can be defined to isolate several functions linked to a feature (i.e. : VendorHelpers)
                     *  @example
                     * <pre><code>
                     * var CustomHelpers =
                     * {
                     *		ResetValidity: function () {
                     *			// Set the ValidityDateTime as in the extraction script (SubmitDateTime + 16 months)
                     *			var validityDT = Data.GetValue("SubmitDateTime");
                     *			validityDT.setMonth(validityDT.getMonth() + 16);
                     *			Data.SetValue("ValidityDateTime", validityDT);
                     *		}
                     * };
                     * </code></pre>
                     */
                    // Uncomment here
                    // var CustomHelpers =
                    // {
                    // };
                })(Validation = StatementMatching.Validation || (StatementMatching.Validation = {}));
            })(StatementMatching = Customization.StatementMatching || (Customization.StatementMatching = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_STATEMENTMATCHING_VALIDATION_SAMPLE.js.map