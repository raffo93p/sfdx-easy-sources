import { AnyJson } from '@salesforce/ts-types';
import { recordTypeSplit } from '../commands/easysources/recordtypes/split';
import { recordTypeMerge } from '../commands/easysources/recordtypes/merge';
import { recordTypeUpsert } from '../commands/easysources/recordtypes/upsert';
import { recordTypeDelete } from '../commands/easysources/recordtypes/delete';
import { recordTypeAreAligned } from '../commands/easysources/recordtypes/arealigned';
import { recordTypeUpdateKey } from '../commands/easysources/recordtypes/updatekey';
import { recordTypeClean } from '../commands/easysources/recordtypes/clean';

/**
 * Configuration options for record type operations
 */
export interface RecordTypeOptions {
    /** Path to Salesforce XML directory */
    sfXml?: string;
    /** Path to EasySources CSV directory */  
    esCsv?: string;
    /** Target org username/alias */
    orgname?: string;
    /** Comma-separated list of object names */
    object?: string;
    /** Comma-separated list of record type names */
    recordtype?: string;
    /** Sort entries alphabetically */
    sort?: boolean | string;
    /** Validation mode for areAligned */
    mode?: 'string' | 'logic';
    /** Validation only, no actual deployment */
    checkonly?: boolean;
    /** Clean mode */
    cleanMode?: 'clean' | 'interactive' | 'log';
    /** Validation target */
    target?: 'org' | 'local' | 'both';
    /** Include standard fields in operations */
    includeStandardFields?: boolean;
    /** Skip package manifest creation */
    skipManifestCreation?: boolean;
    /** Log directory path */
    logDir?: string;
}

/**
 * Record Types API - Programmatic access to all record type management operations
 * 
 * This module provides a comprehensive API for managing Salesforce record type metadata
 * using the EasySources plugin's CSV-based split-merge workflow.
 * 
 * @example
 * ```typescript
 * import { recordtypes } from 'sfdx-easy-sources';
 * 
 * // Split record types to CSV
 * await recordtypes.split({ object: 'Account,Contact' });
 * 
 * // Merge modified CSV back to XML
 * await recordtypes.merge({ recordtype: 'BusinessAccount' });
 * 
 * // Update record types in org
 * await recordtypes.upsert({ object: 'Account' });
 * ```
 */

/**
 * Split record type metadata from XML to CSV format for easier editing
 * @param options - Configuration options
 * @param options.sfXml - Path to Salesforce XML directory
 * @param options.esCsv - Path to EasySources CSV directory  
 * @param options.object - Comma-separated list of object names to process
 * @param options.recordtype - Comma-separated list of record type names to process
 * @param options.sort - Sort CSV entries (default: true)
 * @returns Promise resolving to operation result
 */
export async function split(options: any = {}): Promise<AnyJson> {
    return await recordTypeSplit(options);
}

/**
 * Merge CSV record type data back into XML format
 * @param options - Configuration options
 * @param options.sfXml - Path to Salesforce XML directory
 * @param options.esCsv - Path to EasySources CSV directory
 * @param options.object - Comma-separated list of object names to process
 * @param options.recordtype - Comma-separated list of record type names to process
 * @param options.sort - Sort merged entries (default: true)
 * @returns Promise resolving to operation result
 */
export async function merge(options: any = {}): Promise<AnyJson> {
    return await recordTypeMerge(options);
}

/**
 * Deploy record types to Salesforce org (create/update)
 * @param options - Configuration options
 * @param options.sfXml - Path to Salesforce XML directory
 * @param options.orgname - Target org username/alias
 * @param options.object - Comma-separated list of object names to process
 * @param options.recordtype - Comma-separated list of record type names to process
 * @param options.checkonly - Validate deployment without committing changes
 * @returns Promise resolving to deployment result
 */
export async function upsert(options: any = {}): Promise<AnyJson> {
    return await recordTypeUpsert(options);
}

/**
 * Delete record types from Salesforce org
 * @param options - Configuration options
 * @param options.orgname - Target org username/alias
 * @param options.object - Comma-separated list of object names to process
 * @param options.recordtype - Comma-separated list of record type names to process
 * @param options.checkonly - Validate deletion without committing changes
 * @returns Promise resolving to deletion result
 */
export async function remove(options: any = {}): Promise<AnyJson> {
    return await recordTypeDelete(options);
}

/**
 * Validate alignment between XML and CSV record type data
 * @param options - Configuration options
 * @param options.sfXml - Path to Salesforce XML directory
 * @param options.esCsv - Path to EasySources CSV directory
 * @param options.object - Comma-separated list of object names to process
 * @param options.recordtype - Comma-separated list of record type names to process
 * @param options.mode - Validation mode: 'string' or 'logic' (default: 'string')
 * @param options.sort - Sort comparison data (default: true)
 * @returns Promise resolving to validation results
 */
export async function areAligned(options: any = {}): Promise<AnyJson> {
    return await recordTypeAreAligned(options);
}

/**
 * Update CSV tag IDs for record type entries
 * @param options - Configuration options
 * @param options.esCsv - Path to EasySources CSV directory
 * @param options.object - Comma-separated list of object names to process
 * @param options.recordtype - Comma-separated list of record type names to process
 * @param options.sort - Sort updated entries (default: true)
 * @returns Promise resolving to update result
 */
export async function updateKey(options: any = {}): Promise<AnyJson> {
    return await recordTypeUpdateKey(options);
}

/**
 * Clean invalid field references from record type CSV data
 * @param options - Configuration options
 * @param options.sfXml - Path to Salesforce XML directory
 * @param options.esCsv - Path to EasySources CSV directory
 * @param options.orgname - Source org username/alias
 * @param options.object - Comma-separated list of object names to process
 * @param options.recordtype - Comma-separated list of record type names to process
 * @param options.mode - Clean mode: 'clean', 'interactive', or 'log' (default: 'clean')
 * @param options.target - Validation target: 'org', 'local', or 'both' (default: 'both')
 * @param options.includeStandardFields - Include standard fields in validation (default: false)
 * @param options.skipManifestCreation - Skip package manifest generation (default: false)
 * @param options.logDir - Directory for log output
 * @param options.sort - Sort cleaned entries (default: true)
 * @returns Promise resolving to cleaning result
 */
export async function clean(options: any = {}): Promise<AnyJson> {
    return await recordTypeClean(options);
}

// Individual function exports for direct import
export { recordTypeSplit, recordTypeMerge, recordTypeUpsert, recordTypeDelete, recordTypeAreAligned, recordTypeUpdateKey, recordTypeClean };

// Namespace export
export const recordtypes = {
    split,
    merge,
    upsert,
    remove,
    areAligned,
    updateKey,
    clean
};

// Default export with all functions
export default {
    split,
    merge,
    upsert,
    remove,
    areAligned,
    updateKey,
    clean
};
