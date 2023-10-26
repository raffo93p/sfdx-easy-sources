import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { areFilesEqual } from '../../../../src/utils/filesUtils';
import { DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants';

const fs = require('fs-extra');

const sourceFolder = DEFAULT_SFXML_PATH;
const resourcesFolder = '../test/resources';

describe('easysources:allmeta ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.removeSync(sourceFolder);
            fs.mkdirSync(sourceFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder, 'applications', 'myApplication.app-meta.xml'), join(sourceFolder, 'applications', 'MyApplication.app-meta.xml'));
            fs.copySync(join(resourcesFolder, 'globalvaluesets', 'myGVS.globalValueSet-meta.xml'), join(sourceFolder, 'globalValueSets', 'MyGVS.globalValueSet-meta.xml'));
            fs.copySync(join(resourcesFolder, 'globalvaluesettranslations', 'myGVST-en_US.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'globalValueSetTranslations', 'MyGVST-en_US.globalValueSetTranslation-meta.xml'));
            fs.copySync(join(resourcesFolder, 'labels', 'myLabels.labels-meta.xml'), join(sourceFolder, 'labels', 'CustomLabels.labels-meta.xml'));
            fs.copySync(join(resourcesFolder, 'permissionsets', 'myPermSet.permissionset-meta.xml'), join(sourceFolder, 'permissionSets', 'MyPermSet.permissionset-meta.xml'));
            fs.copySync(join(resourcesFolder, 'profiles', 'myProfile.profile-meta.xml'), join(sourceFolder, 'profiles', 'MyProfile.profile-meta.xml'));
            fs.copySync(join(resourcesFolder, 'recordtypes', 'myRecordType.recordType-meta.xml'), join(sourceFolder, 'objects', 'testObj', 'recordTypes', 'MyRecordType.recordType-meta.xml'));


        })
        .command(['easysources:allmeta:split'])
        .it('runs easysources:allmeta:split', async (ctx) => {
            expect(await fs.existsSync(join(sourceFolder, 'applications', 'MyApplication'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'globalValueSets', 'MyGVS'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'globalValueSetTranslations', 'MyGVST-en_US'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'labels', 'CustomLabels'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'permissionsets', 'MyPermSet'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'profiles', 'MyProfile'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'objects', 'testObj', 'recordTypes', 'MyRecordType'))).to.be.true;

            // TODO aggiungere test su file
        });

    test
        .stdout()
        .command(['easysources:allmeta:merge'])
        .it('runs easysources:allmeta:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'applications', 'myApplication_merge1.app-meta.xml'), join(sourceFolder, 'applications', 'MyApplication.app-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'globalvaluesets', 'myGVS_merge1.globalValueSet-meta.xml'), join(sourceFolder, 'globalValueSets','MyGVS.globalValueSet-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'globalvaluesettranslations', 'myGVST-en_US_merge1.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'globalValueSetTranslations', 'MyGVST-en_US.globalValueSetTranslation-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'labels', 'myLabels_merge1.labels-meta.xml'), join(sourceFolder, 'labels', 'CustomLabels.labels-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'permissionsets', 'myPermSet_merge1.permissionset-meta.xml'), join(sourceFolder, 'permissionSets', 'MyPermSet.permissionset-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'profiles', 'myProfile_merge1.profile-meta.xml'), join(sourceFolder, 'profiles', 'MyProfile.profile-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'recordtypes', 'myRecordType_merge1.recordType-meta.xml'), join(sourceFolder, 'objects', 'testObj', 'recordTypes', 'MyRecordType.recordType-meta.xml'))).to.be.true;

        });

    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder, 'applications', 'myApplication_upsert.app-meta.xml'), join(sourceFolder, 'applications', 'MyApplication.app-meta.xml'));
            fs.copySync(join(resourcesFolder, 'globalvaluesets', 'myGVS_upsert.globalValueSet-meta.xml'), join(sourceFolder, 'globalValueSets', 'MyGVS.globalValueSet-meta.xml'));
            fs.copySync(join(resourcesFolder, 'globalvaluesettranslations', 'myGVST-en_US_upsert.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'globalValueSetTranslations', 'MyGVST-en_US.globalValueSetTranslation-meta.xml'));
            fs.copySync(join(resourcesFolder, 'labels', 'myLabels_upsert.labels-meta.xml'), join(sourceFolder, 'labels', 'CustomLabels.labels-meta.xml'));
            fs.copySync(join(resourcesFolder, 'permissionsets', 'myPermSet_upsert.permissionset-meta.xml'), join(sourceFolder, 'permissionSets', 'MyPermSet.permissionset-meta.xml'));
            fs.copySync(join(resourcesFolder, 'profiles', 'myProfile_upsert.profile-meta.xml'), join(sourceFolder, 'profiles', 'MyProfile.profile-meta.xml'));
            fs.copySync(join(resourcesFolder, 'recordtypes', 'myRecordType_upsert.recordType-meta.xml'), join(sourceFolder, 'objects', 'testObj', 'recordTypes', 'MyRecordType.recordType-meta.xml'));        })
        .command(['easysources:allmeta:upsert'])
        .it('runs easysources:allmeta:upsert', async (ctx) => {
                
            // TODO Sistemare con test più specifici
            expect(await fs.existsSync(join(sourceFolder, 'applications', 'MyApplication'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'globalValueSets', 'MyGVS'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'globalValueSetTranslations', 'MyGVST-en_US'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'labels', 'CustomLabels'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'permissionsets', 'MyPermSet'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'profiles', 'MyProfile'))).to.be.true;
            expect(await fs.existsSync(join(sourceFolder, 'objects', 'testObj', 'recordTypes', 'MyRecordType'))).to.be.true;            }
        );

    test
        .stdout()
        .command(['easysources:allmeta:merge'])
        .it('runs easysources:allmeta:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'applications', 'myApplication_merge2.app-meta.xml'), join(sourceFolder, 'applications', 'MyApplication.app-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'globalvaluesets', 'myGVS_merge2.globalValueSet-meta.xml'), join(sourceFolder, 'globalValueSets','MyGVS.globalValueSet-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'globalvaluesettranslations', 'myGVST-en_US_merge2.globalValueSetTranslation-meta.xml'), join(sourceFolder, 'globalValueSetTranslations', 'MyGVST-en_US.globalValueSetTranslation-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'labels', 'myLabels_merge2.labels-meta.xml'), join(sourceFolder, 'labels', 'CustomLabels.labels-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'permissionsets', 'myPermSet_merge2.permissionset-meta.xml'), join(sourceFolder, 'permissionSets', 'MyPermSet.permissionset-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'profiles', 'myProfile_merge2.profile-meta.xml'), join(sourceFolder, 'profiles', 'MyProfile.profile-meta.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'recordtypes', 'myRecordType_merge2.recordType-meta.xml'), join(sourceFolder, 'objects', 'testObj', 'recordTypes', 'MyRecordType.recordType-meta.xml'))).to.be.true;        
        });
});

