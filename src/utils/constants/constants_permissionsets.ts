import { setDefault } from "../utils";
import { DEFAULT_SFXML_PATH } from "./constants";

export const PERMSET_APP_ROOT = 'applicationVisibilities';
export const PERMSET_APP_HEADER = ['application', 'default', 'visible'];
export const PERMSET_APP_KEY = 'application';

export const PERMSET_CLASS_ROOT = 'classAccesses';
export const PERMSET_CLASS_HEADER = ['apexClass', 'enabled'];
export const PERMSET_CLASS_KEY = 'apexClass';

export const PERMSET_CMDT_ROOT = 'customMetadataTypeAccesses';
export const PERMSET_CMDT_HEADER = ['enabled', 'name'];
export const PERMSET_CMDT_KEY = 'name';

export const PERMSET_CPERM_ROOT = 'customPermissions';
export const PERMSET_CPERM_HEADER = ['enabled', 'name'];
export const PERMSET_CPERM_KEY = 'name';

export const PERMSET_CSET_ROOT = 'customSettingAccesses';
export const PERMSET_CSET_HEADER = ['enabled', 'name'];
export const PERMSET_CSET_KEY = 'name';

export const PERMSET_FIELD_ROOT = 'fieldPermissions';
export const PERMSET_FIELD_HEADER = ['editable', 'field', 'readable'];
export const PERMSET_FIELD_KEY = 'field';

// doesn't exist in permissionset
// export const PERMSET_LAYOUT_ROOT = 'layoutAssignments';
// export const PERMSET_LAYOUT_HEADER = ['layout', setDefault('recordType')];
// export const PERMSET_LAYOUT_KEY = PERMSET_LAYOUT_HEADER;

export const PERMSET_OBJECT_ROOT = 'objectPermissions';
export const PERMSET_OBJECT_HEADER = ['allowCreate', 'allowDelete', 'allowEdit', 'allowRead', 'modifyAllRecords', 'object', 'viewAllFields', 'viewAllRecords'];
export const PERMSET_OBJECT_KEY = 'object';

export const PERMSET_PAGE_ROOT = 'pageAccesses';
export const PERMSET_PAGE_HEADER = ['apexPage', 'enabled'];
export const PERMSET_PAGE_KEY = 'apexPage';

export const PERMSET_RECTYPE_ROOT = 'recordTypeVisibilities';
export const PERMSET_RECTYPE_HEADER = ['default', setDefault('personAccountDefault'), 'recordType', 'visible'];
export const PERMSET_RECTYPE_KEY = 'recordType';

export const PERMSET_TAB_ROOT = 'tabSettings';
export const PERMSET_TAB_HEADER = ['tab', 'visibility'];
export const PERMSET_TAB_KEY = 'tab';

export const PERMSET_USERPERM_ROOT = 'userPermissions';
export const PERMSET_USERPERM_HEADER = ['enabled', 'name'];
export const PERMSET_USERPERM_KEY = 'name';


export const PERMSET_ITEMS = {
    [PERMSET_APP_ROOT]: { headers: PERMSET_APP_HEADER, key: PERMSET_APP_KEY },
    [PERMSET_CLASS_ROOT]: { headers: PERMSET_CLASS_HEADER, key: PERMSET_CLASS_KEY },
    [PERMSET_CMDT_ROOT]: { headers: PERMSET_CMDT_HEADER, key: PERMSET_CMDT_KEY },
    [PERMSET_CPERM_ROOT]: { headers: PERMSET_CPERM_HEADER, key: PERMSET_CPERM_KEY },
    [PERMSET_CSET_ROOT]: { headers: PERMSET_CSET_HEADER, key: PERMSET_CSET_KEY },
    [PERMSET_FIELD_ROOT]: { headers: PERMSET_FIELD_HEADER, key: PERMSET_FIELD_KEY },
    // [PERMSET_LAYOUT_ROOT]: { headers: PERMSET_LAYOUT_HEADER, key: PERMSET_LAYOUT_KEY },
    [PERMSET_OBJECT_ROOT]: { headers: PERMSET_OBJECT_HEADER, key: PERMSET_OBJECT_KEY },
    [PERMSET_PAGE_ROOT]: { headers: PERMSET_PAGE_HEADER, key: PERMSET_PAGE_KEY },
    [PERMSET_RECTYPE_ROOT]: { headers: PERMSET_RECTYPE_HEADER, key: PERMSET_RECTYPE_KEY },
    [PERMSET_TAB_ROOT]: { headers: PERMSET_TAB_HEADER, key: PERMSET_TAB_KEY },
    [PERMSET_USERPERM_ROOT]: { headers: PERMSET_USERPERM_HEADER, key: PERMSET_USERPERM_KEY }
}

// used for minify command
export const PROFILE_TAG_BOOL = {
    [PERMSET_APP_ROOT]:  ['default', 'visible'],
    [PERMSET_CLASS_ROOT]: ['enabled'],
    [PERMSET_CMDT_ROOT]: ['enabled'],
    [PERMSET_CPERM_ROOT]: ['enabled'],
    [PERMSET_CSET_ROOT]: ['enabled'], // ?? 
    [PERMSET_FIELD_ROOT]: ['editable', 'readable'],
    // [PERMSET_LAYOUT_ROOT]: [],
    [PERMSET_OBJECT_ROOT]: ['allowCreate', 'allowDelete', 'allowEdit', 'allowRead', 'modifyAllRecords', 'viewAllFields', 'viewAllRecords'],
    [PERMSET_PAGE_ROOT]: ['enabled'],
    [PERMSET_RECTYPE_ROOT]: ['default', 'personAccountDefault', 'visible'],
    // [PERMSET_TAB_ROOT]: ['visibility'],
    [PERMSET_USERPERM_ROOT]: ['enabled']
}

export const PERMSETS_EXTENSION = ".permissionset-meta.xml";
export const PERMSETS_ROOT_TAG = "PermissionSet";

export const PERMSETS_SUBPATH = 'permissionsets';
export const PERMSETS_DEFAULT_SFXML_PATH = DEFAULT_SFXML_PATH + '/' + PERMSETS_SUBPATH;