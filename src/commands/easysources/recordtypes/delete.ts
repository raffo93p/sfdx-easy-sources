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

import { DEFAULT_ESCSV_PATH } from "../../../utils/constants/constants";

import { calcCsvFilename, readCsvToJsonMap } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"

import { RECORDTYPES_PICKVAL_ROOT, RECORDTYPES_SUBPATH, RECORDTYPE_ITEMS } from '../../../utils/constants/constants_recordtypes';
import { loadSettings } from '../../../utils/localSettings';
import CsvWriter from '../../../utils/csvWriter';

const settings = loadSettings();


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_delete');

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
        object: flags.string({
            char: 's',
            description: messages.getMessage('objectFlagDescription'),
        }),
        recordtype: flags.string({
            char: 'r',
            description: messages.getMessage('recordtypeFlagDescription'),
        }),
        picklist: flags.string({
            char: 'p',
            description: messages.getMessage('picklistFlagDescription'),
        }),
        apiname: flags.string({
            char: 'k',
            description: messages.getMessage('apinameFlagDescription'),
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

        const result = await recordTypeDelete(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for programmatic API
export async function recordTypeDelete(options: any = {}): Promise<AnyJson> {
    const csvWriter = new CsvWriter();
    
    const picklist = options.picklist;
    const apiname = (options.apiname) as string;
    if (!picklist) throw new SfError(messages.getMessage('errorNoPicklistFlag'));

    const baseInputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const inputObject = (options.object) as string;
    const inputRecordType = (options.recordtype) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return;
    }

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
            console.log('Deleting on: ' + join(obj, dir));

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
                }
            }
        }
    }
    
    return { outputString: 'OK' };
}