"use strict";
const g_debug = ProcessInstance.isDebugActive;
const archiveProvider = Variable.GetValueAsString("ArchiveProvider");
if (archiveProvider === "Arkhineo" || g_debug) {
    Controls.ArkhineoArchivingInfo__.Hide(!g_debug);
    Controls.LinkToArchive__.Hide(!g_debug);
    Controls.SystemData.Hide(false);
}
else {
    Controls.SystemData.Hide(true);
    Controls.LinkToArchive__.Hide(!Data.GetValue("ArchiveUniqueIdentifier__"));
    Controls.LinkToArchive__.DisplayAs({ type: "Link" });
    Controls.LinkToArchive__.OnClick = function () {
        Process.OpenLink(Data.GetValue("LinkToArchive__"));
    };
}
//# sourceMappingURL=customscript.js.map