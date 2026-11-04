
Lib.P2P.Address.SetFormattedAddressControl(Controls.VendorAddress__);

Controls.Sub__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.Street__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.PostalCode__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.Country__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.Region__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.City__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;
Controls.PostOfficeBox__.OnChange = Lib.P2P.Address.ComputeFormattedAddress;

Lib.P2P.Address.ComputeFormattedAddress();

let isUNSPSCEnabled = false;

// #region UNSPSC
async function UpdateUNSPSC()
{
	const companyCode = Controls.CompanyCode__.GetValue();
	if (isUNSPSCEnabled)
	{
		const previousUNSPSCs = await Lib.P2P.UNSPSC.Vendor.QueryUNSPSCFromVendor(Controls.Number__.GetValue(), companyCode);
		const selectedUNSPSCs = Sys.Helpers.Data.GetTableAsArray(Controls.UNSPSCList__).map((item) => item.GetValue("Code__"));
		if (previousUNSPSCs.map((item) => item.number).sort().join(",") !== selectedUNSPSCs.sort().join(","))
		{
			const unspscRecord = new Lib.P2P.UNSPSC.RecordManager.Client();
			unspscRecord.UpdateVendor({
				CompanyCode__: Controls.CompanyCode__.GetValue(),
				VendorNumber__: Controls.Number__.GetValue(),
				UNSPSCs__: selectedUNSPSCs
			});
		}
	}
}

async function InitUNSPSC()
{
	isUNSPSCEnabled = await Lib.P2P.UNSPSC.IsEnabledByQuery(Controls.CompanyCode__.GetValue());

	await Lib.P2P.UNSPSC.CheckUNSPSCExistsInUserLanguage();
	Lib.P2P.UNSPSC.Client.InitUNSPSCBrowseAndTable(
		isUNSPSCEnabled,
		Controls.UNSPSC__,
		Controls.UNSPSCList__
	);
	Controls.VendorUNSPSCTitle__.Hide(!isUNSPSCEnabled);
	if (isUNSPSCEnabled)
	{
		await Lib.P2P.UNSPSC.Vendor.Client.FillTableFromVendorUNSPSCMapping(
			Controls.Number__.GetValue(),
			Controls.CompanyCode__.GetValue()
		);
	}

}
// #endregion

function run()
{
	Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Common.OnHTMLScriptEnd");
	Sys.Helpers.TryCallFunction("Lib.P2P.Customization.Tables.Client.Vendors.OnHTMLScriptEnd");

	Controls.Save.OnClick = Sys.Helpers.Wrap(Controls.Save.OnClick, async function (originalFn, ...args)
	{
		if (originalFn) originalFn.apply(this, args);
		await UpdateUNSPSC();
		return false;
	});

	Controls.CompanyCode__.OnChange = Sys.Helpers.Wrap(Controls.CompanyCode__.OnChange, async function (originalFn, ...args)
	{
		if (originalFn) originalFn.apply(this, args);
		await InitUNSPSC();
	});

	InitUNSPSC();
}

run();