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
import { DEFAULT_ESCSV_PATH, DEFAULT_LOG_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { join } from "path";
import { DEFAULT_PACKAGE_EXT, OBJECT_SUBPART_SKIP, PACKAGE_VERSION, PERMSET_FIX_TYPE, PROFILE_REL_TYPES, PROFILE_FIX_TYPE, RESOURCES_MAXNUM, TYPES_PICKVAL_ROOT, TYPES_ROOT_TAG, TRANSL_REL_TYPES, TRANSL_FIX_TYPES, TYPES_TO_SPLIT, CUSTOBJTRANSL_FIX_TYPES, CUSTOMOBJECT_TYPE, CUSTOMOBJECTTRANSL_TYPE } from '../../../utils/constants/constants_sourcesdownload';
import { readStringFromFile, readXmlFromFile, writeXmlToFile } from '../../../utils/filesUtils';
import { retrieveAllMetadataPackage, retrievePackage } from '../../../utils/commands/utils';
import { executeCommand } from '../../../utils/commands/utils';
const fs = require('fs-extra');
const _ = require('lodash') ;


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'allmeta_retrieve');

export default class Retrieve extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        manifest: flags.string({
            char: 'm',
            description: messages.getMessage('manifestFlagDescription', [""]),
        }),
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
        "dont-retrieve": flags.boolean({
            char: 'x',
            description: messages.getMessage('dontRetrieveFlagDescription', ["false"]),
            default: false
        }),
        resnumb:   flags.string({
            char:  'n',
            description: messages.getMessage('resnumbFlagDescription', [RESOURCES_MAXNUM]),
        }),
        "log-dir": flags.string({
            char:  'l',
            description: messages.getMessage('logdirFlagDescription', [DEFAULT_LOG_PATH]),
        }),
    };
    
    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();
        
        // * STEP 0 - Set variables

        var orgname = this.flags.orgname;
        var manifest = this.flags.manifest;

        var manifestDir = join( '.', 'manifest') as string;
        // const baseOutputDir = this.flags.output == null ? DEFAULT_PATH : this.flags.output;
        // const inputFiles = (this.flags.input) as string;

        var retrieve = !this.flags["dont-retrieve"];

        const resourcesNum = this.flags.resnumb || RESOURCES_MAXNUM;

        if (manifest == null && !fs.existsSync(manifestDir)) {
            console.log('Input folder ' + manifestDir + ' does not exist!');
            return;
        }

        const logdir = this.flags['log-dir'] || DEFAULT_LOG_PATH;

        if(logdir === DEFAULT_LOG_PATH){
            if (!fs.existsSync(logdir)) {
                fs.mkdirSync(logdir, { recursive: true });
            }
        }

        // * STEP 1 - Retrieve AllMeta Package and/or read it

        if(manifest == null){
           await retrieveAllMetadataPackage(orgname, manifestDir);
        }

        if(manifest != null){
            manifestDir = manifest.substring(0, manifest.lastIndexOf('/'));
        }

        const inputFile = manifest || join(manifestDir, DEFAULT_PACKAGE_EXT);
        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const typesProperties = xmlFileContent[TYPES_ROOT_TAG] ?? {};
        const typeItemsList = typesProperties[TYPES_PICKVAL_ROOT];

        var typeItemsMap = jsonArrayToMap(typeItemsList);
        
        // * STEP 1.1 - Calculate objects weight
        const strFileContent = await readStringFromFile(inputFile);
        var objWeights = {};

        if(typeItemsMap.has('CustomObject')){
            for(const member of typeItemsMap.get('CustomObject')){
                var str = member+".";
                objWeights[member] = (strFileContent.split(str) || []).length; // should be -1, but we count also the customObject itself as +1
            }

        }

        // * STEP 2 - Start chunkization

        var typeItemsMapChunks =[] as Map<string, string[]>[];
        var typesToDelete = [] as string[];

        // * STEP 2.1 - profiles chunkization
        var profileChunks =  splitChunksWithFixedTypes(
                                    typeItemsMap, typesToDelete, objWeights, resourcesNum, PROFILE_FIX_TYPE, PROFILE_REL_TYPES);
        console.log('Profile chunks size: ' + profileChunks.length);

        // * STEP 2.2 - permset chunkization
        var permsetChunks =  splitChunksWithFixedTypes(
                                    typeItemsMap, typesToDelete, objWeights, resourcesNum, PERMSET_FIX_TYPE, PROFILE_REL_TYPES);
        console.log('Permset chunks size: ' + permsetChunks.length);

        // * STEP 2.3 - translation chunkization
        var translationChunks =  splitChunksWithFixedTypes(
                                    typeItemsMap, typesToDelete, objWeights, resourcesNum, TRANSL_FIX_TYPES, TRANSL_REL_TYPES);
        console.log('Translation chunks size: ' + translationChunks.length);
        if(translationChunks.length > 1){
            // should always be one... but just in case
            console.log('WARNING: translation chunks size is greater than 1! This situation was not expected at the moment of writing this code.');
        }

        // * STEP 2.4 - customObjectTranslation chunkization
        // for customObjectTranslation we need to split the chunks in a different way
        // the idea is to have some fixed types, and to cycle on every couple Object/CustomObjectTranslation

        var customObjectTranslationChunks =  splitCustomObjectTranslation(
                                    typeItemsMap, typesToDelete, objWeights, resourcesNum);
        console.log('CustomObjectTranslation chunks size: ' + customObjectTranslationChunks.length);        

        // * STEP 2.5 - delete already retrieved types
        var membersToDeleteUniq = [...new Set(typesToDelete)];
        for(var type of membersToDeleteUniq){
            typeItemsMap.delete(type);
        }

        // * STEP 2.4 - general chunkization
        // the general chunkization applies to all, except profiles / permsets          // // except objects (and childrens..)
        // we split the package in various chunks, in a sequencial way, each of resourcesNum number of members (except the last chunk)
        // at the end each item of typeItemsMapChunks will be a package

        typeItemsMapChunks.push(...splitTypeItemsToChunks(typeItemsMap, null, objWeights, resourcesNum));
        console.log('Other chunks size: ' + typeItemsMapChunks.length);

        // * STEP 3 - write chunk packages
        var counter = { val: 0};

        var translFiles  = await writeChunkPackages(translationChunks, manifestDir, 'translations', counter); 
        var cotFiles     = await writeChunkPackages(customObjectTranslationChunks, manifestDir, 'customobjtranslations', counter); 
        var profFiles    = await writeChunkPackages(profileChunks, manifestDir, 'profiles', counter);
        var permsFiles   = await writeChunkPackages(permsetChunks, manifestDir, 'permissionsets', counter);
        var otherFiles   = await writeChunkPackages(typeItemsMapChunks, manifestDir, null, counter);

        // * STEP 4 - retrieve chunk packages
        if(retrieve) {
            await Promise.all([
                retrieveChunks(translationChunks, orgname, manifestDir, 'translations', translFiles, logdir),
                retrieveChunks(customObjectTranslationChunks, orgname, manifestDir, 'customobjtranslations', cotFiles, logdir),
                retrieveChunks(profileChunks, orgname, manifestDir, 'profiles', profFiles, logdir),
                retrieveChunks(permsetChunks, orgname, manifestDir, 'permissionsets', permsFiles, logdir),
                retrieveChunks(typeItemsMapChunks, orgname, manifestDir, null, otherFiles, logdir)
            ])
            
        }

        Performance.getInstance().end();

        return 'OK';
    }

}

