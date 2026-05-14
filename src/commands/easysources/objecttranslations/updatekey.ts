/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import Performance from '../../../utils/performance.js';
import { OBJTRANSL_ITEMS, OBJTRANSL_SUBPATH } from '../../../utils/constants/constants_objecttranslations.js';
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants.js';
import { calcCsvFilename, readCsvToJsonArray } from '../../../utils/filesUtils.js';
import { generateTagId, sortByKey } from '../../../utils/utils.js';
import { jsonAndPrintError } from '../../../utils/commands/utils.js';
import { loadSettings } from '../../../utils/localSettings.js';
import CsvWriter from '../../../utils/csvWriter.js';
import { join } from 'path';
import fs from 'fs-extra';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_updatekey');

export default class UpdateKey extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);


    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
        "es-csv": Flags.string({
            char: 'c',
            summary: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        input: Flags.string({
            char: 'i',
            summary: messages.getMessage('inputFlagDescription'),
        }),
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };


    public async run(): Promise<unknown> {
        const { flags } = await this.parse(UpdateKey);
        Performance.getInstance().start();

        var result = await objectTranslationUpdateKey(flags);

        Performance.getInstance().end();
        return result;
    }
}

// Export function for programmatic API
export async function objectTranslationUpdateKey(options: any = {}): Promise<any> {
    const csvWriter = new CsvWriter();

    const baseInputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
    const inputObject = (options.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        return jsonAndPrintError(`Input folder ${baseInputDir} does not exist`);
    }

    // Initialize result object
    const result = { result: 'OK', items: {} };

    var objectTList = [];
    if (inputObject) {
        objectTList = inputObject.split(',');
    } else {
        objectTList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name);
    }

    for (const objTrName of objectTList) {
        console.log('UpdateKey: ' + objTrName);

        const csvDir = join(baseInputDir, objTrName, 'csv');

        if (!fs.existsSync(csvDir)) {
            console.log('Skipping ' + objTrName + '; CSV folder ' + csvDir + ' does not exist!');
            result.items[objTrName] = { result: 'KO', error: `CSV folder ${csvDir} does not exist` };
            continue;
        }

        try {
            for (const tag_section in OBJTRANSL_ITEMS) {
                const csvFilePath = join(csvDir, calcCsvFilename(objTrName, tag_section));

                if (!fs.existsSync(csvFilePath)) continue;

                var jsonArray = await readCsvToJsonArray(csvFilePath);

                generateTagId(jsonArray, OBJTRANSL_ITEMS[tag_section].key, OBJTRANSL_ITEMS[tag_section].headers);

                if (options.sort !== 'false') {
                    jsonArray = sortByKey(jsonArray);
                }

                const headers = OBJTRANSL_ITEMS[tag_section].headers;

                try {
                    const csvContent = await csvWriter.toCsv(jsonArray, headers);
                    fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                } catch (err) {
                    console.error(err);
                    throw new Error(`Failed to write CSV file ${csvFilePath}: ${err.message}`);
                }
            }

            result.items[objTrName] = { result: 'OK' };

        } catch (error) {
            console.error(`Error processing object ${objTrName}:`, error);
            result.items[objTrName] = {
                result: 'KO',
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    return result;
}
