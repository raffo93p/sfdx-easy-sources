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
import { bulkExecuteCommands } from '../../../utils/commands/utils.js';



// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'all_minify');

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
        sequencial: Flags.boolean({
            char: 's',
            summary: messages.getMessage('sequencialFlagDescription', ["false"]),
            default: false
        }),
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(Merge);
        Performance.getInstance().start();

        const result = await allMetaMinify(flags);
        
        Performance.getInstance().end();

        return result;
    }
}

// Export function for programmatic API  
export async function allMetaMinify(options: any = {}): Promise<any> {
    try {
        await bulkExecuteCommands(options, 'minify', options.sequencial);
        return { result: 'OK' };
    } catch (error) {
        return { 
            result: 'KO', 
            error: error.message || 'Unknown error occurred' 
        };
    }
}