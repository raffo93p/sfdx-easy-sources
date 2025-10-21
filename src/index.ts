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

// Export all path functionality
export {
    PathOptions,
    resolvePaths
} from './api/paths';

export default {
    profiles: require('./api/profiles').profiles,
    permissionsets: require('./api/permissionsets').permissionsets
};
