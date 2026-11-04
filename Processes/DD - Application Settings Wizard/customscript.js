
/// ==================================
/// Namspace to handle binding between a table listing documents and the preview pannel
/// ==================================
var Tools = {
	GetAreaFromText: function (value)
	{
		if (value)
		{
			var coords = value.split(',');
			if (coords.length !== 4)
			{
				return null;
			}

			for (var i = 0; i < 4; i++)
			{
				if (isNaN(coords[i]))
				{
					return null;
				}
			}

			return {
				left: parseInt(coords[0], 10),
				top: parseInt(coords[1], 10),
				width: parseInt(coords[2], 10),
				height: parseInt(coords[3], 10)
			};
		}
		return null;
	},
	IsExtractable: function ()
	{
		var extrableDocType = ["pdf", "tif"];
		var docType = Controls.SubmittedDocType__.GetValue();
		return extrableDocType.indexOf(docType) >= 0;
	},
	IsExtractionDisabled: function ()
	{
		return Controls.DisableExtraction__.IsChecked();
	},
	HasTemplateId: function ()
	{
		var templateIDJSON = Controls.TemplateIdList__.GetValue();
		if (templateIDJSON)
		{
			try
			{
				var templateIdList = JSON.parse(templateIDJSON);
				return templateIdList && templateIdList.length > 0;
			}
			catch (exception)
			{
				Log.Error("Error while parsing JSON templateIDList: " + exception);
			}
		}
		return false;
	},
	translations: {
		previewSplittedDoc: Language.Translate("_PreviewSplittedDoc"),
		formattedAreaExpected: Language.Translate("Expecting a correctly formatted area"),
		formattedXPathExpected: Language.Translate("_Expecting a correctly formatted xpath expression"),
		nonEmptyCriteriaExpected: Language.Translate("Expecting a non empty criteria"),
		configurationNameExpected: Language.Translate("Expecting a configuration name"),
		configurationExisting: Language.Translate("_Existing configuration"),
		filenameRegexExisting: Language.Translate("_Existing file name regex"),
		documentTypeExisting: Language.Translate("_Existing document type, must be unique"),
		moreOptions: Language.Translate("More options"),
		noValidFileType: Language.Translate("Please select the format that matches the uploaded files")
	}
};

/// ==================================
/// Namspace to handle the "Extraction" step
/// ==================================
var ExtractionUI = {
	previewMaxDocuments: 100,
	outboundExtractionPanels: [Controls.Recipient_pane, Controls.Sender_pane, Controls.Billing_info_extraction_pane, Controls.extraction_feature_pane, Controls.Additional_fields_control_pane, Controls.Document_data_pane, Controls.Advanced_extraction_pane],
	inboundExtractionPanels: [Controls.Additional_fields_control_pane, Controls.Document_data_pane, Controls.extraction_feature_pane, Controls.Advanced_extraction_pane],
	controlsNotToRefresh: ["FieldsOrder__", "Document_Type_SDAForm__", "Show_recipient_id__", "Show_comment__", "Show_document_number__", "Show_document_priority__"],
	_refreshControls: function (params)
	{
		var isDisableExtraction = Tools.IsExtractionDisabled();
		if (isDisableExtraction)
		{
			return;
		}
		var doc = Attach.GetProcessedDocument();
		if (doc)
		{
			doc.UpdateInfoPageCache(params.infoPageRange.startPage, params.infoPageRange.endPage, function ()
			{
				var panelCollection = ExtractionUI.GetExtractionPanels();
				for (var i in panelCollection)
				{
					var controls = GetPanelControlsToRefresh(panelCollection[i]);
					for (var j in controls)
					{
						if (typeof controls[j].GetValueFromExtraction === "function")
						{
							controls[j].SetValue(controls[j].GetValueFromExtraction(params.docRange.startPage, params.docRange.endPage));
						}
					}
				}
			});
		}
	},

	GetExtractionPanels: function ()
	{
		if (IsOutboundConfiguration())
		{
			return this.outboundExtractionPanels;
		}

		return this.inboundExtractionPanels;
	},

	HandleConfigurationName: function ()
	{
		Data.SetExtractionConfiguration(Data.GetValue("ConfigurationName__"));
	},

	Init: function ()
	{
		this.HandleConfigurationName();
		var splitRanges = PreviewHelper.GetSplitRanges();
		if (splitRanges && splitRanges.length > 0)
		{
			var _infoPageRange = this.GetExtractionPageRange(splitRanges);
			this._refreshControls({ docRange: splitRanges[PreviewHelper.GetSelectedDoc()], infoPageRange: _infoPageRange });
		}
	},
	GetExtractionPageRange: function (splitRanges)
	{
		var lastDocIndex = Math.min(ExtractionUI.previewMaxDocuments, splitRanges.length) - 1;
		return {
			startPage: splitRanges[0].startPage,
			endPage: splitRanges[lastDocIndex].endPage
		};
	},
	SetReadOnly: function (readOnly)
	{
		var panelCollection = ExtractionUI.GetExtractionPanels();
		for (var i in ExtractionUI.GetExtractionPanels())
		{
			var controls = GetPanelControlsToRefresh(panelCollection[i]);
			for (var j in controls)
			{
				controls[j].SetReadOnly(readOnly);
			}
		}
	},
	CleanExtractionFields: function ()
	{
		var isDisableExtraction = Tools.IsExtractionDisabled();
		if (!isDisableExtraction)
		{
			return;
		}
		var panelCollection = ExtractionUI.GetExtractionPanels();
		for (var i in panelCollection)
		{
			var controls = GetPanelControlsToRefresh(panelCollection[i]);
			for (var j in controls)
			{
				controls[j].SetValue("");
			}
		}
	}
};

function GetPanelControlsToRefresh(ctrlPanel)
{
	var controls = ctrlPanel.GetControls();
	var controlsToIgnore = ExtractionUI.controlsNotToRefresh;
	for (var i = controls.length - 1; i >= 0; i--)
	{
		if (controlsToIgnore.indexOf(controls[i].GetName()) !== -1)
		{
			controls.splice(i, 1);
		}
	}
	return controls;
}

var PreviewHelper = {
	_selectedDoc: null,
	// The table listing documents that can be viewed in preview (if any)
	_boundPreviewTable: null,
	// The column (if any) that can be used to show the selected line in the table, using an arrow image
	_arrowColumnName: "",

	Init: function (table, arrowColName)
	{
		this._boundPreviewTable = table;
		this._arrowColumnName = arrowColName;
		this._boundPreviewTable.OnClick = function (row)
		{
			PreviewHelper.SetSelectedDoc(row.GetLineNumber(true) - 1);
		};
		this._boundPreviewTable.OnRefreshRow = function ()
		{
			PreviewHelper.HighlightRow(PreviewHelper.GetSelectedDoc());
		};
	},

	GetSelectedDoc: function ()
	{
		if (!this._selectedDoc)
		{
			this._selectedDoc = parseInt(Variable.GetValueAsString("previewDocumentNumber"), 10) || 0;
		}

		return this._selectedDoc;
	},

	GetSplitRanges: function ()
	{
		if (!this._splitRanges)
		{
			this._splitRanges = JSON.parse(Variable.GetValueAsString("previewDocumentSplitted"));
		}

		return this._splitRanges;
	},

	SetControlsValueFromExtraction: function (splitRange)
	{
		if (splitRange)
		{
			ExtractionUI._refreshControls({ docRange: splitRange, infoPageRange: splitRange });
		}
	},

	SetSelectedDoc: function (docNumber)
	{
		//Set the Preview document
		PreviewHelper._selectedDoc = docNumber;
		Variable.SetValueAsString("previewDocumentNumber", PreviewHelper._selectedDoc);
		var range = PreviewHelper.GetSplitRanges()[PreviewHelper._selectedDoc];
		Controls.PreviewPanel.SetPagesToDisplay(range.startPage, range.endPage);
		PreviewHelper.SetControlsValueFromExtraction(range);

		//Update the table that is bound
		if (PreviewHelper._boundPreviewTable)
		{
			PreviewHelper._boundPreviewTable.DisplayItem(docNumber);
			PreviewHelper.HighlightRow(docNumber);
		}
	},

	HighlightRow: function (docNumber)
	{
		for (var i = 0; i < PreviewHelper._boundPreviewTable.GetLineCount(); i++)
		{
			var currentRow = PreviewHelper._boundPreviewTable.GetRow(i);
			var currentRowDocNum = currentRow.GetLineNumber(true) - 1;
			if (currentRowDocNum === docNumber)
			{
				currentRow.AddStyle("highlight");
				if (PreviewHelper._arrowColumnName)
				{
					currentRow[PreviewHelper._arrowColumnName].SetImageURL("public\\arrow.png", true);
				}
			}
			else
			{
				currentRow.RemoveStyle("highlight");
				if (PreviewHelper._arrowColumnName)
				{
					currentRow[PreviewHelper._arrowColumnName].SetImageURL();
				}
			}
		}
	}
};

