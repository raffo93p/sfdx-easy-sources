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
import { OBJTRANSL_CFIELDTRANSL_ROOT, OBJTRANSL_CFIELDTRANSL_ROOT_TAG, OBJTRANSL_EXTENSION, OBJTRANSL_FIELDTRANSL_EXTENSION, OBJTRANSL_ITEMS, OBJTRANSL_LAYOUT_ROOT, OBJTRANSL_ROOT_TAG, OBJTRANSL_SUBPATH } from '../../../utils/constants/constants_objecttranslations';
import { loadSettings } from '../../../utils/localSettings';
import { join } from "path";
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArrayWithNulls, readXmlFromFile, writeXmlToFile } from '../../../utils/filesUtils';
import { sortByKey } from '../../../utils/utils';
import { getFieldTranslationFiles, removeEmpyOptionalTags, transformFieldCSVtoXMLs } from '../../../utils/utils_objtransl';
import { flatToArray } from '../../../utils/flatArrayUtils';

const fs = require('fs-extra');


const settings = loadSettings();


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_merge');

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

        const baseInputDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
        const baseOutputDir = join((this.flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), OBJTRANSL_SUBPATH) as string;
        const inputObject = (this.flags.input) as string;

        checkDirOrErrorSync(baseInputDir);

        var objectList = [];
        if (inputObject) {
            objectList = inputObject.split(',');
        } else {
            objectList = fs.readdirSync(baseInputDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }

        for (const obj of objectList) {
            if (!fs.existsSync(join(baseInputDir, obj, 'csv'))) continue;
            const inputXML = join(baseInputDir, obj, 'csv', obj) + XML_PART_EXTENSION;

            if(!fs.existsSync(inputXML)){
                console.log('Skipping  ' + obj +'; File ' + inputXML + ' does not exist!');
                continue;
            }

            console.log('Merging: ' + obj);


            const mergedXml = (await readXmlFromFile(inputXML)) ?? {};
            const outputDir = join(baseOutputDir, obj);

            for (const tag_section in OBJTRANSL_ITEMS) {
                if(tag_section === OBJTRANSL_CFIELDTRANSL_ROOT) continue;
                const csvFilePath = join(baseInputDir, obj, 'csv', calcCsvFilename(obj, tag_section));
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArrayWithNulls(csvFilePath)

                    if (this.flags.sort === 'true') {
                        jsonArray = sortByKey(jsonArray);
                    }

                    for (var i in jsonArray) {
                        delete jsonArray[i]['_tagid']
                    }

                    if(jsonArray.length == 0){
                        delete mergedXml[OBJTRANSL_ROOT_TAG][tag_section];
                        continue;
                    }

                    // pre-process for empty optional tags
                    removeEmpyOptionalTags(jsonArray, tag_section);

                    // pre-process for layout flatToArray
                    if(tag_section === OBJTRANSL_LAYOUT_ROOT){
                        jsonArray = flatToArray(jsonArray);
                        // jsonArray = transformLayoutCSVtoXML(jsonArray);
                    }

                    mergedXml[OBJTRANSL_ROOT_TAG][tag_section] = jsonArray;
                }

            }
            const outputFile = join(outputDir, obj + OBJTRANSL_EXTENSION);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }
            await writeXmlToFile(outputFile, mergedXml);

            
            // only for ObjectTranslations, recreate all the fieldTranslation xml files
            const csvFilePath = join(baseInputDir, obj, 'csv', calcCsvFilename(obj, OBJTRANSL_CFIELDTRANSL_ROOT));
            if (fs.existsSync(csvFilePath)) {
                var jsonArray = await readCsvToJsonArrayWithNulls(csvFilePath);

                const fieldXmlArray = transformFieldCSVtoXMLs(jsonArray);

                deleteFieldTranslationsXmls(baseOutputDir, obj);

                for(const entry of fieldXmlArray){
                     await writeXmlToFile(join(baseOutputDir, obj, entry.name + OBJTRANSL_FIELDTRANSL_EXTENSION), 
                     {[OBJTRANSL_CFIELDTRANSL_ROOT_TAG]: entry}
                     );

                }
            }
            
        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };

    }
}

export function deleteFieldTranslationsXmls(baseInputDir, objTrName){
    var fieldTrFiles = getFieldTranslationFiles(join(baseInputDir, objTrName));

    for(const fieldTrFile of fieldTrFiles){
        const filePath = join(baseInputDir, objTrName, fieldTrFile);
        fs.rmSync(filePath, {
            force: true,
        });
    }

}
