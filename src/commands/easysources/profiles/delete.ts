/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
const fs = require('fs-extra');
import { join } from "path";
import Performance from '../../../utils/performance';
const { Parser, transforms: { unwind } } = require('json2csv');
import { PROFILES_SUBPATH, PROFILE_ITEMS } from "../../../utils/constants/constants_profiles";
import { calcCsvFilename, readCsvToJsonMap } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_delete');

export default class Delete extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        "es-csv": flags.string({
            char: 'c',
            description: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        type: flags.string({
            char: 't',
            description: messages.getMessage('typeFlagDescription'),
        }),
        tagid: flags.string({
            char: 'k',
            description: messages.getMessage('tagidFlagDescription'),
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

        const type = this.flags.type;
        const tagid = this.flags.tagid;
        if (!type) throw new SfError(messages.getMessage('errorNoTypeFlag'));
        if (!tagid) throw new SfError(messages.getMessage('errorNoTagIdFlag'));
        if (!Object.keys(PROFILE_ITEMS).includes(type)) throw new SfError(messages.getMessage('errorNoValidTypeFlag'));
        const baseInputDir = join((this.flags["es-csv"] || DEFAULT_ESCSV_PATH), PROFILES_SUBPATH) as string;
        const inputProfile = (this.flags.input) as string;

        if (!fs.existsSync(baseInputDir)) {
            console.log('Input folder ' + baseInputDir + ' does not exist!');
            return;
        }

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
            console.log('Deleting on: ' + dir);

            // type is a profile section (applicationVisibilities, classAccess ecc)
            const csvFilePath = join(baseInputDir, dir, calcCsvFilename(dir, type));
            if (fs.existsSync(csvFilePath)) {
                var jsonMap = await readCsvToJsonMap(csvFilePath)

                for (var k of tagid.split(',')) {
                    jsonMap.delete(k);
                }
                var jsonArray = Array.from(jsonMap.values());

                const headers = PROFILE_ITEMS[type].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ fields: [...headers, '_tagid'], transforms });

                if (this.flags.sort === 'true') {
                    jsonArray = sortByKey(jsonArray);
                }

                const csv = parser.parse(jsonArray);
                try {
                    fs.writeFileSync(csvFilePath, csv, { flag: 'w+' });
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