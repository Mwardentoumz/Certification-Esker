"use strict";
/* eslint-disable dot-notation */
/* eslint-disable class-methods-use-this,guard-for-in,no-case-declarations */
var ValidationScript;
(function (ValidationScript) {
    var CSVFileType = Lib.Contract.Management.CSVFileType;
    var ProcessStatus = Lib.Contract.Management.ProcessStatus;
    var LibContractServer = Lib.Contract.LibContractServer;
    var ImportActionToDo = Lib.Contract.Management.ImportActionToDo;
    var ContractHandler = Lib.Contract.Handler;
    let ContractDefinition;
    (function (ContractDefinition) {
        ContractDefinition.fieldToTypeMap = {
            "AmendmentType__": "string",
            "ApprovedDate__": "date",
            "ArchiveDurationInMonths__": "string",
            "Comments__": "string",
            "CompanyCode__": "string",
            "ContractNumber__": "string",
            "ContractStatus__": "string",
            "ContractSubmissionDateTime__": "date",
            "ContractTypeID__": "string",
            "ContractType__": "string",
            "Currency__": "string",
            "Description__": "string",
            "DoNotNotifyOnNotificationDateReached__": "bool",
            "Duration__": "int",
            "EffectiveDate__": "date",
            "EndDate__": "date",
            "EnableContractSignature__": "bool",
            "FromContractManagement__": "bool",
            "InitialEndDate__": "date",
            "InitialStartDate__": "date",
            "InitiallyExpectedEndDate__": "date",
            "MaxAmount__": "double",
            "MinAmount__": "double",
            "Name__": "string",
            "NotificationDate__": "date",
            "OriginalContractRUIDEX__": "string",
            "OutOfAmountBehavior__": "string",
            "OwnerLogin__": "string",
            "OwnerNiceName__": "string",
            "PreviousContractRUIDEX__": "string",
            "PriorNotice__": "int",
            "Reasons__": "string",
            "ReferenceNumber__": "string",
            "RenewalReminderDays__": "int",
            "RenewalTerms__": "int",
            "RequesterLogin__": "string",
            "RequesterNiceName__": "string",
            "ResiliationDate__": "date",
            "SignatureDesignerLogin__": "string",
            "SignatureDesignerNiceName__": "string",
            "StartDate__": "date",
            "TacitRenewal__": "bool",
            "TechnicalData__": "string",
            "TerminatedByName__": "string",
            "TerminatedBylogin__": "string",
            "TerminationComment__": "string",
            "TerminationRequestedOn__": "date",
            "VendorAddress__": "string",
            "VendorEmail__": "string",
            "VendorName__": "string",
            "VendorNumber__": "string",
            "VendorOpeningHours__": "string",
            "VendorPhone__": "string",
            "VendorWebsite__": "string",
            "Version__": "int"
        };
        ContractDefinition.fields = Object.keys(ContractDefinition.fieldToTypeMap);
        ContractDefinition.lowToNormedFields = {};
        for (const field of ContractDefinition.fields) {
            ContractDefinition.lowToNormedFields[field.toLowerCase()] = field;
        }
    })(ContractDefinition || (ContractDefinition = {}));
    class ContractTransportHandler extends Lib.P2P.TransportDataHandler {
        constructor(transport) {
            super(transport);
            this.transport = transport;
            this.fieldToTypeMap = ContractDefinition.fieldToTypeMap;
        }
        GetError(fieldName) {
            throw new Error("Method not implemented AND SHOULD NOT BE USED.");
        }
        SetError(fieldName, message, ...parameterList) {
            if (message) {
                throw new LibContractServer(`${fieldName}: ${Language.Translate(message, false, ...parameterList)}`);
            }
            return true;
        }
        GetErrorCategory(fieldName) {
            return "";
        }
        SetCategorizedError(fieldName, category, message, ...parameterList) {
            return this.SetError(fieldName, message, ...parameterList);
        }
    }
    class ContractPartialTransportHandler {
        constructor(full, partial) {
            this.GetError = (variableName) => {
                return this.full.GetError(variableName);
            };
            this.GetValue = (variableName) => {
                return this.full.GetValue(variableName);
            };
            this.IsNullOrEmpty = (variableName) => {
                return this.full.IsNullOrEmpty(variableName);
            };
            this.SetError = (variableName, value, ...parameterList) => {
                this.partial.SetError(variableName, value, ...parameterList);
                return this.full.SetError(variableName, value, ...parameterList);
            };
            this.GetErrorCategory = (variableName) => {
                return this.full.GetErrorCategory(variableName);
            };
            this.SetCategorizedError = (variableName, category, value, ...parameterList) => {
                this.partial.SetCategorizedError(variableName, category, value, ...parameterList);
                return this.full.SetCategorizedError(variableName, category, value, ...parameterList);
            };
            this.SetValue = (variableName, value) => {
                this.propsUpdated.add(variableName);
                this.partial.SetValue(variableName, value);
                return this.full.SetValue(variableName, value);
            };
            this.full = new ContractTransportHandler(full);
            this.partial = new ContractTransportHandler(partial);
            this.propsUpdated = new Set();
        }
        GetVariableValueAsString(variableName) {
            return this.full.GetVariableValueAsString(variableName);
        }
        SetVariableValueAsString(variableName, value) {
            this.partial.SetVariableValueAsString(variableName, value);
            return this.full.SetVariableValueAsString(variableName, value);
        }
    }
    class CUser {
        constructor() {
            var _a;
            this.isAdmin = false;
            this.userObject = Users.GetUser(Data.GetValue("OwnerId"));
            if (this.userObject) {
                const options = {
                    table: "ODProfile",
                    filter: `(msn=${(_a = this.userObject) === null || _a === void 0 ? void 0 : _a.GetValue("ProfileId")})`,
                    attributes: ["role"],
                    maxRecords: 1
                };
                this.queryProfilePromise = Sys.GenericAPI.PromisedQuery(options)
                    .Then(profileResults => {
                    this.isAdmin = profileResults[0].role === "accountManagement";
                });
            }
            else {
                this.queryProfilePromise = Promise.resolve();
                this.isAdmin = true;
            }
        }
        Ready() {
            return this.queryProfilePromise;
        }
        IsContractOwner(contractOwnerLogin) {
            return !this.userObject
                || this.userObject.GetValue("login") === contractOwnerLogin
                || this.userObject.IsMemberOf(contractOwnerLogin)
                || this.userObject.IsBackupUserOf(contractOwnerLogin);
        }
        get IsAdmin() {
            return this.isAdmin;
        }
        get Login() {
            var _a;
            return (_a = this.userObject) === null || _a === void 0 ? void 0 : _a.GetValue("login");
        }
        get DisplayName() {
            var _a;
            return (_a = this.userObject) === null || _a === void 0 ? void 0 : _a.GetValue("displayName");
        }
    }
    ValidationScript.CUser = CUser;
    class ContractCSVHandler {
        static GetCSVHeaderAttachement(n) {
            return `Attachment ${n + 1}`;
        }
        static GetCSVHeaderDocument() {
            return "Document";
        }
        static GetCSVHeaderContractStatus() {
            return "Status";
        }
        constructor() {
            this.CONTRACT_PROP_CHARACTER_ALLOWED = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
            this.IDENTIFICATIONS_PROPS = [
                [
                    "CompanyCode__",
                    "ContractNumber__"
                ], [
                    "CompanyCode__",
                    "ReferenceNumber__",
                    "VendorNumber__"
                ]
            ];
            this.CONTRACT_PROP_PRIVATE = [
                "AmendmentType__",
                "ApprovedDate__",
                "Comments__",
                "ContractStatus__",
                "Duration__",
                "OriginalContractRUIDEX__",
                "PreviousContractRUIDEX__",
                "TechnicalData__",
                "TerminatedByName__",
                "TerminatedBylogin__",
                "TerminationComment__",
                "TerminationRequestedOn__",
                // import specific
                "StatusDeductionRule__",
                "TerminationRequested__",
                "UpdateAsAdminRequested__"
            ];
            this.CONTRACT_CREATION_PROP_PRIVATE = [
                "EffectiveDate__",
                "InitiallyExpectedEndDate__",
                "Reasons__",
                "TerminationCommentRequested__",
                "TerminationDateRequested__",
                "Version__"
            ];
            this.CONTRACT_CREATION_PROP_REQUIRED = [
                "CompanyCode__",
                "EndDate__",
                "Name__",
                "OwnerLogin__",
                "ReferenceNumber__",
                "StartDate__",
                "VendorNumber__"
            ];
            this.CONTRACT_TERMINATION_PROP_REQUIRED = [
                "TerminationDateRequested__",
                "TerminationCommentRequested__"
            ];
            this.EDITABLE_TO_UPDATABLE = {
                // Use null for delete
                "ContractType__": "ContractTypeID__",
                "OwnerNiceName__": "OwnerLogin__",
                "Duration__": null
            };
            this.CONTRACT_UPDATE_PROP_NOT_UPDATABLE_AS_ADMIN = (() => // use disallow list for allow customs fields
             {
                const allowField = Lib.Contract.editableControlsAsAdmin.reduce((fields, attr) => {
                    if (this.EDITABLE_TO_UPDATABLE[attr] !== null) {
                        fields.push(this.EDITABLE_TO_UPDATABLE[attr] || attr);
                    }
                    return fields;
                }, ["Currency__"]);
                return ContractDefinition.fields.filter((e) => !allowField.includes(e));
            })();
            this.CONTRACT_UPDATE_PROP_WITH_EXCPETED_VALUE = [
                "EndDate__",
                "Name__",
                "OwnerLogin__",
                "StartDate__"
            ];
            this.CONTRACT_UPDATE_ALLOWED_CONTRACT_TO_UPDATE_STATUS = [
                Lib.Contract.Status.Active,
                Lib.Contract.Status.ApprovedPendingActivation,
                Lib.Contract.Status.Expired
            ];
            this.CONTRACT_AMENDMENT_PROP_REQUIRED = [
                "Reasons__"
            ];
            this.CONTRACT_AMENDMENT_PROP_NOT_UPDATABLE = ContractDefinition.fields // use disallow list for allow customs fields
                .filter((e) => ![
                // Updatable fields
                "ArchiveDurationInMonths__",
                "ContractTypeID__",
                "Currency__",
                "Description__",
                "DoNotNotifyOnNotificationDateReached__",
                "EffectiveDate__",
                "EndDate__",
                "MaxAmount__",
                "MinAmount__",
                "Name__",
                "OutOfAmountBehavior__",
                "PriorNotice__",
                "Reasons__",
                "RenewalReminderDays__",
                "RenewalTerms__",
                "StartDate__",
                "TacitRenewal__"
            ].includes(e));
            this.CONTRACT_AMENDMENT_PROP_WITH_EXPECTED_VALUE = [
                "ArchiveDurationInMonths__",
                "EndDate__",
                "Name__",
                "RenewalReminderDays__",
                "StartDate__"
            ];
            this.CONTRACT_AMENDMENT_ALLOWED_CONTRACT_TO_AMEND_STATUS = [
                Lib.Contract.Status.Active,
                Lib.Contract.Status.Expired
            ];
            this.ERROR_REQUIRED_PROPERTIES = {
                MissingColumn: {
                    [ImportActionToDo.NOACTION]: "_missing_required_prop",
                    [ImportActionToDo.UPDATE]: "_missing_required_prop_update",
                    [ImportActionToDo.CREATE]: "_missing_required_prop_creation",
                    [ImportActionToDo.AMEND]: "_missing_required_prop_amendment",
                    [ImportActionToDo.TERMINATE]: "_missing_required_prop_termination"
                },
                EmptyColumn: {
                    [ImportActionToDo.NOACTION]: "_empty_required_value",
                    [ImportActionToDo.UPDATE]: "_empty_required_value_update",
                    [ImportActionToDo.CREATE]: "_empty_required_value_creation",
                    [ImportActionToDo.AMEND]: "_empty_required_value_amendment",
                    [ImportActionToDo.TERMINATE]: "_empty_required_value_termination"
                }
            };
        }
        ExtractDocumentAndAttachement(lineObject, zipEntries) {
            let document = null;
            let attachements = [];
            const keyDocument = ContractCSVHandler.GetCSVHeaderDocument();
            const filePath = lineObject[keyDocument];
            if (filePath) {
                const convertedFilePath = this.convertFilePath(filePath);
                const compressedFileEntry = this.FindZipEntries(zipEntries, convertedFilePath);
                if (compressedFileEntry) {
                    document = {
                        csvDocumentEntry: keyDocument,
                        zipFile: compressedFileEntry
                    };
                }
                else {
                    throw new LibContractServer(Language.Translate("_invalid_document_path", true, filePath));
                }
            }
            else if (lineObject.EnableContractSignature__) {
                throw new LibContractServer(Language.Translate("_missing_document_for_docusign"));
            }
            for (let i = 0; i < ContractCSVHandler.NB_ATTACHMENT_BY_CONTRAT_MAX; i++) {
                const keyFile = ContractCSVHandler.GetCSVHeaderAttachement(i);
                const filePath = lineObject[keyFile];
                if (!filePath) {
                    continue;
                }
                const convertedFilePath = this.convertFilePath(filePath);
                const compressedFileEntry = this.FindZipEntries(zipEntries, convertedFilePath);
                if (compressedFileEntry) {
                    attachements.push({
                        csvDocumentEntry: keyFile,
                        csvDocumentNumber1Base: i + 1,
                        zipFile: compressedFileEntry
                    });
                }
                else {
                    throw new LibContractServer(Language.Translate("_invalid_attachment_path", true, keyFile, filePath));
                }
            }
            return {
                document,
                attachements
            };
        }
        static async ApplyChange(contractHandler, propertiesToUpdate) {
            const orderedProperties = ["ContractTypeID__", "TacitRenewal__", "StartDate__", "EndDate__", "RenewalTerms__", "PriorNotice__"];
            for (const prop in propertiesToUpdate) {
                if (!orderedProperties.includes(prop)) {
                    contractHandler.SetValue(prop, propertiesToUpdate[prop]);
                }
            }
            for (const prop of orderedProperties) {
                if (prop in propertiesToUpdate) {
                    contractHandler.SetValue(prop, propertiesToUpdate[prop]);
                }
            }
            contractHandler.Fields.Spendings.OnChange();
            contractHandler.CheckCurrenciesCoherency();
        }
        TacitRenewalSpecificRequiredPropertiesOnUpdate(propToUpdate, contract) {
            if ("TacitRenewal__" in propToUpdate && Sys.Helpers.String.ToBoolean(contract.CSVproperties.TacitRenewal__) ||
                !("TacitRenewal__" in propToUpdate) && contract.transportHandler.GetValue("TacitRenewal__")) {
                return ["PriorNotice__", "RenewalTerms__"];
            }
            return [];
        }
        IsTacitAlreadyRenewedForCreate(propertiesToSave) {
            const startDate = ContractCSVHandler.ExtractDate(propertiesToSave["StartDate__"]);
            const initialStartDate = ContractCSVHandler.ExtractDate(propertiesToSave["InitialStartDate__"]);
            const isTacit = Sys.Helpers.String.ToBoolean(propertiesToSave["TacitRenewal__"]);
            return isTacit && startDate && initialStartDate && (Sys.Helpers.Date.CompareDate(startDate, initialStartDate) !== 0 /* Sys.Helpers.Date.Period.Now */);
        }
        async UpdateContractValuesForCreate(contract, statusDeductionRule) {
            this.CheckPropertiesCharacterAllowed(contract.CSVproperties);
            if (Sys.Helpers.String.ToBoolean(contract.CSVproperties.TacitRenewal__)) {
                contract.specificRequiredProperties.push("PriorNotice__");
                contract.specificRequiredProperties.push("RenewalTerms__");
            }
            const requiredProps = [...this.CONTRACT_CREATION_PROP_REQUIRED, ...contract.specificRequiredProperties];
            this.CheckRequiredProperties(contract.CSVproperties, requiredProps, ImportActionToDo.CREATE);
            this.CheckDates(contract.CSVproperties, [
                "StartDate__",
                "EndDate__",
                "InitialEndDate__",
                "InitialStartDate__",
                "InitiallyExpectedEndDate__"
            ]);
            this.CheckOutOfAmountBehavior(contract.CSVproperties);
            const ret = await this.ResolveCreationFieldDependencies(contract.CSVproperties);
            const propertiesToSave = { ...contract.CSVproperties, ...ret };
            for (const prop of this.CONTRACT_CREATION_PROP_PRIVATE) {
                delete propertiesToSave[prop];
            }
            const contractHandler = new ContractHandler(contract.transportHandler, () => false, this.IsTacitAlreadyRenewedForCreate(propertiesToSave));
            await ContractCSVHandler.ApplyChange(contractHandler, propertiesToSave);
            contractHandler.SetValue("ContractStatus__", statusDeductionRule); // Will be used and replace in contract extraction script
        }
        async UpdateContractValuesForUpdate(contract) {
            const propToUpdate = {};
            for (const prop in contract.CSVproperties) {
                if (!this.CONTRACT_UPDATE_PROP_NOT_UPDATABLE_AS_ADMIN.includes(prop)) {
                    propToUpdate[prop] = contract.CSVproperties[prop];
                }
            }
            contract.specificRequiredProperties.push(...this.TacitRenewalSpecificRequiredPropertiesOnUpdate(propToUpdate, contract));
            this.CheckPropWithExpectedValue(propToUpdate, [...this.CONTRACT_UPDATE_PROP_WITH_EXCPETED_VALUE, ...contract.specificRequiredProperties], contract.transportHandler, ImportActionToDo.UPDATE);
            this.CheckDates(propToUpdate, [
                "StartDate__",
                "EndDate__"
            ]);
            this.CheckOutOfAmountBehavior(propToUpdate);
            await this.ResolveUpdateFieldDependencies(propToUpdate, contract);
            const contractHandler = new ContractHandler(contract.transportHandler, () => true);
            await ContractCSVHandler.ApplyChange(contractHandler, propToUpdate);
        }
        UpdateContractValuesForTerminate(contract) {
            this.CheckRequiredProperties(contract.CSVproperties, this.CONTRACT_TERMINATION_PROP_REQUIRED, ImportActionToDo.TERMINATE);
            this.CheckDate(contract.CSVproperties.TerminationDateRequested__);
            const contractHandler = new ContractHandler(contract.transportHandler, () => false);
            const terminationDateRequestedError = contractHandler.CheckTerminationDateRequested(ContractCSVHandler.ExtractDate(contract.CSVproperties.TerminationDateRequested__));
            if (terminationDateRequestedError) {
                throw new LibContractServer(Language.Translate(terminationDateRequestedError));
            }
            const user = Users.GetUser(Data.GetValue("OwnerId"));
            if (!user) {
                throw new LibContractServer(Language.Translate("_Failed to get document owner user"));
            }
            const terminatedProps = Lib.Contract.ComputeTerminatedProperties(ContractCSVHandler.ExtractDate(contract.CSVproperties.TerminationDateRequested__), contract.transportHandler.GetValue("EndDate__"), contract.CSVproperties.TerminationCommentRequested__, user.GetValue("DisplayName"), user.GetValue("Login"));
            for (const attribute in terminatedProps) {
                contract.transportHandler.SetValue(attribute, terminatedProps[attribute]);
            }
        }
        async UpdateContractValuesForAmendment(contract, statusDeductionRule) {
            const propToUpdate = {};
            for (const prop in contract.CSVproperties) {
                if (!this.CONTRACT_AMENDMENT_PROP_NOT_UPDATABLE.includes(prop)) {
                    propToUpdate[prop] = contract.CSVproperties[prop];
                }
            }
            this.CheckRequiredProperties(contract.CSVproperties, this.CONTRACT_AMENDMENT_PROP_REQUIRED, ImportActionToDo.AMEND);
            contract.specificRequiredProperties.push(...this.TacitRenewalSpecificRequiredPropertiesOnUpdate(propToUpdate, contract));
            this.CheckPropWithExpectedValue(propToUpdate, [...this.CONTRACT_AMENDMENT_PROP_WITH_EXPECTED_VALUE, ...contract.specificRequiredProperties], contract.transportHandler, ImportActionToDo.AMEND);
            this.CheckDates(contract.CSVproperties, [
                "StartDate__",
                "EffectiveDate__",
                "EndDate__"
            ]);
            this.CheckOutOfAmountBehavior(propToUpdate);
            await this.ResolveUpdateFieldDependencies(propToUpdate, contract);
            const contractHandler = new ContractHandler(contract.transportHandler, () => false);
            await ContractCSVHandler.ApplyChange(contractHandler, propToUpdate);
            contractHandler.SetValue("ContractStatus__", statusDeductionRule); // Will be used and replace in contract extraction script
        }
        GetLastVersionContractsRecords(filterId) {
            return Lib.Contract.GetLastVersionContractsRecords(filterId);
        }
        GetCorrespondingRecord(CSVproperties) {
            let hasRequiredProps = false;
            let argsfilterId = [];
            let wrongRequiredProperties = [];
            for (const props of this.IDENTIFICATIONS_PROPS) {
                try {
                    this.CheckRequiredProperties(CSVproperties, props, ImportActionToDo.NOACTION);
                    hasRequiredProps = true;
                }
                catch (e) {
                    const missingProperties = this.GetMissingRequiredProperties(CSVproperties, props);
                    const emptyProperties = this.GetEmptyRequiredProperties(CSVproperties, props);
                    if (missingProperties.length > 0 || emptyProperties.length > 0) {
                        wrongRequiredProperties.push(missingProperties.concat(emptyProperties));
                    }
                    continue;
                }
                argsfilterId.push(Sys.Helpers.LdapUtil.FilterAnd(...props.map((k) => Sys.Helpers.LdapUtil.FilterEqual(k, CSVproperties[k]))));
            }
            if (!hasRequiredProps) {
                throw new LibContractServer(Language.Translate("_missing_required_identification_props", true));
            }
            const filterId = Sys.Helpers.LdapUtil.FilterOr(...argsfilterId);
            const matchingRecords = this.GetLastVersionContractsRecords(filterId);
            const uniqueProps = [...new Set(this.IDENTIFICATIONS_PROPS.flat())];
            const uniqueWrongProps = new Set(wrongRequiredProperties.flat());
            const uniqueFilledProps = uniqueProps.filter(p => !uniqueWrongProps.has(p));
            return this.CheckMatchingRecords(matchingRecords, uniqueFilledProps, CSVproperties);
        }
        CheckMatchingRecords(matchingRecords, filledProps, CSVproperties) {
            if (!matchingRecords || matchingRecords.GetNbTransports() === 0) {
                return null;
            }
            if (matchingRecords.GetNbTransports() > 1) {
                const record = matchingRecords.GetTransport(0);
                if (record) {
                    const vars = record.GetUninheritedVars();
                    if (vars.GetValue_String("ContractStatus__", 0) === Lib.Contract.Status.ApprovedPendingActivation) {
                        // When we have a active contract + pending activation amendment
                        throw new LibContractServer(Language.Translate("_invalid_contract_to_amend_status", true));
                    }
                }
                throw new LibContractServer(Language.Translate("_multiple_contract_match_identification", true));
            }
            this.CheckMatchingIdentificationsProps(matchingRecords, filledProps, CSVproperties);
            return matchingRecords.GetTransport(0);
        }
        CheckMatchingIdentificationsProps(matchingRecords, filledProps, CSVproperties) {
            var _a, _b;
            const record = matchingRecords.GetTransport(0);
            if (record) {
                const vars = record.GetUninheritedVars();
                for (const prop of filledProps) {
                    if (((_a = vars.GetValue_String(prop, 0)) === null || _a === void 0 ? void 0 : _a.toUpperCase()) !== ((_b = CSVproperties[prop]) === null || _b === void 0 ? void 0 : _b.toUpperCase())) {
                        throw new LibContractServer(Language.Translate("_multiple_identification_props_not_matching : {0}", true, prop));
                    }
                }
            }
        }
        async NewContract(contract, lineObject, zipEntries, params) {
            Log.Info(`New Contract ${contract.transportHandler.GetValue("ContractNumber__")}`);
            contract.actionToDo = ImportActionToDo.CREATE;
            if (Sys.Helpers.String.ToBoolean(lineObject.TerminationRequested__)) {
                throw new LibContractServer(Language.Translate("_Only_active_existing_contract_can_be_terminate"));
            }
            else if (Sys.Helpers.String.ToBoolean(lineObject.UpdateAsAdminRequested__)) {
                throw new LibContractServer(Language.Translate("_UpdateAsAdminRequested_contract_not_found"));
            }
            if (!lineObject.StatusDeductionRule__) {
                throw new LibContractServer(Language.Translate("_invalid_or_missing_status_deduction_rule"));
            }
            if (zipEntries) {
                const { document, attachements } = this.ExtractDocumentAndAttachement(lineObject, zipEntries);
                contract.document = document;
                contract.attachements = attachements;
            }
            else if (contract.CSVproperties.EnableContractSignature__) {
                throw new LibContractServer(Language.Translate("_missing_document_for_docusign"));
            }
            if (params && params.contractTypeRequired) {
                contract.specificRequiredProperties.push("ContractTypeID__");
            }
            await this.UpdateContractValuesForCreate(contract, lineObject.StatusDeductionRule__);
        }
        async TerminateContract(contract) {
            Log.Info("Terminate Contract");
            const contractStatus = contract.transportHandler.GetValue("ContractStatus__");
            contract.actionToDo = ImportActionToDo.TERMINATE;
            const contractOwnerLogin = contract.transportHandler.GetValue("OwnerLogin__");
            const isOwnerOrAdmin = ValidationScript.currentUser.IsContractOwner(contractOwnerLogin) || ValidationScript.currentUser.IsAdmin;
            if (!isOwnerOrAdmin) {
                throw new LibContractServer(Language.Translate("_You_must_be_an_owner_or_admin_to_terminate_a_contract"));
            }
            if (contractStatus !== Lib.Contract.Status.Active) {
                throw new LibContractServer(Language.Translate("_Only_active_existing_contract_can_be_terminate"));
            }
            const contractState = Number(contract.transportHandler.GetValue("State"));
            if (![90, 100].includes(contractState)) {
                throw new LibContractServer(Language.Translate("_Invalid_record_state"));
            }
            this.UpdateContractValuesForTerminate(contract);
        }
        async UpdateContract(contract, params) {
            Log.Info(`Update Contract ${contract.transportHandler.GetValue("ContractNumber__")}`);
            contract.actionToDo = ImportActionToDo.UPDATE;
            if (!ValidationScript.currentUser.IsAdmin) {
                throw new LibContractServer(Language.Translate("_You_must_be_admin_to_update_a_contract"));
            }
            const contractStatus = contract.transportHandler.GetValue("ContractStatus__");
            if (!this.CONTRACT_UPDATE_ALLOWED_CONTRACT_TO_UPDATE_STATUS.includes(contractStatus)) {
                throw new LibContractServer(Language.Translate("_Only_approved_contract_can_be_update"));
            }
            const contractState = Number(contract.transportHandler.GetValue("State"));
            if (![90, 100].includes(contractState)) {
                throw new LibContractServer(Language.Translate("_Invalid_record_state"));
            }
            if (params && params.contractTypeRequired) {
                contract.specificRequiredProperties.push("ContractTypeID__");
            }
            await this.UpdateContractValuesForUpdate(contract);
        }
        async AmendContract(contract, lineObject, zipEntries, params) {
            Log.Info(`Amend Contract ${contract.transportHandler.GetValue("ContractNumber__")} with nbFiles ${zipEntries ? zipEntries.length : 0}`);
            contract.actionToDo = ImportActionToDo.AMEND;
            const contractOwnerLogin = contract.transportHandler.GetValue("OwnerLogin__");
            const isOwnerOrAdmin = ValidationScript.currentUser.IsContractOwner(contractOwnerLogin) || ValidationScript.currentUser.IsAdmin;
            if (!isOwnerOrAdmin) {
                throw new LibContractServer(Language.Translate("_You_must_be_an_owner_or_admin_to_amend_a_contract"));
            }
            const contractStatus = contract.transportHandler.GetValue("ContractStatus__");
            if (!this.CONTRACT_AMENDMENT_ALLOWED_CONTRACT_TO_AMEND_STATUS.includes(contractStatus)) {
                throw new LibContractServer(Language.Translate("_invalid_contract_to_amend_status"));
            }
            if (!Sys.Helpers.IsEmpty(contract.transportHandler.GetValue("InitiallyExpectedEndDate__"))) {
                throw new LibContractServer(Language.Translate("_contract_with_termination_requested_cannot_be_amend"));
            }
            if (!lineObject.StatusDeductionRule__) {
                throw new LibContractServer(Language.Translate("_invalid_or_missing_status_deduction_rule"));
            }
            if (zipEntries) {
                const { document, attachements } = this.ExtractDocumentAndAttachement(lineObject, zipEntries);
                contract.document = document;
                contract.attachements = attachements;
            }
            if (params && params.contractTypeRequired) {
                contract.specificRequiredProperties.push("ContractTypeID__");
            }
            await this.UpdateContractValuesForAmendment(contract, lineObject.StatusDeductionRule__);
        }
        async ExtractContract(lineObject, header, zipEntries) {
            const contract = {
                attachements: [],
                document: null,
                CSVproperties: {},
                specificRequiredProperties: [],
                actionToDo: null,
                // @ts-ignore
                transportHandler: null,
                CSVLine: {
                    number: -1,
                    text: ""
                }
            };
            this.NormalizeLineObject(lineObject);
            for (const h of header) {
                if (!ContractCSVHandler.CUSTOM_CSV_HEADERS[h] && !this.CONTRACT_PROP_PRIVATE.includes(h)) {
                    contract.CSVproperties[ContractDefinition.lowToNormedFields[h.toLowerCase()] || h] = lineObject[h] || "";
                }
            }
            const transport = this.GetCorrespondingRecord(contract.CSVproperties);
            const isNew = !transport;
            const partialTransport = Process.CreateProcessInstance("P2P - Contract", false, false);
            const fullTransport = isNew ? partialTransport : transport;
            contract.transportHandler = new ContractPartialTransportHandler(fullTransport, partialTransport);
            if (!isNew) {
                contract.transportHandler.partial.SetValue("RuidEx", contract.transportHandler.GetValue("RuidEx"));
            }
            const params = await Lib.Contract.Configuration.GetContractParameters(isNew ? contract.CSVproperties.CompanyCode__ : contract.transportHandler.GetValue("CompanyCode__"), contract.transportHandler);
            if (isNew) {
                await this.NewContract(contract, lineObject, zipEntries, params);
            }
            else if (params.enableImportAmendAndTerminateContract) {
                if (Sys.Helpers.String.ToBoolean(lineObject.TerminationRequested__)) {
                    await this.TerminateContract(contract);
                }
                else if (Sys.Helpers.String.ToBoolean(lineObject.UpdateAsAdminRequested__)) {
                    await this.UpdateContract(contract, params);
                }
                else {
                    await this.AmendContract(contract, lineObject, zipEntries, params);
                }
            }
            else {
                throw new LibContractServer(Language.Translate("_Contract_Already_Exists"));
            }
            return contract;
        }
        CheckPropertiesCharacterAllowed(properties) {
            const CheckCharacterAllowed = (prop) => {
                for (const c of prop) {
                    if (!this.CONTRACT_PROP_CHARACTER_ALLOWED.includes(c)) {
                        throw new LibContractServer(Language.Translate("_contract_attr_character_not_allowed", true, prop));
                    }
                }
            };
            for (const key in properties) {
                CheckCharacterAllowed(key);
            }
        }
        static ExtractDate(date, now) {
            var _a;
            now || (now = new Date());
            if (((_a = date === null || date === void 0 ? void 0 : date.toUpperCase()) === null || _a === void 0 ? void 0 : _a.trim()) === "NOW()") {
                return now;
            }
            return Sys.Helpers.Date.ISOSTringToDate(date);
        }
        CheckDate(dateStr) {
            if (!dateStr) {
                return;
            }
            const date = ContractCSVHandler.ExtractDate(dateStr);
            if (!date || isNaN(date.getTime())) {
                throw new LibContractServer(Language.Translate("_invalid_date_format", true, dateStr));
            }
        }
        CheckDates(CSVProperties, fields) {
            for (const field of fields) {
                this.CheckDate(CSVProperties[field]);
            }
        }
        CheckOutOfAmountBehavior(properties) {
            var _a;
            if ("OutOfAmountBehavior__" in properties) {
                properties["OutOfAmountBehavior__"] || (properties["OutOfAmountBehavior__"] = Lib.Spending.Contract.OutOfAmountBehavior.Ignore);
                const requestedOutOfAmountBehavior = (_a = properties["OutOfAmountBehavior__"]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                switch (requestedOutOfAmountBehavior) {
                    case Lib.Spending.Contract.OutOfAmountBehavior.Ignore.toLowerCase():
                    case Lib.Spending.Contract.OutOfAmountBehavior.Block.toLowerCase():
                        return;
                    default:
                        throw new LibContractServer(Language.Translate("_invalid_OutOfAmountBehavior_input", true, requestedOutOfAmountBehavior));
                }
            }
        }
        NormalizeLineObject(lineObject) {
            var _a;
            if (lineObject["OutOfAmountBehavior__"]) {
                const OutOfAmountBehaviorMapping = {
                    [Lib.Spending.Contract.OutOfAmountBehavior.Ignore.toLowerCase()]: Lib.Spending.Contract.OutOfAmountBehavior.Ignore,
                    [Lib.Spending.Contract.OutOfAmountBehavior.Block.toLowerCase()]: Lib.Spending.Contract.OutOfAmountBehavior.Block
                };
                lineObject["OutOfAmountBehavior__"] = OutOfAmountBehaviorMapping[lineObject["OutOfAmountBehavior__"].toLowerCase()] || lineObject["OutOfAmountBehavior__"];
            }
            const StatusDeductionRuleMapping = {
                [Lib.Contract.Management.StatusDeductionRule.AmendedContract.toLowerCase()]: Lib.Contract.Management.StatusDeductionRule.AmendedContract,
                [Lib.Contract.Management.StatusDeductionRule.FinalStatus.toLowerCase()]: Lib.Contract.Management.StatusDeductionRule.FinalStatus,
                [Lib.Contract.Management.StatusDeductionRule.ByWorkflow.toLowerCase()]: Lib.Contract.Management.StatusDeductionRule.ByWorkflow,
            };
            lineObject["StatusDeductionRule__"] = StatusDeductionRuleMapping[(_a = lineObject["StatusDeductionRule__"]) === null || _a === void 0 ? void 0 : _a.toLowerCase()];
        }
        CheckRequiredProperties(properties, requiredProps, actionToDo) {
            const missingProperties = this.GetMissingRequiredProperties(properties, requiredProps);
            if (missingProperties.length > 0) {
                const errorMsg = this.ERROR_REQUIRED_PROPERTIES.MissingColumn[actionToDo];
                throw new LibContractServer(Language.Translate(errorMsg, true, JSON.stringify(missingProperties)));
            }
            const emptyProperties = this.GetEmptyRequiredProperties(properties, requiredProps);
            this.HandleEmptyRequiredPropertiesError(emptyProperties, actionToDo);
        }
        GetMissingRequiredProperties(properties, requiredProps) {
            let missingProperties = [];
            for (const requiredProp of requiredProps) {
                if (!properties.hasOwnProperty(requiredProp)) {
                    missingProperties.push(requiredProp);
                }
            }
            return missingProperties;
        }
        GetEmptyRequiredProperties(properties, requiredProps) {
            let emptyProperties = [];
            for (const requiredProp of requiredProps) {
                if (properties.hasOwnProperty(requiredProp) && !properties[requiredProp]) {
                    emptyProperties.push(requiredProp);
                }
            }
            return emptyProperties;
        }
        CheckPropWithExpectedValue(properties, requiredProps, transportHandler, actionToDo) {
            let missingProperties = [];
            for (const requiredProp of requiredProps) {
                if (requiredProp in properties && !properties[requiredProp] ||
                    !(requiredProp in properties) && transportHandler.IsNullOrEmpty(requiredProp)) {
                    missingProperties.push(requiredProp);
                }
            }
            this.HandleEmptyRequiredPropertiesError(missingProperties, actionToDo);
        }
        HandleEmptyRequiredPropertiesError(emptyProperties, actionToDo) {
            if (emptyProperties.length > 0) {
                const errorMsg = this.ERROR_REQUIRED_PROPERTIES.EmptyColumn[actionToDo];
                throw new LibContractServer(Language.Translate(errorMsg, true, JSON.stringify(emptyProperties)));
            }
        }
        async ResolveCreationFieldDependencies(fields) {
            return await Lib.Contract.ResolveCreationFieldDependencies(fields);
        }
        async ResolveUpdateFieldDependencies(propToUpdate, contract) {
            if ("OwnerLogin__" in propToUpdate) {
                propToUpdate["OwnerNiceName__"] = await Lib.Contract.GetUserName(propToUpdate.OwnerLogin__);
            }
            if ("SignatureDesignerLogin__" in propToUpdate) {
                propToUpdate["SignatureDesignerNiceName__"] = await Lib.Contract.GetUserName(propToUpdate.SignatureDesignerLogin__);
            }
            if ("ContractTypeID__" in propToUpdate) {
                if (propToUpdate.ContractTypeID__) {
                    propToUpdate["ContractType__"] = await Lib.Contract.GetContractTypeName(contract.transportHandler.GetValue("CompanyCode__"), propToUpdate.ContractTypeID__);
                }
                else {
                    propToUpdate["ContractType__"] = "";
                }
            }
            if ("Currency__" in propToUpdate) {
                const currentCurrency = contract.transportHandler.GetValue("Currency__");
                if (currentCurrency && propToUpdate.Currency__ !== currentCurrency) {
                    throw new LibContractServer(Language.Translate("_Currency is only editable if empty"));
                }
                if (propToUpdate.Currency__) {
                    await Lib.Contract.CheckCurrencyExist(contract.transportHandler.GetValue("CompanyCode__"), propToUpdate.Currency__);
                }
            }
        }
        CSVLineObjectIsEmpty(lineObject) {
            if (!lineObject) {
                return true;
            }
            for (const h in lineObject) {
                if (!Sys.Helpers.IsFunction(lineObject[h])) {
                    if (lineObject[h]) {
                        return false;
                    }
                }
            }
            return true;
        }
        async ExtractContracts(csvReader, zipFile) {
            const idProps = [...new Set(this.IDENTIFICATIONS_PROPS.flat())];
            const makeIdKey = (contract) => idProps
                .map((prop) => contract.transportHandler.GetValue(prop))
                .join("<!>");
            const contractIdKeys = new Set();
            const zipEntries = (zipFile === null || zipFile === void 0 ? void 0 : zipFile.GetEntries(true, true)) || null;
            const contracts = [];
            const errors = [];
            const header = csvReader.GetHeadersObject();
            let lineCount = 0;
            let line = csvReader.GetNextLine();
            while (line !== null) {
                lineCount++;
                const lineObject = csvReader.GetCurrentLineObject();
                if (!this.CSVLineObjectIsEmpty(lineObject)) {
                    try {
                        Lib.P2P.Timeout.SetRemainingTime(180);
                        if (contracts.length + errors.length >= ContractCSVHandler.NB_CSV_LINES_MAX) {
                            throw new LibContractServer(Language.Translate("_ignored_csv_lines_nb_line_max_reached", false, ContractCSVHandler.NB_CSV_LINES_MAX));
                        }
                        const contract = await this.ExtractContract(lineObject, header, zipEntries);
                        const idKey = makeIdKey(contract);
                        if (contractIdKeys.has(idKey)) {
                            throw new LibContractServer(Language.Translate("_contract_must_be_concerned_by_single_CSV_line"));
                        }
                        contractIdKeys.add(idKey);
                        // eslint-disable-next-line no-loop-func
                        contract.CSVLine = {
                            number: lineCount,
                            text: csvReader.GetCurrentLineArray().join(", ")
                        };
                        contracts.push(contract);
                    }
                    catch (e) {
                        if (e instanceof LibContractServer) {
                            Log.Error(`ExtractContract: on line ${lineCount}. Details : `, e.originMessage);
                            errors.push({
                                CSVLineNumber: lineCount,
                                CSVLineText: csvReader.GetCurrentLineArray().join(", "),
                                ErrorStatus: e.originMessage,
                                originAction: null
                            });
                        }
                        else {
                            Log.Error(`ExtractContract: Technical error on line ${lineCount}. Details : `, JSON.stringify(e));
                            errors.push({
                                CSVLineNumber: lineCount,
                                CSVLineText: csvReader.GetCurrentLineArray().join(", "),
                                ErrorStatus: Language.Translate("_technical_error"),
                                originAction: null
                            });
                        }
                    }
                }
                line = csvReader.GetNextLine();
            }
            Lib.P2P.Timeout.SetRemainingTime(180);
            return {
                contracts,
                csvErrors: errors,
                nbContractInError: errors.length,
                nbContractToCreate: contracts.reduce((tot, c) => c.actionToDo === ImportActionToDo.CREATE ? tot + 1 : tot, 0),
                nbContractToUpdate: contracts.reduce((tot, c) => c.actionToDo === ImportActionToDo.UPDATE ? tot + 1 : tot, 0),
                nbContractToAmend: contracts.reduce((tot, c) => c.actionToDo === ImportActionToDo.AMEND ? tot + 1 : tot, 0),
                nbContractToTerminate: contracts.reduce((tot, c) => c.actionToDo === ImportActionToDo.TERMINATE ? tot + 1 : tot, 0),
                fileType: zipFile ? CSVFileType.ZIP : CSVFileType.CSV
            };
        }
        FindZipEntries(zipEntries, fullPath) {
            for (const zipEntry of zipEntries) {
                if (zipEntry.GetFullPath().toUpperCase() === fullPath.toUpperCase()) {
                    return zipEntry;
                }
            }
            return null;
        }
        convertFilePath(filePath) {
            return filePath.replace(/\\/g, "\\")
                .replace(/^\.\//, "")
                .replace(/\//g, "\\");
        }
    }
    ContractCSVHandler.NB_ATTACHMENT_BY_CONTRAT_MAX = 11;
    ContractCSVHandler.NB_CSV_LINES_MAX = 1000;
    ContractCSVHandler.CUSTOM_CSV_HEADERS = {};
    (() => {
        for (let i = 0; i < ContractCSVHandler.NB_ATTACHMENT_BY_CONTRAT_MAX; i++) {
            ContractCSVHandler.CUSTOM_CSV_HEADERS[ContractCSVHandler.GetCSVHeaderAttachement(i)] = true;
        }
        ContractCSVHandler.CUSTOM_CSV_HEADERS[ContractCSVHandler.GetCSVHeaderDocument()] = true;
        ContractCSVHandler.CUSTOM_CSV_HEADERS[ContractCSVHandler.GetCSVHeaderContractStatus()] = true;
    })();
    ValidationScript.ContractCSVHandler = ContractCSVHandler;
    class Main {
        constructor(CSVHandler) {
            this.VARIABLE_PROP = Lib.Contract.Management.VARIABLE_PROP;
            this.IMPORT_CSV_FILE_ENTRY = "contracts.csv";
            this.CSVHandler = CSVHandler;
        }
        CreateContractInDB(contract) {
            var _a;
            const transport = contract.transportHandler.full.transport;
            const vars = transport.GetUninheritedVars();
            vars.AddValue_String("FromContractManagement__", true, true);
            if (contract.document) {
                const anAttach = transport.AddAttachEx(contract.document.zipFile.GetFile());
                const attVars = anAttach.GetVars();
                attVars.AddValue_String("AttachToProcess", "1", true);
                attVars.AddValue_String("AttachManagement", "REF_COPY", true);
                attVars.AddValue_String("AttachOutputName", contract.document.zipFile.GetFileName(), true);
            }
            else {
                Log.Info("No Document");
            }
            Log.Info(`Add ${contract.attachements.length} Attachents`);
            (_a = contract.attachements) === null || _a === void 0 ? void 0 : _a.forEach((file) => {
                const anAttach = transport.AddAttachEx(file.zipFile.GetFile());
                const attVars = anAttach.GetVars();
                attVars.AddValue_String("AttachManagement", "REF_COPY", true);
                attVars.AddValue_String("AttachOutputName", file.zipFile.GetFileName(), true);
            });
            transport.Process();
            if (transport.GetLastError()) {
                Log.Error("Can't save transport " + transport.GetLastErrorMessage());
                throw new Error(transport.GetLastErrorMessage());
            }
        }
        SendEmailNotification(login, template, backupUserAsCC, customTags) {
            //if you change this structure, plz update the sample in Lib_Contract_Management_Customization_Server
            const options = {
                userId: login,
                template: template,
                fromName: "_EskerContractManagementFromName",
                backupUserAsCC: !!backupUserAsCC,
                sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
                customTags: customTags
            };
            const doSendNotif = Sys.Helpers.TryCallFunction("Lib.Contract.Management.Customization.Server.OnSendEmailNotification", options);
            if (doSendNotif !== false) {
                Lib.P2P.EmailNotification.SendEmailNotification(options);
            }
        }
        HandleToCreate(contract) {
            this.CreateContractInDB(contract);
        }
        HandleToUpdate(contract) {
            const notificationsManager = new Lib.P2P.Notification.Server.ServerManager("P2P - Contract", "OriginalContractRuidex__", contract.transportHandler);
            notificationsManager.LoadNotifications();
            notificationsManager.UpdateFromFormData();
            notificationsManager.SaveNotifications();
            if (notificationsManager.HasNotificationInError()) {
                const customTag = {
                    validationURL__: `${contract.transportHandler.GetValue("ValidationUrl")}&backpanel=${Lib.Contract.MenuItem.TermsAndNotifications}`,
                    ContractNumber__: contract.transportHandler.GetValue("ContractNumber__"),
                    Name__: contract.transportHandler.GetValue("Name__")
                };
                this.SendEmailNotification(ValidationScript.currentUser.Login, "Contract_Email_NotifErrorNotification.htm", undefined, customTag);
            }
            contract.transportHandler.partial.transport.ResumeWithActionAsync("SaveChanges");
        }
        HandleToTerminate(contract) {
            contract.transportHandler.partial.transport.ResumeWithActionAsync("UpdateContract");
        }
        HandleToAmend(contract) {
            var _a;
            const newTransport = Process.CreateProcessInstance("P2P - Contract", false, false);
            const vars = newTransport.GetUninheritedVars();
            vars.AddValue_String("FromContractManagement__", true, true);
            vars.AddValue_String("PreviousContractRUIDEX__", contract.transportHandler.GetValue("RuidEx"), true);
            vars.AddValue_String("ContractStatus__", contract.transportHandler.GetValue("ContractStatus__"), true);
            vars.AddValue_String("RequesterNiceName__", ValidationScript.currentUser.DisplayName, true);
            vars.AddValue_String("RequesterLogin__", ValidationScript.currentUser.Login, true);
            const updatedProps = {};
            for (const prop of contract.transportHandler.propsUpdated) {
                updatedProps[prop] = contract.transportHandler.full.transport.GetUninheritedVars().GetValue_String(prop, 0);
            }
            newTransport.GetExternalVars().AddValue_String("ContractManagement_Amendment_UpdatedProperties__", JSON.stringify(updatedProps), true);
            vars.AddValue_String("FromContractManagement__", true, true);
            if (contract.document) {
                const anAttach = newTransport.AddAttachEx(contract.document.zipFile.GetFile());
                const attVars = anAttach.GetVars();
                attVars.AddValue_String("AttachToProcess", "1", true);
                attVars.AddValue_String("AttachManagement", "REF_COPY", true);
                attVars.AddValue_String("AttachOutputName", contract.document.zipFile.GetFileName(), true);
            }
            else {
                Log.Info("No Document");
            }
            Log.Info(`Add ${contract.attachements.length} Attachents`);
            (_a = contract.attachements) === null || _a === void 0 ? void 0 : _a.forEach((file) => {
                const anAttach = newTransport.AddAttachEx(file.zipFile.GetFile());
                const attVars = anAttach.GetVars();
                attVars.AddValue_String("AttachManagement", "REF_COPY", true);
                attVars.AddValue_String("AttachOutputName", file.zipFile.GetFileName(), true);
            });
            newTransport.Process();
            if (newTransport.GetLastError()) {
                throw new Error(newTransport.GetLastErrorMessage());
            }
        }
        HandleContractsToDoAction(contracts) {
            const errors = [];
            for (const contract of contracts) {
                Lib.P2P.Timeout.SetRemainingTime(180);
                try {
                    switch (contract.actionToDo) {
                        case ImportActionToDo.CREATE:
                            this.HandleToCreate(contract);
                            break;
                        case ImportActionToDo.UPDATE:
                            this.HandleToUpdate(contract);
                            break;
                        case ImportActionToDo.TERMINATE:
                            this.HandleToTerminate(contract);
                            break;
                        case ImportActionToDo.AMEND:
                            this.HandleToAmend(contract);
                            break;
                        default:
                            break;
                    }
                }
                catch (e) {
                    errors.push({
                        CSVLineNumber: contract.CSVLine.number,
                        CSVLineText: contract.CSVLine.text,
                        ErrorStatus: "" + e,
                        originAction: contract.actionToDo
                    });
                }
            }
            Lib.P2P.Timeout.SetRemainingTime(180);
            return errors;
        }
        GetZipFileAndCSVReader() {
            const attachExt = Attach.GetExtension(0);
            switch (attachExt.toLowerCase()) {
                case ".zip":
                    const zipFile = Attach.GetCompressedFile(0);
                    const dataEntry = zipFile === null || zipFile === void 0 ? void 0 : zipFile.GetEntryByFullPath(this.IMPORT_CSV_FILE_ENTRY);
                    const dataFile = dataEntry === null || dataEntry === void 0 ? void 0 : dataEntry.GetFile();
                    const csvContent = dataFile === null || dataFile === void 0 ? void 0 : dataFile.GetContent();
                    if (!csvContent) {
                        throw new LibContractServer(Language.Translate("_compressed_file_does_not_contain_a_valid_csv", false, this.IMPORT_CSV_FILE_ENTRY));
                    }
                    const csvReaderZip = Sys.Helpers.CSVReader.CreateInstance(null, null, csvContent);
                    csvReaderZip.ReturnSeparator = "\n";
                    csvReaderZip.GuessSeparator();
                    return {
                        csvReader: csvReaderZip,
                        zipFile
                    };
                case ".csv":
                    const csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
                    csvReader.ReturnSeparator = "\n";
                    csvReader.GuessSeparator();
                    return {
                        csvReader,
                        zipFile: null
                    };
                default:
                    throw new LibContractServer(Language.Translate("_Invalid_file_extension", true, attachExt));
            }
        }
        async ExtractInputFileData() {
            const nbAttach = Attach.GetNbAttach();
            if (nbAttach !== 1) {
                throw new LibContractServer(Language.Translate("_one_zip_or_one_csv_file_are_expected"));
            }
            const { zipFile, csvReader } = this.GetZipFileAndCSVReader();
            return await this.CSVHandler.ExtractContracts(csvReader, zipFile);
        }
        SetContractsError(csvErrors) {
            const uniqueErrorsStatus = new Set();
            const uniqueErrors = [];
            const errors = [];
            for (const error of csvErrors) {
                if (uniqueErrorsStatus.has(error.ErrorStatus)) {
                    errors.push(error);
                }
                else {
                    uniqueErrors.push(error);
                    uniqueErrorsStatus.add(error.ErrorStatus);
                }
            }
            Variable.SetValueAsString(this.VARIABLE_PROP.ContractsError__, JSON.stringify(uniqueErrors
                .concat(errors)
                .filter((_, i) => i < Lib.Contract.Management.MAXIMUM_NB_CONTRACT_ERRORS_DISPLAYED)));
        }
        SetProcessExtractedData(extractedData) {
            Variable.SetValueAsString(this.VARIABLE_PROP.Error__, "");
            this.SetContractsError(extractedData.csvErrors);
            const nbContract = extractedData.nbContractInError +
                extractedData.nbContractToCreate +
                extractedData.nbContractToUpdate +
                extractedData.nbContractToAmend +
                extractedData.nbContractToTerminate;
            Data.SetValue("NbContract__", nbContract);
            Data.SetValue("NbContractInError__", extractedData.nbContractInError);
            Data.SetValue("NbContractToImport__", extractedData.nbContractToCreate);
            Data.SetValue("NbContractImported__", 0);
            Data.SetValue("NbContractToUpdate__", extractedData.nbContractToUpdate);
            Data.SetValue("NbContractUpdated__", 0);
            Data.SetValue("NbContractToAmend__", extractedData.nbContractToAmend);
            Data.SetValue("NbContractAmended__", 0);
            Data.SetValue("NbContractToTerminate__", extractedData.nbContractToTerminate);
            Data.SetValue("NbContractTerminated__", 0);
            Data.SetValue("FileType__", extractedData.fileType);
        }
        SetProcessSaveData(extractedData, saveErrors, contracts) {
            this.SetContractsError([...saveErrors, ...extractedData.csvErrors]);
            const createError = saveErrors.reduce((tot, c) => c.originAction === ImportActionToDo.CREATE ? tot + 1 : tot, 0);
            const updatedError = saveErrors.reduce((tot, c) => c.originAction === ImportActionToDo.UPDATE ? tot + 1 : tot, 0);
            const amendedError = saveErrors.reduce((tot, c) => c.originAction === ImportActionToDo.AMEND ? tot + 1 : tot, 0);
            const terminateError = saveErrors.reduce((tot, c) => c.originAction === ImportActionToDo.TERMINATE ? tot + 1 : tot, 0);
            Data.SetValue("NbContractToImport__", 0);
            Data.SetValue("NbContractToTerminate__", 0);
            Data.SetValue("NbContractToUpdate__", 0);
            Data.SetValue("NbContractToAmend__", 0);
            Data.SetValue("NbContractInError__", extractedData.nbContractInError + saveErrors.length);
            Data.SetValue("NbContractTerminated__", extractedData.nbContractToTerminate - terminateError);
            Data.SetValue("NbContractUpdated__", extractedData.nbContractToUpdate - updatedError);
            Data.SetValue("NbContractAmended__", extractedData.nbContractToAmend - amendedError);
            Data.SetValue("NbContractImported__", extractedData.nbContractToCreate - createError);
        }
        async ActionCheckInputFile() {
            const extractedData = await this.ExtractInputFileData();
            this.SetProcessExtractedData(extractedData);
            Data.SetValue("Status__", ProcessStatus.ToApprove);
            Process.PreventApproval();
        }
        async ActionImport() {
            Data.SetValue("ImportDateTime__", new Date());
            const extractedData = await this.ExtractInputFileData();
            this.SetProcessExtractedData(extractedData);
            const saveErrors = this.HandleContractsToDoAction(extractedData.contracts);
            this.SetProcessSaveData(extractedData, saveErrors, extractedData.contracts);
            Data.SetValue("Status__", ProcessStatus.Imported);
            Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
        }
        ActionCancel() {
            Data.SetValue("ImportDateTime__", new Date());
            Data.SetValue("NbContractToImport__", 0);
            Data.SetValue("NbContractImported__", 0);
            Data.SetValue("NbContractToUpdate__", 0);
            Data.SetValue("NbContractUpdated__", 0);
            Data.SetValue("NbContractToAmend__", 0);
            Data.SetValue("NbContractAmended__", 0);
            Data.SetValue("NbContractToTerminate__", 0);
            Data.SetValue("NbContractTerminated__", 0);
            Data.SetValue("Status__", ProcessStatus.Canceled);
            Data.SetValue("State", 300);
        }
        SendEmailImportErrorNotification() {
            this.SendEmailNotification(ValidationScript.currentUser.Login, "Contract_Email_ImportError.htm");
        }
        async ActionHandleInboundChannel() {
            Data.SetValue("ImportDescription__", Language.Translate("_ImportCreatedBySFTPInboundChannel"));
            if (Data.GetValue("Status__") !== "Draft") {
                return;
            }
            const extractedData = await this.ExtractInputFileData();
            if (extractedData.csvErrors.length === 0) {
                const saveErrors = this.HandleContractsToDoAction(extractedData.contracts);
                this.SetProcessSaveData(extractedData, saveErrors, extractedData.contracts);
                if (saveErrors.length) {
                    this.SendEmailImportErrorNotification();
                }
                Data.SetValue("Status__", ProcessStatus.Imported);
                Data.SetValue("ImportDateTime__", new Date());
            }
            else {
                this.SetProcessExtractedData(extractedData);
                Data.SetValue("Status__", ProcessStatus.ToApprove);
                this.SendEmailImportErrorNotification();
                Process.PreventApproval();
            }
        }
        async Start() {
            Log.Info(`ActionName: "${Data.GetActionName()}" ActionType: "${Data.GetActionType()}"`);
            const action = `${Data.GetActionType()}_${Data.GetActionName()}`;
            try {
                switch (action) {
                    case "_":
                        Log.Info("Action Handle InboundChannel");
                        await this.ActionHandleInboundChannel();
                        break;
                    case "approve_check":
                        await this.ActionCheckInputFile();
                        break;
                    case "approve_import":
                        await this.ActionImport();
                        break;
                    case "approve_cancel":
                        this.ActionCancel();
                        break;
                    default:
                        break;
                }
            }
            catch (e) {
                let errorMsg = Language.Translate("_technical_error");
                if (typeof e === "string") {
                    errorMsg = e;
                }
                else {
                    Log.Info("A error occured: ", e);
                }
                // Don't use state 200, because customscript are not re-execute after post back, c-epalle 26/09/2022
                Data.SetValue("ImportDateTime__", new Date());
                Data.SetValue("NbContract__", 0);
                Data.SetValue("NbContractInError__", 0);
                Data.SetValue("NbContractToImport__", 0);
                Data.SetValue("NbContractImported__", 0);
                Data.SetValue("NbContractToUpdate__", 0);
                Data.SetValue("NbContractUpdated__", 0);
                Data.SetValue("NbContractToAmend__", 0);
                Data.SetValue("NbContractAmended__", 0);
                Data.SetValue("NbContractToTerminate__", 0);
                Data.SetValue("NbContractTerminated__", 0);
                Variable.SetValueAsString(this.VARIABLE_PROP.Error__, errorMsg);
                Data.SetValue("Status__", ProcessStatus.Error);
                Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
            }
        }
    }
    ValidationScript.Main = Main;
    async function InitConfiguration() {
        const UserPropertiesValues = await Lib.P2P.UserProperties.QueryValues(Lib.P2P.GetOwner().GetValue("login"));
        const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(UserPropertiesValues.CompanyCode__, { asAdmin: true });
        Sys.Parameters.GetInstance("Contract").Reload(CCValues.DefaultConfiguration__);
    }
    async function PreloadAndStart() {
        const main = new Main(new ContractCSVHandler());
        await InitConfiguration();
        await ValidationScript.currentUser.Ready();
        await main.Start();
    }
    ValidationScript.currentUser = new CUser();
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Lib.P2P.HandleScriptError(PreloadAndStart());
    }
    Sys.Helpers.TryCallFunction("Lib.Contract.Management.Customization.Server.OnValidationScriptEnd");
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map