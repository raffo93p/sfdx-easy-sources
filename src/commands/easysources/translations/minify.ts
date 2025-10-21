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
import { TRANSLATION_ITEMS, TRANSLAT_TAG_BOOL, TRANSLATIONS_SUBPATH } from "../../../utils/constants/constants_translations";
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArray } from "../../../utils/filesUtils"
import { isBlank, sortByKey, toArray } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'translations_minify');

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
        
        const result = await translationMinify(this.flags);

        Performance.getInstance().end();

        return result;
    }
    
}

// Export function for programmatic API
export async function translationMinify(options: any = {}): Promise<AnyJson> {
    Performance.getInstance().start();
    
    const csvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), TRANSLATIONS_SUBPATH) as string;
    const xmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;

    const inputTranslation = (options.input) as string;

    checkDirOrErrorSync(csvDir);
    checkDirOrErrorSync(xmlDir);

    var transationList = [];
    if (inputTranslation) {
        transationList = inputTranslation.split(',');
    } else {
        transationList = fs.readdirSync(csvDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    for (const translationName of transationList) {
        console.log('Minifying on: ' + translationName);

        for (const tag_section in TRANSLATION_ITEMS) {
            const csvFilePath = join(csvDir, translationName, calcCsvFilename(translationName, tag_section));
            if (fs.existsSync(csvFilePath)) {

                var resListCsv = await readCsvToJsonArray(csvFilePath)

                resListCsv = resListCsv.filter(function(res) {
                    if(TRANSLAT_TAG_BOOL[tag_section] == null) return true;

                    for(const boolName of toArray(TRANSLAT_TAG_BOOL[tag_section]) ){
                        if(!isBlank(res[boolName])) return true;
                    }

                    return false;
                });
                
                const headers = TRANSLATION_ITEMS[tag_section].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ fields: [...headers, '_tagid'], transforms });

                if (options.sort === 'true') {
                    resListCsv = sortByKey(resListCsv);
                }

                const csv = parser.parse(resListCsv);
                try {
                    fs.writeFileSync(csvFilePath, csv, { flag: 'w+' });
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
    
    Performance.getInstance().end();

    
    return { outputString: 'OK' };
}

