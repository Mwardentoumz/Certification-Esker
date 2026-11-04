/* LIB_DEFINITION{
  "name": "LIB_P2P_CSVDATAIMPORTPARAMETERS",
  "libraryType": "Lib",
  "scriptType": "SERVER",
  "comment": "Library for CSV import data customization for P2P",
  "versionable": false,
  "require": [
    "Sys/Sys",
    "Lib_V12.0.566.0",
    "Lib_CsvDataImportParameters",
    "[Lib_ERP_Generic_CSVDataImportParameters_V12.0.566.0]",
    "[Lib_ERP_EBS_CSVDataImportParameters_V12.0.566.0]",
    "[Lib_ERP_NAV_CSVDataImportParameters_V12.0.566.0]",
    "[Lib_ERP_JDE_CSVDataImportParameters_V12.0.566.0]",
    "[Lib_ERP_SAPS4CLOUD_CSVDataImportParameters_V12.0.566.0]",
    "[Lib_ERP_Universal_CSVDataImportParameters_V12.0.566.0]",
    "[Lib_ERP_CustomERP_CSVDataImportParameters_V12.0.566.0]"
  ]
}*/
var Lib;
Sys.ExtendLib(Lib, "P2P.CSVDataImportParameters", function ()
{
	return {
		/* ************************************ *
		 * List of parameters for configuration *
		 * ************************************ */
		Parameters: {
			/* FailureManagementProcessName is the name of the next proccess to call to handle failure */
			//FailureManagementProcessName: "Sys_CSV Data Import Failure Management",

			/* Mapping allow the definition of a relation between the tablename extracted from the CSV filename
			 * and a XML mapping file.
			 * if nothing defined, the code assume the mapping file is 'mapping_[tablename]__.xml' */
			//Mapping: {
			//Here an exemple to link the input SAP__Vendors__example.csv file to mapping_Vendors__.xml mapping file

			//"Vendors": "mapping_Vendors__.xml"
			//},

			/* FileNamePattern is used to validate the input file format */
			//FileNamePattern: ".*__.*__.*",
			//CsvHasHeader: true,

			/* CSV2TAble options*/
			/* possible values:
			 * "full" - if the csv represent the whole content of the table
			 * "incremental" - if the csv represent a subset of the table */
			//ReplicationMode: "full",
			// ClearTable: false,
			// NoDelete: false,
			// NoUpdate: false,
			// NoInsert: false,

			/* Notification options */
			// NotifyOnSuccess: false,
			// NotifyOnFailure: true,
			// NotifyOnEmptyFile: true,
			// NotifySender: false,
			// NotificationIncludeAttach:true,
			// NotificationBccEmailAddress: "",
			// NotificationEmailAddress:"",
			// NotificationSenderAddress: "",
			// NotificationSenderName: "",
			// NotificationLanguage: "en",
			// SupportedLanguages: ["en", "fr"],

			/* NotificationAttachMaxSizeInBytes limit the size of the CSV input that can be attached to notification email */
			// NotificationAttachMaxSizeInBytes: 7142880,

			/* Notifications contains the text used in send email formated as follow
				Notifications: {
					// [lg] should be a language code like 'en','fr', ...
					"[lg]":{
						subject: {
							// subject for success email
							success: "",
							// subject for failure email
							failure: ""
						},
						message: {
							// message for success email
							success: "",
							// message for failure email when no mapping is found
							noMapping: "",
							// message for failure email when the input file is not valid
							invalidFile: "",
							// message for failure email when the input file is empty
							emptyFile:	"",
							// message for failure email when the command line failed
							processFailure: ""
						},
						footer: {
							// footer message for email when the csv is not asked to be attached
							"noAttach": "",
							// footer message for email when the csv is asked to be attached
							"withAttach": "",
							// footer message for email when the csv is asked to be attached but is too big
							"overSized": ""
						}
					},
				}
			*/

			// Notifications: {
			// "en":{
			// subject: {
			// success: "[DATA IMPORT SUCCESS] Data Import from '%[FileName]'",
			// failure: "[DATA IMPORT FAILURE] Data Import from '%[FileName]'"
			// },
			// message: {
			// success:	"Dear recipient,\n\n"+
			// "Data from file '%[FileName]' loaded successfully.\n\n"+
			// "TECHNICAL DETAILS:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environment: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifier: %[MSN]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Status: %[ShortStatus]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "%[LongStatus]\n"+
			// "-----------------------------------------------------------------------------",

			// noMapping:  "Dear recipient,\n\n"+
			// "Data from file '%[FileName]' could not be loaded because the mapping file is undefined for table %[TableName].\n\n"+
			// "TECHNICAL DETAILS:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environment: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifier: %[MSN]\n" +
			// "-----------------------------------------------------------------------------",

			// invalidFile:    "Dear recipient,\n\n"+
			// "Data from file '%[FileName]' could not be loaded because no valid table was found.\n\n"+
			// "Please make sure the file name is correct and matches the following format: \"*.csv\"\n\n"+
			// "TECHNICAL DETAILS:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environment: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifier: %[MSN]\n" +
			// "-----------------------------------------------------------------------------",

			// emptyFile:	"Dear recipient,\n\n"+
			// "Data from file '%[FileName]' could not be loaded because the file is empty.\n\n"+
			// "Please verify your CSV file generation process.\n\n"+
			// "TECHNICAL DETAILS:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environment: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifier: %[MSN]\n" +
			// "-----------------------------------------------------------------------------",

			// processFailure: "Dear recipient,\n\n"+
			// "Data from file '%[FileName]' could not be loaded.\n\n"+
			// "Please refer to the 'Log.xml' file attached to this email for details.\n\n"+
			// "TECHNICAL DETAILS:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environment: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifier: %[MSN]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Status: %[ShortStatus]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "%[LongStatus]\n"+
			// "-----------------------------------------------------------------------------"
			// },
			// footer: {
			// "noAttach": "",
			// "withAttach": "\n\nThe submitted file is attached to this email for your reference.",
			// "overSized": "\n\nThe submitted file being over %[NotificationAttachMaxSizeInBytes] Bytes in size, it has not been attached to this email."
			// }
			// },

			// "fr":{
			// subject: {
			// success: "[SUCCES DE L'IMPORT DE DONNEES] Import de données depuis '%[FileName]'",
			// failure: "[ECHEC DE L'IMPORT DE DONNEES] Import de données depuis '%[FileName]'"
			// },
			// message: {
			// success:    "Madame, Monsieur,\n\n"+
			// "Les données du fichier '%[FileName]' ont été importées avec succès.\n\n"+
			// "DETAILS TECHNIQUES:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environnement: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifiant: %[MSN]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Statut: %[ShortStatus]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "%[LongStatus]\n"+
			// "-----------------------------------------------------------------------------",

			// noMapping:  "Madame, Monsieur,\n\n"+
			// "Les données du fichier '%[FileName]' n'ont pas pu être chargées car le fichier de mapping n'est pas défini pour la table %[TableName].\n\n"+
			// "DETAILS TECHNIQUES:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environnement: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifiant: %[MSN]\n"+
			// "-----------------------------------------------------------------------------",

			// invalidFile:    "Madame, Monsieur,\n\n"+
			// "Les données du fichier '%[FileName]' n'ont pas pu être chargées car aucune table valide n'a été trouvée.\n\n"+
			// "Merci de vous assurer que le nom du fichier est correct et correspond au format suivant: \"*.csv\"\n\n"+
			// "DETAILS TECHNIQUES:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environnement: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifiant: %[MSN]\n"+
			// "-----------------------------------------------------------------------------",

			// emptyFile:	"Madame, Monsieur,\n\n"+
			// "Les données du fichier '%[FileName]' n'ont pas pu être chargées car le fichier est vide.\n\n"+
			// "Merci de vérifier votre processus de génération du fichier CSV.\n\n"+
			// "DETAILS TECHNIQUES:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environnement: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifiant: %[MSN]\n"+
			// "-----------------------------------------------------------------------------",

			// processFailure: "Madame, Monsieur,\n\n"+
			// "Les données du fichier '%[FileName]' n'ont pas pu être chargées.\n\n"+
			// "Merci de consulter le fichier 'Log.xml' joint à cet email pour plus de détails.\n\n"+
			// "DETAILS TECHNIQUES:\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Environnement: %[Environment]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Identifiant: %[MSN]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "Statut: %[ShortStatus]\n"+
			// "-----------------------------------------------------------------------------\n"+
			// "%[LongStatus]\n"+
			// "-----------------------------------------------------------------------------"
			// },
			// footer: {
			// "noAttach": "",
			// "withAttach": "\n\nPour votre information, le fichier ayant été soumis est joint à cet email.",
			// "overSized": "\n\nLa taille du fichier soumis excède %[NotificationAttachMaxSizeInBytes] Octets. Ce fichier n'a donc pas été joint à cet email."
			// }
			// }
			// }
		},

		/* ********* *
		 * Functions *
		 * ********* */

		/**
		 * Initialize the data
		 * @param {string} erpId Id of the ERP
		 * returns the name of recognized ERP or empty by default
		 */
		Init: function (erpId)
		{
			if (typeof Lib !== "undefined" && typeof (Lib.ERP) !== "undefined" && typeof (Lib.ERP.CreateManager) === "function")
			{
				var manager = Lib.ERP.CreateManager(erpId);
				if (manager)
				{
					var document = manager.GetDocument("CSV_DATA_IMPORT_PARAMETERS");
					Sys.Helpers.Extend(true, Lib.CSVDataImportParameters, document);
					const docProto = Object.getPrototypeOf(document);
					const propertyNames = Object.getOwnPropertyNames(docProto);
					for (let i = 0; i < propertyNames.length; i++)
					{
						if (propertyNames[i] !== "constructor")
						{
							Lib.CSVDataImportParameters[propertyNames[i]] = docProto[propertyNames[i]];
						}
					}
					return erpId;
				}
			}
			return "";
		},

		/* GetJSON:
		 * returns the parameters to extends the default parameters
		 */
		GetJSON: function ()
		{
			if (g_tableName === "P2P - Vendor UNSPSC")
			{
				this.Parameters.NoDelete = true;
				this.Parameters.NoUpdate = true;
				this.Parameters.NoInsert = true;
				this.Parameters.ReplicationMode = "incremental";
				this.Parameters.ClearTable = true;
			}
			else if (g_tableName === "VendorsRiskLevel")
			{
				// Partial update of AP - Vendors__ (risk columns only, see mapping_VendorsRiskLevel__.xml):
				// existing vendors are updated, unknown vendors are ignored and no vendor is deleted
				this.Parameters.ReplicationMode = "incremental";
				this.Parameters.NoInsert = true;
				this.Parameters.NoDelete = true;
			}
			return this.Parameters;
		},

		// function to determine the mapping file base on the table name
		GetMappingFile: function (tableName)
		{
			Log.Info("Use of custom Lib.CSVDataImportParameters.GetMappingFile(" + tableName + ")");
			var mapping = "";
			if (tableName)
			{
				mapping = Sys.CSVDataImportParameters.GetExtendedJSON().Mapping[tableName];
				if (!mapping)
				{
					mapping = "mapping_" + tableName + "__.xml";
				}
			}
			return mapping;
		}

		// -------
		// Hooks : following functions, if uncommented, will REPLACE the default behavior defined in Sys_CSVDataImportParameters
		//
		// NOTE: don't forget to add a ',' after the GetJSON function if you add a fonction below
		// -------

		/*
		// function to determine the ERPID based on the input CSV filename
		GetErpId: function (fileName)
		{
			Log.Info("Use of custom Lib.CSVDataImportParameters.GetErpId("+fileName+")");
			if (fileName && fileName.length > 0)
			{
				return Sys.Helpers.String.ExtractAfterUntil(fileName, "", "__");
			}
			return "";
		},

		// function to determine the table name based on the input CSV filename
		GetTableName: function (fileName)
		{
			Log.Info("Use of custom Lib.CSVDataImportParameters.GetTableName("+fileName+")");
			if (fileName && fileName.length > 0)
			{
				return Sys.Helpers.String.ExtractAfterUntil(fileName, "__", "__");
			}
			return "";
		},

		// Getters for notification

		// return the notification subject based on type and language
		GetNotificationSubject: function (filename, type, lg)
		{
			Log.Info("Use of custom Lib.CSVDataImportParameters.GetNotificationSubject("+filename+", "+type+", "+lg+")");
			var subject = Sys.CSVDataImportParameters.GetNotification(lg,"subject",type);
			if (!subject)
			{
				subject = Sys.CSVDataImportParameters.GetNotification(lg, "subject", this.SubjectType.failure);
			}
			subject = subject.replace("%[FileName]", filename);
			return subject;
		},

		// return the notification footer message based on the language
		GetNotificationFooter: function(lg)
		{
			Log.Info("Use of custom Lib.CSVDataImportParameters.GetNotificationFooter("+lg+")");
			if (Sys.CSVDataImportParameters.GetValue("NotificationIncludeAttach"))
			{
				var maxSize = Sys.CSVDataImportParameters.GetValue("NotificationAttachMaxSizeInBytes");
				if (Attach.GetSize(0) > parseInt(maxSize,10))
				{
					var footer = Sys.CSVDataImportParameters.GetNotification(lg, "footer", Sys.CSVDataImportParameters.FooterType.overSized);
					if (footer)
					{
						footer = footer.replace("%[NotificationAttachMaxSizeInBytes]", maxSize);
					}
					return footer;
				}
				return Sys.CSVDataImportParameters.GetNotification(lg, "footer", Sys.CSVDataImportParameters.FooterType.withAttach);
			}
			return Sys.CSVDataImportParameters.GetNotification(lg, "footer", Sys.CSVDataImportParameters.FooterType.noAttach);
		},

		// return the notification message content based on type and language
		GetNotificationMessage: function (filename, environment, tableName, msnEx, type, lg)
		{
			Log.Info("Use of custom Lib.CSVDataImportParameters.GetNotificationMessage("+tableName+", "+ environment+", "+tableName+", "+ msnEx + ", "+type+", "+lg+")");
			var message = Sys.CSVDataImportParameters.GetNotification(lg, "message", type);
			if (!message)
			{
				message = Sys.CSVDataImportParameters.GetNotification(lg, "message", Sys.CSVDataImportParameters.MessageType.processFailure);
			}

			message = message.replace("%[FileName]", filename);
			message = message.replace("%[Environment]", environment);
			message = message.replace("%[TableName]", tableName);
			message = message.replace("%[MSN]", msnEx);
			message += Sys.CSVDataImportParameters.GetNotificationFooter(lg);
			return message;
		}
		*/
	};
});
