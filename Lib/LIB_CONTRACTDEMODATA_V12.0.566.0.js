"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CONTRACTDEMODATA_V12.0.566.0",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Import JSON to auto create contract",
  "versionable": true,
  "require": [
    "Sys/Sys_Helpers_Date",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_Helpers_String",
    "Sys/Sys_OnDemand_Users",
    "Sys/Sys_Helpers_TimeoutHelper",
    "Lib_Contract_Server_V12.0.566.0",
    "Lib_Contract_Workflow_Server_V12.0.566.0"
  ]
}*/
var Lib;
(function (Lib) {
    let ContractDemoData;
    (function (ContractDemoData) {
        function ExtractContractInfo() {
            const attachContent = Attach.GetContent(1);
            Log.Info("Import JSON information: " + attachContent);
            return JSON.parse(attachContent);
        }
        function WriteContractInfo(info) {
            var _a;
            const now = new Date();
            const newOwnerDN = Sys.OnDemand.Users.GetDemoUserDN(info.UserInfo.Login);
            const user = Users.GetUser(newOwnerDN);
            const newRequesterDN = Sys.OnDemand.Users.GetDemoUserDN((_a = info.RequesterInfo) === null || _a === void 0 ? void 0 : _a.Login);
            const requester = Users.GetUser(newRequesterDN);
            for (let attr in info) {
                if (typeof info[attr] != "object") {
                    let value = info[attr].toString();
                    value = value.replace("<CURRENTYEAR>", now.getFullYear());
                    value = value.replace("<CURRENTYEAR+2>", now.getFullYear() + 2);
                    value = value.replace("<LASTYEAR>", now.getFullYear() - 1);
                    value = value.replace("<USERLOGIN>", user.GetValue("login"));
                    value = value.replace("<USERNAME>", user.GetValue("DisplayName"));
                    value = value.replace("<REQUESTERLOGIN>", requester === null || requester === void 0 ? void 0 : requester.GetValue("login"));
                    value = value.replace("<REQUESTERNAME>", requester === null || requester === void 0 ? void 0 : requester.GetValue("DisplayName"));
                    value = value.replace("<NOW>", Sys.Helpers.Date.Date2DBDateTime(now));
                    Data.SetValue(attr, value);
                }
            }
            Lib.Contract.SetContractNumber();
            Lib.Contract.SetOriginalContractRUIDEX();
        }
        function QueryTableRecords(tableName, filter) {
            const query = Process.CreateQueryAsProcessAdmin();
            query.SetSpecificTable(tableName);
            query.SetFilter(filter.toString());
            query.SetAttributesList("RUIDEX");
            const DBFastAccess = 0x00210000;
            const DBDirtyRead = 0x00020000;
            query.SetOptionEx("Limit=2");
            query.SetOptions(DBFastAccess | DBDirtyRead);
            if (!query.MoveFirst() || query.GetLastError()) {
                const message = `Unable to query records in table ${tableName} : Error on query. Details : ${query.GetLastErrorMessage()}`;
                Log.Error(message);
                throw message;
            }
            const records = [];
            let record = query.MoveNextRecord();
            while (record) {
                records.push(record);
                record = query.MoveNextRecord();
            }
            return records;
        }
        function EditRecord(record) {
            if (record) {
                let vars = record.GetVars();
                vars.AddValue_String("ContractName__", Data.GetValue("Name__"), true);
                vars.AddValue_String("ContractNumber__", Data.GetValue("ContractNumber__"), true);
                vars.AddValue_String("ContractReferenceNumber__", Data.GetValue("ReferenceNumber__"), true);
                vars.AddValue_String("ContractRUIDEX__", Data.GetValue("RuidEx"), true);
                vars.AddValue_String("ValidityDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("StartDate__")), true);
                vars.AddValue_String("ExpirationDate__", Sys.Helpers.Date.Date2DBDate(Data.GetValue("EndDate__")), true);
                vars.AddValue_String("OriginalContractRUIDEX__", Data.GetValue("OriginalContractRUIDEX__"), true);
                record.Commit();
            }
        }
        function QueryItems(vendorNumber, itemNumbers) {
            // VendorItems => P2P - Contract
            const identifierFieldsMap = {
                "ContractNumber__": "ContractNumber__",
                "OriginalContractRUIDEX__": "OriginalContractRUIDEX__",
                "ContractRUIDEX__": "RuidEx"
            };
            const companyCodeFilter = Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", Data.GetValue("CompanyCode__")), Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", ""), Sys.Helpers.LdapUtil.FilterNotExist("CompanyCode__"));
            const vendorFilter = Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", vendorNumber);
            const itemNumberFilter = Sys.Helpers.LdapUtil.FilterIn("ItemNumber__", itemNumbers);
            const linkedItemsFilter = Sys.Helpers.LdapUtil.FilterEqual("ContractReferenceNumber__", Data.GetValue("ReferenceNumber__"));
            const wrongDataFilter = Sys.Helpers.LdapUtil.FilterOr(...Object.keys(identifierFieldsMap).map(vendorItemField => Sys.Helpers.LdapUtil.FilterNotEqual(vendorItemField, Data.GetValue(identifierFieldsMap[vendorItemField]))));
            const filter = Sys.Helpers.LdapUtil.FilterAnd(companyCodeFilter, vendorFilter, itemNumberFilter, linkedItemsFilter, wrongDataFilter);
            return QueryTableRecords("P2P - VendorItems__", filter);
        }
        function LinkItems(info) {
            if (!info.Items || !info.Items.length) {
                return;
            }
            const items = QueryItems(info.VendorNumber__, info.Items);
            Log.Info(`${items.length} Vendor Items to link`);
            items.forEach(function IterateItem(itemRecord) {
                const vars = itemRecord.GetVars();
                Log.Info(`Vendor Item with number <${vars.GetValue_String("ItemNumber__", 0)}> and vendor <${info.VendorNumber__}> not linked`);
                EditRecord(itemRecord);
            });
        }
        function QueryPunchouts(VendorNumber__, CompanyCode__) {
            const requiredFieldName = ["ContractName__",
                "ContractReferenceNumber__",
                "ContractNumber__",
                "ContractRUIDEX__",
                "OriginalContractRUIDEX__"
            ];
            const companyCodeFilter = Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", CompanyCode__);
            const vendorFilter = Sys.Helpers.LdapUtil.FilterEqual("SupplierID__", VendorNumber__);
            const missingDataFilter = Sys.Helpers.LdapUtil.FilterOr(...requiredFieldName.map(fieldName => Sys.Helpers.LdapUtil.FilterNotExist(fieldName)));
            const filter = Sys.Helpers.LdapUtil.FilterAnd(companyCodeFilter, vendorFilter, missingDataFilter);
            return QueryTableRecords("P2P - PunchoutSites__", filter);
        }
        function LinkPunchouts(info) {
            if (info.UpdatePunchoutSite) {
                Log.Info("Link punchout site " + info.CompanyCode__ + "/" + info.VendorNumber__);
                const punchouts = QueryPunchouts(info.VendorNumber__, info.CompanyCode__);
                EditRecord(punchouts[0]);
            }
        }
        function ProcessWorkflow() {
            Data.SetValue("Comments__", Language.Translate("_workflow created automatically"));
            Lib.Contract.Workflow.Init();
            Lib.Contract.Workflow.UpdateRolesSequence();
            //do requester action
            Lib.Contract.Workflow.DoCurrentContributorAction();
            //do approver action
            Lib.Contract.Workflow.DoCurrentContributorAction();
            Data.SetValue("NeedValidation", 0);
        }
        function Init() {
            Process.DisableChecks();
            const info = ExtractContractInfo();
            WriteContractInfo(info);
            LinkItems(info);
            LinkPunchouts(info);
            Attach.SetValue(1, "AttachToProcess", 0);
            Attach.SetTechnical(1, true);
            //Manage Items
            ProcessWorkflow();
        }
        ContractDemoData.Init = Init;
    })(ContractDemoData = Lib.ContractDemoData || (Lib.ContractDemoData = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_ContractDemoData.js.map