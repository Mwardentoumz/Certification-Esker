Sys.AR.NeedConfiguration = false;

var scoreCalculationHelper = new Lib.CM.ScoreCalculationHelperCommon.ScoreCalculationHelper(
	Lib.CM.ScoreCalculationHelperClient.CreateTermSyncResolver()
);

var ParentsPaneHelper = {
	DisplayParentsPane: !!Data.GetValue("ParentCustomerIDs__")
};

var PackageHelper = {
	DefaultStartMenu: "overview",
	AR: {},
	DD: {
		counters: [],
		HTMLContents: [],
		reports: [],
		startMenu: "relatedDoc"
	},
	//SOP
	COP: {
		counters: [Controls.OrdersToValidate__],
		HTMLContents: [],
		reports: [],
		startMenu: "overview",
		settings: [
			{ "SOPPane": null, "OrderConfirmationsPane": null, "ASN_pane__": null }
		]
	},
	CA: {
		counters: [],
		HTMLContents: [],
		reports: [],
		settings: [],
		startMenu: "overview"
	},
	Init: function ()
	{
		const useTermsyncCounters = Lib.CM.CustomerHelper.UseTermSyncAsInvoiceReference();
		this.AR = {
			counters: [],
			countersByFeatures:
			{
				TermsyncCounters: useTermsyncCounters ?
					[Controls.TermsyncPromiseToPay__, Controls.TermsyncOverdue__, Controls.TermsyncTotalOutstanding__, Controls.TermsyncDisputes__] : [],
				Payment: useTermsyncCounters ? [] : this.computePaymentCounters(),
				Dispute: !useTermsyncCounters && Sys.AR.GetParameter("EnableDisputeFeature") ? [Controls.Disputes__] : [],
				CM: Sys.AR.GetParameter("EnableCreditApplication") ?
					[Controls.InternalScoreCounter__, Controls.BlockedOrdersCounter__, Controls.ImportedOrderCounter__,
					Controls.TotalExposure__, Controls.InsuranceAmountCounter__, Controls.NextReviewCM__] :
					[],
				Deductions: Sys.AR.GetParameter("EnableDeductionsApplication") ? [Controls.DeductionsToValidate__] : []
			},
			reports: [],
			reportsByFeatures: {
				Payment: Sys.AR.GetParameter("EnablePaymentFeature") ?
					[Controls.AgedBalance__] :
					[Controls.InvoicesAndCreditNotes__],
				Credit: Controls.EnableHistoric__.GetValue() && Sys.AR.GetParameter("EnableCreditApplication") ? [Controls.Historic__] : [],
				Deductions: Sys.AR.GetParameter("EnableDeductionsApplication") ? [Controls.ClaimAmountByMonth__, Controls.ClaimAmountByClaimType__] : []
			},
			settings: [
				Sys.AR.GetParameter("DisableDeliveryFeature") ? {} : { "InvoiceDeliveryPane": null },
				{ "TermSyncPane": { "Enable_Termsync_Synchronization": true } },
				Sys.AR.GetParameter("EnableCreditApplication") ? { CreditScoreSettingsPane: null } : {}
			]
		};
	},
	computePaymentCounters: function ()
	{
		var counters = [];
		counters = Sys.AR.GetParameter("Enable_Termsync_Synchronization", false) || Sys.AR.GetParameter("EnableCashApplication") ? [Controls.PromiseToPay__] : [];
		return counters.concat(
			Sys.AR.GetParameter("EnablePaymentFeature") ? [Controls.Overdue__, Controls.TotalOutstanding__] : [Controls.Invoices60Days__, Controls.CreditNotes60Days__]
		);
	},
	getValues: function (type)
	{
		var controls = [];
		for (var p in ProcessInstance.extendedProperties.appInstances)
		{
			if (ProcessInstance.extendedProperties.appInstances[p] && this[p] && this[p][type])
			{
				controls = controls.concat(this[p][type]);

				var featureSettingsKey = type + "ByFeatures";
				if (this[p][featureSettingsKey])
				{
					for (var feature in this[p][featureSettingsKey])
					{
						controls = controls.concat(this[p][featureSettingsKey][feature]);
					}
				}
			}
		}
		return controls;
	},
	getReports: function () { return this.getValues("reports"); },
	getHTMLContents: function () { return this.getValues("HTMLContents"); },
	getCounters: function () { return this.getValues("counters"); },
	getStartMenu: function ()
	{
		var packages = Object.keys(ProcessInstance.extendedProperties.appInstances);
		var packagesUsed = [];
		var startmenu = "";
		for (let index = 0; index < packages.length; index++)
		{
			if (PackageHelper[packages[index]])
			{
				packagesUsed.push(packages[index]);
			}
		}
		var urlParameter = Process.GetURLParameter("openMenu");
		if (urlParameter)
		{
			if (urlParameter.toLowerCase() === "messages" && Sys.AR.GetParameter("EnableConversationGlobal"))
			{
				startmenu = "messages";
			}
			else if (PackageHelper[urlParameter] && PackageHelper[urlParameter].startMenu)
			{
				startmenu = PackageHelper[urlParameter].startMenu;
			}
			else
			{
				startmenu = this.DefaultStartMenu;
			}
			Controls.NavMenu__.SelectItem(startmenu);
			return startmenu;

		}
		startmenu = Sys.Helpers.TryCallFunction("Lib.O2C.Customization.CIM.GetStartMenuTabID") ||
			(packagesUsed.length === 1 ? PackageHelper[packagesUsed[0]].startMenu || this.DefaultStartMenu : this.DefaultStartMenu);
		Controls.NavMenu__.SelectItem(startmenu);

		return startmenu;
	},
	getSettings: function ()
	{
		return this.getValues("settings");
	}
};

var APPortalHelper = {
	_encryptionInProgress: false,
	_saveAndExitFormAfterEncryption: false,
	_dummyPassword: "********",
	_originalEncryptedPassword: Controls.Customer_AP_portal_password__.GetValue(),
	_isExternalPortalCustomer: ProcessInstance.extendedProperties.preferredDeliveryMethod === "EXTERNALPORTAL",
	Init: function ()
	{
		Controls.Customer_AP_portal_password__.Hide(true);
		if (Controls.Customer_AP_portal_password__.GetValue())
		{
			Controls.Customer_AP_portal_password_temp__.SetValue(this._dummyPassword);
		}

		if (this._isExternalPortalCustomer)
		{
			var allowedAPPortals = Sys.Helpers.TryCallFunction("Lib.AR.Customization.ExternalPortal.GetAPPortals") || [];
			if (User.isInDemoAccount)
			{
				allowedAPPortals.push("Robot to Ariba");
			}

			// Check each portal has been defined as 'option=value' form.
			for (var portalIndex = 0; portalIndex < allowedAPPortals.length; portalIndex++)
			{
				var allowedPortal = allowedAPPortals[portalIndex];
				if (typeof allowedPortal === "string" && allowedPortal.length > 0 && allowedPortal.indexOf("=") < 0)
				{
					// Otherwise we format portal name properly.
					allowedAPPortals[portalIndex] = allowedPortal + "=" + allowedPortal;
				}
			}

			allowedAPPortals = ["EMPTY="].concat(allowedAPPortals);
			Controls.Customer_AP_portal__.SetAvailableValues(allowedAPPortals);
		}

		this.InitEvent();
	},
	InitEvent: function ()
	{
		var that = this;
		Controls.Customer_AP_portal_password_temp__.OnChange = function ()
		{
			var tempPassword = Controls.Customer_AP_portal_password_temp__.GetValue();

			if (!tempPassword)
			{
				Controls.Customer_AP_portal_password__.SetValue("");
			}
			else if (tempPassword === that._dummyPassword)
			{
				Controls.Customer_AP_portal_password__.SetValue(that._originalEncryptedPassword);
			}
			else
			{
				that.EncryptPassword(tempPassword);
			}
		};

		Controls.Save.OnClick = function ()
		{
			if (that._encryptionInProgress)
			{
				Controls.Customer_AP_portal_password__.Wait(true);
				this._saveAndExitFormAfterEncryption = true;
				return false;
			}
			if (Controls.EDIPartnerCustomer__.GetValue() === "germany-b2b" && Controls.German_B2B_version__.GetValue() === "EMPTY")
			{
				Controls.German_B2B_version__.SetError("_Error select a version");
				return false;
			}

			return true;
		};
	},
	EncryptPasswordCallback: function (encryptResult)
	{
		this._encryptionInProgress = false;

		Controls.Customer_AP_portal_password__.Wait(false);

		if (encryptResult.success)
		{
			Controls.Customer_AP_portal_password__.SetValue(encryptResult.cipherText);

			if (this._saveAndExitFormAfterEncryption)
			{
				this._saveAndExitFormAfterEncryption = false;
				ProcessInstance.SaveAndQuit("Save");
			}
		}
		else
		{
			this._saveAndExitFormAfterEncryption = false;
			Log.Error("Crypto.Encrypt: " + encryptResult.error);

			Popup.Alert(Language.Translate("_An error occurred while saving new password"),
				true,
				null,
				Language.Translate("_Error"));
		}
	},
	EncryptPassword: function (password)
	{
		var prodPublicKey = "m13piH6XPSyUtCHDDDchnlvu03oc1d1e+s0aSH0IZpQuOCt+KEMOQg03JdeLaL4dR+V04JH2IgxBMNmabl55eBH/ogGk692cbWdl/kB22i9nKywuaFxiAHXwp94/aK96+o4eGAItrQDLTBbFbRsxYEpL21NEdNox11ES+ZA7Bic=";
		var qaPublicKey = "tYnfy87VcKV5QhOqmhMMxB+252wv2G/YVdjoge4QlArCaf7XdLbTQd8trMbwHV0RAau7L2HBlrf8xL6i1++fZkKCPzIIfMW2Ov8Pb8F5zgywmPNV+DMjotTbMIQkqGU7cnMYnViXqgnTi016CMya2R1wy59/oPICG36/i3kyD4E=";

		var publicKey = ProcessInstance.isProductionPlatform ?
			prodPublicKey :
			qaPublicKey;

		this._encryptionInProgress = true;

		Crypto.Encrypt({ callback: this.EncryptPasswordCallback.bind(this), data: password, algorithm: "rsa", key: publicKey });
	}
};

//Do some GetParameter
var EDIHelper = {
	Init: function ()
	{
		if (!ProcessInstance.extendedProperties.appInstances.AR)
		{
			return;
		}
		var allEdiDeliverySystems = Controls.EDIPartnerCustomer__.GetAvailableValues();
		var isExternalPortalCustomer = ProcessInstance.extendedProperties.preferredDeliveryMethod === "EXTERNALPORTAL";
		Controls.CoupaCustomerInformationPane.SetHelpId("1851");

		if (!isExternalPortalCustomer)
		{
			var currentValue = Controls.EDIPartnerCustomer__.GetValue();
			var ediDeliverySystems = Sys.AR.Client.FilterEnabledEdiDeliverySystems(currentValue, allEdiDeliverySystems);
			let customDeliveries = Sys.Helpers.TryCallFunction("Lib.AR.Customization.EDI.Portals.GetSupportedPartners");
			if (customDeliveries)
			{
				for (let i = 0; i < customDeliveries.length; i++)
				{
					let customDelivery = customDeliveries[i];
					ediDeliverySystems.push(customDelivery.name + "=" + customDelivery.name);
				}
			}
			Sys.AR.Client.SetComboBoxAvailableValues(Controls.EDIPartnerCustomer__, ediDeliverySystems);
		}

		this.InitEvent();
	},
	InitEvent: function ()
	{
		Controls.Chorus_Structure_Identifier__.OnColumnFormating = this.TranslateChorusStatus;
		Controls.Chorus_Service_Identifier__.OnColumnFormating = this.TranslateChorusStatus;
		Controls.EDIPartnerCustomer__.OnChange = this.OnDeliverySystemChange;
		Controls.EDI_invoice_format__.OnChange = this.OnChangeEdiInvoiceFormat;
		Controls.Billing_Country__.OnChange = function ()
		{
			Controls.Billing_Country__.SetValue(Controls.Billing_Country__.GetValue().toUpperCase());
		};
	},
	GetPartner: function (partner)
	{
		var allPartners = {
			pec: ["pec", "italian-b2b"],
			tenor: ["tenor", "edicom", "b-process", "cegedim", "ob10", "obs", "prologue", "generix", "bavel", "edt", "seres", "direct-commerce", "agena3000"],
			indicom: ["italian-fa", "italian-pa", "italian-b2b"],
			eIntegration: ["intecon", "tradeshift", "basware", "e-integration", "io-market", "pagero", "saphety", "esker-edi-services", "spanish-b2b",
				"germany-pa", "germany-pa-email", "ariba", "peppol-pint-my", "peppol-pint-sg", "peppol-pint-aus", "peppol-pint-nz", "peppol-bis-3.0", "peppol-bis-en16931",
				"belgium-b2b", "belgium-b2b-en16931", "peppol-sg-with-iras", "peppol-pint-sg-with-iras", "peppol-sg-ees", // "sg-iras-only" is missing on purpose from on the CIM
				"poland-b2b", "poland-b2b-email", "germany-b2b-peppol", "germany-b2b-email-xrechnung", "germany-b2b-email-zugferd"],
			face: ["spanish-pa"],
			billexco: ["swiss-pa"],
			chorus: ["chorus-pro"],
			frenchB2B: ["french-b2b"],
			monto: ["monto-generic"],
			peppol: ["belgium-pa", "austria-pa", "denmark-pa", "england-pa", "germany-pa-bbw", "netherlands-pa", "norway-pa", "poland-pa", "sweden-pa",
				"luxembourg-pa", "peppol-sg", "peppol-hr", "peppol-3.0", "peppol-anz"],
			germanPAEmail: ["germany-pa-email"],
			freedz: ["freedz"]
		};

		return {
			isPec: allPartners.pec.indexOf(partner) >= 0,
			isTenor: allPartners.tenor.indexOf(partner) >= 0,
			isIndicom: allPartners.indicom.indexOf(partner) >= 0,
			isEIntegration: allPartners.eIntegration.indexOf(partner) >= 0,
			isFace: allPartners.face.indexOf(partner) >= 0,
			isBillexco: allPartners.billexco.indexOf(partner) >= 0,
			isChorusPro: allPartners.chorus.indexOf(partner) >= 0,
			isMonto: allPartners.monto.indexOf(partner) >= 0,
			isPeppol: allPartners.peppol.indexOf(partner) >= 0,
			IsFrenchB2B: allPartners.frenchB2B.indexOf(partner) >= 0,
			isGermanPAEmail: allPartners.germanPAEmail.indexOf(partner) >= 0,
			isFreedz: allPartners.freedz.indexOf(partner) >= 0
		};
	},
	TranslateChorusStatus: function (attributeName, value)
	{
		if (attributeName === "Actif")
		{
			switch (value)
			{
				case "0":
					value = "_Inactive";
					break;
				case "1":
					value = "_Active";
					break;
				default:
					value = "_Inactive";
			}
		}
		return value;
	},
	DoesPeppolParticipantExistsCallback: function (response)
	{
		Sys.Helpers.SilentChange(function ()
		{
			if (response.status !== 200)
			{
				Data.SetError("PartnerCustomID__", "_The Participant ID was not found in the PEPPOL SMP");
				Data.SetError("PartnerCustomIDType__", "_The Participant ID was not found in the PEPPOL SMP");
			}
			else
			{
				Data.SetError("PartnerCustomID__", "");
				Data.SetError("PartnerCustomIDType__", "");
			}
		});
	},
	CheckPeppolParticipantIfNeeded: function ()
	{
		var checkPeppolCustomer = Sys.AR.GetParameter("Check_Peppol_participant_ID_and_supported_types__") === "1";
		if (checkPeppolCustomer)
		{
			var id = Controls.PartnerCustomID__.GetValue();
			var idType = Controls.PartnerCustomIDType__.GetValue();
			if (id && idType)
			{
				var peppolTargetEnvironment = "PROD";
				idType = Sys.AR.EDI.Peppol.Common.TryMapPEPPOL20ToPEPPOL30EndpointIdType(idType);
				Sys.AR.Client.Peppol.ParticipantExists(idType, id, peppolTargetEnvironment, EDIHelper.DoesPeppolParticipantExistsCallback);
			}
		}
	},
	OnDeliverySystemChange: function ()
	{
		const shouldDisplayDeliverySystem = ProcessInstance.extendedProperties.preferredDeliveryMethod === "EDI";

		Controls.Customer_AP_portal__.Hide(!APPortalHelper._isExternalPortalCustomer);
		Controls.CustomerAPPortalPane.Hide(!APPortalHelper._isExternalPortalCustomer);
		Controls.EDIPartnerCustomer__.Hide(!shouldDisplayDeliverySystem);

		var partnerName = Controls.EDIPartnerCustomer__.GetValue();
		var partner = EDIHelper.GetPartner(partnerName);
		const isFrenchB2BEnabled = Sys.AR.EDI.FRB2B.SUPI.IsFrenchB2BEnabled();

		Controls.SimpleIDPane.Hide(!partner.isTenor && !partner.isIndicom && !partner.isBillexco && !partner.isPeppol && !partner.isEIntegration && !partner.isPec &&
			!partner.isFreedz);
		Controls.PartnerCustomID__.Hide(partnerName === "pec");
		Controls.PEC_Email__.Hide(!partner.isPec);
		Controls.FACEPane.Hide(!partner.isFace);
		Controls.ChorusPane.Hide(!partner.isChorusPro);
		Controls.FrenchB2BPane.Hide(!isFrenchB2BEnabled);
		Controls.MontoPane.Hide(!partner.isMonto);
		Controls.German_B2B_version__.Hide(partnerName !== "germany-b2b");
		Controls.German_B2B_version__.SetRequired(partnerName === "germany-b2b");
		Controls.EDI_invoice_format__.Hide(!partner.IsFrenchB2B);
		Controls.PartnerCustomIDType__.Hide(!partner.isPeppol && !partner.isEIntegration && !partner.isTenor && !partner.isChorusPro);
		Controls.Party_identification__.Hide(!partner.isGermanPAEmail);
		Controls.Party_identification_type__.Hide(!partner.isGermanPAEmail);
		Controls.CoupaCustomerInformationPane.Hide(partnerName !== "coupa" && partnerName !== "ariba_cxml");
		Controls.Coupa_Customer_URL_Domain__.Hide(partnerName === "ariba_cxml");
		Controls.CHORUS_CodeServiceExecutant__.Hide(!partner.isFreedz);
		if (partnerName === "ariba_cxml")
		{
			Controls.Coupa_Customer_Domain__.SetHelpData(Language.Translate("_ARIBA Customer Domain Tooltip"), "1851");
			Controls.Coupa_Customer_Id__.SetHelpData(Language.Translate("_ARIBA Customer Id Tooltip"), "1851");
		}
		if (partnerName === "coupa")
		{
			Controls.Coupa_Customer_Domain__.SetHelpData(Language.Translate("_Coupa Customer Domain Tooltip"), "1851");
			Controls.Coupa_Customer_Id__.SetHelpData(Language.Translate("_Coupa Customer Id Tooltip"), "1851");
		}

		if (partner.isChorusPro)
		{
			Sys.AR.Client.ChorusPro.Init();
		}

		if (partner.isBillexco)
		{
			Controls.PartnerCustomID__.SetBrowsable(true);
			Controls.PartnerCustomID__.OnBrowse = Sys.AR.Client.Billexco.PA.OnBrowsePAsDialog;
			Controls.PartnerCustomID__.OnChange = EDIHelper.OnDeliverySystemChange;

			// If the customer has a business link, let's find it on the system data
			// to display the correct Billexo_HTML__ field on init
			var PAString = "";
			var businessLink = Controls.PartnerCustomID__.GetValue();
			if (businessLink)
			{
				var jsonPA = Sys.AR.Client.Billexco.PA.GetPAJSONByBusinessLink(businessLink);
				PAString = jsonPA ?
					jsonPA.Company_Name__ + " - " + jsonPA.NIF__ :
					"";
			}
			Sys.AR.Client.Billexco.PA.FormatAndDisplayBillexcoHTMLField(PAString);
		}
		if (isFrenchB2BEnabled)
		{
			Sys.AR.Client.FrenchB2B.CIM.Init();
		}
		if (partnerName !== "germany-b2b")
		{
			Controls.German_B2B_version__.SetValue("EMPTY");
		}
		if (partner.isPeppol)
		{
			Controls.PartnerCustomID__.OnChange = EDIHelper.OnDeliverySystemChange;
			Controls.PartnerCustomIDType__.OnChange = EDIHelper.OnDeliverySystemChange;
			EDIHelper.CheckPeppolParticipantIfNeeded();
		}
		else
		{
			Controls.PartnerCustomID__.OnChange = null;
			Controls.PartnerCustomID__.SetBrowsable(false);
			Controls.Billexco_HTML__.Hide(true);
		}
		EDIHelper.OnChangeEdiInvoiceFormat();
	},
	OnChangeEdiInvoiceFormat: function ()
	{
		var ediFormatDisplayed = Controls.EDI_invoice_format__.IsVisible();
		var isEdifactFormat = Controls.EDI_invoice_format__.GetValue() === "edifact_d96a";
		Controls.Edifact_output_format__.Hide(!ediFormatDisplayed || !isEdifactFormat);
	}
};
var ChildsPopupHelper = {
	_browseTitle: Language.Translate("_CustomerChildsPopup"),
	_tableName: "USERPORTAL",
	_dialog: null,
	_rowcountperpage: 10,
	_rowcount: "no_limit",
	_maxChildsInFilter: 1000,
	_customerChildren: [],
	_columns: [
		{ id: "UserId", hidden: true },
		{ id: "Company", label: "_Company", type: "STR", width: 300 },
		{ id: "Country", label: "_Country", type: "STR", width: 200 },
		{ id: "EmailAddress", label: "_EmailAddress", type: "STR", width: 300 },
		{ id: "PhoneNumber", label: "_PhoneNumber", type: "STR" }
	],
	_searchCriterias: [],
	BrowseChilds: function (customerId)
	{
		this._customerId = customerId;
		Popup.Dialog(this._browseTitle, null, this.FillChildsDialog, null, null, this.HandleChildsDialog, null);
	},
	QuerySuccessCallBack: function ()
	{
		var callbackResult = this;
		Sys.Helpers.Browse.CompletedCallBack(ChildsPopupHelper._dialog, callbackResult);
		if (Sys.Helpers.Browse.FillTableFromQueryResult(ChildsPopupHelper._dialog, "resultTable", callbackResult))
		{
			Sys.Helpers.Browse.HideResults(ChildsPopupHelper._dialog, false);
		}
	},
	GenerateFilter: function ()
	{
		return Sys.Helpers.LdapUtil.FilterEqual("PARENTCUSTOMERIDS__", this._customerId).toString();
	},
	Request: function ()
	{
		Sys.Helpers.Browse.DBRequest(
			ChildsPopupHelper.QuerySuccessCallBack,
			ChildsPopupHelper._dialog,
			ChildsPopupHelper._columns,
			ChildsPopupHelper._searchCriterias,
			ChildsPopupHelper._tableName,
			ChildsPopupHelper._rowcount,
			ChildsPopupHelper.GenerateFilter()
		);
	},
	FillChildsDialog: function (newDialog)
	{
		ChildsPopupHelper._dialog = newDialog;

		Sys.Helpers.Browse.FillSearchDialog(
			newDialog,
			ChildsPopupHelper._columns,
			ChildsPopupHelper._searchCriterias,
			null,
			ChildsPopupHelper._rowcountperpage,
			"",
			false,
			false,
			false,
			[]
		);
		ChildsPopupHelper.Request();
	},
	HandleChildsDialog: function (handleDialog, action, event, control, tableItem)
	{
		Sys.Helpers.Browse.HandleSearchDialog(
			handleDialog,
			action,
			event,
			control,
			tableItem,
			null,
			ChildsPopupHelper.Request,
			ChildsPopupHelper.ReturnChildSelection
		);
	},
	ReturnChildSelection: function (control, tableItem)
	{
		if (tableItem.UserId && tableItem.UserId.GetValue())
		{
			const userId = tableItem.UserId.GetValue();
			CustomerDetailsHelper.OpenCustomerPage({ userId: userId });
		}
	}
};

