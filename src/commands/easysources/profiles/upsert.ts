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
const { Parser, transforms: { unwind } } = require('json2csv');
import { PROFILE_ITEMS, PROFILES_EXTENSION } from '../../../utils/constants';


import { basename, join } from "path";
const fs = require('fs-extra');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_split');

var startTime;
var endTime;

export default class Upsert extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        name: flags.string({
            char: 'n',
            description: messages.getMessage('nameFlagDescription'),
        }),
        force: flags.boolean({
            char: 'f',
            description: messages.getMessage('forceFlagDescription'),
        }),
    };


    public async run(): Promise<AnyJson> {
        start();


        const basePath = './assets';
        var fileList = fs.readdirSync(basePath, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(PROFILES_EXTENSION))
            .map(item => item.name)

        for (const filename of fileList) {
            console.log('Upserting: ' + filename);

            const inputFile = join(basePath, filename);

            const profileProperties = (await readXmlFromFile(inputFile)).Profile ?? {};

            for (const item in PROFILE_ITEMS) {

                var jsonArrayNew = profileProperties[item];

                if (jsonArrayNew == undefined) continue;

                const headers = PROFILE_ITEMS[item].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ headers, transforms });

                const baseOutputDir = getBaseDir(inputFile);
                const profileName = getProfileName(inputFile);
                const outputDir = join(baseOutputDir, profileName);
                const outputFile = join(outputDir, item) + '.csv';

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                if (fs.existsSync(outputFile)) {
                    const csvFilePath = './assets/Admin/' + item + '.csv';

                    var jsonMapOld = await readCsvToJsonMap(csvFilePath, PROFILE_ITEMS[item]['key']);
                    var jsonMapNew = jsonArrayToMap(jsonArrayNew, PROFILE_ITEMS[item]['key'])

                    for (var k in jsonMapNew) {
                        jsonMapOld[k] = jsonMapNew[k];
                    }
                    jsonArrayNew = Object.values(jsonMapOld);

                }

                try {
                    jsonArrayNew = sortByKey(jsonArrayNew, PROFILE_ITEMS[item]['key']);
                    const csv = parser.parse(jsonArrayNew);
                    fs.writeFileSync(outputFile, csv, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                }

            }
        }

        end();

        var outputString = 'OK'
        return { outputString };
    }
}

function start() {
    startTime = performance.now();
};

function end() {
    endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms 

    console.log('Elaboration completed in ' + timeDiff + " ms");
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

function getBaseDir(path: string) {
    return path.substring(0, path.lastIndexOf('/'));
}