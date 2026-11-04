
Process.SetHelpId("7015");

var FillFamilyControl = function ()
{
	function CallBackWithFamiliesResults(families)
	{
		families.unshift("=_default");
		Controls.FamilyName__.SetAvailableValues(families);
	}
	Lib.DD_Client.RetrieveFamiliesAsOptions(CallBackWithFamiliesResults);
};

var aiManager = {
	deleteKNN: function (clientId, callback)
	{
		var requestData = {
			"client_id": clientId
		};
		//Call WS to delete all AI data for this account
		Query.HTTPQuery({
			method: "POST",
			targetURL: "GuessEmailType",
			urlName: "UrlResetAI",
			headers: {
				"Content-Type": "application/json"
			},
			data: JSON.stringify(requestData),
			timeout: 5000,
			callback: callback
		});
	},
	deleteACS: function (projectName, callback)
	{
		var textClassifier = Sys.DocumentClassification.GetTextClassifierForProject(projectName);
		textClassifier.deleteProject(callback);
	}
};

var dialogManager = {
	getMainAccountId: function ()
	{
		if (!User.dn)
		{
			throw "User.dn empty";
		}

		var regex = /ou=([^,]+),ou=ESK,s=eoo/;
		var dnMatches = regex.exec(User.dn);
		if (!dnMatches || dnMatches.length < 2)
		{
			throw "User.dn not consistent";
		}

		return dnMatches[1];
	},
	computeUniqueClientId: function (customClientId)
	{
		if (!User)
		{
			throw "Cannot get client id if no User instanciated";
		}
		var mainaccountID = this.getMainAccountId();
		mainaccountID = mainaccountID.toLowerCase();
		var clientId = customClientId ? customClientId.toLowerCase() + "-" + mainaccountID : mainaccountID;
		var regexOnlyAplhanumeric = /^[a-z0-9][a-z0-9\\.\\-]{1,61}[a-z0-9]$/;
		if (!regexOnlyAplhanumeric.test(clientId))
		{
			throw "Wrong client id - only alphanumeric character is allowed and should be lowercase: " + clientId;
		}

		return clientId;
	},
	fillConfirmAIDeletion: function (dialog)
	{
		var confirmationMessage = dialog.AddDescription("confirmationMessage", "");
		confirmationMessage.SetText("_confirmationMessage");

		dialog.AddSeparator();
		var clientIDControl = dialog.AddText("clientIDText", "_clientID", "200px");
		clientIDControl.SetHelpData(null, "7022", "HTML Format");

		dialog.AddSeparator();
		var confirmationCheckBox = dialog.AddCheckBox("confirmationCheckBox", "");
		confirmationCheckBox.SetText("_confirmationCheckBox");
		dialog.RequireControl("confirmationCheckbox", true);

		var customClientId = Sys.Helpers.TryCallFunction("Lib.DD.Customization.Common.SetClientId");
		if (customClientId)
		{
			clientIDControl.SetValue(customClientId);
		}
	},
	validateConfirmAIDeletion: function (dialog)
	{
		var isChecked = dialog.GetControl("confirmationCheckBox").GetValue();
		if (isChecked)
		{
			return true;
		}
		dialog.GetControl("confirmationCheckBox").SetError("This field is required!");
		return false;
	},
	callbackCommitAIDeletion: function (xmlHttpRequest)
	{
		if (xmlHttpRequest.status !== 200)
		{
			var errorMessage = Language.Translate("Error while reseting SDA AI ") + xmlHttpRequest.status + " " + xmlHttpRequest.statusText;
			Log.Error(errorMessage);
			Log.Error(xmlHttpRequest.responseText);
			Popup.Alert(errorMessage, true);
			return;
		}

		var response;
		try
		{
			response = JSON.parse(xmlHttpRequest.responseText);
			if (response.deletion || response.deleted === true)
			{
				Log.Info("SDA AI reset done");
				Popup.Alert("_SDA AI reset done", false, null, "_SDA AI reset done title");
			}
			else
			{
				Log.Info("SDA AI : no data to delete");
				Popup.Alert("_SDA AI : no data to delete", false, null, "_SDA AI no data title");
			}
		}
		catch (e)
		{
			Log.Error("Error while parsing reset_ai response as JSON: " + e);
			Log.Error(xmlHttpRequest.responseText);
		}
	},
	commitConfirmAIDeletion: function (dialog)
	{

		if (Controls.Document_type_guessing_classifier__.GetValue() === "ACS")
		{
			var projectName = "sda";
			var clientId = dialog.GetControl("clientIDText").GetValue();
			if (clientId)
			{
				projectName += clientId;
			}
			aiManager.deleteACS(projectName, dialogManager.callbackCommitAIDeletion);
		}
		else if (Controls.Document_type_guessing_classifier__.GetValue() === "GPT")
		{
			return true;
		}
		else
		{
			var clientId = dialogManager.computeUniqueClientId(dialog.GetControl("clientIDText").GetValue());
			aiManager.deleteKNN(clientId, dialogManager.callbackCommitAIDeletion);
		}
		return true;
	},
	confirmAIDeletionPopup: function ()
	{
		return Popup.Dialog("Delete AI data for this account", null, this.fillConfirmAIDeletion, this.commitConfirmAIDeletion, this.validateConfirmAIDeletion, null);
	}
};