/// ==================================
/// Namspace to handle the "Splitting" step
/// ==================================
var SplitUI = {
	_splitRanges: null,
	hasChanged: true,

	isOnSelectPageEnabled: false,

	GetRangeNbPage: function (splitRange)
	{
		return splitRange.endPage - splitRange.startPage + 1;
	},

	GetSplittingDetails: function (splitRanges)
	{
		splitRanges = splitRanges || PreviewHelper.GetSplitRanges();
		var details = {
			"nbPages": 0,
			"nbDocuments": splitRanges.length
		};
		for (var index = 0; index < splitRanges.length; index++)
		{
			details.nbPages += this.GetRangeNbPage(splitRanges[index]);
		}

		return details;
	},

	PreviewSplit: function (preViewIfNeeded)
	{
		function FillSplitPreviewTable(splitResult)
		{
			ProcessInstance.SetSilentChange(true);
			var ctrlPreviewTable = Controls.Split_preview_table__;
			ctrlPreviewTable.SetWidth("100%");
			ctrlPreviewTable.SetExtendableColumn("Split_PageRange__");
			ctrlPreviewTable.SetItemCount(0);
			ctrlPreviewTable.SetAtLeastOneLine(false);

			for (var i = 0; i < splitResult.length; i++)
			{
				var item = ctrlPreviewTable.AddItem(false);
				item.SetValue("Split_ViewAction__", Tools.translations.previewSplittedDoc);
				item.SetValue("Split_Pages_Count__", SplitUI.GetRangeNbPage(splitResult[i]));
				item.SetValue("Split_PageRange__", splitResult[i].startPage + "-" + splitResult[i].endPage);
			}
			ProcessInstance.SetSilentChange(false);
		}

		function FillSplitDetails(splitResult)
		{
			var details = SplitUI.GetSplittingDetails(splitResult);
			Controls.Split_Pages_Count__.SetValue(details.nbPages);
			Controls.Split_Documents_Count__.SetValue(details.nbDocuments);
		}

		PreviewHelper.Init(Controls.Split_preview_table__, "Arrow__");

		if (preViewIfNeeded && !SplitUI.hasChanged)
		{
			return;
		}

		var previewRanges = PreviewHelper.GetSplitRanges();
		if (previewRanges && previewRanges.length > 0)
		{
			FillSplitPreviewTable(previewRanges);
			FillSplitDetails(previewRanges);
			// Take only the first splitted document for the preview
			PreviewHelper.SetSelectedDoc(PreviewHelper.GetSelectedDoc());
			SplitUI.hasChanged = false;
		}
		else
		{
			var errorString = Variable.GetValueAsString("errorDocumentSplitted");
			if (errorString !== null)
			{
				Popup.Alert(errorString, true, null, "_Status");
			}
			SplitUI.ResetPreview();
		}
	},

	ResetPreview: function ()
	{
		Controls.PreviewPanel.ResetPagesToDisplay();
		Controls.PreviewPanel.ClearHighlights();

		SplitUI._selectedDoc = null;
		SplitUI._splitRanges = null;
		SplitUI.hasChanged = true;
		Variable.SetValueAsString("previewDocumentSplitted", JSON.stringify([]));
		Variable.SetValueAsString("previewDocumentNumber", 0);
		Variable.SetValueAsString("errorDocumentSplitted", "");
		Controls.Split_Pages_Count__.SetValue("");
		Controls.Split_Documents_Count__.SetValue("");
		Controls.Split_Information_pane.Hide(true);
	},

	DrawSplittingPreview: function ()
	{
		var isOffset = Controls.Skip_Method__.GetValue() === "SKIP_AREA" || Controls.Split_Offset__.GetValue();
		var type = Controls.Split_DivisionMethod__.GetValue();
		var stringAtEnd = type === "ONSTRING" && Controls.Split_Location__.GetValue() === "1";
		Sys.Wizard.Tools.DrawSplittingPreview(isOffset, type, stringAtEnd, Controls.HTMLSplittingPreview__);
		Controls.Spacer_line3__.Hide(false);
		Controls.HTMLSplittingPreview__.Hide(false);
	},

	DrawAreas: function ()
	{
		Controls.PreviewPanel.ClearHighlights();
		SplitUI.DrawSplitArea();
		if (Controls.Split_DivisionMethod__.GetValue() === "ONSTRING")
		{
			SplitUI.DrawStringArea();
		}
	},

	OnPreviewSelectPage: function ()
	{
		if (SplitUI.isOnSelectPageEnabled)
		{
			SplitUI.DrawAreas();
		}
	},

	DrawSplitArea: function ()
	{
		var splitMethod = Controls.Split_DivisionMethod__.GetValue();
		if (splitMethod === "ONSTRING" || splitMethod === "ONAREA")
		{
			var area = Tools.GetAreaFromText(Controls.Split_Area__.GetText());
			if (area)
			{
				var splitRanges = PreviewHelper.GetSplitRanges();
				var startPage = splitRanges && splitRanges.length > 0 ?
					splitRanges[PreviewHelper.GetSelectedDoc()].startPage - 1 :
					0;

				var selectedPage = Controls.PreviewPanel.GetSelectedPage() || startPage + 1;
				area.page = selectedPage - startPage;
				Controls.PreviewPanel.Highlight(area);
			}
		}
	},

	DrawStringArea: function ()
	{
		var selectedRangePage = Variable.GetValueAsString("previewDocumentNumber") || 0;
		var splitRanges = PreviewHelper.GetSplitRanges();
		if (!splitRanges || splitRanges.length <= 0 || selectedRangePage >= splitRanges.length || PreviewHelper.GetSelectedDoc() >= splitRanges.length)
		{
			Log.Warn("GetSplitRanges() returns an invalid value: " + splitRanges);
			return;
		}
		// GetSelectedPage return 0 before document is loaded, load with the first doc
		var selectedPage = Controls.PreviewPanel.GetSelectedPage() || splitRanges[0].startPage;
		var startPage = splitRanges[PreviewHelper.GetSelectedDoc()].startPage;
		var areasSplittedDocument = JSON.parse(Variable.GetValueAsString("areasSplitted"));
		if (areasSplittedDocument)
		{
			for (var i = 0; i < areasSplittedDocument.length; i++)
			{
				// areasSplittedDocument page is 0-based, selectedPage is 1-based
				if (areasSplittedDocument[i].page === selectedPage - 1)
				{
					// page in highlight is 1-based
					Controls.PreviewPanel.Highlight({
						left: areasSplittedDocument[i].x,
						top: areasSplittedDocument[i].y,
						width: areasSplittedDocument[i].width,
						height: areasSplittedDocument[i].height,
						page: selectedPage - startPage + 1
					});
					break;
				}
			}
		}
	},

	HandleSkipVisibility: function ()
	{
		var docType = Controls.SubmittedDocType__.GetValue();
		var isDisableExtraction = Tools.IsExtractionDisabled();
		var isAutolearningConf = Tools.HasTemplateId() || Controls.IsAutolearningConf__.GetValue() === "1";
		var isSplitting = docType === "pdf" && !isDisableExtraction && !isAutolearningConf;

		var skipValue = Controls.Skip_Method__.GetValue();
		var skipOffset = skipValue !== "SKIP_AREA";
		var skipArea = skipValue === "SKIP_AREA";

		Controls.Split_Offset__.Hide(!isSplitting || !skipOffset);
		Controls.Skip_Area__.Hide(!isSplitting || !skipArea);
		Controls.Skip_Criteria__.Hide(!isSplitting || !skipArea);
		Controls.Skip_CriteriaIsRegex__.Hide(!isSplitting || !skipArea);
		Controls.Skip_CriteriaMatchCase__.Hide(!isSplitting || !skipArea);

		Controls.Skip_Area__.SetRequired(isSplitting && skipArea);
		Controls.Skip_Criteria__.SetRequired(isSplitting && skipArea);
	},

	HandleSkipArea: function ()
	{
		if (Tools.GetAreaFromText(this.GetText()))
		{
			return;
		}

		var area = Data.GetArea(this.GetName());
		var value = this.GetValue();
		if (area)
		{
			var areaValue = Controls.Skip_Area__.GetValue();
			if (!areaValue || this.GetName() === Controls.Skip_Area__.GetName())
			{
				Controls.Skip_Area__.SetValue(area.left + ', ' + area.top + ', ' + area.width + ', ' + area.height);
			}

			var criteriaValue = Controls.Skip_Criteria__.GetValue();
			if (!criteriaValue || this.GetName() === Controls.Skip_Criteria__.GetName())
			{
				Controls.Skip_Criteria__.SetValue(value);
			}

			Controls.PreviewPanel.ClearHighlights();
			area.page++;
			Controls.PreviewPanel.Highlight(area);
		}
	},

	SetControlsVisibility: function ()
	{
		var comboValue = Controls.Split_DivisionMethod__.GetValue();

		var numberPageVisible = comboValue === "NPAGES";
		var stringSplitVisible = comboValue === "ONSTRING";
		var useRegex = Controls.Split_UseRegex__.IsChecked();
		var areaVisible = comboValue === "ONAREA";

		Controls.Split_UseRegex__.SetLabel(areaVisible ? "Split_UseAreaFilter__" : "Split_UseRegex__");

		Controls.Split_NumberPages__.Hide(!numberPageVisible);
		Controls.Split_Location__.Hide(!stringSplitVisible);
		Controls.Split_String__.Hide(!stringSplitVisible);
		Controls.Split_UseRegex__.Hide(!(stringSplitVisible || areaVisible));
		Controls.Split_CaseSensitive__.Hide(!(stringSplitVisible || (areaVisible && useRegex)));
		Controls.Split_Area__.Hide(!(stringSplitVisible || areaVisible));
		Controls.Split_AreaRegex__.Hide(!(areaVisible && useRegex));
		Controls.Split_AreaMustBeFilled__.Hide(!areaVisible);
		SplitUI.HandleSkipVisibility();
	},

	HandleDivisionMethod: function ()
	{
		SplitUI.SetControlsVisibility();
		SplitUI.HandlePreviewCtrlChange();
	},

	HandleSkipMethod: function ()
	{
		SplitUI.SetControlsVisibility();
		SplitUI.DrawSplittingPreview();
	},

	HandleAreaChange: function ()
	{
		SplitUI.HandleChange();
		if (Tools.GetAreaFromText(this.GetText()))
		{
			return;
		}

		var area = Data.GetArea(this.GetName());
		Controls.Split_Area__.ResetUserArea();
		if (area)
		{
			this.SetValue(area.left + ', ' + area.top + ', ' + area.width + ', ' + area.height);
			SplitUI.DrawAreas();
		}
	},

	HandlePreviewCtrlChange: function ()
	{
		SplitUI.HandleChange();
		SplitUI.DrawSplittingPreview();
	},

	HandleChangeRegex: function ()
	{
		SplitUI.SetControlsVisibility();
		SplitUI.HandleChange();
	},

	HandleChange: function ()
	{
		SplitUI.hasChanged = true;
	},

	MakeSplit: function ()
	{
		var couldSplit = true;
		if (Controls.Skip_Method__.GetValue() === "SKIP_AREA")
		{
			if (Tools.IsExtractable() && !Tools.GetAreaFromText(Controls.Skip_Area__.GetValue()))
			{
				Controls.Skip_Area__.SetError(Tools.translations.formattedAreaExpected);
				couldSplit = false;
			}

			if (!Controls.Skip_Criteria__.GetValue())
			{
				Controls.Skip_Criteria__.SetError(Tools.translations.nonEmptyCriteriaExpected);
				couldSplit = false;
			}
		}

		if (couldSplit && Attach.IsProcessedDocument(0))
		{
			CustomFields.SaveTemporayExtractionData();
			ProcessInstance.Approve("Splitting");
		}
	},

	HideSplittingDatas: function ()
	{
		Controls.Spacer_line3__.Hide(true);
		Controls.Split_Information_pane.Hide(true);
		Controls.HTMLSplittingPreview__.SetHTML("");
	},

	Init: function ()
	{
		// --------------------
		// Here we go !
		// --------------------
		var docType = Controls.SubmittedDocType__.GetValue();
		var isDisableExtraction = Tools.IsExtractionDisabled();
		var isSplitting = docType === "pdf" && !isDisableExtraction;
		if (!isSplitting)
		{
			HandleSubmittedDocType();
			SplitUI.SetControlsVisibility();
			SplitUI.HideSplittingDatas();
		}
		else
		{
			SplitUI.hasChanged = true;

			HandleSubmittedDocType();
			ExtractionUI.HandleConfigurationName();

			SplitUI.SetControlsVisibility();
			SplitUI.DrawSplittingPreview();
			SplitUI.DrawAreas();
			SplitUI.PreviewSplit();

			SplitUI.isOnSelectPageEnabled = true;
		}
		SplitUI.HandleSkipVisibility();
		RefreshHTMLToggles();
	},

	OnQuit: function (goToNext)
	{
		var result = true;
		Controls.Skip_Area__.SetError();
		Controls.Skip_Criteria__.SetError();

		if (Controls.Skip_Method__.GetValue() === "SKIP_AREA")
		{
			if (Tools.IsExtractable() && !Tools.GetAreaFromText(Controls.Skip_Area__.GetValue()))
			{
				Controls.Skip_Area__.SetError(Tools.translations.formattedAreaExpected);
				result = false;
			}

			if (!Controls.Skip_Criteria__.GetValue())
			{
				Controls.Skip_Criteria__.SetError(Tools.translations.nonEmptyCriteriaExpected);
				result = false;
			}
		}

		if (result && goToNext && Attach.IsProcessedDocument(0))
		{
			//First passage with an attachment or if the attachment file changed

			if (SplitUI.hasChanged)
			{
				CustomFields.SaveTemporayExtractionData();
				ProcessInstance.Approve("Splitting_NextPage");
				result = false;
			}
			else if (Variable.GetValueAsString("XmlIndex"))
			{
				CustomFields.SaveTemporayExtractionData();
				ProcessInstance.Approve("Splitting_NextPage_XML");
				result = false;
			}
		}

		var splitMethod = Data.GetValue("Split_DivisionMethod__");
		if ((splitMethod === "ONAREA" || splitMethod === "ONSTRING") && Data.GetValue("Split_UseRegex__") && !CheckRegularExpression("Split_String__"))
		{
			result = false;
		}

		return result;
	}
};

var TitlesUI = {
	Init: function ()
	{
		Lib.DD.DocumentTypeManager.Init(Controls.Document_Type__, null, Data.GetValue("ConfigurationName__"), HandleDocumentType);
		Lib.DD.DocumentTypeManager.FillDocumentTypeControl(null, true);
		Lib.DD.DocumentTypeManager.FillFamilyControl(Controls.Family__);
	}
};

function HandleConfigurationType()
{
	var comboValue = Controls.Configuration_type__.GetValue();
	var isProduction = comboValue === "PROD";
	var isDemonstration = comboValue === "DEMO";
	Controls.Configuration_type_warning_message__.Hide(isProduction);
	Controls.Simulate_delivery__.Hide(isProduction || isDemonstration);
	Controls.Redirect_email_to__.Hide(isProduction);
	Controls.Redirect_sender_notifications__.Hide(isProduction);
	Controls.Redirect_recipient_notifications__.Hide(isProduction);
	var bIsInboundConfig = !IsOutboundConfiguration();
	Controls.Redirect_email_to__.Hide(bIsInboundConfig);
	Controls.Redirect_sender_notifications__.Hide(bIsInboundConfig);
	Controls.Redirect_recipient_notifications__.Hide(bIsInboundConfig);
	Controls.Billing_Info_Billing_Account__.Hide(bIsInboundConfig);
	Controls.Billing_Info__.Hide(bIsInboundConfig);
	Controls.Advanced__.Hide(bIsInboundConfig);
	Controls.ForwardAdditionalAttach__.Hide(bIsInboundConfig);
	Controls.Configuration_template__.Hide(bIsInboundConfig);
	Controls.OutputFilenamePattern__.Hide(bIsInboundConfig);
	Controls.Billing_Info_Cost_Center__.Hide(bIsInboundConfig);
}

function HandleLinkToAnotherDocument(onStart)
{
	var linkToAnotherDocIsChecked = Controls.LinkToAnotherDocument__.IsChecked();

	Controls.BehaviorOnExpiration__.Hide(!linkToAnotherDocIsChecked);
	Controls.MasterDocumentExpirationTime__.Hide(!linkToAnotherDocIsChecked);
	Controls.MasterDocumentExpirationTime__.SetRequired(linkToAnotherDocIsChecked);
	Controls.ArchivedAsLongAsMasterDocument__.Hide(!linkToAnotherDocIsChecked);

	if (!onStart)
	{
		// Check only in case of OnChange event
		Controls.ArchivedAsLongAsMasterDocument__.Check(linkToAnotherDocIsChecked);
	}
}


