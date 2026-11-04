/* eslint-disable max-depth */

var textClassifier;
var controlsToShow = [];
var forceDisableTraining = false;

var resetAvailableDocumentsTable = function ()
{
	var itemCount = Controls.AvailableForTrainingDetails__.GetItemCount();
	for (var rowIndex = 0; rowIndex < itemCount; rowIndex++)
	{
		Controls.AvailableForTrainingDetails__.GetRow(rowIndex).RemoveStyle("highlight-warning");
	}
	Controls.AvailableForTrainingDetails__.SetItemCount(0);
};

var loadTextClassifier = function ()
{
	var projectName = "sda";
	if (Controls.CustomClientIdEnabled__.IsChecked())
	{
		var environmentName = Data.GetValue("EnvironmentName__");
		if (environmentName)
		{
			projectName += environmentName;
		}
	}

	var familyName = Data.GetValue("FamilyName__");
	if (familyName)
	{
		projectName += familyName;
	}

	try
	{
		textClassifier = Sys.DocumentClassification.GetTextClassifierForProject(projectName);
		Variable.SetValueAsString("ProjectName", projectName);
		return true;
	}
	catch (error)
	{
		Controls.StartTrainingButton__.SetDisabled(true);
		Data.SetValue("NumberDocumentAvailableForTraining__", "0");
		resetAvailableDocumentsTable();
		controlsToShow.push(Controls.CognitiveServicesTrainingPane);
		controlsToShow.push(Controls.EnvironmentPane);
		displayProductionModelPanelWithoutModel();
		Popup.Alert("_ProjectNameNotValidError", true, null, "_ProjectNameNotValidTitle");
		return false;
	}
};

var orderClassifiersAlphabetically = function (classifier1, classifier2)
{
	return classifier1 && classifier1.name && classifier2 && classifier1.name
		&& classifier1.name.localeCompare(classifier2.name);
};

var fillAvailableDocuments = function (request)
{
	if (request.status < 200 || request.status > 299)
	{
		Controls.StartTrainingButton__.SetDisabled(true);
		Data.SetValue("NumberDocumentAvailableForTraining__", "0");
		resetAvailableDocumentsTable();
		controlsToShow.push(Controls.CognitiveServicesTrainingPane);
		var snackbarOptions = {
			message: Language.Translate("_environmentNotExistsWarningMessage"),
			status: "warning",
			timeout: "10000",
			closable: true
		};
		Popup.Snackbar(snackbarOptions);
		return;
	}

	var contentType = request.getResponseHeader("Content-type");
	if (contentType && contentType.indexOf("application/json") === 0)
	{
		try
		{
			var json = JSON.parse(request.responseText);
			if (json.errorContentType && json.errorContentType === "application/json")
			{
				//Error
				Log.Warn("fillAvailableDocuments : Error when trying to get available documents details");
			}
			else
			{
				if (typeof json.totalNumberOfDocuments === "number")
				{
					Data.SetValue("NumberDocumentAvailableForTraining__", json.totalNumberOfDocuments);
				}

				json.classifiers = json.classifiers.sort(orderClassifiersAlphabetically);
				if (json.classifiers)
				{
					var docTypesTable = Data.GetTable("AvailableForTrainingDetails__");
					resetAvailableDocumentsTable();
					Controls.StartTrainingButton__.SetDisabled(true);
					var numberOfValidDocumentTypes = 0;
					for (var i = 0; i < json.classifiers.length; i++)
					{
						var itemToAdd = docTypesTable.AddItem();
						itemToAdd.SetValue("DocumentTypeAvailable__", json.classifiers[i].name);
						itemToAdd.SetValue("DocumentTypeCount__", json.classifiers[i].numberOfDocuments);
						if (json.classifiers[i].notUsedForTraining)
						{
							Controls.AvailableForTrainingDetails__.GetRow(i).AddStyle("highlight-warning");
							itemToAdd.SetWarning("DocumentTypeAvailable__", Language.Translate("_Document type not used for training_warning"));
						}
						else if (Controls.StartTrainingButton__.GetDisabled() && forceDisableTraining === false)
						{
							numberOfValidDocumentTypes++;
							if (numberOfValidDocumentTypes >= 2)
							{
								Controls.StartTrainingButton__.SetDisabled(false);
							}
						}
					}
				}
			}
		}
		catch (error)
		{
			Log.Error("fillAvailableDocuments - Failed to parse returned data");
		}
	}
	controlsToShow.push(Controls.CognitiveServicesTrainingPane);
};

