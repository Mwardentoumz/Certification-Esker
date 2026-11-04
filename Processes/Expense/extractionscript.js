"use strict";
/* Expense extraction script */
var ExtractionScript;
(function (ExtractionScript) {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info("-- Expense Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
    async function Run() {
        // Reset the field TechnicalData of SubmitValuesToRestore fill by card transaction in case of futur reprocess
        Data.SetValue("_SubmitValuesToRestore/TechnicalData__", null);
        Data.SetValue("ArchiveBehavior", "30"); // Do not archive Source Document.
        // When the process is created from an inbound channel, SourceRUID can be
        // Email inbound channel (ISM.XXXXX) or Email preprocessing (CD#XXXXX)
        let sourceRUID = Data.GetValue("SourceRuid");
        if (sourceRUID) {
            Log.Info("Expense created from: " + sourceRUID + ", email: " + Data.GetValue("FromAddress"));
            let currentUser = Users.GetUser(Data.GetValue("OwnerId"));
            Data.SetValue("OwnerName__", currentUser.GetValue("DisplayName"));
            Lib.Expense.LoadUserProperties(currentUser.GetValue("Login"));
        }
        if (Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableAIForExpenses", false) && Variable.GetValueAsString("TurnOffExtraction") != "yes" && !Lib.Expense.Itemization.IsItemized()) {
            // The last version on 09/2021: V2. Old users continue to use V1
            const ver = Sys.Parameters.GetInstance("P2P").GetParameterNumber("ExpenseAIVersion", 1);
            let url;
            if (ver === 1) {
                url = "AIForExpenses:GuessContent";
            }
            else if (ver === 3) {
                url = "AIForExpensesV3:GuessContent";
            }
            else {
                url = "AIForExpensesV2:GuessContent";
            }
            let predictionJson = Sys.Expense.Extraction.QueryExtraction(url, Attach.GetGDRDataFile());
            Lib.Expense.AIForExpenses.FillExpenseWithPredictions(predictionJson)
                .Then((controls) => Lib.Expense.UpdateControl(controls))
                .Catch(error => {
                if (!(error instanceof Sys.Helpers.Promise.HandledError)) {
                    Log.Error(`unexpected error: ${error}`);
                }
            });
        }
        await Lib.Expense.Server.InitExpenseFromTechnicalData();
        Sys.Helpers.TryCallFunction("Lib.Expense.Customization.Server.OnExtractionScriptEnd");
    }
    ExtractionScript.Run = Run;
    Run();
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map