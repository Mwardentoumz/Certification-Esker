"use strict";
const actionsList = {
    accepted: {
        actionName: "accepted",
        popupTitle: "_PopupTitleApproveMismatch",
        popupDescription: "_PopupDescriptionMismatchWithCount {0}",
        okButtonLabel: "_ButtonAcceptMismatch"
    },
    creditNoteRequested: {
        actionName: "creditNoteRequested",
        popupTitle: "_PopupTitleRequestCreditNote",
        popupDescription: "_PopupDescriptionRequestCreditNoteWithCount {0}",
        okButtonLabel: "_ButtonRequestCreditNote"
    }
};
function initProcessAsPopup() {
    Controls.DataPanel.Hide(true);
    Controls.SystemData.Hide(true);
    ProcessInstance.SetSilentChange(true);
}
function getActionFromUrl() {
    let actionName = null;
    const processParameter = Sys.Helpers.String.DecodeURLParameter("processParameter");
    if (processParameter) {
        const actionMatch = processParameter.match(/(?:^|[?&])action=([^&]*)/);
        actionName = actionMatch ? actionMatch[1] : null;
    }
    Log.Info("Action name: " + actionName);
    return actionName;
}
class ConfirmationPopup {
    constructor(action) {
        this.actionConfig = actionsList[action] || null;
    }
    Show() {
        const title = Language.Translate(this.actionConfig.popupTitle);
        Sys.Helpers.Globals.Popup.Dialog(title, null, this.Fill.bind(this), this.Commit.bind(this), null, null, this.Cancel.bind(this));
    }
    Fill(dialog) {
        var _a, _b;
        if ((_a = this.actionConfig) === null || _a === void 0 ? void 0 : _a.popupDescription) {
            const width = 600;
            const dialogDescription = dialog.AddDescription(ConfirmationPopup._controlNames.textDescription, null, width);
            dialogDescription.SetText(Language.Translate(this.actionConfig.popupDescription, false, ConfirmationPopup.GetAncestorsCount()));
        }
        if ((_b = this.actionConfig) === null || _b === void 0 ? void 0 : _b.okButtonLabel) {
            const commitButton = dialog.GetControl(ConfirmationPopup._controlNames.btnOk);
            commitButton.SetLabel(Language.Translate(this.actionConfig.okButtonLabel));
        }
    }
    Cancel() {
        this.OnClose();
        return false;
    }
    Commit(dialog, tab_id, event, control) {
        ProcessInstance.Approve(this.actionConfig.actionName);
    }
    OnClose() {
        if (ProcessInstance.isOpenInPopup) {
            ProcessInstance.Quit("quit");
        }
    }
    static GetAncestorsCount() {
        const ancestorRuids = Variable.GetValueAsString("AncestorsRuid");
        return ancestorRuids ? ancestorRuids.split("|").length : 0;
    }
}
ConfirmationPopup._controlNames = {
    btnOk: "ButtonOk",
    btnCancel: "ButtonCancel",
    textDescription: "textDescription"
};
function main() {
    initProcessAsPopup();
    const actionName = getActionFromUrl();
    if (actionName && actionName in actionsList) {
        const confirmationPopup = new ConfirmationPopup(actionName);
        confirmationPopup.Show();
    }
    else {
        Log.Error(`Unsupported or missing action name in URL: ${actionName}`);
    }
}
main();
//# sourceMappingURL=customscript.js.map