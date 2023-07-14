import { setDefault } from "../utils";
import { DEFAULT_SFXML_PATH } from "./constants";

export const GVSETTRANS_EXTENSION = ".globalValueSetTranslation-meta.xml";
export const GVSETTRANS_ROOT_TAG = "GlobalValueSetTranslation";

export const GVSETTRAN_ROOT = 'valueTranslation';
export const GVSETTRAN_HEADER = ['masterLabel', setDefault('translation')];
export const GVSETTRAN_KEY = 'masterLabel';

export const GVSETTRAN_ITEMS = {
    [GVSETTRAN_ROOT]: { headers: GVSETTRAN_HEADER, key: GVSETTRAN_KEY }
}

export const GVSETTRANS_SUBPATH = 'globalValueSetTranslations';
export const GVSETTRANS_DEFAULT_SFXML_PATH = DEFAULT_SFXML_PATH + '/' + GVSETTRANS_SUBPATH;