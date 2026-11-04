"use strict";
/* Order Confirmation HTML page script */
/* eslint-disable dot-notation,class-methods-use-this */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var CustomScript;
(function (CustomScript) {
    class Main {
        constructor() {
            this.panes = ["DocumentsPanel", "BannerPanel", "HeaderPanel", "ItemsPanel", "WorkflowPanel", "ConversationPanel", "OrderInfo"];
            this.buttons = ["Submit__", "Approve__", "Reject__", "Save__", "Quit__"];
            this.deprecatedControls = ["LineItems__.ItemOrderedQuantityUpdated__", "LineItems__.ItemDeliveryDateUpdated__", "LineItems__.ItemUnitPriceUpdated__", "LineItems__.ItemNumber__", "LineItems__.ItemDeliveryDate__", "OCType__", "ActionsPanel"];
            this.globalLayout = new Lib.P2P.Layout.Manager(this.panes, this.buttons, Object.values(Lib.P2P.Layout.Splitter), this.deprecatedControls);
        }
        async InitControls() {
            var _a;
            const banner = Sys.Helpers.Banner;
            banner.SetMainTitle("_S2P - Order Confirmation");
            banner.SetHTMLBanner(Controls.HTMLBanner__);
            banner.SetStatusCombo(Controls.Status__);
            banner.SetSubTitle();
            if (Lib.Purchasing.OC.Workflow.controller.GetTableIndex() === 0) {
                await Lib.Purchasing.OC.Workflow.Init();
            }
            Controls.WorkflowTable__.OnRefreshRow = Sys.Helpers.Wrap(Controls.WorkflowTable__.OnRefreshRow, (originalFn, ...args) => {
                originalFn === null || originalFn === void 0 ? void 0 : originalFn.apply(Controls.WorkflowTable__, args);
                Lib.Purchasing.OC.TmpData.UserIsCurrentContributorOrIsAdmin = Lib.Purchasing.OC.Workflow.UserIsCurrentContributorOrIsAdmin();
            });
            Lib.Purchasing.OC.TmpData.UserIsCurrentContributorOrIsAdmin = Lib.Purchasing.OC.Workflow.UserIsCurrentContributorOrIsAdmin();
            Lib.Purchasing.OC.Workflow.InitPanel();
            const companyCode = Data.GetValue("CompanyCode__");
            const filter = (_a = this.userProperties) === null || _a === void 0 ? void 0 : _a.GetAllowedCompanyCodesFilter(companyCode);
            Controls.CompanyCode__.SetFilter(filter);
            Controls.CompanyCode__.SetValue(companyCode);
            //@ts-ignore
            Lib.Purchasing.OC.TmpData.PreviousCompanyCode = companyCode;
            Controls.LineItems__.SetExtendableColumn("ItemDescription__");
            Controls.LineItems__.ItemOCType__.SetWidth(110);
            Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(Lib.Purchasing.OC.TmpData.UserIsCurrentContributorOrIsAdmin &&
                Lib.Purchasing.OC.TmpData.CurrentContributorIsOCRecipient &&
                !Lib.P2P.InboundChannel.IsCreatedFromInboundChannel() &&
                !Lib.Purchasing.OC.IsCreatedFromPortal());
            this.InitConversation();
        }
        InitConversation() {
            Controls.Conversation__.SetOptions(Lib.P2P.Conversation.Options.GetDefault(Lib.Purchasing.SenderType.IsCustomer));
        }
        async InitData() {
            this.userProperties = await Lib.Purchasing.OC.LoadUserProperties(User.loginId);
            if (!Lib.Purchasing.OC.GetOCRecipient()) {
                Lib.Purchasing.OC.SetOCRecipient({
                    login: User.loginId,
                    displayName: User.fullName,
                    emailAddress: User.emailAddress
                });
            }
            if (!ProcessInstance.state) {
                Data.SetValue("Status__", Lib.Purchasing.OC.OCStatus.Draft);
                Data.GetTable("LineItems__").SetItemCount(0);
            }
            Lib.Purchasing.OC.UpdateAllItemsRejectedTmpData();
        }
        InitEvents() {
            Controls.Reject__.OnClick = Lib.Purchasing.OC.OnClickReject;
            Controls.VendorNumber__.OnClick = Lib.Purchasing.OC.OnClickVendorNumber;
            Controls.PONumber__.OnChange = Lib.Purchasing.OC.OnChangePONumber;
            Controls.CompanyCode__.OnSelectItem = Lib.Purchasing.OC.OnChangeCompanyCode;
            Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.VendorName__, Lib.Purchasing.OC.OnSelectItemVendorName, Lib.Purchasing.OC.OnUnknownOrEmptyValueVendorName, Lib.Purchasing.OC.OnUnknownOrEmptyValueVendorName);
            Controls.LineItems__.ItemOCType__.OnChange = Lib.Purchasing.OC.OnChangeItemOCType;
            Controls.LineItems__.ItemRequestedDeliveryDate__.OnChange = function () {
                const item = this.GetItem();
                const row = this.GetRow();
                Lib.Purchasing.OC.POData.ValidateItemDeliveryDate(item, row.GetLineNumber(true) - 1);
                Lib.Purchasing.OC.Workflow.DelayRebuildWorkflow();
            };
            Controls.LineItems__.ItemQuantity__.OnChange = function () {
                const item = this.GetItem();
                Lib.Purchasing.OC.POData.ValidateItemQuantity(item);
                Lib.Purchasing.ModuleOC.FillTotalNetAmount();
                Lib.Purchasing.OC.Workflow.DelayRebuildWorkflow();
            };
            Controls.LineItems__.ItemUnitPrice__.OnChange = function () {
                const item = this.GetItem();
                Lib.Purchasing.OC.POData.ValidateItemUnitPrice(item);
                Lib.Purchasing.ModuleOC.FillTotalNetAmount();
                Lib.Purchasing.OC.Workflow.DelayRebuildWorkflow();
            };
            Controls.LineItems__.ItemNetAmount__.OnChange = function () {
                const item = this.GetItem();
                Lib.Purchasing.OC.POData.ValidateItemNetAmount(item);
                Lib.Purchasing.ModuleOC.FillTotalNetAmount();
                Lib.Purchasing.OC.Workflow.DelayRebuildWorkflow();
            };
            Controls.PORUIDEX__.OnClick = Lib.Purchasing.OC.OpenPurchaseOrder;
            if (!Lib.Purchasing.OC.TmpData.CanReviewForm || !Lib.Purchasing.OC.TmpData.CurrentContributorIsOCRecipient) {
                Controls.PONumber__.OnClick = Lib.Purchasing.OC.OpenPurchaseOrder;
            }
            Controls.Approve__.OnClick = function () {
                Lib.Purchasing.OC.CheckRequiredFields();
                return Process.ShowFirstError() === null;
            };
            Controls.DocumentsPanel.OnUploadDocument = function (done) {
                if (!ProcessInstance.IsModified() && !Attach.GetProcessedDocument() && Sys.Helpers.IsEmpty(Data.GetValue("PONumber__"))) {
                    done();
                }
                else {
                    Popup.Confirm("_Are you sure you want to upload this document?", false, () => {
                        done();
                    }, null, "_Upload document confirmation");
                }
                return false;
            };
            Controls.DemoGenerateOCPDF__.OnClick = () => {
                this.GenerateDemoOrderConfirmationPDF();
                return false;
            };
        }
        GenerateDemoOrderConfirmationPDF() {
            const language = "en";
            const outputFormat = "pdf";
            const data = this.GenerateDemoOrderConfirmationData();
            Process.OpenPreview({
                "conversionType": "crystal2020",
                "templateName": "S2POrderConfirmation.rpt",
                "language": language || Sys.Helpers.String.NormalizeFileSuffix(Sys.Helpers.String.RemoveIllegalCharactersFromFilename(Data.GetValue("CompanyCode__"))),
                outputFormat,
                "data": function (fnDataBuildDone) {
                    const json = JSON.stringify(data);
                    Log.Verbose(json);
                    fnDataBuildDone(json);
                }
            });
            return false;
        }
        GenerateDemoOrderConfirmationData() {
            const data = {
                "header": {
                    "MsnEx": Data.GetValue("MsnEx"),
                    "OrderConfirmationNumber": Data.GetValue("OCNumber__"),
                    "Status": "ToApprove",
                    "OrderNumber": Data.GetValue("PONumber__"),
                    "OrderConfirmationDate": Sys.Helpers.Date.Date2DBDate(Data.GetValue("OrderConfirmationDate__")),
                    "VendorAddress": `${Data.GetValue("VendorName__")}\n1500 N. Broadway\nWALNUT CREEK CA 94598`,
                    "ShipToAddress": Data.GetValue("ShipToAddress__") || "113 blvd Stalingrad\n94200 Ivry sur Seine\nFrance",
                    "Currency": Data.GetValue("Currency__"),
                    "TotalNetAmount": Data.GetValue("NewTotalNetAmount__"),
                    "Comment": Data.GetValue("Comment__"),
                    "DisplayUnitOfMeasure": false
                },
                "companyInfo": {
                    "DecimalCount": 2,
                    "FormatDate": "M/d/yyyy",
                    "SeparatorThousand": "%2C",
                    "SeparatorDecimal": ".",
                    "SeparatorInfos": "%20-%20"
                },
                "tables": {
                    "LineItems": []
                },
                "language": {
                    "Comment": "Comment",
                    "DetailsDeliveryDate": "Delivery date",
                    "DetailsDescription": "Description",
                    "DetailsOrderLineNumber": "Line",
                    "DetailsOrderNetAmount": "Net amount",
                    "DetailsOrderUnitPrice": "Unit price",
                    "DetailsQuantity": "Quantity",
                    "DetailsSection": "Details",
                    "DetailsSupplierPartID": "Supplier reference",
                    "DetailsUnit": "Unit",
                    "DocumentNumber": "Confirmation number",
                    "DocumentType": "Document type",
                    "DraftStamp": "DRAFT",
                    "GeneralSection": "General",
                    "OrderConfirmation": "Order confirmation",
                    "OrderConfirmationDate": "Confirmation date",
                    "OrderNumber": "Order number",
                    "Page": "Page",
                    "TotalNetAmount": "Net total"
                }
            };
            const lineItemsData = data.tables.LineItems;
            Sys.Helpers.Data.ForEachTableItem("LineItems__", (item, itemIndex) => {
                const itemOCType = item.GetValue("ItemOCType__");
                let quantity, netAmount, unitPrice, deliveryDate;
                if (itemOCType === "Update") {
                    quantity = item.IsNullOrEmpty("ItemQuantity__") ? item.GetValue("ItemOrderedQuantity__") : item.GetValue("ItemQuantity__");
                    netAmount = item.IsNullOrEmpty("ItemNetAmount__") ? item.GetValue("ItemOrderedNetAmount__") : item.GetValue("ItemNetAmount__");
                    deliveryDate = Sys.Helpers.Date.Date2DBDate(item.IsNullOrEmpty("ItemRequestedDeliveryDate__") ? item.GetValue("ItemOrderedDeliveryDate__") : item.GetValue("ItemRequestedDeliveryDate__"));
                    unitPrice = item.IsNullOrEmpty("ItemUnitPrice__") ? item.GetValue("ItemOrderedUnitPrice__") : item.GetValue("ItemUnitPrice__");
                }
                else if (itemOCType === "Reject") {
                    quantity = 0;
                    netAmount = 0;
                    deliveryDate = "##NULL_DATE##";
                    unitPrice = item.GetValue("ItemOrderedUnitPrice__");
                }
                else {
                    quantity = item.GetValue("ItemOrderedQuantity__");
                    netAmount = item.GetValue("ItemOrderedNetAmount__");
                    deliveryDate = Sys.Helpers.Date.Date2DBDate(item.GetValue("ItemOrderedDeliveryDate__"));
                    unitPrice = item.GetValue("ItemOrderedUnitPrice__");
                }
                lineItemsData.push({
                    "ItemType": item.GetValue("ItemType__"),
                    "ItemSupplierPartID": item.GetValue("SupplierPartID__"),
                    "LineItemNumber": item.GetValue("LineItemNumber__"),
                    "ItemDescription": item.GetValue("ItemDescription__"),
                    "ItemQuantity": quantity,
                    "ItemNetAmount": netAmount,
                    "ItemUnitPrice": unitPrice,
                    "ItemUnit": item.GetValue("ItemUnit__"),
                    "ItemDeliveryDate": deliveryDate,
                    "ItemNote": item.GetValue("ItemComment__")
                });
            });
            return data;
        }
        // Errors from validationscript are managed here
        InitUpdatePOErrors() {
            if (Data.GetValue("Status__") !== Lib.Purchasing.OC.OCStatus.Failed) {
                return;
            }
            const errorKey = Sys.TechnicalData.GetValue("ErrorKey");
            Controls.PONumber__.SetError(Sys.Helpers.IsEmpty(errorKey) ? "_Cannot update PO" : errorKey);
            if (Sys.TechnicalData.GetValue("ActionEditPOError")) {
                const data = Sys.TechnicalData.GetValue("ActionEditPOError");
                for (const [table, tableDataPO] of Object.entries(data.FieldsInError.tables)) {
                    const tableDataOC = Data.GetTable(table);
                    for (const rowIndex of Object.keys(tableDataPO.rows)) {
                        try {
                            const rowNumber = Number(rowIndex);
                            const item = tableDataOC.GetItem(rowNumber);
                            const rowErrors = tableDataPO.rows[rowIndex];
                            for (const [rowField, error] of Object.entries(rowErrors)) {
                                item.SetError(rowField, error);
                            }
                        }
                        catch (error) {
                            Log.Error(`Error while setting error on table "${table}" at index "${rowIndex} for error "${JSON.stringify(tableDataPO.rows[rowIndex])}" : ${error}`);
                        }
                    }
                }
            }
        }
        async Start() {
            Process.ShowFirstErrorAfterBoot(false);
            Sys.Helpers.EnableSmartSilentChange();
            ProcessInstance.SetSilentChange(true);
            this.globalLayout.HidePanes(true);
            this.globalLayout.HideDeprecatedControls();
            this.globalLayout.ShowWaitScreen();
            Controls.TopPaneWarning.Hide(); // prevent panel from flashing
            Process.SetHelpId("5153");
            await Sys.Parameters.GetInstance("PAC").PromisedIsReady();
            await Lib.Purchasing.OC.POData.InitConfirmedFieldsDefinition();
            await this.InitData();
            await Sys.Helpers.TryCallFunction("Lib.OC.Customization.Client.OnLoad");
            await this.InitControls();
            this.InitUpdatePOErrors();
            this.InitEvents();
            await Lib.Purchasing.OC.Init();
            await Lib.Purchasing.OC.OnConfigurationChange();
            Lib.Purchasing.OC.InitPOBrowse();
            await Lib.Purchasing.OC.FormTemplate.SetupFormTemplateManager();
            Lib.Purchasing.OC.Workflow.RefreshWorkflowButtons();
            Sys.Helpers.TryCallFunction("Lib.OC.Customization.Client.CustomizeLayout", Lib.Purchasing.OC.FormTemplate.formTemplateManager);
            Lib.Purchasing.OC.InitDisplayAsLink(); // must be called after SetupFormTemplateManager
            await Lib.Purchasing.OC.InitWarnings();
            this.globalLayout.HideWaitScreen();
            ProcessInstance.SetSilentChange(false);
            Lib.CommonDialog.NextAlert.Show();
            Process.ShowFirstError();
        }
    }
    CustomScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        main.Start();
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map