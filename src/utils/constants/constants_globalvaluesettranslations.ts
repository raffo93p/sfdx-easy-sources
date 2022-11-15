import { DEFAULT_PATH } from "./constants";

export const GVSETTRANS_EXTENSION = ".globalValueSetTranslation-meta.xml";
export const GVSETTRANS_ROOT_TAG = "GlobalValueSetTranslation";

export const GVSETTRAN_ROOT = 'valueTranslation';
export const GVSETTRAN_HEADER = ['masterLabel', 'translation'];
export const GVSETTRAN_KEY = 'masterLabel';

export const GVSETTRAN_ITEMS = {
    [GVSETTRAN_ROOT]: { headers: GVSETTRAN_HEADER, key: GVSETTRAN_KEY }
}

export const GVSETTRANS_SUBPATH = 'globalValueSetTranslations';
export const GVSETTRANS_DEFAULT_PATH = DEFAULT_PATH + '/' + GVSETTRANS_SUBPATH;