"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_REPORT_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Expense Report scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
* Package Expense Report Server script customization callbacks
* @namespace Lib.Expense.Report.Customization.Server
*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Report;
        (function (Report) {
            var Customization;
            (function (Customization) {
                var Server;
                (function (Server) {
                    /**
                     * @namespace Lib.Expense.Report.Customization.Server.CustomFunctions
                     * @description
                     * Allows you to define custom Custom functions which are not user exits
                     * i.e. business functions to be called in server libraries
                     * They can be called the following way Lib.Expense.Report.Customization.Server.CustomFunctions.ExampleName()
                     * @example
                     * <pre><code>
                     * Server.CustomFunctions:
                     * {
                     *		ExampleName: function()
                     *		{
                     *			// Custom function logic here
                     *			return true;
                     *		}
                     * },
                     * </code></pre>
                     */
                    Server.CustomFunctions = {};
                    /**
                    * @method Lib.Expense.Report.Customization.Server.OnAttachExpenseReportPDF
                    * @description
                    * Allows you to customize the PDF report attached to the Expense Report process.
                    * This user exit is called from the Expense Report process, when the PDF report is generated and attached to the Expense Report process.
                    * @param {Integer} iAttachExpenseReport Zero-based index of the attachment corresponding to the PDF Expense Report
                    * This user exit adds terms and conditions to the PDF report.
                    * @example
                    * <pre><code>
                    * OnAttachExpenseReportPDF: function (iAttachExpenseReport)
                    * {
                    *	 var tcFile = "%Misc%\\ExpenseReport_term_condition.pdf";
                    *	 var pdfCommands = "-merge %infile[" + (iAttachExpenseReport + 1) + "]% \"" + tcFile + "\"";
                    *	 Attach.PDFCommands(pdfCommands);
                    * }
                    * </code></pre>
                    */
                    Server.OnAttachExpenseReportPDF = function (iAttachExpenseReport) {
                    };
                    /**
                    * @method Lib.Expense.Report.Customization.Server.OnSendEmailNotification
                    * @description
                    * Allows you to modify the email notifications in the Expense Report process.
                    * This user exit is called before sending the notification.
                    * You can choose to not send the notification by returning false for some notification.
                    * @param { Sys.EmailNotification.SendEmailNotificationWithUserIdOptions } emailOptions
                    * emailOptions structure: {
                    * 	userId: ,
                    * 	subject: ,
                    * 	template: ,
                    * 	customTags: ,
                    * 	escapeCustomTags: true,
                    * 	fromName: "Esker Expense management",
                    * 	backupUserAsCC:
                    * 	sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false)
                    * };
                    * @returns { boolean } false to indicate that a notification should not be sent or true to indicate the notification is sent.
                    * This user exit sets the sender name.
                    * @example
                    * <pre><code>
                    * OnSendEmailNotification: function (emailOptions)
                    * {
                    *	 emailOptions.fromName = "Expense Management Notifier";
                    *	 return true;
                    * }
                    * </code></pre>
                    */
                    Server.OnSendEmailNotification = function (emailOptions) {
                    };
                    /**
                    * @method Lib.Expense.Report.Customization.Server.DetermineVendorInvoiceOwner
                    * @description
                    * Allows you to customize the account to use as the owner of the invoice generated from the expense report.
                    * This user exit is called when the invoice is generated.
                    * @returns {string} String value specifying the account to use. If nothing is returned, the account specified in the DefaultAPClerk parameter is used.
                    * @example
                    * <pre><code>
                    * DetermineVendorInvoiceOwner: function ()
                    * {
                    *     if (Data.GetValue("CompanyCode__") === "FR01")
                    *     {
                    *         return "apspecialists-FR@example.com";
                    *     }
                    *     else
                    *     {
                    *         return "apspecialists-US@example.com";
                    *     }
                    * }
                    * </code></pre>
                    */
                    Server.DetermineVendorInvoiceOwner = function () {
                    };
                    /**
                    * @method Lib.Expense.Report.Customization.Server.CustomizeInvoiceData
                    * @description
                     * In Order to see the structure of invoiceData, please refer to Lib.Expense.Report.GetInvoiceData function
                     * @param {Lib.Expense.Report.InvoiceData} invoiceData contains :
                     * {
                     * 	"IsFromExpense":            Boolean,
                     * 	"header":
                     * 	{
                     * 	    "InvoiceNumber":        number,
                     * 	    "InvoiceDate":          date,
                     * 	    "InvoiceAmount":        decimal number,
                     * 	    "NetAmount":            decimal number,
                     * 	    "TaxAmount":            decimal number,
                     * 	    "InvoiceCurrency":      string,
                     * 	    "VendorName":           string,
                     * 	    "VendorVATNumber":      number
                     * 	},
                     * 	"logo":
                     * 	{},
                     * 	"companyInfo":
                     * 	{},
                     * 	"tables":
                     * 	{
                     * 	    "LineItems":            [],
                     * 	    "PaymentInformations":  [],
                     * 	    "TaxInformations":      []
                     * 	},
                     * 	"Attachment":
                     * 	{
                     * 	    "Filename":             string,
                     * 	    "Content":              string,
                     * 	    "MimeType":             string
                     * 	}
                     *}
                     * @param {Object} additionalData contains :
                     * expenses: Array containing the expenses used to build the invoice data
                     * expenseNumbers: Array containing the expense numbers of the expenses used to build the invoice data
                     * companyCodeValues: CompanyCodeValues object containing the company code values
                     * userProperties: UserProperties object containing the user properties (cost center ...)
                     * @returns { Lib.Expense.Report.InvoiceData } The modified invoiceData object.
                     *
                     * This user exit groups the invoice line items by tax code.
                     * @example
                     * <pre><code>
                     * CustomizeInvoiceData: function (invoiceData, additionalData)
                     * {
                     * 	 if (invoiceData.tables && invoiceData.tables.LineItems)
                     * 	 {
                     * 	 var groupedLineItems = {};
                     * 	 invoiceData.tables.LineItems.forEach(function (line)
                     * 	 {
                     * 		 if (!groupedLineItems[line.TaxCode])
                     * 		 {
                     * 			 groupedLineItems[line.TaxCode] = {
                     * 				 Amount: 0,
                     * 				 TaxAmount: 0
                     * 			 };
                     * 		 }
                     *
                     * 		 groupedLineItems[line.TaxCode].Description = Data.GetValue("ExpenseReportNumber__") + " - " + Data.GetValue("UserName__") + " - " + line.TaxCode;
                     * 		 groupedLineItems[line.TaxCode].Amount += line.Amount;
                     * 		 groupedLineItems[line.TaxCode].GLAccount = line.GLAccount;
                     * 		 groupedLineItems[line.TaxCode].CostCenter = line.CostCenter;
                     * 		 groupedLineItems[line.TaxCode].TaxCode = line.TaxCode;
                     * 		 groupedLineItems[line.TaxCode].TaxeRate = line.TaxRate;
                     * 		 groupedLineItems[line.TaxCode].TaxAmount += line.TaxAmount;
                     * 		 groupedLineItems[line.TaxCode].ProjectCode = line.ProjectCode;
                     * 	 });
                     *
                     * 	 invoiceData.tables.LineItems = [];
                     * 	 Sys.Helpers.Object.ForEach(groupedLineItems, function (groupedLineItem)
                     * 	 {
                     * 		 invoiceData.tables.LineItems.push(groupedLineItem);
                     * 	 });
                     * 	 }
                     * 	 return invoiceData;
                     * }
                     * </code></pre>
                     */
                    Server.CustomizeInvoiceData = function (invoiceData, additionalData) {
                    };
                    /**
                    * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script.
                    * @since 164
                    * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
                    * @param {string} prefix prefix added by default
                    * @returns {string} String value containing the next number from your customized sequence.
                    * @example
                    * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
                    * <pre><code>
                    *	Server.GetNumber = function (defaultSequenceName, prefix)
                    *	{
                    *		var number = "";
                    *		var companyCode = Data.GetValue("CompanyCode__");
                    *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName + companyCode);
                    *		number = ReqNumberSequence.GetNextValue();
                    *		if (number === "")
                    *		{
                    *			Log.Info("Error while retrieving a number");
                    *		}
                    *		else
                    *		{
                    *			number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
                    *			Log.Info("Number: " + number);
                    *		}
                    *		return number;
                    *	};
                    * </code></pre>
                    */
                    /*
                    export const GetNumber = function (defaultSequenceName: string, prefix: string): string
                    {
                        // Must return something
                    };
                    */
                    /**
                     * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script.
                     * @since 164
                     * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
                     * @param {string} prefix prefix added by default
                     * @returns {string} String value containing the next number from your customized sequence.
                     * @example
                     * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
                     * <pre><code>
                     *	GetInvoiceNumber: function (defaultSequenceName, prefix)
                     *	{
                     *		var number = "";
                     *		var companyCode = Data.GetValue("CompanyCode__");
                     *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName + companyCode);
                     *		number = ReqNumberSequence.GetNextValue();
                     *		if (number === "")
                     *		{
                     *			Log.Info("Error while retrieving a number");
                     *		}
                     *		else
                     *		{
                     *			number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
                     *			Log.Info("Number: " + number);
                     *		}
                     *		return number;
                     *	}
                     * </code></pre>
                     */
                    /*
                    GetInvoiceNumber: function (defaultSequenceName, prefix)
                    {
                        // Must return something
                    },
                    */
                    /**
                    * @method Lib.Expense.Report.Customization.Server.OnExpenseReportSubmission
                    * @description Allows you to do additional checks when the user submits an expense report
                    * @since 195
                    * @return {Lib.Expense.Report.Customization.Server.OnExpenseReportSubmissionReturn} json object to allow or prevent the submission of the expense report with a custom error message
                    * @example
                    * <pre><code>
                    *	OnExpenseReportSubmission: function ()
                    *	{
                    *		var remainingUserBudget = getRemainingUserBudget();
                    *		var totalExpenseAmount = Data.GetValue("TotalAmount__");
                    *		if (totalExpenseAmount > remainingUserBudget)
                    *		{
                    *			Log.Error("Not enough budget: remaining budget is:" + remainingUserBudget);
                    *			// Prevent submission of the expense report
                    *			return {
                    *	 			"allowValidation": false,
                    *	 			"title": "Not enough budget",
                    *				"message": "Your remaining bugdet (" + remainingUserBudget +") is not enough for this expense report.",
                    *				"isError": false
                    *			};
                    *		}
                    *
                    *		// Allow validation
                    *		return {
                    *			"allowValidation": true
                    *		};
                    *	}
                    * </code></pre>
                    */
                    Server.OnExpenseReportSubmission = function () {
                        return {
                            "allowValidation": true
                        };
                    };
                    /**
                    * @method Lib.Expense.Report.Customization.Server.OnUnknownAction
                    * @description
                    * This function is called when the validation script executes an unknown action.
                    * User can simply add any custom action treatment here.
                    * @param {string} currentAction name of the executed action
                    * @param {string} currentName sub-name of the executed action
                    * @returns {boolean} returns true if this action has been treated otherwise false.
                    * @example
                    * <pre><code>
                    * OnUnknownAction: function (currentAction, currentName)
                    * {
                    * 	Log.Error(currentAction + "-" + currentName);
                    * }
                    * </code></pre>
                    */
                    Server.OnUnknownAction = function (currentAction, currentName) {
                        return false;
                    };
                    /**
                     * @method Lib.Expense.Report.Customization.Server.OnBilling
                     * @description Allows you to override the user whose contract is used to bill the process.
                     * @returns {boolean} Boolean value specifying whether the billing information has correctly been set:
                     *		true: The billing information is correct and the process can be submitted.
                     *		false: The billing information is not correct and ask the process to stop the validation script execution.
                     * @example
                     * <pre><code>
                     * 	OnBilling: function ()
                     * 	{
                     *		var info = { userId: "john@example.com" };
                     *		Log.Info("Set billing info: " + info.userId);
                     *		if (!Process.SetBillingInfo(info))
                     *		{
                     *			Log.Error("Error setting billing info: " + info.userId);
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
            })(Customization = Report.Customization || (Report.Customization = {}));
        })(Report = Expense.Report || (Expense.Report = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_REPORT_CUSTOMIZATION_SERVER_SAMPLE.js.map