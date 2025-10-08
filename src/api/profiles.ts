/**
 * Profile API - Programmatic access to all profile-related operations
 * 
 * This module exposes all the core functionality for working with Salesforce profiles
 * without requiring the SFDX CLI interface. Use these functions in your Node.js scripts
 * to manipulate profile metadata programmatically.
 * 
 * @example
 * ```typescript
 * import { profiles } from 'sfdx-easy-sources';
 * 
 * // Split a profile into CSV files (paths auto-resolved from settings)
 * await profiles.split({ input: 'Admin' });
 * 
 * // Upsert changes from XML to CSV (no options needed if using defaults)
 * await profiles.upsert();
 * 
 * // Merge CSV files back to XML with custom paths
 * await profiles.merge({
 *   'es-csv': './custom-csv-path',
 *   input: 'Admin'
 * });
 * ```
 */

import { PathOptions } from './paths';
import { EmptyClearerResult } from '../utils/commands/emptyClearer';
import { ValidationSummary } from '../utils/commands/alignmentChecker';

// Import profile-specific functions directly from command files
import { profileSplit as profileSplitCommand } from '../commands/easysources/profiles/split';
import { profileUpsert as profileUpsertCommand } from '../commands/easysources/profiles/upsert';
import { profileMerge as profileMergeCommand } from '../commands/easysources/profiles/merge';
import { profileUpdateKey as profileUpdateKeyCommand } from '../commands/easysources/profiles/updatekey';
import { profileAreAligned as profileAreAlignedCommand } from '../commands/easysources/profiles/arealigned';
import { profileClearEmpty as profileClearEmptyCommand } from '../commands/easysources/profiles/clearempty';
import { profileMinify as profileMinifyCommand } from '../commands/easysources/profiles/minify';
import { profileDelete as profileDeleteCommand } from '../commands/easysources/profiles/delete';
import { profileClean as profileCleanCommand } from '../commands/easysources/profiles/clean';

/**
 * Profile-specific options interface
 * Extends the common PathOptions with profile-specific settings
 */
export interface ProfileOptions extends PathOptions {
    /** Comma-separated list of specific profiles to process (without .profile-meta.xml extension) */
    input?: string;
    /** Ignore user permissions when processing (default: false) */
    ignoreuserperm?: string;
    // Additional profile-specific options can be added here
    [key: string]: any;
}

/**
 * Splits profile XML files into manageable CSV files
 * 
 * Each profile is split into separate CSV files based on permission types:
 * - applicationVisibilities
 * - classAccesses
 * - customMetadataTypeAccesses
 * - customPermissions
 * - customSettingAccesses
 * - fieldPermissions
 * - flowAccesses
 * - layoutAssignments
 * - objectPermissions
 * - pageAccesses
 * - recordTypeVisibilities
 * - tabVisibilities
 * - userPermissions (can be ignored with ignoreuserperm flag)
 * 
 * @param options - Configuration options for the split operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await profileSplit({ input: 'Admin,Standard User' });
 * console.log(result.outputString); // "OK"
 * 
 * // Override specific paths if needed
 * const result = await profileSplit({
 *   'es-csv': './custom-output',
 *   input: 'Admin',
 *   ignoreuserperm: 'true'
 * });
 * ```
 */
export async function profileSplit(options: ProfileOptions = {}): Promise<{ outputString: string }> {
    const result = await profileSplitCommand(options);

    if (!result) {
        throw new Error('Split operation failed - check that your input paths exist and contain valid profile metadata');
    }
    
    return result;
}

/**
 * Upserts (updates or inserts) profile data from XML into existing CSV files
 * 
 * After retrieving updated metadata from an org, use this to merge new permissions
 * and settings into your existing CSV files without losing your customizations.
 * 
 * @param options - Configuration options for the upsert operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await profileUpsert();
 * console.log(result.outputString); // "OK"
 * 
 * // With specific options
 * const result = await profileUpsert({ ignoreuserperm: 'true' });
 * ```
 */
export async function profileUpsert(options: ProfileOptions = {}): Promise<{ outputString: string }> {
    const result = await profileUpsertCommand(options);
    
    if (!result) {
        throw new Error('Upsert operation failed - check that your input paths exist and contain valid profile metadata');
    }
    
    return result;
}

/**
 * Merges CSV files back into profile XML format for deployment
 * 
 * Combines all the CSV files for a profile back into a single XML file
 * that can be deployed to a Salesforce org.
 * 
 * @param options - Configuration options for the merge operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await profileMerge({ input: 'Admin,Standard User' });
 * console.log(result.result); // "OK"
 * 
 * // All profiles with default paths
 * const result = await profileMerge();
 * ```
 */
