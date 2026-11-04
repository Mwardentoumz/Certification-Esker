"use strict";
const registrationType = {
    update: "update",
    registration: "registration"
};
// Table column name: Form column name
class MasterData {
    constructor() {
        this._standardMapping = {
            "Vendor_company_extended_properties__": {
                "FirstName__": "FirstName__",
                "LastName__": "LastName__",
                "TaxIdentificationNumber__": "TaxIdentificationNumber__",
                "NumberOfEmployees__": "NumberOfEmployees__",
                "CreationDate__": "CreationDate__",
                "Website__": "Website__",
                "TaxStatus__": "TaxStatus__",
                "CompanyStructure__": "CompanyStructure__",
                "VendorCategory__": "VendorCategory__",
                "PaymentTerms__": "PaymentTermCode__",
                "PaymentMethod__": "PaymentMethodCode__",
                "DiversityClassification__": "DiversityClassification__",
                "DiversityCertificationID__": "DiversityCertificationID__",
                "DiversityCertificationIssuedDate__": "DiversityCertificationIssuedDate__",
                "DiversityCertificationExpirationDate__": "DiversityCertificationExpirationDate__",
                "DefaultItemCategoryID__": "DefaultItemCategoryID__",
                "AddressForBankIsSameAsCompany__": "AddressForBankIsSameAsCompany__",
                "SubForBank__": "SubForBank__",
                "StreetForBank__": "StreetForBank__",
                "ZipCodeForBank__": "ZipCodeForBank__",
                "CityForBank__": "CityForBank__",
                "StateForBank__": "StateForBank__",
                "CountryForBank__": "CountryForBank__",
                "Ecovadis_Integration_ID__": "Ecovadis_Integration_ID__"
            },
            "AP - Bank details__": {
                "BankCountry__": "BankCountry__",
                "AccountHolder__": "BankAccountHolder__",
                "BankAccount__": "BankAccountNumber__",
                "IBAN__": "BankIBAN__",
                "BankKey__": "BankKey__",
                "ControlKey__": "ControlKey__",
                "SWIFT_BICCode__": "SWIFT_BICCode__",
                "Currency__": "Currency__",
                "RoutingCode__": "RoutingCode__"
            },
            "AP - Vendors officers__": {
                "Role__": "Role__",
                "FirstName__": "FirstName__",
                "LastName__": "LastName__",
                "Email__": "Email__"
            },
            "AP - Vendors__": {
                "Name__": "Company__",
                "Sub__": "MailSub__",
                "Street__": "Street__",
                "PostOfficeBox__": "POBox__",
                "PostalCode__": "Zip_Code__",
                "City__": "City__",
                "Region__": "Mail_State__",
                "Country__": "Country__",
                "PhoneNumber__": "Phone_Number__",
                "FaxNumber__": "Fax_Number__",
                "VATNumber__": "TaxID__",
                "DUNSNumber__": "VendorRegistrationDUNSNumber__",
                "DisableUNSPSCThirdPartySynchronization__": {
                    formKey: "RetrieveUNSPSCFromDNB__",
                    // The logic is inverted between DisableUNSPSCThirdPartySynchronization__ and RetrieveUNSPSCFromDNB__
                    transform: (value) => !Sys.Helpers.Data.IsTrue(value)
                },
                "ComplianceRiskIdentifier__": "ComplianceRiskIdentifier__",
                "LifeCycleStatusCode__": "LifeCycleStatusCode__",
                "LifeCycleComment__": "LifeCycleComment__",
                "VendorCategory__": "VendorCategory__"
            },
            "AP - Vendors links__": {},
            "P2P - Vendor UNSPSC__": {
                "UNSPSC__": "Code__",
            }
        };
        //#endregion serializer
    }
    get mapping() {
        const customMapping = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.SetMasterDataMapping", this._standardMapping);
        return customMapping || this._standardMapping;
    }
    GetTableKeys(table) {
        return Object.getOwnPropertyNames(this.mapping[table] || {});
    }
    MapValues(table, cb) {
        const mapping = this.mapping[table] || {};
        const mappingKeys = Object.getOwnPropertyNames(mapping);
        mappingKeys.forEach((key) => {
            const formKey = typeof mapping[key] === "string" ? mapping[key] : mapping[key].formKey;
            const transformFn = typeof mapping[key] === "string" ? undefined : mapping[key].transform;
            cb(formKey, key, transformFn);
        });
    }
    GetMappedFieldValue(fieldValue, transform) {
        if (typeof transform === "function") {
            return transform(fieldValue);
        }
        return fieldValue;
    }
    // eslint-disable-next-line class-methods-use-this
    TranslateHeaderValues(masterDataPane) {
        const query = Process.CreateQueryAsProcessAdmin();
        if (masterDataPane.PaymentTermCode__) {
            // If payment term is not an available value, do not use it as a code but as a 'comment'/free text
            query.Reset();
            query.SetSpecificTable("Country_Payment_Term__");
            query.SetAttributesList("*");
            let queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Code__", masterDataPane.PaymentTermCode__), Sys.Helpers.LdapUtil.FilterEqual("Country__", masterDataPane.Country__));
            queryFilter = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.CustomizePaymentTermQueryFilter", masterDataPane) || queryFilter;
            query.SetFilter(queryFilter.toString());
            if (query.MoveFirst()) {
                if (!query.MoveNextRecord()) {
                    Log.Info(`No record found for payment term code '${masterDataPane.PaymentTermCode__}' and country '${masterDataPane.Country__}'`);
                    masterDataPane.PaymentTerms__ = masterDataPane.PaymentTermCode__;
                    masterDataPane.PaymentTermCode__ = "";
                }
            }
            else {
                Log.Error("MoveFirst failed on 'Country_Payment_Term__': " + query.GetLastErrorMessage());
            }
        }
        if (masterDataPane.PaymentMethodCode__) {
            // If payment method is not an available value, do not use it as a code but as a 'comment'/free text
            query.Reset();
            query.SetSpecificTable("Country_Payment_Method__");
            query.SetAttributesList("*");
            let queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("PaymentMethod__", masterDataPane.PaymentMethodCode__), Sys.Helpers.LdapUtil.FilterEqual("Country__", masterDataPane.Country__));
            queryFilter = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.CustomizePaymentMethodQueryFilter", queryFilter) || queryFilter;
            query.SetFilter(queryFilter.toString());
            if (query.MoveFirst()) {
                if (!query.MoveNextRecord()) {
                    Log.Info(`No record found in Country_Payment_Method__ for custom filter '${queryFilter.toString()}'`);
                    masterDataPane.PaymentMethod__ = masterDataPane.PaymentMethodCode__;
                    masterDataPane.PaymentMethodCode__ = "";
                }
            }
            else {
                Log.Error("MoveFirst failed on 'Country_Payment_Method__': " + query.GetLastErrorMessage());
            }
        }
    }
    //#region reader
    // eslint-disable-next-line class-methods-use-this
    GetSafeValue(fieldName, fieldValue, item = null) {
        const fieldProperties = item ? item.GetProperties(fieldName) : Data.GetProperties(fieldName);
        if (fieldProperties.type === "DATE" && !fieldValue) {
            return "";
        }
        return fieldValue;
    }
    FillHeaderFields(masterDataPane) {
        for (const field of Object.keys(masterDataPane)) {
            Data.SetValue(field, this.GetSafeValue(field, masterDataPane[field]));
        }
    }
    FillTable(tableName, masterDataTable) {
        const table = Data.GetTable(tableName);
        table.SetItemCount(masterDataTable.length);
        for (let i = 0; i < masterDataTable.length; i++) {
            const item = table.GetItem(i);
            for (const field of Object.keys(masterDataTable[i])) {
                if (Object.prototype.hasOwnProperty.call(masterDataTable[i], field)) {
                    item.SetValue(field, this.GetSafeValue(field, masterDataTable[i][field], item));
                }
            }
        }
    }
    FillInterface() {
        const companyCode = Data.GetValue("CompanyCode__");
        const vendorNumber = Data.GetValue("VendorNumber__");
        //#region Header fields
        const headerFields = Sys.Helpers.Clone(Lib.VendorRegistration.Common.HeaderFields);
        const query = Process.CreateQueryAsProcessAdmin();
        query.Reset();
        query.SetSpecificTable("AP - Vendors__");
        query.SetAttributesList(this.GetTableKeys("AP - Vendors__").join(","));
        let queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode));
        query.SetFilter(queryFilter.toString());
        if (query.MoveFirst()) {
            const record = query.MoveNextRecord();
            if (record) {
                const vars = record.GetVars();
                this.MapValues("AP - Vendors__", (formKey, tableKey, transform) => {
                    headerFields[formKey] = this.GetMappedFieldValue(vars.GetValue_String(tableKey, 0), transform);
                });
            }
        }
        query.Reset();
        query.SetSpecificTable("Vendor_company_extended_properties__");
        query.SetAttributesList("*");
        queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode));
        query.SetFilter(queryFilter.toString());
        if (query.MoveFirst()) {
            const record = query.MoveNextRecord();
            if (record) {
                const vars = record.GetVars();
                this.MapValues("Vendor_company_extended_properties__", (formKey, tableKey) => {
                    headerFields[formKey] = vars.GetValue_String(tableKey, 0);
                });
            }
        }
        this.TranslateHeaderValues(headerFields);
        this.FillHeaderFields(headerFields);
        //#endregion Header fields
        //#region AP - Vendors officers__
        const companyOfficersItems = [];
        query.Reset();
        query.SetSpecificTable("AP - Vendors officers__");
        query.SetAttributesList("*");
        queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode));
        query.SetFilter(queryFilter.toString());
        query.SetSortOrder("TableIndex__ ASC");
        if (query.MoveFirst()) {
            let contactId = 0;
            let record = query.MoveNextRecord();
            while (record) {
                const officersItem = {
                    CompanyOfficerID__: contactId
                };
                const vars = record.GetVars();
                this.MapValues("AP - Vendors officers__", (formKey, tableKey) => {
                    officersItem[formKey] = vars.GetValue_String(tableKey, 0);
                });
                companyOfficersItems.push(officersItem);
                record = query.MoveNextRecord();
                contactId++;
            }
        }
        this.FillTable("CompanyOfficersTable__", companyOfficersItems);
        //#endregion AP - Vendors officers__
        //#region AP - Bank details__
        const companyBankItems = [];
        query.Reset();
        query.SetSpecificTable("AP - Bank details__");
        query.SetAttributesList("*");
        queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode));
        query.SetFilter(queryFilter.toString());
        if (query.MoveFirst()) {
            let bankId = 0;
            let record = query.MoveNextRecord();
            while (record) {
                const bankItem = {
                    BankDetailID__: bankId
                };
                const vars = record.GetVars();
                this.MapValues("AP - Bank details__", (formKey, tableKey) => {
                    bankItem[formKey] = vars.GetValue_String(tableKey, 0);
                });
                companyBankItems.push(bankItem);
                record = query.MoveNextRecord();
                bankId++;
            }
        }
        this.FillTable("CompanyBankAccountsTable__", companyBankItems);
        //#endregion AP - Bank details__
        //#region P2P - Vendor UNSPSC__
        const unspscItems = [];
        query.Reset();
        query.SetSpecificTable("P2P - Vendor UNSPSC__");
        query.SetAttributesList("UNSPSC__");
        queryFilter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber), Sys.Helpers.LdapUtil.FilterEqualOrEmpty("CompanyCode__", companyCode));
        query.SetFilter(queryFilter.toString());
        if (query.MoveFirst()) {
            let unspscId = 0;
            let record = query.MoveNextRecord();
            while (record) {
                let unspscItem = {};
                const vars = record.GetVars();
                this.MapValues("P2P - Vendor UNSPSC__", (formKey, tableKey) => {
                    unspscItem[formKey] = vars.GetValue_String(tableKey, 0);
                });
                unspscItems.push(unspscItem);
                record = query.MoveNextRecord();
                unspscId++;
            }
        }
        unspscItems.sort((a, b) => a.Code__.localeCompare(b.Code__));
        this.FillTable("UNSPSCList__", unspscItems);
        //#endregion
        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnFillInterfaceWithMasterData");
    }
    //#endregion reader
    //#region serializer
    static SaveVendorUser(vendor, extraData) {
        if (!extraData) {
            extraData = {};
        }
        extraData.City = Data.GetValue("City__");
        extraData.Company = Data.GetValue("Company__");
        extraData.Country = Data.GetValue("Country__");
        extraData.Faxnumber = Data.GetValue("Fax_Number__");
        extraData.Mailstate = Data.GetValue("Mail_State__");
        extraData.Mailsub = Data.GetValue("MailSub__");
        extraData.Phonenumber = Data.GetValue("Phone_Number__");
        extraData.Street = Data.GetValue("Street__");
        extraData.Pobox = Data.GetValue("POBox__");
        extraData.Zipcode = Data.GetValue("Zip_Code__");
        vendor.SetValues(extraData);
    }
    // eslint-disable-next-line class-methods-use-this
    ModifyFormKeyMappingOnSerialize(formKey) {
        // If 'code' field is not defined but 'comment' field is, adjust mapping to store the 'comment' field.
        if (formKey === "PaymentTermCode__" && Sys.Helpers.IsEmpty(Data.GetValue(formKey)) && !Sys.Helpers.IsEmpty(Data.GetValue("PaymentTerms__"))) {
            formKey = "PaymentTerms__";
        }
        if (formKey === "PaymentMethodCode__" && Sys.Helpers.IsEmpty(Data.GetValue(formKey)) && !Sys.Helpers.IsEmpty(Data.GetValue("PaymentMethod__"))) {
            formKey = "PaymentMethod__";
        }
        return formKey;
    }
    SaveValuesToRecord(table, record) {
        const vendorLinkVars = record.GetVars();
        this.MapValues(table, (formKey, tableKey, transform) => {
            formKey = this.ModifyFormKeyMappingOnSerialize(formKey);
            const fieldProperties = Data.GetProperties(formKey);
            if (!fieldProperties) {
                return;
            }
            const fieldValue = this.GetMappedFieldValue(Data.GetValue(formKey), transform);
            if (fieldProperties.type === "DATE" && fieldValue) {
                vendorLinkVars.AddValue_Date(tableKey, fieldValue, true);
            }
            else if (fieldProperties.type === "BOOL") {
                const boolValue = fieldValue === true || fieldValue === "true" || fieldValue === "1";
                vendorLinkVars.AddValue_String(tableKey, String(boolValue), true);
            }
            else {
                vendorLinkVars.AddValue_String(tableKey, fieldValue, true);
            }
        });
        record.Commit();
        if (record.GetLastError()) {
            Log.Error(`Failure on saving '${table}' record: ${record.GetLastErrorMessage()} (${record.GetLastError()})`);
        }
    }
    SerializeTables(user) {
        const skipSerialize = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnBeforeSerializeMasterData", Sys.Helpers.Clone(this._standardMapping));
        if (skipSerialize === true) {
            Log.Info("Standard serialization of master data is skipped by customization");
            return;
        }
        const companyCode = Data.GetValue("CompanyCode__");
        const vendorNumber = Data.GetValue("VendorNumber__");
        // Synchronize vendor links table
        if (user) {
            const configuration = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetConfigurationForNewlyCreatedVendorUser") || "Default";
            const vendorLinkParameters = {
                CompanyCode__: companyCode,
                VendorNumber__: vendorNumber,
                Configuration__: configuration
            };
            const vendorLinkProperties = Lib.AP.VendorPortal.GetOrCreateVendorLinkRecord(user, vendorLinkParameters, { fillShortLoginPAC: true });
            if (vendorLinkProperties) {
                this.SaveValuesToRecord("AP - Vendors links__", vendorLinkProperties);
            }
        }
        const vendorRecord = Lib.AP.VendorPortal.GetOrCreateVendorRecord(vendorNumber, companyCode);
        if (vendorRecord) {
            const vars = vendorRecord.GetVars();
            const email = Data.GetTable("CompanyOfficersTable__").GetItem(0).GetValue("Email__");
            if (email) {
                vars.AddValue_String("Email__", email, true);
            }
            const vendorCategory = Data.GetValue("VendorCategory__");
            if (vendorCategory) {
                vars.AddValue_String("VendorCategory__", vendorCategory, true);
            }
            // if status code has changed, update the last status change date
            if (vars.GetValue_String("LifeCycleStatusCode__", 0) !== Data.GetValue("LifeCycleStatusCode__")) {
                vars.AddValue_Date("LastLifeCycleStatusChangeDate__", new Date(), true);
            }
            this.SaveValuesToRecord("AP - Vendors__", vendorRecord);
        }
        // Loop through Form table CompanyOfficersTable__ and serialize all content in CT 'AP - Vendors officers__'
        //#region Vendors officers
        const vendorRegistrationOfficersTable = {
            groupKeys: {
                CompanyCode__: companyCode,
                VendorNumber__: vendorNumber
            },
            dataIndexColumn: "TableIndex__",
            data: {}
        };
        const officersTable = Data.GetTable("CompanyOfficersTable__");
        for (let i = 0; i < officersTable.GetItemCount(); i++) {
            const item = officersTable.GetItem(i);
            vendorRegistrationOfficersTable.data[i + 1] = {};
            this.MapValues("AP - Vendors officers__", (formKey, tableKey) => {
                vendorRegistrationOfficersTable.data[i + 1][tableKey] = item.GetValue(formKey);
            });
        }
        Sys.Helpers.Database.SynchronizeCustomTable("AP - Vendors officers__", vendorRegistrationOfficersTable);
        //#endregion Vendors officers
        // Loop through Form table CompanyBankAccountsTable__ and serialize all content in CT 'AP - Bank details__'
        //#region AP - Bank details__
        if (Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.IsBankDetailsSynchronizationDisabled") !== true) {
            const idxSeparator = "#";
            const vendorRegistrationBankDetailsTable = {
                groupKeys: {
                    CompanyCode__: companyCode,
                    VendorNumber__: vendorNumber
                },
                dataIndexes: {
                    columns: ["BankAccount__", "SWIFT_BICCode__", "IBAN__"],
                    separator: idxSeparator
                },
                data: {}
            };
            const bankAccountTable = Data.GetTable("CompanyBankAccountsTable__");
            for (let i = 0; i < bankAccountTable.GetItemCount(); i++) {
                const item = bankAccountTable.GetItem(i);
                // FT-022346: SWIFT_BICCode__ is not mandatory
                if (item.GetValue("BankAccountNumber__")) {
                    const key = `${item.GetValue("BankAccountNumber__")}${idxSeparator}${item.GetValue("SWIFT_BICCode__")}${idxSeparator}${item.GetValue("BankIBAN__")}`;
                    vendorRegistrationBankDetailsTable.data[key] = {};
                    this.MapValues("AP - Bank details__", (formKey, tableKey) => {
                        vendorRegistrationBankDetailsTable.data[key][tableKey] = item.GetValue(formKey);
                    });
                }
            }
            Sys.Helpers.Database.SynchronizeCustomTable("AP - Bank details__", vendorRegistrationBankDetailsTable);
        }
        //#endregion AP - Bank details__
        // serialize some data in CT 'AP - Vendor company extended properties__'
        const companyProperties = Lib.P2P.VendorPortal.GetOrCreateCompanyExtendedProperties(vendorNumber, companyCode);
        if (companyProperties) {
            this.SaveValuesToRecord("Vendor_company_extended_properties__", companyProperties);
        }
        Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnSerializeMasterData", user);
    }
}
const masterDataHandler = new MasterData();
//
// HELPER FUNCTIONS
//
async function SaveVendorUNSPSC() {
    const vendorNumber = Data.GetValue("VendorNumber__");
    const companyCode = Data.GetValue("CompanyCode__");
    if (!vendorNumber || !companyCode) {
        Log.Warn("Cannot save UNSPSC codes: VendorNumber or CompanyCode is missing");
        return;
    }
    const unspscTable = Data.GetTable("UNSPSCList__");
    const itemCount = unspscTable.GetItemCount();
    // Collect UNSPSC codes from form table
    const newUNSPSCs = [];
    for (let i = 0; i < itemCount; i++) {
        const item = unspscTable.GetItem(i);
        const unspscCode = item.GetValue("Code__");
        if (unspscCode) {
            newUNSPSCs.push(unspscCode);
        }
    }
    // Query existing UNSPSC codes for this vendor
    const existingUNSPSCs = await Lib.P2P.UNSPSC.Vendor.QueryUNSPSCFromVendor(vendorNumber, companyCode);
    // Add new UNSPSC codes that don't exist yet
    for (const unspscCode of newUNSPSCs) {
        if (!existingUNSPSCs.some((u) => u.number === unspscCode)) {
            Lib.P2P.UNSPSC.Vendor.AddUNSPSCToVendor(companyCode, vendorNumber, unspscCode);
        }
    }
    // Delete UNSPSC codes that are no longer in the list
    for (const existingCode of existingUNSPSCs) {
        if (!newUNSPSCs.includes(existingCode.number)) {
            Lib.P2P.UNSPSC.Vendor.DeleteUNSPSCFromVendor(companyCode, vendorNumber, existingCode.number);
        }
    }
    Log.Info(`Synchronized ${newUNSPSCs.length} UNSPSC code(s) for vendor ${vendorNumber} and company ${companyCode}`);
}
function GiveReadRightToCurrentContributor() {
    const idx = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
    const currentContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(idx);
    Process.SetRight(currentContributor.login, "read");
    GiveRightOnConversationToContributor(currentContributor);
}
function GiveRightOnConversationToContributor(step, vendorUser) {
    if (Lib.VendorRegistration.Workflow.Controller.GetRoleSequenceIndex("_Vendor") === -1) {
        return;
    }
    if (step.login && step.role !== "_Vendor") {
        const conversationInfoOptions = Lib.P2P.Conversation.Options.GetVendorRegistrationForInternalUser({
            VendorRegistrationUrl__: Variable.GetValueAsString("VendorRegistrationURLInternal")
        });
        const conversationInfo = Lib.P2P.Conversation.InitConversationInfo(conversationInfoOptions);
        const internalUser = Users.GetUserAsProcessAdmin(step.login);
        if (internalUser) {
            const internalUserInfo = Lib.P2P.Conversation.GetBusinessInfoFromInternalUser(internalUser);
            const extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
                BusinessId: internalUserInfo.BusinessId,
                BusinessIdFieldName: internalUserInfo.BusinessIdFieldName,
                OwnerID: internalUserInfo.OwnerID,
                OwnerPB: internalUserInfo.OwnerPB,
                RecipientCompany: Data.GetValue("Company__")
            });
            Variable.SetValueAsString("ConversationId", Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo));
        }
        else {
            Log.Error(`User ${step.login} not found - not added to the conversation`);
        }
    }
    else if (step.login) {
        const conversationInfoOptions = Lib.P2P.Conversation.Options.GetVendorRegistrationForVendorUser({
            VendorRegistrationUrl__: Variable.GetValueAsString("VendorRegistrationURLVendor")
        });
        const internalUser = Users.GetUserAsProcessAdmin(Lib.AP.VendorPortal.GetDefaultApUserLogin());
        const conversationInfo = Lib.P2P.Conversation.InitConversationInfo(conversationInfoOptions);
        if (!vendorUser) {
            vendorUser = Users.GetUserAsProcessAdmin(step.login);
        }
        const vendorInfo = Lib.P2P.Conversation.GetBusinessInfoFromVendorUser(vendorUser);
        const extendedConversationInfo = Lib.P2P.Conversation.ExtendConversationWithBusinessInfo(conversationInfo, {
            BusinessId: vendorInfo.BusinessId,
            BusinessIdFieldName: vendorInfo.BusinessIdFieldName,
            OwnerID: vendorInfo.OwnerID,
            OwnerPB: vendorInfo.OwnerPB,
            RecipientCompany: internalUser ? internalUser.GetValue("Company") : ""
        });
        Variable.SetValueAsString("ConversationId", Conversation.AddParty(Lib.P2P.Conversation.TableName, extendedConversationInfo));
    }
}
function ChangeOwner() {
    const idx = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
    const step = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(idx);
    Process.ChangeOwner(step.login);
    GiveRightOnConversationToContributor(step);
}
function Forward() {
    const idx = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
    const step = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(idx);
    Process.Forward(step.login);
    GiveRightOnConversationToContributor(step);
    Process.LeaveForm();
}
function CheckAutoApprove(checkCurrentContributor) {
    let sequenceStep = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
    const increment = checkCurrentContributor ? 0 : 1;
    const nbSteps = Lib.VendorRegistration.Workflow.Controller.GetNbContributors();
    let validationOwnerID = Data.GetValue("ValidationOwnerID");
    if (Sys.Helpers.IsEmpty(validationOwnerID)) {
        validationOwnerID = Data.GetValue("OwnerID");
    }
    const currentUser = Users.GetUserAsProcessAdmin(validationOwnerID);
    const currentUserLogin = currentUser.GetValue("login");
    let nextContributor = null;
    const role = "_Approver";
    const contributionData = {
        action: "approved",
        date: new Date()
    };
    if (sequenceStep + increment < nbSteps) {
        nextContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(sequenceStep + increment);
        while (nextContributor && nextContributor.role === role
            && (currentUserLogin === nextContributor.login
                || currentUser.IsMemberOf(nextContributor.login)
                || currentUser.IsBackupUserOf(nextContributor.login))) {
            if (checkCurrentContributor && sequenceStep === nbSteps - 1) // Last step of the workflow
             {
                nextContributor = null;
            }
            else {
                Log.Info("Auto approve step " + sequenceStep + " for " + nextContributor.login);
                Lib.VendorRegistration.Workflow.Controller.NextContributor(contributionData);
                GiveReadRightToCurrentContributor();
                sequenceStep = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
                if (!checkCurrentContributor && sequenceStep === nbSteps - 1) // Last step of the workflow
                 {
                    nextContributor = null;
                }
                else {
                    nextContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(sequenceStep + increment);
                }
            }
        }
    }
    return nextContributor;
}
const Parameters = Lib.VendorRegistration.Common.Parameters;
/**
* Helper for ERP integration functions
* Manage the different status of the record: pending, error, valid ERP ack
**/
const ERPIntegrationHelper = {
    /**
    * This function put the invoice in a waiting state for ERP integration.
    **/
    WaitForERPIntegration: function () {
        Log.Info("Vendor Registration - WaitForERPAck");
        // Add an expiration timeout
        const validityDate = new Date();
        // Set the default timeout to 24 hours
        validityDate.setHours(validityDate.getHours() + 24);
        // Call the user exit in case of overridden validity date
        const customValidityDate = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.SetERPWaitingValidityDate", validityDate);
        Data.SetValue("ValidityDateTime", customValidityDate && customValidityDate instanceof Date ? customValidityDate : validityDate);
        Process.SetAutoValidateOnExpiration(true);
        Data.SetValue("ProcessStatus__", "WaitingForERPAck");
        // Wait for ERP ack
        Process.WaitForUpdate();
    },
    IsInError: function () {
        return Boolean(Data.GetValue("ERPPostingError__"));
    },
    ResetError: function () {
        Data.SetValue("ERPPostingError__", "");
    },
    SetRecordInTimeout: function () {
        Data.SetValue("ERPPostingError__", Language.Translate("_ERP integration in timeout"));
        if (Variable.GetValueAsString("ERPIntegrationTimeout") === "") {
            Variable.SetValueAsString("ERPIntegrationTimeout", new Date().toString());
        }
        Data.SetValue("ProcessStatus__", "ToValidate");
    }
};
async function continueVendorRegistrationAfterERPAck() {
    await Lib.VendorRegistration.Workflow.Controller.DoAction("continueAfterERPAck");
}
async function FinishRegistration() {
    // Only replace the guest vendor by newly created SalesAdmin vendor for new registrations
    const user = Users.GetUserAsProcessAdmin(Variable.GetValueAsString("guestUserLogin") || Variable.GetValueAsString("vendorLogin"));
    if (!Lib.VendorRegistration.InternalRequest.IsInternalRequest()) {
        if (Data.GetValue("RegistrationType__") !== registrationType.update) {
            // eslint-disable-next-line max-depth
            if (Variable.GetValueAsString("guestUserLogin")) {
                NotificationHelper.SendEmail("AP-Vendor_RegistrationApprove.htm");
                user.SetValues({
                    AccountLocked: "1",
                    LoginType: 0x01000000 // DeniedInDocMgr
                });
            }
        }
        else {
            MasterData.SaveVendorUser(user);
        }
    }
    Data.SetValue("ProcessStatus__", "Approved");
    // Serialize Form associated tables (Vendor links, Vendor, Officers and Bank details) in CustomTables
    masterDataHandler.SerializeTables(user);
    // Save UNSPSC codes to vendor using Record Manager if the feature is enabled for the company code
    if (await Lib.P2P.UNSPSC.IsEnabledByQuery(Data.GetValue("CompanyCode__"))) {
        await SaveVendorUNSPSC();
    }
    if (Data.GetValue("RegistrationType__") !== registrationType.update) {
        const salesAdminUser = VendorHelper.CreateSalesAdminVendor();
        if (!salesAdminUser) {
            Log.Error("Cannot create Sales Admin vendor account");
            return;
        }
        // It triggers another serialization of Bank details, Officers and Company Extended
        masterDataHandler.SerializeTables(salesAdminUser);
        VendorHelper.UpdateAllOfficersUser();
        const newVendorContributor = {
            login: salesAdminUser.GetValue("Login"),
            role: "_Vendor"
        };
        GiveRightOnConversationToContributor(newVendorContributor, salesAdminUser);
        Process.AddRight(newVendorContributor.login, "read");
        if (Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.DisableWelcomeEmail") !== true) {
            NotificationHelper.SendWelcomeEmail(salesAdminUser);
        }
        NotificationHelper.SendApprovedEmailToCreator();
    }
    // Create child for SDA
    CreateRelatedDocuments();
    // Updates contracts with the newly approved vendor
    await Lib.VendorRegistration.ContractUpdate.RefreshVendorContractsWithRegisteredVendor("approve");
    // Does not forward to anyone, and lets the document be approved and go to the success state.
    const wkfComment = Data.GetValue("Comment__");
    Lib.VendorRegistration.Workflow.Controller.EndWorkflow({ action: "approved", date: new Date(), comment: formatComment(wkfComment) });
    Data.SetValue("Comment__", "");
}
function onExpiration() {
    ERPIntegrationHelper.SetRecordInTimeout();
    const validityDT = Data.GetValue("SubmitDateTime");
    validityDT.setMonth(validityDT.getMonth() + 12);
    Data.SetValue("ValidityDateTime", validityDT);
    Data.SetValue("ProcessStatus__", "ToValidate");
    Process.SetAutoValidateOnExpiration(true);
    Lib.VendorRegistration.VendorExporter.DeleteExportedXMLRedisTransaction();
    const sequenceStep = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
    const currentContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(sequenceStep);
    currentContributor.action = "ERPIntegrationError";
    currentContributor.role = Lib.VendorRegistration.Workflow.Controller.GetRoleAt(sequenceStep);
    currentContributor.date = new Date();
    currentContributor.comment = Language.Translate("_ERP integration in timeout");
    Lib.VendorRegistration.Workflow.Controller.BackTo(sequenceStep, currentContributor);
    Forward();
}
function onCancel() {
    Lib.VendorRegistration.Workflow.Controller.EndWorkflow({ action: "canceled", date: new Date(), comment: Data.GetValue("Comment__") });
    Data.SetValue("State", 300);
    // disable archiving ?
    Process.DisableChecks();
    Process.LeaveForm();
}
function ExportXMLAndWaitAcknowledgment() {
    if (Lib.VendorRegistration.VendorExporter.ExportIfNeeded()) {
        Log.Info("Vendor registration exported");
    }
    else {
        Log.Info("Vendor registration was not exported");
    }
    // Defines the ERP waiting time out
    ERPIntegrationHelper.WaitForERPIntegration();
}
async function Approve(checkCurrentContributor, updateNextContributor) {
    const nextContributor = CheckAutoApprove(checkCurrentContributor);
    if (nextContributor) {
        updateNextContributor();
    }
    else // last approval
     {
        const isGetWarningAction = Data.GetActionName() === "getWarningsToDisplayToApprover";
        const isTinCheckinError = Parameters.IsTINWithOFACCheckEnabled() && !Lib.VM.FON.TINNameMatchingSuccess();
        const isOFACFONInError = Parameters.IsTINWithOFACCheckEnabled() && Lib.VM.FON.GetOFACFONTechnicalError();
        const isSisIDInError = Parameters.IsSisIDEnabled() && Variable.GetValueAsString("IsThereIBANErrorsOrWarnings").toLowerCase() === "true";
        const isFONBankCheckInError = Parameters.IsUSBankCheckEnabled() && Variable.GetValueAsString("IsFONBankRefErrorsOrWarnings").toLowerCase() === "true";
        const preventAutoApproveOnFONResult = isGetWarningAction && (isTinCheckinError || isOFACFONInError || isSisIDInError || isFONBankCheckInError);
        if (requiredFieldsAreEmpty() || preventAutoApproveOnFONResult) {
            Process.PreventApproval();
            return;
        }
        if (Parameters.IsERPIntegrationParameterEnabled()) { /** Vendor information synchronization with ERP */
            ExportXMLAndWaitAcknowledgment();
        }
        else { /** No ERP connection */
            await FinishRegistration();
        }
    }
}
function UpdateOfficers() {
    Process.PreventApproval();
    let nbAdded = 0;
    const newOfficer = JSON.parse(Variable.GetValueAsString("newOfficer"));
    if (newOfficer) {
        let item = Sys.Helpers.Data.FindTableItem("CompanyOfficersTable__", (item) => item.GetValue("Email__") === newOfficer.Email);
        if (!item) {
            item = Data.GetTable("CompanyOfficersTable__").AddItem();
            item.SetValue("Role__", newOfficer.Role);
            item.SetValue("FirstName__", newOfficer.FirstName);
            item.SetValue("LastName__", newOfficer.LastName);
            item.SetValue("Email__", newOfficer.Email);
            nbAdded++;
        }
    }
    Log.Info(`${nbAdded} new officers added`);
}
/***
 * @function requiredFieldsAreEmpty
 * @returns {Boolean} true if required form fields are empty and process should not be approved, false otherwise
 */
