/**
 * Paths API - Generic path resolution utilities for all metadata types
 * 
 * This module provides common path resolution functionality that can be used
 * across all metadata types (profiles, objecttranslations, recordtypes, etc.).
 * It handles settings file integration and provides flexible path overrides.
 * 
 * @example
 * ```typescript
 * import { resolvePaths } from 'sfdx-easy-sources';
 * 
 * // Basic usage with defaults from settings
 * const options = resolvePaths();
 * 
 * // Override specific paths
 * const options = resolvePaths({
 *   'sf-xml': './custom-source'
 * });
 * ```
 */

import { loadSettings } from '../utils/localSettings';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../utils/constants/constants';

/**
 * Path options interface for all metadata operations
 * This interface defines the standard paths used across all metadata types
 */
export interface PathOptions {
    /** Path to Salesforce XML metadata folder (default: './force-app/main/default') */
    'sf-xml'?: string;
    /** Path to EasySources CSV output folder (default: './easysources') */
    'es-csv'?: string;
}

/**
 * Generic path resolution function that works for all metadata types
 * 
 * This utility function provides a consistent way to resolve paths across all
 * metadata operations. It follows the priority order:
 * 1. User-provided options (highest priority)
 * 2. Settings from easysources-settings.json file
 * 3. Default constants (lowest priority)
 * 
 * @param options - User-provided options (can be partial)
 * @returns Complete options with resolved sf-xml and es-csv paths
 * 
 * @example
 * ```typescript
 * // Basic path resolution - uses settings or defaults
 * const options = resolvePaths();
 * // Result: { 'sf-xml': './force-app/main/default', 'es-csv': './easysources' }
 * 
 * // Override specific paths
 * const options = resolvePaths({
 *   'sf-xml': './custom-metadata'
 * });
 * // Result: { 'sf-xml': './custom-metadata', 'es-csv': './easysources' }
 * ```
 */
export function resolvePaths<T extends PathOptions>(
    options: Partial<T> = {} as Partial<T>
): T {
    const settings = loadSettings();
    
    // Resolve paths in priority order: user options > settings file > default constants
    const resolved = {
        'sf-xml': options['sf-xml'] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH,
        'es-csv': options['es-csv'] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH
    } as T;

    return resolved;
}


