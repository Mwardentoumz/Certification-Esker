"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_GR_CUSTOMIZATION_SERVER_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Custom library extending Goods Receipt scripts on server side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package Goods Receipt server script customization callbacks
 * @namespace Lib.GR.Customization.Server
 */
var Lib;
(function (Lib) {
    var GR;
    (function (GR) {
        var Customization;
        (function (Customization) {
            var Server;
            (function (Server) {
                /**
                 * @method Lib.GR.Customization.Server.GetNumber
                 * @description Allows you to retrieve the next document number based on a customized numbering sequence. This user exit is called in the validation script of the Purchase Requisition, Purchase Order or Goods Receipt process, depending on the library in which it is located.
                 * @since 149
                 * @param {string} defaultSequenceName String value representing the name of the sequence that is retrieved by default, when this user exit is not implemented. To keep on using the default numbering, use it as is to retrieve numbers from the default sequence.
                 * @returns {string} String value containing the next number from your customized sequence.
                 * @example
                 * For example, when using the US01 and FR01 company codes with the above script, you could get the following numbering: US01-0001, US01-0002, US01-0003, FR01-0001, US01-0004, FR01-0002, etc.
                 * <pre><code>
                 *	Server.GetNumber = function (defaultSequenceName)
                 *	{
                 *		var number = "";
                 *		var companyCode = Data.GetValue("CompanyCode__");
                 *		var ReqNumberSequence = Process.GetSequence(defaultSequenceName + companyCode);
                 *		number = ReqNumberSequence.GetNextValue();
                 *		if (number === "")
                 *		{
                 *			Log.Info("Error while retrieving a number");
                 *		}
                 *		else
                 *		{
                 *			number = companyCode + "-" + Sys.Helpers.String.PadLeft(number, "0", 4);
                 *			Log.Info("Number: " + number);
                 *		}
                 *		return number;
                 *	};
                 * </code></pre>
                 *
                */
                /*
                export const GetNumber = function (defaultSequenceName: string): string
                {
                    // Must return something
                };
                */
                /**
                 * @method Lib.GR.Customization.Server.OnAddLine
                 * @description Allows you to customize each of the line items in the goods receipt when they are added to SAP. This user exit is called in the validation script of the Goods Receipt process.
                 * @since 161
                 * @param {object} manager JavaScript object defining the SAP connection manager. In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                 * @param {BAPI_GOODSMVT_CREATE} BAPI_GOODSMVT_CREATE SapBAPI object representing the BAPI to call. Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                 * @param {Item} item Item object representing the item to add.
                 * @param {BAPI_GOODSMVT_ITEM} goodsItem JavaScript object representing the line item that is currently being added to the SAP GOODSMVT_ITEM table. Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                 * @returns {string} String value containing the next number from your customized sequence.
                 * @example
                 * Refer to OnAddLine for an example in the similar context of adding to a purchase order.
                */
                Server.OnAddLine = function (manager, BAPI_GOODSMVT_CREATE, item, goodsItem) {
                };
                /**
                 * @method Lib.GR.Customization.Server.OnValidationScriptEnd
                 * @description Allows you to perform operations after the Goods Receipt process validation. This user exit is called at the end of the validation script of the Goods Receipt process.
                 * @since 158
                 * @param {string} currentAction String value specifying the type of action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionType function.
                 * @param {string} currentName String value specifying the name of the action that triggered the execution of the script. This value is retrieved using the Processing scripts API: Data.GetActionName function.
                 * @param {boolean} isRecallScriptScheduled Boolean value indicating if the user exit is expected to be called again in the current workflow step. The validation script contains calls to the RecallScript function, thus the validation script is called several times at each workflow step. This parameter is set to false after the last execution of the RecallScript function.
                 * 		Possible values are:
                 * 			true: The user exit is expected to be called again in the current workflow step.
                 * 			false: The user exit is not expected to be called again in the current workflow step.
                 * @example In the following example, a user is allow to read the Goods Receipt.
                 *
                 *	OnValidationScriptEnd: function (currentAction, currentName, isRecallScriptScheduled)
                 *	{
                 *		Process.AddRight("john.more@example.com", "read")
                 *	}
                 */
                Server.OnValidationScriptEnd = function (currentAction, currentName, isRecallScriptScheduled) {
                };
                /**
                 * @method Lib.GR.Customization.Server.OnBeforeCallBapi
                 * @description Allows you to customize a BAPI before it is actually called to create or cancel the goods receipt in SAP. This user exit is called in the validation script of the Goods Receipt process. To customize the results returned by the BAPI call, implement the OnAfterCallBapi user exit.
                 * @since 161
                 * @param {Lib.ERP.Manager.Instance} manager JavaScript object defining the SAP connection manager. In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                 * @param {string} action String value indicating the action for which the BAPI is called. Possible values are:
                 * 		CREATE: The BAPI is called to create the goods receipt in SAP.
                 * 		CANCEL: The BAPI is called to cancel the goods receipt in SAP.
                 * @param {BAPI_GOODSMVT_CREATE|BAPI_GOODSMVT_CANCEL} BAPI_OBJECT SapBAPI object representing the BAPI to call. A BAPI_GOODSMVT_CANCEL is passed when action is CANCEL. Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                 * @example
                 * SAP goods receipt
                 * In the following example, the user exit is implemented in the Lib_GR_Customization_Server library.
                 *
                 * When creating the goods receipt, this example fills the PR_UNAME field in SAP with the recipient's ERP identifier.
                 * <pre><code>
                 *	OnBeforeCallBapi: function (manager, action, BAPI_OBJECT)
                 *	{
                 *		 if (action === "CREATE")
                 *		 {
                 *			 var recipientLogin = Data.GetValue("ValidationOwnerID") || Data.GetValue("OwnerId");
                 *			 var recipient = Users.GetUserAsProcessAdmin(recipientLogin);
                 *			 if (recipient)
                 *			 {
                 *				 var recipientERPID = recipient.GetValue("ERPUSER");
                 *				 var GOODSMVT_HEADER = BAPI_OBJECT.ExportsPool.Get("GOODSMVT_HEADER");
                 *				 if (recipientERPID && GOODSMVT_HEADER)
                 *				 {
                 *					 // https://www.sapdatasheet.org/abap/tabl/bapi2017_gm_head_01.html
                 *					 Log.Info("Create GR in SAP with User SAP ID '" + recipientERPID + "'");
                 *					 GOODSMVT_HEADER.SetValue("PR_UNAME", recipientERPID);
                 *				 }
                 *			 }
                 *		 }
                 *	}
                 * </code></pre>
                 * @example
                 * When canceling the goods receipt, this example fills a custom header field before the SAP call.
                 * <pre><code>
                 *	OnBeforeCallBapi: function (manager, action, BAPI_OBJECT)
                 *	{
                 *		if (action === "CANCEL")
                 *		{
                 *			var GOODSMVT_HEADER = BAPI_OBJECT.ExportsPool.Get("GOODSMVT_HEADER");
                 *			if (GOODSMVT_HEADER)
                 *			{
                 *				GOODSMVT_HEADER.SetValue("HEADER_TXT", Variable.GetValueAsString("z_CancelReason"));
                 *			}
                 *		}
                 *	}
                 * </code></pre>
                 */
                Server.OnBeforeCallBapi = function (manager, action, BAPI_OBJECT) {
                };
                /**
                 * @method Lib.GR.Customization.Server.OnAfterCallBapi
                 * @description Allows you to make use of the results returned by a BAPI call when creating or modifying the purchase order or the goods receipt in SAP. Typically, you can implement specific actions in response to specific error cases. This user exit is called in the validation script of the Purchase Order or Goods Receipt process, depending on the library in which it is located. To customize the BAPI before it is actually called, implement the OnBeforeCallBapi user exit.
                 * @since 161
                 * @param {Lib.ERP.Manager.Instance} manager JavaScript object defining the SAP connection manager. In Setup > Application setup > Script libraries, you can open LIB_ERP_MANAGER and LIB_ERP_SAP_MANAGER for more information.
                 * @param {string} action String value indicating the action for which the BAPI is called. Possible values are:
                 * 		CREATE: The BAPI is called to create the purchase order or the goods receipt in SAP.
                 * 		CHANGE: The BAPI is called to update an existing purchase order in SAP.
                 * @param {BAPI_GOODSMVT_CREATE} BAPI_OBJECT SapBAPI object representing the BAPI to call. Refer to Processing scripts API: SapBAPI object for more information on how to manipulate SAP table parameters.
                 * @param {BAPI_CallResult} result JSON string value. The result of the BAPI call.
                */
                Server.OnAfterCallBapi = function (manager, action, BAPI_OBJECT, result) {
                };
                /**
                 * @method Lib.GR.Customization.Server.GetListOfExtraUsersWithReadRight
                 * @description Allow you to return a list of user to give read right to.
                 * @since 288
                 * @returns {Array<string>} array of login to give read rights to
                 * @example
                 * For exemple, always add read rights to big.boss@company.com.
                 * <pre><code>
                 * 	GetListOfExtraUsersWithReadRight: function ()
                 * 	{
                 * 		var costCenters = [];
                 * 		var lineItems = Data.GetTable("LineItems__");
                 * 		var nbItems = lineItems.GetItemCount();
                 * 		for (var i = 0; i < nbItems; i++)
                 * 		{
                 * 			var item = lineItems.GetItem(i);
                 * 			var cc = item.GetValue("CostCenterId__");
                 * 			if (cc && costCenters.indexOf(cc) < 0)
                 * 			{
                 * 				costCenters.push(cc);
                 * 			}
                 * 		}
                 * 		var list = [];
                 * 		if (costCenters.length > 0)
                 * 		{
                 * 			var filter = Sys.Helpers.LdapUtil.FilterAnd(
                 * 				"(" + Lib.P2P.GetCompanyCodeFilter(Data.GetValue("CompanyCode__")) + ")",
                 * 				Sys.Helpers.LdapUtil.FilterIn("CostCenter__", costCenters)
                 * 			).toString();
                 * 			Sys.GenericAPI.Query("AP - Cost centers__", filter, ["Manager__"], function (result, error)
                 * 			{
                 * 				if (error || !result)
                 * 				{
                 * 					return;
                 * 				}
                 * 				for (var i = 0; i < result.length; i++)
                 * 				{
                 * 					var r = result[i];
                 * 					if (r.Manager__ && list.indexOf(r.Manager__) === -1)
                 * 					{
                 * 						list.push(r.Manager__);
                 * 					}
                 * 				}
                 * 			}, null, -1, { useConstantQueryCache: true });
                 * 		}
                 * 		return list;
                 * 	}
                 * </code></pre>
                 */
                Server.GetListOfExtraUsersWithReadRight = function () {
                    return [];
                };
            })(Server = Customization.Server || (Customization.Server = {}));
        })(Customization = GR.Customization || (GR.Customization = {}));
    })(GR = Lib.GR || (Lib.GR = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_GR_CUSTOMIZATION_SERVER_SAMPLE.js.map