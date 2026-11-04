/* LIB_DEFINITION{
  "name": "Lib_Purchasing_WorkflowDefinition",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "comment": "Purchasing library",
  "versionable": false,
  "require": [
    "Sys/Sys_P2P_WorkflowDefinition",
    "Sys/Sys_PAC_WorkflowDefinition",
    "Sys/Sys_Helpers",
    "Lib_Purchasing_Items.Config_V12.0.566.0"
  ]
}*/
var Lib;
Sys.ExtendLib(Lib, "Purchasing.WorkflowDefinition", function ()
{
	return {
		AddJSONTo: function (definitions)
		{
			definitions.push(Sys.P2P.WorkflowDefinition.GetJSON(4));
			var pacWf = Sys.PAC.WorkflowDefinition.GetJSON(3);
			Sys.Helpers.Extend(pacWf.fields, Lib.Purchasing.WorkflowDefinition.GetLineItemFieldsForWorkflow());

			definitions.push(pacWf);
		},

		GetLineItemFieldsForWorkflow: function ()
		{
			function getTypeFromMapping(itemId)
			{
				var itemType = Lib.Purchasing.Items.PRItemsDBInfo.fieldsMap[itemId] || "generic";
				switch (itemType)
				{
					case "int": /* Fall through to double */
					case "double": return "decimal";
					case "date": return "generic";
					case "bool": return "boolean";
					default: return "generic";// Or string?
				}
			}

			var fields = {};

			const mappingsByLine = Sys.Helpers.Extend(true, {}, Lib.Purchasing.Items.PRItemsSynchronizeConfig.mappings.byLine, {
				"ItemLocalNetAmount__": {
					"name": "ItemLocalNetAmount__",
					"availableOnWorkflowRule": true
				}
			});

			// add all declared fields from PRItemsSynchronizeConfig
			for (var f in mappingsByLine)
			{
				if (typeof mappingsByLine[f] === "object" && (mappingsByLine[f].availableOnWorkflowRule))
				{
					var newField = {
						"availableFromVersion": 3,
						"filter": [{ "field": "WorkflowType__", "operator": "===", "value": ["\"purchaseRequisitionPreApproval\"", "\"purchaseRequisitionApproval\""] }],
						"type": getTypeFromMapping(f)
					};
					var fieldFromConfig = Lib.Purchasing.Items.PRItemsWorkflowFields[f];
					if (fieldFromConfig)
					{
						Sys.Helpers.Extend(true, newField, fieldFromConfig);
					}
					var workflowNiceName = mappingsByLine[f].workflowNiceName;
					if (!Sys.Helpers.IsEmpty(workflowNiceName))
					{
						newField.niceName = workflowNiceName;
					}
					fields["PRV2-" + Lib.Purchasing.Items.PRItemsSynchronizeConfig.formTable + "-" + mappingsByLine[f].name] = newField;
				}
			}

			return fields;
		}
	};
});