function requiredFieldsAreEmpty() {
    const skipValidation = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.SkipRequiredFieldsValidation");
    if (skipValidation === true) {
        Data.SetRequired("CompanyCode__", false);
        Data.SetRequired("VendorNumber__", false);
        return false;
    }
    let returnValue = false;
    if (!Data.GetValue("CompanyCode__") && Parameters.IsVendorManagementCompanyCodeMandatory()) {
        Data.SetRequired("CompanyCode__", true);
        returnValue = true;
    }
    if (!Data.GetValue("VendorNumber__") && !Parameters.IsVendorERPConnectionEnabled()) { /** If we don't synchronize vendors with the ERP, we need a vendor number (it won't be provided by the ERP) */
        Data.SetRequired("VendorNumber__", true);
        returnValue = true;
    }
    return returnValue;
}
// Forward to main account to have access to master data and workflow rules
// Do not forget to forward back to the correct user in specified action!
function ForwardToMainAccountAndCallAction(actionToCall, isAsync = false) {
    const defaultMainAccountUser = Lib.AP.VendorPortal.GetDefaultApUserLogin();
    Log.Info("Forwarding to main account: " + defaultMainAccountUser);
    Process.Forward(defaultMainAccountUser);
    Log.Info("Calling action " + actionToCall);
    Process.RecallScript(actionToCall, isAsync);
}
function GetVendorLinksInfos() {
    const vendorLogin = Variable.GetValueAsString("vendorShortLogin");
    const query = Process.CreateQueryAsProcessAdmin();
    query.Reset();
    query.SetSpecificTable("AP - Vendors links__");
    query.SetAttributesList("CompanyCode__,Number__,ShortLogin__");
    query.SetFilter(`(|(ShortLogin__=${vendorLogin})(ShortLoginPAC__=${vendorLogin}))`);
    query.MoveFirst();
    const record = query.MoveNextRecord();
    if (record) {
        const recordVars = record.GetVars();
        const companyCode = recordVars.GetValue_String("CompanyCode__", 0);
        let vendorNumber = recordVars.GetValue_String("Number__", 0);
        // Allows customization of the vendor number retrieved from the vendor links table.
        vendorNumber = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.CustomizeVendorNumberFromVendorLinks", recordVars) || vendorNumber;
        return {
            companyCode: companyCode,
            vendorNumber: vendorNumber
        };
    }
    Log.Error("Could not retrieve vendor links for vendor " + vendorLogin);
    return { companyCode: null, vendorNumber: null };
}
function GetInformationsFromSupplierInquiry(ruidEx) {
    if (!ruidEx) {
        Log.Error("Could not retrieve SDA record without RUIDEX");
        return { companyCode: null, vendorNumber: null };
    }
    const ruidexParts = ruidEx.split(".");
    const query = Process.CreateQueryAsProcessAdmin();
    query.Reset();
    query.SetSpecificTable(ruidexParts[0]);
    query.SetAttributesList("CF_VI_CompanyCode__,CF_VI_VendorNumber__");
    query.SetFilter(`(MSNEX=${ruidexParts[1]})`);
    query.SetOptions(0x00210000 | 0x00020000);
    query.SetOptionEx("FastSearch=1");
    query.MoveFirst();
    const record = query.MoveNextRecord();
    if (record) {
        const vars = record.GetVars();
        return {
            companyCode: vars.GetValue_String("CF_VI_CompanyCode__", 0),
            vendorNumber: vars.GetValue_String("CF_VI_VendorNumber__", 0)
        };
    }
    Log.Error("Could not retrieve SDA record " + ruidEx);
    return { companyCode: null, vendorNumber: null };
}
function CheckIbanFormat() {
    const bankDetailsTable = Data.GetTable("CompanyBankAccountsTable__");
    let isValid = true;
    for (let i = 0; i < bankDetailsTable.GetItemCount(); i++) {
        const item = bankDetailsTable.GetItem(i);
        const country = item.GetValue("BankCountry__");
        if (country && Sys.Helpers.Iban.IsIbanCountry(country)) {
            const iban = item.GetValue("BankIBAN__");
            const isIbanValid = iban ? Sys.Helpers.Iban.IsValid(iban, country) : true;
            isValid = isValid && isIbanValid;
            if (!isIbanValid) {
                item.SetError("BankIBAN__", "_invalid iban format");
                Log.Error(`Invalid iban format for country ${country}: ${iban}`);
            }
        }
    }
    return isValid;
}
function CheckVATFormat() {
    const VATNumber = Data.GetValue("TaxID__");
    const country = Data.GetValue("Country__");
    const isNonBusinessEntity = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.IsNonBusinessEntity") || false;
    if (!Sys.Helpers.VAT.IsVATCountry(country) || Data.IsNullOrEmpty("TaxID__") || isNonBusinessEntity) {
        return true;
    }
    const vatInfo = Sys.Helpers.VAT.CheckVAT(VATNumber, [country]);
    return vatInfo.isValid;
}
function SetDefaultSisIDError(result = {}) {
    result.score = 50;
    result.reasons = ["Error"];
    result.reasonLabels = { "reason.code.Error": Language.Translate("_SisId technical error") };
    Log.Error(`Sis id error: ${result ? result.moreInformation : "unknown error"}`);
}
function SetBankRefIBANScoreError(result = {}) {
    result.score = 0;
    result.reasons = ["Error"];
    result.reasonLabels = { "reason.code.Error": Language.Translate("_SisIdErrorOnIBAN") };
}
function SisIDCheckBankAccount(registrationId, country, bankCountry, swiftBICCode, routingCode, accNumber, userLanguage) {
    let tempResult = {};
    let tempResultBIC = {};
    let tempResultRoutingCode = {};
    if (registrationId && accNumber && swiftBICCode) {
        const options = getCheckLocalBankOptions(registrationId, country, bankCountry, swiftBICCode, null, accNumber, userLanguage);
        tempResultBIC = Sys.Helpers.Sis_ID.CheckLocalBank(options) || {};
    }
    if (registrationId && accNumber && routingCode) {
        const options = getCheckLocalBankOptions(registrationId, country, bankCountry, null, routingCode, accNumber, userLanguage);
        tempResultRoutingCode = Sys.Helpers.Sis_ID.CheckLocalBank(options) || {};
    }
    if (isNaN(tempResultBIC.score) && isNaN(tempResultRoutingCode.score)) {
        SetDefaultSisIDError(tempResult);
    }
    else if (isNaN(tempResultBIC.score)) {
        return tempResultRoutingCode;
    }
    else if (isNaN(tempResultRoutingCode.score)) {
        return tempResultBIC;
    }
    else if (tempResultBIC.score <= tempResultRoutingCode.score) {
        return tempResultBIC;
    }
    else {
        return tempResultRoutingCode;
    }
    return tempResult;
}
function CheckVendorOnSisId(userLanguage) {
    const bankDetailsTable = Data.GetTable("CompanyBankAccountsTable__");
    let registrationId = Data.GetValue("TaxID__");
    const country = Data.GetValue("Country__");
    const bankReferencesVerificationResult = [];
    let isThereBankRefErrorsOrWarnings = false;
    if (Lib.VendorRegistration.Common.IsCountryUS()) {
        try {
            registrationId = Data.GetConfidentialValue("TaxIdentificationNumber__");
        }
        catch (e) {
            Log.Warn(`Unable to read TaxIdentificationNumber: ${e}`);
        }
    }
    let tempResult = {};
    for (let i = 0; i < bankDetailsTable.GetItemCount(); i++) {
        const item = bankDetailsTable.GetItem(i);
        const iban = item.GetValue("BankIBAN__");
        const accNumber = item.GetValue("BankAccountNumber__");
        const swiftBICCode = item.GetValue("SWIFT_BICCode__");
        const routingCode = item.GetValue("RoutingCode__");
        const bankCountry = item.GetValue("BankCountry__");
        if (iban && registrationId) {
            const options = getCheckIBANOptions(iban, registrationId, country, userLanguage);
            tempResult = Sys.Helpers.Sis_ID.CheckIBAN(options) || {};
            if (isNaN(tempResult.score)) {
                SetDefaultSisIDError(tempResult);
            }
            bankReferencesVerificationResult.push({
                IBAN: iban,
                score: tempResult.score,
                messageCode: tempResult.reasons,
                message: tempResult.reasonLabels
            });
        }
        else if (registrationId && accNumber && (swiftBICCode || routingCode)) {
            tempResult = SisIDCheckBankAccount(registrationId, country, bankCountry, swiftBICCode, routingCode, accNumber, userLanguage);
            bankReferencesVerificationResult.push({
                BBAN: accNumber,
                score: tempResult.score,
                messageCode: tempResult.reasons,
                message: tempResult.reasonLabels
            });
        }
        else {
            SetBankRefIBANScoreError(tempResult);
            bankReferencesVerificationResult.push({
                IBAN: iban,
                BBAN: accNumber,
                score: tempResult.score,
                messageCode: tempResult.reasons,
                message: tempResult.reasonLabels
            });
        }
        item.SetValue("BankIBANScore__", tempResult.score);
        isThereBankRefErrorsOrWarnings = IsThereBankRefErrorsOrWarningSisId(isThereBankRefErrorsOrWarnings, tempResult.score);
        Variable.SetValueAsString("SisidErrorAsWarning", false);
    }
    Variable.SetValueAsString("IsThereIBANErrorsOrWarnings", isThereBankRefErrorsOrWarnings ? "true" : "false");
    Variable.SetValueAsString("SisidIBANResults", JSON.stringify(bankReferencesVerificationResult));
}
function CheckVendorOnFON() {
    const bankDetailsTable = Data.GetTable("CompanyBankAccountsTable__");
    let registrationId = "";
    try {
        registrationId = Data.GetConfidentialValue("TaxIdentificationNumber__");
    }
    catch (e) {
        Log.Warn(`Unable to read TaxIdentificationNumber: ${e}`);
    }
    const bankReferencesVerificationResult = [];
    let isThereBankRefErrorsOrWarnings = false;
    for (let i = 0; i < bankDetailsTable.GetItemCount(); i++) {
        const item = bankDetailsTable.GetItem(i);
        const accNumber = item.GetValue("BankAccountNumber__");
        const routingCode = item.GetValue("RoutingCode__");
        const bankCountry = item.GetValue("BankCountry__");
        if (bankCountry !== "US" || item.IsNullOrEmpty("BankAccountNumber__") || item.IsNullOrEmpty("RoutingCode__")) {
            Log.Info("Skipping row - non US or empty bank item");
            continue;
        }
        let bankResult = {
            BBAN: accNumber,
            BBRN: routingCode,
            score: 0,
            status: Sys.VM.FONBankStatus.error,
            details: ""
        };
        if (registrationId) {
            const checkBankDetails = Lib.VM.FON.Server.CheckBankDetails(true, routingCode, accNumber);
            bankResult = {
                BBAN: checkBankDetails.accNumber,
                BBRN: checkBankDetails.routingCode,
                score: checkBankDetails.score,
                technicalError: checkBankDetails.technicalError ? true : false,
                status: checkBankDetails.message.verify,
                details: checkBankDetails.message.details
            };
        }
        bankReferencesVerificationResult.push(bankResult);
        item.SetValue("BankIBANScore__", bankResult.score);
        isThereBankRefErrorsOrWarnings = Lib.VM.FON.Server.IsThereBankRefErrorsOrWarningFON(isThereBankRefErrorsOrWarnings, bankResult.status);
        Variable.SetValueAsString("FONErrorAsWarning", false);
    }
    Variable.SetValueAsString("IsFONBankRefErrorsOrWarnings", isThereBankRefErrorsOrWarnings ? "true" : "false");
    Variable.SetValueAsString("FONBankCheckResults", JSON.stringify(bankReferencesVerificationResult));
}
function getCheckIBANOptions(iban, registrationId, country, userLanguage) {
    const options = {
        clientId: Parameters.GetSisIDLogin(),
        clientSecret: Parameters.GetSisIDPassword(),
        iban: iban,
        registrationId: registrationId,
        country: country,
        responseLanguage: userLanguage
    };
    const customUrl = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Common.GetSisIDUrl");
    if (customUrl) {
        options.sisIdUrlBase = customUrl;
    }
    return options;
}
function getCheckLocalBankOptions(DUNSNumber, country, bankCountry, bic, routingCode, bban, userLanguage) {
    const options = {
        clientId: Parameters.GetSisIDLogin(),
        clientSecret: Parameters.GetSisIDPassword(),
        registrationId: DUNSNumber,
        country: country,
        bankCountry: bankCountry,
        bic: bic,
        routingCode: routingCode,
        bban: bban,
        responseLanguage: userLanguage
    };
    const customUrl = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Common.GetSisIDUrl");
    if (customUrl) {
        options.sisIdUrlBase = customUrl;
    }
    return options;
}
function IsThereBankRefErrorsOrWarningSisId(isThereBankRefErrorsOrWarnings, score) {
    if (isThereBankRefErrorsOrWarnings === false) {
        isThereBankRefErrorsOrWarnings = score < Sys.Helpers.Sis_ID.defaultScoreLimits.warning;
    }
    return isThereBankRefErrorsOrWarnings;
}
function GetSisIdResultMessage() {
    const resultVar = Variable.GetValueAsString("SisidIBANResults");
    let sisIdResults;
    let warningCount = 0;
    let errorCount = 0;
    let successCount = 0;
    let message = "";
    if (resultVar) {
        try {
            sisIdResults = JSON.parse(resultVar);
            for (const sisIdResult of sisIdResults) {
                if (sisIdResult.score <= Sys.Helpers.Sis_ID.defaultScoreLimits.error) {
                    errorCount++;
                }
                else if (sisIdResult.score < Sys.Helpers.Sis_ID.defaultScoreLimits.warning) {
                    warningCount++;
                }
                else if (sisIdResult.score >= Sys.Helpers.Sis_ID.defaultScoreLimits.warning) {
                    successCount++;
                }
            }
            if (successCount > 0) {
                message += `${Language.Translate("_SisId returned {0} IBAN(s) in success", true, successCount)}\n`;
            }
            if (warningCount > 0) {
                message += `${Language.Translate("_SisId returned {0} IBAN(s) in warning", true, warningCount)}\n`;
            }
            if (errorCount > 0) {
                message += `${Language.Translate("_SisId returned {0} IBAN(s) in error", true, errorCount)}\n`;
            }
            return message.slice(0, -1);
        }
        catch (e) {
            // Bad JSON
        }
    }
    return Language.Translate("_Unable to read SisIdResult");
}
function AnotherRegistrationUpdateIsPending(vendorNumber, companyCode) {
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable("CDNAME#Vendor Registration");
    query.SetAttributesList("RuidEx,State,Deleted,VendorNumber__,CompanyCode__");
    const queryFilter = `(&(State<100)(Deleted=0)(!(MsnEx=${Data.GetValue("MsnEx")}))(VendorNumber__=${vendorNumber})(CompanyCode__=${companyCode}))`;
    query.SetFilter(queryFilter);
    if (query.MoveFirst()) {
        const record = query.MoveNext();
        if (record) {
            const uninheritedVars = record.GetUninheritedVars();
            let ruidEx = "[ could not retrieve the associated RuidEx ]";
            if (uninheritedVars) {
                ruidEx = uninheritedVars.GetValue_String("RUIDEX", 0);
            }
            Log.Warn("Another registration update found : " + ruidEx);
            return true;
        }
    }
    Log.Info("No other registration update found");
    return false;
}
const VendorHelper = {
    GetFirstSalesAdminEmail: function () {
        const officersTable = Data.GetTable("CompanyOfficersTable__");
        const item = officersTable.GetItem(0);
        if (item) {
            return item.GetValue("Email__");
        }
        return null;
    },
    CreateSalesAdminVendor: function () {
        // Create first sales admin
        const officersTable = Data.GetTable("CompanyOfficersTable__");
        const item = officersTable.GetItem(0);
        if (item) {
            const configuration = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetConfigurationForNewlyCreatedVendorUser") || "Default";
            const parameters = {
                VendorNumber__: Data.GetValue("VendorNumber__"),
                VendorName__: Data.GetValue("Company__"),
                CompanyCode__: Data.GetValue("CompanyCode__"),
                VendorContactEmail__: item.GetValue("Email__"),
                FirstName__: item.GetValue("FirstName__"),
                LastName__: item.GetValue("LastName__"),
                Configuration__: configuration
            };
            // Retrieve Language/Culture/Timezone from guest
            const guestLogin = Variable.GetValueAsString("guestUserLogin");
            if (guestLogin) {
                const guestUser = Users.GetUser(guestLogin);
                if (guestUser) {
                    parameters.Language = guestUser.GetValue("Language");
                    parameters.Culture = guestUser.GetValue("Culture");
                    parameters.TimeZoneIdentifier = guestUser.GetValue("TimeZoneIdentifier");
                }
            }
            // Check if a sales representative user already exists for this vendor to fill shortLoginPAC
            const salesRepLogin = VendorHelper.FindSalesRepresentativeLogin();
            if (salesRepLogin) {
                parameters.shortLoginPAC = salesRepLogin;
            }
            const vendorUser = Lib.AP.VendorPortal.CreateNewVendorFromTemplate(parameters);
            if (vendorUser) {
                Variable.SetValueAsString("vendorShortLogin", Lib.P2P.GetShortLoginFromUser(vendorUser));
                Variable.SetValueAsString("vendorLogin", vendorUser.GetValue("login"));
                return vendorUser;
            }
        }
        return null;
    },
    UpdateAllOfficersUser: function () {
        const accountid = Lib.AP.VendorPortal.GetCurrentUser().GetValue("accountid");
        const defaultParameters = {
            Description: Data.GetValue("VendorNumber__"),
            Company: Data.GetValue("Company__"),
            Street: Data.GetValue("Street__"),
            Country: Data.GetValue("Country__"),
            City: Data.GetValue("City__"),
            ZipCode: Data.GetValue("Zip_Code__"),
            POBox: Data.GetValue("POBox__") || "",
            MailState: Data.GetValue("Mail_State__") || "",
            FaxNumber: Data.GetValue("Fax_Number__") || "",
        };
        Sys.Helpers.Data.ForEachTableItem("CompanyOfficersTable__", (officer) => {
            const email = officer.GetValue("Email__");
            const user = Users.GetUserAsProcessAdmin(`${accountid}$${email}`);
            if (user) {
                const parameters = Sys.Helpers.Extend({}, defaultParameters, {
                    FirstName: officer.GetValue("FirstName__"),
                    LastName: officer.GetValue("LastName__"),
                    MailSub: officer.GetValue("MailSub__") || "",
                    DisplayName: `${officer.GetValue("FirstName__")} ${officer.GetValue("LastName__")}`,
                });
                user.SetValues(parameters);
            }
        });
    },
    FindSalesRepresentativeLogin: function () {
        let salesRepUserLogin = null;
        Sys.Helpers.Data.ForEachTableItem("CompanyOfficersTable__", (officer) => {
            if (officer.GetValue("Role__") === "salesRepresentative") {
                const accountid = Lib.AP.VendorPortal.GetCurrentUser().GetValue("accountid");
                const email = officer.GetValue("Email__");
                if (Users.GetUserAsProcessAdmin(`${accountid}$${email}`)) {
                    salesRepUserLogin = email;
                    return true;
                }
            }
        });
        return salesRepUserLogin;
    },
};
const NotificationHelper = {
    SendWelcomeEmail: function (user) {
        user.UpdateWelcomeInfoDate("EMAIL");
        const templateName = "AP-Vendor_WelcomeEmail_XX.htm";
        const customTags = {
            login: user.GetValue("login").split("$")[1],
            passwordUrl: user.GeneratePasswordURL(),
            UrlOptions: user.GetPortalURL()
        };
        NotificationHelper.SendEmail(templateName, { customTags });
    },
    SendEmailForNonExistingVendor: function (template, vendorEmail, customTags) {
        const userID = Data.GetValue("RegistrationType__") === registrationType.update ? Data.GetValue("OwnerId") : Variable.GetValueAsString("creatorOwnerId");
        const userForEmail = Users.GetUser(userID);
        const email = Sys.EmailNotification.CreateEmailWithUser(userForEmail, vendorEmail, null, template, customTags, true);
        if (email) {
            Sys.EmailNotification.SendEmail(email);
        }
        else {
            Log.Error(`Cannot send email to '${vendorEmail}'`);
        }
    },
    SendEmail: function (template, options) {
        let customTags = {};
        if (options && options.customTags) {
            customTags = options.customTags;
        }
        const userID = Data.GetValue("RegistrationType__") === registrationType.update ? Data.GetValue("OwnerId") : Variable.GetValueAsString("creatorOwnerId");
        customTags.VendorRegistrationUrl__ = null;
        const emailReceiverId = Variable.GetValueAsString("vendorLogin") || Variable.GetValueAsString("guestUserLogin") || Variable.GetValueAsString("requesterLogin");
        const emailReceiver = Users.GetUserAsProcessAdmin(emailReceiverId);
        if (emailReceiver) {
            if (options && options.processLink) {
                customTags.VendorRegistrationUrl__ = emailReceiver.GetProcessURL(Data.GetValue("Ruidex"), true);
            }
        }
        else {
            Log.Error(`Cannot retrieve userVendor from external variable with value '${emailReceiverId}'`);
        }
        const emailReceiverShortLogin = Variable.GetValueAsString("vendorShortLogin") || Variable.GetValueAsString("requesterShortLogin");
        let destEmail = emailReceiver ? emailReceiver.GetValue("EmailAddress") : emailReceiverShortLogin;
        destEmail = Lib.P2P.computeVendorEmailRedirection(destEmail);
        const customEmail = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnSendEmailToVendor", template, customTags, userID);
        if (customEmail) {
            template = customEmail.template;
            customTags = customEmail.customTags;
        }
        const email = Sys.EmailNotification.CreateEmailWithUser(emailReceiver, destEmail, null, template, customTags, true);
        if (email) {
            if (customEmail && customEmail.ccRecipients && customEmail.ccRecipients.length > 0) {
                for (const ccRecipient of customEmail.ccRecipients) {
                    Sys.EmailNotification.AddCC(email, ccRecipient, true);
                }
            }
            SendEMailHandler(userID, email, options, template);
        }
        else {
            Log.Error(`Cannot send email to '${destEmail}'`);
        }
    },
    SendApprovedEmailToCreator: function () {
        this.sendEmailToCreator({
            subject: "_Vendor_ApprovedEmailSubject",
            template: "AP-RegistrationApprove_XX.htm"
        });
    },
    SendRejectedEmailToCreator: function () {
        this.sendEmailToCreator({
            subject: "_Vendor_RejectedEmailSubject",
            template: "AP-RegistrationReject_XX.htm"
        });
    },
    sendEmailToCreator: function (emailDetails) {
        const creatorOwnerId = Data.GetValue("CreatorOwnerId");
        const user = Users.GetUser(creatorOwnerId);
        if (!user) {
            Log.Error(`Cannot retrieve user from creatorOwnerId with value '${creatorOwnerId}'`);
            return;
        }
        const emailOptions = {
            emailAddress: user.GetValue("EmailAddress"),
            user: user,
            subject: emailDetails.subject,
            template: emailDetails.template,
            customTags: {
                ApproverDisplayName: user.GetValue("DisplayName"),
                VendorName: Data.GetValue("Company__"),
                VendorRegistrationLink: user.GetProcessURL(Data.GetValue("Ruidex"), true),
                RejectComment: Data.GetValue("Comment__")
            }
        };
        const doSendNotif = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnSendEmailToCreator", emailOptions);
        if (doSendNotif !== false) {
            const email = Sys.EmailNotification.CreateEmailWithUser(emailOptions);
            if (email) {
                Log.Info(`Sending email to '${emailOptions.emailAddress}'`);
                Sys.EmailNotification.SendEmail(email);
            }
            else {
                Log.Error(`Cannot send email to '${emailOptions.emailAddress}'`);
            }
        }
    }
};
function SendEMailHandler(userID, email, options, template) {
    if (options && options.addRequesterAsBBC && Data.GetValue("RegistrationType__") === registrationType.registration) {
        const userRequester = Users.GetUser(userID);
        if (userRequester) {
            const requesterEmailAddress = userRequester.GetValue("EmailAddress");
            if (requesterEmailAddress) {
                Sys.EmailNotification.AddBCC(email, requesterEmailAddress);
            }
            else {
                Log.Error("Cannot retrieve requesterEmailAddress from userRequester");
            }
        }
        else {
            Log.Error(`Cannot retrieve userRequester from external variable creatorOwnerId with value '${userID}'`);
        }
    }
    ApplyCustomEmailNotificationSenderInfo(email);
    Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Server.EmailOptions", email, template);
    Sys.EmailNotification.SendEmail(email);
}
/**
 * Applies custom email sender information if provided by user exit function.
 * @param email - The email transport object to configure
 */
