"use strict";
const runValidationScript = function () {
    const currentModel = Data.GetValue("ModelName__");
    if (!currentModel) {
        const splitWSResponse = Sys.Helpers.Batch.getWSResponse();
        if (splitWSResponse) {
            let lengthSplitState = Document.GetPageCount() - 1;
            if (splitWSResponse.batch)
                lengthSplitState = splitWSResponse.batch.length;
            Data.SetValue("ModelName__", splitWSResponse.ModelID);
            Data.SetValue("splitStateLength__", lengthSplitState);
            let nbPredictedPagesToMerge = 0;
            let nbPredictedPagesToSplit = 0;
            let nbPredictedPagesAsAttachment = 0;
            if (lengthSplitState < 1)
                lengthSplitState = Document.GetPageCount() - 1;
            const splitStateTabular = Sys.Helpers.Batch.buildTabularSplitState(splitWSResponse.splitstate, lengthSplitState);
            for (let i = 0; i < lengthSplitState; i++) {
                if (splitStateTabular[i] === 0)
                    nbPredictedPagesToMerge++;
                else if (splitStateTabular[i] === 1)
                    nbPredictedPagesToSplit++;
                else if (splitStateTabular[i] === 2)
                    nbPredictedPagesAsAttachment++;
            }
            Data.SetValue("nbPredictedPagesToMerge__", nbPredictedPagesToMerge);
            Data.SetValue("nbPredictedPagesToSplit__", nbPredictedPagesToSplit);
            Data.SetValue("nbPredictedPagesAsAttachment__", nbPredictedPagesAsAttachment);
        }
    }
};
runValidationScript();
//# sourceMappingURL=validationscript.js.map