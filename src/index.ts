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
    profileClean,
    // Also export with shorter aliases for convenience
    profileSplit as split,
    profileUpsert as upsert,
    profileMerge as merge,
    profileClearEmpty as clearEmpty,
    profileAreAligned as areAligned,
    profileUpdateKey as updateKey,
    profileMinify as minify,
    profileDelete as delete,
    profileClean as clean
} from './api/profiles';

// Export all path functionality
export {
    PathOptions,
    resolvePaths
} from './api/paths';

export default {
    profiles: require('./api/profiles').profiles
};
