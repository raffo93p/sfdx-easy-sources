import { DEFAULT_PATH } from "./constants";

export const RECORDTYPES_EXTENSION = ".recordType-meta.xml";
export const RECORDTYPES_ROOT_TAG = "RecordType";

export const RECORDTYPES_PICKVAL_ROOT = 'picklistValues';
export const RECORDTYPES_PICKVAL_HEADER = ['picklist', 'values_fullName', 'values_default'];
export const RECORDTYPES_PICKVAL_KEY = ['picklist', 'values_fullName'];

export const RECORDTYPE_ITEMS = {
    [RECORDTYPES_PICKVAL_ROOT]: { headers: RECORDTYPES_PICKVAL_HEADER, key: RECORDTYPES_PICKVAL_KEY }
}

export const RECORDTYPES_SUBPATH = 'objects';
export const RECORDTYPES_DEFAULT_PATH = DEFAULT_PATH + '/' + RECORDTYPES_SUBPATH;