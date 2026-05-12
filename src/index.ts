/**
 * Main entry point for sfdx-easy-sources API
 * 
 * This module provides programmatic access to all easy-sources functionality
 * for use in Node.js scripts and applications.
 */

import { profiles } from './api/profiles.js';
import { permissionSets } from './api/permissionsets.js';
import { labels } from './api/labels.js';
import { applications } from './api/applications.js';
import { globalValueSets } from './api/globalvaluesets.js';
import { globalValueSetTranslations } from './api/globalvaluesettranslations.js';
import { translations } from './api/translations.js';
import { recordTypes } from './api/recordtypes.js';
import { objectTranslations } from './api/objecttranslations.js';

// Re-export all functionality
export { profiles, type ProfileOptions } from './api/profiles.js';
export { permissionSets, type PermissionSetOptions } from './api/permissionsets.js';
export { labels, type LabelOptions } from './api/labels.js';
export { applications, type ApplicationOptions } from './api/applications.js';
export { globalValueSets, type GlobalValueSetOptions } from './api/globalvaluesets.js';
export { globalValueSetTranslations, type GlobalValueSetTranslationOptions } from './api/globalvaluesettranslations.js';
export { translations, type TranslationOptions } from './api/translations.js';
export { recordTypes, type RecordTypeOptions } from './api/recordtypes.js';
export { objectTranslations, type ObjectTranslationOptions } from './api/objecttranslations.js';
export { type PathOptions, resolvePaths } from './api/paths.js';

export default {
    profiles,
    permissionSets,
    labels,
    applications,
    globalValueSets,
    globalValueSetTranslations,
    translations,
    objectTranslations,
    recordTypes
};
