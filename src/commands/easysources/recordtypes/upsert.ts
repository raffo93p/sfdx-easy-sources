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
import { readXmlFromFile, readCsvToJsonMap, jsonArrayToMap, removeExtension, writeXmlToFile } from '../../../utils/filesUtils'
import { generateTagId, sortByKey } from '../../../utils/utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { CSV_EXTENSION, XML_PART_EXTENSION } from '../../../utils/constants';
import Performance from '../../../utils/performance';


import { join } from "path";
import { RECORDTYPES_EXTENSION, RECORDTYPES_ROOT_TAG, RECORDTYPE_ITEMS } from '../../../utils/constants_recordtypes';
import { transformXMLtoCSV } from '../../../utils/utils_recordtypes';
const fs = require('fs-extra');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_upsert');

export default class Upsert extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription'),
        })
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        const baseInputDir = (this.flags.input || './force-app/src/default/objects') as string;
        const baseOutputDir = (this.flags.output || baseInputDir) as string;

        var fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(RECORDTYPES_EXTENSION))
            .map(item => item.name)

        for (const filename of fileList) {
            console.log('Upserting: ' + filename);

            const inputFile = join(baseInputDir, filename);

            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const recordtypeProperties = xmlFileContent[RECORDTYPES_ROOT_TAG] ?? {};

            const recordtypeName = removeExtension(inputFile);
            const outputDir = join(baseOutputDir, recordtypeName);

            for (const tag_section in RECORDTYPE_ITEMS) {

                var jsonArray = recordtypeProperties[tag_section];
                if (jsonArray == undefined) continue;

                var jsonArrayNew = transformXMLtoCSV(jsonArray);


                generateTagId(jsonArrayNew, RECORDTYPE_ITEMS[tag_section].key, RECORDTYPE_ITEMS[tag_section].headers)


                const headers = RECORDTYPE_ITEMS[tag_section].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ headers, transforms });


                const outputFile = join(outputDir, tag_section) + CSV_EXTENSION;

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                if (fs.existsSync(outputFile)) {
                    const csvFilePath = join(baseOutputDir, recordtypeName, tag_section + CSV_EXTENSION);

                    var jsonMapOld = await readCsvToJsonMap(csvFilePath);
                    var jsonMapNew = jsonArrayToMap(jsonArrayNew)

                    for (var k in jsonMapNew) {
                        jsonMapOld[k] = jsonMapNew[k];
                    }
                    jsonArrayNew = Object.values(jsonMapOld);

                }

                try {
                    jsonArrayNew = sortByKey(jsonArrayNew);
                    const csv = parser.parse(jsonArrayNew);
                    fs.writeFileSync(outputFile, csv, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                }
                xmlFileContent[RECORDTYPES_ROOT_TAG][tag_section] = null;

            }
            const inputFilePart = join(baseInputDir, recordtypeName, recordtypeName + XML_PART_EXTENSION);
            const xmlFileContentPart = (await readXmlFromFile(inputFilePart)) ?? {};
            const recordtypePropertiesPart = xmlFileContentPart[RECORDTYPES_ROOT_TAG] ?? {};
            
            for(var k in recordtypeProperties){
                console.log(k)
                recordtypePropertiesPart[k] = recordtypeProperties[k];
            }

            writeXmlToFile(inputFilePart, recordtypePropertiesPart); 
        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}