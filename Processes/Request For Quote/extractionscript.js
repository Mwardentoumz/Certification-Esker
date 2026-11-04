"use strict";
var ExtractionScript;
(function (ExtractionScript) {
    var NamedLog = Lib.P2P.Logger.NamedLog;
    class Main {
        constructor() {
            this.logger = new NamedLog({ namespace: "Request for Quote" });
        }
        async Start() {
            let actionName = Data.GetActionName();
            let actionType = Data.GetActionType();
            Log.Info(`-- RFQ Extraction Script -- Name: '${actionName || "<empty>"}', Action: '${actionType || "<empty>"}'`);
            FillIntakeRequestNumberFromTechnicalData();
            Lib.P2P.SetTablesToIndex(["ItemsToSource__", "Suppliers__"]);
            const rfqDataStr = Variable.GetValueAsString("RFQData");
            if ((actionName === "" && actionType === "") && (rfqDataStr !== "")) {
                const rfqData = this.ParseRFQData(rfqDataStr);
                if (rfqData) {
                    let companyCode = Data.GetValue("CompanyCode__");
                    if (!companyCode) {
                        companyCode = (await Lib.P2P.UserProperties.QueryValues(Lib.P2P.GetOwner().GetValue("Login"))).CompanyCode__;
                    }
                    const ccFound = await Lib.Sourcing.RFQ.UpdateDependencies(companyCode, true);
                    if (!ccFound) {
                        Log.Error(`The requested company code (${companyCode}) is not in the company code table.`);
                    }
                    this.logger.Info("Filling RFQ from external RFQData variable");
                    await Lib.Sourcing.RFQ.FillRFQFromData(rfqData);
                    if (Variable.GetValueAsString("AutoSubmitRFQ") === "true") {
                        Log.Info("Check data for RFQ auto-submission");
                        Lib.Sourcing.RFQ.Checks.CheckAll();
                        if (Data.FormHasError()) {
                            Log.Error("RFQ not auto-submitted due to invalid data");
                            Lib.Sourcing.RFQ.Save();
                            sendNotificationRFQAutoSubmitError("_A Quote Request was not automatically submitted", "Sourcing_Email_NotifAutoRFQError.htm");
                        }
                        else {
                            Data.SetValue("AutomaticRFQSubmit__", true);
                        }
                    }
                    else if (IsRFQCreatedFromIntakeRequest()) {
                        Lib.Sourcing.RFQ.Save();
                        SendNotificationRFQToFinalize();
                    }
                }
            }
        }
        ParseRFQData(rfqDataStr) {
            try {
                return JSON.parse(rfqDataStr);
            }
            catch (e) {
                this.logger.Error(`Error parsing RFQData: ${e}`);
            }
        }
    }
    ExtractionScript.Main = Main;
    function FillIntakeRequestNumberFromTechnicalData() {
        Log.Info("Filling IntakeRequestNumber__ from TechnicalData");
        if (!Sys.Helpers.IsEmpty(Data.GetValue("IntakeRequestNumber__"))) {
            return;
        }
        Log.Info("IntakeRequestNumber__ is empty, trying to fill it from TechnicalData");
        const intakeRequestNumber = Sys.TechnicalData.GetValue("IntakeRequestNumber") || "";
        if (!Sys.Helpers.IsEmpty(intakeRequestNumber)) {
            Log.Info(`Filling IntakeRequestNumber__ with value from TechnicalData: ${intakeRequestNumber}`);
            Data.SetValue("IntakeRequestNumber__", intakeRequestNumber);
        }
    }
    function IsRFQCreatedFromIntakeRequest() {
        return !Sys.Helpers.IsEmpty(Sys.TechnicalData.GetValue("IntakeRequestRuidEx"));
    }
    function sendNotificationRFQAutoSubmitError(subject, template) {
        const options = {
            userId: Data.GetValue("RequesterID__"),
            subject: subject,
            template: template,
            fromName: "_EskerSourcingFromName",
            backupUserAsCC: true,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
            customTags: {
                RFQUrl: Data.GetValue("ValidationUrl"),
                RFQNumber__: Data.GetValue("RFQNumber__"),
                RFQName__: Data.GetValue("RFQName__"),
                RequesterName__: Data.GetValue("RequesterName__")
            }
        };
        Log.Info("Sending RFQ auto-submit error notification to: " + options.userId);
        Lib.P2P.EmailNotification.SendEmailNotification(options);
    }
    function SendNotificationRFQToFinalize() {
        const options = {
            userId: Data.GetValue("RequesterID__"),
            template: "Sourcing_Email_NotifRFQToFinalize.htm",
            fromName: "_EskerSourcingFromName",
            backupUserAsCC: true,
            sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false),
            customTags: {
                RFQUrl: Data.GetValue("ValidationUrl"),
                RFQNumber__: Data.GetValue("RFQNumber__"),
                RFQName__: Data.GetValue("RFQName__"),
                RequesterName__: Data.GetValue("RequesterName__"),
                IntakeRequestNumber__: Data.GetValue("IntakeRequestNumber__")
            }
        };
        Log.Info("Sending RFQ finalization notification to: " + options.userId);
        Lib.P2P.EmailNotification.SendEmailNotification(options);
    }
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const main = new Main();
        Lib.P2P.HandleScriptError(main.Start());
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map