function ApplyCustomEmailNotificationSenderInfo(email) {
    const customFromInfo = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.SetEmailNotificationFromNameAndAddress");
    if (!customFromInfo) {
        return;
    }
    // Set custom sender name if provided
    if (customFromInfo.name) {
        email.SetSender().GetVars().AddValue_String("FromName", customFromInfo.name, true);
    }
    // Set custom sender address if provided
    if (customFromInfo.address) {
        email.GetUninheritedVars().AddValue_String("FromAddress", customFromInfo.address, true);
    }
}
function CreateRelatedDocuments() {
    const SenderFormProcessName = "DD - SenderForm";
    if (Process.GetProcessID(SenderFormProcessName)) {
        const relatedDocumentsStr = Variable.GetValueAsString("DocumentsSummaryJSON");
        if (!relatedDocumentsStr) {
            return;
        }
        try {
            const relatedDocumentsJson = JSON.parse(relatedDocumentsStr);
            const documentsArray = relatedDocumentsJson.documents;
            if (!documentsArray) {
                return;
            }
            for (const currentItem of documentsArray) {
                const attach = Attach.GetAttach(currentItem.attachmentIndex);
                if (!attach) {
                    Log.Error("An error occured during creation of related documents : failed to find attachment");
                    break;
                }
                const senderFormProcess = Process.CreateProcessInstance(SenderFormProcessName, true);
                const transportAttach = senderFormProcess.AddAttachEx(attach);
                const transportAttachVars = transportAttach.GetVars();
                transportAttachVars.AddValue_String("AttachToProcess", "1", true);
                // To avoid wrapping, configuration name is the same that document type to work with SDA
                const transportExternalVars = senderFormProcess.GetExternalVars();
                transportExternalVars.AddValue_String("Configuration", currentItem.type, true);
                // Company code and vendor number are saved in additional field 1 and 2 in Sender From
                const transportVars = senderFormProcess.GetUninheritedVars();
                transportVars.AddValue_String("CF_1711725718e_Company_code__", Data.GetValue("CompanyCode__"), true);
                transportVars.AddValue_String("CF_17117258411_Vendor_number__", Data.GetValue("VendorNumber__"), true);
                transportVars.AddValue_String("Subject", Attach.GetName(currentItem.attachmentIndex), true);
                const vendorLogin = Variable.GetValueAsString("vendorLogin") || Variable.GetValueAsString("guestUserLogin");
                let vendor = null;
                if (vendorLogin) {
                    vendor = Users.GetUserAsProcessAdmin(vendorLogin);
                }
                else {
                    vendor = Lib.AP.VendorPortal.GetVendor({
                        vendorNumber: Data.GetValue("VendorNumber__"),
                        companyCode: Data.GetValue("CompanyCode__")
                    });
                }
                if (vendor) {
                    transportVars.AddValue_String("NotificationRecipient__", vendor.GetValue("Login"), true);
                }
                else {
                    Log.Warn("Failed to find vendor contact for notification on document expiration");
                }
                if (currentItem.endOfValidity != null) {
                    transportVars.AddValue_Date("EndOfValidity__", Sys.Helpers.Date.ISO8601StringToDate(currentItem.endOfValidity), true);
                }
                // Set right to all user of workflow
                for (let rightIndex = 0; rightIndex < Lib.VendorRegistration.Workflow.Controller.GetNbContributors(); rightIndex++) {
                    const contributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(rightIndex);
                    senderFormProcess.AddRight(contributor.login, "all");
                }
                Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnCreateRelatedOneDocumentEnd", senderFormProcess, currentItem);
                senderFormProcess.Process();
            }
        }
        catch (e) {
            Log.Error("An exception occured during creation of related documents : " + e);
        }
    }
    else {
        Log.Info("SDA isn't activated - related documents will not be created");
    }
}
function formatComment(comment) {
    const idx = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
    const currentContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(idx);
    //Test if contributor returns a real user
    if (currentContributor && currentContributor.login && Users.GetUser(currentContributor.login)) {
        return Lib.P2P.AddOnBehalfOf(currentContributor, comment, true);
    }
    return comment;
}
// Workflow controller parameters
const defaultWorkflowParameters = {
    // In the validation script(server side), WorkflowParameters defines what must be done for each action.
    actions: {
        requestVendorInformations: {
            OnDone: function () {
                GiveReadRightToCurrentContributor();
                Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "submitted", date: new Date() });
                NotificationHelper.SendEmail("AP-Vendor_RegistrationInvitation.htm", {
                    processLink: true
                });
                Forward();
            }
        },
        toSubmit: {
            OnDone: function () {
                // Serialize the modified fields
                Lib.VendorRegistration.Common.ModifiedFieldsHandling.SerializeModifiedData();
                if (Data.GetValue("RegistrationType__") !== registrationType.update && !Lib.VendorRegistration.InternalRequest.IsInternalRequest()) {
                    NotificationHelper.SendEmail("AP-Vendor_RegistrationSubmit.htm");
                }
                Data.SetValue("Comment__", "");
                Data.SetValue("ProcessStatus__", "ToValidate");
                GiveReadRightToCurrentContributor();
                Conversation.UpdateParties(Lib.P2P.Conversation.TableName, {
                    ConversationID: Variable.GetValueAsString("ConversationId")
                }, {
                    RecipientCompany: Data.GetValue("Company__")
                });
                // Main account rights required to compute workflow
                ForwardToMainAccountAndCallAction("getWarningsToDisplayToApprover", true);
            }
        },
        submitted: {},
        OFACToCheck: {},
        OFACChecked: {},
        SisIdToCheck: {},
        SisIdChecked: {},
        FONBankToCheck: {},
        FONBankChecked: {},
        TINChecked: {},
        TINToCheck: {},
        OFACFONChecked: {},
        OFACFONToCheck: {},
        toReview: {
            OnDone: async function () {
                // Serialize the modified fields
                Lib.VendorRegistration.Common.ModifiedFieldsHandling.SerializeModifiedData();
                const nextContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(Lib.VendorRegistration.Workflow.Controller.GetContributorIndex() + 1);
                if (nextContributor.role === "_Approver") {
                    if (Lib.VM.FON.IsTINWithOFACCheckEnabled()) {
                        Lib.VM.FON.ResetOFACResults();
                        Lib.VM.FON.ResetTINResults();
                    }
                    Lib.VendorRegistration.CheckOFAC.ResetOFACResults();
                    ResetOFACWarnings();
                }
                GiveReadRightToCurrentContributor();
                await Approve(false, function () {
                    Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "approved", date: new Date(), comment: formatComment(Data.GetValue("Comment__")) });
                    Data.SetValue("Comment__", "");
                    ForwardAndMakeTouchlessApprovalIfNeeded();
                });
            }
        },
        toApprove: {
            OnDone: async function () {
                // Serialize the modified fields
                Lib.VendorRegistration.Common.ModifiedFieldsHandling.SerializeModifiedData();
                GiveReadRightToCurrentContributor();
                await Approve(false, function () {
                    var _a;
                    const comment = (_a = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetWorkflowActionComment", "approved", "")) !== null && _a !== void 0 ? _a : "";
                    Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "approved", date: new Date(), comment: formatComment(comment) });
                    Data.SetValue("Comment__", "");
                    Forward();
                });
            }
        },
        approved: {},
        backToPrevious: {
            OnDone: function (index) {
                var _a;
                // Serialize the modified fields
                Lib.VendorRegistration.Common.ModifiedFieldsHandling.SerializeModifiedData();
                GiveReadRightToCurrentContributor();
                Data.SetValue("ProcessStatus__", "ToValidate");
                const comment = (_a = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetWorkflowActionComment", "backToPrevious", "")) !== null && _a !== void 0 ? _a : "";
                Lib.VendorRegistration.Workflow.Controller.BackTo(index - 1, { action: "backToPrevious", date: new Date(), comment: formatComment(comment) });
                Data.SetValue("Comment__", "");
                Forward();
            }
        },
        backToVendor: {
            OnDone: function () {
                GiveReadRightToCurrentContributor();
                const templateEmail = Lib.VendorRegistration.InternalRequest.IsInternalRequest() ? "AP-Vendor_RegistrationBackToRequester.htm" : "AP-Vendor_RegistrationBackToVendor.htm";
                NotificationHelper.SendEmail(templateEmail, { processLink: true, customTags: { comment: Data.GetValue("Comment__"), companyName: Data.GetValue("Company__") } });
                let backToRole;
                if (Lib.VendorRegistration.Workflow.Controller.GetRoleAt(0) === Lib.VendorRegistration.Workflow.roleRequester && Lib.VendorRegistration.Workflow.Controller.GetRoleAt(1) !== Lib.VendorRegistration.Workflow.roleVendor) {
                    backToRole = Lib.VendorRegistration.Workflow.roleRequester;
                    Data.SetValue("ProcessStatus__", "ToValidate");
                }
                else {
                    backToRole = Lib.VendorRegistration.Workflow.roleVendor;
                    Data.SetValue("ProcessStatus__", "PendingVendorInfo");
                }
                Lib.VendorRegistration.Workflow.Controller.BackTo(Lib.VendorRegistration.Workflow.Controller.GetRoleSequenceIndex(backToRole), {
                    action: "backToVendor",
                    date: new Date(),
                    comment: formatComment(Data.GetValue("Comment__"))
                });
                Variable.SetValueAsString("DunsValueChanged", "0");
                Forward();
            }
        },
        recheckIban: {
            OnDone: function (step) {
                // Action is not a real approval action
                Process.PreventApproval();
                const currentContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(step);
                //Get user language
                const currentUser = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerId"));
                const userLanguage = currentUser ? currentUser.GetValue("language") : "EN";
                if (Parameters.IsSisIDEnabled()) {
                    CheckVendorOnSisId(userLanguage);
                    const wkfComment = GetSisIdResultMessage();
                    // Add Workflow line
                    currentContributor.action = "SisIdChecked";
                    currentContributor.role = Lib.VendorRegistration.Workflow.roleSisIdChecker;
                    currentContributor.date = new Date();
                    currentContributor.comment = formatComment(wkfComment);
                    Lib.VendorRegistration.Workflow.Controller.BackTo(step, currentContributor);
                }
                if (Parameters.IsUSBankCheckEnabled()) {
                    let wkfCommentFON = Lib.VendorRegistration.Common.GetFONBankCheckSkippedMessage();
                    if (!wkfCommentFON) {
                        CheckVendorOnFON();
                        wkfCommentFON = Lib.VendorRegistration.Common.GetFONBankCheckMessage();
                    }
                    currentContributor.action = "FONBankChecked";
                    currentContributor.role = Lib.VendorRegistration.Workflow.roleFONBankChecker;
                    currentContributor.date = new Date();
                    currentContributor.comment = formatComment(wkfCommentFON);
                    Lib.VendorRegistration.Workflow.Controller.BackTo(step, currentContributor);
                }
            }
        },
        reject: {
            OnDone: async function () {
                // Terminates the workflow and sets the message in the rejected state.
                GiveReadRightToCurrentContributor();
                if (!Lib.VendorRegistration.InternalRequest.IsInternalRequest()) {
                    NotificationHelper.SendEmail("AP-Vendor_RegistrationRejected.htm", { processLink: true, addRequesterAsBBC: true, customTags: { comment: Data.GetValue("Comment__") } });
                }
                Lib.VendorRegistration.Workflow.Controller.EndWorkflow({ action: "rejected", date: new Date(), comment: formatComment(Data.GetValue("Comment__")) });
                Data.SetValue("State", 400);
                Data.SetValue("ProcessStatus__", "Rejected");
                await Lib.VendorRegistration.ContractUpdate.RefreshVendorContractsWithRegisteredVendor("reject");
                if (Data.GetValue("RegistrationType__") !== registrationType.update) {
                    NotificationHelper.SendRejectedEmailToCreator();
                }
                Process.LeaveForm();
            }
        },
        onExpiration: {},
        continueAfterERPAck: {
            OnDone: async function (sequenceStep) {
                const validityDT = Data.GetValue("SubmitDateTime");
                validityDT.setMonth(validityDT.getMonth() + 16);
                Data.SetValue("ValidityDateTime", validityDT);
                Lib.VendorRegistration.VendorExporter.DeleteExportTransaction();
                if (ERPIntegrationHelper.IsInError()) {
                    Data.SetValue("ProcessStatus__", "ToValidate");
                    const currentContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(sequenceStep);
                    currentContributor.action = "ERPIntegrationError";
                    currentContributor.date = new Date();
                    currentContributor.comment = `${Language.Translate("_ERP posting error")}: ${Data.GetValue("ERPPostingError__")}`;
                    Lib.VendorRegistration.Workflow.Controller.BackTo(sequenceStep, currentContributor);
                    Process.PreventApproval();
                    Forward();
                }
                else {
                    await FinishRegistration();
                }
                Lib.AP.ERPAcknowledgment.SendActionToErpAcknowledgmentProcess(Data.GetValue("ERPAckRuidEx__"), Lib.AP.ERPAcknowledgment.Actions.ErpAcknowledgmentProcessed);
            }
        }
    }
};
Sys.Helpers.Extend(true, Lib.VendorRegistration.Workflow.Parameters, defaultWorkflowParameters);
/**
 * @deprecated: Use Lib.VendorRegistration.Customization.Common.SetWorkflowParameters
*/
Lib.VendorRegistration.Workflow.Parameters = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.SetWorkflowParameters", Lib.VendorRegistration.Workflow.Parameters, Lib.VendorRegistration.Workflow.buildGenericContributors) || Lib.VendorRegistration.Workflow.Parameters;
Lib.VendorRegistration.Workflow.Parameters = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Common.SetWorkflowParameters", Lib.VendorRegistration.Workflow.Parameters, Lib.VendorRegistration.Workflow.buildGenericContributors) || Lib.VendorRegistration.Workflow.Parameters;
function ForwardAndMakeTouchlessApprovalIfNeeded() {
    Forward();
    if (Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.EnableTouchlessForUpdateOnVendorRegistration") &&
        Lib.VendorRegistration.Workflow.Controller.IsLastContributor() &&
        Data.GetValue("RegistrationType__") === registrationType.update &&
        !Data.FormHasWarning() && !Lib.P2P.FormHasError()
        && Variable.GetValueAsString("IsThereIBANErrorsOrWarnings").toLowerCase() !== "true"
        && Variable.GetValueAsString("IsFONBankRefErrorsOrWarnings").toLowerCase() !== "true") {
        // Automatically process this update via touchless
        Process.RecallScript("TouchlessSubmit", true);
    }
}
function touchlessSubmitAction() {
    Log.Info("Touchless : Automatic posting");
    Data.SetValue("TouchlessDone__", true);
    Data.SetValue("Comment__", Language.Translate("_TouchlessAutoApprove"));
    submitAction();
}
function ResetOFACWarningsTable(tableName, dataToCheck) {
    const table = Data.GetTable(tableName);
    for (let i = 0; i < table.GetItemCount(); i++) {
        const item = table.GetItem(i);
        if (item) {
            for (const column in dataToCheck[tableName]) {
                if ({}.hasOwnProperty.call(dataToCheck[tableName], column)) {
                    item.SetWarning(column, null);
                }
            }
        }
    }
}
function ResetOFACWarnings() {
    const dataToCheck = Lib.VendorRegistration.CheckOFAC.ExtendRegistrationWarningFields({});
    for (const prop in dataToCheck) {
        if (typeof dataToCheck[prop] === "string") {
            Data.SetWarning(prop, null);
        }
        else if (typeof dataToCheck[prop] === "object") {
            ResetOFACWarningsTable(prop, dataToCheck);
        }
    }
}
function submitAction() {
    if (!Lib.P2P.FormHasError() && CheckIbanFormat() && CheckVATFormat()) {
        let isProcessValid = false;
        // Compatibility with existing projects in prod
        if (Sys.Helpers.TryGetFunction("Lib.AP.Customization.VendorRegistration_Server.IsProcessValid")) {
            // @deprecated Lib.AP.Customization.VendorRegistration_Server.IsProcessValid
            isProcessValid = Sys.Helpers.TryCallFunction("Lib.AP.Customization.VendorRegistration_Server.IsProcessValid");
        }
        else {
            // New namespace Lib.VendorRegistration.Customization.Server.IsProcessValid
            isProcessValid = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.IsProcessValid");
        }
        if (isProcessValid === false) {
            Process.PreventApproval();
        }
        else {
            const idx = Lib.VendorRegistration.Workflow.Controller.GetContributorIndex();
            const currentContributor = Lib.VendorRegistration.Workflow.Controller.GetContributorAt(idx);
            Lib.VendorRegistration.Workflow.Controller.DoAction(currentContributor.action);
        }
    }
    else {
        Process.PreventApproval();
    }
}
function backToPreviousAction() {
    Lib.VendorRegistration.Workflow.Controller.DoAction("backToPrevious");
}
function backToVendorAction() {
    Lib.VendorRegistration.Workflow.Controller.DoAction("backToVendor");
}
async function rejectAction() {
    await Lib.VendorRegistration.Workflow.Controller.DoAction("reject");
}
function InitializeWorkflow() {
    Log.Info("Initialize workflow to take vendor infos and checks into account...");
    Lib.VendorRegistration.Workflow.Controller.AllowRebuild(true);
    Lib.VendorRegistration.Workflow.Controller.Rebuild();
    ChangeOwner();
}
async function rebuildWorkflowToAddOFACReviewer() {
    Log.Info("Rebuilding workflow to take vendor infos and checks into account...");
    Lib.VendorRegistration.Workflow.Controller.Rebuild();
    await Approve(true, function () {
        ForwardAndMakeTouchlessApprovalIfNeeded();
    });
}
async function getWarningsToDisplayToApproverAction() {
    var _a;
    //get user language for sis id call
    const currentUser = Users.GetUserAsProcessAdmin(Data.GetValue("OwnerId"));
    const userLanguage = currentUser ? currentUser.GetValue("language") : "EN";
    // initialize workflow
    InitializeWorkflow();
    if (Lib.VendorRegistration.CheckDuplicateVendor.ShouldCheckDuplicates()) {
        Lib.VendorRegistration.CheckDuplicateVendor.CheckAllDuplicates(Data.GetValue("MsnEx"));
    }
    // User submitted the registration
    const submittedComment = (_a = Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.GetWorkflowActionComment", "submitted", "")) !== null && _a !== void 0 ? _a : "";
    Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "submitted", date: new Date(), comment: formatComment(submittedComment) });
    Data.SetValue("Comment__", "");
    // SIS-ID Check - SisIdChecker sequence step
    if (Lib.VendorRegistration.Common.DoNeedToCheckVendorOnSisId()) {
        CheckVendorOnSisId(userLanguage);
        const wkfComment = GetSisIdResultMessage();
        // Automatic check, move to next contributor
        Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "SisIdChecked", date: new Date(), comment: wkfComment });
    }
    // FON Bank Check - FONBankChecker sequence step
    if (Parameters.IsUSBankCheckEnabled()) {
        let wkfComment = Lib.VendorRegistration.Common.GetFONBankCheckSkippedMessage();
        if (!wkfComment) {
            CheckVendorOnFON();
            wkfComment = Lib.VendorRegistration.Common.GetFONBankCheckMessage();
        }
        // Automatic check, move to next contributor
        Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "FONBankChecked", date: new Date(), comment: wkfComment });
    }
    // OFAC Check
    if (Parameters.IsOFACEnabled()) {
        Lib.VendorRegistration.CheckOFAC.CheckAllOFACLists();
        const OFACResults = Lib.VendorRegistration.CheckOFAC.GetLastOFACResults();
        let wkfComment = Language.Translate("_OFACNoMatch");
        if (OFACResults.length > 0) {
            wkfComment = Lib.VendorRegistration.CheckOFAC.FormatOFACDisplay(OFACResults, false);
        }
        // Automatic check, move to next contributor
        Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "OFACChecked", date: new Date(), comment: wkfComment });
    }
    if (Parameters.IsTINWithOFACCheckEnabled()) {
        const isCountryUS = Lib.VendorRegistration.Common.IsCountryUS();
        Lib.VM.FON.Server.CheckTINOFAC(isCountryUS);
        if (!isCountryUS) {
            const skipTINMatch = {
                TINNAME_CODE: "1",
                TINNAME_DETAILS: Language.Translate("_TINCheckSkippedNonUS")
            };
            Variable.SetValueAsString(Lib.VM.FON.TIN_RESULT, JSON.stringify(skipTINMatch));
        }
        const TINMatchResult = Lib.VM.FON.GetLastTINMatchResult();
        let wkfComment = Language.Translate("_TINCheckOK");
        if (TINMatchResult) {
            wkfComment = Lib.VM.FON.FormatTINDisplay(TINMatchResult, false);
        }
        // Automatic check, move to next contributor
        Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "TINChecked", date: new Date(), comment: wkfComment });
        const ofacResultFON = Lib.VM.FON.GetLastOFACResults();
        wkfComment = Language.Translate("_OFACNoMatch");
        if (ofacResultFON) {
            wkfComment = Lib.VM.FON.FormatOFACDisplay(ofacResultFON, false);
        }
        // Automatic check, move to next contributor
        Lib.VendorRegistration.Workflow.Controller.NextContributor({ action: "OFACFONChecked", date: new Date(), comment: wkfComment });
    }
    // Rebuild workflow for legalReviewer sequence (requires OFAC checks results)
    await rebuildWorkflowToAddOFACReviewer();
}
function recheckIbanAction() {
    Lib.VendorRegistration.Workflow.Controller.DoAction("recheckIban");
}
function sendSisIdInvitationEmailAction() {
    // Action is not a real approval action
    Process.PreventApproval();
    try {
        const sisIdInvitation = JSON.parse(Variable.GetValueAsString("BankDetailsCheckerInvitation"));
        const template = "AP-Vendor_RegistrationSISIDInvite_XX.htm";
        const options = {
            customTags: {
                "SISIDInvitationLink__": sisIdInvitation.url
            }
        };
        if (Lib.VendorRegistration.Common.DoesVendorLoginExist()) {
            NotificationHelper.SendEmail(template, options);
        }
        else {
            const salesAdminEmail = VendorHelper.GetFirstSalesAdminEmail();
            if (salesAdminEmail) {
                NotificationHelper.SendEmailForNonExistingVendor(template, salesAdminEmail, options.customTags);
            }
            else {
                Log.Error("Cannot find sales admin email in Company Officers Table");
            }
        }
    }
    catch (error) {
        Log.Error("Cannot send Sis-Id invitation : " + error);
    }
}
async function initRegistrationUpdateAction() {
    // Defines the role sequence.
    const { vendorNumber, companyCode } = GetVendorLinksInfos();
    // Check if there's another registration update pending
    if (AnotherRegistrationUpdateIsPending(vendorNumber, companyCode)) {
        Variable.SetValueAsString("AlreadyPendingRegistrationUpdate", "true");
        return;
    }
    if (vendorNumber) {
        Data.SetValue("CompanyCode__", companyCode);
        Data.SetValue("VendorNumber__", vendorNumber);
        Variable.SetValueAsString("companyCode", companyCode);
        masterDataHandler.FillInterface();
        ApplyVendorCategoryFeatureIfNeeded();
        ApplyVendorItemCategoryFeatureIfNeeded();
        await ApplyUNSPSCFeatureIfNeeded(Data.GetValue("CompanyCode__"));
        // Store master data, for later use
        Lib.VendorRegistration.Common.ModifiedFieldsHandling.SerializeFormToProcessVariable();
    }
    Variable.SetValueAsString(Lib.VendorRegistration.Workflow.defaultRolesSequenceVariableName, ["vendor", "SisIdChecker", "FONBankChecker", "OFACChecker", "TINChecker", "OFACFONChecker", "legalReviewer", "approver"].toString());
    const rolesSequence = Lib.VendorRegistration.Workflow.GetRolesSequence();
    Lib.VendorRegistration.Workflow.Controller.SetRolesSequence(rolesSequence);
    Lib.VendorRegistration.Workflow.Controller.AllowRebuild(true);
    // Forward back to vendor
    Process.Forward(Variable.GetValueAsString("vendorLogin"));
}
/**
 * This action is called when a vendor registration is created from a SDA document.
 * It will initialize the registration based on the company code and vendor number
 * found in the SDA document.
 */
