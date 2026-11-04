"use strict";
// Constants
const g_apParameters = Sys.Parameters.GetInstance("AP");
let g_helpId = 2535;
const g_invoiceAdditionalQueryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("InvoiceStatus__", Lib.AP.InvoiceStatus.ToPay), Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0"), Sys.Helpers.LdapUtil.FilterEqual("State", "100")).toString();
// In SAP mode, we don't restrict the invoices on status "ToPay"
// (Invoices might be flagged as "Paid" already, and the payment run may be used to validate the bank transfer)
// cf RD00032436
const g_invoiceAdditionalQueryFilter_SAP = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0"), Sys.Helpers.LdapUtil.FilterEqual("State", "100")).toString();
const g_invoiceAttributesToRetrieve = [
    "RuidEx", "CompanyCode__", "ERPInvoiceNumber__", "InvoiceNumber__", "VendorNumber__",
    "VendorName__", "InvoiceDate__", "DueDate__", "PostingDate__", "InvoiceAmount__", "NetAmount__",
    "TaxAmount__", "InvoiceCurrency__", "PortalRuidEx__", "VendorContactEmail__", "ExchangeRate__",
    "LocalCurrency__", "LocalInvoiceAmount__", "InvoiceStatus__", "OrderNumber__",
    "DiscountLimitDate__", "EstimatedDiscountAmount__", "LocalEstimatedDiscountAmount__"
];
function getInvoiceAttributesToRetrieve() {
    const additionalAttributes = Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRun.HTMLScripts.GetAdditionalInvoiceAttributesToRetrieve");
    if (!additionalAttributes || !Array.isArray(additionalAttributes)) {
        return g_invoiceAttributesToRetrieve;
    }
    const attributes = g_invoiceAttributesToRetrieve.slice();
    for (const attribute of additionalAttributes) {
        if (attribute && typeof attribute === "string" && attributes.indexOf(attribute) < 0) {
            attributes.push(attribute);
        }
    }
    return attributes;
}
const g_previewAccesses = {
    unclicked: {
        color: "color5",
        font: "fa fa-eye fa-lg",
        text: "_Show preview"
    },
    clicked: {
        color: "color2",
        font: "fa fa-eye-slash fa-lg",
        text: "_Hide preview"
    },
    unavailable: {
        color: "color2",
        font: "fa fa-info-circle fa-lg",
        text: "_Document unavailable on esker"
    }
};
const roles = {
    requester: "requester",
    approver: "approver",
    provider: "provider"
};
const debitCreditIndicator = {
    debit: "S",
    credit: "H"
};
// globals
let g_lineKeys = {};
let g_previewIndex = -1;
let g_workflowController = null;
let g_workflowRebuildTimer = 0;
const g_workflowParams = {
    actions: {
        approve: { image: "AP_WorkflowApproveOrRejectGrey.png" },
        approved: { image: "AP_WorkflowApproval.png" },
        submitted: { image: "AP_WorkflowSubmit.png" },
        refreshstatus: { image: "AP_WorkflowSubmit.png" },
        backtoprevious: { image: "AP_WorkflowBack.png" },
        backtofirst: { image: "workflow_backtofirst.png" },
        reject: { image: "AP_WorkflowReject.png" },
        addapprover: { image: "workflow_forward.png" },
        cancel: { image: "workflow_cancel.png" },
        sentToProvider: { image: "PayR_payment_grey.png" },
        paidByProvider: { image: "PayR_payment.png" },
        providerError: { image: "PayR_payment_error.png" }
    },
    roles: {
        requester: {
            OnBuild: function (callback) {
                Sys.OnDemand.Users.GetUsersFromLogins([Sys.Helpers.String.ExtractLoginFromDN(Data.GetValue("OwnerID") || User.loginId)], ["displayname", "emailaddress"], function (users) {
                    // Build a contributor object with user information
                    const contributors = Sys.Helpers.Array.Map(users, function (user) {
                        return {
                            contributorId: `requester_${user.login}`,
                            role: roles.requester,
                            login: user.login,
                            email: user.exists ? user.emailaddress : user.login,
                            name: user.exists ? user.displayname : user.login,
                            action: "approve"
                        };
                    });
                    // Return contributors
                    callback(contributors);
                });
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
                            "WorkflowType__": "paymentRun",
                            "CostCenterID__": "",
                            "CompanyCode__": Variable.GetValueAsString("CompanyCode"),
                            "WorkflowAmount__": Data.GetValue("TotalNonRejectedAmount__") || 0,
                            "WorkflowCurrency__": Data.GetValue("Currency__"),
                            "RequisitionInitiator__": Data.GetValue("WorkflowInitiatorID__") || User.loginId
                        }
                    },
                    success: function (approvers, ruleApplied) {
                        Log.Info(`Approval Workflow, rule applied: ${ruleApplied}`);
                        const usersToKeep = WorkflowHelper.CurrentIsApprover() ? g_workflowController.GetUsersToKeepOnRoleUpdate(roles.approver) : null;
                        if (usersToKeep) {
                            Log.Info("Merge previous list of approvers with new computed list");
                            Log.Info(`Old\n${JSON.stringify(usersToKeep)}`);
                            Log.Info(`New\n${JSON.stringify(approvers)}`);
                            approvers = g_workflowController.MergeRecomputedActiveRole(usersToKeep, approvers);
                        }
                        // Keep only the login
                        const approversLogin = Sys.Helpers.Array.Map(approvers, function (v) {
                            return v.login;
                        });
                        Sys.OnDemand.Users.GetUsersFromLogins(approversLogin, ["displayname", "emailaddress"], function (users) {
                            // Build a contributor object with user information
                            const contributors = Sys.Helpers.Array.Map(users, function (user) {
                                return {
                                    contributorId: `approver_${user.login}`,
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
                        g_workflowParams.callbacks.OnError(errorMessage);
                        callback([]);
                    }
                };
                // Get a list of approvers from the workflow rule
                Sys.WorkflowEngine.GetStepsResult(getStepsOptions);
                return true;
            }
        },
        provider: {
            OnBuild: function (callback) {
                const providerName = g_apParameters.GetParameter("PaymentProvider", "");
                if (providerName) {
                    // Build a contributor object with provider information
                    const contributors = [{
                            contributorId: g_workflowController.CreateUniqueContributorId("paymentProvider"),
                            role: roles.provider,
                            login: "",
                            email: "",
                            name: Language.Translate(providerName, false),
                            action: "sentToProvider"
                        }];
                    // Return contributors
                    callback(contributors);
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
            User__: { data: "name" },
            Role__: { data: "role", translate: true },
            Date__: { data: "date" },
            Action__: { data: "action" },
            Comment__: { data: "comment" },
            IsGroup__: { data: "isGroup" },
            ID__: { data: "login" },
            Email__: { data: "email" },
            Approved__: { data: "approved" }, // For mobile apps compatibility
            ActualApproverLogin__: { data: "actualApproverLogin" }
        },
        OnRefreshRow: function (index) {
            const table = Controls[g_workflowParams.mappingTable.tableName];
            const row = table.GetRow(index);
            // Sets the image.
            row.Role__.SetImageURL(g_workflowParams.actions[row.Action__.GetValue()].image, false);
            // Highlights the row and adds a cursor in the first column if the process is not in a final state.
            if (ProcessInstance.state < 100) {
                if (g_workflowController.IsCurrentContributorAt(row)) {
                    row.AddStyle("highlight");
                    row.Marker__.SetImageURL("arrow.png", false);
                }
                else {
                    row.RemoveStyle("highlight");
                    row.Marker__.SetImageURL();
                }
            }
        }
    },
    delayedData: {
        isGroup: {
            type: "isGroupInfo",
            key: "login"
        }
    },
    callbacks: {
        OnError: function (msg) {
            Log.Info(msg);
        },
        OnBuilding: function () {
            LayoutHelper.DisableButtons(true, "OnBuilding");
            Controls.ComputingWorkflow__.Hide(false);
        },
        OnBuilt: function () {
            LayoutHelper.DisableButtons(false, "OnBuilt");
            const allContributorsValid = g_workflowController.ValidateContributors();
            if (!allContributorsValid) {
                Controls.Approve.SetDisabled(true);
                Controls.AddApprover.SetDisabled(true);
            }
            LayoutHelper.UpdateWorkflowLayout();
            Controls.ComputingWorkflow__.Hide(true);
            Controls.ApprovalWorkflow.Wait(false);
            ProcessInstance.SetSilentChange(false);
        },
        OnValidateContributor: function (contributor, doneCallback) {
            Lib.P2P.CompleteUsersInformations([contributor], ["displayname"], function (users) {
                if (users && users.length > 0) {
                    const localContributor = WorkflowHelper.GetContributor(contributor.login);
                    if (localContributor) {
                        localContributor.exists = users[0].exists;
                    }
                }
                doneCallback(WorkflowHelper.ValidateUserExistence(users[0], contributor));
            });
        }
    }
};
var ButtonsBehavior;
(function (ButtonsBehavior) {
    //#region helpers
    function addApprover() {
        let selectedUser;
        const dialogTexts = {
            title: "_Add approver",
            role: "_Forward to new approver",
            description: "_Add approver description",
            description_size: 475,
            confirmation: "_Add approver confirm message",
            confirmation_size: 475,
            browseTitle: "_Approver Information"
        };
        const fillInsertApproverDialog = function (dialog) {
            dialog.Hold(true);
            const descCtrl = dialog.AddDescription("desc", null, dialogTexts.description_size);
            descCtrl.SetText(dialogTexts.description);
            const fieldData = {
                TableName: "ODUSER",
                SortOrder: "ASC",
                SavedColumn: "DisplayName",
                Customfilter: `(&(|(AccountLocked=0)(!(AccountLocked=*)))(|(Locked=0)(!(Locked=*)))(|(TechnicalUser=0)(!(TechnicalUser=*)))(Customer=0)(Vendor=0)(|(PortalUser!=1)(PortalUser!=*))(!(Login=${User.loginId})))`,
                DisplayedColumns: "DisplayName|Login|EmailAddress",
                BrowseTitle: dialogTexts.browseTitle
            };
            const approverCtrl = dialog.AddDatabaseComboBox(roles.approver, dialogTexts.role, 400, fieldData);
            approverCtrl.SetAllowTableValuesOnly(true);
            approverCtrl.SetAutocompletable(true);
            approverCtrl.SetMaxRecords(100);
            approverCtrl.SetPrefillResult(true);
            approverCtrl.SetBrowsable(true);
            approverCtrl.SetImageColumn("DisplayName", {
                IsGroup: [{ value: "1", imageUrl: getUserImage(true) }],
                defaultImageUrl: getUserImage(false)
            }, 18);
            dialog.RequireControl(approverCtrl);
            const commentCtrl = dialog.AddMultilineText("comment", "_Comment", 400);
            dialog.RequireControl(commentCtrl);
            commentCtrl.SetPlaceholder(g_CommentPlaceHolder);
            commentCtrl.SetValue(Data.GetValue("Comments__"));
            const confCtrl = dialog.AddDescription("conf", null, dialogTexts.confirmation_size);
            if (selectedUser) {
                approverCtrl.SetValue(selectedUser.displayName);
                confCtrl.SetText(dialogTexts.confirmation, selectedUser.displayName);
            }
            else {
                dialog.HideControl(confCtrl);
            }
            dialog.Hold(false);
        };
        const handleInsertApproverDialog = function (dialog, tabId, event, control, item) {
            if (event === "OnSelectItem" && control && control.GetName() === roles.approver && item) {
                selectedUser =
                    {
                        login: item.GetValue("login"),
                        displayName: item.GetValue("displayName"),
                        emailAddress: item.GetValue("emailAddress")
                    };
                const confCtrl = dialog.GetControl("conf");
                confCtrl.SetText(dialogTexts.confirmation, selectedUser.displayName);
                dialog.HideControl(confCtrl, false);
            }
        };
        const commitInsertApproverDialog = function (dialog) {
            if (selectedUser) {
                Variable.SetValueAsString("ForwardApproverLogin", selectedUser.login);
                Variable.SetValueAsString("ForwardApproverName", selectedUser.displayName);
                Variable.SetValueAsString("ForwardApproverEmail", selectedUser.emailAddress);
                Data.SetValue("Comments__", dialog.GetControl("comment").GetValue());
                ProcessInstance.ApproveAsynchronous("AddApprover");
            }
        };
        Popup.Dialog(dialogTexts.title, null, fillInsertApproverDialog, commitInsertApproverDialog, null, handleInsertApproverDialog);
    }
    function addComment(popupTitle, actionName) {
        let popupConfig = {
            title: popupTitle,
            currentComment: getReliableComment(),
            onClickOk: function (result) {
                Controls.Comments__.SetValue(result.comment ? result.comment : "");
                const fieldMapping = {
                    Comments__: result.comment
                };
                approve(actionName, fieldMapping);
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRun.HTMLScripts.CustomizePopupCommentConfig", popupConfig) || popupConfig;
        Lib.CommonDialog.PopupComment(popupConfig);
    }
    function approve(actionName, fieldMapping) {
        let nbExcludedInvoices = 0;
        const invoices = Data.GetTable("LineItems__");
        for (let i = 0; i < invoices.GetItemCount(); ++i) {
            if (invoices.GetItem(i).GetValue("Rejected__")) {
                nbExcludedInvoices += 1;
            }
        }
        const nbInvoices = Data.GetValue("NbInvoices__");
        Data.SetValue("NbApprovedInvoices__", nbInvoices - nbExcludedInvoices);
        if (Data.GetValue("state") !== 90) {
            ProcessInstance.ApproveAsynchronous(actionName);
        }
        else {
            ProcessInstance.ResumeWithActionAsynchronous(actionName, fieldMapping);
        }
    }
    ButtonsBehavior.approve = approve;
    function backToFirst(popupTitle, reasonLabel, actionName) {
        let popupConfig = {
            title: popupTitle,
            reasonListLabel: reasonLabel,
            possibleValues: Controls.BackToFirstReason__.GetText(),
            currentReason: Controls.BackToFirstReason__.GetValue(),
            currentComment: getReliableComment(),
            onClickOk: function (result) {
                Controls.BackToFirstReason__.SetValue(result.reason);
                Controls.Comments__.SetValue(result.comment ? result.comment : "");
                const fieldMapping = {
                    Comments__: result.comment,
                    BackToFirstReason__: result.reason
                };
                approve(actionName, fieldMapping);
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRun.HTMLScripts.CustomizePopupCommentConfig", popupConfig) || popupConfig;
        Lib.CommonDialog.PopupReason(popupConfig);
    }
    function reject(popupTitle, reasonLabel, actionName) {
        let popupConfig = {
            title: popupTitle,
            reasonListLabel: reasonLabel,
            possibleValues: Controls.RejectionReason__.GetText(),
            currentReason: Controls.RejectionReason__.GetValue(),
            currentComment: getReliableComment(),
            onClickOk: function (result) {
                Variable.SetValueAsString("LastPaymentProviderError", "");
                // Before rejecting the whole payment run, set the individual rejections of the invoices to false
                const invoices = Data.GetTable("LineItems__");
                for (let i = 0; i < invoices.GetItemCount(); ++i) {
                    const invoice = invoices.GetItem(i);
                    invoice.SetValue("Rejected__", false);
                }
                Controls.RejectionReason__.SetValue(result.reason);
                Controls.Comments__.SetValue(result.comment ? result.comment : "");
                const fieldMapping = {
                    Comments__: result.comment,
                    RejectionReason__: result.reason
                };
                approve(actionName, fieldMapping);
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRun.HTMLScripts.CustomizePopupCommentConfig", popupConfig) || popupConfig;
        Lib.CommonDialog.PopupReason(popupConfig);
    }
    //#endregion
    //#region actions
    function onClickAddApprover() {
        if (g_workflowController.GetContributorIndex() > 0) {
            addApprover();
        }
        return false;
    }
    function onClickApprove() {
        ConfigurationHelper.ValidateAllConfigurations()
            .Then(function (valid) {
            if (valid) {
                ProcessInstance.ApproveAsynchronous("Approve");
            }
        });
        return false;
    }
    function onClickBackToFirst() {
        backToFirst("_Back to first title", "_Select back to first reason", "BackToFirst");
        return false;
    }
    function onClickBackToPrevious() {
        addComment("_Back to previous comment required", "BackToPrevious");
        return false;
    }
    function onClickCancelDocument() {
        addComment("_Cancel confirmation comment required", "Cancel");
        return false;
    }
    function onClickReject() {
        reject("_Reject title", "_Select reject reason", "Reject");
        return false;
    }
    function onClickResetPreview() {
        hideExternalDocument();
        return false;
    }
    function onClickRunSearch() {
        if (isSAP()) {
            SAPBrowseHelper.ShowDialog();
        }
        else {
            Controls.DocumentSearch__.DoBrowse();
        }
        return false;
    }
    function onClickSave() {
        ProcessInstance.Save("save");
        return false;
    }
    //#endregion
    function Init() {
        Controls.AddApprover.OnClick = onClickAddApprover;
        Controls.Approve.OnClick = onClickApprove;
        Controls.BackToFirst.OnClick = onClickBackToFirst;
        Controls.BackToPrevious.OnClick = onClickBackToPrevious;
        Controls.CancelDocument.OnClick = onClickCancelDocument;
        Controls.Reject.OnClick = onClickReject;
        Controls.ResetPreview__.OnClick = onClickResetPreview;
        Controls.RunSearch__.OnClick = onClickRunSearch;
        Controls.Save.OnClick = onClickSave;
    }
    ButtonsBehavior.Init = Init;
})(ButtonsBehavior || (ButtonsBehavior = {}));
var GroupLinesHelper;
(function (GroupLinesHelper) {
    const groupedColumns = ["CompanyCode__", "VendorNumber__", "VendorName__", "VendorContactEmail__", "InvoiceCurrency__", "InvoiceAmount__", "EstimatedDiscountAmount__", "DiscountLimitDate__"];
    GroupLinesHelper.GroupedColumnsKeys = ["CompanyCode__", "VendorNumber__"];
    function GroupLines() {
        const groupedLines = {};
        const lineItems = Data.GetTable("LineItems__");
        const lineCount = lineItems.GetItemCount();
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        for (let i = 0; i < lineCount; i++) {
            const item = lineItems.GetItem(i);
            if (item && !item.GetValue("Rejected__")) {
                // Compute the line key
                const key = getLineKey(GroupLinesHelper.GroupedColumnsKeys, null, item);
                if (groupedLines[key]) {
                    // The grouped column already exists, just sum-up
                    groupedLines[key].InvoiceAmount__ += item.GetValue("InvoiceAmount__");
                    if (item.GetValue("DiscountLimitDate__") >= currentDate) {
                        groupedLines[key].EstimatedDiscountAmount__ += item.GetValue("EstimatedDiscountAmount__");
                    }
                    groupedLines[key].InvoiceCount__++;
                }
                else {
                    // initialize the grouped column
                    groupedLines[key] = {
                        InvoiceCount__: 1,
                        InvoiceAmount__: 0,
                        EstimatedDiscountAmount__: 0
                    };
                    for (const groupedColumn of groupedColumns) {
                        if ("EstimatedDiscountAmount__" !== groupedColumn || item.GetValue("DiscountLimitDate__") >= currentDate) {
                            groupedLines[key][groupedColumn] = item.GetValue(groupedColumn);
                        }
                    }
                }
            }
        }
        let lineNumber = 0;
        const groupedLineItems = Data.GetTable("GroupedLineItems__");
        groupedLineItems.SetItemCount(0);
        for (const groupedLinesKey of Object.keys(groupedLines)) {
            const newItem = groupedLineItems.AddItem(false);
            newItem.SetValue("LineNumber__", ++lineNumber);
            newItem.SetValue("InvoiceCount__", groupedLines[groupedLinesKey].InvoiceCount__);
            newItem.SetValue("EstimatedDiscountAmount__", groupedLines[groupedLinesKey].EstimatedDiscountAmount__);
            for (const groupedColumn of groupedColumns) {
                newItem.SetValue(groupedColumn, groupedLines[groupedLinesKey][groupedColumn]);
            }
        }
        Controls.NoGroupedItems__.Hide(lineNumber > 0);
    }
    GroupLinesHelper.GroupLines = GroupLines;
})(GroupLinesHelper || (GroupLinesHelper = {}));
var ConfigurationHelper;
(function (ConfigurationHelper) {
    let g_cachedCompanyCodes = null;
    function initCompanyCodeConfigurationCache() {
        if (g_cachedCompanyCodes) {
            return Sys.Helpers.Promise.Resolve(g_cachedCompanyCodes);
        }
        else {
            return Sys.GenericAPI.PromisedQuery({
                table: "PurchasingCompanycodes__",
                filter: "",
                attributes: ["CompanyCode__", "DefaultConfiguration__"],
                sortOrder: null,
                maxRecords: "no_limit"
            }).Then(function (results) {
                g_cachedCompanyCodes = results;
                return g_cachedCompanyCodes;
            });
        }
    }
    function getCompanyCodeConfiguration(companyCode) {
        return initCompanyCodeConfigurationCache().Then(function (companyCache) {
            let configuration = null;
            if (companyCache && companyCache.length > 0) {
                configuration = companyCache.find(function (item) {
                    return item.CompanyCode__ === companyCode;
                });
            }
            return configuration ? configuration.DefaultConfiguration__ : "";
        });
    }
    function isSingleConfigurationInUse() {
        return Sys.Helpers.Promise.Create(function (resolve) {
            let configuration = null;
            let isSingleConfiguration = true;
            const companyCodes = [];
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                if (item && item.GetValue("CompanyCode__")) {
                    if (companyCodes.indexOf(item.GetValue("CompanyCode__")) < 0) {
                        companyCodes.push(item.GetValue("CompanyCode__"));
                    }
                }
            });
            if (companyCodes.length > 1) {
                companyCodes.reduce((p, cc) => {
                    return p
                        .Then(function () {
                        return getCompanyCodeConfiguration(cc);
                    })
                        .Then(function (companyConfig) {
                        if (configuration === null) {
                            configuration = companyConfig;
                        }
                        else if (configuration !== companyConfig) {
                            isSingleConfiguration = false;
                        }
                    });
                }, Sys.Helpers.Promise.Resolve())
                    .Then(() => resolve(isSingleConfiguration));
            }
            else {
                // All invoices are on the same company code (so using the same configuration)
                resolve(true);
            }
        });
    }
    function updateConfigurationForCompany(companyCode) {
        return Sys.Helpers.Promise.Create(function (resolve) {
            getCompanyCodeConfiguration(companyCode)
                .Then(function (configuration) {
                Log.Info(`Configuration for '${companyCode}': '${configuration}'. Current configuration: '${Variable.GetValueAsString("Configuration")}'`);
                if (configuration !== Variable.GetValueAsString("Configuration")) {
                    Log.Info("Force reload configuration");
                    Variable.SetValueAsString("Configuration", configuration);
                    g_apParameters.Reload(configuration);
                    g_apParameters.IsReady(function () {
                        Log.Info("Config reloaded & IsReady");
                        resolve();
                    });
                }
                else {
                    Log.Info("Do not force reload configuration, configuration is already up-to-date.");
                    resolve();
                }
            });
        });
    }
    ConfigurationHelper.updateConfigurationForCompany = updateConfigurationForCompany;
    function ValidateAllConfigurations() {
        if (LayoutHelper.IsFormReadOnly()) {
            return Sys.Helpers.Promise.Resolve(true);
        }
        return isSingleConfigurationInUse()
            .Then(function (isSingleConfiguration) {
            if (!isSingleConfiguration) {
                Popup.Alert("_Multiple configurations not supported content", false, null, "_Multiple configurations not supported title");
            }
            return isSingleConfiguration;
        });
    }
    ConfigurationHelper.ValidateAllConfigurations = ValidateAllConfigurations;
    function OnItemDeleted() {
        // Nothing to do if the line items are empty, when a line item is populated then the configuration can be updated.
        if (Data.GetTable("LineItems__").GetItemCount() < 1 || !Data.GetTable("LineItems__").GetItem(0).GetValue("CompanyCode__")) {
            return Sys.Helpers.Promise.Resolve();
        }
        // Don't bother updating configuration until all lines share the same configuration
        LayoutHelper.DisableButtons(true, "UpdateConfiguration_ItemDeleted");
        return isSingleConfigurationInUse()
            .Then(function (isSingleConfiguration) {
            if (isSingleConfiguration) {
                const companyCode = Data.GetTable("LineItems__").GetItem(0).GetValue("CompanyCode__");
                return ConfigurationHelper.updateConfigurationForCompany(companyCode);
            }
            return Sys.Helpers.Promise.Resolve();
        })
            .Finally(function () {
            LayoutHelper.DisableButtons(false, "UpdateConfiguration_ItemDeleted");
        });
    }
    ConfigurationHelper.OnItemDeleted = OnItemDeleted;
})(ConfigurationHelper || (ConfigurationHelper = {}));
var InvoiceLoadingHelper;
(function (InvoiceLoadingHelper) {
    InvoiceLoadingHelper.MaxInvoiceCount = 500;
    InvoiceLoadingHelper.InvoiceKeysColumns = ["CompanyCode__", "VendorNumber__", "InvoiceNumber__", "ERPInvoiceNumber__"];
    function addInvoiceFromBrowse(selectedItem) {
        const newItem = Data.GetTable("LineItems__").AddItem(false);
        if (!newItem) {
            Controls.DocumentSearch__.Wait(false);
            return Sys.Helpers.Promise.Resolve();
        }
        const invoiceFilters = [];
        const missingAttributes = [];
        for (const column of getInvoiceAttributesToRetrieve()) {
            const value = selectedItem.GetValue(column) || "";
            if (value) {
                newItem.SetValue(column, value);
                if (InvoiceLoadingHelper.InvoiceKeysColumns.indexOf(column) >= 0) {
                    invoiceFilters.push(Sys.Helpers.LdapUtil.FilterEqual(column, value));
                }
            }
            else {
                missingAttributes.push(column);
            }
        }
        if (invoiceFilters.length <= 0) {
            Log.Error("Cannot create filter to query invoice data");
            Controls.DocumentSearch__.Wait(false);
            return Sys.Helpers.Promise.Resolve();
        }
        const filter = Sys.Helpers.LdapUtil.FilterAnd(...invoiceFilters).toString();
        return QueryInvoices(filter, missingAttributes, 1)
            .Then(function (results) {
            if (!results || !results.length) {
                Log.Error(`addInvoiceFromBrowse - Invoice not found with filter ${filter}`);
            }
            else {
                fillNewItem(newItem, results[0], missingAttributes);
            }
        })
            .Then(ConfigurationHelper.ValidateAllConfigurations)
            .Then(function (valid) {
            if (valid) {
                // Load configuration from first invoice in the line items table
                LayoutHelper.DisableButtons(true, "UpdateConfiguration_ItemAdded");
                const companyCode = Data.GetTable("LineItems__").GetItem(0).GetValue("CompanyCode__");
                return ConfigurationHelper.updateConfigurationForCompany(companyCode)
                    .Finally(function () {
                    LayoutHelper.DisableButtons(false, "UpdateConfiguration_ItemAdded");
                });
            }
            return Sys.Helpers.Promise.Resolve();
        })
            .Catch(function (error) {
            Popup.Alert(error, true, null, "_Error");
            Log.Error(`addInvoiceFromBrowse - Error when retrieving invoice: ${error}`);
        })
            .Finally(function () {
            onRefreshTable();
            // Controls.DocumentSearch__.Wait(false) is done in this function
            delayRebuildWorkflow();
        });
    }
    function buildInvoicesLDAPFilter(ruidExList, exclude) {
        const msnFilters = [];
        for (const ruidex of ruidExList) {
            msnFilters.push(Sys.Helpers.LdapUtil.FilterEqual("MsnEx", ruidex.split(".")[1]));
        }
        let msnFilter = Sys.Helpers.LdapUtil.FilterOr(...msnFilters).toString();
        if (exclude) {
            msnFilter = Sys.Helpers.LdapUtil.FilterNot(msnFilter).toString();
        }
        return Sys.Helpers.LdapUtil.FilterAnd(msnFilter, g_invoiceAdditionalQueryFilter).toString();
    }
    function QueryInvoices(invoicesFilter, attributes, maxRecords) {
        const invoiceFilter = Sys.Helpers.LdapUtil.FilterAnd(invoicesFilter, isSAP() ? g_invoiceAdditionalQueryFilter_SAP : g_invoiceAdditionalQueryFilter).toString();
        // Retrieve missing invoice attributes via an additional query
        return Sys.GenericAPI.PromisedQuery({
            table: "CDNAME#Vendor invoice",
            filter: invoiceFilter,
            attributes: attributes,
            maxRecords: maxRecords,
            additionalOptions: {
                useConstantQueryCache: true,
                searchInArchive: false
            }
        });
    }
    InvoiceLoadingHelper.QueryInvoices = QueryInvoices;
    function isInvoiceAlreadyAdded(item) {
        const lineKey = getLineKey(InvoiceLoadingHelper.InvoiceKeysColumns, null, item);
        const existingLineKeys = Sys.Helpers.Object.Values(g_lineKeys);
        return existingLineKeys.indexOf(lineKey) >= 0;
    }
    function fillNewItem(item, fields, columns) {
        for (const column of columns) {
            let formColumn = column;
            if (formColumn.indexOf("__") < 0) {
                formColumn += "__";
            }
            item.SetValue(formColumn, fields[column]);
        }
        item.SetValue("Rejected__", false);
    }
    InvoiceLoadingHelper.fillNewItem = fillNewItem;
    function Load(ruidExList) {
        if (!ruidExList || ruidExList.length <= 0) {
            return Sys.Helpers.Promise.Resolve();
        }
        const invoiceFilters = [];
        for (const ruidex of ruidExList) {
            if (ruidex) {
                invoiceFilters.push(Sys.Helpers.LdapUtil.FilterEqual("RuidEx", ruidex));
            }
        }
        const filter = Sys.Helpers.LdapUtil.FilterOr(...invoiceFilters).toString();
        const attrs = getInvoiceAttributesToRetrieve();
        return QueryInvoices(filter, attrs, "NO_LIMIT")
            .Then(function (results) {
            const companyCodes = [];
            if (!results || !results.length) {
                Log.Error(`addInvoice - Invoice not found with filter ${filter}`);
            }
            else {
                for (const result of results) {
                    companyCodes.push(result.CompanyCode__);
                    const newItem = Data.GetTable("LineItems__").AddItem(false);
                    if (newItem) {
                        fillNewItem(newItem, result, attrs);
                    }
                }
            }
            return companyCodes;
        })
            .Then(function (companyCodes) {
            if (companyCodes && companyCodes.length > 0) {
                // Load configuration from first invoice
                return ConfigurationHelper.updateConfigurationForCompany(companyCodes[0]);
            }
        })
            .Catch(function (error) {
            Log.Error(`addInvoice - Error when retrieving invoice: ${error}`);
        })
            .Finally(function () {
            delayRebuildWorkflow();
        });
    }
    InvoiceLoadingHelper.Load = Load;
    function OnSelectInvoicesBrowseItem(item) {
        let toWait = Sys.Helpers.Promise.Resolve();
        let snackMessage, snackStatus;
        if (Controls.LineItems__.GetItemCount() >= InvoiceLoadingHelper.MaxInvoiceCount) {
            snackMessage = Language.Translate("_Max nb of documents reached", false, "1", InvoiceLoadingHelper.MaxInvoiceCount);
            snackStatus = "warning";
        }
        else if (isInvoiceAlreadyAdded(item)) {
            snackMessage = Language.Translate("_Invoice already added", false);
            snackStatus = "warning";
        }
        else {
            Controls.DocumentSearch__.Wait(true);
            Controls.NoItems__.Hide(true);
            toWait = addInvoiceFromBrowse(item);
            snackStatus = "success";
            snackMessage = Language.Translate("_1 invoice added");
        }
        if (snackMessage) {
            Popup.Snackbar({ message: snackMessage, status: snackStatus });
        }
        return toWait;
    }
    InvoiceLoadingHelper.OnSelectInvoicesBrowseItem = OnSelectInvoicesBrowseItem;
    function SetupBrowse() {
        // get Ruidex list
        const filter = buildInvoicesLDAPFilter(Object.keys(g_lineKeys), true);
        Controls.DocumentSearch__.SetFilter(filter);
    }
    InvoiceLoadingHelper.SetupBrowse = SetupBrowse;
})(InvoiceLoadingHelper || (InvoiceLoadingHelper = {}));
var SAPBrowseHelper;
(function (SAPBrowseHelper) {
    const sapConfig = {
        table: "REGUP",
        attributes: "BUKRS|BELNR|GJAHR|XBLNR|WAERS|LIFNR|BLDAT|BUDAT|WRBTR|DMBTR|WMWST|MWSTS|SHKZG",
        sapAttributesMapping: {
            "BUKRS": { fieldName: "CompanyCode__" },
            "LIFNR": { fieldName: "VendorNumber__", converter: Sys.Helpers.String.SAP.TrimLeadingZeroFromID },
            "BLDAT": { fieldName: "InvoiceDate__", converter: Sys.Helpers.SAP.FormatFromSAPDateTimeFormat },
            "BUDAT": { fieldName: "PostingDate__", converter: Sys.Helpers.SAP.FormatFromSAPDateTimeFormat },
            "WRBTR": { fieldName: "InvoiceAmount__" },
            "DMBTR": { fieldName: "LocalInvoiceAmount__" },
            "WMWST": { fieldName: "TaxAmount__" },
            "MWSTS": { fieldName: "LocalTaxAmount__" },
            "WAERS": { fieldName: "InvoiceCurrency__" },
            "XBLNR": { fieldName: "InvoiceNumber__" },
            "SHKZG": { fieldName: "DebitCreditIndicator__" }
        }
    };
    let SAPBatchIdentifier, SAPBatchDate;
    function loadPaymentRunItemsFromSap(callback, batchIdentifier, batchDate) {
        SAPBatchIdentifier = batchIdentifier;
        SAPBatchDate = batchDate;
        Query.SAPQuery(callback, Variable.GetValueAsString("SAPConfiguration"), sapConfig.table, sapConfig.attributes, buildSAPFilter(batchIdentifier, batchDate), 200);
    }
    function buildSAPFilter(batchIdentifier, batchDate) {
        let filter = `LAUFI = '${batchIdentifier}' AND XVORL = 'X' AND VBLNR <> ''`;
        if (batchDate) {
            filter += ` AND LAUFD = '${Sys.Helpers.SAP.FormatToSAPDateTimeFormat(batchDate)}'`;
        }
        return filter;
    }
    function SAPQueryCallBack() {
        const err = this.GetQueryError();
        if (err) {
            Log.Error(`error: ${err}`);
            Controls.LineItems__.Wait(false);
            Popup.Alert("_SAP Load payment run failed", true, null, "_Error");
            return;
        }
        const itemCountFromSAP = this.GetRecordsCount();
        Log.Info(`SAPQuery returned ${itemCountFromSAP} Payment run Items`);
        if (itemCountFromSAP === 0) {
            Controls.LineItems__.Wait(false);
            Popup.Alert("_SAP Load payment run returned no result", true, null, "_Error");
            return;
        }
        const invoiceFilters = [];
        const sapDocuments = [];
        for (let i = 0; i < itemCountFromSAP; i++) {
            const companyCode = this.GetQueryValue("BUKRS", i);
            const docNumber = this.GetQueryValue("BELNR", i);
            const fiscalYear = this.GetQueryValue("GJAHR", i);
            const erpInvoiceNumber = Lib.AP.FormatInvoiceDocumentNumber(docNumber, fiscalYear, companyCode);
            const invoiceFilter = Sys.Helpers.LdapUtil.FilterEqual("ERPInvoiceNumber__", erpInvoiceNumber);
            const sapDocument = {};
            sapDocument.ERPInvoiceNumber__ = erpInvoiceNumber;
            for (const sapAttribute in sapConfig.sapAttributesMapping) {
                if (Object.prototype.hasOwnProperty.call(sapConfig.sapAttributesMapping, sapAttribute)) {
                    const value = this.GetQueryValue(sapAttribute, i);
                    const mapping = sapConfig.sapAttributesMapping[sapAttribute];
                    sapDocument[mapping.fieldName] = mapping.converter ? mapping.converter(value) : value;
                }
            }
            // Check the invoice type to associate a negative amount
            if (isSAPDebit(sapDocument)) {
                sapDocument.InvoiceAmount__ = `-${sapDocument.InvoiceAmount__}`;
                sapDocument.LocalInvoiceAmount__ = `-${sapDocument.LocalInvoiceAmount__}`;
                sapDocument.TaxAmount__ = `-${sapDocument.TaxAmount__}`;
                sapDocument.LocalTaxAmount__ = `-${sapDocument.LocalTaxAmount__}`;
            }
            invoiceFilters.push(invoiceFilter);
            sapDocuments.push(sapDocument);
        }
        loadInvoices(invoiceFilters, sapDocuments);
    }
    function isSAPDebit(sapDocument) {
        if (sapDocument.DebitCreditIndicator__) {
            return sapDocument.DebitCreditIndicator__ === debitCreditIndicator.debit;
        }
        return false;
    }
    function loadInvoices(invoiceFilters, sapDocuments) {
        const filter = Sys.Helpers.LdapUtil.FilterOr(...invoiceFilters).toString();
        InvoiceLoadingHelper.QueryInvoices(filter, getInvoiceAttributesToRetrieve(), "NO_LIMIT")
            .Then(function (eskerDocuments) {
            if (!eskerDocuments || !eskerDocuments.length || eskerDocuments.length !== sapDocuments.length) {
                Log.Info(`Found ${eskerDocuments ? eskerDocuments.length : 0} invoices from Esker with filter ${filter}`);
            }
            if (eskerDocuments.length === 0) {
                // retrieve local currency from SAP, based on first SAP document
                Sys.Helpers.SAP.GetCompanyCodeCurrency((currency) => {
                    fillLineItemsWithDocumentsInfos(sapDocuments, eskerDocuments, currency);
                }, Variable.GetValueAsString("SAPConfiguration"), sapDocuments[0].CompanyCode__);
            }
            else {
                fillLineItemsWithDocumentsInfos(sapDocuments, eskerDocuments, eskerDocuments[0].LocalCurrency__);
            }
        })
            .Catch(function (error) {
            Log.Error(`addInvoice - Error when retrieving invoice: ${error}`);
        });
    }
    function getLineItemFields(matchingEskerDocument, sapDocument, eskerDocuments, defaultLocalCurrency) {
        var _a;
        const lineFields = sapDocument;
        if (matchingEskerDocument) {
            for (const field in matchingEskerDocument) {
                if (matchingEskerDocument[field] && !lineFields[field]) {
                    lineFields[field] = matchingEskerDocument[field];
                }
            }
        }
        else {
            // No matching document found on Esker side
            // Try to resolve vendor name by searching it in other esker documents
            lineFields.VendorName__ = (_a = eskerDocuments.find(eskDoc => eskDoc.VendorNumber__ === sapDocument.VendorNumber__)) === null || _a === void 0 ? void 0 : _a.VendorName__;
            lineFields.LocalCurrency__ = defaultLocalCurrency;
        }
        return lineFields;
    }
    function fillLineItemsWithDocumentsInfos(sapDocuments, eskerDocuments, defaultLocalCurrency) {
        Data.GetTable("LineItems__").SetItemCount(0);
        Controls.PaymentRunId__.SetValue(SAPBatchIdentifier);
        Controls.PaymentRunDate__.SetValue(SAPBatchDate);
        Controls.PaymentRunDateDisplay__.SetValue(Controls.PaymentRunDate__.GetValue().toLocaleDateString());
        const attrs = getInvoiceAttributesToRetrieve();
        for (const sapDocument of sapDocuments) {
            const newItem = Data.GetTable("LineItems__").AddItem(false);
            if (newItem) {
                const matchingEskerDocument = eskerDocuments.find(eskerDocument => eskerDocument.ERPInvoiceNumber__ === sapDocument.ERPInvoiceNumber__);
                const lineFields = getLineItemFields(matchingEskerDocument, sapDocument, eskerDocuments, defaultLocalCurrency);
                InvoiceLoadingHelper.fillNewItem(newItem, lineFields, attrs);
            }
        }
        onRefreshTable();
        delayRebuildWorkflow();
        Controls.LineItems__.Wait(false);
    }
    function fillDialog(dialog) {
        const ctrlDesc = dialog.AddDescription("ctrlDesc");
        ctrlDesc.SetText("_SAP Load payment run dialog description");
        dialog.AddSeparator();
        const ctrlIdentifier = dialog.AddText("ctrlIdentifier", "_SAP Batch Identifier");
        const ctrlDate = dialog.AddDate("ctrlDate", "_SAP Batch Date");
        ctrlIdentifier.SetWidth(150);
        ctrlDate.SetWidth(150);
        dialog.RequireControl(ctrlIdentifier);
        dialog.RequireControl(ctrlDate);
    }
    function commitDialog(dialog) {
        Controls.LineItems__.Wait(true);
        loadPaymentRunItemsFromSap(SAPQueryCallBack, dialog.GetControl("ctrlIdentifier").GetValue(), dialog.GetControl("ctrlDate").GetValue());
    }
    function ShowDialog() {
        Popup.Dialog("_SAP Load payment run dialog title", Controls.RunSearch__, fillDialog, commitDialog, null, null, null, null);
    }
    SAPBrowseHelper.ShowDialog = ShowDialog;
})(SAPBrowseHelper || (SAPBrowseHelper = {}));
var LayoutHelper;
(function (LayoutHelper) {
    let TopMessageWarning;
    (function (TopMessageWarning) {
        let messages = [];
        function Add(msg) {
            messages.push(msg);
            TopMessageWarning.Display();
        }
        TopMessageWarning.Add = Add;
        function Clear() {
            messages = [];
            TopMessageWarning.Display();
        }
        TopMessageWarning.Clear = Clear;
        function Display() {
            if (messages.length) {
                Controls.TopMessageWarning__.SetLabel(messages.join("\n"));
                Controls.TopPaneWarning.Hide(false);
            }
            else {
                Controls.TopMessageWarning__.SetLabel("");
                Controls.TopPaneWarning.Hide(true);
            }
        }
        TopMessageWarning.Display = Display;
    })(TopMessageWarning = LayoutHelper.TopMessageWarning || (LayoutHelper.TopMessageWarning = {}));
    /**
     * The default layout that created by AdjustLayoutToWorkflowStep() and modified by
     * HandleButtonDisplay().
     * @see AdjustLayoutToWorkflowStep
     * @see HandleButtonDisplay
     */
    const settings = {
        requester: {
            hidden: [
                "CancelDocument", "BackToFirst", "BackToPrevious", "AddApprover"
            ],
            readonly: ["TotalNonRejectedAmount__", "DocumentNumber__", "DocumentDate__", "Currency__"],
            required: ["TotalNonRejectedAmount__", "Currency__"],
            notrequired: ["DocumentNumber__"],
            update: [{ name: "Approve", value: "_Submit" }]
        },
        approver: {
            hidden: [
                "CancelDocument"
            ],
            readonly: ["TotalNonRejectedAmount__", "DocumentNumber__", "DocumentDate__", "Currency__"],
            required: ["TotalNonRejectedAmount__", "Currency__"],
            notrequired: ["DocumentNumber__"],
            update: [{ name: "Approve", value: "_Approve" }]
        },
        provider: {
            hidden: [
                "CancelDocument", "BackToFirst", "BackToPrevious", "AddApprover"
            ],
            readonly: ["TotalNonRejectedAmount__", "DocumentNumber__", "DocumentDate__", "Currency__"],
            required: ["TotalNonRejectedAmount__", "Currency__"],
            notrequired: ["DocumentNumber__"],
            update: [{ name: "", value: "" }]
        }
    };
    /**
     * shows and hide the "default" buttons. That configuration is managed in the "setting" variable.
     * The default configuration is then adjusted by HandleButtonDisplay()
     * @see HandleButtonDisplay
     * @see settings
     */
    function AdjustLayoutToWorkflowStep() {
        const role = WorkflowHelper.GetCurrentStepRole();
        Log.Info(`Adjust form layout to workflow role '${role}'`);
        const layout = settings[role];
        const actions = ["update", "hidden", "readonly", "required", "notrequired"];
        for (const action of actions) {
            for (let i = 0; i < layout[action].length; ++i) {
                const ctrlName = action === "update" ? layout[action][i].name : layout[action][i];
                const control = Controls[ctrlName];
                if (control) {
                    switch (action) {
                        case "update":
                            control.SetLabel(layout[action][i].value);
                            break;
                        case "hidden":
                            control.Hide(true);
                            break;
                        case "readonly":
                            control.SetReadOnly(true);
                            break;
                        case "required":
                            control.SetRequired(true);
                            break;
                        case "notrequired":
                            control.SetRequired(false);
                            break;
                        default:
                            break;
                    }
                }
                else {
                    Log.Warn(`Error with control '${ctrlName}'`);
                }
            }
        }
    }
    LayoutHelper.AdjustLayoutToWorkflowStep = AdjustLayoutToWorkflowStep;
    function restrictFormHeader() {
        const formHeader = Controls.form_header;
        if (formHeader && !ProcessInstance.isDesignActive && !ProcessInstance.isDebugActive) {
            const designModeBox = formHeader.GetActionControl("mode");
            const panelsMenu = formHeader.GetActionControl("panels");
            const parametersMenu = formHeader.GetActionControl("parameters");
            const saveProcessBox = formHeader.GetActionControl("save");
            const homeButton = formHeader.GetActionControl("home");
            const contactButton = formHeader.GetActionControl("contactLink");
            if (designModeBox) {
                designModeBox.Hide(true);
            }
            if (panelsMenu) {
                panelsMenu.Hide(true);
            }
            if (parametersMenu) {
                parametersMenu.Hide(true);
            }
            if (saveProcessBox) {
                saveProcessBox.Hide(true);
            }
            if (homeButton) {
                homeButton.Hide(true);
            }
            if (contactButton) {
                contactButton.Hide(true);
            }
        }
    }
    function setDisabledNoLabelRefresh(button, disable) {
        if (button) {
            const label = button.GetLabel();
            button.SetDisabled(disable);
            button.SetLabel(label);
        }
    }
    function DisableButtons(toDisable, caller) {
        Log.Verbose(`[DisableButtons] '${toDisable}' <${caller}>`);
        if (typeof toDisable === "boolean") {
            setDisabledNoLabelRefresh(Controls.BackToFirst, toDisable);
            setDisabledNoLabelRefresh(Controls.BackToPrevious, toDisable);
            setDisabledNoLabelRefresh(Controls.CancelDocument, toDisable);
            setDisabledNoLabelRefresh(Controls.Reject, toDisable);
            setDisabledNoLabelRefresh(Controls.Save, toDisable);
            setDisabledNoLabelRefresh(Controls.Approve, toDisable);
            setDisabledNoLabelRefresh(Controls.AddApprover, toDisable);
        }
    }
    LayoutHelper.DisableButtons = DisableButtons;
    function HandleAddInvoiceButton() {
        const lineCount = Data.GetTable("LineItems__").GetItemCount();
        if (lineCount > 0 && isSAP()) {
            Controls.RunSearch__.Hide();
        }
        else if (lineCount < InvoiceLoadingHelper.MaxInvoiceCount) {
            Controls.RunSearch__.Hide(!WorkflowHelper.IsFirstRequester());
        }
        else {
            Controls.RunSearch__.Hide();
        }
        if (Controls.RunSearch__.IsVisible()) {
            InvoiceLoadingHelper.SetupBrowse();
        }
    }
    LayoutHelper.HandleAddInvoiceButton = HandleAddInvoiceButton;
    function HandleApproveAndSubmitButtons(activeLines, lineCount) {
        const sentIntoPaymentProvider = Variable.GetValueAsString("SentIntoPaymentProvider") === "1";
        const acknowledgedByPaymentProvider = Variable.GetValueAsString("AcknowledgedByPaymentProvider") === "1";
        if (acknowledgedByPaymentProvider) {
            Controls.Approve.SetLabel("_Refresh payment status");
        }
        else if (sentIntoPaymentProvider) {
            Controls.Approve.SetLabel("_Retry sending to payment provider");
        }
        else if (activeLines === 0) {
            Controls.Approve.Hide(true);
            Controls.AddApprover.Hide(true);
        }
        else {
            Controls.Approve.Hide(false);
            Controls.AddApprover.Hide(WorkflowHelper.CurrentIsRequester());
            if (activeLines < lineCount) {
                Controls.Approve.SetLabel(WorkflowHelper.CurrentIsApprover() ? "_Approve selected lines" : "_Submit selected lines");
                Controls.AddApprover.SetLabel("_Approve selected lines and add approver");
            }
            else {
                Controls.Approve.SetLabel(WorkflowHelper.CurrentIsApprover() ? "_Approve" : "_Submit");
                Controls.AddApprover.SetLabel("_Add approver");
            }
            if (Data.GetValue("Status__") === Lib.AP.PaymentRunStatus.ApprovedToPay) {
                const providerName = Sys.Parameters.GetInstance("AP").GetParameter("PaymentProvider", "");
                Controls.Approve.SetLabel(providerName ? "_Submit for payment" : "_Archive");
            }
        }
    }
    LayoutHelper.HandleApproveAndSubmitButtons = HandleApproveAndSubmitButtons;
    function HandleBanner(status) {
        const bannerStatus = Language.Translate(`_Banner ${status}`);
        // Set banner based on current status
        const htmlTitle = `<div style='color: #435464;margin: 0px -10px 0px -10px;line-height: 2em;text-align: center; font-family: Arial, Helvetica, sans-serif'>
	<span style='font-size: 20pt;font-weight: bold'>${Language.Translate("Payment run")}</span>
	<span style='font-size: 16pt'>&emsp;–&emsp;${bannerStatus}</span>
</div>`;
        Controls.HTMLBanner__.SetHTML(htmlTitle);
    }
    LayoutHelper.HandleBanner = HandleBanner;
    /**
     * Show and hide buttons. This function modifies the "default" case, that is handled by AdjustLayoutToWorkflowStep()
     * @see AdjustLayoutToWorkflowStep
     * @see settings
     */
    function HandleButtonDisplay(formIsReadOnly, sentIntoPaymentProvider) {
        if (!formIsReadOnly) {
            if (WorkflowHelper.IsFirstRequester()) {
                Controls.Reject.Hide(true);
                if (Data.GetValue("State") === "70" /* The form has been saved*/) {
                    Controls.CancelDocument.Hide(false);
                }
            }
            if (g_workflowController.IsLastContributor()) {
                // The last contributor is the requester, but with role "approver"
                Controls.AddApprover.Hide(true);
                Controls.BackToPrevious.Hide(true);
                Controls.BackToFirst.Hide(true);
            }
            if (WorkflowHelper.PreviousIsRequester()) {
                Controls.BackToPrevious.Hide(true);
            }
            if (WorkflowHelper.CurrentIsApprover() && sentIntoPaymentProvider) {
                // A problem happened on payment provider side.
                // The only options are "approve" and "reject"
                Controls.AddApprover.Hide(true);
                Controls.BackToFirst.Hide(true);
                Controls.BackToPrevious.Hide(true);
            }
        }
        else {
            // Buttons
            Controls.AddApprover.Hide(true);
            Controls.Approve.Hide(true);
            Controls.BackToFirst.Hide(true);
            Controls.BackToPrevious.Hide(true);
            Controls.Reject.Hide(true);
            Controls.Save.Hide(true);
        }
    }
    LayoutHelper.HandleButtonDisplay = HandleButtonDisplay;
    function HandleControlDisplay() {
        const status = Data.GetValue("Status__");
        const isVeryFirstRequester = WorkflowHelper.IsFirstRequester();
        const isFormIsReadOnly = LayoutHelper.IsFormReadOnly();
        const sentIntoPaymentProvider = Variable.GetValueAsString("SentIntoPaymentProvider") === "1";
        const invoicesPanelReadOnly = isFormIsReadOnly || sentIntoPaymentProvider;
        const workflowPanelReadOnly = isFormIsReadOnly;
        LayoutHelper.HandleButtonDisplay(isFormIsReadOnly, sentIntoPaymentProvider);
        LayoutHelper.HandleLabels(status);
        LayoutHelper.HandleBanner(status);
        if (invoicesPanelReadOnly) {
            Controls.RunSearch__.Hide(true);
        }
        else {
            LayoutHelper.HandleAddInvoiceButton();
        }
        if (workflowPanelReadOnly) {
            Controls.Comments__.Hide(true);
        }
        Controls.Comments__.SetPlaceholder(g_CommentPlaceHolder);
        Controls.DocumentSearch__.Hide();
        Controls.DocumentSearch__.SetMultiSelectionMode(true);
        Controls.LineItems__.SetWidth("100%");
        Controls.LineItems__.SetExtendableColumn("VendorName__");
        Controls.LineItems__.HideTableRowDelete(!isVeryFirstRequester || isSAP());
        Controls.LineItems__.Rejected__.Hide(isVeryFirstRequester);
        Controls.LineItems__.Rejected__.SetReadOnly(isVeryFirstRequester || invoicesPanelReadOnly);
        Controls.GroupedLineItems__.SetWidth("100%");
        Controls.GroupedLineItems__.SetExtendableColumn("VendorName__");
        Controls.BackToFirstReason__.Hide();
        Controls.RejectionReason__.Hide();
        if (isFormIsReadOnly) {
            Log.Warn("Force read only since record is in final business state but technical state 70");
            // Panels
            Controls.GroupedItems.SetReadOnly(true);
            Controls.InvoicesPanel.SetReadOnly(true);
            Controls.ApprovalWorkflow.SetReadOnly(true);
            // Controls
            Controls.Comments__.Hide(true);
            Controls.LineItems__.SetReadOnly(true);
            Controls.GroupedLineItems__.SetReadOnly(true);
            Controls.Workflow__.SetReadOnly(true);
        }
    }
    LayoutHelper.HandleControlDisplay = HandleControlDisplay;
    function HandleLabels(status) {
        if (status === Lib.AP.PaymentRunStatus.Approved) {
            return;
        }
        Controls.form_header.SetProcessDisplayName(Language.Translate("Payment run proposal", false));
        if (status === Lib.AP.PaymentRunStatus.New || status === Lib.AP.PaymentRunStatus.ToVerify) {
            Controls.TotalNonRejectedLabel__.SetLabel(Language.Translate("To approve amount", false));
            Controls.TotalNonRejectedAmountWithCurrency__.SetLabel(Language.Translate("To approve amount", false));
        }
        else if (status === Lib.AP.PaymentRunStatus.Rejected || status === Lib.AP.PaymentRunStatus.Cancelled) {
            Controls.TotalNonRejectedLabel__.SetLabel(Language.Translate(`${status} amount`, false));
            Controls.TotalNonRejectedAmountWithCurrency__.SetLabel(Language.Translate(`${status} amount`, false));
        }
    }
    LayoutHelper.HandleLabels = HandleLabels;
    function HandleTopMessageWarnings() {
        const promises = [];
        LayoutHelper.TopMessageWarning.Display();
        promises.push(Lib.P2P.DisplayArchiveDurationWarning("AP", function () {
            LayoutHelper.TopMessageWarning.Add(Language.Translate("_Archive duration warning"));
        }));
        promises.push(Lib.P2P.DisplayBackupUserWarning("AP", function (displayName) {
            LayoutHelper.TopMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName));
        }));
        return Sys.Helpers.Promise.All(promises);
    }
    LayoutHelper.HandleTopMessageWarnings = HandleTopMessageWarnings;
    function HandleWorkflow() {
        Controls.Workflow__.SetRowToolsHidden(true);
        Controls.Workflow__.Marker__.Hide(ProcessInstance.state >= 100);
        Controls.Workflow__.SetWidth("100%");
        Controls.Workflow__.SetExtendableColumn("Comment__");
        LayoutHelper.UpdateWorkflowLayout();
        AdjustLayoutToWorkflowStep();
    }
    LayoutHelper.HandleWorkflow = HandleWorkflow;
    function Init() {
        restrictFormHeader();
        LayoutHelper.HandleWorkflow();
        LayoutHelper.HandleControlDisplay();
        return LayoutHelper.HandleTopMessageWarnings();
    }
    LayoutHelper.Init = Init;
    function IsFormReadOnly() {
        const status = Data.GetValue("Status__");
        const isInFinalBusinessStatus = status === Lib.AP.PaymentRunStatus.Approved || status === Lib.AP.PaymentRunStatus.Rejected || status === Lib.AP.PaymentRunStatus.Cancelled;
        return (ProcessInstance.state && ProcessInstance.state !== 70) || isInFinalBusinessStatus || !Lib.P2P.IsOwnerOrBackup();
    }
    LayoutHelper.IsFormReadOnly = IsFormReadOnly;
    function UpdateWorkflowLayout() {
        const workflowTableCount = Controls.Workflow__.GetItemCount();
        const workflowTableDisplayLineCount = Controls.Workflow__.GetLineCount();
        if (workflowTableCount >= workflowTableDisplayLineCount) {
            // Make sure that at least the last 4 steps and the current step are displayed by default
            // and that following steps are displayed (upon to 5)
            let tIdx1 = g_workflowController.GetTableIndex() - 4;
            tIdx1 = tIdx1 < 0 ? 0 : tIdx1;
            const tIdx2 = workflowTableCount - 10;
            Controls.Workflow__.DisplayItem(workflowTableCount - 1);
            Controls.Workflow__.DisplayItem(tIdx1 < tIdx2 ? tIdx1 : tIdx2);
        }
    }
    LayoutHelper.UpdateWorkflowLayout = UpdateWorkflowLayout;
})(LayoutHelper || (LayoutHelper = {}));
var TableHighlightsHelper;
(function (TableHighlightsHelper) {
    const styles = {
        greyed: "greyed",
        grouped: "grouped",
        rejected: "highlight-danger",
        approvedAmount: "highlight-danger"
    };
    function alternateRowHighlighting(row, index, oddRowStyle) {
        oddRowStyle = oddRowStyle || styles.greyed;
        if (row) {
            if (index % 2 === 0) {
                row.RemoveRowStyle(oddRowStyle);
            }
            else {
                row.AddRowStyle(oddRowStyle);
            }
        }
    }
    function focusOnTable(focusedRowKey, tableControl) {
        const lineCount = tableControl.GetItemCount();
        for (let i = 0; i < lineCount; i++) {
            const item = tableControl.GetItem(i);
            if (item && getLineKey(GroupLinesHelper.GroupedColumnsKeys, null, item) === focusedRowKey) {
                tableControl.DisplayItem(i);
                break;
            }
        }
    }
    function highlightRowsWithSameKey(focusedRowKey, tableControl) {
        const lineCount = Math.min(tableControl.GetItemCount(), tableControl.GetLineCount());
        for (let i = 0; i < lineCount; ++i) {
            const currentrow = tableControl.GetRow(i);
            if (focusedRowKey === null) {
                // row key is null - remove grouped style
                currentrow.RemoveRowStyle(styles.grouped);
            }
            else if (getLineKey(GroupLinesHelper.GroupedColumnsKeys, currentrow) === focusedRowKey) {
                currentrow.AddRowStyle(styles.grouped);
            }
        }
    }
    function AlternateHighlighting(tableControl) {
        const minLines = 3;
        const lineCount = tableControl ? Math.min(tableControl.GetItemCount(), tableControl.GetLineCount()) : 0;
        if (lineCount >= minLines) {
            for (let i = 0; i < lineCount; ++i) {
                alternateRowHighlighting(tableControl.GetRow(i), i, styles.greyed);
            }
        }
    }
    TableHighlightsHelper.AlternateHighlighting = AlternateHighlighting;
    function OnBlurRow() {
        highlightRowsWithSameKey(null, Controls.LineItems__);
        highlightRowsWithSameKey(null, Controls.GroupedLineItems__);
    }
    TableHighlightsHelper.OnBlurRow = OnBlurRow;
    function OnFocusRow(focusedRow, tableControl) {
        const focusedRowKey = focusedRow ? getLineKey(GroupLinesHelper.GroupedColumnsKeys, focusedRow) : null;
        if (focusedRowKey) {
            // Handle focus
            if (tableControl === Controls.LineItems__) {
                focusOnTable(focusedRowKey, Controls.GroupedLineItems__);
            }
            else if (tableControl === Controls.GroupedLineItems__) {
                focusOnTable(focusedRowKey, Controls.LineItems__);
            }
        }
        highlightRowsWithSameKey(focusedRowKey, Controls.LineItems__);
        highlightRowsWithSameKey(focusedRowKey, Controls.GroupedLineItems__);
    }
    TableHighlightsHelper.OnFocusRow = OnFocusRow;
    function RefreshRowStyle(row) {
        if (row && row.IsVisible()) {
            // Rejected
            if (row.Rejected__ && row.Rejected__.GetValue()) {
                row.AddStyle(styles.rejected);
            }
            else {
                row.RemoveStyle(styles.rejected);
            }
        }
    }
    TableHighlightsHelper.RefreshRowStyle = RefreshRowStyle;
})(TableHighlightsHelper || (TableHighlightsHelper = {}));
var WorkflowHelper;
(function (WorkflowHelper) {
    let currentStepRole = null;
    function CurrentIsApprover() {
        return WorkflowHelper.GetCurrentStepRole() === roles.approver;
    }
    WorkflowHelper.CurrentIsApprover = CurrentIsApprover;
    function CurrentIsRequester() {
        return WorkflowHelper.GetCurrentStepRole() === roles.requester;
    }
    WorkflowHelper.CurrentIsRequester = CurrentIsRequester;
    function CurrentIsProvider() {
        return WorkflowHelper.GetCurrentStepRole() === roles.provider;
    }
    WorkflowHelper.CurrentIsProvider = CurrentIsProvider;
    function GetCurrentStepRole(force) {
        if (!currentStepRole || force) {
            const idx = g_workflowController.GetContributorIndex();
            if (idx < g_workflowController.GetNbContributors()) {
                currentStepRole = g_workflowController.GetRoleAt(idx);
            }
            else {
                currentStepRole = roles.requester;
            }
        }
        return currentStepRole;
    }
    WorkflowHelper.GetCurrentStepRole = GetCurrentStepRole;
    function GetPreviousStepRole() {
        const idx = g_workflowController.GetContributorIndex() - 1;
        if (idx >= 0 && idx < g_workflowController.GetNbContributors()) {
            return g_workflowController.GetRoleAt(idx);
        }
        return "";
    }
    WorkflowHelper.GetPreviousStepRole = GetPreviousStepRole;
    function IsFirstRequester() {
        return g_workflowController.GetContributorIndex() === 0 && Variable.GetValueAsString("SentIntoWorkflow") !== "1";
    }
    WorkflowHelper.IsFirstRequester = IsFirstRequester;
    function GetContributor(login) {
        const listToUse = g_workflowController.GetSerializedValue("approvers");
        if (listToUse) {
            return Sys.Helpers.Array.Find(listToUse, el => el.login === login) || null;
        }
        return null;
    }
    WorkflowHelper.GetContributor = GetContributor;
    function Init() {
        g_workflowController = Sys.WorkflowController.Create(Data, Variable, Language, Controls, User);
        g_workflowController.Define(g_workflowParams);
        g_workflowController.AllowRebuild(CurrentIsRequester());
        g_workflowController.SetRolesSequence([roles.requester, roles.approver, roles.provider]);
    }
    WorkflowHelper.Init = Init;
    function PreviousIsRequester() {
        return WorkflowHelper.GetPreviousStepRole() === roles.requester;
    }
    WorkflowHelper.PreviousIsRequester = PreviousIsRequester;
    function ValidateUserExistence(user, contributor) {
        if (user.exists === false && contributor.role !== roles.provider) {
            contributor.errors = contributor.errors || {};
            contributor.errors.name = Language.Translate("User not found", false);
            return false;
        }
        contributor.errors = contributor.errors || {};
        delete contributor.errors.name;
        return true;
    }
    WorkflowHelper.ValidateUserExistence = ValidateUserExistence;
})(WorkflowHelper || (WorkflowHelper = {}));
// METHODS
function delayRebuildWorkflow() {
    if (g_workflowController.IsEnded()) {
        Log.Warn("[DelayRebuildWorkflow] Ended");
        return;
    }
    if (g_workflowRebuildTimer === 0) {
        // Cannot submit when workflow update pending
        Log.Info("[DelayRebuildWorkflow] Start");
        LayoutHelper.DisableButtons(true, "DelayRebuildWorkflowStart");
        Controls.ComputingWorkflow__.Hide(false);
    }
    else {
        // Cancel previous call
        Log.Info("[DelayRebuildWorkflow] Start and cancel previous");
        clearTimeout(g_workflowRebuildTimer);
    }
    // Delay workflow rebuild
    g_workflowRebuildTimer = setTimeout(function () {
        Log.Info("[DelayRebuildWorkflow] Trigger");
        g_workflowRebuildTimer = 0;
        LayoutHelper.DisableButtons(false, "DelayRebuildWorkflowEnd");
        if (g_workflowController.RebuildAllowed()) {
            Log.Info("[DelayRebuildWorkflow] Rebuild");
            g_workflowController.Rebuild();
        }
        else {
            Log.Info("[DelayRebuildWorkflow] Rebuild not allowed");
            Controls.ComputingWorkflow__.Hide(true);
        }
    }, 500);
}
function isSAP() {
    return Variable.GetValueAsString("ERP") === "SAP";
}
function displayHideExternalDocument(row) {
    const index = row.GetLineNumber(true);
    const shouldHide = g_previewIndex >= 0 && (index - 1) === g_previewIndex;
    const ruidEx = row.RuidEx__.GetValue();
    const linesPerPage = Controls.LineItems__.GetLineCount() || 0;
    const firstLineIndex = Controls.LineItems__.GetRow(0).GetLineNumber(true);
    const previousRow = g_previewIndex >= 0 ? Controls.LineItems__.GetRow((g_previewIndex - (firstLineIndex - 1)) % linesPerPage) : null;
    if (shouldHide) {
        hideExternalDocument();
    }
    else {
        ProcessInstance.SetFormWidth();
        setTimeout(function () {
            Controls.PreviewPanel.SetPreviewDocument(Language.Translate("Preview", false), ruidEx);
            Controls.form_content_right.Hide(false);
            Controls.form_content_left.SetSize(65); // %
        });
        g_previewIndex = index - 1;
        const hideResetButton = Controls.LineItems__.GetItemCount() <= Controls.LineItems__.GetLineCount();
        Controls.ResetPreview__.Hide(hideResetButton);
    }
    setPreviewInvoiceAccess(row, g_previewAccesses.clicked);
    setPreviewInvoiceAccess(previousRow, g_previewAccesses.unclicked);
}
function hideExternalDocument() {
    Controls.form_content_right.Hide(true);
    ProcessInstance.SetFormWidth("default");
    Controls.form_content_left.SetSize(100); // %
    g_previewIndex = -1;
    Controls.ResetPreview__.Hide(true);
}
function getLineKey(colunms, row, item) {
    let key = "";
    if (colunms) {
        for (const column of colunms) {
            let value = "";
            if (item) {
                value = item.GetValue(column) || "";
            }
            else if (row && row.IsVisible()) {
                value = row[column] ? row[column].GetValue() : "";
            }
            key += `${value}__`;
        }
    }
    return key;
}
/**
 * Returns a reliable value of Comment__ field content.
 * On some browsers (IE<10), the placeholder could be returned as its value.
 */
const g_CommentPlaceHolder = Language.Translate("_Enter your comment...");
function getReliableComment() {
    let commentValue = Controls.Comments__.GetValue();
    if (commentValue === g_CommentPlaceHolder) {
        commentValue = "";
    }
    return commentValue;
}
function getUserImage(isGroup) {
    return isGroup ? "workflow_group.png" : "workflow_user.png";
}
function handleClickableLinks(row) {
    if (row && row.IsVisible()) {
        const ruidEx = row.RuidEx__.GetValue();
        let displayDef = g_previewAccesses.unavailable;
        row.PreviewInvoice__.Hide(false);
        if (ruidEx) {
            const invoiceNumber = row.InvoiceNumber__.GetText() || ruidEx;
            row.InvoiceNumber__.DisplayAs({ type: "Link", text: invoiceNumber });
            row.PreviewInvoice__.SetReadOnly(false);
            const lineNumber = row.GetLineNumber(true);
            const isPreviewed = g_previewIndex === lineNumber - 1;
            displayDef = isPreviewed ? g_previewAccesses.clicked : g_previewAccesses.unclicked;
        }
        else {
            row.InvoiceNumber__.DisplayAs({ type: "" });
            row.PreviewInvoice__.SetReadOnly(true);
        }
        setPreviewInvoiceAccess(row, displayDef);
    }
}
function handleDualAmountDisplay(totalAmount, amount) {
    if (totalAmount === amount) {
        Log.Info("Hide total controls as value is equal to non-rejected controls");
        Controls.TotalAmount__.Hide(true);
        Controls.TotalLabel__.Hide(true);
        Controls.TotalCurrency__.Hide(true);
        Controls.TotalAmountWithCurrency__.Hide(true);
    }
    else {
        Log.Info("Show total controls as value differs from non-rejected controls");
        Controls.TotalAmount__.Hide(false);
        Controls.TotalLabel__.Hide(false);
        Controls.TotalCurrency__.Hide(false);
        Controls.TotalAmountWithCurrency__.Hide(false);
    }
}
function onRefreshTable() {
    const lineItems = Data.GetTable("LineItems__");
    const lineCount = lineItems.GetItemCount();
    let activeLines = 0;
    let amount = 0, totalAmount = 0;
    g_lineKeys = {};
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    Controls.LineItems__.RefreshRows();
    // Compute amounts
    for (let i = 0; i < lineCount; i++) {
        const item = lineItems.GetItem(i);
        if (item) {
            item.SetValue("LineNumber__", i + 1);
            const localLineAmount = item.GetValue("LocalInvoiceAmount__");
            if (localLineAmount) {
                const localLineDiscount = item.GetValue("DiscountLimitDate__") >= currentDate ? item.GetValue("LocalEstimatedDiscountAmount__") : 0;
                const localLineWithDiscount = localLineAmount - localLineDiscount;
                totalAmount += localLineWithDiscount;
                if (!item.GetValue("Rejected__")) {
                    amount += localLineWithDiscount;
                    activeLines++;
                }
            }
            const ruidex = item.GetValue("RuidEx__");
            g_lineKeys[ruidex] = getLineKey(InvoiceLoadingHelper.InvoiceKeysColumns, null, item);
        }
    }
    let currency = Data.GetValue("Currency__") || "";
    // header amounts
    const firstInvoice = lineItems.GetItem(0);
    if (firstInvoice) {
        currency = firstInvoice.GetValue("LocalCurrency__") || currency || "";
        Data.SetValue("Currency__", currency);
        Variable.SetValueAsString("CompanyCode", firstInvoice.GetValue("CompanyCode__"));
    }
    Data.SetValue("TotalAmount__", totalAmount);
    Data.SetValue("TotalAmountWithCurrency__", `${Controls.TotalAmount__.GetText()} ${currency}`);
    Data.SetValue("TotalNonRejectedAmount__", amount);
    Data.SetValue("TotalNonRejectedAmountWithCurrency__", `${Controls.TotalNonRejectedAmount__.GetText()} ${currency}`);
    handleDualAmountDisplay(totalAmount, amount);
    // Stats
    Data.SetValue("NbInvoices__", Data.GetTable("LineItems__").GetItemCount());
    // Group linges
    GroupLinesHelper.GroupLines();
    // Highlights
    TableHighlightsHelper.AlternateHighlighting(Controls.GroupedLineItems__);
    TableHighlightsHelper.AlternateHighlighting(Controls.LineItems__);
    // Layout
    if (!LayoutHelper.IsFormReadOnly()) {
        LayoutHelper.HandleApproveAndSubmitButtons(activeLines, lineCount);
        LayoutHelper.HandleAddInvoiceButton();
    }
    Controls.NoItems__.Hide(lineCount > 0);
    Controls.NoGroupedItems__.Hide(Data.GetTable("GroupedLineItems__").GetItemCount() > 0);
}
function setPreviewInvoiceAccess(row, previewAccess) {
    if (row && row.IsVisible()) {
        row.PreviewInvoice__.SetTextColor(previewAccess.color);
        row.PreviewInvoice__.SetAwesomeClasses(previewAccess.font);
        row.PreviewInvoice__.SetText(previewAccess.text);
    }
}
function storeCurrentUserSettings() {
    Variable.SetValueAsString("CurrentContributorLogin", User.loginId);
    Variable.SetValueAsString("CurrentContributorEmail", User.emailAddress);
    Variable.SetValueAsString("CurrentContributorName", User.fullName || `${User.firstName} ${User.lastName}`);
}
//#region init
function setHelpIds() {
    // "Accounts Payable" home page
    Process.SetHelpId(g_helpId);
    Controls.GroupedItems.SetHelpId(g_helpId.toString());
    Controls.InvoicesPanel.SetHelpId(g_helpId.toString());
    Controls.ApprovalWorkflow.SetHelpId(g_helpId.toString());
}
function initHeaderFields() {
    if (!Data.GetValue("DocumentDate__")) {
        Data.SetValue("DocumentDate__", new Date());
    }
}
function initTableFields() {
    Controls.LineItems__.InvoiceStatus__.Hide(isSAP());
}
function initializeForm() {
    LayoutHelper.Init();
    initHeaderFields();
    initTableFields();
    if (ProcessInstance.state === 400 || Data.GetValue("SplitDone")) {
        Process.ShowFirstErrorAfterBoot(false);
    }
}
function initEvents() {
    ButtonsBehavior.Init();
    // highlight invoices with samekey
    Controls.LineItems__.OnFocusRow = function (index) {
        const row = Controls.LineItems__.GetRow(index);
        TableHighlightsHelper.OnFocusRow(row, this);
    };
    Controls.LineItems__.OnBlurRow = function () {
        TableHighlightsHelper.OnBlurRow();
    };
    Controls.LineItems__.OnRefreshRow = function (index) {
        const row = Controls.LineItems__.GetRow(index);
        TableHighlightsHelper.RefreshRowStyle(row);
        setTimeout(() => handleClickableLinks(row), 0);
    };
    Controls.LineItems__.OnDeleteItem = function (item) {
        item.Remove();
        onRefreshTable();
        delayRebuildWorkflow();
        // Check all invoices are of the same configuration
        ConfigurationHelper.OnItemDeleted();
    };
    Controls.LineItems__.Rejected__.OnChange = function () {
        const row = this.GetRow();
        TableHighlightsHelper.RefreshRowStyle(row);
        onRefreshTable();
        delayRebuildWorkflow();
    };
    Controls.GroupedLineItems__.OnFocusRow = function (index) {
        const row = Controls.GroupedLineItems__.GetRow(index);
        TableHighlightsHelper.OnFocusRow(row, this);
    };
    Controls.GroupedLineItems__.OnBlurRow = function () {
        TableHighlightsHelper.OnBlurRow();
    };
    Controls.LineItems__.InvoiceNumber__.OnClick = function () {
        const row = this.GetRow();
        const ruidEx = row ? row.RuidEx__.GetValue() : null;
        let validationUrl = row ? row.ValidationURL__.GetValue() : null;
        if (!validationUrl && ruidEx) {
            validationUrl = `ManageDocumentsCheck.link?ruid=${ruidEx.replace("#", "%23")}`;
        }
        if (validationUrl) {
            Process.OpenLink({ url: validationUrl, inCurrentTab: false, onQuit: "Close" });
        }
        else if (ruidEx) {
            Process.OpenMessage(ruidEx, true);
        }
        else {
            Log.Error("No ValidationURL nor RuidEx on that line");
        }
    };
    Controls.LineItems__.RuidEx__.OnClick = function () {
        const ruidEx = this.GetValue();
        if (ruidEx) {
            Process.OpenMessage(ruidEx, true);
        }
        else {
            Log.Error("No RuidEx on that line");
        }
    };
    Controls.LineItems__.PreviewInvoice__.OnClick = function () {
        const row = this.GetRow();
        const ruidEx = row ? row.RuidEx__.GetValue() : null;
        if (!ruidEx) {
            return;
        }
        displayHideExternalDocument(row);
    };
    Controls.DocumentSearch__.OnSelectItem = InvoiceLoadingHelper.OnSelectInvoicesBrowseItem;
}
function initERPData() {
    if (!Variable.GetValueAsString("ERP")) {
        const ERPName = g_apParameters.GetParameter("ERP");
        Variable.SetValueAsString("ERP", ERPName);
        if (ERPName === "SAP" && !Variable.GetValueAsString("SAPConfiguration")) {
            const SAPConfiguration = g_apParameters.GetParameter("SAPConfiguration");
            Variable.SetValueAsString("SAPConfiguration", SAPConfiguration);
        }
    }
}
function silenceSomeAudits() {
    // tables with a default empty line that should not be audited since no action occured on them
    Controls.Workflow__.DisableLinesAudit(true);
}
function showErrorIfAny() {
    const lastError = Variable.GetValueAsString("LastPaymentProviderError");
    if (lastError && !WorkflowHelper.CurrentIsProvider()) {
        const errorMessage = Language.Translate(`_paymentProvider_${lastError}_fullMessage`);
        Popup.Alert(errorMessage, true, null, "_payment provider popup title:");
    }
}
function init() {
    initERPData();
    silenceSomeAudits();
    WorkflowHelper.Init();
    initEvents();
    initializeForm();
    setHelpIds();
}
//#endregion
//#region Load selected invoices information
function shouldRetrieveInvoicesInformation() {
    function lineItemsAreEmpty() {
        const lineItems = Data.GetTable("LineItems__");
        const lineCount = lineItems.GetItemCount();
        if (lineCount === 0) {
            return true;
        }
        else if (lineCount === 1) {
            const item = lineItems.GetItem(0);
            if (item) {
                return !item.GetValue("InvoiceNumber__")
                    && !item.GetValue("VendorName__")
                    && !item.GetValue("InvoiceCurrency__")
                    && !item.GetValue("RuidEx__");
            }
            return true;
        }
        return false;
    }
    const status = Data.GetValue("Status__");
    const isStatusOk = !status || status === Lib.AP.PaymentRunStatus.New;
    return !ProcessInstance.isReadOnly && isStatusOk && lineItemsAreEmpty();
}
function getInvoiceList() {
    let ancestorRuids = Variable.GetValueAsString("AncestorsRuid") || ProcessInstance.selectedRuidFromView;
    if (!ancestorRuids) {
        return [];
    }
    if (typeof ancestorRuids === "string") {
        return ancestorRuids.split("|");
    }
    if (ancestorRuids.length > InvoiceLoadingHelper.MaxInvoiceCount) {
        ancestorRuids = ancestorRuids.slice(0, InvoiceLoadingHelper.MaxInvoiceCount);
        const popupTitle = Language.Translate("_MaxDocumentNumberOnInit", false);
        const popupMessage = Language.Translate("_MaxDocumentNumberOnInitLimitation", false, InvoiceLoadingHelper.MaxInvoiceCount);
        Popup.Alert(popupMessage, true, null, popupTitle);
    }
    Variable.SetValueAsString("AncestorsRuid", ancestorRuids.join("|"));
    return ancestorRuids;
}
function loadSelectedInvoices() {
    let loadLineItems = Sys.Helpers.Promise.Resolve();
    if (shouldRetrieveInvoicesInformation()) {
        if (isSAP()) {
            SAPBrowseHelper.ShowDialog();
        }
        else {
            const ancestors = getInvoiceList();
            if (ancestors.length > 0) {
                Log.Info("Loading invoice list from adminlist selection");
                Data.GetTable("LineItems__").SetItemCount(0);
                loadLineItems = InvoiceLoadingHelper.Load(ancestors);
            }
        }
    }
    return loadLineItems.Finally(onRefreshTable);
}
//#endregion
function run() {
    ProcessInstance.SetSilentChange(true);
    init();
    storeCurrentUserSettings();
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRun.HTMLScripts.OnHTMLScriptEndSync");
    return loadSelectedInvoices()
        .Then(ConfigurationHelper.ValidateAllConfigurations)
        .Then(showErrorIfAny)
        // The ProcessInstance.SetSilentChange(false) is done at the end of the workflow build.
        .Then(() => {
        Log.Info("HTML page script execution complete");
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.PaymentRun.HTMLScripts.OnHTMLScriptEnd");
    });
}
g_apParameters.IsReady(run);
//# sourceMappingURL=customscript.js.map