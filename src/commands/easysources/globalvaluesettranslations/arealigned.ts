import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

import { GVSETTRAN_ITEMS, GVSETTRANS_EXTENSION, GVSETTRANS_ROOT_TAG, GVSETTRANS_SUBPATH } from '../../../utils/constants/constants_globalvaluesettranslations';
import Performance from '../../../utils/performance';
import { areAligned } from '../../../utils/commands/alignmentChecker';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'globalvaluesettranslations_arealigned');

export default class GlobalValueSetTranslationsAreAligned extends SfCommand<unknown> {

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
    mode: Flags.string({
        char: 'm',
        summary: messages.getMessage('modeFlagDescription', ['string']),
        options: ['string', 'logic'],
        default: 'string',
    }),
  };

  public async run(): Promise<unknown> {
        const { flags } = await this.parse(GlobalValueSetTranslationsAreAligned);
    Performance.getInstance().start();

    const result = await globalValueSetTranslationAreAligned(flags);

    Performance.getInstance().end();
    return result;
  }
}

// Export function for programmatic API
export async function globalValueSetTranslationAreAligned(options: any = {}): Promise<any> {
  return await areAligned(options, GVSETTRANS_SUBPATH, GVSETTRANS_EXTENSION, GVSETTRANS_ROOT_TAG, GVSETTRAN_ITEMS);
}