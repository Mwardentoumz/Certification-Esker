function UpdateConfigurationNameRelatedField()
{
	function CallBackQueryPorcessSelected()
	{
		var processSelected = "";
		var err = this.GetQueryError();
		if (err)
		{
			Popup.Alert(err);
			return;
		}

		processSelected = this.GetQueryValue("ProcessSelected__");
		if (Controls.Target_Process__.GetValue() !== processSelected)
		{
			Controls.Target_Process__.SetValue(processSelected);
		}
	}

	var configurationName = Controls.SDA_Doc_Type__.GetValue();
	var configurationNameFIlter = Sys.Helpers.LdapUtil.FilterEqual("ConfigurationName__", configurationName);

	Query.DBQuery(CallBackQueryPorcessSelected, "DD - Application Settings__", "ProcessSelected__", configurationNameFIlter.toString(), null, 1);
}

function Main()
{
	Controls.SDA_Doc_Type__.OnChange = function ()
	{
		UpdateConfigurationNameRelatedField();
	};
	UpdateConfigurationNameRelatedField();
	Controls.Target_Process__.Hide(true);
}

Main();