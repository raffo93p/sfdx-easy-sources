import { DEFAULT_PATH } from "./constants";

export const GVSETTRANS_EXTENSION = ".globalValueSetTranslation-meta.xml";
export const GVSETTRANS_ROOT_TAG = "GlobalValueSet";

export const GVSETTRAN_ROOT = 'customValue';
export const GVSETTRAN_HEADER = ['fullName', 'default', 'label'];
export const GVSETTRAN_KEY = 'fullName';

export const GVSETTRAN_ITEMS = {
    [GVSETTRAN_ROOT]: { headers: GVSETTRAN_HEADER, key: GVSETTRAN_KEY }
}

export const GVSETTRANS_SUBPATH = 'globalValueSetTranslations';
export const GVSETTRANS_DEFAULT_PATH = DEFAULT_PATH + '/' + GVSETTRANS_SUBPATH;