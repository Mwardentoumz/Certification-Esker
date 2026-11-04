var Tools = {
	IsExtractable: function ()
	{
		var extrableDocType = ["pdf", "tif"];
		var docType = Controls.SubmittedDocType__.GetValue();
		return extrableDocType.indexOf(docType) >= 0;
	},
	IsExtractionDisabled: function ()
	{
		return Controls.DisableExtraction__.IsChecked();
	}
};

function IsOutboundConfiguration()
{
	var routing = Controls.Routing__.GetValue();
	return (routing !== "Routing message");
}

var SplitUI = {
	Init: function ()
	{
		function DrawSplittingPreview()
		{
			var offset = Controls.Split_Offset__.GetValue();
			var type = Controls.Split_DivisionMethod__.GetValue();
			var stringAtEnd = type === "ONSTRING" && Controls.Split_Location__.GetValue() === "1";
			Sys.Wizard.Tools.DrawSplittingPreview(offset, type, stringAtEnd, Controls.HTMLSplittingPreview__);
		}

		function SetControlsVisibility()
		{
			var comboValue = Controls.Split_DivisionMethod__.GetValue();

			var numberPageVisible = comboValue === "NPAGES";
			var stringSplitVisible = comboValue === "ONSTRING";
			var areaVisible = comboValue === "ONAREA" || comboValue === "ONSTRING";

			Controls.Split_NumberPages__.Hide(!numberPageVisible);
			Controls.Split_String__.Hide(!stringSplitVisible);
			Controls.Split_Location__.Hide(!stringSplitVisible);
			Controls.Split_UseRegex__.Hide(!stringSplitVisible);
			Controls.Split_CaseSensitive__.Hide(!stringSplitVisible);
			Controls.Split_Area__.Hide(!areaVisible);
			Controls.Split_AreaMustBeFilled__.Hide(!areaVisible);

			var skipValue = Controls.Skip_Method__.GetValue();
			var skipOffset = skipValue !== "SKIP_AREA";
			var skipArea = skipValue === "SKIP_AREA";

			Controls.Split_Offset__.Hide(!skipOffset);
			Controls.Skip_Area__.Hide(!skipArea);
			Controls.Skip_Criteria__.Hide(!skipArea);
			Controls.Skip_CriteriaIsRegex__.Hide(!skipArea);
			Controls.Skip_CriteriaMatchCase__.Hide(!skipArea);
		}

		function HandleDivisionMethod()
		{
			SetControlsVisibility();
			DrawSplittingPreview();
		}

		function HandleSkipMandatory()
		{
			var skipValue = Controls.Skip_Method__.GetValue();
			var skipArea = skipValue === "SKIP_AREA";

			Controls.Skip_Area__.SetRequired(skipArea);
			Controls.Skip_Criteria__.SetRequired(skipArea);
		}

		function HandleSkipMethod()
		{
			SetControlsVisibility();
			HandleSkipMandatory();
		}

		function DeclareHandler()
		{
			Controls.Split_Location__.OnChange = DrawSplittingPreview;
			Controls.Split_DivisionMethod__.OnChange = HandleDivisionMethod;
			Controls.Skip_Method__.OnChange = HandleSkipMethod;
		}

		SetControlsVisibility();
		DrawSplittingPreview();
		DeclareHandler();
		HandleRoutingMethod();
		HandleSkipMandatory();
	}
};

