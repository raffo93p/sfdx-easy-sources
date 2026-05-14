import { DEFAULT_SFXML_PATH } from "./constants.js";

export const OBJTRANSL_FIELDSET_ROOT = 'fieldSets';
export const OBJTRANSL_FIELDSET_HEADER = ['label', 'name'];
export const OBJTRANSL_FIELDSET_KEY = 'name';

export const OBJTRANSL_LAYOUT_ROOT = 'layouts';
export const OBJTRANSL_LAYOUT_HEADER = ['layout', 'sections_label', 'sections_section'];
export const OBJTRANSL_LAYOUT_KEY = ['layout', 'sections_section'];

export const OBJTRANSL_RECTYPE_ROOT = 'recordTypes';
export const OBJTRANSL_RECTYPE_HEADER = ['description', 'label', 'name'];
export const OBJTRANSL_RECTYPE_KEY = 'name';

export const OBJTRANSL_QUICKACT_ROOT = 'quickActions';
export const OBJTRANSL_QUICKACT_HEADER = ['aspect', 'label', 'name'];
export const OBJTRANSL_QUICKACT_KEY = 'name';


export const OBJTRANSL_VALIDRULE_ROOT = 'validationRules';
export const OBJTRANSL_VALIDRULE_HEADER = ['errorMessage', 'name'];
export const OBJTRANSL_VALIDRULE_KEY = 'name';

export const OBJTRANSL_WORKFTASK_ROOT = 'workflowTasks';
export const OBJTRANSL_WORKFTASK_HEADER = ['description', 'name', 'subject'];
export const OBJTRANSL_WORKFTASK_KEY = 'name';

// todo add relationshipLabel, help
export const OBJTRANSL_CFIELDTRANSL_ROOT = 'fieldTranslations';
export const OBJTRANSL_CFIELDTRANSL_HEADER = ['help', 'label', 'relationshipLabel', 'name', 'picklistValues_masterLabel', 'picklistValues_translation'];
export const OBJTRANSL_CFIELDTRANSL_KEY = ['name', 'picklistValues_masterLabel'];
export const OBJTRANSL_CFIELDTRANSL_ROOT_TAG = 'CustomFieldTranslation';
export const OBJTRANSL_FIELDTRANSL_EXTENSION = '.fieldTranslation-meta.xml';


export const OBJTRANSL_ITEMS = {
    [OBJTRANSL_FIELDSET_ROOT]: { headers: OBJTRANSL_FIELDSET_HEADER, key: OBJTRANSL_FIELDSET_KEY },
    [OBJTRANSL_LAYOUT_ROOT]: { headers: OBJTRANSL_LAYOUT_HEADER, key: OBJTRANSL_LAYOUT_KEY },
    [OBJTRANSL_RECTYPE_ROOT]: { headers: OBJTRANSL_RECTYPE_HEADER, key: OBJTRANSL_RECTYPE_KEY },
    [OBJTRANSL_QUICKACT_ROOT]: { headers: OBJTRANSL_QUICKACT_HEADER, key: OBJTRANSL_QUICKACT_KEY },
    [OBJTRANSL_VALIDRULE_ROOT]: { headers: OBJTRANSL_VALIDRULE_HEADER, key: OBJTRANSL_VALIDRULE_KEY },
    [OBJTRANSL_WORKFTASK_ROOT]: { headers: OBJTRANSL_WORKFTASK_HEADER, key: OBJTRANSL_WORKFTASK_KEY },
    [OBJTRANSL_CFIELDTRANSL_ROOT]: { headers: OBJTRANSL_CFIELDTRANSL_HEADER, key: OBJTRANSL_CFIELDTRANSL_KEY }    
}


// used for minify command
export const OBJTRANSL_TAG_BOOL = {
    [OBJTRANSL_FIELDSET_ROOT]:  ['label'],
    [OBJTRANSL_LAYOUT_ROOT]: ['sections_label'],
    [OBJTRANSL_RECTYPE_ROOT]: ['label'],
    [OBJTRANSL_QUICKACT_ROOT]: ['label'], 
    [OBJTRANSL_VALIDRULE_ROOT]: ['errorMessage'],
    [OBJTRANSL_WORKFTASK_ROOT]: ['label'],
    [OBJTRANSL_CFIELDTRANSL_ROOT]: ['help', 'relationshipLabel', 'description', 'label', 'picklistValues_translation']
}

// used to remove empty tags while merging
export const OBJTRANSL_OPTIONAL_TAGS = {
    [OBJTRANSL_RECTYPE_ROOT]: ['description'],
    [OBJTRANSL_QUICKACT_ROOT]: ['aspect'], 
    [OBJTRANSL_WORKFTASK_ROOT]: ['description'],
    [OBJTRANSL_CFIELDTRANSL_ROOT]: ['help', 'relationshipLabel']
}

export const OBJTRANSL_EXTENSION = ".objectTranslation-meta.xml";
export const OBJTRANSL_ROOT_TAG = "CustomObjectTranslation";

export const OBJTRANSL_SUBPATH = 'objectTranslations';
export const OBJTRANSL_DEFAULT_SFXML_PATH = DEFAULT_SFXML_PATH + '/' + OBJTRANSL_SUBPATH;