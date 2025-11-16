const fs = require('fs-extra');
import { join } from "path";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from "../constants/constants";
import { readXmlFromFile, writeXmlToFile, areFilesEqual } from "../filesUtils";
import { loadSettings } from "../localSettings";
import { tmpdir } from "os";
import { mergeItemFromCsv } from "./merger";
import { jsonAndPrintError } from "./utils";

const settings = loadSettings();

export interface ValidationResult {
    itemName: string;
    isAligned: boolean;
    differences: string[];
}

export interface ItemResult {
    result: 'OK' | 'KO';
    error?: string;
}

export interface ValidationSummary {
    result: 'OK';
    summary: {
        totalItems: number;
        alignedItems: number;
        misalignedItems: number;
    };
    items: { [itemName: string]: ItemResult };
}

/**
 * Common validation logic that handles both string and logic validation modes
 */
export async function areAligned(
    options: any,
    file_subpath: string,
    file_extension: string,
    file_root_tag: string,
    file_items: any
): Promise<any> {
    const baseXmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), file_subpath) as string;
    const baseCsvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const inputItems = (options.input) as string;
    const mode = options.mode || 'string'; // default to string mode

    // Validate mode parameter
    if (mode !== 'string' && mode !== 'logic') {
        return jsonAndPrintError(`Invalid mode '${mode}'. Mode must be either 'string' or 'logic'.`);
    }

    if (!fs.existsSync(baseXmlDir)) {
        return jsonAndPrintError('XML folder ' + baseXmlDir + ' does not exist!');
    }

    if (!fs.existsSync(baseCsvDir)) {
        return jsonAndPrintError('CSV folder ' + baseCsvDir + ' does not exist!');
    }

    var itemList = [];
    if (inputItems) {
        itemList = inputItems.split(',');
    } else {
        itemList = fs.readdirSync(baseXmlDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(file_extension))
            .map(item => item.name.replace(file_extension, ''));
    }

    const items: { [itemName: string]: ItemResult } = {};
    let alignedCount = 0;

    // Setup for string mode
    let tempDir: string | null = null;
    if (mode === 'string') {
        tempDir = join(tmpdir(), 'easysources-validation', Date.now().toString());
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        for (const itemName of itemList) {
            const xmlFilePath = join(baseXmlDir, itemName + file_extension);
            const csvDirPath = join(baseCsvDir, itemName);
            
            // Check if XML file exists
            if (!fs.existsSync(xmlFilePath)) {
                items[itemName] = { 
                    result: 'KO', 
                    error: `XML file not found: ${xmlFilePath}` 
                };
                console.log(`❌ Item '${itemName}' has misalignment:`);
                console.log(`   - XML file not found: ${xmlFilePath}`);
                continue;
            }

            // Read original XML to check content
            const originalXml = (await readXmlFromFile(xmlFilePath)) ?? {};
            const originalItem = originalXml[file_root_tag] ?? {};

            // Check if CSV directory exists
            if (!fs.existsSync(csvDirPath)) {
                // Check if original XML has any content in file_items sections
                const hasContent = hasFileItemsContent(originalItem, file_items);
                const message = `CSV directory not found: ${csvDirPath}`;
                
                if (hasContent) {
                    items[itemName] = { result: 'KO', error: message };
                    console.log(`❌ Item '${itemName}' has misalignment:`);
                    console.log(`   - ${message}`);
                } else {
                    items[itemName] = { result: 'OK'};
                    alignedCount++;
                    console.log(`✅ Item '${itemName}' is properly aligned`);
                }
                continue;
            }

            let validationResult: ValidationResult;
            
            if (mode === 'string') {
                validationResult = await validateSingleItemWithStringComparison(
                    itemName,
                    xmlFilePath,
                    csvDirPath,
                    tempDir!,
                    file_extension,
                    file_root_tag,
                    file_items,
                    originalItem,
                    options
                );
            } else if (mode === 'logic') {
                validationResult = await validateSingleItem(
                    itemName,
                    csvDirPath,
                    file_root_tag,
                    file_items,
                    originalItem
                );
            }
            
            // Convert ValidationResult to ItemResult format
            if (validationResult.isAligned) {
                items[itemName] = { result: 'OK' };
                alignedCount++;
                console.log(`✅ Item '${itemName}' is properly aligned`);
            } else {
                items[itemName] = { 
                    result: 'KO', 
                    error: validationResult.differences.join('; ') 
                };
                console.log(`❌ Item '${itemName}' has misalignment:`);
                validationResult.differences.forEach(diff => console.log(`   - ${diff}`));
            }
        }
    } finally {
        // Clean up temporary directory if used
        if (tempDir && fs.existsSync(tempDir)) {
            fs.removeSync(tempDir);
        }
    }

    const result: ValidationSummary = {
        result: 'OK',
        summary: {
            totalItems: itemList.length,
            alignedItems: alignedCount,
            misalignedItems: itemList.length - alignedCount
        },
        items: items
    };

    const modeLabel = mode === 'string' ? ' (String Comparison)' : '';
    console.log(`\nValidation Summary${modeLabel}: ${result.summary.totalItems} items validated, ${result.summary.alignedItems} aligned, ${result.summary.misalignedItems} misaligned`);
    
    return result;
}

