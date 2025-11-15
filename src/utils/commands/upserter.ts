import { readXmlFromFile, readCsvToJsonMap, jsonArrayCsvToMap, removeExtension, writeXmlToFile, calcCsvFilename } from '../filesUtils'
import { sortByKey, generateTagId } from "../utils"
import { split } from './splitter'
import { join } from "path";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../constants/constants';
import { PROFILE_USERPERM_ROOT, PROFILES_SUBPATH } from '../constants/constants_profiles';
import { loadSettings } from '../localSettings';
import { jsonAndPrintError } from './utils';
import CsvWriter from '../csvWriter';
import { sortObjectKeys } from './utils';
const fs = require('fs-extra');

const settings = loadSettings();

export async function upsert(flags, file_subpath, file_extension, file_root_tag, file_items) {
    const csvWriter = new CsvWriter();

    const baseInputDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), file_subpath) as string;
    const baseOutputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const ignoreUserPerm = (file_subpath === PROFILES_SUBPATH && (flags.ignoreuserperm === 'true' || settings['ignore-user-permissions']) || false) as boolean;
    const inputFiles = (flags.input) as string;

    // Validate that tagid cannot be used without type
    const hasType = flags.type !== undefined;
    const hasTagid = flags.tagid !== undefined;
    
    if (hasTagid && !hasType) {
        return jsonAndPrintError(`tagid (-k) parameter can only be used together with type (-t) parameter`);
    }

    // Validate that specified types exist in file_items configuration
    if (hasType) {
        const specifiedTypes = flags.type.split(',');
        const availableTypes = Object.keys(file_items);
        const invalidTypes = specifiedTypes.filter(type => !availableTypes.includes(type.trim()));
        
        if (invalidTypes.length > 0) {
            return jsonAndPrintError(`Invalid type(s) specified: ${invalidTypes.join(', ')}\nAvailable types are: ${availableTypes.join(', ')}`);
        }
    }

    if (!fs.existsSync(baseInputDir)) {
        return jsonAndPrintError(`Input folder ${baseInputDir} does not exist`);
    }

    // Initialize result object
    const result = { result: 'OK', items: {} };

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
        const fileName = removeExtension(fullFilename);
        
        console.log('Upserting: ' + fullFilename);

        try {
            const outputDir = join(baseOutputDir, fileName);
            const inputFilePart = join(baseOutputDir, fileName, fileName + XML_PART_EXTENSION);

            // If outputDir or inputFilePart doesn't exist, run split command instead
            if (!fs.existsSync(outputDir) || !fs.existsSync(inputFilePart)) {
                // If we're targeting specific types or tagids, skip this file since split would create all types
                if (flags.type || flags.tagid) {
                    console.log(`⚠️ Skipping ${fullFilename}: Output csv directory or -part.xml file not found and specific type/tagid filtering is active`);
                        result.items[fileName] = { 
                            result: 'KO', 
                            error: 'Output csv directory or -part.xml file not found and specific type/tagid filtering is active'
                        };
                    continue;
                }
                
                console.log('⚠️ Output csv directory or -part.xml file not found. Running split command for: ' + fullFilename);
                // Create flags object with just the current file
                const splitFlags = {
                    ...flags,
                    input: fullFilename
                };
                const splitResult = await split(splitFlags, file_subpath, file_extension, file_root_tag, file_items);
                if ('items' in splitResult && splitResult.items[fileName]) {
                    // result.items[fileName] = { result: splitResult.items[fileName].status, error: splitResult.items[fileName].error };
                    result.items[fileName] = splitResult.items[fileName];
                } else {
                    result.items[fileName] = { result: 'KO', error: 'Split operation failed' };
                }
                continue;
            }

            const inputFile = join(baseInputDir, fullFilename);
            const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
            const fileProperties = xmlFileContent[file_root_tag] ?? {};

            // Determine which sections to process based on flags.type
            const sectionsToProcess = flags.type ? flags.type.split(',') : Object.keys(file_items);

            for (const tag_section of sectionsToProcess) {
                // Skip if the section doesn't exist in file_items
                if (!file_items[tag_section]) {
                    console.log(`Warning: Type '${tag_section}' not found in file items configuration`);
                    continue;
                }
                if(ignoreUserPerm && tag_section == PROFILE_USERPERM_ROOT){
                    xmlFileContent[file_root_tag][tag_section] = null;
                    continue;
                } 

                var jsonArrayNew = fileProperties[tag_section];
                if (jsonArrayNew == undefined) continue;
                if (!Array.isArray(jsonArrayNew)) jsonArrayNew = [jsonArrayNew];

                generateTagId(jsonArrayNew, file_items[tag_section].key, file_items[tag_section].headers)

                const headers = file_items[tag_section].headers;
                const outputFile = join(outputDir, calcCsvFilename(fileName, tag_section));

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                if (fs.existsSync(outputFile)) {
                    var jsonMapOld = await readCsvToJsonMap(outputFile);
                    var jsonMapNew = jsonArrayCsvToMap(jsonArrayNew)

                    // If tagid is specified, only update entries with matching tagid(s)
                    if (flags.tagid) {
                        const targetTagids = flags.tagid.split(',').map(id => id.trim());
                        jsonMapNew.forEach((value, key) => {
                            if (targetTagids.includes((value as any)._tagid)) {
                                jsonMapOld.set(key as string, value);
                            }
                        });
                    } else {
                        jsonMapNew.forEach((value, key) => {
                            jsonMapOld.set(key as string, value);
                        });
                    }

                    jsonArrayNew = Array.from(jsonMapOld.values());
                } else if (flags.tagid) {
                    // If tagid is specified but no existing CSV file, filter the new array
                    const targetTagids = flags.tagid.split(',').map(id => id.trim());
                    jsonArrayNew = jsonArrayNew.filter(item => targetTagids.includes((item as any)._tagid));
                    
                    // If no items match the tagid(s), skip creating the file
                    if (jsonArrayNew.length === 0) {
                        console.log(`⚠️ No items found with tagid(s) '${flags.tagid}' in section '${tag_section}' for file '${fullFilename}'. Skipping CSV creation.`);
                        continue;
                    }
                }

                if (flags.sort === 'true') {
                    jsonArrayNew = sortByKey(jsonArrayNew);
                }

                try {
                    const csvContent = await csvWriter.toCsv(jsonArrayNew, headers);
                    fs.writeFileSync(outputFile, csvContent, { flag: 'w+' });
                    // file written successfully
                } catch (err) {
                    console.error(err);
                        throw new Error(`Failed to write CSV file ${outputFile}: ${err.message}`);
                }

                xmlFileContent[file_root_tag][tag_section] = null;
                
            }

            // Only update the -part.xml file if we're not doing targeted upsert
            if (!flags.type && !flags.tagid) {
                if (fs.existsSync(inputFilePart)) {
                    const xmlFileContentPart = (await readXmlFromFile(inputFilePart)) ?? {};
                    const filePropertiesPart = xmlFileContentPart[file_root_tag] ?? {};

                    for (var k in fileProperties) {
                        filePropertiesPart[k] = fileProperties[k];
                    }

                    xmlFileContentPart[file_root_tag] = filePropertiesPart;
                    xmlFileContentPart[file_root_tag] = sortObjectKeys(xmlFileContentPart[file_root_tag]);
                    writeXmlToFile(inputFilePart, xmlFileContentPart);
                } else {
                    fileProperties[file_root_tag] = sortObjectKeys(fileProperties[file_root_tag]);
                    writeXmlToFile(inputFilePart, fileProperties);
                }
            }

            // File processed successfully
            result.items[fileName] = { result: 'OK' };

        } catch (error) {
            // File processing failed
            console.error(`Error processing file ${fullFilename}:`, error);
            result[fileName] = { 
                result: 'KO', 
                error: error.message || 'Unknown error occurred'
            };
        }
    }

    return result;
}
