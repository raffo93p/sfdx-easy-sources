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
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants.js';
import { PERMSET_ITEMS, PERMSETS_SUBPATH } from '../../../utils/constants/constants_permissionsets.js';
import { clearEmpty } from '../../../utils/commands/emptyClearer.js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'permissionsets_clearempty');

export default class ClearEmpty extends SfCommand<unknown> {
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
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(ClearEmpty);
        Performance.getInstance().start();
        
        const result = await permissionsetClearEmpty(flags);

        Performance.getInstance().end();
        return result;
    }
}

/**
 * Permission set-specific clear empty function that encapsulates all permission set constants
 * This function can be used programmatically without needing to pass permission set constants
 * 
 * @param options - Permission set clear empty options (paths will be resolved automatically if not provided)
 * @returns Promise with clear empty operation result
 */
export async function permissionsetClearEmpty(options: any): Promise<any> {
    return await clearEmpty(options, PERMSETS_SUBPATH, PERMSET_ITEMS);
}
