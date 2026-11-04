
var FieldsNames = {
	SubmittedDocType: "SubmittedDocType__",
	SplitOption: "Split_DivisionMethod__",
	SplitOffset: "Split_Offset__",
	SplitNumberOfPage: "Split_NumberPages__",
	SplitString: "Split_String__",
	SplitArea: "Split_Area__",
	SplitUseRegex: "Split_UseRegex__",
	SplitCaseSensitive: "Split_CaseSensitive__",
	SplitSearchOnFirstPage: "Split_Location__",
	PDFCommand: "MOD_Option_PDFCommand__",
	SkipMethod: "Skip_Method__",
	SkipArea: "Skip_Area__",
	SkipCriteria: "Skip_Criteria__",
	SkipIsRegex: "Skip_CriteriaIsRegex__",
	SkipMatchCase: "Skip_CriteriaMatchCase__"
};

var FieldErrors = {
	Required: "This field is required",
	PositiveValue: "This field must be positive",
	Malformatted: "This field is malformatted (X, Y, Height, Width)"
};

var StepIndexes = {
	General: 0
};

var regExpAreaValidation = /(?:\s*-?\d+\s*),(?:\s*-?\d+\s*),(?:\s*\d+\s*),(?:\s*\d+\s*)/;

var SplittingHandler = {
	splittingMehods: { "SIMPLE": "noDivision", "NPAGES": "fixedPageNumber", "ONSTRING": "stringSplit", "ONAREA": "areaSplit" },

	FormSplittingIsComplete: function ()
	{
		var comboValue = Data.GetValue(FieldsNames.SplitOption);

		var offsetValue = Data.GetValue(FieldsNames.SplitOffset);
		if (offsetValue === "" || Data.GetError(FieldsNames.SplitOffset) !== "")
		{
			Data.SetError(FieldsNames.SplitOffset, FieldErrors.Required);
			return false;
		}

		if (offsetValue < 0)
		{
			Data.SetError(FieldsNames.SplitOffset, FieldErrors.PositiveValue);
			return false;
		}

		if (comboValue === "NPAGES")
		{
			var value = Data.GetValue(FieldsNames.SplitNumberOfPage);
			if (value === "" || Data.GetError(FieldsNames.SplitNumberOfPage) !== "")
			{
				Data.SetError(FieldsNames.SplitNumberOfPage, FieldErrors.Required);
				return false;
			}
			else if (value < 0)
			{
				Data.SetError(FieldsNames.SplitNumberOfPage, FieldErrors.PositiveValue);
				return false;
			}
			return true;
		}
		else if (comboValue === "ONSTRING" && (Data.GetValue(FieldsNames.SplitString) === ""))
		{
			Data.SetError(FieldsNames.SplitString, FieldErrors.Required);
			return false;
		}
		else if (comboValue === "ONAREA")
		{
			var valid = regExpAreaValidation.test(Data.GetValue(FieldsNames.SplitArea));
			if (!valid)
			{
				Data.SetError(FieldsNames.SplitArea, FieldErrors.Malformatted);
			}
			return valid;
		}

		return true;
	},

	Process: function ()
	{
		var splitResult = null;
		var stringPreviewDocSplitting = "";

		if (this.FormSplittingIsComplete())
		{
			var nbPages = (Data.GetValue(FieldsNames.SubmittedDocType) || "pdf") === "pdf" ? Attach.GetProcessedConvertedFile().GetNbPages() : 1;
			Variable.SetValueAsString("nbTotalPages", nbPages);

			var skipMethod = Data.GetValue(FieldsNames.SkipMethod);
			var splitOffset = Data.GetValue(FieldsNames.SplitOffset);
			var skipArea = Data.GetValue(FieldsNames.SkipArea);
			var skipCriteria = Data.GetValue(FieldsNames.SkipCriteria);
			var skipIsRegex = Data.GetValue(FieldsNames.SkipIsRegex);
			var skipMatchCase = Data.GetValue(FieldsNames.SkipMatchCase);

			var offsetValue = Lib.DD.Splitting.GetOffset(skipMethod, splitOffset, nbPages, skipArea, skipMatchCase, skipIsRegex, skipCriteria);

			var splitData = {
				enableHighlight: false,
				enableStoreArea: true,
				offset: offsetValue,
				mode: this.splittingMehods[Data.GetValue(FieldsNames.SplitOption)],
				numberOfPages: Data.GetValue(FieldsNames.SplitNumberOfPage),
				searchString: Data.GetValue(FieldsNames.SplitString),
				searchStringOnFirstPage: Data.GetValue(FieldsNames.SplitSearchOnFirstPage) === "0",
				area: Data.GetValue(FieldsNames.SplitArea),
				caseSensitive: Data.GetValue(FieldsNames.SplitCaseSensitive),
				useRegex: Data.GetValue(FieldsNames.SplitUseRegex)
			};

			splitResult = Lib.DD.Splitting.Split(splitData);
			stringPreviewDocSplitting = JSON.stringify(splitResult);
			Variable.SetValueAsString("previewDocumentNumber", 0);
		}

		Variable.SetValueAsString("previewDocumentSplitted", stringPreviewDocSplitting);
		Variable.SetValueAsString("errorDocumentSplitted", Lib.DD.Splitting.error);
		Variable.SetValueAsString("areasSplitted", JSON.stringify(Lib.DD.Splitting.splitAreas));

		return splitResult;
	}
};

