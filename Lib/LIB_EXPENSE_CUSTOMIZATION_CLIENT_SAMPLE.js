"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_EXPENSE_CUSTOMIZATION_CLIENT_SAMPLE",
  "libraryType": "Lib",
  "scriptType": "CLIENT",
  "comment": "Custom library extending Expense scripts on Client side",
  "versionable": false,
  "require": [
    "Sys/Sys"
  ]
}*/
/**
 * Package common scripts customization callbacks
 * @namespace Lib.Expense.Customization.Client
 */
var Lib;
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Customization;
        (function (Customization) {
            var Client;
            (function (Client) {
                /**
                 * @method Lib.Expense.Customization.Client.OnLoad
                 * @description
                 * CLIENT_WEB|CLIENT_MOBILE
                 * Allows you to customize layout settings of the Expense process.
                 * This user exit is called from the HTML Page script of the Expense process, before loading the form and determining the workflow.
                 *
                 * This function will be called at the Expense loading; just before calling the Start function.
                 * If you return a promise object, we synchronize on it before calling the Start function.
                 * @example
                 * <pre><code>
                 * OnLoad: function ()
                 * {
                 * 	// Initialize company code
                 * 	Data.SetValue("CompanyCode__", "US01");
                 * }
                 * </code></pre>
                 */
                Client.OnLoad = function () {
                };
                /**
                 * @method Lib.Expense.Customization.Client.CustomizeLayout
                 * @description
                 * CLIENT_WEB|CLIENT_MOBILE
                 * Allows you to customize layout settings of the Expense process.
                 * This user exit is called from the HTML Page script of the Expense process, after loading the form and determining the workflow.
                 *
                 * This function will be called at the first Expense rendering; just after calling the Start function.
                 * Here you declare the OnEvent callbacks and set the initial state (hidden, readonly, etc.) of controls.
                 * @example
                 * This user exit displays the custom field Z_NumberOfGuest__ only when the expense type is set to Business Meals.
                 * <pre><code>
                 * CustomiseLayout: function ()
                 * {
                 *	 if (Controls.ExpenseType__.GetValue() === "Business Meals") // For the US01 Company Code
                    *	 {
                    *		 Controls.Z_NumberOfGuest__.Hide(false);
                    *	 }
                    *	 else
                    *	 {
                    *		 Controls.Z_NumberOfGuest__.Hide(true);
                    *	 }
                    *	 Controls.ExpenseType__.OnChange = Sys.Helpers.Wrap(Controls.ExpenseType__.OnChange, function(originalFn)
                    *	 {
                    *		 if (Controls.ExpenseType__.GetValue() === "Business Meals") // For the US01 Company Code
                    *		 {
                    *			 Controls.Z_NumberOfGuest__.Hide(false);
                    *		 }
                    *		 else
                    *		 {
                    *			 Controls.Z_NumberOfGuest__.Hide(true);
                    *		 }
                    *		 originalFn.apply(this, Array.prototype.slice.call(arguments, 1));
                    *	 });
                    * }
                    * </code></pre>
                    */
                Client.CustomizeLayout = function () {
                };
                /**
                 * @method Lib.Expense.Customization.Client.GetFuelConversionMappings
                 * @description
                 * CLIENT_WEB
                 * Returns a mapping of conversion functions to convert fuel volumes to the corporate standard volume unit.
                 * This function creates a mapping object where each key represents a fuel volume unit (Gal, kWh, L)
                 * and each value is a conversion function that transforms the input volume to the corporate standard unit.
                 * The conversion logic depends on the corporate volume unit parameter:
                 * - If corporate unit is "L" (Liters): Gallons are converted using factor 3.78541, others remain unchanged
                 * - If corporate unit is "Gal" (Gallons): Liters are converted using factor 1/3.78541, others remain unchanged
                 * - U can follow this logic to add more units if needed
                 * - overloadCorporateVolumeUnit is used to override the corporate volume unit for specific conversions. Can be useful if you can't convert a unit to the corporate volume unit.
                 * @param corporateVolumeUnit - The corporate standard volume unit ("L" for Liters or "Gal" for Gallons) or other you added in the global settings as corporate volume unit.
                 * @returns {FuelConversionMappings} A record mapping unit names to their respective conversion functions, with the possibility to override the corporate volume unit for specific conversions.
                 * @example
                 * This function automatically converts fuel volume units (liters to gallons or gallons to liters) according to the company's standard unit.
                 * <pre><code>
                 * function GetFuelConversionMappings(corporateVolumeUnit: string): FuelConversionMappings
                 * {
                 * 	let conversionMappings: FuelConversionMappings = {};
                 *	let CONVERSION_FACTOR_GAL_L = 3.78541;
                 *
                 *	if (corporateVolumeUnit === "L")
                 *	{
                 *		conversionMappings = {
                 *			"Gal": {
                 *				conversionFunction: (fuelVolume) => ({
                 *					convertedVolume: Sys.Decimal.mul(fuelVolume, CONVERSION_FACTOR_GAL_L).toNumber(),
                 *				})
                 *			},
                 *			"CustoVolumeUnit1": {
                 *				conversionFunction: (fuelVolume) => ({
                 *					convertedVolume: fuelVolume,
                 *				}),
                 *				overloadCorporateVolumeUnit: "kWh"
                 *			},
                 *		"L": {
                 *			conversionFunction: (fuelVolume) => ({
                 *				convertedVolume: fuelVolume,
                 *			})
                 *			}
                 *		}
                 *	}
                 *	else
                 *	{
                 *		conversionMappings = {
                 *			"Gal": {
                 *				conversionFunction: (fuelVolume) => ({
                 *					convertedVolume: fuelVolume,
                 *				})
                 *			},
                 *			"kWh": {
                 *				conversionFunction: (fuelVolume) => ({
                 *					convertedVolume: fuelVolume,
                 *				}),
                 *				overloadCorporateVolumeUnit: "kWh"
                 *			},
                 *			"L": {
                 *				conversionFunction: (fuelVolume) => ({
                 *					convertedVolume: Sys.Decimal.div(fuelVolume, CONVERSION_FACTOR_GAL_L).toNumber(),
                 *				})
                 *			}
                 *		}
                 *	}
                 *
                    return conversionMappings;
                 * }
                 * </code></pre>
                */
                Client.GetFuelConversionMappings = function (corporateVolumeUnit) {
                    return null; // return null to not apply this UE
                };
                /**
                 * @method Lib.Expense.Customization.Client.MappingVolumeUnitByFuel
                 * @description
                 * CLIENT_WEB
                 * Returns a mapping of fuel types to their available volume units with display labels.
                 * This function defines which volume units are available for each fuel type, including both
                 * the technical unit values and their corresponding display labels for internationalization.
                 * The mapping is used to populate the fuel type and fuel volume unit dropdowns in the expense form.
                 * Each fuel type contains an array of units (with technical value and display label) and a label for the fuel type itself.
                 * Custom fuel types can be added using the reserved fields CustoFuel1, CustoFuel2, ... CustoFuel10 for customer-specific fuel types.
                 * @param actualUnitMapping  - The current mapping of volume units to their display labels, used to ensure consistency in unit representation.
                 * @returns {unitMapping} A record mapping fuel type names to objects containing their available volume units with labels and fuel type labels
                 * @example
                 * This function defines the available volume units for each fuel type with display labels.
                 * You can add custom fuel types using CustoFuel1 through CustoFuel10 for your specific needs.
                 * <pre><code>
                 * function MappingVolumeUnitByFuel(): unitMapping
                 * {
                 * 		if (Data.GetValue("ExpenseType__") === "Electric")
                 *		{
                 *			return {
                 *				"Electric": {
                 *					units: [{ unit: "CustoVolumeUnit1", label: "_CustoVolumeUnit1" }], //Possibility to add custom volume units
                 *					label: "_Electric"
                 *				},
                 *			};
                 *		}
                 *
                 *		else
                 *		{
                 *			return {
                 *				"UnleadedGas": {
                 *					units: [{ unit: "L", label: "_L" }, { unit: "Gal", label: "_Gal" }],
                 *					label: "_UnleadedGas"
                 *				},
                 *				"Diesel": {
                 *					units: [{ unit: "L", label: "_L" }, { unit: "Gal", label: "_Gal" }],
                 *					label: "_Diesel"
                 *				},
                 *				"CustoFuel1": { //We can add custom fuel types using CustoFuel1, CustoFuel2, ... CustoFuel10, you just have to put the unit and the trad file
                 *					units: [{ unit: "L", label: "_L" }, { unit: "Gal", label: "_Gal" }],
                 *					label: "_CustoFuel1"
                 *				}
                 *			};
                 *		}
                 *	}
                 *
                 * </code></pre>
                 */
                Client.MappingVolumeUnitByFuel = function (actualUnitMapping) {
                    return null; // return null to not apply this UE
                };
                /**
                 * @method Lib.Expense.Customization.Client.RestrictAllowedExtensions
                 * @description
                 * Allows you to restrict the allowed file extensions for attachments in the Expense process.
                 * Since S337, at the process definition level, every extension is supported.
                 * However, in order to maintain some backward compatibility, the customscript contains a list of previously allowed extensions.
                 * You can restrict default allowed extensions by editing the customisedAllowedExtensions parameter.
                 * The process definition remains the last authority on allowed extensions.
                 * @since 337
                 * @example <caption>In this example you can customize the default extensions supported for both documents and attachments.</caption>
                 * RestrictAllowedExtensions: function (customisedAllowedExtensions)
                 * {
                 *	 customisedAllowedExtensions.AllowedDocumentFileExtensions = "pdf,jpg,jpeg,png";
                 *	 customisedAllowedExtensions.AllowedAttachmentFileExtensions = "pdf,jpg,jpeg,png";
                 * }
                 */
                Client.RestrictAllowedExtensions = function (customisedAllowedExtensions) {
                };
                /**
                 * @method Lib.Expense.Customization.Client.GetFieldsToKeepOnCompanyCodeChange
                 * @description
                 * CLIENT_WEB
                 *
                 * Warning : to use this user exit in mobile, it should also be implemented on the mobile namespace (Lib.Expense.Customization.Mobile) as the client script is not shared between web and mobile.
                 *
                 * Allows you to specify a list of additional fields that should be preserved when the Company Code is changed on web.
                 * By default, most fields are cleared when the Company Code changes to ensure data consistency.
                 * This user exit allows you to prevent specific fields from being reset.
                 *
                 * @returns {string[]} An array of field names (ending with "__") to keep.
                 * @since 352
                 * @warning Fields that depend on the Company Code should typically be reset (not preserved) to ensure data consistency.
                 *
                 * @example
                 * <pre><code>
                 * GetFieldsToKeepOnCompanyCodeChange: function ()
                 * {
                 *    // Keep the TransactionId__ and Description__ when Company Code changes
                 *    return ["TransactionId__", "Description__"];
                 * }
                 * </code></pre>
                 */
                Client.GetFieldsToKeepOnCompanyCodeChange = function () {
                    return null;
                };
            })(Client = Customization.Client || (Customization.Client = {}));
        })(Customization = Expense.Customization || (Expense.Customization = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
(function (Lib) {
    var Expense;
    (function (Expense) {
        var Customization;
        (function (Customization) {
            var Mobile;
            (function (Mobile) {
                /**
                 * @method Lib.Expense.Customization.Mobile.GetFieldsToKeepOnCompanyCodeChange
                 * @description
                 * CLIENT_MOBILE
                 * Allows you to specify a list of additional fields that should be preserved when the Company Code is changed on mobile.
                 * By default, most fields are cleared when the Company Code changes to ensure data consistency.
                 * This user exit allows you to prevent specific fields from being reset.
                 *
                 * @returns {string[]} An array of field names (ending with "__") to keep.
                 * @since 352
                 * @warning Fields that depend on the Company Code should typically be reset (not preserved) to ensure data consistency.
                 *
                 * @example
                 * <pre><code>
                 * GetFieldsToKeepOnCompanyCodeChange: function ()
                 * {
                 *    // Keep the TransactionId__ and Description__ when Company Code changes
                 *    return ["TransactionId__", "Description__"];
                 * }
                 * </code></pre>
                 */
                Mobile.GetFieldsToKeepOnCompanyCodeChange = function () {
                    return null;
                };
            })(Mobile = Customization.Mobile || (Customization.Mobile = {}));
        })(Customization = Expense.Customization || (Expense.Customization = {}));
    })(Expense = Lib.Expense || (Lib.Expense = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_EXPENSE_CUSTOMIZATION_CLIENT_SAMPLE.js.map