import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { LABELS_DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants_labels';
import { areFilesEqual } from '../../../../src/utils/filesUtils';

const fs = require('fs-extra');

const sourceFolder = LABELS_DEFAULT_SFXML_PATH;
const csvFolder = join(sourceFolder, 'CustomLabels');

const resourcesFolder = '../test/resources/labels';

describe('easysources:labels ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.mkdirSync(sourceFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder,'myLabels.labels-meta.xml'), join(sourceFolder, 'CustomLabels.labels-meta.xml'));
        })
        .command(['easysources:labels:split'])
        .it('runs easysources:labels:split', async (ctx) => {

            expect(fs.existsSync(csvFolder)).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myLabels-part.xml'), join(csvFolder, 'CustomLabels-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'myLabels_split-labels.csv'), join(csvFolder, 'CustomLabels-labels.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:labels:merge'])
        .it('runs easysources:labels:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myLabels_merge1.labels-meta.xml'), join(sourceFolder, 'CustomLabels.labels-meta.xml'))).to.be.true;
        });

    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myLabels_upsert.labels-meta.xml'), join(sourceFolder, 'CustomLabels.labels-meta.xml'));
        })
        .command(['easysources:labels:upsert'])
        .it('runs easysources:labels:upsert', async (ctx) => {
                
                expect(await areFilesEqual(join(resourcesFolder, 'myLabels_upsert-labels.csv'), join(csvFolder, 'CustomLabels-labels.csv'))).to.be.true;
            }
        );

    test
        .stdout()
        .command(['easysources:labels:merge'])
        .it('runs easysources:labels:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myLabels_merge2.labels-meta.xml'), join(sourceFolder, 'CustomLabels.labels-meta.xml'))).to.be.true;
        });
        
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myLabels_updkeypre-labels.csv'), join(csvFolder, 'CustomLabels-labels.csv'));
        })
        .command(['easysources:labels:updatekey'])
        .it('runs easysources:labels:updatekey',async (ctx) => {
            expect(await areFilesEqual(join(resourcesFolder, 'myLabels_updkeypost-labels.csv'), join(csvFolder, 'CustomLabels-labels.csv'))).to.be.true;
        });
});

