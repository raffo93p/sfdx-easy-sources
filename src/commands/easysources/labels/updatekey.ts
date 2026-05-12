/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import Performance from '../../../utils/performance.js';
import { updatekey } from "../../../utils/commands/keyupdater.js";
import { LABELS_SUBPATH, LABEL_ITEMS } from "../../../utils/constants/constants_labels.js"
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants.js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_updatekey');

export default class UpdateKey extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);


    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
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
        const { flags } = await this.parse(UpdateKey);
        Performance.getInstance().start();

        var result = await labelUpdateKey(flags);

        Performance.getInstance().end();
        return result;
    }
}

/**
 * Label-specific update key function that encapsulates all label constants
 * This function can be used programmatically without needing to pass label constants
 * 
 * @param options - Label update key options (paths will be resolved automatically if not provided)
 * @returns Promise with update key operation result
 */
export async function labelUpdateKey(options: any): Promise<any> {
    return await updatekey(options, LABELS_SUBPATH, LABEL_ITEMS);
}
