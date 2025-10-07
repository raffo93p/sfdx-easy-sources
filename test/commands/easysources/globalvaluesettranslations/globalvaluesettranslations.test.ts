import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { GVSETTRANS_DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants_globalvaluesettranslations';
import { areFilesEqual } from '../../../../src/utils/filesUtils';

const fs = require('fs-extra');

const sourceFolder = GVSETTRANS_DEFAULT_SFXML_PATH;
const csvFolder = join(sourceFolder, 'MyGVST-en_US');

const resourcesFolder = '../test/resources/globalvaluesettranslations';

describe('easysources:glovalvaluesetranslations ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.mkdirSync(sourceFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder,'myGVST-en_US.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'MyGVST-en_US.globalValueSetTranslation-meta.xml'));
        })
        .command(['easysources:globalvaluesettranslations:split'])
        .it('runs easysources:globalvaluesettranslations:split', async (ctx) => {

            expect(fs.existsSync(csvFolder)).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myGVST-en_US-part.xml'), join(csvFolder, 'MyGVST-en_US-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myGVST-en_US_split-valueTranslation.csv'), join(csvFolder, 'MyGVST-en_US-valueTranslation.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:globalvaluesettranslations:merge'])
        .it('runs easysources:globalvaluesettranslations:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myGVST-en_US_merge1.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'MyGVST-en_US.globalValueSetTranslation-meta.xml'))).to.be.true;
        });

    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myGVST-en_US_upsert.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'MyGVST-en_US.globalValueSetTranslation-meta.xml'));
        })
        .command(['easysources:globalvaluesettranslations:upsert'])
        .it('runs easysources:globalvaluesettranslations:upsert', async (ctx) => {
                
                expect(await areFilesEqual(join(resourcesFolder, 'myGVST-en_US_upsert-valueTranslation.csv'), join(csvFolder, 'MyGVST-en_US-valueTranslation.csv'))).to.be.true;
            }
        );

    test
        .stdout()
        .command(['easysources:globalvaluesettranslations:merge'])
        .it('runs easysources:globalvaluesettranslations:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myGVST-en_US_merge2.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'MyGVST-en_US.globalValueSetTranslation-meta.xml'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:globalvaluesettranslations:arealigned', '-i', 'MyGVST-en_US', '--mode', 'logic'])
        .it('runs easysources:globalvaluesettranslations:arealigned with logic mode', async (ctx) => {
            expect(ctx.stdout).to.contain('1 aligned');
        });

    test
        .stdout()
        .command(['easysources:globalvaluesettranslations:arealigned', '-i', 'MyGVST-en_US', '--mode', 'string'])
        .it('runs easysources:globalvaluesettranslations:arealigned with string mode', async (ctx) => {
            expect(ctx.stdout).to.contain('1 aligned');
        });

    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myGVST-en_US_updkeypre-valueTranslation.csv'), join(csvFolder, 'MyGVST-en_US-valueTranslation.csv'));
        })
        .command(['easysources:globalvaluesettranslations:updatekey'])
        .it('runs easysources:globalvaluesettranslations:updatekey',async (ctx) => {
            expect(await areFilesEqual(join(resourcesFolder, 'myGVST-en_US_updkeypost-valueTranslation.csv'), join(csvFolder, 'MyGVST-en_US-valueTranslation.csv'))).to.be.true;
        });
});

