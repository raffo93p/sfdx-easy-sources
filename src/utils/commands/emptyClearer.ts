/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const fs = require('fs-extra');
import { join } from "path";
import { calcCsvFilename, checkDirOrErrorSync, readCsvToJsonArrayWithNulls } from "../filesUtils";
import { loadSettings } from '../localSettings';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../constants/constants';
import { jsonAndPrintError } from "./utils";

const settings = loadSettings();

export interface EmptyClearerOptions {
    "es-csv"?: string;
    "sf-xml"?: string;
    input?: string;
}

export interface ItemResult {
    result: 'OK' | 'KO';
    deletedFiles: number;
    deletedFolders: number;
    error?: string;
    [key: string]: any;
}

export interface EmptyClearerResult {
    result: 'OK' | 'KO';
    summary: {
        totalItems: number;
        processedItems: number;
        deletedFiles: number;
        deletedFolders: number;
    };
    items: { [itemName: string]: ItemResult };
    [key: string]: any;
}

/**
 * Generic function to clear empty CSV files and folders for any metadata type
 * @param flags Command flags containing paths and input options
 * @param subPath The subpath for the metadata type (e.g., 'translations', 'profiles')
 * @param items The items configuration object defining the metadata sections
 * @returns Promise containing the result with deletion counts
 */
export async function clearEmpty(
    flags: EmptyClearerOptions,
    subPath: string,
    items: { [key: string]: any }
): Promise<any> {
    
    const csvDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), subPath) as string;
    const xmlDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH)) as string;

    const inputMetadata = flags.input as string;

    try {
        checkDirOrErrorSync(csvDir);
        checkDirOrErrorSync(xmlDir);
    } catch (error) {
        return jsonAndPrintError(error.message);
    }
    

    var metadataList = [];
    if (inputMetadata) {
        metadataList = inputMetadata.split(',');
    } else {
        metadataList = fs.readdirSync(csvDir, { withFileTypes: true })
            .filter(item => item.isDirectory())
            .map(item => item.name);
    }

    let totalDeletedFiles = 0;
    let totalDeletedFolders = 0;
    const itemsResult: { [itemName: string]: ItemResult } = {};

    // Process each metadata item
    for (const metadataName of metadataList) {
        console.log(`Clearing empty CSVs for: ${metadataName}`);

        const metadataFolder = join(csvDir, metadataName);
        let hasPopulatedCsvs = false;
        let itemDeletedFiles = 0;
        let itemDeletedFolders = 0;

        try {
            for (const itemSection in items) {
                // itemSection is a metadata section

                const csvFilePath = join(csvDir, metadataName, calcCsvFilename(metadataName, itemSection));

                if (fs.existsSync(csvFilePath)) {
                    // get the list of resources on the csv
                    var resListCsv = await readCsvToJsonArrayWithNulls(csvFilePath);

                    // if CSV has no records (only headers), delete it
                    if (resListCsv.length === 0) {
                        console.log(`  Deleting empty CSV: ${csvFilePath}`);
                        fs.unlinkSync(csvFilePath);
                        itemDeletedFiles++;
                    } else {
                        hasPopulatedCsvs = true;
                    }
                }
            }

            // Check if metadata folder exists and clean up .part files and empty folders
            if (fs.existsSync(metadataFolder)) {
                const remainingFiles = fs.readdirSync(metadataFolder);
                
                // Remove -part.xml files only if there are no populated CSVs
                if (!hasPopulatedCsvs) {
                    const partFiles = remainingFiles.filter(file => file.endsWith('-part.xml'));
                    for (const partFile of partFiles) {
                        const partFilePath = join(metadataFolder, partFile);
                        console.log(`  Deleting -part.xml file: ${partFilePath}`);
                        fs.unlinkSync(partFilePath);
                        itemDeletedFiles++;
                    }
                }

                // Check again for remaining files after cleanup
                const finalRemainingFiles = fs.readdirSync(metadataFolder);
                
                // If no files remain in metadata folder, delete the entire metadata folder
                if (finalRemainingFiles.length === 0) {
                    console.log(`  Deleting empty folder: ${metadataFolder}`);
                    fs.removeSync(metadataFolder);
                    itemDeletedFolders++;
                }
            }

            totalDeletedFiles += itemDeletedFiles;
            totalDeletedFolders += itemDeletedFolders;

            itemsResult[metadataName] = {
                result: 'OK',
                deletedFiles: itemDeletedFiles,
                deletedFolders: itemDeletedFolders
            };

        } catch (error) {
            itemsResult[metadataName] = {
                result: 'KO',
                deletedFiles: itemDeletedFiles,
                deletedFolders: itemDeletedFolders,
                error: error instanceof Error ? error.message : String(error)
            };
            console.error(`  Error processing ${metadataName}: ${error}`);
        }
    }

    const result: EmptyClearerResult = {
        result: 'OK',
        summary: {
            totalItems: metadataList.length,
            processedItems: Object.values(itemsResult).filter(item => item.result === 'OK').length,
            deletedFiles: totalDeletedFiles,
            deletedFolders: totalDeletedFolders
        },
        items: itemsResult
    };

    console.log(`\nClear Empty Summary: ${result.summary.totalItems} items processed, ${result.summary.deletedFiles} files deleted, ${result.summary.deletedFolders} folders deleted`);
    
    return result;
}
