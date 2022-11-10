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
import Performance from '../../../utils/performance';

import {
    PROFILES_ROOT_TAG,
    XML_NAMESPACE,
    PROFILE_ITEMS,
    PROFILES_EXTENSION
} from "../../../utils/constants";

import { writeXmlToFile, readCsvToJsonArray, sortByKey } from "../../../utils/filesUtils"


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_merge');

export default class Merge extends SfdxCommand {
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

        const mergedXml = {
            [PROFILES_ROOT_TAG]: {
                $: {
                    xmlns: XML_NAMESPACE,
                },
            },
        };


        const baseInputDir = (this.flags.input || './force-app/src/default/profiles') as string;
        const baseOutputDir = (this.flags.output || baseInputDir) as string;

        var dirList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)

        if (!fs.existsSync(baseOutputDir)) {
            fs.mkdirSync(baseOutputDir);
        }

        // dir is the profile name without the extension
        for (const dir of dirList) {
            console.log('Merging: ' + dir);

            // key is each profile section (applicationVisibilities, classAccess ecc)
            for (const key in PROFILE_ITEMS) {
                const csvFilePath = join(baseInputDir, dir, key) + '.csv';
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath)

                    for(var i in jsonArray){
                        delete jsonArray[i]['_tagid']
                    }
                    mergedXml[PROFILES_ROOT_TAG][key] = sortByKey(jsonArray);
                }
            }

            const outputFile = join(baseOutputDir, dir + PROFILES_EXTENSION);

            writeXmlToFile(
                outputFile,
                mergedXml
            );

        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}