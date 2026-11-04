"use strict";
/* eslint-disable dot-notation */
/* eslint-disable class-methods-use-this,guard-for-in,no-case-declarations */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var ValidationScript;
(function (ValidationScript) {
    class SkipActionError extends Error {
        constructor(resultData, message) {
            super(message);
            this.resultData = resultData;
            Object.setPrototypeOf(this, SkipActionError.prototype);
        }
    }
    ValidationScript.SkipActionError = SkipActionError;
    class Main {
        constructor() {
            this.projectNumber = Data.GetValue("ProjectNumber__");
            this.contractNumber = Data.GetValue("ContractNumber__");
            this.actions = {
                Create: {
                    actionFn: () => this.ActionCreate()
                },
                Delete: {
                    actionFn: () => this.ActionDelete()
                }
            };
        }
        PreventConcurrentAccess(callback) {
            Log.Info("[Main.PreventConcurrentAccess] call");
            let resultPromise;
            Process.PreventConcurrentAccess(`ProjectContractLink-${this.projectNumber}-${this.contractNumber}`, () => {
                // Promises are synchronous here
                resultPromise = callback();
            });
            if (!resultPromise) {
                Log.Error("[Main.PreventConcurrentAccess] cannot prevent concurrent access");
                resultPromise = Sys.Helpers.Promise.Reject(new SkipActionError({ error: "PREVENT_CONCURRENT_ACCESS_ERROR" }));
            }
            return resultPromise;
        }
        QueryLink() {
            if (!this.lastQueryLinkPromise) {
                Log.Info("[Main.QueryLink] requesting...");
                this.lastQueryLinkPromise = Sys.GenericAPI
                    .PromisedQuery({
                    table: "Project Contract Link__",
                    attributes: ["*"],
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ProjectNumber__", this.projectNumber), Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", this.contractNumber)),
                    additionalOptions: {
                        recordBuilder: record => record // returns xRecord
                    }
                })
                    .Then(queryResult => {
                    Log.Info(`[Main.QueryLink] link found: ${!!(queryResult === null || queryResult === void 0 ? void 0 : queryResult.length)}`);
                    return queryResult;
                })
                    .Catch(reason => this.OnCatch("Main.QueryLink", reason));
            }
            return this.lastQueryLinkPromise;
        }
        CheckUniqueLink() {
            Log.Info("[Main.CheckUniqueLink] call");
            return this.QueryLink()
                .Then(queryResult => {
                const unique = (queryResult === null || queryResult === void 0 ? void 0 : queryResult.length) === 0;
                Log.Info(`[Main.CheckUniqueLink] unique: ${unique}`);
                if (!unique) {
                    throw new SkipActionError({ error: "ALREADY_LINKED" });
                }
            })
                .Catch(reason => this.OnCatch("Main.CheckUniqueLink", reason));
        }
        QueryProject() {
            if (!this.lastQueryProjectPromise) {
                Log.Info("[Main.QueryProject] requesting...");
                this.lastQueryProjectPromise = Sys.GenericAPI
                    .PromisedQuery({
                    table: "CDNAME#Project",
                    attributes: ["*"],
                    filter: Sys.Helpers.LdapUtil.FilterEqual("ProjectNumber__", this.projectNumber),
                    maxRecords: 1
                })
                    .Then(queryResult => {
                    Log.Info(`[Main.QueryProject] project found: ${!!(queryResult === null || queryResult === void 0 ? void 0 : queryResult.length)}`);
                    return queryResult;
                })
                    .Catch(reason => this.OnCatch("Main.QueryProject", reason));
            }
            return this.lastQueryProjectPromise;
        }
        QueryContract() {
            if (!this.lastQueryContractPromise) {
                Log.Info("[Main.QueryContract] requesting...");
                this.lastQueryContractPromise = Sys.GenericAPI
                    .PromisedQuery({
                    table: "CDNAME#P2P - Contract",
                    attributes: ["*"],
                    filter: Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", this.contractNumber),
                    maxRecords: 1,
                    additionalOptions: {
                        searchInArchive: true
                    }
                })
                    .Then(queryResult => {
                    Log.Info(`[Main.QueryContract] contract found: ${!!(queryResult === null || queryResult === void 0 ? void 0 : queryResult.length)}`);
                    return queryResult;
                })
                    .Catch(reason => this.OnCatch("Main.QueryContract", reason));
            }
            return this.lastQueryContractPromise;
        }
        CheckAuthorizedUser() {
            Log.Info("[Main.CheckAuthorizedUser] call");
            // A user can create/delete a link between project and contract if he has at least the read access to both documents
            const projectPromise = this.QueryProject();
            const contractPromise = this.QueryContract();
            return Sys.Helpers.Promise.All([projectPromise, contractPromise])
                .Then(([projectQueryResult, contractQueryResult]) => {
                const authorized = (projectQueryResult === null || projectQueryResult === void 0 ? void 0 : projectQueryResult.length) >= 1 && (contractQueryResult === null || contractQueryResult === void 0 ? void 0 : contractQueryResult.length) >= 1; // use '>=' rather than '===' (VLA/sharding)
                Log.Info(`[Main.CheckAuthorizedUser] authorized: ${authorized}`);
                if (!authorized) {
                    throw new SkipActionError({ error: "UNAUTHORIZED_USER" });
                }
            })
                .Catch(reason => this.OnCatch("Main.CheckAuthorizedUser", reason));
        }
        CheckProjectStatus() {
            Log.Info("[Main.CheckProjectStatus] call");
            return this.QueryProject()
                .Then(queryResult => {
                const project = queryResult[0];
                const validStatus = ["Draft", "InProgress"].indexOf(project.Status__) !== -1;
                Log.Info(`[Main.CheckProjectStatus] valid status: ${validStatus}`);
                if (!validStatus) {
                    throw new SkipActionError({ error: "INVALID_DOC" });
                }
            })
                .Catch(reason => this.OnCatch("Main.CheckProjectStatus", reason));
        }
        CreateLink() {
            Log.Info("[Main.CreateLink] call");
            return Sys.Helpers.Promise.Resolve()
                .Then(() => {
                const link = Process.CreateTableRecord("Project Contract Link__");
                const linkVars = link.GetVars();
                linkVars.AddValue_String("ProjectNumber__", this.projectNumber, true);
                linkVars.AddValue_String("ContractNumber__", this.contractNumber, true);
                link.Commit();
                if (link.GetLastError() === 0) {
                    Log.Info("[Main.CreateLink] link created successfully");
                    this.SetResultJSON({
                        error: false,
                        linkLongId: linkVars.GetValue_String("LongId", 0)
                    });
                }
                else {
                    Log.Error(`[Main.CreateLink] cannot create link. Error: ${link.GetLastErrorMessage()}`);
                    throw new SkipActionError({
                        error: "CREATE_LINK_ERROR",
                        message: link.GetLastErrorMessage()
                    });
                }
            })
                .Catch(reason => this.OnCatch("Main.CreateLink", reason));
        }
        DeleteLink() {
            Log.Info("[Main.DeleteLink] call");
            return this.QueryLink()
                .Then(queryResult => {
                if (queryResult && queryResult.length) {
                    const link = queryResult[0];
                    const result = link.Delete();
                    if (result === 0) {
                        Log.Info("[Main.DeleteLink] link deleted successfully");
                        this.SetResultJSON({
                            error: false
                        });
                    }
                    else {
                        Log.Error(`[Main.DeleteLink] cannot delete link. Error: ${link.GetLastErrorMessage()}`);
                        throw new SkipActionError({
                            error: "DELETE_LINK_ERROR",
                            message: link.GetLastErrorMessage()
                        });
                    }
                }
                else {
                    Log.Info("[Main.DeleteLink] no link to delete");
                    this.SetResultJSON({
                        error: false
                    });
                }
            })
                .Catch(reason => this.OnCatch("Main.DeleteLink", reason));
        }
        ActionCreate() {
            Log.Info("[Main.ActionCreate] call");
            return this.CheckAuthorizedUser()
                .Then(() => this.CheckProjectStatus())
                .Then(() => {
                return this.PreventConcurrentAccess(() => {
                    return this.CheckUniqueLink()
                        .Then(() => this.CreateLink());
                });
                //Set State to 100 (Without this, the process goes to state 50 client side and state 70 server side)
            }).Then(() => Data.SetValue("State", 100))
                .Catch((reason) => this.SetResultJSON(reason.resultData));
        }
        ActionDelete() {
            Log.Info("[Main.ActionDelete] call");
            return this.CheckAuthorizedUser()
                .Then(() => this.CheckProjectStatus())
                .Then(() => this.DeleteLink())
                //Set State to 100 (Without this, the process goes to state 50 client side and state 70 server side)
                .Then(() => Data.SetValue("State", 100))
                .Catch((reason) => this.SetResultJSON(reason.resultData));
        }
        SetResultJSON(resultData) {
            Data.SetValue("ResultJSON__", JSON.stringify(resultData));
        }
        OnCatch(caller, reason) {
            if (!(reason instanceof SkipActionError)) {
                Log.Error(`[${caller}] unexpected error: ${reason}`);
                reason = new SkipActionError({
                    error: "UNEXPECTED_ERROR",
                    message: reason
                });
            }
            throw reason;
        }
        Start() {
            let actionName = Data.GetActionName();
            const actionType = Data.GetActionType();
            Log.Info(`ActionName: "${actionName}" ActionType: "${actionType}"`);
            const actionByField = Data.GetValue("Action__");
            if (actionByField) {
                actionName = actionByField;
            }
            else if (!actionName) {
                actionName = "Create";
            }
            Data.SetValue("Action__", actionName);
            Log.Info(`Action to execute: ${actionName}, for project: ${this.projectNumber}, contract: ${this.contractNumber}`);
            const action = this.actions[actionName];
            if (action) {
                return action.actionFn();
            }
            // ELSE
            Log.Warn("Unknown action");
            this.SetResultJSON({ error: "UNKNOWN_ACTION" });
            return Sys.Helpers.Promise.Resolve({ error: "UNKNOWN_ACTION" });
        }
    }
    ValidationScript.Main = Main;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        main.Start();
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map