export const PROFILE_APP_ROOT = 'applicationVisibilities';
export const PROFILE_APP_HEADER = ['_tagid','application', 'default', 'visible'];
export const PROFILE_APP_KEY = 'application';

export const PROFILE_CLASS_ROOT = 'classAccesses';
export const PROFILE_CLASS_HEADER = ['apexClass', 'enabled'];
export const PROFILE_CLASS_KEY = 'apexClass';

export const PROFILE_FIELD_ROOT = 'fieldPermissions';
export const PROFILE_FIELD_HEADER = ['editable', 'field', 'readable'];
export const PROFILE_FIELD_KEY = 'field';

export const PROFILE_LAYOUT_ROOT = 'layoutAssignments';
export const PROFILE_LAYOUT_HEADER = ['layout', 'recordType'];
export const PROFILE_LAYOUT_KEY = PROFILE_LAYOUT_HEADER;

export const PROFILE_OBJECT_ROOT = 'objectPermissions';
export const PROFILE_OBJECT_HEADER = ['allowCreate', 'allowDelete', 'allowEdit', 'allowRead', 'modifyAllRecords', 'object', 'viewAllRecords'];
export const PROFILE_OBJECT_KEY = 'object';

// <loginHours/>

export const PROFILE_PAGE_ROOT = 'pageAccesses';
export const PROFILE_PAGE_HEADER = ['apexPage', 'enabled'];
export const PROFILE_PAGE_KEY = 'apexPage';

export const PROFILE_RECTYPE_ROOT = 'recordTypeVisibilities';
export const PROFILE_RECTYPE_HEADER = ['default', 'recordType', 'visible'];
export const PROFILE_RECTYPE_KEY = 'recordType';

export const PROFILE_TAB_ROOT = 'tabVisibilities';
export const PROFILE_TAB_HEADER = ['tab', 'visibility'];
export const PROFILE_TAB_KEY = 'tab';

// <userLicense>Salesforce</userLicense>

export const PROFILE_USERPERM_ROOT = 'userPermissions';
export const PROFILE_USERPERM_HEADER = ['enabled', 'name'];
export const PROFILE_USERPERM_KEY = 'name';


export const PROFILE_ITEMS = {
    [PROFILE_APP_ROOT]: { headers: PROFILE_APP_HEADER, key: PROFILE_APP_KEY },
    [PROFILE_CLASS_ROOT]: { headers: PROFILE_CLASS_HEADER, key: PROFILE_CLASS_KEY },
    [PROFILE_FIELD_ROOT]: { headers: PROFILE_FIELD_HEADER, key: PROFILE_FIELD_KEY },
    [PROFILE_LAYOUT_ROOT]: { headers: PROFILE_LAYOUT_HEADER, key: PROFILE_LAYOUT_KEY },
    [PROFILE_OBJECT_ROOT]: { headers: PROFILE_OBJECT_HEADER, key: PROFILE_OBJECT_KEY },
    // loginHours
    [PROFILE_PAGE_ROOT]: { headers: PROFILE_PAGE_HEADER, key: PROFILE_PAGE_KEY },
    [PROFILE_RECTYPE_ROOT]: { headers: PROFILE_RECTYPE_HEADER, key: PROFILE_RECTYPE_KEY },
    [PROFILE_TAB_ROOT]: { headers: PROFILE_TAB_HEADER, key: PROFILE_TAB_KEY },
    // userLicense
    [PROFILE_USERPERM_ROOT]: { headers: PROFILE_USERPERM_HEADER, key: PROFILE_USERPERM_KEY }
}

export const XML_NAMESPACE = "http://soap.sforce.com/2006/04/metadata";

export const TRANSLATIONS_EXTENSION = ".translation-meta.xml";
export const TRANSLATIONS_ROOT_TAG = "Translations";

export const PROFILES_EXTENSION = ".profile-meta.xml";
export const PROFILES_ROOT_TAG = "Profile";

export const LABELS_EXTENSION = ".labels-meta.xml";
export const LABELS_ROOT_TAG = "CustomLabels";

export const PLUGIN_NAME = "sfdx-easy-sources";