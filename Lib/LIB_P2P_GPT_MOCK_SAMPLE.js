"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_P2P_GPT_MOCK_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "DO NOT USE IN PRODUCTION. Mock of GPT calls for Testing purpose",
  "versionable": false,
  "require": []
}*/
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var GPT;
        (function (GPT) {
            var Mock;
            (function (Mock) {
                function Load(promptSetting) {
                    promptSetting["Contract-Completion"].mockGPTCompletion = Lib.P2P.GPT.Mock.ContractCompletion;
                    promptSetting["Contract-Compliancy"].mockGPTCompletion = Lib.P2P.GPT.Mock.ContractCompliancy;
                    promptSetting["Contract-AnalysisTranslation"].mockGPTCompletion = Lib.P2P.GPT.Mock.ContractAnalysisTranslation;
                    promptSetting["Contract-DeduplicateItems"].mockGPTCompletion = Lib.P2P.GPT.Mock.ContractDeduplicateItems;
                }
                Mock.Load = Load;
                async function ContractCompletion({ prompts, maxTokens = 2000, temperature = 0.1, topP, stop, functionsCall, model }) {
                    return JSON.stringify({
                        "ReferenceNumber": {
                            "value": "CT-PACIT-001",
                            "sentence": "Ref. : CT-PACIT-001"
                        },
                        "ContractName": {
                            "value": "Supply Agreement",
                            "sentence": "This Supply Agreement ('Framework Agreement') is entered into on this date: 1st January 2026"
                        },
                        "Description": {
                            "value": "Agreement for supply of packaging materials.",
                            "sentence": "WHEREAS, the Supplier is in the business of providing packaging materials suitable for the Buyer's needs;"
                        },
                        "ContractType": {
                            "value": "Framework agreement",
                            "sentence": "This Supply Agreement ('Framework Agreement') is entered into on this date: 1st January 2026"
                        },
                        "Vendor": {
                            "Name": {
                                "value": "PackItUp Inc.",
                                "sentence": "PackItUp Inc."
                            },
                            "Email": {
                                "value": "",
                                "sentence": ""
                            },
                            "Fax": {
                                "value": "",
                                "sentence": ""
                            }
                        },
                        "StartDateContract": {
                            "value": "2026-01-01",
                            "sentence": "This Agreement shall commence on January 1,2026"
                        },
                        "EndDateContract": {
                            "value": "2026-12-31",
                            "sentence": "This Agreement shall commence on January 1,2026, and end on December 31,2026"
                        },
                        "TermMonths": {
                            "value": 12,
                            "sentence": "This Agreement shall commence on January 1,2026, and end on December 31,2026"
                        },
                        "AutomaticRenewal": {
                            "value": true,
                            "sentence": "This Agreement shall automatically renew for successive one-year terms unless either party provides written notice of its intent not to renew at least 90 days prior to the end of the then-current term."
                        },
                        "RenewalTerm": {
                            "value": 12,
                            "sentence": "This Agreement shall automatically renew for successive one-year terms unless either party provides written notice of its intent not to renew at least 90 days prior to the end of the then-current term."
                        },
                        "PeriodOfNotice": {
                            "value": 90,
                            "sentence": "This Agreement shall automatically renew for successive one-year terms unless either party provides written notice of its intent not to renew at least 90 days prior to the end of the then-current term."
                        },
                        "Currency": {
                            "value": "",
                            "sentence": ""
                        },
                        "MinimumSpend": {
                            "value": "",
                            "sentence": ""
                        },
                        "MaximumSpend": {
                            "value": "",
                            "sentence": ""
                        },
                        "DeliveryLeadTime": {
                            "value": 2,
                            "sentence": "Delivery lead time: The Supplier shall deliver the goods no later than 2 days after receipt of the order."
                        },
                        "Items": []
                    });
                }
                Mock.ContractCompletion = ContractCompletion;
                async function ContractCompliancy({ prompts, maxTokens = 2000, temperature = 0.1, topP, stop, functionsCall, model }) {
                    const policy = prompts[1].content.split("\n")[1];
                    return JSON.stringify({
                        "compliant": false,
                        "sentence": `GPT found sentence prompt: ${policy}`,
                        "commentary": `GPT found advice prompt: ${policy}`
                    });
                }
                Mock.ContractCompliancy = ContractCompliancy;
                async function ContractAnalysisTranslation({ prompts, maxTokens = 2000, temperature = 0.1, topP, stop, functionsCall, model }) {
                    let validationOwnerID = Data.GetValue("ValidationOwnerID");
                    if (Sys.Helpers.IsEmpty(validationOwnerID)) {
                        validationOwnerID = Data.GetValue("OwnerID");
                    }
                    const languageCode = Users.GetUserAsProcessAdmin(validationOwnerID).GetValue("Language");
                    const regexClauses = /to translate each commentary :(.*)$/;
                    var arrayClause = JSON.parse(prompts[1].content.match(regexClauses)[1]);
                    if (arrayClause && arrayClause.length > 0) {
                        arrayClause.map((clause) => {
                            clause.commentary = `MOCK: Translatation to ${languageCode} of ${clause.commentary}`;
                            return clause;
                        });
                    }
                    return JSON.stringify(arrayClause);
                }
                Mock.ContractAnalysisTranslation = ContractAnalysisTranslation;
                async function ContractDeduplicateItems({ prompts, maxTokens = 2000, temperature = 0.1, topP, stop, functionsCall, model }) {
                    return JSON.stringify({
                        "ItemSupplierPartID": {
                            "value": "GPT founded Part ID"
                        },
                        "LongDescription": {
                            "value": "GPT founded long description"
                        },
                        "Price": {
                            "value": 10,
                        }
                    });
                }
                Mock.ContractDeduplicateItems = ContractDeduplicateItems;
            })(Mock = GPT.Mock || (GPT.Mock = {}));
        })(GPT = P2P.GPT || (P2P.GPT = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_GPT_MOCK_SAMPLE.js.map