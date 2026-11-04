/* LIB_DEFINITION{
  "name": "LIB_O2C_CUSTOMIZATION_EDIPREPROCESSING_SAMPLE",
  "scriptType": "SERVER",
  "comment": "Custom library extending EDI preprocessing process on server side",
  "versionable": false,
  "libraryType": "Lib",
  "require": []
}*/

/**
 * Package O2C EDIPreprocessing customization callbacks
 * @namespace Lib.O2C.Customization.EDIPreprocessing
 */

var Lib = Lib || {};
Lib.O2C = Lib.O2C || {};
Lib.O2C.Customization = Lib.O2C.Customization || {};

Lib.O2C.Customization.EDIPreprocessing = (function ()
{
	/**
	 * @lends Lib.O2C.Customization.EDIPreprocessing
	 */
	var customization = {
		/**
		* @description This function is called in the Sys_EDISpecifying syslib.
		* Each EDI Format type (e.g. X12, EDIFACT, IDOC) has EDI types ("ORDER", "ORDER CONFIRMATION", "ADVANCE SHIP NOTICE"...) which each have a specific syslib.
		* These syslibs contains 2 objects: the specifications and the structure of that EDI type in that EDI format.
		* These 2 objects are used to parse the EDI into JSON that can be given as input to the mapper of that EDI type in that EDI format.
		* This function allows to overwrite the specification object, i.e, WHATS the segment -> His key, description and what fields it contain.
		*
		* This user exit is a copy of the one previously defined in LIB_SOP_CUSTOMIZATION_EDIPREPROCESSING and is the one to use from now on.
		* The one who was defined in SOP is obsolete since it was created for SOP, but we need to be able to define customization in other packages (AR, OM, etc).
		* In the example below, you will find how to determine from which package (AR, OM, etc.) this function is called, which allows you to implement different customizations for different packages.
		*
		* @param {object} jsonSpec - The default specifications object (generated using the official documentation for the format)
		* @param {string} EDIFormat - Indicates which specifications needs to be overwritten (e.g. "EDIFACT", "X12", "IDOC"...)
		* @param {string} EDIType - Indicates which structure needs to be overwritten (e.g. "ORDER", "ORDER CONFIRMATION", "ADVANCE SHIP NOTICE"...). If this parameter is not given, it means that the document is an order ("ORDER").
		*
		* @returns {object} An object with the same structure as the input jsonSpec object, but updated to suit your own specific needs.
		* You can update it as you would update any JSON.
		* You don't have to use the input argument.
		* You can build your own object from scratch, as long as you respect the structure.
		*
		* @example <caption>Here is a sample of the specifications object for the EDIFACT Format, for you to see the structure: </caption>
		*	var jsonSpec =
		*	{
		*		"BGM": {
		*			"keyForTemplate": "beginningOfMessage",
		*			"description": "Beginning of message",
		*			"fields": {
		*				"BGM_01_C002": {
		*					"description": "Document/Message name",
		*					"keyForTemplate": "documentMessageName",
		*					"subFields": {
		*						"C002_01_1001": {
		*							"description": "Document/Message name, coded",
		*							"keyForTemplate": "documentMessageNameCoded"
		*						},
		*						"C002_02_1131": {
		*							"description": "Code list qualifier",
		*							"keyForTemplate":"codeListQualifier"
		*						},
		*						"C002_03_3055": {
		*							"description": "Code list responsible agency, coded",
		*							"keyForTemplate":"codeListResponsibleAgencyCoded"
		*						},
		*						"C002_04_1000": {
		*							"description": "Document/Message name",
		*							"keyForTemplate":"documentMessageNameSubfield"
		*						}
		*					}
		*				},
		*				"BGM_02_1004": {
		*					"description": "Document/Message number",
		*					"keyForTemplate":"documentNumber"
		*				},
		*				"BGM_03_1225": {
		*					"description": "Message function, coded",
		*					"keyForTemplate": "messageFunctionCoded"
		*				},
		*				"BGM_04_4343": {
		*					"description": "Response type, coded",
		*					"keyForTemplate": "responseTypeCoded"
		*				}
		*			}
		*		}
		*		// and so on...
		*	};
		*
		*	@example <caption> And this is how you redefine the specifications based on the EDIFormat and EDIType given in input</caption>
		*	function UpdateJsonSpecifications(jsonSpec, EDIFormat, EDIType)
		* 	{
		*		if (EDIFormat === "EDIFACT")
		*		{
		*			if (EDIType === "ORDER")
		*			{
		*				// various updates on jsonSpec...
		*			}
		*			else if (EDIType === "ORDER CONFIRMATION")
		*			{
		*				// various updates on jsonSpec...
		*			}
		*		}
		*		else if (EDIFormat === "X12")
		*		{
		*			// various updates on jsonSpec...
		*		}
		*		return jsonSpec;
		* 	}</code></pre>
		* 	@example <caption>
		*	Here is another example of this user exit implementation. When this user exit is called from :
		*	- AR Package : Override specifications of segment E2REF02.
		*	- MyCustomProcess : Add a new field called "newField", to already existing segment EDI_DC40.
		*	- Other Package : Add a new segment called "NEWSEG01", to the IDOC then add field "newField" to this segment.</caption>
		*
		* 	UpdateJsonSpecifications: function (jsonSpec, EDIFormat, EDIType)
		* 	{
		*		const currentProcessID = Data.GetValue("RUIDEX").split("#")[1].split(".")[0];
		*		const supiProcessID = Process.GetProcessID("Customer invoices (supplier copy)");
		*		const myCustomProcess = Process.GetProcessID("Z_MyCustomProcess");
		*		const isARPackage = currentProcessID === supiProcessID;
		*		const isMyCustomPackage = currentProcessID === myCustomProcess;
		*
		*		const elementToAdd =
		*		{
		*			"newField":
		*   		{
		*        		"description": "New field description",
		*        		"keyForTemplate": "newFieldKey",
		*       		"offset": 66,
		*       		"length": 35
		*   		}
		*		}
		*
		*		if (isARPackage)
		*		{
		*			if (EDIFormat === "IDOC")
		* 	    	{
		* 	        	jsonSpec["E2REF02"] = {
		* 	        	    "keyForTemplate": "documentHeaderReferencedDocument",
		* 	        	    "description": "Document header referenced document",
		* 	        	    "fields":
		* 	        	    {
		* 	        	        "QUALF":
		* 	        	        {
		* 	        	            "description": "Qualifier reference document",
		* 	        	            "keyForTemplate": "qualifierReferenceDocument",
		* 	        	            "offset": 63,
		* 	        	            "length": 3
		* 	        	        },
		* 	        	        "BELNR":
		* 	        	        {
		* 	        	            "description": "Document number",
		* 	        	            "keyForTemplate": "documentNumber",
		* 	        	            "offset": 66,
		* 	        	            "length": 35
		* 	        	        }
		* 	        	    }
		* 	        	}
		* 	    	}
		*		}
		*		else if (isMyCustomPackage)
		*		{
		*			Object.assign(jsonSpec["EDI_DC40"].fields, elementToAdd);
		*		}
		*		else
		*		{
		*			const newSegment =
		*			{
		*				"segmentLevel": "03",
		*				"keyForTemplate": "newSegmentKey",
		*				"description": "New Segment description",
		*				"fields": {}
		*			};
		*			jsonSpec["NEWSEG01"] = newSegment;
		*			Object.assign(jsonSpec["NEWSEG01"].fields, elementToAdd);
		*		}
		* 	    return jsonSpec;
		* 	}
		*/
		UpdateJsonSpecifications: function (jsonSpec, EDIFormat, EDIType)
		{
		},
		/**
		* @description This function is called in the Sys_EDISpecifying syslib.
		* Each EDI Format type (e.g. X12, EDIFACT, IDOC) has EDI types ("ORDER", "ORDER CONFIRMATION", "ADVANCE SHIP NOTICE"...) which each have a specific syslib.
		* These syslibs contains 2 objects: the specifications and the structure of that EDI type in that EDI format.
		* These 2 objects are used to parse the EDI into JSON that can be given as input to the mapper of that EDI type in that EDI format.
		* This function allows to overwrite the structure object, i.e, WHERE in the IDOC file we find the segment -> his parent and child elements
		*
		* This user exit is a copy of the one defined in LIB_SOP_CUSTOMIZATION_EDIPREPROCESSING and is the one to use from now on.
		* The one who was defined in SOP is obsolete since it was created for SOP, but we need to be able to define customization in other packages (AR, OM, etc).
		* In the example below, you will find how to determine from which package (AR, OM, etc.) this function is called, which al
		*
		* @param {object} jsonStruct - The default structure object (generated using the official documentation for the format)
		* @param {string} EDIFormat - Indicates which structure needs to be overwritten (e.g. "EDIFACT", "X12", "IDOC"...)
		* @param {string} EDIType - Indicates which structure needs to be overwritten (e.g. "ORDER", "ORDER CONFIRMATION", "ADVANCE SHIP NOTICE"...). If this parameter is not given, it means that the document is an order ("ORDER").
		*
		* @returns {object} An object with the same structure as the input jsonStruct object, but updated to suit your own specific needs.
		* You can update it as you would update any JSON.
		* You don't have to use the input argument.
		* You can build your own object from scratch, as long as you respect the structure.
		*
		* @example <caption>Here is a sample of the structure object for the EDIFACT Format, for you to see the structure: </caption>
		*	var jsonstruct =
		*	{
		*			"BGM": {},
		*			"NAD": {},
		*			"DTM": {},
		*			"LIN": {
		*				"PIA": {},
		*				"IMD": {},
		*				"MEA": {},
		*				"QTY": {},
		*				"DTM": {},
		*				"PRI": {},
		*				"ALC": {},
		*				"PCD": {},
		*				"MOA": {}
		*			},
		*			"MOA": {},
		*			"UNB": {},
		*			"UNH": {},
		*			"UNS": {},
		*			"CNT": {},
		*			"UNT": {},
		*			"UNZ": {},
		*			"RFF": {}
		*	};
		*
		*	@example <caption>And this is how you redefine the specifications based on the EDIFormat and EDIType given in input</caption>
		*	function UpdateJsonStructure(jsonStruct, EDIFormat, EDIType)
		* 	{
		*		if (EDIFormat === "EDIFACT")
		*		{
		*			if (EDIType === "ORDER")
		*			{
		*				// various updates on jsonSpec...
		*			}
		*			else if (EDIType === "ORDER CONFIRMATION")
		*			{
		*				// various updates on jsonSpec...
		*			}
		*			return jsonStruct;
		*		}
		*		else if (EDIFormat === "X12")
		*		{
		*			// and so on...
		*		}
		* 	}
		*
		* 	@example <caption>Here is another example of this user exit implementation that set the position of the segment "NEWSEG01", who was previously
		*	created in the UserExit "UpdateJsonSpecifications", into the already existing segment "EDI_DC40".</caption>
		*
		* 	UpdateJsonStructure: function (jsonStruct, EDIFormat, EDIType)
		* 	{
		*		const currentProcessID = Data.GetValue("RUIDEX").split("#")[1].split(".")[0];
		*		const supiProcessID = Process.GetProcessID("Customer invoices (supplier copy)");
		*		const myCustomProcess = Process.GetProcessID("Z_MyCustomProcess");
		*		const isARPackage = currentProcessID === supiProcessID;
		*		const isMyCustomPackage = currentProcessID === myCustomProcess;
		*		if (isARPackage)
		*		{
		* 	    	// customization for AR packages
		*		}
		*		else if (isMyCustomPackage)
		*		{
		*			// customization for customPackage
		*		}
		*		else
		*		{
		*			if (EDIFormat === "IDOC")
		* 	    	{
		* 	    	    jsonStruct["EDI_DC40"] = {
		* 	    	        "NEWSEG01":
		* 	    	        {}
		* 	    	    };
		* 	    	}
		*		}
		* 	    return jsonStruct;
		* 	}
		*/
		UpdateJsonStructure: function (jsonStruct, EDIFormat, EDIType)
		{
		}
	};
	return customization;
})();