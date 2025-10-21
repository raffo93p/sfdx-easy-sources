/**
 * Permission Set API - Programmatic access to all permission set-related operations
 * 
 * This module exposes all the core functionality for working with Salesforce permission sets
 * without requiring the SFDX CLI interface. Use these functions in your Node.js scripts
 * to manipulate permission set metadata programmatically.
 * 
 * @example
 * ```typescript
 * import { permissionsets } from 'sfdx-easy-sources';
 * 
 * // Split a permission set into CSV files (paths auto-resolved from settings)
 * await permissionsets.split({ input: 'MyPermSet' });
 * 
 * // Upsert changes from XML to CSV (no options needed if using defaults)
 * await permissionsets.upsert();
 * 
 * // Merge CSV files back to XML with custom paths
 * await permissionsets.merge({
 *   'es-csv': './custom-csv-path',
 *   input: 'MyPermSet'
 * });
 * ```
 */

import { PathOptions } from './paths';
import { EmptyClearerResult } from '../utils/commands/emptyClearer';
import { ValidationSummary } from '../utils/commands/alignmentChecker';

// Import permission set-specific functions directly from command files
import { permissionsetSplit as permissionsetSplitCommand } from '../commands/easysources/permissionsets/split';
import { permissionsetUpsert as permissionsetUpsertCommand } from '../commands/easysources/permissionsets/upsert';
import { permissionsetMerge as permissionsetMergeCommand } from '../commands/easysources/permissionsets/merge';
import { permissionsetUpdateKey as permissionsetUpdateKeyCommand } from '../commands/easysources/permissionsets/updatekey';
import { permissionsetAreAligned as permissionsetAreAlignedCommand } from '../commands/easysources/permissionsets/arealigned';
import { permissionsetClearEmpty as permissionsetClearEmptyCommand } from '../commands/easysources/permissionsets/clearempty';
import { permissionsetMinify as permissionsetMinifyCommand } from '../commands/easysources/permissionsets/minify';
import { permissionsetDelete as permissionsetDeleteCommand } from '../commands/easysources/permissionsets/delete';
import { permissionsetClean as permissionsetCleanCommand } from '../commands/easysources/permissionsets/clean';

/**
 * Permission set-specific options interface
 * Extends the common PathOptions with permission set-specific settings
 */
export interface PermissionsetOptions extends PathOptions {
    /** Comma-separated list of specific permission sets to process (without .permissionset-meta.xml extension) */
    input?: string;
    // Additional permission set-specific options can be added here
    [key: string]: any;
}

/**
 * Splits permission set XML files into manageable CSV files
 * 
 * Each permission set is split into separate CSV files based on permission types:
 * - applicationVisibilities
 * - classAccesses
 * - customMetadataTypeAccesses
 * - customPermissions
 * - customSettingAccesses
 * - fieldPermissions
 * - objectPermissions
 * - pageAccesses
 * - recordTypeVisibilities
 * - tabSettings
 * - userPermissions
 * 
 * @param options - Configuration options for the split operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await permissionsetSplit({ input: 'MyPermSet,AnotherPermSet' });
 * console.log(result.outputString); // "OK"
 * 
 * // Override specific paths if needed
 * const result = await permissionsetSplit({
 *   'es-csv': './custom-output',
 *   input: 'MyPermSet'
 * });
 * ```
 */
export async function permissionsetSplit(options: PermissionsetOptions = {}): Promise<{ outputString: string }> {
    const result = await permissionsetSplitCommand(options);

    if (!result) {
        throw new Error('Split operation failed - check that your input paths exist and contain valid permission set metadata');
    }
    
    return result;
}

/**
 * Upserts (updates or inserts) permission set data from XML into existing CSV files
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
 * const result = await permissionsetUpsert();
 * console.log(result.outputString); // "OK"
 * 
 * // With specific options
 * const result = await permissionsetUpsert({ input: 'MyPermSet' });
 * ```
 */
export async function permissionsetUpsert(options: PermissionsetOptions = {}): Promise<{ outputString: string }> {
    const result = await permissionsetUpsertCommand(options);
    
    if (!result) {
        throw new Error('Upsert operation failed - check that your input paths exist and contain valid permission set metadata');
    }
    
    return result;
}

/**
 * Merges CSV files back into permission set XML format for deployment
 * 
 * Combines all the CSV files for a permission set back into a single XML file
 * that can be deployed to a Salesforce org.
 * 
 * @param options - Configuration options for the merge operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await permissionsetMerge({ input: 'MyPermSet,AnotherPermSet' });
 * console.log(result.result); // "OK"
 * 
 * // All permission sets with default paths
 * const result = await permissionsetMerge();
 * ```
 */
