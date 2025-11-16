import { AnyJson } from '@salesforce/ts-types';
import { PathOptions } from './paths';

// Import permission set-specific functions directly from command files
import { permissionsetSplit } from '../commands/easysources/permissionsets/split';
import { permissionsetUpsert } from '../commands/easysources/permissionsets/upsert';
import { permissionsetMerge } from '../commands/easysources/permissionsets/merge';
import { permissionsetUpdateKey } from '../commands/easysources/permissionsets/updatekey';
import { permissionsetAreAligned } from '../commands/easysources/permissionsets/arealigned';
import { permissionsetClearEmpty } from '../commands/easysources/permissionsets/clearempty';
import { permissionsetMinify } from '../commands/easysources/permissionsets/minify';
import { permissionsetDelete } from '../commands/easysources/permissionsets/delete';
import { permissionsetClean } from '../commands/easysources/permissionsets/clean';
import { permissionsetCustomUpsert } from '../commands/easysources/permissionsets/customupsert';

/**
 * Configuration options for permission set operations
 */
export interface PermissionSetOptions extends PathOptions {
    // === Common Options (used by multiple operations) ===
    /** Comma-separated list of specific permission sets to process (without .permissionset-meta.xml extension) */
    input?: string;
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
    /** Skip specified metadata types during clean (clean only) */
    'skip-types'?: string;
    /** Include only specified metadata types during clean (clean only) */
    'include-types'?: string;
    /** Log directory path (clean only) */
    'log-dir'?: string;
    /** Specific permission type to target (upsert, delete, customUpsert only) */
    type?: string;
    /** Specific tag ID to target (upsert, delete only) */
    tagid?: string;
    /** JSON content to insert/update (customUpsert only) - can be object or JSON string */
    content?: string | object | object[];
}

/**
 * Permission Sets namespace containing all programmatic API functions for Salesforce Permission Set metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits permission sets into separate CSV files
 * - upsert(): Updates or inserts permission set records from XML to CSV
 * - merge(): Merges permission set CSV files back to XML
 * - clearEmpty(): Removes empty CSV files and folders
 * - areAligned(): Checks if permission sets are aligned between XML and CSV
 * - updateKey(): Updates permission set keys in CSV files
 * - minify(): Removes entries with only false permissions
 * - delete(): Deletes specific entries from CSV files
 * - customUpsert(): Inserts or updates entries via JSON content
 * - clean(): Removes references to non-existent metadata
 * 
 * @example
 * ```javascript
 * const { permissionSets } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await permissionSets.split({ input: 'MyPermSet' });
 * 
 * // Override specific paths
 * await permissionSets.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * 
 * // Custom upsert with JSON content
 * await permissionSets.customUpsert({
 *   type: 'objectPermissions',
 *   content: { object: 'Account', allowRead: true, allowEdit: true }
 * });
 * ```
 */
export const permissionSets = {
  /**
   * Splits permission sets into separate CSV files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: PermissionSetOptions = {}): Promise<AnyJson> => {
    return await permissionsetSplit(options);
  },

  /**
   * Updates or inserts permission set data from existing XML to CSV files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: PermissionSetOptions = {}): Promise<AnyJson> => {
    return await permissionsetUpsert(options);
  },

  /**
   * Merges CSV files back into permission set XML format for deployment.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: PermissionSetOptions = {}): Promise<AnyJson> => {
    return await permissionsetMerge(options);
  },

  /**
   * Clears empty CSV files and folders to keep the repository clean.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  clearEmpty: async (options: PermissionSetOptions = {}): Promise<AnyJson> => {
    return await permissionsetClearEmpty(options);
  },

  /**
   * Checks if XML and CSV files are properly aligned (in sync).
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  areAligned: async (options: PermissionSetOptions = {}): Promise<AnyJson> => {
    return await permissionsetAreAligned(options);
  },

  /**
   * Updates keys in CSV files based on a mapping.
   * @param options Configuration options for the update key operation
   * @returns Promise resolving to operation result
   */
  updateKey: async (options: PermissionSetOptions): Promise<AnyJson> => {
    return await permissionsetUpdateKey(options);
  },

  /**
   * Minifies permission set CSV files by removing entries with only false permissions.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  minify: async (options: PermissionSetOptions = {}): Promise<AnyJson> => {
    return await permissionsetMinify(options);
  },

  /**
   * Deletes specific entries from permission set CSV files.
   * @param options Configuration options for the delete operation
   * @returns Promise resolving to operation result
   */
  delete: async (options: PermissionSetOptions): Promise<AnyJson> => {
    return await permissionsetDelete(options);
  },

  /**
   * Inserts or updates specific entries in permission set CSV files using JSON content.
   * @param options Configuration options for the custom upsert operation
   * @returns Promise resolving to operation result
   */
  customUpsert: async (options: PermissionSetOptions): Promise<AnyJson> => {
    return await permissionsetCustomUpsert(options);
  },

  /**
   * Cleans permission set CSV files by removing references to non-existent metadata.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  clean: async (options: PermissionSetOptions = {}): Promise<AnyJson> => {
    return await permissionsetClean(options);
  }
};
