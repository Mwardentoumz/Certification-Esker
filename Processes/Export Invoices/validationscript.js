"use strict";
function convertInServerTimezone(inDate) {
    const browserDate = new Date();
    const convertedUserDateToBrowserDate = new Date();
    const userUtcOffsetVar = Variable.GetValueAsString("userUTCOffSet");
    const timezoneOffsetInMs = browserDate.getTimezoneOffset() * 60000;
    convertedUserDateToBrowserDate.setTime(inDate.getTime() - parseInt(userUtcOffsetVar, 10) - timezoneOffsetInMs);
    return convertedUserDateToBrowserDate;
}
function getScheduleDT() {
    // Compute date (in the user timezone)
    const date = Data.GetValue("SchedulingDate__");
    const hours = parseInt(Data.GetValue("SchedulingHours__").substr(0, 2), 10);
    const minutes = parseInt(Data.GetValue("SchedulingMinutes__"), 10);
    const scheduleDT = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    // Convert in server timezone
    return convertInServerTimezone(scheduleDT);
}
function getHourTranslationKeyFromInt(hours) {
    let s = hours + "";
    if (s.length < 2) {
        s = "0" + s;
    }
    s = s + "OClock";
    return s;
}
function getExpirationDateTime(bExecuteNow) {
    // Warning: getScheduleDT is always returning the same hours/minutes date
    // modifying Then_repeat__ to support "hourly" or "every 10 minutes" also requires to modify the getScheduleDT
    let computedDate = bExecuteNow ? new Date() : getScheduleDT();
    switch (Data.GetValue("Then_repeat__")) {
        case "Everyday":
            computedDate = new Date(computedDate.getFullYear(), computedDate.getMonth(), computedDate.getDate() + 1, computedDate.getHours(), intDivisionByTen(computedDate.getMinutes()));
            break;
        case "Every_week":
            computedDate = new Date(computedDate.getFullYear(), computedDate.getMonth(), computedDate.getDate() + 7, computedDate.getHours(), intDivisionByTen(computedDate.getMinutes()));
            break;
        default:
            computedDate = new Date(computedDate.getFullYear(), computedDate.getMonth() + 1, computedDate.getDate(), computedDate.getHours(), intDivisionByTen(computedDate.getMinutes()));
            break;
    }
    return computedDate;
}
function intDivisionByTen(minutes) {
    return Math.floor(minutes / 10) * 10;
}
function intDivisionByTenAsString(minutes) {
    let newMinutes = intDivisionByTen(minutes) + "";
    if (newMinutes.length === 1) {
        newMinutes = "0" + newMinutes;
    }
    return newMinutes;
}
function varsSetValueFromValueType(fieldValue, fieldName, vars, overrideValue) {
    let isValueSet = false;
    switch (typeof fieldValue) {
        case "number":
            // If fieldValue is integer
            if (!isNaN(fieldValue) && Math.round(fieldValue) === fieldValue) {
                vars.AddValue_Long(fieldName, fieldValue, overrideValue);
                isValueSet = true;
            }
            else {
                vars.AddValue_Double(fieldName, fieldValue, overrideValue);
                isValueSet = true;
            }
            break;
        case "boolean":
            vars.AddValue_Long(fieldName, fieldValue ? 1 : 0, overrideValue);
            isValueSet = true;
            break;
        case "object":
            if (Object.prototype.toString.call(fieldValue) === "[object Date]") {
                const newDate = new Date(fieldValue.getUTCFullYear(), fieldValue.getUTCMonth(), fieldValue.getUTCDate(), fieldValue.getUTCHours(), fieldValue.getUTCMinutes(), fieldValue.getUTCSeconds());
                //http://webdoc:8080/eskerondemand/cv_ly/en/manager/startpage.htm#Processes/Working_with_dates.html
                if (fieldName.match(/__$/)) {
                    //Flexible fields must be set in UTC
                    vars.AddValue_Date(fieldName, newDate, overrideValue);
                }
                else {
                    //Transport fields must be set in server timezone
                    vars.AddValue_Date(fieldName, fieldValue, overrideValue);
                }
                isValueSet = true;
            }
            break;
        default:
            vars.AddValue_String(fieldName, fieldValue, overrideValue);
            isValueSet = true;
            break;
    }
    return isValueSet;
}
function cloneProcessFields(vars, overrideFieldValues) {
    const nbFields = Data.GetNbFields();
    let fieldValue = null;
    const cloneFields = [];
    for (let i = 0; i < nbFields; ++i) {
        const fieldName = Data.GetFieldName(i);
        Log.Info("[cloneProcessFields] FieldName: " + fieldName);
        if (overrideFieldValues && fieldName in overrideFieldValues) {
            fieldValue = overrideFieldValues[fieldName];
            cloneFields.push(fieldName);
        }
        else {
            fieldValue = Data.GetValue(fieldName);
        }
        if (!varsSetValueFromValueType(fieldValue, fieldName, vars, true)) {
            Log.Info(`Ignore to clone value ${fieldValue} for field : ${fieldName}`);
        }
    }
    // All overriden fields are not retrieved in Data.GetNbFields() such as ValidityDateTime
    for (const overrideField in overrideFieldValues) {
        if (cloneFields.indexOf(overrideField) === -1 &&
            !varsSetValueFromValueType(overrideFieldValues[overrideField], overrideField, vars, true)) {
            Log.Info(`Ignore to clone value ${overrideFieldValues[overrideField]} for field : ${overrideField}`);
        }
    }
}
function createExportChild(overrideFieldValues) {
    const nextScheduling = Process.CreateProcessInstance("Export Invoices", false, true, false);
    const nextSchedulingVars = nextScheduling.GetUninheritedVars();
    cloneProcessFields(nextSchedulingVars, overrideFieldValues);
    nextScheduling.Process();
    if (nextScheduling.GetLastError() !== 0) {
        Log.Error("Next scheduled job creation failed : " + nextScheduling.GetLastErrorMessage());
    }
}
function createExport() {
    Data.SetValue("ExportStatus__", "InProgress");
    Data.SetValue("ExportDateTime__", new Date());
    if (Data.GetValue("Then_repeat__") !== "Never") {
        const expirationDateTime = getExpirationDateTime(true);
        const expirationDateTimeUserTimezone = Helpers.Date.InDocumentTimezone(expirationDateTime);
        const overrideExportChildFieldValues = {
            "ExpirationBehavior": 1,
            "ExportDateTime__": expirationDateTime,
            "ExpirationDateTime__": expirationDateTime,
            "ValidityDateTime": expirationDateTime,
            "SchedulingDate__": expirationDateTime,
            "SchedulingHours__": getHourTranslationKeyFromInt(expirationDateTimeUserTimezone.getHours()),
            "SchedulingMinutes__": intDivisionByTenAsString(expirationDateTimeUserTimezone.getMinutes()),
            "SchedulingOptions__": "Defer execution until",
            "ExportStatus__": "Pending"
        };
        createExportChild(overrideExportChildFieldValues);
    }
    Process.SetAutoValidateOnExpiration(false);
    // No prevent approval, we will export files in finalization script
}
let curUser = Users.GetUser(Variable.GetValueAsString("CurrentUserId"));
if (!curUser) {
    curUser = Users.GetUser(Data.GetValue("OwnerId"));
}
const curUserVars = curUser.GetVars();
Data.SetValue("ExportedBy__", `${curUserVars.GetValue_String("FirstName", 0)} ${curUserVars.GetValue_String("LastName", 0)}`);
if (Data.GetActionType().toLowerCase() === "approve") {
    if (Data.GetActionName().toLowerCase() === "export") {
        if (Data.GetValue("SchedulingOptions__") === "Defer execution until") {
            Data.SetValue("ExportStatus__", "Pending");
            Process.SetAutoValidateOnExpiration(true);
            const scheduleDT = getScheduleDT();
            Data.SetValue("ExportDateTime__", scheduleDT);
            Data.SetValue("ValidityDateTime", scheduleDT);
            Process.PreventApproval();
            Process.LeaveForm();
        }
        else {
            createExport();
        }
    }
    else if (Data.GetActionName().toLowerCase() === "cancel") {
        Data.SetValue("ExportStatus__", "Cancelled");
    }
}
if (Process.AutoValidatingOnExpiration() && Data.GetValue("SchedulingOptions__") === "Defer execution until" && Data.GetValue("Then_repeat__") !== "Never") {
    const expirationDateTime = getExpirationDateTime();
    const overrideExportChildFieldValues = {
        "ExpirationBehavior": 1,
        "ExportDateTime__": expirationDateTime,
        "ExpirationDateTime__": expirationDateTime,
        "ValidityDateTime": expirationDateTime,
        "SchedulingDate__": expirationDateTime,
        "ExportStatus__": "Pending"
    };
    createExportChild(overrideExportChildFieldValues);
}
// When triggered by EReporting Batch Export: auto-validate immediately on first run,
// then proceed with the export on the auto-validation run.
if (Variable.GetValueAsString("SendToPA") === "true") {
    if (Process.AutoValidatingOnExpiration()) {
        // Auto-validation fired: proceed with export
        createExport();
    }
    else if (Data.GetActionType().toLowerCase() !== "approve") {
        // Initial validation run: set up immediate auto-validation
        Data.SetValue("ValidityDateTime", new Date());
        Process.SetAutoValidateOnExpiration(true);
    }
}
//# sourceMappingURL=validationscript.js.map