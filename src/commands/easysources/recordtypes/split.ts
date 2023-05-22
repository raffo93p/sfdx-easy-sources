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
import { calcCsvFilename, readXmlFromFile, removeExtension, writeXmlToFile } from '../../../utils/filesUtils'
// import { generateTagId } from '../../../utils/utils'
const { Parser } = require('json2csv');
import { RECORDTYPES_EXTENSION, RECORDTYPES_PICKVAL_ROOT, RECORDTYPES_ROOT_TAG, RECORDTYPES_SUBPATH, RECORDTYPE_ITEMS } from '../../../utils/constants/constants_recordtypes';
import Performance from '../../../utils/performance';
import { join } from "path";
import { generateTagId, sortByKey } from '../../../utils/utils';
import { DEFAULT_PATH, XML_PART_EXTENSION } from '../../../utils/constants/constants';
import { transformXMLtoCSV } from '../../../utils/utils_recordtypes';
const fs = require('fs-extra');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_split');

export default class Split extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

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
                    .filter(item => !item.isDirectory() && item.name.endsWith(RECORDTYPES_EXTENSION))
                    .map(item => item.name)
            }


            for (const filename of recordTypeList) {
                const fullFilename = filename.endsWith(RECORDTYPES_EXTENSION) ? filename : filename + RECORDTYPES_EXTENSION;
                console.log('Splitting: ' + join(obj, fullFilename));


                const inputFile = join(baseInputDir, obj, 'recordTypes', fullFilename);
                const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
                const recordtypeProperties = xmlFileContent[RECORDTYPES_ROOT_TAG] ?? {};

                const recordTypeName = removeExtension(fullFilename);
                const outputDir = join(baseOutputDir, obj, 'recordTypes', recordTypeName);

                for (const tag_section in RECORDTYPE_ITEMS) {
                    var myjson = recordtypeProperties[RECORDTYPES_PICKVAL_ROOT];
                    if (myjson == undefined) continue;
                    if (!Array.isArray(myjson)) myjson = [myjson];

                    var jsforcsv = transformXMLtoCSV(myjson);


                    // generate _tagId column
                    generateTagId(jsforcsv, RECORDTYPE_ITEMS[tag_section].key, RECORDTYPE_ITEMS[tag_section].headers);
                    if (this.flags.sort === 'true') {
                        jsforcsv = sortByKey(jsforcsv);
                    }

                    const headers = RECORDTYPE_ITEMS[tag_section].headers;
                    const parser = new Parser({ fields: [...headers, '_tagid'] });
                    const csv = parser.parse(jsforcsv);

                    const outputFileCSV = join(outputDir, calcCsvFilename(recordTypeName, tag_section));

                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }

                    try {
                        fs.writeFileSync(outputFileCSV, csv, { flag: 'w+' });
                        // file written successfully
                    } catch (err) {
                        console.error(err);
                    }

                    xmlFileContent[RECORDTYPES_ROOT_TAG][tag_section] = null;

                }
                if (fs.existsSync(outputDir)) {
                    const outputFileXML = join(outputDir, recordTypeName + XML_PART_EXTENSION);
                    writeXmlToFile(outputFileXML, xmlFileContent);
                }
            }
        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}

