/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_WIZARD",
  "scriptType": "CLIENT",
  "libraryType": "Lib",
  "comment": "HTML (custom script) AP wizard customization callbacks",
  "versionable": false,
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Wizard library: AP configuration wizard customization callbacks
 */

/**
 * Package AP configuration wizard customization callbacks
 * @namespace Lib.AP.Customization.Wizard
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * Auditor settings displayed in the Customizations step of the configurator.
	 * The fields exist in the "AP - Application Settings Wizard" process and in the "AP - Application Settings__" table,
	 * they are read in the Vendor invoice process with Sys.Parameters.GetInstance("AP").GetParameter("Z_...")
	 * (see AuditControl in LIB_AP_CUSTOMIZATION_COMMON).
	 */
	const AuditorSettings = (function ()
	{
		const Fields = {
			Enabled: "Z_Audit_Behavior__",
			IncludeMediumRisk: "Z_Include__",
			LineThreshold: "Z_AuditLineThreshold__",
			InvoiceThreshold: "Z_AuditInvoiceThreshold__"
		};

		// Starting values, to be validated with the customer
		const DefaultThresholds = {
			Z_AuditLineThreshold__: 1000,
			Z_AuditInvoiceThreshold__: 5000
		};

		const INVALID_THRESHOLD_MESSAGE = "Saisissez un montant positif";

		function IsEnabled()
		{
			return Boolean(Data.GetValue(Fields.Enabled));
		}

		/**
		 * @returns {boolean} true if all the auditor fields are in the form (Customizations pane of the wizard process)
		 */
		function AreFieldsInForm()
		{
			const missingFields = Object.keys(Fields)
				.map(function (key)
				{
					return Fields[key];
				})
				.filter(function (field)
				{
					return !Controls[field];
				});
			if (missingFields.length > 0)
			{
				Log.Error("[Audit] Fields missing in the Customizations pane of the configurator: " + missingFields.join(", "));
				return false;
			}
			return true;
		}

		/**
		 * The thresholds and the medium risk option only apply when the auditor behavior is enabled
		 */
		function RefreshLayout()
		{
			const enabled = IsEnabled();
			Controls[Fields.IncludeMediumRisk].SetReadOnly(!enabled);
			Controls[Fields.LineThreshold].SetReadOnly(!enabled);
			Controls[Fields.InvoiceThreshold].SetReadOnly(!enabled);
			Controls[Fields.LineThreshold].SetRequired(enabled);
			Controls[Fields.InvoiceThreshold].SetRequired(enabled);
		}

		function OnStart()
		{
			if (!AreFieldsInForm())
			{
				return;
			}
			for (const field in DefaultThresholds)
			{
				if (Data.IsNullOrEmpty(field))
				{
					Data.SetValue(field, DefaultThresholds[field]);
				}
			}
			Controls[Fields.Enabled].OnChange = RefreshLayout;
			RefreshLayout();
		}

		/**
		 * @returns {boolean} true if the thresholds are valid (positive amounts), false to stay on the step
		 */
		function OnQuit()
		{
			if (!AreFieldsInForm() || !IsEnabled())
			{
				return true;
			}
			let valid = true;
			[Fields.LineThreshold, Fields.InvoiceThreshold].forEach(function (field)
			{
				const value = parseFloat(Data.GetValue(field));
				if (isNaN(value) || value < 0)
				{
					Data.SetError(field, INVALID_THRESHOLD_MESSAGE);
					valid = false;
				}
				else
				{
					Data.SetError(field, "");
				}
			});
			return valid;
		}

		return {
			OnStart: OnStart,
			OnQuit: OnQuit
		};
	})();

	/**
	 * Specifics customization for the SAP and Generic AP Wizard
	 * @lends Lib.AP.Customization.Wizard
	 */
	parentLib.Wizard =
	{
		Common:
		{
			/**
			 * Displays the Customizations step of the configurator with the auditor settings
			 * @param {object} step The configurator's Customization step
			 */
			CustomizeStep: function (step)
			{
				step.isVisible = function ()
				{
					return true;
				};
				step.onStart = function ()
				{
					step.panels[0].SetText("Contrôle auditeur");
					AuditorSettings.OnStart();
				};
				step.onQuit = function ()
				{
					return AuditorSettings.OnQuit();
				};
			}
		}
	};

})(Lib.AP.Customization);
