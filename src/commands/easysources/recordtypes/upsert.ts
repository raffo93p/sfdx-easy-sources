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
import { readXmlFromFile, readCsvToJsonMap, jsonArrayCsvToMap, removeExtension, writeXmlToFile, calcCsvFilename } from '../../../utils/filesUtils'
import { generateTagId, sortByKey } from '../../../utils/utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../../../utils/constants/constants';
import Performance from '../../../utils/performance';
import { join } from "path";
import { RECORDTYPES_EXTENSION, RECORDTYPES_ROOT_TAG, RECORDTYPES_SUBPATH, RECORDTYPE_ITEMS } from '../../../utils/constants/constants_recordtypes';
import { transformXMLtoCSV } from '../../../utils/utils_recordtypes';
import { loadSettings } from '../../../utils/localSettings';
import { executeCommand } from '../../../utils/commands/utils';
const fs = require('fs-extra');

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_upsert');

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

        const result = await recordTypeUpsert(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for programmatic API
export async function recordTypeUpsert(options: any = {}): Promise<AnyJson> {
    Performance.getInstance().start();

    const baseInputDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), RECORDTYPES_SUBPATH) as string;
    const baseOutputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const inputObject = (options.object) as string;
    const inputRecordType = (options.recordtype) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return;
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
        var recordTypeList = [];

        if (inputRecordType) {
            recordTypeList = inputRecordType.split(',');
        } else {
            if (!fs.existsSync(join(baseInputDir, obj, 'recordTypes'))) continue;

            recordTypeList = fs.readdirSync(join(baseInputDir, obj, 'recordTypes'), { withFileTypes: true })
                .filter(item => !item.isDirectory() && item.name.endsWith(RECORDTYPES_EXTENSION))
                .map(item => item.name)
        }

        for (const filename of recordTypeList) {
            const fullFilename = filename.endsWith(RECORDTYPES_EXTENSION) ? filename : filename + RECORDTYPES_EXTENSION;
            console.log('Upserting: ' + filename);

            const inputFile = join(baseInputDir, obj, 'recordTypes', fullFilename);
            const recordtypeName = removeExtension(fullFilename);

            const outputDir = join(baseOutputDir, obj, 'recordTypes', recordtypeName);
            const inputFilePart = join(baseOutputDir, obj, 'recordTypes', recordtypeName, recordtypeName + XML_PART_EXTENSION);

            if (!fs.existsSync(outputDir) || !fs.existsSync(inputFilePart)) {
                console.log('⚠️ Output csv directory or -part.xml file not found. Running split command for object: ' + obj + ', recordtype: ' + filename);
                const splitFlags = {
                    ...options,
                    object: obj,
                    recordtype: filename
                };
                await executeCommand(splitFlags, 'split', 'recordtypes');
                continue;
            }

            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const recordtypeProperties = xmlFileContent[RECORDTYPES_ROOT_TAG] ?? {};
            for (const tag_section in RECORDTYPE_ITEMS) {

                var jsonArray = recordtypeProperties[tag_section];
                if (jsonArray == undefined) continue;
                if (!Array.isArray(jsonArray)) jsonArray = [jsonArray];

                var jsonArrayNew = transformXMLtoCSV(jsonArray);

                generateTagId(jsonArrayNew, RECORDTYPE_ITEMS[tag_section].key, RECORDTYPE_ITEMS[tag_section].headers)

                const headers = RECORDTYPE_ITEMS[tag_section].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ fields: [...headers, '_tagid'], transforms });

                const outputFile = join(outputDir, calcCsvFilename(recordtypeName, tag_section));

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                if (fs.existsSync(outputFile)) {
                    const csvFilePath = join(baseOutputDir, obj, 'recordTypes', recordtypeName, calcCsvFilename(recordtypeName, tag_section));

                    var jsonMapOld = await readCsvToJsonMap(csvFilePath);
                    var jsonMapNew = jsonArrayCsvToMap(jsonArrayNew)

                    jsonMapNew.forEach((value, key) => {
                        jsonMapOld.set(key as string, value)
                    });

                    jsonArrayNew = Array.from(jsonMapOld.values());
                }

                if (options.sort === 'true') {
                    jsonArrayNew = sortByKey(jsonArrayNew);
                }

                try {
                    const csv = parser.parse(jsonArrayNew);
                    fs.writeFileSync(outputFile, csv, { flag: 'w+' });
                } catch (err) {
                    console.error(err);
                }
                xmlFileContent[RECORDTYPES_ROOT_TAG][tag_section] = null;
            }

            if (fs.existsSync(inputFilePart)) {
                const xmlFileContentPart = (await readXmlFromFile(inputFilePart)) ?? {};
                const recordtypePropertiesPart = xmlFileContentPart[RECORDTYPES_ROOT_TAG] ?? {};

                for (var k in recordtypeProperties) {
                    recordtypePropertiesPart[k] = recordtypeProperties[k];
                }

                writeXmlToFile(inputFilePart, xmlFileContentPart);
            } else {
                if (fs.existsSync(join(baseInputDir, obj, 'recordTypes', recordtypeName))) {
                    writeXmlToFile(inputFilePart, recordtypeProperties);
                }
            }
        }
    }
    
    Performance.getInstance().end();

    var outputString = 'OK'
    return { outputString };
}