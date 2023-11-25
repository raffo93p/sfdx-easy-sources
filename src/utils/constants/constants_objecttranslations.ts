import { setDefault } from "../utils";
import { DEFAULT_SFXML_PATH } from "./constants";

export const OBJTRANSL_FIELDSET_ROOT = 'fieldSets';
export const OBJTRANSL_FIELDSET_HEADER = [setDefault('label'), 'name'];
export const OBJTRANSL_FIELDSET_KEY = 'name';

export const OBJTRANSL_LAYOUT_ROOT = 'layouts';
export const OBJTRANSL_LAYOUT_HEADER = ['layout', setDefault('sections_label'), 'sections_section'];
export const OBJTRANSL_LAYOUT_KEY = ['layout', 'sections_section'];

export const OBJTRANSL_RECTYPE_ROOT = 'recordTypes';
export const OBJTRANSL_RECTYPE_HEADER = [setDefault('description'), setDefault('label'), 'name'];
export const OBJTRANSL_RECTYPE_KEY = 'name';

// TODO QUICKACTIONS
export const OBJTRANSL_QUICKACT_ROOT = 'fieldSets';
export const OBJTRANSL_QUICKACT_HEADER = [setDefault('label'), 'name'];
export const OBJTRANSL_QUICKACT_KEY = 'name';


export const OBJTRANSL_VALIDRULE_ROOT = 'validationRules';
export const OBJTRANSL_VALIDRULE_HEADER = [setDefault('errorMessage'), 'name'];
export const OBJTRANSL_VALIDRULE_KEY = 'name';

// TODO WorkflowTasks
export const OBJTRANSL_WORKFTASK_ROOT = 'fieldSets';
export const OBJTRANSL_WORKFTASK_HEADER = [setDefault('label'), 'name'];
export const OBJTRANSL_WORKFTASK_KEY = 'name';

// todo add relationshipLabel, help
export const OBJTRANSL_CFIELDTRANSL_ROOT = 'fieldTranslations';
export const OBJTRANSL_CFIELDTRANSL_HEADER = [setDefault('label'), 'name', 'picklistValues_masterLabel', 'picklistValues_translation'];
export const OBJTRANSL_CFIELDTRANSL_KEY = ['name', 'picklistValues_masterLabel'];
export const OBJTRANSL_CFIELDTRANSL_ROOT_TAG = 'CustomFieldTranslation';
export const OBJTRANSL_FIELDTRANSL_EXTENSION = '.fieldTranslation-meta.xml';


export const OBJTRANSL_ITEMS = {
    [OBJTRANSL_FIELDSET_ROOT]: { headers: OBJTRANSL_FIELDSET_HEADER, key: OBJTRANSL_FIELDSET_KEY },
    [OBJTRANSL_LAYOUT_ROOT]: { headers: OBJTRANSL_LAYOUT_HEADER, key: OBJTRANSL_LAYOUT_KEY },
    [OBJTRANSL_RECTYPE_ROOT]: { headers: OBJTRANSL_RECTYPE_HEADER, key: OBJTRANSL_RECTYPE_KEY },
    // [OBJTRANSL_QUICKACT_ROOT]: { headers: OBJTRANSL_QUICKACT_HEADER, key: OBJTRANSL_QUICKACT_KEY },
    [OBJTRANSL_VALIDRULE_ROOT]: { headers: OBJTRANSL_VALIDRULE_HEADER, key: OBJTRANSL_VALIDRULE_KEY },
    // [OBJTRANSL_WORKFTASK_ROOT]: { headers: OBJTRANSL_WORKFTASK_HEADER, key: OBJTRANSL_WORKFTASK_KEY },
    [OBJTRANSL_CFIELDTRANSL_ROOT]: { headers: OBJTRANSL_CFIELDTRANSL_HEADER, key: OBJTRANSL_CFIELDTRANSL_KEY }    
}


// used for clean command
// export const PROFILE_KEY_TYPE = {
//     [PROFILE_APP_ROOT]: { key: PROFILE_APP_KEY, typename: "CustomApplication"},
//     [PROFILE_CLASS_ROOT]: { key: PROFILE_CLASS_KEY, typename: "ApexClass" },
//     [PROFILE_CMDT_ROOT]: { key: PROFILE_CMDT_KEY, typename: "CustomObject"},
//     [PROFILE_CSET_ROOT]: { key: PROFILE_CSET_KEY, typename: "Settings" }, // ?? 
//     [PROFILE_FIELD_ROOT]: { key: PROFILE_FIELD_KEY, typename: "CustomField" },
//     [PROFILE_LAYOUT_ROOT]: [{  key: PROFILE_LAYOUT_KEY[0], typename: "Layout" },
//                             {  key: PROFILE_LAYOUT_KEY[1], typename: "RecordType" }],
//     [PROFILE_OBJECT_ROOT]: {  key: PROFILE_OBJECT_KEY, typename: "CustomObject" },
//     [PROFILE_PAGE_ROOT]: {  key: PROFILE_PAGE_KEY, typename: "ApexPage" },
//     [PROFILE_RECTYPE_ROOT]: { key: PROFILE_RECTYPE_KEY, typename: "RecordType" },
//     [PROFILE_TAB_ROOT]: {  key: PROFILE_TAB_KEY, typename: "CustomTab" }
//     // [PROFILE_USERPERM_ROOT]: {  key: PROFILE_USERPERM_KEY, typename: "" } // ??
// }

// used for minify command
export const OBJTRANSL_TAG_BOOL = {
    [OBJTRANSL_FIELDSET_ROOT]:  ['label'],
    [OBJTRANSL_LAYOUT_ROOT]: ['sections_label'],
    [OBJTRANSL_RECTYPE_ROOT]: ['label'],
    // [OBJTRANSL_QUICKACT_ROOT]: ['label'], 
    [OBJTRANSL_VALIDRULE_ROOT]: ['errorMessage'],
    // [OBJTRANSL_WORKFTASK_ROOT]: ['label'],
    [OBJTRANSL_CFIELDTRANSL_ROOT]: ['label', 'picklistValues_translation']
}

export const OBJTRANSL_EXTENSION = ".objectTranslation-meta.xml";
export const OBJTRANSL_ROOT_TAG = "CustomObjectTranslation";

export const OBJTRANSL_SUBPATH = 'objectTranslations';
export const OBJTRANSL_DEFAULT_SFXML_PATH = DEFAULT_SFXML_PATH + '/' + OBJTRANSL_SUBPATH;