var SaveSettingsHandler = {
	_settingsTable: "DD - Application Settings__",
	_globalSettingsTable: "DD - Application Global Settings__",
	_ignoreSaveFields: {
	},

	Process: function ()
	{
		Sys.DD.NeedConfiguration = false;

		if (!IsOutboundConfiguration())
		{
			Data.SetValue("ConfigurationSelection_Enable__", "1");
			Data.SetValue("MatchDocumentLayout__", "1");
			Data.SetValue("MatchStringWithinDocument__", "0");
		}

		if (this.CheckConfiguration())
		{
			this.CreateVectorStoreCollection();
			this.Save();
		}
	},

	CreateVectorStoreCollection: function ()
	{
		const activateVectorStore = Data.GetValue("Activate_vector_store__");
		const dataToStore = Data.GetValue("Data_To_Store__");
		Log.Verbose("[CreateVectorStoreCollection] Send document to vector store: " + activateVectorStore ? "Yes" : "No");

		if (activateVectorStore)
		{
			const vectorStoreCollection = Data.GetValue("Vector_Store_Collection_ComboBox__");
			Log.Verbose("[CreateVectorStoreCollection] Vector store collection: " + vectorStoreCollection);
			if (vectorStoreCollection)
			{
				// Create collection if not exists, or update description if different
				const collectionsManager = new Sys.ML.VectorStore.Collections.CollectionsManager();
				collectionsManager.getCollection(vectorStoreCollection).then(collection =>
				{
					if (!collection)
					{
						if (dataToStore === "Conversations")
						{
							collectionsManager.createCollection(
								vectorStoreCollection,
								Data.GetValue("DocumentTypeDescription__"),
								["DD - Knowledge Base__"],
								Sys.Helpers.LdapUtil.FilterEqual("Collection_Name__", vectorStoreCollection).toString()
							).then(() =>
							{
								Log.Verbose("[CreateVectorStoreCollection] Collection '" + vectorStoreCollection + "' created with description '" + Data.GetValue("DocumentTypeDescription__") + "'");
							});
						}
						else
						{
							collectionsManager.createCollection(vectorStoreCollection, Data.GetValue("DocumentTypeDescription__")).then(() =>
							{
								Log.Verbose("[CreateVectorStoreCollection] Collection '" + vectorStoreCollection + "' created with description '" + Data.GetValue("DocumentTypeDescription__") + "'");
							});
						}
					}
					else
					{
						Log.Verbose("[CreateVectorStoreCollection] Collection '" + vectorStoreCollection + "' already exists");
					}
				}).catch(err => this.SetError("Error while handling vector store collection: " + err));
			}
		}
	},

	SetError: function (step, message)
	{
		if (step)
		{
			Variable.SetValueAsString("currentStep", step);
		}

		Variable.SetValueAsString("ErrorMessage", message);
		Process.PreventApproval();
	},

	GetFilter: function (configName, documentFamily)
	{
		var familyPart = "";
		if (documentFamily !== "" && documentFamily != null)
		{
			familyPart = "(Family__=" + documentFamily + ")";
		}
		else
		{
			familyPart = "(|(Family__=)(!(Family__=*)))";
		}
		var filter = "(&(ConfigurationName__=" + configName + ")" + familyPart + ")";
		Log.Info("SaveSettingsHandler, filter: " + filter);

		return filter;
	},

	CheckConfigurationUnicity: function ()
	{
		var currentConfigurationName = Data.GetValue("ConfigurationName__");

		if (!currentConfigurationName)
		{
			this.SetError(StepIndexes.General, "Expecting a configuration name");
			return false;
		}

		// ExistingConfigurations only set if no ConfigurationName__ found during customscript
		var existingConfigurations = Variable.GetValueAsString("ExistingConfigurations");
		if (existingConfigurations)
		{
			try
			{
				existingConfigurations = JSON.parse(existingConfigurations);
				for (var i = 0; i < existingConfigurations.length; i++)
				{
					if (existingConfigurations[i].name === currentConfigurationName)
					{
						this.SetError(StepIndexes.General, "_Existing configuration");
						return false;
					}
				}
			}
			catch (e)
			{
				Log.Warn("Exception during check of duplicate configuration name : " + e);
			}
		}
		else
		{
			Log.Info("There is no existing configuration name.");
		}

		return true;
	},

	CheckDuplicateDocumentTypeForAL: function ()
	{
		var isConfigurationAL = Data.GetValue("ConfigurationSelection_Enable__") && Data.GetValue("MatchDocumentLayout__");
		var existingDocumentTypeForAL = Variable.GetValueAsString("ExistingDocumentTypeForAL");
		if (isConfigurationAL && existingDocumentTypeForAL)
		{
			try
			{
				existingDocumentTypeForAL = JSON.parse(existingDocumentTypeForAL);

				var currentDocumentType = Data.GetValue("Document_Type__");
				var loadedDocumentType = Variable.GetValueAsString("DocumentTypeLoaded");
				if (loadedDocumentType !== currentDocumentType && Sys.Helpers.Array.IndexOf(existingDocumentTypeForAL, currentDocumentType) !== -1)
				{
					Variable.SetValueAsString("DocumentTypeNotUnique", "1");
					this.SetError(null, "_Existing document type, must be unique");
					return true;
				}
			}
			catch (e)
			{
				Log.Warn("Exception during check of duplicate document type : " + e);
			}
		}
		else
		{
			Log.Info("There is no existing document type.");
		}
		return false;
	},

	CheckConfiguration: function ()
	{
		if (!this.CheckConfigurationUnicity())
		{
			return false;
		}

		if (Data.GetValue("ConfigurationSelection_Enable__") && Data.GetValue("MatchStringWithinDocument__"))
		{
			if (Sys.Outbound.IsExtractableDocType(Data.GetValue("SubmittedDocType__")))
			{
				if (!regExpAreaValidation.test(Data.GetValue("ConfigurationSelection_Area__")))
				{
					Data.SetError("ConfigurationSelection_Area__", Language.Translate("Expecting a correctly formatted area"));
					return false;
				}
			}
			else if (!Data.GetValue("ConfigurationSelection_Path__"))
			{
				Data.SetError("ConfigurationSelection_Path__", Language.Translate("_Expecting a correctly formatted xpath expression"));
				return false;
			}

			if (!Data.GetValue("ConfigurationSelection_Criteria__"))
			{
				Data.SetError("ConfigurationSelection_Criteria__", Language.Translate("Expecting a non empty criteria"));
				return false;
			}
		}
		else if (Data.GetValue("ConfigurationSelection_Enable__") && Data.GetValue("MatchFilenameRegex__") && !Data.GetValue("Filename_regular_expression__"))
		{
			Data.SetError("Filename_regular_expression__", Language.Translate("Expecting a non empty criteria"));
			return false;
		}

		if (Data.GetValue("Skip_Method__") === "SKIP_AREA")
		{
			if (Sys.Outbound.IsExtractableDocType(Data.GetValue("SubmittedDocType__")))
			{
				if (!regExpAreaValidation.test(Data.GetValue("Skip_Area__")))
				{
					Data.SetError("Skip_Area__", Language.Translate("Expecting a correctly formatted area"));
					return false;
				}
			}

			if (!Data.GetValue("Skip_Criteria__"))
			{
				Data.SetError("Skip_Criteria__", Language.Translate("Expecting a non empty criteria"));
				return false;
			}
		}

		if (this.CheckDuplicateDocumentTypeForAL())
		{
			return false;
		}

		return true;
	},

	Save: function ()
	{
		Log.Info("Saving configuration global settings");
		Sys.DD.NeedConfiguration = false;

		var recordGlobalSettings = Sys.Helpers.Database.CD2CT(this._globalSettingsTable);
		if (recordGlobalSettings.GetLastError() !== 0)
		{
			this.SetError(null, "Could not save global settings : " + recordGlobalSettings.GetLastErrorMessage());
		}

		Log.Info("Saving configuration settings");
		var options =
		{
			fieldsToIgnore: SaveSettingsHandler._ignoreSaveFields,
			specialFields: {}
		};

		options.specialFields[FieldsNames.PDFCommand] =
		{
			GetValue: function (value)
			{
				return value.replace(/\n/g, "\\r\\n");
			}
		};

		var record = Sys.Helpers.Database.CD2CT(this._settingsTable, this.GetFilter(Data.GetValue("ConfigurationName__"), Data.GetValue("Family__")), options);
		if (record.GetLastError() !== 0)
		{
			this.SetError(null, "Could not save settings : " + record.GetLastErrorMessage());
		}

		// Create transport to save reference file
		var recordVars = record.GetVars();
		this.SaveReferenceFile(recordVars.GetValue_String("longid", 0));

		UpdateConfigurationFilenameMask();

		this.PersistCustomFields();

		Log.Info("The configuration has been successfully saved");
	},

	SaveReferenceFile: function (settingsMsn)
	{
		if (settingsMsn && Attach.GetNbAttach() > 0)
		{
			var src = Attach.GetAttach(0).GetAttachFile();
			var ext = Attach.GetExtension(0);

			var cmd = Process.CreateTransport("Copy", true);
			var vars = cmd.GetUninheritedVars();

			var cmdAttach = cmd.AddAttach();
			cmdAttach.SetAttachFile(src);
			var attachVars = cmdAttach.GetVars();
			attachVars.AddValue_String("AttachOutputName", settingsMsn + ext, true);

			vars.AddValue_String("CopyPath", "Resource_ProcessReference", true);
			vars.AddValue_String("OverWriteIfExist", "1", true);
			vars.AddValue_String("Priority", "1", true);

			cmd.Process();
		}
	},

	PersistCustomFields: function ()
	{
		if (!Variable.GetValueAsString("AdditionalFieldsChangeDetection"))
		{
			return false;
		}

		try
		{
			var customFieldsList = JSON.parse(Variable.GetValueAsString("CustomFieldsList__"));
			var errorOutput = Sys.ProcessUpdater.ProcessFields("DD - SenderForm", customFieldsList);

			if (errorOutput)
			{
				throw new Error(errorOutput);
			}

			var commonFieldsList = this.GetCommonCustomFields(customFieldsList);
			this.SpreadCustomCommonFieldsChanges(commonFieldsList);

			this.CleanCurrentCustomFieldsOnSuccess(customFieldsList);
		}
		catch (err)
		{
			this.SetError(null, "Could not save Custom Fields: " + err.message);
			return false;
		}
		return true;
	},

	GetCommonCustomFields: function (customFieldsList)
	{
		return customFieldsList.filter(function (item)
		{
			var activationData = item.field.activationData;
			return activationData && activationData.activationCondition && activationData.activationCondition.field === "Family__";
		});
	},

	SpreadCustomCommonFieldsChanges: function (commonFieldsList)
	{
		if (commonFieldsList.length === 0)
		{
			return false;
		}

		var configsTransport = this.GetActiveInboundConfigTransport();

		if (!configsTransport)
		{
			return false;
		}

		while (configsTransport)
		{
			var vars = configsTransport.GetUninheritedVars();
			var ruid = vars.GetValue("RuidEx", 0);
			var fieldsOrder = this.GetJsonCollectionFromSerializedValue(vars.GetValue_String("FieldsOrder__", 0));

			if (fieldsOrder.length === 0)
			{
				configsTransport = Query.MoveNext();
				continue;
			}

			var fieldsToUpdate = [];

			var item;
			for (var i = 0; i < commonFieldsList.length; i++)
			{
				item = commonFieldsList[i];

				if (item.field.deleted)
				{
					fieldsOrder = this.RemoveDeletedFieldFromCollection(fieldsOrder, item.field.name, "FieldsOrder__");
					if (fieldsOrder)
					{
						fieldsToUpdate.push({ name: "FieldsOrder__", value: fieldsOrder });
					}
				}
			}

			if (fieldsToUpdate.length > 0)
			{
				this.UpdateTransverseConfigFieldsCollections(fieldsToUpdate, ruid);
			}
			configsTransport = Query.MoveNext();
		}

		return true;
	},

	GetJsonCollectionFromSerializedValue: function (fieldValue)
	{
		var collection = [];
		try
		{
			collection = JSON.parse(fieldValue);
		}
		catch (err)
		{
			collection = [];
		}

		return collection;
	},

	RemoveDeletedFieldFromCollection: function (collection, targetName, targetFieldToUpdate)
	{
		var toBeDeleted = false;
		for (var i = 0; i < collection.length; i++)
		{
			toBeDeleted = targetFieldToUpdate === "FieldsOrder__" && collection[i] === targetName;
			if (toBeDeleted)
			{
				collection.splice(i, 1);
				return collection;
			}
		}
		return null;
	},

	UpdateTransverseConfigFieldsCollections: function (fieldsList, ruid)
	{
		var updatableConfig = Process.GetUpdatableTransport(ruid);
		var updatableConfigVars = updatableConfig.GetUninheritedVars();

		for (var i = 0; i < fieldsList.length; i++)
		{
			updatableConfigVars.AddValue_String(fieldsList[i].name, JSON.stringify(fieldsList[i].value), true);
		}

		updatableConfig.Process();
	},

	CleanCurrentCustomFieldsOnSuccess: function (customFieldsList)
	{
		// waiting for fields to be removed through ProcessFields before deleting them from the Wizard collection
		var fieldsOrder = this.GetJsonCollectionFromSerializedValue(Data.GetValue("FieldsOrder__"));
		var flagUpdate = false;
		for (var i = customFieldsList.length - 1; i >= 0; i--)
		{
			var item = customFieldsList[i];

			if (item.field && item.field.deleted)
			{
				customFieldsList.splice(i, 1);
				flagUpdate = true;
				var indexFieldToDelete = fieldsOrder.indexOf(item.field.name);
				if (indexFieldToDelete !== -1)
				{
					fieldsOrder.splice(indexFieldToDelete, 1);
				}
			}
		}

		if (flagUpdate)
		{
			Variable.SetValueAsString("CustomFieldsList__", JSON.stringify(customFieldsList));
			Data.SetValue("FieldsOrder__", JSON.stringify(fieldsOrder));
		}
	},

	GetActiveInboundConfigTransport: function ()
	{
		Query.Reset();
		Query.SetSpecificTable("CDNAME#" + this._settingsTable);
		Query.SetAttributesList("Document_Type__,Family__,FieldsOrder__,RuidEx");
		// get all inbound active configurations except current one
		var ldap = Sys.Helpers.LdapUtil;
		var filter = ldap.FilterAnd(
			ldap.FilterEqual("Routing__", "Routing Message"),
			ldap.FilterNot(
				ldap.FilterEqual("ConfigurationName__", Data.GetValue("ConfigurationName__"))
			),
			ldap.FilterNot(
				ldap.FilterEqual("Configuration_template__", 1)
			),
			ldap.FilterNot(
				ldap.FilterEqual("Enable_Configuration__", 0)
			),
			ldap.FilterEqual("Family__", Data.GetValue("Family__") || "")
		).toString();
		Query.SetFilter(filter);

		if (!Query.MoveFirst())
		{
			return null;
		}

		return Query.MoveNext();
	}
};

