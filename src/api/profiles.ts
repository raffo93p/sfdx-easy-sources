import { PathOptions } from './paths';
import { AnyJson } from '@salesforce/ts-types';

// Import profile-specific functions directly from command files
import { profileSplit } from '../commands/easysources/profiles/split';
import { profileUpsert } from '../commands/easysources/profiles/upsert';
import { profileMerge } from '../commands/easysources/profiles/merge';  
import { profileUpdateKey } from '../commands/easysources/profiles/updatekey';
import { profileAreAligned } from '../commands/easysources/profiles/arealigned';
import { profileClearEmpty } from '../commands/easysources/profiles/clearempty';
import { profileMinify } from '../commands/easysources/profiles/minify';
import { profileDelete } from '../commands/easysources/profiles/delete';
import { profileClean } from '../commands/easysources/profiles/clean';
import { profileCustomUpsert } from '../commands/easysources/profiles/customupsert';

/**
 * Configuration options for profile operations
 */
export interface ProfileOptions extends PathOptions {
    // === Common Options (used by multiple operations) ===
    /** Comma-separated list of specific profiles to process (without .profile-meta.xml extension) */
    input?: string;
    /** Ignore user permissions when processing (split, upsert, merge) */
    ignoreuserperm?: string;
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
    /** JSON content to insert/update (customUpsert only) */
    content?: string;
}

/**
 * Profiles namespace containing all programmatic API functions for Salesforce Profile metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits profiles into separate CSV files
 * - upsert(): Updates or inserts profile records from XML to CSV
 * - merge(): Merges profile CSV files back to XML
 * - clearEmpty(): Removes empty CSV files and folders
 * - areAligned(): Checks if profiles are aligned between XML and CSV
 * - updateKey(): Updates profile keys in CSV files
 * - minify(): Removes entries with only false permissions
 * - delete(): Deletes specific entries from CSV files
 * - customUpsert(): Inserts or updates entries via JSON content
 * - clean(): Removes references to non-existent metadata
 * 
 * @example
 * ```javascript
 * const { profiles } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await profiles.split({ input: 'Admin' });
 * 
 * // Override specific paths
 * await profiles.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * 
 * // Custom upsert with JSON content
 * await profiles.customUpsert({
 *   type: 'classAccesses',
 *   content: JSON.stringify({ apexClass: 'MyClass', enabled: true })
 * });
 * ```
 */
export const profiles = {
  /**
   * Splits profiles into separate CSV files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: ProfileOptions = {}): Promise<AnyJson> => {
    return await profileSplit(options);
  },

  /**
   * Updates or inserts profile data from existing XML to CSV files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: ProfileOptions = {}): Promise<AnyJson> => {
    return await profileUpsert(options);
  },

  /**
   * Merges CSV files back into profile XML format for deployment.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: ProfileOptions = {}): Promise<AnyJson> => {
    return await profileMerge(options);
  },

  /**
   * Clears empty CSV files and folders to keep the repository clean.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  clearEmpty: async (options: ProfileOptions = {}): Promise<AnyJson> => {
    return await profileClearEmpty(options);
  },

  /**
   * Checks if XML and CSV files are properly aligned (in sync).
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  areAligned: async (options: ProfileOptions = {}): Promise<AnyJson> => {
    return await profileAreAligned(options);
  },

  /**
   * Updates keys in CSV files based on a mapping.
   * @param options Configuration options for the update key operation
   * @returns Promise resolving to operation result
   */
  updateKey: async (options: ProfileOptions): Promise<AnyJson> => {
    return await profileUpdateKey(options);
  },

  /**
   * Minifies profile CSV files by removing entries with only false permissions.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  minify: async (options: ProfileOptions = {}): Promise<AnyJson> => {
    return await profileMinify(options);
  },

  /**
   * Deletes specific entries from profile CSV files.
   * @param options Configuration options for the delete operation
   * @returns Promise resolving to operation result
   */
  delete: async (options: ProfileOptions): Promise<AnyJson> => {
    return await profileDelete(options);
  },

  /**
   * Inserts or updates specific entries in profile CSV files using JSON content.
   * @param options Configuration options for the custom upsert operation
   * @returns Promise resolving to operation result
   */
  customUpsert: async (options: ProfileOptions): Promise<AnyJson> => {
    return await profileCustomUpsert(options);
  },

  /**
   * Cleans profile CSV files by removing references to non-existent metadata.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  clean: async (options: ProfileOptions = {}): Promise<AnyJson> => {
    return await profileClean(options);
  }
};
