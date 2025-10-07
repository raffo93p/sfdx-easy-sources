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
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../../../utils/constants/constants';
const fs = require('fs-extra');
import { join } from "path";
import { readXmlFromFile, readCsvToJsonArray, calcCsvFilename, writeXmlToFile, readStringFromFile } from "../../../utils/filesUtils";
import { loadSettings } from "../../../utils/localSettings";
import { sortByKey } from "../../../utils/utils";
import { tmpdir } from "os";
import { transformCSVtoXML } from '../../../utils/utils_recordtypes';

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

interface ValidationSummary {
    totalItems: number;
    alignedItems: number;
    misalignedItems: number;
    warningItems: number;
    results: ValidationResult[];
    [key: string]: any;
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

        let result;
        if (this.flags.mode === 'string') {
            result = await this.areAlignedString();
        } else {
            result = await this.validateAlignmentLogic();
        }

        Performance.getInstance().end();
        return result;
    }

    private async validateAlignmentLogic(): Promise<ValidationSummary> {
        const baseXmlDir = join((this.flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), RECORDTYPES_SUBPATH) as string;
        const baseCsvDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
        const inputObjects = (this.flags.object) as string;
        const inputRecordTypes = (this.flags.recordtype) as string;

        if (!fs.existsSync(baseXmlDir)) {
            console.log(messages.getMessage('missingXmlFile', [baseXmlDir]));
            return { totalItems: 0, alignedItems: 0, misalignedItems: 0, warningItems: 0, results: [] };
        }

        if (!fs.existsSync(baseCsvDir)) {
            console.log(messages.getMessage('missingCsvDirectory', [baseCsvDir]));
            return { totalItems: 0, alignedItems: 0, misalignedItems: 0, warningItems: 0, results: [] };
        }

        var objectList = [];
        if (inputObjects) {
            objectList = inputObjects.split(',');
        } else {
            objectList = fs.readdirSync(baseXmlDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name);
        }

        const results: ValidationResult[] = [];
        let alignedCount = 0;
        let warningCount = 0;

        for (const objectName of objectList) {
            const objectXmlDir = join(baseXmlDir, objectName, 'recordTypes');
            const objectCsvDir = join(baseCsvDir, objectName, 'recordTypes');

            if (!fs.existsSync(objectXmlDir)) continue;
            if (!fs.existsSync(objectCsvDir)) {
                const result: ValidationResult = {
                    itemName: `${objectName}/*`,
                    isAligned: false,
                    differences: [messages.getMessage('missingCsvDirectory', [objectCsvDir])],
                    isWarning: true
                };
                results.push(result);
                warningCount++;
                console.log(`⚠️  ${result.itemName} has warnings:`);
                result.differences.forEach(diff => console.log(`   - ${diff}`));
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
                const fullName = `${objectName}.${recordTypeName}`;
                const result = await this.validateSingleRecordType(
                    objectName,
                    recordTypeName,
                    objectXmlDir,
                    objectCsvDir
                );
                
                results.push(result);
                
                if (result.isAligned) {
                    alignedCount++;
                    console.log(messages.getMessage('validationSuccess', [fullName]));
                } else if (result.isWarning) {
                    warningCount++;
                    console.log(`⚠️  Record type '${fullName}' has warnings:`);
                    result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
                } else {
                    console.log(messages.getMessage('validationError', [fullName]));
                    result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
                }
            }
        }

        const summary: ValidationSummary = {
            totalItems: results.length,
            alignedItems: alignedCount,
            misalignedItems: results.length - alignedCount - warningCount,
            warningItems: warningCount,
            results: results
        };

        console.log(messages.getMessage('validationSummary', [
            summary.totalItems,
            summary.alignedItems,
            summary.misalignedItems
        ]));
        
        return summary;
    }

    private async validateSingleRecordType(
        objectName: string,
        recordTypeName: string,
        xmlDir: string,
        csvDir: string
    ): Promise<ValidationResult> {
        const fullName = `${objectName}.${recordTypeName}`;
        const differences: string[] = [];

        try {
            // Read original XML
            const xmlFilePath = join(xmlDir, recordTypeName + RECORDTYPES_EXTENSION);
            if (!fs.existsSync(xmlFilePath)) {
                return {
                    itemName: fullName,
                    isAligned: false,
                    differences: [`XML file not found: ${xmlFilePath}`],
                    isWarning: true
                };
            }

            const originalXml = await readXmlFromFile(xmlFilePath);
            if (!originalXml || !originalXml[RECORDTYPES_ROOT_TAG]) {
                return {
                    itemName: fullName,
                    isAligned: false,
                    differences: [`Invalid XML structure in: ${xmlFilePath}`]
                };
            }

            // Check CSV directory
            const recordTypeCsvDir = join(csvDir, recordTypeName);
            if (!fs.existsSync(recordTypeCsvDir)) {
                return {
                    itemName: fullName,
                    isAligned: false,
                    differences: [`CSV directory not found: ${recordTypeCsvDir}`],
                    isWarning: true
                };
            }

            // Reconstruct XML from CSV
            const reconstructedXml = { [RECORDTYPES_ROOT_TAG]: {} };
            
            // Read and merge CSV data
            for (const sectionName in RECORDTYPE_ITEMS) {
                const csvFilePath = join(recordTypeCsvDir, calcCsvFilename(recordTypeName, sectionName));
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath);

                    if (this.flags.sort === 'true') {
                        jsonArray = sortByKey(jsonArray);
                    }

                    // Remove _tagid for comparison
                    for (var i in jsonArray) {
                        delete jsonArray[i]['_tagid'];
                    }

                    var jsonArrayForXML = transformCSVtoXML(jsonArray);
                    if (jsonArrayForXML && jsonArrayForXML.length > 0) {
                        reconstructedXml[RECORDTYPES_ROOT_TAG][sectionName] = jsonArrayForXML;
                    }
                }
            }

            // Compare structures
            const originalData = originalXml[RECORDTYPES_ROOT_TAG] || {};
            const reconstructedData = reconstructedXml[RECORDTYPES_ROOT_TAG] || {};

            // Deep compare the relevant sections
            for (const sectionName in RECORDTYPE_ITEMS) {
                const originalSection = originalData[sectionName] || [];
                const reconstructedSection = reconstructedData[sectionName] || [];

                // Convert to arrays if they're objects
                const originalArray = Array.isArray(originalSection) ? originalSection : (originalSection ? [originalSection] : []);
                const reconstructedArray = Array.isArray(reconstructedSection) ? reconstructedSection : (reconstructedSection ? [reconstructedSection] : []);

                if (originalArray.length !== reconstructedArray.length) {
                    differences.push(`${sectionName}: Count mismatch (XML: ${originalArray.length}, CSV: ${reconstructedArray.length})`);
                } else {
                    // Sort both arrays for comparison if needed
                    const sortedOriginal = this.flags.sort === 'true' ? [...originalArray].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : originalArray;
                    const sortedReconstructed = this.flags.sort === 'true' ? [...reconstructedArray].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : reconstructedArray;

                    for (let i = 0; i < sortedOriginal.length; i++) {
                        const originalItem = JSON.stringify(sortedOriginal[i]);
                        const reconstructedItem = JSON.stringify(sortedReconstructed[i]);
                        
                        if (originalItem !== reconstructedItem) {
                            differences.push(`${sectionName}[${i}]: Structure mismatch`);
                            // Could add more detailed diff here if needed
                        }
                    }
                }
            }

            return {
                itemName: fullName,
                isAligned: differences.length === 0,
                differences: differences
            };

        } catch (error) {
            return {
                itemName: fullName,
                isAligned: false,
                differences: [`Error processing: ${error.message}`]
            };
        }
    }

    private async areAlignedString(): Promise<ValidationSummary> {
        // String comparison mode - compare the actual XML files
        const baseXmlDir = join((this.flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), RECORDTYPES_SUBPATH) as string;
        const baseCsvDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
        const inputObjects = (this.flags.object) as string;
        const inputRecordTypes = (this.flags.recordtype) as string;

        if (!fs.existsSync(baseXmlDir)) {
            console.log(messages.getMessage('missingXmlFile', [baseXmlDir]));
            return { totalItems: 0, alignedItems: 0, misalignedItems: 0, warningItems: 0, results: [] };
        }

        if (!fs.existsSync(baseCsvDir)) {
            console.log(messages.getMessage('missingCsvDirectory', [baseCsvDir]));
            return { totalItems: 0, alignedItems: 0, misalignedItems: 0, warningItems: 0, results: [] };
        }

        var objectList = [];
        if (inputObjects) {
            objectList = inputObjects.split(',');
        } else {
            objectList = fs.readdirSync(baseXmlDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name);
        }

        const results: ValidationResult[] = [];
        let alignedCount = 0;
        let warningCount = 0;

        for (const objectName of objectList) {
            const objectXmlDir = join(baseXmlDir, objectName, 'recordTypes');
            const objectCsvDir = join(baseCsvDir, objectName, 'recordTypes');

            if (!fs.existsSync(objectXmlDir)) continue;
            if (!fs.existsSync(objectCsvDir)) {
                const result: ValidationResult = {
                    itemName: `${objectName}/*`,
                    isAligned: false,
                    differences: [messages.getMessage('missingCsvDirectory', [objectCsvDir])],
                    isWarning: true
                };
                results.push(result);
                warningCount++;
                console.log(`⚠️  ${result.itemName} has warnings:`);
                result.differences.forEach(diff => console.log(`   - ${diff}`));
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
                const fullName = `${objectName}.${recordTypeName}`;
                const result = await this.compareStrings(objectName, recordTypeName, objectXmlDir, objectCsvDir);
                
                results.push(result);
                
                if (result.isAligned) {
                    alignedCount++;
                    console.log(messages.getMessage('validationSuccess', [fullName]));
                } else if (result.isWarning) {
                    warningCount++;
                    console.log(`⚠️  Record type '${fullName}' has warnings:`);
                    result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
                } else {
                    console.log(messages.getMessage('validationError', [fullName]));
                    result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
                }
            }
        }

        const summary: ValidationSummary = {
            totalItems: results.length,
            alignedItems: alignedCount,
            misalignedItems: results.length - alignedCount - warningCount,
            warningItems: warningCount,
            results: results
        };

        console.log(messages.getMessage('validationSummary', [
            summary.totalItems,
            summary.alignedItems,
            summary.misalignedItems
        ]));
        
        return summary;
    }

    private async compareStrings(
        objectName: string,
        recordTypeName: string,
        xmlDir: string,
        csvDir: string
    ): Promise<ValidationResult> {
        const fullName = `${objectName}.${recordTypeName}`;

        try {
            // Read original XML file as string
            const originalXmlPath = join(xmlDir, recordTypeName + RECORDTYPES_EXTENSION);
            if (!fs.existsSync(originalXmlPath)) {
                return {
                    itemName: fullName,
                    isAligned: false,
                    differences: [`XML file not found: ${originalXmlPath}`],
                    isWarning: true
                };
            }

            const originalXmlString = await readStringFromFile(originalXmlPath);

            // Check CSV directory
            const recordTypeCsvDir = join(csvDir, recordTypeName);
            if (!fs.existsSync(recordTypeCsvDir)) {
                return {
                    itemName: fullName,
                    isAligned: false,
                    differences: [`CSV directory not found: ${recordTypeCsvDir}`],
                    isWarning: true
                };
            }

            // Reconstruct XML from CSV and merge
            const inputXML = join(recordTypeCsvDir, recordTypeName) + XML_PART_EXTENSION;
            const mergedXml = (await readXmlFromFile(inputXML)) ?? {};

            for (const sectionName in RECORDTYPE_ITEMS) {
                const csvFilePath = join(recordTypeCsvDir, calcCsvFilename(recordTypeName, sectionName));
                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath);

                    if (this.flags.sort === 'true') {
                        jsonArray = sortByKey(jsonArray);
                    }

                    for (var i in jsonArray) {
                        delete jsonArray[i]['_tagid'];
                    }

                    var jsonArrayForXML = transformCSVtoXML(jsonArray);
                    mergedXml[RECORDTYPES_ROOT_TAG][sectionName] = jsonArrayForXML;
                }
            }

            // Write reconstructed XML to temp file
            const tempDir = tmpdir();
            const tempFile = join(tempDir, `temp_${recordTypeName}_${Date.now()}.xml`);
            writeXmlToFile(tempFile, mergedXml);

            // Read reconstructed XML as string
            const reconstructedXmlString = await readStringFromFile(tempFile);

            // Clean up temp file
            try {
                fs.unlinkSync(tempFile);
            } catch (error) {
                // Ignore cleanup errors
            }

            // Compare strings
            const differences: string[] = [];
            if (originalXmlString.trim() !== reconstructedXmlString.trim()) {
                differences.push('XML content differs between original and reconstructed from CSV');
            }

            return {
                itemName: fullName,
                isAligned: differences.length === 0,
                differences: differences
            };

        } catch (error) {
            return {
                itemName: fullName,
                isAligned: false,
                differences: [`Error processing: ${error.message}`]
            };
        }
    }
}
