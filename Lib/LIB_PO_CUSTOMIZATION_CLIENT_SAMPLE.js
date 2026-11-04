"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_PO_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Purchase order scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Purchase Requisition client script customization callbacks
 * @namespace Lib.PO.Customization.Client
 */
var Lib;
(function (Lib) {
    var PO;
    (function (PO) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                * @method Lib.PO.Customization.Client.OnLoad
                * @description
                * This function will be called at the purchase order loading; just before calling the Start function.
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
                /**
                * @method Lib.PO.Customization.Client.CustomizeLayout
                * @description Allows you to customize the Purchase Order process form. This user exit is called from the HTML page script of the Purchase Order process, after loading the form.
                * 		This user exit is typically used to customize:
                * 			Objects from the included script libraries.
                * 			Objects from the HTML page script.
                * @since 127
                * @example Exemple 1:
                * The following user exit hides the z_ProjectCode__ field.
                *
                    CustomiseLayout: function ()
                    {
                        Controls.LineItems__.z_ProjectCode__.Hide(true);
                        Controls.LineItems__.z_ProjectCode__.SetReadOnly(true);
                    }
                *
                * @example Example 2:
                * When editing a purchase order, only the Req delivery date fields of the Items table can be modified. The following user exit allows you to make the Expense category ID fields editable.
                *
                    if (ProcessInstance.isEditing)
                    {
                        var table = Controls.LineItems__;
                        table.ItemGroup__.Hide(false);
            
                        var lineItemsCount = Math.min(table.GetItemCount(), table.GetLineCount());
                        for (var i = lineItemsCount - 1; i >= 0; i--)
                        {
                            var row = table.GetRow(i);
                            if (!row.ItemDeliveryComplete__.IsChecked())
                            {
                                row.ItemGroup__.SetReadOnly(false);
                            }
                        };
            
                        Lib.Purchasing.PO.Edition.ChangesManager.Watch("ItemGroup__", "LineItems__");
                    }
                *
                * If the Items table contains several pages, only the controls in the visible page are editable. When navigating to a new page of the table, the controls should be made editable when they are displayed. To do so, implement the OnRefreshRow event:
                *
                    Controls.LineItems__.OnRefreshRow = Sys.Helpers.Wrap(Controls.LineItems__.OnRefreshRow, function (originalFn, index)
                    {
                        originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
            
                        if (Data.GetValue("OrderStatus__") === "To receive" && ProcessInstance.isEditing)
                        {
                            var row = Controls.LineItems__.GetRow(index);
                            row.ItemGroup__.SetReadOnly(row.ItemDeliveryComplete__.IsChecked());
                        }
                    }
                */
                Client.CustomizeLayout = function () {
                    /*
                    var changeDescription = false;	// For change Description
                    var changeGlAccount = false;	// For change GlAccount
            
                    var status = Data.GetValue("OrderStatus__");
                    if (status === "To receive" && ProcessInstance.isEditing && (changeDescription || changeGlAccount))
                    {
                        var table = Controls.LineItems__;
                        var lineItemsCount = Math.min(table.GetItemCount(), table.GetLineCount());
                        for (var i = lineItemsCount - 1; i >= 0; i--)
                        {
                            var row = table.GetRow(i);
                            if (changeDescription)
                            {
                                row.ItemDescription__.SetReadOnly(false);
                            }
                            if (changeGlAccount && row.ItemUndeliveredQuantity__.GetValue() == row.ItemQuantity__.GetValue())
                            {
                                // GlAccount changeable only for items without delivery started
                                row.ItemGLAccount__.SetReadOnly(false);
                            }
                        }
                        if (changeGlAccount)
                        {
                            table.ItemGLAccount__.Hide(false);
                        }
                        var nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                        if (!nextAlert || !nextAlert.isError)
                        {
                            if (changeDescription)
                            {
                                Lib.Purchasing.PO.Edition.ChangesManager.Watch("ItemDescription__", "LineItems__");
                            }
                            if (changeGlAccount)
                            {
                                Lib.Purchasing.PO.Edition.ChangesManager.Watch("ItemGLAccount__", "LineItems__");
                                Lib.Purchasing.PO.Edition.ChangesManager.Watch("ItemGroup__", "LineItems__");
                            }
                        }
                    }
                    */
                };
                /**
                * @method Lib.PO.Customization.Client.CustomizeRelatedDetailedInvoicesQuery
                * @description Allows you to customize the Invoice line items table (RelatedInvoicesDetailedTable__) in the Purchase Order. This user exit is called from the Lib_Purchasing_RelatedVIP_Client of the Purchase Order view.
                * 		This user exit is typically used to :
                * 			- Add or remove columns from the related invoices detailed table
                * 			- Modify the filter of the query so that only invoices with a specific status are displayed
                * CLIENT_WEB
                * @since 270
                * @returns {null|Sys.Helpers.IQueryIteratorClient} returns null by default or a promise representing the customized query to get the records of the table (instance of IQueryIteratorClient).
                *
                * @example Example 1: The following user exit adds the Line_TaxRate__ column to the table.
                *
                * 		CustomizeRelatedDetailedInvoicesQuery: function ()
                * 		{
                * 			// Parameters of the query
                * 			const queryParams = new Sys.Helpers.QueryParamsClient();
                * 			queryParams.table = "CDLNAME#Vendor invoice.LineItems__";
                * 			queryParams.filter = Sys.Helpers.LdapUtil.FilterAnd(
                * 				Sys.Helpers.LdapUtil.FilterEqual("Line_OrderNumber__", Data.GetValue("OrderNumber__")),
                * 				Sys.Helpers.LdapUtil.FilterExist("VerificationDate__"),
                * 				Sys.Helpers.LdapUtil.FilterNotEqual("VerificationDate__", ""),
                * 				Sys.Helpers.LdapUtil.FilterIn("InvoiceStatus__", [
                * 					Lib.AP.InvoiceStatus.Received,
                * 					Lib.AP.InvoiceStatus.ToVerify,
                * 					Lib.AP.InvoiceStatus.ToApprove,
                * 					Lib.AP.InvoiceStatus.OnHold,
                * 					Lib.AP.InvoiceStatus.SetAside,
                * 					Lib.AP.InvoiceStatus.ToPost,
                * 					Lib.AP.InvoiceStatus.ToPay // Pending payment
                * 				])
                * 			).toString();
                * 			queryParams.attributes = ["InvoiceNumber__", "Line_ItemType__", "InvoiceDate__", "Line_PartNumber__", "Line_Description__", "Line_Quantity__", "Line_Amount__", "Line_TaxAmount__", "InvoiceStatus__", "ValidationURL", "LineID", "OwnerId", "Line_TaxRate__"];
                *
                * 			// Please note that the name of the column you add must match the name of the attribute in the CDL
                * 			// Here, name of the attribute = "Line_TaxRate__", name of the column must be "Line_TaxRate__"
                *
                * 			// Function must return an instance of IQueryIteratorClient
                * 			return new Sys.Helpers.BigQueryIteratorClient(queryParams, null, "LineID");
                * 		}
                *
                * @example Example 2: The following user exit displays invoices regardless of their status
                *
                * 		CustomizeRelatedDetailedInvoicesQuery: function ()
                * 		{
                * 			// Parameters of the query
                * 			const queryParams = new Sys.Helpers.QueryParamsClient();
                * 			queryParams.table = "CDLNAME#Vendor invoice.LineItems__";
                * 			queryParams.filter = Sys.Helpers.LdapUtil.FilterAnd(
                * 				Sys.Helpers.LdapUtil.FilterEqual("Line_OrderNumber__", Data.GetValue("OrderNumber__")),
                * 				Sys.Helpers.LdapUtil.FilterExist("VerificationDate__"),
                * 				Sys.Helpers.LdapUtil.FilterNotEqual("VerificationDate__", "")
                * 			).toString();
                * 			queryParams.attributes = ["InvoiceNumber__", "Line_ItemType__", "InvoiceDate__", "Line_PartNumber__", "Line_Description__", "Line_Quantity__", "Line_Amount__", "Line_TaxAmount__", "InvoiceStatus__", "ValidationURL", "LineID", "OwnerId"];
                *
                * 			// Function must return an instance of IQueryIteratorClient
                * 			return new Sys.Helpers.BigQueryIteratorClient(queryParams, null, "LineID");
                * 		}
                */
                Client.CustomizeRelatedDetailedInvoicesQuery = function () {
                };
                /**
                * @method Lib.PO.Customization.Client.CustomizeRelatedDetailedGoodsReceiptQuery
                * @description Allows you to customize the Goods receipt line items table (RelatedGoodsReceiptDetailedTable__) in the Purchase Order. This user exit is called from the Lib_Purchasing_ReceivingHistory_Client of the Purchase Order view.
                * 		This user exit is typically used to :
                * 			- Add or remove columns from the related goods receipt detailed table
                * CLIENT_WEB
                * @since 285
                * @param {boolean} isInternal specify if the query must be on the CDLNAME#Goods receipt V2.LineItems__ or in the CDLNAME#Inventory Pickup__.LineItems__. If it's true, all the item in the PO is from a warehouse. In that case that is a internal order
                * @returns {null|Sys.Helpers.IQueryIteratorClient} returns null by default or a promise representing the customized query to get the records of the table (instance of IQueryIteratorClient).
                *
                * @example Example 1: The following user exit adds the Line_LineNumber__ column to the table.
                *
                    CustomizeRelatedDetailedGoodsReceiptQuery: function (isInternal)
                    {
                        const queryParams = new Sys.Helpers.QueryParamsClient();
                        // Parameters of the query
                        queryParams.table = "CDLNAME#Goods receipt V2.LineItems__";
                        queryParams.filter = Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__")).toString();
                        queryParams.attributes = [
                            "LineID",
                            "OwnerId",
                            "GRNumber__",
                            "GRStatus__",
                            "DeliveryDate__",
                            "GoodsReceiptDate__",
                            "DeliveryNote__",
                            "ValidationUrl",
                            "Line_ItemType__",
                            "Line_Description__",
                            "Line_NetAmount__",
                            "Line_ReceivedQuantity__",
                            "Line_SupplierPartID__"
                        ];
                        // Please note that the name of the column you add must match the name of the attribute in the CDL
                        // Here, name of the attribute = "Line_LineNumber__", name of the column must be "Line_LineNumber__"
                        // Function must return an instance of IQueryIteratorClient
                        return new Sys.Helpers.BigQueryIteratorClient(queryParams, null, "LineID");
                    }
                        *
                * @example Example 2: Modify query filter on both query.
                *
                    CustomizeRelatedDetailedGoodsReceiptQuery: function (isInternal)
                    {
                        const queryParams = new Sys.Helpers.QueryParamsClient();
                        // Parameters of the query
                        if (isInternal)
                        {
                            queryParams.table = "CDLNAME#Inventory Pickup__.LineItems__";
                            queryParams.filter = Sys.Helpers.LdapUtil.FilterAnd(
                                Sys.Helpers.LdapUtil.FilterEqual("Line_OrderNumber__", Data.GetValue("OrderNumber__"),
                                Sys.Helpers.LdapUtil.FilterNotEqual("PickupStatus__", "Canceled"
                            )).toString();
                            queryParams.attributes = [
                                "LineID",
                                "OwnerId",
                                "PickupNumber__",
                                "PickupStatus__",
                                "PickupDate__",
                                "ValidationUrl",
                                "Line_ItemType__",
                                "Line_Number__",
                                "Line_Description__",
                                "Line_NetAmount__",
                                "Line_PickedUpQuantity__"
                            ];
                        }
                        else
                        {
                            queryParams.table = "CDLNAME#Goods receipt V2.LineItems__";
                            queryParams.filter = Sys.Helpers.LdapUtil.FilterAnd(
                                Sys.Helpers.LdapUtil.FilterEqual("Line_OrderNumber__", Data.GetValue("OrderNumber__"),
                                Sys.Helpers.LdapUtil.FilterNotEqual("GRStatus__", "Canceled"
                            )).toString();
                            queryParams.attributes = [
                                "LineID",
                                "OwnerId",
                                "GRNumber__",
                                "GRStatus__",
                                "DeliveryDate__",
                                "GoodsReceiptDate__",
                                "DeliveryNote__",
                                "ValidationUrl",
                                "Line_ItemType__",
                                "Line_Description__",
                                "Line_NetAmount__",
                                "Line_ReceivedQuantity__",
                                "Line_SupplierPartID__"
                            ];
                        }
                        // Please note that the name of the column you add must match the name of the attribute in the CDL
                        // Here, name of the attribute = "Line_LineNumber__", name of the column must be "Line_LineNumber__"
                        // Function must return an instance of IQueryIteratorClient
                        return new Sys.Helpers.BigQueryIteratorClient(queryParams, null, "LineID");
                    }
                */
                Client.CustomizeRelatedDetailedGoodsReceiptQuery = function (isInternal) {
                };
                /**
                 * @method Lib.PO.Customization.Client.OnVendorSelected
                 * @description This function is called when a vendor is selected in the vendor selection dialog.
                 * You can use this function to perform additional actions based on the selected vendor.
                 * @since 331
                 * @param vendorItem {Typing.table_AP___Vendors.SelectedItem} The selected vendor item.
                 * @returns {void|Promise<void>} Returns nothing or a promise that resolves when the function completes.
                 *
                 * @example
                 * <pre><code>
                 * OnVendorSelected: function (vendorItem)
                 * {
                 * 		if (vendorItem)
                 *		{
                 *			const poCulture = vendorItem.GetValue("Z_POCulture__") || DeduceCultureFromCountry(vendorItem.GetValue("Country__")) || "en-US";
                 *			Data.SetValue("Z_POCulture__", poCulture);
                 *		}
                 * }
                 * </code></pre>
                 */
                Client.OnVendorSelected = function (vendorItem) {
                };
                /**
                 * @method Lib.PO.Customization.Client.OnBeforeFillNewVendorRequestDialog
                 * @param {Dialog} dialog - The dialog object to be customized before filling
                 * @since 344
                 * @description You can use this function to modify the dialog before it is filled by the R&D function.
                 * @returns {Promise<any>} A promise that resolves when the function completes.
                 * @example
                 * <pre><code>
                 * OnBeforeFillNewVendorRequestDialog: async function (dialog)
                 * {
                 * 		// Custom code before filling the dialog
                 * 		dialog.AddText("Z_OnBefore_CustomText__", "Label_OnBefore_CustomText__");
                 * }
                 * </code></pre>
                 */
                Client.OnBeforeFillNewVendorRequestDialog = async function (dialog) {
                };
                /**
                 * @method Lib.PO.Customization.Client.OnAfterFillNewVendorRequestDialog
                 * @param {Dialog} dialog - The dialog object to be customized after filling
                 * @since 344
                 * @description You can use this function to modify the dialog after it is filled by the R&D function.
                 * @returns {Promise<any>} A promise that resolves when the function completes.
                 * @example
                 * <pre><code>
                 * OnAfterFillNewVendorRequestDialog: async function (dialog)
                 * {
                 * 		// Custom code after filling the dialog
                 * 		dialog.AddText("Z_OnAfter_CustomText__", "This is a custom text added after filling the dialog.");
                 * }
                 * </code></pre>
                 */
                Client.OnAfterFillNewVendorRequestDialog = async function (dialog) {
                };
                /**
                 * @method Lib.PO.Customization.Client.OnCommitNewVendorRequestDialog
                 * @param {Dialog} dialog - The dialog object to be customized on commit
                 * @since 344
                 * @description You can use this function to do something on commit of the dialog.
                 * @returns {Promise<any>} A promise that resolves when the function completes.
                 * @example
                 * <pre><code>
                 * OnCommitNewVendorRequestDialog: async function (dialog)
                 * {
                 * 		// Custom code on commit of the dialog
                 * 		dialog.GetControl("Z_OnBefore_CustomText__").GetValue();
                 *		dialog.GetControl("Z_OnAfter_CustomText__").GetValue();
                 * }
                 * </code></pre>
                 */
                Client.OnCommitNewVendorRequestDialog = async function (dialog) {
                };
                /**
                 * @method Lib.PO.Customization.Client.GetPORegenerationPopupDefaults
                 * @description A function called before the dialog is filled to allow overriding the default values for SendOptions, defaultSendOption, and defaultVendorEmail.
                 * @since 345
                 * @param {PORegenerationPopupDefaults} currentDefaults The current default values computed by the system. Use this to inspect or extend the defaults.
                 * @returns {PORegenerationPopupDefaults} An object containing the overridden default values. Only include properties you want to override.
                 * @example
                 * <pre><code>
                 * GetPORegenerationPopupDefaults: function (currentDefaults)
                 * {
                 *     // Add a fax option to the existing send options
                 *     currentDefaults.SendOptions.push("POEdit_Fax=_POEdit_Fax");
                 *     currentDefaults.defaultSendOption = "POEdit_DoNotSend";
                 *     return currentDefaults;
                 * }
                 * </code></pre>
                 */
                Client.GetPORegenerationPopupDefaults = function (currentDefaults) {
                    return null;
                };
                /**
                 * @method Lib.PO.Customization.Client.BeforeFillPORegenerationPopup
                 * @description A function called before the default dialog content is added. Use this to add custom controls that should appear before the standard controls.
                 * @since 345
                 * @param {Dialog} dialog The Dialog object that was instantiated. Use this object to add controls to the dialog.
                 * @example
                 * <pre><code>
                 * BeforeFillPORegenerationPopup: function (dialog)
                 * {
                 *     dialog.AddDescription("customHeader", null, 466).SetText("Important: Please review before regenerating");
                 * }
                 * </code></pre>
                 */
                Client.BeforeFillPORegenerationPopup = function (dialog) {
                };
                /**
                 * @method Lib.PO.Customization.Client.AfterFillPORegenerationPopup
                 * @description A function called after the default dialog content is added. Use this to add custom controls that should appear after the standard controls.
                 * @since 345
                 * @param {Dialog} dialog The Dialog object that was instantiated. Use this object to add controls to the dialog.
                 * @example
                 * <pre><code>
                 * AfterFillPORegenerationPopup: function (dialog)
                 * {
                 *     dialog.AddCheckBox("ctrl_FollowUpRequired", "Follow-up call required");
                 * }
                 * </code></pre>
                 */
                Client.AfterFillPORegenerationPopup = function (dialog) {
                };
                /**
                 * @method Lib.PO.Customization.Client.CommitPORegenerationPopup
                 * @description A function that is called when the user clicks the Regenerate PO button in the dialog.
                 * 		Use this function to update the parameters or process variables based on custom fields.
                 * 		To keep the application upgradable, update process variables instead of modifying the purchase order controls directly.
                 * @since 345
                 * @param {Dialog} dialog The Dialog object from which the Regenerate PO button was clicked.
                 * @example
                 * <pre><code>
                 * CommitPORegenerationPopup: function (dialog)
                 * {
                 *     Variable.SetValueAsString("z_FollowUpRequired", dialog.GetControl("ctrl_FollowUpRequired").GetValue() ? "1" : "0");
                 * }
                 * </code></pre>
                 */
                Client.CommitPORegenerationPopup = function (dialog) {
                };
                /**
                 * @method Lib.PO.Customization.Client.HandlePORegenerationPopup
                 * @description A function that is called to handle all the events that are not handled by default by the other callback functions.
                 * 		Use this function to handle the click or OnChange events, allowing you to interact with the dialog content as the user is entering data.
                 * @since 345
                 * @param {Dialog} dialog The Dialog object from which the event originates.
                 * @param {string} tabId is always null since the PO regeneration popup dialog has no tabs (could change in the future)
                 * @param {string} event A string representing the event that lead to the execution of this callback.
                 * 		The possible events that can be received are all the events that are available on the controls contained in the dialog and the event related to the dialog object itself.
                 * 		For example, if your dialog has a combo box defined in it, then, when the combo box value is changed by the user, this callback is triggered with the event parameter set to OnChange.
                 * @param {Control} control Control object from which the event originates.
                 * @param {Object} param1 If the original event callback function provides parameters, they are transmitted here.
                 * @param {Object} param2 If the original event callback function provides parameters, they are transmitted here.
                 * @example
                 * <pre><code>
                 * HandlePORegenerationPopup: function (dialog, tabId, event, control, param1, param2)
                 * {
                 *     if (event === "OnChange" && control.GetName() === "ctrl_CustomCombo")
                 *     {
                 *         dialog.GetControl("ctrl_DependentField").SetValue(control.GetValue() === "Option1" ? "Default1" : "Default2");
                 *     }
                 * }
                 * </code></pre>
                 */
                Client.HandlePORegenerationPopup = function (dialog, tabId, event, control, param1, param2) {
                };
                /**
                 * @method Lib.PO.Customization.Client.CancelPORegenerationPopup
                 * @description A function that is called when the user clicks Cancel in the dialog. Use this function to rollback the modifications performed by the user in the dialog.
                 * @since 345
                 * @param {Dialog} dialog The Dialog object from which the Cancel button was clicked.
                 * @example
                 * <pre><code>
                 * CancelPORegenerationPopup: function (dialog)
                 * {
                 *     Log.Info("User cancelled PO regeneration dialog");
                 * }
                 * </code></pre>
                 */
                Client.CancelPORegenerationPopup = function (dialog) {
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = PO.Customization || (PO.Customization = {}));
    })(PO = Lib.PO || (Lib.PO = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_PO_CUSTOMIZATION_CLIENT_SAMPLE.js.map