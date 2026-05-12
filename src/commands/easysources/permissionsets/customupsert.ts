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
import { PERMSETS_SUBPATH, PERMSET_ITEMS } from "../../../utils/constants/constants_permissionsets.js";
import { customUpsert } from '../../../utils/commands/customupserter.js';
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants.js';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'permissionsets_customupsert');

export default class CustomUpsert extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);

    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
        "es-csv": Flags.string({
            char: 'c',
            summary: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        input: Flags.string({
            char: 'i',
            summary: messages.getMessage('inputFlagDescription'),
        }),
        type: Flags.string({
            char: 't',
            summary: messages.getMessage('typeFlagDescription'),
        }),
        content: Flags.string({
            char: 'j',
            summary: messages.getMessage('contentFlagDescription'),
        }),
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(CustomUpsert);
        Performance.getInstance().start();

        var result = await permissionsetCustomUpsert(flags);

        Performance.getInstance().end();

        return result;
    }
}

/**
 * Permission set-specific custom upsert function that encapsulates all permission set constants
 * This function can be used programmatically without needing to pass permission set constants
 * 
 * @param options - Options object containing command flags
 * @returns Promise with custom upsert operation result
 */
export async function permissionsetCustomUpsert(options: any): Promise<any> {
    return customUpsert(options, PERMSETS_SUBPATH, PERMSET_ITEMS);
}
