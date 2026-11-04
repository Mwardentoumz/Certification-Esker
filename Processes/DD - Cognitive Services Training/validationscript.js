
var NUMBER_RETRIES_PROJECT_CREATION = 5;

var language;
var textClassifier;

var currentUser = Users.GetUser(Data.GetValue("OwnerId"));
var currentUserVars = currentUser ? currentUser.GetVars() : null;
if (currentUserVars)
{
	language = currentUserVars.GetValue_String("Culture", 0);
}

function loadTextClassifier()
{
	var projectName = Variable.GetValueAsString("ProjectName");

	try
	{
		textClassifier = Sys.DocumentClassification.GetTextClassifierForProject(projectName);
		return true;
	}
	catch (error)
	{
		Variable.SetValueAsString("ErrorMessage", "textClassifier can't be loaded correctly, please check your project name : " + projectName);
		return false;
	}
}

function isProjectCreated(jobId)
{
	for (var i = 0; i < NUMBER_RETRIES_PROJECT_CREATION; i++)
	{
		var httpResponse = textClassifier.getProjectJob(jobId);
		if (httpResponse.status >= 200 && httpResponse.status <= 299)
		{
			if (httpResponse.data)
			{
				try
				{
					var jobStatus = JSON.parse(httpResponse.data).status;
					if (jobStatus === "succeeded")
					{
						Log.Info("Project has been created successfully");
						return true;
					}
					Log.Info("Project not created yet, retry " + i + "/" + NUMBER_RETRIES_PROJECT_CREATION);
					Process.Sleep(5);
				}
				catch (error)
				{
					Variable.SetValueAsString("ErrorMessage", "isProjectCreated - Error when parsing json : " + error);
				}
			}
			else
			{
				Variable.SetValueAsString("ErrorMessage", "isProjectCreated - Project status response isn't as expected, abort training");
			}
		}
		else
		{
			Variable.SetValueAsString("ErrorMessage", "isProjectCreated - Couldn't get project status, abort training");
		}
	}
	return false;
}

function createOrUpdateProject(callback)
{
	var httpResponse = textClassifier.createOrUpdateProject(language);
	if (httpResponse.status >= 200 && httpResponse.status <= 299)
	{
		Log.Info("Text Classification - creation of a new project succeeded : " + JSON.stringify(httpResponse.data));

		if (httpResponse.data)
		{
			try
			{
				var jobId = JSON.parse(httpResponse.data).jobId;
				if (jobId && isProjectCreated(jobId))
				{
					callback();
				}
				else
				{
					Variable.SetValueAsString("ErrorMessage", "createOrUpdateProject - Couldn't get project creation status, abort training");
				}
			}
			catch (error)
			{
				Variable.SetValueAsString("ErrorMessage", "createOrUpdateProject - Error when parsing json : " + error);
			}
		}
		else
		{
			Variable.SetValueAsString("ErrorMessage", "createOrUpdateProject - Project creation response isn't as expected, abort training");
		}
	}
	else
	{
		Variable.SetValueAsString("ErrorMessage", "createOrUpdateProject - Error while creating a new project : " + httpResponse.lastErrorMessage);
	}
}

function setTrainingStatus(jobId)
{
	/*
	 * a training job has an expiration date... so if we want to fetch data about the model in the customscript
	 * we need to persist the model name here and the only way to do so is to query the job status
	*/
	Variable.SetValueAsString("TrainingJobId", jobId);
	var httpResponse = textClassifier.getTrainingJob(jobId);
	if (httpResponse.status >= 200 && httpResponse.status <= 299 && httpResponse.data)
	{
		try
		{
			var data = JSON.parse(httpResponse.data);
			if (data.status == "succeeded")
			{
				Variable.SetValueAsString("TrainingJobId", null);
			}
			if (data.expirationDateTime)
			{
				Variable.SetValueAsString("TrainingJobExpirationDateTime", data.expirationDateTime);
				Data.SetValue("ValidityDateTime", new Date(data.expirationDateTime));
			}
			if (data.result && data.result.trainedModelLabel)
			{
				Variable.SetValueAsString("TrainedModel", data.result.trainedModelLabel);
				return;
			}
			Variable.SetValueAsString("ErrorMessage", "Could not retrieve model name for training job " + jobId);
		}
		catch (err)
		{
			Log.Error("Could not retrieve model name for training job " + jobId);
		}
	}
}

