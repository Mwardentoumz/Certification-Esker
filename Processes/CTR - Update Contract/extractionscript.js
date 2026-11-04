"use strict";
var ExtractionScript;
(function (ExtractionScript) {
    // TODO replace by language.translate
    const COLUMNS = {
        MSNEX: 0,
        NAME__: 1,
        REFERENCENUMBER__: 2,
        CONTRACTSTATUS__: 3,
        EFFECTIVEDATE__: 4,
        ENDDATE__: 5,
        TACITRENEWAL__: 6,
        DONOTNOTIFYONNOTIFICATIONDATEREACHED__: 7,
        NOTIFICATIONDATE__: 8,
        INITIALLYEXPECTEDENDDATE__: 9,
        OWNERID: 10,
        CREATOROWNERID: 11,
        ORIGINALOWNERID: 12,
        CREATEONBEHALF: 13,
        OWNERLOGIN__: 14,
        REQUESTERLOGIN__: 15,
        SEND: 16
    };
    let contracts = [];
    let usersToNotify = new Set();
    function ReadCSV() {
        Log.Info("ReadCSV: START");
        const csvReader = Sys.Helpers.CSVReader.CreateInstance(0, "V2");
        csvReader.ReturnSeparator = "\n";
        csvReader.GuessSeparator(); // Warning: it reads the first line
        Log.Info("Guessed separator: " + csvReader.SplitSeparator);
        let count = 0;
        while (csvReader.GetNextLine()) {
            try {
                count++;
                const parsedLine = csvReader.GetCurrentLineArray();
                Log.Info(`Contract ${count}: ${parsedLine}`);
                const endDate = new Date(parsedLine[COLUMNS.ENDDATE__]);
                const effectiveDate = new Date(parsedLine[COLUMNS.EFFECTIVEDATE__]);
                const tacitRenewal = Sys.Helpers.String.ToBoolean(parsedLine[COLUMNS.TACITRENEWAL__]);
                const notifDateEnabled = !Sys.Helpers.String.ToBoolean(parsedLine[COLUMNS.DONOTNOTIFYONNOTIFICATIONDATEREACHED__]);
                const notifDate = new Date(parsedLine[COLUMNS.NOTIFICATIONDATE__]);
                const initiallyExpectedEndDate = !Sys.Helpers.IsEmpty(parsedLine[COLUMNS.INITIALLYEXPECTEDENDDATE__]) ? new Date(parsedLine[COLUMNS.INITIALLYEXPECTEDENDDATE__]) : null;
                const contract = {
                    RuidEx: GetRuidEX(parsedLine[COLUMNS.MSNEX]),
                    Name: parsedLine[COLUMNS.NAME__],
                    OwnerId: parsedLine[COLUMNS.OWNERID],
                    Status: parsedLine[COLUMNS.CONTRACTSTATUS__],
                    EffectiveDate: effectiveDate,
                    EndDate: endDate,
                    TacitRenewal: tacitRenewal,
                    NotificationDateEnabled: notifDateEnabled,
                    NotificationDate: notifDate,
                    InitiallyExpectedEndDate: initiallyExpectedEndDate,
                    Notifiable: true,
                    UsersToNotify: [],
                    ContractOwnerLogin: parsedLine[COLUMNS.OWNERLOGIN__],
                    RequesterLogin: parsedLine[COLUMNS.REQUESTERLOGIN__]
                };
                if (contract.ContractOwnerLogin) {
                    contract.UsersToNotify.push(contract.ContractOwnerLogin);
                }
                Sys.Helpers.TryCallFunction("Lib.Contract.Management.Customization.Server.AddUsersToNotifyOnContractExpiryOrRenewal", parsedLine, contract.UsersToNotify);
                // Clean user list
                contract.UsersToNotify = contract.UsersToNotify
                    .filter(userId => Sys.Helpers.IsString(userId) && userId.trim() !== "")
                    .map(userId => userId.trim().toLowerCase());
                contracts.push(contract);
            }
            catch (e) {
                Log.Error(`Error parsing CSV file. Ligne ${count}\n${e}`);
            }
        }
        Log.Info(`ReadCSV: END. ${count} contract(s) found.`);
    }
    function GetRuidEX(msnEx) {
        const processID = Process.GetProcessID("P2P - Contract");
        return `CD#${processID}.${msnEx}`;
    }
    function ManageContracts() {
        Log.Info("ManageContracts: START");
        for (const contract of contracts) {
            const effectiveDate = contract.EffectiveDate ? Sys.Helpers.Date.NormalizeToEskerDate(contract.EffectiveDate) : null;
            const endDate = contract.EndDate ? Sys.Helpers.Date.NormalizeToEskerDate(contract.EndDate) : null;
            const isEffectiveDateReached = contract.Status === Lib.Contract.Status.ApprovedPendingActivation && !Sys.Helpers.Date.IsDateInFuture(effectiveDate);
            const isExpired = contract.Status === Lib.Contract.Status.Active && Sys.Helpers.Date.IsDateInPast(endDate);
            const canNotifyExpiration = contract.NotificationDateEnabled && Sys.Helpers.Date.IsToday(contract.NotificationDate);
            if (isEffectiveDateReached || isExpired) {
                if (contract.Status === Lib.Contract.Status.ApprovedPendingActivation) {
                    Log.Info(`Contract effectiveDate passed for contract: ${contract.Name}' , call UpdateContract.`);
                }
                else {
                    Log.Info(`Contract endDate passed for contract: ${contract.Name}' , call UpdateContract.`);
                }
                const ctrTransport = Process.GetUpdatableTransportAsProcessAdmin(contract.RuidEx);
                //ResumeWithActionAsync works with record in state = 100 where ResumeWithAction does not. TODO : ResumeWithAction should work with record in state 100
                ctrTransport.ResumeWithActionAsync("UpdateContract");
                contract.Notifiable = false;
            }
            else if (canNotifyExpiration) {
                // notif
                Log.Info(`New contract close to end or renewal: '${contract.Name}'. ${contract.OwnerId} will be notified`);
                for (const userId of contract.UsersToNotify) {
                    usersToNotify.add(userId);
                }
            }
            else {
                Log.Info(`Contract close to end or renewal '${contract.Name}'. ${contract.OwnerId} but already notified`);
            }
        }
        Log.Info("ManageContracts: END.");
    }
    async function SendNotifs() {
        const contractNotifiable = contracts.filter(c => c.Notifiable !== false);
        const groupedContractToNotify = {};
        function groupContractByUserToNotify(userID, contract) {
            if (usersToNotify.has(userID)) {
                if (groupedContractToNotify[userID]) {
                    groupedContractToNotify[userID].push(contract);
                }
                else {
                    groupedContractToNotify[userID] = [contract];
                }
            }
        }
        for (const contract of contractNotifiable) {
            const uniqueUsersToNotify = new Set(contract.UsersToNotify); // to avoid duplicate user IDs
            for (const userId of uniqueUsersToNotify) {
                groupContractByUserToNotify(userId, contract);
            }
        }
        for (const userId in groupedContractToNotify) {
            if (groupedContractToNotify.hasOwnProperty(userId)) {
                groupedContractToNotify[userId].sort((a, b) => Sys.Helpers.Date.CompareDate(a.EndDate, b.EndDate));
                let contractsCloseToEnd = 0;
                let contractsCloseToRenewal = 0;
                for (const contract of groupedContractToNotify[userId]) {
                    if (contract.TacitRenewal && !Sys.Helpers.IsEmpty(contract.InitiallyExpectedEndDate)) {
                        contractsCloseToRenewal++;
                    }
                    else {
                        contractsCloseToEnd++;
                    }
                }
                Log.Info(`Send notif to ${userId} for ${contractsCloseToEnd} contracts close to end and ${contractsCloseToRenewal} contracts close to renewals.`);
                const user = Users.GetUser(userId);
                let userEmail;
                let userIdToNotify;
                if (user) {
                    userIdToNotify = userId;
                    userEmail = user.GetValue("EmailAddress");
                }
                else {
                    const adminUser = await Lib.P2P.GetAccountAdminUser();
                    if (adminUser) {
                        Log.Info(`Send notif to (ADMIN) ${adminUser.login} as ${userId} is not found`);
                        userIdToNotify = adminUser.login;
                        userEmail = adminUser.emailaddress;
                    }
                }
                if (Sys.Helpers.IsEmpty(userEmail)) {
                    Log.Error("No email address to notify user.");
                    return;
                }
                let baseUrl = Data.GetValue("ValidationUrl");
                baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/"));
                const customTags = {
                    ViewUrl_CloseToEnd: Lib.P2P.GetURLFromSSO(baseUrl + "/View.link?tabName=_My documents-P2P%20Contract&viewName=_P2P_Views%20-%20My%20Contracts%20expiring%20soon", user),
                    ViewUrl_CloseToRenewal: Lib.P2P.GetURLFromSSO(baseUrl + "/View.link?tabName=_My documents-P2P%20Contract&viewName=_P2P_Views%20-%20My%20Contracts%20upcoming%20renewals", user)
                };
                if (contractsCloseToEnd > 0) {
                    if (contractsCloseToEnd > 1) {
                        customTags.SeveralContractsCloseToEnd = "true";
                        customTags.NumberOfContractsCloseToEnd = contractsCloseToEnd.toString();
                    }
                    else {
                        customTags.OneContractCloseToEnd = "true";
                    }
                }
                if (contractsCloseToRenewal > 0) {
                    if (contractsCloseToRenewal > 1) {
                        customTags.SeveralContractsCloseToRenewal = "true";
                        customTags.NumberOfContractsCloseToRenewal = contractsCloseToRenewal.toString();
                    }
                    else {
                        customTags.OneContractCloseToRenewal = "true";
                    }
                }
                try {
                    SendEmailNotification(userIdToNotify, null, "Contract_Email_NotifReminder.htm", null, customTags);
                }
                catch (e) {
                    Log.Error("Cannot send the notification. Details: " + e);
                }
            }
        }
    }
    function SendEmailNotification(userID, subject, template, backupUserAsCC, tags) {
        const options = {
            userId: userID,
            subject: subject,
            template: template,
            customTags: tags,
            fromName: "_EskerContract",
            backupUserAsCC: !!backupUserAsCC
        };
        try {
            Lib.P2P.EmailNotification.SendEmailNotification(options);
        }
        catch (e) {
            Log.Error("Cannot send the notification. Details: " + e);
        }
    }
    async function Start() {
        contracts = [];
        usersToNotify = new Set();
        ReadCSV();
        ManageContracts();
        await SendNotifs();
    }
    ExtractionScript.Start = Start;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        Lib.P2P.HandleScriptError(Start());
    }
})(ExtractionScript || (ExtractionScript = {}));
//# sourceMappingURL=extractionscript.js.map