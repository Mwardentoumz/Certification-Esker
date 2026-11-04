"use strict";
const addRecords = function (splitState, splitWSResponse, splitStateTabular) {
    let nbRecordAdded = 0;
    for (let i = 0; i < splitWSResponse.batch.length; i++) {
        if (splitStateTabular[i] < 3) {
            const inputData = splitWSResponse.batch[i];
            const validateData = {
                page_no: i + 1,
                split_state: splitStateTabular[i],
                batch_split_state: splitState
            };
            if (Sys.Helpers.Batch.createRecordForLearningStep(inputData, validateData, splitWSResponse.Model_Version, splitWSResponse.Model_Type)) {
                nbRecordAdded++;
            }
        }
    }
    Log.Info(`${nbRecordAdded} records added for the model ${splitWSResponse.Model_Version} associated to the document type ${splitWSResponse.Model_Type}`);
};
const runPostProcessing = function () {
    const splitWSResponse = Sys.Helpers.Batch.getWSResponse();
    if (splitWSResponse) {
        // Use ReadValue instead of Read because Read returns false when the feature has not been explicitly opted in
        // (i.e., no record exists in the database), whereas ReadValue returns the actual stored value.
        const batchSplittingV2Enabled = FeatureToggle.ReadValue("AllowMLBatchSplittingV2") !== "0";
        const generateUserActions = Variable.GetValueAsString("GenerateEmbeddingsForModelCreation") || "disable";
        const splitState = Data.GetValue("SplitState");
        const formState = Data.GetValue("State");
        let lengthSplitState = Document.GetPageCount() - 1;
        if (splitWSResponse.batch)
            lengthSplitState = splitWSResponse.batch.length;
        const splitStateTabular = Sys.Helpers.Batch.buildTabularSplitState(splitState, lengthSplitState);
        if ((batchSplittingV2Enabled || generateUserActions.toLowerCase() == "enable") && splitState && formState === 100) {
            const currentModelType = Variable.GetValueAsString("model_type") || "INVOICE";
            if (splitWSResponse.Model_Type === currentModelType) {
                addRecords(splitState, splitWSResponse, splitStateTabular);
            }
            else {
                Log.Warn(`The model type during prediction was ${splitWSResponse.Model_Type} whereas the current model type is ${currentModelType}`);
            }
        }
        let nbExpectedPagesToMerge = 0;
        let nbExpectedPagesToSplit = 0;
        let nbExpectedPagesAsAttachment = 0;
        for (let i = 0; i < lengthSplitState; i++) {
            if (splitStateTabular[i] < 3) {
                if (splitStateTabular[i] === 0)
                    nbExpectedPagesToMerge++;
                else if (splitStateTabular[i] === 1)
                    nbExpectedPagesToSplit++;
                else if (splitStateTabular[i] === 2)
                    nbExpectedPagesAsAttachment++;
            }
        }
        Data.SetValue("nbExpectedPagesToMerge__", nbExpectedPagesToMerge);
        Data.SetValue("nbExpectedPagesToSplit__", nbExpectedPagesToSplit);
        Data.SetValue("nbExpectedPagesAsAttachment__", nbExpectedPagesAsAttachment);
    }
};
runPostProcessing();
//# sourceMappingURL=postprocessingscript.js.map