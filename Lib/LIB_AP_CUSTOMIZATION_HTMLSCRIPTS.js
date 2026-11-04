/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_HTMLSCRIPTS",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP customization callbacks",
  "versionable": false,
  "require": [
    "Lib_AP_Customization_Common"
  ]
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.HTMLScripts library: HTML page script AP customization callbacks
 */

/**
 * Package AP HTML page script customization callbacks
 * @namespace Lib.AP.Customization.HTMLScripts
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * Vendor risk display on the Vendor invoice form
	 */
	const VendorRiskUI = (function ()
	{
		let topMessageWarning = null;
		let displayedMessage = null;

		function GetVendorRisk()
		{
			return Lib.AP.Customization.Common.CustomFunctions.VendorRisk;
		}

		/**
		 * Reuses the top warning banner of the standard form (TopPaneWarning) to avoid conflicts with standard messages
		 */
		function GetTopMessageWarning()
		{
			if (typeof g_topMessageWarning !== "undefined")
			{
				return g_topMessageWarning;
			}
			if (!topMessageWarning)
			{
				topMessageWarning = Lib.P2P.TopMessageWarning(Controls.TopPaneWarning, Controls.TopMessageWarningHTML__);
			}
			return topMessageWarning;
		}

		/**
		 * Replaces the vendor risk message in the top warning banner
		 * @param {string} message Message to display, empty to remove the banner
		 */
		function DisplayBanner(message)
		{
			const banner = GetTopMessageWarning();
			if (displayedMessage)
			{
				banner.Remove(displayedMessage);
				displayedMessage = null;
			}
			if (message)
			{
				banner.Add(message);
				displayedMessage = message;
			}
		}

		/**
		 * The risk fields are only updated by the AP specialist on an editable form
		 */
		function CanUpdateData()
		{
			return !ProcessInstance.isReadOnly && Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart;
		}

		/**
		 * Reads the vendor risk, displays it and, if allowed, updates the risk fields and the workflow
		 * @param {boolean} silent true to update the fields without flagging the form as modified (form loading)
		 * @returns {Sys.Helpers.Promise}
		 */
		function Refresh(silent)
		{
			const VendorRisk = GetVendorRisk();
			return VendorRisk.EvaluateInvoiceRisk()
				.Then(function (assessment)
				{
					DisplayBanner(assessment.message);
					if (!CanUpdateData())
					{
						return;
					}
					if (silent)
					{
						ProcessInstance.SetSilentChange(true);
					}
					const reviewChanged = VendorRisk.ApplyToForm(assessment);
					if (silent)
					{
						ProcessInstance.SetSilentChange(false);
					}
					if (reviewChanged)
					{
						// Add or remove the compliance review step (see Lib.AP.Customization.Common.Workflow.ProcessApproverList)
						Lib.AP.WorkflowCtrl.Rebuild(true, true, "Z_vendorRiskChanged");
					}
				})
				.Catch(function (error)
				{
					Log.Error("[VendorRisk] Unexpected error while displaying the vendor risk: " + (error && error.message ? error.message : error));
					DisplayBanner("Évaluation du risque impossible, réessayez ou contactez le support");
				});
		}

		/**
		 * Re-evaluates the risk when the invoice amount changes, after the standard handler
		 */
		function ChainOnChange(control)
		{
			const standardOnChange = control.OnChange;
			control.OnChange = function ()
			{
				const result = standardOnChange ? standardOnChange.apply(this, arguments) : undefined;
				Refresh(false);
				return result;
			};
		}

		function Init()
		{
			Controls.Z_Risk_level__.SetReadOnly(true);
			Controls.Z_ComplianceReviewRequired__.SetReadOnly(true);
			ChainOnChange(Controls.InvoiceAmount__);
			Refresh(true);
		}

		return {
			Init: Init,
			Refresh: Refresh
		};
	})();

	/**
	 * @lends Lib.AP.Customization.HTMLScripts
	 */
	parentLib.HTMLScripts =
	{
		/**
		 * Called at the end of the HTML page script of the Vendor invoice process
		 */
		OnHTMLScriptEnd: function ()
		{
			VendorRiskUI.Init();
		},

		/**
		 * Called after a user changes the vendor name or vendor number
		 * @param {object} queryResult The vendor returned by GetVendorByName/GetVendorByNumber query
		 */
		OnVendorChange: function (queryResult)
		{
			VendorRiskUI.Refresh(false);
		},

		/**
		 * Adds the "high risk vendor" reason to the set aside reasons, used by the server side risk rule
		 * @param {string} reasons The standard reasons, as a list of "key=value" separated by line breaks
		 * @param {string} paramListName The name of the AP configuration parameter holding the reasons
		 * @param {string} paramDataName The name of the field holding the reason
		 * @returns {string|void} The reasons to use
		 */
		CustomizeInitReasonsFromConfig: function (reasons, paramListName, paramDataName)
		{
			if (paramListName !== "AsideReasons" || !reasons)
			{
				return;
			}
			const VendorRisk = Lib.AP.Customization.Common.CustomFunctions.VendorRisk;
			return reasons + "\n" + VendorRisk.ASIDE_REASON_KEY + "=" + VendorRisk.ASIDE_REASON_LABEL;
		}
	};

})(Lib.AP.Customization);
