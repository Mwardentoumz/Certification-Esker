"use strict";
/* Vendor Invoice Validation script */
//#region TYPINGS
var apSpendingDispatcher = Lib.AP.apSpendingDispatcher;
//#endregion
//#region INVOICE COMPLIANCE
var InvoiceCompliance;
(function (InvoiceCompliance) {
    let complianceInfo = null;
    function Init() {
        complianceInfo = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.GetInvoiceComplianceInformation") || { reject: false };
    }
    InvoiceCompliance.Init = Init;
    function IsCompliant() {
        if (!complianceInfo) {
            Init();
        }
        return !complianceInfo.reject;
    }
    InvoiceCompliance.IsCompliant = IsCompliant;
    function RejectInvoiceIfNotCompliant() {
        const actionName = getActionName();
        const actionType = Data.GetActionType();
        if (!IsCompliant()) {
            // exclude actionType = reprocess unless the user exit activate the auto-reject for all action types
            if (actionName === "" && (actionType === "" || complianceInfo.forAllActionType)) {
                Data.SetValue("RejectReason__", complianceInfo.reason ? complianceInfo.reason : "Invoice is not compliant");
                Data.SetValue("Comment__", complianceInfo.message ? complianceInfo.message : Language.Translate("Invoice doesn't match requirement", false));
                actionAutoReject();
                return true;
            }
            Log.Warn(`Invoice compliance info is marked as 'reject' but this has been ignored for actionName '${actionName}' and actionType '${actionType}'`);
            TouchlessManager.SetException(Lib.AP.TouchlessException.NotCompliant, "Disable touchless as invoice is not compliant");
        }
        return false;
    }
    InvoiceCompliance.RejectInvoiceIfNotCompliant = RejectInvoiceIfNotCompliant;
})(InvoiceCompliance || (InvoiceCompliance = {}));
//#endregion
function canAutomaticallySetAsideWaitingGR() {
    let doNotSetAsideReason = "";
    if (Sys.Parameters.GetInstance("AP").GetParameter("EnableAutomaticSetAside", "0") !== "1") {
        doNotSetAsideReason = "feature not enabled";
    }
    else if (!Data.IsNullOrEmpty("ERPPostingDate__")) {
        doNotSetAsideReason = "ERPPostingDate is set";
    }
    else if (Data.GetValue("InvoiceStatus__") !== Lib.AP.InvoiceStatus.ToVerify) {
        doNotSetAsideReason = "invoice status is not 'To verify'";
    }
    else if (Lib.AP.IsCreditNote()) {
        doNotSetAsideReason = "credit note";
    }
    else if (!Lib.AP.InvoiceType.isPOInvoice() && !Lib.AP.InvoiceType.isPOGLInvoice()) {
        doNotSetAsideReason = "invoice type other than PO/POGL";
    }
    else if (!Lib.AP.GetFirstOrderNumber()) {
        doNotSetAsideReason = "OrderNumber is not defined";
    }
    else if (Data.IsNullOrEmpty("VendorNumber__")) {
        doNotSetAsideReason = "Vendor is not defined";
    }
    else if (!Data.IsNullOrEmpty("CurrentException__")) {
        doNotSetAsideReason = "Exception is defined";
    }
    else if (Data.GetValue("Balance__") <= 0) {
        doNotSetAsideReason = "invoice balanced or already over-invoicing";
    }
    else if (Variable.GetValueAsString("DuplicateCheckResult")) {
        doNotSetAsideReason = "Duplicate invoice detected";
    }
    if (!doNotSetAsideReason) {
        // In 2-way or 3-way match lines there will be no lines added to the invoice if there is no expected amount/qty
        // There may be a line that exists for UDC detection
        let containsPOLines = false;
        if (Data.GetTable("LineItems__").GetItemCount() !== 0) {
            Sys.Helpers.Data.ForEachTableItem("LineItems__", function (lineItem) {
                if (lineItem && Lib.P2P.InvoiceLineItem.IsPOLikeLineItem(lineItem)) {
                    containsPOLines = true;
                }
                return containsPOLines; // if true, stops iterating.
            });
        }
        if (containsPOLines) {
            doNotSetAsideReason = "PO/GR lines exist on invoice. Unable to clearly determine if GR is missing";
        }
    }
    // Allow user exit to override computed value
    const ueIsAutoSetAsideAllowed = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.IsAutoSetAsideWaitingGRAllowed", !doNotSetAsideReason);
    if (typeof ueIsAutoSetAsideAllowed === "boolean") {
        Log.Info(`Computed do not set aside reason: '${doNotSetAsideReason}'. Result of UE: ${ueIsAutoSetAsideAllowed}`);
        return ueIsAutoSetAsideAllowed;
    }
    else if (doNotSetAsideReason) {
        Log.Info(`Do not set aside automatically: ${doNotSetAsideReason}`);
        return false;
    }
    return true;
}
//#region TOUCHLESS MANAGER
var TouchlessManager;
(function (TouchlessManager) {
    let hasExceptions = false;
    let exceptionsByCategory = {};
    let isMismatchExceptionBypassAvailable = false;
    let mismatchContributorsCache = [];
    let exceptionFieldsMapping;
    (function (exceptionFieldsMapping) {
        exceptionFieldsMapping["CompanyIdentificationException"] = "CompanyIdentificationException__";
        exceptionFieldsMapping["DataToConfirm"] = "DataToConfirmException__";
        exceptionFieldsMapping["DuplicateInvoice"] = "DuplicateInvoiceException__";
        exceptionFieldsMapping["InvalidValue"] = "InvalidValueException__";
        exceptionFieldsMapping["InvoiceNotBalanced"] = "InvoiceNotBalanceException__";
        exceptionFieldsMapping["MissingHeader"] = "MissingHeaderException__";
        exceptionFieldsMapping["MissingLineField"] = "MissingLineFieldException__";
        exceptionFieldsMapping["NotCompliant"] = "NotCompliantException__";
        exceptionFieldsMapping["Other"] = "OtherException__";
        exceptionFieldsMapping["PriceMismatch"] = "PriceMismatchException__";
        exceptionFieldsMapping["QuantityMismatch"] = "QuantityMismatchException__";
        exceptionFieldsMapping["UDCException"] = "UDCExceptionException__";
        exceptionFieldsMapping["VendorIdentificationException"] = "VendorIdentificationException__";
        exceptionFieldsMapping["WorkflowError"] = "WorkflowErrorException__";
    })(exceptionFieldsMapping || (exceptionFieldsMapping = {}));
    function Init() {
        hasExceptions = false;
        exceptionsByCategory = {};
        for (const category in Lib.AP.TouchlessException) {
            if (Object.prototype.hasOwnProperty.call(Lib.AP.TouchlessException, category)) {
                exceptionsByCategory[category] = false;
            }
        }
        isMismatchExceptionBypassAvailable =
            Sys.Parameters.GetInstance("AP").GetParameter("AllowTouchlessWithPriceQtyMismatch", "0") === "1" &&
                Lib.AP.IsExceptionResolvedOnLineItemLevel() && Lib.AP.WorkflowCtrl.CurrentStepIsApStart();
        mismatchContributorsCache = [];
    }
    TouchlessManager.Init = Init;
    // Exceptions
    function SerializeExceptions() {
        for (const category in exceptionsByCategory) {
            if (Object.prototype.hasOwnProperty.call(exceptionsByCategory, category)) {
                if (exceptionFieldsMapping[category]) {
                    Data.SetValue(exceptionFieldsMapping[category], exceptionsByCategory[category]);
                }
            }
        }
    }
    TouchlessManager.SerializeExceptions = SerializeExceptions;
    function SetException(category, reason, logAsWarning, byPassException) {
        let byPassCheckbox = !!byPassException;
        const customTouchlessRule = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ByPassTouchlessManagerException", category, reason);
        if ((customTouchlessRule === null || customTouchlessRule === void 0 ? void 0 : customTouchlessRule.byPassException) != null)
            byPassException = customTouchlessRule.byPassException;
        if ((customTouchlessRule === null || customTouchlessRule === void 0 ? void 0 : customTouchlessRule.byPassCheckbox) != null)
            byPassCheckbox = customTouchlessRule.byPassCheckbox;
        if (!byPassException)
            hasExceptions = true;
        if (!byPassCheckbox)
            exceptionsByCategory[category] = true;
        let msg = byPassException ? `Bypassed touchless exception (${category})` : `Set touchless exception (${category})`;
        if (reason) {
            msg += `: ${reason}`;
        }
        if (logAsWarning) {
            Log.Warn(msg);
        }
        else {
            Log.Info(msg);
        }
    }
    TouchlessManager.SetException = SetException;
    /**
     * Determine if the mismatch touchless exception can be by passed
     * @param {Item} item The line item corresponding to the mismatch
     * @param {Lib.AP.TouchlessException} category The mismatch exception category
     * @returns {boolean} Returns true touchless exception can be by passed
     */
    function ShouldByPassMismatchException(item, category) {
        if (isMismatchExceptionBypassAvailable) {
            let mismatchResponsible = null;
            switch (category) {
                case Lib.AP.TouchlessException.PriceMismatch:
                    mismatchResponsible = item.GetValue("PriceMismatchResponsible__");
                    break;
                case Lib.AP.TouchlessException.QuantityMismatch:
                    mismatchResponsible = item.GetValue("QuantityMismatchResponsible__");
                    break;
            }
            if (!Sys.Helpers.IsEmpty(mismatchResponsible)) {
                //Additionnal check to ensure responsible has been added to the workflow
                if (mismatchContributorsCache.includes(mismatchResponsible)) {
                    return true;
                }
                if (Lib.AP.WorkflowCtrl.GetNextContributorOfWorkflowType(GetMismatchExpectedWorkflowType(), mismatchResponsible)) {
                    mismatchContributorsCache.push(mismatchResponsible);
                    return true;
                }
                Log.Warn(`Mismatch responsible '${mismatchResponsible}' not found in the workflow contributors.`);
            }
        }
        return false;
    }
    TouchlessManager.ShouldByPassMismatchException = ShouldByPassMismatchException;
    /**
     * Determine the expected workflow type associated with the current mismatch resolution mode
     * @returns {Lib.AP.WorkflowCtrl.WorkflowType} Returns the mismatch exception wokflow type or null
     */
    function GetMismatchExpectedWorkflowType() {
        // Determine the current resolution mode and expected workflow type associated with it
        if (Lib.AP.IsExceptionResolvedOnLineItemLevel(Lib.AP.ExceptionResolutionMode.LineLevelReview)) {
            return Lib.AP.WorkflowCtrl.WorkflowType.invoiceLineItemExceptionForReviewers;
        }
        else if (Lib.AP.IsExceptionResolvedOnLineItemLevel(Lib.AP.ExceptionResolutionMode.LineLevelApproval)) {
            return Lib.AP.WorkflowCtrl.WorkflowType.invoiceLineItemExceptionForApprovers;
        }
        return null;
    }
    // Validation
    function ValidateRequired() {
        // list all framework required fields and SetException accordingly
        if (!Data.GetValue("CompanyCode__")) {
            SetException(Lib.AP.TouchlessException.CompanyIdentificationException);
        }
        if (!Data.GetValue("VendorNumber__")) {
            SetException(Lib.AP.TouchlessException.VendorIdentificationException);
        }
        if (!Data.GetValue("InvoiceAmount__") && Data.GetValue("InvoiceAmount__") !== 0) {
            SetException(Lib.AP.TouchlessException.MissingHeader);
        }
        if (!Data.GetValue("InvoiceCurrency__") || !Data.GetValue("InvoiceDate__")) {
            SetException(Lib.AP.TouchlessException.MissingHeader);
        }
        validateRequiredForExceptionResolution();
    }
    /**
     * Validates that the vendor contact email is provided when resolving exceptions
     * at the line item level in the invoice approval workflow.
     *
     * If the exception resolution mode is either `LineLevelReview` or `LineLevelApproval`,
     * and there is a next contributor for the invoice line item exception workflow,
     * but the vendor contact email is missing, this function sets a
     * `VendorIdentificationException`.
     *
     * This ensures that the required vendor contact information is present before
     * proceeding with line item level exception handling.
     */
    function validateRequiredForExceptionResolution() {
        // Determine the current resolution mode and expected workflow type associated with it
        const expectedWorkflowType = GetMismatchExpectedWorkflowType();
        if (!expectedWorkflowType) {
            // Feature disabled, nothing to validate
            return;
        }
        // email is required to enter line item level mismatch handling
        const mismatchContributor = Lib.AP.WorkflowCtrl.GetNextContributorOfWorkflowType(expectedWorkflowType);
        if (mismatchContributor && !Data.GetValue("VendorContactEmail__")) {
            SetException(Lib.AP.TouchlessException.VendorIdentificationException);
        }
    }
    function IgnoreLineItem(item) {
        return !item.GetValue("Amount__") && !item.GetValue("Quantity__");
    }
    function IgnoreTableError(tableName, line) {
        if (tableName === "ExtractedLineItems__") {
            return true;
        }
        else if (tableName === "LineItems__") {
            const item = Data.GetTable("LineItems__").GetItem(line);
            if (IgnoreLineItem(item)) {
                return true;
            }
        }
        return false;
    }
    function CheckUncategorizedErrors(category, errors) {
        let nbErrors = errors.nbErrors;
        if (!exceptionsByCategory[category] && errors.tables) {
            for (const table in errors.tables) {
                if (Object.prototype.hasOwnProperty.call(errors.tables, table)) {
                    for (const line in errors.tables[table].rows) {
                        if (IgnoreTableError(table, parseInt(line, 10))) {
                            nbErrors--;
                        }
                    }
                }
            }
        }
        return nbErrors > 0;
    }
    function CheckErrors() {
        if (Data.FormHasError()) {
            const errors = Data.GetFieldsInError(true);
            for (const category in errors) {
                // only deal with known categories, affect others to 'Other'
                if (category && exceptionFieldsMapping[category]) {
                    SetException(category, `errors on form ${JSON.stringify(errors[category])}`);
                }
                else if (CheckUncategorizedErrors(category, errors[category])) {
                    SetException(Lib.AP.TouchlessException.Other, `errors on form ${JSON.stringify(errors[category])}`);
                }
            }
        }
    }
    function CheckData() {
        if (Data.GetValue("InvoiceAmount__") === 0) {
            SetException(Lib.AP.TouchlessException.NotCompliant, "Cannot perform touchless because invoice amount equals to 0.");
        }
        const nbItems = Data.GetTable("LineItems__").GetItemCount();
        if (nbItems === 0) {
            SetException(Lib.AP.TouchlessException.NotCompliant, "Cannot perform touchless because there are no line items.");
        }
        CheckErrors();
        ValidateRequired();
        const customExceptions = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SetTouchlessManagerCustomExceptions");
        if (customExceptions && customExceptions.length > 0) {
            for (const customException of customExceptions) {
                SetException(Lib.AP.TouchlessException.Other, customException);
            }
        }
        if (hasExceptions) {
            Log.Info("Cannot perform touchless because some exceptions have been raised.");
        }
        return !hasExceptions;
    }
    TouchlessManager.CheckData = CheckData;
    // Actions
    /** perform touchless post only if touchless is enabled */
    function DoTouchlessIfEnabled(touchlessForIntercompanyInvoices = false) {
        const touchlessEnabled = Data.GetValue("TouchlessEnabled__");
        if (touchlessEnabled || touchlessForIntercompanyInvoices) {
            Data.SetValue("EnableTouchless", true);
            // Only execute the touchless in the sendCD action
            if (Data.GetValue("State") === 50) {
                // Remove empty lines
                const lineItems = Data.GetTable("LineItems__");
                let itemCount = lineItems.GetItemCount();
                let lineIdx = 0;
                while (lineIdx < itemCount) {
                    const item = lineItems.GetItem(lineIdx);
                    if (IgnoreLineItem(item)) {
                        Log.Info(`Removing empty line item #${lineIdx} before performing touchless`);
                        itemCount = item.RemoveItem();
                    }
                    else {
                        lineIdx++;
                    }
                }
                if (touchlessForIntercompanyInvoices || Lib.AP.ShouldArchiveRoutingAddressMatch()) {
                    Data.SetValue("ManualLink__", true);
                    Log.Info("Touchless : Automatic archiving");
                }
                else {
                    Log.Info("Touchless : Automatic posting");
                }
                actionPost(true);
            }
            return true;
        }
        return false;
    }
    /** return true if touchless is possible (doesn't check if touchless is enabled or not) */
    function TouchlessIsPossible() {
        const invoiceType = Data.GetValue("InvoiceType__");
        if ((Data.GetValue("InvoiceStatus__") !== Lib.AP.InvoiceStatus.ToVerify &&
            Data.GetValue("InvoiceStatus__") !== Lib.AP.InvoiceStatus.SetAside)
            || (invoiceType !== Lib.AP.InvoiceType.PO_INVOICE
                && invoiceType !== Lib.AP.InvoiceType.PO_INVOICE_AS_FI
                && (invoiceType !== Lib.AP.InvoiceType.NON_PO_INVOICE || Sys.Parameters.GetInstance("AP").GetParameter("EnableTouchlessForNonPoInvoice", "0") !== "1"))) {
            SetException(Lib.AP.TouchlessException.NotCompliant);
        }
        return TouchlessManager.CheckData();
    }
    TouchlessManager.TouchlessIsPossible = TouchlessIsPossible;
    function TryTouchless(actionType) {
        if ((actionType === "" || actionType === "reprocess" || actionType === "reprocess_asynchronous") && TouchlessIsPossible()) {
            Data.SetValue("TouchlessPossible__", true);
            const needValidation = Data.GetValue("NeedValidation");
            if (needValidation) {
                SetException(Lib.AP.TouchlessException.NotCompliant, "NeedValidation=1: touchless is disabled");
            }
            else {
                return DoTouchlessIfEnabled();
            }
        }
        return false;
    }
    TouchlessManager.TryTouchless = TryTouchless;
    function TryTouchlessArchiving(actionType, erpInvoiceNumber) {
        if ((actionType === "") && TouchlessManager.CheckData() && Lib.AP.WorkflowCtrl.GetNbRemainingControllers() === 0) {
            Data.SetValue("ERPInvoiceNumber__", erpInvoiceNumber);
            const clearableFields = Lib.AP.GetInvoiceDocument().GetClearableFields(Sys.Helpers.TryGetFunction("Lib.AP.Customization.Common.GetClearableFields"));
            Lib.AP.ClearFieldsForArchiving(clearableFields);
            Log.Info(`Touchless : Automatic archiving under ERP invoice number "${erpInvoiceNumber}"`);
            return DoTouchlessIfEnabled(true);
        }
        return false;
    }
    TouchlessManager.TryTouchlessArchiving = TryTouchlessArchiving;
    function TryAutoPostAfterReview() {
        const allowAutoPost = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.AllowAutoPostAfterReview") !== false;
        if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToPost
            && TouchlessManager.CheckData()
            && allowAutoPost) {
            if (!updatePOTablesAndPost(true, Lib.AP.WorkflowCtrl.GetCurrentStepRole())) {
                return false;
            }
            doAutoApprovalOfRecurringInvoiceIfPossible();
            return true;
        }
        SerializeExceptions();
        return false;
    }
    TouchlessManager.TryAutoPostAfterReview = TryAutoPostAfterReview;
    function TryAutoApproveRecurringInvoice() {
        if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToApprove && TouchlessManager.CheckData()) {
            Lib.AP.GetInvoiceDocument().Create(true);
            doAutoApprovalOfRecurringInvoiceIfPossible();
            return true;
        }
        SerializeExceptions();
        return false;
    }
    TouchlessManager.TryAutoApproveRecurringInvoice = TryAutoApproveRecurringInvoice;
})(TouchlessManager || (TouchlessManager = {}));
//#endregion
//#region BUDGET MANAGER
var ContractSpendingHandler = Lib.Spending.Contract.Handler;
var APContractSpending = Lib.AP.APContractSpending;
var ContractSpendingUpdater = Lib.Spending.Contract.Updater;
var APProjectSpending = Lib.AP.APProjectSpending;
var ProjectSpendingUpdater = Lib.Spending.Project.Updater;
var ProjectSpendingHandler = Lib.Spending.Project.Handler;
apSpendingDispatcher.Register(Lib.AP.apBudgetSpending);
const contractSpendingHandler = new ContractSpendingHandler();
const apContractSpending = new APContractSpending(contractSpendingHandler, new ContractSpendingUpdater(contractSpendingHandler));
apSpendingDispatcher.Register(apContractSpending);
const projectSpendingHandler = new ProjectSpendingHandler();
const apProjectSpending = new APProjectSpending(projectSpendingHandler, new ProjectSpendingUpdater(projectSpendingHandler));
apSpendingDispatcher.Register(apProjectSpending);
//#endregion
//#region DATA VALIDATION
/**
 * @class An helper class to manage the several kinds of line item
 */
