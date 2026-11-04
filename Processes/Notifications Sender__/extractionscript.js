"use strict";
var ValidationScript;
(function (ValidationScript) {
    var P2PNotification = Lib.P2P.Notification;
    function ComputeRuidex(id) {
        return `CT#${Process.GetProcessID("P2P - Notification__")}.${id}`;
    }
    function ParseCSV(csvValues) {
        const [longID, processName, processKeyName, processKeyValue, name, executionDate, type, fromName, receivers, backupUserAsCC, sendToAllMembersIfGroup, escapeCustomTags, lastConsumedDateTime, lastSentDateTime, validationURL, executionSettings] = csvValues;
        let notif = new P2PNotification.Notification(processName, processKeyName, processKeyValue);
        notif.ruidex = ComputeRuidex(longID);
        notif.executionDate = new Date(executionDate);
        notif.name = name;
        notif.FromName = fromName;
        notif.receivers = receivers.split(P2PNotification.Notification.receiversSeparator);
        notif.validationURL = validationURL;
        notif.type = type;
        notif.backupUserAsCC = Sys.Helpers.String.ToBoolean(backupUserAsCC);
        notif.escapeCustomTags = Sys.Helpers.String.ToBoolean(escapeCustomTags);
        notif.sendToAllMembersIfGroup = Sys.Helpers.String.ToBoolean(sendToAllMembersIfGroup);
        notif.lastConsumedDateTime = Sys.Helpers.Date.ISOSTringToDate(lastConsumedDateTime);
        notif.lastSentDateTime = Sys.Helpers.Date.ISOSTringToDate(lastSentDateTime);
        notif.ParseSettings(executionSettings);
        return notif;
    }
    async function ProcessNotifications() {
        Log.Info("Reading CSV");
        const csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
        csvReader.GuessSeparator();
        let processedCount = 0;
        try {
            const notifs = [];
            csvReader.ForEach(line => {
                line = csvReader.GetCurrentLineArray();
                const notif = ParseCSV(line);
                notifs.push(notif);
                processedCount++;
            });
            await P2PNotification.Server.ProcessAll(notifs);
        }
        catch (e) {
            Log.Error("Error parsing CSV file. " + e);
        }
        finally {
            Log.Info(`${processedCount} lines processed`);
        }
    }
    ValidationScript.ProcessNotifications = ProcessNotifications;
})(ValidationScript || (ValidationScript = {}));
/**
 * START
 */
ValidationScript.ProcessNotifications();
//# sourceMappingURL=extractionscript.js.map