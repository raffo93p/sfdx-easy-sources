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
import { RECORDTYPE_ITEMS, RECORDTYPES_EXTENSION, RECORDTYPES_ROOT_TAG, RECORDTYPES_SUBPATH } from '../../../utils/constants/constants_recordtypes';
import Performance from '../../../utils/performance';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
const fs = require('fs-extra');
import { join } from "path";
import { readXmlFromFile, writeXmlToFile, readStringNormalizedFromFile } from "../../../utils/filesUtils";
import { loadSettings } from "../../../utils/localSettings";
import { tmpdir } from "os";
import { mergeRecordTypeFromCsv } from './merge';
import { jsonAndPrintError } from '../../../utils/commands/utils';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_arealigned');

interface ValidationResult {
    itemName: string;
    isAligned: boolean;
    differences: string[];
    isWarning?: boolean;
}

interface ItemResult {
    result: 'OK' | 'KO' | 'WARN';
    error?: string;
}

interface ValidationSummary {
    result: 'OK';
    summary: {
        totalItems: number;
        alignedItems: number;
        misalignedItems: number;
        warningItems: number;
    };
    items: { [itemName: string]: ItemResult };
    [key: string]: any; // For AnyJson compatibility
}

export default class AreAligned extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

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
        mode: flags.enum({
            char: 'm',
            description: messages.getMessage('modeFlagDescription', ['string']),
            options: ['string', 'logic'],
            default: 'string',
        }),
    };

    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();
                
        const result = await recordTypeAreAligned(this.flags);

        Performance.getInstance().end();
        return result;
    }

}

// Export function for API usage
export async function recordTypeAreAligned(options: any = {}): Promise<AnyJson> {

    const baseXmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), RECORDTYPES_SUBPATH) as string;
    const baseCsvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const inputObjects = (options.object) as string;
    const inputRecordTypes = (options.recordtype) as string;
    const mode = options.mode || 'string';

    if (!fs.existsSync(baseXmlDir)) {
        return jsonAndPrintError('Folder '+ baseXmlDir +' does not exist!');
    }

    if (!fs.existsSync(baseCsvDir)) {
        return jsonAndPrintError('Folder '+ baseCsvDir +' does not exist!');
    }

    var objectList = [];
    if (inputObjects) {
        objectList = inputObjects.split(',');
    } else {
        objectList = fs.readdirSync(baseXmlDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name);
    }

    const items: { [itemName: string]: ItemResult } = {};
    let alignedCount = 0;
    let warningCount = 0;
    let totalItems = 0;

    for (const objectName of objectList) {
        const objectXmlDir = join(baseXmlDir, objectName, 'recordTypes');
        const objectCsvDir = join(baseCsvDir, objectName, 'recordTypes');

        if (!fs.existsSync(objectXmlDir)) continue;
        if (!fs.existsSync(objectCsvDir)) {
            const itemKey = `${objectName}/*`;
            const errorMsg = messages.getMessage('missingCsvDirectory', [objectCsvDir]);
            items[itemKey] = { 
                result: 'WARN', 
                error: errorMsg 
            };
            warningCount++;
            totalItems++;
            console.log(`⚠️  ${itemKey} has warnings:`);
            console.log(`   - ${errorMsg}`);
            continue;
        }

        var recordTypeList = [];
        if (inputRecordTypes) {
            recordTypeList = inputRecordTypes.split(',');
        } else {
            recordTypeList = fs.readdirSync(objectXmlDir, { withFileTypes: true })
                .filter(item => !item.isDirectory() && item.name.endsWith(RECORDTYPES_EXTENSION))
                .map(item => item.name.replace(RECORDTYPES_EXTENSION, ''));
        }

        for (const recordTypeName of recordTypeList) {
            const itemKey = `${objectName}/${recordTypeName}`;
            totalItems++;
            
            let validationResult: ValidationResult;
            
            if (mode === 'string') {
                validationResult = await compareStringsForRecord(objectName, recordTypeName, objectXmlDir, objectCsvDir, options);
            } else {
                validationResult = await validateSingleRecordTypeForRecord(objectName, recordTypeName, objectXmlDir, objectCsvDir, options);
            }
            
            // Convert ValidationResult to ItemResult format
            if (validationResult.isAligned) {
                items[itemKey] = { result: 'OK' };
                alignedCount++;
                console.log(messages.getMessage('validationSuccess', [itemKey]));
            } else if (validationResult.isWarning) {
                items[itemKey] = { 
                    result: 'WARN', 
                    error: validationResult.differences.join('; ') 
                };
                warningCount++;
                console.log(`⚠️  Record type '${itemKey}' has warnings:`);
                validationResult.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
            } else {
                items[itemKey] = { 
                    result: 'KO', 
                    error: validationResult.differences.join('; ') 
                };
                console.log(messages.getMessage('validationError', [itemKey]));
                validationResult.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
            }
        }
    }

    const result: ValidationSummary = {
        result: 'OK',
        summary: {
            totalItems: totalItems,
            alignedItems: alignedCount,
            misalignedItems: totalItems - alignedCount - warningCount,
            warningItems: warningCount
        },
        items: items
    };

    console.log(messages.getMessage('validationSummary', [
        result.summary.totalItems,
        result.summary.alignedItems,
        result.summary.misalignedItems
    ]));

    return result;
}

