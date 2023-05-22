import { calcCsvFilename, readXmlFromFile, removeExtension, writeXmlToFile } from '../filesUtils'
import { generateTagId } from '../utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { join } from "path";
const fs = require('fs-extra');
import { sortByKey } from "../utils"
import { XML_PART_EXTENSION, DEFAULT_PATH } from '../constants/constants';

export async function split(flags, file_subpath, file_extension, file_root_tag, file_items) {

    const baseInputDir = join((flags.dir || DEFAULT_PATH), file_subpath) as string;
    const baseOutputDir = flags.output == null ? baseInputDir : join(flags.output, file_subpath) as string;
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

        for (const tag_section in file_items) {

            var myjson = fileProperties[tag_section];

            // skip when tag is not found in the xml
            if (myjson == undefined) continue;
            // fixes scenarios when the tag is one, since it would be read as object and not array
            if (!Array.isArray(myjson)) myjson = [myjson];


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


    var outputString = 'OK'
    return { outputString };

}