Controls.DeleteAIData__.OnClick = function ()
{
	return dialogManager.confirmAIDeletionPopup();
};

function refreshDeleteAIDataButtonVisibility()
{
	var familyNameFilled = Controls.FamilyName__.GetValue() != null && Controls.FamilyName__.GetValue() !== "";
	var shouldHideDeleteAIData = familyNameFilled || Controls.Document_type_guessing_classifier__.GetValue() === "GPT";
	Controls.DeleteAIData__.Hide(shouldHideDeleteAIData);
}

function refreshKeepTrainingKnnVisibility()
{
	var shouldHideKeepTrainingKnn = Controls.Document_type_guessing_classifier__.GetValue() === "v1alpha1";
	Controls.KeepTrainingKnn__.Hide(shouldHideKeepTrainingKnn);
}

function refreshTrainKnnOnTouchlessVisibility()
{
	var knn = Controls.Document_type_guessing_classifier__.GetValue() === "v1alpha1";
	var shouldHideTrainKnnOnTouchless = !knn && !Controls.KeepTrainingKnn__.IsChecked();
	if (shouldHideTrainKnnOnTouchless)
	{
		Controls.TrainKnnOnTouchless__.Check(false);
	}
	Controls.TrainKnnOnTouchless__.Hide(shouldHideTrainKnnOnTouchless);
}

function refreshDocument_type_guessingVisibility()
{
	var knn = Controls.Document_type_guessing_classifier__.GetValue() === "v1alpha1";
	var shouldHideDocument_type_guessing = !knn && !Controls.KeepTrainingKnn__.IsChecked();
	Controls.Document_type_guessing__.Hide(shouldHideDocument_type_guessing);
	refreshUseEmailSubjectIfBodyIsEmptyVisibility();
};

function refreshUseEmailSubjectIfBodyIsEmptyVisibility()
{
	var isEmailAnalysis = Controls.Document_type_guessing__.GetValue() === "EMAIL";
	var isDocumentTypeGuessingVisible = Controls.Document_type_guessing__.IsVisible();
	Controls.UseEmailSubjectIfBodyIsEmpty__.Hide(!isEmailAnalysis || !isDocumentTypeGuessingVisible);
}

function displayEnable_autolearningWhenActivated()
{
	let Enable_autolearningActivated = Controls.Enable_autolearning__.GetValue() === true;
	Controls.Enable_autolearning__.Hide(!Enable_autolearningActivated);
}

function LoadOwnershipForwardList()
{
	if (Controls.Ownership_forward_list__)
	{
		Controls.Ownership_forward_list__.SetItemCount(0);
		var ownershipForwardListRaw = Data.GetValue("Ownership_forward_list_JSON__");
		if (ownershipForwardListRaw)
		{
			try
			{
				var ownershipForwardList = JSON.parse(ownershipForwardListRaw);
				for (var userOrGroup of ownershipForwardList)
				{
					var currentRow = Controls.Ownership_forward_list__.AddItem();
					currentRow.SetValue("Col_user__", userOrGroup.id);
					currentRow.SetValue("Col_display_name__", userOrGroup.displayName);
				}
			}
			catch (Exception)
			{
				Log.Error("Error during parsing of ownership forward list");
			}
		}
	}
}

function FillERPConnectorsCallback()
{
	const err = this.GetQueryError();
	if (err)
	{
		Popup.Alert(err);
		return;
	}

	const nbRecords = this.GetRecordsCount();
	const existingERPs = ["="];
	const connectorIdSet = [""];//add empty value to the set to avoid issue when current choice is empty string
	const currentChoice = Data.GetValue("ERPConnector__") || "";

	for (let i = 0; i < nbRecords; i++)
	{
		const connectorId = this.GetQueryValue("ConnectorId__", i);
		existingERPs.push(`${connectorId}=${connectorId}`);
		connectorIdSet.push(connectorId);
	}
	Controls.ERPConnector__.SetAvailableValues(existingERPs);
	if (connectorIdSet.indexOf(currentChoice) === -1 && !existingERPs.some(existingERP => existingERP.indexOf(currentChoice) !== -1))
	{
		Data.SetValue("ERPConnector__", "");
		Controls.ERPConnector__.SetError("_Previously selected {0} ERP has been removed", currentChoice);
		RefreshERPExtensionFields();
	}
}

function LoadERPConnector()
{
	ProcessInstance.SetSilentChange(true);
	Query.DBQuery(FillERPConnectorsCallback, "Sys_PartnerConnectors__", "", "", null, 100);
	Sys.Helpers.TryCallFunction("Lib.AP.Customization.Wizard.OnHTMLScriptEnd");
	ProcessInstance.SetSilentChange(false);
}

