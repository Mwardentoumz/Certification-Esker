"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_P2P_CUSTOMIZATION_ACCRUAL_SERVER_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "Customizable actions to serialize accrual events serialization, server side",
  "versionable": false,
  "require": [
    "Sys/Sys_Decimal",
    "Sys/Sys_Helpers_LdapUtil",
    "Sys/Sys_P2P_Accrual"
  ]
}*/
/**
 * User exits to customize accrual events serialization
 * @namespace Lib.P2P.Customization.Accrual
 */
var Lib;
(function (Lib) {
    var P2P;
    (function (P2P) {
        var Customization;
        (function (Customization) {
            var Accrual;
            (function (Accrual) {
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeDetailedAccrualData
                 * @description Allow to customize the fields of the detailedAccrualData object. You can add, modify or delete keys and values of the object. You also may want to implement CustomizeTableRecordDetailedAccrualEvent to register the new fields for the record saved on the CT.
                 * @since 300
                 * @param {Sys.P2P.Accrual.DetailedAccrualData} detailedAccrualData New detailedAccrualData to customize
                 * @param {string} actionType Action type
                 * @param {Item | any} sourceItem Current line item validated.
                 * @returns {Record<string, unknown>} The modified DetailedAccrualData object
                 * @example
                 * <caption>This example adds a new key "Axe1" for all actionTypes and modify the value of "ActionDate" only for the actionType "PurchaseOrderItemCanceled"</caption>
                 * CustomizeDetailedAccrualData: function (detailedAccrualData, actionType, sourceItem)
                 * {
                 *	 detailedAccrualData.Axe1 = "defaultValue";
                 *
                 *	 if (actionType === "PurchaseOrderItemCanceled")
                 *	 {
                 *		var tomorrow = new Date();
                 *		tomorrow.setDate(date.getDate() + 1);
                 *		detailedAccrualData.ActionDate = tomorrow;
                 *	 }
                 *
                 *	 return detailedAccrualData;
                 * };
                 */
                Accrual.CustomizeDetailedAccrualData = function (detailedAccrualData, actionType, sourceItem) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizedDetailedAccrualUpdateKey
                 * @description Allow to customize the key which group the accrual events when a new event is computed (update purge date, fully invoice date). For this to work, naming between the detailed accrual data object and the associated detailed accrual table field must respect convention. For example, detailed accrual data key : "Axe1", detailed accrual table field : "Axe1__".
                 * @since 301
                 * @param {Sys.P2P.Accrual.DetailedAccrualData} detailedAccrualData New detailedAccrualData info
                 * @param {Array<string>} fieldsKey ["CompanyCode", "VendorNumber", "OrderNumber"]
                 * @returns {Array<string>}
                 * @example
                 * <caption>Adds a new dimension 'ItemNumber' to the key, the purge date and the fully invoice date will be updated for all events that match the group 'CompanyCode-VendorNumber-OrderNumber-ItemNumber'.</caption>
                 * Accrual.CustomizedDetailedAccrualUpdateKey = function (fieldsKey)
                 * {
                 * 	return [...fieldsKey, "ItemNumber"];
                 * };
                 */
                Accrual.CustomizedDetailedAccrualUpdateKey = function (fieldsKey) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeTableRecordDetailedAccrualEvent
                 * @description Allow you to define how to register additional detailed accrual events fields in the detailed accrual event table, or to override existing ones.
                 * @since 300
                 * @param {Sys.P2P.Accrual.DetailedAccrualData} detailedAccrualData Object containing all accrual line associated Info.
                 * @param {xVars} detailedAccrualRecordVars [xVars]{@link https://docptn.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#ProcessingScripts/xEDDAPI/xVars/xVars_Object.html} Variables of the record that will be committed in the table.
                 * @returns {void}
                 * @example
                 * <caption>This user exit adds a value for the column "Axe1__" of the detailed accrual event table.</caption>
                 * Accrual.CustomizeTableRecordDetailedAccrualEvent = function (detailedAccrualData, detailedAccrualRecordVars)
                 * {
                 *	if (detailedAccrualData.Axe1)
                 * 	{
                 * 		detailedAccrualRecordVars.AddValue_String("Axe1__", detailedAccrualData.Axe1, true);
                 * 	}
                 * };
                 */
                Accrual.CustomizeTableRecordDetailedAccrualEvent = function (detailedAccrualData, detailedAccrualRecordVars) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeFullyInvoiceDate
                 * @description Allow to customize the fully invoice date for the detailed accrual report event.
                 * @since 301
                 * @param {{ orderedAmount: number, deliveredAmount: number, invoicedAmount: number }} POamounts Amounts for the PO
                 * @param {Date | null} fullyInvoicedDate Date when the PO was fully invoiced else is null
                 * @returns {Date} The customized fully invoice date for the event
                 * @example
                 * <caption>Remove 1 full month on the fully invoiced date if it exists</caption>
                 * Accrual.CustomizeFullyInvoiceDate = function (POamounts, fullyInvoicedDate)
                 * {
                 * 	if (fullyInvoicedDate) {
                 * 		fullyInvoicedDate.setMonth(fullyInvoicedDate.getMonth() - 1);
                 *	}
                 *
                 * 	return fullyInvoicedDate;
                 * };
                 */
                Accrual.CustomizeFullyInvoiceDate = function (POamounts, fullyInvoicedDate) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizePurgeDateTime
                 * @description Allow to customize the purge date for the detailed accrual report event. Be careful on how long you extend the life duration of the record, too many records may affect the customer's performance (Max limit is set to 5 years from write time)
                 * @since 299
                 * @param {Date} initialPurgeDateTime the default purge date (3 years after actionDate if not fully invoiced else 2 year after fullyInvoicedDate)
                 * @param {Date} actionDate date of the current events being recorded
                 * @param {Date | null} fullyInvoicedDate date when the PO was fully invoiced else is null
                 * @returns {Date} The customized date of purge for the event
                 * @example
                 * <caption>Adding 1 additional year of life for the record</caption>
                 * Accrual.CustomizePurgeDateTime = function (initialPurgeDateTime, actionDate, fullyInvoicedDate)
                 * {
                 * 	initialPurgeDateTime.setFullYear(initialPurgeDateTime.getFullYear() + 1);
                 * 	return initialPurgeDateTime;
                 * };
                 */
                Accrual.CustomizePurgeDateTime = function (initialPurgeDateTime, actionDate, fullyInvoicedDate) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeHeaderAccrualLineMapping
                 * @description Allow to customize the mapping between accrual events and the CSV export. Important, keep the headers' order, if you set a value of an existing field it will be moved to the end, see the example to avoid that case.
                 * @since 300
                 * @param {Map<string, string>} standardHeader standard mapping of headers and lines
                 * @returns {Map<string, string>} custom mapping of headers and lines
                 * @example
                 * <caption>This example adds a custom gl account column and delete the item number column</caption>
                 * Accrual.CustomizeHeaderAccrualLineMapping = function (standardHeader)
                 * {
                 *	let newHeader = new Map();
                 *	let inserted = false;
                 *
                 *	for (let [key, value] of standardHeader) {
                 *		newHeader.set(key, value);
                 *
                 *		if (key === 'GL Account' && !inserted) {
                 *			newHeader.set('GL Account', 'Z_AccrualGLAccount');
                 *			inserted = true;
                 * 		}
                 *	}
                 *
                 *	// If 'GL Account' was not found, add it at the end of the map
                 *	if (!inserted) {
                 * 		newHeader.set('GL Account', 'Z_AccrualGLAccount');
                 *	}
                 *
                 *	newHeader.delete("Item Number");
                 *	return newHeader;
                 * };
                 */
                Accrual.CustomizeHeaderAccrualLineMapping = function (standardHeader) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeDetailedAccrualQueryFilter
                 * @description Allows to customize the filter of the query on the detailed accrual event table, used to get events to build the CSV. If you wish to start your filter from scratch, make sure to include the correct filters on eventCreationLimit/lastVendorNumberTreated/lastOrderNumberTreated to fetch all records and avoid overlap during multiple process recall
                 * @since 301
                 * @param defaultQueryFilter filter by default at Company Code level
                 * @param eventCreationLimit timestamp of the start of the first run of the process (to avoid fetching new lines created after the start)
                 * @param lastVendorNumberTreated to remember where the last process recall finished and only fetching records after
                 * @param lastOrderNumberTreated to remember where the last process recall finished and only fetching records after
                 * @returns {string} The filter for the query
                 * @example
                 * <caption>This example builds a new filter for the query on the detailed accrual event table, with a new rule on the field "Axe1__"</caption>
                 * Accrual.CustomizeDetailedAccrualQueryFilter = function (defaultQueryFilter)
                 * {
                 *	return Sys.Helpers.LdapUtil.FilterAnd(
                 *		defaultQueryFilter,
                 *		Sys.Helpers.LdapUtil.FilterEqual("Axe1__", Data.GetValue("Axe1__")))
                 * };
                 */
                Accrual.CustomizeDetailedAccrualQueryFilter = function (defaultQueryFilter, eventCreationLimit, lastVendorNumberTreated, lastOrderNumberTreated) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeAccrualLineFromRecord
                 * @description Allow to customize the fields of the accrualData which are exported to CSV
                 * @since 300
                 * @param {Sys.P2P.Accrual.AccrualLine} accrualLine accrualLine object to customize
                 * @param {xVars} detailedAccrualRecordVars [xVars]{@link https://docptn.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#ProcessingScripts/xEDDAPI/xVars/xVars_Object.html} object representing the variables of the current transport
                 * @returns {Record<string, any>} The modified accrualLine object
                 * @example
                 * <caption>This example get the value of Axe from the transport and added it to accrualLine</caption>
                 * Accrual.CustomizeAccrualLineFromRecord = function (accrualLine, detailedAccrualRecordVars)
                 * {
                 *	 accrualLine.Axe = detailedAccrualRecordVars.GetValue_String("Axe__", 0);
                 *
                 *	 return accrualLine;
                 * };
                 */
                Accrual.CustomizeAccrualLineFromRecord = function (accrualLine, detailedAccrualRecordVars) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeAccrualLineKeyCSV
                 * @description Allow to customize the key to group the accrual lines for the CSV generation
                 * @since 300
                 * @param {Record<string, any>} accrualLine object representing the event currently being grouped
                 * @param {string} standardKey formatted as `${accrualLine.CompanyCode}-${accrualLine.VendorNumber}-${accrualLine.OrderNumber}-${accrualLine.ItemNumber}`
                 * @returns {string}
                 * @example
                 * <caption>Adding a custom Z_AccrualGLAccount criteria in the key</caption>
                 * Accrual.CustomizeAccrualLineKeyCSV = function (accrualLine, standardKey)
                 * {
                 * 	return `${standardKey}-${accrualLine.Z_AccrualGLAccount}`;
                 * };
                 */
                Accrual.CustomizeAccrualLineKeyCSV = function (accrualLine, standardKey) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.CustomizeIsLineNotWantedCSV
                 * @description Allow to filter the accrual lines after their grouping before inserting them in the CSV
                 * @since 301
                 * @param {Sys.P2P.Accrual.AccrualLine} accrualLine object representing the line currently being integrated
                 * @returns {boolean}
                 * @example
                 * <caption>An accrual line with a numeric GLAccount that start with "12" will not be written in the CSV</caption>
                 * Accrual.CustomizeIsLineNotWantedCSV = function (accrualLine)
                 * {
                 *	const regexGLAccount = /^12[0-9]*$/;
                 *	return Boolean(accrualLine.GLAccount.match(regexGLAccount));
                 * };
                 */
                Accrual.CustomizeIsLineNotWantedCSV = function (accrualLine) {
                };
                /**
                 * @method Lib.P2P.Customization.Accrual.IsProcessCallRequired
                 * @description Allow to force the call to Process.RecallScript. The call to RecallScript can't be canceled if the execution time is greater than 8 minutes.
                 * @since 312
                 * @param {Date} scriptStartExecutionTime The start time of this script execution
                 * @returns {boolean}
                 * @example
                 * <caption>An accrual line with a numeric GLAccount that start with "12" will not be written in the CSV</caption>
                 * Accrual.IsProcessCallRequired = function (scriptStartExecutionTime)
                 * {
                 *  	// Force the call to Process.RecallScript after 5 minutes
                 *		return new Date().getTime() - scriptStartExecutionTime.getTime() > (5 * 60 * 1000);
                 * };
                 */
                Accrual.IsProcessCallRequired = function (scriptStartExecutionTime) {
                };
            })(Accrual = Customization.Accrual || (Customization.Accrual = {}));
        })(Customization = P2P.Customization || (P2P.Customization = {}));
    })(P2P = Lib.P2P || (Lib.P2P = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_P2P_CUSTOMIZATION_ACCRUAL_SERVER_SAMPLE.js.map