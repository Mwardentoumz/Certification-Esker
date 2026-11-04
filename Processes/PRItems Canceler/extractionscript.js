"use strict";
// set some values on record
Lib.Purchasing.InitTechnicalFields(false, false);
var ancestorsids = Variable.GetValueAsString("AncestorsRuid").split("|");
var filter = "", options = { resetItems: true, orderByMsn: null };
var i;
for (i = 0; i < ancestorsids.length; i++) {
    if (ancestorsids[i].startsWith("CT#")) {
        // It's a PR item
        var msn = ancestorsids[i].split('.')[1];
        filter += "(MSN=" + msn + ")";
        if (!options.orderByMsn) {
            options.orderByMsn = [];
        }
        options.orderByMsn.push(msn);
    }
}
if (i > 1) {
    filter = "(|" + filter + ")";
}
// only no completely ordered items for this ruidex
Log.Info("Filling PRItems Canceler Form with items from filter: " + filter);
Lib.Purchasing.PRICancelerItems.FillForm(filter, options)
    .Catch(function (e) {
    Lib.CommonDialog.NextAlert.Define("_PRItems Canceler creation error", e, { isError: true, behaviorName: "PRICanclerInitError" });
});
//# sourceMappingURL=extractionscript.js.map