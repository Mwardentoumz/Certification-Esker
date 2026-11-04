"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_PR_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Purchase Requisition scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Purchase Requisition client script customization callbacks
 *
 * Timeline of user exit calls
 * ------------------
 * <img src="img/PAC/Lib_PR_Customization_Client_TimeLine.png">
 * @namespace Lib.PR.Customization.Client
 */
var Lib;
(function (Lib) {
    var PR;
    (function (PR) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.PR.Customization.Client.AfterSourcingDataParse
                 * @description This user exit is called from the HTML page script of the Purchase Requisition process, after input data coming from the sourcing application is parsed, and before it is loaded on the form.
                 * 	This user exit is typically used to add missing data coming from MarketDojo.
                 * @param {IData} data
                 * @since 275
                 * @example
                 * <pre><code>
                 * AfterSourcingDataParse: function (data)
                 * {
                 * 	if (!data.lineItems__)
                 * 	{
                 * 		return;
                 * 	}
                 *
                 * 	for (let item of data.lineItems__)
                 * 	{
                 * 	// set requested delivery date 10 days in the future if not present
                 * 	if (!item.ItemRequestedDeliveryDate__)
                 * 	{
                 * 		let date = new Date();
                 * 		date.setHours(0, 0, 0, 0);
                 * 		date.setDate(date.getDate() + 10);
                 *
                 * 		item.ItemRequestedDeliveryDate__ = Sys.Helpers.Date.Date2DBDate(date);
                 * 	}
                 *
                 * 	// set unspsc to "hardware" for ACME
                 * 	if (!item.unspsc)
                 * 	{
                 * 		if (item.VendorName__ == "ACME Supply Company")
                 * 		{
                 * 			item.unspsc = 43211500;
                 * 		}
                 * 	}
                 * }
                 * </code></pre>
                 */
                Client.AfterSourcingDataParse = function (data) {
                };
                /**
                 * @method Lib.PR.Customization.Client.OnLoad
                 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process, before loading the form and determining the workflow.
                 * 		This user exit is typically used to customize:
                 * 			Objects from the included script libraries.
                 * 			Objects from the HTML page script.
                 * @since 117
                 * @returns {void | Promise<any>}
                 * @example
                 * This user exit customizes the workflow determination. When the item category is Training, the user exit confers the Buyer (quotation) role to the following contributor: Sam CCOwner4.
                 * <pre><code>
                 * OnLoad: function ()
                 * {
                 *	 var wkfRoles = Lib.Purchasing.PR.Workflow.roles;
                 *	 wkfRoles.buyerQuote.OnBuild = Sys.Helpers.Wrap(wkfRoles.buyerQuote.OnBuild, function (originalFn, callback)
                 *	 {
                 *		 if (Data.GetValue("SupplyTypeName__") === "Training")
                 *		 {
                 *			 callback([
                 *			 {
                 *				 contributorId: "CCOwner4" + Lib.Purchasing.roleBuyerQuote,
                 *				 role: Lib.Purchasing.roleBuyerQuote,
                 *				 login: "ccowner4@example.com",
                 *				 email: "ccowner4@example.com",
                 *				 name: "Sam CCOwner4",
                 *				 action: Lib.Purchasing.PR.Workflow.actions.doQuote.GetName()
                 *			 }]);
                 *			 return true;
                 *		 }
                 *		 else
                 *		 {
                 *			 return originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                 *		 }
                 *	 });
                 * }
                 * </code></pre>
                 */
                Client.OnLoad = function () {
                };
                /**
                 * @method Lib.PR.Customization.Client.GetCompanyCodeChangeConfirmation
                 * @description Allows you to customize the confirmation popup displayed when the company code is changed in the Purchase Requisition process.
                 * 		The standard callbacks are provided in parameter so you can keep the standard behavior,
                 * 		add your own logic before or after it, or replace it completely.
                 * @since 352
                 * @param {Lib.PR.Customization.Client.CompanyCodeChangeConfirmationOptions} options The standard callbacks.
                 * @returns {Lib.PR.Customization.Client.CompanyCodeChangeConfirmationReturn | void} A custom popup configuration, or `void` to keep the standard behavior.
                 * @example
                 * <pre><code>
                 * GetCompanyCodeChangeConfirmation: function (options)
                 * {
                 * 	return {
                 * 		message: "_Please confirm the company code change.",
                 * 		title: "_Warning",
                 * 		onConfirm: async function ()
                 * 		{
                 *			 await MySuperCustomLogicBeforeStandardOnConfirm();
                 *
                 * 			 await options.standardOnConfirm()
                 *
                 *			 await MySuperCustomLogicAfterStandardOnConfirm();
            
                 * 		},
                 * 		onCancel: async function ()
                 * 		{
                 * 			 await MySuperCustomLogicBeforeStandardOnCancel();
                 *
                 * 			 await options.standardOnCancel()
                 *
                 *			 await MySuperCustomLogicAfterStandardOnCancel();
                 * 		}
                 * 	};
                 * }
                 * </code></pre>
                 */
                Client.GetCompanyCodeChangeConfirmation = function (options) {
                };
                /**
                 * @method Lib.PR.Customization.Client.CustomizeLayout
                 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process, after loading the form and determining the workflow.
                 *		This user exit is typically used to customize:
                 *		Objects from the included script libraries.
                 *		Objects from the HTML page script.
                 * @description CLIENT_WEB|CLIENT_MOBILE
                 * @since 125
                 * @example
                 * In this sample, some reviewers check the purchase requisitions before they are approved by approvers. They are grouped in a group. They are the only users to be able to modify the cost center (approvers cannot modify cost centers). Reviewers can only approve the purchase requisition and send the purchase requisition back to the requester. Reviewers are not allowed to choose the Sales cost center.
                 * The following user exits hide or shows the cost center depending on the user, sets the fields to read-only, disables buttons when necessary and displays an error message when the Sales cost center is selected.
                 * <pre><code>
                 *		 CustomizeLayout: function ()
                 *		 {
                 *			 // Variable initialized with the WorkflowController instance used in the HTML page script.
                 *			 var workflow = Lib.Purchasing.PR.Workflow.controller;
                 *
                 *			 // Retrieves the first workflow step that corresponds to the reviewer step.
                 *			 var controllerContributor = null;
                 *			 {
                 *				 var approvers = workflow.GetContributorsByRole("approver");
                 *				 if (approvers && approvers.length > 0)
                 *				 {
                 *					 controllerContributor = approvers[0];
                 *				 }
                 *			 }
                 *
                 *			 // True if the current user is a reviewer
                 *			 isReviewer = controllerContributor && User.IsMemberOf(controllerContributor.login);
                 *
                 *			 // Modifies the layout for owners only. The fields are read-only for non-owners
                 *			 // (managed by the framework and not by script).
                 *
                 *			 // Shows the cost center if the user is a reviewer, hides it otherwise.
                 *			 Sys.Helpers.Controls.HideForever(Controls.LineItems__.ItemCostCenterName__, !isReviewer);
                 *
                 *			 // Modifies the layout for reviewers.
                 *			 if (isReviewer)
                 *			 {
                 *				 // Reviewers can't modify the ship to phone number.
                 *				 Sys.Helpers.Controls.SetReadOnlyForever(Controls.ShipToPhone__, true);
                 *
                 *				 // Reviewers can only access the Approve and Back to requester buttons.
                 *				 Sys.Helpers.Controls.HideForever(Controls.Reject, true);
                 *				 Sys.Helpers.Controls.HideForever(Controls.Approve_Forward, true);
                 *				 Sys.Helpers.Controls.HideForever(Controls.Request_for_information, true);
                 *
                 *				 // Enables the workflow update. It has normally been disabled after the requester step.
                 *				 workflow.AllowRebuild(true);
                 *			 }
                 *		 }
                 * </code></pre>
                 */
                Client.CustomizeLayout = function () {
                };
                /**
                 * @method Lib.PR.Customization.Client.OnUpdateLayout
                 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process, when the form layout is updated upon user modifications.
                 *		This user exit is typically used to customize:
                 *		Objects from the included script libraries.
                 *		Objects from the HTML page script.
                 * 		Note:
                 * 			We recommend that you use the CustomizeLayout user exit instead of the OnUpdateLayout user exit when possible.
                 * @since 125
                 * @example
                 * In this sample, some reviewers check the purchase requisitions before they are approved by approvers. They are grouped in a group. They are the only users to be able to modify the cost center (approvers cannot modify cost centers). Reviewers can only approve the purchase requisition and send the purchase requisition back to the requester. Reviewers are not allowed to choose the Sales cost center.
                 * The following user exits hide or shows the cost center depending on the user, sets the fields to read-only, disables buttons when necessary and displays an error message when the Sales cost center is selected.
                 * <pre><code>
                 * 		OnUpdateLayout: (function ()
                 * 		{
                 *			var submitButtonDisabled = false;
                 *			var errorMsg = "Forbidden cost center";
                 *
                 *				return function ()
                 *				{
                 *					if (isReviewer)
                 *				{
                 *					// Searches for the cost center for each line item.
                 *					// If the cost center is "Sales" (1450), sets an error on the cost center field
                 *					// If there was an error but the cost center Sales has been removed, then removes the error.
                 *					var forbiddenCCDetected = false;
                 *					Lib.Purchasing.Items.ForEach("LineItems__", function(line)
                 *					{
                 *						var currentError = line.GetError("ItemCostCenterName__");
                 *						if (line.GetValue("ItemCostCenterID__") === "1450")
                 *						{
                 *							forbiddenCCDetected = true;
                 *							if (!currentError)
                 *							{
                 *								line.SetError("ItemCostCenterName__", errorMsg);
                 *							}
                 *						}
                 *						else if (currentError === errorMsg)
                 *						{
                 *							line.SetError("ItemCostCenterName__", "");
                 *						}
                 *					});
                 *
                 *					// If not already disabled, disables the submit button if at least one line item has the Sales cost center
                 *					if (forbiddenCCDetected && !submitButtonDisabled)
                 *					{
                 *						Lib.Purchasing.PR.ButtonsBar.SetButtonsDisabled(true, "Lib.PR.Customization.Client.OnUpdateLayout");
                 *					}
                 *					// If disabled, enables the submit button if none of the line items has the "Sales" cost center.
                 *					else if (!forbiddenCCDetected && submitButtonDisabled)
                 *					{
                 *						Lib.Purchasing.PR.ButtonsBar.SetButtonsDisabled(false, "Lib.PR.Customization.Client.OnUpdateLayout");
                 *					}
                 *				}
                 *			};
                 *		})()
                 * </code></pre>
                 */
                Client.OnUpdateLayout = function () {
                };
                /**
                 * @method Lib.PR.Customization.Client.OnFillFromCompanyCode
                 * @description Allows you to customize the Purchase Requisition process form. This user exit is called from the HTML page script of the Purchase Requisition process. Called after Shipto Information has been retreived
                 * @see {@link Lib.PR.Customization.Client.OnFillFromCompanyCode}
                 * @since 184
                */
                Client.OnFillFromCompanyCode = function () {
                };
                /**
                 * @method Lib.PR.Customization.Client.DialogAutoOrderCustomization
                 * @description Allows you to customize the dialog that is displayed at the submission of the purchase requisition when the requester is also the buyer:
                     * <img src="img/PAC/Lib_PR_Customization_Client_autoorder.png">
                 * @since 143
                 * @return {DialogAutoOrderCustomizationReturn} - The returned object
                 * @example
                 * In this example, you add a text field in the dialog to allow the buyer to type the vendor email address. First, define a process variable in the purchase requisition named z_VendorEmailAddress.
                 * <pre><code>
                   * DialogAutoOrderCustomization: function ()
                 * {
                 *	 return {
                 *		 FillAutoOrderPopup: function (dialog)
                 *		 {
                 *			dialog.AddText("ctrl_VendorEmailAddress", "Vendor email address");
                 *		 },
                 *		 CommitAutoOrderPopup: function (dialog, autoSendOrderParam)
                 *		 {
                 *		   if (autoSendOrderParam == "SendToVendor")
                 *		   {
                 *			 Variable.SetValueAsString("z_VendorEmailAddress", dialog.GetControl("ctrl_VendorEmailAddress").GetValue());
                 *		   }
                 *		 }
                 *	 };
                 * }
                 * </code></pre>
                 *
                 * Next, retrieve the email address in the Lib.PO.Customization.Server.CustomizeAutoSendOrderParam user exit:
                 * <pre><code>
                 * CustomizeAutoSendOrderParam: function (autoSendOrderParam)
                 * {
                 *	 autoSendOrderParam.VendorEmail: Variable.GetValueAsString("z_VendorEmailAddress");
                 * }
                 * </code></pre>
                 */
                Client.DialogAutoOrderCustomization = function () {
                    return {
                        /**
                         * @method Lib.PR.Customization.Client.DialogAutoOrderCustomization.FillAutoOrderPopup
                         * @description A function called as soon as the dialog has been instantiated. This function should create and initialize the controls to be displayed inside the dialog.
                         * @since 143
                         * @param {Dialog} dialog The Dialog object that was instantiated. Use this object to add controls to the dialog.
                         */
                        FillAutoOrderPopup: function (dialog) {
                        },
                        /**
                         * @method Lib.PR.Customization.Client.DialogAutoOrderCustomization.ValidateAutoOrderPopup
                         * @description A function that is called to validate the dialog content before processing the Commit action.
                         * 		This function is called before CommitAutoOrderPopup and allows you to validate user input and prevent dialog commit if validation fails.
                         * 		Use this function to check that all required fields have been filled correctly and display appropriate error messages.
                         * @since 346
                         * @param {Dialog} dialog The Dialog object that is being validated.
                         * @returns {boolean} Return true to allow the dialog to proceed with the Commit action, or false to prevent the dialog from closing and keep it open for user corrections.
                         */
                        ValidateAutoOrderPopup: function (dialog) {
                            return true;
                        },
                        /**
                         * @method Lib.PR.Customization.Client.DialogAutoOrderCustomization.CommitAutoOrderPopup
                         * @description A function that is called when the user clicks OK in the dialog.
                         * 		Use this function to update the parameters that should be transmitted to the purchase order.
                         * 		To keep the application upgradable, update some process variables instead of modifying the purchase requisition controls.
                         * @since 143
                         * @param {Dialog} dialog The Dialog object from which the OK button was clicked.
                         * @param {json} autoSendOrderParam
                         * @param {boolean} autoSendOrderParam.autoOrder
                         * @param {string} autoSendOrderParam.EmailNotificationOptions Possible values are:
                         * 		- SendToVendor
                         * 		- DontSend
                         */
                        CommitAutoOrderPopup: function (dialog, autoSendOrderParam) {
                        },
                        /**
                         * @method Lib.PR.Customization.Client.DialogAutoOrderCustomization.HandleAutoOrderPopup
                         * @description A function that is called to handle all the events that are not handled by default by the other callback functions.
                         * 		Use this function to handle the click or OnChange events, allowing you to interact with the dialog content as the user is entering data.
                         * @since 143
                         * @param {Dialog} dialog The Dialog object from which the OK button was clicked.
                         * @param {string} tabId is always null since the auto order popup dialog has no tabs (could change in the future)
                         * @param {string} event A string representing the event that lead to the execution of this callback.
                         * 		The possible events that can be received are all the events that are available on the controls contained in the dialog and the event related to the dialog object itself.
                         * 		For more information about available event names refer to [Handling events]{@link https://docptn.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#HTMLPageScript/Control/Control_Object_Event.html}.
                         * 		For example, if your dialog has a combo box defined in it, then, when the combo box value is changed by the user, this callback is triggered with the event parameter set to OnChange, as the combo box handles this event itself.
                         * @param {Control} control Control object from which the event originates. Typically, if the user selects a new value in a combo box control, this callback is called with the combo box control as a parameter.
                         * @param {Object} param1 If the original event callback function provides parameters, they are transmitted here.
                         * 		For example, an OnClick event triggered from a Table control has the following callback prototype:
                         *			Controls.Table_.OnClick = function (row) { }
                         *		When such an event is handled by a dialog, the row parameter is provided as the last argument of the HandleAutoOrderPopup function, that becomes:
                         *			function HandleAutoOrderPopup(dialog, event, control, row)
                         * @param {Object} param2 If the original event callback function provides parameters, they are transmitted here.
                         */
                        HandleAutoOrderPopup: function (dialog, tabId, event, control, param1, param2) {
                        },
                        /**
                         * @method Lib.PR.Customization.Client.DialogAutoOrderCustomization.CancelAutoOrderPopup
                         * @description A function that is called when the user clicks Cancel in the dialog. Use this function to rollback the modifications performed by the user in the dialog.
                         * @since 143
                         * @param {Dialog} dialog The Dialog object from which the Cancel button was clicked.
                         * @param {string} event A string representing the event that lead to the execution of this callback. Currently, it is always OnDialogCancel.
                         * @param {Control} control The Control object that triggered the event, that is the dialog itself.
                         */
                        CancelAutoOrderPopup: function (dialog, event, control) {
                        },
                        /**
                         * @method Lib.PR.Customization.Client.DialogAutoOrderCustomization.IsEligibleToAutoOrder
                         * @description A function that is called before the creation of the dialog. Use it to modify the display conditions of the dialog.
                         * @since 143
                         * @returns {boolean}
                         * 		- true (or false) to display (or not display) the dialog depending on the conditions defined in the function.
                         * 			For example, you can display the dialog only for a specific vendor.
                         * 		- null (Default) to display the dialog in the default conditions, that is, when:
                         * 			The requester is also the buyer.
                         * 			The vendor is identical for all the items.
                         */
                        IsEligibleToAutoOrder: function () {
                            return null;
                        }
                    };
                };
                /**
                 * @method Lib.PR.Customization.Client.GetPunchoutSites
                 * @description Allows you to customize the list of external catalogs available in the Purchase Requisition process.
                 * 		This user exit is called from the HTML Page script of the Purchase Requisition process, when loading the list of external catalogs.
                 * @since 149
                 * @param {Array<PunchoutSite>} punchoutSites JavaScript object specifying the email options
                 * @param {string} punchoutSites.ConfigurationName__	Name of the catalog configuration
                 * @param {string} punchoutSites.Currency__ Currency associated with the catalog.
                 * @param {string} punchoutSites.LogoURL__ URL of the catalog logo.
                 * @param {string} punchoutSites.PunchoutURL__ URL of the vendor catalog.
                 * @param {string} punchoutSites.SupplierID__ Identifier of the vendor.
                 * @param {string} punchoutSites.SupplyTypeID__ Identifier of the item category.
                 * @returns {json} JavaScript object specifying the customized list of external catalogs to display, in the same format as the punchoutSites parameter.
                 * @example
                 * <pre><code>
                 * GetPunchoutSites: function (punchoutSites)
                 * {
                 * 	var customPunchoutSites = [];
                 * 	punchoutSites.forEach(function(site)
                 * 	{
                 * 		if(User.fullName == "Eric Requester" && site.ConfigurationName__ == "AmazonUS")
                 * 		{
                 * 			customPunchoutSites.push(site);
                 * 		}
                 * 		else if(User.fullName == "Kate CCOwner2" && site.ConfigurationName__ == "Lyreco")
                 * 		{
                 * 			customPunchoutSites.push(site);
                 * 		}
                 * 		else if (User.fullName != "Kate CCOwner2" && User.fullName != "Eric Requester")
                 * 		{
                 * 			// All other users have access to all punchout sites
                 * 			customPunchoutSites.push(site);
                 * 		}
                 * 	});
                 *
                 * 	// If exists, order first Amazon punchout
                 * 	var amazonIdx = Sys.Helpers.Array.FindIndex(customPunchoutSites, function (v) { return v.ConfigurationName__.startsWith('Amazon'); });
                 * 	if (amazonIdx && amazonIdx >= 0)
                 * 	{
                 * 		var amazonItem = customPunchoutSites.splice(amazonIdx, 1)[0];
                 * 		customPunchoutSites.splice(0, 0, amazonItem);
                 * 	}
                 * 	return customPunchoutSites;
                 * }
                 * </code></pre>
                 */
                Client.GetPunchoutSites = function (punchoutSites) {
                    return punchoutSites;
                };
                /**
                 * @method Lib.PR.Customization.Client.OnPunchoutOpen
                 * @description Allows you to send additional fields in the PunchoutSetupRequest
                 * 		This user exit is called from the HTML Page script of the Purchase Requisition process, just before opening a punchout catalog
                 * @since 209
                 * @param {json} punchoutSite JavaScript object specifying the punchout site information (see {@link https://docptn.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#HTMLPageScript/Punchout/GetConfigs.html Punchout.GetConfigs})
                 * @returns {json} JavaScript object specifying the list of extrinsic variables to send into the PunchoutSetupRequest. Can also include the optional notSendUserAgent flag.
                 * @example
                 * <pre><code>
                 * OnPunchoutOpen: function (punchoutSite)
                 * {
                 *   if (punchoutSite.SupplierID__ == "AMAZON")
                 *   {
                 *     return {
                 *       "extrinsic": {
                 *         "UniqueName": User.loginId
                 *       },
                 *       "notSendUserAgent": true
                 *     }
                 *   }
                 * };
                 * </code></pre>
                 */
                Client.OnPunchoutOpen = function (punchoutSite) {
                };
                /**
                 * @method Lib.PR.Customization.Client.CustomizeTransparentPunchoutXml
                 * @description Allows to forbid punchout for the item selected from the catalog or to modify its generated cXML
                 * This function is called when an item eligible to transparent punchout has been selected in the catalog
                 * (i.e. with TransparentPunchout__ field checked in table Punchout Sites for the corresponding vendor).
                 *
                 * @param {*} cxmlItemInNode cXML root node for punchout ItemIn, to modify if needed
                 * @param {*} catalogData Data retrieved from catalog for the item
                 * @returns {boolean} Return false to disallow punchout for this item; otherwise, punchout is allowed
                 *
                 * @example
                 * <pre><code>
                 * CustomizeTransparentPunchoutXml: function (cxmlItemInNode, catalogData)
                 * {
                 * 	if (catalogData.GetValue("VENDORNUMBER__") === "AMAZON")
                 * 	{
                 * 		// For Amazon, let's add &lt;Extrinsic name="itemCondition"&gt;New&lt;/Extrinsic&gt;
                 *		var newNode = cxmlItemInNode.createElement('Extrinsic');
                 * 		newNode.setAttribute('name', 'itemCondition');
                 * 		newNode.textContent = 'New';
                 * 		cxmlItemInNode.getElementsByTagName("ItemDetail")[0].appendChild(newNode);
                 * 	}
                 * }
                 * </code></pre>
                 */
                Client.CustomizeTransparentPunchoutXml = function (cxmlItemInNode, catalogData) {
                };
                /**
                 * @method Lib.PR.Customization.Client.GetLineItemsImporterMapping
                 * @description Allows you to customize the mapping used when loading line items from the clipboard in the Purchase requisition process.
                 * This user exit is called from the HTML Page script of the Purchase requisition process, when clicking on Show preview in the Load line items from clipboard dialog.
                 * @return {LineItemsImporterMapping} mapping The mapping to use
                 * @example
                 * <pre><code>
                 * GetLineItemsImporterMapping: function()
                 * {
                 *	// Mapping example when pasting data like this
                 *	// name	description	quantity	req delivery date	 unit price	currency	item category
                 *	// laptop	laptop for developper	1	05.12.3000	1200	USD	Computers
                 *	// pen	1	blue pen	05.12.3000	10	USD	Other
                   *
                 *		return {
                 *			hasHeader: true,
                 *			separator: "\t",
                 *			columns: [
                 *				{ "header": "name", "lineItemsColumn": "ItemDescription__", "type": "Text" },
                 *				{ "header": "description", "noMapping":true},	// ignore this column
                 *				{ "header": "quantity", "lineItemsColumn": "ItemQuantity__", "type": "Decimal", "convert": function (v) { return parseFloat(v); } },
                 *				{ "header": "req delivery date", "lineItemsColumn": "ItemRequestedDeliveryDate__", "type": "Text" },
                 *				{ "header": "unit price", "lineItemsColumn": "ItemUnitPrice__", "type": "Text" },
                 *				{ "header": "currency", "lineItemsColumn": "ItemCurrency__", "type": "Text" },
                 *				{ "header": "item category", "lineItemsColumn": "SupplyTypeName__", "type": "Text" }
                 *			]
                 *		};
                 * }
                 * </code></pre>
                 */
                Client.GetLineItemsImporterMapping = function () {
                };
                /**
                 * @method Lib.PR.Customization.Client.UpdateLineItemCopyFromClipboard
                 * @description Allows you to add event used when loading line items from the clipboard in the Purchase requisition process.
                 * This user exit is called when event to fill line items are trigger
                 * @param {Item} lineItem item in the lineItems__ table
                 * @param {number} index index of the lineItem added
                 * @param {Object} rawData the rawData of the clipboard
                 */
                Client.UpdateLineItemCopyFromClipboard = function (lineItem, index, rawData) {
                };
                /**
                 * @method Lib.PR.Customization.Client.OnLoadFromClipboardEnd
                 * @description Allows you to add event and customization once all the lines are filled, queries are finished and check has been done
                 */
                Client.OnLoadFromClipboardEnd = function () {
                };
                /**
                 * @method Lib.PR.Customization.Client.OnRefreshLineItemsRowEnd
                 * @description Allows you to add event used when a line item is refresh.
                 * You can use it to set a field as read-only, hidden or required. You can also update a field (custom dimension) from a value of another field.
                 * This user exit after the rest of the line item is refreshed.
                 * Note that line items that were deleted can still get called within this UE. You must check with condition in your code to prevent any script error.
                 * @param {number} index index of the line item that is refreshed.
                 * @example
                 * <pre><code>
                 * OnRefreshLineItemsRowEnd: function (index)
                 * 	const row = Controls.LineItems__.GetRow(index);
                 *	const itemType = row.ItemType__.GetValue();
                 *	row.FreeDimension1__.Hide((!row.IsExtended__.GetValue() || itemType == Lib.P2P.ItemType.AMOUNT_BASED);
                 *
                 *  if (row.Z_CustomField__.GetValue())
                 *  {
                 * 		row.Z_AnotherCustomField__.SetValue("checked");
                 *  }
                 * }
                 * </code></pre>
                 */
                Client.OnRefreshLineItemsRowEnd = function (index) {
                };
                /**
                 * @method Lib.PR.Customization.Client.CustomizeOutlierCheckTriggeringFields
                 * @description Allows you to customize the fields that trigger the outlier check.
                 * Warning: this user exit is experimental and may be subject to change in future versions.
                 * @param {string[]} triggeringFields
                 * @return {Sys.Helpers.LdapUtil.IFilter|string|void} A customized filter for querying the dataset used to calculate outlier values
                 * @example
                 * <pre><code>
                 * </code></pre>
                 */
                Client.CustomizeOutlierCheckTriggeringFields = function (triggeringFields) {
                };
                /**
                 * @method Lib.PR.Customization.Client.AdjustHtmlTemplate
                 * @description Allows you to customize the HTML templates for the lines of the Purchase Requisition process.
                 * @param {string} html The standard HTML template for the line.
                 * @param {string} section The section of the line. Possible values are found in Lib.Purchasing.PR.HtmlHeaders.TemplateTypes
                 * @param {number} index The index of the line.
                 * @returns {string} The string representation of the HTML template to be used for the line.
                 * @example
                 * <pre><code>
                 * AdjustHtmlTemplate: function (html, section, index)
                 * {
                 * 	const templateTypes = Lib.Purchasing.PR.HtmlHeaders.TemplateTypes;
                 *	function Encode(text: string): string
                 *	{
                 *		return text?.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                 *	}
                 *	const item = Data.GetTable("LineItems__").GetItem(index);
                 *	const itemDescription = Encode(item?.GetValue("ItemDescription__"));
                 *	const supplierPartID = Encode(item?.GetValue("SupplierPartID__"));
                 *	const displayedDescription = itemDescription ? itemDescription : Language.Translate("_ItemDescriptionPlaceholder");
                 *	const ItemRequestedDeliveryDate = Language.FormatDate(item?.GetValue("ItemRequestedDeliveryDate__"));
                 *	const ItemStartDate = Language.FormatDate(item?.GetValue("ItemStartDate__"));
                 *	const ItemEndDate = Language.FormatDate(item?.GetValue("ItemEndDate__"));
                 *	const placeholderDate = Language.FormatDate(new Date(Date.now())).replace(/[0-9]/g, "-");
                 *  let dateToDisplay = `${ItemRequestedDeliveryDate || placeholderDate}`;
                 *
                 *	let textColor;
                 *
                 *	switch (section)
                 *	{
                 *		case templateTypes.ItemDetail:
                 *
                 *			textColor = itemDescription ? "" : "text-color-color4";
                 *			return `<div style="padding-left: 7px; display: grid">
                 *					<div
                 *						class="text-size-L bold ${textColor}"
                 *						style="
                 *							overflow: hidden;
                 *							text-overflow: ellipsis;
                 *							white-space: pre-wrap;
                 *							display: -webkit-box;
                 *							-webkit-line-clamp: 1;
                 *							-webkit-box-orient: vertical;"
                 *						title="${displayedDescription}"
                 *					>${displayedDescription}</div>
                 *					${supplierPartID ? `<div>${supplierPartID}</div>` : ""}
                 *				</div>`;
                 *		case templateTypes.ReceiptDetails:
                 *			textColor = ItemRequestedDeliveryDate ? "" : "text-color-color4";
                 *			if (Lib.Purchasing.Items.IsServiceBasedItem(item))
                 *			{
                 *				dateToDisplay = `${ItemStartDate || placeholderDate}&nbsp;-&nbsp;${ItemEndDate || placeholderDate}`;
                 *				textColor = ItemStartDate || ItemEndDate ? "" : "text-color-color4";
                 *			}
                 *			return `<div style="padding-left: 7px; display: grid">
                 *						<div style="display: flex;align-items: center;">
                 *							<i class="fa esk-ifont-delivery-date text-color-color1" style="display: inline-flex; font-size: 1.4rem; margin-right: 4px;"></i>
                 *							<span class="text-size-L bold ${textColor}">${dateToDisplay}</span>
                 *						</div>
                 *					</div>`;
                 *		case templateTypes.Amounts:
                 *		case templateTypes.Status:
                 *		case templateTypes.Budget:
                 *		default:
                 *			return "";
                 *	}
                 * }
                 * </code></pre>
                */
                Client.AdjustHtmlTemplate = function (html, section, index) {
                };
                /**
                 * @method Lib.PR.Customization.Client.GetFallbackUnitOfMeasure
                 * @description
                 * Provides a fallback unit of measure when the initially provided unit is not found in the database (unsupported unit).
                 * If this user exit is not implemented or returns nothing, the initial unit is kept and an error appears on the unit field.
                 *
                 * @since 331
                 * @param {string} unit - The initial unit of measure that was not found.
                 * @param {Item} item - The item for which the unit of measure should be determined.
                 * @returns {string | void} A string representing the fallback unit of measure to use, or nothing to keep the initial unit and trigger an error on the field.
                 *
                 * @example
                 * // Use "EA" as the fallback unit if "PCS" is not supported
                 * GetFallbackUnitOfMeasure: function(unit, item) {
                 *   if (unit === "PCS") {
                 *     return "EA";
                 *   }
                 * }
                 */
                Client.GetFallbackUnitOfMeasure = function (unit, item) {
                };
                /**
                 * @method Lib.PR.Customization.Client.GetRoleOnAddContributor
                 * @description
                 * Get the role to assign to a new contributor based on the current workflow state.
                 * @since 337
                 * @param nextRole The role that is being added.
                 * @returns {string | void} The role to assign to the new contributor. If nothing is returned, the original role is kept.
                 * @example
                 * <pre><code>
                 * GetRoleOnAddContributor: function (nextRole)
                 * {
                 *   if (nextRole === Lib.Purchasing.roleApprover)
                 *   {
                 *     return Lib.Purchasing.roleReviewer;
                 *   }
                 * }
                 * </code></pre>
                 */
                Client.GetRoleOnAddContributor = function (nextRole) {
                };
                /**
                 * @method Lib.PR.Customization.Client.OnComputeAmountsEnd
                 * @description
                 * Allows you to execute custom logic after the amounts are computed for the Purchase Requisition.
                 * This user exit is called at the end of the DelayComputeAmounts method, after the total amounts have been filled
                 * and after the workflow has been rebuilt if necessary.
                 *
                 * This user exit is typically used to:
                 * - Add custom calculations based on the computed amounts
                 * - Update custom fields that depend on the total amounts
                 * - Trigger additional validations or business rules after amount computation
                 *
                 * @since 346
                 * @returns {void}
                 * @example
                 * <caption>This user exit updates a custom discount field based on the total amount of the purchase requisition.
                 * If the total amount exceeds $10,000, a 5% discount is applied.</caption>
                 * OnComputeAmountsEnd: function ()
                 * {
                 *   const totalAmount = Data.GetValue("RequisitionTotalAmount__") || 0;
                 *   const customDiscountThreshold = 10000;
                 *   const discountRate = 0.05;
                 *
                 *   if (totalAmount > customDiscountThreshold)
                 *   {
                 *     const discountAmount = totalAmount * discountRate;
                 *     Variable.SetValueAsString("CustomDiscount__", discountAmount.toFixed(2));
                 *     Log.Info("Applied 5% discount: $" + discountAmount.toFixed(2));
                 *   }
                 *   else
                 *   {
                 *     Variable.SetValueAsString("CustomDiscount__", "0");
                 *   }
                 * }
                 */
                Client.OnComputeAmountsEnd = function () {
                };
                /**
                 * @method Lib.PR.Customization.Client.OnHTMLScriptEnd
                 * @summary CLIENT_WEB
                 * @since 357
                 * @description
                 * This user exit is called at the end of the HTML page script of the Purchase Requisition process.
                 * Allows you to customize layout settings of the Purchase Requisition process.
                 * If you need to customize callback functions associated with control events, refer to HTML page script API: Control events.
                 * @example
                 * <pre><code>
                 * OnHTMLScriptEnd: function ()
                 * {
                 * }
                 * </code></pre>
                 */
                Client.OnHTMLScriptEnd = function () {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = PR.Customization || (PR.Customization = {}));
    })(PR = Lib.PR || (Lib.PR = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_PR_CUSTOMIZATION_CLIENT_SAMPLE.js.map