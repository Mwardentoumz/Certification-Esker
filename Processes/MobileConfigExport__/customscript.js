"use strict";
if (ProcessInstance.isOpenInPopup) {
    ProcessInstance.SetSilentChange(true);
    Controls.DataPanel.Hide(true);
    const configRuids = ProcessInstance.selectedRuidFromView;
    if (configRuids) {
        let filters = [];
        configRuids.forEach(ruid => {
            filters.push(Sys.Helpers.LdapUtil.FilterEqual("Ruid", ruid));
        });
        const options = {
            table: "MobileConfig__",
            attributes: ["ConfigName__", "OriginalConfiguration__"],
            filter: Sys.Helpers.LdapUtil.FilterOr(...filters).toString(),
            additionalOptions: "FastSearch=-1",
            maxRecords: 100
        };
        Sys.GenericAPI.PromisedQuery(options).Then(results => {
            results.forEach(result => {
                Log.Info(`Doanload mobile configuration "${result.ConfigName__}"`);
                Process.DownloadFile({ data: [result.OriginalConfiguration__], filename: result.ConfigName__, fileExtension: "json" });
            });
        });
    }
    ProcessInstance.Quit("quit");
}
//# sourceMappingURL=customscript.js.map