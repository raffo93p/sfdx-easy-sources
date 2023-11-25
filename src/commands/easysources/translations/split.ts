/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import Performance from '../../../utils/performance';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { TRANSLATION_ITEMS, TRANSLATIONS_EXTENSION, TRANSLATIONS_ROOT_TAG, TRANSLATIONS_SUBPATH } from '../../../utils/constants/constants_translations';
import { split } from '../../../utils/commands/splitter';



// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_split');

export default class Split extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);


    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        "sf-xml": flags.string({
            char: 'x',
            description: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
        "es-csv": flags.string({
            char: 'c',
            description: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        sort: flags.enum({
            char: 'S',
            description: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        var result = await split(this.flags, TRANSLATIONS_SUBPATH, TRANSLATIONS_EXTENSION, TRANSLATIONS_ROOT_TAG, TRANSLATION_ITEMS);

        // const baseInputDir = join((flags["sf-xml"] || settings['salesforce-xml-path'] || DEFAULT_SFXML_PATH), TRANSLATIONS_SUBPATH) as string;
        // const baseOutputDir = join((flags["es-csv"] || settings['easysources-csv-path'] || DEFAULT_ESCSV_PATH), TRANSLATIONS_SUBPATH) as string;

        // const inputFiles = (this.flags.input) as string;

        // if (!fs.existsSync(baseInputDir)) {
        //     console.log('Input folder ' + baseInputDir + ' does not exist!');
        //     return;
        // }

        // var fileList = [];
        // if (inputFiles) {
        //     fileList = inputFiles.split(',');
        // } else {
        //     fileList = fs.readdirSync(baseInputDir, { withFileTypes: true })
        //         .filter(item => !item.isDirectory() && item.name.endsWith(TRANSLATIONS_EXTENSION))
        //         .map(item => item.name)
        // }

        // for (const filename of fileList) {
        //     const fullFilename = filename.endsWith(TRANSLATIONS_EXTENSION) ? filename : filename + TRANSLATIONS_EXTENSION;
        //     console.log('Splitting: ' + fullFilename);

        //     const inputFile = join(baseInputDir, fullFilename);
        //     const xmlFileContent = (await readXmlFromFile(inputFile)) ?? {};
        //     const fileProperties = xmlFileContent[TRANSLATIONS_ROOT_TAG] ?? {};

        //     const fileName = removeExtension(fullFilename);
        //     const outputDir = join(baseOutputDir, fileName);

        //     for (const tag_section in TRANSLATION_ITEMS) {

        //         var myjson = fileProperties[tag_section];

        //         // skip when tag is not found in the xml
        //         if (myjson == undefined) continue;
        //         // fixes scenarios when the tag is one, since it would be read as object and not array
        //         if (!Array.isArray(myjson)) myjson = [myjson];

        //         // if(tag_section === TRANSLAT_REPTYPE_ROOT) myjson = transformXMLtoCSV(myjson);
        //         if(tag_section === TRANSLAT_REPTYPE_ROOT) {
        //             console.log(JSON.stringify(myjson))
        //             myjson = arrayToFlat(myjson);
        //             if(filename === 'es_CO.translation-meta.xml'){
        //                 // console.log(myjson)
        //             }
        //         }

        //         // generate _tagId column
        //         generateTagId(myjson, TRANSLATION_ITEMS[tag_section].key, TRANSLATION_ITEMS[tag_section].headers);
        //         // sorts array by _tagid. sorting is made as string
        //         if (this.flags.sort === 'true') {
        //             myjson = sortByKey(myjson);
        //         }

        //         const headers = TRANSLATION_ITEMS[tag_section].headers;
        //         const transforms = [unwind({ paths: headers })];
        //         var fields = [...headers, '_tagid'];

        //         const parser = new Parser({ fields: fields, transforms });
        //         const csv = parser.parse(myjson);

                

        //         const outputFileCSV = join(outputDir, calcCsvFilename(fileName, tag_section));

        //         if (!fs.existsSync(outputDir)) {
        //             fs.mkdirSync(outputDir, { recursive: true });
        //         }

        //         try {
        //             fs.writeFileSync(outputFileCSV, csv.replaceAll("&#xD;", ""), { flag: 'w+' });
        //             // file written successfully
        //         } catch (err) {
        //             console.error(err);
        //         }

        //         xmlFileContent[TRANSLATIONS_ROOT_TAG][tag_section] = null;

        //     }
        //     if (fs.existsSync(outputDir)) {
        //         const outputFileXML = join(outputDir, fileName + XML_PART_EXTENSION);
        //         writeXmlToFile(outputFileXML, xmlFileContent);
        //     }
        // }

        Performance.getInstance().end();
        return result;
    }
}


