"use strict";
/* LIB_DEFINITION{
  "name": "Lib_VendorRegistration_WorkflowDefinition",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "VendorRegistration library",
  "versionable": false,
  "require": [
    "Sys/Sys_VendorRegistration_WorkflowDefinition",
    "Lib_V12.0.566.0"
  ]
}*/
// Common part
var Lib;
(function (Lib) {
    let VendorRegistration;
    (function (VendorRegistration) {
        let WorkflowDefinition;
        (function (WorkflowDefinition) {
            const definition = {
                "fields": {
                    "VendorCategory__": {
                        "filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"vendorRegistration\""] }],
                        "type": "string",
                        "browsableValues": {
                            "dialogTitle": "_Select a Vendor category",
                            "tableTitle": "VendorCategory__",
                            "headerText": null,
                            "table": "P2P - Vendor Category__",
                            "maxRowCount": 20,
                            "columns": {
                                "Code__": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_Code"
                                    },
                                    "storedValue": true
                                }
                            },
                            "searchCriterias": {
                                "Code__": {
                                    "niceName": {
                                        "languageKey": "_Code"
                                    },
                                    "required": false,
                                    "toUpper": true,
                                    "visible": true,
                                    "filterId": "Code__",
                                    "defaultValue": "",
                                    "autoAddAsterisk": true
                                }
                            }
                        }
                    },
                    "Country__": {
                        "version": 1,
                        "niceName": {
                            "languageKey": "_CountryCode"
                        },
                        "type": "string",
                        "filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"vendorRegistration\""] }],
                        "browsableValues": {
                            "dialogTitle": "_Select a Country",
                            "tableTitle": "_Countries",
                            "table": "Countries",
                            "columns": {
                                "Code": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_CountryCode"
                                    },
                                    "width": 100,
                                    "storedValue": true
                                },
                                "Name": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_Country"
                                    },
                                    "width": 300
                                }
                            }
                        }
                    },
                    "DefaultItemCategory__": {
                        "filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"vendorRegistration\""] }],
                        "type": "string",
                        "niceName": {
                            "languageKey": "_DefaultItemCategory"
                        },
                        "browsableValues": {
                            "dialogTitle": "_Select a default item category",
                            "tableTitle": null,
                            "headerText": null,
                            "table": "PurchasingSupply__",
                            "maxRowCount": 20,
                            "columns": {
                                "CompanyCode__": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_Company code"
                                    }
                                },
                                "FullName__": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_FullName"
                                    },
                                    "width": 200,
                                    "storedValue": true
                                },
                                "Description__": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_Description"
                                    },
                                    "width": 300
                                }
                            },
                            "searchCriterias": {
                                "CompanyCode__": {
                                    "niceName": {
                                        "languageKey": "_Company code"
                                    },
                                    "required": false,
                                    "toUpper": true,
                                    "visible": true,
                                    "filterId": "CompanyCode__",
                                    "defaultValue": "",
                                    "autoAddAsterisk": true
                                },
                                "Description__": {
                                    "type": "string",
                                    "niceName": {
                                        "languageKey": "_Description"
                                    },
                                    "required": false,
                                    "toUpper": true,
                                    "visible": true,
                                    "filterId": "Description__",
                                    "defaultValue": "",
                                    "autoAddAsterisk": true
                                }
                            }
                        }
                    }
                }
            };
            function AddJSONTo(definitions) {
                definitions.push(Sys.VendorRegistration.WorkflowDefinition.GetJSON(0));
                definitions.push(definition);
            }
            WorkflowDefinition.AddJSONTo = AddJSONTo;
        })(WorkflowDefinition = VendorRegistration.WorkflowDefinition || (VendorRegistration.WorkflowDefinition = {}));
    })(VendorRegistration = Lib.VendorRegistration || (Lib.VendorRegistration = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_VendorRegistration_WorkflowDefinition.js.map