function HandleSubmittedDocType()
{
	var docType = Controls.SubmittedDocType__.GetValue();
	var isDisableExtraction = Tools.IsExtractionDisabled();
	var isAutolearningConf = Tools.HasTemplateId() || Controls.IsAutolearningConf__.GetValue() === "1";
	var isSplitting = docType === "pdf" && !isDisableExtraction && !isAutolearningConf;

	Controls.Split_DivisionMethod__.SetReadOnly(!isSplitting);
	if (!isSplitting)
	{
		Controls.Split_DivisionMethod__.SetValue("SIMPLE");
		Controls.Skip_Method__.SetValue("SKIP_OFFSET");
		Controls.Split_Offset__.SetValue(0);
	}

	Controls.SplittingRestrictionDescription__.Hide(isSplitting);
	if (!isSplitting && isAutolearningConf)
	{
		Controls.SplittingRestrictionDescription__.SetText("_Splitting is not accessible for autolearning configuration");
	}
	else if (!isSplitting && isDisableExtraction)
	{
		Controls.SplittingRestrictionDescription__.SetText("_Splitting is not accessible when extraction is disabled");
	}
	else if (!isSplitting)
	{
		Controls.SplittingRestrictionDescription__.SetText("_Splitting is restricted to PDF-only extractions");
	}

	SplitUI.HandleSkipVisibility();
	Controls.Split_ShowPreview__.Hide(!isSplitting);
	Controls.Split_ResetPreview__.Hide(!isSplitting);

	var isExtractable = (Tools.IsExtractable() && !isDisableExtraction) && !isAutolearningConf;
	//We force the ReadOnly to the value opposite of the desired one te be sure the button is hidden upon reload
	ExtractionUI.SetReadOnly(!isExtractable);
	Controls.Document_Type_SDAForm__.SetReadOnly(true);

	ConfigurationSelectionUI.HandleConfigurationVisibility();
}


var ConfigurationSelectionUI =
{
	_existingRegexes: [],
	_ocrPdfProcessingChanged: false,

	HandleConfigurationSelectionChange: function ()
	{
		if (Tools.GetAreaFromText(this.GetText()))
		{
			return;
		}

		var area = Data.GetArea(this.GetName());
		var value = this.GetValue();
		if (area)
		{
			var areaValue = Controls.ConfigurationSelection_Area__.GetValue();
			if (!areaValue || this.GetName() === Controls.ConfigurationSelection_Area__.GetName())
			{
				Controls.ConfigurationSelection_Area__.SetValue(area.left + ', ' + area.top + ', ' + area.width + ', ' + area.height);
			}

			var criteriaValue = Controls.ConfigurationSelection_Criteria__.GetValue();
			if (!criteriaValue || this.GetName() === Controls.ConfigurationSelection_Criteria__.GetName())
			{
				Controls.ConfigurationSelection_Criteria__.SetValue(value);
			}

			Controls.PreviewPanel.ClearHighlights();
			area.page++;
			Controls.PreviewPanel.Highlight(area);
		}
	},

	HandleConfigurationSelectionAreaTextChange: function ()
	{
		Controls.PreviewPanel.ClearHighlights();
		var area = Tools.GetAreaFromText(Controls.ConfigurationSelection_Area__.GetText());
		if (area)
		{
			area.page = 1;
			Controls.PreviewPanel.Highlight(area);
		}
	},

	HandleOutboundConfigurationVisibility: function ()
	{
		const isConfigurationPanelInStep = Sys.Wizard.Wizard.steps[Sys.Wizard.Wizard.currentStep].panels.indexOf(Controls.Activate_Recognition_pane) !== -1;
		const enableConfigurationSelection = Controls.ConfigurationSelection_Enable__.IsChecked();
		const displayConfigurationSelectionPane = enableConfigurationSelection && isConfigurationPanelInStep;

		Controls.Doctype_Recognition_Keywords_Parameters_pane.Hide(true);
		Controls.Gpt_Document_Recognition_pane.Hide(true);
		Controls.Recognition_Match_Layout_pane.Hide(!displayConfigurationSelectionPane);
		Controls.Recognition_Match_Filename_pane.Hide(!displayConfigurationSelectionPane);
		Controls.Recognition_Match_String_pane.Hide(!displayConfigurationSelectionPane);
		Controls.Info_NoCriteria_Configuration__.Hide(enableConfigurationSelection);

		Controls.Recognition_Match_Layout_Data_pane.Hide(true);

		if (!enableConfigurationSelection)
		{
			Controls.MatchDocumentLayout__.Check(false);
			Controls.TemplateIdList__.SetValue("[]");
			Controls.MatchFilenameRegex__.SetValue(false);
			Controls.FileNameRegEx_CaseSensitive__.Check(false);
			Controls.Filename_regular_expression__.SetValue("");
			Controls.ConfigurationSelection_Area__.SetValue("");
			Controls.ConfigurationSelection_Criteria__.SetValue("");
			Controls.ConfigurationSelection_CriteriaIsRegex__.Check(false);
			Controls.ConfigurationSelection_CriteriaMatchCase__.Check(false);
		}
		else if (Controls.DisableExtraction__.IsChecked() && !Controls.MatchFilenameRegex__.GetValue())
		{
			Controls.MatchFilenameRegex__.SetValue(true);
		}

		if (displayConfigurationSelectionPane)
		{
			var useFileNameRegex = Controls.MatchFilenameRegex__.GetValue();
			var useStringInDocument = Controls.MatchStringWithinDocument__.GetValue();
			var isExtractable = Tools.IsExtractable() && !Tools.IsExtractionDisabled();

			Controls.Recognition_Match_Filename_Data_pane.Hide(!useFileNameRegex);
			Controls.Recognition_Match_String_Data_pane.Hide(!useStringInDocument);

			if (useStringInDocument)
			{
				Controls.ConfigurationSelection_Criteria__.Hide(false);
				Controls.ConfigurationSelection_CriteriaIsRegex__.Hide(false);
				Controls.ConfigurationSelection_CriteriaMatchCase__.Hide(false);
				Controls.ConfigurationSelection_Path__.Hide(isExtractable);
				Controls.ConfigurationSelection_Area__.Hide(!isExtractable);
			}

			Controls.Filename_regular_expression__.SetRequired(useFileNameRegex);
			Controls.ConfigurationSelection_Area__.SetRequired(useStringInDocument && isExtractable);
			Controls.ConfigurationSelection_Path__.SetRequired(useStringInDocument && !isExtractable);
			Controls.ConfigurationSelection_Criteria__.SetRequired(useStringInDocument);
		}
		else if (!enableConfigurationSelection)
		{
			Controls.Filename_regular_expression__.SetRequired(false);
			Controls.ConfigurationSelection_Area__.SetRequired(false);
			Controls.ConfigurationSelection_Path__.SetRequired(false);
			Controls.ConfigurationSelection_Criteria__.SetRequired(false);

			Controls.Recognition_Match_Filename_Data_pane.Hide(true);
			Controls.Recognition_Match_String_Data_pane.Hide(true);
		}
		else
		{
			Controls.Recognition_Match_Filename_Data_pane.Hide(true);
			Controls.Recognition_Match_String_Data_pane.Hide(true);
		}
	},

	HandleKeywordsConfigurationVisibility: function ()
	{
		const showKeywordsRecognitionParameters = Data.GetValue("ActivateKeywordsDoctypeRecognition__");
		Controls.DoctypeRecognitionKeywords__.Hide(!showKeywordsRecognitionParameters);
		Controls.DoctypeRecognitionSearchDocumentOptions__.Hide(!showKeywordsRecognitionParameters);
		Controls.DoctypeRecognitionSearchEmailSubject__.Hide(!showKeywordsRecognitionParameters);
		Controls.DoctypeRecognitionSearchEmailBody__.Hide(!showKeywordsRecognitionParameters);
	},

	HandleConfigurationVisibility: function ()
	{
		if (IsOutboundConfiguration())
		{
			ConfigurationSelectionUI.HandleOutboundConfigurationVisibility();
		}
		else
		{
			Controls.Activate_Recognition_pane.Hide(true);
			Controls.Recognition_Match_Layout_pane.Hide(true);
			Controls.Recognition_Match_Filename_pane.Hide(true);
			Controls.Recognition_Match_String_pane.Hide(true);
			Controls.Recognition_Match_String_Data_pane.Hide(true);

			ConfigurationSelectionUI.HandleKeywordsConfigurationVisibility();
		}
	},

	SetConfigurationSelection: function ()
	{
		var isDisableExtraction = Controls.DisableExtraction__.IsChecked();

		Controls.MatchStringWithinDocument__.SetReadOnly(isDisableExtraction);
		Controls.MatchFilenameRegex__.SetReadOnly(isDisableExtraction);
		Controls.MatchDocumentLayout__.SetReadOnly(isDisableExtraction);

		if (isDisableExtraction)
		{
			Controls.Split_DivisionMethod__.SetValue("SIMPLE");

			if (Controls.ConfigurationSelection_Enable__.IsChecked())
			{
				Controls.MatchDocumentLayout__.SetValue(false);
				Controls.MatchFilenameRegex__.SetValue(false);
				Controls.MatchStringWithinDocument__.SetValue(false);
			}
		}
		else
		{
			Controls.Recognition_Match_Filename_Data_pane.Hide(!Controls.MatchFilenameRegex__.IsChecked());
			Controls.Recognition_Match_String_Data_pane.Hide(!Controls.MatchStringWithinDocument__.IsChecked());
		}

		ConfigurationSelectionUI.HandleConfigurationVisibility();

		// For set or erase document duplication error when change recognition criteria
		ConfigurationSelectionUI.CheckUniqueDocumentType();
	},

	HandleFileNameRegExSelect: function ()
	{
		ConfigurationSelectionUI.SetConfigurationSelection();
	},

	HandleUseTextInsideSelect: function ()
	{
		ConfigurationSelectionUI.SetConfigurationSelection();
	},

	HandleAutolearningSelect: function ()
	{
		ConfigurationSelectionUI.SetConfigurationSelection();
	},

	Init: function ()
	{
		ConfigurationSelectionUI.HandleConfigurationVisibility();
	},

	OnQuit: function ()
	{
		var result = true;
		Controls.ConfigurationSelection_Area__.SetError();
		Controls.ConfigurationSelection_Path__.SetError();
		Controls.ConfigurationSelection_Criteria__.SetError();
		Controls.Filename_regular_expression__.SetError();

		if (Controls.ConfigurationSelection_Enable__.IsChecked() && Controls.MatchStringWithinDocument__.IsChecked() && IsOutboundConfiguration())
		{
			if (Tools.IsExtractable() && !Tools.GetAreaFromText(Controls.ConfigurationSelection_Area__.GetValue()))
			{
				Controls.ConfigurationSelection_Area__.SetError(Tools.translations.formattedAreaExpected);
				result = false;
			}
			else if (!Tools.IsExtractable() && !Controls.ConfigurationSelection_Path__.GetValue())
			{
				Controls.ConfigurationSelection_Path__.SetError(Tools.translations.formattedXPathExpected);
				result = false;
			}

			if (!Controls.ConfigurationSelection_Criteria__.GetValue())
			{
				Controls.ConfigurationSelection_Criteria__.SetError(Tools.translations.nonEmptyCriteriaExpected);
				result = false;
			}
		}

		if (Controls.ConfigurationSelection_Enable__.IsChecked())
		{
			if (Controls.MatchFilenameRegex__.IsChecked() && IsOutboundConfiguration())
			{
				if (!Controls.Filename_regular_expression__.GetValue())
				{
					Controls.Filename_regular_expression__.SetError(Tools.translations.nonEmptyCriteriaExpected);
					result = false;
				}
				else if (!CheckRegularExpression("Filename_regular_expression__"))
				{
					result = false;
				}
			}

			if (Controls.MatchStringWithinDocument__.IsChecked() && Controls.ConfigurationSelection_CriteriaIsRegex__.IsChecked() &&
				!CheckRegularExpression("ConfigurationSelection_Criteria__"))
			{
				result = false;
			}
		}

		return result;
	},

	CheckUniqueConfigurationName: function ()
	{
		try
		{
			var existingConfigurations = JSON.parse(Variable.GetValueAsString("ExistingConfigurations")) || [];
			var confName = Data.GetValue("ConfigurationName__");
			if (!confName)
			{
				Controls.ConfigurationName__.SetError(Tools.translations.configurationNameExpected);
				return false;
			}

			for (var i = 0; i < existingConfigurations.length; i++)
			{
				if (existingConfigurations[i].name.toUpperCase() === confName.toUpperCase())
				{
					Controls.ConfigurationName__.SetError(Tools.translations.configurationExisting);
					return false;
				}
			}
		}
		catch (e)
		{
			Log.Error("An error occurred during check of duplicated configuration name.");
		}

		return true;
	},

	CheckUniqueFilenameRegExp: function ()
	{
		var existingRegexes = this._existingRegexes || [];
		var useFilenameRegex = Data.GetValue("ConfigurationSelection_Enable__") && Data.GetValue("MatchFilenameRegex__");
		var filenameRegex = Data.GetValue("Filename_regular_expression__");
		if (useFilenameRegex && filenameRegex && ContainsInArray(existingRegexes, filenameRegex))
		{
			Controls.Filename_regular_expression__.SetError(Tools.translations.filenameRegexExisting);
			return false;
		}

		return true;
	},

	CheckUniqueDocumentType: function ()
	{
		if (Controls.ConfigurationSelection_Enable__.IsChecked() && Controls.MatchDocumentLayout__.IsChecked())
		{
			try
			{
				var existingDocumentTypeForAL = JSON.parse(Variable.GetValueAsString("ExistingDocumentTypeForAL")) || [];
				if (ContainsInArray(existingDocumentTypeForAL, Controls.Document_Type__.GetValue()))
				{
					Controls.Document_Type__.SetError(Tools.translations.documentTypeExisting);
					Variable.SetValueAsString("DocumentTypeNotUnique", "1");
				}
				else
				{
					Variable.SetValueAsString("DocumentTypeNotUnique", "0");
				}
			}
			catch (e)
			{
				Log.Error("An error occurred during check of duplicated document type.");
			}
		}
		else if (Controls.Document_Type__.GetValue())
		{
			Controls.Document_Type__.SetError(null);
		}
	}
};