export function splitCustomObjectTranslation(typeItemsMap, typesToDelete, objWeights, resourcesNum) : Map<string, string[]>[] {

    // create fixed items 
    var typeItemsFix = new Map() as Map<string, string[]>
    for(var type of CUSTOBJTRANSL_FIX_TYPES){
        if(typeItemsMap.has(type)){
            typeItemsFix.set(type, typeItemsMap.get(type));
            typesToDelete.push(type);
        }
    }

    var typeItemsMapChunks =[] as Map<string, string[]>[];

    // initialize variables
    var typeItemsMapChunkInit = typeItemsFix;
    var typeItemsMapChunk = _.cloneDeep(typeItemsMapChunkInit);

    var currNum = getSizeOfMapElements(typeItemsMapChunk);

    for(const customobject of typeItemsMap.get(CUSTOMOBJECT_TYPE)){
        var increment = objWeights[customobject];

        currNum = currNum + increment;
        // if we reach the maximum number of resources
        if(currNum > resourcesNum){
            // 1 - we save the part map

            typeItemsMapChunks.push(typeItemsMapChunk);

            // 2 - we refresh the variables
            typeItemsMapChunk = _.cloneDeep(typeItemsMapChunkInit);
            currNum = getSizeOfMapElements(typeItemsMapChunk) + increment;
        }

        // accumulate each member entry
        for(const customobjecttranslation of typeItemsMap.get(CUSTOMOBJECTTRANSL_TYPE)){
            var found = false;
            if(customobjecttranslation.startsWith(customobject+'-')){
                if(!found){
                    var memberArray = typeItemsMapChunk.get(CUSTOMOBJECT_TYPE) || [];
                    memberArray.push(customobject);

                    typeItemsMapChunk.set(CUSTOMOBJECT_TYPE, memberArray);
                    found = true;
                }
                var memberArray = typeItemsMapChunk.get(CUSTOMOBJECTTRANSL_TYPE) || [];
                memberArray.push(customobjecttranslation);
                typeItemsMapChunk.set(CUSTOMOBJECTTRANSL_TYPE, memberArray);
            }
        }
        
    }
     // accumulate the metadata type at the end of the list of members
    typeItemsMapChunks.push(typeItemsMapChunk);

    typesToDelete.push(CUSTOMOBJECT_TYPE);
    typesToDelete.push(CUSTOMOBJECTTRANSL_TYPE);
    
    return typeItemsMapChunks;
}

