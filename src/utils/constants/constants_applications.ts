import { setDefault } from "../utils";
import { DEFAULT_SFXML_PATH } from "./constants";

export const APPLICATIONS_EXTENSION = ".app-meta.xml";
export const APPLICATIONS_ROOT_TAG = "CustomApplication";

export const PAO_ROOT = 'profileActionOverrides';
export const PAO_HEADER = ['actionName', 'content', 'formFactor','pageOrSobjectType', setDefault('recordType'),'type','profile'];
export const PAO_KEY = ['recordType', 'content', 'profile','actionName','formFactor'];

export const APPLICATION_ITEMS = {
    [PAO_ROOT]: { headers: PAO_HEADER, key: PAO_KEY }
}
export const APPLICATIONS_SUBPATH = 'applications';
export const APPLICATIONS_DEFAULT_SFXML_PATH = DEFAULT_SFXML_PATH + '/'+ APPLICATIONS_SUBPATH;