/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import fs from 'fs-extra';
import { SETTINGS_PATH } from '../../../utils/constants/constants.js';
import { initSettings } from '../../../utils/localSettings.js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'settings_init');

export default class Init extends SfCommand<unknown> {
    public static readonly summary = messages.getMessage('commandDescription');

    public static readonly examples = messages.getMessage('examples').split(os.EOL);

    public static readonly flags = {
        // flag with a value (-n, --name=VALUE)
        
    };

    public async run(): Promise<unknown> {

        const settings = initSettings();
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 4));
        console.log('Settings file generated at path ' + SETTINGS_PATH);

        return { outputString: 'OK' };
    }
}