const InvoiceLineItem = {
    /**
     * Check the data and set warning if they are not valid
     * @param {Data} item The data of the line to check
     * @param {integer} index The index of the data
     */
    CheckWarning: function (item, index, invoiceType) {
        if ((Lib.P2P.InvoiceLineItem.IsPOLineItem(item) && Lib.P2P.IsPOMatchingEnabled()) || Lib.P2P.InvoiceLineItem.IsPOGLLineItem(item)) {
            this.CheckWarningPO(item, index);
        }
        else if (Lib.P2P.InvoiceLineItem.IsUDCLineItem(item)) {
            this.CheckWarningUDC(item, index);
        }
        if (invoiceType === Lib.AP.InvoiceType.CONSIGNMENT) {
            this.CheckWarningConsignmentVendor(item, index);
        }
        if (item.GetWarning("TaxCode__") === "_Confirm this is the correct tax code") {
            TouchlessManager.SetException(Lib.AP.TouchlessException.DataToConfirm, `Tax code was inferred at line ${index}`);
        }
    },
    /**
     * Check the data of a vendor on line and set warning if they are not valid
     * @param {Data} item The data of the line to check
     * @param {integer} index The index of the data
     */
    CheckWarningConsignmentVendor: function (item, index) {
        if (!Lib.AP.SAP.CheckVendorNumber(item.GetValue("VendorNumber__"))) {
            TouchlessManager.SetException(Lib.AP.TouchlessException.DataToConfirm, `Vendor number on header doesn't match the line ${index}`);
        }
    },
    /**
     * Check the data of an UDC (Unplanned Delivery Cost) line and set warning if a warning is already here (threshold set in extraction script)
     * Or if a keyword is found without amount.
     * @param {Data} item The data of the line to check
     * @param {integer} index The index of the data
     */
    CheckWarningUDC: function (item, index) {
        const Amount = item.GetValue("Amount__");
        if (Sys.Helpers.IsEmpty(Amount)) {
            TouchlessManager.SetException(Lib.AP.TouchlessException.UDCException, `Extracted UDC Area for line with index ${index} not defined.`);
        }
        else if (item.GetWarning("Amount__")) {
            TouchlessManager.SetException(Lib.AP.TouchlessException.UDCException, `${item.GetWarning("Amount__")}. UDC line : ${index}.`);
        }
    },
    /**
     * Check the data of a PO line and set warning if they are not valid
     * @param {Item} item The data of the line to check
     * @param {number} index The index of the data
     */
    CheckWarningPO: function (item, index) {
        if (item.GetValue("OrderNumber__")) {
            function SetMismatchTouchlessException(category, reason) {
                const byPassException = TouchlessManager.ShouldByPassMismatchException(item, category);
                TouchlessManager.SetException(category, reason, false, byPassException);
            }
            const netAmount = item.GetValue("Amount__");
            const customCheck = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.CustomPOItemAmountCheck", item);
            if (customCheck === true) {
                SetMismatchTouchlessException(Lib.AP.TouchlessException.PriceMismatch, `Amount out of tolerance with expected amount ${index}`);
            }
            else if (customCheck === false) {
                item.SetWarning("Amount__", "");
            }
            else {
                if (netAmount > 0) {
                    //Check warnings: amount > expected or amount > open or custom check
                    const openAmount = item.GetValue("OpenAmount__");
                    const mismatchAmount = item.GetValue("MismatchAmount__");
                    if (mismatchAmount > 0) {
                        SetMismatchTouchlessException(Lib.AP.TouchlessException.PriceMismatch, `Amount exceeds expected amount on line ${index}`);
                    }
                    else if (netAmount > openAmount) {
                        SetMismatchTouchlessException(Lib.AP.TouchlessException.PriceMismatch, `Amount exceeds open amount on line ${index}`);
                    }
                    else if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.AdditionalPOItemAmountCheck", item)) {
                        SetMismatchTouchlessException(Lib.AP.TouchlessException.PriceMismatch, `Amount out of tolerance with expected amount ${index}`);
                    }
                    else {
                        item.SetWarning("Amount__", "");
                    }
                }
            }
            //Check warnings: quantity > expected or quantity > open
            const openQuantity = item.GetValue("OpenQuantity__");
            const quantity = item.GetValue("Quantity__");
            const expectedQuantity = item.GetValue("ExpectedQuantity__");
            if (quantity > expectedQuantity) {
                SetMismatchTouchlessException(Lib.AP.TouchlessException.QuantityMismatch, `Quantity exceeds expected quantity on line ${index}`);
            }
            else if (quantity > openQuantity) {
                SetMismatchTouchlessException(Lib.AP.TouchlessException.QuantityMismatch, `Quantity exceeds open quantity on line ${index}`);
            }
            else {
                item.SetWarning("Quantity__", "");
            }
            //Check warnings: invoiced unit price !== unit price (with tolerance)
            if (!item.IsNullOrEmpty("UnitPrice__")) {
                const invoicedUnitPrice = item.GetValue("InvoicedUnitPrice__");
                const unitPrice = item.GetValue("UnitPrice__");
                const lineEmpty = item.IsNullOrEmpty("Amount__") && item.IsNullOrEmpty("Quantity__") && item.IsNullOrEmpty("InvoicedUnitPrice__");
                if (!lineEmpty && !Lib.AP.IsUnitPriceWithinTolerance(invoicedUnitPrice, unitPrice)) {
                    SetMismatchTouchlessException(Lib.AP.TouchlessException.PriceMismatch, `Invoice unit price differs from unit price on line ${index}`);
                }
                else {
                    item.SetWarning("InvoicedUnitPrice__", "");
                }
            }
        }
    }
};
// CustomDimension1__ -> Z_CustomDimension_1_Code__
function resolveCustomDimensionFormField(fieldName) {
    const customDimMatch = /^CustomDimension(\d+)__$/.exec(fieldName);
    return customDimMatch ? `Z_CustomDimension_${customDimMatch[1]}_Code__` : fieldName;
}
function manageStoredinLocalTableFields(storedInLocalTableFields) {
    for (const field in storedInLocalTableFields.Header) {
        const resolvedFieldName = resolveCustomDimensionFormField(field);
        const isStoredInLocal = storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.Header[field]);
        if (!isStoredInLocal) {
            Data.SetAllowTableValuesOnly(resolvedFieldName, false);
            if (Data.GetError(resolvedFieldName) === Language.Translate("This information does not match the table data.", false)) {
                Data.SetError(resolvedFieldName, "");
            }
        }
    }
    const lineItems = Data.GetTable("LineItems__");
    const nbItems = lineItems.GetItemCount();
    for (let i = 0; i < nbItems; i++) {
        const item = lineItems.GetItem(i);
        for (const field in storedInLocalTableFields.LineItems__) {
            const resolvedFieldName = resolveCustomDimensionFormField(field);
            const isStoredInLocal = storedInLocalTableFields.isStoredInLocalTable(storedInLocalTableFields.LineItems__[field]);
            if (isStoredInLocal) {
                continue;
            }
            item.SetAllowTableValuesOnly(resolvedFieldName, false);
            if (item.GetError(resolvedFieldName) === Language.Translate("This information does not match the table data.", false)) {
                item.SetError(resolvedFieldName, "");
            }
        }
    }
}
function validateBalance() {
    const balance = Data.GetValue("Balance__");
    const threshold = parseFloat(Variable.GetValueAsString("BalanceThreshold"));
    if (balance === 0) {
        Data.SetCategorizedError("Balance__", "", "");
    }
    else if (Math.abs(balance) <= threshold) {
        TouchlessManager.SetException(Lib.AP.TouchlessException.InvoiceNotBalanced, `Balance not null (${balance}) but in tolerance.`);
    }
    else {
        Data.SetCategorizedError("Balance__", Lib.AP.TouchlessException.InvoiceNotBalanced, "_Balance is not null");
        Log.Info("Balance is not valid");
        return false;
    }
    Log.Info("Balance is valid");
    return true;
}
function validateHeader(requiredFields) {
    let isValid = true;
    for (const field in requiredFields.Header) {
        if (requiredFields.isRequired(requiredFields.Header[field]) && !Data.GetValue(field) && Data.GetValue(field) !== 0) {
            Data.SetCategorizedError(field, Lib.AP.TouchlessException.MissingHeader, "This field is required!");
            isValid = false;
        }
    }
    if (Data.GetWarning("ExtractedIBAN__")) {
        // warning on ExtractedIBAN__ should prevent touchless
        TouchlessManager.SetException(Lib.AP.TouchlessException.VendorIdentificationException, "Extracted IBAN does not match any of vendor's bank detail");
    }
    if (!isValid) {
        Log.Info("Header is not valid");
    }
    return isValid;
}
function validateLineItems(requiredFields) {
    let isValid = true;
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    const invoiceType = Data.GetValue("InvoiceType__");
    const currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    const poUpdateAlreadyDone = Transaction.Read(Lib.ERP.Invoice.transaction.keys.poUpdate) === Lib.ERP.Invoice.transaction.values.afterUpdate;
    const isERPConnected = invoiceDoc.IsConnectedAPIAvailable("POHeader");
    const invoiceTypesRequiringPOLineUpdate = (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() && invoiceType !== Lib.AP.InvoiceType.PO_INVOICE)
        || (invoiceType === Lib.AP.InvoiceType.PO_INVOICE && Lib.P2P.IsPOMatchingEnabled());
    // Check if all GL Account are filled
    const lineItems = Data.GetTable("LineItems__");
    const nbItems = lineItems.GetItemCount();
    if (nbItems <= 0) {
        isValid = false;
    }
    else if (currentRole === Lib.AP.WorkflowCtrl.roles.apStart
        && !Data.GetValue("ERPPostingDate__")
        && invoiceTypesRequiringPOLineUpdate
        && (!isERPConnected || invoiceType === Lib.AP.InvoiceType.PO_INVOICE_AS_FI)
        && !poUpdateAlreadyDone) {
        // Update PO lines data and check if AP should revalidate them
        isValid = !Lib.AP.PurchaseOrder.UpdateExpectedValuesOnPOLine();
        if (!isValid) {
            TouchlessManager.SetException(Lib.AP.TouchlessException.DataToConfirm, "Line items have been updated from master data, revalidation required.");
        }
    }
    for (let i = 0; i < nbItems; i++) {
        const item = lineItems.GetItem(i);
        isValid = validateLineItemsItem(requiredFields, item, i, invoiceType) && isValid;
    }
    Log.Info(`LineItems are${isValid ? "" : " not"} valid`);
    return isValid;
}
function validateLineItemsItem(requiredFields, item, index, invoiceType) {
    let isValid = true;
    // Validate all the required fields
    for (const field in requiredFields.LineItems__) {
        if (requiredFields.isRequired(requiredFields.LineItems__[field], item) && !item.GetValue(field)) {
            item.SetCategorizedError(field, Lib.AP.TouchlessException.MissingLineField, "This field is required!");
            isValid = false;
        }
    }
    // Validate all others fields with more complex validation
    switch (invoiceType) {
        case Lib.AP.InvoiceType.NON_PO_INVOICE:
        case Lib.AP.InvoiceType.DOWNPAYMENT_INVOICE:
        case Lib.AP.InvoiceType.CONSIGNMENT:
        case Lib.AP.InvoiceType.PO_INVOICE:
        case Lib.AP.InvoiceType.PO_INVOICE_AS_FI:
            isValid = Lib.AP.GetInvoiceDocument().ValidateLineItem(item) && isValid;
            InvoiceLineItem.CheckWarning(item, index, invoiceType);
            break;
        default:
            Log.Warn(`Unsupported invoice type '${invoiceType}'`);
            isValid = false;
            break;
    }
    return isValid;
}
function isFormInError(actionName) {
    if (actionName === "Post") {
        // Reset the duplicate check results (the user may have changed values that invalidates the duplicates)
        Variable.SetValueAsString("DuplicateCheckResult", "");
    }
    if (Lib.P2P.FormHasError()) {
        return true;
    }
    Log.Info("Form is not in error");
    return false;
}
/** Check if any duplicate invoices exist
 * Fill the variable DuplicateCheckResult with all the duplicates found
 * @return true if no duplicate, false if at least one duplicate found
 */