function initSDAUpdate() {
    // Defines the role sequence.
    const { companyCode, vendorNumber } = GetInformationsFromSupplierInquiry(Variable.GetValueAsString("SDAIdentifier"));
    Data.SetValue("ProcessStatus__", "ToValidate");
    // Get the vendor information
    const vendor = Lib.AP.VendorPortal.GetVendor({ companyCode, vendorNumber });
    if (vendor) {
        Variable.SetValueAsString("vendorLogin", vendor.GetValue("Login"));
    }
    Variable.SetValueAsString("internalRequest", Lib.VendorRegistration.InternalRequest.InternalRequestType.Update);
    Variable.SetValueAsString("creatorOwnerEmail", Users.GetUser(Data.GetValue("OwnerID")).GetValue("login"));
    Variable.SetValueAsString("creatorOwnerId", Data.GetValue("OwnerID"));
    initUpdateRequest(companyCode, vendorNumber);
}
function ApplyVendorCategoryFeatureIfNeeded() {
    Sys.GenericAPI.Query("P2P - Vendor Category__", "", ["Code__", "DefaultValue__"], function (result /*, error: string*/) {
        if (result.length >= 1) {
            if (!Data.GetValue("VendorCategory__")) {
                if (Variable.GetValueAsString("vendorCategory")) {
                    Data.SetValue("VendorCategory__", Variable.GetValueAsString("vendorCategory"));
                }
                else if (result[0].DefaultValue__ === "1") {
                    Data.SetValue("VendorCategory__", result[0].Code__);
                }
            }
            Data.SetRequired("VendorCategory__", true);
            Variable.SetValueAsString("VendorCategoryFeatureActivated", "1");
        }
        else {
            Data.SetRequired("VendorCategory__", false);
            Variable.SetValueAsString("VendorCategoryFeatureActivated", "0");
        }
    }, "DefaultValue__ DESC", 1, {
        asAdmin: true,
        useConstantQueryCache: true
    });
}
function ApplyVendorItemCategoryFeatureIfNeeded() {
    if (Variable.GetValueAsString("vendorItemCategoryID")) {
        Data.SetValue("DefaultItemCategoryID__", Variable.GetValueAsString("vendorItemCategoryID"));
    }
}
async function ApplyUNSPSCFeatureIfNeeded(companyCode) {
    if (companyCode) {
        const isUNSPSCEnabled = await Lib.P2P.UNSPSC.IsEnabledByQuery(companyCode);
        const isVendorAllowedToAddUNSPSC = await Lib.P2P.UNSPSC.IsVendorAllowedToAddUNSPSCByQuery(companyCode);
        Variable.SetValueAsString("EnableVendorUNSPSC", String(isUNSPSCEnabled));
        Variable.SetValueAsString("EnableManualUNSPSCAdd", String(isVendorAllowedToAddUNSPSC));
    }
}
function initUpdateRequest(companyCode, vendorNumber) {
    // Registration update internal request (from SIM)
    Data.SetValue("RegistrationType__", registrationType.update);
    const currentRequester = Users.GetUser(Data.GetValue("OwnerId"));
    // Check if there's another registration update pending
    if (AnotherRegistrationUpdateIsPending(vendorNumber, companyCode)) {
        Variable.SetValueAsString("AlreadyPendingRegistrationUpdate", "true");
        return;
    }
    if (vendorNumber) {
        Data.SetValue("CompanyCode__", companyCode);
        Data.SetValue("VendorNumber__", vendorNumber);
        masterDataHandler.FillInterface();
        // Store master data, for later use
        Lib.VendorRegistration.Common.ModifiedFieldsHandling.SerializeFormToProcessVariable();
    }
    // Defines the role sequence.
    InitInternalWorkflow();
    if (currentRequester) {
        Variable.SetValueAsString("requesterLogin", currentRequester.GetValue("login"));
    }
}
function initCloneRequest(companyCode, vendorNumber) {
    // Registration clone internal request (from SIM)
    Data.SetValue("RegistrationType__", registrationType.registration);
    if (vendorNumber) {
        Data.SetValue("CompanyCode__", companyCode);
        Data.SetValue("VendorNumber__", vendorNumber);
        masterDataHandler.FillInterface();
        // After filling the interface, we remove the company code to let the user choose the new one
        Data.SetValue("CompanyCode__", "");
    }
    // Defines the role sequence.
    InitInternalWorkflow();
    const currentRequester = Users.GetUser(Data.GetValue("OwnerId"));
    if (currentRequester) {
        Variable.SetValueAsString("requesterLogin", currentRequester.GetValue("login"));
    }
}
function InitInternalWorkflow() {
    Variable.SetValueAsString(Lib.VendorRegistration.Workflow.defaultRolesSequenceVariableName, ["requester", "SisIdChecker", "FONBankChecker", "OFACChecker", "TINChecker", "OFACFONChecker", "legalReviewer", "approver"].toString());
    const rolesSequence = Lib.VendorRegistration.Workflow.GetRolesSequence();
    Lib.VendorRegistration.Workflow.Controller.SetRolesSequence(rolesSequence);
    Lib.VendorRegistration.Workflow.Controller.AllowRebuild(true);
    GiveReadRightToCurrentContributor();
}
async function defaultAction() {
    // New submission always require some validation
    Process.PreventApproval();
    ApplyVendorCategoryFeatureIfNeeded();
    ApplyVendorItemCategoryFeatureIfNeeded();
    await ApplyUNSPSCFeatureIfNeeded(Variable.GetValueAsString("companyCode"));
    Lib.VM.ScoringProviders.Server.Manager.InitProviders();
    Variable.SetValueAsString("IsTINWithOFACCheckEnabled", Lib.VM.FON.IsTINWithOFACCheckEnabled());
    if (Lib.VendorRegistration.InternalRequest.IsInternalNewRequest()) {
        // New registration internal request
        Data.SetValue("RegistrationType__", registrationType.registration);
        // Defines the role sequence.
        InitInternalWorkflow();
        const currentRequester = Users.GetUser(Data.GetValue("OwnerId"));
        Variable.SetValueAsString("requesterShortLogin", Lib.P2P.GetShortLoginFromUser(currentRequester));
        Variable.SetValueAsString("requesterLogin", currentRequester.GetValue("login"));
    }
    else if (Lib.VendorRegistration.InternalRequest.IsInternalUpdateRequest()) {
        initUpdateRequest(Variable.GetValueAsString("companyCode"), Variable.GetValueAsString("vendorNumber"));
    }
    else if (Lib.VendorRegistration.InternalRequest.IsInternalCloneRequest()) {
        initCloneRequest(Variable.GetValueAsString("companyCode"), Variable.GetValueAsString("vendorNumber"));
    }
    else if (!Variable.GetValueAsString("guestUserLogin")) {
        // Registration update from vendor portal
        Data.SetValue("RegistrationType__", registrationType.update);
        const currentVendor = Users.GetUser(Data.GetValue("OwnerId"));
        Variable.SetValueAsString("vendorShortLogin", Lib.P2P.GetShortLoginFromUser(currentVendor));
        Variable.SetValueAsString("vendorLogin", currentVendor.GetValue("login"));
        ForwardToMainAccountAndCallAction("InitRegistrationUpdate");
    }
    else {
        // New registration - vendor request
        Data.SetValue("RegistrationType__", registrationType.registration);
        // Defines the role sequence.
        Variable.SetValueAsString(Lib.VendorRegistration.Workflow.defaultRolesSequenceVariableName, ["requester", "vendor", "SisIdChecker", "FONBankChecker", "OFACChecker", "TINChecker", "OFACFONChecker", "legalReviewer", "approver"].toString());
        const rolesSequence = Lib.VendorRegistration.Workflow.GetRolesSequence();
        Lib.VendorRegistration.Workflow.Controller.SetRolesSequence(rolesSequence);
        Lib.VendorRegistration.Workflow.Controller.AllowRebuild(true);
        Lib.VendorRegistration.Workflow.Controller.DoAction("requestVendorInformations");
    }
}
const ActionMap = {
    "Submit": submitAction,
    "TouchlessSubmit": touchlessSubmitAction,
    "BackToPrevious": backToPreviousAction,
    "BackToVendor": backToVendorAction,
    "Reject": rejectAction,
    "getWarningsToDisplayToApprover": getWarningsToDisplayToApproverAction,
    "recheckIban": recheckIbanAction,
    "sendSisIdInvitationEmail": sendSisIdInvitationEmailAction,
    "InitRegistrationUpdate": initRegistrationUpdateAction,
    "InitSDAUpdate": initSDAUpdate,
    "continueAfterERPAck": continueVendorRegistrationAfterERPAck,
    "OnExpiration": onExpiration,
    "OnCancel": onCancel,
    "UpdateOfficers": UpdateOfficers
};
/**
 * Sets variables based on the current action, queue actions, and variables to set.
 * @param currentAction - The current action object.
 * @param queueActions - An array of queue actions.
 * @param variablesToSet - An object containing variables to set.
 * @returns void
 */