async function compareStringsForRecord(
    objectName: string,
    recordTypeName: string,
    xmlDir: string,
    csvDir: string,
    options: any
): Promise<ValidationResult> {
    const itemName = `${objectName}/${recordTypeName}`;

    try {
        const originalXmlPath = join(xmlDir, recordTypeName + RECORDTYPES_EXTENSION);
        if (!fs.existsSync(originalXmlPath)) {
            return {
                itemName: itemName,
                isAligned: false,
                differences: [`XML file not found: ${originalXmlPath}`],
                isWarning: true
            };
        }

        const originalXmlString = await readStringNormalizedFromFile(originalXmlPath);
        const recordTypeCsvDir = join(csvDir, recordTypeName);
        if (!fs.existsSync(recordTypeCsvDir)) {
            return {
                itemName: itemName,
                isAligned: false,
                differences: [`CSV directory not found: ${recordTypeCsvDir}`],
                isWarning: true
            };
        }

        const mergedXml = await mergeRecordTypeFromCsv(recordTypeName, recordTypeCsvDir, options);
        const tempDir = tmpdir();
        const tempFile = join(tempDir, `temp_${recordTypeName}_${Date.now()}.xml`);
        await writeXmlToFile(tempFile, mergedXml);

        const reconstructedXmlString = await readStringNormalizedFromFile(tempFile);

        try {
            fs.unlinkSync(tempFile);
        } catch (error) {
            // Ignore cleanup errors
        }

        const differences: string[] = [];
        if (originalXmlString.trim() !== reconstructedXmlString.trim()) {
            differences.push('XML content differs between original and reconstructed from CSV');
        }

        return {
            itemName: itemName,
            isAligned: differences.length === 0,
            differences: differences
        };

    } catch (error) {
        return {
            itemName: itemName,
            isAligned: false,
            differences: [`Error processing: ${error.message}`]
        };
    }
}

async function validateSingleRecordTypeForRecord(
    objectName: string,
    recordTypeName: string,
    xmlDir: string,
    csvDir: string,
    options: any
): Promise<ValidationResult> {
    const itemName = `${objectName}/${recordTypeName}`;
    const differences: string[] = [];

    try {
        const xmlFilePath = join(xmlDir, recordTypeName + RECORDTYPES_EXTENSION);
        if (!fs.existsSync(xmlFilePath)) {
            return {
                itemName: itemName,
                isAligned: false,
                differences: [`XML file not found: ${xmlFilePath}`],
                isWarning: true
            };
        }

        const originalXml = await readXmlFromFile(xmlFilePath);
        if (!originalXml || !originalXml[RECORDTYPES_ROOT_TAG]) {
            return {
                itemName: itemName,
                isAligned: false,
                differences: [`Invalid XML structure in: ${xmlFilePath}`]
            };
        }

        const recordTypeCsvDir = join(csvDir, recordTypeName);
        if (!fs.existsSync(recordTypeCsvDir)) {
            return {
                itemName: itemName,
                isAligned: false,
                differences: [`CSV directory not found: ${recordTypeCsvDir}`],
                isWarning: true
            };
        }

        const reconstructedXml = await mergeRecordTypeFromCsv(recordTypeName, recordTypeCsvDir, options);
        const originalData = originalXml[RECORDTYPES_ROOT_TAG] || {};
        const reconstructedData = reconstructedXml[RECORDTYPES_ROOT_TAG] || {};

        for (const sectionName in RECORDTYPE_ITEMS) {
            const originalSection = originalData[sectionName] || [];
            const reconstructedSection = reconstructedData[sectionName] || [];

            const originalArray = Array.isArray(originalSection) ? originalSection : (originalSection ? [originalSection] : []);
            const reconstructedArray = Array.isArray(reconstructedSection) ? reconstructedSection : (reconstructedSection ? [reconstructedSection] : []);

            if (originalArray.length !== reconstructedArray.length) {
                differences.push(`${sectionName}: Count mismatch (XML: ${originalArray.length}, CSV: ${reconstructedArray.length})`);
            } else {
                const sortedOriginal = options.sort === 'true' ? [...originalArray].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : originalArray;
                const sortedReconstructed = options.sort === 'true' ? [...reconstructedArray].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : reconstructedArray;

                for (let i = 0; i < sortedOriginal.length; i++) {
                    const originalItem = JSON.stringify(sortedOriginal[i]);
                    const reconstructedItem = JSON.stringify(sortedReconstructed[i]);
                    
                    if (originalItem !== reconstructedItem) {
                        differences.push(`${sectionName}[${i}]: Structure mismatch`);
                    }
                }
            }
        }

        return {
            itemName: itemName,
            isAligned: differences.length === 0,
            differences: differences
        };

    } catch (error) {
        return {
            itemName: itemName,
            isAligned: false,
            differences: [`Error processing: ${error.message}`]
        };
    }
}