function duplicateCheck(actionType) {
    if (actionType !== "" && actionType !== "reprocess" && actionType !== "reprocess_asynchronous") {
        /** Check for duplicates only on submission or reprocess - done client side in other cases **/
        return true;
    }
    // Disable DuplicateCheck if invoice was already posted
    if (Data.GetValue("ERPPostingDate__")) {
        Log.Info("No duplicate check after posting invoice");
        return true;
    }
    const duplicateKeyControls = ["CompanyCode__", "VendorNumber__"];
    const controlsToCheck = ["InvoiceNumber__", "InvoiceDate__", "InvoiceAmount__"];
    const queryOptions = {
        // 16 months to cover a fiscal year
        MaxDateRangeInDays: 480,
        DateRangeFieldName: "InvoiceDate__",
        SortOnControlName: "InvoiceDate__",
        SearchInArchive: true,
        AdditionalAttributes: ["InvoiceStatus__", "OwnerId"],
        CustomFilter: ""
    };
    const invoiceRef = Lib.AP.ParseInvoiceDocumentNumber(Data.GetValue("InvoiceReferenceNumber__"), true);
    if (invoiceRef && invoiceRef.documentNumber) {
        if (!invoiceRef.isFI) {
            Log.Info(`PO Invoice reference detected: ignore ${Data.GetValue("InvoiceReferenceNumber__")} from duplicate check`);
            queryOptions.CustomFilter += `(!(ERPMMInvoiceNumber__=${Data.GetValue("InvoiceReferenceNumber__")}))`;
        }
        else {
            Log.Info(`Non-PO Invoice reference detected: ignore ${Data.GetValue("InvoiceReferenceNumber__")} from duplicate check`);
            queryOptions.CustomFilter += `(!(ERPInvoiceNumber__=${Data.GetValue("InvoiceReferenceNumber__")}))`;
        }
    }
    const duplicates = Lib.DuplicateCheck.CheckDuplicate(duplicateKeyControls, controlsToCheck, queryOptions, parseInt(Data.GetValue("DuplicateCheckAlertLevel__"), 10));
    if (duplicates.length > 0) {
        // Add login of the OwnerId to the AdditionalAttributes
        const cacheOwnerLogin = {};
        for (const duplicateItem of duplicates) {
            let login = cacheOwnerLogin[duplicateItem.additionalAttributes.OwnerId];
            if (!login) {
                const owner = Users.GetUser(duplicateItem.additionalAttributes.OwnerId);
                if (owner) {
                    const ownerVars = owner.GetVars();
                    login = ownerVars.GetValue_String("Login", 0);
                }
                else {
                    Log.Warn(`User not found: ${duplicateItem.additionalAttributes.OwnerId}`);
                    login = Language.Translate("User not found", false);
                }
            }
            duplicateItem.additionalAttributes.OwnerLogin = login;
            Log.Verbose(`DuplicateCheckResult : ${JSON.stringify(duplicates)}`);
        }
        Variable.SetValueAsString("DuplicateCheckResult", JSON.stringify(duplicates));
        TouchlessManager.SetException(Lib.AP.TouchlessException.DuplicateInvoice);
    }
    else {
        Variable.SetValueAsString("DuplicateCheckResult", "");
    }
    return duplicates.length === 0;
}
function disableTableValuesOnlyInApprovalWkf(force = false) {
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.AppendUncheckedHeaderAndLineItemsFieldsDuringApproval");
    // No need to check database combo boxes values when data was already posted successfully or when action does not require validation
    if (force || Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.approver || Data.GetValue("ERPPostingDate__")) {
        Sys.Helpers.Data.SetAllowTableValuesOnlyForFields(Lib.AP.UncheckedHeaderFieldsDuringApproval, false, Data);
        Sys.Helpers.Data.SetAllowTableValuesOnlyForColumns("LineItems__", Lib.AP.UncheckedLineItemsFieldsDuringApproval, false);
    }
}
function retryScript(errorMsg, maxTry) {
    const scriptRetriesAllowed = Process.GetScriptMaxRetryCount() !== 0;
    Process.AllowScriptRetries(true);
    if (Process.GetScriptRetryCount() < Process.GetScriptMaxRetryCount() - 1 && Process.GetScriptRetryCount() < maxTry) {
        Log.Error(errorMsg + " retry number " + Process.GetScriptRetryCount());
        // Generate an exception for script to retry
        throw Language.Translate("_csv import currently running_retry", false);
    }
    else {
        Process.AllowScriptRetries(scriptRetriesAllowed);
        Data.SetError("ERPInvoiceNumber__", Language.Translate("_csv import currently running_max retry reached", false));
        Process.PreventApproval();
    }
}
function checkCSVDataImport() {
    if (Variable.GetValueAsString("BlockPostIfCSVImport") === "1") {
        Log.Info("PO tables will be updated, we will check if no CSV data import are running");
        let query = Process.CreateQueryAsProcessAdmin();
        let POHeadersSubject = "*__PurchaseorderHeaders__*.csv'";
        let POItemsSubject = "*__PurchaseorderItems__*.csv'";
        let subjectUE = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.CheckCSVImportsParams");
        if (subjectUE) {
            POHeadersSubject = subjectUE.POHeadersSubject || POHeadersSubject;
            POItemsSubject = subjectUE.POItemsSubject || POItemsSubject;
        }
        let filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("Subject", POHeadersSubject), Sys.Helpers.LdapUtil.FilterEqual("Subject", POItemsSubject)), Sys.Helpers.LdapUtil.FilterEqual("CmdLineCommand", "CSV Import V3"), Sys.Helpers.LdapUtil.FilterNotEqual("State", "70"), Sys.Helpers.LdapUtil.FilterStrictlyLesser("State", "100")).toString();
        query.SetSpecificTable("CL");
        query.SetAttributesList("*");
        query.SetFilter(filter);
        query.SetOptionEx("Limit=1");
        if (query.MoveFirst()) {
            let transport = query.MoveNext();
            if (transport) {
                let vars = transport.GetUninheritedVars();
                Log.Info("An import is currently running on table : " + vars.GetValue_String("Subject", 0));
                let maxTry = 1;
                if (subjectUE && subjectUE.maxTry >= 0) {
                    maxTry = subjectUE.maxTry;
                }
                retryScript("A csv import is currently running, postpone invoice post.", maxTry);
                return false;
            }
            Log.Info("No csv data import are running");
        }
        else {
            Log.Error("Couldn't retrieve csv data imports currently running - MoveFirst failed: " + query.GetLastErrorMessage());
        }
    }
    return true;
}
function validateSupplier() {
    // For only posting action, we want to re-validate the supplier, to avoid posting an invoice with a non-compliant supplier.
    if (!Data.GetValue("ERPLinkingDate__") && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0) {
        let result;
        result = Lib.P2P.tryGetFirstVendorRecord(Data.GetValue("CompanyCode__"), "Number__", Data.GetValue("VendorNumber__"));
        if (result) {
            const lifecycleStatus = result.LifeCycleStatusCode__;
            const lifecycleComment = result.LifeCycleComment__;
            Variable.SetValueAsString("VendorLifeCycleStatusCode", lifecycleStatus);
            Variable.SetValueAsString("VendorLifeCycleComment", lifecycleComment);
        }
    }
    const lifeCycleStatus = Variable.GetValueAsString("VendorLifeCycleStatusCode");
    const lifeCycleComment = Variable.GetValueAsString("VendorLifeCycleComment");
    if (lifeCycleStatus === Lib.P2P.VendorLifeCycleStatus.DISABLED) {
        // vendor with disabled life cycle should prevent touchless
        const exceptionMessage = `Cannot post invoice because vendor is disabled.${lifeCycleComment ? " Reason: " + lifeCycleComment : ""}`;
        TouchlessManager.SetException(Lib.AP.TouchlessException.VendorIdentificationException, exceptionMessage);
        return false;
    }
    return true;
}
/** Validate extended withholding tax base amounts (server-side mirror of client-side RefreshExtendedWHTAmounts)
 * Ensures WHTBaseAmount__ is neither empty nor zero when WHT type/code are set.
 * This prevents touchless posting with invalid WHT data after server-side reconciliation (e.g. checkGoodsReceipt).
 * @return {boolean} true if all WHT rows are valid
 */
function validateExtendedWithholdingTax() {
    const withholdingTaxParameter = Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "");
    if (withholdingTaxParameter !== "Extended") {
        return true;
    }
    let isValid = true;
    const whtTable = Data.GetTable("ExtendedWithholdingTax__");
    for (let idx = 0; idx < whtTable.GetItemCount(); idx++) {
        const item = whtTable.GetItem(idx);
        if (!Lib.AP.validateWHTItem(item)) {
            isValid = false;
        }
    }
    return isValid;
}
/** Check all Data on the form so that the user can see all errors on post back
 * @param {string} actionName The name of the action the user requested
 * @param {string} actionType The type of button the user clicked
 * @return {Promise<boolean>} resolve to true if the form is valid (i.e. ready to post)
 */
