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

import {
    DEFAULT_PATH,
    XML_PART_EXTENSION
} from "../../../utils/constants/constants";

import {
    RECORDTYPES_EXTENSION,
    RECORDTYPES_PICKVAL_ROOT,
    RECORDTYPES_ROOT_TAG,
    RECORDTYPES_SUBPATH,
    RECORDTYPE_ITEMS
} from "../../../utils/constants/constants_recordtypes";

import { writeXmlToFile, readCsvToJsonArray, readXmlFromFile, calcCsvFilename } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"
import { transformCSVtoXML } from '../../../utils/utils_recordtypes';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_merge');

export default class Merge extends SfdxCommand {
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
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription', [DEFAULT_PATH]),
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

        const baseInputDir = join((this.flags.dir || DEFAULT_PATH), RECORDTYPES_SUBPATH) as string;
        const baseOutputDir = this.flags.output == null ? baseInputDir : join(this.flags.output, RECORDTYPES_SUBPATH) as string;
        const inputObject = (this.flags.object) as string;
        const inputRecordType = (this.flags.recordtype) as string;

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
            if (!fs.existsSync(join(baseInputDir, obj, 'recordTypes'))) continue;

            var recordTypeList = [];

            if (inputRecordType) {
                recordTypeList = inputRecordType.split(',');
            } else {
                recordTypeList = fs.readdirSync(join(baseInputDir, obj, 'recordTypes'), { withFileTypes: true })
                    .filter(item => item.isDirectory())
                    .map(item => item.name)
            }

            for (const dir of recordTypeList) {
                console.log('Merging: ' + join(obj, dir));

                const inputXML = join(baseInputDir, obj, 'recordTypes', dir, dir) + XML_PART_EXTENSION;
                const mergedXml = (await readXmlFromFile(inputXML)) ?? {};
                const outputDir = join(baseOutputDir, obj, 'recordTypes');

                for (const tag_section in RECORDTYPE_ITEMS) {
                    const csvFilePath = join(baseInputDir, obj, 'recordTypes', dir, calcCsvFilename(dir, tag_section));
                    if (fs.existsSync(csvFilePath)) {
                        var jsonArray = await readCsvToJsonArray(csvFilePath)

                        if (this.flags.sort === 'true') {
                            jsonArray = sortByKey(jsonArray);
                        }

                        for (var i in jsonArray) {
                            delete jsonArray[i]['_tagid']
                        }

                        var jsonArrayForXML = transformCSVtoXML(jsonArray);


                        mergedXml[RECORDTYPES_ROOT_TAG][RECORDTYPES_PICKVAL_ROOT] = jsonArrayForXML;
                    }

                }
                const outputFile = join(outputDir, dir + RECORDTYPES_EXTENSION);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }
                writeXmlToFile(outputFile, mergedXml);

            }
        }


        // dir is the record type name without the extension


        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}