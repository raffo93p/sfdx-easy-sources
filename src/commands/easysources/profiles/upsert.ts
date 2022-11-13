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
import { sortByKey, generateTagId } from "../../../utils/utils"

const { Parser, transforms: { unwind } } = require('json2csv');
import { PROFILE_ITEMS, PROFILES_EXTENSION, PROFILES_ROOT_TAG } from '../../../utils/constants_profiles';
import Performance from '../../../utils/performance';


import { join } from "path";
import { CSV_EXTENSION, XML_PART_EXTENSION } from '../../../utils/constants';
import { PROFILES_DEFAULT_PATH } from '../../../utils/constants_profiles';
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
        dir: flags.string({
            char: 'd',
            description: messages.getMessage('dirFlagDescription', [PROFILES_DEFAULT_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription', [PROFILES_DEFAULT_PATH]),
        })
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        const baseInputDir = (this.flags.dir || PROFILES_DEFAULT_PATH) as string;
        const baseOutputDir = (this.flags.output || baseInputDir) as string;
        const inputProfile = (this.flags.input) as string;

        var fileList = []
        if (inputProfile) {
            fileList = inputProfile.split(',');
        } else {
            fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
                .filter(item => !item.isDirectory() && item.name.endsWith(PROFILES_EXTENSION))
                .map(item => item.name)
        }

        for (const filename of fileList) {
            console.log('Upserting: ' + filename);

            const inputFile = join(baseInputDir, filename);

            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const profileProperties = xmlFileContent[PROFILES_ROOT_TAG] ?? {};

            const profileName = removeExtension(filename);
            const outputDir = join(baseOutputDir, profileName);

            for (const tag_section in PROFILE_ITEMS) {

                var jsonArrayNew = profileProperties[tag_section];
                if (jsonArrayNew == undefined) continue;

                generateTagId(jsonArrayNew, PROFILE_ITEMS[tag_section].key, PROFILE_ITEMS[tag_section].headers)

                const headers = PROFILE_ITEMS[tag_section].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ headers, transforms });


                const outputFile = join(outputDir, tag_section) + CSV_EXTENSION;

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                if (fs.existsSync(outputFile)) {
                    const csvFilePath = join(baseOutputDir, profileName, tag_section + CSV_EXTENSION);

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
                xmlFileContent[PROFILES_ROOT_TAG][tag_section] = null;


            }

            const inputFilePart = join(baseInputDir, profileName, profileName + XML_PART_EXTENSION);
            if (fs.existsSync(inputFilePart)) {
                const xmlFileContentPart = (await readXmlFromFile(inputFilePart)) ?? {};
                const profilePropertiesPart = xmlFileContentPart[PROFILES_ROOT_TAG] ?? {};

                for (var k in profileProperties) {
                    profilePropertiesPart[k] = profileProperties[k];
                }

                writeXmlToFile(inputFilePart, profilePropertiesPart);
            } else {
                writeXmlToFile(inputFilePart, profileProperties);
            }
        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}