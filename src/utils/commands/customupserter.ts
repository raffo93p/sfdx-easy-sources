import { join } from "path";
import { DEFAULT_ESCSV_PATH } from '../constants/constants';
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonMap } from "../filesUtils";
import { sortByKey, generateTagId } from "../utils";
import { loadSettings } from '../localSettings';
import CsvWriter from '../csvWriter';
import { jsonAndPrintError } from './utils';
const fs = require('fs-extra');

const settings = loadSettings();

/**
 * Generic custom upsert function for adding/updating entries in CSV files
 * Takes a JSON content object and inserts/updates it in the specified CSV files
 * 
 * @param flags - Command flags containing options
 * @param file_subpath - Subpath for the specific metadata type (e.g., PROFILES_SUBPATH, PERMSETS_SUBPATH)
 * @param file_items - Configuration object containing metadata type definitions and headers
 * @returns Promise with custom upsert operation result
 */
export async function customUpsert(flags: any, file_subpath: string, file_items: any): Promise<any> {
    const csvWriter = new CsvWriter();
    
    const type = flags.type;
    const content = flags.content;
    
    const baseInputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const inputProfile = flags.input as string;

    // Parse and validate content parameter
    let contentJson;
    try {
        if (!type) throw new Error('Type parameter is required');
        if (!content) throw new Error('Content parameter is required');
        if (!Object.keys(file_items).includes(type)) throw new Error('Invalid type parameter');
        
        // Check if content is already an object (API usage) or a string (CLI usage)
        if (typeof content === 'object' && content !== null) {
            // Already parsed (API usage)
            contentJson = content;
        } else if (typeof content === 'string') {
            // Parse JSON string (CLI usage)
            try {
                contentJson = JSON.parse(content);
            } catch (error) {
                throw new Error('Content parameter must be valid JSON');
            }
        } else {
            throw new Error('Content must be a JSON string or object');
        }
        
        // Validate that content is an object or array
        if (typeof contentJson !== 'object' || contentJson === null) {
            throw new Error('Content must be a valid JSON object or array');
        }
        
        // Ensure contentJson is always an array for validation
        const contentArray = Array.isArray(contentJson) ? contentJson : [contentJson];
        
        // Validate that each item contains the required key field
        const keyField = file_items[type].key;
        const keyFields = Array.isArray(keyField) ? keyField : [keyField];
        
        for (const item of contentArray) {
            // Check if at least one key field is present
            const hasRequiredKey = keyFields.some(field => item.hasOwnProperty(field));
            if (!hasRequiredKey) {
                const keyFieldsList = keyFields.join(' and ');
                throw new Error(`Content must contain the required key field(s): ${keyFieldsList} for type '${type}'`);
            }
        }
        
        checkDirOrErrorSync(baseInputDir);
    } catch (error) {
        return jsonAndPrintError(error.message);
    }

    // Initialize result object
    const result = { result: 'OK', items: {} };

    var dirList = [];
    if (inputProfile) {
        dirList = inputProfile.split(',');
    } else {
        dirList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    // Ensure contentJson is always an array
    const contentArray = Array.isArray(contentJson) ? contentJson : [contentJson];

    // dir is the profile/permissionset name without the extension
    for (const dir of dirList) {
        try {
            console.log('Custom upserting on: ' + dir);

            // type is a section (applicationVisibilities, classAccess ecc)
            const csvFilePath = join(baseInputDir, dir, calcCsvFilename(dir, type));
            const headers = file_items[type].headers;
            const keyField = file_items[type].key;
            
            var jsonMap;
            if (fs.existsSync(csvFilePath)) {
                jsonMap = await readCsvToJsonMap(csvFilePath);
            } else {
                // If CSV doesn't exist, create a new empty map
                jsonMap = new Map();
            }

            // Process each item in the content array
            for (const newItem of contentArray) {
                // Generate tagid for the new item
                const itemArray = [newItem];
                generateTagId(itemArray, keyField, headers);
                const itemWithTagId = itemArray[0];
                
                // Get the key value from the item
                const keyValue = itemWithTagId._tagid || itemWithTagId[keyField];
                
                if (!keyValue) {
                    console.warn(`Warning: Could not generate key for item in ${dir}, type ${type}. Skipping item.`);
                    continue;
                }
                
                // Upsert the item (add or update)
                jsonMap.set(keyValue, itemWithTagId);
            }

            var jsonArray = Array.from(jsonMap.values());

            if (flags.sort === 'true') {
                jsonArray = sortByKey(jsonArray);
            }

            // Ensure directory exists
            const dirPath = join(baseInputDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            try {
                const csvContent = await csvWriter.toCsv(jsonArray, headers);
                fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                // file written successfully
            } catch (err) {
                console.error(err);
                throw new Error(`Error writing CSV for ${dir}, section ${type}`);
            }

            // Item processed successfully
            result.items[dir] = { result: 'OK' };

        } catch (error) {
            console.error(`Error processing ${dir}:`, error);
            result.items[dir] = { 
                result: 'KO', 
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    return result;
}
