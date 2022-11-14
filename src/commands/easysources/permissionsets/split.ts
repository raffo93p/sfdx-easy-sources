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
import { PERMSET_ITEMS, PERMSETS_EXTENSION, PERMSETS_ROOT_TAG } from '../../../utils/constants/constants_permissionsets';
import Performance from '../../../utils/performance';
import { PERMSETS_DEFAULT_PATH } from "../../../utils/constants/constants_permissionsets";
import { split } from '../../../utils/commands/splitter';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_split');

export default class Split extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);


    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        dir: flags.string({
            char: 'd',
            description: messages.getMessage('dirFlagDescription', [PERMSETS_DEFAULT_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        output: flags.string({
            char: 'o',
            description: messages.getMessage('outputFlagDescription', [PERMSETS_DEFAULT_PATH]),
        }),
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        var result = await split(this.flags, PERMSETS_DEFAULT_PATH, PERMSETS_EXTENSION, PERMSETS_ROOT_TAG, PERMSET_ITEMS);

        Performance.getInstance().end();
        return result;
    }
}
