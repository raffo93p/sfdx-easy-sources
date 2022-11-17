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

import { CSV_EXTENSION, DEFAULT_PATH } from "../../../utils/constants/constants";

import { readCsvToJsonMap } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"

import { RECORDTYPES_DEFAULT_PATH, RECORDTYPES_PICKVAL_ROOT, RECORDTYPES_SUBPATH, RECORDTYPE_ITEMS } from '../../../utils/constants/constants_recordtypes';


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
        dir: flags.string({
            char: 'd',
            description: messages.getMessage('dirFlagDescription', [DEFAULT_PATH]),
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
        })
    };

    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        const picklist = this.flags.picklist;
        const apiname = (this.flags.apiname) as string;
        if (!picklist) throw new SfError(messages.getMessage('errorNoPicklistFlag'));

        const baseInputDir = join((this.flags.dir || RECORDTYPES_DEFAULT_PATH), RECORDTYPES_SUBPATH) as string;
        const inputObject = (this.flags.object) as string;
        const inputRecordType = (this.flags.recordtype) as string;


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

                const csvFilePath = join(baseInputDir, obj, 'recordTypes', dir, RECORDTYPES_PICKVAL_ROOT) + CSV_EXTENSION;
                if (fs.existsSync(csvFilePath)) {
                    var jsonMap = await readCsvToJsonMap(csvFilePath)

                    if (apiname) {
                        delete jsonMap[join(picklist, apiname)];
                    } else {

                        for (var key of Object.keys(jsonMap)) {

                            if (jsonMap[key].picklist === picklist) {
                                console.log(key)
                                delete jsonMap[key];
                            }
                        }
                    }

                    var jsonArray = Object.values(jsonMap) as [{}];


                    const headers = RECORDTYPE_ITEMS[RECORDTYPES_PICKVAL_ROOT];
                    const transforms = [unwind({ paths: headers })];
                    const parser = new Parser({ headers, transforms });
                    jsonArray = sortByKey(jsonArray);
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