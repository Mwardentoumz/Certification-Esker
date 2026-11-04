/* LIB_DEFINITION{
  "name": "Lib_O2C_Customization_User_Sample",
  "libraryType": "Lib",
  "scriptType": "COMMON",
  "versionable": false,
  "comment": "all User customization function",
  "require": []
}*/

/**
 * Package O2C User customization callbacks
 * @namespace Lib.O2C.Customization.User
 */

var Lib = Lib || {};
Lib.O2C = Lib.O2C || {};
Lib.O2C.Customization = Lib.O2C.Customization || {};

Lib.O2C.Customization.User = (function ()
{
	var customization = {
		/**
		 * @method Lib.O2C.Customization.User.CustomizePortailUserLogin
		 * @description
		 * Function called when a user with the contact email exists but belongs to a different customer company.
		 * Used to customize the login generation logic when creating a contact for a specific customer.
		 * This user exit is invoked BEFORE the default login builder creates: contactEmail.substr(0, atSignPosition) + "." + companyId + contactEmail.substring(atSignPosition)
		 *
		 * @param {Object} userProperty Object representing the customer properties.
		 * @param {string} userProperty.portailId - The portal/customer identifier (same as customerNumber in most cases)
		 * @param {string} userProperty.customerNumber - The customer number
		 * @param {string} userProperty.companyCode - The company code
		 * @param {string} userProperty.contactEmail - The contact email address
		 * @returns {string} The customized login (without account prefix), or null/undefined to use default logic
		 *
		 * @example Example 1: Simple combination with customer number and company code
		 * CustomizePortailUserLogin: function(userProperty)
		 * {
		 *     return userProperty.companyCode + userProperty.portailId;
		 * }
		 *
		 * @example Example 2: Transform company ID by keeping only digits and replacing slashes with dots
		 * // This example replicates the intrusive customization pattern:
		 * // Standard: email.before@ + "." + companyId + email.after@
		 * // Custom:   email.before@ + "." + sanitizedCompanyId + email.after@
		 * CustomizePortailUserLogin: function(userProperty)
		 * {
		 *     var contactEmail = userProperty.contactEmail;
		 *     var companyId = userProperty.companyCode || userProperty.customerNumber;
		 *     var atSignPosition = contactEmail.indexOf("@");
		 *
		 *     // Transform company ID: remove non-digits/non-slashes, then replace slashes with dots
		 *     var custNumDotLocation = companyId.replace(/[^0-9\/]+/g, "").replace(/\//g, ".");
		 *
		 *     // Build custom login: emailPrefix.sanitizedCompanyId@domain
		 *     return contactEmail.substr(0, atSignPosition) + "." + custNumDotLocation + contactEmail.substring(atSignPosition);
		 * }
		 */
		/*CustomizePortailUserLogin: function(userProperty)
		{
		},*/

		/**
		 * @method Lib.O2C.Customization.User.GetCustomerWhenLoginIsCustomized
		 * @description
		 * Function called for retrieve customer login when we are customized login
		 * @param {Function} callback A callback function with login in parameter
		 * @param {string} customerNumber The customerNumber may be passed in in certain workflows e.g. involving a table of invoices. Otherwise it needs to be read from the appropriate field.
		 * @param {string} companyCode The companyCode may be passed in in certain workflows e.g. involving a table of invoices. Otherwise it needs to be read from the appropriate field.
		 *
		 * @example Retrieve customer login when uniqueness is company code and customerNumber
		 * GetCustomerWhenLoginIsCustomized: function(callback, customerNumber, companyCode)
		 * {
		 *	if (!customerNumber)
		 *	{
		 *		customerNumber = "";
		 *		if (Data.GetValue("Customer_ID__"))
		 *		{
		 *			customerNumber = Data.GetValue("Customer_ID__");
		 *		}
		 *		else if (Data.GetValue("Recipient_ID__"))
		 *		{
		 *			customerNumber = Data.GetValue("Recipient_ID__");
		 *		}
		 *	}
		 *	if (!companyCode)
		 *	{
		 *		companyCode = "";
		 *		if (Data.GetValue("Company_code__"))
		 *		{
		 *			companyCode = Data.GetValue("Company_code__");
		 *		}
		 *	}
		 *	var filter = "(&(IsCompany__=1)(BusinessPartnerId__="+customerNumber.toLowerCase()+")(SupplierCompanyCode__="+companyCode+"))";
		 *	Sys.GenericAPI.Query("Customer_Extended_Delivery_Properties__", filter, ["CustomerID__"], function (records, error)
		 *	{
		 *		var login = "";
		 *		if (!error && records.length !== 0)
		 *		{
		 *			login = records[0]["CustomerID__"];
		 *		}
		 *		callback(login);
		 *	});
		 * }
		 */
		/*GetCustomerWhenLoginIsCustomized: function(callback, customerNumber, companyCode)
		{
		}*/
	};
	return customization;
})();

