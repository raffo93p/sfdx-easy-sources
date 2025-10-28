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
import { calcCsvFilename, readXmlFromFile, removeExtension, writeXmlToFile } from '../../../utils/filesUtils'
import { RECORDTYPES_EXTENSION, RECORDTYPES_PICKVAL_ROOT, RECORDTYPES_ROOT_TAG, RECORDTYPES_SUBPATH, RECORDTYPE_ITEMS } from '../../../utils/constants/constants_recordtypes';
import Performance from '../../../utils/performance';
import { join } from "path";
import { generateTagId, sortByKey } from '../../../utils/utils';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../../../utils/constants/constants';
import { transformXMLtoCSV } from '../../../utils/utils_recordtypes';
import { loadSettings } from '../../../utils/localSettings';
import CsvWriter, { CsvEngine } from '../../../utils/csvWriter';
const fs = require('fs-extra');

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_split');

export default class Split extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

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

        const result = await recordTypeSplit(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for programmatic API
export async function recordTypeSplit(options: any = {}): Promise<AnyJson> {
    const engine = settings['csv-engine'] === 'json2csv' ? CsvEngine.JSON2CSV : CsvEngine.FAST_CSV;
    
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
        if (!fs.existsSync(join(baseInputDir, obj, 'recordTypes'))) continue;

        var recordTypeList = [];

        if (inputRecordType) {
            recordTypeList = inputRecordType.split(',');
        } else {
            recordTypeList = fs.readdirSync(join(baseInputDir, obj, 'recordTypes'), { withFileTypes: true })
                .filter(item => !item.isDirectory() && item.name.endsWith(RECORDTYPES_EXTENSION))
                .map(item => item.name)
        }

        for (const filename of recordTypeList) {
            const fullFilename = filename.endsWith(RECORDTYPES_EXTENSION) ? filename : filename + RECORDTYPES_EXTENSION;
            console.log('Splitting: ' + join(obj, fullFilename));

            const inputFile = join(baseInputDir, obj, 'recordTypes', fullFilename);
            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const recordtypeProperties = xmlFileContent[RECORDTYPES_ROOT_TAG] ?? {};

            const recordTypeName = removeExtension(fullFilename);
            const outputDir = join(baseOutputDir, obj, 'recordTypes', recordTypeName);

                // Delete outputDir if it exists to ensure a clean split
            if (fs.existsSync(outputDir)) {
                fs.removeSync(outputDir);
            }

            for (const tag_section in RECORDTYPE_ITEMS) {
                var myjson = recordtypeProperties[RECORDTYPES_PICKVAL_ROOT];
                if (myjson == undefined) continue;
                if (!Array.isArray(myjson)) myjson = [myjson];

                var jsforcsv = transformXMLtoCSV(myjson);

                // generate _tagId column
                generateTagId(jsforcsv, RECORDTYPE_ITEMS[tag_section].key, RECORDTYPE_ITEMS[tag_section].headers);
                if (options.sort === 'true') {
                    jsforcsv = sortByKey(jsforcsv);
                }

                const headers = RECORDTYPE_ITEMS[tag_section].headers;
                const outputFileCSV = join(outputDir, calcCsvFilename(recordTypeName, tag_section));

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                try {
                    const csvContent = await new CsvWriter().toCsv(jsforcsv, headers, engine);
                    fs.writeFileSync(outputFileCSV, csvContent, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                }

                xmlFileContent[RECORDTYPES_ROOT_TAG][tag_section] = null;
            }
            
            if (fs.existsSync(outputDir)) {
                const outputFileXML = join(outputDir, recordTypeName + XML_PART_EXTENSION);
                writeXmlToFile(outputFileXML, xmlFileContent);
            }
        }
    }
    
    return { outputString: 'OK' };
}

