"use strict";
var extractionscript;
(function (extractionscript) {
    let currentName = Data.GetActionName();
    let currentAction = Data.GetActionType();
    Log.Info(`-- Transaction Parser Extraction Script -- Name: '${currentName ? currentName : "<empty>"}', Action: '${currentAction ? currentAction : "<empty>"}'`);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // MAIN
    //#region  ISOCC (number) to CC (Alphabetic code)
    const ISOCurrencyCodeToCurrencyCode = {
        "971": "AFN",
        "978": "EUR",
        "008": "ALL",
        "012": "DZD",
        "840": "USD",
        "973": "AOA",
        "951": "XCD",
        "032": "ARS",
        "051": "AMD",
        "533": "AWG",
        "036": "AUD",
        "944": "AZN",
        "044": "BSD",
        "048": "BHD",
        "050": "BDT",
        "052": "BBD",
        "933": "BYN",
        "084": "BZD",
        "952": "XOF",
        "060": "BMD",
        "356": "INR",
        "064": "BTN",
        "068": "BOB",
        "984": "BOV",
        "977": "BAM",
        "072": "BWP",
        "578": "NOK",
        "986": "BRL",
        "096": "BND",
        "975": "BGN",
        "108": "BIF",
        "132": "CVE",
        "116": "KHR",
        "950": "XAF",
        "124": "CAD",
        "136": "KYD",
        "152": "CLP",
        "990": "CLF",
        "156": "CNY",
        "170": "COP",
        "970": "COU",
        "174": "KMF",
        "976": "CDF",
        "554": "NZD",
        "188": "CRC",
        "191": "HRK",
        "192": "CUP",
        "931": "CUC",
        "532": "ANG",
        "203": "CZK",
        "208": "DKK",
        "262": "DJF",
        "214": "DOP",
        "818": "EGP",
        "222": "SVC",
        "232": "ERN",
        "748": "SZL",
        "230": "ETB",
        "238": "FKP",
        "242": "FJD",
        "953": "XPF",
        "270": "GMD",
        "981": "GEL",
        "936": "GHS",
        "292": "GIP",
        "320": "GTQ",
        "826": "GBP",
        "324": "GNF",
        "328": "GYD",
        "332": "HTG",
        "340": "HNL",
        "344": "HKD",
        "348": "HUF",
        "352": "ISK",
        "360": "IDR",
        "960": "XDR",
        "364": "IRR",
        "368": "IQD",
        "376": "ILS",
        "388": "JMD",
        "392": "JPY",
        "400": "JOD",
        "398": "KZT",
        "404": "KES",
        "408": "KPW",
        "410": "KRW",
        "414": "KWD",
        "417": "KGS",
        "418": "LAK",
        "422": "LBP",
        "426": "LSL",
        "710": "ZAR",
        "430": "LRD",
        "434": "LYD",
        "756": "CHF",
        "446": "MOP",
        "807": "MKD",
        "969": "MGA",
        "454": "MWK",
        "458": "MYR",
        "462": "MVR",
        "929": "MRU",
        "480": "MUR",
        "965": "XUA",
        "484": "MXN",
        "979": "MXV",
        "498": "MDL",
        "496": "MNT",
        "504": "MAD",
        "943": "MZN",
        "104": "MMK",
        "516": "NAD",
        "524": "NPR",
        "558": "NIO",
        "566": "NGN",
        "512": "OMR",
        "586": "PKR",
        "590": "PAB",
        "598": "PGK",
        "600": "PYG",
        "604": "PEN",
        "608": "PHP",
        "985": "PLN",
        "634": "QAR",
        "946": "RON",
        "643": "RUB",
        "646": "RWF",
        "654": "SHP",
        "882": "WST",
        "930": "STN",
        "682": "SAR",
        "941": "RSD",
        "690": "SCR",
        "694": "SLL",
        "702": "SGD",
        "994": "XSU",
        "090": "SBD",
        "706": "SOS",
        "728": "SSP",
        "144": "LKR",
        "938": "SDG",
        "968": "SRD",
        "752": "SEK",
        "947": "CHE",
        "948": "CHW",
        "760": "SYP",
        "901": "TWD",
        "972": "TJS",
        "834": "TZS",
        "764": "THB",
        "776": "TOP",
        "780": "TTD",
        "788": "TND",
        "949": "TRY",
        "934": "TMT",
        "800": "UGX",
        "980": "UAH",
        "784": "AED",
        "997": "USN",
        "858": "UYU",
        "940": "UYI",
        "927": "UYW",
        "860": "UZS",
        "548": "VUV",
        "928": "VES",
        "704": "VND",
        "886": "YER",
        "967": "ZMW",
        "932": "ZWL",
        "955": "XBA",
        "956": "XBB",
        "957": "XBC",
        "958": "XBD",
        "963": "XTS",
        "999": "XXX",
        "959": "XAU",
        "964": "XPD",
        "962": "XPT",
        "961": "XAG"
    };
    //#endregion
    async function Run() {
        Lib.Expense.Transaction.Parser.Management.Init();
        await Sys.Helpers.TryCallFunction("Lib.Expense.Transaction.Customization.Server.OnBeforeParsing");
        await ParseTransaction();
        await Sys.Helpers.TryCallFunction("Lib.Expense.Transaction.Customization.Server.OnAfterParsing");
    }
    extractionscript.Run = Run;
    async function ParseTransaction() {
        if (!Lib.Expense.Transaction.Parser.Management.RunParsing(0)) {
            Log.Error("Something went wrong with parsing (No parser found for this file or error during parsing)");
            let error = Lib.Expense.Transaction.Parser.Management.GetLastError();
            Lib.CommonDialog.NextAlert.Define("_Extraction Error title", error.message, { isError: true });
            Variable.SetValueAsString("IgnoreValidationScriptAndPutInError", "true");
            const currentUser = Users.GetUser(Data.GetValue("OwnerId"));
            Lib.Expense.Transaction.Parser.Management.SendExtractionErrorNotification(currentUser.GetValue("Login"));
            return Sys.Helpers.Promise.Resolve();
        }
        const tableTransaction = Data.GetTable("LineTransaction__");
        let userQuerypromises = [];
        Sys.Helpers.Data.ForEachTableItem(tableTransaction, function (item) {
            //Currency code
            let isoLocalCurrencyCode = item.GetValue("ISOLocalCurrencyCode__");
            let isoBilledCurrencyCode = item.GetValue("ISOBilledCurrencyCode__");
            if (!item.GetValue("BilledCurrencyCode__") && isoBilledCurrencyCode) {
                if (isoBilledCurrencyCode in ISOCurrencyCodeToCurrencyCode) {
                    item.SetValue("BilledCurrencyCode__", ISOCurrencyCodeToCurrencyCode[isoBilledCurrencyCode]);
                }
            }
            if (!item.GetValue("LocalCurrencyCode__") && isoLocalCurrencyCode) {
                if (isoLocalCurrencyCode in ISOCurrencyCodeToCurrencyCode) {
                    item.SetValue("LocalCurrencyCode__", ISOCurrencyCodeToCurrencyCode[isoLocalCurrencyCode]);
                }
            }
            //EmployeeID__ EmployeeName__ EmployeeLogin__
            //UserNumber__ CC4-123456 , Sam CCOwner4  UserLogin__ ccowner4process.acoq@esker.com
            let employeeID = item.GetValue("EmployeeID__");
            if (employeeID) {
                userQuerypromises.push(Lib.P2P.UserProperties.QueryValuesByUserNumber(employeeID)
                    .Then((result) => {
                    item.SetValue("EmployeeLogin__", result.UserLogin__);
                    const employee = Users.GetUser(result.UserLogin__);
                    item.SetValue("EmployeeName__", employee.GetValue("DisplayName"));
                    Log.Info(`Transaction ${item.GetValue("TransactionID__")} is linked to ${employee.GetValue("DisplayName")}`);
                })
                    .Catch((error) => {
                    if (Lib.P2P.UserProperties.QueryNoResult != error) {
                        Log.Error("Error in get user properties with user number " + employeeID + " error :" + error);
                    }
                }));
            }
            else {
                Log.Warn(`Employee ID is missing for transaction ${item.GetValue("TransactionID__")}`);
            }
        });
        return Sys.Helpers.Promise.All(userQuerypromises).Then(() => {
            Log.Info("Parsing done");
        });
    }
})(extractionscript || (extractionscript = {}));
if (typeof _ENV_TEST_ENABLED === "undefined") {
    extractionscript.Run();
}
//# sourceMappingURL=extractionscript.js.map