function validateData(actionName, actionType) {
    // Ensure corporate discount amount is calculated for all scenarios (manual edit, extraction, etc.)
    Lib.AP.UpdateCorporateEstimatedDiscountAmount();
    const requiredFields = Lib.AP.GetInvoiceDocument().GetRequiredFields(Sys.Helpers.TryGetFunction("Lib.AP.Customization.Common.GetRequiredFields"));
    manageStoredinLocalTableFields(Lib.AP.GetInvoiceDocument().GetStoredInLocalTableFields());
    let isValid = Data.GetValue("ManualLink__");
    if (!isValid) {
        isValid = duplicateCheck(actionType);
        isValid = validateBalance() && isValid;
        isValid = validateHeader(requiredFields) && isValid;
        isValid = validateLineItems(requiredFields) && isValid;
        isValid = validateSupplier() && isValid;
        isValid = validateExtendedWithholdingTax() && isValid;
    }
    if (isValid) {
        disableTableValuesOnlyInApprovalWkf(false);
        isValid = !isFormInError(actionName);
    }
    const wkfExceptionError = Data.GetError("CurrentException__");
    const wkfException = Data.GetValue("CurrentException__");
    const nextRole = Lib.AP.WorkflowCtrl.GetNextStepRole();
    if (!isValid && !wkfExceptionError && wkfException && nextRole && nextRole !== Lib.AP.WorkflowCtrl.roles.approver) {
        // A valid exception is set, and there is someone next in the workflow
        Log.Warn("In exception workflow: ignore errors and continue with the action");
        // reset the touchless manager as all previously logged exceptions are not accurate
        TouchlessManager.Init();
        isValid = true;
    }
    if (!Lib.AP.WorkflowCtrl.workflowUI.ValidateContributors()) {
        TouchlessManager.SetException(Lib.AP.TouchlessException.WorkflowError, "invalid contributors detected in workflow", true);
        isValid = false;
    }
    // ERP compliance
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    const erpCompliant = invoiceDocument.ValidateData(actionName, actionType);
    if (!erpCompliant) {
        TouchlessManager.SetException(Lib.AP.TouchlessException.NotCompliant, "invoice not compliant with ERP validation");
        isValid = false;
    }
    // Down-payment invoices - ERPInvoiceNumber is required
    if (Lib.AP.ShouldArchiveDownpaymentInvoice() && Data.IsNullOrEmpty("ERPInvoiceNumber__")) {
        TouchlessManager.SetException(Lib.AP.TouchlessException.NotCompliant, "ERP does not support post of downpayment invoices");
        if (actionName === "Post" && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0) {
            Data.SetRequired("ERPInvoiceNumber__", true);
            isValid = false;
        }
    }
    const promisifiedIsValid = checkScheduledInvoiceIsPossible().Then((isPossible) => {
        if (!isPossible) {
            isValid = false;
            TouchlessManager.SetException(Lib.AP.TouchlessException.WorkflowError, "invalid contributors detected in workflow", true);
        }
        const customIsValid = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnValidateForm", isValid);
        if (typeof customIsValid === "boolean") {
            if (customIsValid && !isValid) {
                // reset the touchless manager as all previously logged exceptions are not accurate
                TouchlessManager.Init();
            }
            else if (!customIsValid && isValid) {
                TouchlessManager.SetException(Lib.AP.TouchlessException.Other, "OnValidateForm customization raised an exception");
            }
            return Sys.Helpers.Promise.Resolve(customIsValid);
        }
        else if (Sys.Helpers.Promise.IsIPromise(customIsValid)) {
            return customIsValid.Then(newIsValid => {
                if (newIsValid && !isValid) {
                    // reset the touchless manager as all previously logged exceptions are not accurate
                    TouchlessManager.Init();
                }
                else if (!newIsValid && isValid) {
                    TouchlessManager.SetException(Lib.AP.TouchlessException.Other, "OnValidateForm customization raised an exception");
                }
                return Sys.Helpers.Promise.Resolve(newIsValid);
            });
        }
        return Sys.Helpers.Promise.Resolve(isValid);
    });
    return promisifiedIsValid;
}
//#endregion
//#region AL FOR LINE ITEMS
function autoLearnLineItems() {
    if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.DeactivateAutoLearnForLineItems") === true) {
        Log.Info("Auto-learn for line items is deactivated by customization.");
        return;
    }
    const itemsTable = Data.GetTable("LineItems__");
    if (Variable.GetValueAsString("LineItemsSorted") === "true") {
        /** If the table has been sorted, modifying the line order, and this is reported in the AL table,
         * it makes the AL fail. In that case, we don't touch this table so that the AL stays as performant
         * as it has been for this document.
         */
        Log.Info("Line items table has been sorted: do not report its contents in the extracted line items table.");
        return;
    }
    const count = itemsTable.GetItemCount();
    const customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.GetCustomFieldsForALLineItems") || [];
    const fields = ["OrderNumber__", "DeliveryNote__", "PartNumber__", "InvoicedUnitPrice__", "Amount__", "Quantity__", ...customFields];
    const fieldsMapping = { InvoicedUnitPrice__: "UnitPriceExtracted__" };
    // Get Line Items lines
    const lines = getLines(itemsTable, count, fields);
    // Sort by area top to bottom
    lines.sort((line1, line2) => line1.top - line2.top);
    // Feed the Extracted Line Items table
    const { extractedDNArea, extractedDNValue } = feedExtractedLineItemsTable(lines, fields, count, fieldsMapping);
    // Feed the Extracted Header Fields
    if (extractedDNArea) {
        Data.SetValue("HeaderDNExtracted__", extractedDNArea, extractedDNValue, true);
    }
    else {
        Data.SetValue("HeaderDNExtracted__", extractedDNValue, true);
    }
}
function feedExtractedLineItemsTable(lines, fields, count, fieldsMapping) {
    var _a;
    let extractedDNArea = null;
    let extractedDNValue = null;
    const extractedLineItems = Data.GetTable("ExtractedLineItems__");
    extractedLineItems.SetItemCount(count);
    for (let i = 0; i < count; i++) {
        const line = lines[i];
        const extractedLineItem = extractedLineItems.GetItem(i);
        for (const field of fields) {
            const area = line[field].area;
            const value = line[field].value;
            const extractedFieldName = (_a = fieldsMapping === null || fieldsMapping === void 0 ? void 0 : fieldsMapping[field]) !== null && _a !== void 0 ? _a : field.replace("__", "Extracted__");
            if (area) {
                extractedLineItem.SetValue(extractedFieldName, area, value, true);
            }
            else {
                extractedLineItem.SetValue(extractedFieldName, value, true);
            }
            if (field === "DeliveryNote__") {
                if (extractedDNValue === null) {
                    extractedDNValue = value;
                    extractedDNArea = area;
                }
                else if (extractedDNValue !== value) {
                    extractedDNValue = "";
                    extractedDNArea = null;
                }
            }
        }
    }
    return {
        extractedDNArea: extractedDNArea,
        extractedDNValue: extractedDNValue
    };
}
function getLines(table, itemCount, fields) {
    const lines = [];
    for (let i = 0; i < itemCount; i++) {
        const item = table.GetItem(i);
        const line = { top: 0 };
        for (const field of fields) {
            line[field] = {};
            line[field].value = item.GetValue(field);
            line[field].area = item.GetArea(field);
            if (!line.top && line[field].area) {
                line.top = line[field].area.y;
            }
        }
        lines.push(line);
    }
    return lines;
}
function saveUDCPositions() {
    const itemsTable = Data.GetTable("LineItems__"), nbItems = itemsTable.GetItemCount();
    const keywordsUpdated = [];
    for (let i = 0; i < nbItems; i++) {
        const item = itemsTable.GetItem(i);
        const keyword = item.GetValue("Keyword__");
        if (keyword && Lib.P2P.InvoiceLineItem.IsGLLineItem(item)) {
            const finalArea = { xDiff: 0, yDiff: 0, width: 0, height: 0, page: 0 }, amountArea = item.GetArea("Amount__"), keywordArea = item.GetArea("Keyword__");
            if (amountArea && keywordArea) {
                finalArea.xDiff = amountArea.x - keywordArea.x;
                finalArea.yDiff = amountArea.y - keywordArea.y;
                finalArea.width = amountArea.width;
                finalArea.height = amountArea.height;
                finalArea.page = amountArea.page;
                if (!item.IsComputed("Amount__") && keywordsUpdated.indexOf(keyword) === -1) {
                    const tableName = "P2P - UDC area__", companyCode = Data.GetValue("CompanyCode__"), vendorNumber = Data.GetValue("VendorNumber__"), filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("Keyword__", keyword)).toString(), attributes = [
                        { name: "CompanyCode__", value: companyCode },
                        { name: "VendorNumber__", value: vendorNumber },
                        { name: "Keyword__", value: keyword },
                        { name: "Area__", value: JSON.stringify(finalArea) }
                    ];
                    keywordsUpdated.push(keyword);
                    Sys.Helpers.Database.AddOrModifyTableRecord(tableName, filter, attributes);
                }
            }
        }
    }
}
//#endregion
//#region SAVE PARAMETERS
function saveTemplate() {
    Process.PreventApproval();
    Log.Info(`Saving coding template '${Data.GetValue("CodingTemplate__")}'`);
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    invoiceDoc.SaveTemplateForGLInvoice(Lib.AP.Parameters.LineItemsPatternTable.CodingTemplate);
}
//#endregion
//#region Proof of concept
// FYI : We add a cache to skip query with variable IsARecurringInvoice
// But if you implement the query as owner API to make feature work by using approvers context
// You have to remove this cache to make query every time needed
// And you have to replace QueryAsProcessAdmin with the API implemented QueryAsOwner
function isARecurringInvoice() {
    let _isARecurringInvoice = Variable.GetValueAsString("IsARecurringInvoice") === "1";
    if (_isARecurringInvoice) {
        return true;
    }
    const invoiceDate = Data.GetValue("InvoiceDate__");
    // Compute invoice date to deacrease amount of month
    // Return date computed to local date string
    function computePreviousDate(currentDate, monthToDecrease) {
        const resultDate = new Date(currentDate);
        const day = resultDate.getDate();
        resultDate.setDate(1);
        resultDate.setMonth(resultDate.getMonth() + 1 - monthToDecrease);
        resultDate.setDate(0);
        const maxMonthDay = resultDate.getDate();
        if (day < maxMonthDay) {
            resultDate.setDate(day);
        }
        return resultDate.toLocaleDateString();
    }
    const invoiceDateArrayToCheck = [
        computePreviousDate(invoiceDate, 2),
        computePreviousDate(invoiceDate, 1)
    ];
    function checkAndCleanInvoiceDate(_invoiceDate) {
        let indexToRemove = -1;
        for (let i = 0; i < invoiceDateArrayToCheck.length; i++) {
            if (invoiceDateArrayToCheck[i] === _invoiceDate.toLocaleDateString()) {
                indexToRemove = i;
                break;
            }
        }
        if (indexToRemove >= 0) {
            invoiceDateArrayToCheck.splice(indexToRemove, 1);
            if (invoiceDateArrayToCheck.length === 0) {
                _isARecurringInvoice = true;
            }
        }
    }
    // Build query
    const DBFastAccess = 0x00210000;
    const DBDirtyRead = 0x00020000;
    const query = Process.CreateQueryAsProcessAdmin();
    query.Reset();
    query.SetSpecificTable("CDNAME#Vendor invoice");
    const ldapFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("State", "100"), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceAmount__", Data.GetValue("InvoiceAmount__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceCurrency__", Data.GetValue("InvoiceCurrency__")));
    query.SetFilter(ldapFilter.toString());
    query.SetAttributesList("RUIDEX,InvoiceDate__");
    query.SetSortOrder("InvoiceDate__ DESC");
    query.SetOptionEx("Limit=2");
    query.SetOptionEx("FastSearch=1");
    query.SetOptions(DBFastAccess | DBDirtyRead);
    query.SetSearchInArchive(false);
    if (query.MoveFirst()) {
        let record = query.MoveNext();
        while (record) {
            const vars = record.GetUninheritedVars();
            const recordInvoiceDateObj = vars.GetValue_Date("InvoiceDate__", 0);
            checkAndCleanInvoiceDate(recordInvoiceDateObj);
            record = query.MoveNext();
        }
    }
    Variable.SetValueAsString("IsARecurringInvoice", _isARecurringInvoice ? "1" : "0");
    return _isARecurringInvoice;
}
//#endregion
/** Statistics on the form **/
//#region
// FYI : we update the field EstimatedLatePaymentDays__ to determine if the workflow end date
function predictWorkflowEndDate() {
    const dueDate = Data.GetValue("DueDate__");
    if (!Lib.AP.WorkflowCtrl.workflowUI.IsEnded() && dueDate) {
        const callback = function (result, error) {
            if (error || !result.endProcessingDate) {
                Log.Warn("Worflow end prediction error : " + error);
            }
            else {
                const workflowEndPredictionDate = Sys.Helpers.Date.ISOSTringToDate(result.endProcessingDate);
                const delta = (workflowEndPredictionDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24);
                Data.SetValue("EstimatedLatePaymentDays__", delta);
            }
        };
        Lib.AP.WorkflowEndPrediction.Prediction(callback);
    }
    else {
        Data.SetValue("EstimatedLatePaymentDays__", "");
    }
}
//#endregion
/** ******* **/
/** ACTIONS **/
/** ******* **/
//#region
const headerFieldsListForRecognitionStatistics = [
    "CompanyCode__",
    "InvoiceAmount__",
    "InvoiceCurrency__",
    "InvoiceDate__",
    "InvoiceNumber__",
    "OrderNumber__",
    "VendorName__",
    "VendorNumber__"
];
const lineItemsFieldsListForRecognitionStatistics = [
    "Amount__",
    "Quantity__",
    "TaxAmount__",
    "TaxCode__"
];
function actionByDefault() {
    if (!InvoiceCompliance.RejectInvoiceIfNotCompliant()) {
        actionTryTouchless(false);
    }
}
function actionByDefaultOnInvalidData() {
    resetAndAddRightToCorrectAP();
    if (!TouchlessManager.CheckData()) {
        TouchlessManager.SerializeExceptions();
    }
    if (canAutomaticallySetAsideWaitingGR()) {
        actionAutoSetAside();
    }
}
function actionReject() {
    Lib.AP.WorkflowCtrl.DoAction("reject");
}
function actionAutoReject() {
    Lib.AP.WorkflowCtrl.DoAction("autoReject");
}
function actionSetAside() {
    Lib.AP.WorkflowCtrl.DoAction("setAside");
    const currDate = new Date();
    Data.SetValue("SetAsideDate__", currDate);
    Log.Info(`Set Aside Date Updated to: ${currDate}`);
    const asideReason = Data.GetValue("AsideReason__");
    const shouldCheckGoodsReceiptByDefault = asideReason === String(Lib.AP.AsideReason.WaitingForGR);
    const shouldCheckGoodsReceipt = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ShouldCheckGoodsReceiptOnSetAside", shouldCheckGoodsReceiptByDefault);
    if (shouldCheckGoodsReceipt !== null && shouldCheckGoodsReceipt !== void 0 ? shouldCheckGoodsReceipt : shouldCheckGoodsReceiptByDefault) {
        checkGoodsReceipt();
    }
    else {
        Process.PreventApproval();
    }
}
function actionAutoSetAside() {
    Log.Info("automatically set invoice aside waiting GR...");
    Data.SetValue("AsideReason__", String(Lib.AP.AsideReason.WaitingForGR));
    Data.SetValue("AutomaticallySetAside__", true);
    Data.SetValue("SetAsideDate__", new Date());
    Variable.SetValueAsString("FRB2BCDVOnHoldType", Sys.FRB2B.AP.OnHoldCDVType.NothingToDeclare);
    Lib.AP.WorkflowCtrl.DoAction("setAside");
}
function actionSetOnHold() {
    Lib.AP.WorkflowCtrl.DoAction("onHold");
}
function actionProposeEarlyPayment() {
    var _a;
    const vendorName = Data.GetValue("VendorName__");
    const varsScheduleActionParams = JSON.parse(Variable.GetValueAsString("ScheduledActionParameters"));
    // shorLogin stands for vendorLogin. vendorLogin is built as follow: {accountId}${shortLogin}
    const shortLogin = varsScheduleActionParams.shortLogin || Variable.GetValueAsString("shorLogin");
    // Comment workflow
    const culture = Lib.P2P.GetValidatorOrOwner().GetValue("Culture");
    const dateLimit = (_a = Sys.Helpers.Date.ToLocaleDateEx(Data.GetValue("DiscountLimitDate__"), culture)) !== null && _a !== void 0 ? _a : Data.GetValue("DiscountLimitDate__");
    const discountAmount = `${parseFloat(Data.GetValue("EstimatedDiscountAmount__"))} ${Data.GetValue("InvoiceCurrency__")}`;
    if (!shortLogin) {
        Log.Error("Add to workflow: Can't retrieve vendor's shortLogin data");
    }
    else {
        const estimatedDiscountAmount = Data.GetValue("EstimatedDiscountAmount__");
        let localEstimatedDiscountAmount = "";
        const exchangeRate = parseFloat(Data.GetValue("ExchangeRate__"));
        const numericEstimatedDiscountAmount = parseFloat(`${estimatedDiscountAmount}`);
        if (!isNaN(exchangeRate) && !isNaN(numericEstimatedDiscountAmount)) {
            localEstimatedDiscountAmount = new Sys.Decimal(numericEstimatedDiscountAmount).mul(exchangeRate).toNumber();
        }
        Lib.AP.TryToUpdateEstimatedDiscountAmount(estimatedDiscountAmount, localEstimatedDiscountAmount);
        // Discount infos
        const obj = { shortLogin, vendorName, discountAmount, dateLimit };
        Variable.SetValueAsString("DiscountParameters", JSON.stringify(obj));
        let isEnded = false;
        const worfklow = Lib.AP.WorkflowCtrl.workflowUI;
        if (worfklow.IsEnded()) {
            isEnded = true;
            Data.SetValue("LastArchiveEditionDate__", new Date());
            Data.SetValue("LastArchiveEditor__", shortLogin);
            const editor = {
                login: shortLogin,
                emailAddress: Data.GetValue("VendorContactEmail__"),
                displayName: vendorName,
                isGroup: false,
                startingDate: Lib.AP.WorkflowCtrl.getOwnershipDate(true, shortLogin)
            };
            Lib.AP.WorkflowCtrl.UpdateAndAddPostWorkflowContributor(editor, Lib.AP.WorkflowCtrl.roles.vendor, "proposeEarlyPayment", Language.CreateLazyTranslation("_{0} discount applied to payment before {1}", discountAmount, dateLimit));
        }
        else {
            Lib.AP.WorkflowCtrl.DoAction("proposeEarlyPayment");
        }
        // Export xml of VIP updated
        Lib.AP.InvoiceExporter.ExportIfNeeded(Lib.AP.WorkflowCtrl.roles.vendor, isEnded);
    }
}
function actionAutocomplete() {
    //Only perform autocomplete action when Invoice is To verify to avoid breaking something in other cases
    const invoiceStatus = Data.GetValue("InvoiceStatus__");
    if (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() && !Data.GetValue("ERPPostingDate__") && (invoiceStatus === Lib.AP.InvoiceStatus.ToVerify || invoiceStatus === Lib.AP.InvoiceStatus.SetAside)) {
        Log.Info("[actionAutoComplete] Execute 'autocomplete' action");
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        // Check if PO lines should be reloaded before reconciliation (user exit)
        if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Extraction.Reconciliation.ShouldReloadAllPOLines") === true) {
            reloadAllPOLines(invoiceDoc);
        }
        //Do not display Reconcile warning
        Variable.SetValueAsString("ReconciledByHeader", "false");
        invoiceDoc.ReconcileInvoice();
        invoiceDoc.UpdateBalance();
        Lib.AP.WorkflowCtrl.Rebuild(true, true, "autocomplete");
    }
    else {
        Log.Info("[actionAutoComplete] Autocomplete cannot be performed");
    }
    Process.PreventApproval();
}
function reloadAllPOLines(invoiceDoc) {
    const orderNumber = Data.GetValue("OrderNumber__");
    if (Sys.Helpers.IsEmpty(orderNumber)) {
        Log.Warn("[reloadAllPOLines] No order number found, cannot reload PO lines");
        return;
    }
    Log.Info("[reloadAllPOLines] Clearing existing line items and reloading PO lines from ERP");
    Data.GetTable("LineItems__").SetItemCount(0);
    const checkGRResult = invoiceDoc.CheckGoodsReceipt(invoiceDoc);
    if (checkGRResult && checkGRResult.orderNumbers.length > 0) {
        Log.Info("[reloadAllPOLines] " + checkGRResult.orderNumbers.length + " PO(s) have been loaded");
    }
    else {
        Log.Warn("[reloadAllPOLines] No PO lines found for POs: " + orderNumber);
    }
}
function actionReprocess() {
    apSpendingDispatcher.AsInvoiceReset();
    resetAndAddRightToCorrectAP();
    actionByDefault();
}
function resetAndAddRightToCorrectAP() {
    if (Variable.GetValueAsString("forwardToCorrectAP") === "1") {
        Process.ResetRights();
        // Set rights to the new owner
        Process.SetRight(Data.GetValue("OwnerId"), "read");
        // Remove the creator owner's rights to the document they created
        Data.SetValue("CreatorOwnerID", "");
        Variable.SetValueAsString("forwardToCorrectAP", "0");
    }
}
function doAutoPostAfterReviewIfPossible(roleBeforePost) {
    if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowAutoPostAfterReview", "0") === "1" &&
        roleBeforePost === Lib.AP.WorkflowCtrl.roles.controller &&
        Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToPost &&
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.DeactivateAutoPostAfterReview") !== true) {
        Process.RecallScript("autoPostAfterReview");
    }
}
function getRecurrentInvoiceForContributorFilter() {
    return Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceAmount__", Data.GetValue("InvoiceAmount__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceCurrency__", Data.GetValue("InvoiceCurrency__")), Sys.Helpers.LdapUtil.FilterEqual("User__", Data.GetValue("OwnerID")), Sys.Helpers.LdapUtil.FilterEqual("NextInvoiceDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("InvoiceDate__")))).toString();
}
function updateRecurrentInvoiceNextDate() {
    const nextDate = Data.GetValue("InvoiceDate__");
    nextDate.setMonth(nextDate.getMonth() + 1);
    Sys.Helpers.Database.ModifyTableRecord("S2P - Recurring Invoice Approval__", getRecurrentInvoiceForContributorFilter(), [
        { name: "NextInvoiceDate__", value: Sys.Helpers.Date.Date2DBDate(nextDate) }
    ]);
}
function isRecurrentInvoiceForCurrentContributor() {
    const result = {
        isRecurrentInvoice: false,
        shouldAutoApprove: false
    };
    const recordVars = Sys.Helpers.Database.GetFirstRecordResult("S2P - Recurring Invoice Approval__", getRecurrentInvoiceForContributorFilter(), "*");
    if (recordVars) {
        result.isRecurrentInvoice = true;
        result.shouldAutoApprove = recordVars.GetValue_Long("AutomaticProcessing__", 0) === 1;
    }
    return result;
}
function doAutoApprovalOfRecurringInvoiceIfPossible() {
    const currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    if (Sys.Parameters.GetInstance("AP").GetParameter("RecurringInvoiceDetection", "0") === "1" &&
        currentRole === Lib.AP.WorkflowCtrl.roles.approver &&
        Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToApprove) {
        const recurrenceInfos = isRecurrentInvoiceForCurrentContributor();
        if (recurrenceInfos.isRecurrentInvoice) {
            // invoice is already tagged as recurrent
            // update next invoice date to keep the recuurence mecanism even if not auto approval should be performed
            updateRecurrentInvoiceNextDate();
            if (recurrenceInfos.shouldAutoApprove) {
                Process.RecallScript("autoApproveRecurringInvoice");
            }
        }
        else {
            // invoice is not tagged as recurrent in table, verify against previous matching invoice
            const isRecurrent = isARecurringInvoice();
            if (isRecurrent) {
                Variable.SetValueAsString("RecurringInvoiceAutoValidation", "prompt");
            }
        }
    }
}
function checkScheduledInvoiceIsPossible() {
    // skip all obvious cases that billing schedules when billing schedules are not mandatory
    const isPosted = Boolean(Data.GetValue("ERPPostingDate__"));
    if (isPosted ||
        !Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments() ||
        Data.IsNullOrEmpty("BillingScheduleID__")) {
        return Sys.Helpers.Promise.Resolve(true);
    }
    return Lib.P2P.BillingSchedule.VIPValidateIfFullyMatched()
        .Then((result) => {
        if (Lib.P2P.BillingSchedule.VIPHasError()) {
            Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(false);
            TouchlessManager.SetException(Lib.AP.TouchlessException.InvalidValue, Lib.P2P.BillingSchedule.GetVIPTranslatedErrorMessage() || "Billing schedule validation fails.");
            Lib.AP.WorkflowCtrl.Rebuild(true, false, "billingScheduleUpdated");
            return Sys.Helpers.Promise.Resolve(false);
        }
        Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(result.withinTolerance, "billingScheduleUpdated");
        return Sys.Helpers.Promise.Resolve(true);
    });
}
function handleERPPostingRetry() {
    if (!Data.IsNullOrEmpty("ERPPostingError__") &&
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SAP.ShouldRetryERPIntegration") === true) {
        if (Process.GetScriptRetryCount() < Process.GetScriptMaxRetryCount() - 1) {
            Log.Info(`[handleERPPostingRetry] ShouldRetryERPIntegration user exit returned true, retrying ERP posting.`);
            throw new Error("ERP posting retry requested by ShouldRetryERPIntegration user exit.");
        }
        Log.Info(`[handleERPPostingRetry] ShouldRetryERPIntegration user exit returned true but max retry count reached, skipping retry.`);
    }
}
function updatePOTablesAndPost(touchless, role) {
    var _a;
    const erpInvoice = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.CustomizeInvoiceERPManagerOnUpdateTablesAndPost")) !== null && _a !== void 0 ? _a : Lib.AP.GetInvoiceDocument();
    let shouldUpdateTables = (Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.DeactivateLocalPOTableUpdates") !== true)
        && erpInvoice.ShouldUpdateLocalPOTable()
        && !Data.GetValue("ERPPostingDate__")
        && (role === Lib.AP.WorkflowCtrl.roles.apStart || role === Lib.AP.WorkflowCtrl.roles.apEnd)
        && Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.controller
        && Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.apEnd
        && ((Lib.AP.InvoiceType.isPOInvoice() && Lib.P2P.IsPOMatchingEnabled()) || Lib.AP.InvoiceType.isPOGLInvoice())
        && !(erpInvoice.IsPostConnected() && Data.GetValue("ERPPostingError__"));
    if (shouldUpdateTables && !checkCSVDataImport()) {
        return false;
    }
    // Post invoice into the ERP (send xml)
    erpInvoice.Create(touchless);
    if (erpInvoice.IsPostConnected()) {
        handleERPPostingRetry();
    }
    shouldUpdateTables = shouldUpdateTables && !(erpInvoice.IsPostConnected() && Data.GetValue("ERPPostingError__"));
    Log.Info("[updatePOTablesAndPost] shouldUpdateTables : " + shouldUpdateTables);
    // update local master data as soon as possible when AP post in generic mode
    // In SAP (connected) mode, the ERPPostingError is set in real time, if ERPPostingError is set, an error occured
    // In Generic (not connected) mode, the ERPPostingError is update on ERP Ack and can show a previous error
    if (shouldUpdateTables) {
        if (Transaction.Read(Lib.ERP.Invoice.transaction.keys.post) === Lib.ERP.Invoice.transaction.values.afterPost &&
            Transaction.Read(Lib.ERP.Invoice.transaction.keys.poUpdate) !== Lib.ERP.Invoice.transaction.values.afterUpdate) {
            let shouldUpdateVendorNumber = erpInvoice.ShouldUpdateVendorNumberOnPOHeaderAndItems();
            const customShouldUpdateVendorNumber = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnShouldUpdateVendorNumberOnPOHeaderAndItems", shouldUpdateVendorNumber);
            if (typeof customShouldUpdateVendorNumber === "boolean") {
                shouldUpdateVendorNumber = customShouldUpdateVendorNumber;
            }
            Lib.AP.TablesUpdater.Update(false, shouldUpdateVendorNumber);
            Transaction.Write(Lib.ERP.Invoice.transaction.keys.poUpdate, Lib.ERP.Invoice.transaction.values.afterUpdate);
        }
        else {
            Log.Warn("Redis key poUpdate == afterUpdate => PO have already been updated, do not impact again.");
        }
    }
    return true;
}
function actionPostAfterDuplicateCheckIgnored(touchless) {
    Lib.AP.WorkflowCtrl.DoAction("duplicateCheckIgnored");
    return actionPost(touchless);
}
function getPOUsersWithReadRights(orderNumber) {
    const companyCode = Data.GetValue("CompanyCode__");
    const poFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("OrderNumber__", orderNumber), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode)).toString();
    const poTransport = Lib.P2P.QueryPurchasingTransport("Purchase order", poFilter, "*", true);
    if (!poTransport) {
        Log.Info("No purchase order found for order number '" + orderNumber + "' and company code '" + companyCode + "'");
        return [];
    }
    const poExternalVars = poTransport.GetExternalVars();
    const rawUsersWithReadRights = poExternalVars === null || poExternalVars === void 0 ? void 0 : poExternalVars.GetValue_String("UsersWithReadRights__", 0);
    if (Sys.Helpers.IsEmpty(rawUsersWithReadRights)) {
        Log.Info("No UsersWithReadRights__ found on purchase order '" + orderNumber + "' (checked external variables)");
        return [];
    }
    try {
        const usersWithReadRights = JSON.parse(rawUsersWithReadRights);
        if (!Array.isArray(usersWithReadRights) || usersWithReadRights.length === 0) {
            Log.Info("UsersWithReadRights__ is empty on purchase order '" + orderNumber + "'");
        }
        return Array.isArray(usersWithReadRights) ? usersWithReadRights.filter((item) => typeof item === "string") : [];
    }
    catch (e) {
        Log.Error("Invalid UsersWithReadRights__ value on purchase order '" + orderNumber + "': " + e);
        return [];
    }
}
function giveReadRightToPOUsersOnInvoice() {
    const headerOrderNumbers = Data.GetValue("OrderNumber__");
    if (Sys.Helpers.IsEmpty(headerOrderNumbers)) {
        return;
    }
    const usersWithReadRights = new Set();
    const poNumbers = headerOrderNumbers
        .split(",")
        .map((orderNumber) => orderNumber.trim())
        .filter((orderNumber) => !Sys.Helpers.IsEmpty(orderNumber));
    poNumbers.forEach((orderNumber) => {
        getPOUsersWithReadRights(orderNumber).forEach((userLogin) => {
            const normalizedUserLogin = userLogin.trim();
            if (!Sys.Helpers.IsEmpty(normalizedUserLogin)) {
                usersWithReadRights.add(normalizedUserLogin);
            }
        });
    });
    if (usersWithReadRights.size > 0) {
        Log.Verbose("Give read rights on invoice to PO users: " + Array.from(usersWithReadRights).join(", "));
        usersWithReadRights.forEach((userLogin) => {
            Process.SetRight(userLogin, "read");
        });
    }
}
function giveReadRightToBillingSheduleContributors() {
    const billingScheduleMsnEx = Variable.GetValueAsString("BillingScheduleMsnEx");
    if (!Sys.Helpers.IsEmpty(billingScheduleMsnEx) && !Sys.Helpers.IsEmpty(Data.GetValue("BillingScheduleID__"))) {
        const contributors = Lib.P2P.BillingSchedule.GetBillingScheduleContributors(billingScheduleMsnEx);
        if (contributors && contributors.length > 0) {
            Log.Info("Giving rights read to billing schedule contributors");
            Lib.AP.WorkflowCtrl.GiveRightReadToExtraUsers(contributors);
        }
    }
}
function SetupEReportingVariables(alreadyReported = false) {
    if (Data.GetValue("IsFlux10_1Compliant__") === true) {
        Sys.FRB2B.AP.SetEReportingVIPExternalVars();
        Data.SetValue("Flux10_1_ModifiedSinceLastExport__", alreadyReported);
    }
}
function actionPost_SetLine(roleBeforePost) {
    setLineItemsCount();
    if (Sys.Parameters.GetInstance("AP").GetParameter("AutolearningOnPOLines", "0") === "1" &&
        roleBeforePost === Lib.AP.WorkflowCtrl.roles.apStart) {
        if (Lib.AP.InvoiceType.isPOInvoice() || Lib.AP.InvoiceType.isPOGLInvoice()) {
            autoLearnLineItems();
        }
        else {
            // Do not autolearn Non-PO Invoice line items
            Data.GetTable("ExtractedLineItems__").SetItemCount(0);
        }
    }
}
function AddValidatedByAgent(comment) {
    const prefix = Language.Translate("_ValidatedByAgent", false);
    const trimmedComment = (comment !== null && comment !== void 0 ? comment : "").trim();
    if (!trimmedComment) {
        return prefix;
    }
    if (trimmedComment.startsWith(prefix)) {
        return trimmedComment;
    }
    return `${prefix} - ${trimmedComment}`;
}
function actionPost_FillAutomaticFields() {
    if (getActionName() === "submitAutomatically") {
        const validator = Users.GetUser(Data.GetValue("ValidationOwnerID"));
        Data.SetValue("LastValidatorName__", validator.GetValue("DisplayName"));
        Data.SetValue("LastValidatorUserId__", validator.GetValue("Login"));
        Data.SetValue("Comment__", Language.Translate("_Invoice approved from email", false));
    }
    else if (Data.GetValue("ApprovedByAgent__")) {
        Data.SetValue("Comment__", AddValidatedByAgent(Data.GetValue("Comment__")));
        Data.SetValue("ApprovedByAgent__", false);
    }
}
function actionPost_CodingPredition() {
    // Codings prediction
    if (!Data.GetValue("ERPPostingError__") && Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() && Sys.Parameters.GetInstance("AP").GetParameter("APCodingsPrediction", "0") === "1") {
        const enableCodingsPrediction = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.EnableCodingsPrediction")
            || { "enablePrediction": true, "enableMLDataCreation": true };
        if (enableCodingsPrediction.enableMLDataCreation) {
            const formDataToWS = Lib.AP.PredictionAPI.GetFormData();
            const options = {
                CompanyCode: Data.GetValue("CompanyCode__"),
                PartnerId: Data.GetValue("VendorNumber__"),
                ValidateData: JSON.stringify(formDataToWS)
            };
            const codingsPredictionData = Variable.GetValueAsString("codingsPredictionData");
            if (codingsPredictionData) {
                options.OverrideInputData = codingsPredictionData;
            }
            try {
                Process.CreateMLDataTableRecord(options);
                Log.Info("[CreateMLDataTableRecord] - New record for the next version of the codings prediction model");
            }
            catch (e) {
                Log.Error("[CreateMLDataTableRecord] " + e);
            }
            // we don't need raw line items data anymore, so delete it
            Variable.SetValueAsString("codingsPredictionData", "");
        }
    }
}
function actionPost_HandleBillingScheduleRecord(roleBeforePost) {
    if (Data.GetValue("ContractReferenceNumber__") &&
        Data.GetValue("ContractNumber__") &&
        Data.GetValue("BillingScheduleID__") &&
        Data.GetValue("BillingScheduleInstallment__") &&
        roleBeforePost === Lib.AP.WorkflowCtrl.roles.apStart &&
        Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.controller &&
        Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.apEnd) {
        Lib.P2P.BillingSchedule.UpdateBillingScheduleRecordFromInvoice({
            VICompanyCode: Data.GetValue("CompanyCode__"),
            VIVendorNumber: Data.GetValue("VendorNumber__"),
            VIContractReferenceNumber: Data.GetValue("ContractReferenceNumber__"),
            VIContractNumber: Data.GetValue("ContractNumber__"),
            VIBillingSchedule: Data.GetValue("BillingScheduleID__"),
            VIBillingScheduleInstallment: Data.GetValue("BillingScheduleInstallment__"),
            VIRUIDEX: Data.GetValue("RUIDEx"),
            VIInvoiceNumber: Data.GetValue("InvoiceNumber__"),
            VIInvoiceDate: Data.GetValue("InvoiceDate__"),
            VIInvoiceAmount: Data.GetValue("LocalInvoiceAmount__"),
            VIInvoiceNetAmount: Data.GetValue("LocalNetAmount__")
        });
    }
    // Give read right to billing schedule contributors if a billing schedule was found
    giveReadRightToBillingSheduleContributors();
}
function actionPost(touchless) {
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.OnBeforeActionPost", touchless);
    Lib.AP.ERPAcknowledgment.SetSynchronousCustomERPAckReceived(false);
    if (Variable.GetValueAsString("ForceSecondPosting") === "true") {
        Log.Warn("New post forced by user, remove post, clear external variable ForceSecondPosting");
        Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
        Variable.SetValueAsString("ForceSecondPosting", "");
    }
    const roleBeforePost = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    //Check condition before workflow values change after post
    const postOriginalInvoiceFromCreditMemo = needToPostOriginalInvoiceFromCreditMemo(roleBeforePost);
    actionPost_SetLine(roleBeforePost);
    actionPost_FillAutomaticFields();
    SetupEReportingVariables();
    if (!updatePOTablesAndPost(touchless, roleBeforePost)) {
        return false;
    }
    giveReadRightToPOUsersOnInvoice();
    saveUDCPositions();
    actionPost_CodingPredition();
    saveInvoiceAsRecurrent(roleBeforePost);
    doAutoPostAfterReviewIfPossible(roleBeforePost);
    doAutoApprovalOfRecurringInvoiceIfPossible();
    if (roleBeforePost === Lib.AP.WorkflowCtrl.roles.apStart) {
        FillModifiedFieldsCounters();
        GiveVisibilityToContractOwner();
    }
    actionPost_HandleBillingScheduleRecord(roleBeforePost);
    if (postOriginalInvoiceFromCreditMemo) {
        PostOriginalInvoiceFromCreditMemo();
    }
    return true;
}
function needToPostOriginalInvoiceFromCreditMemo(roleBeforePost) {
    if (isLineItemLevelExceptionResolutionEnabled()) {
        const alreadyPosted = Lib.AP.IsInArchivingMode() && !Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP();
        const isApStartOrApEnd = (roleBeforePost === Lib.AP.WorkflowCtrl.roles.apStart || roleBeforePost === Lib.AP.WorkflowCtrl.roles.apEnd);
        const isNoMoreController = Lib.AP.WorkflowCtrl.GetNextStepRole() !== Lib.AP.WorkflowCtrl.roles.controller;
        const isInvoiceFirstPost = (isApStartOrApEnd && !alreadyPosted && isNoMoreController);
        const isCreditMemoWithRelatedInvoice = Lib.AP.IsCreditNote() && !Data.IsNullOrEmpty("RelatedInvoiceRuidEx__");
        return (isInvoiceFirstPost && isCreditMemoWithRelatedInvoice);
    }
    return false;
}
function PostOriginalInvoiceFromCreditMemo() {
    const relatedInvoiceRuidex = Data.GetValue("RelatedInvoiceRuidEx__");
    const transport = findRecordfromRuidex(relatedInvoiceRuidex);
    if (transport) {
        const vars = transport.GetUninheritedVars();
        const state = vars.GetValue_Long("State", 0);
        const invoiceStatus = vars.GetValue_String("InvoiceStatus__", 0);
        const asideReason = vars.GetValue_String("AsideReason__", 0);
        const msnex = vars.GetValue_String("MsnEx", 0);
        const isOnHold = invoiceStatus === Lib.AP.InvoiceStatus.OnHold;
        const isWaitingForCreditMemo = asideReason === Lib.AP.AsideReason.WaitingForCreditMemo || asideReason === Sys.FRB2B.AP.MapStandardToFRB2BOnHoldReasons.WaitingForCreditMemo;
        if (state === 70 && isOnHold && isWaitingForCreditMemo) {
            if (Lib.AP.isCreditNoteMatchingOriginalInvoice(vars.GetValue_Double("InvoiceClaimedAmount__", 0))) {
                const scheduledAction = new Lib.CallScheduledAction.ScheduledAction();
                scheduledAction.msnEx = msnex;
                scheduledAction.actionName = "continueAfterCreditMemo";
                const isSuccess = Lib.CallScheduledAction.executeAction(vars, scheduledAction, transport, true);
                if (!isSuccess) {
                    Log.Warn("Failed to post original invoice from credit memo, " +
                        `Related invoice VIP msnEx: '${msnex}', ` +
                        `State: '${state}'`);
                }
            }
            else {
                Log.Warn("The credit memo amount does not match the claimed amount, the state of the invoice does not change, " +
                    `Related invoice VIP msnEx: '${msnex}'`);
            }
        }
        else {
            Log.Warn("Failed to post original invoice from credit memo, " +
                `Related invoice VIP msnEx: '${msnex}', ` +
                `State: '${state}', ` +
                `InvoiceStatus: '${invoiceStatus}', ` +
                `AsideReason: '${asideReason}'`);
        }
    }
    else {
        Log.Warn(`Failed to post original invoice from credit memo, invoice '${relatedInvoiceRuidex}' not retrieved`);
    }
}
function isLineItemLevelExceptionResolutionEnabled() {
    const exceptionResolutionMode = Sys.Parameters.GetInstance("AP").GetParameter("ExceptionResolutionMode", Lib.AP.ExceptionResolutionMode.Header);
    return exceptionResolutionMode === Lib.AP.ExceptionResolutionMode.LineLevelApproval || exceptionResolutionMode === Lib.AP.ExceptionResolutionMode.LineLevelReview;
}
function findRecordfromRuidex(ruidex) {
    if (ruidex) {
        Query.Reset();
        Query.SetAttributesList("MSN,ProcessID,ContainerFlag,State,WaitingForUpdate,OwnerId,OwnerPb,MainAccountId,RuidEx,MsnEx,InvoiceStatus__,AsideReason__,ProcessStatus__,LastSavedDateTime,ValidityDateTime,InvoiceClaimedAmount__");
        Query.SetSearchInArchive(true);
        Query.SetOptionEx("DoNotGetLocalDBFiles=1");
        Query.SetOptionEx("Limit=1");
        Query.SetSearchInArchive(false);
        Query.SetOptionEx("FastSearch=1");
        Query.SetSpecificTable("CDNAME#Vendor invoice");
        Query.SetFilter(Sys.Helpers.LdapUtil.FilterEqual("RUIDEX", ruidex).toString());
        if (Query.MoveFirst()) {
            return Query.MoveNext();
        }
        else {
            Log.Error("findRecordfromRuidex - MoveFirst failed: " + Query.GetLastErrorMessage());
        }
    }
    else {
        Log.Error("findRecordfromRuidex - no ruidex specified");
    }
    return null;
}
function setLineItemsCount() {
    const lineItems = Data.GetTable("LineItems__");
    Data.SetValue("LineItemsCount__", lineItems.GetItemCount());
}
function saveInvoiceAsRecurrent(role) {
    if (Sys.Parameters.GetInstance("AP").GetParameter("RecurringInvoiceDetection", "0") === "1" &&
        role === Lib.AP.WorkflowCtrl.roles.approver) {
        const autoValidateRecurrentInvoice = Variable.GetValueAsString("RecurringInvoiceAutoValidation");
        if (autoValidateRecurrentInvoice === "true" || autoValidateRecurrentInvoice === "false") {
            const automaticProcessing = autoValidateRecurrentInvoice === "true";
            const nextDate = Data.GetValue("InvoiceDate__");
            nextDate.setMonth(nextDate.getMonth() + 1);
            const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceAmount__", Data.GetValue("InvoiceAmount__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceCurrency__", Data.GetValue("InvoiceCurrency__")), Sys.Helpers.LdapUtil.FilterEqual("User__", Data.GetValue("ValidationOwnerID"))).toString();
            Sys.Helpers.Database.AddOrModifyTableRecord("S2P - Recurring Invoice Approval__", filter, [
                { name: "CompanyCode__", value: Data.GetValue("CompanyCode__") },
                { name: "VendorNumber__", value: Data.GetValue("VendorNumber__") },
                { name: "InvoiceAmount__", value: Data.GetValue("InvoiceAmount__") },
                { name: "InvoiceCurrency__", value: Data.GetValue("InvoiceCurrency__") },
                { name: "AutomaticProcessing__", value: automaticProcessing },
                { name: "NextInvoiceDate__", value: Sys.Helpers.Date.Date2DBDate(nextDate) },
                { name: "User__", value: Data.GetValue("ValidationOwnerID") }
            ]);
            Variable.SetValueAsString("RecurringInvoiceAutoValidation", "");
        }
    }
}
function FillModifiedFieldsCounters() {
    // Allow customization to extend the tracked fields lists
    const customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.GetCustomFieldsForRecognitionStatistics") || {};
    const headerFields = [...headerFieldsListForRecognitionStatistics, ...(customFields.header || [])];
    const lineItemFields = [...lineItemsFieldsListForRecognitionStatistics, ...(customFields.lineItems || [])];
    // Fill the fields that counts the fields modifications
    const headerStatistics = Sys.Helpers.Data.GetRecognitionStatisticsFromFieldsList(headerFields, Data, false);
    const lineItemsStatistics = Sys.Helpers.Data.GetRecognitionStatisticsFromFieldsListInTable("LineItems__", lineItemFields, false);
    Data.SetValue("ManuallyModifiedFieldsCount__", headerStatistics.ManuallyModifiedFields + lineItemsStatistics.ManuallyModifiedFields);
    Data.SetValue("AutomaticallyModifiedFieldsCount__", headerStatistics.AutomaticallyModifiedFields + lineItemsStatistics.AutomaticallyModifiedFields);
}
function GiveVisibilityToContractOwner() {
    const originalContractRUIDEX = Data.GetValue("OriginalContractRUIDEX__");
    if (originalContractRUIDEX) {
        const queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("OriginalContractRUIDEX__", originalContractRUIDEX), Sys.Helpers.LdapUtil.FilterEqual("ContractStatus__", "Active"));
        const table = "CDNAME#P2P - Contract";
        const ContractQueryOptions = {
            table,
            filter: queryFilter.toString(),
            attributes: [
                "OwnerLogin__"
            ],
            maxRecords: 1,
            additionalOptions: {
                searchInArchive: true
            }
        };
        Sys.GenericAPI.PromisedQuery(ContractQueryOptions)
            .Then(result => {
            if (result.length === 0) {
                Log.Error(`No contract with originalContractRUIDEX:'${originalContractRUIDEX}' and status Active found.`);
            }
            else {
                Process.AddRight(result[0].OwnerLogin__, "read");
            }
        });
    }
}
function actionAdminListApprove() {
    const roleBeforePost = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    const validator = Users.GetUser(Data.GetValue("ValidationOwnerID"));
    const validatorVars = validator.GetVars();
    Data.SetValue("LastValidatorName__", validatorVars.GetValue_String("DisplayName", 0));
    Data.SetValue("LastValidatorUserId__", validatorVars.GetValue_String("Login", 0));
    Data.SetValue("Comment__", Data.GetValue("ValidationMessage"));
    Lib.AP.GetInvoiceDocument().Create(false);
    giveReadRightToPOUsersOnInvoice();
    doAutoPostAfterReviewIfPossible(roleBeforePost);
    doAutoApprovalOfRecurringInvoiceIfPossible();
}
function actionBackToPrevious() {
    if (Lib.AP.WorkflowCtrl.BackToPreviousPossible()) {
        Data.SetValue("CurrentAttachmentFlag__", Attach.GetNbAttach());
        Lib.AP.WorkflowCtrl.DoAction("backToPrevious");
    }
    else {
        Process.PreventApproval();
    }
}
function actionBackToAP() {
    const currentStep = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    if (currentStep === Lib.AP.WorkflowCtrl.roles.controller || currentStep === Lib.AP.WorkflowCtrl.roles.approver) {
        Data.SetValue("CurrentAttachmentFlag__", Attach.GetNbAttach());
        Lib.AP.WorkflowCtrl.DoAction("backToAP");
    }
    else {
        Process.PreventApproval();
    }
}
function actionAddApprover() {
    const currentStep = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    if (currentStep === Lib.AP.WorkflowCtrl.roles.approver || currentStep === Lib.AP.WorkflowCtrl.roles.controller) {
        Data.SetValue("CurrentAttachmentFlag__", Attach.GetNbAttach());
        Lib.AP.WorkflowCtrl.DoAction("requestFurtherApproval");
    }
    else {
        Process.PreventApproval();
    }
}
function checkGoodsReceipt() {
    // Use a critical section in case of several invoice to the same vendor (to check for overinvoicing).
    // Set critical section timeout to a random time between 30 and 120 seconds
    let criticalSectionTimeout = parseInt(Variable.GetValueAsString("updatePOLockTimeout"), 10);
    if (!criticalSectionTimeout) {
        criticalSectionTimeout = Math.floor((Math.random() * 90) + 30);
    }
    const criticalSectionID = `${Data.GetValue("CompanyCode__")}-${Data.GetValue("VendorNumber__")}`;
    const success = Process.PreventConcurrentAccess(criticalSectionID, function () {
        // Ensure Elastic Search is up to date for any query
        Process.Sleep(1);
        Data.SetValue("NeedValidation", 0);
        Lib.AP.WorkflowCtrl.DoAction("checkGoodsReceipt");
        // Check if invoice status changed back to To verify before continuing
        const invoiceStatus = Data.GetValue("InvoiceStatus__");
        if (invoiceStatus === Lib.AP.InvoiceStatus.SetAside) {
            // No change, no need to reconcile, rebuild worklow and re-validate data
            Process.PreventApproval();
            return;
        }
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        invoiceDoc.ReconcileInvoice();
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.OnCheckGoodsReceiptReconcile");
        invoiceDoc.UpdateBalance();
        invoiceDoc.ComputePaymentAmountsAndDates(true, true);
        if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
            Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
        }
        const shouldRebuildWorkflow = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ShouldRebuildWFAfterCheckGoodsReceipt") || false;
        if (shouldRebuildWorkflow === true) {
            Lib.AP.WorkflowCtrl.Rebuild(true, true, "checkGoodsReceipt");
        }
        validateData("approve", "checkgoodsreceipt")
            .Then(function (isValid) {
            if (!isValid) {
                Log.Info("Error(s) detected in form");
                Process.PreventApproval();
            }
            const shouldAutoPostAfterGoodsReceiptDetection = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ShouldAutoPostInvoiceAfterGoodsReceiptDetection");
            if (shouldAutoPostAfterGoodsReceiptDetection !== false) {
                // still try touchless to serialize touchless exceptions
                actionTryTouchless(true);
            }
        })
            .Catch(function (error) {
            Log.Error(`Unhandled promise: ${error}. Prevent posting.`);
            Process.PreventApproval();
        });
    }, 
    // no recovery function as master data should be synchronized regularly
    null, criticalSectionTimeout);
    if (!success) {
        // If there was an error in the process, throw an error to retry this action (if a retry is allowed)
        const errorMsg = "Failed to lock Purchase order items because they are momentarily held by another invoice";
        if (Process.GetScriptRetryCount() < Process.GetScriptMaxRetryCount() - 1) {
            const retryMsg = `${errorMsg}. Retrying...`;
            Log.Warn(retryMsg);
            // Generate an exception for script to retry
            throw retryMsg;
        }
        else {
            // The critical section could not be created within the criticalSectionTimeout. Keep the invoice asleep
            Log.Info(errorMsg);
            Process.PreventApproval();
        }
    }
}
function tryForwardNonPoInvoiceToReviewer() {
    const forwardAutoToReviewerEnabled = Sys.Parameters.GetInstance("AP").GetParameter("AutomaticallyForwardNonPoInvoiceToReviewer", "0");
    const customConditions = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ForwardNonPoInvoiceToReviewerAllowed");
    const forwardCondition = (customConditions !== null && customConditions !== undefined) ? customConditions : (forwardAutoToReviewerEnabled === "1");
    if (forwardCondition) {
        const nbRemainingControllers = Lib.AP.WorkflowCtrl.GetNbRemainingControllers();
        if (nbRemainingControllers > 0) {
            actionPost(true);
            return true;
        }
    }
    return false;
}
function tryForwardUDCExceptionToReviewer() {
    const nbRemainingControllers = Lib.AP.WorkflowCtrl.GetNbRemainingControllers();
    if (nbRemainingControllers > 0) {
        actionPost(true);
        return true;
    }
    return false;
}
function actionTryTouchless(fromCheckGR) {
    const forceTryTouchless = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ForceTryTouchless", fromCheckGR) || false;
    let preventApproval = false;
    if (!forceTryTouchless && Lib.AP.ShouldArchiveIntercompanyInvoice() && Sys.Parameters.GetInstance("AP").GetParameter("EnableTouchlessForIntercompanyInvoices", "0") === "1") {
        let temporaryIntercompanyERPInvoiceNumber = Data.GetValue("ERPInvoiceNumber__") || Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetDefaultIntercompanyInvoiceArchivingID");
        if (!temporaryIntercompanyERPInvoiceNumber) {
            temporaryIntercompanyERPInvoiceNumber = `INTERCO-${Data.GetValue("CompanyCode__")}-${Data.GetValue("VendorNumber__")}-${Data.GetValue("InvoiceNumber__")}`;
        }
        preventApproval = !TouchlessManager.TryTouchlessArchiving(Data.GetActionType(), temporaryIntercompanyERPInvoiceNumber);
    }
    else if (!forceTryTouchless && Lib.AP.InvoiceType.isGLInvoice() && Sys.Parameters.GetInstance("AP").GetParameter("EnableTouchlessForNonPoInvoice", "0") !== "1") {
        if (!tryForwardNonPoInvoiceToReviewer()) {
            preventApproval = true;
        }
    }
    else if (!forceTryTouchless && Data.GetValue("CurrentException__") === "UDC over tolerance") {
        if (!tryForwardUDCExceptionToReviewer()) {
            preventApproval = true;
        }
    }
    else if (!TouchlessManager.TryTouchless(fromCheckGR ? "" : Data.GetActionType())) {
        preventApproval = true;
    }
    if (preventApproval) {
        Process.PreventApproval();
        TouchlessManager.SerializeExceptions();
    }
}
function actionAutoPostAfterReview() {
    if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) !== 0 ||
        !TouchlessManager.TryAutoPostAfterReview()) {
        Process.PreventApproval();
    }
}
function actionAutoApproveRecurringInvoice() {
    if (!TouchlessManager.TryAutoApproveRecurringInvoice()) {
        Process.PreventApproval();
    }
}
/**
 * @class An helper class to manage the validation of line item mismatches
 */
