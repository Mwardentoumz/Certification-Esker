"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CUSTOMIZATION_FRB2BPOLLING_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Customization library for the Sys_FRB2B_PDP_SG5_Flows_Polling process",
  "versionable": false,
  "require": []
}*/
/**
 * Customization library for the unified French B2B polling process Sys_FRB2B_PDP_SG5_Flows_Polling.
 * @namespace Lib.Customization.FRB2BPolling
 */
var Lib;
(function (Lib) {
    var Customization;
    (function (Customization) {
        var FRB2BPolling;
        (function (FRB2BPolling) {
            /**
             * @method Lib.Customization.FRB2BPolling.CustomizeFetchUnprocessedFlowsQueryParam
             * @since 358
             * @description
             * Callback used to customize the HTTP query parameters sent to PDP when searching
             * unprocessed flows in `fetchUnprocessedFlows` (unified polling process).
             *
             * Return the updated params to apply changes. Return `undefined`/`null` to keep default params.
             * Mutating the input object without returning it is not supported.
             *
             * @param {Sys.GenericAPI.HTTPRequestParam} queryParam Default HTTP query parameters.
             * @returns {Sys.GenericAPI.HTTPRequestParam | void} Updated HTTP query parameters.
             * @example
             * <pre><code>
             * CustomizeFetchUnprocessedFlowsQueryParam: function (queryParam)
             * {
             * 	queryParam.headers["X-Custom-Header"] = "UnprocessedFlows";
             * 	return queryParam;
             * }
             * </code></pre>
             */
            FRB2BPolling.CustomizeFetchUnprocessedFlowsQueryParam = function (queryParam) {
            };
            /**
             * @method Lib.Customization.FRB2BPolling.CustomizeRunContext
             * @since 358
             * @description
             * Callback invoked once per run, before PDP configurations are resolved in the unified
             * polling process `Sys_FRB2B_PDP_SG5_Flows_Polling`.
             *
             * It allows to inspect and modify the task-level `runContext` (for example to override
             * the direction, the flow types or the polling time window for all configurations).
             *
             * The input object can be mutated in place; the (possibly mutated) object is then used by the
             * process. Returning a run context also replaces the one used by the process. Returning
             * `undefined`/`null` keeps the run context as mutated in place. The resulting context is used to
             * create the configuration and ordered-phase contexts for the run.
             *
             * @param {Sys.EDI.FRB2B.Polling.Helpers.RunContext} runContext The task-level run context.
             * @returns {Sys.EDI.FRB2B.Polling.Helpers.RunContext | void} The updated run context, or nothing to keep the in-place mutations.
             * @example
             * <pre><code>
             * CustomizeRunContext: function (runContext)
             * {
             * 	// Only poll incoming flows for this task.
             * 	if (runContext.taskName === "MY_POLLING_TASK")
             * 	{
             * 		runContext.direction = "IN";
             * 	}
             * 	return runContext;
             * }
             * </code></pre>
             */
            FRB2BPolling.CustomizeRunContext = function (runContext) {
            };
        })(FRB2BPolling = Customization.FRB2BPolling || (Customization.FRB2BPolling = {}));
    })(Customization = Lib.Customization || (Lib.Customization = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Customization_FRB2BPolling_Sample.js.map