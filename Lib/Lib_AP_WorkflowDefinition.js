"use strict";
/* LIB_DEFINITION{
  "name": "Lib_AP_WorkflowDefinition",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Workflow Definition for AP Application",
  "require": [
    "Sys/Sys_P2P_WorkflowDefinition",
    "Sys/Sys_AP_WorkflowDefinition",
    "Lib_V12.0.566.0"
  ]
}*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Lib;
(function (Lib) {
    let AP;
    (function (AP) {
        let WorkflowDefinition;
        (function (WorkflowDefinition) {
            const definition = {
                "fields": {
                    // FT-022747 - Support for parallel workflow for invoice approval
                    // Extend WorkflowType__ to allow parallel workflow for paymentApproval, invoiceReview, invoiceLineItemExceptionForReviewers, invoiceLineItemExceptionForApprovers
                    "WorkflowType__": {
                        "values": {
                            "paymentApproval": {
                                "allowParallel": true
                            },
                            "invoiceReview": {
                                "allowParallel": true
                            },
                            "invoiceLineItemExceptionForReviewers": {
                                "defaultParallel": true
                            },
                            "invoiceLineItemExceptionForApprovers": {
                                "defaultParallel": true
                            }
                        }
                    },
                    "InvoiceType__": {
                        "type": "string",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"intakeRequestApproval\""] }],
                        "values": {
                            "Non-PO Invoice": {
                                "niceName": {
                                    "languageKey": "Non-PO Invoice"
                                }
                            },
                            "PO Invoice": {
                                "niceName": {
                                    "languageKey": "PO Invoice"
                                }
                            },
                            "PO Invoice (as FI)": {
                                "niceName": {
                                    "languageKey": "PO Invoice (as FI)"
                                }
                            },
                            "Downpayment Invoice": {
                                "niceName": {
                                    "languageKey": "Downpayment Invoice"
                                }
                            }
                        }
                    },
                    "EDIInvoiceType__": {
                        "type": "string",
                        "filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"invoiceReview\"", "\"paymentApproval\"", "\"invoiceException\"", "\"invoiceExceptionForApprovers\"", "\"invoiceLineItemExceptionForApprovers\"", "\"invoiceLineItemExceptionForReviewers\""] }],
                        "browsableValues": {
                            "dialogTitle": "_Select EDI Invoice Type",
                            "tableTitle": "_EDI Invoice Type",
                            "headerText": null,
                            "table": "EDIInvoiceTypes",
                            "maxRowCount": 20,
                            "columns": {
                                "ID": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_EDIInvoiceTypeCode"
                                    },
                                    "width": 100,
                                    "storedValue": true
                                },
                                "Name": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_Description"
                                    },
                                    "width": 300
                                }
                            },
                            "searchCriterias": {
                                "ID": {
                                    "niceName": {
                                        "languageKey": "_EDIInvoiceTypeCode"
                                    },
                                    "required": false,
                                    "toUpper": true,
                                    "visible": true,
                                    "filterId": "ID",
                                    "defaultValue": "",
                                    "autoAddAsterisk": true
                                },
                                "Name": {
                                    "niceName": {
                                        "languageKey": "_Description"
                                    },
                                    "required": false,
                                    "toUpper": true,
                                    "visible": true,
                                    "filterId": "Name",
                                    "defaultValue": "",
                                    "autoAddAsterisk": true
                                }
                            }
                        }
                    },
                    "ElectronicRoutingAddress__": {
                        "type": "string",
                        "filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"invoiceReview\"", "\"paymentApproval\""] }],
                        "niceName": {
                            "languageKey": "ElectronicRoutingAddress__"
                        }
                    },
                    "PricePercentageVariance__": {
                        "type": "decimal",
                        "filter": [{ "field": "GroupByDimension__", "operator": "===", "value": ["null", "\"\""] }, { "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"intakeRequestApproval\""] }],
                        "hiddenInTester": true,
                        "computedValue": function (settings) {
                            const invoiceLineAmount = settings.GetField("Amount__").value;
                            const expectedLineAmount = settings.GetField("ExpectedAmount__").value;
                            if (expectedLineAmount) {
                                return ((invoiceLineAmount / expectedLineAmount * 100) - 100);
                            }
                            return 0;
                        },
                        "niceName": {
                            "languageKey": "PricePercentageVariance__"
                        }
                    },
                    "UnitPricePercentageVariance__": {
                        "type": "decimal",
                        "filter": [{ "field": "GroupByDimension__", "operator": "===", "value": ["null", "\"\""] }, { "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"intakeRequestApproval\""] }],
                        "hiddenInTester": true,
                        "computedValue": function (settings) {
                            const invoicedUnitPrice = settings.GetField("InvoicedUnitPrice__").value;
                            const expectedUnitPrice = settings.GetField("UnitPrice__").value;
                            if (expectedUnitPrice) {
                                return ((invoicedUnitPrice / expectedUnitPrice * 100) - 100);
                            }
                            return 0;
                        },
                        "niceName": {
                            "languageKey": "UnitPricePercentageVariance__"
                        }
                    },
                    "ManualLink__": {
                        "type": "boolean",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"invoiceLineItemExceptionForApprovers\"", "\"invoiceLineItemExceptionForReviewers\"", "\"intakeRequestApproval\""] }]
                    },
                    "SubsequentDocument__": {
                        "type": "boolean",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"invoiceLineItemExceptionForApprovers\"", "\"invoiceLineItemExceptionForReviewers\"", "\"intakeRequestApproval\""] }],
                        "allowManualEdit": true,
                        "hiddenInEditor": false,
                        "mandatory": false,
                        "niceName": {
                            "languageKey": "SubsequentDocument__"
                        }
                    },
                    "UnplannedDeliveryCosts__": {
                        "type": "decimal",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"invoiceLineItemExceptionForApprovers\"", "\"invoiceLineItemExceptionForReviewers\"", "\"intakeRequestApproval\""] }],
                        "allowManualEdit": true,
                        "hiddenInTester": false,
                        "mandatory": false,
                        "computedValue": function ( /*settings*/) {
                            const exchangeRate = Data.GetValue("ExchangeRate__") || 1;
                            const freight = Data.GetValue("UnplannedDeliveryCosts__") || 0;
                            return freight * exchangeRate;
                        },
                        "niceName": {
                            "languageKey": "UnplannedDeliveryCosts__"
                        }
                    },
                    "UDCOverTolerance__": {
                        "type": "boolean",
                        "filter": [{ "field": "GroupByDimension__", "operator": "===", "value": ["null", "\"\""] }, { "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"invoiceLineItemExceptionForApprovers\"", "\"invoiceLineItemExceptionForReviewers\"", "\"intakeRequestApproval\""] }],
                        "hiddenInTester": true,
                        "computedValue": function (settings) {
                            const technicalDetailsJson = settings.GetField("TechnicalDetails__").value;
                            let result = false;
                            try {
                                const json = JSON.parse(technicalDetailsJson);
                                // eslint-disable-next-line dot-notation
                                if (json && json["ExtractedUDCOverTolerance"] && json["ExtractedUDCOverTolerance"]["IsInTolerance"] === false) {
                                    result = true;
                                }
                            }
                            catch (e) {
                                Log.Error("UDCOverTolerance: TechnicalDetails value could not be parsed to json: " + e);
                            }
                            return result;
                        },
                        "niceName": {
                            "languageKey": "UDCOverTolerance__"
                        }
                    },
                    "IntercompanyInvoice__": {
                        "type": "boolean",
                        "filter": [{ "field": "WorkflowType__", "operator": "!==", "value": ["\"creditManagementReviewers\"", "\"creditManagementReviewReviewers\"", "\"creditManagementRequestReviewers\"", "\"creditManagementApprovers\"", "\"creditManagementRequestApprovers\"", "\"creditManagementReviewApprovers\"", "\"OFACVerification\"", "\"vendorRegistration\"", "\"catalogImportApproval\"", "\"expenseReportApproval\"", "\"expenseReportControl\"", "\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\"", "\"purchaseOrderApproval\"", "\"ContractApproval\"", "\"deductions_approvers\"", "\"deductions_accountants\"", "\"ASNReview\"", "\"paymentRun\"", "\"orderConfirmationApproval\"", "\"orderConfirmationReview\"", "\"invoiceLineItemExceptionForApprovers\"", "\"invoiceLineItemExceptionForReviewers\"", "\"intakeRequestApproval\""] }],
                        "hiddenInTester": false,
                        "niceName": {
                            "languageKey": "IntercompanyInvoice__"
                        }
                    }
                }
            };
            function AddJSONTo(definitions) {
                definitions.push(Sys.P2P.WorkflowDefinition.GetJSON(4));
                definitions.push(Sys.AP.WorkflowDefinition.GetJSON(1));
                definitions.push(definition);
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = AP.WorkflowDefinition || (AP.WorkflowDefinition = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_AP_WorkflowDefinition.js.map