import { calcCsvFilename, readCsvToJsonArray } from '../filesUtils'
import { sortByKey } from "../utils"
import { generateTagId } from '../utils'
import { join } from "path";
import { DEFAULT_ESCSV_PATH } from '../constants/constants';
import { loadSettings } from '../localSettings';
import { jsonAndPrintError } from './utils';
import CsvWriter from '../csvWriter';
const fs = require('fs-extra');

const settings = loadSettings();

export async function updatekey(flags, file_subpath, file_items) {
    const csvWriter = new CsvWriter();
    
    const baseInputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const inputFiles = (flags.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        return jsonAndPrintError(`Input folder ${baseInputDir} does not exist`);
    }

    // Initialize result object
    const result = { result: 'OK', items: {} };

    var dirList = [];
    if (inputFiles) {
        dirList = inputFiles.split(',');
    } else {
        dirList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    // dir is the file name without the extension
    for (const dir of dirList) {
        console.log('UpdateKey: ' + dir);

        try {
            // tag_Section is each file section (applicationVisibilities, classAccess ecc)
            for (const tag_section in file_items) {
                const csvFilePath = join(baseInputDir, dir, calcCsvFilename(dir, tag_section));

                if (fs.existsSync(csvFilePath)) {
                    var jsonArray = await readCsvToJsonArray(csvFilePath)

                    generateTagId(jsonArray, file_items[tag_section].key, file_items[tag_section].headers);

                    if (flags.sort === 'true') {
                        jsonArray = sortByKey(jsonArray);
                    }

                    const headers = file_items[tag_section].headers;

                    try {
                        const csvContent = await csvWriter.toCsv(jsonArray, headers);
                        fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                        // file written successfully
                    } catch (err) {
                        console.error(err);
                        throw new Error(`Failed to write CSV file ${csvFilePath}: ${err.message}`);

                    }
                }
            }

            // Directory processed successfully
            result.items[dir] = { result: 'OK' };

        } catch (error) {
            // Directory processing failed
            console.error(`Error processing directory ${dir}:`, error);
            result.items[dir] = { 
                result: 'KO', 
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    return result;
}