const mismatchUpdateManager = {
    validatorLogin: null,
    action: null,
    lineNumbers: null,
    /**
     * Initializes the mismatch manager by extrating data from mismatchInfo variable.
     * @returns {boolean} Returns true if mismatchInfo variable contains valid data.
     */
    init: function () {
        try {
            const availableActions = ["accepted", "creditNoteRequested"];
            const mismatchInfo = JSON.parse(Variable.GetValueAsString("mismatchInfo"));
            this.validatorLogin = Data.GetValue("LastValidatorUserId__");
            this.action = mismatchInfo.action;
            this.lineNumbers = mismatchInfo.lineNumbers;
            return (Array.isArray(this.lineNumbers) && this.lineNumbers.length > 0 && availableActions.includes(this.action) && this.validatorLogin);
        }
        catch (error) {
            Log.Error("Line Items Mismatches - Error reading mismatchInfo variable, cannot update mismatches");
            return false;
        }
    },
    /**
     * Sets PriceMismatchResolution__ and QuantityMismatchResponsible__ on line item mismatches assigned to current validator.
     */
    setMismatchResolutions: function () {
        const lineItems = Data.GetTable("LineItems__");
        this.lineNumbers.forEach(itemNumber => {
            const item = lineItems.GetItem(itemNumber);
            if (item.GetValue("PriceMismatchResponsible__") === this.validatorLogin && item.IsNullOrEmpty("PriceMismatchResolution__")) {
                item.SetValue("PriceMismatchResolution__", this.action);
            }
            if (item.GetValue("QuantityMismatchResponsible__") === this.validatorLogin && item.IsNullOrEmpty("QuantityMismatchResolution__")) {
                item.SetValue("QuantityMismatchResolution__", this.action);
            }
        });
    },
    /**
     * Checks if there are any pending line item mismatches (price or quantity) for the current validator that have not been resolved.
     * @returns {boolean} Returns true if there are unresolved mismatches for the validator; otherwise, false.
     */
    isPendingMismatchesForValidator: function () {
        const lineItems = Data.GetTable("LineItems__");
        const nbItems = lineItems.GetItemCount();
        for (let i = 0; i < nbItems; i++) {
            const item = lineItems.GetItem(i);
            if (item.GetValue("PriceMismatchResponsible__") === this.validatorLogin && item.IsNullOrEmpty("PriceMismatchResolution__")) {
                return true;
            }
            if (item.GetValue("QuantityMismatchResponsible__") === this.validatorLogin && item.IsNullOrEmpty("QuantityMismatchResolution__")) {
                return true;
            }
        }
        return false;
    },
    /**
     * Generates a workflow comment indicating the number of mismatches resolved by the current validator.
     * @returns {string} A translated comment string summarizing the mismatches accepted.
     */
    getWorkflowComment: function () {
        const lineItems = Data.GetTable("LineItems__");
        const nbItems = lineItems.GetItemCount();
        const mismatchesCount = {
            "accepted": 0,
            "creditNoteRequested": 0
        };
        for (let i = 0; i < nbItems; i++) {
            const item = lineItems.GetItem(i);
            if (item.GetValue("PriceMismatchResponsible__") === this.validatorLogin) {
                const actionPriceMismatch = item.GetValue("PriceMismatchResolution__");
                mismatchesCount[actionPriceMismatch]++;
            }
            if (item.GetValue("QuantityMismatchResponsible__") === this.validatorLogin) {
                const actionQuantityMismatch = item.GetValue("QuantityMismatchResolution__");
                mismatchesCount[actionQuantityMismatch]++;
            }
        }
        let workflowComment = "";
        if (mismatchesCount.accepted > 0) {
            workflowComment += "\n" + Language.Translate("_MismatchesAccepted", false, mismatchesCount.accepted);
        }
        if (mismatchesCount.creditNoteRequested > 0) {
            workflowComment += "\n" + Language.Translate("_MismatchesCreditNoteRequested", false, mismatchesCount.creditNoteRequested);
        }
        return workflowComment;
    }
};
const mismatchStatusManager = {
    getMismatchResolutionStatus: function () {
        const lineItems = Data.GetTable("LineItems__");
        const nbItems = lineItems.GetItemCount();
        let status = {
            allMismatchesSolved: false,
            totalMismatches: 0,
            currentAcceptedCount: 0,
            currentCreditNoteRequested: 0
        };
        for (let i = 0; i < nbItems; i++) {
            const item = lineItems.GetItem(i);
            if (item.GetValue("PriceMismatchResponsible__")) {
                status.totalMismatches++;
                switch (item.GetValue("PriceMismatchResolution__")) {
                    case "accepted":
                        status.currentAcceptedCount++;
                        break;
                    case "creditNoteRequested":
                        status.currentCreditNoteRequested++;
                        break;
                }
            }
            if (item.GetValue("QuantityMismatchResponsible__")) {
                status.totalMismatches++;
                switch (item.GetValue("QuantityMismatchResolution__")) {
                    case "accepted":
                        status.currentAcceptedCount++;
                        break;
                    case "creditNoteRequested":
                        status.currentCreditNoteRequested++;
                        break;
                }
            }
        }
        status.allMismatchesSolved = (status.totalMismatches === (status.currentAcceptedCount + status.currentCreditNoteRequested));
        return status;
    }
};
function actionUpdateMismatch() {
    if (mismatchUpdateManager.init()) {
        mismatchUpdateManager.setMismatchResolutions();
        if (!mismatchUpdateManager.isPendingMismatchesForValidator()) {
            Log.Info("Line Items Mismatches - All mismatches resolved for this user, approving");
            Data.SetValue("Comment__", mismatchUpdateManager.getWorkflowComment());
            const mismatchStatus = mismatchStatusManager.getMismatchResolutionStatus();
            if (mismatchStatus.allMismatchesSolved && mismatchStatus.currentCreditNoteRequested > 0) {
                Log.Info(`All mismatches resolved, but ${mismatchStatus.currentCreditNoteRequested} credit note requested, put invoice on hold`);
                Data.SetValue("AsideReason__", Sys.FRB2B.AP.IsFRB2B() ? Sys.FRB2B.AP.MapStandardToFRB2BOnHoldReasons.WaitingForCreditMemo : Lib.AP.AsideReason.WaitingForCreditMemo);
                Lib.AP.WorkflowCtrl.DoAction("mismatchApprove");
                Process.RecallScript("requestCreditNote");
            }
            else {
                const roleBeforePost = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                Lib.AP.WorkflowCtrl.DoAction("mismatchApprove");
                doAutoPostAfterReviewIfPossible(roleBeforePost);
            }
            return;
        }
    }
    Process.PreventApproval();
}
function actionRequestCreditNote() {
    const templateInfos = Lib.AP.RequestCreditNote.Export.GetRequestCreditNoteTemplateInfos();
    if (templateInfos.fileFormat === "RPT") {
        try {
            const jsonFile = TemporaryFile.CreateFile("json", "utf16");
            if (!jsonFile) {
                throw new Error("The document could not be formatted: Couldn't create the json file");
            }
            Lib.AP.RequestCreditNote.Export.CreateRequestCreditNoteJsonString(templateInfos, function (jsonString) {
                TemporaryFile.Append(jsonFile, jsonString);
            });
            const user = Lib.P2P.GetValidatorOrOwner();
            const reportTemplate = user.GetTemplateFile(templateInfos.template);
            const pdfFile = jsonFile.ConvertFile({ conversionType: Lib.P2P.GetCrystalConverterByParameter(), report: reportTemplate });
            const fileName = Language.Translate("_Attachment_CreditNoteRequest_{0}", false, Data.GetValue("InvoiceNumber__"));
            if (!pdfFile) {
                throw new Error("The document could not be formatted: Crystal report conversion error");
            }
            Attach.AttachTemporaryFile(pdfFile, {
                name: fileName + ".pdf",
                attachAsConverted: true,
                isTechnical: false
            });
            sendCreditNoteRequestInConversation(fileName, pdfFile);
        }
        catch (ex) {
            Log.Error(`Credit note request - ${ex}`);
        }
    }
    Process.PreventApproval();
}
function sendCreditNoteRequestInConversation(fileName, pdfFile) {
    let ciTransport;
    if (Sys.Helpers.IsEmpty(Data.GetValue("PortalRuidEx__"))) {
        if (Sys.Helpers.IsEmpty(Data.GetValue("VendorContactEmail__"))) {
            throw new Error("Missing VendorContactEmail__, cannot create conversation");
        }
        ciTransport = createCI();
    }
    else {
        ciTransport = Lib.AP.VendorPortal.GetCITransport(null);
    }
    if (ciTransport) {
        const owner = Lib.P2P.GetOwner();
        const culture = owner.GetValue("Culture");
        const ciVars = ciTransport.GetUninheritedVars();
        const ciOwner = Users.GetUser(ciVars.GetValue_String("OwnerId", 0));
        const notificationMessage = Language.Translate("_Conversation notification request credit note for invoice {0}, received on {1}, for a requested amount of {2} {3}", false, Data.GetValue("InvoiceNumber__"), Sys.Helpers.Date.ToLocaleDateEx(Data.GetValue("InvoiceDate__"), culture), Sys.Helpers.String.FormatNumber(Data.GetValue("InvoiceAmount__"), culture, 2), Data.GetValue("InvoiceCurrency__")).replace(/\n/g, "<br />");
        const options = {
            notifyByEmail: true,
            emailSubject: Language.Translate("_Credit note request for invoice {0}", false, Data.GetValue("InvoiceNumber__")),
            emailTemplate: "AP-Vendor_CreditNoteRequest.htm",
            files: [{ name: fileName, file: pdfFile }],
            emailCustomTags: {
                Message__: notificationMessage,
                PortalUrl__: ciOwner ? ciOwner.GetProcessURL(Data.GetValue("PortalRuidEx__"), true) : null
            },
            asUser: owner
        };
        const message = Language.Translate("_Conversation automatic request credit note for invoice {0}, received on {1}, for a requested amount of {2} {3}", false, Data.GetValue("InvoiceNumber__"), Sys.Helpers.Date.ToLocaleDateEx(Data.GetValue("InvoiceDate__"), culture), Sys.Helpers.String.FormatNumber(Data.GetValue("InvoiceAmount__"), culture, 2), Data.GetValue("InvoiceCurrency__"));
        Conversation.AddItem(Lib.P2P.Conversation.TableName, { Message: message, Type: 10 }, options);
    }
    else {
        throw new Error("No CI transport found, Vendor portal must be enabled. Credit note request not sent.");
    }
}
function undoLinkageToBillingScheduleInstallmentOnERPPostingError() {
    if (!Data.IsNullOrEmpty("ERPPostingError__") &&
        !Data.IsNullOrEmpty("ContractReferenceNumber__") &&
        !Data.IsNullOrEmpty("ContractNumber__") &&
        !Data.IsNullOrEmpty("BillingScheduleID__") &&
        !Data.IsNullOrEmpty("BillingScheduleInstallment__")) {
        Lib.P2P.BillingSchedule.UpdateBillingScheduleRecordFromInvoice({
            VICompanyCode: Data.GetValue("CompanyCode__"),
            VIVendorNumber: Data.GetValue("VendorNumber__"),
            VIContractReferenceNumber: Data.GetValue("ContractReferenceNumber__"),
            VIContractNumber: Data.GetValue("ContractNumber__"),
            VIBillingSchedule: Data.GetValue("BillingScheduleID__"),
            VIBillingScheduleInstallment: Data.GetValue("BillingScheduleInstallment__"),
            VIRUIDEX: "",
            VIInvoiceNumber: "",
            VIInvoiceDate: null,
            VIInvoiceAmount: null,
            VIInvoiceNetAmount: null
        });
    }
}
function continueAfterERPAck() {
    const curUserLogin = Users.GetUser(Data.GetValue("OwnerId")).GetValue("Login");
    Lib.AP.WorkflowCtrl.DoAction("continueAfterERPAck");
    doAutoApprovalOfRecurringInvoiceIfPossible();
    undoLinkageToBillingScheduleInstallmentOnERPPostingError();
    const isSuccessfullyPosted = !Data.IsNullOrEmpty("ERPInvoiceNumber__") && Data.IsNullOrEmpty("ERPPostingError__");
    const shouldTransmitToC5 = Lib.AP.PeppolC5Reporting.IsEnabled() && Data.IsNullOrEmpty("CF_C5_IntegrationRuidEx__");
    if (isSuccessfullyPosted && shouldTransmitToC5) {
        Lib.AP.PeppolC5Reporting.CreateC5IntegrationProcess(curUserLogin);
    }
    // This is specific to FRB2B invoices and Universal ERP only. When lifecycle statuses are managed by ERP and the invoice
    // is directly posted, keep the invoice in "Being processed" state (state 90) and set the InvoiceStatus to "Being processed by ERP" and
    // wait for the ERP lifecycle status updates.
    const isWorkflowEnded = Lib.AP.WorkflowCtrl.workflowUI.IsEnded();
    const isLifecycleManagedByERP = Sys.Parameters.GetInstance("AP").GetParameter("EnableLifeCycleStatusesManagedByERP", "0") === "1";
    const shouldWaitForLifecycleStatusUpdate = isSuccessfullyPosted && isWorkflowEnded && isLifecycleManagedByERP && Sys.FRB2B.AP.IsFRB2B();
    Lib.AP.ERPAcknowledgment.SetSynchronousCustomERPAckReceived(false);
    if (shouldWaitForLifecycleStatusUpdate) {
        Lib.AP.SetInvoiceStatus(Lib.AP.InvoiceStatus.BeingProcessedByERP);
        waitForERPLifecycleStatusUpdate();
    }
}
function waitForERPLifecycleStatusUpdate() {
    Lib.AP.WorkflowCtrl.WaitForERPLifecycleStatusUpdate();
}
/**
 * Resolves the target invoice status to apply for an ERP lifecycle event.
 * Checks the GetERPLifecycleStatusMapping user exit for a custom mapping,
 * falling back to the provided default if no entry is defined for this lifecycle status.
 */
