"use strict";
const reportParameter = Variable.GetValueAsString("reportParameter");
if (reportParameter) {
    const params = JSON.parse(reportParameter);
    Lib.P2P.EmailNotification.SendReminders({
        template: params.template,
        fromName: Language.Translate(params.fromName, false),
        backupUserAsCC: true,
        escapeCustomTags: false,
        GetCustomTags: function (user) {
            const vars = user.dbInfo.GetVars();
            let baseUrl = Data.GetValue("ValidationUrl");
            baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/"));
            const language = vars.GetValue_String("Language", 0);
            if (params.ValidationUrlV1) {
                params.ValidationUrl = (Lib.Version && Lib.Version.PAC) >= 2 ? params.ValidationUrlV2 : params.ValidationUrlV1;
            }
            const customTags = {
                "RecipientDisplayName": vars.GetValue_String("DisplayName", 0),
                "ApproverDisplayName": vars.GetValue_String("DisplayName", 0),
                "NumberOfItems": user.count,
                "Requisition": Language.TranslateInto(user.count > 1 ? "Requisitions" : "Requisition", language, false), //use in subject of ReminderForPRApproval
                "ValidationUrl": baseUrl + params.ValidationUrl, // SSO url will automatically added be Lib.P2P.EmailNotification.SendReminders
                "DisplayValidationUrlsAsTables": !!params.displayAsTable
            };
            if (user.count > 1) {
                customTags.PlurialItems = true;
            }
            if (user.moreInfo.length > 0) {
                const userObj = Users.GetUser(vars.GetValue_String("Login", 0));
                customTags.ValidationUrlList = BuildValidationUrlsHtml(user.moreInfo, baseUrl + params.ValidationUrl, params, userObj);
            }
            return customTags;
        },
        sendToAllMembersIfGroup: Sys.Parameters.GetInstance("P2P").GetParameterBool("SendNotificationsToEachGroupMembers", false)
    });
}
function BuildValidationUrlsHtml(lines, baseUrl, parameters, user) {
    const columnsUrlDesc = parameters.columnsUrlDesc ? parameters.columnsUrlDesc.split(';') : [];
    const displayAsTable = !!parameters.displayAsTable;
    let htmlList = "";
    if (lines.length > 0 && columnsUrlDesc.length > 0) {
        if (displayAsTable) {
            htmlList = BuildValidationUrlsHtmlTable(lines, baseUrl, columnsUrlDesc, user);
        }
        else {
            htmlList = BuildValidationUrlsHtmlList(lines, baseUrl, columnsUrlDesc[0], user);
        }
    }
    return htmlList;
}
function BuildValidationUrlsHtmlTable(lines, baseUrl, columnsUrlDesc, user) {
    let htmlTable = "";
    const alreadyAdded = {};
    for (let i = 0; i < lines.length; i++) {
        const lineInfo = lines[i];
        if (!alreadyAdded[lineInfo[0]]) {
            const url = Lib.P2P.GetURLFromSSO(encodeUrl(baseUrl + lineInfo[0]), user);
            let columns = "";
            for (let j = 0; j < columnsUrlDesc.length; j++) {
                const columnIndex = columnsUrlDesc[j];
                if (columnIndex < lineInfo.length) {
                    columns += '<td style="padding-left: 30px;"><span>' + lineInfo[columnIndex] + "</span></td>";
                }
            }
            if (columns.length > 0) {
                columns = '<td style="padding-left: 30px;"><a href=' + url + ">" + Language.Translate("_View") + "</a></td>" + columns;
                htmlTable += "<tr>" + columns + "</tr>";
                alreadyAdded[lineInfo[0]] = true;
            }
        }
    }
    if (htmlTable.length > 0) {
        htmlTable = "<Table>" + htmlTable + "</Table>";
    }
    return htmlTable;
}
function BuildValidationUrlsHtmlList(lines, baseUrl, columnUrlDesc, user) {
    let htmlList = "";
    const alreadyAdded = {};
    for (let i = 0; i < lines.length; i++) {
        const lineInfo = lines[i];
        if (!alreadyAdded[lineInfo[0]]) {
            const url = Lib.P2P.GetURLFromSSO(encodeUrl(baseUrl + lineInfo[0]), user);
            if (columnUrlDesc < lineInfo.length) {
                htmlList += "<li><a href=" + url + ">" + lineInfo[columnUrlDesc] + "</a></li>";
                alreadyAdded[lineInfo[0]] = true;
            }
        }
    }
    if (htmlList.length > 0) {
        htmlList = "<ul>" + htmlList + "</ul>";
    }
    return htmlList;
}
function encodeUrl(url) {
    return url.replace('#', encodeURIComponent('#'));
}
//# sourceMappingURL=extractionscript.js.map