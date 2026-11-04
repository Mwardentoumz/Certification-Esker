"use strict";
/* eslint-disable class-methods-use-this */
var CustomScript;
(function (CustomScript) {
    var ProcessStatus = Lib.Contract.Management.ProcessStatus;
    class Main {
        constructor() {
            this.VARIABLE_PROP = Lib.Contract.Management.VARIABLE_PROP;
        }
        async TableControlSetHighlightDanger(table) {
            await Sys.Helpers.Promise.Tools.Sleep(100);
            const lineItemsCount = Math.min(table.GetItemCount(), table.GetLineCount());
            for (let lineIdx = 0; lineIdx < lineItemsCount; lineIdx++) {
                const row = table.GetRow(lineIdx);
                row.AddStyle("highlight-danger");
            }
        }
        InitDocumentsPanel() {
            Controls.DocumentsPanel.SetReadOnly(false);
            Controls.DocumentsPanel.OnDocumentSelected = function () {
                Controls.Next.SetDisabled(false);
                if (Data.GetValue("Status__") === ProcessStatus.ToApprove) {
                    ProcessInstance.Resubmit("check");
                }
            };
            Controls.DocumentsPanel.OnAttachmentAdded = function () {
                if (Attach.GetNbAttach() > 1) {
                    Attach.RemoveAttach(0);
                }
            };
            Controls.DocumentsPanel.OnAttachmentDeleted = function () {
                Controls.Next.SetDisabled(true);
            };
        }
        async FeedContractsErrorTable() {
            const csvErrors = JSON.parse(Variable.GetValueAsString(this.VARIABLE_PROP.ContractsError__));
            Controls.ContractsErrorPane__.Hide(!csvErrors.length);
            if (!csvErrors.length && Data.GetValue("Status__") !== ProcessStatus.Imported && Data.GetValue("Status__") !== ProcessStatus.Canceled) {
                Controls.Close.SetLabel("_Import_later");
            }
            for (const csvError of csvErrors) {
                const newItem = Controls.ContractsErrorTable__.AddItem();
                newItem.SetValue("CSVLineNumber__", csvError.CSVLineNumber);
                newItem.SetValue("CSVLineText__", csvError.CSVLineText);
                newItem.SetValue("ErrorStatus__", csvError.ErrorStatus);
            }
            Controls.NotAllErrorsDisplayed__.Hide(csvErrors.length === Data.GetValue("NbContractInError__"));
            Controls.NotAllErrorsDisplayed__.SetText(Language.Translate("_NotAllErrorsDisplayed {0}", false, Lib.Contract.Management.MAXIMUM_NB_CONTRACT_ERRORS_DISPLAYED));
            await this.TableControlSetHighlightDanger(Controls.ContractsErrorTable__);
        }
        InitDraft() {
            Controls.Status__.Hide(true);
            Controls.FileType__.Hide(true);
            Controls.NbContract__.Hide(true);
            Controls.NbContractInError__.Hide(true);
            Controls.NbContractToAmend__.Hide(true);
            Controls.NbContractAmended__.Hide(true);
            Controls.NbContractToTerminate__.Hide(true);
            Controls.NbContractTerminated__.Hide(true);
            Controls.NbContractToImport__.Hide(true);
            Controls.NbContractImported__.Hide(true);
            Controls.ImportDateTime__.Hide(true);
            Controls.ImportDescription__.SetReadOnly(false);
            Controls.Submit.Hide(true);
            Controls.Cancel.Hide(true);
            Controls.Next.Hide(false);
            Controls.ContractsErrorPane__.Hide(true);
            Controls.ErrorPane__.Hide(true);
            Controls.DownloadTemplate__.Hide(false);
            this.InitDocumentsPanel();
            Controls.Next.SetDisabled(Attach.GetNbAttach() === 0);
            Controls.ProcessDescription__.Hide(false);
            Controls.Spacer__.Hide(false);
            Controls.Spacer3__.Hide(false);
            Controls.ProcessDescription__.SetValue(Language.Translate("_ProcessDescription"));
        }
        InitToApprove() {
            Controls.Status__.Hide(true);
            Controls.FileType__.Hide(false);
            Controls.NbContract__.Hide(false);
            Controls.NbContractInError__.Hide(false);
            Controls.NbContractToAmend__.Hide(false);
            Controls.NbContractAmended__.Hide(true);
            Controls.NbContractToTerminate__.Hide(false);
            Controls.NbContractTerminated__.Hide(true);
            Controls.NbContractToImport__.Hide(false);
            Controls.NbContractImported__.Hide(true);
            Controls.ImportDateTime__.Hide(true);
            Controls.ImportDescription__.SetReadOnly(true);
            Controls.Submit.Hide(false);
            const contractWithAction = Data.GetValue("NbContractToImport__") +
                Data.GetValue("NbContractToUpdate__") +
                Data.GetValue("NbContractToAmend__") +
                Data.GetValue("NbContractToTerminate__");
            Controls.Submit.SetDisabled(contractWithAction === 0);
            Controls.Cancel.Hide(false);
            Controls.Next.Hide(true);
            Controls.ContractsErrorPane__.Hide(true);
            Controls.ErrorPane__.Hide(true);
            Controls.DownloadTemplate__.Hide(true);
            this.InitDocumentsPanel();
        }
        async FeedToApprove() {
            await this.FeedContractsErrorTable();
        }
        InitImported() {
            Controls.Status__.Hide(false);
            Controls.FileType__.Hide(false);
            Controls.NbContract__.Hide(false);
            Controls.NbContractInError__.Hide(false);
            Controls.NbContractToAmend__.Hide(true);
            Controls.NbContractAmended__.Hide(false);
            Controls.NbContractToTerminate__.Hide(true);
            Controls.NbContractTerminated__.Hide(false);
            Controls.NbContractToImport__.Hide(true);
            Controls.NbContractImported__.Hide(false);
            Controls.ImportDateTime__.Hide(false);
            Controls.ImportDescription__.SetReadOnly(true);
            Controls.Submit.Hide(true);
            Controls.Cancel.Hide(true);
            Controls.Next.Hide(true);
            Controls.DocumentsPanel.SetReadOnly(true);
            Controls.ContractsErrorPane__.Hide(true);
            Controls.ErrorPane__.Hide(true);
            Controls.DownloadTemplate__.Hide(true);
        }
        async FeedImported() {
            await this.FeedContractsErrorTable();
        }
        InitErrorStep() {
            Controls.Status__.Hide(false);
            Controls.FileType__.Hide(true);
            Controls.NbContract__.Hide(true);
            Controls.NbContractInError__.Hide(true);
            Controls.NbContractToAmend__.Hide(true);
            Controls.NbContractAmended__.Hide(true);
            Controls.NbContractToTerminate__.Hide(true);
            Controls.NbContractTerminated__.Hide(true);
            Controls.NbContractToImport__.Hide(true);
            Controls.NbContractImported__.Hide(true);
            Controls.ImportDateTime__.Hide(false);
            Controls.ImportDescription__.SetReadOnly(true);
            Controls.Submit.Hide(true);
            Controls.Cancel.Hide(true);
            Controls.Next.Hide(true);
            Controls.DocumentsPanel.SetReadOnly(true);
            Controls.ContractsErrorPane__.Hide(true);
            Controls.ErrorPane__.Hide(false);
            Controls.DownloadTemplate__.Hide(true);
        }
        FeedErrorStep() {
            const error = Variable.GetValueAsString(this.VARIABLE_PROP.Error__);
            Controls.ErrorPaneMessage__.SetText(error);
            Controls.ErrorPaneMessage__.SetImageURL("public\\warning_red.svg", true);
        }
        FeedImportInProgressStep() {
            Controls.ErrorPaneMessage__.SetText(Language.Translate("_processing_in_progress"));
            Controls.ErrorPaneMessage__.SetImageURL("public\\warning_red.svg", true);
        }
        InitCanceledStep() {
            Controls.Status__.Hide(false);
            Controls.FileType__.Hide(false);
            Controls.NbContract__.Hide(false);
            Controls.NbContractInError__.Hide(false);
            Controls.NbContractToAmend__.Hide(true);
            Controls.NbContractAmended__.Hide(false);
            Controls.NbContractToTerminate__.Hide(true);
            Controls.NbContractTerminated__.Hide(false);
            Controls.NbContractToImport__.Hide(true);
            Controls.NbContractImported__.Hide(false);
            Controls.ImportDateTime__.Hide(false);
            Controls.ImportDescription__.SetReadOnly(true);
            Controls.Submit.Hide(true);
            Controls.Cancel.Hide(true);
            Controls.Next.Hide(true);
            Controls.DocumentsPanel.SetReadOnly(true);
            Controls.ContractsErrorPane__.Hide(true);
            Controls.ErrorPane__.Hide(true);
            Controls.DownloadTemplate__.Hide(true);
        }
        async FeedCanceledStep() {
            await this.FeedContractsErrorTable();
        }
        InitControls() {
            Controls.Next.OnClick = () => {
                ProcessInstance.Approve("check");
            };
            Controls.Submit.OnClick = () => {
                ProcessInstance.Approve("import");
            };
            Controls.Cancel.OnClick = () => {
                ProcessInstance.Approve("cancel");
            };
            Controls.ContractsErrorTable__.SetWidth("100%");
            Controls.ContractsErrorTable__.SetExtendableColumn("CSVLineText__");
            Controls.ContractsErrorTable__.SetWidth("100%");
            Controls.ContractsErrorTable__.SetExtendableColumn("CSVLineText__");
            // Update as admin are not officially supported, display only if > 0.
            Controls.NbContractToUpdate__.Hide(!Data.GetValue("NbContractToUpdate__"));
            Controls.NbContractUpdated__.Hide(!Data.GetValue("NbContractUpdated__"));
        }
        LogProcessVariableProp() {
            for (const varKey in this.VARIABLE_PROP) {
                if (Object.prototype.hasOwnProperty.call(this.VARIABLE_PROP, varKey)) {
                    Log.Info(`Variable ${varKey}: ${Variable.GetValueAsString(this.VARIABLE_PROP[varKey])}`);
                }
            }
        }
        async Start() {
            Log.Info("Start custom script");
            Controls.form_header.SetProcessDisplayName(Language.Translate("_Process_Contract_Management_title"));
            this.LogProcessVariableProp();
            this.InitControls();
            const status = Data.GetValue("Status__");
            if (Data.GetValue("State") === "50" && !Lib.Contract.Management.FINALS_STATUS.has(status)) {
                this.SetWizardStep("General");
                this.InitErrorStep();
                this.FeedImportInProgressStep();
                return;
            }
            switch (status) {
                case ProcessStatus.Draft:
                    this.SetWizardStep("General");
                    this.InitDraft();
                    break;
                case ProcessStatus.ToApprove:
                    this.SetWizardStep("Import");
                    this.InitToApprove();
                    await this.FeedToApprove();
                    break;
                case ProcessStatus.Imported:
                    this.SetWizardStep("Summary");
                    this.InitImported();
                    await this.FeedImported();
                    break;
                case ProcessStatus.Error:
                    this.SetWizardStep("General");
                    this.InitErrorStep();
                    this.FeedErrorStep();
                    break;
                case ProcessStatus.Canceled:
                    this.SetWizardStep("Summary");
                    this.InitCanceledStep();
                    await this.FeedCanceledStep();
                    break;
                default:
                    throw new Error("Invalid status");
            }
        }
        SetWizardStep(step) {
            const STEPS = {
                General: "color9",
                Import: "color9",
                Summary: "color9"
            };
            STEPS[step] = "color8";
            Controls.GeneralStepButton__.SetTextColor(STEPS.General);
            Controls.ImportStepButton__.SetTextColor(STEPS.Import);
            Controls.SummaryStepButton__.SetTextColor(STEPS.Summary);
        }
    }
    CustomScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        main.Start();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map