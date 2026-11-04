"use strict";
/* LIB_DEFINITION{
  "name": "LIB_CUSTOM_INBOUNDCHANNELPREPROCESSING_SAMPLE",
  "libraryType": "Lib",
  "versionable": false,
  "scriptType": "COMMON",
  "require": []
}*/
/**
 * Package P2P Custom inbound channel preprocessing rules list
 * @namespace Lib.Custom.InboundChannelPreprocessing
 * @see [Managing email preprocessing rules]{@link https://docptn.esker.com/eskerondemand/cv_ly/en/manager/startpage.htm#Configuration/Inbound_channels/email_preprocessing.html}
 */
var Lib;
(function (Lib) {
    var Custom;
    (function (Custom) {
        var InboundChannelPreprocessing;
        (function (InboundChannelPreprocessing) {
            /**
             * @method Lib.Custom.InboundChannelPreprocessing.GetFunctionList
             * @since 323
             * @description
             * List of functions that will be added to the list of custom processings of a email preprocessing rule.
             * @example
             * InboundChannelPreprocessing.GetFunctionList = function ()
             * {
             * 		return {
             * 			"My rule name": function (inputJSON) {
             * 				Log.Warn("Custom Rule - My rule name");
             * 				// add custom processing here
             * 				return inputJSON;
             * 			}
             * 		};
             * };
             */
            function GetFunctionList() {
                let functions = {};
                return functions;
            }
            InboundChannelPreprocessing.GetFunctionList = GetFunctionList;
            /**
             * @method Lib.Custom.InboundChannelPreprocessing.GetEmlToPdfConverterOptions
             * @since 339
             * @description
             * Retrieves additional options to pass to EML to PDF converter.
             * @returns {string} - A string representing the converter options in the format "?param1=value1?param2=value2", or void to use only default options.
             *
             * @example
             * InboundChannelPreprocessing.GetEmlToPdfConverterOptions = function()
             * {
             *     // This will switch the default HTML template used by the EML to PDF converter
             *     // when the option "Archive only email body" is enabled
             *     // The template specified here must be present in Delivery/FlyDoc/DeliveryWare/Config/EMailPreviewTemplates/
             * 	   // and SHOULD NOT include the language code (i.e. "FullTemplateMailPreview" and NOT "FullTemplateMailPreviewEN")
             *     return "?HTMLTemplateName=FullTemplateMailPreview";
             * }
             */
            function GetEmlToPdfConverterOptions() {
            }
            InboundChannelPreprocessing.GetEmlToPdfConverterOptions = GetEmlToPdfConverterOptions;
        })(InboundChannelPreprocessing = Custom.InboundChannelPreprocessing || (Custom.InboundChannelPreprocessing = {}));
    })(Custom = Lib.Custom || (Lib.Custom = {}));
})(Lib || (Lib = {}));
//# sourceMappingURL=LIB_CUSTOM_INBOUNDCHANNELPREPROCESSING_SAMPLE.js.map