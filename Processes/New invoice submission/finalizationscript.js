"use strict";
function SubmitInvoices() {
    const curUserLogin = Users.GetUser(Data.GetValue("OwnerId")).GetValue("Login");
    const nbAttach = Attach.GetNbAttach();
    for (let i = 0; i < nbAttach; i++) {
        const attach = Attach.GetAttach(i);
        const VIPTransport = Process.CreateProcessInstanceForUser("Vendor invoice", curUserLogin, 0, true);
        if (VIPTransport) {
            const newAttach = VIPTransport.AddAttachEx(attach);
            const attachVars = newAttach.GetVars();
            attachVars.AddValue_String("AttachToProcess", "1", true);
            VIPTransport.GetUninheritedVars().AddValue_String("SourceRUID", Data.GetValue("RUIDEx"), true); //Write the sourceRUID to avoid the forward to apclerk
            Sys.Helpers.TryCallFunction("Lib.AP.Customization.Finalization.PreProcessTransport", VIPTransport, curUserLogin);
            VIPTransport.Process();
            const error = VIPTransport.GetLastError();
            if (error) {
                Log.Error(`[${(i + 1)}/${nbAttach}] Cannot generate 'Vendor invoice' record: Error ${error}: ${VIPTransport.GetLastErrorMessage()}`);
            }
        }
    }
}
SubmitInvoices();
//# sourceMappingURL=finalizationscript.js.map