var CustomerDetailsHelper = {
	isMainContact: false,
	mainContactLogin: "",
	company: {},
	userData: {},
	_customerInfoLoaded: false,
	_blockBannerDisplayed: false,
	BLOCK_BANNER_ID: "CustomerBlocked",
	GetChildrenPromise: function ()
	{
		if (!this._childrenPromise)
		{
			var customerId = Controls.CustomerID__.GetValue();
			if (customerId)
			{
				var customerIdParts = customerId.split('$');
				customerId = customerIdParts[customerIdParts.length - 1];
				Controls.CustomerIdDisplay__.SetText(customerId);
			}
			this._childrenPromise = Lib.CM.CombinedCustomerHelper.GetChildrenPromise(customerId);
		}

		return this._childrenPromise;
	},
	Init: function ()
	{
		var customerId = Controls.CustomerID__.GetValue();
		if (customerId)
		{
			var customerIdParts = customerId.split('$');
			customerId = customerIdParts[customerIdParts.length - 1];
			Controls.CustomerIdDisplay__.SetText(customerId);
		}

		LoaderHelper.ShowLoader("moreDetails");
		this._userInformationFilled = new Promise((resolve) =>
		{
			this.FillUserInformation(function ()
			{
				LoaderHelper.HideLoader("moreDetails");
			});
			resolve();
		});


		if (ProcessInstance.extendedProperties)
		{
			var props = ProcessInstance.extendedProperties;
			Controls.BusinessPartnerId__.SetValue(ProcessInstance.extendedProperties.businessPartnerID);
			var customerInfos = {
				"name": props.displayName,
				"customerID": props.login.split("$")[1],
				"email": props.emailAddress,
				"deliveryMethod": props.preferredDeliveryMethod,
				"phoneNumber": props.phoneNumber,
				"profileId": props.profileId,
				"profileName": props.profileName,
				"company": props.company,
				"businessPartnerID": props.businessPartnerID
			};

			this.isMainContact = Data.GetValue("IsCompany__") || !props.isContact;
			if (Data.GetValue("IsCompany__"))
			{
				this.mainContactLogin = props.login;
			}
			else if (props.businessPartnerID)
			{
				this.mainContactLogin = props.login.substring(0, props.login.indexOf('$') + 1) + props.businessPartnerID.toLowerCase();
			}
			else
			{
				this.mainContactLogin = props.login;
			}

			this.SetDetails(customerInfos);

			this.HandleSingleOrMergedCustomerIDs(customerInfos);

			this.EnableCreditScoreForMainContact();

			Controls.DeliveryMethod__.SetValue(props.preferredDeliveryMethod);
			var allowDMControls = {
				SM: Controls.EmailAttachment__, MOD: Controls.PostalMail__, FGFAXOUT: Controls.Fax__,
				PORTAL: Controls.PortalPublication__, EDI: Controls.EDI__, OTHER: Controls.OtherDelivery__
			};

			for (var i = 0; i < props.allowedDeliveryMethods.length; i++)
			{
				if (allowDMControls[props.allowedDeliveryMethods[i]])
				{
					allowDMControls[props.allowedDeliveryMethods[i]].SetValue(true);
				}
			}
			Controls.SendCopyToEmailAddresses__.SetValue(props.deliveryCopyEmail);
			this.SetDatesValues();

			Controls.Options__.SetValue(props.options);
			Controls.PasswordFree__.SetValue((parseInt(props.loginType, 10) & 16) === 16);	//16 => mask for login free password
			Controls.Lock__.SetValue(props.locked);

			Controls.SendOrderConfirmation_EDIFormat__.Hide(!Data.GetValue("SendOrderConfirmation_EDI__"));
			Controls.SendOrderConfirmation_EDI__.OnChange = function ()
			{
				Controls.SendOrderConfirmation_EDIFormat__.Hide(!this.GetValue());
			};

			Controls.SendOrderConfirmation_Portal__.Hide(!Data.GetValue("SendOrderConfirmation_Email__"));
			Controls.SendOrderConfirmationPDFAttached__.Hide(!Data.GetValue("SendOrderConfirmation_Email__"));
			Controls.SendOrderConfirmation_Email__.OnChange = function ()
			{
				Controls.SendOrderConfirmation_Portal__.Hide(!this.GetValue());
				Controls.SendOrderConfirmationPDFAttached__.Hide(!this.GetValue());
			};

			Controls.ASN_EDI_format__.Hide(!Data.GetValue("ASN_send_EDI__"));
			Controls.ASN_send_EDI__.OnChange = function ()
			{
				Controls.ASN_EDI_format__.Hide(!this.GetValue());
			};

			Controls.ASN_publish_on_portal__.Hide(!Data.GetValue("ASN_send_email__"));
			Controls.ASN_send_pdf_attached__.Hide(!Data.GetValue("ASN_send_email__"));
			Controls.ASN_send_email__.OnChange = function ()
			{
				Controls.ASN_publish_on_portal__.Hide(!this.GetValue());
				Controls.ASN_send_pdf_attached__.Hide(!this.GetValue());
			};
		}
	},
	HandleSingleOrMergedCustomerIDs: function (customerInfos)
	{
		this.GetChildrenPromise().Then((children) =>
		{
			if (children.length > 0)
			{
				this.HandleMergedCustomer(customerInfos, children);
			}
			else if (Controls.ParentCustomerIDs__.GetValue())
			{
				this.HandleParentCustomer(customerInfos);
			}
			else
			{
				this.queryPromise.Then(function ()
				{
					CustomerDetailsHelper.SetDelayedDetails(customerInfos);
				});
			}
		});
	},
	HandleMergedCustomer: function (customerInfos, children)
	{
		Controls.MainContactPane.SetLabel(Language.Translate("_Combined Customers"));
		var nbMergedCustomersToDisplay = 10;
		var firstCustomerChildrenLogin = children.slice(0, nbMergedCustomersToDisplay).map((child) => child.CUSTOMERID__);
		var filter = Sys.Helpers.LdapUtil.FilterIn("login", firstCustomerChildrenLogin).toString();
		Query.DBQuery(function ()
		{
			var mergedCustomers = [];
			var recordsCount = this.GetRecordsCount();
			for (var index = 0; index < recordsCount; index++)
			{
				var login = this.GetQueryValue("Login", index);
				var customerInfo = {
					"name": this.GetQueryValue("Company", index),
					"id": login.split("$")[1],
					"userId": this.GetQueryValue("UserId", index)
				};

				if (firstCustomerChildrenLogin.indexOf(login) !== -1)
				{
					mergedCustomers.push(customerInfo);
				}
			}

			customerInfos.mergedCustomersInfos = mergedCustomers;
			CustomerDetailsHelper.queryPromise.Then(function ()
			{
				CustomerDetailsHelper.SetDelayedDetails(customerInfos);
			});
		}, "USERPORTAL", "Login|Company|UserId", filter, null, nbMergedCustomersToDisplay);
	},
	HandleParentCustomer: function (customerInfos)
	{
		var parentLogin = Controls.CustomerID__.GetValue().split("$")[0] + '$' + Controls.ParentCustomerIDs__.GetValue().toLowerCase();
		var filterParentId = Sys.Helpers.LdapUtil.FilterIn("login", parentLogin).toString();
		Query.DBQuery(function ()
		{
			var recordsCount = this.GetRecordsCount();
			for (var index = 0; index < recordsCount; index++)
			{
				var login = this.GetQueryValue("Login", index);
				var customerInfo = {
					"name": this.GetQueryValue("Company", index),
					"id": login.split("$")[1],
					"userId": this.GetQueryValue("UserId", index)
				};
				customerInfos.parentCustomer = customerInfo;
			}
			CustomerDetailsHelper.queryPromise.Then(function ()
			{
				CustomerDetailsHelper.SetDelayedDetails(customerInfos);
			});
		}, "USERPORTAL", "Login|Company|UserId", filterParentId, null, 1);
	},
	SetDetails: function (details)
	{
		//main contact
		if (this.isMainContact)
		{
			Controls.Customer_Info__.SetHTML(Controls.Customer_Info__.GetHTML().replace("fa-user-circle", "fa-building-o"));
		}

		//GeneralPane in preferences
		Controls.ProfileLink__.SetText(details.profileName);
		Controls.ProfileLink__.SetURL("../profile.aspx?id=" + details.profileId);

		Controls.Customer_Info__.BindEvent("onCustomerInfoLoad", function ()
		{
			CustomerDetailsHelper._customerInfoLoaded = true;
			Controls.Customer_Info__.FireEvent("onCustomerInfoLoad", {
				customerInfo: {
					name: CustomerDetailsHelper.isMainContact ? details.company : details.name,
					customerNumber: details.businessPartnerID,
					customerStatus: Language.Translate(Controls.IsInactive__.GetValue() ? "_Inactive" : "_Active"),
					customerCreationDate: Sys.Helpers.Date.ToLocaleDateEx(Controls.CreationDateTime__.GetValue(), User.culture),
					customerNextReviewDate: Sys.Helpers.Date.ToLocaleDateEx(Controls.NextReviewCM__.GetValue(), User.culture)
				}
			});
			CustomerDetailsHelper.DisplayBlockStatus();
		});

		this.queryPromise = Sys.Helpers.Promise.Create(function (myResolve)
		{
			Controls.MainContact__.BindEvent("onMainContactLoad", myResolve);
		});
	},
	/**
	 * Refreshes the block status displayed next to the status of the customer identity card from the current value of the CreditHold__ flag.
	 * The status is only rendered once the Customer_Info__ HTML control has been loaded.
	 */
	DisplayBlockStatus: function ()
	{
		this.DisplayBlockBanner();

		if (!this._customerInfoLoaded || !Controls.CreditHold__)
		{
			return;
		}

		Controls.Customer_Info__.FireEvent("onCustomerBlockStatusChange", {
			isBlocked: !!Controls.CreditHold__.GetValue(),
			translations: {
				blocked: Language.Translate("_Blocked")
			}
		});
	},
	/**
	 * Displays a banner at the top of the page while the customer account is blocked, and removes it once the account is unblocked.
	 */
	DisplayBlockBanner: function ()
	{
		if (!Controls.CreditHold__)
		{
			return;
		}

		var isBlocked = !!Controls.CreditHold__.GetValue();
		if (isBlocked === this._blockBannerDisplayed)
		{
			return;
		}

		var alertHandler = AlertsHelper.GetHandler();
		if (isBlocked)
		{
			alertHandler.AddAlert({
				id: this.BLOCK_BANNER_ID,
				style: "danger",
				message: Language.Translate("_CreditHoldBanner")
			});
		}
		else
		{
			alertHandler.RemoveAlert(this.BLOCK_BANNER_ID);
		}

		this._blockBannerDisplayed = isBlocked;
	},
	SetDelayedDetails: function (details)
	{
		var deliveryMethodTrad = details.deliveryMethod ? Language.Translate("_" + details.deliveryMethod + "_customerDetails", false) : "";
		Controls.MainContact__.FireEvent("onMainContactLoad", {
			customerInfo: {
				subName: CustomerDetailsHelper.isMainContact ? details.name : "",
				phoneNumber: details.phoneNumber,
				email: details.email,
				deliveryMethod: deliveryMethodTrad,
				mergedCustomers: details.mergedCustomersInfos
			},
			translations: {
				viewMore: Language.Translate("_ViewMore")
			}
		});

		Controls.ParentsPane.SetLabel(Language.Translate("_ParentPane"));
		Controls.ParentsIdLinks__.FireEvent("onParentsIdLinksLoad", {
			customerInfo: {
				parentCustomer: details.parentCustomer
			},
			translations: {
				parentNotFound: Language.Translate("_NoParentIdFound", true, Controls.ParentCustomerIDs__.GetValue())
			}
		});
		Controls.MainContact__.BindEvent("ClickCustomer", this.OpenCustomerPage);
		Controls.MainContact__.BindEvent("ClickDisplayChildsPopup", this.OpenChildsPopup);
	},
	OpenCustomerPage: function (args)
	{
		var url = Sys.AR.Customer.GetCustomerUrl(args.userId, true);
		Process.OpenLink({ url: url, inCurrentTab: false, onQuit: "back" });
	},
	OpenChildsPopup: function ()
	{
		ChildsPopupHelper.BrowseChilds(Controls.CustomerIdDisplay__.GetValue());
	},
	FillOrHideField: function (value, control)
	{
		if (value)
		{
			control.SetText(value);
		}
		else
		{
			control.Hide(true);
		}
	},
	FillUserInformation: function (callback)
	{
		var mapping = {
			ADDITIONALFIELD1: "Additional_Field1__",
			ADDITIONALFIELD2: "Additional_Field2__",
			ADDITIONALFIELD3: "Additional_Field3__",
			ADDITIONALFIELD4: "Additional_Field4__",
			ADDITIONALFIELD5: "Additional_Field5__",
			CITY: "City__",
			COMPANY: "Company__",
			COUNTRY: "Country__",
			DESCRIPTION: "Additional_Information__",
			DISPLAYNAME: "Display_Name__",
			EMAILADDRESS: "Email_Address__",
			FAXNUMBER: "Fax_Number__",
			FIRSTNAME: "First_Name__",
			LASTNAME: "Last_Name__",
			MAILSTATE: "Mail_State__",
			MAILSUB: "MailSub__",
			MIDDLENAME: "Middle_Name__",
			MOBILENUMBER: "Mobile_Number__",
			PHONENUMBER: "Phone_Number__",
			STREET: "Street__",
			POBOX: "POBox__",
			TITLE: "Title__",
			ZIPCODE: "Zip_Code__",
			DISPLAYWELCOMESCREEN: "Display_Welcome_Page__"
		};

		var readyState = {
			callback: callback,
			Ready: function (module)
			{
				this[module] = true;
				if (this.callback && this.language && this.culture && this.encoding && this.timezone)
				{
					this.callback();
					ProcessInstance.SetSilentChange(false);
				}
			}
		};

		var complexMapping = {
			LANGUAGE: function (val)
			{
				Language.GetAvailableLanguages({
					userType: "customer", callback: function (data)
					{
						if (!data.error && data.languages && data.languages[val])
						{
							Controls.Language__.SetText(data.languages[val].Display);
						}

						readyState.Ready("language");
					}
				});
			},
			CULTURE: function (val)
			{
				Language.GetAvailableCultures({
					callback: function (data)
					{
						if (!data.error && data.cultures && data.cultures[val])
						{
							Controls.Regional_Settings__.SetText(data.cultures[val].Name);
						}
						readyState.Ready("culture");
					}
				});
			},
			EXPORTENCODING: function (val)
			{
				val = val || "_Default";
				Language.Translate({
					async: true,
					key: "_Culture",
					module: "user",
					callback: function (dataCulture)
					{
						if (!dataCulture.error)
						{
							Language.Translate({
								async: true,
								key: val,
								module: "exportencoding",
								replacements: [dataCulture.formatted],
								callback: function (dataEncoding)
								{
									if (!dataEncoding.error)
									{
										Controls.Export_Encoding__.SetText(dataEncoding.formatted);
									}

									readyState.Ready("encoding");
								}
							});
						}
					}
				});
			},
			TIMEZONEINDEX: function (val)
			{
				Language.Translate({
					async: true,
					key: val,
					module: "timezone",
					callback: function (data)
					{
						if (!data.error)
						{
							Controls.Time_Zone__.SetText(data.formatted);
						}

						readyState.Ready("timezone");
					}
				});
			}
		};


		Query.DBQuery(function ()
		{
			ProcessInstance.SetSilentChange(true);
			for (var prop in mapping)
			{
				Controls[mapping[prop]].SetValue(this.GetQueryValue(prop));
				CustomerDetailsHelper.userData[prop] = this.GetQueryValue(prop);
			}

			for (var cProps in complexMapping)
			{
				complexMapping[cProps](this.GetQueryValue(cProps), this);
			}

			Controls.Customer_Number__.SetValue(ProcessInstance.extendedProperties.businessPartnerID);
			readyState.Ready("common");

		}, "ODUSER", Object.keys(mapping).concat(Object.keys(complexMapping)).join("|"), "(msn=" + ProcessInstance.extendedProperties.msn + ")", null, 1, null, "FastSearch=1");
	},
	_userInformationFilled: null,
	_queryGetCompanyPropsDone: false,
	GetCompanyProps: function (callback)
	{
		if (this.isMainContact)
		{
			if (!Data.GetValue("CreditScore_CompanyIdentifier__"))
			{
				Sys.Helpers.SilentChange(function ()
				{
					Data.SetValue("CreditScore_CompanyIdentifier__", ProcessInstance.extendedProperties.msn);
					this.saveScoreId = true;
				}.bind(this));
			}

			this.company = { creditScoreId: Data.GetValue("CreditScore_CompanyIdentifier__"), creditScoreEnabled: Sys.Helpers.String.ToBoolean(Data.GetValue("CreditScore_Enabled__")) };
			if (typeof callback === "function")
			{
				callback.apply(this);
				return;
			}
		}

		if (!this._queryGetCompanyPropsDone && this.mainContactLogin)
		{
			Query.DBQuery(function ()
			{
				CustomerDetailsHelper.company = {
					creditScoreId: this.GetQueryValue("CreditScore_CompanyIdentifier__"),
					creditScoreEnabled: Sys.Helpers.String.ToBoolean(this.GetQueryValue("CreditScore_Enabled__"))
				};
				if (typeof callback === "function")
				{
					callback.apply(CustomerDetailsHelper);
				}

			}, "Customer_Extended_Delivery_Properties__", "CreditScore_CompanyIdentifier__|CreditScore_Enabled__", "(CustomerID__=" + this.mainContactLogin + ")");

			this._queryGetCompanyPropsDone = true;
		}
	},
	EnableCreditScoreForMainContact: function ()
	{
		if (Sys.AR.GetParameter("EnableCreditApplication"))
		{
			this.GetCompanyProps(function ()
			{
				if (!this.isMainContact)
				{
					Sys.Helpers.SilentChange(function ()
					{
						Controls.CreditScore_Enabled__.SetValue(this.company.creditScoreEnabled);
					}.bind(this));
				}
			});
		}
		this.GetTotalExposure();
	},
	GetTotalExposure: async function ()
	{
		const customerNumbers = await CustomerDetailsHelper.GetCustomerNumbers();
		let exposureData;
		try
		{
			exposureData = await Lib.CM.CustomerHelper.GetTotalExposure({
				customerNumbers: customerNumbers,
				companyCode: Data.GetValue("SupplierCompanyCode__"),
				creditLimit: Data.GetValue("CreditLimit__"),
				insuranceAmount: Data.GetValue("InsuranceAmount__") || 0
			});
		}
		catch (error)
		{
			Log.Error(`Error getting total exposure : ${error}`);
			Lib.CM.CustomerHelper.SetCountersInError();
			return;
		}
		Lib.CM.CustomerHelper.SetCountersValueAndUpdateExposure(exposureData);
	},
	SetDatesValues: function ()
	{
		var props = ProcessInstance.extendedProperties;
		var getDateInUserTimezone = function (dateTime)
		{
			var userDate = new Date(dateTime);
			return Sys.Helpers.Date.GetDateInUserTimezone(userDate, User.utcOffset);
		};

		var date = null;
		if (props.creationDateTime)
		{
			date = getDateInUserTimezone(props.creationDateTime);
			Controls.CreationDateTime__.SetValue(date);
		}
		if (props.lastConnectionDateTime)
		{
			date = getDateInUserTimezone(props.lastConnectionDateTime);
			Controls.LastLoginDateTime__.SetValue(date);
		}
		if (props.lastSentWelcomeEmailDateTime)
		{
			date = getDateInUserTimezone(props.lastSentWelcomeEmailDateTime);
			Controls.LastWelcomeEmailSendDate__.SetValue(date);
		}
		if (props.eAgreementDateTime)
		{
			date = getDateInUserTimezone(props.eAgreementDateTime);
			Controls.EInvoicingAcceptanceDate__.SetValue(date);
		}
	},
	GetCustomerNumbers: function ()
	{
		return Sys.Helpers.Promise.Create(function (resolve)
		{
			CustomerDetailsHelper.GetChildrenPromise().Then((children) =>
			{
				var customerNumbers = [];
				var parentCustomerNumber = Controls.BusinessPartnerId__.GetValue();
				if (!parentCustomerNumber)
				{
					parentCustomerNumber = ProcessInstance.extendedProperties.businessPartnerID;
				}
				if (!parentCustomerNumber)
				{
					var parentCustomerLogin = Controls.CustomerID__.GetValue();
					if (parentCustomerLogin)
					{
						var splittedValue = parentCustomerLogin.split('$');
						parentCustomerNumber = splittedValue[splittedValue.length - 1];
					}
				}
				customerNumbers.push(parentCustomerNumber);

				if (children.length > 0)
				{
					var childCustomerNumbers = children.map((child) =>
					{
						if (child.BUSINESSPARTNERID)
						{
							return child.BUSINESSPARTNERID;
						}

						var splittedLogin = child.CUSTOMERID__.split("$");
						return splittedLogin[splittedLogin.length - 1];
					});

					customerNumbers = customerNumbers.concat(childCustomerNumbers);
				}

				resolve(customerNumbers);
			});
		});
	},
	GetCustomerFilter: function (type)
	{
		return Sys.Helpers.Promise.Create(function (resolve)
		{
			CustomerDetailsHelper.GetCustomerNumbers().Then((customerNumbers) =>
			{
				resolve(Lib.CM.CombinedCustomerHelper.GetCustomerFilter(type, customerNumbers, ProcessInstance.extendedProperties.login, Data.GetValue("SupplierCompanyCode__")));
			});
		});
	}
};

