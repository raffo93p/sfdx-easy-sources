import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { RECORDTYPES_DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants_recordtypes';
import { areFilesEqual } from '../../../../src/utils/filesUtils';

const fs = require('fs-extra');

const recordTypeFolder = join(RECORDTYPES_DEFAULT_SFXML_PATH, 'testObj', 'recordTypes');
const csvFolder = join(recordTypeFolder, 'myRecordType');

const resourcesFolder = '../test/resources/recordtypes';

describe('easysources:recordtypes ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.mkdirSync(recordTypeFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder,'myRecordType.recordType-meta.xml'), join(recordTypeFolder, 'myRecordType.recordType-meta.xml'));
        })
        .command(['easysources:recordtypes:split'])
        .it('runs easysources:recordtypes:split', async (ctx) => {

            expect(fs.existsSync(csvFolder)).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myRecordType-part.xml'), join(csvFolder, 'myRecordType-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myRecordType_split-picklistValues.csv'), join(csvFolder, 'myRecordType-picklistValues.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:recordtypes:merge'])
        .it('runs easysources:recordtypes:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myRecordType_merge1.recordType-meta.xml'), join(recordTypeFolder, 'myRecordType.recordType-meta.xml'))).to.be.true;
        });

    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myRecordType_upsert.recordType-meta.xml'), join(recordTypeFolder, 'myRecordType.recordType-meta.xml'));
        })
        .command(['easysources:recordtypes:upsert'])
        .it('runs easysources:recordtypes:upsert', async (ctx) => {
                
                expect(await areFilesEqual(join(resourcesFolder, 'myRecordType_upsert-picklistValues.csv'), join(csvFolder, 'myRecordType-picklistValues.csv'))).to.be.true;
            }
        );

    test
        .stdout()
        .command(['easysources:recordtypes:merge'])
        .it('runs easysources:recordtypes:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myRecordType_merge2.recordType-meta.xml'), join(recordTypeFolder, 'myRecordType.recordType-meta.xml'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:recordtypes:delete', '-p', 'Picklist A', '-k', 'Entry A 2'])
        .it('runs easysources:recordtypes:delete -p "Picklist A" -k "Entry A 2"', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myRecordType_delete-picklistValues.csv'), join(csvFolder, 'myRecordType-picklistValues.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:recordtypes:merge'])
        .it('runs easysources:recordtypes:merge (3)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myRecordType_merge3.recordType-meta.xml'), join(recordTypeFolder, 'myRecordType.recordType-meta.xml'))).to.be.true;
        });
        
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myRecordType_updkeypre-picklistValues.csv'), join(csvFolder, 'myRecordType-picklistValues.csv'));
        })
        .command(['easysources:recordtypes:updatekey'])
        .it('runs easysources:recordtypes:updatekey',async (ctx) => {
            expect(await areFilesEqual(join(resourcesFolder, 'myRecordType_updkeypost-picklistValues.csv'), join(csvFolder, 'myRecordType-picklistValues.csv'))).to.be.true;
        });
});

