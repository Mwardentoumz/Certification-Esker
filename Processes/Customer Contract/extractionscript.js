"use strict";
// Load Parameter in extractionScript to avoid access issue from HTML customerScript.
var ExtractionScript;
(function (ExtractionScript) {
    function Run() {
        const companyCodeBeforeSynchronization = Data.GetValue("CompanyCode");
        const companyCode = Data.GetValue("CompanyCode__");
        if (companyCode) {
            Lib.P2P.CompanyCodesValue
                .QueryValues(companyCode, { asAdmin: true })
                .Then(function (CCValues) {
                if (Object.keys(CCValues).length > 0) {
                    Lib.P2P.ChangeConfiguration(CCValues.DefaultConfiguration__);
                    Variable.SetValueAsString("CustomerCompany", CCValues.CompanyName__);
                }
                else {
                    Log.Error("The requested company code is not in the company code table.");
                }
            })
                .Then(() => {
                // Must be done when the configuration is loaded
                Lib.P2P.InitValidityDateTime("PAC");
                Lib.P2P.InitArchiveDuration("PAC", "ContractArchiveDurationPortalInMonths");
            });
        }
    }
    ExtractionScript.Run = Run;
    function GetReferenceDocumentIndex() {
        const nbAttach = Attach.GetNbAttach();
        // Parse attachments, and compute total size
        for (let i = 0; i < nbAttach; i++) {
            if (Attach.IsProcessedDocument(i))
                return i;
        }
        return 0;
    }
    function attachOriginalDocxIfNeeded() {
        const DOCX_EXTENSION = ".docx";
        const PDF_EXTENSION = ".pdf";
        if (Attach.GetNbAttach() === 0) {
            return;
        }
        const refDocIdx = GetReferenceDocumentIndex();
        const inputFile = Attach.GetInputFile(refDocIdx);
        if ((inputFile === null || inputFile === void 0 ? void 0 : inputFile.GetExtension().toLowerCase()) === DOCX_EXTENSION) {
            const originalDocxName = Attach.GetName(refDocIdx);
            const mainDocumentBaseName = originalDocxName.toLowerCase().endsWith(DOCX_EXTENSION)
                ? originalDocxName.slice(0, -DOCX_EXTENSION.length)
                : originalDocxName;
            Attach.SetValue(refDocIdx, "AttachOutputName", mainDocumentBaseName);
            Attach.SetValue(refDocIdx, "AttachOutputFormat", PDF_EXTENSION);
            Log.Info(`DOCX document detected, attaching original file '${originalDocxName}' as attachment`);
            Attach.AttachTemporaryFile(inputFile, originalDocxName);
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        attachOriginalDocxIfNeeded();
        Run();
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map