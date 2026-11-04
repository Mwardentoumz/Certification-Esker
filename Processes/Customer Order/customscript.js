"use strict";
const ApprovalCommentCheck = {
    // Fill dialog callback: Design and instantiation of the controls
    fill_CB: function (dialogTexts) {
        return function (dialog /*, tabId, event, control*/) {
            const ctrl = dialog.AddDescription("ctrlDesc", null, 466);
            ctrl.SetText(Language.Translate(dialogTexts.descriptionRequired));
            const commentCtrl = dialog.AddMultilineText("ctrlComments", "_Comment", 400);
            dialog.RequireControl(commentCtrl);
        };
    },
    // Validate dialog callback: checks if required fields are set
    validate_CB: function (dialog /*, tabId, event, control*/) {
        if (!dialog.GetControl("ctrlComments").GetValue()) {
            dialog.GetControl("ctrlComments").SetError("This field is required!");
            return false;
        }
        return true;
    },
    // Commit dialog callback: updates the process form with dialog results
    commit_CB: function (action, onCommitted) {
        return function (dialog /*, tabId, event, control*/) {
            Variable.SetValueAsString("RejectionReason", dialog.GetControl("ctrlComments").GetValue());
            ProcessInstance.ApproveAsynchronous("Reject");
            if (Sys.Helpers.IsFunction(onCommitted)) {
                onCommitted();
            }
        };
    },
    OnClick: function (action = "Reject", dialogTexts, onCommitted) {
        const defaultDialogTexts = {
            titleConfirmation: "_Approval comments confirmation",
            titleRequired: "_Approval comments required",
            descriptionConfirmation: "_Please confirm your comment",
            descriptionRequired: "_Please write your comment"
        };
        let att;
        if (!dialogTexts) {
            dialogTexts = defaultDialogTexts;
        }
        else {
            for (att in defaultDialogTexts) {
                if (!(att in dialogTexts)) {
                    dialogTexts[att] = defaultDialogTexts[att];
                }
            }
        }
        Popup.Dialog(dialogTexts.titleRequired, null, ApprovalCommentCheck.fill_CB(dialogTexts), ApprovalCommentCheck.commit_CB(action, onCommitted), ApprovalCommentCheck.validate_CB);
        return false;
    }
};
const topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
const onGoingOrderConfirmation = {};
async function Main() {
    const globalLayout = new Lib.P2P.Layout.Manager([], []);
    Sys.Helpers.EnableSmartSilentChange();
    ProcessInstance.SetSilentChange(true);
    globalLayout.ShowWaitScreen();
    const banner = Sys.Helpers.Banner;
    banner.SetMainTitle("_Purchase Order");
    banner.SetSubTitleAligned(true);
    banner.SetCentered(false);
    banner.SetHTMLBanner(Controls.HTMLBanner__);
    banner.SetSubTitle("_To Confirm");
    Process.SetHelpId(5026);
    Controls.CompanyCode__.Hide();
    Controls.VendorNumber__.Hide();
    Controls.Invoice_RuidEx__.Hide();
    Controls.ConfirmationDatetime__.Hide(true);
    Controls.Share__.SetDisabled(true);
    Controls.InvoiceThisOrder__.Hide(true);
    Controls.InvoiceThisOrder__.SetDisabled(true);
    Controls.ServiceEntrySheet__.Hide(true);
    Controls.ServiceEntrySheet__.SetDisabled(true);
    Controls.CreateAdvancedShippingNotice__.Hide(true);
    Controls.BuyerName__.SetValue(Variable.GetValueAsString("BuyerName__"));
    if (ProcessInstance.state === 100 || ProcessInstance.isReadOnly) {
        if (ProcessInstance.state === 100) {
            if (!Data.GetValue("CanceledDatetime__")) {
                banner.SetSubTitle("_Confirmed");
                Sys.Parameters.GetInstance("P2P").IsReady(() => {
                    const flipPO = Sys.Parameters.GetInstance("P2P").GetParameter("EnableFlipPOGlobalSetting", false) === "1";
                    if (flipPO) {
                        Controls.InvoiceThisOrder__.Hide(false);
                        Controls.InvoiceThisOrder__.SetDisabled(false);
                        Controls.InvoiceThisOrder__.OnClick = () => {
                            Controls.InvoiceThisOrder__.Wait(true);
                            return InvoiceThisOrder()
                                .Then((ruid) => {
                                Process.OpenMessage(ruid, true);
                                Controls.InvoiceThisOrder__.Wait(false);
                            })
                                .Catch((error) => {
                                Log.Error("CreateProcessInstance FlipPO", error);
                                Popup.Alert(["_ErrorCannotInvoiceThisOrder"], true, null, "Error");
                                Controls.InvoiceThisOrder__.Wait(false);
                            });
                        };
                    }
                });
            }
            else {
                banner.SetSubTitle("_Canceled");
            }
        }
        else if (ProcessInstance.state === 400) {
            banner.SetSubTitle("_Rejected");
        }
        Controls.Confirm__.Hide(true);
    }
    else {
        Controls.Confirm__.OnClick = function () {
            ProcessInstance.Approve("Confirm");
        };
        Controls.Reject__.OnClick = ApprovalCommentCheck.OnClick;
    }
    // Hide the buttons to avoid flickering after loading the parameters
    Controls.Change__.Hide(true);
    Controls.Reject__.Hide(true);
    Controls.DocumentsPanel.Hide(Attach.GetNbAttach() <= 1);
    Controls.CanceledDatetime__.Hide(!Boolean(Data.GetValue("CanceledDatetime__")));
    Controls.RevisionDateTime__.Hide(!Boolean(Data.GetValue("RevisionDateTime__")));
    Controls.RejectionDatetime__.Hide(ProcessInstance.state !== 400);
    Controls.RejectionReason__.Hide(ProcessInstance.state !== 400);
    await Sys.Parameters.GetInstance("PAC").PromisedIsReady();
    await Sys.Parameters.GetInstance("P2P").PromisedIsReady();
    // Starting from S328, the modification/rejection of an order is necessarily done through the OC process (the EditPORequest process has been removed).
    // If an old client wants to bypass and use the EditPORequest process, they will need to set the P2P parameter 'AllowSupplierToModifyPOWithEditPORequest'.
    const orderConfirmationEnabled = Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableOrderConfirmation", false);
    const allowSupplierToModifyPOWithEditPORequest = Sys.Parameters.GetInstance("P2P").GetParameterBool("AllowSupplierToModifyPOWithEditPORequest", false);
    const vendorModifyPOEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("EnableVendorModifyPO", false);
    const hideButtons = ProcessInstance.state === 100 || ProcessInstance.isReadOnly || // No action available
        !(vendorModifyPOEnabled && (orderConfirmationEnabled || allowSupplierToModifyPOWithEditPORequest)); // these buttons are visible only if the feature is enabled and the OC feat or the backward compt param are enabled
    Controls.Change__.Hide(hideButtons);
    Controls.Reject__.Hide(hideButtons);
    await Promise.all([
        InitRelatedEditPORequest(),
        InitRelatedASN(),
        InitRelatedReturnOrder(),
        InitRelatedOrderConfirmation()
    ]);
    let disableActions = await ProcessInstance.CheckResumeWithActionPending()
        .Then((result) => result.hasResumeActionPending)
        .Catch((errorResult) => {
        // Error retrieving hasResumeActionPending
        Log.Verbose(JSON.stringify(errorResult.errors));
        return false;
    });
    let topMessageWarningString = "";
    if (disableActions) {
        topMessageWarningString = "_Action unavailable because of processing";
    }
    else if (vendorModifyPOEnabled) {
        const hasOngoingEditPORequest = HasOngoingOrderUpdateRequest();
        const hasOnGoingOrderConfirmation = onGoingOrderConfirmation.Draft || onGoingOrderConfirmation.ToApprove;
        disableActions = hasOnGoingOrderConfirmation || hasOngoingEditPORequest;
        if (disableActions) {
            topMessageWarningString = onGoingOrderConfirmation.Draft ? "_Action unavailable because draft OC" : "_Action unavailable because of request";
        }
    }
    if (disableActions) {
        Controls.Confirm__.SetDisabled(true);
        Controls.Change__.SetDisabled(true);
        Controls.Reject__.SetDisabled(true);
        if (!Sys.Helpers.IsEmpty(topMessageWarningString)) {
            topMessageWarning.Add(Language.Translate(topMessageWarningString, false));
        }
    }
    Controls.Quit__.OnClick = function () {
        ProcessInstance.Quit("Quit");
        return false;
    };
    // Add customer name into Event history panel title
    const title = Language.Translate("_Event_history", false, Variable.GetValueAsString("CustomerCompany"));
    Controls.Event_history.SetText(title);
    // Viewed event
    InitConversation();
    NotifyOrderViewEvent();
    Lib.CommonDialog.NextAlert.Show();
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.HTMLScripts.OnCustomerOrderHTMLScriptEnd");
    globalLayout.HideWaitScreen();
    ProcessInstance.SetSilentChange(false);
}
function InitConversation() {
    // Clear "ConversationOptions" node that could be set in the layout.json
    // (removed in sprint 262, but kept at upgrade)
    Controls.ConversationUI__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsSupplier));
}
function NotifyOrderViewEvent() {
    const data = { Message: Language.Translate("_CustomerOrderViewed"), Type: Lib.Purchasing.ConversationTypes.Viewed };
    const options = { ignoreIfExists: true, emailTemplate: "Event_MissedPurchasingItem.htm" };
    const doSendNotif = Sys.Helpers.TryCallFunction("Lib.VendorPortal.Customization.ConversationUI.OnAddItem", data, options);
    if (doSendNotif !== false) {
        Controls.ConversationUI__.AddItem(data, options);
    }
}
function InitRelatedASN() {
    const isAdvancedShippingNoticeEnabled = Sys.Parameters.GetInstance("P2P").GetParameter("EnableAdvancedShippingNotice", false);
    if (isAdvancedShippingNoticeEnabled) {
        InitCreateASNButton();
        return Lib.Purchasing.ASN.InitRelatedASNPane(Controls.RelatedShippingNoticeTable__, Controls.RelatedShippingNoticePane);
    }
    return Sys.Helpers.Promise.Resolve();
}
function InitCreateASNButton() {
    const containsQuantityBasedItem = Variable.GetValueAsString("containsQuantityBasedItem") === "1";
    const orderIsMultiShipTo = Variable.GetValueAsString("orderIsMultiShipTo") === "1";
    const hideASNCreation = ProcessInstance.state !== 100 || !ProcessInstance.isReadOnly || !containsQuantityBasedItem || !!Data.GetValue("CanceledDatetime__");
    Controls.CreateAdvancedShippingNotice__.OnClick = () => {
        ProcessInstance.OpenInProcess({
            processName: "Advanced Shipping Notice Vendor",
            attachmentsMode: "none",
            willBeChild: true,
            returnToOriginalUrl: false
        });
        return false;
    };
    Controls.CreateAdvancedShippingNotice__.Hide(hideASNCreation);
    Controls.CreateAdvancedShippingNotice__.SetDisabled(orderIsMultiShipTo);
}
function InitRelatedReturnOrder() {
    if (Lib.Purchasing.ReturnManagement.IsEnabled()) {
        return Lib.Purchasing.ReturnManagement.InitRelatedROPane(Controls.RelatedReturnOrdersTable__, Controls.RelatedReturnOrdersPane).Then((itemCount) => {
            Controls.RelatedReturnOrdersPane.Hide(itemCount === 0);
        });
    }
    return Sys.Helpers.Promise.Resolve();
}
async function InitRelatedOrderConfirmation() {
    const orderConfirmationEnabled = Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableOrderConfirmation", false);
    if (orderConfirmationEnabled) {
        Controls.Confirm__.OnClick = () => OpenNewOrderConfirmation("Accept");
        Controls.Change__.OnClick = () => OpenNewOrderConfirmation("Update");
        Controls.Reject__.OnClick = () => OpenNewOrderConfirmation("Reject");
        await InitOrderConfirmationsTable();
    }
}
async function InitRelatedEditPORequest() {
    const vendorModifyPOEnabled = Sys.Parameters.GetInstance("PAC").GetParameter("EnableVendorModifyPO", false);
    if (vendorModifyPOEnabled) {
        await Lib.Purchasing.EditPORequest.InitRelatedEditPORequestPanel(Controls.RelatedEditPORequestTable__, Controls.RelatedEditPORequestPanel);
    }
}
async function InitOrderConfirmationsTable() {
    try {
        Controls.RelatedOrderConfirmationsTable__.SetItemCount(0);
        const queryResults = await Sys.GenericAPI.PromisedQuery({
            table: "CDNAME#S2P - Order Confirmation Vendor",
            filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("PONumber__", Data.GetValue("OrderNumber__")), Sys.Helpers.LdapUtil.FilterNotEqual("Status__", "Deleted")).toString(),
            attributes: ["SUBMITDATETIME", "ORDERCONFIRMATIONDATE__", "OCNUMBER__", "COMMENT__", "VALIDATIONURL", "STATUS__"],
            sortOrder: "SubmitDateTime DESC",
            maxRecords: 100
        });
        if (queryResults.length > 0) {
            queryResults.forEach(function (oc) {
                const newItem = Controls.RelatedOrderConfirmationsTable__.AddItem();
                newItem.SetValue("OCItemOCDate__", oc["ORDERCONFIRMATIONDATE__"] || oc["SUBMITDATETIME"]);
                newItem.SetValue("OCItemOCNumber__", oc["OCNUMBER__"]);
                newItem.SetValue("OCItemComment__", oc["COMMENT__"]);
                newItem.SetValue("OCItemStatus__", Language.Translate(`_OCStatus_${oc["STATUS__"]}`));
                newItem.SetValue("OCItemValidationURL__", oc["VALIDATIONURL"]);
                newItem.SetValue("OCItemOpenButton__", Language.Translate("_OCButton_View"));
                onGoingOrderConfirmation[oc["STATUS__"]] = true;
            });
            function RefreshRow(row) {
                row.OCItemOpenButton__.DisplayAs({ type: "Link" });
                row.OCItemStatus__.DisplayAs({ type: "Link" });
            }
            Controls.RelatedOrderConfirmationsTable__.OnRefreshRow = (index) => {
                RefreshRow(Controls.RelatedOrderConfirmationsTable__.GetRow(index));
            };
            Sys.Helpers.Controls.ForEachTableRow(Controls.RelatedOrderConfirmationsTable__, (row) => {
                RefreshRow(row);
            });
            function OnClickOrderConfirmation() {
                const isDraft = this.GetRow().GetItem().GetValue("OCItemStatus__") === Language.Translate("_OCStatus_Draft");
                Process.OpenLink({
                    url: `${this.GetRow().GetItem().GetValue("OCItemValidationURL__")}&OnQuit=${isDraft ? "Back" : "Close"}`,
                    inCurrentTab: isDraft
                });
            }
            Controls.RelatedOrderConfirmationsTable__.OCItemOpenButton__.OnClick = OnClickOrderConfirmation;
            Controls.RelatedOrderConfirmationsTable__.OCItemStatus__.OnClick = OnClickOrderConfirmation;
            Controls.RelatedOrderConfirmationsPane.Hide(false);
        }
        else {
            Log.Info("No OC found for the given order number.");
        }
    }
    catch (error) {
        Log.Error(`Unhandled promise: ${error}.`);
    }
}
function OpenNewOrderConfirmation(OrderConfirmationCreationMode) {
    ProcessInstance.OpenInProcess({
        processName: "S2P - Order Confirmation Vendor",
        attachmentsMode: "none",
        willBeChild: true,
        returnToOriginalUrl: false,
        startWithoutProcessing: false, // we need to run this script in order to fill the line items
        externalVars: { OrderConfirmationCreationMode }
    });
    return false; // disable default button behavior => open a new instance of EditPORequest
}
function InvoiceThisOrder() {
    return Sys.Helpers.Promise.Create(function (resolve, reject) {
        const processInfo = {
            companyCode: Data.GetValue("CompanyCode__"),
            orderNumber: Data.GetValue("OrderNumber__"),
            vendorNumber: Data.GetValue("VendorNumber__")
        };
        const additionnalData = {};
        const contractNumber = Variable.GetValueAsString("ContractNumber");
        const ContractReference = Variable.GetValueAsString("ContractReference");
        if (contractNumber) {
            additionnalData.contractNumber = contractNumber;
            additionnalData.contractReference = ContractReference;
        }
        const isSelfServiceWorkEntryEnabled = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorPortal.HTMLScripts.IsSelfServiceWorkEntryEnabled");
        if (isSelfServiceWorkEntryEnabled) {
            additionnalData.customerOrderIdentifier = Data.GetValue("RuiDex");
        }
        if (!Sys.Helpers.Object.IsEmptyPlainObject(additionnalData)) {
            processInfo["additionnalData"] = additionnalData;
        }
        // Create Flip PO Instance
        Process.CreateProcessInstance("Flip PO", {}, {
            OrderToConvert: JSON.stringify(processInfo),
            OrderRuidEx: Data.GetValue("RuidEx")
        }, {
            callback: function (data) {
                if (data.error) {
                    reject(data.errorMessage);
                }
                else {
                    Log.Info("Process FlipPO created successfully");
                    // Retrieve CustomerInvoice process
                    const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CustomerInvoiceStatus__", "Draft"), Sys.Helpers.LdapUtil.FilterEqual("Source_RuidEx__", Data.GetValue("RuidEx")), Sys.Helpers.LdapUtil.FilterEqual("FlipPO_RuidEx__", data.ruid)).toString();
                    const retrieveCustomerInvoiceProcess = function (maxTries) {
                        setTimeout(function () {
                            Log.Info(`Trying to retrieve CustomerInvoice process... (${maxTries})`);
                            Query.DBQuery(function () {
                                const err = this.GetQueryError();
                                if (err) {
                                    reject(err);
                                }
                                else if (this.GetRecordsCount() > 0 && this.GetQueryValue("PORTALRUIDEX__", 0).length > 0) {
                                    // Process found
                                    Controls.InvoiceThisOrder__.SetDisabled(false);
                                    const previousRuidEx = Variable.GetValueAsString("GeneratedInvoiceRuidEx");
                                    const ruid = previousRuidEx ? `${previousRuidEx},${this.GetQueryValue("PORTALRUIDEX__", 0)}` : this.GetQueryValue("PORTALRUIDEX__", 0);
                                    Variable.SetValueAsString("GeneratedInvoiceRuidEx", ruid);
                                    resolve(ruid);
                                }
                                else if (maxTries > 0) {
                                    // Process not created yet
                                    retrieveCustomerInvoiceProcess(maxTries - 1);
                                }
                                else {
                                    // Max tries reached
                                    reject("reached max tries count");
                                }
                            }, "CDNAME#Customer Invoice", "PortalRuidEx__", filter, "SubmitDateTime DESC");
                        }, 1000);
                    };
                    retrieveCustomerInvoiceProcess(60);
                }
            }
        });
    });
}
function HasOngoingOrderUpdateRequest() {
    let hasOngoingOrderUpdateRequest = false;
    for (let index = 0; index < Controls.RelatedEditPORequestTable__.GetItemCount(); ++index) {
        const item = Controls.RelatedEditPORequestTable__.GetItem(index);
        const status = item.GetValue("Status__");
        if (status === Language.Translate("_EditPORequestStatus_Draft")
            || status === Language.Translate("_EditPORequestStatus_ToApprove")) {
            hasOngoingOrderUpdateRequest = true;
            break;
        }
    }
    return hasOngoingOrderUpdateRequest;
}
Main();
//# sourceMappingURL=customscript.js.map