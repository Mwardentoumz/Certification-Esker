"use strict";
if (ProcessInstance.isOpenInPopup) {
    ProcessInstance.SetSilentChange(true);
    Controls.DataPanel.Hide(true);
    const configRuid = ProcessInstance.selectedRuidFromView;
    if (configRuid) {
        Lib.MobileConfig.MoveUp(configRuid[0])
            .Finally(() => {
            ProcessInstance.Quit("quit");
        });
    }
    else {
        ProcessInstance.Quit("quit");
    }
}
//# sourceMappingURL=customscript.js.map