var fillProductionModelDetails = function (request)
{
	if (request.status < 200 || request.status > 299)
	{
		Controls.Spacer6__.Hide();
		Controls.Spacer4__.Hide();
		Controls.CurrentOverallPrecision__.Hide();
		Controls.CurrentModelDetails__.Hide();
		Controls.CurrentModelTrainingDate__.Hide();
		Controls.CurrentModelDeploymentDate__.Hide();
		Controls.NoModelInProductionDescription__.Hide(false);
		Log.Error("fillProductionModelDetails - There is an issue retrieving details for the model deployed in production. Hiding production model pane");
		return;
	}
	var contentType = request.getResponseHeader("Content-type");
	if (contentType && contentType.indexOf("application/json") === 0)
	{
		try
		{
			var json = JSON.parse(request.responseText);
			if (json.errorContentType && json.errorContentType === "application/json")
			{
				//Error
				Log.Warn("fillProductionModelDetails : Error when trying to get production model details");
			}
			else if (json.modelId && json.evaluation && json.evaluation.classificationEvaluation)
			{
				var overallPrecision = parseFloat(json.evaluation.classificationEvaluation.macroF1) * 100;
				Data.SetValue("CurrentOverallPrecision__", overallPrecision.toFixed(2) + "%");

				var classifiers = json.evaluation.classificationEvaluation.classifiers;
				classifiers = classifiers.sort(orderClassifiersAlphabetically);
				if (classifiers)
				{
					var docTypesTable = Data.GetTable("CurrentModelDetails__");
					docTypesTable.SetItemCount(0);
					for (var i = 0; i < classifiers.length; i++)
					{
						var itemToAdd = docTypesTable.AddItem();
						itemToAdd.SetValue("DocumentTypeCurrentModel__", classifiers[i].name);
						var precision = parseFloat(classifiers[i].f1) * 100;
						itemToAdd.SetValue("DocumentTypeCurrentPrecision__", (precision === 0 ? precision : precision.toFixed(2)) + "%");
					}
				}
				Controls.Spacer6__.Hide(false);
				Controls.Spacer4__.Hide(false);
				Controls.CurrentOverallPrecision__.Hide(false);
				Controls.CurrentModelDetails__.Hide(false);
				Controls.CurrentModelTrainingDate__.Hide(false);
				Controls.CurrentModelDeploymentDate__.Hide(false);
				Controls.NoModelInProductionDescription__.Hide();
			}
		}
		catch (error)
		{
			Log.Error("fillProductionModelDetails - Failed to parse returned data");
		}
	}
	controlsToShow.push(Controls.ProductionModelInfosPane);
};

var displayProductionModelPanelWithoutModel = function ()
{
	Controls.Spacer6__.Hide();
	Controls.Spacer4__.Hide();
	Controls.CurrentOverallPrecision__.Hide();
	Controls.CurrentModelDetails__.Hide();
	Controls.CurrentModelTrainingDate__.Hide();
	Controls.CurrentModelDeploymentDate__.Hide();
	Controls.NoModelInProductionDescription__.Hide(false);
	controlsToShow.push(Controls.ProductionModelInfosPane);
};

