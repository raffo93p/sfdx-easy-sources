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
import Performance from '../../../utils/performance';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../../../utils/constants/constants';
import { OBJTRANSL_CFIELDTRANSL_ROOT, OBJTRANSL_CFIELDTRANSL_ROOT_TAG, OBJTRANSL_EXTENSION, OBJTRANSL_ITEMS, OBJTRANSL_LAYOUT_ROOT, OBJTRANSL_ROOT_TAG, OBJTRANSL_SUBPATH } from '../../../utils/constants/constants_objecttranslations';
import { loadSettings } from '../../../utils/localSettings';
import { join } from "path";
import { calcCsvFilename, checkDirOrErrorSync, readXmlFromFile, writeXmlToFile } from '../../../utils/filesUtils';
import { generateTagId, sortByKey } from '../../../utils/utils';
import {  getFieldTranslationFiles, transformFieldXMLtoCSV, transformLayoutXMLtoCSV } from '../../../utils/utils_objtransl';
import CsvWriter from '../../../utils/csvWriter';
import { sortObjectKeys } from '../../../utils/commands/utils';
const fs = require('fs-extra');


const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_split');

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

        const result = await objectTranslationSplit(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for programmatic API
export async function objectTranslationSplit(options: any = {}): Promise<AnyJson> {
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
        const inputFile = join(baseInputDir, objTrName, objTrName + OBJTRANSL_EXTENSION);

        if (!fs.existsSync(inputFile)) {
            console.log('Skipping  ' + objTrName +'; File ' + inputFile + ' does not exist!');
            continue;
        }

        console.log('Splitting: ' + objTrName);


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
                
                for(const fieldTrFilename of fieldTrList){
                    const fieldTrPath = join(baseInputDir, objTrName, fieldTrFilename);
                    const xmlFileContent = (await readXmlFromFile(fieldTrPath)) ?? {};
                    const fieldTr = xmlFileContent[OBJTRANSL_CFIELDTRANSL_ROOT_TAG] ?? {};
                    myjson.push(...transformFieldXMLtoCSV(fieldTr));
                }
            }


            // generate _tagId column
            generateTagId(myjson, OBJTRANSL_ITEMS[tag_section].key, OBJTRANSL_ITEMS[tag_section].headers);
            if (options.sort === 'true') {
                myjson = sortByKey(myjson);
            }

            const headers = OBJTRANSL_ITEMS[tag_section].headers;
            const outputFileCSV = join(outputDir, calcCsvFilename(objTrName, tag_section));

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            try {
                const csvContent = await csvWriter.toCsv(myjson, headers);
                fs.writeFileSync(outputFileCSV, csvContent, { flag: 'w+' });
                // file written successfully
            } catch (err) {
                console.error(err);
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
        
    }

    
    return { outputString: 'OK' };
}