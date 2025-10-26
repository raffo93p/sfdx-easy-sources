import { calcCsvFilename, readXmlFromFile, removeExtension, writeXmlToFile } from '../filesUtils'
import { generateTagId } from '../utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { join } from "path";
const fs = require('fs-extra');
import { sortByKey } from "../utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../constants/constants';
import { PROFILE_USERPERM_ROOT, PROFILES_SUBPATH } from '../constants/constants_profiles';
import { loadSettings } from '../localSettings';
import { arrayToFlat } from '../flatArrayUtils';

const settings = loadSettings();

export async function split(flags, file_subpath, file_extension, file_root_tag, file_items) {

    const baseInputDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), file_subpath) as string;
    const baseOutputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const ignoreUserPerm = (file_subpath === PROFILES_SUBPATH && (flags.ignoreuserperm === 'true' || settings['ignore-user-permissions']) || false) as boolean;
    const inputFiles = (flags.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return;
    }

    var fileList = [];
    if (inputFiles) {
        fileList = inputFiles.split(',');
    } else {
        fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(file_extension))
            .map(item => item.name)
    }

    for (const filename of fileList) {
        const fullFilename = filename.endsWith(file_extension) ? filename : filename + file_extension;
        console.log('Splitting: ' + fullFilename);

        const inputFile = join(baseInputDir, fullFilename);
        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const fileProperties = xmlFileContent[file_root_tag] ?? {};

        const fileName = removeExtension(fullFilename);
        const outputDir = join(baseOutputDir, fileName);

        // Delete outputDir if it exists to ensure a clean split
        if (fs.existsSync(outputDir)) {
            fs.removeSync(outputDir);
        }

        for (const tag_section in file_items) {
            if(ignoreUserPerm && tag_section == PROFILE_USERPERM_ROOT){
                xmlFileContent[file_root_tag][tag_section] = null;
                continue;
            }

            var myjson = fileProperties[tag_section];

            // skip when tag is not found in the xml
            if (myjson == undefined) continue;
            // fixes scenarios when the tag is one, since it would be read as object and not array
            if (!Array.isArray(myjson)) myjson = [myjson];

            myjson = arrayToFlat(myjson);
            // generate _tagId column
            generateTagId(myjson, file_items[tag_section].key, file_items[tag_section].headers);
            // sorts array by _tagid. sorting is made as string
            if (flags.sort === 'true') {
                myjson = sortByKey(myjson);
            }

            const headers = file_items[tag_section].headers;
            const transforms = [unwind({ paths: headers })];
            var fields = [...headers, '_tagid'];

            const parser = new Parser({ fields: fields, transforms });
            const csv = parser.parse(myjson);

            

            const outputFileCSV = join(outputDir, calcCsvFilename(fileName, tag_section));

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            try {
                fs.writeFileSync(outputFileCSV, csv.replaceAll("&#xD;", ""), { flag: 'w+' });
                // file written successfully
            } catch (err) {
                console.error(err);
            }

            xmlFileContent[file_root_tag][tag_section] = null;

        }
        if (fs.existsSync(outputDir)) {
            const outputFileXML = join(outputDir, fileName + XML_PART_EXTENSION);
            writeXmlToFile(outputFileXML, xmlFileContent);
        }
    }

    return { outputString: 'OK' };
}