var TermSyncHelper = {
	_termSyncEnabled: false,
	_termsyncCustomerInfoPromise: null,
	Init: function ()
	{
		TermSyncHelper._termSyncEnabled = ProcessInstance.extendedProperties.appInstances.AR && Sys.AR.GetParameter("Enable_Termsync_Synchronization", false)
			&& Sys.AR.GetParameter("Termsync_Target_Env__", false) !== "NONE";
		if (TermSyncHelper._termSyncEnabled)
		{
			TermSyncHelper.FetchTermsyncData();

			var cbGetTimeLine = function (termSyncEvents)
			{
				if (termSyncEvents && termSyncEvents.events && termSyncEvents.events.length > 0)
				{
					for (var i = 0; i < termSyncEvents.events.length; i++)
					{
						Controls.Timeline__.AddEntry(termSyncEvents.events[i]);
					}

					if (!termSyncEvents.isLastPage)
					{
						Controls.Timeline__.ShowLoadMore(true);
						Controls.Timeline__.OnLoadMoreClick = function ()
						{
							termSyncEvents.GetPreviousEvents(cbGetTimeLine);
						};
					}
					else
					{
						Controls.Timeline__.ShowLoadMore(false);
					}

					Controls.Timeline__.ShowEmptyMessage(false);
				}
				else
				{
					Controls.Timeline__.ShowEmptyMessage(true, "_TermSyncTimelineEmpty");
				}
				Controls.Timeline__.Refresh();
			};

			Sys.AR.TermSync.Client.GetCustomerTimeline(ProcessInstance.extendedProperties.businessPartnerID, null, 4, cbGetTimeLine);
		}
	},
	FetchTermsyncData: function ()
	{
		TermSyncHelper.QueryTermsyncCustomerInfo()
			.Then(function (customerInfos)
			{
				Lib.CM.CustomerHelper.DisplayADP(customerInfos.AverageDSO);
				Lib.CM.CustomerHelper.DisplayPayerRating(customerInfos.PayerRating);

				if (Sys.AR.GetParameter("Termsync_Use_As_Invoice_Reference"))
				{
					Lib.CM.CustomerHelper.SetupTermsynCounters(customerInfos);
				}
			})
			.Catch(function (e)
			{
				Log.Error("Termsync query error");
				Lib.CM.CustomerHelper.DisplayADP(null);
				Lib.CM.CustomerHelper.DisplayPayerRating(null);
			});
	},
	QueryTermsyncCustomerInfo: function ()
	{
		return Lib.CM.CustomerHelper.LoadTermSyncCustomerInfo(ProcessInstance.extendedProperties.businessPartnerID, Data.GetValue("Currency__"));
	}
};

var CMHelper =
{
	Init: function ()
	{
		if (!ProcessInstance.extendedProperties.appInstances.AR || !Sys.AR.GetParameter("EnableCreditApplication"))
		{
			return;
		}

		if (User.IsBusinessRoleEnabled("CMAllowCreditCheckOnExistingCustomer") || User.IsBusinessRoleEnabled("CMEditCreditInformation"))
		{
			this.DisplayCreditReviewAction();
			if (User.IsBusinessRoleEnabled("CMEditCreditInformation"))
			{
				this.DisplayInsuranceAmountAction();
			}
		}

		Controls.InsuranceAmountCounter__.SetValue({
			value: Lib.CM.CustomerHelper.CurrencyFormat(Data.GetValue("InsuranceAmount__") || 0)
		});
		Controls.CreditScore_CompanyIdentifier__.OnChange = this.onChange;
		this.SetInternalScoreCounter();
		this.HandleCreditHold(Controls.CreditHold__.GetValue());
		this.DisplayInternalScoreToolTip();

		Controls.CreditLimitStrategy__.SetAvailableValues(Lib.CM.CombinedCustomerHelper.GetCombineCreditLimitOptions());
	},
	SetInternalScoreCounter: function ()
	{
		if (Controls.ScoringRulesIdApplied__.GetValue())
		{
			Controls.InternalScoreCounter__.SetClickable();
			Controls.InternalScoreCounter__.OnClick = function ()
			{
				var cimRuid = Data.GetValue("ruidEx");
				Data.StorageSetValue("ScoringRule-" + cimRuid, JSON.stringify({
					termSyncId: Controls.BusinessPartnerId__.GetValue(),
					internalScore: Controls.InternalScore__.GetValue(),
					scoreId: Controls.CreditScore_CompanyIdentifier__.GetValue(),
					currency: Controls.Currency__.GetValue(),
					customerId: ProcessInstance.extendedProperties.businessPartnerID,
					customerLogin: Data.GetValue("CustomerID__"),
					customerName: ProcessInstance.extendedProperties.company,
					cimRuid: cimRuid
				}));

				Process.OpenMessage({
					ruidEx: Controls.ScoringRulesIdApplied__.GetValue(),
					goBackOnQuit: true,
					additionalParameters: {
						cimRuid: cimRuid
					}
				});
			};
		}
		else
		{
			Controls.InternalScoreCounter__.SetClickable(false);
			Controls.InternalScoreCounter__.OnClick = null;
		}
		const internalScore = Data.GetValue("InternalScore__");
		const counterValue = internalScore === 0 ? internalScore.toString() : internalScore;
		Controls.InternalScoreCounter__.SetValue({
			value: typeof counterValue === "number" || counterValue === '0' ? counterValue : "N/A"
		});
		const thresholds = [
			{ maxVal: 0, color: "#1a2732" },
			{ maxVal: 20, color: "#D8262E" },
			{ maxVal: 40, color: "#ff6c0c" },
			{ maxVal: 60, color: "#f2ae00" },
			{ maxVal: 100, color: "#3fbfad" }
		];

		if (typeof internalScore === "number")
		{
			for (const threshold of thresholds)
			{
				if (internalScore <= threshold.maxVal)
				{
					Controls.InternalScoreCounter__.SetColor({ color: threshold.color });
					Controls.InternalScorePane.SetProgressBar({ value: internalScore, color: threshold.color });
					break;
				}
			}
		}
	},
	onChange: function ()
	{
		Data.GetValue("ThirdPartiesIds__") !== "" && ProcessInstance.UpdateRecord(function (lastErrorMessage)
		{
			if (!lastErrorMessage)
			{
				Sys.Helpers.SilentChange(function ()
				{
					Data.SetValue("ThirdPartiesIds__", "");
				});
			}
		}, { ThirdPartiesIds__: "" });
	},
	DisplayCreditReviewAction: function ()
	{
		CMHelper.SetOnPanels();
		Query.DBQuery(function ()
		{
			var state = parseInt(this.GetQueryValue("state"), 10);
			Controls.AskForCreditCheck.Hide(!User.IsBusinessRoleEnabled("CMAllowCreditCheckOnExistingCustomer"));
			if (!isNaN(state))
			{
				CMHelper.OnRunningCredApp({ currentCredAppId: this.GetQueryValue("ruidex") });
				return;
			}
			CMHelper.OnNoCredApp();
		},
			"CDNAME#CM - Credit Application",
			"ruidex|state",
			"(&(CustomerLogin__=" + CustomerDetailsHelper.mainContactLogin + ")(state<100)(deleted=0))",
			"SubmitDateTime DESC",
			1);
	},
	DisplayInsuranceAmountAction: function ()
	{
		Query.DBQuery(function ()
		{
			var allowDirectInsuranceEdition = this.GetQueryResult().GetQueryValue("AllowDirectInsuranceEdition__");
			if (allowDirectInsuranceEdition === "1")
			{
				Controls.InsurancePane.AddAction({
					id: "EditInsuranceLimit",
					fontAwesomeClass: "fa fa-pencil",
					toolText: Language.Translate("_ChangeInsuranceAmountAction"),
					callback: function ()
					{
						Popup.Dialog("_InsuranceAmountPopupTitle", null,
							function (dialog)
							{
								dialog.AddInteger("ctrlInsuranceAmount", "_InsuranceAmount");
								dialog.RequireControl("ctrlInsuranceAmount", true);
							},
							function (dialog)
							{
								Data.SetValue("InsuranceAmount__", dialog.GetControl("ctrlInsuranceAmount").GetValue());
								Data.SetValue("InsuranceAmountSource__", "manual");
								ProcessInstance.Save("SaveInsuranceAmount");
							}
						);
					}
				});
			}
		},
			"AR - Application Global Settings__",
			"AllowDirectInsuranceEdition__",
			"",
			"",
			1
		);
	},
	DisplayInternalScoreToolTip: function ()
	{
		var lastInternalScoreUpdate = Data.GetValue("LastInternalScoreUpdate__") ? Language.FormatDate(Data.GetValue("LastInternalScoreUpdate__")) : "";
		Controls.InternalScorePane.AddAction(Lib.CM.CustomerHelper.GetInternalScoreTooltip(lastInternalScoreUpdate, Data.GetValue("ScoringRulesIdApplied__")));
		Controls.InternalScorePane.AddAction({
			id: "RecomputeInternalScore",
			fontAwesomeClass: "fa fa-refresh",
			toolText: Language.Translate("_RecomputeInternalScore"),
			callback: function ()
			{
				CMHelper.RefreshInternalCreditScore();
			}
		});
	},
	HandleCreditHold: function (value)
	{
		Controls.CreditHold.Hide(false);
		Controls.CreditHold.SetLabel(Language.Translate(value ? "_DisableCreditHold" : "_EnableCreditHold"));
		CustomerDetailsHelper.DisplayBlockStatus();
	},
	SetOnPanels: function ()
	{
		if (User.IsBusinessRoleEnabled("CMEditCreditInformation"))
		{
			Controls.CreditLimit.AddAction(this.panelsAction);
			Controls.RiskCategoryPane.AddAction(this.panelsAction);
			Controls.PaymentBehaviorPane.AddAction(this.panelsAction);
		}
	},
	OnRunningCredApp: function (args)
	{
		this.panelsAction.fontAwesomeClass = "fa fa-exclamation-circle";
		this.panelsAction.toolText = Language.Translate("_Credit review is being processed");
		this.panelsAction.colorIndex = "Warning";
		this.panelsAction.callback = function ()
		{
			Process.OpenMessage(args.currentCredAppId, true);
		};

		Controls.AskForCreditCheck.SetLabel("_creditReviewAlreadyCreated");
		Controls.AskForCreditCheck.OnClick = function ()
		{
			Process.OpenMessage(args.currentCredAppId, true);
		};

		this.SetOnPanels();
		this.UpdateCreditHoldButton(true, args.currentCredAppId);
	},
	OnNoCredApp: function ()
	{
		this.panelsAction.fontAwesomeClass = "fa fa-pencil";
		this.panelsAction.toolText = Language.Translate("_Initiate credit review");
		this.panelsAction.callback = function ()
		{
			CMHelper.ShowReviewPopup({
				title: "_Edit credit information",
				creditHold: Controls.CreditHold__.GetValue(),
				reviewType: Lib.CM_Client.CreditApplicationReview.manualReviewType
			});
		};
		this.UpdateCreditHoldButton(false);

		Controls.AskForCreditCheck.OnClick = function ()
		{
			Lib.CM_Client.CreditApplicationReview.CreditRequest.Show({
				customerId: CustomerDetailsHelper.mainContactLogin,
				riskCategory: Controls.RiskCategory__.GetValue(),
				thirdPartiesIds: Data.GetValue("ThirdPartiesIds__"),
				credAppCreationCallback: function (data)
				{
					CMHelper.OnNewCredApp(data);
					const snackOpts = data.error ?
						{ message: Language.Translate("_Credit check request is in error"), status: "error", closable: true } :
						{ message: Language.Translate("_Credit check is successfully created"), status: "success", closable: true };
					Popup.Snackbar(snackOpts);
				}
			});
		};
		this.SetOnPanels();
	},
	OnNewCredApp: function (data)
	{
		this.panelsAction.callback = function ()
		{
			if (data.error)
			{
				Popup.Alert("_The previous review request is in error. Check it and try again.", true, null, "Error");
			}
			else
			{
				Process.OpenMessage(data.ruid, true);
			}
		};
		this.panelsAction.fontAwesomeClass = "fa fa-exclamation-circle";
		this.panelsAction.toolText = Language.Translate("_Credit review is being processed");
		this.panelsAction.colorIndex = "Warning";
		Controls.AskForCreditCheck.SetLabel("_creditReviewAlreadyCreated");
		Controls.AskForCreditCheck.OnClick = function ()
		{
			Process.OpenMessage(data.ruid, true);
		};
		this.SetOnPanels();
		this.UpdateCreditHoldButton(true, data.ruid);
	},
	panelsAction:
	{
		id: "editCredApp",
		colorIndex: "9",
		fontAwesomeClass: "fa fa-spin fa-circle-o-notch"
	},
	ShowReviewPopup: function (args)
	{
		const paymentTermsPromise = new Promise((resolve) => Lib.CM.GetPaymentTermsForCompanyCode(Data.GetValue("SupplierCompanyCode__"), resolve));
		const riskCategoriesPromise = new Promise((resolve) => Lib.CM.GetRiskCategories(resolve));
		const hasBlockedOrdersPromise = new Promise((resolve) =>
		{
			CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.CreditManagement).Then((filter) =>
			{
				const filterOrderBlocked = Sys.Helpers.LdapUtil.FilterAnd(
					filter,
					Sys.Helpers.LdapUtil.FilterEqual("Blocked_Order__", "1")
				).toString();
				Query.DBQuery(function ()
				{
					resolve(this.GetRecordsCount() > 0);
				}, "CM - Orders Import__", "RuidEx", filterOrderBlocked, null, 1);
			});
		});

		Promise.all([
			paymentTermsPromise,
			riskCategoriesPromise,
			CustomerDetailsHelper.GetChildrenPromise(),
			hasBlockedOrdersPromise
		]).then(([paymentTermsList, riskCategories, children, hasBlockedOrders]) =>
		{
			Lib.CM_Client.CreditApplicationReview.CreditReview.Show({
				title: args.title,
				customerId: CustomerDetailsHelper.mainContactLogin,
				customerHasChildren: children.length > 0,
				strategyCreditLimit: Data.GetValue("CreditLimitStrategy__"),
				combineCreditLimitOptions: Lib.CM.CombinedCustomerHelper.GetCombineCreditLimitOptions(),
				creditLimit: Data.GetValue("CreditLimit__"),
				currency: Data.GetValue("Currency__"),
				paymentTerms: Controls.PaymentTerms__.GetValue(),
				riskCategory: Controls.RiskCategory__.GetValue(),
				thirdPartiesIds: Data.GetValue("ThirdPartiesIds__"),
				paymentTermsValues: paymentTermsList.map(function (paymmentTerm)
				{
					return paymmentTerm.Key + "=" + paymmentTerm.Key;
				}),
				riskCategoriesValues: riskCategories.map(function (category)
				{
					return category.Key + "=" + category.Key;
				}),
				adp: Data.GetValue("ADP__"),
				insuranceAmount: Data.GetValue("InsuranceAmount__") || 0,
				internalScore: Data.GetValue("InternalScore__"),
				creditHold: args.creditHold,
				reviewType: args.reviewType,
				hasBlockedOrders: hasBlockedOrders ? 1 : 0,
				credAppCreationCallback: function (data)
				{
					CMHelper.OnNewCredApp(data);
					const snackOpts = data.error ?
						{ message: Language.Translate("_Review request is in error"), status: "error", closable: true } :
						{ message: Language.Translate("_Review request is successfully created"), status: "success", closable: true };
					Popup.Snackbar(snackOpts);
				}
			});
		});
	},
	UpdateCreditHoldButton: function (activeReview, currentCredAppId)
	{
		if (activeReview)
		{
			Controls.CreditHold.OnClick = function ()
			{
				Lib.CM_Client.CreditApplicationReview.CreditHoldExistingReviewPopup.Show({
					customerId: CustomerDetailsHelper.mainContactLogin,
					reviewRuidEx: currentCredAppId,
					reviewType: Lib.CM_Client.CreditApplicationReview.creditHoldReviewType
				});
			};
		}
		else
		{
			Controls.CreditHold.OnClick = function ()
			{
				CMHelper.ShowReviewPopup({
					title: Controls.CreditHold__.GetValue() ? "_DisableCreditHold" : "_EnableCreditHold",
					creditHold: !Controls.CreditHold__.GetValue(),
					reviewType: Lib.CM_Client.CreditApplicationReview.creditHoldReviewType
				});
			};
		}
	},
	RefreshInternalCreditScore: async function ()
	{
		Controls.InternalScoreCounter__.SetValue({
			value: 0
		});
		Controls.InternalScorePane.SetProgressBar({ value: 0 });

		const ruidEx = Data.GetValue("ruidex");
		scoreCalculationHelper.SetDataOrigin(Lib.CM.ScoreCalculationHelperCommon.DataOriginType.customer);
		let matchingScoreRule = null;
		let hasUserExit = false;

		try
		{
			hasUserExit = Lib.CM.ScoreCalculation.HasUserExit();

			if (!hasUserExit)
			{
				const scoreRules = await scoreCalculationHelper.LoadRules(true, true, false);
				matchingScoreRule = scoreRules && Object.keys(scoreRules).length > 0 ? scoreCalculationHelper.GetMatchingRule((fieldName) =>
				{
					return Data.GetValue(fieldName) != null ? Data.GetValue(fieldName) : CustomerDetailsHelper.userData[fieldName];
				}, scoreRules) : null;

				if (!matchingScoreRule)
				{
					const updateDate = new Date();
					await new Promise((resolve) =>
					{
						ProcessInstance.UpdateRecord((errMsg) =>
						{

							if (errMsg)
							{
								Log.Warn("Error while updating user's internal score and scoring rule");
								return;
							}
							Sys.Helpers.SilentChange(function ()
							{
								Data.SetValue("InternalScore__", null);
								Data.SetValue("ScoringRulesIdApplied__", null);
								Data.SetValue("LastInternalScoreUpdate__", updateDate);
							});
							resolve();
						}, { InternalScore__: null, ScoringRulesIdApplied__: null, LastInternalScoreUpdate__: updateDate });
					});
					throw "Lib.CM.Customization.SuggestedCreditValues.ComputeInternalScore function isn't defined in LIB_CM_CUSTOMIZATION_SUGGESTEDCREDITVALUES library and there are no enabled score rules to match against.";
				}
			}
		}
		catch (err)
		{
			if (err && typeof err === "string")
			{
				Log.Info(err);
			}
		}

		const shouldCalculateScore = hasUserExit || matchingScoreRule;
		const matchingScoreRuleId = matchingScoreRule && matchingScoreRule.id;

		if (!shouldCalculateScore)
		{
			this.DisplayInternalScoreToolTip();
			CMHelper.SetInternalScoreCounter();
			return;
		}

		let termsyncInfos = null;

		if (TermSyncHelper._termSyncEnabled)
		{
			termsyncInfos = await TermSyncHelper.QueryTermsyncCustomerInfo();
		}

		let scoreHasBeenUpdated = false;
		let score;

		try
		{
			score = await scoreCalculationHelper.ComputeScore(
				{
					customerLogin: Data.GetValue("CustomerID__"),
					cimRuid: ruidEx,
					currency: Data.GetValue("Currency__"),
					scoreRuleId: matchingScoreRuleId || hasUserExit,
					scoreId: Data.GetValue("CreditScore_CompanyIdentifier__")
				},
				{
					CIMInfos: {
						GetValue: (fieldName) =>
						{
							return Data.GetValue(fieldName) != null ? Data.GetValue(fieldName) : CustomerDetailsHelper.userData[fieldName];
						}
					},
					termsyncInfos: termsyncInfos
				},
				true
			);

			scoreHasBeenUpdated = true;
		}
		catch (err)
		{
			Log.Error(err);
			scoreHasBeenUpdated = false;
		}

		if (scoreHasBeenUpdated && (score !== Data.GetValue("InternalScore__") || matchingScoreRuleId !== Data.GetValue("ScoringRulesIdApplied__")))
		{
			await new Promise((resolve) =>
			{
				const updateDate = new Date();
				const scoringRulesIdApplied = matchingScoreRuleId === true ? void 0 : matchingScoreRuleId;
				ProcessInstance.UpdateRecord((errMsg) =>
				{
					if (errMsg)
					{
						Log.Warn("Error while updating user's internal score and scoring rule");
						resolve();
						return;
					}
					Sys.Helpers.SilentChange(function ()
					{
						Data.SetValue("InternalScore__", score);
						Data.SetValue("ScoringRulesIdApplied__", scoringRulesIdApplied);
						Data.SetValue("LastInternalScoreUpdate__", updateDate);
					});
					resolve();
				}, { InternalScore__: score, ScoringRulesIdApplied__: scoringRulesIdApplied, LastInternalScoreUpdate__: updateDate });
			});
		}
		this.DisplayInternalScoreToolTip();
		CMHelper.SetInternalScoreCounter();
	}
};

