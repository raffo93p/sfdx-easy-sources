/**
 * Shared minify logic for removing entries based on boolean/empty field values.
 */
import fs from 'fs-extra';
import { join } from "path";
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArray } from '../filesUtils.js';
import { sortByKey, toArray } from '../utils.js';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../constants/constants.js';
import { loadSettings } from '../localSettings.js';
import { jsonAndPrintError } from './utils.js';
import CsvWriter from '../csvWriter.js';

const settings = loadSettings();

export type FilterFn = (res: any, tag_section: string, tagBool: Record<string, string[]>) => boolean;

/**
 * Standard boolean filter: keeps entries where at least one boolean field is 'true' or 'FALSE'.
 * Used by profiles and permissionsets.
 */
export const booleanFilter: FilterFn = (res, tag_section, tagBool) => {
    if (tagBool[tag_section] == null) return true;
    for (const boolName of toArray(tagBool[tag_section])) {
        if (res[boolName] === 'true' || res[boolName] === 'FALSE') return true;
    }
    return false;
};

/**
 * Non-blank filter: keeps entries where at least one field is non-blank.
 * Used by translations and object translations.
 */
export const nonBlankFilter: FilterFn = (res, tag_section, tagBool) => {
    if (tagBool[tag_section] == null) return true;
    for (const boolName of toArray(tagBool[tag_section])) {
        if (res[boolName] != undefined && res[boolName] != null && res[boolName] !== '') return true;
    }
    return false;
};

/**
 * Core minify logic shared across metadata types.
 */
export async function minify(
    flags: any,
    file_subpath: string,
    file_items: Record<string, any>,
    file_tag_bool: Record<string, string[]>,
    filter_fn: FilterFn
): Promise<any> {
    const csvWriter = new CsvWriter();
    const csvDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const xmlDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;

    const inputItems = flags.input as string;

    try {
        checkDirOrErrorSync(csvDir);
        checkDirOrErrorSync(xmlDir);
    } catch (error) {
        return jsonAndPrintError(error.message);
    }

    const result = { result: 'OK', items: {} };

    let itemList = [];
    if (inputItems) {
        itemList = inputItems.split(',');
    } else {
        itemList = fs.readdirSync(csvDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name);
    }

    for (const itemName of itemList) {
        console.log('Minifying on: ' + itemName);

        try {
            for (const tag_section in file_items) {
                const csvFilePath = join(csvDir, itemName, calcCsvFilename(itemName, tag_section));
                if (fs.existsSync(csvFilePath)) {
                    let resListCsv = await readCsvToJsonArray(csvFilePath);

                    resListCsv = resListCsv.filter((res) => filter_fn(res, tag_section, file_tag_bool));

                    const headers = file_items[tag_section].headers;

                    if (flags.sort !== 'false') {
                        resListCsv = sortByKey(resListCsv);
                    }

                    try {
                        const csvContent = await csvWriter.toCsv(resListCsv, headers);
                        fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                    } catch (err) {
                        console.error(err);
                        throw new Error(`Failed to write CSV file ${csvFilePath}: ${err.message}`);
                    }
                }
            }

            result.items[itemName] = { result: 'OK' };
        } catch (error) {
            console.error(`Error minifying ${itemName}:`, error);
            result.items[itemName] = {
                result: 'KO',
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    return result;
}
