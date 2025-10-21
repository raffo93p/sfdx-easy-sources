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
import { calcCsvFilename, readCsvToJsonArray } from '../../../utils/filesUtils'
import { generateTagId, sortByKey } from '../../../utils/utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants';
import Performance from '../../../utils/performance';
import { join } from "path";
import { RECORDTYPES_SUBPATH, RECORDTYPE_ITEMS } from '../../../utils/constants/constants_recordtypes';
import { loadSettings } from '../../../utils/localSettings';
const fs = require('fs-extra');

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_updatekey');

export default class UpdateKey extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

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
        sort: flags.enum({
            char: 'S',
            description: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();
        
        const result = await recordTypeUpdateKey(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

// Export function for API usage
export async function recordTypeUpdateKey(options: any = {}): Promise<AnyJson> {

    const baseInputDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const inputObject = (options.object) as string;
    const inputRecordType = (options.recordtype) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return { outputString: 'ERROR: Input folder does not exist' };
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
            if (!fs.existsSync(join(baseInputDir, obj, 'recordTypes'))) continue;

            recordTypeList = fs.readdirSync(join(baseInputDir, obj, 'recordTypes'), { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }

            // dir is the record type name without the extension
        for (const dir of recordTypeList) {
            console.log('UpdateKey: ' + dir);

                // key is each profile section (applicationVisibilities, classAccess ecc)
            for (const tag_section in RECORDTYPE_ITEMS) {
                const csvFilePath = join(baseInputDir, obj, 'recordTypes', dir, calcCsvFilename(dir, tag_section));
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath)
                    generateTagId(jsonArray, RECORDTYPE_ITEMS[tag_section].key, RECORDTYPE_ITEMS[tag_section].headers);

                    if (options.sort === 'true' || options.sort === true || options.sort === undefined) {
                        jsonArray = sortByKey(jsonArray);
                    }

                    const headers = RECORDTYPE_ITEMS[tag_section].headers;
                    const transforms = [unwind({ paths: headers })];
                    const parser = new Parser({ fields: [...headers, '_tagid'], transforms });
                    const csv = parser.parse(jsonArray);

                    try {
                        fs.writeFileSync(csvFilePath, csv, { flag: 'w+' });
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        }
    }

    return { outputString: 'OK' };
}
