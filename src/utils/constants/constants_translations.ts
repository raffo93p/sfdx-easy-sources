import { setDefault } from "../utils";
import { DEFAULT_SFXML_PATH } from "./constants";

export const TRANSLAT_APP_ROOT = 'customApplications';
export const TRANSLAT_APP_HEADER = [setDefault('label'), 'name'];
export const TRANSLAT_APP_KEY = 'name';

export const TRANSLAT_LABEL_ROOT = 'customLabels';
export const TRANSLAT_LABEL_HEADER = [setDefault('label'), 'name'];
export const TRANSLAT_LABEL_KEY = 'name';

export const TRANSLAT_CPWLINKS_ROOT = 'customPageWebLinks';
export const TRANSLAT_CPWLINKS_HEADER = [setDefault('label'), 'name'];
export const TRANSLAT_CPWLINKS_KEY = 'name';

export const TRANSLAT_TAB_ROOT = 'customTabs';
export const TRANSLAT_TAB_HEADER = [setDefault('label'), 'name'];
export const TRANSLAT_TAB_KEY = 'name';

export const TRANSLAT_QACT_ROOT = 'quickActions';
export const TRANSLAT_QACT_HEADER = [setDefault('label'), 'name'];
export const TRANSLAT_QACT_KEY = 'name';

export const TRANSLAT_REPTYPE_ROOT = 'reportTypes';
export const TRANSLAT_REPTYPE_HEADER = [setDefault('description'), setDefault('label'), 'name', setDefault('sections_label'), 'sections_name', 'sections_columns_label', 'sections_columns_name'];
export const TRANSLAT_REPTYPE_KEY = ['name', 'sections_name', 'sections_columns_name'];


export const TRANSLATION_ITEMS = {
    [TRANSLAT_APP_ROOT]: { headers: TRANSLAT_APP_HEADER, key: TRANSLAT_APP_KEY },
    [TRANSLAT_LABEL_ROOT]: { headers: TRANSLAT_LABEL_HEADER, key: TRANSLAT_LABEL_KEY },
    [TRANSLAT_CPWLINKS_ROOT]: { headers: TRANSLAT_CPWLINKS_HEADER, key: TRANSLAT_CPWLINKS_KEY },
    [TRANSLAT_TAB_ROOT]: { headers: TRANSLAT_TAB_HEADER, key: TRANSLAT_TAB_KEY },
    [TRANSLAT_QACT_ROOT]: { headers: TRANSLAT_QACT_HEADER, key: TRANSLAT_QACT_KEY },
    [TRANSLAT_REPTYPE_ROOT]: { headers: TRANSLAT_REPTYPE_HEADER, key: TRANSLAT_REPTYPE_KEY }
}


// used for clean command
// export const TRANSLAT_KEY_TYPE = {
//     [TRANSLAT_APP_ROOT]: { key: TRANSLAT_APP_KEY, typename: "CustomApplication"},
//     [TRANSLAT_CLASS_ROOT]: { key: TRANSLAT_CLASS_KEY, typename: "ApexClass" },
//     [TRANSLAT_CMDT_ROOT]: { key: TRANSLAT_CMDT_KEY, typename: "CustomObject"},
//     [TRANSLAT_CSET_ROOT]: { key: TRANSLAT_CSET_KEY, typename: "Settings" }, // ?? 
//     [TRANSLAT_FIELD_ROOT]: { key: TRANSLAT_FIELD_KEY, typename: "CustomField" },
//     [TRANSLAT_LAYOUT_ROOT]: [{  key: TRANSLAT_LAYOUT_KEY[0], typename: "Layout" },
//                             {  key: TRANSLAT_LAYOUT_KEY[1], typename: "RecordType" }],
//     [TRANSLAT_OBJECT_ROOT]: {  key: TRANSLAT_OBJECT_KEY, typename: "CustomObject" },
//     [TRANSLAT_PAGE_ROOT]: {  key: TRANSLAT_PAGE_KEY, typename: "ApexPage" },
//     [TRANSLAT_RECTYPE_ROOT]: { key: TRANSLAT_RECTYPE_KEY, typename: "RecordType" },
//     [TRANSLAT_TAB_ROOT]: {  key: TRANSLAT_TAB_KEY, typename: "CustomTab" }
//     // [TRANSLAT_USERPERM_ROOT]: {  key: TRANSLAT_USERPERM_KEY, typename: "" } // ??
// }

// used for minify command
export const TRANSLAT_TAG_BOOL = {
    [TRANSLAT_APP_ROOT]:  ['label'],
    [TRANSLAT_LABEL_ROOT]: ['label'],
    [TRANSLAT_CPWLINKS_ROOT]: ['label'],
    [TRANSLAT_TAB_ROOT]: ['label'],
    [TRANSLAT_QACT_ROOT]: ['label'],
    [TRANSLAT_REPTYPE_ROOT]: ['description', 'label', 'sections_label', 'sections_columns_label'] //?
}

export const TRANSLATIONS_EXTENSION = ".translation-meta.xml";
export const TRANSLATIONS_ROOT_TAG = "Translations";

export const TRANSLATIONS_SUBPATH = 'translations';
export const TRANSLATIONS_DEFAULT_SFXML_PATH = DEFAULT_SFXML_PATH + '/' + TRANSLATIONS_SUBPATH;