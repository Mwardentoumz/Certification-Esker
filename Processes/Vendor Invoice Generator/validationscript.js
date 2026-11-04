"use strict";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var Validation;
(function (Validation) {
    //#endregion private types
    const actionMapping = {
        "FromBillingSchedule": {
            handler: fromBillingSchedule
        }
    };
    //#region private functions
    function attachJSONInvoiceToProcess(transport, data) {
        const jsonFile = TemporaryFile.CreateFile("vip.json", "utf8");
        TemporaryFile.Append(jsonFile, JSON.stringify(data));
        const attachVars = transport.AddAttachEx(jsonFile).GetVars();
        attachVars.AddValue_String("AttachEncoding", "UTF-8", true);
        attachVars.AddValue_String("AttachOutputName", "Vendor Invoice JSON", true);
        attachVars.AddValue_String("AttachToProcess", "0", true);
        attachVars.AddValue_String("IsTechnical", "1", true);
        return true;
    }
    function generatePdf(jsonValue, templatePath, jsonNumberNeedFormat) {
        let error = "";
        const reportTemplate = Process.GetResourceFile(templatePath);
        if (reportTemplate) {
            try {
                const jsonFile = TemporaryFile.CreateFile("vip.json", "utf16");
                if (!jsonFile) {
                    Log.Error("Temporary file creation failed: vip.json");
                    throw "Couldn't create the json file";
                }
                if (jsonNumberNeedFormat) {
                    Lib.AP.VendorInvoice.FormatJsonNumberFields(jsonValue);
                }
                Lib.AP.VendorInvoice.NormalizeJSONForCrystalReport(jsonValue);
                TemporaryFile.Append(jsonFile, JSON.stringify(jsonValue));
                const cvtFile = jsonFile.ConvertFile({ conversionType: "crystal2020", report: reportTemplate });
                if (!cvtFile) {
                    throw "Crystal report error";
                }
                return cvtFile;
            }
            catch (ex) {
                error = `The document could not be formatted: ${ex}`;
            }
        }
        else {
            error = "The document could not be formatted: Template not found";
        }
        if (error) {
            Log.Error(error);
        }
        return null;
    }
    function attachPDFInvoiceToProcess(transport, data) {
        const jsonContent = data;
        jsonContent.IsFromExpense = "";
        jsonContent.Attachment = [];
        const jsonDoc = new Lib.AP.Mapping.JSONInvoiceDocument(jsonContent);
        jsonDoc.Run();
        const templatePath = jsonDoc.GetConversionTemplatePath();
        if (templatePath) {
            const languageTemplateFileName = jsonDoc.GetLanguageTemplateFileName();
            if (languageTemplateFileName) {
                try {
                    const currentUser = Lib.P2P.GetValidatorOrOwner();
                    const templateContent = currentUser.GetTemplateContent({
                        templateName: languageTemplateFileName,
                        language: currentUser.GetValue("Language")
                    });
                    const parsedLanguageContent = JSON.parse(templateContent.content).language;
                    jsonDoc.SetLanguageContent(parsedLanguageContent);
                }
                catch (e) {
                    Log.Error(`Failed to get language content from file ${languageTemplateFileName}: ${e}`);
                }
            }
            const json = jsonDoc.toJson();
            if (json) {
                if (!json.error) {
                    const pdfFile = generatePdf(json, templatePath, jsonDoc.JSONNumberNeedFormat());
                    const attachVars = transport.AddAttachEx(pdfFile).GetVars();
                    attachVars.AddValue_String("AttachOutputName", "Vendor Invoice", true);
                    attachVars.AddValue_String("AttachOutputFormat", "pdf", true);
                    attachVars.AddValue_String("AttachToProcess", "1", true);
                    attachVars.AddValue_String("IsTechnical", "0", true);
                    // Force company code to ease FTR Recognition
                    transport.GetExternalVars().AddValue_String("CompanyCode", json.header.CompanyCode, true);
                    return true;
                }
                Log.Error("Failed to generatePDF from json: " + json.error);
            }
            else {
                Log.Error("Failed to generatePDF from json");
            }
        }
        //jsonDoc.AttachEmbeddedDocuments(!convertedAdded, TemporaryFile);
        return false;
    }
    function attachInvoiceToProcess(transport, data, mode = "JSON") {
        if (mode === "PDF") {
            return attachPDFInvoiceToProcess(transport, data);
        }
        return attachJSONInvoiceToProcess(transport, data);
    }
    function fromBillingSchedule(params, toFormat) {
        if (!params ||
            !params.companyCode ||
            !params.vendorNumber ||
            !params.contractReferenceNumber ||
            !params.contractNumber ||
            !params.billingScheduleID ||
            (!params.billingScheduleInstallmentNumber && params.billingScheduleInstallmentNumber !== 0) ||
            !params.billingScheduleInstallmentDate ||
            (!params.billingScheduleInstallmentLocalNetAmount && params.billingScheduleInstallmentLocalNetAmount !== 0) ||
            (!params.invoiceLocalNetAmount && params.invoiceLocalNetAmount !== 0) ||
            !params.invoiceDate) {
            return Sys.Helpers.Promise.Reject("Invalid parameters type");
        }
        const typedParams = params;
        const filter = Sys.Helpers.LdapUtil.FilterAnd(Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", typedParams.companyCode), Sys.Helpers.LdapUtil.FilterEqual("VendorNumber__", typedParams.vendorNumber), Sys.Helpers.LdapUtil.FilterEqual("ContractReferenceNumber__", typedParams.contractReferenceNumber), Sys.Helpers.LdapUtil.FilterEqual("ContractNumber__", typedParams.contractNumber), Sys.Helpers.LdapUtil.FilterEqual("Installment__", typedParams.billingScheduleInstallmentNumber.toString()), Sys.Helpers.LdapUtil.FilterEqual("BillingSchedule__", typedParams.billingScheduleID)).toString();
        return Sys.GenericAPI.PromisedQuery({
            table: "P2P - Billing Scheduled Items__",
            filter: filter,
            attributes: ["CompanyCode__", "VendorNumber__", "ContractReferenceNumber__", "ContractNumber__", "BillingSchedule__", "Installment__", "BillingDate__", "Amount__"],
            maxRecords: 1,
            additionalOptions: {
                useConstantQueryCache: true
            }
        }).Then((result) => {
            if (!result || result.length <= 0) {
                return Sys.Helpers.Promise.Reject(`Could not retrieve billing schedule record from filter ${filter}`);
            }
            const newParams = {
                companyCode: result[0].CompanyCode__,
                vendorNumber: result[0].VendorNumber__,
                localNetAmount: typedParams.invoiceLocalNetAmount,
                invoiceDate: typedParams.invoiceDate,
                nonPOAssignmentTemplate: typedParams.nonPOAssignmentTemplate,
                nonPOAssignmentTemplateGetDefaultDimensions: false
            };
            return Lib.AP.VendorInvoice.GetVIPJSONDocument(newParams)
                .Then((vipData) => {
                vipData.header.ContractReferenceNumber = typedParams.contractReferenceNumber;
                vipData.header.ContractNumber = typedParams.contractNumber;
                vipData.header.InvoiceNumber = `SB#${Sys.Helpers.String.PadLeft(Process.GetSequence("InvoiceNbSeq").GetNextValue(), "0", 6)}`;
                vipData.header.BillingScheduleID = typedParams.billingScheduleID;
                vipData.header.BillingScheduleInstallment = typedParams.billingScheduleInstallmentNumber.toString();
                vipData.header.BillingScheduleDate = typedParams.billingScheduleInstallmentDate;
                vipData.header.BillingScheduleInstallmentAmount = typedParams.billingScheduleInstallmentLocalNetAmount.toString();
                if (vipData.tables.LineItems.length > 0 && (typedParams.costCenter || typedParams.costCenter === "")) {
                    vipData.tables.LineItems[0].CostCenter = typedParams.costCenter;
                }
                if (vipData.tables.LineItems.length > 0) {
                    vipData.tables.LineItems[0].Description = vipData.header.ContractReferenceNumber;
                    vipData.tables.LineItems[0].PartNumber = typedParams.billingScheduleDescription || typedParams.billingScheduleID;
                }
                const newProcess = Process.CreateProcessInstanceForUser("Vendor invoice", Lib.AP.VendorPortal.GetDefaultApUserLogin());
                if (typedParams.isSelfBillingInvoice && typedParams.isSelfBillingInvoice === true) {
                    const newProcessExternalVars = newProcess.GetExternalVars();
                    newProcessExternalVars.AddValue_String("IsSelfBillingInvoice", "true", true);
                    vipData.header.AdditionalHeaderText = Language.Translate("_SelfBillingInvoice");
                }
                const attached = attachInvoiceToProcess(newProcess, vipData, toFormat);
                if (!attached) {
                    return Sys.Helpers.Promise.Reject("Could not attach file to process");
                }
                newProcess.Process();
                if (newProcess.GetLastError() !== 0) {
                    return Sys.Helpers.Promise.Reject(`Could not create VIP process instance ${newProcess.GetLastErrorMessage()}`);
                }
                const ruidex = newProcess.GetUninheritedVars().GetValue_String("RuidEx", 0);
                Data.SetValue("VendorInvoice__", ruidex);
                return Sys.Helpers.Promise.Resolve({});
            })
                .Catch((error) => {
                return Sys.Helpers.Promise.Reject(error);
            });
        }).Catch((error) => {
            return Sys.Helpers.Promise.Reject(error);
        });
    }
    function getValidationActionParams() {
        let actionParams = {};
        try {
            actionParams = JSON.parse(Variable.GetValueAsString(Lib.AP.VendorInvoice.Generator.ProcessVariableFormParameters));
        }
        catch (e) {
            Log.Error("Could not parse JSON parameters, use empty object as default parameter");
        }
        return actionParams;
    }
    function getValidationAction() {
        return Variable.GetValueAsString(Lib.AP.VendorInvoice.Generator.ProcessVariableFormAction);
    }
    //#endregion private functions
    function Main() {
        let actionName = Data.GetActionName();
        const actionType = Data.GetActionType();
        Log.Info(`state: "${Data.GetValue("State")}", actionName: "${actionName}", actionType: "${actionType}"`);
        if (!actionName && !actionType && Data.GetValue("State") === 0) {
            return Sys.Helpers.Promise.Reject("Skip first automatic validation script");
        }
        //Sys.Helpers.TryCallFunction("Lib.AP.VendorInvoiceGenerator.Customization.ExtendActionMap", actionMapping);
        const variableActionParams = getValidationActionParams();
        if (actionType === "" && actionName === "") {
            const variableActionName = getValidationAction();
            if (variableActionParams && variableActionName && actionMapping[variableActionName]) {
                Log.Info(`Empty action routed to actionName: ${variableActionName}`);
                actionName = variableActionName;
            }
        }
        if (!actionMapping[actionName]) {
            return Sys.Helpers.Promise.Reject(`Invalid action name ${actionName}`);
        }
        if (Data.GetValue("VendorInvoice__")) {
            return Sys.Helpers.Promise.Reject(`Vendor invoice already created, skipping action ${actionName}`);
        }
        Log.Info(`Call action ${actionName}`);
        Log.Verbose(JSON.stringify(variableActionParams));
        const exportMode = Variable.GetValueAsString(Lib.AP.VendorInvoice.Generator.ProcessVariableFormToFormat);
        return actionMapping[actionName].handler(variableActionParams, exportMode);
    }
    Validation.Main = Main;
    Main()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .Then((_result) => {
        Log.Info("Action ended successfully");
    })
        .Catch((error) => {
        Log.Error(error);
    });
})(Validation || (Validation = {}));
//# sourceMappingURL=validationscript.js.map