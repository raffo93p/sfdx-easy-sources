const fs = require('fs-extra');
import { join } from "path";
import { XML_PART_EXTENSION, DEFAULT_PATH } from "../constants/constants"
import { writeXmlToFile, readCsvToJsonArray, readXmlFromFile, calcCsvFilename } from "../filesUtils"
import { sortByKey } from "../utils"



export async function merge(flags, file_subpath, file_extension, file_root_tag, file_items) {
    const baseInputDir = join((flags.dir || DEFAULT_PATH), file_subpath) as string;
    const baseOutputDir = flags.output == null ? baseInputDir : join(flags.output, file_subpath) as string;
    const inputProfile = (flags.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return;
    }

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

    // dir is the file name without the extension
    for (const dir of dirList) {
        console.log('Merging: ' + dir);
        const inputXML = join(baseInputDir, dir, dir) + XML_PART_EXTENSION;
        const mergedXml = (await readXmlFromFile(inputXML)) ?? {};


        // tag_section is each file section (applicationVisibilities, classAccess ecc)
        for (const tag_section in file_items) {
            const csvFilePath = join(baseInputDir, dir, calcCsvFilename(dir, tag_section));
            if (fs.existsSync(csvFilePath)) {
                var jsonArray = await readCsvToJsonArray(csvFilePath)

                if (flags.sort === 'true') {
                    jsonArray = sortByKey(jsonArray);
                }

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