function HandleFormattingPane()
{
	var addBackgroundChecked = Controls.Add_backgrounds__.IsChecked();
	Controls.Use_a_specific_background_for_the_first_page__.Hide(!addBackgroundChecked);
	Controls.Alternate_background_on_front_and_back_pages__.Hide(!addBackgroundChecked);
	Controls.FrontPage__.Hide(!addBackgroundChecked);
	Controls.HTML_FrontPage__.Hide(!addBackgroundChecked);

	var firstPageVisible = Controls.Use_a_specific_background_for_the_first_page__.IsVisible();
	var firstPageChecked = Controls.Use_a_specific_background_for_the_first_page__.IsChecked();
	Controls.FirstPage__.Hide(!firstPageVisible || !firstPageChecked);
	Controls.HTML_FirstPage__.Hide(!firstPageVisible || !firstPageChecked);

	var alternatePageVisible = Controls.Alternate_background_on_front_and_back_pages__.IsVisible();
	var alternatePageChecked = Controls.Alternate_background_on_front_and_back_pages__.IsChecked();
	Controls.BackPage__.Hide(!alternatePageVisible || !alternatePageChecked);
	Controls.HTML_BackPage__.Hide(!alternatePageVisible || !alternatePageChecked);

	var termsAndConditionsChecked = Controls.Add_T_C__.IsChecked();
	Controls.Terms___conditions_position__.Hide(!termsAndConditionsChecked);
	Controls.Terms___conditions_file__.Hide(!termsAndConditionsChecked);
	Controls.HTML_TC__.Hide(!termsAndConditionsChecked);

	var tcOnFirstPage = Controls.Terms___conditions_position__.IsSelected("FIRST");
	var tcOnEachPage = Controls.Terms___conditions_position__.IsSelected("EACH");
	var tcOnLastPage = Controls.Terms___conditions_position__.IsSelected("LAST");

	DrawFormattingPreview(firstPageChecked, alternatePageChecked, termsAndConditionsChecked, tcOnFirstPage, tcOnEachPage, tcOnLastPage);
	Controls.HTML_BackgroundPreview__.Hide(!addBackgroundChecked && !termsAndConditionsChecked);
}

function HandleAutoCreateRecipients()
{
	var checked = Controls.AutoCreateRecipients__.IsChecked();
	Controls.Routing_advanced_pane.Hide(!checked);
	HandleDefaultDeliveryMethod();
}

function HandleGroupingMOD()
{
	var checked = Controls.MOD_Option_Grouping__.IsChecked();
	Controls.DescMODGrouping__.Hide(!checked);
	Controls.DeferredTimeAfterValidation__.Hide(!checked);
}

function DrawFormattingPreview(firstPageChecked, alternatePageChecked, termsAndConditionsChecked, tcOnFirstPage, tcOnEachPage, tcOnLastPage)
{
	var html = '<div class="preview">';
	for (var i = 0; i < 6; i++)
	{
		if (i === 0)
		{
			html += firstPageChecked ?
				'<span class="first"><i class="fa fa-file-picture-o"></i></span>' :
				'<span class="front"><i class="fa fa-file-text"></i></span>';

			if (termsAndConditionsChecked && !tcOnLastPage)
			{
				html += '<span class="tc"><i class="fa fa-file-text"></i></span>';
			}
		}
		else
		{
			var alternateOdd = i % 2 !== 0;
			var needAlternate = alternatePageChecked && alternateOdd;

			html += needAlternate ?
				'<span class="back"><i class="fa fa-file-text"></i></span>' :
				'<span class="front"><i class="fa fa-file-text"></i></span>';

			if (termsAndConditionsChecked && ((tcOnEachPage || tcOnLastPage) && i === 5))
			{
				html += '<span class="tc"><i class="fa fa-file-text"></i></span>';
			}
		}
	}
	html += "</div>";
	Controls.HTML_BackgroundPreview__.SetHTML(html);
}

function HandleDefaultDeliveryMethod()
{
	//These parameters will be used to determine which delivery methods are authorized only for recipients created on the fly
	var deliveryMethodReadOnlyBehaviour = {
		AllowMethodMOD__: "DefaultDelivery_MOD",
		AllowMethodSM__: "DefaultDelivery_EMAIL",
		AllowMethodPORTAL__: "DefaultDelivery_PORTAL",
		AllowMethodFAX__: "DefaultDelivery_FAX"
	};

	for (var controlName in deliveryMethodReadOnlyBehaviour)
	{
		var activationValue = deliveryMethodReadOnlyBehaviour[controlName];
		var control = Controls[controlName];
		var selected = Controls.DefaultDeliveryMethod__.IsSelected(activationValue);

		if (selected)
		{
			control.Check(true);
		}

		control.SetReadOnly(selected);
	}
}

function HandleDisableExtraction()
{
	var isDisableExtraction = Controls.DisableExtraction__.IsChecked();
	Controls.OCR_Pdf_Processing__.SetReadOnly(isDisableExtraction);
	if (isDisableExtraction)
	{
		Controls.Split_DivisionMethod__.SetValue("SIMPLE");
	}

	ConfigurationSelectionUI.SetConfigurationSelection();
}

function HandleOCRPdfProcessing()
{
	var selectedPdfProcessing = Controls.OCR_Pdf_Processing__.GetValue();
	if (selectedPdfProcessing !== "default")
	{
		var ocrOptions = "{ \"pdf-processing\": \"" + selectedPdfProcessing + "\" }";
		Data.SetValue("OCRJsonOverrideSettings__", ocrOptions);
		// external variable allow the wizard to process correctly preview
		Variable.SetValueAsString("tableParameters", "{ \"ocrjsonoverridesettings\":" + JSON.stringify(ocrOptions) + "}");
	}
	else
	{
		Data.SetValue("OCRJsonOverrideSettings__", "");
		Variable.SetValueAsString("tableParameters", null);
	}
	ConfigurationSelectionUI._ocrPdfProcessingChanged = true;
	SplitUI.ResetPreview();
}

function HandleDocumentType()
{
	ConfigurationSelectionUI.CheckUniqueDocumentType();
	Lib.DD_Client.VirtualFieldsManager.Wizard.UnloadFields("Document_Type__", Data.GetValue("Document_Type__"));
}

var CustomFields = {
	_temporaryLoadChanged: false,
	Init: function ()
	{
		this.GetSenderFormData(this.SenderFormDataRetrieved);
	},

	GetSenderFormData: function (callback)
	{
		Controls.Save.Wait(true);
		Query.HTTPQuery({
			type: "internalHttpQuery",
			processName: "DD - SenderForm",
			callback: callback
		});
	},

	SenderFormDataRetrieved: function (response)
	{
		var fieldsNode = CustomFields.GetSenderFormFieldsNode(response);
		var layout = CustomFields.GetSenderFormLayout(response);
		var customFieldsList = CustomFields.BuildCustomFieldsList(fieldsNode, layout);

		if (customFieldsList)
		{
			Lib.DD_Client.VirtualFieldsManager.Wizard.Init({
				btnAdd: Controls.Button_AddField__,
				btnModify: Controls.Button_ModifyField__,
				btnRemove: Controls.Button_RemoveField__,
				btnConfigureFieldsMapping: Controls.ConfigureFieldMapping__,
				defaultActivationField: { fieldName: "Document_Type__", fieldValue: Data.GetValue("Document_Type__") },
				commonActivationField: { fieldName: "Family__", fieldValue: Data.GetValue("Family__") },
				btnReorder: Controls.Button_ReorderFields__,
				paneTargetControl: Controls.Document_data_pane,
				customFieldsList: customFieldsList,
				isExtractionFriendly: IsOutboundConfiguration()
			});
		}
		Controls.Save.Wait(false);
	},
	GetSenderFormLayout: function (response)
	{
		var layout = {};
		if (!response)
		{
			return layout;
		}

		var json = null;
		try
		{
			json = JSON.parse(response.responseText);
		}
		catch (e)
		{ }

		if (!json)
		{
			return layout;
		}

		if (!json.download || !json.download.gui)
		{
			return layout;
		}

		return json.download.gui.layout;
	},
	GetSenderFormFieldsNode: function (response)
	{
		var fields = {};
		if (!response)
		{
			return fields;
		}
		var json = null;
		try
		{
			json = JSON.parse(response.responseText);
		}
		catch (e)
		{ }

		if (!json)
		{
			return fields;
		}

		if (!json.download || !json.download.data)
		{
			return fields;
		}

		if (!json.download.data.process || !json.download.data.process.fields)
		{
			return fields;
		}

		return json.download.data.process.fields;
	},

	BuildCustomFieldsList: function (fieldsNode, jsonLayout)
	{
		var customFieldsList = [];

		var temporaryExtractionData = null;
		try
		{
			var temporaryExtractionDataStr = Variable.GetValueAsString("TemporaryExtractionData");
			if (temporaryExtractionDataStr)
			{
				temporaryExtractionData = JSON.parse(temporaryExtractionDataStr);
			}
		}
		catch (e)
		{
			Log.Warning("Failed to reload TemporaryExtractionData: " + e);
		}

		var customField, layoutField, additionalfieldinfo, activationCondition, extraction, fieldData, dbData;
		for (var fieldName in fieldsNode)
		{
			if (fieldsNode.hasOwnProperty(fieldName) && Lib.DD_Client.VirtualFieldsManager.Wizard.IsActiveCustomFieldNode(fieldsNode[fieldName]))
			{
				customField = fieldsNode[fieldName];
				layoutField = this.GetFieldFromLayout(customField._name, jsonLayout);
				additionalfieldinfo = this.GetExtendedData(customField, "additionalfieldinfo");
				activationCondition = this.GetActivationCondition(customField);
				extraction = this.GetExtraction(customField, temporaryExtractionData);
				fieldData = this.GetExtendedData(customField, "field");
				dbData = this.GetExtendedData(customField, "db");

				customFieldsList.push({
					name: customField._name,
					type: layoutField.type,
					options: layoutField.options,
					label: customField._label,
					additionalFieldInfo: customField.additionalfieldinfo,
					activationCondition: activationCondition,
					mappedTo: additionalfieldinfo.mappedTo,
					extraction: extraction,
					field: fieldData,
					db: dbData
				});
			}
		}
		return customFieldsList;
	},

	GetFieldFromLayout: function (fieldName, jsonLayout)
	{
		var mainFieldsManager = this.FindLayoutFieldsManager(jsonLayout['*'].Screen['*'], "Main_pane");
		if (mainFieldsManager['*'].Grid['*'][fieldName])
		{
			return mainFieldsManager['*'].Grid['*'][fieldName];
		}

		return {};
	},

	FindLayoutFieldsManager: function (container, panelName)
	{
		for (var componentName in container)
		{
			if (componentName === panelName)
			{
				if (container[componentName].type === "PanelData" &&
					container[componentName]["*"] && container[componentName]["*"].FieldsManager)
				{
					return container[componentName]["*"].FieldsManager;
				}
			}
			else
			{
				var component = container[componentName];
				if (component["*"])
				{
					var fieldsManager = this.FindLayoutFieldsManager(component["*"], panelName);
					if (fieldsManager !== null)
					{
						return fieldsManager;
					}
				}
			}
		}
		return null;
	},
	GetExtraction: function (fieldNode, temporaryExtractionData)
	{
		try
		{
			var extraction = fieldNode.extraction;
			if (extraction && extraction.extractiondata && extraction.extractiondata._v)
			{
				var o = JSON.parse(extraction.extractiondata._v);
				var output = {
					"extractionData": extraction.extractiondata._v
				};

				if (temporaryExtractionData && temporaryExtractionData[fieldNode._name])
				{
					output.currentExtractionData = temporaryExtractionData[fieldNode._name];
					if (JSON.stringify(output.currentExtractionData) != JSON.stringify(o[Data.GetValue("ConfigurationName__")] || { "method": "none" }))
					{
						this._temporaryLoadChanged = true;
					}
				}
				else if (o && Data.GetValue("ConfigurationName__"))
				{
					output.currentExtractionData = o[Data.GetValue("ConfigurationName__")] || { "method": "none" };
				}
				return output;
			}
		}
		catch (err)
		{
			Log.Error("Error while getting extraction of " + fieldNode._name);
		}
		return null;
	},

	GetActivationCondition: function (fieldNode)
	{
		try
		{
			var info = fieldNode.additionalfieldinfo;
			if (info && info.activationcondition && info.activationcondition._v)
			{
				var activationCondition = JSON.parse(info.activationcondition._v);
				if (activationCondition && Sys.Helpers.IsArray(activationCondition.values))
				{
					return activationCondition;
				}
			}
		}
		catch (err)
		{
			Log.Error("Error while parsing activationCondition of " + fieldNode._name);
		}
		//Return a default activation condition
		return {
			"field": "Family__",
			"values": [""]
		};
	},

	GetExtendedData: function (fieldNode, node)
	{
		var properties = {};
		var fieldProperties = fieldNode[node];
		var label, value;
		if (fieldProperties)
		{
			for (var prop in fieldProperties)
			{
				label = fieldProperties[prop]._label || prop;
				if (fieldProperties[prop]._v)
				{
					value = fieldProperties[prop]._v;
					if (fieldProperties[prop]._type && fieldProperties[prop]._type === "Number")
					{
						value = Number(value);
					}
					properties[label] = value;
				}
			}
		}
		return properties;
	},

	ResetErrors: function ()
	{
		Lib.DD_Client.VirtualFieldsManager.Wizard.ResetCollectionError();
	},

	SerializeFields: function (disableSpiner)
	{
		Controls.Save.Wait(true);

		var additionalFieldsChanges = "";
		if (this._temporaryLoadChanged || Lib.DD_Client.VirtualFieldsManager.Wizard.IsFieldsUpdateDetected())
		{
			additionalFieldsChanges = "triggerUpdate";
		}
		Variable.SetValueAsString("AdditionalFieldsChangeDetection", additionalFieldsChanges);

		var customFieldsList = Lib.DD_Client.VirtualFieldsManager.Wizard.GetSerializedCollection();
		if (!Lib.DD_Client.VirtualFieldsManager.Wizard.IsValidCollection())
		{
			Controls.Save.Wait(false);
			this.GoToCustomFieldPane();
			throw new Error("Missing properties on custom fields list");
		}

		Variable.SetValueAsString("CustomFieldsList__", JSON.stringify(customFieldsList));
		if (disableSpiner)
		{
			Controls.Save.Wait(false);
		}
		ProcessInstance.Approve("Save");
	},

	GoToCustomFieldPane: function ()
	{
		var stepName = "Inbound_extraction_pane";
		if (IsOutboundConfiguration())
		{
			stepName = "Outbound_extraction_pane";
		}
		var stepToGo = Sys.Wizard.Wizard.GetPanelIndex(stepName);
		if (Sys.Wizard.Wizard.currentStep != stepToGo)
		{
			Sys.Wizard.Wizard.currentStep = stepToGo;
			Sys.Wizard.Wizard.ShowStep();
		}
	},

	SaveTemporayExtractionData: function ()
	{
		var temporaryExtractionData = Lib.DD_Client.VirtualFieldsManager.Wizard.GetCurrentExtractionDataFromCustomFields();
		if (Object.keys(temporaryExtractionData).length > 0)
		{
			Variable.SetValueAsString("TemporaryExtractionData", JSON.stringify(temporaryExtractionData));
		}
	}
};