const CollectionHelper = {
	_invoicesPromise: null,
	Init: function ()
	{
		const customerLogin = ProcessInstance.extendedProperties ? ProcessInstance.extendedProperties.login : "";
		const customerNumber = ProcessInstance.extendedProperties ? ProcessInstance.extendedProperties.businessPartnerID : "";

		CollectionHelper._invoicesPromise = Lib.Collection.PaymentStrategyHelperCommon.FetchInvoices(customerLogin);
		CollectionHelper.InitPaymentReminderButton(customerLogin);
		CollectionHelper.InitTimeline(customerLogin, customerNumber);
	},
	IsEnabled: function ()
	{
		return Sys.AR.GetParameter("EnableEODCollectionManagement__");
	},
	HasOverdueInvoices: function (callback)
	{
		CollectionHelper._invoicesPromise.Then(function (invoicesJSON)
		{
			callback(invoicesJSON);
		});
	},
	InitPaymentReminderButton: function (customerLogin)
	{
		Controls.PaymentReminder.SetDisabled(true);
		let invoices;

		CollectionHelper.HasOverdueInvoices(function (invoicesJSON)
		{
			if (invoicesJSON !== "[]")
			{
				invoices = invoicesJSON;
				Controls.PaymentReminder.SetDisabled(false);
			}
		});

		Controls.PaymentReminder.OnClick = function ()
		{
			const customerName = ProcessInstance.extendedProperties ? ProcessInstance.extendedProperties.company : "";
			const values = {
				Automatic__: "0",
				CustomerLogin__: customerLogin,
				CustomerName__: customerName
			};
			const externalVars = {
				InvoicesData__: invoices,
				CompanyCode__: Data.GetValue("SupplierCompanyCode__"),
				CompanyName__: ProcessInstance.extendedProperties.company,
				CustomerNumber__: Data.GetValue("BusinessPartnerId__"),
				CustomerMsn__: ProcessInstance.extendedProperties.msn
			};
			const options = {
				openInNewTab: false,
				callback: function (data)
				{
					const snackOpts = data.error ?
						{ message: Language.Translate("_Payment reminder creation failed"), status: "error", closable: true } :
						{ message: Language.Translate("_Payment reminder successfully created"), status: "success", closable: true };

					Popup.Snackbar(snackOpts);

					const REMINDERS_REFRESH_DELAY = 2000;
					setTimeout(function ()
					{
						Controls.CollectionReminders__.Apply();
					}, REMINDERS_REFRESH_DELAY);
				}
			};

			Popup.Confirm(
				Language.Translate("_SendReminderConfirmationMessage", true, ProcessInstance.extendedProperties.emailAddress),
				false,
				function () { CollectionHelper.onConfirmOKClick(values, externalVars, options); },
				null,
				Language.Translate("_SendReminderPopUp")
			);
		};
	},
	onConfirmOKClick: function (values, externalVars, options)
	{
		Process.CreateProcessInstance("Collection - Payment Reminder", values, externalVars, options);
	},
	InitTimeline: function (customerLogin, customerNumber)
	{
		if (CollectionHelper.IsEnabled() && Lib.Collection && Lib.Collection.TimelineClient)
		{
			Lib.Collection.TimelineClient.InitializeTimeline(Controls.Timeline__, customerLogin, customerNumber);
		}
	}
};

const LogCallHelper = {
	Init: function ()
	{
		Controls.LogCall.OnClick = function ()
		{
			Process.OpenLink({
				url: Sys.Helpers.GetProcessURL("Collection management - Collection call", {
					onQuit: "Close",
					parameters: {
						customerName: ProcessInstance.extendedProperties.company,
						customerId: Data.GetValue("BusinessPartnerId__"),
						customerLogin: Data.GetValue("CustomerID__"),
						companyCode: Data.GetValue("SupplierCompanyCode__"),
						customerMsn: ProcessInstance.extendedProperties.msn
					}
				}),
				inCurrentTab: false
			});
		};
	}
};

var LoaderHelper = {
	hiddenControls: [],
	activeLoaders: [],
	ShowLoader: function (displayedTab)
	{
		const menu = NavMenuHelper.Menus[displayedTab];
		this.hiddenControls[displayedTab] = [];
		this.activeLoaders[displayedTab] = [];

		if (!menu || !menu.panes)
		{
			return;
		}

		for (const pane in menu.panes)
		{
			const paneLoaderName = pane + "_Loader__";

			if (Controls[paneLoaderName])
			{
				Controls[paneLoaderName].SetHTML(Sys.AR.Client.GetFieldsLoaderHtmlContent());
				Controls[paneLoaderName].Hide(false);

				var controls = Controls[pane].GetControls().filter(elt => elt.IsVisible() && elt.GetName() !== paneLoaderName);

				controls.forEach(control => control.Hide(true));

				this.hiddenControls[displayedTab] = this.hiddenControls[displayedTab].concat(controls);
				this.activeLoaders[displayedTab].push(Controls[paneLoaderName]);
			}
		}
	},

	HideLoader: function (displayedTab)
	{
		this.activeLoaders[displayedTab].forEach(loader => loader.Hide(true));
		this.activeLoaders[displayedTab] = [];

		this.hiddenControls[displayedTab].forEach(control => control.Hide(false));
		this.hiddenControls[displayedTab] = [];
	}
};

var EventHistoryPaneHelper = {
	_views: {
		allEvents: "_Default audit-history view",
		loginEvents: "_Login audit-history view",
		persoInfEditEvents: "_Modification audit-history view",
		actionsEvents: "_Transport audit-history view"
	},
	Init: function ()
	{
		var that = this;

		Controls.EventsHistory_NavMenu__.BindEvent("onClick", function (evt)
		{
			that.ChangeActivityView(that._views[evt.args]);
		});

		Controls.EventsHistory_NavMenu__.BindEvent("onLoad", function ()
		{
			var trads = {};
			for (var t in that._views)
			{
				trads[t] = Language.Translate(that._views[t]);
			}
			Controls.EventsHistory_NavMenu__.FireEvent("onEventHistoryLoad", { tabs: trads });
		});
	},
	OnStart: function ()
	{
		this.ChangeActivityView(this._views.persoInfEditEvents);
	},
	ChangeActivityView: function (viewName)
	{
		Controls.EventHistoryView__.SetView({
			viewName: viewName,
			filter: "(&(RecipientType=AUD)(|(OwnerID=" + ProcessInstance.extendedProperties.ownerId + ")(SourceMsn=" + ProcessInstance.extendedProperties.msn + ")))",
			checkProfileTab: false,
			isSystem: true
		});

		Controls.EventHistoryView__.Apply();
	}
};

var InternalNoteHelper = {
	TableName: "AR - Internal Notes__",
	FormatNoteDate: function (date)
	{
		if (!date || typeof date.getTime !== "function" || !Number.isFinite(date.getTime()))
		{
			return "";
		}
		return Sys.Helpers.Date.ToLocale(Sys.Helpers.Date.GetDateInUserTimezone(date, User.utcOffset), User.culture);
	},
	LoadLastInternalNote: function ()
	{
		var callback = function ()
		{
			var lastInternalNote;

			if (this.GetRecordsCount() === 1)
			{
				var dbDateTime = this.GetQueryValue("Date__");
				lastInternalNote = {
					content: this.GetQueryValue("Note_content__"),
					flagged: this.GetQueryValue("Flagged__") === "1",
					date: dbDateTime ? InternalNoteHelper.FormatNoteDate(Sys.Helpers.Date.ISO8601StringToDate(dbDateTime.replace(" ", "T") + "Z")) : ""
				};
			}

			Controls.LastInternalNote__.FireEvent("onLastInternalNoteLoad", {
				lastInternalNote,
				translations: {
					NoLastInternalNote: Language.Translate("_No_last_internal_note")
				}
			});

		};
		CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.InternalNotes).Then((filter) =>
		{
			Query.DBQuery(callback, InternalNoteHelper.TableName, "Note_content__|Flagged__|Date__", filter, "Date__ DESC", 1, null, "DateTimeInUtc=1");
		});
	},
	Init: function ()
	{
		if (!ProcessInstance.extendedProperties.appInstances.AR)
		{
			return;
		}
		Controls.LastInternalNote__.BindEvent("NewInternalNoteAction", this.NewInternalNote);
		Controls.AddInternalNote__.OnClick = this.NewInternalNote;

		Controls.LastInternalNote__.BindEvent("onLoad", function ()
		{
			Controls.LastInternalNote__.FireEvent("onLastInternalNoteLoading", {
				translations: {
					ViewAllNotes: Language.Translate("_View_all_notes"),
					NewInternalNote: Language.Translate("_New_internal_note")
				},
				imgElemHtml: Sys.Portal.GetFieldsLoaderHtmlContent()
			});
		});

		this.LoadLastInternalNote();
	},
	NewInternalNote: function ()
	{
		Popup.Dialog("_New_internal_note_title", null, InternalNoteHelper.FillCallback, InternalNoteHelper.CommitCallback, InternalNoteHelper.ValidateCallback, null, null);
	},


	FillCallback: function (dialog)
	{
		dialog.SetWidth("500px");
		dialog.AddMultilineText("ctrlContent", "_Content");
		var ctrlError = dialog.AddDescription("ctrlError", "");
		ctrlError.AddStyle("text-highlight-warning");
		dialog.MaskControl(ctrlError, true);
		dialog.RequireControl("ctrlContent", true);
	},
	CommitCallback: function (dialog)
	{
		var content = dialog.GetControl("ctrlContent").GetValue();
		var date = new Date();
		Process.CreateTableRecord(InternalNoteHelper.TableName, {
			Note_content__: content,
			Date__: "NOW()",
			Customer_ID__: ProcessInstance.extendedProperties.login
		}, {
			callback: function (data)
			{
				var snackOpts;
				if (data.error)
				{
					snackOpts = { message: Language.Translate("_Internal_note_could_not_be_created"), status: "error", closable: true };
				}
				else
				{
					snackOpts = { message: Language.Translate("_Internal_note_created"), status: "success", closable: true };
					Controls.LastInternalNote__.FireEvent("onLastInternalNoteLoad", {
						lastInternalNote: {
							content,
							flagged: false,
							date: InternalNoteHelper.FormatNoteDate(date)
						}
					});
				}
				Controls.InternalNotesView__.Apply(data.ruid);
				Popup.Snackbar(snackOpts);
			}
		});
	},
	ValidateCallback: function (dialog)
	{
		var ctrlContent = dialog.GetControl("ctrlContent");
		var ctrlError = dialog.GetControl("ctrlError");
		var valid = ctrlContent.GetValue();
		if (valid)
		{
			valid = valid.trim();
		}
		valid = !!valid;
		dialog.MaskControl(ctrlError, valid);
		return valid;
	}
};

