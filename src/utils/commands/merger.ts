const fs = require('fs-extra');
import { join } from "path";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from "../constants/constants"
import { writeXmlToFile, readCsvToJsonArray, readXmlFromFile, calcCsvFilename } from "../filesUtils"
import { sortByKey } from "../utils"
import { loadSettings } from "../localSettings";
import { flatToArray } from "../flatArrayUtils";
import { jsonAndPrintError } from "./utils";

const settings = loadSettings();

/**
 * Core merge logic that creates merged XML from CSV files in memory
 * @param itemName - name of the item to merge
 * @param csvDirPath - path to the CSV directory
 * @param file_root_tag - root XML tag
 * @param file_items - configuration for file items
 * @param flags - command flags
 * @returns merged XML object
 */
export async function mergeItemFromCsv(itemName: string, csvDirPath: string, file_root_tag: string, file_items: any, flags: any): Promise<any> {
    const inputXML = join(csvDirPath, itemName) + XML_PART_EXTENSION;
    
    if (!fs.existsSync(inputXML)) {
        throw new Error(`${inputXML} not found`);
    }

    const mergedXml = (await readXmlFromFile(inputXML)) ?? {};

    // tag_section is each file section (applicationVisibilities, classAccess ecc)
    for (const tag_section in file_items) {
        const csvFilePath = join(csvDirPath, calcCsvFilename(itemName, tag_section));
        if (fs.existsSync(csvFilePath)) {
            var jsonArray = await readCsvToJsonArray(csvFilePath)

            if (flags.sort !== 'false') { // Default to true
                jsonArray = sortByKey(jsonArray);
            }

            for (var i in jsonArray) {
                delete jsonArray[i]['_tagid']
            }

            if(jsonArray.length == 0){
                delete mergedXml[file_root_tag][tag_section];
                continue;
            }

            jsonArray = flatToArray(jsonArray)
            mergedXml[file_root_tag][tag_section] = sortByKey(jsonArray);
        } else {
            delete mergedXml[file_root_tag][tag_section];
        }
    }

    return mergedXml;
}

export async function merge(flags, file_subpath, file_extension, file_root_tag, file_items) {
    const baseInputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const baseOutputDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] ||  DEFAULT_SFXML_PATH), file_subpath) as string;
    const inputProfile = (flags.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        return jsonAndPrintError(`Input folder ${baseInputDir} does not exist`);
    }

    // Initialize result object
    const result = { result: 'OK', items: {} };

    var dirList = [];
    if (inputProfile) {
        dirList = inputProfile.split(',');
    } else {
        dirList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }
    if (!fs.existsSync(baseOutputDir)) {
        fs.mkdirSync(baseOutputDir);
    }

    // dir is the file name without the extension
    for (const dir of dirList) {
        console.log('Merging: ' + dir);
        const csvDirPath = join(baseInputDir, dir);
        
        try {
            const mergedXml = await mergeItemFromCsv(dir, csvDirPath, file_root_tag, file_items, flags);
            const outputFile = join(baseOutputDir, dir + file_extension);
            writeXmlToFile(outputFile, mergedXml);
            
            // Directory processed successfully
            result.items[dir] = { result: 'OK' };
        } catch (error) {
            console.log(`Error merging ${dir}: ${error.message}. Skipping...`);
            result.items[dir] = { 
                result: 'KO', 
                error: error.message || 'Unknown error occurred'
            };
        }
    }
    
    return result;
}