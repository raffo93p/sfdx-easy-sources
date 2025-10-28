import { calcCsvFilename, readXmlFromFile, removeExtension, writeXmlToFile } from '../filesUtils'
import { generateTagId } from '../utils'
import { format } from 'fast-csv';
import { join } from "path";
const fs = require('fs-extra');
import { sortByKey } from "../utils"
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, XML_PART_EXTENSION } from '../constants/constants';
import { PROFILE_USERPERM_ROOT, PROFILES_SUBPATH } from '../constants/constants_profiles';
import { loadSettings } from '../localSettings';
import { arrayToFlat } from '../flatArrayUtils';

const settings = loadSettings();

export enum CsvEngine {
    FAST_CSV = 'fast-csv',
    JSON2CSV = 'json2csv' // per backward compatibility
}

export async function split(flags, file_subpath, file_extension, file_root_tag, file_items, engine: CsvEngine = CsvEngine.FAST_CSV) {

    const baseInputDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), file_subpath) as string;
    const baseOutputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), file_subpath) as string;
    const ignoreUserPerm = (file_subpath === PROFILES_SUBPATH && (flags.ignoreuserperm === 'true' || settings['ignore-user-permissions']) || false) as boolean;
    const inputFiles = (flags.input) as string;

    if (!fs.existsSync(baseInputDir)) {
        console.log('Input folder ' + baseInputDir + ' does not exist!');
        return;
    }

    var fileList = [];
    if (inputFiles) {
        fileList = inputFiles.split(',');
    } else {
        fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
            .filter(item => !item.isDirectory() && item.name.endsWith(file_extension))
            .map(item => item.name)
    }

    for (const filename of fileList) {
        const fullFilename = filename.endsWith(file_extension) ? filename : filename + file_extension;
        console.log('Splitting: ' + fullFilename);

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
            if(ignoreUserPerm && tag_section == PROFILE_USERPERM_ROOT){
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
            if (flags.sort === 'true') {
                myjson = sortByKey(myjson);
            }

            const headers = file_items[tag_section].headers;
            
            var fields = [...headers, '_tagid'];

            const outputFileCSV = join(outputDir, calcCsvFilename(fileName, tag_section));

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            try {
                let csvContent: string;

                // Scegli il motore CSV in base alla configurazione
                switch (engine) {
                    case CsvEngine.FAST_CSV:
                    default:
                        // Usa fast-csv (default)
                        csvContent = await new Promise<string>((resolve, reject) => {
                            let result = '';
                            const csvStream = format({ 
                                headers: fields, 
                                includeEndRowDelimiter: false,  // Non aggiungere newline finale
                                quote: '"',
                                quoteColumns: true,  // Forza le virgolette su tutte le colonne
                                quoteHeaders: true   // Forza le virgolette sui header
                            });
                            
                            csvStream
                                .on('data', (data) => result += data)
                                .on('end', () => resolve(result))
                                .on('error', reject);
                            
                            // Scrivi ogni riga con i dati processati
                            myjson.forEach(row => csvStream.write(row));
                            csvStream.end();
                        });
                        break;

                    case CsvEngine.JSON2CSV:
                        // Fallback al vecchio json2csv se necessario (usa gli header originali con unwind)
                        const { Parser, transforms: { unwind } } = require('json2csv');
                        const transforms = [unwind({ paths: headers })];
                        const parser = new Parser({ fields: [...headers, '_tagid'], transforms });
                        csvContent = parser.parse(myjson);
                        break;
                }
                fs.writeFileSync(outputFileCSV, csvContent.replace(/&#xD;/g, ""), { flag: 'w+' });
                // file written successfully
            } catch (err) {
                console.error(err);
            }

            xmlFileContent[file_root_tag][tag_section] = null;

        }
        if (fs.existsSync(outputDir)) {
            const outputFileXML = join(outputDir, fileName + XML_PART_EXTENSION);
            writeXmlToFile(outputFileXML, xmlFileContent);
        }
    }

    return { outputString: 'OK' };
}


// /**
//  * Processa gli headers che contengono oggetti setDefault per estrarre solo i nomi dei campi
//  */
// function processHeaders(headers: any[]): string[] {
//     return headers.map(header => {
//         if (typeof header === 'object' && header.value) {
//             return header.value;
//         }
//         return header;
//     });
// }

// /**
//  * Processa i dati JSON per gestire correttamente i campi con valori di default
//  */
// function processJsonData(data: any[], headers: any[]): any[] {
//     return data.map(row => {
//         const processedRow = {};
        
//         // Copia tutti i campi esistenti
//         for (const key in row) {
//             processedRow[key] = row[key];
//         }
        
//         // Aggiungi valori di default per i campi mancanti
//         headers.forEach((header, index) => {
//             if (typeof header === 'object' && header.value && header.default !== undefined) {
//                 const fieldName = header.value;
//                 if (processedRow[fieldName] === undefined || processedRow[fieldName] === null) {
//                     processedRow[fieldName] = header.default;
//                 }
//             }
//         });
        
//         return processedRow;
//     });
// }