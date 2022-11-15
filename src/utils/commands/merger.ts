const fs = require('fs-extra');
import { join } from "path";
import { CSV_EXTENSION, XML_PART_EXTENSION, DEFAULT_PATH } from "../constants/constants"
import { writeXmlToFile, readCsvToJsonArray, readXmlFromFile } from "../filesUtils"
import { sortByKey } from "../utils"



export async function merge(flags, file_extension, file_root_tag, file_items, file_subpath) {
    const baseInputDir = join((flags.dir || DEFAULT_PATH), file_subpath) as string;
    const baseOutputDir = (flags.output || baseInputDir) as string;
    const inputProfile = (flags.input) as string;

    var dirList = [];
    if (inputProfile) {
        dirList = inputProfile.split(',');
    } else {
        dirList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }
    if (!fs.existsSync(baseOutputDir)) {
        fs.mkdirSync(baseOutputDir);
    }

    // dir is the profile name without the extension
    for (const dir of dirList) {
        console.log('Merging: ' + dir);
        const inputXML = join(baseInputDir, dir, dir) + XML_PART_EXTENSION;
        const mergedXml = (await readXmlFromFile(inputXML)) ?? {};


        // tag_section is each profile section (applicationVisibilities, classAccess ecc)
        for (const tag_section in file_items) {
            const csvFilePath = join(baseInputDir, dir, tag_section) + CSV_EXTENSION;
            if (fs.existsSync(csvFilePath)) {
                var jsonArray = await readCsvToJsonArray(csvFilePath)

                jsonArray = sortByKey(jsonArray);

                for (var i in jsonArray) {
                    delete jsonArray[i]['_tagid']
                }
                mergedXml[file_root_tag][tag_section] = sortByKey(jsonArray);
            }
        }

        const outputFile = join(baseOutputDir, dir + file_extension);

        writeXmlToFile(outputFile, mergedXml);
    }
    var result = 'OK';
    return { result }
}