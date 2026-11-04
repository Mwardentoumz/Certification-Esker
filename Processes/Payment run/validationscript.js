"use strict";
//#region Constants
const roles = {
    requester: "requester",
    approver: "approver",
    provider: "provider"
};
const conf = Sys.Parameters.GetInstance("PaymentRun");
let validityDTInMonths = conf.GetParameter("ValidityDateTimeInMonths") || 2;
let newComment = Data.GetValue("Comments__");
const processMaxRetryCount = 50;
const EmailNotifications = {
    approval: {
        subject: "_A document is waiting for approval",
        template: "PaymentRun_NotifNextApprover.htm"
    },
    verify: {
        subject: "_A document must be verified",
        template: "PaymentRun_NotifBack.htm"
    },
    actionRequired: {
        subject: "_A document is waiting for your action",
        template: "PaymentRun_NotifBackProvider.htm"
    }
};
//#endregion
var WorkFlowControl;
(function (WorkFlowControl) {
    WorkFlowControl.workflowUI = null;
    const workflowParams = {
        actions: {
            approve: {
                OnDone: function (workflowStep) {
                    if (GetNextStepRole() === roles.provider || GetNextStepRole() === "") {
                        // Next contributor is the provider
                        // TODO - Change check to Status__ === "To pay" once we have it
                        const bAlreadyPosted = Variable.GetValueAsString("AcknowledgedByPaymentProvider") === "1";
                        if (bAlreadyPosted) {
                            WorkFlowControl.RefreshPaymentStatus(workflowStep);
                        }
                        else {
                            WorkFlowControl.ArchiveOrSendPayment(workflowStep);
                        }
                    }
                    else if (GetNextStepRole() === roles.approver &&
                        (GetNextStepRole(2) === roles.provider || GetNextStepRole(2) === "")) {
                        updateInvoicesWhenForwardToNextContributor();
                        if (!isAllInvoicesUpdated()) {
                            Process.RecallScript("approve_Recall");
                        }
                        else {
                            // Next contributor is the requester
                            Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ApprovedToPay);
                            WorkFlowControl.ForwardToNextContributor(workflowStep);
                        }
                    }
                    else if (GetNextStepRole() === roles.approver) {
                        updateInvoicesWhenForwardToNextContributor();
                        if (!isAllInvoicesUpdated()) {
                            Process.RecallScript("approve_Recall");
                        }
                        else {
                            // Next contributor is an approver
                            Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ToApprove);
                            WorkFlowControl.ForwardToNextContributor(workflowStep);
                        }
                    }
                }
            },
            backtoprevious: {
                OnDone: function (workflowStep) {
                    WorkFlowControl.workflowUI.BackTo(workflowStep - 1, GetContributionData(workflowStep, "backtoprevious", Language.Translate("_Sent back")));
                    Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ToApprove);
                    Data.SetValue("Comments__", "");
                    Forward(EmailNotifications.approval);
                }
            },
            backtofirst: {
                OnDone: function (workflowStep) {
                    WorkFlowControl.workflowUI.Restart(GetContributionData(workflowStep, "backtofirst", Language.Translate("_Back to first"), Data.GetValue("BackToFirstReason__")));
                    Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ToVerify);
                    Data.SetValue("Comments__", "");
                    Data.SetValue("BackToFirstReason__", "");
                    Forward(EmailNotifications.verify);
                }
            },
            addapprover: {
                OnDone: function (workflowStep) {
                    const approver = {
                        login: Variable.GetValueAsString("ForwardApproverLogin"),
                        name: Variable.GetValueAsString("ForwardApproverName"),
                        email: Variable.GetValueAsString("ForwardApproverEmail")
                    };
                    WorkFlowControl.workflowUI.AddContributorAt(WorkFlowControl.workflowUI.GetContributorIndex() + 1, {
                        contributorId: `approver_${approver.login}`,
                        role: roles.approver,
                        login: approver.login,
                        name: approver.name,
                        email: approver.email,
                        action: "approve"
                    });
                    WorkFlowControl.workflowUI.NextContributor(GetContributionData(workflowStep, "addapprover", Language.Translate("_Approved and forwarded to {0}", false, approver.name)));
                    Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ToApprove);
                    Data.SetValue("Comments__", "");
                    Forward(EmailNotifications.approval);
                    // Give the read right on invoices to the current contributor
                    const currentContributor = WorkFlowControl.workflowUI.GetCurrentContributor();
                    RightsManager.GiveReadRightToContributor(currentContributor);
                    return true;
                }
            },
            reject: {
                OnDone: function (workflowStep) {
                    const statusToUpdate = { VendorInvoice: { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.ToPay } } };
                    Lib.AP.PaymentRun.UpdateInvoices([{ fieldsToUpdate: statusToUpdate }]);
                    if (!isAllInvoicesUpdated()) {
                        Process.RecallScript("reject_Recall");
                    }
                    else {
                        WorkFlowControl.workflowUI.EndWorkflow(GetContributionData(workflowStep, "reject", Language.Translate("_Rejected"), Data.GetValue("RejectionReason__")));
                        Data.SetValue("State", 400);
                        Data.SetValue("Status__", Lib.AP.PaymentRunStatus.Rejected);
                        Data.SetValue("Comments__", "");
                        Data.SetValue("RejectionReason__", "");
                        Process.DisableChecks();
                        Process.LeaveForm();
                        sendEmailNotification(WorkFlowControl.workflowUI.GetContributorAt(0), "_A document has been rejected", "PaymentRun_NotifRejected.htm");
                    }
                    return true;
                }
            },
            cancel: {
                OnDone: function (workflowStep) {
                    const statusToUpdate = { VendorInvoice: { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.ToPay } } };
                    Lib.AP.PaymentRun.UpdateInvoices([{ fieldsToUpdate: statusToUpdate }]);
                    if (!isAllInvoicesUpdated()) {
                        Process.RecallScript("cancel_Recall");
                    }
                    else {
                        WorkFlowControl.workflowUI.EndWorkflow(GetContributionData(workflowStep, "cancel", Language.Translate("_Cancelled")));
                        Data.SetValue("State", 300);
                        Data.SetValue("Status__", Lib.AP.PaymentRunStatus.Cancelled);
                        Data.SetValue("Comments__", "");
                        Process.DisableChecks();
                        Process.LeaveForm();
                    }
                    return true;
                }
            },
            onexpiration: {
                OnDone: function (workflowStep) {
                    return OnExpiration(workflowStep);
                }
            }
        },
        roles: {
            requester: {
                OnBuild: function (callback) {
                    callback([{
                            contributorId: `roles.requester_${Data.GetValue("WorkflowInitiatorID__")}`,
                            role: roles.requester,
                            login: Data.GetValue("WorkflowInitiatorID__"),
                            email: Variable.GetValueAsString("WorkflowInitiatorEmail"),
                            name: Data.GetValue("WorkflowInitiatorName__"),
                            action: "approve"
                        }]);
                    return true;
                }
            },
            approver: {
                OnBuild: function (callback) {
                    const getStepsOptions = {
                        debug: true,
                        skipRuleApplicationConditions: false,
                        allowNoCCOwner: true,
                        companyCodeIsOptional: true,
                        fields: {
                            values: {
                                WorkflowType__: "paymentRun",
                                CostCenterID__: "",
                                CompanyCode__: Variable.GetValueAsString("CompanyCode"),
                                WorkflowAmount__: Data.GetValue("TotalNonRejectedAmount__") || 0,
                                WorkflowCurrency__: Data.GetValue("Currency__"),
                                RequisitionInitiator__: Data.GetValue("WorkflowInitiatorID__")
                            }
                        },
                        success: function (approvers, ruleApplied) {
                            Log.Info(`Approval Workflow, rule applied: ${ruleApplied}`);
                            // Keep only the login
                            const logins = Sys.Helpers.Array.Map(approvers, function (approver) {
                                return approver.login;
                            });
                            Sys.OnDemand.Users.GetUsersFromLogins(logins, ["displayname", "emailaddress"], function (users) {
                                // Build a contributor object with user information
                                const contributors = Sys.Helpers.Array.Map(users, function (user) {
                                    return {
                                        contributorId: `${roles.approver}_${user.login}`,
                                        role: roles.approver,
                                        login: user.login,
                                        email: user.exists ? user.emailaddress : user.login,
                                        name: user.exists ? user.displayname : user.login,
                                        action: "approve"
                                    };
                                });
                                // Return contributors
                                callback(contributors);
                            });
                        },
                        error: function (errorMessage) {
                            workflowParams.callbacks.OnError(errorMessage);
                            callback([]);
                        }
                    };
                    // Get a list of approvers from the WorkFlowControl.workflowUI rule
                    Sys.WorkflowEngine.GetStepsResult(getStepsOptions);
                    return true;
                }
            },
            provider: {
                OnBuild: function (callback) {
                    const providerName = PaymentProviderManager.GetName();
                    if (providerName) {
                        callback([{
                                contributorId: WorkFlowControl.workflowUI.CreateUniqueContributorId("paymentProvider"),
                                role: roles.provider,
                                login: "",
                                email: "",
                                name: Language.Translate(providerName, false),
                                action: "sentToProvider"
                            }]);
                        return true;
                    }
                    return false;
                }
            }
        },
        mappingTable: {
            workflowIndex: "Workflow_index__",
            tableName: "Workflow__",
            columns: {
                User__: {
                    data: "name"
                },
                Role__: {
                    data: "role",
                    translate: true
                },
                Date__: {
                    data: "date"
                },
                Action__: {
                    data: "action"
                },
                Comment__: {
                    data: "comment"
                },
                IsGroup__: {
                    data: "isGroup"
                },
                ID__: {
                    data: "login"
                },
                Email__: {
                    data: "email"
                },
                Approved__: {
                    data: "approved" // For mobile apps compatibility
                },
                ActualApproverLogin__: {
                    data: "actualApprover"
                }
            }
        },
        callbacks: {
            OnError: function (msg) {
                Variable.SetValueAsString("WorkflowError", msg);
                Log.Error(msg);
                Process.PreventApproval();
            },
            OnBuilding: function () {
                Variable.SetValueAsString("WorkflowError", "");
            }
        }
    };
    function ForwardToNextContributor(workflowStep) {
        Log.Info("Forwarding to next contributor");
        const comment = workflowStep === 0 ? "_Approval requested" : "_Approved";
        WorkFlowControl.workflowUI.NextContributor(GetContributionData(workflowStep, "approved", Language.Translate(comment)));
        Data.SetValue("Comments__", "");
        Forward(EmailNotifications.approval);
    }
    WorkFlowControl.ForwardToNextContributor = ForwardToNextContributor;
    function updateInvoicesWhenForwardToNextContributor() {
        const currentContributor = WorkFlowControl.workflowUI.GetCurrentContributor();
        const currentStepRole = WorkFlowControl.GetCurrentStepRole();
        if (currentStepRole === roles.requester) {
            const vendorInvoiceFieldsToUpdate = { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.InPaymentProposal } };
            const customerInvoiceFieldsToUpdate = { fields: { CustomerInvoiceStatus__: Lib.AP.InvoiceStatus.InPaymentProposal } };
            Lib.AP.PaymentRun.UpdateInvoices([{ fieldsToUpdate: { VendorInvoice: vendorInvoiceFieldsToUpdate, CustomerInvoice: customerInvoiceFieldsToUpdate } }], null, currentContributor);
        }
        else {
            Variable.SetValueAsString("NumberOfUpdatedInvoices", Data.GetTable("LineItems__").GetItemCount());
            // No change on invoice, but we need to give the read rights to the current contributor
            RightsManager.GiveReadRightToContributor(currentContributor);
        }
    }
    WorkFlowControl.updateInvoicesWhenForwardToNextContributor = updateInvoicesWhenForwardToNextContributor;
    /***
     * Transmit the payment to payment provider for payment
     * @returns {Boolean} true if provider returned success; false if provider returned error
     */
    function SendPaymentWithPaymentProvider(workflowStep, contributionData) {
        Log.Info("Sending invoices to provider for payment");
        // if there is a previous attempt to send payment run to payment provider and it has failed,
        // a status should have been serialized
        const previousApprovalStatus = PaymentProviderManager.GetLastStatus();
        let detailedStatus;
        // if there was an error with configuration, it should have been fixed by user, so reload it
        if (previousApprovalStatus === Lib.AP.PaymentRunProvider.Manager.ProviderStatus.ConfigurationError) {
            Sys.Parameters.GetInstance("AP").Reload({ forceReload: true });
        }
        const provider = PaymentProviderManager.GetInstance();
        if (!provider) {
            detailedStatus = {
                status: Lib.AP.PaymentRunProvider.Manager.ProviderStatus.ConfigurationError
            };
        }
        else {
            detailedStatus = provider.Post();
        }
        // Even if the payment provider returns an error - we sent the batch to the payment provider.
        // Now some workflow feature (like the backtoprevious) will be disabled.
        Variable.SetValueAsString("SentIntoPaymentProvider", "1");
        // serialize the payment provider status
        PaymentProviderManager.SerializeLastStatus(detailedStatus);
        // Go to next contributor anyway, to there'll be a payment provider line in the workflow
        WorkFlowControl.workflowUI.NextContributor(contributionData);
        if (detailedStatus.status === Lib.AP.PaymentRunProvider.Manager.ProviderStatus.NoError) {
            Variable.SetValueAsString("AcknowledgedByPaymentProvider", "1");
            // Update payment run status
            Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ApprovedPendingStatus);
            // Update the invoice status
            const nonRejectedInvoiceUpdateInfo = {
                fieldsToUpdate: {
                    VendorInvoice: { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.BeingPaidByProvider } },
                    PaymentRun: { fields: { InvoiceStatus__: Lib.AP.PaymentRunInvoicePaymentStatus.BeingPaidByProvider } }
                },
                filter: { Rejected__: [false, null] }
            };
            const rejectedInvoiceUpdateInfo = {
                fieldsToUpdate: {
                    VendorInvoice: { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.ToPay } }
                },
                filter: { Rejected__: [true] }
            };
            Lib.AP.PaymentRun.UpdateInvoices([nonRejectedInvoiceUpdateInfo, rejectedInvoiceUpdateInfo]);
            ConfigureNextTry(provider.GetNextTryDelay(), workflowStep);
        }
        else {
            HandlePaymentProviderError(detailedStatus, workflowStep + 1);
            return false;
        }
        return true;
    }
    /**
     * Send the invoices to the ERP
     */
    function SendPaymentWithoutPaymentProvider(contributionData) {
        const nonRejectedInvoiceUpdateInfo = {
            fieldsToUpdate: {
                VendorInvoice: { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.BeingPaid } },
                PaymentRun: { fields: { InvoiceStatus__: Lib.AP.PaymentRunInvoicePaymentStatus.Paid } }
            },
            filter: { Rejected__: [false, null] }
        };
        const rejectedInvoiceUpdateInfo = {
            fieldsToUpdate: {
                VendorInvoice: { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.ToPay } }
            },
            filter: { Rejected__: [true] }
        };
        Lib.AP.PaymentRun.UpdateInvoices([nonRejectedInvoiceUpdateInfo, rejectedInvoiceUpdateInfo]);
        if (!isAllInvoicesUpdated()) {
            Process.RecallScript("approve_Recall");
        }
        else {
            let nbPayments = 0;
            Sys.Helpers.Data.ForEachTableItem("LineItems__", (item) => {
                if (item.GetValue("InvoiceStatus__") === Lib.AP.PaymentRunInvoicePaymentStatus.Paid) {
                    nbPayments++;
                }
            });
            Data.SetValue("NbPayments__", nbPayments);
            Data.SetValue("Status__", Lib.AP.PaymentRunStatus.Approved);
            WorkFlowControl.workflowUI.EndWorkflow(contributionData);
        }
    }
    /**
     * Return false if the payment has not been sent to the provider
     */
    function ArchiveOrSendPaymentInternal(paymentProviderName, workflowStep, contributionData) {
        if (!paymentProviderName) {
            SendPaymentWithoutPaymentProvider(contributionData);
            return true;
        }
        return SendPaymentWithPaymentProvider(workflowStep, contributionData);
    }
    WorkFlowControl.ArchiveOrSendPaymentInternal = ArchiveOrSendPaymentInternal;
    /**
     * Called at the end of a payment run, to transmit the invoices to either the ERP or
     * the payment provider
     */
    function ArchiveOrSendPayment(workflowStep) {
        const paymentProviderName = PaymentProviderManager.GetName();
        const contributionData = GetContributionData(workflowStep, "submitted", Language.Translate(paymentProviderName ? "_Submitted for payment" : "_Archived"));
        if (!ArchiveOrSendPaymentInternal(paymentProviderName, workflowStep, contributionData)) {
            return;
        }
        Data.SetValue("Comments__", "");
        const activeEmailNotificationOnPaymentProposalApproved = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.ActivateEmailNotificationOnPaymentProposalApproved") || false;
        if (activeEmailNotificationOnPaymentProposalApproved === true) {
            sendEmailNotification(WorkFlowControl.workflowUI.GetContributorAt(0), "_A document has been approved", "PaymentRun_NotifApproved.htm");
        }
    }
    WorkFlowControl.ArchiveOrSendPayment = ArchiveOrSendPayment;
    function RefreshPaymentStatus(workflowStep) {
        Log.Info("Refreshing payment status");
        // Trace action in workflow and move to provider step
        const contributionData = GetContributionData(workflowStep, "refreshstatus", Language.Translate("_StatusRefreshed"));
        WorkFlowControl.workflowUI.NextContributor(contributionData);
        Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ApprovedPendingStatus);
        // Set CurrentNumberOfRetries to 1 as the refresh is the first attempt
        Variable.SetValueAsString("CurrentNumberOfRetries", "1");
        CheckPaymentStatus(workflowStep + 1);
    }
    WorkFlowControl.RefreshPaymentStatus = RefreshPaymentStatus;
    function OnExpiration(workflowStep) {
        if (!Process.AutoValidatingOnExpiration() && Variable.GetValueAsString("retrywscall") !== "yes") {
            return true;
        }
        const provider = PaymentProviderManager.GetInstance();
        const delayTime = provider.GetNextTryDelay().delayInMillisecondsBetweenPaymentsStatusPolling / 1000;
        Log.Verbose("Delay (delayInMillisecondsBetweenPaymentsStatusPolling): " + delayTime.toString() + " sec");
        Process.Sleep(delayTime);
        return CheckPaymentStatus(workflowStep);
    }
    WorkFlowControl.OnExpiration = OnExpiration;
    function CheckPaymentStatus(workflowStep) {
        const provider = PaymentProviderManager.GetInstance();
        if (provider) {
            // The retrywscall will be set in ConfigureNextTry if applicable
            Variable.SetValueAsString("retrywscall", "");
            const detailedStatus = updatePaymentStatuses(provider);
            PaymentProviderManager.SerializeLastStatus(detailedStatus);
            if (detailedStatus.status === Lib.AP.PaymentRunProvider.Manager.ProviderStatus.NoError) {
                // All invoices has been paid
                Data.SetValue("Status__", Lib.AP.PaymentRunStatus.Paid);
                const providerContributor = GetProviderContributionData("paidByProvider", Language.Translate("_PaidByProvider"));
                WorkFlowControl.workflowUI.EndWorkflow(providerContributor);
            }
            else if (detailedStatus.status === Lib.AP.PaymentRunProvider.Manager.ProviderStatus.Pending) {
                // Some invoices are still pending
                return ConfigureNextTry(provider.GetNextTryDelay(), workflowStep);
            }
            else {
                // something went wrong
                HandlePaymentProviderError(detailedStatus, workflowStep);
            }
        }
        return true;
    }
    function HandlePaymentProviderError(detailedStatus, workflowStep) {
        Process.PreventApproval();
        // set payment run status back to "to verify"
        Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ToVerify);
        // send back to last approver
        const workflowComment = Language.Translate(`_paymentProvider_${detailedStatus.description}`);
        const providerContributor = GetProviderContributionData("providerError", Language.Translate("_SentBackByProviderWithReason{0}", false, workflowComment));
        WorkFlowControl.workflowUI.BackTo(workflowStep - 1, providerContributor);
        Data.SetValue("Comments__", "");
        const currentContributor = WorkFlowControl.workflowUI.GetCurrentContributor();
        if (currentContributor) {
            Forward(EmailNotifications.actionRequired, { WorkflowComment: workflowComment });
        }
    }
    function SetAllInvoicesBackToToPay() {
        const invoiceUpdateInfo = {
            fieldsToUpdate: { VendorInvoice: { fields: { InvoiceStatus__: Lib.AP.InvoiceStatus.ToPay } } },
            filter: {
                InvoiceStatus__: [Lib.AP.PaymentRunInvoicePaymentStatus.ToPay, Lib.AP.PaymentRunInvoicePaymentStatus.BeingPaidByProvider],
                Rejected__: [false, null]
            }
        };
        Lib.AP.PaymentRun.UpdateInvoices([invoiceUpdateInfo]);
    }
    function ConfigureNextTry(nextTryDelay, index) {
        let currentNumberOfRetries = parseInt(Variable.GetValueAsString("CurrentNumberOfRetries"), 10);
        if (isNaN(currentNumberOfRetries)) {
            currentNumberOfRetries = 0;
        }
        const maxPaymentsStatusPollingRetries = nextTryDelay.maxPaymentsStatusPollingRetries;
        if (currentNumberOfRetries >= maxPaymentsStatusPollingRetries) {
            // set payment run status back to "to approve"
            Data.SetValue("State", 70);
            Data.SetValue("Status__", Lib.AP.PaymentRunStatus.ToApprove);
            // send back to last approver
            const workflowComment = Language.Translate("_paymentProvider_MaxRetryCountReached");
            const providerContributor = GetProviderContributionData("providerError", workflowComment);
            WorkFlowControl.workflowUI.BackTo(index - 1, providerContributor);
            Data.SetValue("Comments__", "");
            Forward(EmailNotifications.actionRequired, { WorkflowComment: workflowComment });
            // Reset retries count
            Variable.SetValueAsString("CurrentNumberOfRetries", "0");
            SetAllInvoicesBackToToPay();
            Log.Warn(`Too many retries: ${currentNumberOfRetries} retries, max is ${maxPaymentsStatusPollingRetries}`);
            Process.AllowScriptRetries(false);
            return false;
        }
        else if (currentNumberOfRetries >= processMaxRetryCount) {
            SetAllInvoicesBackToToPay();
            Data.SetValue("State", 200);
            Data.SetValue("Status__", Lib.AP.PaymentRunStatus.Failed);
            Log.Error(`Exit message: Too many retries: ${currentNumberOfRetries} retries, max is ${processMaxRetryCount}`);
            Process.AllowScriptRetries(false);
            return false;
        }
        Variable.SetValueAsString("CurrentNumberOfRetries", (currentNumberOfRetries + 1).toString());
        Variable.SetValueAsString("retrywscall", "yes");
        Process.RecallScript("onexpiration", true);
        return true;
    }
    function Forward(notify, customParams = null) {
        const idx = WorkFlowControl.workflowUI.GetContributorIndex();
        const step = WorkFlowControl.workflowUI.GetContributorAt(idx);
        Process.Forward(step.login);
        Process.LeaveForm();
        if (notify) {
            const currentContributor = WorkFlowControl.workflowUI.GetCurrentContributor();
            if (currentContributor) {
                sendEmailNotification(currentContributor, notify.subject, notify.template, true, customParams);
            }
        }
    }
    function GetContributionData(sequenceStep, action, actionNiceName, reason) {
        const currentContributor = WorkFlowControl.workflowUI.GetContributorAt(sequenceStep);
        const comment = Data.GetValue("Comments__");
        currentContributor.action = action;
        currentContributor.date = new Date();
        currentContributor.actualApprover = Sys.Helpers.String.ExtractLoginFromDN(Lib.P2P.GetValidatorOrOwnerLogin());
        currentContributor.comment = AddActionInComment(comment, actionNiceName, reason, GetInitiatingUserName(currentContributor));
        return currentContributor;
    }
    function GetProviderContributionData(action, translatedComment) {
        const index = WorkFlowControl.workflowUI.GetContributorIndex();
        const currentContributor = WorkFlowControl.workflowUI.GetContributorAt(index);
        currentContributor.action = action;
        currentContributor.date = new Date();
        currentContributor.comment = translatedComment;
        return currentContributor;
    }
    function GetInitiatingUserName(currentContributor) {
        const lastValidator = GetValidatorUser();
        const onBehalfValidator = GetOnBehalfValidator(currentContributor, lastValidator);
        const ownerId = Data.GetValue("OwnerId");
        if (onBehalfValidator) {
            if (onBehalfValidator.IsMemberOf(ownerId)) {
                return onBehalfValidator.GetValue("DisplayName");
            }
            return Language.Translate("_{0} on behalf of {1}", false, onBehalfValidator.GetValue("DisplayName"), currentContributor.name);
        }
        if (lastValidator && currentContributor.login === lastValidator.GetValue("Login")) {
            // no need to specify user name in workflow comment
            return "";
        }
        return currentContributor.name;
    }
    function GetValidatorUser() {
        const lastValidatorID = Data.GetValue("LastValidatorUserId__") || Data.GetValue("OwnerID");
        return Users.GetUserAsProcessAdmin(lastValidatorID);
    }
    function GetOnBehalfValidator(currentContributor, lastValidator) {
        if (lastValidator && currentContributor.login !== lastValidator.GetValue("Login")) {
            return lastValidator;
        }
        return null;
    }
    function AddActionInComment(comment, action, reason, by) {
        if (reason) {
            action = `${action} (${Language.Translate(reason, false)})`;
        }
        return Lib.AP.CommentHelper.ComputeHistoryLine(action, comment, by, true);
    }
    function GetCurrentStepRole() {
        const idx = WorkFlowControl.workflowUI.GetContributorIndex();
        if (idx < WorkFlowControl.workflowUI.GetNbContributors()) {
            return WorkFlowControl.workflowUI.GetRoleAt(idx);
        }
        return "";
    }
    WorkFlowControl.GetCurrentStepRole = GetCurrentStepRole;
    function GetNextStepRole(delta) {
        const idx = WorkFlowControl.workflowUI.GetContributorIndex() + (delta || 1);
        if (idx < WorkFlowControl.workflowUI.GetNbContributors()) {
            return WorkFlowControl.workflowUI.GetRoleAt(idx);
        }
        return "";
    }
    WorkFlowControl.GetNextStepRole = GetNextStepRole;
    // Workflow controller initialisation
    function Init(fromServerSide) {
        // Create and initialise WorkFlowControl.workflowUI
        WorkFlowControl.workflowUI = Sys.WorkflowController.Create(Data, Variable, Language);
        WorkFlowControl.workflowUI.Define(workflowParams);
        if (fromServerSide) {
            WorkFlowControl.workflowUI.SetRolesSequence([roles.requester, roles.approver, roles.provider]);
        }
        else {
            WorkFlowControl.workflowUI.AllowRebuild(false); // Prevent the WorkFlowControl.workflowUI from rebuilding (even in the HTML page script)
        }
    }
    WorkFlowControl.Init = Init;
})(WorkFlowControl || (WorkFlowControl = {}));
var RightsManager;
(function (RightsManager) {
    function GetRecordsList(ruidExList) {
        return Sys.Helpers.Array.Map(ruidExList, function (ruidex) {
            return {
                id: ruidex,
                transport: Process.GetUpdatableTransport(ruidex)
            };
        });
    }
    function GiveReadRightToContributor(contributor) {
        const ruidExList = GetRuidEXList();
        const recordsList = GetRecordsList(ruidExList);
        for (let i = 0; i < recordsList.length; ++i) {
            const record = recordsList[i].transport;
            try {
                record.AddRight(contributor.login, "read");
                record.Process();
                if (record.GetLastError()) {
                    Log.Error(record.GetLastError());
                }
            }
            catch (_a) {
                Log.Error(`Failed to update read rights of '${recordsList[i].id}' for ${contributor.login}`);
            }
        }
    }
    RightsManager.GiveReadRightToContributor = GiveReadRightToContributor;
})(RightsManager || (RightsManager = {}));
var PaymentProviderManager;
(function (PaymentProviderManager) {
    function GetInstance() {
        const provider = this.GetName();
        if (provider) {
            return Lib.AP.PaymentRunProvider.CreateManager(provider);
        }
        return null;
    }
    PaymentProviderManager.GetInstance = GetInstance;
    function GetName() {
        return Sys.Parameters.GetInstance("AP").GetParameter("PaymentProvider", "");
    }
    PaymentProviderManager.GetName = GetName;
    function SerializeLastStatus(detailedStatus) {
        Variable.SetValueAsString("LastPaymentProviderStatus", detailedStatus.status);
        if (detailedStatus.status === Lib.AP.PaymentRunProvider.Manager.ProviderStatus.NoError ||
            detailedStatus.status === Lib.AP.PaymentRunProvider.Manager.ProviderStatus.Pending) {
            Variable.SetValueAsString("LastPaymentProviderError", "");
        }
        else {
            Variable.SetValueAsString("LastPaymentProviderError", detailedStatus.description);
        }
    }
    PaymentProviderManager.SerializeLastStatus = SerializeLastStatus;
    /**
     * @returns last status set by provider after a call to Post or GetPaymentStatuses
     */
    function GetLastStatus() {
        const status = Lib.AP.PaymentRunProvider.Manager.ProviderStatus[Variable.GetValueAsString("LastPaymentProviderStatus")];
        return status || Lib.AP.PaymentRunProvider.Manager.ProviderStatus.NoError;
    }
    PaymentProviderManager.GetLastStatus = GetLastStatus;
})(PaymentProviderManager || (PaymentProviderManager = {}));
//#region Invoice updates
function updatePaymentStatuses(provider) {
    const paymentsInfos = new Map();
    const paymentsStatus = provider.GetPaymentStatuses(paymentsInfos);
    if (paymentsInfos.size <= 0) {
        Log.Info("No payment statuses has been retrieved");
        return paymentsStatus;
    }
    Lib.AP.PaymentRun.UpdateInvoices(null, paymentsInfos);
    Lib.AP.PaymentRunExporter.BeginExportXML();
    const lineItemsTable = Data.GetTable("LineItems__");
    let allInvoicesValidated = true;
    let nbPayments = 0;
    for (let i = 0; i < lineItemsTable.GetItemCount(); ++i) {
        const item = lineItemsTable.GetItem(i);
        if (!item) {
            continue;
        }
        const ruidEx = item.GetValue("RuidEx__");
        const paymentInfos = paymentsInfos.get(ruidEx);
        if (item.GetValue("InvoiceStatus__") === Lib.AP.PaymentRunInvoicePaymentStatus.Paid) {
            nbPayments++;
            if (paymentInfos) {
                Lib.AP.PaymentRunExporter.InvoiceExportXML(ruidEx, item, paymentInfos);
            }
        }
        else if (paymentInfos && item.GetValue("InvoiceStatus__") !== Lib.AP.PaymentRunInvoicePaymentStatus.RejectedByProvider) {
            allInvoicesValidated = false;
        }
    }
    Lib.AP.PaymentRunExporter.FinalizeExportXML();
    Data.SetValue("NbPayments__", nbPayments);
    Log.Info(`UpdatePaymentStatuses: updated ${nbPayments} invoices`);
    if (paymentsStatus.status === Lib.AP.PaymentRunProvider.Manager.ProviderStatus.NoError && !allInvoicesValidated) {
        paymentsStatus.status = Lib.AP.PaymentRunProvider.Manager.ProviderStatus.Pending;
    }
    return paymentsStatus;
}
//#endregion
//#region Helpers
function setValidityDateTime() {
    // Set the ValidityDateTime as in the extraction script (SubmitDateTime + 16 months)
    const validityDT = Data.GetValue("SubmitDateTime") || new Date();
    validityDT.setMonth(validityDT.getMonth() + validityDTInMonths);
    Data.SetValue("ValidityDateTime", validityDT);
    Log.Info(`Extend validity date/time to '${validityDT.toLocaleDateString("en-GB")}'`);
}
function setCurrentUserAsRequester() {
    Data.SetValue("WorkflowInitiatorName__", Variable.GetValueAsString("CurrentContributorName"));
    Data.SetValue("WorkflowInitiatorID__", Variable.GetValueAsString("CurrentContributorLogin"));
    Log.Info(`Workflow initiator validator = '${Data.GetValue("WorkflowInitiatorID__")}'`);
}
function setLastValidator() {
    const lastSaveOwnerId = Data.GetValue("LastSavedOwnerID");
    if (lastSaveOwnerId) {
        const lastSaveOwner = Users.GetUserAsProcessAdmin(lastSaveOwnerId);
        Data.SetValue("LastValidatorUserID__", lastSaveOwner.GetValue("Login"));
        Data.SetValue("LastValidatorName__", lastSaveOwner.GetValue("DisplayName"));
    }
    else {
        Data.SetValue("LastValidatorName__", Variable.GetValueAsString("CurrentContributorName"));
        Data.SetValue("LastValidatorUserID__", Variable.GetValueAsString("CurrentContributorLogin"));
    }
    Log.Info(`Last validator = '${Data.GetValue("LastValidatorUserID__")}'`);
}
function sendEmailNotification(step, subject, template, backupUserAsCC, customParams) {
    let approverLanguage = "";
    const emailReceiver = Users.GetUserAsProcessAdmin(step.login);
    const contributor = Users.GetUser(step.login);
    if (contributor) {
        approverLanguage = contributor.GetValue("Language");
    }
    if (!emailReceiver) {
        Log.Error("Email receiver is null or undefined");
        return;
    }
    const sendToAllMembersIfGroup = conf.GetParameter("SendNotificationsToEachGroupMember", false);
    Log.Info(`[sendEmailNotification] To '${step.login}'\nsendToAllMembersIfGroup '${sendToAllMembersIfGroup}'\nbackupUserAsCC '${!!backupUserAsCC}'`);
    Sys.EmailNotification.SendEmailNotification({
        userId: step.login,
        subject: subject,
        template: template,
        fromName: Language.TranslateInto("Esker Accounts payable", approverLanguage, false),
        fromAddress: "notification@eskerondemand.com",
        sendToAllMembersIfGroup: sendToAllMembersIfGroup,
        backupUserAsCC: !!backupUserAsCC,
        customTags: {
            NextApproverName: step.name,
            ProcessUrl: Process.GetProcessURL(Data.GetValue("Ruidex")),
            ...customParams
        }
    });
}
function GetRuidEXList() {
    const Table = Data.GetTable("LineItems__");
    const lineCount = Table ? Table.GetItemCount() : 0;
    const ruidExList = [];
    for (let i = 0; i < lineCount; ++i) {
        const item = Table.GetItem(i);
        if (item) {
            const currentRuidEx = item.GetValue("RuidEx__");
            if (currentRuidEx && ruidExList.indexOf(currentRuidEx) < 0) {
                ruidExList.push(currentRuidEx);
            }
        }
    }
    return ruidExList;
}
function getRejectedLines() {
    const rejectedLinesNumbers = [];
    let totalAmount = 0;
    let amount = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const Table = Data.GetTable("LineItems__");
    const lineCount = Table ? Table.GetItemCount() : 0;
    for (let i = 0; i < lineCount; ++i) {
        const item = Table.GetItem(i);
        let lineAmountWithDiscount = 0;
        if (item) {
            const discountAmount = item.GetValue("DiscountLimitDate__") >= currentDate ? item.GetValue("LocalEstimatedDiscountAmount__") : 0;
            lineAmountWithDiscount = item.GetValue("LocalInvoiceAmount__") - discountAmount;
        }
        if (lineAmountWithDiscount) {
            totalAmount += lineAmountWithDiscount;
        }
        if (item.GetValue("Rejected__")) {
            const lineNum = item.GetValue("LineNumber__") || (i + 1);
            rejectedLinesNumbers.push(lineNum);
        }
        else if (lineAmountWithDiscount) {
            amount += lineAmountWithDiscount;
        }
    }
    return { rejectedLinesNumbers, totalAmount, amount, lineCount };
}
function handleRejectedLines(actionName, actionDevice) {
    const previouslyRejectedLines = Variable.GetValueAsString("RejectedLines") || "";
    let currentlyRejectedLines = "";
    let msg = "";
    const { rejectedLinesNumbers, totalAmount, amount, lineCount } = getRejectedLines();
    // Update header amount (non-rejected)
    let existingTotal = Data.GetValue("TotalNonRejectedAmount__");
    const currency = Data.GetValue("Currency__") ? Data.GetValue("Currency__") : "";
    if (amount !== existingTotal) {
        Log.Info(`Update total non-rejected amount from '${existingTotal}' to '${amount}'`);
        Data.SetValue("TotalNonRejectedAmount__", amount);
        Data.SetValue("TotalNonRejectedAmountWithCurrency__", `${Data.GetValue("TotalNonRejectedAmount__")} ${currency}`);
    }
    // Update header total amount
    existingTotal = Data.GetValue("TotalAmount__");
    if (totalAmount !== existingTotal) {
        Log.Info(`Update total amount from '${existingTotal}' to '${totalAmount}'`);
        Data.SetValue("TotalAmount__", totalAmount);
        Data.SetValue("TotalAmountWithCurrency__", `${Data.GetValue("TotalAmount__")} ${currency}`);
    }
    Data.SetValue("NbApprovedInvoices__", lineCount - rejectedLinesNumbers.length);
    if (rejectedLinesNumbers.length > 0) {
        currentlyRejectedLines = rejectedLinesNumbers.join(", ");
        if (WorkFlowControl.GetCurrentStepRole() !== roles.requester) {
            const lineOrLines = rejectedLinesNumbers.length === 1 ? "line" : "lines";
            msg = Language.Translate(`{0} ${lineOrLines} rejected: {1}`, false, rejectedLinesNumbers.length, currentlyRejectedLines);
        }
    }
    else {
        msg = "No lines rejected";
    }
    Log.Info(`handleRejectedLines: '${msg}'`);
    Variable.SetValueAsString("RejectedLines", currentlyRejectedLines);
    const existingWorkflowMessage = Variable.GetValueAsString("AdditionalWorkflowMessage");
    if (existingWorkflowMessage && msg === existingWorkflowMessage) {
        msg = "";
    }
    Variable.SetValueAsString("AdditionalWorkflowMessage", msg);
    if (WorkFlowControl.workflowUI && actionDevice === "mobile" && currentlyRejectedLines !== previouslyRejectedLines) {
        Log.Info(`Mobile approval detected and rejected lines (${currentlyRejectedLines}) differ from previously (${previouslyRejectedLines}):\nRebuild workflow`);
        const isRebuildAllowed = WorkFlowControl.workflowUI.RebuildAllowed();
        WorkFlowControl.workflowUI.AllowRebuild(true);
        WorkFlowControl.workflowUI.Rebuild();
        WorkFlowControl.workflowUI.AllowRebuild(isRebuildAllowed);
    }
}
function removeDuplicates() {
    const table = Data.GetTable("LineItems__");
    let itemCount = table.GetItemCount();
    const uniqueLines = [];
    const itemsToDelete = [];
    for (let i = 0; i < itemCount; i++) {
        const item = table.GetItem(i);
        const id = item.GetValue("RuidEx__");
        if (uniqueLines.indexOf(id) < 0) {
            uniqueLines.push(id);
        }
        else if (id !== "") {
            Log.Warn(`Duplicate ruidex '${id}' found and removed`);
            itemsToDelete.push(item);
        }
    }
    itemsToDelete.forEach((item) => item.RemoveItem());
}
//#endregion
//#region Actions
function getActionName() {
    Log.Info(`Data.GetActionName() = ${Data.GetActionName()}, Process.AutoValidatingOnExpiration() = ${Process.AutoValidatingOnExpiration()}`);
    if (!Process.AutoValidatingOnExpiration()) {
        return Data.GetActionName();
    }
    return "onexpiration";
}
function actionSave() {
    if (!Variable.GetValueAsString("SentIntoWorkflow")) {
        setCurrentUserAsRequester();
    }
}
function performWorkflowAction(actionName) {
    if (!WorkFlowControl.workflowUI.IsEnded()) {
        WorkFlowControl.workflowUI.DoAction(actionName);
    }
    else {
        Log.Error(`Cannot run action '${actionName}' as WorkFlowControl.workflowUI is ended`);
    }
}
function logAction(currentName, actionDevice) {
    const currentAction = Data.GetActionType();
    Log.Info(`Action: ${currentAction || "<empty>"}, Name: ${currentName || "<empty>"}, Device: ${actionDevice || "server"}`);
}
function executeRequestedAction(fromServerSide) {
    const currentName = getActionName();
    const actionDevice = Data.GetActionDevice();
    logAction(currentName, actionDevice);
    const isNotRecall = !(currentName && currentName.indexOf("_Recall") >= 0);
    const currentNameCleaned = currentName.replace("_Recall", "").toLowerCase();
    if (isNotRecall) {
        Variable.SetValueAsString("LastComments", newComment);
        setLastValidator();
        setValidityDateTime();
        if (!Data.GetValue("WorkflowInitiatorID__") && WorkFlowControl.GetCurrentStepRole() === roles.requester) {
            setCurrentUserAsRequester();
        }
        Variable.SetValueAsString("NumberOfUpdatedInvoices", 0);
    }
    const approveActionMap = {};
    approveActionMap.approve = { execute: performWorkflowAction, executeOnRecall: true, leaveForm: false, preventApproval: false, handleRejectedLines: true };
    approveActionMap.addapprover = { execute: performWorkflowAction, executeOnRecall: true, leaveForm: false, preventApproval: false, handleRejectedLines: true };
    approveActionMap.backtofirst = { execute: performWorkflowAction, executeOnRecall: true, leaveForm: false, preventApproval: false, handleRejectedLines: true };
    approveActionMap.backtoprevious = { execute: performWorkflowAction, executeOnRecall: true, leaveForm: false, preventApproval: false, handleRejectedLines: true };
    approveActionMap.cancel = { execute: performWorkflowAction, executeOnRecall: false, leaveForm: false, preventApproval: false, handleRejectedLines: false };
    approveActionMap.onexpiration = { execute: performWorkflowAction, executeOnRecall: false, leaveForm: false, preventApproval: false, handleRejectedLines: false };
    approveActionMap.reject = { execute: performWorkflowAction, executeOnRecall: false, leaveForm: false, preventApproval: false, handleRejectedLines: false };
    approveActionMap.save = { execute: actionSave, executeOnRecall: false, leaveForm: true, preventApproval: true, handleRejectedLines: false };
    approveActionMap[""] = { execute: null, executeOnRecall: false, leaveForm: false, preventApproval: false, handleRejectedLines: false };
    const action = approveActionMap[currentNameCleaned] || approveActionMap[""];
    if (isNotRecall && action.handleRejectedLines) {
        handleRejectedLines(currentNameCleaned, actionDevice);
    }
    if (isNotRecall && action.executeOnRecall) {
        Process.RecallScript(`${currentNameCleaned}_Recall`);
    }
    else if (action.execute) {
        action.execute(currentNameCleaned);
    }
    if (action.preventApproval || fromServerSide) {
        Process.PreventApproval();
    }
    if (action.leaveForm) {
        Process.LeaveForm();
    }
    Variable.SetValueAsString("SentIntoWorkflow", "1");
    // Call User Exit to allow customization after validation script end
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRun.Validation.OnValidationScriptEnd");
}
function isAllInvoicesUpdated() {
    return parseInt(Variable.GetValueAsString("IsAllInvoicesUpdated"), 10) === 1;
}
//#endregion
//#region Init
function initAccountLogo() {
    const owner = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerId"));
    if (!Variable.GetValueAsString("AccountLogo") && owner) {
        let logoPath = owner.GetLogoPath();
        logoPath = logoPath ? `<img src="${logoPath}" >` : "";
        Variable.SetValueAsString("AccountLogo", logoPath);
    }
}
function initBatchInvoiceUpdate() {
    Variable.SetValueAsString("ScriptStartExecutionTime", new Date().toString());
}
function init(fromServerSide) {
    Lib.AP.PaymentRun.LineItemIndexing();
    WorkFlowControl.Init(fromServerSide);
    initAccountLogo();
    // Logic only applied to clients with no provider (See Lib.AP.PaymentRun.UpdateInvoicesFromLocal)
    initBatchInvoiceUpdate();
    removeDuplicates();
}
//#endregion
// Main
function runValidation() {
    const fromServerSide = !Data.GetActionType() && Variable.GetValueAsString("InitiatedFromServerSide") === "1";
    init(fromServerSide);
    executeRequestedAction(fromServerSide);
}
runValidation();
//# sourceMappingURL=validationscript.js.map