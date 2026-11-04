"use strict";
/* eslint-disable class-methods-use-this */
var ValidationScript;
(function (ValidationScript) {
    var SupplyType = Lib.Purchasing.SupplyType;
    var CSVExport = Sys.Helpers.CSVExport;
    var TimeOut = Lib.P2P.Timeout;
    class Updater {
        constructor(initialNoActionCount = 0, initialUpdateCount = 0, initialErrorsCount = 0) {
            // extends
            //super("SuppliesCheckMaxDuration");
            this.MAX_SUMMARY_TABLE_LENGTH = 20;
            this.csvHeaders = [
                "CompanyCode__",
                "SupplyID__",
                "Name__",
                "ParentSupplyID__",
                "FullName__",
                "DisableRestrictionInheritance__",
                "TechnicalAllowedUsersOrGroups__"
            ];
            this.csv = {
                errors: {
                    fileName: "Errors",
                    headers: this.csvHeaders.concat(["Errors__"])
                },
                updates: {
                    fileName: "Updates",
                    headers: this.csvHeaders
                }
            };
            this.counters = {
                noAction: 0,
                updates: 0,
                errors: 0
            };
            this.counters.noAction = initialNoActionCount;
            this.counters.updates = initialUpdateCount;
            this.counters.errors = initialErrorsCount;
            const summary = SupplyType.ReadSummary();
            this.summary = summary || {
                errors: []
            };
        }
        static BuildCSVBuilder() {
            const builder = new CSVExport.OutputCSV(Updater.csvSplitter, Updater.csvReturnSeparator);
            builder.SetAutoFlush(1000);
            return builder;
        }
        static GetFileIndex(fileName) {
            const attachCount = Attach.GetNbAttach();
            for (let idx = attachCount - 1; idx >= 0; idx--) {
                const attachName = Attach.GetName(idx);
                if (attachName === fileName) {
                    Log.Info(`Found file with name ${fileName} at index ${idx}`);
                    return idx;
                }
            }
            return null;
        }
        static SummarizeSupply(supply, errors) {
            const summaryItem = {
                companyCode: supply.companyCode,
                id: supply.id,
                parentId: supply.parentId
            };
            if (errors && errors.length) {
                summaryItem.errors = errors.map(err => err.userError);
            }
            return summaryItem;
        }
        AddError(supply, errors) {
            var _a;
            this.counters.errors++;
            if (this.summary.errors.length < this.MAX_SUMMARY_TABLE_LENGTH) {
                const summaryItem = Updater.SummarizeSupply(supply, errors);
                this.summary.errors.push(summaryItem);
            }
            (_a = this.csv.errors).builder || (_a.builder = Updater.BuildCSVBuilder());
            const csvLine = this.ParseSupplyToCSVLine(supply, errors);
            this.csv.errors.builder.AddLine(csvLine);
        }
        AddUpdate(supply) {
            var _a;
            this.counters.updates++;
            (_a = this.csv.updates).builder || (_a.builder = Updater.BuildCSVBuilder());
            const csvLine = this.ParseSupplyToCSVLine(supply);
            this.csv.updates.builder.AddLine(csvLine);
        }
        CheckAndUpdateTree(companyCode, id) {
            if (!id) {
                throw "No supply id provided";
            }
            const checkedIds = new Set();
            const parent = SupplyType.manager.GetFromCache(companyCode, id);
            const children = SupplyType.manager.GetChildrenTree(companyCode, id);
            Log.Verbose(`${children.length} descendants in category : CompanyCode=${companyCode} and ID=${id}`);
            for (const supply of [parent].concat(children)) {
                const errors = SupplyType.manager.CheckSupplyType(companyCode, id);
                checkedIds.add(supply.id);
                if (!errors.length) {
                    try {
                        if (SupplyType.manager.UpdateParentDependencies(supply)) {
                            Log.Verbose(`Updated Supply : CompanyCode=${supply.companyCode}, ID=${supply.id}`);
                            SaveSupplyTypeInDB(supply);
                            this.AddUpdate(supply);
                        }
                        else {
                            this.counters.noAction++;
                        }
                    }
                    catch (error) {
                        if (error instanceof SupplyType.Errors.SupplyTypeError) {
                            Log.Error(error.technicalError);
                            errors.push(error);
                        }
                        else {
                            throw error;
                        }
                    }
                }
                if (errors.length) {
                    this.AddError(supply, errors);
                }
            }
            return checkedIds;
        }
        Finalize(sendErrorNotification = true) {
            this.WriteOnProcess();
            if (this.counters.errors) {
                if (sendErrorNotification) {
                    const ownerDN = Data.GetValue("OwnerID");
                    Log.Warn(`Notify ${Sys.Helpers.String.ExtractLoginFromDN(ownerDN)} due to ${this.counters.errors} errors`);
                    Lib.P2P.EmailNotification.SendEmailNotification({
                        userId: ownerDN,
                        template: "Purchasing_Email_SupplyError.htm",
                        fromName: "_EskerProcurement",
                        customTags: {
                            validationURL: Data.GetValue("ValidationUrl"),
                            ErrorCount: this.counters.errors
                        }
                    });
                }
                else {
                    Log.Warn("Email error notification not sent");
                }
            }
        }
        ParseSupplyToCSVLine(supply, errors) {
            const columnsValues = [
                supply.companyCode,
                supply.id,
                supply.name,
                supply.parentId,
                supply.fullName,
                supply.inheritRights === true ? "0" : "1",
                supply.localAllowedLogins.join(","),
            ];
            if (errors && errors.length) {
                columnsValues.push(errors.map(err => err.userError).join(','));
            }
            return columnsValues.map(val => !!val ? val : "");
        }
        WriteOnProcess() {
            Data.SetValue("NoActionCount__", this.counters.noAction);
            Data.SetValue("UpdateCount__", this.counters.updates);
            Data.SetValue("ErrorCount__", this.counters.errors);
            for (const key in this.csv) {
                const csvInfo = this.csv[key];
                if (csvInfo.builder && csvInfo.builder.GetNbColumnsLines()) {
                    const attachIndex = Updater.GetFileIndex(csvInfo.fileName);
                    if (attachIndex || attachIndex === 0) {
                        csvInfo.builder.AppendContentToExistingAttachment(attachIndex);
                    }
                    else {
                        csvInfo.builder.SetHeader(csvInfo.headers);
                        csvInfo.builder.AttachCSVFile(csvInfo.fileName, false);
                    }
                }
            }
            if (this.summary.errors.length) {
                SupplyType.SaveSummary(this.summary);
            }
        }
    }
    Updater.csvSplitter = ";";
    Updater.csvReturnSeparator = "\n";
    function SaveSupplyTypeInDB(supplyType) {
        const exists = !!supplyType.ruidex;
        const record = exists ? Process.GetUpdatableTableRecord(supplyType.ruidex) : Process.CreateTableRecord(SupplyType.tableName);
        if (!record) {
            Log.Error(`Unable to get record for Supply Type with ID <${supplyType.id}> and Name <${supplyType.name}> (${supplyType.ruidex})`);
            return;
        }
        const vars = record.GetVars();
        vars.AddValue_String("FullName__", supplyType.fullName, true);
        vars.AddValue_String("TechnicalAllowedUsersOrGroups__", supplyType.localAllowedLogins.join(";"), true);
        vars.AddValue_String("ComputedTechnicalAllowedLogins__", supplyType.computedAllowedLogins.join(";"), true);
        record.Commit();
        if (record.GetLastError()) {
            // ? PAC : Need to throw to prevent recompute of next children ??
            throw new SupplyType.Errors.DatabaseError("An error occured on Supply Type save", supplyType, record.GetLastErrorMessage());
        }
    }
    async function GetCompanyCodes() {
        const options = {
            table: SupplyType.tableName,
            attributes: ["CompanyCode__"],
            groupBy: ["CompanyCode__"],
            sortOrder: "CompanyCode__ ASC NULLS FIRST",
            maxRecords: 500,
            additionalOptions: "EnableJoin=1"
        };
        const startingCompanyCode = Variable.GetValueAsString("NextCompanyCode");
        if (!Sys.Helpers.IsEmpty(startingCompanyCode)) {
            options.filter = Sys.Helpers.LdapUtil.FilterGreaterOrEqual("CompanyCode__", startingCompanyCode);
            Log.Verbose(`CompanyCode query with filter ${options.filter}`);
        }
        const records = await Sys.GenericAPI.PromisedQuery(options);
        Log.Info(`Found ${records.length} CompanyCodes in table ${SupplyType.tableName}`);
        return records.map(record => record.CompanyCode__);
    }
    class Main {
        constructor(action) {
            this.timer = new TimeOut.Timer("SuppliesCheckMaxDuration");
            this.scriptAction = action;
        }
        ComputeAction() {
            if (!Sys.Helpers.IsEmpty(this.scriptAction.name)) {
                return this.scriptAction.name;
            }
            const hasSupplyID = !Data.IsNullOrEmpty("SupplyID__");
            if (hasSupplyID) {
                return SupplyType.Action.UpdateChildrenTree;
            }
        }
        async HandleAction() {
            const action = this.ComputeAction();
            switch (action) {
                case SupplyType.Action.UpdateChildrenTree: return await this.UpdateChildrenTree();
                case SupplyType.Action.CheckTableIntegrity: return await this.CheckTableIntegrity();
                default: throw new Error(`Unknown required action: ${action}`);
            }
        }
        async Start() {
            Sys.Helpers.EnableSmartSilentChange();
            this.updater = new Updater(Data.GetValue("NoActionCount__"), Data.GetValue("UpdateCount__"), Data.GetValue("ErrorCount__"));
            const recallAction = await this.HandleAction();
            this.updater.Finalize(!recallAction);
            if (recallAction) {
                Log.Warn(`Recall script required with action ${recallAction}`);
                Process.RecallScript(recallAction, true);
            }
        }
        //#region ACTIONS
        async CheckTableIntegrity() {
            const companyCodes = await GetCompanyCodes();
            for (const companyCode of companyCodes) {
                if (!this.timer.RemainsTime()) {
                    Log.Warn(`Maximum time reached, can not execute check on Company Code ${companyCode}`);
                    Variable.SetValueAsString("NextCompanyCode", companyCode);
                    return SupplyType.Action.CheckTableIntegrity;
                }
                Log.Info(`Start coherency check for CompanyCode ${companyCode}`);
                await SupplyType.manager.Query(companyCode);
                const ids = SupplyType.manager.GetSuppliesId(companyCode);
                const roots = SupplyType.manager.GetChildren(companyCode);
                if (roots.length) {
                    for (const supplyRoot of roots) {
                        const checkedIds = this.updater.CheckAndUpdateTree(companyCode, supplyRoot.id);
                        checkedIds.forEach(checkedId => ids.delete(checkedId));
                    }
                }
                else {
                    Log.Error(`No Root Supply for CompanyCode ${companyCode}`);
                }
                /**
                 * Not reachable from any roots
                 * - Orphan
                 * - Child of missing ascendent (ignore errors because its due to parent)
                 * - Self parent (ID === ParentID)
                 */
                if (ids.size) {
                    Log.Error("Supply Types with problem detected");
                    for (const id of ids) {
                        const supplyType = SupplyType.manager.GetFromCache(companyCode, id);
                        const errors = SupplyType.manager.CheckSupplyType(companyCode, id);
                        // Recursion
                        const recursionId = SupplyType.manager.GetRecursionID(companyCode, id);
                        if (recursionId) {
                            errors.push(new SupplyType.Errors.Recursion(`Recursion detected : ID=${supplyType.id}, CompanyCode=${companyCode}, parent=${recursionId}`, supplyType));
                        }
                        if (errors.length) {
                            this.updater.AddError(supplyType, errors);
                        }
                    }
                }
            }
        }
        async UpdateChildrenTree() {
            const companyCode = Data.GetValue("CompanyCode__");
            const supplyTypeID = Data.GetValue("SupplyID__");
            await SupplyType.manager.Query(companyCode);
            this.updater.CheckAndUpdateTree(companyCode, supplyTypeID);
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const action = Lib.P2P.GetScriptAction("SupplyType Update");
        // Prevent multiple validation : Come from 'SendCD' Action if state = 50;
        const canRunProcess = Data.GetValue("State") == 50 && ((action.name === "" && action.type === "") || action.type.toLocaleLowerCase().includes("approve"));
        if (!canRunProcess) {
            Log.Info("Skipping script");
        }
        else {
            const main = new Main(action);
            Lib.P2P.HandleScriptError(main.Start());
        }
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map