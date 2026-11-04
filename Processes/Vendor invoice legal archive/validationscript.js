"use strict";
function actionTryFiscalArchiving() {
    Variable.SetValueAsString("ArchiveProvider", Data.GetValue("ArchiveProvider"));
    if (Sys.Parameters.GetInstance("AP").GetParameter("isArkhineoConf")) {
        //Do not execute old fiscal archiving action
        Data.SetValue("ArchiveProvider", "");
        Data.SetValue("ArchiveProviderSolution", "");
        Variable.SetValueAsString("ArchiveProvider", "");
        const vault = {
            user: Sys.Parameters.GetInstance("AP").GetParameter("userArkhineo"),
            password: Sys.Parameters.GetInstance("AP").GetParameter("passwordArkhineo"),
            cfeId: Sys.Parameters.GetInstance("AP").GetParameter("cfeId"),
            sectionId: Sys.Parameters.GetInstance("AP").GetParameter("sectionId")
        };
        const ArkhineoMetaData = {
            applicative: Variable.GetValueAsString("ArkhineoMetaDataApplicative") ? JSON.parse(Variable.GetValueAsString("ArkhineoMetaDataApplicative")) : null,
            descriptive: Variable.GetValueAsString("ArkhineoMetaDataDescriptive") ? JSON.parse(Variable.GetValueAsString("ArkhineoMetaDataDescriptive")) : null
        };
        const httpResult = Attach.ArchiveToArkhineo(0, vault, ArkhineoMetaData);
        const lastStatus = httpResult.status;
        const lastMessage = httpResult.lastMessage;
        Data.SetValue("ArchivingStatus__", lastMessage);
        if (lastStatus !== 201) {
            Data.SetValue("ArchiveUniqueIdentifier__", "");
            Data.SetValue("LinkToArchive__", "");
            const errorMessage = `Arkhineo WS call status: ${lastStatus} and error: ${lastMessage}`;
            //ValidationScriptAllowRetry = true
            Data.SetValue("State", 200);
            Data.SetValue("StatusCode", 200);
            Data.SetValue("ShortStatusTranslated", lastMessage);
            Data.SetValue("ShortStatus", lastMessage);
            Data.SetValue("LongStatus", errorMessage);
            Data.SetValue("CompletionDateTime", new Date());
        }
        else {
            const xmlContent = httpResult.responseData;
            const dom = Process.CreateXMLDOMElement(xmlContent);
            const arkhineoIdentifier = dom.getAttribute("archive-id");
            Data.SetValue("ArchiveUniqueIdentifier__", arkhineoIdentifier);
            Data.SetValue("LinkToArchive__", "https://pwd.arkhineo.fr/cfes/archives/" + arkhineoIdentifier);
        }
    }
    else {
        Log.Info("No custom arkhineo vault: Old method.");
    }
}
/** ******** **/
/** RUN PART **/
/** ******** **/
function executeRequestedAction() {
    if (!Data.GetValue("ArchiveUniqueIdentifier__")) {
        const currentName = Process.AutoValidatingOnExpiration() ? "onexpiration" : Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info(`Action: ${currentAction ? currentAction : "<empty>"}, Name: ${currentName ? currentName : "<empty>"}, Device: ${Data.GetActionDevice()}`);
        /* Action map to specify what to do according to the Action Name. The validation, if needed, will always be executed synchronously.
            The action in itself can be executed asynchronously.
        key: action name given by Data.GetActionName(). The empty string key means that no user action was ever performed on this form (submission)
        value : object
        - execute: function to call
        - requireValidation: set to true if you want the action to validate data
        - isAsync: set to true if the action should be executing asynchronously
        - leaveForm (only if isAsync is false): set to true if the form should be closed at the end of the action
        - keepScheduledActionParameters : set to true if you want to keep the values of the fields ScheduledActionDate and ScheduledAction after the validation action.
        */
        const approveActionMap = {};
        approveActionMap[""] = { "execute": actionTryFiscalArchiving, "requireValidation": false, "leaveForm": false };
        let action = approveActionMap[currentName.toLowerCase()];
        if (!action) {
            action = approveActionMap[""];
        }
        // Execute action now
        action.execute();
        Process.LeaveForm();
    }
}
function run() {
    Data.SetValue("IndexingBehavior", 0); //Do not index attachment for Full Text Search in archive
    executeRequestedAction();
}
run();
//# sourceMappingURL=validationscript.js.map