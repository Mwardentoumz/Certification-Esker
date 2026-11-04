"use strict";
const StatementStatus = {
    draft: "Draft",
    toVerify: "To verify",
    archived: "Archived",
    rejected: "Rejected"
};
var FormCleaner;
(function (FormCleaner) {
    //Allow to cancel OnChange actions
    let previous = {
        CompanyCode__: Data.GetValue("CompanyCode__"),
        StatementDate__: Data.GetValue("StatementDate__"),
        VendorNumber__: Data.GetValue("VendorNumber__"),
        VendorName__: Data.GetValue("VendorName__")
    };
    const columnsToCheck = ["InvoiceStatus__"];
    function GetAdaptDataToFieldFunction(fieldName) {
        return () => {
            previous[fieldName] = Data.GetValue(fieldName);
            Lib.AP.StatementMatching.CleanInvoicesTable();
        };
    }
    function GetRevertFieldFunction(fieldName) {
        return () => {
            Controls[fieldName].SetValue(previous[fieldName]);
        };
    }
    FormCleaner.AdaptDataToStatementDate = GetAdaptDataToFieldFunction("StatementDate__");
    FormCleaner.AdaptDataToVendorNumber = GetAdaptDataToFieldFunction("VendorNumber__");
    FormCleaner.AdaptDataToVendorName = GetAdaptDataToFieldFunction("VendorName__");
    FormCleaner.RevertCompanyCode = GetRevertFieldFunction("CompanyCode__");
    FormCleaner.RevertStatementDate = GetRevertFieldFunction("StatementDate__");
    FormCleaner.RevertVendorNumber = GetRevertFieldFunction("VendorNumber__");
    FormCleaner.RevertVendorName = GetRevertFieldFunction("VendorName__");
    function IsDataClean() {
        if (Data.GetValue("VendorNumber__")) {
            return false;
        }
        return FormCleaner.IsInvoicesTableClean();
    }
    FormCleaner.IsDataClean = IsDataClean;
    function IsInvoicesTableClean() {
        const invoicesTable = Data.GetTable("InvoicesTable__");
        const nbItems = invoicesTable.GetItemCount();
        for (let i = 0; i < nbItems; i++) {
            const item = invoicesTable.GetItem(i);
            for (const columnToCheck of columnsToCheck) {
                if (item.GetValue(columnToCheck) && item.GetValue(columnToCheck) !== "EMPTY") {
                    return false;
                }
            }
        }
        return true;
    }
    FormCleaner.IsInvoicesTableClean = IsInvoicesTableClean;
    function Reset() {
        previous = {
            CompanyCode__: Data.GetValue("CompanyCode__"),
            StatementDate__: Data.GetValue("StatementDate__"),
            VendorNumber__: Data.GetValue("VendorNumber__"),
            VendorName__: Data.GetValue("VendorName__")
        };
    }
    FormCleaner.Reset = Reset;
    function applyConfigurationChange(conf) {
        Lib.P2P.ChangeConfiguration(conf)
            .Then(() => {
            Log.Info(`Manual change of company code - Resubmit with new matching configuration: ${conf}`);
            ProcessInstance.ResubmitAsynchronous("reprocess", {
                CompanyCode: Data.GetValue("CompanyCode__"),
                configuration: conf,
                tableParameters: Variable.GetValueAsString("tableParameters")
            });
        });
    }
    // Save new company code and clear or update fields that needs to
    function AdaptDataToCompanyCode() {
        const newCompanyCode = Data.GetValue("CompanyCode__");
        const companyCodeHasChanged = previous.CompanyCode__ !== newCompanyCode;
        previous.CompanyCode__ = newCompanyCode;
        if (newCompanyCode && companyCodeHasChanged) {
            Lib.P2P.CompanyCodesValue.QueryValues(newCompanyCode).Then(function (CCValues) {
                if (Object.keys(CCValues).length > 0) {
                    const newConf = CCValues.DefaultConfiguration__;
                    const previousConf = Data.GetValue("Configuration__");
                    if (!newConf) {
                        Log.Warn(`No default configuration found for company code ${newCompanyCode}, no change`);
                    }
                    else if (newConf && previousConf && newConf !== previousConf) {
                        const popupMsg = Language.Translate("_The default configuration will be changed according to the new company code {0} From {1} to {2}", true, newCompanyCode, previousConf, newConf);
                        Popup.Confirm(popupMsg, false, () => applyConfigurationChange(newConf), GetRevertFieldFunction("CompanyCode__"), "Warning");
                    }
                }
            });
        }
        Data.SetValue("StatementMatchingStatus__", "EMPTY");
        Data.SetValue("StatementMatchingStatusExplanation__", "");
        Data.SetValue("VendorNumber__", "");
        Controls.VendorNumber__.OnChange(true);
    }
    FormCleaner.AdaptDataToCompanyCode = AdaptDataToCompanyCode;
})(FormCleaner || (FormCleaner = {}));
var LayoutHelper;
(function (LayoutHelper) {
    let buttonsDisabled = 0;
    const disableGroup = {};
    let showWaitScreen = false;
    function AreButtonsDisabled() {
        return buttonsDisabled > 0;
    }
    function DisableButtons(disable, group) {
        const currentState = AreButtonsDisabled();
        const groupName = group || "*";
        if (disable) {
            buttonsDisabled++;
            if (disableGroup[groupName] && disableGroup[groupName].count) {
                disableGroup[groupName].count++;
            }
            else {
                disableGroup[groupName] = {
                    count: 1
                };
            }
        }
        else {
            buttonsDisabled--;
            if (!disableGroup[groupName]) {
                Log.Error(`Enabling of buttons on a unitialized group '${groupName}'`);
            }
            else if (disableGroup[groupName].count === 0) {
                Log.Warn(`Enabling of buttons from group '${groupName}' is call too often.`);
            }
            else {
                disableGroup[groupName].count--;
            }
        }
        if (showWaitScreen) {
            if (AreButtonsDisabled()) {
                Controls.CompanyCode__.Wait(true);
            }
            else if (!AreButtonsDisabled()) {
                Controls.CompanyCode__.Wait(false);
                showWaitScreen = false;
            }
        }
        const newState = AreButtonsDisabled();
        if (currentState !== newState) {
            Controls.RequestMissingInvoices.SetDisabled(newState);
            Controls.Reject.SetDisabled(newState);
            Controls.Refresh.SetDisabled(newState);
            Controls.Save.SetDisabled(newState);
            Controls.Approve.SetDisabled(newState);
        }
    }
    LayoutHelper.DisableButtons = DisableButtons;
    function DisplayBanner() {
        const banner = Sys.Helpers.Banner;
        banner.SetMainTitle("_Statement title");
        banner.SetStatusCombo(Controls.StatementStatus__);
        banner.SetHTMLBanner(Controls.HTMLBanner__);
        banner.SetSubTitle();
    }
    LayoutHelper.DisplayBanner = DisplayBanner;
    function Init() {
        LayoutHelper.DisplayBanner();
        Controls.Refresh.SetDisabled(ProcessInstance.isReadOnly);
        Controls.Refresh.Hide(ProcessInstance.isReadOnly);
        ConversationHelper.InitConversation();
        Controls.RequestMissingInvoices.Hide(ProcessInstance.isReadOnly ||
            !Controls.ConversationPane.IsVisible() ||
            Data.GetValue("StatementMatchingStatus__") !== "incompleteMatching");
    }
    LayoutHelper.Init = Init;
    function ShowWaitScreen() {
        showWaitScreen = true;
    }
    LayoutHelper.ShowWaitScreen = ShowWaitScreen;
})(LayoutHelper || (LayoutHelper = {}));
var MatchingHelper;
(function (MatchingHelper) {
    function Run(quietly) {
        LayoutHelper.ShowWaitScreen();
        LayoutHelper.DisableButtons(true, "MatchingInvoices");
        return Lib.AP.StatementMatching.Run()
            .Then((result) => {
            if (result.status === Lib.AP.StatementMatching.Returns.ok) {
                Data.SetValue("StatementStatus__", StatementStatus.toVerify);
                LayoutHelper.DisplayBanner();
                Lib.AP.StatementMatching.UpdateStatementMatchingStatus();
                if (result.counts.extra === 0 || result.counts.unexpectedInvoiceStatus > 0) {
                    // Force OnRefresh raw call has it won't be called by SDK if no line append.
                    // Or it mey be called before the matching ends.
                    Controls.InvoicesTable__.RefreshRows();
                }
            }
            else if (!quietly) {
                if (result.status === Lib.AP.StatementMatching.Returns.missingHeader) {
                    Popup.Alert("_some headers are missing.", false, null, "_warning");
                }
                else if (result.status === Lib.AP.StatementMatching.Returns.missingReferences) {
                    Popup.Alert("_references are missing.", false, null, "_warning");
                }
            }
            Controls.RequestMissingInvoices.Hide(ProcessInstance.isReadOnly ||
                !Controls.ConversationPane.IsVisible() ||
                Data.GetValue("StatementMatchingStatus__") !== "incompleteMatching");
            LayoutHelper.DisableButtons(false, "MatchingInvoices");
        })
            .Catch((error) => {
            LayoutHelper.DisableButtons(false, "MatchingInvoices");
            // Log full error details for developers
            Log.Error("Statement matching failed: " + JSON.stringify(error));
            // Extract a user-friendly error message
            let userMessage = "Unknown error";
            if (error) {
                if (typeof error === "string") {
                    userMessage = error;
                }
                else if (error.message && typeof error.message === "string") {
                    userMessage = error.message;
                }
                else if (error.errorMessage && typeof error.errorMessage === "string") {
                    userMessage = error.errorMessage;
                }
            }
            const isTimeoutError = userMessage.toLowerCase().includes("timeout");
            if (isTimeoutError) {
                Popup.Alert("_Process time too long", true, null, "_Timeout Error");
            }
            else {
                // Show generic user-friendly message without technical details
                Popup.Alert("_An error occurred during statement matching", true, null, "_Unable to complete matching");
            }
        });
    }
    MatchingHelper.Run = Run;
})(MatchingHelper || (MatchingHelper = {}));
var ScriptEvents;
(function (ScriptEvents) {
    function InitializeEventHandlers() {
        Controls.CompanyCode__.OnChange = OnCompanyCodeChange;
        Controls.StatementDate__.OnChange = OnStatementDateChange;
        Controls.VendorNumber__.OnChange = OnVendorNumberChange;
        Controls.VendorName__.OnChange = OnVendorNameChange;
        Controls.InvoicesTable__.OnRefreshRow = OnInvoicesTableRefreshRow;
        Controls.InvoicesTable__.InvoiceAction__.OnClick = function () {
            Process.OpenLink(this.GetRow().InvoiceURL__.GetValue());
        };
        Controls.Refresh.OnClick = function () {
            MatchingHelper.Run(false);
        };
        Controls.Reject.OnClick = function () {
            ProcessInstance.ApproveAsynchronous("reject");
            return false;
        };
        Controls.InvoicesTable__.RefreshRows();
        Controls.RequestMissingInvoices.OnClick = function () {
            let message = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.CustomizeAutomaticMessage", "missingInvoices");
            if (!message) {
                const statementDate = Language.FormatDate(Data.GetValue("StatementDate__"));
                const invoicesList = [];
                const invoicesTableArray = Data.GetTable("InvoicesTable__");
                for (let i = 0; i < invoicesTableArray.GetItemCount(); i++) {
                    const currentItem = invoicesTableArray.GetItem(i);
                    const status = currentItem.GetValue("MatchingStatus__");
                    const invoiceNumber = currentItem.GetValue("ReferenceNumber__");
                    if (invoiceNumber && status === Lib.AP.StatementMatching.Status.unmatched) {
                        const invoiceDate = currentItem.GetValue("ReferenceDate__");
                        const invoiceAmount = currentItem.GetValue("ReferenceAmount__");
                        invoicesList.push(Language.Translate("_Invoice {0} missing date of {1} for amount {2}", false, invoiceNumber, Language.FormatDate(invoiceDate), Language.FormatNumber(invoiceAmount, { shorten: true, numberOfDecimals: 2 })));
                    }
                }
                message = Language.Translate("_Conversation invoices missing for the date: {0}, invoice list: {1}", false, statementDate, invoicesList.join("\n"));
            }
            Controls.ConversationUI__.PrefillMessage(message);
            Controls.ConversationUI__.Focus();
        };
    }
    ScriptEvents.InitializeEventHandlers = InitializeEventHandlers;
    /**
     * event triggered when company code changes
     * @this DatabaseComboBox
     */
    function OnCompanyCodeChange() {
        if (!FormCleaner.IsDataClean()) {
            Popup.Confirm("_This action will delete company code related fields.", false, FormCleaner.AdaptDataToCompanyCode, FormCleaner.RevertCompanyCode, "_Warning");
        }
        else {
            FormCleaner.AdaptDataToCompanyCode();
        }
    }
    /**
     * event triggered when an InvoicesTable__'s row is refreshed
     * @this DatabaseComboBox
     */
    function OnInvoicesTableRefreshRow(rowIndex) {
        const row = Controls.InvoicesTable__.GetRow(rowIndex);
        if (row) {
            ProcessInstance.SetSilentChange(true);
            row.InvoiceDate__.SetWarning("");
            row.InvoiceAmount__.SetWarning("");
            if (row.MatchingStatus__.GetValue() === Lib.AP.StatementMatching.Status.mismatched) {
                if (Sys.Helpers.Date.Date2DBDateTime(row.InvoiceDate__.GetValue()) !==
                    Sys.Helpers.Date.Date2DBDateTime(row.ReferenceDate__.GetValue())) {
                    row.InvoiceDate__.SetWarning("_value mismatches");
                }
                if (row.InvoiceAmount__.GetValue() !== row.ReferenceAmount__.GetValue()) {
                    row.InvoiceAmount__.SetWarning("_value mismatches");
                }
            }
            row.InvoiceAction__.SetDisabled(!row.InvoiceURL__.GetValue());
            ProcessInstance.SetSilentChange(false);
        }
    }
    ScriptEvents.OnInvoicesTableRefreshRow = OnInvoicesTableRefreshRow;
    /**
     * event triggered when an statement date changes
     * @this DatabaseComboBox
     */
    function OnStatementDateChange() {
        function performChanges() {
            FormCleaner.AdaptDataToStatementDate();
            MatchingHelper.Run(true);
        }
        if (!FormCleaner.IsInvoicesTableClean()) {
            Popup.Confirm("_This action will delete statement date related fields.", false, performChanges, FormCleaner.RevertStatementDate, "_Warning");
        }
        else {
            performChanges();
        }
    }
    function OnVendorChange(callback, vendorFilter, isVendorNameChanged) {
        function innerCallback(queryResult) {
            const hasResult = queryResult && !queryResult.GetQueryError() && queryResult.Records && queryResult.Records.length > 0;
            if (!hasResult) {
                if (isVendorNameChanged) {
                    Controls.VendorNumber__.SetValue("");
                }
                else {
                    Controls.VendorName__.SetValue("");
                }
                Controls.VendorCountry__.SetValue("");
                Controls.VendorEmail__.SetValue("");
            }
            else {
                let ind = 0;
                // Interrogate vendor query results if more than 1 result has been returned, set vendor fields below accordingly
                if (queryResult.Records.length > 1) {
                    for (let i = 0; i < queryResult.Records.length; i++) {
                        const formName = Controls.VendorName__.GetValue();
                        const formNumber = Controls.VendorNumber__.GetValue();
                        const queryName = queryResult.GetQueryValue("Name__", i);
                        const queryNumber = queryResult.GetQueryValue("Number__", i);
                        if (formName === queryName && formNumber === queryNumber) {
                            ind = i;
                            break;
                        }
                    }
                }
                Controls.VendorNumber__.SetValue(queryResult.GetQueryValue("Number__", ind));
                Controls.VendorName__.SetValue(queryResult.GetQueryValue("Name__", ind));
                Controls.VendorEmail__.SetValue(queryResult.GetQueryValue("Email__", ind));
                Controls.VendorCountry__.SetValue(queryResult.GetQueryValue("Country__", ind));
            }
            ConversationHelper.InitConversation();
            callback();
            MatchingHelper.Run(true);
            LayoutHelper.DisableButtons(false, "onVendorChange");
        }
        function getVendor(companyCode) {
            if (!companyCode || !vendorFilter) {
                innerCallback();
            }
            else {
                // Vendor can have no company code
                const filter = `(&(|(CompanyCode__=${companyCode})(CompanyCode__=)(!(CompanyCode__=*)))(${vendorFilter}))`;
                const attributes = "Country__|Email__|Name__|Number__";
                Query.DBQuery(
                /* @this QueryResult */
                function () {
                    innerCallback(this.GetQueryValue());
                }, "AP - Vendors__", attributes, filter, null, 20);
            }
        }
        LayoutHelper.ShowWaitScreen();
        LayoutHelper.DisableButtons(true, "onVendorChange");
        if (vendorFilter) {
            getVendor(Data.GetValue("CompanyCode__"));
        }
        else {
            innerCallback();
        }
    }
    /**
     * event triggered when vendor number changes
     * @this DatabaseComboBox
     */
    function OnVendorNumberChange(quietly) {
        const filter = this.GetValue() ? `Number__=${this.GetValue()}` : null;
        function performChanges() {
            OnVendorChange(FormCleaner.AdaptDataToVendorNumber, filter, false);
        }
        if (!quietly && !FormCleaner.IsInvoicesTableClean()) {
            Popup.Confirm("_This action will delete vendor related fields.", false, performChanges, FormCleaner.RevertVendorNumber, "_Warning");
        }
        else {
            performChanges();
        }
    }
    /**
     * event triggered when vendor number changes
     * @this DatabaseComboBox
     */
    function OnVendorNameChange() {
        const filter = this.GetValue() ? `Name__=${this.GetValue()}` : null;
        function performChange() {
            OnVendorChange(FormCleaner.AdaptDataToVendorName, filter, true);
        }
        if (!FormCleaner.IsInvoicesTableClean()) {
            Popup.Confirm("_This action will delete vendor related fields.", false, performChange, FormCleaner.RevertVendorName, "_Warning");
        }
        else {
            performChange();
        }
    }
})(ScriptEvents || (ScriptEvents = {}));
var ConversationHelper;
(function (ConversationHelper) {
    function GetVendorLinkRecord(vendorNumber, companyCode) {
        if (!vendorNumber) {
            return Sys.Helpers.Promise.Reject("No vendor number, cannot find vendor");
        }
        const filtersList = [Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber)];
        if (companyCode) {
            filtersList.push(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode));
        }
        const filter = Sys.Helpers.LdapUtil.FilterAnd(...filtersList);
        const queryParameters = {
            table: "AP - Vendors links__",
            filter,
            attributes: [
                "ShortLogin__"
            ],
            maxRecords: 1
        };
        return Sys.Helpers.Promise.Create((resolve, reject) => {
            Sys.GenericAPI.PromisedQuery(queryParameters)
                .Then((results) => {
                if (results.length >= 1) {
                    const shortLogin = results[0].ShortLogin__;
                    Log.Info(`Vendor short login : ${shortLogin}`);
                    resolve(`${User.accountId}$${shortLogin}`);
                }
                else {
                    reject("Vendor contact not found for the selected vendor.");
                }
            })
                .Catch((reason) => {
                reject(reason);
            });
        });
    }
    function TryToDeleteExistingVendorConversation(vendorLogin) {
        return Sys.Helpers.Promise.Create((resolve, reject) => {
            if (!Variable.GetValueAsString("LastVendorLogin")) {
                resolve(vendorLogin);
                return;
            }
            if (Variable.GetValueAsString("LastVendorLogin") === vendorLogin) {
                reject("The same vendor has been selected so conversations are not updated");
                return;
            }
            Conversation.DeleteParties(Lib.P2P.Conversation.TableName, {
                BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.BusinessPartnerId
            }, (data) => {
                if (data.LastErrorMessage != null) {
                    reject(data.LastErrorMessage);
                }
                else {
                    Log.Info(`Deleted parties: ${data.Count}`);
                    resolve(vendorLogin);
                }
            });
        });
    }
    ConversationHelper.TryToDeleteExistingVendorConversation = TryToDeleteExistingVendorConversation;
    function TryToAddNewVendorConversation(vendorLogin) {
        return Sys.Helpers.Promise.Create((resolve, reject) => {
            if (!Sys.Helpers.IsEmpty(vendorLogin)) {
                const options = Lib.P2P.Conversation.Options.GetVendorStatementMatchingForVendorUser();
                const partyInfo = Lib.P2P.Conversation.ExtendPartyWithVendorBusinessInfo(Lib.P2P.Conversation.InitPartyInfo(options), {
                    BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.BusinessPartnerId,
                    OwnerLogin: vendorLogin,
                    RecipientCompany: Variable.GetValueAsString("VendorRecipientCompany")
                });
                Conversation.AddParty(Lib.P2P.Conversation.TableName, partyInfo, (data) => {
                    if (data.LastErrorMessage != null) {
                        reject(data.LastErrorMessage);
                    }
                    else {
                        Log.Info(`Added vendor party for conversation: ${data.ConversationID}`);
                        ProcessInstance.SetSilentChange(true);
                        Variable.SetValueAsString("LastVendorLogin", vendorLogin);
                        ProcessInstance.SetSilentChange(false);
                        resolve();
                    }
                });
            }
        });
    }
    ConversationHelper.TryToAddNewVendorConversation = TryToAddNewVendorConversation;
    function TryToUpdateExistingInternalConversations() {
        return Sys.Helpers.Promise.Create((resolve, reject) => {
            Conversation.UpdateParties(Lib.P2P.Conversation.TableName, {
                BusinessIdFieldName: Lib.P2P.Conversation.BusinessIdFieldName.OwnerId
            }, {
                RecipientCompany: Data.GetValue("VendorName__")
            }, (data) => {
                if (data.LastErrorMessage != null) {
                    reject(data.LastErrorMessage);
                }
                else {
                    Log.Info(`Updated parties: ${data.Count}`);
                    resolve();
                }
            });
        });
    }
    ConversationHelper.TryToUpdateExistingInternalConversations = TryToUpdateExistingInternalConversations;
    function InitConversation() {
        const vendorEmail = Controls.VendorEmail__.GetValue();
        const vendorNumber = Data.GetValue("VendorNumber__");
        const companyCode = Data.GetValue("CompanyCode__");
        if (vendorEmail && vendorNumber && companyCode) {
            // Get Vendor Link
            GetVendorLinkRecord(vendorNumber, companyCode)
                .Then(TryToDeleteExistingVendorConversation)
                .Then(TryToAddNewVendorConversation)
                .Then(TryToUpdateExistingInternalConversations)
                .Catch(reason => Log.Warn(reason));
            const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({ Options: Lib.P2P.Conversation.defaultOptions }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
            Controls.ConversationUI__.Init(conversationInfo);
        }
        Controls.ConversationPane.Hide(ProcessInstance.isReadOnly || !vendorEmail || !Data.GetValue("RuidEx"));
    }
    ConversationHelper.InitConversation = InitConversation;
})(ConversationHelper || (ConversationHelper = {}));
function main() {
    LayoutHelper.Init();
    ScriptEvents.InitializeEventHandlers();
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.StatementMatching.HTMLScripts.OnHTMLScriptEnd");
}
Sys.Parameters.GetInstance("P2P").IsReady(main);
//# sourceMappingURL=customscript.js.map