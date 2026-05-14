/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

import Performance from '../../../utils/performance.js';
import { TRANSLATION_ITEMS, TRANSLAT_TAG_BOOL, TRANSLATIONS_SUBPATH } from "../../../utils/constants/constants_translations.js";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants.js';
import { minify, nonBlankFilter } from '../../../utils/commands/minifier.js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages('sfdx-easy-sources', 'translations_minify');

export default class Clean extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);

    public static readonly flags = {
        "sf-xml": Flags.string({
            char: 'x',
            summary: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
        }),
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
            summary: messages.getMessage('sortFlagDescription', ['true']),
            options: ['true', 'false'],
            default: 'true',
        }),
    };

    public async run(): Promise<unknown> {
        const { flags } = await this.parse(Clean);
        Performance.getInstance().start();
        const result = await translationMinify(flags);
        Performance.getInstance().end();
        return result;
    }
}

export async function translationMinify(options: any = {}): Promise<any> {
    return minify(options, TRANSLATIONS_SUBPATH, TRANSLATION_ITEMS, TRANSLAT_TAG_BOOL, nonBlankFilter);
}