var fillProductionModel = function (request)
{
	if (request.status < 200 || request.status > 299)
	{
		displayProductionModelPanelWithoutModel();
		return;
	}
	var contentType = request.getResponseHeader("Content-type");
	if (contentType && contentType.indexOf("application/json") === 0)
	{
		try
		{
			var json = JSON.parse(request.responseText);
			if (json.errorContentType && json.errorContentType === "application/json")
			{
				//Error
				Log.Warn("fillProductionModel : Error when trying to get production model details");
			}
			else if (json.modelId)
			{
				var lastTrainedDateTime = new Date(json.lastTrainedDateTime);
				Data.SetValue("CurrentModelTrainingDate__", Sys.Helpers.Date.GetDateInUserTimezone(lastTrainedDateTime, User.utcOffset));

				var lastDeployedDateTime = new Date(json.lastDeployedDateTime);
				Data.SetValue("CurrentModelDeploymentDate__", Sys.Helpers.Date.GetDateInUserTimezone(lastDeployedDateTime, User.utcOffset));

				var regexModelName = /.+?(?=-)/;
				var modelName = json.modelId.match(regexModelName)[0];
				textClassifier.getModelDetails(modelName, fillProductionModelDetails);
			}
			else
			{
				displayProductionModelPanelWithoutModel();
			}
		}
		catch (error)
		{
			Log.Error("fillProductionModel - Failed to parse returned data");
		}
	}
};

var fillTrainedModel = function (request)
{
	// no model yet - checking for a running training (the api should return a 404 or 400 in this case)
	if (request.status < 200 || request.status > 299)
	{
		if (Variable.GetValueAsString("TrainingJobId"))
		{
			textClassifier.getTrainingJob(Variable.GetValueAsString("TrainingJobId"), fillTrainProgress);
		}
		else
		{
			Log.Error("fillTrainedModel - There is an issue retrieving details for the trained model. Hiding trained model pane");
		}
		return;
	}

	var contentType = request.getResponseHeader("Content-type");
	if (contentType && contentType.indexOf("application/json") === 0)
	{
		try
		{
			var json = JSON.parse(request.responseText);
			if (json.errorContentType && json.errorContentType === "application/json")
			{
				//Error
				Log.Warn("fillProductionModel : Error when trying to get current model details");
			}
			else if (json.modelId /*&& json.evaluation && json.evaluation.classificationEvaluation*/)
			{
				/** This part (model performance percentage display) is no more available with new version of the API.
				 *  There should have a third step (and associated button) to start the evaluation of the model.
				 *  This will not be done immediatly
				 */
				/*var overallPrecision = parseFloat(json.evaluation.classificationEvaluation.macroF1) * 100;
				Data.SetValue("OverallPrecisionAfterTraining__", overallPrecision.toFixed(2) + "%");

				var lastTrainedDateTime = new Date(json.lastTrainedDateTime);
				Data.SetValue("NewModelTrainingEndedDate__", Sys.Helpers.Date.GetDateInUserTimezone(lastTrainedDateTime, User.utcOffset));

				var delta = Data.GetValue("NewModelTrainingEndedDate__").getTime() - Data.GetValue("NewModelTrainingStartedDate__").getTime();
				var deltaInSeconds = Math.abs(delta / 1000);
				Data.SetValue("NewModelTotalTrainingTime__", secondsToHms(deltaInSeconds));

				var classifiers = json.evaluation.classificationEvaluation.classifiers;
				if (classifiers)
				{
					classifiers = classifiers.sort(orderClassifiersAlphabetically);
					var docTypesTable = Data.GetTable("NewModelDetails__");
					docTypesTable.SetItemCount(0);
					for (var i = 0; i < classifiers.length; i++)
					{
						var itemToAdd = docTypesTable.AddItem();
						itemToAdd.SetValue("DocumentTypeNewModel__", classifiers[i].name);
						var precision = parseFloat(classifiers[i].f1) * 100;
						itemToAdd.SetValue("DocumentTypeNewPrecision__", (precision === 0 ? precision : precision.toFixed(2)) + "%");
					}
				}*/
				controlsToShow.push(Controls.TrainedModelStatsPane);
				controlsToShow.push(Controls.CancelDeploymentButton);
			}
		}
		catch (error)
		{
			Log.Error("fillTrainedModel - Failed to parse returned data");
		}
	}
};

