"use strict";
var CatalogManagement = Lib.Purchasing.CatalogManagement;
let currentName = Data.GetActionName();
let currentAction = Data.GetActionType();
Log.Info("-- Catalog Management Validation Script -- Name: '" + (currentName ? currentName : "<empty>") + "', Action: '" + (currentAction ? currentAction : "<empty>") + "' , Device: '" + Data.GetActionDevice());
const g_companyCode = Data.GetValue("CompanyCode__") || Variable.GetValueAsString("VendorCompanyCode");
function SendToApproval() {
    let submissionDate = new Date();
    Data.SetValue("SubmissionDateTime__", submissionDate);
    Data.SetValue("Status__", "ToApprove");
    // @TODO Create an instance of the process as Admin
    let catalogManagementWorkflow = Process.CreateProcessInstanceAsProcessAdmin("Catalog management workflow", false, false, false);
    // The Imported CSV file is the first document attached to the CM process
    const csvFile = Attach.GetAttach(0);
    catalogManagementWorkflow.AddAttachEx(csvFile);
    CatalogManagement.Server.SetExtractedDataToTransport(catalogManagementWorkflow);
    let extCMWVars = catalogManagementWorkflow.GetExternalVars();
    extCMWVars.AddValue_String("CMRUIDEX", Data.GetValue("RUIDEX"), true);
    extCMWVars.AddValue_String("SubmissionTime", submissionDate.getTime(), true);
    extCMWVars.AddValue_String("CatalogManagmentType", "external", true);
    extCMWVars.AddValue_String("CatalogManagmentSource", Variable.GetValueAsString("CatalogManagmentSource"), true);
    let CMWVars = catalogManagementWorkflow.GetUninheritedVars();
    CMWVars.AddValue_String("Status__", Data.GetValue("Status__"), true);
    CMWVars.AddValue_String("CompanyCode__", g_companyCode, true);
    CMWVars.AddValue_String("WarehouseNumber__", Data.GetValue("WarehouseNumber__"), true);
    CMWVars.AddValue_String("WarehouseName__", Data.GetValue("WarehouseName__"), true);
    CMWVars.AddValue_String("VendorNumber__", Data.GetValue("VendorNumber__"), true);
    CMWVars.AddValue_String("VendorName__", Data.GetValue("VendorName__"), true);
    CMWVars.AddValue_String("RequesterLogin__", Data.GetValue("RequesterLogin__"), true);
    CMWVars.AddValue_String("RequesterName__", Data.GetValue("RequesterName__"), true);
    if (CatalogManagement.IsFromInboundChannelVendorUpdateRequest()) {
        CMWVars.AddValue_String("ImportDescription__", Language.Translate("_ProcessCreatedByInboundChannel"), true);
    }
    else {
        CMWVars.AddValue_String("ImportDescription__", Data.GetValue("ImportDescription__"), true);
    }
    catalogManagementWorkflow.Process();
    let ret = catalogManagementWorkflow.GetLastError();
    if (ret === 0) {
        Log.Info("CMW process call OK");
        // Set next alert with no parameters in particular
        Lib.CommonDialog.NextAlert.Define("_Update request will be submitted", "_Your catalog update request will be sent for approval", {
            isError: false,
            behaviorName: "CMCreationInfo"
        });
        Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
    }
    else {
        Log.Error("CMW process call returns with error message : " + catalogManagementWorkflow.GetLastErrorMessage());
    }
    Process.WaitForUpdate();
}
function CSVApproved() {
    Data.SetValue("ValidationDateTime__", new Date());
    Data.SetValue("Status__", "Approved");
    //Notif Succes
}
function CSVRejected() {
    const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
    Data.SetValue("Reason__", data.rejectionReason);
    Data.SetValue("ValidationDateTime__", new Date());
    Data.SetValue("Status__", "Rejected");
    Data.SetValue("State", 400);
}
function CSVFailed() {
    let now = new Date();
    Data.SetValue("SubmissionDateTime__", now);
    Data.SetValue("ValidationDateTime__", now);
    CatalogManagement.Server.SendEmailNotification(Data.GetValue("OwnerID"), "CM-CatalogManager_ImportFail_Internal.htm", true);
    Data.SetValue("Status__", "Failed");
}
function HandleApprovalWorkflowErrors() {
    const data = JSON.parse(Variable.GetValueAsString("resumeWithActionData") || "{}");
    Log.Error("[Catalog management workflow Error] " + data.errorMsg);
    Variable.SetValueAsString("MissingWorkflowRuleError", "true");
    Data.SetValue("Status__", "Failed");
    Data.SetValue("State", 200);
}
async function InitArchiveDurationForCompanyCode(companyCode) {
    const CCValues = await Lib.P2P.CompanyCodesValue.QueryValues(companyCode, { asAdmin: true });
    Sys.Parameters.GetInstance("PAC").Reload(CCValues.DefaultConfiguration__);
    await Lib.P2P.InitValidityDateTime("PAC");
    await Lib.P2P.InitArchiveDuration("PAC", "ProcurementArchiveDurationPortalInMonths");
}
async function Main() {
    if (!currentName && !currentAction && CatalogManagement.IsFromInboundChannelVendorUpdateRequest()) {
        if (Variable.GetValueAsString("isFirstValidationDone") === "true") {
            if (CatalogManagement.IsInError()) {
                currentName = "CSVFailed";
            }
            else {
                currentName = "Submit";
                await CatalogManagement.ServerVendor.FillInfoForInboundChannelVendorUpdateRequest();
            }
            currentAction = "approve_asynchronous";
            Log.Info("-- Catalog Management Validation Script -- actionName and actionType changed to '" + currentName + "' and '" + currentAction + "' for Inbound Channel Vendor Update Request");
        }
    }
    if (currentAction === "approve_asynchronous" || currentAction === "approve" || currentAction === "ResumeWithAction") {
        switch (currentName) {
            case "Submit":
                SendToApproval();
                break;
            case "CSVApproved":
                CSVApproved();
                break;
            case "CSVRejected":
                CSVRejected();
                break;
            case "CSVFailed":
                CSVFailed();
                break;
            case "MissingWorkflowRules":
                HandleApprovalWorkflowErrors();
                break;
            default:
                Process.PreventApproval();
                break;
        }
    }
    await InitArchiveDurationForCompanyCode(g_companyCode);
    Variable.SetValueAsString("isFirstValidationDone", "true");
}
Lib.P2P.HandleScriptError(Main());
//# sourceMappingURL=validationscript.js.map