"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    const topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
    /**
     * Manage the General step
     */
    CustomScript.generalStep = {
        panels: [Controls.General_pane, Controls.Available_modules_pane, Controls.Available_modules_features_pane],
        icon: "fa-cog",
        title: "General",
        description: "Global settings",
        helpId: 2401,
        onStart: function () {
            CustomScript.generalStep.handleModules();
            Controls.EnableAccountPayableGlobalSetting__.OnChange = CustomScript.generalStep.handleAccountPayableActivation;
            Controls.EnableExpenseClaimsGlobalSetting__.OnChange = CustomScript.generalStep.handleModules;
            Controls.EnablePurchasingGlobalSetting__.OnChange = CustomScript.generalStep.handlePurchasingActivation;
            Controls.EnableMarketDojoIntegration__.OnChange = CustomScript.generalStep.handleModules;
            Controls.EnableVendorManagementGlobalSetting__.OnChange = CustomScript.generalStep.updateWizard;
            Controls.EnableContractGlobalSetting__.OnChange = CustomScript.generalStep.handleVendorContractActivation;
            Controls.EnableEPaymentRunGlobalSetting__.OnChange = CustomScript.generalStep.updateWizard;
            Controls.EnableAIForExpenses__.OnChange = CustomScript.generalStep.hideShowAIEngineVersion;
            Controls.ExpenseAIVersion__.Hide(!Controls.EnableExpenseClaimsGlobalSetting__.IsChecked() || !Controls.EnableAIForExpenses__.IsChecked());
            Controls.EnableStandardPurchasingGlobalSetting__.OnChange = CustomScript.generalStep.handleModules;
            Controls.EnableMultiSupplierItem__.SetReadOnly(Controls.EnableMultiSupplierItem__.IsChecked());
            Controls.EnableMultiSupplierItem__.Hide(Controls.EnableMultiSupplierItem__.IsChecked());
            Controls.EnableMultiSupplierItem__.OnChange = function () {
                const isMultiSupplierEnabled = this.IsChecked();
                Controls.EnableInventoryManagement__.SetReadOnly(!isMultiSupplierEnabled);
                if (!isMultiSupplierEnabled) {
                    Controls.EnableInventoryManagement__.Check(false);
                }
            };
            CustomScript.generalStep.handleSourcingPane();
            const dateLastModification = Sys.Helpers.Date.ISOSTringToDate(Data.GetValue("RecordLastWrite") || Data.GetValue("CreationDateTime"));
            Controls.LastModifiedDateTime__.SetValue(Sys.Helpers.Date.GetDateInUserTimezone(dateLastModification, User.utcOffset));
            Sys.OnDemand.Users.GetUsersFromLogins([Data.GetValue("RecordLastModifiedBy") || Data.GetValue("OwnerId")], ["displayname"], function (users) {
                if (users && users.length > 0) {
                    Controls.LastModifiedBy__.SetValue(users[0].displayname);
                }
            });
        },
        onQuit: function () {
            if (CustomScript.generalStep.checkModules() === false) {
                return false;
            }
            return true;
        },
        updateWizard: function () {
            Sys.Wizard.Wizard.DrawSteps();
        },
        hideShowAIEngineVersion: function () {
            Controls.ExpenseAIVersion__.Hide(!Controls.EnableAIForExpenses__.IsChecked());
        },
        handleModules: function () {
            const isAPEnabled = Controls.EnableAccountPayableGlobalSetting__.IsChecked();
            const isPurchasingEnabled = Controls.EnablePurchasingGlobalSetting__.IsChecked();
            const isStandardPurchasingEnabled = isPurchasingEnabled && Controls.EnableStandardPurchasingGlobalSetting__.IsChecked();
            const isMultiSupplierEnabled = isPurchasingEnabled && Controls.EnableMultiSupplierItem__.IsChecked();
            const isExpenseEnabled = Controls.EnableExpenseClaimsGlobalSetting__.IsChecked();
            const isVendorContractEnabled = Controls.EnableContractGlobalSetting__.IsChecked();
            const isSourcingEnabled = Controls.EnableMarketDojoIntegration__.IsChecked();
            //Modules
            Controls.EnableExpenseClaimsGlobalSetting__.SetReadOnly(!isAPEnabled);
            Controls.EnableEPaymentRunGlobalSetting__.SetReadOnly(!isAPEnabled);
            //Features
            Controls.EnableFlipPOGlobalSetting__.SetReadOnly(!isAPEnabled);
            Controls.EnableExpenseOnBehalfGlobalSetting__.SetReadOnly(!isAPEnabled || !isExpenseEnabled);
            Controls.EnableBankStatement__.SetReadOnly(!isAPEnabled || !isExpenseEnabled);
            Controls.EnableAIForExpenses__.Hide(!isExpenseEnabled);
            Controls.ExpenseAIVersion__.Hide(!isExpenseEnabled || !Controls.EnableAIForExpenses__.IsChecked());
            Controls.ocrEngine__.Hide(!isExpenseEnabled);
            Controls.EnableStandardPurchasingGlobalSetting__.SetReadOnly(!isPurchasingEnabled);
            Controls.EnableInventoryManagement__.SetReadOnly(!isStandardPurchasingEnabled || !isMultiSupplierEnabled);
            Controls.EnableProject__.SetReadOnly(!isStandardPurchasingEnabled);
            Controls.EnableAdvancedShippingNotice__.SetReadOnly(!isStandardPurchasingEnabled);
            Controls.EnableReturnManagement__.SetReadOnly(!isStandardPurchasingEnabled);
            Controls.EnableOrderConfirmation__.SetReadOnly(!isPurchasingEnabled);
            Controls.EnableContractPublication__.SetReadOnly(!isVendorContractEnabled);
            Controls.EnableChatGPTForContractFraudulentClauses__.SetReadOnly(!isVendorContractEnabled);
            Controls.EnableRequestForQuote__.SetReadOnly(!isSourcingEnabled || !isStandardPurchasingEnabled);
            //Tooltips
            Controls.EnableAIDuplicateRemovalForContractItems__.SetHelpData("_EnableAIDuplicateRemovalForContractItems_HelpText");
        },
        handlePurchasingActivation: function () {
            CustomScript.generalStep.handleModules();
            CustomScript.generalStep.updateWizard();
        },
        handleVendorContractActivation: function () {
            const isChecked = Controls.EnableContractGlobalSetting__.IsChecked();
            Controls.EnableChatGPTForContractFraudulentClauses__.SetReadOnly(!isChecked);
            Controls.EnableChatGPTForContractFraudulentClauses__.Check(isChecked);
        },
        handleAccountPayableActivation: function () {
            CustomScript.generalStep.handleModules();
            CustomScript.generalStep.updateWizard();
        },
        handleSourcingPane: function () {
            //Market Dojo URL and environment are for R&D dev purposes only
            //Adding tooltips to prevent misuse
            Controls.EnableMarketDojoSandpit__.SetHelpData("_MarketDojoSandpit_helpData");
            Controls.MarketDojoEnvironment__.SetHelpData("_MarketDojoEnvironment_helpData");
            Controls.URLToMarketDojo__.SetHelpData("_URLToMarketDojo_helpData");
        },
        checkModules: function () {
            // Clear the value of enable Modules & Features in case modules are not activated
            const isAPChecked = Controls.EnableAccountPayableGlobalSetting__.IsChecked();
            const isPurchasingChecked = Controls.EnablePurchasingGlobalSetting__.IsChecked();
            const isExpenseChecked = Controls.EnableExpenseClaimsGlobalSetting__.IsChecked();
            const isVendorContractChecked = Controls.EnableContractGlobalSetting__.IsChecked();
            const isSourcingChecked = isPurchasingChecked && Controls.EnableMarketDojoIntegration__.IsChecked();
            if (!isAPChecked) {
                Controls.EnableExpenseClaimsGlobalSetting__.Check(false);
                Controls.EnableEPaymentRunGlobalSetting__.Check(false);
                Controls.EnableFlipPOGlobalSetting__.Check(false);
            }
            if (!isExpenseChecked || !isAPChecked) {
                Controls.EnableExpenseOnBehalfGlobalSetting__.Check(false);
                Controls.EnableBankStatement__.Check(false);
            }
            if (!isPurchasingChecked) {
                Controls.EnableStandardPurchasingGlobalSetting__.Check(false);
                Controls.EnableOrderConfirmation__.Check(false);
            }
            const isStandardPurchasingChecked = isPurchasingChecked && Controls.EnableStandardPurchasingGlobalSetting__.IsChecked();
            if (!isStandardPurchasingChecked) {
                Controls.EnableInventoryManagement__.Check(false);
                Controls.EnableProject__.Check(false);
                Controls.EnableAdvancedShippingNotice__.Check(false);
                Controls.EnableReturnManagement__.Check(false);
                Controls.EnableRequestForQuote__.Check(false);
            }
            if (!isVendorContractChecked) {
                Controls.EnableChatGPTForContractFraudulentClauses__.Check(false);
            }
            if (!isSourcingChecked) {
                Controls.EnableRequestForQuote__.Check(false);
            }
            if (!Sys.Helpers.Array.Find(Controls.Available_modules_pane.GetControls(), function (ctrl) {
                return ctrl.GetType() === "CheckBox" && ctrl.IsChecked();
            })) {
                Popup.Alert("_You must select at least one module", null, null, "_Modules alert title");
                return false;
            }
            return null;
        }
    };
    /**
     * Manage Vendor Management
     */
    CustomScript.vendorManagementStep = {
        panels: [Controls.VendorManagementGlobalOptions_Pane, Controls.VendorManagementAdvancedSettings_pane],
        icon: "fas fa-briefcase",
        title: "_Vendor_management_tab_title",
        description: "_Vendor_management_tab_description",
        helpId: 2402,
        isVisible: function () {
            return Data.GetValue("EnableVendorManagementGlobalSetting__");
        },
        onStart: function () {
            CustomScript.vendorManagementStep.handleModules();
            CustomScript.vendorManagementStep.handleSupplierDeactivation();
            Controls.ConfigurationType__.OnChange = CustomScript.vendorManagementStep.switchConfigurationType;
            Controls.EnableAutomaticSuppliersDeactivation__.OnChange = CustomScript.vendorManagementStep.handleSupplierDeactivation;
            Controls.NumberOfMonthsForAutomaticDeactivation__.OnChange = CustomScript.vendorManagementStep.validatePositiveInteger;
        },
        onQuit: function () {
            if (Controls.VendorEmailRedirection__.GetValue() === null) {
                Data.SetValue("VendorEmailRedirection__", User.emailAddress);
            }
            if (Controls.EnableAutomaticSuppliersDeactivation__.IsChecked()) {
                const nbMonths = Controls.NumberOfMonthsForAutomaticDeactivation__.GetValue();
                if (nbMonths === null || nbMonths !== Math.floor(nbMonths) || nbMonths < 1) {
                    Controls.NumberOfMonthsForAutomaticDeactivation__.SetError("_EnableAutomaticSuppliersDeactivation_validation_error");
                    return false;
                }
            }
            return true;
        },
        handleModules: function () {
            if (Controls.ConfigurationType__.GetValue() === Lib.P2P.ConfigurationType.Prod) {
                Controls.VendorEmailRedirection__.Hide(true);
            }
            if (Controls.VendorEmailRedirection__.GetValue() === null) {
                Data.SetValue("VendorEmailRedirection__", User.emailAddress);
            }
        },
        switchConfigurationType: function () {
            const configurationType = this.GetValue();
            if (configurationType === Lib.P2P.ConfigurationType.Prod) {
                Controls.VendorEmailRedirection__.Hide(true);
            }
            else {
                Controls.VendorEmailRedirection__.Hide(false);
            }
        },
        handleSupplierDeactivation: function () {
            const isEnabled = Controls.EnableAutomaticSuppliersDeactivation__.IsChecked();
            Controls.NumberOfMonthsForAutomaticDeactivation__.Hide(!isEnabled);
            Controls.NumberOfMonthsForAutomaticDeactivation__.SetRequired(isEnabled);
        },
        validatePositiveInteger: function () {
            const value = this.GetValue();
            if (value !== null && Number.isInteger(value) && value <= 0) {
                this.SetError("_EnableAutomaticSuppliersDeactivation_validation_error");
            }
        }
    };
    /**
     * Manage the Vendor Contract step
     */
    CustomScript.vendorContractStep = {
        panels: [Controls.VendorContractGlobalOptions_pane, Controls.VendorContractDocusign_pane],
        icon: "fa fa-file-text",
        title: "_Vendor_contract_tab_title",
        description: "_Vendor_contract_tab_description",
        helpId: null, //TODO
        isVisible: function () {
            return Data.GetValue("EnableContractGlobalSetting__");
        },
        onStart: function () {
            Controls.DocusignApproval__.OnClick = function () {
                var url = Controls.DocusignDevAccount__.IsChecked() ? "https://account-d.docusign.com" : "https://account.docusign.com";
                url = url
                    + "/oauth/auth?response_type=code&scope=signature%20impersonation&client_id="
                    + (Data.GetValue("DocusignIntegrationKey__") ? Data.GetValue("DocusignIntegrationKey__") : "")
                    + "&redirect_uri="
                    + Controls.DocusignRedirectURI__.GetText();
                Process.OpenLink({ url: url, inCurrentTab: false });
            };
        },
        onQuit: function () {
            return true;
        }
    };
    /**
     * Manage the Destination Recognition step
     */
    CustomScript.destinationRecognitionStep = {
        panels: [Controls.OCRParameters_pane],
        icon: "fa-external-link",
        title: "Routing_Recognition",
        description: "Select routing informations",
        helpId: 2403,
        onStart: null,
        onQuit: function () {
            return true;
        }
    };
    /**
    * Manage the Worflow step of the wizard
    */
    CustomScript.paymentApprovalWorkflowStep = {
        panels: [Controls.Workflow_pane, Controls.Workflow_Expense_Report],
        icon: "fa-check-circle-o",
        title: "Payment_approval_workflow",
        description: "Payment approval workflow description",
        helpId: 2404,
        onStart: function () {
            const expenseEnabled = Controls.EnableExpenseClaimsGlobalSetting__.IsChecked();
            Controls.Workflow_Expense_Report.Hide(!expenseEnabled);
            const isAPEnabled = Controls.EnableAccountPayableGlobalSetting__.IsChecked();
            Controls.Workflow_pane.Hide(!isAPEnabled);
        },
        onQuit: function () {
            return true;
        },
        isVisible: function () {
            const workflowPaneVisible = Controls.EnableAccountPayableGlobalSetting__.IsChecked();
            // In theory, we should also check EnableExpenseClaimsGlobalSetting__ but it's disabled if AP is disabled when quiting the general step
            return workflowPaneVisible;
        }
    };
    /**
     * Customizations step
     */
    CustomScript.customizationsStep = {
        panels: [Controls.Customizations_pane],
        icon: "fas fa-cogs",
        title: "_Customizations_tab_title",
        description: "_Customizations_tab_description",
        isVisible: function () {
            return false;
        },
        onStart: null,
        onQuit: function () {
            return true;
        }
    };
    CustomScript.labsStep = {
        panels: [Controls.Labs_pane],
        icon: "fa-flask",
        title: "Labs",
        description: "Experimental features",
        helpId: 2406,
        onStart: function () {
            Controls.EnableEPaymentRunGlobalSetting__.OnChange = CustomScript.generalStep.updateWizard;
            Controls.EnableWalkMeBot__.Hide(!Configuration.GetValue("WalkMeBotEnabled", true));
            topMessageWarning.Add(Language.Translate("_LabsWarningMessage"));
        },
        onQuit: function () {
            CustomScript.labsStep.checkModules();
            topMessageWarning.Clear();
            return true;
        },
        hideStep: function () {
            for (const panel of CustomScript.labsStep.panels) {
                panel.Hide(true);
            }
        },
        GetLabel: function () {
            return null;
        },
        checkModules: function () {
        }
    };
    const steps = [CustomScript.generalStep, CustomScript.vendorManagementStep, CustomScript.vendorContractStep, CustomScript.destinationRecognitionStep, CustomScript.paymentApprovalWorkflowStep, CustomScript.customizationsStep];
    function OnSave() {
        for (const step of steps) {
            if (!step.onQuit()) {
                return false;
            }
        }
        // On last step if deactivation is enabled, we have to also enable the scheduled task
        if (CustomScript.vendorManagementStep.isVisible()) {
            if (Controls.EnableAutomaticSuppliersDeactivation__.IsChecked()) {
                ScheduledTask.Enable("VM - Supplier deactivation after inactivity", null);
            }
            else {
                ScheduledTask.Disable("VM - Supplier deactivation after inactivity", null);
            }
        }
        return true;
    }
    const deprecatedFieldsName = [
        "EnableExpenseItemization__",
        "TitleArrow",
        "Spacer_line__",
        "EnableVendorManagementProcurement__",
        "EnableContractAmendment__",
        "EnableBulkReceipt__",
        "DisplayGHGForProcurement__",
        "EnableCatalogItemsSorting__",
        "EnableSourcingAtRequesterLevel__",
        "EnableCatalogItemManagementOnContract__",
        "EnableRestrictingCatalogItems__"
    ];
    function HideDeprecatedFields() {
        deprecatedFieldsName.forEach(fieldName => {
            const control = Controls[fieldName];
            if (control) {
                control.Hide(true);
            }
        });
    }
    function ApplyDocusignLayout() {
        const check = Controls.EnableDocusignIntegration__.GetValue();
        Controls.DocusignAccountBaseURI__.Hide(!check);
        Controls.DocusignAccountId__.Hide(!check);
        Controls.DocusignApproval__.Hide(!check);
        Controls.DocusignIntegrationKey__.Hide(!check);
        Controls.DocusignRedirectURI__.Hide(!check);
        Controls.DocusignRSAKey__.Hide(!check);
        Controls.DocusignUserId__.Hide(!check);
        Controls.DocusignDevAccount__.Hide(!check);
    }
    function Main() {
        ApplyDocusignLayout();
        HideDeprecatedFields();
        if (ProcessInstance.isDebugActive) {
            steps.push(CustomScript.labsStep);
        }
        else {
            CustomScript.labsStep.hideStep();
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Wizard.Common.CustomizeGlobalStep", CustomScript.customizationsStep);
        Sys.Wizard.Wizard.Init({
            steps: steps,
            previousButton: Controls.Previous,
            nextButton: Controls.Next,
            wizardControl: Controls.Wizard_steps__,
            descriptionControl: Controls.Wizard_step_desc__,
            LoadFirstStep: function () {
                return Variable.GetValueAsString("currentStep");
            },
            SaveCurrentStep: function (currentStep) {
                ProcessInstance.SetSilentChange(true);
                Variable.SetValueAsString("currentStep", currentStep);
                ProcessInstance.SetSilentChange(false);
            },
            RefreshDefaultValues: function (runWizardCb) {
                runWizardCb();
            }
        });
        // Other layout initializations
        Controls.Save.OnClick = OnSave;
        Controls.EnableDocusignIntegration__.OnChange = ApplyDocusignLayout;
    }
    CustomScript.Main = Main;
    /// ==================================
    /// Entry point !!!
    /// ==================================
    Main();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map