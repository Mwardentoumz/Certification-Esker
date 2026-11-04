"use strict";
function RefreshPreview() {
    Log.Info("[RefreshPreview]");
    Lib.Shipping.PackingSlipGen.ReAttachPackingSlip()
        .Catch(reason => {
        if (!(reason instanceof Lib.Shipping.PackingSlipGen.PackingSlipGenError)) {
            Log.Error(`[RefreshPreview] unexpected error: ${reason}`);
        }
        Lib.CommonDialog.NextAlert.Define("_RefreshPreview_ErrorTitle", "_RefreshPreview_ErrorMessage", { isError: true });
    })
        .Then(() => {
        Process.PreventApproval();
    });
}
function Save() {
    const refreshPreviewNeeded = Sys.Helpers.Data.IsTrue(Sys.TechnicalData.GetValue("GeneratedPDFFromData"));
    if (refreshPreviewNeeded) {
        // Save the record in DB to have it and ask for preview refresh asynchronously
        Process.RecallScript("RefreshPreview__", true);
    }
    else {
        Process.PreventApproval();
    }
}
function checkRemainingQuantities() {
    const checkLines = [];
    let hasError = false;
    let hasQuantityBeenUpdatedInError = false;
    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
        checkLines.push(Lib.Shipping.GetRemainingQuantityToShip(line).Then(quantityToShip => {
            const actualItemQuantityToShip = line.GetValue("ItemQuantityToShip__");
            line.SetValue("ItemQuantityToShip__", quantityToShip);
            if (line.GetValue("ItemQuantity__") > quantityToShip) {
                line.SetError("ItemQuantity__", Language.Translate("_Max shippable quantity exceeded", true, quantityToShip));
                hasError = true;
                if (actualItemQuantityToShip !== quantityToShip) {
                    hasQuantityBeenUpdatedInError = true;
                }
            }
            else {
                line.SetError("ItemQuantity__", "");
            }
        }));
    });
    return Sys.Helpers.Promise.All(checkLines).Then(() => {
        if (hasQuantityBeenUpdatedInError) {
            Lib.CommonDialog.NextAlert.Define("_Shippable quantity changed title", "_Shippable quantity changed message");
        }
        return hasError;
    });
}
function Run() {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info(`-- Advanced Shipping Notice Vendor Validation Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}' , Device: '${Data.GetActionDevice()}`);
    Lib.P2P.SetTablesToIndex(["LineItems__"]);
    // Validation after extracting
    if ((!currentName && !currentAction) || currentAction === "reprocess" || currentAction === "autocomplete") {
        Lib.Shipping.Vendor.GeneratePreview();
    }
    else if (currentAction === "approve" || currentAction === "ResumeWithAction") {
        Lib.CommonDialog.NextAlert.Reset();
        switch (currentName) {
            case "Save":
                checkRemainingQuantities().Then(Save);
                break;
            case "Submit":
                checkRemainingQuantities().Then(hasError => {
                    if (!hasError) {
                        Lib.Shipping.Vendor.Submit();
                    }
                });
                break;
            case "RefreshPreview__":
                RefreshPreview();
                break;
            case "DownloadPreviewRPTDataFile":
                Lib.Shipping.Validation.PrepareDownloadablePreviewRPTDataFile();
                break;
            default:
                Process.PreventApproval();
                break;
        }
    }
}
Run();
//# sourceMappingURL=validationscript.js.map