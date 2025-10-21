/**
 * Main entry point for sfdx-easy-sources API
 * 
 * This module provides programmatic access to all easy-sources functionality
 * for use in Node.js scripts and applications.
 */

// Export all profile functionality
export {
    profiles,
    ProfileOptions,
    profileSplit,
    profileUpsert,
    profileMerge,
    profileClearEmpty,
    profileAreAligned,
    profileUpdateKey,
    profileMinify,
    profileDelete,
    profileClean
} from './api/profiles';

// Export all permission set functionality
export {
    permissionsets,
    PermissionsetOptions,
    permissionsetSplit,
    permissionsetUpsert,
    permissionsetMerge,
    permissionsetClearEmpty,
    permissionsetAreAligned,
    permissionsetUpdateKey,
    permissionsetMinify,
    permissionsetDelete,
    permissionsetClean
} from './api/permissionsets';

// Export all label functionality
export {
    labels,
    LabelOptions,
    labelSplit,
    labelUpsert,
    labelMerge,
    labelAreAligned,
    labelUpdateKey
} from './api/labels';

// Export all application functionality
export {
    applications,
    ApplicationOptions,
    applicationSplit,
    applicationUpsert,
    applicationMerge,
    applicationAreAligned,
    applicationUpdateKey
} from './api/applications';

// Export all global value set functionality
export {
    globalValueSets,
    GlobalValueSetOptions,
    globalValueSetSplit,
    globalValueSetUpsert,
    globalValueSetMerge,
    globalValueSetAreAligned,
    globalValueSetUpdateKey
} from './api/globalvaluesets';

// Export all global value set translation functionality
export {
    globalValueSetTranslations,
    GlobalValueSetTranslationOptions,
    globalValueSetTranslationSplit,
    globalValueSetTranslationUpsert,
    globalValueSetTranslationMerge,
    globalValueSetTranslationAreAligned,
    globalValueSetTranslationUpdateKey
} from './api/globalvaluesettranslations';

// Export all translation functionality
export {
    translations,
    TranslationOptions,
    translationSplit,
    translationUpsert,
    translationMerge,
    translationAreAligned,
    translationMinify,
    translationClearEmpty
} from './api/translations';

// Export all record type functionality
export {
    recordtypes,
    RecordTypeOptions,
    recordTypeSplit,
    recordTypeUpsert,
    recordTypeMerge,
    recordTypeAreAligned,
    recordTypeUpdateKey,
    recordTypeDelete,
    recordTypeClean
} from './api/recordtypes';

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
    recordtypes: require('./api/recordtypes').recordtypes
};
