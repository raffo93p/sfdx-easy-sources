import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { PROFILES_DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants_profiles';
import { areFilesEqual } from '../../../../src/utils/filesUtils';

const fs = require('fs-extra');

const sourceFolder = PROFILES_DEFAULT_SFXML_PATH;
const csvFolder = join(sourceFolder, 'MyProfile');

const resourcesFolder = '../test/resources/profiles';

describe('easysources:profiles ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.mkdirSync(sourceFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder,'myProfile.profile-meta.xml'), join(sourceFolder, 'MyProfile.profile-meta.xml'));
        })
        .command(['easysources:profiles:split'])
        .it('runs easysources:profiles:split', async (ctx) => {

            expect(fs.existsSync(csvFolder)).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-part.xml'), join(csvFolder, 'MyProfile-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-applicationVisibilities.csv'), join(csvFolder, 'MyProfile-applicationVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-classAccesses.csv'), join(csvFolder, 'MyProfile-classAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-customMetadataTypeAccesses.csv'), join(csvFolder, 'MyProfile-customMetadataTypeAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-customSettingAccesses.csv'), join(csvFolder, 'MyProfile-customSettingAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-fieldPermissions.csv'), join(csvFolder, 'MyProfile-fieldPermissions.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-layoutAssignments.csv'), join(csvFolder, 'MyProfile-layoutAssignments.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-objectPermissions.csv'), join(csvFolder, 'MyProfile-objectPermissions.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-pageAccesses.csv'), join(csvFolder, 'MyProfile-pageAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-recordTypeVisibilities.csv'), join(csvFolder, 'MyProfile-recordTypeVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-tabVisibilities.csv'), join(csvFolder, 'MyProfile-tabVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myProfile-userPermissions.csv'), join(csvFolder, 'MyProfile-userPermissions.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:profiles:merge'])
        .it('runs easysources:profiles:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myProfile_merge1.profile-meta.xml'), join(sourceFolder, 'MyProfile.profile-meta.xml'))).to.be.true;
        });

        
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myProfile_upsert.profile-meta.xml'), join(sourceFolder, 'MyProfile.profile-meta.xml'));
        })
        .command(['easysources:profiles:upsert'])
        .it('runs easysources:profiles:upsert', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-part.xml'), join(csvFolder, 'MyProfile-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-applicationVisibilities.csv'), join(csvFolder, 'MyProfile-applicationVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-classAccesses.csv'), join(csvFolder, 'MyProfile-classAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-customMetadataTypeAccesses.csv'), join(csvFolder, 'MyProfile-customMetadataTypeAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-customSettingAccesses.csv'), join(csvFolder, 'MyProfile-customSettingAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-fieldPermissions.csv'), join(csvFolder, 'MyProfile-fieldPermissions.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-layoutAssignments.csv'), join(csvFolder, 'MyProfile-layoutAssignments.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-objectPermissions.csv'), join(csvFolder, 'MyProfile-objectPermissions.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-pageAccesses.csv'), join(csvFolder, 'MyProfile-pageAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-recordTypeVisibilities.csv'), join(csvFolder, 'MyProfile-recordTypeVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-tabVisibilities.csv'), join(csvFolder, 'MyProfile-tabVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myProfile-userPermissions.csv'), join(csvFolder, 'MyProfile-userPermissions.csv'))).to.be.true;            }
        );

    test
        .stdout()
        .command(['easysources:profiles:merge'])
        .it('runs easysources:profiles:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myProfile_merge2.profile-meta.xml'), join(sourceFolder, 'MyProfile.profile-meta.xml'))).to.be.true;
        });
        
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myProfile_updkeypre-layoutAssignments.csv'), join(csvFolder, 'MyProfile-layoutAssignments.csv'));
        })
        .command(['easysources:profiles:updatekey'])
        .it('runs easysources:profiles:updatekey',async (ctx) => {
            expect(await areFilesEqual(join(resourcesFolder, 'myProfile_updkeypost-layoutAssignments.csv'), join(csvFolder, 'MyProfile-layoutAssignments.csv'))).to.be.true;
        });
    
    test
        .stdout()
        .command(['easysources:profiles:delete', '-t', 'classAccesses', '-k', 'Class C'])
        .it('runs easysources:profiles:delete -t "classAccesses" -k "Class C"', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'csvdelete', 'myProfile-classAccesses.csv'), join(csvFolder, 'MyProfile-classAccesses.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:profiles:delete', '-t', 'fieldPermissions', '-k', 'Object_B__c.Field_A__c'])
        .it('runs easysources:profiles:delete -t "fieldPermissions" -k "Object_B__c.Field_A__c"', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'csvdelete', 'myProfile-fieldPermissions.csv'), join(csvFolder, 'MyProfile-fieldPermissions.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:profiles:merge'])
        .it('runs easysources:profiles:merge (3)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myProfile_merge3.profile-meta.xml'), join(sourceFolder, 'MyProfile.profile-meta.xml'))).to.be.true;
        });
});