export async function profileMerge(options: ProfileOptions = {}): Promise<{ result: string }> {
    const result = await profileMergeCommand(options);
    
    if (!result) {
        throw new Error('Merge operation failed - check that your CSV paths exist and contain valid profile data');
    }
    
    return result;
}

/**
 * Clears empty CSV files and folders to keep the repository clean
 * 
 * Removes CSV files that have no content (only headers) and deletes
 * empty folders after cleanup.
 * 
 * @param options - Configuration options for the clear empty operation
 * @returns Promise with information about deleted files and folders
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await profileClearEmpty();
 * console.log(result.outputString); // "Deleted 5 empty CSV files and 2 empty folders"
 * 
 * // With custom CSV path
 * const result = await profileClearEmpty({ 'es-csv': './custom-csv' });
 * ```
 */
export async function profileClearEmpty(options: ProfileOptions = {}): Promise<EmptyClearerResult> {
    return await profileClearEmptyCommand(options);
}

/**
 * Checks if XML and CSV files are properly aligned (in sync)
 * 
 * Verifies that the CSV files accurately represent the XML metadata
 * by comparing their contents after a merge operation.
 * 
 * @param options - Configuration options for the alignment check
 * @returns Promise with alignment check results
 * 
 * @example
 * ```typescript
 * // Check specific profile with auto-resolved paths
 * const result = await profileAreAligned({ input: 'Admin' });
 * if (result.alignedItems === result.totalItems) {
 *   console.log('Profile is properly aligned!');
 * }
 * 
 * // Check all profiles
 * const result = await profileAreAligned();
 * ```
 */
export async function profileAreAligned(options: ProfileOptions = {}): Promise<ValidationSummary> {
    return await profileAreAlignedCommand(options);
}

/**
 * Updates keys in CSV files based on a mapping
 * 
 * Useful for renaming metadata references across all profiles
 * (e.g., renaming a custom field or object).
 * 
 * @param options - Configuration options for the update key operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Update keys with auto-resolved paths
 * const result = await profileUpdateKey({
 * });
 * console.log('Keys updated successfully');
 * ```
 */
export async function profileUpdateKey(options: ProfileOptions): Promise<any> {
    return await profileUpdateKeyCommand(options);
}

/**
 * Minifies profile CSV files by removing entries with only false permissions
 * 
 * Removes CSV entries that contain only false values for permission fields,
 * keeping the CSV files clean and focused on actual granted permissions.
 * 
 * @param options - Configuration options for the minify operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await profileMinify({ input: 'Admin' });
 * console.log(result.outputString); // "OK"
 * 
 * // All profiles with default paths
 * const result = await profileMinify();
 * ```
 */
export async function profileMinify(options: ProfileOptions = {}): Promise<{ outputString: string }> {
    return await profileMinifyCommand(options);
}

/**
 * Deletes specific entries from profile CSV files
 * 
 * Removes specified entries from profile CSV files based on type and tagid.
 * Useful for bulk removal of permissions or settings.
 * 
 * @param options - Configuration options for the delete operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Delete specific field permissions
 * const result = await profileDelete({
 *   input: 'Admin',
 *   type: 'fieldPermissions',
 *   tagid: 'Account.MyField__c'
 * });
 * console.log(result.outputString); // "OK"
 * ```
 */
export async function profileDelete(options: ProfileOptions): Promise<{ outputString: string }> {
    return await profileDeleteCommand(options);
}

/**
 * Cleans profile CSV files by removing references to non-existent metadata
 * 
 * Removes entries that reference metadata components that no longer exist
 * in the target org or local source, keeping profiles clean and deployable.
 * 
 * @param options - Configuration options for the clean operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Clean all profiles against org metadata
 * const result = await profileClean({ 
 *   orgname: 'myorg',
 *   target: 'org'
 * });
 * console.log(result.outputString); // "OK"
 * 
 * // Clean specific profiles in interactive mode
 * const result = await profileClean({
 *   input: 'Admin,Standard User',
 *   mode: 'interactive'
 * });
 * ```
 */
export async function profileClean(options: ProfileOptions = {}): Promise<{ outputString: string }> {
    return await profileCleanCommand(options);
}

/**
 * Profile API namespace - contains all profile-related operations
 */
export const profiles = {
    split: profileSplit,
    upsert: profileUpsert,
    merge: profileMerge,
    clearEmpty: profileClearEmpty,
    areAligned: profileAreAligned,
    updateKey: profileUpdateKey,
    minify: profileMinify,
    delete: profileDelete,
    clean: profileClean
};

/**
 * Export individual functions as well for flexibility
 */
export {
    profileSplit as split,
    profileUpsert as upsert,
    profileMerge as merge,
    profileClearEmpty as clearEmpty,
    profileAreAligned as areAligned,
    profileUpdateKey as updateKey,
    profileMinify as minify,
    profileDelete as delete,
    profileClean as clean
};
