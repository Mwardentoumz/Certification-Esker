"use strict";
let dial = {
    fill_CB: function (dialog) {
        dialog.SetWidth("400px");
        dialog.AddDescription("ctrlDesc").SetText("_ChooseFile");
        dialog.AddSeparator();
        let ctrlFileUploader = dialog.AddFileUploader("ctrlFiles", ""); // the string empty is for don't have style="Width: 100%" and a scroll bar
        ctrlFileUploader.SetAllowedExtensions(["json"]);
        //ctrlFileUploader.SetAllowUploadingOnlyOneFile(true);
    },
    commit_CB: function (dialog) {
        let ctrlFiles = dialog.GetControl("ctrlFiles");
        let files = ctrlFiles.GetUploadedFiles();
        if (files && files.length > 0) {
            files.forEach((uploadedFile) => Attach.AddAttach(uploadedFile));
            ProcessInstance.Approve("Save");
        }
        else {
            Log.Error("No files submitted.");
            ProcessInstance.Quit("quit");
        }
    },
    cancel_CB: function () {
        ProcessInstance.Quit("quit");
    },
    Show: function () {
        Popup.Dialog("_ImportConfig", null, this.fill_CB, this.commit_CB, null, null, this.cancel_CB);
    }
};
let dialForceUpgrade = {
    processList: [],
    fill_CB: function (dialog) {
        dialog.SetWidth("400px");
        dialog.AddDescription("ctrlDesc").SetText("_ForceUpgradeDescription");
        let ctrlProcessList = dialog.AddMultilineText("ctrlProcessList");
        ctrlProcessList.SetText("\u2022" + dialForceUpgrade.processList.join("\n\u2022"));
        ctrlProcessList.SetReadOnly(true);
        dialog.HideDefaultButtons();
        let control = dialog.AddButton("Updgrade__", "_Upgrade");
        control.SetWarningStyle();
        dialog.AddButton("Cancel__", "_Cancel");
        dialog.AddSeparator();
    },
    commit_CB: function () {
        ProcessInstance.Approve("ForceUpgrade");
    },
    cancel_CB: function () {
        // For set the process status to 100
        ProcessInstance.ApproveAsynchronous("Finalize");
    },
    handle_CB: function (dialog, tabId, event, control) {
        if (event === "OnClick") {
            switch (control.GetName()) {
                case "Updgrade__":
                    dialog.Commit();
                    break;
                case "Cancel__":
                default:
                    dialog.Cancel();
                    break;
            }
        }
    }
};
function ChangeReturnURL(json) {
    return function () {
        Lib.MobileConfig.ChangeReturnURL(json.ProcessConfiguration > json.GlobalConfiguration ? "_MobileProcessConfigurationView" : "_MobileGlobalConfigurationView");
        ProcessInstance.Quit("quit");
    };
}
function NotifyAndQuit() {
    let savingResult = Variable.GetValueAsString("savingResult");
    if (savingResult) {
        const json = JSON.parse(savingResult);
        if (json.error) {
            Popup.Alert(json.error, true, () => ProcessInstance.Quit("quit"), "_Import mobile configuration");
        }
        else if (json.warning) {
            dialForceUpgrade.processList = json.warning;
            Popup.Dialog("_ForceUpgrade", null, dialForceUpgrade.fill_CB, dialForceUpgrade.commit_CB, null, dialForceUpgrade.handle_CB, dialForceUpgrade.cancel_CB);
        }
        else {
            const CallbackOnOK = ChangeReturnURL(json);
            Popup.Alert("_Mobile configuration successfully imported", false, CallbackOnOK, "_Import mobile configuration");
        }
    }
}
if (ProcessInstance.isOpenInPopup) {
    ProcessInstance.SetSilentChange(true);
    Controls.DataPanel.Hide(true);
    if (ProcessInstance.state) {
        NotifyAndQuit();
    }
    else {
        dial.Show();
    }
}
//# sourceMappingURL=customscript.js.map