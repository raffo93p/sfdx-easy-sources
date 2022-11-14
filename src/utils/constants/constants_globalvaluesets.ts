import { DEFAULT_PATH } from "./constants";

export const GVSETS_EXTENSION = ".globalValueSet-meta.xml";
export const GVSETS_ROOT_TAG = "GlobalValueSet";

export const GVSET_ROOT = 'customValue';
export const GVSET_HEADER = ['fullName', 'default', 'label'];
export const GVSET_KEY = 'fullName';

export const GVSET_ITEMS = {
    [GVSET_ROOT]: { headers: GVSET_HEADER, key: GVSET_KEY }
}

export const GVSETS_DEFAULT_PATH = DEFAULT_PATH + '/globalValueSets';