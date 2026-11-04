function ShouldPreferredReplyBeVisible()
{
	if (Controls.DocumentType__.GetSelectedOption())
	{
		return true;
	}
	return false;
}

function HideControls()
{
	// The control has always a null value which is equal to '='
	Controls.DocumentType__.Hide(Controls.DocumentType__.GetAvailableValues().length <= 1);
	Controls.PreferredReply__.Hide(!ShouldPreferredReplyBeVisible());
}

var FillFamilyControl = function ()
{
	function CallBackWithFamiliesResults(families)
	{
		Controls.Family__.SetAvailableValues(families);
	}

	Lib.DD_Client.RetrieveFamiliesAsOptions(CallBackWithFamiliesResults);
};

const maxTemplateSizeKB = 64;
const maxTemplateLength = 65535;

function CheckTemplateSize()
{
	const templateContent = Controls.Template__.GetValue() || "";
	if (templateContent.length > maxTemplateLength)
	{
		Controls.Template__.SetError("_Message body template exceeds {0}KB limit", maxTemplateSizeKB);
	}
	else
	{
		Controls.Template__.SetError("");
	}
}

function Main()
{
	HideControls();
	Query.NotifyOnCurrentRequestsDone(HideControls);
	Controls.DocumentType__.OnChange = function ()
	{
		HideControls();
	};

	Controls.Template__.OnChange = CheckTemplateSize;
	CheckTemplateSize();

	FillFamilyControl();
}

Main();