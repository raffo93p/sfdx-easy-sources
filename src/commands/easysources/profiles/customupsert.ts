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
import { PROFILES_SUBPATH, PROFILE_ITEMS } from "../../../utils/constants/constants_profiles";
import { customUpsert } from '../../../utils/commands/customupserter';
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_customupsert');

export default class CustomUpsert extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        "es-csv": flags.string({
            char: 'c',
            description: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        type: flags.string({
            char: 't',
            description: messages.getMessage('typeFlagDescription'),
        }),
        content: flags.string({
            char: 'j',
            description: messages.getMessage('contentFlagDescription'),
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

        const result = await profileCustomUpsert(this.flags);

        Performance.getInstance().end();
        return result;
    }
}

// Export a profile-specific custom upsert function that encapsulates profile constants
export async function profileCustomUpsert(options: any): Promise<any> {
    return customUpsert(options, PROFILES_SUBPATH, PROFILE_ITEMS);
}
