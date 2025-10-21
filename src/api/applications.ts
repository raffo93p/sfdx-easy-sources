import { AnyJson } from '@salesforce/ts-types';
import { applicationSplit } from '../commands/easysources/applications/split';
import { applicationUpsert } from '../commands/easysources/applications/upsert';
import { applicationMerge } from '../commands/easysources/applications/merge';
import { applicationAreAligned } from '../commands/easysources/applications/arealigned';
import { applicationUpdateKey } from '../commands/easysources/applications/updatekey';

/**
 * Interface for Application operation options.
 * All properties are optional and will be resolved automatically from easysources-settings.json if not provided.
 */
export interface ApplicationOptions {
  /** Path to Salesforce XML metadata files */
  'sf-xml'?: string;
  /** Path to EasySources CSV files */
  'es-csv'?: string;
  /** Input path override */
  input?: string;
  /** Sort output (default: 'true') */
  sort?: 'true' | 'false';
  /** Mode for areAligned operation (default: 'string') */
  mode?: 'string' | 'logic';
}

/**
 * Application namespace containing all programmatic API functions for Salesforce Application metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits applications into separate files
 * - upsert(): Updates or inserts application records
 * - merge(): Merges application files
 * - areAligned(): Checks if applications are aligned between environments
 * - updateKey(): Updates application keys
 * 
 * @example
 * ```javascript
 * const { applications } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await applications.split();
 * 
 * // Override specific paths
 * await applications.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */
export const applications = {
  /**
   * Splits applications into separate files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: ApplicationOptions = {}): Promise<AnyJson> => {
    return applicationSplit(options);
  },

  /**
   * Updates or inserts application records from CSV files to Salesforce metadata format.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: ApplicationOptions = {}): Promise<AnyJson> => {
    return applicationUpsert(options);
  },

  /**
   * Merges application files back into unified metadata files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: ApplicationOptions = {}): Promise<AnyJson> => {
    return applicationMerge(options);
  },

  /**
   * Checks if applications are aligned between different environments or sources.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to alignment check result
   */
  areAligned: async (options: ApplicationOptions = {}): Promise<AnyJson> => {
    return applicationAreAligned(options);
  },

  /**
   * Updates application keys based on configuration rules.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to key update result
   */
  updateKey: async (options: ApplicationOptions = {}): Promise<AnyJson> => {
    return applicationUpdateKey(options);
  }
};

// Export individual functions for more granular imports
export { applicationSplit };
export { applicationUpsert };
export { applicationMerge };
export { applicationAreAligned };
export { applicationUpdateKey };
export { applicationSplit as split };
export { applicationUpsert as upsert };
export { applicationMerge as merge };
export { applicationAreAligned as areAligned };
export { applicationUpdateKey as updateKey };