export function splitChunksWithFixedTypes(typeItemsMap, typesToDelete, objWeights,resourcesNum, FIXED_TYPES, RELATED_TYPES) : Map<string, string[]>[] {
    
    // if(typeItemsMap.has(FIXED_TYPES)){

    // create related items 
        var typeItemsRelated = new Map() as Map<string, string[]>
        for(var relatedType of RELATED_TYPES){
            if(typeItemsMap.has(relatedType)){
                typeItemsRelated.set(relatedType, typeItemsMap.get(relatedType));   
                typesToDelete.push(relatedType);
            }
        }
        typesToDelete.push(...FIXED_TYPES);

        // create fixed items 
        var typeItemsFix = new Map() as Map<string, string[]>
        for(var type of FIXED_TYPES){
            if(typeItemsMap.has(type)){
                typeItemsFix.set(type, typeItemsMap.get(type));
            }
        }

        // perform chunkization
        return splitTypeItemsToChunks(typeItemsRelated, typeItemsFix, objWeights, resourcesNum);
        // typeItemsMapChunks.push(...profileChunks);
    // } else {
    //     return [];
    // }
}

export function getTempPackageFilename(type, i){
    var type = type == null ? 'all' : type;
    return 'packageTemp_' + i + '_' + type + '.xml';
}

export async function writeChunkPackages(chunks, baseInputDir, type, counter){
    var filenames = [];
    for(var typeItemsMapChunk of chunks){
        counter['val'] = counter['val']+1;
        var filename = getTempPackageFilename(type, counter['val']);
        filenames.push(filename);
        await writePackageXmlFile(baseInputDir, filename, typeItemsMapChunk);
    }
    return filenames;
}

export async function retrieveChunks(chunks, orgname, baseInputDir, type, filenames, logdir){
    var isFirst = true;
    for(var filename of filenames){

        await retrievePackage(orgname, baseInputDir, filename, logdir);
        if(type != null && TYPES_TO_SPLIT.includes(type) && chunks.length > 1){
            if(isFirst){
                isFirst = false;
                await executeCommand(this.flags, 'split', type);
            } else {
                await executeCommand(this.flags, 'upsert', type);
            }
        }
    }


    if(type != null && chunks.length > 1){
        await executeCommand(this.flags, 'merge', type);
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


export function splitTypeItemsToChunks(typeItemsMap, typeItemsMapChunkInit, objWeights, resourcesNum ) : Map<string, string[]>[] {
    var typeItemsMapChunks =[] as Map<string, string[]>[];

    // initialize variables
    typeItemsMapChunkInit = typeItemsMapChunkInit == null ? new Map() as Map<string, string[]> : typeItemsMapChunkInit ;
    var typeItemsMapChunk = _.cloneDeep(typeItemsMapChunkInit);

    var currNum = getSizeOfMapElements(typeItemsMapChunk);

    // loop on each metadata type
    if(typeItemsMap != null && typeItemsMap.size > 0){
        for(const [name, members] of typeItemsMap){
            var membersPart = [] as string[];

            // loop on each member of the given metadata type
            for(const member of members){
                var increment;
                // since the customObject also downloads other subresources, to avoid hitting numResources
                // the customObject weight is the one calculated in the STEP 1.1

                if(name == 'CustomObject' && objWeights[member] != null){
                    increment = objWeights[member];
                } else if(OBJECT_SUBPART_SKIP.includes(name)
                            && objWeights.hasOwnProperty(member.substring(0, member.indexOf('.')))){
                    // but we can optimize the process by removing the subparts that are automatically downloaded with the customObject
                    // this would improve scenarios where objects folder has more than 10000 resources
                    // TODO should be investigated later
                    // IDEA: add another if: if name == 'one type i want to skip' and member.substring(0, indexOf(.))
                    continue;

                }
                else {
                    increment = 1;
                }

                currNum = currNum + increment;

                // if we reach the maximum number of resources:
                if(currNum > resourcesNum){
                    // 1 - we save the part map
                    if(membersPart.length > 0){
                        typeItemsMapChunk.set(name, membersPart);
                    }
                    typeItemsMapChunks.push(typeItemsMapChunk);

                    // 2 - we refresh the variables
                    typeItemsMapChunk = _.cloneDeep(typeItemsMapChunkInit);
                    currNum = getSizeOfMapElements(typeItemsMapChunk) + increment;
                    membersPart = [];
                } 

                // accumulate each member entry
                membersPart.push(member);
            }

            // accumulate the metadata type at the end of the list of members
            typeItemsMapChunk.set(name, membersPart);
            
        }
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