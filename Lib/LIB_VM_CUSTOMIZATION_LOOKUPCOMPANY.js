/* eslint no-empty-function: "off", no-unused-vars: "off" */
/**
 * @file Lib.VM.Customization.LookupCompany library
 * @namespace Lib.VM.Customization.LookupCompany
 */

/* LIB_DEFINITION{
  "name": "LIB_VM_CUSTOMIZATION_LOOKUPCOMPANY",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "versionable": false,
  "require": []
}*/

// eslint-disable-next-line no-redeclare
var Lib = Lib || {};
Lib.VM = Lib.VM || {};
Lib.VM.Customization = Lib.VM.Customization || {};

(function (parentLib)
{
	/**
	 * @lends Lib.VM.Customization.LookupCompany
	 */
	parentLib.LookupCompany =
	{
		/**
		* Override the LookupCompany function to have a demo result even if the configuration is empty or false
		* @memberof Lib.VM.Customization.LookupCompany
		* @param {string} country - The country selected in vendor lookup panel
		* @param {string} nationalID - The national ID selected in vendor lookup panel
		* @returns {string} JSON to replace results of D&B LookupCompany API
		* @example
		* <pre><code>
		* OverrideReturn: function()
		* {
		*	return {};
		* }
		* </code></pre>
		*/
		OverrideReturn: function (country, nationalID)
		{
			// Esker SA
			var eskerIDs = ["381824671", "FR53331518498", "33151849800001", "331518498"];
			if (eskerIDs.indexOf(nationalID) !== -1 && country === "FR")
			{
				return {
					companyName: "SA Esker",
					dunsNumber: "381824671",
					address: {
						street: "113 Bd de la bataille de Stalingrad",
						postalCode: "69100",
						city: "Villeurbanne",
						state: ""
					},
					phoneNumber: "0472834646",
					numberOfEmployees: 900,
					website: "www.esker.fr",
					registrationNumbers: [
						{
							typeDescription: "value added tax number",
							registrationNumber: "FR53331518498",
							isPreferredRegistrationNumber: true
						}
					]
				};
			}

			// Esker Inc
			eskerIDs = ["102217569"];
			if (eskerIDs.indexOf(nationalID) !== -1 && country === "US")
			{
				return {
					companyName: "Esker, Inc.",
					dunsNumber: "102217569",
					address: {
						street: "2010 Pinehurst Dr",
						postalCode: "53562-2555",
						city: "Middleton",
						state: "WI"
					},
					phoneNumber: "16088286000",
					numberOfEmployees: 77,
					website: "www.esker.com",
					registrationNumbers: [
						{
							typeDescription: "",
							registrationNumber: "39-1415155",
							isPreferredRegistrationNumber: true
						}
					],
					structure: "Corporation"
				};
			}

			return null;
		},

		/**
		* Function called to define demo companies to fill the D&B Company Search fields
		* @memberof Lib.VM.Customization.LookupCompany
		* @example
		* <pre><code>
		* GetDemoCompanies: function()
		* {
		*	return [
		*		{
		*			name: "ESKER Inc",
		*			country: "US",
		*			nationalID: "102217569"
		*		},
		*		{
		*			name: "ESKER SA",
		*			country: "FR",
		*			nationalID: "331518498"
		*		}
		*	];
		* }
		* </code></pre>
		*/
		GetDemoCompanies: function ()
		{
			return [
				{
					name: "ESKER Inc",
					country: "US",
					nationalID: "102217569"
				},
				{
					name: "ESKER SA",
					country: "FR",
					nationalID: "331518498"
				}
			];
		}
	};
})(Lib.VM.Customization);
