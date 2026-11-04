"use strict";
if (!Data.GetValue("PaymentDate__")) {
    Data.SetValue("PaymentDate__", Helpers.Date.InDocumentTimezone(new Date()));
}
//# sourceMappingURL=extractionscript.js.map