var ConfigurationSelectionUI = {


	HandleConfigurationVisibility: function ()
	{
		var isConfigurationPanelInStep = Sys.Wizard.Wizard.steps[Sys.Wizard.Wizard.currentStep].panels.indexOf(Controls.Configuration_Recognition_pane) !== -1;
		var enableConfigurationSelection = Controls.ConfigurationSelection_Enable__.IsChecked();
		var displayConfigurationSelectionPane = enableConfigurationSelection && isConfigurationPanelInStep;

		Controls.Configuration_Recognition_pane.Hide(!displayConfigurationSelectionPane);

		if (displayConfigurationSelectionPane)
		{
			var useFileNameRegex = Controls.MatchFilenameRegex__.GetValue();
			var useStringInDocument = Controls.MatchStringWithinDocument__.GetValue();
			var isExtractable = Tools.IsExtractable() && !Tools.IsExtractionDisabled();

			Controls.Filename_regular_expression__.SetRequired(useFileNameRegex);
			Controls.FileNameRegEx_CaseSensitive__.SetRequired(useFileNameRegex);
			Controls.Filename_regular_expression__.Hide(!useFileNameRegex);
			Controls.FileNameRegEx_CaseSensitive__.Hide(!useFileNameRegex);
			Controls.ConfigurationSelection_Area__.SetRequired(useStringInDocument && isExtractable);
			Controls.ConfigurationSelection_Path__.SetRequired(useStringInDocument && !isExtractable);
			Controls.ConfigurationSelection_Criteria__.SetRequired(useStringInDocument);
			Controls.ConfigurationSelection_Criteria__.Hide(!useStringInDocument);
			Controls.ConfigurationSelection_CriteriaIsRegex__.Hide(!useStringInDocument);
			Controls.ConfigurationSelection_CriteriaMatchCase__.Hide(!useStringInDocument);
			Controls.ConfigurationSelection_Path__.Hide((useStringInDocument && isExtractable) || !useStringInDocument);
			Controls.ConfigurationSelection_Area__.Hide((useStringInDocument && !isExtractable) || !useStringInDocument);
		}
		else if (!enableConfigurationSelection)
		{
			Controls.Filename_regular_expression__.SetRequired(false);
			Controls.FileNameRegEx_CaseSensitive__.SetRequired(false);
			Controls.ConfigurationSelection_Area__.SetRequired(false);
			Controls.ConfigurationSelection_Path__.SetRequired(false);
			Controls.ConfigurationSelection_Criteria__.SetRequired(false);
		}

		// Keywords recognition parameters
		isConfigurationPanelInStep = Sys.Wizard.Wizard.steps[Sys.Wizard.Wizard.currentStep].panels.indexOf(Controls.Doctype_Recognition_Keywords_Parameters_pane) !== -1;
		enableConfigurationSelection = Controls.ActivateKeywordsDoctypeRecognition__.IsChecked();
		displayConfigurationSelectionPane = enableConfigurationSelection && isConfigurationPanelInStep;
		Controls.Doctype_Recognition_Keywords_Parameters_pane.Hide(!displayConfigurationSelectionPane);
	},

	SetConfigurationSelection: function (recognitionCriteria)
	{
		var isDisableExtraction = Controls.DisableExtraction__.IsChecked();

		Controls.MatchStringWithinDocument__.SetReadOnly(isDisableExtraction);
		Controls.MatchFilenameRegex__.SetReadOnly(isDisableExtraction);
		Controls.MatchDocumentLayout__.SetReadOnly(isDisableExtraction);

		if (isDisableExtraction)
		{
			Controls.Split_DivisionMethod__.SetValue("SIMPLE");

			Controls.MatchDocumentLayout__.SetValue(false);
			Controls.MatchFilenameRegex__.SetValue(true);
			Controls.MatchStringWithinDocument__.SetValue(false);
		}
		else if (recognitionCriteria)
		{
			Controls.MatchDocumentLayout__.SetValue(recognitionCriteria === "MatchDocumentLayout");
			Controls.MatchFilenameRegex__.SetValue(recognitionCriteria === "MatchFilenameRegex");
			Controls.MatchStringWithinDocument__.SetValue(recognitionCriteria === "MatchStringWithinDocument");
		}

		ConfigurationSelectionUI.HandleConfigurationVisibility();
	},

	HandleFileNameRegExSelect: function ()
	{
		ConfigurationSelectionUI.SetConfigurationSelection("MatchFilenameRegex");
	},

	HandleUseTextInsideSelect: function ()
	{
		ConfigurationSelectionUI.SetConfigurationSelection("MatchStringWithinDocument");
	},

	HandleAutolearningSelect: function ()
	{
		ConfigurationSelectionUI.SetConfigurationSelection("MatchDocumentLayout");
	},

	Init: function ()
	{
		Controls.ConfigurationSelection_Enable__.OnChange = ConfigurationSelectionUI.HandleConfigurationVisibility;
		Controls.ActivateKeywordsDoctypeRecognition__.OnChange = ConfigurationSelectionUI.HandleConfigurationVisibility;
		Controls.MatchFilenameRegex__.OnChange = ConfigurationSelectionUI.HandleFileNameRegExSelect;
		Controls.MatchStringWithinDocument__.OnChange = ConfigurationSelectionUI.HandleUseTextInsideSelect;
		Controls.MatchDocumentLayout__.OnChange = ConfigurationSelectionUI.HandleAutolearningSelect;

		ConfigurationSelectionUI.HandleConfigurationVisibility();
	}
};

