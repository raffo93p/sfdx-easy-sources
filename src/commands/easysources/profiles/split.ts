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
import { readXmlFromFile, removeExtension, writeXmlToFile } from '../../../utils/filesUtils'
import { generateTagId } from '../../../utils/utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { PROFILE_ITEMS, PROFILES_EXTENSION, PROFILES_ROOT_TAG } from '../../../utils/constants_profiles';
import Performance from '../../../utils/performance';
import { basename, join } from "path";
const fs = require('fs-extra');
import { sortByKey } from "../../../utils/utils"
import { CSV_EXTENSION, XML_PART_EXTENSION } from '../../../utils/constants';
import {PROFILES_DEFAULT_PATH} from "../../../utils/constants_profiles";


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_split');

export default class Split extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);


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
        }),
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        const baseInputDir = (this.flags.dir || PROFILES_DEFAULT_PATH) as string;
        const baseOutputDir = (this.flags.output || baseInputDir) as string;
        const inputProfile = (this.flags.input) as string;

        var fileList = [];

        if (inputProfile) {
            fileList = inputProfile.split(',');
        } else {
            fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
                .filter(item => !item.isDirectory() && item.name.endsWith(PROFILES_EXTENSION))
                .map(item => item.name)
        }

        for (const filename of fileList) {
            console.log('Splitting: ' + filename);

            const inputFile = join(baseInputDir, filename);
            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const profileProperties = xmlFileContent[PROFILES_ROOT_TAG] ?? {};

            const profileName = removeExtension(basename(inputFile));
            const outputDir = join(baseOutputDir, profileName);

            for (const tag_section in PROFILE_ITEMS) {

                var myjson = profileProperties[tag_section];
                if (myjson == undefined) continue;

                // generate _tagId column
                generateTagId(myjson, PROFILE_ITEMS[tag_section].key, PROFILE_ITEMS[tag_section].headers);
                myjson = sortByKey(myjson);

                const headers = PROFILE_ITEMS[tag_section].headers;
                const transforms = [unwind({ paths: headers })];

                const parser = new Parser({ transforms });
                const csv = parser.parse(myjson);


                const outputFileCSV = join(outputDir, tag_section) + CSV_EXTENSION;

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                try {
                    fs.writeFileSync(outputFileCSV, csv, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                }

                xmlFileContent[PROFILES_ROOT_TAG][tag_section] = null;

            }

            const outputFileXML = join(outputDir, profileName + XML_PART_EXTENSION);
            writeXmlToFile(outputFileXML, xmlFileContent);
        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}
