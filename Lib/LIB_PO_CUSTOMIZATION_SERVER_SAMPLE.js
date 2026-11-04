"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_PO_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Purchase Order scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Purchase Order Server script customization callbacks
 * @namespace Lib.PO.Customization.Server
 */
var Lib;
(function (Lib) {
    var PO;
    (function (PO) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                * @method Lib.PO.Customization.Server.OnLoad
                * @description
                * This function will be called at the purchase order loading; at the end of the extraction script.
                * @example
                * OnLoad: function ()
                * {
                * 	// Initialize the payment method to "T"
                * 	Data.SetValue("PaymentMethodCode__", "T");
                * }
                */
                Server.OnLoad = function () {
                };
                /**
                * @method Lib.PO.Customization.Server.IsAutoSendOrderEnabled
                * @description Allows you to enable automatic purchase order sending under the conditions of your choice. This user exit is called in the extraction script of the Purchase Order process.
                * @since 110
                * @return {boolean} Boolean specifies whether the purchase order must be automatically sent or not. Possible values are:
                * 		true: When the purchase order is created, the purchase order is automatically sent with the default field values.
                * 		false (default): When the purchase order is created, the buyer needs to manually send the purchase order.
                * @example
                * This user exit enables the automatic purchase order sending when all the following conditions are fulfilled:
                * The vendor number is 01254796.
                * The total net amount of the purchase order does not exceed 100.
            
                IsAutoSendOrderEnabled: function ()
                {
                    if ((Data.GetValue("VendorNumber__") === "01254796") && (Data.GetValue("TotalNetAmount__") < 100))
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
                */
                Server.IsAutoSendOrderEnabled = function () {
                    return false;
                };
                /**
                * @method Lib.PO.Customization.Server.CustomizeAutoSendOrderParam
                * @description Allows you to customize the automatic purchase order sending parameters. This user exit is called in the extraction script of the Purchase Order process when automatic sending is enabled.
                * @since 338
                * @param {Lib.PO.Customization.Server.IsAutoSendOrderEnabledReturn} autoSendOrderParam JavaScript object containing the automatic send parameters that can be customized.
                * @example
                * This example shows how to override the notification method for punchout orders.
                * For some vendors you may prefer to send the notifications by email rather than the punchout mode.
                * In standard if an order only contains punchout items then it is hardcoded that the notifications method will be through punchout.
                * This user exit allows you to override the notification method when autosend order is enabled.
            
                CustomizeAutoSendOrderParam: function (autoSendOrderParam)
                {
                    var vendorNumber = Data.GetValue("VendorNumber__");
                    var emailNotificationOptions = Data.GetValue("EmailNotificationOptions__");
            
                    // Override punchout notification method for specific vendors
                    // Even if order contains punchout items, send email notification instead
                    if (emailNotificationOptions === "PunchoutMode")
                    {
                        // List of vendors that prefer email notifications over punchout
                        var emailPreferredVendors = ["VENDOR001", "VENDOR002", "STAPLES"];
            
                        if (emailPreferredVendors.indexOf(vendorNumber) >= 0)
                        {
                            Log.Info("Overriding punchout notification to email for vendor: " + vendorNumber);
                            autoSendOrderParam.EmailNotificationOptions = "SendToVendor";
                        }
                    }
                }
                */
                Server.CustomizeAutoSendOrderParam = function (autoSendOrderParam) {
                };
                /**
                * @method Lib.PO.Customization.Server.ExecuteCustomOrderTransmissionMethod
                * @description Execute a custom order transmission method during PO validation, after the Customer Order is created and conversation rights are granted to the PO owner.
                * @param {string} transmissionMethod The value selected in the PR popup and stored in EmailNotificationOptions__.
                * @return {boolean|Promise<boolean>} Return true when the custom transmission succeeds. Other results report failure.
                * @example
                * ExecuteCustomOrderTransmissionMethod: function (transmissionMethod)
                * {
                * 	switch (transmissionMethod)
                * 	{
                * 		case "MyCustomTransmission":
                * 			// Replace with the result of your custom transmission.
                * 			return true;
                * 		default:
                * 			return false;
                * 	}
                * }
                */
                Server.ExecuteCustomOrderTransmissionMethod = function (transmissionMethod) {
                };
                /**
                * @method Lib.PO.Customization.Server.IsAutoReceiveOrderEnabled
                * @description Allows you to automate the goods receipt creation under the conditions of your choice. This user exit is called in the validation script of the Purchase Order process.
                * @since 110
                * @return {boolean} boolean specifies whether the goods receipt must be automatically created or not.
                * 		Set to 'true', the good receipt form will be created automatically which will directly mark the PO as 'Received'.
                * OR
                * @return {Lib.PO.Customization.Server.AutoReceiveOrderDetails} json  NOTE : If the object is empty, then auto receive order will be enable as it was set to 'true'.
                * @example
                * 		This user exit enables the automatic goods receipt creation when all the following conditions are fulfilled:
                * 				- The vendor number is 01254796.
                * 				- The total net amount of the purchase order does not exceed 100.
                * 		When the purchase order is sent, the goods receipt is automatically created with the following comment: "Goods receipt automatically created to complete the order".
                * 		The ordered quantities are used to set the received quantities, and the Order status changes to Received.
                *
                 IsAutoReceiveOrderEnabled: function ()
                 {
                   if ((Data.GetValue("VendorNumber__") === "01254796") && (Data.GetValue("TotalNetAmount__") < 100))
                   {
                         var parametersObject = {
                             Comment: "Goods receipt automatically created to complete the order."
                         }
                         return parametersObject;
                   }
                   else
                   {
                         return false;
                   }
                 }
                */
                Server.IsAutoReceiveOrderEnabled = function () {
                    /*
                    var res = {};
                    res.DeliveryDate = new Date();
                    res.Comment = "Automatic delivery";
                    return res;
                    */
                    return false;
                };
                /**
                 * @method Lib.PO.Customization.Server.CustomizeAutoReceiveOrderParam
                 * @description Allows you to customize the automatic goods receipt creation parameters. This user exit is called in the validation script of the Purchase Order process when automatic goods receipt creation is enabled.
                 * @since 341
                 * @example
                 * CustomizeAutoReceiveOrderParam: function (autoReceiveOrderParam)
                 * {
                 * 		var deliveryDate = new Date();
                 *		deliveryDate.setDate(deliveryDate.getDate() + 2); // Set delivery date to 2 days from now
                 *		autoReceiveOrderParam.DeliveryDate = deliveryDate;
                 *		autoReceiveOrderParam.Comment = "Goods receipt automatically created to complete the order.";
                 * };
                 */
                Server.CustomizeAutoReceiveOrderParam = function (autoReceiveOrderParam) {
                };
                /**
                * @method Lib.PO.Customization.Server.OnAttachPO
                * @description Allows you to modify the purchase order PDF file and the CSV file before they are sent to the vendor. The CSV file contains all the purchase order data.
                * @since 134
                * @param {integer} iAttachPO Integer value that specifies the zero-based index of the attachment corresponding to the generated purchase order in PDF format.
                * @param {integer} iAttachCSV Integer value that specifies the zero-based index of the attachment corresponding to the CSV file that contains all the purchase order data.
                * @example This user exit adds the terms and conditions at the end of the purchase order PDF file that is sent to the vendor. The po_terms_condition.pdf file which contains the terms and conditions is a resource file.
                OnAttachPO: function (iAttachPO, iAttachCSV)
                {
                    var tcFile = "%Misc%\\po_terms_condition.pdf";
                    var pdfCommands = "-merge %infile[" + (iAttachPO + 1) + "]% \"" + tcFile + "\"";
                    Attach.PDFCommands(pdfCommands);
                }
                */
                Server.OnAttachPO = function (iAttachPO, iAttachCSV) {
                };
                /**
                * @method Lib.PO.Customization.Server.OnUnknownAction
                * @description Allows you to customize how the action is processed when the validation script executes an unknown action.
                * 		This user exit is called when the validation script of the Purchase Order process is triggered by an unknown action.
                * @since 148
                * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                * @return {boolean} Boolean value indicating whether the action has been handled. Possible values are:
                * 		true: The action has been handled.
                * 		false: The action has not been handled.
                * @example This user exit logs the unknown actions details.
                *	OnUnknownAction: function (currentAction, currentName)
                *	{
                *		Log.Error(currentAction + "-" + currentName);
                *	}
                */
                Server.OnUnknownAction = function (currentAction, currentName) {
                    return false;
                };
                /**
                * @method Lib.PO.Customization.Server.OnEditOrder
                * @description Allows you to customize the purchase order when it has been edited. This user exit is called in the validation script of the Purchase Order process, when saving an edited purchase order.
                * @since 149
                * @param {object} options JavaScript object specifying the edited purchase order options
                * @param {string[]} options.changedFields array containing the names of the fields that have been modified.
                * @return {Lib.PO.Customization.Server.OnEditOrderResult} returns a result object
                * @example In the following example, a friendly message containing the names of the modified fields is displayed.
                    OnEditOrder: function (options)
                    {
                        return {
                            conversationMessage: "Some fields have been modified: \n\t- " + options.changedFields.join("\n\t- ")
                        };
                    }
                */
                Server.OnEditOrder = function (options) {
                    return null;
                };
                /**
                * @method Lib.PO.Customization.Server.OnBillingCompletedUpdate
                * @description Allows you to customize actions to be done when closing a PO for invoicing or reopening a PO for invoicing using the resumeWithActionObject that was passed through the Purchase Order customscript via ProcessInstance.ResumeWithActionAsynchronous("UpdateBillingCompleted" or "ReopenBilling").
                * 		This user exit is called when the validationscript of the Purchase Order process is triggered by updating the "billing completed" status of PO lines.
                * @since 266
                * @param {string} isBillingCompleted boolean representing whether billing is being closed for invoicing (true) or reopened (false)
                * @param {object} resumeWithActionObject object containing Billing completed user login
                * @param {string} resumeWithActionObject.userLogin string containing user login
                * @example In the following example, custom fields are updated every time a PO is closed for invoicing or reopened for invoicing.
                    OnBillingCompletedUpdate: function (isBillingCompleted, resumeWithActionObject)
                    {
                        Data.SetValue("Z_CheckBillingCompleted__", isBillingCompleted);
                        Data.SetValue("Z_BillingCompletedUserLogin__", isBillingCompleted ? resumeWithActionObject.userLogin : "");
                        Data.SetValue("Z_BillingCompletedDateTime__", isBillingCompleted ? Sys.Helpers.Date.Date2DBDateTime(new Date()) : "");
                    }
                */
                Server.OnBillingCompletedUpdate = function (isBillingCompleted, resumeWithActionObject) {
                };
                /**
                * @method Lib.PO.Customization.Server.GetNumber
                * @description Allows you to retrieve the next document number based on a customized numbering sequence.
                * This user exit is called in the validation script of the Purchase Requisition, Purchase Order or Goods Receipt process, depending on the library in which it is located.
                * @since 149
                * @param {string} defaultSequenceName value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
                * @return {string} value containing the next number from your customized sequence.
                * @example
                * Server.GetNumber = function ()
                * {
                *  var number = "";
                *  var companyCode = Data.GetValue("CompanyCode__");
                *  var ReqNumberSequence = Process.GetSequence(defaultSequenceName+companyCode);
                *  number = ReqNumberSequence.GetNextValue();
                *  if (number === "")
                *  {
                * 		  Log.Info("Error while retrieving a number");
                *  }
                *  else
                *  {
                * 		  number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
                * 		  Log.Info("Number: " + number);
                *  }
                *  return number;
                * }
                /*
                GetNumber: function (defaultSequenceName)
                export const GetNumber = function (defaultSequenceName): string
                export const GetNumber = function (defaultSequenceName: string): string
                {
                    // Must return something
                };
                */
                /**
                * @method Lib.PO.Customization.Server.GetName
                * @description
                * If defined this function is called when the purchase order need a number
                * @return {string} returns Purchase Order attachment name without extension
                */
                Server.GetName = function () {
                    /*
                    return "PO";
                */
                };
                /**
                * @method Lib.PO.Customization.Server.ChangePOInSAP
                * @description Allows you to customize the BAPI call used to update header level fields of the purchase order in SAP. This user exit is called in the validation script of the Purchase Order process, when saving an edited purchase order.
                * 		This user exit is called once for the header level fields, if at least one field has been modified.
                * 		By default when editing a purchase order, all header fields are read-only so this user exit is never called. This user exit is only useful if you have previously implemented the CustomizeLayout user exit to make one of the header fields editable.
                * 		To customize the item level fields that are being updated, implement the [OnChangeLine]{@link Lib.PO.Customization.Server.OnChangeLine} user exit.
                * @since 149
                * @param {Lib.ERP.SAP.Manager} managerJavaScript object defining the SAP connection manager.
                * 		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                * @param {BAPI_PO_CHANGE} BAPI_PO_CHANGE SapBAPI object representing the BAPI to call.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {Item} item Item object representing the item to update.
                * @param {object} changes JavaScript object specifying the list of modified fields.
                *		For example,
            
                        {
                            PaymentTermCode__:
                            {
                                from: "T30",
                                to: "T45"
                            },
                            PaymentMethodCode__:
                            {
                                from: "",
                                to: "T"
                            }
                        }
                * @return {boolean} Boolean value indicating whether the function updated the purchase order in SAP. The possible values are:
                * 		true: The function updated all the modified fields in SAP.
                * 		false: The function did not update the fields in SAP.
                */
                Server.ChangePOInSAP = function (managerJavaScript, BAPI_PO_CHANGE, changes, item) {
                    /*
                    // headerChanges: { fieldName: { from: oldValue, to: newValue }, ... }
                        return false;
                        */
                };
                /**
                * @method Lib.PO.Customization.Server.OnChangeLine
                * @description Allows you to customize each of the line items in the purchase order when they are updated in SAP. This user exit is called in the validation script of the Purchase Order process, when saving a modified purchase order.
                * 		By default, the Purchase Order process updates the Req delivery date field in SAP. If this user exit is implemented, the update of all the editable fields should be defined in the user exit, including for the Req delivery date field.
                * 		To customize the header level fields in the purchase order when they are updated in SAP, implement the [ChangePOInSAP]{@link Lib.PO.Customization.Server.ChangePOInSAP} user exit.
                * 		To customize the line items in the purchase order when they are added in SAP, implement the [OnAddLine]{@link Lib.PO.Customization.Server.OnAddLine} user exit.
                * @since 161
                * @param {Lib.ERP.SAP.Manager} manager JavaScript object defining the SAP connection manager.
                * 		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                * @param {BAPI_PO_CHANGE} BAPI_PO_CHANGE SapBAPI object representing the BAPI to call.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} changes JavaScript object specifying the list of modified fields of the line item that is currently being updated in SAP.
                * For example,
            
                    {
                        ItemRequestedDeliveryDate__:
                        {
                            from: "2018-08-28",
                            to: "2018-08-30"
                        },
                        ItemComment__:
                        {
                            from: "",
                            to: "Urgent"
                        }
                    }
                * @param {Item} item Item object representing the item to update.
                * @return {boolean} Boolean value indicating whether the function updated the purchase order in SAP. The possible values are:
                * 		true: The function updated all the modified fields in SAP, including Req delivery date.
                * 		false: The function did not update the fields in SAP. The application updates the Req delivery date fields.
                * @example In the following example, the Description fields of the Items table, as well as the Req delivery date fields, are updated in SAP.
            
                OnChangeLine: function (manager, BAPI_PO_CHANGE, changes, item)
                {
                    if (item)
                    {
                        var PO_ITEM = manager.GetValue("PO_ITEM", item);
                        Sys.Helpers.Object.ForEach(changes, function (from_to, fieldName)
                        {
                            var value = item.GetValue(fieldName);
                            if (fieldName == "ItemRequestedDeliveryDate__")
                            {
                                var POSCHEDULE = BAPI_PO_CHANGE.TablesPool.Get("POSCHEDULE");
                                var POSCHEDULEX = BAPI_PO_CHANGE.TablesPool.Get("POSCHEDULEX");
                                var sched = POSCHEDULE.AddNew();
                                var schedx = POSCHEDULEX.AddNew();
                                sched.SetValue("PO_ITEM", PO_ITEM);
                                schedx.SetValue("PO_ITEM", PO_ITEM);
                                schedx.SetValue("PO_ITEMX", "X");
                                sched.SetValue("DELIVERY_DATE", manager.FormatDate(value));
                                schedx.SetValue("DELIVERY_DATE", "X");
                            }
                            else if (fieldName == "ItemDescription__")
                            {
                                var POITEM = BAPI_PO_CHANGE.TablesPool.Get("POITEM");
                                var POITEMX = BAPI_PO_CHANGE.TablesPool.Get("POITEMX");
                                var poItem = POITEM.AddNew();
                                var poItemx = POITEMX.AddNew();
                                poItem.SetValue("PO_ITEM", PO_ITEM);
                                poItemx.SetValue("PO_ITEM", PO_ITEM);
                                poItemx.SetValue("PO_ITEMX", "X");
                                poItem.SetValue("SHORT_TEXT", value);
                                poItemx.SetValue("SHORT_TEXT", "X");
                            }
                            else
                            {
                                Log.Info("Change " + fieldName + " in SAP not supported");
                            }
                        });
                        return true;
                    }
                    return false;
                }
                 */
                Server.OnChangeLine = function (manager, BAPI_PO_CHANGE, changes, item) {
                };
                /**
                * @method Lib.PO.Customization.Server.OnAddLine
                * @description Allows you to customize each of the line items in the purchase order when they are added to SAP. This user exit is called in the validation script of the Purchase Order process.
                *		To customize the line items in the purchase order when they are updated in SAP, implement the [OnChangeLine]{@link Lib.PO.Customization.Server.OnChangeLine} user exit.
                * @since 161
                * @param {Lib.ERP.SAP.Manager} manager JavaScript object defining the SAP connection manager.
                *		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                * @param {BAPI_PO_CREATE1} BAPI_PO_CREATE1 SapBAPI object representing the BAPI to call.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {Item} item Item object representing the item to add.
                * @param {object} poItem JavaScript object representing the line item that is currently being added to the SAP POITEM table.
                *		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} poItemx JavaScript object representing the line item that is currently being added to the SAP POITEMX table.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} poAccount JavaScript object representing the line item that is currently being added to the SAP POACCOUNT table.
                *		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} poAccountx JavaScript object representing the line item that is currently being added to the SAP POACCOUNTX table.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} sched JavaScript object representing the line item that is currently being added to the SAP POSCHEDULE table.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} schedx JavaScript object representing the line item that is currently being added to the SAP POSCHEDULEX table.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} poLine JavaScript object representing the line item that is currently being added to POData object, used to fill in the fields of the Crystal Reports template.
                *		Refer to CustomizePOData for more information.
                * @return {boolean} value indicating whether the function added the purchase order item in SAP. The possible values are:
                *		true: The function added all the line item in SAP.
                *		false: The function did not add the line item in SAP.
                * @example
                * The following example illustrates how to use additional account assignments, such as internal order and fixed asset number, on each of the line items in the purchase order when they are added to SAP.
            
                OnAddLine: function (manager, BAPI_PO_CREATE1, item, poItem, poItemx, poAccount, poAccountx, sched, schedx, poline)
                {
                    var PO_ITEM = manager.GetValue("PO_ITEM", item);
                    var ASSET_NO = manager.GetValue("ASSET_NO", item);
                    var COST_CTR = manager.GetValue("COST_CTR", item);
                    var G_L_ACCT = manager.GetValue("G_L_ACCT", item);
                    var ORDER_NO = manager.GetValue("ORDER_NO", item);
            
                    if (!poAccount)
                    {
                        poAccount = BAPI_PO_CREATE1.TablesPool.Get("POACCOUNT").AddNew();
                        poAccountx = BAPI_PO_CREATE1.TablesPool.Get("POACCOUNTX").AddNew();
                        poAccount.SetValue("PO_ITEM", PO_ITEM);
                        poAccountx.SetValue("PO_ITEM", PO_ITEM);
                        poAccountx.SetValue("PO_ITEMX", "X");
                    }
            
                    if (ASSET_NO)
                    {
                        poItem.SetValue("ACCTASSCAT", "A");
                        poItemx.SetValue("ACCTASSCAT", "X");
                        poAccount.SetValue("ASSET_NO", Sys.Helpers.String.SAP.NormalizeID(ASSET_NO, 12));
                        poAccountx.SetValue("ASSET_NO", "X");
            
                        // Resets all other dimensions.
                        poAccount.SetValue("COSTCENTER", "");
                        poAccountx.SetValue("COSTCENTER", "");
                        poAccount.SetValue("GL_ACCOUNT", "");
                        poAccountx.SetValue("GL_ACCOUNT", "");
                        poAccount.SetValue("ORDERID", "");
                        poAccountx.SetValue("ORDERID", "");
                    }
                    else
                    {
                        poItem.SetValue("ACCTASSCAT", "K");
                        poItemx.SetValue("ACCTASSCAT", "X");
            
                        if (COST_CTR)
                        {
                            poAccount.SetValue("COSTCENTER", Sys.Helpers.String.SAP.NormalizeID(COST_CTR, 10));
                            poAccountx.SetValue("COSTCENTER", "X");
                        }
                        else
                        {
                            poAccount.SetValue("COSTCENTER", "");
                            poAccountx.SetValue("COSTCENTER", "");
                        }
            
                        if (G_L_ACCT)
                        {
                            poAccount.SetValue("GL_ACCOUNT", Sys.Helpers.String.SAP.NormalizeID(G_L_ACCT, 10));
                            poAccountx.SetValue("GL_ACCOUNT", "X");
                        }
                        else
                        {
                            poAccount.SetValue("GL_ACCOUNT", "");
                            poAccountx.SetValue("GL_ACCOUNT", "");
                        }
            
                        if (ORDER_NO)
                        {
                            poAccount.SetValue("ORDERID", Sys.Helpers.String.SAP.NormalizeID(ORDER_NO, 12));
                            poAccountx.SetValue("ORDERID", "X");
                        }
                        else
                        {
                            poAccount.SetValue("ORDERID", "");
                            poAccountx.SetValue("ORDERID", "");
                        }
                    }
            
                    // Handling additional dimensions: Internal order and Asset number.
                    poline[this.manager.definition.ERPToManagerNames.ORDER_NO] = ORDER_NO;
                    poline[this.manager.definition.ERPToManagerNames.ASSET_NO] = ASSET_NO;
                }
                */
                Server.OnAddLine = function (manager, BAPI_PO_CREATE1, item, poItem, poItemx, poAccount, poAccountx, sched, schedx, poline) {
                };
                /**
                 * @method Lib.PO.Customization.Server.OnExtractionScriptBegin
                 * @description Allows you to perform operations at the beginning of the extraction script of the Purchase Order process.
                 * 				This user exit is called at the very beginning of the extraction script, before any standard extraction logic is executed.
                 * 				Be aware that this UE is called at the beginning of the extraction script, therefore some data may be edited later in the script.
                 * @since 357
                 * @example In the following example, a custom field is initialized at the very beginning of the extraction.
                 * 	OnExtractionScriptBegin: function ()
                 * 	{
                 * 		Data.SetValue("Z_YourCustomField__", "InitialValue");
                 * 	}
                 */
                Server.OnExtractionScriptBegin = function () {
                };
                /**
                 * @method Lib.PO.Customization.Server.OnValidationScriptBegin
                 * @description Allows you to perform operations at the beginning of the validation script of the Purchase Order process.
                 * 				This user exit is called at the beginning of the validation script of the Purchase Order process.
                 * 				Be aware that this UE is called at the beginning of the validation script, therefore some data may be edited later in the script.
                 * @since 332
                 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script.
                 * 		This value is retrieved using the Processing scripts API: Data.GetActionName function.
                 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script.
                 * 		This value is retrieved using the Processing scripts API: Data.GetActionType function.
                 * @example In the following example, we call SetAllowTableValuesOnly on a custom field after submitting the PO.
                 * 	OnValidationScriptBegin: function (currentName, currentAction)
                 * 	{
                 * 		Data.SetAllowTableValuesOnly("Z_YourCustomField__", false);
                 * 	}
                 */
                Server.OnValidationScriptBegin = function (currentName, currentAction) {
                };
                /**
                * @method Lib.PO.Customization.Server.OnValidationScriptEnd
                * @description Allows you to perform operations after the Purchase Order process validation. This user exit is called at the end of the validation script of the Purchase Order process.
                * @since 158
                * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                * @param {boolean} isRecallScriptScheduled Boolean value indicating if the user exit is expected to be called again in the current workflow step. The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step. This parameter is set to false after the last execution of the RecallScript function.
                * 		Possible values are:
                * 			true: The user exit is expected to be called again in the current workflow step.
                * 			false: The user exit is not expected to be called again in the current workflow step.
                * @example In the following example, an email is sent to the requester at each step of the workflow.
            
                    OnValidationScriptEnd: function (currentAction, currentName, isRecallScriptScheduled)
                    {
                        if (currentAction == "approve_asynchronous" && currentName == "PostValidation_Submit")
                        {
                            var user = Users.GetUser(Data.GetValue("RequisitionInitiator__"));
                            var validator = Lib.P2P.GetValidator();
                            var email = Sys.EmailNotification.CreateEmailWithUser(
                            {
                                user: user,
                                subject: "Validation by " + validator.GetValue("FirstName") + " " + validator.GetValue("LastName"),
                                template: "Purchasing_Email_NotifBuyer_PODoNotSend.htm",
                                customTags: "Requester",
                                escapeCustomTags: true,
                                backupUserAsCC: true,
                                sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false)
                            });
                            if (email)
                            {
                                Sys.EmailNotification.AddSender(email, "notification@eskerondemand.com", "Approbation step");
                                Sys.EmailNotification.SendEmail(email);
                            }
                        }
                    }
                */
                Server.OnValidationScriptEnd = function (currentAction, currentName, isRecallScriptScheduled) {
                };
                /**
                * @method Lib.PO.Customization.Server.OnBeforeCallBapi
                * @description Allows you to customize a BAPI before it is actually called to create or update the purchase order in SAP. This user exit is called in the validation script of the Purchase Order process.
                * 		To customize the results returned by the BAPI call, implement the OnAfterCallBapi user exit.
                * @since 161
                * @param {Lib.ERP.SAP.Manager} manager JavaScript object defining the SAP connection manager.
                * 		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                * @param {string} action String value indicating the action for which the BAPI is called. Possible values are:
                * 		CREATE: The BAPI is called to create the purchase order in SAP.
                * 		CHANGE: The BAPI is called to update an existing purchase order in SAP.
                * @param {BAPI_PO_CHANGE|BAPI_PO_CREATE1} BAPI_OBJECT SapBAPI object representing the BAPI to call.
                * 		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @example SAP purchase order
                *		In the following example, the user exit is implemented in the Lib_PO_Customization_Server library.
                *		When creating the purchase order, this example fills the CREATED_BY field in SAP with the buyer's ERP identifier.
            
                        OnBeforeCallBapi: function (manager, action, BAPI_OBJECT)
                        {
                            if (action === "CREATE")
                            {
                                var buyerLogin = Data.GetValue("BuyerLogin__");
                                var buyer = Users.GetUserAsProcessAdmin(buyerLogin);
                                if (buyer)
                                {
                                    var buyerERPID = buyer.GetValue("ERPUSER");
                                    var POHEADER = BAPI_OBJECT.ExportsPool.Get("POHEADER");
                                    if (buyerERPID && POHEADER)
                                    {
                                        // https://www.sapdatasheet.org/abap/tabl/bapimepoheader.html
                                        Log.Info("Create PO in SAP with User SAP ID '" + buyerERPID + "'");
                                        POHEADER.SetValue("CREATED_BY", buyerERPID);
                                    }
                                }
                            }
                        }
                */
                Server.OnBeforeCallBapi = function (manager, action, BAPI_OBJECT) {
                };
                /**
                * @method Lib.PO.Customization.Server.OnAfterCallBapi
                * @description Allows you to make use of the results returned by a BAPI call when creating or modifying the purchase order or the goods receipt in SAP. Typically, you can implement specific actions in response to specific error cases. This user exit is called in the validation script of the Purchase Order or Goods Receipt process, depending on the library in which it is located.
                * 		To customize the BAPI before it is actually called, implement the OnBeforeCallBapi user exit.
                * @since 161
                * @param {Lib.ERP.SAP.Manager} manager JavaScript object defining the SAP connection manager.
                *		In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                * @param {string} action String value indicating the action for which the BAPI is called. Possible values are:
                * 		CREATE: The BAPI is called to create the purchase order or the goods receipt in SAP.
                * 		CHANGE: The BAPI is called to update an existing purchase order in SAP.
                * @param {BAPI_PO_CHANGE|BAPI_PO_CREATE1} BAPI_OBJECT SapBAPI object representing the BAPI to call.
                *		Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                * @param {object} result JSON string value. The result of the BAPI call.
                */
                Server.OnAfterCallBapi = function (manager, action, BAPI_OBJECT, result) {
                };
                /**
                * @method Lib.PO.Customization.Server.OnPunchoutOrder
                * @description Implement this function to customize the cXML OrderRequest sent to vendor
                * @since 209
                * @param {XML.IXMLDOMElement} cxmlDoc Contains the cXML document ready to be sent to the supplier (shared secret will be set just after though)
                * 		Update this document as needed
                * @example
                *	OnPunchoutOrder: function (cxmlDoc)
                *	{
                *		if (Data.GetValue("VendorNumber__") == "AMAZON" && Data.GetValue("Urgent__") == true)
                *		{
                *			// Add customer specific Urgent flag
                *			var xml = '<Extrinsic name="Urgent">true</Extrinsic>';
                *			var element = Process.CreateXMLDOMElement(xml);
                *			var orderRequestHeaderNode = cxmlDoc.selectSingleNode("//cXML/Request/OrderRequest/OrderRequestHeader");
                *			orderRequestHeaderNode.appendChild(element);
                *		}
                *	}
                */
                Server.OnPunchoutOrder = function (cxmlDoc) {
                };
                /**
                 * @method Lib.PO.Customization.Server.SendPunchoutOrder
                 * @description Allows you to customize the HTTP request sent to the punchout site when transmitting a purchase order. This user exit provides
                 * full control over the request parameters, timeout settings, and response handling. This user exit is called in the validation script of the Purchase Order
                 * process when sending orders to punchout vendors.
                 * @since 332
                 * @param {HttpRequestParam} httpRequestParam Object containing the HTTP request parameters to be sent to the punchout site.
                 *		The object includes properties such as URL, headers, body content, timeout settings, and authentication parameters.
                 *		You can modify these parameters to customize the request according to your punchout vendor's requirements.
                 * @return {HttpResponse} Returns the HTTP response object from the punchout site request. Return null or undefined to use the default request handling.
                 *		When returning null/undefined, the system will proceed with the standard punchout order transmission.
                 *		When returning an HttpResponse object, it should contain the actual response from the vendor's punchout site.
                 * @example This user exit customizes the punchout order request by adding custom headers, modifying timeout settings, and including vendor-specific parameters.
                 * SendPunchoutOrder: function (httpRequestParam)
                 * {
                 * 	// Add custom authentication header for specific vendor
                 * 	if (Data.GetValue("VendorNumber__") === "PUNCH001")
                 * 	{
                 * 		httpRequestParam.headers["X-Vendor-Auth"] = "Bearer " + Data.GetValue("Z_VendorToken__");
                 * 		httpRequestParam.headers["X-Company-ID"] = Data.GetValue("CompanyCode__");
                 *
                 * 		// Increase timeout for this vendor (5 minutes)
                 * 		httpRequestParam.timeout = 300000;
                 *
                 * 		// Set custom content type
                 * 		httpRequestParam.headers["Content-Type"] = "application/json; charset=utf-8";
                 *
                 * 		// Delete user agent header
                 * 		delete httpRequestParam.headers["User-Agent"];
                 *
                 * 		Log.Info("Sending customized punchout order to vendor: " + Data.GetValue("VendorNumber__"));
                 *
                 * 		// Execute the custom request
                 * 		const punchoutHttp = Process.CreateHttpRequest();
                 * 		const response = punchoutHttp.Call(httpRequestParam);
                 *
                 * 		// Log response for debugging
                 * 		Log.Info("Punchout response status: " + response.statusCode);
                 *
                 * 		return response;
                 * 	}
                 *
                 * 	// Use default handling for other vendors by returning null
                 * 	return null;
                 * }
                 */
                Server.SendPunchoutOrder = function (httpRequestParam) {
                };
                /**
                * @method Lib.PO.Customization.Server.ShouldSendEmailToRequesterWhenRequesterIsBuyer
                * @description Allows you to determine whether an email should be sent to the requester when the requester is also the buyer.
                * @since 354
                * @param {string} requesterLogin Login of the requester
                * @returns {boolean} Boolean value specifying whether the email should be sent:
                *		true: The email should be sent.
                *		false: The email should not be sent.
                */
                Server.ShouldSendEmailToRequesterWhenRequesterIsBuyer = function (requesterLogin) {
                    return false;
                };
                /**
                * @method Lib.PO.Customization.Server.OnSendEmailNotification
                * @description Allows you to modify the email notifications. This user exit is called before the notification is sent.
                * @since 268
                * @param {Sys.EmailNotification.SendEmailNotificationWithUserIdOptions} emailOptions JavaScript object specifying the email options
                * @param {string} emailOptions.userId Identifier of the user who should receive the email notification.
                * @param {string} emailOptions.subject	Subject of the email notification.
                * @param {string} emailOptions.template Template used for the email notification.
                * @param {string} emailOptions.fromName Name of the email sender.
                * @param {boolean} emailOptions.backupUserAsCC Specifies if the email address of the delegate user should be added in the Cc field of the email notification:
                *		true : the notification is sent.
                *		false: the notification is not sent.
                * @returns {boolean} Boolean value specifying whether the notification should be sent:
                *		true: The email notification should be sent.
                *		false: The email notification should not be sent.
                */
                Server.OnSendEmailNotification = function (emailOptions) {
                    return true;
                };
                /**
                 * @method Lib.PO.Customization.Server.OnCreateCO
                 * @description Allows you to implement custom logic when a Customer Order is created.
                 * @since 354
                 * @param {xTransport} customerOrderProcess The customer order transport object that has been created.
                 * @example
                 * Lib.PO.Customization.Server.OnCreateCO = function (customerOrderProcess)
                 * {
                 * 		const vars = customerOrderProcess.GetUninheritedVars();
                 * 		vars.AddValue_String("Z_CustomField__", Data.GetValue("Z_CustomField__"), true);
                 * 		vars.AddValue_Date("Z_CustomFieldDate__", Data.GetValue("Z_CustomFieldDate__"), true);
                 * 		vars.AddValue_Double("Z_CustomFieldAmount__", Data.GetValue("Z_CustomFieldAmount__"), true);
                 *
                 * 		const externalVars = customerOrderProcess.GetExternalVars();
                 * 		externalVars.AddValue_String("Z_CustomField__", Variable.GetValueAsString("Z_CustomField__"), true);
                 * };
                 */
                Server.OnCreateCO = async function (customerOrderProcess) {
                    // Custom logic for when a Customer Order is created
                };
                /**
                * @method Lib.PO.Customization.Server.ShouldAttach
                * @since 346
                * @description
                * Allows you to determine whether each attachment should be included in the vendor email notification.
                * This user exit is called for each attachment when building the email notification.
                * The PO document is always included and cannot be filtered by this user exit.
                * @param {string} attachmentName Name of the attachment file including its extension
                * @returns {boolean} Boolean value specifying whether the attachment should be included in the email notification:
                *		true: The attachment should be included in the email notification.
                *		false: The attachment should be excluded from the email notification.
                * @example <caption>Exclude XML files from notifications</caption>
                * ShouldAttach: function (attachmentName)
                * {
                * 	if (attachmentName.toLowerCase().indexOf(".xml") > -1)
                * 	{
                * 		Log.Info("Excluding XML attachment from email notification: " + attachmentName);
                * 		return false;
                * 	}
                * 	return true;
                * }
                */
                Server.ShouldAttach = function (attachmentName) {
                    return true;
                };
                /**
                * @method Lib.PO.Customization.Server.GetListOfExtraUsersWithReadRight
                * @description Allow you to return a list of user to give read right to.
                * @since 288
                * @returns {Array<string>} array of login to give read rights to
                * @example <caption>For exemple, always add read rights to big.boss@company.com.</caption>
                * 	GetListOfExtraUsersWithReadRight: function ()
                * 	{
                * 		var costCenters = [];
                * 		var lineItems = Data.GetTable("LineItems__");
                * 		var nbItems = lineItems.GetItemCount();
                * 		for (var i = 0; i < nbItems; i++)
                * 		{
                * 			var item = lineItems.GetItem(i);
                * 			var cc = item.GetValue("ItemCostCenterId__");
                * 			if (cc && costCenters.indexOf(cc) < 0)
                * 			{
                * 				costCenters.push(cc);
                * 			}
                * 		}
                * 		var list = [];
                * 		if (costCenters.length > 0)
                * 		{
                * 			var filter = Sys.Helpers.LdapUtil.FilterAnd(
                * 				"(" + Lib.P2P.GetCompanyCodeFilter(Data.GetValue("CompanyCode__")) + ")",
                * 				Sys.Helpers.LdapUtil.FilterIn("CostCenter__", costCenters)
                * 			).toString();
                * 			Sys.GenericAPI.Query("AP - Cost centers__", filter, ["Manager__"], function (result, error)
                * 			{
                * 				if (error || !result)
                * 				{
                * 					return;
                * 				}
                * 				for (var i = 0; i < result.length; i++)
                * 				{
                * 					var r = result[i];
                * 					if (r.Manager__ && list.indexOf(r.Manager__) === -1)
                * 					{
                * 						list.push(r.Manager__);
                * 					}
                * 				}
                * 			}, null, -1, { useConstantQueryCache: true });
                * 		}
                * 		return list;
                * 	}
                */
                Server.GetListOfExtraUsersWithReadRight = function () {
                    return [];
                };
                /**
                 * @method Lib.PO.Customization.Server.GetCustomAPPOItemsAttributes
                 * @since 346
                 * @description
                 * Allows you to add custom attributes to be updated in the PO items table (AP - Purchase order - Items__)
                 * during various Purchase Order operations. This user exit is called from the Purchase Order validation script
                 * when the UpdateAPPOItemsWithAttributes function is executed in the following contexts:
                 * - **CreatePO**: When a purchase order is initially created and items are inserted in the AP tables
                 * - **AfterReception**: When a Goods Receipt or Service Entry Sheet is validated
                 * - **EditPO**: When a purchase order is edited
                 * - **AfterCancel**: When a purchase order is canceled
                 * - **BillingCompleted**: When billing completed status is updated
                 *
                 * **Important restrictions:**
                 * - Only custom fields starting with "Z_" are allowed (following Esker naming convention for custom fields)
                 * - Standard fields cannot be overridden (OrderNumber__, ItemNumber__, DeliveredAmount__, DeliveredQuantity__, NoGoodsReceipt__)
                 * - Any attribute not matching these rules will be ignored and a warning will be logged
                 *
                 * @param {Item} lineItem The current line item being processed. The source varies by context:
                 *   - In "CreatePO", "EditPO", "AfterCancel", "BillingCompleted": lineItem is from the Purchase Order LineItems__ table
                 *   - In "AfterReception": lineItem is from the Purchase Order LineItems__ table (not from the Goods Receipt)
                 * @param {number} lineIndex The index of the current line item in the LineItems__ table (0-based)
                 * @param {string} context The operation context: "CreatePO", "AfterReception", "EditPO", "AfterCancel", or "BillingCompleted"
                 * @returns {Array<{name: string, value: any}>} An array of attribute objects to be added to the PO items table update.
                 * Each object should have a 'name' property (the Z_* field name in the AP - Purchase order - Items__ table) and a 'value' property.
                 * Return null or an empty array if no custom attributes are needed.
                 *
                 * @example
                 * <caption>Add custom attributes based on the operation context</caption>
                 * Server.GetCustomAPPOItemsAttributes = function(lineItem, lineIndex, context)
                 * {
                 *     if (context === "AfterReception")
                 *     {
                 *         return [
                 *             { name: "Z_LastReceptionDate__", value: new Date() },
                 *             { name: "Z_ReceivedBy__", value: Data.GetValue("BuyerLogin__") }
                 *         ];
                 *     }
                 *     else if (context === "CreatePO")
                 *     {
                 *         return [
                 *             { name: "Z_CreationTimestamp__", value: new Date() }
                 *         ];
                 *     }
                 *     return [];
                 * };
                 */
                Server.GetCustomAPPOItemsAttributes = function (lineItem, lineIndex, context) {
                };
                /**
                 * @method Lib.PO.Customization.Server.GetCustomAPPOHeaderAttributes
                 * @since 346
                 * @description
                 * Allows you to add custom attributes to be updated in the PO header table (AP - Purchase order - Header__)
                 * during various Purchase Order operations. This user exit is called from the Purchase Order validation script
                 * when the UpdateAPPOHeaderWithAttributes function is executed in the following contexts:
                 * - **CreatePO**: When a purchase order is initially created (also called from InsertAPPOHeader)
                 * - **AfterReception**: When a Goods Receipt or Service Entry Sheet is validated
                 * - **EditPO**: When a purchase order is edited
                 * - **AfterCancel**: When a purchase order is canceled
                 * - **BillingCompleted**: When billing completed status is updated
                 *
                 * **Important restrictions:**
                 * - Only custom fields starting with "Z_" are allowed (following Esker naming convention for custom fields)
                 * - Standard fields cannot be overridden (DeliveredAmount__, OrderedAmount__, etc.)
                 * - Any attribute not matching these rules will be ignored and a warning will be logged
                 *
                 * @param {string} context The operation context: "CreatePO", "AfterReception", "EditPO", "AfterCancel", or "BillingCompleted"
                 * @returns {Array<{name: string, value: any}>} An array of attribute objects to be added to the PO header table update.
                 * Each object should have a 'name' property (the Z_* field name in the AP - Purchase order - Header__ table) and a 'value' property.
                 * Return null or an empty array if no custom attributes are needed.
                 *
                 * @example
                 * <caption>Add custom attributes based on the operation context</caption>
                 * Server.GetCustomAPPOHeaderAttributes = function(context)
                 * {
                 *     if (context === "AfterReception")
                 *     {
                 *         return [
                 *             { name: "Z_LastReceptionDate__", value: new Date() },
                 *             { name: "Z_ReceptionStatus__", value: "Partially_Received" }
                 *         ];
                 *     }
                 *     else if (context === "CreatePO")
                 *     {
                 *         return [
                 *             { name: "Z_POCreationDate__", value: new Date() }
                 *         ];
                 *     }
                 *     return [];
                 * };
                 */
                Server.GetCustomAPPOHeaderAttributes = function (context) {
                };
                /**
                * @typedef {Object} Lib.PO.Customization.Server.Exporter.ColumnRules
                * @property {string[]} excludedColumns list of excluded fields
                */
                /**
                * @typedef {Object} Lib.PO.Customization.Server.Exporter.FieldsRules
                * List the rules for flexible form inclusion or exclusion
                * @property {string[]} includedFields list of included fields used when exportMode = 0 (allExcept)
                * @property {string[]} excludedFields list of excluded fields used when exportMode = 1 (onlyIncluded)
                */
                /**
                * @typedef Lib.PO.Customization.Server.Exporter.ExcludedConditionalColumns
                * excludedConditionalColumn property defintion
                * @property {string} fieldConditional The column name used to compare values for each line
                * @property {Object.<string, Lib.PO.Customization.Server.Exporter.ColumnRules>} conditionalTable  "Value to compare"
                */
                /**
                * @typedef {Object} Lib.PO.Customization.Server.Exporter.TablesRule
                * List of options for table behavior as follow
                * @property {string} name table name (ex. "LineItems\_\_")
                * @property {boolean} includedFullTable true/false, specify if the whole table should be included from generation even if there are no lines (to define table columns).
                * Used when exportMode = 1 (onlyIncluded).
                * @property {boolean} excludedFullTable true/false, specify if the whole table should be excluded from generation.
                * Used when exportMode = 0 (allExcept).
                * @property {string[]} excludedColumns list of table columns to exclude. Used when exportMode = 0 (allExcept).
                * Exclusive with option excludedConditionalColumns
                * @property {string[]} includedColumns list of table columns which columns are always added in generation.
                * Used when exportMode = 1 (onlyIncluded)
                * @property {string[]} requiredColumns list of table columns which values are required for generation. When the table line has an empty value for required columns the line is not exported.
                * Option used in both export modes (onlyincluded and allExcept)
                * @property {Lib.PO.Customization.Server.Exporter.ExcludedConditionalColumns} excludedConditionalColumns list of table columns to exclude after an equal comparison to a specified field.
                * Exclusive with option excludedColumns
                * @example { name: "ApproversList\_\_", requiredColumns: ["ApproverID\_\_"], excludedColumns: ["ApproverAction\_\_", "LineMarker\_\_", "WorkflowIndex\_\_", "WRKFIsGroup\_\_"] }
                */
                /**
                 * @namespace Lib.PO.Customization.Server.Exporter
                 */
                Server.Exporter = {
                    /**
                     * @method Lib.PO.Customization.Server.Exporter.GetXmlFilename
                     * @description
                     * Allows you to customize the name of the PO XML file generated by the Purchase order process.
                     * This user exit is called from the validation script of the Purchase order process, when the PO is submited.
                     * @returns {string} The name of the XML file or null to keep the default filename
                     * @example
                     * GetXmlFilename: function ()
                     * {
                     *	var suffix = "Create";
                     *	return Data.GetValue("MSNEx") + suffix;
                     * }
                     */
                    GetXmlFilename: function () {
                    },
                    /**
                     * @method Lib.PO.Customization.Server.Exporter.GetFieldsRules
                     * @description
                     * Allows you to customize the PO XML file generated by the Purchase order process. The customizations made through this user exit concern only XML nodes originating from the Purchase order process header fields.
                     * This user exit is called from the validation script of the Purchase order process, when the PO is submited
                     * @param {number} exportMode The current exportMode integer value (0=allExcept or 1=onlyIncluded)
                     * @param {Lib.PO.Customization.Server.Exporter.FieldsRules} fieldsRules The current rules for the flexible form fields
                     * @returns {Lib.PO.Customization.Server.Exporter.FieldsRules} The updated rules about the fields to include or exclude
                     * @example
                     * GetFieldsRules: function (exportMode, fieldsRules)
                     * {
                     *	// In exclude export mode remove the DeliveryAddressID__ field in xml export
                     *	if (exportMode == 0)
                     *	{
                     *		fieldsRules.excludedFields.push("DeliveryAddressID__");
                     *	}
                     *	return fieldsRules;
                     * }
                     * GetFieldsRules: function (exportMode, fieldsRules)
                     * {
                     *	// In include export mode add my customized field in xml export
                     *	if (exportMode == 1)
                     *	{
                     *		fieldsRules.includedFields.push("Z_CustomizedField__");
                     *	}
                     *	return fieldsRules;
                     * }
                     */
                    GetFieldsRules: function (exportMode, fieldsRules) {
                        return fieldsRules;
                    },
                    /**
                     * @method Lib.PO.Customization.Server.Exporter.GetTablesRules
                     * @description
                     * Allows you to customize the PO XML file generated by the Purchase order process. The customizations made through this user exit concern only XML nodes originating from the Purchase order process tables.
                     * This user exit is called from the validation script of the Purchase order process, when the PO is submitted
                     * @param {number} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
                     * @param {Lib.PO.Customization.Server.Exporter.TableRule[]} tablesRules The current rules for the flexible form tables
                     * @returns {Lib.PO.Customization.Server.Exporter.TableRule[]} The updated rules about the tables to include or exclude
                     * @example
                     * // Exclude AdditionnalFees table and exclude LineItems__ PRRUIDEX__ field
                     * GetTablesRules: function (exportMode, tablesRules)
                     * {
                     *	if (exportMode == 0)
                     *	{
                     *		for (var i = 0; i < tablesRules.length; i++)
                     *		{
                     *			if (tablesRules[i].name === "AdditionalFees__")
                     *			{
                     *				tablesRules[i].excludedFullTable = true;
                     * 			}
                     *
                     *			if (tablesRules[i].name === "LineItems__")
                     *			{
                     *				tablesRules[i]["excludedColumns"] = ["PRRUIDEX__"];
                     * 			}
                     *		}
                     *	}
                     *	return tablesRules;
                     * }
                     */
                    GetTablesRules: function (exportMode, tablesRules) {
                        return tablesRules;
                    },
                    /**
                     * @method Lib.PO.Customization.Server.Exporter.GetModifiedNodeNameMappings
                     * @description
                     * Allows you to specify names for the XML nodes corresponding to custom fields of the Purchase order process.
                     * This user exit is called from the validation script of the Purchase order process, when the PO is submited
                     * @param {number} exportMode The current exportMode integer value 0 (allExcept) or 1 (onlyIncluded)
                     * @param {Object.<string, Object.<string, string>>} modifiedNodeNameMappings The current fields mapping
                     * @returns {Object.<string, Object.<string, string>>} The updated fields mapping to include or exclude
                     * @example
                     * // Add a mapping to put the value of custom field Z_CustomizedField__ to xml field AdditionalField1
                     * GetModifiedNodeNameMappings: function (exportMode, modifiedNodeNameMappings)
                     * {
                     *	modifiedNodeNameMappings.Z_CustomizedField__ = "AdditionalField1";
                     *	return modifiedNodeNameMappings;
                     * }
                     */
                    GetModifiedNodeNameMappings: function (exportMode, modifiedNodeNameMappings) {
                        return modifiedNodeNameMappings;
                    },
                    /**
                     * @method Lib.PO.Customization.Server.Exporter.GetFieldValuesMapping
                     * @description
                     * Allows you to override some fields values in the resulting XML.
                     * This user exit is called from the validation script of the Purchase order process, when the PO is submited
                     * @param {Object.<string, Object.<string, string>>} modifiedFieldValuesMapping The current fields values mapping
                     * @returns {Object.<string, Object.<string, string>>} The updated fields values
                     * @example
                     * // Add a mapping to set the Z_CustomizedField__ value to "Customized value"
                     * GetFieldValuesMapping: function (modifiedFieldValuesMapping)
                     * {
                     * 	modifiedFieldValuesMapping.Z_CustomizedField__ = "Customized value";
                     *	return modifiedFieldValuesMapping;
                     * }
                     */
                    GetFieldValuesMapping: function (modifiedFieldValuesMapping) {
                        return modifiedFieldValuesMapping;
                    },
                    /**
                     * @method Lib.PO.Customization.Server.Exporter.GetHeaderColumnsList
                     * @since 330
                     * @description
                     * Allows you to customize the header fields to be exported in the resulting XML (including the order).
                     * This user exit is called from the validation script of the Purchase order process, when the PO is submitted
                     * @param {Array<Object<string, any>>} fieldList The list of header fields with associated values. The list can be filtered or reordered before the export in the XML.
                     * @example <caption>move first field in 4th position</caption>
                     * Server.Exporter.GetHeaderColumnsList = function (fieldList)
                     * {
                     *   // move first field in 4th position
                     *   var fieldToMove = fieldList.shift();
                     *   fieldList.splice(3, 0, fieldToMove);
                     * }
                     */
                    GetHeaderColumnsList: function (fieldList) {
                    },
                    /**
                     * @method Lib.PO.Customization.Server.Exporter.CustomizeERPNotifier
                     * @description
                     * Allows you to customize the value of variables and fields of the process to which PO files are submitted when order are posted in the ERP via Esker Loader.
                     * This user exit is called from the validation script of the Purchase order process, when the order is submited
                     * @param {xTransport} erpNotifierProcess The xTransport object of the ERPNotifer that will be created
                     * @example
                     * CustomizeERPNotifier: function (erpNotifierProcess)
                     * {
                     *	var vars = erpNotifierProcess.GetUninheritedVars();
                     *	vars.AddValue_Date("OrderDate__", Data.GetValue("OrderDate__"), true);
                     * }
                     */
                    CustomizeERPNotifier: function (erpNotifierProcess) {
                    }
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = PO.Customization || (PO.Customization = {}));
    })(PO = Lib.PO || (Lib.PO = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_PO_CUSTOMIZATION_SERVER_SAMPLE.js.map