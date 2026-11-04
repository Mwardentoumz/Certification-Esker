
function Main()
{
	if (Data.GetValue("IsLocalPO__"))
	{
		Controls.DataPanel.SetReadOnly(true);
	}

	Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
}

Main();