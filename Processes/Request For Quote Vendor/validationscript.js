"use strict";
var ValidationScript;
(function (ValidationScript) {
    const scriptAction = Lib.P2P.GetScriptAction("Request For Quote Vendor");
    if (!scriptAction.name) {
        const login = Variable.GetValueAsString("VendorLogin");
        Log.Info(`First validation - forward to vendor '${login}'`);
        Process.AddRight(Data.GetValue("RequesterID__"), "read");
        Process.Forward(login);
        Process.DisableChecks();
        Process.LeaveForm();
    }
    else if (scriptAction.name === "Save_") {
        Lib.Sourcing.DocumentsTable.HandleAttachementModifications();
        Process.PreventApproval();
    }
    else if (scriptAction.name === "TerminateRFQ") {
        Log.Info("Terminating RFQ Vendor");
        Data.SetValue("RFQStatus__", "Closed" /* Lib.Sourcing.RFQVendorStatus.Closed */);
        Process.DisableChecks();
        //EndProcess
    }
    else if (scriptAction.name === "EditRFQ") {
        Log.Info("Edit RFQ Vendor");
        const messageOptions = JSON.parse(Variable.GetValueAsString(Lib.Sourcing.Conversation.MessageOptionsVariable));
        const sender = Users.GetUserAsProcessAdmin(messageOptions.senderLogin);
        Lib.Sourcing.Conversation.AddItem(messageOptions.message, {
            senderType: "IsCustomer" /* Lib.Sourcing.Conversation.SenderType.IsCustomer */,
            conversationID: messageOptions.conversationID,
            item: {
                asUser: sender,
                emailCustomTags: {
                    SupplierName__: sender.GetValue("DisplayName")
                }
            }
        });
        Variable.SetValueAsString(Lib.Sourcing.Conversation.MessageOptionsVariable, "");
        Process.DisableChecks();
        Process.PreventApproval();
    }
    else {
        // Script actions that requires synchronizing with the requester quote request
        const updateDate = new Date();
        Data.SetValue("LastUpdateDatetime__", updateDate);
        const rfqRuidex = Data.GetValue("RFQRUIDEX__");
        try {
            const originalRFQ = Process.GetUpdatableTransportAsProcessAdmin(rfqRuidex);
            originalRFQ.GetUninheritedVars().AddValue_String("IsUnique", "1", true);
            Lib.Sourcing.DocumentsTable.HandleAttachementModifications();
            if (scriptAction.name === "Reject") {
                const rejectionReason = Variable.GetValueAsString("RejectionReason");
                Log.Info("Rejecting RFQ Vendor at " + updateDate);
                Data.SetValue("RejectionReason__", rejectionReason);
                Data.SetValue("RFQStatus__", "Rejected" /* Lib.Sourcing.RFQVendorStatus.Rejected */);
                Log.Info(`Resume RFQ with ID: ${rfqRuidex} for Rejection`);
                originalRFQ.ResumeWithActionAsync("Synchronize");
                Process.Reject();
                Process.DisableChecks();
                Process.LeaveForm();
            }
            else if (scriptAction.name === "Submit") {
                Log.Info("Submitting RFQ Vendor at " + updateDate);
                Data.SetValue("RFQStatus__", "Pending evaluation" /* Lib.Sourcing.RFQVendorStatus.PendingEvaluation */);
                Log.Info(`Resume RFQ with ID: ${rfqRuidex} for Submission`);
                originalRFQ.ResumeWithActionAsync("Synchronize");
                Process.WaitForUpdate();
                Process.LeaveForm();
            }
        }
        catch (e) {
            Log.Info("Failed to synchronize RFQ: " + e);
            Lib.CommonDialog.NextAlert.Define("_RFQ update error", "_UpdateRFQFailed");
            Process.PreventApproval();
        }
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map