var fillTrainProgress = function (request)
{
	// considering training job expired
	if ((request.status < 200 || request.status > 299) && request.data)
	{
		return;
	}
	var contentType = request.getResponseHeader("Content-type");
	if (contentType && contentType.indexOf("application/json") === 0)
	{
		try
		{
			var json = JSON.parse(request.responseText);
			if (json.errorContentType && json.errorContentType === "application/json")
			{
				//Error
				Log.Warn("fillTrainProgress : Error when trying to get current model details");
			}
			else if (json.jobId && json.status)
			{
				if (!json.result || !json.result.trainStatus)
				{
					return;
				}
				// TrainingSubmittedAt__ is set by validationscript...

				var trPercentage = json.result.trainStatus.percentComplete ? json.result.trainStatus.percentComplete : 0;
				var trStatus = trPercentage + "%";
				Data.SetValue("TrainingStatusPercentage__", trStatus);

				var trElapsedTime = json.result.trainStatus.elapsedTime ? json.result.trainStatus.elapsedTime : Language.Translate("waiting");
				Data.SetValue("TrainingStatusElapsedTime__", trElapsedTime);

				if (json.status === "succeeded")
				{
					textClassifier.getModelDetails(json.result.trainedModelLabel, fillTrainedModel);
					return;
				}

				controlsToShow.push(Controls.TrainingInProgressPane);
			}
		}
		catch (error)
		{
			Log.Error("checkIfJobRunningAndFillForm - Failed to parse returned data");
		}
	}
};

var fillFamilyControlThenExecuteScript = function ()
{
	//Environment has already been loaded, fill and display the already saved infos
	if (ProcessInstance.state !== null)
	{
		Controls.CustomClientIdEnabled__.SetReadOnly(true);
		Controls.FamilyName__.Hide(true);
		Controls.EnvironmentName__.Hide(true);

		var loadedFamily = Variable.GetValueAsString("FamilyName");
		if (loadedFamily)
		{
			Controls.FamilyName__.SetReadOnly(true);
			Controls.FamilyName__.Hide(false);
		}
		if (Controls.CustomClientIdEnabled__.IsChecked() === true)
		{
			//Loaded environment is a custom client id, display the custom client id
			Controls.EnvironmentName__.Hide(false);
			Controls.EnvironmentName__.SetReadOnly(true);
		}
		Main();
	}
	//Environment has not been loaded yet since it's a new process, retrieve the available families
	else
	{
		var CallBackWithFamiliesResults = function (families)
		{
			families.unshift("=_nofamily");
			Controls.FamilyName__.SetAvailableValues(families);
			Main();
		};
		Lib.DD_Client.RetrieveFamiliesAsOptions(CallBackWithFamiliesResults);
	}
};

var fillForm = function ()
{
	//Get last model deployed
	textClassifier.getLastDeployment(fillProductionModel);

	//New process
	if (ProcessInstance.state === null)
	{
		textClassifier.getAvailableDocuments(fillAvailableDocuments);
	}
	//Training in progress or ended, but not deployed
	else if (ProcessInstance.state < 100)
	{
		//If there is a model name, that means validationscript has triggered a training at some point
		if (Variable.GetValueAsString("TrainedModel"))
		{
			textClassifier.getModelDetails(Variable.GetValueAsString("TrainedModel"), fillTrainedModel);
		}
		Controls.EnvironmentName__.SetReadOnly(true);
		Controls.LoadEnvironment__.SetDisabled(true);
	}
	//Training deployed, show trained model stats and production model details
	else if (ProcessInstance.state === 100)
	{
		Controls.StartDeploymentButton__.SetDisabled(true);
		Controls.CancelDeploymentButton.SetDisabled(true);
		controlsToShow.push(Controls.TrainedModelStatsPane);
		controlsToShow.push(Controls.CancelDeploymentButton);
		controlsToShow.push(Controls.SuccessBannerPane);
		Controls.EnvironmentName__.SetReadOnly(true);
		Controls.LoadEnvironment__.SetDisabled(true);
	}
	//Process has failed or has been cancelled, displaying only the production model details
	else
	{
		Controls.StartDeploymentButton__.SetDisabled(true);
		Controls.StartTrainingButton__.SetDisabled(true);
		Controls.CancelDeploymentButton.SetDisabled(true);
		Controls.EnvironmentName__.SetReadOnly(true);
		Controls.LoadEnvironment__.SetDisabled(true);

		//Process has been cancelled
		controlsToShow.push(Controls.WarningBannerPane);
	}

	controlsToShow.push(Controls.EnvironmentPane);

	//Process has failed
	if (Variable.GetValueAsString("ErrorMessage"))
	{
		Popup.Alert("_ErrorOccuredFailedProcessLabel", true, null, "_ErrorOccuredFailedProcessTitle");
	}
};

