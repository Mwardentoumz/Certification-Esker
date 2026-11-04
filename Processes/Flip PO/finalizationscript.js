"use strict";
const options = {
    maxElementsPerRecall: 500
};
Process.SetTimeOut(3600);
const NOT_FINISHED = 0;
const FINISHED = 1;
/**
 * Create the CIData and the CI instance with the CIData attached to the instance
 *
 * @param {string} companyCode
 * @param {string} vendorNumber
 * @param {string} orderNumber
 * @param {additionnalData} structure which contains additionnal data
 */
function createCIInstance(order, interactive) {
    const ciData = Lib.AP.VendorPortal.createCIDataFromPO(order.companyCode, order.vendorNumber, order.orderNumber, order.additionnalData);
    Log.Info("Got CIData: " + JSON.stringify(ciData));
    if (ciData) {
        Lib.AP.VendorPortal.CreateCIFromCIData(ciData, interactive);
    }
    else {
        Log.Warn("Cannot find the PO " + order.orderNumber);
    }
}
function generateCIsFromCSV() {
    const csvHelper = getCSVReader();
    const poList = [];
    let lineCount = 0;
    let line = csvHelper.GetNextLine();
    while (line !== null) {
        lineCount++;
        const lineArray = csvHelper.GetCurrentLineArray();
        if (!isPOAlreadyHandle(lineArray, poList)) {
            if (!Lib.AP.VendorPortal.GetOrCreateVendor({ CompanyCode__: lineArray[0], VendorNumber__: lineArray[1] })) {
                Log.Error("Unable to create the vendor login", lineArray[1], "for the PO", lineArray[2]);
                line = csvHelper.GetNextLine();
                continue;
            }
            createCIInstance({ companyCode: lineArray[0], vendorNumber: lineArray[1], orderNumber: lineArray[2] }, false);
            if (lineCount >= options.maxElementsPerRecall) {
                csvHelper.SerializeCurrentState();
                return NOT_FINISHED;
            }
        }
        line = csvHelper.GetNextLine();
    }
    return FINISHED;
}
/**
 * Reload the current CSVReader from the Variables or create a new one if none exists
 */
function getCSVReader() {
    let csvHelper;
    if (!Variable.GetValueAsString(Sys.Helpers.CSVReader.GetSerializeIdentifier())) {
        csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
        csvHelper.ReturnSeparator = "\n";
        // read first line (Header line) and guess the separator
        csvHelper.GuessSeparator();
    }
    else {
        csvHelper = Sys.Helpers.CSVReader.ReloadInstance("V2");
    }
    return csvHelper;
}
/**
 * Check is a PO was already read from the CSV to avoid duplicate generation of invoice
 * for the same PO number
 * @param {string[]} lineArray The CSV line array to check
 * @param {string[]} postList The list of PO already processed
 * @return {boolean} True if the PO was already processed, false if not
 */
function isPOAlreadyHandle(lineArray, poList) {
    const poLine = lineArray.map(s => s.trim()).join("-");
    if (poList.indexOf(poLine) > -1) {
        Log.Warn(`PO ${lineArray[2]} found twice in the CSV, skipping`);
        return true;
    }
    poList.push(poLine);
    return false;
}
function generateCIFromExternalVariable() {
    // If no CSV is provided, check JSON serialize in external variable
    const jsonOrder = Variable.GetValueAsString(Lib.AP.VendorPortal.FlipPO.VariableOrderToConvert);
    if (jsonOrder) {
        try {
            createCIInstance(JSON.parse(jsonOrder), true);
        }
        catch (_a) {
            Log.Warn(`Unable to extract the order information from OrderToConvert variable: ${jsonOrder}`);
        }
    }
}
function main() {
    if (Attach.GetNbAttach() > 0) {
        if (generateCIsFromCSV() === NOT_FINISHED) {
            Process.RecallScript("flip_po_in_progress", true);
        }
    }
    else {
        generateCIFromExternalVariable();
    }
}
main();
//# sourceMappingURL=finalizationscript.js.map