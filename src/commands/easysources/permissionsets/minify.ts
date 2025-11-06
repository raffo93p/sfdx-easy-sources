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
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArray } from "../../../utils/filesUtils"
import { sortByKey, toArray } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';
import { PERMSETS_SUBPATH, PERMSET_ITEMS, PERMSET_TAG_BOOL } from '../../../utils/constants/constants_permissionsets';
import CsvWriter from '../../../utils/csvWriter';

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
        
        var result = await permissionsetMinify(this.flags);
        
        Performance.getInstance().end();

        return result;
    }
}

/**
 * Permission set-specific minify function that encapsulates all permission set constants
 * This function can be used programmatically without needing to pass permission set constants
 * 
 * @param options - Permission set minify options (paths will be resolved automatically if not provided)
 * @returns Promise with minify operation result
 */
export async function permissionsetMinify(options: any): Promise<any> {
    const csvWriter = new CsvWriter();
    const csvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), PERMSETS_SUBPATH) as string;
    const xmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;
    
    const inputProfile = options.input as string;

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

        for (const tag_section in PERMSET_ITEMS) {
            // tag_section is a profile section (applicationVisibilities, classAccess ecc)

            const csvFilePath = join(csvDir, profileName, calcCsvFilename(profileName, tag_section));
            if (fs.existsSync(csvFilePath)) {

                // get the list of resources on the csv. eg. the list of apex classes
                var resListCsv = await readCsvToJsonArray(csvFilePath)

                
                resListCsv = resListCsv.filter(function(res) {
                    // return true to persist, false to delete
                    if(PERMSET_TAG_BOOL[tag_section] == null) return true;

                    for(const boolName of toArray(PERMSET_TAG_BOOL[tag_section]) ){
                        if(res[boolName] === 'true' || res[boolName] === 'FALSE') return true;
                    }

                    return false;
                });
                
                
                // write the cleaned csv
                const headers = PERMSET_ITEMS[tag_section].headers;

                if (options.sort === 'true') {
                    resListCsv = sortByKey(resListCsv);
                }

                try {
                    const csvContent = await csvWriter.toCsv(resListCsv, headers);
                    fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                }
                
            }
        }
    }

    return { outputString: 'OK' };
}
