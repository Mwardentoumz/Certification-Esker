"use strict";
Lib.Purchasing.RA.Batch.PrepareImportJson()
    .Then(function (extractedData) {
    Lib.Purchasing.RA.Batch.SetExternalData(extractedData);
    Variable.SetValueAsString("IsRASubmitable", true);
});
//# sourceMappingURL=extractionscript.js.map