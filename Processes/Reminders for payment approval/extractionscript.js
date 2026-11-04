"use strict";
// This process is generic for AP scheduled task reminders
const paymentApproval = {
    "template": "AP-ReminderForPaymentApproval.htm",
    "trads": {
        "tradKeySingleItem": "_Invoice pending approval",
        "tradKeyMultiItem": "_Invoices pending approval"
    },
    "viewNameUrl": "/View.link?tabName=_My%20documents-AP_SAP&viewName=_AP_View%20-%20Assigned%20to%20me",
    "fromName": "Esker Accounts payable",
    "query": {
        "processName": "Vendor invoice",
        "filter": "(&(InvoiceStatus__=To approve)(State=70))",
        "dnField": "OwnerId",
        "includeDnValidate": true
    }
};
const vendorRegistrationApproval = {
    "template": "AP-ReminderForVendorRegistrationApproval.htm",
    "trads": {
        "tradKeySingleItem": "_Vendor registration pending approval",
        "tradKeyMultiItem": "_Vendor registrations pending approval"
    },
    "viewNameUrl": "/View.link?tabName=_Vendor%20registration&viewName=_Vendor%20registration%20-%20ToValidate",
    "fromName": "Esker Vendor management",
    "query": {
        "processName": "Vendor Registration",
        "filter": "(&(ProcessStatus__=ToValidate)(State=70))",
        "dnField": "OwnerId",
        "includeDnValidate": false
    }
};
const billingScheduleApproval = {
    "template": "AP-ReminderForBillingScheduleApproval.htm",
    "trads": {
        "tradKeySingleItem": "_Billing schedule pending approval",
        "tradKeyMultiItem": "_Billing schedules pending approval"
    },
    "viewNameUrl": "/View.link?tabName=_My%20documents-P2P%20Contract&viewName=_P2P_Views%20-%20My_Billing_Schedules_To_Approve",
    "fromName": "Esker Invoicing Schedule",
    "query": {
        "processName": "Billing Schedule",
        "filter": "(&(BillingScheduleStatus__=To approve)(State=70))",
        "dnField": "OwnerId",
        "includeDnValidate": true
    }
};
/**
 * @typedef {Object<string, Reminder>} ReminderMapping
 * Mapping of reminder names to their corresponding configurations.
 * @property {Reminder} defaultReminder The default reminder configuration.
 */
const ReminderMapping = {
    paymentApproval,
    vendorRegistrationApproval,
    billingScheduleApproval,
    defaultReminder: paymentApproval
};
//#endregion ReminderMapping global variable
/**
 * @namespace EmailNotificationCtrl
 * @description Contains methods for handling email notifications for reminders.
 */
