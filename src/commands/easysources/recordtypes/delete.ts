/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

const fs = require('fs-extra');
import { join } from "path";
import Performance from '../../../utils/performance';

import { DEFAULT_ESCSV_PATH } from "../../../utils/constants/constants";

import { calcCsvFilename, readCsvToJsonMap } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"

import { RECORDTYPES_PICKVAL_ROOT, RECORDTYPES_SUBPATH, RECORDTYPE_ITEMS } from '../../../utils/constants/constants_recordtypes';
import { loadSettings } from '../../../utils/localSettings';
import CsvWriter from '../../../utils/csvWriter';
import { jsonAndPrintError } from '../../../utils/commands/utils';

const settings = loadSettings();


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_delete');

export default class Delete extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);


    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
        "es-csv": Flags.string({
            char: 'c',
            summary: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        object: Flags.string({
            char: 's',
            summary: messages.getMessage('objectFlagDescription'),
        }),
        recordtype: Flags.string({
            char: 'r',
            summary: messages.getMessage('recordtypeFlagDescription'),
        }),
        picklist: Flags.string({
            char: 'p',
            summary: messages.getMessage('picklistFlagDescription'),
        }),
        apiname: Flags.string({
            char: 'k',
            summary: messages.getMessage('apinameFlagDescription'),
        }),
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(Delete);
        Performance.getInstance().start();

        const result = await recordTypeDelete(flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for programmatic API
export async function recordTypeDelete(options: any = {}): Promise<any> {
    const csvWriter = new CsvWriter();
    
    const picklist = options.picklist;
    const apiname = (options.apiname) as string;
    if (!picklist) throw new SfError(messages.getMessage('errorNoPicklistFlag'));

    const baseInputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const inputObject = (options.object) as string;
    const inputRecordType = (options.recordtype) as string;

    if (!fs.existsSync(baseInputDir)) {
        return jsonAndPrintError('Input folder ' + baseInputDir + ' does not exist!');
    }

    // Initialize result object
    const result = { result: 'OK', items: {} };

    var objectList = [];
    if (inputObject) {
        objectList = inputObject.split(',');
    } else {
        objectList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    for (const obj of objectList) {
        var recordTypeList = [];

        if (inputRecordType) {
            recordTypeList = inputRecordType.split(',');
        } else {
            recordTypeList = fs.readdirSync(join(baseInputDir, obj, 'recordTypes'), { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }

            // dir is the recordtype name without the extension
        for (const dir of recordTypeList) {
            const fileKey = `${obj}/${dir}`;
            
            console.log('Deleting on: ' + fileKey);

            try {
                const csvFilePath = join(baseInputDir, obj, 'recordTypes', dir, calcCsvFilename(dir, RECORDTYPES_PICKVAL_ROOT));

                if (fs.existsSync(csvFilePath)) {
                    var jsonMap = await readCsvToJsonMap(csvFilePath);

                    if (apiname) {
                        for (var ap of apiname.split(',')) {
                            var key = picklist + '/' + ap;
                            jsonMap.delete(key);
                        }
                    } else {
                        for(var pick of picklist.split(',')){
                            for (var key of jsonMap.keys()) {
                                if (jsonMap.get(key).picklist === pick) {
                                    jsonMap.delete(key);
                                }
                            }
                        }
                    }

                    var jsonArray = Array.from(jsonMap.values());

                    const headers = RECORDTYPE_ITEMS[RECORDTYPES_PICKVAL_ROOT].headers;

                    if (options.sort === 'true') {
                        jsonArray = sortByKey(jsonArray);
                    }

                    try {
                        const csvContent = await csvWriter.toCsv(jsonArray, headers);
                        fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                        // file written successfully
                    } catch (err) {
                        console.error(err);
                        throw new Error(`Failed to write CSV file ${csvFilePath}: ${err.message}`);
                    }

                    // File processed successfully
                    result.items[fileKey] = { result: 'OK' };
                }
            } catch (error) {
                console.error(`Error processing recordType ${fileKey}:`, error);
                result.items[fileKey] = { 
                    result: 'KO', 
                    error: error.message || 'Unknown error occurred'
                };
            }
        }
    }
    
    return result;
}