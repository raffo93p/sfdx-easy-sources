import { AnyJson } from '@salesforce/ts-types';
import { PathOptions } from './paths';

// Import record type-specific functions directly from command files
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
export interface RecordTypeOptions extends PathOptions{
    // === Common Options (used by multiple operations) ===
    /** Comma-separated list of object names (all operations) */
    object?: string;
    /** Comma-separated list of record type names (all operations) */
    recordtype?: string;
    /** Sort entries alphabetically (all operations) */
    sort?: boolean | string;
    
    // === Operation-specific Options ===
    /** Target org username/alias (clean only) */
    orgname?: string;
    /** Validation mode - areAligned: 'string'|'logic', clean: 'clean'|'log' */
    mode?: 'string' | 'logic' | 'clean' | 'log';
    /** Validation target (clean only) */
    target?: 'org' | 'local' | 'both';
    /** Include standard fields in validation (clean only) */
    'include-standard-fields'?: boolean;
    /** Skip package manifest creation (clean only) */  
    'skip-manifest-creation'?: boolean;
    /** Log directory path (clean only) */
    'log-dir'?: string;
    /** Picklist name to delete (delete only - required) */
    picklist?: string;
    /** API name to delete (delete only - optional) */
    apiname?: string;
}



/**
 * Record Types namespace containing all programmatic API functions for Salesforce Record Type metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits record types into separate CSV files
 * - merge(): Merges record type CSV files back to XML
 * - upsert(): Updates or inserts record type data from XML to CSV
 * - delete(): Deletes specific entries from CSV files
 * - areAligned(): Checks if record types are aligned between XML and CSV
 * - updateKey(): Updates record type keys in CSV files
 * - clean(): Removes references to non-existent metadata
 * 
 * @example
 * ```javascript
 * const { recordtypes } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await recordtypes.split({ object: 'Account' });
 * 
 * // Override specific paths
 * await recordtypes.merge({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */
export const recordtypes = {
  /**
   * Split record type metadata from XML to CSV format for easier editing.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: RecordTypeOptions = {}): Promise<AnyJson> => {
    return await recordTypeSplit(options);
  },

  /**
   * Merge CSV record type data back into XML format.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: RecordTypeOptions = {}): Promise<AnyJson> => {
    return await recordTypeMerge(options);
  },

  /**
   * Upsert XML record type data into existing CSV files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: RecordTypeOptions = {}): Promise<AnyJson> => {
    return await recordTypeUpsert(options);
  },

  /**
   * Delete entries from record type CSV files.
   * @param options Configuration options for the delete operation
   * @returns Promise resolving to operation result
   */
  delete: async (options: RecordTypeOptions): Promise<AnyJson> => {
    return await recordTypeDelete(options);
  },

  /**
   * Validate alignment between XML and CSV record type data.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  areAligned: async (options: RecordTypeOptions = {}): Promise<AnyJson> => {
    return await recordTypeAreAligned(options);
  },

  /**
   * Update CSV tag IDs for record type entries.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  updateKey: async (options: RecordTypeOptions = {}): Promise<AnyJson> => {
    return await recordTypeUpdateKey(options);
  },

  /**
   * Clean invalid field references from record type CSV data.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  clean: async (options: RecordTypeOptions = {}): Promise<AnyJson> => {
    return await recordTypeClean(options);
  }
};