var EmailNotificationCtrl;
(function (EmailNotificationCtrl) {
    /**
     * @method GetSubject
     * @access private
     * @description Generates the subject for the email based on the number of documents.
     * @param {ReminderLocalization} localization The localization object containing translation keys.
     * @param {number} count The number of documents.
     * @returns {{ key: string, parameters?: [number] }} The language key and optional parameters.
     */
    function getSubject(localization, count) {
        if (count > 1) {
            return {
                key: localization.tradKeyMultiItem,
                parameters: [count]
            };
        }
        return {
            key: localization.tradKeySingleItem
        };
    }
    /**
     * @method GetCustomTags
     * @access private
     * @description Generates custom tags for the email template.
     * @param {string} viewNameUrl The URL of the view to be included in the email.
     * @param {number} count The number of documents.
     * @param {IUser} approver The approver user object.
     * @returns {ESKMap<string | number | boolean>} The custom tags for the email.
     *
     * @remark
     * If SSO_URL is set in the P2P parameters, the validation URL is put behind the SSO URL.
     */
    function getCustomTags(viewNameUrl, count, approver) {
        let baseUrl = Data.GetValue("ValidationUrl");
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
        let validationURL = baseUrl + viewNameUrl;
        // Check if SSO will be used first to determine URL construction strategy
        let SSO_URL = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetSSOUrl", approver);
        if (!Sys.Helpers.IsString(SSO_URL)) {
            const isPasswordLoginType = approver.GetValue("LoginType") === "1" /*Lib.P2P.LoginTypes.Password*/;
            if (!isPasswordLoginType) {
                SSO_URL = Sys.Parameters.GetInstance("P2P").GetParameter("SSO_URL", null);
            }
        }
        if (Sys.Helpers.IsString(SSO_URL) && !Sys.Helpers.IsEmpty(SSO_URL)) {
            const decodeViewName = decodeURIComponent(viewNameUrl);
            validationURL = `${SSO_URL}&ReturnURL=${encodeURIComponent(baseUrl)}${encodeURIComponent(decodeViewName)}`;
        }
        const customTags = {
            ApproverDisplayName: approver.GetValue("DisplayName"),
            ValidationUrl: validationURL,
            NumberOfInvoice: count,
            NumberOfItems: count
        };
        if (count > 1) {
            customTags.PlurialItems = "true";
            customTags.PlurialInvoices = "true";
        }
        return customTags;
    }
    /**
     * @method NotifyApprover
     * @description Sends an email notification to the approver.
     * @param {string} scheduleName The name of the schedule.
     * @param {Reminder} reminder The reminder object.
     * @param {string} login The login of the approver.
     * @param {number} documentCount The number of documents to notify about.
     *
     * @remark
     * If the approver is not found, a warning is logged.
     * Email can be customized using Lib.P2P.Customization.RemindersForPaymentApproval.CustomizeEmail
     */
    function NotifyApprover(scheduleName, reminder, login, documentCount) {
        const userToNotify = Users.GetUser(login);
        if (userToNotify) {
            const approverLanguage = userToNotify.GetValue("Language");
            const email = Sys.EmailNotification.CreateEmailWithUser({
                user: userToNotify,
                subject: getSubject(reminder.trads, documentCount),
                template: reminder.template,
                customTags: getCustomTags(reminder.viewNameUrl, documentCount, userToNotify),
                escapeCustomTags: true,
                backupUserAsCC: true,
                sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false)
            });
            if (email) {
                Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", Language.TranslateInto(reminder.fromName, approverLanguage, false));
                Sys.Helpers.TryCallFunction("Lib.P2P.Customization.RemindersForPaymentApproval.CustomizeEmail", email, reminder.query.processName, scheduleName, userToNotify);
                Sys.EmailNotification.SendEmail(email);
            }
        }
        else {
            Log.Warn(`approver with login '${login}' not found`);
        }
    }
    EmailNotificationCtrl.NotifyApprover = NotifyApprover;
})(EmailNotificationCtrl || (EmailNotificationCtrl = {}));
/**
 * @namespace ReadFromRecords
 * @description Contains methods for extracting user information from matching forms.
 */
var ReadFromRecords;
(function (ReadFromRecords) {
    /**
     * @method getUsers
     * @description Extracts user information from forms based on the reminder query.
     * @param {Reminder} reminder The reminder object containing the query details.
     * @returns {ESKMap<number>} A mapping of user logins to document counts.
     */
    function GetUsers(reminder) {
        const users = {};
        const processId = Process.GetProcessID(reminder.query.processName);
        const filter = reminder.query.filter;
        const prefixTable = "CD#";
        const dnField = reminder.query.dnField;
        const attributes = [dnField];
        let handleResultsFunc;
        // includeDnValidate is only when dnField is OwnerId
        // DnValidate is used for parallel workflow when two or more approvers are assigned to the same process
        if (dnField == "OwnerId" && reminder.query.includeDnValidate) {
            attributes.push("DnValidate");
            handleResultsFunc = handleQueryResultWithDnValidate;
        }
        else {
            handleResultsFunc = handleQueryResult;
        }
        const query = Process.CreateQueryAsProcessAdmin();
        query.SetSpecificTable(`${prefixTable}${processId}`);
        query.SetFilter(filter);
        query.SetAttributesList(attributes.join(","));
        query.SetOptionEx("Limit=-1");
        query.SetOptionEx("FastSearch=1");
        query.SetOptions(0x00210000); // DBSET_READONLY | DBSET_QUICK
        let record = query.MoveFirst() ? query.MoveNextRecord() : null;
        if (record) {
            do {
                handleResultsFunc(record);
                record = query.MoveNextRecord();
            } while (record);
        }
        else {
            Log.Error(`Unable to retrieve users : ${query.GetLastErrorMessage()}`);
        }
        /**
         * @function handleQueryResultWithDnValidate
         * @description Handles query results when DnValidate is used as DN field. DnValidate is used for parallel workflow when two or more approvers are owner of the document.
         * @param {xRecord} userRecord The record containing user information.
         *
         * @remark
         * If no DnValidate is found, the OwnerId is used as a fallback.
         */
        function handleQueryResultWithDnValidate(userRecord) {
            if (userRecord) {
                const nbDnValidate = userRecord.GetVars().GetNbValues("DnValidate");
                for (let i = 0; i < nbDnValidate; i++) {
                    const dn = userRecord.GetVars().GetValue_String("DnValidate", i);
                    const userLogin = dn ? Sys.Helpers.String.ExtractLoginFromDN(dn) : "";
                    if (userLogin) {
                        incrementUserDocumentCount(users, userLogin);
                    }
                }
                // FT-026568 : if no dnvalidate has been found, we use the ownerid
                if (nbDnValidate === 0) {
                    const ownerid = userRecord.GetVars().GetValue_String("OwnerId", 0);
                    const userLogin = ownerid ? Sys.Helpers.String.ExtractLoginFromDN(ownerid) : "";
                    if (userLogin) {
                        incrementUserDocumentCount(users, userLogin);
                    }
                }
            }
        }
        /**
         * @function handleQueryResult
         * @description Handles generic query results.
         * @param {xRecord} userRecord The record containing user information.
         */
        function handleQueryResult(userRecord) {
            if (userRecord) {
                const dn = userRecord.GetVars().GetValue_String(dnField, 0);
                const userLogin = dn ? Sys.Helpers.String.ExtractLoginFromDN(dn) : "";
                if (userLogin) {
                    incrementUserDocumentCount(users, userLogin);
                }
            }
        }
        return users;
    }
    ReadFromRecords.GetUsers = GetUsers;
    /**
     * @method incrementUserDocumentCount
     * @access private
     * @description Updates the document count for a specific user login.
     * @param {ESKMap<number>} users The mapping of user logins to document counts.
     * @param {string} login The login of the user.
     */
    function incrementUserDocumentCount(users, login) {
        if (Object.prototype.hasOwnProperty.call(users, login)) {
            users[login]++;
        }
        else {
            users[login] = 1;
        }
    }
})(ReadFromRecords || (ReadFromRecords = {}));
/**
 * @function notifyUsers
 * @description Sends email notifications to all users specified in the parameter.
 * @param {string} scheduleName The name of the schedule.
 * @param {Reminder} reminder The reminder object.
 * @param {ESKMap<number>} users The mapping of user logins to document counts.
 */
