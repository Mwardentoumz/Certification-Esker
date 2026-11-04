"use strict";
function getNbConfigurations() {
    const query = Process.CreateQueryAsProcessAdmin();
    query.SetSpecificTable("AP - Application Settings__");
    let nbConfs = query.GetRecordCount();
    return nbConfs;
}
function CalculateNumberOfLinesToSplit() {
    const customizedNbLines = Sys.Helpers.TryCallFunction("Lib.AP.Customization.Payment.CustomizeNbLinesSplit");
    if (customizedNbLines && customizedNbLines > 0) {
        return customizedNbLines;
    }
    const minLinesToSplit = 1000;
    const maxLinesToSplit = 100000;
    let nbConfs = getNbConfigurations();
    let magicNumberToSplit = (101 - nbConfs) * 1000;
    magicNumberToSplit = Math.min(magicNumberToSplit, maxLinesToSplit);
    magicNumberToSplit = Math.max(magicNumberToSplit, minLinesToSplit);
    return magicNumberToSplit;
}
function run() {
    let success = Lib.CSVSplitting.readAndSplit("Vendor invoice payment (SAP)", CalculateNumberOfLinesToSplit());
    if (!success) {
        Data.SetValue("State", 200);
    }
}
run();
//# sourceMappingURL=finalizationscript.js.map