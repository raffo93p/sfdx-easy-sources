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
import { readCsvToJsonArray } from '../../../utils/filesUtils'
import { sortByKey } from "../../../utils/utils"

import { generateTagId } from '../../../utils/utils'

const { Parser, transforms: { unwind } } = require('json2csv');
import { PROFILE_ITEMS } from '../../../utils/constants_profiles';
import Performance from '../../../utils/performance';
import { join } from "path";
import { CSV_EXTENSION } from '../../../utils/constants';
import {PROFILES_DEFAULT_PATH} from '../../../utils/constants_profiles';
const fs = require('fs-extra');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_updatekey');

export default class UpdateKey extends SfdxCommand {
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
        })
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();
        const baseInputDir = (this.flags.dir || [PROFILES_DEFAULT_PATH]) as string;
        const inputProfile = (this.flags.input) as string;

        var dirList = [];
        if (inputProfile) {
            dirList = inputProfile.split(',');
        } else {
            dirList = fs.readdirSync(baseInputDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }

        // dir is the profile name without the extension
        for (const dir of dirList) {

            console.log('UpdateKey: ' + dir);

            // tag_Section is each profile section (applicationVisibilities, classAccess ecc)
            for (const tag_section in PROFILE_ITEMS) {

                const csvFilePath = join(baseInputDir, dir, tag_section) + CSV_EXTENSION;
                console.log(csvFilePath)
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath)
                    if(tag_section === 'classAccesses') console.log(jsonArray[0])
                    generateTagId(jsonArray, PROFILE_ITEMS[tag_section].key, PROFILE_ITEMS[tag_section].headers);
                    sortByKey(jsonArray);

                    const headers = PROFILE_ITEMS[tag_section];
                    const transforms = [unwind({ paths: headers })];
                    const parser = new Parser({ headers, transforms });
                    const csv = parser.parse(jsonArray);

                    try {
                        fs.writeFileSync(csvFilePath, csv, { flag: 'w+' });
                        // file written successfully
                    } catch (err) {
                        console.error(err);
                    }
                }
            }

        }


        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}