function SetEnableConversationButtonVisibility()
{
	// Hide conversation enabling button if the family isn't 'Customer Inquiries' or 'Vendor Inquiries'
	var shouldHideConversation = !(Lib.DD.Common.CheckFeatureSet("Customer Inquiries") || Lib.DD.Common.CheckFeatureSet("Vendor Inquiries"));

	Controls.Enable_conversation__.Hide(shouldHideConversation);
	// Disable conversation
	if (shouldHideConversation)
	{
		Controls.Enable_conversation__.SetValue(false);
	}
	Controls.Enable_conversation__.OnChange(true);
}

function DeclareHandler()
{
	Controls.AutoCreateRecipients__.OnChange = HandleAutoCreateRecipients;
	Controls.DefaultDeliveryMethod__.OnChange = HandleDefaultDeliveryMethod;
	Controls.Configuration_type__.OnChange = HandleConfigurationType;
	Controls.SubmittedDocType__.OnChange = HandleSubmittedDocType;
	Controls.ConfigurationName__.OnChange = ExtractionUI.HandleConfigurationName;

	Controls.LinkToAnotherDocument__.OnChange = HandleLinkToAnotherDocument;

	Controls.Add_backgrounds__.OnChange = HandleFormattingPane;
	Controls.Use_a_specific_background_for_the_first_page__.OnChange = HandleFormattingPane;
	Controls.Alternate_background_on_front_and_back_pages__.OnChange = HandleFormattingPane;
	Controls.Add_T_C__.OnChange = HandleFormattingPane;
	Controls.Terms___conditions_position__.OnChange = HandleFormattingPane;

	Controls.DocumentsPanel.OnDocumentDeleted = SplitUI.ResetPreview;
	Controls.MOD_Option_Grouping__.OnChange = HandleGroupingMOD;
	Controls.DisableExtraction__.OnChange = HandleDisableExtraction;
	Controls.OCR_Pdf_Processing__.OnChange = HandleOCRPdfProcessing;

	Controls.IsArchiveAllowed__.OnChange = OnArchiveAllowedChange;
	Controls.IsEmailAllowed__.OnChange = OnEmailAllowedChange;
	Controls.IsMODAllowed__.OnChange = OnMODAllowedChange;
	Controls.IsPortalAllowed__.OnChange = OnPortalAllowedChange;
	Controls.IsOtherAllowed__.OnChange = OnOtherAllowedChange;
	Controls.IsFaxAllowed__.OnChange = OnFaxAllowedChange;
	Controls.IsConversationAllowed__.OnChange = OnConversationAllowedChange;
	Controls.Enable_conversation__.OnChange = OnConversationEnabledChange;
	Controls.EnableAIReplySuggestion__.OnChange = OnEnableAIReplySuggestionChange;

	if (Controls.AIReplyAllowedKBCollections__)
	{
		Controls.AIReplyAllowedKBCollections__.OnBrowse = OnAIReplyAllowedKBCollectionsBrowse;
	}

	Controls.IsApplicationProcessAllowed__.OnChange = OnApplicationProcessAllowedChange;
	Controls.ProcessSelected__.OnChange = FillDefaultRoutingMethodComboWithApplicationProcess;
	Controls.IsCOPAllowed__.OnChange = HideCustomerOrderProcessIfNotChecked;

	Controls.Split_Location__.OnChange = SplitUI.HandlePreviewCtrlChange;
	Controls.Split_DivisionMethod__.OnChange = SplitUI.HandleDivisionMethod;
	Controls.Skip_Method__.OnChange = SplitUI.HandleSkipMethod;
	Controls.Skip_Area__.OnChange = SplitUI.HandleSkipArea;
	Controls.Split_Pages_Count__.OnChange = SplitUI.HandleChange;
	Controls.Split_Offset__.OnChange = SplitUI.HandlePreviewCtrlChange;
	Controls.Split_String__.OnChange = SplitUI.HandleChange;
	Controls.Split_UseRegex__.OnChange = SplitUI.HandleChangeRegex;
	Controls.Split_CaseSensitive__.OnChange = SplitUI.HandleChange;
	Controls.Split_Area__.OnChange = SplitUI.HandleAreaChange;
	Controls.Split_Area__.OnTextChange = SplitUI.DrawAreas;
	Controls.Split_ShowPreview__.OnClick = SplitUI.MakeSplit;
	Controls.Split_ResetPreview__.OnClick = SplitUI.ResetPreview;
	Controls.PreviewPanel.OnSelectPage = SplitUI.OnPreviewSelectPage;

	Controls.ConfigurationSelection_Enable__.OnChange = ConfigurationSelectionUI.HandleConfigurationVisibility;
	Controls.MatchFilenameRegex__.OnChange = ConfigurationSelectionUI.HandleFileNameRegExSelect;
	Controls.MatchStringWithinDocument__.OnChange = ConfigurationSelectionUI.HandleUseTextInsideSelect;
	Controls.MatchDocumentLayout__.OnChange = ConfigurationSelectionUI.HandleAutolearningSelect;
	Controls.ConfigurationSelection_Area__.OnTextChange = ConfigurationSelectionUI.HandleConfigurationSelectionAreaTextChange;
	Controls.ConfigurationSelection_Area__.OnChange = ConfigurationSelectionUI.HandleConfigurationSelectionChange;
	Controls.ConfigurationSelection_Area__.OnFocus = ConfigurationSelectionUI.HandleConfigurationSelectionAreaTextChange;
	Controls.ConfigurationSelection_Criteria__.OnChange = ConfigurationSelectionUI.HandleConfigurationSelectionChange;

	Controls.Show_comment__.OnChange = HandleExtractionFields;
	Controls.Show_recipient_id__.OnChange = HandleExtractionFields;
	Controls.Show_document_number__.OnChange = HandleExtractionFields;
	Controls.Show_document_priority__.OnChange = HandleExtractionFields;

	Controls.DisplayReopenButton__.OnChange = UpdateReopenButtonWarning;

	Controls.ActivateKeywordsDoctypeRecognition__.OnChange = ConfigurationSelectionUI.HandleKeywordsConfigurationVisibility;

	Controls.Routing__.OnChange = function ()
	{
		Sys.Wizard.Wizard.currentStep = 0;
		Sys.Wizard.Wizard.ShowStep();
		Sys.Wizard.Wizard.ApplyStartCallback(Sys.Wizard.Wizard.steps[0]);
		var bIsOutboundConfiguration = IsOutboundConfiguration();
		Lib.DD_Client.DisplayPreviewPanel(bIsOutboundConfiguration);
		Controls.Show_comment__.Check(true);
		Controls.Show_recipient_id__.Check(bIsOutboundConfiguration);
		Controls.Show_document_number__.Check(bIsOutboundConfiguration);
		HandleExtractionFields();
	};

	Controls.DefaultDeliveryEmail__.OnChange = function ()
	{
		var newValue = Controls.DefaultDeliveryEmail__.GetValue();
		if (Lib.DD.Common.IsEmailAddressesStringValid(newValue))
		{
			Data.SetError("DefaultDeliveryEmail__", "");
		}
		else
		{
			Data.SetError("DefaultDeliveryEmail__", "Email format incorrect");
		}
	};

	Controls.Save.OnClick = function ()
	{
		try
		{
			//When Saving, executes the onQuit function of the current step for validation
			if (typeof Sys.Wizard.Wizard.steps[Sys.Wizard.Wizard.currentStep].onQuit !== 'function' || Sys.Wizard.Wizard.steps[Sys.Wizard.Wizard.currentStep].onQuit())
			{
				// Errors on custom fields are triggered during serialization
				CustomFields.ResetErrors();

				//Check if form has errors before approval
				if (CheckFormBeforeApproval())
				{
					// CustomFields.SerializeFields handle the process Approve
					if (Query.IsPendingRequest())
					{
						Query.NotifyOnCurrentRequestsDone(CustomFields.SerializeFields);
					}
					else
					{
						CustomFields.SerializeFields(false);
					}
				}
			}
		}
		catch (err)
		{
			Log.Error("Save error on checks: " + err);
		}

		return false;
	};
	RefreshHTMLToggles();

	Controls.Activate_vector_store__.OnChange = HandleVectorStoreFieldsVisibility;
	Controls.Data_To_Store__.OnChange = HandleVectorStoreFieldsVisibility;
}

function RefreshHTMLToggles()
{
	Sys.Wizard.Tools.HandleHTMLToggle(Controls.MoreExtractionOptions__, Controls.Advanced_extraction_pane, Tools.translations.moreOptions);
	Sys.Wizard.Tools.HandleHTMLToggle(Controls.MoreSubmissionOptions__, Controls.General_advanced_options_pane, Tools.translations.moreOptions);
	Sys.Wizard.Tools.HandleHTMLToggle(Controls.MoreFormattingOptions__, Controls.Advanced_formatting_pane, Tools.translations.moreOptions);
	Sys.Wizard.Tools.HandleHTMLToggle(Controls.MoreValidationOptions__, Controls.Advanced_validation_pane, Tools.translations.moreOptions);
	Sys.Wizard.Tools.HandleHTMLToggle(Controls.MoreMODOptions__, Controls.Advanced_mod_options, Tools.translations.moreOptions);
	Sys.Wizard.Tools.HandleHTMLToggle(Controls.MorePortalOptions__, Controls.Advanced_portal_options, Tools.translations.moreOptions);
}

function CheckFormBeforeApproval()
{
	if (Controls.DefaultDelivery__.GetError())
	{
		Sys.Wizard.Wizard.currentStep = Sys.Wizard.Wizard.GetPanelIndex("Delivery_pane");
		Sys.Wizard.Wizard.ShowStep();
		Sys.Wizard.Wizard.ApplyStartCallback(Sys.Wizard.Wizard.steps[Sys.Wizard.Wizard.currentStep]);
		Controls.DefaultDelivery__.Focus();
		return false;
	}

	if (Process.ShowFirstError())
	{
		return false;
	}
	return true;
}

function HandleExtractionFields()
{
	Controls.Comment__.Hide(!Controls.Show_comment__.IsChecked());
	Controls.Recipient_ID__.Hide(!Controls.Show_recipient_id__.IsChecked());
	Controls.Document_ID__.Hide(!Controls.Show_document_number__.IsChecked());
	Controls.Document_Priority__.Hide(!Controls.Show_document_priority__.IsChecked());
}

function UpdateReopenButtonWarning()
{
	UpdateDeliveryMethodWarning();
	const reopenButtonControl = Controls.DisplayReopenButton__;
	const isReopenButtonChecked = reopenButtonControl.IsChecked();
	const areSeveralDeliveryOptionsAvailable = Controls.DefaultDelivery__.GetAvailableValues().length > 1;
	if (isReopenButtonChecked && (!Data.GetValue("IsArchiveAllowed__") || areSeveralDeliveryOptionsAvailable))
	{
		reopenButtonControl.SetWarning(Language.Translate("_ReopenButtonWarning"));
	}
	else
	{
		reopenButtonControl.SetWarning("");
	}
}

