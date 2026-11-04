"use strict";
var ExtractionScript;
(function (ExtractionScript) {
    ExtractionScript.contractHandler = new Lib.Contract.Handler(new Lib.P2P.DataHandler());
    const DOCX_EXTENSION = ".docx";
    const PDF_EXTENSION = ".pdf";
    async function CallRecognitionEngine() {
        return Sys.RecognitionEngine.Engine
            .CreateWithParameters(Lib.Contract.Recognition.GetRecognitionParameters)
            .SetPreRecognitionSteps(async (engine) => {
            engine.parameterCheckerService.AddCheckers([
                engine.parameterCheckerService.IsGetDocumentStringDefined,
                engine.parameterCheckerService.HasDocumentOCR
            ]);
        })
            .SetPostRecognitionSteps(async (engine) => {
            if (engine.lifeCycleData.HasSetSomething()) {
                Variable.SetValueAsString("ChatGPTAnswer", "1");
            }
        })
            .LaunchAsyncAndGetResults();
    }
    ExtractionScript.CallRecognitionEngine = CallRecognitionEngine;
    async function Main() {
        const currentName = Data.GetActionName();
        const currentAction = Data.GetActionType();
        Log.Info(`-- Contract Extraction Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}' , Device: '${Data.GetActionDevice()}'`);
        Data.SetValue("ProcessingLabel", "CTR01");
        if (ExtractionScript.contractHandler.IsCreatedByImport()) {
            Log.Info(`CreatedByImport, AncestorsRuid: ${Variable.GetValueAsString("AncestorsRuid")} PreviousContractRUIDEX__: ${Data.GetValue("PreviousContractRUIDEX__")}`);
            const askedStatusDeductionRule = Data.GetValue("ContractStatus__");
            Data.SetValue("ContractStatus__", Lib.Contract.Status.Draft); // re-set because has been overridden, will be changed by workflow
            //Copying Vendor name on both fields
            Data.SetValue("CombinedVendor__", Data.GetValue("VendorName__"));
            if (ExtractionScript.contractHandler.IsNewAmendment()) {
                await Lib.Contract.Amendment.CopyPreviousContractVars(Data.GetValue("PreviousContractRUIDEX__"));
                Data.SetValue("FromContractManagement__", true); // re-set because has been overridden
                Lib.Contract.Amendment.UpdateVersion();
                const updatedProperties = JSON.parse(Variable.GetValueAsString("ContractManagement_Amendment_UpdatedProperties__"));
                for (const prop in updatedProperties) {
                    Data.SetValue(prop, updatedProperties[prop]);
                }
                Data.SetValue("Comments__", Language.Translate("_workflow_created_with_Contract_Management_for_amendment"));
            }
            else {
                // Data.SetValue of extraction script are ignored after execution, but need for budget creation
                Lib.Contract.SetOriginalContractRUIDEX();
                Data.SetValue("Comments__", Language.Translate("_workflow_created_with_Contract_Management"));
            }
            Lib.Contract.SetContractNumber();
            Process.Forward(Data.GetValue("OwnerLogin__"));
            Lib.Contract.Workflow.Init();
            if (askedStatusDeductionRule !== Lib.Contract.Management.StatusDeductionRule.ByWorkflow) {
                Data.SetValue("NeedValidation", 0);
                Lib.Contract.Workflow.UpdateRolesSequenceWithoutApprover();
            }
            else {
                Lib.Contract.Workflow.UpdateRolesSequence();
            }
            if (askedStatusDeductionRule === Lib.Contract.Management.StatusDeductionRule.ByWorkflow &&
                !await Lib.Contract.OnValidateForm(!Lib.P2P.FormHasError())) {
                Data.SetValue("ContractStatus__", Lib.Contract.Status.Draft);
                Process.PreventApproval();
                Lib.P2P.EmailNotification.SendEmailNotification({
                    userId: Data.GetValue("OwnerId"),
                    sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
                    template: "Contract_Email_ImportOnValidateError_XX.htm",
                    fromName: "_EskerContractFromName",
                    customTags: {
                        Name: Data.GetValue("Name__"),
                        ContractNumber: Data.GetValue("ContractNumber__"),
                        VendorName: Data.GetValue("VendorName__"),
                        VendorNumber: Data.GetValue("VendorNumber__"),
                    }
                });
            }
            else {
                //do requester action, will put the contract in expected status
                Lib.Contract.Workflow.DoCurrentContributorAction();
            }
            if (askedStatusDeductionRule === Lib.Contract.Management.StatusDeductionRule.AmendedContract) {
                // force status to Expired (tmp status, will be overridden by obsolete on next version contract import)
                Data.SetValue("ContractStatus__", Lib.Contract.Status.Expired);
            }
        }
        else {
            Data.SetValue("ContractStatus__", Lib.Contract.Status.Draft);
            const isChatGPTExtractionEnabled = Sys.Parameters.GetInstance("Contract").GetParameterBool("EnableChatGPTForContracts", false);
            const isChatGPTCompliancyAnalysisEnabled = Lib.Contract.Policies.IsPoliciesCompliancyAnalysisEnabled();
            if (ExtractionScript.contractHandler.IsDemoContract() && !ExtractionScript.contractHandler.IsNewAmendment()) {
                Lib.ContractDemoData.Init();
            }
            else if (ExtractionScript.contractHandler.IsNewAmendment() && !currentAction.startsWith("reprocess")) {
                await Lib.Contract.Amendment.CopyPreviousContractVars(Variable.GetValueAsString("AncestorsRuid"));
                Lib.Contract.Amendment.UpdateVersion();
            }
            else if (isChatGPTExtractionEnabled || isChatGPTCompliancyAnalysisEnabled) {
                const OCRText = Lib.Contract.OCR.GetDocumentText();
                if (OCRText && isChatGPTExtractionEnabled) {
                    await ExtractionScript.CallRecognitionEngine();
                }
                if (OCRText && isChatGPTCompliancyAnalysisEnabled) {
                    //Reloading policies to include new header values in filter
                    await Lib.Contract.Policies.QueryPoliciesFromDBAndMerge();
                    await Lib.Contract.Policies.FraudulentClauses.QueryChatGPT(OCRText);
                }
            }
            const owner = Data.GetValue("OwnerLogin__");
            if (Lib.P2P.InboundChannel.IsCreatedFromInboundChannel()) {
                Lib.Contract.Workflow.SendEmailNotification({ login: owner }, "_TRAD_CONTRACT_NEWTOREVIEW_SUBJECT", "Contract_Email_NewDraftFromInboundChannel.htm", false, {});
            }
            else if (currentName === "Document" && currentAction === "reprocess_asynchronous") {
                Lib.Contract.Workflow.SendEmailNotification({ login: owner }, "_TRAD_CONTRACT_DOCUMENTEXTRACTIONASYNCHRONOUS_SUBJECT", "Contract_Email_DocumentExtractionAsynchronous.htm", false, {});
            }
            else if (currentAction === "" && Lib.Contract.Publication.IsCreatedFromSynergyAgent()) {
                const contractData = Variable.GetValueAsString("ContractData");
                const contractDataObject = JSON.parse(contractData);
                const tags = {
                    documentName: contractDataObject.AttachmentName__ || Attach.GetName(0)
                };
                Lib.Contract.Workflow.SendEmailNotification({ login: owner }, "_TRAD_CONTRACT_NEWTOREVIEW_SUBJECT", "Contract_Email_NewDraftFromSynergyAgent.htm", false, tags);
                sendDashboardNotification(owner, "Contract_DashNotif_NotifCreator.txt", tags);
            }
        }
    }
    ExtractionScript.Main = Main;
    function sendDashboardNotification(owner, template, tags) {
        Log.Info("[sendDashboardNotification] Sending dashboard notification");
        const currentUser = Users.GetUser(owner);
        const currentProcessRuidex = Data.GetValue("RuidEx");
        let templateObject;
        try {
            // Fetch template title and text in user's language and culture
            templateObject = currentUser.GetTemplateContent({
                templateName: template,
                replaceTags: true,
                timezone: null,
                customTags: tags
            });
            if (templateObject.content === "") {
                throw new Error(`Empty content for template`);
            }
        }
        catch (error) {
            Log.Error(`[sendDashboardNotification] Failed to get content from template ${template}: ${error}`);
            return;
        }
        // Send notification
        const notificationAdditionalData = {
            ruidex: currentProcessRuidex,
            title: templateObject.title,
            message: templateObject.content
        };
        const result = currentUser.ShowNotification("ProcessAvailable", JSON.stringify(notificationAdditionalData));
        Log.Info("[sendDashboardNotification] NotifyUser result = " + result);
    }
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
            Attach.SetValue(0, "AttachOutputName", mainDocumentBaseName);
            Attach.SetValue(0, "AttachOutputFormat", PDF_EXTENSION);
            Log.Info(`DOCX document detected, attaching original file '${originalDocxName}' as attachment`);
            Attach.AttachTemporaryFile(inputFile, originalDocxName);
        }
    }
    async function Start() {
        try {
            const currentName = Data.GetActionName();
            const currentAction = Data.GetActionType();
            Lib.CommonDialog.NextAlert.Reset();
            const firstCreation = currentName === "" && currentAction === "";
            if (firstCreation) {
                if (Lib.Contract.Publication.IsCreatedFromCustomerContract()) {
                    Log.Info("Contract created from Customer Contract");
                    // We synchronize field that can be empty, initialization of the important field like CompanyCode must be done after that.
                    Lib.Contract.Publication.SynchronizeWithContractOnPortal();
                    await Lib.Contract.LoadUserProperties();
                }
                else if (Lib.P2P.InboundChannel.IsCreatedFromInboundChannel()) {
                    Log.Info("Contract created from Inbound Channel");
                    let defaultOwner = Sys.Parameters.GetInstance("Contract").GetParameter("DefaultContractByEmailRequester");
                    defaultOwner = Lib.P2P.ResolveDemoLogin(defaultOwner);
                    const owner = Lib.P2P.InboundChannel.Init(defaultOwner);
                    await Lib.Contract.LoadUserProperties(owner);
                }
                else if (Lib.Contract.Publication.IsCreatedFromSynergyAgent()) {
                    Log.Info("Contract created from Synergy Agent");
                    await Lib.Contract.LoadUserProperties();
                }
                if (Data.IsNullOrEmpty("CompanyCode__")) // In case of import from CSV
                 {
                    const companyCode = Sys.Parameters.GetInstance("Contract").GetParameter("CompanyCode");
                    if (companyCode) {
                        Log.Info(`Company code ${companyCode} was find from configuration`);
                        Data.SetValue("CompanyCode__", companyCode);
                    }
                }
                if (Lib.Contract.Publication.IsCreatedFromCustomerContract()) {
                    Log.Info("Contract created from Customer Contract");
                    ExtractionScript.contractHandler.DeduceVendor(Variable.GetValueAsString("CompanyName"), Variable.GetValueAsString("CompanyAddress"), Variable.GetValueAsString("CompanyFax"));
                    await Lib.Contract.Publication.FillVendorContactLogin();
                }
            }
            if (!ExtractionScript.contractHandler.IsDemoContract()) {
                await Lib.Contract.Configuration.InitConfiguration(Data.GetValue("CompanyCode__"));
            }
            await Sys.Parameters.GetInstance("Contract").PromisedIsReady();
            if (Lib.Contract.Policies.IsPoliciesCompliancyAnalysisEnabled() &&
                Sys.Helpers.IsEmpty(Data.GetValue("AiCompliancyPrompt__"))) {
                await Lib.Contract.Policies.LoadDefault();
            }
            attachOriginalDocxIfNeeded();
            await Main();
            Sys.Helpers.TryCallFunction("Lib.Contract.Customization.Server.OnExtractionScriptEnd", currentName, currentAction);
        }
        catch (reason) {
            Log.Error(reason);
            Data.SetError("CompanyCode__", reason);
        }
    }
    ExtractionScript.Start = Start;
    Lib.P2P.HandleScriptError(Start());
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map