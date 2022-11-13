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

import { CSV_EXTENSION, XML_PART_EXTENSION } from "../../../utils/constants"

import { writeXmlToFile, readCsvToJsonArray, readXmlFromFile } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"
import { APPLICATIONS_DEFAULT_PATH, APPLICATIONS_EXTENSION, APPLICATIONS_ROOT_TAG, APPLICATION_ITEMS } from '../../../utils/constants_applications';



// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'applications_merge');

export default class Merge extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        dir: flags.string({
            char: 'd',
            description: messages.getMessage('dirFlagDescription', [APPLICATIONS_DEFAULT_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription', [APPLICATIONS_DEFAULT_PATH]),
        })
    };

    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        const baseInputDir = (this.flags.dir || [APPLICATIONS_DEFAULT_PATH]) as string;
        const baseOutputDir = (this.flags.output || baseInputDir) as string;
        const inputApplication = (this.flags.input) as string;

        var dirList = [];
        if (inputApplication) {
            dirList = inputApplication.split(',');
        } else {
            dirList = fs.readdirSync(baseInputDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }
        if (!fs.existsSync(baseOutputDir)) {
            fs.mkdirSync(baseOutputDir);
        }

        // dir is the application name without the extension
        for (const dir of dirList) {
            console.log('Merging: ' + dir);
            const inputXML = join(baseInputDir, dir, dir) + XML_PART_EXTENSION;
            const mergedXml = (await readXmlFromFile(inputXML)) ?? {};


            for (const tag_section in APPLICATION_ITEMS) {
                const csvFilePath = join(baseInputDir, dir, tag_section) + CSV_EXTENSION;
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath)

                    jsonArray = sortByKey(jsonArray);

                    for (var i in jsonArray) {
                        delete jsonArray[i]['_tagid']
                    }
                    mergedXml[APPLICATIONS_ROOT_TAG][tag_section] = sortByKey(jsonArray);
                }
            }

            const outputFile = join(baseOutputDir, dir + APPLICATIONS_EXTENSION);

            writeXmlToFile(outputFile, mergedXml);


        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}