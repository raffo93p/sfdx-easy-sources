import { expect } from 'chai';
import { join } from 'path';
import os from 'os';
import fs from 'fs-extra';

import { permissionsetSplit } from '../../../../src/commands/easysources/permissionsets/split.js';
import { permissionsetMinify } from '../../../../src/commands/easysources/permissionsets/minify.js';
import { permissionsetMerge } from '../../../../src/commands/easysources/permissionsets/merge.js';

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

describe('easysources minify removes the csv files it empties', function () {
    this.timeout(0);

    let tmp: string;
    let permsetDir: string;
    const options = () => ({ 'sf-xml': tmp, 'es-csv': tmp, sort: 'true' });

    beforeEach(() => {
        tmp = fs.mkdtempSync(join(os.tmpdir(), 'minify-'));
        permsetDir = join(tmp, 'permissionsets');
        fs.mkdirSync(permsetDir, { recursive: true });
        fs.writeFileSync(join(permsetDir, 'MyPermSet.permissionset-meta.xml'),
            `<?xml version="1.0" encoding="UTF-8"?>\n<PermissionSet ${NS}>\n`
            + '    <classAccesses>\n        <apexClass>MyClass</apexClass>\n        <enabled>true</enabled>\n    </classAccesses>\n'
            + '    <userPermissions>\n        <enabled>false</enabled>\n        <name>ViewSetup</name>\n    </userPermissions>\n'
            + '    <label>My perm set</label>\n</PermissionSet>\n');
    });

    afterEach(() => {
        fs.removeSync(tmp);
    });

    it('a single split/minify/merge gives the same csv files and xml of a second run', async () => {
        const csvDir = join(permsetDir, 'MyPermSet');

        await permissionsetSplit(options());
        await permissionsetMinify(options());
        await permissionsetMerge(options());

        const xmlAfterFirstRun = fs.readFileSync(join(permsetDir, 'MyPermSet.permissionset-meta.xml'), 'utf8');
        const csvAfterFirstRun = fs.readdirSync(csvDir).sort();

        expect(csvAfterFirstRun).to.not.include('MyPermSet-userPermissions.csv');
        expect(csvAfterFirstRun).to.include('MyPermSet-classAccesses.csv');
        expect(xmlAfterFirstRun).to.not.contain('userPermissions');

        await permissionsetSplit(options());
        await permissionsetMinify(options());
        await permissionsetMerge(options());

        expect(fs.readdirSync(csvDir).sort()).to.deep.equal(csvAfterFirstRun);
        expect(fs.readFileSync(join(permsetDir, 'MyPermSet.permissionset-meta.xml'), 'utf8')).to.equal(xmlAfterFirstRun);
    });
});
