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
import { upsert } from '../../../utils/commands/upserter';
import { LABELS_ROOT_TAG, LABEL_ITEMS, LABELS_EXTENSION, LABELS_SUBPATH } from "../../../utils/constants/constants_labels";
import { DEFAULT_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_upsert');

export default class Upsert extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);


    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        dir: flags.string({
            char: 'd',
            description: messages.getMessage('dirFlagDescription', [DEFAULT_PATH]),
        }),
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription', [DEFAULT_PATH]),
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

        var result = await upsert(this.flags, LABELS_SUBPATH, LABELS_EXTENSION, LABELS_ROOT_TAG, LABEL_ITEMS);

        Performance.getInstance().end();
        return result;
    }
}