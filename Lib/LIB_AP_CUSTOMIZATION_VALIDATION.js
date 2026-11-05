/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_VALIDATION",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Validation Script AP customization callbacks",
  "versionable": false,
  "require": [
    "Sys/Sys_WorkflowController",
    "Lib_AP_Customization_Common"
  ]
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Validation library: validation script AP customization callbacks
 */

/**
 * Customization callbacks for the validation of the Vendor invoice process
 * @namespace Lib.AP.Customization.Validation
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * Business rule: after extraction, an invoice from a high risk vendor whose amount exceeds
	 * the high risk threshold is set aside with an explicit reason instead of being processed (touchless or not).
	 */
	const VendorRiskRule = (function ()
	{
		function GetVendorRisk()
		{
			return Lib.AP.Customization.Common.CustomFunctions.VendorRisk;
		}

		/**
		 * The rule only applies to the first validation following the extraction
		 */
		function IsFirstValidationAfterExtraction()
		{
			return Data.GetActionType() === ""
				&& Data.GetActionName() === ""
				&& Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToVerify;
		}

		/**
		 * @returns {object|null} The assessment, null if the evaluation could not be done
		 */
		function Evaluate()
		{
			let result = null;
			// Server side queries are synchronous: the promise is settled when Then returns
			GetVendorRisk().EvaluateInvoiceRisk()
				.Then(function (assessment)
				{
					GetVendorRisk().ApplyToForm(assessment);
					result = assessment;
				})
				.Catch(function (error)
				{
					Log.Error("[VendorRisk] Unexpected error in risk rule: " + (error && error.message ? error.message : error));
				});
			return result;
		}

		function SetAside(assessment)
		{
			const comment = GetVendorRisk().GetSetAsideComment(assessment);
			Log.Info("[VendorRisk] " + comment);
			Data.SetValue("AsideReason__", GetVendorRisk().ASIDE_REASON_KEY);
			Data.SetValue("SetAsideDate__", new Date());
			Data.SetValue("Comment__", comment);
			if (Sys.FRB2B && Sys.FRB2B.AP && Sys.FRB2B.AP.OnHoldCDVType)
			{
				Variable.SetValueAsString("FRB2BCDVOnHoldType", Sys.FRB2B.AP.OnHoldCDVType.NothingToDeclare);
			}
			Lib.AP.WorkflowCtrl.DoAction("setAside");
			Process.PreventApproval();
		}

		/**
		 * Wraps the default action (first validation after extraction)
		 * @param {object} defaultAction approveActionMap[""] of the validation script
		 */
		function WrapDefaultAction(defaultAction)
		{
			const standardExecute = defaultAction.execute;
			defaultAction.execute = function ()
			{
				if (IsFirstValidationAfterExtraction())
				{
					const assessment = Evaluate();
					if (assessment && assessment.setAside)
					{
						SetAside(assessment);
						return;
					}
				}
				standardExecute.apply(this, arguments);
			};

			const standardExecuteOnInvalidData = defaultAction.executeOnInvalidData;
			defaultAction.executeOnInvalidData = function ()
			{
				const firstValidation = IsFirstValidationAfterExtraction();
				if (standardExecuteOnInvalidData)
				{
					standardExecuteOnInvalidData.apply(this, arguments);
				}
				// The standard may already have set the invoice aside (waiting for goods receipt)
				if (firstValidation && Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToVerify)
				{
					const assessment = Evaluate();
					if (assessment && assessment.setAside)
					{
						SetAside(assessment);
					}
				}
			};
		}

		return {
			WrapDefaultAction: WrapDefaultAction
		};
	})();

	/**
	 * Auditor control: at the end of each validation, recomputes the audit flags (amounts may have been changed
	 * by the AP specialist or by a script without client event) and grants or removes the read-only access of the auditors group.
	 */
	const AuditRule = (function ()
	{
		function GetAuditControl()
		{
			return Lib.AP.Customization.Common.CustomFunctions.AuditControl;
		}

		/**
		 * The read right is granted with SetRight so that RemoveRight can withdraw it
		 * when the vendor is no longer sensitive or the auditor behavior is disabled
		 */
		function UpdateAuditorsRights(sensitive)
		{
			const groupLogin = GetAuditControl().GetAuditorsGroupLogin();
			if (!groupLogin)
			{
				return;
			}
			if (sensitive)
			{
				Log.Info("[Audit] Grant read right to " + groupLogin);
				Process.SetRight(groupLogin, "read");
			}
			else
			{
				Process.RemoveRight(groupLogin);
			}
		}

		function Run()
		{
			try
			{
				const evaluation = GetAuditControl().Evaluate();
				// Amounts can only change before posting
				if (Data.GetValue("InvoiceStatus__") === Lib.AP.InvoiceStatus.ToVerify)
				{
					GetAuditControl().ApplyToForm(evaluation);
				}
				UpdateAuditorsRights(evaluation.sensitive);
			}
			catch (error)
			{
				Log.Error("[Audit] Unexpected error in audit rule: " + (error && error.message ? error.message : error));
			}
		}

		return {
			Run: Run
		};
	})();

	/**
	 * @lends Lib.AP.Customization.Validation
	 */
	parentLib.Validation =
	{
		/**
		 * Allows you to extend the action map of the validation script
		 * @param {object} validationActionMap Action map of the validation script
		 */
		ExtendActionMap: function (validationActionMap)
		{
			if (validationActionMap[""])
			{
				VendorRiskRule.WrapDefaultAction(validationActionMap[""]);
			}
		},

		/**
		 * Called at the very end of the validation script in all cases
		 * @param {string} actionType Return value of Data.GetActionType()
		 * @param {string} actionName Action name in lower case
		 */
		OnValidationScriptEnd: function (actionType, actionName)
		{
			AuditRule.Run();
		}
	};

})(Lib.AP.Customization);
