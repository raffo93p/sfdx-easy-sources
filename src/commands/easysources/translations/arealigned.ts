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
import { TRANSLATION_ITEMS, TRANSLATIONS_EXTENSION, TRANSLATIONS_ROOT_TAG, TRANSLATIONS_SUBPATH } from '../../../utils/constants/constants_translations';
import Performance from '../../../utils/performance';
import { areAligned, validateAlignment } from '../../../utils/commands/alignmentChecker';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'translations_arealigned');

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

        let result;
        if (this.flags.mode === 'string') {
            result = await areAligned(this.flags, TRANSLATIONS_SUBPATH, TRANSLATIONS_EXTENSION, TRANSLATIONS_ROOT_TAG, TRANSLATION_ITEMS);
        } else {
            result = await validateAlignment(this.flags, TRANSLATIONS_SUBPATH, TRANSLATIONS_EXTENSION, TRANSLATIONS_ROOT_TAG, TRANSLATION_ITEMS);
        }

        Performance.getInstance().end();
        return result;
    }
}
