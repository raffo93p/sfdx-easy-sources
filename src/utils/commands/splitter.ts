import { readXmlFromFile, removeExtension, writeXmlToFile } from '../filesUtils'
import { generateTagId } from '../utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { basename, join } from "path";
const fs = require('fs-extra');
import { sortByKey } from "../utils"
import { CSV_EXTENSION, XML_PART_EXTENSION, DEFAULT_PATH } from '../constants/constants';

export async function split(flags, file_subpath, file_extension, file_root_tag, file_items) {

    const baseInputDir = join((flags.dir || DEFAULT_PATH), file_subpath) as string;
    const baseOutputDir = join((flags.output || baseInputDir), file_subpath) as string;
    const inputFiles = (flags.input) as string;

    var fileList = [];

    if (inputFiles) {
        fileList = inputFiles.split(',');
    } else {
        fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(file_extension))
            .map(item => item.name)
    }

    for (const filename of fileList) {
        console.log('Splitting: ' + filename);

        const inputFile = join(baseInputDir, filename);
        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const fileProperties = xmlFileContent[file_root_tag] ?? {};

        const fileName = removeExtension(basename(inputFile));
        const outputDir = join(baseOutputDir, fileName);

        for (const tag_section in file_items) {

            var myjson = fileProperties[tag_section];
            if (myjson == undefined) continue;

            // generate _tagId column
            generateTagId(myjson, file_items[tag_section].key, file_items[tag_section].headers);
            myjson = sortByKey(myjson);

            const headers = file_items[tag_section].headers;
            const transforms = [unwind({ paths: headers })];

            const parser = new Parser({ transforms });
            const csv = parser.parse(myjson);


            const outputFileCSV = join(outputDir, tag_section) + CSV_EXTENSION;

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            try {
                fs.writeFileSync(outputFileCSV, csv, { flag: 'w+' });
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


    var outputString = 'OK'
    return { outputString };

}