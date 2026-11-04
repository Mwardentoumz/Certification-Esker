"use strict";
function HandleVerificationPOMatchingModeTooltipVisibility() {
    const isAPSAP = Data.GetValue("ERP__") === "SAP";
    const helpData = isAPSAP ? "_HelpVerificationPOMatchingMode" : "";
    Controls.VerificationPOMatchingMode__.SetHelpData(helpData);
}
function FillERPConnectorsCallback() {
    const err = this.GetQueryError();
    if (err) {
        Popup.Alert(err);
        return;
    }
    const nbRecords = this.GetRecordsCount();
    const existingERPs = Controls.ERP__.GetAvailableValues();
    const connectorIdSet = new Set();
    const currentChoice = Data.GetValue("ERP__");
    if (nbRecords > 0) {
        for (let i = 0; i < nbRecords; i++) {
            const connectorId = this.GetQueryValue("ConnectorId__", i);
            existingERPs.push(`CustomERP_${connectorId}=${connectorId}`);
            connectorIdSet.add(connectorId);
        }
        Controls.ERP__.SetAvailableValues(existingERPs);
    }
    if (!connectorIdSet.has(currentChoice) && !existingERPs.some(existingERP => existingERP.includes(currentChoice))) {
        Controls.ERP__.SetError("_Previously selected {0} ERP has been removed", currentChoice);
        Data.SetValue("ERPConnectorConfiguration__", "");
    }
}
Controls.ERP__.OnChange = HandleVerificationPOMatchingModeTooltipVisibility;
// Hide deleted fields that may still be visible on upgraded accounts
["ActivateFRB2B__", "PDPConfigurationName__"].forEach(function (fieldName) {
    if (Controls[fieldName]) {
        Controls[fieldName].Hide(true);
    }
});
Query.DBQuery(FillERPConnectorsCallback, "Sys_PartnerConnectors__", "", "", null, 100);
HandleVerificationPOMatchingModeTooltipVisibility();
const usersOrGroupsOptions = Lib.P2P.UsersBrowseOptions.GetUsersOrGroupsOptions({
    placeholder: "_SelectOrEnterEmailAddress",
    queryOnSearch: true,
    displayFormat: "%%DisplayName%% <%%EmailAddress%%>",
    titleDisplayFormat: "%%DisplayName%%"
});
Lib.P2P.UsersBrowse.Init({
    browsedControl: Controls.ProcurementViewerDisplay__,
    storageName: "ProcurementViewer__",
    storageType: Lib.P2P.UsersBrowse.StorageType.Control,
    dialogTitle: "_ProcurementViewer",
    select2CtrlOptions: usersOrGroupsOptions,
    select2CtrlLabel: "_UserPopup_UsersOrGroups",
    storeDisplayName: false
});
//# sourceMappingURL=customscript.js.map