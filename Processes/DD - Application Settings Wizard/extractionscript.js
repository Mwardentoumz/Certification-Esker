
//Force wizard to display splitting step each time a new document is loaded
function GoToSplittingStep()
{
	var currentStep = Variable.GetValueAsString("currentStep");
	var SplittingStep = 1;
	if (currentStep && currentStep !== "0")
	{
		var nbAttach = Attach.GetNbAttach();
		for (var index = 0; index < nbAttach; index++)
		{
			if (Attach.IsProcessedDocument(index))
			{
				Variable.SetValueAsString("currentStep", SplittingStep);
				return true;
			}
		}
	}
	return false;
}

function ExtractZip()
{
	var compressedFile = Attach.GetCompressedFile(0);

	if (!compressedFile)
	{
		return false;
	}

	var entries = compressedFile.GetEntries();
	var pdfIndex = -1;
	var xmlIndex = -1;
	for (var i = 0; i < entries.length; i++)
	{
		var entry = entries[i];
		var extension = (entry.GetExtension() || "").toLowerCase();
		var index = Attach.GetNbAttach();
		var fileName = entry.GetFileName();
		var isAttached;
		if (extension === ".pdf" && pdfIndex === -1)
		{
			pdfIndex = index;
			isAttached = Attach.AttachTemporaryFile(entry.GetFile(), { name: fileName, attachAsConverted: true });
			if (!isAttached)
			{
				throw Language.Translate("_Failed to attach the extracted file");
			}
			Data.SetValue("AttachmentPreviewIndex", pdfIndex);
		}
		else if (extension === ".xml" && xmlIndex === -1)
		{
			xmlIndex = index;
			isAttached = Attach.AttachTemporaryFile(entry.GetFile(), { name: fileName, attachAsConverted: true });
			if (!isAttached)
			{
				throw Language.Translate("_Failed to attach the extracted file");
			}
		}
	}
	if (xmlIndex !== -1)
	{
		Variable.SetValueAsString("XmlIndex", xmlIndex);
	}

	return true;
}

function Main()
{
	Variable.SetValueAsString("XmlIndex", "");
	Data.SetValue("AttachmentPreviewIndex", 0);

	if (Attach.GetNbAttach() === 1)
	{
		var attachExtension = (Attach.GetExtension(0) || "").toLowerCase();
		Variable.SetValueAsString("AttachExtension", attachExtension);
		if (attachExtension === ".zip")
		{
			ExtractZip();
		}
		else if (attachExtension === ".xml")
		{
			Variable.SetValueAsString("XmlIndex", 0);
		}
	}

	GoToSplittingStep();
}

Main();
