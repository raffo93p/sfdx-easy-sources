import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { APPLICATIONS_DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants_applications';
import { areFilesEqual } from '../../../../src/utils/filesUtils';

const fs = require('fs-extra');

const sourceFolder = APPLICATIONS_DEFAULT_SFXML_PATH;
const csvFolder = join(sourceFolder, 'MyApplication');

const resourcesFolder = '../test/resources/applications';

describe('easysources:applications ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.mkdirSync(sourceFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder,'myApplication.app-meta.xml'), join(sourceFolder, 'MyApplication.app-meta.xml'));
        })
        .command(['easysources:applications:split'])
        .it('runs easysources:applications:split', async (ctx) => {

            expect(fs.existsSync(csvFolder)).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myApplication-part.xml'), join(csvFolder, 'MyApplication-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myApplication_split-profileActionOverrides.csv'), join(csvFolder, 'MyApplication-profileActionOverrides.csv'))).to.be.true;
        });
    test
        .stdout()
        .command(['easysources:applications:merge'])
        .it('runs easysources:applications:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myApplication_merge1.app-meta.xml'), join(sourceFolder, 'MyApplication.app-meta.xml'))).to.be.true;
        });

        test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myApplication_upsert.app-meta.xml'), join(sourceFolder, 'MyApplication.app-meta.xml'));
        })
        .command(['easysources:applications:upsert'])
        .it('runs easysources:applications:upsert', async (ctx) => {
                
                expect(await areFilesEqual(join(resourcesFolder, 'myApplication_upsert-profileActionOverrides.csv'), join(csvFolder, 'MyApplication-profileActionOverrides.csv'))).to.be.true;
            }
        );

    test
        .stdout()
        .command(['easysources:applications:merge'])
        .it('runs easysources:applications:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myApplication_merge2.app-meta.xml'), join(sourceFolder, 'MyApplication.app-meta.xml'))).to.be.true;
        });
        
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myApplication_updkeypre-profileActionOverrides.csv'), join(csvFolder, 'MyApplication-profileActionOverrides.csv'));
        })
        .command(['easysources:applications:updatekey'])
        .it('runs easysources:applications:updatekey',async (ctx) => {
            expect(await areFilesEqual(join(resourcesFolder, 'myApplication_updkeypost-profileActionOverrides.csv'), join(csvFolder, 'MyApplication-profileActionOverrides.csv'))).to.be.true;
        });
});