function HandleConfigurationType()
{
	var comboValue = Controls.Configuration_type__.GetValue();
	var isProduction = comboValue === "PROD";
	Controls.Simulate_delivery__.Hide(isProduction);
	Controls.Redirect_email_to__.Hide(isProduction);
	Controls.Redirect_sender_notifications__.Hide(isProduction);
	Controls.Redirect_recipient_notifications__.Hide(isProduction);
}

function HandleDefaultDeliveryMethod()
{
	//These parameters will be used to determine which delivery methods are authorized only for recipients created on the fly
	if (Controls.DefaultDeliveryMethod__.IsSelected("DefaultDelivery_MOD"))
	{
		Controls.AllowMethodMOD__.Check(true);
		Controls.AllowMethodMOD__.SetReadOnly(true);
		Controls.AllowMethodSM__.SetReadOnly(false);
		Controls.AllowMethodPORTAL__.SetReadOnly(false);
	}
	else if (Controls.DefaultDeliveryMethod__.IsSelected("DefaultDelivery_EMAIL"))
	{
		Controls.AllowMethodSM__.Check(true);
		Controls.AllowMethodMOD__.SetReadOnly(false);
		Controls.AllowMethodSM__.SetReadOnly(true);
		Controls.AllowMethodPORTAL__.SetReadOnly(false);
	}
	else if (Controls.DefaultDeliveryMethod__.IsSelected("DefaultDelivery_PORTAL"))
	{
		Controls.AllowMethodPORTAL__.Check(true);
		Controls.AllowMethodMOD__.SetReadOnly(false);
		Controls.AllowMethodSM__.SetReadOnly(false);
		Controls.AllowMethodPORTAL__.SetReadOnly(true);
	}
}

function HandleAutoCreateRecipients()
{
	var checked = Controls.AutoCreateRecipients__.IsChecked();
	Controls.Routing_advanced_pane.Hide(!checked);
	HandleDefaultDeliveryMethod();
}

function HandleSubmittedDocType()
{
	var isPDF = Controls.SubmittedDocType__.GetValue() === "pdf";
	Controls.ConfigurationSelection_Path__.Hide(isPDF);
	Controls.ConfigurationSelection_Area__.Hide(!isPDF);
	Controls.Split_DivisionMethod__.SetReadOnly(!isPDF);
	if (!isPDF)
	{
		Controls.Split_DivisionMethod__.SetValue("SIMPLE");
		Controls.Skip_Method__.SetValue("SKIP_OFFSET");
		Controls.Split_Offset__.SetValue(0);
	}
	Controls.Split_Offset__.Hide(!isPDF);

	ConfigurationSelectionUI.HandleConfigurationVisibility();
}

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
			var alternateOdd = !firstPageChecked && i % 2 !== 0;
			var alternateEven = firstPageChecked && i % 2 === 0;
			var needAlternate = alternatePageChecked && (alternateEven || alternateOdd);

			html += needAlternate ?
				'<span class="back"><i class="fa fa-file-text"></i></span>' :
				'<span class="front"><i class="fa fa-file-text"></i></span>';

			if (termsAndConditionsChecked && (tcOnEachPage || (tcOnLastPage && i === 5)))
			{
				html += '<span class="tc"><i class="fa fa-file-text"></i></span>';
			}
		}
	}
	html += "</div>";
	Controls.HTML_BackgroundPreview__.SetHTML(html);
}

function HandleGroupingMOD()
{
	var checked = Controls.MOD_Option_Grouping__.IsChecked();
	Controls.DescMODGrouping__.Hide(!checked);
	Controls.DeferredTimeAfterValidation__.Hide(!checked);
}

