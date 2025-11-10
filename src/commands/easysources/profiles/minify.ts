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
import { PROFILE_ITEMS, PROFILE_TAG_BOOL, PROFILES_SUBPATH } from "../../../utils/constants/constants_profiles";
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArray } from "../../../utils/filesUtils"
import { sortByKey, toArray } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';
import { jsonAndPrintError } from '../../../utils/commands/utils';
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
        
        const result = await profileMinify(this.flags);

        Performance.getInstance().end();
        return result;
    }
    
}

// Export a profile-specific minify function that encapsulates profile constants
export async function profileMinify(options: any): Promise<any> {
    const csvWriter = new CsvWriter();
    const csvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), PROFILES_SUBPATH) as string;
    const xmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;
    
    const inputProfile = options.input as string;

    try {
        checkDirOrErrorSync(csvDir);
        checkDirOrErrorSync(xmlDir);
    } catch (error) {
        return jsonAndPrintError(error.message);
    }

    // Initialize result object
    const result = { result: 'OK', items: {} };

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

        try {
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
                            if(res[boolName] === 'true' || res[boolName] === 'FALSE') return true;
                        }

                        return false;
                    });
                    
                    // write the cleaned csv
                    const headers = PROFILE_ITEMS[tag_section].headers;

                    if (options.sort === 'true') {
                        resListCsv = sortByKey(resListCsv);
                    }

                    try {
                        const csvContent = await csvWriter.toCsv(resListCsv, headers);
                        fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                        // file written successfully
                    } catch (err) {
                        console.error(err);
                        throw new Error(`Error writing cleaned CSV for profile ${profileName}, section ${tag_section}`);
                    }    
                }

                // Profile processed successfully
                result.items[profileName] = { result: 'OK' };
            }
        } catch (error) {
            // Profile processing failed
            console.error(`Error processing profile ${profileName}:`, error);
            result.items[profileName] = { 
                result: 'KO', 
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    return result;
}

