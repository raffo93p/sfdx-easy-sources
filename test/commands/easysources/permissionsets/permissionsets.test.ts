import { expect, test } from '@salesforce/command/lib/test';

import { join } from 'path';
import { PERMSETS_DEFAULT_SFXML_PATH } from '../../../../src/utils/constants/constants_permissionsets';
import { areFilesEqual } from '../../../../src/utils/filesUtils';

const fs = require('fs-extra');

const sourceFolder = PERMSETS_DEFAULT_SFXML_PATH;
const csvFolder = join(sourceFolder, 'MyPermSet');

const resourcesFolder = '../test/resources/permissionsets';

describe('easysources:permissionsets ', function () {
    this.timeout(0);

    test
        .stdout()
        .do(() => {
            fs.mkdirSync(sourceFolder, { recursive: true } );
            fs.copySync(join(resourcesFolder,'myPermSet.permissionset-meta.xml'), join(sourceFolder, 'MyPermSet.permissionset-meta.xml'));
        })
        .command(['easysources:permissionsets:split'])
        .it('runs easysources:permissionsets:split', async (ctx) => {
            
            expect(fs.existsSync(csvFolder)).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-part.xml'), join(csvFolder, 'MyPermSet-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-applicationVisibilities.csv'), join(csvFolder, 'MyPermSet-applicationVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-classAccesses.csv'), join(csvFolder, 'MyPermSet-classAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-customMetadataTypeAccesses.csv'), join(csvFolder, 'MyPermSet-customMetadataTypeAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-customSettingAccesses.csv'), join(csvFolder, 'MyPermSet-customSettingAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-fieldPermissions.csv'), join(csvFolder, 'MyPermSet-fieldPermissions.csv'))).to.be.true;
            // expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-layoutAssignments.csv'), join(csvFolder, 'MyPermSet-layoutAssignments.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-objectPermissions.csv'), join(csvFolder, 'MyPermSet-objectPermissions.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-pageAccesses.csv'), join(csvFolder, 'MyPermSet-pageAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-recordTypeVisibilities.csv'), join(csvFolder, 'MyPermSet-recordTypeVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-tabSettings.csv'), join(csvFolder, 'MyPermSet-tabSettings.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvsplit', 'myPermSet-userPermissions.csv'), join(csvFolder, 'MyPermSet-userPermissions.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:permissionsets:merge'])
        .it('runs easysources:permissionsets:merge (1)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myPermSet_merge1.permissionset-meta.xml'), join(sourceFolder, 'MyPermSet.permissionset-meta.xml'))).to.be.true;
        });

        
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myPermSet_upsert.permissionset-meta.xml'), join(sourceFolder, 'MyPermSet.permissionset-meta.xml'));
        })
        .command(['easysources:permissionsets:upsert'])
        .it('runs easysources:permissionsets:upsert', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-part.xml'), join(csvFolder, 'MyPermSet-part.xml'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-applicationVisibilities.csv'), join(csvFolder, 'MyPermSet-applicationVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-classAccesses.csv'), join(csvFolder, 'MyPermSet-classAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-customMetadataTypeAccesses.csv'), join(csvFolder, 'MyPermSet-customMetadataTypeAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-customSettingAccesses.csv'), join(csvFolder, 'MyPermSet-customSettingAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-fieldPermissions.csv'), join(csvFolder, 'MyPermSet-fieldPermissions.csv'))).to.be.true;
            // expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-layoutAssignments.csv'), join(csvFolder, 'MyPermSet-layoutAssignments.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-objectPermissions.csv'), join(csvFolder, 'MyPermSet-objectPermissions.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-pageAccesses.csv'), join(csvFolder, 'MyPermSet-pageAccesses.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-recordTypeVisibilities.csv'), join(csvFolder, 'MyPermSet-recordTypeVisibilities.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-tabSettings.csv'), join(csvFolder, 'MyPermSet-tabSettings.csv'))).to.be.true;
            expect(await areFilesEqual(join(resourcesFolder, 'csvupsert', 'myPermSet-userPermissions.csv'), join(csvFolder, 'MyPermSet-userPermissions.csv'))).to.be.true;            }
        );

    test
        .stdout()
        .command(['easysources:permissionsets:merge'])
        .it('runs easysources:permissionsets:merge (2)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myPermSet_merge2.permissionset-meta.xml'), join(sourceFolder, 'MyPermSet.permissionset-meta.xml'))).to.be.true;
        });
        
    test
        .stdout()
        .do(() => {
            fs.copySync(join(resourcesFolder,'myPermSet_updkeypre-recordTypeVisibilities.csv'), join(csvFolder, 'MyPermSet-recordTypeVisibilities.csv'));
        })
        .command(['easysources:permissionsets:updatekey'])
        .it('runs easysources:permissionsets:updatekey',async (ctx) => {
            expect(await areFilesEqual(join(resourcesFolder, 'myPermSet_updkeypost-recordTypeVisibilities.csv'), join(csvFolder, 'MyPermSet-recordTypeVisibilities.csv'))).to.be.true;
        });
    
    test
        .stdout()
        .command(['easysources:permissionsets:delete', '-t', 'classAccesses', '-k', 'Class C'])
        .it('runs easysources:permissionsets:delete -t "classAccesses" -k "Class C"', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'csvdelete', 'myPermSet-classAccesses.csv'), join(csvFolder, 'MyPermSet-classAccesses.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:permissionsets:delete', '-t', 'fieldPermissions', '-k', 'Object_B__c.Field_A__c'])
        .it('runs easysources:permissionsets:delete -t "fieldPermissions" -k "Object_B__c.Field_A__c"', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'csvdelete', 'myPermSet-fieldPermissions.csv'), join(csvFolder, 'MyPermSet-fieldPermissions.csv'))).to.be.true;
        });

    test
        .stdout()
        .command(['easysources:permissionsets:merge'])
        .it('runs easysources:permissionsets:merge (3)', async (ctx) => {
                
            expect(await areFilesEqual(join(resourcesFolder, 'myPermSet_merge3.permissionset-meta.xml'), join(sourceFolder, 'MyPermSet.permissionset-meta.xml'))).to.be.true;
        });
});