function PreventActionIfNeeded(actions, actionName)
{
	var find = false;
	for (var i = 0; i < actions.length && !find; i++)
	{
		find = actions[i].actionName === actionName;
		if (find)
		{
			actions[i].handler.Process();
			if (actions[i].needPreventApproval)
			{
				Process.PreventApproval();
			}
		}
	}
}

function GetProcessById(id)
{
	var query = Process.CreateQuery();
	query.SetSpecificTable("EDD_PROCESS");
	query.SetFilter("ID=" + Process.GetProcessID(id));
	if (!query.MoveFirst())
	{
		this.SetError(null, "Failed to open EDD_PROCESS");
		return null;
	}
	var record = query.MoveNextRecord();
	if (!record)
	{
		this.SetError(null, "Failed to find '" + id + "' in EDD_PROCESS");
		return null;
	}
	return record;
}

function GetNoExtractionJson(processName, configurationName)
{
	Log.Info("Update " + configurationName + " configuration on " + processName);
	var noExtractionJson = {};
	var useFileNameRegex = Data.GetValue("ConfigurationSelection_Enable__") && Data.GetValue("MatchFilenameRegex__");
	if (useFileNameRegex)
	{
		var regexValue = Data.GetValue("Filename_regular_expression__");
		var caseSensitive = Data.GetValue("FileNameRegEx_CaseSensitive__");
		Log.Info("with regex " + regexValue);

		noExtractionJson = { "regex": regexValue, "caseSensitive": caseSensitive };
	}

	return noExtractionJson;
}

