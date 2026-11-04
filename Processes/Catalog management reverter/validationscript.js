"use strict";
/* eslint-disable class-methods-use-this */
var validationscript;
(function (validationscript) {
    var CatalogManagement = Lib.Purchasing.CatalogManagement;
    class Main {
        constructor(catalogManagementServer, isInternalUpdateRequest) {
            this.catalogManagementServer = catalogManagementServer;
            this.isInternalUpdateRequest = isInternalUpdateRequest;
            this.currentName = Data.GetActionName();
            this.currentAction = Data.GetActionType();
            Log.Info("-- CM reverter validation Script -- Name: '" + (this.currentName ? this.currentName : "<empty>") + "', Action: '" + (this.currentAction ? this.currentAction : "<empty>") + "'");
            if (this.currentName === "" && this.currentAction === "") {
                if (Data.GetValue("State") == 50) {
                    Log.Info("Validation in touchless");
                    this.currentName = "Approve";
                    this.currentAction = "approve";
                }
            }
        }
        async GetCatalogManagementWorkflowTransport() {
            const options = {
                table: "CDNAME#Catalog management workflow",
                filter: Sys.Helpers.LdapUtil.FilterEqual("Ruidex", Data.GetValue("CMWRuidEx__")),
                attributes: ["*"],
                sortOrder: null,
                maxRecords: 1,
                additionalOptions: {
                    returnxTransport: true,
                    recordBuilder: Sys.GenericAPI.BuildQueryResult
                }
            };
            const result = await Sys.GenericAPI.PromisedQuery(options);
            if (result.length === 1) {
                return result[0].record;
            }
        }
        CopyExtractedDataFileFromTransport(transport) {
            const parentAttachs = transport.GetAttachs(false);
            if (parentAttachs) {
                const attachCount = parentAttachs.GetNbAttachs();
                Log.Info(`${attachCount} attach to check on transport`);
                for (let idx = 0; idx < attachCount; idx++) {
                    const attach = parentAttachs.GetAttach(idx);
                    const vars = attach.GetVars();
                    const fileType = vars.GetValue_String("Import_DocumentType", 0);
                    if (fileType in CatalogManagement.FileType) {
                        const file = attach.GetConvertedFile();
                        const isTechnical = vars.GetValue_Long("IsTechnical", 0);
                        const filename = file.GetFileName().split(".")[0];
                        Log.Info(`Copying File : ${fileType}`);
                        CatalogManagement.Server.AddFile(filename, file.GetExtension(), fileType, file.GetContent(), isTechnical === 1);
                    }
                }
            }
        }
        async Start() {
            const transport = await this.GetCatalogManagementWorkflowTransport();
            this.CopyExtractedDataFileFromTransport(transport);
            Lib.P2P.InitValidityDateTime("PAC");
            Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationInMonths");
            // First validation
            if (this.currentName === "Approve" && this.currentAction === "approve") {
                try {
                    const extractedData = await this.catalogManagementServer.ProcessWithExtractedData((extractedData, linesToProcess) => this.catalogManagementServer.RevertLines(extractedData.Lines, linesToProcess));
                    if (this.catalogManagementServer.HasLineWithProcessingError(extractedData.Lines)) {
                        throw new Error("Error while processing");
                    }
                    Lib.CommonDialog.NextAlert.Define("_CM revert success", "_CM revert success message", {
                        isError: false,
                        behaviorName: "CMRevertSuccess"
                    });
                    let transport = Process.GetUpdatableTransportAsProcessAdmin(Data.GetValue("CMWRuidEx__"));
                    this.MarkAsReverted(transport);
                    if (!this.isInternalUpdateRequest) {
                        transport = Process.GetUpdatableTransportAsProcessAdmin(Data.GetValue("CMRuidEx__"));
                        this.MarkAsReverted(transport);
                    }
                }
                catch (e) {
                    Lib.CommonDialog.NextAlert.Define("_CM revert error", "_CM revert error message", {
                        isError: true,
                        behaviorName: "CMRevertFailure"
                    });
                }
            }
        }
        MarkAsReverted(transport) {
            const vars = transport.GetUninheritedVars();
            vars.AddValue_String("Status__", "Reverted", true);
            transport.Process();
            if (transport.GetLastError() !== 0) {
                throw new Error("Cannot process CM. Details: " + transport.GetLastErrorMessage());
            }
        }
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const warehouseid = Variable.GetValueAsString("warehouseid");
        if (warehouseid) {
            throw Error("No revert for warehouse");
        }
        else {
            const isInternalUpdateRequest = CatalogManagement.IsInternalVendorUpdateRequest();
            const mappingVendorItem = new CatalogManagement.MappingVendor();
            const catalogManagementServerVendor = new CatalogManagement.ServerVendor(mappingVendorItem, isInternalUpdateRequest, Number.MAX_VALUE);
            const main = new Main(catalogManagementServerVendor, isInternalUpdateRequest);
            Lib.P2P.HandleScriptError(main.Start());
        }
    }
})(validationscript || (validationscript = {}));
//# sourceMappingURL=validationscript.js.map