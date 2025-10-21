/**
 * Object Translation API - Programmatic access to all object translation-related operations
 * 
 * This module exposes all the core functionality for working with Salesforce object translations
 * without requiring the SFDX CLI interface. Use these functions in your Node.js scripts
 * to manipulate object translation metadata programmatically.
 * 
 * @example
 * ```typescript
 * import { objectTranslations } from 'sfdx-easy-sources';
 * 
 * // Split object translations into CSV files (paths auto-resolved from settings)
 * await objectTranslations.split({ input: 'Account-es' });
 * 
 * // Upsert changes from XML to CSV (no options needed if using defaults)
 * await objectTranslations.upsert();
 * 
 * // Merge CSV files back to XML with custom paths
 * await objectTranslations.merge({
 *   'es-csv': './custom-csv-path',
 *   input: 'Account-es'
 * });
 * ```
 */

import { PathOptions } from './paths';

// Import object translation-specific functions directly from command files
import { objectTranslationSplit as objectTranslationSplitCommand } from '../commands/easysources/objecttranslations/split';
import { objectTranslationUpsert as objectTranslationUpsertCommand } from '../commands/easysources/objecttranslations/upsert';
import { objectTranslationMerge as objectTranslationMergeCommand } from '../commands/easysources/objecttranslations/merge';
import { objectTranslationAreAligned as objectTranslationAreAlignedCommand } from '../commands/easysources/objecttranslations/arealigned';
import { objectTranslationClearEmpty as objectTranslationClearEmptyCommand } from '../commands/easysources/objecttranslations/clearempty';
import { objectTranslationMinify as objectTranslationMinifyCommand } from '../commands/easysources/objecttranslations/minify';

/**
 * Result interface for empty clearer operations
 */
export interface EmptyClearerResult {
    outputString: string;
    deletedFiles: number;
    deletedFolders: number;
}

/**
 * Result interface for validation operations  
 */
export interface ValidationResult {
    itemName: string;
    isAligned: boolean;
    differences: string[];
    isWarning?: boolean;
}

/**
 * Summary interface for validation operations
 */
export interface ValidationSummary {
    totalItems: number;
    alignedItems: number;
    misalignedItems: number;
    warningItems: number;
    results: ValidationResult[];
    [key: string]: any;
}

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
 * Splits object translation XML files into manageable CSV files
 * 
 * Each object translation is split into separate CSV files based on translation types:
 * - fieldTranslations
 * - layouts
 * - recordTypes
 * - validationRules
 * - webLinks
 * - workflowTasks
 * - quickActions
 * - standardFieldTranslations
 * - customFieldTranslations
 * 
 * @param options - Configuration options for the split operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await objectTranslationSplit({ input: 'Account-es,Contact-fr' });
 * console.log(result.outputString); // "OK"
 * 
 * // Override specific paths if needed
 * const result = await objectTranslationSplit({
 *   'es-csv': './custom-output',
 *   input: 'Account-es',
 *   sort: 'true'
 * });
 * ```
 */
export async function objectTranslationSplit(options: ObjectTranslationOptions = {}): Promise<{ outputString: string }> {
    const result = await objectTranslationSplitCommand(options);

    if (!result) {
        throw new Error('Split operation failed - check that your input paths exist and contain valid object translation metadata');
    }
    
    return result as { outputString: string };
}

/**
 * Upserts (updates or inserts) object translation data from XML into existing CSV files
 * 
 * After retrieving updated metadata from an org, use this to merge new translations
 * into your existing CSV files without losing your customizations.
 * 
 * @param options - Configuration options for the upsert operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await objectTranslationUpsert();
 * console.log(result.outputString); // "OK"
 * 
 * // With specific options
 * const result = await objectTranslationUpsert({ 
 *   input: 'Account-es',
 *   sort: 'true' 
 * });
 * ```
 */
export async function objectTranslationUpsert(options: ObjectTranslationOptions = {}): Promise<{ outputString: string }> {
    const result = await objectTranslationUpsertCommand(options);
    
    if (!result) {
        throw new Error('Upsert operation failed - check that your input paths exist and contain valid object translation metadata');
    }
    
    return result;
}