function setVariablesBasedOnAction(currentAction, queueActions, variablesToSet) {
    for (const property in variablesToSet) {
        if (typeof variablesToSet[property] == "string") {
            Variable.SetValueAsString(property, variablesToSet[property]);
        }
    }
    Lib.FlexibleFormToJSON.Deserializer.SetJSON(currentAction);
    Variable.SetValueAsString("ApplicationEnableActions", JSON.stringify(queueActions));
}
/**
 * Prepares the next recall script based on the queue actions.
 * @param {Object[]} queueActions - The array of queue actions.
 * @returns {void}
 */
function prepareNextRecallScript(queueActions) {
    if (queueActions.length > 0) {
        Log.Info("Should recall script");
        Process.RecallScript("recallOnDemoData");
    }
}
/**
 * Retrieves the action name based on certain conditions.
 * @returns The action name as a string.
 */
function getActionName() {
    let actionName = "OnExpiration";
    if (!Process.AutoValidatingOnExpiration() || Data.GetValue("ProcessStatus__") !== "WaitingForERPAck") {
        actionName = Data.GetActionName();
    }
    if (Variable.GetValueAsString("SDADocTypeSource") === "Supplier information update" && !Data.GetValue("CompanyCode__") && !Data.GetValue("VendorNumber__")) {
        // A new registration is created from a SDA document, force the action to initSDAUpdate
        // The company code and the vendor number will be set with the values from the SDA document
        actionName = "InitSDAUpdate";
    }
    if (Variable.GetValueAsString("ApplicationEnable") === "1") {
        const actions = JSON.parse(Variable.GetValueAsString("ApplicationEnableActions"));
        if (Sys.Helpers.IsArray(actions) && actions.length >= 1) {
            Process.DisableChecks();
            const action = actions.shift();
            actionName = action.actionName;
            const variablesToSet = action.variables;
            setVariablesBasedOnAction(action, actions, variablesToSet);
            prepareNextRecallScript(actions);
        }
    }
    return actionName;
}
/**
 * Processes the action based on the action name.
 * If the action name is not found in the ActionMap, the default action is called.
 * If the action name is found in the ActionMap, the corresponding action is called.
 * The action name is retrieved by calling the getActionName function.
 */
