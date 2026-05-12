/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import Performance from '../../../utils/performance';
import { merge } from '../../../utils/commands/merger';
import { LABELS_ROOT_TAG, LABEL_ITEMS, LABELS_EXTENSION, LABELS_SUBPATH } from "../../../utils/constants/constants_labels";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';




// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'labels_merge');

export default class Merge extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);

    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
        "sf-xml": Flags.string({
            char: 'x',
            summary: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
        "es-csv": Flags.string({
            char: 'c',
            summary: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(Merge);
        Performance.getInstance().start();

        var result = await labelMerge(flags);

        Performance.getInstance().end();
        return result;

    }
}

/**
 * Label-specific merge function that encapsulates all label constants
 * This function can be used programmatically without needing to pass label constants
 * 
 * @param options - Label merge options (paths will be resolved automatically if not provided)
 * @returns Promise with merge operation result
 */
export async function labelMerge(options: any): Promise<any> {
    return await merge(options, LABELS_SUBPATH, LABELS_EXTENSION, LABELS_ROOT_TAG, LABEL_ITEMS);
}