function HandleErrorMessage()
{
	var errorMessage = Variable.GetValueAsString("ErrorMessage");
	if (errorMessage)
	{
		Popup.Alert(Language.Translate(errorMessage));
		Controls.ConfigurationName__.SetReadOnly(false);
		Variable.SetValueAsString("ErrorMessage", "");
	}
	else if (Variable.GetValueAsString("currentStep"))
	{
		//Once the first step has been left with a correct configuration name, the configuration name cannot be changed
		//in order to avoid issues with extraction configurations
		Controls.ConfigurationName__.SetReadOnly(true);
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
		Data.SetValue("OCRJsonOverrideSettings__", "{ \"pdf-processing\": \"" + selectedPdfProcessing + "\" }");
	}
	else
	{
		Data.SetValue("OCRJsonOverrideSettings__", "");
	}
}

function DeclareHandler()
{
	Controls.AutoCreateRecipients__.OnChange = HandleAutoCreateRecipients;
	Controls.DefaultDeliveryMethod__.OnChange = HandleDefaultDeliveryMethod;
	Controls.Configuration_type__.OnChange = HandleConfigurationType;
	Controls.SubmittedDocType__.OnChange = HandleSubmittedDocType;
	Controls.Add_backgrounds__.OnChange = HandleFormattingPane;
	Controls.Use_a_specific_background_for_the_first_page__.OnChange = HandleFormattingPane;
	Controls.Alternate_background_on_front_and_back_pages__.OnChange = HandleFormattingPane;
	Controls.Add_T_C__.OnChange = HandleFormattingPane;
	Controls.Terms___conditions_position__.OnChange = HandleFormattingPane;
	Controls.MOD_Option_Grouping__.OnChange = HandleGroupingMOD;
	Controls.DisableExtraction__.OnChange = HandleDisableExtraction;
	Controls.OCR_Pdf_Processing__.OnChange = HandleOCRPdfProcessing;
}

function HandleProcessRelatedConfiguration()
{
	Lib.DD.AppDeliveries.FeedDeliveryCombo(Controls.DefaultDelivery__, ["COP"]);
	Lib.DD.AppDeliveries.LinkDeliveryComboToConfigurationsCombo(Controls.DefaultDelivery__, Controls.ProcessRelatedConfiguration__);
}

function HandleRoutingMethod()
{
	//reset
	Controls.SubmittedDocType__.Hide(false);
	Controls.Configuration_type__.Hide(false);
	Controls.Document_Type__.Hide(false);
	Controls.Family__.Hide(false);
	Controls.Routing__.Hide(false);
	Controls.Document_ArchiveDuration_MOD__.Hide(false);
	Controls.Document_ArchiveDuration_PORTAL__.Hide(false);
	Controls.Document_ArchiveDuration_FGFAXOUT__.Hide(false);
	Controls.Document_ArchiveDuration_OTHER__.Hide(false);
	Controls.DeliveryMethodToUse__.Hide(false);
	Controls.BounceBacks_Enable__.Hide(false);
	Controls.AutoCreateRecipients__.Hide(false);

	Controls.Document_ArchiveDuration_NONE__.SetLabel(Language.Translate("Document_ArchiveDuration_NONE__"));
	Sys.Wizard.Wizard.SetTranslatedTitle(3, Language.Translate("Delivery_pane"));
	var isOutbound = IsOutboundConfiguration();
	Controls.Features_pane.Hide(false);
	//set
	if (!isOutbound)
	{
		Controls.SubmittedDocType__.Hide(true);
		Controls.Document_ArchiveDuration_MOD__.Hide(true);
		Controls.Document_ArchiveDuration_PORTAL__.Hide(true);
		Controls.Document_ArchiveDuration_FGFAXOUT__.Hide(true);
		Controls.Document_ArchiveDuration_OTHER__.Hide(true);
		Controls.Features_pane.Hide(true);
		Controls.DeliveryMethodToUse__.Hide(true);
		Controls.BounceBacks_Enable__.Hide(true);
		Controls.AutoCreateRecipients__.Hide(true);
		Controls.Document_ArchiveDuration_NONE__.SetLabel(Language.Translate("InboundArchiving"));

		if (Sys.Wizard.Wizard.currentStep !== 0)
		{
			Controls.Configuration_type__.Hide(true);
			Controls.Document_Type__.Hide(true);
			Controls.Family__.Hide(true);
			Controls.Routing__.Hide(true);
			Controls.Document_ID__.Hide(true);
		}
	}
}

