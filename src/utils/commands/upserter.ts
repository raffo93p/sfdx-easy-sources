import { readXmlFromFile, readCsvToJsonMap, jsonArrayCsvToMap, removeExtension, writeXmlToFile, calcCsvFilename } from '../filesUtils'
import { sortByKey, generateTagId } from "../utils"
const { Parser, transforms: { unwind } } = require('json2csv');
import { join } from "path";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../constants/constants';
import { PROFILE_USERPERM_ROOT } from '../constants/constants_profiles';
import { loadSettings } from '../localSettings';
const fs = require('fs-extra');

const settings = loadSettings();

export async function upsert(flags, file_subpath, file_extension, file_root_tag, file_items) {
    
    const baseInputDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), file_subpath) as string;
    const baseOutputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const inputFiles = (flags.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return;
    }

    var fileList = []
    if (inputFiles) {
        fileList = inputFiles.split(',');
    } else {
        fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(file_extension))
            .map(item => item.name)
    }

    for (const filename of fileList) {
        const fullFilename = filename.endsWith(file_extension) ? filename : filename + file_extension;
        console.log('Upserting: ' + fullFilename);

        const inputFile = join(baseInputDir, fullFilename);

        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const fileProperties = xmlFileContent[file_root_tag] ?? {};

        const fileName = removeExtension(fullFilename);
        const outputDir = join(baseOutputDir, fileName);

        for (const tag_section in file_items) {
            if(flags.ignoreuserperm === 'true' && tag_section == PROFILE_USERPERM_ROOT){
                xmlFileContent[file_root_tag][tag_section] = null;
                continue;
            } 

            var jsonArrayNew = fileProperties[tag_section];
            if (jsonArrayNew == undefined) continue;
            if (!Array.isArray(jsonArrayNew)) jsonArrayNew = [jsonArrayNew];

            generateTagId(jsonArrayNew, file_items[tag_section].key, file_items[tag_section].headers)

            const headers = file_items[tag_section].headers;
            const transforms = [unwind({ paths: headers })];
            const parser = new Parser({ fields: [...headers, '_tagid'], transforms });


            const outputFile = join(outputDir, calcCsvFilename(fileName, tag_section));

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            if (fs.existsSync(outputFile)) {
                const csvFilePath = join(baseOutputDir, fileName, calcCsvFilename(fileName, tag_section));

                var jsonMapOld = await readCsvToJsonMap(csvFilePath);
                var jsonMapNew = jsonArrayCsvToMap(jsonArrayNew)

                jsonMapNew.forEach((value, key) => {
                    jsonMapOld.set(key as string, value)
                });

                jsonArrayNew = Array.from(jsonMapOld.values());
                
            }

            if (flags.sort === 'true') {
                jsonArrayNew = sortByKey(jsonArrayNew);
            }

            try {
                const csv = parser.parse(jsonArrayNew);
                fs.writeFileSync(outputFile, csv.replaceAll("&#xD;", ""), { flag: 'w+' });
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

            writeXmlToFile(inputFilePart, xmlFileContentPart);
        } else {
            writeXmlToFile(inputFilePart, fileProperties);
        }
    }


    var outputString = 'OK'
    return { outputString };
}
