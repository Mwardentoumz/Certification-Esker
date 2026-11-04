"use strict";
const options = {
    maxElementsPerRecall: 50
};
Process.SetTimeOut(3600);
const NOT_FINISHED = 0;
if (Lib.UpdateArkhineoArchive.updateArchiveProcessFromDocument(options) === NOT_FINISHED) {
    Process.RecallScript("update_arkhineo_archive_in_progress", true);
}
//# sourceMappingURL=finalizationscript.js.map