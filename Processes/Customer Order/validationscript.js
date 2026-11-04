"use strict";
const currentActionName = Data.GetActionName();
const currentActionType = Data.GetActionType();
Log.Info(`-- CO Validation Script -- Name: '${currentActionName ? currentActionName : "<empty>"}', Action: '${currentActionType ? currentActionType : "<empty>"}'`);
if (!currentActionName) {
    const login = Variable.GetValueAsString("VendorLogin");
    Log.Info(`First validation - forward to vendor '${login}'`);
    Process.Forward(login);
    // assign Business partner ID for multi vendor portal if not set
    if (!Data.GetValue("BusinessPartnerID__")) {
        const user = Users.GetUser(login);
        if (user && user.GetValue("Vendor") === "1") {
            Data.SetValue("BusinessPartnerID__", user.GetValue("BusinessPartnerID"));
        }
    }
    Process.LeaveForm();
}
else if (currentActionType === "approve" && currentActionName === "Confirm") {
    const confirmationDateTime = new Date();
    const poRUIDEx = Variable.GetValueAsString("PORUIDEX");
    Log.Info(`Update Purchase Order with ID: ${poRUIDEx} for confirmation`);
    try {
        const purchaseOrder = Process.GetUpdatableTransportAsProcessAdmin(poRUIDEx);
        const vars = purchaseOrder.GetUninheritedVars();
        vars.AddValue_Date("ConfirmationDatetime__", confirmationDateTime, true);
        purchaseOrder.Process();
        Log.Info("Purchase order updated successfully.");
        // Publish confirmation on the current conversation
        Lib.P2P.AddConversationItem(Language.Translate("_CustomerOrderAccepted"), Lib.Purchasing.SenderType.IsSupplier, Lib.Purchasing.ConversationTypes.DefaultTechnical, true, Data.GetValue("Sales_Order_Number__"));
        // Update the confirmation datetime
        Log.Info(`Setting 'ConfirmationDatetime__' to '${confirmationDateTime}'`);
        Data.SetValue("ConfirmationDatetime__", confirmationDateTime);
    }
    catch (e) {
        Log.Info("Failed to update purchase order: " + e);
        Lib.CommonDialog.NextAlert.Define("_PO update error", "_UpdatePOfailed");
        Process.PreventApproval();
    }
}
else if (currentActionName === "Reject") {
    const rejectionDate = new Date();
    const rejectionReason = Variable.GetValueAsString("RejectionReason");
    Log.Info("Rejecting Customer Order at " + rejectionDate);
    try {
        Data.SetValue("State", 400);
        Data.SetValue("RejectionDatetime__", rejectionDate);
        Data.SetValue("RejectionReason__", rejectionReason);
        Lib.P2P.AddConversationItem(Language.Translate("_CustomerOrderRejected", false, rejectionReason), Lib.Purchasing.SenderType.IsSupplier, Lib.Purchasing.ConversationTypes.DefaultTechnical, true, Data.GetValue("Sales_Order_Number__"));
        const poRUIDEx = Variable.GetValueAsString("PORUIDEX");
        Log.Info(`Resume Purchase Order with ID: ${poRUIDEx} for Rejection`);
        const purchaseOrder = Process.GetUpdatableTransportAsProcessAdmin(poRUIDEx);
        const POExternalVars = purchaseOrder.GetExternalVars();
        POExternalVars.AddValue_String("resumeWithActionData", JSON.stringify({
            "RejectionDatetime__": rejectionDate,
            "RejectionReason__": rejectionReason
        }), true);
        purchaseOrder.ResumeWithActionAsync("Reject");
    }
    catch (e) {
        Log.Info("Failed to reject purchase order: " + e);
        Lib.CommonDialog.NextAlert.Define("_PO update error", "_UpdatePOfailed");
        Process.PreventApproval();
    }
}
else if (currentActionName === "ConfirmFromOC") {
    const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
    Log.Info(`Setting 'ConfirmationDatetime__' to '${data.confirmationDate}'`);
    Data.SetValue("ConfirmationDatetime__", new Date(data.confirmationDate)); // To convert ISO string (UTC) to Date
}
else if (currentActionName === "RejectFromOC") {
    const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
    Log.Info(`Rejecting Customer Order at ${data.rejectionDate}`);
    Data.SetValue("State", 400);
    Data.SetValue("RejectionDatetime__", new Date(data.rejectionDate)); // To convert ISO string (UTC) to Date
    Data.SetValue("RejectionReason__", data.rejectionReason);
}
else if (currentActionName === "SynchronizeCustomOrder") {
    const poRUIDEx = Variable.GetValueAsString("PORUIDEX");
    const purchaseOrder = Lib.P2P.QueryPurchasingTransport("Purchase order", Sys.Helpers.LdapUtil.FilterEqual("RuidEx", poRUIDEx).toString(), "*", true);
    const attachList = purchaseOrder.GetAttachs(false);
    if (attachList === null || attachList === void 0 ? void 0 : attachList.GetNbAttachs()) {
        const attach = attachList.GetAttach(0);
        const attachVars = attach.GetVars();
        if (Attach.AttachTemporaryFile(attach.GetConvertedFile() || attach.GetInputFile(), {
            name: attachVars.GetValue_String("AttachOutputName", 0),
            attachAsFirst: true
        })) {
            const type = attachVars.GetValue("Purchasing_DocumentType", 0);
            Attach.SetValue(0, "Purchasing_IsPO", type === "PO");
        }
        else {
            Log.Error("Error attaching purchase order: " + attachVars.GetValue_String("AttachOutputName", 0));
        }
    }
    Process.PreventApproval();
}
//# sourceMappingURL=validationscript.js.map