export async function permissionsetMerge(options: PermissionsetOptions = {}): Promise<{ result: string }> {
    const result = await permissionsetMergeCommand(options);
    
    if (!result) {
        throw new Error('Merge operation failed - check that your CSV paths exist and contain valid permission set data');
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
 * const result = await permissionsetClearEmpty();
 * console.log(result.outputString); // "Deleted 5 empty CSV files and 2 empty folders"
 * 
 * // With custom CSV path
 * const result = await permissionsetClearEmpty({ 'es-csv': './custom-csv' });
 * ```
 */
export async function permissionsetClearEmpty(options: PermissionsetOptions = {}): Promise<EmptyClearerResult> {
    return await permissionsetClearEmptyCommand(options);
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
 * // Check specific permission set with auto-resolved paths
 * const result = await permissionsetAreAligned({ input: 'MyPermSet' });
 * if (result.alignedItems === result.totalItems) {
 *   console.log('Permission set is properly aligned!');
 * }
 * 
 * // Check all permission sets
 * const result = await permissionsetAreAligned();
 * ```
 */
export async function permissionsetAreAligned(options: PermissionsetOptions = {}): Promise<ValidationSummary> {
    return await permissionsetAreAlignedCommand(options);
}

/**
 * Updates keys in CSV files based on a mapping
 * 
 * Useful for renaming metadata references across all permission sets
 * (e.g., renaming a custom field or object).
 * 
 * @param options - Configuration options for the update key operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Update keys with auto-resolved paths
 * const result = await permissionsetUpdateKey({
 * });
 * console.log('Keys updated successfully');
 * ```
 */
export async function permissionsetUpdateKey(options: PermissionsetOptions): Promise<any> {
    return await permissionsetUpdateKeyCommand(options);
}

/**
 * Minifies permission set CSV files by removing entries with only false permissions
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
 * const result = await permissionsetMinify({ input: 'MyPermSet' });
 * console.log(result.outputString); // "OK"
 * 
 * // All permission sets with default paths
 * const result = await permissionsetMinify();
 * ```
 */
export async function permissionsetMinify(options: PermissionsetOptions = {}): Promise<{ outputString: string }> {
    return await permissionsetMinifyCommand(options);
}

/**
 * Deletes specific entries from permission set CSV files
 * 
 * Removes specified entries from permission set CSV files based on type and tagid.
 * Useful for bulk removal of permissions or settings.
 * 
 * @param options - Configuration options for the delete operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Delete specific field permissions
 * const result = await permissionsetDelete({
 *   input: 'MyPermSet',
 *   type: 'fieldPermissions',
 *   tagid: 'Account.MyField__c'
 * });
 * console.log(result.outputString); // "OK"
 * ```
 */
export async function permissionsetDelete(options: PermissionsetOptions): Promise<{ outputString: string }> {
    return await permissionsetDeleteCommand(options);
}

/**
 * Cleans permission set CSV files by removing references to non-existent metadata
 * 
 * Removes entries that reference metadata components that no longer exist
 * in the target org or local source, keeping permission sets clean and deployable.
 * 
 * @param options - Configuration options for the clean operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Clean all permission sets against org metadata
 * const result = await permissionsetClean({ 
 *   orgname: 'myorg',
 *   target: 'org'
 * });
 * console.log(result.outputString); // "OK"
 * 
 * // Clean specific permission sets in interactive mode
 * const result = await permissionsetClean({
 *   input: 'MyPermSet,AnotherPermSet',
 *   mode: 'interactive'
 * });
 * ```
 */
export async function permissionsetClean(options: PermissionsetOptions = {}): Promise<{ outputString: string }> {
    return await permissionsetCleanCommand(options);
}

/**
 * Permission set API namespace - contains all permission set-related operations
 */
export const permissionsets = {
    split: permissionsetSplit,
    upsert: permissionsetUpsert,
    merge: permissionsetMerge,
    clearEmpty: permissionsetClearEmpty,
    areAligned: permissionsetAreAligned,
    updateKey: permissionsetUpdateKey,
    minify: permissionsetMinify,
    delete: permissionsetDelete,
    clean: permissionsetClean
};

/**
 * Export individual functions as well for flexibility
 */
export {
    permissionsetSplit as split,
    permissionsetUpsert as upsert,
    permissionsetMerge as merge,
    permissionsetClearEmpty as clearEmpty,
    permissionsetAreAligned as areAligned,
    permissionsetUpdateKey as updateKey,
    permissionsetMinify as minify,
    permissionsetDelete as delete,
    permissionsetClean as clean
};
