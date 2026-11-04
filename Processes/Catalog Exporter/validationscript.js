"use strict";
/* eslint-disable class-methods-use-this */
var ValidationScript;
(function (ValidationScript) {
    var OutputCSV = Sys.Helpers.CSVExport.OutputCSV;
    var CatalogItem = Lib.Purchasing.CatalogHelper.CatalogItem;
    var CatalogHelper = Lib.Purchasing.CatalogHelper;
    class CatalogExporterServer {
        constructor(config) {
            this.config = config;
        }
        GetCSVLines(catalogItem) {
            const rawData = catalogItem.GetRawData();
            const catalogItemCSV = this.config.GetCatalogHeaderAttributes().map((attr) => { var _a; return ((_a = rawData[attr]) === null || _a === void 0 ? void 0 : _a.toString()) || ""; });
            const csvLines = [];
            for (const index in catalogItem.providersItemProperties) {
                const itemProperties = catalogItem.providersItemProperties[index];
                if (itemProperties instanceof this.config.itemPropertiesClass) {
                    const providerCSVPart = this.config.BuildProviderCSVLine(itemProperties);
                    const csvLine = catalogItemCSV.concat(providerCSVPart);
                    csvLines.push(csvLine);
                }
            }
            if (!csvLines.length) {
                csvLines.push(catalogItemCSV);
            }
            return csvLines;
        }
        AttachCatalogItemsCSV(csv, date) {
            Log.Time("AttachCatalogItemsCSV");
            const filename = this.NormalizeFileName(date);
            csv.AttachCSVFile(filename, true);
            Log.TimeEnd("AttachCatalogItemsCSV");
        }
        CreateBigQueryIterator() {
            const ctorQueryParams = new Sys.Helpers.QueryParams();
            ctorQueryParams.onTransport = false;
            ctorQueryParams.table = "P2P - CatalogItems__";
            ctorQueryParams.options = ["EnableJoin=1"];
            ctorQueryParams.attributes = this.config.GetAttributesToQuery();
            ctorQueryParams.filter = this.config.GetCatalogQueryFilter().toString();
            return new Sys.Helpers.BigQueryIterator(ctorQueryParams, null, "Msn");
        }
        FetchCatalogQueryResults(queryIT) {
            let records = [];
            let maxRecord = CatalogExporterServer.NB_RECORDS_TO_FETCH;
            let currRecord;
            while (--maxRecord && (currRecord = queryIT.Next()) != null) {
                records.push(currRecord);
            }
            return records;
        }
        RunCatalogExport() {
            const queryIT = this.CreateBigQueryIterator();
            let nbItem = 0;
            let records;
            const outputCSV = new OutputCSV();
            outputCSV.SetAutoFlush(1000);
            outputCSV.SetHeader(this.config.GetCSVHeader());
            outputCSV.SetLinesAutoPad(true);
            const attributes = this.config.GetAttributesToQuery();
            while (records = this.FetchCatalogQueryResults(queryIT), records.length > 0) {
                const items = CatalogItem.FromQueryResults(records.map((record, i) => Sys.GenericAPI.BuildQueryResult(record, attributes, i, {
                    fieldToTypeMap: CatalogExporterServer.fieldToTypeMap
                })));
                nbItem += items.length;
                for (let i = 0; i < items.length; i++) {
                    outputCSV.AddLines(this.GetCSVLines(items[i]));
                }
                Log.Info(`${nbItem} items exported, export in progress`);
            }
            Log.Info(`${nbItem} items exported, export done`);
            const now = new Date();
            this.AttachCatalogItemsCSV(outputCSV, now);
            Data.SetValue("ExportDate__", now);
            Data.SetValue("NumberOfRows__", outputCSV.GetNbLines());
            Data.SetValue("NumberOfItems__", nbItem);
        }
        HandleAction(actionName, actionType) {
            Log.Info(`received -> actionName: ${actionName} actionType: ${actionType}`);
            if ((!actionName && !actionType)
                || (actionName === "run_catalog_export" && actionType === "approve")) {
                this.RunCatalogExport();
                Data.SetValue("KeepOpenAfterApproval", "WaitForApproval");
            }
        }
        NormalizeFileName(date) {
            const name = this.config.GetCSVFileName(date);
            return name.replace(/[<>:"/\\|?*]/g, "_");
        }
        Start() {
            this.HandleAction(Data.GetActionName(), Data.GetActionType());
        }
    }
    CatalogExporterServer.fieldToTypeMap = {
        "ITEMNUMBER__.UNITPRICE__": "double",
        "ITEMNUMBER__.PUBLICPRICE__": "double",
        "GRADE__": "double",
        "GRADE_NUMBER__": "int",
        "ITEMNUMBER__.ENERGYCONSUMPTIONKGCO2EPERUNIT__": "string", // We want to handle null value
        "ITEMNUMBER__.LEADTIME__": "string", // We want to handle null value
        "ITEMNUMBER__.LOCKED__": "boolean",
        "ITEMNUMBER__.AVAILABLESTOCK__": "double",
        "ITEMNUMBER__.CURRENTSTOCK__": "double",
        "ITEMNUMBER__.RESERVEDSTOCK__": "double",
        "ITEMNUMBER__.INCOMINGSTOCK__": "double",
        "ITEMNUMBER__.MINIMUMTHRESHOLD__": "double",
        "ITEMNUMBER__.EXPECTEDSTOCKLEVEL__": "double",
        "TAXCODE__.TAXRATE__": "double",
        "TAXCODE__.NONDEDUCTIBLETAXRATE__": "double",
        "SUPPLYTYPEID__.NOGOODSRECEIPT__": "boolean",
        "SUPPLYTYPEID__.NOTIFYREQUESTERONRECEIPT__": "boolean"
    };
    CatalogExporterServer.NB_RECORDS_TO_FETCH = 100;
    ValidationScript.CatalogExporterServer = CatalogExporterServer;
    class CatalogExporterConfig {
        constructor() {
            this._catalogItemAttributes = null;
        }
        GetCSVHeader() {
            const attributes = this.GetFullLineAttributes();
            return attributes.map((attr) => {
                return this.attributesMapping[attr] || attr
                    .replace(/ITEMNUMBER__./g, "")
                    .replace(/__/g, "")
                    .toLowerCase()
                    .split(".")
                    .map((attr_part) => attr_part.length
                    ? attr_part.charAt(0).toUpperCase() + attr_part.slice(1)
                    : attr_part)
                    .join(" ");
            });
        }
        GetCatalogHeaderAttributes() {
            if (!this._catalogItemAttributes) {
                this._catalogItemAttributes = Object.keys(CatalogItem.TABLE_ATTRIBUTES).filter((attr) => this.attributeProperties.every(prop => CatalogItem.TABLE_ATTRIBUTES[attr].has(prop)));
            }
            return this._catalogItemAttributes;
        }
        GetFullLineAttributes() {
            const headerAttributes = this.GetCatalogHeaderAttributes();
            const providerAttributes = this.itemPropertiesClass.CSVLineAttributes
                .map(attr => CatalogHelper.NormalizeAttribute(attr, this.attributeLevel));
            return headerAttributes.concat(providerAttributes);
        }
    }
    class CatalogExporterConfigVendorItem extends CatalogExporterConfig {
        constructor() {
            super(...arguments);
            this.itemPropertiesClass = CatalogHelper.VendorItemProperties;
            this.attributeProperties = [
                "Vendor" /* CatalogHelper.AttributeProperty.Vendor */,
                "VendorCSVIntegration" /* CatalogHelper.AttributeProperty.VendorCSVIntegration */
            ];
            this.attributeLevel = "supplier";
            // must match EXTRACTED_DATA_TO_CSV_MAPPING Lib_Purchasing_Catalog_Management
            this.attributesMapping = {
                "DESCRIPTION__": "Name",
                "ITEMNUMBER__": "Item number",
                "LONGDESCRIPTION__": "Description",
                "ITEMNUMBER__.SUPPLIERPARTID__": "Supplier part ID",
                "ITEMNUMBER__.SUPPLIERPARTAUXID__": "Supplier auxiliary part ID",
                "MANUFACTURERNAME__": "Manufacturer name",
                "MANUFACTURERPARTID__": "Manufacturer part ID",
                "DEFAULTPUBLICPRICE__": "Suggested price",
                "DEFAULTCURRENCY__": "Suggested price currency",
                "ITEMNUMBER__.UNITPRICE__": "Unit price",
                "ITEMNUMBER__.CURRENCY__": "Currency",
                "ITEMNUMBER__.ENERGYCONSUMPTIONKGCO2EPERUNIT__": "GHG emissions (kgCO2e)",
                "ITEMNUMBER__.LEADTIME__": "Lead time",
                "UNITOFMEASURE__": "Unit of measurement",
                "COSTTYPE__": "Cost type",
                "UNSPSC__": "UNSPSC",
                "ITEMNUMBER__.VALIDITYDATE__": "Start date",
                "ITEMNUMBER__.EXPIRATIONDATE__": "End date",
                "COMPANYCODE__": "CompanyCode",
                "ITEMNUMBER__.VENDORNUMBER__": "VendorNumber",
                "IMAGE__": "Image",
                "STICKERID__": "Sticker name"
            };
        }
        BuildPriceConditionCSV(priceConditionData) {
            const priceConditionCsv = [];
            if (priceConditionData) {
                const priceCondition = JSON.parse(priceConditionData);
                priceConditionCsv.push(priceCondition.type);
                for (const threshold of priceCondition.thresholds) {
                    priceConditionCsv.push("" + threshold.threshold, "" + threshold.unitPrice, "" + threshold.base);
                }
            }
            return priceConditionCsv;
        }
        BuildProviderCSVLine(itemProperties) {
            const priceConditionCSV = this.BuildPriceConditionCSV(itemProperties.rawData["PRICECONDITIONDATA__"]);
            const vendorItemCSV = this.itemPropertiesClass.CSVLineAttributes
                .map(attribute => { var _a; return ((_a = itemProperties.rawData[attribute]) === null || _a === void 0 ? void 0 : _a.toString()) || ""; });
            return vendorItemCSV.concat(priceConditionCSV);
        }
        GetAttributesToQuery() {
            return [
                "RUIDEX", // For CatalogItem constructor
                "ITEMNUMBER__.PRICECONDITIONDATA__",
                ...this.GetFullLineAttributes()
            ];
        }
        GetCSVHeader() {
            const standardHeaders = super.GetCSVHeader();
            const priceConditionHeaders = [];
            const nbPriceConditionThresholds = this.GetMaxPriceConditions();
            Log.Info(`Max Price Condition : " ${nbPriceConditionThresholds}`);
            if (nbPriceConditionThresholds) {
                priceConditionHeaders.push(Lib.Purchasing.ConditionedPricing.CSVColumnName.type);
                for (let i = 1; i <= nbPriceConditionThresholds; i++) {
                    priceConditionHeaders.push(Lib.Purchasing.ConditionedPricing.CSVColumnName.threshold(i), Lib.Purchasing.ConditionedPricing.CSVColumnName.unitPrice(i), Lib.Purchasing.ConditionedPricing.CSVColumnName.base(i));
                }
            }
            return [...standardHeaders, ...priceConditionHeaders];
        }
        GetCatalogQueryFilter() {
            return Sys.Helpers.LdapUtil.FilterOr(Sys.Helpers.LdapUtil.FilterNotExist("ITEMNUMBER__.WAREHOUSENUMBER__"), Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", ""));
        }
        GetCSVFileName(date) {
            return `Export_Items_Catalog_${Sys.Helpers.Date.Format(date, "_yyyy-mm-dd_HH-MM-ss")}`;
        }
        GetMaxPriceConditions() {
            let ret = 0;
            const filter = Sys.Helpers.LdapUtil.FilterAnd(this.GetCatalogQueryFilter(), Sys.Helpers.LdapUtil.FilterNotEqual("ITEMNUMBER__.PRICECONDITIONDATA__", ""));
            let attributes = [
                "RUIDEX", // For CatalogItem constructor
                "ITEMNUMBER__.PRICECONDITIONDATA__"
            ];
            const ctorQueryParams = new Sys.Helpers.QueryParams();
            ctorQueryParams.onTransport = false;
            ctorQueryParams.table = "P2P - CatalogItems__";
            ctorQueryParams.attributes = attributes;
            ctorQueryParams.filter = filter.toString();
            ctorQueryParams.options = ["EnableJoin=1"];
            const queryIT = new Sys.Helpers.BigQueryIterator(ctorQueryParams, null, "Msn");
            let nbItem = 0;
            let currRecord;
            while ((currRecord = queryIT.Next()) != null) {
                const priceCondition = JSON.parse(currRecord.GetVars().GetValue_String("ITEMNUMBER__.PRICECONDITIONDATA__", 0));
                ret = Math.max(ret, priceCondition.thresholds.length);
                ++nbItem;
            }
            Log.Info(`${nbItem} items, ${ret} max price condition`);
            return ret;
        }
    }
    ValidationScript.CatalogExporterConfigVendorItem = CatalogExporterConfigVendorItem;
    class CatalogExporterConfigWarehouseItem extends CatalogExporterConfig {
        ParseValue(attribute, rawValue) {
            if (attribute === "STOCKTAKINGDATETIME__") {
                const parsedDate = CatalogHelper.ParseDateOrElse(rawValue, null);
                if (parsedDate) {
                    const culture = Variable.GetValueAsString("DocumentCulture") || "en-US";
                    return Sys.Helpers.Date.ToLocaleDateEx(parsedDate, culture);
                }
            }
            return (rawValue === null || rawValue === void 0 ? void 0 : rawValue.toString()) || "";
        }
        BuildProviderCSVLine(itemProperties) {
            const warehouseItemCSV = this.itemPropertiesClass.CSVLineAttributes
                .map(attribute => this.ParseValue(attribute, itemProperties.rawData[attribute]));
            return warehouseItemCSV;
        }
        constructor(warehouseid) {
            super();
            this.itemPropertiesClass = CatalogHelper.WarehouseItemProperties;
            this.attributeProperties = [
                "Warehouse" /* CatalogHelper.AttributeProperty.Warehouse */,
                "WarehouseCSVIntegration" /* CatalogHelper.AttributeProperty.WarehouseCSVIntegration */
            ];
            this.attributeLevel = "warehouse";
            // must match EXTRACTED_DATA_TO_CSV_MAPPING Lib_Purchasing_Catalog_Management
            this.attributesMapping = {
                "ITEMNUMBER__": "Item number",
                "DESCRIPTION__": "Description",
                "ITEMNUMBER__.WAREHOUSENUMBER__": "Warehouse ID",
                "ITEMNUMBER__.CURRENTSTOCK__": "Current stock",
                "ITEMNUMBER__.RESERVEDSTOCK__": "Reserved stock",
                "ITEMNUMBER__.AVAILABLESTOCK__": "Available stock",
                "ITEMNUMBER__.INCOMINGSTOCK__": "Incoming stock",
                "ITEMNUMBER__.MINIMUMTHRESHOLD__": "Reorder point",
                "ITEMNUMBER__.EXPECTEDSTOCKLEVEL__": "Target stock level",
                "ITEMNUMBER__.STOCKTAKINGDATETIME__": "Stocktaking datetime",
                "ITEMNUMBER__.LEADTIME__": "Lead time",
                "ITEMNUMBER__.UNITPRICE__": "Unit price",
                "ITEMNUMBER__.CURRENCY__": "Currency",
                "SUPPLYTYPEID__.NAME__": "Supply type name",
                "SUPPLYTYPEID__.FULLNAME__": "Supply type full path"
            };
            this.warehouseid = warehouseid;
        }
        GetAttributesToQuery() {
            return [
                "RUIDEX", // For CatalogItem constructor
                ...this.GetFullLineAttributes()
            ];
        }
        GetCatalogQueryFilter() {
            return Sys.Helpers.LdapUtil.FilterEqual("ITEMNUMBER__.WAREHOUSENUMBER__", this.warehouseid);
        }
        GetCSVFileName(date) {
            return `Export_Items_${this.warehouseid}_${Sys.Helpers.Date.Format(date, "_yyyy-mm-dd_HH-MM-ss")}`;
        }
    }
    ValidationScript.CatalogExporterConfigWarehouseItem = CatalogExporterConfigWarehouseItem;
    if (typeof _ENV_TEST_ENABLED === "undefined") {
        const warehouseid = Variable.GetValueAsString("WAREHOUSEID");
        const main = warehouseid
            ? new CatalogExporterServer(new CatalogExporterConfigWarehouseItem(warehouseid))
            : new CatalogExporterServer(new CatalogExporterConfigVendorItem());
        main.Start();
    }
})(ValidationScript || (ValidationScript = {}));
//# sourceMappingURL=validationscript.js.map