function resolveERPLifecycleTargetStatus(lifecycleStatus, defaultStatus) {
    const mapping = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.GetERPLifecycleStatusMapping");
    if (typeof mapping === "object" && mapping !== null) {
        const customStatus = mapping[lifecycleStatus];
        if (typeof customStatus === "string" && customStatus) {
            return customStatus;
        }
    }
    return defaultStatus;
}
function getERPLifecycleSource() {
    return "_ERPLifecycleSource";
}
function getERPReasonOptions() {
    return Sys.FRB2B.AP.ParseERPReasonOptions(Variable.GetValueAsString("ERPReasonOptions"));
}
function continueAfterERPLifecycleApproved() {
    Log.Info("ERP Lifecycle Approved, continue workflow");
    Lib.AP.CommentHelper.AddLine(Language.Translate("_ERPLifecycleApproved"), "", "ERP");
    Lib.AP.WorkflowCtrl.AddERPLifecycleWorkflowEntry(Language.CreateLazyTranslation("_ERPLifecycleApproved"));
    // For FRB2B accounts, send the Approved CDV explicitly with the ERP source before changing
    // the invoice status. OnEDIStatusChange is suppressed for BeingProcessedByERP transitions,
    // so this is the only CDV call for the Approved lifecycle path.
    if (Sys.FRB2B.AP.IsFRB2B()) {
        Sys.FRB2B.AP.ReprocessVICDVWithAction(Data.GetValue("Ruidex"), Lib.AP.InvoiceStatus.ToPay, null, { source: getERPLifecycleSource(), ...getERPReasonOptions() });
    }
    Lib.AP.SetInvoiceStatus(resolveERPLifecycleTargetStatus(Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Approved, Lib.AP.InvoiceStatus.ToPay));
}
function continueAfterERPLifecycleRefused() {
    Log.Info("ERP Lifecycle Refused — sending refuse CDV to PA and rejecting invoice");
    Lib.AP.CommentHelper.AddLine(Language.Translate("_ERPLifecycleRefused"), "", "ERP");
    Lib.AP.WorkflowCtrl.AddERPLifecycleWorkflowEntry(Language.CreateLazyTranslation("_ERPLifecycleRefused"));
    // Update invoice fields with ERP-provided reason data so the invoice reflects the ERP decision.
    // These fields are also read by ReprocessVICDVTransportWithAction for CDV generation.
    const erpReasonOptions = getERPReasonOptions();
    if (erpReasonOptions.erpReasonCode) {
        Data.SetValue("RejectReason__", erpReasonOptions.erpReasonCode);
    }
    if (erpReasonOptions.erpReasonComment) {
        Variable.SetValueAsString("LastComment", erpReasonOptions.erpReasonComment);
    }
    // Send refuse CDV to the PA via the linked VICDV process (French B2B accounts only).
    // Passing Lib.AP.InvoiceStatus.Rejected ("Rejected") as the action: the VICDV validation
    // script maps it to CDVStatus.Refused ("FRB2B_210_Refused") before forwarding to the PA.
    if (Sys.FRB2B.AP.IsFRB2B()) {
        Sys.FRB2B.AP.ReprocessVICDVWithAction(Data.GetValue("Ruidex"), Lib.AP.InvoiceStatus.Rejected, null, { source: getERPLifecycleSource(), ...erpReasonOptions });
    }
    // For FRB2B direct-post invoices the workflow engine has already ended its steps by the time
    // the lifecycle ack arrives (the workflow completed at continueAfterERPAck). In that case
    // set the invoice status to Rejected directly without going through the workflow engine.
    if (Lib.AP.WorkflowCtrl.workflowUI.IsEnded()) {
        Log.Info("Workflow already ended (direct-post) — setting invoice status to Rejected directly");
        Lib.AP.SetInvoiceStatus(resolveERPLifecycleTargetStatus(Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Refused, Lib.AP.InvoiceStatus.Rejected));
    }
    else {
        // Workflow still has active steps (approval workflow) — reject through the engine.
        actionAutoReject();
    }
}
function continueAfterERPLifecycleInDispute() {
    Log.Info("ERP Lifecycle In Dispute — sending dispute CDV to PA and putting invoice on hold");
    Lib.AP.CommentHelper.AddLine(Language.Translate("_ERPLifecycleInDispute"), "", "ERP");
    Lib.AP.WorkflowCtrl.AddERPLifecycleWorkflowEntry(Language.CreateLazyTranslation("_ERPLifecycleInDispute"));
    // Update invoice fields with ERP-provided reason data so the invoice reflects the ERP decision.
    // These fields are also read by ReprocessVICDVTransportWithAction for CDV generation.
    const erpReasonOptions = getERPReasonOptions();
    if (erpReasonOptions.erpReasonCode) {
        Data.SetValue("AsideReason__", erpReasonOptions.erpReasonCode);
    }
    if (erpReasonOptions.erpReasonComment) {
        Variable.SetValueAsString("LastComment", erpReasonOptions.erpReasonComment);
    }
    // Send dispute CDV to the PA via the linked VICDV process (French B2B accounts only).
    // FRB2BCDVOnHoldType must be set to Dispute before calling ReprocessVICDVWithAction so that
    // the VICDV validation script maps the OnHold action to CDVStatus.OnHold with Dispute type
    // (instead of the generic CDVStatus.OnHold produced by the default branch).
    if (Sys.FRB2B.AP.IsFRB2B()) {
        Variable.SetValueAsString("FRB2BCDVOnHoldType", Sys.FRB2B.AP.OnHoldCDVType.Dispute);
        if (Data.GetValue("InvoiceStatus__") !== Lib.AP.InvoiceStatus.OnHold) {
            Sys.FRB2B.AP.ReprocessVICDVWithAction(Data.GetValue("Ruidex"), Lib.AP.InvoiceStatus.OnHold, null, { source: getERPLifecycleSource(), ...erpReasonOptions });
        }
    }
    // For FRB2B direct-post invoices the workflow engine has already ended its steps by the time
    // the lifecycle ack arrives (the workflow completed at continueAfterERPAck). In that case
    // set the invoice status directly and keep it alive, waiting for a subsequent ERP lifecycle update.
    if (Lib.AP.WorkflowCtrl.workflowUI.IsEnded()) {
        Log.Info("Workflow already ended (direct-post) — setting invoice status to OnHold and waiting for next ERP lifecycle update");
        Lib.AP.SetInvoiceStatus(resolveERPLifecycleTargetStatus(Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.InDispute, Lib.AP.InvoiceStatus.OnHold));
        Process.WaitForUpdate();
    }
    else {
        // Workflow still has active steps (approval workflow) — put on hold through the engine.
        Lib.AP.WorkflowCtrl.DoAction("onHold");
    }
}
function continueAfterERPLifecycleTakenInCharge() {
    Log.Info("ERP Lifecycle Taken In Charge — sending taken in charge CDV to PA and setting invoice status to Pending approval");
    Lib.AP.CommentHelper.AddLine(Language.Translate("_ERPLifecycleTakenInCharge"), "", "ERP");
    Lib.AP.WorkflowCtrl.AddERPLifecycleWorkflowEntry(Language.CreateLazyTranslation("_ERPLifecycleTakenInCharge"));
    if (Sys.FRB2B.AP.IsFRB2B()) {
        Sys.FRB2B.AP.ReprocessVICDVWithAction(Data.GetValue("Ruidex"), Sys.FRB2B.CDV.AP.Mapping.CDVStatus.TakeOn, null, { source: getERPLifecycleSource(), ...getERPReasonOptions() });
    }
    const targetStatusTakenInCharge = resolveERPLifecycleTargetStatus(Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.TakenInCharge, Lib.AP.InvoiceStatus.ToApprove);
    Lib.AP.SetInvoiceStatus(targetStatusTakenInCharge);
    Process.WaitForUpdate();
}
function continueAfterERPLifecycleError() {
    const errorMessage = Variable.GetValueAsString("ERPLifecycleError");
    let logMessage = errorMessage;
    if (errorMessage) {
        try {
            const lazyError = JSON.parse(errorMessage);
            if (lazyError && lazyError.translationKey && Sys.Helpers.IsArray(lazyError.parameters)) {
                logMessage = Language.TranslateLazyTranslation(errorMessage);
            }
        }
        catch (_a) {
            // Not a lazy translation string; keep the raw message for diagnostics
        }
    }
    Log.Error("ERP Lifecycle error: " + logMessage);
    Lib.AP.WorkflowCtrl.DoERPLifecycleError();
}
function continueAfterCreditMemo() {
    const roleBeforePost = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    Lib.AP.WorkflowCtrl.DoAction("continueAfterCreditMemo");
    doAutoPostAfterReviewIfPossible(roleBeforePost);
}
function onHoldExpiration() {
    Lib.AP.WorkflowCtrl.DoAction("onHoldExpiration");
}
/**
 * Action to call when the invoice expire
 */
