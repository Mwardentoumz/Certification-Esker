"use strict";
function SetError(step, message) {
    if (step !== null) {
        Variable.SetValueAsString("currentStep", step);
    }
    Variable.SetValueAsString("ErrorMessage", message);
    Process.PreventApproval();
}
function CheckConfiguration() {
    const loadedConfiguration = Variable.GetValueAsString("ConfigurationLoaded");
    const currentConfiguration = Data.GetValue("ConfigurationName__");
    const GlobalStep = 0;
    Variable.SetValueAsString("ErrorMessage", "");
    if (!currentConfiguration) {
        SetError(GlobalStep, "_Expecting a configuration name");
        return false;
    }
    if (loadedConfiguration !== currentConfiguration) {
        //Check the configuration does not already exist
        Query.Reset();
        Query.SetSpecificTable("AP - Application Settings__");
        Query.SetFilter("ConfigurationName__=" + currentConfiguration);
        if (Query.MoveFirst() && Query.MoveNextRecord()) {
            SetError(GlobalStep, "_Existing configuration");
            return false;
        }
    }
    return !Lib.P2P.FormHasError();
}
function Save() {
    Log.Info("Saving configuration settings");
    const options = {
        specialFields: {
            LastModifiedDateTime__: {
                GetValue: function () {
                    return Sys.Helpers.Date.Date2DBDateTime(new Date());
                }
            },
            LastModifiedBy__: {
                GetValue: function () {
                    const currentUser = Users.GetUser(Data.GetValue("OwnerId"));
                    return currentUser.GetValue("Login");
                }
            },
            OrderNumberPatterns__: {
                GetValue: function () {
                    return Data.GetValue("OrderNumberPatterns__").replace(/([^\n])\n+([^\n])/g, "$1;$2").replace(/\n/g, "");
                }
            },
            GoodIssueNumberPatterns__: {
                GetValue: function () {
                    return Data.GetValue("GoodIssueNumberPatterns__").replace(/([^\n])\n+([^\n])/g, "$1;$2").replace(/\n/g, "");
                }
            },
            ArchiveRoutingAddressMatch__: {
                GetValue: function () {
                    return Data.GetValue("ArchiveRoutingAddressMatch__").replace(/([^\n])\n+([^\n])/g, "$1;$2").replace(/\n/g, "");
                }
            },
            WorkflowAutoEscalationDays__: {
                GetValue: function () {
                    const days = Data.GetValue("WorkflowAutoEscalationDays__");
                    return days <= 0 ? null : days;
                }
            },
            DisableBudget__: {
                GetValue: function () {
                    return !Data.GetValue("EnableBudget__");
                },
                wizardFlexibleField: "EnableBudget__"
            },
            // Ensure Custom ERP connector credentials are saved into the AP - Application Settings__ table
            CustomERPBaseUrl__: {
                GetValue: function () {
                    return Data.GetValue("CustomERPBaseUrl__");
                },
                wizardFlexibleField: "CustomERPBaseUrl__"
            },
            AuthenticationType__: {
                GetValue: function () {
                    return Data.GetValue("AuthenticationType__");
                },
                wizardFlexibleField: "AuthenticationType__"
            },
            OAuth2TokenUrl__: {
                GetValue: function () {
                    return Data.GetValue("OAuth2TokenUrl__");
                },
                wizardFlexibleField: "OAuth2TokenUrl__"
            },
            CustomERPUser__: {
                GetValue: function () {
                    return Data.GetValue("CustomERPUser__");
                },
                wizardFlexibleField: "CustomERPUser__"
            },
            CustomERPPassword__: {
                GetValue: function () {
                    return Data.GetValue("CustomERPPassword__");
                },
                wizardFlexibleField: "CustomERPPassword__"
            },
            GrantType__: {
                GetValue: function () {
                    return Data.GetValue("GrantType__");
                },
                wizardFlexibleField: "GrantType__"
            },
            OAuthUsername__: {
                GetValue: function () {
                    return Data.GetValue("OAuthUsername__");
                },
                wizardFlexibleField: "OAuthUsername__"
            },
            OAuthPassword__: {
                GetValue: function () {
                    return Data.GetValue("OAuthPassword__");
                },
                wizardFlexibleField: "OAuthPassword__"
            },
            // Inject password into ERPConnectorConfiguration JSON
            ERPConnectorConfiguration__: {
                GetValue: function () {
                    const erpConfigString = Data.GetValue("ERPConnectorConfiguration__");
                    if (erpConfigString) {
                        try {
                            const erpConfig = JSON.parse(erpConfigString);
                            // Update password in the JSON - get it directly from Data since specialFields process simultaneously
                            const passwordValue = Data.GetValue("CustomERPPassword__");
                            if (passwordValue) {
                                erpConfig.CustomERPPassword__ = passwordValue;
                            }
                            erpConfig.AuthenticationType__ = Data.GetValue("AuthenticationType__");
                            erpConfig.OAuth2TokenUrl__ = Data.GetValue("OAuth2TokenUrl__");
                            erpConfig.GrantType__ = Data.GetValue("GrantType__");
                            erpConfig.OAuthUsername__ = Data.GetValue("OAuthUsername__");
                            erpConfig.OAuthPassword__ = Data.GetValue("OAuthPassword__");
                            return JSON.stringify(erpConfig);
                        }
                        catch (error) {
                            Log.Error("Error updating password in ERPConnectorConfiguration: " + error);
                            return erpConfigString;
                        }
                    }
                    return erpConfigString;
                },
                wizardFlexibleField: "ERPConnectorConfiguration__"
            }
        }
    };
    // Handle ERP Connector Configuration changes
    const oldERPConnector = Variable.GetValueAsString("oldERPConnector");
    if (Data.GetValue("ERPConnectorConfiguration__") && oldERPConnector !== Data.GetValue("ERP__")) {
        GenerateFieldsInVIPFromCustomFieldsList();
    }
    // Handle C5 reporting fields generation
    const currentC5Setting = Data.GetValue("EnablePeppolC5Reporting__");
    const oldC5Setting = Variable.GetValueAsString("oldEnablePeppolC5Reporting") === "true";
    // Only generate C5 fields if the setting has changed from false to true
    if (currentC5Setting && !oldC5Setting) {
        Log.Info("EnablePeppolC5Reporting__ has been activated, generating C5 fields");
        C5Helper.GenerateFields();
    }
    const record = Sys.Helpers.Database.CD2CT("AP - Application Settings__", "ConfigurationName__=" + Data.GetValue("ConfigurationName__"), options);
    if (record.GetLastError() !== 0) {
        SetError(null, "Could not save settings : " + record.GetLastErrorMessage());
    }
    else {
        Log.Info("The configuration has been successfully saved");
    }
}
// oldParamName is use when the option overriddenByTableParameters is use in Lib_Parameters_P2P. See ArchiveDurationInMonths \ ProcurementArchiveDurationInMonths for example.
const initConfiguration = [{ "instance": "PAC", "paramName": "DisableBudget", "defaultValue": false },
    { "instance": "PAC", "paramName": "UndefinedBudgetBehavior", "defaultValue": "warn" },
    { "instance": "PAC", "paramName": "OutOfBudgetBehavior", "defaultValue": "warn" },
    { "instance": "PAC", "paramName": "ProcurementArchiveDurationInMonths", "defaultValue": "120", "oldParamName": "ArchiveDurationInMonths" },
    { "instance": "PAC", "paramName": "AllowRequestedDeliveryDateInPast", "defaultValue": "false", "oldParamName": "AllowRequestedDeliveryDateInPast" },
    { "instance": "PAC", "paramName": "EnableVendorUNSPSCBrowse", "defaultValue": false },
    { "instance": "PAC", "paramName": "TreasurerLogin", "defaultValue": "adminfinanceprocess.%[reference:serviceUser:demosubstring]", "resolveDemoLogin": true },
    { "instance": "P2P", "paramName": "BudgetKeyColumns", "defaultValue": "CompanyCode__;PeriodCode__;CostCenter__;Group__" },
    { "instance": "P2P", "paramName": "BudgetValidationKeyColumns", "defaultValue": "CompanyCode__;CostCenter__" },
    { "instance": "P2P", "paramName": "DisableCrossSectionalBudgetLine", "defaultValue": false },
    { "instance": "Expense", "paramName": "ExpenseReportTemplateName", "defaultValue": "ExpenseReport.rpt" },
    { "instance": "Expense", "paramName": "SendApprovalNotificationToRequester", "defaultValue": "always" },
    { "instance": "Expense", "paramName": "ReportCreationGroupingKey", "defaultValue": "" },
    { "instance": "Contract", "paramName": "EnableProcurementOnExpiredContract", "defaultValue": true },
    { "instance": "Contract", "paramName": "EnableProcurementOnTerminatedContract", "defaultValue": true },
    { "instance": { "process": "Customer Order", "nameSpace": "process", "field": "ArchiveDuration" }, "paramName": "ProcurementArchiveDurationPortalInMonths", "defaultValue": "24" },
    { "instance": { "process": "Expense", "nameSpace": "process", "field": "ArchiveDuration" }, "paramName": "ExpenseArchiveDurationInMonths", "defaultValue": "120" },
    { "instance": { "process": "P2P - Contract", "nameSpace": "process", "field": "ArchiveDuration" }, "paramName": "ContractArchiveDurationInMonths", "defaultValue": "120", "defaultValueCondition": "0" },
    { "instance": { "process": "Customer Contract", "nameSpace": "process", "field": "ArchiveDuration" }, "paramName": "ContractArchiveDurationPortalInMonths", "defaultValue": "120", "defaultValueCondition": "0" },
    { "instance": { "process": "Project", "nameSpace": "process", "field": "ArchiveDuration" }, "paramName": "ProjectArchiveDurationInMonths", "defaultValue": "120", "defaultValueCondition": "0" }
];
function InitDefaultTableParameters() {
    const initConfigurationExtended = initConfiguration.map(parameter => {
        const extendedParameter = parameter;
        extendedParameter.fieldName = extendedParameter.paramName + "__";
        return extendedParameter;
    });
    const queryOptions = {
        table: "AP - Application Settings__",
        attributes: [...initConfigurationExtended.map(parameter => { return parameter.fieldName; }), ...["RUIDEX", "ConfigurationName__"]],
        additionalOptions: {
            recordBuilder: Sys.GenericAPI.BuildQueryResult
        }
    };
    Sys.GenericAPI.PromisedQuery(queryOptions)
        .Then((queryResult) => {
        queryResult.forEach(configurationQueryResult => {
            const configurationRecord = configurationQueryResult.record;
            const actualVars = configurationRecord.GetVars();
            const recordToUpdate = Process.GetUpdatableTableRecord(configurationQueryResult.GetValue("RUIDEX"));
            const newVars = recordToUpdate.GetVars();
            initConfigurationExtended.forEach(parameter => {
                if (actualVars.GetNbValues(parameter.fieldName) < 1) {
                    let currentUsedValue;
                    if (Sys.Helpers.IsString(parameter.instance)) {
                        currentUsedValue = Sys.Parameters.GetInstance(parameter.instance).GetDefaultParameter(parameter.paramName);
                        if (Sys.Helpers.IsUndefined(currentUsedValue)) {
                            if (parameter.oldParamName) {
                                currentUsedValue = Sys.Parameters.GetInstance(parameter.instance).GetDefaultParameter(parameter.oldParamName);
                                if (Sys.Helpers.IsUndefined(currentUsedValue)) {
                                    currentUsedValue = parameter.defaultValue;
                                }
                            }
                            else {
                                currentUsedValue = parameter.defaultValue;
                            }
                        }
                    }
                    else {
                        const fieldDefinition = parameter.instance;
                        const process = Process.GetProcessDefinition(fieldDefinition.process);
                        const vars = process === null || process === void 0 ? void 0 : process.GetProperties(fieldDefinition.nameSpace, false);
                        currentUsedValue = vars ? vars.GetValue(fieldDefinition.field, 0) : parameter.defaultValue;
                    }
                    if (Sys.Helpers.IsArray(currentUsedValue)) {
                        currentUsedValue = currentUsedValue.join(";");
                    }
                    // default value condition applicatble only on non-array parameter
                    else if (Sys.Helpers.IsDefined(parameter.defaultValueCondition) && currentUsedValue === parameter.defaultValueCondition) {
                        currentUsedValue = parameter.defaultValue;
                    }
                    currentUsedValue = TransformValueIfNeeded(currentUsedValue, parameter);
                    Sys.Helpers.Database.UpdateValueInVars(newVars, { name: parameter.fieldName, value: currentUsedValue });
                    Log.Info(`Migrate parameter "${parameter.paramName}" from configuration ${actualVars.GetValue("ConfigurationName__", 0)} to value : "${currentUsedValue}"`);
                }
                else {
                    Log.Info(`Parameter "${parameter.paramName}" from configuration ${actualVars.GetValue("ConfigurationName__", 0)} already set to : "${actualVars.GetValue(parameter.fieldName, 0)}", with nbValues =${actualVars.GetNbValues(parameter.fieldName)}`);
                }
            });
            recordToUpdate.Commit();
            if (recordToUpdate.GetLastError()) {
                Log.Error(`Failed to update configuration '${actualVars.GetValue("ConfigurationName__", 0)}'. Details: ` + recordToUpdate.GetLastErrorMessage());
            }
        });
    })
        .Catch(() => {
        throw "Unexpected query error";
    });
}
const initGlobalConfiguration = [
    { "paramName": "EnableStandardPurchasingGlobalSetting__", "defaultValue": false, "oldParamName": "EnablePurchasingGlobalSetting__" },
];
function InitDefaultTableGlobalParameters() {
    const queryOptions2 = {
        table: "P2P - Global Application Settings__",
        attributes: [...initGlobalConfiguration.map(parameter => { return parameter.paramName; }), "EnablePurchasingGlobalSetting__", "RUIDEX"],
        additionalOptions: {
            recordBuilder: Sys.GenericAPI.BuildQueryResult
        }
    };
    Sys.GenericAPI.PromisedQuery(queryOptions2)
        .Then((queryResult) => {
        queryResult.forEach(configurationQueryResult => {
            Log.Info("Processing configuration: " + configurationQueryResult.GetValue("RUIDEX"));
            const recordToUpdate = Process.GetUpdatableTableRecord(configurationQueryResult.GetValue("RUIDEX"));
            const newVars = recordToUpdate.GetVars();
            initGlobalConfiguration.forEach(parameter => {
                let currentUsedValue = configurationQueryResult.GetValue(parameter.paramName);
                if (Sys.Helpers.IsEmpty(currentUsedValue)) {
                    if (parameter.oldParamName) {
                        currentUsedValue = configurationQueryResult.GetValue(parameter.oldParamName);
                        if (Sys.Helpers.IsEmpty(currentUsedValue)) {
                            currentUsedValue = parameter.defaultValue;
                        }
                    }
                    else {
                        currentUsedValue = parameter.defaultValue;
                    }
                }
                Log.Info(`Setting parameter "${parameter.paramName}" to value: ${currentUsedValue}`);
                Sys.Helpers.Database.UpdateValueInVars(newVars, { name: parameter.paramName, value: currentUsedValue });
            });
            recordToUpdate.Commit();
            if (recordToUpdate.GetLastError()) {
                Log.Error(`Failed to update global configuration. Details: ` + recordToUpdate.GetLastErrorMessage());
            }
        });
    })
        .Catch(() => {
        throw "Unexpected query error";
    });
}
function TransformValueIfNeeded(value, parameter) {
    if (value) {
        if (parameter.resolveDemoLogin) {
            value = Lib.P2P.ResolveDemoLogin(value);
        }
    }
    return value;
}
function CreateFieldInfo(field, referenceField, isDescriptionField = false) {
    const fieldName = isDescriptionField
        ? field.Z_CustomDimensionX__.replace("__", "Description__")
        : field.Z_CustomDimensionX__;
    const type = isDescriptionField ? "ShortText" : "DatabaseComboBox";
    const labelCounter = field.Z_CustomDimensionX__.replace("Z_CustomDimension_", "").replace("_Code__", "");
    const labelValue = "_LineItemCustomDimension" + labelCounter + (isDescriptionField ? "Description" : "");
    let optionsNode;
    if (isDescriptionField) {
        optionsNode = {
            textSize: "S",
            textAlignment: "left",
            textStyle: "default",
            textColor: "default",
            version: 1,
            label: labelValue + "_report",
            activable: true,
            readonly: true,
            width: 230
        };
    }
    else {
        optionsNode = {
            version: 1,
            label: labelValue + "_report",
            activable: true,
            readonly: false,
            width: 230
        };
    }
    let fieldNode;
    if (isDescriptionField) {
        fieldNode = {
            _type: null,
            _name: "field",
            _label: "field"
        };
    }
    else {
        fieldNode = {
            _type: null,
            _name: "field",
            _label: "field",
            editable: {
                _type: "String",
                _name: "Editable",
                _label: "Editable",
                _v: "false"
            },
            tablename: {
                _type: "String",
                _name: "TableName",
                _label: "TableName",
                _v: "CT#" + Process.GetProcessID("P2P - Custom Dimension " + labelCounter + "__")
            },
            processname: {
                _type: "String",
                _name: "ProcessName",
                _label: "ProcessName",
                _v: ""
            },
            displayedcolumns: {
                _type: "String",
                _name: "DisplayedColumns",
                _label: "DisplayedColumns",
                _v: "CustomDimension" + labelCounter + "__|Description__"
            },
            savedcolumn: {
                _type: "String",
                _name: "SavedColumn",
                _label: "SavedColumn",
                _v: "CustomDimension" + labelCounter + "__"
            },
            usetableforautolearn: {
                _type: "String",
                _name: "UseTableForAutolearn",
                _label: "UseTableForAutolearn",
                _v: "false"
            },
            customfilter: {
                _type: "String",
                _name: "CustomFilter",
                _label: "CustomFilter",
                _v: "(|(CompanyCode__=%[CompanyCode__])(CompanyCode__=)(!(CompanyCode__=*)))"
            },
            sortorder: {
                _type: "String",
                _name: "SortOrder",
                _label: "SortOrder",
                _v: "ASC"
            }
        };
    }
    return {
        field: {
            name: fieldName,
            node: {
                type: type,
                data: [
                    fieldName
                ],
                options: optionsNode,
                stamp: 0
            },
            templateData: {
                _type: "String",
                _name: fieldName,
                _label: labelValue,
                ui: {
                    _type: null,
                    _name: "ui",
                    _label: "ui",
                    automatic: {
                        _type: "Boolean",
                        _name: "automatic",
                        _label: "automatic",
                        _v: true
                    }
                },
                additionalfieldinfo: {
                    _type: null,
                    _name: "additionalfieldinfo",
                    _label: "additionalfieldinfo",
                    isactive: {
                        _type: "String",
                        _name: "isActive",
                        _label: "isActive",
                        _v: "1"
                    },
                    isadditionalfield: {
                        _type: "String",
                        _name: "isAdditionalField",
                        _label: "isAdditionalField",
                        _v: "1"
                    },
                    iscustomfield: {
                        _type: "String",
                        _name: "isCustomField",
                        _label: "isCustomField",
                        _v: "1"
                    },
                    mappedto: {
                        _type: "String",
                        _name: "mappedTo",
                        _label: "mappedTo"
                    }
                },
                db: {
                    _type: null,
                    _name: "db",
                    _label: "db",
                    type: {
                        _type: "String",
                        _name: "type",
                        _label: "type",
                        _v: "STR"
                    },
                    length: {
                        _type: "Number",
                        _name: "length",
                        _label: "length",
                        _v: 50
                    }
                },
                field: fieldNode,
                gdr: {
                    _name: "gdr",
                    _label: "gdr",
                    disableautolearn: {
                        _type: "String",
                        _name: "DisableAutolearn",
                        _label: "DisableAutolearn",
                        _v: "1"
                    },
                    vartype: {
                        _type: "String",
                        _name: "VarType",
                        _label: "VarType",
                        _v: "Area"
                    }
                }
            },
            paneTarget: "Line_items",
            referenceField: referenceField,
            activationData: {
                isActive: true,
                activationCondition: {}
            },
            translatedLabel: fieldName
        },
        label: {
            name: labelValue,
            node: {
                type: "Label",
                data: [
                    fieldName
                ],
                options: {
                    "label": fieldName
                }
            },
            paneTarget: "Line_items"
        }
    };
}
function GenerateCustomFieldsListFromERPConfig() {
    const erpConnectorConfigString = Data.GetValue("ERPConnectorConfiguration__");
    if (erpConnectorConfigString) {
        try {
            const erpConnectorConfig = JSON.parse(erpConnectorConfigString);
            const analyticFields = JSON.parse(erpConnectorConfig.AnalyticFields__) || [];
            let referenceFieldInfo = {
                field: {
                    name: "CCDescription__"
                }
            };
            const fieldsInfo = [];
            for (const field of analyticFields) {
                referenceFieldInfo = CreateFieldInfo(field, referenceFieldInfo.field.name, false);
                fieldsInfo.push(referenceFieldInfo);
                referenceFieldInfo = CreateFieldInfo(field, referenceFieldInfo.field.name, true);
                fieldsInfo.push(referenceFieldInfo);
            }
            return fieldsInfo;
        }
        catch (error) {
            Log.Error("Error parsing ERP Connector Configuration or Analytic Fields: " + error);
            return [];
        }
    }
    Log.Error("ERP Connector Configuration is not set.");
    return [];
}
function GenerateFieldsInVIPFromCustomFieldsList() {
    const customFieldsList = GenerateCustomFieldsListFromERPConfig();
    if (customFieldsList && Array.isArray(customFieldsList) && customFieldsList.length > 0) {
        try {
            const errorOutput = Sys.ProcessUpdater.ProcessTableFields("Vendor invoice", "LineItems__", customFieldsList);
            if (errorOutput) {
                throw new Error(errorOutput);
            }
        }
        catch (error) {
            Log.Error("Could not save Custom Fields: " + error);
        }
    }
}
class C5Helper {
    static GenerateFields() {
        try {
            // Check if C5 fields already exist to avoid duplicates
            if (C5Helper.CheckFieldsExist()) {
                Log.Info("C5 reporting fields already exist, skipping generation");
                return;
            }
            // Define header fields
            const headerFields = [
                C5Helper.GetFieldInfo("CF_C5_EDI_Identifier__", "_CF_C5_EDI_Identifier", null, "Invoice_Processing", true, false),
                C5Helper.GetFieldInfo("CF_C5_EDI_IdentifierType__", "_CF_C5_EDI_IdentifierType", null, "Invoice_Processing", true, false),
                C5Helper.GetFieldInfo("CF_C5_EDI_GSTN__", "_CF_C5_EDI_GSTN", null, "Invoice_Processing", true, false),
                C5Helper.GetC5IntegrationRuidExFieldInfo(),
                C5Helper.GetFieldInfo("CF_C5_Vendor_EDI_Identifier__", "_CF_C5_Vendor_EDI_Identifier", null, "VendorInformation", true, false),
                C5Helper.GetFieldInfo("CF_C5_Vendor_EDI_IdentifierType__", "_CF_C5_Vendor_EDI_IdentifierType", null, "VendorInformation", true, false),
                C5Helper.GetFieldInfo("CF_C5_Vendor_EDI_GSTN__", "_CF_C5_Vendor_EDI_GSTN", null, "VendorInformation", true, false)
            ];
            // Add header fields to Vendor invoice main form
            let errorOutput = Sys.ProcessUpdater.ProcessFields("Vendor invoice", headerFields);
            if (errorOutput) {
                throw new Error("Header fields error: " + errorOutput);
            }
            // Define line item fields
            const lineItemFields = [
                C5Helper.GetFieldInfo("CF_C5_ClassificationCode__", "_CF_C5_ClassificationCode", "CCDescription__", "Line_items", false, true),
                C5Helper.GetFieldInfo("CF_C5_ClassificationCodeList__", "_CF_C5_ClassificationCodeList", "CF_C5_ClassificationCode__", "Line_items", false, true),
                C5Helper.GetFieldInfo("CF_C5_TaxType__", "_CF_C5_TaxType", "TaxCode__", "Line_items", true, true)
            ];
            // Add line item fields to Vendor invoice LineItems table
            errorOutput = Sys.ProcessUpdater.ProcessTableFields("Vendor invoice", "LineItems__", lineItemFields);
            if (errorOutput) {
                throw new Error("Line item fields error: " + errorOutput);
            }
            // Generate C5 fields in custom tables
            C5Helper.GenerateCustomTableFields();
            Log.Info("C5 reporting fields have been successfully added to Vendor invoice processing and custom tables");
        }
        catch (error) {
            Log.Error("Could not save C5 reporting fields: " + error);
        }
    }
    /**
     * Creates a set of fields in custom tables based on predefined configurations.
     * @throws {Error} Throws an error if there is a problem creating custom table fields.
     */
    static GenerateCustomTableFields() {
        Log.Info("Starting generation of C5 fields in custom tables");
        const tableConfigs = [
            {
                processName: "AP - Tax codes__",
                pane: "DataPanel",
                width: 500,
                fields: [
                    { name: "CF_C5_TaxType__", label: "_CF_C5_TaxType" }
                ]
            },
            {
                processName: "AP - Vendors__",
                pane: "DataPanel",
                width: 500,
                fields: [
                    { name: "CF_C5_EDI_Identifier__", label: "_CF_C5_EDI_Identifier" },
                    { name: "CF_C5_EDI_IdentifierType__", label: "_CF_C5_EDI_IdentifierType" }
                ]
            },
            {
                processName: "PurchasingCompanycodes__",
                pane: "CompanyInfo",
                width: 230,
                fields: [
                    { name: "CF_C5_EDI_Identifier__", label: "_CF_C5_EDI_Identifier" },
                    { name: "CF_C5_EDI_IdentifierType__", label: "_CF_C5_EDI_IdentifierType" }
                ]
            }
        ];
        for (const tableConfig of tableConfigs) {
            const processName = tableConfig.processName;
            Log.Info(`Creating C5 fields in ${processName} table`);
            // Create field definitions using the same pattern as C5Helper
            const fieldDefinitions = [];
            for (const fieldInfo of tableConfig.fields) {
                const fieldDefinition = C5Helper.GetFieldInfo(fieldInfo.name, fieldInfo.label, null, tableConfig.pane, false, false, true);
                fieldDefinition.field.node.options.width = tableConfig.width;
                fieldDefinitions.push(fieldDefinition);
            }
            const errorOutput = Sys.ProcessUpdater.ProcessFields(processName, fieldDefinitions);
            if (errorOutput) {
                throw new Error("Custom table fields error: " + errorOutput);
            }
        }
        Log.Info("C5 custom table fields generation completed successfully");
    }
    static CheckFieldsExist() {
        try {
            const processDefinition = Process.GetProcessDefinition("Vendor invoice");
            if (!processDefinition) {
                Log.Info("Could not get Vendor invoice process definition");
                return false;
            }
            // Check if any C5 field already exists by looking for CF_C5_EDI_Identifier__ as a marker
            // If this field exists, we assume all C5 fields have been created
            const field = processDefinition.GetFieldByName(C5Helper.MARKER_FIELD);
            if (field) {
                Log.Info("C5 field " + C5Helper.MARKER_FIELD + " found, C5 fields already exist");
                return true;
            }
            // Alternative check: try to access field properties
            try {
                const processVars = processDefinition.GetProperties("field", false);
                if (processVars && processVars.GetNbValues(C5Helper.MARKER_FIELD) > 0) {
                    Log.Info("C5 field found in process properties");
                    return true;
                }
            }
            catch (propertyError) {
                Log.Info("Could not check process properties: " + propertyError);
            }
            return false;
        }
        catch (error) {
            Log.Info("Could not check C5 fields existence, assuming they don't exist: " + error);
            return false;
        }
    }
    /**
     * Creates a field definition with configurable pane target
     * @param fieldName - Name of the field
     * @param labelKey - Label key for the field
     * @param referenceField - Reference field for positioning
     * @param paneTarget - Target pane for the field ("Invoice_Processing", "Line_items", "General")
     * @returns FieldDefinition object
     */
    static GetFieldInfo(fieldName, labelKey, referenceField, paneTarget, readonly, isTableField, isCTField = false) {
        return {
            field: {
                name: fieldName,
                node: {
                    type: "ShortText",
                    data: [
                        fieldName
                    ],
                    options: {
                        textSize: "S",
                        textAlignment: "left",
                        textStyle: "default",
                        textColor: "default",
                        version: 1,
                        label: labelKey,
                        activable: true,
                        readonly: readonly,
                        hidden: !isCTField,
                        width: 180
                    },
                    stamp: 0
                },
                templateData: {
                    _type: "String",
                    _name: fieldName,
                    _label: labelKey + "_report",
                    ui: {
                        _type: null,
                        _name: "ui",
                        _label: "ui",
                        automatic: {
                            _type: "Boolean",
                            _name: "automatic",
                            _label: "automatic",
                            _v: true
                        }
                    },
                    additionalfieldinfo: {
                        _type: null,
                        _name: "additionalfieldinfo",
                        _label: "additionalfieldinfo",
                        isactive: {
                            _type: "String",
                            _name: "isActive",
                            _label: "isActive",
                            _v: "1"
                        },
                        isadditionalfield: {
                            _type: "String",
                            _name: "isAdditionalField",
                            _label: "isAdditionalField",
                            _v: "1"
                        },
                        iscustomfield: {
                            _type: "String",
                            _name: "isCustomField",
                            _label: "isCustomField",
                            _v: "1"
                        },
                        mappedto: {
                            _type: "String",
                            _name: "mappedTo",
                            _label: "mappedTo"
                        }
                    },
                    db: {
                        _type: null,
                        _name: "db",
                        _label: "db",
                        type: {
                            _type: "String",
                            _name: "type",
                            _label: "type",
                            _v: "STR"
                        },
                        length: {
                            _type: "Number",
                            _name: "length",
                            _label: "length",
                            _v: 50
                        }
                    },
                    field: {
                        _type: null,
                        _name: "field",
                        _label: "field"
                    },
                    gdr: {
                        _name: "gdr",
                        _label: "gdr",
                        disableautolearn: {
                            _type: "String",
                            _name: "DisableAutolearn",
                            _label: "DisableAutolearn",
                            _v: "1"
                        },
                        vartype: {
                            _type: "String",
                            _name: "VarType",
                            _label: "VarType",
                            _v: "Area"
                        }
                    }
                },
                paneTarget: paneTarget,
                referenceField: referenceField,
                activationData: {
                    isActive: true,
                    activationCondition: {}
                },
                translatedLabel: labelKey,
                reportLabel: labelKey + "_report"
            },
            label: {
                name: isTableField ? labelKey : "Label" + fieldName,
                node: {
                    type: "Label",
                    data: [
                        fieldName
                    ],
                    options: {
                        "label": labelKey
                    }
                },
                paneTarget: paneTarget
            }
        };
    }
    /**
     * Creates a specialized field definition for CF_C5_IntegrationRuidEx__ as a clickable DatabaseComboBox
     * @returns FieldDefinition object for the C5 Integration RuidEx field
     */
    static GetC5IntegrationRuidExFieldInfo() {
        return {
            field: {
                name: "CF_C5_IntegrationRuidEx__",
                node: {
                    type: "DatabaseComboBox",
                    data: [
                        "CF_C5_IntegrationRuidEx__"
                    ],
                    options: {
                        version: 1,
                        activable: true,
                        width: 250,
                        label: "_CF_C5_IntegrationRuidEx",
                        readonly: true,
                        hidden: true,
                        autoCompleteSearchMode: "startswith",
                        searchMode: "contains",
                        minNbLines: 1,
                        maxNbLines: 1,
                        PreFillFTS: true,
                        fTSmaxRecords: "20"
                    },
                    stamp: 0
                },
                templateData: {
                    _type: "String",
                    _name: "CF_C5_IntegrationRuidEx__",
                    _label: "_CF_C5_IntegrationRuidEx_report",
                    ui: {
                        _type: null,
                        _name: "ui",
                        _label: "ui",
                        automatic: {
                            _type: "Boolean",
                            _name: "automatic",
                            _label: "automatic",
                            _v: true
                        }
                    },
                    additionalfieldinfo: {
                        _type: null,
                        _name: "additionalfieldinfo",
                        _label: "additionalfieldinfo",
                        isactive: {
                            _type: "String",
                            _name: "isActive",
                            _label: "isActive",
                            _v: "1"
                        },
                        isadditionalfield: {
                            _type: "String",
                            _name: "isAdditionalField",
                            _label: "isAdditionalField",
                            _v: "1"
                        },
                        iscustomfield: {
                            _type: "String",
                            _name: "isCustomField",
                            _label: "isCustomField",
                            _v: "1"
                        },
                        mappedto: {
                            _type: "String",
                            _name: "mappedTo",
                            _label: "mappedTo"
                        }
                    },
                    db: {
                        _type: null,
                        _name: "db",
                        _label: "db",
                        type: {
                            _type: "String",
                            _name: "type",
                            _label: "type",
                            _v: "STR"
                        },
                        length: {
                            _type: "Number",
                            _name: "length",
                            _label: "length",
                            _v: 50
                        }
                    },
                    field: {
                        _type: null,
                        _name: "field",
                        _label: "field",
                        editable: {
                            _type: "String",
                            _name: "Editable",
                            _label: "Editable",
                            _v: "true"
                        },
                        tablename: {
                            _type: "String",
                            _name: "TableName",
                            _label: "TableName",
                            _v: "CD#NOID"
                        },
                        processname: {
                            _type: "String",
                            _name: "ProcessName",
                            _label: "ProcessName",
                            _v: "C5 Integration"
                        },
                        displayedcolumns: {
                            _type: "String",
                            _name: "DisplayedColumns",
                            _label: "DisplayedColumns",
                            _v: "CompanyCode__|VendorNumber__|VendorName__|C5Status_Code__|C5Status_Type__|C5Status_Date__"
                        },
                        savedcolumn: {
                            _type: "String",
                            _name: "SavedColumn",
                            _label: "SavedColumn",
                            _v: "InvoiceNumber__"
                        },
                        usetableforautolearn: {
                            _type: "String",
                            _name: "UseTableForAutolearn",
                            _label: "UseTableForAutolearn",
                            _v: "false"
                        },
                        customfilter: {
                            _type: "String",
                            _name: "CustomFilter",
                            _label: "CustomFilter",
                            _v: "(|(CompanyCode__=%[CompanyCode__])(CompanyCode__=)(!(CompanyCode__=*)))"
                        },
                        sortorder: {
                            _type: "String",
                            _name: "SortOrder",
                            _label: "SortOrder",
                            _v: "ASC"
                        }
                    },
                    gdr: {
                        _name: "gdr",
                        _label: "gdr",
                        disableautolearn: {
                            _type: "String",
                            _name: "DisableAutolearn",
                            _label: "DisableAutolearn",
                            _v: "1"
                        },
                        vartype: {
                            _type: "String",
                            _name: "VarType",
                            _label: "VarType",
                            _v: "Area"
                        }
                    }
                },
                paneTarget: "Invoice_Processing",
                referenceField: null,
                activationData: {
                    isActive: true,
                    activationCondition: {}
                },
                translatedLabel: "_CF_C5_IntegrationRuidEx",
                reportLabel: "_CF_C5_IntegrationRuidEx_report"
            },
            label: {
                name: "Label" + "CF_C5_IntegrationRuidEx__",
                node: {
                    type: "Label",
                    data: [
                        "CF_C5_IntegrationRuidEx__"
                    ],
                    options: {
                        "label": "_CF_C5_IntegrationRuidEx"
                    }
                },
                paneTarget: "Invoice_Processing"
            }
        };
    }
}
C5Helper.MARKER_FIELD = "CF_C5_EDI_Identifier__";
function run() {
    // Saving the configuration
    if (Data.GetValue("ConfigurationName__") === "InitDefaultTableParameters") {
        InitDefaultTableParameters();
        InitDefaultTableGlobalParameters();
        Data.SetValue("State", 100);
    }
    else if (Data.GetActionType() === "approve" && CheckConfiguration()) {
        Save();
    }
}
run();
//# sourceMappingURL=validationscript.js.map