function UpdateDeliveryMethodWarning()
{
	const isSelectionCompatible = !Controls.DisplayReopenButton__.IsChecked() || (Controls.DefaultDelivery__.GetAvailableValues().length === 1 && Controls.IsArchiveAllowed__.IsChecked());
	Controls.Routing_method_warning_message__.Hide(isSelectionCompatible);
}

function shouldInitNewConfiguration()
{
	return Sys.Wizard.Wizard.currentStep === 0 && !Variable.GetValueAsString("ConfigurationLoaded");
}

function UpdateSelectedProcess(hasRoutingProcessChanged)
{
	if (hasRoutingProcessChanged)
	{
		/*
		* Specify these fields in process template definition in process node, to retrieve related configurations in Target_configuration__ combo box
		* <AssociatedConfigurationKeyColumn>ConfigurationName__</AssociatedConfigurationKeyColumn>
		* <AssociatedConfigurationTableName>SO - Configuration__</AssociatedConfigurationTableName>
		*/
		Lib.DD_Client.VirtualFieldsManager.Wizard.ResetCustomFieldsMappings();
	}

	var process = Controls.ProcessSelected__.GetSelectedOption();
	var processList = ProcessInstance.extendedProperties.accountProcesses;
	var i = 0;
	var confFound = false;
	while (i < processList.length && !confFound)
	{
		if (process === processList[i].Key)
		{
			var currentConfKeyColumn = processList[i].ConfKeyColumn;
			if (currentConfKeyColumn)
			{
				FillProcessConfigurationControl(Controls.Target_configuration__, processList[i].Conf, currentConfKeyColumn);
				confFound = true;
			}
		}
		i++;
	}

	if (!confFound)
	{
		Controls.Target_configuration__.SetAvailableValues([""]);
	}
}


function FillProcessCombo(hasRoutingProcessChanged)
{
	var filledOptions = Controls.ProcessSelected__.GetAvailableValues();
	if (!filledOptions || filledOptions.length === 0)
	{
		var processList = ProcessInstance.extendedProperties.accountProcesses;
		if (processList && processList.length > 0)
		{
			var options = processList
				.filter(({ Key, Label }) => Key && Label)
				.sort((a, b) => a.Label.localeCompare(b.Label))
				.map(({ Key, Label }) => Key + "=" + Label);

			Controls.ProcessSelected__.SetAvailableValues(options);
		}

	}

	var currentProcess = Controls.ProcessSelected__.GetSelectedOption();
	if (currentProcess)
	{
		Controls.ProcessSelected__.SetError("");
		UpdateSelectedProcess(hasRoutingProcessChanged);
	}
	else
	{
		Controls.ProcessSelected__.SetAvailableValues([]);
		Controls.ProcessSelected__.SetError("_Selected_Process_is_not_found");
		Controls.Target_configuration__.SetAvailableValues([]);
	}
}

function FillProcessConfigurationControl(configurationControl, conf, confKeyColumn)
{

	function listConfigurationCallback()
	{
		var err = this.GetQueryError();
		if (err)
		{
			Popup.Alert(err);
			return;
		}

		var nbRecords = this.GetRecordsCount();
		if (nbRecords > 0)
		{
			var existingConfNames = ["="];
			for (var i = 0; i < nbRecords; i++)
			{
				var confKeyColumnName = this.GetQueryValue(confKeyColumn, i);
				existingConfNames.push(confKeyColumnName + "=" + confKeyColumnName);
			}
			configurationControl.SetAvailableValues(existingConfNames);

		}
	}

	Query.DBQuery(listConfigurationCallback, conf, confKeyColumn, null, null, 99);
}

function OnRoutingProcessChange()
{
	FillDefaultRoutingMethodComboWithApplicationProcess(true);
}

function FillDefaultRoutingMethodComboWithApplicationProcess(hasRoutingProcessChanged)
{
	var isApplicationProcessAllowed = Controls.IsApplicationProcessAllowed__.GetValue();
	if (isApplicationProcessAllowed)
	{
		FillProcessCombo(hasRoutingProcessChanged);

		if (Controls.ProcessSelected__.GetValue() == null)
		{
			Controls.ProcessSelected__.SetValue(Controls.ProcessSelected__.GetAvailableValues()[0]); //set default value (first one) as the default
		}

		//Save current routing method before recreating the application process routing method
		var currentDefaultRoutingMethod = Data.GetValue("DefaultDelivery__");

		RemoveDeliveryOption("APPLICATION_PROCESS=");

		var newRoutingValue = "";
		var options = Controls.ProcessSelected__.GetAvailableValues();
		var currentOption = Controls.ProcessSelected__.GetSelectedOption();
		for (var i = 0; i < options.length; i++)
		{
			if (currentOption === options[i].split("=")[0])
			{
				newRoutingValue = "APPLICATION_PROCESS=" + options[i].split("=")[1];
			}
		}

		AddDeliveryOption(newRoutingValue);

		//If default routing method was APPLICATION_PROCESS, we need to reset DefaultDelivery__ to its value
		if (currentDefaultRoutingMethod === "APPLICATION_PROCESS")
		{
			Controls.DefaultDelivery__.SetValue(currentDefaultRoutingMethod);
		}


		Lib.DD.AppDeliveries.CheckDeliveryMethodError(Controls.DefaultDelivery__, Controls.ProcessSelected__.GetValue());
	}
}

function HandleConfigurationPane()
{
	var isOutbound = IsOutboundConfiguration();
	if (!shouldInitNewConfiguration())
	{
		Controls.Document_Type__.SetReadOnly(true);
		Controls.Family__.SetReadOnly(true);
		Controls.Routing__.SetReadOnly(true);
	}
	else
	{
		Controls.Document_Type__.SetReadOnly(false);
		Controls.Family__.SetReadOnly(false);
		Controls.Routing__.SetReadOnly(false);
		Controls.Show_comment__.Check(true);
		Controls.Show_recipient_id__.Check(isOutbound);
		Controls.Show_document_number__.Check(isOutbound);
		Controls.Show_document_priority__.Check(true);
		Controls.DisplaySaveButton__.Check(true);
		Controls.DisplaySaveAndQuitButton__.Check(true);
		Controls.Show_Manage_documents_button__.Check(true);
		Controls.DisplayRejectButton__.Check(true);
		Controls.DisplayResubmitButton__.Check(false);
		Controls.DisplaySetAsideButton__.Check(false);
	}
	Controls.SubmittedDocType__.Hide(!isOutbound);
	Controls.PreviewPanel.Hide(!isOutbound);
	Controls.DeliveryMethodToUse__.Hide(!isOutbound);
	Controls.BounceBacks_Enable__.Hide(!isOutbound);
	Controls.AutoCreateRecipients__.Hide(!isOutbound);
	Controls.Document_ArchiveDuration_NONE__.SetLabel(isOutbound ? Language.Translate("Document_ArchiveDuration_NONE__") : Language.Translate("InboundArchiving"));
	Controls.Routing_fields__.SetLabel(isOutbound ? Language.Translate("Routing_fields__") : Language.Translate("InboundRoutingRelatedFields"));
	if (isOutbound)
	{
		Sys.Wizard.Wizard.SetTranslatedTitle(7, Language.Translate("Delivery_pane"));
	}
}

function HandleRoutingMethod()
{
	var isOutbound = IsOutboundConfiguration();
	Controls.IsEmailAllowed__.Hide(isOutbound);
	Controls.IsMODAllowed__.Hide(isOutbound);
	Controls.IsFaxAllowed__.Hide(isOutbound);
	Controls.IsPortalAllowed__.Hide(isOutbound);
	Controls.IsOtherAllowed__.Hide(isOutbound);
	Controls.IsArchiveAllowed__.Hide(isOutbound);
	Controls.IsConversationAllowed__.Hide(isOutbound || !Lib.DD.AppDeliveries.IsActive("COP"));
	Controls.AllowedRoutingMethodsTitle__.Hide(isOutbound);
	Controls.Spacer2__.Hide(isOutbound);
	Controls.IsApplicationProcessAllowed__.SetLabel(isOutbound ? Language.Translate("Default_APPLICATION_PROCESS_Name_FixedConf") : Language.Translate("Default_APPLICATION_PROCESS")); //Fix conf
	Controls.ConfigureFieldMapping__.Hide(isOutbound);
	HandleAllowedRoutingMethodsUpdate();
}

function CheckDeliveryOptionInError()
{
	var currentOptionList = Controls.DefaultDelivery__.GetAvailableValues();
	if (currentOptionList.length === 0)
	{
		Data.SetError("DefaultDelivery__", "_atLeastOneRoutingMethodAllowed");
	}
	else
	{
		Data.SetError("DefaultDelivery__", "");
		Lib.DD.AppDeliveries.CheckDeliveryMethodError(Controls.DefaultDelivery__, Controls.ProcessSelected__.GetValue());
	}
}

function AddDeliveryOption(optionName)
{
	var currentOptionList = Controls.DefaultDelivery__.GetAvailableValues();
	if (currentOptionList.indexOf(optionName) !== -1)
	{
		return;
	}

	var currentOption = Controls.DefaultDelivery__.GetValue();

	currentOptionList.push(optionName);
	Controls.DefaultDelivery__.SetAvailableValues(currentOptionList);
	Controls.DefaultDelivery__.SetValue(currentOption);

	UpdateDeliveryMethodWarning();
	CheckDeliveryOptionInError();
}

function RemoveDeliveryOption(optionName)
{
	var currentOption = Controls.DefaultDelivery__.GetValue();
	var currentOptionList = Controls.DefaultDelivery__.GetAvailableValues();
	var newOptionList = [];
	if (currentOptionList.length > 0)
	{
		for (var optionIdx = 0; optionIdx < currentOptionList.length; optionIdx++)
		{
			var option = currentOptionList[optionIdx];

			if (option.indexOf(optionName) === -1)
			{
				newOptionList.push(option);
			}
		}
	}

	// When we uncheck default delivery option method
	if (optionName.indexOf("=") !== -1 && optionName.split("=")[0] === currentOption)
	{
		if (newOptionList.length > 0)
		{
			currentOption = newOptionList[0].split("=")[0];
		}
		else
		{
			currentOption = "NONE";
		}
	}

	Controls.DefaultDelivery__.SetAvailableValues(newOptionList);
	Controls.DefaultDelivery__.SetValue(currentOption);

	UpdateDeliveryMethodWarning();
	CheckDeliveryOptionInError();
}

function OnArchiveAllowedChange()
{
	var optionName = "NONE=Default_NONE";
	var isAllowed = Controls.IsArchiveAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
	}
	else
	{
		RemoveDeliveryOption(optionName);
	}
}

function OnEmailAllowedChange()
{
	var optionName = "SM=Default_EMAIL";
	var isAllowed = Controls.IsEmailAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
	}
	else
	{
		RemoveDeliveryOption(optionName);
	}
	Controls.DefaultDeliveryEmail__.Hide(!isAllowed);
}

function OnMODAllowedChange()
{
	var optionName = "MOD=Default_MOD";
	var isAllowed = Controls.IsMODAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
	}
	else
	{
		RemoveDeliveryOption(optionName);
	}
}

function OnPortalAllowedChange()
{
	var optionName = "PORTAL=Default_PORTAL";
	var isAllowed = Controls.IsPortalAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
	}
	else
	{
		RemoveDeliveryOption(optionName);
	}
}

function OnOtherAllowedChange()
{
	var optionName = "OTHER=Default_OTHER";
	var isAllowed = Controls.IsOtherAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
	}
	else
	{
		RemoveDeliveryOption(optionName);
	}
}

function OnFaxAllowedChange()
{
	var optionName = "FGFAXOUT=Default_FAX";
	var isAllowed = Controls.IsFaxAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
	}
	else
	{
		RemoveDeliveryOption(optionName);
	}
}

function OnConversationAllowedChange()
{
	var optionName = "CONVERSATION=Default_CONVERSATION";
	var isAllowed = Controls.IsConversationAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
	}
	else
	{
		RemoveDeliveryOption(optionName);
	}
}


function OnConversationEnabledChange(isArtificiallyTriggered)
{
	var conversationEnabled = Controls.Enable_conversation__.IsChecked();
	Controls.EnableAIReplySuggestion__.Hide(!conversationEnabled);
	if (conversationEnabled && !isArtificiallyTriggered)
	{
		Controls.EnableAIReplySuggestion__.SetValue(true);
		Controls.DefaultReplyType__.Hide(false);
		Controls.DefaultReplyType__.SetValue("GPT");
	}
	HandleAIReplyAllowedKBCollectionsVisibility();
}

