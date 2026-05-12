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
import { updatekey } from "../../../utils/commands/keyupdater";
import { GVSETS_SUBPATH, GVSET_ITEMS } from "../../../utils/constants/constants_globalvaluesets"
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'globalvaluesets_updatekey');

export default class UpdateKey extends SfCommand<unknown> {
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
        sort: Flags.string({
            char: 'S',
            summary: messages.getMessage('sortFlagDescription', ['false']),
            options: ['true', 'false'],
            default: 'false',
        }),
    };


    public async run(): Promise<unknown> {
        const { flags } = await this.parse(UpdateKey);
        Performance.getInstance().start();

        var result = await updatekey(flags, GVSETS_SUBPATH, GVSET_ITEMS);

        Performance.getInstance().end();
        return result;
    }
}

// Export function for programmatic API
export async function globalValueSetUpdateKey(options: any = {}): Promise<any> {
    return await updatekey(options, GVSETS_SUBPATH, GVSET_ITEMS);
}
