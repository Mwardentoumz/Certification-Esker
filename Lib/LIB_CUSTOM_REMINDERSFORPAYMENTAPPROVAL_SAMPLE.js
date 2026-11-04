"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CUSTOM_REMINDERSFORPAYMENTAPPROVAL_SAMPLE",
  "libraryType": "Lib",
  "versionable": false,
  "scriptType": "SERVER",
  "require": []
}*/
/**
 * User exits to customize Reminders for payment approval process
 * @namespace Lib.P2P.Customization.RemindersForPaymentApproval
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var RemindersForPaymentApproval;
            (function (RemindersForPaymentApproval) {
                /**
                 * @method Lib.P2P.Customization.RemindersForPaymentApproval.ExtendReminderMapping
                 * @since 328
                 * @description Allows you to add custom reminders to the RemindersForPaymentApproval process or to update existing ones.
                 * @param {Object<string, Reminder>} mapping The mapping of reminders.
                 * @example
                 * <caption>Change the viewNameUrl of paymentApproval</caption>
                 * RemindersForPaymentApproval.ExtendReminderMapping = function (mapping)
                 * {
                 * 		mapping.paymentApproval.viewNameUrl = "/View.link?tabName=_My%20documents-AP_SAP&viewName=_AP_View%20-%20Assigned%20to%20me";
                 * };
                 * @example
                 * <caption>Add a custom reminder</caption>
                 * RemindersForPaymentApproval.ExtendReminderMapping = function (mapping)
                 * {
                 * 		mapping.z_missing_gr ={
                 *			"template": "Z-ReminderForMissingGR.htm",
                 *			"trads": {
                 *				"tradKeySingleItem": "_Invoice pending approval",
                 *				"tradKeyMultiItem": "_Invoices pending approval"
                 *			},
                 *			"viewNameUrl": "/View.link?tabName=_My%20documents-AP_SAP&viewName=_AP_View%20-%20Assigned%20to%20me",
                 *			"fromName": "Esker Accounts payable",
                 *			"query": {
                 *				"processName": "Vendor invoice",
                 *				"filter": "(&(InvoiceStatus__=To approve)(State=70))",
                 * 				"dnField": "Z_MissingGRApproverFullDN__"
                 *			}
                 *		};
                 * };
                 */
                RemindersForPaymentApproval.ExtendReminderMapping = function (mapping) {
                };
                /**
                 * @method Lib.P2P.Customization.RemindersForPaymentApproval.GetUsersToNotify
                 * @since 361
                 * @description Allows you to override recipients for a reminder execution.
                 * @param {string} scheduleName The schedule task reminder name.
                 * @param {Reminder} reminder The reminder definition resolved from the schedule.
                 * @returns {ESKMap<number> | void} A map of login to document count, or void to use standard implementation.
                 * @example
                 * <caption>Load reminder recipients from a CSV attachment</caption>
                 * RemindersForPaymentApproval.GetUsersToNotify = function (scheduleName, reminder)
                 * {
                 * 		if (scheduleName !== "paymentApprovalCsv")
                 * 		{
                 * 			return;
                 * 		}
                 * 		const usersToNotify: ESKMap<number> = {};
                 * 		const csv = Attach.GetAttachByName("reminder_recipients.csv");
                 * 		if (!csv)
                 * 		{
                 * 			return usersToNotify;
                 * 		}
                 * 		// Parse CSV lines and fill usersToNotify[login] = numberOfDocuments
                 * 		return usersToNotify;
                 * };
                 */
                RemindersForPaymentApproval.GetUsersToNotify = function (scheduleName, reminder) {
                };
                /**
                 * @method Lib.P2P.Customization.RemindersForPaymentApproval.CustomizeEmail
                 * @since 312
                 * @description Allows you to customize emails sent through the process RemindersForPaymentApproval
                 * @param {xTransport} email The email about to be sent
                 * @param {string} processName The process the reminder is about (Vendor invoice, Vendor Registration, Billing Schedule...)
                 * @param {string} reminderName (From S328) The name of the reminder (paymentApproval, vendorRegistrationApproval, billingScheduleApproval, or any custom reminder name)
                 * @param {xUser} user (From S328) The user to whom the email is sent
                 * @example
                 * <caption>Add custom sender to the sent email.</caption>
                 * RemindersForPaymentApproval.CustomizeEmail = function (email, processName)
                 * {
                 * 		if (processName === "Vendor invoice")
                 * 		{
                 *			Sys.EmailNotification.AddSender(email, "custom-sender@example.com", "customSender");
                 * 		}
                 * };
                 */
                RemindersForPaymentApproval.CustomizeEmail = function (email, processName, reminderName, user) {
                };
            })(RemindersForPaymentApproval = Customization.RemindersForPaymentApproval || (Customization.RemindersForPaymentApproval = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CUSTOM_REMINDERSFORPAYMENTAPPROVAL_SAMPLE.js.map