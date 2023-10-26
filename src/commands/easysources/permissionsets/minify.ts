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
const { Parser, transforms: { unwind } } = require('json2csv');
import { PROFILE_ITEMS, PROFILE_TAG_BOOL } from "../../../utils/constants/constants_profiles";
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArray } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';
import { PERMSETS_SUBPATH } from '../../../utils/constants/constants_permissionsets';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_minify');

export default class Clean extends SfdxCommand {
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
        
        const csvDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), PERMSETS_SUBPATH) as string;
        const xmlDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;

        const inputProfile = (this.flags.input) as string;

        checkDirOrErrorSync(csvDir);
        checkDirOrErrorSync(xmlDir);

        var profileList = [];
        if (inputProfile) {
            profileList = inputProfile.split(',');
        } else {
            profileList = fs.readdirSync(csvDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }


        // profileName is the profile name without the extension
        for (const profileName of profileList) {
            console.log('Minifying on: ' + profileName);

            for (const tag_section in PROFILE_ITEMS) {
                // tag_section is a profile section (applicationVisibilities, classAccess ecc)

                const csvFilePath = join(csvDir, profileName, calcCsvFilename(profileName, tag_section));
                if (fs.existsSync(csvFilePath)) {

                    // get the list of resources on the csv. eg. the list of apex classes
                    var resListCsv = await readCsvToJsonArray(csvFilePath)

                    
                    resListCsv = resListCsv.filter(function(res) {
                        // return true to persist, false to delete
                        if(PROFILE_TAG_BOOL[tag_section] == null) return true;

                        for(const boolName of toArray(PROFILE_TAG_BOOL[tag_section]) ){
                            if(res[boolName] === 'true' || res[boolName] === 'False') return true;
                        }

                        return false;
                    });
                    
                    
                    // write the cleaned csv
                    const headers = PROFILE_ITEMS[tag_section].headers;
                    const transforms = [unwind({ paths: headers })];
                    const parser = new Parser({ fields: [...headers, '_tagid'], transforms });

                    if (this.flags.sort === 'true') {
                        resListCsv = sortByKey(resListCsv);
                    }

                    const csv = parser.parse(resListCsv);
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


export function toArray(arr): string[]{
    if (!Array.isArray(arr)) arr = [arr];
    return arr;
}

