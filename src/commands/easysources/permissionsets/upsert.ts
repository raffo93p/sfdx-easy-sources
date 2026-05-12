/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { PERMSET_ITEMS, PERMSETS_EXTENSION, PERMSETS_ROOT_TAG, PERMSETS_SUBPATH} from '../../../utils/constants/constants_permissionsets.js';
import Performance from '../../../utils/performance.js';
import { upsert } from '../../../utils/commands/upserter.js';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants.js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'permissionsets_upsert');

export default class Upsert extends SfCommand<unknown> {
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
        input: Flags.string({
            char: 'i',
            summary: messages.getMessage('inputFlagDescription'),
        }),
        type: Flags.string({
            char: 't',
            summary: messages.getMessage('typeFlagDescription'),
        }),
        tagid: Flags.string({
            char: 'k',
            summary: messages.getMessage('tagidFlagDescription'),
        }),
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };


    public async run(): Promise<unknown> {
        const { flags } = await this.parse(Upsert);
        Performance.getInstance().start();

        var result = await permissionsetUpsert(flags);

        Performance.getInstance().end();
        return result;
    }
}

/**
 * Permission set-specific upsert function that encapsulates all permission set constants
 * This function can be used programmatically without needing to pass permission set constants
 * 
 * @param options - Permission set upsert options (paths will be resolved automatically if not provided)
 * @returns Promise with upsert operation result
 */
export async function permissionsetUpsert(options: any): Promise<any> {
    return await upsert(options, PERMSETS_SUBPATH, PERMSETS_EXTENSION, PERMSETS_ROOT_TAG, PERMSET_ITEMS);
}