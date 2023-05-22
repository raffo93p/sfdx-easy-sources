import { setDefault } from "../utils";
import { DEFAULT_SFXML_PATH } from "./constants";

export const LABELS_EXTENSION = ".labels-meta.xml";
export const LABELS_ROOT_TAG = "CustomLabels";

export const LABEL_ROOT = 'labels';
export const LABEL_HEADER = ['fullName', setDefault('categories'), 'language', 'protected', 'shortDescription', 'value'];
export const LABEL_KEY = ['fullName', 'language'];

export const LABEL_ITEMS = {
    [LABEL_ROOT]: { headers: LABEL_HEADER, key: LABEL_KEY }
}

export const LABELS_SUBPATH = 'labels';
export const LABELS_DEFAULT_SFXML_PATH = DEFAULT_SFXML_PATH + '/' + LABELS_SUBPATH;