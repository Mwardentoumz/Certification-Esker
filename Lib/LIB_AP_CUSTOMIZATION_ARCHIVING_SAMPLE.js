"use strict";
/* eslint-disable no-empty-function, no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* LIB_DEFINITION{
  "name": "LIB_AP_CUSTOMIZATION_ARCHIVING_SAMPLE",
  "scriptType": "SERVER",
  "libraryType": "Lib",
  "comment": "AP archive customization callbacks",
  "versionable": false,
  "require": []
}*/
/**
 * Package AP archive customization callbacks.
 * Used in the 'Vendor Invoice Legal Archive' process.
 * @namespace Lib.AP.Customization.Archiving
 */
var Lib;
(function (Lib) {
    var AP;
    (function (AP) {
        var Customization;
        (function (Customization) {
            var Archiving;
            (function (Archiving) {
                /**
                 * @method Lib.AP.Customization.Archiving.GetArkhineoMetaDataApplicative
                 * @description
                 * Allows you to send additional applicative meta data to Arkhinéo depending on the customer's contract. This function is called before the Vendor invoice legal archive process.
                 * When creating an Arkhinéo account, the customer receives a document called Declaration of Meta Data (Déclaration des Méta Données in French). This document contains the list of required applicative and descriptive meta data. The required meta data may be different depending on customers.
                 * ATTENTION: Ensure that you have access to the customer's Declaration of Meta Data before using the GetArkhineoMetaDataApplicative user exit.
                 * @param {object} applicativeMetadata The default metadata that will be send to Arkhineo
                 * @return {object} An object containing the applicative metadata to send to Arkhineo
                 * @example
                 * <pre><code>
                 * GetArkhineoMetaDataApplicative: function (applicativeMetadata)
                 * {
                 *	applicativeMetadata.to = "Arkhineo archive system";
                 *	applicativeMetadata.from = "Esker";
                 *	applicativeMetadata.ds-metadata.USR = "AP";
                 * 	return applicativeMetadata;
                 * }
                 * </code></pre>
                 */
                Archiving.GetArkhineoMetaDataApplicative = function (applicativeMetadata) {
                };
                /**
                 * @method Lib.AP.Customization.Archiving.GetArkhineoMetaDataDescriptive
                 * @description
                 * Allows you to send the required descriptive meta data to Arkhinéo depending on the customer's contract. This function is called before the Vendor invoice legal archive process.
                 * When creating an Arkhinéo account, the customer receives a document called Declaration of Meta Data (Déclaration des Méta Données in French). This document contains the list of the required applicative and descriptive meta data. The required meta data is different depending on customers.
                 * ATTENTION: Ensure that you have access to the customer's Declaration of Meta Data before using the GetArkhineoMetaDataDescriptive user exit.
                 * @return {object} An object containing the descriptive metadata to send to Arkhineo
                 * @example
                 * <pre><code>
                 * GetArkhineoMetaDataDescriptive: function ()
                 * {
                 * 	var metadata = {
                 *		"title": "Invoice",
                 *		"identifier": Data.GetValue("MSNEX")
                 *	}
                 * 	return metadata;
                 * }
                 * </code></pre>
                 */
                Archiving.GetArkhineoMetaDataDescriptive = function () {
                };
            })(Archiving = Customization.Archiving || (Customization.Archiving = {}));
        })(Customization = AP.Customization || (AP.Customization = {}));
    })(AP = Lib.AP || (Lib.AP = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_AP_CUSTOMIZATION_ARCHIVING_SAMPLE.js.map