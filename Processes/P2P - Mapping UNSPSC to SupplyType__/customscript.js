
Controls.SupplyType__.SetAttributes(['SupplyID__']);
Controls.SupplyType__.OnSelectItem = function (item)
{
	Controls.SupplyTypeId__.SetValue(item.GetValue("SupplyID__"));
};

Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");