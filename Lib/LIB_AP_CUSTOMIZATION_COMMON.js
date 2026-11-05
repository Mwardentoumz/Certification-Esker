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
	 * Auditor control: invoices of sensitive vendors (risk level from VendorRisk) are flagged for the auditors.
	 * - "Facture à auditer" (Z_InvoiceToAudit__) when the invoice net amount exceeds the invoice threshold
	 * - "Alerte" column (LineItems__.Z_Alert__) on the lines whose net amount exceeds the line threshold
	 * - read-only access of the auditors group (see Lib.AP.Customization.Validation)
	 * The behavior is driven by the AP configuration (Customizations step of the configurator).
	 */
	const AuditControl = (function ()
	{
		const LOG_PREFIX = "[Audit] ";

		// AP configuration fields (see LIB_AP_CUSTOMIZATION_WIZARD), except the group login (see LIB_P2P_CUSTOM_PARAMETERS)
		const Parameters = {
			Enabled: "Z_Audit_Behavior",
			IncludeMediumRisk: "Z_Include",
			LineThreshold: "Z_AuditLineThreshold",
			InvoiceThreshold: "Z_AuditInvoiceThreshold",
			AuditorsGroupLogin: "Z_AuditorsGroupLogin"
		};

		const Fields = {
			InvoiceToAudit: "Z_InvoiceToAudit__",
			LineAlert: "Z_Alert__"
		};

		const THRESHOLD_MISSING_MESSAGE = "Seuils auditeur non configurés, contactez l'administrateur";

		function GetParameter(name, defaultValue)
		{
			return Sys.Parameters.GetInstance("AP").GetParameter(name, defaultValue);
		}

		function IsEnabled()
		{
			return GetParameter(Parameters.Enabled, "0") === "1";
		}

		/**
		 * @param {string} level Risk level of the vendor (Z_Risk_level__)
		 * @returns {boolean} true if the vendor is sensitive and the auditor behavior is enabled
		 */
		function IsSensitiveVendor(level)
		{
			if (!IsEnabled())
			{
				return false;
			}
			return level === VendorRisk.RiskLevel.High
				|| (level === VendorRisk.RiskLevel.Medium && GetParameter(Parameters.IncludeMediumRisk, "0") === "1");
		}

		/**
		 * @returns {number|null} Threshold in company currency, null if not configured
		 */
		function GetThreshold(name)
		{
			const threshold = parseFloat(GetParameter(name, ""));
			return isNaN(threshold) ? null : threshold;
		}

		function FormatAmount(amount)
		{
			return Number(amount).toFixed(2);
		}

		/**
		 * Amounts are compared in company currency, in absolute value (credit notes are controlled too)
		 */
		function GetExchangeRate()
		{
			return parseFloat(Data.GetValue("ExchangeRate__")) || 1;
		}

		function GetInvoiceNetAmount()
		{
			const localNetAmount = parseFloat(Data.GetValue("LocalNetAmount__"));
			const netAmount = isNaN(localNetAmount) || localNetAmount === 0
				? (parseFloat(Data.GetValue("NetAmount__")) || 0) * GetExchangeRate()
				: localNetAmount;
			return Math.abs(netAmount);
		}

		function GetLineNetAmount(item)
		{
			return Math.abs((parseFloat(item.GetValue("Amount__")) || 0) * GetExchangeRate());
		}

		/**
		 * Evaluates the invoice from the current form data. The vendor risk level must be up to date (see VendorRisk.ApplyToForm).
		 * @returns {object} { enabled, sensitive, level, invoiceToAudit, lineAlerts, thresholdMissing, message }
		 */
		function Evaluate()
		{
			const level = Data.GetValue("Z_Risk_level__") || "";
			const lineItems = Data.GetTable("LineItems__");
			const evaluation = {
				enabled: IsEnabled(),
				sensitive: IsSensitiveVendor(level),
				level: level,
				invoiceToAudit: false,
				lineAlerts: [],
				thresholdMissing: false,
				message: ""
			};

			for (let i = 0; i < lineItems.GetItemCount(); i++)
			{
				evaluation.lineAlerts.push("");
			}

			if (!evaluation.sensitive)
			{
				Log.Info(LOG_PREFIX + "Auditor behavior " + (evaluation.enabled ? "enabled" : "disabled") + ", vendor risk '" + level + "': invoice not sensitive");
				return evaluation;
			}

			const invoiceThreshold = GetThreshold(Parameters.InvoiceThreshold);
			const lineThreshold = GetThreshold(Parameters.LineThreshold);
			if (invoiceThreshold === null || lineThreshold === null)
			{
				Log.Error(LOG_PREFIX + "Auditor thresholds not configured (" + Parameters.InvoiceThreshold + " / " + Parameters.LineThreshold + ")");
				evaluation.thresholdMissing = true;
				evaluation.message = THRESHOLD_MISSING_MESSAGE;
				return evaluation;
			}

			const invoiceAmount = GetInvoiceNetAmount();
			evaluation.invoiceToAudit = invoiceAmount > invoiceThreshold;

			let alertCount = 0;
			for (let i = 0; i < lineItems.GetItemCount(); i++)
			{
				const lineAmount = GetLineNetAmount(lineItems.GetItem(i));
				if (lineAmount > lineThreshold)
				{
					evaluation.lineAlerts[i] = "Seuil dépassé : " + FormatAmount(lineAmount) + " > " + FormatAmount(lineThreshold);
					alertCount++;
				}
			}

			if (evaluation.invoiceToAudit || alertCount > 0)
			{
				evaluation.message = "Facture à auditer : fournisseur sensible (risque " + level + ")"
					+ (evaluation.invoiceToAudit ? ", montant net " + FormatAmount(invoiceAmount) + " > seuil " + FormatAmount(invoiceThreshold) : "")
					+ (alertCount > 0 ? ", " + alertCount + " ligne(s) au-dessus du seuil de " + FormatAmount(lineThreshold) : "")
					+ ".";
			}

			Log.Info(LOG_PREFIX + "Sensitive vendor (risk '" + level + "'), net amount " + FormatAmount(invoiceAmount)
				+ ", invoice threshold " + FormatAmount(invoiceThreshold) + ", invoice to audit: " + evaluation.invoiceToAudit
				+ ", " + alertCount + " line(s) over " + FormatAmount(lineThreshold));
			return evaluation;
		}

		/**
		 * Fills the "Facture à auditer" flag and the "Alerte" column from the evaluation
		 * @param {object} evaluation Result of Evaluate
		 */
		function ApplyToForm(evaluation)
		{
			Data.SetValue(Fields.InvoiceToAudit, evaluation.invoiceToAudit);
			Data.SetWarning(Fields.InvoiceToAudit, evaluation.thresholdMissing ? THRESHOLD_MISSING_MESSAGE : "");

			const lineItems = Data.GetTable("LineItems__");
			for (let i = 0; i < lineItems.GetItemCount(); i++)
			{
				const item = lineItems.GetItem(i);
				const alert = evaluation.lineAlerts[i] || "";
				if (item.GetValue(Fields.LineAlert) !== alert)
				{
					item.SetValue(Fields.LineAlert, alert);
				}
			}
		}

		/**
		 * @returns {string} Login of the auditors group, empty if not configured
		 */
		function GetAuditorsGroupLogin()
		{
			const login = GetParameter(Parameters.AuditorsGroupLogin, "");
			if (!login)
			{
				Log.Error(LOG_PREFIX + "Parameter " + Parameters.AuditorsGroupLogin + " not configured, the auditors cannot access the invoice");
			}
			return login;
		}

		return {
			Fields: Fields,
			IsEnabled: IsEnabled,
			Evaluate: Evaluate,
			ApplyToForm: ApplyToForm,
			GetAuditorsGroupLogin: GetAuditorsGroupLogin
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
			VendorRisk: VendorRisk,
			AuditControl: AuditControl
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
