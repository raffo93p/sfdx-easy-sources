/**
 * Shared clean logic for removing references to non-existent metadata from CSV files.
 */
import fs from 'fs-extra';
import { join } from "path";
import _ from 'lodash';
import { calcCsvFilename, checkDirOrCreateSync, checkDirOrErrorSync, jsonArrayPackageToMap, readCsvToJsonArray, readXmlFromFile } from '../filesUtils.js';
import { sortByKey, toArray } from '../utils.js';
import { DEFAULT_ESCSV_PATH, DEFAULT_LOG_PATH, DEFAULT_SFXML_PATH } from '../constants/constants.js';
import { DEFAULT_PACKAGE_LOC_EXT, DEFAULT_PACKAGE_ORG_EXT, TYPES_PICKVAL_ROOT, TYPES_ROOT_TAG } from '../constants/constants_sourcesdownload.js';
import { loadSettings } from '../localSettings.js';
import { getDefaultOrgName, retrieveAllMetadataPackageLocal, retrieveAllMetadataPackageOrg } from './utils.js';
import CsvWriter from '../csvWriter.js';

const settings = loadSettings();

/**
 * Core clean logic shared across metadata types (profiles, permissionsets).
 */
export async function clean(
    flags: any,
    file_subpath: string,
    file_items: Record<string, any>,
    file_key_type: Record<string, any>,
    log_file_name: string
): Promise<any> {
    const csvWriter = new CsvWriter();

    const logdir = flags['log-dir'] || settings['easysources-log-path'] || DEFAULT_LOG_PATH;
    const csvDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const xmlDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;
    let orgname = flags.orgname || await getDefaultOrgName();
    const mode = flags.mode || 'clean';
    const target = flags.target || 'both';

    const skipStandardFields = !flags['include-standard-fields'];
    const skipStandardTabs = !flags['include-standard-tabs'];
    const skipTypes = flags['skip-types'] || ['Settings'];
    const includeTypes = flags['include-types'] || [];
    const skipManifestCreation = flags['skip-manifest-creation'];

    if (skipTypes && skipTypes.length > 0 && includeTypes && includeTypes.length > 0) {
        throw new Error('--skip-types and --include-types flags are mutually exclusive. Please use only one of them.');
    }

    if (mode === 'log') checkDirOrCreateSync(logdir);

    const inputItems = flags.input as string;
    const manifestDir = join('.', 'manifest') as string;

    checkDirOrErrorSync(csvDir);
    checkDirOrErrorSync(xmlDir);

    let itemList = [];
    if (inputItems) {
        itemList = inputItems.split(',');
    } else {
        itemList = fs.readdirSync(csvDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name);
    }

    if (!skipManifestCreation) {
        let retrievePromises = [];
        if (target === 'org' || target === 'both') {
            retrievePromises.push(retrieveAllMetadataPackageOrg(orgname, manifestDir));
        }
        if (target === 'local' || target === 'both') {
            retrievePromises.push(retrieveAllMetadataPackageLocal(xmlDir, manifestDir));
        }
        await Promise.all(retrievePromises);
    }

    let typeItemsMap_list = [];
    if (target === 'org' || target === 'both') {
        typeItemsMap_list.push(await readPackageToMap(manifestDir, DEFAULT_PACKAGE_ORG_EXT));
    }
    if (target === 'local' || target === 'both') {
        typeItemsMap_list.push(await readPackageToMap(manifestDir, DEFAULT_PACKAGE_LOC_EXT));
    }

    let logList = [];
    for (const itemName of itemList) {
        console.log('Cleaning on: ' + itemName);

        for (const tag_section in file_items) {
            const csvFilePath = join(csvDir, itemName, calcCsvFilename(itemName, tag_section));
            if (fs.existsSync(csvFilePath)) {
                let resListCsv = await readCsvToJsonArray(csvFilePath);

                for (const key_type of toArray(file_key_type[tag_section])) {
                    if (key_type == null) continue;

                    const typename = key_type["typename"];
                    const key = key_type["key"];

                    resListCsv = resListCsv.filter(function (res) {
                        if (res[key] == null) return true;
                        if (skipTypes != null && skipTypes.includes(typename)) return true;
                        if (includeTypes != null && includeTypes.length > 0 && !includeTypes.includes(typename)) return true;
                        if (skipStandardFields && typename === "CustomField" && !res[key].endsWith("__c")) return true;
                        if (skipStandardTabs && typename === "CustomTab" && res[key].startsWith("standard-")) return true;

                        const item = manipulateItem(res[key], typename);

                        let found = false;
                        for (const typeItemsMap of typeItemsMap_list) {
                            if (typeItemsMap != null && typeItemsMap.get(typename) != null && (item == null || typeItemsMap.get(typename).includes(item))) {
                                found = true;
                            }
                        }

                        if (!found) {
                            const errStr = `${file_subpath} ${itemName}, ${tag_section}: ${key} "${item}" not found in ${typename}.`;
                            if (mode === "log") {
                                logList.push(errStr);
                            }
                        }

                        return found;
                    });
                }

                if (mode !== "log") {
                    const headers = file_items[tag_section].headers;

                    if (flags.sort !== 'false') {
                        resListCsv = sortByKey(resListCsv);
                    }

                    try {
                        const csvContent = await csvWriter.toCsv(resListCsv, headers);
                        fs.writeFileSync(csvFilePath, csvContent, { flag: 'w+' });
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        }
    }

    if (mode === "log") {
        fs.writeFileSync(join(logdir, log_file_name), logList.join('\n'), { flag: 'w+' });
    }

    return { outputString: 'OK' };
}

export function manipulateItem(itemOrig, typename) {
    let item = _.cloneDeep(itemOrig);
    if (typename === "CustomField" && item.startsWith("Event.")) {
        item = item.replace("Event.", "Activity.");
    }
    if (typename === "CustomField" && item.startsWith("Task.")) {
        item = item.replace("Task.", "Activity.");
    }
    if (typename === "RecordType" && item === 'Idea.InternalIdeasIdeaRecordType') {
        item = null;
    }
    return item;
}

export async function readPackageToMap(manifestDir, packageName) {
    const inputFile = join(manifestDir, packageName);
    const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
    const typesProperties = xmlFileContent[TYPES_ROOT_TAG] ?? {};
    const typeItemsList = typesProperties[TYPES_PICKVAL_ROOT];

    const typeItemsMap = jsonArrayPackageToMap(typeItemsList);
    return typeItemsMap;
}
