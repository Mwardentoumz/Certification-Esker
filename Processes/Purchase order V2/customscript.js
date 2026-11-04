"use strict";
var CustomScript;
(function (CustomScript) {
    const poSpendingDispatcher = Lib.Purchasing.poSpendingDispatcher;
    const ContractSpendingHandler = Lib.Spending.Contract.Handler;
    const POContractSpending = Lib.Purchasing.POContractSpending;
    const ProjectSpendingHandler = Lib.Spending.Project.Handler;
    const POProjectSpending = Lib.Purchasing.POProjectSpending;
    const POStatus = Lib.Purchasing.POStatus;
    const viewer = Lib.Purchasing.PO.viewer;
    const wkfController = Lib.Purchasing.PO.Workflow.controller;
    CustomScript.formTemplateManager = Lib.Purchasing.PO.FormTemplate.Get();
    Log.Time("CustomScript");
    const g_initialStatus = Data.GetValue("OrderStatus__");
    const g_state = Data.GetValue("State");
    const g_isInternal = Data.GetValue("IsInternal__");
    const g_waitingForEditAck = Lib.Purchasing.PO.ERP.IsWaitingForAck()
        && !Lib.Purchasing.PO.ERP.IsWaitingForAck("ERPAckCreate" /* Lib.Purchasing.PO.ERP.SubStatus.Create */);
    const g_hasERPEditError = Lib.Purchasing.PO.ERP.g_hasERPEditError;
    async function CheckResumeWithActionPending(action) {
        let result = null;
        if (Data.GetValue("RuidEx")) {
            try {
                result = await ProcessInstance.CheckResumeWithActionPending(action);
            }
            catch (error) {
                Log.Error("Error checking action pending status: " + JSON.stringify(error.errors));
            }
        }
        return result && result.hasResumeActionPending;
    }
    async function IsCancelable() {
        const isBuyerOrBackUpOrAdmin = viewer.IsBuyerOrBackUp || viewer.IsAdminNotOwner;
        return !Lib.Purchasing.PO.ERP.IsWaitingForAck()
            && isBuyerOrBackUpOrAdmin
            && !Lib.Purchasing.POItems.g_hasValidGoodsReceipt
            && ProcessInstance.state < 100
            && ProcessInstance.state !== 50
            && !ProcessInstance.isEditing
            && !g_isInternal
            && !Lib.Purchasing.POItems.IsBillingCompleted()
            && !await CheckResumeWithActionPending(["Cancel_purchase_order"]);
    }
    function RequiredUpdateFromGR() {
        return g_initialStatus === POStatus.awaitingAutoGRProcessing || g_initialStatus === POStatus.toReceive || g_initialStatus === POStatus.received || g_waitingForEditAck;
    }
    async function IsProcessingERPAck() {
        return await CheckResumeWithActionPending([
            "OnERPAckReceived",
            "OnERPAckReceived-Update",
            "OnERPAckReceived-CancelItems",
            "OnERPAckReceived-ReOpenItems",
            "OnERPAckReceived-Cancel"
        ]);
    }
    let topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarning__);
    CustomScript.g_isEditing = Lib.Purchasing.POItems.g_isEditing;
    poSpendingDispatcher.Register(Lib.Purchasing.poBudgetSpending);
    const contractSpendingHandler = new ContractSpendingHandler();
    const poContractSpending = new POContractSpending(contractSpendingHandler, null);
    poSpendingDispatcher.Register(poContractSpending);
    const projectSpendingHandler = new ProjectSpendingHandler();
    const poProjectSpending = new POProjectSpending(projectSpendingHandler, null);
    poSpendingDispatcher.Register(poProjectSpending);
    async function LoadItemsPriceCondition() {
        const status = Data.GetValue("OrderStatus__");
        const canAddItems = (!Lib.P2P.IsAdminNotOwner() && status === POStatus.toOrder) || (status === POStatus.toReceive && CustomScript.g_isEditing && !Lib.Purchasing.POItems.g_hasValidGoodsReceipt);
        if (canAddItems) {
            let itemSelector = [];
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                itemSelector.push({
                    ItemNumber__: item.GetValue("ItemNumber__"),
                    VendorNumber__: Data.GetValue("VendorNumber__")
                });
            });
            await Lib.Purchasing.ConditionedPricing.PopulateCacheConditionedPricingData(itemSelector);
            await Sys.Helpers.Data.ForEachTableItemAsync("LineItems__", async function (lineItem) {
                await Lib.Purchasing.POItems.ComputePriceCondition(lineItem);
            });
        }
    }
    CustomScript.LoadItemsPriceCondition = LoadItemsPriceCondition;
    ///////////////////////////////////////////////PROGRESS END////////////////////////////////////////////////////////////////////
    //#region PO in punchout mode
    function UpdatePOLayoutAsPunchoutMode() {
        if (Data.GetValue("EmailNotificationOptions__") == "PunchoutMode") {
            Lib.Purchasing.Punchout.PO.UpdatePane();
            Controls.AdditionalFees__.SetItemCount(0);
            if (Lib.Purchasing.IsMultiShipTo()) {
                Lib.Purchasing.ShipTo.CheckAllSameDeliveryAddress();
            }
        }
        else {
            Lib.Purchasing.Punchout.PO.ResetPane();
        }
    }
    function SetPunchoutLineItemsToReadOnly() {
        let nbItem = Math.min(Controls.LineItems__.GetItemCount(), Controls.LineItems__.GetLineCount());
        for (let lineIdx = 0; lineIdx < nbItem; lineIdx++) {
            let row = Controls.LineItems__.GetRow(lineIdx);
            if (row.IsVisible()) {
                Lib.Purchasing.POItems.Items.OnRefreshRow(lineIdx);
            }
        }
    }
    //#endregion
    //DeclareEvent
    (() => {
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineItems__.FreeDimension1__, Lib.P2P.FreeDimension.DefineOnSelectItem("FreeDimension1ID__", "Code__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1ID__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1ID__"));
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineItems__.FreeDimension1ID__, Lib.P2P.FreeDimension.DefineOnSelectItem("FreeDimension1__", "Description__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1__"));
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineItems__.ProjectName__, Lib.Purchasing.POItems.ColumsBehaviour.ItemProjectName.OnSelectItem, Lib.Purchasing.POItems.ColumsBehaviour.ItemProjectName.OnUnknownOrEmptyValue, Lib.Purchasing.POItems.ColumsBehaviour.ItemProjectName.OnUnknownOrEmptyValue);
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineItems__.ProjectNumber__, Lib.Purchasing.POItems.ColumsBehaviour.ItemProjectNumber.OnSelectItem, Lib.Purchasing.POItems.ColumsBehaviour.ItemProjectNumber.OnUnknownOrEmptyValue, Lib.Purchasing.POItems.ColumsBehaviour.ItemProjectNumber.OnUnknownOrEmptyValue);
        Controls.EmailNotificationOptions__.OnChange = function () {
            UpdatePOLayoutAsPunchoutMode();
        };
        /* Line Items */
        Controls.LineItems__.ItemRequestedDeliveryDate__.OnChange = function () {
            if (!CustomScript.g_isEditing) {
                Lib.Purchasing.CheckPO.CheckLeadTime(this.GetItem());
            }
            Lib.Purchasing.CheckPO.CheckItemsDeliveryDates({
                // return item index - call with inWholeTable (1-based API)
                specificItemIndex: this.GetRow().GetLineNumber(/*inWholeTable*/ true) - 1
            });
        };
        Controls.LineItems__.ItemQuantity__.OnChange = Lib.Purchasing.POItems.Items.ItemQuantity.OnChange;
        Controls.LineItems__.ItemUnitPrice__.OnChange = Lib.Purchasing.POItems.Items.Unit_Price.OnChange;
        Controls.LineItems__.ItemDescription__.OnChange = Lib.Purchasing.POItems.Items.Description.OnChange;
        Controls.LineItems__.ItemTaxCode__.SetAttributes(Lib.Purchasing.POItems.Items.TaxCode.Attributes);
        Controls.LineItems__.ItemTaxCode__.OnSelectItem = Lib.Purchasing.POItems.Items.TaxCode.OnSelectItem;
        Controls.LineItems__.OnDeleteItem = Lib.Purchasing.POItems.Items.OnDeleteItem;
        Controls.LineItems__.OnAddItem = Lib.Purchasing.POItems.Items.OnAddItem;
        Controls.LineItems__.OnRefreshRow = Lib.Purchasing.POItems.Items.OnRefreshRow;
        Controls.LineItems__.OnCheckIfItemDeletable = Lib.Purchasing.POItems.Items.OnCheckIfItemDeletable;
        Controls.LineItems__.ContractInformation__.OnClick = Lib.Purchasing.POItems.Items.Contract.Open;
        Controls.LineItems__.PRNumber__.OnClick = Lib.Purchasing.POItems.Items.PRNumber.OnClick;
        Controls.LineItems__.ItemGLAccount__.OnSelectItem = Lib.Purchasing.POItems.Items.GLAccount.OnSelectItem;
        Controls.LineItems__.ItemGLAccount__.OnChange = Lib.Purchasing.POItems.Items.GLAccount.OnChange;
        Controls.LineItems__.ItemNetAmount__.OnChange = Lib.Purchasing.POItems.Items.NetAmount.OnChange;
        Controls.ValidityStart__.OnChange = function () {
            Lib.Purchasing.CheckPO.CheckValidityPeriod("ValidityStart__");
        };
        Controls.ValidityEnd__.OnChange = function () {
            Lib.Purchasing.CheckPO.CheckValidityPeriod("ValidityEnd__");
        };
    })();
    /** ******************* **/
    /** Form initialization **/
    /** ******************* **/
    const globalLayout = Lib.Purchasing.PO.GlobalLayout;
    function InitConversationPane() {
        const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({ Options: Lib.P2P.Conversation.defaultOptions }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
        Controls.ConversationUI__.Init(conversationInfo);
        Controls.ConversationUI__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsCustomer));
        Lib.Purchasing.PO.FormTemplate.TmpData.hasCustomerOrderNumber = !!Variable.GetValueAsString("CustomerOrderNumber");
    }
    async function InitButton() {
        const promises = [
            InitManualReceiptButton(),
            InitBillingCompleteControls()
        ];
        await Promise.all(promises);
    }
    function InitBrowsePRItems() {
        let attributes = "";
        Sys.Helpers.Object.ForEach(Lib.Purchasing.Items.PRItemsDBInfo.fields, function (field) {
            attributes += Sys.Helpers.IsPlainObject(field) ? field.name : field;
            attributes += "|";
        });
        //remove trailing | character
        attributes = attributes.slice(0, -1);
        Controls.BrowsePRItems__.SetAttributes(attributes);
    }
    function InitContractBrowses() {
        function On() {
            Lib.Purchasing.CheckPO.CheckContractCoherency(this.GetItem(), Data.GetValue("VendorNumber__"), Data.GetValue("Currency__"), true);
        }
        Lib.Purchasing.Contract.InitContractBrowses(Controls.LineItems__, null, On, On);
    }
    //#region billing completion
    async function InitBillingCompleteControls() {
        Lib.Purchasing.PO.FormTemplate.TmpData.InvoiceStatus = await Lib.Purchasing.RelatedVIP.GetPOInvoiceStatus();
        try {
            Lib.Purchasing.PO.FormTemplate.TmpData.HasBillingResumeActionPending = await CheckResumeWithActionPending(["UpdateBillingCompleted", "ReopenBilling"]);
        }
        catch (errorResult) {
            // Error retrieving hasResumeActionPending
            Log.Info(JSON.stringify(errorResult.errors));
        }
    }
    CustomScript.InitBillingCompleteControls = InitBillingCompleteControls;
    //#endregion
    async function InitLayout() {
        await FixLayout();
        // ConditionalLayout and InitTopMessageWarning needs FixLayout to be completed
        await ConditionalLayout();
        await InitTopMessageWarning();
    }
    async function FixLayout() {
        const promisesToWait = [];
        if (viewer.IsBuyerOrBackUp) {
            Process.SetHelpId("5031");
        }
        Lib.Purchasing.PO.InitTmpData();
        // Need to move CheckResumeWithActionPending to these TmpData assignments
        Lib.Purchasing.PO.FormTemplate.TmpData.IsProcessingERPAck = await IsProcessingERPAck();
        Lib.Purchasing.PO.FormTemplate.TmpData.HasSkippedActionPending = await CheckResumeWithActionPending(["OnERPAckReceived-Cancel"]);
        Lib.Purchasing.PO.FormTemplate.TmpData.IsCancelable = await IsCancelable();
        globalLayout.Hide(false);
        Lib.Purchasing.PO.Banner.Init();
        Lib.Purchasing.PO.TaxSummaryPane.Init(CustomScript.formTemplateManager);
        globalLayout.HideDeprecatedControls();
        if (!Data.GetValue("CorporateCurrency__")) {
            Data.SetValue("CorporateCurrency__", Sys.Parameters.GetInstance("P2P").GetParameter("CorporateCurrency", ""));
        }
        Lib.Purchasing.POItems.Items.InitLayout();
        Lib.Purchasing.PO.AdditionalFeesPane.Init(CustomScript.formTemplateManager);
        InitConversationPane();
        Lib.Purchasing.PO.ShipToPane.Init(CustomScript.formTemplateManager);
        Lib.Purchasing.PO.GeneralPane.Init(CustomScript.formTemplateManager);
        promisesToWait.push(InitButton());
        Lib.Purchasing.PO.Workflow.Init(CustomScript.formTemplateManager);
        promisesToWait.push(Lib.Purchasing.PO.ButtonsBar.Init(CustomScript.formTemplateManager, globalLayout));
        promisesToWait.push(Lib.Purchasing.PO.RelatedDocuments.Init(CustomScript.formTemplateManager));
        Lib.Purchasing.PO.VendorPane.Init(CustomScript.formTemplateManager);
        InitBrowsePRItems();
        Lib.Purchasing.POProgressBar.InitPane(CustomScript.formTemplateManager);
        InitContractBrowses();
        promisesToWait.push(InitBillingCompleteControls());
        Lib.Purchasing.Vendor.Client.DetermineCombinedVendorTooltip();
        Controls.BuyerComment__.SetPlaceholder("_buyerComment_Placeholder");
        Controls.BuyerComment__.SetHelpData("_buyerComment_HelpText");
        Lib.Purchasing.POItems.Init(CustomScript.formTemplateManager);
        Lib.Purchasing.PO.DownPaymentPane.Init(CustomScript.formTemplateManager);
        // Need to stay. visibility is handled by another lib 
        Controls.TopPaneWarning.Hide(true);
        Lib.Purchasing.PO.DownPayment.UpdateGui(Data.GetValue("OrderStatus__"));
        await Sys.Helpers.Promise.All(promisesToWait);
        await Lib.P2P.PolicyRules.Init(CustomScript.formTemplateManager, "Purchase Order V2");
        await CustomScript.formTemplateManager.Apply();
        await CustomScript.formTemplateManager.WaitUntilNoMoreChange();
        globalLayout.HideWaitScreen();
        globalLayout.Ready();
        Lib.Purchasing.PO.UpdateLayout();
    }
    CustomScript.FixLayout = FixLayout;
    async function InitTopMessageWarning() {
        const promisesToWait = [];
        promisesToWait.push(Lib.P2P.DisplayArchiveDurationWarning("PAC", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(topMessageWarning)));
        promisesToWait.push(Lib.P2P.DisplayAdminWarning("PAC", function (displayName) {
            topMessageWarning.Add(Language.Translate("_View as admin on bealf of {0}", false, displayName));
        }));
        promisesToWait.push(Lib.P2P.DisplayBackupUserWarning("PAC", function (displayName) {
            topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName));
        }, function () {
            if (Data.GetValue("OwnerID") == Sys.Helpers.Globals.User.loginId) {
                return null;
            }
            let buyerLogin = Controls.BuyerLogin__.GetValue() || "";
            let login = null;
            if (g_state === "50" || g_state === "70" || g_state === "90") {
                // Display banner for the backup of the buyer
                if (User.IsBackupUserOf(buyerLogin)) {
                    login = buyerLogin;
                }
                else {
                    // Display banner for the backup of the recipient
                    let g = Sys.Helpers.Globals;
                    let recipientDn;
                    let i = 0;
                    let table = Data.GetTable("LineItems__");
                    let count = table.GetItemCount();
                    while (!recipientDn && i < count) {
                        let row = table.GetItem(i);
                        recipientDn = row.GetValue("RecipientDN__");
                        if (!g.User.IsBackupUserOf(recipientDn)) {
                            recipientDn = null;
                        }
                        ++i;
                    }
                    // Display warning on state = 90 and 70
                    if ((g_state === "70" || g_state === "90") && User.IsBackupUserOf(Data.GetValue("OwnerId"))) {
                        recipientDn = Data.GetValue("OwnerId");
                    }
                    let recipientLogin = recipientDn ? Sys.Helpers.String.ExtractLoginFromDN(recipientDn) : null;
                    login = recipientLogin;
                }
            }
            return login;
        }));
        await Sys.Helpers.Promise.All(promisesToWait);
    }
    CustomScript.InitTopMessageWarning = InitTopMessageWarning;
    async function InitManualReceiptButton() {
        let status = Data.GetValue("OrderStatus__");
        const hasNoGoodsReceiptItemsReceivable = await Lib.Purchasing.POItems.HasNoGoodsReceiptItems({
            onlyOutdatedItems: false,
            onlyNonInvoicedItems: true
        });
        // Possible improvement : check both receivability and role BY LINE to determine diplsay of manual receipt button
        const hasUserAuthorizedRole = viewer.IsCurrentUserApSpecialist || viewer.IsBuyerOrBackUp || viewer.IsRecipientOrBackup || viewer.IsAdminNotOwner;
        const isOrderedAndNotClosedForReception = (status === POStatus.toReceive || status === POStatus.received);
        // Hidden if PO is not receivable or noGR items are invoiced (even partially)
        Lib.Purchasing.PO.FormTemplate.TmpData.IsManualReceptionAvailable = hasNoGoodsReceiptItemsReceivable && isOrderedAndNotClosedForReception && hasUserAuthorizedRole && !Lib.ERP.IsDocCreatedInERP() && !Lib.Purchasing.POItems.IsBillingCompleted() && !ProcessInstance.isEditing;
    }
    CustomScript.InitManualReceiptButton = InitManualReceiptButton;
    async function ConditionalLayout() {
        const promisesToWait = [];
        const status = Data.GetValue("OrderStatus__");
        if (status !== POStatus.toOrder || Lib.P2P.IsAdminNotOwner()) {
            if (Lib.P2P.IsAdminNotOwner()) {
                Controls.DocumentsPanel.SetReadOnly(true);
            }
            let nbAttach = Attach.GetNbAttach();
            Controls.DocumentsPanel.SetNumberOfNonRemovableAttachments(nbAttach);
        }
        else if (status === POStatus.toOrder && viewer.IsReadOnly) {
            Controls.DocumentsPanel.SetReadOnly(true);
        }
        else if (ProcessInstance.isDesignActive) {
            let poTemplateInfos = Lib.Purchasing.PO.Export.GetPOTemplateInfos();
            if (poTemplateInfos.fileFormat === "RPT") {
                Lib.Purchasing.PO.FormTemplate.TmpData.IsCrystalReportTemplateAvailable = true;
            }
        }
        let controlsToDisableIfPendingAction = [];
        // reception pending and completed
        if (status === POStatus.toReceive || status === POStatus.awaitingAutoGRProcessing || status === POStatus.received || g_hasERPEditError) {
            if (status !== POStatus.received) {
                // enable editable all modifiable fields such as delivery date
                if (CustomScript.g_isEditing) {
                    let nextAlert = Lib.CommonDialog.NextAlert.GetNextAlert();
                    if (!nextAlert || !nextAlert.isError) {
                        promisesToWait.push(EditingLayout());
                    }
                }
            }
            promisesToWait.push(CheckPendingActions());
        }
        SetPunchoutLineItemsToReadOnly();
        if (Lib.Purchasing.HasOnlyPunchoutItems()) {
            if (status === POStatus.toOrder) {
                // Set punchout mode by default if all items are punchout (and only in draft)
                Data.SetValue("EmailNotificationOptions__", "PunchoutMode");
            }
            UpdatePOLayoutAsPunchoutMode();
        }
        else if (status === POStatus.toOrder) {
            promisesToWait.push(Lib.Purchasing.CheckPO.CheckDataCoherency(false));
            const isNew = ProcessInstance.id == null;
            if (isNew) {
                promisesToWait.push(Lib.Purchasing.Vendor.QueryVendorPreferences(Data.GetValue("CompanyCode__"), Data.GetValue("VendorNumber__"))
                    .Then((preferences) => {
                    let POMethod = preferences === null || preferences === void 0 ? void 0 : preferences.POMethod__;
                    if (POMethod) {
                        if (POMethod == "SendToVendor" || POMethod == "DontSend") {
                            Data.SetValue("EmailNotificationOptions__", POMethod);
                        }
                    }
                })
                    .Catch((e) => {
                    Log.Error("Error querying preferred PO method: " + e);
                }));
            }
        }
        return Sys.Helpers.Promise.All(promisesToWait);
    }
    CustomScript.ConditionalLayout = ConditionalLayout;
    async function CheckPendingActions() {
        const hasResumeActionPending = await CheckResumeWithActionPending();
        Lib.Purchasing.PO.FormTemplate.TmpData.HasCancelUnreceivedItemsPending = await CheckResumeWithActionPending(["Cancel_unreceived_items"]);
        if (hasResumeActionPending || ProcessInstance.state < 90) {
            Lib.Purchasing.PO.FormTemplate.TmpData.HasResumeActionPending = true;
        }
    }
    CustomScript.CheckPendingActions = CheckPendingActions;
    async function EditingLayout() {
        Controls.LineItems__.ItemNetAmount__.SetLabel("_ItemToOrderAmount");
        Controls.LineItems__.ItemOpenAmount__.Hide(true);
        Lib.Purchasing.PO.FormTemplate.TmpData.EditingLayout = true;
        Lib.CommonDialog.NextAlert.Reset();
        let focusCtrl;
        let table = Controls.LineItems__;
        let lineItemsCount = Math.min(table.GetItemCount(), table.GetLineCount());
        for (let i = lineItemsCount - 1; i >= 0; i--) {
            let row = table.GetRow(i);
            if (!row.ItemDeliveryComplete__.IsChecked()) {
                focusCtrl = row.ItemRequestedDeliveryDate__;
                focusCtrl.SetReadOnly(false);
            }
        }
        if (focusCtrl) {
            focusCtrl.Focus();
        }
        Lib.Purchasing.POItems.ItemsNumberHandler.StockItemsNumberBeforeEdit();
        Lib.Purchasing.PO.Edition.WatchAllEditionChanges();
        await Lib.Purchasing.CheckPO.CheckDataCoherency(false);
    }
    async function RollbackOrRetryPOChanges(nextAlert) {
        let firstSaveReturn = false;
        if (nextAlert.behaviorName === "POEditionError") {
            // first time, we are still in editing mode. We cannot do any action in this mode.
            await EditingLayout();
            firstSaveReturn = !!Data.GetActionName();
        }
        else {
            Lib.Purchasing.PO.FormTemplate.TmpData.IsOpenCloseReceptionInError = true;
        }
        let rollbackNeeded = Lib.Purchasing.PO.Edition.Rollback.IsRollbackNeeded();
        if (rollbackNeeded) {
            Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit("RollbackEditionAndQuit");
            Popup.Alert(nextAlert.message, true, null, nextAlert.title);
        }
        else {
            Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                switch (action) {
                    case "Yes":
                        if (firstSaveReturn) {
                            Controls.SaveEditing_.Click();
                        }
                        else if (!Process.ShowFirstError()) {
                            const actions = {
                                POEditionError: "RetryEditOrder",
                                CancelUnreceivedItemsError: "Cancel_unreceived_items",
                                ReOpenUnreceivedItemsError: "Reopen_unreceived_items"
                            };
                            if (g_state !== "90") {
                                ProcessInstance.Approve(actions[nextAlert.behaviorName]);
                            }
                            else {
                                ProcessInstance.ResumeWithActionAsynchronous(actions[nextAlert.behaviorName]);
                            }
                        }
                        break;
                    default:
                        break;
                }
            }, nextAlert, "_Retry now", "_Retry later");
        }
    }
    /** ***** **/
    /** START **/
    /** ***** **/
    function Start() {
        var _a;
        const promisesToWait = [];
        Log.Time("Start");
        promisesToWait.push(Lib.Purchasing.InitTechnicalFields());
        /** ************************** **/
        /** ERP Specific initialization */
        /** ************************** **/
        Lib.Purchasing.Browse.Init();
        promisesToWait.push(InitLayout());
        if (wkfController.GetTableIndex() === 0) {
            Lib.Purchasing.PO.Workflow.UpdateRolesSequence(Lib.Purchasing.PO.DownPayment.IsAsked());
        }
        else {
            if (Controls.OrderStatus__.GetValue().toUpperCase() === POStatus.toOrder.toUpperCase()) {
                //This purchase order need to be verified
                wkfController.AllowRebuild(true);
                Lib.Purchasing.PO.Workflow.UpdateRolesSequence(Lib.Purchasing.PO.DownPayment.IsAsked());
            }
        }
        Lib.Purchasing.PO.FormTemplate.TmpData.NextAlert = (_a = Lib.CommonDialog.NextAlert.GetNextAlert()) === null || _a === void 0 ? void 0 : _a.behaviorName;
        Lib.CommonDialog.NextAlert.Show({
            // special behaviors for PO creation
            "POCreationInfo": {
                IsShowable: function () {
                    let showable = !!Data.GetActionName();
                    // Avoid when popup is shown the "PO changed" warning
                    if (showable) {
                        Lib.Purchasing.PO.FormTemplate.TmpData.ReadOnlyForm = true;
                    }
                    return showable;
                },
                OnOK: function () {
                    // Close or go to the next document
                    if (!ProcessInstance.Next("next")) {
                        ProcessInstance.Quit("quit");
                    }
                }
            },
            "POCreationError": {
                Popup: function (nextAlert) {
                    Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                ProcessInstance.Approve("Retry_");
                                break;
                            case "Cancel":
                                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit();
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_PO not found in ERP");
                }
            },
            "POEditInfo": {
                IsShowable: function () {
                    return !!Data.GetActionName();
                },
                OnOK: function () {
                    ProcessInstance.Quit("quit");
                }
            },
            "SendToVendorError": {
                Popup: function (nextAlert) {
                    Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                ProcessInstance.Approve("DoCurrentWorkflowAction");
                                break;
                            case "Cancel":
                                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit();
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_Retry now", "_Retry later");
                }
            },
            "SendEmailNotifications": {
                Popup: function (nextAlert) {
                    Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                ProcessInstance.Approve("SendEmailNotifications");
                                break;
                            case "Cancel":
                                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit();
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_Retry now", "_Retry later");
                }
            },
            "ClearSequence": {
                IsShowable: function () {
                    Data.SetValue("OrderNumber__", "");
                    return true;
                }
            },
            "CancelUnreceivedItemsError": {
                Popup: function (nextAlert) {
                    RollbackOrRetryPOChanges(nextAlert);
                }
            },
            "ReOpenUnreceivedItemsError": {
                Popup: function (nextAlert) {
                    RollbackOrRetryPOChanges(nextAlert);
                }
            },
            "POEditionError": {
                Popup: function (nextAlert) {
                    RollbackOrRetryPOChanges(nextAlert);
                }
            },
            "POCancelError": {
                Popup: function (nextAlert) {
                    Lib.CommonDialog.NextAlert.PopupYesCancel(function (action) {
                        switch (action) {
                            case "Yes":
                                Controls.Cancel_purchase_order.Click();
                                break;
                            case "Cancel":
                                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit();
                                break;
                            default:
                                break;
                        }
                    }, nextAlert, "_Retry PO cancel");
                }
            },
            "EditPOREquestError": {
                Popup: function (nextAlert) {
                    EditingLayout();
                    Popup.Alert(nextAlert.message, true, null, nextAlert.title);
                }
            }
        });
        promisesToWait.push(Lib.Purchasing.RelatedVIP.HasInvoicesOnPOItems()
            .Then(function (HasInvoices) {
            Lib.Purchasing.PO.FormTemplate.TmpData.HasInvoices = HasInvoices;
        }));
        if (ProcessInstance.state === 50) {
            const status = Data.GetValue("OrderStatus__");
            if (status === POStatus.toOrder) {
                Lib.Purchasing.SetDocumentReadonlyAndHideAllButtonsExceptQuit();
            }
        }
        if (!ProcessInstance.state) {
            ProcessInstance.DisableExtractionScript();
        }
        Process.ShowFirstError();
        return Sys.Helpers.Promise.All(promisesToWait)
            .Then(() => {
            /* All the layout is fixed, try to call for PS customization */
            const func = Sys.Helpers.TryGetFunction("Lib.PO.Customization.Client.CustomizeLayout");
            if (func) {
                return func(CustomScript.formTemplateManager);
            }
            else {
                return Sys.Helpers.TryCallFunction("Lib.PO.Customization.Client.CustomiseLayout", CustomScript.formTemplateManager);
            }
        })
            .Finally(() => {
            Log.TimeEnd("Start");
        });
    }
    /** *************** **/
    /** BEFORE STARTING **/
    /** *************** **/
    function FixLayoutBeforeStarting() {
        Log.Info("FixLayoutBeforeStarting");
        Process.ShowFirstErrorAfterBoot(false);
        globalLayout.Hide(true);
        globalLayout.ShowWaitScreen();
    }
    function FilterInheritedPRAttachments() {
        for (let i = Attach.GetNbAttach() - 1; i >= 0; i--) {
            const attachmentName = Attach.GetAttach(i).GetNiceName();
            const shouldAttach = Sys.Helpers.TryCallFunction("Lib.PO.Customization.Common.ShouldAttachFromPRToPO", attachmentName);
            if (shouldAttach === false) {
                Log.Info("[PurchaseOrderCustomScript] Attachment excluded from PO: " + attachmentName);
                Attach.RemoveAttach(i);
            }
        }
    }
    async function FillPurchaseOrder() {
        Log.Time("FillPurchaseOrder");
        Log.Info("Filling purchase order...");
        let prRuidEx;
        let filter = "";
        let options = { resetItems: true, orderByMsn: null, orderByClause: null };
        // ancestor:
        // - we either come from a PR, so we read items from it
        // - or we come from a PR Items admin list, and so we read those PR items
        let ancestorsids = ProcessInstance.selectedRuidFromView;
        if (ancestorsids) {
            let i = 0;
            for (i = 0; i < ancestorsids.length; i++) {
                if (ancestorsids[i].startsWith("CT#")) {
                    // It's a PR item
                    let msn = ancestorsids[i].split(".")[1];
                    filter += "(MSN=" + msn + ")";
                    if (!options.orderByMsn) {
                        options.orderByMsn = [];
                    }
                    options.orderByMsn.push(msn);
                }
                else {
                    // It's a PR
                    prRuidEx = ancestorsids[i];
                    filter += "(PRRUIDEX__=" + prRuidEx + ")";
                    Variable.SetValueAsString("PR_RuidEx__", prRuidEx);
                    options.orderByClause = "LineNumber__ ASC";
                }
            }
            if (i > 1) {
                filter = "(|" + filter + ")";
            }
        }
        if (!filter) {
            Log.Info("No PR RuidEx found on record because this PO is created from scratch. Skip this step.");
            Log.TimeEnd("FillPurchaseOrder");
            return Sys.Helpers.Promise.Resolve();
        }
        // Since the PR can be multi-buyers and the PO mono-buyer => pick only current buyer's items
        filter = "(&(BuyerDN__=$submit-owner)" + filter + "(Status__=" + Lib.Purchasing.PRStatus.toOrder + "))";
        // Filter inherited PR attachments if come from a PR
        if (prRuidEx) {
            FilterInheritedPRAttachments();
        }
        // only no completely ordered items for this ruidex
        Log.Info("Filling PO Form with items from filter: " + filter);
        try {
            await Lib.Purchasing.POItems.FillForm(filter, options);
            Lib.Purchasing.Vendor.Client.PO.lastSelectedVendorName = Data.GetValue("VendorName__");
        }
        catch (e) {
            Lib.CommonDialog.NextAlert.Define("_Purchase order creation error", e, {
                isError: true,
                behaviorName: "POInitError"
            });
        }
        finally {
            Log.TimeEnd("FillPurchaseOrder");
        }
    }
    function UpdatePOFromGR() {
        const promisesToWait = [];
        const status = Data.GetValue("OrderStatus__");
        if (!Lib.Purchasing.ReturnManagement.IsEnabled() && status === POStatus.received) {
            Lib.Purchasing.POProgressBar.UpdateProgressBarIfVisible();
            return Sys.Helpers.Promise.Resolve();
        }
        if (CustomScript.g_isEditing) {
            Lib.Purchasing.PO.Edition.ChangesManager.Watch("OrderStatus__");
            Lib.Purchasing.PO.Edition.ChangesManager.Watch("ItemUndeliveredQuantity__", "LineItems__");
            Lib.Purchasing.PO.Edition.ChangesManager.Watch("ItemDeliveryComplete__", "LineItems__");
            Lib.Purchasing.PO.Edition.ChangesManager.Watch("ItemNetAmount__", "LineItems__");
            promisesToWait.push(Lib.Purchasing.POItems.UpdatePOFromPRAndPO());
        }
        promisesToWait.push(FetchReturnQuantitiesFromReturnOrders()
            .Then((returnedQuantities) => Lib.Purchasing.POItems.UpdatePOFromGR(returnedQuantities))
            .Then(({ hasValidGoodsReceipt }) => {
            Lib.Purchasing.POItems.g_hasValidGoodsReceipt = hasValidGoodsReceipt;
            Lib.Purchasing.POProgressBar.UpdateProgressBarIfVisible();
        })
            .Then(() => {
            //insure that RO related fields/buttons on PO are well updated after RO modifications
            //even if associated GRs are not updated yet
            Lib.Purchasing.POItems.ManageReturnedQuantityVisibility();
        })
            .Catch(error => {
            Log.Error("Error updating progress bar");
            Log.Error(error);
        }));
        return Sys.Helpers.Promise.All(promisesToWait);
    }
    /**
     * When we're back on the PO after having created a Return Order, return quantities are not yet up to date on the GR, so we fetch return quantities on return orders.
     */
    async function FetchReturnQuantitiesFromReturnOrders() {
        if (false == Lib.Purchasing.ReturnManagement.IsEnabled()) {
            return {};
        }
        const results = await Lib.Purchasing.ROItems.GetReturnOrderItems(Data.GetValue("CompanyCode__"), Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", Data.GetValue("OrderNumber__")));
        Log.Info(`[FetchReturnQuantitiesFromReturnOrders] ${results.length} lines`);
        return Lib.Purchasing.ROItems.GroupResultByPOLineNumber(results);
    }
    function OnErrorDuringInitialization() {
        //Need to stay outside of formtemplate in case of crash before formtemplate init
        globalLayout.HideActionButtons();
        Controls.Cancel_purchase_order.Hide(!IsCancelable());
        Controls.Close.Hide(false);
    }
    Sys.Helpers.EnableSmartSilentChange();
    // START - ignore all changes on form during the initialization processing
    Log.Info({
        "ReadOnly": ProcessInstance.isReadOnly,
        "State": ProcessInstance.state
    });
    ProcessInstance.SetSilentChange(true);
    FixLayoutBeforeStarting();
    Log.Info(`OrderStatus__ before update: ${g_initialStatus}`);
    async function preloadAndStart() {
        try {
            Log.Time("LoadParameters");
            await Lib.Purchasing.LoadParameters();
            Log.TimeEnd("LoadParameters");
            //Set up vendor registration custom query (no param check because field will be hidden if param is deactivated)
            Lib.Purchasing.Vendor.Client.PO.InitCombinedVendorBrowsePropertiesAndEventCallbacks();
            await Lib.Purchasing.Vendor.Client.PO.InitVendorCommunicationCultureAndLanguage();
            if (!g_state) {
                await FillPurchaseOrder();
            }
            if (g_initialStatus === POStatus.toOrder) {
                await Lib.Purchasing.Items.CheckProjectFields(Data.GetValue("CompanyCode__"), true);
                Lib.Purchasing.CheckPO.CheckAllLeadTimes();
                Lib.Purchasing.CheckPO.CheckItemsDeliveryDates();
            }
            Lib.Purchasing.Vendor.Client.PO.UpdateCombinedVendorBrowsePropertiesOnConfigurationChange();
            await Lib.Purchasing.Vendor.Client.PO.UpdateVendorFromVendorRegistration();
            if (RequiredUpdateFromGR()) {
                await UpdatePOFromGR();
            }
            const customTransmissionMethods = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomOrderTransmissionMethods") || [];
            if (customTransmissionMethods.length > 0) {
                const availableValues = Controls.EmailNotificationOptions__.GetAvailableValues();
                availableValues.push(...customTransmissionMethods.map(method => method.value + "=" + method.label));
                Controls.EmailNotificationOptions__.SetAvailableValues(availableValues);
            }
            await Sys.Helpers.TryCallFunction("Lib.PO.Customization.Client.OnLoad");
            await LoadItemsPriceCondition();
            await Start();
        }
        catch (e) {
            Log.Error("OnErrorDuringInitialization: " + e);
            OnErrorDuringInitialization();
        }
        finally {
            ProcessInstance.SetSilentChange(false);
        }
    }
    CustomScript.preloadAndStart = preloadAndStart;
    const promiseLayoutLoadAndStart = preloadAndStart();
    Sys.Helpers.Synchronizer.OnProgressFromPromise(promiseLayoutLoadAndStart, { progressDelay: 15000 });
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map