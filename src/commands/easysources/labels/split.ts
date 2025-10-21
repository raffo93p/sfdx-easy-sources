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
import { split } from '../../../utils/commands/splitter';
import { LABELS_ROOT_TAG, LABEL_ITEMS, LABELS_EXTENSION, LABELS_SUBPATH } from "../../../utils/constants/constants_labels";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';


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
        sort: flags.enum({
            char: 'S',
            description: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        var result = await labelSplit(this.flags);

        Performance.getInstance().end();
        return result;
    }
}

/**
 * Label-specific split function that encapsulates all label constants
 * This function can be used programmatically without needing to pass label constants
 * 
 * @param options - Label split options (paths will be resolved automatically if not provided)
 * @returns Promise with split operation result
 */
export async function labelSplit(options: any): Promise<any> {
    return await split(options, LABELS_SUBPATH, LABELS_EXTENSION, LABELS_ROOT_TAG, LABEL_ITEMS);
}
