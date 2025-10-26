/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
const fs = require('fs-extra');
import { join } from "path";
import Performance from '../../../utils/performance';
const { Parser, transforms: { unwind } } = require('json2csv');
import { calcCsvFilename, checkDirOrCreateSync, checkDirOrErrorSync, jsonArrayPackageToMap, readCsvToJsonArray, readXmlFromFile } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_LOG_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';
import { getDefaultOrgName, retrieveAllMetadataPackageLocal, retrieveAllMetadataPackageOrg } from '../../../utils/commands/utils';
import { DEFAULT_PACKAGE_LOC_EXT, DEFAULT_PACKAGE_ORG_EXT, TYPES_PICKVAL_ROOT, TYPES_ROOT_TAG } from '../../../utils/constants/constants_sourcesdownload';
import { RECORDTYPE_ITEMS, RECORDTYPES_PICKVAL_ROOT, RECORDTYPES_SUBPATH } from '../../../utils/constants/constants_recordtypes';
const _ = require('lodash') ;

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'recordtypes_clean');

export default class Clean extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        "sf-xml": flags.string({
            char: 'x',
            description: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
        "es-csv": flags.string({
            char: 'c',
            description: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        orgname:  flags.string({
            char: 'u',
            description: messages.getMessage('orgFlagDescription', [""]),
            required: false
        }),
        object: flags.string({
            char: 's',
            description: messages.getMessage('objectFlagDescription'),
        }),
        recordtype: flags.string({
            char: 'r',
            description: messages.getMessage('recordtypeFlagDescription'),
        }),
        "log-dir": flags.string({
            char:  'l',
            description: messages.getMessage('logdirFlagDescription', [DEFAULT_LOG_PATH]),
        }),
        mode: flags.enum({
            char: 'm',
            description: messages.getMessage('modeFlagDescription', ['clean']),
            options: ['clean', 'log'],
            default: 'clean',
        }),
        target: flags.enum({
            char: 'g',
            description: messages.getMessage('targetFlagDescription', ['both']),
            options: ['org', 'local', 'both'],
            default: 'both',
        }),
        'include-standard-fields': flags.boolean({
            char: 'F',
            description: messages.getMessage('includeStandardFieldsFlagDescription', ['false']),
            default: false,
        }),
        'skip-manifest-creation': flags.boolean({
            char: 'M',
            description: messages.getMessage('skipManifestCreationFlagDescription', ['false']),
            default: false,
        }),
        sort: flags.enum({
            char: 'S',
            description: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };

    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();
        
        const result = await recordTypeClean(this.flags);
        
        Performance.getInstance().end();

        return result;        
    }
    
}

// Export function for API usage  
export async function recordTypeClean(options: any = {}): Promise<AnyJson> {
    
    const logdir = options['log-dir'] || settings['easysources-log-path'] || DEFAULT_LOG_PATH;
    const csvDir = join((options["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), RECORDTYPES_SUBPATH) as string;
    const xmlDir = join((options["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;
    const orgname = options.orgname || await getDefaultOrgName();
    const mode = options.mode || 'clean';
    const target = options.target || 'both';
    const skipStandardFields = !options['include-standard-fields'];
    const skipManifestCreation = options['skip-manifest-creation'];

    if (mode === 'log') checkDirOrCreateSync(logdir);

    const inputObject = (options.object) as string;
    const inputRecordType = (options.recordtype) as string;
    const manifestDir = join('.', 'manifest') as string;

    checkDirOrErrorSync(csvDir);
    checkDirOrErrorSync(xmlDir);

    var objectList = [];
    if (inputObject) {
        objectList = inputObject.split(',');
    } else {
        objectList = fs.readdirSync(csvDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name)
    }

    // create packages all metadata 
    if (!skipManifestCreation) {
        var retrievePromises = [];
        if (target === 'org' || target === 'both') {
            retrievePromises.push(retrieveAllMetadataPackageOrg(orgname, manifestDir));
        }
        if (target === 'local' || target === 'both') {
            retrievePromises.push(retrieveAllMetadataPackageLocal(xmlDir, manifestDir));
        }
            // create org manifest and src manifest
        await Promise.all(retrievePromises);
    }

    // read manifests
    var typeItemsMap_list = [];
    if (target === 'org' || target === 'both') {
        typeItemsMap_list.push(await readPackageToMap(manifestDir, DEFAULT_PACKAGE_ORG_EXT));
    }
    if (target === 'local' || target === 'both') {
        typeItemsMap_list.push(await readPackageToMap(manifestDir, DEFAULT_PACKAGE_LOC_EXT));
    }

    var logList = [];

    for (const obj of objectList) {
        var recordTypeList = [];

        if (inputRecordType) {
            recordTypeList = inputRecordType.split(',');
        } else {
            recordTypeList = fs.readdirSync(join(csvDir, obj, 'recordTypes'), { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }

            // recType is the recordtype name without the extension
        for (const recType of recordTypeList) {
            console.log('Cleaning on: ' + join(obj, recType));
            
            const csvFilePath = join(csvDir, obj, 'recordTypes', recType, calcCsvFilename(recType, RECORDTYPES_PICKVAL_ROOT));
            if (fs.existsSync(csvFilePath)) {
                var resListCsv = await readCsvToJsonArray(csvFilePath);
                    // get the list of resources on the csv. eg. the list of apex classes
                    // for each tagsection, get:
                    // the typename on package. eg. ApexClass
                    // the key that contains the name on the csv. eg. apexClass
                var typename = 'CustomField';
                var key = 'picklist'; 

                    // res is a single resource on a given csv
                resListCsv = resListCsv.filter(function(res) {
                    if (res[key] == null) return true;
                    if (skipStandardFields && typename === "CustomField" && !res[key].endsWith("__c")) return true;

                        // perform some manipulation on the item for recordTypes
                    var item = obj + '.' + res[key];
                    item = manipulateItem(item, typename);

                    var found = false;
                    for (const typeItemsMap of typeItemsMap_list) {
                        if (typeItemsMap != null && typeItemsMap.get(typename) != null && (item == null || typeItemsMap.get(typename).includes(item))) {
                            found = true;
                        }
                    }

                    var dontCanc = false;
                    if (!found) {
                        const errStr = `Object ${obj}, recordType ${recType}: ${key} "${item}" not found in ${typename}.`;
                        if (mode === "log") {
                            logList.push(`${errStr}`);
                        }
                    }
                    
                    return found || dontCanc;
                });
                
                if (mode !== "log") {
                    const headers = RECORDTYPE_ITEMS[RECORDTYPES_PICKVAL_ROOT].headers;
                    const transforms = [unwind({ paths: headers })];
                    const parser = new Parser({ fields: [...headers, '_tagid'], transforms });

                    if (options.sort === 'true' || options.sort === true || options.sort === undefined) {
                        resListCsv = sortByKey(resListCsv);
                    }

                    const csv = parser.parse(resListCsv);
                    try {
                        fs.writeFileSync(csvFilePath, csv, { flag: 'w+' });
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        }
    }

    // write log file
    if (mode === "log") {
        fs.writeFileSync(join(logdir, 'recordtypes-clean.log'), logList.join('\n'), { flag: 'w+' });
    }
    
    return { outputString: 'OK' };
}

export function manipulateItem(itemOrig, typename){
    var item = _.cloneDeep(itemOrig);
    if(typename === "CustomField" && item.startsWith("Event.")){
        item = item.replace("Event.", "Activity.");
    } 
    if(typename === "CustomField" && item.startsWith("Task.")){
        item = item.replace("Task.", "Activity.");
    }
    return item;
}

export async function readPackageToMap(manifestDir, packageName){
    const inputFile =join(manifestDir, packageName);
    const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
    const typesProperties = xmlFileContent[TYPES_ROOT_TAG] ?? {};
    const typeItemsList = typesProperties[TYPES_PICKVAL_ROOT];

    var typeItemsMap = jsonArrayPackageToMap(typeItemsList);
    return typeItemsMap;
}
