if (!Variable.GetValueAsString("tableParameters"))
{
	var setEmptyParameters = true;
	Log.Info("AncestorsRuid: " + Variable.GetValueAsString("AncestorsRuid"));

	Query.SetSpecificTable("CDNAME#DD - Application Settings__");
	Query.SetFilter("Ruid=" + Variable.GetValueAsString("AncestorsRuid"));
	Query.SetAttributesList("OCRJsonOverrideSettings__");
	if (Query.MoveFirst())
	{
		var trpt = Query.MoveNext();
		if (Query.GetLastError() != 0)
		{
			Log.Info("Error on query table: " + Query.GetLastErrorMessage());
		}
		else if (trpt)
		{
			var processVars = trpt.GetUninheritedVars();
			var ocrOptions = processVars.GetValue_String("OCRJsonOverrideSettings__", 0);
			Log.Info("ocrOptions: " + ocrOptions);
			if (ocrOptions)
			{
				Variable.SetValueAsString("tableParameters", "{ \"ocrjsonoverridesettings\":" + JSON.stringify(ocrOptions) + "}");
				setEmptyParameters = false;
			}
		}
	}
	if (setEmptyParameters)
	{
		Variable.SetValueAsString("tableParameters", "");
	}
}