function Main()
{
	var steps = [
		{
			panels: [Controls.General_pane, Controls.General_advanced_options_pane, Controls.Features_pane, Controls.Configuration_Recognition_pane, Controls.Doctype_Recognition_Keywords_Parameters_pane],
			icon: "fa-cog",
			title: "General_pane",
			description: "General_pane_description",
			helpId: 1770,
			onStart: function ()
			{
				HandleConfigurationType();
				HandleSubmittedDocType();
				HandleErrorMessage();
				HandleRoutingMethod();
				ConfigurationSelectionUI.Init();
				Sys.Wizard.Tools.HandleHTMLToggle(
					Controls.MoreSubmissionOptions__,
					Controls.General_advanced_options_pane,
					Language.Translate("More options")
				);
			}
		},
		{
			panels: [Controls.Splitting_pane],
			icon: "fa-cut fa-rotate-270",
			title: "Splitting_pane",
			description: "Splitting_pane_description",
			helpId: 1771,
			onStart: SplitUI.Init
		},
		{
			panels: [Controls.Validation_pane, Controls.Formatting_pane, Controls.Advanced_formatting_pane, Controls.Advanced_validation_pane],
			icon: "fa-random",
			title: "Documents_pane",
			description: "Documents_pane_description",
			helpId: 1772,
			onStart: function ()
			{
				HandleFormattingPane();
				Sys.Wizard.Tools.HandleHTMLToggle(
					Controls.MoreFormattingOptions__,
					Controls.Advanced_formatting_pane,
					Language.Translate("More options")
				);
				Sys.Wizard.Tools.HandleHTMLToggle(
					Controls.MoreValidationOptions__,
					Controls.Advanced_validation_pane,
					Language.Translate("More options")
				);
				HandleRoutingMethod();
			}
		},
		{
			panels: [Controls.Routing_pane, Controls.Related_Document_pane, Controls.Routing_advanced_pane, Controls.MOD_delivery_pane, Controls.Advanced_mod_options,
			Controls.Portal_delivery_pane, Controls.Advanced_portal_options, Controls.Email_delivery_pane],
			icon: "fa-list-ul",
			title: "Delivery_pane",
			description: "Delivery_pane_description",
			helpId: 1773,
			onStart: function ()
			{
				HandleAutoCreateRecipients();
				HandleProcessRelatedConfiguration();
				HandleRoutingMethod();
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

				Sys.Wizard.Tools.HandleHTMLToggle(
					Controls.MoreMODOptions__,
					Controls.Advanced_mod_options,
					Language.Translate("More options")
				);
				Sys.Wizard.Tools.HandleHTMLToggle(
					Controls.MorePortalOptions__,
					Controls.Advanced_portal_options,
					Language.Translate("More options")
				);
			}
		},
		{
			panels: [Controls.Salesforce_Integration_pane],
			icon: "fa-database",
			title: "Integration_pane",
			description: "Integration_pane_description",
			helpId: 7006
		},
		{
			panels: [Controls.ArchivingSender_pane],
			icon: "fa-archive",
			title: "Archiving_pane",
			description: "Archiving_pane_description",
			helpId: 1774,
			onStart: function ()
			{
				HandleRoutingMethod();
			}
		}
	];

	Sys.Wizard.Wizard.Init({
		steps: steps,
		previousButton: Controls.Previous,
		nextButton: Controls.Next,
		wizardControl: Controls.Wizard_steps__,
		descriptionControl: Controls.Wizard_step_desc__
	});
	if (Controls.Spacer_line__)
	{
		Controls.Spacer_line__.Hide(true);
	}

	Controls.ConfigurationName__.SetReadOnly(Controls.ConfigurationName__.GetValue() === "default");

	DeclareHandler();

	Lib.DD.DocumentTypeManager.Init(Controls.Document_Type__, Controls.ConfigurationName__.GetValue());
	Lib.DD.DocumentTypeManager.FillDocumentTypeControl(null, true);
}

Main();