async function processAction(actionName) {
    if (typeof ActionMap[actionName] === "function") {
        // InitRegistrationUpdate action initializes the form for the user to take the first action. It does not represent
        // the user performing an action which modifies the form data.
        if (actionName !== "InitRegistrationUpdate" && actionName !== "OnCancel") {
            Variable.SetValueAsString("IsProcessModifiedByUser", "true");
        }
        await ActionMap[actionName]();
    }
    else {
        // new submission
        await defaultAction();
    }
}
async function run() {
    const currentName = Data.GetActionName();
    const currentAction = Data.GetActionType();
    Log.Info("-- VR Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice() + "'");
    Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnValidationScriptBegin", currentName, currentAction);
    const emailReceiverId = Variable.GetValueAsString("vendorLogin") || Variable.GetValueAsString("guestUserLogin") || Variable.GetValueAsString("requesterLogin");
    const emailReceiver = Users.GetUserAsProcessAdmin(emailReceiverId);
    if (emailReceiver) {
        Variable.SetValueAsString("VendorRegistrationURLVendor", emailReceiver.GetProcessURL(Data.GetValue("Ruidex"), true));
    }
    Variable.SetValueAsString("VendorRegistrationURLInternal", Process.GetProcessURL(Data.GetValue("Ruidex")));
    Lib.VM.FON.LoadConfiguration();
    Lib.VM.FON.Server.SetCredentials(Lib.VM.FON.GetToken(), Lib.VM.FON.GetPortalId());
    // Creates and initializes the workflow.
    Lib.VendorRegistration.Workflow.Init();
    Lib.AP.InitArchiveDuration();
    Lib.P2P.SetTablesToIndex(["GlobalQuestionnaireResultTable__", "CompanyOfficersTable__", "UNSPSCList__"]);
    let actionName = getActionName();
    Log.Info("actionName:", actionName);
    // Retrieve data for do a duplicate check on pending vendor registrations
    Lib.VendorRegistration.CheckDuplicateVendor.SetPendingRegistrationToCheck();
    // Defines what must be done when depending on requested action
    await processAction(actionName);
    Lib.VendorRegistration.Common.SetRightForVendorManagementViewers();
    let isRecallScriptScheduled = Process.IsRecallScriptScheduled();
    Sys.Helpers.TryCallFunction("Lib.VendorRegistration.Customization.Server.OnValidationScriptEnd", currentName, currentAction, isRecallScriptScheduled);
}
Lib.P2P.HandleScriptError(run());
//# sourceMappingURL=validationscript.js.map