async function validateSingleItem(
    itemName: string,
    csvDirPath: string,
    file_root_tag: string,
    file_items: any,
    originalItem: any
): Promise<ValidationResult> {
    try {
        // Reconstruct item from CSV files - this returns the XML structure directly
        const reconstructedXml = await reconstructItemFromCsv(itemName, csvDirPath, file_root_tag, file_items);
        const reconstructedItem = reconstructedXml[file_root_tag] ?? reconstructedXml;

        // Compare the two structures
        const differences = compareItems(originalItem, reconstructedItem, file_items);
        return {
            itemName,
            isAligned: differences.length === 0,
            differences
        };

    } catch (error) {
        return {
            itemName,
            isAligned: false,
            differences: [`Error during validation: ${error.message}`]
        };
    }
}

async function reconstructItemFromCsv(itemName: string, csvDirPath: string, file_root_tag: string, file_items: any): Promise<any> {
    // Use the shared merge logic from merger.ts with default options (sort enabled)
    const options = { sort: 'true' };
    try {
        const mergedXml = await mergeItemFromCsv(itemName, csvDirPath, file_root_tag, file_items, options);
        return mergedXml[file_root_tag] ?? mergedXml;
    } catch (error) {
        // If main XML part doesn't exist, return empty object
        return {};
    }
}

function compareItems(original: any, reconstructed: any, file_items: any): string[] {
    const differences: string[] = [];

    // Get all possible sections (from both original and reconstructed)
    const allSections = new Set([
        ...Object.keys(original),
        ...Object.keys(reconstructed),
        ...Object.keys(file_items)
    ]);

    for (const section of allSections) {
        // Skip XML namespace attributes
        if (section === '$') {
            continue;
        }

        const originalValue = original[section];
        const reconstructedValue = reconstructed[section];
        
        // Skip if both values are empty/undefined
        if ((!originalValue || originalValue.length === 0) && 
            (!reconstructedValue || reconstructedValue.length === 0)) {
            continue;
        }

        if (!deepEqual(originalValue, reconstructedValue)) {
            differences.push(`${section}: values differ between XML and CSV representation`);
        }
    }

    return differences;
}

function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
        return true;
    }        

    if (obj1 == null || obj2 == null) {
        return obj1 === obj2;
    }


    // if we only have one item in the original xml, it will be object, while in csv it will be array
    if(!Array.isArray(obj1) && Array.isArray(obj2)){
        return deepEqual(obj1, obj2[0]);
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
            return false;
        }
        
        // Sort both arrays before comparison to handle order differences
        const sorted1 = [...obj1].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        const sorted2 = [...obj2].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

        for (let i = 0; i < sorted1.length; i++) {
            if (!deepEqual(sorted1[i], sorted2[i])) {
                return false;
            }
        }
        return true;
    }

    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (const key of keys1) {
            if (!keys2.includes(key)) {
                return false;
            }
            if (!deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }
        return true;
    }

    return false;
}

/**
 * Check if the original XML item has any content in file_items sections
 * Returns true if at least one file_items section exists and has length > 0
 */
export function hasFileItemsContent(originalItem: any, file_items: any): boolean {
    for (const section of Object.keys(file_items)) {
        const value = originalItem[section];
        if (value && Array.isArray(value) && value.length > 0) {
            return true;
        }
        if (value && !Array.isArray(value) && typeof value === 'object') {
            // Single object counts as content
            return true;
        }
    }
    return false;
}

async function validateSingleItemWithStringComparison(
    itemName: string,
    xmlFilePath: string,
    csvDirPath: string,
    tempDir: string,
    file_extension: string,
    file_root_tag: string,
    file_items: any,
    originalItem: any,
    options: any
): Promise<ValidationResult> {
    try {
        // Create merged XML from CSV files using the same logic as merger.ts
        const mergedXmlPath = join(tempDir, itemName + '_merged' + file_extension);
        await createMergedXmlFromCsv(itemName, csvDirPath, mergedXmlPath, file_root_tag, file_items, options);

        // Use the normalized file comparison utility
        const isAligned = await areFilesEqual(xmlFilePath, mergedXmlPath);
        const differences = isAligned ? [] : ['XML content differs after merge reconstruction'];

        return {
            itemName,
            isAligned,
            differences
        };

    } catch (error) {
        return {
            itemName,
            isAligned: false,
            differences: [`Error during string comparison validation: ${error.message}`]
        };
    }
}

async function createMergedXmlFromCsv(
    itemName: string,
    csvDirPath: string,
    outputPath: string,
    file_root_tag: string,
    file_items: any,
    options: any
): Promise<void> {
    // Use the shared merge logic from merger.ts
    const mergedXml = await mergeItemFromCsv(itemName, csvDirPath, file_root_tag, file_items, options);
    
    // Write the merged XML to file
    await writeXmlToFile(outputPath, mergedXml);
}