function UpdateConfigurationFilenameMask()
{
	var processName = "DD - SenderForm";

	var record = GetProcessById(processName);
	if (!record)
	{
		return;
	}

	var ocrNodeName = "ocr";
	var vars = record.GetVars();
	var ocrNode = vars.FindSubNode(ocrNodeName);
	if (!ocrNode)
	{
		this.SetError(null, "Node <" + ocrNodeName + "> not found in DD Sender form process template");
		return;
	}

	var noExtractionNodeName = "noExtraction";
	var noExtractionJson = JSON.parse(ocrNode.GetValue(noExtractionNodeName, 0));
	var configurationName = Data.GetValue("ConfigurationName__");
	var disableExtraction = Data.GetValue("DisableExtraction__");
	var configurationEnabled = Data.GetValue("Enable_Configuration__");

	var changed = false;
	if (disableExtraction && configurationEnabled)
	{
		noExtractionJson[configurationName] = GetNoExtractionJson(processName, configurationName);
		changed = true;
	}
	else if (noExtractionJson[configurationName])
	{
		Log.Info("Remove " + configurationName + " configuration on " + processName + " to enable extraction");
		delete noExtractionJson[configurationName];
		changed = true;
	}

	if (changed)
	{
		ocrNode.AddValue(noExtractionNodeName, JSON.stringify(noExtractionJson), 1);

		var resultCommit = record.Commit();
		if (resultCommit !== 0)
		{
			var lastErrorMessage = record.GetLastErrorMessage();
			SaveSettingsHandler.SetError(null, "Error " + resultCommit + " during save of sender form process : " + lastErrorMessage);
		}
	}
}


