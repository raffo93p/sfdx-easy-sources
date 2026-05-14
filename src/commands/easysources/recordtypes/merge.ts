/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import { join } from "path";
import Performance from '../../../utils/performance.js';

import {
    DEFAULT_ESCSV_PATH,
    DEFAULT_SFXML_PATH,
    XML_PART_EXTENSION
} from "../../../utils/constants/constants.js";

import {
    RECORDTYPES_EXTENSION,
    RECORDTYPES_ROOT_TAG,
    RECORDTYPES_SUBPATH,
    RECORDTYPE_ITEMS
} from "../../../utils/constants/constants_recordtypes.js";

import { writeXmlToFile, readCsvToJsonArray, readXmlFromFile, calcCsvFilename } from "../../../utils/filesUtils.js"
import { sortByKey } from "../../../utils/utils.js"
import { transformCSVtoXML } from '../../../utils/utils_recordtypes.js';
import { loadSettings } from '../../../utils/localSettings.js';
import { jsonAndPrintError } from '../../../utils/commands/utils.js';

const settings = loadSettings();


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_merge');

export default class Merge extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);

    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
        "sf-xml": Flags.string({
            char: 'x',
            summary: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
        "es-csv": Flags.string({
            char: 'c',
            summary: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        object: Flags.string({
            char: 's',
            summary: messages.getMessage('objectFlagDescription'),
        }),
        recordtype: Flags.string({
            char: 'r',
            summary: messages.getMessage('recordtypeFlagDescription'),
        }),
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(Merge);
        Performance.getInstance().start();

        const result = await recordTypeMerge(flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for API usage
export async function recordTypeMerge(options: any = {}): Promise<any> {

    const baseInputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const baseOutputDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), RECORDTYPES_SUBPATH) as string;
    const inputObject = (options.object) as string;
    const inputRecordType = (options.recordtype) as string;

    // Initialize result object
    const result = { result: 'OK', items: {} };


    if (!fs.existsSync(baseInputDir)) {
        return jsonAndPrintError('Input folder ' + baseInputDir + ' does not exist!');
    }

    var objectList = [];
    if (inputObject) {
        objectList = inputObject.split(',');
    } else {
        objectList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    for (const obj of objectList) {
        if (!fs.existsSync(join(baseInputDir, obj, 'recordTypes'))) continue;

        var recordTypeList = [];

        if (inputRecordType) {
            recordTypeList = inputRecordType.split(',');
        } else {
            recordTypeList = fs.readdirSync(join(baseInputDir, obj, 'recordTypes'), { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }

        for (const dir of recordTypeList) {
            const fileKey = `${obj}/${dir}`;
            
            console.log('Merging: ' + join(obj, dir));

            try {
                const mergedXml = await mergeRecordTypeFromCsv(dir, join(baseInputDir, obj, 'recordTypes', dir), options);
                const outputDir = join(baseOutputDir, obj, 'recordTypes');
                const outputFile = join(outputDir, dir + RECORDTYPES_EXTENSION);
                
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                writeXmlToFile(outputFile, mergedXml);

                // Record type processed successfully
                result.items[fileKey] = { result: 'OK' };

            } catch (error) {
                // Record type processing failed
                console.error(`Error merging record type ${dir}:`, error);
                result.items[fileKey] = { 
                    result: 'KO', 
                    error: error.message || 'Unknown error occurred'
                };
            }
        }
    }

    return result;
}

/**
 * Core merge logic for record types that creates merged XML from CSV files in memory
 * @param recordTypeName - name of the record type to merge
 * @param csvDirPath - path to the CSV directory containing the record type CSV files
 * @param flags - command flags including sort option
 * @returns merged XML object
 */
export async function mergeRecordTypeFromCsv(recordTypeName: string, csvDirPath: string, flags: any): Promise<any> {
    const inputXML = join(csvDirPath, recordTypeName) + XML_PART_EXTENSION;
    
    if (!fs.existsSync(inputXML)) {
        throw new Error(`${inputXML} not found`);
    }

    const mergedXml = (await readXmlFromFile(inputXML)) ?? {};

    // Process each section
    for (const tag_section in RECORDTYPE_ITEMS) {
        const csvFilePath = join(csvDirPath, calcCsvFilename(recordTypeName, tag_section));
        if (fs.existsSync(csvFilePath)) {
            var jsonArray = await readCsvToJsonArray(csvFilePath);

            if (flags.sort !== 'false') {
                jsonArray = sortByKey(jsonArray);
            }

            // Remove _tagid for merging
            for (const i in jsonArray) {
                delete jsonArray[i]['_tagid'];
            }

            var jsonArrayForXML = transformCSVtoXML(jsonArray);
            
            if (jsonArrayForXML && jsonArrayForXML.length > 0) {
                mergedXml[RECORDTYPES_ROOT_TAG][tag_section] = jsonArrayForXML;
            }
        } else {
            // Remove section if CSV doesn't exist
            delete mergedXml[RECORDTYPES_ROOT_TAG][tag_section];
        }
    }

    return mergedXml;
}