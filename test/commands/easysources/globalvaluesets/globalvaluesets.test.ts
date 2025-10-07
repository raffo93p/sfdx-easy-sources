import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { GVSETS_DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants_globalvaluesets';
import { areFilesEqual } from '../../../../src/utils/filesUtils';

const fs = require('fs-extra');

const sourceFolder = GVSETS_DEFAULT_SFXML_PATH;
const csvFolder = join(sourceFolder, 'MyGVS');

const resourcesFolder = '../test/resources/globalvaluesets';

describe('easysources:glovalvaluesets ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.mkdirSync(sourceFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder,'myGVS.globalValueSet-meta.xml'), join(sourceFolder, 'MyGVS.globalValueSet-meta.xml'));
        })
        .command(['easysources:globalvaluesets:split'])
        .it('runs easysources:globalvaluesets:split', async (ctx) => {

            expect(fs.existsSync(csvFolder)).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myGVS-part.xml'), join(csvFolder, 'MyGVS-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myGVS_split-customValue.csv'), join(csvFolder, 'MyGVS-customValue.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:globalvaluesets:merge'])
        .it('runs easysources:globalvaluesets:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myGVS_merge1.globalValueSet-meta.xml'), join(sourceFolder, 'MyGVS.globalValueSet-meta.xml'))).to.be.true;
        });

    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myGVS_upsert.globalValueSet-meta.xml'), join(sourceFolder, 'MyGVS.globalValueSet-meta.xml'));
        })
        .command(['easysources:globalvaluesets:upsert'])
        .it('runs easysources:globalvaluesets:upsert', async (ctx) => {
                
                expect(await areFilesEqual(join(resourcesFolder, 'myGVS_upsert-customValue.csv'), join(csvFolder, 'MyGVS-customValue.csv'))).to.be.true;
            }
        );

    test
        .stdout()
        .command(['easysources:globalvaluesets:merge'])
        .it('runs easysources:globalvaluesets:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myGVS_merge2.globalValueSet-meta.xml'), join(sourceFolder, 'MyGVS.globalValueSet-meta.xml'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:globalvaluesets:arealigned', '-i', 'MyGVS', '--mode', 'logic'])
        .it('runs easysources:globalvaluesets:arealigned with logic mode', async (ctx) => {
            expect(ctx.stdout).to.contain('1 aligned');
        });

    test
        .stdout()
        .command(['easysources:globalvaluesets:arealigned', '-i', 'MyGVS', '--mode', 'string'])
        .it('runs easysources:globalvaluesets:arealigned with string mode', async (ctx) => {
            expect(ctx.stdout).to.contain('1 aligned');
        });
    
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myGVS_updkeypre-customValue.csv'), join(csvFolder, 'MyGVS-customValue.csv'));
        })
        .command(['easysources:globalvaluesets:updatekey'])
        .it('runs easysources:globalvaluesets:updatekey',async (ctx) => {
            expect(await areFilesEqual(join(resourcesFolder, 'myGVS_updkeypost-customValue.csv'), join(csvFolder, 'MyGVS-customValue.csv'))).to.be.true;
        });
});

