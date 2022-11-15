import { DEFAULT_PATH } from "./constants";

export const APPLICATIONS_EXTENSION = ".app-meta.xml";
export const APPLICATIONS_ROOT_TAG = "CustomApplication";

export const PAO_ROOT = 'profileActionOverrides';
export const PAO_HEADER = ['actionName', 'content', 'formFactor','pageOrSobjectType','recordType','type','profile'];
export const PAO_KEY = ['recordType', 'content', 'profile','actionName','formFactor'];

export const APPLICATION_ITEMS = {
    [PAO_ROOT]: { headers: PAO_HEADER, key: PAO_KEY }
}
export const APPLICATIONS_SUBPATH = 'applications';
export const APPLICATIONS_DEFAULT_PATH = DEFAULT_PATH + '/'+ APPLICATIONS_SUBPATH;