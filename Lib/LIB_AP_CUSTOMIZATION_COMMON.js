/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_COMMON",
  "scriptType": "COMMON",
  "libraryType": "Lib",
  "comment": "Script AP customization callbacks",
  "versionable": false,
  "require": []
}*/
/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.AP.Customization.Common library: AP customization callbacks shared by client and server scripts
 */

/**
 * Package AP common scripts customization callbacks
 * @namespace Lib.AP.Customization.Common
 */

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.AP = Lib.AP || {};
Lib.AP.Customization = Lib.AP.Customization || {};

(function (parentLib)
{
	/**
	 * Vendor risk management: reads the risk level of the vendor in the "AP - Vendors__" table
	 * (Z_Risk_Level__ / Z_Risk_details__) and computes the controls to apply on the invoice.
	 * The same functions are used by the HTML page script (vendor change), the extraction script,
	 * the validation script (set aside rule) and the workflow (compliance review step).
	 */
	const VendorRisk = (function ()
	{
		const LOG_PREFIX = "[VendorRisk] ";
		const VENDORS_TABLE = "AP - Vendors__";

		const RiskLevel = {
			Low: "Faible",
			Medium: "Moyen",
			High: "Élevé"
		};

		const Status = {
			OK: "ok",
			VendorUnknown: "vendorUnknown",
			VendorNotFound: "vendorNotFound",
			LevelMissing: "levelMissing",
			ThresholdMissing: "thresholdMissing",
			TechnicalError: "technicalError"
		};

		// Messages displayed to the user when the risk cannot be evaluated
		const ErrorMessages = {
			vendorUnknown: "Fournisseur non identifié, risque non évalué",
			vendorNotFound: "Fournisseur non identifié, risque non évalué",
			levelMissing: "Niveau de risque non renseigné pour ce fournisseur",
			thresholdMissing: "Seuils de risque non configurés, contactez l'administrateur",
			technicalError: "Évaluation du risque impossible, réessayez ou contactez le support"
		};

		// Parameters (see LIB_P2P_CUSTOM_PARAMETERS)
		const Parameters = {
			ThresholdMedium: "Z_RiskThresholdMedium",
			ThresholdHigh: "Z_RiskThresholdHigh",
			ComplianceReviewerLogin: "Z_ComplianceReviewerLogin",
			ComplianceReviewerName: "Z_ComplianceReviewerName"
		};

		// Key stored in AsideReason__ when the invoice is set aside by the risk rule
		const ASIDE_REASON_KEY = "High risk vendor";
		const ASIDE_REASON_LABEL = "Fournisseur à risque élevé : revue conformité requise";
		const COMPLIANCE_REVIEW_RULE = "Revue conformité (fournisseur à risque)";

		function GetParameter(name)
		{
			return Sys.Parameters.GetInstance("AP").GetParameter(name, "");
		}

		/**
		 * @param {string} level Risk level of the vendor
		 * @returns {number|null} Threshold for the risk level, null if not configured
		 */
		function GetThreshold(level)
		{
			const paramName = level === RiskLevel.High ? Parameters.ThresholdHigh : Parameters.ThresholdMedium;
			const threshold = parseFloat(GetParameter(paramName));
			return isNaN(threshold) ? null : threshold;
		}

		/**
		 * @returns {number} Invoice amount in company currency (invoice currency if not computed yet)
		 */
		function GetInvoiceAmount()
		{
			return parseFloat(Data.GetValue("LocalInvoiceAmount__")) || parseFloat(Data.GetValue("InvoiceAmount__")) || 0;
		}

		function FormatAmount(amount)
		{
			return Number(amount).toFixed(2);
		}

		/**
		 * Reads the risk of a vendor in the vendors table. Works on client and server side.
		 * @param {string} companyCode Company code of the invoice
		 * @param {string} vendorNumber Vendor number
		 * @returns {Sys.Helpers.Promise} Resolved with { found, level, details }, rejected if the query fails
		 */
		function QueryVendorRisk(companyCode, vendorNumber)
		{
			const filter = Sys.Helpers.LdapUtil.FilterAnd(
				Sys.Helpers.LdapUtil.FilterEqual("CompanyCode__", companyCode),
				Sys.Helpers.LdapUtil.FilterEqual("Number__", vendorNumber)
			).toString();

			return Sys.GenericAPI.PromisedQuery({
				table: VENDORS_TABLE,
				filter: filter,
				attributes: ["Number__", "Z_Risk_Level__", "Z_Risk_details__"],
				maxRecords: 1
			})
				.Then(function (results)
				{
					if (!results || results.length === 0)
					{
						return { found: false, level: "", details: "" };
					}
					return {
						found: true,
						level: results[0].Z_Risk_Level__ || "",
						details: results[0].Z_Risk_details__ || ""
					};
				});
		}

		/**
		 * Builds the assessment from the vendor risk and the invoice amount.
		 * In case of doubt (missing data or configuration), the compliance review is required.
		 */
		function BuildAssessment(vendorNumber, risk, amount)
		{
			const assessment = {
				status: Status.OK,
				vendorNumber: vendorNumber,
				level: risk.level,
				details: risk.details,
				amount: amount,
				threshold: null,
				reviewRequired: false,
				setAside: false,
				message: ""
			};

			if (!risk.found)
			{
				assessment.status = Status.VendorNotFound;
				return assessment;
			}

			if (risk.level === RiskLevel.Low)
			{
				return assessment;
			}

			if (risk.level !== RiskLevel.Medium && risk.level !== RiskLevel.High)
			{
				assessment.status = Status.LevelMissing;
				assessment.reviewRequired = true;
				return assessment;
			}

			assessment.threshold = GetThreshold(risk.level);
			if (assessment.threshold === null)
			{
				assessment.status = Status.ThresholdMissing;
				assessment.reviewRequired = true;
				return assessment;
			}

			const overThreshold = amount > assessment.threshold;
			assessment.reviewRequired = overThreshold;
			assessment.setAside = overThreshold && risk.level === RiskLevel.High;

			const reason = risk.details ? " (" + risk.details + ")" : "";
			const review = overThreshold
				? " Revue conformité requise : montant " + FormatAmount(amount) + " > seuil " + FormatAmount(assessment.threshold) + "."
				: "";
			if (risk.level === RiskLevel.High)
			{
				assessment.message = "ALERTE : fournisseur à risque élevé" + reason + "." + review;
			}
			else
			{
				assessment.message = "Avertissement : fournisseur à risque moyen" + reason + "." + review;
			}
			return assessment;
		}

		/**
		 * Writes the log matching the assessment status
		 * @param {object} assessment Result of EvaluateInvoiceRisk
		 * @param {*} [error] Technical error, if any
		 */
		function LogAssessment(assessment, error)
		{
			const context = "vendor '" + assessment.vendorNumber + "', company code '" + Data.GetValue("CompanyCode__") + "'";
			switch (assessment.status)
			{
				case Status.VendorUnknown:
					Log.Info(LOG_PREFIX + "No vendor on the invoice, risk not evaluated");
					break;
				case Status.VendorNotFound:
					Log.Warn(LOG_PREFIX + "Vendor not found in table " + VENDORS_TABLE + " for " + context + ", risk not evaluated");
					break;
				case Status.LevelMissing:
					Log.Warn(LOG_PREFIX + "Risk level not set or invalid ('" + assessment.level + "') for " + context + ", compliance review required as a precaution");
					break;
				case Status.ThresholdMissing:
					Log.Error(LOG_PREFIX + "Risk threshold parameter not configured for level '" + assessment.level + "' (" + Parameters.ThresholdMedium + " / " + Parameters.ThresholdHigh + "), compliance review required as a precaution");
					break;
				case Status.TechnicalError:
					Log.Error(LOG_PREFIX + "Risk evaluation failed for " + context + ": " + (error && error.message ? error.message : error) + ", compliance review required as a precaution");
					break;
				default:
					Log.Info(LOG_PREFIX + "Risk '" + assessment.level + "' for " + context + ", amount " + FormatAmount(assessment.amount)
						+ ", threshold " + (assessment.threshold === null ? "none" : FormatAmount(assessment.threshold))
						+ ", review required: " + assessment.reviewRequired + ", set aside: " + assessment.setAside);
			}
		}

		/**
		 * Evaluates the risk of the invoice vendor from the current form data.
		 * The returned promise is never rejected: technical errors are converted into a "technicalError" assessment.
		 * @returns {Sys.Helpers.Promise} Resolved with the assessment
		 */
		function EvaluateInvoiceRisk()
		{
			const companyCode = Data.GetValue("CompanyCode__");
			const vendorNumber = Data.GetValue("VendorNumber__");
			const amount = GetInvoiceAmount();
			let assessment;

			if (!vendorNumber)
			{
				assessment = BuildAssessment(vendorNumber, { found: false }, amount);
				assessment.status = Status.VendorUnknown;
				assessment.message = ErrorMessages[assessment.status];
				LogAssessment(assessment);
				return Sys.Helpers.Promise.Resolve(assessment);
			}

			return QueryVendorRisk(companyCode, vendorNumber)
				.Then(function (risk)
				{
					assessment = BuildAssessment(vendorNumber, risk, amount);
					if (assessment.status !== Status.OK)
					{
						assessment.message = ErrorMessages[assessment.status];
					}
					LogAssessment(assessment);
					return assessment;
				})
				.Catch(function (error)
				{
					assessment = BuildAssessment(vendorNumber, { found: true, level: "", details: "" }, amount);
					assessment.status = Status.TechnicalError;
					assessment.reviewRequired = true;
					assessment.message = ErrorMessages[assessment.status];
					LogAssessment(assessment, error);
					return assessment;
				});
		}

		/**
		 * Fills the risk fields of the invoice from the assessment
		 * @param {object} assessment Result of EvaluateInvoiceRisk
		 * @returns {boolean} true if the "compliance review required" flag changed
		 */
		function ApplyToForm(assessment)
		{
			const previousReviewRequired = Boolean(Data.GetValue("Z_ComplianceReviewRequired__"));
			Data.SetValue("Z_Risk_level__", assessment.level || "");
			Data.SetValue("Z_ComplianceReviewRequired__", assessment.reviewRequired);
			Data.SetWarning("Z_Risk_level__", assessment.status === Status.OK ? "" : assessment.message);
			return previousReviewRequired !== assessment.reviewRequired;
		}

		/**
		 * @param {object} assessment Result of EvaluateInvoiceRisk
		 * @returns {string} Explicit set aside reason, added to the invoice history
		 */
		function GetSetAsideComment(assessment)
		{
			return "Mise de côté automatique : fournisseur " + assessment.vendorNumber + " à risque " + RiskLevel.High
				+ (assessment.details ? " (" + assessment.details + ")" : "")
				+ ", montant " + FormatAmount(assessment.amount) + " > seuil " + FormatAmount(assessment.threshold)
				+ ". Revue conformité requise avant paiement.";
		}

		/**
		 * @returns {object|null} Workflow approver for the compliance review step, null if not configured
		 */
		function GetComplianceReviewer()
		{
			const login = GetParameter(Parameters.ComplianceReviewerLogin);
			if (!login)
			{
				Log.Error(LOG_PREFIX + "Parameter " + Parameters.ComplianceReviewerLogin + " not configured, the compliance review step cannot be added to the workflow");
				return null;
			}
			return {
				login: login,
				displayName: GetParameter(Parameters.ComplianceReviewerName) || login,
				emailAddress: "",
				workflowRule: COMPLIANCE_REVIEW_RULE
			};
		}

		return {
			RiskLevel: RiskLevel,
			Status: Status,
			ASIDE_REASON_KEY: ASIDE_REASON_KEY,
			ASIDE_REASON_LABEL: ASIDE_REASON_LABEL,
			COMPLIANCE_REVIEW_RULE: COMPLIANCE_REVIEW_RULE,
			QueryVendorRisk: QueryVendorRisk,
			EvaluateInvoiceRisk: EvaluateInvoiceRisk,
			ApplyToForm: ApplyToForm,
			GetSetAsideComment: GetSetAsideComment,
			GetComplianceReviewer: GetComplianceReviewer
		};
	})();

	/**
	 * @lends Lib.AP.Customization.Common
	 */
	parentLib.Common =
	{
		/**
		 * Custom business functions shared by client and server libraries
		 * @namespace Lib.AP.Customization.Common.CustomFunctions
		 */
		CustomFunctions:
		{
			VendorRisk: VendorRisk
		},

		Workflow:
		{
			/**
			 * Adds the mandatory "Revue conformité" step at the beginning of the approvers list
			 * when the invoice requires a compliance review (Z_ComplianceReviewRequired__).
			 * @param {Array<Sys.WorkflowController.IWorkflowUser>} approverList The complete list of approvers
			 * @returns {Array<Sys.WorkflowController.IWorkflowUser>|void} Modified approver list
			 */
			ProcessApproverList: function (approverList)
			{
				if (!Data.GetValue("Z_ComplianceReviewRequired__"))
				{
					return approverList;
				}

				const reviewer = VendorRisk.GetComplianceReviewer();
				if (!reviewer)
				{
					return approverList;
				}

				const alreadyAdded = approverList.some(function (approver)
				{
					return approver.login === reviewer.login && approver.workflowRule === VendorRisk.COMPLIANCE_REVIEW_RULE;
				});
				if (!alreadyAdded)
				{
					Log.Info("[VendorRisk] Add compliance review step for " + reviewer.login);
					approverList.unshift(reviewer);
				}
				return approverList;
			}
		}
	};

})(Lib.AP.Customization);
