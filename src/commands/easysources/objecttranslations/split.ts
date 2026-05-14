/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import Performance from '../../../utils/performance.js';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../../../utils/constants/constants.js';
import { OBJTRANSL_CFIELDTRANSL_ROOT, OBJTRANSL_CFIELDTRANSL_ROOT_TAG, OBJTRANSL_EXTENSION, OBJTRANSL_ITEMS, OBJTRANSL_LAYOUT_ROOT, OBJTRANSL_ROOT_TAG, OBJTRANSL_SUBPATH } from '../../../utils/constants/constants_objecttranslations.js';
import { loadSettings } from '../../../utils/localSettings.js';
import { join } from "path";
import { calcCsvFilename, checkDirOrErrorSync, readXmlFromFile, writeXmlToFile } from '../../../utils/filesUtils.js';
import { generateTagId, sortByKey } from '../../../utils/utils.js';
import {  getFieldTranslationFiles, transformFieldXMLtoCSV, transformLayoutXMLtoCSV } from '../../../utils/utils_objtransl.js';
import CsvWriter from '../../../utils/csvWriter.js';
import { jsonAndPrintError, sortObjectKeys } from '../../../utils/commands/utils.js';
import fs from 'fs-extra';


const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_split');

export default class Split extends SfCommand<unknown> {
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
        input: Flags.string({
            char: 'i',
            summary: messages.getMessage('inputFlagDescription'),
        }),
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };


    public async run(): Promise<unknown> {
        const { flags } = await this.parse(Split);
        Performance.getInstance().start();

        const result = await objectTranslationSplit(flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for programmatic API
export async function objectTranslationSplit(options: any = {}): Promise<any> {
    const csvWriter = new CsvWriter();

    const baseInputDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), OBJTRANSL_SUBPATH) as string;
    const baseOutputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;

    const inputObject = (options.input) as string;

    // Initialize result object
    const result = { result: 'OK', items: {} };


    try {
        checkDirOrErrorSync(baseInputDir);
    } catch (error) {
        return jsonAndPrintError(error.message);
    }

    var objectTList = [];
    if (inputObject) {
        objectTList = inputObject.split(',');
    } else {
        objectTList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    for (const objTrName of objectTList) {
        const inputFile = join(baseInputDir, objTrName, objTrName + OBJTRANSL_EXTENSION);

        if (!fs.existsSync(inputFile)) {
            console.log('Skipping  ' + objTrName +'; File ' + inputFile + ' does not exist!');
                result[objTrName] = { 
                    result: 'KO', 
                    error: `File ${inputFile} does not exist`
                };
            continue;
        }

        console.log('Splitting: ' + objTrName);

        try {
            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const objTranslProperties = xmlFileContent[OBJTRANSL_ROOT_TAG] ?? {};

            const outputDir = join(baseOutputDir, objTrName, 'csv');

            // Delete outputDir if it exists to ensure a clean split
            if (fs.existsSync(outputDir)) {
                fs.removeSync(outputDir);
            }

            for (const tag_section in OBJTRANSL_ITEMS) {
                var myjson = objTranslProperties[tag_section];

                // skip when tag is not found in the xml
                if (myjson == undefined && tag_section !== OBJTRANSL_CFIELDTRANSL_ROOT) continue;
                // fixes scenarios when the tag is one, since it would be read as object and not array
                if (!Array.isArray(myjson)) myjson = [myjson];

                if(tag_section === OBJTRANSL_LAYOUT_ROOT){
                    myjson = transformLayoutXMLtoCSV(myjson);
                }

                if(tag_section === OBJTRANSL_CFIELDTRANSL_ROOT){
                    myjson = [];

                    var fieldTrList = getFieldTranslationFiles(join(baseInputDir, objTrName));
                    if(fieldTrList.length === 0) continue;
                    
                    for(const fieldTrFilename of fieldTrList){
                        const fieldTrPath = join(baseInputDir, objTrName, fieldTrFilename);
                        const xmlFileContent = (await readXmlFromFile(fieldTrPath)) ?? {};
                        const fieldTr = xmlFileContent[OBJTRANSL_CFIELDTRANSL_ROOT_TAG] ?? {};
                        myjson.push(...transformFieldXMLtoCSV(fieldTr));
                    }
                }


                // generate _tagId column
                generateTagId(myjson, OBJTRANSL_ITEMS[tag_section].key, OBJTRANSL_ITEMS[tag_section].headers);
                if (options.sort !== 'false') {
                    myjson = sortByKey(myjson);
                }

                const headers = OBJTRANSL_ITEMS[tag_section].headers;
                const outputFile = join(outputDir, calcCsvFilename(objTrName, tag_section));

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                try {
                    const csvContent = await csvWriter.toCsv(myjson, headers);
                    fs.writeFileSync(outputFile, csvContent, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                    throw new Error(`Failed to write CSV file ${outputFile}: ${err.message}`);
                }

                // writes the empty tag on the part file
                // avoid writing for fieldTranslations, since they are separated files
                if(tag_section !== OBJTRANSL_CFIELDTRANSL_ROOT) xmlFileContent[OBJTRANSL_ROOT_TAG][tag_section] = null;

            }
            
            if (fs.existsSync(outputDir)) {
                const outputFileXML = join(outputDir, objTrName + XML_PART_EXTENSION);
                xmlFileContent[OBJTRANSL_ROOT_TAG] = sortObjectKeys(xmlFileContent[OBJTRANSL_ROOT_TAG]);
                writeXmlToFile(outputFileXML, xmlFileContent);
            }
    
            // Object processed successfully
            result.items[objTrName] = { result: 'OK' };

        } catch (error) {
            // Object processing failed
            console.error(`Error processing object ${objTrName}:`, error);
            result.items[objTrName] = { 
                result: 'KO', 
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    return result;
}
