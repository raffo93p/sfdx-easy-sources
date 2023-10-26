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
import { PROFILES_SUBPATH, PROFILE_ITEMS } from "../../../utils/constants/constants_profiles";
import { calcCsvFilename, jsonArrayPackageToMap, readCsvToJsonArray, readXmlFromFile } from "../../../utils/filesUtils"
import { sortByKey } from "../../../utils/utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { loadSettings } from '../../../utils/localSettings';
import { retrieveAllMetadataPackageLocal, retrieveAllMetadataPackageOrg } from '../../../utils/commands/utils';
import { DEFAULT_PACKAGE_LOC_EXT, DEFAULT_PACKAGE_ORG_EXT, TYPES_PICKVAL_ROOT, TYPES_ROOT_TAG } from '../../../utils/constants/constants_sourcesdownload';
import { PROFILE_KEY_TYPE } from '../../../utils/constants/constants_clean';

const settings = loadSettings();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_clean');

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
            char: 'r',
            description: messages.getMessage('orgFlagDescription', [""]),
            required: true
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
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

        const baseCsvDir = join((this.flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), PROFILES_SUBPATH) as string;
        const baseXmlDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), PROFILES_SUBPATH) as string;
        var orgname = this.flags.orgname;

        const inputProfile = (this.flags.input) as string;
        const manifestDir = join( '.', 'manifest') as string;

        if (!fs.existsSync(baseCsvDir)) {
            console.log('Folder ' + baseCsvDir + ' does not exist!');
            return;
        }

        if (!fs.existsSync(baseXmlDir)) {
            console.log('Folder ' + baseXmlDir + ' does not exist!');
            return;
        }

        var dirList = [];
        if (inputProfile) {
            dirList = inputProfile.split(',');
        } else {
            dirList = fs.readdirSync(baseCsvDir, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
        }

        // create org manifest and src manifest
        if(false)
        await Promise.all([
            retrieveAllMetadataPackageOrg(orgname, manifestDir),
            retrieveAllMetadataPackageLocal(baseXmlDir, manifestDir)
        ]);

        // read manifests
        var typeItemsMap_org = await readPackageToMap(manifestDir, DEFAULT_PACKAGE_ORG_EXT);
        var typeItemsMap_loc = await readPackageToMap(manifestDir, DEFAULT_PACKAGE_LOC_EXT);

        // dir is the profile name without the extension
        for (const dir of dirList) {
            console.log('Cleaning on: ' + dir);

            for (const tag_section in PROFILE_ITEMS) {
                // tag_section is a profile section (applicationVisibilities, classAccess ecc)

                const csvFilePath = join(baseCsvDir, dir, calcCsvFilename(dir, tag_section));
                if (fs.existsSync(csvFilePath)) {

                    for(const key_type of toArray(PROFILE_KEY_TYPE[tag_section]) ){
                        // for each tagsection, get:
                        // the typename on package. eg. ApexClass
                        // the key that contains the name on the csv. eg. apexClass
                    
                        var typename = key_type["typename"];
                        var key = key_type["key"]; 
    
                        // get the list of resources on the csv. eg. the list of apex classes
                        var resListCsv = await readCsvToJsonArray(csvFilePath)
    
                        // get the list of resources of that type on the two packages (org and local)
                        var resListPkg_loc =  typeItemsMap_loc.get(typename);
                        var resListPkg_org =  typeItemsMap_org.get(typename);
                        
                        // res is a single resource on a given csv
                        resListCsv = resListCsv.filter(function(res) {
                            if(res[key] == null) return true;

                            var locFound = false;
                            var orgFound = false;
                            console.log('Finding: ' + res[key]+ ' into ');
                            console.log(resListPkg_loc);
                            if(resListPkg_loc != null && resListPkg_loc.includes(res[key])){
                                locFound = true;
                            }
                            if(resListPkg_org != null && resListPkg_org.includes(res[key])){
                                orgFound = true;
                            }
                            return locFound || orgFound;
                        })
                    }
                    
                    

                    console.log(resListCsv);

                    // for (var k of tagid.split(',')) {
                    //     jsonMap.delete(k);
                    // }
                    //var jsonArray = Array.from(jsonMap.values());

                    const headers = PROFILE_ITEMS[tag_section].headers;
                    const transforms = [unwind({ paths: headers })];
                    const parser = new Parser({ fields: [...headers, '_tagid'], transforms });

                    if (this.flags.sort === 'true') {
                        resListCsv = sortByKey(resListCsv);
                    }

                    const csv = parser.parse(resListCsv);
                    try {
                        fs.writeFileSync(csvFilePath, csv, { flag: 'w+' });
                        // file written successfully
                    } catch (err) {
                        console.error(err);
                    }
                }
            }



        }

        Performance.getInstance().end();

        var outputString = 'OK'
        return { outputString };
    }

    
}

export function toArray(arr): string[]{
    if (!Array.isArray(arr)) arr = [arr];
    return arr;

}

export async function readPackageToMap(manifestDir, packageName){
    const inputFile =join(manifestDir, packageName);
    const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
    const typesProperties = xmlFileContent[TYPES_ROOT_TAG] ?? {};
    const typeItemsList = typesProperties[TYPES_PICKVAL_ROOT];

    var typeItemsMap = jsonArrayPackageToMap(typeItemsList);
    return typeItemsMap;
}
