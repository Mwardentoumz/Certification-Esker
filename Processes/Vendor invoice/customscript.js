"use strict";
/* Param name on AP configuration */
var ConfigActionReasonName;
(function (ConfigActionReasonName) {
    ConfigActionReasonName["RejectReasons"] = "RejectReasons";
    ConfigActionReasonName["BackToAPReasons"] = "BackToApReasons";
    ConfigActionReasonName["AsideReasons"] = "AsideReasons";
    ConfigActionReasonName["HoldReasons"] = "HoldReasons";
})(ConfigActionReasonName || (ConfigActionReasonName = {}));
/* Corresponding Vendor Invoice field */
var ActionReasonName;
(function (ActionReasonName) {
    ActionReasonName["RejectReason__"] = "RejectReason__";
    ActionReasonName["BackToAPReason__"] = "BackToAPReason__";
    ActionReasonName["AsideReason__"] = "AsideReason__";
    ActionReasonName["HoldReason__"] = "AsideReason__";
})(ActionReasonName || (ActionReasonName = {}));
var VendorLifeCycleStatusIcon;
(function (VendorLifeCycleStatusIcon) {
    VendorLifeCycleStatusIcon["activeIcon"] = "P2P_VendorStatusActive.svg";
    VendorLifeCycleStatusIcon["blockedIcon"] = "P2P_VendorStatusBlocked.svg";
    VendorLifeCycleStatusIcon["disabledIcon"] = "P2P_VendorStatusDisabled.svg";
})(VendorLifeCycleStatusIcon || (VendorLifeCycleStatusIcon = {}));
/** **************** **/
/** Global variables **/
/** **************** **/
Controls.ERP__.Wait(true);
const g_apParameters = Sys.Parameters.GetInstance("AP");
const g_p2pParameters = Sys.Parameters.GetInstance("P2P");
const g_pacParameters = Sys.Parameters.GetInstance("PAC");
const g_topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarningHTML__);
// Workflow
let g_selectedAddApprover = null;
let g_bApproverAdded = false;
//stack taxCode to get taxRate in one call
let g_taxCodes = {};
//save currency to have old value available when it si changed
let g_invoiceCurrency = "";
// Keep the original exchange rate to restore it when the field is cleared by the user
let g_originalExchangeRate = undefined;
/** *************** **/
/** GENERIC HELPERS **/
/** *************** **/
/**
 * Returns a reliable value of Comment__ field content.
 * On some browsers (IE<10), the placeholder could be returned as its value.
 */
const g_CommentPlaceHolder = Language.Translate("_Enter your comment...");
function getReliableComment() {
    let commentValue = Controls.Comment__.GetValue();
    if (commentValue === g_CommentPlaceHolder) {
        commentValue = "";
    }
    return commentValue;
}
function decimalToString(decimalValue) {
    if (decimalValue === null) {
        decimalValue = 0;
    }
    let targetPrecision = 2;
    if (!Number.isInteger(decimalValue)) {
        targetPrecision = Math.max(Math.min(decimalValue.toString().split(".")[1].length, 5), targetPrecision);
    }
    return Language.FormatNumber(decimalValue, null, targetPrecision);
}
function resetParameters() {
    const resetVATReverseChargeMRU = function (flux10_1_FirstLineOperationTypeMRU, flux10_1_FirstLineTaxRateMRU) {
        const oldOperationTypeMRU = Variable.GetValueAsString("Flux10_1_FirstLineOperationTypeMRU");
        const oldTaxRateMRU = Variable.GetValueAsString("Flux10_1_FirstLineTaxRateMRU");
        Variable.SetValueAsString("Flux10_1_FirstLineOperationTypeMRU", flux10_1_FirstLineOperationTypeMRU);
        Variable.SetValueAsString("Flux10_1_FirstLineTaxRateMRU", flux10_1_FirstLineTaxRateMRU);
        const reverseChargeTaxLines = Data.GetTable("Flux10_1_ReverseChargeTaxLines__");
        if (reverseChargeTaxLines && reverseChargeTaxLines.GetItemCount() > 0) {
            const firstLine = reverseChargeTaxLines.GetItem(0);
            // if both form fields are still based on their previous MRUs values, we update the values
            // otherwise, we don't update to avoid overriding a potential user modification
            if (Lib.AP.FRB2B.VatReverseCharge.IsLineAtPreviousMRUValues(firstLine, oldOperationTypeMRU, oldTaxRateMRU)) {
                Lib.AP.FRB2B.VatReverseCharge.AddDefaultLine();
            }
        }
    };
    const setParametersCallback = function (lastAlertLevel, lastTouchlessEnabled, templateName, lineItemsImporterMapping, nonPOInvoiceEDILineExtractionMode, supplierReconciliationType, partNumberEDIPreferredExtractionValue, flux10_1_FirstLineOperationTypeMRU, flux10_1_FirstLineTaxRateMRU, eReportingEnabled) {
        const shouldShowFlux10_1Control = ShouldShowFlux10_1Control();
        const hasEReportingMRU = eReportingEnabled === "1" || eReportingEnabled === "0";
        Data.SetValue("DuplicateCheckAlertLevel__", lastAlertLevel);
        Data.SetValue("TouchlessEnabled__", lastTouchlessEnabled && lastTouchlessEnabled !== "0");
        Data.SetValue("CodingTemplate__", templateName);
        Data.SetValue("PartNumberEDIPreferredExtractionMode__", partNumberEDIPreferredExtractionValue);
        Variable.SetValueAsString("LineItemsImporterMapping", lineItemsImporterMapping ? lineItemsImporterMapping : "");
        Data.SetValue("SupplierReconciliationType__", supplierReconciliationType);
        const wasCompliant = Data.GetValue("IsFlux10_1Compliant__");
        resetVATReverseChargeMRU(flux10_1_FirstLineOperationTypeMRU, flux10_1_FirstLineTaxRateMRU);
        if (!shouldShowFlux10_1Control) {
            Data.SetValue("IsFlux10_1Compliant__", "0");
        }
        else if (hasEReportingMRU) {
            Data.SetValue("IsFlux10_1Compliant__", eReportingEnabled);
        }
        Controls.IsFlux10_1Compliant__.Hide(!shouldShowFlux10_1Control);
        //IsFlux10_1Compliant__ value may have been modified, need to update fields visibility
        InitFlux10_1Fields(wasCompliant);
    };
    const companyCode = Data.GetValue("CompanyCode__");
    const vendorNumber = Data.GetValue("VendorNumber__");
    Lib.AP.Parameters.GetParameters(companyCode, vendorNumber, setParametersCallback);
}
function OnFlux10_1CompliantChange() {
    ParameterDetails.onParametersChange();
    InitFlux10_1Fields(null);
}
/** ************* **/
/** LAYOUT HELPER **/
/** ************* **/
/**
 * @class An helper class to manage the several kinds of line item
 */
const InvoiceLineItem = {
    /**
     * NON-PO lines count
     */
    iNonPOLinesCount: 0,
    /**
     * GRIV PO lines count
     */
    iGRIVPOLinesCount: 0,
    /**
     * Non-GRIV PO lines with Delivery Note count
     */
    iNonGRIVPODNLinesCount: 0,
    /**
     * Index where new line item will be inserted
     */
    iIndexForNewItem: -1,
    subFocusKey: {
        focused: false,
        // other properties should match existing LineItems__ column
        OrderNumber__: null,
        GoodsReceipt__: null,
        ItemNumber__: null,
        ExtractedDetails__: null
    },
    dispatchKey: {
        OrderNumber__: null,
        GoodsReceipt__: null,
        ItemNumber__: null,
        PriceCondition__: null
    },
    InitializeLineCounts: function () {
        InvoiceLineItem.iNonPOLinesCount = 0;
        InvoiceLineItem.iGRIVPOLinesCount = 0;
        InvoiceLineItem.iNonGRIVPODNLinesCount = 0;
        const table = Data.GetTable("LineItems__");
        for (let i = 0; i < table.GetItemCount(); i++) {
            const item = table.GetItem(i);
            // Initialize the counter of Non-PO line item
            if (InvoiceLineItem.IsGLLineItem(item)) {
                InvoiceLineItem.iNonPOLinesCount++;
            }
            // Initialize the counter of GRIV PO line item
            if (item && InvoiceLineItem.IsGRIVPOLineItem(item)) {
                InvoiceLineItem.iGRIVPOLinesCount++;
            }
            // Initialize the counter of Non-GRIV PO line item with Delivery Note
            if (item && InvoiceLineItem.IsNonGRIVPODNLineItem(item)) {
                InvoiceLineItem.iNonGRIVPODNLinesCount++;
            }
        }
        if (InvoiceLineItem.iGRIVPOLinesCount > 0) {
            LayoutHelper.SwitchToGRIV();
        }
        else {
            Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
        }
    },
    /**
     * Check if the line is a PO line item
     * @param {Data} item The data of the line to test
     * @return boolean True if the LineType of the line is equal to PO
     */
    IsPOLineItem: function (item) {
        if (!item.GetValue("LineType__")) {
            return Lib.AP.InvoiceType.isPOInvoice();
        }
        return Lib.P2P.InvoiceLineItem.IsPOLineItem(item);
    },
    /**
     * Check if the line is a PO line item
     * @param {Data} item The data of the line to test
     * @return boolean True if the LineType of the line is equal to PO
     */
    IsPOGLLineItem: function (item) {
        if (!item.GetValue("LineType__")) {
            return Lib.AP.InvoiceType.isPOGLInvoice();
        }
        return Lib.P2P.InvoiceLineItem.IsPOGLLineItem(item);
    },
    /**
     * Check if the line is a GL line item
     * @param {Data} item The data of the line to test
     * @return boolean True if the LineType of the line is equal to GL
     */
    IsGLLineItem: function (item) {
        if (!item.GetValue("LineType__")) {
            return Lib.AP.InvoiceType.isGLOrDownpaymentInvoice();
        }
        return Lib.P2P.InvoiceLineItem.IsGLLineItem(item);
    },
    /**
     * Check if the line is a GL line item
     * @param {Data} item The data of the line to test
     * @return boolean True if the LineType of the line is equal to GL
     */
    IsGRIVPOLineItem: function (item) {
        return InvoiceLineItem.IsPOLineItem(item) && item.GetValue("GoodsReceipt__");
    },
    IsNonGRIVPODNLineItem: function (item) {
        return InvoiceLineItem.IsPOLineItem(item) && !item.GetValue("GoodsReceipt__") && !Sys.Helpers.IsEmpty(item.GetValue("DeliveryNote__"));
    },
    /**
     * Check if the line is a GL line item
     * @param {Data} item The data of the line to test
     * @return boolean True if the LineType of the line is equal to GL
     */
    IsEmpty: function (item) {
        if (InvoiceLineItem.IsPOLineItem(item)) {
            return InvoiceLineItem.IsPOLineItemEmpty(item);
        }
        else if (InvoiceLineItem.IsPOGLLineItem(item)) {
            return InvoiceLineItem.IsPOGLLineItemEmpty(item);
        }
        // Non-PO Line item are managed like GL line item
        return InvoiceLineItem.IsGLLineItemEmpty(item);
    },
    IsGenericLineEmpty: function (item) {
        return Lib.P2P.InvoiceLineItem.IsEmpty(item);
    },
    /**
     * Check if a GL line item is empty
     * @param {Data} item The data of the line to test
     * @return boolean True if the line is empty
     */
    IsGLLineItemEmpty: function (item) {
        return InvoiceLineItem.IsGenericLineEmpty(item) && !item.GetValue("GLAccount__") && !item.GetValue("CostCenter__");
    },
    /**
     * Check if a PO line item is empty
     * @param {Data} item The data of the line to test
     * @return boolean True if the line is empty
     */
    IsPOLineItemEmpty: function (item) {
        return InvoiceLineItem.IsGenericLineEmpty(item) && !item.GetValue("OrderNumber__") && !item.GetValue("ItemNumber__") && !item.GetValue("Quantity__");
    },
    /**
     * Check if a POGL line item is empty
     * @param {Data} item The data of the line to test
     * @return boolean True if the line is empty
     */
    IsPOGLLineItemEmpty: function (item) {
        return InvoiceLineItem.IsGLLineItemEmpty(item) && InvoiceLineItem.IsPOLineItemEmpty(item);
    },
    ManageCodingsLayout: function (control, isPosted, isPo) {
        const isController = currentStepIsController();
        //Codings
        control.GLDescription__.SetReadOnly(true);
        control.CCDescription__.SetReadOnly(true);
        control.ProjectCodeDescription__.SetReadOnly(true);
        control.ProfitCenterDescription__.SetReadOnly(true);
        const codingsParameters = [
            { control: control.GLAccount__, parameter: "WorkflowReviewersCanModifyGLAccount" },
            { control: control.CostType__, parameter: "WorkflowReviewersCanModifyGLAccount" },
            { control: control.CostCenter__, parameter: "WorkflowReviewersCanModifyCostCenter" },
            { control: control.ProjectCode__, parameter: "WorkflowReviewersCanModifyProjectCode" },
            { control: control.BusinessArea__, parameter: "WorkflowReviewersCanModifyBusinessArea" },
            { control: control.InternalOrder__, parameter: "WorkflowReviewersCanModifyInternalOrder" },
            { control: control.WBSElement__, parameter: "WorkflowReviewersCanModifyWBSElement" },
            { control: control.Assignment__, parameter: "WorkflowReviewersCanModifyAssignments" },
            { control: control.TradingPartner__, parameter: "WorkflowReviewersCanModifyTradingPartner" },
            { control: control.CompanyCode__, parameter: "WorkflowReviewersCanModifyCompanyCode" },
            { control: control.ProfitCenter__, parameter: "WorkflowReviewersCanModifyProfitCenter" }
        ];
        for (const coding of codingsParameters) {
            let readOnly = false;
            const acctAssCat = control.AcctAssCat__ ? control.AcctAssCat__.GetValue() : "";
            const multiAssignmentAllowed = isPo && Lib.ERP.IsSAP() && Lib.AP.SAP.IsMultiAccountAssignment(acctAssCat);
            const isPoReadOnly = isPo && !multiAssignmentAllowed;
            if (isPoReadOnly || isPosted || !coding.control.IsVisible()) {
                readOnly = true;
            }
            else if (isController) {
                readOnly = g_apParameters.GetParameter(coding.parameter) !== "1";
            }
            Lib.AP.GetInvoiceDocumentLayout().SetReadOnly(coding.control, readOnly);
        }
    },
    /**
     * Update the layout of the row at the specified index
     * @param {Control} control The Table or Row on which apply the layout update
     */
    SetGLLayout: function (control) {
        const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
        const poMatching = Lib.P2P.IsPOMatchingEnabled();
        InvoiceLineItem.ManageCodingsLayout(control, isPosted, false);
        control.Description__.SetReadOnly(!currentStepCanModifyLineItems() || isPosted);
        control.OrderNumber__.SetRequired(false);
        control.Quantity__.SetReadOnly(true);
        control.Buyer__.SetReadOnly(true);
        control.Receiver__.SetReadOnly(true);
        control.InvoicedUnitPrice__.SetReadOnly(true);
        if (Controls.InvoiceType__.GetValue() === Lib.AP.InvoiceType.PO_INVOICE) {
            Controls.LineItems__.InvoicedUnitPrice__.Hide(false);
            Controls.LineItems__.UnitPrice__.Hide(false);
            if (!poMatching) {
                control.OrderNumber__.SetReadOnly(true);
                control.ItemNumber__.SetReadOnly(true);
                control.PartNumber__.SetReadOnly(true);
            }
        }
        else {
            Controls.LineItems__.InvoicedUnitPrice__.Hide(true);
            Controls.LineItems__.UnitPrice__.Hide(true);
        }
    },
    SetAllowanceChargesLayout: function (row) {
        if (row && row.AllowanceChargeCode__) {
            const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
            const isAllowed = Sys.FRB2B.AP.IsFlux10_1Compliant() === "1";
            row.AllowanceChargeCode__.SetReadOnly(!row.IsVisible() || !isAllowed || !currentStepCanModifyLineItems() || isPosted);
        }
    },
    /**
     * Update the layout of the row at the specified index
     * @param {Control} control The Table or Row on which apply the layout update
     */
    SetPOLayout: function (control) {
        const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
        const isSubsequentDoc = Data.GetValue("SubsequentDocument__");
        const poMatching = Lib.P2P.IsPOMatchingEnabled();
        const isApStart = currentStepIsApStart();
        const canEditAmountRelatedFields = currentStepCanModifyLineItems() && !isPosted && !isSubsequentDoc;
        //Codings
        InvoiceLineItem.ManageCodingsLayout(control, isPosted, true);
        control.OrderNumber__.SetRequired(!Controls.ManualLink__.IsChecked());
        control.Quantity__.SetReadOnly(!canEditAmountRelatedFields);
        control.InvoicedUnitPrice__.SetReadOnly(!canEditAmountRelatedFields);
        Controls.LineItems__.InvoicedUnitPrice__.Hide(false);
        Controls.LineItems__.UnitPrice__.Hide(false);
        if (poMatching) {
            control.Description__.SetReadOnly(true);
            control.Buyer__.SetReadOnly(true);
            control.Receiver__.SetReadOnly(true);
            const isAmountBasedRow = Lib.P2P.InvoiceLineItem.IsAmountBasedRow(control);
            control.Quantity__.Hide(isAmountBasedRow);
            control.ExpectedQuantity__.Hide(isAmountBasedRow);
        }
        else if (isApStart) {
            control.GLAccount__.Hide(false);
            control.GLDescription__.Hide(false);
            control.CostCenter__.Hide(false);
            control.CCDescription__.Hide(false);
            control.OrderNumber__.SetReadOnly(false);
            control.ItemNumber__.SetReadOnly(false);
            control.PartNumber__.SetReadOnly(false);
            control.Description__.SetReadOnly(false);
            control.GLAccount__.SetReadOnly(false);
            control.CostCenter__.SetReadOnly(false);
            control.Buyer__.SetReadOnly(false);
            control.Receiver__.SetReadOnly(false);
        }
    },
    /**
     * Update the layout of the row at the specified index
     * @param {Control} control The Table or Row on which apply the layout update
     */
    SetPOGLLayout: function (control) {
        const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
        const isSubsequentDoc = Data.GetValue("SubsequentDocument__");
        const canEditAmountRelatedFields = currentStepCanModifyLineItems() && !isPosted && !isSubsequentDoc;
        InvoiceLineItem.ManageCodingsLayout(control, isPosted, false);
        control.Description__.SetReadOnly(isPosted);
        control.OrderNumber__.SetRequired(false);
        control.Buyer__.SetReadOnly(true);
        control.Receiver__.SetReadOnly(true);
        control.Quantity__.SetReadOnly(!canEditAmountRelatedFields);
        control.InvoicedUnitPrice__.SetReadOnly(!canEditAmountRelatedFields);
        Controls.LineItems__.InvoicedUnitPrice__.Hide(false);
        Controls.LineItems__.UnitPrice__.Hide(false);
    },
    /**
     * Update the layout of the row at the specified index
     * @param {Control} control The Table or Row on which apply the layout update
     */
    SetConsignmentLayout: function (control) {
        const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
        //Codings
        InvoiceLineItem.ManageCodingsLayout(control, isPosted, true);
        control.Quantity__.SetReadOnly(!currentStepCanModifyLineItems() || isPosted);
        control.OrderNumber__.SetRequired(false);
        control.Description__.SetReadOnly(true);
        control.Buyer__.SetReadOnly(true);
        control.Receiver__.SetReadOnly(true);
        control.InvoicedUnitPrice__.SetReadOnly(!currentStepCanModifyLineItems() || isPosted);
        control.Amount__.SetReadOnly(!currentStepCanModifyLineItems() || isPosted);
        Controls.LineItems__.InvoicedUnitPrice__.Hide(false);
        Controls.LineItems__.UnitPrice__.Hide(false);
    },
    /**
     * Update the Order Number field style of the row at the specified index
     * @param {Control} control The Table or Row on which apply the field style
     */
    SetPOLink: function (control) {
        if (control.IsLocalPO__.GetValue()) {
            control.OrderNumber__.DisplayAs({ type: "Link" });
        }
        else {
            control.OrderNumber__.DisplayAs({ type: "" });
        }
    },
    /**
     * Get the dispatchKey
     * @param {Item} item The item on which to get the dispatch key
     * @returns {string} the dispatch key
     */
    GetDispatchKey: function (item) {
        let key = "";
        if (item && InvoiceLineItem.IsPOLineItem(item)) {
            for (const val in InvoiceLineItem.dispatchKey) {
                if (Object.prototype.hasOwnProperty.call(InvoiceLineItem.dispatchKey, val)) {
                    key += item.GetValue(val) + "_";
                }
            }
        }
        return key;
    },
    /**
     * Get the dispatched lines total amount and quantity
     * @returns {DispatchMap} a dispatch map (mapping dispatched lines to their total amount and quantity)
     */
    GetDispatchedLinesAmountQuantity: function () {
        const map = {};
        const lineItemsTable = Data.GetTable("LineItems__");
        const nbItems = lineItemsTable.GetItemCount();
        for (let i = 0; i < nbItems; i++) {
            const item = lineItemsTable.GetItem(i);
            const key = InvoiceLineItem.GetDispatchKey(item);
            if (key) {
                if (!map[key]) {
                    map[key] = {
                        amount: item.GetValue("Amount__"),
                        quantity: item.GetValue("Quantity__")
                    };
                }
                else {
                    map[key].amount += item.GetValue("Amount__");
                    map[key].quantity += item.GetValue("Quantity__");
                }
            }
        }
        return map;
    },
    /**
     * Update the subFocusKey to be able to set specific style on duplicate and planned delivery costs lines
     * @param {TableRow} row The line used as reference
     */
    SetSubFocusKey: function (row) {
        const item = row ? row.GetItem() : null;
        if (item && (InvoiceLineItem.IsPOLineItem(item) || Lib.AP.ReceptionMethod.isEDI() || Sys.FRB2B.AP.IsInternationalEReportingEnabled())) {
            InvoiceLineItem.subFocusKey.focused = true;
            for (const val in InvoiceLineItem.subFocusKey) {
                if (Object.prototype.hasOwnProperty.call(InvoiceLineItem.subFocusKey, val) && val !== "focused") {
                    InvoiceLineItem.subFocusKey[val] = row[val] ? row[val].GetValue() : null;
                }
            }
        }
        else {
            InvoiceLineItem.subFocusKey.focused = false;
        }
    },
    /**
     * Set the dispatchKey
     * @param {TableRow} row The line used as reference
     */
    SetDispatchKey: function (row) {
        const item = row ? row.GetItem() : null;
        if (item && InvoiceLineItem.IsPOLineItem(item)) {
            for (const val in InvoiceLineItem.dispatchKey) {
                if (Object.prototype.hasOwnProperty.call(InvoiceLineItem.dispatchKey, val)) {
                    InvoiceLineItem.dispatchKey[val] = row[val] ? row[val].GetValue() : null;
                }
            }
        }
    },
    /**
     * Check if a PO line item is breakdowned
     * @param {TableRow} row The line to test
     * @return boolean True if the line is breakdowned
     */
    IsSubFocused: function (row) {
        const item = row ? row.GetItem() : null;
        if (InvoiceLineItem.subFocusKey.focused && item && (InvoiceLineItem.IsPOLineItem(item) || Lib.AP.ReceptionMethod.isEDI() || Sys.FRB2B.AP.IsInternationalEReportingEnabled())) {
            let bMatch = true;
            if (Sys.FRB2B.AP.IsFlux10_1Compliant() === "1" && InvoiceLineItem.subFocusKey.ExtractedDetails__) {
                const matches = (ref, toCompare) => {
                    return Boolean((toCompare[0] === ref[0] && toCompare[1] === ref[1]) || // Is same element
                        (toCompare[2] === ref[0] && toCompare[3] === ref[1]) || // ToCompare points to ref
                        (ref[2] && ref[3] && toCompare[0] === ref[2] && toCompare[1] === ref[3]) || // ref points to toCompare
                        (ref[2] && ref[3] && toCompare[2] === ref[2] && toCompare[3] === ref[3]) // ref points to the same element as toCompare
                    );
                };
                const getIdentifiers = (jsonExtractedDetails) => {
                    var _a, _b, _c, _d;
                    if (!jsonExtractedDetails) {
                        return [null, null, null, null];
                    }
                    try {
                        const parseDetails = JSON.parse(jsonExtractedDetails);
                        return [(_a = parseDetails === null || parseDetails === void 0 ? void 0 : parseDetails.id) === null || _a === void 0 ? void 0 : _a.id, (_b = parseDetails === null || parseDetails === void 0 ? void 0 : parseDetails.id) === null || _b === void 0 ? void 0 : _b.creationDT, (_c = parseDetails === null || parseDetails === void 0 ? void 0 : parseDetails.source) === null || _c === void 0 ? void 0 : _c.id, (_d = parseDetails === null || parseDetails === void 0 ? void 0 : parseDetails.source) === null || _d === void 0 ? void 0 : _d.creationDT];
                    }
                    catch (_e) {
                    }
                    return [null, null, null, null];
                };
                const selectedKeys = getIdentifiers(InvoiceLineItem.subFocusKey.ExtractedDetails__);
                const currentLineKeys = getIdentifiers(row.ExtractedDetails__.GetValue());
                if (selectedKeys[0] && selectedKeys[1]) {
                    bMatch = bMatch && matches(selectedKeys, currentLineKeys);
                    return bMatch;
                }
            }
            let allEmpty = true;
            for (const val in InvoiceLineItem.subFocusKey) {
                if (Object.prototype.hasOwnProperty.call(InvoiceLineItem.subFocusKey, val) && ["focused", "ExtractedDetails__"].indexOf(val) === -1) {
                    allEmpty = allEmpty && !row[val].GetValue();
                    bMatch = bMatch && Object.prototype.hasOwnProperty.call(row, val) && row[val].GetValue() === InvoiceLineItem.subFocusKey[val];
                }
            }
            return bMatch && !allEmpty;
        }
        return false;
    },
    /**
     * Set/Unset the breakdown style on a line
     * @param {TableRow} row The line to test
     */
    SetSubFocusStyle: function (row) {
        if (InvoiceLineItem.IsSubFocused(row)) {
            row.AddRowStyle("grouped");
        }
        else {
            row.RemoveRowStyle("grouped");
        }
    },
    RefreshSubFocusStyles: function (row) {
        InvoiceLineItem.SetSubFocusKey(row);
        const nbLines = Math.min(Controls.LineItems__.GetItemCount(), Controls.LineItems__.GetLineCount());
        for (let i = 0; i < nbLines; i++) {
            InvoiceLineItem.SetSubFocusStyle(Controls.LineItems__.GetRow(i));
        }
    },
    /**
     * Update the layout of the row at the specified index
     * @param {TableRow} row The row to update
     */
    UpdateRowLayoutToLineType: function (row) {
        if (row && row.LineType__) {
            switch (row.LineType__.GetValue()) {
                case Lib.P2P.LineType.PO:
                    InvoiceLineItem.SetPOLayout(row);
                    break;
                case Lib.P2P.LineType.POGL:
                    InvoiceLineItem.SetPOGLLayout(row);
                    break;
                case Lib.P2P.LineType.GL:
                    InvoiceLineItem.SetGLLayout(row);
                    break;
                case Lib.P2P.LineType.CONSIGNMENT:
                    InvoiceLineItem.SetConsignmentLayout(row);
                    break;
                default:
                    InvoiceLineItem.SetGLLayout(row);
                    break;
            }
            InvoiceLineItem.SetPOLink(row);
            if (Sys.FRB2B.AP.IsInternationalEReportingEnabled()) {
                InvoiceLineItem.SetAllowanceChargesLayout(row);
            }
        }
    },
    /**
     * Update the layout of the table
     */
    UpdateTableLayoutToLineType: function () {
        // Update all rows actually being displayed
        const nbLines = Math.min(Controls.LineItems__.GetItemCount(), Controls.LineItems__.GetLineCount(true));
        let nbAmountBasedItems = 0;
        let hideAllowanceChargeColumns = true;
        for (let i = 0; i < nbLines; i++) {
            const row = Controls.LineItems__.GetRow(i);
            if (row && row.IsVisible()) {
                InvoiceLineItem.UpdateRowLayoutToLineType(row);
                const item = Controls.LineItems__.GetItem(i);
                if (Lib.P2P.InvoiceLineItem.IsAmountBasedItem(item)) {
                    nbAmountBasedItems++;
                }
                const allowanceChargeCode = item.GetValue("AllowanceChargeCode__");
                if (hideAllowanceChargeColumns &&
                    ((Lib.AP.ReceptionMethod.isEDI() && allowanceChargeCode) ||
                        Sys.FRB2B.AP.IsFlux10_1Compliant() === "1")) {
                    hideAllowanceChargeColumns = false;
                }
            }
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnRefreshLineItemRowEnd", row);
        }
        // If the invoice contains only amount based items
        // hide quantity columns
        if (nbLines > 0 && nbAmountBasedItems === nbLines) {
            Controls.LineItems__.Quantity__.Hide(true);
            Controls.LineItems__.ExpectedQuantity__.Hide(true);
        }
        if (hideAllowanceChargeColumns) {
            Controls.LineItems__.GrossUnitPrice__.Hide(true);
            Controls.LineItems__.AllowanceChargeCode__.Hide(true);
        }
        else {
            // Always hide UnitPrice__ and GrossUnitPrice__ when invoice is flux 10.1 compliant and is not an EDI invoice
            if (Sys.FRB2B.AP.IsFlux10_1Compliant() === "1" && !Lib.AP.ReceptionMethod.isEDI()) {
                Controls.LineItems__.InvoicedUnitPrice__.Hide(true);
                Controls.LineItems__.UnitPrice__.Hide(true);
                Controls.LineItems__.GrossUnitPrice__.Hide(true);
            }
            else {
                Controls.LineItems__.InvoicedUnitPrice__.Hide(false);
                Controls.LineItems__.UnitPrice__.Hide(false);
                Controls.LineItems__.GrossUnitPrice__.Hide(false);
            }
            Controls.LineItems__.AllowanceChargeCode__.Hide(false);
        }
        // handle no tax code mode
        if (Lib.AP.GetInvoiceDocument().DoNotUseTaxCode()) {
            Controls.LineItems__.TaxCode__.Hide(true);
            Controls.LineItems__.TaxRate__.Hide(false);
            Controls.LineItems__.TaxRate__.SetReadOnly(false);
            if (Lib.ERP.IsSAP()) {
                Controls.LineItems__.TaxJurisdiction__.Hide(true);
            }
        }
        else {
            Controls.LineItems__.TaxCode__.Hide(false);
            Controls.LineItems__.TaxRate__.SetReadOnly(true);
            if (Lib.ERP.IsSAP()) {
                Controls.LineItems__.TaxJurisdiction__.Hide(false);
            }
        }
        Controls.LineItems__.TaxAmount__.SetReadOnly(Controls.CalculateTax__.IsChecked());
    },
    /**
     * Delete all lines items
     */
    ClearLineItems: function () {
        const invoiceDocument = Lib.AP.GetInvoiceDocument();
        const lineItemsTable = Data.GetTable("LineItems__");
        lineItemsTable.SetItemCount(0);
        Lib.AP.ResetLineItemsCache();
        InvoiceLineItem.iNonPOLinesCount = 0;
        InvoiceLineItem.iGRIVPOLinesCount = 0;
        InvoiceLineItem.iNonGRIVPODNLinesCount = 0;
        const headerAmounts = invoiceDocument.computeHeaderAmount();
        updateNetAmountAndMismatch(headerAmounts.netAmount, headerAmounts.mismatchAmount);
        Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
        Controls.EnergyConsumptionKgCO2e__.SetValue("");
        Controls.EnergyConsumptionPrecision__.SetValue(Lib.P2P.GHGEmissions.EnergyConsumptionPrecisionType.Undetermined);
        Controls.EnergyConsumptionKgCO2e__.SetHelpData("");
        invoiceDocument.ComputePaymentAmountsAndDates(true, Lib.AP.IsCreditNote());
        invoiceDocument.UpdateLocalAndCorporateAmounts();
        onLocalNetAmountUpdate();
        Lib.ERP.checkBalance(true);
        // Clear reconciliation warning
        if (Variable.GetValueAsString("ReconciledByHeader")) {
            Variable.SetValueAsString("ReconciledByHeader", false);
            Controls.ReconcileWarning__.Hide(true);
        }
    },
    /**
     * Update visible/hide columns and define which cells can be modified
     * depending the invoice type and the line type
     */
    UpdateLineItemsLayout: function () {
        // The line items visible columns depend on Invoice Type
        // Visible columns for Non-PO Invoice: Description | Amount | G/L Account | Cost Center | Tax Code | Tax Amount
        // Visible columns for PO Invoice: Order Number | Item Number | Description | Expected quantity | Expected Amount | Quantity | Amount | Tax Code | Tax Amount
        // Visible columns for POGL Invoice: Order Number | Item Number | Description | Expected quantity | Expected Amount | Quantity | Amount | G/L Account | Cost Center | Tax Code | Tax Amount
        // Visible columns for PO Invoice without PO Matching: Order Number | Part Number | Description | Quantity | Amount | Tax Code | Tax Amount | Tax Rate
        // If the workflow is in progress or the invoice is already posted,
        // enable add/remove lines
        Controls.LineItems__.SetReadOnly(false);
        Controls.LineItems__.SetAllowSortTable(true);
        Controls.LineItems__.HideTableRowMenu("hideNothing");
        if (!currentStepCanModifyLineItems() || Controls.ERPPostingDate__.GetValue() || Lib.AP.InvoiceType.isConsignmentInvoice()) {
            Controls.LineItems__.SetReadOnly(true);
            if (!LayoutHelper.UpdateRequestCreditNoteButtons()) {
                // disable add/remove lines
                Controls.LineItems__.SetAllowSortTable(false);
                Controls.LineItems__.HideTableRowMenu("hideMenuAndCheckbox");
            }
        }
        if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
            Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
        }
        // Update columns/cells visibility and read only
        let updateLineFunction, lineType;
        switch (Controls.InvoiceType__.GetValue()) {
            case Lib.AP.InvoiceType.PO_INVOICE:
                updateLineFunction = InvoiceLineItem.updatePOLineItemsLayout;
                lineType = Lib.P2P.LineType.PO;
                break;
            case Lib.AP.InvoiceType.PO_INVOICE_AS_FI:
                updateLineFunction = InvoiceLineItem.updatePOGLLineItemsLayout;
                lineType = Lib.P2P.LineType.POGL;
                break;
            case Lib.AP.InvoiceType.CONSIGNMENT:
                updateLineFunction = InvoiceLineItem.updateConsignmentLineItemsLayout;
                lineType = Lib.P2P.LineType.CONSIGNMENT;
                break;
            default:
                updateLineFunction = InvoiceLineItem.updateGLLineItemsLayout;
                lineType = Lib.P2P.LineType.GL;
                break;
        }
        //Force update first line type
        const row = Controls.LineItems__.GetRow(0);
        if (row && row.LineType__) {
            const nbItems = Data.GetTable("LineItems__").GetItemCount();
            const isItemEmpty = row.GetItem() && InvoiceLineItem.IsEmpty(row.GetItem());
            if (nbItems === 0 || isItemEmpty) {
                row.LineType__.SetValue(lineType);
                if (lineType === Lib.P2P.LineType.GL) {
                    row.ItemType__.SetValue(Lib.P2P.ItemType.AMOUNT_BASED);
                }
            }
        }
        updateLineFunction();
        this.UpdateTableLayoutToLineType();
        Lib.AP.GetInvoiceDocument().OnRefreshLineItemsTableEnd();
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnRefreshLineItemsTableEnd", Controls.LineItems__);
    },
    ManageCodingsVisibility: function (hasGLlines) {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        const forceDisplay = hasGLlines || Lib.ERP.IsSAP();
        layout.Hide(Controls.LineItems__.GLAccount__, !forceDisplay || g_apParameters.GetParameter("CodingEnableGLAccount") !== "1");
        layout.Hide(Controls.LineItems__.GLDescription__, !forceDisplay || g_apParameters.GetParameter("CodingEnableGLAccount") !== "1");
        layout.Hide(Controls.LineItems__.CostCenter__, !forceDisplay || g_apParameters.GetParameter("CodingEnableCostCenter") !== "1");
        layout.Hide(Controls.LineItems__.CCDescription__, !forceDisplay || g_apParameters.GetParameter("CodingEnableCostCenter") !== "1");
        layout.Hide(Controls.LineItems__.ProjectCode__, !hasGLlines || g_apParameters.GetParameter("CodingEnableProjectCode") !== "1" || g_p2pParameters.GetParameter("EnableProject", false));
        layout.Hide(Controls.LineItems__.ProjectCodeDescription__, !hasGLlines || g_apParameters.GetParameter("CodingEnableProjectCode") !== "1");
        // PO invoice, even GL line, does not support trading partner
        layout.Hide(Controls.LineItems__.TradingPartner__, !forceDisplay || g_apParameters.GetParameter("CodingEnableTradingPartner") !== "1" || Lib.AP.InvoiceType.isPOInvoice());
        layout.Hide(Controls.LineItems__.BusinessArea__, !forceDisplay || g_apParameters.GetParameter("CodingEnableBusinessArea") !== "1");
        layout.Hide(Controls.LineItems__.InternalOrder__, !forceDisplay || g_apParameters.GetParameter("CodingEnableInternalOrder") !== "1");
        layout.Hide(Controls.LineItems__.WBSElement__, !forceDisplay || g_apParameters.GetParameter("CodingEnableWBSElement") !== "1");
        layout.Hide(Controls.LineItems__.Assignment__, !forceDisplay || g_apParameters.GetParameter("CodingEnableAssignments") !== "1");
        layout.Hide(Controls.LineItems__.CompanyCode__, !forceDisplay || g_apParameters.GetParameter("CodingEnableCompanyCode") !== "1");
        layout.Hide(Controls.LineItems__.ProfitCenter__, !forceDisplay || g_apParameters.GetParameter("CodingEnableProfitCenter") !== "1");
        layout.Hide(Controls.LineItems__.ProfitCenterDescription__, !forceDisplay || g_apParameters.GetParameter("CodingEnableProfitCenter") !== "1");
        layout.Hide(Controls.Assignment__, !forceDisplay || g_apParameters.GetParameter("CodingEnableAssignments") !== "1");
        // Show CostType only if the feature is activated
        layout.Hide(Controls.LineItems__.CostType__, !(g_p2pParameters.GetParameter("EnablePurchasingGlobalSetting") === "1" && g_pacParameters.GetParameter("DisplayCostType") && forceDisplay));
        // Allows to manage the visibility of custom fields
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ManageCustomCodingsVisibility", hasGLlines);
    },
    updateProcurementProjectLineItems() {
        // Manage Procurement project management
        const enableProject = g_p2pParameters.GetParameter("EnableProject", false);
        Controls.LineItems__.ProjectName__.Hide(!enableProject);
        Controls.LineItems__.ProjectName__.SetReadOnly(!enableProject);
        const OnSelectItem = function (item) {
            let currentItem = this.GetItem();
            if (item) {
                currentItem.SetValue("ProjectName__", item.GetValue("Name__"));
                currentItem.SetValue("ProjectNumber__", item.GetValue("ProjectNumber__"));
            }
            else {
                currentItem.SetValue("ProjectNumber__", "");
                currentItem.SetValue("ProjectName__", "");
                currentItem.SetError("ProjectName__", "Field value does not belong to table!");
            }
        };
        const OnUnknownOrEmptyValue = function () {
            let currentItem = this.GetItem();
            currentItem.SetValue("ProjectName__", null);
            currentItem.SetValue("ProjectNumber__", null);
        };
        Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineItems__.ProjectName__, OnSelectItem, OnUnknownOrEmptyValue, OnUnknownOrEmptyValue);
    },
    /**
     * Update the line items layout for GL invoice
     */
    updateGLLineItemsLayout: function () {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        InvoiceLineItem.ManageCodingsVisibility(true);
        //Erp specific
        layout.Hide(Controls.Investment__, true);
        Controls.SubsequentDocument__.Check(false);
        Controls.LineItems__.ItemType__.Hide(true);
        Controls.LineItems__.PreviousContractNumber__.Hide(true);
        Controls.LineItems__.OrderNumber__.Hide(true);
        Controls.LineItems__.InvoicedUnitPrice__.Hide(true);
        Controls.LineItems__.GoodIssue__.Hide(true);
        Controls.LineItems__.ItemNumber__.Hide(true);
        Controls.LineItems__.PartNumber__.Hide(true);
        Controls.LineItems__.Quantity__.Hide(true);
        Controls.LineItems__.ExpectedQuantity__.Hide(true);
        Controls.LineItems__.ExpectedAmount__.Hide(true);
        Controls.LineItems__.MismatchAmount__.Hide(true);
        Controls.LineItems__.MismatchAmountPercent__.Hide(true);
        Controls.LineItems__.DeliveryNote__.Hide(true);
        Controls.LineItems__.GoodsReceipt__.Hide(true);
        Controls.LineItems__.Buyer__.Hide(true);
        Controls.LineItems__.Receiver__.Hide(true);
        Controls.LineItems__.PriceMismatchResponsible__.Hide(true);
        Controls.LineItems__.QuantityMismatchResponsible__.Hide(true);
        Controls.LineItems__.PriceMismatchResolution__.Hide(true);
        Controls.LineItems__.QuantityMismatchResolution__.Hide(true);
        Controls.LineItems__.UnitOfMeasureCode__.Hide(true);
        InvoiceLineItem.SetGLLayout(Controls.LineItems__);
        Controls.OrderNumber__.SetBrowsable(false);
        Controls.OrderNumber__.Hide(false);
        Controls.GoodIssue__.Hide(true);
        Controls.UnplannedDeliveryCosts__.Hide(true);
        Controls.UnplannedDeliveryCosts__.SetValue(null);
        Controls.Line_Items_Actions.Hide(false);
        Controls.ButtonLoadTemplate__.Hide(false);
        Controls.ButtonSaveTemplate__.Hide(false);
        Controls.ButtonLoadClipboard__.Hide(false);
        InvoiceLineItem.updateProcurementProjectLineItems();
        Controls.ButtonPriceMismatchSort__.Hide(true);
        Controls.RequestCreditNotes.Hide(true);
        ParameterDetails.hide();
    },
    /**
     * Update the line items layout for PO invoices
     */
    updatePOLineItemsLayout: function () {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        InvoiceLineItem.ManageCodingsVisibility(InvoiceLineItem.iNonPOLinesCount >= 1);
        const poMatching = Lib.P2P.IsPOMatchingEnabled();
        const isApStart = currentStepIsApStart();
        const IsExceptionResolvedOnLineItemLevel = Lib.AP.IsExceptionResolvedOnLineItemLevel();
        Controls.LineItems__.ItemType__.Hide(true);
        Controls.LineItems__.PreviousContractNumber__.Hide(true);
        Controls.LineItems__.OrderNumber__.Hide(false);
        Controls.LineItems__.InvoicedUnitPrice__.Hide(false);
        Controls.LineItems__.GoodIssue__.Hide(true);
        Controls.LineItems__.ItemNumber__.Hide(poMatching || !isApStart);
        Controls.LineItems__.PartNumber__.Hide(false);
        Controls.LineItems__.Quantity__.Hide(false);
        Controls.LineItems__.ExpectedQuantity__.Hide(!poMatching);
        Controls.LineItems__.ExpectedAmount__.Hide(!poMatching);
        Controls.LineItems__.MismatchAmount__.Hide(!poMatching);
        Controls.LineItems__.MismatchAmountPercent__.Hide(!poMatching);
        Controls.LineItems__.GoodsReceipt__.Hide(true);
        Controls.LineItems__.Buyer__.Hide(false);
        Controls.LineItems__.Receiver__.Hide(false);
        Controls.LineItems__.PriceMismatchResponsible__.Hide(!IsExceptionResolvedOnLineItemLevel);
        Controls.LineItems__.QuantityMismatchResponsible__.Hide(!IsExceptionResolvedOnLineItemLevel);
        Controls.LineItems__.PriceMismatchResolution__.Hide(!IsExceptionResolvedOnLineItemLevel);
        Controls.LineItems__.QuantityMismatchResolution__.Hide(!IsExceptionResolvedOnLineItemLevel);
        Controls.LineItems__.UnitOfMeasureCode__.Hide(true);
        InvoiceLineItem.updateProcurementProjectLineItems();
        if (Controls.GRIV__.IsChecked() || InvoiceLineItem.iGRIVPOLinesCount > 0) {
            LayoutHelper.SwitchToGRIV();
        }
        else {
            Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
        }
        // Hide or show new columns if GL line exist
        if (InvoiceLineItem.iNonPOLinesCount >= 1) {
            InvoiceLineItem.UpdateTableLayoutToLineType();
        }
        else {
            InvoiceLineItem.SetPOLayout(Controls.LineItems__);
        }
        layout.Hide(Controls.Investment__, !Lib.P2P.IsInvestmentEnabled());
        if (Data.GetValue("ERPInvoiceNumber__") || Data.GetValue("ERPMMInvoiceNumber__")) {
            Controls.OrderNumber__.SetBrowsable(false);
        }
        else {
            Controls.OrderNumber__.SetBrowsable(!ProcessInstance.isReadOnly);
        }
        Controls.OrderNumber__.Hide(false);
        Controls.GoodIssue__.Hide(true);
        layout.Hide(Controls.UnplannedDeliveryCosts__, false);
        Controls.ButtonLoadTemplate__.Hide(true);
        Controls.ButtonSaveTemplate__.Hide(true);
        Controls.ButtonLoadClipboard__.Hide(true);
        Controls.Line_Items_Actions.Hide(true);
        ParameterDetails.hide();
    },
    /**
     * Update the line items layout for PO invoices
     */
    updateConsignmentLineItemsLayout: function () {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        InvoiceLineItem.ManageCodingsVisibility(true);
        //Erp specific
        Controls.LineItems__.ItemType__.Hide(true);
        Controls.LineItems__.PreviousContractNumber__.Hide(true);
        layout.Hide(Controls.Investment__, true);
        Controls.LineItems__.OrderNumber__.Hide(true);
        Controls.LineItems__.InvoicedUnitPrice__.Hide(true);
        Controls.LineItems__.GoodIssue__.Hide(false);
        Controls.LineItems__.ItemNumber__.Hide(true);
        Controls.LineItems__.PartNumber__.Hide(false);
        Controls.LineItems__.Quantity__.Hide(false);
        Controls.LineItems__.ExpectedQuantity__.Hide(true);
        Controls.LineItems__.ExpectedAmount__.Hide(true);
        Controls.LineItems__.MismatchAmount__.Hide(true);
        Controls.LineItems__.MismatchAmountPercent__.Hide(true);
        Controls.LineItems__.DeliveryNote__.Hide(true);
        Controls.LineItems__.GoodsReceipt__.Hide(true);
        Controls.LineItems__.Buyer__.Hide(true);
        Controls.LineItems__.Receiver__.Hide(true);
        Controls.LineItems__.PriceMismatchResponsible__.Hide(true);
        Controls.LineItems__.QuantityMismatchResponsible__.Hide(true);
        Controls.LineItems__.PriceMismatchResolution__.Hide(true);
        Controls.LineItems__.QuantityMismatchResolution__.Hide(true);
        InvoiceLineItem.SetConsignmentLayout(Controls.LineItems__);
        Controls.OrderNumber__.SetBrowsable(false);
        Controls.OrderNumber__.Hide(true);
        Controls.GoodIssue__.Hide(false);
        Controls.UnplannedDeliveryCosts__.Hide(true);
        Controls.UnplannedDeliveryCosts__.SetValue(null);
        Controls.Line_Items_Actions.Hide(false);
        Controls.ButtonLoadTemplate__.Hide(false);
        Controls.ButtonSaveTemplate__.Hide(false);
        Controls.ButtonLoadClipboard__.Hide(false);
        ParameterDetails.hide();
    },
    /**
     * Update the line items layout for PO as FI invoices
     */
    updatePOGLLineItemsLayout: function () {
        InvoiceLineItem.ManageCodingsVisibility(true);
        const IsExceptionResolvedOnLineItemLevel = Lib.AP.IsExceptionResolvedOnLineItemLevel();
        Controls.LineItems__.ItemType__.Hide(true);
        Controls.LineItems__.PreviousContractNumber__.Hide(true);
        Controls.LineItems__.OrderNumber__.Hide(false);
        Controls.LineItems__.InvoicedUnitPrice__.Hide(false);
        Controls.LineItems__.GoodIssue__.Hide(true);
        Controls.LineItems__.ItemNumber__.Hide(true);
        Controls.LineItems__.PartNumber__.Hide(false);
        Controls.LineItems__.Quantity__.Hide(false);
        Controls.LineItems__.ExpectedQuantity__.Hide(false);
        Controls.LineItems__.ExpectedAmount__.Hide(false);
        Controls.LineItems__.MismatchAmount__.Hide(false);
        Controls.LineItems__.MismatchAmountPercent__.Hide(false);
        Controls.LineItems__.GoodsReceipt__.Hide(true);
        Controls.LineItems__.Buyer__.Hide(false);
        Controls.LineItems__.Receiver__.Hide(false);
        Controls.LineItems__.PriceMismatchResponsible__.Hide(!IsExceptionResolvedOnLineItemLevel);
        Controls.LineItems__.QuantityMismatchResponsible__.Hide(!IsExceptionResolvedOnLineItemLevel);
        Controls.LineItems__.PriceMismatchResolution__.Hide(!IsExceptionResolvedOnLineItemLevel);
        Controls.LineItems__.QuantityMismatchResolution__.Hide(!IsExceptionResolvedOnLineItemLevel);
        if (Controls.GRIV__.IsChecked()) {
            LayoutHelper.SwitchToGRIV();
        }
        else {
            Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
        }
        if (!Controls.ERPPostingDate__.GetValue()) {
            InvoiceLineItem.UpdateTableLayoutToLineType();
        }
        if (Data.GetValue("ERPInvoiceNumber__") || Data.GetValue("ERPMMInvoiceNumber__")) {
            Controls.OrderNumber__.SetBrowsable(false);
        }
        else {
            Controls.OrderNumber__.SetBrowsable(!ProcessInstance.isReadOnly);
        }
        Controls.OrderNumber__.Hide(false);
        Controls.GoodIssue__.Hide(true);
        Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.UnplannedDeliveryCosts__, false);
        Controls.CodingTemplate__.Hide(true);
        ParameterDetails.hide();
    },
    /**
     * Update line item with default GL line values
     * @param {Data} item Destination table item
     */
    UpdateGLLineItem: function (item) {
        if (item.GetValue("LineType__") !== Lib.P2P.LineType.GL) {
            item.SetValue("LineType__", Lib.P2P.LineType.GL);
            item.SetValue("TaxAmount__", 0.0);
            // GL lines are amount based since we don't need to specify any quantity
            item.SetValue("ItemType__", Lib.P2P.ItemType.AMOUNT_BASED);
            InvoiceLineItem.iNonPOLinesCount++;
            if (InvoiceLineItem.iNonPOLinesCount === 1) {
                InvoiceLineItem.UpdateLineItemsLayout();
            }
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizeFieldsOnAddedGLLineItem", item);
    },
    /**
     * Update line item with default PO line values
     * @param {Data} item Destination table item
     */
    UpdatePOLineItem: function (item) {
        item.SetValue("LineType__", Lib.P2P.LineType.PO);
        item.SetValue("TaxAmount__", 0.0);
    },
    /**
     * Update line item with default PO line values
     * @param {Data} item Destination table item
     */
    UpdatePOGLLineItem: function (item) {
        item.SetValue("LineType__", Lib.P2P.LineType.POGL);
        item.SetValue("TaxAmount__", 0.0);
    },
    /**
     * Update line item with default PO line values
     * @param {Data} item Destination table item
     */
    UpdateConsignmentLineItem: function (item) {
        item.SetValue("LineType__", Lib.P2P.LineType.CONSIGNMENT);
        item.SetValue("TaxAmount__", 0.0);
    },
    /**
     * Add a table line
     * @param {Table} table Destination table
     * @param {integer} itemIndex Index to insert the item to
     * @return newly create table line item
     */
    AddLineItem: function (table, itemIndex) {
        let item;
        let cnt = table.GetItemCount();
        if (itemIndex || itemIndex === 0) {
            InvoiceLineItem.iIndexForNewItem = itemIndex;
        }
        if (InvoiceLineItem.iIndexForNewItem < 0) {
            InvoiceLineItem.iIndexForNewItem = cnt;
        }
        if (InvoiceLineItem.iIndexForNewItem >= cnt) {
            // append line
            table.SetItemCount(++cnt);
            item = table.GetItem(cnt - 1);
        }
        else {
            // insert line
            const nextItem = table.GetItem(InvoiceLineItem.iIndexForNewItem);
            item = nextItem.AddItem(true);
        }
        InvoiceLineItem.iIndexForNewItem++;
        return item;
    },
    /**
     * Add a table line with default GL lines values
     * @param {Table} table Destination table
     * @return newly created table GL line item
     */
    AddGLLineItem: function (table) {
        const item = InvoiceLineItem.AddLineItem(table);
        InvoiceLineItem.UpdateGLLineItem(item);
        return item;
    },
    /**
     * Add a table line with default PO line default values
     * @param {Table} table Destination table
     * @return newly created table PO line item
     */
    AddPOLineItem: function (table, index) {
        const item = InvoiceLineItem.AddLineItem(table, index);
        InvoiceLineItem.UpdatePOLineItem(item);
        return item;
    },
    /**
     * Add a table line with default PO_FI line default values
     * @param {Table} table Destination table
     * @return newly created table PO line item
     */
    AddPOGLLineItem: function (table) {
        const item = InvoiceLineItem.AddLineItem(table);
        InvoiceLineItem.UpdatePOGLLineItem(item);
        return item;
    },
    /**
     * Update state informations when a line is deleted
     * @param {Data} item The removed data
     */
    RemoveLineItem: function (item) {
        if (item) {
            if (InvoiceLineItem.IsGLLineItem(item)) {
                InvoiceLineItem.iNonPOLinesCount--;
            }
            else if (InvoiceLineItem.IsGRIVPOLineItem(item)) {
                InvoiceLineItem.iGRIVPOLinesCount--;
                if (InvoiceLineItem.iGRIVPOLinesCount === 0 && Lib.P2P.IsGRIVEnabledByLine()) {
                    LayoutHelper.SwitchToNonGRIV();
                }
            }
            else if (InvoiceLineItem.IsNonGRIVPODNLineItem(item)) {
                InvoiceLineItem.iNonGRIVPODNLinesCount--;
                Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
            }
        }
    },
    AddSubsequentLines: function (item, index, values, refreshLinesCallback, sourceItem, sourceIndex) {
        const keys = [];
        for (const key in values) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                keys.push(key);
            }
        }
        if (!keys || keys.length === 0) {
            let description = "_PO item dispatching is not available for the selected item";
            let header = "_PO item dispatching";
            Popup.Alert(description, false, null, header);
            item.Remove();
            return;
        }
        if (keys.length === 1) {
            values[keys[0]](item, index, sourceItem, sourceIndex);
            if (refreshLinesCallback) {
                refreshLinesCallback(item, index, sourceItem, sourceIndex);
            }
            return;
        }
        const fillDialog = (dialog) => {
            const browseMessageCtrl = dialog.AddDescription("HelpText", null);
            browseMessageCtrl.SetText("_Kind of line popup question");
            dialog.AddSeparator();
            const radio = dialog.AddRadioButton("lineTypeChoice");
            radio.SetText(keys.join("\n"));
            if (keys.length > 0) {
                radio.SetValue(keys[0]);
            }
        };
        const rollbackDialog = () => {
            item.Remove();
        };
        const commitDialog = (dialog, tabId) => {
            if (!tabId) {
                // callback from base dialog
                const newValue = dialog.GetControl("lineTypeChoice").GetValue();
                if (values[newValue]) {
                    values[newValue](item, index, sourceItem, sourceIndex);
                    if (refreshLinesCallback) {
                        refreshLinesCallback(item, index, sourceItem, sourceIndex);
                    }
                }
                else if (keys.length > 0) {
                    values[keys[0]](item, index, sourceItem, sourceIndex);
                    if (refreshLinesCallback) {
                        refreshLinesCallback(item, index, sourceItem, sourceIndex);
                    }
                }
            }
        };
        Popup.Dialog("_Kind of line popup title", null, fillDialog, commitDialog, null, null, null, rollbackDialog);
    },
    LastIDCache: null,
    GetNextID: function () {
        let nextVal;
        if (InvoiceLineItem.LastIDCache !== null) {
            nextVal = InvoiceLineItem.LastIDCache + 1;
            InvoiceLineItem.LastIDCache = nextVal;
            return nextVal;
        }
        const lines = Data.GetTable("LineItems__");
        let max = 0;
        for (let i = 0; i < lines.GetItemCount(); i++) {
            const item = lines.GetItem(i);
            const content = item.GetValue("ExtractedDetails__");
            if (content) {
                try {
                    const extractedDetaislParsed = JSON.parse(content);
                    if (extractedDetaislParsed &&
                        extractedDetaislParsed.uid &&
                        extractedDetaislParsed.uid !== 0 &&
                        max < extractedDetaislParsed.uid + 1) {
                        max = extractedDetaislParsed.uid;
                    }
                }
                catch (_a) {
                }
            }
        }
        nextVal = max + 1;
        InvoiceLineItem.LastIDCache = nextVal;
        return nextVal;
    },
    GetExtractedInfoWithUniqueIdentifiers: function (content) {
        if (!Sys.FRB2B.AP.IsInternationalEReportingEnabled()) {
            try {
                return JSON.parse(content);
            }
            catch (_a) { }
            return null;
        }
        let extractedItemInfo = {};
        try {
            extractedItemInfo = JSON.parse(content);
            if (!extractedItemInfo) {
                extractedItemInfo = {};
            }
            if (!extractedItemInfo.id) {
                extractedItemInfo.id = {
                    id: InvoiceLineItem.GetNextID(),
                    creationDT: Sys.Helpers.Date.Date2DBDateTime(new Date())
                };
            }
        }
        catch (e) {
            extractedItemInfo.id = {
                id: InvoiceLineItem.GetNextID(),
                creationDT: Sys.Helpers.Date.Date2DBDateTime(new Date())
            };
        }
        return extractedItemInfo;
    },
    /**
     * Manage the OnDuplicateItem of a Table control
     * @param {Data} item The line which was added
     * @param {integer} index An integer representing the added line index
     * @param {Data} sourceItem The line which was duplicated
     * @param {integer} sourceIndex An integer representing the duplicated line index
     */
    OnDuplicateItem: function (item, index, sourceItem, sourceIndex) {
        const acctAssCat = item.GetValue("AcctAssCat__");
        const itemIsDuplicable = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.IsItemDuplicable", item);
        const isPOItemDispatchIsDisabled = (itemIsDuplicable === false) || (!itemIsDuplicable && InvoiceLineItem.IsPOLineItem(item) && !Lib.AP.SAP.IsMultiAccountAssignment(acctAssCat));
        const computeAmountAfterAddingLine = () => {
            InvoiceLineItem.iIndexForNewItem++;
            const headerAmounts = Lib.AP.GetInvoiceDocument().computeHeaderAmount();
            updateNetAmountAndMismatch(headerAmounts.netAmount, headerAmounts.mismatchAmount);
            Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
            Lib.AP.GetInvoiceDocument().ComputePaymentAmountsAndDates(true, Lib.AP.IsCreditNote());
            Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
            onLocalNetAmountUpdate();
            Lib.ERP.checkBalance(true);
            checkPOInvoiceLineItems();
            InvoiceLineItem.UpdateTableLayoutToLineType();
            Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
        };
        const AllowedLinesToCreate = {};
        if (Sys.FRB2B.AP.IsInternationalEReportingEnabled() && !isPOItemDispatchIsDisabled) {
            AllowedLinesToCreate["_Account assignment"] = (duplicatedItem, idx, srcItem, srcIdx) => {
                let itemInfo;
                if (srcIdx || srcIdx === 0) {
                    const sourceItemInfo = InvoiceLineItem.GetExtractedInfoWithUniqueIdentifiers(srcItem.GetValue("ExtractedDetails__"));
                    itemInfo = InvoiceLineItem.GetExtractedInfoWithUniqueIdentifiers("");
                    if (sourceItemInfo) {
                        srcItem.SetValue("ExtractedDetails__", JSON.stringify(sourceItemInfo));
                        itemInfo.source = sourceItemInfo.source ? sourceItemInfo.source : sourceItemInfo.id;
                        if (sourceItemInfo.MappingName === Sys.AP.PreviewMappingLineType.AllowanceAtLineLevel ||
                            sourceItemInfo.MappingName === Sys.AP.PreviewMappingLineType.ChargeAtLineLevel ||
                            sourceItemInfo.MappingName === Sys.AP.PreviewMappingLineType.ChargeAtDocumentLevel ||
                            sourceItemInfo.MappingName === Sys.AP.PreviewMappingLineType.AllowanceAtDocumentLevel) {
                            itemInfo.MappingName = sourceItemInfo.MappingName;
                        }
                        else if (sourceItemInfo.MappingName === Sys.AP.PreviewMappingLineType.LineWithAllowanceCharge) {
                            itemInfo.MappingName = Sys.AP.PreviewMappingLineType.Default;
                        }
                    }
                }
                if (!itemInfo) {
                    itemInfo = InvoiceLineItem.GetExtractedInfoWithUniqueIdentifiers("");
                }
                const newLineRow = Controls.LineItems__.GetRow(idx);
                newLineRow.AllowanceChargeCode__.SetReadOnly(false);
                if (itemInfo) {
                    itemInfo.ManuallyAdded = true;
                    duplicatedItem.SetValue("ExtractedDetails__", JSON.stringify(itemInfo));
                }
            };
            InvoiceLineItem.AddSubsequentLines(item, index, AllowedLinesToCreate, computeAmountAfterAddingLine, sourceItem, sourceIndex);
            return;
        }
        if (isPOItemDispatchIsDisabled) {
            item.Remove();
            Popup.Alert("_PO item dispatching is not available for the selected item", false, null, "_PO item dispatching");
        }
        else {
            computeAmountAfterAddingLine();
        }
    },
    /**
     * Manage the OnAddItem of a Table control
     * @param {Data} item The line which was added
     * @param {integer} index An integer representing the added line index
     */
    OnAddItem: function (item, index) {
        InvoiceLineItem.iIndexForNewItem = index;
        const itemCount = Controls.LineItems__.GetItemCount();
        if (itemCount > 1 && Sys.FRB2B.AP.IsInternationalEReportingEnabled()) {
            const allowedLinesToCreate = {
                "_NON-PO Line": (duplicatedItem, idx) => {
                    duplicatedItem.Remove();
                    duplicatedItem = InvoiceLineItem.AddGLLineItem(Controls.LineItems__);
                    idx = InvoiceLineItem.iIndexForNewItem - 1;
                    cleanUpLineItems();
                    const itemInfo = InvoiceLineItem.GetExtractedInfoWithUniqueIdentifiers(duplicatedItem.GetValue("ExtractedDetails__"));
                    const newLineRow = Controls.LineItems__.GetRow(idx);
                    newLineRow.AllowanceChargeCode__.SetReadOnly(false);
                    if (itemInfo) {
                        itemInfo.ManuallyAdded = true;
                        if (!itemInfo.MappingName) {
                            itemInfo.MappingName = "Default";
                        }
                        duplicatedItem.SetValue("ExtractedDetails__", JSON.stringify(itemInfo));
                    }
                }
            };
            if (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() && itemCount > 1) {
                allowedLinesToCreate["_PO Line"] = () => {
                    Controls.OrderNumber__.OnBrowse();
                };
            }
            InvoiceLineItem.AddSubsequentLines(item, index, allowedLinesToCreate, InvoiceLineItem.UpdateTableLayoutToLineType);
            return;
        }
        if (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() && itemCount > 1) {
            // Remove default line and ask for line type
            item.Remove();
            Popup.Dialog("_Kind of line popup title", null, fillInsertPOLineOrGLLineDialog, commitInsertPOLineOrGLLineDialog);
        }
        else {
            switch (Data.GetValue("InvoiceType__")) {
                case Lib.AP.InvoiceType.NON_PO_INVOICE:
                case Lib.AP.InvoiceType.DOWNPAYMENT_INVOICE:
                    InvoiceLineItem.UpdateGLLineItem(item);
                    // When a new line is added, the tax code and jurisdiction code are pre-filled from the first line
                    if (itemCount > 1) {
                        const copyfrom = +!index;
                        item.SetValue("TaxCode__", Controls.LineItems__.GetItem(copyfrom).GetValue("TaxCode__"));
                        item.SetValue("TaxRate__", Controls.LineItems__.GetItem(copyfrom).GetValue("TaxRate__"));
                        item.SetValue("NonDeductibleTaxRate__", Controls.LineItems__.GetItem(copyfrom).GetValue("NonDeductibleTaxRate__"));
                        item.SetValue("MultiTaxRates__", Controls.LineItems__.GetItem(copyfrom).GetValue("MultiTaxRates__"));
                        item.SetValue("TaxJurisdiction__", Controls.LineItems__.GetItem(copyfrom).GetValue("TaxJurisdiction__"));
                        if (Lib.AP.PeppolC5Reporting.IsEnabled()) {
                            item.SetValue("CF_C5_TaxType__", Controls.LineItems__.GetItem(copyfrom).GetValue("CF_C5_TaxType__"));
                        }
                    }
                    break;
                case Lib.AP.InvoiceType.PO_INVOICE:
                    InvoiceLineItem.UpdatePOLineItem(item);
                    break;
                case Lib.AP.InvoiceType.PO_INVOICE_AS_FI:
                    InvoiceLineItem.UpdatePOGLLineItem(item);
                    break;
                case Lib.AP.InvoiceType.CONSIGNMENT:
                    InvoiceLineItem.UpdateConsignmentLineItem(item);
                    break;
                default:
                    InvoiceLineItem.UpdateGLLineItem(item);
                    break;
            }
            InvoiceLineItem.FillLineItemDescription(item, index);
            InvoiceLineItem.FillLineItemAssignment(item, index);
        }
    },
    /**
     * Fill Item Description with InvoiceDescription__
     * @param {Data} item The line which was added
     * @param {integer} index An integer representing the added line index
     */
    FillLineItemDescription: function (item, index) {
        const text = Controls.InvoiceDescription__.GetValue();
        // structures should be defined
        // only fill if not already posted
        // and if item hasn't description
        if (text && item && index >= 0 && !Controls.ERPPostingDate__.GetValue() && !item.GetValue("Description__")) {
            // check LineType
            // don't add description for POGL lines
            // don't add description for PO lines without order number
            if (item.GetValue("LineType__")
                && item.GetValue("LineType__") !== Lib.P2P.LineType.POGL
                && (item.GetValue("LineType__") !== Lib.P2P.LineType.PO || item.GetValue("OrderNumber__"))) {
                item.SetValue("Description__", text);
            }
        }
    },
    /**
     * Fill Item Assignment with Assignment__ header field
     * @param {Data} item The line which was added
     * @param {integer} index An integer representing the added line index
     */
    FillLineItemAssignment: function (item, index) {
        const text = Controls.Assignment__.GetValue();
        if (text && item && index >= 0 && item.GetValue("LineType__") === Lib.P2P.LineType.GL && !Controls.ERPPostingDate__.GetValue() && !item.GetValue("Assignment__")) {
            item.SetValue("Assignment__", text);
        }
    }
};
function cleanUpLineItems() {
    if (Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
        // Clear any empty line in PO or POGL Invoice mode only
        return;
    }
    // clear empty lines (always keep at least one line)
    let j = 0;
    let cnt = Controls.LineItems__.GetItemCount();
    while (j < cnt && cnt > 1) {
        const item = Controls.LineItems__.GetItem(j);
        const isPOItemEmpty = InvoiceLineItem.IsPOLineItem(item) && InvoiceLineItem.IsPOLineItemEmpty(item);
        const isPOGLItemEmpty = InvoiceLineItem.IsPOGLLineItem(item) && InvoiceLineItem.IsPOGLLineItemEmpty(item);
        if (isPOItemEmpty || isPOGLItemEmpty) {
            item.Remove();
            cnt = Controls.LineItems__.GetItemCount();
        }
        else {
            j++;
        }
    }
    // Called from PO Browse page once all lines are updated
    // Update GHG Emission on Header
    Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
}
function GetFillGLAccountParameters(item) {
    const dimensionParams = GetFillGenericDimensionERPParameters(item, "GLAccount__");
    return {
        ...dimensionParams,
        value: item.GetValue("GLAccount__"),
        formDescriptionField: "GLDescription__",
        getFunction: getGLAccountDescription,
        useStrictParamsEquals: true
    };
}
function GetFillCostCenterParameters(item) {
    const dimensionParams = GetFillGenericDimensionERPParameters(item, "CostCenter__");
    return {
        ...dimensionParams,
        value: item.GetValue("CostCenter__"),
        formDescriptionField: "CCDescription__",
        getFunction: getCostCenterDescriptionFromId,
        useStrictParamsEquals: true
    };
}
function GetFillProfitCenterParameters(item) {
    return {
        "value": item.GetValue("ProfitCenter__"),
        "formCodeField": "ProfitCenter__",
        "formDescriptionField": "ProfitCenterDescription__",
        "disableButtons": LayoutHelper.DisableButtons,
        "getFunction": getProfitCenterDescription,
        "companyCode": Lib.AP.GetLineItemCompanyCode(item)
    };
}
function GetFillGenericDimensionERPParameters(item, dimension) {
    const dimensionParams = Lib.AP.DimensionToDescriptionParams[dimension];
    return {
        ...dimensionParams,
        "disableButtons": LayoutHelper.DisableButtons,
        "companyCode": Lib.AP.GetLineItemCompanyCode(item)
    };
}
function GetFillProjectCodeERPParameters(item) {
    return {
        "formCodeField": "ProjectCode__",
        "formField": "ProjectCodeDescription__",
        "tableField": "ProjectCode__",
        "table": "P2P - Project codes__",
        "disableButtons": LayoutHelper.DisableButtons,
        "companyCode": Lib.AP.GetLineItemCompanyCode(item)
    };
}
function GetFillCustomDimensionParameters(item, customDimension) {
    const codeField = customDimension["Z_CustomDimensionX__"];
    const descField = codeField.replace("__", "Description__");
    const paramCommon = {
        "formCodeField": codeField,
        "formFields": [descField],
        "formDescriptionField": descField,
        "tableFields": ["Description__"],
        "value": item.GetValue(codeField),
        "disableButtons": LayoutHelper.DisableButtons,
        "companyCode": Lib.AP.GetLineItemCompanyCode(item)
    };
    // Determine parameters based on endpoint type
    const endpoint = customDimension["Endpoint__"];
    let paramEndpoint = {};
    if (endpoint === "_BrowseLocalTable") {
        // Extract dimension number from the code field name (e.g., "Z_CustomDimension_3_Code__" -> "3")
        const match = /Z_CustomDimension_(\d+)_Code__/.exec(codeField);
        const dimensionNumber = match ? match[1] : "";
        const tableName = "P2P - Custom Dimension " + dimensionNumber + "__";
        paramEndpoint = {
            "tableKeyField": "CustomDimension" + dimensionNumber + "__",
            "table": tableName
        };
    }
    else {
        // CustomERP endpoint
        paramEndpoint = {
            "tableKeyField": "Code"
        };
    }
    return {
        ...paramCommon,
        ...paramEndpoint
    };
}
function fillDescriptionsForSAP(item) {
    // GLAccount, CostCenter, ProfitCenter
    let getDimensionsParameters = [GetFillGLAccountParameters, GetFillCostCenterParameters, GetFillProfitCenterParameters];
    const invoiceDocument = Lib.AP.GetInvoiceDocumentLayout();
    for (const getDimensionParameters of getDimensionsParameters) {
        invoiceDocument.GetAndFillDescriptionFromCode(item, getDimensionParameters(item));
    }
}
function fillGLAndCCDescriptions(item, doneCallback) {
    const projectCodeEnabled = g_apParameters.GetParameter("CodingEnableProjectCode") === "1" && !g_p2pParameters.GetParameter("EnableProject", false);
    let expectedCalls = projectCodeEnabled ? 3 : 2;
    function done() {
        expectedCalls--;
        if (expectedCalls === 0 && doneCallback) {
            doneCallback(item);
        }
    }
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    const glAccountParam = invoiceDocument.GenericDimensionParameter("GLAccount") ? GetFillGenericDimensionERPParameters(item, "GLAccount__") : GetFillGLAccountParameters(item);
    const costCenterParam = invoiceDocument.GenericDimensionParameter("CostCenter") ? GetFillGenericDimensionERPParameters(item, "CostCenter__") : GetFillCostCenterParameters(item);
    Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, glAccountParam, done);
    Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, costCenterParam, done);
    if (projectCodeEnabled) {
        Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, GetFillProjectCodeERPParameters(item), done);
    }
}
function fillCustomDimensionDescriptions(item) {
    if (!Lib.ERP.IsCustomERP(Data.GetValue("ERP__"))) {
        return;
    }
    const customDimensionsDefinition = Lib.ERP.CustomERP.Common.GetAnalyticFields();
    for (const customDimension of customDimensionsDefinition) {
        // Validate required fields exist
        if (!customDimension["Z_CustomDimensionX__"] || !customDimension["Label__"] || !customDimension["Endpoint__"]) {
            Log.Warn("fillCustomDimensionDescriptions - Missing data in custom dimension, expecting value for Z_CustomDimensionX__, Label__ and Endpoint__ - Skipping this dimension", customDimension);
            continue;
        }
        const codeField = customDimension["Z_CustomDimensionX__"];
        if (item.GetValue(codeField)) {
            Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, GetFillCustomDimensionParameters(item, customDimension));
        }
    }
}
function genericAndSapPOGLAddLineItem(itemMap) {
    var _a;
    const allowBrowsePOLineUE = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.AllowAddBrowsePOItem", itemMap);
    if (typeof allowBrowsePOLineUE === "boolean" && !allowBrowsePOLineUE) {
        return;
    }
    const newItem = Lib.AP.InvoiceType.isPOGLInvoice()
        ? InvoiceLineItem.AddPOGLLineItem(Controls.LineItems__)
        : InvoiceLineItem.AddPOLineItem(Controls.LineItems__, Controls.LineItems__.GetItemCount());
    const useOrderedValues = Lib.AP.PurchaseOrder.ComputeExpectedValuesBasedOnOrderedValues(itemMap);
    const expectedAmountBase = useOrderedValues ? itemMap.ORDEREDAMOUNT__ : itemMap.DELIVEREDAMOUNT__;
    const expectedQuantityBase = useOrderedValues ? itemMap.ORDEREDQUANTITY__ : itemMap.DELIVEREDQUANTITY__;
    const expectedAmount = expectedAmountBase - itemMap.INVOICEDAMOUNT__;
    const expectedQuantity = expectedQuantityBase - itemMap.INVOICEDQUANTITY__;
    const exchangeRate = ((_a = Lib.AP.PurchaseOrder.TryGetExchangeRatesWithoutQuery([itemMap.CURRENCY__], Data.GetValue("InvoiceCurrency__"))) === null || _a === void 0 ? void 0 : _a[0]) || 1;
    newItem.SetValue("OrderNumber__", itemMap.ORDERNUMBER__);
    newItem.SetValue("IsLocalPO__", itemMap.ISLOCALPO__);
    newItem.SetValue("ItemNumber__", itemMap.ITEMNUMBER__);
    newItem.SetValue("Description__", itemMap.DESCRIPTION__);
    newItem.SetValue("TaxAmount__", exchangeRate * parseFloat(itemMap.TAXAMOUNT__));
    newItem.SetValue("OpenQuantity__", itemMap.ORDEREDQUANTITY__ - itemMap.INVOICEDQUANTITY__);
    newItem.SetValue("OpenAmount__", exchangeRate * (itemMap.ORDEREDAMOUNT__ - itemMap.INVOICEDAMOUNT__));
    newItem.SetValue("Quantity__", expectedQuantity > 0 ? expectedQuantity : "");
    newItem.SetValue("Amount__", expectedAmount > 0 ? exchangeRate * expectedAmount : "");
    newItem.SetValue("ExpectedQuantity__", expectedQuantity);
    newItem.SetValue("ExpectedAmount__", exchangeRate * expectedAmount);
    newItem.SetValue("TaxCode__", itemMap.TAXCODE__);
    newItem.SetValue("VendorNumber__", itemMap.VENDORNUMBER__);
    newItem.SetValue("PartNumber__", itemMap.PARTNUMBER__);
    newItem.SetValue("DeliveryNote__", itemMap.DELIVERYNOTE__);
    newItem.SetValue("GoodsReceipt__", itemMap.GOODRECEIPT__);
    newItem.SetValue("DifferentInvoicingParty__", itemMap.DIFFERENTINVOICINGPARTY__);
    newItem.SetValue("NoGoodsReceipt__", itemMap.NOGOODSRECEIPT__);
    newItem.SetValue("UnitOfMeasureCode__", itemMap.UNITOFMEASURECODE__);
    newItem.SetValue("POCurrency__", itemMap.CURRENCY__);
    if (Sys.FRB2B.AP.IsInternationalEReportingEnabled()) {
        const itemInfo = InvoiceLineItem.GetExtractedInfoWithUniqueIdentifiers("");
        itemInfo.isManuallyAdded = true;
        newItem.SetValue("ExtractedDetails__", JSON.stringify(itemInfo));
    }
    // Done in SAP but no column available
    //newItem.SetValue("GRIV__", itemMap.GRIV__);
    if (Sys.Helpers.Data.IsTrue(itemMap.GRIV__)) {
        InvoiceLineItem.iGRIVPOLinesCount++;
        if (InvoiceLineItem.iGRIVPOLinesCount === 1) {
            LayoutHelper.SwitchToGRIV();
        }
    }
    else if (!Sys.Helpers.IsEmpty(itemMap.DELIVERYNOTE__)) {
        InvoiceLineItem.iNonGRIVPODNLinesCount++;
        Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
    }
    let unitPrice = (typeof itemMap.UNITPRICE__ === "number") ? itemMap.UNITPRICE__ : Number.parseFloat(itemMap.UNITPRICE__);
    if (isNaN(unitPrice)) {
        unitPrice = Lib.P2P.ComputeUnitPrice(itemMap.ORDEREDAMOUNT__, itemMap.ORDEREDQUANTITY__);
    }
    newItem.SetValue("UnitPrice__", unitPrice * exchangeRate);
    newItem.SetValue("GLAccount__", itemMap.GLACCOUNT__);
    newItem.SetValue("AcctAssCat__", itemMap.ACCTASSCAT__);
    newItem.SetValue("CostType__", itemMap.COSTTYPE__);
    newItem.SetValue("NonDeductibleTaxRate__", itemMap.NONDEDUCTIBLETAXRATE__);
    newItem.SetValue("Group__", itemMap.GROUP__);
    newItem.SetValue("CostCenter__", itemMap.COSTCENTER__);
    newItem.SetValue("ProjectName__", itemMap.PROJECTNAME__); // usefull for Mapping for POItem when EnableProject setting is enable
    newItem.SetValue("ProjectNumber__", itemMap.PROJECTNUMBER__); // usefull for Mapping for POItem when EnableProject setting is enable
    newItem.SetValue("ProjectCode__", itemMap.PROJECTCODE__);
    newItem.SetValue("PreviousContractNumber__", itemMap.CONTRACTNUMBER__);
    newItem.SetValue("Buyer__", itemMap.BUYER__);
    newItem.SetValue("Receiver__", itemMap.RECEIVER__);
    newItem.SetValue("ItemType__", itemMap.ITEMTYPE__);
    newItem.SetValue("WBSElementID__", itemMap.WBSELEMENTID__);
    newItem.SetValue("WBSElement__", itemMap.WBSELEMENT__);
    newItem.SetValue("InternalOrder__", itemMap.INTERNALORDER__);
    newItem.SetValue("FreeDimension1__", itemMap.FREEDIMENSION1__);
    newItem.SetValue("FreeDimension1ID__", itemMap.FREEDIMENSION1ID__);
    if (Lib.ERP.IsCustomERP(Data.GetValue("ERP__"))) {
        newItem.SetValue("Z_CustomDimension_1_Code__", itemMap.CUSTOMDIMENSION1__);
        newItem.SetValue("Z_CustomDimension_2_Code__", itemMap.CUSTOMDIMENSION2__);
        newItem.SetValue("Z_CustomDimension_3_Code__", itemMap.CUSTOMDIMENSION3__);
        newItem.SetValue("Z_CustomDimension_4_Code__", itemMap.CUSTOMDIMENSION4__);
        newItem.SetValue("Z_CustomDimension_5_Code__", itemMap.CUSTOMDIMENSION5__);
        newItem.SetValue("Z_CustomDimension_6_Code__", itemMap.CUSTOMDIMENSION6__);
        newItem.SetValue("Z_CustomDimension_7_Code__", itemMap.CUSTOMDIMENSION7__);
        newItem.SetValue("Z_CustomDimension_8_Code__", itemMap.CUSTOMDIMENSION8__);
        newItem.SetValue("Z_CustomDimension_9_Code__", itemMap.CUSTOMDIMENSION9__);
        newItem.SetValue("Z_CustomDimension_10_Code__", itemMap.CUSTOMDIMENSION10__);
    }
    if (itemMap.PAYMENTTERMS__) {
        Lib.AP.SetPaymentTermsAndSourceIfNeeded(itemMap.PAYMENTTERMS__, Lib.AP.ComputedValueSource.PO_HEADER);
    }
    // Handle GHG CO2 consumption
    Lib.P2P.GHGEmissions.UpdateLineGHGEmission(newItem, itemMap.ENERGYCONSUMPTIONKGCO2EPERUNIT__, expectedQuantity);
    const customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
    genericAndSapPOGLAddLineItemAddCustom("poItems", newItem, customDimensions, itemMap);
    genericAndSapPOGLAddLineItemAddCustom("poHeader", newItem, customDimensions, itemMap);
    genericAndSapPOGLAddLineItemAddCustom("poItemAccountAssignment", newItem, customDimensions, itemMap);
    genericAndSapPOGLAddLineItemAddCustom("grItems", newItem, customDimensions, itemMap);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.OnAddPOLine", newItem, itemMap);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.FillCostType", newItem);
    getTaxRateAndUpdateItem(newItem, null, true);
    Lib.AP.TaxHelper.SetC5TaxTypeOnLineItem(newItem);
    fillGLAndCCDescriptions(newItem);
    fillCustomDimensionDescriptions(newItem);
    Lib.AP.BrowsePO.AddOrderNumber(itemMap.ORDERNUMBER__);
    if (!newItem.GetValue("CostType__")) {
        Lib.P2P.fillCostTypeFromGLAccount(newItem);
    }
    Lib.AP.ComputeInvoicedUnitPrice(newItem);
    Lib.AP.ComputeItemMismatchAmount(newItem);
}
function genericAndSapPOGLAddLineItemAddCustom(level, newItem, customDimensions, itemMap) {
    if (customDimensions && customDimensions[level]) {
        customDimensions[level].forEach(function (dimension) {
            newItem.SetValue(dimension.nameInForm, itemMap[dimension.nameInTable.toUpperCase()]);
        });
    }
    return newItem;
}
function setCustomDimensions(item, SAPItems, poDetailsElement) {
    Sys.Helpers.Array.ForEach(SAPItems, function (poSAPItem) {
        var _a;
        if (poSAPItem && !Sys.Helpers.IsEmpty(poSAPItem.nameInForm) && !Sys.Helpers.IsEmpty(poSAPItem.nameInSAP)) {
            let itemValue = (_a = poDetailsElement[poSAPItem.nameInSAP]) !== null && _a !== void 0 ? _a : "";
            const formatter = poSAPItem.fieldFormatter;
            if (itemValue && typeof formatter === "function") {
                itemValue = formatter(itemValue);
            }
            item.SetValue(poSAPItem.nameInForm, itemValue);
        }
    });
}
function handleCustomDimensions(item, SAPInfo, acctAss) {
    const customDimensions = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetCustomDimensions");
    if (!(customDimensions === null || customDimensions === void 0 ? void 0 : customDimensions.poSAPItems)) {
        return;
    }
    for (const key of Object.keys(customDimensions.poSAPItems)) {
        let poDetailsElement;
        switch (key) {
            case "PO_ITEMS":
                poDetailsElement = SAPInfo.POItem;
                break;
            case "PO_HEADER":
            case "PO_ADDRESS":
                poDetailsElement = SAPInfo.PO[key];
                break;
            case "PO_ITEM_ACCOUNT_ASSIGNMENT":
                poDetailsElement = acctAss;
                break;
            default:
                poDetailsElement = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.HandleUnsupportedSAPPOItemDimension", key, SAPInfo.PO, SAPInfo.POItem);
                if (!poDetailsElement) {
                    Log.Error(`customDimensions.poSAPItems.${key} not supported yet in GetCustomDimensions`);
                }
        }
        if (poDetailsElement && customDimensions.poSAPItems[key] && customDimensions.poSAPItems[key].length) {
            setCustomDimensions(item, customDimensions.poSAPItems[key], poDetailsElement);
        }
    }
}
function sapMMAddLineItem(poItem, po) {
    const item = InvoiceLineItem.AddPOLineItem(Controls.LineItems__, Controls.LineItems__.GetItemCount());
    item.SetValue("ItemNumber__", poItem.Po_Item);
    item.SetValue("Description__", poItem.Short_Text);
    item.SetValue("ExpectedAmount__", Lib.AP.RoundWithDefaultPrecision(poItem.refExpectedAmount));
    item.SetValue("ExpectedQuantity__", poItem.refExpectedQuantity);
    item.SetValue("OpenAmount__", Lib.AP.RoundWithDefaultPrecision(poItem.refOpenInvoiceValue));
    item.SetValue("OpenQuantity__", poItem.refOpenInvoiceQuantity);
    item.SetValue("Amount__", poItem.refExpectedAmount > 0 ? Lib.AP.RoundWithDefaultPrecision(poItem.refExpectedAmount) : "");
    item.SetValue("Quantity__", poItem.refExpectedQuantity > 0 ? poItem.refExpectedQuantity : "");
    item.SetValue("OrderedAmount__", Lib.AP.RoundWithDefaultPrecision(poItem.refOrderedAmount));
    item.SetValue("OrderedQuantity__", poItem.Quantity);
    item.SetValue("DeliveredAmount__", Lib.AP.RoundWithDefaultPrecision(poItem.refDeliveredAmount));
    item.SetValue("DeliveredQuantity__", poItem.Deliv_Qty);
    item.SetValue("InvoicedAmount__", Lib.AP.RoundWithDefaultPrecision(poItem.refInvoicedAmount));
    item.SetValue("InvoicedQuantity__", poItem.Iv_Qty);
    item.SetValue("GRIV__", poItem.Gr_Basediv);
    if (poItem.Gr_Basediv) {
        InvoiceLineItem.iGRIVPOLinesCount++;
        if (InvoiceLineItem.iGRIVPOLinesCount === 1) {
            LayoutHelper.SwitchToGRIV();
        }
    }
    else if (poItem.Ref_Doc_No) {
        InvoiceLineItem.iNonGRIVPODNLinesCount++;
        Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
    }
    item.SetValue("DeliveryNote__", poItem.Ref_Doc_No);
    item.SetValue("GoodsReceipt__", poItem.Ref_Doc);
    item.SetValue("NoGoodsReceipt__", !poItem.Gr_Ind);
    item.SetValue("TaxCode__", poItem.Tax_Code);
    item.SetValue("TaxJurisdiction__", poItem.Tax_Jur_Cd);
    item.SetValue("VendorNumber__", poItem.Vendor);
    item.SetValue("OrderNumber__", poItem.Po_Number);
    item.SetValue("IsLocalPO__", false);
    const unitPrice = poItem.Price_Unit ? poItem.refNetPrice / poItem.Price_Unit : poItem.refNetPrice;
    item.SetValue("UnitPrice__", Lib.AP.RoundWithDefaultPrecision(unitPrice));
    item.SetValue("PartNumber__", poItem.Material);
    item.SetValue("Buyer__", poItem.Buyer);
    item.SetValue("Receiver__", poItem.Receiver);
    item.SetValue("DifferentInvoicingParty__", po.PO_HEADER.DIFF_INV);
    item.SetValue("AcctAssCat__", poItem.AcctAssCat + poItem.Distribution);
    item.SetValue("CompanyCode__", po.PO_HEADER.CO_CODE);
    if (Sys.FRB2B.AP.IsInternationalEReportingEnabled()) {
        const itemInfo = InvoiceLineItem.GetExtractedInfoWithUniqueIdentifiers("");
        itemInfo.isManuallyAdded = true;
        item.SetValue("ExtractedDetails__", JSON.stringify(itemInfo));
    }
    const acctAss = Lib.AP.SAP.PurchaseOrder.GetAccountAssignmentInfo(po.PO_ITEM_ACCOUNT_ASSIGNMENT, poItem);
    if (acctAss) {
        const glAccount = acctAss.G_L_ACCT ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.G_L_ACCT) : "";
        const costCenter = acctAss.COST_CTR ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.COST_CTR) : "";
        const businessArea = acctAss.BUS_AREA || "";
        const internalOrder = acctAss.ORDER_NO ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.ORDER_NO) : "";
        const wbsElement = acctAss.WBS_ELEM_E || "";
        const profitCenter = acctAss.PROFIT_CTR ? Sys.Helpers.String.SAP.TrimLeadingZeroFromID(acctAss.PROFIT_CTR) : "";
        const acctAssQuantity = acctAss.QUANTITY || "";
        const acctAssPerc = acctAss.DISTR_PERC || "";
        item.SetValue("GLAccount__", glAccount);
        item.SetValue("CostCenter__", costCenter);
        item.SetValue("BusinessArea__", businessArea);
        item.SetValue("InternalOrder__", internalOrder);
        item.SetValue("WBSElement__", wbsElement);
        item.SetValue("ProfitCenter__", profitCenter);
        if (acctAssQuantity && acctAssPerc) {
            const amount = item.GetValue("Amount__") > 0 ? item.GetValue("Amount__") * acctAssPerc / 100 : "";
            const quantity = item.GetValue("Quantity__") > 0 ? item.GetValue("Quantity__") * acctAssPerc / 100 : "";
            //TODO FT-035609
            item.SetValue("Amount__", amount);
            item.SetValue("Quantity__", quantity);
        }
        fillDescriptionsForSAP(item);
    }
    if (poItem.Cond_Type) {
        item.SetValue("PriceCondition__", poItem.Cond_Type);
    }
    const SAPInfo = {
        PO: po,
        POItem: poItem
    };
    handleCustomDimensions(item, SAPInfo, acctAss);
    Lib.AP.ComputeInvoicedUnitPrice(item);
    Lib.AP.ComputeItemMismatchAmount(item);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.PurchaseOrder.OnAddPOLine", item, poItem, po);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.FillCostType", item);
    getTaxRateAndUpdateItem(item, setItemTaxRateAndTaxAmount, true);
    if (!item.GetValue("CostType__")) {
        Lib.P2P.fillCostTypeFromGLAccount(item);
    }
    Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
}
/**
 * @class An help class to manage layout
 */
const LayoutHelper = {
    currentLayout: null,
    disableGroup: {},
    buttonsDisabled: 0,
    isReadOnlyRestored: true,
    readOnlyPanelMap: {},
    ShowWaitScreen: false,
    MakeFormReadOnly: function () {
        // Disable all controls
        this.MakePanelsReadOnly();
        // Also disable buttons
        this.DisableButtons(true);
    },
    MakePanelsReadOnly: function () {
        if (LayoutHelper.isReadOnlyRestored) {
            LayoutHelper.readOnlyPanelMap = {};
            for (const c in Controls) {
                if (Object.prototype.hasOwnProperty.call(Controls, c) &&
                    Controls[c] &&
                    Controls[c].GetControls &&
                    Controls[c].SetReadOnly) {
                    LayoutHelper.readOnlyPanelMap[c] = Controls[c].IsReadOnly();
                    Controls[c].SetReadOnly(true);
                }
            }
            LayoutHelper.isReadOnlyRestored = false;
        }
    },
    RestorePanelsReadOnly: function () {
        for (const c in LayoutHelper.readOnlyPanelMap) {
            if (Object.prototype.hasOwnProperty.call(LayoutHelper.readOnlyPanelMap, c) &&
                Object.prototype.hasOwnProperty.call(Controls, c) &&
                Controls[c]) {
                Controls[c].SetReadOnly(LayoutHelper.readOnlyPanelMap[c]);
            }
        }
        LayoutHelper.isReadOnlyRestored = true;
        // Force to refresh interface
        InvoiceLineItem.UpdateLineItemsLayout();
        LayoutHelper.AdaptProcessLayoutToStep();
        ReverseChargeTaxLayoutHelper.InitFlux10ReverseChargeTaxLinesSummary();
        InitFlux10_1Fields(null);
    },
    /** Button bar for AP */
    SetPostButtonInArchiveMode: function () {
        if (Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
            Controls.Post.SetLabel("_Request Post");
        }
        else if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) > 0) {
            Controls.Post.SetLabel(Lib.AP.GetInvoiceDocumentLayout().GetPostAndRequestApprovalManualLinkLabel());
        }
        else {
            Controls.Post.SetLabel(Lib.AP.GetInvoiceDocumentLayout().GetPostManualLinkLabel());
        }
    },
    SetPostButtonResumePendingERP: function () {
        Controls.Post.SetLabel("_ResumePendingERP");
    },
    FirstStepButtonBar: function () {
        // Every other workflow action stays hidden after an invalid ERP lifecycle acknowledgment
        if (Lib.AP.ShouldAllowResumePendingERPDrivenStatus()) {
            Controls.SetAside.Hide(true);
            LayoutHelper.SetPostButtonResumePendingERP();
            return;
        }
        Controls.SetAside.Hide(false);
        if (!Controls.ERPLinkingDate__.GetValue()) {
            const isTeachingDisabled = Sys.Parameters.GetInstance("AP").GetParameter("DisableTeaching") === "1";
            Controls.Request_teaching.Hide(isTeachingDisabled);
            Controls.Reject.Hide(false);
            Controls.Reprocess.Hide(false);
        }
        if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0 &&
            Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) === 0) {
            this.LastStepButtonBar();
        }
        else {
            const isInArchivingMode = Lib.AP.IsInArchivingMode();
            let bHideSimulate = false;
            if (!Controls.ERPLinkingDate__.GetValue()) {
                if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0) {
                    if (isInArchivingMode) {
                        LayoutHelper.SetPostButtonInArchiveMode();
                    }
                    else if (!Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                        if (!Lib.AP.InvoiceType.isConsignmentInvoice()) {
                            Controls.Post.SetLabel("_Post and Request Approval");
                        }
                        else if (!Data.GetValue("ERPInvoiceNumber__")) {
                            Controls.Post.SetLabel("_SettleAndWaitForClearingAndRequestApproval");
                        }
                        else {
                            Controls.Post.SetLabel("_WaitForClearingAndRequestApproval");
                        }
                    }
                    else {
                        Controls.Post.SetLabel("_Request Post");
                    }
                }
                else {
                    Controls.Post.SetLabel("_Request Approval");
                }
                if (isInArchivingMode) {
                    bHideSimulate = true;
                }
            }
            else {
                Controls.Post.SetLabel("_Request Approval");
                if (Controls.ERPLinkingDate__.GetValue() || isInArchivingMode) {
                    bHideSimulate = true;
                }
            }
            Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.Simulate, bHideSimulate);
            Controls.Simulate.SetDisabled(Lib.AP.InvoiceType.isDownPaymentInvoice());
        }
    },
    /** Button bar the last approbation and the final post */
    LastStepButtonBar: function () {
        // Resuming the wait for the ERP-driven status takes precedence over the archiving/manual link label
        if (Lib.AP.ShouldAllowResumePendingERPDrivenStatus()) {
            LayoutHelper.SetPostButtonResumePendingERP();
            Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.Simulate, true);
        }
        else if (!Controls.ERPLinkingDate__.GetValue()) {
            Controls.Reject.Hide(false);
            Controls.Reprocess.Hide(false);
            if (Lib.AP.IsInArchivingMode()) {
                LayoutHelper.SetPostButtonInArchiveMode();
                Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.Simulate, true);
            }
            else {
                if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0 &&
                    Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) === 0 &&
                    !Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                    if (!Lib.AP.InvoiceType.isConsignmentInvoice()) {
                        Controls.Post.SetLabel("_Post");
                    }
                    else if (!Data.GetValue("ERPInvoiceNumber__")) {
                        Controls.Post.SetLabel("_Post and Wait for Clearing");
                    }
                    else {
                        Controls.Post.SetLabel("_Wait for Clearing");
                    }
                }
                else if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) > 0) {
                    Controls.Post.SetLabel("_Request Approval");
                }
                else if (Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
                    Controls.Post.SetLabel("_Request Post");
                }
                else if (!Lib.AP.InvoiceType.isConsignmentInvoice()) {
                    Controls.Post.SetLabel("_Post and Request Approval");
                }
                else if (!Data.GetValue("ERPInvoiceNumber__")) {
                    Controls.Post.SetLabel("_SettleAndWaitForClearingAndRequestApproval");
                }
                else {
                    Controls.Post.SetLabel("_WaitForClearingAndRequestApproval");
                }
                Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.Simulate, false);
            }
        }
        else if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) > 0) {
            Controls.Post.SetLabel("_Request Approval");
        }
        else {
            Controls.Post.SetLabel("_Approve");
        }
        Controls.Simulate.SetDisabled(Lib.AP.InvoiceType.isDownPaymentInvoice());
    },
    /** Button bar for approvers */
    WorkflowButtonBar: function () {
        // Every other workflow action stays hidden after an invalid ERP lifecycle acknowledgment
        if (Lib.AP.ShouldAllowResumePendingERPDrivenStatus()) {
            Controls.SetAside.Hide(true);
            Controls.Post.SetLabel("_ResumePendingERP");
            return;
        }
        Controls.BackToAP.Hide(false);
        Controls.OnHold.Hide(false);
        Controls.Post.SetLabel("_Approve");
        Controls.AddApprover.Hide(false);
        if (Lib.AP.WorkflowCtrl.BackToPreviousPossible()) {
            Controls.BackToPrevious.Hide(false);
        }
        const restrictedRole = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.RestrictAddingWorkflowToApproverOrControllerOnly");
        if (Lib.AP.WorkflowCtrl.workflowUI.IsContributorInParallelBlock(Lib.AP.WorkflowCtrl.GetCurrentStep())) {
            Controls.AddApprover.Hide(true);
        }
        else {
            Controls.AddApprover.Hide(false);
            if (currentStepIsController()) {
                if (restrictedRole === Lib.AP.WorkflowCtrl.roles.approver) {
                    Controls.AddApprover.Hide(true);
                }
                else {
                    Controls.AddApprover.SetLabel("_Add controller");
                }
            }
            else if (restrictedRole === Lib.AP.WorkflowCtrl.roles.controller) {
                Controls.AddApprover.Hide(true);
            }
            else {
                Controls.AddApprover.SetLabel("_Add approver");
            }
        }
    },
    ShowOrHideEditButton: function () {
        Controls.Edit_.Hide(ProcessInstance.isEditing || !userIsAPOrAdmin());
    },
    /** Button bar in case of unblock error*/
    ToPayButtonBar: function () {
        Controls.Post.Hide();
        this.ShowOrHideEditButton();
    },
    /** Button bar in case of unblock error*/
    PaidButtonBar: function () {
        Controls.Post.Hide();
        this.ShowOrHideEditButton();
    },
    WaitForClearingButtonBar: function () {
        Controls.SetAside.Hide(true);
        Controls.Post.Hide(true);
        Controls.Save.Hide(true);
    },
    ShouldHideSetAside: function () {
        return !currentStepIsApStart() || ProcessInstance.isReadOnly || ProcessInstance.isEditing;
    },
    InitButtons: function () {
        Controls.BackToPrevious.Hide();
        Controls.Reject.Hide();
        Controls.BackToAP.Hide();
        Controls.OnHold.Hide();
        Controls.AddApprover.Hide();
        Controls.SetAside.Hide(this.ShouldHideSetAside());
        Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.Simulate, true);
        Controls.Request_teaching.Hide();
        Controls.Reprocess.Hide();
        Controls.CreateInvoicingSchedule.Hide(!Lib.P2P.BillingSchedule.CanCreateNewBillingSchedule());
    },
    UpdateRequestCreditNoteButtons: function () {
        const requestCreditNoteAvailable = (Lib.AP.InvoiceType.isPOInvoice() || Lib.AP.InvoiceType.isPOGLInvoice()) && !ProcessInstance.isReadOnly;
        const hasVendorEmail = Boolean(Data.GetValue("VendorContactEmail__"));
        const hasMismatchAmount = Data.GetValue("InvoiceMismatchAmount__") > 0;
        if (Controls.LineItems__.IsReadOnly() && requestCreditNoteAvailable) {
            Controls.LineItems__.HideTableRowMenu("hideMenuAndShowCheckBoxEvenReadOnly");
        }
        Controls.ButtonPriceMismatchSort__.Hide(!requestCreditNoteAvailable);
        Controls.RequestCreditNotes.Hide(!requestCreditNoteAvailable);
        Controls.ButtonPriceMismatchSort__.SetDisabled(!hasVendorEmail || !hasMismatchAmount);
        Controls.RequestCreditNotes.SetDisabled(!hasVendorEmail || !hasMismatchAmount || IsInvoiceLineItemException());
        return requestCreditNoteAvailable;
    },
    UpdateButtonBar: function () {
        // Change the Post button label and hide the "Reject" and "Resubmit" buttons for approvers according to the current workflow step
        this.InitButtons();
        const invoiceStatus = Controls.InvoiceStatus__.GetValue();
        if (!ProcessInstance.isReadOnly) {
            if (isInApprovalWorkflow()) {
                this.WorkflowButtonBar();
            }
            else if (invoiceStatus === Lib.AP.InvoiceStatus.ToVerify || invoiceStatus === Lib.AP.InvoiceStatus.SetAside || invoiceStatus === Lib.AP.InvoiceStatus.Received
                // Invalid ERP lifecycle ack reopened the workflow while the invoice was still waiting for the first lifecycle status
                || invoiceStatus === Lib.AP.InvoiceStatus.BeingProcessedByERP) {
                this.FirstStepButtonBar();
            }
            else if (invoiceStatus === Lib.AP.InvoiceStatus.ToPost) {
                this.LastStepButtonBar();
            }
            else if (invoiceStatus === Lib.AP.InvoiceStatus.ToPay) {
                this.ToPayButtonBar();
            }
            else if (invoiceStatus === Lib.AP.InvoiceStatus.Paid) {
                this.PaidButtonBar();
            }
            else if (invoiceStatus === Lib.AP.InvoiceStatus.WaitForClearing) {
                this.WaitForClearingButtonBar();
            }
            this.UpdateRequestCreditNoteButtons();
        }
        else {
            Controls.ButtonLoadTemplate__.Hide(true);
            Controls.ButtonSaveTemplate__.Hide(true);
            Controls.ButtonLoadClipboard__.Hide(true);
            Controls.ButtonPriceMismatchSort__.Hide(true);
            Controls.RequestCreditNotes.Hide(true);
            Controls.Line_Items_Actions.Hide(true);
            // For posted invoices hide the Edit button for profiles other than AP Specialist
            if (invoiceStatus === Lib.AP.InvoiceStatus.ToPay || invoiceStatus === Lib.AP.InvoiceStatus.Paid || invoiceStatus === Lib.AP.InvoiceStatus.Reversed) {
                this.ShowOrHideEditButton();
            }
        }
        Lib.AP.GetInvoiceDocumentLayout().UpdateLayout();
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnUpdateButtonBarEnd");
    },
    //Retrieve the lifecycle status of the vendor from the Variable + Set the icon column in the browses.
    DisplayVendorStatusIcons: function () {
        const vendorLifeCycleIcons = {
            "LifeCycleStatusCode__": [
                {
                    value: Lib.P2P.VendorLifeCycleStatus.BLOCKED,
                    imageUrl: {
                        url: VendorLifeCycleStatusIcon.blockedIcon,
                        tooltip: Language.Translate("_LifeCycleStatusBlocked")
                    }
                },
                {
                    value: Lib.P2P.VendorLifeCycleStatus.DISABLED,
                    imageUrl: {
                        url: VendorLifeCycleStatusIcon.disabledIcon,
                        tooltip: Language.Translate("_LifeCycleStatusDisabled")
                    }
                }
            ],
            "defaultImageUrl": {
                url: VendorLifeCycleStatusIcon.activeIcon,
                tooltip: Language.Translate("_LifeCycleStatusActive")
            }
        };
        const largestImageWidth = 12;
        Controls.VendorNumber__.SetImageColumn("Number__", vendorLifeCycleIcons, largestImageWidth);
        Controls.VendorName__.SetImageColumn("Name__", vendorLifeCycleIcons, largestImageWidth);
        let vendorStatusCode = Variable.GetValueAsString("VendorLifeCycleStatusCode");
        let vendorStatusComment = Variable.GetValueAsString("VendorLifeCycleComment");
        manageStatusInVendorField(vendorStatusCode, vendorStatusComment);
    },
    RevalidateLineItems: function () {
        const requiredFields = Lib.AP.GetInvoiceDocument()
            .GetRequiredFields(Sys.Helpers.TryGetFunction("Lib.AP.Customization.Common.GetRequiredFields"));
        if (!Data.GetValue("ManualLink__")) {
            const lineItems = Data.GetTable("LineItems__");
            const nbItems = lineItems.GetItemCount();
            for (let i = 0; i < nbItems; i++) {
                const row = lineItems.GetItem(i);
                if (InvoiceLineItem.IsEmpty(row)) {
                    const columns = Controls.LineItems__.GetColumnsOrder();
                    for (const column of columns) {
                        row.SetError(column);
                    }
                }
                else {
                    validateLine(row, requiredFields);
                }
            }
        }
    },
    RecomputeRequired: function () {
        Lib.AP.GetInvoiceDocumentLayout().UpdateLayout();
    },
    AreBoutonsDisabled: function () {
        return LayoutHelper.buttonsDisabled > 0;
    },
    DisableButtons: function (disable, group) {
        const currentState = LayoutHelper.AreBoutonsDisabled();
        const groupName = group || "*";
        if (disable) {
            LayoutHelper.buttonsDisabled++;
            if (LayoutHelper.disableGroup[groupName] && LayoutHelper.disableGroup[groupName].count) {
                LayoutHelper.disableGroup[groupName].count++;
            }
            else {
                LayoutHelper.disableGroup[groupName] = {
                    count: 1
                };
            }
        }
        else {
            LayoutHelper.buttonsDisabled--;
            if (!LayoutHelper.disableGroup[groupName]) {
                Log.Error(`Enabling of buttons on a unitialized group '${groupName}'`);
            }
            else if (LayoutHelper.disableGroup[groupName].count === 0) {
                Log.Warn(`Enabling of buttons from group '${groupName}' is call too often.`);
            }
            else {
                LayoutHelper.disableGroup[groupName].count--;
            }
        }
        if (LayoutHelper.buttonsDisabled <= 0) {
            // Check balance to eventually re-enable ButtonSaveTemplate__
            Lib.ERP.checkBalance(false);
            RequestTeaching.RefreshButtonState();
        }
        else {
            Controls.ButtonSaveTemplate__.SetDisabled(true);
            Controls.Request_teaching.SetDisabled(true);
        }
        if (LayoutHelper.ShowWaitScreen) {
            if (LayoutHelper.AreBoutonsDisabled()) {
                Controls.ButtonLoadClipboard__.Wait(true);
            }
            else if (!LayoutHelper.AreBoutonsDisabled()) {
                Controls.ButtonLoadClipboard__.Wait(false);
                LayoutHelper.ShowWaitScreen = false;
            }
        }
        const newState = LayoutHelper.AreBoutonsDisabled();
        if (currentState !== newState) {
            Controls.SetAside.SetDisabled(newState);
            Controls.Simulate.SetDisabled(Lib.AP.InvoiceType.isDownPaymentInvoice() || newState);
            Controls.Post.SetDisabled(newState);
            Controls.Reject.SetDisabled(newState);
            Controls.Reprocess.SetDisabled(newState);
            Controls.Save.SetDisabled(newState);
            Controls.ButtonLoadTemplate__.SetDisabled(newState);
            Controls.ButtonLoadClipboard__.SetDisabled(newState);
            Controls.BackToAP.SetDisabled(newState);
            Controls.OnHold.SetDisabled(newState);
            Controls.AddApprover.SetDisabled(newState);
            Controls.BackToPrevious.SetDisabled(newState);
            Controls.UpdatePayment.SetDisabled(newState);
            Controls.ButtonPriceMismatchSort__.SetDisabled(newState);
            Controls.RequestCreditNotes.SetDisabled(newState);
            Controls.CreateInvoicingSchedule.SetDisabled(newState);
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnDisableButtons", disable, group, newState);
    },
    HandleVendorContactEmailRequirement: function () {
        if (Lib.AP.IsExceptionResolvedOnLineItemLevel()) {
            Controls.VendorContactEmail__.SetRequired(false);
            // email is required to enter line item level mismatch handling
            const mismatchContributor = Lib.AP.WorkflowCtrl.GetNextContributorOfWorkflowType(Lib.AP.WorkflowCtrl.WorkflowType.invoiceLineItemExceptionForApprovers);
            if (mismatchContributor) {
                Controls.VendorContactEmail__.SetRequired(true);
            }
        }
    },
    UpdateLayout: function (doLoadTemplate) {
        LayoutHelper.currentLayout = Controls.InvoiceType__.GetValue();
        LayoutHelper.UpdateManualLinkLayout();
        if (!Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ShouldSkipLineItemLayoutUpdates")) {
            // Clear existing line items
            InvoiceLineItem.ClearLineItems();
            // Update visible columns of line items
            InvoiceLineItem.UpdateLineItemsLayout();
            const manualLink = Controls.ManualLink__.IsChecked();
            if (!manualLink) {
                // Clear outdated workflow datas (invoice becames unbalanced, WF should be rebuilt later on)
                Lib.AP.WorkflowCtrl.ClearWorkflowDatas();
            }
        }
        if (doLoadTemplate !== false) {
            loadTemplate();
            handleTaxComputation();
        }
        LayoutHelper.HandleVendorContactEmailRequirement();
        LayoutHelper.AdaptProcessLayoutToStep();
        // Update button bar (post/request approval)
        LayoutHelper.UpdateButtonBar();
        Log.Info(`Controls.ManualLink__.IsChecked():${Controls.ManualLink__.IsChecked()}, isPOInvoice(): ${Lib.AP.InvoiceType.isPOInvoice()}!Controls.ManualLink__.IsChecked() || !isPOInvoice()=${!Controls.ManualLink__.IsChecked() || !Lib.AP.InvoiceType.isPOInvoice()}`);
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnUpdateLayoutEnd");
    },
    RevertInvoiceType: function () {
        // Revert value
        Controls.InvoiceType__.SetValue(LayoutHelper.currentLayout);
    },
    ConfirmInvoiceTypeUpdate: function () {
        if (!LayoutHelper.IsTableEmpty()) {
            Popup.Confirm("_This action will delete the current line items.", false, LayoutHelper.InvoiceTypeUpdateConfirmed, LayoutHelper.RevertInvoiceType, "_Warning");
        }
        else {
            LayoutHelper.InvoiceTypeUpdateConfirmed();
        }
    },
    InvoiceTypeUpdateConfirmed: function () {
        Lib.AP.GetInvoiceDocumentLayout().SetPostingDatePlaceholder();
        // remove exception before updating the layout
        Data.SetValue("CurrentException__", "");
        const enableCodingsTemplates = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.EnableCodingsTemplates");
        LayoutHelper.UpdateLayout(enableCodingsTemplates);
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnInvoiceTypeUpdateConfirmedEnd");
    },
    IsTableEmpty: function () {
        // Check if table is empty
        // Pay attention the value of the combobox was already updated
        const lineItemsTable = Data.GetTable("LineItems__");
        const nbItems = lineItemsTable.GetItemCount();
        for (let i = 0; i < nbItems; i++) {
            const item = lineItemsTable.GetItem(i);
            if (!InvoiceLineItem.IsEmpty(item)) {
                return false;
            }
        }
        return true;
    },
    AdaptProcessLayoutToInvoiceType: function (isInvoiceTypeChanged) {
        if (isInvoiceTypeChanged) {
            LayoutHelper.ConfirmInvoiceTypeUpdate();
            Controls.CreateInvoicingSchedule.Hide(!Lib.P2P.BillingSchedule.CanCreateNewBillingSchedule());
        }
        else {
            LayoutHelper.currentLayout = Controls.InvoiceType__.GetValue();
            InvoiceLineItem.UpdateLineItemsLayout();
        }
    },
    AdaptProcessLayoutToStep: function () {
        let bIsInApprovalWorkflow = isInApprovalWorkflow();
        let inDataCaptureMode = false;
        if (bIsInApprovalWorkflow) {
            // The form is in approver mode (payment approval or workflow completed)
            LayoutHelper.SetApprovalLayout();
        }
        else {
            // The form is in the data capture mode (AP or back to AP)
            // merge conditions of the both conditions
            if (Lib.ERP.IsSAP()) {
                inDataCaptureMode = !Controls.ERPLinkingDate__.GetValue() && !Controls.ManualLink__.IsChecked();
            }
            else {
                inDataCaptureMode = !Controls.ERPPostingDate__.GetValue();
            }
            if (!inDataCaptureMode) {
                LayoutHelper.SetPostedLayout();
                if (Controls.ManualLink__.IsChecked()) {
                    const layout = Lib.AP.GetInvoiceDocumentLayout();
                    layout.EnableManualLink();
                    layout.UpdateLayoutForManualLink();
                    layout.Hide(Controls.ERPMMInvoiceNumber__, false);
                }
            }
            else {
                LayoutHelper.SetDataCaptureLayout();
            }
        }
        let useLightLayout = !userIsAPOrAdmin() && !reviewersCanModifyLineItems();
        const customLayout = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnDetermineLayout");
        if (typeof customLayout === "number") {
            useLightLayout = customLayout === 1;
        }
        if (useLightLayout) {
            LayoutHelper.SwitchToLightLayout();
        }
        else {
            Controls.HeaderDataPanelForApproversLeft.Hide(true);
            Controls.HeaderDataPanelForApproversRight.Hide(true);
            Lib.AP.ArchivedInvoices.SetEditingLayoutIfNeeded();
        }
        Controls.PaymentDetails.Hide(Controls.InvoiceStatus__.GetValue() !== Lib.AP.InvoiceStatus.Paid);
        LayoutHelper.ExtractedLineItems.Init();
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnAdaptProcessLayoutToStepEnd", bIsInApprovalWorkflow, inDataCaptureMode, useLightLayout);
    },
    SwitchToLightLayout: function () {
        // Use simplified layout: hide useless panels
        Controls.HeaderDataPanelForApproversLeft.Hide(false);
        Controls.HeaderDataPanelForApproversRight.Hide(false);
        Controls.HeaderDataPanel.Hide(true);
        Controls.Invoice_Processing.Hide(true);
        Controls.ERP_Details.Hide(true);
        Controls.VendorInformation.Hide(true);
        Controls.Parameters.Hide(true);
        Controls.CalculateTax__.Hide(true);
        Controls.CodingTemplate__.Hide(true);
        Controls.ButtonSaveTemplate__.Hide(true);
        Controls.ButtonLoadTemplate__.Hide(true);
        Controls.ButtonLoadClipboard__.Hide(true);
        Controls.Line_Items_Actions.Hide(true);
        Controls.ReverseInvoice.Hide(true);
        // Hide Extended WHT panel
        Controls.ExtendedWithholdingTaxPane.Hide(true);
        // Hide some buttons
        Controls.ContactVendor__.Hide(true);
        Controls.SupplierInformationManagementLink__.Hide(true);
        // Hide columns in item list
        Controls.LineItems__.TaxCode__.Hide(true);
        Controls.LineItems__.TaxAmount__.Hide(true);
        Controls.LineItems__.ExpectedQuantity__.Hide(true);
        Controls.LineItems__.ExpectedAmount__.Hide(true);
        Controls.LineItems__.CCDescription__.Hide(false);
        Controls.LineItems__.ProjectCodeDescription__.Hide(false);
        Controls.LineItems__.TaxJurisdiction__.Hide(true);
        Controls.NetAmountForApprovers__.Focus();
        this.UpdateExceptionsTypePanel({
            // Cannot modify Exception
            panelIsReadOnly: true,
            panelIsHidden: !Controls.CurrentException__.GetValue()
        });
    },
    /**
     * Hide technical fields as long as debug mode is not set
     */
    HideTechnicalFields: function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // Header fields
        if (Controls.CurrentAttachmentFlag__.IsVisible()) {
            // compatibility On upgrade
            // KeepFieldsProperties=1 on process may not have set hidden=true in layout
            Controls.HoldingComment__.Hide(true);
            Controls.CurrentAttachmentFlag__.Hide(true);
            Controls.ManualLink__.Hide(true);
            Controls.ExtractedNetAmount__.Hide(true);
            Controls.GRIV__.Hide(true);
            Controls.LastValidatorName__.Hide(true);
            Controls.LastValidatorUserId__.Hide(true);
            Controls.LastArchiveEditor__.Hide(true);
            Controls.LastArchiveEditionDate__.Hide(true);
            Controls.TouchlessPossible__.Hide(true);
            Controls.ERPPostingDate__.Hide(true);
            Controls.ERPLinkingDate__.Hide(true);
            Controls.ERPPaymentBlocked__.Hide(true);
            Controls.PaymentApprovalStatus__.Hide(true);
            Controls.SAP_Simulation_Result__.Hide(true);
            Controls.VerificationDate__.Hide(true);
            Controls.ScheduledActionDate__.Hide(true);
            Controls.ScheduledAction__.Hide(true);
            Controls.PortalRuidEx__.Hide(true);
            Controls.DigitalSignature__.Hide(true);
            Controls.Configuration__.Hide(true);
            Controls.ArchiveRuidEx__.Hide(true);
            Controls.ArchiveProcessLink__.Hide(true);
            Controls.ArchiveProcessLinkGenerated__.Hide(true);
            Controls.SelectedBankAccountID__.Hide(true);
            Controls.BudgetExportStatus__.Hide(true);
            Controls.ERPPostingError__.Hide(true);
            Controls.ERPAckRuidEx__.Hide(true);
            Controls.LastExportDate__.Hide(true);
            Controls.LastPaymentApprovalExportDate__.Hide(true);
            //Billing schedule
            Controls.BillingScheduleID__.Hide(true);
            Controls.BillingScheduleInstallment__.Hide(true);
            Controls.BillingScheduleSpacer__.Hide(true);
            //Local amounts
            Controls.ExchangeRate__.Hide(true);
            Controls.LocalInvoiceAmount__.Hide(true);
            Controls.LocalNetAmount__.Hide(true);
            Controls.LocalTaxAmount__.Hide(true);
            Controls.LocalCurrency__.Hide(true);
            Controls.LocalEstimatedDiscountAmount__.Hide(true);
            Controls.LocalEstimatedLatePaymentFee__.Hide(true);
            //Coding template
            Controls.CodingTemplate__.Hide(true);
        }
        // Tables columns
        Controls.LineItems__.Keyword__.Hide(true);
        Controls.LineItems__.MultiTaxRates__.Hide(true);
        Controls.LineItems__.LineType__.Hide(true);
        Controls.LineItems__.PriceCondition__.Hide(true);
        Controls.LineItems__.TaxRate__.Hide(true);
        Controls.LineItems__.NonDeductibleTaxRate__.Hide(true);
        Controls.LineItems__.VendorNumber__.Hide(true);
        Controls.LineItems__.OpenAmount__.Hide(true);
        Controls.LineItems__.OpenQuantity__.Hide(true);
        Controls.LineItems__.PartNumber__.Hide(true);
        Controls.LineItems__.CCDescription__.Hide(true);
        Controls.LineItems__.ProjectCodeDescription__.Hide(true);
        Controls.LineItems__.WBSElementID__.Hide(true);
        Controls.LineItems__.FreeDimension1__.Hide(true);
        Controls.LineItems__.FreeDimension1ID__.Hide(true);
        Controls.LineItems__.IsLocalPO__.Hide(true);
        Controls.LineItems__.DifferentInvoicingParty__.Hide(true);
        Controls.LineItems__.AcctAssCat__.Hide(true);
        Controls.LineItems__.NoGoodsReceipt__.Hide(true);
        Controls.LineItems__.Group__.Hide(true);
        Controls.LineItems__.BudgetID__.Hide(true);
        Controls.LineItems__.TechnicalDetails__.Hide(true);
        Controls.BankDetails__.BankDetails_Type__.Hide(true);
        Controls.BankDetails__.BankDetails_ID__.Hide(true);
        // Workflow
        Controls.ApproversList__.ApproverID__.Hide(true);
        Controls.ApproversList__.WorkflowIndex__.Hide(true);
        Controls.ApproversList__.Approved__.Hide(true);
        Controls.ApproversList__.ApproverEmail__.Hide(true);
        Controls.ApproversList__.ApproverAction__.Hide(true);
        Controls.ApproversList__.WRKFIsGroup__.Hide(true);
        Controls.ApproversList__.ApprovalRequestDate__.Hide(true);
        Controls.ApproversList__.ActualApprover__.Hide(true);
        Controls.ApproversList__.ActualApproverProfile__.Hide(true);
        Controls.ApproversList__.IsOnBehalfOf__.Hide(true);
        Controls.ApproversList__.ApproverProfile__.Hide(true);
        // History panel
        Controls.Comment.Hide(true);
        // deleted fields: avoid update glitches
        (_a = Controls.ToggleHistoryViewForApprovers__) === null || _a === void 0 ? void 0 : _a.Hide(true);
        (_b = Controls.ConsignmentNumber__) === null || _b === void 0 ? void 0 : _b.Hide(true);
        (_d = (_c = Controls.LineItems__) === null || _c === void 0 ? void 0 : _c.ConsignmentNumber__) === null || _d === void 0 ? void 0 : _d.Hide(true);
        (_f = (_e = Controls.LineItems__) === null || _e === void 0 ? void 0 : _e.PreviousBudgetID__) === null || _f === void 0 ? void 0 : _f.Hide(true);
        (_h = (_g = Controls.LineItems__) === null || _g === void 0 ? void 0 : _g.PreviousContractSpendingID__) === null || _h === void 0 ? void 0 : _h.Hide(true);
    },
    UpdateManualLinkLayout: function () {
        Lib.AP.GetInvoiceDocumentLayout().UpdateLayoutForManualLink();
    },
    SetCommonLayoutRestriction: function () {
        LayoutHelper.UpdateManualLinkLayout();
        const bHideAsideReason = Controls.InvoiceStatus__.GetValue() !== Lib.AP.InvoiceStatus.SetAside && Controls.InvoiceStatus__.GetValue() !== Lib.AP.InvoiceStatus.OnHold;
        Controls.AsideReason__.Hide(bHideAsideReason);
        Controls.AsideReasonForApprovers__.Hide(bHideAsideReason);
        Controls.BackToAPReason__.Hide(true);
        Controls.RejectReason__.Hide(true);
        Controls.ERPInvoiceNumber__.SetBrowsable(false);
        Controls.ERPInvoiceNumber__.SetReadOnly(true);
        Controls.ERPMMInvoiceNumber__.SetBrowsable(false);
        Controls.ERPMMInvoiceNumber__.SetReadOnly(true);
        Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.ERPMMInvoiceNumber__, !Lib.AP.InvoiceType.isPOInvoice());
        Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.ERPClearingDocumentNumber__, !Lib.AP.InvoiceType.isConsignmentInvoice());
        // Can not add or remove reference
        Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
        Controls.Parameters.SetReadOnly(true);
        Controls.Parameters.Hide(true);
        Controls.Invoice_Processing.SetReadOnly(true);
        Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.Investment__, !Lib.P2P.IsInvestmentEnabled() || !Lib.AP.InvoiceType.isPOInvoice());
        // Fields allowed for approvers
        Controls.Comment__.SetReadOnly(ProcessInstance.isReadOnly);
        // Can remove only its document
        Controls.DocumentsPanel.SetNumberOfNonRemovableAttachments(Controls.CurrentAttachmentFlag__.GetValue());
        Controls.Payment.SetReadOnly(true);
        Controls.Details.SetReadOnly(true);
    },
    /**
     * Put some fields in read-only and approver specific parameters
     */
    SetApprovalLayout: function () {
        LayoutHelper.SetCommonLayoutRestriction();
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        let onHoldWarning = "";
        if (Controls.InvoiceStatus__.GetValue() === Lib.AP.InvoiceStatus.OnHold) {
            onHoldWarning = "_OnHold invoice status warning";
        }
        Data.SetWarning("InvoiceStatus__", onHoldWarning);
        Controls.HeaderDataPanel.SetReadOnly(true);
        Controls.OrderNumber__.SetBrowsable(false);
        Controls.VendorInformation.SetReadOnly(true);
        Controls.ERP_Details.SetReadOnly(true);
        Controls.CalculateTax__.SetReadOnly(!reviewersCanModifyLineItems() || invoiceDoc.DoNotUseTaxCode());
        Controls.SAPPaymentMethod__.SetBrowsable(false);
        Controls.AlternativePayee__.SetBrowsable(false);
        Controls.AlternativePayee__.SetReadOnly(true);
        Controls.ContractNumber__.SetBrowsable(false);
        Controls.ContractNumber__.SetReadOnly(true);
        Controls.OriginalContractRUIDEX__.SetReadOnly(true);
        Controls.ContractReferenceNumber__.SetBrowsable(false);
        Controls.ContractReferenceNumber__.SetReadOnly(true);
        Controls.ContractNumberDetails__.SetBrowsable(false);
        Controls.ContractNumberDetails__.SetReadOnly(true);
        Controls.ContractReferenceNumberDetails__.SetBrowsable(false);
        Controls.ContractReferenceNumberDetails__.SetReadOnly(true);
        Controls.ButtonLoadTemplate__.Hide(true);
        Controls.ButtonSaveTemplate__.Hide(true);
        Controls.ButtonLoadClipboard__.Hide(true);
        Controls.Line_Items_Actions.Hide(true);
        if (reviewersCanModifyLineItems()) {
            Controls.LineItems__.HideTableRowMenu("hideNothing");
        }
        else {
            Controls.LineItems__.HideTableRowMenu("hideOnlyTheMenu");
        }
        this.UpdateWorkflowDataPanel({
            approversListRowMenuIsHidden: true,
            approversListIsReadOnly: false,
            approverFieldIsBrowsable: false,
            approverFieldIsReadOnly: true
        });
        Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.UpdatePayment, !userCanUpdatePayment());
        // Allow adding reviewers or controllers
        handleApproversListEvents();
        this.UpdateExceptionsTypePanel({
            // Cannot modify Exception
            panelIsReadOnly: true,
            panelIsHidden: !Controls.CurrentException__.GetValue()
        });
        BankDetails.hideAll();
        Controls.ExtendedWithholdingTaxPane.SetReadOnly(true);
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnApprovalLayoutEnd", this);
    },
    InitPurchaseOrdersBrowse: function () {
        if (!Lib.ERP.IsSAP() || Lib.AP.InvoiceType.isPOGLInvoice()) {
            const invoiceDocument = Lib.AP.GetInvoiceDocument();
            Controls.OrderNumber__.OnBrowse = invoiceDocument.OnBrowsePurchaseOrders(Controls.OrderNumber__, genericAndSapPOGLAddLineItem, cleanUpLineItems, GetTaxRateForItemList, LayoutHelper);
        }
        else {
            const invoiceDocument = Lib.AP.GetInvoiceDocument();
            Controls.OrderNumber__.OnBrowse = invoiceDocument.OnBrowsePurchaseOrders(Controls.OrderNumber__, sapMMAddLineItem, cleanUpLineItems, GetTaxRateForItemList, LayoutHelper);
        }
    },
    /**
     * Put some fields in read-only when the invoice was posted
     */
    SetPostedLayout: function () {
        LayoutHelper.SetCommonLayoutRestriction();
        Data.SetWarning("InvoiceStatus__", "");
        Controls.HeaderDataPanel.SetReadOnly(true);
        Controls.OrderNumber__.SetBrowsable(false);
        Controls.VendorInformation.SetReadOnly(true);
        Controls.Invoice_Processing.SetReadOnly(true);
        Controls.CalculateTax__.SetReadOnly(true);
        this.UpdateWorkflowDataPanel({
            // Restore the ability to insert / delete lines in table in case of a back to AP
            approversListIsReadOnly: Lib.AP.InvoiceType.isConsignmentInvoice(),
            approverFieldIsReadOnly: true,
            approverFieldIsBrowsable: !ProcessInstance.isReadOnly
        });
        Lib.AP.GetInvoiceDocumentLayout().Hide(Controls.UpdatePayment, !userCanUpdatePayment());
        Controls.SAPPaymentMethod__.SetBrowsable(false);
        Controls.AlternativePayee__.SetBrowsable(false);
        Controls.AlternativePayee__.SetReadOnly(true);
        Controls.BusinessArea__.SetBrowsable(false);
        Controls.ContractNumber__.SetBrowsable(false);
        Controls.ContractNumber__.SetReadOnly(true);
        Controls.OriginalContractRUIDEX__.SetReadOnly(true);
        Controls.ContractReferenceNumber__.SetBrowsable(false);
        Controls.ContractReferenceNumber__.SetReadOnly(true);
        Controls.ContractNumberDetails__.SetBrowsable(false);
        Controls.ContractNumberDetails__.SetReadOnly(true);
        Controls.ContractReferenceNumberDetails__.SetBrowsable(false);
        Controls.ContractReferenceNumberDetails__.SetReadOnly(true);
        Controls.BillingScheduleLink__.SetBrowsable(false);
        Controls.ButtonLoadTemplate__.Hide(true);
        Controls.ButtonSaveTemplate__.Hide(true);
        Controls.ButtonLoadClipboard__.Hide(true);
        Controls.Line_Items_Actions.Hide(true);
        handleApproversListEvents();
        this.UpdateExceptionsTypePanel({
            // Cannot modify Exception
            panelIsReadOnly: true,
            panelIsHidden: !Controls.CurrentException__.GetValue()
        });
        BankDetails.hide();
        Controls.ExtendedWithholdingTaxPane.SetReadOnly(true);
    },
    InitDecimalField: function (control) {
        if (control.GetValue() === null) {
            control.SetValue(0);
        }
    },
    ShouldEnableManualLink: function (invoiceStatus) {
        return !ProcessInstance.isReadOnly &&
            (invoiceStatus === Lib.AP.InvoiceStatus.ToPost || invoiceStatus === Lib.AP.InvoiceStatus.ToVerify || invoiceStatus === Lib.AP.InvoiceStatus.SetAside) &&
            !Lib.AP.InvoiceType.isPOGLInvoice() && !Lib.AP.InvoiceType.isConsignmentInvoice() && !Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP();
    },
    RefreshForManualLink: function () {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        if (LayoutHelper.ShouldEnableManualLink(Controls.InvoiceStatus__.GetValue()) && !ERPNumberDialogHelper.ShouldPopup()) {
            layout.EnableManualLink();
            layout.UpdateLayoutForManualLink();
            layout.Hide(Controls.ERPMMInvoiceNumber__, false);
        }
        else {
            layout.DisableManualLink();
            layout.UpdateLayoutForManualLink();
            layout.Hide(Controls.ERPMMInvoiceNumber__, !Lib.AP.InvoiceType.isPOInvoice());
        }
    },
    /**
     * Update the layout for data capture mode and performs basic checking upon data
     */
    SetDataCaptureLayout: function () {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        Controls.HeaderDataPanel.SetReadOnly(false);
        Controls.OrderNumber__.SetBrowsable(!ProcessInstance.isReadOnly && !Lib.AP.InvoiceType.isGLOrDownpaymentInvoice());
        Controls.VendorInformation.SetReadOnly(false);
        Controls.Invoice_Processing.SetReadOnly(false);
        Controls.CalculateTax__.SetReadOnly(invoiceDoc.DoNotUseTaxCode());
        Controls.Payment.SetReadOnly(false);
        Controls.Details.SetReadOnly(false);
        Controls.ContractNumber__.SetBrowsable(false);
        Controls.ContractNumber__.SetReadOnly(false);
        Controls.OriginalContractRUIDEX__.SetReadOnly(true);
        Controls.ContractReferenceNumber__.SetBrowsable(!ProcessInstance.isReadOnly);
        Controls.ContractReferenceNumber__.SetReadOnly(false);
        Controls.ContractNumberDetails__.SetBrowsable(false);
        Controls.ContractNumberDetails__.SetReadOnly(false);
        Controls.ContractReferenceNumberDetails__.SetBrowsable(false);
        Controls.ContractReferenceNumberDetails__.SetReadOnly(false);
        Controls.BillingScheduleLink__.SetBrowsable(!ProcessInstance.isReadOnly);
        Controls.SAPPaymentMethod__.SetBrowsable(true);
        Controls.AlternativePayee__.SetBrowsable(true);
        Controls.AlternativePayee__.SetReadOnly(false);
        Controls.BusinessArea__.SetBrowsable(true);
        layout.Hide(Controls.Investment__, !Lib.P2P.IsInvestmentEnabled() || !Lib.AP.InvoiceType.isPOInvoice());
        layout.Hide(Controls.ERPClearingDocumentNumber__, !Lib.AP.InvoiceType.isConsignmentInvoice());
        const customizeInvestmentCheck = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnInvestmentCheck");
        if (!customizeInvestmentCheck) {
            Controls.Investment__.Check(false);
        }
        Controls.VendorContactEmail__.SetReadOnly(Sys.Helpers.IsEmpty(Controls.VendorNumber__.GetValue()) || !Sys.Helpers.IsEmpty(Controls.VendorContactEmail__.GetValue()));
        const allowEditingDiscountAmount = Lib.AP.AllowEditingDiscountAmount();
        Controls.EstimatedDiscountAmount__.SetReadOnly(!allowEditingDiscountAmount);
        LayoutHelper.UpdateManualLinkLayout();
        const invoiceStatus = Controls.InvoiceStatus__.GetValue();
        Controls.AsideReason__.Hide(invoiceStatus !== Lib.AP.InvoiceStatus.SetAside);
        Controls.AsideReasonForApprovers__.Hide(invoiceStatus !== Lib.AP.InvoiceStatus.SetAside);
        Controls.BackToAPReason__.Hide(true);
        Controls.RejectReason__.Hide(true);
        layout.Hide(Controls.UpdatePayment, true);
        LayoutHelper.RefreshForManualLink();
        const reconciledByHeader = Variable.GetValueAsString("ReconciledByHeader");
        if (invoiceStatus === Lib.AP.InvoiceStatus.ToVerify &&
            reconciledByHeader &&
            reconciledByHeader.toUpperCase() === "TRUE") {
            Controls.ReconcileWarning__.SetWarningStyle(true);
            Controls.ReconcileWarning__.Hide(false);
        }
        Controls.TemplateWarning__.SetWarningStyle(true);
        Controls.TemplateWarning__.Hide(Data.GetWarning("CodingTemplate__") === null);
        if (Variable.GetValueAsString("displayKeepAllLinesWarning")) {
            Controls.TooManyLinesWarning__.SetWarningStyle(true);
            Controls.TooManyLinesWarning__.Hide(false);
        }
        Data.SetWarning("InvoiceStatus__", "");
        // Restore rights on the attachments list
        Controls.DocumentsPanel.SetNumberOfNonRemovableAttachments(0);
        Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(true);
        this.UpdateWorkflowDataPanel({
            // Restore the ability to insert / delete lines in table in case of a back to AP
            approversListIsReadOnly: false,
            approverFieldIsReadOnly: true,
            approverFieldIsBrowsable: !ProcessInstance.isReadOnly
        });
        // Restore the visibility of parameters panel
        Controls.Parameters.SetReadOnly(false);
        Controls.Parameters.Hide(false);
        // Add events handlers
        handleApproversListEvents();
        this.InitPurchaseOrdersBrowse();
        // initialize amounts
        LayoutHelper.InitDecimalField(Controls.NetAmount__);
        LayoutHelper.InitDecimalField(Controls.TaxAmount__);
        LayoutHelper.InitDecimalField(Controls.Balance__);
        const firstItem = Controls.LineItems__.GetItem(0);
        if (firstItem && firstItem.GetValue("TaxAmount__") === null) {
            firstItem.SetValue("TaxAmount__", 0);
        }
        invoiceDoc.UpdateLocalAndCorporateAmounts();
        onLocalNetAmountUpdate(/*disablebillingScheduleCallbacks=*/ true);
        // Check balance
        Lib.ERP.checkBalance(false);
        // Check PO line items and GL line items
        checkPOInvoiceLineItems();
        this.UpdateExceptionsTypePanel({
            // FT-008110 - Price mismatch exception
            panelIsHidden: false,
            panelIsReadOnly: false
        });
        // To activate feature call ExceptionsType.Hide(false) instead
    },
    /**
     * Returns true when the Delivery note column must be visible.
     */
    ShouldDisplayDeliveryNoteColumn: function () {
        return Controls.GRIV__.IsChecked() || InvoiceLineItem.iNonGRIVPODNLinesCount > 0;
    },
    /**
     * Check the header field and show the column on line items
     */
    SwitchToGRIV: function () {
        Data.SetValue("GRIV__", true);
        Controls.LineItems__.DeliveryNote__.Hide(false);
    },
    /**
     * Uncheck the header field and hide the column on line items if no non-GRIV line item with delivery note exists
     */
    SwitchToNonGRIV: function () {
        Data.SetValue("GRIV__", false);
        Controls.LineItems__.DeliveryNote__.Hide(!LayoutHelper.ShouldDisplayDeliveryNoteColumn());
    },
    InitEventHistoryPanel: function () {
        // Init conversation control (only when CI has been created)
        if (Data.GetValue("PortalRuidex__")) {
            const conversationInfo = Lib.P2P.Conversation.ExtendConversationInfoWithBusinessInfo({ Options: Lib.P2P.Conversation.defaultOptions }, Lib.P2P.Conversation.GetBusinessInfoFromUser(User));
            Variable.SetValueAsString("LastVendorLogin", User.loginId);
            Controls.ConversationUI__.Init(conversationInfo);
        }
        // Show event history
        if (Data.GetValue("PortalRuidex__") && Data.GetValue("VendorContactEmail__")) {
            // Add vendor name into Event history panel title
            const title = Language.Translate("_Event_history", false, Data.GetValue("VendorName__"));
            Controls.Event_history.SetText(title);
            Controls.Event_history.Hide(false);
            if (Data.GetValue("NewConversationMessage") === "1") {
                LayoutHelper.HideNewConversationMessageWarning(false);
                LayoutHelper.UpdateLabelWarning();
            }
            else {
                LayoutHelper.HideNewConversationMessageWarning(true);
            }
            Controls.NewConversationMessageWarning__.BindEvent("onClick", this.SetNewMessageConversationAlertToRead);
        }
        else {
            Controls.Event_history.Hide(true);
        }
    },
    HideNewConversationMessageWarning: function (toHide) {
        Controls.ConversationSpacer__.Hide(toHide);
        Controls.NewConversationMessageWarning__.Hide(toHide);
    },
    SetNewMessageConversationAlertToRead: function () {
        ProcessInstance.SetSilentChange(true);
        Controls.ConversationUI__.SetNewConversationMessage("0");
        LayoutHelper.HideNewConversationMessageWarning(true);
        ProcessInstance.SetSilentChange(false);
    },
    UpdateLabelWarning: function () {
        const warningMessage = Language.Translate("_This conversation contains a new message from your vendor");
        Controls.NewConversationMessageWarning__.FireEvent("setMessage", { warningConversationMessage: warningMessage });
    },
    DisplayContractsElements: function () {
        if (g_p2pParameters.GetParameter("EnableContractGlobalSetting") === "1") {
            Controls.ContractReferenceNumber__.Hide(false);
            Controls.ContractReferenceNumberDetails__.Hide(false);
            Controls.BillingScheduleLink__.Hide(false);
            Controls.BillingScheduleLink__.SetReadOnly(true);
            Controls.BillingScheduleLink__.DisplayAs({ type: "Link" });
            Controls.BillingScheduleLinkForApprovers__.Hide(false);
            Controls.BillingScheduleLinkForApprovers__.SetReadOnly(true);
            Controls.BillingScheduleLinkForApprovers__.DisplayAs({ type: "Link" });
            Controls.BillingScheduleSpacer__.Hide(false);
        }
    },
    DisplayGHGEmissionReportingElements: function () {
        // FT-032539 - Carbon footprint tracking and reporting : Display energy consumption fields (header and line itemsO if option is enabled
        const shouldDisplayEnergyConsumption = Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled();
        Controls.GHG_Emissions.Hide(!shouldDisplayEnergyConsumption);
        Controls.LineItems__.EnergyConsumptionUnit__.Hide(!shouldDisplayEnergyConsumption);
        Controls.LineItems__.EnergyConsumptionValue__.Hide(!shouldDisplayEnergyConsumption);
        Controls.LineItems__.EnergyConsumptionKgCO2e__.Hide(!shouldDisplayEnergyConsumption);
        // Fields are to remain editable by Reviewers/Approvers, and even when edit after posting (i.e. already in archive). EnergyConsumptionKgCO2e__ is always a read-only field
        Controls.LineItems__.EnergyConsumptionUnit__.SetReadOnly(!shouldDisplayEnergyConsumption);
        Controls.LineItems__.EnergyConsumptionValue__.SetReadOnly(!shouldDisplayEnergyConsumption);
        Controls.EnergyConsumptionLevel__.SetReadOnly(!shouldDisplayEnergyConsumption);
        Controls.EnergyConsumptionCategory__.SetReadOnly(!shouldDisplayEnergyConsumption);
        const conversionFactorSource = Lib.P2P.GHGEmissions.GetGHGConversionFactorSource();
        let browseDataSource = "";
        let savedColumn = "";
        let displayColumn = "";
        let filter = "";
        let attributes = "";
        switch (conversionFactorSource) {
            case "Ademe":
                browseDataSource = "S2P - GHG Emissions - Ademe Conversion Factor__";
                savedColumn = "UnitOfMeasure__";
                displayColumn = "CategoryCode__|BaseName__|AttributeName__|GeographicalLocalization__|GHGConversionFactor__";
                filter = "(LineType__=Elément)(ElementType__=Facteur d'émission)(ElementStatus__=Valide générique)";
                attributes = "ElementIdentifier__|GHGConversionFactor__";
                break;
            case "Defra":
                browseDataSource = "S2P - GHG Emissions - Defra Conversion Factor__";
                savedColumn = "UnitOfMeasure__";
                displayColumn = "Category__|ColumnText__|GHGConversionFactor__";
                filter = "(!(Scope__=))(GHGPerUnit__=kg CO2e)";
                attributes = "ElementIdentifier__|GHGConversionFactor__";
                break;
            case "Internal":
            default:
                browseDataSource = "P2P - UnitOfMeasureCarbonFootprint__";
                savedColumn = "UnitOfMeasure__";
                displayColumn = "UnitOfMeasure__|GHGConversionFactor__|Description__";
                filter = "(|(CompanyCode__=%[CompanyCode__])(CompanyCode__=)(!(CompanyCode__=*)))";
                attributes = "GHGConversionFactor__";
                break;
        }
        Controls.LineItems__.EnergyConsumptionUnit__.SetDataSource(browseDataSource);
        Controls.LineItems__.EnergyConsumptionUnit__.SetSavedColumn(savedColumn);
        Controls.LineItems__.EnergyConsumptionUnit__.SetDisplayedColumns(displayColumn);
        Controls.LineItems__.EnergyConsumptionUnit__.SetAttributes(attributes);
        Controls.LineItems__.EnergyConsumptionUnit__.SetFilter(filter);
        Controls.LineItems__.EnergyConsumptionUnit__.OnColumnFormating = (attribute, data) => {
            if (attribute === "GHGConversionFactor__") {
                const factor = parseFloat(data);
                if (!isNaN(factor)) {
                    return Language.FormatNumber(factor, false, 3, 3);
                }
            }
            return undefined;
        };
    },
    GetERPCustomDimensionsColumnsOrder: function () {
        // Get ERP connector definition
        const customDimensionsDefinition = Lib.ERP.CustomERP.Common.GetAnalyticFields();
        /**
         * Do nothing if a legacy connector is used and no custom dimension is defined
         *
         * Here just checking for legacy connector is not enough as Bizlab did a temporary fix
         * that simulates a custom dimensions definition to allow displaying their own custom dimensions
         */
        if (Lib.ERP.CustomERP.Common.IsLegacyConnectorUsed() && customDimensionsDefinition.length === 0) {
            return [];
        }
        /**
         * /!\ When doing something about
         * Z_CustomDimension_#_Code__
         * or
         * Z_CustomDimension_#_CodeDescription__
         * fields, make sure to check that we are not using a legacy connector.
         *
         * Fields with the same name are used by Bizlab connectors so not checking may lead to issues.
         *
         * A good way to check is to use the function Lib.ERP.CustomERP.Common.IsLegacyConnectorUsed as shown above.
         */
        const customDimensions = [];
        for (let i = 1; i <= 10; i++) {
            customDimensions.push("Z_CustomDimension_" + i + "_Code__", "Z_CustomDimension_" + i + "_CodeDescription__");
        }
        return [{
                customFields: customDimensions,
                referenceField: "CCDescription__"
            }];
    },
    HideCustomDimension: function (field, shouldHide, label) {
        if (Controls.LineItems__[field]) {
            if (label) {
                Controls.LineItems__[field].SetLabel(label);
            }
            // Update browse dialog title
            if (Controls.LineItems__[field].GetType() === "DatabaseComboBox" && label) {
                Controls.LineItems__[field].SetTitle(label);
            }
            Controls.LineItems__[field].Hide(shouldHide);
        }
    },
    DisplayERPCustomDimensions: function () {
        // Get ERP connector definition
        const customDimensionsDefinition = Lib.ERP.CustomERP.Common.GetAnalyticFields();
        /**
         * Do nothing if a legacy connector is used and no custom dimension is defined
         *
         * Here just checking for legacy connector is not enough as Bizlab did a temporary fix
         * that simulates a custom dimensions definition to allow displaying their own custom dimensions
         */
        if (Lib.ERP.CustomERP.Common.IsLegacyConnectorUsed() && customDimensionsDefinition.length === 0) {
            return;
        }
        let field;
        // Hide all custom dimension fields
        for (let i = 1; i <= 10; i++) {
            field = "Z_CustomDimension_" + i + "_Code__";
            this.HideCustomDimension(field, true);
            field = "Z_CustomDimension_" + i + "_CodeDescription__";
            this.HideCustomDimension(field, true);
            if (Controls.LineItems__[field]) {
                Controls.LineItems__[field].SetReadOnly(true);
            }
        }
        if (customDimensionsDefinition.length === 0) {
            return;
        }
        // Loop through custom dimension to display them accordingly in the line items table
        for (const dimension of customDimensionsDefinition) {
            // No point continuing this loop if data is missing
            if (!dimension["Z_CustomDimensionX__"] || !dimension["Label__"] || !dimension["Endpoint__"]) {
                Log.Warn("DisplayERPCustomDimensions - Missing data in custom dimension, expecting value for Z_CustomDimensionX__, Label__ and Endpoint__ - Skipping this dimension", dimension);
                continue;
            }
            field = dimension["Z_CustomDimensionX__"];
            this.HideCustomDimension(field, false, dimension["Label__"]);
            field = dimension["Z_CustomDimensionX__"].replace("__", "Description__");
            this.HideCustomDimension(field, false, dimension["Label__"] + Language.Translate("_CustomDimensionDescription"));
        }
    },
    InitWorkflowDataPanel: function () {
        Lib.AP.WorkflowCtrl.UpdateLayout();
    },
    UpdateExceptionsTypePanel: function (options) {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        const wkfRulesDisabled = Sys.Parameters.GetInstance("AP").GetParameter("WorkflowDisableRules") === "1";
        const exceptionAtLineLevel = Lib.AP.IsExceptionResolvedOnLineItemLevel();
        if (wkfRulesDisabled || exceptionAtLineLevel) {
            options.panelIsHidden = true;
            options.panelIsReadOnly = true;
            options.currentExceptionIsHidden = true;
        }
        const panelIsReadOnly = options.panelIsReadOnly || false;
        const currentExceptionIsHidden = options.currentExceptionIsHidden ? panelIsReadOnly && !Controls.CurrentException__.GetValue() : false;
        const panelIsHidden = options.panelIsHidden !== undefined ? options.panelIsHidden && !Controls.CurrentException__.GetValue() : currentExceptionIsHidden;
        Controls.ExceptionsType.SetReadOnly(panelIsReadOnly);
        Controls.ExceptionsType.Hide(panelIsHidden);
        layout.Hide(Controls.CurrentException__, currentExceptionIsHidden);
    },
    UpdateWorkflowDataPanel: function (options) {
        const layout = Lib.AP.GetInvoiceDocumentLayout();
        const noWorkflowRules = Sys.Parameters.GetInstance("AP").GetParameter("WorkflowDisableRules") === "1";
        if (noWorkflowRules === true) {
            options.approversListIsReadOnly = true;
            options.approverFieldIsReadOnly = true;
            options.approverFieldIsBrowsable = false;
        }
        const otherFieldAreReadOnly = true;
        if (noWorkflowRules === true) {
            Controls.WorkflowDataPanel.SetReadOnly(true);
            Controls.WorkflowDataPanel.Hide(true);
        }
        if (noWorkflowRules === true && !Controls.Comment__.GetValue()) {
            Controls.Comment__.SetReadOnly(true);
            layout.Hide(Controls.Comment__, true);
        }
        if (options.approversListIsReadOnly === true || options.approversListIsReadOnly === false) {
            Controls.ApproversList__.SetReadOnly(options.approversListIsReadOnly);
            if (options.approversListIsReadOnly && Controls.ApproversList__.GetItemCount() === 0) {
                layout.Hide(Controls.ApproversList__, true);
            }
        }
        if (options.approversListRowMenuIsHidden === true || options.approversListRowMenuIsHidden === false) {
            Controls.ApproversList__.HideTableRowMenu(options.approversListRowMenuIsHidden);
        }
        if (options.approverFieldIsReadOnly === true || options.approverFieldIsReadOnly === false) {
            Controls.ApproversList__.Approver__.SetReadOnly(options.approverFieldIsReadOnly);
        }
        if (options.approverFieldIsBrowsable === true || options.approverFieldIsBrowsable === false) {
            Controls.ApproversList__.Approver__.SetBrowsable(options.approverFieldIsBrowsable);
        }
        Controls.ApproversList__.ApprovalDate__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.ApproverID__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.Approved__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.ApproverEmail__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.ApproverAction__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.ApproverComment__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.WorkflowIndex__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.ApproverLabelRole__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.LineMarker__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.ApprovalRequestDate__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.ActualApprover__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.WorkflowRule__.SetReadOnly(otherFieldAreReadOnly);
        Controls.ApproversList__.WorkflowStep__.SetReadOnly(otherFieldAreReadOnly);
    },
    SetHelperIDBasedOnCurrentStepRole: function () {
        if (currentStepIsApprover()) {
            Process.SetHelpId(2527);
        }
        else if (currentStepIsController()) {
            Process.SetHelpId(2528);
        }
        else {
            Process.SetHelpId(2008);
        }
    },
    RemoveTaxCodeCostCenterWarnings: function () {
        const inferedTaxCodeWarningMessage = Language.Translate("_Confirm this is the correct tax code");
        const inferedCostCenterWarningMessage = Language.Translate("_ConfirmThisIsTheCorrectCostCenter");
        const lineItemsTable = Data.GetTable("LineItems__");
        for (let i = 0; i < lineItemsTable.GetItemCount(); i++) {
            const item = lineItemsTable.GetItem(i);
            if (item.GetWarning("TaxCode__") === inferedTaxCodeWarningMessage) {
                item.SetWarning("TaxCode__", "");
            }
            //Remove inferred CostCenter warning
            if (item.GetWarning("CostCenter__") === inferedCostCenterWarningMessage) {
                item.SetWarning("CostCenter__", "");
            }
        }
    },
    ExtractedLineItems: {
        Init: function () {
            Controls.ExtractedLineItems__.Hide(true);
            LayoutHelper.ExtractedLineItems.SetButtonText();
            if (Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
                Controls.LineItemsRecognition.Hide(true);
                Controls.ExtractedLineItems__.SetReadOnly(true);
                Controls.ExtractedLineItems__.HideBottomNavigation(true);
                Controls.ExtractedLineItems__.HideTopNavigation(true);
            }
            else {
                const invoiceStatus = Data.GetValue("InvoiceStatus__");
                const autocompleteEnabled = Sys.Parameters.GetInstance("AP").GetParameter("EnableAutocompleteOnLineItems", "0") === "1";
                const autocompletePossible = autocompleteEnabled && (invoiceStatus === Lib.AP.InvoiceStatus.ToVerify || invoiceStatus === Lib.AP.InvoiceStatus.SetAside);
                Controls.LineItemsRecognition.Hide(!autocompleteEnabled);
                Controls.HeaderDNExtracted__.Hide(autocompleteEnabled);
                Controls.ExtractedLineItems__.SetReadOnly(!autocompletePossible);
                Controls.ExtractedLineItems__.SetAtLeastOneLine(true);
                Controls.ExtractedLineItems__.HideBottomNavigation(!autocompleteEnabled);
                Controls.ExtractedLineItems__.HideTopNavigation(!autocompleteEnabled);
            }
        },
        HasTeachingInExtractedLines: function () {
            let isLineTeached = false;
            const lineItemsTable = Data.GetTable("ExtractedLineItems__");
            const nbItems = lineItemsTable.GetItemCount();
            for (let i = 0; i < nbItems; i++) {
                const item = lineItemsTable.GetItem(i);
                if ((!item.IsNullOrEmpty("QuantityExtracted__") && item.GetComputedValueSource("QuantityExtracted__").toLocaleLowerCase() === "teaching") ||
                    (!item.IsNullOrEmpty("AmountExtracted__") && item.GetComputedValueSource("AmountExtracted__").toLocaleLowerCase() === "teaching")) {
                    isLineTeached = true;
                    break;
                }
            }
            return isLineTeached;
        },
        SetButtonText: function () {
            const paneVisible = Controls.ExtractedLineItems__.IsVisible();
            if (paneVisible) {
                Controls.ShowExtractedLineItems__.SetText(Language.Translate("_Hide extracted items"));
            }
            else {
                Controls.ShowExtractedLineItems__.SetText(Language.Translate("_Show extracted items"));
            }
        }
    },
    UpdateRelatedInvoiceLink(invoiceLinkedRuidex, updateValues = true, ownerid = "") {
        const fieldNames = ["RelatedInvoice__", "RelatedInvoiceForApprovers__"];
        for (let fieldName of fieldNames) {
            if (invoiceLinkedRuidex) {
                let removable = false;
                if (currentStepIsApStart()) {
                    removable = !Controls.HeaderDataPanel.IsReadOnly();
                }
                else if (currentStepIsController() || currentStepIsApprover()) {
                    removable = !Controls.HeaderDataPanelForApproversLeft.IsReadOnly() && !Data.GetValue("RelatedInvoiceRuidEx__");
                }
                Controls[fieldName].SetRemovable(removable);
                Controls[fieldName].SetBrowsable(false);
                Controls[fieldName].SetReadOnly(true);
                let displayAsOptions = { type: "Link" };
                if (!Controls[fieldName].GetValue()) {
                    displayAsOptions.text = Language.Translate("_Open invoice");
                }
                Controls[fieldName].DisplayAs(displayAsOptions);
                const openMessageParams = {
                    ruidEx: invoiceLinkedRuidex,
                    goBackOnQuit: false,
                    inNewTab: true,
                    additionalParameters: {
                        OnQuit: "CleanAndClose"
                    }
                };
                Controls[fieldName].OnClick = function () {
                    Process.OpenMessage(openMessageParams);
                };
            }
            else {
                if (updateValues) {
                    Controls[fieldName].SetValue("");
                }
                Controls[fieldName].DisplayAs();
                Controls[fieldName].OnClick = () => void 0;
                Controls[fieldName].SetReadOnly(false);
                Controls[fieldName].SetBrowsable(true);
                Controls[fieldName].SetRemovable(false);
            }
            Controls[fieldName].SetWarning("");
        }
        if (updateValues) {
            ProcessInstance.SetSilentChange(true);
            Controls.RelatedInvoiceRuidEx__.SetValue(invoiceLinkedRuidex);
            Variable.SetValueAsString("RelatedInvoiceOwnerID", ownerid);
            Lib.AP.WorkflowCtrl.Rebuild(true, true, "AddRelatedInvoiceOwnerID");
            ProcessInstance.SetSilentChange(false);
        }
        CheckIfCreditNoteAmountMatches(invoiceLinkedRuidex);
    },
    /**
     * After an update, custom fields ordering can be altered during layout merge.
     * Until the issue is fixed, we must reorder custom fields at form opening.
     * Custom field(s) will be inserted at the right of the reference field.
     *
     * If several sets of custom fields use the same reference field, the later elements in arrray are inserted closer to the reference field.
     */
    SetCustomFieldsColumnsOrder(columnsOrderInfo) {
        if (columnsOrderInfo && columnsOrderInfo.length > 0) {
            const columnsOrder = Controls.LineItems__.GetColumnsOrder();
            const fieldsFound = [];
            // Remove custom fields if present
            columnsOrderInfo.forEach(fieldsInfo => {
                fieldsInfo.customFields.forEach(field => {
                    const idx = columnsOrder.indexOf(field);
                    if (idx !== -1) {
                        columnsOrder.splice(idx, 1);
                        fieldsFound.push(field);
                    }
                });
            });
            if (fieldsFound.length > 0) {
                // Reinsert previously removed custom fields after their desired predecessor
                columnsOrderInfo.forEach(fieldsInfo => {
                    const fieldsFoundToAdd = [];
                    fieldsInfo.customFields.forEach(field => {
                        if (fieldsFound.indexOf(field) !== -1) {
                            fieldsFoundToAdd.push(field);
                        }
                    });
                    const referenceFieldIdx = columnsOrder.indexOf(fieldsInfo.referenceField);
                    if (referenceFieldIdx !== -1) {
                        columnsOrder.splice(referenceFieldIdx + 1, 0, ...fieldsFoundToAdd);
                    }
                    else {
                        Log.Warn(`Cannot add ${fieldsFoundToAdd.join(',')} after ${fieldsInfo.referenceField} (predecessor not found): adding at the end`);
                        columnsOrder.push(...fieldsFoundToAdd);
                    }
                });
                Controls.LineItems__.SetColumnsOrder(columnsOrder);
            }
            ;
        }
    }
};
var ParameterDetails;
(function (ParameterDetails) {
    ParameterDetails.originalValues = {
        DuplicateCheckAlertLevel__: "",
        TouchlessEnabled__: false,
        SupplierReconciliationType__: "",
        PartNumberEDIPreferredExtractionMode__: ""
    };
    let exceptionFieldControls = [
        Controls.TouchlessErrorList__,
        Controls.CompanyIdentificationException__,
        Controls.VendorIdentificationException__,
        Controls.MissingHeaderException__,
        Controls.MissingLineFieldException__,
        Controls.InvoiceNotBalanceException__,
        Controls.InvalidValueException__,
        Controls.DataToConfirmException__,
        Controls.DuplicateInvoiceException__,
        Controls.PriceMismatchException__,
        Controls.QuantityMismatchException__,
        Controls.UDCException__,
        Controls.NotCompliantException__,
        Controls.WorkflowErrorException__,
        Controls.OtherException__
    ];
    function buildExceptionFieldControls() {
        const defaultExceptionFieldControls = [...exceptionFieldControls]; // Clone array
        let modifiedExceptionFieldControls = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.UpdateExceptionFieldControls", defaultExceptionFieldControls);
        if (Array.isArray(modifiedExceptionFieldControls) && modifiedExceptionFieldControls.length) {
            exceptionFieldControls = modifiedExceptionFieldControls;
        }
    }
    ParameterDetails.buildExceptionFieldControls = buildExceptionFieldControls;
    function init() {
        ParameterDetails.buildExceptionFieldControls();
    }
    ParameterDetails.init = init;
    function hideAll() {
        Controls.ShowParameters__.Hide(true);
        ParameterDetails.hide();
    }
    ParameterDetails.hideAll = hideAll;
    function hide() {
        Controls.ParametersWarning__.Hide(true);
        Controls.ShowParameters__.SetText("_Show Parameters");
        Controls.ComputingParametersWaiting__.Hide(true);
        Controls.Duplicates__.Hide(true);
        Controls.DuplicateCheckAlertLevel__.Hide(true);
        Controls.Reconciliation__.Hide(true);
        Controls.SupplierReconciliationType__.Hide(true);
        Controls.PartNumberEDIPreferredExtractionMode__.Hide(true);
        Controls.AutomaticProcessing__.Hide(true);
        Controls.TouchlessEnabled__.Hide(true);
        Controls.TouchlessDone__.Hide(true);
        exceptionFieldControls.forEach(control => {
            if (control && control.Hide) {
                control.Hide(true);
            }
        });
    }
    ParameterDetails.hide = hide;
    function show(warningDuplicateCheck, warningTouchlessCheck) {
        Controls.ShowParameters__.SetText("_Hide Parameters");
        const isGLWithoutTouchless = Lib.AP.InvoiceType.isGLInvoice() && Sys.Parameters.GetInstance("AP").GetParameter("EnableTouchlessForNonPoInvoice") !== "1";
        if (warningDuplicateCheck || warningTouchlessCheck) {
            Controls.ParametersWarning__.Hide(false);
            let warningMessage = "";
            const originalDuplicate = parseInt(ParameterDetails.originalValues.DuplicateCheckAlertLevel__, 10);
            const originalTouchless = ParameterDetails.originalValues.TouchlessEnabled__;
            const duplicateLabels = [
                "Do not alert on duplicates",
                "If at least 1 value is identical",
                "If at least 2 values are identical",
                "If at least 3 values are identical"
            ];
            if (warningDuplicateCheck && warningTouchlessCheck) {
                warningMessage = Language.Translate(warningDuplicateCheck + warningTouchlessCheck.replace("{0}", "{1}"), true, Language.Translate(duplicateLabels[originalDuplicate]), Language.Translate(originalTouchless ? "_enabled" : "_disabled"));
            }
            else if (warningDuplicateCheck) {
                warningMessage = Language.Translate(warningDuplicateCheck, true, Language.Translate(duplicateLabels[originalDuplicate]));
            }
            else {
                warningMessage = Language.Translate(warningTouchlessCheck, true, Language.Translate(originalTouchless ? "_enabled" : "_disabled"));
            }
            Controls.ParametersWarning__.SetText(warningMessage);
        }
        else {
            Controls.ParametersWarning__.Hide(true);
        }
        Controls.Duplicates__.Hide(false);
        Controls.DuplicateCheckAlertLevel__.Hide(false);
        Controls.Reconciliation__.Hide(false);
        Controls.SupplierReconciliationType__.Hide(false);
        Controls.PartNumberEDIPreferredExtractionMode__.Hide(!Lib.AP.ReceptionMethod.isEDI());
        Controls.AutomaticProcessing__.Hide(isGLWithoutTouchless);
        Controls.TouchlessEnabled__.Hide(isGLWithoutTouchless);
        Controls.TouchlessDone__.Hide(isGLWithoutTouchless);
        exceptionFieldControls.forEach(control => {
            if (control && control.Hide) {
                control.Hide(false);
            }
        });
    }
    ParameterDetails.show = show;
    function onClick() {
        Controls.DuplicateCheckAlertLevel__.OnChange = null;
        Controls.TouchlessEnabled__.OnChange = null;
        Controls.SupplierReconciliationType__.OnChange = null;
        Controls.PartNumberEDIPreferredExtractionMode__.OnChange = null;
        if (Controls.Duplicates__.IsVisible()) {
            ParameterDetails.hide();
            return;
        }
        Controls.ComputingParametersWaiting__.Hide(false);
        Controls.ComputingParametersWaiting__.Focus();
        if (Sys.Helpers.IsEmpty(ParameterDetails.originalValues.DuplicateCheckAlertLevel__)) {
            ParameterDetails.originalValues.DuplicateCheckAlertLevel__ = Data.GetValue("DuplicateCheckAlertLevel__");
        }
        if (Sys.Helpers.IsEmpty(ParameterDetails.originalValues.TouchlessEnabled__)) {
            const touchlessEnabled = Data.GetValue("TouchlessEnabled__");
            if (!touchlessEnabled) {
                ParameterDetails.originalValues.TouchlessEnabled__ = false;
            }
            else {
                ParameterDetails.originalValues.TouchlessEnabled__ = true;
            }
        }
        if (Sys.Helpers.IsEmpty(ParameterDetails.originalValues.SupplierReconciliationType__)) {
            ParameterDetails.originalValues.SupplierReconciliationType__ = Data.GetValue("SupplierReconciliationType__");
        }
        if (Sys.Helpers.IsEmpty(ParameterDetails.originalValues.PartNumberEDIPreferredExtractionMode__)) {
            ParameterDetails.originalValues.PartNumberEDIPreferredExtractionMode__ = Data.GetValue("PartNumberEDIPreferredExtractionMode__");
        }
        resetParameters();
        const callbackCheckForParametersChanges = function () {
            Controls.ComputingParametersWaiting__.Hide(true);
            let warningDuplicateCheckContent = "";
            let warningTouchlessCheckContent = "";
            const isGLWithoutTouchless = Lib.AP.InvoiceType.isGLInvoice() && Sys.Parameters.GetInstance("AP").GetParameter("EnableTouchlessForNonPoInvoice") !== "1";
            if (ParameterDetails.originalValues.DuplicateCheckAlertLevel__ !== Data.GetValue("DuplicateCheckAlertLevel__")) {
                warningDuplicateCheckContent = "_Alert on duplicates changed {0}";
            }
            if (!isGLWithoutTouchless && ParameterDetails.originalValues.TouchlessEnabled__ !== Data.GetValue("TouchlessEnabled__")) {
                warningTouchlessCheckContent = "_Touchless changed {0}";
            }
            ParameterDetails.show(warningDuplicateCheckContent, warningTouchlessCheckContent);
            Controls.DuplicateCheckAlertLevel__.OnChange = ParameterDetails.onParametersChange;
            Controls.TouchlessEnabled__.OnChange = ParameterDetails.onParametersChange;
            Controls.SupplierReconciliationType__.OnChange = ParameterDetails.onParametersChange;
            Controls.PartNumberEDIPreferredExtractionMode__.OnChange = ParameterDetails.onParametersChange;
            Controls.IsFlux10_1Compliant__.OnChange = OnFlux10_1CompliantChange;
            Controls.DuplicateCheckAlertLevel__.Focus();
            Controls.TouchlessEnabled__.Focus();
        };
        if (Query.IsPendingRequest()) {
            Query.NotifyOnCurrentRequestsDone(callbackCheckForParametersChanges);
        }
        else {
            callbackCheckForParametersChanges();
        }
    }
    ParameterDetails.onClick = onClick;
    function onParametersChange() {
        Variable.SetValueAsString("ParametersChanged", "true");
    }
    ParameterDetails.onParametersChange = onParametersChange;
})(ParameterDetails || (ParameterDetails = {}));
var EmbeddedViews;
(function (EmbeddedViews) {
    const viewsContext = {
        vendorRelatedContractsContext: {
            ctrlView: Controls.VendorRelatedContractsView__,
            ctrlNoItem: Controls.VendorRelatedContractsNoItem__,
            ctrlPanel: Controls.VendorRelatedContractsViewPanel,
            ctrlButton: Controls.ToggleVendorRelatedContractsView__,
            viewName: "_AP_SAP_View_Vendor related contracts - embedded",
            processName: "P2P - Contract",
            buttonShowLabel: "_ShowVendorRelatedContractsView",
            buttonHideLabel: "_HideVendorRelatedContractsView",
            hideButtonMethod: function () {
                return g_p2pParameters.GetParameter("EnableContractGlobalSetting") !== "1";
            },
            fillViewMethod: function (context) {
                const selectedVendorNumber = Data.GetValue("VendorNumber__");
                const selectedVendorName = Data.GetValue("VendorName__");
                const selectedCompanyCode = Data.GetValue("CompanyCode__");
                if (selectedVendorName) {
                    Controls.VendorRelatedContractsViewPanel.SetLabel(Language.Translate("_VendorRelatedContractsPanelForVendorX", true, selectedVendorName));
                }
                else {
                    Controls.VendorRelatedContractsViewPanel.SetLabel(Language.Translate("_VendorRelatedContractsPanelDefault", true));
                }
                if (selectedVendorNumber && selectedCompanyCode) {
                    const MAX_CONTRACT_IN_VIEW = 100;
                    const maxContractsInView = getMaxEntitiesInView(context.viewName, MAX_CONTRACT_IN_VIEW);
                    const processFields = "MsnEx";
                    const sortOrder = "ReferenceNumber__ ASC";
                    let filter = `(VendorNumber__=${selectedVendorNumber})`;
                    filter = filter.AddCompanyCodeFilter(selectedCompanyCode);
                    if (!context.viewFilter || context.viewFilter !== filter) {
                        const disable = !Controls.VendorNumber__.GetValue() || !Controls.VendorName__.GetValue();
                        Controls.ToggleVendorRelatedContractsView__.SetDisabled(disable);
                        context.viewFilter = filter;
                        Query.DBQuery(fillEmbeddedViewViewCallback, "CDNAME#" + "P2P - Contract", processFields, filter, sortOrder, maxContractsInView, context);
                    }
                }
                else {
                    hideViewControl(context);
                }
            }
        },
        historyContext: {
            ctrlView: Controls.HistoryView__,
            ctrlNoItem: Controls.HistoryViewNoItem__,
            ctrlPanel: Controls.HistoryViewPanel,
            ctrlButton: Controls.ToggleHistoryView__,
            viewName: "_AP_SAP_View_Vendor history - embedded",
            processName: Process.GetName(),
            buttonShowLabel: "_ShowHistoryView",
            buttonHideLabel: "_HideHistoryView",
            fillViewMethod: function (context) {
                updateVendorHistoryViewName(context);
                const selectedVendorNumber = Data.GetValue("VendorNumber__");
                const selectedVendorName = Data.GetValue("VendorName__");
                const selectedCompanyCode = Data.GetValue("CompanyCode__");
                let currentMsnEx = null;
                const processId = ProcessInstance.id;
                if (processId && processId.indexOf(".") >= 0) {
                    currentMsnEx = processId.split(".")[1];
                }
                if (selectedVendorName) {
                    Controls.HistoryViewPanel.SetLabel(Language.Translate("_HistoryViewPanelForVendorX", true, selectedVendorName));
                }
                else {
                    Controls.HistoryViewPanel.SetLabel(Language.Translate("_HistoryViewPanelDefault", true));
                }
                if (selectedVendorNumber && selectedCompanyCode) {
                    const MAX_INVOICE_IN_VIEW = 5;
                    const maxInvoicesInView = getMaxEntitiesInView(context.viewName, MAX_INVOICE_IN_VIEW);
                    const processFields = "MsnEx";
                    const sortOrder = "InvoiceDate__ DESC";
                    let filter = `&(VendorNumber__=${selectedVendorNumber})(InvoiceStatus__!=Received)(InvoiceStatus__!=To verify)(InvoiceStatus__!=Rejected)(State<=100)`;
                    if (currentMsnEx) {
                        filter += `(MsnEx!=${currentMsnEx})`;
                    }
                    filter = filter.AddCompanyCodeFilter(selectedCompanyCode);
                    filter = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.HistoryViewFilter", filter) || filter;
                    if (!context.viewFilter || context.viewFilter !== filter) {
                        context.viewFilter = filter;
                        Query.DBQuery(fillEmbeddedViewViewCallback, "CDNAME#" + Process.GetName(), processFields, filter, sortOrder, maxInvoicesInView, context);
                    }
                }
                else {
                    hideViewControl(context);
                }
            }
        },
        relatedInvoicesContext: {
            ctrlView: Controls.RelatedInvoicesView__,
            ctrlNoItem: Controls.RelatedInvoicesViewNoItem__,
            ctrlPanel: Controls.RelatedInvoicesViewPanel,
            ctrlButton: Controls.ToggleRelatedInvoicesView__,
            viewName: "_AP_View_Invoice related invoices - embedded",
            processName: Process.GetName(),
            buttonShowLabel: "_ShowRelatedInvoicesView",
            buttonHideLabel: "_HideRelatedInvoicesView",
            fillViewMethod: function (context) {
                const MAX_INVOICE_IN_VIEW = 20;
                const maxInvoicesInView = getMaxEntitiesInView(context.viewName, MAX_INVOICE_IN_VIEW);
                const processFields = "MsnEx";
                const sortOrder = "InvoiceDate__ DESC";
                const filter = `(RelatedInvoiceRuidEx__=${ProcessInstance.id})`;
                context.viewFilter = filter;
                Query.DBQuery(fillEmbeddedViewViewCallback, "CDNAME#" + Process.GetName(), processFields, filter, sortOrder, maxInvoicesInView, context);
            }
        }
    };
    function updateVendorHistoryViewName(context) {
        const viewName = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.EmbeddedViews.GetVendorHistoryEmbeddedViewName") || context.viewName;
        if (context.viewName !== viewName) {
            context.viewName = viewName;
            context.viewFilter = null;
            context.ctrlView.SetView("_My documents-AP-Embedded", viewName, context.processName);
        }
    }
    function getMaxEntitiesInView(viewName, standardMaxEntities) {
        const customMaxEntities = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.EmbeddedViews.GetMaxEntitiesInEmbeddedView", viewName);
        if (typeof customMaxEntities === "number" && customMaxEntities > 0) {
            return customMaxEntities;
        }
        return standardMaxEntities;
    }
    function hideEmbeddedViewPanel(context) {
        context.ctrlPanel.Hide(true);
        context.ctrlButton.SetText(context.buttonShowLabel);
        context.viewFilter = null;
        if (context.hideButtonMethod && context.hideButtonMethod()) {
            context.ctrlButton.Hide(true);
        }
        else {
            const disable = !Controls.VendorNumber__.GetValue() || !Controls.VendorName__.GetValue();
            context.ctrlButton.SetDisabled(disable);
        }
    }
    /**
     * Query.DBQuery callback
     * @this ViewContext
     * @param callbackResult
     */
    function fillEmbeddedViewViewCallback(callbackResult) {
        const filter = {};
        if (callbackResult) {
            const queryValue = callbackResult.GetQueryValue();
            if (queryValue.Records && queryValue.Records.length > 0) {
                if (queryValue.Records.length > 0) {
                    filter.MsnEx = [];
                }
                for (const record of queryValue.Records) {
                    filter.MsnEx.push(record[0]);
                }
            }
        }
        fillView(this, filter);
    }
    function displayViewControl(context, jsonViewFilter) {
        context.ctrlView.SetFilterParameters(jsonViewFilter);
        context.ctrlView.Hide(false);
        context.ctrlNoItem.Hide(true);
        context.ctrlView.Apply();
    }
    function hideViewControl(context) {
        context.ctrlView.SetFilterParameters({ MsnEx: "0" });
        context.ctrlView.Hide(true);
        context.ctrlNoItem.Hide(false);
        context.ctrlView.Apply();
    }
    function initAllViewControls() {
        Sys.Helpers.Object.ForEach(viewsContext, function (context) {
            context.ctrlView.SetView("_My documents-AP-Embedded", context.viewName, context.processName);
            context.ctrlView.CheckProfileTab(false);
        });
    }
    function fillView(context, filter) {
        if (filter && filter.MsnEx) {
            displayViewControl(context, filter);
        }
        else {
            hideViewControl(context);
        }
    }
    function OnClickToggleButton(contextName) {
        const context = viewsContext[contextName];
        if (context) {
            const paneVisible = context.ctrlPanel.IsVisible();
            context.ctrlPanel.Hide(paneVisible);
            if (!paneVisible) {
                context.ctrlButton.SetText(context.buttonHideLabel);
                context.fillViewMethod(context);
            }
            else {
                context.ctrlButton.SetText(context.buttonShowLabel);
            }
        }
    }
    EmbeddedViews.OnClickToggleButton = OnClickToggleButton;
    function InitAllEmbeddedViewPanels() {
        EmbeddedViews.HideAllEmbeddedViewPanels();
    }
    EmbeddedViews.InitAllEmbeddedViewPanels = InitAllEmbeddedViewPanels;
    function FillVisibleViews() {
        Sys.Helpers.Object.ForEach(viewsContext, function (context) {
            if (context.ctrlPanel.IsVisible()) {
                context.fillViewMethod(context);
            }
        });
    }
    EmbeddedViews.FillVisibleViews = FillVisibleViews;
    function SetDisabledAllButtons(disable) {
        Sys.Helpers.Object.ForEach(viewsContext, function (context) {
            context.ctrlButton.SetDisabled(disable);
        });
    }
    EmbeddedViews.SetDisabledAllButtons = SetDisabledAllButtons;
    function HideAllEmbeddedViewPanels() {
        Sys.Helpers.Object.ForEach(viewsContext, function (context) {
            hideEmbeddedViewPanel(context);
        });
    }
    EmbeddedViews.HideAllEmbeddedViewPanels = HideAllEmbeddedViewPanels;
    initAllViewControls();
})(EmbeddedViews || (EmbeddedViews = {}));
/**
 * Handle all events and functionality for the Holds pane
 */
var Holds;
(function (Holds) {
    /**
     * Only display the pane and the table if active holds exists
     */
    function manageVisibility() {
        Controls.ActiveHoldsCount__.Hide(true);
        Controls.LastHoldReleaseDate__.Hide(true);
        const count = Data.GetValue("ActiveHoldsCount__");
        Controls.HoldsPane.Hide(!count || count <= 0);
    }
    Holds.manageVisibility = manageVisibility;
})(Holds || (Holds = {}));
/**
 * Handle all events and functionality for the bank details button and panel
 */
var BankDetails;
(function (BankDetails) {
    function getControlFieldName(propertyName) {
        // Standard fields (Country, Key, Name, etc.) are prefixed with BankDetails_
        const standardFieldName = `BankDetails_${propertyName}__`;
        if (Controls.BankDetails__[standardFieldName]) {
            return standardFieldName;
        }
        // Custom Z_ fields: handle both "Z_Field" and "Z_Field__" formats from user exit
        if (propertyName.startsWith("Z_")) {
            const customFieldName = propertyName.endsWith("__") ? propertyName : `${propertyName}__`;
            if (Controls.BankDetails__[customFieldName]) {
                return customFieldName;
            }
        }
        return null;
    }
    function copyAccountFieldsToItem(item, account) {
        for (const propertyName in account) {
            if (!Object.prototype.hasOwnProperty.call(account, propertyName)) {
                continue;
            }
            const fieldName = getControlFieldName(propertyName);
            if (fieldName) {
                item.SetValue(fieldName, account[propertyName]);
            }
        }
    }
    function fillBankDetailsItems(bankAccountsArray, erpManager) {
        Controls.BankDetails__.SetItemCount(bankAccountsArray.length);
        const isBankDetailsSelectionDisabled = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BankDetails.DisableBankDetailsSelection") || erpManager.IsBankDetailsSelectionDisabled();
        Controls.BankDetails__.BankDetails_Select__.Hide(isBankDetailsSelectionDisabled);
        for (let i = 0; i < bankAccountsArray.length; i++) {
            const item = Controls.BankDetails__.GetItem(i);
            const account = bankAccountsArray[i];
            copyAccountFieldsToItem(item, account);
            if (erpManager.IsBankDetailsItemSelected(item)) {
                item.SetValue("BankDetails_Select__", true);
            }
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.UseCustomAttributesToSelectDefaultBankDetails", item, account);
        }
    }
    /**
     * Fill the BankDetails__ table with the associated bank accounts
     * @param {Object[]} account array of bank account informations
     * @param {string} account.Country Country of the bank
     * @param {string} account.Name Name of the bank
     * @param {string} account.Account Account number
     * @param {string} account.Holder Name of the holder of the account
     * @param {string} account.IBAN IBAN
     */
    function fillTableWithResults(bankAccountsArray, params) {
        const isSilentChange = params === null || params === void 0 ? void 0 : params.isSilentChange;
        if (isSilentChange) {
            ProcessInstance.SetSilentChange(true);
        }
        Controls.BankDetails__.SetItemCount(0);
        if (bankAccountsArray) {
            const erpManager = Lib.AP.GetInvoiceDocument();
            fillBankDetailsItems(bankAccountsArray, erpManager);
        }
        displayTableOrNoItem(false);
        if (isSilentChange) {
            ProcessInstance.SetSilentChange(false);
        }
    }
    function displayTableOrNoItem(queryInProgress) {
        const accountsExists = Controls.BankDetails__.GetItemCount() > 0;
        if (queryInProgress) {
            Controls.ComputingBankDetailsWaiting__.Hide(false);
            Controls.Spacer_line__.Hide(true);
            Controls.BankDetailsNoItem__.Hide(true);
            Controls.BankDetails__.Hide(true);
        }
        else {
            Controls.ComputingBankDetailsWaiting__.Hide(true);
            Controls.Spacer_line__.Hide(accountsExists);
            Controls.BankDetailsNoItem__.Hide(accountsExists);
            Controls.BankDetails__.Hide(!accountsExists);
        }
    }
    function hideAll() {
        Controls.ShowBankDetails__.Hide(true);
        BankDetails.hide();
    }
    BankDetails.hideAll = hideAll;
    function hide() {
        Controls.BankDetailsPane.Hide(true);
        Controls.ComputingBankDetailsWaiting__.Hide(true);
        Controls.ShowBankDetails__.SetText("_ShowBankDetails");
        Controls.BankDetailsPane.SetLabel(Language.Translate("_BankDetailsPane", true));
        Controls.ShowBankDetails__.SetDisabled(!Controls.VendorNumber__.GetValue() || !Controls.VendorName__.GetValue());
        displayTableOrNoItem(false);
    }
    BankDetails.hide = hide;
    function show() {
        Controls.ShowBankDetails__.SetText("_HideBankDetails");
        Controls.BankDetailsPane.Hide(false);
        displayTableOrNoItem(false);
    }
    BankDetails.show = show;
    function getBankDetails(erpManager, isSilentChange) {
        displayTableOrNoItem(true);
        Controls.ShowBankDetails__.SetDisabled(!Controls.VendorNumber__.GetValue() || !Controls.VendorName__.GetValue());
        const vendorName = Data.GetValue("VendorName__");
        if (vendorName) {
            Controls.BankDetailsPane.SetLabel(Language.Translate("_BankDetailsPaneForVendorX", true, vendorName));
        }
        else {
            Controls.BankDetailsPane.SetLabel(Language.Translate("_BankDetailsPane", true));
        }
        const parameters = {
            companyCode: Data.GetValue("CompanyCode__"),
            vendorNumber: Data.GetValue("VendorNumber__"),
            isSilentChange: isSilentChange
        };
        const getBankDetailsCallback = (bankAccountsArray, resultParams) => {
            const handled = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnVendorBankDetailsFetched", bankAccountsArray, parameters, erpManager, (filteredAccounts) => {
                fillTableWithResults(filteredAccounts, resultParams);
            });
            if (!handled) {
                fillTableWithResults(bankAccountsArray, resultParams);
            }
        };
        erpManager.GetVendorBankDetails(parameters, getBankDetailsCallback);
    }
    BankDetails.getBankDetails = getBankDetails;
    function onClick() {
        if (Controls.BankDetailsPane.IsVisible()) {
            BankDetails.hide();
        }
        else {
            BankDetails.show();
            BankDetails.getBankDetails(Lib.AP.GetInvoiceDocument());
        }
    }
    BankDetails.onClick = onClick;
    /**
     * event when Bank details selection changes
     * @this CheckBox in Bank Detail
     */
    function onCheckBankDetails() {
        const row = this.GetRow();
        const backupSelectValue = row.BankDetails_Select__.GetValue();
        const erpManager = Lib.AP.GetInvoiceDocument();
        // store the selected banktype
        erpManager.StoreSelectedBankDetails(row);
        // reset all checkboxes
        for (let i = 0; i < Data.GetTable("BankDetails__").GetItemCount(); i++) {
            Data.GetTable("BankDetails__").GetItem(i).SetValue("BankDetails_Select__", false);
        }
        // ensure current line is checked
        row.BankDetails_Select__.SetValue(backupSelectValue);
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BankDetails.OnBankDetailSelectionChanged", {
            isSelected: backupSelectValue === true,
            row: row
        });
    }
    BankDetails.onCheckBankDetails = onCheckBankDetails;
    function onRefreshRow(index) {
        const erpManager = Lib.AP.GetInvoiceDocument();
        const isBankDetailsSelectionDisabled = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BankDetails.DisableBankDetailsSelection") || erpManager.IsBankDetailsSelectionDisabled();
        if (!isBankDetailsSelectionDisabled) {
            const row = Controls.BankDetails__.GetRow(index);
            if (row) {
                row.BankDetails_Select__.SetValue(false);
                if (!erpManager.IsBankDetailsRowSelectable(row)) {
                    row.BankDetails_Select__.SetReadOnly(true);
                }
                else {
                    row.BankDetails_Select__.SetReadOnly(false);
                    if (erpManager.IsBankDetailsItemSelected(row.GetItem())) {
                        row.BankDetails_Select__.SetValue(true);
                    }
                }
            }
        }
    }
    BankDetails.onRefreshRow = onRefreshRow;
})(BankDetails || (BankDetails = {}));
/** ***************** **/
/** SPECIFIC HANDLERS **/
/** ***************** **/
/**
 * @class Help to manage PO invoice line item
 */
const POLineItemHelper = {
    // Determine the behavior of line item check when posting
    // Possible values are:
    //		idx =- 1, check if there is an empty line item (quantity or amount) and popup a confirmation message to ignore them in post
    //		idx >= 0, check has been performed and an empty line item has been found (the value is the one of its index)
    idx: -1,
    ShouldCheck: function () {
        return this.idx === -1;
    },
    HasEmptyLine: function () {
        return this.idx >= 0;
    },
    SetEmptyLine: function (idx) {
        this.idx = idx;
    },
    Clear: function () {
        this.idx = -1;
    }
};
/**
 *@class Help to manage ERP communication and display in a FlexibleForm
 */
const ERP = {
    IsPostOk: function () {
        // Close or go to the next document
        if (!ProcessInstance.Next("next")) {
            ProcessInstance.Quit("quit");
        }
    },
    ShowERPPopup: function () {
        this.ShowPostERPPopup();
        this.ShowUnblockPaymentPopup();
        this.ShowMissingERPInvoiceNumberPopup();
        this.ShowERPTimeoutPopup();
        this.ShowSnackbarAfterRestoreAction();
    },
    ShowManualUnblockPaymentConfirmation: function () {
        Popup.Dialog("_Confirmation", null, function (dialog) {
            dialog.HideDefaultButtons();
            if (Lib.ERP.IsCustomERP(Data.GetValue("ERP__"))) {
                dialog.AddDescription("ConfirmationMessage").SetText("_Manually unblock in custom ERP confirmation");
                dialog.AddDescription("ConfirmationMessage2").SetText("_Manually unblock in custom ERP confirmation line 2");
            }
            else {
                dialog.AddDescription("ConfirmationMessage").SetText("_Manually unblock in SAP confirmation");
                dialog.AddDescription("ConfirmationMessage2").SetText("_Manually unblock in SAP confirmation line 2");
            }
            dialog.AddButton("ConfirmButton", "_Confirm button");
            dialog.AddButton("CancelButton", "_Cancel");
        }, null, null, function (dialog, tabId, event, control) {
            if (event === "OnClick") {
                if (control.GetName() === "ConfirmButton") {
                    ButtonsBehavior.approve("ManualUnblockPayment");
                }
                dialog.Cancel();
            }
        });
    },
    ShowUnblockPaymentPopup: function () {
        const fillCB = function (dialog) {
            const ERPErrors = Data.GetError("ERPInvoiceNumber__");
            if (Lib.ERP.IsCustomERP(Data.GetValue("ERP__"))) {
                dialog.AddDescription("Description").SetText("_CustomERP Unblock payment failed with the following reason:");
            }
            else {
                dialog.AddDescription("Description").SetText("_ERP Unblock payment failed with the following reason:");
            }
            dialog.AddDescription("ErrorDetails").SetText(ERPErrors);
            if (!ProcessInstance.isReadOnly) {
                dialog.AddDescription("Tip").SetText("_ERPUnblockPaymentButtonsDescription");
                dialog.HideDefaultButtons();
                dialog.AddButton("RetryButton", "_Retry payment unblock");
                if (Lib.ERP.IsCustomERP(Data.GetValue("ERP__"))) {
                    dialog.AddButton("ManuallyDoneButton", "_CustomERP manually done");
                }
                else {
                    dialog.AddButton("ManuallyDoneButton", "_Manually done");
                }
            }
        };
        const handleCB = function (dialog, tabId, event, control) {
            if (tabId === null && event === "OnClick") {
                dialog.Cancel();
                switch (control.GetName()) {
                    case "RetryButton":
                        ButtonsBehavior.approve("RetryUnblockPayment", true);
                        break;
                    case "ManuallyDoneButton":
                        ERP.ShowManualUnblockPaymentConfirmation();
                        break;
                    default:
                        break;
                }
            }
        };
        const isBlockedAndToPay = Data.GetValue("ERPPaymentBlocked__") && Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToPay;
        const isCustomERPWithError = Lib.ERP.IsCustomERP(Data.GetValue("ERP__")) &&
            Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToApprove &&
            Data.GetError("ERPInvoiceNumber__");
        if (isBlockedAndToPay || isCustomERPWithError) {
            Popup.Dialog("_Unblock payment warning", null, fillCB, null, null, handleCB);
        }
    },
    ShowPostERPPopup: function () {
        if (Data.GetActionName() !== "Post" || Lib.AP.IsInArchivingMode()) {
            return;
        }
        const ERPPostErrors = Data.GetError("ERPInvoiceNumber__");
        const ERPInvoiceNumber = Data.GetValue("ERPInvoiceNumber__");
        if (ERPPostErrors) {
            Popup.Alert(ERPPostErrors, true, null, "_SAP Posting errors");
        }
        else if (ERPInvoiceNumber) {
            Popup.Alert(`${Language.Translate("_SAP Posting ok")}\r\n\r\n${Language.Translate("_SAP Invoice number")} : ${ERPInvoiceNumber}`, false, this.IsPostOk, "_SAP Post successful");
        }
    },
    ShowGenericManualERPInvoiceNumberPopup: function () {
        const fillERPInvoiceNumberManually = function (dialog) {
            dialog.AddDescription("Description").SetText(Language.Translate("_ManualERPInvoiceNumberPopupDescription"));
            if (!ProcessInstance.isReadOnly) {
                dialog.AddText("ManualERPInvoiceNumber", "_ManualERPInvoiceNumber");
                dialog.HideDefaultButtons();
                dialog.AddButton("ValidateERPInvoiceNumber", "_ValidateAndPost");
                dialog.AddButton("Cancel", "_Cancel");
            }
        };
        const handleERPInvoiceNumberManually = function (dialog, tabId, event, control) {
            if (tabId === null && event === "OnClick") {
                dialog.Cancel();
                if (control.GetName() === "ValidateERPInvoiceNumber") {
                    Variable.SetValueAsString("ERPIntegrationTimeout", "");
                    Data.SetValue("ERPInvoiceNumber__", dialog.GetControl("ManualERPInvoiceNumber").GetText());
                    onERPInvoiceNumberChange();
                    ButtonsBehavior.validateAndApprove(!isInApprovalWorkflow());
                }
            }
        };
        Popup.Dialog("_FillERPInvoiceNumber", null, fillERPInvoiceNumberManually, null, null, handleERPInvoiceNumberManually);
    },
    ShowSnackbarAfterRestoreAction: function () {
        if (Variable.GetValueAsString("onRestorePOAfterTimeoutEnd") === "true") {
            Popup.Snackbar({
                message: Language.Translate("_RestoreActionEnd"),
                status: "success"
            });
            Variable.SetValueAsString("onRestorePOAfterTimeoutEnd", "");
        }
    },
    ShowERPTimeoutPopup: function () {
        if (Variable.GetValueAsString("ERPIntegrationTimeout") === null
            || Variable.GetValueAsString("ERPIntegrationTimeout") === ""
            || !Lib.AP.ShouldUpdateTables()) {
            return;
        }
        const fillERPTimeoutPopup = function (dialog) {
            dialog.AddDescription("Description").SetText(Language.Translate("_ERPAckTimeoutPopupDescription"));
            const table = dialog.AddTable("InvoiceData", null, 550);
            table.AddTextColumn("CompanyCode", "_Company code", 60);
            table.AddTextColumn("SupplierNumber", "_Vendor number", 80);
            table.AddTextColumn("SupplierName", "_Vendor name", 140);
            table.AddTextColumn("InvoiceNumber", "_Invoice number", 90);
            table.AddDateColumn("InvoiceDate", "_Invoice date", 90);
            table.AddDecimalColumn("InvoiceAmount", "_Amount", 90);
            table.SetReadOnly(true);
            table.SetRowToolsHidden(true);
            table.HideTopNavigation(true);
            table.HideBottomNavigation(true);
            table.SetItemCount(1);
            let currentInvoice = table.GetItem(0);
            currentInvoice.SetValue("CompanyCode", Data.GetValue("CompanyCode__"));
            currentInvoice.SetValue("SupplierNumber", Data.GetValue("VendorNumber__"));
            currentInvoice.SetValue("SupplierName", Data.GetValue("VendorName__"));
            currentInvoice.SetValue("InvoiceNumber", Data.GetValue("InvoiceNumber__"));
            currentInvoice.SetValue("InvoiceDate", Data.GetValue("InvoiceDate__"));
            currentInvoice.SetValue("InvoiceAmount", Data.GetValue("InvoiceAmount__"));
            if (!ProcessInstance.isReadOnly) {
                dialog.HideDefaultButtons();
                dialog.AddButton("RestoreButton", "_RestorePostImpacts");
                dialog.AddButton("ManualLinkButton", "_LinkToERP");
            }
        };
        const handleERPTimeoutPopup = function (dialog, tabId, event, control) {
            if (tabId === null && event === "OnClick") {
                dialog.Cancel();
                switch (control.GetName()) {
                    case "RestoreButton":
                        Data.SetError("ERPInvoiceNumber__", "");
                        Data.SetValue("ERPPostingError__", "");
                        ProcessInstance.Approve("onRestorePOAfterTimeout");
                        break;
                    case "ManualLinkButton":
                        ERP.ShowGenericManualERPInvoiceNumberPopup();
                        break;
                    default:
                        break;
                }
            }
        };
        Popup.Dialog("_ERPAckTimeoutPopupTitle", null, fillERPTimeoutPopup, null, null, handleERPTimeoutPopup);
    },
    /**
     * This function checks if the simulation result should be displayed
     */
    ShouldDisplaySimulationPopup: function () {
        return Variable.GetValueAsString("Simulation_Report") &&
            !ProcessInstance.isReadOnly &&
            Data.GetActionName() === "Simulate";
    },
    DisplaySimulationResult: function () {
        if (this.ShouldDisplaySimulationPopup()) {
            Controls.SAP_Simulation_Result__.SetHTML(Variable.GetValueAsString("Simulation_Report"));
            Popup.Dialog("_Simulation results", null, this.FillSimulationPopup);
        }
    },
    FillSimulationPopup: function (dialog) {
        const htmlControl = dialog.AddHTML("HTML_POPUP", "", "0");
        htmlControl.SetCSS(Controls.SAP_Simulation_Result__.GetCSS());
        htmlControl.SetHTML(Controls.SAP_Simulation_Result__.GetHTML());
    },
    ShowMissingERPInvoiceNumberPopup: function () {
        const fillERPInvoiceNumber = function (dialog) {
            dialog.AddDescription("Description").SetText(Language.Translate("_ErrorGettingERPInvoiceNumber", true, Data.GetValue("ERPMMInvoiceNumber__")));
            if (!ProcessInstance.isReadOnly) {
                dialog.AddDescription("Tip").SetText("_ERPUnblockPaymentButtonsDescription");
                dialog.HideDefaultButtons();
                dialog.AddButton("RetryPostButton", "_RetryERPInvoiceNumber");
                dialog.AddButton("ManualERPInvoiceNumberButton", "_FillERPInvoiceNumberManually");
            }
        };
        const handleERPInvoiceNumber = function (dialog, tabId, event, control) {
            if (tabId === null && event === "OnClick") {
                dialog.Cancel();
                switch (control.GetName()) {
                    case "RetryPostButton":
                        Controls.Post.OnClick();
                        break;
                    case "ManualERPInvoiceNumberButton":
                        ERP.ShowSAPManualERPInvoiceNumberPopup();
                        break;
                    default:
                        break;
                }
            }
        };
        if (!Data.IsNullOrEmpty("ERPMMInvoiceNumber__") && Data.IsNullOrEmpty("ERPInvoiceNumber__")) {
            Popup.Dialog("_MissingERPInvoiceNumber", null, fillERPInvoiceNumber, null, null, handleERPInvoiceNumber);
        }
    },
    ShowSAPManualERPInvoiceNumberPopup: function () {
        const fillERPInvoiceNumberManually = function (dialog) {
            dialog.AddDescription("Description").SetText(Language.Translate("_ERPInvoiceNumberManuallyFilled", true, Data.GetValue("ERPMMInvoiceNumber__")));
            if (!ProcessInstance.isReadOnly) {
                dialog.AddText("ManualERPInvoiceNumber", "_FIInvoiceNumber");
                dialog.HideDefaultButtons();
                dialog.AddButton("ValidateERPInvoiceNumber", "_ValidateAndPost");
                dialog.AddButton("Cancel", "_Cancel");
            }
        };
        const handleERPInvoiceNumberManually = function (dialog, tabId, event, control) {
            if (tabId === null && event === "OnClick") {
                dialog.Cancel();
                if (control.GetName() === "ValidateERPInvoiceNumber") {
                    Data.SetValue("ERPInvoiceNumber__", dialog.GetControl("ManualERPInvoiceNumber").GetText());
                    Controls.Post.OnClick();
                }
                else {
                    ERP.ShowMissingERPInvoiceNumberPopup();
                }
            }
        };
        Popup.Dialog("_FillERPInvoiceNumber", null, fillERPInvoiceNumberManually, null, null, handleERPInvoiceNumberManually);
    }
};
/**
 * @class Help to manage DuplicateCheck display in a FlexibleForm
 */
const DuplicateCheck = {
    /**
     * Contains the result of the server side duplicate check
     */
    Result: null,
    ActionPost: false,
    /**
     * Create the table that will contains all the duplicate invoices
     * @param {object} dialog The Dialog object in which the table will be display
     * @param {string} tableName The expected name of the table to create
     * @return {Table} The created table
     */
    CreateResultTable: function (dialog, tableName) {
        const table = dialog.AddTable(tableName, null, 250);
        table.AddTextColumn("InvoiceNumber", "_Invoice number", 90);
        table.AddDecimalColumn("InvoiceAmount", "_Amount", 80);
        table.AddDateColumn("InvoiceDate", "_Date", 80);
        table.AddTextColumn("InvoiceStatus", "_Invoice status", 120);
        table.AddTextColumn("OwnerLogin", "_Owner", 300);
        const link = table.AddLinkColumn("View", " ", 50);
        link.SetText("_View");
        link.SetURL("");
        table.SetReadOnly(true);
        table.SetRowToolsHidden(true);
        return table;
    },
    /**
     * Help to fill a line item from a duplicate invoice
     * @param {TableItem} item The line item to fill
     * @param {DuplicateItem} duplicate A duplicateItem which contains the requested informations
     */
    FillResultItem: function (item, duplicate) {
        item.SetValue("InvoiceNumber", duplicate.controlsToCheck.InvoiceNumber__);
        item.SetValue("InvoiceAmount", duplicate.controlsToCheck.InvoiceAmount__);
        item.SetValue("InvoiceDate", duplicate.controlsToCheck.InvoiceDate__);
        item.SetValue("InvoiceStatus", Language.Translate(duplicate.additionalAttributes.InvoiceStatus__));
        item.SetValue("OwnerLogin", duplicate.additionalAttributes.OwnerLogin);
    },
    /**
     * This function fill the duplicate check popup
     * @param {object} dialog The Dialog object to fill
     */
    FillAlertDuplicateDialog: function (dialog) {
        dialog.SetHelpId(2521);
        const duplicateWarning = dialog.AddTitle("duplicateLabel1", "");
        duplicateWarning.SetText(Language.Translate("_Risk of duplicates with the following invoice(s)"));
        const tableCurrentInvoice = DuplicateCheck.CreateResultTable(dialog, "duplicateTable");
        tableCurrentInvoice.SetItemCount(DuplicateCheck.Result.length);
        for (let i = 0; i < DuplicateCheck.Result.length; i++) {
            const duplicate = DuplicateCheck.Result[i];
            DuplicateCheck.FillResultItem(tableCurrentInvoice.GetItem(i), duplicate);
        }
        const actionName = Data.GetActionName();
        const actionIsEligible = actionName && actionName !== "Resubmit" && actionName !== "Reprocess" && actionName !== "Save" && actionName !== "Request_teaching";
        if (DuplicateCheck.ActionPost || actionIsEligible) {
            dialog.HideDefaultButtons();
            dialog.AddButton("backToInvoice", "_Back to the invoice");
            const ignoreButton = dialog.AddButton("ignoreDuplicate", Language.Translate("_Confirm duplicate {0}", false, Language.Translate(Controls.Post.GetLabel())));
            ignoreButton.SetWarningStyle();
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.DuplicateCheck.OnFillAlertDuplicateDialog", dialog, DuplicateCheck.Result);
        Controls.Post.Wait(false);
    },
    /**
     * This function handle all events from the popup
     * @param {object} dialog The Dialog from which event are raised
     * @param {integer} tabId The index of the tab from which event are raised
     * @param {string} event The event name raised
     * @param {object} control The control which raised the event
     */
    HandleAlertDuplicateDialog: function (dialog, tabId, event, control) {
        if (control.GetType() === "Button" && event === "OnClick") {
            dialog.Cancel();
            if (control.GetName() === "ignoreDuplicate") {
                Variable.SetValueAsString("DuplicateCheckResult", "");
                Variable.SetValueAsString("DoNotCheckDuplicates", "1");
                //!FT-028528
                ButtonsBehavior.approve("PostAfterDuplicateCheckIgnored");
            }
        }
        else if (control.GetType() === "Link" && event === "OnClick") {
            const lineNumber = control.GetRow().GetLineNumber() - 1;
            if (lineNumber < DuplicateCheck.Result.length) {
                control.SetURL(`FlexibleForm.aspx?action=run&layout=_flexibleform&ReadOnly=1&Id=${DuplicateCheck.Result[lineNumber].RUIDEX.replace(/#/g, "%23")}&OnQuit=Close`);
            }
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.DuplicateCheck.OnHandleAlertDuplicateDialog", dialog, tabId, event, control);
    },
    /**
     * This function checks if the duplicate popup is supposed to be shown
     */
    ShouldPopup: function (checkAction) {
        var _a;
        let shouldPopup = Variable.GetValueAsString("DoNotCheckDuplicates") !== "1" && !ProcessInstance.isReadOnly && currentStepIsApStart() && !Controls.ERPPostingDate__.GetValue();
        if (shouldPopup && checkAction) {
            const currentAction = Data.GetActionName();
            if (currentAction) {
                shouldPopup = currentAction === "Reprocess" || currentAction === "Post";
            }
            else {
                shouldPopup = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizeDuplicateCheckPopupDisplayConditions")) !== null && _a !== void 0 ? _a : Data.GetValue("InvoiceStatus__") !== Lib.AP.InvoiceStatus.SetAside;
            }
        }
        return shouldPopup;
    },
    /**
     * This function check if duplicate invoices exist and decided to display or not the popup
     */
    DoCheck: function (checkAction) {
        if (this.ShouldPopup(checkAction)) {
            // Retrieve duplicates array from external var
            const duplicateCheckResults = Variable.GetValueAsString("DuplicateCheckResult");
            const duplicateResult = duplicateCheckResults ? JSON.parse(duplicateCheckResults) : null;
            if (duplicateResult && duplicateResult.length > 0) {
                this.Result = duplicateResult;
                Popup.Dialog("_Duplicate detected", null, this.FillAlertDuplicateDialog, null, null, this.HandleAlertDuplicateDialog, null);
                return false;
            }
        }
        return true;
    },
    /** Check if any duplicate invoices exist
     * Fill the variable DuplicateCheckResult with all the duplicates found
     * @return true if no duplicate, false if at least one duplicate found
     */
    DuplicateCheck: function (callBackDuplicate) {
        // Disable DuplicateCheck if invoice was already posted
        if (Data.GetValue("ERPPostingDate__")) {
            Log.Info("No duplicate check after posting invoice");
            return;
        }
        const duplicateKeyControls = ["CompanyCode__", "VendorNumber__"];
        const controlsToCheck = ["InvoiceNumber__", "InvoiceDate__", "InvoiceAmount__"];
        const queryOptions = {
            // 16 months to cover a fiscal year
            MaxDateRangeInDays: 480,
            DateRangeFieldName: "InvoiceDate__",
            SortOnControlName: "InvoiceDate__",
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
        Lib.DuplicateCheck.CheckDuplicate(duplicateKeyControls, controlsToCheck, queryOptions, parseInt(Data.GetValue("DuplicateCheckAlertLevel__"), 10), callBackDuplicate);
    },
    /**
     * Check duplicate if needed
     * Call the approveCallBack if duplicate check does not return duplicates or if user validates duplicates
     */
    DoDuplicateCheck: function (approveCallBack) {
        //If we have to do the duplicate check
        this.ActionPost = true;
        if (DuplicateCheck.ShouldPopup(false)) {
            const duplicateCheckCallBack = function (duplicates) {
                if (duplicates && duplicates.length > 0) {
                    for (const duplicateItem of duplicates) {
                        let login = duplicateItem.additionalAttributes.OwnerId;
                        login = login.substring(login.indexOf("cn=") + 3, login.indexOf(","));
                        duplicateItem.additionalAttributes.OwnerLogin = login;
                    }
                    Variable.SetValueAsString("DuplicateCheckResult", JSON.stringify(duplicates));
                }
                else {
                    Variable.SetValueAsString("DuplicateCheckResult", "");
                }
                Controls.Post.Wait(false);
                if (DuplicateCheck.DoCheck(false)) {
                    approveCallBack();
                }
            };
            DuplicateCheck.DuplicateCheck(duplicateCheckCallBack);
        }
        else {
            approveCallBack();
        }
    }
};
/**
 * Help to manage TaxCode Browse page
 */
const TaxCodeHelper = {
    showSnackBar: false,
    cachedValues: [],
    onBrowse: null, // Don't store it immediately to allow override before init
    getMultipleTaxesSeparator: function () {
        return Lib.AP.TaxHelper.getMultipleTaxesSeparator();
    },
    resetCache: function () {
        TaxCodeHelper.cachedValues = [];
        Controls.LineItems__.TaxCode__.SetMultiSelectionMode(Lib.AP.TaxHelper.useMultipleTaxes());
    },
    init: function () {
        // Store the OnBrowse AFTER ERP connector has set it up
        TaxCodeHelper.onBrowse = Controls.LineItems__.TaxCode__.OnBrowse;
        Controls.LineItems__.TaxCode__.SetMultiSelectionMode(Lib.AP.TaxHelper.useMultipleTaxes());
        Controls.LineItems__.TaxCode__.OnEnter = Controls.LineItems__.TaxCode__.OnFocus = function () {
            TaxCodeHelper.showSnackBar = false;
            TaxCodeHelper.resetCache();
        };
        Controls.LineItems__.TaxCode__.OnBrowse = function (...args) {
            TaxCodeHelper.showSnackBar = true;
            TaxCodeHelper.resetCache();
            TaxCodeHelper.onBrowse.apply(this, args);
        };
        Controls.LineItems__.TaxCode__.OnSelectItem = function (item) {
            const useMultipleTaxes = Lib.AP.TaxHelper.useMultipleTaxes();
            let value = item.GetValue("TaxCode__");
            // as the tax code is automatically set by the framework
            // we only have to consider the multiple taxes case to override the value
            if (useMultipleTaxes) {
                let newCodeAdded = false;
                if (TaxCodeHelper.cachedValues.indexOf(value) === -1) {
                    TaxCodeHelper.cachedValues.push(value);
                    newCodeAdded = true;
                }
                else if (TaxCodeHelper.showSnackBar) {
                    // duplicate
                    Popup.Snackbar({
                        message: Language.Translate("_Tax code already added", true, value),
                        status: "info"
                    });
                }
                value = TaxCodeHelper.cachedValues.join(TaxCodeHelper.getMultipleTaxesSeparator());
                this.SetValue(value);
                if (newCodeAdded && TaxCodeHelper.showSnackBar) {
                    Popup.Snackbar({
                        message: Language.Translate("_Tax code updated", true, value),
                        status: "success"
                    });
                }
            }
        };
    }
};
const ERPNumberDialogHelper = {
    ShouldPopup: function () {
        return (Lib.AP.ShouldArchiveIntercompanyInvoice() || Lib.AP.ShouldArchiveDownpaymentInvoice()) &&
            Data.IsNullOrEmpty("ERPInvoiceNumber__");
    },
    DisplayPopup: function (titleSuffix) {
        const title = `_FillInvoiceNumber${titleSuffix}`;
        const fillERPInvoiceNumberManually = function (dialog) {
            dialog.AddDescription("Description").SetText("_ERPInvoiceNumberManuallyFilledDialogDescription");
            if (!ProcessInstance.isReadOnly) {
                const erpNumberCtrl = dialog.AddText("ManualERPInvoiceNumber", "_ManualERPInvoiceNumber");
                dialog.RequireControl(erpNumberCtrl, true);
                dialog.HideDefaultButtons();
                dialog.AddButton("ValidateERPInvoiceNumber", "_ValidateAndPost");
                dialog.AddButton("Cancel", "_Cancel");
            }
        };
        const validateERPInvoiceNumberManually = function (dialog) {
            const erpInvoiceNumberCtrl = dialog.GetControl("ManualERPInvoiceNumber");
            const erpInvoiceNumber = erpInvoiceNumberCtrl.GetValue();
            if (Sys.Helpers.IsEmpty(erpInvoiceNumber)) {
                erpInvoiceNumberCtrl.SetError("This field is required!");
                return false;
            }
            return true;
        };
        const handleERPInvoiceNumberManually = function (dialog, tabId, event, control) {
            if (tabId === null && event === "OnClick") {
                if (control.GetName() === "Cancel" || (control.GetName() === "ValidateERPInvoiceNumber" && validateERPInvoiceNumberManually(dialog))) {
                    dialog.Cancel();
                    if (control.GetName() === "ValidateERPInvoiceNumber") {
                        Data.SetValue("ERPInvoiceNumber__", dialog.GetControl("ManualERPInvoiceNumber").GetValue());
                        ButtonsBehavior.validateAndApprove(!isInApprovalWorkflow());
                    }
                }
            }
        };
        Popup.Dialog(title, null, fillERPInvoiceNumberManually, null, null, handleERPInvoiceNumberManually);
    }
};
/** Approvers **/
function currentStepIsApStart() {
    return Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart;
}
function currentStepIsController() {
    return Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.controller;
}
function currentStepIsApprover() {
    return Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.approver;
}
function reviewersCanModifyLineItems() {
    const customReviewerCanMdofyLineItems = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizeReviewerCanModifyLineItems");
    return (g_apParameters.GetParameter("WorkflowReviewersCanAddLineItems") === "1" && Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) || customReviewerCanMdofyLineItems;
}
function currentStepCanModifyLineItems() {
    const controllerCanModify = currentStepIsController() && reviewersCanModifyLineItems();
    return currentStepIsApStart() || controllerCanModify;
}
function addApprover() {
    let insertApproverDialog = null;
    const currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
    if (currentRole === Lib.AP.WorkflowCtrl.roles.controller) {
        Popup.Dialog("_Add controller", null, fillInsertApproverDialog, commitInsertApproverDialog, null, handleInsertApproverDialog);
    }
    else {
        Popup.Dialog("_Add approver", null, fillInsertApproverDialog, commitInsertApproverDialog, null, handleInsertApproverDialog);
    }
    function fillInsertApproverDialog(dialog) {
        insertApproverDialog = dialog;
        let approverCtrl;
        if (currentRole === Lib.AP.WorkflowCtrl.roles.controller) {
            approverCtrl = dialog.AddText("approver", "_Controller");
        }
        else {
            approverCtrl = dialog.AddText("approver", "_Approver");
        }
        approverCtrl.SetWidth(252);
        approverCtrl.SetReadOnly(true);
        approverCtrl.SetBrowsable(true);
        dialog.RequireControl(approverCtrl);
        const commentCtrl = dialog.AddMultilineText("comment", "_Comment", 252);
        commentCtrl.SetValue(getReliableComment());
        dialog.AddDescription("msg");
        // Pop browse page for approvers automatically
        dialog.Hold(true);
        if (g_selectedAddApprover) {
            fillConfirmation(g_selectedAddApprover);
        }
        else {
            browseApprovers(currentRole).Then(fillConfirmation);
        }
    }
    function handleInsertApproverDialog(dialog, tabId, event, control) {
        if (event === "OnBrowse" && control.GetName() === "approver") {
            browseApprovers(currentRole).Then(fillConfirmation);
        }
    }
    function fillConfirmation(approver) {
        if (approver) {
            g_selectedAddApprover = approver;
            insertApproverDialog.Hold(false);
            insertApproverDialog.GetControl("approver").SetValue(approver.displayName);
            insertApproverDialog.GetControl("msg").SetText("_Add approver confirm message", approver.displayName);
        }
        else {
            // If no approver has been selected, close the popup
            insertApproverDialog.Cancel();
        }
    }
    function commitInsertApproverDialog() {
        //Update comment
        Controls.Comment__.SetValue(insertApproverDialog.GetControl("comment").GetValue());
        //Insert approver in control and forward
        if (!g_bApproverAdded) {
            Lib.AP.WorkflowCtrl.AddContributorAt(Lib.AP.WorkflowCtrl.GetCurrentStep(), g_selectedAddApprover, currentRole);
        }
        g_bApproverAdded = true;
        ButtonsBehavior.approve("AddApprover");
    }
}
function browseApprovers(role) {
    const title = role === Lib.AP.WorkflowCtrl.roles.controller ? "_Controller Information" : "_Approver Information";
    const additionalFilterArray = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.GetContributorsExtraFilter", role) || [];
    additionalFilterArray.push("CUSTOMER=0");
    additionalFilterArray.push("VENDOR=0");
    additionalFilterArray.push("(|(PORTALUSER!=1)(PORTALUSER!=*))");
    // if company code is in error, the business unit is irrelevant.
    const businessUnit = User.managingUsersWithBU && !Data.GetError("CompanyCode__") ? Data.GetValue("BusinessUnit__") : null;
    return Lib.P2P.Browse.BrowseUsers(title, null, additionalFilterArray, true, businessUnit);
}
/**
 * Browse Add line item type in PO mode
 */
function fillInsertPOLineOrGLLineDialog(dialog) {
    const browseMessageCtrl = dialog.AddDescription("HelpText", null);
    browseMessageCtrl.SetText("_Kind of line popup question");
    dialog.AddSeparator();
    const radio = dialog.AddRadioButton("lineTypeChoice");
    radio.SetText("_NON-PO Line\n_PO Line");
    radio.SetValue("_PO Line");
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnFillInsertPOLineOrGLLineDialogEnd", dialog, radio);
}
function commitInsertPOLineOrGLLineDialog(dialog, tabId) {
    if (!tabId) {
        // callback from base dialog
        const newValue = dialog.GetControl("lineTypeChoice").GetValue();
        switch (newValue) {
            case "_PO Line":
                if (Lib.P2P.IsPOMatchingEnabled()) {
                    Controls.OrderNumber__.OnBrowse();
                }
                else {
                    InvoiceLineItem.AddPOLineItem(Controls.LineItems__, InvoiceLineItem.iIndexForNewItem);
                }
                break;
            case "_NON-PO Line":
                InvoiceLineItem.AddGLLineItem(Controls.LineItems__);
                cleanUpLineItems();
                break;
            default:
                Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnCommitInsertPOLineOrGLLineDialogDefault", newValue);
                break;
        }
    }
}
/** Amounts and balance **/
function computeCallback(amountField) {
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    const headerAmounts = invoiceDocument.computeHeaderAmount();
    updateNetAmountAndMismatch(headerAmounts.netAmount, headerAmounts.mismatchAmount);
    Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
    invoiceDocument.ComputePaymentAmountsAndDates(true, Lib.AP.IsCreditNote());
    invoiceDocument.UpdateLocalAndCorporateAmounts();
    onLocalNetAmountUpdate();
    if (amountField) {
        Data.SetValue("Local" + amountField, Data.GetValue(amountField) * parseFloat(Data.GetValue("ExchangeRate__")));
        Data.SetValue("Corporate" + amountField, Data.GetValue(amountField) * parseFloat(Data.GetValue("CorporateExchangeRate__")));
    }
    Lib.ERP.checkBalance(true);
}
function onFinalizeGetTaxRate() {
    computeTaxAmount();
    computeCallback();
    LayoutHelper.DisableButtons(false, "GetTaxRate");
}
function onErrorGetSAPTaxRate(lineItem, error, errorField, category) {
    let taxCode = lineItem.GetValue("TaxCode__");
    const customTaxCode = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.GetCustomTaxCode", taxCode, lineItem);
    taxCode = customTaxCode || taxCode;
    const itemList = g_taxCodes[taxCode];
    for (const item of itemList) {
        if (error) {
            if (!errorField) {
                errorField = "TaxCode__";
            }
            item.SetCategorizedError(errorField, category, error);
            setItemTaxRateAndTaxAmount(item, 0, 0);
        }
    }
}
function onErrorGetCustomERPTaxRate(lineItem, error, errorField, category) {
    let taxCode = lineItem.GetValue("TaxCode__");
    const customTaxCode = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.GetCustomTaxCode", taxCode, lineItem);
    taxCode = customTaxCode || taxCode;
    const itemList = g_taxCodes[taxCode];
    for (const item of itemList) {
        if (error) {
            if (!errorField) {
                errorField = "TaxCode__";
            }
            item.SetCategorizedError(errorField, category, error);
            setItemTaxRateAndTaxAmount(item, 0, []);
        }
    }
}
function onFinalizeGetTaxRateForTable() {
    // update balance
    computeTaxAmount();
    computeCallback();
    LayoutHelper.DisableButtons(false, "GetTaxRateForTable");
}
function GetTaxRateForItemList() {
    return Sys.Helpers.Promise.Create(function (resolve, reject) {
        const taxCodesCount = Object.keys(g_taxCodes).length;
        if (taxCodesCount === 0) {
            //Compute all header amount when coming from browse PO
            computeCallback();
            resolve();
            return;
        }
        if (Lib.ERP.IsSAP()) {
            handleSAPTaxRateProcessing(resolve, reject);
        }
        else if (Lib.ERP.IsCustomERP(Lib.ERP.GetERPName())) {
            handleCustomERPTaxRateProcessing(resolve);
        }
        else {
            handleGenericTaxRateProcessing(resolve);
        }
    });
}
function extractTaxArrayFromCodes() {
    const taxArray = [];
    for (const taxCode in g_taxCodes) {
        if (Object.prototype.hasOwnProperty.call(g_taxCodes, taxCode)) {
            taxArray.push(g_taxCodes[taxCode][0]);
        }
    }
    return taxArray;
}
function handleSAPTaxRateProcessing(resolve, reject) {
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    LayoutHelper.DisableButtons(true, "GetTaxRate");
    const taxArray = extractTaxArrayFromCodes();
    taxArray.reduce(function (p, currentTax) {
        return p.Then(function () {
            return processSAPTaxItem(invoiceDocument, currentTax);
        });
    }, Sys.Helpers.Promise.Resolve())
        .Then(function () {
        onFinalizeGetTaxRate();
        resolve();
    })
        .Catch(function () {
        onFinalizeGetTaxRate();
        reject();
    });
}
function processSAPTaxItem(invoiceDocument, currentTax) {
    return invoiceDocument.GetTaxRateAsync(currentTax)
        .Then(function (result) {
        // Use the user exit to allow customizing the effective tax code for cache lookup
        let taxCode = result.item.GetValue("TaxCode__");
        const customTaxCode = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.GetCustomTaxCode", taxCode, result.item);
        taxCode = customTaxCode || taxCode;
        const itemList = g_taxCodes[taxCode];
        for (const item of itemList) {
            setItemTaxRateAndTaxAmount(item, result.taxRate, [result.nonDeductibleTaxRate]);
        }
    })
        .Catch(function (result) {
        onErrorGetSAPTaxRate(result.item, result.error, result.errorField, result.category);
    });
}
function handleCustomERPTaxRateProcessing(resolve) {
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    LayoutHelper.DisableButtons(true, "GetTaxRate");
    const taxArray = extractTaxArrayFromCodes();
    let currentIndex = 0;
    const processTaxCode = function () {
        if (currentIndex >= taxArray.length) {
            onFinalizeGetTaxRate();
            resolve();
            return;
        }
        const currentTax = taxArray[currentIndex];
        currentIndex++;
        invoiceDocument.GetTaxRate(currentTax, function (item, taxRate, nonDeductibleTaxRates) {
            // Use the user exit to allow customizing the effective tax code for cache lookup
            let taxCode = item.GetValue("TaxCode__");
            const customTaxCode = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.GetCustomTaxCode", taxCode, item);
            taxCode = customTaxCode || taxCode;
            const itemList = g_taxCodes[taxCode];
            for (const lineItem of itemList) {
                setItemTaxRateAndTaxAmount(lineItem, taxRate, nonDeductibleTaxRates);
            }
            processTaxCode();
        }, function (item, error, field, category) {
            onErrorGetCustomERPTaxRate(item, error, field, category);
            processTaxCode();
        }, function () { });
    };
    processTaxCode();
}
function handleGenericTaxRateProcessing(resolve) {
    LayoutHelper.DisableButtons(true, "GetTaxRateForTable");
    Lib.AP.TaxHelper.GetTaxRateForTableAsync(g_taxCodes)
        .Then(function (itemsTaxRate) {
        for (const tax of itemsTaxRate) {
            if (tax.exists) {
                updateItemsWithTaxRate(tax.items, tax.taxRates, tax.nonDeductibleTaxRates, tax.taxRoundingPriorities);
            }
            else {
                setTaxCodeInErrorWithInvalidTaxes(tax.items, "Field value does not belong to table!");
            }
        }
        onFinalizeGetTaxRateForTable();
        resolve();
    });
}
/**
 * Tells whether the tax rate must be retrieved and kept on the line items even when the automatic tax computation is disabled
 * @returns {boolean} True when the tax rate retrieval is decoupled from the automatic tax computation
 */
function shouldRetrieveTaxRateWithoutTaxComputation() {
    return Boolean(Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ShouldRetrieveTaxRateWithoutTaxComputation"));
}
function getTaxRateAndUpdateItem(item, overrideSuccessCallback, stackCall) {
    if (item.GetValue("TaxCode__") && (Controls.CalculateTax__.IsChecked() || shouldRetrieveTaxRateWithoutTaxComputation())) {
        // Use the user exit to allow customizing the effective tax code for cache storage/lookup
        let taxCode = item.GetValue("TaxCode__");
        const customTaxCode = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.GetCustomTaxCode", taxCode, item);
        taxCode = customTaxCode || taxCode;
        if (stackCall) {
            const isPresent = typeof g_taxCodes[taxCode] === "object";
            if (!isPresent) {
                g_taxCodes[taxCode] = [];
            }
            g_taxCodes[taxCode].push(item);
        }
        else {
            LayoutHelper.DisableButtons(true, "GetTaxRate");
            Lib.AP.GetInvoiceDocument().GetTaxRate(item, 
            // success callback
            overrideSuccessCallback ? overrideSuccessCallback : updateItemWithTaxRate, 
            // error callback
            function (it, error, field, category) {
                if (error) {
                    if (field) {
                        it.SetCategorizedError(field, category, error);
                    }
                    else {
                        Popup.Alert(error, true, null, "_Error while computing the tax amount");
                    }
                }
                updateItemWithTaxRate(it, 0, 0);
            }, 
            // finalize callback
            function () {
                LayoutHelper.DisableButtons(false, "GetTaxRate");
            });
        }
    }
    else if (!stackCall) {
        updateItemWithTaxRate(item, 0, 0);
    }
}
function autolearnExtractedNetAmount() {
    // Autolearn ExtractedNetAmount if balance is good and amount was modified
    if (!Controls.Balance__.GetError() && Controls.NetAmount__.GetValue() !== Controls.ExtractedNetAmount__.GetValue()) {
        Controls.ExtractedNetAmount__.SetReadOnly(false);
        Controls.ExtractedNetAmount__.SetValue(Controls.NetAmount__.GetValue());
        // remove the computed flag so the field is autolearned
        Data.SetComputed("ExtractedNetAmount__", false);
        Controls.ExtractedNetAmount__.SetReadOnly(true);
        Lib.AP.GetInvoiceDocument().ComputePaymentAmountsAndDates(true, false);
    }
}
function setItemTaxAmount(item, taxRate) {
    const taxAmount = Sys.Helpers.Round(Lib.AP.ApplyTaxRate(item.GetValue("Amount__"), taxRate, item.GetValue("MultiTaxRates__")), Lib.AP.GetAmountPrecision());
    item.SetValue("TaxAmount__", taxAmount);
}
function setItemTaxRateAndTaxAmount(item, taxRates, nonDeductibleTaxRates, roundingModes) {
    const TaxHelper = Lib.AP.GetTaxHelper();
    const taxRate = TaxHelper.setTaxRate(item, taxRates, nonDeductibleTaxRates, roundingModes);
    if (!Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ShouldSkipTaxAmountComputation", item)) {
        setItemTaxAmount(item, taxRate);
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnSetItemTaxRateAndTaxAmount", item);
}
function setTaxCodeInErrorWithInvalidTaxes(items, error) {
    if (!items || items.length === 0 || !error) {
        return;
    }
    for (const item of items) {
        item.SetCategorizedError("TaxCode__", Lib.AP.TouchlessException.InvalidValue, error);
    }
}
/**
 * Set the taxRate to the items
 * @param {Item[]} items The list of LineItems to update
 * @param {float} taxRate The tax rate amount computed to assign to the items
 */
function updateItemsWithTaxRate(items, taxRate, nonDeductibleTaxRates, taxRoundingPriorities) {
    if (items) {
        const shouldSkipTaxRateUpdate = Sys.Helpers.TryGetFunction("Lib.AP.Customization.HTMLScripts.ShouldSkipTaxRateUpdate");
        for (const item of items) {
            if (shouldSkipTaxRateUpdate && shouldSkipTaxRateUpdate(item)) {
                continue;
            }
            setItemTaxRateAndTaxAmount(item, taxRate, nonDeductibleTaxRates, taxRoundingPriorities);
        }
    }
}
function updateItemWithTaxRate(item, taxrate, nonDeductibleTaxRates, taxRoundingModes) {
    setItemTaxRateAndTaxAmount(item, taxrate, nonDeductibleTaxRates, taxRoundingModes);
    computeTaxAmount();
    Lib.ERP.checkBalance(true);
}
function computeTaxAmount() {
    Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
    Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
    onLocalNetAmountUpdate();
}
function checkInvoiceCurrency(requestedInvoiceCurrency) {
    function callbackUpdateCompanyCodeCurrency(results, error) {
        const isCurrencyDefinedForCompanyCode = !error && results && results.length > 0;
        if (isCurrencyDefinedForCompanyCode) {
            g_invoiceCurrency = Controls.InvoiceCurrency__.GetValue();
            Data.SetError("InvoiceCurrency__", "");
            updateExchangeRate(requestedInvoiceCurrency);
        }
        else {
            setExchangeRateAndCheckBalance(0, 0, requestedInvoiceCurrency);
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnCheckInvoiceCurrency", requestedInvoiceCurrency, isCurrencyDefinedForCompanyCode);
    }
    Lib.P2P.ExchangeRate.IsCurrencyDefinedForCompanyCode(Controls.CompanyCode__.GetValue(), Controls.InvoiceCurrency__.GetValue(), callbackUpdateCompanyCodeCurrency);
}
function isInApprovalWorkflow() {
    const invoiceStatus = Controls.InvoiceStatus__.GetValue();
    return invoiceStatus === Lib.AP.InvoiceStatus.ToApprove || invoiceStatus === Lib.AP.InvoiceStatus.ToApproveBeforeClearing || invoiceStatus === Lib.AP.InvoiceStatus.OnHold;
}
function userIsAPOrAdmin() {
    const isAPOrAdmin = User.profileName === "Accounts Payable Profile" || User.profileRole === "accountManagement";
    const customIsAPOrAdmin = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.IncludeCustomAPProfiles", isAPOrAdmin);
    return typeof customIsAPOrAdmin === "boolean" ? customIsAPOrAdmin : isAPOrAdmin;
}
function checkPOInvoiceLineItemTableVendor() {
    if (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
        const lineItemsTable = Data.GetTable("LineItems__");
        const nbItems = lineItemsTable.GetItemCount();
        for (let i = 0; i < nbItems; i++) {
            const item = lineItemsTable.GetItem(i);
            if (InvoiceLineItem.IsPOLineItem(item) || InvoiceLineItem.IsPOGLLineItem(item)) {
                checkPOInvoiceLineItemVendor(item);
            }
        }
    }
}
function checkPOInvoiceLineItemVendor(item) {
    let vendorCheck = Lib.AP.BasicReturnValues.EmptyString;
    if ((InvoiceLineItem.IsPOLineItem(item) && Lib.P2P.IsPOMatchingEnabled()) || InvoiceLineItem.IsPOGLLineItem(item)) {
        vendorCheck = Lib.ERP.Invoice.validatePOLineVendorWithHeaderVendor(item);
    }
    if (!(item.GetValue("OrderNumber__") || item.GetValue("GoodIssue__")) || vendorCheck === Lib.AP.BasicReturnValues.EmptyString) {
        item.SetWarning("OrderNumber__");
        item.SetWarning("GoodIssue__");
        item.SetError("OrderNumber__");
        item.SetError("GoodIssue__");
    }
}
function checkConsignmentLineItemQuantity(item) {
    if (Lib.P2P.InvoiceLineItem.IsConsignmentLineItem(item) && !Data.GetValue("ERPInvoiceNumber__")) {
        let warning = "";
        //Quantity
        const expectedQuantity = item.GetValue("ExpectedQuantity__");
        const netQuantity = item.GetValue("Quantity__");
        if (netQuantity > expectedQuantity) {
            warning = Language.Translate("_This value exceeds the expected quantity ({0})", false, decimalToString(expectedQuantity));
            item.SetWarning("Quantity__", warning);
        }
    }
}
function checkPOInvoiceLineItemAmount(item, dispatchMap) {
    if ((InvoiceLineItem.IsPOLineItem(item) && Lib.P2P.IsPOMatchingEnabled()) || InvoiceLineItem.IsPOGLLineItem(item)) {
        let amountWarning = "";
        if (!dispatchMap) {
            dispatchMap = InvoiceLineItem.GetDispatchedLinesAmountQuantity();
        }
        const key = InvoiceLineItem.GetDispatchKey(item);
        const netAmount = dispatchMap[key] ? dispatchMap[key].amount : item.GetValue("Amount__");
        const hasRefDocument = item.GetValue("OrderNumber__") || item.GetValue("GoodIssue__");
        if (hasRefDocument && netAmount > 0) {
            const openAmount = item.GetValue("OpenAmount__");
            const expectedAmount = item.GetValue("ExpectedAmount__");
            const mismatchAmount = item.GetValue("MismatchAmount__");
            if (mismatchAmount > 0) {
                amountWarning = Language.Translate("_This value exceeds the expected amount ({0})", false, decimalToString(expectedAmount));
            }
            else if (netAmount > openAmount) {
                amountWarning = Language.Translate("_This value exceeds the amount still to be invoiced ({0})", false, decimalToString(openAmount));
            }
        }
        item.SetWarning("Amount__", amountWarning);
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Client.OverrideErrorType", item, amountWarning, false, "Amount__");
    }
}
function checkPOInvoiceLineItemAmountQuantity(item) {
    if (InvoiceLineItem.IsPOLineItem(item) || InvoiceLineItem.IsPOGLLineItem(item)) {
        if (item.GetValue("Quantity__") === null) {
            if (item.GetValue("Amount__") === null) {
                item.SetCategorizedError("Amount__", null, null);
            }
            else if (!Data.GetValue("SubsequentDocument__")) {
                item.SetCategorizedError("Quantity__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
            }
        }
        if (item.GetValue("Amount__") === null) {
            if (item.GetValue("Quantity__") === null) {
                item.SetCategorizedError("Quantity__", null, null);
            }
            else {
                item.SetCategorizedError("Amount__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
            }
        }
    }
}
function checkPOInvoiceLineItemUnitPrice(item) {
    if ((InvoiceLineItem.IsPOLineItem(item) && Lib.P2P.IsPOMatchingEnabled()) || InvoiceLineItem.IsPOGLLineItem(item)) {
        const expectedUnitPrice = item.GetValue("UnitPrice__");
        const invoicedUnitPrice = item.GetValue("InvoicedUnitPrice__");
        if (!item.IsNullOrEmpty("InvoicedUnitPrice__") && !Lib.AP.IsUnitPriceWithinTolerance(invoicedUnitPrice, expectedUnitPrice)) {
            item.SetWarning("InvoicedUnitPrice__", "_This value differs from the expected unit price ({0})", decimalToString(expectedUnitPrice));
        }
        else {
            item.SetWarning("InvoicedUnitPrice__", null);
        }
    }
}
function checkPOInvoiceLineItems() {
    if (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
        const lineItemsTable = Data.GetTable("LineItems__");
        const nbItems = lineItemsTable.GetItemCount();
        const dispatchMap = InvoiceLineItem.GetDispatchedLinesAmountQuantity();
        for (let i = 0; i < nbItems; i++) {
            const item = lineItemsTable.GetItem(i);
            checkPOInvoiceLineItemAmount(item, dispatchMap);
            Lib.AP.GetInvoiceDocumentLayout().checkPOInvoiceLineItemQuantity(item, InvoiceLineItem, dispatchMap);
            checkPOInvoiceLineItemAmountQuantity(item);
            checkPOInvoiceLineItemVendor(item);
            checkConsignmentLineItemQuantity(item);
            checkPOInvoiceLineItemUnitPrice(item);
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CheckPOInvoiceLineItemEnd", item);
        }
    }
}
/** ******************************** **/
/** CHECK ORDER NUMBER/VENDOR NUMBER **/
/** ******************************** **/
function validateLine(item, requiredFields) {
    let valid = true;
    // Validate all the required fields
    if (requiredFields) {
        for (const field in requiredFields.LineItems__) {
            if (requiredFields.isRequired(requiredFields.LineItems__[field], item) && !item.GetValue(field)) {
                item.SetCategorizedError(field, Lib.AP.TouchlessException.MissingLineField, "This field is required!");
                valid = false;
            }
        }
    }
    const lineType = item.GetValue("LineType__");
    if ((lineType === Lib.P2P.LineType.PO && Lib.P2P.IsPOMatchingEnabled()) || lineType === Lib.P2P.LineType.POGL) {
        valid = Lib.ERP.Invoice.validatePOLineVendorWithHeaderVendor(item) === Lib.AP.BasicReturnValues.EmptyString && valid;
    }
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        ProcessInstance.SetSilentChange(true);
        if (Variable.GetValueAsString("RemoveGHGUnitError") === "true") {
            item.SetError("EnergyConsumptionUnit__", "");
            Variable.SetValueAsString("RemoveGHGUnitError", "");
        }
        if (valid && item.GetError("EnergyConsumptionUnit__")) {
            valid = false;
            Controls.LineItems__.EnergyConsumptionUnit__.SetAllowTableValuesOnly(true);
        }
        ProcessInstance.SetSilentChange(false);
    }
    return valid;
}
function validateLineItems(requiredFields) {
    let valid = true;
    if (!Data.GetValue("ManualLink__")) {
        const lineItems = Data.GetTable("LineItems__");
        const nbItems = lineItems.GetItemCount();
        if (nbItems <= 0) {
            valid = false;
        }
        for (let i = 0; i < nbItems; i++) {
            valid = validateLine(lineItems.GetItem(i), requiredFields) && valid;
            const tableRow = Controls.LineItems__.GetRow(i);
            if (tableRow) {
                tableRow.TaxCode__.Focus();
                tableRow.OrderNumber__.Focus();
                //Back to the 1st field to show errors
                tableRow.Description__.Focus();
            }
        }
    }
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled() && valid) {
        // Disable allow table values only as data source can be changed dynamically
        Controls.LineItems__.EnergyConsumptionUnit__.SetAllowTableValuesOnly(false);
    }
    return valid;
}
function DisableTableValuesOnly(control, arrayParams) {
    for (const param of arrayParams) {
        if (control && control[param] && control[param].IsReadOnly()) {
            if (typeof control[param].SetAllowTableValuesOnly === "function") {
                control[param].SetError("");
                control[param].SetAllowTableValuesOnly(false);
            }
            else {
                Log.Warn(`Lib.AP.UncheckedHeaderFieldsDuringApproval - field ${param} is not a DatabaseComboBox`);
            }
        }
    }
}
function DisableTableValuesOnlyInApprovalWkf() {
    if (isInApprovalWorkflow()) {
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.AppendUncheckedHeaderAndLineItemsFieldsDuringApproval");
        DisableTableValuesOnly(Controls, Lib.AP.UncheckedHeaderFieldsDuringApproval);
        const nbLines = Math.min(Controls.LineItems__.GetItemCount(), Controls.LineItems__.GetLineCount());
        for (let i = 0; i < nbLines; i++) {
            DisableTableValuesOnly(Controls.LineItems__.GetRow(i), Lib.AP.UncheckedLineItemsFieldsDuringApproval);
        }
    }
}
function validateHeader(requiredFields) {
    Controls.CompanyCode__.Focus();
    Controls.PostingDate__.Focus();
    Controls.VendorNumber__.Focus();
    Controls.VendorName__.Focus();
    Controls.InvoiceDate__.Focus();
    Controls.InvoiceAmount__.Focus();
    Controls.InvoiceCurrency__.Focus();
    if (Sys.FRB2B.AP.IsFlux10_1Compliant() === "1") {
        Controls.Flux10_1_TaxDueDateTypeCode__.Focus();
        Controls.Flux10_1_BuyerCompanyId__.Focus();
        Controls.Flux10_1_BuyerCompanyIdSchemeId__.Focus();
        Controls.Flux10_1_SellerId__.Focus();
        Controls.Flux10_1_SellerIdSchemeId__.Focus();
        Controls.Flux10_1_SellerTaxRepresentativeId__.Focus();
        Controls.Flux10_1_SellerTaxRepresentativeIdSchemeId__.Focus();
        Controls.EDIInvoiceType__.Focus();
        Controls.InvoicePeriodStartDate__.Focus();
        Controls.InvoicePeriodEndDate__.Focus();
    }
    ReverseChargeTaxLayoutHelper.ValidateFields();
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled() && currentStepIsApStart()) {
        Controls.EnergyConsumptionLevel__.Focus();
    }
    if (requiredFields) {
        for (const field in requiredFields.Header) {
            if (requiredFields.isRequired(requiredFields.Header[field])) {
                Lib.AP.GetInvoiceDocumentLayout().CallControlFunction(null, field, "Focus");
            }
        }
    }
    //Back to the 1st field to show errors on InvoiceCurrency
    Controls.CompanyCode__.Focus();
}
/** ********************* **/
/** Vendor Contact Helper **/
/** ********************* **/
const vendorContact = {
    /**
     * Retrieve the ShortLogin__ of the vendor Contact from the Vendors links table
     *
     * @param {string} vendorNumber : vendorNumber filter for the query
     * @param {string} companyCode : companyCode filter for the query
     * @param {function} callback : Callback when the query is finished
     */
    GetVendorLinkRecord: function (vendorNumber, companyCode, callback) {
        if (!vendorNumber) {
            Log.Warn("GetVendorLinkRecord : No vendor number, cannot find vendor");
            return;
        }
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode)).toString();
        Sys.GenericAPI.Query("AP - Vendors links__", filter, ["ShortLogin__"], callback, null, 1);
    },
    /**
     * Retrieve the EmailAddress and the DiplayName of the vendor Contact
     *
     * @param {string} vendorNumber : vendorNumber filter for the query
     * @param {string} companyCode : companyCode filter for the query
     * @param {function} callback : Callback when the query is finished
     */
    GetVendorContactUser: function (vendorNumber, companyCode, callback) {
        const GetVendorLinkDetail = function (result, error) {
            if (result && result[0]) {
                const filter = `(&(VENDOR=1)(Login=${User.accountId}$${result[0].ShortLogin__}))`;
                Sys.GenericAPI.Query("ODUSER", filter, ["DiplayName", "EmailAddress"], callback, null, 1);
            }
            else if (error) {
                Log.Warn("GetVendorContactUser : " + error);
            }
            else if (callback) {
                callback();
            }
        };
        this.GetVendorLinkRecord(vendorNumber, companyCode, GetVendorLinkDetail);
    },
    FillVendorContactEmail: function () {
        Controls.VendorContactEmail__.SetError("");
        Controls.VendorContactEmail__.SetReadOnly(true);
        Controls.ContactVendor__.SetDisabled(true);
        Controls.ButtonPriceMismatchSort__.SetDisabled(true);
        Controls.RequestCreditNotes.SetDisabled(true);
        const vendorNumber = Controls.VendorNumber__.GetValue(), companyCode = Controls.CompanyCode__.GetValue(), fillEmail = function (result, error) {
            if (result && result[0] && !Sys.Helpers.IsEmpty(result[0].EmailAddress)) {
                Controls.VendorContactEmail__.SetValue(result[0].EmailAddress);
                Controls.ContactVendor__.SetDisabled(false);
            }
            else {
                if (Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ShouldClearVendorContactEmailOnLookupFailure") !== false) {
                    Controls.VendorContactEmail__.SetValue("");
                }
                Controls.ContactVendor__.SetDisabled(!Controls.VendorContactEmail__.GetValue());
                if (error) {
                    Log.Warn("FillVendorContactEmail : " + error);
                }
                else if (Sys.Parameters.GetInstance("AP").GetParameter("EnablePortalAccountCreation") !== "0") {
                    Controls.VendorContactEmail__.SetReadOnly(false);
                }
            }
            LayoutHelper.UpdateRequestCreditNoteButtons();
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnFillVendorContactEmail", result, error);
        };
        if (vendorNumber && companyCode) {
            vendorContact.GetVendorContactUser(vendorNumber, companyCode, fillEmail);
        }
        else {
            Controls.VendorContactEmail__.SetValue("");
            LayoutHelper.UpdateRequestCreditNoteButtons();
        }
    },
    FillAlternativePayeeContactEmail: function () {
        const vendorNumber = Controls.AlternativePayee__.GetValue(), companyCode = Controls.CompanyCode__.GetValue(), fillEmail = function (result, error) {
            if (result && result[0] && !Sys.Helpers.IsEmpty(result[0].EmailAddress)) {
                Controls.AlternativePayeeEmail__.SetValue(result[0].EmailAddress);
            }
            else {
                Controls.AlternativePayeeEmail__.SetValue("");
                if (error) {
                    Log.Warn("FillAlternativePayeeContactEmail : " + error);
                }
            }
        };
        if (vendorNumber && companyCode) {
            this.GetVendorContactUser(vendorNumber, companyCode, fillEmail);
        }
        else {
            Controls.AlternativePayeeEmail__.SetValue("");
        }
    }
};
/** **************** **/
/** Link to SIM      **/
/** **************** **/
function OpenCompanyDashboard() {
    const vendorNumber = Controls.VendorNumber__.GetValue(), companyCode = Controls.CompanyCode__.GetValue();
    if (vendorNumber && companyCode) {
        Lib.P2P.SIM.OpenCompanyDashboard(vendorNumber, companyCode);
    }
}
Controls.SupplierInformationManagementLink__.SetDisabled(!Data.GetValue("CompanyCode__") || !Data.GetValue("VendorNumber__"));
/** **************** **/
/** Simulation Popup **/
/** **************** **/
function handleSimulationResult(simulateResult, simulationReport) {
    function handleAlertSimulationDialog(dialog, tabId, event, control) {
        if (control.GetType() === "Button" && event === "OnClick") {
            dialog.Cancel();
            if (control.GetName() === "PostFromSimulationPopUp") {
                Controls.Post.OnClick();
            }
        }
    }
    function fillSimulationPopup(dialog) {
        const htmlControl = dialog.AddHTML("HTML_POPUP", "", "0");
        dialog.HideDefaultButtons();
        dialog.AddButton("backToInvoice", "_Back to the invoice");
        if (simulationReport.CounterByType.errors === 0) {
            const buttonPostFromSimulationPopUp = dialog.AddButton("PostFromSimulationPopUp", Controls.Post.GetLabel());
            buttonPostFromSimulationPopUp.SetSubmitStyle();
        }
        htmlControl.SetCSS(Controls.SAP_Simulation_Result__.GetCSS());
        htmlControl.SetHTML(Controls.SAP_Simulation_Result__.GetHTML());
    }
    // Show simulation popup
    Controls.SAP_Simulation_Result__.SetHTML(simulateResult);
    Popup.Dialog("_Simulation results", null, fillSimulationPopup, null, null, handleAlertSimulationDialog, null);
}
/** ************************* **/
/** Load lines from clipboard **/
/** ************************* **/
const LoadClipboard = {
    // By default, the mapping will be built based on the header line
    mapping: null,
    noMapping: [],
    noMappingKey: "_Load clipboard no mapping",
    rawData: "",
    showPaste: true,
    showPreview: false,
    data: null,
    comboMap: {},
    reversedComboMap: {},
    mappingComboValues: [],
    availableColumns: null,
    mappingCtrls: null,
    init: function () {
        // Try to get mapping from user exit
        // Else use the one from the parameters
        // Else autodetermine mapping from header line
        const loadClipboardMapping = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.GetLineItemsImporterMapping");
        if (LoadClipboard.checkMapping(loadClipboardMapping)) {
            LoadClipboard.mapping = loadClipboardMapping;
            Log.Info("LoadClipboard - Using mapping from users exit");
        }
        else {
            LoadClipboard.mapping = { columns: [] };
            // Try to load mapping from vendor parameters
            const lineItemsImporterMapping = Variable.GetValueAsString("LineItemsImporterMapping");
            if (lineItemsImporterMapping) {
                try {
                    LoadClipboard.mapping = Sys.Helpers.ParseObject(lineItemsImporterMapping);
                    Log.Info("LoadClipboard - Using mapping from parameters table");
                }
                catch (err) {
                    Log.Warn("LoadClipboard - Line items importer mapping, wrong JSON format");
                }
            }
        }
        LoadClipboard.noMapping = [];
        LoadClipboard.rawData = "";
        LoadClipboard.showPaste = true;
        LoadClipboard.showPreview = false;
        LoadClipboard.data = null;
        LoadClipboard.comboMap = {};
        LoadClipboard.reversedComboMap = {};
        LoadClipboard.mappingComboValues = [LoadClipboard.noMappingKey];
        // Add default columns for mapping design
        if (!loadClipboardMapping || !loadClipboardMapping.customMap) {
            LoadClipboard.addColumnInMap("Description__");
            LoadClipboard.addColumnInMap("Amount__");
            LoadClipboard.addColumnInMap("GLAccount__");
            LoadClipboard.addColumnInMap("CostCenter__");
            LoadClipboard.addColumnInMap("TaxCode__");
        }
        else {
            const customMap = loadClipboardMapping.customMap;
            for (let i = 0; i < customMap.length; i++) {
                LoadClipboard.addColumnInMap(customMap[i]);
            }
        }
    },
    addColumnInMap: function (c) {
        if (!LoadClipboard.reversedComboMap[c]) {
            LoadClipboard.comboMap[Language.Translate(Controls.LineItems__[c].GetLabel(), false)] = c;
            LoadClipboard.reversedComboMap[c] = Language.Translate(Controls.LineItems__[c].GetLabel(), false);
            LoadClipboard.mappingComboValues.push(Controls.LineItems__[c].GetLabel());
        }
    },
    checkMapping: function (mapping) {
        // Check that mapping loaded is valid
        return mapping && mapping.columns && Sys.Helpers.IsArray(mapping.columns);
    },
    getSeparator: function (mapping) {
        return mapping && mapping.separator ? mapping.separator : "\t";
    },
    hasHeader: function (mapping) {
        return mapping && Sys.Helpers.IsBoolean(mapping.hasHeader) ? mapping.hasHeader : true;
    },
    getAvailableColumns: function () {
        if (LoadClipboard.availableColumns) {
            return LoadClipboard.availableColumns;
        }
        const columns = Controls.LineItems__.GetColumnsOrder();
        const customizedColumns = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.GetClipboardAvailableColumns", columns);
        const columnsToUse = Sys.Helpers.IsArray(customizedColumns) ? customizedColumns : columns;
        LoadClipboard.availableColumns = {};
        for (const columnName of columnsToUse) {
            if (typeof columnName !== "string") {
                continue;
            }
            const column = Controls.LineItems__[columnName];
            if (!column) {
                continue;
            }
            const obj = {
                name: columnName,
                type: column.GetType()
            };
            LoadClipboard.availableColumns[columnName.toLowerCase()] = obj;
            LoadClipboard.availableColumns[Language.Translate(column.GetLabel(), false).toLowerCase()] = obj;
        }
        return LoadClipboard.availableColumns;
    },
    nameify: function (name) {
        return name.replace(/\s|\W/g, "_").replace(/\b_*/g, "");
    },
    parseNumber: function (value) {
        var _a;
        if (Sys.Helpers.IsEmpty(value) || !Sys.Helpers.IsString(value) || value.trim() === "") {
            return value;
        }
        const regex = /^[eE-\d.,\s]*$/; // Match only numeric, dots, commas, or space characters
        if (!regex.test(value)) {
            return value; // Return original value if it contains invalid characters
        }
        // Check for multiple commas and dots
        const commaCount = (value.match(/,/g) || []).length;
        const dotCount = (value.match(/\./g) || []).length;
        const spaceCount = (value.trim().match(/\s/g) || []).length;
        if (commaCount > 1 && dotCount > 1 && spaceCount > 1) {
            return value; // too many different separators
        }
        const multipleOccurrences = [commaCount, dotCount, spaceCount].filter(count => count > 1); // Check if multiple separator types have more than one occurrence
        if (multipleOccurrences.length > 1) {
            return value; // more than one decimal separator
        }
        const parseNumberResult = Sys.Helpers.String.ParseNumber(value.trim(), User.culture);
        return (_a = parseNumberResult === null || parseNumberResult === void 0 ? void 0 : parseNumberResult.value) !== null && _a !== void 0 ? _a : parseFloat(value.trim());
    },
    guessColumn: function (headerName) {
        const map = LoadClipboard.getAvailableColumns();
        const candidate = map[headerName.toLowerCase()];
        let columnGuess;
        if (candidate) {
            columnGuess = { columnName: candidate.name, type: candidate.type, found: true };
            if (candidate.type === "Decimal") {
                columnGuess.convert = LoadClipboard.parseNumber;
            }
        }
        else {
            columnGuess = { columnName: LoadClipboard.nameify(headerName), type: "Text", found: false };
        }
        // User exit to customize guessed mapping
        const customizedGuess = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizeGuessedColumnMapping", headerName, columnGuess) || columnGuess;
        return customizedGuess;
    },
    addOrModifyMapping: function (mapping, m) {
        if (mapping && m && m.lineItemsColumn) {
            for (const column of mapping.columns) {
                if (m.lineItemsColumn === column.lineItemsColumn) {
                    column.header = m.header;
                    column.type = m.type;
                    if (m.convert) {
                        column.convert = m.convert;
                    }
                    return column;
                }
                if (m.header === column.header) {
                    column.lineItemsColumn = m.lineItemsColumn;
                    column.type = m.type;
                    if (m.convert) {
                        column.convert = m.convert;
                    }
                    return column;
                }
            }
            mapping.columns.push(m);
        }
        return null;
    },
    parseHeader: function (header, mapping) {
        var _a;
        LoadClipboard.showPreview = false;
        if (!header) {
            return null;
        }
        LoadClipboard.noMapping = [];
        const lineFormat = [];
        const fields = header.split(LoadClipboard.getSeparator(mapping));
        for (const field of fields) {
            let mappingFound = false;
            const headerColumnName = field.trim();
            if (mapping) {
                for (let c = 0; c < mapping.columns.length && !mappingFound; c++) {
                    if (headerColumnName === mapping.columns[c].header) {
                        lineFormat.push(mapping.columns[c]);
                        mappingFound = true;
                    }
                }
            }
            if (!mappingFound) {
                // Add new column to mapping
                const guess = LoadClipboard.guessColumn(headerColumnName);
                const m = {
                    lineItemsColumn: guess.columnName,
                    header: headerColumnName,
                    type: guess.type,
                    noMapping: false,
                    convert: (_a = guess.convert) !== null && _a !== void 0 ? _a : null
                };
                if (!guess.found) {
                    m.noMapping = true;
                    LoadClipboard.noMapping.push(headerColumnName);
                    Log.Warn("LoadClipboard - no line items mapping found for column " + headerColumnName);
                }
                else {
                    // Show this column in the possible values in mapping edition
                    LoadClipboard.addColumnInMap(guess.columnName);
                    // We have at least one column mapped, show the preview
                    LoadClipboard.showPreview = true;
                }
                LoadClipboard.addOrModifyMapping(mapping, m);
                lineFormat.push(m);
            }
            else {
                // We have at least one column mapped, show the preview
                LoadClipboard.showPreview = true;
            }
        }
        if (LoadClipboard.shouldDisplayMappingDialog()) {
            LoadClipboard.showMappingDialog();
        }
        return lineFormat;
    },
    convertValue: function (value, convertFunc) {
        if (Sys.Helpers.IsFunction(convertFunc)) {
            return convertFunc(value);
        }
        else if (Sys.Helpers.IsString(convertFunc)) {
            return Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts." + convertFunc, value);
        }
        return value;
    },
    parseLine: function (line, mapping, lineFormat) {
        const l = {};
        const fields = line.split(LoadClipboard.getSeparator(mapping));
        for (let f = 0; f < fields.length && f < lineFormat.length; f++) {
            if (lineFormat[f].lineItemsColumn) {
                l[lineFormat[f].lineItemsColumn] = LoadClipboard.convertValue(fields[f].trim(), lineFormat[f].convert);
            }
        }
        return l;
    },
    parseData: function (text, mapping) {
        let data = null;
        if (text) {
            data = [];
            const lines = text.split("\n");
            if (lines.length <= 0) {
                return null;
            }
            let n = 0;
            const hasHeader = LoadClipboard.hasHeader(mapping);
            let lineFormat = [];
            if (hasHeader) {
                // parse header and build the expected line format from mapping
                lineFormat = LoadClipboard.parseHeader(lines[0].trim(), mapping);
                // Skip header
                n = 1;
                if (!LoadClipboard.showPreview) {
                    // No need to go further, the preview will not be displayed
                    return data;
                }
            }
            else if (mapping) {
                lineFormat = mapping.columns;
            }
            for (; n < lines.length; n++) {
                const line = lines[n];
                if (line) {
                    data.push(LoadClipboard.parseLine(line, mapping, lineFormat));
                }
            }
        }
        return data;
    },
    fillPreview: function (dialog, data) {
        if (data) {
            // Show the first lines in preview results
            const previewTable = dialog.GetControl("preview_table");
            previewTable.SetItemCount(0);
            for (const dataItem of data) {
                const line = previewTable.AddItem(false);
                for (const fld in dataItem) {
                    if (Object.prototype.hasOwnProperty.call(dataItem, fld)) {
                        line.SetValue(fld, dataItem[fld]);
                    }
                }
            }
        }
    },
    showPreviewDialog: function () {
        LoadClipboard.data = LoadClipboard.parseData(LoadClipboard.rawData, LoadClipboard.mapping);
        if (LoadClipboard.showPreview && !LoadClipboard.shouldDisplayMappingDialog()) {
            Popup.Dialog("_Load clipboard preview dialog title", null, LoadClipboard.fillPreviewDialog, LoadClipboard.commitPreviewDialog, null, LoadClipboard.handlePreviewDialog, LoadClipboard.cancelPreviewDialog);
        }
        else if (!LoadClipboard.shouldDisplayMappingDialog()) {
            // Keep this dialog open when no other dialog is already opened
            LoadClipboard.ShowDialog();
        }
    },
    showMappingDialog: function () {
        Popup.Dialog("_Load clipboard mapping incomplete", null, LoadClipboard.fillMappingPopup, LoadClipboard.commitMappingPopup, null, LoadClipboard.handleMappingPopup);
    },
    // --------------------
    // Mapping dialog
    fillMappingPopup: function (dialog) {
        if (LoadClipboard.noMapping.length > 0) {
            const errorMsg = dialog.AddDescription("errorMsg");
            errorMsg.SetText(Language.Translate("_Load clipboard No mapping found for columns '{0}'", true, LoadClipboard.noMapping.join("', '")));
        }
        // design mapping
        if (LoadClipboard.mapping && LoadClipboard.mapping.columns && LoadClipboard.mapping.columns.length > 0) {
            LoadClipboard.mappingCtrls = {};
            for (const col of LoadClipboard.mapping.columns) {
                const mCtrl = dialog.AddComboBox(col.lineItemsColumn, col.header);
                if (mCtrl) {
                    mCtrl.SetText(LoadClipboard.mappingComboValues.join("\n"));
                    if (!col.noMapping) {
                        mCtrl.SetValue(LoadClipboard.reversedComboMap[col.lineItemsColumn]);
                    }
                }
                LoadClipboard.mappingCtrls[col.header] = mCtrl;
            }
        }
        const link = dialog.AddLink("LinkToDoc__");
        link.SetText("_Load clipboard dialog help link");
        link.SetOpenInCurrentWindow(true);
        link.SetURL("#");
    },
    commitMappingPopup: function () {
        var _a;
        // Save new mapping
        if (LoadClipboard.mappingCtrls) {
            LoadClipboard.mapping.columns = [];
            for (const c in LoadClipboard.mappingCtrls) {
                if (Object.prototype.hasOwnProperty.call(LoadClipboard.mappingCtrls, c)) {
                    const ctrl = LoadClipboard.mappingCtrls[c];
                    if (ctrl && ctrl.GetValue() && ctrl.GetValue() !== Language.Translate(LoadClipboard.noMappingKey)) {
                        const guess = LoadClipboard.guessColumn(ctrl.GetValue());
                        const m = {
                            lineItemsColumn: guess.columnName,
                            header: c,
                            type: guess.type,
                            convert: (_a = guess.convert) !== null && _a !== void 0 ? _a : null
                        };
                        const column = LoadClipboard.addOrModifyMapping(LoadClipboard.mapping, m);
                        if (column) {
                            delete column.noMapping;
                        }
                    }
                }
            }
        }
        // Show preview with new mapping
        LoadClipboard.showPreviewDialog();
    },
    handleMappingPopup: function (dialog, tabId, event, control) {
        if (event === "OnClick" && control.GetName() === "LinkToDoc__") {
            Process.ShowHelp(2540);
        }
    },
    shouldDisplayMappingDialog: function () {
        return !LoadClipboard.showPreview && LoadClipboard.noMapping.length > 0;
    },
    // --------------------
    // Paste dialog
    fillPasteDialog: function (dialog) {
        if (!LoadClipboard.checkMapping(LoadClipboard.mapping)) {
            const errorCtrl = dialog.AddDescription("errorMsg", "");
            errorCtrl.SetText("_Load clipboard mapping undefined or invalid");
            errorCtrl.SetErrorStyle();
            return;
        }
        const pasteArea = dialog.AddMultilineText("pasteZone");
        pasteArea.SetLineCount(10);
        pasteArea.SetWidth(450);
        pasteArea.SetPlaceholder(Language.Translate("_Paste your data here"));
        const okButton = dialog.GetControl("buttonok");
        okButton.SetText(Language.Translate("_Load clipboard Show preview"));
    },
    commitPasteDialog: function (dialog) {
        // Show preview dialog
        const control = dialog.GetControl("pasteZone");
        if (control) {
            LoadClipboard.rawData = control.GetValue();
            LoadClipboard.showPreviewDialog();
        }
    },
    // --------------------
    // Preview dialog
    fillPreviewDialog: function (dialog) {
        var _a;
        // Hold dialog until table is filled to make sure it is centered on screen
        dialog.Hold(true);
        const okButton = dialog.GetControl("buttonok");
        okButton.SetText(Language.Translate("_Load clipboard append lines"));
        const previewTable = dialog.AddTable("preview_table");
        previewTable.SetReadOnly(true);
        previewTable.SetLineCount(5);
        for (const fldprops of LoadClipboard.mapping.columns) {
            let addColumn;
            if (fldprops.type === "Decimal") {
                addColumn = previewTable.AddDecimalColumn;
            }
            else {
                addColumn = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.AddLoadClipboardPreviewColumn", fldprops.type, previewTable)) !== null && _a !== void 0 ? _a : previewTable.AddTextColumn;
            }
            if (addColumn && !fldprops.noMapping) {
                addColumn.call(previewTable, fldprops.lineItemsColumn, Controls.LineItems__[fldprops.lineItemsColumn].GetLabel(), fldprops.width ? fldprops.width : 100);
            }
        }
        LoadClipboard.fillPreview(dialog, LoadClipboard.data);
        dialog.AddButton("editMapping", "_Load clipboard Edit mapping");
        dialog.Hold(false);
    },
    handlePreviewDialog: function (dialog, tabId, event, control) {
        if (event === "OnClick" && control.GetName() === "editMapping") {
            LoadClipboard.showPaste = false;
            dialog.Cancel();
            LoadClipboard.showMappingDialog();
        }
    },
    cancelPreviewDialog: function () {
        if (LoadClipboard.showPaste) {
            // Return to paste dialog
            LoadClipboard.ShowDialog();
        }
    },
    addLines: function () {
        // preview accepted
        const data = LoadClipboard.data;
        if (data) {
            const lineItems = Data.GetTable("LineItems__");
            let lineItemsCount = lineItems.GetItemCount();
            let item = lineItems.GetItem(lineItemsCount - 1);
            if (Lib.P2P.InvoiceLineItem.IsGenericLineEmpty(item)) {
                item.Remove();
                lineItemsCount--;
            }
            const finalItemCount = lineItemsCount + data.length;
            lineItems.SetItemCount(finalItemCount);
            const items = [];
            for (let i = lineItemsCount; i < finalItemCount; i++) {
                item = lineItems.GetItem(i);
                if (item) {
                    const rowData = data[i - lineItemsCount];
                    item.SetValue("LineType__", Lib.P2P.LineType.GL);
                    item.SetValue("ItemType__", Lib.P2P.ItemType.AMOUNT_BASED);
                    for (const field in rowData) {
                        if (Object.prototype.hasOwnProperty.call(rowData, field)) {
                            item.SetValue(field, rowData[field]);
                        }
                    }
                    getTaxRateAndUpdateItem(item, null, true);
                    Lib.AP.TaxHelper.SetC5TaxTypeOnLineItem(item);
                    if (!item.GetValue("CostType__")) {
                        Lib.P2P.fillCostTypeFromGLAccount(item);
                    }
                    items.push(item);
                }
            }
            LayoutHelper.DisableButtons(true, "AddlinesPromises");
            items.reduce(function (p, l) {
                var _a;
                let promiseSeq = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnLoadClipboardAddLine", l)) !== null && _a !== void 0 ? _a : Sys.Helpers.Promise.Resolve();
                return promiseSeq.Then(function () {
                    return p.Then(function () {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            fillGLAndCCDescriptions(l, resolve);
                        });
                    });
                });
            }, Sys.Helpers.Promise.Resolve()).Then(function () {
                LayoutHelper.DisableButtons(false, "AddlinesPromises");
                GetTaxRateForItemList().Then(function () {
                    LoadClipboard.endAddLines();
                });
            });
        }
        else {
            LoadClipboard.endAddLines();
        }
    },
    /***
     * Backup the mapping and reactivate the buttons
     */
    endAddLines: function () {
        // Will save mapping into P2P - Parameters table (with LineItemsImporterMapping process variable)
        if (!Variable.GetValueAsString("LineItemsImporterMapping") && LoadClipboard.mapping) {
            Variable.SetValueAsString("LineItemsImporterMapping", Sys.Helpers.SerializeObject(LoadClipboard.mapping));
        }
        LayoutHelper.UpdateRequestCreditNoteButtons();
        LayoutHelper.DisableButtons(false, "Addlines");
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnLoadClipboardEndAddLines");
    },
    commitPreviewDialog: function () {
        LayoutHelper.ShowWaitScreen = true;
        LayoutHelper.DisableButtons(true, "Addlines");
        // asynchronous call for dialog to be closed right away and for wait screen to be visible
        setTimeout(LoadClipboard.addLines, 20);
    },
    // Entry point
    ShowDialog: function () {
        LoadClipboard.init();
        Popup.Dialog("_Load clipboard paste dialog title", null, LoadClipboard.fillPasteDialog, LoadClipboard.commitPasteDialog);
    }
};
/** ******************************** **/
/** Assign standard buttons controls **/
/** ******************************** **/
/** asynchronous/synchronous buttons helpers**/
const ButtonsBehavior = {
    bWaitForPostResult: null,
    defaultNonBlockingErrorFieldNames: ["ERPInvoiceNumber__"],
    nonBlockingErrors: [],
    initNonBlockingErrors: function () {
        const nonBlockingErrors = [];
        let nonBlockingErrorFieldNames = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.UpdateNonBlockingErrorFields", ButtonsBehavior.defaultNonBlockingErrorFieldNames);
        if (!Array.isArray(nonBlockingErrorFieldNames)) {
            nonBlockingErrorFieldNames = ButtonsBehavior.defaultNonBlockingErrorFieldNames;
        }
        for (const fieldName of nonBlockingErrorFieldNames) {
            if (fieldName && Controls[fieldName]) {
                nonBlockingErrors.push({ field: fieldName, error: "" });
            }
        }
        ButtonsBehavior.nonBlockingErrors = nonBlockingErrors;
    },
    WaitForPostResult: function () {
        if (ButtonsBehavior.bWaitForPostResult === null) {
            ButtonsBehavior.bWaitForPostResult = Sys.Parameters.GetInstance("P2P_" + Lib.ERP.GetERPName()).GetParameter("WaitForPostResult");
        }
        return ButtonsBehavior.bWaitForPostResult;
    },
    init: function () {
        ButtonsBehavior.initNonBlockingErrors();
        Controls.BackToAP.OnClick = ButtonsBehavior.onclickBackToAP;
        Controls.BackToPrevious.OnClick = ButtonsBehavior.onclickBackToPrevious;
        Controls.Reject.OnClick = ButtonsBehavior.onclickReject;
        Controls.Simulate.OnClick = ButtonsBehavior.onclickSimulate;
        Controls.Post.OnClick = ButtonsBehavior.onclickPost;
        Controls.OnHold.OnClick = ButtonsBehavior.onclickOnHold;
        Controls.SetAside.OnClick = ButtonsBehavior.onclickSetAside;
        Controls.CreateInvoicingSchedule.OnClick = ButtonsBehavior.onclickCreateInvoicingSchedule;
        Controls.ToggleHistoryView__.OnClick = ButtonsBehavior.onclickToggleHistoryView;
        Controls.ToggleRelatedInvoicesView__.OnClick = ButtonsBehavior.onclickToggleRelatedInvoicesView;
        Controls.ToggleVendorRelatedContractsView__.OnClick = ButtonsBehavior.onclickToggleVendorRelatedContractsView;
        Controls.ButtonSaveTemplate__.OnClick = ButtonsBehavior.onclickSaveTemplate;
        Controls.ButtonLoadTemplate__.OnClick = ButtonsBehavior.onclickLoadTemplate;
        Controls.ButtonLoadClipboard__.OnClick = ButtonsBehavior.onclickLoadClipboard;
        if (Controls.SaveEditing_) {
            Controls.SaveEditing_.OnClick = ButtonsBehavior.onclickSaveEditing_;
        }
        Controls.ReverseInvoice.OnClick = ButtonsBehavior.onClickReverseInvoice;
        Controls.ShowBankDetails__.OnClick = BankDetails.onClick;
        Controls.ShowParameters__.OnClick = ParameterDetails.onClick;
        Controls.IsFlux10_1Compliant__.OnChange = OnFlux10_1CompliantChange;
        Controls.ShowExtractedLineItems__.OnClick = ButtonsBehavior.onClickShowExtractedLineItems;
        Controls.RequestCreditNotes.OnClick = ButtonsBehavior.onClickRequestCreditNotes;
        Controls.ButtonPriceMismatchSort__.OnClick = ButtonsBehavior.onClickPriceMismatchSort;
        if (Data.GetValue("HasBeenWaitingForCreditNote__") === true &&
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ShowRelatedInvoices") !== false) {
            Controls.ToggleRelatedInvoicesView__.OnClick();
        }
    },
    formatComboboxReasons: function (reasons) {
        const availableReasonsWithTranslations = reasons.filter(reason => { var _a; return ((_a = Language.Translate(reason)) === null || _a === void 0 ? void 0 : _a.startsWith("[")) === false; });
        return availableReasonsWithTranslations.map((reasonKey) => `${reasonKey}=${reasonKey}`).join("\n");
    },
    getReasonKeysFromComboboxValues: function (possibleValues) {
        if (!possibleValues) {
            return [];
        }
        return possibleValues
            .split("\n")
            .filter(value => value.includes("="))
            .map(value => value.split("=")[0])
            .filter(value => value !== "");
    },
    getValidCurrentReason: function (possibleValues, currentReason) {
        const availableReasons = ButtonsBehavior.getReasonKeysFromComboboxValues(possibleValues);
        if (availableReasons.includes(currentReason)) {
            return currentReason;
        }
        return availableReasons[0] || "";
    },
    getRelevantCDVTypesForReason: function (reasonToCheck) {
        const relevantTypes = [];
        const cdvTypesArray = Object.keys(Sys.FRB2B.AP.OnHoldCDVType);
        function checkReasonExistsForCDVType(reason, CDVType) {
            return Sys.FRB2B.AP[CDVType][reason] !== undefined;
        }
        cdvTypesArray.forEach(function (CDVType) {
            if (CDVType === "NothingToDeclare" || checkReasonExistsForCDVType(reasonToCheck, CDVType + "Reasons")) {
                relevantTypes.push(Sys.FRB2B.AP.OnHoldCDVType[CDVType]);
            }
        });
        const defaultCDVType = Sys.FRB2B.AP.GetDefaultCDVTypeForOnHoldAction(relevantTypes);
        const defaultCDVTypeIndex = relevantTypes.indexOf(defaultCDVType);
        if (defaultCDVType && defaultCDVTypeIndex > -1) {
            relevantTypes.splice(defaultCDVTypeIndex, 1);
            relevantTypes.unshift(defaultCDVType);
        }
        return relevantTypes;
    },
    getDefaultCDVTypeForReason: function (reasonToCheck, currentCDVType) {
        const relevantTypes = ButtonsBehavior.getRelevantCDVTypesForReason(reasonToCheck);
        if (currentCDVType && relevantTypes.includes(currentCDVType)) {
            return currentCDVType;
        }
        return relevantTypes[0] || Sys.FRB2B.AP.OnHoldCDVType.NothingToDeclare;
    },
    approve: function (actionName, bForceSync) {
        const isAsync = !bForceSync && (isInApprovalWorkflow() || Controls.ManualLink__.IsChecked() || !ButtonsBehavior.WaitForPostResult());
        if (isAsync) {
            ProcessInstance.ApproveAsynchronous(actionName);
        }
        else {
            ProcessInstance.Approve(actionName);
        }
    },
    backToAP: function (backToAPtitle, backToAPReasonListLabel, actionName) {
        let popupConfig = {
            title: backToAPtitle,
            reasonListLabel: backToAPReasonListLabel,
            possibleValues: Controls.BackToAPReason__.GetText(),
            currentReason: Controls.BackToAPReason__.GetValue(),
            currentComment: getReliableComment(),
            onClickOk: function (result) {
                Controls.BackToAPReason__.SetValue(result.reason);
                Controls.Comment__.SetValue(result.comment ? result.comment : "");
                ButtonsBehavior.approve(actionName);
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizePopupCommentConfig", popupConfig, "backToAP") || popupConfig;
        Lib.CommonDialog.PopupReason(popupConfig);
    },
    holdingInvoice: function (holdingTitle, holdingReasonListLabel, actionName) {
        const isFRB2BInvoice = Sys.FRB2B.AP.IsInvoiceCreatedFromPDP();
        let dialog = {
            title: holdingTitle,
            reasonListLabel: holdingReasonListLabel,
            possibleValues: Controls.AsideReason__.GetAvailableValues().join("\n"),
            currentReason: Controls.AsideReason__.GetValue(),
            currentComment: getReliableComment(),
            limitDate: null,
            onClickOk: null
        };
        const onDialogOk = function (result) {
            const selectedReason = isFRB2BInvoice ? ButtonsBehavior.getValidCurrentReason(dialog.possibleValues, result.reason) : result.reason;
            if (selectedReason === "Waiting for credit memo") {
                Data.SetValue("HasBeenWaitingForCreditNote__", true);
            }
            Controls.AsideReason__.SetValue(selectedReason);
            Controls.Comment__.SetValue(result.comment ? result.comment : "");
            if (isFRB2BInvoice) {
                Variable.SetValueAsString("FRB2BCDVOnHoldType", ButtonsBehavior.getDefaultCDVTypeForReason(selectedReason, result.cdvType));
            }
            else if (result.cdvType) {
                Variable.SetValueAsString("FRB2BCDVOnHoldType", result.cdvType);
            }
            ButtonsBehavior.approve(actionName);
        };
        if (isFRB2BInvoice) {
            dialog.possibleValues = ButtonsBehavior.formatComboboxReasons(Sys.FRB2B.AP.GetOnHoldReasons());
            dialog.currentReason = ButtonsBehavior.getValidCurrentReason(dialog.possibleValues, dialog.currentReason);
            const availableReasonValues = dialog.possibleValues;
            function fillCDVTypeCombo(dialog, control) {
                const cdvTypeCombo = dialog.GetControl("CDVTypeCombo");
                const reason = ButtonsBehavior.getValidCurrentReason(availableReasonValues, control === null || control === void 0 ? void 0 : control.GetSelectedOption());
                const relevantTypes = ButtonsBehavior.getRelevantCDVTypesForReason(reason);
                if (cdvTypeCombo) {
                    cdvTypeCombo.SetText(ButtonsBehavior.formatComboboxReasons(relevantTypes));
                    cdvTypeCombo.SetValue(ButtonsBehavior.getDefaultCDVTypeForReason(reason, cdvTypeCombo.GetValue()));
                }
            }
            dialog.extendedFillPopupCB = function (popupDialog) {
                const widthPopup = 400;
                popupDialog.AddComboBox("CDVTypeCombo", "_FRB2BCDVType", widthPopup);
                const reasonCombo = popupDialog.GetControl("reason");
                fillCDVTypeCombo(popupDialog, reasonCombo);
            };
            dialog.extendedHandleDialogCB = function (dialog, tabId, event, control) {
                if (event === "OnChange" && control && control.GetType() === "ComboBox" && control.GetName() === "Reason") {
                    fillCDVTypeCombo(dialog, control);
                }
            };
            dialog.extendedCommitPopupCB = function (popupDialog, result) {
                result.reason = ButtonsBehavior.getValidCurrentReason(dialog.possibleValues, result.reason);
                const cdvTypeCombo = popupDialog.GetControl("CDVTypeCombo");
                if (cdvTypeCombo) {
                    result.cdvType = ButtonsBehavior.getDefaultCDVTypeForReason(result.reason, cdvTypeCombo.GetValue());
                }
                return result;
            };
        }
        if (actionName === "OnHold") {
            dialog.limitDate = "_LimitDate";
            dialog.onClickOk = function (result) {
                Controls.ScheduledActionDate__.SetValue(result.limitDate ? result.limitDate : "");
                Controls.ScheduledAction__.SetValue("onHoldExpiration");
                Controls.HasBeenOnHold__.SetValue(true);
                onDialogOk(result);
            };
        }
        else {
            dialog.onClickOk = function (result) {
                onDialogOk(result);
            };
        }
        dialog = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizePopupCommentConfig", dialog, "holdingInvoice") || dialog;
        Lib.CommonDialog.PopupReason(dialog);
    },
    reject: function (rejectTitle, rejectListLabel, actionName) {
        let portalWarning = "";
        const vendorName = Controls.VendorName__.GetValue();
        if (!Controls.PortalRuidEx__.GetValue() && vendorName && Controls.VendorNumber__.GetValue()) {
            portalWarning = Language.Translate("_Publish on vendor portal for {0}", true, vendorName);
        }
        let popupConfig = {
            title: rejectTitle,
            helpId: 2522,
            reasonListLabel: rejectListLabel,
            possibleValues: Controls.RejectReason__.GetText(),
            currentReason: Controls.RejectReason__.GetValue(),
            currentComment: getReliableComment(),
            confirmationMessage: portalWarning,
            confirmationValue: true,
            onClickOk: function (result) {
                const selectedReason = Sys.FRB2B.AP.IsInvoiceCreatedFromPDP() ? ButtonsBehavior.getValidCurrentReason(popupConfig.possibleValues, result.reason) : result.reason;
                Controls.RejectReason__.SetValue(selectedReason);
                Controls.Comment__.SetValue(result.comment ? result.comment : "");
                ButtonsBehavior.approve(actionName);
                if (portalWarning && result.confirmationValue) {
                    Variable.SetValueAsString("PublishOnReject", "true");
                }
            }
        };
        if (Sys.FRB2B.AP.IsInvoiceCreatedFromPDP()) {
            popupConfig.possibleValues = ButtonsBehavior.formatComboboxReasons(Sys.FRB2B.AP.GetRejectReasons());
            popupConfig.currentReason = ButtonsBehavior.getValidCurrentReason(popupConfig.possibleValues, popupConfig.currentReason);
        }
        popupConfig = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizePopupCommentConfig", popupConfig, "reject") || popupConfig;
        Lib.CommonDialog.PopupReason(popupConfig);
    },
    checkException: function () {
        let allowPosting = true;
        const currentException = Data.GetValue("CurrentException__");
        const manualExceptionType = Variable.GetValueAsString("manualExceptionType");
        const isExtractionReviewException = Variable.GetValueAsString("isExtractionReviewException");
        const hasReviewException = currentException && (isExtractionReviewException || manualExceptionType === "_WorkflowType_Invoice exception");
        const hasApprovalException = currentException && (isExtractionReviewException || manualExceptionType === "_WorkflowType_Invoice exception for approvers");
        const nextRole = Lib.AP.WorkflowCtrl.GetNextStepRole();
        const hasNeitherControllerNorApproverNext = nextRole !== Lib.AP.WorkflowCtrl.roles.controller &&
            nextRole !== Lib.AP.WorkflowCtrl.roles.approver;
        const hasAPEnd = nextRole === Lib.AP.WorkflowCtrl.roles.apEnd;
        if (hasReviewException && nextRole !== Lib.AP.WorkflowCtrl.roles.controller) {
            Popup.Alert(["_The exception {0} is set but no reviewer is selected.", currentException], false, null, "_Cannot post invoice");
            allowPosting = false;
        }
        else if (hasApprovalException && !hasReviewException && hasNeitherControllerNorApproverNext && !hasAPEnd) {
            Popup.Alert(["_The exception {0} is set but no approver is selected.", currentException], false, null, "_Cannot post invoice");
            allowPosting = false;
        }
        return allowPosting;
    },
    removeEmptyExtendedWHT: function () {
        const WHTTable = Data.GetTable("ExtendedWithholdingTax__");
        let i = 0;
        // don't add empty line while cleaning
        Controls.ExtendedWithholdingTax__.SetAtLeastOneLine(false);
        while (i < WHTTable.GetItemCount()) {
            const item = WHTTable.GetItem(i);
            if (!item.GetValue("WHTType__") || !item.GetValue("WHTCode__")) {
                item.Remove();
            }
            else {
                i++;
            }
        }
    },
    checkforEmptyPOLineItem: function () {
        if (POLineItemHelper.ShouldCheck()) {
            const lineItemsTable = Data.GetTable("LineItems__");
            const nbItems = lineItemsTable.GetItemCount();
            for (let i = 0; i < nbItems; i++) {
                if (Lib.P2P.InvoiceLineItem.IsRemovable(lineItemsTable.GetItem(i))) {
                    POLineItemHelper.SetEmptyLine(i);
                    break;
                }
            }
            if (POLineItemHelper.HasEmptyLine()) {
                Popup.Confirm("_Some items are incomplete and will be ignored, do you want to continue ?", false, ButtonsBehavior.removeEmptyPOLineItems, ButtonsBehavior.warnEmptyPOLineItems, "_Incomplete item detected");
                return false;
            }
        }
        return true;
    },
    removeEmptyPOLineItems: function () {
        const lineItemsTable = Data.GetTable("LineItems__");
        let i = 0;
        while (i < lineItemsTable.GetItemCount()) {
            const item = lineItemsTable.GetItem(i);
            if (Lib.P2P.InvoiceLineItem.IsRemovable(item)) {
                item.Remove();
            }
            else {
                i++;
            }
        }
        if (lineItemsTable.GetItemCount() > 0) {
            ButtonsBehavior.validateAndApprove(true);
        }
        // must check again if validation has not been done
        POLineItemHelper.Clear();
    },
    warnEmptyPOLineItems: function () {
        const lineItemsTable = Data.GetTable("LineItems__");
        const nbItems = lineItemsTable.GetItemCount();
        for (let i = POLineItemHelper.idx; i < nbItems; i++) {
            const item = lineItemsTable.GetItem(i);
            if (InvoiceLineItem.IsPOLineItem(item) && !item.GetValue("Amount__") && !item.GetValue("Quantity__")) {
                item.SetWarning("Amount__", "_Line with empty amount will be ignored.");
                item.SetWarning("Quantity__", "_Line with empty quantity will be ignored.");
            }
        }
        POLineItemHelper.Clear();
    },
    removeNonBlockingErrors: function () {
        for (const nonBlockingErrorDef of ButtonsBehavior.nonBlockingErrors) {
            const error = Data.GetError(nonBlockingErrorDef.field);
            if (error) {
                nonBlockingErrorDef.error = error;
                Data.SetError(nonBlockingErrorDef.field, "");
            }
        }
    },
    resetNonBlockingErrors: function () {
        for (const nonBlockingErrorDef of ButtonsBehavior.nonBlockingErrors) {
            Data.SetError(nonBlockingErrorDef.field, nonBlockingErrorDef.error);
        }
    },
    validateData: async function () {
        let isValid;
        const wkfExceptionError = Data.GetError("CurrentException__");
        const wkfException = Data.GetValue("CurrentException__");
        const nextRole = Lib.AP.WorkflowCtrl.GetNextStepRole();
        if (!wkfExceptionError && wkfException && nextRole && nextRole !== Lib.AP.WorkflowCtrl.roles.approver) {
            // A valid exception is set, and there is someone next in the workflow
            Log.Warn("In exception workflow: ignore errors and continue with the action");
            isValid = true;
        }
        else {
            if (!isInApprovalWorkflow()) {
                await ButtonsBehavior.validateSupplier();
            }
            DisableTableValuesOnlyInApprovalWkf();
            const erpManager = Lib.AP.GetInvoiceDocument();
            const requiredFields = erpManager.GetRequiredFields(Sys.Helpers.TryGetFunction("Lib.AP.Customization.Common.GetRequiredFields"));
            validateHeader(requiredFields);
            validateLineItems(requiredFields);
            erpManager.ValidateData();
            isValid = !Process.ShowFirstError() && (isInApprovalWorkflow() || Lib.ERP.isBalanceInThreshold());
        }
        const customIsValid = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnValidateForm", isValid);
        if (typeof customIsValid === "boolean") {
            return Sys.Helpers.Promise.Resolve(customIsValid);
        }
        else if (Sys.Helpers.Promise.IsIPromise(customIsValid)) {
            return customIsValid;
        }
        return Sys.Helpers.Promise.Resolve(isValid);
    },
    validateSupplier: async function () {
        return Sys.Helpers.Promise.Create(function (resolve) {
            function getVendorCallBack(queryResult) {
                var _a;
                var _b;
                if ((queryResult === null || queryResult === void 0 ? void 0 : queryResult.GetQueryError()) || ((_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.Records) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                    Data.SetError("VendorNumber__", (_b = queryResult === null || queryResult === void 0 ? void 0 : queryResult.GetQueryError()) !== null && _b !== void 0 ? _b : "_VendorNotFound");
                }
                else {
                    // Update vendor lifecycle status and set
                    let vendorStatus = queryResult.GetQueryValue("LifeCycleStatusCode__", 0);
                    let vendorStatusComment = queryResult.GetQueryValue("LifeCycleComment__", 0);
                    manageStatusInVendorField(vendorStatus, vendorStatusComment);
                    Variable.SetValueAsString("VendorLifeCycleStatusCode", vendorStatus);
                    Variable.SetValueAsString("VendorLifeCycleComment", vendorStatusComment);
                }
                return resolve();
            }
            GetVendor(false, Controls.VendorNumber__, Lib.AP.GetInvoiceDocument(), getVendorCallBack);
        });
    },
    validateAndApprove: function (isAPspecialist) {
        Controls.Post.Wait(true);
        ButtonsBehavior.removeNonBlockingErrors();
        LayoutHelper.RemoveTaxCodeCostCenterWarnings();
        return ButtonsBehavior.validateData()
            .Then(function (isValid) {
            if (isValid) {
                function CheckIfInvoiceAlreadyPosted() {
                    var _a;
                    const transactionPost = Transaction.Read(Lib.ERP.Invoice.transaction.keys.post);
                    // No popup if we are in archiving mode (manual link, intercompany invoices, ...)
                    if (!Data.GetValue("ERPLinkingDate__")
                        && (transactionPost === Lib.ERP.Invoice.transaction.values.beforePost
                            || transactionPost === Lib.ERP.Invoice.transaction.values.afterPost)) {
                        if ((_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizeRepostPopupDisplayCondition")) !== null && _a !== void 0 ? _a : !Lib.AP.IsInArchivingMode()) {
                            Popup.Confirm("_PopupConfirmRepostDescription", false, function () {
                                Log.Warn("The invoice might have already been posted to the ERP, a popup warns the user. User forced a new try.");
                                Variable.SetValueAsString("ForceSecondPosting", "true");
                                Controls.Post.Wait(false);
                                ButtonsBehavior.approve("Post");
                            }, null, "_PopupConfirmRepostTitle");
                        }
                        else {
                            Variable.SetValueAsString("ForceSecondPosting", "true");
                            Controls.Post.Wait(false);
                            ButtonsBehavior.approve("Post");
                        }
                    }
                    else {
                        Controls.Post.Wait(false);
                        ButtonsBehavior.approve("Post");
                    }
                }
                //Reccuring invoice
                const workflow = Sys.WorkflowController.Create(Data, Variable, Language, Controls, User);
                const recurringInvoiceAction = Variable.GetValueAsString("RecurringInvoiceAutoValidation");
                const currentRole = Lib.AP.WorkflowCtrl.GetCurrentStepRole();
                const currentContributor = workflow.GetNbContributors() > 0 && workflow.GetContributorAt(workflow.GetContributorIndex());
                const showRecurringDialog = (recurringInvoiceAction === "prompt") && currentContributor
                    && (currentRole === Lib.AP.WorkflowCtrl.roles.approver) && (currentContributor.login === User.loginId);
                if (!isInApprovalWorkflow() && !currentStepIsController()) {
                    autolearnExtractedNetAmount();
                }
                if (isAPspecialist && parseInt(Data.GetValue("DuplicateCheckAlertLevel__"), 10) > 0) {
                    const callBack = function () {
                        CheckIfInvoiceAlreadyPosted();
                    };
                    DuplicateCheck.DoDuplicateCheck(callBack);
                }
                else if (showRecurringDialog) {
                    Popup.Dialog("_RecurrentInvoiceDialogTitle", null, function (dialog) {
                        dialog.HideDefaultButtons();
                        dialog.AddDescription("Description").SetText("_RecurrentInvoiceDialogMessage");
                        let yesButton = dialog.AddButton("YesButton", "_Yes");
                        yesButton.SetSubmitStyle();
                        dialog.AddButton("NoButton", "_No");
                    }, null, null, function (dialog, tabId, event, control) {
                        if (event === "OnClick") {
                            switch (control.GetName()) {
                                case "YesButton":
                                    Variable.SetValueAsString("RecurringInvoiceAutoValidation", "true");
                                    break;
                                case "NoButton":
                                default:
                                    Variable.SetValueAsString("RecurringInvoiceAutoValidation", "false");
                                    break;
                            }
                            CheckIfInvoiceAlreadyPosted();
                            dialog.Cancel();
                        }
                    });
                }
                else {
                    CheckIfInvoiceAlreadyPosted();
                }
            }
            else {
                ButtonsBehavior.resetNonBlockingErrors();
                Controls.Post.Wait(false);
            }
        })
            .Catch(function (error) {
            Log.Error(`Unhandled promise: ${error}. Prevent posting.`);
            ButtonsBehavior.resetNonBlockingErrors();
            Controls.Post.Wait(false);
        });
    },
    onclickPost: function () {
        var _a;
        let post = true;
        // Resuming the wait for the ERP-driven status is not an approval: the lifecycle error no longer applies
        const isResumingPendingERPDrivenStatus = Lib.AP.ShouldAllowResumePendingERPDrivenStatus();
        if (isResumingPendingERPDrivenStatus) {
            Data.SetError("ERPInvoiceNumber__", "");
        }
        if (isInApprovalWorkflow()) {
            if (!isResumingPendingERPDrivenStatus && Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.OnHold) {
                let dialogMessage = "_The payment for this invoice has been previously put on hold, do you confirm the approval ?";
                if (currentStepIsApprover()) {
                    dialogMessage = "_The payment for this invoice has been previously put on hold, do you confirm the payment approval ?";
                }
                post = false;
                Popup.Confirm(dialogMessage, false, function () {
                    ButtonsBehavior.validateAndApprove(false);
                }, null, "_Invoice on hold");
            }
        }
        else if (currentStepIsApStart()) {
            ButtonsBehavior.removeNonBlockingErrors();
            post = ButtonsBehavior.checkException();
            const shouldCheckEmptyPOLineItem = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ShouldCheckEmptyPOLineItem")) !== null && _a !== void 0 ? _a : true;
            if (post && shouldCheckEmptyPOLineItem && (Lib.AP.InvoiceType.isPOInvoice() || Lib.AP.InvoiceType.isPOGLInvoice())) {
                post = ButtonsBehavior.checkforEmptyPOLineItem();
            }
            // remove empty WHT line
            if ((Lib.ERP.IsSAP() || Lib.ERP.IsGeneric())
                && Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "") === "Extended") {
                ButtonsBehavior.removeEmptyExtendedWHT();
            }
            if (Lib.AP.InvoiceType.isConsignmentInvoice()
                && Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.approver) === 0
                && !Data.GetValue("ERPInvoiceNumber__")) {
                post = false;
                const lineItems = Data.GetTable("LineItems__");
                const goodIssueNumbers = [];
                for (let i = 0; i < lineItems.GetItemCount(); i++) {
                    const item = lineItems.GetItem(i);
                    const goodIssueNumber = item.GetValue("GoodIssue__");
                    if (goodIssueNumbers.indexOf(goodIssueNumber) === -1) {
                        goodIssueNumbers.push(goodIssueNumber);
                    }
                }
                let isValid = true;
                let currentSettlementNumber = null;
                goodIssueNumbers.reduce(function (p, goodIssueNumber) {
                    return p.Then(function () {
                        return Sys.Helpers.Promise.Create(function (resolve) {
                            function checkSettlement(FIDocumentNumber) {
                                if (currentSettlementNumber === null) {
                                    currentSettlementNumber = FIDocumentNumber;
                                }
                                else if (currentSettlementNumber !== FIDocumentNumber) {
                                    isValid = false;
                                }
                                resolve();
                            }
                            Lib.AP.SAP.Consignment.CheckRKWA(goodIssueNumber, checkSettlement);
                        });
                    });
                }, Sys.Helpers.Promise.Resolve()).then(function () {
                    if (isValid && currentSettlementNumber !== "") {
                        Data.SetValue("ERPinvoiceNumber__", currentSettlementNumber);
                        Popup.Confirm(["_Existing settlement found {0}", currentSettlementNumber], false, function () {
                            ButtonsBehavior.validateAndApprove(true);
                        }, null, "_Existing settlement found title");
                    }
                    else if (!isValid) {
                        Popup.Alert("_SAP changement detected", true, null, "_SAP changement detected title");
                    }
                    else {
                        ButtonsBehavior.validateAndApprove(true);
                    }
                });
            }
        }
        if (Lib.AP.WorkflowCtrl.GetNbRemainingContributorWithRole(Lib.AP.WorkflowCtrl.roles.controller) === 0 &&
            ERPNumberDialogHelper.ShouldPopup() &&
            !Lib.AP.WorkflowCtrl.IsCurrentContributorLowPrivilegeAP()) {
            ERPNumberDialogHelper.DisplayPopup(Lib.AP.GetInvoiceDocument().GetManualLinkWorkflowComment());
            post = false;
        }
        if (post) {
            // no popup was triggered - client side validation required
            ButtonsBehavior.validateAndApprove(!isInApprovalWorkflow());
            post = false;
        }
        return post;
    },
    onclickBackToAP: function () {
        ButtonsBehavior.backToAP("_Back to AP", "_Select back to ap reason", "BackToAP");
        return false;
    },
    onclickBackToPrevious: function () {
        ButtonsBehavior.approve("BackToPrevious");
        return false;
    },
    onclickReject: function () {
        ButtonsBehavior.reject("_Reject", "_Select reject reason", "Reject");
        return false;
    },
    onclickOnHold: function () {
        ButtonsBehavior.holdingInvoice("_Set on hold", "_Select on hold reason", "OnHold");
        return false;
    },
    onclickSetAside: function () {
        ButtonsBehavior.holdingInvoice("_Set aside title", "_Select aside reason", "Set_aside");
        return false;
    },
    onclickCreateInvoicingSchedule: function () {
        if (isContractValidForBillingScheduleCreation()) {
            return true;
        }
        Popup.Alert("_ContractReferenceNumberIsInvalid", true, null, "_FailedToCreateInvoicingSchedule");
        return false;
    },
    onclickToggleHistoryView: function () {
        EmbeddedViews.OnClickToggleButton("historyContext");
    },
    onclickToggleRelatedInvoicesView: function () {
        EmbeddedViews.OnClickToggleButton("relatedInvoicesContext");
    },
    onclickToggleVendorRelatedContractsView: function () {
        EmbeddedViews.OnClickToggleButton("vendorRelatedContractsContext");
    },
    onclickSaveTemplate: function () {
        const lineItemsTable = Data.GetTable("LineItems__");
        if (lineItemsTable.GetItemCount() > Lib.AP.Parameters.limitLinesItems) {
            Popup.Alert(["_You cannot save a template with more than {0} lines items.", Lib.AP.Parameters.limitLinesItems.toString()], false, null, "_Warning");
            return;
        }
        let templateName = Data.GetValue("CodingTemplate__");
        const saveTemplate = function () {
            Data.SetValue("CodingTemplate__", templateName);
            ProcessInstance.Approve("saveTemplate");
        };
        const fillSaveAs = function (dialog) {
            const ctrl_Template_Name = dialog.AddText("template_name", "_Template name");
            dialog.RequireControl(ctrl_Template_Name);
            ctrl_Template_Name.SetValue(templateName);
        };
        /**
         * Query.DBQuery callback
         * @this QueryResult
         */
        const existingTemplateNameCallBack = function () {
            const err = this.GetQueryError();
            if (err) {
                Popup.Alert(err);
            }
            else if (this.GetRecordsCount() > 0) {
                Popup.Confirm("_Confirm", false, saveTemplate, popupSelectionNameTemplate, "_the template name already exists");
            }
            else {
                saveTemplate();
            }
        };
        const validateDialog = function (dialog) {
            templateName = dialog.GetControl("template_name").GetValue();
            if (!templateName) {
                return;
            }
            // only keep 50 first chars (field size in database)
            templateName = templateName.substring(0, 50);
            const filter = `&(CompanyCode__=${Controls.CompanyCode__.GetValue()})(Template__=${templateName})`;
            Query.DBQuery(existingTemplateNameCallBack, "AP - Templates__", "CompanyCode__|Template__", filter, "", 1);
        };
        const popupSelectionNameTemplate = function () {
            Popup.Dialog("_Save template", null, fillSaveAs, null, validateDialog, null, null);
        };
        popupSelectionNameTemplate();
    },
    onclickLoadTemplate: function () {
        Controls.CodingTemplate__.DoBrowse();
    },
    onclickLoadClipboard: function () {
        LoadClipboard.ShowDialog();
    },
    onclickSimulate: function () {
        validateHeader();
        const lastPostError = Data.GetError("ERPInvoiceNumber__");
        Data.SetError("ERPInvoiceNumber__", "");
        const callback = (simulateResult, simulationReport) => {
            handleSimulationResult(simulateResult, simulationReport);
            LayoutHelper.DisableButtons(false, "onclickSimulate");
            Data.SetError("ERPInvoiceNumber__", lastPostError);
            this.Wait(false);
        };
        if (!Process.ShowFirstError()) {
            const customSimulateFunction = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.Simulate");
            if (typeof customSimulateFunction === "function") {
                customSimulateFunction();
            }
            else {
                LayoutHelper.DisableButtons(true, "onclickSimulate");
                this.Wait(true);
                Lib.AP.SAP.Invoice.Simulate.ERPSimulate(callback, true);
            }
        }
        else {
            // restore previous posting error
            Data.SetError("ERPInvoiceNumber__", lastPostError);
        }
        return false;
    },
    onclickSaveEditing_: function () {
        Lib.AP.ArchivedInvoices.OnSave();
    },
    /**
     * Handle the click of the ReverseInvoice button
     * Display a popup to confirm the user click
     */
    onClickReverseInvoice: function () {
        let popupConfig = {
            "title": "_Reverse invoice",
            "explanationLabel": "_Reverse invoice explanation message",
            "allowComment": true,
            "currentComment": Data.GetValue("Comment__"),
            "onClickOk": function (result) {
                const isInvoiceInProgress = Lib.AP.ArchivedInvoices.IsPostedAndToVerify();
                Data.SetValue("Comment__", result.comment);
                // reverse invoice
                Lib.AP.ArchivedInvoices.ReverseInvoice();
                if (isInvoiceInProgress) {
                    // Terminate workflow
                    ProcessInstance.Approve("reverseInvoice");
                }
                else {
                    ButtonsBehavior.onclickSaveEditing_();
                    ProcessInstance.SaveEditing_("reseal");
                }
            }
        };
        popupConfig = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizePopupOkConfig", popupConfig) || popupConfig;
        Lib.CommonDialog.PopupOkExtended(popupConfig);
    },
    onClickShowExtractedLineItems: function () {
        const invoiceStatus = Data.GetValue("InvoiceStatus__");
        const extractedLineItemsVisible = Controls.ExtractedLineItems__.IsVisible();
        Controls.AutocompleteExplanation__.Hide(extractedLineItemsVisible);
        Controls.ExtractedLineItems__.Hide(extractedLineItemsVisible);
        LayoutHelper.ExtractedLineItems.SetButtonText();
        if (LayoutHelper.ExtractedLineItems.HasTeachingInExtractedLines()) {
            Controls.ExtractedLineItems__.SetReadOnly(true);
            Controls.ExtractedLineItems__.HideTopNavigation(false);
            Controls.ExtractedLineItems__.HideBottomNavigation(false);
            Controls.AutocompleteExplanation__.SetHTML(`<div class="icon-warning"></div> <span>${Language.Translate("_AutocompleteTeachingMsg").replace(/\n/g, "<br>")}</span>`);
        }
        else if (invoiceStatus !== Lib.AP.InvoiceStatus.ToVerify && invoiceStatus !== Lib.AP.InvoiceStatus.SetAside) {
            Controls.ExtractedLineItems__.SetReadOnly(true);
            Controls.ExtractedLineItems__.HideTopNavigation(true);
            Controls.ExtractedLineItems__.HideBottomNavigation(true);
            Controls.AutocompleteExplanation__.SetHTML(`<div class="icon-warning"></div> <span>${Language.Translate("_AutocompleteImpossibleMsg").replace(/\n/g, "<br>")}</span>`);
        }
        else {
            Controls.AutocompleteExplanation__.SetHTML(Language.Translate("_AutocompleteHelpInfo").replace(/\n/g, "<br>"));
        }
    },
    onClickRequestCreditNotes: function () {
        function addMessageFromItem(item) {
            const mismatchAmount = item.GetValue("MismatchAmount__");
            if (mismatchAmount > 0) {
                const orderNumber = item.GetValue("OrderNumber__");
                const partNumber = item.GetValue("PartNumber__");
                const expectedAmount = item.GetValue("ExpectedAmount__");
                const expectedQuantity = item.GetValue("ExpectedQuantity__");
                const mismatchAmountInPercent = item.GetValue("MismatchAmountPercent__");
                const amount = item.GetValue("Amount__");
                const quantity = item.GetValue("Quantity__");
                itemsList.push(Language.Translate("_request credit notes message for price mismatch", false, orderNumber, partNumber, Language.FormatNumber(amount, { shorten: true, numberOfDecimals: 2 }), invoiceCurrency, quantity, Language.FormatNumber(expectedAmount, { shorten: true, numberOfDecimals: 2 }), expectedQuantity, Language.FormatNumber(mismatchAmount, { shorten: true, numberOfDecimals: 2 }), Language.FormatNumber(mismatchAmountInPercent, { shorten: true, numberOfDecimals: 2 })));
            }
        }
        const selectedIndexes = JSON.parse(Variable.GetValueAsString("SelectedLineItemsIndexes")) || [];
        const invoiceCurrency = Data.GetValue("InvoiceCurrency__");
        const itemsList = [];
        let message = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.CustomizeAutomaticMessage", "requestCreditNotes");
        if (selectedIndexes.length > 0) {
            // read previously saved indexes
            const lineItems = Data.GetTable("LineItems__");
            selectedIndexes.forEach((idx) => {
                let item = lineItems.GetItem(idx);
                item.SetSelected(true);
                if (!message) {
                    addMessageFromItem(item);
                }
            });
            Variable.SetValueAsString("SelectedLineItemsIndexes", JSON.stringify([]));
        }
        else {
            Controls.LineItems__.ForEachSelectedItem((item, idx) => {
                selectedIndexes.push(idx);
                if (!message) {
                    addMessageFromItem(item);
                }
            });
        }
        if (!message && itemsList.length > 0) {
            message = Language.Translate("_Conversation request credit note for invoice {0}, received on {1}, for a requested amound of {3} {4}: {5}", false, Data.GetValue("InvoiceNumber__"), Language.FormatDate(Data.GetValue("InvoiceDate__")), Language.FormatNumber(Data.GetValue("InvoiceAmount__"), { shorten: true, numberOfDecimals: 2 }), invoiceCurrency, itemsList.join("\n"));
        }
        if (!message) {
            Popup.Alert("_no elligible item selected", null, null, "_RequestCreditNotesPopupTitle");
            return;
        }
        const popupDisplayed = showContactVendorPopup(() => {
            Variable.SetValueAsString("SelectedLineItemsIndexes", JSON.stringify(selectedIndexes));
            ProcessInstance.Approve("ContactVendorForCreditNotes");
        });
        if (!popupDisplayed) {
            Controls.ConversationUI__.PrefillMessage(message);
            Controls.ConversationUI__.Focus();
        }
    },
    onClickPriceMismatchSort: function () {
        Controls.LineItems__.Sort({
            "columnName": "MismatchAmount__",
            "orderAsc": false
        });
    }
};
function onAddApproverClick() {
    Controls.ApproversList__.Wait(true);
    addApprover();
}
/** Teaching **/
const RequestTeaching = {
    GenericLayoutPrefix: "Layout_",
    comment: null,
    currentTab: null,
    teachingID: null,
    /** Checks that the teaching is possible, and initialises button action */
    Init: function () {
        Controls.Request_teaching.OnClick = RequestTeaching.DialogDisplay;
        this.RefreshButtonState();
    },
    RefreshButtonState: function () {
        const docAttached = Variable.GetValueAsString("DocAttached");
        const isTeachingDisabled = Sys.Parameters.GetInstance("AP").GetParameter("DisableTeaching") === "1";
        Controls.Request_teaching.SetDisabled(isTeachingDisabled || docAttached === null || docAttached === "0");
    },
    /** Set teaching parameter (the value must be converted to string)*/
    SetParameter: function (name, value) {
        if (!value) {
            value = "";
        }
        else if (typeof value === "object") {
            // Date
            value = Sys.Helpers.Date.Date2DBDateTime(value);
        }
        else {
            // Number, boolean
            value = value.toString();
        }
        Variable.SetValueAsString(name, value);
    },
    ValidateTab: function (tab, tabId) {
        if (tabId === "GenericLayoutTab") {
            const teachingIDControl = tab.GetControl("TeachingID");
            const checkNameResult = RequestTeaching.CheckTeachingRuleName(teachingIDControl.GetValue());
            if (checkNameResult.isError) {
                teachingIDControl.SetError(checkNameResult.errorMessage);
                return false;
            }
        }
        return true;
    },
    CheckTeachingRuleName: function (name) {
        const ret = {
            isError: false,
            errorMessage: ""
        };
        if (name && name !== "") {
            const regexp = /^[a-zA-Z0-9_ ()-]+$/;
            const forbiddenNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
            if (!regexp.exec(name)) {
                ret.isError = true;
                ret.errorMessage = "Unauthorized characters : the authorized special characters are : space, underscore, parenthesis and dash";
            }
            else if (name.length > 20) {
                ret.isError = true;
                ret.errorMessage = "Rule length exceeded : 20 characters maximum";
            }
            else if (forbiddenNames.indexOf(name.toUpperCase()) > -1) {
                ret.isError = true;
                ret.errorMessage = "Forbidden : This name is forbidden";
            }
        }
        return ret;
    },
    HandleTab: function (tab, tabId, event) {
        if (event === "OnFocus") {
            RequestTeaching.currentTab = tabId;
        }
    },
    FillDialog: function (dialog) {
        if (g_apParameters.GetParameter("EnableGenericLayoutTeaching") === "1") {
            RequestTeaching.currentTab = "StandardLayoutTab";
            dialog.AddTab("StandardLayoutTab", Language.Translate("_StandardTeachingTab"), null, RequestTeaching.FillTab, RequestTeaching.CommitTab, RequestTeaching.ValidateTab, RequestTeaching.HandleTab, null, null);
            dialog.AddTab("GenericLayoutTab", Language.Translate("_AdvancedTeachingTab"), null, RequestTeaching.FillTab, RequestTeaching.CommitTab, RequestTeaching.ValidateTab, RequestTeaching.HandleTab, null, null);
        }
        else {
            RequestTeaching.FillTab(dialog, "StandardLayoutTab");
        }
    },
    CommitTab: function (tab, tabId) {
        if (tabId === "GenericLayoutTab" && RequestTeaching.currentTab === "GenericLayoutTab") {
            RequestTeaching.teachingID = tab.GetControl("TeachingID").GetValue() || Process.GetTeachingKeyControl().GetValue();
            RequestTeaching.comment = tab.GetControl("CommentsAdvanced").GetValue();
        }
        else if (tabId === "StandardLayoutTab" && RequestTeaching.currentTab === "StandardLayoutTab") {
            RequestTeaching.teachingID = Process.GetTeachingKeyControl().GetValue();
            RequestTeaching.comment = tab.GetControl("comments").GetValue();
        }
    },
    FillTab: function (tab, tabId) {
        if (tabId === "StandardLayoutTab") {
            tab.AddSeparator();
            const messageControl = tab.AddDescription("message");
            messageControl.SetText("_You are about to send a teaching request for vendor number: {0}", Controls.VendorNumber__.GetValue());
            tab.AddSeparator();
            tab.AddSeparator();
            const label = tab.AddDescription("label");
            label.SetText("_Comments:");
            const commentsControl = tab.AddMultilineText("comments");
            commentsControl.SetLineCount(10);
        }
        else if (tabId === "GenericLayoutTab") {
            tab.AddSeparator();
            const layoutIdDesc = tab.AddDescription("message");
            layoutIdDesc.SetText("_GenericLayoutDescription");
            const TeachingID = tab.AddText("TeachingID");
            const layout = Data.GetValue("LayoutIdentifier__");
            if (layout && layout.indexOf(RequestTeaching.GenericLayoutPrefix) === 0) {
                TeachingID.SetValue(layout.slice(RequestTeaching.GenericLayoutPrefix.length));
            }
            tab.AddSeparator();
            tab.AddSeparator();
            const label = tab.AddDescription("label");
            label.SetText("_Comments:");
            const commentsControl = tab.AddMultilineText("CommentsAdvanced");
            commentsControl.SetLineCount(10);
        }
    },
    CallbackSendToTeaching: function () {
        Controls.Request_teaching.Wait(false);
        const error = JSON.parse(this.responseText).error;
        if (error === 0) {
            Popup.Alert("_The teaching request has been successfully submitted", false, null, "_Request Teaching");
        }
        else {
            Popup.Alert("_The teaching request has failed", true, null, "_Request Teaching");
        }
    },
    /** Commit dialog callback: Retrieves the dialog results and call the server script*/
    CommitDialogBox: function (dialog) {
        let teachingID = null;
        let comment = null;
        let prefix = "";
        let teachingBusinessPartnerName = Controls.VendorName__.GetValue();
        let teachingBusinessPartnerNumber = Controls.VendorNumber__.GetValue();
        if (RequestTeaching.currentTab === "GenericLayoutTab") {
            prefix = RequestTeaching.GenericLayoutPrefix;
            teachingBusinessPartnerName = "";
            teachingBusinessPartnerNumber = RequestTeaching.teachingID;
        }
        if (g_apParameters.GetParameter("EnableGenericLayoutTeaching") === "1") {
            teachingID = prefix + RequestTeaching.teachingID;
            comment = RequestTeaching.comment;
        }
        else {
            teachingID = Process.GetTeachingKeyControl().GetValue();
            comment = dialog.GetControl("comments").GetValue();
        }
        const teachingValidityDatetime = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.GetTeachingValidityDatetime") || undefined;
        ProcessInstance.SendToTeaching(RequestTeaching.CallbackSendToTeaching, !Variable.GetValueAsString("TeachingOwnerID") ? User.loginId : Variable.GetValueAsString("TeachingOwnerID"), "Teaching request", comment, Controls.NetAmount__.GetValue().toString(), Sys.Helpers.Date.Date2DBDateTime(Controls.InvoiceDate__.GetValue()), Controls.InvoiceNumber__.GetValue(), teachingBusinessPartnerName, teachingBusinessPartnerNumber, teachingID, teachingValidityDatetime);
        Log.Info("Request teaching sent to " + Variable.GetValueAsString("TeachingOwnerID"));
    },
    DialogDisplay: function () {
        const vendorNumber = Data.GetValue("VendorNumber__");
        const teachingKeyControl = Process.GetTeachingKeyControl();
        if (teachingKeyControl) {
            teachingKeyControl.SetValue(vendorNumber);
            // This process has a teaching key field (customer number): it is required for teaching
            const teachingKeyValue = teachingKeyControl.GetValue();
            if (!teachingKeyValue) {
                // The teaching key field should not be empty
                teachingKeyControl.Focus();
                Popup.Alert(["_The {0} is required for teaching", Language.Translate(Controls.VendorNumber__.GetLabelAlt())], true, null, "_Teaching request");
            }
            else {
                // Confirmation of the value of the teaching key field
                Popup.Dialog("_Teaching request", null, RequestTeaching.FillDialog, RequestTeaching.CommitDialogBox);
            }
        }
        else {
            // No teaching key field
            Popup.Alert("_No teaching key field, impossible to send a teaching request", true, null, "_ErrorTeachingKeyNotFound");
        }
    }
};
/** Invoice header **/
/**
 * Event when a vendor is selected from the browse page
 * @this DatabaseComboBox
 * @param item the browse item selected
 */
function onVendorSelectItem(item) {
    const isSelectedVendorDifferentFromCurrentVendor = (this.GetName() === "VendorName__") &&
        (Controls.VendorNumber__.GetValue() !== item.GetValue("Number__")) &&
        (item.GetValueOnFocus() === item.GetValue("Name__"));
    Controls.VendorNumber__.SetValue(item.GetValue("Number__"));
    Controls.VendorName__.SetValue(item.GetValue("Name__"));
    Controls.VendorStreet__.SetValue(item.GetValue("Street__"));
    Controls.VendorCity__.SetValue(item.GetValue("City__"));
    Controls.VendorZipCode__.SetValue(item.GetValue("PostalCode__"));
    Controls.VendorRegion__.SetValue(item.GetValue("Region__"));
    Controls.VendorCountry__.SetValue(item.GetValue("Country__"));
    Lib.AP.SetPaymentTermsAndSourceIfNeeded(item.GetValue("PaymentTermCode__"), Lib.AP.ComputedValueSource.VENDOR);
    Controls.VendorPOBox__.SetValue(item.GetValue("PostOfficeBox__"));
    // Fire the vendor OnChange event to populate vendor related fields if the event would not be
    // fired automatically (Can occur if two different vendors have the same name).
    if (isSelectedVendorDifferentFromCurrentVendor) {
        Controls.VendorNumber__.OnChange();
    }
}
// Set the icon and error/warning message in the VendorNumber__ field based on the vendor lifecycle status
// Set active as default for backward compatibility and for the case where there is no lifecycle status (SAP query)
function manageStatusInVendorField(vendorStatus, vendorStatusComment) {
    if (vendorStatus === Lib.P2P.VendorLifeCycleStatus.BLOCKED) // Block PO
     {
        Controls.VendorNumber__.SetInnerIcon(VendorLifeCycleStatusIcon.blockedIcon);
        Controls.VendorNumber__.SetError("");
        Controls.VendorNumber__.SetWarning(vendorStatusComment ?
            Language.Translate("_LifeCycleStatusBlocked: {0}", false, vendorStatusComment) :
            Language.Translate("_LifeCycleStatusBlocked"));
    }
    else if (vendorStatus === Lib.P2P.VendorLifeCycleStatus.DISABLED) // Block PO and invoice
     {
        Controls.VendorNumber__.SetInnerIcon(VendorLifeCycleStatusIcon.disabledIcon);
        Controls.VendorNumber__.SetWarning("");
        Controls.VendorNumber__.SetError(vendorStatusComment ?
            Language.Translate("_LifeCycleStatusDisabled: {0}", false, vendorStatusComment) :
            Language.Translate("_LifeCycleStatusDisabled"));
    }
    else {
        if (Data.IsNullOrEmpty("VendorNumber__")) {
            Controls.VendorNumber__.SetInnerIcon("");
        }
        else {
            Controls.VendorNumber__.SetInnerIcon(VendorLifeCycleStatusIcon.activeIcon);
            Controls.VendorNumber__.SetWarning("");
            Controls.VendorNumber__.SetError("");
        }
    }
}
/**
 * Event when a vendor is selected from the browse page
 * @this DatabaseComboBox
 * @param item the browse item selected
 */
function onAlternativePayeeSelectItem() {
    vendorContact.FillAlternativePayeeContactEmail();
}
function retrieveWithholdingTaxInfo() {
    const vendorNumber = Data.GetValue("VendorNumber__");
    return Lib.AP.GetInvoiceDocument().GetExtendedWithholdingTax(vendorNumber).Then(() => {
        LayoutHelper.DisableButtons(false, "onVendorChange");
    });
}
function RefreshExtendedWHTAmount(row, item) {
    Lib.AP.validateWHTItem(item);
    const isWHTTaxAmountNullOrEmpty = item.IsNullOrEmpty("WHTTaxAmount__");
    // set data to be sure to have access to the value in simulation
    item.SetValue("WHTTaxAmountAuto__", isWHTTaxAmountNullOrEmpty);
    // set control for immediat visibility
    if (row) {
        row.WHTTaxAmountAuto__.Check(isWHTTaxAmountNullOrEmpty);
    }
}
function onExtendedWHTRefreshRow(index) {
    RefreshExtendedWHTAmount(Controls.ExtendedWithholdingTax__.GetRow(index), Controls.ExtendedWithholdingTax__.GetItem(index));
}
function ExtendedWHTAmountChanged() {
    Controls.ExtendedWithholdingTax__.DisableLinesAudit(false);
    RefreshExtendedWHTAmount(this.GetRow(), this.GetItem());
}
function RefreshExtendedWHTAmounts() {
    Data.GetTable("ExtendedWithholdingTax__").ForEachItem(function (item, index) {
        RefreshExtendedWHTAmount(Controls.ExtendedWithholdingTax__.GetRow(index), item);
    });
}
function recomputeTaxOnDimensionChangeIfNeeded(item) {
    if (!Controls.ManualLink__.IsChecked() && Lib.ERP.IsSAP()) {
        const recomputeTax = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SAP.ShouldAddAccDataParameterForTaxComputation");
        if (Sys.Helpers.IsBoolean(recomputeTax) && recomputeTax) {
            if (item) {
                getTaxRateAndUpdateItem(item);
            }
            else {
                for (let i = 0; i < Controls.LineItems__.GetItemCount(); i++) {
                    getTaxRateAndUpdateItem(Controls.LineItems__.GetItem(i), null, true);
                }
            }
        }
    }
}
function GetVendor(isVendorNameChanged, vendorCtrl, invoiceDocument, callBack) {
    const getVendorByCustomField = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.GetVendorByCustomField", vendorCtrl, callBack);
    if (!getVendorByCustomField) {
        const vendorValue = vendorCtrl.GetValue();
        if (isVendorNameChanged) {
            Lib.P2P.Browse.GetVendorByName(callBack, Data.GetValue("CompanyCode__"), vendorValue, invoiceDocument);
        }
        else {
            Lib.P2P.Browse.GetVendorByNumber(callBack, Data.GetValue("CompanyCode__"), vendorValue, invoiceDocument);
        }
    }
}
/**
 * event triggered when Vendor (name or number) changes
 * @this DatabaseComboBox
 * @param manualLinkParams
 */
function onVendorChange(manualLinkParams) {
    const isVendorNameChanged = this.GetName() === "VendorName__";
    let waitforWHT = false;
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    LayoutHelper.DisableButtons(true, "onVendorChange");
    Data.SetValue("CodingTemplate__", "");
    if (!this.GetValue()) {
        callBack();
    }
    else {
        GetVendor(isVendorNameChanged, this, invoiceDocument, callBack);
    }
    function clearFields(queryResult, withholdingTaxParameter) {
        if (isVendorNameChanged) {
            Controls.VendorNumber__.SetValue("");
        }
        else {
            Controls.VendorName__.SetValue("");
        }
        Controls.VendorNumber__.SetInnerIcon("");
        Controls.VendorStreet__.SetValue("");
        Controls.VendorPOBox__.SetValue("");
        Controls.VendorCity__.SetValue("");
        Controls.VendorZipCode__.SetValue("");
        Controls.VendorRegion__.SetValue("");
        Controls.VendorCountry__.SetValue("");
        Controls.GHGEmissionFactor__.SetValue("");
        Variable.SetValueAsString("VendorLifeCycleStatusCode", "");
        Variable.SetValueAsString("VendorLifeCycleComment", "");
        Lib.AP.PeppolC5Reporting.ClearC5VendorReportingFields();
        const customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetVendorCustomFields");
        if (customFields) {
            customFields.forEach(function (field) {
                Data.SetValue(field.nameInForm, "");
            });
        }
        Variable.SetValueAsString("DefaultAlternativePayee", "");
        if (!manualLinkParams) {
            if (Lib.AP.ShouldUpdatePaymentTerms(Lib.AP.ComputedValueSource.VENDOR)) {
                Controls.PaymentTerms__.SetValue("");
            }
            // Keep value from invoice when called from GetInvoiceDocument
            Controls.WithholdingTax__.SetValue("");
            if (withholdingTaxParameter === "Extended") {
                const WHTTable = Data.GetTable("ExtendedWithholdingTax__");
                WHTTable.SetItemCount(0);
            }
        }
        EmbeddedViews.HideAllEmbeddedViewPanels();
        BankDetails.hide();
        Controls.SupplierInformationManagementLink__.SetDisabled(true);
        if (queryResult && queryResult.GetQueryError()) {
            Log.Error("You might need to install the latest view definition on your SAP server");
        }
    }
    function setFieldsAndReturnVatNumber(queryResult, erpManager, withholdingTaxParameter) {
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
        Controls.VendorStreet__.SetValue(queryResult.GetQueryValue("Street__", ind));
        Controls.VendorPOBox__.SetValue(queryResult.GetQueryValue("PostOfficeBox__", ind));
        Controls.VendorCity__.SetValue(queryResult.GetQueryValue("City__", ind));
        Controls.VendorZipCode__.SetValue(queryResult.GetQueryValue("PostalCode__", ind));
        Controls.VendorRegion__.SetValue(queryResult.GetQueryValue("Region__", ind));
        Controls.VendorCountry__.SetValue(queryResult.GetQueryValue("Country__", ind));
        Controls.GHGEmissionFactor__.SetValue(queryResult.GetQueryValue("GHGEmissionFactor__", ind));
        const vendorVATNumber = queryResult.GetQueryValue("VATNumber__", ind);
        // Update vendor lifecycle status and set
        let vendorStatus = queryResult.GetQueryValue("LifeCycleStatusCode__", ind);
        let vendorStatusComment = queryResult.GetQueryValue("LifeCycleComment__", ind);
        manageStatusInVendorField(vendorStatus, vendorStatusComment);
        Variable.SetValueAsString("VendorLifeCycleStatusCode", vendorStatus);
        Variable.SetValueAsString("VendorLifeCycleComment", vendorStatusComment);
        Lib.AP.PeppolC5Reporting.SetC5VendorReportingFieldsFromQuery(queryResult, ind);
        const customFields = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.GetVendorCustomFields");
        if (customFields) {
            customFields.forEach(function (field) {
                Data.SetValue(field.nameInForm, queryResult.GetQueryValue(field.nameInTable, ind));
            });
        }
        if (!manualLinkParams) {
            // Keep value from invoice when called from GetInvoiceDocument
            Lib.AP.SetPaymentTermsAndSourceIfNeeded(queryResult.GetQueryValue("PaymentTermCode__", ind), Lib.AP.ComputedValueSource.VENDOR);
            Controls.WithholdingTax__.SetValue(queryResult.GetQueryValue("WithholdingTax__", ind));
            if (withholdingTaxParameter === "Extended") {
                retrieveWithholdingTaxInfo();
                waitforWHT = true;
            }
        }
        EmbeddedViews.FillVisibleViews();
        const disable = !Controls.VendorNumber__.GetValue() || !Controls.VendorName__.GetValue();
        EmbeddedViews.SetDisabledAllButtons(disable);
        checkIBAN(true);
        BankDetails.getBankDetails(erpManager);
        Controls.SupplierInformationManagementLink__.SetDisabled(false);
        return vendorVATNumber;
    }
    function callBack(queryResult) {
        const erpManager = Lib.AP.GetInvoiceDocument();
        const withholdingTaxParameter = Lib.ERP.IsSAP() || Lib.ERP.IsGeneric() ? Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "") : "";
        const hasResult = queryResult && !queryResult.GetQueryError() && queryResult.Records && queryResult.Records.length > 0;
        let vendorVATNumber = null;
        recomputeTaxOnDimensionChangeIfNeeded(null);
        if (!hasResult) {
            clearFields(queryResult, withholdingTaxParameter);
        }
        else {
            vendorVATNumber = setFieldsAndReturnVatNumber(queryResult, erpManager, withholdingTaxParameter);
        }
        if (Sys.FRB2B.AP.IsInternationalEReportingEnabled()) {
            const wasCompliant = Data.GetValue("IsFlux10_1Compliant__");
            Sys.FRB2B.AP.SetFRB2BInternationalReportingData({
                CompanyCode: Data.GetValue("CompanyCode__"),
                VendorNumber: Data.GetValue("VendorNumber__")
            }, { VendorVATNumber: vendorVATNumber }).Then(() => {
                Controls.Flux10_1_SellerId__.SetValue("");
                //IsFlux10_1Compliant__ value has been set in SetFRB2BInternationalReportingData(), need to update fields visibility
                InitFlux10_1Fields(wasCompliant);
            });
        }
        if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
            Lib.P2P.GHGEmissions.ComputeVIPEstimatedGHGEmissions();
        }
        erpManager.ComputePaymentAmountsAndDates(true, true);
        erpManager.ResetBankDetailsSelection();
        // Reset extracted contract number because VendorNumber changed
        Data.SetValue("ContractNumber__", "");
        Data.SetValue("OriginalContractRUIDEX__", "");
        Data.SetValue("ContractReferenceNumber__", "");
        if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableContractGlobalSetting", "") === "1") {
            resetBillingScheduleFields();
            showBillingScheduleInstallments();
        }
        if (hasResult && manualLinkParams && manualLinkParams.manualLink && manualLinkParams.GetExtendedWithholdingTax) {
            // SAP request dependant on VendorCountry__
            manualLinkParams.GetExtendedWithholdingTax.apply(null, manualLinkParams.GetExtendedWithholdingTaxParams ? manualLinkParams.GetExtendedWithholdingTaxParams : []);
        }
        if (!waitforWHT) {
            LayoutHelper.DisableButtons(false, "onVendorChange");
        }
        checkPOInvoiceLineItemTableVendor();
        vendorContact.FillVendorContactEmail();
        if (Lib.AP.InvoiceType.isConsignmentInvoice() && Data.GetValue("VendorNumber__")) {
            Lib.AP.SAP.CheckVendorNumber();
        }
        if (Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments()) {
            if (Controls.BillingScheduleID__.GetValue() &&
                Controls.BillingScheduleDate__.GetValue()) {
                showBillingScheduleInstallments();
                setBillingScheduleLink(Controls.BillingScheduleID__.GetValue(), Controls.BillingScheduleDate__.GetValue(), User.culture);
                if (!ProcessInstance.isReadOnly) {
                    Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
                }
            }
            else {
                checkAndSetBillingScheduleInstallmentLayout();
            }
        }
        else {
            hideBillingScheduleInstallments();
        }
        if (Controls.IntercompanyInvoice__.IsChecked()) {
            g_topMessageWarning.Remove(Language.Translate("_Intercompany invoice warning"));
            Controls.IntercompanyInvoice__.SetValue(false);
            LayoutHelper.RefreshForManualLink();
            Lib.AP.WorkflowCtrl.Rebuild(true, true, "intercompanyInvoiceChanged");
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnVendorChange", queryResult);
    }
    Lib.AP.AnomalyDetection.OnChangeRefreshAnomaly();
    // reload P2P Parameters table values
    resetParameters();
}
function waitScreenDuringLoadTemplateAction(display) {
    Controls.ButtonLoadTemplate__.Wait(display);
}
function loadTemplate() {
    if (Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
        const invoiceDoc = Lib.AP.GetInvoiceDocument();
        const vendorNumber = Data.GetValue("VendorNumber__");
        const companyCode = Data.GetValue("CompanyCode__");
        const lineItemsTable = Data.GetTable("LineItems__");
        const templateName = Data.GetValue("CodingTemplate__");
        const extractedNetAmount = Data.GetValue("ExtractedNetAmount__");
        lineItemsTable.SetItemCount(0);
        const noResultCallback = function () {
            if (Data.GetValue("CodingTemplate__")) {
                Data.SetWarning("CodingTemplate__", "_TemplateWarning");
            }
        };
        const callbackForEachLine = function (item) {
            if (invoiceDoc.DoNotUseTaxCode()) {
                const taxRate = item.GetValue("TaxRate__");
                updateItemWithTaxRate(item, taxRate, 0);
            }
            else {
                getTaxRateAndUpdateItem(item, null, true);
                Lib.AP.TaxHelper.SetC5TaxTypeOnLineItem(item);
            }
            fillGLAndCCDescriptions(item);
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnLoadTemplateLine", item);
        };
        const callbackFinal = function () {
            if (!invoiceDoc.DoNotUseTaxCode()) {
                GetTaxRateForItemList();
            }
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnLoadTemplateEnd");
        };
        invoiceDoc.LoadTemplateForGLInvoice(extractedNetAmount, companyCode, vendorNumber, templateName, lineItemsTable, callbackForEachLine, noResultCallback, callbackFinal, waitScreenDuringLoadTemplateAction);
    }
}
function setGRIVMode(ignoreRefresh) {
    if (Lib.ERP.IsSAP()) {
        if (!ignoreRefresh) {
            Data.SetValue("GRIV__", false);
        }
    }
    else if (!Data.GetValue("GRIV__") && g_apParameters.IsReady()) {
        Data.SetValue("GRIV__", Lib.P2P.IsGRIVEnabledGlobally());
    }
    if (ignoreRefresh !== true) {
        LayoutHelper.AdaptProcessLayoutToInvoiceType(false);
    }
}
function switchERPAndUpdateLayout() {
    Lib.AP.GetInvoiceDocumentLayout().Reset();
    Lib.AP.ResetERPManager();
    Lib.AP.GetInvoiceDocumentLayout().Init();
    LayoutHelper.UpdateLayout();
    setGRIVMode();
}
function OnChangeVendorContactEmail() {
    const newEmail = Controls.VendorContactEmail__.GetValue();
    let error = "";
    if (newEmail && !Sys.Helpers.String.IsEmail(newEmail)) {
        error = "_Not a valid email address";
    }
    Controls.VendorContactEmail__.SetError(error);
    Controls.ContactVendor__.SetDisabled(Sys.Helpers.IsEmpty(newEmail));
    LayoutHelper.UpdateRequestCreditNoteButtons();
}
function onERPChange() {
    if (!Lib.AP.FormCleaner.isDataCleanForERP()) {
        Popup.Confirm("_This action will delete company code related fields.", false, function () {
            Lib.AP.FormCleaner.adaptDataToERP();
            switchERPAndUpdateLayout();
        }, Lib.AP.FormCleaner.revertERP, "_Warning");
    }
    else {
        Lib.AP.FormCleaner.adaptDataToERP();
        switchERPAndUpdateLayout();
    }
}
function onERPInvoiceNumberChange() {
    Lib.AP.GetInvoiceDocumentLayout().ManualLinkERPInvoiceNumber(Controls.ERPInvoiceNumber__, LayoutHelper, InvoiceLineItem);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnManualLinkERPInvoiceNumberEnd", Controls.ERPInvoiceNumber__);
}
function onMMERPInvoiceNumberChange() {
    Lib.AP.GetInvoiceDocumentLayout().ManualLinkERPInvoiceNumber(Controls.ERPMMInvoiceNumber__, LayoutHelper, InvoiceLineItem);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnManualLinkERPInvoiceNumberEnd", Controls.ERPMMInvoiceNumber__);
}
function OnEDIInvoiceTypeChange() {
    Sys.FRB2B.AP.ValidationRules.CheckInvoiceTypeBusinessProcessTypeConsistency("EDIInvoiceType__", "EDIBusinessProcessType__");
}
function showContactVendorPopup(OKCallback) {
    if (!Controls.PortalRuidEx__.GetValue()) {
        if (!Controls.VendorContactEmail__.GetError()) {
            const Cancel = function () {
                return false;
            };
            Popup.Confirm(Language.Translate("_Confirm create CI and contact vendor", true, Controls.VendorName__.GetValue()), false, OKCallback, Cancel, "_Contact the vendor");
            return true;
        }
        Controls.VendorContactEmail__.ShowErrorMessage();
    }
    else {
        Controls.ConversationUI__.Focus();
    }
    return false;
}
function onContactVendorClick() {
    showContactVendorPopup(() => {
        ProcessInstance.Approve("ContactVendor");
    });
    return false;
}
Controls.ContactVendor__.SetDisabled(Sys.Helpers.IsEmpty(Controls.VendorContactEmail__.GetValue()));
function onInvoiceTypeChange() {
    //Do not update others fields until the user validate the popup
    LayoutHelper.AdaptProcessLayoutToInvoiceType(true);
    Controls.InvoiceDescription__.SetValue("");
    Data.SetValue("CurrentException__", "");
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        Lib.P2P.GHGEmissions.ComputeVIPEstimatedGHGEmissions();
    }
    if (Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments()) {
        if (Controls.BillingScheduleID__.GetValue() &&
            Controls.BillingScheduleDate__.GetValue()) {
            showBillingScheduleInstallments();
            setBillingScheduleLink(Controls.BillingScheduleID__.GetValue(), Controls.BillingScheduleDate__.GetValue(), User.culture);
            if (!ProcessInstance.isReadOnly) {
                Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
            }
        }
        else {
            checkAndSetBillingScheduleInstallmentLayout();
        }
    }
    else {
        resetBillingScheduleFields();
        hideBillingScheduleInstallments();
    }
}
function onInvoiceAmountChange() {
    Lib.AP.GetInvoiceDocument().ComputePaymentAmountsAndDates(true, true);
    Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
    onLocalNetAmountUpdate();
    Lib.ERP.checkBalance(true);
    Lib.AP.AnomalyDetection.OnChangeRefreshAnomaly();
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        Lib.P2P.GHGEmissions.ComputeVIPEstimatedGHGEmissions();
    }
    CheckIfCreditNoteAmountMatches(Data.GetValue("RelatedInvoiceRuidEx__"));
    computeOutstandingExcludingReserves();
}
function isReserveClauseEligible() {
    return Sys.FRB2B.AP.IsFRB2B() && Sys.FRB2B.AP.IsReceptionMethodEDI();
}
function hasAnyReserveClauseValue() {
    const guarantee = Controls.ReserveClauseGuarantee__.GetValue();
    const prorata = Controls.ReserveClauseProrata__.GetValue();
    const insurance = Controls.ReserveClauseInsurance__.GetValue();
    return (guarantee != null && guarantee !== 0)
        || (prorata != null && prorata !== 0)
        || (insurance != null && insurance !== 0);
}
let reserveClauseVisibilityLocked = false;
function updateReserveClauseVisibility() {
    // Show fields if they have values (from EDI extraction or user input) OR if FR B2B EDI context.
    // Once shown because they had a value, keep them visible even if user clears them.
    const hasValues = hasAnyReserveClauseValue();
    if (hasValues) {
        reserveClauseVisibilityLocked = true;
    }
    const shouldShow = hasValues || reserveClauseVisibilityLocked || isReserveClauseEligible();
    Controls.ReserveClauseGuarantee__.Hide(!shouldShow);
    Controls.ReserveClauseProrata__.Hide(!shouldShow);
    Controls.ReserveClauseInsurance__.Hide(!shouldShow);
    Controls.InvoiceAmountExcludingReserveClauses__.Hide(!shouldShow);
}
function computeOutstandingExcludingReserves() {
    // Treat null/undefined InvoiceAmount as 0 to always display the remaining amount
    const invoiceAmount = Controls.InvoiceAmount__.GetValue() || 0;
    const guarantee = Controls.ReserveClauseGuarantee__.GetValue() || 0;
    const prorata = Controls.ReserveClauseProrata__.GetValue() || 0;
    const insurance = Controls.ReserveClauseInsurance__.GetValue() || 0;
    const precision = Lib.AP.GetAmountPrecision();
    const outstanding = Sys.Helpers.Round(invoiceAmount - guarantee - prorata - insurance, precision);
    Controls.InvoiceAmountExcludingReserveClauses__.SetValue(outstanding);
    updateReserveClauseVisibility();
}
function onReserveClauseFieldChange() {
    computeOutstandingExcludingReserves();
}
function updateNetAmountAndMismatch(netAmount, mismatchAmount) {
    Controls.NetAmount__.SetValue(netAmount);
    Controls.InvoiceMismatchAmount__.SetValue(mismatchAmount);
    if (Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant()) {
        Lib.AP.FRB2B.VatReverseCharge.CheckTotalTaxableAmountWarning();
    }
}
function onInvoiceMismatchAmountSetValue() {
    handleInvoiceMismatchAmount();
}
function handleInvoiceMismatchAmount() {
    ProcessInstance.SetSilentChange(true);
    let MismatchAmount = Data.GetValue("InvoiceMismatchAmount__");
    let isMismatchAmount = MismatchAmount > 0;
    LayoutHelper.UpdateRequestCreditNoteButtons();
    let warningMessage = isMismatchAmount ? Language.Translate("_mismatch amount warning", true, MismatchAmount) : "";
    Data.SetWarning("NetAmount__", warningMessage);
    ProcessInstance.SetSilentChange(false);
}
function adaptMismatchAmountWarningMessageToStep() {
    handleInvoiceMismatchAmount();
    const warningMessage = Controls.NetAmount__.GetWarning();
    const useLightLayout = !userIsAPOrAdmin() && !(currentStepIsController() && reviewersCanModifyLineItems());
    if (warningMessage && useLightLayout) {
        ProcessInstance.SetSilentChange(true);
        g_topMessageWarning.Add(warningMessage);
        Data.SetWarning("NetAmount__", "");
        ProcessInstance.SetSilentChange(false);
    }
}
function computGHGEmissionFactor() {
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        const vendorNumber = Data.GetValue("VendorNumber__");
        const companyCode = Data.GetValue("CompanyCode__");
        if (!vendorNumber) {
            Log.Warn("GetVendorRecord : No vendor number, cannot find vendor");
            return;
        }
        let filter = `(Number__=${vendorNumber})`;
        if (companyCode) {
            filter = `(&(CompanyCode__=${companyCode})${filter})`;
        }
        Sys.GenericAPI.Query("AP - Vendors__", filter, ["Currency__", "GHGEmissionFactor__"], (results, error) => {
            if (error) {
                Log.Error("error querying vendors : " + error);
            }
            else if (!results.length) {
                Log.Warn("No record found for vendor number [" + vendorNumber + "] and company code [" + companyCode + "]");
            }
            else {
                if (results[0].Currency__ === Data.GetValue("InvoiceCurrency__")) {
                    Data.SetValue("GHGEmissionFactor__", results[0].GHGEmissionFactor__);
                }
                else {
                    Data.SetValue("GHGEmissionFactor__", "");
                }
                Lib.P2P.GHGEmissions.ComputeVIPEstimatedGHGEmissions();
            }
        }, null, 1);
    }
}
function onUnplannedDeliveryCostsChange() {
    Lib.ERP.checkBalance(true);
}
function onInvoiceCurrencyChange() {
    // g_invoiceCurrency is updated later by checkInvoiceCurrency because we want to store a new value only if it is valid
    const oldCurrency = g_invoiceCurrency;
    const invoiceCurrency = Controls.InvoiceCurrency__.GetValue();
    checkInvoiceCurrency(invoiceCurrency);
    computGHGEmissionFactor();
    convertAmounts(oldCurrency)
        .Then(function (needBalanceUpdate) {
        Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
        if (needBalanceUpdate) {
            Lib.ERP.checkBalance(true);
        }
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnInvoiceCurrencyChangeEnd", invoiceCurrency, oldCurrency);
    });
    ReverseChargeTaxLayoutHelper.UpdateLocalFieldsVisibility();
}
function onManualExchangeRateChange() {
    const manualExchangeRate = Controls.ManualExchangeRate__.GetValue();
    if (manualExchangeRate != null) {
        Controls.ExchangeRate__.SetValue(manualExchangeRate.toString());
    }
    else {
        if (g_originalExchangeRate) {
            Controls.ExchangeRate__.SetValue(g_originalExchangeRate);
            const restoredManualExchangeRate = Number(g_originalExchangeRate);
            Controls.ManualExchangeRate__.SetValue(Number.isNaN(restoredManualExchangeRate) ? null : restoredManualExchangeRate);
        }
        else if (g_originalExchangeRate === undefined) {
            updateExchangeRate(Controls.InvoiceCurrency__.GetValue());
        }
        else {
            Controls.ExchangeRate__.SetValue("");
            Controls.ManualExchangeRate__.SetValue(null);
        }
    }
    //Recalculate LocalTaxAmount in Reverse charge tax lines with the new exchange rate
    if (Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant()) {
        ReverseChargeTaxLayoutHelper.RecomputeLocalTaxAmounts(Data.GetValue("ExchangeRate__"));
    }
    // Recalculate local and corporate amounts with the new exchange rate
    Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
    onLocalNetAmountUpdate();
    Lib.ERP.checkBalance(true);
}
function onCurrentExceptionChange() {
    Variable.SetValueAsString("isExtractionReviewException", "");
    const currentException = Data.GetValue("CurrentException__");
    if (currentException) {
        const options = {
            table: "WFRule",
            filter: `(&(Active=1)(name=${currentException}))`,
            attributes: ["WorkflowType"],
            maxRecords: 1
        };
        Sys.GenericAPI.PromisedQuery(options)
            .Then((queryResults) => {
            if (queryResults.length > 0) {
                queryResults.forEach((r) => {
                    Variable.SetValueAsString("manualExceptionType", r.WorkflowType);
                });
            }
            Lib.AP.WorkflowCtrl.Rebuild(true, true, "exceptionChanged");
        });
    }
    else {
        Variable.SetValueAsString("manualExceptionType", "");
        Lib.AP.WorkflowCtrl.Rebuild(true, true, "exceptionChanged");
    }
}
function showBillingScheduleInstallments() {
    const invoiceStatus = Controls.InvoiceStatus__.GetValue();
    if (invoiceStatus === Lib.AP.InvoiceStatus.ToVerify ||
        invoiceStatus === Lib.AP.InvoiceStatus.ToPost ||
        invoiceStatus === Lib.AP.InvoiceStatus.SetAside ||
        invoiceStatus === Lib.AP.InvoiceStatus.Received) {
        Controls.BillingScheduleLink__.SetBrowsable(true);
    }
    else {
        Controls.BillingScheduleLink__.SetBrowsable(false);
    }
    Controls.BillingScheduleLink__.Hide(false);
    Controls.BillingScheduleLinkForApprovers__.Hide(false);
    Controls.BillingScheduleSpacer__.Hide(false);
}
function hideBillingScheduleInstallments() {
    Controls.BillingScheduleLink__.SetBrowsable(false);
    Controls.BillingScheduleLink__.Hide(true);
    Controls.BillingScheduleLinkForApprovers__.Hide(true);
    Controls.BillingScheduleSpacer__.Hide(true);
}
function resetBillingScheduleFields() {
    ProcessInstance.SetSilentChange(true);
    Controls.BillingScheduleInstallment__.SetValue("");
    Controls.BillingScheduleID__.SetValue("");
    Controls.BillingScheduleLink__.SetValue("");
    Controls.BillingScheduleLinkForApprovers__.SetValue("");
    Controls.BillingScheduleLink__.DisplayAs({ type: "" });
    Controls.BillingScheduleLinkForApprovers__.SetValue("");
    Controls.BillingScheduleLinkForApprovers__.DisplayAs({ type: "" });
    Controls.BillingScheduleDate__.SetValue("");
    Variable.SetValueAsString("BillingScheduleMsnEx", "");
    Variable.SetValueAsString(Lib.P2P.BillingSchedule.VIPBillingScheduledErrorVariable, "");
    Variable.SetValueAsString(Lib.P2P.BillingSchedule.VIPBillingScheduledWarningVariable, "");
    Variable.SetValueAsString(Lib.P2P.BillingSchedule.VIPBillingScheduledInfoVariable, "");
    Controls.BillingScheduleLink__.SetError("");
    Controls.BillingScheduleLink__.SetWarning("");
    Controls.BillingScheduleLink__.SetInfo("");
    Controls.BillingScheduleLinkForApprovers__.SetError("");
    Controls.BillingScheduleLinkForApprovers__.SetWarning("");
    Controls.BillingScheduleLinkForApprovers__.SetInfo("");
    const worklowUpdated = Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(false, "resetBillingScheduleFields");
    ProcessInstance.SetSilentChange(false);
    Controls.CreateInvoicingSchedule.Hide(!Lib.P2P.BillingSchedule.CanCreateNewBillingSchedule());
    return worklowUpdated;
}
function setBillingScheduleFields(billingScheduleIDRUIDEX, installment, billingScheduleID, billingScheduleDate, costCenter) {
    Lib.P2P.BillingSchedule.SetBillingScheduleMsnex(billingScheduleIDRUIDEX);
    Data.SetValue("BillingScheduleInstallment__", installment);
    Data.SetValue("BillingScheduleID__", billingScheduleID);
    Data.SetValue("BillingScheduleDate__", billingScheduleDate);
    if (costCenter) {
        const lineItemsTable = Data.GetTable("LineItems__");
        for (let i = 0; i < lineItemsTable.GetItemCount(); ++i) {
            const item = lineItemsTable.GetItem(i);
            if (item && !item.GetValue("CostCenter__")) {
                item.SetValue("CostCenter__", costCenter);
                item.SetWarning("CostCenter__", "_ConfirmThisIsTheCorrectCostCenter");
                fillGLAndCCDescriptions(item);
            }
        }
    }
    setBillingScheduleLink(billingScheduleID, billingScheduleDate, User.culture);
    Controls.CreateInvoicingSchedule.Hide(true);
}
function setBillingScheduleLink(id, scheduleDate, userCulture) {
    const linkLabel = Lib.P2P.BillingSchedule.VIPGetBillingScheduleInstallmentLink(id, scheduleDate, userCulture);
    Controls.BillingScheduleLink__.SetValue(linkLabel);
    Controls.BillingScheduleLink__.DisplayAs({ type: "Link" });
    Controls.BillingScheduleLinkForApprovers__.SetValue(linkLabel);
    Controls.BillingScheduleLinkForApprovers__.DisplayAs({ type: "Link" });
}
function CheckIfBillingScheduleCreatedFromInvoiceAndSelectIt() {
    if (Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments() &&
        Data.IsNullOrEmpty("BillingScheduleID__") &&
        !Data.IsNullOrEmpty("ContractReferenceNumber__")) {
        Lib.P2P.BillingSchedule.VIPCheckIfABillingScheduleCreatedFromThisInvoice(Data.GetValue("RuidEx")).Then((billingScheduleExist) => {
            if (billingScheduleExist) {
                ProcessInstance.SetSilentChange(true);
                handleBillingScheduleDetermination(true);
                ProcessInstance.SetSilentChange(false);
            }
        });
    }
}
function handleBillingScheduleDetermination(skipReadOnlyAndPostCheck) {
    resetBillingScheduleFields();
    // Show empty Billing Schedule if no contact selected
    if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableContractGlobalSetting", "") === "1" && !Controls.ContractReferenceNumber__.GetValue()) {
        showBillingScheduleInstallments();
        return;
    }
    const isPosted = Boolean(Data.GetValue("ERPPostingDate__"));
    if (((!ProcessInstance.isReadOnly &&
        !isPosted)
        || skipReadOnlyAndPostCheck) &&
        Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments() &&
        !Controls.BillingScheduleID__.GetValue()) {
        Lib.P2P.BillingSchedule.VIPFindBillingScheduleMatchingContract("filterWithExactAmount")
            .Then((resultWithAmountFilter) => {
            if (resultWithAmountFilter.length === 0) {
                Lib.P2P.BillingSchedule.VIPFindBillingScheduleMatchingContract("filterWithoutAmount")
                    .Then((resultWithoutAmountFilter) => {
                    if (resultWithoutAmountFilter.length > 0) {
                        handleMatchedBillingSchedule(resultWithoutAmountFilter);
                    }
                });
            }
            else {
                // Show billing schedule fields before setting the value to ensure values are well displayed
                handleMatchedBillingSchedule(resultWithAmountFilter);
                return;
            }
            checkAndSetBillingScheduleInstallmentLayout();
        })
            .Catch((error) => {
            checkAndSetBillingScheduleInstallmentLayout();
            Log.Error(`Error in getting billing schedule matching contract ${Controls.ContractReferenceNumber__.GetValue()}. Error : ${error}`);
        });
    }
}
function onContractReferenceNumberUnknownOrEmptyValue() {
    if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableContractGlobalSetting", "") === "1") {
        Data.SetValue("ContractNumber__", null);
        Data.SetValue("OriginalContractRUIDEX__", null);
    }
    handleContractValidity();
    handleBillingScheduleDetermination();
}
function handleMatchedBillingSchedule(billingScheduleMatchingContractResult) {
    showBillingScheduleInstallments();
    setBillingScheduleFields(billingScheduleMatchingContractResult[0].BillingScheduleIDRUIDEX, billingScheduleMatchingContractResult[0].Installment, billingScheduleMatchingContractResult[0].BillingScheduleID, billingScheduleMatchingContractResult[0].BillingScheduleDate, billingScheduleMatchingContractResult[0].BillingScheduleCostCenter);
    if (billingScheduleMatchingContractResult[0].BillingScheduleApproveTolerance !== "1") {
        Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(false, "ContractNumberChanged");
        Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(false);
        Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable({
            autoApproveTolerance: false,
            foundBillingSchedule: null,
            withinTolerance: null,
            withinDateTolerance: null,
            withinAmountTolerance: null,
            fullyMatchedCostCenter: null,
            billingScheduleIsValidated: null
        });
        Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
    }
    else {
        Lib.P2P.BillingSchedule.VIPCheckBillingScheduleWithinTolerance({
            companyCode: Data.GetValue("CompanyCode__"),
            vendorNumber: Data.GetValue("VendorNumber__"),
            contractReferenceNumber: Data.GetValue("ContractReferenceNumber__"),
            contractNumber: Data.GetValue("ContractNumber__"),
            invoiceDate: Data.GetValue("InvoiceDate__"),
            localNetAmount: Sys.Helpers.String.ToFloat(Data.GetValue("LocalNetAmount__")),
            billingScheduleId: billingScheduleMatchingContractResult[0].BillingScheduleID,
            installmentDate: new Date(billingScheduleMatchingContractResult[0].BillingScheduleDate),
            installmentAmount: billingScheduleMatchingContractResult[0].BillingScheduleAmount,
            costCenterList: Lib.AP.GetCleanCostCenterListFromInvoice()
        }).Then(function (res) {
            Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(res.withinTolerance, "ContractNumberChanged");
            Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlag(res.withinTolerance);
            Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable(res);
            Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
        });
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnHandleMatchedBillingSchedule", billingScheduleMatchingContractResult);
}
function computeItemTaxAmount(item) {
    if (Controls.CalculateTax__.IsChecked()) {
        const taxrate = item.GetValue("TaxRate__");
        const netamount = item.GetValue("Amount__");
        const multitaxrates = item.GetValue("MultiTaxRates__");
        const taxamount = Sys.Helpers.Round(Lib.AP.ApplyTaxRate(netamount, taxrate, multitaxrates), Lib.AP.GetAmountPrecision());
        item.SetValue("TaxAmount__", taxamount);
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnSetItemTaxRateAndTaxAmount", item);
        Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
    }
    else {
        // The tax rate of the line item is only kept when its retrieval is decoupled from the automatic tax computation
        item.SetValue("TaxRate__", shouldRetrieveTaxRateWithoutTaxComputation() ? item.GetValue("TaxRate__") || 0 : 0);
    }
}
function updateLineItemsAmountRelatedFields(row) {
    const item = row.GetItem();
    RefreshAllowanceCharges(row);
    computeItemTaxAmount(item);
    Lib.AP.ComputeItemMismatchAmount(item);
    const headerAmounts = Lib.AP.GetInvoiceDocument().computeHeaderAmount();
    updateNetAmountAndMismatch(headerAmounts.netAmount, headerAmounts.mismatchAmount);
    Lib.AP.GetInvoiceDocument().ComputePaymentAmountsAndDates(true, Lib.AP.IsCreditNote());
    Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
    onLocalNetAmountUpdate();
    const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
    Lib.ERP.checkBalance(!isPosted);
    checkPOInvoiceLineItems();
}
function calculateInvoicedAmountFromUnitPrice(row, forceUnitPriceIfEmpty = false) {
    if (row.GetItem()) {
        const invoicedQuantity = row.Quantity__.GetValue();
        const invoicedAmount = row.Amount__.GetValue();
        let invoicedUnitPrice = row.InvoicedUnitPrice__.GetValue();
        let updateAmount = true;
        if (forceUnitPriceIfEmpty && invoicedUnitPrice === null) {
            // first try to compute the unit price if possible
            invoicedUnitPrice = Lib.P2P.ComputeUnitPrice(invoicedAmount, invoicedQuantity);
            if (invoicedUnitPrice !== null) {
                // no need to update amount in that case
                updateAmount = false;
            }
            else if (invoicedQuantity !== null && Sys.Helpers.IsNumeric(invoicedQuantity) && invoicedAmount === null) {
                //  force invoiced unit price to unit price to ease user experience when feeding the quantity
                invoicedUnitPrice = row.UnitPrice__.GetValue();
            }
            row.InvoicedUnitPrice__.SetValue(invoicedUnitPrice);
        }
        if (updateAmount) {
            // finally compute the amount based on the unit Price
            if (invoicedQuantity === null || invoicedUnitPrice === null || isNaN(invoicedQuantity) || isNaN(invoicedUnitPrice)) {
                row.Amount__.SetValue(null);
            }
            else {
                row.Amount__.SetValue(invoicedQuantity * invoicedUnitPrice);
            }
            row.Amount__.SetInfo("");
            row.Amount__.SetWarning("");
            row.Amount__.SetError("");
            updateLineItemsAmountRelatedFields(row);
        }
    }
}
/**
 * Computes and sets the quantity for a line item based on the amount and unit price if the quantity is not already defined.
 * Applicable only for PO line items.
 */
function computeQuantityIfEmptyFromAmountAndUnitPrice(row) {
    if (Lib.P2P.InvoiceLineItem.IsPOLikeLineItem(row.GetItem())) {
        let invoicedQuantity = row.Quantity__.GetValue();
        const invoicedAmount = row.Amount__.GetValue();
        const invoicedUnitPrice = row.InvoicedUnitPrice__.GetValue();
        if ((invoicedQuantity === null || isNaN(invoicedQuantity)) && invoicedAmount && invoicedUnitPrice) {
            invoicedQuantity = Lib.P2P.ComputeQuantity(invoicedAmount, invoicedUnitPrice);
            row.Quantity__.SetValue(invoicedQuantity);
        }
    }
}
function defaultUnitPriceIfEmptyOnAmountChanged(row) {
    if (Lib.P2P.InvoiceLineItem.IsPOLikeLineItem(row.GetItem())) {
        const invoicedQuantity = row.Quantity__.GetValue();
        const invoicedAmount = row.Amount__.GetValue();
        const invoicedUnitPrice = row.InvoicedUnitPrice__.GetValue();
        if (invoicedUnitPrice === null && invoicedAmount !== null && Sys.Helpers.IsNumeric(invoicedAmount) && invoicedQuantity === null) {
            //  force invoiced unit price to unit price to ease user experience
            row.InvoicedUnitPrice__.SetValue(row.UnitPrice__.GetValue());
        }
    }
}
function onLocalNetAmountUpdate(callerArgument = false) {
    const isPosted = Boolean(Data.GetValue("ERPPostingDate__"));
    if (!callerArgument &&
        !ProcessInstance.isReadOnly &&
        !isPosted &&
        Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments() &&
        Controls.BillingScheduleID__.GetValue()) {
        Lib.P2P.BillingSchedule.VIPValidateIfFullyMatched()
            .Then((result) => {
            Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(result.withinTolerance, "NetAmountChanged-BillingScheduleWkfRebuild");
            Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable(result);
            Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
        });
    }
}
function onContractReferenceNumberSelect(selectedItem) {
    if (Data.GetValue("ContractReferenceNumber__") === selectedItem.GetValue("ReferenceNumber__") &&
        Data.GetValue("ContractNumber__") !== selectedItem.GetValue("ContractNumber__")) {
        Data.SetValue("ContractReferenceNumber__", selectedItem ? selectedItem.GetValue("ReferenceNumber__") : null);
        Data.SetValue("ContractNumber__", selectedItem ? selectedItem.GetValue("ContractNumber__") : null);
        Data.SetValue("OriginalContractRUIDEX__", selectedItem ? selectedItem.GetValue("OriginalContractRUIDEX__") : null);
        handleContractValidity();
        handleBillingScheduleDetermination();
    }
    else {
        Data.SetValue("ContractReferenceNumber__", selectedItem ? selectedItem.GetValue("ReferenceNumber__") : null);
        Data.SetValue("ContractNumber__", selectedItem ? selectedItem.GetValue("ContractNumber__") : null);
        Data.SetValue("OriginalContractRUIDEX__", selectedItem ? selectedItem.GetValue("OriginalContractRUIDEX__") : null);
        handleContractValidity();
    }
}
function onBillingScheduleLinkClick() {
    const contractReferenceNumber = Data.GetValue("ContractReferenceNumber__");
    const contractNumber = Data.GetValue("ContractNumber__");
    const billingScheduleID = Data.GetValue("BillingScheduleID__");
    Sys.GenericAPI.PromisedQuery({
        table: Lib.P2P.BillingSchedule.BillingScheduledFormName,
        filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ContractReferenceNumber__", contractReferenceNumber), Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", contractNumber), Sys.Helpers.LdapUtil.FilterEqual("BillingScheduleID__", billingScheduleID), Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("BillingScheduleStatus__", Lib.P2P.BillingSchedule.BillingScheduleState.ToApprove), Sys.Helpers.LdapUtil.FilterEqual("BillingScheduleStatus__", Lib.P2P.BillingSchedule.BillingScheduleState.Approved))).toString(),
        attributes: ["ruidex"],
        maxRecords: 1,
        additionalOptions: {
            useConstantQueryCache: true,
            searchInArchive: true
        }
    }).Then((result) => {
        if (result && result.length > 0) {
            Process.OpenMessage({
                ruidEx: result[0].ruidex,
                goBackOnQuit: true,
                inNewTab: true,
                additionalParameters: {}
            });
        }
    });
}
function onBillingScheduleInstallmentSelect(item) {
    resetBillingScheduleFields();
    Data.SetValue("ContractNumber__", item.GetValue("ContractNumber__"));
    Data.SetValue("ContractReferenceNumber__", item.GetValue("ContractReferenceNumber__"));
    Data.SetValue("OriginalContractRUIDEX__", item.GetValue("OriginalContractRUIDEX__"));
    Lib.P2P.BillingSchedule.VIPCheckBillingScheduleWithinTolerance({
        companyCode: Data.GetValue("CompanyCode__"),
        vendorNumber: Data.GetValue("VendorNumber__"),
        contractReferenceNumber: Data.GetValue("ContractReferenceNumber__"),
        contractNumber: Data.GetValue("ContractNumber__"),
        invoiceDate: Data.GetValue("InvoiceDate__"),
        localNetAmount: Sys.Helpers.String.ToFloat(Data.GetValue("LocalNetAmount__")),
        billingScheduleId: item.GetValue("BillingSchedule__"),
        installmentDate: new Date(item.GetValue("BillingDate__")),
        installmentAmount: Sys.Helpers.String.ToFloat(item.GetValue("Amount__")),
        costCenterList: Lib.AP.GetCleanCostCenterListFromInvoice()
    })
        .Then((result) => {
        setBillingScheduleFields(item.GetValue("BillingScheduleRUIDEX__"), item.GetValue("Installment__"), item.GetValue("BillingSchedule__"), item.GetValue("BillingDate__"), result.billingScheduleCostCenter);
        Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(result.withinTolerance, "billingScheduleSelected");
        Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable(result);
        Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
    });
}
function onBillingScheduleInstallmentBrowse() {
    const commonFilter = [
        Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", "%[CompanyCode__]").toString(),
        Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", "%[VendorNumber__]").toString(),
        Sys.Helpers.LdapUtil.FilterEqual("InvoiceNumber__", "").toString()
    ];
    if (Controls.ContractReferenceNumber__.GetValue() && Controls.ContractNumber__.GetValue()) {
        commonFilter.push(Sys.Helpers.LdapUtil.FilterEqual("ContractReferenceNumber__", "%[ContractReferenceNumber__]").toString());
        commonFilter.push(Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", "%[ContractNumber__]").toString());
    }
    Controls.BillingScheduleInstallment__.SetFilter(Sys.Helpers.LdapUtil.FilterAnd(...commonFilter).toString());
}
function handleContractValidity() {
    if (Sys.Parameters.GetInstance("P2P").GetParameter("EnableContractGlobalSetting", "") === "1") {
        Lib.AP.Contract.HandleContractValidity();
    }
}
function isContractValidForBillingScheduleCreation() {
    return Controls.ContractReferenceNumber__.GetWarning() !== Language.Translate("_InvalidContractNumber") &&
        Controls.ContractReferenceNumber__.GetValue() !== "" &&
        Controls.ContractReferenceNumber__.GetValue() !== null;
}
function onSortLineItems() {
    Variable.SetValueAsString("LineItemsSorted", true);
}
function applyCompanyCodeChange() {
    const previousERP = Data.GetValue("ERP__");
    Lib.AP.FormCleaner.adaptDataToCompanyCode();
    const currentERP = Data.GetValue("ERP__");
    if (currentERP !== previousERP) {
        switchERPAndUpdateLayout();
    }
    Lib.AP.GetInvoiceDocumentLayout().SetPostingDatePlaceholder();
}
function onCompanyCodeChange() {
    // To be sure all information have been retrieved.
    // Allow to call every method synchronously
    Lib.P2P.CompanyCodesValue.QueryValues(Data.GetValue("CompanyCode__")).Then(function ( /*ccValues*/) {
        if (!Lib.AP.FormCleaner.isDataClean()) {
            Popup.Confirm("_This action will delete company code related fields.", false, applyCompanyCodeChange, Lib.AP.FormCleaner.revertCompanyCode, "_Warning");
        }
        else {
            applyCompanyCodeChange();
        }
    });
}
function onOrderNumberChange() {
    Lib.AP.TrimOrderNumbers();
}
/**
 * event when line item Assignment number changes
 * @this ShortText in Line Item
 */
function onConsignmentNumberChange() {
    Lib.AP.SAP.Consignment.OnChange(this.GetValue(), fillGLAndCCDescriptions, GetTaxRateForItemList, LayoutHelper);
}
function onInvoiceDescriptionChange() {
    const count = Controls.LineItems__.GetItemCount();
    for (let i = 0; i < count; i++) {
        InvoiceLineItem.FillLineItemDescription(Controls.LineItems__.GetItem(i), i);
    }
}
function onAssignmentChange() {
    const count = Controls.LineItems__.GetItemCount();
    for (let i = 0; i < count; i++) {
        InvoiceLineItem.FillLineItemAssignment(Controls.LineItems__.GetItem(i), i);
    }
}
function getCostCenterDescriptionFromId(CCId, callback, companyCode) {
    Lib.P2P.Browse.GetCostCenterDescription(callback, companyCode, CCId, "AP");
}
/**
 * event when line item cost center changes
 * @this DatabaseComboBox in Line Item
 */
function onCostCenterChange() {
    const item = this.GetItem();
    const row = this.GetRow();
    recomputeTaxOnDimensionChangeIfNeeded(item);
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    const genericParameter = invoiceDocument.GenericDimensionParameter("CostCenter");
    const param = genericParameter ? GetFillGenericDimensionERPParameters(item, "CostCenter__") : GetFillCostCenterParameters(item);
    Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, param);
    if (Controls.ContractReferenceNumber__.GetValue() && Controls.ContractNumber__.GetValue() && Controls.BillingScheduleID__.GetValue()) {
        const costCenterList = Lib.AP.GetCleanCostCenterListFromInvoice();
        if (costCenterList.length === 1) {
            Lib.P2P.BillingSchedule.VIPValidateIfFullyMatched()
                .Then((result) => {
                Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(result.withinTolerance, "CostCenterChanged-BillingScheduleWkfRebuild");
                Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable(result);
                Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
            });
        }
        else {
            Lib.P2P.BillingSchedule.VIPSetApprovalWorkflowFlagAndRebuildIfNeeded(false, "CostCenterChanged-BillingScheduleWkfRebuild");
            if (Variable.GetValueAsString(Lib.P2P.BillingSchedule.VIPBillingScheduledInfoVariable) === "" ||
                Variable.GetValueAsString(Lib.P2P.BillingSchedule.VIPBillingScheduledInfoVariable) === "_CostCenterNotInToleranceWorkflowIsRequired" ||
                Variable.GetValueAsString(Lib.P2P.BillingSchedule.VIPBillingScheduledInfoVariable) === "_ApprovalWorkflowIsRequired") {
                Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessageVariable({
                    autoApproveTolerance: true,
                    foundBillingSchedule: true,
                    withinTolerance: false,
                    withinDateTolerance: true,
                    withinAmountTolerance: true,
                    fullyMatchedCostCenter: false,
                    billingScheduleIsValidated: true
                });
                Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
            }
        }
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnCostCenterChanged", item, row);
    Lib.AP.WorkflowCtrl.UpdateWorkflowOnDimensionUpdate("costCenterUpdated");
}
/** event when line item Company code changes
 * @this DatabaseComboBox in Line Item
 */
function onCrossItemCompanyCodeChange() {
    Lib.AP.Browse.UpdateFieldsOnCrossCompanyCodeUpdate(this);
    Lib.AP.WorkflowCtrl.UpdateWorkflowOnDimensionUpdate("crossCompanyCodeUpdated");
}
/** event when line item WBS element changes
 * @this DatabaseComboBox in Line Item
 */
function onWBSElementChange() {
    const callback = (wbsElemID) => {
        const item = this.GetItem();
        if (!item) {
            LayoutHelper.DisableButtons(false, "onWBSElementChange");
            return;
        }
        if (!wbsElemID) {
            item.SetValue("WBSElementID__", "");
        }
        else {
            item.SetValue("WBSElementID__", wbsElemID);
        }
        LayoutHelper.DisableButtons(false, "onWBSElementChange");
    };
    LayoutHelper.DisableButtons(true, "onWBSElementChange");
    if (!this.GetValue()) {
        callback("");
    }
    else {
        Lib.AP.Browse.GetWBSElementID(callback, Data.GetValue("CompanyCode__"), this.GetValue());
    }
}
function getProfitCenterDescription(profitCenter, callback, companyCode) {
    Lib.AP.Browse.GetProfitCenterDescription(callback, companyCode, profitCenter, "AP");
}
/** event when line profit center element changes
 * @this DatabaseComboBox in Line Item
 */
function onProfitCenterChange() {
    const callback = (profitCenterDescription) => {
        const item = this.GetItem();
        if (!item) {
            LayoutHelper.DisableButtons(false, "onProfitCenterChange");
            return;
        }
        if (!profitCenterDescription) {
            item.SetValue("ProfitCenterDescription__", "");
        }
        else {
            item.SetValue("ProfitCenterDescription__", profitCenterDescription);
        }
        LayoutHelper.DisableButtons(false, "onProfitCenterChange");
    };
    LayoutHelper.DisableButtons(true, "onProfitCenterChange");
    const item = this.GetItem();
    Lib.AP.Browse.GetProfitCenterDescription(callback, Lib.AP.GetLineItemCompanyCode(item), this.GetValue(), "AP");
}
/**
 * event when line item Custom Dimension X code changes
 * @this DatabaseComboBox in Line Item
 * @param dimensionIndex number from 1 to 10
 */
function onCustomDimensionChange(dimensionIndex) {
    // Do nothing if a legacy connector is used or if the dimension is not defined in the ERP connector
    if (Lib.ERP.CustomERP.Common.IsLegacyConnectorUsed()) {
        return;
    }
    const item = this.GetItem();
    /**
     * /!\ When doing something about
     * Z_CustomDimension_#_Code__
     * or
     * Z_CustomDimension_#_CodeDescription__
     * fields, make sure to check that we are not using a legacy connector.
     *
     * Fields with the same name are used by Bizlab connectors so not checking may lead to issues.
     *
     * A good way to check is to use the function Lib.ERP.CustomERP.Common.IsLegacyConnectorUsed as shown above.
     */
    const param = {
        "value": item.GetValue("Z_CustomDimension_" + dimensionIndex + "_Code__"),
        "formCodeField": "Z_CustomDimension_" + dimensionIndex + "_Code__",
        "formDescriptionField": "Z_CustomDimension_" + dimensionIndex + "_CodeDescription__",
        "formFields": ["Z_CustomDimension_" + dimensionIndex + "_CodeDescription__"],
        "tableFields": ["Description__"],
        "tableKeyField": "CustomDimension" + dimensionIndex + "__",
        "table": "P2P - Custom Dimension " + dimensionIndex + "__",
        "disableButtons": LayoutHelper.DisableButtons,
        "companyCode": Lib.AP.GetLineItemCompanyCode(item)
    };
    Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, param);
}
function onRelatedInvoiceSelectItem(item) {
    if (item) {
        LayoutHelper.UpdateRelatedInvoiceLink(item.GetValue("RuidEx"), true, item.GetValue("OwnerID"));
    }
    else {
        Log.Error("onRelatedInvoiceSelectItem called with a null item");
    }
}
function onRelatedInvoiceChange() {
    if (!Controls.RelatedInvoiceRuidEx__.GetValue() && Controls.RelatedInvoice__.GetValue()) {
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterNotIn("InvoiceStatus__", [Lib.AP.InvoiceStatus.Rejected, Lib.AP.InvoiceStatus.Reversed]), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"), Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0"), Sys.Helpers.LdapUtil.FilterEqualOrExist("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__")), Sys.Helpers.LdapUtil.FilterEqual("InvoiceNumber__", Data.GetValue("RelatedInvoice__"))).toString();
        Sys.GenericAPI.PromisedQuery({
            table: "CDNAME#Vendor invoice",
            filter: filter,
            attributes: ["RuidEx", "InvoiceNumber__", "OwnerID"],
            maxRecords: 10,
            additionalOptions: {
                searchInArchive: true,
                queryOptions: "FastSearch=1"
            }
        }).Then((queryResults) => {
            if (queryResults && queryResults.length > 0) {
                if (queryResults.length === 1) {
                    LayoutHelper.UpdateRelatedInvoiceLink(queryResults[0].RuidEx, true, queryResults[0].OwnerID);
                }
                else {
                    Controls.RelatedInvoice__.SetWarning(Language.Translate("_Several invoices matching warning"));
                    Controls.RelatedInvoiceForApprovers__.SetWarning(Language.Translate("_Several invoices matching warning"));
                }
            }
            else {
                Controls.RelatedInvoice__.SetWarning(Language.Translate("_No matching invoice warning"));
                Controls.RelatedInvoiceForApprovers__.SetWarning(Language.Translate("_No matching invoice warning"));
            }
        });
    }
}
function CheckIfCreditNoteAmountMatches(invoiceLinkedRuidex) {
    if (Sys.Parameters.GetInstance("AP").GetParameter("ExceptionResolutionMode", Lib.AP.ExceptionResolutionMode.Header) !== Lib.AP.ExceptionResolutionMode.Header) {
        if (!invoiceLinkedRuidex || !Lib.AP.IsCreditNote()) {
            Controls.InvoiceAmount__.SetWarning(null);
            return;
        }
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("RuidEx", invoiceLinkedRuidex)).toString();
        Sys.GenericAPI.PromisedQuery({
            table: "CDNAME#Vendor invoice",
            filter: filter,
            attributes: ["InvoiceClaimedAmount__"],
            maxRecords: 1,
            additionalOptions: {
                searchInArchive: true,
                queryOptions: "FastSearch=1"
            }
        }).Then((queryResults) => {
            if (queryResults && queryResults.length > 0) {
                const invoiceClaimedAmount = queryResults[0].InvoiceClaimedAmount__;
                const parsedClaimedAmount = Number.parseFloat(invoiceClaimedAmount);
                if (Lib.AP.isCreditNoteMatchingOriginalInvoice(parsedClaimedAmount)) {
                    Controls.InvoiceAmount__.SetWarning(null);
                }
                else {
                    if (!Sys.Helpers.IsEmpty(invoiceClaimedAmount) && Number.isFinite(parsedClaimedAmount)) {
                        Controls.InvoiceAmount__.SetWarning(Language.Translate("_Credit note does not match the related invoice, invoice claimed amount {0} warning", false, invoiceClaimedAmount));
                    }
                    else {
                        Controls.InvoiceAmount__.SetWarning(Language.Translate("_Credit note does not match the related invoice, invoice claimed amount is missing or invalid warning", false));
                    }
                }
            }
            else {
                Log.Error("No invoice found with the provided RuidEx: " + invoiceLinkedRuidex);
            }
        });
    }
}
/** event when line item Order number is clicked on
 * @this ShortText in Line Item
 */
function onOrderNumberClick() {
    LayoutHelper.DisableButtons(true, "onOrderNumberClick");
    /**
     * Query.DBQuery callback
     * @this QueryResult
     */
    const callbackSearchPO = function () {
        const queryValue = this.GetQueryValue();
        if (queryValue.Records && queryValue.Records.length > 0) {
            Process.OpenLink(queryValue.Records[0][1]);
        }
        else {
            Popup.Alert("_Purchase order not found or access denied", false, null, "_Purchase order not found title");
        }
        LayoutHelper.DisableButtons(false, "onOrderNumberClick");
    };
    const attributes = "MsnEx|ValidationURL";
    const filter = "OrderNumber__=" + this.GetValue();
    Query.DBQuery(callbackSearchPO, "CDNAME#Purchase order V2", attributes, filter, "", 1);
}
function onLineItemDelete(item) {
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnLineItemDelete", item);
    const headerAmounts = Lib.AP.GetInvoiceDocument().computeHeaderAmount();
    updateNetAmountAndMismatch(headerAmounts.netAmount, headerAmounts.mismatchAmount);
    Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
    Lib.AP.GetInvoiceDocument().ComputePaymentAmountsAndDates(true, Lib.AP.IsCreditNote());
    Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
    Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
    onLocalNetAmountUpdate();
    Lib.ERP.checkBalance(true);
    InvoiceLineItem.RemoveLineItem(item);
    checkPOInvoiceLineItems();
    setTimeout(() => {
        InvoiceLineItem.UpdateLineItemsLayout();
    }, 50);
}
/**
 * event when line item Amount changes
 * @this Decimal in Line Item
 */
function lineItemsAmountChanged() {
    const item = this.GetItem();
    // If an item is not a GL Item and is Amount based, the quantity is hidden and set to be equal to the amount
    if (Lib.P2P.InvoiceLineItem.IsAmountBasedRow(this.GetRow()) && !Lib.P2P.InvoiceLineItem.IsGLLineItem(item)) {
        const amount = this.GetRow().Amount__.GetValue();
        this.GetRow().Quantity__.SetValue(amount);
    }
    defaultUnitPriceIfEmptyOnAmountChanged(this.GetRow());
    computeQuantityIfEmptyFromAmountAndUnitPrice(this.GetRow());
    Lib.AP.ComputeInvoicedUnitPrice(item);
    updateLineItemsAmountRelatedFields(this.GetRow());
}
/**
 * event when line item Quantity changes
 * @this Decimal in Line Item
 */
function lineItemsQuantityChanged() {
    const item = this.GetItem();
    if (item) {
        checkPOInvoiceLineItems();
    }
    calculateInvoicedAmountFromUnitPrice(this.GetRow(), true);
}
/**
 * event when line item invoiced unit price changes
 * @this Decimal in Line Item
 */
function lineItemsInvoicedUnitPriceChanged() {
    computeQuantityIfEmptyFromAmountAndUnitPrice(this.GetRow());
    calculateInvoicedAmountFromUnitPrice(this.GetRow(), false);
}
function taxCodeConvertedInUpperCase(control) {
    const taxCode = control.GetValue();
    if (taxCode && Lib.ERP.IsSAP()) {
        control.SetValue(taxCode.substring(0, 2).toUpperCase());
    }
}
function calculateTaxAmounts(control) {
    const taxCode = control.GetValue();
    const item = control.GetItem();
    if (taxCode) {
        getTaxRateAndUpdateItem(item);
    }
    else {
        updateItemWithTaxRate(item, 0, 0);
    }
    // The tax code has been manually changed - unset the warning if any
    control.SetWarning("");
}
/**
 * event when line item Tax code changes
 * @this DatabaseComboBox in Line Item
 */
function lineItemsTaxCodeChanged() {
    taxCodeConvertedInUpperCase(this);
    if (Controls.CalculateTax__.IsChecked() || shouldRetrieveTaxRateWithoutTaxComputation()) {
        calculateTaxAmounts(this);
    }
    Lib.AP.TaxHelper.SetC5TaxTypeOnLineItem(this.GetItem());
}
function lineItemsTaxRateChanged() {
    const changedItem = this.GetItem();
    const taxRate = this.GetValue();
    updateItemWithTaxRate(changedItem, taxRate, 0);
    // After entering a tax rate on a line item, it is duplicated on all other lines with no previous tax rate specified
    Controls.LineItems__.ForEachItem((item) => {
        if (item && !item.GetValue("TaxRate__")) {
            item.SetValue("TaxRate__", taxRate);
            updateItemWithTaxRate(item, taxRate, 0);
        }
    });
}
function displayInvoiceLinePeriodIfHasValue() {
    const table = Data.GetTable("LineItems__");
    let hasValue = false;
    let i = 0;
    while (!hasValue && i < table.GetItemCount()) {
        const item = table.GetItem(i);
        if (item.GetValue("InvoiceLinePeriodStartDate__") || item.GetValue("InvoiceLinePeriodEndDate__") || Sys.FRB2B.AP.IsFlux10_1Compliant() === "1") {
            Controls.LineItems__.InvoiceLinePeriodStartDate__.Hide(false);
            Controls.LineItems__.InvoiceLinePeriodEndDate__.Hide(false);
            hasValue = true;
        }
        i++;
    }
    if (!hasValue) {
        // Hide columns
        Controls.LineItems__.InvoiceLinePeriodStartDate__.Hide(true);
        Controls.LineItems__.InvoiceLinePeriodEndDate__.Hide(true);
    }
}
// Set ElementIdentifier__ when UnitOfMeasure__ is selected
Controls.LineItems__.EnergyConsumptionUnit__.OnSelectItem = function (item) {
    const row = this.GetRow();
    if (item) {
        let id = item.GetValue("UnitOfMeasure__");
        if (item.GetValue("ElementIdentifier__")) {
            id = item.GetValue("ElementIdentifier__");
        }
        row.EnergyConsumptionConversionFactorID__.SetValue(id);
        row.EnergyConsumptionConversionFactor__.SetValue(item.GetValue("GHGConversionFactor__"));
    }
    lineItemsEnergyConsumptionChanged.call(this);
};
Controls.LineItems__.EnergyConsumptionUnit__.OnBlur = function () {
    // Handle empty value of EnergyConsumptionUnit__ & value not in data table
    const energyConsumptionConsumptionUnit = this.GetValue();
    if (!energyConsumptionConsumptionUnit || this.GetError()) {
        const row = this.GetRow();
        row.EnergyConsumptionConversionFactorID__.SetValue("");
        row.EnergyConsumptionConversionFactor__.SetValue("");
        row.EnergyConsumptionKgCO2e__.SetValue("");
        Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
        if (!this.GetError()) { // prevent reset of EnergyConsumptionUnit__ error when value is not in data table
            setLineItemEnergyConsumptionFieldsRequiredIfNeeded(row);
        }
    }
};
/**
 * event when line item energy consumption unit or value changes
 * - set energy consumption value required if unit is not empty
 * - calculate line item EnergyConsumptionKgCO2e based on GHG Emissions conversion factor
 * @this DatabaseComboBox|Decimal in Line Item
 */
function lineItemsEnergyConsumptionChanged() {
    setLineItemEnergyConsumptionFieldsRequiredIfNeeded(this.GetRow());
    computeLineItemsEnergyConsumptionKgCO2e(this.GetRow());
}
function setLineItemEnergyConsumptionFieldsRequiredIfNeeded(row) {
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        const energyConsumptionUnitError = row.EnergyConsumptionUnit__.GetError();
        const energyConsumptionValueError = row.EnergyConsumptionValue__.GetError();
        const requiredFieldMessage = Language.Translate("This field is required!", false);
        const nonAllowedValueMessage = Language.Translate("This value is not allowed", false);
        const nonMatchTableDataMessage = Language.Translate("This information does not match the table data.", false);
        if (energyConsumptionValueError !== nonAllowedValueMessage
            && !!row.EnergyConsumptionUnit__.GetValue()
            && !row.EnergyConsumptionValue__.GetValue()
            && row.EnergyConsumptionValue__.GetValue() !== 0) {
            row.EnergyConsumptionValue__.SetError(requiredFieldMessage);
        }
        else if (energyConsumptionUnitError !== nonMatchTableDataMessage
            && !row.EnergyConsumptionUnit__.GetValue()
            && row.EnergyConsumptionValue__.GetValue()
            && row.EnergyConsumptionValue__.GetValue() !== 0) {
            row.EnergyConsumptionUnit__.SetError(requiredFieldMessage);
        }
        else {
            if (energyConsumptionValueError === requiredFieldMessage) {
                row.EnergyConsumptionValue__.SetError("");
            }
            if (energyConsumptionUnitError === requiredFieldMessage) {
                row.EnergyConsumptionUnit__.SetError("");
            }
        }
    }
}
function computeLineItemsEnergyConsumptionKgCO2e(row) {
    row.EnergyConsumptionKgCO2e__.SetWarning("");
    const companyCode = Data.GetValue("CompanyCode__");
    const energyConsumptionConversionFactorID = row.EnergyConsumptionConversionFactorID__.GetValue();
    const energyConsumptionValue = row.EnergyConsumptionValue__.GetValue();
    // Valid if we have company code and EnergyConsumptionUnit__ to calculate the conversion from energyConsumptionValue. EnergyConsumptionUnit__ need to be valid from the table (i.e. no error)
    if (companyCode && energyConsumptionConversionFactorID && energyConsumptionValue && !row.EnergyConsumptionUnit__.GetError()) {
        LayoutHelper.DisableButtons(true, "ConvertEnergyConsumptionPromises");
        if (row.EnergyConsumptionConversionFactor__.GetValue()) {
            row.EnergyConsumptionKgCO2e__.SetValue(Number(row.EnergyConsumptionConversionFactor__.GetValue()) * energyConsumptionValue);
        }
        else {
            row.EnergyConsumptionKgCO2e__.SetWarning(Language.Translate("_Unable to convert to kg CO2e. Conversion factor is not defined for {0}", false, row.EnergyConsumptionUnit__.GetValue()));
            row.EnergyConsumptionKgCO2e__.SetValue("");
        }
        LayoutHelper.DisableButtons(false, "ConvertEnergyConsumptionPromises");
    }
    else if (energyConsumptionValue === 0) {
        row.EnergyConsumptionKgCO2e__.SetValue(0);
    }
    else {
        row.EnergyConsumptionKgCO2e__.SetValue("");
    }
    Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
}
/**
 * event when line item EnergyConsumptionKgCO2e changes
 * - calculate header EnergyConsumptionKgCO2e accordingly
 * @this Decimal in Line Item
 */
function lineItemsEnergyConsumptionKgCO2eChanged() {
    Lib.P2P.GHGEmissions.ComputeVIPHeaderEnergyConsumptionKgCO2e();
}
function headerEnergyConsumptionChanged() {
    setHeaderEnergyConsumptionFieldsRequiredIfNeeded();
    Controls.EnergyConsumptionCategory__.SetValue("");
}
function setHeaderEnergyConsumptionFieldsRequiredIfNeeded() {
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        if (!Data.GetValue("EnergyConsumptionLevel__")) {
            Controls.EnergyConsumptionLevel__.SetError("This field is required!");
        }
        else {
            Controls.EnergyConsumptionLevel__.SetError("");
        }
    }
}
function GetLineFromID(id, date) {
    const table = Data.GetTable("lineItems__");
    const nbElements = table.GetItemCount();
    for (let i = 0; i < nbElements; ++i) {
        const currentItem = table.GetItem(i);
        if (currentItem && currentItem.GetValue("ExtractedDetails__")) {
            try {
                const parsed = JSON.parse(currentItem.GetValue("ExtractedDetails__"));
                if (parsed &&
                    parsed.id &&
                    parsed.id.id &&
                    parsed.id.creationDT &&
                    parsed.id.id === id &&
                    parsed.id.creationDT === date) {
                    return [i, currentItem];
                }
            }
            catch (_a) { }
        }
    }
    return null;
}
function GetRelatedLinesFromID(id, date) {
    const result = [];
    const table = Data.GetTable("lineItems__");
    const nbElements = table.GetItemCount();
    for (let i = 0; i < nbElements; ++i) {
        const currentItem = table.GetItem(i);
        if (currentItem && currentItem.GetValue("ExtractedDetails__")) {
            try {
                const parsed = JSON.parse(currentItem.GetValue("ExtractedDetails__"));
                if (parsed &&
                    parsed.source &&
                    parsed.source.id &&
                    parsed.source.creationDT &&
                    parsed.source.id === id &&
                    parsed.source.creationDT === date) {
                    result.push([i, currentItem]);
                }
            }
            catch (_a) { }
        }
    }
    return result;
}
function refreshSourceMapping(id, creationDT) {
    const associatedLines = GetRelatedLinesFromID(id, creationDT);
    let hasAssociatedallowanceAndCharges = false;
    for (const associatedLine of associatedLines) {
        const associatedItem = associatedLine[1];
        if (associatedItem.GetValue("AllowanceChargeCode__")) {
            hasAssociatedallowanceAndCharges = true;
            break;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, currentLine] = GetLineFromID(id, creationDT);
    let parsed = {};
    try {
        parsed = JSON.parse(currentLine.GetValue("ExtractedDetails__"));
    }
    catch (_a) {
    }
    if (parsed.MappingName === Sys.AP.PreviewMappingLineType.AllowanceAtDocumentLevel || parsed.MappingName === Sys.AP.PreviewMappingLineType.ChargeAtDocumentLevel) {
        return;
    }
    else if (hasAssociatedallowanceAndCharges) {
        parsed.MappingName = Sys.AP.PreviewMappingLineType.LineWithAllowanceCharge;
    }
    else {
        parsed.MappingName = Sys.AP.PreviewMappingLineType.Default;
    }
    currentLine.SetValue("ExtractedDetails__", JSON.stringify(parsed));
}
function getMapping(codeDefined, isSubsequentLine, isAllowance, currentMapping) {
    if (!codeDefined) {
        return Sys.AP.PreviewMappingLineType.Default;
    }
    if (isSubsequentLine && isAllowance) {
        if (!currentMapping || currentMapping === Sys.AP.PreviewMappingLineType.Default ||
            currentMapping === Sys.AP.PreviewMappingLineType.AllowanceAtLineLevel ||
            currentMapping === Sys.AP.PreviewMappingLineType.ChargeAtLineLevel) {
            return Sys.AP.PreviewMappingLineType.AllowanceAtLineLevel;
        }
        else if (currentMapping === Sys.AP.PreviewMappingLineType.AllowanceAtDocumentLevel ||
            currentMapping === Sys.AP.PreviewMappingLineType.ChargeAtDocumentLevel) {
            return Sys.AP.PreviewMappingLineType.AllowanceAtDocumentLevel;
        }
    }
    if (isSubsequentLine && !isAllowance) {
        if (!currentMapping || currentMapping === Sys.AP.PreviewMappingLineType.Default ||
            currentMapping === Sys.AP.PreviewMappingLineType.AllowanceAtLineLevel ||
            currentMapping === Sys.AP.PreviewMappingLineType.ChargeAtLineLevel) {
            return Sys.AP.PreviewMappingLineType.ChargeAtLineLevel;
        }
        else if (currentMapping === Sys.AP.PreviewMappingLineType.AllowanceAtDocumentLevel ||
            currentMapping === Sys.AP.PreviewMappingLineType.ChargeAtDocumentLevel) {
            return Sys.AP.PreviewMappingLineType.ChargeAtDocumentLevel;
        }
    }
    if (!isSubsequentLine && isAllowance) {
        return Sys.AP.PreviewMappingLineType.AllowanceAtDocumentLevel;
    }
    if (!isSubsequentLine && !isAllowance) {
        return Sys.AP.PreviewMappingLineType.ChargeAtDocumentLevel;
    }
    return Sys.AP.PreviewMappingLineType.Default;
}
function RefreshAllowanceCharges(row) {
    if (!Sys.FRB2B.AP.IsInternationalEReportingEnabled()) {
        return;
    }
    const isAllowanceOrChargeCodeDefined = !!row.AllowanceChargeCode__.GetValue();
    const isAllowance = row.Amount__.GetValue() <= 0;
    const details = InvoiceLineItem.GetExtractedInfoWithUniqueIdentifiers(row.ExtractedDetails__.GetValue());
    const isSubsequentLine = details && ((details.source && details.source.id && details.source.creationDT) || details.LineIndex >= 0);
    details.MappingName = getMapping(isAllowanceOrChargeCodeDefined, isSubsequentLine, isAllowance, details.MappingName);
    row.ExtractedDetails__.SetValue(JSON.stringify(details));
    if (isSubsequentLine && details.source) {
        refreshSourceMapping(details.source.id, details.source.creationDT);
    }
}
function LineItemHandleAllowanceAndCharges() {
    RefreshAllowanceCharges(this.GetRow());
}
const browseItemTaxJurisdiction = {
    dialog: null,
    searchControlFocused: false,
    onCloseCallback: null,
    rowCount: 20,
    rowCountPerPage: 10,
    resultTableName: "resultTable",
    // Column configuration
    columns: [
        { id: "TXJCD", label: "_Jurisdiction code", type: "STR", width: 80 },
        { id: "TEXT1", label: "_Description", type: "STR", width: 500 }
    ],
    // Search criterion configuration
    searchCriterias: [
        { id: "COUNTRY", label: "_Country", required: true, toUpper: true, visible: true, filterId: "TEXT1", defaultValue: "", width: 180 },
        { id: "REGION", label: "_Region", required: false, toUpper: true, visible: true, filterId: "TEXT1", defaultValue: "", width: 180 },
        { id: "COUNTY", label: "_County", required: false, toUpper: true, visible: true, filterId: "TEXT1", defaultValue: "", width: 180 },
        { id: "CITY", label: "_City", required: false, toUpper: true, visible: true, filterId: "TEXT1", defaultValue: "", width: 180 },
        { id: "ZIPCODE", label: "_Zip code", required: false, toUpper: true, visible: true, filterId: "TEXT1", defaultValue: "", width: 180 }
    ],
    // Buffer for filter values to avoid inconsistencies during queries
    filterValues: null,
    BAPIParams: {
        "EXPORTS": {
            "DEST": "",
            "LOCATION_DATA": {
                "COUNTRY": "",
                "CITY": "",
                "STATE": "",
                "COUNTY": "",
                "ZIPCODE": "",
                "TXJCD": "",
                "TXJCD_L1": "",
                "TXJCD_L2": "",
                "TXJCD_L3": "",
                "TXJCD_L4": ""
            }
        },
        "USECACHE": true
    },
    // popup
    init: function (callback) {
        const customizedSearchCriterias = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowseTaxJurisdiction.CustomizeSearchCriterias", this.searchCriterias);
        this.searchCriterias = customizedSearchCriterias !== null && customizedSearchCriterias !== void 0 ? customizedSearchCriterias : this.searchCriterias;
        this.onCloseCallback = callback;
        Popup.Dialog("_Line item jurisdiction code", null, this.fillSearchDialog, null, null, this.handleSearchDialog);
    },
    // handle results return
    returnResultsExternal: function (jsonResult) {
        var _a, _b;
        if ((((_b = (_a = jsonResult === null || jsonResult === void 0 ? void 0 : jsonResult.TABLES) === null || _a === void 0 ? void 0 : _a.LOCATION_RESULTS) === null || _b === void 0 ? void 0 : _b.length) || 0) > 0) {
            browseItemTaxJurisdiction.fillTableWithResultFromExternalJurisdictionQuery(jsonResult);
            browseItemTaxJurisdiction.completedCallBackWithoutMessage();
        }
        else {
            browseItemTaxJurisdiction.completedCallBackWithNoMatchMessage();
        }
    },
    fillTableWithResultFromExternalJurisdictionQuery: function (jsonResult) {
        const table = browseItemTaxJurisdiction.dialog.GetControl(browseItemTaxJurisdiction.resultTableName);
        const nbResults = jsonResult.TABLES.LOCATION_RESULTS.length;
        table.SetItemCount(nbResults);
        for (let iRecord = 0; iRecord < nbResults; iRecord++) {
            const item = table.GetItem(iRecord);
            const descriptionTab = [];
            const record = jsonResult.TABLES.LOCATION_RESULTS[iRecord];
            if (record.COUNTRY && record.COUNTRY.length > 0) {
                descriptionTab.push(record.COUNTRY);
            }
            if (record.STATE && record.STATE.length > 0) {
                descriptionTab.push(record.STATE);
            }
            if (record.COUNTY && record.COUNTY.length > 0) {
                descriptionTab.push(record.COUNTY);
            }
            if (record.CITY && record.CITY.length > 0) {
                descriptionTab.push(record.CITY);
            }
            if (record.ZIPCODE && record.ZIPCODE.length > 0) {
                descriptionTab.push(record.ZIPCODE);
            }
            item.SetValue("TXJCD", record.TXJCD);
            item.SetValue("TEXT1", descriptionTab.join(","));
        }
    },
    // request
    request: function () {
        Sys.Helpers.Browse.ResetTable(browseItemTaxJurisdiction.dialog);
        //Store filter values
        browseItemTaxJurisdiction.filterValues = {};
        for (const searchCriteria of browseItemTaxJurisdiction.searchCriterias) {
            browseItemTaxJurisdiction.filterValues[searchCriteria.id] = browseItemTaxJurisdiction.dialog.GetControl("searchCriteria_" + searchCriteria.id).GetValue();
        }
        browseItemTaxJurisdiction.searchTaxProcedure();
    },
    // search Tax Procedudure Info
    searchTaxProcedure: function () {
        Lib.AP.SAP.SAPQuery(browseItemTaxJurisdiction.searchTaxProcedureCallback, Variable.GetValueAsString("SAPConfiguration"), "T005", "KALSM", `LAND1 = '${browseItemTaxJurisdiction.filterValues.COUNTRY}'`, 1, 0);
    },
    searchTaxProcedureCallback: function () {
        if (this.GetQueryError()) {
            Sys.Helpers.Browse.CompletedCallBack(browseItemTaxJurisdiction.dialog, this, true);
            return;
        }
        const taxProcedure = this.GetQueryValue("KALSM", 0);
        if (taxProcedure) {
            Lib.AP.SAP.SAPQuery(browseItemTaxJurisdiction.searchTaxRFCDestCallback, Variable.GetValueAsString("SAPConfiguration"), "TTXD", "KALSM|XEXTN|LENG1|LENG2|LENG3|LENG4|RFCDEST", `KALSM = '${taxProcedure}'`, 1, 0);
        }
        else {
            browseItemTaxJurisdiction.completedCallBackWithNoMatchMessage();
        }
    },
    searchTaxRFCDestCallback: function () {
        if (this.GetQueryError()) {
            Sys.Helpers.Browse.CompletedCallBack(browseItemTaxJurisdiction.dialog, this, true);
            return;
        }
        const taxProcedure = this.GetQueryValue("KALSM", 0);
        const external = this.GetQueryValue("XEXTN", 0);
        const length1 = this.GetQueryValue("LENG1", 0);
        const length2 = this.GetQueryValue("LENG2", 0);
        const length3 = this.GetQueryValue("LENG3", 0);
        const length4 = this.GetQueryValue("LENG4", 0);
        const rfcDest = this.GetQueryValue("RFCDEST", 0);
        if (external === "") {
            Lib.AP.SAP.SAPGetSAPLanguageSync(function (language) {
                browseItemTaxJurisdiction.queryJuridisdictionInternal(taxProcedure, length1, length2, length3, length4, language);
            });
        }
        else {
            browseItemTaxJurisdiction.queryJurisdictionExternal(rfcDest, length1, length2, length3, length4);
        }
    },
    // query for Jurisdiction
    queryJuridisdictionInternal: function (taxProcedure, length1, length2, length3, length4, language) {
        Log.Info("internal query for jurisdiction");
        let state = browseItemTaxJurisdiction.filterValues.REGION;
        state = Sys.Helpers.String.PadRight(state ? state : "", "_", length1);
        let county = browseItemTaxJurisdiction.filterValues.COUNTY;
        county = Sys.Helpers.String.PadRight(county ? county : "", "_", length2);
        let city = browseItemTaxJurisdiction.filterValues.CITY;
        city = Sys.Helpers.String.PadRight(city ? city : "", "_", length3);
        let LocalTax = "";
        LocalTax = Sys.Helpers.String.PadRight(LocalTax, "_", length4);
        let txjcdFilter = state + county + city + LocalTax;
        txjcdFilter = txjcdFilter.replace(" ", "_");
        const filter = `SPRAS = '${language}' AND KALSM = '${taxProcedure}' AND TXJCD LIKE '${txjcdFilter}'`;
        Lib.AP.SAP.SAPQuery(browseItemTaxJurisdiction.queryInternalCallback, Variable.GetValueAsString("SAPConfiguration"), "TTXJT", "TXJCD|TEXT1", filter, browseItemTaxJurisdiction.rowCount, 0);
    },
    queryInternalCallback: function () {
        Sys.Helpers.Browse.CompletedCallBack(browseItemTaxJurisdiction.dialog, this, true);
        Sys.Helpers.Browse.FillTableFromQueryResult(browseItemTaxJurisdiction.dialog, "resultTable", this);
    },
    queryJurisdictionExternal: function (rfcDest, length1, length2, length3, length4) {
        Log.Info("external query for jurisdiction");
        if (rfcDest) {
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.DEST = rfcDest.toUpperCase();
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.COUNTRY = browseItemTaxJurisdiction.filterValues.COUNTRY;
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.STATE = browseItemTaxJurisdiction.filterValues.REGION;
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.ZIPCODE = browseItemTaxJurisdiction.filterValues.ZIPCODE;
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.CITY = browseItemTaxJurisdiction.filterValues.CITY;
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.COUNTY = browseItemTaxJurisdiction.filterValues.COUNTY;
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.TXJCD_L1 = length1.toString();
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.TXJCD_L2 = length2.toString();
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.TXJCD_L3 = length3.toString();
            browseItemTaxJurisdiction.BAPIParams.EXPORTS.LOCATION_DATA.TXJCD_L4 = length4.toString();
            browseItemTaxJurisdiction.callBAPIJurisdiction();
        }
        else {
            browseItemTaxJurisdiction.completedCallBackWithNoMatchMessage();
        }
    },
    callBAPIJurisdiction: function () {
        Lib.AP.SAP.SAPCallBapi(browseItemTaxJurisdiction.returnResultsExternal, Variable.GetValueAsString("SAPConfiguration"), "Z_ESK_DETERMINE_JURISDICTION", browseItemTaxJurisdiction.BAPIParams);
    },
    // Draw and display the browse page
    fillSearchDialog: function (newDialog) {
        browseItemTaxJurisdiction.dialog = newDialog;
        Sys.Helpers.Browse.FillSearchDialog(newDialog, browseItemTaxJurisdiction.columns, browseItemTaxJurisdiction.searchCriterias, browseItemTaxJurisdiction.rowCount, browseItemTaxJurisdiction.rowCountPerPage, "", false, false);
    },
    // Handle event in browse page
    handleSearchDialog: function (handleDialog, tabId, event, control, parameter) {
        const searchControlFocusedParams = [
            handleDialog,
            tabId,
            event,
            control,
            parameter,
            browseItemTaxJurisdiction.searchControlFocused,
            browseItemTaxJurisdiction.request,
            browseItemTaxJurisdiction.returnSelectionCallback
        ];
        const customSearchControlFocused = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.BrowseTaxJurisdiction.CustomizeHandleSearchDialog", ...searchControlFocusedParams);
        if (typeof customSearchControlFocused === "boolean") {
            this.searchControlFocused = customSearchControlFocused;
            return;
        }
        this.searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(...searchControlFocusedParams);
    },
    /* Update the main form with the user selection */
    returnSelectionCallback: function (_control, tableItem) {
        const selectedValue = tableItem.TXJCD.GetValue();
        if (selectedValue) {
            browseItemTaxJurisdiction.onCloseCallback(selectedValue);
            browseItemTaxJurisdiction.dialog.Cancel();
        }
    },
    setResultMessage: function (msg) {
        const resultCtrl = browseItemTaxJurisdiction.dialog.GetControl("resultMessage");
        if (resultCtrl) {
            resultCtrl.SetWarningStyle();
            if (msg) {
                resultCtrl.SetText(msg);
            }
        }
    },
    setWaitingIcon: function (hide) {
        const waitingIcon = browseItemTaxJurisdiction.dialog.GetControl("waitingIcon");
        if (waitingIcon) {
            waitingIcon.Hide(hide);
        }
    },
    completedCallBackWithNoMatchMessage: function () {
        browseItemTaxJurisdiction.setResultMessage("_No match");
        browseItemTaxJurisdiction.setWaitingIcon(true);
    },
    completedCallBackWithoutMessage: function () {
        browseItemTaxJurisdiction.setResultMessage();
        browseItemTaxJurisdiction.setWaitingIcon(true);
    }
};
/**
 * event when line item Tax jurisdiction is browsed
 * @this ShortText in Line Item
 */
function onTaxJurisdictionBrowse() {
    this.Wait(true);
    const item = this.GetItem();
    browseItemTaxJurisdiction.init(browseItemTaxJurisdictionCallback);
    function browseItemTaxJurisdictionCallback(taxJurisdiction) {
        if (taxJurisdiction) {
            item.SetCategorizedError("TaxJurisdiction__", null, null);
            item.SetValue("TaxJurisdiction__", taxJurisdiction);
            getTaxRateAndUpdateItem(item);
        }
        else if (Lib.AP.SAP.g_taxJurisdictionRequiredCache.Get(Data.GetValue("CompanyCode__"))) {
            item.SetCategorizedError("TaxJurisdiction__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
            updateItemWithTaxRate(item, 0, 0);
        }
    }
    return true;
}
/**
 * event when line item Tax jurisdiction changes
 * @this ShortText in Line Item
 */
function calculateTaxJurisdiction() {
    const item = this.GetItem();
    const taxJurisdiction = this.GetValue();
    if (taxJurisdiction || !Lib.AP.SAP.g_taxJurisdictionRequiredCache.IsDefined(Data.GetValue("CompanyCode__"))) {
        item.SetCategorizedError("TaxJurisdiction__", null, null);
        getTaxRateAndUpdateItem(item);
    }
    else if (Lib.AP.SAP.g_taxJurisdictionRequiredCache.Get(Data.GetValue("CompanyCode__"))) {
        item.SetCategorizedError("TaxJurisdiction__", Lib.AP.TouchlessException.MissingLineField, "This field is required!");
        updateItemWithTaxRate(item, 0, 0);
    }
}
function handleTaxComputation(initEventsHandler) {
    if (Controls.CalculateTax__.IsChecked()) {
        Controls.LineItems__.TaxAmount__.SetReadOnly(true);
        Controls.LineItems__.TaxJurisdiction__.OnChange = calculateTaxJurisdiction;
        Controls.LineItems__.TaxAmount__.OnChange = null;
        if (!initEventsHandler) {
            // Recalculate tax amount for each lines
            const table = Data.GetTable("LineItems__");
            for (let i = 0; i < table.GetItemCount(); i++) {
                getTaxRateAndUpdateItem(table.GetItem(i));
            }
        }
        Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
        onLocalNetAmountUpdate(initEventsHandler);
    }
    else {
        Controls.LineItems__.TaxAmount__.SetReadOnly(false);
        Controls.LineItems__.TaxJurisdiction__.OnChange = null;
        Controls.LineItems__.TaxAmount__.OnChange = function () {
            Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
            Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
            onLocalNetAmountUpdate();
            Lib.ERP.checkBalance(true);
        };
        Controls.TaxAmount__.SetValue(Lib.AP.TaxHelper.computeHeaderTaxAmount());
    }
}
function onLineItemRefreshRow(index) {
    if (Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
        setLineItemEnergyConsumptionFieldsRequiredIfNeeded(Controls.LineItems__.GetRow(index));
    }
    else {
        InvoiceLineItem.UpdateRowLayoutToLineType(Controls.LineItems__.GetRow(index));
        InvoiceLineItem.FillLineItemDescription(Controls.LineItems__.GetItem(index), index);
        InvoiceLineItem.FillLineItemAssignment(Controls.LineItems__.GetItem(index), index);
    }
    InvoiceLineItem.SetSubFocusStyle(Controls.LineItems__.GetRow(index));
    InvoiceLineItem.SetDispatchKey(Controls.LineItems__.GetRow(index));
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        Lib.P2P.GHGEmissions.ComputeVIPEstimatedGHGEmissions();
    }
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnRefreshLineItemRowEnd", Controls.LineItems__.GetRow(index));
}
function onLineItemFocusRow(index) {
    if (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() || Lib.AP.ReceptionMethod.isEDI() || Sys.FRB2B.AP.IsFlux10_1Compliant() === "1") {
        InvoiceLineItem.RefreshSubFocusStyles(Controls.LineItems__.GetRow(index));
    }
    setLineItemEnergyConsumptionFieldsRequiredIfNeeded(Controls.LineItems__.GetRow(index));
}
function onLineItemBlurRow( /*index: number*/) {
    if (!Lib.AP.InvoiceType.isGLOrDownpaymentInvoice() || Sys.FRB2B.AP.IsFlux10_1Compliant() === "1") {
        InvoiceLineItem.RefreshSubFocusStyles();
    }
}
function getGLAccountDescription(GLAcctId, callback, companyCode) {
    Lib.P2P.Browse.GetGlAccountDescription(callback, companyCode, GLAcctId, "AP");
}
/**
 * event when line item G/L account changes
 * @this DatabaseComboBox in Line Item
 */
function glAccountOnChange() {
    const item = this.GetItem();
    const row = this.GetRow();
    recomputeTaxOnDimensionChangeIfNeeded(item);
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    const genericParameter = invoiceDocument.GenericDimensionParameter("GLAccount");
    const param = genericParameter ? GetFillGenericDimensionERPParameters(item, "GLAccount__") : GetFillGLAccountParameters(item);
    Lib.AP.GetInvoiceDocumentLayout().GetAndFillDescriptionFromCode(item, param);
    Lib.AP.WorkflowCtrl.UpdateWorkflowOnDimensionUpdate("glAccountUpdated");
    if (Lib.AP.InvoiceType.isGLOrDownpaymentInvoice()) {
        Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.FillCostType", item);
    }
    Lib.P2P.fillCostTypeFromGLAccount(item);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnGLAccountChanged", item, row);
}
function onDocumentDeleted() {
    Variable.SetValueAsString("DocAttached", "");
    LayoutHelper.UpdateButtonBar();
    RequestTeaching.RefreshButtonState();
}
/** *********************** **/
/** initialization Function **/
/** *********************** **/
function userCanUpdatePayment() {
    // User can update the payment details if the invoice is to pay and the user is an ap specialist (i.e. has the profile "Accounts Payable Profile")
    // Please change this condition if you use other profiles.
    return (Controls.InvoiceStatus__.GetValue() === Lib.AP.InvoiceStatus.ToPay ||
        Controls.InvoiceStatus__.GetValue() === Lib.AP.InvoiceStatus.BeingPaid) &&
        userIsAPOrAdmin();
}
function handleApproversListEvents() {
    if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowDisableRules") === "1") {
        return;
    }
    /**
     * @this ShortText in Approvers List
     */
    Controls.ApproversList__.Approver__.OnBrowse = function () {
        const update = this.GetValue();
        const idx = parseInt(this.GetRow().WorkflowIndex__.GetValue(), 10);
        Controls.ApproversList__.Wait(true);
        browseApprovers(Lib.AP.WorkflowCtrl.GetStepRole(idx)).Then(function (approver) {
            if (approver) {
                Controls.ApproversList__.DisableLinesAudit(false);
                if (update) {
                    Lib.AP.WorkflowCtrl.UpdateContributorAt(idx, approver);
                }
                else {
                    // if we come from an empty line insert result above
                    Lib.AP.WorkflowCtrl.AddContributorAt(idx, approver);
                }
            }
        });
    };
    Controls.ApproversList__.OnCheckIfItemDeletable = function (item, idx) {
        return Lib.AP.WorkflowCtrl.IsContributorDeletable(idx);
    };
    Controls.ApproversList__.OnDeleteItem = function (item, idx) {
        Controls.ApproversList__.DisableLinesAudit(false);
        Lib.AP.WorkflowCtrl.RemoveContributorAt(idx);
        LayoutHelper.UpdateButtonBar();
    };
    Controls.ApproversList__.OnAddItem = function (item, idx) {
        item.Remove();
        function addContributorBelow(contributorRole) {
            browseApprovers(contributorRole).Then(function (contributor) {
                if (contributor) {
                    Controls.ApproversList__.DisableLinesAudit(false);
                    Lib.AP.WorkflowCtrl.AddContributorAt(idx, contributor, contributorRole);
                    LayoutHelper.UpdateButtonBar();
                }
            });
        }
        // User exit: restrict adding workflow to controller or approver only
        const restrictedRole = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.RestrictAddingWorkflowToApproverOrControllerOnly");
        if (restrictedRole === Lib.AP.WorkflowCtrl.roles.controller) {
            addContributorBelow(Lib.AP.WorkflowCtrl.roles.controller);
        }
        else if (restrictedRole === Lib.AP.WorkflowCtrl.roles.approver) {
            addContributorBelow(Lib.AP.WorkflowCtrl.roles.approver);
        }
        else {
            const role = Lib.AP.WorkflowCtrl.GetNextRole(idx - 1);
            if (role) {
                addContributorBelow(role);
            }
            else {
                // Ambiguity: ask the user
                Popup.Menu({
                    options: [
                        { label: "_Add a controller", value: Lib.AP.WorkflowCtrl.roles.controller },
                        { label: "_Add an approver", value: Lib.AP.WorkflowCtrl.roles.approver }
                    ]
                }, addContributorBelow);
            }
        }
    };
}
/** *************************** **/
/** Helpers Currency conversion **/
/** *************************** **/
function setExchangeRate(exchangeRate, corporateExchangeRate, callback, requestedInvoiceCurrency) {
    const invoiceCurrency = Controls.InvoiceCurrency__.GetValue();
    if (requestedInvoiceCurrency !== invoiceCurrency) {
        Log.Info("Skip setExchangeRate: update was requested for " + requestedInvoiceCurrency + " but invoice currency is now " + invoiceCurrency);
        return;
    }
    const computedExchangeRate = typeof exchangeRate === "number" ? exchangeRate.toString() : "";
    const computedCorporateExchangeRate = typeof corporateExchangeRate === "number" ? corporateExchangeRate.toString() : "";
    g_originalExchangeRate = computedExchangeRate || null;
    Data.SetValue("ExchangeRate__", computedExchangeRate);
    Data.SetValue("CorporateExchangeRate__", computedCorporateExchangeRate);
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizeExchangeRate");
    const exchangeRateAfterCustomization = (Data.GetValue("ExchangeRate__") || "").trim();
    const manualExchangeRateValue = Number(exchangeRateAfterCustomization);
    const hasNumericExchangeRate = exchangeRateAfterCustomization !== "" && !Number.isNaN(manualExchangeRateValue);
    g_originalExchangeRate = hasNumericExchangeRate ? exchangeRateAfterCustomization : null;
    Controls.ManualExchangeRate__.SetValue(hasNumericExchangeRate ? manualExchangeRateValue : null);
    Lib.AP.GetInvoiceDocument().UpdateLocalAndCorporateAmounts();
    if (Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant()) {
        ReverseChargeTaxLayoutHelper.RecomputeLocalTaxAmounts(Data.GetValue("ExchangeRate__"));
    }
    onLocalNetAmountUpdate();
    if (callback) {
        callback();
    }
}
function setExchangeRateAndCheckBalance(exchangeRate, corporateExchangeRate, requestedInvoiceCurrency) {
    setExchangeRate(exchangeRate, corporateExchangeRate, Lib.ERP.doCheckBalance, requestedInvoiceCurrency);
}
// FT-036082 : Removal of the callback parameter
// TypeScript compilation issue when using the callback parameter in Lib.AP.FormCleaner, as the function used as the callback comes from Lib.ERP
// Lib.ERP.doCheckBalance is the only function passed as a callback to updateExchangeRate, so we can replace the callback directly with this function (Lib.ERP.doCheckBalance)
function updateExchangeRate(requestedInvoiceCurrency) {
    const companyCode = Data.GetValue("CompanyCode__");
    const invoiceCurrency = Data.GetValue("InvoiceCurrency__");
    const corporateCurrency = Data.GetValue("CorporateCurrency__");
    const localCurrency = Data.GetValue("LocalCurrency__");
    ReverseChargeTaxLayoutHelper.UpdateExchangeRateVisibility();
    const invoiceDocument = Lib.AP.GetInvoiceDocument();
    if (!invoiceDocument.RetrieveExchangeRate(invoiceCurrency, corporateCurrency, localCurrency, requestedInvoiceCurrency, setExchangeRateAndCheckBalance)) {
        // Fallback on standard exchange rate retrieval if the invoice document does not handle the exchange rate computation for the given currencies
        function callbackGetExchangeRate(result, error) {
            const exchangeRates = {};
            const invoiceToCorporateExchangeRate = Lib.P2P.ExchangeRate.ComputeInvoiceToCorporateExchangeRateFromQueryResults(result, error, exchangeRates, corporateCurrency, invoiceCurrency);
            setExchangeRateAndCheckBalance(exchangeRates[invoiceCurrency], invoiceToCorporateExchangeRate, requestedInvoiceCurrency);
        }
        Lib.P2P.ExchangeRate.GetExchangeRates(companyCode, [invoiceCurrency, corporateCurrency], callbackGetExchangeRate);
    }
}
function convertAmounts(oldCurrency) {
    return Sys.Helpers.Promise.Create(function (resolve) {
        // Call GetDetails once for each PO to update browse data with new currency
        // Callback get the exchangeRate and handles the conversion of the line items
        const newCurrency = Controls.InvoiceCurrency__.GetValue();
        const orderNumberList = Lib.AP.GetOrderNumbersAsArray();
        if (newCurrency && orderNumberList.length > 0) {
            const invoiceDocument = Lib.AP.GetInvoiceDocument();
            invoiceDocument.ConvertAmounts(newCurrency, oldCurrency, orderNumberList, computeItemTaxAmount)
                .Then(function (amountsModified) {
                if (amountsModified) {
                    onLocalNetAmountUpdate();
                    checkPOInvoiceLineItems();
                }
                resolve(amountsModified);
            });
        }
        else {
            resolve(false);
        }
    });
}
function checkExtractionScriptTimeout() {
    const displayPopup = Variable.GetValueAsString("AlertExtractionScriptTimeout") && Variable.GetValueAsString("AlertExtractionScriptTimeout") !== "false";
    function removeAlert() {
        ProcessInstance.SetSilentChange(true);
        Variable.SetValueAsString("AlertExtractionScriptTimeout", false);
        ProcessInstance.SetSilentChange(false);
    }
    if (displayPopup) {
        if (Variable.GetValueAsString("AlertExtractionScriptTimeout") === "NoFTR") {
            Popup.Alert("_The first time recognition have not been performed", false, removeAlert, "_Too long extraction");
        }
        else {
            Popup.Alert("_The PO lines details have not been filled", false, removeAlert, "_Too long extraction");
        }
    }
}
/**
 * event when Subsequent document changes
 * @this CheckBox
 */
function handleSubsequentDocument() {
    const isSubsequentDoc = this && this.GetValue ? this.GetValue() : Data.GetValue("SubsequentDocument__");
    Controls.LineItems__.Quantity__.SetReadOnly(isSubsequentDoc);
    if (isSubsequentDoc) {
        Controls.LineItems__.Quantity__.SetRequired(false);
        Log.Info("'Subsequent document' ticked: Reset quantity on all lines + focus 'Invoice reference number'");
        if (Controls.Payment) {
            Controls.Payment.Collapse(false);
            Controls.Payment.Hide(false);
            Controls.InvoiceReferenceNumber__.Focus();
        }
        const lineItemsTable = Data.GetTable("LineItems__");
        const nbItems = lineItemsTable.GetItemCount();
        for (let i = 0; i < nbItems; ++i) {
            const item = lineItemsTable.GetItem(i);
            if (item) {
                item.SetValue("Quantity__", "");
                item.SetWarning("Quantity__", "");
                item.SetError("Quantity__", "");
                checkPOInvoiceLineItemAmountQuantity(item);
            }
        }
    }
    else {
        Lib.ERP.checkBalance(false);
        checkPOInvoiceLineItems();
    }
    const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
    Lib.AP.WorkflowCtrl.Rebuild(true, !isPosted, isSubsequentDoc ? "subsequentDocBoxTicked" : "subsequentDocBoxUnticked");
}
function AddError(field, text, control = Data) {
    let old = control.GetError(field);
    if (!old) {
        old = text;
    }
    else if (old.indexOf(text) === -1) {
        old = `${old}\n${text}`;
    }
    control.SetError(field, old);
}
function getERPLifecycleStatusDisplayKey(lifecycleStatus) {
    switch (lifecycleStatus) {
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Approved:
            return Sys.FRB2B.AP.Helpers.CDVStatus.Approved;
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.Refused:
            return Sys.FRB2B.AP.Helpers.CDVStatus.Refused;
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.InDispute:
            return Sys.FRB2B.AP.Helpers.CDVStatus.OnHold;
        case Lib.AP.ERPAcknowledgment.ERPLifecycleStatus.TakenInCharge:
            return Sys.FRB2B.AP.Helpers.CDVStatus.TakeOn;
        default:
            return lifecycleStatus;
    }
}
function resolveERPLifecycleError(erpLifecycleError) {
    let lazyError = null;
    try {
        lazyError = JSON.parse(erpLifecycleError);
    }
    catch (_a) {
        return erpLifecycleError;
    }
    if (!lazyError || !lazyError.translationKey || !Sys.Helpers.IsArray(lazyError.parameters)) {
        return erpLifecycleError;
    }
    const resolvedParameters = lazyError.parameters.slice();
    if (lazyError.translationKey === "_ERPLifecycleInvalidReasonCode" || lazyError.translationKey === "_ERPLifecycleInvalidActionCode") {
        // Lifecycle status is always the 2nd parameter for both keys - keep in sync with validationscript.ts
        const lifecycleStatusParamIndex = 1;
        const lifecycleStatus = resolvedParameters[lifecycleStatusParamIndex];
        if (lifecycleStatus) {
            resolvedParameters[lifecycleStatusParamIndex] = Language.Translate(getERPLifecycleStatusDisplayKey(lifecycleStatus));
        }
    }
    return Language.Translate(lazyError.translationKey, false, ...resolvedParameters);
}
function DisplayAlertIfAny() {
    // display ERP posting error if any
    if (!Sys.Helpers.IsEmpty(Data.GetValue("ERPPostingError__"))) {
        AddError("ERPInvoiceNumber__", Data.GetValue("ERPPostingError__"));
    }
    // display ERP lifecycle validation error if any (invoice already posted, only the lifecycle ack was rejected)
    const erpLifecycleError = Variable.GetValueAsString("ERPLifecycleError");
    if (!Sys.Helpers.IsEmpty(erpLifecycleError)) {
        AddError("ERPInvoiceNumber__", resolveERPLifecycleError(erpLifecycleError));
    }
    // display workflow errors if any
    if (Variable.GetValueAsString("WorkflowError")) {
        const workflowError = Variable.GetValueAsString("WorkflowError");
        Log.Error(workflowError);
        if (!ProcessInstance.isReadOnly) {
            const filteredError = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.FilterWorkflowError", workflowError);
            if (filteredError !== "") {
                Popup.Alert(filteredError || workflowError, true, null, Data.GetActionLabel() || "_Error");
            }
            ProcessInstance.SetSilentChange(true);
            Variable.SetValueAsString("WorkflowError", "");
            ProcessInstance.SetSilentChange(false);
        }
    }
    else {
        // display ERP posting error in a popup
        ERP.ShowERPPopup();
    }
    // display extraction scripts timeout
    checkExtractionScriptTimeout();
    // Next alerts...
    Lib.CommonDialog.NextAlert.Show({
        "contactVendor": {
            Popup: function () {
                setTimeout(function () {
                    Controls.ConversationUI__.Focus();
                });
            }
        },
        "requestCreditNotes": {
            Popup: function () {
                setTimeout(function () {
                    ButtonsBehavior.onClickRequestCreditNotes();
                });
            }
        }
    });
}
function checkInvoiceSignature(docIdx) {
    Controls.PreviewPanel.ClearBannerMessages("digitallySignedFail");
    Controls.PreviewPanel.ClearBannerMessages("digitallySigned");
    let html = "", cssClass = "", helpId;
    // helpID 2520 = Sign & 2519 = Check Signature
    const result = Variable.GetValueAsString("InvoiceSignature");
    if (!docIdx || Attach.IsProcessedDocument(docIdx)) {
        switch (result) {
            case "SignatureDone":
                html = `<span class='fa fa-check fa-lg'></span> <span>${Language.Translate("_Invoice signature ok")}</span>`;
                cssClass = "digitallySigned";
                helpId = 2520;
                break;
            case "SignatureFailed":
                html = `<span class='fa fa-times fa-lg'></span> <span>${Language.Translate("_Invoice signature ko")}</span>`;
                cssClass = "digitallySignedFail";
                helpId = 2520;
                break;
            case "InvalidSignatureParameters":
                html = `<span class='fa fa-times fa-lg'></span> <span>${Language.Translate("_Invoice signature ko due to wrong parameters")}</span>`;
                cssClass = "digitallySignedFail";
                helpId = 2520;
                break;
            case "AlreadySigned":
                html = `<span class='fa fa-times fa-lg'></span> <span>${Language.Translate("_Invoice already signed")}</span>`;
                cssClass = "digitallySignedFail";
                helpId = 2520;
                break;
            case "VerificationError":
                html = `<span class='fa fa-times fa-lg'></span> <span>${Language.Translate("_Invoice signed not verified")}</span>`;
                cssClass = "digitallySignedFail";
                helpId = 2519;
                break;
            case "SignatureInvalid":
                html = `<span class='fa fa-times fa-lg'></span> <span>${Language.Translate("_Invoice signed ko")}</span>`;
                cssClass = "digitallySignedFail";
                helpId = 2519;
                break;
            case "InvalidParameters":
                html = `<span class='fa fa-times fa-lg'></span> <span>${Language.Translate("_Invoice signed ko due to wrong parameters")}</span>`;
                cssClass = "digitallySignedFail";
                helpId = 2519;
                break;
            case "SignatureOk":
                html = `<span class='fa fa-check fa-lg'></span> <span>${Language.Translate("_Invoice signed ok")}</span>`;
                cssClass = "digitallySigned";
                helpId = 2519;
                break;
            default:
                helpId = 2520;
                break;
        }
        if (html) {
            const detail = Variable.GetValueAsString("InvoiceSignatureDetail");
            if (detail) {
                html += ": " + detail;
            }
            else {
                html += ".";
            }
            Controls.PreviewPanel.AddBannerMessage(html, cssClass, helpId, Language.Translate("_Learn more"));
        }
    }
}
function initializeEventHandlers() {
    /** Header fields **/
    Controls.ERP__.OnChange = onERPChange;
    Controls.CompanyCode__.OnChange = onCompanyCodeChange;
    Controls.InvoiceType__.OnChange = onInvoiceTypeChange;
    Controls.ERPInvoiceNumber__.OnChange = onERPInvoiceNumberChange;
    Controls.ERPMMInvoiceNumber__.OnChange = onMMERPInvoiceNumberChange;
    Controls.VendorNumber__.OnChange = onVendorChange;
    Controls.VendorName__.OnChange = onVendorChange;
    Controls.VendorNumber__.OnSelectItem = onVendorSelectItem;
    Controls.VendorName__.OnSelectItem = onVendorSelectItem;
    Controls.VendorContactEmail__.OnChange = OnChangeVendorContactEmail;
    Controls.ContactVendor__.OnClick = onContactVendorClick;
    Controls.AlternativePayee__.OnChange = onAlternativePayeeSelectItem;
    Controls.InvoiceAmount__.OnChange = onInvoiceAmountChange;
    Controls.InvoiceCurrency__.OnChange = onInvoiceCurrencyChange;
    Controls.ManualExchangeRate__.OnChange = onManualExchangeRateChange;
    Controls.CurrentException__.OnChange = onCurrentExceptionChange;
    Controls.OrderNumber__.OnChange = onOrderNumberChange;
    Controls.GoodIssue__.OnChange = onConsignmentNumberChange;
    Controls.InvoiceDescription__.OnChange = onInvoiceDescriptionChange;
    if (Controls.ReserveClauseGuarantee__) {
        Controls.ReserveClauseGuarantee__.OnChange = onReserveClauseFieldChange;
        Controls.ReserveClauseGuarantee__.OnSetValue = onReserveClauseFieldChange;
    }
    if (Controls.ReserveClauseProrata__) {
        Controls.ReserveClauseProrata__.OnChange = onReserveClauseFieldChange;
        Controls.ReserveClauseProrata__.OnSetValue = onReserveClauseFieldChange;
    }
    if (Controls.ReserveClauseInsurance__) {
        Controls.ReserveClauseInsurance__.OnChange = onReserveClauseFieldChange;
        Controls.ReserveClauseInsurance__.OnSetValue = onReserveClauseFieldChange;
    }
    Controls.Assignment__.OnChange = onAssignmentChange;
    Controls.UnplannedDeliveryCosts__.OnChange = onUnplannedDeliveryCostsChange;
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ContractReferenceNumber__, onContractReferenceNumberSelect, onContractReferenceNumberUnknownOrEmptyValue, onContractReferenceNumberUnknownOrEmptyValue);
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.ContractReferenceNumberDetails__, onContractReferenceNumberSelect, onContractReferenceNumberUnknownOrEmptyValue, onContractReferenceNumberUnknownOrEmptyValue);
    Controls.ContractReferenceNumber__.SetAttributes("OriginalContractRUIDEX__");
    Controls.BillingScheduleInstallment__.SetAttributes("ContractReferenceNumber__|ApproveTolerance__|BillingScheduleRUIDEX__|OriginalContractRUIDEX__");
    Controls.BillingScheduleInstallment__.OnSelectItem = onBillingScheduleInstallmentSelect;
    Controls.BillingScheduleInstallment__.OnBrowse = onBillingScheduleInstallmentBrowse;
    Controls.BillingScheduleLink__.OnClick = onBillingScheduleLinkClick;
    Controls.BillingScheduleLinkForApprovers__.OnClick = onBillingScheduleLinkClick;
    Controls.InvoiceMismatchAmount__.OnSetValue = onInvoiceMismatchAmountSetValue;
    Controls.RelatedInvoice__.OnSelectItem = onRelatedInvoiceSelectItem;
    Controls.RelatedInvoice__.OnChange = onRelatedInvoiceChange;
    Controls.RelatedInvoice__.OnRemoveValue = function () {
        LayoutHelper.UpdateRelatedInvoiceLink("");
    };
    Controls.RelatedInvoiceForApprovers__.OnSelectItem = onRelatedInvoiceSelectItem;
    Controls.RelatedInvoiceForApprovers__.OnChange = onRelatedInvoiceChange;
    Controls.RelatedInvoiceForApprovers__.OnRemoveValue = function () {
        LayoutHelper.UpdateRelatedInvoiceLink("");
    };
    Controls.EnergyConsumptionLevel__.OnChange = headerEnergyConsumptionChanged;
    Controls.LineItems__.OnSort = onSortLineItems;
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineItems__.FreeDimension1__, Lib.P2P.FreeDimension.DefineOnSelectItem("FreeDimension1ID__", "Code__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1ID__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1ID__"));
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineItems__.FreeDimension1ID__, Lib.P2P.FreeDimension.DefineOnSelectItem("FreeDimension1__", "Description__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1__"), Lib.P2P.FreeDimension.DefineOnUnknownOrEmptyValue("FreeDimension1__"));
    Controls.CodingTemplate__.OnSelectItem = loadTemplate;
    /** BankDetails **/
    Controls.BankDetails__.OnRefreshRow = BankDetails.onRefreshRow;
    /** Extended Withholding taxes **/
    let withholdingTaxParameter;
    if (Lib.ERP.IsSAP() || Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.EnableExtendedWHTEventsForNonSAPIntegrations")) {
        withholdingTaxParameter = Sys.Parameters.GetInstance("AP").GetParameter("TaxesWithholdingTax", "");
    }
    if (withholdingTaxParameter && withholdingTaxParameter === "Extended") {
        Controls.ExtendedWithholdingTax__.WHTType__.OnChange = ExtendedWHTAmountChanged;
        Controls.ExtendedWithholdingTax__.WHTCode__.OnChange = ExtendedWHTAmountChanged;
        Controls.ExtendedWithholdingTax__.WHTBaseAmount__.OnChange = ExtendedWHTAmountChanged;
        Controls.ExtendedWithholdingTax__.WHTTaxAmount__.OnChange = ExtendedWHTAmountChanged;
        Controls.ExtendedWithholdingTax__.OnRefreshRow = onExtendedWHTRefreshRow;
    }
    /** Line Items **/
    Controls.LineItems__.HideTableRowDuplicate(false);
    Controls.LineItems__.Amount__.OnChange = lineItemsAmountChanged;
    Controls.LineItems__.Quantity__.OnChange = lineItemsQuantityChanged;
    Controls.LineItems__.InvoicedUnitPrice__.OnChange = lineItemsInvoicedUnitPriceChanged;
    Controls.LineItems__.GLAccount__.OnChange = glAccountOnChange;
    Controls.LineItems__.CostCenter__.OnChange = onCostCenterChange;
    Controls.LineItems__.WBSElement__.OnChange = onWBSElementChange;
    Controls.LineItems__.CompanyCode__.OnChange = onCrossItemCompanyCodeChange;
    Controls.LineItems__.ProfitCenter__.OnChange = onProfitCenterChange;
    // Override the OnChange event of the custom dimensions if we are not using a legacy connector
    if (!Lib.ERP.CustomERP.Common.IsLegacyConnectorUsed()) {
        // Register OnChange handlers for custom dimensions 1..10
        for (let i = 1; i <= 10; i++) {
            /**
             * /!\ When doing something about
             * Z_CustomDimension_#_Code__
             * or
             * Z_CustomDimension_#_CodeDescription__
             * fields, make sure to check that we are not using a legacy connector.
             *
             * Fields with the same name are used by Bizlab connectors so not checking may lead to issues.
             *
             * A good way to check is to use the function Lib.ERP.CustomERP.Common.IsLegacyConnectorUsed as shown above.
             */
            const fieldName = `Z_CustomDimension_${i}_Code__`;
            if (Controls.LineItems__[fieldName]) {
                Controls.LineItems__[fieldName].OnChange = function () {
                    onCustomDimensionChange.call(this, i);
                };
            }
        }
    }
    Controls.LineItems__.EnergyConsumptionValue__.OnChange = lineItemsEnergyConsumptionChanged;
    Controls.LineItems__.EnergyConsumptionKgCO2e__.OnSetValue = lineItemsEnergyConsumptionKgCO2eChanged;
    Controls.LineItems__.AllowanceChargeCode__.OnChange = LineItemHandleAllowanceAndCharges;
    // handle no tax code mode
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    if (invoiceDoc.DoNotUseTaxCode()) {
        Controls.LineItems__.TaxRate__.OnChange = lineItemsTaxRateChanged;
        Controls.LineItems__.TaxCode__.OnChange = null;
        Controls.LineItems__.TaxJurisdiction__.OnChange = null;
        Controls.LineItems__.TaxJurisdiction__.OnBrowse = null;
    }
    else {
        Controls.LineItems__.TaxRate__.OnChange = null;
        Controls.LineItems__.TaxCode__.OnChange = lineItemsTaxCodeChanged;
        Controls.LineItems__.TaxJurisdiction__.OnChange = calculateTaxJurisdiction;
        Controls.LineItems__.TaxJurisdiction__.OnBrowse = onTaxJurisdictionBrowse;
    }
    // Initialize projectcodedescription__
    Controls.LineItems__.ProjectCode__.OnSelectItem = function (item) {
        const currentItem = this.GetItem();
        if (item) {
            currentItem.SetValue("ProjectCodeDescription__", item.GetValue("Description__"));
        }
    };
    Controls.LineItems__.OrderNumber__.OnClick = onOrderNumberClick;
    Controls.LineItems__.OnDuplicateItem = InvoiceLineItem.OnDuplicateItem;
    Controls.LineItems__.OnAddItem = InvoiceLineItem.OnAddItem;
    Controls.LineItems__.OnDeleteItem = onLineItemDelete;
    Controls.LineItems__.OnRefreshRow = onLineItemRefreshRow;
    Controls.LineItems__.OnFocusRow = onLineItemFocusRow;
    Controls.LineItems__.OnBlurRow = onLineItemBlurRow;
    Controls.CalculateTax__.OnChange = handleTaxComputation;
    Controls.SubsequentDocument__.OnChange = handleSubsequentDocument;
    /** Workflow **/
    Controls.ApproversList__.OnDeleteItem = null;
    Controls.ApproversList__.OnAddItem = null;
    /** Document Panel**/
    // Update toolbar when the reference document is removed
    Controls.DocumentsPanel.OnDocumentDeleted = onDocumentDeleted;
    /** Toolbar **/
    if (Sys.Parameters.GetInstance("AP").GetParameter("WorkflowDisableRules") !== "1") {
        Controls.AddApprover.OnClick = onAddApproverClick;
    }
    /** check signature**/
    Controls.DocumentsPanel.OnDocumentSelected = checkInvoiceSignature;
    /** bank details **/
    Controls.BankDetails__.BankDetails_Select__.OnChange = BankDetails.onCheckBankDetails;
    /** SIM */
    Controls.SupplierInformationManagementLink__.OnClick = OpenCompanyDashboard;
    /** Flux 10.1 - VAT Reverse Charge **/
    Controls.IsFlux10_1Compliant__.OnChange = OnFlux10_1CompliantChange;
    Controls.Flux10_1_ReverseChargeTaxLines__.OnAddItem = ReverseChargeTaxLayoutHelper.OnReverseChargeTaxLineAdd;
    Controls.Flux10_1_ReverseChargeTaxLines__.OnDeleteItem = ReverseChargeTaxLayoutHelper.OnReverseChargeTaxLineDelete;
    Controls.Flux10_1_ReverseChargeTaxLines__.OnRefreshRow = ReverseChargeTaxLayoutHelper.OnReverseChargeRefreshRow;
    Controls.Flux10_1_ReverseChargeTaxLines__.TaxRate__.OnChange = ReverseChargeTaxLayoutHelper.OnTaxRateChange;
    Controls.Flux10_1_ReverseChargeTaxLines__.TaxableAmount__.OnChange = ReverseChargeTaxLayoutHelper.OnTaxableAmountChange;
    Controls.Flux10_1_ReverseChargeTaxLines__.OperationType__.OnChange = ReverseChargeTaxLayoutHelper.OnOperationTypeChange;
    Controls.Flux10_1_ReverseChargeTaxLines__.Flux10_1_TaxCategoryCode__.OnChange = ReverseChargeTaxLayoutHelper.CheckDuplicates;
    Controls.Flux10_1_ReverseChargeTaxLines__.Flux10_1_TaxExemptionReasonCode__.OnChange = ReverseChargeTaxLayoutHelper.CheckDuplicates;
    ReverseChargeTaxLayoutHelper.InitFlux10ReverseChargeTaxLinesSummary();
}
function hideFields() {
    LayoutHelper.HideTechnicalFields();
    // Force Hiding these fields
    // These fields may be displayed in previous invoice in start validation mode
    Controls.ComputingWorkflow__.Hide(true);
    Controls.ReconcileWarning__.Hide(true);
    Controls.TemplateWarning__.Hide(true);
    Controls.ManualLinkExplanation__.Hide(true);
    Controls.SourceDocument__.Hide(true);
}
function generateProcessArchiveLink() {
    const archiveProcessLink = Controls.ArchiveProcessLink__.GetValue();
    if (archiveProcessLink) {
        Controls.ArchiveProcessLinkGenerated__.SetURL(archiveProcessLink);
        Controls.ArchiveProcessLinkGenerated__.Hide(false);
    }
}
const IBANStylesEnum = {
    warning: "highlight-warning",
    success: "highlight-success"
};
const IBANWarningMessageKey = "_Extracted IBAN does not match";
const IBANWarningMessage = Language.Translate(IBANWarningMessageKey);
function cleanCheckIBANDisplay() {
    Controls.ExtractedIBAN__.RemoveStyle(IBANStylesEnum.warning);
    Controls.ExtractedIBAN__.RemoveStyle(IBANStylesEnum.success);
    g_topMessageWarning.Remove(g_topMessageWarning.Find(IBANWarningMessage));
}
function checkIBAN(force, isSilentChange) {
    let bankDetailsDisplay = false;
    // only refresh warning, error, or info
    if (Data.GetValue("ExtractedIBAN__")) {
        Controls.ExtractedIBAN__.Hide(false);
        const shouldCheck = Boolean(Data.GetWarning("ExtractedIBAN__")) || Boolean(Data.GetError("ExtractedIBAN__")) || Boolean(Data.GetInfo("ExtractedIBAN__"));
        if ((force || shouldCheck) && currentStepIsApStart()) {
            const params = {
                companyCode: Data.GetValue("CompanyCode__"),
                vendorNumber: Data.GetValue("VendorNumber__"),
                iban: Data.GetValue("ExtractedIBAN__"),
                isSilentChange: isSilentChange
            };
            // check existence but no automatic selection
            Lib.AP.GetInvoiceDocument().GetVendorBankDetails(params, (vendorsBankAccounts) => {
                cleanCheckIBANDisplay();
                if (isSilentChange) {
                    ProcessInstance.SetSilentChange(true);
                }
                if (vendorsBankAccounts && vendorsBankAccounts.length > 0) {
                    Data.SetWarning("ExtractedIBAN__", "");
                    Data.SetError("ExtractedIBAN__", "");
                    Controls.ExtractedIBAN__.AddStyle(IBANStylesEnum.success);
                    if (isSilentChange) {
                        ProcessInstance.SetSilentChange(false);
                    }
                    return;
                }
                if (!Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.SetAlertWhenExtractedIBANDoesNotMatch", Controls.ExtractedIBAN__)) {
                    Data.SetWarning("ExtractedIBAN__", IBANWarningMessageKey);
                    Controls.ExtractedIBAN__.AddStyle(IBANStylesEnum.warning);
                    g_topMessageWarning.Add(IBANWarningMessage);
                }
                BankDetails.getBankDetails(Lib.AP.GetInvoiceDocument(), isSilentChange);
                bankDetailsDisplay = true;
                if (!force) {
                    BankDetails.show();
                }
                if (isSilentChange) {
                    ProcessInstance.SetSilentChange(false);
                }
            });
        }
        else if (Data.GetValue("ExtractedIBAN__")) {
            Controls.ExtractedIBAN__.AddStyle(IBANStylesEnum.success);
        }
    }
    else if (Controls.ExtractedIBAN__.IsReadOnly()) {
        Controls.ExtractedIBAN__.Hide(true);
    }
    if (!force && !bankDetailsDisplay) {
        BankDetails.hide();
    }
}
function InitReasonsFromConfig(paramListName, paramDataName) {
    const DEFAULT_STANDARD_REASON = "-- none --";
    let reasons = g_apParameters.GetParameter(paramListName);
    // For invoices received through a PDP, the hold and reject reasons are the FRB2B ones, as proposed in the corresponding dialogs
    if (Sys.FRB2B.AP.IsInvoiceCreatedFromPDP()) {
        if (paramDataName === ActionReasonName.HoldReason__) {
            reasons = ButtonsBehavior.formatComboboxReasons(Sys.FRB2B.AP.GetOnHoldReasons());
        }
        else if (paramDataName === ActionReasonName.RejectReason__) {
            reasons = ButtonsBehavior.formatComboboxReasons(Sys.FRB2B.AP.GetRejectReasons());
        }
    }
    const customReasons = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.CustomizeInitReasonsFromConfig", reasons, paramListName, paramDataName);
    if (customReasons !== undefined && customReasons !== null) {
        reasons = customReasons;
    }
    let possibleValues = [];
    if (reasons) {
        possibleValues = reasons.split("\n");
        possibleValues = possibleValues.filter(value => value.indexOf("=") > -1);
        const currentChoice = Data.GetValue(paramDataName);
        Controls[paramDataName].SetAvailableValues(possibleValues);
        // Reset to the previous value if it still exists because SetAvailableValues set the value
        const validCurrentChoice = ButtonsBehavior.getValidCurrentReason(possibleValues.join("\n"), currentChoice);
        if (Sys.FRB2B.AP.IsInvoiceCreatedFromPDP()) {
            Data.SetValue(paramDataName, validCurrentChoice);
        }
        else if (!currentChoice) {
            Data.SetValue(paramDataName, "");
        }
        // default reason in processtemplate is "-- none --" which is a truthy string so we need to reset a potential value set by SetAvailableValues
        else if (currentChoice === DEFAULT_STANDARD_REASON) {
            Data.SetValue(paramDataName, DEFAULT_STANDARD_REASON);
        }
    }
}
function handleEDIComplianceStatusIfNeeded() {
    function getMessages(data) {
        if (!data) {
            return null;
        }
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        }
        catch (e) {
            Log.Error(`Failed to parse EDI compliance messages: ${e.message}`);
            return null;
        }
        if ((parsedData === null || parsedData === void 0 ? void 0 : parsedData.fatalErrors.length) === 0 && (parsedData === null || parsedData === void 0 ? void 0 : parsedData.warnings.length) === 0) {
            return null;
        }
        return parsedData;
    }
    function getIconStatus(status) {
        switch (status) {
            case Lib.AP.EDI.EDIComplianceStatus.Failed:
                return { cssClasses: "fa fa-times-circle fa-lg", color: "#E42518" };
            case Lib.AP.EDI.EDIComplianceStatus.Warning:
                return { cssClasses: "fa fa-exclamation-circle fa-lg", color: "#FF8700" };
            case Lib.AP.EDI.EDIComplianceStatus.Successful:
                return { cssClasses: "fa fa-check-circle-o fa-lg", color: "#008998" };
            default:
                return null;
        }
    }
    if (Lib.AP.EDI.IsEDIComplianceApplicable()) {
        const messageDetails = getMessages(Variable.GetValueAsString("EDIValidationMessages"));
        Controls.French_B2B_compliance_pane.Hide();
        Controls.French_B2B_compliance_HTML__.Hide();
        Controls.French_B2B_compliance_HTML__.SetHTML("");
        if (messageDetails) {
            const showWarnings = Variable.GetValueAsString("EDIComplianceShowWarnings") === "1";
            const isError = (messageDetails === null || messageDetails === void 0 ? void 0 : messageDetails.fatalErrors.length) > 0;
            const messageHeader = "_The submitted EDI file has some compliance issues";
            let htmlString;
            if (showWarnings) {
                const messageLevel = isError ? "danger" : "warning";
                htmlString = Sys.EDI.FRB2B.Client.ComplianceMessage.GetHTMLString(messageLevel, messageHeader, [], messageDetails.fatalErrors, false, false, null, null, messageDetails.warnings, false, true);
            }
            else if (isError) {
                htmlString = Sys.EDI.FRB2B.Client.ComplianceMessage.GetHTMLString("danger", messageHeader, [], messageDetails.fatalErrors, false, false, null, null, [], false, false);
            }
            if (showWarnings || isError) {
                Controls.French_B2B_compliance_pane.Hide(false);
                Controls.French_B2B_compliance_HTML__.Hide(false);
                Controls.French_B2B_compliance_HTML__.SetHTML(htmlString);
            }
        }
        const type = Data.GetValue("EDIComplianceType__");
        const iconStatus = getIconStatus(Data.GetValue("EDIComplianceStatus__"));
        if (type && iconStatus) {
            Controls.EDINiceComplianceStatus__.SetHTML(`<div>${Language.Translate(type, false)}<span class='${iconStatus.cssClasses}'></div>`);
            Controls.EDINiceComplianceStatus__.SetCSS(`div { padding-left: 7px; padding-right: 2px; margin: 4px auto; } .fa { padding-left: 7px; color: ${iconStatus.color}; }`);
            Controls.EDINiceComplianceStatus__.Hide(false);
        }
        else {
            Controls.EDINiceComplianceStatus__.Hide(true);
        }
    }
}
function InitEDIFields() {
    handleEDIComplianceStatusIfNeeded();
    if (Lib.AP.ReceptionMethod.isEDI()) {
        Controls.EDIInvoiceType__.Hide(false);
        if (Controls.IntercompanyInvoice__.IsChecked()) {
            g_topMessageWarning.Add(Language.Translate("_Intercompany invoice warning"));
        }
        if (Sys.FRB2B.AP.IsFRB2B()) {
            Controls.EDIStatus__.Hide(false);
            Controls.AmountDueForPayment__.Hide(false);
            Controls.EDIBusinessProcessType__.Hide(false);
            if (Data.GetValue("EDIInvoiceType__") === "393") {
                // Show Alternative Payee pane for "factor invoices"
                Controls.Payment.Hide(false);
                Controls.AlternativePayee.Hide(false);
            }
            const cdvRuidEx = Data.GetValue("CDVRuidEx__");
            if (cdvRuidEx) {
                Controls.EDIStatus__.DisplayAs({ type: "Link" });
                const openMessageParams = {
                    ruidEx: cdvRuidEx,
                    goBackOnQuit: false,
                    inNewTab: true,
                    additionalParameters: {
                        OnQuit: "Close"
                    }
                };
                Controls.EDIStatus__.OnClick = function () {
                    Process.OpenMessage(openMessageParams);
                };
            }
        }
    }
}
function InitFRB2BFields() {
    Controls.IsFlux10_1Compliant__.Hide(!ShouldShowFlux10_1Control());
    Controls.FlowID__.Hide(!Sys.FRB2B.AP.IsFRB2B());
    Controls.ElectronicRoutingAddress__.Hide(!Sys.FRB2B.AP.IsFRB2B());
    InitFlux10_1Fields();
    setupFRB2BAllowedValues();
}
/**
 * Filters and reorders the available values for a control based on allowed values array
 * @param control The ISelectable control to update with filtered values
 * @param allowedValues The sorted array of allowed values to filter and reorder by
 * @param silent Whether to set the available values silently without triggering change events
 */
function filterAndReorderControlValues(control, allowedValues, silent = false) {
    if (!control) {
        return;
    }
    const currentAvailableValues = control.GetAvailableValues();
    if (allowedValues && allowedValues.length > 0 && currentAvailableValues && currentAvailableValues.length > 0) {
        // Allow empty value at first
        allowedValues.unshift("");
        // Create a map of code -> "code=label" from all available values for quick lookup
        const typeMap = new Map();
        for (const typeValue of currentAvailableValues) {
            const code = typeValue.split("=")[0]; // Extract code from "code=label" format
            typeMap.set(code, typeValue);
        }
        // Build filtered values in the order of allowedValues, preserving labels from typeMap
        const filteredValues = [];
        for (const allowedCode of allowedValues) {
            const typeValue = typeMap.get(String(allowedCode));
            if (typeValue) {
                filteredValues.push(typeValue);
            }
        }
        // Set the filtered and reordered available values
        if (filteredValues.length > 0) {
            const isSilent = ProcessInstance.GetSilentChange();
            ProcessInstance.SetSilentChange(silent);
            control.SetAvailableValues(filteredValues);
            ProcessInstance.SetSilentChange(isSilent);
        }
    }
}
async function setupFRB2BAllowedValues() {
    if (!Sys.FRB2B.AP.IsFRB2B() && Sys.FRB2B.AP.IsFlux10_1Compliant() !== "1") {
        return;
    }
    // EDIInvoiceType__ and EDIBusinessProcessType__ are filled asynchronously from a DataTable
    // query whose result may arrive after the process is initialized. Wait for these controls'
    // pending checks to complete before filtering and reordering their available values.
    const pendingChecks = [];
    if (Controls.EDIInvoiceType__) {
        pendingChecks.push(Controls.EDIInvoiceType__.WaitForCheck());
    }
    if (Controls.EDIBusinessProcessType__) {
        pendingChecks.push(Controls.EDIBusinessProcessType__.WaitForCheck());
    }
    await Promise.all(pendingChecks);
    const reverseChargeTaxExemptionCodeValues = Sys.FRB2B.AP.GetAllowedReverseChargeTaxExemptionReasonCodes();
    const reverseChargeTaxLinesControl = Controls.Flux10_1_ReverseChargeTaxLines__;
    const isSilent = ProcessInstance.GetSilentChange();
    ProcessInstance.SetSilentChange(true);
    reverseChargeTaxLinesControl.Flux10_1_TaxExemptionReasonCode__.SetAvailableValues(reverseChargeTaxExemptionCodeValues);
    ProcessInstance.SetSilentChange(isSilent);
    // Filter and reorder EDI Invoice Types
    filterAndReorderControlValues(Controls.EDIInvoiceType__, Sys.FRB2B.AP.ValidationRules.GetSortedAllowedInvoiceTypes(), true);
    // Filter and reorder EDI Business Process Types
    filterAndReorderControlValues(Controls.EDIBusinessProcessType__, Sys.FRB2B.AP.ValidationRules.GetSortedAllowedBusinessProcessTypes(), true);
}
function InitGHGEmissionsFields() {
    if (Lib.P2P.GHGEmissions.IsEnergyConsumptionReportingEnabled()) {
        Controls.EnergyConsumptionLevel__.SetRequired(true);
        if (Data.GetValue("EnergyConsumptionPrecision__") === Lib.P2P.GHGEmissions.EnergyConsumptionPrecisionType.Estimated) {
            const factor = Data.GetValue("GHGEmissionFactor__");
            const currency = Data.GetValue("InvoiceCurrency__");
            const convertedFactor = (factor * 1000).toLocaleString(User.culture, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const translatedLabel = Language.Translate("_helpdata_EnergyConsumptionLevel estimated using {0} gCO2e/{1}", true, convertedFactor, currency);
            Controls.EnergyConsumptionKgCO2e__.SetHelpData(translatedLabel, "2551");
        }
    }
}
function IsFlux10_1CompliantChecked() {
    return Controls.IsFlux10_1Compliant__.IsChecked();
}
function ShouldShowFlux10_1Control() {
    return Sys.FRB2B.AP.IsInternationalEReportingEnabled() && !Sys.FRB2B.AP.IsInvoiceCreatedFromPDP();
}
function InitFlux10_1Fields(previousValue) {
    ProcessInstance.SetSilentChange(true);
    const isFlux10_1Compliant = IsFlux10_1CompliantChecked();
    const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
    const complianceChanged = previousValue !== Data.GetValue("IsFlux10_1Compliant__");
    const shouldBeReadOnly = isPosted && Controls.IsFlux10_1Compliant__.IsChecked();
    Controls.IsFlux10_1Compliant__.SetReadOnly(shouldBeReadOnly);
    const controlsToHide = [
        Controls.EDIInvoiceType__,
        Controls.EDIBusinessProcessType__,
        Controls.Flux10_1Panel,
        Controls.Flux10_1_DeliveryDetailsPanel,
        Controls.Flux10_1_VatReverseChargePanel
    ];
    for (const control of controlsToHide) {
        control.Hide(!isFlux10_1Compliant);
    }
    const controlsToSetRequired = [
        Controls.EDIInvoiceType__,
        Controls.EDIBusinessProcessType__,
        Controls.Flux10_1_TaxDueDateTypeCode__,
        Controls.Flux10_1_BuyerCompanyId__,
        Controls.Flux10_1_SellerId__,
        Controls.Flux10_1_SellerIdSchemeId__,
        Controls.InvoiceNumber__
    ];
    for (const control of controlsToSetRequired) {
        control.SetRequired(isFlux10_1Compliant);
    }
    Controls.EDIBusinessProcessType__.SetReadOnly(!isFlux10_1Compliant);
    if (isFlux10_1Compliant) {
        if (Data.GetComputedValueSource("EDIInvoiceType__") !== "EDI") {
            Controls.EDIInvoiceType__.SetReadOnly(false);
        }
        setTaxDueDateTypeCodeRequiredIfNeeded();
        if (!Controls.Flux10_1_BuyerCompanyId__.GetValue()) {
            prefillBuyerCompanyId();
        }
        if (!Controls.Flux10_1_SellerId__.GetValue()) {
            initSellerId();
        }
        Controls.EDIInvoiceType__.Hide(false);
        Controls.EDIInvoiceType__.SetRequired(isFlux10_1Compliant);
        Controls.EDIInvoiceType__.OnChange = OnEDIInvoiceTypeChange;
        Controls.EDIBusinessProcessType__.OnChange = OnEDIInvoiceTypeChange;
        if (!ReverseChargeTaxLayoutHelper.onInit && complianceChanged) {
            Lib.AP.FRB2B.VatReverseCharge.AddDefaultLine();
        }
    }
    else {
        Controls.Flux10_1_BuyerCompanyId__.SetValue("");
        Controls.Flux10_1_BuyerCompanyIdSchemeId__.SetValue("");
        Controls.Flux10_1_SellerId__.SetValue("");
        Controls.Flux10_1_SellerIdSchemeId__.SetValue("");
        Controls.EDIInvoiceType__.SetReadOnly(true);
        if (!ReverseChargeTaxLayoutHelper.onInit && complianceChanged) {
            Controls.ManualExchangeRate__.SetValue(null);
            Data.GetTable("Flux10_1_ReverseChargeTaxLines__").SetItemCount(0);
            onManualExchangeRateChange();
        }
        InitEDIFields();
    }
    ReverseChargeTaxLayoutHelper.UpdateFlux10ReverseCharge();
    ProcessInstance.SetSilentChange(false);
}
const ReverseChargeTaxLayoutHelper = {
    onInit: true, //onInit is set to false after form is initialized
    UpdateFlux10ReverseCharge: function () {
        const current = Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant();
        const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
        if (isPosted) {
            ReverseChargeTaxLayoutHelper.SetFieldsVisibility(current, true);
        }
        else {
            ReverseChargeTaxLayoutHelper.SetFieldsVisibility(current);
        }
    },
    /** Table handling */
    InitFlux10ReverseChargeTaxLinesSummary: function () {
        Sys.Helpers.Table.AddSummarySumDecimals(Controls.Flux10_1_ReverseChargeTaxLines__, [
            {
                columnName: "TaxableAmount__",
                summaryControlName: "TotalTaxableAmount",
                readOnly: true,
                formatNumberOptions: { precisionMax: 2 }
            },
            {
                columnName: "TaxAmount__",
                summaryControlName: "TotalTaxAmount",
                readOnly: true,
                formatNumberOptions: { precisionMax: 2 }
            },
            {
                columnName: "LocalTaxAmount__",
                summaryControlName: "TotalLocalTaxAmount",
                readOnly: true,
                formatNumberOptions: { precisionMax: 2 }
            }
        ]);
    },
    ApplyOperationTypeConfiguration: function (item, row) {
        const reverseChargeTaxSubTotalValues = Sys.FRB2B.AP.GetReverseChargeTaxSubTotalValues(item.GetValue("OperationType__"), item.GetValue("Flux10_1_TaxCategoryCode__"), item.GetValue("Flux10_1_TaxExemptionReasonCode__"), item.GetValue("Flux10_1_TaxExemptionReason__"));
        const canEditManualFields = reverseChargeTaxSubTotalValues.isManualEntry && !ProcessInstance.isReadOnly;
        item.SetValue("Flux10_1_TaxCategoryCode__", reverseChargeTaxSubTotalValues.taxCategoryCode);
        item.SetValue("Flux10_1_TaxExemptionReasonCode__", reverseChargeTaxSubTotalValues.taxExemptionReasonCode);
        item.SetValue("Flux10_1_TaxExemptionReason__", reverseChargeTaxSubTotalValues.taxExemptionReason);
        if (row) {
            row.Flux10_1_TaxCategoryCode__.SetReadOnly(!canEditManualFields);
            row.Flux10_1_TaxExemptionReasonCode__.SetReadOnly(!canEditManualFields);
            row.Flux10_1_TaxExemptionReason__.SetReadOnly(!canEditManualFields);
        }
    },
    ApplyOperationTypeConfigurationOnAllRows: function () {
        const tableControl = Controls.Flux10_1_ReverseChargeTaxLines__;
        // This map is created in order to only update rows which are displayed with ApplyOperationTypeConfiguration function
        const visibleRowsByItemIndex = new Map();
        const visibleRowCount = tableControl.GetLineCount(true);
        for (let visibleIndex = 0; visibleIndex < visibleRowCount; visibleIndex++) {
            const row = tableControl.GetRow(visibleIndex);
            const itemIndex = row.GetLineNumber(true) - 1;
            visibleRowsByItemIndex.set(itemIndex, row);
        }
        Data.GetTable("Flux10_1_ReverseChargeTaxLines__").ForEachItem((item, itemIndex) => {
            ReverseChargeTaxLayoutHelper.ApplyOperationTypeConfiguration(item, visibleRowsByItemIndex.get(itemIndex));
        });
    },
    OnReverseChargeRefreshRow: function (index) {
        const row = Controls.Flux10_1_ReverseChargeTaxLines__.GetRow(index);
        const item = row.GetItem();
        ReverseChargeTaxLayoutHelper.ApplyOperationTypeConfiguration(item, row);
    },
    OnReverseChargeTaxLineAdd: function (item, index) {
        if (Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant()) {
            const netAmount = Data.GetValue("NetAmount__") || 0;
            const totalTaxableAmount = Lib.AP.FRB2B.VatReverseCharge.GetTotalTaxableAmount();
            const remaining = Lib.AP.RoundWithAmountPrecision(netAmount - totalTaxableAmount);
            const newTaxableAmount = Lib.AP.IsCreditNote() ? Math.min(remaining, 0) : Math.max(remaining, 0);
            item.SetValue("TaxableAmount__", newTaxableAmount);
            Lib.AP.FRB2B.VatReverseCharge.CheckTotalTaxableAmountWarning(totalTaxableAmount + newTaxableAmount);
            ReverseChargeTaxLayoutHelper.CheckDuplicates.call(this);
        }
    },
    OnReverseChargeTaxLineDelete: function () {
        ReverseChargeTaxLayoutHelper.CheckDuplicates.call(this);
        Lib.AP.FRB2B.VatReverseCharge.CheckTotalTaxableAmountWarning();
    },
    OnTaxRateChange: function () {
        ReverseChargeTaxLayoutHelper.CheckDuplicates.call(this);
        const value = this.GetValue();
        if (value !== null && (value <= 0 || value > 100)) {
            this.SetError("_ReverseChargeTaxInvalidTaxRate");
        }
        ReverseChargeTaxLayoutHelper.ComputeReverseChargeTaxAmount.call(this);
    },
    OnOperationTypeChange: function () {
        ReverseChargeTaxLayoutHelper.ApplyOperationTypeConfiguration(this.GetItem(), this.GetRow());
        ReverseChargeTaxLayoutHelper.CheckDuplicates.call(this);
    },
    OnTaxableAmountChange: function () {
        const value = this.GetValue();
        let error = "";
        if (Lib.AP.IsCreditNote()) {
            if (value > 0) {
                error = "_ReverseChargeTaxInvalidTaxableAmountCreditNote";
            }
        }
        else if (value < 0) {
            error = "_ReverseChargeTaxInvalidTaxableAmount";
        }
        this.SetError(error);
        ReverseChargeTaxLayoutHelper.ComputeReverseChargeTaxAmount.call(this);
        Lib.AP.FRB2B.VatReverseCharge.CheckTotalTaxableAmountWarning();
    },
    CheckDuplicates: function () {
        const currentItem = this.GetItem();
        const currentKey = currentItem ? `${currentItem.GetValue("TaxRate__")}|${currentItem.GetValue("Flux10_1_TaxCategoryCode__")}|${currentItem.GetValue("Flux10_1_TaxExemptionReasonCode__")}` : null;
        const duplicateErrorMessage = Language.Translate("_ReverseChargeTaxDuplicatesError", false);
        let duplicates = new Map();
        Data.GetTable("Flux10_1_ReverseChargeTaxLines__").ForEachItem((item) => {
            if (item.GetError("TaxRate__") === duplicateErrorMessage) {
                item.SetError("TaxRate__", "");
            }
            const key = `${item.GetValue("TaxRate__")}|${item.GetValue("Flux10_1_TaxCategoryCode__")}|${item.GetValue("Flux10_1_TaxExemptionReasonCode__")}`;
            duplicates.set(key, [...(duplicates.get(key) || []), item]);
        });
        duplicates.forEach((items, key) => {
            if (items.length > 1) {
                if (key === currentKey) {
                    //Set error on TaxRate__ of the changed row
                    currentItem.SetError("TaxRate__", "_ReverseChargeTaxDuplicatesError");
                }
                else {
                    //Set error on first item of duplicates
                    items[0].SetError("TaxRate__", "_ReverseChargeTaxDuplicatesError");
                }
            }
        });
    },
    ComputeReverseChargeTaxAmount: function () {
        const item = this.GetItem();
        const taxRate = item.GetValue("TaxRate__") || 0;
        const taxableAmount = item.GetValue("TaxableAmount__") || 0;
        const taxAmount = Lib.AP.RoundWithAmountPrecision(taxableAmount * taxRate / 100);
        const exchangeRate = Data.GetValue("ExchangeRate__") || 1;
        item.SetValue("TaxAmount__", taxAmount);
        Lib.AP.FRB2B.VatReverseCharge.SetLocalTaxAmount(item, taxAmount, exchangeRate);
    },
    RecomputeLocalTaxAmounts: function (exchangeRate) {
        Data.GetTable("Flux10_1_ReverseChargeTaxLines__").ForEachItem((item) => {
            const taxAmount = item.GetValue("TaxAmount__") || 0;
            Lib.AP.FRB2B.VatReverseCharge.SetLocalTaxAmount(item, taxAmount, exchangeRate);
        });
    },
    /** UI Handling */
    SetFieldsVisibility: function (isReverseCharge, isPosted) {
        Controls.Flux10_1_VatReverseChargePanel.Hide(!isReverseCharge);
        ReverseChargeTaxLayoutHelper.UpdateLocalFieldsVisibility();
        ReverseChargeTaxLayoutHelper.UpdateExchangeRateVisibility();
        if (isPosted) {
            Controls.Flux10_1_ReverseChargeTaxLines__.SetReadOnly(false);
        }
        ReverseChargeTaxLayoutHelper.ApplyOperationTypeConfigurationOnAllRows();
        const controlsToSetRequired = [
            Controls.Flux10_1_ReverseChargeTaxLines__.OperationType__,
            Controls.Flux10_1_ReverseChargeTaxLines__.TaxRate__,
            Controls.Flux10_1_ReverseChargeTaxLines__.TaxableAmount__,
            Controls.Flux10_1_ReverseChargeTaxLines__.Flux10_1_TaxExemptionReason__
        ];
        for (const control of controlsToSetRequired) {
            control.SetRequired(isReverseCharge);
        }
    },
    UpdateExchangeRateVisibility: function () {
        const invoiceCurrency = Controls.InvoiceCurrency__.GetValue();
        const localCurrency = Controls.LocalCurrency__.GetValue();
        const showExchangeRate = Boolean(invoiceCurrency) && Boolean(localCurrency) && invoiceCurrency !== localCurrency
            && Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant();
        const isPosted = Boolean(Controls.ERPPostingDate__.GetValue());
        const isEditable = showExchangeRate && !isInApprovalWorkflow() && !isPosted && !ProcessInstance.isReadOnly;
        if (ReverseChargeTaxLayoutHelper.onInit) {
            const exchangeRate = Controls.ExchangeRate__.GetValue();
            Controls.ManualExchangeRate__.SetValue(exchangeRate ? Number(exchangeRate) : null);
        }
        Controls.ManualExchangeRate__.Hide(!showExchangeRate);
        Controls.ManualExchangeRate__.SetReadOnly(!isEditable);
    },
    UpdateLocalFieldsVisibility: function () {
        const isRevertCharge = Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant();
        const invoiceCurrency = Data.GetValue("InvoiceCurrency__");
        const showLocalFields = isRevertCharge && invoiceCurrency !== "EUR";
        Controls.LocalCurrency__.Hide(!showLocalFields);
        Controls.LocalNetAmount__.Hide(!showLocalFields);
    },
    ValidateFields: function () {
        const isReverseCharge = Lib.AP.FRB2B.VatReverseCharge.IsVendorCompliant();
        if (isReverseCharge) {
            const lines = Data.GetTable("Flux10_1_ReverseChargeTaxLines__");
            const nbItems = lines.GetItemCount();
            for (let i = 0; i < nbItems; i++) {
                const tableRow = Controls.Flux10_1_ReverseChargeTaxLines__.GetRow(i);
                if (tableRow) {
                    tableRow.OperationType__.Focus();
                    tableRow.TaxRate__.Focus();
                    tableRow.TaxableAmount__.Focus();
                }
            }
        }
    }
};
function retrieveSiren(siret) {
    const siretLength = 14;
    const sirenLength = 9;
    const cleanSiret = siret.replace(/\D/g, "");
    if (cleanSiret.length === siretLength) {
        return cleanSiret.substring(0, sirenLength);
    }
    else if (cleanSiret.length === sirenLength) {
        return cleanSiret;
    }
    return "";
}
function initSellerId() {
    var _a;
    Controls.Flux10_1_SellerId__.SetValue("");
    const vatNumber = (_a = Sys.FRB2B.AP.GetFRB2BInternationalReportingData()) === null || _a === void 0 ? void 0 : _a.VendorVATNumber;
    if (vatNumber) {
        Controls.Flux10_1_SellerId__.SetValue(vatNumber);
        Controls.Flux10_1_SellerId__.SetReadOnly(true);
    }
    else {
        Controls.Flux10_1_SellerId__.SetReadOnly(false);
    }
}
function prefillBuyerCompanyId() {
    const options = {
        table: "PurchasingCompanycodes__",
        filter: `(CompanyCode__=${Data.GetValue("CompanyCode__")})`,
        attributes: ["CompanyCode__", "SIRET__"],
        maxRecords: 1
    };
    const schemeIdForSiren = "0002";
    Controls.Flux10_1_BuyerCompanyId__.SetValue("");
    Controls.Flux10_1_BuyerCompanyIdSchemeId__.SetValue("");
    Sys.GenericAPI.PromisedQuery(options)
        .Then((queryResults) => {
        if (queryResults.length > 0) {
            ProcessInstance.SetSilentChange(true);
            queryResults.forEach((r) => {
                const siret = r.SIRET__;
                if (siret) {
                    let siren = retrieveSiren(siret);
                    if (siren !== "") {
                        Controls.Flux10_1_BuyerCompanyId__.SetValue(siren);
                        Controls.Flux10_1_BuyerCompanyIdSchemeId__.SetValue(schemeIdForSiren);
                    }
                }
            });
            ProcessInstance.SetSilentChange(false);
        }
    });
}
function setTaxDueDateTypeCodeRequiredIfNeeded() {
    var _a;
    if (((_a = Sys.FRB2B.AP.GetFRB2BInternationalReportingData()) === null || _a === void 0 ? void 0 : _a.CompanyCodeTaxMode) === Sys.FRB2B.AP.CompanyCodeTaxMode.OverDebit) {
        Controls.Flux10_1_TaxDueDateTypeCode__.SetRequired(true);
    }
    else {
        Controls.Flux10_1_TaxDueDateTypeCode__.SetRequired(false);
    }
}
function initializeForm() {
    /** ******************* **/
    /** Form initialization **/
    /** ******************* **/
    hideFields();
    if (!Data.GetValue("CorporateCurrency__")) {
        // should be fill by extraction
        Data.SetValue("CorporateCurrency__", Sys.Parameters.GetInstance("P2P").GetParameter("CorporateCurrency", ""));
    }
    Controls.ERP__.Hide(!Sys.Parameters.GetInstance("P2P").GetParameter("EnableERPSelection"));
    let ERPName = Lib.ERP.GetERPName();
    if (Lib.ERP.IsCustomERP(ERPName)) {
        let availableValues = Controls.ERP__.GetAvailableValues();
        availableValues.push(ERPName + "=" + ERPName);
        Controls.ERP__.SetAvailableValues(availableValues);
    }
    if (ProcessInstance.isReadOnly) {
        Controls.Comment__.Hide(true);
        Controls.SpacerComment__.Hide(true);
    }
    else {
        Controls.Comment__.SetPlaceholder(g_CommentPlaceHolder);
    }
    if (Controls.PostingDate__.IsRequired()) {
        Controls.PostingDate__.SetRequired(false);
    }
    Lib.AP.ComputeBackdatingTargetDate(function (backDatedDate) {
        ProcessInstance.SetSilentChange(true);
        Controls.PostingDate__.SetPlaceholder(Sys.Helpers.Date.ToLocaleDateEx(backDatedDate, User.culture));
        Variable.SetValueAsString("PostingDatePlaceholder", backDatedDate);
        ProcessInstance.SetSilentChange(false);
    }, ProcessInstance);
    generateProcessArchiveLink();
    Controls.LastValidatorName__.SetValue(User.fullName);
    Controls.LastValidatorUserId__.SetValue(User.loginId);
    handleTaxComputation(true);
    // Initialize Workflow
    if (!ProcessInstance.isReadOnly) {
        Lib.AP.WorkflowCtrl.InitRolesSequence();
    }
    Lib.AP.GetInvoiceDocumentLayout().Init();
    LayoutHelper.InitWorkflowDataPanel();
    // User exit for reordering the LineItems__ table
    const newColumnsOrder = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.GetColumnsOrder", Controls.LineItems__.GetColumnsOrder());
    if (newColumnsOrder &&
        Object.prototype.toString.call(newColumnsOrder) === "[object Array]") {
        Controls.LineItems__.SetColumnsOrder(newColumnsOrder);
    }
    // initializes the teaching request mechanism
    RequestTeaching.Init();
    // FT-024574 - Init aside/reject/onhold reasons from P2P configuration
    InitReasonsFromConfig(ConfigActionReasonName.RejectReasons, ActionReasonName.RejectReason__);
    InitReasonsFromConfig(ConfigActionReasonName.BackToAPReasons, ActionReasonName.BackToAPReason__);
    if (currentStepIsApStart()) {
        InitReasonsFromConfig(ConfigActionReasonName.AsideReasons, ActionReasonName.AsideReason__);
    }
    else {
        InitReasonsFromConfig(ConfigActionReasonName.HoldReasons, ActionReasonName.HoldReason__);
    }
    InvoiceLineItem.InitializeLineCounts();
    // Set layout according to type (PO or non PO)
    setGRIVMode(true);
    LayoutHelper.AdaptProcessLayoutToInvoiceType(false);
    EmbeddedViews.InitAllEmbeddedViewPanels();
    checkIBAN(false, true);
    Holds.manageVisibility();
    ParameterDetails.hide();
    // FT-022103 - Contract matching - Display matching invoices on contracts
    LayoutHelper.DisplayContractsElements();
    // FT-032539 - GHG emissions - Display fields for GHG Emission Reporting
    LayoutHelper.DisplayGHGEmissionReportingElements();
    // FT-035308 - 2.2 Display analytic fields in invoice form
    LayoutHelper.DisplayERPCustomDimensions();
    // Init EventHistory panel (Conversation)
    LayoutHelper.InitEventHistoryPanel();
    // Set layout according to the step in the workflow
    LayoutHelper.AdaptProcessLayoutToStep();
    // Update buttons according to the state in the workflow
    LayoutHelper.UpdateButtonBar();
    LayoutHelper.DisplayVendorStatusIcons();
    // ensure Withholding tax amounts are correct
    RefreshExtendedWHTAmounts();
    //Check invoice signature
    checkInvoiceSignature();
    DuplicateCheck.DoCheck(true);
    const invoiceDoc = Lib.AP.GetInvoiceDocument();
    invoiceDoc.CustomizeButtonsBehavior(ButtonsBehavior);
    ButtonsBehavior.init();
    TaxCodeHelper.init();
    ERP.DisplaySimulationResult();
    if (Data.GetValue("ExchangeRate__") === 0 && !isInApprovalWorkflow()) {
        const invoiceCurrency = Controls.InvoiceCurrency__.GetValue();
        checkInvoiceCurrency(invoiceCurrency);
    }
    DisplayAlertIfAny();
    Lib.P2P.DisplayArchiveDurationWarning("AP", () => Lib.P2P.DisplayArchiveDurationWarningAsTopMessageWarning(g_topMessageWarning));
    // display invoice reversed warning
    if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.Reversed) {
        g_topMessageWarning.Add(Language.Translate("_Reversed invoice warning"));
    }
    Lib.P2P.DisplayBackupUserWarning("AP", function (displayName) {
        g_topMessageWarning.Add(Language.Translate("_View on bealf of {0}", false, displayName));
    });
    const today = new Date();
    const dueDate = Data.GetValue("DueDate__");
    const estimatedLatePaymentDays = Data.GetValue("EstimatedLatePaymentDays__");
    if (dueDate && today.getTime() < dueDate.getTime() && estimatedLatePaymentDays && estimatedLatePaymentDays > 0 && Data.GetValue("State") < 100) {
        g_topMessageWarning.Add(Language.Translate("_Potential late fees"));
    }
    // Initialize saved currency with extracted value
    g_invoiceCurrency = Data.GetValue("InvoiceCurrency__");
    if (Variable.GetValueAsString("IsExtendedValidityPeriod") === "true" && Data.GetValue("State") < 100) {
        const expirationDate = Sys.Helpers.Date.ToLocaleDateEx(Data.GetValue("ValidityDateTime"), User.culture);
        g_topMessageWarning.Add(Language.Translate("_ExtendedValidityPeriodWarning {0}", false, expirationDate));
    }
    if (Variable.GetValueAsString("IsSelfBillingInvoice") === "true" && Data.GetValue("State") < 100) {
        g_topMessageWarning.Add(Language.Translate("_SelfBillingInvoiceWarning"));
    }
    ReverseChargeTaxLayoutHelper.onInit = true;
    InitEDIFields();
    InitFRB2BFields();
    InitGHGEmissionsFields();
    ReverseChargeTaxLayoutHelper.onInit = false;
    Lib.AP.PeppolC5Reporting.InitC5FieldsVisibility();
    // Force order of non-standard columns (order from layout can be modified upon each update, during merge step)
    const additionalColumnsOrder = [...Lib.AP.PeppolC5Reporting.GetC5CustomColumnsOrder(), ...LayoutHelper.GetERPCustomDimensionsColumnsOrder()];
    LayoutHelper.SetCustomFieldsColumnsOrder(additionalColumnsOrder);
    const sourceDocument = Data.GetValue("SourceDocument__");
    if (sourceDocument && Lib.AP.WorkflowCtrl.GetCurrentStepRole() === "_Role APStart") {
        Controls.SourceDocument__.Hide(false);
        const mapper = Lib.AP.MappingManager.GetMapper(Data.GetValue("ReceptionMethod__"));
        if (mapper && mapper.OnSourceDocucmentClick) {
            Controls.SourceDocument__.DisplayAs({ type: "Link" });
            Controls.SourceDocument__.OnClick = mapper.OnSourceDocucmentClick;
            if (mapper.SourceDocumentLabel) {
                Controls.SourceDocument__.SetLabel(Language.Translate(mapper.SourceDocumentLabel));
            }
        }
    }
    else {
        Controls.SourceDocument__.Hide(true);
    }
    LayoutHelper.SetHelperIDBasedOnCurrentStepRole();
    handleContractValidity();
    //Billing schedule
    Controls.BillingScheduleLink__.OnBrowse = function () {
        Controls.BillingScheduleInstallment__.DoBrowse();
    };
    Controls.BillingScheduleLink__.OnRemoveValue = function () {
        resetBillingScheduleFields();
    };
    if (Lib.P2P.BillingSchedule.IsVIPElligibleToBillingScheduleInstallments()) {
        if (Controls.BillingScheduleID__.GetValue() &&
            Controls.BillingScheduleDate__.GetValue()) {
            showBillingScheduleInstallments();
            setBillingScheduleLink(Controls.BillingScheduleID__.GetValue(), Controls.BillingScheduleDate__.GetValue(), User.culture);
            if (!ProcessInstance.isReadOnly) {
                Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
            }
        }
        else {
            checkAndSetBillingScheduleInstallmentLayout();
        }
    }
    else {
        hideBillingScheduleInstallments();
    }
    adaptMismatchAmountWarningMessageToStep();
    initializeRelatedInvoiceDatabaseComboBox();
    onRelatedInvoiceChange();
    if (!Data.GetValue("ERPInvoiceNumber__") && !Data.GetValue("ERPMMInvoiceNumber__")) {
        LayoutHelper.UpdateRelatedInvoiceLink(Data.GetValue("RelatedInvoiceRuidEx__"), false);
    }
    // Display or hide invoice period date fields
    displayInvoiceLinePeriodIfHasValue();
    LayoutHelper.HandleVendorContactEmailRequirement();
}
function checkAndSetBillingScheduleInstallmentLayout() {
    if (Data.GetValue("VendorNumber__")) {
        const contractNumber = Data.GetValue("ContractNumber__");
        const contractReferenceNumber = Data.GetValue("ContractReferenceNumber__");
        const vendorNumber = Data.GetValue("VendorNumber__");
        let filter = "";
        if (contractReferenceNumber && contractNumber) {
            filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ContractReferenceNumber__", contractReferenceNumber), Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", contractNumber), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber)).toString();
        }
        else {
            filter = Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber).toString();
        }
        Sys.GenericAPI.PromisedQuery({
            table: Lib.P2P.BillingSchedule.BillingScheduledItemsTable,
            filter: filter,
            attributes: ["ruidex"],
            maxRecords: 1,
            additionalOptions: {
                useConstantQueryCache: true,
                searchInArchive: true
            }
        }).Then((result) => {
            if (result && result.length > 0) {
                showBillingScheduleInstallments();
                if (Data.IsNullOrEmpty("BillingScheduleID__")) {
                    Lib.P2P.BillingSchedule.VIPSetWarningMessageInstallmentCouldMatch();
                    Lib.P2P.BillingSchedule.VIPSetBillingScheduleMessage(Controls);
                }
            }
            else {
                hideBillingScheduleInstallments();
            }
        });
    }
    else {
        hideBillingScheduleInstallments();
    }
}
function initializeRelatedInvoiceDatabaseComboBox() {
    const fieldNames = ["RelatedInvoice__", "RelatedInvoiceForApprovers__"];
    function queryForAutoComplete(query_callback, object_to_query, attributes, filter, sort_order, max_items) {
        const filterWithVendorNumber = Sys.Helpers.LdapUtil.FilterAnd(filter, Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", Data.GetValue("VendorNumber__"))).toString();
        /**
         * @this
         */
        const callback = function () {
            query_callback(this.GetQueryValue());
        };
        Query.DBQuery(callback, object_to_query, attributes, filterWithVendorNumber, sort_order, max_items);
    }
    const getCustomizeFieldFunc = (fieldName) => {
        return function (searchField) {
            searchField.SetValue(Controls[fieldName].GetValue());
        };
    };
    for (let fieldName of fieldNames) {
        // Customize autocomplete query, to add filter on VendorNumber__
        let configSharedBetweenQueries = {};
        Controls[fieldName].SetCustomQuery(null, null, queryForAutoComplete, configSharedBetweenQueries);
        // Customize browse window and prefill VendorNumber__
        Controls[fieldName].ClearSearchFields();
        Controls[fieldName].AddSearchField({
            type: "Text",
            label: "_Invoice number",
            id: "InvoiceNumber__",
            customize: getCustomizeFieldFunc(fieldName)
        });
        Controls[fieldName].AddSearchField({
            type: "Text",
            label: "_Vendor number",
            id: "VendorNumber__",
            customize: getCustomizeFieldFunc("VendorNumber__")
        });
        // Customize filter and add RuidEx field retrieval
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Controls[fieldName].GetCustomFilter(false), Sys.Helpers.LdapUtil.FilterNotEqual("Ruidex", Data.GetValue("Ruidex")), Sys.Helpers.LdapUtil.FilterEqual("Deleted", "0"), Sys.Helpers.LdapUtil.FilterLesserOrEqual("State", "100"), Sys.Helpers.LdapUtil.FilterNotIn("InvoiceStatus__", [Lib.AP.InvoiceStatus.Rejected, Lib.AP.InvoiceStatus.Reversed]));
        Controls[fieldName].SetAttributes("RuidEx|OwnerID");
        Controls[fieldName].SetFilter(filter.toString());
    }
}
function initInternalConversationPane() {
    // internal conversation options
    let options = {
        noConfirmationDialog: true,
        updateLastAuthorAndDate: true,
        recordInternalConversationInfo: function (LastInternalConversationAuthor, LastInternalConversationDate) {
            // LastInternalConversationAuthor and LastInternalConversationDate are to store in the form when updating the internal conversation
            Data.SetValue("LastInternalConversationAuthor__", LastInternalConversationAuthor);
            Data.SetValue("LastInternalConversationDate__", LastInternalConversationDate);
        }
    };
    options = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Common.OnInitInternalConversationPane", options) || options;
    Controls.InternalConversation__.AddOrModifyOptions(options);
}
function needToWaitConfigQuery() {
    if (g_apParameters.IsReady() && g_p2pParameters.IsReady() && g_pacParameters.IsReady() && Variable.GetValueAsString("tableParameters") && Lib.ERP.GetERPName("AP")) {
        return false;
    }
    return true;
}
function synchronizeConfigQuery(instances) {
    const instance = instances.shift();
    // no more instance to synchronize
    if (!instance) {
        runAsync();
    }
    else if (instance.IsReady()) {
        synchronizeConfigQuery(instances);
    }
    else {
        instance.IsReady(() => synchronizeConfigQuery(instances));
    }
}
function silenceSomeAudits() {
    // tables only for dynamic display, no actions on them
    Controls.Holds__.DisableLinesAudit(true);
    Controls.BankDetails__.DisableLinesAudit(true);
    // tables with a default empty line that should not be audited since no action occured on them
    Controls.ExtendedWithholdingTax__.DisableLinesAudit(true);
    Controls.ApproversList__.DisableLinesAudit(true);
}
function hideDeprecatedFields() {
    var _a;
    //--- DO NOT REMOVE ---
    // FT-028301 - Hide fields that no longer exists and wasn't defined as hidden by default in layout
    // eslint-disable-next-line dot-notation
    (_a = Controls["TopMessageWarning__"]) === null || _a === void 0 ? void 0 : _a.Hide(true);
}
function initializePreviewMapping() {
    const fieldsMapping = Variable.GetValueAsString("VIPFieldsMap");
    if (fieldsMapping) {
        try {
            const vipFieldsMap = JSON.parse(fieldsMapping);
            Controls.PreviewPanel.SetHighlightMapForHTMLPreview(vipFieldsMap);
        }
        catch (_a) {
            Log.Verbose(`Invalid JSON in VIPFieldsMap (${fieldsMapping}) : cannot setup highlight on HTML preview`);
        }
    }
}
function setFormReadonlyIfNeeded() {
    if (IsInvoiceLineItemException()) {
        LayoutHelper.MakeFormReadOnly();
    }
}
function IsInvoiceLineItemException() {
    const currentContributor = Lib.AP.WorkflowCtrl.workflowUI.GetCurrentContributor();
    return currentContributor &&
        (currentContributor.workflowType === Lib.AP.WorkflowCtrl.WorkflowType.invoiceLineItemExceptionForApprovers
            || currentContributor.workflowType === Lib.AP.WorkflowCtrl.WorkflowType.invoiceLineItemExceptionForReviewers);
}
function runAsync() {
    var _a;
    let promiseSeq = (_a = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnHTMLScriptBegin")) !== null && _a !== void 0 ? _a : Sys.Helpers.Promise.Resolve();
    if (!Sys.Helpers.IsPromise(promiseSeq)) {
        promiseSeq = Sys.Helpers.Promise.Resolve(promiseSeq);
    }
    return promiseSeq.Then(() => {
        return run();
    });
}
function run() {
    Sys.Helpers.EnableSmartSilentChange();
    ProcessInstance.SetSilentChange(true);
    Log.Info("Start HTML page script execution...");
    const customProcessCall = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.ShouldCheckForOpenTab");
    if (customProcessCall !== false) {
        const dialogWarning = {
            Title: Language.Translate("_TabIsAlreadyOpenedPopupTitle"),
            Description: Language.Translate("_TabIsAlreadyOpenedPopupDesc"),
            BtnReadOnlyDesc: Language.Translate("_TabIsAlreadyOpenedReloadReadonly"),
            BtnContinueDesc: Language.Translate("_TabIsAlreadyOpenedContinueEdit")
        };
        Sys.Helpers.Browser.CheckMultipleOpening(dialogWarning);
    }
    ParameterDetails.init();
    hideDeprecatedFields();
    silenceSomeAudits();
    if (!Data.GetValue("Configuration__")) {
        Data.SetValue("Configuration__", Variable.GetValueAsString("Configuration"));
    }
    // Init workfowUI
    Lib.AP.WorkflowCtrl.Init(Controls, User, ProcessInstance, LayoutHelper, Lib.AP.GetInvoiceDocument());
    // Init ERP name
    Lib.ERP.InitERPName(null, false, "AP");
    // Init FormCleaner
    Lib.AP.FormCleaner.Init(updateExchangeRate, InitFlux10_1Fields);
    initializeEventHandlers();
    Lib.AP.WorkflowCtrl.UpdateParallelWorkflowCurrentUser();
    initializeForm();
    if (Controls.InternalConversation__) {
        initInternalConversationPane();
    }
    initializePreviewMapping();
    computeOutstandingExcludingReserves();
    setFormReadonlyIfNeeded();
    Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.OnHTMLScriptEnd");
    Controls.ERP__.Wait(false);
    CheckIfBillingScheduleCreatedFromInvoiceAndSelectIt();
    const customTopMessages = Sys.Helpers.TryCallFunction("Lib.AP.Customization.HTMLScripts.AddCustomTopMessagesWarning");
    if (Sys.Helpers.IsArray(customTopMessages)) {
        for (const topMessage of customTopMessages) {
            g_topMessageWarning.Add(topMessage);
        }
    }
    Log.Info("HTML page script execution complete");
    ProcessInstance.SetSilentChange(false);
}
if (needToWaitConfigQuery()) {
    // The user most likely clicked on "Enter an invoice"
    // We need to wait for the AP configuration query response (the ERP (at least) is required before initializing the form)
    Log.Info("Loading configuration...");
    hideFields();
    synchronizeConfigQuery([g_apParameters, g_p2pParameters, g_pacParameters]);
}
else {
    // Everything required to initialize the form is already set.
    // Do not wait configuration query response.
    runAsync();
}
//# sourceMappingURL=customscript.js.map