function OnAIReplyAllowedKBCollectionsBrowse()
{
	let currentlySelectedCollections = (Controls.AIReplyAllowedKBCollections__.GetValue() || "").split("\n");
	currentlySelectedCollections = currentlySelectedCollections.filter((collection) => collection.trim().length > 0);

	const collectionsManager = new Sys.ML.VectorStore.Collections.CollectionsManager();
	collectionsManager.buildSelectableValues().then((collections) =>
	{
		let availableCollections = collections.split("\n").map((collection) =>
		{
			return collection.split("=")[0];
		});

		// Remove empty values from the list of available collections, if any
		availableCollections = availableCollections.filter((collection) => collection.trim().length > 0);

		// Sort the collections alphabetically
		availableCollections.sort();

		// Show the dialog when OnBrowse event occurs
		Popup.Dialog("_AIReplyAllowedKBCollectionsDialogTitle", null,
			(dialog) =>
			{
				if (availableCollections.length > 0)
				{
					dialog.AddDescription("AIReplyAllowedKBCollectionsDialogDescription", "_AIReplyAllowedKBCollectionsDialogDescription");
				}
				else
				{
					const noCollectionsDescription = Language.Translate("_AIReplyAllowedKBCollectionsDialogNoCollectionsDescription", false, Language.Translate("_Activate vector store"));
					dialog.AddDescription("AIReplyAllowedKBCollectionsDialogDescription", noCollectionsDescription);
				}

				// Loop through the options and create checkboxes
				for (let optionIdx = 0; optionIdx < availableCollections.length; optionIdx++)
				{
					const option = availableCollections[optionIdx];
					const checkbox = dialog.AddCheckBox(`AIReplyAllowedKBCollectionsDialogOption${optionIdx}`);

					if (checkbox)
					{
						checkbox.SetText(option);
						checkbox.Check(currentlySelectedCollections.indexOf(option) >= 0);
					}
					else
					{
						Log.Error("Failed to create checkbox for option: " + option);
					}
				}
			},
			(dialog) =>
			{
				const selectedValues = [];

				// Loop through the options and get the checked values
				for (let optionIdx = 0; optionIdx < availableCollections.length; optionIdx++)
				{
					const checkbox = dialog.GetControl(`AIReplyAllowedKBCollectionsDialogOption${optionIdx}`);

					if (!checkbox)
					{
						Log.Error("Failed to get checkbox for option: " + availableCollections[optionIdx]);
						continue;
					}

					if (checkbox.IsChecked())
					{
						selectedValues.push(availableCollections[optionIdx]);
					}
				}

				// Return the selected values when the OK button is clicked
				Controls.AIReplyAllowedKBCollections__.SetValue(selectedValues.join("\n"));
			});
	});
}

function HandleAIReplyAllowedKBCollectionsVisibility()
{
	if (Controls.AIReplyAllowedKBCollections__ && Controls.EnableAIReplySuggestion__)
	{
		// Hide AI replies from knowledge base if AI reply suggestion is disabled or hidden
		Controls.AIReplyAllowedKBCollections__.Hide(!Controls.EnableAIReplySuggestion__.IsChecked() || !Controls.EnableAIReplySuggestion__.IsVisible());
	}
}

function OnEnableAIReplySuggestionChange()
{
	let isAIReplyActivated = Controls.EnableAIReplySuggestion__.IsChecked();
	Controls.DefaultReplyType__.Hide(!isAIReplyActivated);
	HandleAIReplyAllowedKBCollectionsVisibility();
}

function OnApplicationProcessAllowedChange()
{
	var optionName = "APPLICATION_PROCESS=Process";
	var isAllowed = Controls.IsApplicationProcessAllowed__.GetValue();
	if (isAllowed)
	{
		AddDeliveryOption(optionName);
		FillDefaultRoutingMethodComboWithApplicationProcess();
	}
	else
	{
		RemoveDeliveryOption("APPLICATION_PROCESS=");
	}
	Controls.ProcessSelected__.Hide(!isAllowed);
	Controls.NextProcessOwner__.Hide(!isAllowed);
	Controls.Target_configuration__.Hide(!isAllowed);
	Controls.ConfigureFieldMapping__.Hide(!isAllowed);
	Controls.EnableConfigurationMapping__.Hide(!isAllowed);
}

function HandleAllowedRoutingMethodsUpdate()
{
	if (IsOutboundConfiguration())
	{
		var defaultDeliveryToApply = Controls.DefaultDelivery__.GetValue();
		var outboundDefaultRoutingMethods = ["MOD=Default_MOD", "PORTAL=Default_PORTAL", "SM=Default_EMAIL", "FGFAXOUT=Default_FAX", "OTHER=Default_OTHER", "NONE=Default_NONE"];
		Controls.DefaultDelivery__.SetAvailableValues(outboundDefaultRoutingMethods);
		Controls.DefaultDelivery__.SetValue(defaultDeliveryToApply);
		FillDefaultRoutingMethodComboWithApplicationProcess();
		Controls.NextProcessOwner__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
		Controls.ProcessSelected__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
		Controls.Target_configuration__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
		Controls.ConfigureFieldMapping__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
		Controls.ProcessRelatedConfiguration__.Hide(true);
	}
	else
	{
		OnArchiveAllowedChange();
		OnEmailAllowedChange();
		OnMODAllowedChange();
		OnPortalAllowedChange();
		OnOtherAllowedChange();
		OnFaxAllowedChange();
		OnConversationAllowedChange();
		OnApplicationProcessAllowedChange();
	}
}

function HandleErrorMessage()
{
	var errorMessage = Variable.GetValueAsString("ErrorMessage");
	if (errorMessage)
	{
		Popup.Alert(Language.Translate(errorMessage));
		Sys.Wizard.Wizard.currentStep = 0;
		Sys.Wizard.Wizard.ShowStep();
		Sys.Wizard.Wizard.ApplyStartCallback(Sys.Wizard.Wizard.steps[0]);
		Controls.ConfigurationName__.SetReadOnly(false);
		Variable.SetValueAsString("ErrorMessage", "");
	}
}

function CheckRegularExpression(fieldName)
{
	var strRegex = Data.GetValue(fieldName);
	var valid = true;
	try
	{
		var regex = new RegExp(strRegex);
		valid = !!regex;
	}
	catch (e)
	{
		valid = false;
	}
	if (!valid)
	{
		Data.SetError(fieldName, "Invalid regular expression");
		return false;
	}
	return valid;
}

function InitializeNewConfigurationDefaultValues()
{
	var ancestorsRuid = Variable.GetValueAsString("AncestorsRuid");
	// New configurations if the variable is not set
	if (ancestorsRuid === null)
	{
		Data.SetValue("AddAttachmentsWithEmail__", "1");
	}
}

function InitializeConfigurationValues(callback)
{
	function InitializeConfigurationName()
	{
		//The configuration has been loaded from an existing record : it must not be modified !!
		var configurationName = Data.GetValue("ConfigurationName__");
		if (configurationName)
		{
			Controls.ConfigurationName__.SetReadOnly(true);
			Variable.SetValueAsString("ConfigurationLoaded", configurationName);
			Data.SetExtractionConfiguration(configurationName);
		}
	}

	function InitializeDocumentType()
	{
		var isConfigurationTemplate = Controls.Configuration_template__.GetValue();
		if (isConfigurationTemplate)
		{
			Controls.Document_Type__.SetRequired(false);
			Controls.Document_Type__.SetReadOnly(true);
			Controls.Document_Type__.SetValue("");
		}

		var documentType = Data.GetValue("Document_Type__");
		if (documentType)
		{
			Variable.SetValueAsString("DocumentTypeLoaded", documentType);
			// if there are additional fields and the document type is changed, currently the fields activation condition is not updated accordingly
			Controls.Document_Type__.SetReadOnly(true);
		}
	}

	function ConfigurationsRetrieved()
	{
		var err = this.GetQueryError();
		if (err)
		{
			Popup.Alert(err);
			EndInitialization();
			return;
		}

		if (!Data.GetValue("ConfigurationName__"))
		{
			StoreExistingConfigurations(this);
		}

		StoreExistingRegexes(this);
		StoreExistingDocumentTypeAL(this);

		EndInitialization();
	}

	function StoreExistingConfigurations(eddQueryContext)
	{
		var existingConfNames = [];
		var nbRecords = eddQueryContext.GetRecordsCount();
		for (var i = 0; i < nbRecords; i++)
		{
			existingConfNames.push({
				name: eddQueryContext.GetQueryValue("ConfigurationName__", i),
				documentType: eddQueryContext.GetQueryValue("Document_Type__", i),
				isInbound: eddQueryContext.GetQueryValue("Routing__", i) === "Routing message",
				family: eddQueryContext.GetQueryValue("Family__", i)
			});
		}
		Variable.SetValueAsString("ExistingConfigurations", JSON.stringify(existingConfNames));
	}

	function StoreExistingRegexes(eddQueryContext)
	{
		var existingRegexes = [];
		var currentRegex = Data.GetValue("Filename_regular_expression__");

		var nbRecords = eddQueryContext.GetRecordsCount();
		for (var i = 0; i < nbRecords; i++)
		{
			var regex = eddQueryContext.GetQueryValue("Filename_regular_expression__", i);
			var isConfigurationTemplate = eddQueryContext.GetQueryValue("Configuration_template__", i);
			if (regex !== currentRegex && !isConfigurationTemplate)
			{
				existingRegexes.push(regex);
			}
		}

		ConfigurationSelectionUI._existingRegexes = existingRegexes;
	}

	function StoreExistingDocumentTypeAL(eddQueryContext)
	{
		var existingDocumentTypeForAL = [];
		var configurationName = Data.GetValue("ConfigurationName__");
		for (var i = 0; i < eddQueryContext.GetRecordsCount(); i++)
		{
			var isConfigurationTemplate = eddQueryContext.GetQueryValue("Configuration_template__", i) === "1";
			var isCurrentConfiguration = eddQueryContext.GetQueryValue("ConfigurationName__", i) === configurationName;
			var isConfigurationAL = eddQueryContext.GetQueryValue("ConfigurationSelection_Enable__", i) === "1" && eddQueryContext.GetQueryValue("MatchDocumentLayout__", i) === "1";

			if (!isConfigurationTemplate && !isCurrentConfiguration && isConfigurationAL)
			{
				existingDocumentTypeForAL.push(eddQueryContext.GetQueryValue("Document_Type__", i));
			}
		}

		Variable.SetValueAsString("ExistingDocumentTypeForAL", JSON.stringify(existingDocumentTypeForAL));

		if (Variable.GetValueAsString("DocumentTypeNotUnique") === "1")
		{
			ConfigurationSelectionUI.CheckUniqueDocumentType();
		}
	}

	function FillValues(query)
	{
		var fields = query.GetQueryValue().RecordsDefinition;
		var count = 0;
		for (var field in fields)
		{
			if (/.*__$/.test(field))
			{
				var value = query.GetQueryValue(field);
				if (field.toUpperCase() === "MOD_Option_PDFCommand__".toUpperCase())
				{
					value = value.replace(/\\r\\n/g, "\n");
				}
				if (field.toUpperCase() === "Document_Option_PDFCommand__".toUpperCase())
				{
					value = value.replace(/\\r\\n/g, "\n");
				}
				Data.SetValue(field, value);
				count++;
			}
		}
		Log.Info("Sucessfully initialized " + count + " values for the configuration");
	}

	function FillValuesCallback()
	{
		var err = this.GetQueryError();
		if (err)
		{
			EndInitialization();
			Popup.Alert(err);
			return;
		}

		var nbRecords = this.GetRecordsCount();
		if (nbRecords === 1)
		{
			FillValues(this);
			InitializeConfigurationName();
			InitializeDocumentType();
		}

		Lib.DD_Client.DisplayPreviewPanel(IsOutboundConfiguration());

		var fields = "ConfigurationName__|Filename_regular_expression__|Document_Type__|Configuration_template__|ConfigurationSelection_Enable__|MatchDocumentLayout__|Routing__|Family__";
		Query.DBQuery(ConfigurationsRetrieved, "DD - Application Settings__", fields, null, "Document_Type__ ASC", "NO_LIMIT");
	}

	function FillGlobalValuesCallback()
	{
		ProcessInstance.SetSilentChange(true);
		var err = this.GetQueryError();
		if (err)
		{
			EndInitialization();
			Popup.Alert(err);
			return;
		}

		var nbRecords = this.GetRecordsCount();
		if (nbRecords === 1)
		{
			FillValues(this);
		}
		NextQuery();
	}

	function EndInitialization()
	{
		Variable.SetValueAsString("ConfigurationValuesLoaded", "1");
		HandleConfigurationPane();
		callback();
		ProcessInstance.SetSilentChange(false);
	}

	if (Variable.GetValueAsString("ConfigurationValuesLoaded") === "1")
	{
		return;
	}

	Query.DBQuery(FillGlobalValuesCallback, "DD - Application Global Settings__", "");
	function NextQuery()
	{
		//The record that must be loaded is set using the "AncestorsRuid" variable
		Query.DBQuery(FillValuesCallback, "DD - Application Settings__", "", "Ruid=" + Variable.GetValueAsString("AncestorsRuid"));
	}
}

function ContainsInArray(array, value)
{
	return array.indexOf(value) !== -1;
}

function IsOutboundConfiguration()
{
	var routing = Controls.Routing__.GetValue();
	return routing !== "Routing message";
}

