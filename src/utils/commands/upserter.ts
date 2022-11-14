import { readXmlFromFile, readCsvToJsonMap, jsonArrayToMap, removeExtension, writeXmlToFile } from '../filesUtils'
import { sortByKey, generateTagId } from "../utils"
const { Parser, transforms: { unwind } } = require('json2csv');
import { join } from "path";
import { CSV_EXTENSION, XML_PART_EXTENSION } from '../constants/constants';
const fs = require('fs-extra');

export async function upsert(flags, default_path, file_extension, file_root_tag, file_items) {
    const baseInputDir = (flags.dir || default_path) as string;
    const baseOutputDir = (flags.output || baseInputDir) as string;
    const inputFiles = (flags.input) as string;

    var fileList = []
    if (inputFiles) {
        fileList = inputFiles.split(',');
    } else {
        fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(file_extension))
            .map(item => item.name)
    }

    for (const filename of fileList) {
        console.log('Upserting: ' + filename);

        const inputFile = join(baseInputDir, filename);

        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const fileProperties = xmlFileContent[file_root_tag] ?? {};

        const fileName = removeExtension(filename);
        const outputDir = join(baseOutputDir, fileName);

        for (const tag_section in file_items) {

            var jsonArrayNew = fileProperties[tag_section];
            if (jsonArrayNew == undefined) continue;

            generateTagId(jsonArrayNew, file_items[tag_section].key, file_items[tag_section].headers)

            const headers = file_items[tag_section].headers;
            const transforms = [unwind({ paths: headers })];
            const parser = new Parser({ headers, transforms });


            const outputFile = join(outputDir, tag_section) + CSV_EXTENSION;

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            if (fs.existsSync(outputFile)) {
                const csvFilePath = join(baseOutputDir, fileName, tag_section + CSV_EXTENSION);

                var jsonMapOld = await readCsvToJsonMap(csvFilePath);
                var jsonMapNew = jsonArrayToMap(jsonArrayNew)

                for (var k in jsonMapNew) {
                    jsonMapOld[k] = jsonMapNew[k];
                }
                jsonArrayNew = Object.values(jsonMapOld);

            }

            try {
                jsonArrayNew = sortByKey(jsonArrayNew);
                const csv = parser.parse(jsonArrayNew);
                fs.writeFileSync(outputFile, csv, { flag: 'w+' });
                // file written successfully
            } catch (err) {
                console.error(err);
            }
            xmlFileContent[file_root_tag][tag_section] = null;


        }

        const inputFilePart = join(baseInputDir, fileName, fileName + XML_PART_EXTENSION);
        if (fs.existsSync(inputFilePart)) {
            const xmlFileContentPart = (await readXmlFromFile(inputFilePart)) ?? {};
            const filePropertiesPart = xmlFileContentPart[file_root_tag] ?? {};

            for (var k in fileProperties) {
                filePropertiesPart[k] = fileProperties[k];
            }

            writeXmlToFile(inputFilePart, filePropertiesPart);
        } else {
            writeXmlToFile(inputFilePart, fileProperties);
        }
    }


    var outputString = 'OK'
    return { outputString };
}
