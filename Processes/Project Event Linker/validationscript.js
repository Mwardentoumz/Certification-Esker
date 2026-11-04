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
            this.eventId = Data.GetValue("EventId__");
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
            Process.PreventConcurrentAccess(`ProjectEventLink-${this.projectNumber}-${this.eventId}`, () => {
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
                    table: "Project Event Link__",
                    attributes: ["*"],
                    filter: Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("ProjectNumber__", this.projectNumber), Sys.Helpers.LdapUtil.FilterEqual("EventId__", this.eventId)),
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
        CheckAuthorizedUser() {
            Log.Info("[Main.CheckAuthorizedUser] call");
            // A user can create/delete a link between project and event if he has at least the read access to both documents
            // TODO check right on event
            return this.QueryProject()
                .Then((projectQueryResult) => {
                const authorized = (projectQueryResult === null || projectQueryResult === void 0 ? void 0 : projectQueryResult.length) >= 1; // use '>=' rather than '===' (VLA/sharding)
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
                const link = Process.CreateTableRecord("Project Event Link__");
                const linkVars = link.GetVars();
                linkVars.AddValue_String("ProjectNumber__", this.projectNumber, true);
                linkVars.AddValue_String("EventId__", this.eventId, true);
                linkVars.AddValue_String("EventName__", Data.GetValue("EventName__"), true);
                linkVars.AddValue_String("EventOwner__", Data.GetValue("EventOwner__"), true);
                linkVars.AddValue_String("EventType__", Data.GetValue("EventType__"), true);
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
            })
                .Catch((reason) => this.SetResultJSON(reason.resultData));
        }
        ActionDelete() {
            Log.Info("[Main.ActionDelete] call");
            return this.CheckAuthorizedUser()
                .Then(() => this.CheckProjectStatus())
                .Then(() => this.DeleteLink())
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
            if (Data.GetValue("State") != 0) {
                const actionByField = Data.GetValue("Action__");
                if (actionByField) {
                    actionName = actionByField;
                }
                else if (!actionName) {
                    actionName = "Create";
                }
                Data.SetValue("Action__", actionName);
            }
            Log.Info(`Action to execute: ${actionName}, for project: ${this.projectNumber}, event: ${this.eventId}`);
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