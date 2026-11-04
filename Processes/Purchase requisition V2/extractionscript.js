"use strict";
/* Purchase requisition extraction script */
var extractionscript;
(function (extractionscript) {
    let currentName = Data.GetActionName(), currentAction = Data.GetActionType(), companyCode = Data.GetValue("CompanyCode__");
    let companyCodeError = false;
    let importedFromExternalFile = false;
    Log.Info("-- PR Extraction Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "'");
    Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnExtractionScriptBegin");
    // When the document is submitted from the mobile app, the wkfdata is already computed. We need to keep it.
    // We reset the flag 'SubmittedFromMobileApp' after submission to avoid any issue when cloning document.
    if (!Sys.Helpers.Data.IsTrue(Variable.GetValueAsString("SubmittedFromMobileApp")) && !(currentAction === "reprocess")) {
        Log.Info("Clear WorkflowData");
        Variable.SetValueAsString("wkfdata", "");
        Variable.SetValueAsString("wkfdata_history", "");
    }
    if (currentAction === "reprocess") {
        if (Sys.Parameters.GetInstance("PAC").GetParameterBool("EnableChatGPT", false)) {
            // Recognition Engine will be called client side, because all the existing set functions on the PR are client side only.
            const doc = Sys.RecognitionEngine.GPT.LoadAndFormatDocument();
            //Sys.GDR.HighlightOrderedPages(doc.clusteredPages);
            Variable.SetValueAsString("ChatGPTAnswer", doc.formattedText);
            Log.Info("[RecognitionEngine] Launch requested, client side processing, call Sys.RecognitionEngine.Debugger to access complete logs.");
        }
    }
    function SetFatalError(status) {
        Variable.SetValueAsString("Extraction_status__", status);
        throw { fatalError: true };
    }
    async function ImportPurchaseRequisitionFromJson() {
        try {
            const importResult = await Lib.Purchasing.PR.ExternalFile.Server.ImportPurchaseRequisitionFromJson(companyCode);
            companyCode = importResult.companyCode;
            companyCodeError = importResult.companyCodeError;
            importedFromExternalFile = importResult.importedFromExternalFile;
        }
        catch (error) {
            if (error && "fatalError" in error) {
                SetFatalError(error.message);
            }
            throw error;
        }
    }
    function OnInboundEmail() {
        const sourceRuid = (Data.GetValue("SourceRuid") || "").toUpperCase();
        const isEmailSource = sourceRuid.startsWith("ISM.");
        // Process created from an inbound email ?
        if (isEmailSource) {
            Lib.Purchasing.SetPROriginIfDefault(Lib.P2P.PurchaseRequisitionOrigin.EMAIL);
            let fromAdress = Data.GetValue("FromAddress");
            Log.Info("OnInboundEmail: try to forward this process to the quote by email sender: " + fromAdress);
            let user = Users.GetUser(fromAdress), forwarded = user && Process.Forward(fromAdress); //Check if user exists and is accessible
            if (!forwarded) {
                Log.Error("OnInboundEmail: Process forwarding to " + fromAdress + " failed");
                let defaultRequester = Sys.Parameters.GetInstance("PAC").GetParameter("DefaultQuoteByEmailRequester");
                if (defaultRequester) {
                    user = Lib.P2P.GetOwner();
                    defaultRequester = Lib.P2P.ResolveDemoLogin(defaultRequester);
                    Log.Info("OnInboundEmail: try to forward this process to the default quote by email requester: " + defaultRequester);
                    forwarded = Process.Forward(defaultRequester);
                    if (!forwarded) {
                        Log.Error("OnInboundEmail: Process forwarding to " + defaultRequester + " failed");
                    }
                    else {
                        user = Users.GetUser(defaultRequester);
                    }
                }
                else {
                    Log.Info("OnInboundEmail: No default quote by email requester defined");
                }
            }
            if (forwarded) {
                Log.Info("OnInboundEmail: Process forwarding succeeded");
                Log.Info("OnInboundEmail: Schedule a notification by email");
                Variable.SetValueAsString("NotifyQuoteByEmailRequester__", "1");
                let vars = user.GetVars(), fullName = vars.GetValue_String("DisplayName", 0);
                Data.SetValue("RequisitionInitiator__", vars.GetValue_String("Login", 0));
                Data.SetValue("RequesterName__", fullName);
                Sys.TechnicalData.SetValue("requesterMSN", vars.GetValue_String("Msn", 0));
                let originatingUserLogin = vars.GetValue_String("Login", 0);
                Log.Info("Grant read right to originating user: " + originatingUserLogin);
                Process.SetRight(originatingUserLogin, "read");
            }
            else {
                SetFatalError(Language.Translate("_Unable to forward this purchase requisition following receipt of the quotation"));
            }
        }
        else {
            Log.Info("OnInboundEmail: no treatment to do");
        }
    }
    /** Sets the user the requisition is created for. */
    function SetRequester() {
        const user = Lib.P2P.GetOwner();
        Data.SetValue("RequisitionInitiator__", user.GetValue("Login"));
        Data.SetValue("RequesterName__", user.GetValue("DisplayName"));
        Sys.TechnicalData.SetValue("requesterMSN", user.GetValue("Msn"));
    }
    /** Writes one value of the payload on the requisition, an empty value leaving the field as it is. */
    function SetIfFilled(fieldName, value) {
        const requisition = Data;
        if (value) {
            requisition.SetValue(fieldName, value);
        }
    }
    /** Writes the origin of the payload, which only replaces the origin of the requisition when it is still the default one. */
    function SetOrigin(origin) {
        if (!Sys.Helpers.IsEmpty(origin)) {
            Lib.Purchasing.SetPROriginIfDefault(origin);
        }
    }
    /** Completes the requisition once its lines are in place: delivery address, amounts and budget. */
    async function FinalizeRequisition() {
        if (importedFromExternalFile
            && (!Sys.Helpers.IsEmpty(Data.GetValue("WarehouseID__")) || !Sys.Helpers.IsEmpty(Data.GetValue("DeliveryAddressID__")))) {
            const isWarehouse = !Sys.Helpers.IsEmpty(Data.GetValue("WarehouseID__"));
            const deliveryID = isWarehouse ? Data.GetValue("WarehouseID__") : Data.GetValue("DeliveryAddressID__");
            await Lib.Purchasing.PR.ExternalFile.Server.FillDeliveryAddress(deliveryID, Data.GetValue("CompanyCode__"), isWarehouse);
        }
        else if (Lib.Purchasing.ShipTo.IsEmpty()) {
            await Lib.Purchasing.ShipTo.FillFromDefaultShipTo(true);
        }
        if (importedFromExternalFile) {
            await Lib.Purchasing.PR.ExternalFile.Server.FillRelatedFields();
        }
        await InitializeExchangeRatesAndAmounts();
        await Lib.Purchasing.prBudgetSpending.ResetBudgetFields();
    }
    /** Creates the requisition from a payload built by the intake or by the agent, containing only the standard fields handled by this creation flow. */
    async function CreateRequisitionFromPayload(payload) {
        SetRequester();
        SetRequisitionNumber();
        SetIfFilled("Reason__", payload.Reason__);
        SetIfFilled("Comments__", payload.Comments__);
        SetOrigin(payload.Origin__);
        await AddPurchaseRequisitionDataItemsToPR(payload.lineItems__, false);
        await FinalizeRequisition();
    }
    /**
     * Creates the requisition from a JSON file received through SFTP. In addition to the standard fields handled by
     * this creation flow, the file may carry additional fields and tables on the header or on a line.
     * A requisition that could not be fully imported is left as a draft for its owner to review, and never submitted.
     */
    async function CreateRequisitionFromExternalFile(payload) {
        SetRequester();
        SetRequisitionNumber();
        SetOrigin(payload.Origin__);
        const fieldsThatCouldNotBeImported = Lib.Purchasing.PR.ExternalFile.Server.ImportHeaderFields(payload);
        const lineItemsImportResult = await AddPurchaseRequisitionDataItemsToPR(payload.lineItems__, true);
        fieldsThatCouldNotBeImported.push(...lineItemsImportResult.fieldsThatCouldNotBeImported);
        await FinalizeRequisition();
        const fieldImportError = Lib.Purchasing.PR.ExternalFile.Server.ReportNotImportedFields(fieldsThatCouldNotBeImported);
        if (!lineItemsImportResult.catalogItemNotFound && !fieldImportError) {
            await Lib.Purchasing.PR.ExternalFile.Server.SetupAutoCreatePO(payload);
            Lib.Purchasing.PR.ExternalFile.Server.SetupAutoSubmitPR();
        }
    }
    async function ProcessPurchaseRequisitionData() {
        const purchaseRequisitionData = Variable.GetValueAsString("PurchaseRequisitionData");
        if (!purchaseRequisitionData) {
            return false;
        }
        Log.Info("ProcessPurchaseRequisitionData: Purchase requisition data found, processing...");
        const payload = JSON.parse(purchaseRequisitionData);
        if (importedFromExternalFile) {
            await CreateRequisitionFromExternalFile(payload);
        }
        else {
            await CreateRequisitionFromPayload(payload);
        }
        return true;
    }
    async function GetRequesterCostCenter(requesterLogin, costCenterId, costCenterName) {
        if (Sys.Helpers.IsEmpty(costCenterId) || Sys.Helpers.IsEmpty(costCenterName)) {
            const userProperties = await Lib.P2P.UserProperties.QueryValues(requesterLogin);
            return {
                costCenterId: (userProperties === null || userProperties === void 0 ? void 0 : userProperties.CostCenter__) || "",
                costCenterName: (userProperties === null || userProperties === void 0 ? void 0 : userProperties.CostCenter__Description__) || ""
            };
        }
        return {
            costCenterId,
            costCenterName
        };
    }
    async function AddCatalogItemFromRequestData(table, itemData, costCenterId, costCenterName) {
        const catalogItems = await Lib.Purchasing.CatalogHelper.GetRawItems([{
                itemNumber: itemData.ItemNumber__,
                supplierID: itemData.VendorNumber__,
                companyCode: companyCode,
            }]);
        if (!(catalogItems === null || catalogItems === void 0 ? void 0 : catalogItems.length)) {
            return false;
        }
        const catalogItem = catalogItems[0];
        const newItem = table.AddItem();
        const itemIndex = table.GetItemCount() - 1;
        await Lib.Purchasing.Items.PR.AddCatalogItem(catalogItem, newItem, itemIndex);
        // Override quantity and delivery date with values from the IR (user input)
        const itemQty = itemData.ItemQuantity__;
        if (!Sys.Helpers.IsEmpty(itemQty)) {
            newItem.SetValue("ItemQuantity__", itemQty);
            Lib.Purchasing.Amount.FillAmount(newItem);
        }
        const itemDeliveryDate = itemData.RequestedDeliveryDate__;
        if (!Sys.Helpers.IsEmpty(itemDeliveryDate)) {
            newItem.SetValue("ItemRequestedDeliveryDate__", itemDeliveryDate);
        }
        newItem.SetValue("ItemCostCenterId__", costCenterId);
        newItem.SetValue("ItemCostCenterName__", costCenterName);
        return true;
    }
    async function AddPurchaseRequisitionDataItemsToPR(items, importPayloadFields) {
        if (!(items === null || items === void 0 ? void 0 : items.length)) {
            return { fieldsThatCouldNotBeImported: [], catalogItemNotFound: false };
        }
        Log.Info("AddPurchaseRequisitionDataItemsToPR: Adding purchase requisition data items to purchase requisition");
        await Lib.P2P.LoadCompanyCodeConfiguration({ companyCode });
        const table = Data.GetTable("LineItems__");
        const fieldsThatCouldNotBeImported = [];
        let catalogItemNotFound = false;
        // Resolve cost center from requester's user properties if provided cost center data is not valid
        const requesterLogin = Data.GetValue("RequisitionInitiator__");
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            const itemData = items[itemIndex];
            const { costCenterId, costCenterName } = importPayloadFields && !Sys.Helpers.IsEmpty(itemData.CostCenterId__)
                ? {
                    costCenterId: itemData.CostCenterId__,
                    costCenterName: itemData.CostCenterName__ || ""
                }
                : await GetRequesterCostCenter(requesterLogin, itemData.CostCenterId__, itemData.CostCenterName__);
            const isFreeItem = itemData.IsNonCatalogItem__;
            const firstCreatedItemIndex = table.GetItemCount();
            const itemPath = `lineItems__[${itemIndex}]`;
            Log.Verbose(`Processing line item: ${isFreeItem ? itemData.ItemDescription__ : itemData.ItemNumber__}, FreeItem: ${isFreeItem}`);
            if (isFreeItem) {
                await Lib.Purchasing.Items.PR.AddFreeItemsToPR([itemData], table, costCenterId, costCenterName);
            }
            else {
                const catalogItemAdded = await AddCatalogItemFromRequestData(table, itemData, costCenterId, costCenterName);
                if (!catalogItemAdded) {
                    Log.Error(`AddPurchaseRequisitionDataItemsToPR: No catalog item found for item number '${itemData.ItemNumber__}', vendor number '${itemData.VendorNumber__}' and company code '${companyCode}'.${importPayloadFields ? ` Creating ${itemPath} as a non-catalog item.` : ""}`);
                    if (importPayloadFields) {
                        catalogItemNotFound = true;
                        await Lib.Purchasing.Items.PR.AddFreeItemsToPR([itemData], table, costCenterId, costCenterName);
                    }
                }
            }
            if (importPayloadFields) {
                for (let createdItemIndex = firstCreatedItemIndex; createdItemIndex < table.GetItemCount(); createdItemIndex++) {
                    if (!Sys.Helpers.IsEmpty(itemData.CostCenterId__)) {
                        const createdItem = table.GetItem(createdItemIndex);
                        createdItem.SetValue("ItemCostCenterId__", itemData.CostCenterId__);
                    }
                    fieldsThatCouldNotBeImported.push(...Lib.Purchasing.PR.ExternalFile.Server.ImportLineItemFields(itemData, table.GetItem(createdItemIndex), itemPath));
                }
            }
        }
        Lib.Purchasing.Items.PR.AssignLineItemNumbers();
        if (catalogItemNotFound) {
            Lib.Purchasing.PR.ExternalFile.Server.AddImportedPRIssue("CatalogItemNotFound");
            Sys.TechnicalData.SetValue("AutoSubmitted", false);
        }
        return {
            fieldsThatCouldNotBeImported,
            catalogItemNotFound
        };
    }
    function SetRequisitionNumber() {
        if (Sys.Helpers.IsEmpty(Data.GetValue("RequisitionNumber__"))) {
            const ReqNumber = Lib.P2P.NextNumber("PR", "RequisitionNumber__");
            Log.Info("SetRequisitionNumber: New requisition number generated: " + ReqNumber);
            Data.SetValue("RequisitionNumber__", ReqNumber);
        }
    }
    async function InitializeExchangeRatesAndAmounts() {
        const companyCodeValues = Lib.P2P.CompanyCodesValue.GetValues(Data.GetValue("CompanyCode__"));
        if (Object.keys(companyCodeValues || {}).length <= 0) {
            Data.SetError("CompanyCode__", "_This CompanyCode does not exist in the table.");
            return;
        }
        // Warm the exchange-rate cache for this company code before reading rates.
        await companyCodeValues.currencies.QueryRate();
        const items = [];
        Sys.Helpers.Data.ForEachTableItem("LineItems__", function (line) {
            Lib.Purchasing.Items.PR.FillExchangeRateField(line);
            items.push(line);
        });
        const amounts = Lib.Purchasing.Items.ComputePRAmounts(items);
        const exchangeRate = companyCodeValues.currencies.GetRate(amounts.Currency);
        Data.SetValue("Currency__", amounts.Currency);
        Data.SetValue("ExchangeRate__", exchangeRate);
        Data.SetValue("TotalNetLocalCurrency__", amounts.netAmountLocal);
        Data.SetValue("TotalNetAmount__", amounts.TotalNetAmount);
    }
    /** ****************** **/
    /** Vendor recognition **/
    /** ****************** **/
    function GetDocumentCulture() {
        let documentCulture = Variable.GetValueAsString("DocumentCulture");
        if (!documentCulture) {
            documentCulture = Sys.Parameters.GetInstance("PAC").GetParameter("AvailableDocumentCultures");
            if (!documentCulture) {
                documentCulture = ["en-US", "en-GB", "fr-FR"];
            }
        }
        if (typeof documentCulture === "string") {
            documentCulture = documentCulture.split(",");
        }
        return documentCulture;
    }
    let Vendor = {
        Fill: function (result, lookupValue, desc) {
            if (result) {
                Variable.SetValueAsString("lastExtractedVendorName", result.Name__);
                Variable.SetValueAsString("lastExtractedVendorNumber", result.Number__);
                Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnVendorRecognition", result);
            }
        },
        Highlight: function (area) {
            if (area) {
                /*
                 * Can't highlight from field in table / wait for workaround
                let highlightColor_border = 0xFFFFFF,
                    highlightColor_background = 0xFFCC00;
                area.zone.Highlight(true, highlightColor_background, highlightColor_border, "VendorName__");
                area.zone.Highlight(true, highlightColor_background, highlightColor_border, "VendorAddress__");
                */
            }
            else {
                let areaList = Document.GetHighlightedAreaList();
                for (let i = areaList.length - 1; i >= 0; i--) {
                    areaList[i].zone.Highlight(false);
                }
            }
        },
        DuplicateToCombinedVendor: function () {
            if (Sys.Helpers.Data.IsTrue(Variable.GetValueAsString("SubmittedFromMobileApp") && currentAction === "")) {
                //CombinedVendor__ is the displayed field, we need to align it on VendorName__
                Sys.Helpers.Data.ForEachTableItem("LineItems__", function (item) {
                    item.SetValue("CombinedVendor__", item.GetValue("VendorName__"));
                });
            }
        }
    };
    /** ******** **/
    /** RUN PART **/
    /** ******** **/
    async function Start() {
        Lib.Purchasing.InitTechnicalFields();
        Lib.P2P.InitSAPConfiguration("PAC");
        let importFatalError = null;
        if (currentAction !== "reprocess") {
            try {
                await ImportPurchaseRequisitionFromJson();
                if (companyCodeError) {
                    return;
                }
            }
            catch (error) {
                if (!("fatalError" in error)) {
                    throw error;
                }
                importFatalError = error;
            }
        }
        Vendor.Highlight();
        const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(Lib.P2P.GetOwner().GetValue("Login"));
        companyCode = companyCode || UserPropertiesValues.CompanyCode__;
        Data.SetValue("CompanyCode__", companyCode);
        Log.Info("Company code=" + companyCode);
        let vendorsExtraFilters = Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Common.GetVendorsExtraFilter");
        let LDAPvendorExtraFilter = null;
        if (vendorsExtraFilters && vendorsExtraFilters.length > 0) {
            LDAPvendorExtraFilter = Sys.Helpers.LdapUtil.FilterAnd(...vendorsExtraFilters).toString();
        }
        //CombinedVendor__ is the displayed field, we need to align it on VendorName__
        Vendor.DuplicateToCombinedVendor();
        Lib.P2P.FirstTimeRecognition_Vendor.Recognize(GetDocumentCulture(), companyCode, null, null, Vendor.Fill, Vendor.Highlight, null, null, null, LDAPvendorExtraFilter);
        try {
            if (importFatalError) {
                throw importFatalError;
            }
            if (currentAction !== "reprocess") {
                if (!await ProcessPurchaseRequisitionData()) {
                    OnInboundEmail();
                }
                Variable.SetValueAsString("Extraction_status__", "SUCCESS");
            }
        }
        catch (e) {
            if (!("fatalError" in e)) {
                throw e;
            }
        }
        Sys.Helpers.TryCallFunction("Lib.PR.Customization.Server.OnExtractionScriptEnd");
    }
    extractionscript.Start = Start;
    Lib.P2P.HandleScriptError(Start());
})(extractionscript || (extractionscript = {}));
//# sourceMappingURL=extractionscript.js.map