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
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArrayWithNulls } from "../../../utils/filesUtils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';
import { OBJTRANSL_ITEMS, OBJTRANSL_SUBPATH } from '../../../utils/constants/constants_objecttranslations';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_clearempty');

export default class ClearEmpty extends SfdxCommand {
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
    };

    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();
        
        const result = await objectTranslationClearEmpty(this.flags);
        
        Performance.getInstance().end();
        return result;
    }
}

// Export object translation-specific clearEmpty function for programmatic API
export async function objectTranslationClearEmpty(options: any = {}): Promise<{ outputString: string; deletedFiles: number; deletedFolders: number }> {
    Performance.getInstance().start();
    
    const csvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
    const xmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;

    const inputObject = (options.input) as string;

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

    let deletedFiles = 0;
    let deletedFolders = 0;

    // objTrName is the object translation name
    for (const objTrName of objTrList) {
        console.log('Clearing empty CSVs for: ' + objTrName);

        const objTrFolder = join(csvDir, objTrName);
        const csvSubFolder = join(objTrFolder, 'csv');
        let hasPopulatedCsvs = false;

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
                    deletedFiles++;
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
                    deletedFiles++;
                }
            }

            // Check again for remaining files after cleanup
            const finalRemainingFiles = fs.readdirSync(csvSubFolder);
            
            // If no files remain in csv subfolder, delete the entire object translation folder
            if (finalRemainingFiles.length === 0) {
                console.log(`  Deleting empty folder: ${objTrFolder}`);
                fs.removeSync(objTrFolder);
                deletedFolders++;
            }
        }
    }

    const outputString = `Deleted ${deletedFiles} empty CSV files and ${deletedFolders} empty folders`;
    console.log(outputString);
    
    Performance.getInstance().end();
    return { outputString, deletedFiles, deletedFolders };
}
