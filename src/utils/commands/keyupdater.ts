import { readCsvToJsonArray } from '../filesUtils'
import { sortByKey } from "../utils"
import { generateTagId } from '../utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { join } from "path";
import { CSV_EXTENSION, DEFAULT_PATH } from '../constants/constants';
const fs = require('fs-extra');

export async function updatekey(flags, file_subpath, file_items) {
    const baseInputDir = join((flags.dir || DEFAULT_PATH), file_subpath) as string;
    const inputFiles = (flags.input) as string;

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

        // tag_Section is each file section (applicationVisibilities, classAccess ecc)
        for (const tag_section in file_items) {

            const csvFilePath = join(baseInputDir, dir, tag_section) + CSV_EXTENSION;

            if (fs.existsSync(csvFilePath)) {
                var jsonArray = await readCsvToJsonArray(csvFilePath)

                generateTagId(jsonArray, file_items[tag_section].key, file_items[tag_section].headers);
                sortByKey(jsonArray);

                const headers = file_items[tag_section];
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ headers, transforms });
                const csv = parser.parse(jsonArray);

                try {
                    fs.writeFileSync(csvFilePath, csv, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                }
            }
        }

    }

    var outputString = 'OK'
    return { outputString };

}