/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import { join } from "path";
import Performance from '../../../utils/performance.js';
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArrayWithNulls } from "../../../utils/filesUtils.js"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants.js';
import { loadSettings } from '../../../utils/localSettings.js';
import { OBJTRANSL_ITEMS, OBJTRANSL_SUBPATH } from '../../../utils/constants/constants_objecttranslations.js';
import { EmptyClearerResult, ItemResult } from '../../../utils/commands/emptyClearer.js';
import { jsonAndPrintError } from '../../../utils/commands/utils.js';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_clearempty');

export default class ClearEmpty extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);

    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
        "sf-xml": Flags.string({
            char: 'x',
            summary: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
        "es-csv": Flags.string({
            char: 'c',
            summary: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        input: Flags.string({
            char: 'i',
            summary: messages.getMessage('inputFlagDescription'),
        }),
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(ClearEmpty);
        Performance.getInstance().start();
        
        const result = await objectTranslationClearEmpty(flags);
        
        Performance.getInstance().end();
        return result;
    }
}

// Export object translation-specific clearEmpty function for programmatic API
export async function objectTranslationClearEmpty(options: any = {}): Promise<any> {
    Performance.getInstance().start();
    
    const csvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
    const xmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;

    const inputObject = (options.input) as string;

    try {
        checkDirOrErrorSync(csvDir);
        checkDirOrErrorSync(xmlDir);
    } catch (error) {
        return jsonAndPrintError(error.message);
    }

    var objTrList = [];
    if (inputObject) {
        objTrList = inputObject.split(',');
    } else {
        objTrList = fs.readdirSync(csvDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    let totalDeletedFiles = 0;
    let totalDeletedFolders = 0;
    const itemsResult: { [itemName: string]: ItemResult } = {};

    // objTrName is the object translation name
    for (const objTrName of objTrList) {
        console.log('Clearing empty CSVs for: ' + objTrName);

        const objTrFolder = join(csvDir, objTrName);
        const csvSubFolder = join(objTrFolder, 'csv');
        let hasPopulatedCsvs = false;
        let itemDeletedFiles = 0;
        let itemDeletedFolders = 0;

        try {
            for (const tag_section in OBJTRANSL_ITEMS) {
                // tag_section is an object translation section

                const csvFilePath = join(csvDir, objTrName, 'csv', calcCsvFilename(objTrName, tag_section));

                if (fs.existsSync(csvFilePath)) {
                    // get the list of resources on the csv
                    var resListCsv = await readCsvToJsonArrayWithNulls(csvFilePath);

                    // if CSV has no records (only headers), delete it
                    if (resListCsv.length === 0) {
                        console.log(`  Deleting empty CSV: ${csvFilePath}`);
                        fs.unlinkSync(csvFilePath);
                        itemDeletedFiles++;
                    } else {
                        hasPopulatedCsvs = true;
                    }
                }
            }

            // Check if csv subfolder exists and clean up .part files and empty folders
            if (fs.existsSync(csvSubFolder)) {
                const remainingFiles = fs.readdirSync(csvSubFolder);
                
                // Remove -part.xml files only if there are no populated CSVs
                if (!hasPopulatedCsvs) {
                    const partFiles = remainingFiles.filter(file => file.endsWith('-part.xml'));
                    for (const partFile of partFiles) {
                        const partFilePath = join(csvSubFolder, partFile);
                        console.log(`  Deleting -part.xml file: ${partFilePath}`);
                        fs.unlinkSync(partFilePath);
                        itemDeletedFiles++;
                    }
                }

                // Check again for remaining files after cleanup
                const finalRemainingFiles = fs.readdirSync(csvSubFolder);
                
                // If no files remain in csv subfolder, delete the entire object translation folder
                if (finalRemainingFiles.length === 0) {
                    console.log(`  Deleting empty folder: ${objTrFolder}`);
                    fs.removeSync(objTrFolder);
                    itemDeletedFolders++;
                }
            }

            totalDeletedFiles += itemDeletedFiles;
            totalDeletedFolders += itemDeletedFolders;

            itemsResult[objTrName] = {
                result: 'OK',
                deletedFiles: itemDeletedFiles,
                deletedFolders: itemDeletedFolders
            };

        } catch (error) {
            itemsResult[objTrName] = {
                result: 'KO',
                deletedFiles: itemDeletedFiles,
                deletedFolders: itemDeletedFolders,
                error: error instanceof Error ? error.message : String(error)
            };
            console.error(`  Error processing ${objTrName}: ${error}`);
        }
    }

    const result: EmptyClearerResult = {
        result: 'OK',
        summary: {
            totalItems: objTrList.length,
            processedItems: Object.values(itemsResult).filter(item => item.result === 'OK').length,
            deletedFiles: totalDeletedFiles,
            deletedFolders: totalDeletedFolders
        },
        items: itemsResult
    };

    console.log(`\nClear Empty Summary: ${result.summary.totalItems} items processed, ${result.summary.deletedFiles} files deleted, ${result.summary.deletedFolders} folders deleted`);
    
    Performance.getInstance().end();
    return result;
}
