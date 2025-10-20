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
import { 
    OBJTRANSL_ITEMS, 
    OBJTRANSL_EXTENSION, 
    OBJTRANSL_ROOT_TAG, 
    OBJTRANSL_SUBPATH,
    OBJTRANSL_CFIELDTRANSL_ROOT,
    OBJTRANSL_CFIELDTRANSL_ROOT_TAG,
    OBJTRANSL_FIELDTRANSL_EXTENSION
} from '../../../utils/constants/constants_objecttranslations';
import Performance from '../../../utils/performance';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
const fs = require('fs-extra');
import { join } from "path";
import { 
    readXmlFromFile, 
    writeXmlToFile, 
    readStringFromFile 
} from "../../../utils/filesUtils";
import { loadSettings } from "../../../utils/localSettings";
import { tmpdir } from "os";
import { 
    mergeObjectTranslationFromCsv,
    getFieldTranslationsFromCsv
} from './merge';
import { 
    getFieldTranslationFiles
} from '../../../utils/utils_objtransl';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'objtransl_arealigned');

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
        const baseXmlDir = join((this.flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), OBJTRANSL_SUBPATH) as string;
        const baseCsvDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
        const inputObjects = (this.flags.input) as string;

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
            // Get all object translation directories (format: ObjectName-Language)
            objectList = fs.readdirSync(baseXmlDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name);
        }

        const results: ValidationResult[] = [];
        let alignedCount = 0;
        let warningCount = 0;

        for (const objectName of objectList) {
            const result = await this.validateSingleObjectTranslation(
                objectName,
                baseXmlDir,
                baseCsvDir
            );
            
            results.push(result);
            
            if (result.isAligned) {
                alignedCount++;
                console.log(messages.getMessage('validationSuccess', [objectName]));
            } else if (result.isWarning) {
                warningCount++;
                console.log(`⚠️  Object translation '${objectName}' has warnings:`);
                result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
            } else {
                console.log(messages.getMessage('validationError', [objectName]));
                result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
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
            summary.misalignedItems,
            summary.warningItems
        ]));
        
        return summary;
    }

    private async validateSingleObjectTranslation(
        objectName: string,
        xmlDir: string,
        csvDir: string
    ): Promise<ValidationResult> {
        const differences: string[] = [];

        try {
            // Check main object translation XML
            const xmlFilePath = join(xmlDir, objectName, objectName + OBJTRANSL_EXTENSION);
            if (!fs.existsSync(xmlFilePath)) {
                return {
                    itemName: objectName,
                    isAligned: false,
                    differences: [`Main XML file not found: ${xmlFilePath}`],
                    isWarning: true
                };
            }

            const originalXml = await readXmlFromFile(xmlFilePath);
            if (!originalXml || !originalXml[OBJTRANSL_ROOT_TAG]) {
                return {
                    itemName: objectName,
                    isAligned: false,
                    differences: [`Invalid XML structure in: ${xmlFilePath}`]
                };
            }

            // Check CSV directory
            const objectCsvDir = join(csvDir, objectName, 'csv');
            if (!fs.existsSync(objectCsvDir)) {
                return {
                    itemName: objectName,
                    isAligned: false,
                    differences: [`CSV directory not found: ${objectCsvDir}`],
                    isWarning: true
                };
            }

            // Reconstruct XML from CSV using shared merge logic
            const reconstructedXml = await mergeObjectTranslationFromCsv(objectName, objectCsvDir, this.flags);
            
            // Compare main object translation structures
            const originalData = originalXml[OBJTRANSL_ROOT_TAG] || {};
            const reconstructedData = reconstructedXml[OBJTRANSL_ROOT_TAG] || {};

            // Deep compare the relevant sections (excluding fieldTranslations)
            for (const sectionName in OBJTRANSL_ITEMS) {
                if (sectionName === OBJTRANSL_CFIELDTRANSL_ROOT) continue; // Skip fieldTranslations
                
                const originalSection = originalData[sectionName] || [];
                const reconstructedSection = reconstructedData[sectionName] || [];

                // Convert to arrays if they're objects
                const originalArray = Array.isArray(originalSection) ? originalSection : (originalSection ? [originalSection] : []);
                const reconstructedArray = Array.isArray(reconstructedSection) ? reconstructedSection : (reconstructedSection ? [reconstructedSection] : []);

                if (originalArray.length !== reconstructedArray.length) {
                    differences.push(`${sectionName}: Count mismatch (XML: ${originalArray.length}, CSV: ${reconstructedArray.length})`);
                } else if (originalArray.length > 0) {
                    // Sort both arrays for comparison if needed
                    const sortedOriginal = this.flags.sort === 'true' ? [...originalArray].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : originalArray;
                    const sortedReconstructed = this.flags.sort === 'true' ? [...reconstructedArray].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : reconstructedArray;

                    for (let i = 0; i < sortedOriginal.length; i++) {
                        const originalItem = JSON.stringify(sortedOriginal[i]);
                        const reconstructedItem = JSON.stringify(sortedReconstructed[i]);
                        
                        if (originalItem !== reconstructedItem) {
                            differences.push(`${sectionName}[${i}]: Structure mismatch`);
                        }
                    }
                }
            }

            // Validate fieldTranslations separately
            const fieldTranslationsDifferences = await this.validateFieldTranslations(
                objectName, 
                xmlDir, 
                objectCsvDir
            );
            differences.push(...fieldTranslationsDifferences);

            return {
                itemName: objectName,
                isAligned: differences.length === 0,
                differences: differences
            };

        } catch (error) {
            return {
                itemName: objectName,
                isAligned: false,
                differences: [`Error processing: ${error.message}`]
            };
        }
    }

    private async validateFieldTranslations(
        objectName: string,
        xmlDir: string,
        csvDir: string
    ): Promise<string[]> {
        const differences: string[] = [];

        try {
            // Get all existing fieldTranslation XML files
            const objectXmlDir = join(xmlDir, objectName);
            const fieldTranslationFiles = getFieldTranslationFiles(objectXmlDir);
            
            // Use shared logic to get field translations from CSV
            const fieldXmlArray = await getFieldTranslationsFromCsv(objectName, csvDir);

            // Compare counts
            if (fieldTranslationFiles.length !== fieldXmlArray.length) {
                differences.push(`fieldTranslations: File count mismatch (XML: ${fieldTranslationFiles.length}, CSV: ${fieldXmlArray.length})`);
            }

            // Validate each field translation
            for (const fieldEntry of fieldXmlArray) {
                const expectedFileName = fieldEntry.name + OBJTRANSL_FIELDTRANSL_EXTENSION;
                const expectedFilePath = join(objectXmlDir, expectedFileName);
                
                if (!fs.existsSync(expectedFilePath)) {
                    differences.push(`fieldTranslations: Missing XML file for ${fieldEntry.name}`);
                    continue;
                }

                // Compare content
                const originalXml = await readXmlFromFile(expectedFilePath);
                const reconstructedXml = { [OBJTRANSL_CFIELDTRANSL_ROOT_TAG]: fieldEntry };
                
                const originalStr = JSON.stringify(originalXml);
                const reconstructedStr = JSON.stringify(reconstructedXml);
                
                if (originalStr !== reconstructedStr) {
                    differences.push(`fieldTranslations: Content mismatch for ${fieldEntry.name}`);
                }
            }

            // Check for XML files not represented in CSV
            for (const xmlFile of fieldTranslationFiles) {
                const fieldName = xmlFile.replace(OBJTRANSL_FIELDTRANSL_EXTENSION, '');
                const foundInCsv = fieldXmlArray.some(entry => entry.name === fieldName);
                
                if (!foundInCsv) {
                    differences.push(`fieldTranslations: XML file ${xmlFile} not represented in CSV`);
                }
            }
                
        } catch (error) {
            differences.push(`fieldTranslations validation error: ${error.message}`);
        }

        return differences;
    }

    private async areAlignedString(): Promise<ValidationSummary> {
        // String comparison mode - compare the actual XML files
        const baseXmlDir = join((this.flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), OBJTRANSL_SUBPATH) as string;
        const baseCsvDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
        const inputObjects = (this.flags.input) as string;

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
            const result = await this.compareStrings(objectName, baseXmlDir, baseCsvDir);
            
            results.push(result);
            
            if (result.isAligned) {
                alignedCount++;
                console.log(messages.getMessage('validationSuccess', [objectName]));
            } else if (result.isWarning) {
                warningCount++;
                console.log(`⚠️  Object translation '${objectName}' has warnings:`);
                result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
            } else {
                console.log(messages.getMessage('validationError', [objectName]));
                result.differences.forEach(diff => console.log(messages.getMessage('differenceFound', [diff])));
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
            summary.misalignedItems,
            summary.warningItems
        ]));
        
        return summary;
    }

    private async compareStrings(
        objectName: string,
        xmlDir: string,
        csvDir: string
    ): Promise<ValidationResult> {
        try {
            // Read original XML files as strings
            const originalXmlPath = join(xmlDir, objectName, objectName + OBJTRANSL_EXTENSION);
            if (!fs.existsSync(originalXmlPath)) {
                return {
                    itemName: objectName,
                    isAligned: false,
                    differences: [`XML file not found: ${originalXmlPath}`],
                    isWarning: true
                };
            }

            const originalXmlString = await readStringFromFile(originalXmlPath);

            // Check CSV directory
            const objectCsvDir = join(csvDir, objectName, 'csv');
            if (!fs.existsSync(objectCsvDir)) {
                return {
                    itemName: objectName,
                    isAligned: false,
                    differences: [`CSV directory not found: ${objectCsvDir}`],
                    isWarning: true
                };
            }

            // Reconstruct XML from CSV using shared merge logic
            const mergedXml = await mergeObjectTranslationFromCsv(objectName, objectCsvDir, this.flags);

            // Write reconstructed XML to temp file
            const tempDir = tmpdir();
            const tempFile = join(tempDir, `temp_${objectName}_${Date.now()}.xml`);
            await writeXmlToFile(tempFile, mergedXml);

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
                differences.push('Main object translation XML content differs between original and reconstructed from CSV');
            }

            // Also validate fieldTranslations files with string comparison
            const fieldTranslationsDiffs = await this.compareFieldTranslationsStrings(objectName, xmlDir, objectCsvDir);
            differences.push(...fieldTranslationsDiffs);

            return {
                itemName: objectName,
                isAligned: differences.length === 0,
                differences: differences
            };

        } catch (error) {
            return {
                itemName: objectName,
                isAligned: false,
                differences: [`Error processing: ${error.message}`]
            };
        }
    }

    private async compareFieldTranslationsStrings(
        objectName: string,
        xmlDir: string,
        csvDir: string
    ): Promise<string[]> {
        const differences: string[] = [];

        try {
            const objectXmlDir = join(xmlDir, objectName);
            const fieldTranslationFiles = getFieldTranslationFiles(objectXmlDir);
            
            // Use shared logic to get field translations from CSV
            const fieldXmlArray = await getFieldTranslationsFromCsv(objectName, csvDir);

            // For each expected field translation file, reconstruct and compare
            for (const fieldEntry of fieldXmlArray) {
                const expectedFilePath = join(objectXmlDir, fieldEntry.name + OBJTRANSL_FIELDTRANSL_EXTENSION);
                
                if (fs.existsSync(expectedFilePath)) {
                    const originalString = await readStringFromFile(expectedFilePath);
                    
                    // Create temp file for reconstructed content
                    const tempDir = tmpdir();
                    const tempFile = join(tempDir, `temp_field_${fieldEntry.name}_${Date.now()}.xml`);
                    
                    await writeXmlToFile(tempFile, { [OBJTRANSL_CFIELDTRANSL_ROOT_TAG]: fieldEntry });
                    const reconstructedString = await readStringFromFile(tempFile);
                    
                    // Clean up
                    try {
                        fs.unlinkSync(tempFile);
                    } catch (error) {
                        // Ignore cleanup errors
                    }
                    
                    if (originalString.trim() !== reconstructedString.trim()) {
                        differences.push(`fieldTranslations: Content differs for ${fieldEntry.name}`);
                    }
                } else {
                    differences.push(`fieldTranslations: Missing XML file for ${fieldEntry.name}`);
                }
            }
            
            // Check if there are field translation files but no CSV
            if (fieldXmlArray.length === 0 && fieldTranslationFiles.length > 0) {
                differences.push(`fieldTranslations: CSV file missing but ${fieldTranslationFiles.length} XML files exist`);
            }

        } catch (error) {
            differences.push(`fieldTranslations string comparison error: ${error.message}`);
        }

        return differences;
    }
}
