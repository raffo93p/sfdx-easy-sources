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
const { Parser, transforms: { unwind } } = require('json2csv');
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArrayWithNulls } from "../../../utils/filesUtils"
import { isBlank, sortByKey, toArray } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';
import { OBJTRANSL_ITEMS, OBJTRANSL_SUBPATH, OBJTRANSL_TAG_BOOL } from '../../../utils/constants/constants_objecttranslations';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_minify');

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
        
        const csvDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
        const xmlDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;

        const inputObject = (this.flags.input) as string;

        checkDirOrErrorSync(csvDir);
        checkDirOrErrorSync(xmlDir);

        var objTrList = [];
        if (inputObject) {
            objTrList = inputObject.split(',');
        } else {
            objTrList = fs.readdirSync(csvDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }


        // objTrName is the object translation name
        for (const objTrName of objTrList) {
            console.log('Minifying on: ' + objTrName);

            for (const tag_section in OBJTRANSL_ITEMS) {
                // tag_section is a profile section (applicationVisibilities, classAccess ecc)

                const csvFilePath = join(csvDir, objTrName, 'csv', calcCsvFilename(objTrName, tag_section));

                if (fs.existsSync(csvFilePath)) {

                    // get the list of resources on the csv. eg. the list of apex classes
                    var resListCsv = await readCsvToJsonArrayWithNulls(csvFilePath)

                    
                    resListCsv = resListCsv.filter(function(res) {
                        // return true to persist, false to delete
                        if(OBJTRANSL_TAG_BOOL[tag_section] == null) return true;

                        for(const boolName of toArray(OBJTRANSL_TAG_BOOL[tag_section]) ){
                            if(!isBlank(res[boolName])) return true;
                        }

                        return false;
                    });
                    
                    
                    // write the cleaned csv
                    const headers = OBJTRANSL_ITEMS[tag_section].headers;
                    const transforms = [unwind({ paths: headers })];
                    const parser = new Parser({ fields: [...headers, '_tagid'], transforms });

                    if (this.flags.sort === 'true') {
                        resListCsv = sortByKey(resListCsv);
                    }

                    const csv = parser.parse(resListCsv);
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

