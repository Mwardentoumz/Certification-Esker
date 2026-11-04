"use strict";
var CustomScript;
(function (CustomScript) {
    const contractHandler = new Lib.Contract.Handler(new Lib.P2P.DataHandler());
    const uploadDialog = {
        fill_CB: function (dialog) {
            dialog.AddDescription("ctrlDesc").SetText(HasNoAttachment() ? "_ChooseFile_upload" : "_ChooseFile_replace");
            dialog.AddSeparator();
            const commentCtrl = dialog.AddMultilineText("comment", "_Comment", 500);
            commentCtrl.SetLineCount(5);
            dialog.RequireControl(commentCtrl);
            const g_CommentPlaceHolder = Language.Translate("_Enter your comment...");
            commentCtrl.SetPlaceholder(g_CommentPlaceHolder);
            dialog.AddSeparator();
            let ctrlFileUploader = dialog.AddFileUploader("ctrlFiles", "");
            ctrlFileUploader.SetAllowedExtensions(["pdf", "docx"]);
            // @ts-ignore
            ctrlFileUploader.SetAllowUploadingOnlyOneFile(true);
            const commitButton = dialog.GetControl("ButtonOk");
            commitButton.SetText(Language.Translate(HasNoAttachment() ? "_OK_upload" : "_OK_replace"));
        },
        commit_CB: function (dialog) {
            const files = dialog.GetControl("ctrlFiles").GetUploadedFiles();
            const nbAttach = Attach.GetNbAttach();
            for (let i = nbAttach - 1; i >= 0; i--) {
                Attach.RemoveAttach(i);
            }
            if (files && files.length === 1) {
                Attach.AddAttach(files[0], { asReference: true });
            }
            Data.SetValue("Comment__", dialog.GetControl("comment").GetValue());
        },
        cancel_CB: function () {
        },
        validate_CB: function (dialog) {
            // validate there is at least one and max only one file
            const files = dialog.GetControl("ctrlFiles").GetUploadedFiles();
            if (files && files.length === 1) {
                // Save then reprocess so the newly uploaded contract is picked up by the workflow				
                ProcessInstance.Resubmit("Document");
                return true;
            }
            else {
                Log.Error("No files submitted.");
                return false;
            }
        },
        Show: function () {
            Popup.Dialog(HasNoAttachment() ? "_ImportContract_upload" : "_ImportContract_replace", null, this.fill_CB, this.commit_CB, this.validate_CB, null, this.cancel_CB);
        }
    };
    function HasNoAttachment() {
        return Attach.GetNbAttach() === 0;
    }
    function InitBanner() {
        const banner = Sys.Helpers.Banner;
        banner.SetMainTitle("_Contract");
        banner.SetStatusCombo(Controls.ContractStatus__);
        banner.SetSubTitleAligned(true);
        banner.SetCentered(false);
        banner.SetStatusCombo(Controls.ContractStatus__);
        banner.SetHTMLBanner(Controls.HTMLBanner__);
        banner.SetSubTitle();
    }
    function InitLayout() {
        Controls.RenewalTerms__.Hide(!Controls.TacitRenewal__.IsChecked());
        Lib.CustomerContract.FormTemplate.SetupFormTemplateManager();
    }
    function InitData() {
        contractHandler.SetNextOccuranceDesc();
    }
    function InitControls() {
        const CheckErrorAndSave = () => {
            // Can't save without a CompanyCode or ProjectName
            const requiredFields = ["ReferenceNumber__", "Name__", "StartDate__", "EndDate__"];
            let showError = false;
            for (const field of requiredFields) {
                if (Sys.Helpers.IsEmpty(Controls[field].GetValue())) {
                    Controls[field].SetError("This field is required!");
                    Controls[field].ShowErrorMessage();
                    showError = true;
                }
            }
            if (HasNoAttachment()) {
                Controls.DocumentsPanel.SetError("");
                showError = true;
            }
            showError || (showError = !Lib.CustomerContract.IsStartEndDateValid("StartDate__", "EndDate__"));
            if (showError) {
                Process.ShowFirstError();
            }
            else {
                return true;
            }
            return false; // prevent the default click action
        };
        Controls.Submit__.OnClick = CheckErrorAndSave;
    }
    function InitUploadContractButton() {
        Controls.UploadContract__.SetText(HasNoAttachment() ? "_UploadContract" : "_UploadContract (replace existing)");
        Controls.UploadContract__.OnClick = () => {
            uploadDialog.Show();
        };
    }
    function InitEventHistoryPane() {
        if (!Data.GetValue("CompanyCode__")) {
            Controls.EventHistory.Hide(true);
            return;
        }
        const customerCompany = Variable.GetValueAsString("CustomerCompany");
        if (customerCompany) {
            Controls.EventHistory.SetLabel(Language.Translate("_EventHistory", false, customerCompany));
        }
        Controls.ConversationUI__.SetOptions({
            allowAttachments: true,
            mergeAllOptions: true,
            emailTemplate: "Event_MissedContractItem.htm",
            emailCustomTags: {
                ReferenceNumber__: Data.GetValue("ReferenceNumber__")
            }
        });
        // TODO - move it in a dedicated function in Lib_CustomerContract_Publication (or other) ?
        if (Sys.Helpers.Data.IsFalse(Variable.GetValueAsString("P2PContractSubmittedFromPortal"))) {
            Controls.ConversationUI__.AddItem({
                Message: Language.Translate("_ConversationContractViewed"),
                Type: Lib.Contract.Conversation.ConversationTypes.Viewed,
            }, { ignoreIfExists: true });
        }
    }
    const nextAlertBehaviors = {
        ActionErrorPopup: {
            IsShowable() {
                return !!Data.GetActionName();
            }
        }
    };
    function AnyNextAlertToShow() {
        const nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
        if (nextAlert) {
            const behavior = nextAlertBehaviors && nextAlert.behaviorName && (nextAlert.behaviorName in nextAlertBehaviors) ? nextAlertBehaviors[nextAlert.behaviorName] : {};
            return !Sys.Helpers.IsFunction(behavior.IsShowable) || behavior.IsShowable();
        }
        return false;
    }
    async function Run() {
        var _a;
        try {
            Sys.Helpers.EnableSmartSilentChange();
            ProcessInstance.SetSilentChange(true);
            InitBanner();
            InitLayout();
            InitControls();
            InitEventHistoryPane();
            InitUploadContractButton();
            Controls.Quit__.OnClick = () => { ProcessInstance.Quit("Unsaved", true); };
            Controls.DocumentsPanel.Hide(Attach.GetNbAttach() <= 1);
            Controls.DocumentsPanel.SetNumberOfNonRemovableAttachments(2);
            if (ProcessInstance.state) // Check if the document is in draft and not saved yet
             {
                let showNextAlert = true;
                const backFromAction = !!Data.GetActionName();
                if (!backFromAction || !AnyNextAlertToShow()) {
                    // The following will check if the form has pending fields notifs, or if it is being processed by conncont or chatgpt.
                    Lib.CustomerContract.TmpData.isProcessed = (ProcessInstance.state < 70 && ProcessInstance.isReadOnly);
                    (_a = Lib.CustomerContract.TmpData).isProcessed || (_a.isProcessed = (await ProcessInstance.CheckResumeWithActionPending()).hasResumeActionPending);
                    if (Lib.CustomerContract.TmpData.isProcessed) {
                        Popup.Alert("_ExitFormDocumentProcessingMessage", false, null, "_ExitFormDocumentProcessingTitle");
                        showNextAlert = false;
                    }
                }
                if (showNextAlert) {
                    Lib.CommonDialog.NextAlert.Show(nextAlertBehaviors);
                }
            }
        }
        catch (reason) {
            Log.Error("GlobalError : " + reason);
        }
        finally {
            ProcessInstance.SetSilentChange(false);
        }
    }
    CustomScript.Run = Run;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Run();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map