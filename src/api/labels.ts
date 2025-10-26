import { AnyJson } from '@salesforce/ts-types';
import { PathOptions } from './paths';

// Import label-specific functions directly from command files
import { labelSplit } from '../commands/easysources/labels/split';
import { labelUpsert } from '../commands/easysources/labels/upsert';
import { labelMerge } from '../commands/easysources/labels/merge';
import { labelUpdateKey } from '../commands/easysources/labels/updatekey';
import { labelAreAligned } from '../commands/easysources/labels/arealigned';

/**
 * Label-specific options interface
 * Extends the common PathOptions with label-specific settings
 */
export interface LabelOptions extends PathOptions {
  /** Sort output (default: 'false') */
  sort?: 'true' | 'false';
  /** Mode for areAligned operation (default: 'string') */
  mode?: 'string' | 'logic';
}

/**
 * Labels namespace containing all programmatic API functions for Salesforce Custom Label metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits custom labels into separate CSV files
 * - upsert(): Updates or inserts label records from XML to CSV
 * - merge(): Merges label CSV files back to XML
 * - areAligned(): Checks if labels are aligned between XML and CSV
 * - updateKey(): Updates label keys in CSV files
 * 
 * @example
 * ```javascript
 * const { labels } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await labels.split();
 * 
 * // Override specific paths
 * await labels.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */
export const labels = {
  /**
   * Splits custom labels into separate CSV files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: LabelOptions = {}): Promise<AnyJson> => {
    return await labelSplit(options);
  },

  /**
   * Updates or inserts label records from XML to CSV format.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: LabelOptions = {}): Promise<AnyJson> => {
    return await labelUpsert(options);
  },

  /**
   * Merges label CSV files back into unified XML metadata files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: LabelOptions = {}): Promise<AnyJson> => {
    return await labelMerge(options);
  },

  /**
   * Checks if labels are aligned between different environments or sources.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to alignment check result
   */
  areAligned: async (options: LabelOptions = {}): Promise<AnyJson> => {
    return await labelAreAligned(options);
  },

  /**
   * Updates label keys based on configuration rules.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to key update result
   */
  updateKey: async (options: LabelOptions = {}): Promise<AnyJson> => {
    return await labelUpdateKey(options);
  }
};
