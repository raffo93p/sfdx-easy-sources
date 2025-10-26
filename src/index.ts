/**
 * Main entry point for sfdx-easy-sources API
 * 
 * This module provides programmatic access to all easy-sources functionality
 * for use in Node.js scripts and applications.
 */

// Export all profile functionality
export {
    profiles,
    ProfileOptions
} from './api/profiles';

// Export all permission set functionality
export {
    permissionsets,
    PermissionsetOptions
} from './api/permissionsets';

// Export all label functionality
export {
    labels,
    LabelOptions
} from './api/labels';

// Export all application functionality
export {
    applications,
    ApplicationOptions
} from './api/applications';

// Export all global value set functionality
export {
    globalValueSets,
    GlobalValueSetOptions
} from './api/globalvaluesets';

// Export all global value set translation functionality
export {
    globalValueSetTranslations,
    GlobalValueSetTranslationOptions
} from './api/globalvaluesettranslations';

// Export all translation functionality
export {
    translations,
    TranslationOptions
} from './api/translations';

// Export all record type functionality
export {
    recordtypes,
    RecordTypeOptions
} from './api/recordtypes';

// Export all object translation functionality
export {
    objectTranslations,
    ObjectTranslationOptions
} from './api/objecttranslations';

// Export all path functionality
export {
    PathOptions,
    resolvePaths
} from './api/paths';

export default {
    profiles: require('./api/profiles').profiles,
    permissionsets: require('./api/permissionsets').permissionsets,
    labels: require('./api/labels').labels,
    applications: require('./api/applications').applications,
    globalValueSets: require('./api/globalvaluesets').globalValueSets,
    globalValueSetTranslations: require('./api/globalvaluesettranslations').globalValueSetTranslations,
    translations: require('./api/translations').translations,
    objectTranslations: require('./api/objecttranslations').objectTranslations,
    recordtypes: require('./api/recordtypes').recordtypes
};
