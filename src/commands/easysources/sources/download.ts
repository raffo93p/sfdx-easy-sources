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
import Performance from '../../../utils/performance';
import { DEFAULT_PATH } from '../../../utils/constants/constants';
import { join } from "path";
import { DEFAULT_PACKAGE_EXT, PACKAGE_VERSION, PERMSET_TYPE, PROFILE_MEMBERS, PROFILE_TYPE, RESOURCES_MAXNUM, TYPES_PICKVAL_ROOT, TYPES_ROOT_TAG } from '../../../utils/constants/constants_sourcesdownload';
import { readXmlFromFile, writeXmlToFile } from '../../../utils/filesUtils';
import { retrieveAllMetadataPackage, retrievePackage } from '../../../utils/commands/utils';
import { executeCommand } from '../../../utils/utils';
const fs = require('fs-extra');
const _ = require('lodash') ;


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'sources_download');

export default class Download extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);


    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        dir: flags.string({
            char: 'd',
            description: messages.getMessage('dirFlagDescription', ["."]),
        }),
        manifest: flags.string({
            char: 'm',
            description: messages.getMessage('manifestFlagDescription', [""]),
        }),
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription', [DEFAULT_PATH]),
        }),
        orgname:  flags.string({
            char: 'r',
            description: messages.getMessage('orgFlagDescription', [""]),
            required: true
        }),
        resnumb:   flags.string({
            char:  'n',
            description: messages.getMessage('resnumbFlagDescription', [RESOURCES_MAXNUM]),
        })
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        // * STEP 0 - Set variables

        var orgname = this.flags.orgname;
        var manifest = this.flags.manifest;

        var baseInputDir = join((this.flags.dir || '.'), 'manifest') as string;
        // const baseOutputDir = this.flags.output == null ? DEFAULT_PATH : this.flags.output;
        // const inputFiles = (this.flags.input) as string;

        const resourcesNum = this.flags.resnumb || RESOURCES_MAXNUM;

        if (manifest == null && !fs.existsSync(baseInputDir)) {
            console.log('Input folder ' + baseInputDir + ' does not exist!');
            return;
        }
    
        // * STEP 1 - Retrieve AllMeta Package and/or read it

        if(manifest == null){
           await retrieveAllMetadataPackage(orgname, baseInputDir);
        }

        if(manifest != null){
            baseInputDir = manifest.substring(0,manifest.lastIndexOf('/'));
        }

        const inputFile = manifest || join(baseInputDir, DEFAULT_PACKAGE_EXT);
        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const typesProperties = xmlFileContent[TYPES_ROOT_TAG] ?? {};
        const typeItemsList = typesProperties[TYPES_PICKVAL_ROOT];

        var typeItemsMap = jsonArrayToMap(typeItemsList);
        

        // * STEP 2 - Start chunkization

        var typeItemsMapChunks =[] as Map<string, string[]>[];
        var typesToDelete = [] as string[];

        // * STEP 2.1 - profiles chunkization
        var profileChunks =  splitChunksWithFixedTypes(
                                    typeItemsMap, typesToDelete, resourcesNum, PROFILE_TYPE, PROFILE_MEMBERS);
        

        // * STEP 2.2 - permset chunkization
        var permsetChunks =  splitChunksWithFixedTypes(
                                    typeItemsMap, typesToDelete, resourcesNum, PERMSET_TYPE, PROFILE_MEMBERS);

        // * STEP 2.3 - delete already retrieved types
        var membersToDeleteUniq = [...new Set(typesToDelete)];
        for(var type of membersToDeleteUniq){
            typeItemsMap.delete(type);
        }

        // * STEP 2.4 - general chunkization
        // the general chunkization applies to all, except profiles / permsets          // // except objects (and childrens..)
        // we split the package in various chunks, in a sequencial way, each of resourcesNum number of members (except the last chunk)
        // at the end each item of typeItemsMapChunks will be a package

        typeItemsMapChunks.push(...splitTypeItemsToChunks(typeItemsMap, null, resourcesNum));

        // * STEP 3 - Retrieve chunks
        var i = 0;
        await retrieveChunks(profileChunks, orgname, baseInputDir, 'profiles', i);
        await retrieveChunks(permsetChunks, orgname, baseInputDir, 'permissionsets', i);
        await retrieveChunks(typeItemsMapChunks, orgname, baseInputDir, null, i);

        // console.log(typeItemsMapChunks)

        Performance.getInstance().end();

        return 'OK';
    }

}