function InitVirtualFields()
{
	CustomFields.Init();
}
function InitAISuggestedRepliesParameters()
{
	Controls.DefaultReplyType__.Hide(!Controls.EnableAIReplySuggestion__.IsChecked());
	HandleAIReplyAllowedKBCollectionsVisibility();
}
function HideCustomerOrderProcessIfNotChecked()
{
	var hideCOPRoutingRelatedControl = !Data.GetValue("IsCOPAllowed__");
	Controls.IsCOPAllowed__.Hide(hideCOPRoutingRelatedControl);
	Controls.ProcessRelatedConfiguration__.Hide(hideCOPRoutingRelatedControl);

	var hideNextProcessOwner = !Data.GetValue("IsCOPAllowed__") && !Data.GetValue("IsApplicationProcessAllowed__");
	Controls.NextProcessOwner__.Hide(hideNextProcessOwner);

	if (Data.GetValue("IsCOPAllowed__"))
	{
		Data.SetValue("IsApplicationProcessAllowed__", false);
		FillApplicationConfigurationControl("COP", Controls.ProcessRelatedConfiguration__);
		AddDeliveryOption("COP=CustomerOrderProcessing");
	}
	else
	{
		RemoveDeliveryOption("COP=CustomerOrderProcessing");
	}

}

function FillApplicationConfigurationControl(appKey, configurationControl)
{
	function OnConfigurationRetrieved(configurations)
	{
		if (configurations)
		{
			configurationControl.SetAvailableValues(configurations);
		}
		else
		{
			configurationControl.SetAvailableValues([]);
		}
	}
	Lib.DD.AppDeliveries.GetApplicationConfigurations(appKey, OnConfigurationRetrieved);
}

function HandleVectorStoreFieldsVisibility()
{
	const isVectorStoreActivated = Controls.Activate_vector_store__.IsChecked();
	Controls.Vector_Store_Collection_ComboBox__.Hide(!isVectorStoreActivated);
	Controls.Conversation_Digest_Prompt__.Hide(!isVectorStoreActivated || Controls.Data_To_Store__.GetValue() !== "Conversations");
	Controls.Data_To_Store__.Hide(!isVectorStoreActivated);
	if (isVectorStoreActivated)
	{
		fillVectorStoreCollectionsComboBox();
	}
}

function InitVectorStoreFields()
{
	Controls.Conversation_Digest_Prompt__.SetPlaceholder(Language.Translate("_ConversationDigestPromptPlaceholder"));
	HandleVectorStoreFieldsVisibility();
}

function fillVectorStoreCollectionsComboBox()
{
	// Check if combo box is already filled
	if (Controls.Vector_Store_Collection_ComboBox__.GetAvailableValues().length > 0)
	{
		return;
	}

	const currentCollection = Controls.Vector_Store_Collection_ComboBox__.GetValue();

	const collectionsManager = new Sys.ML.VectorStore.Collections.CollectionsManager();
	collectionsManager.buildSelectableValues().then((values) =>
	{
		let currentDocumentType = Data.GetValue("Document_Type__") || "";

		// if values do not contain the current document type, add it to the list
		let currentDocumentTypeAddedToSelectableValues = false;
		if (currentDocumentType)
		{
			let availableCollections = values.split("\n").map((collection) =>
			{
				return collection.split("=")[0];
			});
			if (availableCollections.indexOf(currentDocumentType) < 0)
			{
				currentDocumentTypeAddedToSelectableValues = true;
				values = `${currentDocumentType}=${currentDocumentType}\n${values}`;
			}
		}

		Controls.Vector_Store_Collection_ComboBox__.SetAvailableValues(values);

		// If the current collection is not set, set it to the current document type
		if (!currentCollection && currentDocumentTypeAddedToSelectableValues)
		{
			Controls.Vector_Store_Collection_ComboBox__.SetValue(currentDocumentType);
		}
	}).catch((error) =>
	{
		Log.Error(`Error while retrieving vector store collections: ${error}`);
	});
}

function Main()
{
	Sys.Helpers.EnableSmartSilentChange();
	ProcessInstance.SetSilentChange(true);
	var steps = [
		{
			panels: [Controls.General_pane, Controls.General_advanced_options_pane, Controls.Features_pane],
			icon: "fa-cog",
			title: "General_pane",
			description: "General_pane_description",
			helpId: 7000,
			onStart: function ()
			{
				Controls.General_advanced_options_pane.Hide(true);
				HandleConfigurationType();
				HandleSubmittedDocType();
				HandleDisableExtraction();
				Controls.PreviewPanel.ClearHighlights();
				ConfigurationSelectionUI.HandleConfigurationVisibility();
				RefreshHTMLToggles();
			},
			onQuit: function ()
			{
				var result = ConfigurationSelectionUI.CheckUniqueConfigurationName();
				result = result && ConfigurationSelectionUI.CheckUniqueFilenameRegExp();

				if (Attach.IsProcessedDocument(0))
				{
					var attachExtension = Variable.GetValueAsString("AttachExtension");
					var convertTypeToExtension = {
						"pdf": [".pdf"],
						"tif": [".tif", ".tiff"],
						"ubl": [".xml"],
						"ubl_pdf": [".zip"],
						"customxml": [".xml"],
						"customxml_pdf": [".zip"]
					};

					var noValidFileType = !ContainsInArray(convertTypeToExtension[Controls.SubmittedDocType__.GetValue()], attachExtension);
					if (noValidFileType)
					{
						Controls.SubmittedDocType__.SetError(Tools.translations.noValidFileType);
						result = false;
					}

					if (ConfigurationSelectionUI._ocrPdfProcessingChanged)
					{
						CustomFields.SaveTemporayExtractionData();
						ProcessInstance.Resubmit("Document");
						result = false;
					}
				}


				if (!result)
				{
					return result;
				}

				// After the first step, do not allow to change configuration name
				Controls.ConfigurationName__.SetReadOnly(true);

				if (Tools.IsExtractionDisabled())
				{
					ExtractionUI.CleanExtractionFields();
				}
				return true;
			}
		},
		{
			panels: [Controls.Activate_Recognition_pane, Controls.Doctype_Recognition_Keywords_Parameters_pane, Controls.Gpt_Document_Recognition_pane],
			icon: "fa-eye",
			title: "Recognition_pane",
			description: "Recognition_pane_description",
			helpId: 7012,
			onStart: function ()
			{
				ConfigurationSelectionUI.Init();
				RefreshHTMLToggles();
			},
			onQuit: function ()
			{
				return ConfigurationSelectionUI.OnQuit();
			}
		},
		{
			panels: [Controls.Splitting_pane, Controls.Splitting_Buttons_Pane, Controls.Split_Information_pane],
			icon: "fa-cut fa-rotate-270",
			title: "Splitting_pane",
			description: "Splitting_pane_description",
			helpId: 7001,
			onStart: SplitUI.Init,
			onQuit: function (goToNext)
			{
				return SplitUI.OnQuit(goToNext);
			},
			isVisible: function ()
			{
				return IsOutboundConfiguration();
			}
		},
		{
			panels: ExtractionUI.outboundExtractionPanels,
			icon: "fa-external-link",
			title: "Outbound_extraction_pane",
			description: "Extraction_pane_description",
			helpId: 7002,
			isVisible: function ()
			{
				return IsOutboundConfiguration();
			},
			onStart: function ()
			{
				SplitUI.PreviewSplit(true);
				Controls.Advanced_extraction_pane.Hide(true);
				// avoid to re-draw area
				SplitUI.isOnSelectPageEnabled = false;
				Controls.PreviewPanel.ClearHighlights();
				ExtractionUI.Init();
				InitVirtualFields();
				HandleSubmittedDocType();
				HandleExtractionFields();
				RefreshHTMLToggles();
			}
		},
		{
			panels: ExtractionUI.inboundExtractionPanels,
			icon: "fa-external-link",
			title: "Inbound_extraction_pane",
			description: "Extraction_pane_description",
			helpId: 7002,
			isVisible: function ()
			{
				return !IsOutboundConfiguration();
			},
			onStart: function ()
			{
				SplitUI.PreviewSplit(true);
				Controls.Advanced_extraction_pane.Hide(true);
				// avoid to re-draw area
				SplitUI.isOnSelectPageEnabled = false;
				Controls.PreviewPanel.ClearHighlights();
				ExtractionUI.Init();
				InitVirtualFields();
				HandleSubmittedDocType();
				HandleExtractionFields();
				RefreshHTMLToggles();
			}
		},
		{
			panels: [Controls.Validation_pane, Controls.ButtonBar_pane, Controls.Advanced_validation_pane],
			icon: "fa-eye",
			title: "Validation_step",
			description: "Validation_step_description",
			helpId: 7017,
			onStart: function ()
			{
				Controls.MoreValidationOptions__.Hide(!IsOutboundConfiguration());
				Controls.Advanced_validation_pane.Hide(true);
				RefreshHTMLToggles();
				SetEnableConversationButtonVisibility();
				UpdateReopenButtonWarning();
			}
		},
		{
			panels: [Controls.Formatting_pane, Controls.Advanced_formatting_pane],
			icon: "fa-random",
			title: "Documents_pane",
			description: "Documents_pane_description",
			helpId: 7003,
			onStart: function ()
			{
				Controls.Advanced_formatting_pane.Hide(true);
				HandleFormattingPane();
				RefreshHTMLToggles();
			},
			isVisible: function ()
			{
				return IsOutboundConfiguration();
			}
		},
		{
			panels: [Controls.Routing_pane, Controls.Related_Document_pane, Controls.Routing_advanced_pane, Controls.MOD_delivery_pane, Controls.Advanced_mod_options, Controls.Portal_delivery_pane, Controls.Advanced_portal_options, Controls.Email_delivery_pane],
			icon: "fa-list-ul",
			title: "Delivery_pane",
			description: "Delivery_pane_description",
			helpId: 7004,
			onStart: function ()
			{
				Controls.Advanced_mod_options.Hide(true);
				Controls.Advanced_portal_options.Hide(true);
				Controls.DefaultDeliveryEmail__.Hide(!Controls.IsEmailAllowed__.GetValue());
				Controls.ProcessSelected__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
				Controls.Target_configuration__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
				Controls.ConfigureFieldMapping__.Hide(!Controls.IsApplicationProcessAllowed__.GetValue());
				HandleGroupingMOD();
				HandleAutoCreateRecipients();
				HandleLinkToAnotherDocument(true);
				HandleRoutingMethod();
				UpdateDeliveryMethodWarning();
				if (!IsOutboundConfiguration())
				{
					Controls.Related_Document_pane.Hide(true);
					Controls.Routing_advanced_pane.Hide(true);
					Controls.MOD_delivery_pane.Hide(true);
					Controls.Advanced_mod_options.Hide(true);
					Controls.Portal_delivery_pane.Hide(true);
					Controls.Advanced_portal_options.Hide(true);
					Controls.Email_delivery_pane.Hide(true);
				}
				HideCustomerOrderProcessIfNotChecked();
				RefreshHTMLToggles();
			}
		},
		{
			panels: [Controls.Salesforce_Integration_pane],
			icon: "fa-database",
			title: "Integration_pane",
			description: "Integration_pane_description",
			helpId: 7006,
			onStart: function ()
			{
				UpdateSalesforceFieldsStatus();
			}
		},
		{
			panels: [Controls.Archiving_msg_pane, Controls.ArchivingSender_pane, Controls.Data_storage_pane],
			icon: "fa-archive",
			title: "Archiving_pane",
			description: "Archiving_pane_description",
			helpId: 7005,
			onStart: function ()
			{
				InitVectorStoreFields();
			}
		}
	];

	Sys.Wizard.Wizard.Init({
		steps: steps,
		previousButton: Controls.Previous,
		nextButton: Controls.Next,
		wizardControl: Controls.Wizard_steps__,
		descriptionControl: Controls.Wizard_step_desc__,
		LoadFirstStep: function ()
		{
			return Variable.GetValueAsString("currentStep");
		},
		SaveCurrentStep: function (currentStep)
		{
			Variable.SetValueAsString("currentStep", currentStep);
			InitAISuggestedRepliesParameters();
		},
		RefreshDefaultValues: function (runWizardCb)
		{
			if (!Variable.GetValueAsString("currentStep"))
			{
				InitializeConfigurationValues(runWizardCb);
			}
			else
			{
				runWizardCb();
			}
		}
	});
	if (Controls.Spacer_line__)
	{
		Controls.Spacer_line__.Hide(true);
	}

	InitializeNewConfigurationDefaultValues();
	DeclareHandler();

	TitlesUI.Init();
	HandleErrorMessage();
	Query.NotifyOnCurrentRequestsDone(function ()
	{
		var routingFieldsTranslatedLabel = Language.Translate("Routing_fields__");
		Controls.Routing_fields__.FireEvent("Routing_Fields_label",
			{
				translatedLabel: routingFieldsTranslatedLabel
			}
		);
	});

	function UpdateSalesforceFieldsStatus()
	{
		var mustCreateCase = Data.GetValue("SalesforceCreateCase__");
		Controls.SalesforceCaseCreationStage__.Hide(!mustCreateCase);
		Controls.SalesforceObjectName__.Hide(!mustCreateCase);
		Controls.SalesforceFieldsMapping__.Hide(!mustCreateCase);

		Controls.SalesforceCaseCreationStage__.SetRequired(mustCreateCase);
		Controls.SalesforceObjectName__.SetRequired(mustCreateCase);
		Controls.SalesforceFieldsMapping__.SetRequired(mustCreateCase);
	}
	Controls.SalesforceCreateCase__.OnChange = function ()
	{
		UpdateSalesforceFieldsStatus();
	};
	ProcessInstance.SetSilentChange(false);
}

/// ==================================
/// Entry point !!!
/// ==================================
Main();
