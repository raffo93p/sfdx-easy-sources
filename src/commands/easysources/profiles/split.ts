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
import { PROFILE_ITEMS, PROFILES_EXTENSION, PROFILES_ROOT_TAG, PROFILES_SUBPATH } from '../../../utils/constants/constants_profiles';
import Performance from '../../../utils/performance';
//import { split } from '../../../utils/commands/splitter';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';
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
        "sf-xml": flags.string({
            char: 'x',
            description: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
        "es-csv": flags.string({
            char: 'c',
            description: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
        }),
        input: flags.string({
            char: 'i',
            description: messages.getMessage('inputFlagDescription'),
        }),
        sort: flags.enum({
            char: 'S',
            description: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
        ignoreuserperm: flags.enum({
            char: 'u',
            description: messages.getMessage('ignoreuserpermFlagDescription', ['false']),
            options: ['true', 'false'],
            default: 'false',
        }),
    };


    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        var result = await profileSplit(this.flags);

        Performance.getInstance().end();
        return result;
    }
}

/**
 * Profile-specific split function that encapsulates all profile constants
 * This function can be used programmatically without needing to pass profile constants
 * 
 * @param options - Profile split options (paths will be resolved automatically if not provided)
 * @returns Promise with split operation result
 */
export async function profileSplit(options: any): Promise<any> {
    return await split(options, PROFILES_SUBPATH, PROFILES_EXTENSION, PROFILES_ROOT_TAG, PROFILE_ITEMS);
}