/**
 * Merges CSV files back into object translation XML format for deployment
 * 
 * Combines all the CSV files for an object translation back into XML files
 * that can be deployed to a Salesforce org.
 * 
 * @param options - Configuration options for the merge operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await objectTranslationMerge({ input: 'Account-es,Contact-fr' });
 * console.log(result.outputString); // "OK"
 * 
 * // All object translations with default paths
 * const result = await objectTranslationMerge();
 * ```
 */
export async function objectTranslationMerge(options: ObjectTranslationOptions = {}): Promise<{ outputString: string }> {
    const result = await objectTranslationMergeCommand(options);
    
    if (!result) {
        throw new Error('Merge operation failed - check that your CSV paths exist and contain valid object translation data');
    }
    
    return result;
}

/**
 * Clears empty CSV files and folders to keep the repository clean
 * 
 * Removes CSV files that have no content (only headers) and deletes
 * empty folders after cleanup.
 * 
 * @param options - Configuration options for the clear empty operation
 * @returns Promise with information about deleted files and folders
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await objectTranslationClearEmpty();
 * console.log(result.outputString); // "Deleted 5 empty CSV files and 2 empty folders"
 * 
 * // With custom CSV path
 * const result = await objectTranslationClearEmpty({ 'es-csv': './custom-csv' });
 * ```
 */
export async function objectTranslationClearEmpty(options: ObjectTranslationOptions = {}): Promise<EmptyClearerResult> {
    return await objectTranslationClearEmptyCommand(options);
}

/**
 * Checks if XML and CSV files are properly aligned (in sync)
 * 
 * Verifies that the CSV files accurately represent the XML metadata
 * by comparing their contents after a merge operation.
 * 
 * @param options - Configuration options for the alignment check
 * @returns Promise with alignment check results
 * 
 * @example
 * ```typescript
 * // Check specific object translation with auto-resolved paths
 * const result = await objectTranslationAreAligned({ input: 'Account-es' });
 * if (result.alignedItems === result.totalItems) {
 *   console.log('Object translation is properly aligned!');
 * }
 * 
 * // Check all object translations with logic mode
 * const result = await objectTranslationAreAligned({ mode: 'logic' });
 * ```
 */
export async function objectTranslationAreAligned(options: ObjectTranslationOptions = {}): Promise<ValidationSummary> {
    return await objectTranslationAreAlignedCommand(options);
}

/**
 * Minifies object translation CSV files by removing entries with only empty translations
 * 
 * Removes CSV entries that contain only empty or null values for translation fields,
 * keeping the CSV files clean and focused on actual translations.
 * 
 * @param options - Configuration options for the minify operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await objectTranslationMinify({ input: 'Account-es' });
 * console.log(result.outputString); // "OK"
 * 
 * // All object translations with default paths
 * const result = await objectTranslationMinify();
 * ```
 */
export async function objectTranslationMinify(options: ObjectTranslationOptions = {}): Promise<{ outputString: string }> {
    const result = await objectTranslationMinifyCommand(options);
    
    if (!result) {
        throw new Error('Minify operation failed - check that your CSV paths exist and contain valid object translation data');
    }
    
    return result;
}

/**
 * Object Translation API namespace - contains all object translation-related operations
 */
export const objectTranslations = {
    split: objectTranslationSplit,
    upsert: objectTranslationUpsert,
    merge: objectTranslationMerge,
    clearEmpty: objectTranslationClearEmpty,
    areAligned: objectTranslationAreAligned,
    minify: objectTranslationMinify
};

/**
 * Export individual functions as well for flexibility
 */
export {
    objectTranslationSplit as split,
    objectTranslationUpsert as upsert,
    objectTranslationMerge as merge,
    objectTranslationClearEmpty as clearEmpty,
    objectTranslationAreAligned as areAligned,
    objectTranslationMinify as minify
};
