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
import { PERMSETS_SUBPATH, PERMSET_ITEMS } from "../../../utils/constants/constants_permissionsets";
import { deleteFromCsv } from '../../../utils/commands/deleter';
import { DEFAULT_ESCSV_PATH } from '../../../utils/constants/constants';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'permissionsets_delete');

export default class Delete extends SfdxCommand {
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
        tagid: flags.string({
            char: 'k',
            description: messages.getMessage('tagidFlagDescription'),
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

        var result = await permissionsetDelete(this.flags);

        Performance.getInstance().end();

        return result;
    }
}

/**
 * Permission set-specific delete function that encapsulates all permission set constants
 * This function can be used programmatically without needing to pass permission set constants
 * 
 * @param options - Permission set delete options (paths will be resolved automatically if not provided)
 * @returns Promise with delete operation result
 */
export async function permissionsetDelete(options: any): Promise<any> {
    return deleteFromCsv(options, PERMSETS_SUBPATH, PERMSET_ITEMS);
}