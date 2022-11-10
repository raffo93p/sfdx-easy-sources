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
import { readXmlFromFile, readCsvToJsonMap, jsonArrayToMap, sortByKey } from '../../../utils/filesUtils'
import { generateTagId } from '../../../utils/utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { PROFILE_ITEMS, PROFILES_EXTENSION } from '../../../utils/constants';
import Performance from '../../../utils/performance';


import { basename, join } from "path";
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

        const baseInputDir = (this.flags.input || './force-app/src/default/profiles') as string;
        const baseOutputDir = (this.flags.output || baseInputDir) as string;

        var fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(PROFILES_EXTENSION))
            .map(item => item.name)

        for (const filename of fileList) {
            console.log('Upserting: ' + filename);

            const inputFile = join(baseInputDir, filename);

            const profileProperties = (await readXmlFromFile(inputFile)).Profile ?? {};

            for (const item in PROFILE_ITEMS) {

                var jsonArrayNew = profileProperties[item];

                if (jsonArrayNew == undefined) continue;

                generateTagId(jsonArrayNew, item)

                const headers = PROFILE_ITEMS[item].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ headers, transforms });

                const profileName = getProfileName(inputFile);
                const outputDir = join(baseOutputDir, profileName);
                const outputFile = join(outputDir, item) + '.csv';

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                if (fs.existsSync(outputFile)) {
                    const csvFilePath = join(baseOutputDir, profileName, item + '.csv');

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

            }
        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}

function getProfileName(inputFile: string) {
    const fileName = basename(inputFile);
    let dotsCount = 0;
    for (let i = fileName.length - 1; i > 0; i--) {
        if (fileName[i] === ".") {
            dotsCount++;
        }
        if (dotsCount == 2) {
            return fileName.substring(0, i);
        }
    }
}