var NavMenuHelper = {
	_defaultMiddlePanes: {},
	Menus: {
		overview: {
			panes: {
				CountersPane: true,
				TermsyncCountersPane: true,
				ReportsPane: true,
				OrdersCountersPane: true,
				InternalScorePane: true,
				CreditLimit: true,
				TotalExposurePane: true,
				InsurancePane: true,
				RiskCategoryPane: true,
				PaymentBehaviorPane: true,
				ADPPane: true,
				PayerRatingPane: true,
				DeductionsCountersPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane,
				SynergyInsightsPane: false
			},
			init: async function ()
			{
				var counters = PackageHelper.getCounters();
				var reports = PackageHelper.getReports();
				var htmlContents = PackageHelper.getHTMLContents();
				var controls = counters.concat(reports).concat(htmlContents);

				const useTermSyncAsInvoiceReference = Lib.CM.CustomerHelper.UseTermSyncAsInvoiceReference();
				this.panes.CountersPane = ProcessInstance.extendedProperties.appInstances.AR && counters.length > 0 && !useTermSyncAsInvoiceReference;
				this.panes.TermsyncCountersPane = useTermSyncAsInvoiceReference;
				this.panes.OrdersCountersPane = (ProcessInstance.extendedProperties.appInstances.COP || Sys.AR.GetParameter("EnableCreditApplication")) && counters.length > 0;
				this.panes.CreditLimit = Sys.AR.GetParameter("EnableCreditApplication");
				this.panes.InternalScorePane = Sys.AR.GetParameter("EnableCreditApplication");
				this.panes.RiskCategoryPane = Sys.AR.GetParameter("EnableCreditApplication");
				this.panes.TotalExposurePane = Sys.AR.GetParameter("EnableCreditApplication");
				this.panes.InsurancePane = Sys.AR.GetParameter("EnableCreditApplication") && Sys.AR.GetParameter("ShowInsuranceInfo");
				this.panes.PaymentBehaviorPane = Sys.AR.GetParameter("EnableCreditApplication");
				this.panes.PayerRatingPane = TermSyncHelper._termSyncEnabled;
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.DeductionsCountersPane = Sys.AR.GetParameter("EnableDeductionsApplication");
				this.panes.ReportsPane = reports.length > 0;
				this.panes.ADPPane = (Sys.AR.GetParameter("EnableCreditApplication") || TermSyncHelper._termSyncEnabled) && CustomerDetailsHelper.isMainContact;
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
				let updateControl = function (control, filter)
				{
					// Only show if not hidden by role-based restrictions
					if (CustomerProfileDisplayHelper._roleHiddenControls.indexOf(control.GetName()) === -1)
					{
						control.Hide(false);
					}
					if (typeof control.SetAdditionalFilter === "function")
					{
						control.SetAdditionalFilter(filter);
						control.Refresh();
					}
				};

				CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.Counters).Then((filter) =>
				{
					for (let i = 0; i < controls.length; i++)
					{
						if (controls[i].GetName() === "OrdersToValidate__")
						{
							CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.Orders).Then((filter) =>
							{
								updateControl(controls[i], filter);
							});
						}
						else
						{
							updateControl(controls[i], filter);
						}
					}
				});

				this.HandleActivatedCreditManagement();
				if (this.panes.TotalExposurePane)
				{
					Controls.TotalExposurePane.AddAction({
						fontAwesomeClass: "fa fa-exclamation-circle",
						colorIndex: "Info",
						toolText: Data.GetValue("isExposureImported__") ? Language.Translate("_Total exposure imported") : Language.Translate("_Total exposure calculation")
					});
				}
				if (this.panes.InsurancePane)
				{
					Controls.InsurancePane.AddAction({
						id: "insuranceAmountSource",
						fontAwesomeClass: "fa fa-exclamation-circle",
						colorIndex: "Info",
						toolText: Language.Translate("_InsuranceAmount From {0}", false, Language.Translate(Controls.InsuranceAmountSource__.GetAvailableValues(false, true)[Controls.InsuranceAmountSource__.GetValue()]))
					});
				}
				this.panes.SynergyInsightsPane = await SynergyAnalysisHelper.IsPaneVisible();
			},
			onStart: function ()
			{
				CustomerProfileDisplayHelper.Init();
				if (this.panes.SynergyInsightsPane)
				{
					SynergyAnalysisHelper.Init();
				}
			},
			HandleActivatedCreditManagement: function ()
			{
				if (Sys.AR.GetParameter("EnableCreditApplication"))
				{
					if (Data.GetValue("EnableHistoric__"))
					{
						CustomerDetailsHelper.GetCustomerNumbers().Then((customerNumbers) =>
						{
							Lib.CM.CustomerHelper.GetHistoricalData({
								customerNumbers: customerNumbers,
								dataLabelsFormatter: Lib.CM.CustomerHelper.CurrencyFormat,
								callback: function (historicalData)
								{
									Controls.Historic__.SetValue(historicalData);
								}
							});
						});
					}
					if (!TermSyncHelper._termSyncEnabled)
					{
						Lib.CM.CustomerHelper.DisplayADP(Data.GetValue("ADP__"));
					}
				}
			}
		},
		invoices: {
			_views: {
				allInvoices: "_Invoices customer - embedded",
				overdueInvoices: "_Customer invoices payment late - embedded",
				outstandingInvoices: "_Customer invoices unpaid - embedded",
				"60daysInvoices": "_Customer invoices 60 days - embedded",
				creditNotesInvoices: "_Customer credits 60 days - embedded",
				disputeInvoices: "_Disputed invoices supplier - embedded",
				promiseToPay: "_Customer invoices promise to pay - embedded"
			},
			panes: {
				InvoicesPane: true,
				CountersPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				var counters = PackageHelper.getCounters();
				this.panes.CountersPane = ProcessInstance.extendedProperties.appInstances.AR && counters.length > 0;
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();

				var that = this;
				Controls.InvoiceMenu__.BindEvent("onClick", function (evt)
				{
					that.changeInvoicesView(that._views[evt.args]);
				});
				Controls.InvoiceMenu__.BindEvent("onLoad", function ()
				{
					var tabs = {};
					for (var t in that._views)
					{
						tabs[t] = {};
						tabs[t].trad = Language.Translate(that._views[t]);
						var enablePaymentDisplay = (t === "60daysInvoices" || t === "creditNotesInvoices") && Sys.AR.GetParameter("EnablePaymentFeature");
						var disablePaymentDisplay = (t === "overdueInvoices" || t === "outstandingInvoices") && !Sys.AR.GetParameter("EnablePaymentFeature");
						var disablePromiseToPayDisplay = t === "promiseToPay" && !(Sys.AR.GetParameter("Enable_Termsync_Synchronization", false) || Sys.AR.GetParameter("EnableCashApplication"));
						var enableDisputeDisplay = t === "disputeInvoices" && !Sys.AR.GetParameter("EnableDisputeFeature");
						if (enablePaymentDisplay || disablePaymentDisplay || enableDisputeDisplay || disablePromiseToPayDisplay)
						{
							tabs[t].hidden = true;
						}
					}
					Controls.InvoiceMenu__.FireEvent("onInvoicesLoad", { tabs: tabs });
				});
				Controls.Overdue__.OnClick = function ()
				{
					that.displayView("overdueInvoices");
				};
				Controls.TotalOutstanding__.OnClick = function ()
				{
					that.displayView("outstandingInvoices");
				};
				Controls.Disputes__.OnClick = function ()
				{
					that.displayView("disputeInvoices");
				};
				Controls.Invoices60Days__.OnClick = function ()
				{
					that.displayView("60daysInvoices");
				};
				Controls.CreditNotes60Days__.OnClick = function ()
				{
					that.displayView("creditNotesInvoices");
				};
				Controls.PromiseToPay__.OnClick = function ()
				{
					that.displayView("promiseToPay");
				};

				this.changeInvoicesView(this._views.allInvoices);
			},
			displayView: function (viewName)
			{
				Controls.NavMenu__.SelectItem("invoices");
				NavMenuHelper.OnSelectItem("invoices");
				Controls.InvoiceMenu__.FireEvent("onChangeInvoiceView", { viewName: viewName });
			},
			changeInvoicesView: function (viewName)
			{
				CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.Invoices).Then((filter) =>
				{
					Controls.Invoices__.SetView({
						tabName: "_EInvoice supplier - embedded",
						filter: filter,
						viewName: viewName,
						processOrTableName: "Customer invoices (supplier copy)",
						checkProfileTab: false
					});
					Controls.Invoices__.Apply();
				});
			}
		},
		payments: {
			_views_payments: {
				cashAppPayments: "_View_Payments for customers embedded",
				portalPayments: "_View_Payments portal for customers embedded"
			},
			panes: {
				PaymentsPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				var that = this;
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();

				Controls.Payment_NavMenu__.BindEvent("onClick", function (evt)
				{
					that.changePaymentView(that._views_payments[evt.args]);
				});
				Controls.Payment_NavMenu__.BindEvent("onLoad", function ()
				{
					var trads = {};
					for (var t in that._views_payments)
					{
						trads[t] = Language.Translate(that._views_payments[t]);
					}
					Controls.Payment_NavMenu__.FireEvent("onPaymentLoad", {
						IsDisplay: function (id)
						{
							if (id === "cashAppPayments")
							{
								return Sys.AR.GetParameter("EnableCashApplication");
							}
							if (id === "portalPayments")
							{
								return Sys.AR.GetParameter("EnablePaymentFeature");
							}
							return true;
						},
						defaultTab: Sys.AR.GetParameter("EnablePaymentFeature") ? 1 : 0,
						tabs: trads
					});
				});
			},
			onStart: function ()
			{
				if (Sys.AR.GetParameter("EnablePaymentFeature"))
				{
					this.changePaymentView(this._views_payments.portalPayments);
				}
				else
				{
					this.changePaymentView(this._views_payments.cashAppPayments);
				}
			},
			changePaymentView: function (viewName)
			{
				if (viewName === "_View_Payments for customers embedded")
				{
					CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.CashAppPayments).Then((filter) =>
					{
						Controls.Payments__.SetView({
							tabName: "_Tab_Payments embedded_CA",
							filter: filter,
							viewName: viewName,
							checkProfileTab: false,
							processOrTableName: null
						});
						Controls.Payments__.Apply();
					});
				}
				else
				{
					CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.CustomerPortalPayments).Then((filter) =>
					{
						Controls.Payments__.SetView({
							tabName: "_Tab_Payments embedded_AR_System",
							filter: filter,
							viewName: viewName,
							checkProfileTab: false,
							processOrTableName: "AR System Invoices Payment"
						});
						Controls.Payments__.Apply();
					});
				}
			}
		},
		collection: {
			_initialized: false,
			panes: {
				CollectionRemindersPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				if (!CollectionHelper.IsEnabled())
				{
					Controls.PaymentReminder.Hide(true);
					Controls.LogCall.Hide(true);
					return;
				}
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;

				const customerLogin = ProcessInstance.extendedProperties ? ProcessInstance.extendedProperties.login : "";
				const filter = Sys.Helpers.LdapUtil.FilterEqual("CustomerLogin__", customerLogin).toString();
				Controls.CollectionReminders__.SetView({
					tabName: "_Collection Reminders embedded",
					filter: filter,
					viewName: "_Collection Reminders embedded view",
					processOrTableName: "Collection - Payment Reminder",
					checkProfileTab: false
				});
				Controls.CollectionReminders__.Apply();
			},
			onStart: function ()
			{
				this._initialized = true;
			}
		},
		creditScore: {
			_initialized: false,
			panes: {
				InternalScorePane: true,
				CreditLimit: true,
				TotalExposurePane: true,
				RiskCategoryPane: true,
				InsurancePane: true,
				PaymentBehaviorPane: true,
				CreditApplicationPane: true,
				ADPPane: true,
				CreditHistoryPane: true,
				PayerRatingPane: TermSyncHelper._termSyncEnabled,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			gaugeContainer: Controls.CreditScore_GaugeContainer__,
			init: function ()
			{
				if (!Sys.AR.GetParameter("EnableCreditApplication"))
				{
					return;
				}
				this.panes.CreditScorePane = CustomerDetailsHelper.isMainContact;
				this.panes.InsurancePane = Sys.AR.GetParameter("EnableCreditApplication") && Sys.AR.GetParameter("ShowInsuranceInfo");
				const creditLimitValue = Data.GetValue("CreditLimit__");
				const displayValue = creditLimitValue !== null && creditLimitValue !== "" && creditLimitValue !== "undefined"
					? Lib.CM.CustomerHelper.CurrencyFormat(creditLimitValue) : "N/A";
				Controls.CreditLimitCounter__.SetValue({
					value: displayValue
				});
				if (CustomerDetailsHelper.isMainContact)
				{
					Controls.RiskCategoryHTML__.BindEvent("onLoad", function ()
					{
						var data = Lib.CM.CustomerHelper.SetRiskCategoryHTMLContent(Controls.RiskCategory__.GetValue());
						Controls.RiskCategoryHTML__.FireEvent("onDisplayRiskCategory", { value: data.translatedValue, color: data.color });
					});
					Controls.PaymentTermsDisplay__.SetLabel(
						Language.Translate(Controls.PaymentTerms__.GetValue() || "_No payment terms defined").toUpperCase()
					);

					this.panes.PayerRatingPane = TermSyncHelper._termSyncEnabled;
					this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();

					CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.CreditApp).Then((filter) =>
					{
						Controls.CreditApplicationView__.SetView({
							tabName: "_CA tab",
							filter: filter,
							viewName: "_CAEmbedded",
							processOrTableName: "CM - Credit Application",
							checkProfileTab: false
						});
						Controls.CreditApplicationView__.Apply();
					});

					CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.CreditHistory).Then((filter) =>
					{
						Controls.CreditHistoryView__.SetView({
							tabName: "_Tables",
							filter: filter,
							viewName: "_view_O2C_Audit_Embedded",
							processOrTableName: "O2C - Audit__",
							checkProfileTab: false
						});
						Controls.CreditHistoryView__.Apply();
					});

					if (Lib.CM)
					{
						Lib.CM.ScoringProviders.Init(this.gaugeContainer);
						this.gaugeContainer.BindEvent("OnGaugeRefreshed", () =>
						{
							CMHelper.RefreshInternalCreditScore();
						});
					}
				}
			},
			onStart: function ()
			{
				if (!this._initialized && CustomerDetailsHelper.isMainContact)
				{
					function taxIdentifierCallback(taxIdentifierType)
					{
						return Controls[taxIdentifierType + "__"].GetValue();
					}
					this._company = {
						companyName: ProcessInstance.extendedProperties.company,
						countryCode: ProcessInstance.extendedProperties.country.toUpperCase(),
						thirdPartiesIds: Data.GetValue("ThirdPartiesIds__") ? JSON.parse(Data.GetValue("ThirdPartiesIds__")) : {},
						scoreId: CustomerDetailsHelper.company.creditScoreId,
						cityName: ProcessInstance.extendedProperties.city,
						siren: Data.GetValue("SIREN__"),
						state: Controls.Mail_State__.GetValue(),
						regNo: null,
						vatNo: null
					};
					this._company = Sys.Helpers.TryCallFunction("Lib.O2C.Customization.CIM.CompanyDataForScoring", this._company) || this._company;

					const that = this;

					function queryCallback()
					{
						Lib.CM.ScoringProviders.OnStart({
							company: that._company,
							companyCode: Data.GetValue("SupplierCompanyCode__"),
							StoreThirdPartiesId: that.StoreThirdPartiesId,
							EnabledCreditScore: that.EnabledCreditScore,
							fromForm: "Customer Extended Properties",
							AlertsHelper: AlertsHelper,
							gaugeContainer: Controls.CreditScore_GaugeContainer__,
							noCreditBureausLabel: Controls.CreditScore_NoCreditBureausConfigured__
						});
					}
					Lib.CM.ScoringProvidersCommon.AssignVatNoAndRegno(that._company, taxIdentifierCallback, queryCallback);
					this._initialized = true;
				}
			},
			StoreThirdPartiesId: function (businessId, thirdId)
			{
				NavMenuHelper.Menus.creditScore._company.thirdPartiesIds[thirdId] = businessId;
				var recordValues = { ThirdPartiesIds__: JSON.stringify(NavMenuHelper.Menus.creditScore._company.thirdPartiesIds) };
				if (thirdId !== "creditorwatchId")
				{
					recordValues.CreditScore_Enabled__ = 1;
				}
				if (CustomerDetailsHelper.saveScoreId)
				{
					recordValues.CreditScore_CompanyIdentifier__ = Data.GetValue("CreditScore_CompanyIdentifier__");
				}

				ProcessInstance.UpdateRecord(function (lastErrorMessage)
				{
					if (!lastErrorMessage)
					{
						Sys.Helpers.SilentChange(function ()
						{
							Data.SetValue("ThirdPartiesIds__", recordValues.ThirdPartiesIds__);
							if (thirdId !== "creditorwatchId")
							{
								Data.SetValue("CreditScore_Enabled__", true);
							}
						});
					}
				}, recordValues);
			},
			EnabledCreditScore: function ()
			{
				var creditScoreEnabled = Controls.CreditScore_Enabled__.GetValue();
				if (CustomerDetailsHelper.isMainContact && !creditScoreEnabled)
				{
					var recordValues = { CreditScore_Enabled__: 1 };
					if (CustomerDetailsHelper.saveScoreId)
					{
						recordValues.CreditScore_CompanyIdentifier__ = Data.GetValue("CreditScore_CompanyIdentifier__");
					}

					ProcessInstance.UpdateRecord(
						function (lastErrorMessage)
						{
							if (!lastErrorMessage)
							{
								Sys.Helpers.SilentChange(function ()
								{
									Data.SetValue("CreditScore_Enabled__", true);
								});
							}
						}, recordValues
					);
				}
			}
		},
		remittances: {
			panes: {
				RemittancesPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;

				CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.Remittances).Then((filter) =>
				{
					Controls.Remittances__.SetView({
						tabName: "_Tab_Remittance advices embedded",
						filter: filter,
						viewName: "_View_Remittance advices embedded all customers",
						checkProfileTab: false
					});
					Controls.Remittances__.Apply();
				});
			},
			onStart: function ()
			{
				// empty method
			}
		},
		insuranceInformation: {
			panes: {
				CreditLimit: true,
				InsurancePane: true,
				InsuranceTypePane: true,
				InsurerInformationPane: true,
				MainContactPane: true,
				LastInternalNotePane: true,
				TimelinePane: true
			},
			insuranceProducts: [],
			_showNoInsuranceItemsAndHideLoader: function (translationKey = "_No Item")
			{
				Controls.NoItemsToDisplay__.SetText(Language.Translate(translationKey));
				Controls.NoItemsToDisplay__.Hide(false);
				Controls.InsurerInformationLoader__.Hide(true);
			},
			_fetchInsuranceProducts: async function (insurerId)
			{
				if (!insurerId)
				{
					return [];
				}

				const demoProducts = Sys.Helpers.TryCallFunction("Lib.CM.DemoData.GetProducts");
				if (demoProducts && demoProducts.length)
				{
					return demoProducts;
				}

				try
				{
					const cofaceCommon = await InsurerHelper.GetCofaceCommonInstance();
					const products = await cofaceCommon.GetProducts(insurerId);
					if (!products || !products.length)
					{
						return [];
					}

					const detailedProducts = await Promise.all(products.map((product) =>
						cofaceCommon.GetDeliveryDetails(insurerId, product.deliveryId).catch(() => null)
					));

					return detailedProducts
						.filter((product) => !!product)
						.map((product) => Lib.CM.Insurance.MapCofaceProductToInsuranceProduct(product));
				}
				catch (error)
				{
					Log.Warn("Failed to retrieve insurance products for insurer id " + insurerId + ": " + (error && error.message ? error.message : error));
					return [];
				}
			},
			_displayInsuranceProducts: function (insuranceProducts)
			{
				if (insuranceProducts && insuranceProducts.length)
				{
					Lib.CM.InsuranceClient.buildProductsTable(insuranceProducts);
					this.insuranceProducts = insuranceProducts;
					return;
				}
				this._showNoInsuranceItemsAndHideLoader();
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();

				if (!Sys.AR.GetParameter("EnableCreditApplication"))
				{
					return;
				}

				Lib.CM.InsuranceClient.Init({
					controls: {
						productsTableControl: Controls.InsurerInformationTable__,
						noItemsControl: Controls.NoItemsToDisplay__,
						loaderControl: Controls.InsurerInformationLoader__
					}
				});

				Controls.InsuranceType__.AddStyle("text-align-center");
			},
			onStart: async function ()
			{
				if (this.insuranceProducts && this.insuranceProducts.length)
				{
					return;
				}
				await InsurerHelper.GetInsurerProvider().then(async (insurerProvider) =>
				{
					if (!insurerProvider)
					{
						Lib.CM.InsuranceClient.SetInsuranceProvider(null);
						Lib.CM.InsuranceClient.SetInsurerId(null);
						NavMenuHelper.Menus.insuranceInformation._showNoInsuranceItemsAndHideLoader();
						return;
					}

					const thirdPartiesIds = Data.GetValue("ThirdPartiesIds__") ? JSON.parse(Data.GetValue("ThirdPartiesIds__")) : {};

					const insurerName = insurerProvider.credentials && insurerProvider.credentials.provider ? insurerProvider.credentials.provider : null;

					Lib.CM.InsuranceClient.SetInsuranceProvider(insurerName);

					const insurerId = Lib.CM.InsuranceClient.GetInsurerIdFromProviders(insurerName, thirdPartiesIds);
					Lib.CM.InsuranceClient.SetInsurerId(insurerId);

					if (insurerName !== "coface" || !insurerId)
					{
						NavMenuHelper.Menus.insuranceInformation._showNoInsuranceItemsAndHideLoader("_NoInsurerIdWithThisCustomer");
						Controls.InsurerInformationPane.Hide(false);
						Controls.ObtainInsurerIdentifier__.Hide(false);
						Controls.ObtainInsurerIdentifier__.OnClick = this.onObtainInsurerIdentifierClick.bind(this);
						return;
					}

					const insuranceProducts = await this._fetchInsuranceProducts(insurerId);
					this._displayInsuranceProducts(insuranceProducts);
				}).catch(() =>
				{
					NavMenuHelper.Menus.insuranceInformation._showNoInsuranceItemsAndHideLoader();
				});
			},
			onObtainInsurerIdentifierClick: async function ()
			{
				Controls.ObtainInsurerIdentifier__.SetDisabled(true);
				Controls.NoItemsToDisplay__.Hide(true);
				Controls.InsurerInformationLoader__.Hide(false);

				return InsurerHelper.SearchCompany().then(async (result) =>
				{
					if (!result)
					{
						return Promise.reject();
					}

					const thirdPartiesIds = Data.GetValue("ThirdPartiesIds__") ? JSON.parse(Data.GetValue("ThirdPartiesIds__")) : {};
					thirdPartiesIds.cofaceId = result.id;
					const thirdPartiesIdsToSave = JSON.stringify(thirdPartiesIds);
					const recordValues = { ThirdPartiesIds__: thirdPartiesIdsToSave };

					return Sys.Helpers.Records.PromisedUpdateRecord(recordValues)
						.then(async () =>
						{
							ProcessInstance.SetSilentChange(true);
							try
							{
								Data.SetValue("ThirdPartiesIds__", thirdPartiesIdsToSave);
								await NavMenuHelper.Menus.insuranceInformation.onStart();
								Controls.ObtainInsurerIdentifier__.Hide(true);
							}
							finally
							{
								ProcessInstance.SetSilentChange(false);
							}
						})
						.catch(() =>
						{
							Log.Error("Error while saving cofaceId");
							Popup.Alert("_ErrorUpdatingInsurerId", true, null, "_ErrorUpdatingInsurerIdTitle");
							NavMenuHelper.Menus.insuranceInformation._showNoInsuranceItemsAndHideLoader("_NoInsurerIdWithThisCustomer");
						});

				}).catch(() =>
				{
					NavMenuHelper.Menus.insuranceInformation._showNoInsuranceItemsAndHideLoader("_NoInsurerIdWithThisCustomer");
				}).finally(() =>
				{
					Controls.ObtainInsurerIdentifier__.SetDisabled(false);
				});
			}
		},
		deductions: {
			_views: {
				alldeductions: "_View_All embedded",
				deductionsToVerify: "_View_To verify embedded",
				deductionsToApprove: "_View_To approve embedded",
				deductionsToPost: "_View_To post embedded",
				deductionsResolved: "_View_Resolved embedded"
			},
			panes: {
				DeductionsPane: true,
				DeductionsCountersPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				var that = this;

				this.panes.DeductionsCountersPane = Sys.AR.GetParameter("EnableDeductionsApplication");
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();

				Controls.DeductionsToValidate__.OnClick = function ()
				{
					that.displayView("deductionsToApprove");
				};
				Controls.DeductionsMenu__.BindEvent("onClick", function (evt)
				{
					that.changeDeductionsView(that._views[evt.args]);
				});
				Controls.DeductionsMenu__.BindEvent("onLoad", function ()
				{
					var tabs = {};
					for (var t in that._views)
					{
						tabs[t] = {};
						tabs[t].trad = Language.Translate(that._views[t]);
					}
					Controls.DeductionsMenu__.FireEvent("OnDeductionsLoad", { tabs: tabs });
				});
				this.changeDeductionsView(this._views.alldeductions);
			},
			changeDeductionsView: function (viewName)
			{
				CustomerDetailsHelper.GetCustomerFilter(null).Then((filter) =>
				{
					Controls.DeductionsList__.SetView({
						tabName: "_Tab_Deductions embedded",
						filter: filter,
						viewName: viewName,
						checkProfileTab: false,
						processOrTableName: "Deductions Processing"
					});
					Controls.DeductionsList__.Apply();
				});
			},
			displayView: function (viewName)
			{
				Controls.NavMenu__.SelectItem("deductions");
				NavMenuHelper.OnSelectItem("deductions");
				Controls.DeductionsMenu__.FireEvent("OnChangeDeductionsView", { viewName: viewName });
			}
		},
		orders: {
			_views: {
				ordersToValidate: {
					name: "_Customer orders waiting for validation",
					tab: "_Customer orders",
					processOrTableName: "Customer Order Processing",
					filterType: Lib.CM.CombinedCustomerHelper.FilterType.Orders
				},
				allImportedOrders: {
					name: "_All Imported Orders - embedded",
					tab: "_ImportedOrders - embedded",
					processOrTableName: "CM - Orders Import__",
					filterType: Lib.CM.CombinedCustomerHelper.FilterType.CreditManagement
				},
				blockedOrders: {
					name: "_Blocked Imported Orders - embedded",
					tab: "_ImportedOrders - embedded",
					processOrTableName: "CM - Orders Import__",
					filterType: Lib.CM.CombinedCustomerHelper.FilterType.CreditManagement
				},
				allRejectedOrders: {
					name: "_All Rejected Orders - embedded",
					tab: "_ImportedOrders - embedded",
					processOrTableName: "CM - Orders Import__",
					filterType: Lib.CM.CombinedCustomerHelper.FilterType.CreditManagement
				}
			},
			panes: {
				OrdersPane: true,
				OrdersCountersPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				var that = this;
				var counters = PackageHelper.getCounters();

				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.OrdersCountersPane = (ProcessInstance.extendedProperties.appInstances.COP || Sys.AR.GetParameter("EnableCreditApplication")) && counters.length > 0;
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
				Controls.OrdersMenu__.BindEvent("onClick", function (evt)
				{
					that.changeOrdersView(that._views[evt.args], that._views[evt.args].filterType);
				});
				Controls.OrdersMenu__.BindEvent("onLoad", function ()
				{
					var tabs = {};
					for (var t in that._views)
					{
						tabs[t] = {};
						tabs[t].trad = Language.Translate(that._views[t].name);

						if ((!Sys.AR.GetParameter("EnableCreditApplication") && (t === "allImportedOrders" || t === "blockedOrders" || t === "allRejectedOrders"))
							|| (!ProcessInstance.extendedProperties.appInstances.COP && t === "ordersToValidate"))
						{
							tabs[t].hidden = true;
						}
					}
					Controls.OrdersMenu__.FireEvent("onOrdersLoad", { tabs: tabs });
				});
				Controls.OrdersToValidate__.OnClick = function ()
				{
					that.displayView("ordersToValidate");
				};
				Controls.ImportedOrderCounter__.OnClick = function ()
				{
					that.displayView("allImportedOrders");
				};
				Controls.BlockedOrdersCounter__.OnClick = function ()
				{
					that.displayView("blockedOrders");
				};
				if (ProcessInstance.extendedProperties.appInstances.COP)
				{
					this.changeOrdersView(this._views.ordersToValidate, this._views.ordersToValidate.filterType);
				}
				else
				{
					this.changeOrdersView(this._views.allImportedOrders, this._views.allImportedOrders.filterType);
				}
			},
			displayView: function (viewName)
			{
				Controls.NavMenu__.SelectItem("orders");
				NavMenuHelper.OnSelectItem("orders");
				Controls.OrdersMenu__.FireEvent("onChangeOrderView", { viewName: viewName });
			},
			changeOrdersView: function (view, filterType)
			{
				CustomerDetailsHelper.GetCustomerFilter(filterType).Then((filter) =>
				{
					Controls.OrdersView__.SetView({
						tabName: view.tab,
						filter: filter,
						viewName: view.name,
						processOrTableName: view.processOrTableName,
						checkProfileTab: false
					});
					Controls.OrdersView__.Apply();
				});
			}
		},
		contacts: {
			panes: {
				CustomerListPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
				CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.Contacts).Then((filter) =>
				{
					Controls.CustomerList__.SetView({
						tabName: "_Customer list tab - embedded",
						viewName: "_Customer list - embedded",
						filter: filter,
						checkProfileTab: false
					});
					Controls.CustomerList__.Apply();
				});
			},
			onStart: function ()
			{
				// empty method
			}
		},
		activity: {
			panes: {
				ActivityPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
				EventHistoryPaneHelper.Init();
			},
			onStart: function ()
			{
				EventHistoryPaneHelper.OnStart();
			},
			changeActivityView: function (viewName)
			{
				EventHistoryPaneHelper.ChangeActivityView(viewName);
			}
		},
		settings: {
			panes: {
				GeneralPane: true,
				SecurityPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
				var settings = PackageHelper.getSettings();
				for (var i = 0; i < settings.length; i++)
				{
					var displayPane = true;
					var paneSettings = settings[i];
					for (var paneName in paneSettings)
					{
						var paneDisplayCondition = paneSettings[paneName];
						for (var globalSettingName in paneDisplayCondition)
						{
							var globalSettingCondition = paneDisplayCondition[globalSettingName];
							var globalSettingValue = Sys.AR.GetParameter(globalSettingName);
							displayPane = globalSettingValue === globalSettingCondition;
						}

						this.panes[paneName] = displayPane;
					}
				}

				Sys.OM.GlobalSettings.GetGlobalSettings(function (globalSettings)
				{
					if (globalSettings)
					{
						this.panes.OrderConfirmationsPane = globalSettings.DisplayERPOrderConfirmationsTab__ === "1";
						this.panes.ASN_pane__ = globalSettings.DisplayERPAdvancedShippingNoticeTab__ === "1";
					}
				}.bind(this));

				Controls.ResetPassword__.OnClick = ActionMenuHelper.ResetPassword;
				Controls.CreditScore_Enabled__.SetReadOnly(!CustomerDetailsHelper.isMainContact);
			},
			onStart: EDIHelper.OnDeliverySystemChange
		},
		relatedDoc: {
			_availableValues: [],
			panes: {
				RelatedDocumentsPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
				this.InitEmbeddedView();
				if (!ProcessInstance.extendedProperties.appInstances.AR)
				{
					Controls.UploadDocument__.Hide(true);
				}
			},
			onStart: function ()
			{
				var that = this;
				Controls.UploadDocument__.OnClick = function ()
				{
					Popup.Dialog("_UploadDocumentTitle", null, that.FillCallback, that.CommitCallback, that.ValidateCallback, null, null);
				};
				var filterDD = "(&(Enable_Configuration__=1)(Family__='Customer documents'))";
				var attributesDDToQuery = ["Document_Type__"];
				if (!this._availableValues.length)
				{
					Sys.GenericAPI.Query("DD - Application Settings__", filterDD, attributesDDToQuery, this.HandleDocumentsType, null, "NO_LIMIT", { useConstantQueryCache: true });
				}

				Controls.RelatedDocumentsView__.BindCustomAction("UnlinkDocuments", (ids) =>
				{
					this.HandleUnlinkDocuments(ids);
				});
			},
			InitEmbeddedView: function (additionalFilter)
			{
				CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.Docs).Then((filter) =>
				{
					let combinedFilter = filter;
					if (additionalFilter)
					{
						combinedFilter = Sys.Helpers.LdapUtil.FilterAnd(filter, additionalFilter).toString();
					}
					Controls.RelatedDocumentsView__.SetView({
						tabName: "_RecipientDocumentsEmbeddedTab",
						filter: combinedFilter,
						viewName: "_RelatedDocumentsEmbedded",
						processOrTableName: "DD - SenderForm",
						checkProfileTab: false
					});
					Controls.RelatedDocumentsView__.Apply();
				});
			},
			HandleUnlinkDocuments: function (ids)
			{
				const popupConfimLabel = (ids && ids.length > 1) ? "_UnlinkDocumentsConfirmSeveral" : "_UnlinkDocumentsConfirmOne";
				Popup.Confirm(Language.Translate(popupConfimLabel, false, ids ? ids.length : "0"),
					false,
					() => this.ConfirmUnlinkDocuments(ids),
					() => this.InitEmbeddedView(),
					"_Unlink Documents"
				);
			},
			ConfirmUnlinkDocuments: function (ids)
			{
				let filter = "";
				if (ids.length > 0)
				{
					for (const id of ids)
					{
						const idFilter = Sys.Helpers.LdapUtil.FilterNotEqual("RuidEx", id).toString();
						filter = filter ? Sys.Helpers.LdapUtil.FilterAnd(filter, idFilter).toString() : idFilter;
					}
					Process.CreateProcessInstance("DD - Unlink Documents", null, {
						ids: JSON.stringify(ids)
					});
				}
				this.InitEmbeddedView(filter);
			},
			HandleDocumentsType: function (records)
			{
				for (var j = 0; j < records.length; j++)
				{
					if (records[j].Document_Type__)
					{
						NavMenuHelper.Menus.relatedDoc._availableValues.push(records[j].Document_Type__ + "=" + records[j].Document_Type__);
					}
				}
			},
			FillCallback: function (dialog)
			{
				var ctrlFileUploader = dialog.AddFileUploader("ctrlFiles", "_Document");
				ctrlFileUploader.SetAllowUploadingOnlyOneFile(true);
				var ctrlType = dialog.AddComboBox("ctrlType", "_DocumentType");
				ctrlType.SetAvailableValues(NavMenuHelper.Menus.relatedDoc._availableValues);
				var ctrlError = dialog.AddDescription("ctrlError", "");
				ctrlError.SetText("_DocumentMandatory");
				ctrlError.AddStyle("text-highlight-warning");
				dialog.MaskControl(ctrlError, true);
				dialog.RequireControl("ctrlType", true);
			},
			CommitCallback: function (dialog)
			{
				var ctrlFiles = dialog.GetControl("ctrlFiles");
				var files = ctrlFiles.GetUploadedFiles();
				var documentType = dialog.GetControl("ctrlType").GetValue();
				Process.CreateProcessInstance(
					"DD - SenderForm",
					{
						Recipient_ID__: ProcessInstance.extendedProperties.businessPartnerID
					},
					{
						ForceDelivery__: "NONE",
						ManuallySubmitted__: "1",
						Configuration: documentType,
						SDADocumentFamily: "Customer documents"
					},
					{
						files: files,
						callback: function (data)
						{
							Controls.RelatedDocumentsView__.Apply(data.ruid);
							Popup.Snackbar({
								message: Language.Translate("_Document uploaded"),
								status: "success"
							});
						}
					}
				);

			},
			ValidateCallback: function (dialog)
			{
				var ctrlFiles = dialog.GetControl("ctrlFiles");
				var ctrlError = dialog.GetControl("ctrlError");
				var files = ctrlFiles.GetUploadedFiles();
				dialog.MaskControl(ctrlError, files.length === 1);
				return files.length === 1;
			}
		},
		moreDetails: {
			panes: {
				GeneralInformationPane: true,
				MailAddressPane: true,
				RegionalSettingsPane: true,
				CustomerAdvancedFieldsPane: true,
				WelcomeSettingsPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				this.panes.LastInternalNotePane = ProcessInstance.extendedProperties.appInstances.AR;
			},
			_customerDetailsAlreadyFill: false,
			onStart: function ()
			{
				if (!NavMenuHelper.Menus.moreDetails._customerDetailsAlreadyFill)
				{
					if (CustomerDetailsHelper.isMainContact)
					{
						Sys.GenericAPI.Query(
							"CreditScore - Identifier__",
							"(|(Country__=" + ProcessInstance.extendedProperties.country.toUpperCase() + ")(Country__=''))",
							["IdentifierType__"],
							function (records)
							{
								NavMenuHelper.Menus.moreDetails.HandleCreditScore(records);
							},
							null,
							"NO_LIMIT",
							{ useConstantQueryCache: true }
						);
					}

					NavMenuHelper.Menus.moreDetails._customerDetailsAlreadyFill = true;
				}
				Controls.CustomerIdentifiers.Hide(!CustomerDetailsHelper.isMainContact);
			},
			HandleCreditScore: function (records)
			{
				Sys.Helpers.SilentChange(function ()
				{
					var taxIdAdd = false;

					for (var j = 0; j < records.length; j++)
					{
						if (records[j].IdentifierType__ === "FederalTaxId" || records[j].IdentifierType__ === "TvaIntra")
						{
							taxIdAdd = true;
						}

						if (Controls[records[j].IdentifierType__ + "__"])
						{
							Controls[records[j].IdentifierType__ + "__"].Hide(false);
							Controls[records[j].IdentifierType__ + "__"].OnChange = CMHelper.onChange;
						}
					}

					if (!taxIdAdd)
					{
						Controls.TaxID__.Hide(false);
						Controls.TaxID__.OnChange = CMHelper.onChange;
					}
				});
			}
		},
		internalNotes: {
			_availableValues: [],
			panes: {
				InternalNotesPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();
				CustomerDetailsHelper.GetCustomerFilter(Lib.CM.CombinedCustomerHelper.FilterType.InternalNotes).Then((filter) =>
				{
					Controls.InternalNotesView__.SetView({
						tabName: "_InternalNotesEmbeddedTab",
						filter: filter,
						viewName: "_InternalNotesEmbedded",
						processOrTableName: InternalNoteHelper.TableName,
						checkProfileTab: false
					});
					Controls.InternalNotesView__.Apply();
				});

				Controls.LastInternalNote__.BindEvent("openInternalNotesTab", function ()
				{
					Controls.NavMenu__.SelectItem("internalNotes");
					NavMenuHelper.OnSelectItem("internalNotes");
				});
			},
			onStart: function ()
			{
				// empty method
			}
		},
		financialInformation: {
			panes: {
				SynergyAnalysisPane: false,
				FinancialInformationPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true,
				ParentsPane: ParentsPaneHelper.DisplayParentsPane
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();

				if (!Sys.AR.GetParameter("EnableFinancialStatement"))
				{
					return;
				}

				Controls.FinancialAnalysisLoader__.SetHTML(Sys.AR.Client.GetFieldsLoaderHtmlContent());

				LoaderHelper.ShowLoader("financialInformation");

				if (Controls.NavMenu__.IsSelected("financialInformation"))
				{
					Controls.SynergyAnalysisPane.Hide(false);
				}
			},
			onStart: async function ()
			{
				if (this.started)
				{
					Controls.SynergyAnalysisPane.Hide(!this.showSynergyAnalysisPane);
					return;
				}

				Lib.CM.FinancialStatement.BindUploadFinancialsControl({
					"CompanyName": ProcessInstance.extendedProperties.company,
					"CustomerLogin": ProcessInstance.extendedProperties.login,
					"Currency": Data.GetValue("Currency__")
				});

				const customerId = Controls.CustomerID__.GetValue();
				const financialRecordsByYear = await Lib.CM.FinancialStatement.FillFinancialTable(customerId);

				LoaderHelper.HideLoader("financialInformation");
				this.showSynergyAnalysisPane = financialRecordsByYear && financialRecordsByYear.length;
				Controls.SynergyAnalysisPane.Hide(!this.showSynergyAnalysisPane);

				if (this.showSynergyAnalysisPane)
				{
					Controls.UploadFinancialsButton__.Hide(true);
					Controls.Spacer__.Hide(true);
					Lib.CM.FinancialStatement.BindMultiplierControl();
					Lib.CM.FinancialStatement.BindRoundingControl();
					Lib.CM.FinancialStatement.LoadSummaryButton(customerId, financialRecordsByYear, User.culture);
					Lib.CM.FinancialStatement.InitializeEditButtons(financialRecordsByYear, () =>
					{
						CMHelper.RefreshInternalCreditScore();
					});
				}

				this.started = true;
			}
		},
		messages: {
			panes: {
				MessagesPane: true,
				TimelinePane: true,
				MainContactPane: true,
				HistoryPane: true,
				LastInternalNotePane: true
			},
			init: function ()
			{
				this.panes.TimelinePane = NavMenuHelper.IsTimelinePaneVisible();

				if (!Sys.AR.GetParameter("EnableConversationGlobal"))
				{
					return;
				}

			},
			onStart: function ()
			{
				MessagesHelper.Init();
			}
		}
	},
	IsTimelinePaneVisible: function ()
	{
		return TermSyncHelper._termSyncEnabled || CollectionHelper.IsEnabled();
	},
	Init: async function ()
	{
		Sys.Helpers.TryCallFunction("Lib.O2C.Customization.CIM.AddOrUpdateNavMenus", this.Menus);
		var menuInitializationPromises = [];
		for (var m in this.Menus)
		{
			if (this.Menus[m].init)
			{
				menuInitializationPromises.push(this.Menus[m].init());
			}
		}
		await Promise.all(menuInitializationPromises);

		if (ProcessInstance.extendedProperties.appInstances.AR && Sys.AR.GetParameter("EnableCreditApplication") && Data.GetValue("ShowAlerts__"))
		{
			this._defaultMiddlePanes.AlertPane = true;
		}

		this.OnSelectItem(PackageHelper.getStartMenu());
		this.DisplayNavMenu();
		Controls.NavMenu__.OnSelectItem = this.OnSelectItem;
		Process.SetHelpId(1851);
	},
	DisplayNavMenu: function ()
	{
		if (!Sys.Helpers.String.ToBoolean(Sys.AR.GetParameter("EnableRemittanceAdvices")))
		{
			Controls.NavMenu__.HideItem("remittances");
		}
		const ar = ProcessInstance.extendedProperties.appInstances.AR;
		const cashapp = Sys.AR.GetParameter("EnableCashApplication");
		const creditApp = Sys.AR.GetParameter("EnableCreditApplication");
		const paymentEnabled = Sys.AR.GetParameter("EnablePaymentFeature");
		const financialInformation = Sys.AR.GetParameter("EnableFinancialStatement");
		const showInsuranceInfo = Sys.AR.GetParameter("ShowInsuranceInfo");
		const enableEODCollectionManagement = Sys.AR.GetParameter("EnableEODCollectionManagement__");

		const cop = ProcessInstance.extendedProperties.appInstances.COP;
		if (!(cashapp || (ar && paymentEnabled)))
		{
			Controls.NavMenu__.HideItem("payments");
		}
		if (!(creditApp && ar && CustomerDetailsHelper.isMainContact))
		{
			Controls.NavMenu__.HideItem("creditScore");
			Controls.NavMenu__.HideItem("insuranceInformation");
		}

		if (!creditApp || (creditApp && !showInsuranceInfo))
		{
			Controls.NavMenu__.HideItem("insuranceInformation");
		}

		if (!(cop || creditApp))
		{
			Controls.NavMenu__.HideItem("orders");
		}
		if (!Sys.AR.GetParameter("EnableDeductionsApplication"))
		{
			Controls.NavMenu__.HideItem("deductions");
		}
		if (!enableEODCollectionManagement)
		{
			Controls.NavMenu__.HideItem("collection");
		}
		if (!creditApp || (creditApp && !financialInformation))
		{
			Controls.NavMenu__.HideItem("financialInformation");
		}
		if (!ar)
		{
			Controls.NavMenu__.HideItem("internalNotes");
			Controls.NavMenu__.HideItem("contacts");
			Controls.NavMenu__.HideItem("invoices");
		}
		if (!Sys.AR.GetParameter("EnableConversationGlobal"))
		{
			Controls.NavMenu__.HideItem("messages");
		}
		if (!ProcessInstance.extendedProperties.appInstances.DD)
		{
			Controls.NavMenu__.HideItem("relatedDoc");
		}
		Sys.Helpers.TryCallFunction("Lib.O2C.Customization.CIM.DisplayNavMenu");
	},
	OnSelectItem: function (elementID)
	{
		var panes = Controls.form_content_middle.GetPanes() || [];
		panes = panes.concat(Controls.form_content_right.GetPanes());
		var menu = NavMenuHelper.Menus[elementID];
		var panesToShow = {};
		for (var pane in NavMenuHelper._defaultMiddlePanes)
		{
			panesToShow[pane] = NavMenuHelper._defaultMiddlePanes[pane];
		}
		for (var paneMenu in menu.panes)
		{
			panesToShow[paneMenu] = menu.panes[paneMenu];
		}
		for (var i = 0; i < panes.length; i++)
		{
			panes[i].Hide(!panesToShow[panes[i].GetName()]);
		}

		if (menu.onStart)
		{
			menu.onStart();
		}

		AlertsHelper.HandleDetailsBtnVisibility({ alertId: "CreditAgenciesUpdatesAlertTitle", hidden: elementID === "creditScore" });
	}
};

