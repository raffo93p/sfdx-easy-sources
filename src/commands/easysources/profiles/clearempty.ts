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
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
import { PROFILE_ITEMS, PROFILES_SUBPATH } from '../../../utils/constants/constants_profiles';
import { clearEmpty } from '../../../utils/commands/emptyClearer';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_clearempty');

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
        
        const result = await profileClearEmpty(flags);

        Performance.getInstance().end();
        return result;
    }
}

// Export a profile-specific clearEmpty function that encapsulates profile constants
export async function profileClearEmpty(options: any): Promise<any> {
    return await clearEmpty(options, PROFILES_SUBPATH, PROFILE_ITEMS);
}
