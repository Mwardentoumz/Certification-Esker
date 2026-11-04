"use strict";
var ValidationScript;
(function (ValidationScript) {
    var prSpendingDispatcher = Lib.Purchasing.prSpendingDispatcher;
    var ProjectSpendingHandler = Lib.Spending.Project.Handler;
    var PRProjectSpending = Lib.Purchasing.PRProjectSpending;
    var ProjectSpendingUpdater = Lib.Spending.Project.Updater;
    var ContractSpendingHandler = Lib.Spending.Contract.Handler;
    var ContractSpendingUpdater = Lib.Spending.Contract.Updater;
    var PRContractSpending = Lib.Purchasing.PRContractSpending;
    var prBudgetSpending = Lib.Purchasing.prBudgetSpending;
    var CheckRemainingAsChangedError = Lib.Purchasing.CheckRemainingAsChangedError;
    var CheckRemainingError = Lib.Spending.CheckRemainingError;
    var ErrorSpendingType = Lib.Spending.ErrorSpendingType;
    let hasOutlierValues = false;
    let isSubmissionFromMobileApp = false;
    Lib.Purchasing.PRValidation.intakeRequestPostValidationSync = new Lib.Purchasing.PRValidation.IntakeRequestPostValidationSync();
    Lib.P2P.ScriptContext.Initialize(["FromScript|CreatePR"]);
    const context = Lib.P2P.scriptContext;
    context.LogAction("PR Validation Script");
    Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnValidationScriptBegin", context.name, context.type);
    prSpendingDispatcher.Register(prBudgetSpending);
    const contractSpendingHandler = new ContractSpendingHandler();
    ValidationScript.prContractSpending = new PRContractSpending(contractSpendingHandler, new ContractSpendingUpdater(contractSpendingHandler));
    prSpendingDispatcher.Register(ValidationScript.prContractSpending);
    const projectSpendingHandler = new ProjectSpendingHandler();
    ValidationScript.prProjectSpending = new PRProjectSpending(projectSpendingHandler, new ProjectSpendingUpdater(projectSpendingHandler));
    prSpendingDispatcher.Register(ValidationScript.prProjectSpending);
    const workflow = Sys.WorkflowController.Create({ version: 2 });
    const requiredFields = Lib.Purchasing.CheckPR.RequiredFields;
    const autoSubmitAction = "AutoSubmitAction_";
    const submitAction = "Submit_";
    let g_newComment = Data.GetValue("Comments__");
    let g_sequenceStep = workflow.GetContributorIndex();
    let g_currentContributor = workflow.GetContributorAt(g_sequenceStep);
    const ldaputil = Sys.Helpers.LdapUtil;
    const rolesSequenceForPR = [
        Lib.Purchasing.sequenceRoleRequester,
        Lib.Purchasing.sequenceRoleReviewer,
        Lib.Purchasing.sequenceRoleApprover,
        Lib.Purchasing.sequenceRoleBuyer
    ];
    let OutlierQuantitiesDetected = {
        get value() {
            return Sys.TechnicalData.GetValue("OutlierQuantitiesDetected");
        },
        set value(value) {
            Sys.TechnicalData.SetValue("OutlierQuantitiesDetected", value);
        }
    };
    /** CONTROL HELPERS **/
    let formInError = false;
    async function IsFormInError() {
        var _a;
        requiredFields.CheckUpdatedItems(true);
        requiredFields.ResetGLAccountIfNeeded();
        Lib.Purchasing.PR.Layout.Set((_a = g_currentContributor === null || g_currentContributor === void 0 ? void 0 : g_currentContributor.role) !== null && _a !== void 0 ? _a : "");
        try {
            const lastErrorMessage = await requiredFields.CheckAll();
            if (Lib.P2P.FormHasError() || lastErrorMessage) {
                formInError = true;
                Process.PreventApproval();
            }
        }
        catch (error) {
            Log.Error(`Unhandled promise: ${error}. Prevent posting.`);
            formInError = true;
            Process.PreventApproval();
        }
        return formInError;
    }
    function SendEmailNotifications(contributors, subject, template, backupUserAsCC, customTagsByContributor) {
        var _a;
        for (const contributor of contributors) {
            if (!((_a = contributor.additionalProperties) === null || _a === void 0 ? void 0 : _a.emailNotifSent)) {
                let customTags = !!customTagsByContributor && (contributor.login in customTagsByContributor) ? customTagsByContributor[contributor.login] : null;
                SendEmailNotification(contributor, subject, template, backupUserAsCC, customTags);
                workflow.UpdateAdditionalContributorData(contributor.contributorId, { emailNotifSent: true });
            }
        }
    }
    function SendEmailNotification(contributor, subject, template, backupUserAsCC, customTags) {
        //if you change this structure, plz update the sample in lib_PR_Customization_Server
        const contributorId = contributor instanceof Object ? contributor.login : contributor;
        const options = {
            userId: contributorId,
            subject: subject,
            template: template,
            fromName: "_EskerPurchaseRequisition",
            backupUserAsCC: !!backupUserAsCC,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
            customTags: customTags
        };
        const doSendNotif = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnSendEmailNotification", options);
        if (doSendNotif !== false) {
            Lib.P2P.EmailNotification.SendEmailNotification(options);
        }
    }
    function SendSpendingErrorNotification(error) {
        let errorMessage;
        if (error instanceof CheckRemainingAsChangedError) {
            errorMessage = Language.Translate("_Budget amount has changed", false);
        }
        else if (error instanceof CheckRemainingError) {
            if (!error.withoutEnoughRemaining || error.withoutEnoughRemaining.length === 0) {
                return;
            }
            const spending = error.withoutEnoughRemaining[0];
            if (error.spendingType === ErrorSpendingType.Contract) {
                errorMessage = Language.Translate("_NextAlertContractSpendingNotEnoughRemaining", false, spending.ContractNumber__);
            }
            else if (error.spendingType === ErrorSpendingType.Project) {
                errorMessage = Language.Translate("_NextAlertProjectSpendingNotEnoughRemaining", false, spending.ProjectNumber__);
            }
            else {
                Log.Warn(`Unknown spending type: ${error.spendingType}`);
                return;
            }
        }
        else {
            Log.Warn("Unknown error type");
            return;
        }
        SendEmailNotification(Data.GetValue("LastValidatorUserID__"), "_Budget validation error", "Purchasing_Email_NotifBudgetNotApproved.htm", false, {
            DestinationFullName: Data.GetValue("LastValidatorName__"),
            RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
            RequesterName__: Data.GetValue("RequesterName__"),
            ErrorMessage: errorMessage,
            ValidationUrl: Data.GetValue("ValidationUrl")
        });
    }
    function GiveRightToRecipients(right) {
        let ownerLogin = Lib.P2P.GetOwner().GetValue("login");
        // Get all unique recipients
        let allRecipientLogins = [];
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            allRecipientLogins.push(line.GetValue("RecipientLogin__"));
        });
        allRecipientLogins = Sys.Helpers.Array.GetDistinctArray(allRecipientLogins);
        for (const recipientLogin of allRecipientLogins) {
            // Give right to recipient if different from buyer/treasurer
            if (ownerLogin !== recipientLogin) {
                Log.Info("Grant " + right + " right to recipient: " + recipientLogin);
                Process.AddRight(recipientLogin, right);
            }
        }
    }
    function GiveRightToEverybody() {
        Log.Info("Reset rights");
        Process.ResetRights();
        const lastSaveOwnerID = Data.GetValue("LastSavedOwnerID");
        Log.Info("Grant read right to LastSavedOwnerID: " + lastSaveOwnerID);
        Process.AddRight(lastSaveOwnerID, "read");
        if (workflow.GetNbContributors() > 0) {
            Log.Info("Grant write right to initiator: " + workflow.GetContributorAt(0).login);
            Process.AddRight(workflow.GetContributorAt(0).login, "write");
        }
        // Skips initiator : starts at 1
        for (let i = 1; i < workflow.GetNbContributors(); i++) {
            let step = workflow.GetContributorAt(i);
            Log.Info("Grant read right to workflow user: " + step.login);
            Process.AddRight(step.login, "read");
        }
        // Add right for supervisor
        Lib.Purchasing.SetRightForP2PSupervisor();
        Lib.Purchasing.SetRightForProcurementViewer();
        Lib.Purchasing.SetRightForContractOwner();
        Lib.Purchasing.SetRightForWarehouseManager();
        Lib.Purchasing.SetRightToCustomUsers("PR");
        Log.Info("Grant read right to top managers");
        Lib.Purchasing.PRValidation.GiveReadRightToTopManagers(workflow, parameters);
        GiveRightToRecipients("read");
    }
    function Forward() {
        let idx = workflow.GetContributorIndex();
        let step = workflow.GetContributorAt(idx);
        Log.Info(`Forward to workflow user at idx ${idx} : ${step.login}`);
        GiveRightToEverybody();
        Process.Forward(step.login);
        Process.LeaveForm();
    }
    function ChangeOwner() {
        const idx = workflow.GetContributorIndex();
        const step = workflow.GetContributorAt(idx);
        const currentUserLogin = Lib.P2P.GetOwner().GetValue("Login");
        if (idx === 1) // Give rights only on first step
         {
            GiveRightToEverybody();
        }
        if (currentUserLogin !== step.login) {
            Log.Info(`Change owner from '${currentUserLogin}' to workflow user at idx ${idx}: ${step.login}`);
            Process.ChangeOwner(step.login);
        }
    }
    function ResetAdvisorList() {
        const list = Variable.GetValueAsString("AdvisorLoginList");
        if (list) {
            const logins = list.split("\n");
            for (const login of logins) {
                Log.Info("Grant read right to advisor: " + login);
                Process.SetRight(login, "read");
            }
        }
        Variable.SetValueAsString("AdvisorLoginList", "");
    }
    function AddSharedWith(comment) {
        let prefix = Language.Translate("_Shared with", false, Variable.GetValueAsString("AdvisorName"));
        if (comment) {
            return prefix + ": " + comment;
        }
        return prefix;
    }
    function AddOutlierDetected(currentContributor, comment) {
        if (hasOutlierValues) {
            let msg = (currentContributor.role === Lib.Purchasing.roleRequester && "_Submitted with an outlier") ||
                (currentContributor.role === Lib.Purchasing.roleReviewer && "_Reviewed with an outlier") ||
                (currentContributor.role === Lib.Purchasing.roleApprover && "_Approved with an outlier");
            if (msg) {
                msg = Language.Translate(msg);
                comment = comment ? `${comment}\n${msg}` : msg;
            }
        }
        return comment;
    }
    function AddValidatedByAgent(comment) {
        let prefix = Language.Translate("_ValidatedByAgent", false);
        if (comment) {
            return prefix + " - " + comment;
        }
        return prefix;
    }
    let validationDate = null;
    function BuildNewComment(currentContributor, newComment, commentPrefixes) {
        let result = newComment;
        if (commentPrefixes) {
            if (commentPrefixes.sharedWith) {
                result = AddSharedWith(result);
            }
            if (commentPrefixes.onBehalfOf) {
                result = Lib.P2P.AddOnBehalfOf(currentContributor, result);
            }
            if (commentPrefixes.outlierDetected) {
                result = AddOutlierDetected(currentContributor, result);
            }
            if (commentPrefixes.validatedByAgent) {
                result = AddValidatedByAgent(result);
            }
        }
        return result;
    }
    function GetContributionData(sequenceStep, newAction, newComment, commentPrefixes, ignorePrevComment) {
        let currentContributor = workflow.GetContributorAt(sequenceStep);
        currentContributor.action = newAction;
        if (validationDate === null) {
            currentContributor.date = new Date();
            validationDate = currentContributor.date;
        }
        else {
            currentContributor.date = validationDate;
        }
        currentContributor.actualApprover = Sys.Helpers.String.ExtractLoginFromDN(Lib.P2P.GetValidatorOrOwnerLogin());
        currentContributor.device = isSubmissionFromMobileApp ? "mobile" : (Data.GetActionDevice() || "server");
        const builtComment = BuildNewComment(currentContributor, newComment, commentPrefixes);
        let previousComment = "";
        if (!ignorePrevComment) {
            let comment = currentContributor.comment;
            if (comment && comment.length > 0) {
                previousComment = comment;
            }
        }
        let newCommentFormatted = builtComment || "";
        if (!!builtComment && !!previousComment) {
            newCommentFormatted += "\n";
        }
        newCommentFormatted += previousComment;
        Data.SetValue("Comments__", "");
        currentContributor.comment = newCommentFormatted;
        return currentContributor;
    }
    function SetCurrentComment(comment) {
        g_newComment = comment;
        Data.SetValue("Comments__", g_newComment);
        Variable.SetValueAsString("Last_Comments__", g_newComment);
    }
    function SetStatusAccordingToRole(role) {
        // intermediate state when all approvers approved
        if (role === Lib.Purchasing.roleBuyer) {
            Data.SetValue("RequisitionStatus__", Lib.Purchasing.PRStatus.toOrder);
        }
        else if (role === Lib.Purchasing.roleReviewer) {
            Data.SetValue("RequisitionStatus__", Lib.Purchasing.PRStatus.toReview);
        }
        else {
            Data.SetValue("RequisitionStatus__", Lib.Purchasing.PRStatus.toApprove);
        }
    }
    function GoToNextStep(contributionData) {
        const currentContributor = workflow.GetContributorAt(workflow.GetContributorIndex());
        workflow.NextContributor(contributionData);
        const nextContributor = workflow.GetContributorAt(workflow.GetContributorIndex());
        const nextContributors = workflow.GetParallelContributorsOf(nextContributor, true);
        if (nextContributor.role === Lib.Purchasing.roleBuyer) {
            ChangeOwner();
            OnApprovalWorkflowEnd(currentContributor, nextContributor, nextContributors);
        }
        else {
            Forward();
            SendNotificationsToNextContributor(nextContributor, nextContributors);
        }
        //Must be called after ChangeOwner & Forward as they reset the rights on the process.
        GrantValidateRightsToContributors(nextContributors, contributionData);
        return nextContributor;
    }
    function GrantValidateRightsToContributors(nextContributors, contributionData) {
        var _a;
        for (const contributor of nextContributors) {
            Log.Info("Grant validate right to next workflow user: " + contributor.login);
            Process.AddRight(contributor.login, "validate");
            if (!((_a = contributor.additionalProperties) === null || _a === void 0 ? void 0 : _a.startingDate)) {
                workflow.UpdateAdditionalContributorData(contributor.contributorId, { startingDate: new Date(contributionData.date) });
            }
        }
    }
    function OnApprovalWorkflowEnd(currentContributor, nextContributor, nextContributors) {
        if (!(Variable.GetValueAsString("AutoCreateOrderEnabled") ? Lib.Purchasing.IsAutoCreateOrderEnabledFromPopup() : Lib.Purchasing.IsAutoCreateOrderEnabledFromCustomization())) {
            if (nextContributors.length > 0 && nextContributors[0].contributorId === nextContributor.contributorId) {
                let customTagsByBuyers = GetCustomTagsByBuyer();
                SendEmailNotifications(nextContributors, "_A purchase requisition is waiting for your order creation", "Purchasing_Email_NotifBuyer.htm", true, customTagsByBuyers);
            }
        }
        Data.SetValue("ApprovedDate__", new Date());
        ResetAdvisorList();
        const initiator = workflow.GetContributorAt(0);
        const approverIsRequester = currentContributor.login === initiator.login;
        const buyerIsRequester = nextContributor.login === initiator.login;
        if (!approverIsRequester && !buyerIsRequester) {
            SendEmailNotification(initiator, "_A purchase requisition has been approved", "Purchasing_Email_PRValidatedNotifRequester.htm", false, {
                RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                RequesterName__: Data.GetValue("RequesterName__"),
                TotalNetAmount__: Data.GetValue("TotalNetAmount__") + "",
                Currency__: Data.GetValue("Currency__"),
                GoodsSummary: Lib.Purchasing.GetGoodsSummary()
            });
        }
    }
    function DetermineEmailTemplateAndPushNotif(role) {
        if (role === Lib.Purchasing.roleReviewer) {
            return {
                emailTitle: "_A purchase requisition is waiting for your review",
                emailTemplate: "Purchasing_Email_NotifNextReviewer.htm",
                pushNotifTemplate: "NotifNextReviewer",
                shouldSendPushNotif: false
            };
        }
        return {
            emailTitle: "_A purchase requisition is waiting for your action",
            emailTemplate: "Purchasing_Email_NotifNextApprover.htm",
            pushNotifTemplate: "NotifNextApprover",
            shouldSendPushNotif: true
        };
    }
    function SendPushNotificationsToContributors(nextContributors, templateType, pushNotificationType) {
        var _a;
        for (const contributor of nextContributors) {
            if (!((_a = contributor.additionalProperties) === null || _a === void 0 ? void 0 : _a.pushNotifSent)) {
                Sys.PushNotification.SendNotifToUser({
                    user: Users.GetUser(contributor.login),
                    id: pushNotificationType === "short" ? Process.GetProcessID() : Data.GetValue("RuidEx"),
                    template: "Purchasing_PushNotif_" + templateType + "_" + pushNotificationType + ".txt",
                    customTags: {
                        GoodsSummary: Lib.Purchasing.GetGoodsSummary()
                    },
                    sendToBackupUser: true
                });
                workflow.UpdateAdditionalContributorData(contributor.contributorId, { pushNotifSent: true });
            }
        }
    }
    function SendNotificationsToNextContributor(nextContributor, nextContributors) {
        const { emailTitle, emailTemplate, pushNotifTemplate, shouldSendPushNotif } = DetermineEmailTemplateAndPushNotif(nextContributor.role);
        const customTags = GetCustomTagsByNextContributors(nextContributors);
        SendEmailNotifications(nextContributors, emailTitle, emailTemplate, true, customTags);
        if (Process.GetProcessDefinition().PushNotification === true && shouldSendPushNotif) {
            const pushNotificationType = (Sys.Parameters.GetInstance("PAC").GetParameter("PushNotificationType") || Sys.Parameters.GetInstance("P2P").GetParameter("PushNotificationType") || "").toLowerCase();
            Log.Info("Sending " + pushNotificationType + " push notification");
            if (pushNotificationType === "short" || pushNotificationType === "full") {
                SendPushNotificationsToContributors(nextContributors, pushNotifTemplate, pushNotificationType);
            }
        }
    }
    function NotifyEndOfContributionOnMobile(contributor) {
        // On mobile, only approvers can approve the purchase requisition
        if (contributor.role === Lib.Purchasing.roleApprover) {
            // Send push notifications if enabled
            if (Process.GetProcessDefinition().PushNotification === true) {
                const user = Users.GetUser(contributor.login);
                if (user) {
                    Log.Info(`Notifying the end of approval contribution step on mobile. A silent push notif will be sent to: ${contributor.login} (and backup user if needed)`);
                    Sys.PushNotification.SendNotifToUser({
                        user: user,
                        id: Data.GetValue("RuidEx"),
                        sendToBackupUser: true,
                        silent: true
                    });
                }
            }
        }
    }
    function AutoCreateOrderIfNeeded() {
        let bok = true;
        if (Lib.P2P.Inventory.HasItemsTakenFromStock(Data.GetTable("LineItems__")) || Lib.Purchasing.IsAutoCreateOrderEnabledFromCustomization() || Lib.Purchasing.IsAutoCreateOrderEnabledFromPopup()) {
            bok = Lib.Purchasing.PRValidation.AutoCreateOrder();
        }
        return bok;
    }
    function ImpactSpendingOnApproved(lastApprover) {
        let bok = true;
        if (lastApprover) {
            const errors = prSpendingDispatcher.AsToApprove();
            if (errors && Data.GetValue("ApprovedByAgent__")) {
                for (const error of errors) {
                    SendSpendingErrorNotification(error);
                }
            }
            bok = !errors.length;
        }
        bok = bok && !prSpendingDispatcher.AsCommitted().length;
        return bok;
    }
    function OnApproved() {
        GiveRightToEverybody();
        for (let i = workflow.GetContributorIndex(); i < workflow.GetNbContributors(); i++) {
            let step = workflow.GetContributorAt(i);
            Log.Info("Grant validate right to buyer: " + step.login);
            Process.AddRight(step.login, "validate");
        }
        Lib.Purchasing.SetRightForAPClerk();
        Lib.Purchasing.SetRightForTreasurer();
        Process.WaitForUpdate();
        Process.LeaveForm();
    }
    function GetCanceledItems(itemsNumbers) {
        const canceledItems = [];
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            if (itemsNumbers.includes(line.GetValue("LineItemNumber__"))) {
                const requestedQuantity = new Sys.Decimal(line.GetValue("ItemQuantity__"));
                const orderedQuantity = new Sys.Decimal(line.GetValue("ItemOrderedQuantity__") || 0);
                const alreadyCanceledQuantity = new Sys.Decimal(line.GetValue("CanceledQuantity__") || 0);
                const openQuantity = requestedQuantity.minus(alreadyCanceledQuantity).minus(orderedQuantity);
                // Still cancelable ? Not ordered at all...
                if (orderedQuantity.equals(0) || (Sys.Parameters.GetInstance("PAC").GetParameterBool("AllowSplitPRIntoMultiplePO", false) && openQuantity.greaterThan(0))) {
                    Log.Info("Canceling item [" + line.GetValue("LineItemNumber__") + " - " + line.GetValue("ItemDescription__") + "]");
                    canceledItems.push(line);
                }
                else {
                    Log.Warn("Can't cancel the already ordered item [" + line.GetValue("LineItemNumber__") + " - " + line.GetValue("ItemDescription__") + "]");
                }
            }
        });
        return canceledItems;
    }
    /**
     * Browse items, get global status for buyer items, and stash some for each buyer.
     *
     * @param itemsNumbersToStash optional list of item number to stash. When an item is stashed
     * the item is pushed to the stashedItems array and the status of the stashed items is not
     * merged with the global returned status.
     *
     * @param all optional true to take all items; not set or false to take only items specified in itemsNumbersToStash
     */
    function GetItemStatusByBuyer(itemsNumbersToStash = null, all = false) {
        const itemStatusByBuyer = {};
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            const itemBuyer = line.GetValue("BuyerLogin__");
            let itemStatus = itemStatusByBuyer[itemBuyer];
            if (!itemStatus) {
                itemStatusByBuyer[itemBuyer] = itemStatus = {
                    hasToOrderItems: false,
                    hasOrderedItems: false,
                    stashedItems: []
                };
            }
            if (all || (itemsNumbersToStash === null || itemsNumbersToStash === void 0 ? void 0 : itemsNumbersToStash.includes(line.GetValue("LineItemNumber__") + ""))) {
                itemStatus.stashedItems.push(line);
            }
            if (line.GetValue("ItemStatus__") !== Lib.Purchasing.PRStatus.canceled) {
                const orderedQuantity = line.GetValue("ItemOrderedQuantity__");
                const requestedQuantity = line.GetValue("ItemQuantity__");
                const canceledQuantity = line.GetValue("CanceledQuantity__");
                if (line.GetValue("ItemOrderedQuantity__") !== 0) {
                    itemStatus.hasOrderedItems = true;
                }
                if (new Sys.Decimal(requestedQuantity || 0).minus(orderedQuantity || 0).minus(canceledQuantity || 0).greaterThan(0)) {
                    itemStatus.hasToOrderItems = true;
                }
            }
        });
        return itemStatusByBuyer;
    }
    function GetItemByBuyer() {
        const itemsByBuyer = {};
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
            const itemBuyer = item.GetValue("BuyerLogin__");
            if (!itemsByBuyer[itemBuyer]) {
                itemsByBuyer[itemBuyer] = [];
            }
            itemsByBuyer[itemBuyer].push(item);
        });
        return itemsByBuyer;
    }
    function BuildCancellationDescription(canceledItems, fullDesc = false, firstItemsCount = 1) {
        let items = [];
        for (let i = 0; i < canceledItems.length && (fullDesc || i < firstItemsCount); i++) {
            const item = canceledItems[i];
            let ItemCanceledDescription;
            if (Sys.Parameters.GetInstance("PAC").GetParameterBool("AllowSplitPRIntoMultiplePO", false)) {
                const culture = Lib.P2P.GetValidatorOrOwner().GetValue("CULTURE");
                const itemCurrency = item.GetValue("ItemCurrency__");
                let canceledQuantity = item.GetValue("CanceledQuantity__");
                let itemQuantity = item.GetValue("ItemQuantity__");
                if (Lib.Purchasing.Items.IsAmountBasedItem(item)) {
                    canceledQuantity = canceledQuantity.toLocaleString(culture, {
                        currency: itemCurrency,
                        style: "currency"
                    });
                    itemQuantity = itemQuantity.toLocaleString(culture, { currency: itemCurrency, style: "currency" });
                }
                const itemDescription = item.GetValue("ItemDescription__").replace(/,/g, " ");
                ItemCanceledDescription = "- " + Language.Translate("_{0} out of {1} requested ({2})", false, canceledQuantity, itemQuantity, itemDescription);
            }
            else {
                ItemCanceledDescription = item.GetValue("ItemDescription__").replace(/,/g, " ");
            }
            items.push(ItemCanceledDescription);
        }
        let itemsDesc = items.join("\n");
        if (!fullDesc && firstItemsCount < canceledItems.length) {
            itemsDesc += "...";
        }
        return "\n" + itemsDesc;
    }
    function SendCancelationNotifications(cancelerUser, actionName, canceledItems) {
        const requester = workflow.GetContributorAt(0);
        const cancelerUserIsRequester = requester.login === cancelerUser.GetValue("Login");
        if (!cancelerUserIsRequester) {
            SendEmailNotification(requester, actionName === "remainingItemsCanceled" ? "_The remaining items have been canceled" : "_Items canceled", "Purchasing_Email_NotifPRItemCanceled.htm", false, {
                RequesterName__: Data.GetValue("RequesterName__"),
                RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                Last_Comments__: Variable.GetValueAsString("Last_Comments__"),
                CanceledItems: BuildCancellationDescription(canceledItems)
            });
        }
    }
    function PrepareCanceledItems(canceledItems) {
        const canceledItemsNumbers = [];
        for (const item of canceledItems) {
            canceledItemsNumbers.push(item.GetValue("LineItemNumber__") + "");
            item.SetValue("CanceledQuantity__", new Sys.Decimal(item.GetValue("ItemQuantity__") || 0).minus(item.GetValue("ItemOrderedQuantity__") || 0).toNumber());
            item.SetValue("CanceledAmount__", new Sys.Decimal(item.GetValue("ItemNetAmount__") || 0).minus(item.GetValue("ItemOrderedAmount__") || 0).toNumber());
        }
        return canceledItemsNumbers;
    }
    function ProcessBuyerCancellation(buyerLogin, itemStatus, actionName, newComment, contributionDate) {
        const buyerUser = Users.GetUser(buyerLogin);
        if (!buyerUser) {
            Log.Error(`Unable to finalize the cancellation by buyer ${buyerLogin}' because this user does not exist`);
            return false;
        }
        Log.Info("Cancelling items for buyer [" + buyerLogin + "]");
        workflow.UpdateParallelWorkflowCurrentUser(buyerUser);
        ChangeOwner();
        const sequenceStep = workflow.GetContributorIndex();
        const currentContributor = workflow.GetContributorAt(sequenceStep);
        if (currentContributor.login !== buyerLogin) {
            Log.Warn(`Buyer '${buyerLogin}' still in workflow but not current contributor. Can't performe action.`);
            return true;
        }
        const isLastStep = sequenceStep + 1 >= workflow.GetNbContributors();
        const cancelerContributor = Sys.Helpers.Extend({}, currentContributor);
        cancelerContributor.action = actionName;
        const canceledItemsFullDesc = BuildCancellationDescription(itemStatus.stashedItems, true);
        const cancellationComment = Language.Translate("_The following items have been canceled {0}", false, canceledItemsFullDesc) + "\n" + newComment;
        const contributionData = CreateCancellationContribution(sequenceStep, itemStatus, actionName, cancelerContributor, cancellationComment, contributionDate, buyerLogin);
        if (!isLastStep || itemStatus.hasToOrderItems) {
            workflow.NextContributor(contributionData);
            ChangeOwner();
        }
        else {
            workflow.EndWorkflow(contributionData);
        }
        return true;
    }
    function CreateCancellationContribution(sequenceStep, itemStatus, actionName, cancelerContributor, cancellationComment, contributionDate, buyer) {
        let contributionData;
        if (itemStatus.hasOrderedItems || itemStatus.hasToOrderItems) {
            Log.Info("Adding a new step for the cancellation");
            workflow.AddContributorAt(sequenceStep, cancelerContributor);
            if (!itemStatus.hasToOrderItems) {
                Log.Info("All items of this buyer have either been ordered or cancelled, marking buyer step as done");
                contributionData = GetContributionData(sequenceStep, parameters.actions.orderCreated.GetName(), "", { onBehalfOf: true });
                contributionData.date = contributionDate;
                workflow.NextContributor(contributionData);
                ChangeOwner();
                Process.SetRight(buyer, "read");
            }
            contributionData = GetContributionData(sequenceStep, actionName, cancellationComment, { onBehalfOf: true }, true);
            contributionData.date = contributionDate;
        }
        else {
            Log.Info("All items of this buyer have been cancelled, marking buyer step as done");
            contributionData = GetContributionData(sequenceStep, actionName, cancellationComment, { onBehalfOf: true });
            contributionData.date = contributionDate;
        }
        return contributionData;
    }
    async function CancelItems(itemsNumbers, actionName, cancelerUser, contributionDate, newComment) {
        if (!Sys.Helpers.IsArray(itemsNumbers)) {
            Log.Warn("Invalid items numbers parameter: an array is expected (" + itemsNumbers + ")");
            return false;
        }
        const canceledItems = GetCanceledItems(itemsNumbers);
        if (canceledItems.length === 0) {
            Process.WaitForUpdate();
            return true;
        }
        const canceledItemsNumbers = PrepareCanceledItems(canceledItems);
        const itemStatusByBuyer = GetItemStatusByBuyer(canceledItemsNumbers);
        let bok = !prSpendingDispatcher.AsCanceledItemFromCommitted().length;
        bok = bok && await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
            return await Lib.Purchasing.PRValidation.SynchronizeItems() || rollbackFn();
        });
        if (!bok) {
            return false;
        }
        SendCancelationNotifications(cancelerUser, actionName, canceledItems);
        Sys.Helpers.Object.ForEach(itemStatusByBuyer, (itemStatus, buyer) => {
            if (itemStatus.stashedItems.length > 0) {
                bok = ProcessBuyerCancellation(buyer, itemStatus, actionName, newComment, contributionDate) && bok;
            }
        });
        if (bok) {
            const status = Data.GetValue("RequisitionStatus__");
            if (status === Lib.Purchasing.PRStatus.canceled) {
                Process.Cancel();
            }
            else if (status !== Lib.Purchasing.PRStatus.received) {
                Process.WaitForUpdate();
            }
        }
        return bok;
    }
    async function OnCancelPO() {
        const itemBeforeSynch = GetItemStatusByBuyer();
        let bok = await Lib.Purchasing.PRValidation.SynchronizeItems({ fromAction: true });
        if (bok) {
            //When the PO canceled was autocreated, we need to autorize the buyer to create a new the Purchase Order
            Variable.SetValueAsString("FullyAutoOrdered", "");
            const itemsAfterSynch = GetItemStatusByBuyer();
            const date = new Date();
            Sys.Helpers.Object.ForEach(itemsAfterSynch, (itemStatus, buyerLogin) => {
                const isWorkflowEnded = workflow.IsEnded();
                if (isWorkflowEnded && !itemBeforeSynch[buyerLogin].hasToOrderItems && itemBeforeSynch[buyerLogin].hasOrderedItems && itemStatus.hasToOrderItems) {
                    let currentSequenceStep = workflow.GetContributorIndex();
                    let contributionData = workflow.GetContributorAt(currentSequenceStep);
                    Log.Info("Restarting the workflow following cancel order");
                    workflow.Reopen();
                    currentSequenceStep = workflow.GetContributorIndex();
                    const buyerUser = Users.GetUser(buyerLogin);
                    workflow.UpdateParallelWorkflowCurrentUser(buyerUser);
                    const buyerContributor = {
                        contributorId: buyerLogin + Lib.Purchasing.roleBuyer,
                        role: Lib.Purchasing.roleBuyer,
                        login: buyerLogin,
                        name: buyerUser.GetValue("displayName"),
                        email: buyerUser.GetValue("emailAddress"),
                        isGroup: Sys.Helpers.String.ToBoolean(buyerUser.GetValue("isGroup")),
                        action: parameters.actions.purchase.GetName(),
                        parallel: contributionData ? contributionData.parallel : undefined
                    };
                    Log.Info(`Add action made by buyer '${buyerLogin}' to the workflow, as they have cancel an Order`);
                    workflow.AddContributorAt(currentSequenceStep, buyerContributor);
                    Log.Info(`Add buyer '${buyerLogin}' as contributor to the workflow, as they have items to order following order cancelation`);
                    workflow.AddContributorAt(currentSequenceStep, buyerContributor);
                    contributionData = GetContributionData(currentSequenceStep, parameters.actions.orderCanceled.GetName(), Language.Translate("_PO canceled, items back to 'To order' status"));
                    contributionData.date = date;
                    workflow.NextContributor(contributionData);
                }
            });
            if (Data.GetValue("RequisitionStatus__") !== Lib.Purchasing.PRStatus.received) {
                Process.WaitForUpdate();
            }
            Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
            Process.LeaveForm();
        }
        else {
            Process.PreventApproval();
        }
    }
    function AddBuyerToWorkflow(buyerLogin, currentSequenceStep, nextContributor) {
        if (workflow.IsEnded()) {
            Log.Info("Restarting the workflow following EditOrder.");
            workflow.Reopen();
            currentSequenceStep = workflow.GetContributorIndex();
        }
        Log.Info(`Add buyer '${buyerLogin}' as contributor to the workflow, as they have items to order following order edition`);
        const buyerUser = Users.GetUser(buyerLogin);
        const buyerContributor = {
            contributorId: buyerLogin + Lib.Purchasing.roleBuyer,
            role: Lib.Purchasing.roleBuyer,
            login: buyerLogin,
            name: buyerUser.GetValue("displayName"),
            email: buyerUser.GetValue("emailAddress"),
            isGroup: buyerUser.GetValue("isGroup") == "1",
            action: parameters.actions.purchase.GetName(),
            parallel: nextContributor ? nextContributor.parallel : undefined
        };
        workflow.AddContributorAt(currentSequenceStep, buyerContributor);
    }
    function IsAutoSendOrderRequested() {
        const autoSendOrderParamString = Variable.GetValueAsString("AutoSendOrderParam");
        if (autoSendOrderParamString && autoSendOrderParamString !== "{}") {
            try {
                const autoSendOrderParam = JSON.parse(autoSendOrderParamString);
                return Lib.Purchasing.IsAutoOrderRequested(autoSendOrderParam === null || autoSendOrderParam === void 0 ? void 0 : autoSendOrderParam.autoOrder);
            }
            catch (error) {
                Log.Warn(`Invalid AutoSendOrderParam JSON. Auto-send order will be treated as disabled. Value: ${autoSendOrderParamString}`);
                return false;
            }
        }
        return false;
    }
    async function IsReallyFullyAutoOrdered() {
        if (IsAutoSendOrderRequested()) {
            const poIdentifiers = [];
            Sys.Helpers.Data.ForEachTableItem("LineItems__", (line) => {
                const poNumber = line.GetValue("PONumber__");
                if (poNumber) {
                    for (const identifier of poNumber.split("\n")) {
                        const trimmedIdentifier = identifier.trim();
                        if (trimmedIdentifier && !poIdentifiers.includes(trimmedIdentifier)) {
                            poIdentifiers.push(trimmedIdentifier);
                        }
                    }
                }
            });
            if (poIdentifiers.length > 0) {
                try {
                    const poFilters = [];
                    for (const identifier of poIdentifiers) {
                        if (identifier.startsWith("CD#")) {
                            poFilters.push(ldaputil.FilterEqual("RUIDEX__", identifier));
                        }
                        else {
                            poFilters.push(ldaputil.FilterEqual("OrderNumber__", identifier));
                        }
                    }
                    const filter = poFilters.length === 1 ? poFilters[0] : ldaputil.FilterOr.apply(null, poFilters);
                    const autoOrderedFilter = ldaputil.FilterAnd(filter, ldaputil.FilterEqual("AutomaticOrder__", "1"));
                    const [countResult] = await Sys.GenericAPI.PromisedQuery({
                        table: "CDNAME#Purchase order V2",
                        filter: autoOrderedFilter.toString(),
                        attributes: ["__Count__"],
                        maxRecords: 1
                    });
                    return (Number(countResult === null || countResult === void 0 ? void 0 : countResult.__Count__) || 0) === poIdentifiers.length;
                }
                catch (error) {
                    Log.Warn(`Unable to compute linked PO auto-order status: ${error}`);
                }
            }
        }
        return false;
    }
    async function CompleteBuyerStepWithNoItemsLeft(buyerLogin, currentSequenceStep, includeAutoSend) {
        Log.Info(`Buyer '${buyerLogin}' still in the workflow but has nothing left to order.`);
        const buyerUser = Users.GetUser(buyerLogin);
        if (!buyerUser) {
            Log.Warn(`Unable to finalize purchase by buyer ${buyerLogin}' because this user does not exist`);
            return false;
        }
        workflow.UpdateParallelWorkflowCurrentUser(buyerUser);
        ChangeOwner();
        const currentContributor = workflow.GetContributorAt(currentSequenceStep);
        if (currentContributor.login !== buyerLogin) {
            Log.Warn(`Buyer '${buyerLogin}' still in workflow but not current contributor. Can't performe action.`);
            return false;
        }
        const isAutoSendOrder = await IsReallyFullyAutoOrdered();
        let contributionData;
        if (includeAutoSend && isAutoSendOrder) {
            const autoComment = Language.Translate("_AutoOrderSendOnBehalfOf", false, currentContributor.name);
            contributionData = GetContributionData(currentSequenceStep, parameters.actions.orderCreated.GetName(), autoComment);
        }
        else {
            contributionData = GetContributionData(currentSequenceStep, parameters.actions.orderCreated.GetName(), includeAutoSend ? g_newComment : null, { onBehalfOf: true });
        }
        if (currentSequenceStep + 1 < workflow.GetNbContributors()) {
            Log.Info("Other buyers in the workflow, go to next step.");
            workflow.NextContributor(contributionData);
            ChangeOwner();
        }
        else {
            Log.Info("No other buyers in the worfklow, end the workflow.");
            workflow.EndWorkflow(contributionData);
        }
        Process.SetRight(buyerLogin, "read");
        return true;
    }
    async function OnEditOrder() {
        let bok = await Lib.Purchasing.PRValidation.SynchronizeItems({ fromAction: true });
        if (bok) {
            Variable.SetValueAsString("FullyAutoOrdered", "");
            const itemStatusByBuyer = GetItemStatusByBuyer();
            for (const [buyerLogin, itemStatus] of Object.entries(itemStatusByBuyer)) {
                let currentSequenceStep = workflow.GetContributorIndex();
                const nextContributor = workflow.GetContributorAt(workflow.GetContributorIndex());
                const nextContributors = workflow.GetParallelContributorsOf(nextContributor, true);
                const buyerStillInWorkflow = !workflow.IsEnded() && nextContributors.some(contributor => contributor.login === buyerLogin);
                if (itemStatus.hasToOrderItems) {
                    if (buyerStillInWorkflow) {
                        Log.Info(`Buyer '${buyerLogin}' still in the workflow and has items to order, nothing to do.`);
                    }
                    else {
                        AddBuyerToWorkflow(buyerLogin, currentSequenceStep, nextContributor);
                    }
                }
                else if (buyerStillInWorkflow) {
                    await CompleteBuyerStepWithNoItemsLeft(buyerLogin, currentSequenceStep, false);
                }
                else {
                    Log.Info(`Buyer '${buyerLogin}' not in the workflow and has no item left to order, nothing to do.`);
                }
            }
            if (Data.GetValue("RequisitionStatus__") !== Lib.Purchasing.PRStatus.received) {
                Process.WaitForUpdate();
            }
            Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
            Process.LeaveForm();
        }
        else {
            Process.PreventApproval();
        }
    }
    function GetWorkflow() {
        return workflow;
    }
    ValidationScript.GetWorkflow = GetWorkflow;
    function UpdateForcastedStockMovements(UpdateOnError = false) {
        let bok = true;
        let inventoryFilter = [];
        const companyCode = Data.GetValue("CompanyCode__");
        Sys.Helpers.Data.ForEachTableItem("LineItems__", (item) => {
            if (Lib.P2P.Inventory.IsItemTakenFromStock(item) || Lib.P2P.Inventory.IsReplenishmentItem(item)) {
                const warehouseID = item.GetValue("WarehouseID__");
                const itemNumber = item.GetValue("ItemNumber__");
                inventoryFilter.push({
                    companyCode: companyCode,
                    itemNumber: itemNumber,
                    warehouseNumber: warehouseID
                });
                let forecastInventoryMovement = new Lib.P2P.Inventory.ForecastInventoryMovement();
                forecastInventoryMovement.companyCode = Data.GetValue("CompanyCode__");
                forecastInventoryMovement.itemNumber = itemNumber;
                forecastInventoryMovement.lineNumber = "" + item.GetValue("LineItemNumber__");
                forecastInventoryMovement.warehouseID = warehouseID;
                forecastInventoryMovement.movementOrigin = Data.GetValue("RuidEx");
                forecastInventoryMovement.unitOfMeasure = item.GetValue("ItemUnit__");
                let movementValueDecimal = new Sys.Decimal(0);
                if (item.GetValue("ItemStatus__") !== Lib.Purchasing.PRStatus.received) {
                    movementValueDecimal = new Sys.Decimal(item.GetValue("ItemQuantity__"))
                        .minus(item.GetValue("CanceledQuantity__"))
                        .minus(item.GetValue("ItemDeliveredQuantity__"));
                    if (Lib.P2P.Inventory.IsReplenishmentItem(item)) {
                        movementValueDecimal = movementValueDecimal.add(item.GetValue("ItemReturnedQuantity__"));
                    }
                }
                const movementValue = movementValueDecimal.toNumber();
                if (Lib.P2P.Inventory.IsItemTakenFromStock(item)) {
                    forecastInventoryMovement.reservedValue = movementValue;
                }
                else if (Lib.P2P.Inventory.IsReplenishmentItem(item)) {
                    forecastInventoryMovement.replenishValue = movementValue;
                }
                bok = Lib.P2P.Inventory.CreateOrUpdateForecastInventoryMovement(forecastInventoryMovement) && bok;
            }
        });
        if (bok && inventoryFilter.length > 0) {
            bok = Lib.P2P.Inventory.UpdateInventoryStock(inventoryFilter, UpdateOnError);
        }
        return bok;
    }
    ValidationScript.UpdateForcastedStockMovements = UpdateForcastedStockMovements;
    async function RevertForecastedStockMovements() {
        const deletedForecastInventoryMovement = await Lib.P2P.Inventory.DeleteForecastInventoryMovements(Data.GetValue("RuidEx"));
        return Lib.P2P.Inventory.UpdateInventoryStock(deletedForecastInventoryMovement.map((forecastInventoryMovement) => ({
            companyCode: forecastInventoryMovement.companyCode,
            itemNumber: forecastInventoryMovement.itemNumber,
            warehouseNumber: forecastInventoryMovement.warehouseID
        })), true);
    }
    function ReOpenWorkflowIfNeeded() {
        if (workflow.IsEnded()) {
            Log.Info("Need to reopen Workflow");
            workflow.Reopen();
            const currentSequenceStep = workflow.GetContributorIndex();
            let contributionData = workflow.GetContributorAt(currentSequenceStep);
            // Get Buyer
            const ownerLogin = Lib.P2P.GetValidatorOrOwnerLogin();
            const ownerUser = Lib.P2P.GetValidatorOrOwner();
            let buyerContributor = {
                //mandatory fields
                contributorId: ownerLogin + Lib.Purchasing.roleBuyer,
                role: Lib.Purchasing.roleBuyer,
                //not mandatory fields
                login: ownerLogin,
                name: ownerUser.GetValue("displayName"),
                email: ownerUser.GetValue("emailAddress"),
                isGroup: Sys.Helpers.String.ToBoolean(ownerUser.GetValue("isGroup")),
                action: parameters.actions.purchase.GetName(),
                parallel: contributionData ? contributionData.parallel : undefined
            };
            workflow.AddContributorAt(currentSequenceStep, buyerContributor);
        }
    }
    function GetCustomTagsByBuyer() {
        let customTagsByBuyer = {};
        let itemsByBuyer = GetItemStatusByBuyer(null, true);
        for (let buyer in itemsByBuyer) {
            if (Sys.Helpers.IsPlainObject(itemsByBuyer[buyer])) {
                const totalAmountByBuyer = Lib.Purchasing.Items.ComputePRAmounts(itemsByBuyer[buyer].stashedItems);
                customTagsByBuyer[buyer] = {
                    RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                    RequesterName__: Data.GetValue("RequesterName__"),
                    GoodsSummary: Lib.Purchasing.GetGoodsSummary(itemsByBuyer[buyer].stashedItems),
                    TotalNetAmount: totalAmountByBuyer.TotalNetAmount,
                    Currency: totalAmountByBuyer.Currency
                };
            }
        }
        return customTagsByBuyer;
    }
    ValidationScript.GetCustomTagsByBuyer = GetCustomTagsByBuyer;
    function GetCustomTagsByNextContributors(nextContributors) {
        let customTagsByContributors = {};
        const goodsSummary = Lib.Purchasing.GetGoodsSummary();
        for (const contributor of nextContributors) {
            customTagsByContributors[contributor.login] = {
                DestinationFullName: contributor.name,
                RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                RequesterName__: Data.GetValue("RequesterName__"),
                TotalNetAmount__: Data.GetValue("TotalNetAmount__") + "",
                Currency__: Data.GetValue("Currency__"),
                GoodsSummary: goodsSummary,
            };
        }
        return customTagsByContributors;
    }
    ValidationScript.GetCustomTagsByNextContributors = GetCustomTagsByNextContributors;
    function NextContributorExist() {
        let nextContributor = workflow.GetContributorAt(workflow.GetContributorIndex() + 1);
        if (nextContributor && Users.GetUser(nextContributor.login) == null) {
            Lib.CommonDialog.NextAlert.Define("_Workflow error", "_Invalid user '{0}' in worflow, please contact your administrator", null, nextContributor.login);
            SendEmailNotification(g_currentContributor, "_A purchase requisition is in error", "Purchasing_Email_NotifPRError.htm", false, {
                RequisitionNumber__: Data.GetValue("RequisitionNumber__")
            });
            return false;
        }
        return true;
    }
    async function UpdateExchangeRate() {
        Log.Info("Update exchange rate");
        let currencies = [];
        let rates = {};
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            currencies.push(line.GetValue("ItemCurrency__"));
        });
        if (currencies.length > 0) {
            const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(Data.GetValue("CompanyCode__"));
            if (Object.keys(CCValues).length <= 0) {
                Data.SetError("CompanyCode__", "_This CompanyCode does not exist in the table.");
            }
            else {
                for (const currency of currencies) {
                    rates[currency] = await CCValues.currencies.QueryRate(currency);
                }
            }
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                line.SetValue("ItemExchangeRate__", rates[line.GetValue("ItemCurrency__")]);
            });
        }
    }
    function ComputeAmounts() {
        Log.Info("Compute amounts");
        let items = [];
        Sys.Helpers.Data.ForEachTableItem("LineItems__", (item) => {
            items.push(item);
        });
        let res = Lib.Purchasing.Items.ComputePRAmounts(items);
        Data.SetValue("TotalNetLocalCurrency__", res.netAmountLocal);
        Data.SetValue("TotalNetAmount__", res.TotalNetAmount);
    }
    async function UpdatePOs(action) {
        Log.Info("Resume POs with action: " + action);
        let PONumbers = {};
        let PORUIDEX = [];
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            const poNumber = line.GetValue("PONumber__");
            if (poNumber) {
                for (const number of poNumber.split("\n")) {
                    if (number) {
                        PONumbers[number] = true;
                    }
                }
            }
        });
        if (!Sys.Helpers.Object.IsEmptyPlainObject(PONumbers)) {
            const dbItems = await Lib.Purchasing.POItems.QueryPOItems({
                additionnalFilters: [
                    ldaputil.FilterIn("PONumber__", Object.keys(PONumbers))
                ]
            });
            for (const item of dbItems) {
                const ruidex = item.GetValue("PORUIDEX__");
                if (!PORUIDEX.includes(ruidex)) {
                    PORUIDEX.push(ruidex);
                    Lib.Purchasing.Items.ResumeDocumentToSynchronizeItems("Purchase order", ruidex, action);
                }
            }
        }
    }
    async function CheckOutlierQuantities() {
        if (OutlierQuantitiesDetected.value != null) {
            return OutlierQuantitiesDetected.value;
        }
        return Lib.Purchasing.Items.PR.CheckOutlierQuantities();
    }
    function ProcessAutoApproval(params, nextContributor, contributionData) {
        const autoApproveReturn = workflow.AutoApproveIfNextIsSameUser(Lib.P2P.GetValidatorOrOwner(), params.sequenceStep, nextContributor, contributionData, (currentUser, aNextContributor) => {
            const notMergeableRoles = [Lib.Purchasing.roleBuyer];
            let currentUserLogin = currentUser.GetValue("Login");
            const defaultAutoApprove = currentUserLogin === aNextContributor.login && !notMergeableRoles.includes(aNextContributor.role);
            const customAutoApprove = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Common.ShouldAutoApproveNextWorkflowStep", currentUser, aNextContributor);
            if (Sys.Helpers.IsPlainObject(customAutoApprove)) {
                if (customAutoApprove.override) {
                    return customAutoApprove.shouldAutoApproveNextWorkflowStep && !notMergeableRoles.includes(aNextContributor.role);
                }
                return defaultAutoApprove || (customAutoApprove.shouldAutoApproveNextWorkflowStep && !notMergeableRoles.includes(aNextContributor.role));
            }
            return defaultAutoApprove || (customAutoApprove && !notMergeableRoles.includes(aNextContributor.role));
        }, ChangeOwner, (action) => {
            switch (action) {
                case parameters.actions.reviewal.GetName():
                    return {
                        actionName: parameters.actions.reviewed.GetName(),
                        autoComment: Language.Translate("_Requisition auto reviewed")
                    };
                case parameters.actions.approval.GetName():
                default:
                    return {
                        actionName: parameters.actions.approved.GetName(),
                        autoComment: Language.Translate("_Requisition auto approved")
                    };
            }
        }, GetContributionData);
        return {
            sequenceStep: autoApproveReturn.sequenceStep,
            nextContributor: autoApproveReturn.nextContributor,
            contributionData: autoApproveReturn.contributionData
        };
    }
    ValidationScript.ProcessAutoApproval = ProcessAutoApproval;
    function ApplyAgentBudgetViewHistory() {
        if (!Data.GetValue("ApprovedByAgent__")) {
            return;
        }
        const agentBudgetViewHistoryByApproverStr = Data.GetValue("AgentBudgetViewHistoryByApprover__");
        let AgentBudgetViewHistoryByApprover = null;
        if (!Sys.Helpers.IsEmpty(agentBudgetViewHistoryByApproverStr)) {
            try {
                AgentBudgetViewHistoryByApprover = JSON.parse(agentBudgetViewHistoryByApproverStr);
            }
            catch (error) {
                Log.Error(`[ApplyAgentBudgetViewHistory]: Failed to parse JSON: ${error}`);
                AgentBudgetViewHistoryByApprover = null;
            }
        }
        if (AgentBudgetViewHistoryByApprover) {
            const currentOwnerIdDN = Lib.P2P.GetValidatorOrOwnerLogin();
            const currentOwnerId = currentOwnerIdDN.startsWith("cn=") ? currentOwnerIdDN.split(",")[0].substring(3) : currentOwnerIdDN;
            Log.Info(`[ApplyAgentBudgetViewHistory]: checking agent budget view history for current owner ${currentOwnerId}`);
            const currentOwnerBudgets = AgentBudgetViewHistoryByApprover[currentOwnerId];
            Log.Info(`[ApplyAgentBudgetViewHistory]: current owner ${currentOwnerId} has budgets viewed by approver via agent: ${currentOwnerBudgets ? currentOwnerBudgets.length : 0}`);
            if (currentOwnerBudgets) {
                const AgentBudgetViewHistoryByApproverObj = {};
                currentOwnerBudgets.forEach(budget => {
                    AgentBudgetViewHistoryByApproverObj[budget.BudgetID__] = budget;
                });
                Sys.Helpers.Data.ForEachTableItem("LineItems__", (item) => {
                    const itemBudgetID = item.GetValue("BudgetID__");
                    if (itemBudgetID && AgentBudgetViewHistoryByApproverObj[itemBudgetID]) {
                        item.SetValue("ItemBudgetInitial__", Number.parseFloat(AgentBudgetViewHistoryByApproverObj[itemBudgetID].Budget__));
                        item.SetValue("ItemBudgetRemaining__", Number.parseFloat(AgentBudgetViewHistoryByApproverObj[itemBudgetID].BudgetRemaining__));
                        item.SetValue("ItemBudgetViewed__", true);
                        Log.Info(`[ApplyAgentBudgetViewHistory]: budgetID ${itemBudgetID} viewed by approver via agent with values: initial ${item.GetValue("ItemBudgetInitial__")}, remaining ${item.GetValue("ItemBudgetRemaining__")}`);
                    }
                });
            }
            delete AgentBudgetViewHistoryByApprover[currentOwnerId];
            Data.SetValue("AgentBudgetViewHistoryByApprover__", JSON.stringify(AgentBudgetViewHistoryByApprover));
        }
    }
    function ImpactBudgetOnSubmit(currentContributor, nextContributor, updateBudgetFn) {
        if (nextContributor.role === Lib.Purchasing.roleBuyer) {
            if (prBudgetSpending.IsBudgetViewedByEveryApprover()) {
                const isLastApprover = currentContributor.role === Lib.Purchasing.roleApprover;
                return ImpactSpendingOnApproved(isLastApprover);
            }
            else {
                if (Data.GetValue("ApprovedByAgent__")) {
                    SendEmailNotification(Data.GetValue("LastValidatorUserID__"), "_Budget validation error", "Purchasing_Email_NotifBudgetNotApproved.htm", false, {
                        DestinationFullName: Data.GetValue("LastValidatorName__"),
                        RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                        RequesterName__: Data.GetValue("RequesterName__"),
                        ErrorMessage: Language.Translate("_NotAllItemsApproved"),
                        ValidationUrl: Data.GetValue("ValidationUrl")
                    });
                }
                Lib.CommonDialog.NextAlert.Define("_Spending update error", "_NotAllItemsApproved");
                return false;
            }
        }
        else {
            return updateBudgetFn();
        }
    }
    function ClearNeedValidationIfWorkflowSkipped(isNextContributorBuyer) {
        if (isNextContributorBuyer
            && Data.GetValue("Origin__") === Lib.P2P.PurchaseRequisitionOrigin.EXTERNAL_FILE
            && context.name === autoSubmitAction) {
            Log.Warn("PR from SFTP - Removing need for validation in case WF is skipped");
            Data.SetValue("NeedValidation", 0);
        }
    }
    ValidationScript.ClearNeedValidationIfWorkflowSkipped = ClearNeedValidationIfWorkflowSkipped;
    async function SubmitImpl(params) {
        const currentContributor = workflow.GetContributorAt(params.sequenceStep);
        // Reorder parallel workflow BEFORE any workflow processing when approval comes from agent
        const validatedByAgent = Data.GetValue("ApprovedByAgent__");
        if (validatedByAgent) {
            if (currentContributor.parallel) {
                Log.Info("Agent approval detected with parallel workflow - reordering contributors to put current user first BEFORE workflow processing");
                const currentUser = Lib.P2P.GetValidatorOrOwner();
                workflow.UpdateParallelWorkflowCurrentUser(currentUser);
            }
        }
        let bok = NextContributorExist();
        if (!bok) {
            return false;
        }
        let nextContributor = workflow.GetContributorAt(params.sequenceStep + 1);
        let contributionData = GetContributionData(params.sequenceStep, params.actionName, g_newComment, { onBehalfOf: true, outlierDetected: true, validatedByAgent: validatedByAgent });
        const autoApprovalResult = ProcessAutoApproval(params, nextContributor, contributionData);
        params.sequenceStep = autoApprovalResult.sequenceStep;
        nextContributor = autoApprovalResult.nextContributor;
        contributionData = autoApprovalResult.contributionData;
        const isNextContributorBuyer = nextContributor.role === Lib.Purchasing.roleBuyer;
        ApplyAgentBudgetViewHistory();
        bok = ImpactBudgetOnSubmit(currentContributor, nextContributor, params.updateBudgetFn);
        if (bok && params.beforeSynchronizeItems) {
            params.beforeSynchronizeItems();
        }
        bok = bok && await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
            SetStatusAccordingToRole(nextContributor.role);
            return await Lib.Purchasing.PRValidation.SynchronizeItems() || rollbackFn();
        });
        if (bok && isNextContributorBuyer) {
            bok = AutoCreateOrderIfNeeded();
        }
        if (bok && currentContributor.role !== nextContributor.role) {
            ResetAdvisorList();
        }
        Variable.SetValueAsString("AdditionalContributors", "");
        if (bok && params.beforeChangingContributorFn) {
            bok = params.beforeChangingContributorFn();
        }
        if (bok) {
            GoToNextStep(contributionData);
            ClearNeedValidationIfWorkflowSkipped(isNextContributorBuyer);
            if (isNextContributorBuyer) {
                OnApproved();
            }
            NotifyEndOfContributionOnMobile(currentContributor);
            Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
        }
        return bok;
    }
    async function SentBack(sequenceStep, actionName) {
        let bok = true;
        let currentContributor = workflow.GetContributorAt(sequenceStep);
        // update budget according to the role
        if (currentContributor.role === Lib.Purchasing.roleBuyer) {
            bok = !prSpendingDispatcher.AsBackToSpendingFromCommitted().length;
        }
        else {
            bok = !prSpendingDispatcher.AsBackToSpendingFromToApprove().length;
        }
        bok = bok && await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
            Data.SetValue("ApprovedDate__", null);
            Data.SetValue("RequisitionStatus__", Lib.Purchasing.PRStatus.draft);
            return await Lib.Purchasing.PRValidation.SynchronizeItems() || rollbackFn();
        });
        if (bok) {
            if (Lib.P2P.Inventory.IsEnabled()) {
                await RevertForecastedStockMovements();
            }
            let contributionData = GetContributionData(sequenceStep, actionName, g_newComment, { onBehalfOf: true });
            ResetAdvisorList();
            workflow.Restart(contributionData);
            let nextContributor = workflow.GetContributorAt(0);
            SendEmailNotification(nextContributor, "_A Purchase requisition must be verified", "Purchasing_Email_NotifBack.htm", false, {
                DestinationFullName: nextContributor.name,
                RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                RequesterName__: Data.GetValue("RequesterName__"),
                LastValidatorName__: Data.GetValue("LastValidatorName__"),
                TotalNetAmount__: Data.GetValue("TotalNetAmount__") + "",
                Last_Comments__: Variable.GetValueAsString("Last_Comments__"),
                Currency__: Data.GetValue("Currency__"),
                GoodsSummary: Lib.Purchasing.GetGoodsSummary()
            });
            NotifyEndOfContributionOnMobile(currentContributor);
            Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
            Process.Forward(nextContributor.login);
            Process.LeaveForm();
        }
        else {
            Process.PreventApproval();
        }
        return bok;
    }
    function DefineOutlierQuantityNextAlert() {
        if (OutlierQuantitiesDetected.value) {
            Lib.CommonDialog.NextAlert.Define("_Unusual item detected title", "_Unusual item detected", {
                isError: false,
                behaviorName: "OutlierQuantitiesConfirmation"
            });
        }
    }
    const parameters = {
        actions: {
            submission: {
                OnDone: async function (sequenceStep) {
                    OutlierQuantitiesDetected.value = hasOutlierValues;
                    if (OutlierQuantitiesDetected.value) {
                        Log.Info("Outlier quantity detected");
                        DefineOutlierQuantityNextAlert();
                    }
                    // PRSubmissionDatetime stores the submission datetime. When it's empty, we consider the requisition hasn't yet been submitted.
                    const isNewRequest = !Variable.GetValueAsString("PRSubmissionDatetime");
                    Lib.P2P.SetBillingInfo("PR002");
                    let bok = Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnBilling");
                    bok = bok || bok === null;
                    if (!bok) {
                        // !!! OnBilling is responsible to manage error, include eventual calling to Process.PreventApproval()
                        Log.Info("Prevent approval due to : Lib.PR.Customization.Server.OnBilling");
                        return true;
                    }
                    if (Lib.P2P.Inventory.IsEnabled()) {
                        bok = UpdateForcastedStockMovements();
                        if (!bok) {
                            await RevertForecastedStockMovements();
                            Lib.Purchasing.CheckPR.CheckOverorderedItem();
                            Process.PreventApproval();
                            return false;
                        }
                    }
                    bok = await SubmitImpl({
                        sequenceStep: sequenceStep,
                        actionName: this.actions.submitted.GetName(),
                        updateBudgetFn: () => {
                            return !prSpendingDispatcher.AsSubmitted().length;
                        },
                        beforeSynchronizeItems: () => {
                            Data.SetValue("PRSubmissionDateTime__", new Date());
                        },
                        beforeChangingContributorFn: () => {
                            Data.SetValue("PRSubmissionDateTime__", new Date());
                            if (isNewRequest) {
                                let currentContributor = workflow.GetContributorAt(sequenceStep);
                                SendEmailNotification(currentContributor, "_A purchase requisition has been created", "Purchasing_Email_FirstNotifRequester.htm", false, {
                                    RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                                    RequesterName__: Data.GetValue("RequesterName__"),
                                    TotalNetAmount__: Data.GetValue("TotalNetAmount__") + "",
                                    Currency__: Data.GetValue("Currency__"),
                                    GoodsSummary: Lib.Purchasing.GetGoodsSummary()
                                });
                                let strNow = Sys.Helpers.Date.Date2DBDateTime(new Date());
                                Variable.SetValueAsString("PRSubmissionDatetime", strNow);
                            }
                            return true;
                        }
                    });
                    if (!bok) {
                        Log.Error("Prevent approval due to error in SubmitImpl");
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            submitted: {},
            reviewal: {
                OnDone: async function (sequenceStep) {
                    DefineOutlierQuantityNextAlert();
                    let bok = await SubmitImpl({
                        sequenceStep: sequenceStep,
                        actionName: this.actions.reviewed.GetName(),
                        updateBudgetFn: () => {
                            return !prSpendingDispatcher.AsReviewed().length;
                        }
                    });
                    if (!bok) {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            reviewed: {},
            approval: {
                OnDone: async function (sequenceStep) {
                    DefineOutlierQuantityNextAlert();
                    let bok = Sys.Helpers.String.ToBoolean(Variable.GetValueAsString("WorkflowImpacted")) ?
                        Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.OnWorkflowImpacted") : true;
                    bok = bok || bok === null;
                    bok = bok && await SubmitImpl({
                        sequenceStep: sequenceStep,
                        actionName: this.actions.approved.GetName(),
                        updateBudgetFn: () => {
                            return !prSpendingDispatcher.AsToApprove().length;
                        }
                    });
                    Data.SetValue("ApprovedByAgent__", false);
                    if (!bok) {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            approved: {},
            forward: {
                OnDone: async function (sequenceStep) {
                    const bok = await SubmitImpl({
                        sequenceStep: sequenceStep,
                        actionName: this.actions.forward.GetName(),
                        updateBudgetFn: () => {
                            return !prSpendingDispatcher.AsToApprove().length;
                        }
                    });
                    if (!bok) {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            reviewAndForward: {
                OnDone: async function (sequenceStep) {
                    const bok = await SubmitImpl({
                        sequenceStep: sequenceStep,
                        actionName: this.actions.reviewAndForward.GetName(),
                        updateBudgetFn: () => {
                            return !prSpendingDispatcher.AsReviewed().length;
                        }
                    });
                    if (!bok) {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            rejected: {
                OnDone: async function (sequenceStep) {
                    let currentContributor = workflow.GetContributorAt(sequenceStep);
                    let bok = true;
                    // update budget according to the role
                    if (currentContributor.role === Lib.Purchasing.roleBuyer) {
                        bok = !prSpendingDispatcher.AsBackToSpendingFromCommitted().length;
                    }
                    else {
                        bok = !prSpendingDispatcher.AsBackToSpendingFromToApprove().length;
                    }
                    bok = bok && await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
                        Data.SetValue("RequisitionStatus__", Lib.Purchasing.PRStatus.rejected);
                        return await Lib.Purchasing.PRValidation.SynchronizeItems() || rollbackFn();
                    });
                    if (bok) {
                        if (Lib.P2P.Inventory.IsEnabled()) {
                            await RevertForecastedStockMovements();
                        }
                        let contributionData = GetContributionData(sequenceStep, this.actions.rejected.GetName(), g_newComment, { onBehalfOf: true });
                        ResetAdvisorList();
                        // Sends email notification to the user
                        SendEmailNotification(workflow.GetContributorAt(0), "_A purchase requisition has been rejected", "Purchasing_Email_NotifRejected.htm", false, {
                            RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                            RequesterName__: Data.GetValue("RequesterName__"),
                            TotalNetAmount__: Data.GetValue("TotalNetAmount__") + "",
                            Currency__: Data.GetValue("Currency__"),
                            LastValidatorName__: Data.GetValue("LastValidatorName__"),
                            Last_Comments__: Variable.GetValueAsString("Last_Comments__"),
                            GoodsSummary: Lib.Purchasing.GetGoodsSummary()
                        });
                        NotifyEndOfContributionOnMobile(currentContributor);
                        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                        workflow.EndWorkflow(contributionData);
                        // Reject message
                        Data.SetValue("State", 400);
                        Process.LeaveForm();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            sentBackAsReviewer: {
                OnDone: async function (sequenceStep) {
                    return await SentBack(sequenceStep, this.actions.sentBackAsReviewer.GetName());
                }
            },
            sentBackAsApprover: {
                OnDone: async function (sequenceStep) {
                    return await SentBack(sequenceStep, this.actions.sentBackAsApprover.GetName());
                }
            },
            sentBackAsBuyer: {
                OnDone: async function (sequenceStep) {
                    return await SentBack(sequenceStep, this.actions.sentBackAsBuyer.GetName());
                }
            },
            modifyPR: {
                OnDone: async function (sequenceStep) {
                    let bok = true;
                    let currentContributor = workflow.GetContributorAt(sequenceStep);
                    // update budget according to the role
                    bok = !prSpendingDispatcher.AsBackToSpendingFromToApprove().length;
                    bok = bok && await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
                        Data.SetValue("RequisitionStatus__", Lib.Purchasing.PRStatus.draft);
                        return await Lib.Purchasing.PRValidation.SynchronizeItems() || rollbackFn();
                    });
                    if (bok) {
                        if (Lib.P2P.Inventory.IsEnabled()) {
                            await RevertForecastedStockMovements();
                        }
                        let contributionData = GetContributionData(0, this.actions.modifyPR.GetName());
                        contributionData.comment = Language.Translate("_Has modified PR", false) + "\n" + g_newComment;
                        Data.SetValue("Comments__", "");
                        ResetAdvisorList();
                        workflow.Restart(contributionData);
                        let nextContributor = workflow.GetContributorAt(0);
                        // mail to send went recall from requester
                        SendEmailNotification(currentContributor, "_A Purchase requisition has been recalled", "Purchasing_Email_NotifRecall.htm", false, {
                            RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                            RequesterName__: Data.GetValue("RequesterName__"),
                            Last_Comments__: Variable.GetValueAsString("Last_Comments__")
                        });
                        NotifyEndOfContributionOnMobile(currentContributor);
                        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                        Process.Forward(nextContributor.login);
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            rfi: {
                OnDone: async function (sequenceStep) {
                    let bok = await Lib.Purchasing.PRValidation.SynchronizeItems();
                    if (bok) {
                        let advisor = {
                            login: Variable.GetValueAsString("AdvisorLogin"),
                            name: Variable.GetValueAsString("AdvisorName"),
                            email: Variable.GetValueAsString("AdvisorEmail")
                        };
                        // add the current advisor in advisor list
                        let list = Variable.GetValueAsString("AdvisorLoginList");
                        list = list ? advisor.login + "\n" + list : advisor.login;
                        Variable.SetValueAsString("AdvisorLoginList", list);
                        let contributionData = GetContributionData(sequenceStep, this.actions.rfi.GetName(), g_newComment, {
                            sharedWith: true,
                            onBehalfOf: true
                        });
                        SendEmailNotification(advisor, "_Request for information mail title", "Purchasing_Email_NotifRFI.htm", false, {
                            AdvisorName: Variable.GetValueAsString("AdvisorName"),
                            LastValidatorName__: Data.GetValue("LastValidatorName__"),
                            RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                            RequesterName__: Data.GetValue("RequesterName__"),
                            Currency__: Data.GetValue("Currency__"),
                            TotalNetAmount__: Data.GetValue("TotalNetAmount__") + "",
                            Last_Comments__: Variable.GetValueAsString("Last_Comments__"),
                            GoodsSummary: Lib.Purchasing.GetGoodsSummary()
                        });
                        Log.Info("Grand all right to advisor: " + advisor.login);
                        Process.SetRight(advisor.login, "all"); // Advisor can modify the comment
                        // Add a new step for user shared the PR (requester or approver). Previously done in the custom script.
                        // We do it here now in order to reduce the crash window between the both calls to workfow (AddContributorAt and NextContributor).
                        workflow.AddContributorAt(sequenceStep + 1, g_currentContributor);
                        workflow.NextContributor(contributionData);
                        Process.DisableChecks();
                        Process.PreventApproval();
                        Process.LeaveForm();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            comment: {
                OnDone: function (sequenceStep) {
                    let requesterOfInformations = workflow.GetContributorAt(sequenceStep);
                    // Add the step of advisor here. Previously done in the custom script.
                    // We do it here now in order to reduce the crash window between the both calls to workfow (AddContributorAt and NextContributor).
                    let advisor = {
                        login: Variable.GetValueAsString("AdvisorLogin"),
                        name: Variable.GetValueAsString("AdvisorName"),
                        email: Variable.GetValueAsString("AdvisorEmail")
                    };
                    workflow.AddContributorAt(sequenceStep, {
                        //mandatory fields
                        contributorId: advisor.login + Lib.Purchasing.roleAdvisor,
                        role: Lib.Purchasing.roleAdvisor,
                        //not mandatory fields
                        login: advisor.login,
                        name: advisor.name,
                        email: advisor.email,
                        action: this.actions.comment.GetName()
                    });
                    let contributionData = GetContributionData(sequenceStep, this.actions.commentDone.GetName(), g_newComment);
                    SendEmailNotification(requesterOfInformations, "_Your RFI has been answered", "Purchasing_Email_NotifRFIAnswer.htm", false, {
                        DestinationFullName: requesterOfInformations.name,
                        AdvisorName: Variable.GetValueAsString("AdvisorName"),
                        Last_Comments__: Variable.GetValueAsString("Last_Comments__"),
                        RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                        RequesterName__: Data.GetValue("RequesterName__"),
                        TotalNetAmount__: Data.GetValue("TotalNetAmount__") + "",
                        Currency__: Data.GetValue("Currency__"),
                        GoodsSummary: Lib.Purchasing.GetGoodsSummary()
                    });
                    workflow.NextContributor(contributionData);
                    Process.DisableChecks();
                    Process.PreventApproval();
                    Process.LeaveForm();
                }
            },
            commentDone: {},
            purchase: {
                OnDone: async function (sequenceStep) {
                    if (!await Lib.Purchasing.PRValidation.SynchronizeItems({ fromAction: true })) {
                        Process.PreventApproval();
                        return false;
                    }
                    UpdateForcastedStockMovements();
                    const itemsByBuyer = GetItemByBuyer();
                    let changeOwner = false;
                    for (let buyerLogin in itemsByBuyer) {
                        const items = itemsByBuyer[buyerLogin];
                        const status = Lib.Purchasing.PRValidation.GetGlobalStatus(items);
                        // Once all items are ordered for this buyerLogin (status -> Pending delivery...) we go to the next step in workflow (other buyers steps)
                        if (Lib.Purchasing.PRStatus.ForDelivery.includes(status)) {
                            sequenceStep = workflow.GetContributorIndex();
                            changeOwner = await CompleteBuyerStepWithNoItemsLeft(buyerLogin, sequenceStep, true) || changeOwner;
                        }
                    }
                    if (changeOwner) {
                        ChangeOwner();
                    }
                    Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                    Process.WaitForUpdate();
                    Process.LeaveForm();
                    return true;
                }
            },
            orderCreated: {},
            orderCanceled: {},
            // This action is only called from the PO when the recipient receives one or several items of this PR with SynchronizeItems action
            reception: {
                OnDone: async function ( /*sequenceStep*/) {
                    let bok = await Lib.Purchasing.PRValidation.SynchronizeItems({ fromAction: true });
                    if (bok) {
                        UpdateForcastedStockMovements(true);
                        // Once all items are received (status -> Received) we end workflow
                        if (Data.GetValue("RequisitionStatus__") === Lib.Purchasing.PRStatus.received) {
                            // we need the "all" right in order to be able to resubmit PR if recipient cancels a GR and reopens PR
                            GiveRightToRecipients("all");
                        }
                        else {
                            Process.WaitForUpdate();
                            Process.LeaveForm();
                        }
                        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            received: {},
            canceled: {
                OnDone: async function (sequenceStep) {
                    let bok = true;
                    const currentContributor = workflow.GetContributorAt(sequenceStep);
                    let comment = g_newComment;
                    const PRPendingCommitment = currentContributor.role === Lib.Purchasing.roleApprover ||
                        currentContributor.role === Lib.Purchasing.roleReviewer;
                    if (PRPendingCommitment) {
                        bok = !prSpendingDispatcher.AsBackToSpendingFromToApprove().length;
                        comment = Language.Translate("_PR waiting for approval by {0} canceled by requester", false, currentContributor.name) + "\n" + comment;
                    }
                    bok = bok && await Sys.Helpers.Data.RollbackableSection(async function (rollbackFn) {
                        Data.SetValue("RequisitionStatus__", Lib.Purchasing.PRStatus.canceled);
                        return await Lib.Purchasing.PRValidation.SynchronizeItems() || rollbackFn();
                    });
                    if (bok) {
                        if (Lib.P2P.Inventory.IsEnabled()) {
                            await RevertForecastedStockMovements();
                        }
                        const contributionData = GetContributionData(0, this.actions.canceled.GetName(), comment, { onBehalfOf: true }, true);
                        Data.SetValue("Comments__", "");
                        ResetAdvisorList();
                        workflow.EndWorkflow(contributionData);
                        if (PRPendingCommitment) {
                            SendEmailNotification(currentContributor, "_A purchase requisition has been canceled", "Purchasing_Email_NotifPRCancel.htm", false, {
                                RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
                                RequesterName__: Data.GetValue("RequesterName__"),
                                Last_Comments__: Variable.GetValueAsString("Last_Comments__")
                            });
                        }
                        NotifyEndOfContributionOnMobile(currentContributor);
                        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                        // Cancel message
                        Process.Cancel();
                        Process.LeaveForm();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            remainingItemsCanceled: {
                OnDone: async function ( /*sequenceStep: number*/) {
                    const cancelerUser = Lib.P2P.GetValidator();
                    const selectOnlyBuyerItems = Lib.Purchasing.IsBuyerInWorkflow(workflow, cancelerUser);
                    let items = [];
                    Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
                        if (line.GetValue("ItemStatus__") !== Lib.Purchasing.PRStatus.canceled &&
                            (!selectOnlyBuyerItems || Lib.P2P.CurrentUserMatchesLogin(line.GetValue("BuyerLogin__"), cancelerUser)) &&
                            ((Sys.Parameters.GetInstance("PAC").GetParameterBool("AllowSplitPRIntoMultiplePO", false)) ||
                                (line.GetValue("ItemOrderedQuantity__") === 0))) {
                            items.push(line.GetValue("LineItemNumber__"));
                        }
                    });
                    let bok = await CancelItems(items, this.actions.remainingItemsCanceled.GetName(), cancelerUser, new Date(), g_newComment);
                    bok = bok && UpdateForcastedStockMovements();
                    if (bok) {
                        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                        Process.LeaveForm();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            },
            itemsCanceled: {
                OnDone: async function ( /*sequenceStep: number*/) {
                    let bok = true;
                    let cancellationData;
                    let cancelerUser;
                    try {
                        cancellationData = JSON.parse(Variable.GetValueAsString("ResumeWithActionData") || "");
                    }
                    catch (e) {
                        Log.Error("Failed to parse cancellation data: " + e);
                        bok = false;
                    }
                    bok = bok && !!cancellationData.user;
                    if (bok) {
                        cancelerUser = Users.GetUser(cancellationData.user.login);
                        if (!cancelerUser) {
                            Log.Error(`Cannot find user with login: ${cancellationData.user.login}`);
                            bok = false;
                        }
                    }
                    bok = bok && await CancelItems(cancellationData.lines, this.actions.itemsCanceled.GetName(), cancelerUser, cancellationData.date, cancellationData.comment);
                    bok = bok && UpdateForcastedStockMovements();
                    if (bok) {
                        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                        Process.LeaveForm();
                    }
                    else {
                        Process.PreventApproval();
                    }
                    return bok;
                }
            }
        },
        callbacks: {
            OnError: function (msg) {
                Log.Error(msg);
            }
        }
    };
    // Helper function to initialize workflow parameters and settings
    function InitializeWorkflow() {
        Sys.Helpers.Extend(true, parameters, Lib.Purchasing.PR.Workflow.Parameters);
        const workflowParamCustom = Sys.Helpers.TryCallFunction("Lib.Workflow.Customization.Common.PR.ExtendWorkflowParameters", parameters);
        const workflowParameters = Sys.Helpers.Extend({}, parameters, workflowParamCustom);
        workflow.AllowRebuild(false);
        workflow.Define(workflowParameters);
        if ((JSON.parse(Data.GetValue("TechnicalData__") || "{}").AutoSubmitted === true) && workflow.GetNbContributors() === 0) {
            Log.Info("[InitializeWorkflow] Auto-submitted requisition");
            const previousAllowRebuildState = workflow.RebuildAllowed();
            workflow.AllowRebuild(true);
            workflow.SetRolesSequence(rolesSequenceForPR);
            workflow.AllowRebuild(previousAllowRebuildState);
            g_sequenceStep = workflow.GetContributorIndex();
            g_currentContributor = workflow.GetContributorAt(g_sequenceStep);
        }
    }
    // Helper function to set requisition number if not already set
    function SetRequisitionNumber() {
        if (Sys.Helpers.IsEmpty(Data.GetValue("RequisitionNumber__"))) {
            let ReqNumber = Lib.P2P.NextNumber("PR", "RequisitionNumber__");
            if (ReqNumber !== "") {
                Data.SetValue("RequisitionNumber__", "" + ReqNumber);
            }
        }
    }
    // Helper function to initialize technical fields and table settings
    function InitializeTechnicalFields() {
        Lib.Purchasing.InitTechnicalFields();
        // Index LineItems table to ES for better reporting
        Lib.P2P.SetTablesToIndex(["LineItems__", "ApproversList__"]);
        Lib.Purchasing.RemoveEmptyLineItem(Data.GetTable("LineItems__"));
        if (Lib.ERP.IsSAP()) {
            Sys.Helpers.Data.SetAllowTableValuesOnlyForColumns("LineItems__", ["ItemCostCenterName__", "ItemGLAccount__", "VendorName__", "VendorNumber__", "InternalOrder__", "WBSElement__"], false);
        }
        // Vendor ref. is no longer checked
        Sys.Helpers.Data.SetAllowTableValuesOnlyForColumns("LineItems__", ["SupplierPartID__"], false);
        if (Data.GetValue("RequisitionStatus__") != Lib.Purchasing.PRStatus.draft) {
            Sys.Helpers.Data.SetAllowTableValuesOnlyForColumns("LineItems__", ["RecipientName__", "ProjectName__", "ProjectNumber__"], false);
        }
        Variable.SetValueAsString("Last_Comments__", g_newComment);
    }
    function SendNotifications() {
        const notifyQuoteRequester = Variable.GetValueAsString("NotifyQuoteByEmailRequester__");
        const notifyPRExternalFileReceived = Variable.GetValueAsString("NotifyPRExternalFileReceived");
        if (notifyQuoteRequester !== "1"
            && !Lib.Purchasing.PR.ExternalFile.Server.IsExternalFileNotificationPending(notifyPRExternalFileReceived)) {
            return;
        }
        SetRequisitionNumber();
        if (notifyQuoteRequester === "1") {
            const requester = {
                login: Lib.P2P.GetOwner().GetValue("Login"),
                email: Lib.P2P.GetOwner().GetValue("EmailAddress"),
                name: Lib.P2P.GetOwner().GetValue("DisplayName")
            };
            Variable.SetValueAsString("NotifyQuoteByEmailRequester__", "Done"); // send it just one time
            const lastExtractedVendorName = Variable.GetValueAsString("lastExtractedVendorName");
            SendEmailNotification(requester, "_New quotation - Complete your purchase requisition", "Purchasing_Email_NotifQuotationReceived.htm", false, {
                DestinationFullName: requester.name,
                lastExtractedVendorName: lastExtractedVendorName,
                Vendor_name_START__: Sys.Helpers.IsEmpty(lastExtractedVendorName) ? "<!--" : "",
                Vendor_name_END__: Sys.Helpers.IsEmpty(lastExtractedVendorName) ? "-->" : ""
            });
        }
        else {
            SendExternalFileNotifications(notifyPRExternalFileReceived);
        }
    }
    function SendExternalFileNotifications(notificationType) {
        const requester = {
            login: Lib.P2P.GetOwner().GetValue("Login"),
            email: Lib.P2P.GetOwner().GetValue("EmailAddress"),
            name: Lib.P2P.GetOwner().GetValue("DisplayName")
        };
        Variable.SetValueAsString("NotifyPRExternalFileReceived", "Done"); // send it just one time
        const externalFileEmailNotification = Lib.Purchasing.PR.ExternalFile.Server.externalFileEmailNotifications[notificationType];
        SendEmailNotification(requester, externalFileEmailNotification.subject, externalFileEmailNotification.template, false, {
            DestinationFullName: requester.name,
            RequisitionNumber__: Data.GetValue("RequisitionNumber__"),
            Reason__: Data.GetValue("Reason__")
        });
    }
    // Helper function to handle first validation logic
    function HandleFirstValidation() {
        SendNotifications();
        if (context.isFromMobileApp) {
            if (!Data.GetValue("State")) {
                Log.Info(`[PR Origin][Validation] Writing Origin__='${Lib.P2P.PurchaseRequisitionOrigin.MOBILE_APPLICATION}' for mobile creation`);
                Data.SetValue("Origin__", Lib.P2P.PurchaseRequisitionOrigin.MOBILE_APPLICATION);
            }
            else { // we submit the document
                Variable.SetValueAsString("SubmittedFromMobileApp", ""); // reset this flag for clone
                context.SetCurrentName(submitAction);
                context.SetCurrentType("approve");
                Log.Info("Submitted from mobile app - Simulating currentName = " + submitAction + " and currentAction = 'approve'");
                isSubmissionFromMobileApp = true;
            }
        }
        else if (JSON.parse(Data.GetValue("TechnicalData__") || "{}").AutoSubmitted === true) {
            if (!Data.GetValue("State")) {
                if (Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.IsSubmittedFromIntakeRequest()) {
                    SetCurrentComment(Language.Translate("_Skipped - Auto-submitted from intake request", false));
                }
                else if (Data.GetValue("Origin__") === Lib.P2P.PurchaseRequisitionOrigin.EXTERNAL_FILE) {
                    SetCurrentComment(Lib.Purchasing.PR.ExternalFile.Server.BuildAutoSubmittedComment(Data.GetValue("Comments__")));
                    Process.RecallScript(autoSubmitAction);
                }
                context.ForceNextScriptAction("FromValidationScript", autoSubmitAction);
            }
        }
        else {
            Process.PreventApproval();
        }
        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
    }
    // Helper function to reset budget items
    function ResetBudgetItems() {
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
            item.SetValue("ItemBudgetViewed__", false);
            item.SetValue("OutOfBudget__", false);
        });
    }
    async function ExecuteSubmitAction() {
        if (!await IsFormInError()) {
            await workflow.DoAction(g_currentContributor.action);
        }
        else if (context.name === autoSubmitAction
            && Data.GetValue("Origin__") === Lib.P2P.PurchaseRequisitionOrigin.EXTERNAL_FILE
            && Variable.GetValueAsString("NotifyPRExternalFileReceived") === "") {
            SendExternalFileNotifications(Lib.Purchasing.PR.ExternalFile.Server.NotificationType.NotifyOwner);
            g_newComment = Lib.Purchasing.PR.ExternalFile.Server.UpdateWorkflowComment(Data.GetValue("Comments__"));
        }
    }
    // Helper function to handle workflow actions
    async function HandleWorkflowAction() {
        SetRequisitionNumber();
        Lib.CommonDialog.NextAlert.Reset();
        const actionHandlers = {
            "Cancel_purchase_requisition": async () => await workflow.DoAction(parameters.actions.canceled.GetName()),
            "Cancel_remaining_items": async () => {
                if (await Lib.Purchasing.PRValidation.CanResumeWithAction(context.name)) {
                    await workflow.DoAction(parameters.actions.remainingItemsCanceled.GetName());
                }
            },
            "ModifyPR": async () => {
                if (g_sequenceStep > 0) {
                    if (context.type !== "ResumeWithAction" || await Lib.Purchasing.PRValidation.CanResumeWithAction(context.name)) {
                        ResetBudgetItems();
                        await workflow.DoAction(parameters.actions.modifyPR.GetName());
                    }
                }
                else {
                    Data.SetError("ApproversList__", "_Failed to forward back to requester");
                }
            },
            "Cancel_items": async () => {
                if (await Lib.Purchasing.PRValidation.CanResumeWithAction(context.name)) {
                    let cancellationData;
                    try {
                        cancellationData = JSON.parse(Variable.GetValueAsString("ResumeWithActionData") || "");
                    }
                    catch (e) {
                        Log.Error("Failed to parse cancellation data: " + e);
                    }
                    if (cancellationData) {
                        Variable.SetValueAsString("Last_Comments__", cancellationData.comment);
                    }
                    await workflow.DoAction(parameters.actions.itemsCanceled.GetName());
                }
            },
            "Reject": async () => {
                if (context.type !== "ResumeWithAction" || await Lib.Purchasing.PRValidation.CanResumeWithAction(context.name)) {
                    ReOpenWorkflowIfNeeded();
                    await workflow.DoAction(parameters.actions.rejected.GetName());
                }
            },
            [submitAction]: ExecuteSubmitAction,
            [autoSubmitAction]: ExecuteSubmitAction,
            "BackToAP": async () => {
                if (g_sequenceStep > 0) {
                    if (context.type !== "ResumeWithAction" || await Lib.Purchasing.PRValidation.CanResumeWithAction(context.name)) {
                        ResetBudgetItems();
                        let actionName = parameters.actions.sentBackAsApprover.GetName();
                        if (g_currentContributor.role === Lib.Purchasing.roleReviewer) {
                            actionName = parameters.actions.sentBackAsReviewer.GetName();
                        }
                        else if (g_currentContributor.role === Lib.Purchasing.roleBuyer) {
                            actionName = parameters.actions.sentBackAsBuyer.GetName();
                        }
                        await workflow.DoAction(actionName);
                    }
                }
                else {
                    Data.SetError("ApproversList__", "_Failed to forward back to requester");
                }
            },
            "RequestForInformation": async () => {
                Process.DisableChecks();
                if (Variable.GetValueAsString("AdvisorLogin")) {
                    DefineOutlierQuantityNextAlert();
                    await workflow.DoAction(parameters.actions.rfi.GetName());
                }
            },
            "Comment_Answer": async () => {
                Process.DisableChecks();
                if (g_sequenceStep > 0) {
                    DefineOutlierQuantityNextAlert();
                    await workflow.DoAction(parameters.actions.comment.GetName());
                }
                else {
                    Data.SetError("ApproversList__", "_Failed to add your comment");
                }
            },
            "Approve_Forward": async () => {
                if (!await IsFormInError()) {
                    DefineOutlierQuantityNextAlert();
                    if (g_currentContributor.role === Lib.Purchasing.roleReviewer) {
                        await workflow.DoAction(parameters.actions.reviewAndForward.GetName());
                    }
                    else {
                        await workflow.DoAction(parameters.actions.forward.GetName());
                    }
                }
            },
            "SynchronizeItems": async () => {
                var _a, _b;
                Process.DisableChecks();
                const status = Data.GetValue("RequisitionStatus__");
                if (Lib.Purchasing.PRStatus.ForPRWorkflow.includes(status) || status === Lib.Purchasing.PRStatus.waitingForPOApproval) {
                    await Lib.Purchasing.PRValidation.SynchronizeItems({ fromAction: true });
                    Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.Request();
                    status === Lib.Purchasing.PRStatus.waitingForPOApproval ? Process.WaitForUpdate() : Process.PreventApproval();
                }
                else if (Lib.Purchasing.PRStatus.ForDelivery.includes(status)) {
                    await ((_b = (_a = parameters.actions.reception).OnDone) === null || _b === void 0 ? void 0 : _b.call(_a));
                }
                else {
                    await workflow.DoAction(g_currentContributor.action);
                }
            },
            "FullBudgetRecovery": () => Lib.Purchasing.PRBudget.DoFullRecovery(),
            "Cancel_PO": () => OnCancelPO(),
            "EditOrder": () => OnEditOrder(),
            "UpdateExchangeRate": async () => {
                Process.DisableChecks();
                await UpdateExchangeRate();
                ComputeAmounts();
                prSpendingDispatcher.AsCommitted();
                Lib.Purchasing.PRValidation.InitComputedDataForPRItemsSynchronizeConfig();
                Lib.Purchasing.Items.Synchronize(Lib.Purchasing.Items.PRItemsSynchronizeConfig);
                await UpdatePOs("UpdateExchangeRate");
                Process.WaitForUpdate();
            }
        };
        const handler = actionHandlers[context.name];
        if (handler) {
            await handler();
        }
        else if (!await IsFormInError()) {
            Lib.Purchasing.PRValidation.OnUnknownAction();
        }
    }
    // Main Start function with reduced complexity
    async function Start() {
        InitializeWorkflow();
        InitializeTechnicalFields();
        if (context.isFirstValidation && !context.isForcedAction) {
            HandleFirstValidation();
        }
        hasOutlierValues = await CheckOutlierQuantities();
        if (context.name === "save") {
            // first call of the validation script when a user clicks an action button.
            // nothing to do here because the XGF isn't saved after execution.
            return;
        }
        if (context.name === "Save_") {
            Lib.Purchasing.CheckPR.RequiredFields.CheckCombinedVendor(); // this field is not checked by the FWK on server side, so do it manually
            SetRequisitionNumber();
            Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.TriggerIfNeeded(true);
            Process.PreventApproval();
            return;
        }
        // Handle workflow actions
        const isSubmitActionWithoutActionType = context.name === submitAction || context.name === autoSubmitAction;
        if ((context.name !== "" && context.type !== "") || isSubmitActionWithoutActionType) {
            const isApprovalAction = context.type === "approve_asynchronous" || context.type === "approve" || context.type === "ResumeWithAction";
            if (isApprovalAction || isSubmitActionWithoutActionType) {
                await HandleWorkflowAction();
            }
            else if (context.type !== "reprocess" && context.type !== "reprocess_asynchronous") {
                Lib.Purchasing.PRValidation.OnUnknownAction();
            }
            //Resetting issues related to PR import
            if (Variable.GetValueAsString("PurchaseRequisitionData")) {
                Variable.SetValueAsString("ImportedPRIssues", null);
            }
        }
        else if (!context.isFirstValidation) {
            Lib.Purchasing.PRValidation.OnUnknownAction();
        }
        // If NeedValidation is set to 0, preventing Retry 2 from setting PR in state 100
        if (context.name === "" && context.type === ""
            && !Sys.Helpers.String.ToBoolean(Data.GetValue("NeedValidation"))
            && Data.GetValue("State").toString() === "50") {
            Log.Warn("Validation Retry 2 - NeedValidation 0 - Preventing PR from being set to state 100");
            Process.WaitForUpdate();
        }
        const isRecallScriptScheduled = Process.IsRecallScriptScheduled();
        Lib.Purchasing.PRValidation.intakeRequestPostValidationSync.TriggerIfNeeded();
        Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnValidationScriptEnd", context.type, context.name, isRecallScriptScheduled, formInError);
    }
    ValidationScript.Start = Start;
    Lib.P2P.HandleScriptError(Start());
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map