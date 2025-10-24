export const DEFAULT_PACKAGE_ORG = 'allMetadataOrg';
export const DEFAULT_PACKAGE_ORG_EXT = DEFAULT_PACKAGE_ORG + '.xml';
export const DEFAULT_PACKAGE_LOC = 'allMetadataLocal';
export const DEFAULT_PACKAGE_LOC_EXT = DEFAULT_PACKAGE_LOC + '.xml';

export const TYPES_ROOT_TAG = "Package";

export const TYPES_PICKVAL_ROOT = 'types';
export const TYPES_PICKVAL_HEADER = ['picklist', 'values_fullName', 'values_default'];
export const TYPES_PICKVAL_KEY = ['picklist', 'values_fullName'];

export const MANIFEST_CREATE_CMD = 'force source manifest create';
export const SOURCE_RETRIEVE_CMD = 'force source retrieve';
export const ORG_DISPLAY_CMD = 'force org display';

export const RESOURCES_MAXNUM = 8000;

export const PACKAGE_VERSION = '55.0';

export const PROFILE_FIX_TYPE = ['Profile'];
export const PROFILE_REL_TYPES = [
    'ApexClass',
	'ApexPage',
	'CustomApplication',
	'CustomField',
	//'CustomMetadata',
	'CustomObject',
	'CustomTab',
	'DataCategoryGroup',
	'ExternalDataSource',
	'Flow',
	'FlowDefinition',
	'Layout',
	'RecordType',
	'FlexiPage'			
]

export const PERMSET_FIX_TYPE = ['PermissionSet'];
export const PERMSET_REL_TYPES = [
    'ApexClass',
    'ApexPage',
    'CustomApplication',
    'CustomField',
    // 'CustomMetadata',
    'CustomObject',
    'CustomTab',
    'ExternalDataSource',
    'Flow',
	'FlowDefinition',
    'RecordType'
];

export const OBJECT_SUBPART_SKIP = ['CustomField','RecordType']; 

export const TYPES_TO_SPLIT = [
	'profiles',
	'permissionsets'
];

export const TRANSL_FIX_TYPES = [
	'CustomApplication',
	'CustomLabels',
	'CustomPageWebLink',
	'CustomTab',
	'QuickAction',
	'ReportType',
	'SControl',
	'Translations' // we don't have the need to split the package in various chunks, because the related resources are not many
];
export const TRANSL_REL_TYPES = [];

export const CUSTOBJTRANSL_FIX_TYPES = [
	'Layout',
	'QuickAction',
	'SharingReason',
	'WorkflowTask'
];
export const CUSTOMOBJECT_TYPE = 'CustomObject';
export const CUSTOMOBJECTTRANSL_TYPE = 'CustomObjectTranslation';




