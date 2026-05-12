import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

import { LABEL_ITEMS, LABELS_EXTENSION, LABELS_ROOT_TAG, LABELS_SUBPATH } from '../../../utils/constants/constants_labels.js';
import Performance from '../../../utils/performance.js';
import { areAligned } from '../../../utils/commands/alignmentChecker.js';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants.js';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'labels_arealigned');

export default class LabelsAreAligned extends SfCommand<unknown> {

  public static readonly summary = messages.getMessage('commandDescription');

  public static readonly examples = messages.getMessage('examples').split(os.EOL);


  public static readonly flags = {
    // flag with a value (-n, --name=VALUE)
    "sf-xml": Flags.string({
        char: 'x',
        summary: messages.getMessage('sfXmlFlagDescription', [DEFAULT_SFXML_PATH]),
    }),
    "es-csv": Flags.string({
        char: 'c',
        summary: messages.getMessage('esCsvFlagDescription', [DEFAULT_ESCSV_PATH]),
    }),
    sort: Flags.string({
        char: 'S',
        summary: messages.getMessage('sortFlagDescription', ['true']),
        options: ['true', 'false'],
        default: 'true',
    }),
    mode: Flags.string({
        char: 'm',
        summary: messages.getMessage('modeFlagDescription', ['string']),
        options: ['string', 'logic'],
        default: 'string',
    }),
  };

  public async run(): Promise<unknown> {
        const { flags } = await this.parse(LabelsAreAligned);
    Performance.getInstance().start();

    const result = await labelAreAligned(flags);

    Performance.getInstance().end();
    return result;
  }
}

/**
 * Label-specific are aligned function that encapsulates all label constants
 * This function can be used programmatically without needing to pass label constants
 * 
 * @param options - Label are aligned options (paths will be resolved automatically if not provided)
 * @returns Promise with are aligned operation result
 */
export async function labelAreAligned(options: any): Promise<any> {
    return await areAligned(options, LABELS_SUBPATH, LABELS_EXTENSION, LABELS_ROOT_TAG, LABEL_ITEMS);
}