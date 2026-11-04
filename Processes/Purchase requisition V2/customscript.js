"use strict";
var CustomScript;
(function (CustomScript) {
    const prSpendingDispatcher = Lib.Purchasing.prSpendingDispatcher;
    const ContractSpendingHandler = Lib.Spending.Contract.Handler;
    const PRStatus = Lib.Purchasing.PRStatus;
    const PRProjectSpending = Lib.Purchasing.PRProjectSpending;
    const PRContractSpending = Lib.Purchasing.PRContractSpending;
    const prBudgetSpending = Lib.Purchasing.prBudgetSpending;
    const ProjectSpendingHandler = Lib.Spending.Project.Handler;
    const warehouseManager = Lib.Purchasing.PR.ShipToPane.WarehouseManager;
    const viewer = Lib.Purchasing.PR.viewer;
    Log.Time("CustomScript");
    const workflow = Lib.Purchasing.PR.Workflow.controller;
    CustomScript.formTemplateManager = Lib.Purchasing.PR.FormTemplate.Get();
    prSpendingDispatcher.Register(prBudgetSpending);
    const contractSpendingHandler = new ContractSpendingHandler();
    const prContractSpending = new PRContractSpending(contractSpendingHandler, null);
    prSpendingDispatcher.Register(prContractSpending);
    const projectSpendingHandler = new ProjectSpendingHandler();
    const prProjectSpending = new PRProjectSpending(projectSpendingHandler, null);
    prSpendingDispatcher.Register(prProjectSpending);
    /** GENERIC HELPERS **/
    const CompanyCodeManager = {
        previousCompanyCode: "",
        UpdateCompanyCodeDependencies: async function () {
            CompanyCodeManager.previousCompanyCode = Data.GetValue("CompanyCode__");
            let newcc = Data.GetValue("CompanyCode__");
            Lib.Purchasing.PR.GlobalLayout.ShowWaitScreen();
            const updatePromise = Lib.P2P.CompanyCodesValue.QueryValues(newcc)
                .Then(async (CCValues) => {
                await Lib.Purchasing.SetERPByCompanyCode(newcc);
                Lib.Purchasing.PR.OnConfigurationChange();
                Lib.Spending.Budget.budgetHandler.OnConfigurationChange();
                Lib.Purchasing.ShipTo.Reset();
                await Lib.Purchasing.PRLineItems.Reset();
                if (Object.keys(CCValues).length > 0) {
                    await CCValues.currencies.QueryRate();
                    Data.SetValue("LocalCurrency__", CCValues.Currency__);
                    Data.SetValue("Currency__", CCValues.Currency__);
                    Data.SetValue("ExchangeRate__", CCValues.currencies.GetRate(CCValues.Currency__) || 1);
                    Data.SetValue("PurchasingOrganization__", CCValues.PurchasingOrganization__);
                    Data.SetValue("PurchasingGroup__", CCValues.PurchasingGroup__);
                    Variable.SetValueAsString("companyCurrency", CCValues.Currency__);
                    Controls.CompanyName__.SetValue(CCValues.CompanyName__);
                    Data.SetValue("WarehouseID__", "");
                    Data.SetValue("WarehouseName__", "");
                    Data.SetValue("IsReplenishment__", false);
                }
                else {
                    Data.SetError("CompanyCode__", "_This CompanyCode does not exist in the table.");
                }
                /** ************************** **/
                /** ERP Specific initialization */
                /** ************************** **/
                Lib.Purchasing.Browse.Init();
                await InitControlsAndPanes();
                await Lib.Purchasing.PRLineItems.Budget.ResetBudgetVisibility();
                await Lib.Purchasing.ShipTo.FillFromCompanyCode(true);
                await Lib.Purchasing.PR.Workflow.DelayRebuildWorkflow();
            })
                .Finally(() => {
                Lib.Purchasing.PR.GlobalLayout.HideWaitScreen();
            });
            Sys.Helpers.Synchronizer.OnProgressFromPromise(updatePromise, {
                progressDelay: 15000,
                OnProgress: Lib.P2P.OnSynchronizerProgress
            });
            return updatePromise;
        },
        RevertCompanyCode: function () {
            Controls.CompanyCode__.SetValue(CompanyCodeManager.previousCompanyCode);
        },
        SetPreviousCompanyCode: function (companyCode) {
            CompanyCodeManager.previousCompanyCode = companyCode;
        },
        SetCompanyName: async function () {
            const companyCode = Data.GetValue("CompanyCode__");
            if (companyCode) {
                const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(companyCode);
                if (Object.keys(CCValues).length) {
                    Controls.CompanyName__.SetValue(CCValues.CompanyName__);
                }
            }
        },
        SetDefaultCCValuesOnForm: function () {
            let CCValues = Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__"));
            if (Object.keys(CCValues).length > 0) {
                if (Sys.Helpers.IsEmpty(Data.GetValue("PurchasingOrganization__"))) {
                    Data.SetValue("PurchasingOrganization__", CCValues.PurchasingOrganization__);
                }
                if (Sys.Helpers.IsEmpty(Data.GetValue("PurchasingGroup__"))) {
                    Data.SetValue("PurchasingGroup__", CCValues.PurchasingGroup__);
                }
                Data.SetValue("LocalCurrency__", CCValues.Currency__);
                if (Sys.Helpers.IsEmpty(Data.GetValue("Currency__"))) {
                    Data.SetValue("Currency__", CCValues.Currency__);
                    Data.SetValue("ExchangeRate__", CCValues.currencies.GetRate(CCValues.Currency__) || 1);
                }
                Variable.SetValueAsString("companyCurrency", CCValues.Currency__);
                Controls.CompanyName__.SetValue(CCValues.CompanyName__);
            }
        }
    };
    //#region Events
    Controls.CompanyCode__.OnSelectItem = function () {
        setTimeout(() => {
            const customization = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.GetCompanyCodeChangeConfirmation", {
                standardOnConfirm: CompanyCodeManager.UpdateCompanyCodeDependencies,
                standardOnCancel: CompanyCodeManager.RevertCompanyCode
            }) || {};
            Popup.Confirm(customization.message || "_This action will delete company code related fields.", false, customization.onConfirm || CompanyCodeManager.UpdateCompanyCodeDependencies, customization.onCancel || CompanyCodeManager.RevertCompanyCode, customization.title || "_Warning");
        });
    };
    Controls.DocumentsPanel.OnDocumentDeleted = function () {
        Lib.Purchasing.PR.GlobalLayout.HideDocument(true);
        CustomScript.formTemplateManager.Apply(); // Needed since all controls are shown after the document has been deleted
    };
    //#endregion
    /** *********** **/
    /** Form Layout **/
    /** *********** **/
    //#region Layout
    function CheckExtractionStatus() {
        let status = Variable.GetValueAsString("Extraction_status__");
        if (status) {
            if (status !== "SUCCESS") {
                Popup.Alert(status, true, null, "_Error");
            }
            // reset status: handle the extraction status only one time
            Variable.SetValueAsString("Extraction_status__", "");
        }
    }
    function FixLayoutBeforeStarting() {
        Log.Info("FixLayoutBeforeStarting");
        Process.ShowFirstErrorAfterBoot(false);
        Lib.Purchasing.PR.GlobalLayout.HideDeprecatedControls();
        Lib.Purchasing.PR.GlobalLayout.Hide();
        Lib.Purchasing.PR.GlobalLayout.ShowWaitScreen();
    }
    async function InitControlsAndPanes() {
        try {
            const initsToWait = [];
            Log.Time("InitControlsAndPanes");
            Lib.Purchasing.PR.GlobalLayout.ShowPanes();
            Lib.Purchasing.PR.GeneralPane.Init(CustomScript.formTemplateManager);
            Lib.Purchasing.PR.VendorPane.Init(CustomScript.formTemplateManager);
            initsToWait.push(Lib.Purchasing.PR.TopPaneWarning.Init(workflow, viewer));
            Lib.Purchasing.PR.Banner.Init(viewer);
            Lib.Purchasing.PR.ShipToPane.Init(CustomScript.formTemplateManager);
            initsToWait.push(Lib.Purchasing.Punchout.PR.Init().Then(async () => {
                Lib.Purchasing.PR.ItemsPane.Init(CustomScript.formTemplateManager);
                await Lib.Purchasing.PR.LineItems.Init(CustomScript.formTemplateManager, viewer);
                Lib.Purchasing.PRLineItems.InitCombinedVendorBrowsePropertiesAndEventCallbacks();
                await Lib.Purchasing.Vendor.Client.PR.InitCombinedVendorBrowseState();
            }));
            Lib.Purchasing.PR.Workflow.InitWorkflowPanel(CustomScript.formTemplateManager, viewer);
            Lib.Purchasing.PR.ButtonsBar.Init(CustomScript.formTemplateManager, viewer, workflow);
            Lib.Purchasing.Vendor.Client.InitCombinedVendorValue();
            await Sys.Helpers.Promise.All(initsToWait);
            await Lib.P2P.PolicyRules.Init(CustomScript.formTemplateManager, "Purchase Requisition V2");
            await CustomScript.formTemplateManager.Apply();
            const func = Sys.Helpers.TryGetFunction("Lib.PR.Customization.Client.CustomizeLayout");
            if (func) {
                await func(CustomScript.formTemplateManager);
            }
            else {
                await Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.CustomiseLayout", CustomScript.formTemplateManager);
            }
            await Lib.Purchasing.PR.GlobalLayout.Ready();
            await Lib.Purchasing.PR.UpdateLayout(true);
        }
        catch (e) {
            Log.Error("Error in InitControlsAndPanes:" + e);
        }
        finally {
            Log.TimeEnd("InitControlsAndPanes");
        }
    }
    //#endregion
    let FromAncestorManager;
    (function (FromAncestorManager) {
        let ancestorDbItems = null;
        let ancestorItemsToPR = null;
        function FromReplensihment() {
            return !!Process.GetURLParameter("replenishmentkey");
        }
        function FromClone() {
            return !!Process.GetURLParameter("srcruid");
        }
        function FromCart() {
            return !!Process.GetURLParameter("cartkey");
        }
        function FromSourcingEventCreation() {
            const data = Lib.Purchasing.Sourcing.PR.GetParsedData();
            return data && !data.procurementDocId && Object.keys(data).length !== 0;
        }
        function FromChatGPT() {
            return !!Variable.GetValueAsString("ChatGPTAnswer");
        }
        async function FinalizeFillForm() {
            let promises = [];
            Lib.Purchasing.ShipTo.MigrateOldShipToCompanyBehavior();
            Variable.SetValueAsString("AncestorsRuid", "");
            Lib.CommonDialog.NextAlert.Reset();
            const table = Data.GetTable("LineItems__");
            for (let i = 0; i < Lib.Purchasing.PRLineItems.Count(); i++) {
                const currentItem = table.GetItem(i);
                const promiseUpdateItemFromCatalogItem = Lib.Purchasing.PRLineItems.NumberOrDescription.UpdateItemFromCatalogItem(currentItem)
                    .Then(async function (dbItem) {
                    if (dbItem) {
                        Log.Info("Item '" + currentItem.GetValue("ItemNumber__") + "' still in the Catalog.");
                        dbItem.ITEMQUANTITY__ = currentItem.GetValue("ItemQuantity__");
                        await Lib.Purchasing.PRLineItems.NumberOrDescription.$OnSelectItem(dbItem, currentItem, i);
                    }
                    else {
                        Log.Info("Item '" + currentItem.GetValue("ItemNumber__") + "' deleted from the Catalog or free Item. Update default values");
                        await Lib.Purchasing.PRLineItems.SupplyType.FillInducedFields(currentItem, i, false);
                        await Lib.Purchasing.PRLineItems.GLAccount.UpdateGroup(currentItem);
                        await Lib.Purchasing.Items.PR.UpdateTaxRate(currentItem);
                        Lib.Purchasing.PRLineItems.ExchangeRate.Set(currentItem);
                        Lib.Purchasing.PRLineItems.ComputeItemAmount(i);
                        await Lib.Purchasing.PRLineItems.Vendor.FillInducedFields(currentItem);
                    }
                    await Lib.Purchasing.Items.CheckProjectFields(Controls.CompanyCode__.GetValue());
                    await Lib.Purchasing.PRLineItems.OnAddItem(currentItem, i, false);
                });
                promises.push(promiseUpdateItemFromCatalogItem);
            }
            Lib.Purchasing.PRLineItems.DelayComputeAmounts();
            Lib.Purchasing.PRLineItems.UpdateHasCapex();
            promises.push(Lib.Purchasing.PRLineItems.LeaveEmptyLine());
            await Sys.Helpers.Promise.All(promises);
        }
        async function LoadAncestorData() {
            if (FromClone()) {
                const srcRuid = Process.GetURLParameter("srcruid");
                let processId = Process.GetURLParameter("pid");
                let originalProcess = "";
                // After clicked on "Save", the URL will not contain "pid" but "id=CD#DMIIWM000IYP.620933803918795536"
                if (!processId) {
                    processId = Process.GetURLParameter("id");
                    if (processId) {
                        let exp = /(?:CD#)([A-Z0-9]*)(?:\.)/;
                        let res = exp.exec(processId);
                        processId = res ? res[1] : null;
                    }
                }
                if (srcRuid.indexOf(processId) !== -1) {
                    originalProcess = "PR";
                    ancestorItemsToPR = Lib.Purchasing.Items.PRItemsToPR;
                }
                else {
                    originalProcess = "PO";
                    ancestorItemsToPR = Lib.Purchasing.Items.POItemsToPR;
                }
                try {
                    const dbItems = await Lib.Purchasing.Items.PrepareFillPRFromAncestor(srcRuid, originalProcess);
                    if (dbItems.length > 0) {
                        Data.SetValue("CompanyCode__", dbItems[0].GetValue("CompanyCode__"));
                        if ((Data.GetValue("IsReplenishment__")
                            || dbItems[0].GetValue("IsReplenishmentItem__") === true)
                            && Lib.P2P.Inventory.IsInventoryManager()) {
                            Data.SetValue("WarehouseName__", dbItems[0].GetValue("WarehouseName__"));
                            Data.SetValue("WarehouseID__", dbItems[0].GetValue("WarehouseID__"));
                            Data.SetValue("IsReplenishment__", true);
                        }
                        ancestorDbItems = dbItems;
                    }
                }
                catch (reason) {
                    Log.Error("Failed to load ancestor data: " + reason.toString());
                    const title = "_Items synchronization error";
                    const message = "_Items synchronization error message";
                    const behaviorName = "syncItemsFromActionError";
                    Lib.CommonDialog.NextAlert.Define(title, message, {
                        isError: true,
                        behaviorName: behaviorName
                    });
                }
            }
        }
        FromAncestorManager.LoadAncestorData = LoadAncestorData;
        async function CallRecognitionEngine() {
            return Sys.RecognitionEngine.Engine
                .CreateWithParameters(Lib.Purchasing.PR.Recognition.GetRecognitionParameters)
                .SetPreRecognitionSteps(async (engine) => {
                engine.parameterCheckerService.AddCheckers([
                    engine.parameterCheckerService.IsGetDocumentStringDefined,
                    engine.parameterCheckerService.HasDocumentOCR
                ]);
            })
                .SetPostRecognitionSteps(async () => {
                Variable.SetValueAsString("ChatGPTAnswer", "");
                await FinalizeFillForm();
                await Lib.Purchasing.PRLineItems.RefreshAllSupplyTypeSuggestions();
                Lib.Purchasing.PR.LineItems.ExtendRows();
            })
                .LaunchAsyncAndGetResults();
        }
        FromAncestorManager.CallRecognitionEngine = CallRecognitionEngine;
        async function FillPRFromAncestor() {
            if (FromChatGPT()) {
                await CallRecognitionEngine();
            }
            else if (FromReplensihment()) {
                await warehouseManager.LoadDataFromAncestor();
                Lib.Purchasing.PR.LineItems.ExtendRows();
            }
            else if (FromClone()) {
                if (ancestorDbItems) {
                    Lib.Purchasing.Items.FillPRFromAncestor(ancestorDbItems, ancestorItemsToPR);
                    await FinalizeFillForm();
                    Lib.Purchasing.PR.LineItems.ExtendRows();
                }
            }
            else if (FromCart()) {
                const cartKey = Process.GetURLParameter("cartkey");
                let items = JSON.parse(Data.StorageGetValue(cartKey));
                await Lib.Purchasing.PR.ItemsPane.AddCatalogItemToPR(items);
                Data.CleanLocalStorage(cartKey, true, () => true);
            }
            else if (FromSourcingEventCreation()) {
                await Lib.Purchasing.Sourcing.PR.FillPRFromData();
                Lib.Purchasing.PR.LineItems.ExtendRows();
            }
        }
        FromAncestorManager.FillPRFromAncestor = FillPRFromAncestor;
        function ShouldFillPRFromAncestor() {
            // Avoid refilling items on Save
            return Lib.Purchasing.PRLineItems.Count() === 0 || FromChatGPT();
        }
        FromAncestorManager.ShouldFillPRFromAncestor = ShouldFillPRFromAncestor;
        function IsDefaultOrigin(origin) {
            return Sys.Helpers.IsEmpty(origin)
                || origin === Lib.P2P.PurchaseRequisitionOrigin.OTHER;
        }
        function SetOriginForWebApplication() {
            // Clone always originates from WebAccess
            if (FromClone()) {
                Log.Info(`[PR Origin][Client] SetOriginForWebApplication: writing Origin__='${Lib.P2P.PurchaseRequisitionOrigin.WEB_APPLICATION}' for clone`);
                Data.SetValue("Origin__", Lib.P2P.PurchaseRequisitionOrigin.WEB_APPLICATION);
                return;
            }
            // New unsaved form: stamp WebApplication only if origin is still the default
            if (!Data.GetValue("State") && IsDefaultOrigin(Data.GetValue("Origin__"))) {
                Log.Info(`[PR Origin][Client] SetOriginForWebApplication: writing Origin__='${Lib.P2P.PurchaseRequisitionOrigin.WEB_APPLICATION}' for WebAccess creation`);
                Data.SetValue("Origin__", Lib.P2P.PurchaseRequisitionOrigin.WEB_APPLICATION);
            }
        }
        FromAncestorManager.SetOriginForWebApplication = SetOriginForWebApplication;
    })(FromAncestorManager = CustomScript.FromAncestorManager || (CustomScript.FromAncestorManager = {}));
    async function ControlsInternalConversationOnOpened() {
        Log.Info("[Internal Conversation] On Opened");
        // Get requester User msn
        let requesterMSN = Sys.TechnicalData.GetValue("requesterMSN");
        let userMSN;
        if (requesterMSN) {
            userMSN = requesterMSN;
        }
        else {
            const user = await Sys.OnDemand.Users.GetUsersFromLogins([Controls.RequisitionInitiator__.GetValue()], ["msn"], null);
            userMSN = user.length > 0 && user[0].msn;
        }
        if (userMSN) {
            const participants = await Controls.InternalConversation__.GetParticipants();
            if (!participants.find((participant) => participant.msn == userMSN)) {
                try {
                    await Controls.InternalConversation__.AddParticipant({ msn: userMSN }, {
                        noEmailNotification: true,
                        noPlatformNotification: true
                    });
                    Log.Info("[Internal Conversation] Add Requester to conversation has succeed");
                }
                catch (_a) {
                    Log.Error("[Internal Conversation] Add Requester to conversation has failed");
                }
            }
        }
        else {
            Log.Error("[Internal Conversation] Requester can't be added without his user msn.");
        }
    }
    async function LoadCachedData() {
        await Lib.Purchasing.LoadItemsPriceCondition();
    }
    /** START **/
    async function Start() {
        const promisesToWait = [];
        if (Controls.InternalConversation__) {
            Controls.InternalConversation__.OnOpened = ControlsInternalConversationOnOpened;
        }
        Log.Info("Start");
        Log.Time("Start");
        Log.Time("Loaded");
        promisesToWait.push(Lib.Purchasing.InitTechnicalFields());
        CheckExtractionStatus();
        workflow.UpdateParallelWorkflowCurrentUser();
        let workflowParamStandard = Lib.Purchasing.PR.Workflow.Parameters;
        const workflowParamCustom = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.PR.ExtendWorkflowParameters", workflowParamStandard);
        const workflowParameters = Sys.Helpers.Extend({}, workflowParamStandard, workflowParamCustom);
        workflow.Define(workflowParameters);
        CompanyCodeManager.SetPreviousCompanyCode(Data.GetValue("CompanyCode__"));
        CompanyCodeManager.SetDefaultCCValuesOnForm();
        Lib.Purchasing.PRLineItems.StoreMaxLineNumber();
        if (workflow.GetTableIndex() === 0) {
            // This is a new purchase request
            // Save initiator very soon so this P.R. can appear in "My P.R." view if we juste save it
            Lib.Purchasing.PR.Layout.Set(Lib.Purchasing.roleRequester);
            if (Sys.Helpers.IsEmpty(Controls.RequisitionInitiator__.GetValue())) {
                Log.Info("Setting initiator to " + User.loginId);
                Controls.RequisitionInitiator__.SetValue(User.loginId);
                Controls.RequesterName__.SetValue(User.fullName);
                Sys.TechnicalData.SetValue("requesterMSN", User.id);
            }
            Lib.Purchasing.PR.Workflow.UpdateRolesSequence();
        }
        else {
            if (Controls.RequisitionStatus__.GetValue().toUpperCase() === PRStatus.draft.toUpperCase()) {
                //This purchase Requisition need to be verified
                workflow.AllowRebuild(true);
                Lib.Purchasing.PR.Workflow.UpdateRolesSequence();
            }
            else if (viewer.IsCurrentContributor && !viewer.IsReadOnly && Controls.RequisitionStatus__.GetValue().toUpperCase() === PRStatus.toReview.toUpperCase()) {
                workflow.AllowRebuild(true);
                workflow.Rebuild([Lib.Purchasing.sequenceRoleApprover, Lib.Purchasing.sequenceRoleBuyer]);
            }
            /*
             * if the current user has no action to take in the workflow
             * and if he has been set as an advisor, reset all errors in document
             */
            if (viewer.IsAdvisor) {
                // No field in error when advisor opens document
                Lib.Purchasing.ResetAllFieldsInError();
            }
            Lib.Purchasing.PR.Layout.Set(workflow.GetContributorAt(workflow.GetContributorIndex()).role);
            if (Lib.Purchasing.PR.Layout.IsApproverLayout() || Lib.Purchasing.PR.Layout.IsReviewerLayout()) {
                promisesToWait.push(Lib.Purchasing.PRLineItems.Budget.Fill());
            }
        }
        Lib.Purchasing.PRLineItems.Vendor.UpdateFromVendorRegistration();
        if (!viewer.IsReadOnly && Lib.Purchasing.PR.Layout.IsRequesterLayout()) {
            Lib.Purchasing.PRLineItems.DelayComputeAmounts();
            promisesToWait.push(Lib.Purchasing.PRLineItems.LeaveEmptyLine());
            promisesToWait.push(Lib.Purchasing.Items.CheckProjectFields(Controls.CompanyCode__.GetValue()));
            promisesToWait.push(Lib.Purchasing.PRLineItems.RefreshAllSupplyTypeSuggestions());
        }
        else if (viewer.IsReadOnly && !Lib.Purchasing.PR.Layout.IsApproverLayout() && !Lib.Purchasing.PR.Layout.IsBuyerLayout()) {
            Lib.Purchasing.PR.Layout.Set(Lib.Purchasing.roleApprover);
            let nbAttach = Attach.GetNbAttach();
            Controls.DocumentsPanel.SetNumberOfNonRemovableAttachments(nbAttach);
        }
        Log.Info("Current Layout Set to: " + Lib.Purchasing.PR.Layout.Get());
        Lib.CommonDialog.NextAlert.Show({
            // special behavior for Synchronize Items error
            "syncItemsFromActionError": {
                IsShowable: function () {
                    // just show the button and Popup (need to persist the button state for the updateButtonBar function)
                    Sys.Helpers.TmpData.SetValue("HideSynchronizeItemsButton", false);
                    return true;
                }
            },
            // special behavior for Unexpected error
            "onUnexpectedError": {
                IsShowable: function () {
                    // In PR workflow we just advise user to check logs and retry last action.
                    // In post PR workflow we show the "SynchronizeItems" button (we change label) and advise user to check logs and retry
                    // just show the button and Popup (need to persist the button state for the updateButtonBar function)
                    let status = Data.GetValue("RequisitionStatus__");
                    let inPRWorkflow = PRStatus.ForPRWorkflow.indexOf(status) !== -1;
                    if (!inPRWorkflow) {
                        Controls.SynchronizeItems.SetText(Language.Translate("_Retry"));
                        Sys.Helpers.TmpData.SetValue("HideSynchronizeItemsButton", false);
                    }
                    return true;
                }
            },
            "ClearSequence": {
                IsShowable: function () {
                    Data.SetValue("RequisitionNumber__", "");
                    return true;
                }
            },
            "OutlierQuantitiesConfirmation": {
                IsShowable: function () {
                    // show the warning after requester submitted the PR and before the PR is approved ig user can perform the action
                    return viewer.IsCurrentContributor && !viewer.IsReadOnly && (viewer.IsReviewer || viewer.IsApprover);
                }
            }
        });
        await Sys.Helpers.Promise.All(promisesToWait);
        Log.TimeEnd("Start");
        await InitControlsAndPanes();
        FromAncestorManager.SetOriginForWebApplication();
        const shouldFillAncestor = FromAncestorManager.ShouldFillPRFromAncestor();
        if (shouldFillAncestor) {
            await FromAncestorManager.FillPRFromAncestor();
        }
        Lib.Purchasing.CheckPR.CheckRequisitionStatusMatchesState();
        await Lib.Purchasing.CheckPR.RequiredFields.CheckUpdatedItems();
        Lib.Purchasing.CheckPR.RequiredFields.CheckItemsDeliveryDates();
        Lib.Purchasing.CheckPR.RequiredFields.CheckItemsTakenFromStock();
        await Lib.Purchasing.CheckPR.Items.CheckDataCoherency();
        if (Lib.Purchasing.Sourcing.PR.GetSourcingItemIndexesFromURL().length > 0) {
            await Lib.Purchasing.Sourcing.PR.SelectItemsAndCreateSourcing(Lib.Purchasing.Sourcing.PR.IsSourcingRFQ());
        }
        Process.ShowFirstError();
        Log.TimeEnd("Loaded");
    }
    CustomScript.Start = Start;
    /** *************** **/
    /** BEFORE STARTING **/
    /** *************** **/
    Sys.Helpers.EnableSmartSilentChange();
    // START - ignore all changes on form during the initialization processing
    ProcessInstance.SetSilentChange(true);
    async function LoadMarketDojoCredentialsFromUserProperties() {
        const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(User.loginId);
        Sys.Helpers.TmpData.SetValue("HasMarketDojoCredentials", UserPropertiesValues.HasMarketDojoCredentials());
    }
    //LoadUserPropeties also load MarketDojo Credentials
    async function LoadUserProperties() {
        Log.Info("LoadUserProperties");
        const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(User.loginId);
        let companyCode = Data.GetValue("CompanyCode__") || UserPropertiesValues.CompanyCode__;
        Sys.Helpers.TmpData.SetValue("AllowedWarehouses", UserPropertiesValues.AllowedWarehouses__ || []);
        Sys.Helpers.TmpData.SetValue("HasMarketDojoCredentials", UserPropertiesValues.HasMarketDojoCredentials());
        //We add company code to user when PR is in approbation to validate information for another company code
        //Ex: One people have access to two company code, and the approver only one of them, the approver could validate this PR by giving us the "right".
        //Use only when company code field is readonly
        if (!UserPropertiesValues.IsAllowedCompanyCode(companyCode) && Data.GetValue("RequisitionStatus__") == PRStatus.draft) {
            Data.SetError("CompanyCode__", "Field value does not belong to table!");
        }
        const filter = UserPropertiesValues.GetAllowedCompanyCodesFilter(Data.GetValue("RequisitionStatus__") == PRStatus.draft ? null : companyCode);
        Controls.CompanyCode__.SetFilter(filter);
        Data.SetValue("CompanyCode__", companyCode);
        // We start loading the supply types as soon as possible and we will synchronize later
        await Lib.Purchasing.SupplyType.manager.Query(Data.GetValue("CompanyCode__"));
        const companyCodeValues = await Lib.P2P.CompanyCodesValue.QueryValues(companyCode);
        await Lib.Purchasing.SetERPByCompanyCode(Data.GetValue("CompanyCode__"));
        Lib.Purchasing.PR.OnConfigurationChange();
        Lib.Spending.Budget.budgetHandler.OnConfigurationChange();
        if (Lib.Purchasing.ShipTo.IsEmpty() && !Lib.Purchasing.ShipTo.IsSetByUser()) {
            await Lib.Purchasing.ShipTo.FillFromCompanyCode();
        }
        if (Object.keys(companyCodeValues).length) {
            Data.SetValue("LocalCurrency__", companyCodeValues.Currency__);
            await companyCodeValues.currencies.QueryRate();
        }
        else {
            Data.SetError("CompanyCode__", "_This CompanyCode does not exist in the table.");
        }
    }
    CustomScript.LoadUserProperties = LoadUserProperties;
    FixLayoutBeforeStarting();
    async function TryUpdateFromSourcing() {
        const currentStatus = Data.GetValue("RequisitionStatus__");
        const isEditableStep = currentStatus === PRStatus.toReview || currentStatus === PRStatus.draft;
        const isUserAuthorisedToEdit = !ProcessInstance.isReadOnly && viewer.IsCurrentContributor && (Lib.P2P.IsOwnerOrBackup() || Lib.P2P.IsAdmin());
        if (!isEditableStep || !isUserAuthorisedToEdit) {
            const popUpMessage = !isEditableStep ? "_Warning step not editable" : "_Warning not authorized to edit";
            Popup.Alert(popUpMessage, "warn", null, "_PR is not updatable");
            throw popUpMessage;
        }
        const shouldRemoveCatalogItems = await Lib.Purchasing.Sourcing.PR.ShowPRUpdateDialog();
        if (shouldRemoveCatalogItems) {
            Lib.Purchasing.Sourcing.PR.RemoveCatalogItemsFromSourcingData();
        }
        await Lib.Purchasing.Sourcing.PR.UpdatePRFromData();
        Lib.Purchasing.PR.LineItems.ExtendRows();
    }
    CustomScript.TryUpdateFromSourcing = TryUpdateFromSourcing;
    function DisplayImportedPRIssue() {
        if (Data.GetValue("Origin__") !== Lib.P2P.PurchaseRequisitionOrigin.EXTERNAL_FILE) {
            return;
        }
        const importedPRIssues = Variable.GetValueAsString("ImportedPRIssues");
        if (Sys.Helpers.IsEmpty(importedPRIssues)) {
            return;
        }
        try {
            const warnings = JSON.parse(importedPRIssues);
            if (Array.isArray(warnings)) {
                Lib.Purchasing.PR.TopPaneWarning.AddImportedPRIssue(warnings);
            }
        }
        catch (error) {
            Log.Error(`DisplayImportedPRIssue: Failed to parse imported PR warnings: ${error}`);
        }
    }
    CustomScript.DisplayImportedPRIssue = DisplayImportedPRIssue;
    async function preloadAndStart() {
        var _a;
        try {
            await Lib.Purchasing.LoadParameters();
            if (!viewer.IsReadOnly) {
                // LoadUserProperties should be done after LoadAncestorData
                await FromAncestorManager.LoadAncestorData();
                await LoadUserProperties();
            }
            else if (Lib.Purchasing.PRLineItems.HasSourcingEvents()) {
                await CompanyCodeManager.SetCompanyName();
                await LoadMarketDojoCredentialsFromUserProperties();
            }
            else {
                await CompanyCodeManager.SetCompanyName();
            }
            // ERP Specific initialization ("SAPConfiguration" Variable) is done in this function, and ERP could be needed in OnLoad user exit
            Lib.Purchasing.Browse.Init();
            await Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.OnLoad");
            await LoadCachedData();
            await Start();
            if ((_a = Lib.Purchasing.Sourcing.PR.GetParsedData()) === null || _a === void 0 ? void 0 : _a.procurementDocId) {
                await TryUpdateFromSourcing();
            }
        }
        catch (error) {
            Log.Error(error);
        }
        finally {
            DisplayImportedPRIssue();
            //If URL contains sourcingItemIndexes, we want to keep the wait screen until the sourcing popup is shown
            if (Lib.Purchasing.Sourcing.PR.GetSourcingItemIndexesFromURL().length === 0) {
                Lib.Purchasing.PR.GlobalLayout.HideWaitScreen();
            }
            ProcessInstance.SetSilentChange(false);
            await Sys.Helpers.TryCallFunction("Lib.PR.Customization.Client.OnHTMLScriptEnd");
            Log.TimeEnd("CustomScript");
        }
    }
    CustomScript.preloadAndStart = preloadAndStart;
    const promiseLayoutLoadAndStart = preloadAndStart();
    Sys.Helpers.Synchronizer.OnProgressFromPromise(promiseLayoutLoadAndStart, { progressDelay: 60000 });
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map