function triggerTraining()
{
	var httpResponse = textClassifier.triggerTraining(language);
	if (httpResponse.status >= 200 && httpResponse.status <= 299)
	{
		Log.Info("triggerTraining - creation of a new training job succeeded : " + JSON.stringify(httpResponse.data));
		if (httpResponse.data)
		{
			try
			{
				var jobId = JSON.parse(httpResponse.data).jobId;
				if (jobId)
				{
					var currentDate = new Date();
					Data.SetValue("NewModelTrainingStartedDate__", currentDate);
					Data.SetValue("TrainingSubmittedAt__", currentDate);
					setTrainingStatus(jobId);
					Process.PreventApproval();
				}
				else
				{
					Variable.SetValueAsString("ErrorMessage", "triggerTraining - Couldn't get training job creation status, abort training");
				}
			}
			catch (err)
			{
				Variable.SetValueAsString("ErrorMessage", "triggerTraining - Couldn't get training job creation status, abort training");
			}

		}
		else
		{
			Variable.SetValueAsString("ErrorMessage", "triggerTraining - Training job creation response isn't as expected, abort training");
		}
	}
	else
	{
		Log.Warn(httpResponse.status);
		var genericMessage = "triggerTraining - Error while creating a new training job : " + httpResponse.lastErrorMessage;
		var message = genericMessage;
		if (httpResponse.data)
		{
			if (httpResponse.data.indexOf("Train request is currently in progress") > -1)
			{
				message = "Train request is currently in progress.";
			}
			else
			{
				message = httpResponse.data;
			}
		}

		Variable.SetValueAsString("ErrorMessage", message);
	}
}

function triggerDeployment()
{
	var httpResponse = textClassifier.triggerDeployment(Variable.GetValueAsString("TrainedModel"));
	if (httpResponse.status >= 200 && httpResponse.status <= 299)
	{
		if (httpResponse.data)
		{
			try
			{
				var jobId = JSON.parse(httpResponse.data).jobId;
				if (jobId)
				{
					var currentDate = new Date();
					Data.SetValue("CurrentModelDeploymentDate__", currentDate);
				}
			}
			catch (err)
			{
				Variable.SetValueAsString("ErrorMessage", "triggerDeployment - Deployment job creation response isn't as expected, abort Deployment");
			}
		}
		else
		{
			Variable.SetValueAsString("ErrorMessage", "triggerDeployment - Deployment job creation response isn't as expected, abort Deployment");
		}
	}
	else
	{
		Log.Warn(httpResponse.status);
		var genericMessage = "triggerDeployment - Error while creating a new deployment job : " + httpResponse.lastErrorMessage;
		var message = genericMessage;
		if (httpResponse.data)
		{
			if (httpResponse.data.indexOf("Deployment request is currently in progress") > -1)
			{
				message = "Deployment request is currently in progress.";
			}
			else
			{
				message = httpResponse.data;
			}
		}
		Variable.SetValueAsString("ErrorMessage", message);
	}
}

function Main()
{
	Variable.SetValueAsString("ErrorMessage", "");
	var classifierLoaded = loadTextClassifier();
	if (!classifierLoaded)
	{
		return;
	}

	var actionName = Data.GetActionName();
	if (actionName === "StartTrainingButton__")
	{
		createOrUpdateProject(triggerTraining);
		Variable.SetValueAsString("FamilyName", Data.GetValue("FamilyName__"));
	}
	else if (actionName === "StartDeploymentButton__")
	{
		triggerDeployment();
	}
}

Main();