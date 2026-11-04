function Main()
{
	InitFormControls();

	ManageErrorDisplaying();
	ManageSummaryPane();

	if (ProcessInstance.isDesignActive)
	{
		DisplayAllControlsAndPane(true);
	}
}

function InitFormControls()
{
	Controls.Error_pane.Hide(true);
	Controls.Summary_pane.Hide(true);

	DisplayCounters(true);
}

function ManageErrorDisplaying()
{
	var errorKeyOnValidation = Variable.GetValueAsString("ErrorKeyOnValidation__");
	if (errorKeyOnValidation)
	{
		var errorTranslated = Language.Translate(errorKeyOnValidation);
		Controls.Error_field__.SetLabel(errorTranslated);
		Controls.Error_pane.Hide(false);
	}
	else
	{
		Controls.Error_pane.Hide(true);
	}
}

function ManageSummaryPane()
{
	var isProcessProcessing = ProcessInstance.state === 50 || ProcessInstance.state === 90;
	var isProcessFinished = ProcessInstance.state >= 100;

	var showSummaryPane = isProcessProcessing || isProcessFinished;
	Controls.Summary_pane.Hide(!showSummaryPane);

	if (showSummaryPane)
	{
		// Fill datetimes components
		var submitDateTime = Data.GetValue("SubmitDateTime");
		var completionDateTime = Data.GetValue("CompletionDateTime");
		Controls.SubmitDateTime__.SetText(submitDateTime);
		Controls.CompletedDateTime__.SetText(completionDateTime);

		// Fill translated state
		var translatedState = Data.GetValue("StateTranslated");
		if (translatedState !== null && translatedState !== "")
		{
			// Dirty CSS computing to have a nice HTML content working on every skins
			// TODO: To be remove one day when the HTML content will be ok in every skins
			var cssColorName = ProcessInstance.state === 200 ? "color2" : "default";
			var computedCSSClass = "input text-size-S text-color-" + cssColorName + " readonly";

			Controls.State__.SetHTML("<span class=\"" + computedCSSClass + "\">" + translatedState + "</span>");
		}
		else
		{
			Controls.State__.SetHTML("");
		}

		// Hide counters if processing because they are wrong
		DisplayCounters(!isProcessProcessing);
	}
}

function DisplayCounters(display)
{
	Controls.CounterSentEmail__.Hide(!display);
}

function DisplayAllControlsAndPane(display)
{
	Controls.Error_pane.Hide(!display);
	Controls.Summary_pane.Hide(!display);

	DisplayCounters(display);
}

Main();
