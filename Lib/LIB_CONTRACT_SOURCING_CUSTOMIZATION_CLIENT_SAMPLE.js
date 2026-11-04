"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_CONTRACT_SOURCING_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Contract sourcing scripts on client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Contract sourcing client script customization callbacks
 *
 * Timeline of user exit calls
 * ------------------
 * @namespace Lib.Contract.Customization.Sourcing.Client
 */
var Lib;
(function (Lib) {
    var Contract;
    (function (Contract) {
        var Customization;
        (function (Customization) {
            var Sourcing;
            (function (Sourcing) {
                var Client;
                (function (Client) {
                    /**
                     * @method Lib.Contract.Customization.Sourcing.Client.EnrichDataFromSourcingModule
                     * @description Allows you to customize the json sent by MD to add some extra information like "item category"
                     * @param {Lib.Contract.Sourcing.SourcingData} data SourcingData value from MD
                     * @returns {Lib.Contract.Sourcing.SourcingData} the "data" we enrich
                     * @example
                     *  <pre><code>
                     * EnrichDataFromSourcingModule: function (data)
                     * {
                     *	if (data)
                        {
                            if (data.ItemsToCreate__)
                            {
                                data.ItemsToCreate__.forEach((item) =>
                                {
                                    if (item.ItemDescription__.toLowerCase().includes("screen"))
                                    {
                                        item.UNSPSC__ = "43211902";
                                        item.ItemSupplyTypeName__ = "Peripherals";
                                    }
                
                
                                    if (data.CombinedVendor__.toLowerCase().includes("acme"))
                                    {
                                        item.ItemLeadTime__ = 10;
                                    }
                                });
                            }
                            const curDate = new Sys.Helpers.Globals.Date();
                            data.StartDate__ = curDate.toISOString();
                            data.EndDate__ = "2024-12-31";
                        }
                        return data;
                     * }
                     * </code></pre>
                     */
                    Client.EnrichDataFromSourcingModule = function (data) {
                        return Sys.Helpers.Promise.Resolve(data);
                    };
                })(Client = Sourcing.Client || (Sourcing.Client = {}));
            })(Sourcing = Customization.Sourcing || (Customization.Sourcing = {}));
        })(Customization = Contract.Customization || (Contract.Customization = {}));
    })(Contract = Lib.Contract || (Lib.Contract = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CONTRACT_SOURCING_CUSTOMIZATION_CLIENT_SAMPLE.js.map