var regularExpressionVendor = new RegExp("^[a-zA-Z0-9-'_.@]+$");

function browseIdentifiers(onCloseCallback)
{
	var browseTitle = "_ShortLogin";
	var tableName = "ODUSER";

	var searchControlFocused = false;
	var dialog = null;
	// Number of records per Page
	var rowcountperpage = 10;
	// Maximum of records retrieved by the query
	var rowcount = 20;
	// To perform a search when the browse dialog is opening
	var searchAtOpening = true;

	var selectedIdentifier = null;

	// Column configuration
	var columns = [];
	columns.push({ id: "LOGIN", label: "_ShortLogin", type: "STR", width: 200 });
	columns.push({ id: "DESCRIPTION", label: "_Number_report", type: "STR", width: 200 });
	columns.push({ id: "COMPANY", label: "_Company", type: "STR", width: 200 });
	columns.push({ id: "CITY", label: "_City", type: "STR", width: 200 });
	columns.push({ id: "COUNTRY", label: "_Country", type: "STR", width: 50 });
	columns.push({ id: "EMAILADDRESS", label: "_EmailAddress", type: "STR", width: 200 });
	columns.push({ id: "LASTCONNECTIONDATETIME", label: "_LastConnection", type: "STR", width: 130 });

	var additionalFilterArray = [
		"VENDOR=1",
		"LOGIN!=*$_vendor_template_",
		"LOGIN!=*$_vendor_guest_template_",
		"LOGIN!=*$_vendor_manager_template_",
		"LOGIN!=*$_vendor_invoices_template_",
		"LOGIN!=*$_vendor_orders_template_",
		"LOGIN!=*$_vendor_invoices_and_orders_template_"
	];

	// Search criterion configuration
	function automaticallySurroundByStars(value)
	{
		if (!value)
		{
			return "*";
		}
		return "*" + value + "*";
	}

	var searchCriterias = [];
	searchCriterias.push({
		id: "LoginFilter__",
		label: "_ShortLogin",
		required: false,
		toUpper: false,
		visible: true,
		filterId: "LOGIN",
		defaultValue: "",
		defaultValueFormat: automaticallySurroundByStars
	});
	searchCriterias.push({
		id: "CompanyFilter__",
		label: "_Company",
		required: false,
		toUpper: false,
		visible: true,
		filterId: "COMPANY",
		defaultValue: "",
		defaultValueFormat: automaticallySurroundByStars
	});

	/* CALLBACKS */
	function ReduceToShortLogin(login)
	{
		return login.substring(login.indexOf("$") + 1);
	}

	// Called when the query is completed
	function querySuccessCallBack()
	{
		var callbackResult = this;
		var customFormat = { "LOGIN": ReduceToShortLogin };
		Sys.Helpers.Browse.CompletedCallBack(dialog, callbackResult);
		if (Sys.Helpers.Browse.FillTableFromQueryResult(dialog, "resultTable", callbackResult, customFormat))
		{
			Sys.Helpers.Browse.HideResults(dialog, false);
		}
	}

	/* Draw and display the browse page */
	function fillSearchDialog(newDialog)
	{
		dialog = newDialog;
		Sys.Helpers.Browse.FillSearchDialog(newDialog, columns, searchCriterias, rowcount, rowcountperpage, "", false, false);
		if (searchAtOpening)
		{
			request();
		}
	}

	function handleCancelDialog()
	{
		onCloseCallback(selectedIdentifier);
	}

	/* Update the main form with the user selection */
	function returnSelection(control, tableItem)
	{
		if (tableItem.LOGIN.GetValue())
		{
			selectedIdentifier = tableItem.LOGIN.GetValue();
			dialog.Cancel();
		}
	}

	// Perform request
	function request()
	{
		Sys.Helpers.Browse.DBRequest(querySuccessCallBack, dialog, columns, searchCriterias, tableName, rowcount, additionalFilterArray);
	}

	/* Handle event in browse page */
	function handleSearchDialog(handleDialog, action, event, control, tableItem)
	{
		searchControlFocused = Sys.Helpers.Browse.HandleSearchDialog(handleDialog, action, event, control, tableItem, searchControlFocused, request, returnSelection);
	}
	/* POPUP */
	Popup.Dialog(browseTitle, null, fillSearchDialog, null, null, handleSearchDialog, handleCancelDialog);
}

Controls.ShortLogin__.SetBrowsable(true);

Controls.ShortLogin__.OnBrowse = function ()
{
	function browseShortLoginCallback(shortLogin)
	{
		Controls.ShortLogin__.SetValue(shortLogin);
	}

	Controls.ShortLogin__.Wait(true);
	browseIdentifiers(browseShortLoginCallback);
};

Controls.ShortLogin__.OnChange = OnShortLoginChange;

function OnShortLoginChange()
{
	var ctrl = this;
	var identifier = ctrl.GetValue().RemoveAccents().toLowerCase();
	ctrl.SetValue(identifier);

	if (!identifier.match(regularExpressionVendor) && !Sys.Helpers.IsEmpty(identifier))
	{
		ctrl.SetError("_This is not a valid login");
	}
	else
	{
		ctrl.SetError("");
	}
}

function InitShortLoginBrowse(browseCtrl)
{
	browseCtrl.ClearSearchFields();
	browseCtrl.AddSearchField({ type: "Text", label: "_Identifier", id: "Login" });
	browseCtrl.AddSearchField({ type: "Text", label: "_Company", id: "Company" });
	browseCtrl.SetSearchMode("contains");
	browseCtrl.SetFilter("&(Vendor=1)(Description!=TemplateUser)");
	browseCtrl.OnColumnFormating = function (attributeName, value)
	{
		return attributeName === "Login" ? value.substring(value.indexOf("$") + 1) : value;
	};
	browseCtrl.OnChange = OnShortLoginChange;
}

Controls.ShortLoginContract__.Hide(
	!(Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableContractGlobalSetting__) &&
		Sys.Helpers.String.ToBoolean(ProcessInstance.extendedProperties.appInstances.P2P.globalConfiguration.EnableContractPublication__)));

InitShortLoginBrowse(Controls.ShortLoginPAC__);
InitShortLoginBrowse(Controls.ShortLoginContract__);

Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
