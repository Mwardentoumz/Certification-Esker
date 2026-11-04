"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_HTMLSCRIPTS_SAMPLE",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP HTML page script customization callbacks for all processes
 * @namespace Lib.AP.Customization.HTMLScripts
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var HTMLScripts;
            (function (HTMLScripts) {
                /**
                 * New object to handle standard layout customizations
                 * @namespace Lib.AP.Customization.HTMLScripts.LayoutHelpers
                 */
                const LayoutHelpers = {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.InitHeaderLayout
                     * @description
                     * Handle header fields display
                     *  @example
                     * <pre><code>
                     * InitHeaderLayout: function()
                     * {
                     *		Controls.InvoiceType__.Hide(true);
                     * },
                     * </code></pre>
                     */
                    InitHeaderLayout: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.InitLineItemsLayout
                     * @description
                     * Handle line items display
                     *  @example
                     * <pre><code>
                     * InitLineItemsLayout: function(lineItemsTable)
                     * {
                     *		lineItemsTable.Buyer__.Hide(true);
                     *		lineItemsTable.Receiver__.Hide(true);
                     * },
                     * </code></pre>
                     */
                    InitLineItemsLayout: function (lineItemsTable) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SetCustomHeaderEvents
                     * @description
                     * Init header event handlers
                     *  @example
                     * <pre><code>
                     * SetCustomHeaderEvents: function()
                     * {
                     *		Controls.Z_BAPPrixPartiel__.OnChange = function()
                     *		{
                     *			Controls.Z_BAP.Hide(Controls.Z_BAPPrixPartiel__.IsChecked());
                     *		};
                     * },
                     * </code></pre>
                     */
                    SetCustomHeaderEvents: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SetCustomLineItemsEvents
                     * @description
                     * Init line items event handlers
                     *  @example
                     * <pre><code>
                     * SetCustomLineItemsEvents: function()
                     * {
                     *		Controls.LineItems__.Z_BAPPrix__.OnChange = function()
                     *		{
                     *	 		var item = this.GetItem();
                     *			Controls.Z_BAP.Hide(item.GetValue("Z_BAPPrix__"));
                     *		};
                     * },
                     * </code></pre>
                     */
                    SetCustomLineItemsEvents: function () {
                    }
                };
                /**
                 * @namespace Lib.AP.Customization.HTMLScripts.CustomUserExits
                 * @description
                 * Allows you to define custom user exists added for this customer
                 * Functions defined in this scope will be accessible from outside this library
                 * They can be called the following way Lib.AP.Customization.HTMLScripts.CustomUserExits.OnCompanyCodeChange(queryResult)
                 * @example
                 * <pre><code>
                 * CustomUserExits:
                 * {
                 *		OnCompanyCodeChange: function (queryResult)
                 *		{
                 *			//Call a business function to handle the custom behavior to be applied
                 *			//See CustomHelpers object definition below
                 *			CustomHelpers.HandleVendorWarning();
                 *		}
                 * },
                 * </code></pre>
                 */
                HTMLScripts.CustomUserExits = {};
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnHTMLScriptBegin
                 * @summary CLIENT_WEB|CLIENT_MOBILE
                 * @description
                 * This user exit is called at the beginning  of the HTML page script right after configuration determination.
                 * Allows you to load as early as possible some extensions in the Vendor invoice process.
                 * Form initialisation can be delayed by returning a resolved promise.
                 * @returns {Promise<any> | void}
                 * @example
                 * <pre><code>
                 * OnHTMLScriptBegin: function ()
                 * {
                 * 	 // Assuming DoInitQueries returns a Promise.
                 *   var $delayedInit = DoInitQueries().Then(function(result)
                 *   {
                 * 		Log.Info("Customization loaded right after the configuration");
                 * 	 });
                 *   return $delayedInit;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnHTMLScriptBegin = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnHTMLScriptEnd
                 * @summary CLIENT_WEB|CLIENT_MOBILE
                 * @description
                 * This user exit is called at the end of the HTML page script of the Vendor invoice process.
                 * Allows you to customize layout settings of the Vendor invoice process.
                 * If you need to customize callback functions associated with control events, refer to HTML page script API: Control events.
                 * @example
                 * <pre><code>
                 * OnHTMLScriptEnd: function ()
                 * {
                 * 	 if (Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart)
                 * 	 {
                 *		// When the AP specialist changes the buyer or receiver, the workflow is refreshed
                 *		Controls.LineItems__.Buyer__.OnChange = refreshWorkflow;
                 *		Controls.LineItems__.Receiver__.OnChange = refreshWorkflow;
                 * 	 }
                 * }
                 * </code></pre>
                 *
                 * This example allows you to customize different options in conversations, for example :
                 *  - the list of recipient for the conversation with the option "recipientList"
                 *  - the email template to use with the option "emailTemplate"
                 *  - custom tags with the option "emailCustomTags"
                 * @example
                 * <pre><code>
                 * OnHTMLScriptEnd: function ()
                 * {
                 *	 var options =
                 *	 {
                 *		ignoreIfExists: false,
                 *		notifyByEmail: true,
                 *		notifyAllUsersInGroup: false,
                 *		recipientList: ["cfoprocess.wegeneren@esker.com","buyerprocess.wegeneren@esker.com"],
                 *		emailTemplate: "Conversation_MissedItem_Custom.htm",
                 *		emailCustomTags: {
                 *			DocumentNumber: Data.GetValue("InvoiceNumber__")
                 *		},
                 *		externalContributors: [
                 *	 	{
                 *			emailAddress: "prunelle@example.com",
                 *			emailSubject: "email to Prunelle",
                 *			emailTemplate: "notifPrunelle.htm"
                 *		},
                 *		{
                 *			emailAddress: "test2@example.com"
                 *		}]
                 *	};
                 *	Controls.ConversationUI__.SetOptions(options);
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnHTMLScriptEnd = function () {
                    //Handle displayed header fields
                    LayoutHelpers.InitHeaderLayout();
                    //Init header event handlers
                    LayoutHelpers.SetCustomHeaderEvents();
                    //Init line items event handlers
                    LayoutHelpers.SetCustomLineItemsEvents();
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.AddCustomTopMessagesWarning
                 * @since 353
                 * @description
                 * Allows you to add custom warning messages in the banner at the top of the VIP form.
                 * @returns {string[]} An array of warning messages.
                 * @example
                 * <caption>Adding custom warning messages in the top banner</caption>
                 * <pre><code>
                 * AddCustomTopMessagesWarning: function ()
                 * {
                 *		return [
                 *			"First warning message",
                 *			"Second warning message"
                 *		];
                 * }
                 * </code></pre>
                 */
                HTMLScripts.AddCustomTopMessagesWarning = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnRefreshLineItemsTableEnd
                 * @description
                 * Allows you to customize layout settings for the line items table in the Vendor invoice process.
                 * You can use it to hide or show columns.
                 * This user exit is called from the HTML page script of the Vendor invoice process, when updating the line items table layout.
                 * @param {Table} lineItemsTable The line items table
                 * @example
                 * <pre><code>
                 * OnRefreshLineItemsTableEnd: function (lineItemsTable)
                 * {
                 *		// Always show vendor number on line items
                 *		lineItemsTable.VendorNumber__.Hide(false);
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnRefreshLineItemsTableEnd = function (lineItemsTable) {
                    //Update line items layout
                    LayoutHelpers.InitLineItemsLayout(lineItemsTable);
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnRefreshLineItemRowEnd
                 * @description
                 * Allows you to customize layout settings of each line item in the Vendor invoice process.
                 * You can use it to set a field as read-only or required. You can customize rows according to the type of line item to which they correspond (PO or non-PO).
                 * This user exit is called from the HTML page script of the Vendor invoice process, when updating each line item.
                 * @param {TableRow} lineItemRow The line item
                 * @example
                 * <pre><code>
                 * OnRefreshLineItemRowEnd: function (lineItemRow)
                 * {
                 *		// Tax code readonly for PO lines
                 *		lineItemRow.TaxCode__.SetReadOnly(lineItemRow.LineType__.GetValue() === Lib.P2P.LineType.PO);
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnRefreshLineItemRowEnd = function (lineItemRow) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnRefreshApproversListRowEnd
                 * @description
                 * Allows you to customize layout settings of each Workflow line in the Vendor invoice process.
                 * For instance, you could override rows parameters according to the customer needs such as blocking the possibility to manually add approvers.
                 * This user exit is called from the HTML page script of the Vendor invoice process, when updating each Workflow line.
                 * @param {object} workflowUIParameters The Worflow parameters
                 * @param {IControlTable} table The Workflow table
                 * @param {ITableRow} row The Workflow table row
                 * @param {number} index The row index in the Workflow table
                 * @example
                 * <pre><code>
                 *	OnRefreshApproversListRowEnd: function (workflowUIParameters, table, row, index)
                 *	{
                 *		// Prevent users to change the workflow that has been computed by the system
                 *		const contributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(row);
                 *		if (contributor.role === 'approver')
                 *		{
                 *			table.HideTableRowDeleteForItem(index, true);
                 *			table.HideTableRowAddForItem(index, true);
                 *			row.Approver__.SetBrowsable(false);
                 *			row.Approver__.SetHoverMessage();  // remove display of on hover for information on user added to the workflow
                 *		}
                 *	},
                 * </code></pre>
                 */
                HTMLScripts.OnRefreshApproversListRowEnd = function (workflowUIParameters, table, row, index) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.GetContributorsExtraFilter
                 * @description
                 * Allows you to customize the filter used when browsing for users in the workflow pane of the Vendor invoice process.
                 * This user exit is called from the HTML Page script of the Vendor invoice process, when browsing for users.
                 * @param {string} role Role of the contributor to select.
                 * @return {array} result An array of LDAP filters that will be used to filter the contributors.
                 * @example
                 * <pre><code>
                 * GetContributorsExtraFilter: function(role)
                 * {
                 * 	// exclude ap specialists
                 * 	var extraFilters = [ "(!(LOGIN=ap*))" ];
                 * 	if (role === Lib.AP.WorkflowCtrl.roles.controller)
                 * 	{
                 * 		// Include CFOs only
                 * 		extraFilters.push("LOGIN=cfo*");
                 * 	}
                 * 	else if (role === Lib.AP.WorkflowCtrl.roles.approver)
                 * 	{
                 * 		// Include cost center owners only
                 * 		extraFilters.push("LOGIN=ccowner*");
                 * 	}
                 * 	return extraFilters;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.GetContributorsExtraFilter = function (role) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.GetColumnsOrder
                 * @description
                 * Allows you to customize the order of the columns of the line items table in the Vendor invoice process.
                 * This user exit is called from the HTML Page script of the Vendor invoice process, when initializing the process form.
                 * This user exit is disabled when the Vendor invoice process is in design mode. If you enable the design mode after calling this user exit, the columns of the items table are reordered as they were before the user exit was called.
                 * @param {string} inputColumnsOrdered Array that contains the name of the columns of the line items table. The order of the columns in the array represents the order in which the columns are arranged in the line items table before calling the user exit.
                 * @return {array} result Array containing the name of the columns of the table, in the order in which they are to be arranged.
                 * @example
                 * <pre><code>
                 * GetColumnsOrder: function(inputColumnsOrdered)
                 * {
                 *	// example 1 explicit list
                 *	// Put GLAccount__ and GLDescription__ at the begining of the lineItems__ table
                 * 	return ["GLAccount__","GLDescription__"];
                 * }
                 * </code></pre>
                 * @example
                 * <pre><code>
                 * GetColumnsOrder: function(inputColumnsOrdered)
                 * {
                 *   // example 2 : Manipulate the initial LineItems__ array
                 * 	// Move the PartNumber__ Column at the begining of the table if defined
                 *	var idx = inputColumnsOrdered.indexOf("PartNumber__"); // find the index of the column PartNumber__
                 * 	if (idx !== -1 )
                 * 	{
                 *		// Pop the ParNumber__ item
                 *       var partNumber = inputColumnsOrdered.splice(idx, 1)[0];
                 *		// Add the PartNumber at the begining of the table
                 *		inputColumnsOrdered.unshift(partNumber);
                 * 	}
                 * 	return inputColumnsOrdered;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.GetColumnsOrder = function (inputColumnsOrdered) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnDetermineLayout
                 * @description
                 * Allows you to choose the layout displayed for each users or profiles of the Vendor invoice process.
                 * This user exit is called from the HTML Page script of the Vendor invoice process, when selecting the layout to display.
                 * @return {0|1} value The layout to apply:
                 * - 0: Full layout
                 * - 1: Light layout
                 * @example
                 * <pre><code>
                 * OnDetermineLayout: function ()
                 * {
                 *		// Grant full layout for approvers
                 *		if (User.profileName === "P2P Approver Profile")
                 *		{
                 *			return 0;
                 *		}
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnDetermineLayout = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnAdaptProcessLayoutToStepEnd
                 * @description
                 * Allows you to customize layout settings in the Vendor invoice form after
                 * it has been set layout according to the step in the workflow.
                 * * @param {boolean} bIsInApprovalWorkflow Whether the process is in an approval workflow
                 * * @param {boolean} bInDataCaptureMode Whether the process is in data capture mode
                 * * @param {boolean} bUseLightLayout Whether the process is using the light layout
                 * @example
                 * <pre><code>
                 * OnAdaptProcessLayoutToStepEnd: function (bIsInApprovalWorkflow, bInDataCaptureMode, bUseLightLayout)
                 * {
                 *		if (bUseLightLayout && ProcessInstance.isEditing)
                 *		{
                 *	    	Controls.VendorInformation.SetReadOnly(true);
                 *	        Controls.HeaderDataPanel.SetReadOnly(true);
                 *	        Controls.LineItems__.Amount__.SetReadOnly(true);
                 *	        Controls.LineItems__.Quantity__.SetReadOnly(true);
                 *	        Controls.LineItems__.Z_Item_Start__.SetReadOnly(false);
                 *	        Controls.LineItems__.Z_Item_End__.SetReadOnly(false);
                 *	        Controls.RelatedInvoice__.SetReadOnly(true);
                 *	        Controls.LineItems__.TaxAmount__.SetReadOnly(true);
                 *	        Controls.LineItems__.TaxRate__.SetReadOnly(true);
                 *	    }
                 * 	}
                 * </code></pre>
                 */
                HTMLScripts.OnAdaptProcessLayoutToStepEnd = function (bIsInApprovalWorkflow, bInDataCaptureMode, bUseLightLayout) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnUpdateLayoutEnd
                 * @description
                 * Allows you to customize layout settings in the Vendor invoice form when the invoice type or the ERP type changes.
                 * This user exit is called from the HTML page script of the Vendor invoice process, when changing the invoice type or ERP type.
                 * @example
                 * <pre><code>
                 * OnUpdateLayoutEnd: function ()
                 * {
                 *		// Fill Automatically the Description field according to the Invoice Type
                 *		var isPOInvoice = Lib.AP.InvoiceType.isPOInvoice();
                 *		var vendorName = Data.GetValue("VendorName__") || "";
                 *		var invoiceDescription = "";
                 *		if (isPOInvoice)
                 *		{
                 *			invoiceDescription = vendorName + " PO Invoice";
                 *		}
                 *		else
                 * 		{
                 *			invoiceDescription = vendorName + " FI Invoice";
                 *		}
                 *		Data.SetValue("InvoiceDescription__", invoiceDescription);
                 * 	}
                 * </code></pre>
                 */
                HTMLScripts.OnUpdateLayoutEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnERPUpdateLayoutEnd
                 * @description
                 * Allows you to customize layout settings in the Vendor invoice form with ERP configured.
                 * This user exit is called from the HTML page script of the Vendor invoice process with ERP configured.
                 * @example
                 * <pre><code>
                 * OnERPUpdateLayoutEnd: function ()
                 * {
                 *		// Fill Automatically the Description field according to the Invoice Type
                 *		var isPOInvoice = Lib.AP.InvoiceType.isPOInvoice();
                 *		var vendorName = Data.GetValue("VendorName__") || "";
                 *		var invoiceDescription = "";
                 *		if (isPOInvoice)
                 *		{
                 *			invoiceDescription = vendorName + " PO Invoice";
                 *		}
                 *		else
                 * 		{
                 *			invoiceDescription = vendorName + " FI Invoice";
                 *		}
                 *		Data.SetValue("InvoiceDescription__", invoiceDescription);
                 * 	}
                 * </code></pre>
                 */
                HTMLScripts.OnERPUpdateLayoutEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnGenericUpdateLayoutEnd
                 * @description
                 * Allows you to customize layout settings in the Vendor invoice form when the ERP type is Generic.
                 * This user exit is called from the HTML page script of the Vendor invoice process, when the ERP type is Generic.
                 * @example
                 * <pre><code>
                 * OnGenericUpdateLayoutEnd: function ()
                 * {
                 *		// Fill Automatically the Description field according to the Invoice Type
                 *		var isPOInvoice = Lib.AP.InvoiceType.isPOInvoice();
                 *		var vendorName = Data.GetValue("VendorName__") || "";
                 *		var invoiceDescription = "";
                 *		if (isPOInvoice)
                 *		{
                 *			invoiceDescription = vendorName + " PO Invoice";
                 *		}
                 *		else
                 * 		{
                 *			invoiceDescription = vendorName + " FI Invoice";
                 *		}
                 *		Data.SetValue("InvoiceDescription__", invoiceDescription);
                 * 	}
                 * </code></pre>
                 */
                HTMLScripts.OnGenericUpdateLayoutEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnSAPUpdateLayoutEnd
                 * @description
                 * Allows you to customize layout settings in the Vendor invoice form when the ERP type is SAP.
                 * This user exit is called from the HTML page script of the Vendor invoice process, when the ERP type is SAP.
                 * @example
                 * <pre><code>
                 * OnSAPUpdateLayoutEnd: function ()
                 * {
                 *		// Fill Automatically the Description field according to the Invoice Type
                 *		var isPOInvoice = Lib.AP.InvoiceType.isPOInvoice();
                 *		var vendorName = Data.GetValue("VendorName__") || "";
                 *		var invoiceDescription = "";
                 *		if (isPOInvoice)
                 *		{
                 *			invoiceDescription = vendorName + " PO Invoice";
                 *		}
                 *		else
                 * 		{
                 *			invoiceDescription = vendorName + " FI Invoice";
                 *		}
                 *		Data.SetValue("InvoiceDescription__", invoiceDescription);
                 * 	}
                 * </code></pre>
                 */
                HTMLScripts.OnSAPUpdateLayoutEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnSAPS4CloudUpdateLayoutEnd
                 * @description
                 * Allows you to customize layout settings in the Vendor invoice form when the ERP type is SAPS4Cloud.
                 * This user exit is called from the HTML page script of the Vendor invoice process, when the ERP type is SAPS4Cloud.
                 * @example
                 * <pre><code>
                 * OnSAPS4CloudUpdateLayoutEnd: function ()
                 * {
                 *		// Fill Automatically the Description field according to the Invoice Type
                 *		var isPOInvoice = Lib.AP.InvoiceType.isPOInvoice();
                 *		var vendorName = Data.GetValue("VendorName__") || "";
                 *		var invoiceDescription = "";
                 *		if (isPOInvoice)
                 *		{
                 *			invoiceDescription = vendorName + " PO Invoice";
                 *		}
                 *		else
                 * 		{
                 *			invoiceDescription = vendorName + " FI Invoice";
                 *		}
                 *		Data.SetValue("InvoiceDescription__", invoiceDescription);
                 * 	}
                 * </code></pre>
                 */
                HTMLScripts.OnSAPS4CloudUpdateLayoutEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnManualLinkERPInvoiceNumberEnd
                 * @since 345
                 * @description
                 * Allows you to customize the Vendor invoice form right after a manual link action is triggered on an ERP invoice number field.
                 * This user exit is called from the HTML page script of the Vendor invoice process for all ERP integrations.
                 * It is triggered both when linking to an ERP invoice (FI or MM) and when clearing the manual link.
                 * @param {DatabaseComboBox} erpInvoiceNumberControl The ERP invoice number control (Controls.ERPInvoiceNumber__ for FI or Controls.ERPMMInvoiceNumber__ for MM)
                 * @example
                 * OnManualLinkERPInvoiceNumberEnd: function (erpInvoiceNumberControl)
                 * {
                 *		var erpInvoiceNumber = erpInvoiceNumberControl.GetValue();
                 *		Log.Info("Manual link triggered. ERP invoice number value: " + (erpInvoiceNumber || "<cleared>"));
                 * }
                 */
                HTMLScripts.OnManualLinkERPInvoiceNumberEnd = function (erpInvoiceNumberControl) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnUpdateButtonBarEnd
                 * @description
                 * Allows you to perform customizations in the Vendor invoice form when the toolbar at the bottom of the form is updated.
                 * This user exit is called from the HTML page script of the Vendor invoice process after the button bar is updated by a workflow calculation.
                 * @example
                 * <pre><code>
                 * OnUpdateButtonBarEnd: function ()
                 * {
                 *		// Hide resubmit button for users
                 *		Controls.Reprocess.Hide(User.profileRole !== "accountManagement");
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnUpdateButtonBarEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnDisableButtons
                 * @description
                 * Allows you to customize the way buttons are either disabled or enabled in the buttons bar at the bottom of the form
                 * You can use it to hide or show standard and/or custom buttons.
                 * This user exit is called from the HTML page script of the Vendor invoice process, whenever asynchronous processing is either triggered or completed
                 * @param {boolean} disable Whether or not the action is called to disable buttons (true: disable, false: do not disable)
                 * @param {string} group Processing action that triggered the call to the DisableButtons method
                 * @param {boolean} disableState Whether or not buttons are currently disabled (true: disabled, false: editable)
                 * @example
                 * <pre><code>
                 * OnDisableButtons: function (disable, group, disableState)
                 * {
                 *		Controls.Z_CustomButton.SetDisabled(disableState);
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnDisableButtons = function (disable, group, disableState) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnLoadClipboardAddLine
                 * @description
                 * Allows to customize current item on LoadClipboard before the endAddLines call.
                 * Next lines processing can be delayed by returning a resolved promise.
                 * @param {Item} item The current line item added by LoadClipboard.
                 * @return {Promise<any> | void}
                 * @example
                 * <pre><code>
                 * OnLoadClipboardAddLine: function (item)
                 * {
                 * 	item.SetValue("Z_LineSource__", "LoadFromClipboard");
                 * 	return Sys.Helpers.Promise.Resolve();
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnLoadClipboardAddLine = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnLoadClipboardEndAddLines
                 * @description
                 * Allows customizations after all lines items have been loaded from clipboard in the Vendor invoice process.
                 * This user exit is called from the HTML Page script of the Vendor invoice process, after all line items have been imported on webform using Load line items from clipboard dialog.
                 * @example
                 * <pre><code>
                 * OnLoadClipboardEndAddLines: function()
                 * {
                 * 	CustomHelpers.CheckDimensionsAreValid();
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnLoadClipboardEndAddLines = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.AddLoadClipboardPreviewColumn
                 * @since 345
                 * @description
                 * Allows customization of column types in the LoadClipboard preview dialog.
                 * This user exit enables adding different column types (Date, DateTime, etc.) beyond the standard Decimal and Text columns.
                 * Return the appropriate column add function based on the field type, or undefined to use the default Text column.
                 * @param {string} fieldType - The field type (e.g., "Date", "DateTime", "Boolean", etc.)
                 * @param {IControlTable} previewTable The preview table control for the LoadClipboard dialog
                 * @returns {anyFunction | void} - The column add function (e.g., previewTable.AddDateColumn) or undefined to use default
                 *
                 * @example
                 * AddLoadClipboardPreviewColumn = function(fieldType, previewTable)
                 * {
                 *     if (fieldType === "Date")
                 *     {
                 *         return previewTable.AddDateColumn;
                 *     }
                 *     else if (fieldType === "DateTime")
                 *     {
                 *         return previewTable.AddDateTimeColumn;
                 *     }
                 *     else if (fieldType === "Boolean")
                 *     {
                 *         return previewTable.AddCheckBoxColumn;
                 *     }
                 *     // Return undefined to use default AddTextColumn
                 *     return undefined;
                 * }
                 */
                HTMLScripts.AddLoadClipboardPreviewColumn = function (fieldType, previewTable) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.GetClipboardAvailableColumns
                 * @since 361
                 * @description
                 * Allows filtering the list of available columns for the Load line items from clipboard feature in the Vendor invoice process.
                 * This user exit is called from the Vendor Invoice custom script after retrieving the full ordered column list from the line items table, before building the available-column map.
                 * Return a filtered subset of the columns array to restrict which columns can be used as clipboard import targets.
                 * Return nothing (or undefined) to use the full list of columns as default behavior.
                 * @param {string[]} columns - The full ordered list of column names from Controls.LineItems__.GetColumnsOrder()
                 * @returns {string[] | void} - A filtered array of column names, or void/undefined to use all columns
                 * @example
                 * GetClipboardAvailableColumns = function(columns)
                 * {
                 * 	return columns.filter(function(column)
                 * 	{
                 * 		return Controls.LineItems__[column].IsVisible() && !Controls.LineItems__[column].IsReadOnly();
                 * 	});
                 * }
                 */
                HTMLScripts.GetClipboardAvailableColumns = function (columns) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnLoadTemplateLine
                 * @description
                 * Allows to add new behaviors when a new line item is added when a template is loaded
                 * @example
                 * <pre><code>
                 * OnLoadTemplateLine: function (item)
                 * {
                 *		Lib.P2P.Customization.Common.UpdateWorkflowDimensions(item);
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnLoadTemplateLine = function (item) {
                };
                /**
                * @method Lib.AP.Customization.HTMLScripts.OnLoadTemplateEnd
                * @description
                * Allows to add new behaviors after a new template has been loaded
                * @example
                * <pre><code>
                * OnLoadTemplateEnd: function ()
                * {
                *		Data.SetValue("Z_Field", "customValue");
                * }
                * </code></pre>
                */
                HTMLScripts.OnLoadTemplateEnd = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.GetLineItemsImporterMapping
                 * @description
                 * Allows you to customize the mapping used when loading line items from the clipboard in the Vendor invoice process.
                 * This user exit is called from the HTML Page script of the Vendor invoice process, when clicking on Show preview in the Load line items from clipboard dialog.
                 * @return {object} mapping The mapping to use
                 * @example
                 * <pre><code>
                 * GetLineItemsImporterMapping: function()
                 * {
                 *	// Mapping example for vendor MJ when pasting data like this
                 *	// Account	Amount	Text	Business Area	Cost Center	Tax Code
                 *	// 906010	16.13$	supplies	0999	001300	V0
                 *	// 906010	14.59$	misc	0999	001300	V9
                 *
                 *	if (Data.GetValue("VendorNumber__") === "MJ1186")
                 *	{
                 *		return {
                 *			hasHeader: true,
                 *			separator: "\t",
                 *			columns: [
                 *				{ "header": "Account", "lineItemsColumn": "GLAccount__", "type": "Text" },
                 *				{ "header": "Amount", "lineItemsColumn": "Amount__", "type": "Decimal", "convert": function(v) { return parseFloat(v); } },
                 *				{ "header": "Text", "lineItemsColumn": null },	// ignore this column
                 *				{ "header": "Business Area", "lineItemsColumn": "BusinessArea__", "type": "Text" },
                 *				{ "header": "Cost Center", "lineItemsColumn": "CostCenter__", "type": "Text" },
                 *				{ "header": "Tax Code", "lineItemsColumn": "TaxCode__", "type": "Text" }
                 *			],
                 *			customMap: [
                 *				"GLAccount__",
                 *				"Amount__",
                 *				"BusinessArea__",
                 *				"CostCenter__",
                 *				"TaxCode__"
                 *			]
                 *		};
                 *	}
                 *	return null;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.GetLineItemsImporterMapping = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeGuessedColumnMapping
                 * @since 347
                 * @description
                 * Allows you to customize the mapping for each column when the system automatically guesses the column mapping from clipboard data in the Vendor invoice process.
                 * This user exit is called for each unmatched column header during the Load line items from clipboard operation, after the system has made its best guess.
                 * Unlike GetLineItemsImporterMapping which only works with predefined mappings, this user exit allows you to modify or correct the automatically guessed mappings.
                 * @param {string} headerName The name of the column header from the clipboard data
                 * @param {object} guessedColumn The column mapping guessed by the system with properties:
                 * - columnName: the line items field name that was guessed (e.g., "Amount__", "Description__"). Set to null to exclude the column from mapping entirely.
                 * - type: the data type guessed ("Text", "Decimal", etc.)
                 * - found: boolean indicating if a mapping was found (true) or if it's a fallback guess (false)
                 * - convert: optional conversion function for the data
                 * @return {object} The customized column mapping object with the same structure as guessedColumn, or nothing to use the default guess
                 * NOTE: Returning a column with columnName: null will completely exclude that column from the mapping (it won't appear in the mapping dialog)
                 * @example
                 * CustomizeGuessedColumnMapping: function(headerName, guessedColumn)
                 * {
                 *     // Example 1: Map vendor-specific column names to standard fields
                 *     if (Data.GetValue("VendorNumber__") === "ACME123")
                 *     {
                 *         if (headerName === "Item #")
                 *         {
                 *             return {
                 *                 columnName: "ItemNumber__",
                 *                 type: "Text",
                 *                 found: true
                 *             };
                 *         }
                 *         if (headerName === "G/L")
                 *         {
                 *             return {
                 *                 columnName: "GLAccount__",
                 *                 type: "Text",
                 *                 found: true
                 *             };
                 *         }
                 *     }
                 *
                 *     // Example 2: Add custom conversion for specific columns
                 *     if (headerName.toLowerCase().indexOf("price") >= 0)
                 *     {
                 *         return {
                 *             columnName: guessedColumn.columnName,
                 *             type: "Decimal",
                 *             found: guessedColumn.found,
                 *             convert: function(v) {
                 *                 // Remove currency symbols and convert
                 *                 return parseFloat(v.replace(/[$€£]/g, ""));
                 *             }
                 *         };
                 *     }
                 *
                 *     // Example 3: Mark unmapped columns as found if they match custom criteria
                 *     if (!guessedColumn.found && headerName.startsWith("Z_"))
                 *     {
                 *         return {
                 *             columnName: headerName,  // Keep the original name
                 *             type: "Text",
                 *             found: true  // Mark as found to avoid "no mapping" warning
                 *         };
                 *     }
                 *
                 *     // Example 4: Exclude specific columns from mapping entirely
                 *     if (headerName === "Internal Notes" || headerName === "Ignore This")
                 *     {
                 *         return {
                 *             columnName: null,  // Setting to null excludes column from mapping
                 *             type: null,
                 *             found: false
                 *         };
                 *     }
                 *
                 *     // Return nothing to use the default guessed mapping
                 * }
                 */
                HTMLScripts.CustomizeGuessedColumnMapping = function (headerName, guessedColumn) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.GetBrowseQueryExtraFields
                 * @description
                 * Returns an array of strings containing a list of fields to add to the query.
                 * Those fields won't be displayed on the browse page but could be used later on other user exits based on the query result.
                 * ATTENTION: Fields added with the GetBrowseQueryExtraFields user exit are not displayed in the browse dialog
                 * @param {string} tableName The table name the query is related to
                 * @returns {string[]} An array containing each field to add to the query
                 * @example
                 * <pre><code>
                 * GetBrowseQueryExtraFields: function(tableName)
                 * {
                 *	// Supposing a specific field IsOpened__ has been added to "AP - Purchase order - Headers__"
                 *	// and a specific field IsItemOpened__ has been added to "AP - Purchase order - Items__"/"P2P - Goods receipt - Items__"
                 * 	var extraFields = [];
                 * 	if (tableName === "AP - Purchase order - Headers__")
                 *	{
                 *		extraFields.push("IsOpened__");
                 *	}
                 * 	if (tableName === "AP - Purchase order - Items__")
                 *	{
                 *		extraFields.push("IsItemOpened__");
                 *	}
                 * 	if (tableName === "P2P - Goods receipt - Items__")
                 *	{
                 *		extraFields.push("IsItemOpened__");
                 *	}
                 *	return extraFields;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.GetBrowseQueryExtraFields = function (tableName) {
                    return null;
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.IsPurchaseOrderOpened
                 * @description
                 * Use this function to customize the opened filter in the purchase order browse.
                 * To add specific field to recordDefinition use the User Exit GetBrowseQueryExtraFields.
                 * @param {boolean} defaultValue is the purchase order considered as opened by default
                 * @param {object} queryResult object containing the result of the query
                 * @param {integer} recordIndex index of the current record in the queryResult
                 * @return {boolean} is the Purchase order is openned
                 * @example
                 * <pre><code>
                 * IsPurchaseOrderOpened: function(defaultValue, queryResult, recordIndex)
                 * {
                 *	// deal only with PO tagged as opened (see GetBrowseQueryExtraFields customisation)
                 *   // fields name are uppercased in recordDefinition
                 *   if (queryResult)
                 * 	{
                 *       var value = queryResult.GetQueryValue("ISOPENED__", recordIndex);
                 *		if (value)
                 *		{
                 *			return  value === "1";
                 *		}
                 *       else
                 *		{
                 *			Log.Warn("IsPurchaseOrderOpened user exit uses field ISOPENED__ not retrieved by query!");
                 *		}
                 *	}
                 * }
                 * </code></pre>
                 */
                HTMLScripts.IsPurchaseOrderOpened = function (defaultValue, queryResult, recordIndex) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.IsPurchaseOrderItemOpened
                 * @description
                 * Use this function to customize the opened item filter in the purchase order browse
                 * To add specific field to recordDefinition use the User Exit GetBrowseQueryExtraFields.
                 * @param {boolean} defaultValue is the item considered as opened by default
                 * @param {object} queryResult object containing the result of the query
                 * @param {integer} recordIndex index of the current record in the queryResult
                 * @return {boolean} is the Purchase order item is opened
                 * @example
                 * <pre><code>
                 * IsPurchaseOrderItemOpened: function(defaultValue, queryResult, recordIndex)
                 * {
                 *	// deal only with PO tagged as opened (see GetBrowseQueryExtraFields customisation)
                 *   // fields name are uppercased in recordDefinition
                 *   if (queryResult)
                 * 	{
                 *       var value = queryResult.GetQueryValue("ISITEMOPENED__", recordIndex);
                 *		if (value)
                 *		{
                 *			return  value === "1";
                 *		}
                 *       else
                 *		{
                 *			Log.Warn("IsPurchaseOrderOpened user exit uses field ISITEMOPENED__ not retrieved by query!");
                 *		}
                 *	}
                 * }
                 * </code></pre>
                 */
                HTMLScripts.IsPurchaseOrderItemOpened = function (defaultValue, queryResult, recordIndex) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.IsItemDuplicable
                 * @description
                 * Allows you to specify whether a line item in the Vendor invoice process can be duplicated or not.
                 * This user exit is called from the HTML Page script of the Vendor invoice process, when clicking on Duplicate line in the ☰ menu on the line.
                 * @param {object} item the line item the user is trying to duplicate
                 * @return {boolean} is the line item duplicable. You can also return null to work with the default behavior.
                 * @example
                 * <pre><code>
                 * IsItemDuplicable: function(item)
                 * {
                 *	// avoid PO items to be duplicated
                 *	if (item && item.GetValue("LineType__") === Lib.P2P.LineType.PO)
                 *	{
                 *		return false;
                 *	}
                 *	return true;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.IsItemDuplicable = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnLineItemDelete
                 * @since 358
                 * @description
                 * Called before a line item deletion recalculates header amounts.
                 * Use to remove sibling items or apply any custom deletion logic.
                 * @param {Item} item the line item being deleted
                 * @example <caption>Remove all sibling lines sharing the same GI number (consignment invoice scenario)</caption>
                 * HTMLScripts.OnLineItemDelete = function (item)
                 * {
                 *	var goodIssue = item.GetValue("GoodIssue__");
                 *	if (goodIssue)
                 *	{
                 *		var lineItems = Data.GetTable("LineItems__");
                 *		for (var i = lineItems.GetItemCount() - 1; i >= 0; i--)
                 *		{
                 *			var sibling = lineItems.GetItem(i);
                 *			if (sibling !== item && sibling.GetValue("GoodIssue__") === goodIssue)
                 *			{
                 *				sibling.Remove();
                 *			}
                 *		}
                 *	}
                 * };
                 */
                HTMLScripts.OnLineItemDelete = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnVendorChange
                 * @description
                 * Allows you to run logic after a user changes the vendor name or vendor number.
                 * @param {object} queryResult The vendor returned by GetVendorByName/GetVendorByNumber query
                 * @example
                 * <pre><code>
                 * OnVendorChange: function(queryResult)
                 * {
                 *   //Call a business function to handle the custom behavior to be applied
                 *	 //See CustomHelpers object definition below
                 *	 CustomHelpers.HandleVendorWarning();
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnVendorChange = function (queryResult) {
                };
                /**
                * @method Lib.AP.Customization.HTMLScripts.OnFillVendorContactEmail
                * @description
                * Allows you to run logic after the vendor contact email has been filled
                * @param {Array<ESKMap<string>>} results List of vendor contacts returned by the query
                * @param {error} error Error raised by the vendor contacts query, if any
                * @example
                * <pre><code>
                * OnFillVendorContactEmail: function(result, error)
                * {
                *   // Always keep the vendor contact email read-only
                *	Controls.VendorContactEmail__.SetReadOnly(true);
                * }
                * </code></pre>
                */
                HTMLScripts.OnFillVendorContactEmail = function (results, error) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShouldClearVendorContactEmailOnLookupFailure
                 * @since 363
                 * @description
                 * Allows you to keep the vendor contact email currently displayed when no contact could be found for the vendor.
                 * By default the vendor contact email is cleared.
                 * @returns {boolean | void} false to keep the current vendor contact email, true or nothing to clear it
                 * @example <caption>Keep the vendor contact email entered manually when the vendor contact lookup returns no result</caption>
                 * ShouldClearVendorContactEmailOnLookupFailure = function ()
                 * {
                 *	return false;
                 * };
                 */
                HTMLScripts.ShouldClearVendorContactEmailOnLookupFailure = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.HistoryViewFilter
                 * @since 363
                 * @description
                 * Allows you to customize the filter used to fill the vendor history embedded view.
                 * @param {string} filter The standard filter computed from the vendor number, the invoice statuses and the company code
                 * @returns {string | void} The custom filter, or nothing to keep the standard one
                 * @example <caption>Restrict the vendor history to the invoices of the same sector</caption>
                 * HistoryViewFilter = function (filter)
                 * {
                 *	return Sys.Helpers.LdapUtil.FilterAnd(
                 *		filter,
                 *		Sys.Helpers.LdapUtil.FilterEqual("Z_SectorCode__", Data.GetValue("Z_SectorCode__"))
                 *	).toString();
                 * };
                 */
                HTMLScripts.HistoryViewFilter = function (filter) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.FilterWorkflowError
                 * @since 363
                 * @description
                 * Allows you to customize the workflow engine error displayed to the user.
                 * The error is always logged, even when its display is skipped.
                 * @param {string} errorMessage The workflow engine error message
                 * @returns {string | void} An empty string to skip the error popup, a non-empty string to replace the displayed message,
                 * or nothing to display the standard message
                 * @example <caption>Do not display the "Index is out of range" errors raised by the workflow engine</caption>
                 * FilterWorkflowError = function (errorMessage)
                 * {
                 *	if (/Index '-?\d+' is out of range\./.test(errorMessage))
                 *	{
                 *		return "";
                 *	}
                 * };
                 */
                HTMLScripts.FilterWorkflowError = function (errorMessage) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.GetTeachingValidityDatetime
                 * @since 363
                 * @description
                 * Allows you to customize the validity date of the teaching requests sent from the vendor invoice form.
                 * By default no validity date is sent and the one computed by the framework is used.
                 * @returns {string | void} The validity date as a DBDateTime, or nothing to keep the framework default validity
                 * @example <caption>Keep the teaching requests valid for 10 years</caption>
                 * GetTeachingValidityDatetime = function ()
                 * {
                 *	var validityDate = new Date();
                 *	validityDate.setFullYear(validityDate.getFullYear() + 10);
                 *	return Sys.Helpers.Date.Date2DBDateTime(validityDate);
                 * };
                 */
                HTMLScripts.GetTeachingValidityDatetime = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.IncludeCustomAPProfiles
                 * @description
                 * Allows modifying what types of users are given AP Specialist level access to the vendor invoice form.
                 * @param {boolean} isAPOrAdmin Whether the current user's profile is considered an AP specialist or Admin
                 * @return {boolean} If the current user should be given AP Specialist access to the form.
                 * @example
                 * <pre><code>
                 * IncludeCustomAPProfiles: function(isAPOrAdmin)
                 * {
                 *     // Include any profiles that start with the string "AP Specialist"
                 *     return isAPOrAdmin || /^AP Specialist/.test(User.profileName);
                 * }
                 * </code></pre>
                 */
                HTMLScripts.IncludeCustomAPProfiles = function (currentProfileIncluded) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShowRelatedInvoices
                 * @description
                 * Manage Credit Notes view visibility if On Hold or Set Aside action with "Waiting for credit memo" reason has been called.
                 * @returns {boolean} false if the Credit Notes view has to be hidden on opening form.
                 */
                HTMLScripts.ShowRelatedInvoices = function () {
                    return true;
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.Simulate
                 * @description
                 * Can be used to override simulation action.
                 * @returns {anyFunction | void} Function to call to simulate posting.
                 */
                HTMLScripts.Simulate = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnAdaptDataToCompanyCode
                 * @description
                 * Allows you to run logic after the company code field has been modified
                 * @param {boolean} companyCodeHasChanged Whether the new company code value is different than the previous value
                 * @example
                 * <pre><code>
                 * OnAdaptDataToCompanyCode: function(companyCodeHasChanged)
                 * {
                 * 	if (companyCodeHasChanged)
                 * 	{
                 * 		Data.SetValue("Z_MyCustomField__", "");
                 * 	}
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnAdaptDataToCompanyCode = function (companyCodeHasChanged) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeFieldsToResetOnCompanyCodeChange
                 * @description
                 * Allows you to customize the fields to reset when the company code changes.
                 * Rules applied may differ according to the invoice type and features enabled (eg. EnergyConsumptionReporting).
                 * Consider checking if a rule exists before deleting it.
                 * @param {FieldsToReset} fieldsToReset The fields to reset when the company code changes.
                 * @example
                 * <caption>Reset a custom field 'Z_MyCustomField__' to a desired value 'custom' and disable the rules to reset VendorNumber__ field and GLAccount__ column if any</caption>
                 * HTMLScripts.CustomizeFieldsToResetOnCompanyCodeChange = function(fieldsToReset)
                 * {
                 *   if (Object.prototype.hasOwnProperty.call(fieldsToReset.header, "VendorNumber__"))
                 *   {
                 * 		delete fieldsToReset.header.VendorNumber__;
                 * 	 }
                 *   if (Object.prototype.hasOwnProperty.call(fieldsToReset.LineItems__, "GLAccount__"))
                 *   {
                 * 		delete fieldsToReset.LineItems__.GLAccount__;
                 *   }
                 *   fieldsToReset.header.Z_MyCustomField__ = "custom";
                 * }
                 * </code></pre>
                 */
                HTMLScripts.CustomizeFieldsToResetOnCompanyCodeChange = function (fieldsToReset) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnBeforeUpdateLocalCurrency
                 * @description
                 * This user exit is called at the beginning of the Lib.ERP.Invoice.UpdateLocalCurrency function
                 * Allows you to run logic before the local currency update
                 * @example
                 * <pre><code>
                 * OnBeforeUpdateLocalCurrency: function ()
                 * {
                 *		var callback = function (res)
                 *		{
                 *			if (res)
                 *			{
                 *				var exchangeRate = res.ExchangeRate;
                 *				var value = Controls.InvoiceAmount__.GetValue();
                 *				//To handle inverse exchange rates
                 *				if (exchangeRate > 0)
                 *				{
                 *					exchangeRate = 1 / Math.abs(exchangeRate);
                 *				}
                 *				else
                 *				{
                 *					exchangeRate = Math.abs(exchangeRate);
                 *				}
                 *				Controls.Z_USD_Amount__.SetValue((value * exchangeRate) / res.LocalFactor);
                 *			}
                 *		};
                 *
                 *		var invoiceAmount = Controls.InvoiceAmount__.GetValue();
                 *		var currencyKey = Controls.InvoiceCurrency__.GetValue();
                 *		var foreignCurrencyKey = "USD";
                 *		var translationDate = Sys.Helpers.SAP.FormatToSAPDateTimeFormat(Controls.PostingDate__.GetValue());
                 *		var exchangeRate = 0;
                 *		Lib.AP.SAP.ConvertToForeignCurrencyClient(callback, invoiceAmount, currencyKey, foreignCurrencyKey, translationDate, exchangeRate, "M", true);
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnBeforeUpdateLocalCurrency = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizePopupCommentConfig
                 * @description
                 * Allows to customize the configuration used to configure the popup comment
                 * @param {Lib.P2P.Customization.PopupCommentConfig} conf The configuration of pop up comment
                 * @param {string} popupId The popup being customized, if any: "backToAP", "holdingInvoice", or "reject"
                 * @returns {Lib.P2P.Customization.PopupCommentConfig} The configuration of pop up comment customized
                 * @example
                 * <pre><code>
                 * CustomizePopupCommentConfig: function(conf, popupId)
                 * {
                 * 		if (popupId === "backToAP")
                 * 		{
                 * 			conf.commentRequired = true;
                 * 		}
                 * 		else if (popupId === "reject")
                 * 		{
                 * 			conf.title = "Custom Reject Title";
                 * 		}
                 * 		else if (popupId === "holdingInvoice")
                 * 		{
                 * 			conf.commentRequired = false;
                 * 		}
                 * 		return conf;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.CustomizePopupCommentConfig = function (conf, popupId) {
                    return conf;
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizePopupOkConfig
                 * @description
                 * Allows to customize the configuration used to configure the popup comment
                 * @param {Lib.P2P.Customization.PopupOkExtendedConfig} conf The configuration of pop up comment
                 * @returns {Lib.P2P.Customization.PopupOkExtendedConfig} The configuration of pop up comment customized
                 * @example
                 * <pre><code>
                 * CustomizePopupOkConfig: function(conf)
                 * {
                 *		conf.commentRequired = true;
                 *		return conf;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.CustomizePopupOkConfig = function (conf) {
                    return conf;
                };
                /**
                 * Specifics customization for SAP
                 * @method Lib.AP.Customization.HTMLScripts.ModifyUnmanagedFields
                 * @description
                 * Allows modifying what standard fields to disable and hide. This allows re-enabling standard fields that
                 * are by default unmanaged because of the customer's ERP configuration.
                 * @param { Array } unmanagedFields Array of strings representing header fields that are unmanaged and objects representing table fields that are unmanaged.
                 * @param { String } context The ERP configured, which changes which fields are unmanaged by default.
                 * @returns The modified unmanaged fields array.
                 * @example
                 * <pre><code>
                 * ModifyUnmanagedFields: function(unmanagedFields, context)
                 * {
                 * 	if (context == "generic")
                 * 	{
                 * 		var index = unmanagedFields.indexOf(function(fieldEntry) { return fieldEntry instanceof Object && fieldEntry.name == "CompanyCode__"; });
                 * 		unmanagedFields.splice(index, 1);
                 *	}
                 *
                 *	return unmangedFields;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.ModifyUnmanagedFields = function (unmanagedFields, context) {
                    return unmanagedFields;
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.UpdateNonBlockingErrorFields
                 * @description
                 * Allows modifying the list of form fields which errors are ignored when posting the invoice in the ERP.
                 * By default, only the ERPInvoiceNumber__ is in that list, to allow re-posting an invoice which initial posting failed.
                 * @param { Array } nonBlockingErrorFields Array representing header field names which errors are whitelisted upon posting.
                 * @returns The modified nonBlockingErrorFields array.
                 * @example
                 * <pre><code>
                 * UpdateNonBlockingErrorFields: function (nonBlockingErrorFields)
                 * {
                 * 		nonBlockingErrorFields.push("Z_BuyerName__");
                 * 		return nonBlockingErrorFields;
                 * }
                 * <pre><code>
                 */
                HTMLScripts.UpdateNonBlockingErrorFields = function (nonBlockingErrorFields) {
                    return nonBlockingErrorFields;
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.UpdateExceptionFieldControls
                 * @description
                 * Allows modifying the list of form controls related to touchless processing exceptions that either need to be hidden or displayed on the VIP form
                 * when user clicks the "Show/Hide processing options" button in the Parameters panel
                 * @param { Array } exceptionFieldControls Array representing header form controls which visibility in the Parameters panel must be toggled
                 * @returns The modified exceptionFieldControls array.
                 * @example
                 * <pre><code>
                 * UpdateExceptionFieldControls: function (exceptionFieldControls)
                 * {
                 * 	exceptionFieldControls.push(Controls.Z_BankMismatch__);
                 * 	return exceptionFieldControls;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.UpdateExceptionFieldControls = function (exceptionFieldControls) {
                    return exceptionFieldControls;
                };
                /**
                 * Specifics customization for the workflow
                 * @namespace Lib.AP.Customization.HTMLScripts.SAP
                 */
                HTMLScripts.SAP = {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnFIHeaderSet
                     * @description
                     * Allows you to customize the SAP header information transmitted through the BAPI parameters of the FIHeaderSet function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
                     * @param {object} params The BAPI structure that will be send to SAP
                     * @param {object} documentHeader The DOCUMENTHEADER structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnFIHeaderSet: function (params, documentHeader)
                     * {
                     * 	documentHeader.SAPFIELD = Data.GetValue("MyNewField__");
                     * }
                     * </code></pre>
                     */
                    OnFIHeaderSet: function (params, documentHeader) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnFIAddVendorLine
                     * @description
                     * Allows you to customize the SAP vendor information transmitted through the BAPI parameters of the FIAddVendorLine function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
                     * @param {object} params The BAPI structure that will be send to SAP
                     * @param {object} accountPayableItem The ACCOUNTPAYABLE structure that will be send to SAP
                     * @param {object} currencyAmountItem The CURRENCYAMOUNT structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnFIAddVendorLine: function (params, accountPayableItem, currencyAmountItem)
                     * {
                     * 	accountGLItem.CS_TRANS_T = line.GetValue("Z_Transaction_type__");
                     * }
                     * </code></pre>
                     */
                    OnFIAddVendorLine: function (params, accountPayableItem, currencyAmountItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnFIAddGLLine
                     * @description
                     * Allows you to customize the SAP non-PO line information transmitted through the BAPI parameters of the FIAddGLLine function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
                     *
                     * You can also use this user exit to redirect a GL line to the ACCOUNTPAYABLE table instead of ACCOUNTGL.
                     * To do this, remove the ACCOUNTGL record from the array and push a new record to ACCOUNTPAYABLE instead.
                     *
                     * @param {object} params The BAPI structure that will be sent to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {object} accountGLItem The ACCOUNTGL structure that will be sent to SAP
                     * @param {object} currencyAmountItem The CURRENCYAMOUNT structure that will be sent to SAP
                     * @example <caption>Redirect auxiliary GL accounts to ACCOUNTPAYABLE table</caption>
                     * <pre><code>
                     * OnFIAddGLLine: function (params, line, accountGLItem, currencyAmountItem)
                     * {
                     * 	var glAccount = accountGLItem.GL_ACCOUNT;
                     * 	// Check if this is an auxiliary account that should go to ACCOUNTPAYABLE
                     * 	if (glAccount && glAccount.indexOf("408") === 0)
                     * 	{
                     * 		// Remove the ACCOUNTGL record that was just added
                     * 		params.Bapi.TABLES.ACCOUNTGL.pop();
                     *
                     * 		// Create an ACCOUNTPAYABLE record instead
                     * 		params.Bapi.TABLES.ACCOUNTPAYABLE.push({
                     * 			ITEMNO_ACC: accountGLItem.ITEMNO_ACC,
                     * 			VENDOR_NO: Sys.Helpers.String.SAP.NormalizeID(Data.GetValue("VendorNumber__"), 10),
                     * 			GL_ACCOUNT: glAccount,
                     * 			COMP_CODE: accountGLItem.COMP_CODE,
                     * 			TAX_CODE: accountGLItem.TAX_CODE,
                     * 			TAXJURCODE: accountGLItem.TAXJURCODE,
                     * 			ITEM_TEXT: accountGLItem.ITEM_TEXT,
                     * 			BUS_AREA: accountGLItem.BUS_AREA,
                     * 			ALLOC_NMBR: accountGLItem.ALLOC_NMBR,
                     * 			PROFIT_CTR: accountGLItem.PROFIT_CTR
                     * 		});
                     * 		// Note: CURRENCYAMOUNT already created with same ITEMNO_ACC, no changes needed
                     * 	}
                     * }
                     * </code></pre>
                     */
                    OnFIAddGLLine: function (params, line, accountGLItem, currencyAmountItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnFIAddTaxLine
                     * @description
                     * Allows you to customize the SAP tax line information transmitted through the BAPI parameters of the FIAddTaxLine function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
                     * @param {object} params The BAPI structure that will be send to SAP
                     * @param {object} sapTaxAccount The tax account retrieved from SAP
                     * @param {object} accountTaxItem The ACCOUNTTAX structure that will be send to SAP
                     * @param {object} currencyAmmountTax The CURRENCYAMOUNT structure that will be send to SAP
                     */
                    OnFIAddTaxLine: function (params, sapTaxAccount, accountTaxItem, currencyAmmountTax) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnFIAddWht
                     * @since 352
                     * @description
                     * Allows you to customize the SAP Extended Withholding Taxes transmitted through the BAPI parameters of the FIAddWHT function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
                     * @param {Object} params The BAPI structure that will be sent to SAP
                     * @param {Array} accountWhtTable The ACCOUNTWT withholding taxes array of the BAPI structure that will be sent to SAP
                     * @example <caption>Clear all WHT items when the invoice is marked as exempt</caption>
                     * OnFIAddWht = function (params, accountWhtTable)
                     * {
                     * 	if (Data.GetValue("Z_ExemptFromWht__"))
                     * 	{
                     * 		accountWhtTable.splice(0);
                     * 	}
                     * };
                     */
                    OnFIAddWht: function (params, accountWhtTable) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.CustomizeFIPrepareForLinesCallback
                     * @description
                     * Allows you to customize the FIPrepareForLinesCallback function.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the FI module of SAP.
                     * When message ID is ESKAP, the error message is from Esker instead of SAP.
                     * @param {object} simulationReport
                     * @example
                     * <pre><code>
                     * CustomizeFIPrepareForLinesCallback: function (params, simulationReport)
                     * {
                     *		var StoredErrorList = JSON.parse(Data.GetValue("Z_Error_Log__"));
                     *		if (StoredErrorList)
                     *		{
                     *			for (var i = 0; i < StoredErrorList.length; i++)
                     *			{
                     *				if (StoredErrorList[i].returnMessage && StoredErrorList[i].returnMessage != "")
                     *				{
                     *					if (StoredErrorList[i].index == "0")
                     *					{
                     *						Sys.Helpers.SAP.AddMessage(simulationReport, "messages", "0000000001", "ESKAP", "E", "006", StoredErrorList[i].returnMessage, "", "");
                     *					}
                     *				}
                     *			}
                     *		}
                     * }
                     * </code></pre>
                     */
                    CustomizeFIPrepareForLinesCallback: function (params, simulationReport) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnMMHeaderSet
                     * @description
                     * Allows you to customize the SAP header information transmitted through the BAPI parameters of the MMHeaderSet function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
                     * @param {object} params The BAPI structure that will be send to SAP
                     * @param {object} headerData The HEADERDATA structure that will be send to SAP
                     */
                    OnMMHeaderSet: function (params, headerData) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnMMAddPOLine
                     * @description
                     * Allows you to customize the SAP PO line information transmitted through the BAPI parameters of the MMAddPOLine function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
                     * @since 333
                     * @param {object} params The BAPI structure that will be send to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {object} poItemData The current PO item information
                     * @param {object} itemData The ITEMDATA structure that will be send to SAP
                     * @returns {void | Promise<object>} It can return a promise to allow asynchronous operations before returning the itemData to add. Promise return possible since 333
                    */
                    OnMMAddPOLine: function (params, line, poItemData, itemData) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnMMAddPOLineDuplicate
                     * @description
                     * Allows you to customize the SAP PO line information when merging duplicate invoice lines that reference the same PO number and item number.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
                     * Unlike OnMMAddPOLine which is called only for new lines, this user exit is specifically called during the duplicate/merge scenario,
                     * enabling customization of analytical accounting dimensions on the consolidated line during simulation.
                     * @param {Object} duplicate The existing ITEMDATA structure being updated with merged values
                     * @param {Item} line The current line item being merged into the duplicate
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} poItemData The current PO item information
                     * @param {boolean} isServiceItem Whether the PO item is a service item
                     * @param {boolean} isLimitItem Whether the PO item is a limit item
                     * @example
                     * OnMMAddPOLineDuplicate: function (duplicate, line, poItemData, isServiceItem, isLimitItem)
                     * {
                     *     var currentPo = line.GetValue("Z_PONumber__");
                     *     if (currentPo)
                     *     {
                     *         var existingPo = duplicate.PO_NUMBER;
                     *         duplicate.PO_NUMBER = existingPo ? existingPo + ";" + currentPo : currentPo;
                     *     }
                     * }
                    */
                    OnMMAddPOLineDuplicate: function (duplicate, line, poItemData, isServiceItem, isLimitItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnMMAddGLLine
                     * @description
                     * Allows you to customize the SAP non-PO line information transmitted through the BAPI parameters of the MMAddGLLine function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
                     * @param {object} params The BAPI structure that will be send to SAP
                     * @param {Item} line The line item used to fill the SAP structures
                     * @param {object} accountGLItem The ACCOUNTGL structure that will be send to SAP
                     * @example
                     * <pre><code>
                     * OnMMAddGLLine: function (params, line, accountGLItem)
                     * {
                     * 	accountGLItem.CS_TRANS_T = line.GetValue("Z_Transaction_type__");
                     * }
                     * </code></pre>
                    */
                    OnMMAddGLLine: function (params, line, accountGLItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnMMAddTaxData
                     * @description
                     * Allows you to customize the SAP tax data transmitted through the BAPI parameters of the MMAddTaxData function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
                     * @param {object} params The BAPI structure that will be send to SAP
                     * @param {object} taxCodeValues Tax information
                     * @param {object} taxDataItem The TAXDATA structure that will be send to SAP
                    */
                    OnMMAddTaxData: function (params, taxCodeValues, taxDataItem) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.ShouldShowTaxAmountMismatchWarning
                     * @since 353
                     * @description
                     * User exit to customize whether tax amount mismatch warnings should be displayed during SAP invoice simulation.
                     * This warning is shown when the tax amount entered on the invoice differs from the theoretical tax amount
                     * computed by SAP for a given tax code.
                     *
                     * @param {string} taxCode The tax code for which the mismatch was detected
                     *
                     * @returns {boolean | void}
                     *   - Return `false` to suppress the warning
                     *   - Return `true` to show the warning (explicit approval of standard behavior)
                     *   - Return `void`/`undefined` to use standard behavior (show warning)
                     *
                     * @example <caption>Suppress tax mismatch warning for reverse charge tax codes</caption>
                     * ShouldShowTaxAmountMismatchWarning: function(taxCode)
                     * {
                     *     // Suppress warning for reverse charge tax codes
                     *     if (taxCode === "RC" || taxCode === "V0")
                     *     {
                     *         return false;
                     *     }
                     *     // For other tax codes, use standard behavior (show warning)
                     *     return;
                     * }
                     */
                    ShouldShowTaxAmountMismatchWarning: function (taxCode) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnMMAddWht
                     * @since 352
                     * @description
                     * Allows you to customize the SAP Extended Withholding Taxes transmitted through the BAPI parameters of the MMAddWHT function in the Lib_AP_SAP_Invoice_Client script library.
                     * This user exit is called from the HTML Page script of the Vendor invoice process, when simulating the posting of an invoice in the MM module of SAP.
                     * @param {Object} params The BAPI structure that will be sent to SAP
                     * @param {Array} accountWhtTable The WITHTAXDATA withholding taxes array of the BAPI structure that will be sent to SAP
                     * @example <caption>Clear all WHT items when the invoice is marked as exempt</caption>
                     * OnMMAddWht = function (params, accountWhtTable)
                     * {
                     * 	if (Data.GetValue("Z_ExemptFromWht__"))
                     * 	{
                     * 		accountWhtTable.splice(0);
                     * 	}
                     * };
                     */
                    OnMMAddWht: function (params, accountWhtTable) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.SimulationReport
                     * @description
                     * Allow to modify the simulation report before displaying it
                     * This user exit is called from the Lib_AP_SAP_Invoice_Simulation_Client library, when simulating the posting of an invoice in SAP.
                     * @param {object} simulationReport The simulation report structure that will be displayed
                     * @param {object} simulationError error message
                     * @example
                     * <pre><code>
                     * SimulationReport: function(simulationReport, simulationError)
                     * {
                     *	let table = simulationReport.MessageSet.warnings.texts;
                     *	for (let idx = 0; idx < table.length; idx++)
                     *	{
                     *		let item = table[idx];
                     *		if (item.message.startsWith("_No tax codes were specified even though the"))
                     *		{
                     *			simulationReport.MessageSet.warnings.texts.splice(idx, 1);
                     *			simulationReport.CounterByType.warnings--;
                     *		}
                     *	}
                     * }
                     * </code></pre>
                     **/
                    SimulationReport: function (simulationReport, simulationError) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.CustomizeSimulationResult
                     * @since 332
                     * @description
                     * Allow to modify the simulation result
                     * This user exit is called from the Lib_AP_SAP_Invoice_Simulation_Client library, when simulating the posting of an invoice in SAP.
                     * @param {object} simulationReport The simulation report structure that will be displayed
                     * @param {string} simulationResult The output of the simulation for display in the web page
                     * @return {string | void} The modified output of the simulation for display in the web page or void
                     * @example
                     * <caption> This customization removes specific SAP simulation warnings and dynamically adds a custom column to the simulation result table, inserting a new cell with contextual values next to the "Assignment number" column for each data row (excluding the balance row).
                     * CustomizeSimulationResult: function(simulationReport, simulationResult)
                     * {
                     *		// Parse and modify the HTML simulation result
                     *     	const parser = new DOMParser();
                     *     	const doc = parser.parseFromString(simulationResult, "text/html");
                     *
                     *     	// 1. Find the index of the "Assignment number" column
                     *     	const headerRow = doc.querySelector("table.simulationTableSub tr.list_header");
                     *     	let assignmentNumberIndex = -1;
                     *
                     *     	if (headerRow) {
                     *      	Const headerCells = Array.from(headerRow.children);
                     *         	assignmentNumberIndex = headerCells.findIndex(cell => cell.textContent.trim() === "Assignment number");
                     *
                     *         	// Insert new header cell after "Assignment number"
                     *         	if (assignmentNumberIndex !== -1) {
                     *             	const customHeader = doc.createElement("td");
                     *             	customHeader.className = "list_header_text";
                     *             	customHeader.align = "left";
                     *             	customHeader.textContent = typeof Language !== "undefined" && Language.Translate
                     *                 ? Language.Translate("_WBSElement_report")
                     *                 : "Custom Field";
                     *
                     *             	headerRow.insertBefore(customHeader, headerCells[assignmentNumberIndex + 1]);
                     *         	}
                     *     	}
                     *
                     *     	// 2. Insert new cell in each data row after the "Tax code" cell, except for the "Balance" row
                     *     	if (assignmentNumberIndex !== -1) {
                     *         	const dataRows = doc.querySelectorAll("table.simulationTableSub tr.edr-L");
                     *         	dataRows.forEach((row, index) => {
                     *             	if (row.textContent.includes("Balance")) return; // Skip balance row
                     *
                     *             	const cells = Array.from(row.children);
                     *             	const customCell = doc.createElement("td");
                     *             	customCell.className = "list_text";
                     *             	customCell.align = "left";
                     *             	customCell.textContent = `Custom value ${index + 1}`;
                     *
                     *             	row.insertBefore(customCell, cells[assignmentNumberIndex + 1]);
                     *         	});
                     *     	}
                     *
                     *		//3. Update colspan in the "Balance" row
                     *		const balanceCell = doc.querySelector('tr.edr-L1.edr-L td[colspan="8"]');
                     *		if (balanceCell) {
                     *			balanceCell.colSpan = parseInt(balanceCell.colSpan) + 1;
                     *		}
                     *
                     *     	// 4. Serialize the updated DOM back to HTML
                     *     	simulationResult = doc.body.innerHTML;
                     *     	return simulationResult;
                     * }
                     **/
                    CustomizeSimulationResult: function (simulationReport, simulationResult) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.SkipTaxAccountRetrieval
                     * @since 353
                     * @description
                     * Allows you to skip the tax processing for a given tax code during SAP invoice simulation.
                     * This user exit is called before retrieving tax accounts from SAP in both MM and FI simulation flows.
                     * When this function returns true for a tax code, the framework will not retrieve tax accounts from SAP
                     * and will also bypass the creation of any tax lines and the related tax dispatching logic in the
                     * simulation flow for that tax code.
                     * This can be useful when your SAP configuration does not require tax accounts or tax lines to be
                     * populated for certain invoice types or scenarios.
                     * @param {string} companyCode The company code of the invoice
                     * @param {string} taxCode The current tax code being processed
                     * @returns {boolean | void} Return true to skip tax processing (tax account retrieval, tax line creation and dispatch)
                     * for this tax code, or return void/false to use the standard behavior.
                     * @example <caption>Skip tax processing for PO invoices in a specific company code</caption>
                     * SkipTaxAccountRetrieval: function (companyCode, taxCode)
                     * {
                     *     if (companyCode === "1000" && Data.GetValue("OrderNumber__"))
                     *     {
                     *         return true;
                     *     }
                     * }
                     */
                    SkipTaxAccountRetrieval: function (companyCode, taxCode) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.KeepKI281AsWarning
                     * @since 358
                     * @description
                     * Allows you to prevent the SAP KI281 warning from being promoted to a blocking error during FI invoice simulation.
                     * By default, Esker promotes the SAP KI281 warning ("Cost element / cost center combination does not exist")
                     * to a blocking error to prevent issues with SAP batch input processing.
                     * Return true from this function to keep KI281 as a warning, allowing the invoice to be posted despite this message.
                     * @returns {boolean | void} Return true to keep KI281 as a warning, or return void/false to use the standard behavior (KI281 promoted to error).
                     * @example <caption>Keep KI281 as a warning to allow posting</caption>
                     * KeepKI281AsWarning: function ()
                     * {
                     *     return true;
                     * }
                     */
                    KeepKI281AsWarning: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.EnableToleranceCheck
                     * @since 354
                     * @description
                     * Called in ToleranceSettings constructor, when object is initialized from SAP table T169G.
                     * Allows enabling or disabling the price tolerance check in SAP simulate.
                     * @returns {boolean} true to enable the tolerance check in SAP simulate (default), false to disable it.
                     * @example <caption>Disable SAP simulate price tolerance check</caption>
                     * SAP.EnableToleranceCheck = function ()
                     * {
                     *     return false;
                     * };
                     */
                    EnableToleranceCheck: function () {
                        return true;
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.GetAmountCheckToleranceKey
                     * @since 361
                     * @description
                     * Called at the start of AmounCheckGetToleranceKey before the standard logic.
                     * Return a non-empty string to override the tolerance key for table T169G lookup.
                     * Standard keys: "PP" (default), "KW" (delivery costs), "PS" (estimated price).
                     * Return void to use standard behavior.
                     * @param {SAPAmountCheckInput} input Amount check input.
                     * @returns {string | void}
                     * @example <caption>Use key "BD" as default</caption>
                     * SAP.GetAmountCheckToleranceKey = function (input)
                     * {
                     * 	if (!input.UpdateDeliveryCosts && !input.IsEstimatedPrice)
                     * 	{
                     * 		return "BD";
                     * 	}
                     * };
                     */
                    GetAmountCheckToleranceKey: function (input) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnCalculateTaxFromNet
                     * @since 359
                     * @description
                     * Allows you to mutate the BAPI parameters before `Z_ESK_CALCULATE_TAX_FRM_NET` is invoked
                     * from the client-side tax-rate retrieval (both `SAPTaxFromNetBapiClient.GetTaxRateFromTaxCode`
                     * and the standalone `Lib.AP.SAP.GetTaxFromNetClient`).
                     *
                     * Modify `bapiParams.EXPORTS` (and/or `bapiParams.TABLES`) directly to add/override fields
                     * beyond the standard `I_BUKRS`, `I_MWSKZ`, `I_TXJCD`, `I_WAERS`, `I_WRBTR`, `I_PROTOKOLL`,
                     * `I_PRSDT`, `I_ZBD1P` and the optional `I_ACCDATA`.
                     *
                     * @param {object} bapiParams The BAPI parameter structure (mutate in place).
                     * @param {string} [itemNumberTax] The current SAP item-number-tax (provided by `GetTaxFromNetClient`; `null` from the class flow).
                     * @param {any} [params] The contextual SAP BAPI parameters object propagated from the caller (e.g. PO context).
                     * @returns {void}
                     * @example <caption>Force the price determination date</caption>
                     * SAP.OnCalculateTaxFromNet = function (bapiParams, itemNumberTax, params)
                     * {
                     *     bapiParams.EXPORTS.I_PRSDT = Sys.Helpers.Date.ToSAPDate(Data.GetValue("InvoiceDate__"));
                     * };
                     */
                    OnCalculateTaxFromNet: function (bapiParams, itemNumberTax, params) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.SAP.OnCalculateTaxFromNetSuccess
                     * @since 359
                     * @description
                     * Called client-side after a successful response of the `Z_ESK_CALCULATE_TAX_FRM_NET` BAPI.
                     *
                     * Use it to post-process the BAPI response (for example, store additional values from
                     * `jsonResult.IMPORTS` / `jsonResult.TABLES` on the line item).
                     *
                     * The first argument is whatever line-context the caller had:
                     * - From `SAPTaxFromNetBapiClient.GetTaxRateFromTaxCode`, it is the line `Item`.
                     * - From `Lib.AP.SAP.GetTaxFromNetClient`, it is the `callbackParam` (typically a tax-code-amounts object) provided by the simulation flow.
                     *
                     * @param {Item | object} item The line item (or callback context) for which the BAPI was called.
                     * @param {object} jsonResult The full JSON result returned by SAP for `Z_ESK_CALCULATE_TAX_FRM_NET`.
                     * @returns {void}
                     * @example <caption>Persist the SAP-calculated tax amount</caption>
                     * SAP.OnCalculateTaxFromNetSuccess = function (item, jsonResult)
                     * {
                     *     if (item && item.SetValue && jsonResult && jsonResult.IMPORTS)
                     *     {
                     *         item.SetValue("Z_SAPTaxAmount__", jsonResult.IMPORTS.E_FWSTE / 10);
                     *     }
                     * };
                     */
                    OnCalculateTaxFromNetSuccess: function (item, jsonResult) {
                    }
                };
                /**
                 * Specifics customization for generic solutions
                 * @namespace Lib.AP.Customization.HTMLScripts.Generic
                 */
                HTMLScripts.Generic = {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.Generic.AllowBankDetailSelection
                     * @deprecated use Lib.AP.Customization.HTMLScripts.BankDetails.DisableBankDetailsSelection instead
                     * @description
                     * Allow to enable bank detail selection for generic invoices
                     * @example
                     * <pre><code>
                     * AllowBankDetailSelection: function()
                     * {
                     * 	 //allow AP users to select items in the bank details table
                     *   return true;
                     * }
                     * </code></pre>
                     */
                    AllowBankDetailSelection: function () {
                        return false;
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.Generic.ShouldKeepLineItemsOnManualLink
                     * @description
                     * Determine whether to delete line items for manuel link
                     * @example
                     * <pre><code>
                     * ShouldKeepLineItemsOnManualLink: function()
                     * {
                     * 	 return false;
                     * }
                     * </code></pre>
                     */
                    ShouldKeepLineItemsOnManualLink: function () {
                    }
                };
                /**
                 * Specifics customization for the PO Browse
                 * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO
                 */
                HTMLScripts.BrowsePO = {
                    /**
                     * Specifics customization for the SAP and Generic PO Browse
                     * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO.Common
                    */
                    Common: {
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.RunPOSearchOnLoad
                         * @description
                         * Use this function to enable or disable the search for POs as soon as the browse dialog opens
                         * The default behaviour is as follows:
                         *	- When connecting to SAP, we do not run this search when the page opens. Return true to modify this behaviour.
                         *	- When running search in local Esker table, we do run this search so long as Vendor number field is not empty. Return false to modify this behaviour.
                         * @return {boolean} whether or not to run the search for POs as soon as the browse page opens
                         * @example
                         * <pre><code>
                         * RunPOSearchOnLoad: function ()
                         * {
                         *		var isSAP = Data.GetValue("ERP__") === "SAP";
                         *		if (isSAP && Data.GetValue("OrderNumber__"))
                         *		{
                         *			return true;
                         *		}
                         * }
                         * </code></pre>
                         */
                        RunPOSearchOnLoad: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.ShouldRunInitialSearchWithoutVendor
                         * @since 362
                         * @description
                         * Use this function to allow the initial automatic search to run when the Browse PO dialog opens, even if the Vendor Number field is empty.
                         * By default, the initial search only triggers when the Vendor Number field is not empty.
                         * Return true to allow the search to run without a Vendor Number (e.g. when an Order Number is already present on the invoice).
                         * To disable the initial search entirely, use RunPOSearchOnLoad instead.
                         * @return {boolean} true to allow the initial search to run without a Vendor Number
                         * @example
                         * <caption>Trigger the initial search when an Order Number is present, even without a Vendor Number</caption>
                         * ShouldRunInitialSearchWithoutVendor: function ()
                         * {
                         * 	return !!Controls.OrderNumber__.GetValue();
                         * };
                         */
                        ShouldRunInitialSearchWithoutVendor: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.GetDefaultOnlyShowOpenOrders
                         * @since 366
                         * @description
                         * Use this function to change the initial state of the "Only show open orders/items" checkbox of the Browse PO dialog.
                         * The returned value is used consistently by the rendered checkbox, by the search automatically run when the dialog opens
                         * (see RunPOSearchOnLoad) and by the filtering of the results of that search.
                         * It is evaluated once, when the browse dialog opens, and applies to both the generic and the SAP browse.
                         * Precedence, from lowest to highest:
                         * - the standard value (true);
                         * - in the generic browse, a value set on the checkbox by CustomizeSearchGrid, only when this function returns nothing;
                         * - the value returned by this function (it overrides a value set by CustomizeSearchGrid);
                         * - a change of the checkbox made by CustomizeBrowseFields: in the generic browse, the search run at opening is then performed again
                         *   with the displayed state, which costs an extra query. Prefer this function to set the initial state;
                         * - the state chosen by the user once the dialog is displayed.
                         * Only a boolean is taken into account: return nothing to keep the standard behavior.
                         * @param {boolean} defaultValue The standard default value (true).
                         * @return {boolean|void} The initial state of the checkbox, or void to keep the standard behavior
                         * @example
                         * <caption>Show closed orders by default on credit notes and subsequent debit/credit documents</caption>
                         * GetDefaultOnlyShowOpenOrders: function (defaultValue)
                         * {
                         * 	if (Lib.AP.IsCreditNote() || Lib.AP.IsSubsequentDebitCredit())
                         * 	{
                         * 		return false;
                         * 	}
                         * 	return defaultValue;
                         * };
                         */
                        GetDefaultOnlyShowOpenOrders: function (defaultValue) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.OnFinalizeAddPoEnd
                         * @description
                         * Allows you to customize the Vendor invoice process when a purchase order number is added to the form.
                         * This user exit is called from the HTML Page script of the Vendor invoice process when adding a purchase order number.
                         * @param {string} orderNumber The number of the added order
                         * @param {string} itemNumber The number of the added item (defined only if single POLine added)
                         * @param {Dialog} dialog The PO search page dialog object that can be further manipulated, in order to close the dialog for instance
                         * @example
                         * <pre><code>
                         * OnFinalizeAddPoEnd: function (orderNumber, itemNumber, dialog)
                         * {
                         *	// Automatically fill the Description field with the Vendor Name and the PO Numbers added from the PO Browse
                         *	var vendorName = Data.GetValue("VendorName__") || "";
                         *	var invoiceDescription = vendorName + " " + orderNumber;
                         *	Data.SetValue("InvoiceDescription__", invoiceDescription);
                         *
                         *	// Close popup if user clicked the "Add" link from the PO header tab
                         *	// This allows saving one click in scenarios where invoice can only reference 1 Purchase order
                         *	if(dialog && !itemNumber)
                         *	{
                         *		dialog.Cancel();
                         *	}
                         * }
                         * </code></pre>
                         */
                        OnFinalizeAddPoEnd: function (orderNumber, itemNumber, dialog) {
                        },
                        /**
                         * @typedef Lib.AP.Customization.HTMLScripts.BrowsePO.Common.DialogOptions
                         * @property {boolean} windowed defined if the PO Browse should be displayed in a dedicated window (true) or not (false).
                         * @property {boolean} top defined the top position of the PO Browse popup dialog (windowed enabled mode only).
                         * @property {boolean} left defined the left position of the PO Browse popup dialog (windowed enabled mode only).
                         * @property {boolean} innerWidth defined the inner width of the PO Browse popup dialog (windowed enabled mode only).
                         * @property {boolean} innerHeight defined the inner height of the PO Browse popup dialog (windowed enabled mode only).
                         */
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeBrowseParameters
                         * @description
                         * Allows you to customize options used to create the PO [SAP] Browse popup dialog.
                         * @param {Lib.AP.Customization.HTMLScripts.BrowsePO.Common.DialogOptions} defaultPopupOptions default options used to create the PO Browse popup dialog.
                         * @return {Lib.AP.Customization.HTMLScripts.BrowsePO.Common.DialogOptions} customized options for PO Browse popup dialog creation. You can also return null to work with default options.
                         * @example
                         * <pre><code>
                         * CustomizeBrowseParameters: function (defaultPopupOptions)
                         * {
                         * 	// don't use the windowed mode on IE and Edge
                         * 	if (navigator.appVersion.indexOf('Trident/') > -1  || navigator.appVersion.indexOf('Edge') > -1)
                         * 	{
                         * 		return {
                         * 			windowed: false
                         * 		};
                         * 	}
                         * 	// set a specific size for SAP
                         * 	else if (Lib.ERP.IsSAP())
                         * 	{
                         * 		return {
                         * 			windowed: true,
                         * 			top: 100,
                         * 			left: 100,
                         * 			innerWidth: 1550,
                         * 			innerHeight: 800
                         * 		};
                         * 	}
                         * 	// default behavior
                         * 	return {
                         * 		windowed: true,
                         * 		top: 100,
                         * 		left: 100,
                         * 		innerWidth: 1400,
                         * 		innerHeight: 800
                         * 	};
                         * }
                         * </code></pre>
                         */
                        CustomizeBrowseParameters: function (defaultPopupOptions) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeBrowseFields
                         * @description
                         * Use this function to customize the PO browse (add new search fields, customize the existing ones, prefill with values)
                         * You can use it to add new custom search fields, customize the existing ones, prefill them with values,...
                         * To set the initial state of the "Only show open orders/items" checkbox, prefer Lib.AP.Customization.HTMLScripts.BrowsePO.Common.GetDefaultOnlyShowOpenOrders.
                         * @param {Dialog} dialog dialog object representing the PO browse
                         * @example
                         * <pre><code>
                         * CustomizeBrowseFields: function (dialog)
                         * {
                         *		dialog.AddText("Z_MyNewText", "My new text", 150);
                         * }
                         * </code></pre>
                         */
                        CustomizeBrowseFields: function (dialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.QueryCustomTable
                         * @since 341
                         * @description
                         * Allows you to query custom tables and enrich PO browse data with additional information.
                         * This user exit is called during the PO browse initialization to retrieve custom data that can be displayed in the browse dialog.
                         * The query is executed asynchronously. You can directly modify the queryValue object to add custom fields to the PO records.
                         * @param {IQueryValue} queryValue The query result object containing PO records. You can modify it to add custom fields.
                         * @returns {Promise<void> | void} Can return a Promise if async operations are needed
                         * @example
                         * <caption>Query custom table to enrich PO data with vendor information</caption>
                         * Common.QueryCustomTable = function (queryValue)
                         * {
                         * 	return Sys.Helpers.Promise.Create(function (resolve) {
                         * 		// Get vendor number from first record or current form
                         * 		const vendorNumber = queryValue.GetQueryValue("VENDORNUMBER__", 0) || Controls.VendorNumber__.GetValue();
                         * 		const companyCode = Controls.CompanyCode__.GetValue();
                         * 		if (!vendorNumber || !companyCode) {
                         * 			resolve();
                         * 			return;
                         * 		}
                         * 		// Query custom vendor table
                         * 		const filter = `(&(Number__=${vendorNumber})(CompanyCode__=${companyCode}))`;
                         * 		Sys.GenericAPI.Query("AP - Vendors__", filter, ["Number__", "Name__"], (results, error) => {
                         * 			if (results && results.length > 0) {
                         * 				const vendorData = results[0];
                         * 				// Enrich each PO record with vendor custom data
                         * 				for (let i = 0; i < queryValue.Records.length; i++) {
                         * 					const recordVendor = queryValue.GetQueryValue("VENDORNUMBER__", i);
                         * 					if (recordVendor === vendorNumber) {
                         * 						// Add custom fields to the record
                         * 						const vendorNameIndex = queryValue.RecordsDefinition["VENDORNAME__"];
                         * 						if (!Sys.Helpers.IsEmpty(vendorNameIndex)) {
                         * 							queryValue.Records[i][vendorNameIndex] = vendorData.Name__;
                         * 						}
                         * 					}
                         * 				}
                         * 			}
                         * 			resolve();
                         * 		});
                         * 	});
                         * }
                         * @example
                         * <caption>Use CustomizePOHeaderOjects to add custom columns that will be populated by QueryCustomTable</caption>
                         * // First, add the custom columns in CustomizePOHeaderOjects:
                         * Common.CustomizePOHeaderOjects = function (poHeadersColumns, poHeadersDisplayedFields, poHeadersLineLevelFields)
                         * {
                         * 	// Add custom columns
                         * 	poHeadersColumns.push(
                         * 		{ id: "VendorName__", label: "_Supplier Name", type: "STR", width: 200 }
                         * 	);
                         * }
                         * // Then, QueryCustomTable will populate these fields with data from your custom table
                         */
                        QueryCustomTable: function (queryValue) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizePOHeaderOjects
                         * @description
                         * Use this function to manipulate the objects used to build the PO browser dialog box in regards to the PO Header information. You can change the PO Headers result table and the initial search fields.
                         * NOTE: this user exit is NOT able to customize the filter fields at the top of the dialog box.
                         * Some other user exits may be able to do similar functions; however, this provides more granular control. For example, GetCustomDimensions and GetBrowseQueryExtraFields are called before this user exit.
                         * This user exit will include any changes made from those user exits.
                         * @param {Sys.Helpers.Browse.DisplayColumn[]} poHeadersColumns This object controls the table layout under the PURCHASE ORDER HEADERS tab. Refer to Lib.AP.BrowsePO.initPOHeadersColumns for initial values.
                         * @param {string[]} poHeadersDisplayedFields (Not sent from SAP version of browsePO) This object controls the fields set on the initial search when first loading the browse dialog. These fields do NOT transfer data to the line item level
                         * because the line item level should already have the same fields. Refer to Lib.AP.BrowsePO.initPOHeadersDisplayedFields for initial values.
                         * @param {string[]} poHeadersLineLevelFields (Not sent from SAP version of browsePO) This object controls the attributes sent on the initial search when first loading the browse dialog. These fields transfer data to the line item level.
                         * Refer to Lib.AP.BrowsePO.initPOHeadersLineLevelFields for initial values. Note that if you added fields with GetCustomDimensions then those fields are already present at this point.
                         * @example
                         * CustomizePOHeaderOjects: function (poHeadersColumns, poHeadersDisplayedFields, poHeadersLineLevelFields)
                         * {
                         * 		//Customer wants to see the PO Header buyer field in the browse dialog
                         * 		const buyerIndex = poHeadersColumns.findIndex((column) => column.id === "Buyer__");
                         * 		poHeadersColumns.splice(buyerIndex, 1, { id: "Buyer__", label: "_Buyer", type: "STR", width: 200 } );
                         * 		poHeadersDisplayedFields.push("Buyer__"); //makes Buyer be populated on initial search when loading dialog
                         *
                         * 		//Customer wants to change the decimal precision of the amount fields to 3
                         * 		poHeadersColumns.forEach((column) =>
                         *		{
                         * 			if (column.type.toUpperCase() === "DECIMAL")
                         * 			{
                         * 				column.options = {
                         * 					"precision": 3
                         * 				};
                         * 			}
                         * 		});
                         *
                         * 		//Reorder the columns
                         * 		const columnOrder = ["OrderNumber__", "OrderDate__", "Buyer__"];
                         * 		Sys.Helpers.Array.ReorderArrayofObjects(poHeadersColumns, columnOrder, "id", 2); //Will ignore the first two link columns of 'View items' and 'Add'
                         * }
                         */
                        CustomizePOHeaderOjects: function (poHeadersColumns, poHeadersDisplayedFields, poHeadersLineLevelFields) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizePOLineObjects
                         * @description
                         * Use this user exit to customize the objects used for the PO items in the PO browse dialog. This is called after other user exits such as GetCustomDimensions and GetBrowseQueryExtraFields.
                         * The main use for this would be to adjust the column order, visibility, or other details on the columns when being displayed to the user.
                         * @param {Sys.Helpers.Browse.DisplayColumn[]} poDetailsColumns This object controls the table layout under the PURCHASE ORDER ITEMS tab. Refer to Lib.AP.BrowsePO.initPODetailsColumns for initial values.
                         * @param {string[]} poItemsFields (Not sent from SAP version of browsePO) This object contains the values that will be searched for in the PO Items table. It already includes values from GetBrowseQueryExtraFields and GetCustomDimensions.
                         * @example
                         * CustomizePOLineObjects: function (poDetailsColumns, poItemsFields)
                         * {
                         *   	//Customer asked to see unit price
                         * 		let idx = poDetailsColumns.findIndex((column) => column.id === "UnitPrice__");
                         * 		poDetailsColumns[idx].hidden = false;
                         * 		//NOTE: this could also be accomplished with poDetailsColumns.splice(idx, 1, { id: "UnitPrice__", label: "_Unit price", type: "DECIMAL", options: { precision: 4 } });
                         *
                         * 		//Change the decimal precision of a custom column added to the vendor invoice which pulls from PO Items table
                         * 		// (this example assumes you added the new field in GetCustomDimensions)
                         * 		idx = poDetailsColumns.findIndex((column) => column.id === "Z_CustomDecimalField__");
                         * 		poDetailsColumns[idx].options = { "precision": 4 };
                         *
                         * 		//Reorder columns to have Unit Price and the custom field be before the ordered amount
                         * 		const columnOrder = ["UnitPrice__", "Z_CustomDecimalField__"];
                         * 		Sys.Helpers.Array.ReorderArrayofObjects(poDetailsColumns, columnOrder, "id", 3);
                         * }
                         */
                        CustomizePOLineObjects: function (poDetailsColumns, poItemsFields) {
                        },
                        /** @typedef {"SIMPLEIN" | "IN" | "EQUALS" | "LOWER" | "LOWEROREQUAL" | "GREATER" | "GREATEROREQUAL" | ""} Lib.AP.Customization.HTMLScripts.SAPFilterType */
                        /** @typedef {"SIMPLEIN" | "IN" | "EQUALS" | "LOWER" | "GREATER" | "EQUALSOREMPTY" | "VALUEONLY"} Lib.AP.Customization.HTMLScripts.GenericFilterType */
                        /**
                         * @typedef Lib.AP.Customization.HTMLScripts.SearchCriterion
                         * @property {string} id The ID used to define the control name (prefixed with "searchcriteria_")
                         * @property {string} [label] The label of the search criteria
                         * @property {number} [width] The width of the search criteria in the grid
                         * @property {string} [defaultValue] The default value set
                         * @property {string} filterId The column name to use in the query
                         * @property {Array.<"PO"|"DN"|"POItem">} request Request for which the filter is used. "PO" for Purchase Order headers, "DN" for Delivery Notes, "POItem" for Purchase Order items. If not set, the criteria is never used in the query. POItem criteria are displayed in a separate section (Only available for non-SAP connected ERPs).
                         * @property {"ComboBox" | "Date" | "CheckBox" | "BOOLEAN" | "Integer" | "Decimal" | string} [type] When type is `Date`, the filter value is formatted to the correct format depending on the target system (SAP or Generic). When type is `ComboBox`, `|` characters contained in the filter value are removed.
                         * @property {boolean} [used] Ignore the filter if false
                         * @property {boolean} [required] Display an error message if the filter value is required and empty
                         * @property {Lib.AP.Customization.HTMLScripts.GenericFilterType|Lib.AP.Customization.HTMLScripts.SAPFilterType} [filterType] default "EQUALS"
                         * @property {boolean} [useEmptyValue] Only for GENERIC query. If false, the filter is not added when the value is empty
                         * @property {string|Date} [value] Used when no control is associated to the filter to define the filter value. Incompatible with `filter` parameter. When type is `Date`, the filter value must be a Date object.
                         * @property {string|function} [filter] Custom filter value used. Incompatible with `formatter` and `value` parameters. `filter` takes precedence over `value` and `formatter`.
                         * @property {function} [formatter] Format value retrieved from the control to compute the filter value. Incompatible with `filter` parameter.
                         * @property {boolean} [toUpper] Used to format in upper case the filter value.
                         * @property {function} [defaultValueFormat] Used to apply a custom format to the filter value. If `toUpper` is set to true, the input value will be in upper case.
                         * @property {boolean} [refreshSearchDialogOnChange] To refresh the search dialog when a field value changes (Only available for non-SAP connected ERPs).
                         * @property {boolean} [useFilterWhenAddingLines] Used to determine if the filter should be applied when adding lines in the vendor invoice form (Only available for non-SAP connected ERPs).
                         */
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeSearchCriteria
                         * @since 329
                         * @description
                         * Allows you to customize the search criteria used to search for POs in the PO browse dialog.
                         * Search criteria can be defined for three request types:
                         * - "PO": Search on Purchase Order headers
                         * - "DN": Search on Delivery Notes
                         * - "POItem": Search on Purchase Order items (displayed in a separate section)
                         * @param {Object.<string, Lib.AP.Customization.HTMLScripts.SearchCriterion>} searchCriteria The search criteria used to define the search fields
                         * @example
                         * <caption>Add a new search field Z_CustomField__ for PO request. To display this field in the dialog, use Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeSearchGrid</caption>
                         * Common.CustomizeSearchCriteria = function(searchCriteria)
                         * {
                         *	searchCriteria.Z_CustomFieldFilter__ = {
                         *		id: "Z_CustomFieldFilter__", type: "TEXT", request: ["PO"],
                         *		// Layout
                         *		label: "_Z_CustomFieldFilter", defaultValue: Controls.Z_CustomField__.GetValue(),
                         *		// Filter
                         *		filterId: "Z_CustomField__", filterType: "EQUALSOREMPTY",
                         *		// Refresh search dialog on change
                         *		refreshSearchDialogOnChange: true,
                         *	};
                         * }
                         * @example
                         * <caption>Add POItem search criteria (Part Number, Cost Center, 3rd Item Number) - these will be displayed in a separate section</caption>
                         * Common.CustomizeSearchCriteria = function(searchCriteria)
                         * {
                         *	// Part Number filter for PO Items
                         *	searchCriteria.PartNumberFilter__ = {
                         *		id: "PartNumberFilter__", type: "TEXT", request: ["POItem"],
                         *		label: "_Part Number", width: 264,
                         *		filterId: "PartNumber__", filterType: "EQUALS"
                         *	};
                         *
                         *	// Cost Center filter for PO Items
                         *	searchCriteria.CostCenterFilter__ = {
                         *		id: "CostCenterFilter__", type: "TEXT", request: ["POItem"],
                         *		label: "_Cost Center", width: 264,
                         *		filterId: "CostCenter__", filterType: "EQUALS"
                         *	};
                         *
                         *	// Custom 3rd Item Number filter for PO Items - will also filter lines added in the vendor invoice form if the order is selected
                         *	searchCriteria.Z_ThirdItemNumberFilter__ = {
                         *		id: "Z_ThirdItemNumberFilter__", type: "TEXT", request: ["POItem"],
                         *		label: "_3rd Item Number", width: 264,
                         *		filterId: "Z_ThirdItemNumber__", filterType: "EQUALS",
                         *		useFilterWhenAddingLines: true
                         *	};
                         * }
                         * @example
                         * <caption>Customize the OrderNumberFilter__ criteria to use a custom formatter</caption>
                         * Common.CustomizeSearchCriteria = function(searchCriteria)
                         * {
                         *	searchCriteria.OrderNumberFilter__.formatter = function (ordernumber) {
                         *		return `${ordernumber},${ordernumber}-EXT`;
                         * 	}
                         * };
                         */
                        CustomizeSearchCriteria: function (searchCriteria) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizePOItemsFilterFromRow
                         * @since 358
                         * @description
                         * Allows you to customize the filter used to query PO items when clicking "Add" or "View details" on a PO header row.
                         * Use this user exit to add filters based on values from the selected PO header row.
                         * The filter parameter already includes the company code and, when applicable, the vendor number filters.
                         * @param {string} filter The default LDAP filter used to query PO items, including company code and vendor number filters.
                         * @param {Lib.AP.BrowsePO.IBrowsePOHeaderTableRow} row The selected PO header row.
                         * @return {string | void} Complete LDAP filter to use for querying PO items. Return void to work with the default behavior.
                         * @example <caption>Filter PO items with a custom sub-order number stored on the selected PO header row</caption>
                         * Common.CustomizePOItemsFilterFromRow = function(filter, row)
                         * {
                         *	const subOrderNumCtrl = row["Z_SubOrderNum__"];
                         *	if (subOrderNumCtrl && subOrderNumCtrl.GetValue())
                         *	{
                         *		const customFilter = Sys.Helpers.LdapUtil.FilterEqual("Z_SubOrderNum__", subOrderNumCtrl.GetValue()).toString();
                         *		return Sys.Helpers.Browse.BuildLDAPFilter([filter, customFilter]);
                         *	}
                         * };
                         */
                        CustomizePOItemsFilterFromRow: function (filter, row) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeSearchGrid
                         * @since 329
                         * @description
                         * Allows you to customize the search grid used to display search fields in the PO browse dialog.
                         * In the generic browse, it is called once before the search run at opening. The value of the "Only show open orders/items" checkbox
                         * set here is ignored when Lib.AP.Customization.HTMLScripts.BrowsePO.Common.GetDefaultOnlyShowOpenOrders returns a boolean.
                         * @param {Array.<Array.<GridParameter>>} controlsGrid Current grid used to display the search fields
                         * @param {Object.<string, Lib.AP.Customization.HTMLScripts.SearchCriterion>} searchCriteria List of criteria (contain also the custom ones)
                         * @param {boolean} [refreshSearchDialogOnChange] To refresh the search dialog when a field value changes
                         * @example
                         * <caption>Add a custom criteria at the end of the grid</caption>
                         * Common.CustomizeSearchGrid = function (controlsGrid, searchCriteria)
                         * {
                         * 	var newRow = [
                         *		Sys.Helpers.Browse.ConvertSearchCriterionIntoGridParameter(searchCriteria.Z_CustomFieldFilter__),
                         *	];
                         * 	controlsGrid.push(newRow);
                         * }
                         * @example
                         * <caption>Customize the criteria by adding additional checkbox</caption>
                         * Common.CustomizeSearchGrid = function (controlsGrid, searchCriteria)
                         * {
                         *	var newRow = [{
                         *				type: "CheckBox",
                         *				label: "Add fully invoiced GRs",
                         *				id: "CustomizationPS_AddFullyInvoicedGRs__"
                         *			}];
                         *	controlsGrid.push(newRow);
                         * };
                         */
                        CustomizeSearchGrid: function (controlsGrid, searchCriteria) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeGRItemFilter
                         * @since 330
                         * @description
                         * Allow you to customize the filter used for getting GR items in the PO browse dialog.
                         * @param {string} filter The default filter used in the DBQuery
                         * @param {Lib.AP.BrowsePO.ItemMap} itempMap Current item with information mapped
                         * @param {Dialog} dialog The Dialog from which the event is triggered
                         * @param {Object.<string, Lib.AP.Customization.HTMLScripts.SearchCriterion>} searchCriteria List of criteria (also contains the custom ones filled in CustomizeSearchCriteria)
                         * @param {boolean} [refreshSearchDialogOnChange] To refresh the search dialog when a field value changes
                         * @return {string} the filter to use in the query. You can also return null to work with the default behavior.
                         * @example <caption>Add the value of the custom search criteria added previously</caption>
                         * CustomizeGRItemFilter: function (type, filter, itempMap, dialog, searchCriteria)
                         * {
                         *	let filter = Sys.Helpers.LdapUtil.FilterAnd(
                         *		filter,
                         *		Sys.Helpers.Browse.BuildLDAPFilter(Sys.Helpers.Browse.FiltersFromSearchCriterias(dialog, [searchCriteria.Z_CustomField]))
                         *	).toString();
                         *	return filter;
                         * }
                         */
                        CustomizeGRItemFilter: function (filter, itempMap, dialog, searchCriteria) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeIsItemAlreadySet
                         * @since 330
                         * @description
                         * Allows you to customize the result of the function used to check if an item is already set in the invoice.
                         * @param {boolean} itemAlreadySet The default value of the item already set
                         * @param {string} orderNumber The order number of the item
                         * @param {string} itemNumber The item number of the item
                         * @param {string} [goodReceipt] The good receipt number of the item
                         * @param {Lib.AP.BrowsePO.ItemMap} [itemMap] The full item map containing all fields of the PO line item (available since sprint 356)
                         * @return {boolean} is the item already set in the invoice. You can also return null to work with the default behavior.
                         * @example <caption>Checks a custom parameter that allows the same line to be added multiple times</caption>
                         * CustomizeIsItemAlreadySet: function (itemAlreadySet, orderNumber, itemNumber, goodReceipt)
                         * {
                         *	if (Sys.Parameters.GetInstance("AP").GetParameter("Z_EnableSameLineItemsAddForPos", "0") === "1") {
                         *		return false;
                         *	}
                         * }
                         * @example <caption>Use additional fields from itemMap to determine line uniqueness</caption>
                         * CustomizeIsItemAlreadySet: function (itemAlreadySet, orderNumber, itemNumber, goodReceipt, itemMap)
                         * {
                         *	if (!itemMap) {
                         *		return;
                         *	}
                         *	// Consider CostModel and CostType as part of the uniqueness key
                         *	var key = orderNumber + "-" + itemNumber + "-" + (itemMap.Z_COSTMODEL__ || "") + "-" + (itemMap.Z_COSTTYPE__ || "");
                         *	var lineItems = Controls.LineItems__;
                         *	for (var i = 0; i < lineItems.GetItemCount(); i++) {
                         *		var item = lineItems.GetItem(i);
                         *		var existingKey = item.GetValue("OrderNumber__") + "-" + item.GetValue("ItemNumber__") + "-" + (item.GetValue("Z_CostModel__") || "") + "-" + (item.GetValue("Z_CostType__") || "");
                         *		if (existingKey === key) {
                         *			return true;
                         *		}
                         *	}
                         *	return false;
                         * }
                         */
                        CustomizeIsItemAlreadySet: function (itemAlreadySet, orderNumber, itemNumber, goodReceipt, itemMap) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeRowCount
                         * @since 331
                         * @description
                         * Allows you to customize the rowcount in the PO browse dialog.
                         * @example
                         * <caption>Return a new value for the rowcount</caption>
                         * CustomizeRowCount: function ()
                         * {
                         *		var isSAP = Data.GetValue("ERP__") === "SAP";
                         *		if (isSAP)
                         *		{
                         *			return 20;
                         *		}
                         *		else
                         *		{
                         *			return 100;
                         *		}
                         * }
                        */
                        CustomizeRowCount: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomizeRowCountPerPage
                         * @since 332
                         * @description
                         * Allows you to customize the row count per page in the PO browse dialog.
                         * SAP support was added in sprint 344.
                         * @example
                         * <caption>Return a new value for the rowcountperpage</caption>
                         * CustomizeRowCountPerPage: function ()
                         * {
                         *		if (Data.GetValue("ERP__") === "SAP")
                         *		{
                         *			return 20;
                         *		}
                         *		return 10;
                         * }
                        */
                        CustomizeRowCountPerPage: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.SortPoItems
                         * @since 338
                         * @description
                         * Allows you to customize the sorting of the PO items in the browse dialog.
                         * @param {Lib.AP.BrowsePO.POItem[]} poItems Array of PO items to sort.
                         * @returns {Lib.AP.BrowsePO.POItem[]} Sorted array of PO items.
                         * @example
                         * <caption>Sort PO items by ITEMNUMBER__ if parameter is enabled</caption>
                         * SortPoItems: function (poItems)
                         * {
                         *		if (Sys.Parameters.GetInstance("AP").GetParameter("Z_EnablePoLineSorting", "0") === "1")
                         *		{
                         *			return poItems.sort((a, b) => a.item.ITEMNUMBER__ - b.item.ITEMNUMBER__);
                         *		}
                         *		return poItems;
                         * }
                        */
                        SortPoItems: function (poItems) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CustomSearchEvent
                         * @since 360
                         * @description
                         * Intercept custom events in the BrowsePO dialog before standard handling.
                         * Return true to suppress standard behavior, or return void to let it proceed.
                         * @param {Dialog} handleDialog The BrowsePO dialog.
                         * @param {string} action Current dialog action.
                         * @param {string} event Event triggered in the dialog.
                         * @param {IControl} control The control from which the event originates.
                         * @param {ESKMap<IControl>} [tableItem] Current table row when the event comes from a table control.
                         * @returns {boolean | void} Return true to suppress standard handling.
                         * @example
                         * <caption>Handle a custom row refresh event and skip the standard behavior</caption>
                         * CustomSearchEvent: function (handleDialog, action, event, control, tableItem)
                         * {
                         *		if (event === "OnRefreshRow")
                         *		{
                         *			return true;
                         *		}
                         * }
                         */
                        CustomSearchEvent: function (handleDialog, action, event, control, tableItem) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Common.CancelSearch
                         * @since 364
                         * @description
                         * Allows you to validate search criteria and cancel a PO browse search triggered after the dialog has opened.
                         * Called before any filter building or database operations for that search.
                         * This user exit is not called for the automatic search performed when the PO browse dialog opens.
                         * Return true to cancel the search; return void or false to proceed normally.
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @param {Sys.Helpers.Browse.SearchCriterion[]} searchCriteria Array of search criterion objects with metadata
                         * @param {Dialog | null} dialogResults The results dialog, to reset or hide previous results (added since 366). May be null or stale when the exit is called before any search has completed.
                         * @returns {boolean | void} Return true to cancel the search; return void/false to proceed
                         * @example
                         * <caption>Validate that at least one search criterion has a value</caption>
                         * CancelSearch: function (dialog, searchCriteria)
                         * {
                         *		const hasEnteredCriterion = searchCriteria.some((criterion) =>
                         *			Boolean(dialog.GetControl("searchCriteria_" + criterion.id)?.GetText())
                         *		);
                         *
                         *		if (!hasEnteredCriterion)
                         *		{
                         *			Popup.Snackbar({
                         *				message: "Please enter at least one search criterion",
                         *				status: "warning",
                         *				timeout: "4000"
                         *			});
                         *			return true;
                         *		}
                         * }
                         * @example
                         * <caption>Clear previous results before cancelling the search</caption>
                         * CancelSearch: function (dialog, searchCriteria, dialogResults)
                         * {
                         *		if (!someCustomCondition)
                         *		{
                         *			if (dialogResults)
                         *			{
                         *				Sys.Helpers.Browse.ResetTable(dialogResults);
                         *				Sys.Helpers.Browse.HideWaitingIcon(dialogResults, true);
                         *				Sys.Helpers.Browse.HideResults(dialogResults, true);
                         *				Sys.Helpers.Browse.SetAndShowResultMessages(dialogResults, "Search cancelled");
                         *			}
                         *			return true;
                         *		}
                         * }
                         */
                        CancelSearch: function (dialog, searchCriteria, dialogResults) {
                        }
                    },
                    /**
                     * Specifics customization for the SAP PO Browse
                     * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO.SAP
                    */
                    SAP: {
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.GetNextPOChunk
                         * @since 361
                         * @description
                         * Allows you to override how the next chunk of purchase orders is retrieved in SAP Browse PO.
                         * Return true when the chunk retrieval is fully handled by your customization.
                         * Return null or nothing to keep the default SAP query behavior.
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters and chunk state
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @param {Dialog} dialogResults The results tab dialog, already initialized (contains the "resultTable" control), so you can render rows directly
                         * @param {Function} getVendorPOListCallback Callback to invoke with the query result payload. Use the standard shape, or call it with `.call({ GetQueryValue: () => queryResult })` if you build your own payload
                         * @param {Function} enableSearch Call this once your custom chunk retrieval is fully done, to re-enable the search UI
                         * @param {Function} getNextPOChunk Call this to recurse and fetch the next chunk (increment currentSearchParameters.currentChunk yourself first)
                         * @param {Function} addCustomDimensions Call as addCustomDimensions(item, po, poItem) to populate custom PO dimensions on a result row
                         * @return {boolean | void} Whether the chunk retrieval has been fully handled
                         * @example
                         * <caption>Run a custom query for the next PO chunk</caption>
                         * GetNextPOChunk: function (currentSearchParameters, dialog, dialogResults, getVendorPOListCallback, enableSearch, getNextPOChunk, addCustomDimensions)
                         * {
                         *		Lib.AP.SAP.SAPQuery(
                         *			getVendorPOListCallback,
                         *			Variable.GetValueAsString("SAPConfiguration"),
                         *			"ZESK_PO_BROWSE",
                         *			currentSearchParameters.queryFields,
                         *			currentSearchParameters.queryFilter,
                         *			100,
                         *			currentSearchParameters.currentChunk * 100);
                         *		return true;
                         * }
                         */
                        GetNextPOChunk: function (currentSearchParameters, dialog, dialogResults, getVendorPOListCallback, enableSearch, getNextPOChunk, addCustomDimensions) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizePOItemRowDisplay
                         * @since 361
                         * @description
                         * Allows you to override the link text and highlight style of a row in the PO items browse table ("POItems__"),
                         * on each "OnRefreshRow" event. By default, rows with a PriceCondition__ value (planned delivery cost lines)
                         * are shown with a blank link and highlighted; other rows show an "_Add" link and are not highlighted.
                         * Return an object to override either or both aspects independently; omitted fields fall back to the default.
                         * Return nothing to keep the default behavior entirely.
                         * @param {any} row The PO items table row being refreshed
                         * @param {boolean} hasPriceCondition The default condition (row.PriceCondition__.GetValue() is truthy)
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters
                         * @return {{ showAddLink: boolean, highlight: boolean } | void} Override for the row's link text (showAddLink) and/or highlight style (highlight), with each property optional when returned; return void to keep default behavior
                         * @example
                         * <caption>Show the "Add" link on planned delivery cost lines when searching by BOL, while keeping them highlighted</caption>
                         * CustomizePOItemRowDisplay: function (row, hasPriceCondition, dialog, currentSearchParameters)
                         * {
                         *		if (hasPriceCondition && currentSearchParameters.searchByBOL)
                         *		{
                         *			return { showAddLink: true, highlight: true };
                         *		}
                         * }
                         */
                        CustomizePOItemRowDisplay: function (row, hasPriceCondition, dialog, currentSearchParameters) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.HistoricsQueryMaxNbOfLines
                         * @since 343
                         * @description
                         * User exit to customize the maximum number of historic lines retrieved when querying purchase order history.
                         * By default, only the first 300 historic lines (goods receipts) are retrieved from SAP table EKBE.
                         * @example
                         * <caption>Increase limit to 1000 for all POs</caption>
                         * HistoricsQueryMaxNbOfLines: function ()
                         * {
                         *     return 1000;
                         * }
                         */
                        HistoricsQueryMaxNbOfLines: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.AddInvoicedGRIVLines
                         * @description
                         * Use this function to allow the PO search page to add or ignore certain Goods receipt lines if the Goods receipt line has been fully invoiced.
                         * This function runs after the user has added all the lines from one PO via the "Add" link and the PO has the GR-based IV tick on.
                         * The default behaviour is to ignore the fully invoiced GR lines.
                         * Return true instead of false to add all GR lines.
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @return {boolean} whether or not to add all GR lines to the Invoice form, including the fully invoiced ones, when the user adds one entire PO via the "Add" link
                         * @example
                         * <caption>Return true to add all GR lines</caption>
                         * AddInvoicedGRIVLines: function (dialog)
                         * {
                         *		return true;
                         * }
                         * @example
                         * <caption>Return boolean conditional on a search criteria from dialog</caption>
                         * AddInvoicedGRIVLines: function (dialog)
                         * {
                         *		return dialog.GetControl("searchCriteria_CustomizationPS_AddFullyInvoicedGRs__").GetValue();
                         * }
                         */
                        AddInvoicedGRIVLines: function (dialog) {
                            // Return 'true' to add all GR lines, including the fully invoiced ones, when clicking the "Add" link on a PO that has the "GR-based IV" tick on
                            // Return 'false' (default) to ignore the fully invoiced GR lines when clicking the "Add" link on a PO that has the "GR-based IV" tick on
                            return false;
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.AddOneInvoicedGRIVLine
                         * @description
                         * Use this function to allow the PO search page to add or ignore a specific Goods receipt line.
                         * This function runs when the user is adding individual lines and the PO has the GR-based IV tick on.
                         * Return 'true' instead of 'false' to add the specific GR line.
                         * Note: 'Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.AddInvoicedGRIVLines' takes precedence over this user exit.
                         * @param {PurchaseOrder.POItemData} line The current PO item information
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @return {boolean} Whether or not to add this specific GR line to the Invoice form
                         * @example
                         * <caption>Fine grained control over adding GR lines</caption>
                         * AddOneInvoicedGRIVLine: function (line, dialog)
                         * {
                         * 	if (line.IsServiceItem() && line.refExpectedQuantity === 0 && line.refExpectedAmount > 0)
                         *	{
                         *		return true;
                         *	}
                         *	else if (!line.IsServiceItem() && line.refExpectedQuantity > 0 && line.refExpectedAmount > 0)
                         *	{
                         *		return true;
                         *	}
                         *	return false;
                         * }
                         */
                        AddOneInvoicedGRIVLine: function (line, dialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizeBrowseResultTable
                         * @since 331
                         * @description
                         * Use this function to customize the PO browse result table.
                         * @param {any} popupTable result table Control of the PO browse
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @example
                         * <caption>Customize the PO browse result table</caption>
                         * CustomizeBrowseResultTable: function (popupTable, dialog)
                         * {
                         * 		let vendorFilter = dialog.GetControl("searchCriteria_VendorNumberFilter__");
                         * 		let vendorColumn = popupTable.GetColumnControl(3);
                         * 		//Display the vendor column if the filter contains a *
                         *		if (vendorFilter && vendorColumn && vendorColumn.GetName() == "VendorNumber__")
                         *		{
                         *			vendorColumn.Hide(vendorFilter.GetValue() && !vendorFilter.GetValue().match(/[*]/));
                         *		}
                         * }
                         */
                        CustomizeBrowseResultTable: function (popupTable, dialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizeBrowsePOItemsTable
                         * @since 362
                         * @description
                         * Use this function to customize the PO items table in the PO browse dialog for SAP configurations.
                         * This user exit is called after the PO items table is created.
                         * @param {any} table The PO items table Control of the PO browse
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @returns {void}
                         * @example
                         * <caption>Enable click-to-sort on the PO items table</caption>
                         * CustomizeBrowsePOItemsTable: function (table, dialog)
                         * {
                         * 	table.SetAllowSortTable(true);
                         * }
                         */
                        CustomizeBrowsePOItemsTable: function (table, dialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizePOFilter
                         * @since 332
                         * @description
                         * Allows you to customize the filter used when browsing for PO in SAP Browse PO.
                         * @param {string} filter The default filter
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @return {Promise<string> | string} The customized filter to use in the query. You can also return a promise.
                         * @example
                         * <caption>Customize the PO filter to filter by a specific vendor number</caption>
                         * CustomizePOFilter: function (filter, dialog)
                         * {
                         *	// Add a condition to filter by a specific vendor number
                         *	const vendorNumber = Data.GetValue("VendorNumber__");
                         *	if (vendorNumber)
                         *	{
                         *		filter += ` AND (LIFNR = '${vendorNumber}' OR LIFRE = '${vendorNumber}')`;
                         *	}
                         *	return filter;
                         * }
                         */
                        CustomizePOFilter: function (filter, dialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizePOItemBeforeAddLineItem
                         * @since 361
                         * @description
                         * Allows you to customize a PO item before it is displayed in the SAP Browse PO line table.
                         * This exit is called from the browse-table display path (FillTableWithPOItems).
                         * Return false to hide the row from the browse table.
                         * Return a modified PO item to override default values (for example description or ordered amount).
                         * Return nothing to keep default behavior.
                         * @param {PurchaseOrder.PODetailsClient} poDetails The purchase order details
                         * @param {ITable} poTable The PO items table
                         * @param {PurchaseOrder.POItemData} poItem The PO item being added
                         * @param {boolean} isPdc Whether the row is a planned delivery cost line
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters
                         * @return {PurchaseOrder.POItemData | false | void} Return false to skip the row, or a modified PO item
                         * @example
                         * <caption>Hide planned delivery cost rows from the browse table</caption>
                         * CustomizePOItemBeforeAddLineItem: function (poDetails, poTable, poItem, isPdc, currentSearchParameters)
                         * {
                         *		if (isPdc)
                         *		{
                         *			return false;
                         *		}
                         * }
                         */
                        CustomizePOItemBeforeAddLineItem: function (poDetails, poTable, poItem, isPdc, currentSearchParameters) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizePOItemWithoutAccountAssignment
                         * @since 361
                         * @description
                         * Allows you to customize or skip a PO item before it is inserted into AP line items,
                         * when no account-assignment line was matched for the item (parseAccountAssignment path).
                         * This exit is called from the line-insertion path, not from the browse table display.
                         * Return false to skip inserting the item, a modified PO item to override values before insertion,
                         * or nothing to insert the item unchanged (default behavior).
                         * @param {PurchaseOrder.POItemData} item The PO/GR item being inserted in AP line items
                         * @param {PurchaseOrder.PODetailsClient} po The purchase order details
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters
                         * @return {PurchaseOrder.POItemData | false | void} Return false to skip the item, a modified PO item to use instead, or nothing to keep the item unchanged
                         * @example
                         * <caption>Populate custom fields on a PO item before AP line insertion</caption>
                         * CustomizePOItemWithoutAccountAssignment: function (item, po, currentSearchParameters)
                         * {
                         *		// Enrich the item with data from a custom source before it is added as an AP line
                         *		item["Z_CustomField__"] = po.PO_HEADER.PO_NUMBER;
                         *		return item;
                         * }
                         */
                        CustomizePOItemWithoutAccountAssignment: function (item, po, currentSearchParameters) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomProcessGRItems
                         * @since 361
                         * @description
                         * Allows you to fully take over Goods Receipt item processing for a PO item in the SAP Browse PO dialog,
                         * including driving your own call to GetHistoricsPerPurchasingDocumentForBrowse (or an alternative custom source)
                         * and invoking the callback yourself once done.
                         * This user exit is called at the very beginning of the GR processing path, before any standard logic runs.
                         * Return true when the processing is fully handled by your customization (you must call `callback` yourself).
                         * Return nothing (or null) to keep the default behavior (standard SAP EKBE query and matching logic).
                         * @param {string} orderNumber The purchase order number
                         * @param {string} itemNumber The purchase order item number
                         * @param {PurchaseOrder.PODetailsClient} po The full purchase order details
                         * @param {PurchaseOrder.POItemData} poItem The PO item for which GR lines are being retrieved
                         * @param {Function} callback Callback to invoke as callback(lineAdded, orderNumber, itemNumber) once processing is complete
                         * @param {boolean} addPOItemAction Whether the item is being added through the individual "Add" action (as opposed to adding the whole PO)
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters (may include custom fields like searchByOD, outboundDeliveryPOsAndLines)
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @param {Function} isItemAlreadySet Call as isItemAlreadySet(orderNumber, itemNumber, goodReceipt?, conditionType?) to check if a line is already present on the invoice
                         * @param {Function} onlyShowOpenOrders Call to check whether the "Only show open orders/items" checkbox is checked
                         * @param {Function} parseAccountAssignement Call as parseAccountAssignement(item, po) to add a GR item to the invoice using the standard account-assignment logic
                         * @param {Function} addedItemList Call as addedItemList(po) to get the list of PO item numbers that should be added given the current search context
                         * @return {boolean | void} Whether the GR item processing has been fully handled
                         * @example
                         * <caption>For OD search: drive the GR history query and match against OD lines yourself</caption>
                         * CustomProcessGRItems: function (orderNumber, itemNumber, po, poItem, callback, addPOItemAction, currentSearchParameters, dialog, isItemAlreadySet, onlyShowOpenOrders, parseAccountAssignement, addedItemList)
                         * {
                         *		if (!currentSearchParameters.searchByOD)
                         *		{
                         *			return;
                         *		}
                         *		const poNumber = po.PO_HEADER.PO_NUMBER;
                         *		const lines = currentSearchParameters.outboundDeliveryPOsAndLines[poNumber];
                         *		const netPrices = (Array.isArray(lines) ? lines : [])
                         *			.filter(l => l && Sys.Helpers.SAP.SAPValuesAreEqual(l[0], poItem.Po_Item))
                         *			.map(l => parseFloat(l[2]))
                         *			.filter(v => !isNaN(v));
                         *
                         *		Lib.AP.SAP.PurchaseOrder.GetHistoricsPerPurchasingDocumentForBrowse(orderNumber, po.ORIGINALS_PO_ITEM[poItem.Po_Item], po, currentSearchParameters.deliveryNotes, function (items)
                         *		{
                         *			let anyAdded = false;
                         *			items.forEach(function (item)
                         *			{
                         *				const idx = netPrices.findIndex(price => price === item.refExpectedAmount);
                         *				if (idx !== -1 && !isItemAlreadySet(orderNumber, itemNumber, item.Ref_Doc))
                         *				{
                         *					netPrices.splice(idx, 1);
                         *					parseAccountAssignement(item, po);
                         *					anyAdded = true;
                         *				}
                         *			});
                         *			callback(anyAdded, orderNumber, itemNumber);
                         *		}, addPOItemAction, addedItemList(po));
                         *
                         *		return true;
                         * }
                         */
                        CustomProcessGRItems: function (orderNumber, itemNumber, po, poItem, callback, addPOItemAction, currentSearchParameters, dialog, isItemAlreadySet, onlyShowOpenOrders, parseAccountAssignement, addedItemList) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizeAddDeliveryCostsLines
                         * @since 361
                         * @description
                         * Allows you to override how planned delivery cost lines are added from SAP Browse PO.
                         * Return true when delivery cost lines are fully handled by your customization.
                         * Return null or nothing to keep the default behavior.
                         * @param {string} orderNumber The purchase order number
                         * @param {string} itemNumber The purchase order item number, when delivery costs are added for a specific item. It can be empty when delivery costs are added for the whole PO.
                         * @param {PurchaseOrder.PODetailsClient} po The purchase order details
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters
                         * @param {Function} isItemAlreadySet Call as isItemAlreadySet(orderNumber, itemNumber, goodReceipt?, conditionType?) to check if a line is already present on the invoice
                         * @param {Function} AddLineItem Call as AddLineItem(item, po) to add a delivery cost line the same way the standard flow does
                         * @return {boolean | void} Whether the delivery cost addition has been fully handled
                         * @example
                         * <caption>Handle planned delivery costs with a custom implementation</caption>
                         * CustomizeAddDeliveryCostsLines: function (orderNumber, itemNumber, po, currentSearchParameters, isItemAlreadySet, AddLineItem)
                         * {
                         *		for (const dc of po.PlannedDeliveryCosts || [])
                         *		{
                         *			if ((!itemNumber || Sys.Helpers.SAP.SAPValuesAreEqual(itemNumber, dc.Po_Item)) &&
                         *				!isItemAlreadySet(dc.Po_Number, dc.Po_Item, "", dc.Cond_Type))
                         *			{
                         *				AddLineItem(dc, po);
                         *			}
                         *		}
                         *		return true;
                         * }
                         */
                        CustomizeAddDeliveryCostsLines: function (orderNumber, itemNumber, po, currentSearchParameters, isItemAlreadySet, AddLineItem) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizeInitSearchParameters
                         * @description
                         * Allows you to customize the init search parameters used to search for POs in the PO browse dialog.
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @return {Lib.AP.SAP.BrowsePO.SearchParameters | void} The customized search parameters. You can also return null to work with the default behavior.
                         * @example
                         * <caption>Change the query table and query fields based on the search criteria</caption>
                         * CustomizeInitSearchParameters: function (currentSearchParameters, dialog)
                         * {
                         *	const searchBySES = Boolean(dialog.GetControl("Z_ServiceEntrySheetFilter__").GetValue());
                         *	const searchByDN = Boolean(dialog.GetControl("searchCriteria_DeliveryNoteFilter__").GetText());
                         *	currentSearchParameters.queryTable = searchByDN || searchBySES ? "ZESK_DELIV_NOTES" : "EKKO";
                         *	if (searchBySES)
                         *	{
                         *		currentSearchParameters.queryFields += "|LFBNR";
                         *	}
                         *	return currentSearchParameters;
                         * }
                        */
                        CustomizeInitSearchParameters: function (currentSearchParameters, dialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.OnProcessPOQueryResultRow
                         * @since 361
                         * @description
                         * Called for each row in the PO header query results (EKKO or ZESK_DELIV_NOTES),
                         * before PO details are fetched. Mutate currentSearchParameters directly to collect
                         * extra data from the row (e.g. SES numbers added via CustomizeInitSearchParameters).
                         * @param {QueryResult} results The query result object
                         * @param {number} idx The zero-based index of the current row
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters Search parameters to enrich
                         * @example
                         * <caption>Collect SES numbers for use in CustomizeItemShouldBeAdded</caption>
                         * BrowsePO.SAP.OnProcessPOQueryResultRow = function (results, idx, currentSearchParameters)
                         * {
                         *     const sesNumber = results.GetQueryValue("LFBNR", idx);
                         *     if (sesNumber)
                         *     {
                         *         if (!currentSearchParameters.sesNumbers) { currentSearchParameters.sesNumbers = []; }
                         *         if (currentSearchParameters.sesNumbers.indexOf(sesNumber) === -1)
                         *         {
                         *             currentSearchParameters.sesNumbers.push(sesNumber);
                         *         }
                         *     }
                         * };
                         */
                        OnProcessPOQueryResultRow: function (results, idx, currentSearchParameters) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.SAP.CustomizeItemShouldBeAdded
                         * @since 361
                         * @description
                         * Called for each PO line item when deciding whether to include it in the browse.
                         * Return true to include, false to exclude, or void/null for standard behavior.
                         * Use currentSearchParameters to access data collected via OnProcessPOQueryResultRow.
                         * This user exit is called after the "Show only open orders" gate, for each item candidate.
                         * @param {any} po The purchase order details object.
                         * @param {string} itemNumber The item number of the current PO line.
                         * @param {Lib.AP.SAP.BrowsePO.SearchParameters} currentSearchParameters The current search parameters. This should only be a reference and not to be modified directly. Use CustomizeInitSearchParameters to modify the search parameters.
                         * @param {boolean} defaultResult The result that would be applied by the standard logic.
                         * @param {Dialog} dialog The browse dialog instance.
                         * @returns {boolean | void} true to include, false to exclude, void/null for standard
                         * @example <caption>Only show PO items linked to a collected SES number</caption>
                         * BrowsePO.SAP.CustomizeItemShouldBeAdded = function (po, itemNumber, currentSearchParameters, defaultResult, dialog)
                         * {
                         *     if (!currentSearchParameters.sesNumbers || currentSearchParameters.sesNumbers.length === 0)
                         *     {
                         *         return; // no SES filter, use standard behavior
                         *     }
                         *     const poItemHistory = po.PO_ITEM_HISTORY;
                         *     for (let i = 0; i < poItemHistory.length; i++)
                         *     {
                         *         if (Sys.Helpers.SAP.SAPValuesAreEqual(poItemHistory[i].PO_ITEM, itemNumber) &&
                         *             currentSearchParameters.sesNumbers.indexOf(poItemHistory[i].REF_DOC_NO.toString()) !== -1)
                         *         {
                         *             return true;
                         *         }
                         *     }
                         *     return false;
                         * };
                         *
                         * @example <caption>Exclude PO items with item category "D"</caption>
                         * BrowsePO.SAP.CustomizeItemShouldBeAdded = function (po, itemNumber, currentSearchParameters, defaultResult, dialog)
                         * {
                         *	var poItem = po.PO_ITEMS[itemNumber];
                         *	if (poItem && Sys.Helpers.SAP.SAPValuesAreEqual(poItem.Item_Cat, "D"))
                         *	{
                         *		return false;
                         *	}
                         * };
                         */
                        CustomizeItemShouldBeAdded: function (po, itemNumber, currentSearchParameters, defaultResult, dialog) {
                        }
                    },
                    /**
                     * Specifics customization for the Generic PO Browse
                     * @namespace Lib.AP.Customization.HTMLScripts.BrowsePO.Generic
                    */
                    Generic: {
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.BrowseAtGoodReceiptLevel
                         * @description
                         * Allows you to customize the browse of the purchase order and define the elements on the second tab.
                         * This user exit is called during the opening of the purchase order browse and determine if the second tab will list only the PO items or the goods receipts if the GR mode is enabled.
                         * @return {boolean} is the second tab contains the goods receipts. You can also return null to work with the default behavior.
                         * @example
                         * <pre><code>
                         * BrowseAtGoodReceiptLevel: function ()
                         * {
                         *	// The purchase order browse is modified only with de company code FR01
                         *	if (Controls.CompanyCode__.GetValue() === "FR01")
                         *	{
                         *		return true;
                         *	}
                         *	return false;
                         * }
                         * </code></pre>
                        */
                        BrowseAtGoodReceiptLevel: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.CustomizeDisplayRowCondition
                         * @since 331
                         * @description
                         * Allows you to customize the condition to display a row in the PO browse dialog.
                         * @example
                         * <caption>Return boolean to determine if the row is to be displayed. If the UE is undefined, by default true</caption>
                         * CustomizeDisplayRowCondition: function (dialog, lineItemMap, queryValue)
                         * {
                         *		if(dialog.GetControl("searchCriteria_CustomizationPS_AddFullyInvoicedGRs__").GetValue())
                         *		{
                         *			return true;
                         *		}
                         *
                         * 		// Add fully invoiced GR is not checked. Only add GR that are 'open' based on qty comparison.
                         * 		let deliveredQuantity = lineItemMap.DELIVEREDQUANTITY__ || 0;
                         * 		let invoicedQuantity = lineItemMap.INVOICEDQUANTITY__ || 0;
                         * 		return deliveredQuantity > invoicedQuantity;
                         * }
                        */
                        CustomizeDisplayRowCondition: function (dialog, lineItemMap, queryValue) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.CustomizePOFilter
                         * @description
                         * Allows you to customize the LDAP filter used when browsing for the PO Headers in Generic Browse PO.
                         * @param {string} filter The default LDAP filter
                         * @return {string} The customized LDAP filter to use in the query
                         * @example
                         * <caption>Return a stricter LDAP filter if a filter was defined initially</caption>
                         * CustomizePOFilter: function (filter)
                         * {
                         *     if (filter)
                         *     {
                         *         return `(&${filter}(CustomField__=CustomValue))`;
                         *     }
                         *     return filter;
                         * }
                         * </code></pre>
                         */
                        CustomizePOFilter: function (filter) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.CustomQueryMaxItem
                         * @since 339
                         * @description
                         * User exit to customize the maximum number of Goods Receipt line items retrieved in the PO browse.
                         * This user exit is used in two different query mechanisms:
                         * - Query.DBQuery can accept a number, "NO_LIMIT", or "full_result" for maxItems.
                         * - Sys.Helpers.OData.Browse (used under the hood by GetPOItemGoodsReceived) only accepts a numeric maxItems value.
                         * The restrictToNumbers parameter indicates which usage is calling the user exit.
                         * @param {boolean} [restrictToNumbers] True when caller needs a number only (OData/GetPOItemGoodsReceived path), false when "NO_LIMIT" and "full_result" are also allowed (DBQuery path).
                         * @returns {number | "NO_LIMIT" | "full_result"} The maximum number of items to retrieve.
                         * @example <caption>Return a number when restrictToNumbers is true, otherwise allow special string values</caption>
                         * CustomQueryMaxItem: function (restrictToNumbers)
                         * {
                         * 	if (restrictToNumbers)
                         * 	{
                         * 		return 500;
                         * 	}
                         * 	return "full_result";
                         * }
                         */
                        CustomQueryMaxItem: function (restrictToNumbers) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.CustomizeBrowseResultTable
                         * @since 358
                         * @description
                         * Use this function to customize the PO browse result table for generic configurations.
                         * This user exit is called after the PO headers result table is filled with query results.
                         * @param {any} resultTable The result table Control of the PO browse
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @param {Function} closeDialog The function to close the dialog (since 365)
                         * @returns {void}
                         * @example <caption>Enable click-to-sort on the PO headers result table</caption>
                         * CustomizeBrowseResultTable: function (resultTable, dialog, closeDialog)
                         * {
                         * 	resultTable.SetAllowSortTable(true);
                         * }
                         */
                        CustomizeBrowseResultTable: function (resultTable, dialog, closeDialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.CustomizeBrowsePOItemsTable
                         * @since 358
                         * @description
                         * Use this function to customize the PO items table in the PO browse dialog for generic configurations.
                         * This user exit is called after the PO items table is created.
                         * @param {any} table The PO items table Control of the PO browse
                         * @param {Dialog} dialog The dialog object of the PO browse
                         * @returns {void}
                         * @example <caption>Enable click-to-sort on the PO items table</caption>
                         * CustomizeBrowsePOItemsTable: function (table, dialog)
                         * {
                         * 	table.SetAllowSortTable(true);
                         * }
                         */
                        CustomizeBrowsePOItemsTable: function (table, dialog) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.BrowsePO.Generic.ShouldDisplayPOLineWithoutGRRecord
                         * @since 361
                         * @description
                         * When browsing purchase orders at goods receipt level (GRIV mode), this user exit is called for a PO line
                         * when the goods receipt query returns no record for that line and "Only show open orders/items" is unchecked.
                         * Return true to display the PO line in the PO items table with empty/zero goods receipt fields
                         * (delivery note, delivery date, GR number, delivered quantity and amount), allowing users to select
                         * not-yet-received PO lines. The default (user exit not implemented or returning false/void) keeps the current
                         * behavior where such lines are hidden.
                         * @param {Lib.AP.BrowsePO.ItemMap} itemMap The PO line data with no associated goods receipt record.
                         * @returns {boolean | void} true to display the PO line with empty goods receipt fields, void/false to hide it (default).
                         * @example <caption>Display PO lines without goods receipt for company code FR01</caption>
                         * ShouldDisplayPOLineWithoutGRRecord: function (itemMap)
                         * {
                         * 	return Controls.CompanyCode__.GetValue() === "FR01";
                         * }
                         */
                        ShouldDisplayPOLineWithoutGRRecord: function (itemMap) {
                        }
                    }
                };
                /**
                 * Specifics customization for the AP Browse
                 * @namespace Lib.AP.Customization.HTMLScripts.Browse
                 */
                HTMLScripts.Browse = {
                    /**
                     * Specifics customization for the SAP PO Browse
                     * @namespace Lib.AP.Customization.HTMLScripts.Browse.Common
                     */
                    Common: {
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.Browse.Common.OnInitializeEnd
                         * @description
                         * Use this function to customize Vendor invoice browse control once they have been initialized in LIB_AP_Browse.
                         * You can use it to customize browse controls, like redefine the customquery option, display condition or even configure custom fields.
                         * @param {Lib.ERP.Invoice.Instance<Lib.ERP.Manager.Instance>} erpInvoiceInstance instance of the ERP invoice
                         * @param {Lib.AP.Browse.BrowseConfigurations} sapConfigs SAP configurations
                         * @param {Lib.AP.Browse.SapAllowDisplays} sapAllowDisplays SAP allow displays
                         * @example
                         * Common.OnInitializeEnd = function(erpInvoiceInstance, sapConfigs, sapAllowDisplays)
                         * {
                         * 	var ForPaymentMethod = {
                         *  	sapConfigName: Variable.GetValueAsString("SAPConfiguration"),
                         *  	useSAPBapiLocalCache: true,
                         *  	sapQueryMethod:
                         *  	{
                         *  		type: "BAPI",
                         *  		name: "Z_GET_PAYMENT_METHODS"
                         *  	},
                         *  	sapSearchFields:
                         *  	{
                         *  		PAYMENT_METHOD:
                         *  		{
                         *  			ffField: "ID__",
                         *  			notBapiParam: true,
                         *  		},
                         *  		DESCRIPTION:
                         *  		{
                         *  			ffField: "Description__",
                         *  			notBapiParam: true
                         *  		},
                         *  		COMPANY_CODE:
                         *  		{
                         *  			ffField: "CompanyCode__"
                         *  		}
                         *  	},
                         *  	bapiResultDefinition:
                         *  	{
                         *  		Tables:
                         *  		{
                         *  			PAYMENT_METHODS:
                         *  			{
                         *  				PAYMENT_METHOD: "ID__",
                         *  				DESCRIPTION: "Description__"
                         *  			}
                         *  		}
                         *  	}
                         *  };
                         *  Controls.SAPPaymentMethod__.SetCustomQuery(Sys.ERP.SAP.Browse.SapQuery, null, null, ForPaymentMethod);
                         * }
                         */
                        OnInitializeEnd: function (erpInvoiceInstance, sapConfigs, sapAllowDisplays) {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.Browse.Common.GetInvoiceItemsMaxRecords
                         * @since 345
                         * @description
                         * User exit to customize the maximum number of invoice items retrieved when querying SAP for invoice items
                         * using manual link feature. By default, a maximum of 200 records are retrieved.
                         * Use this user exit to increase or decrease this limit.
                         * @returns {number | void} The maximum number of records to retrieve, or void to use the default (200)
                         *
                         * @example
                         * // Increase the limit to 1000 records
                         * Common.GetInvoiceItemsMaxRecords = function()
                         * {
                         *     return 1000;
                         * }
                         */
                        GetInvoiceItemsMaxRecords: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.Browse.Common.GetExtendedWithholdingTaxQueryRowCountForBrowse
                         * @since 351
                         * @description
                         * User exit to customize the maximum number of extended withholding tax rows retrieved in AP browse.
                         * By default, a maximum of 200 records are retrieved.
                         * @returns {number | void} The maximum number of records to retrieve, or void to use the default (200)
                         * @example <caption>Increase the limit to 500 records</caption>
                         * Common.GetExtendedWithholdingTaxQueryRowCountForBrowse = function ()
                         * {
                         * 	return 500;
                         * }
                         */
                        GetExtendedWithholdingTaxQueryRowCountForBrowse: function () {
                        },
                        /**
                         * @method Lib.AP.Customization.HTMLScripts.Browse.Common.IsCompanyCodeReadOnlyOnSearch
                         * @since 354
                         * @description
                         * Use this user exit to make the Company Code field read-only in the invoice browse search popup.
                         * Return true to prevent the user from changing the company code when searching for invoices.
                         * @returns {boolean | void} Return true to make the company code field read-only, or void/false to keep it editable (default)
                         * @example <caption>Make the company code field read-only on invoice browse search</caption>
                         * Common.IsCompanyCodeReadOnlyOnSearch = function ()
                         * {
                         *     return true;
                         * }
                         */
                        IsCompanyCodeReadOnlyOnSearch: function () {
                        }
                    }
                };
                /**
                 * Specifics customization for the Esker DuplicateCheck
                 * @namespace Lib.AP.Customization.HTMLScripts.DuplicateCheck
                 */
                HTMLScripts.DuplicateCheck = {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.DuplicateCheck.OnHandleAlertDuplicateDialog
                     * @description
                     * Use this function to customize the Vendor invoice duplicate check popup once it has been displayed from customscript.
                     * You can use it to customize controls or configure additional events.
                     * This function is called at the end of the DuplicateCheck.HandleAlertDuplicateDialog method to handle any event triggered from the duplicate check popup
                     * @param {object} dialog The Dialog from which the event is triggered
                     * @param {integer} tabId The index of the tab from which the event is triggered
                     * @param {string} event The name of the triggered event
                     * @param {object} control The control which triggered the event
                     * @example
                     *	DuplicateCheck.OnHandleAlertDuplicateDialog = function (dialog, tabId, event, control)
                     *	{
                     * 		if (control.GetName() === "rejectButton")
                     *		{
                     *			Data.SetValue("RejectReason__", "Document already processed");
                     *			Data.SetValue("Comment__", "");
                     *			ProcessInstance.ApproveAsynchronous("Reject");
                     *		}
                     *	};
                     */
                    OnHandleAlertDuplicateDialog: function (dialog, tabId, event, control) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.DuplicateCheck.OnFillAlertDuplicateDialog
                     * @description
                     * Use this function to customize the Vendor invoice duplicate check popup once it has been initialized in customscript.
                     * You can use it to customize controls or configure custom fields.
                     * This function is called when filling the duplicate check popup, at the end of the DuplicateCheck.FillAlertDuplicateDialog method
                     * @param {object} dialog The Dialog object to fill
                     * @param {Duplicate[]} [duplicates] The duplicate check results displayed in the popup, passed from DuplicateCheck.Result.
                     * Each duplicate contains RUIDEX, duplicateKeys, controlsToCheck and additionalAttributes.
                     * This parameter is undefined when the user exit is called by older versions that do not pass the results.
                     * @returns {void}
                     * @example
                     *	DuplicateCheck.OnFillAlertDuplicateDialog = function (dialog)
                     *	{
                     * 		const rejectButton = dialog.AddButton("rejectButton", "_Reject invoice");
                     *		rejectButton.SetErrorStyle();
                     *
                     *		const duplicateTableCtrl = dialog.GetControl("duplicateTable");
                     *		if (duplicateTableCtrl) {
                     *			duplicateTableCtrl.HideBottomNavigation(true);
                     *			duplicateTableCtrl.SetLineCount(5);
                     *		}
                     *	};
                     * @example <caption>Display the company codes of the duplicate invoices</caption>
                     * DuplicateCheck.OnFillAlertDuplicateDialog = function (dialog, duplicates)
                     * {
                     * 	if (duplicates)
                     * 	{
                     * 		const companyCodes = duplicates.map(function (duplicate)
                     * 		{
                     * 			return duplicate.duplicateKeys.CompanyCode__;
                     * 		});
                     * 		dialog.AddDescription("duplicateCompanyCodes").SetText(companyCodes.join(", "));
                     * 	}
                     * };
                     */
                    OnFillAlertDuplicateDialog: function (dialog, duplicates) {
                    }
                };
                /**
                 * Specifics customization for the Bank Details
                 * @namespace Lib.AP.Customization.HTMLScripts.BankDetails
                 */
                HTMLScripts.BankDetails = {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.BankDetails.DisableBankDetailsSelection
                     * @since 332
                     * @description
                     * Allows you to override the possibility to disable bank details selection.
                     * @returns {boolean} true if you want to disable the bank details selection
                     * @example
                     * <caption>Disable the bank details selection if a custom alternative payee is set</caption>
                     *	DisableBankDetailsSelection: function ()
                     *	{
                     * 		if (Data.GetValue("Z_AlternativePayee__"))
                     *		{
                     *			return true;
                     *		}
                     *	};
                     */
                    DisableBankDetailsSelection: function () {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.BankDetails.OnBankDetailSelectionChanged
                     * @since 361
                     * @description
                     * Called in the Vendor invoice form whenever the bank details selection changes, whatever the ERP type is:
                     * when a bank detail row is checked or unchecked.
                     * Allows you to feed custom fields from the selected bank detail, for example to copy its IBAN into a custom header field.
                     * The standard selection has already been applied and the bank details table is in a stable state when this user exit is called.
                     * Note that this user exit is only called on user interaction. It is not replayed when the document is reopened,
                     * so the custom fields you fill are kept as they have been persisted.
                     * @param {object} data Information about the bank details selection.
                     * @param {boolean} data.isSelected Whether the bank detail row is now selected. It is false when the row has been unchecked.
                     * @param {Typing.AP_VIP.Controls.BankDetails__.Row} data.row The bank detail row the user interacted with.
                     * @returns {void}
                     * @example <caption>Copy the IBAN of the selected bank detail into a custom header field.</caption>
                     * OnBankDetailSelectionChanged: function (data)
                     * {
                     * 	Data.SetValue("Z_IBAN__", data.isSelected ? data.row.BankDetails_IBAN__.GetValue() : "");
                     * }
                     */
                    OnBankDetailSelectionChanged: function (data) {
                    }
                };
                /**
                 * To define custom functions corresponding to business behaviors:
                 * Create a object in which Functions defined in this scope will only be accessible within this library
                 * They can be called the following way CustomHelpers.MyCustomHelper()
                 * New objects can be defined to isolate several functions linked to a feature (i.e. : VendorHelpers)
                 * @example
                 * <pre><code>
                 * var CustomHelpers =
                 * {
                 *		HandleVendorWarning: function ()
                 *		{
                 *			if (Sys.Helpers.IsEmpty(Data.GetValue("VendorNumber__"))
                 *			{
                 *				Popup.Snackbar({message: "Please select a vendor", status: "warning", timeout: "6000"});
                 *			}
                 *		}
                 * };
                 * </code></pre>
                 */
                // Uncomment here
                // var CustomHelpers =
                // {
                // };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShouldCheckForOpenTab
                 * @description Determines if a check is needed to detect whether another tab is already open.
                 * @returns {boolean} false if we don't need to display a message when a tab is already open.
                 * @example
                 * <pre><code>
                 * ShouldCheckForOpenTab: function ()
                 * {
                 *		return false;
                 * }
                 * </code></pre>
                */
                HTMLScripts.ShouldCheckForOpenTab = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeRepostPopupDisplayCondition
                 * @description
                 * Overrides the default conditions for the invoice repost confirmation popup to display
                 * @returns {boolean}
                 * @example
                 * <pre><code>
                 * CustomizeRepostPopupDisplayCondition: function ()
                 * {
                 *		return !Data.GetValue("ManualLink__") && !Data.GetValue("ERPPostingError__");
                 * }
                 * </code></pre>
                 */
                HTMLScripts.CustomizeRepostPopupDisplayCondition = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeDuplicateCheckPopupDisplayConditions
                 * @description
                 * Overrides the default conditions for the duplicate check popup to display
                 * @returns {boolean}
                 * @example
                 * <pre><code>
                 * export const CustomizeDuplicateCheckPopupDisplayConditions = function (): boolean | void
                 * {
                 *		return Data.GetValue("AsideReason") == "Waiting for goods receipt" || Data.GetValue("InvoiceStatus__") !== Lib.AP.InvoiceStatus.SetAside;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.CustomizeDuplicateCheckPopupDisplayConditions = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeReviewerCanModifyLineItems
                 * @since 331
                 * @description
                 * Allows you to customize the condition that determines if the reviewer can modify line items.
                 * @returns {boolean} true if the reviewer can modify line items, false otherwise.
                 * @example
                 * <caption>Allow the reviewer to modify line items if the invoice is a PO invoice</caption>
                 * HTMLScripts.CustomizeReviewerCanModifyLineItems = function ()
                 * {
                 * 		return Controls.InvoiceType__.GetValue() === Lib.AP.InvoiceType.PO_INVOICE;
                 * }
                 */
                HTMLScripts.CustomizeReviewerCanModifyLineItems = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShouldSkipLineItemLayoutUpdates
                 * @description
                 * Allow to skip the ClearLineItems and UpdateLineItemsLayout under certain conditions when updating the VIP's layout
                 * @returns {boolean}
                 * @example
                 * <pre><code>
                 * export const ShouldSkipLineItemLayoutUpdates = function (): boolean | void
                 * {
                 *		return Controls.ManualLink__.IsChecked() && Controls.InvoiceType__.GetValue() !== Lib.AP.InvoiceType.NON_PO_INVOICE;
                 * }
                 * </code></pre>
                 */
                HTMLScripts.ShouldSkipLineItemLayoutUpdates = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnSetItemTaxRateAndTaxAmount
                 * @description
                 * Allow you to add custom behavior when a taxRate is being applied on a line-item
                 * @param {Item} item Item the taxRate is being applied to
                 * @example
                 * <pre><code>
                 * export const OnSetItemTaxRateAndTaxAmount = function (item): void
                 * {
                 *		customFunctions.DisplayTaxExplanation(item, item.GetValue("TaxCode__"));
                 * }
                 * </code></pre>
                 */
                HTMLScripts.OnSetItemTaxRateAndTaxAmount = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ManageCustomCodingsVisibility
                 * @since 330
                 * @description
                 * Allows you to manage the visibility of custom fields based on GL lines parameters
                 * @param {boolean} hasGLlines true if the invoice contains GL lines, false otherwise
                 * @example <caption>This example hides a custom field if the invoice doesn't contain GL lines</caption>
                 * HTMLScripts.ManageCustomCodingsVisibility = function (hasGLlines)
                 * {
                 * 		Controls.LineItems__.Z_CustomField__.Hide(!hasGLlines);
                 * }
                 */
                HTMLScripts.ManageCustomCodingsVisibility = function (hasGLlines) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.GetVendorByCustomField
                 * @since 330
                 * @description
                 * Allows you to get a vendor with a custom filter.
                 * @param {DatabaseComboBox} control DatabaseComboBox Object.
                 * @param {function} callback Callback function to call with the result of the search.
                 * @returns {boolean} false if we want to use the default behavior, true if we want to use the custom behavior.
                 * @example <caption>Get a vendor with a custom filter</caption>
                 * HTMLScripts.GetVendorByCustomField = function (control, callback)
                 * {
                 * 		if (control.GetName() === "VendorName__" || control.GetName() === "VendorNumber__")
                            return false;
                 * 		const vendorFilter = "VATNumber__=" + control.GetValue();
                 * 		const companyCode = Data.GetValue("CompanyCode__");
                 *		Lib.P2P.Browse.GetVendor(callback, companyCode, vendorFilter, "P2P");
                 *		return true;
                 * }
                */
                HTMLScripts.GetVendorByCustomField = function (control, callback) {
                    return false;
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeExchangeRate
                 * @since 331
                 * @description
                 * Allows you to override or customize the exchange rate fields used in the invoice.
                 * @example <caption>override the exchange rate with a custom value</caption>
                 * HTMLScripts.CustomizeExchangeRate = function ()
                 * {
                 * 		let exchangeRate = Data.GetValue("Z_ExchangeRate__");
                 * 		Data.SetValue("ExchangeRate__", exchangeRate);
                 * }
                */
                HTMLScripts.CustomizeExchangeRate = function () {
                };
                /**
                   * @method Lib.AP.Customization.HTMLScripts.CheckPOInvoiceLineItemEnd
                   * @since 331
                   * @description
                   * Lets you customize or override error and warning messages for a line item.
                   * @param {Item} item The current line item.
                   * @example <caption>This example sets an error on the Quantity field if the invoice quantity exceeds the expected quantity.</caption>
                   * HTMLScripts.CheckPOInvoiceLineItemEnd = function (item)
                   * {
                   *     if (item.GetValue("ExpectedQuantity__") < item.GetValue("Quantity__"))
                   *     {
                   *         item.SetError("Quantity__", "_Invoice quantity is greater than expected quantity");
                   *     }
                   * }
                   */
                HTMLScripts.CheckPOInvoiceLineItemEnd = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeFieldsOnAddedGLLineItem
                 * @since 331
                 * @description
                 * Allows you to customize the GL line item fields.
                 * @param {Item} item GL line item object.
                 * @example <caption>Set a value for a custom field when a new GL Line is added</caption>
                 * HTMLScripts.CustomizeFieldsOnAddedGLLineItem = function (item)
                 * {
                 * 		item.SetValue("Z_CustomField__", "Custom Value");
                 * }
                */
                HTMLScripts.CustomizeFieldsOnAddedGLLineItem = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnGLAccountChanged
                 * @since 333
                 * @description
                 * Called when the GL account is changed in a GL line item.
                 * @param {Item} item Item with the updated GL account.
                 * @param {Row} [row] Row with the updated GL account. (Since 340)
                 * @example <caption>Update a custom field on GL Account update</caption>
                 * HTMLScripts.OnGLAccountChanged = function (item, row)
                 * {
                 * 		item.SetValue("Z_CustomField__", "Custom Value");
                 * 		row.SetValue("Z_CustomField__", "Custom Value");
                 * }
                */
                HTMLScripts.OnGLAccountChanged = function (item, row) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnCostCenterChanged
                 * @since 333
                 * @description
                 * Called when the cost center is changed in a GL line item.
                 * @param {Item} item Item with the updated cost center.
                 * @param {Row} [row] Row with the updated cost center. (Since 340)
                 * @example <caption>Set a value for a custom field when the cost center is changed</caption>
                 * HTMLScripts.OnCostCenterChanged = function (item, row)
                 * {
                 * 		item.SetValue("Z_CustomField__", "Custom Value");
                 * 		row.SetValue("Z_CustomField__", "Custom Value");
                 * }
                */
                HTMLScripts.OnCostCenterChanged = function (item, row) {
                };
                /**
                 * Specifics customization for the Browse Tax Jurisdiction
                 * @namespace Lib.AP.Customization.HTMLScripts.BrowseTaxJurisdiction
                 */
                HTMLScripts.BrowseTaxJurisdiction = {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.BrowseTaxJurisdiction.CustomizeSearchCriterias
                     * @description
                     * Allow to customize the search criteria used in the Tax Jurisdiction browse dialog.
                     * @param {Array.<Sys.Helpers.Browse.SearchCriterion>} defaultCriterias
                     * @returns {Array.<Sys.Helpers.Browse.SearchCriterion>} The new search criterias.
                     * @example <caption>Set the default value for search criteria country to "US"</caption>
                     * HTMLScripts.BrowseTaxJurisdiction.CustomizeSearchCriterias = function (defaultCriterias)
                     * {
                     *  for (const criteria of criterias)
                     * 	{
                     * 	 	if (criteria.id === "COUNTRY")
                     *  	{
                     *  		criteria.defaultValue = "US";
                     * 		}
                     * 	}
                     *  return criterias;
                     * }
                    */
                    CustomizeSearchCriterias: function (defaultCriterias) {
                    },
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.BrowseTaxJurisdiction.CustomizeHandleSearchDialog
                     * @description
                     * Customize the search dialog handle event for the Tax Jurisdiction browse.
                     * The arguments are the same as the ones used in the Sys.Helpers.Browse.HandleSearchDialog that is override by this UE.
                     * @param {Dialog} dialog The Tax Jurisdiction browse dialog object.
                     * @param {string} tabId Not used in this context.
                     * @param {string} event Event triggered.
                     * @param {IControl} control The Control object from which the event originates.
                     * @param {any} eventParameter If the original event callback function provides parameters, they are transmitted here.
                     * @param {boolean} searchControlFocused Current focus on the search control.
                     * @param {function} requestFunction browseItemTaxJurisdiction.request.
                     * @param {function} returnSelectionFunction browseItemTaxJurisdiction.returnSelectionCallback.
                     *
                     * @returns {boolean} Focus on the search control.
                     * @example <caption>When dialog is opened, handle the dialog as if the search button were clicked.</caption>
                     * HTMLScripts.BrowseTaxJurisdiction.CustomizeHandleSearchDialog = function (dialog, tabId, event, control, eventParameter, searchControlFocused, requestFunction, returnSelectionFunction)
                     * {
                     *	var searchControlFocused;
                     *	if (event === "OnSetValue")
                     *	{
                     *		searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(dialog, tabId, "OnClick", control, eventParameter, searchControlFocused, requestFunction, returnSelectionFunction);
                     *	}
                     *	else // perform normal action
                     *	{
                     *		searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(dialog, tabId, event, control, eventParameter, searchControlFocused, requestFunction, returnSelectionFunction);
                     *	}
                     *
                     *	return searchControlFocused;
                     * }
                    */
                    CustomizeHandleSearchDialog: function (dialog, _tabId, event, control, eventParameter, searchControlFocused, requestFunction, returnSelectionFunction) {
                    },
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnApprovalLayoutEnd
                 * @since 333
                 * @description
                 * User exit called at the end of the approval layout setup. Allows you to execute custom logic after the standard approval layout is applied.
                 * Use this hook to adapt the UI or add process/customer-specific logic.
                 *
                 * @param {object} layoutHelper - The current LayoutHelper instance, giving access to layout methods and the current context (this).
                 * @example <caption>Customer customization example: initialize purchase order browsing if the invoice is a PO</caption>
                 * HTMLScripts.OnApprovalLayoutEnd: function(layoutHelper)
                 * {
                 *     if (Lib.AP.InvoiceType.isPOInvoice())
                 *     {
                 *         // ensure the browse button is visible
                 *         Controls.OrderNumber__.SetBrowsable(!ProcessInstance.isReadOnly);
                 *         layoutHelper.InitPurchaseOrdersBrowse();
                 *     }
                 * }
                 */
                HTMLScripts.OnApprovalLayoutEnd = function (layoutHelper) {
                };
                /** @method Lib.AP.Customization.HTMLScripts.OnInvoiceTypeUpdateConfirmedEnd
                 * @since 336
                 * @description
                 * User exit called at the end of the confirmation of invoice type update. Allows you to execute custom logic after supplier layout is updated upon change of invoice type.
                 * Use this hook to adapt the UI or add process/customer-specific logic.
                 *
                 * @example <caption>if the preferred invoice type for the vendor is “PO invoice”, then a warning popup should appear if the invoice type is changed to Non PO invoice</caption>
                 * HTMLScripts.OnInvoiceTypeUpdateConfirmedEnd: function()
                 * {
                 *     var preferredInvoiceType = Data.GetValue("Z_VendorPreferredInvoiceType__");
                 *	   var shouldShowPreferredInvoiceTypeWarning = Sys.Parameters.GetInstance("AP").GetParameter("Z_EnablePreferredInvoiceTypeWarning") === "1" && preferredInvoiceType && preferredInvoiceType === "PO Invoice" && !Lib.AP.InvoiceType.isPOInvoice();
                 *     if (shouldShowPreferredInvoiceTypeWarning)
                 *     {
                 *			Popup.Alert(
                 * 				"The preferred invoice type for this vendor is PO Invoice.",
                 *				"warn",
                 *				null,
                 *				"Different preferred invoice type detected"
                 *			);
                 *     }
                 * }
                 */
                HTMLScripts.OnInvoiceTypeUpdateConfirmedEnd = function () {
                };
                /** @method Lib.AP.Customization.HTMLScripts.OnCheckInvoiceCurrency
                 * @description
                 * User exit called after the invoice currency check.
                 * Which is triggered at the initialization of the form and when InvoiceCurrency__ changes.
                 *
                 * @param {string} requestedInvoiceCurrency Currency to check.
                 * @param {boolean} isCurrencyDefinedForCompanyCode Indicates if the currency is present in the table "P2P - Exchange rate__" for the company code.
                 * @example <caption>Save the currency in a custom field Z_Currency__ if it is defined for the company code</caption>
                 * HTMLScripts.OnCheckInvoiceCurrency: function(requestedInvoiceCurrency, isCurrencyDefinedForCompanyCode)
                 * {
                 *     if (isCurrencyDefinedForCompanyCode)
                 *     {
                 *         Data.SetValue("Z_Currency__", requestedInvoiceCurrency);
                 *     }
                 * }
                 */
                HTMLScripts.OnCheckInvoiceCurrency = function (requestedInvoiceCurrency, isCurrencyDefinedForCompanyCode) {
                };
                /** @method Lib.AP.Customization.HTMLScripts.OnInvoiceCurrencyChangeEnd
                 * @since 362
                 * @description
                 * User exit called after all amount conversions have completed when the invoice currency changes.
                 * Unlike OnCheckInvoiceCurrency, which is triggered asynchronously during the currency validation (before, and independently of, the amount conversion), this user exit is guaranteed to be called once the amount conversion is complete.
                 *
                 * @param {string} newCurrency Newly selected invoice currency code.
                 * @param {string} oldCurrency Previously selected invoice currency code.
                 * @returns {void}
                 * @example <caption>Adjust minimum precision on header amount fields and line-item columns after the conversion completes</caption>
                 * HTMLScripts.OnInvoiceCurrencyChangeEnd = function (newCurrency, oldCurrency)
                 * {
                 *		var minimumPrecision = newCurrency === "JPY" ? 0 : 2;
                 *		if (newCurrency !== oldCurrency)
                 *		{
                 *			Controls.AmountWithoutTax__.SetPrecisionMin(minimumPrecision);
                 *			Controls.TaxAmount__.SetPrecisionMin(minimumPrecision);
                 *			Controls.TotalAmount__.SetPrecisionMin(minimumPrecision);
                 *			Controls.LineItems__.Amount__.SetPrecisionMin(minimumPrecision);
                 *			Controls.LineItems__.TaxAmount__.SetPrecisionMin(minimumPrecision);
                 *		}
                 * }
                 */
                HTMLScripts.OnInvoiceCurrencyChangeEnd = function (newCurrency, oldCurrency) {
                };
                /** @method Lib.AP.Customization.HTMLScripts.UnplannedDeliveryCostsAffectBalance
                 * @description
                 * User exit called to determine if unplanned delivery costs would affect balance.
                 *
                 * @returns {boolean} returns true if unplanned delivery costs affect balance, false otherwise.
                 * @example <caption>returns false if unplanned delivery costs do not affect balance</caption>
                 * HTMLScripts.UnplannedDeliveryCostsAffectBalance: function()
                 * {
                 *     return false;
                 * }
                 */
                HTMLScripts.UnplannedDeliveryCostsAffectBalance = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShouldCheckEmptyPOLineItem
                 * @since 347
                 * @description
                 * Allows you to customize whether the empty PO line item validation should be performed before posting.
                 * This user exit is called from the customscript before executing the empty line item check.
                 * @returns {boolean} true to perform validation (default), false to skip validation
                 * @example <caption>Skip empty PO line item validation for low privilege AP users</caption>
                 * HTMLScripts.ShouldCheckEmptyPOLineItem = function()
                 * {
                 *     // Skip validation for low privilege AP users
                 *     if (Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP())
                 *     {
                 *         return false;
                 *     }
                 *     // Perform validation for all other users
                 *     return true;
                 * }
                 */
                HTMLScripts.ShouldCheckEmptyPOLineItem = function () {
                };
                /**
                 * @namespace Lib.AP.Customization.HTMLScripts.EmbeddedViews
                 * @description User exits for embedded view customizations in Vendor Invoice Processing
                 */
                let EmbeddedViews;
                (function (EmbeddedViews) {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.EmbeddedViews.GetMaxEntitiesInEmbeddedView
                     * @since 344
                     * @description
                     * User exit to configure the maximum number of invoices or contracts displayed in the embedded view.
                     * The concerned view names are:
                     * - "_AP_SAP_View_Vendor related contracts - embedded" for Related Contracts view
                     * - "_AP_SAP_View_Vendor history - embedded" for History view
                     * - "_AP_View_Invoice related invoices - embedded" for Related Invoices view
                     * @param {string} viewName the name of the embedded view
                     * @returns {number} The maximum number of invoices or contracts to display
                     * @example <caption>Configure to show 20 invoices in billing history.</caption>
                     * EmbeddedViews.GetMaxEntitiesInEmbeddedView = function(viewName)
                     * {
                     *   if (viewName === "_AP_SAP_View_Vendor history - embedded")
                     * 	 {
                     *     return 20;
                     *   }
                     * }
                     */
                    EmbeddedViews.GetMaxEntitiesInEmbeddedView = function (viewName) {
                    };
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.EmbeddedViews.GetVendorHistoryEmbeddedViewName
                     * @since 364
                     * @description
                     * Allows you to override the embedded view used for the vendor invoice history panel in the Vendor Invoice Processing form.
                     * Return a custom view name to use an alternative view, or void to use the standard "_AP_SAP_View_Vendor history - embedded" view.
                     * @returns {string | void} The custom embedded view name, or void to use the standard view.
                     * @example <caption>Use a custom view with an extra approver comment column</caption>
                     * EmbeddedViews.GetVendorHistoryEmbeddedViewName = function ()
                     * {
                     *	return "_AP_SAP_View_Vendor history custom - embedded";
                     * };
                     */
                    EmbeddedViews.GetVendorHistoryEmbeddedViewName = function () {
                    };
                })(EmbeddedViews = HTMLScripts.EmbeddedViews || (HTMLScripts.EmbeddedViews = {}));
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnFillInsertPOLineOrGLLineDialogEnd
                 * @since 347
                 * @description
                 * User exit called at the end of the line type selection dialog initialization.
                 * Allows customization to add additional radio button options for custom line types
                 * @param {Dialog} dialog - The dialog object being initialized
                 * @param {RadioButton} radio - The radio button control containing line type options
                 * @returns {void}
                 * @example <caption>Add a custom "Freight Cost" line type option</caption>
                 * HTMLScripts.OnFillInsertPOLineOrGLLineDialogEnd = function(dialog, radio)
                 * {
                 *     var currentText = radio.GetText();
                 *     radio.SetText(currentText + "\n_Freight Cost Line");
                 * }
                 */
                HTMLScripts.OnFillInsertPOLineOrGLLineDialogEnd = function (dialog, radio) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnCommitInsertPOLineOrGLLineDialogDefault
                 * @since 347
                 * @description
                 * User exit called when a custom line type (not standard PO or Non-PO) is selected
                 * in the line type dialog. Use this to handle custom line type selections added
                 * via OnFillInsertPOLineOrGLLineDialogEnd.
                 * @param {string} newValue - The selected custom line type value (the translation key)
                 * @returns {void}
                 * @example <caption>Handle "Freight Cost" line type selection</caption>
                 * HTMLScripts.OnCommitInsertPOLineOrGLLineDialogDefault = function(newValue)
                 * {
                 *     if (newValue === "_Freight Cost Line")
                 *     {
                 *         InvoiceLineItem.AddGLLineItem(Controls.LineItems__);
                 *         var lastItem = Controls.LineItems__.GetItem(Controls.LineItems__.GetItemCount() - 1);
                 *         lastItem.SetValue("GLAccount__", "FREIGHT001");
                 *         lastItem.SetValue("Description__", "Freight Cost");
                 *     }
                 * }
                 */
                HTMLScripts.OnCommitInsertPOLineOrGLLineDialogDefault = function (newValue) {
                };
                /** @method Lib.AP.Customization.HTMLScripts.EnableExtendedWHTEventsForNonSAPIntegrations
                 * @since 349
                 * @description
                 * User exit called to determine if extended withholdings amount must be refreshed and validated for all ERPs just the way it is done for SAP integrations.
                 *
                 * @returns {boolean} returns true if extended WHT amount must be refreshed in generic integrations, false otherwise.
                 * @example <caption>returns true to enable extended WHT amount refresh in a generic integration</caption>
                 * HTMLScripts.EnableExtendedWHTEventsForNonSAPIntegrations : function()
                 * {
                 *     return true;
                 * }
                 */
                HTMLScripts.EnableExtendedWHTEventsForNonSAPIntegrations = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.RestrictAddingWorkflowToApproverOrControllerOnly
                 * @since 349
                 * @description
                 * User exit to restrict addition of workflow to controller or approver only.
                 * This affects both Controls.AddApprover button visibility and row menu behaviour.
                 * Return a workflow role constant to restrict the workflow, or undefined for default behavior.
                 * @returns {string | void}
                 *   - Return Lib.AP.WorkflowCtrl.roles.controller: Restrict to controller-only mode
                 *   - Return Lib.AP.WorkflowCtrl.roles.approver: Restrict to approver-only mode
                 *
                 * @example <caption>Restrict workflow addition to controller-only mode</caption>
                 * RestrictAddingWorkflowToApproverOrControllerOnly: function ()
                 * {
                 *     return Lib.AP.WorkflowCtrl.roles.controller;
                 * }
                 *
                 * @example <caption>Restrict workflow addition to approver-only mode</caption>
                 * RestrictAddingWorkflowToApproverOrControllerOnly: function ()
                 * {
                 *     return Lib.AP.WorkflowCtrl.roles.approver;
                 * }
                 */
                HTMLScripts.RestrictAddingWorkflowToApproverOrControllerOnly = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnInvestmentCheck
                 * @since 350
                 * @description
                 * Override the investment checkbox default behavior. Default behavior: checkbox is always unchecked.
                 *
                 * @returns {boolean | void}
                 * Return true to allow persistency. Return false / null / undefined to keep the default behavior.
                 *
                 * @example <caption>Allow persistency of investment checkbox state (checkbox in same state before and after save)</caption>
                 * HTMLScripts.OnInvestmentCheck = function()
                 * {
                 *     return true;
                 * }
                 */
                HTMLScripts.OnInvestmentCheck = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnBuildClearingQueryAttributes
                 * @since 359
                 * @description
                 * Called in the Vendor Invoice Clearing form while building the list of DBQuery
                 * attributes read from the ancestor settlement documents, before they are joined and queried.
                 * Mutate the array directly to add (or remove) attributes to retrieve.
                 * @param {string[]} attributes Attribute names array, modified in place.
                 * @returns {void}
                 * @example <caption>Also retrieve the payment terms from the settlement documents</caption>
                 * HTMLScripts.OnBuildClearingQueryAttributes = function (attributes)
                 * {
                 * 	attributes.push("PaymentTerms__");
                 * };
                 */
                HTMLScripts.OnBuildClearingQueryAttributes = function (attributes) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnBuildClearingQueryFilter
                 * @since 359
                 * @description
                 * Called in the Vendor Invoice Clearing form while building the LDAP filter of the
                 * DBQuery over the ancestor settlement documents, before the query is run. Mutate
                 * `queryFilter.value` to add an extra condition or replace the default filter.
                 * The wrapper object is used because strings are passed by value in JavaScript.
                 * @param {object} queryFilter Wrapper object; mutate `queryFilter.value` (string) in place.
                 * @returns {void}
                 * @example <caption>Restrict the clearing query to a given document type</caption>
                 * HTMLScripts.OnBuildClearingQueryFilter = function (queryFilter)
                 * {
                 * 	queryFilter.value = "&(" + queryFilter.value + ")(DocumentType__=ZCON)";
                 * };
                 */
                HTMLScripts.OnBuildClearingQueryFilter = function (queryFilter) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.OnFillClearingLineItem
                 * @since 359
                 * @description
                 * Called for each clearing line item in the Vendor Invoice Clearing form, after the
                 * standard fields have been set, so custom fields can be filled from the queried record.
                 * @param {Item} item The clearing line item being filled.
                 * @param {object} queryResult The DBQuery result over the ancestor settlement documents.
                 * @param {number} recordIndex Index of the current record in queryResult.
                 * @returns {void}
                 * @example <caption>Copy the settlement payment terms onto the clearing line</caption>
                 * HTMLScripts.OnFillClearingLineItem = function (item, queryResult, recordIndex)
                 * {
                 * 	item.SetValue("Z_PaymentTerms__", queryResult.GetQueryValue("PaymentTerms__", recordIndex));
                 * };
                 */
                HTMLScripts.OnFillClearingLineItem = function (item, queryResult, recordIndex) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShouldRetrieveTaxRateWithoutTaxComputation
                 * @since 362
                 * @description
                 * Decouples the tax rate retrieval from the automatic tax computation on the Vendor invoice form.
                 * By default the tax rate is only retrieved from the ERP when the automatic tax computation is
                 * enabled, and it is reset when the automatic tax computation is disabled.
                 * When this user exit returns true and the automatic tax computation is disabled:
                 * - the tax rate is still retrieved from the ERP for the line items having a tax code,
                 * - the tax rate already set on a line item is kept instead of being reset.
                 * The retrieved tax rate is still applied on the line item tax amount: use
                 * Lib.AP.Customization.HTMLScripts.ShouldSkipTaxAmountComputation to prevent it.
                 * @returns {boolean | void}
                 * Return true to retrieve and keep the tax rate without automatic tax computation.
                 * Return false / null / undefined to keep the default behavior.
                 * @example <caption>Always display the tax rate of the line items, even without automatic tax computation</caption>
                 * HTMLScripts.ShouldRetrieveTaxRateWithoutTaxComputation = function ()
                 * {
                 * 	return true;
                 * };
                 */
                HTMLScripts.ShouldRetrieveTaxRateWithoutTaxComputation = function () {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShouldSkipTaxRateUpdate
                 * @since 362
                 * @description
                 * Determines whether the tax rate and the tax amount of a line item should be left unchanged
                 * when the line items are updated with the tax rates retrieved from the ERP.
                 * By default every line item is updated.
                 * @param {Item} item The line item being updated.
                 * @returns {boolean | void}
                 * Return true to leave the line item unchanged. Return false / null / undefined to keep the default behavior.
                 * @example <caption>Keep the tax rate already set on a line item, typically when several purchase order lines are added at once</caption>
                 * HTMLScripts.ShouldSkipTaxRateUpdate = function (item)
                 * {
                 * 	return !item.IsNullOrEmpty("TaxRate__");
                 * };
                 */
                HTMLScripts.ShouldSkipTaxRateUpdate = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.ShouldSkipTaxAmountComputation
                 * @since 362
                 * @description
                 * Determines whether the tax amount of a line item must not be computed from the tax rate
                 * retrieved from the ERP. By default the tax amount is always computed and applied.
                 * @param {Item} item The line item on which the tax rate has just been set.
                 * @returns {boolean | void}
                 * Return true to leave the tax amount of the line item unchanged.
                 * Return false / null / undefined to keep the default behavior.
                 * @example <caption>Do not compute the tax amount when the automatic tax computation is disabled</caption>
                 * HTMLScripts.ShouldSkipTaxAmountComputation = function (item)
                 * {
                 * 	return !Controls.CalculateTax__.IsChecked();
                 * };
                 */
                HTMLScripts.ShouldSkipTaxAmountComputation = function (item) {
                };
                /**
                 * @method Lib.AP.Customization.HTMLScripts.CustomizeInitReasonsFromConfig
                 * @since 364
                 * @description
                 * Allows you to customize the list of reasons proposed for the reject, back to AP, set aside and hold actions,
                 * before it is applied to the corresponding field of the form.
                 * By default the reasons come from the AP configuration, except for the hold and reject reasons
                 * of the invoices received through a PDP, which come from the French B2B reasons.
                 * @param {string} reasons The standard reasons, as a list of "key=value" separated by line breaks.
                 * @param {string} paramListName The name of the AP configuration parameter holding the reasons:
                 * "RejectReasons", "BackToApReasons", "AsideReasons" or "HoldReasons".
                 * @param {string} paramDataName The name of the field holding the reason:
                 * "RejectReason__", "BackToAPReason__" or "AsideReason__".
                 * @returns {string | void}
                 * Return the reasons to use, as a list of "key=value" separated by line breaks.
                 * Return null / undefined to keep the default behavior.
                 * @example <caption>Add a custom reject reason</caption>
                 * HTMLScripts.CustomizeInitReasonsFromConfig = function (reasons, paramListName, paramDataName)
                 * {
                 * 	if (paramListName === "RejectReasons")
                 * 	{
                 * 		return reasons + "\nMyReason=My reason";
                 * 	}
                 * };
                 */
                HTMLScripts.CustomizeInitReasonsFromConfig = function (reasons, paramListName, paramDataName) {
                };
                /**
                 * @namespace Lib.AP.Customization.HTMLScripts.NewInvoiceSubmission
                 * @description User exits for the New invoice submission process
                 */
                let NewInvoiceSubmission;
                (function (NewInvoiceSubmission) {
                    /**
                     * @method Lib.AP.Customization.HTMLScripts.NewInvoiceSubmission.OnHTMLScriptEnd
                     * @since 361
                     * @description
                     * This user exit is called at the end of the HTML page script of the New invoice submission process.
                     * Allows you to customize layout settings of the New invoice submission process.
                     * @returns {void}
                     * @example <caption>Set a custom form width</caption>
                     * NewInvoiceSubmission.OnHTMLScriptEnd = function ()
                     * {
                     *     ProcessInstance.SetFormWidth(900);
                     * };
                     */
                    NewInvoiceSubmission.OnHTMLScriptEnd = function () {
                    };
                })(NewInvoiceSubmission = HTMLScripts.NewInvoiceSubmission || (HTMLScripts.NewInvoiceSubmission = {}));
            })(HTMLScripts = Customization.HTMLScripts || (Customization.HTMLScripts = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_HTMLSCRIPTS_SAMPLE.js.map