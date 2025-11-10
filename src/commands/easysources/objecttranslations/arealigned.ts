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
    readStringNormalizedFromFile
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

        const result = await objectTranslationAreAligned(this.flags);

        Performance.getInstance().end();
        return result;
    }
}

// Export object translation-specific areAligned function for programmatic API
export async function objectTranslationAreAligned(options: any = {}): Promise<ValidationSummary> {
    const baseXmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), OBJTRANSL_SUBPATH) as string;
    const baseCsvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), OBJTRANSL_SUBPATH) as string;
    const inputObjects = (options.input) as string;
    const mode = options.mode || 'string';

    if (!fs.existsSync(baseXmlDir)) {
        console.log(`Missing XML directory: ${baseXmlDir}`);
        return { 
            result: 'OK', 
            summary: { totalItems: 0, alignedItems: 0, misalignedItems: 0, warningItems: 0 }, 
            items: {} 
        };
    }

    if (!fs.existsSync(baseCsvDir)) {
        console.log(`Missing CSV directory: ${baseCsvDir}`);
        return { 
            result: 'OK', 
            summary: { totalItems: 0, alignedItems: 0, misalignedItems: 0, warningItems: 0 }, 
            items: {} 
        };
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

    const items: { [itemName: string]: ItemResult } = {};
    let alignedCount = 0;
    let warningCount = 0;

    for (const objectName of objectList) {
        let validationResult: ValidationResult;
        
        if (mode === 'string') {
            validationResult = await compareStringsForObject(objectName, baseXmlDir, baseCsvDir, options);
        } else {
            validationResult = await validateSingleObjectTranslation(objectName, baseXmlDir, baseCsvDir, options);
        }
        
        // Convert ValidationResult to ItemResult format
        if (validationResult.isAligned) {
            items[objectName] = { result: 'OK' };
            alignedCount++;
            console.log(`✅ Object translation '${objectName}' is aligned`);
        } else if (validationResult.isWarning) {
            items[objectName] = { 
                result: 'WARN', 
                error: validationResult.differences.join('; ') 
            };
            warningCount++;
            console.log(`⚠️  Object translation '${objectName}' has warnings:`);
            validationResult.differences.forEach(diff => console.log(`   - ${diff}`));
        } else {
            items[objectName] = { 
                result: 'KO', 
                error: validationResult.differences.join('; ') 
            };
            console.log(`❌ Object translation '${objectName}' is not aligned:`);
            validationResult.differences.forEach(diff => console.log(`   - ${diff}`));
        }
    }

    const result: ValidationSummary = {
        result: 'OK',
        summary: {
            totalItems: objectList.length,
            alignedItems: alignedCount,
            misalignedItems: objectList.length - alignedCount - warningCount,
            warningItems: warningCount
        },
        items: items
    };

    console.log(`\n📊 Validation Summary: ${result.summary.totalItems} total, ${result.summary.alignedItems} aligned, ${result.summary.misalignedItems} misaligned, ${result.summary.warningItems} warnings`);
    
    return result;
}

async function validateSingleObjectTranslation(
    objectName: string,
    xmlDir: string,
    csvDir: string,
    options: any
): Promise<ValidationResult> {
    const differences: string[] = [];

    try {
        // Check main object translation XML
        const xmlFilePath = join(xmlDir, objectName, objectName + OBJTRANSL_EXTENSION);
        if (!fs.existsSync(xmlFilePath)) {
            return {
                itemName: objectName,
                isAligned: false,
                differences: [`XML file not found: ${xmlFilePath}`],
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
        const reconstructedXml = await mergeObjectTranslationFromCsv(objectName, objectCsvDir, options);
        
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

        // Validate fieldTranslations separately
        const fieldTranslationsDifferences = await validateFieldTranslationsForObject(
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

async function validateFieldTranslationsForObject(
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

async function compareStringsForObject(
    objectName: string,
    xmlDir: string,
    csvDir: string,
    options: any
): Promise<ValidationResult> {
    try {
        // Check main object translation XML
        const xmlFilePath = join(xmlDir, objectName, objectName + OBJTRANSL_EXTENSION);
        if (!fs.existsSync(xmlFilePath)) {
            return {
                itemName: objectName,
                isAligned: false,
                differences: [`XML file not found: ${xmlFilePath}`],
                isWarning: true
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

        const originalXmlString = await readStringNormalizedFromFile(xmlFilePath);

        // Reconstruct XML from CSV using shared merge logic
        const mergedXml = await mergeObjectTranslationFromCsv(objectName, objectCsvDir, options);

        // Write reconstructed XML to temp file
        const tempDir = tmpdir();
        const tempFile = join(tempDir, `temp_${objectName}_${Date.now()}.xml`);
        await writeXmlToFile(tempFile, mergedXml);

        // Read reconstructed XML as string
        const reconstructedXmlString = await readStringNormalizedFromFile(tempFile);

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
        const fieldTranslationsDiffs = await compareFieldTranslationsStringsForObject(objectName, xmlDir, objectCsvDir, options);
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

async function compareFieldTranslationsStringsForObject(
    objectName: string,
    xmlDir: string,
    csvDir: string,
    options: any
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
                const originalString = await readStringNormalizedFromFile(expectedFilePath);
                
                // Create temp file for reconstructed content
                const tempDir = tmpdir();
                const tempFile = join(tempDir, `temp_field_${fieldEntry.name}_${Date.now()}.xml`);
                
                await writeXmlToFile(tempFile, { [OBJTRANSL_CFIELDTRANSL_ROOT_TAG]: fieldEntry });
                const reconstructedString = await readStringNormalizedFromFile(tempFile);
                
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
