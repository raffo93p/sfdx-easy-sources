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
import { PROFILES_SUBPATH, PROFILE_ITEMS } from "../../../utils/constants/constants_profiles";
import { customUpsert } from '../../../utils/commands/customupserter';
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_customupsert');

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

        const result = await profileCustomUpsert(flags);

        Performance.getInstance().end();
        return result;
    }
}

// Export a profile-specific custom upsert function that encapsulates profile constants
export async function profileCustomUpsert(options: any): Promise<any> {
    return customUpsert(options, PROFILES_SUBPATH, PROFILE_ITEMS);
}