var ActionMenuHelper = {
	Init: function ()
	{
		Controls.ActionMenu__.BindEvent("onActionLoad", function ()
		{
			Controls.ActionMenu__.FireEvent("onActionLoad", {
				appInstances: ProcessInstance.extendedProperties.appInstances,
				tabs: {
					MoreDetails: Language.Translate("_More_Details"),
					Edit: Language.Translate("_Edit"),
					ResendWelcomeEmail: Language.Translate("_ResendWelcomeEmail"),
					ResetPassword: Language.Translate("_ResetPassword")
				},
				isMainContact: CustomerDetailsHelper.isMainContact
			});
		});

		Controls.ActionMenu__.BindEvent("MoreDetails", this.MoreDetailsAction);
		Controls.ActionMenu__.BindEvent("EditAction", this.Edit);
		Controls.ActionMenu__.BindEvent("WelcomeEmailAction", this.ResendWelcomeEmail);
		Controls.ActionMenu__.BindEvent("ResetPasswordAction", this.ResetPassword);
	},
	Edit: function ()
	{
		var editCustomerUrl = Sys.AR.Customer.GetModifyCustomerUrl(ProcessInstance.extendedProperties.msn) + "&extendedPropsId=" + encodeURIComponent(ProcessInstance.id);
		Process.OpenLink({ url: editCustomerUrl, inCurrentTab: true, onQuit: "back" });
	},
	ResendWelcomeEmail: function ()
	{
		Popup.Confirm("_Resend welcome email confirmation", false, ActionMenuHelper.SendWelcomeEmail, null, "_Resend welcome email title");
	},
	ResetPassword: function ()
	{
		Popup.Confirm("_Reset password confirmation", false, ActionMenuHelper.SendResetPasswordEmail, null, "_Reset password title");
	},
	SendWelcomeEmail: function ()
	{
		Sys.AR.Customer.ResendWelcomeEmail(ProcessInstance.extendedProperties.msn);
	},
	SendResetPasswordEmail: function ()
	{
		Sys.AR.Customer.ResetPassword(ProcessInstance.extendedProperties.msn);
	},
	MoreDetailsAction: function ()
	{
		NavMenuHelper.OnSelectItem("moreDetails");
	}
};

