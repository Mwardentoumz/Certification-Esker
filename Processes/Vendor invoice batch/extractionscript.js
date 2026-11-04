"use strict";
const runExtraction = function () {
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnBatchExtractionScriptBegin");
    // Set the subject of the form
    Data.SetValue("Subject", Language.Translate("_Received file: {0}", false, Document.GetName()));
    // Set the splitting recipient
    const nextProcessid = Process.GetNextProcessID();
    if (nextProcessid) {
        Data.SetValue("SplitToProcessId", nextProcessid);
        handleSplitOwner();
    }
    // Serialize the configuration on the record
    Sys.Parameters.GetInstance("P2P").Serialize();
    Sys.Parameters.GetInstance("AP").Serialize();
    handleSplitAndValidation();
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.OnBatchExtractionScriptEnd");
};
function handleSplitOwner() {
    if (Data.GetValue("OriginalJobID")) {
        setSplitToOwner(Users.GetUser(Data.GetValue("OwnerId")));
    }
    else {
        let specificVendorInvoiceOwner = Variable.GetValueAsString("VendorInvoiceOwner");
        if (specificVendorInvoiceOwner) {
            specificVendorInvoiceOwner = Lib.P2P.ResolveDemoLogin(specificVendorInvoiceOwner);
            Log.Info(`'VendorInvoiceOwner' variable set to '${specificVendorInvoiceOwner}', forwarding process and setting 'SplitToOwner' to this owner.`);
            Process.Forward(specificVendorInvoiceOwner);
            setSplitToOwner(Users.GetUser(specificVendorInvoiceOwner));
        }
        else {
            const nextProcessUser = Process.GetNextProcessUser();
            if (nextProcessUser) {
                setSplitToOwner(nextProcessUser);
            }
        }
    }
}
function handleSplitAndValidation() {
    const nPages = Document.GetPageCount();
    const nPagesMinimum = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.DetermineMinimumPageCountToSplit") || 1;
    let isTxtFile = false;
    if (nPages > nPagesMinimum) {
        let fileName = Attach.GetAttachFileName(0);
        if (fileName) {
            fileName = fileName.toLocaleLowerCase();
            isTxtFile = fileName.endsWith(".txt");
        }
        else {
            // Legacy code
            const processedDoc = Attach.GetProcessedDocument();
            if (processedDoc) {
                const processedFile = processedDoc.GetInputFile();
                const ext = processedFile.GetExtension().toLowerCase();
                isTxtFile = ext === ".txt";
            }
        }
    }
    if (nPages <= nPagesMinimum || isTxtFile) {
        Log.Info(`${isTxtFile ? "Txt file" : "Single page"} - auto approve (pages=${nPages})`);
        // No split required
    }
    else {
        Log.Info(`Multiple pages - splitting required (pages=${nPages})`);
        Data.SetValue("Split", 1);
        Data.SetValue("NeedValidation", 1);
    }
}
function setSplitToOwner(user) {
    Data.SetValue("SplitToOwnerID", user.GetValue("FullDn"));
    Data.SetValue("SplitToOwnerPB", user.GetValue("OwnerPB"));
}
runExtraction();
//# sourceMappingURL=extractionscript.js.map