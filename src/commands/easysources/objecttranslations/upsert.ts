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
import { readXmlFromFile, readCsvToJsonMap, jsonArrayCsvToMap, writeXmlToFile, calcCsvFilename, checkDirOrErrorSync, checkDirOrCreateSync } from '../../../utils/filesUtils'
import { generateTagId, sortByKey } from '../../../utils/utils'
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../../../utils/constants/constants';
import Performance from '../../../utils/performance';
import { join } from "path";
import { loadSettings } from '../../../utils/localSettings';
import { OBJTRANSL_CFIELDTRANSL_ROOT, OBJTRANSL_CFIELDTRANSL_ROOT_TAG, OBJTRANSL_EXTENSION, OBJTRANSL_ITEMS, OBJTRANSL_LAYOUT_ROOT, OBJTRANSL_ROOT_TAG, OBJTRANSL_SUBPATH } from '../../../utils/constants/constants_objecttranslations';
import { getFieldTranslationFiles, transformFieldXMLtoCSV, transformLayoutXMLtoCSV } from '../../../utils/utils_objtransl';
import { executeCommand } from '../../../utils/commands/utils';
import CsvWriter from '../../../utils/csvWriter';
const fs = require('fs-extra');

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_upsert');

export default class Upsert extends SfdxCommand {
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
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
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

        const result = await objectTranslationUpsert(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export object translation-specific upsert function for programmatic API
export async function objectTranslationUpsert(options: any = {}): Promise<{ outputString: string }> {
    const csvWriter = new CsvWriter();

    const baseInputDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), OBJTRANSL_SUBPATH) as string;
    const baseOutputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
    const inputObject = (options.input) as string;

    checkDirOrErrorSync(baseInputDir);

    var objectTList = [];
    if (inputObject) {
        objectTList = inputObject.split(',');
    } else {
        objectTList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    for (const objTrName of objectTList) {
        // if (!fs.existsSync(join(baseInputDir, objTrName, objTrName))) continue;
        const fullFilename = objTrName.endsWith(OBJTRANSL_EXTENSION) ? objTrName : objTrName + OBJTRANSL_EXTENSION;
        const inputFile = join(baseInputDir, objTrName, fullFilename);

        if (!fs.existsSync(inputFile)) {
            console.log('Skipping  ' + objTrName +'; File ' + inputFile + ' does not exist!');
            continue;
        }

        console.log('Upserting: ' + objTrName);

        const outputDir = join(baseOutputDir, objTrName, 'csv');
        const inputFilePart = join(baseOutputDir, objTrName, 'csv', objTrName + XML_PART_EXTENSION);

        // If outputDir or inputFilePart doesn't exist, run split command instead
        if (!fs.existsSync(outputDir) || !fs.existsSync(inputFilePart)) {
            console.log('⚠️ Output csv directory or -part.xml file not found. Running split command for: ' + objTrName);
            // Create flags for split command with just the current object
            const splitFlags = {
                ...options,
                input: objTrName
            };
            await executeCommand(splitFlags, 'split', 'objecttranslations');
            continue;
        }

        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const objTranslProperties = xmlFileContent[OBJTRANSL_ROOT_TAG] ?? {};

        for (const tag_section in OBJTRANSL_ITEMS) {

            var myjson = objTranslProperties[tag_section];

            // skip when tag is not found in the xml
            if ((myjson == undefined || myjson == '') && tag_section !== OBJTRANSL_CFIELDTRANSL_ROOT) continue;
            // fixes scenarios when the tag is one, since it would be read as object and not array
            if (!Array.isArray(myjson)) myjson = [myjson];

            if(tag_section === OBJTRANSL_LAYOUT_ROOT){
                myjson = transformLayoutXMLtoCSV(myjson);
            }

            if(tag_section === OBJTRANSL_CFIELDTRANSL_ROOT){
                myjson = [];

                var fieldTrList = getFieldTranslationFiles(join(baseInputDir, objTrName));

                for(const fieldTrFilename of fieldTrList){
                    const fieldTrPath = join(baseInputDir, objTrName, fieldTrFilename);
                    const xmlFileContent = (await readXmlFromFile(fieldTrPath)) ?? {};
                    const fieldTr = xmlFileContent[OBJTRANSL_CFIELDTRANSL_ROOT_TAG] ?? {};
                    myjson.push(...transformFieldXMLtoCSV(fieldTr));
                }
            }

            generateTagId(myjson, OBJTRANSL_ITEMS[tag_section].key, OBJTRANSL_ITEMS[tag_section].headers)

            const headers = OBJTRANSL_ITEMS[tag_section].headers;
            const outputFile = join(outputDir, calcCsvFilename(objTrName, tag_section));

            checkDirOrCreateSync(outputDir);

            if (fs.existsSync(outputFile)) {
                const csvFilePath = join(baseOutputDir, objTrName,  'csv', calcCsvFilename(objTrName, tag_section));

                var jsonMapOld = await readCsvToJsonMap(csvFilePath);
                var jsonMapNew = jsonArrayCsvToMap(myjson)

                jsonMapNew.forEach((value, key) => {
                    jsonMapOld.set(key as string, value)
                });

                myjson = Array.from(jsonMapOld.values());
            }

            if (options.sort === 'true') {
                myjson = sortByKey(myjson);
            }

            try {
                const csvContent = await csvWriter.toCsv(myjson, headers);
                fs.writeFileSync(outputFile, csvContent, { flag: 'w+' });
                // file written successfully
            } catch (err) {
                console.error(err);
            }

            // writes the empty tag on the part file
            // avoid writing for fieldTranslations, since they are separated files
            if(tag_section !== OBJTRANSL_CFIELDTRANSL_ROOT) xmlFileContent[OBJTRANSL_ROOT_TAG][tag_section] = null;
        }

        if (fs.existsSync(inputFilePart)) {
            const xmlFileContentPart = (await readXmlFromFile(inputFilePart)) ?? {};
            const objTranslPropertiesPart = xmlFileContentPart[OBJTRANSL_ROOT_TAG] ?? {};

            for (var k in objTranslProperties) {
                objTranslPropertiesPart[k] = objTranslProperties[k];
            }

            writeXmlToFile(inputFilePart, xmlFileContentPart);
        } else {
            if (fs.existsSync(join(baseInputDir, objTrName, objTrName))) {
                writeXmlToFile(inputFilePart, objTranslProperties);
            }
        }
    }

    return { outputString: 'OK' };
}