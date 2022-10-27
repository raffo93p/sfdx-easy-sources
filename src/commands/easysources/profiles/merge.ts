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
const fs = require('fs-extra');
import { join } from "path";

import {
    PROFILES_ROOT_TAG,
    XML_NAMESPACE,
    PROFILE_ITEMS,
    PROFILES_EXTENSION
} from "../../../utils/constants";

import { writeXmlToFile, readCsvToJsonArray } from "../../../utils/filesUtils"





// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_split');

var startTime;
var endTime;

export default class Merge extends SfdxCommand {
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

        const mergedXml = {
            [PROFILES_ROOT_TAG]: {
                $: {
                    xmlns: XML_NAMESPACE,
                },
            },
        };

        const basePath = './assets';
        var dirList = fs.readdirSync(basePath, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)

        for (const dir of dirList) {
            console.log('Merging: ' + dir);

            for (const key in PROFILE_ITEMS) {
                const csvFilePath = join(basePath, dir, key) + '.csv';
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath)
                    mergedXml[PROFILES_ROOT_TAG][key] = jsonArray;
                }

            }

            const outputFile = join(basePath, dir, dir) + PROFILES_EXTENSION;

            writeXmlToFile(
                outputFile,
                mergedXml
            );


        }



        end()

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