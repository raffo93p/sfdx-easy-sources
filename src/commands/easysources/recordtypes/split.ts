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
import { readXmlFromFile, removeExtension, writeXmlToFile } from '../../../utils/filesUtils'
// import { generateTagId } from '../../../utils/utils'
const { Parser } = require('json2csv');
import { RECORDTYPES_EXTENSION, RECORDTYPES_PICKVAL_ROOT, RECORDTYPES_ROOT_TAG, RECORDTYPE_ITEMS } from '../../../utils/constants_recordtypes';
import Performance from '../../../utils/performance';
import { join } from "path";
import { generateTagId, sortByKey } from '../../../utils/utils';
import { CSV_EXTENSION, XML_PART_EXTENSION } from '../../../utils/constants';
import { transformXMLtoCSV } from '../../../utils/utils_recordtypes';
const fs = require('fs-extra');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_split');

export default class Split extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription'),
        })
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();
        const baseInputDir = (this.flags.input || './force-app/src/default/objects') as string;
        const baseOutputDir = (this.flags.output || baseInputDir) as string;

        var fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(RECORDTYPES_EXTENSION))
            .map(item => item.name)

        // TODO per objects non mi va bene questo scorrimento. devo andare in ogni oggetto
        for (const filename of fileList) {
            console.log('Splitting: ' + filename);


            const inputFile = join(baseInputDir, filename);
            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const recordtypeProperties = xmlFileContent[RECORDTYPES_ROOT_TAG] ?? {};

            const recordTypeName = removeExtension(inputFile);
            const outputDir = join(baseOutputDir, recordTypeName);

            for (const tag_section in RECORDTYPE_ITEMS) {
                const myjson = recordtypeProperties[RECORDTYPES_PICKVAL_ROOT];
                if (myjson == undefined) continue;

                var jsforcsv = transformXMLtoCSV(myjson);


                // generate _tagId column
                generateTagId(jsforcsv, RECORDTYPE_ITEMS[tag_section].key, RECORDTYPE_ITEMS[tag_section].headers);
                jsforcsv = sortByKey(jsforcsv);

                const parser = new Parser();
                const csv = parser.parse(jsforcsv);

                const outputFileCSV = join(outputDir, tag_section) + CSV_EXTENSION;

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                try {
                    fs.writeFileSync(outputFileCSV, csv, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                }

                xmlFileContent[RECORDTYPES_ROOT_TAG][tag_section] = null;

            }
            const outputFileXML = join(outputDir, recordTypeName + XML_PART_EXTENSION);
            writeXmlToFile(outputFileXML, xmlFileContent);
        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }
}

