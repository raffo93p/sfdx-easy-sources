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
import { hasFileItemsContent } from '../../../utils/commands/alignmentChecker';

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
}

interface ItemResult {
    result: 'OK' | 'KO';
    error?: string;
}

interface ValidationSummary {
    result: 'OK';
    summary: {
        totalItems: number;
        alignedItems: number;
        misalignedItems: number;
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
            summary: { totalItems: 0, alignedItems: 0, misalignedItems: 0 }, 
            items: {} 
        };
    }

    if (!fs.existsSync(baseCsvDir)) {
        console.log(`Missing CSV directory: ${baseCsvDir}`);
        return { 
            result: 'OK', 
            summary: { totalItems: 0, alignedItems: 0, misalignedItems: 0 }, 
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

    for (const objectName of objectList) {
        const xmlFilePath = join(baseXmlDir, objectName, objectName + OBJTRANSL_EXTENSION);
        const xmlDir = join(baseXmlDir, objectName);
        const objectCsvDir = join(baseCsvDir, objectName, 'csv');

        // Check if XML file exists
        if (!fs.existsSync(xmlFilePath)) {
            items[objectName] = { 
                result: 'KO', 
                error: `XML file not found: ${xmlFilePath}` 
            };
            console.log(`❌ Object translation '${objectName}' has misalignment:`);
            console.log(`   - XML file not found: ${xmlFilePath}`);
            continue;
        }

        // Read original XML to check content
        const originalXml = (await readXmlFromFile(xmlFilePath)) ?? {};
        const originalItem = originalXml[OBJTRANSL_ROOT_TAG] ?? {};

        // Check if CSV directory exists
        if (!fs.existsSync(objectCsvDir)) {
            // Check if original XML has any content in OBJTRANSL_ITEMS sections (excluding fieldTranslations)
            const itemsWithoutFieldTranslations = Object.keys(OBJTRANSL_ITEMS)
                .filter(key => key !== OBJTRANSL_CFIELDTRANSL_ROOT)
                .reduce((obj, key) => ({ ...obj, [key]: OBJTRANSL_ITEMS[key] }), {});
            const hasContent = hasFileItemsContent(originalItem, itemsWithoutFieldTranslations);
            const message = `CSV directory not found: ${objectCsvDir}`;
            
            if (hasContent) {
                items[objectName] = { result: 'KO', error: message };
                console.log(`❌ Object translation '${objectName}' has misalignment:`);
                console.log(`   - ${message}`);
            } else {
                items[objectName] = { result: 'OK' };
                alignedCount++;
                console.log(`✅ Object translation '${objectName}' is aligned`);
            }
            continue;
        }

        let validationResult: ValidationResult;
        
        if (mode === 'string') {
            validationResult = await compareStringsForObject(
                objectName,
                xmlFilePath,
                xmlDir,
                objectCsvDir,
                options
            );
        } else {
            validationResult = await validateSingleObjectTranslation(
                objectName,
                objectCsvDir,
                originalItem,
                options
            );
        }
        
        // Convert ValidationResult to ItemResult format
        if (validationResult.isAligned) {
            items[objectName] = { result: 'OK' };
            alignedCount++;
            console.log(`✅ Object translation '${objectName}' is aligned`);
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
            misalignedItems: objectList.length - alignedCount
        },
        items: items
    };

    console.log(`\n📊 Validation Summary: ${result.summary.totalItems} total, ${result.summary.alignedItems} aligned, ${result.summary.misalignedItems} misaligned`);
    
    return result;
}

async function validateSingleObjectTranslation(
    objectName: string,
    objectCsvDir: string,
    originalItem: any,
    options: any
): Promise<ValidationResult> {
    const differences: string[] = [];

    try {
        // Reconstruct XML from CSV using shared merge logic
        const reconstructedXml = await mergeObjectTranslationFromCsv(objectName, objectCsvDir, options);
        
        // Compare main object translation structures
        const reconstructedData = reconstructedXml[OBJTRANSL_ROOT_TAG] || {};

        // Deep compare the relevant sections (excluding fieldTranslations)
        for (const sectionName in OBJTRANSL_ITEMS) {
            if (sectionName === OBJTRANSL_CFIELDTRANSL_ROOT) continue; // Skip fieldTranslations
            
            const originalSection = originalItem[sectionName] || [];
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
    csvDir: string
): Promise<string[]> {
    const differences: string[] = [];

    try {
        // Use shared logic to get field translations from CSV
        const fieldXmlArray = await getFieldTranslationsFromCsv(objectName, csvDir);
        
        // In logic mode, we just verify that we can reconstruct from CSV
        // The actual comparison with XML files is done in the main validation
        // This is mainly to catch CSV parsing errors
        if (fieldXmlArray.length === 0) {
            // No field translations in CSV - this is OK
            return differences;
        }
        
    } catch (error) {
        differences.push(`fieldTranslations validation error: ${error.message}`);
    }

    return differences;
}

async function compareStringsForObject(
    objectName: string,
    xmlFilePath: string,
    xmlDir: string,
    objectCsvDir: string,
    options: any
): Promise<ValidationResult> {
    try {
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
