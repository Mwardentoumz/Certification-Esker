"use strict";
const processID = Process.GetProcessID("P2P - Contract");
function GetContractRuidEX(msnEx) {
    return `CD#${processID}.${msnEx}`;
}
function GetSignatures() {
    let signatures = [];
    const csvHelper = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
    csvHelper.GuessSeparator(); //This read the header to get the separator
    const COLUMNS = {
        LongID: 0,
        ContractNumber: 1,
        ContractName: 2,
        ContractStatus: 3,
        SignatureID: 4,
    };
    while (csvHelper.GetNextLine()) {
        const csvLine = csvHelper.GetCurrentLineArray();
        signatures.push({
            contractRuidex: GetContractRuidEX(csvLine[COLUMNS.LongID]),
            signatureId: csvLine[COLUMNS.SignatureID]
        });
    }
    Log.Info(`GetSignatures : ${JSON.stringify(signatures)}`);
    return signatures;
}
async function main() {
    let docusignSession = new Lib.P2P.Docusign.Session();
    if (docusignSession.IsEnabled()) {
        const signatures = GetSignatures();
        const envelopes = await Lib.P2P.Docusign.GetDocuSignEnvelopesToPoll(docusignSession, signatures);
        for (let [contractRuidex, envelope] of envelopes) {
            if (envelope.status === Lib.P2P.Docusign.EnvelopeStatus.sent && envelope.statusChangedDateTime !== envelope.sentDateTime) // only signers changed
             {
                const signature = {
                    contractRuidex: contractRuidex,
                    signatureId: envelope.envelopeId
                };
                const signers = Lib.P2P.Docusign.GetDocuSignEnvelopeSigners(signature, docusignSession);
                Lib.Contract.Docusign.SaveOptionsInDB(contractRuidex, envelope, signers);
            }
            else {
                Lib.P2P.Docusign.SendDocusignEventToUpdateContract(contractRuidex, envelope);
            }
        }
    }
    else {
        Log.Info("Docusign Integration is disabled in P2P Global settings");
    }
}
main();
//# sourceMappingURL=extractionscript.js.map