function notifyUsers(scheduleName, reminder, users) {
    for (const login in users) {
        if (Object.prototype.hasOwnProperty.call(users, login)) {
            const documentCount = users[login];
            EmailNotificationCtrl.NotifyApprover(scheduleName, reminder, login, documentCount);
        }
    }
}
/**
 * @function getExistingScheduleName
 * @description Retrieves the schedule name to remind and checks if it exists in ReminderMapping.
 * @returns {string} The schedule name.
 *
 * @remark
 * The schedule name is retrieved from the `reportParameter` External Variable.
 * If the schedule name is not found, a warning is logged and the process exits with code 200.
 * If the `reportParameter` External Variable is empty or not set, a warning is logged and the default schedule name is returned.
 * Currently, the default schedule name is "Reminders for payment approval" (`paymentApproval`).
 */
function getExistingScheduleName() {
    const reportParameter = Variable.GetValueAsString("reportParameter");
    if (reportParameter) {
        const params = JSON.parse(reportParameter);
        if ("scheduleName" in params && !!ReminderMapping[params.scheduleName]) {
            return params.scheduleName;
        }
        Log.Error(`Schedule name is missing or unknown in reportParameter variable : ${JSON.stringify(reportParameter)}. Prevent to execute schedule task.`);
        Process.Exit(200);
        return null;
    }
    Log.Warn("Variable reportParameter is missing.");
    Log.Info("This process is updated in version 249 and requires 'reportParameter' variable process in scheduled task settings but old accounts do not have this variable yet. The default schedule task is 'Reminders for payment approval'.");
    return "defaultReminder";
}
/**
 * @function init
 * @description Initializes the process by extending the ReminderMapping with custom reminders.
 *
 * @remark
 * This function is called at the beginning of the script to ensure that any custom reminders are included in the mapping.
 */
function init() {
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.RemindersForPaymentApproval.ExtendReminderMapping", ReminderMapping);
}
/**
 * @function run
 * @description Main function to execute the reminder process.
 */
function run() {
    init();
    let scheduleName = getExistingScheduleName();
    if (scheduleName !== null) {
        const reminder = ReminderMapping[scheduleName];
        const usersToNotify = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.RemindersForPaymentApproval.GetUsersToNotify", scheduleName, reminder)
            || ReadFromRecords.GetUsers(reminder);
        notifyUsers(scheduleName, reminder, usersToNotify);
    }
}
run();
//# sourceMappingURL=extractionscript.js.map