import { AnyJson } from '@salesforce/ts-types';
import { PathOptions } from './paths';
import { globalValueSetTranslationSplit } from '../commands/easysources/globalvaluesettranslations/split';
import { globalValueSetTranslationUpsert } from '../commands/easysources/globalvaluesettranslations/upsert';
import { globalValueSetTranslationMerge } from '../commands/easysources/globalvaluesettranslations/merge';
import { globalValueSetTranslationAreAligned } from '../commands/easysources/globalvaluesettranslations/arealigned';
import { globalValueSetTranslationUpdateKey } from '../commands/easysources/globalvaluesettranslations/updatekey';

/**
 * Interface for Global Value Set Translation operation options.
 * All properties are optional and will be resolved automatically from easysources-settings.json if not provided.
 */
export interface GlobalValueSetTranslationOptions extends PathOptions {
  /** Input global value set translations (comma-separated) */
  input?: string;
  /** Sort output (default: 'false') */
  sort?: 'true' | 'false';
  /** Mode for areAligned operation (default: 'string') */
  mode?: 'string' | 'logic';
}

/**
 * Global Value Set Translations namespace containing all programmatic API functions for Salesforce Global Value Set Translation metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits global value set translations into separate CSV files
 * - upsert(): Updates or inserts global value set translation records
 * - merge(): Merges global value set translation CSV files back to XML
 * - areAligned(): Checks if global value set translations are aligned between environments
 * - updateKey(): Updates global value set translation keys
 * 
 * @example
 * ```javascript
 * const { globalValueSetTranslations } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await globalValueSetTranslations.split();
 * 
 * // Override specific paths
 * await globalValueSetTranslations.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */
export const globalValueSetTranslations = {
  /**
   * Splits global value set translations into separate CSV files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: GlobalValueSetTranslationOptions = {}): Promise<AnyJson> => {
    return globalValueSetTranslationSplit(options);
  },

  /**
   * Updates or inserts global value set translation records from CSV files to Salesforce metadata format.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: GlobalValueSetTranslationOptions = {}): Promise<AnyJson> => {
    return globalValueSetTranslationUpsert(options);
  },

  /**
   * Merges global value set translation CSV files back into unified metadata files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: GlobalValueSetTranslationOptions = {}): Promise<AnyJson> => {
    return globalValueSetTranslationMerge(options);
  },

  /**
   * Checks if global value set translations are aligned between different environments or sources.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to alignment check result
   */
  areAligned: async (options: GlobalValueSetTranslationOptions = {}): Promise<AnyJson> => {
    return globalValueSetTranslationAreAligned(options);
  },

  /**
   * Updates global value set translation keys based on configuration rules.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to key update result
   */
  updateKey: async (options: GlobalValueSetTranslationOptions = {}): Promise<AnyJson> => {
    return globalValueSetTranslationUpdateKey(options);
  }
};


