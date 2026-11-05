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
	 * The custom fields are only updated by the AP specialist on an editable form
	 */
	function CanUpdateData()
	{
		return !ProcessInstance.isReadOnly && Lib.AP.WorkflowCtrl.GetCurrentStepRole() === Lib.AP.WorkflowCtrl.roles.apStart;
	}

	/**
	 * Calls the callback after the standard handler of an event (OnChange, OnDeleteItem...)
	 * @param {object} owner Control holding the event
	 * @param {string} eventName Name of the event
	 * @param {Function} callback Custom handler
	 */
	function ChainEvent(owner, eventName, callback)
	{
		const standardHandler = owner[eventName];
		owner[eventName] = function ()
		{
			const result = standardHandler ? standardHandler.apply(this, arguments) : undefined;
			callback();
			return result;
		};
	}

	/**
	 * Custom messages in the top warning banner of the standard form (TopPaneWarning),
	 * reused to avoid conflicts with standard messages. One message per key (vendor risk, audit).
	 */
	const TopBanner = (function ()
	{
		let topMessageWarning = null;
		const displayedMessages = {};

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
		 * Replaces the message of the key in the top warning banner
		 * @param {string} key Owner of the message
		 * @param {string} message Message to display, empty to remove it
		 */
		function Display(key, message)
		{
			const banner = GetTopMessageWarning();
			if (displayedMessages[key])
			{
				banner.Remove(displayedMessages[key]);
				displayedMessages[key] = null;
			}
			if (message)
			{
				banner.Add(message);
				displayedMessages[key] = message;
			}
		}

		return {
			Display: Display
		};
	})();

	/**
	 * Auditor control on the Vendor invoice form: "Facture à auditer" flag and message,
	 * "Alerte" column of the line items, lines in alert highlighted in orange
	 */
	const AuditUI = (function ()
	{
		// Orange background on each cell of the row
		const ALERT_STYLE = "highlight-warning";

		function GetAuditControl()
		{
			return Lib.AP.Customization.Common.CustomFunctions.AuditControl;
		}

		/**
		 * Highlights the line in orange when it has an alert
		 * @param {object} row Row of the line items table
		 */
		function StyleRow(row)
		{
			if (!row)
			{
				return;
			}
			if (GetAuditControl().IsEnabled() && row[GetAuditControl().Fields.LineAlert].GetValue())
			{
				row.AddStyle(ALERT_STYLE);
			}
			else
			{
				row.RemoveStyle(ALERT_STYLE);
			}
		}

		function StyleRows()
		{
			for (let i = 0; i < Controls.LineItems__.GetLineCount(); i++)
			{
				StyleRow(Controls.LineItems__.GetRow(i));
			}
		}

		/**
		 * Displays the audit message and, if allowed, recomputes the audit flags from the vendor risk level and the net amounts
		 * @param {boolean} silent true to update the fields without flagging the form as modified (form loading)
		 */
		function Refresh(silent)
		{
			try
			{
				const evaluation = GetAuditControl().Evaluate();
				TopBanner.Display("audit", evaluation.message);
				if (CanUpdateData())
				{
					if (silent)
					{
						ProcessInstance.SetSilentChange(true);
					}
					GetAuditControl().ApplyToForm(evaluation);
					if (silent)
					{
						ProcessInstance.SetSilentChange(false);
					}
				}
				StyleRows();
			}
			catch (error)
			{
				Log.Error("[Audit] Unexpected error while refreshing the audit flags: " + (error && error.message ? error.message : error));
			}
		}

		function Init()
		{
			const enabled = GetAuditControl().IsEnabled();
			const fields = GetAuditControl().Fields;
			Controls[fields.InvoiceToAudit].SetReadOnly(true);
			Controls[fields.InvoiceToAudit].Hide(!enabled);
			Controls.LineItems__[fields.LineAlert].SetReadOnly(true);
			Controls.LineItems__[fields.LineAlert].Hide(!enabled);
			if (!enabled)
			{
				return;
			}

			// Standard fields: header net amount, line net amount and line deletion
			ChainEvent(Controls.NetAmount__, "OnChange", function ()
			{
				Refresh(false);
			});
			ChainEvent(Controls.LineItems__.Amount__, "OnChange", function ()
			{
				Refresh(false);
			});
			ChainEvent(Controls.LineItems__, "OnDeleteItem", function ()
			{
				Refresh(false);
			});
		}

		return {
			Init: Init,
			Refresh: Refresh,
			StyleRow: StyleRow
		};
	})();

	/**
	 * Vendor risk display on the Vendor invoice form
	 */
	const VendorRiskUI = (function ()
	{
		function GetVendorRisk()
		{
			return Lib.AP.Customization.Common.CustomFunctions.VendorRisk;
		}

		/**
		 * Reads the vendor risk, displays it and, if allowed, updates the risk fields, the audit flags and the workflow
		 * @param {boolean} silent true to update the fields without flagging the form as modified (form loading)
		 * @returns {Sys.Helpers.Promise}
		 */
		function Refresh(silent)
		{
			const VendorRisk = GetVendorRisk();
			return VendorRisk.EvaluateInvoiceRisk()
				.Then(function (assessment)
				{
					TopBanner.Display("vendorRisk", assessment.message);
					let reviewChanged = false;
					if (CanUpdateData())
					{
						if (silent)
						{
							ProcessInstance.SetSilentChange(true);
						}
						reviewChanged = VendorRisk.ApplyToForm(assessment);
						if (silent)
						{
							ProcessInstance.SetSilentChange(false);
						}
					}
					// The audit flags depend on the vendor risk level
					AuditUI.Refresh(silent);
					if (reviewChanged)
					{
						// Add or remove the compliance review step (see Lib.AP.Customization.Common.Workflow.ProcessApproverList)
						Lib.AP.WorkflowCtrl.Rebuild(true, true, "Z_vendorRiskChanged");
					}
				})
				.Catch(function (error)
				{
					Log.Error("[VendorRisk] Unexpected error while displaying the vendor risk: " + (error && error.message ? error.message : error));
					TopBanner.Display("vendorRisk", "Évaluation du risque impossible, réessayez ou contactez le support");
				});
		}

		function Init()
		{
			Controls.Z_Risk_level__.SetReadOnly(true);
			Controls.Z_ComplianceReviewRequired__.SetReadOnly(true);
			// Re-evaluates the risk when the invoice amount changes, after the standard handler
			ChainEvent(Controls.InvoiceAmount__, "OnChange", function ()
			{
				Refresh(false);
			});
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
			AuditUI.Init();
			VendorRiskUI.Init();
		},

		/**
		 * Called when each line item row is refreshed (display, scroll, value change)
		 * @param {object} lineItemRow The line item row
		 */
		OnRefreshLineItemRowEnd: function (lineItemRow)
		{
			AuditUI.StyleRow(lineItemRow);
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
