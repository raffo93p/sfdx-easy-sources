import { AnyJson } from '@salesforce/ts-types';
import { PathOptions } from './paths';
import { globalValueSetSplit } from '../commands/easysources/globalvaluesets/split';
import { globalValueSetUpsert } from '../commands/easysources/globalvaluesets/upsert';
import { globalValueSetMerge } from '../commands/easysources/globalvaluesets/merge';
import { globalValueSetAreAligned } from '../commands/easysources/globalvaluesets/arealigned';
import { globalValueSetUpdateKey } from '../commands/easysources/globalvaluesets/updatekey';

/**
 * Interface for Global Value Set operation options.
 * All properties are optional and will be resolved automatically from easysources-settings.json if not provided.
 */
export interface GlobalValueSetOptions extends PathOptions {
  /** Input global value sets (comma-separated) */
  input?: string;
  /** Sort output (default: 'false') */
  sort?: 'true' | 'false';
  /** Mode for areAligned operation (default: 'string') */
  mode?: 'string' | 'logic';
}

/**
 * Global Value Sets namespace containing all programmatic API functions for Salesforce Global Value Set metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits global value sets into separate CSV files
 * - upsert(): Updates or inserts global value set records
 * - merge(): Merges global value set CSV files back to XML
 * - areAligned(): Checks if global value sets are aligned between environments
 * - updateKey(): Updates global value set keys
 * 
 * @example
 * ```javascript
 * const { globalValueSets } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await globalValueSets.split();
 * 
 * // Override specific paths
 * await globalValueSets.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */
export const globalValueSets = {
  /**
   * Splits global value sets into separate CSV files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: GlobalValueSetOptions = {}): Promise<AnyJson> => {
    return globalValueSetSplit(options);
  },

  /**
   * Updates or inserts global value set records from CSV files to Salesforce metadata format.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: GlobalValueSetOptions = {}): Promise<AnyJson> => {
    return globalValueSetUpsert(options);
  },

  /**
   * Merges global value set CSV files back into unified metadata files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: GlobalValueSetOptions = {}): Promise<AnyJson> => {
    return globalValueSetMerge(options);
  },

  /**
   * Checks if global value sets are aligned between different environments or sources.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to alignment check result
   */
  areAligned: async (options: GlobalValueSetOptions = {}): Promise<AnyJson> => {
    return globalValueSetAreAligned(options);
  },

  /**
   * Updates global value set keys based on configuration rules.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to key update result
   */
  updateKey: async (options: GlobalValueSetOptions = {}): Promise<AnyJson> => {
    return globalValueSetUpdateKey(options);
  }
};