export function splitChunksWithFixedTypes(typeItemsMap, typesToDelete, resourcesNum, TYPE, MEMBERS) : Map<string, string[]>[] {
    if(typeItemsMap.has(TYPE)){

        var typeItemsProfile = new Map() as Map<string, string[]>
        for(var member of MEMBERS){
            if(typeItemsMap.has(member)){
                typeItemsProfile.set(member, typeItemsMap.get(member));   
                typesToDelete.push(member);
            }
        }
        typesToDelete.push(TYPE);

        // create fixed items and perform chunkization
        var typeItemsFix = new Map() as Map<string, string[]>
        typeItemsFix.set(TYPE,typeItemsMap.get(TYPE));

        return splitTypeItemsToChunks(typeItemsProfile, typeItemsFix, resourcesNum);
        // typeItemsMapChunks.push(...profileChunks);
    } else {
        return [];
    }
}

export async function retrieveChunks(chunks, orgname, baseInputDir, type, i){
    var isFirst = true;
    for(var typeItemsMapChunk of chunks){
        i++;

        var filename = 'packageTemp' + i + '.xml';
        await writePackageXmlFile(baseInputDir, filename, typeItemsMapChunk);
        retrievePackage(orgname, join(baseInputDir, filename) );

        if(type != null && chunks.length > 1){
            if(isFirst){
                isFirst = false;
                await executeCommand(flags, 'split', type);
            } else {
                await executeCommand(flags, 'upsert', type);
            }
        }
    }
    if(type != null && chunks.length > 1){
        await executeCommand(flags, 'merge', type);
    }
}

export async function writePackageXmlFile(dir, filename, obj){
    await writeXmlToFile(join(dir, filename), toPackageXml(obj));
}

export function toPackageXml(map) {
    var pkg = {};
    pkg['$'] = {xmlns: 'http://soap.sforce.com/2006/04/metadata'};
    var types = [];
    for (var [key, value] of map) {
        var type = {};
        type['members'] = value;
        type['name'] = key;
        types.push(type);
    }
    pkg['types'] = types;
    pkg['version'] = PACKAGE_VERSION;

    return {Package: pkg}; 
}


export function splitTypeItemsToChunks(typeItemsMap, typeItemsMapChunkInit, resourcesNum ) : Map<string, string[]>[] {
    var typeItemsMapChunks =[] as Map<string, string[]>[];

    // initialize variables
    typeItemsMapChunkInit = typeItemsMapChunkInit == null ? new Map() as Map<string, string[]> : typeItemsMapChunkInit ;
    var typeItemsMapChunk = _.cloneDeep(typeItemsMapChunkInit);

    var currNum = getSizeOfMapElements(typeItemsMapChunk);

    // loop on each metadata type
    for(const [name, members] of typeItemsMap){
        var membersPart = [] as string[];

        // loop on each member of the given metadata type
        for(const member of members){
            currNum ++;
            
            // if we reach the maximum number of resources:
            if(currNum > resourcesNum){
                // 1 - we save the part map
                if(membersPart.length > 0){
                    typeItemsMapChunk.set(name, membersPart);
                }
                typeItemsMapChunks.push(typeItemsMapChunk);

                // 2 - we refresh the variables
                typeItemsMapChunk = _.cloneDeep(typeItemsMapChunkInit);
                currNum = getSizeOfMapElements(typeItemsMapChunk) + 1;
                membersPart = [];
            } 

            // accumulate each member entry
            membersPart.push(member);
        }

        // accumulate the metadata type at the end of the list of members
        typeItemsMapChunk.set(name, membersPart);
        
    }

    // save the last chunk of the map
    if(typeItemsMapChunk.size > 0){
        typeItemsMapChunks.push(typeItemsMapChunk);
    }

    return typeItemsMapChunks;
}

export function jsonArrayToMap(jsonArray){
	if (!Array.isArray(jsonArray)) jsonArray = [jsonArray]

	const myMap = new Map(
        jsonArray.map(object => {
            return [object['name'],
                     Array.isArray(object['members']) ? object['members'] : [object['members']]];
        })
    ) as Map<string, string[]>;

	return myMap;
}

export function getSizeOfMapElements(map){
    if(map == null){
        return 0;
    }
    var size = 0;
    for(var [key, value] of map){
        key; // dummy use, if not throws error
        size += value.length;
    }
    return size;

}