/**
 * Labels API - Programmatic access to all label-related operations
 * 
 * This module exposes all the core functionality for working with Salesforce custom labels
 * without requiring the SFDX CLI interface. Use these functions in your Node.js scripts
 * to manipulate label metadata programmatically.
 * 
 * @example
 * ```typescript
 * import { labels } from 'sfdx-easy-sources';
 * 
 * // Split label XML files into CSV files (paths auto-resolved from settings)
 * await labels.split();
 * 
 * // Upsert changes from XML to CSV (no options needed if using defaults)
 * await labels.upsert();
 * 
 * // Merge CSV files back to XML with custom paths
 * await labels.merge({
 *   'es-csv': './custom-csv-path'
 * });
 * ```
 */

import { PathOptions } from './paths';
import { ValidationSummary } from '../utils/commands/alignmentChecker';

// Import label-specific functions directly from command files
import { labelSplit as labelSplitCommand } from '../commands/easysources/labels/split';
import { labelUpsert as labelUpsertCommand } from '../commands/easysources/labels/upsert';
import { labelMerge as labelMergeCommand } from '../commands/easysources/labels/merge';
import { labelUpdateKey as labelUpdateKeyCommand } from '../commands/easysources/labels/updatekey';
import { labelAreAligned as labelAreAlignedCommand } from '../commands/easysources/labels/arealigned';

/**
 * Label-specific options interface
 * Extends the common PathOptions with label-specific settings
 */
export interface LabelOptions extends PathOptions {
    /** Language code for the labels (optional) */
    language?: string;
    // Additional label-specific options can be added here
    [key: string]: any;
}

/**
 * Splits custom label XML files into manageable CSV files
 * 
 * Labels are split into CSV format with columns:
 * - fullName
 * - categories
 * - language
 * - protected
 * - shortDescription
 * - value
 * 
 * @param options - Configuration options for the split operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await labelSplit();
 * console.log(result.outputString); // "OK"
 * 
 * // Override specific paths if needed
 * const result = await labelSplit({
 *   'es-csv': './custom-output'
 * });
 * ```
 */
export async function labelSplit(options: LabelOptions = {}): Promise<{ outputString: string }> {
    const result = await labelSplitCommand(options);

    if (!result) {
        throw new Error('Split operation failed - check that your input paths exist and contain valid label metadata');
    }
    
    return result;
}

/**
 * Upserts (updates or inserts) label data from XML into existing CSV files
 * 
 * After retrieving updated metadata from an org, use this to merge new labels
 * into your existing CSV files without losing your customizations.
 * 
 * @param options - Configuration options for the upsert operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await labelUpsert();
 * console.log(result.outputString); // "OK"
 * 
 * // With custom paths
 * const result = await labelUpsert({ 'sf-xml': './custom-xml-path' });
 * ```
 */
export async function labelUpsert(options: LabelOptions = {}): Promise<{ outputString: string }> {
    const result = await labelUpsertCommand(options);
    
    if (!result) {
        throw new Error('Upsert operation failed - check that your input paths exist and contain valid label metadata');
    }
    
    return result;
}

/**
 * Merges CSV files back into custom label XML format for deployment
 * 
 * Combines all the CSV files for labels back into a single XML file
 * that can be deployed to a Salesforce org.
 * 
 * @param options - Configuration options for the merge operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Simple usage with auto-resolved paths
 * const result = await labelMerge();
 * console.log(result.result); // "OK"
 * 
 * // With custom sorting
 * const result = await labelMerge({ sort: 'false' });
 * ```
 */
export async function labelMerge(options: LabelOptions = {}): Promise<{ result: string }> {
    const result = await labelMergeCommand(options);
    
    if (!result) {
        throw new Error('Merge operation failed - check that your CSV paths exist and contain valid label data');
    }
    
    return result;
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
 * // Check alignment with auto-resolved paths
 * const result = await labelAreAligned();
 * if (result.alignedItems === result.totalItems) {
 *   console.log('Labels are properly aligned!');
 * }
 * 
 * // Check with specific mode
 * const result = await labelAreAligned({ mode: 'logic' });
 * ```
 */
export async function labelAreAligned(options: LabelOptions = {}): Promise<ValidationSummary> {
    return await labelAreAlignedCommand(options);
}

/**
 * Updates keys in CSV files based on a mapping
 * 
 * Useful for renaming label references across all label files
 * (e.g., updating fullName or language codes).
 * 
 * @param options - Configuration options for the update key operation
 * @returns Promise with operation result
 * 
 * @example
 * ```typescript
 * // Update keys with auto-resolved paths
 * const result = await labelUpdateKey({
 *   sort: 'true'
 * });
 * console.log('Keys updated successfully');
 * ```
 */
export async function labelUpdateKey(options: LabelOptions): Promise<any> {
    return await labelUpdateKeyCommand(options);
}

/**
 * Labels API namespace - contains all label-related operations
 */
export const labels = {
    split: labelSplit,
    upsert: labelUpsert,
    merge: labelMerge,
    areAligned: labelAreAligned,
    updateKey: labelUpdateKey
};

/**
 * Export individual functions as well for flexibility
 */
export {
    labelSplit as split,
    labelUpsert as upsert,
    labelMerge as merge,
    labelAreAligned as areAligned,
    labelUpdateKey as updateKey
};
