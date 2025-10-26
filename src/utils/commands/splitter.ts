import { calcCsvFilename, readXmlFromFile, removeExtension, writeXmlToFile } from '../filesUtils'
import { generateTagId } from '../utils'
const { Parser, transforms: { unwind } } = require('json2csv');
import { join } from "path";
const fs = require('fs-extra');
import { sortByKey } from "../utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../constants/constants';
import { PROFILE_USERPERM_ROOT } from '../constants/constants_profiles';
import { loadSettings } from '../localSettings';
import { arrayToFlat } from '../flatArrayUtils';
import { Worker } from 'worker_threads';
import { cpus } from 'os';

const settings = loadSettings();

export interface SplitFileOptions {
    filename: string;
    baseInputDir: string;
    baseOutputDir: string;
    file_extension: string;
    file_root_tag: string;
    file_items: any;
    ignoreUserPerm: boolean;
    sortFiles: boolean;
}

export interface SplitConfig {
    baseInputDir: string;
    baseOutputDir: string;
    file_extension: string;
    file_root_tag: string;
    file_items: any;
    ignoreUserPerm: boolean;
    sortFiles: boolean;
    useParallel: boolean;
    maxWorkers: number;
}

export async function split(flags, file_subpath, file_extension, file_root_tag, file_items) {
    const config: SplitConfig = {
        baseInputDir: join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), file_subpath),
        baseOutputDir: join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath),
        file_extension,
        file_root_tag,
        file_items,
        ignoreUserPerm: ((flags.ignoreuserperm === 'true' || settings['ignore-user-permissions']) || false),
        sortFiles: flags.sort === 'true',
        useParallel: flags.parallel !== 'false' && (flags.parallel === 'true' || settings['use-parallel-processing'] !== false),
        maxWorkers: flags.maxworkers || settings['max-workers'] || cpus().length
    };

    if (!fs.existsSync(config.baseInputDir)) {
        console.log('Input folder ' + config.baseInputDir + ' does not exist!');
        return;
    }

    const fileList = flags.input 
        ? flags.input.split(',')
        : fs.readdirSync(config.baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(config.file_extension))
            .map(item => item.name);

    if (fileList.length === 0) {
        console.log('No files to process');
        return { outputString: 'OK' };
    }

    return config.useParallel 
        ? processFilesParallel(fileList, config)
        : processFilesSequential(fileList, config);
}

export async function processSingleFile(options: SplitFileOptions): Promise<{ filename: string; success: boolean; error?: string; }> {
    try {
        const { filename, baseInputDir, baseOutputDir, file_extension, file_root_tag, file_items, ignoreUserPerm, sortFiles } = options;
        
        const fullFilename = filename.endsWith(file_extension) ? filename : filename + file_extension;
        
        const inputFile = join(baseInputDir, fullFilename);
        const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        const fileProperties = xmlFileContent[file_root_tag] ?? {};

        const fileName = removeExtension(fullFilename);
        const outputDir = join(baseOutputDir, fileName);

        // Delete outputDir if it exists to ensure a clean split
        if (fs.existsSync(outputDir)) {
            fs.removeSync(outputDir);
        }

        for (const tag_section in file_items) {
            if (ignoreUserPerm && tag_section == PROFILE_USERPERM_ROOT) {
                xmlFileContent[file_root_tag][tag_section] = null;
                continue;
            }

            var myjson = fileProperties[tag_section];

            // skip when tag is not found in the xml
            if (myjson == undefined) continue;
            // fixes scenarios when the tag is one, since it would be read as object and not array
            if (!Array.isArray(myjson)) myjson = [myjson];

            myjson = arrayToFlat(myjson);
            // generate _tagId column
            generateTagId(myjson, file_items[tag_section].key, file_items[tag_section].headers);
            // sorts array by _tagid. sorting is made as string
            if (sortFiles) {
                myjson = sortByKey(myjson);
            }

            const headers = file_items[tag_section].headers;
            const transforms = [unwind({ paths: headers })];
            var fields = [...headers, '_tagid'];

            const parser = new Parser({ fields: fields, transforms });
            const csv = parser.parse(myjson);

            const outputFileCSV = join(outputDir, calcCsvFilename(fileName, tag_section));

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            fs.writeFileSync(outputFileCSV, csv.replaceAll("&#xD;", ""), { flag: 'w+' });
            xmlFileContent[file_root_tag][tag_section] = null;
        }

        if (fs.existsSync(outputDir)) {
            const outputFileXML = join(outputDir, fileName + XML_PART_EXTENSION);
            writeXmlToFile(outputFileXML, xmlFileContent);
        }

        return { filename: fullFilename, success: true };
    } catch (error) {
        return { 
            filename: options.filename, 
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function processFilesParallel(fileList, config: SplitConfig): Promise<any> {
    console.log(`Processing ${fileList.length} files with ${Math.min(config.maxWorkers, fileList.length)} workers...`);

    const projectRoot = __dirname.replace(/\/src\/.*$/, '').replace(/\/lib\/.*$/, '');
    const workerPath = join(projectRoot, 'lib/utils/workers/splitter-worker.js');
    
    return new Promise((resolve, reject) => {
        const workers: Worker[] = [];
        let completedFiles = 0;
        let fileIndex = 0;
        let hasError = false;

        const createWorkerData = (filename) => ({
            filename, 
            baseInputDir: config.baseInputDir, 
            baseOutputDir: config.baseOutputDir, 
            file_extension: config.file_extension, 
            file_root_tag: config.file_root_tag, 
            file_items: config.file_items, 
            ignoreUserPerm: config.ignoreUserPerm, 
            sortFiles: config.sortFiles
        });

        const numWorkers = Math.min(config.maxWorkers, fileList.length);
        
        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker(workerPath);
            workers.push(worker);

            worker.on('message', (result: any) => {
                completedFiles++;
                console.log(`${result.success ? '✓' : '✗'} ${result.success ? 'Completed' : 'Failed'}: ${result.filename} (${completedFiles}/${fileList.length})`);
                
                if (!result.success) hasError = true;

                if (fileIndex < fileList.length) {
                    worker.postMessage(createWorkerData(fileList[fileIndex++]));
                } else {
                    worker.terminate();
                }

                if (completedFiles === fileList.length) {
                    workers.forEach(w => w.terminate());
                    const message = hasError ? 'Completed with errors' : `✓ All ${fileList.length} files processed successfully`;
                    console.log(`\n${message}`);
                    hasError ? reject(new Error('Some files failed')) : resolve({ outputString: 'OK' });
                }
            });

            worker.on('error', (error) => {
                console.error('Worker error:', error);
                worker.terminate();
                reject(error);
            });

            if (fileIndex < fileList.length) {
                worker.postMessage(createWorkerData(fileList[fileIndex++]));
            }
        }
    });
}

async function processFilesSequential(fileList, config: SplitConfig) {
    console.log(`Processing ${fileList.length} files sequentially...`);

    for (const filename of fileList) {
        const result = await processSingleFile({
            filename, 
            baseInputDir: config.baseInputDir, 
            baseOutputDir: config.baseOutputDir, 
            file_extension: config.file_extension,
            file_root_tag: config.file_root_tag, 
            file_items: config.file_items, 
            ignoreUserPerm: config.ignoreUserPerm, 
            sortFiles: config.sortFiles
        });
        if (!result.success) {
            console.error(`✗ Failed: ${result.filename} - ${result.error}`);
        } else {
            console.log(`✓ Completed: ${result.filename}`);
        }
    }

    return { outputString: 'OK' };
}