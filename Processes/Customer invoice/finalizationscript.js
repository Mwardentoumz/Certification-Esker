"use strict";
function resetAreas() {
    for (let i = 0; i < Data.GetNbFields(); i++) {
        const fieldName = Data.GetFieldName(i);
        if (Data.GetArea(fieldName)) {
            Data.SetValue(fieldName, Data.GetValue(fieldName));
        }
    }
}
function submitVIP() {
    try {
        const VIPTransportRuidEx = Transaction.Read("VIPTransportRuidEx");
        if (VIPTransportRuidEx) {
            Data.SetValue("VIRuidEx__", VIPTransportRuidEx);
        }
        else if (!Lib.AP.VendorPortal.CreateVIPTransport()) {
            throw "";
        }
        const vendorUserId = Data.GetValue("OwnerID");
        const viRuidEx = Data.GetValue("VIRuidEx__");
        Lib.AP.VendorPortal.InitiateConversationWithVIP(vendorUserId, viRuidEx);
    }
    catch (exception) {
        Log.Error("An error occured while sending invoice to the billed entity");
        throw Language.Translate("_An error occured while sending invoice to the billed entity");
    }
}
/**
 * Extend the validity date time by 16 months when the invoice is submitted to the internal user
 * @returns
 */
function extendValidityDateTime() {
    const validityDT = Data.GetValue("SubmitDateTime");
    validityDT.setMonth(validityDT.getMonth() + 16);
    Data.SetValue("ValidityDateTime", validityDT);
}
function finalization() {
    // Try to publish the VIP and update the status of the invoice
    // If the VIP is not published, the invoice will remain in draft status
    if (Lib.AP.VendorPortal.Status.IsDraft()) {
        submitVIP();
        // When the VIP is published, update the status of the invoice accordingly
        Data.SetValue("CustomerInvoiceStatus__", Lib.AP.CIStatus.AwaitingReception);
        // Reset capture area to avoid mismatch when the field values are updated when the APSpecialist verifies the invoice
        // (waiting to be able to update areas as well as values).
        resetAreas();
        // Make sure the customer invoice does not expire if AP workflow takes more than 2 months
        extendValidityDateTime();
        Process.WaitForUpdate();
    }
    // Wait for workflow to finish
    else if (Lib.AP.VendorPortal.Status.IsAwaitingInternalValidation()) {
        Log.Info(`Wait for workflow to complete before closing invoice (status: ${Lib.AP.VendorPortal.Status.GetValue()})`);
        // Make sure the customer invoice does not expire if AP workflow takes more than 2 months
        extendValidityDateTime();
        Process.WaitForUpdate();
    }
    else if (Lib.AP.VendorPortal.Status.IsRejected()) {
        // force state to Rejected when created as Rejected from the VIP or auto-rejected from the VIP
        Log.Info("Created as Rejected or auto-rejected");
        Data.SetValue("State", 400);
    }
    // When invoice is awaiting payment or paid, archive it
    else {
        Log.Info(`Workflow is complete (status: ${Lib.AP.VendorPortal.Status.GetValue()}), archive invoice`);
    }
}
finalization();
//# sourceMappingURL=finalizationscript.js.map