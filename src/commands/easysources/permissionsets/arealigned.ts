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
import { PERMSET_ITEMS, PERMSETS_EXTENSION, PERMSETS_ROOT_TAG, PERMSETS_SUBPATH } from '../../../utils/constants/constants_permissionsets';
import Performance from '../../../utils/performance';
import { areAligned, validateAlignment } from '../../../utils/commands/alignmentChecker';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'permissionsets_arealigned');

export default class AreAligned extends SfdxCommand {
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
        mode: flags.enum({
            char: 'm',
            description: messages.getMessage('modeFlagDescription', ['string']),
            options: ['string', 'logic'],
            default: 'string',
        }),
    };

    public async run(): Promise<AnyJson> {
        Performance.getInstance().start();

        const result = await permissionsetAreAligned(this.flags);

        Performance.getInstance().end();
        return result;
    }
}

/**
 * Permission set-specific are aligned function that encapsulates all permission set constants
 * This function can be used programmatically without needing to pass permission set constants
 * 
 * @param options - Permission set are aligned options (paths will be resolved automatically if not provided)
 * @returns Promise with are aligned operation result
 */
export async function permissionsetAreAligned(options: any): Promise<any> {
    let result;
    if (options.mode === 'string') {
        result = await areAligned(options, PERMSETS_SUBPATH, PERMSETS_EXTENSION, PERMSETS_ROOT_TAG, PERMSET_ITEMS);
    } else {
        result = await validateAlignment(options, PERMSETS_SUBPATH, PERMSETS_EXTENSION, PERMSETS_ROOT_TAG, PERMSET_ITEMS);
    }
    return result;
}