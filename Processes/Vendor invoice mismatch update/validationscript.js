"use strict";
var updateResult;
(function (updateResult) {
    updateResult["nothingDone"] = "nothing done";
    updateResult["error"] = "error";
    updateResult["success"] = "success";
    updateResult["partial"] = "partial";
})(updateResult || (updateResult = {}));
const supportedActions = ["accepted", "creditNoteRequested"];
const ownerID = Data.GetValue("OwnerID");
Log.Info(`Update mismatch for user: ${ownerID}`);
const validator = Users.GetUser(ownerID);
const validatorUserId = validator.GetValue("Login");
const validatorName = validator.GetValue("DisplayName");
class Mismatches {
    constructor() {
        this.list = {};
    }
    AddUpdate(processid, msnex, lineNumber, action) {
        var _a;
        var _b;
        const ruidEx = `CD#${processid}.${msnex}`;
        (_a = (_b = this.list)[ruidEx]) !== null && _a !== void 0 ? _a : (_b[ruidEx] = { action, lineNumbers: [] });
        this.list[ruidEx].lineNumbers.push(lineNumber);
    }
    AddMismatch(ruidex, action) {
        Log.Info(`>> AddMismatch: ${ruidex}`);
        const fields = ["DataTableName", "LineNum", "SourceMSNEX", "CUSTOMDATAID", "Line_PriceMismatchResponsible__", "Line_QuantityMismatchResponsible__"];
        const splittedRuidex = ruidex.split(".");
        const tablename = splittedRuidex[0];
        const lineID = splittedRuidex[1];
        const filter = `LineID=${lineID}`;
        const cdlQuery = Process.CreateQuery();
        cdlQuery.SetSpecificTable(tablename);
        cdlQuery.SetAttributesList(fields.join(","));
        cdlQuery.SetFilter(filter);
        if (cdlQuery.MoveFirst() !== 0) {
            let cdl_transport = cdlQuery.MoveNext();
            if (cdl_transport) {
                const cdl_vars = cdl_transport.GetUninheritedVars();
                const msnEx = cdl_vars.GetValue_String("SourceMSNEX", 0);
                const processId = cdl_vars.GetValue_String("CUSTOMDATAID", 0);
                const lineNum = parseInt(cdl_vars.GetValue_String("LineNum", 0));
                this.AddUpdate(processId, msnEx, lineNum, action);
            }
            else {
                Log.Error(`error querying: ${tablename} - ${filter} - no result found`);
            }
        }
        else {
            Log.Error(`error querying: ${tablename} - ${filter} - ${cdlQuery.GetLastErrorMessage()}`);
        }
        Log.Info(`<< AddMismatch: ${ruidex}`);
    }
    RunUpdate(ruidex, updateMismatches) {
        Log.Info(`>> RunUpdate: ${ruidex}`);
        let success = false;
        const arrVal = ruidex.split(".");
        const recipientTypeEx = arrVal[0];
        const msnex = arrVal[1];
        const query = Process.CreateQuery();
        query.Reset();
        query.AddAttribute("*");
        query.SetSearchInArchive(false);
        query.SetSpecificTable(recipientTypeEx);
        query.SetFilter(`MsnEx=${msnex}`);
        query.MoveFirst();
        let eddTransport = query.MoveNext();
        if (eddTransport) {
            const vars = eddTransport.GetUninheritedVars();
            const state = vars.GetValue_Long("State", 0);
            const externalVariables = eddTransport.GetExternalVars();
            const ownershipIdentifier = `APUpdateMismatch_${Process.GetProcessID()}`;
            if (eddTransport.GetAsyncOwnership(ownershipIdentifier, 20000) === 0) {
                externalVariables.AddValue_String("mismatchInfo", JSON.stringify(updateMismatches), true);
                if (state === 70) {
                    Log.Info(`validate ${recipientTypeEx} - ${msnex} - ${JSON.stringify(updateMismatches)}`);
                    vars.AddValue_String("RequestedActions", "approve|updatemismatch", true);
                    vars.AddValue_String("LastSavedOwnerID", ownerID, true);
                    vars.AddValue_String("LastValidatorUserId__", validatorUserId, true);
                    vars.AddValue_String("LastValidatorName__", validatorName, true);
                    success = eddTransport.Validate("updatemismatch") === 1;
                    if (!success) {
                        const lastErrorMessage = eddTransport.GetLastErrorMessage();
                        Log.Error(`error validating${lastErrorMessage ? ": " + lastErrorMessage : ""}`);
                    }
                }
                else {
                    Log.Warn(`invalid state: ${state}`);
                }
                eddTransport.ReleaseAsyncOwnership(ownershipIdentifier);
            }
            else {
                Log.Error(`failed to get ownership: ${recipientTypeEx} - ${msnex}`);
            }
        }
        else {
            Log.Error(`error querying: ${recipientTypeEx} - ${msnex} - ${query.GetLastErrorMessage()}`);
        }
        Log.Info(`<< RunUpdate: ${ruidex} - ${success ? "success" : "failure"}`);
        return success;
    }
    RunUpdates() {
        let errorCount = 0, successCount = 0;
        Object.keys(this.list).forEach(ruidex => {
            const succeed = this.RunUpdate(ruidex, this.list[ruidex]);
            succeed ? successCount++ : errorCount++;
        });
        if (errorCount > 0) {
            if (successCount > 0) {
                return updateResult.partial;
            }
            return updateResult.error;
        }
        if (successCount === 0) {
            return updateResult.nothingDone;
        }
        return updateResult.success;
    }
}
function main() {
    const actionType = Data.GetActionType();
    const actionName = Data.GetActionName();
    if (actionType === "approve" && supportedActions.includes(actionName)) {
        const ancestorRuids = Variable.GetValueAsString("AncestorsRuid");
        const ancestorArray = ancestorRuids.split("|");
        const mismatchesHandler = new Mismatches();
        ancestorArray.forEach(ruidex => {
            mismatchesHandler.AddMismatch(ruidex, actionName);
        });
        const result = mismatchesHandler.RunUpdates();
        Log.Info(`update result: ${result}`);
    }
    else {
        Log.Info(`nothing todo (${actionType} / ${actionName})`);
    }
}
main();
//# sourceMappingURL=validationscript.js.map