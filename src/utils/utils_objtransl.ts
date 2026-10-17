import { OBJTRANSL_CFIELDTRANSL_ROOT_TAG, OBJTRANSL_CFIELDTRANSL_SUPPORTED_TAGS, OBJTRANSL_FIELDTRANSL_EXTENSION, OBJTRANSL_OPTIONAL_TAGS } from "./constants/constants_objecttranslations.js";
import fs from 'fs-extra';
import { join } from 'path';
import { Parser } from 'xml2js';

export function transformLayoutXMLtoCSV(jsonArray) {
    if (!Array.isArray(jsonArray)) jsonArray = [jsonArray];

    var jsforcsv = [];
    for (var layout of jsonArray) {

        if (!Array.isArray(layout.sections)) layout.sections = [layout.sections];
        for (var section of layout.sections) {
            jsforcsv.push({ layout: layout.layout, sections_label: section.label, sections_section: section.section })
        }
    }
    return jsforcsv;
}

export function transformLayoutCSVtoXML(jsonArray) {
    var jsonArrayForXML = []
    var obj = {}
    var prevLayout: string;
    for (const entry of jsonArray) {

        if (entry.layout !== prevLayout) {
            if (prevLayout != undefined) jsonArrayForXML.push(obj);
            obj = { layout: entry.layout, sections: [{ label: entry.sections_label, section: entry.sections_section }] };
            prevLayout = entry.picklist
        } else {
            obj['sections'].push({ label: entry.sections_label, section: entry.sections_section })
        }
    }
    jsonArrayForXML.push(obj);
    return jsonArrayForXML;
}

export function transformFieldXMLtoCSV(fieldTr){
    // var csvEntry = {label: fieldTr.label, name: fieldTr.name};
    // var picklistValues = fieldTr.picklistValues;
    // if(picklistValues != null){
    //     if (!Array.isArray(picklistValues)) picklistValues = [picklistValues];
        
    //     for(const entry of picklistValues){

    //     }
    // }   
        var { help, label, name, relationshipLabel, picklistValues } = fieldTr;

        const attributesArray = [];
      
        if (!picklistValues || picklistValues.length === 0) {
            attributesArray.push({
            help, 
            label,
            name,
            relationshipLabel,
            picklistValues_masterLabel: '',
            picklistValues_translation: ''
            });
        } else {
            if (!Array.isArray(picklistValues)) picklistValues = [picklistValues];

            for (const { masterLabel, translation } of picklistValues) {
            attributesArray.push({
                help,
                label,
                name,
                picklistValues_masterLabel: masterLabel,
                picklistValues_translation: translation
            });
            }
        }
      
        return attributesArray;      

}

export function transformFieldCSVtoXMLs(array) {
  const transformedArray = [];
  const uniqueNames = [...new Set(array.map(item => item.name))];

  for (const name of uniqueNames) {
    const filteredItems = array.filter(item => item.name === name);

    var item = {
      "$":  {xmlns: 'http://soap.sforce.com/2006/04/metadata'}
    };

    const help = filteredItems[0].help;
    if(help !== undefined && help != null && help !== ''){
        item['help'] = help;
    }

    item['label'] = filteredItems[0].label;
    item['name'] = name;

    if (filteredItems.some(item => item.hasOwnProperty("picklistValues_masterLabel") && item.picklistValues_masterLabel !=='')) {
      const picklistValues = filteredItems.map(item => ({
        masterLabel: item.picklistValues_masterLabel,
        translation: item.picklistValues_translation
      }));
      item['picklistValues'] = picklistValues;
    }

    const relationshipLabel = filteredItems[0].relationshipLabel;
    if(relationshipLabel !== undefined && relationshipLabel != null && relationshipLabel !== ''){
        item['relationshipLabel'] = relationshipLabel;
    }

    transformedArray.push(item);
  }

  return transformedArray;
}

export interface UnsupportedFieldTranslation {
    file: string;
    tags: string[];
}

function findUnsupportedTags(filePath: string): string[] {
    let parsed: any;
    let parseError: any;
    // xml2js invokes the callback synchronously unless the async option is set
    new Parser({ explicitArray: false }).parseString(fs.readFileSync(filePath, 'utf8'), (err, res) => {
        parseError = err;
        parsed = res;
    });

    if (parseError || !parsed) return ['<invalid xml>'];

    const root = parsed[OBJTRANSL_CFIELDTRANSL_ROOT_TAG];
    if (!root || typeof root !== 'object') return [];

    return Object.keys(root).filter(tag =>
        tag !== '$'
        && !OBJTRANSL_CFIELDTRANSL_SUPPORTED_TAGS.includes(tag)
        && root[tag] !== undefined && root[tag] !== null && root[tag] !== ''
    );
}

/**
 * Lists the fieldTranslation xml files of an object, split between the ones the plugin can
 * convert to csv without losing data (managed) and the ones containing unsupported tags (unsupported).
 */
export function listFieldTranslationFiles(dir: string): { managed: string[], unsupported: UnsupportedFieldTranslation[] } {
    const files = fs.readdirSync(dir, { withFileTypes: true })
        .filter(item => !item.isDirectory() && item.name.endsWith(OBJTRANSL_FIELDTRANSL_EXTENSION))
        .map(item => item.name);

    const managed: string[] = [];
    const unsupported: UnsupportedFieldTranslation[] = [];

    for (const file of files) {
        const tags = findUnsupportedTags(join(dir, file));
        if (tags.length === 0) {
            managed.push(file);
        } else {
            unsupported.push({ file, tags });
        }
    }

    return { managed, unsupported };
}

export function warnUnsupportedFieldTranslations(unsupported: UnsupportedFieldTranslation[]) {
    for (const { file, tags } of unsupported) {
        console.warn(`  Skipping ${file}: unsupported tags (${tags.join(', ')}). The file is left untouched.`);
    }
}

// returns only the files managed by the plugin
export function getFieldTranslationFiles(dir: string, warn: boolean = false): string[] {
    const { managed, unsupported } = listFieldTranslationFiles(dir);
    if (warn) warnUnsupportedFieldTranslations(unsupported);
    return managed;
}

export function removeEmpyOptionalTags(jsonArray, tag_section){
  if(OBJTRANSL_OPTIONAL_TAGS[tag_section]){
    for (const i in jsonArray) {
        for(const tag of OBJTRANSL_OPTIONAL_TAGS[tag_section]){
            if(jsonArray[i][tag] === ''){
                delete jsonArray[i][tag];
            }
        }
    }
}
}