var AlertsHelper = {
	_pollingAlerts: {},
	_enabled: false,
	_handler: null,
	GetHandler: function ()
	{
		if (!AlertsHelper._handler)
		{
			AlertsHelper._handler = new Lib.AR.AlertHelper.AlertHandler({
				pane: Controls.AlertPane,
				container: Controls.AlertsContainer__,
				onAlertsChange: function (nbAlerts)
				{
					NavMenuHelper._defaultMiddlePanes.AlertPane = nbAlerts;
				}
			});
		}

		return AlertsHelper._handler;
	},
	Init: async function ()
	{
		AlertsHelper._enabled = Sys.AR.GetParameter("EnableCreditApplication");

		if (!AlertsHelper._enabled)
		{
			return;
		}
		const handler = AlertsHelper.GetHandler();
		if (Data.GetValue("ShowAlerts__"))
		{
			handler.AddAlert({
				id: "CreditAgenciesUpdatesAlertTitle",
				message: Language.Translate("_CreditAgenciesUpdatesAlertTitle"),
				detailsBtn: {
					title: Language.Translate("_CheckUpdates"),
					onClick: function ()
					{
						Controls.NavMenu__.SelectItem("creditScore");
						NavMenuHelper.OnSelectItem("creditScore");
						handler.HideDetailsBtn("CreditAgenciesUpdatesAlertTitle");
					}
				}
			});

			Lib.CM.ScoringProviders.CheckForAtradiusAlert({
				companyScoreId: CustomerDetailsHelper.company.creditScoreId,
				fromForm: "Customer Extended Properties",
				AlertsHelper: AlertsHelper
			});
		}

		if (Data.GetValue("PollingAlert__"))
		{
			this._pollingAlerts = JSON.parse(Data.GetValue("PollingAlertAgencies__") || "{}");

			for (const [agency, alert] of Object.entries(this._pollingAlerts))
			{
				var alertObject = {
					id: `alert_${agency}`,
					message: Language.Translate("_" + alert)
				};
				switch (agency)
				{
					case "atradius":
						alertObject.detailsBtn = {
							title: Language.Translate("_RemoveAlert"),
							onClick: () =>
							{
								delete this._pollingAlerts[agency];
								Data.SetValue("PollingAlertAgencies__", JSON.stringify(this._pollingAlerts));
								handler.RemoveAlert(agency);
							}
						};
						break;
					case "creditsafe":
						alertObject.detailsBtn = {
							title: Language.Translate("_GoToCreditSafe"),
							onClick: function ()
							{
								Controls.NavMenu__.SelectItem("creditScore");
								NavMenuHelper.OnSelectItem("creditScore");
								setTimeout(function ()
								{
									Controls.CreditScore_GaugeContainer__.FireEvent("delayLoadBtn_creditsafe_delayed", "creditsafe_delayed");
								}, 100);
							}
						};
						break;
					default:
						throw `not supported alert for agency: ${agency}`;
				}
				handler.AddAlert(alertObject);
			}
		}

		const customerNumbers = await CustomerDetailsHelper.GetCustomerNumbers();
		try
		{
			const creditLimitValue = Data.GetValue("CreditLimit__");
			const validCreditLimit = creditLimitValue !== null && creditLimitValue !== "" && creditLimitValue !== "undefined";
			if (validCreditLimit)
			{
				const creditData = await Lib.CM.CustomerHelper.CheckCreditLimitUtilization({
					customerNumbers: customerNumbers,
					companyCode: Data.GetValue("SupplierCompanyCode__"),
					creditLimit: Data.GetValue("CreditLimit__")
				});
				AlertsHelper.SetCreditCounters(creditData);
			}
		}
		catch (err)
		{
			Log.Error(`Error while checking credit limit utilization${typeof err === "string" ? ` : ${err}.` : "."}`);
			Controls.CreditLimitCounter__.SetError("_Error");
		}
	},
	HandleDetailsBtnVisibility: function (args)
	{
		if (AlertsHelper._enabled)
		{
			AlertsHelper.GetHandler().HideDetailsBtn(args.alertId, args.hidden);
		}
	},
	SetCreditCounters: function (data)
	{
		if (data.creditLimit === null)
		{
			return;
		}
		const hasExposure = !data.exposureInError;
		const creditLimitValue = Data.GetValue("CreditLimit__");
		const displayValue = creditLimitValue !== null && creditLimitValue !== "" && creditLimitValue !== "undefined"
			? Lib.CM.CustomerHelper.CurrencyFormat(creditLimitValue) : "N/A";
		const percentUsed = hasExposure && data.creditLimit > 0 ? Math.round(data.exposure / data.creditLimit * 100) :
			data.creditLimit === 0 ? 101 : void 0;
		Controls.CreditLimitCounter__.SetValue({
			value: displayValue,
			...hasExposure ? { subText: Language.Translate("_{0}PercentUsed", false, percentUsed) } : {}
		});
		if (hasExposure)
		{
			Controls.CreditLimit.SetProgressBar({
				value: data.exposure,
				max: data.creditLimit,
				labels: {
					left: Lib.CM.CustomerHelper.CurrencyFormat(data.exposure),
					right: Lib.CM.CustomerHelper.CurrencyFormat(data.creditLimit - data.exposure)
				}
			});
			AlertsHelper.HandleCreditRiskAlertsRules(data, percentUsed, creditLimitValue);
		}
	},
	ExposureProgressBarAboveCreditLimit: function (data, creditLimitValue)
	{
		var percentOver = data.creditLimit > 0 ? Math.round((data.exposure - data.creditLimit) / data.creditLimit * 100) : 100;
		const displayValue = creditLimitValue !== null && creditLimitValue !== "" && creditLimitValue !== "undefined"
			? Lib.CM.CustomerHelper.CurrencyFormat(creditLimitValue) : "N/A";
		Controls.CreditLimitCounter__.SetValue({
			value: displayValue,
			subText: Language.Translate("_{0}PercentOverCreditLimit", false, percentOver)
		});
		Controls.CreditLimitCounter__.SetColor({ color: "#D8262E" });
		Controls.CreditLimit.SetProgressBar({
			value: data.exposure,
			max: data.creditLimit,
			color: "#D8262E",
			label: Language.Translate("_{0}OverCreditLimit", false, Lib.CM.CustomerHelper.CurrencyFormat(data.exposure - data.creditLimit))
		});
	},
	AddAlert: function (overcreditLimit)
	{
		const handler = AlertsHelper.GetHandler();
		const formattedOvercreditLimit = Lib.CM.CustomerHelper.CurrencyFormat(overcreditLimit);
		const message = overcreditLimit <= 0 ? Language.Translate("_CreditLimitAlert", false) : Language.Translate("_CreditLimitAlertTitle", false, formattedOvercreditLimit);
		handler.AddAlert({
			id: "CheckCreditLimitUtilization",
			message: message
		});
	},
	UpdateOutstandingAlert: function (data)
	{
		if (data.exposure !== Data.GetValue("Exposure__") || data.exposure - data.creditLimit !== Data.GetValue("OverCreditLimit__"))
		{
			const creditUsage = data.creditLimit === 0 ? 100 : (data.exposure / data.creditLimit * 100).toFixed(2);
			ProcessInstance.UpdateRecord(
				function (lastErrorMessage)
				{
					if (!lastErrorMessage)
					{
						Sys.Helpers.SilentChange(function ()
						{
							Data.SetValue("OverCreditLimit__", data.exposure - data.creditLimit);
							Data.SetValue("Outstanding__", data.outstanding);
							Data.SetValue("Exposure__", data.exposure);
							Data.SetValue("CreditUsage__", creditUsage);
						});
					}
				},
				{
					OverCreditLimit__: data.exposure - data.creditLimit,
					Outstanding__: data.outstanding,
					CreditUsage__: creditUsage,
					Exposure__: data.exposure
				}
			);
		}
	},
	HandleCreditRiskAlertsRules: function (data, percentUsed, creditLimitValue)
	{
		if (data.exposure > data.creditLimit)
		{
			AlertsHelper.ExposureProgressBarAboveCreditLimit(data, creditLimitValue);
		}
		Lib.CM.SuggestedCreditValues.Process({
			object: Lib.CM.SuggestedCreditValues.Objects.CreditRiskAlerts,
			hideControl: true,
			processData: {
				creditUsage: percentUsed,
				userInformation: {
					GetValue: function (key)
					{
						return Data.GetValue(key);
					}
				}
			},
			onAssignmentProcessed: function (_assignment, _value, option)
			{
				if (option === "1")
				{
					AlertsHelper.UpdateOutstandingAlert(data);
					AlertsHelper.AddAlert(data.exposure - data.creditLimit);
				}

				Data.GetValue("OutstandingAlert__") !== Sys.Helpers.String.ToBoolean(option) && ProcessInstance.UpdateRecord(
					function (lastErrorMessage)
					{
						if (!lastErrorMessage)
						{
							Sys.Helpers.SilentChange(function ()
							{
								Data.SetValue("OutstandingAlert__", option);
							});
						}
					},
					{
						OutstandingAlert__: option
					}
				);
			}
		});
	}
};

var CopyHelper = {
	Init: function ()
	{
		this.LinkText("SIRET__", "FrenchB2B_SIRET__");
		this.LinkText("SIREN__", "FrenchB2B_SIREN__");
	},
	LinkText: function (src, dest)
	{
		Controls[src].OnBlur = function ()
		{
			Controls[dest].SetText(Controls[src].GetText());
		};
		Controls[dest].OnBlur = function ()
		{
			Controls[src].SetText(Controls[dest].GetText());
		};
		Controls[dest].SetText(Controls[src].GetText());
	}
};

