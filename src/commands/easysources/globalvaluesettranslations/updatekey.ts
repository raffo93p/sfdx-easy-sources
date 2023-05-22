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
import { updatekey } from "../../../utils/commands/keyupdater";
import { GVSETTRANS_SUBPATH, GVSETTRAN_ITEMS } from "../../../utils/constants/constants_globalvaluesettranslations"
import { DEFAULT_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'globalvaluesettranslations_updatekey');

export default class UpdateKey extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);


    protected static flagsConfig = {
        // flag with a value (-n, --name=VALUE)
        dir: flags.string({
            char: 'd',
            description: messages.getMessage('dirFlagDescription', [DEFAULT_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        sort: flags.enum({
            char: 'S',
            description: messages.getMessage('sortFlagDescription', ['false']),
            options: ['true', 'false'],
            default: 'false',
        }),
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        var result = await updatekey(this.flags, GVSETTRANS_SUBPATH, GVSETTRAN_ITEMS);

        Performance.getInstance().end();
        return result;
    }
}
