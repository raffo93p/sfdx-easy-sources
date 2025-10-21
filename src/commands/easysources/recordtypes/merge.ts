/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
const fs = require('fs-extra');
import { join } from "path";
import Performance from '../../../utils/performance';

import {
    DEFAULT_ESCSV_PATH,
    DEFAULT_SFXML_PATH,
    XML_PART_EXTENSION
} from "../../../utils/constants/constants";

import {
    RECORDTYPES_EXTENSION,
    RECORDTYPES_ROOT_TAG,
    RECORDTYPES_SUBPATH,
    RECORDTYPE_ITEMS
} from "../../../utils/constants/constants_recordtypes";

import { writeXmlToFile, readCsvToJsonArray, readXmlFromFile, calcCsvFilename } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"
import { transformCSVtoXML } from '../../../utils/utils_recordtypes';
import { loadSettings } from '../../../utils/localSettings';

const settings = loadSettings();


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_merge');

export default class Merge extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        "sf-xml": flags.string({
            char: 'x',
            description: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
        "es-csv": flags.string({
            char: 'c',
            description: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        object: flags.string({
            char: 's',
            description: messages.getMessage('objectFlagDescription'),
        }),
        recordtype: flags.string({
            char: 'r',
            description: messages.getMessage('recordtypeFlagDescription'),
        }),
        sort: flags.enum({
            char: 'S',
            description: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };

    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        const result = await recordTypeMerge(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for API usage
export async function recordTypeMerge(options: any = {}): Promise<AnyJson> {
    Performance.getInstance().start();

    const baseInputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const baseOutputDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), RECORDTYPES_SUBPATH) as string;
    const inputObject = (options.object) as string;
    const inputRecordType = (options.recordtype) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return { outputString: 'ERROR: Input folder does not exist' };
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
            console.log('Merging: ' + join(obj, dir));

            const mergedXml = await mergeRecordTypeFromCsv(dir, join(baseInputDir, obj, 'recordTypes', dir), options);
            const outputDir = join(baseOutputDir, obj, 'recordTypes');
            const outputFile = join(outputDir, dir + RECORDTYPES_EXTENSION);
            
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            writeXmlToFile(outputFile, mergedXml);
        }
    }

    Performance.getInstance().end();
    return { outputString: 'OK' };
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

            if (flags.sort === 'true' || flags.sort === true || flags.sort === undefined) {
                jsonArray = sortByKey(jsonArray);
            }

            // Remove _tagid for merging
            for (var i in jsonArray) {
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