function Run(actions, isForResumbit)
{
	Data.SetValue("DoNotDisplayInDM", "1");
	if ((!isForResumbit && Data.GetActionType() === "approve")
		|| (isForResumbit && Data.GetActionType() === "reprocess"))
	{
		var actionName = Data.GetActionName();
		PreventActionIfNeeded(actions, actionName);
	}
}

function ExtractXML(xmlFile)
{
	Lib.DD.XMLExtraction.SetXMLFileToProcess(xmlFile);

	var extractionType = Sys.Helpers.TryCallFunction("Lib.DD.Customization.Extraction.GetExtractionType") || Data.GetValue("SubmittedDocType__") || "pdf";
	Log.Info("Extraction made using extraction type : '" + extractionType + "'");
	Sys.DD.Extraction.TryExtractDataFromDocument(extractionType);
	// The method below contains the extraction logic defined by the PS.
	Sys.Helpers.TryCallFunction("Lib.DD.Customization.Extraction.ExtractDataFromDocument", extractionType);
}

function IsOutboundConfiguration()
{
	var routing = Data.GetValue("Routing__");
	return routing !== "Routing message";
}

function InitValidation()
{
	if (IsOutboundConfiguration())
	{
		Run([
			{
				actionName: "Splitting",
				needPreventApproval: true,
				handler: SplittingHandler
			},
			{
				actionName: "Splitting_NextPage",
				needPreventApproval: true,
				handler: {
					Process: function ()
					{
						if (SplittingHandler.Process())
						{
							var xmlFile = Attach.GetConvertedFile(Variable.GetValueAsString("XmlIndex"));
							if (xmlFile)
							{
								ExtractXML(xmlFile);
							}
							var currentStep = parseInt(Variable.GetValueAsString("currentStep"), 10);
							Variable.SetValueAsString("currentStep", currentStep + 1);
						}
					}
				}
			},
			{
				actionName: "Splitting_NextPage_XML",
				needPreventApproval: true,
				handler: {
					Process: function ()
					{
						var xmlFile = Attach.GetConvertedFile(Variable.GetValueAsString("XmlIndex"));
						if (xmlFile)
						{
							ExtractXML(xmlFile);
						}
						var currentStep = parseInt(Variable.GetValueAsString("currentStep"), 10);
						Variable.SetValueAsString("currentStep", currentStep + 1);
					}
				}
			},
			{
				actionName: "Save",
				needPreventApproval: false,
				handler: SaveSettingsHandler
			}
		]);
	}
	else
	{
		Run([
			{
				actionName: "Save",
				needPreventApproval: false,
				handler: SaveSettingsHandler
			}
		]);
	}


	Run([{
		actionName: "Document",
		needPreventApproval: true,
		handler: {
			Process: function ()
			{
				var currentStep = parseInt(Variable.GetValueAsString("currentStep"), 10);
				Variable.SetValueAsString("currentStep", currentStep + 1);
			}
		}
	}], true);
}

InitValidation();
