"use strict";
function InitResultStep() {
    Controls.ImportStepButton__.SetTextColor("color9");
    Controls.SummaryStepButton__.SetTextColor("color8");
}
function InitImportStep() {
    Controls.Submit.SetDisabled(!Controls.AttachmentsPane.IsDocumentLoaded());
    Controls.AttachmentsPane.OnDocumentDeleted = function () {
        Controls.Submit.SetDisabled(!Controls.AttachmentsPane.IsDocumentLoaded());
    };
    Controls.ImportStepButton__.SetTextColor("color8");
    Controls.SummaryStepButton__.SetTextColor("color9");
}
function Initform() {
    const currentStatus = Data.GetValue("Status__");
    switch (currentStatus) {
        case "Approved":
            InitResultStep();
            break;
        case "Draft":
            InitImportStep();
            break;
        default:
    }
}
function run() {
    ProcessInstance.SetSilentChange(true);
    Initform();
}
run();
//# sourceMappingURL=customscript.js.map