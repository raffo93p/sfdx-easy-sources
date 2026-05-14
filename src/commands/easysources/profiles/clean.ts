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
import { PROFILE_ITEMS, PROFILES_SUBPATH, PROFILE_KEY_TYPE } from "../../../utils/constants/constants_profiles.js";
import { DEFAULT_ESCSV_PATH, DEFAULT_LOG_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants.js';
import { clean } from '../../../utils/commands/cleaner.js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages('sfdx-easy-sources', 'profiles_clean');

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
        orgname: Flags.string({
            char: 'u',
            summary: messages.getMessage('orgFlagDescription', [""]),
            required: false
        }),
        input: Flags.string({
            char: 'i',
            summary: messages.getMessage('inputFlagDescription'),
        }),
        "log-dir": Flags.string({
            char: 'l',
            summary: messages.getMessage('logdirFlagDescription', [DEFAULT_LOG_PATH]),
        }),
        mode: Flags.string({
            char: 'm',
            summary: messages.getMessage('modeFlagDescription', ['clean']),
            options: ['clean', 'log'],
            default: 'clean',
        }),
        target: Flags.string({
            char: 'g',
            summary: messages.getMessage('targetFlagDescription', ['both']),
            options: ['org', 'local', 'both'],
            default: 'both',
        }),
        'include-standard-fields': Flags.boolean({
            char: 'F',
            summary: messages.getMessage('includeStandardFieldsFlagDescription', ['false']),
            default: false,
        }),
        'include-standard-tabs': Flags.boolean({
            char: 'T',
            summary: messages.getMessage('includeStandardTabsFlagDescription', ['false']),
            default: false,
        }),
        'skip-types': Flags.string({
            char: 't',
            summary: messages.getMessage('skipTypesFlagDescription', ['Settings']),
            multiple: true,
            default: ['Settings'],
        }),
        'include-types': Flags.string({
            char: 'd',
            summary: messages.getMessage('includeTypesFlagDescription', ['']),
            multiple: true,
            default: [],
        }),
        'skip-manifest-creation': Flags.boolean({
            char: 'M',
            summary: messages.getMessage('skipManifestCreationFlagDescription', ['false']),
            default: false,
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
        const result = await profileClean(flags);
        Performance.getInstance().end();
        return result;
    }
}

export async function profileClean(options: any): Promise<any> {
    return clean(options, PROFILES_SUBPATH, PROFILE_ITEMS, PROFILE_KEY_TYPE, 'profiles-clean.log');
}
