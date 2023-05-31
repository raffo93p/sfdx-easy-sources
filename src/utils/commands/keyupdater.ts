import { calcCsvFilename, readCsvToJsonArray } from '../filesUtils'
import { sortByKey } from "../utils"
import { generateTagId } from '../utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { join } from "path";
import { DEFAULT_ESCSV_PATH } from '../constants/constants';
import { loadSettings } from '../localSettings';
const fs = require('fs-extra');

const settings = loadSettings();

export async function updatekey(flags, file_subpath, file_items) {
    const baseInputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const inputFiles = (flags.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return;
    }

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

            const csvFilePath = join(baseInputDir, dir, calcCsvFilename(dir, tag_section));

            if (fs.existsSync(csvFilePath)) {
                var jsonArray = await readCsvToJsonArray(csvFilePath)

                generateTagId(jsonArray, file_items[tag_section].key, file_items[tag_section].headers);

                if (flags.sort === 'true') {
                    jsonArray = sortByKey(jsonArray);
                }

                const headers = file_items[tag_section].headers;
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ fields: [...headers, '_tagid'], transforms });
                const csv = parser.parse(jsonArray);

                try {
                    fs.writeFileSync(csvFilePath, csv.replaceAll("&#xD;", ""), { flag: 'w+' });
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