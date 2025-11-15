import { join } from "path";
import { DEFAULT_ESCSV_PATH } from '../constants/constants';
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonMap } from "../filesUtils";
import { sortByKey } from "../utils";
import { loadSettings } from '../localSettings';
import CsvWriter from '../csvWriter';
import { jsonAndPrintError } from './utils';
const fs = require('fs-extra');

const settings = loadSettings();

/**
 * Generic delete function for removing entries from CSV files based on tagid patterns
 * Supports wildcard patterns for bulk deletions
 * 
 * @param flags - Command flags containing options
 * @param file_subpath - Subpath for the specific metadata type (e.g., PROFILES_SUBPATH, PERMSETS_SUBPATH)
 * @param file_items - Configuration object containing metadata type definitions and headers
 * @returns Promise with delete operation result
 */
export async function deleteFromCsv(flags: any, file_subpath: string, file_items: any): Promise<any> {
    const csvWriter = new CsvWriter();
    
    const type = flags.type;
    const tagid = flags.tagid;
    
    const baseInputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const inputProfile = flags.input as string;

    try {
        if (!type) throw new Error('Type parameter is required');
        if (!tagid) throw new Error('TagId parameter is required');
        if (!Object.keys(file_items).includes(type)) throw new Error('Invalid type parameter');        
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

    // dir is the profile/permissionset name without the extension
    for (const dir of dirList) {
        try {
            console.log('Deleting on: ' + dir);

            // type is a section (applicationVisibilities, classAccess ecc)
            const csvFilePath = join(baseInputDir, dir, calcCsvFilename(dir, type));
            if (fs.existsSync(csvFilePath)) {
                var jsonMap = await readCsvToJsonMap(csvFilePath);

                for (var k of tagid.split(',')) {
                    const trimmedK = k.trim();
                    
                    // Check if wildcard pattern is used
                    if (trimmedK.startsWith('*') || trimmedK.endsWith('*')) {
                        const keysToDelete = [];
                        
                        if (trimmedK.startsWith('*') && trimmedK.endsWith('*')) {
                            // *esempio* - contains
                            const searchTerm = trimmedK.slice(1, -1);
                            for (const key of jsonMap.keys()) {
                                if (key.includes(searchTerm)) {
                                    keysToDelete.push(key);
                                }
                            }
                        } else if (trimmedK.startsWith('*')) {
                            // *esempio - ends with
                            const searchTerm = trimmedK.slice(1);
                            for (const key of jsonMap.keys()) {
                                if (key.endsWith(searchTerm)) {
                                    keysToDelete.push(key);
                                }
                            }
                        } else if (trimmedK.endsWith('*')) {
                            // esempio* - starts with
                            const searchTerm = trimmedK.slice(0, -1);
                            for (const key of jsonMap.keys()) {
                                if (key.startsWith(searchTerm)) {
                                    keysToDelete.push(key);
                                }
                            }
                        }
                        
                        // Delete all matching keys
                        for (const keyToDelete of keysToDelete) {
                            jsonMap.delete(keyToDelete);
                        }
                    } else {
                        // No wildcard - exact match
                        jsonMap.delete(trimmedK);
                    }
                }
                var jsonArray = Array.from(jsonMap.values());

                const headers = file_items[type].headers;

                if (flags.sort === 'true') {
                    jsonArray = sortByKey(jsonArray);
                }

                try {
                    const csvContent = await csvWriter.toCsv(jsonArray, headers);
                    fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                    throw new Error(`Error writing cleaned CSV for ${dir}, section ${type}`);
                }

                // Item processed successfully
                result.items[dir] = { result: 'OK' };
            }

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
