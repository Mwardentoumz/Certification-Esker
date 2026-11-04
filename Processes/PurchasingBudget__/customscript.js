"use strict";
var CustomScript;
(function (CustomScript) {
    const budget = {
        Items: [],
        PeriodCode__: "",
        PeriodStart__: "",
        PeriodEnd__: "",
        Budget__: 0,
        Received__: 0,
        Closed__: false,
        ToApprove__: 0,
        Committed__: 0,
        Ordered__: 0,
        InvoicedPO__: 0,
        InvoicedNonPO__: 0,
        CompanyCode__: ""
    };
    /**
     * Initform
     */
    function InitForm() {
        ProcessInstance.SetFormWidth(1280);
        InitOperationDetailsPane();
        InitRelatedPRPOInvoiceViews();
        Controls.CompanyCode__.OnChange = function () {
            Sys.Helpers.Array.ForEach([
                "CostCenter__",
                "Group__",
                "PeriodCode__"
            ], function (field) {
                Controls[field].SetValue(null);
            });
        };
    }
    function InitOperationDetailsPane() {
        Controls.OperationDetailsView__.SetView({
            tabName: "",
            viewName: "_Budget Operation Details view",
            processOrTableName: "PurchasingBudgetOperationDetails__",
            checkProfileTab: false,
            isSystem: true,
            filterParameters: { budgetID: Controls.BudgetID__.GetValue() }
        });
        Controls.OperationDetailsView__.Apply();
    }
    function InitRelatedPRPOInvoiceViews() {
        Sys.Parameters.GetInstance("P2P").IsReady(() => {
            if (Sys.Parameters.GetInstance("P2P").GetParameter("DisplayEnhancedBudgetInformation", "0") !== "0") {
                Controls.RelatedPRPanel.Hide(false);
                Controls.RelatedPOPanel.Hide(false);
                Controls.RelatedInvoicePanel.Hide(false);
                Controls.RelatedPRAdminList__.SetView({
                    tabName: "",
                    viewName: "_Table 'Purchase requisitions - Items'",
                    isSystem: true,
                    checkProfileTab: false,
                    filterParameters: { BudgetID: Controls.BudgetID__.GetValue() }
                });
                Controls.RelatedPRAdminList__.Apply();
                Controls.RelatedPOAdminList__.SetView({
                    tabName: "",
                    viewName: "_Table 'Purchase order - Items'",
                    isSystem: true,
                    checkProfileTab: false,
                    filterParameters: { BudgetID: Controls.BudgetID__.GetValue() }
                });
                Controls.RelatedPOAdminList__.Apply();
                Controls.RelatedInvoiceAdminList__.SetView({
                    tabName: "",
                    viewName: "_Table 'Invoice - Items'",
                    isSystem: true,
                    checkProfileTab: false,
                    filterParameters: { BudgetID: Controls.BudgetID__.GetValue() }
                });
                Controls.RelatedInvoiceAdminList__.Apply();
            }
        });
    }
    /**
     * Start
     */
    function Start() {
        var _a;
        Sys.Parameters.GetInstance("P2P").IsReady(() => {
            const enableLowBudgetNotification = Sys.Parameters.GetInstance("P2P").GetParameterBool("EnableLowBudgetNotification");
            Controls.NotificationsPane.Hide(!enableLowBudgetNotification);
            Controls.NotifyOwner__.Hide(false);
            const notifyOwner = Data.GetValue("NotifyOwner__");
            Controls.WarningThreshold__.Hide(!notifyOwner);
            Controls.OwnerLogin__.Hide(!notifyOwner);
        });
        Sys.Helpers.Array.ForEach(["Budget__"].concat(Lib.Spending.Budget.budgetHandler.GetImpactSteps()), function (field) {
            if (field in Controls && Controls[field].GetValue() === null) {
                Controls[field].SetValue(0);
            }
            budget[field] = Controls[field].GetValue();
        });
        Controls.BudgetRemaining__.SetValue(((_a = Lib.Spending.Budget.budgetHandler.ComputeRemainingForSteps(budget, budget.Budget__)) === null || _a === void 0 ? void 0 : _a.toNumber()) || "");
        if (Controls.BudgetRemaining__.GetValue() >= 0 || Controls.BudgetRemaining__.GetValue() == null) {
            Controls.BudgetRemaining__.RemoveStyle("text-highlight-warning");
        }
        else {
            Controls.BudgetRemaining__.AddStyle("text-highlight-warning");
        }
        Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
    }
    // Start custom script
    InitForm();
    Start();
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map