function SerializeOwnershipForwardList()
{
	if (Controls.Ownership_forward_list__)
	{
		var ownershipForwardList = [];
		for (let i = 0; i < Controls.Ownership_forward_list__.GetItemCount(); i++)
		{
			var item = Controls.Ownership_forward_list__.GetItem(i);
			if (item.GetValue("Col_user__"))
			{
				var userOrGroup = {
					id: item.GetValue("Col_user__"),
					displayName: item.GetValue("Col_display_name__")
				};
				ownershipForwardList.push(userOrGroup);
			}
		}
		Data.SetValue("Ownership_forward_list_JSON__", JSON.stringify(ownershipForwardList));
	}
}

Controls.KeepTrainingKnn__.OnChange = function ()
{
	refreshDocument_type_guessingVisibility();
	refreshTrainKnnOnTouchlessVisibility();
};

Controls.Document_type_guessing__.OnChange = function ()
{
	refreshUseEmailSubjectIfBodyIsEmptyVisibility();
};

Controls.Document_type_guessing_classifier__.OnChange = function ()
{
	refreshKeepTrainingKnnVisibility();
	refreshDocument_type_guessingVisibility();
	refreshTrainKnnOnTouchlessVisibility();
	refreshDeleteAIDataButtonVisibility();

	if (Controls.Document_type_guessing_classifier__.GetValue() === "ACS")
	{
		Popup.Alert("_ACS prediction will work only if a model has been deployed for each environment", false, null, "_Enable ACS prediction title");
	}
};

var refreshRemoveSetAsideVisibility = function ()
{
	const isCIM = (Data.GetValue("FamilyName__") || "").toLowerCase().startsWith("customer inquiries");
	Controls.Remove_Set_Aside_On_New_Message__.Hide(!isCIM);
};

Controls.FamilyName__.OnChange = function ()
{
	refreshDeleteAIDataButtonVisibility();
	refreshRemoveSetAsideVisibility();
};

var RefreshSalesforceFields = function ()
{
	var isEnabled = Controls.Enable_Salesforce_Integration__.IsChecked();

	Controls.Salesforce_Login_URL_Alias__.Hide(!isEnabled);
	Controls.Salesforce_Endpoint_URL_Alias__.Hide(!isEnabled);
	Controls.Salesforce_client_id__.Hide(!isEnabled);
	Controls.Salesforce_client_secret__.Hide(!isEnabled);

	Controls.Salesforce_Login_URL_Alias__.SetRequired(isEnabled);
	Controls.Salesforce_Endpoint_URL_Alias__.SetRequired(isEnabled);
	Controls.Salesforce_client_id__.SetRequired(isEnabled);
	Controls.Salesforce_client_secret__.SetRequired(isEnabled);
};

var RefreshERPExtensionFields = function ()
{
	var isEnabled = !!Controls.ERPConnector__.GetValue();

	Controls.ERP_Extension_Base_URL__.Hide(!isEnabled);
	Controls.ERP_Extension_User__.Hide(!isEnabled);
	Controls.ERP_Extension_Password__.Hide(!isEnabled);

	Controls.ERP_Extension_Base_URL__.SetRequired(isEnabled);
	Controls.ERP_Extension_User__.SetRequired(isEnabled);
	Controls.ERP_Extension_Password__.SetRequired(isEnabled);

};

var RefreshOMIntegrationPanel = function ()
{
	if (Controls.OMConfigurationName__.GetValue())
	{
		Controls.EnableASNQueryInSAP__.Hide(false);
	}
	else if (Controls.EnableASNQueryInSAP__.IsVisible())
	{
		Controls.EnableASNQueryInSAP__.Hide(true);
	}
};

var InitWorkflowPanel = function ()
{
	if (!ProcessInstance.id)
	{
		Controls.Remove_Set_Aside_On_New_Message__.Check(true);
	}
	refreshRemoveSetAsideVisibility();
};

Controls.Enable_Salesforce_Integration__.OnChange = function ()
{
	RefreshSalesforceFields();
};

Controls.ERPConnector__.OnChange = function ()
{
	RefreshERPExtensionFields();
};

Controls.OMConfigurationName__.OnChange = function ()
{
	RefreshOMIntegrationPanel();
};

Controls.Save.OnClick = function ()
{
	SerializeOwnershipForwardList();
	ProcessInstance.SaveAndQuit("Save");
};

function Main()
{
	InitWorkflowPanel();
	RefreshSalesforceFields();
	RefreshERPExtensionFields();
	LoadERPConnector();
	FillFamilyControl();
	refreshKeepTrainingKnnVisibility();
	refreshDocument_type_guessingVisibility();
	refreshTrainKnnOnTouchlessVisibility();
	refreshDeleteAIDataButtonVisibility();
	displayEnable_autolearningWhenActivated();
	RefreshOMIntegrationPanel();
	LoadOwnershipForwardList();
}

Main();
