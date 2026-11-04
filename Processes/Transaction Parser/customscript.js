"use strict";
/* TransactionParser HTML page script */
Log.Time("CustomScript");
function InitLayout() {
    Lib.CommonDialog.NextAlert.Show({});
    /** @this DatabaseComboBox & IControlInTable<TransactionParserLineTransactionTableRow>*/
    let employeeOnSelectItem = function (item) {
        let login = item.GetValue("Login");
        this.GetRow().EmployeeLogin__.SetValue(login);
    };
    /** @this DatabaseComboBox & IControlInTable<TransactionParserLineTransactionTableRow>*/
    let employeeOnUnknownOrEmptyValue = function () {
        this.GetRow().EmployeeLogin__.SetValue("");
    };
    Sys.Helpers.Controls.OnDatabaseComboboxEvents(Controls.LineTransaction__.EmployeeName__, employeeOnSelectItem, employeeOnUnknownOrEmptyValue, employeeOnUnknownOrEmptyValue);
    Controls.DocumentsPanel.AllowChangeOrUploadReferenceDocument(false);
    // set transactions table display
    Controls.LineTransaction__.SetWidth("100%");
    Controls.LineTransaction__.SetExtendableColumn("TransactionDescription__");
    Controls.Approve.OnClick = function () {
        //CheckRequiredFields();
        if (Process.ShowFirstError() === null) {
            ProcessInstance.Approve("Submit");
        }
        return false;
    };
    Sys.Helpers.TryCallFunction("Lib.Expense.TransactionParser.Customization.Client.CustomizeLayout");
}
////////////////////////////////////////////////////
// START
////////////////////////////////////////////////////
InitLayout();
Log.TimeEnd("CustomScript");
//# sourceMappingURL=customscript.js.map