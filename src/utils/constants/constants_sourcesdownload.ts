export const DEFAULT_PACKAGE = 'allMetadata';
export const DEFAULT_PACKAGE_EXT = DEFAULT_PACKAGE + '.xml';
export const TYPES_ROOT_TAG = "Package";

export const TYPES_PICKVAL_ROOT = 'types';
export const TYPES_PICKVAL_HEADER = ['picklist', 'values_fullName', 'values_default'];
export const TYPES_PICKVAL_KEY = ['picklist', 'values_fullName'];

export const MANIFEST_CREATE_CMD = 'sfdx force:source:manifest:create';
export const SOURCE_RETRIEVE_CMD = 'sfdx force:source:retrieve';

export const RESOURCES_MAXNUM = 15;

export const PACKAGE_VERSION = '55.0';

export const PROFILE_TYPE = 'Profile';
export const PROFILE_MEMBERS = [
    'ApexClass',
	'ApexPage',
	'CustomApplication',
	'CustomField',
	'CustomMetadata',
	'CustomObject',
	'CustomTab',
	'DataCategoryGroup',
	'ExternalDataSource',
	'Flow',
	'Layout',
	'RecordType',
	'FlexiPage'			
]

export const PERMSET_TYPE = 'PermissionSet';
export const PERMSET_MEMBERS = [
    'ApexClass',
    'ApexPage',
    'CustomApplication',
    'CustomField',
    'CustomMetadata',
    'CustomObject',
    'CustomTab',
    'ExternalDataSource',
    'Flow',
    'RecordType'
]

export const OBJECT_SUBPART_SKIP = ['CustomField','RecordType']; // TODO: customField, Layout, ValidationRule ecc
