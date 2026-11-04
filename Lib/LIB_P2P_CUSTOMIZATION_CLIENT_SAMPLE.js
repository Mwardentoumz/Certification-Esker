"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending P2P scripts",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Sys/Sys_FormTemplate_Manager"
  ]
}*/
/**
 * P2P packages script customization callbacks
 * @namespace Lib.P2P.Customization.Client
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @namespace Lib.P2P.Customization.Client.GetFormTemplatePoliciesRDONLY
                 */
                Client.GetFormTemplatePoliciesRDONLY = function (processName) {
                    return "";
                };
                /**
                 * Specifics customization for conversation options
                 * @namespace Lib.P2P.Customization.Client.Conversation.Options
                 */
                let Conversation;
                (function (Conversation) {
                    let Options;
                    (function (Options) {
                        /**
                         * @method Lib.P2P.Customization.Client.Conversation.Options.GetDefault
                         * @since 312
                         * @description Allows you to customize options for external conversations.
                         *
                         * @param {IConversationUI_Option} options The default options for the conversation.
                         * @param {Lib.Purchasing.SenderType} senderType The type of the sender (IsSupplier or IsCustomer)
                         * @returns {IConversationUI_Option} The customized options for the conversation.
                         * @example
                         * Options.GetDefault = function (options, senderType) {
                         * 	if (senderType === Lib.Purchasing.SenderType.IsSupplier)
                         * 	{
                         * 		options.fromEmailAddress = "suppliernotification@eskerondemand.com";
                         * 	}
                         * 	else if(senderType === Lib.Purchasing.SenderType.IsCustomer)
                         * 	{
                         * 		options.fromEmailAddress = "customernotification@gmail.com";
                         * 	}
                         * 	return options;
                         * };
                         */
                        Options.GetDefault = function (options, senderType) {
                            return options;
                        };
                    })(Options = Conversation.Options || (Conversation.Options = {}));
                })(Conversation = Client.Conversation || (Client.Conversation = {}));
                /**
                 * Specifics customization for the P2P Browse
                 * @namespace Lib.P2P.Customization.Client.Browse
                 */
                Client.Browse = {
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.OnInitializeEnd
                     * @since 324
                     * @description
                     * Use this function to customize browse control once they have been initialized in LIB_P2P_Browse.
                     * You can use it to customize browse controls, like redefine the customquery option, display condition or even configure custom fields.
                     * @param {Lib.ERP.Invoice.Instance<Lib.ERP.Manager.Instance>} erpInvoiceInstance instance of the ERP invoice
                     * @param {string} parameterInstance instance name of the application the browse init is called from ("AP" or "PAC")
                     * @param {string?} tableName (optional) - name of the table that contains browse fields (For vendor invoices: "LineItems__").
                     * @param {Lib.AP.Browse.BrowseConfigurations} sapConfigs SAP configurations
                     * @example
                     * Browse.OnInitializeEnd = function(erpInvoiceInstance, parameterInstance, tableName, sapConfigs)
                     * {
                     *   function IsBrowseControl(ctrlToTest) {
                     *       return ctrlToTest !== undefined && Sys.Helpers.IsFunction(ctrlToTest.ClearSearchFields);
                     *   }
                     *
                     *   if (IsBrowseControl(Controls.Z_Custom_Control__)) {
                     *      Lib.P2P.Customization.Common.Init(Controls.Z_Custom_Control__);
                     *   }
                     * };
                     */
                    OnInitializeEnd: function (erpInvoiceInstance, parameterInstance, tableName, sapConfigs) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.GetCustomVendorFilter
                     * @since 338
                     * @description
                     * User exit to allow dynamic modification of the vendor filter in GetVendor function.
                     * This enables customizations to add additional filter criteria.
                     * @param {string} filter - The filter constructed by the standard logic
                     * @returns {void | string} - Modified filter to use instead of the original, or nothing to use the original filter
                     *
                     * @example <caption>Add MCU filter for Veolia concept</caption>
                     * Browse.GetCustomVendorFilter= function(filter)
                     * {
                     *     // Add custom MCU comparison filter
                     *     var customMCUFilter = "(Z_MCU__=VEOLIA_CONCEPT)";
                     *     return "(&" + filter + customMCUFilter + ")";
                     * }
                     */
                    GetCustomVendorFilter: function (filter) {
                        // Use the original filter unchanged
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.ExtendBrowseUsersCriterias
                     * @since 340
                     * @description Use this function to add criteria in the browse page that add reviewer/approver to the workflow.
                     * The user exit CreateExtraFilterPromise must be called afterward to construct a filter based on those criterias
                     * @param {Sys.Helpers.Browse.SearchCriterion[]} searchCriterias the standard default search criterias.
                     * @returns {Sys.Helpers.Browse.SearchCriterion[]} The modified search criterias that will be used and displayed
                     * @example <caption>Add criterias in the add reviewer/approver browse page</caption>
                     * Common.ExtendBrowseUsersCriterias = function(searchCriterias)
                     * {
                     * 	searchCriterias.push({ id: "CompCodeFilter__", label: "Company Code", required: false, toUpper: false, visible: true, used: false, defaultValue: Data.GetValue("CompanyCode__")});
                     * 	searchCriterias.push({ id: "CostCenterFilter__", label: "Cost Center(s)", required: false, toUpper: false, visible: true, used: false});
                     *	return searchCriterias;
                     * };
                     */
                    ExtendBrowseUsersCriterias: function (searchCriterias) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.CreateExtraFilterPromise
                     * @since 340
                     * @description create an extrafilter to be added to the browse query that look for reviewer/approver to add
                     * @param {Dialog} dialog the browse page Dialog
                     * @returns {Promise<string>} A promise that resolve a filter that will be added to the request.
                     * @example <caption>Based the filter on a query with the company code</caption>
                     * Common.CustomBrowseUsersRequest: function(dialog)
                     * {
                     *  var ldapUtil = Sys.Helpers.LdapUtil;
                     *	var table = "P2P - User properties__";
                     *	var attributes = ["UserLogin__", "AllowedCompanyCodes__"];
                     *	var compCode = dialog.GetControl("searchCriteria_CompCodeFilter__").GetValue();
                     *  var compCodeFilter = ldapUtil.FilterEqual("AllowedCompanyCodes__", compCode).toString();
                     *
                     *	function userPropertiesQuery()
                     *	{
                     *		return Sys.GenericAPI.PromisedQuery({
                     *			table: table,
                     *			filter: compCodeFilter,
                     *			attributes: attributes,
                     *			maxRecords: 100
                     *		});
                     *	}
                     *	function parsePropertiesResults(userPropertiesResults) {
                     *		var filters = [];
                     *		for (var recordIndex = 0; recordIndex < userPropertiesResults.length; recordIndex++)
                     *		{
                     *			var userID = userPropertiesResults[recordIndex].UserLogin__;
                     *			userID = userID.toLowerCase();
                     *			if (userID) {
                     *				var name = userID.substring(0, userID.lastIndexOf("@"));
                     *				filters.push(ldapUtil.FilterStartsWith("LOGIN", name));
                     *			}
                     *		}
                     *		if (filters.length === 0) {
                     * 			// No user should be returned, add a filter that always fails
                     *			filters.push(ldapUtil.FilterEqual("1", "0"));
                     *		}
                     *		return ldapUtil.FilterOr(...filters).toString();
                     *	}
                     *	return userPropertiesQuery().Then(parsePropertiesResults);
                     *}
                     */
                    CreateExtraFilterPromise: function (dialog) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.CustomizeBrowseUsersColumns
                     * @since 342
                     * @description
                     * Allows you to customize the columns to request user information in BrowseUsers dialog.
                     * This user exit is called before the browse dialog is created, allowing you to add, remove, or modify column definitions.
                     * @param {Sys.Helpers.Browse.DisplayColumn[]} columns the standard columns array containing default column definitions
                     * @returns {Sys.Helpers.Browse.DisplayColumn[] | void} the customized columns array, or void to use the original columns
                     *
                     * @example <caption>Add custom Approver Amount column at second position</caption>
                     * Browse.CustomizeBrowseUsersColumns = function(columns)
                     * {
                     *		// Create custom column for approval amount limit
                     *		const customColumn = { id: "Z_ApproverAmount", label: "Amount Limit", type: "DECIMAL", width: 150 };
                     *
                     * 		// Add customColumn at second position of array columns
                     *		columns.splice(1, 0, customColumn);
                     *		return columns;
                     * }
                     */
                    CustomizeBrowseUsersColumns: function (columns) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.OnRefreshUserRow
                     * @since 342
                     * @description
                     * Allows you to modify the User row display in the User Browse dialog during the refresh action.
                     * This user exit is called for each row when the browse dialog refreshes its data, allowing you to populate custom fields or modify row appearance.
                     * Only populate fields that were added via CustomizeBrowseUsersColumns. Standard columns are automatically populated.
                     * @param {BrowseUsersRow} row the table row to update
                     *
                     * @example <caption>Populate custom Approver Amount field from user properties</caption>
                     * Browse.OnRefreshUserRow = function(row)
                     * {
                     *		// Ensure custom column exists
                     * 		if (!row || !row.hasOwnProperty("Z_ApproverAmount")) {
                     * 			return; // Skip if custom column not present
                     * 		}
                     *
                     *		// Get user login for database lookup
                     *		let login = row.LOGIN ? row.LOGIN.GetValue() : null;
                     * 		if (!login) {
                     * 			Log.Warn("LOGIN column missing or empty in OnRefreshUserRow");
                     * 			return;
                     * 		}
                     *
                     *		// Check cache
                     *		let cache = {};
                     *		let usersAmountCache = Variable.GetValueAsString("Z_UsersAmountCache");
                     *		if (usersAmountCache) {
                     *			try {
                     *				cache = JSON.parse(usersAmountCache);
                     *				if (cache[login] && cache[login].amount !== undefined) {
                     *					row.Z_ApproverAmount.SetValue(cache[login].amount);
                     *					return; // Use cached value, avoid database query
                     *				}
                     *			} catch (e) {
                     *				Log.Warn("Failed to parse user amount cache: " + e.message);
                     *				Variable.SetValueAsString("Z_UsersAmountCache", "{}"); // Reset corrupted cache
                     *			}
                     *		}
                     *
                     * 		// Query database for user's approval limit
                     *		Query.DBQuery(function () {
                     *			let error = this.GetQueryError();
                     *			if (error) {
                     *				Log.Error("Failed to retrieve user approval amount: " + error);
                     *			} else if (this.GetRecordsCount() > 0) {
                     *				let amount = this.GetQueryValue("LOAAmount__", 0) || "0.00";
                     *				row.Z_ApproverAmount.SetValue(amount);
                     *
                     *				// Update cache
                     *				try {
                     *					usersAmountCache = Variable.GetValueAsString("Z_UsersAmountCache");
                     *					cache = usersAmountCache ? JSON.parse(usersAmountCache) : {};
                     *					cache[login] = { amount: amount };
                     *					Variable.SetValueAsString("Z_UsersAmountCache", JSON.stringify(cache));
                     *				} catch (e) {
                     *					Log.Warn("Failed to update user amount cache: " + e.message);
                     *				}
                     *			}
                     *		}, "P2P - User properties__", "LOAAmount__", "UserLogin__=" + login));
                     * }
                    */
                    OnRefreshUserRow: function (row) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.GetCustomBrowseMaxRowCount
                     * @since 357
                     * @description
                     * Allows you to customize the maximum number of records retrieved by the query in the BrowseUsers dialog.
                     * If not implemented or returns a falsy value, the default value of 20 is used.
                     * @returns {number | void} The maximum row count to use, or void to use the default (20)
                     *
                     * @example <caption>Increase browse users max row count to 50</caption>
                     * Browse.GetCustomBrowseMaxRowCount = function ()
                     * {
                     *     return 50;
                     * };
                     */
                    GetCustomBrowseMaxRowCount: function () {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.Browse.GetCustomSettlementNumber
                     * @since 358
                     * @description
                     * Called when the GoodIssue browse opens and ERPInvoiceNumber__ is empty (e.g. EDI consignment invoices
                     * not yet posted to SAP). Return a settlement number string to pre-fill the SettlementNumber__ search
                     * field, or null/undefined if not implemented.
                     * Accepted values are:
                     * - "documentNumber-CompanyCode-fiscalYear" (FI)
                     * - "documentNumber-fiscalYear" (MM)
                     * - "documentNumber"
                     * @returns {string | null} A settlement value in one of the supported formats, or null if not implemented.
                     * @example <caption>LACROIX-style: return extracted settlement value (FI/MM/document number)</caption>
                     * Browse.GetCustomSettlementNumber = function ()
                     * {
                     *     return Data.GetValue("Z_ExtractedSettlementNumber__") // e.g. "4900000001-1000-2021" (FI)
                     *         || Variable.GetValueAsString("ExtractedSettlementNumber") // e.g. "4900000001-2021" (MM) or "4900000001"
                     *         || null;
                     * };
                     */
                    GetCustomSettlementNumber: function () {
                        return null;
                    }
                };
                /**
                 * Specifics customization SAP Connected
                 * @namespace Lib.P2P.Customization.Client.SAP
                 */
                Client.SAP = {
                    /**
                     * @method Lib.P2P.Customization.Client.SAP.ComputeTotalsForGR
                     * @since 334
                     * @description
                     * This user exit allows to override the standard ComputeTotalsForGR method in charge of computing total amounts and quantities for the goods reception (Amounts are expressed in the refCurrency specified in the options).
                     * If the user exit returns a Promise<Lib.AP.SAP.PurchaseOrder.TotalsForGR> then the standard ComputeTotalsForGR is skipped and the Promise resolution is used instead.
                     * The server side synchronous version of the user exit should also be implemented in Lib.P2P.Customization.Server.SAP.ComputeTotalsForGR.
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory} purchaseItemHistory the current historic dealt with
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory[]} purchaseItemHistorics all retrieved historics for the current PO Item
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData} poItem the internal structure describing the PO Item
                     * @param {Lib.AP.SAP.PurchaseOrder.ComputeTotalsForGROptions} options options mainly for exchange rate computation
                     * @return {Promise<Lib.AP.SAP.PurchaseOrder.TotalsForGR>} A promise with the totals structure or null to apply the standard method
                     * @example <caption>Same as function ComputeTotalsForGR, except that purchaseItemHistoryKey and historyKey do not contain SERIAL_NO for Transport orders</caption>
                     * SAP.ComputeTotalsForGR: function (purchaseItemHistory, purchaseItemHistorics, poItem, options)
                     * {
                     * 	const totals = {
                     * 		totalInvoicedAmount: 0,
                     * 		totalInvoicedQty: 0,
                     * 		totalDeliveredAmount: 0,
                     * 		totalDeliveredQty: 0,
                     * 		reverse: false
                     * 	};
                     * 	let purchaseItemHistoryKey = purchaseItemHistory.PO_ITEM + purchaseItemHistory.REF_DOC + purchaseItemHistory.REF_DOC_IT + purchaseItemHistory.REF_DOC_YR;
                     * 	const computePromises: Promise<void>[] = [];
                     * 	for (let idx = 0; idx < purchaseItemHistorics.length; idx++)
                     * 	{
                     * 		let aPoItemHistory = purchaseItemHistorics[idx];
                     * 		let historyKey = void 0;
                     * 		if (purchaseItemHistory.SERIAL_NO === "00")
                     * 		{
                     * 			historyKey = aPoItemHistory.PO_ITEM + "00" + aPoItemHistory.REF_DOC + aPoItemHistory.REF_DOC_IT + aPoItemHistory.REF_DOC_YR;
                     * 		}
                     * 		else
                     * 		{
                     * 			historyKey = aPoItemHistory.PO_ITEM + aPoItemHistory.REF_DOC + aPoItemHistory.REF_DOC_IT + aPoItemHistory.REF_DOC_YR;
                     * 		}
                     * 		if (purchaseItemHistoryKey === historyKey)
                     * 		{
                     * 			totals.reverse = aPoItemHistory.HIST_TYPE === "E" && aPoItemHistory.DB_CR_IND === "H";
                     * 			if (aPoItemHistory.PROCESS_ID === "1")
                     * 			{
                     * 				const computePromise = Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfGoodsReceipt(totals, aPoItemHistory, poItem, otpions);
                     * 				computePromises.push(computePromise);
                     * 			}
                     * 			else if (aPoItemHistory.PROCESS_ID === "2")
                     * 			{
                     * 				const computePromise = Lib.AP.SAP.PurchaseOrder.ComputeTotalsOfInvoicesReceipt(totals, aPoItemHistory, options);
                     * 				computePromises.push(computePromise);
                     * 			}
                     * 		}
                     * 	}
                     * 	return Sys.Helpers.Promise.All(computePromises)
                     * 		.Then((): Lib.AP.SAP.PurchaseOrder.TotalsForGR =>
                     * 		{
                     * 			return totals;
                     * 		});
                     * }
                    */
                    ComputeTotalsForGR: function (purchaseItemHistory, purchaseItemHistorics, poItem, options) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.SAP.OnEKBEDataRetrieved
                     * @since 361
                     * @description
                     * User exit called immediately after EKBE (Purchase Order History) data is retrieved from SAP.
                     * Allows transformation, filtering, or enrichment of raw EKBE records before they are processed
                     * into line items. Modify the historics array directly.
                     *
                     * **Use Cases:**
                     * - Add custom fields from EKBE (e.g., LFBNR, LFPOS for Service Entry Sheets)
                     * - Filter out specific movement types or records
                     * - Merge data from additional SAP tables
                     * - Pre-process amounts or quantities for special business rules
                     *
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory[]} historics - Array of EKBE history records to modify directly (by reference)
                     * @param {string} filter - LDAP filter used to query EKBE table
                     * @param {string} poNumber - Purchase Order number (10-character SAP format)
                     * @param {ISAP.Structures.BAPIEKPO} poItem - Original PO item from BAPI call
                     * @param {Lib.AP.SAP.PurchaseOrder.PODetailsClient} po - Complete PO details including header and all items
                     * @returns {void}
                     *
                     * @example <caption>Store Service Entry Sheet numbers from EKBE</caption>
                     * SAP.OnEKBEDataRetrieved = function (historics, filter, poNumber, poItem, po)
                     * {
                     *     historics.forEach(function (history)
                     *     {
                     *         // LFBNR and LFPOS are SES fields (if included via GetEKBEQueryParameters)
                     *         if (history.LFBNR)
                     *         {
                     *             history.ServiceEntrySheet__ = history.LFBNR;
                     *             history.SESLineItem__ = history.LFPOS;
                     *         }
                     *     });
                     * };
                     *
                     * @example <caption>Filter out blocked stock movements</caption>
                     * SAP.OnEKBEDataRetrieved = function (historics, filter, poNumber, poItem, po)
                     * {
                     *     // Remove movement types 107/108 (valuated blocked stock)
                     *     for (var i = historics.length - 1; i >= 0; i--)
                     *     {
                     *         if (historics[i].MOVE_TYPE === "107" || historics[i].MOVE_TYPE === "108")
                     *         {
                     *             historics.splice(i, 1);
                     *         }
                     *     }
                     * };
                     */
                    OnEKBEDataRetrieved: function (historics, filter, poNumber, poItem, po) {
                    },
                    /**
                     * @method Lib.P2P.Customization.Client.SAP.CustomizePOItemDataAfterCreation
                     * @since 361
                     * @description
                     * User exit called after PO item data has been fully created from goods receipt/service entry sheet history.
                     * Allows complete customization of line item data before it's displayed to the user.
                     * Modify the items array directly to override quantities, amounts, account assignments, or any other fields.
                     *
                     * **Use Cases:**
                     * - Override totals with Service Entry Sheet (SES) data from EKBE.LFBNR records
                     * - Apply custom business rules to quantities/amounts
                     * - Inject additional fields or metadata
                     * - Filter or transform line items conditionally
                     *
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemData[]} items - Array of PO item data objects to modify directly (by reference)
                     * @param {string} poNumber - Purchase Order number (10-character SAP format)
                     * @param {ISAP.Structures.BAPIEKPO} poItem - Original PO item from BAPI call
                     * @param {Lib.AP.SAP.PurchaseOrder.PODetailsClient} po - Complete PO details including header and all items
                     * @param {Lib.AP.SAP.PurchaseOrder.POItemHistory[]} purchaseItemHistorics - Raw EKBE history records for this PO item
                     * @returns {void}
                     *
                     * @example <caption>Override totals with SES-based values from EKBE</caption>
                     * SAP.CustomizePOItemDataAfterCreation = function (items, poNumber, poItem, po, purchaseItemHistorics)
                     * {
                     *     // For each line item, find matching SES records in EKBE history
                     *     items.forEach(function (item)
                     *     {
                     *         // Find SES records matching this item's REF_DOC
                     *         var sesRecords = purchaseItemHistorics.filter(function (history)
                     *         {
                     *             return history.LFBNR && history.REF_DOC === item.Ref_Doc.split('-')[0];
                     *         });
                     *
                     *         if (sesRecords.length > 0)
                     *         {
                     *             // Sum SES quantities and amounts
                     *             var sesQuantity = 0;
                     *             var sesAmount = 0;
                     *
                     *             sesRecords.forEach(function (sesRecord)
                     *             {
                     *                 sesQuantity += parseFloat(sesRecord.MENGE) || 0;
                     *                 sesAmount += parseFloat(sesRecord.DMBTR) || 0;
                     *             });
                     *
                     *             // Override standard PO-based values with SES-based values
                     *             item.refExpectedQuantity = sesQuantity;
                     *             item.refExpectedAmount = sesAmount;
                     *             item.refOpenInvoiceQuantity = sesQuantity;
                     *             item.refOpenInvoiceValue = sesAmount;
                     *
                     *             // Store SES number for reference
                     *             item.ServiceEntrySheet__ = sesRecords[0].LFBNR;
                     *         }
                     *     });
                     * };
                     *
                     * @example <caption>Apply minimum invoice value rule</caption>
                     * SAP.CustomizePOItemDataAfterCreation = function (items, poNumber, poItem, po, purchaseItemHistorics)
                     * {
                     *     // Remove items below minimum threshold
                     *     for (var i = items.length - 1; i >= 0; i--)
                     *     {
                     *         if (items[i].refOpenInvoiceValue < 100)
                     *         {
                     *             items.splice(i, 1);  // Remove low-value items
                     *         }
                     *     }
                     * };
                     */
                    CustomizePOItemDataAfterCreation: function (items, poNumber, poItem, po, purchaseItemHistorics) {
                    }
                };
                /**
                 * @method Lib.P2P.Customization.Client.OverrideErrorType
                 * @since 331
                 * @description
                 * Use this function override an error or a warning.
                 * Important: You must remove the error from the item before setting a warning.
                 * @param {Item} item item that contains the field set in warning or error
                 * @param {string} message default message set on the field
                 * @param {boolean} isError (since sprint 334) flag set to true if it was by default considered as an error, if false it's considered as a warning
                 * @param {string} fieldName (since sprint 334) the field of the item on which the message was set
                 * @example
                 * <caption>Display an warning instead of an error for Quantity</caption>
                 * OverrideErrorType = function(item, message, isError, fieldName)
                 * {
                 *   if (fieldName === "Quantity__")
                 *   {
                 *     if (isError)
                 *     {
                 *   	  item.SetError("Quantity__", null);
                 * 	   }
                 *     item.SetWarning("Quantity__", message);
                 *   }
                 * };
                 */
                function OverrideErrorType(item, message, isError, fieldName) {
                }
                Client.OverrideErrorType = OverrideErrorType;
                /**
                 * @method Lib.P2P.Customization.Client.OnDeterminedCombinedVendor
                 * @since 356
                 * @description
                 * Use this function if you want to execute code when vendor is determined.
                 * If SIM is activated, this function is called with detailled status, if not status is undefined
                 * You can code a specific behavior based on the process with Process.GetName()
                 * On PR and RFQ, context is the row where fields are located in.
                 * On PO and Contract, context is Controls because fields are in the header.
                 * Warning: On RFQ it's context.SupplierName__ and context.SupplierNumber__ and not context.VendorName__ and context.VendorNumber__ as in other forms.
                 * @param {Lib.Purchasing.Vendor.Client.VendorControls} context It's the container of fields (Vendor__, VendorRegistration__, CombinedVendor__) that are used to determine the vendor status. On PR and RFQ it's the row, on PO and contract it's Controls (because fields are in the header).
                 * @param {string} status status of the vendor selected
                 * @example
                 * OnDeterminedCombinedVendor = function(context, status)
                 * {
                 *
                 * };
                 */
                function OnDeterminedCombinedVendor(context, status) {
                }
                Client.OnDeterminedCombinedVendor = OnDeterminedCombinedVendor;
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_CLIENT_SAMPLE.js.map