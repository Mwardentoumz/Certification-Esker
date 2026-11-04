"use strict";
function GetPOMsnEx(line) {
    // remove " from line and return msnex
    return line.replace(/"/g, "").split('.')[1];
}
function main() {
    const reader = Sys.Helpers.Attach.getReader(0);
    let line;
    let msnExList = [];
    // Skip first line if CSV has header
    reader.getLine();
    while ((line = reader.getLine()) !== null) {
        msnExList.push(GetPOMsnEx(line));
    }
    Log.Info("msnExList :" + msnExList.toString());
    const nbRecordByQuery = 100;
    const nbQueryToDo = msnExList.length / nbRecordByQuery;
    for (let i = 0; i < nbQueryToDo; i++) {
        const queryPOForms = {
            table: "CDNAME#Purchase order V2",
            attributes: ["RuidEx", "MsnEx", "State", "IsInternal__"],
            filter: Sys.Helpers.LdapUtil.FilterIn("MsnEx", msnExList.slice(nbRecordByQuery * i, nbRecordByQuery * (i + 1))).toString(),
            additionalOptions: {
                searchInArchive: true,
                asAdmin: true
            },
            maxRecords: nbRecordByQuery
        };
        Log.Info("queryPOForms: " + JSON.stringify(queryPOForms));
        Sys.GenericAPI.PromisedQuery(queryPOForms)
            .then((POForms) => {
            Log.Info("POForms.length" + POForms.length);
            POForms.forEach(POForm => {
                if (POForm.IsInternal__ == "1") {
                    Log.Warn("PO is internal, skipping " + POForm.RuidEx);
                }
                else if (POForm.State != 90 && POForm.State != 100) {
                    Log.Error("PO ruidex: " + POForm.RuidEx + " not resume because of state " + POForm.State);
                }
                else {
                    const poTransport = Process.GetUpdatableTransportAsProcessAdmin(POForm.RuidEx);
                    poTransport.ResumeWithActionAsync("SynchronizeItems");
                    Log.Info("ResumeWithAction SynchronizeItems delayed " + POForm.RuidEx);
                }
            });
        })
            .catch((err) => Log.Error(err));
    }
}
main();
//# sourceMappingURL=extractionscript.js.map