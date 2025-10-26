import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { APPLICATION_ITEMS, APPLICATIONS_EXTENSION, APPLICATIONS_ROOT_TAG, APPLICATIONS_SUBPATH } from '../../../utils/constants/constants_applications';
import Performance from '../../../utils/performance';
import { areAligned } from '../../../utils/commands/alignmentChecker';
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH } from '../../../utils/constants/constants';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-easy-sources', 'applications_arealigned');

export default class ApplicationsAreAligned extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = messages.getMessage('examples').split(os.EOL);

  public static args = [{ name: 'file' }];

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

    const result = await applicationAreAligned(this.flags);

    Performance.getInstance().end();
    return result;
  }
}

// Export function for programmatic API
export async function applicationAreAligned(options: any = {}): Promise<AnyJson> {
  return await areAligned(options, APPLICATIONS_SUBPATH, APPLICATIONS_EXTENSION, APPLICATIONS_ROOT_TAG, APPLICATION_ITEMS);
}