var currencyCodes = ["ALL", "DZD", "ARS", "AUD", "BSD", "BHD", "BDT", "AMD", "BBD", "BMD", "BTN", "BOB", "BWP", "BZD", "SBD", "BND", "MMK", "BIF", "KHR", "CAD", "CVE", "KYD", "LKR", "CLP", "CNY", "COP", "KMF", "CRC", "HRK", "CUP", "CZK", "DKK", "DOP", "SVC", "ETB", "ERN", "FKP", "FJD", "DJF", "GMD", "GIP", "GTQ", "GNF", "GYD", "HTG", "HNL", "HKD", "HUF", "ISK", "INR", "IDR", "IRR", "IQD", "ILS", "JMD", "JPY", "KZT", "JOD", "KES", "KPW", "KRW", "KWD", "KGS", "LAK", "LBP", "LSL", "LRD", "LYD", "MOP", "MWK", "MYR", "MVR", "MRO", "MUR", "MXN", "MNT", "MDL", "MAD", "OMR", "NAD", "NPR", "ANG", "AWG", "VUV", "NZD", "NIO", "NGN", "NOK", "PKR", "PAB", "PGK", "PYG", "PEN", "PHP", "QAR", "RUB", "RWF", "SHP", "STD", "SAR", "SCR", "SLL", "SGD", "VND", "SOS", "ZAR", "SSP", "SZL", "SEK", "CHF", "SYP", "THB", "TOP", "TTD", "AED", "TND", "UGX", "MKD", "EGP", "GBP", "TZS", "USD", "UYU", "UZS", "WST", "YER", "TWD", "CUC", "ZWL", "BYN", "TMT", "GHS", "VEF", "SDG", "UYI", "RSD", "MZN", "AZN", "RON", "CHE", "CHW", "TRY", "XAF", "XCD", "XOF", "XPF", "XBA", "XBB", "XBC", "XBD", "XAU", "XDR", "XAG", "XPT", "XTS", "XPD", "XUA", "ZMW", "SRD", "MGA", "COU", "AFN", "TJS", "AOA", "BGN", "CDF", "BAM", "EUR", "MXV", "UAH", "GEL", "BOV", "PLN", "BRL", "CLF", "XSU", "USN", "XXX"];

var GeneralPaneHelper = {
	InitManageAutopay: function (isPaymentEnabled)
	{
		Controls.Payment_Manage_Autopay__.Hide(!isPaymentEnabled);
		Controls.Payment_Manage_Autopay__.Hide(!CustomerDetailsHelper.isMainContact);
		Controls.Payment_Manage_Autopay__.OnClick = function ()
		{
			Controls.Payment_Manage_Autopay__.SetDisabled(true);
			Controls.Payment_Manage_Autopay__.Wait(true);
			var options = {
				callback: function (data)
				{
					Process.OpenMessage(data.ruid, true);
				},
				waitForProcessing: true
			};
			var externalVars = {
				NeedValidation: "1",
				CustomerLogin: Controls.CustomerID__.GetValue(),
				PayOnBehalf: "1"
			};
			Process.CreateProcessInstance("AR System Invoices AutoPay", null, externalVars, options);
		};
	},
	Init: function ()
	{
		var isPaymentEnabled = Sys.AR.GetParameter("EnablePaymentFeature");
		Controls.Customer_Currency__.Hide(!isPaymentEnabled);
		Controls.Customer_Currency__.OnChange = function ()
		{
			var currencyCode = Controls.Customer_Currency__.GetValue();
			if (currencyCode)
			{
				var allowed = false;
				for (var i = 0; i < currencyCodes.length; i++)
				{
					if (currencyCode === currencyCodes[i])
					{
						allowed = true;
					}
				}
				if (!allowed)
				{
					Controls.Save.SetDisabled(true);
					Controls.Customer_Currency__.SetError("_Not a valid ISO4217 currency");
				}
				else
				{
					Controls.Save.SetDisabled(false);
					Controls.Customer_Currency__.SetError();
				}
			}
			else
			{
				Controls.Save.SetDisabled(false);
				Controls.Customer_Currency__.SetError();
			}

		};

		Controls.Payment_Profile__.Hide(!isPaymentEnabled);
		Controls.Payment_Profile__.Hide(!CustomerDetailsHelper.isMainContact);
		Controls.Customer_Currency__.Hide(!CustomerDetailsHelper.isMainContact);
		this.InitManageAutopay(isPaymentEnabled);
	}
};

var GeneralInformationPaneHelper = {
	Init: function ()
	{
		Controls.Company__.SetText(ProcessInstance.extendedProperties.company);

		if (CustomerDetailsHelper.isMainContact)
		{
			Controls.Company__.SetURL("");
		}
		else
			if (Sys.Helpers.TryGetFunction("Lib.O2C.Customization.User.GetCustomerWhenLoginIsCustomized"))
			{
				Sys.Helpers.TryCallFunction("Lib.O2C.Customization.User.GetCustomerWhenLoginIsCustomized", this.SetLinkToCompany);
			}
			else
			{
				this.SetLinkToCompany(CustomerDetailsHelper.mainContactLogin);
			}
	},

	SetLinkToCompany: function (login)
	{
		Sys.GenericAPI.Query(
			"ODUSER",
			Sys.Helpers.LdapUtil.FilterEqual("LOGIN", login),
			["MSN"],
			function (records)
			{
				if (records.length > 0)
				{
					var companyUrl = Sys.AR.Customer.GetCustomerUrl(records[0].MSN, true);
					Controls.Company__.SetURL(companyUrl);
				}
			},
			null,
			"NO_LIMIT",
			{ useConstantQueryCache: true }
		);
	}
};

let InsurerHelper = {
	_insurerProvider: null,
	_CofaceCommonInstance: null,
	GetInsurerProvider: async function ()
	{
		if (!this._insurerProvider)
		{
			this._insurerProvider = await Lib.CM.Insurance.GetInsurerProvider(Data.GetValue("SupplierCompanyCode__"));
		}
		return this._insurerProvider;
	},
	GetCofaceCommonInstance: async function ()
	{
		if (!this._CofaceCommonInstance)
		{
			const credentialProvider = await Lib.CM.Partners.CredentialProvider.LoadByProviderNameAndCompanyCode("coface", Data.GetValue("SupplierCompanyCode__"));
			this._CofaceCommonInstance = new Sys.CM.CofaceCommon(credentialProvider);
		}
		return this._CofaceCommonInstance;
	},
	SearchCompany: async function ()
	{
		return Promise.all([CustomerDetailsHelper._userInformationFilled, InsurerHelper.GetInsurerProvider()]).then(([, creditProviderInstance]) =>
		{
			return creditProviderInstance.SearchCompany(
				{
					companyName: ProcessInstance.extendedProperties.company,
					longCountryCode: Sys.Locale.Country.GetLongCountryCode(Controls.Country__.GetValue()),
					street: Controls.Street__.GetValue(),
					city: Controls.City__.GetValue(),
					postalCode: Controls.Zip_Code__.GetValue(),
					searchIdentifiers: [Data.GetValue("SIREN__"), Data.GetValue("SIRET__"), Data.GetValue("TvaIntra__"), Data.GetValue("DUNS__")].filter((identifier) => !!identifier)
				}).then((result) =>
				{
					if (!result || result.noSelection || result.error)
					{
						throw null;
					}
					return result;
				});
		}).catch(() =>
		{
			Popup.Alert("_ErrorInsurerCompanyMatching", true, null, "_ErrorInsurerCompanyMatchingTitle");
			return null;
		});
	}
};

let DigitalAssistantHelper = {
	Init: function ()
	{
		Process.SetDigitalAssistant(true);
		DigitalAssistant.SetPreloadedSkill("cm-credit-summary");
		DigitalAssistant.SetInitialContext(
			"The user is viewing the Customer Details page for " + ProcessInstance.extendedProperties.company + ". " +
			"This page contains comprehensive information about this customer including invoices, payments, credit score, collection activities, orders, contacts, and financial data. " +
			"When answering questions, focus on information relevant to this specific customer and their account management. " +
			"Provide actionable insights related to accounts receivable, credit management, and customer relationship management."
		);
		this.InitSuggestions(ProcessInstance.extendedProperties.company);
	},
	InitSuggestions: function ()
	{
		DigitalAssistant.SetSuggestions([
			{
				name: "ExecutiveCreditSummary",
				label: Language.Translate("_ExecutiveCreditSummaryLabel"),
				description: "Create a comprehensive Executive Credit Summary for a customer with key financial metrics, risk assessment, credit utilization, and relevant business insights to support credit decision-making",
				action: {
					prompt: "Create the Executive Credit Summary for the current customer the user is viewing.",
					label: Language.Translate("_ExecutiveCreditSummaryActionLabel")
				},
				initial: true
			}
		]);
	}
};

const CustomerInquiriesHelper = {
	IsActivated: async function ()
	{
		try
		{
			const processDefinition = await Process.GetProcessDefinition("CI - Application Settings__");
			return Boolean(processDefinition && processDefinition.result);
		}
		catch (error)
		{
			Log.Error("Unable to determine whether Customer Inquiries is activated: " + error);
			return false;
		}
	}
};

const SynergyAnalysisHelper = {
	_initializationStarted: false,
	IsPaneVisible: async function ()
	{
		if (!ProcessInstance.extendedProperties.appInstances.AR
			|| User.profileRole === "accountManagement"
			|| User.profileRole === "fullAdmin"
			|| User.profileRole === "powerUser"
			|| !this.HasAllowedRole()
			|| !DigitalAssistant.IsAuthorized())
		{
			return false;
		}
		return CustomerInquiriesHelper.IsActivated();
	},
	Init: function ()
	{
		if (this._initializationStarted)
		{
			return;
		}
		this._initializationStarted = true;
		this.RecordUsageMetric();
		Controls.SynergyAnalysis__.SetPreloadedSkill("ar-customer-health");
		Controls.SynergyAnalysis__.SetSuggestions(this.GetSuggestions());
		try
		{
			Controls.SynergyAnalysis__.SetInitialContext(this.GetInitialContext());
			Controls.SynergyAnalysis__.SetPrompt("Give me a role-aware overview of this customer's health.");
			Controls.SynergyAnalysis__.Send();
		}
		catch (error)
		{
			Log.Error("Unable to initialize Synergy Insights pane: " + error);
		}
	},
	RecordUsageMetric: function ()
	{
		try
		{
			const metricsRequest = {
				Feature: "SynergyInsightsCustomerPage",
				ProcessId: ProcessInstance.id,
				Tag1: this.GetUserRole(),
				Tag2: "",
				method: "POST",
				WorkspaceName: ""
			};
			Query.HTTPQuery({
				method: "POST",
				targetURL: "Handlers/SynergyMetricsHandler.ashx",
				type: "internalHttpQuery",
				headers: { "Content-Type": "application/json" },
				data: JSON.stringify(metricsRequest),
				callback: function (response)
				{
					if (response && (response.status < 200 || response.status >= 300))
					{
						Log.Warn("Unable to record Synergy Insights usage metric (status: " + response.status + ")");
					}
				}
			});
		}
		catch (error)
		{
			Log.Error("Unable to record Synergy Insights usage metric: " + error);
		}
	},
	HasAllowedRole: function ()
	{
		return User.IsBusinessRoleEnabled("CustomerServiceRepresentative")
			|| this.HasSalesRole()
			|| this.HasCreditRole();
	},
	HasSalesRole: function ()
	{
		return User.IsBusinessRoleEnabled("SalesRepresentative")
			|| User.IsBusinessRoleEnabled("OrderManagementSalesRep");
	},
	HasCreditRole: function ()
	{
		return User.IsBusinessRoleEnabled("CMEditCreditInformation")
			|| User.IsBusinessRoleEnabled("CMAllowCreditCheckOnExistingCustomer");
	},
	GetUserRole: function ()
	{
		if (User.IsBusinessRoleEnabled("CustomerServiceRepresentative"))
		{
			return "CustomerServiceRepresentative";
		}
		if (this.HasSalesRole())
		{
			return "SalesRepresentative";
		}
		if (this.HasCreditRole())
		{
			return "CreditManagement";
		}
		return "";
	},
	GetSuggestions: function ()
	{
		const languageInstruction = " Answer in " + (User.language || "en") + ".";
		const suggestions = [
			{
				name: "CustomerInquiryDetails",
				label: Language.Translate("_SynergyInquiryDetailsSuggestionLabel"),
				description: "Display this suggestion to provide additional details about the customer inquiry highlighted in the analysis.",
				priority: 1,
				permanent: true,
				action: {
					prompt: "Can you share more details about this customer latest inquiry?",
					label: Language.Translate("_SynergyInquiryDetailsSuggestionMessage")
				}
			},
			{
				name: "CustomerIssuesDetails",
				label: Language.Translate("_SynergyCustomerIssuesSuggestionLabel"),
				description: "Display this suggestion to provide additional details about the customer topics highlighted in the analysis.",
				priority: 2,
				permanent: true,
				action: {
					prompt: "Can you share more details about customer's latest topics?",
					label: Language.Translate("_SynergyCustomerIssuesSuggestionMessage")
				}
			},
			{
				name: "CustomerCallDiscussionTopics",
				label: Language.Translate("_SynergyRecommendationsSuggestionLabel"),
				description: "Always offer this suggestion to recommend how the user should open the customer call.",
				priority: 3,
				permanent: true,
				action: {
					prompt: "What should I discuss with this customer over a call?",
					label: Language.Translate("_SynergyRecommendationsSuggestionMessage")
				}
			}
		];

		for (const suggestion of suggestions)
		{
			suggestion.action.prompt += languageInstruction;
		}
		return suggestions;
	},
	GetInitialContext: function ()
	{
		const customerHealthInput = {
			customerName: ProcessInstance.extendedProperties.company || "",
			customerId: Controls.CustomerID__ ? Controls.CustomerID__.GetValue() : "",
			businessPartnerId: ProcessInstance.extendedProperties.businessPartnerID || "",
			supportsCustomDirectives: true
		};
		return "The current customer page provides this authoritative customerHealthInput context: " +
			JSON.stringify(customerHealthInput);
	}
};

let MessagesHelper = {
	Init: function ()
	{
		Controls.ConversationList__.Init({
			BusinessIdFieldName: "BusinessPartnerId",
			Options: {
				ignoreDocumentRuidExFilter: true,
				customBusinessId: ProcessInstance.extendedProperties.businessPartnerID
			},
			AdditionalProcesses: [{
				Options: {
					ignoreDocumentRuidExFilter: true,
					customBusinessId: ProcessInstance.extendedProperties.businessPartnerID
				},
				TableColumnsToDisplay: [
					{
						label: "_Company",
						data: "recipientCompany",
						width: "20%"
					},
					{
						label: "_LastMessage",
						data: "lastMessage.Message",
						width: "80%"
					}
				]
			}]
		});
		Controls.ConversationList__.HideNewMessageButton(true);
	}
};
let CustomerProfileDisplayHelper = {
	_roleHiddenControls: [],
	_roles: {
		"_Business Policy - Sales Representative.xml": {
			allowedDashboardPanes: {
				"CountersPane": [],
				"RiskCategoryPane": [],
				"TotalExposurePane": [],
				"CreditLimit": [],
				"TermsyncCountersPane": [],
				"OrdersCountersPane": [],
				"MainContactPane": [],
				"HistoryPane": [],
				"LastInternalNotePane": [],
				"TimelinePane": [],
				"SynergyInsightsPane": []
			},
			hiddenNavMenuItems: [],
			hiddenControls: ["CreditHold"]
		},
		"_Business Policy - Flexible SOP.xml": {
			allowedDashboardPanes: {
				"CountersPane": [],
				"RiskCategoryPane": [],
				"TotalExposurePane": [],
				"CreditLimit": [],
				"TermsyncCountersPane": [],
				"OrdersCountersPane": [],
				"MainContactPane": [],
				"HistoryPane": [],
				"LastInternalNotePane": [],
				"TimelinePane": [],
				"SynergyInsightsPane": []
			},
			hiddenNavMenuItems: [],
			hiddenControls: ["CreditHold"]
		}
	},
	Init: function ()
	{
		this._roles = this.CustomizeDictionary(this._roles);

		// If the user is in account management or full admin role, do not apply any restrictions
		if (User.profileRole === "accountManagement" || User.profileRole === "fullAdmin" || User.profileRole === "powerUser")
		{
			return;
		}
		// Collect all enabled roles
		let enabledRoles = [];
		for (let role in this._roles)
		{
			if (User.IsBusinessRoleEnabled(role))
			{
				enabledRoles.push(role);
			}
		}

		if (enabledRoles.length === 0)
		{
			return;
		}

		// Reset the list of controls hidden by role
		this._roleHiddenControls = [];

		// Concatenate allowedDashboardPanes and hiddenNavMenuItems from all enabled roles (no duplicates)
		let combinedAllowedPanes = {};
		let hiddenNavMenuItemsCount = {};
		let hiddenControlsCount = {};

		enabledRoles.forEach(function (role)
		{
			let roleConfig = this._roles[role];

			// Merge allowedDashboardPanes
			for (let paneName in roleConfig.allowedDashboardPanes)
			{
				if (!combinedAllowedPanes.hasOwnProperty(paneName))
				{
					combinedAllowedPanes[paneName] = new Set();
				}
				// Concatenate allowed controls for this pane, avoiding duplicates
				roleConfig.allowedDashboardPanes[paneName].forEach(function (control)
				{
					combinedAllowedPanes[paneName].add(control);
				});
			}

			// Count occurrences of each hiddenNavMenuItems across all roles
			roleConfig.hiddenNavMenuItems.forEach(function (item)
			{
				hiddenNavMenuItemsCount[item] = (hiddenNavMenuItemsCount[item] || 0) + 1;
			});

			// Count occurrences of each hiddenControl across all roles
			roleConfig.hiddenControls.forEach(function (control)
			{
				hiddenControlsCount[control] = (hiddenControlsCount[control] || 0) + 1;
			});
		}.bind(this));

		// Only hide controls that are hidden in ALL enabled roles
		let combinedHiddenControls = [];
		for (let control in hiddenControlsCount)
		{
			if (hiddenControlsCount[control] === enabledRoles.length)
			{
				combinedHiddenControls.push(control);
			}
		}

		let panes = Controls.form_content_middle.GetPanes() || [];
		panes = panes.concat(Controls.form_content_right.GetPanes() || []);
		for (const element of panes)
		{
			let paneName = element.GetName();
			if (combinedAllowedPanes.hasOwnProperty(paneName))
			{
				let allowedControls = combinedAllowedPanes[paneName];
				if (allowedControls.size > 0)
				{
					let paneControls = element.GetControls() || [];
					for (const element of paneControls)
					{
						if (!allowedControls.has(element.GetName()))
						{
							this._roleHiddenControls.push(element.GetName());
							element.Hide(true);
						}
					}
				}
			}
			else
			{
				element.Hide(true);
			}
		}

		let hiddenNavMenuItems = [];
		for (let item in hiddenNavMenuItemsCount)
		{
			if (hiddenNavMenuItemsCount[item] === enabledRoles.length)
			{
				hiddenNavMenuItems.push(item);
			}
		}

		hiddenNavMenuItems.forEach(function (item)
		{
			Controls.NavMenu__.HideItem(item);
		});

		combinedHiddenControls.forEach(function (control)
		{
			if (Controls[control])
			{
				this._roleHiddenControls.push(control);
				Controls[control].Hide(true);
			}
		}.bind(this));

	},
	CustomizeDictionary: function (dictionary)
	{
		return Sys.Helpers.TryCallFunction("Lib.Customization.CustomerExtendedProperties.CustomizeDictionary", dictionary) || dictionary;
	}
};

async function Main()
{
	// Entry point
	PackageHelper.Init();
	EDIHelper.Init();
	CustomerDetailsHelper.Init();
	CMHelper.Init();
	TermSyncHelper.Init();
	APPortalHelper.Init();
	GeneralInformationPaneHelper.Init();
	const asyncInitializations = [
		AlertsHelper.Init(),
		NavMenuHelper.Init()
	];
	CollectionHelper.Init();
	LogCallHelper.Init();
	ActionMenuHelper.Init();
	InternalNoteHelper.Init();
	CopyHelper.Init();
	GeneralPaneHelper.Init();
	DigitalAssistantHelper.Init();
	await Promise.all(asyncInitializations);
	Sys.Helpers.TryCallFunction("Lib.O2C.Customization.CIM.CustomizeHTMLScript");
}

Main();
