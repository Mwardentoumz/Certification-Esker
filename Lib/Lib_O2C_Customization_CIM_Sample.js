/* eslint no-empty-function: "off", no-unused-vars: "off" */
/* LIB_DEFINITION{
  "name": "Lib_O2C_Customization_CIM_Sample",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "versionable": false,
  "comment": "Client side customization for the CIM",
  "require": []
}*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.O2C = Lib.O2C || {};
Lib.O2C.Customization = Lib.O2C.Customization || {};

/**
 * @namespace Lib.O2C.Customization.CIM
*/
Lib.O2C.Customization.CIM = (function ()
{
	/**
	 * @lends Lib.O2C.Customization.CIM
	 */
	var customization = {
		/**
		 * @namespace
		 */
		/**
		 * @description This function will be called when loading the CIM.
		 * It allows you to change the default tab that loads.
		 * @returns {string} The ID of the tab you want to open.
		 *
		 * @example
		 * <pre><code>function GetStartMenuTabID()
		 * {
		 *		return User.profileName === "Credit Analyst" ? "creditScore" : "invoices";
		 * }</code></pre>
		 **/
		GetStartMenuTabID: function ()
		{
			return null;
		},

		/**
		 * @description This function will be called when initialized navmenu.
		 * It allows you to add or update some menu.
		 * Be aware that you need to add a new line in the NavMenu__ navigation drawer control before
		 * Warning key in object must be the same as in the navigation drawer!
		 *
		 * @example
		 * <pre><code>
		 * AddOrUpdateNavMenus: function (menusObject)
		 * {
		 * 		menusObject.contacts = {
		 * 			panes: {
		 * 				CustomerListPane: true,
		 * 				TimelinePane: true,
		 * 				MainContactPane: true,
		 * 				HistoryPane: true
		 * 			},
		 * 			init: function ()
		 * 			{
		 * 				this.panes.TimelinePane = TermSyncHelper._termSyncEnabled;
		 * 				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
		 * 				Controls.CustomerList__.SetView({
		 * 					tabName: "_Customer list tab - embedded",
		 * 					viewName: "_Customer list - embedded",
		 * 					filter: CustomerDetailsHelper.GetCustomerFilter("contacts"),
		 * 					checkProfileTab: false
		 * 				});
		 * 			},
		 * 			onStart: function ()
		 * 			{
		 * 				Controls.CustomerList__.Apply();
		 * 			}
		 * 		};
		 * 	}</code></pre>
		 * @example
		 * <pre><code>
		 * AddOrUpdateNavMenus: function (menusObject)
		 * {
		 * 		if (menusObject.insuranceInformation && menusObject.insuranceInformation.onStart)
		 * 		{
		 * 			const originalStart = menusObject.insuranceInformation.onStart;
		 * 			menusObject.insuranceInformation.onStart = async function ()
		 * 			{
		 * 				await originalStart.call(this);
		 * 				Controls.ObtainInsurerIdentifier__.Hide(true);
		 * 				Controls.NoItemsToDisplay__.SetText(Language.Translate("_Custom no items to display message"));
		 * 			};
		 * 		}
		 * 	}</code></pre>
		 **/

		AddOrUpdateNavMenus: function (/*menusObject*/)
		{ },

		/**
		 * @description This function will be called in function to Hide some navigation drawer menu
		 * It allows you to hide an undesired menu on Customer interface
		 * @example
		 * <pre><code>
		 * DisplayNavMenu: function ()
		 * {
		 *		var ar = ProcessInstance.extendedProperties.appInstances.AR;
		 *		var cashapp = Sys.AR.GetParameter("EnableCashApplication");
		 *		var paymentEnabled = Sys.AR.GetParameter("EnablePaymentFeature");
		 *		if (!(cashapp || (ar && paymentEnabled)))
		 *		{
		 *			Controls.NavMenu__.HideItem("payments");
		 *		}
		 * }</code></pre>
		 **/
		DisplayNavMenu: function ()
		{ },

		/**
		 * @description This function will be called add the end of the Maion function in customer interface
		 * @example
		 * <pre><code>
		 * CustomizeHTMLScript: function ()
		 * {
		 *		Controls.CreditHold.Hide(false);
		 *		Controls.CreditHold.SetLabel(Language.Translate("_DisableCreditHold"));
			 * }</code></pre>
		 **/
		CustomizeHTMLScript: function ()
		{ },
		/**
		 * @description This function will be called to customize the company object used to retrieve some credit score information
		 * for example if you want to change experian endpoint based on a field on the customer interface you just have to add the data to the company object
		 * @example
		 * <pre><code>
		 * CompanyDataForScoring: function (company)
		 * {
		 *		company.taxId = Data.GetValue("Z_TaxId__");
		 *		return company;
			 * }
		 * </code></pre>
		 **/
		CompanyDataForScoring: function (/*company*/)
		{ },

		/**
		 * @namespace Lib.O2C.Customization.CIM.UpdateCreditInformationPopup
		 * @description Customization functions for the Update Credit Information popup dialog
		 */
		UpdateCreditInformationPopup: {
			/**
			 * @method Lib.O2C.Customization.CIM.UpdateCreditInformationPopup.FillDialog
			 * @description This function will be used to fill the dialog with custom fields
			 * @param {Object} dialog - The dialog object to customize
			 * @param {string} reviewType - The type of review ("creditHoldReviewType", "manualReviewType")
			 * @example
			 * <pre><code>
			 * FillDialog: function (dialog, reviewType)
			 * {
			 *		if (reviewType === "creditHoldReviewType")
			 *		{
			 *			dialog.AddText("CreditHoldReason_", "_Credit Hold Reason").SetValue("Exceeds credit limit");
			 *			dialog.AddText("ReviewerNotes_", "_Reviewer Notes").SetValue("Requires manager approval");
			 *		}
			 *		else if (reviewType === "manualReviewType")
			 *		{
			 *			dialog.AddText("ManualReviewReason_", "_Manual Review Reason").SetValue("Customer request");
			 *			dialog.AddText("ApprovalLevel_", "_Approval Level").SetValue("Level 2");
			 *		}
			 *		
			 *		// Common fields for all review types
			 *		dialog.AddText("ReviewDate_", "_Review Date").SetValue(new Date().toLocaleDateString());
			 *	}
			 * </code></pre>
			 **/
			FillDialog: function (/*dialog, reviewType*/)
			{ },

			/**
			 * @method Lib.O2C.Customization.CIM.UpdateCreditInformationPopup.GetOverriddenValues
			 * @description This function will be used to get the values to override in the Credit Review
			 * @param {Object} dialog - The dialog object containing the custom fields
			 * @param {string} reviewType - The type of review ("creditHoldReviewType", "manualReviewType")
			 * @param {Object} overriddenValues - The object to populate with overridden values
			 * @example
			 * <pre><code>
			 * GetOverriddenValues: function (dialog, reviewType, overriddenValues)
			 * {
			 *		if (reviewType === "creditHoldReviewType")
			 *		{
			 *			overriddenValues.CreditHoldReason_ = dialog.GetControl("CreditHoldReason_").GetValue();
			 *			overriddenValues.ReviewerNotes_ = dialog.GetControl("ReviewerNotes_").GetValue();
			 *		}
			 *		else if (reviewType === "manualReviewType")
			 *		{
			 *			overriddenValues.ManualReviewReason_ = dialog.GetControl("ManualReviewReason_").GetValue();
			 *			overriddenValues.ApprovalLevel_ = dialog.GetControl("ApprovalLevel_").GetValue();
			 *		}
			 *		
			 *		// Common fields for all review types
			 *		overriddenValues.ReviewDate_A = dialog.GetControl("ReviewDate_").GetValue();
			 *	}
			 * </code></pre>
			 **/
			GetOverriddenValues: function (/*dialog, reviewType, overriddenValues*/)
			{ }
		}

	};

	return customization;
})();