var secondsToHms = function (seconds)
{
	if (Number.isNaN(seconds))
	{
		return "";
	}

	var h = Math.floor(seconds / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 3600 % 60);

	return Sys.Helpers.String.PadLeft(h, "0", 2) + ":" + Sys.Helpers.String.PadLeft(m, "0", 2) + ":" + Sys.Helpers.String.PadLeft(s, "0", 2);
};

var leaveForm = function ()
{
	ProcessInstance.Quit("quit");
};



var displayForm = function ()
{
	for (var i = 0; i < controlsToShow.length; i++)
	{
		controlsToShow[i].Hide(false);
	}
	Controls.StartTrainingButton__.Wait(false);
};

var hideForm = function ()
{
	for (var i = 0; i < controlsToShow.length; i++)
	{
		controlsToShow[i].Hide(true);
	}
};
Controls.LoadEnvironment__.OnClick = function ()
{
	Main();
};

Controls.CustomClientIdEnabled__.OnChange = function ()
{
	var useCustomClientId = Controls.CustomClientIdEnabled__.IsChecked();
	Controls.EnvironmentName__.Hide(!useCustomClientId);
	Controls.LoadEnvironment__.Hide(!useCustomClientId);

	// If we disable the usage of the custom id, we want to reload the data without using the custom id
	if (!useCustomClientId)
	{
		Main();
	}
};

Controls.FamilyName__.OnChange = function ()
{
	Main();
};

var checkIfJobRunningAndFillForm = function (request)
{
	//Service is not available
	if (request.status === 500)
	{
		Controls.StartTrainingButton__.Wait(false);
		Popup.Alert("_ErrorConnectingToServiceLabel", true, ProcessInstance.isDesignActive ? null : leaveForm, "_ErrorConnectingToServiceTitle");
		return;
	}
	// Training job does not exist
	if (request.status < 200 || request.status > 299)
	{
		fillForm();
		return;
	}
	var contentType = request.getResponseHeader("Content-type");
	if (contentType && contentType.indexOf("application/json") === 0)
	{
		try
		{
			var json = JSON.parse(request.responseText);
			if (json.errorContentType && json.errorContentType === "application/json")
			{
				//Error
				Log.Warn("checkIfJobRunningAndFillForm : Error when trying to get all training jobs");
			}
			else if (json.jobs && json.jobs.length > 0)
			{
				for (var i = 0; i < json.jobs.length; i++)
				{
					var status = json.jobs[i].status;
					var jobId = json.jobs[i].jobId;
					if ((status === "running" || status === "waiting") && jobId !== Variable.GetValueAsString("TrainingJobId"))
					{
						//Training already running, leaving the form
						Popup.Alert("_JobAlreadyRunningDescription", false, null, "_JobAlreadyRunningTitle");
						forceDisableTraining = true;
						break;
					}
				}
				fillForm();
			}
			// Job list empty, we still want to fill the form with panels
			else
			{
				fillForm();
			}
		}
		catch (error)
		{
			Log.Error("checkIfJobRunningAndFillForm - Failed to parse returned data");
		}
	}
};



function Main()
{

	hideForm();
	controlsToShow = [];
	forceDisableTraining = false;
	Controls.StartTrainingButton__.Wait(true);
	var textClassifierLoaded = loadTextClassifier();

	if (!textClassifierLoaded)
	{
		Controls.StartTrainingButton__.Wait(false);
		displayForm();
		return;
	}

	if (ProcessInstance.state === null)
	{
		//Check if a training job is running. If so, display a popup warning the user and leave the form
		textClassifier.getTrainingJobs(checkIfJobRunningAndFillForm);
	}
	else
	{
		fillForm();
	}

	if (Query.IsPendingRequest())
	{
		Query.NotifyOnCurrentRequestsDone(displayForm);
	}
	else
	{
		displayForm();
	}
}

ProcessInstance.SetSilentChange(true);
fillFamilyControlThenExecuteScript();