function onExpiration() {
    const isLifecycleManagedByERP = Sys.Parameters.GetInstance("AP").GetParameter("EnableLifeCycleStatusesManagedByERP", "0") === "1";
    // Let the process end with success if the Lifecycle is being managed by ERP and the response is not within 90 days
    if (!isLifecycleManagedByERP) {
        Lib.AP.WorkflowCtrl.DoAction("onExpiration");
    }
}
function onRestorePOAfterTimeout() {
    // revert po Items values if required
    if (Lib.AP.ShouldUpdateTables()) {
        let shouldUpdateVendorNumber = Lib.AP.GetInvoiceDocument().ShouldUpdateVendorNumberOnPOHeaderAndItems();
        const customShouldUpdateVendorNumber = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnShouldUpdateVendorNumberOnPOHeaderAndItems", shouldUpdateVendorNumber);
        if (typeof customShouldUpdateVendorNumber === "boolean") {
            shouldUpdateVendorNumber = customShouldUpdateVendorNumber;
        }
        Lib.AP.TablesUpdater.Update(true, shouldUpdateVendorNumber);
        Transaction.Write("UPDATE_PO_ON_INTEGRATION_ERROR", "1");
    }
    // Reset transaction so that AP can repost with fixes
    Transaction.Delete(Lib.ERP.Invoice.transaction.keys.post);
    Transaction.Delete(Lib.ERP.Invoice.transaction.keys.poUpdate);
    Variable.SetValueAsString("ERPIntegrationTimeout", "");
    Variable.SetValueAsString("onRestorePOAfterTimeoutEnd", "true");
    Process.PreventApproval();
}
function manualUnblockPayment() {
    Lib.AP.GetInvoiceDocument().UnblockPayment("manual");
}
function retryUnblockPayment() {
    Lib.AP.GetInvoiceDocument().UnblockPayment("retry");
}
function updateHolds() {
    Lib.AP.WorkflowCtrl.manageHolds();
    if (!Lib.AP.WorkflowCtrl.IsEnded()) {
        if (!Data.IsNullOrEmpty("ERPPostingDate__") && Data.IsNullOrEmpty("ERPInvoiceNumber__")) {
            Log.Info("Invoice is still waiting for ERP ack");
            Process.WaitForUpdate();
        }
        else {
            Process.PreventApproval();
        }
    }
}
function clearingDone() {
    const invoiceStatus = Data.GetValue("InvoiceStatus__");
    if (invoiceStatus === Lib.AP.InvoiceStatus.WaitForClearing) {
        Lib.AP.WorkflowCtrl.DoAction("clearingDone");
    }
    else {
        Process.PreventApproval();
    }
}
function clearingTimeout() {
    const invoiceStatus = Data.GetValue("InvoiceStatus__");
    if (invoiceStatus === Lib.AP.InvoiceStatus.WaitForClearing) {
        Lib.AP.WorkflowCtrl.DoAction("clearingTimeout");
    }
    else {
        Process.PreventApproval();
    }
}
/**
 * Creates Customer Invoice transport and notify supplier if the "PortalRuidEx__" field is empty.
 * @returns {xTransport} The created CI transport object, or `null` if the "PortalRuidEx__" was already set
 */
function createCI() {
    let ciTransport = null;
    if (Sys.Helpers.IsEmpty(Data.GetValue("PortalRuidEx__"))) {
        const vendorPortalParams = Lib.AP.VendorPortal.GetParametersFromDataInvoice(Data);
        const fieldsToUpdate = Lib.AP.VendorPortal.GetFieldsToUpdate(vendorPortalParams);
        ciTransport = Lib.AP.VendorPortal.CreateCIAndNotifyVendor(vendorPortalParams, fieldsToUpdate);
    }
    Process.PreventApproval();
    return ciTransport;
}
function contactVendor() {
    createCI();
    Lib.CommonDialog.NextAlert.Define("ContactVendorDone", null, { behaviorName: "contactVendor" });
}
function contactVendorForCreditNotes() {
    createCI();
    Lib.CommonDialog.NextAlert.Define("ContactVendorDone", null, { behaviorName: "requestCreditNotes" });
}
function actionFullBudgetRecovery() {
    Lib.AP.Budget.DoFullRecovery();
}
function actionReverseInvoice() {
    Lib.AP.WorkflowCtrl.DoAction("reverseInvoice");
    Sys.P2P.Accrual.CreateDetailedAccrualEventForAllPOItems(Sys.P2P.Accrual.ActionType.PurchaseOrderItemInvoiceReversed);
}
function actionSaveEditing() {
    apSpendingDispatcher.AsInvoiced();
    SetupEReportingVariables(!!Data.GetValue("LastExportDate__"));
    // Force to set status to 100, even if there are errors
    // Because simple save don't check error
    Data.SetValue("State", 100);
}
function renewValidityPeriod() {
    if (Variable.GetValueAsString("IsExtendedValidityPeriod") === "true") {
        // Reset the expiration timeout and get out of the "grace period"
        Lib.AP.WorkflowCtrl.ExpirationHelper.ResetValidity(new Date());
        Variable.SetValueAsString("IsExtendedValidityPeriod", "false");
    }
}
/**
 * Action that forces the workflow to escalate the approval to the managers of the contributors
 * who didn't approve the invoice yet.
 * It will add the managers as contributors to the workflow and then call the "escalate" action.
 * The managers will then be able to approve the invoice.
 */
