import { AnyJson } from '@salesforce/ts-types';
import { PathOptions } from './paths';

// Import object translation-specific functions directly from command files
import { objectTranslationSplit } from '../commands/easysources/objecttranslations/split';
import { objectTranslationUpsert } from '../commands/easysources/objecttranslations/upsert';
import { objectTranslationMerge } from '../commands/easysources/objecttranslations/merge';
import { objectTranslationAreAligned } from '../commands/easysources/objecttranslations/arealigned';
import { objectTranslationClearEmpty } from '../commands/easysources/objecttranslations/clearempty';
import { objectTranslationMinify } from '../commands/easysources/objecttranslations/minify';

/**
 * Object Translation-specific options interface
 * Extends the common PathOptions with object translation-specific settings
 */
export interface ObjectTranslationOptions extends PathOptions {
    /** Comma-separated list of specific object translations to process (format: ObjectName-Language) */
    input?: string;
    /** Sort option for organizing CSV content (default: true) */
    sort?: string | boolean;
    /** Mode for alignment checking (string or logic) */
    mode?: 'string' | 'logic';
    // Additional object translation-specific options can be added here
    [key: string]: any;
}

/**
 * Object Translations namespace containing all programmatic API functions for Salesforce Object Translation metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits object translations into separate CSV files
 * - upsert(): Updates or inserts object translation records from XML to CSV
 * - merge(): Merges object translation CSV files back to XML
 * - clearEmpty(): Removes empty CSV files and folders
 * - areAligned(): Checks if object translations are aligned between XML and CSV
 * - minify(): Removes empty translation entries from CSV files
 * 
 * @example
 * ```javascript
 * const { objectTranslations } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await objectTranslations.split({ input: 'Account-es' });
 * 
 * // Override specific paths
 * await objectTranslations.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */
export const objectTranslations = {
  /**
   * Splits object translations into separate CSV files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: ObjectTranslationOptions = {}): Promise<AnyJson> => {
    return await objectTranslationSplit(options);
  },

  /**
   * Updates or inserts object translation records from XML to CSV format.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: ObjectTranslationOptions = {}): Promise<AnyJson> => {
    return await objectTranslationUpsert(options);
  },

  /**
   * Merges object translation CSV files back into unified XML metadata files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: ObjectTranslationOptions = {}): Promise<AnyJson> => {
    return await objectTranslationMerge(options);
  },

  /**
   * Removes empty CSV files and folders to keep the repository clean.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to cleanup result
   */
  clearEmpty: async (options: ObjectTranslationOptions = {}): Promise<AnyJson> => {
    return await objectTranslationClearEmpty(options);
  },

  /**
   * Checks if object translations are aligned between different environments or sources.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to alignment check result
   */
  areAligned: async (options: ObjectTranslationOptions = {}): Promise<AnyJson> => {
    return await objectTranslationAreAligned(options);
  },

  /**
   * Removes empty translation entries from CSV files based on configuration rules.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to minify result
   */
  minify: async (options: ObjectTranslationOptions = {}): Promise<AnyJson> => {
    return await objectTranslationMinify(options);
  }
};
