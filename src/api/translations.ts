import { AnyJson } from '@salesforce/ts-types';
import { PathOptions } from './paths';

// Import translation-specific functions directly from command files
import { translationSplit } from '../commands/easysources/translations/split';
import { translationUpsert } from '../commands/easysources/translations/upsert';
import { translationMerge } from '../commands/easysources/translations/merge';
import { translationAreAligned } from '../commands/easysources/translations/arealigned';
import { translationMinify } from '../commands/easysources/translations/minify';
import { translationClearEmpty } from '../commands/easysources/translations/clearempty';

/**
 * Interface for Translation operation options.
 * All properties are optional and will be resolved automatically from easysources-settings.json if not provided.
 */
export interface TranslationOptions extends PathOptions {
  /** Input translations (comma-separated) */
  input?: string;
  /** Sort output (default: 'true') */
  sort?: 'true' | 'false';
  /** Mode for areAligned operation (default: 'string') */
  mode?: 'string' | 'logic';
}

/**
 * Translations namespace containing all programmatic API functions for Salesforce Translation metadata operations.
 * 
 * All methods automatically resolve paths from easysources-settings.json configuration file.
 * You only need to provide options to override the default behavior.
 * 
 * Available operations:
 * - split(): Splits translations into separate CSV files
 * - upsert(): Updates or inserts translation records
 * - merge(): Merges translation CSV files back to XML
 * - areAligned(): Checks if translations are aligned between environments
 * - minify(): Removes empty translation entries
 * - clearEmpty(): Removes empty CSV files and folders
 * 
 * @example
 * ```javascript
 * const { translations } = require('sfdx-easy-sources');
 * 
 * // Using default settings from easysources-settings.json
 * await translations.split();
 * 
 * // Override specific paths
 * await translations.upsert({
 *   'sf-xml': './custom-metadata-path',
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */
export const translations = {
  /**
   * Splits translations into separate CSV files for easier management and version control.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  split: async (options: TranslationOptions = {}): Promise<AnyJson> => {
    return translationSplit(options);
  },

  /**
   * Updates or inserts translation records from CSV files to Salesforce metadata format.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  upsert: async (options: TranslationOptions = {}): Promise<AnyJson> => {
    return translationUpsert(options);
  },

  /**
   * Merges translation CSV files back into unified metadata files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to operation result
   */
  merge: async (options: TranslationOptions = {}): Promise<AnyJson> => {
    return translationMerge(options);
  },

  /**
   * Checks if translations are aligned between different environments or sources.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to alignment check result
   */
  areAligned: async (options: TranslationOptions = {}): Promise<AnyJson> => {
    return translationAreAligned(options);
  },

  /**
   * Removes empty translation entries to clean up CSV files.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to minify result
   */
  minify: async (options: TranslationOptions = {}): Promise<AnyJson> => {
    return translationMinify(options);
  },

  /**
   * Removes empty CSV files and folders from the translations directory.
   * @param options Optional configuration, automatically resolved from settings if not provided
   * @returns Promise resolving to cleanup result
   */
  clearEmpty: async (options: TranslationOptions = {}): Promise<AnyJson> => {
    return translationClearEmpty(options);
  }
};