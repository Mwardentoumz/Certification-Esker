"use strict";
var ValidationScript;
(function (ValidationScript) {
    ValidationScript.workflow = Lib.Contract.Workflow.Controller;
    const contractSpendingHandler = new Lib.Spending.Contract.Handler();
    const contractHandler = new Lib.Contract.Handler(new Lib.P2P.DataHandler());
    function Save() {
        // The standard Save action does not save the EDDMessageVars, in our case ValidityDateTime
        // --> use Approve action + PreventApproval
        Process.PreventApproval();
    }
    function OnAmendContract() {
        if (CanAmendContract()) {
            contractHandler.SetDeprecated();
        }
        else {
            Log.Error("Can't amend contract, contract is not in a good state");
        }
    }
    async function OnUpdateContract() {
        if (CanUpdateContract()) {
            await EnsureStatusAndDateCoherency();
        }
        else {
            Log.Error("Can't update contract, contract is not in a good state");
        }
    }
    function OnSetDocusignEnvelopeID() {
        const docusignInformations = Lib.Contract.Docusign.GetDocuSignInformations();
        Data.SetValue("EnvelopeCreationDateTime__", new Date(docusignInformations.envelope.createdDateTime));
        Lib.Contract.Docusign.SaveOptionsInDB(Data.GetValue("RuidEx"), docusignInformations.envelope, docusignInformations.signers);
        Lib.P2P.Docusign.DeleteTransaction("DocusignEnvelope");
        Process.WaitForUpdate();
    }
    async function OnBypassSignature() {
        Data.SetValue("EnableContractSignature__", false);
        const signatureId = Data.GetValue("SignatureId__");
        if (signatureId) {
            Lib.P2P.Docusign.DiscardEnvelope(signatureId);
        }
        await Lib.Contract.Workflow.OnWorkflowEnd();
    }
    async function OnCheckSignature() {
        if (Lib.Contract.Docusign.CanUpdateWithDocusign()) {
            const docusignInformations = Lib.Contract.Docusign.GetDocuSignInformations();
            Lib.Contract.Docusign.SaveOptionsInDB(Data.GetValue("RuidEx"), docusignInformations.envelope, docusignInformations.signers);
            await Lib.Contract.Docusign.UpdateContractWithDocusign(docusignInformations);
        }
        else {
            Log.Error("Can't update contract with docusign");
        }
    }
    async function OnSaveChanges() {
        await ChangeContractOwner();
        ChangeContractName();
        await Lib.Contract.Spending.UpdateWithNewContract((spending, max) => { var _a; return (_a = contractSpendingHandler.ComputeRemainingForSteps(spending, max)) === null || _a === void 0 ? void 0 : _a.toNumber(); });
        Lib.Contract.Notification.SaveFromExternalVariable();
        if (CanUpdateContract()) {
            await EnsureStatusAndDateCoherency();
        }
    }
    async function OnModifyContract() {
        if (ValidationScript.workflow.GetContributorIndex() > 0) {
            await ValidationScript.workflow.DoAction(Lib.Contract.Workflow.Parameters.actions.modifyContract.GetName());
        }
    }
    async function OnShare() {
        const advisorLogin = Variable.GetValueAsString("AdvisorLogin");
        if (advisorLogin) {
            await ValidationScript.workflow.DoAction(Lib.Contract.Workflow.Parameters.actions.share.GetName());
        }
    }
    async function OnBackToRequester() {
        DiscardEnvelope();
        if (ValidationScript.workflow.IsEnded()) {
            ValidationScript.workflow.Reopen();
            Log.Info("Contract workflow reopened");
            Lib.Contract.Workflow.AddSendBackUserToWorkflow();
        }
        await ValidationScript.workflow.DoAction(Lib.Contract.Workflow.Parameters.actions.sentBack.GetName());
    }
    async function OnApproveForward() {
        await ValidationScript.workflow.DoAction(Lib.Contract.Workflow.Parameters.actions.forward.GetName());
        Variable.SetValueAsString("AdditionalContributors", JSON.stringify({}));
    }
    async function OnVendorRegistrationApproved() {
        try {
            await Lib.Contract.UpdateContractDataWithVendorRegistrationData();
            await ValidationScript.EnsureStatusAndDateCoherency();
        }
        catch (error) {
            Log.Error(`Error during VendorRegistrationApproved: ${error}`);
        }
    }
    async function OnVendorRegistrationRejected() {
        try {
            const registrationRejectUser = await Lib.Contract.UpdateContractDataWithVendorRegistrationData();
            if (!Sys.Helpers.IsEmpty(registrationRejectUser) && Data.GetValue("ContractStatus__") !== Lib.Contract.Status.Draft) {
                Lib.Contract.Workflow.RestartWorkflowFollowingRegistrationRejected(registrationRejectUser);
            }
        }
        catch (error) {
            Log.Error(`Error during VendorRegistrationRejected: ${error}`);
        }
    }
    async function OnTestContractPrompt() {
        try {
            const OCRText = Lib.Contract.OCR.GetDocumentText();
            await Lib.Contract.Policies.FraudulentClauses.QueryChatGPT(OCRText);
            Process.PreventApproval();
        }
        catch (e) {
            Log.Error(`Error during call on chat GPT : ${e}`);
        }
    }
    function OnPublishContract() {
        if (!Lib.Contract.Publication.CanPublishContractOnPortal()) {
            throw new Error("Can't publish contract, contract is not in a good state");
        }
        Lib.Contract.Publication.PublishContractOnPortal();
        Process.PreventApproval();
    }
    async function OnResetSignature() {
        DiscardEnvelope();
        await ResetESignatureOptions();
        Process.WaitForUpdate();
    }
    async function HandleDocusignEvent(currentName) {
        switch (currentName) {
            case "DocusignEvent_sent":
            case "DocusignEvent_send": // from webaccess when docusign tab is closed.
                Lib.Contract.Docusign.OnDocusignSend();
                break;
            case "DocusignEvent_completed":
                await Lib.Contract.Docusign.OnDocusignCompleted();
                break;
            case "DocusignEvent_declined": //Reject message
            case "DocusignEvent_timedout":
            case "DocusignEvent_voided":
                Lib.Contract.Docusign.OnDocusignReject();
                break;
            default:
                Process.WaitForUpdate();
        }
    }
    async function HandleAction(currentName, currentAction) {
        if (Lib.Contract.SetContractNumber()) {
            await Lib.Contract.CreateLinkToProjectBySourcingEventId();
        }
        if (currentAction === "reprocess" || currentAction === "reprocess_asynchronous") {
            return; //document added, nothing to do
        }
        const actionHandlers = {
            "Save": () => { Save(); Lib.Contract.HandleLeaveForm(); },
            "Share": OnShare,
            "AmendContract": OnAmendContract,
            "UpdateContract": OnUpdateContract,
            "Reject": async () => { await ValidationScript.workflow.DoAction(Lib.Contract.Workflow.Parameters.actions.rejected.GetName()); },
            "DeleteContract": async () => { await ValidationScript.workflow.DoAction(Lib.Contract.Workflow.Parameters.actions.deleted.GetName()); },
            "Comment_Answer": async () => { await ValidationScript.workflow.DoAction(Lib.Contract.Workflow.Parameters.actions.comment.GetName()); },
            "SetDocusignEnvelopeID": OnSetDocusignEnvelopeID,
            "BypassSignature": OnBypassSignature,
            "CheckSignature": OnCheckSignature,
            "SaveChanges": OnSaveChanges,
            "ModifyContract": OnModifyContract,
            "BackToRequester": OnBackToRequester,
            "Approve_Forward": OnApproveForward,
            "VendorRegistrationApproved": OnVendorRegistrationApproved,
            "VendorRegistrationRejected": OnVendorRegistrationRejected,
            "PublishContract": OnPublishContract,
            "ResetSignature": OnResetSignature,
        };
        const handler = actionHandlers[currentName];
        if (handler) {
            await handler();
        }
        else if (currentName.startsWith("DocusignEvent_")) {
            await HandleDocusignEvent(currentName);
        }
        else if (currentName === "TestContractPrompt" && Lib.Contract.Policies.IsPoliciesCompliancyAnalysisEnabled()) {
            await OnTestContractPrompt();
        }
        else if (await Lib.Contract.OnValidateForm(!Lib.P2P.FormHasError())) {
            Lib.Contract.Workflow.DoCurrentContributorAction();
        }
        Log.Info(`Handling completed for action: '${currentName}'`);
    }
    function GetReferenceDocumentIndex(contract) {
        const attachList = contract.GetAttachs(false);
        if (attachList) {
            const nbAttachs = attachList.GetNbAttachs();
            for (let i = 0; i < nbAttachs; i++) {
                const attach = attachList.GetAttach(i);
                if (attach.GetVars().GetValue_Long("AttachToProcess", 0) === 1) {
                    return i;
                }
            }
        }
        else {
            Log.Info("No document to process use the first one");
        }
        return 0;
    }
    function SynchronizeReferenceDocument(p2pContract) {
        const refDocIdx = GetReferenceDocumentIndex(p2pContract);
        if (refDocIdx !== -1) {
            const attachList = p2pContract.GetAttachs(false);
            const attach = attachList.GetAttach(refDocIdx);
            const attachVars = attach.GetVars();
            Log.Info("Change Input file " + attachVars.GetValue_String("AttachOutputName", 0));
            Attach.AttachTemporaryFile(attach.GetInputFile(), { name: attachVars.GetValue_String("AttachOutputName", 0), attachAsConverted: false, attachIndex: 0 });
            Log.Info("Change Converted file ");
            Attach.AttachTemporaryFile(attach.GetConvertedFile(0), { attachAsConverted: true, attachIndex: 0 });
        }
    }
    function SynchronizeWithP2PCustomerContract() {
        try {
            Log.Info("[SynchronizeWithP2PCustomerContract] begin...");
            const p2pContractRuidEx = Lib.Contract.Publication.TechnicalData.PublishedContractRuidEx;
            const p2pContract = Lib.Contract.Publication.QueryContract(p2pContractRuidEx, true);
            if (!p2pContract) {
                Log.Error(`[SynchronizeWithP2PustomerContract] cannot get p2p customer contract with RuidEx: ${p2pContractRuidEx}`);
                throw new Sys.Helpers.Promise.HandledError();
            }
            // Fields are updated by the fields notification - the p2p contract might be out of date when the processing is fast
            // To do it here, we need to check the document version to ensure we have retrieved the latest version.
            // For document synchronization, it is not necessary to check the version because the document is serialized on the record
            // before any execution of the P2P Contract validation script.
            SynchronizeReferenceDocument(p2pContract);
            Process.PreventApproval();
            Log.Info(Data.GetValue("RuidEx"));
            const self = Process.GetUpdatableTransport(Data.GetValue("RuidEx"));
            const vars = self.GetUninheritedVars();
            vars.AddValue_String("RequestedActions", "reprocess_asynchronous|Document", true);
            vars.AddValue_Long("FORCERESUBMIT", 1, true);
            vars.AddValue_String("RECIPIENTTYPE", "CD", true);
            self.ProcessAsync("FORCERESUBMIT,RequestedActions");
            Log.Info("Resubmitting the process asynchronously : " + self.GetLastErrorMessage());
        }
        catch (e) {
            Sys.Helpers.Promise.HandledError.Catcher("SynchronizeWithP2PContract", null, false)(e);
            Log.Error("[SynchronizeWithP2PContract] An error occurred while synchronizing the contract");
            Process.PreventApproval(); // NO error on supplier document ?
        }
    }
    ValidationScript.SynchronizeWithP2PCustomerContract = SynchronizeWithP2PCustomerContract;
    async function Main() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        const isUploadingDocument = (currentAction === "reprocess_asynchronous" || currentAction === "reprocess") || (currentAction === "" && currentName === "" && Lib.P2P.InboundChannel.IsCreatedFromInboundChannel());
        if (!isUploadingDocument) {
            //Reset the next alert only if not already reset in extraction script
            Lib.CommonDialog.NextAlert.Reset();
        }
        Log.Info(`-- Contract Validation Script -- Name: '${currentName || "<empty>"}', Action: '${currentAction || "<empty>"}' , Device: '${Data.GetActionDevice()}'`);
        if (currentName === "Synchronize") {
            SynchronizeWithP2PCustomerContract();
        }
        else {
            Lib.P2P.InitValidityDateTime("Contract", "ValidityDurationInMonths", "18");
            ValidationScript.workflow.AllowRebuild(false);
            ValidationScript.workflow.Define(Lib.Contract.Workflow.Parameters);
            if (contractHandler.IsDemoContract()) {
                Process.DisableChecks();
            }
            Lib.Contract.SetOriginalContractRUIDEX();
            if (currentName === "save") {
                // first call of the validation script when a user clicks an action button.
                // nothing to do here because the XGF isn't saved after execution.
            }
            else if (currentName !== "" && currentAction !== "") {
                await HandleAction(currentName, currentAction);
            }
            if (Lib.Contract.Publication.IsContractPublished()) {
                if (Lib.Contract.Publication.ShouldSynchronizeContractOnPortal()) {
                    Lib.Contract.Publication.ResumeToSynchronizeContractOnPortal();
                }
                Lib.Contract.Publication.SaveSynchronizedData();
            }
        }
        const isRecallScriptScheduled = Process.IsRecallScriptScheduled();
        await Sys.Helpers.TryCallFunction("Lib.Contract.Customization.Server.OnValidationScriptEnd", currentAction, currentName, isRecallScriptScheduled);
    }
    ValidationScript.Main = Main;
    function CanUpdateContract() {
        if (Data.GetValue("ContractStatus__") === Lib.Contract.Status.Active ||
            Data.GetValue("ContractStatus__") === Lib.Contract.Status.ApprovedPendingActivation) {
            return true;
        }
        // allow Update as admin for import.
        return !!Data.GetValue("FromContractManagement__") && Data.GetValue("ContractStatus__") === Lib.Contract.Status.Expired;
    }
    async function EnsureStatusAndDateCoherency() {
        const status = Data.GetValue("ContractStatus__");
        const expectedEffectiveDate = contractHandler.IsAmendment() ? Data.GetValue("EffectiveDate__") : Data.GetValue("StartDate__");
        if (status === Lib.Contract.Status.Active && Sys.Helpers.Date.IsDateInFuture(expectedEffectiveDate)) {
            Data.SetValue("EffectiveDate__", expectedEffectiveDate);
        }
        else if (status === Lib.Contract.Status.ApprovedPendingActivation && !Sys.Helpers.Date.IsDateInFuture(expectedEffectiveDate)) {
            Data.SetValue("EffectiveDate__", new Date());
        }
        if (contractHandler.IsEndDateReached()) {
            contractHandler.OnEndDateReached();
        }
        else if (status === Lib.Contract.Status.ApprovedPendingActivation && Sys.Helpers.IsEmpty(Data.GetValue("VendorRegistrationID__"))) {
            await Lib.Contract.SaveItemsInCatalog();
            if (contractHandler.IsEffectiveDateReached()) {
                if (contractHandler.IsStartDateReached()) {
                    contractHandler.SetActive();
                }
                if (contractHandler.IsAmendment()) {
                    await Lib.Contract.Spending.UpdateWithNewContract((spending, max) => { var _a; return (_a = contractSpendingHandler.ComputeRemainingForSteps(spending, max)) === null || _a === void 0 ? void 0 : _a.toNumber(); });
                    Lib.Contract.Amendment.DeprecatePreviousContractVersion();
                }
            }
        }
        else if (status === Lib.Contract.Status.Active && (!contractHandler.IsEffectiveDateReached() || !contractHandler.IsStartDateReached() || !Sys.Helpers.IsEmpty(Data.GetValue("VendorRegistrationID__")))) {
            contractHandler.SetPendingActivation();
        }
        else {
            Log.Info("Nothing to do : status will not change");
        }
        const numberOfDeletedInstallments = Lib.P2P.BillingSchedule.DeleteInstallmentsAfterContractEndDate(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"), Data.GetValue("ReferenceNumber__"), Data.GetValue("ContractNumber__"), Data.GetValue("EndDate__"));
        if (numberOfDeletedInstallments) {
            Log.Info(`${numberOfDeletedInstallments} installments deleted for behing after ${Data.GetValue("EndDate__")}`);
        }
    }
    ValidationScript.EnsureStatusAndDateCoherency = EnsureStatusAndDateCoherency;
    async function ChangeContractOwner() {
        const lastOwnerLogin = Variable.GetValueAsString("ContractOwner");
        const ownerLogin = Data.GetValue("OwnerLogin__");
        if (lastOwnerLogin !== ownerLogin) {
            Log.Info(`Set read right to ${ownerLogin}`);
            Process.SetRight(ownerLogin, "read");
            Log.Info(`Change contract document owner from ${lastOwnerLogin} to ${ownerLogin}`);
            Process.ChangeOwner(ownerLogin);
            Lib.Contract.Conversation.AddUserToConversation(ownerLogin);
            Variable.SetValueAsString("ContractOwner", ownerLogin);
            const tags = Lib.Contract.Workflow.GetCustomTags();
            Lib.Contract.Workflow.SendEmailNotification({ login: ownerLogin }, "_Your are the new owner of this contract", "Contract_Email_NotifChangeOwner.htm", false, tags);
        }
        await AddReadRightToContractHistory(ownerLogin);
    }
    function ChangeContractName() {
        const lastContractName = Variable.GetValueAsString("ContractName");
        const contractName = Data.GetValue("Name__");
        if (lastContractName !== contractName) {
            Log.Info(`Contract Name has been changed from ${lastContractName} to ${contractName}`);
            Lib.Contract.Amendment.UpdateCatalogItemContractInformations(Data.GetValue("RuidEx"));
            Lib.Contract.Amendment.UpdatePunchOutContractInformations(Data.GetValue("RuidEx"));
            Variable.SetValueAsString("ContractName", contractName);
        }
    }
    async function AddReadRightToContractHistory(ownerLogin) {
        const contracts = await Lib.Contract.Amendment.GetContractHistory({
            originalRUIDEX: Data.GetValue("OriginalContractRUIDEX__")
        });
        contracts.forEach((contract) => {
            if (contract.RUIDEX !== Data.GetValue("RuidEx")) {
                Log.Info(`Add read right for contract ${contract.RUIDEX} to ${ownerLogin}`);
                const transport = Process.GetUpdatableTransportAsProcessAdmin(contract.RUIDEX);
                transport.AddRight(ownerLogin, "read");
                transport.Process();
                if (transport.GetLastError() !== 0) {
                    throw new Error("Cannot process Contract. Details: " + transport.GetLastErrorMessage());
                }
            }
        });
    }
    function CanAmendContract() {
        return Data.GetValue("ContractStatus__") === Lib.Contract.Status.Active || Data.GetValue("ContractStatus__") === Lib.Contract.Status.Expired;
    }
    function DiscardEnvelope() {
        const signatureId = Data.GetValue("SignatureId__");
        if (Sys.Helpers.IsEmpty(signatureId)) {
            Log.Verbose("No signature id to reset");
        }
        else {
            Data.SetValue("SignatureId__", "");
            Data.SetValue("SignatureExpirationDateTime__", null);
            Lib.P2P.Docusign.DeleteTransaction("DocusignEnvelope");
            Lib.Contract.Docusign.DeleteESignatureOptionsInDB(Data.GetValue("RuidEx"));
            Lib.P2P.Docusign.DiscardEnvelope(signatureId);
        }
    }
    async function ResetESignatureOptions() {
        try {
            const eSignateurOptionsRecord = await Lib.Contract.GetESignatureOptions(Data.GetValue("RuidEx"));
            eSignateurOptionsRecord.Delete();
        }
        catch (e) {
            if (e instanceof Lib.Contract.LibContractServer) {
                Log.Warn("No ESignature options for this contract. Nothing to delete");
            }
            else {
                //Do nothing for now...
            }
        }
    }
    Lib.P2P.SetTablesToIndex(["ApproversList__", "ESignatureRecipientsArchived__"]);
    Lib.P2P.HandleScriptError(Main());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map