"use strict";
/* LIB_DEFINITION{
  "name": "Lib_Expense_InboundChannelPreprocessing",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Inbound channel preprocessing library",
  "versionable": false,
  "require": [
    "Lib_V12.0.566.0",
    "Lib_P2P.UserLookup_V12.0.566.0",
    "Sys/Sys_Helpers",
    "Sys/Sys_Helpers_LDAPUtil",
    "[Sys/Sys_GenericAPI_Server]"
  ]
}*/
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var InboundChannelPreprocessing;
        (function (InboundChannelPreprocessing) {
            InboundChannelPreprocessing.functions = {
                "Preprocessing for Expense creation": function (inputJSON) {
                    Log.Info("Preprocessing for Expense creation");
                    // Synchronous => COMMON vs SERVER ?!?
                    let senderLogin = null;
                    const environment = Sys.Helpers.Globals.Users.GetUser(Data.GetValue("OwnerId")).GetValue("Environment");
                    const userLookup = new Lib.P2P.StandardUserLookup(environment);
                    Lib.P2P.SearchUser(inputJSON.InboundEmailDetails.FromAddress, userLookup)
                        .Then(userLogin => {
                        senderLogin = userLogin;
                    });
                    // Send notification if email sender has not been found
                    if (!senderLogin) // empty string or null
                     {
                        Log.Info("Send notification to user " + inputJSON.PreprocessingRuleDetails.notifUserLogin);
                        let userToNotify = Sys.Helpers.Globals.Users.GetUser(inputJSON.PreprocessingRuleDetails.notifUserLogin);
                        // Notify user if he/she exists
                        if (userToNotify) {
                            let emailToNotify = userToNotify.GetValue("EmailAddress");
                            const templateName = "Expense_Email_BadSenderFromInboundChannel.htm";
                            let notificationVars = {
                                NotifyFilter: "(state=200)",
                                NotifyAddressType: "SM",
                                NotifyTemplateFile: templateName,
                                NotifyTemplateOwnerID: userToNotify.GetValue("FullDn"),
                                NotifyAddress: emailToNotify,
                                OwnerId: Data.GetValue("OwnerId"),
                                FromName: "Esker Expense Management",
                                FromAddress: "notification@eskerondemand.com",
                                "CustomTag-SenderAddress": inputJSON.InboundEmailDetails.FromAddress,
                                "CustomTag-ValidationUrl": Data.GetValue("ValidationUrl")
                            };
                            Process.AddNotification(notificationVars);
                        }
                        else {
                            Log.Error("User to notify not found or not set: " + inputJSON.PreprocessingRuleDetails.notifUserLogin);
                        }
                        //Put in failed mode
                        Data.SetValue("State", 200);
                        Variable.SetValueAsString("ErrorSenderUnknown", "1");
                        return null;
                    }
                    // Update transports
                    for (var process in inputJSON.transports) {
                        var transport = inputJSON.transports[process];
                        Log.Info("Change ownerLogin from " + transport.ownerLogin + " to " + senderLogin);
                        transport.ownerLogin = senderLogin;
                        for (var attach in transport.attachments) {
                            var attachment = transport.attachments[attach];
                            var vars = attachment.vars;
                            var fileAttached = attachment.attachFile;
                            var fileExtension = fileAttached.split('.').pop().toLowerCase();
                            if ((fileExtension === 'jpg' || fileExtension === 'jpeg') && vars.AttachOutputFormat === ".pdf") {
                                vars.AttachOutputFormat = ""; // don't set explicit conversion format in order to use default expense converter
                            }
                        }
                    }
                    return inputJSON;
                }
            };
        })(InboundChannelPreprocessing = Expense.InboundChannelPreprocessing || (Expense.InboundChannelPreprocessing = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=Lib_Expense_InboundChannelPreprocessing.js.map