function workflowEscalation() {
    // Get the list of contributors who didn't approve the invoice yet
    const currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex());
    const contributors = Lib.AP.WorkflowCtrl.workflowUI.GetParallelContributorsOf(currentContributor, true);
    const contributorsLogin = [];
    contributors.forEach(contributor => {
        if (!contributor.approved) {
            Log.Info("[escalation] Search manager for contributor: " + contributor.login);
            contributorsLogin.push(contributor.login);
        }
    });
    // First approver will be added at the end of the current role step
    let insertAt = Lib.AP.WorkflowCtrl.GetCurrentStep() + contributors.length;
    let usersForEscalationPromise;
    usersForEscalationPromise = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.Workflow.GetUsersForEscalation", contributorsLogin);
    usersForEscalationPromise = usersForEscalationPromise || Lib.P2P.Managers.queryGetManagers(contributorsLogin);
    usersForEscalationPromise.Then((managers) => {
        if (managers.length > 0) {
            const addedManagers = {};
            let addedManagersCount = 0;
            managers.forEach((manager, i) => {
                if (Sys.Helpers.IsEmpty(manager.ManagerLogin__)) {
                    Log.Warn("[escalation] No manager found for contributor: " + manager.UserLogin__);
                    return;
                }
                // Check if the manager is already added to avoid duplicates
                if (addedManagers[manager.ManagerLogin__]) {
                    return;
                }
                addedManagers[manager.ManagerLogin__] = true;
                // Add the manager as a contributor to the workflow
                // and increment the insertAt index to add the next manager after the current one
                const managerUser = Users.GetUser(manager.ManagerLogin__);
                if (managerUser) {
                    const managerContributor = {
                        displayName: managerUser.GetValue("DisplayName"),
                        login: manager.ManagerLogin__,
                        emailAddress: managerUser.GetValue("EmailAddress"),
                        escalated: true,
                        escalatedFromLogin: manager.UserLogin__
                    };
                    Log.Info("[escalation] Add manager login " + manager.ManagerLogin__ + " at tableIndex " + insertAt);
                    Lib.AP.WorkflowCtrl.AddContributorAt(insertAt, managerContributor, currentContributor.role, true);
                    insertAt++;
                    addedManagersCount++;
                }
                else {
                    Log.Info("[escalation] No user found for manager login: " + manager.ManagerLogin__);
                }
            });
            if (addedManagersCount > 0) {
                Lib.AP.WorkflowCtrl.DoAction("escalate");
            }
            else {
                Log.Warn("[escalation] No valid manager found for escalation");
            }
        }
        else {
            Log.Warn("[escalation] No manager found for escalation");
        }
    });
    Process.PreventApproval();
}
//#endregion
//#region RUN PART
function SetTransportSubject() {
    let subject = `${Data.GetValue("CompanyCode__")}/${Data.GetValue("VendorNumber__")}/${Data.GetValue("InvoiceNumber__")}`;
    subject = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.SetTransportSubject", subject) || subject;
    Data.SetValue("Subject", subject);
}
function getActionName() {
    if (Lib.AP.isActionAutoComplete()) {
        return "autocomplete";
    }
    if (!Process.AutoValidatingOnExpiration()) {
        return Data.GetActionName();
    }
    if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.WaitForClearing) {
        return "clearingTimeout";
    }
    let customAction = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.GetActionName");
    if (customAction) {
        return customAction;
    }
    return "onexpiration";
}
function addPartiesToConversation(contributorsLogin) {
    const recipientCompany = Data.GetValue("VendorName__");
    for (const contributorLogin of contributorsLogin) {
        const internalUser = Users.GetUserAsProcessAdmin(contributorLogin);
        if (internalUser) {
            const internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
            Lib.AP.VendorPortal.AddPartyToConversation(internalUserInfo, recipientCompany);
        }
        else {
            Log.Error(`User ${contributorLogin} not found - not added to the conversation`);
        }
    }
}
// User-triggered actions that complete the current controller/approver workflow step and therefore must be
// performed by an authorized user (owner, group member or delegate). This includes the default "" action
// (initial submission / some retry replays). Other workflow actions that are not step-completing
// (e.g. recalltoap by AP specialist), and system/scheduled actions (ERP callbacks, expiration handling),
// are intentionally excluded.
const workflowStepCompletingActionNames = new Set([
    "",
    "post",
    "postafterduplicatecheckignored",
    "reject",
    "backtoap",
    "backtoprevious",
    "adminlist"
]);
/**
 * Checks if the current action is an unauthorized workflow step completion attempt and prevents it.
 * @param currentNameLowerCase The lowercase action name
 * @param currentAction The original action name
 * @returns true if the action was prevented, false otherwise
 */
function checkAndPreventUnauthorizedStepCompletion(currentNameLowerCase, currentAction) {
    if (!workflowStepCompletingActionNames.has(currentNameLowerCase)) {
        return false;
    }
    // adminlist (batch approval from the admin list) resolves its real actor from ValidationOwnerID,
    // which is provided upstream (e.g., by the admin-list UI/action parameters). LastValidatorUserId__
    // may still hold the previous, unrelated action's actor at this point. Pass the real actor explicitly
    // so a legitimate batch approval isn't misclassified as an unauthorized stale replay.
    const actorLoginForGuard = currentNameLowerCase === "adminlist"
        ? Data.GetValue("ValidationOwnerID")
        : undefined;
    if (Lib.AP.WorkflowCtrl.IsActorUnauthorizedForCurrentStep(actorLoginForGuard)) {
        const lastValidatorId = actorLoginForGuard || Data.GetValue("LastValidatorUserId__");
        const ownerId = Data.GetValue("OwnerId");
        const currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
        const bypassUnauthorizedStepCompletionCheck = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.BypassUnauthorizedStepCompletionCheck", currentNameLowerCase, currentAction, lastValidatorId, ownerId, currentRole);
        if (bypassUnauthorizedStepCompletionCheck) {
            Log.Info("[UnauthorizedStepCompletionBypass] Unauthorized step completion guard bypassed by customization.");
            return false;
        }
        const ruidex = Data.GetValue("ruidex");
        Log.Warn(`[UnauthorizedStepCompletionBlocked] Action blocked because the actor is not authorized for the current workflow step. Action: "${currentAction}", Role: "${currentRole}", LastValidator: "${lastValidatorId}", Owner: "${ownerId}", Ruidex: "${ruidex}".`);
        Process.PreventApproval();
        return true;
    }
    return false;
}
function executeRequestedAction() {
    var _a;
    let vendorPortalParams;
    const currentName = getActionName();
    const currentNameLowerCase = currentName.toLowerCase();
    const currentAction = Data.GetActionType();
    Log.Info(`Action: ${currentAction ? currentAction : "<empty>"}, Name: ${currentName ? currentName : "<empty>"}, Device: ${Data.GetActionDevice()}`);
    const lastValidator = Data.GetValue("LastValidatorUserId__");
    if (lastValidator) {
        Log.Info(`LastValidator: ${lastValidator}, LastSaved: ${Sys.Helpers.Date.Date2DBDateTime(Data.GetValue("LastSavedDateTime"))}`);
    }
    // Initialize WorkflowCtrl
    Lib.AP.WorkflowCtrl.Init();
    Lib.AP.WorkflowCtrl.SetObject("allowApprovers", Lib.AP.GetInvoiceDocument().AllowApprovers());
    Lib.AP.WorkflowCtrl.AllowRebuild(false);
    Lib.AP.WorkflowCtrl.SetObject("usersObject", Users);
    Lib.AP.WorkflowCtrl.SetObject("budgetsManager", apSpendingDispatcher);
    Lib.AP.WorkflowCtrl.UpdateParallelWorkflowCurrentUser(Lib.P2P.GetValidatorOrOwner());
    TouchlessManager.Init();
    Data.SetValue("EnableTouchless", false);
    /* Action map to specify what to do according to the Action Name. The validation, if needed, will always be executed synchronously.
        The action in itself can be executed asynchronously.
    key: action name given by Data.GetActionName(). The empty string key means that no user action was ever performed on this form (submission)
    value : object
    - execute: function to call
    - requireValidation: set to true if you want the action to validate data
    - isAsync: set to true if the action should be executing asynchronously
    - leaveForm (only if isAsync is false): set to true if the form should be closed at the end of the action
    - keepScheduledActionParameters : set to true if you want to keep the values of the fields ScheduledActionDate and ScheduledAction after the validation action.
    - allowRetry: set to true to enable script retries on this specific action
    - renewValidityPeriod: set to true if you want the action to reset the validity date time when invoice is in extended validation period
    */
    const approveActionMap = {};
    approveActionMap.post = {
        "execute": actionPost,
        "requireValidation": true,
        "InWorkflowLeaveForm": true,
        "allowRetry": true,
        "renewValidityPeriod": true
    };
    approveActionMap.postafterduplicatecheckignored = {
        "execute": actionPostAfterDuplicateCheckIgnored,
        "requireValidation": true,
        "InWorkflowLeaveForm": true,
        "allowRetry": true,
        "renewValidityPeriod": true
    };
    approveActionMap.submitautomatically = {
        "execute": actionPost,
        "requireValidation": true,
        "InWorkflowLeaveForm": true,
        "allowRetry": true,
        "renewValidityPeriod": true
    };
    approveActionMap.adminlist = {
        "execute": actionAdminListApprove,
        "requireValidation": true,
        "renewValidityPeriod": true
    };
    approveActionMap.backtoprevious = {
        "execute": actionBackToPrevious,
        "requireValidation": false,
        "renewValidityPeriod": true
    };
    approveActionMap.backtoap = { "execute": actionBackToAP, "requireValidation": false, "renewValidityPeriod": true };
    approveActionMap.addapprover = { "execute": actionAddApprover, "requireValidation": false };
    approveActionMap.recalltoap = {
        "execute": actionBackToAP,
        "requireValidation": false,
        "renewValidityPeriod": true
    };
    approveActionMap.set_aside = {
        "execute": actionSetAside,
        "requireValidation": false,
        "leaveForm": true,
        "renewValidityPeriod": true
    };
    approveActionMap.onhold = {
        "execute": actionSetOnHold,
        "requireValidation": false,
        "leaveForm": true,
        "keepScheduledActionParameters": true,
        "renewValidityPeriod": true
    };
    approveActionMap.reject = { "execute": actionReject, "requireValidation": false, "leaveForm": true };
    approveActionMap.continueaftererpack = {
        "execute": continueAfterERPAck,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.erplifecycleapproved = {
        "execute": continueAfterERPLifecycleApproved,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.erplifecyclerefused = {
        "execute": continueAfterERPLifecycleRefused,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.erplifecycleindispute = {
        "execute": continueAfterERPLifecycleInDispute,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.erplifecycletakenincharge = {
        "execute": continueAfterERPLifecycleTakenInCharge,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.erplifecycleerror = {
        "execute": continueAfterERPLifecycleError,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.continueaftercreditmemo = {
        "execute": continueAfterCreditMemo,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.onexpiration = { "execute": onExpiration, "requireValidation": false, "leaveForm": false };
    approveActionMap.onrestorepoaftertimeout = { "execute": onRestorePOAfterTimeout, "requireValidation": false, "leaveForm": false };
    approveActionMap.savetemplate = { "execute": saveTemplate, "requireValidation": false, "leaveForm": false };
    approveActionMap.checkgoodsreceipt = {
        "execute": checkGoodsReceipt,
        "requireValidation": false,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.retryunblockpayment = {
        "execute": retryUnblockPayment,
        "requireValidation": false,
        "leaveForm": false
    };
    approveActionMap.manualunblockpayment = {
        "execute": manualUnblockPayment,
        "requireValidation": false,
        "leaveForm": false
    };
    approveActionMap.contactvendor = { "execute": contactVendor, "requireValidation": false, "leaveForm": false };
    approveActionMap.contactvendorforcreditnotes = {
        "execute": contactVendorForCreditNotes,
        "requireValidation": false,
        "leaveForm": false
    };
    approveActionMap.autopostafterreview = {
        "execute": actionAutoPostAfterReview,
        "requireValidation": true,
        "leaveForm": false,
        "allowRetry": true
    };
    approveActionMap.autoapproverecurringinvoice = {
        "execute": actionAutoApproveRecurringInvoice,
        "requireValidation": true,
        "leaveForm": false
    };
    approveActionMap.updatemismatch = {
        "execute": actionUpdateMismatch,
        "requireValidation": true,
        "leaveForm": false
    };
    approveActionMap.requestcreditnote = {
        "execute": actionRequestCreditNote,
        "requireValidation": true,
        "leaveForm": false
    };
    approveActionMap.onholdexpiration = { "execute": onHoldExpiration, "requireValidation": false, "leaveForm": false };
    approveActionMap.updateholds = { "execute": updateHolds, "requireValidation": false, "leaveForm": false };
    approveActionMap.clearingdone = { "execute": clearingDone, "requireValidation": false, "leaveForm": false };
    approveActionMap.clearingtimeout = { "execute": clearingTimeout, "requireValidation": false, "leaveForm": false };
    approveActionMap.fullbudgetrecovery = {
        "execute": actionFullBudgetRecovery,
        "requireValidation": false,
        "leaveForm": true
    };
    approveActionMap.reverseinvoice = { "execute": actionReverseInvoice, "requireValidation": true, "leaveForm": true };
    approveActionMap.saveediting_ = { "execute": actionSaveEditing, "requireValidation": false, "leaveForm": true };
    approveActionMap.proposeearlypayment = {
        "execute": actionProposeEarlyPayment,
        "requireValidation": false,
        "leaveForm": true
    };
    approveActionMap.autocomplete = { "execute": actionAutocomplete, "requireValidation": false, "leaveForm": false };
    approveActionMap.reprocess = { "execute": actionReprocess, "requireValidation": true, "leaveForm": false, "executeOnInvalidData": actionByDefaultOnInvalidData };
    approveActionMap.workflowescalation = {
        "execute": workflowEscalation,
        "requireValidation": false,
        "leaveForm": false
    };
    approveActionMap[""] = {
        "execute": actionByDefault,
        "requireValidation": true,
        "leaveForm": false,
        "executeOnInvalidData": actionByDefaultOnInvalidData
    };
    // Add customized actions to approveActionMap if not using the same actionName
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ExtendActionMap", approveActionMap);
    let action = approveActionMap[currentNameLowerCase];
    if (!action || currentNameLowerCase === "") {
        action = approveActionMap[""];
        Log.Info("Use default validation action.");
    }
    let ok = true;
    const autoReject = currentNameLowerCase === "" && !InvoiceCompliance.IsCompliant();
    // First time in validation script
    if (action.requireValidation && !autoReject) {
        validateData(currentName, currentAction)
            .Then(function (isValid) {
            if (!isValid) {
                Log.Info("Error(s) detected in form");
                ok = false;
            }
            else {
                SetTransportSubject();
                Lib.P2P.SetBillingInfo(Variable.GetValueAsString("ProcessingLabel"));
                ok = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.OnBilling");
                ok = ok || ok === null;
            }
        })
            .Catch(function (error) {
            Log.Error(`Unhandled promise: ${error}. Prevent posting.`);
            ok = false;
        });
    }
    else if (currentNameLowerCase === "reject" || autoReject) {
        // Set right contract to bill even for rejected invoices
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.OnBilling");
    }
    else {
        disableTableValuesOnlyInApprovalWkf(true);
    }
    const executeAction = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.ShouldExecuteAction", currentNameLowerCase)) !== null && _a !== void 0 ? _a : true;
    if ((ok || autoReject) && executeAction) {
        if (!action.keepScheduledActionParameters) {
            Data.SetValue("ScheduledActionDate__", "");
            Data.SetValue("ScheduledAction__", "");
        }
        if (action.renewValidityPeriod) {
            renewValidityPeriod();
        }
        // Execute action now
        vendorPortalParams = Lib.AP.VendorPortal.GetParametersFromDataInvoice(Data);
        Lib.AP.VendorPortal.ValidationScriptBegins(vendorPortalParams);
        const actionContributorIndex = Lib.AP.WorkflowCtrl.workflowUI.GetContributorIndex();
        let actionContributor = null;
        Process.AllowScriptRetries(Boolean(action.allowRetry));
        if (checkAndPreventUnauthorizedStepCompletion(currentNameLowerCase, currentAction)) {
            return;
        }
        // The false parameter means this is not a touchless action and is only used for actionPost
        action.execute(false);
        vendorPortalParams = Lib.AP.VendorPortal.GetParametersFromDataInvoice(Data, Variable);
        Lib.AP.VendorPortal.ValidationScriptEnds(vendorPortalParams);
        if (Lib.AP.WorkflowCtrl.contributorsAdded.length > 0) {
            addPartiesToConversation(Lib.AP.WorkflowCtrl.contributorsAdded);
        }
        if (actionContributorIndex >= 0 && actionContributorIndex < Lib.AP.WorkflowCtrl.workflowUI.GetNbContributors()) {
            actionContributor = Lib.AP.WorkflowCtrl.workflowUI.GetContributorAt(actionContributorIndex);
        }
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        invoiceDoc.OnValidationActionEnd(currentAction, action ? currentName.toLowerCase() : "", actionContributor);
        // Activate the workflow auto escalate feature
        Lib.AP.WorkflowCtrl.ExpirationHelper.SetScheduledFieldsStepEscalation();
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.onActionEnd", currentAction, action ? currentNameLowerCase : "", actionContributor);
        // Only execute the workflow end prediction in sendCD
        if (Data.GetValue("State") === 50) {
            predictWorkflowEndDate();
        }
        const InWorkflowLeaveFormWithoutPrevent = action.InWorkflowLeaveForm && !Lib.ERP.IsSAP();
        if (action.leaveForm || InWorkflowLeaveFormWithoutPrevent) {
            Process.LeaveForm();
        }
    }
    else {
        // Either validateData failed or OnBilling did not return true
        // In any case, we have to prevent the approval as the action was not performed
        Process.PreventApproval();
        if (action.executeOnInvalidData) {
            action.executeOnInvalidData();
        }
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Validation.OnValidationScriptEnd", currentAction, action ? currentNameLowerCase : "");
    // Finalize SAP connection
    if (Lib.ERP.IsSAP()) {
        Lib.AP.SAP.PurchaseOrder.FinalizeBapiParameters();
    }
}
function run() {
    Lib.AP.InitArchiveDuration();
    //Serialize serializable parmeters on the process so they can be retrieve by the Mobile App
    Sys.Parameters.GetInstance("P2P").Serialize();
    Sys.Parameters.GetInstance("AP").Serialize();
    executeRequestedAction();
    Lib.AP.ResetERPManager();
}
run();
//#endregion
//# sourceMappingURL=validationscript.js.map